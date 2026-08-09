import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const standardMinimum = 3;
const eventMinimum = 24;
const maximumQuantity = 1000;
const deliveryFee = 6;

type PublicOrderPayload = {
  mode: "standard" | "event";
  name: string;
  email: string;
  phone: string;
  quantity: number;
  requestedDate: string;
  fulfillment?: "pickup" | "delivery";
  deliveryAddress?: string;
  deliveryCounty?: string;
  deliveryState?: string;
  payment: string;
  notes?: string;
  eventLocation?: string;
  occasion?: string;
  eventStyle?: string;
};

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: "Order storage is not configured yet." },
      { status: 500 },
    );
  }

  try {
    const payload = normalizePayload(await request.json());
    const supabase = createClient(supabaseUrl, supabaseKey);
    const now = new Date().toISOString();
    const customer = await findOrCreateCustomer(supabase, payload, now);
    const invoiceReference = `${payload.name} - ${formatDate(payload.requestedDate)}`;
    const revenue = roundMoney(
      payload.quantity * 3 +
        (payload.mode === "standard" && payload.fulfillment === "delivery" ? deliveryFee : 0),
    );
    const orderPayload = {
      customer_id: customer.id,
      customer_name: customer.name,
      customer_type: "individual",
      order_type: "individual",
      invoice_reference: invoiceReference,
      invoice_ref: invoiceReference,
      delivery_date: payload.requestedDate,
      order_date: payload.requestedDate,
      status: "open",
      payment_status: "unpaid",
      paid: false,
      cookie_size: "2oz",
      cookie_count: payload.quantity,
      quantity: payload.quantity,
      price_per_cookie: 3,
      price: 3,
      cost_per_cookie: 0.85,
      revenue,
      total: revenue,
      dough_prep: null,
      bake_list: null,
      notes: buildOrderNotes(payload),
    };

    const { data: order, error } = await supabase
      .from("orders")
      .insert(orderPayload)
      .select("id, invoice_reference")
      .single();

    if (error) throw error;

    if (payload.mode === "standard") {
      const checkoutUrl = await createSquareCheckout(request, payload, order.id, invoiceReference);

      return NextResponse.json({
        ok: true,
        orderId: order.id,
        invoiceReference: order.invoice_reference,
        checkoutUrl,
      });
    }

    await sendOrderNotification(payload, invoiceReference, revenue).catch((error) => {
      console.error("Order notification email failed", error);
    });
    await sendCustomerConfirmation(payload, invoiceReference, revenue).catch((error) => {
      console.error("Customer confirmation email failed", error);
    });

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      invoiceReference: order.invoice_reference,
    });
  } catch (error) {
    console.error("Public order save failed", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 400 },
    );
  }
}

async function createSquareCheckout(
  request: Request,
  payload: PublicOrderPayload,
  orderId: string | number,
  invoiceReference: string,
) {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  const environment = process.env.SQUARE_ENVIRONMENT === "production" ? "production" : "sandbox";

  if (!accessToken || !locationId) {
    throw new Error("Square checkout is not configured yet.");
  }

  const apiBase =
    environment === "production"
      ? "https://connect.squareup.com"
      : "https://connect.squareupsandbox.com";
  const origin = new URL(request.url).origin;
  const lineItems: Array<Record<string, unknown>> = [
    {
      name: "The Everyday Chocolate Chip Cookie",
      quantity: String(payload.quantity),
      base_price_money: { amount: 300, currency: "USD" },
    },
  ];

  if (payload.fulfillment === "delivery") {
    lineItems.push({
      name: "Monmouth County delivery",
      quantity: "1",
      base_price_money: { amount: deliveryFee * 100, currency: "USD" },
    });
  }

  const response = await fetch(`${apiBase}/v2/online-checkout/payment-links`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Square-Version": "2026-07-15",
    },
    body: JSON.stringify({
      idempotency_key: crypto.randomUUID(),
      description: invoiceReference,
      order: {
        location_id: locationId,
        reference_id: String(orderId),
        line_items: lineItems,
      },
      checkout_options: {
        allow_tipping: false,
        redirect_url: `${origin}/order-confirmed`,
        accepted_payment_methods: {
          apple_pay: true,
          google_pay: true,
          cash_app_pay: false,
          afterpay_clearpay: false,
        },
      },
      pre_populated_data: {
        buyer_email: payload.email,
      },
      payment_note: `Jack's Cookies website order ${orderId}`,
    }),
  });
  const result = (await response.json()) as {
    errors?: Array<{ detail?: string; code?: string }>;
    payment_link?: { url?: string };
  };

  if (!response.ok || !result.payment_link?.url) {
    const detail = result.errors?.[0]?.detail ?? result.errors?.[0]?.code;
    throw new Error(detail || "Unable to open Square checkout. Please try again.");
  }

  return result.payment_link.url;
}

function normalizePayload(input: unknown): PublicOrderPayload {
  if (!input || typeof input !== "object") {
    throw new Error("Missing order details.");
  }

  const data = input as Record<string, unknown>;
  const mode = data.mode === "event" ? "event" : "standard";
  const email = stringValue(data.email).toLowerCase();
  const quantity = Number(data.quantity);
  const requestedDate = stringValue(data.requestedDate);

  if (!stringValue(data.name)) throw new Error("Name is required.");
  if (!email) throw new Error("Email is required.");
  if (!emailPattern.test(email)) {
    throw new Error("Please enter a valid email address.");
  }
  if (!stringValue(data.phone)) throw new Error("Phone is required.");
  if (!requestedDate) throw new Error("Date is required.");
  if (!Number.isInteger(quantity)) {
    throw new Error("Please enter a whole number of cookies.");
  }
  if (quantity < (mode === "event" ? eventMinimum : standardMinimum)) {
    throw new Error(mode === "event" ? "Event orders start at 24 cookies." : "Standard orders start at 3 cookies.");
  }
  if (mode === "standard" && quantity > maximumQuantity) {
    throw new Error("Please enter 1000 cookies or fewer.");
  }

  const fulfillment = data.fulfillment === "delivery" ? "delivery" : "pickup";
  const deliveryAddress = stringValue(data.deliveryAddress);
  const deliveryCounty = stringValue(data.deliveryCounty);
  const deliveryState = stringValue(data.deliveryState);

  if (mode === "standard" && fulfillment === "delivery") {
    if (!deliveryAddress) throw new Error("Please select a verified delivery address.");
    if (deliveryCounty.toLowerCase() !== "monmouth county" || deliveryState !== "NJ") {
      throw new Error("Delivery is only available within Monmouth County, New Jersey.");
    }
  }

  return {
    mode,
    name: stringValue(data.name),
    email,
    phone: stringValue(data.phone),
    quantity,
    requestedDate,
    fulfillment,
    deliveryAddress,
    deliveryCounty,
    deliveryState,
    payment: stringValue(data.payment) || "card",
    notes: stringValue(data.notes),
    eventLocation: stringValue(data.eventLocation),
    occasion: stringValue(data.occasion),
    eventStyle: stringValue(data.eventStyle),
  };
}

async function findOrCreateCustomer(
  supabase: SupabaseClient,
  payload: PublicOrderPayload,
  now: string,
) {
  const { data: existing, error: searchError } = await supabase
    .from("customers")
    .select("*")
    .eq("email", payload.email)
    .limit(1)
    .maybeSingle();

  if (searchError) throw searchError;
  if (existing) {
    const { data, error } = await supabase
      .from("customers")
      .update({
        name: payload.name,
        contact_name: payload.name,
        phone: payload.phone,
        address: customerAddress(payload),
        notes: customerNotes(payload),
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("customers")
    .insert({
      type: "individual",
      name: payload.name,
      code: null,
      contact_name: payload.name,
      email: payload.email,
      phone: payload.phone,
      address: customerAddress(payload),
      notes: customerNotes(payload),
      price: 0,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

function buildOrderNotes(payload: PublicOrderPayload) {
  const lines = [
    `Public website ${payload.mode === "event" ? "event order" : "standard pre-order"}.`,
    `Payment: ${paymentLabel(payload.payment)}.`,
  ];

  if (payload.mode === "standard") {
    lines.push(`Fulfillment: ${payload.fulfillment === "delivery" ? "Monmouth County delivery" : "Pickup"}.`);
    if (payload.fulfillment === "delivery") lines.push(`Delivery fee: $${deliveryFee.toFixed(2)}.`);
    if (payload.deliveryAddress) lines.push(`Delivery address: ${payload.deliveryAddress}.`);
  }

  if (payload.mode === "event") {
    if (payload.occasion) lines.push(`Occasion: ${payload.occasion}.`);
    if (payload.eventLocation) lines.push(`Event location: ${payload.eventLocation}.`);
    if (payload.eventStyle) lines.push(`Event style: ${eventStyleLabel(payload.eventStyle)}.`);
  }

  if (payload.notes) lines.push(`Customer notes: ${payload.notes}`);
  return lines.join("\n");
}

function customerAddress(payload: PublicOrderPayload) {
  return payload.mode === "event" ? payload.eventLocation || null : payload.deliveryAddress || null;
}

function customerNotes(payload: PublicOrderPayload) {
  return payload.mode === "event"
    ? `Website event inquiry${payload.occasion ? `: ${payload.occasion}` : ""}`
    : "Website customer";
}

async function sendOrderNotification(
  payload: PublicOrderPayload,
  invoiceReference: string,
  revenue: number,
) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ORDER_NOTIFICATION_EMAIL;
  const from = process.env.ORDER_NOTIFICATION_FROM ?? "Jack's Cookies <orders@jacks-cookies.com>";

  if (!apiKey || !to) return;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: `New Jack's Cookies order: ${payload.quantity} cookies`,
      text: [
        `New ${payload.mode === "event" ? "event order" : "standard pre-order"}`,
        `Reference: ${invoiceReference}`,
        `Name: ${payload.name}`,
        `Email: ${payload.email}`,
        `Phone: ${payload.phone}`,
        `Date: ${formatDate(payload.requestedDate)}`,
        `Quantity: ${payload.quantity}`,
        `Total: $${revenue.toFixed(2)}`,
        "",
        buildOrderNotes(payload),
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend email failed: ${detail}`);
  }
}

async function sendCustomerConfirmation(
  payload: PublicOrderPayload,
  invoiceReference: string,
  revenue: number,
) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_NOTIFICATION_FROM ?? "Jack's Cookies <orders@jacks-cookies.com>";

  if (!apiKey) return;

  const isEvent = payload.mode === "event";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: payload.email,
      subject: isEvent
        ? "We got your Jack's Cookies event request"
        : "We got your Jack's Cookies order request",
      text: [
        `Hi ${firstName(payload.name)},`,
        "",
        isEvent
          ? "Thanks for thinking of Jack's Cookies for your event. We received your request. Your date is not reserved yet—we'll email you soon to confirm availability, final pricing, and payment."
          : "Thanks for ordering Jack's Cookies. We received your request and will email you soon to confirm payment and order details.",
        "",
        "Request details:",
        `Reference: ${invoiceReference}`,
        `Date: ${formatDate(payload.requestedDate)}`,
        `Quantity: ${payload.quantity} cookies`,
        `Total: $${revenue.toFixed(2)}`,
        ...(isEvent
          ? [
              payload.occasion ? `Occasion: ${payload.occasion}` : "",
              payload.eventLocation ? `Location: ${payload.eventLocation}` : "",
              payload.eventStyle ? `Event style: ${eventStyleLabel(payload.eventStyle)}` : "",
            ].filter(Boolean)
          : [
              `Pickup or delivery: ${payload.fulfillment === "delivery" ? "Monmouth County delivery" : "Pickup"}`,
              payload.deliveryAddress ? `Delivery address: ${payload.deliveryAddress}` : "",
            ].filter(Boolean)),
        `Payment: ${paymentLabel(payload.payment)}`,
        "",
        "One cookie. Done right.",
        "Jack's Cookies",
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Customer confirmation email failed: ${detail}`);
  }
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function paymentLabel(value: string) {
  if (value === "square") return "Credit card through Square";
  if (value === "venmo") return "Venmo @jacks-cookies";
  if (value === "cash") return "Cash";
  return "Credit card";
}

function eventStyleLabel(value: string) {
  if (value === "cookie_cart") return "Cookie cart";
  if (value === "not_sure") return "Not sure yet";
  return "Cookies only";
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }

  return "Unable to save order.";
}
