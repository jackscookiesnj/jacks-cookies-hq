import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const notificationUrl = "https://jacks-cookies.com/api/square/webhook";

type SquareWebhookEvent = {
  event_id?: string;
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
  const { data: paidOrder, error } = await supabase
    .from("orders")
    .update({ paid: true, payment_status: "paid" })
    .eq("id", referenceId)
    .select("*")
    .single();

  if (error) {
    console.error("Unable to mark Square order paid", error);
    return NextResponse.json({ error: "Unable to update order." }, { status: 500 });
  }

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("*")
    .eq("id", paidOrder.customer_id)
    .single();

  if (customerError) {
    console.error("Unable to retrieve customer for paid order", customerError);
    return NextResponse.json({ error: "Unable to retrieve customer." }, { status: 500 });
  }

  try {
    await sendPaidOrderEmails(paidOrder, customer, referenceId);
  } catch (emailError) {
    console.error("Unable to send paid order emails", emailError);
    return NextResponse.json({ error: "Unable to send order emails." }, { status: 502 });
  }

  return NextResponse.json({ received: true });
}

async function sendPaidOrderEmails(
  order: Record<string, unknown>,
  customer: Record<string, unknown>,
  referenceId: string,
) {
  const apiKey = process.env.RESEND_API_KEY;
  const ownerEmail = process.env.ORDER_NOTIFICATION_EMAIL;
  const from = process.env.ORDER_NOTIFICATION_FROM ?? "Jack's Cookies <orders@jacks-cookies.com>";
  const customerEmail = textValue(customer.email);

  if (!apiKey || !ownerEmail || !customerEmail) {
    throw new Error("Order email settings are incomplete.");
  }

  const customerName = textValue(customer.name) || textValue(order.customer_name) || "Customer";
  const invoiceReference =
    textValue(order.invoice_reference) || textValue(order.invoice_ref) || `Order ${referenceId}`;
  const quantity = numberValue(order.cookie_count ?? order.quantity);
  const total = numberValue(order.revenue ?? order.total);
  const requestedDate = textValue(order.delivery_date ?? order.order_date);
  const notes = textValue(order.notes);
  const phone = textValue(customer.phone);
  const details = [
    `Reference: ${invoiceReference}`,
    `Name: ${customerName}`,
    `Email: ${customerEmail}`,
    phone ? `Phone: ${phone}` : "",
    requestedDate ? `Date: ${formatDate(requestedDate)}` : "",
    `Quantity: ${quantity} cookies`,
    `Total paid: $${total.toFixed(2)}`,
    notes ? `\n${notes}` : "",
  ].filter(Boolean);

  await sendEmail({
    apiKey,
    from,
    to: ownerEmail,
    subject: `Paid Jack's Cookies order: ${quantity} cookies`,
    text: ["A website order has been paid through Square.", "", ...details].join("\n"),
    idempotencyKey: `paid-order-owner-${referenceId}`,
  });

  await sendEmail({
    apiKey,
    from,
    to: customerEmail,
    subject: "Your Jack's Cookies order is confirmed",
    text: [
      `Hi ${firstName(customerName)},`,
      "",
      "Payment received—your Jack's Cookies order is confirmed.",
      "We'll follow up with your pickup or delivery details.",
      "",
      `Reference: ${invoiceReference}`,
      requestedDate ? `Date: ${formatDate(requestedDate)}` : "",
      `Quantity: ${quantity} cookies`,
      `Total paid: $${total.toFixed(2)}`,
      "",
      "One cookie. Done right.",
      "Jack's Cookies",
    ]
      .filter(Boolean)
      .join("\n"),
    html: customerConfirmationHtml({
      customerName,
      invoiceReference,
      requestedDate,
      quantity,
      total,
    }),
    idempotencyKey: `paid-order-customer-v2-${referenceId}`,
  });
}

function customerConfirmationHtml({
  customerName,
  invoiceReference,
  requestedDate,
  quantity,
  total,
}: {
  customerName: string;
  invoiceReference: string;
  requestedDate: string;
  quantity: number;
  total: number;
}) {
  const detailRow = (label: string, value: string) => `
    <tr>
      <td style="padding:8px 0;color:#643b1c;font-size:14px;font-weight:700;">${label}</td>
      <td style="padding:8px 0;color:#00624b;font-size:14px;font-weight:800;text-align:right;">${escapeHtml(value)}</td>
    </tr>`;

  return `<!doctype html>
  <html>
    <body style="margin:0;background:#f8cfb8;color:#643b1c;font-family:Georgia,'Times New Roman',serif;">
      <div style="display:none;max-height:0;overflow:hidden;">Payment received—your Jack's Cookies order is confirmed!</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8cfb8;padding:28px 12px;">
        <tr><td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;border:2px solid #643b1c;border-radius:28px;background:#fff4ee;overflow:hidden;">
            <tr>
              <td align="center" style="padding:32px 28px 12px;">
                <img src="https://jacks-cookies.com/brand/rebrand/full-lockup.png" width="180" alt="Jack's Cookies" style="display:block;width:180px;max-width:60%;height:auto;">
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 28px 30px;">
                <p style="margin:0 0 8px;color:#e26226;font-size:13px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">Payment received</p>
                <h1 style="margin:0;color:#00624b;font-size:38px;line-height:1.05;">Your order is confirmed!</h1>
                <p style="margin:18px auto 0;max-width:440px;color:#643b1c;font-size:17px;line-height:1.55;">
                  Hi ${escapeHtml(firstName(customerName))}! Thanks so much for ordering Jack's Cookies. We&apos;re excited to bake for you.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 34px 28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:2px solid #f3bc93;border-bottom:2px solid #f3bc93;padding:12px 0;">
                  ${detailRow("Order", invoiceReference)}
                  ${requestedDate ? detailRow("Date", formatDate(requestedDate)) : ""}
                  ${detailRow("Quantity", `${quantity} cookies`)}
                  ${detailRow("Total paid", `$${total.toFixed(2)}`)}
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 34px 34px;">
                <h2 style="margin:0 0 8px;color:#e26226;font-size:20px;">What happens next?</h2>
                <p style="margin:0 0 24px;color:#643b1c;font-size:16px;line-height:1.5;">We&apos;ll follow up with your pickup or delivery details. Square will send your payment receipt separately.</p>
                <a href="https://jacks-cookies.com" style="display:inline-block;border-radius:999px;background:#00624b;color:#fff4ee;padding:14px 28px;font-size:16px;font-weight:800;text-decoration:none;">Back to Jack's Cookies</a>
              </td>
            </tr>
            <tr>
              <td align="center" style="background:#00624b;padding:18px;color:#fff4ee;font-size:13px;">One cookie. Done right. &nbsp;•&nbsp; Jack's Cookies</td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
  </html>`;
}

async function sendEmail({
  apiKey,
  from,
  to,
  subject,
  text,
  html,
  idempotencyKey,
}: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  idempotencyKey: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({ from, to, subject, text, ...(html ? { html } : {}) }),
  });

  if (!response.ok) {
    throw new Error(`Resend email failed: ${await response.text()}`);
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
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
