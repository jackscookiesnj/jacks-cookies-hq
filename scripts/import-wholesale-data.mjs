import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const cookieCosts = {
  "2oz": 0.55,
  "3oz": 0.7,
};

const wholesaleCustomers = [
  {
    name: "Moon Dog Market",
    code: "MD",
    contact_name: "Kim",
    phone: "201-962-6665",
    email: null,
    notes: "Delivery day: Friday. Payment terms: Upon Arrival. Typical order: 200.",
    orders: [
      {
        invoice_reference: "1",
        delivery_date: "2026-07-03",
        cookie_count: 200,
        price_per_cookie: 2,
        revenue: 400,
        payment_status: "paid",
        date_paid: "2026-07-06",
      },
    ],
  },
  {
    name: "Burger Bros",
    code: "BB",
    contact_name: "Lino & Tony",
    phone: "908-670-9020",
    email: null,
    notes: "Price per cookie from tracker: 1.75.",
    orders: [
      {
        invoice_reference: "BurgerBro_JC-1001",
        delivery_date: "2026-07-02",
        cookie_count: 15,
        price_per_cookie: 1.75,
        revenue: 26.25,
        payment_status: "paid",
        date_paid: "2026-07-02",
      },
    ],
  },
  {
    name: "Disantillos",
    code: "DI",
    contact_name: "Lino & Tony",
    phone: "908-670-9020",
    email: null,
    notes: "Price per cookie from tracker: 1.75.",
    orders: [
      {
        invoice_reference: "DiSantillo_JC-1001",
        delivery_date: "2026-07-02",
        cookie_count: 15,
        price_per_cookie: 1.75,
        revenue: 26.25,
        payment_status: "paid",
        date_paid: "2026-07-02",
      },
    ],
  },
  {
    name: "Roost",
    code: "RO",
    contact_name: null,
    phone: null,
    email: null,
    notes: null,
    orders: [
      {
        invoice_reference: "Roost_JC-1001",
        delivery_date: "2026-07-02",
        cookie_count: 15,
        price_per_cookie: 1.75,
        revenue: 26.25,
        payment_status: "paid",
        date_paid: "2026-07-02",
      },
    ],
  },
  {
    name: "Gianni CN",
    code: "GC",
    contact_name: null,
    phone: null,
    email: null,
    notes: "Price per cookie from tracker: 2.50.",
    orders: [
      {
        invoice_reference: "1",
        delivery_date: "2026-06-29",
        cookie_count: 50,
        price_per_cookie: 2,
        revenue: 100,
        payment_status: "paid",
        date_paid: "2026-07-29",
      },
    ],
  },
];

function loadEnvFile() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const [key, ...rest] = trimmed.split("=");
      process.env[key] ??= rest.join("=").replace(/^["']|["']$/g, "");
    }
  } catch {
    // .env.local is optional; deployment environments may provide vars directly.
  }
}

function buildOrderNotes(order) {
  const bits = ["Imported from WHOLESALE_TRACKER Google Sheet."];
  if (order.date_paid) bits.push(`Date paid: ${order.date_paid}.`);
  return bits.join(" ");
}

async function main() {
  loadEnvFile();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const imported = [];

  for (const customer of wholesaleCustomers) {
    const customerPayload = {
      type: "wholesale",
      name: customer.name,
      code: customer.code,
      contact_name: customer.contact_name,
      phone: customer.phone,
      email: customer.email,
      price: customer.orders[0]?.price_per_cookie ?? 0,
      address: null,
      notes: customer.notes,
    };

    const { data: existingCustomer, error: existingCustomerError } = await supabase
      .from("customers")
      .select("id")
      .eq("code", customer.code)
      .maybeSingle();
    if (existingCustomerError) throw existingCustomerError;

    const customerWrite = existingCustomer
      ? await supabase
          .from("customers")
          .update(customerPayload)
          .eq("id", existingCustomer.id)
          .select("id,name,code")
          .single()
      : await supabase
          .from("customers")
          .insert(customerPayload)
          .select("id,name,code")
          .single();
    if (customerWrite.error) throw customerWrite.error;
    const savedCustomer = customerWrite.data;

    for (const order of customer.orders) {
      const orderPayload = {
        customer_id: savedCustomer.id,
        customer_name: savedCustomer.name,
        customer_type: "wholesale",
        order_type: "wholesale",
        invoice_reference: order.invoice_reference,
        invoice_ref: order.invoice_reference,
        order_date: order.delivery_date,
        delivery_date: order.delivery_date,
        status: "closed",
        payment_status: order.payment_status,
        paid: order.payment_status === "paid",
        cookie_size: "2oz",
        cookie_count: order.cookie_count,
        quantity: order.cookie_count,
        price_per_cookie: order.price_per_cookie,
        price: order.price_per_cookie,
        cost_per_cookie: cookieCosts["2oz"],
        revenue: order.revenue,
        total: order.revenue,
        dough_prep: null,
        bake_list: null,
        notes: buildOrderNotes(order),
      };

      const { data: existingOrder, error: existingOrderError } = await supabase
        .from("orders")
        .select("id")
        .eq("customer_id", savedCustomer.id)
        .eq("invoice_reference", order.invoice_reference)
        .maybeSingle();
      if (existingOrderError) throw existingOrderError;

      const orderWrite = existingOrder
        ? await supabase.from("orders").update(orderPayload).eq("id", existingOrder.id)
        : await supabase.from("orders").insert(orderPayload);
      if (orderWrite.error) throw orderWrite.error;
    }

    const { data: sequence } = await supabase
      .from("invoice_sequences")
      .select("next_number")
      .eq("prefix", customer.code)
      .maybeSingle();
    const nextNumber = Math.max(sequence?.next_number ?? 1, customer.orders.length + 1);
    const { error: sequenceError } = await supabase.from("invoice_sequences").upsert({
      prefix: customer.code,
      next_number: nextNumber,
    });
    if (sequenceError) throw sequenceError;

    imported.push(`${customer.name}: ${customer.orders.length} order(s)`);
  }

  console.log(`Imported ${wholesaleCustomers.length} wholesale customers.`);
  for (const line of imported) console.log(`- ${line}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
