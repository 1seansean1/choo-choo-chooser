// api/checkout.js — Vercel serverless function. Creates a Stripe Checkout
// Session for the cart payload. Pricing is recomputed server-side from the
// bundled catalog; the client cannot influence the unit_amount.
//
// Env vars (set in Vercel dashboard or via `vercel env add`):
//   STRIPE_SECRET_KEY     — sk_test_... or sk_live_...
//
// Returns { url, session_id }.

import { ROUTES, SERVICE_FEE_PCT, FEE_MIN, ROUND_TRIP_SAVER } from "./_lib/catalog.js";

const STRIPE_API = "https://api.stripe.com/v1";

async function stripeFetch(secretKey, path, init = {}) {
  const r = await fetch(`${STRIPE_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...(init.headers || {}),
    },
  });
  const text = await r.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { raw: text }; }
  if (!r.ok) {
    const err = new Error(`stripe ${path} ${r.status}: ${body.error?.message || text}`);
    err.status = r.status;
    err.detail = body;
    throw err;
  }
  return body;
}

function routeById(id) { return ROUTES.find((r) => r.id === id); }

function legBase(route, classIdx, adults, kids) {
  const idx = Math.min(Math.max(0, classIdx | 0), route.classes.length - 1);
  const base = route.classes[idx].price;
  const hasKid = (route.discounts || []).some((d) => /kid|child/i.test(d.name));
  const a = Math.max(1, Math.min(8, adults | 0));
  const k = Math.max(0, Math.min(8, kids | 0));
  return base * a + base * k * (hasKid ? 0.5 : 1);
}

function itemPriceCents(it) {
  const r = routeById(it.routeId);
  if (!r) throw new Error(`unknown route: ${it.routeId}`);
  const one = legBase(r, it.classIdx, it.adults, it.kids);
  const price = it.roundTrip ? one * 2 * (1 - ROUND_TRIP_SAVER) : one;
  return Math.round(price * 100);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    res.status(500).json({ error: "STRIPE_SECRET_KEY not configured" });
    return;
  }

  try {
    const body = req.body || {};
    const items = Array.isArray(body.items) ? body.items.slice(0, 12) : [];
    if (items.length === 0) {
      res.status(400).json({ error: "no items" });
      return;
    }

    // Build line items with server-recomputed prices.
    const lineItems = items.map((it) => {
      const r = routeById(it.routeId);
      if (!r) throw new Error(`unknown route: ${it.routeId}`);
      const amount = itemPriceCents(it);
      const classIdx = Math.min(Math.max(0, it.classIdx | 0), r.classes.length - 1);
      const cls = r.classes[classIdx];
      const pax = `${Math.max(1, it.adults | 0)} adult${(it.adults | 0) > 1 ? "s" : ""}` +
                  ((it.kids | 0) > 0 ? ` + ${it.kids} kid${(it.kids | 0) > 1 ? "s" : ""}` : "");
      return {
        amount,
        currency: "usd",
        name: `${r.name} — ${cls.name}${it.roundTrip ? " (round trip)" : ""}`,
        description: `${r.origin} → ${r.destination} · ${pax}${it.date ? " · " + it.date : ""}`,
        routeId: r.id,
        classIdx,
        roundTrip: !!it.roundTrip,
      };
    });

    const subtotalCents = lineItems.reduce((s, li) => s + li.amount, 0);
    const feeCents = Math.max(Math.round(FEE_MIN * 100), Math.round(subtotalCents * SERVICE_FEE_PCT));

    const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const origin = `${proto}://${host}`;
    const returnTo = body.return_to || origin;

    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("success_url", `${returnTo}?session_id={CHECKOUT_SESSION_ID}`);
    params.append("cancel_url", `${returnTo}?checkout=cancelled`);
    params.append("billing_address_collection", "auto");
    params.append("payment_method_types[0]", "card");
    if (body.email && typeof body.email === "string") {
      params.append("customer_email", body.email.slice(0, 200));
    }

    lineItems.forEach((li, i) => {
      params.append(`line_items[${i}][quantity]`, "1");
      params.append(`line_items[${i}][price_data][currency]`, li.currency);
      params.append(`line_items[${i}][price_data][unit_amount]`, String(li.amount));
      params.append(`line_items[${i}][price_data][product_data][name]`, li.name);
      params.append(`line_items[${i}][price_data][product_data][description]`, li.description);
      params.append(`line_items[${i}][price_data][product_data][metadata][route_id]`, li.routeId);
      params.append(`line_items[${i}][price_data][product_data][metadata][class_idx]`, String(li.classIdx));
      params.append(`line_items[${i}][price_data][product_data][metadata][round_trip]`, String(li.roundTrip));
    });

    const feeIdx = lineItems.length;
    params.append(`line_items[${feeIdx}][quantity]`, "1");
    params.append(`line_items[${feeIdx}][price_data][currency]`, "usd");
    params.append(`line_items[${feeIdx}][price_data][unit_amount]`, String(feeCents));
    params.append(`line_items[${feeIdx}][price_data][product_data][name]`, "Service fee");
    params.append(`line_items[${feeIdx}][price_data][product_data][description]`, "5% with $0.50 floor");

    const session = await stripeFetch(process.env.STRIPE_SECRET_KEY, "/checkout/sessions", {
      method: "POST",
      body: params.toString(),
    });
    res.status(200).json({ url: session.url, session_id: session.id });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || "internal error" });
  }
}
