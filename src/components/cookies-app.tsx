"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { addDays, formatDate, formatMoney, formatUnitMoney, initials, toInputDate } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import type {
  Customer,
  CustomerType,
  InventoryItem,
  Order,
  OrderWithCustomer,
  ProductionCalendarDay,
} from "@/lib/types";

type View = "dashboard" | "calendar" | "customers" | "orders" | "invoices" | "inventory" | "production";
type DashboardRangePreset = "all" | "this-week" | "this-month" | "last-month" | "custom";
type CustomerDraft = Omit<Customer, "id" | "created_at" | "updated_at">;
type OrderDraft = Omit<Order, "id" | "created_at" | "updated_at" | "invoice_reference"> & {
  invoice_reference?: string;
};
type CalendarPatch = Pick<
  ProductionCalendarDay,
  "date" | "dough_day" | "bake_day" | "shopping_day" | "packaging_day" | "notes"
>;
type InventoryCategory = "frozen" | "refrigerated";

const cookieCosts = {
  "2oz": 0.55,
  "3oz": 0.7,
} as const;

const driveRootFolderId = "1h8eg47kxQ-abxH-BcCNhZqpAGKi-IsIt";
const driveFolderMap: Record<string, string> = {
  "Belo Pizza": "1JCMQwM7EpH6U433JNb0wF1Z2qEOx69i-",
  "Gianni CN": "18YksDAytiGWDUQ3_d7iED9m0x6lUm4Er",
  "Gianni Colts Neck": "18YksDAytiGWDUQ3_d7iED9m0x6lUm4Er",
  "Moon Dog Market": "18jaLmEBt8cwRQNTcj9bJYF3KVP8qEHxi",
  "Moondog Market": "18jaLmEBt8cwRQNTcj9bJYF3KVP8qEHxi",
  Roost: "1WhfrzXGUCg99_5Pp_Iw4YN0jLNnoUnGQ",
  Disantillos: "1WhfrzXGUCg99_5Pp_Iw4YN0jLNnoUnGQ",
  "Burger Bros": "1WhfrzXGUCg99_5Pp_Iw4YN0jLNnoUnGQ",
  "Burger Bro": "1WhfrzXGUCg99_5Pp_Iw4YN0jLNnoUnGQ",
  "Corrado's": "1Iao_3gRwDcL94234ZClmyFTvRBGfXHbr",
};

const emptyCustomer: CustomerDraft = {
  type: "wholesale",
  name: "",
  code: "",
  contact_name: "",
  email: "",
  phone: "",
  address: "",
  notes: "",
};

const emptyOrder: OrderDraft = {
  customer_id: "",
  customer_type: "wholesale",
  invoice_reference: "",
  delivery_date: toInputDate(new Date()),
  status: "open",
  payment_status: "unpaid",
  cookie_size: "2oz",
  cookie_count: 0,
  price_per_cookie: 0,
  cost_per_cookie: cookieCosts["2oz"],
  revenue: 0,
  dough_prepped: false,
  dough_prep: "",
  bake_list: "",
  notes: "",
};

const sampleCustomers: Customer[] = [
  {
    id: "sample-md",
    type: "wholesale",
    name: "Maple Door Cafe",
    code: "MD",
    contact_name: "Morgan Diaz",
    email: "orders@mapledoor.example",
    phone: "555-0101",
    address: "18 King Street",
    notes: "Prefers morning delivery.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "sample-sarah",
    type: "individual",
    name: "Sarah Jones",
    code: null,
    contact_name: null,
    email: "sarah@example.com",
    phone: "555-0199",
    address: "",
    notes: "Birthday order.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const sampleOrders: OrderWithCustomer[] = [
  {
    id: "sample-order-1",
    customer_id: "sample-md",
    customer_type: "wholesale",
    customer: sampleCustomers[0],
    invoice_reference: "MD-001",
    delivery_date: "2026-07-11",
    status: "open",
    payment_status: "unpaid",
    cookie_size: "2oz",
    cookie_count: 240,
    price_per_cookie: 2,
    cost_per_cookie: 0.55,
    revenue: 480,
    dough_prepped: true,
    dough_prep: "Chocolate chip dough, 20 dozen",
    bake_list: "Bake Friday afternoon",
    notes: "Box by the dozen.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "sample-order-2",
    customer_id: "sample-sarah",
    customer_type: "individual",
    customer: sampleCustomers[1],
    invoice_reference: "Sarah Jones - July 11, 2026",
    delivery_date: "2026-07-11",
    status: "open",
    payment_status: "paid",
    cookie_size: "3oz",
    cookie_count: 36,
    price_per_cookie: 2,
    cost_per_cookie: 0.7,
    revenue: 72,
    dough_prepped: false,
    dough_prep: "Sugar cookie dough",
    bake_list: "Bake Saturday morning",
    notes: "Add gift tag.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const sampleCalendarDays: ProductionCalendarDay[] = [
  makeSampleCalendarDay("2026-07-06", { doughDay: true, notes: "Weekly dough prep" }),
  makeSampleCalendarDay("2026-07-09", { shoppingDay: true, packagingDay: true, notes: "Labels and inventory" }),
  makeSampleCalendarDay("2026-07-10", { bakeDay: true, notes: "Bake for July 11 deliveries" }),
  makeSampleCalendarDay("2026-07-11", { bakeDay: true, notes: "Small morning bake" }),
];

const sampleInventoryItems: InventoryItem[] = [
  makeSampleInventoryItem("Frozen Inventory", 252, 0, "frozen", "freezer"),
  makeSampleInventoryItem("Refrigerated Inventory", 0, 0, "refrigerated", "refrigerator"),
];

export function CookiesApp({ configured }: { configured: boolean }) {
  const [view, setView] = useState<View>("dashboard");
  const [customers, setCustomers] = useState<Customer[]>(configured ? [] : sampleCustomers);
  const [orders, setOrders] = useState<OrderWithCustomer[]>(configured ? [] : sampleOrders);
  const [calendarDays, setCalendarDays] = useState<ProductionCalendarDay[]>(
    configured ? [] : sampleCalendarDays,
  );
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(
    configured ? [] : sampleInventoryItems,
  );
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [dashboardRange, setDashboardRange] = useState<DashboardRangePreset>("this-month");
  const [dashboardStartDate, setDashboardStartDate] = useState("");
  const [dashboardEndDate, setDashboardEndDate] = useState("");
  const [customerModal, setCustomerModal] = useState<Customer | "new" | null>(null);
  const [orderModal, setOrderModal] = useState<OrderWithCustomer | "new" | null>(null);

  useEffect(() => {
    if (!configured) return;
    void loadData();
  }, [configured]);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const supabase = getSupabase();
      const [customerResult, orderResult, calendarResult, inventoryResult] = await Promise.all([
        supabase.from("customers").select("*").order("name"),
        supabase
          .from("orders")
          .select("*, customer:customers(id,name,code,type,contact_name,email,phone,address)")
          .order("delivery_date", { ascending: true })
          .order("created_at", { ascending: false }),
        supabase.from("production_calendar_days").select("*").order("date", { ascending: true }),
        supabase.from("inventory_items").select("*").order("name", { ascending: true }),
      ]);

      if (customerResult.error) throw customerResult.error;
      if (orderResult.error) throw orderResult.error;
      if (calendarResult.error) throw calendarResult.error;
      if (inventoryResult.error) throw inventoryResult.error;
      setCustomers((customerResult.data ?? []) as Customer[]);
      setOrders((orderResult.data ?? []) as OrderWithCustomer[]);
      setCalendarDays((calendarResult.data ?? []) as ProductionCalendarDay[]);
      setInventoryItems((inventoryResult.data ?? []) as InventoryItem[]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load data.");
    } finally {
      setLoading(false);
    }
  }

  const openOrders = orders.filter((order) => order.status === "open");
  const unpaidOrders = orders.filter((order) => order.payment_status === "unpaid");
  const openCookieCount = openOrders.reduce((sum, order) => sum + Number(order.cookie_count), 0);
  const doughReadyCookieCount = openOrders
    .filter((order) => isDoughPrepped(order))
    .reduce((sum, order) => sum + Number(order.cookie_count), 0);
  const doughNeededCookieCount = Math.max(openCookieCount - doughReadyCookieCount, 0);
  const today = toInputDate(new Date());
  const sevenDays = toInputDate(addDays(new Date(), 7));
  const nextSeven = orders.filter(
    (order) => order.delivery_date >= today && order.delivery_date <= sevenDays,
  );
  const dashboardDateRange = getDashboardDateRange(
    dashboardRange,
    dashboardStartDate,
    dashboardEndDate,
  );
  const dashboardOrders = orders.filter((order) => orderMatchesDateRange(order, dashboardDateRange));

  const metrics = [
    ["Revenue", formatMoney(dashboardOrders.reduce((sum, order) => sum + Number(order.revenue), 0))],
    ["Profit", formatMoney(dashboardOrders.reduce((sum, order) => sum + orderProfit(order), 0))],
    ["Cookies Sold", cookieTotal(dashboardOrders).toLocaleString()],
    ["Orders", dashboardOrders.length.toString()],
    ["Open Cookies", openCookieCount.toLocaleString()],
    ["Outstanding Payments", formatMoney(unpaidOrders.reduce((sum, order) => sum + Number(order.revenue), 0))],
    ["Next 7 Days", nextSeven.length.toString()],
  ];

  const filteredCustomers = customers.filter((customer) =>
    [customer.name, customer.code, customer.email, customer.phone]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const groupedNextSeven = groupByDate(nextSeven);
  const productionOrders = openOrders.sort((a, b) => a.delivery_date.localeCompare(b.delivery_date));
  const supportsDoughPreppedColumn =
    orders.length === 0 || orders.some((order) => Object.prototype.hasOwnProperty.call(order, "dough_prepped"));
  const productionSummary = {
    openCookies: openCookieCount,
    doughReadyCookies: doughReadyCookieCount,
    doughNeededCookies: doughNeededCookieCount,
    openOrders: openOrders.length,
  };

  async function updateOrderDoughPrepped(order: OrderWithCustomer, doughPrepped: boolean) {
    if (configured) {
      const payload = supportsDoughPreppedColumn
        ? { dough_prepped: doughPrepped }
        : { dough_prep: applyDoughPrepMarker(order.dough_prep, doughPrepped) };
      const result = await getSupabase().from("orders").update(payload).eq("id", order.id);
      if (result.error) {
        setError(result.error.message);
        return;
      }
      await loadData();
      return;
    }

    setOrders((current) =>
      current.map((item) =>
        item.id === order.id
          ? { ...item, dough_prepped: doughPrepped, updated_at: new Date().toISOString() }
          : item,
      ),
    );
  }

  async function saveInventoryCategory(category: InventoryCategory, quantity: number) {
    const nextQuantity = Math.max(Number(quantity) || 0, 0);
    if (configured) {
      const result = await persistInventoryCategory(category, nextQuantity, inventoryItems);
      if (result.error) {
        setError(result.error);
        return;
      }
      await loadData();
      return;
    }

    setInventoryItems((current) => upsertLocalInventoryCategory(current, category, nextQuantity));
  }

  async function deductInventoryForClosedOrder(cookieCount: number) {
    const completedCookies = Math.max(Number(cookieCount) || 0, 0);
    const currentRefrigerated = inventoryCategoryTotal(inventoryItems, "refrigerated");
    const currentFrozen = inventoryCategoryTotal(inventoryItems, "frozen");
    const nextRefrigerated = Math.max(currentRefrigerated - completedCookies, 0);
    const refrigeratedUsed = currentRefrigerated - nextRefrigerated;
    const nextFrozen = Math.max(currentFrozen - (completedCookies - refrigeratedUsed), 0);

    if (configured) {
      const [refrigeratedResult, frozenResult] = await Promise.all([
        persistInventoryCategory("refrigerated", nextRefrigerated, inventoryItems),
        persistInventoryCategory("frozen", nextFrozen, inventoryItems),
      ]);
      const error = refrigeratedResult.error ?? frozenResult.error;
      if (error) {
        setError(error);
        throw new Error(error);
      }
      return;
    }

    setInventoryItems((current) =>
      upsertLocalInventoryCategory(
        upsertLocalInventoryCategory(current, "refrigerated", nextRefrigerated),
        "frozen",
        nextFrozen,
      ),
    );
  }

  async function saveCalendarDay(patch: CalendarPatch) {
    const payload = {
      ...patch,
      notes: blankToNull(patch.notes),
    };

    if (configured) {
      const supabase = getSupabase();
      const result =
        !payload.dough_day && !payload.bake_day && !payload.notes
        && !payload.shopping_day && !payload.packaging_day
          ? await supabase.from("production_calendar_days").delete().eq("date", payload.date)
          : await supabase.from("production_calendar_days").upsert(payload);
      if (result.error) {
        setError(result.error.message);
        return;
      }
      await loadData();
      return;
    }

    setCalendarDays((current) => upsertLocalCalendarDay(current, payload));
  }

  if (loading) {
    return <div className="loading">Loading Jack&apos;s Cookies HQ...</div>;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">JC</div>
          <div>
            <h1>Jack&apos;s Cookies HQ</h1>
            <p>{configured ? "Supabase connected" : "Preview mode, add Supabase env vars"}</p>
          </div>
        </div>
        <nav className="tabs" aria-label="Primary">
          {(["dashboard", "calendar", "customers", "orders", "invoices", "inventory", "production"] as View[]).map((item) => (
            <button
              className={`tab ${view === item ? "active" : ""}`}
              key={item}
              onClick={() => setView(item)}
              type="button"
            >
              {title(item)}
            </button>
          ))}
        </nav>
      </header>

      <main className="main">
        {error ? <div className="panel error">{error}</div> : null}

        {view === "dashboard" ? (
          <Dashboard
            dateRange={dashboardDateRange}
            endDate={dashboardEndDate}
            groupedNextSeven={groupedNextSeven}
            metrics={metrics}
            onNewOrder={() => setOrderModal("new")}
            range={dashboardRange}
            setEndDate={setDashboardEndDate}
            setRange={setDashboardRange}
            setStartDate={setDashboardStartDate}
            startDate={dashboardStartDate}
          />
        ) : null}

        {view === "calendar" ? (
          <CalendarView
            calendarDays={calendarDays}
            orders={openOrders}
            onSaveDay={saveCalendarDay}
          />
        ) : null}

        {view === "customers" ? (
          <CustomersView
            customers={filteredCustomers}
            orders={orders}
            search={search}
            setSearch={setSearch}
            onNew={() => setCustomerModal("new")}
            onEdit={setCustomerModal}
          />
        ) : null}

        {view === "orders" ? (
          <OrdersView
            orders={orders}
            onNew={() => setOrderModal("new")}
            onEdit={setOrderModal}
            onToggleDoughPrepped={updateOrderDoughPrepped}
          />
        ) : null}

        {view === "invoices" ? <InvoicesView orders={orders} /> : null}

        {view === "inventory" ? (
          <InventoryView
            items={inventoryItems}
            openOrders={openOrders}
            onSaveInventory={saveInventoryCategory}
          />
        ) : null}

        {view === "production" ? (
          <ProductionView
            orders={productionOrders}
            summary={productionSummary}
            onToggleDoughPrepped={updateOrderDoughPrepped}
          />
        ) : null}
      </main>

      {customerModal ? (
        <CustomerModal
          configured={configured}
          customer={customerModal}
          onClose={() => setCustomerModal(null)}
          onDone={loadData}
          setLocalCustomers={setCustomers}
        />
      ) : null}

      {orderModal ? (
        <OrderModal
          configured={configured}
          customers={customers}
          order={orderModal}
          onClose={() => setOrderModal(null)}
          onDone={loadData}
          onOrderClosed={deductInventoryForClosedOrder}
          supportsDoughPreppedColumn={supportsDoughPreppedColumn}
          setLocalOrders={setOrders}
        />
      ) : null}
    </div>
  );
}

function CalendarView({
  calendarDays,
  orders,
  onSaveDay,
}: {
  calendarDays: ProductionCalendarDay[];
  orders: OrderWithCustomer[];
  onSaveDay: (patch: CalendarPatch) => Promise<void>;
}) {
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(toInputDate(new Date()));
  const selectedPlan = calendarDays.find((day) => day.date === selectedDate);
  const openOrders = orders.filter((order) => order.status === "open");
  const selectedOrders = openOrders.filter((order) => order.delivery_date === selectedDate);
  const selectedCookieTotal = cookieTotal(selectedOrders);
  const selectedPatch: CalendarPatch = selectedPlan
    ? {
        date: selectedPlan.date,
        dough_day: selectedPlan.dough_day,
        bake_day: selectedPlan.bake_day,
        shopping_day: selectedPlan.shopping_day,
        packaging_day: selectedPlan.packaging_day,
        notes: selectedPlan.notes ?? "",
      }
    : {
        date: selectedDate,
        dough_day: false,
        bake_day: false,
        shopping_day: false,
        packaging_day: false,
        notes: "",
      };

  async function updateSelected(patch: Partial<CalendarPatch>) {
    await onSaveDay({ ...selectedPatch, ...patch });
  }

  const cells = buildMonthCells(visibleMonth);
  const visibleWeeks = chunkWeeks(cells).map((week) => {
    const weekOrders = openOrders.filter((order) =>
      week.some((date) => order.delivery_date === toInputDate(date)),
    );
    return {
      end: week[6],
      orders: weekOrders.length,
      start: week[0],
      total: cookieTotal(weekOrders),
    };
  });
  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(visibleMonth);

  return (
    <div className="split calendar-layout">
      <section className="panel">
        <div className="section-title">
          <div>
            <span className="section-label">Calendar</span>
            <h3>Dough days and bake days</h3>
          </div>
          <div className="month-controls">
            <button
              aria-label="Previous month"
              className="icon-button"
              onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}
              type="button"
            >
              &lt;
            </button>
            <strong>{monthLabel}</strong>
            <button
              aria-label="Next month"
              className="icon-button"
              onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}
              type="button"
            >
              &gt;
            </button>
          </div>
        </div>
        <div className="calendar-weekdays" aria-hidden="true">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="calendar-grid">
          {cells.map((date) => {
            const dateKey = toInputDate(date);
            const plan = calendarDays.find((day) => day.date === dateKey);
            const dayOrders = openOrders.filter((order) => order.delivery_date === dateKey);
            const dayCookieTotal = cookieTotal(dayOrders);
            const isOutsideMonth = date.getMonth() !== visibleMonth.getMonth();
            const isSelected = selectedDate === dateKey;

            return (
              <button
                aria-label={formatDate(dateKey)}
                className={`calendar-day ${isOutsideMonth ? "muted" : ""} ${isSelected ? "selected" : ""}`}
                key={dateKey}
                onClick={() => setSelectedDate(dateKey)}
                type="button"
              >
                <span className="calendar-number">{date.getDate()}</span>
                <span className="calendar-tags">
                  {plan?.dough_day ? <span className="mini-tag dough">Dough</span> : null}
                  {plan?.bake_day ? <span className="mini-tag bake">Bake</span> : null}
                  {plan?.shopping_day ? <span className="mini-tag shopping">Shop</span> : null}
                  {plan?.packaging_day ? <span className="mini-tag packaging">Pack</span> : null}
                  {dayOrders.length ? <span className="mini-tag orders">{dayOrders.length} orders</span> : null}
                  {dayCookieTotal ? (
                    <span className="mini-tag cookies">{dayCookieTotal.toLocaleString()} cookies</span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
        <div className="weekly-cookie-summary">
          <span className="section-label">Weekly Cookies Needed</span>
          <div className="weekly-cookie-grid">
            {visibleWeeks.map((week) => (
              <div className="weekly-cookie-card" key={toInputDate(week.start)}>
                <span>
                  {shortDate(week.start)} - {shortDate(week.end)}
                </span>
                <strong>{week.total.toLocaleString()}</strong>
                <small>{week.orders} open orders</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-title">
          <div>
            <span className="section-label">Selected Day</span>
            <h3>{formatDate(selectedDate)}</h3>
          </div>
          <div className="selected-day-total">
            <span>Cookies due</span>
            <strong>{selectedCookieTotal.toLocaleString()}</strong>
          </div>
        </div>
        <div className="calendar-editor">
          <button
            className={`toggle-row ${selectedPatch.dough_day ? "active" : ""}`}
            onClick={() => updateSelected({ dough_day: !selectedPatch.dough_day })}
            type="button"
          >
            <span>Dough Prep</span>
            <strong>{selectedPatch.dough_day ? "On" : "Off"}</strong>
          </button>
          <button
            className={`toggle-row ${selectedPatch.bake_day ? "active" : ""}`}
            onClick={() => updateSelected({ bake_day: !selectedPatch.bake_day })}
            type="button"
          >
            <span>Bake Day</span>
            <strong>{selectedPatch.bake_day ? "On" : "Off"}</strong>
          </button>
          <button
            className={`toggle-row ${selectedPatch.shopping_day ? "active" : ""}`}
            onClick={() => updateSelected({ shopping_day: !selectedPatch.shopping_day })}
            type="button"
          >
            <span>Shopping Day</span>
            <strong>{selectedPatch.shopping_day ? "On" : "Off"}</strong>
          </button>
          <button
            className={`toggle-row ${selectedPatch.packaging_day ? "active" : ""}`}
            onClick={() => updateSelected({ packaging_day: !selectedPatch.packaging_day })}
            type="button"
          >
            <span>Packaging Prep</span>
            <strong>{selectedPatch.packaging_day ? "On" : "Off"}</strong>
          </button>
          <Field label="Planning Notes">
            <textarea
              key={selectedDate}
              onBlur={(event) => updateSelected({ notes: event.target.value })}
              placeholder="Schedule notes, timing, oven plan, pickup constraints"
              defaultValue={selectedPatch.notes ?? ""}
            />
          </Field>
        </div>
        <div className="list" style={{ marginTop: "1rem" }}>
          <span className="section-label">Open Orders Due</span>
          {selectedOrders.length ? (
            selectedOrders.map((order) => <OrderCard key={order.id} order={order} />)
          ) : (
            <div className="empty">No open orders due this day.</div>
          )}
        </div>
      </section>
    </div>
  );
}

function Dashboard({
  dateRange,
  endDate,
  metrics,
  groupedNextSeven,
  onNewOrder,
  range,
  setEndDate,
  setRange,
  setStartDate,
  startDate,
}: {
  dateRange: DashboardDateRange;
  endDate: string;
  metrics: string[][];
  groupedNextSeven: [string, OrderWithCustomer[]][];
  onNewOrder: () => void;
  range: DashboardRangePreset;
  setEndDate: (value: string) => void;
  setRange: (value: DashboardRangePreset) => void;
  setStartDate: (value: string) => void;
  startDate: string;
}) {
  return (
    <>
      <section className="hero">
        <div>
          <h2>Fresh orders, calm operations.</h2>
          <p>
            Track revenue, customers, invoices, dough prep, bake lists, payments, and the next
            seven delivery days from one clean workspace.
          </p>
        </div>
        <div className="toolbar">
          <button className="button primary" onClick={onNewOrder} type="button">
            + New Order
          </button>
        </div>
      </section>
      <section className="panel dashboard-range-panel">
        <div className="section-title">
          <div>
            <span className="section-label">Performance</span>
            <h3>Sales by date</h3>
          </div>
          <p className="range-summary">{dashboardRangeLabel(dateRange)}</p>
        </div>
        <div className="filter-bar dashboard-filter-bar">
          <Field label="Range">
            <select
              value={range}
              onChange={(event) => setRange(event.target.value as DashboardRangePreset)}
            >
              <option value="this-month">This month</option>
              <option value="this-week">This week</option>
              <option value="last-month">Last month</option>
              <option value="all">All time</option>
              <option value="custom">Custom range</option>
            </select>
          </Field>
          {range === "custom" ? (
            <>
              <Field label="Start date">
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </Field>
              <Field label="End date">
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </Field>
            </>
          ) : null}
        </div>
      </section>
      <section className="grid metrics">
        {metrics.map(([label, value]) => (
          <div className="metric-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </section>
      <section className="panel">
        <div className="section-title">
          <div>
            <span className="section-label">Next 7 Days</span>
            <h3>Delivery schedule</h3>
          </div>
        </div>
        <ScheduleGroups groups={groupedNextSeven} />
      </section>
    </>
  );
}

function CustomersView({
  customers,
  orders,
  search,
  setSearch,
  onNew,
  onEdit,
}: {
  customers: Customer[];
  orders: OrderWithCustomer[];
  search: string;
  setSearch: (value: string) => void;
  onNew: () => void;
  onEdit: (customer: Customer) => void;
}) {
  return (
    <section className="panel">
      <div className="section-title">
        <div>
          <span className="section-label">Customers</span>
          <h3>Wholesale and individual</h3>
        </div>
      </div>
      <div className="toolbar">
        <input
          className="search"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search customers"
          value={search}
        />
        <button className="button primary" onClick={onNew} type="button">
          + Customer
        </button>
      </div>
      <div className="list" style={{ marginTop: "0.85rem" }}>
        {customers.length ? (
          customers.map((customer) => (
            <CustomerCard
              customer={customer}
              key={customer.id}
              onEdit={() => onEdit(customer)}
              orderCount={orders.filter((order) => order.customer_id === customer.id).length}
            />
          ))
        ) : (
          <div className="empty">No customers found.</div>
        )}
      </div>
    </section>
  );
}

function OrdersView({
  orders,
  onNew,
  onEdit,
  onToggleDoughPrepped,
}: {
  orders: OrderWithCustomer[];
  onNew: () => void;
  onEdit: (order: OrderWithCustomer) => void;
  onToggleDoughPrepped: (order: OrderWithCustomer, doughPrepped: boolean) => void;
}) {
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Order["status"]>("open");
  const [customerFilter, setCustomerFilter] = useState("all");
  const customerOptions = Array.from(
    new Map(
      orders.map((order) => [
        order.customer_id,
        {
          id: order.customer_id,
          name: order.customer?.name ?? order.customer_name ?? "Customer",
        },
      ]),
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));
  const filteredOrders = orders.filter((order) => {
    const dateMatches = !dateFilter || order.delivery_date.slice(0, 10) === dateFilter;
    const statusMatches = statusFilter === "all" || order.status === statusFilter;
    const customerMatches = customerFilter === "all" || order.customer_id === customerFilter;
    return dateMatches && statusMatches && customerMatches;
  });

  return (
    <section className="panel">
      <div className="section-title">
        <div>
          <span className="section-label">Orders</span>
          <h3>Create, edit, close, and collect</h3>
        </div>
        <button className="button primary" onClick={onNew} type="button">
          + Order
        </button>
      </div>
      <div className="filter-bar">
        <Field label="Delivery Date">
          <input
            onChange={(event) => setDateFilter(event.target.value)}
            type="date"
            value={dateFilter}
          />
        </Field>
        <Field label="Open / Closed">
          <select
            onChange={(event) => setStatusFilter(event.target.value as "all" | Order["status"])}
            value={statusFilter}
          >
            <option value="all">All orders</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </Field>
        <Field label="Customer">
          <select onChange={(event) => setCustomerFilter(event.target.value)} value={customerFilter}>
            <option value="all">All customers</option>
            {customerOptions.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </Field>
        <button
          className="button ghost"
          onClick={() => {
            setDateFilter("");
            setStatusFilter("all");
            setCustomerFilter("all");
          }}
          type="button"
        >
          Clear
        </button>
      </div>
      <p className="hint">{filteredOrders.length} of {orders.length} orders shown</p>
      <div className="list">
        {filteredOrders.length ? (
          filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onEdit={() => onEdit(order)}
              onToggleDoughPrepped={order.status === "open" ? onToggleDoughPrepped : undefined}
            />
          ))
        ) : (
          <div className="empty">No orders match those filters.</div>
        )}
      </div>
    </section>
  );
}

function InventoryView({
  items,
  openOrders,
  onSaveInventory,
}: {
  items: InventoryItem[];
  openOrders: OrderWithCustomer[];
  onSaveInventory: (category: InventoryCategory, quantity: number) => Promise<void>;
}) {
  const frozenTotal = inventoryCategoryTotal(items, "frozen");
  const refrigeratedTotal = inventoryCategoryTotal(items, "refrigerated");
  const totalInventory = frozenTotal + refrigeratedTotal;
  const openDemand = openOrders.reduce((sum, order) => sum + Number(order.cookie_count), 0);
  const afterOpenOrders = totalInventory - openDemand;
  const [frozenDraft, setFrozenDraft] = useState(frozenTotal);
  const [refrigeratedDraft, setRefrigeratedDraft] = useState(refrigeratedTotal);
  const [savingCategory, setSavingCategory] = useState<InventoryCategory | null>(null);

  useEffect(() => {
    setFrozenDraft(frozenTotal);
    setRefrigeratedDraft(refrigeratedTotal);
  }, [frozenTotal, refrigeratedTotal]);

  async function save(category: InventoryCategory, quantity: number) {
    setSavingCategory(category);
    await onSaveInventory(category, quantity);
    setSavingCategory(null);
  }

  return (
    <section className="panel">
      <div className="section-title">
        <div>
          <span className="section-label">Inventory</span>
          <h3>Frozen and refrigerated stock</h3>
        </div>
      </div>
      <div className="grid metrics inventory-metrics">
        <div className="metric-card">
          <span>Frozen Inventory</span>
          <strong>{frozenTotal.toLocaleString()}</strong>
        </div>
        <div className="metric-card">
          <span>Refrigerated Inventory</span>
          <strong>{refrigeratedTotal.toLocaleString()}</strong>
        </div>
        <div className="metric-card">
          <span>Open Order Need</span>
          <strong>{openDemand.toLocaleString()}</strong>
        </div>
        <div className="metric-card">
          <span>Total After Open Orders</span>
          <strong>{afterOpenOrders.toLocaleString()}</strong>
        </div>
      </div>
      {afterOpenOrders < 0 ? (
        <p className="status-note warning">
          Open orders need {Math.abs(afterOpenOrders).toLocaleString()} more cookies than current frozen and refrigerated inventory.
        </p>
      ) : (
        <p className="status-note">
          Current frozen and refrigerated inventory covers open orders with {afterOpenOrders.toLocaleString()} cookies left.
        </p>
      )}
      <div className="inventory-adjustments">
        <StockAdjuster
          label="Frozen"
          note="Used after refrigerated inventory when an order is closed."
          onChange={setFrozenDraft}
          onSave={() => save("frozen", frozenDraft)}
          quantity={frozenDraft}
          saving={savingCategory === "frozen"}
        />
        <StockAdjuster
          label="Refrigerated"
          note="Automatically deducted first when an order is closed."
          onChange={setRefrigeratedDraft}
          onSave={() => save("refrigerated", refrigeratedDraft)}
          quantity={refrigeratedDraft}
          saving={savingCategory === "refrigerated"}
        />
      </div>
    </section>
  );
}

function StockAdjuster({
  label,
  note,
  quantity,
  saving,
  onChange,
  onSave,
}: {
  label: string;
  note: string;
  quantity: number;
  saving: boolean;
  onChange: (quantity: number) => void;
  onSave: () => void;
}) {
  return (
    <article className="data-card stock-card">
      <div className="card-title">
        <strong>{label}</strong>
        <span>{note}</span>
      </div>
      <div className="stock-control">
        <button className="button ghost" onClick={() => onChange(Math.max(quantity - 12, 0))} type="button">
          -12
        </button>
        <input
          min={0}
          onChange={(event) => onChange(Number(event.target.value))}
          step={1}
          type="number"
          value={quantity}
        />
        <button className="button ghost" onClick={() => onChange(quantity + 12)} type="button">
          +12
        </button>
        <button className="button primary" disabled={saving} onClick={onSave} type="button">
          Save
        </button>
      </div>
    </article>
  );
}

function InvoicesView({ orders }: { orders: OrderWithCustomer[] }) {
  const wholesale = orders.filter((order) => order.customer_type === "wholesale");
  const individuals = orders.filter((order) => order.customer_type === "individual");

  return (
    <div className="split">
      <section className="panel">
        <div className="section-title">
          <div>
            <span className="section-label">Wholesale</span>
            <h3>Numbered invoices</h3>
          </div>
        </div>
        <InvoiceList orders={wholesale} />
      </section>
      <section className="panel">
        <div className="section-title">
          <div>
            <span className="section-label">Individuals</span>
            <h3>Name-based references</h3>
          </div>
        </div>
        <InvoiceList orders={individuals} />
      </section>
    </div>
  );
}

function ProductionView({
  orders,
  summary,
  onToggleDoughPrepped,
}: {
  orders: OrderWithCustomer[];
  summary: {
    openCookies: number;
    doughReadyCookies: number;
    doughNeededCookies: number;
    openOrders: number;
  };
  onToggleDoughPrepped: (order: OrderWithCustomer, doughPrepped: boolean) => void;
}) {
  return (
    <section className="panel">
      <div className="section-title">
        <div>
          <span className="section-label">Production</span>
          <h3>Dough prep and bake list</h3>
        </div>
      </div>
      <div className="grid metrics production-metrics">
        <div className="metric-card">
          <span>Open Cookies</span>
          <strong>{summary.openCookies.toLocaleString()}</strong>
        </div>
        <div className="metric-card">
          <span>Dough Ready</span>
          <strong>{summary.doughReadyCookies.toLocaleString()}</strong>
        </div>
        <div className="metric-card">
          <span>Dough Needed</span>
          <strong>{summary.doughNeededCookies.toLocaleString()}</strong>
        </div>
        <div className="metric-card">
          <span>Open Orders</span>
          <strong>{summary.openOrders}</strong>
        </div>
      </div>
      <div className="list">
        {orders.length ? (
          orders.map((order) => (
            <article className="data-card" key={order.id}>
              <div className="card-row">
                <div className="card-title">
                  <strong>{order.customer?.name ?? "Customer"}</strong>
                  <span>
                    {formatDate(order.delivery_date)} · {order.invoice_reference}
                  </span>
                </div>
                <div className="card-actions">
                  <span className="pill teal">{order.cookie_count} cookies</span>
                  <DoughPreppedToggle order={order} onToggle={onToggleDoughPrepped} />
                </div>
              </div>
              <div className="grid two">
                <div>
                  <span className="section-label">Dough Prep</span>
                  <p className="hint">{displayDoughPrep(order.dough_prep) || "No dough prep notes."}</p>
                </div>
                <div>
                  <span className="section-label">Bake List</span>
                  <p className="hint">{order.bake_list || "No bake list notes."}</p>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="empty">No open orders in production.</div>
        )}
      </div>
    </section>
  );
}

function CustomerCard({
  customer,
  orderCount,
  onEdit,
}: {
  customer: Customer;
  orderCount: number;
  onEdit: () => void;
}) {
  return (
    <article className="data-card">
      <div className="card-row">
        <div className="brand">
          <div className="brand-mark">{customer.code || initials(customer.name)}</div>
          <div className="card-title">
            <strong>{customer.name}</strong>
            <span>{customer.email || customer.phone || "No contact added"}</span>
          </div>
        </div>
        <button aria-label={`Edit ${customer.name}`} className="icon-button" onClick={onEdit} type="button">
          ...
        </button>
      </div>
      <div className="pills">
        <span className="pill teal">{customer.type}</span>
        {customer.code ? <span className="pill tan">{customer.code}-001</span> : null}
        <span className="pill">{orderCount} orders</span>
      </div>
    </article>
  );
}

function OrderCard({
  order,
  onEdit,
  onToggleDoughPrepped,
}: {
  order: OrderWithCustomer;
  onEdit?: () => void;
  onToggleDoughPrepped?: (order: OrderWithCustomer, doughPrepped: boolean) => void;
}) {
  return (
    <article className="data-card">
      <div className="card-row">
        <div className="card-title">
          <strong>{order.customer?.name ?? "Customer"}</strong>
          <span>
            {formatDate(order.delivery_date)} · {order.invoice_reference}
          </span>
        </div>
        {onEdit ? (
          <button aria-label={`Edit ${order.invoice_reference}`} className="icon-button" onClick={onEdit} type="button">
            ...
          </button>
        ) : null}
      </div>
      <div className="pills">
        <span className={`pill ${order.status === "open" ? "teal" : "tan"}`}>{order.status}</span>
        <span className={`pill ${order.payment_status === "paid" ? "green" : "red"}`}>
          {order.payment_status}
        </span>
        <span className="pill tan">{order.cookie_size}</span>
        <span className="pill">{order.cookie_count} cookies</span>
        <span className="pill">{formatUnitMoney(invoiceTotal(order))}</span>
        <span className="pill green">profit {formatMoney(orderProfit(order))}</span>
        <span className={`pill ${isDoughPrepped(order) ? "green" : "red"}`}>
          {isDoughPrepped(order) ? "dough ready" : "dough needed"}
        </span>
      </div>
      <div className="card-actions">
        <button className="button primary" onClick={() => downloadInvoice(order)} type="button">
          Download Invoice
        </button>
        <SaveInvoiceToDriveButton order={order} />
      </div>
      {onToggleDoughPrepped ? <DoughPreppedToggle order={order} onToggle={onToggleDoughPrepped} /> : null}
      {order.notes ? <p className="hint">{order.notes}</p> : null}
    </article>
  );
}

function DoughPreppedToggle({
  order,
  onToggle,
}: {
  order: OrderWithCustomer;
  onToggle: (order: OrderWithCustomer, doughPrepped: boolean) => void;
}) {
  return (
    <button
      className={`prep-toggle ${isDoughPrepped(order) ? "active" : ""}`}
      onClick={() => onToggle(order, !isDoughPrepped(order))}
      type="button"
    >
      <span>{isDoughPrepped(order) ? "Dough prepped" : "Needs dough"}</span>
      <strong>{isDoughPrepped(order) ? "Yes" : "No"}</strong>
    </button>
  );
}

function SaveInvoiceToDriveButton({ order }: { order: OrderWithCustomer }) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const customerName = order.customer?.name ?? order.customer_name ?? "Customer";
  const folderId = driveFolderMap[customerName];

  async function saveToDrive() {
    setStatus("saving");
    try {
      const result = await fetch("/api/save-invoice-to-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rootFolderId: driveRootFolderId,
          folderId,
          folderName: customerName,
          fileName: `${safeFileName(order.invoice_reference)}.html`,
          html: buildInvoiceHtml(order),
          invoice: buildInvoicePayload(order),
        }),
      });
      if (!result.ok) throw new Error("Unable to save to Drive.");
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="drive-save">
      <button
        className="button ghost"
        disabled={!folderId || status === "saving"}
        onClick={saveToDrive}
        type="button"
      >
        {status === "saving" ? "Saving..." : "Save to Drive"}
      </button>
      {!folderId ? <span>No Drive folder mapped</span> : null}
      {status === "saved" ? <span>Saved</span> : null}
      {status === "error" ? <span>Drive setup needed</span> : null}
    </div>
  );
}

function InvoiceList({ orders }: { orders: OrderWithCustomer[] }) {
  return (
    <div className="list">
      {orders.length ? (
        orders.map((order) => (
          <article className="data-card invoice-card" key={order.id}>
            <div className="card-row">
              <div className="card-title">
                <strong>{order.invoice_reference}</strong>
                <span>
                  {order.customer?.name ?? "Customer"} · {formatDate(order.delivery_date)}
                </span>
              </div>
              <span className={`pill ${order.payment_status === "paid" ? "green" : "red"}`}>
                {order.payment_status}
              </span>
            </div>
            <div className="invoice-summary">
              <span className="section-label">{formatUnitMoney(invoiceTotal(order))}</span>
              <span>
                {Number(order.cookie_count).toLocaleString()} {order.cookie_size} cookies ·{" "}
                {formatUnitMoney(Number(order.price_per_cookie))} each
              </span>
            </div>
            <div className="card-actions">
              <button className="button primary" onClick={() => downloadInvoice(order)} type="button">
                Download
              </button>
              <SaveInvoiceToDriveButton order={order} />
            </div>
          </article>
        ))
      ) : (
        <div className="empty">No invoices yet.</div>
      )}
    </div>
  );
}

function ScheduleGroups({ groups }: { groups: [string, OrderWithCustomer[]][] }) {
  return (
    <div className="list">
      {groups.length ? (
        groups.map(([date, dateOrders]) => (
          <article className="data-card" key={date}>
            <div className="card-row">
              <div className="card-title">
                <strong>{formatDate(date)}</strong>
                <span>{dateOrders.length} deliveries</span>
              </div>
            </div>
            <div className="pills">
              {dateOrders.map((order) => (
                <span className="pill" key={order.id}>
                  {order.customer?.name ?? "Customer"} · {order.cookie_count}
                </span>
              ))}
            </div>
          </article>
        ))
      ) : (
        <div className="empty">No deliveries in the next 7 days.</div>
      )}
    </div>
  );
}

function CustomerModal({
  configured,
  customer,
  onClose,
  onDone,
  setLocalCustomers,
}: {
  configured: boolean;
  customer: Customer | "new";
  onClose: () => void;
  onDone: () => Promise<void>;
  setLocalCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
}) {
  const [draft, setDraft] = useState<CustomerDraft>(customer === "new" ? emptyCustomer : customer);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = cleanCustomer(draft);
    try {
      if (configured) {
        const supabase = getSupabase();
        const result =
          customer === "new"
            ? await supabase.from("customers").insert(payload)
            : await supabase.from("customers").update(payload).eq("id", customer.id);
        if (result.error) throw result.error;
        await onDone();
      } else {
        const localCustomer = {
          ...payload,
          id: customer === "new" ? crypto.randomUUID() : customer.id,
          created_at: customer === "new" ? new Date().toISOString() : customer.created_at,
          updated_at: new Date().toISOString(),
        } as Customer;
        setLocalCustomers((current) =>
          customer === "new"
            ? [...current, localCustomer]
            : current.map((item) => (item.id === customer.id ? localCustomer : item)),
        );
      }
      onClose();
    } catch (caught) {
      setError(errorMessage(caught, "Unable to save customer."));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (customer === "new") return;
    setSaving(true);
    setError("");
    try {
      if (configured) {
        const result = await getSupabase().from("customers").delete().eq("id", customer.id);
        if (result.error) throw result.error;
        await onDone();
      } else {
        setLocalCustomers((current) => current.filter((item) => item.id !== customer.id));
      }
      onClose();
    } catch (caught) {
      setError(errorMessage(caught, "Unable to delete customer."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={customer === "new" ? "Add customer" : "Edit customer"} onClose={onClose}>
      <form onSubmit={save}>
        <div className="form-grid two">
          <Field label="Type">
            <select
              onChange={(event) => setDraft({ ...draft, type: event.target.value as CustomerType })}
              value={draft.type}
            >
              <option value="wholesale">Wholesale</option>
              <option value="individual">Individual</option>
            </select>
          </Field>
          <Field label="Invoice prefix">
            <input
              disabled={draft.type === "individual"}
              maxLength={4}
              onChange={(event) => setDraft({ ...draft, code: event.target.value.toUpperCase() })}
              placeholder="MD"
              value={draft.code ?? ""}
            />
          </Field>
          <Field label="Name">
            <input
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              required
              value={draft.name}
            />
          </Field>
          <Field label="Contact">
            <input
              onChange={(event) => setDraft({ ...draft, contact_name: event.target.value })}
              value={draft.contact_name ?? ""}
            />
          </Field>
          <Field label="Email">
            <input
              onChange={(event) => setDraft({ ...draft, email: event.target.value })}
              type="email"
              value={draft.email ?? ""}
            />
          </Field>
          <Field label="Phone">
            <input onChange={(event) => setDraft({ ...draft, phone: event.target.value })} value={draft.phone ?? ""} />
          </Field>
        </div>
        <div className="form-grid" style={{ marginTop: "0.8rem" }}>
          <Field label="Address">
            <textarea onChange={(event) => setDraft({ ...draft, address: event.target.value })} value={draft.address ?? ""} />
          </Field>
          <Field label="Notes">
            <textarea onChange={(event) => setDraft({ ...draft, notes: event.target.value })} value={draft.notes ?? ""} />
          </Field>
        </div>
        {error ? <p className="error">{error}</p> : null}
        <div className="actions">
          {customer !== "new" ? (
            <button className="button danger" disabled={saving} onClick={remove} type="button">
              Delete
            </button>
          ) : null}
          <button className="button ghost" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="button primary" disabled={saving} type="submit">
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

function OrderModal({
  configured,
  customers,
  order,
  onClose,
  onDone,
  onOrderClosed,
  supportsDoughPreppedColumn,
  setLocalOrders,
}: {
  configured: boolean;
  customers: Customer[];
  order: OrderWithCustomer | "new";
  onClose: () => void;
  onDone: () => Promise<void>;
  onOrderClosed: (cookieCount: number) => Promise<void>;
  supportsDoughPreppedColumn: boolean;
  setLocalOrders: React.Dispatch<React.SetStateAction<OrderWithCustomer[]>>;
}) {
  const defaultCustomer = customers[0];
  const initial = useMemo(() => {
    if (order !== "new") {
      return {
        ...order,
        dough_prepped: isDoughPrepped(order),
        dough_prep: displayDoughPrep(order.dough_prep),
      };
    }
    return {
      ...emptyOrder,
      customer_id: defaultCustomer?.id ?? "",
      customer_type: defaultCustomer?.type ?? "wholesale",
    };
  }, [defaultCustomer, order]);
  const [draft, setDraft] = useState<OrderDraft>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const selectedCustomer = customers.find((customer) => customer.id === draft.customer_id);
  const estimatedProfit = Number(draft.revenue) - Number(draft.cookie_count) * Number(draft.cost_per_cookie);

  function setCookieCount(cookieCount: number) {
    setDraft({
      ...draft,
      cookie_count: cookieCount,
      revenue: Number(draft.price_per_cookie) > 0 ? roundMoney(cookieCount * Number(draft.price_per_cookie)) : draft.revenue,
    });
  }

  function setPricePerCookie(price: number) {
    setDraft({
      ...draft,
      price_per_cookie: price,
      revenue: roundMoney(Number(draft.cookie_count) * price),
    });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!selectedCustomer) {
      setError("Choose a customer first.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const invoiceReference =
        order === "new"
          ? await createInvoiceReference(configured, selectedCustomer, draft.delivery_date)
          : order.invoice_reference;
      const payload = cleanOrder({
        ...draft,
        customer_type: selectedCustomer.type,
        invoice_reference: invoiceReference,
      });
      const baseCompatiblePayload = {
        ...payload,
        customer_name: selectedCustomer.name,
        order_type: selectedCustomer.type,
        invoice_ref: invoiceReference,
        order_date: draft.delivery_date,
        quantity: Number(draft.cookie_count) || 0,
        price: Number(draft.price_per_cookie) || 0,
        total: Number(draft.revenue) || 0,
        paid: draft.payment_status === "paid",
      };
      const compatiblePayload = supportsDoughPreppedColumn
        ? baseCompatiblePayload
        : (() => {
            const { dough_prepped: omittedDoughPrepped, ...legacyPayload } = baseCompatiblePayload;
            void omittedDoughPrepped;
            return {
              ...legacyPayload,
              dough_prep: applyDoughPrepMarker(payload.dough_prep, payload.dough_prepped),
            };
          })();
      const shouldDeductInventory =
        order !== "new" && order.status === "open" && payload.status === "closed";

      if (configured) {
        const supabase = getSupabase();
        const result =
          order === "new"
            ? await supabase.from("orders").insert(compatiblePayload)
            : await supabase.from("orders").update(compatiblePayload).eq("id", order.id);
        if (result.error) throw result.error;
        if (shouldDeductInventory) {
          await onOrderClosed(payload.cookie_count);
        }
        await onDone();
      } else {
        const localOrder = {
          ...baseCompatiblePayload,
          id: order === "new" ? crypto.randomUUID() : order.id,
          customer: selectedCustomer,
          created_at: order === "new" ? new Date().toISOString() : order.created_at,
          updated_at: new Date().toISOString(),
        } as OrderWithCustomer;
        setLocalOrders((current) =>
          order === "new"
            ? [...current, localOrder]
            : current.map((item) => (item.id === order.id ? localOrder : item)),
        );
        if (shouldDeductInventory) {
          await onOrderClosed(payload.cookie_count);
        }
      }
      onClose();
    } catch (caught) {
      setError(errorMessage(caught, "Unable to save order."));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (order === "new") return;
    setSaving(true);
    setError("");
    try {
      if (configured) {
        const result = await getSupabase().from("orders").delete().eq("id", order.id);
        if (result.error) throw result.error;
        await onDone();
      } else {
        setLocalOrders((current) => current.filter((item) => item.id !== order.id));
      }
      onClose();
    } catch (caught) {
      setError(errorMessage(caught, "Unable to delete order."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={order === "new" ? "Create order" : "Edit order"} onClose={onClose}>
      <form onSubmit={save}>
        <div className="form-grid two">
          <Field label="Customer">
            <select
              onChange={(event) => {
                const customer = customers.find((item) => item.id === event.target.value);
                setDraft({
                  ...draft,
                  customer_id: event.target.value,
                  customer_type: customer?.type ?? "wholesale",
                });
              }}
              required
              value={draft.customer_id}
            >
              <option value="">Choose customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Delivery Date">
            <input
              onChange={(event) => setDraft({ ...draft, delivery_date: event.target.value })}
              required
              type="date"
              value={draft.delivery_date}
            />
          </Field>
          <Field label="Open / Closed">
            <select
              onChange={(event) => setDraft({ ...draft, status: event.target.value as Order["status"] })}
              value={draft.status}
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </Field>
          <Field label="Paid / Unpaid">
            <select
              onChange={(event) =>
                setDraft({ ...draft, payment_status: event.target.value as Order["payment_status"] })
              }
              value={draft.payment_status}
            >
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
            </select>
          </Field>
          <Field label="Cookies Sold">
            <input
              min={0}
              onChange={(event) => setCookieCount(Number(event.target.value))}
              type="number"
              value={draft.cookie_count}
            />
          </Field>
          <Field label="Cookie Size">
            <select
              onChange={(event) => {
                const cookieSize = event.target.value as Order["cookie_size"];
                setDraft({
                  ...draft,
                  cookie_size: cookieSize,
                  cost_per_cookie: cookieCosts[cookieSize],
                });
              }}
              value={draft.cookie_size}
            >
              <option value="2oz">2 oz</option>
              <option value="3oz">3 oz</option>
            </select>
          </Field>
          <Field label="Price Per Cookie">
            <input
              min={0}
              onChange={(event) => setPricePerCookie(Number(event.target.value))}
              step="0.01"
              type="number"
              value={draft.price_per_cookie}
            />
          </Field>
          <Field label="Cost Per Cookie">
            <input
              min={0}
              onChange={(event) => setDraft({ ...draft, cost_per_cookie: Number(event.target.value) })}
              step="0.01"
              type="number"
              value={draft.cost_per_cookie}
            />
          </Field>
          <Field label="Revenue">
            <input
              min={0}
              onChange={(event) => setDraft({ ...draft, revenue: Number(event.target.value) })}
              step="0.01"
              type="number"
              value={draft.revenue}
            />
          </Field>
          <div className="profit-preview">
            <span className="section-label">Estimated Profit</span>
            <strong>{formatMoney(estimatedProfit)}</strong>
          </div>
        </div>
        <div className="form-grid" style={{ marginTop: "0.8rem" }}>
          {order !== "new" ? (
            <Field label="Invoice Reference">
              <input readOnly value={order.invoice_reference} />
            </Field>
          ) : (
            <p className="hint">
              Wholesale invoices are assigned from the database sequence. Individual references use
              customer name and {draft.delivery_date ? formatDate(draft.delivery_date) : "delivery date"}.
            </p>
          )}
          <button
            className={`toggle-row ${draft.dough_prepped ? "active" : ""}`}
            onClick={() => setDraft({ ...draft, dough_prepped: !draft.dough_prepped })}
            type="button"
          >
            <strong>Dough prepped?</strong>
            <span>{draft.dough_prepped ? "Yes" : "No"}</span>
          </button>
          <Field label="Dough Prep">
            <textarea onChange={(event) => setDraft({ ...draft, dough_prep: event.target.value })} value={draft.dough_prep ?? ""} />
          </Field>
          <Field label="Bake List">
            <textarea onChange={(event) => setDraft({ ...draft, bake_list: event.target.value })} value={draft.bake_list ?? ""} />
          </Field>
          <Field label="Notes">
            <textarea onChange={(event) => setDraft({ ...draft, notes: event.target.value })} value={draft.notes ?? ""} />
          </Field>
        </div>
        {error ? <p className="error">{error}</p> : null}
        <div className="actions">
          {order !== "new" ? (
            <button className="button danger" disabled={saving} onClick={remove} type="button">
              Delete
            </button>
          ) : null}
          <button className="button ghost" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="button primary" disabled={saving || !customers.length} type="submit">
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <div>
            <h3>{title}</h3>
            <p>Every field can be edited later.</p>
          </div>
          <button aria-label="Close" className="icon-button" onClick={onClose} type="button">
            x
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function title(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

function groupByDate(orders: OrderWithCustomer[]) {
  const groups = orders.reduce<Record<string, OrderWithCustomer[]>>((acc, order) => {
    acc[order.delivery_date] = [...(acc[order.delivery_date] ?? []), order];
    return acc;
  }, {});
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

type DashboardDateRange = {
  start: string;
  end: string;
  label: string;
};

function getDashboardDateRange(
  preset: DashboardRangePreset,
  customStart: string,
  customEnd: string,
): DashboardDateRange {
  const today = new Date();

  if (preset === "all") {
    return { start: "", end: "", label: "All time" };
  }

  if (preset === "custom") {
    return {
      start: customStart,
      end: customEnd,
      label: customStart || customEnd ? "Custom range" : "Choose dates",
    };
  }

  if (preset === "this-week") {
    const start = startOfWeek(today);
    const end = addDays(start, 6);
    return {
      start: toInputDate(start),
      end: toInputDate(end),
      label: "This week",
    };
  }

  if (preset === "last-month") {
    const start = addMonths(startOfMonth(today), -1);
    const end = addDays(startOfMonth(today), -1);
    return {
      start: toInputDate(start),
      end: toInputDate(end),
      label: "Last month",
    };
  }

  const start = startOfMonth(today);
  const end = addDays(addMonths(start, 1), -1);
  return {
    start: toInputDate(start),
    end: toInputDate(end),
    label: "This month",
  };
}

function orderMatchesDateRange(order: OrderWithCustomer, range: DashboardDateRange) {
  if (range.start && order.delivery_date < range.start) return false;
  if (range.end && order.delivery_date > range.end) return false;
  return true;
}

function dashboardRangeLabel(range: DashboardDateRange) {
  if (!range.start && !range.end) return range.label;
  if (range.start && range.end) return `${range.label}: ${shortDateString(range.start)} - ${shortDateString(range.end)}`;
  if (range.start) return `${range.label}: after ${shortDateString(range.start)}`;
  return `${range.label}: before ${shortDateString(range.end)}`;
}

function startOfWeek(date: Date) {
  return addDays(date, -date.getDay());
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function buildMonthCells(month: Date) {
  const first = startOfMonth(month);
  const start = addDays(first, -first.getDay());
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

function chunkWeeks(cells: Date[]) {
  return Array.from({ length: Math.ceil(cells.length / 7) }, (_, index) =>
    cells.slice(index * 7, index * 7 + 7),
  );
}

function cookieTotal(orders: OrderWithCustomer[]) {
  return orders.reduce((sum, order) => sum + Number(order.cookie_count), 0);
}

function shortDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function shortDateString(date: string) {
  return shortDate(new Date(`${date}T12:00:00`));
}

function makeSampleCalendarDay(date: string, options: {
  doughDay?: boolean;
  bakeDay?: boolean;
  shoppingDay?: boolean;
  packagingDay?: boolean;
  notes: string;
}): ProductionCalendarDay {
  return {
    date,
    dough_day: options.doughDay ?? false,
    bake_day: options.bakeDay ?? false,
    shopping_day: options.shoppingDay ?? false,
    packaging_day: options.packagingDay ?? false,
    notes: options.notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function makeSampleInventoryItem(
  name: string,
  quantity: number,
  parLevel: number,
  category: string,
  location: string,
): InventoryItem {
  return {
    id: `sample-${name.toLowerCase().replaceAll(" ", "-")}`,
    name,
    category,
    quantity,
    unit: "cookies",
    par_level: parLevel,
    location,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function upsertLocalCalendarDay(
  days: ProductionCalendarDay[],
  patch: CalendarPatch,
): ProductionCalendarDay[] {
  const updatedDay: ProductionCalendarDay = {
    ...patch,
    created_at: days.find((day) => day.date === patch.date)?.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (
    !updatedDay.dough_day &&
    !updatedDay.bake_day &&
    !updatedDay.shopping_day &&
    !updatedDay.packaging_day &&
    !updatedDay.notes
  ) {
    return days.filter((day) => day.date !== patch.date);
  }

  if (days.some((day) => day.date === patch.date)) {
    return days.map((day) => (day.date === patch.date ? updatedDay : day));
  }

  return [...days, updatedDay].sort((a, b) => a.date.localeCompare(b.date));
}

function cleanCustomer(customer: CustomerDraft) {
  return {
    ...customer,
    code: customer.type === "wholesale" ? blankToNull(customer.code)?.toUpperCase() : null,
    price: 0,
    contact_name: blankToNull(customer.contact_name),
    email: blankToNull(customer.email),
    phone: blankToNull(customer.phone),
    address: blankToNull(customer.address),
    notes: blankToNull(customer.notes),
  };
}

function cleanOrder(order: OrderDraft & { invoice_reference: string }) {
  return {
    customer_id: order.customer_id,
    customer_type: order.customer_type,
    invoice_reference: order.invoice_reference,
    delivery_date: order.delivery_date,
    status: order.status,
    payment_status: order.payment_status,
    cookie_size: order.cookie_size,
    cookie_count: Number(order.cookie_count) || 0,
    price_per_cookie: roundMoney(Number(order.price_per_cookie) || 0),
    cost_per_cookie: roundMoney(Number(order.cost_per_cookie) || 0),
    revenue: Number(order.revenue) || 0,
    dough_prepped: Boolean(order.dough_prepped),
    dough_prep: blankToNull(order.dough_prep),
    bake_list: blankToNull(order.bake_list),
    notes: blankToNull(order.notes),
  };
}

function inventoryCategoryTotal(items: InventoryItem[], category: InventoryCategory) {
  return items
    .filter((item) => item.category.toLowerCase().includes(category))
    .reduce((sum, item) => sum + Number(item.quantity), 0);
}

function inventoryCategoryLabel(category: InventoryCategory) {
  return category === "frozen" ? "Frozen Inventory" : "Refrigerated Inventory";
}

function inventoryCategoryLocation(category: InventoryCategory) {
  return category === "frozen" ? "freezer" : "refrigerator";
}

function inventoryCategoryPayload(category: InventoryCategory, quantity: number) {
  return {
    name: inventoryCategoryLabel(category),
    category,
    quantity: Math.max(Number(quantity) || 0, 0),
    unit: "cookies",
    par_level: 0,
    location: inventoryCategoryLocation(category),
    notes: null,
  };
}

function upsertLocalInventoryCategory(
  items: InventoryItem[],
  category: InventoryCategory,
  quantity: number,
) {
  const matching = items.filter((item) => item.category.toLowerCase().includes(category));
  const primary = matching[0];
  const payload = inventoryCategoryPayload(category, quantity);

  if (!primary) {
    return [
      ...items,
      {
        ...payload,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ] as InventoryItem[];
  }

  return items.map((item) => {
    if (!item.category.toLowerCase().includes(category)) return item;
    if (item.id !== primary.id) {
      return { ...item, quantity: 0, updated_at: new Date().toISOString() };
    }
    return {
      ...item,
      ...payload,
      id: item.id,
      created_at: item.created_at,
      updated_at: new Date().toISOString(),
    };
  });
}

async function persistInventoryCategory(
  category: InventoryCategory,
  quantity: number,
  items: InventoryItem[],
) {
  const supabase = getSupabase();
  const matching = items.filter((item) => item.category.toLowerCase().includes(category));
  const primary = matching[0];
  const payload = inventoryCategoryPayload(category, quantity);

  if (!primary) {
    const result = await supabase.from("inventory_items").insert(payload);
    return { error: result.error?.message };
  }

  const primaryResult = await supabase.from("inventory_items").update(payload).eq("id", primary.id);
  if (primaryResult.error) return { error: primaryResult.error.message };

  for (const item of matching.slice(1)) {
    const result = await supabase.from("inventory_items").update({ quantity: 0 }).eq("id", item.id);
    if (result.error) return { error: result.error.message };
  }

  return { error: undefined };
}

function downloadInvoice(order: OrderWithCustomer) {
  const html = buildInvoiceHtml(order);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeFileName(order.invoice_reference)}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildInvoiceHtml(order: OrderWithCustomer) {
  const customer = order.customer;
  const customerName = customer?.name ?? order.customer_name ?? "Customer";
  const customerDetails = [
    customer?.contact_name,
    customer?.address,
    customer?.email,
    customer?.phone,
  ].filter(Boolean);
  const unitPrice = Number(order.price_per_cookie) || 0;
  const total = invoiceTotal(order);

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(order.invoice_reference)} - Jack's Cookies HQ</title>
  <style>
    :root { color: #173633; background: #fbf7ef; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, sans-serif; background: #fbf7ef; color: #173633; }
    main { max-width: 820px; margin: 0 auto; padding: 48px; background: #fffdf8; min-height: 100vh; }
    header { display: flex; justify-content: space-between; gap: 32px; border-bottom: 2px solid #decfb9; padding-bottom: 28px; }
    h1 { margin: 0; font-size: 44px; line-height: 1; color: #12312e; }
    h2 { margin: 0 0 10px; font-size: 18px; text-transform: uppercase; letter-spacing: 0.08em; color: #0f766e; }
    p { margin: 4px 0; }
    .meta { text-align: right; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin: 32px 0; }
    .box { border: 1px solid #decfb9; border-radius: 8px; padding: 18px; background: #fffaf1; }
    table { width: 100%; border-collapse: collapse; margin-top: 28px; }
    th, td { border-bottom: 1px solid #decfb9; padding: 14px 0; text-align: left; }
    th:last-child, td:last-child { text-align: right; }
    tfoot td { border-bottom: 0; font-size: 20px; font-weight: 800; }
    .status { display: inline-block; border-radius: 999px; padding: 8px 12px; background: ${order.payment_status === "paid" ? "#dff2e4" : "#fff2ee"}; color: ${order.payment_status === "paid" ? "#247345" : "#ae3f2d"}; font-weight: 800; text-transform: uppercase; }
    .notes { margin-top: 32px; color: #5d6964; }
    @media print {
      body { background: white; }
      main { padding: 28px; background: white; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>Jack's Cookies HQ</h1>
      </div>
      <div class="meta">
        <h2>Invoice</h2>
        <p><strong>${escapeHtml(order.invoice_reference)}</strong></p>
        <p>${escapeHtml(formatDate(order.delivery_date))}</p>
        <p><span class="status">${escapeHtml(order.payment_status)}</span></p>
      </div>
    </header>

    <section class="grid">
      <div class="box">
        <h2>Bill To</h2>
        <p><strong>${escapeHtml(customerName)}</strong></p>
        ${customerDetails.map((detail) => `<p>${escapeHtml(String(detail))}</p>`).join("")}
      </div>
      <div class="box">
        <h2>Order</h2>
        <p>Delivery: <strong>${escapeHtml(formatDate(order.delivery_date))}</strong></p>
        <p>Invoice type: ${escapeHtml(order.customer_type)}</p>
      </div>
    </section>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Qty</th>
          <th>Unit</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${escapeHtml(order.cookie_size)} cookies</td>
          <td>${Number(order.cookie_count).toLocaleString()}</td>
          <td>${escapeHtml(formatUnitMoney(unitPrice))}</td>
          <td>${escapeHtml(formatUnitMoney(total))}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3">Total</td>
          <td>${escapeHtml(formatUnitMoney(total))}</td>
        </tr>
      </tfoot>
    </table>

    ${order.notes ? `<p class="notes"><strong>Notes:</strong> ${escapeHtml(order.notes)}</p>` : ""}
  </main>
</body>
</html>`;
}

function buildInvoicePayload(order: OrderWithCustomer) {
  const customer = order.customer;
  const customerName = customer?.name ?? order.customer_name ?? "Customer";
  const customerDetails = [
    customer?.contact_name,
    customer?.address,
    customer?.email,
    customer?.phone,
  ].filter(Boolean).map(String);
  const unitPrice = Number(order.price_per_cookie) || 0;
  const total = invoiceTotal(order);

  return {
    invoiceReference: order.invoice_reference,
    deliveryDate: formatDate(order.delivery_date),
    paymentStatus: order.payment_status,
    customerName,
    customerDetails,
    description: `${order.cookie_size} cookies`,
    quantity: Number(order.cookie_count).toLocaleString(),
    unitPrice: formatUnitMoney(unitPrice),
    total: formatUnitMoney(total),
    notes: order.notes ?? "",
  };
}

function invoiceTotal(order: Pick<Order, "cookie_count" | "price_per_cookie" | "revenue">) {
  const calculated = Number(order.cookie_count) * Number(order.price_per_cookie);
  return roundMoney(calculated || Number(order.revenue) || 0);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeFileName(value: string) {
  return value.replace(/[^a-z0-9-]+/gi, "-").replace(/^-+|-+$/g, "") || "invoice";
}

const doughPreppedMarker = "[Dough prepped]";

function isDoughPrepped(order: Pick<Order, "dough_prepped" | "dough_prep">) {
  return Boolean(order.dough_prepped) || (order.dough_prep ?? "").startsWith(doughPreppedMarker);
}

function displayDoughPrep(value: string | null) {
  return (value ?? "").replace(doughPreppedMarker, "").trim();
}

function applyDoughPrepMarker(value: string | null, doughPrepped: boolean) {
  const cleanValue = displayDoughPrep(value);
  if (!doughPrepped) return blankToNull(cleanValue);
  return blankToNull(`${doughPreppedMarker} ${cleanValue}`.trim());
}

function orderProfit(order: Pick<Order, "revenue" | "cookie_count" | "cost_per_cookie">) {
  return roundMoney(Number(order.revenue) - Number(order.cookie_count) * Number(order.cost_per_cookie));
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function blankToNull(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function errorMessage(caught: unknown, fallback: string) {
  if (caught instanceof Error) return caught.message;
  if (caught && typeof caught === "object" && "message" in caught) {
    return String((caught as { message?: unknown }).message || fallback);
  }
  return fallback;
}

async function createInvoiceReference(configured: boolean, customer: Customer, deliveryDate: string) {
  if (customer.type === "individual") {
    return `${customer.name} - ${formatDate(deliveryDate)}`;
  }

  if (!customer.code) {
    throw new Error("Wholesale customers need an invoice prefix.");
  }

  if (!configured) {
    return `${customer.code}-PREVIEW`;
  }

  const { data, error } = await getSupabase().rpc("allocate_wholesale_invoice", {
    prefix_value: customer.code,
  });

  if (error) throw error;
  return data as string;
}
