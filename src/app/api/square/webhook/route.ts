import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const notificationUrl = "https://jacks-cookies.com/api/square/webhook";

type SquareWebhookEvent = {
  type?: string;
  data?: {
    object?: {
      payment?: {
        order_id?: string;
        status?: string;
      };
    };
  };
};

type SquareOrderResponse = {
  order?: {
    location_id?: string;
    reference_id?: string;
  };
};

export async function POST(request: Request) {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!signatureKey || !accessToken || !locationId || !supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("x-square-hmacsha256-signature");

  if (!signature || !hasValidSignature(body, signature, signatureKey)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 403 });
  }

  const event = JSON.parse(body) as SquareWebhookEvent;
  const payment = event.data?.object?.payment;

  if (event.type !== "payment.updated" || payment?.status !== "COMPLETED") {
    return NextResponse.json({ received: true });
  }

  if (!payment.order_id) {
    return NextResponse.json({ received: true });
  }

  const orderResponse = await fetch(
    `https://connect.squareup.com/v2/orders/${encodeURIComponent(payment.order_id)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Square-Version": "2026-07-15",
      },
      cache: "no-store",
    },
  );

  if (!orderResponse.ok) {
    console.error("Unable to retrieve paid Square order", await orderResponse.text());
    return NextResponse.json({ error: "Unable to retrieve Square order." }, { status: 502 });
  }

  const squareOrder = (await orderResponse.json()) as SquareOrderResponse;
  const referenceId = squareOrder.order?.reference_id;

  // Ignore payments not created by this website's checkout flow.
  if (!referenceId || squareOrder.order?.location_id !== locationId) {
    return NextResponse.json({ received: true });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { error } = await supabase
    .from("orders")
    .update({ paid: true, payment_status: "paid" })
    .eq("id", referenceId);

  if (error) {
    console.error("Unable to mark Square order paid", error);
    return NextResponse.json({ error: "Unable to update order." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

function hasValidSignature(body: string, signature: string, signatureKey: string) {
  const expected = createHmac("sha256", signatureKey)
    .update(notificationUrl + body)
    .digest();

  let received: Buffer;
  try {
    received = Buffer.from(signature, "base64");
  } catch {
    return false;
  }

  return expected.length === received.length && timingSafeEqual(expected, received);
}
