"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";

const cookieName = "The Everyday";
const regularPrice = 3;
const deliveryFee = 6;
const standardMinimum = 3;
const eventMinimum = 24;
const maximumQuantity = 1000;

type Fulfillment = "pickup" | "delivery";
type OrderMode = "standard" | "event";
type PickupDay = {
  label: string;
  value: string;
  cutoffLabel: string;
};

const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function PublicOrderForm() {
  const [mode, setMode] = useState<OrderMode>("standard");
  const [fulfillment, setFulfillment] = useState<Fulfillment>("pickup");
  const [quantityInput, setQuantityInput] = useState("12");
  const [submitted, setSubmitted] = useState<OrderMode | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const pickupDays = useMemo(() => getAvailablePickupDays(new Date()), []);
  const unitPrice = regularPrice;
  const quantity = normalizeQuantity(quantityInput, standardMinimum);
  const subtotal = quantity * unitPrice;
  const total = subtotal + (fulfillment === "delivery" ? deliveryFee : 0);

  useEffect(() => {
    function syncModeFromHash() {
      if (window.location.hash === "#event-order") {
        setMode("event");
        setSubmitted(null);
      }
    }

    syncModeFromHash();
    window.addEventListener("hashchange", syncModeFromHash);

    return () => window.removeEventListener("hashchange", syncModeFromHash);
  }, []);

  async function handleStandardSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await submitPublicOrder({
      mode: "standard",
      name: formValue(data, "name"),
      email: formValue(data, "email"),
      phone: formValue(data, "phone"),
      quantity,
      requestedDate: formValue(data, "pickup_day"),
      fulfillment,
      deliveryAddress: formValue(data, "delivery_address"),
      payment: formValue(data, "payment"),
      notes: formValue(data, "notes"),
    });
  }

  async function handleEventSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await submitPublicOrder({
      mode: "event",
      name: formValue(data, "event_name"),
      email: formValue(data, "event_email"),
      phone: formValue(data, "event_phone"),
      quantity: Number(formValue(data, "event_quantity")),
      requestedDate: formValue(data, "event_date"),
      eventLocation: formValue(data, "event_location"),
      occasion: formValue(data, "occasion"),
      eventStyle: formValue(data, "event_style"),
      payment: formValue(data, "event_payment"),
      notes: formValue(data, "event_notes"),
    });
  }

  async function submitPublicOrder(payload: Record<string, unknown>) {
    setSubmitting(true);
    setSubmitError("");
    setSubmitted(null);

    try {
      const result = await fetch("/api/public-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await result.json();

      if (!result.ok) {
        throw new Error(data.error || "Unable to submit order.");
      }

      setSubmitted(payload.mode === "event" ? "event" : "standard");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to submit order.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ordering-experience" id="event-order">
      <div className="order-mode-row" aria-label="Order type">
        <button
          className={mode === "standard" ? "mode-button active" : "mode-button"}
          type="button"
          onClick={() => {
            setMode("standard");
            setSubmitted(null);
          }}
        >
          Tuesday/Friday Pre-Orders
        </button>
        <button
          className={mode === "event" ? "mode-button active" : "mode-button"}
          type="button"
          onClick={() => {
            setMode("event");
            setSubmitted(null);
          }}
        >
          Event Orders (24+)
        </button>
      </div>

      {mode === "standard" ? (
        <form className="order-form" onSubmit={handleStandardSubmit}>
          <div className="order-summary-card">
            <div>
              <h3 className="art-heading everyday-art-heading">
                <span>{cookieName}</span>
                <Image src="/brand/headlines/the-everyday-solid-teal.png" alt="" width={1751} height={422} />
              </h3>
              <p>Fresh Tuesday and Friday.</p>
            </div>
            <div className="price-total" aria-live="polite">
              <span>
                {formatMoney(unitPrice)} each
                {fulfillment === "delivery" ? ` + ${formatMoney(deliveryFee)} delivery` : ""}
              </span>
              <strong>{formatMoney(total)}</strong>
            </div>
          </div>

          <label className="quantity-field">
            Quantity
            <input
              name="quantity"
              type="number"
              min={standardMinimum}
              max={maximumQuantity}
              step={1}
              value={quantityInput}
              onChange={(event) => {
                setQuantityInput(sanitizeQuantityInput(event.target.value));
              }}
              onBlur={() => {
                setQuantityInput(String(normalizeQuantity(quantityInput, standardMinimum)));
              }}
              required
            />
            <span>$3 per cookie.</span>
          </label>

          <fieldset className="date-select-field" aria-label="Date">
            {pickupDays.length > 0 ? (
              <label>
                Date
                <select name="pickup_day" defaultValue={pickupDays[0]?.value} required>
                  {pickupDays.map((day) => (
                    <option value={day.value} key={day.value}>
                      {day.label} - order by {day.cutoffLabel}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="form-note warning">
                This week&apos;s order windows are closed. Please check back soon.
              </p>
            )}
          </fieldset>

          <div className="form-options-grid">
            <label>
              Pickup or delivery
              <select
                name="fulfillment"
                value={fulfillment}
                onChange={(event) => setFulfillment(event.target.value as Fulfillment)}
              >
                <option value="pickup">Pickup — free</option>
                <option value="delivery">Local delivery — $6</option>
              </select>
            </label>

            <label>
              Payment
              <select name="payment" defaultValue="card">
                <option value="card">Credit card</option>
                <option value="venmo">Venmo @jacks-cookies</option>
                <option value="cash">Cash</option>
              </select>
            </label>
          </div>

          {fulfillment === "delivery" ? (
            <label>
              Delivery address
              <input
                name="delivery_address"
                autoComplete="street-address"
                placeholder="Street address, town, ZIP"
                required
              />
            </label>
          ) : null}

          <div className="public-form-grid">
            <label>
              Name
              <input name="name" autoComplete="name" required />
            </label>
            <label>
              Email
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              Phone
              <input name="phone" type="tel" autoComplete="tel" required />
            </label>
          </div>

          <details className="optional-notes">
            <summary>Add a note <span>(optional)</span></summary>
            <label className="notes-field">
              Notes
              <textarea
                name="notes"
                rows={3}
                placeholder="Gift message, delivery timing, or anything Jack should know."
              />
            </label>
          </details>

          <button className="public-button primary submit-button" disabled={submitting} type="submit">
            {submitting ? "Sending..." : "Send order request"}
          </button>

          {submitted === "standard" ? (
            <p className="success-message" role="status">
              Order request received. We&apos;ll email you soon to confirm
              payment and order details.
            </p>
          ) : null}
          {submitError ? (
            <p className="success-message error-message" role="alert">
              {submitError}
            </p>
          ) : null}
        </form>
      ) : (
        <form className="order-form event-form" onSubmit={handleEventSubmit}>
          <div className="order-summary-card">
            <div>
              <h3 className="art-heading event-art-heading">
                <span>Planning an Event?</span>
                <Image
                  src="/brand/headlines/planning-an-event-solid-teal.png"
                  alt=""
                  width={2150}
                  height={393}
                />
              </h3>
              <p>Cookies, cookie cart, or both.</p>
            </div>
          </div>

          <label className="quantity-field">
            Quantity
            <input
              name="event_quantity"
              type="number"
              min={eventMinimum}
              step={1}
              defaultValue={eventMinimum}
              required
            />
            <span>Event orders start at 24 cookies.</span>
          </label>

          <div className="public-form-grid">
            <label>
              Requested date
              <input name="event_date" type="date" required />
            </label>
            <label>
              Event location
              <input name="event_location" placeholder="Venue, office, or home address" required />
            </label>
            <label>
              Occasion
              <input name="occasion" placeholder="Birthday, office, client gift..." required />
            </label>
          </div>

          <label className="event-style-field">
            Event style
            <select name="event_style" defaultValue="cookies_only">
              <option value="cookies_only">Cookies only</option>
              <option value="cookie_cart">Cookie cart — subject to availability</option>
              <option value="not_sure">Not sure yet</option>
            </select>
          </label>

          <div className="public-form-grid">
            <label>
              Name
              <input name="event_name" autoComplete="name" required />
            </label>
            <label>
              Email
              <input name="event_email" type="email" autoComplete="email" required />
            </label>
            <label>
              Phone
              <input name="event_phone" type="tel" autoComplete="tel" required />
            </label>
          </div>

          <input name="event_payment" type="hidden" value="confirmed_later" />

          <details className="optional-notes">
            <summary>Add a note <span>(optional)</span></summary>
            <label className="notes-field">
              Notes
              <textarea
                name="event_notes"
                rows={4}
                placeholder="Timing, delivery details, packaging needs, or anything helpful."
              />
            </label>
          </details>

          <button className="public-button primary submit-button" disabled={submitting} type="submit">
            {submitting ? "Sending..." : "Send event request"}
          </button>

          {submitted === "event" ? (
            <p className="success-message" role="status">
              Event request received. We&apos;ll email you soon to confirm
              availability, payment, and order details.
            </p>
          ) : null}
          {submitError ? (
            <p className="success-message error-message" role="alert">
              {submitError}
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}

function formValue(data: FormData, key: string) {
  const value = data.get(key);
  return typeof value === "string" ? value : "";
}

function sanitizeQuantityInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 4);
}

function normalizeQuantity(value: string, minimum: number) {
  const quantity = Number(value);

  if (!Number.isFinite(quantity)) return minimum;
  return Math.min(maximumQuantity, Math.max(minimum, Math.floor(quantity)));
}

function getAvailablePickupDays(now: Date): PickupDay[] {
  const days: PickupDay[] = [];
  const cursor = startOfDay(now);

  for (let offset = 0; offset < 28 && days.length < 4; offset += 1) {
    const candidate = addDays(cursor, offset);
    const day = candidate.getDay();

    if (day !== 2 && day !== 5) continue;

    const cutoff = getCutoff(candidate);
    if (now > cutoff) continue;

    days.push({
      label: formatPickupDate(candidate),
      value: toDateValue(candidate),
      cutoffLabel: formatCutoff(cutoff),
    });
  }

  return days;
}

function getCutoff(pickupDay: Date) {
  const cutoff = new Date(pickupDay);

  if (pickupDay.getDay() === 2) {
    cutoff.setDate(pickupDay.getDate() - 2);
  } else {
    cutoff.setDate(pickupDay.getDate() - 2);
  }

  cutoff.setHours(23, 59, 59, 999);
  return cutoff;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatPickupDate(date: Date) {
  return `${dayLabels[date.getDay()]}, ${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;
}

function formatCutoff(date: Date) {
  return `${dayLabels[date.getDay()]} at 11:59 PM`;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
