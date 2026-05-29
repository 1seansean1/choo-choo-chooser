// worker/src/index.js — Cloudflare Worker that creates Stripe Checkout
// Sessions for the Choo Choo Chooser cart and returns the session URL.
//
// Routes:
//   POST  /api/checkout       — body: { items: [{ routeId, classIdx, adults, kids, roundTrip, date, time }, ...], email? }
//                                resp: { url, session_id }
//   GET   /api/session/:id    — proxy GET Stripe session by id (for the return page)
//   GET   /healthz            — liveness
//
// Secrets (set via `wrangler secret put`):
//   STRIPE_SECRET_KEY     — sk_test_... or sk_live_...
//
// Vars (in wrangler.toml):
//   ALLOWED_ORIGIN        — frontend origin (https://1seansean1.github.io)
//   SUCCESS_URL           — full URL incl. ?session_id={CHECKOUT_SESSION_ID}
//   CANCEL_URL            — full URL to return to on user-cancel
//
// Pricing is recomputed server-side from the bundled catalog. The client cannot
// influence the price by sending a `price` field — it is ignored.

import { ROUTES } from "./catalog.js";
import { SERVICE_FEE_PCT, FEE_MIN, ROUND_TRIP_SAVER } from "./catalog.js";

const STRIPE_API = "https://api.stripe.com/v1";

// ----- Stripe helpers --------------------------------------------------------

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

// Encode a flat object (with bracketed keys for arrays / nested) into
// application/x-www-form-urlencoded the way Stripe expects.
function form(params) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    u.append(k, String(v));
  }
  return u.toString();
}

// ----- pricing (recomputed server-side from bundled catalog) -----------------

function routeById(id) { return ROUTES.find((r) => r.id === id); }

function legBase(route, classIdx, adults, kids) {
  const idx = Math.min(Math.max(0, classIdx | 0), route.classes.length - 1);
  const base = route.classes[idx].price;
  const hasKid = (route.discounts || []).some((d) => /kid|child/i.test(d.name));
  const a = Math.max(1, Math.min(8, adults | 0));
  const k = Math.max(0, Math.min(8, kids | 0));
  return base * a + base * k * (hasKid ? 0.5 : 1);
}

function itemPrice(it) {
  const r = routeById(it.routeId);
  if (!r) throw new Error(`unknown route: ${it.routeId}`);
  const one = legBase(r, it.classIdx, it.adults, it.kids);
  const price = it.roundTrip ? one * 2 * (1 - ROUND_TRIP_SAVER) : one;
  return Math.round(price * 100); // cents
}

// ----- handlers --------------------------------------------------------------

const corsHeaders = (origin) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "600",
});

function json(body, init = {}, origin = "*") {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
      ...(init.headers || {}),
    },
  });
}

async function handleCheckout(req, env, origin) {
  const body = await req.json();
  const items = Array.isArray(body.items) ? body.items.slice(0, 12) : [];
  if (items.length === 0) return json({ error: "no items" }, { status: 400 }, origin);

  // Build Stripe line_items from the cart, recomputing prices.
  const lineItems = items.map((it) => {
    const r = routeById(it.routeId);
    if (!r) throw new Error(`unknown route: ${it.routeId}`);
    const amount = itemPrice(it);
    const classIdx = Math.min(Math.max(0, it.classIdx | 0), r.classes.length - 1);
    const cls = r.classes[classIdx];
    const pax = `${Math.max(1, it.adults | 0)} adult${(it.adults | 0) > 1 ? "s" : ""}` +
                ((it.kids | 0) > 0 ? ` + ${it.kids} kid${(it.kids | 0) > 1 ? "s" : ""}` : "");
    return {
      amount,
      currency: "usd",
      product_data_name: `${r.name} — ${cls.name}${it.roundTrip ? " (round trip)" : ""}`,
      product_data_description: `${r.origin} → ${r.destination} · ${pax}${it.date ? " · " + it.date : ""}`,
      product_data_metadata_route_id: r.id,
      product_data_metadata_class_idx: String(classIdx),
      product_data_metadata_round_trip: String(!!it.roundTrip),
    };
  });

  // Service fee — 5% of subtotal, $0.50 floor (matches client-side cartTotals).
  const subtotalCents = lineItems.reduce((s, li) => s + li.amount, 0);
  const feeCents = Math.max(Math.round(FEE_MIN * 100), Math.round(subtotalCents * SERVICE_FEE_PCT));

  // Compose Stripe form body. Stripe's API takes nested brackets for arrays.
  const params = {
    mode: "payment",
    success_url: env.SUCCESS_URL,
    cancel_url: env.CANCEL_URL,
    "automatic_tax[enabled]": "false",
    "billing_address_collection": "auto",
    "payment_method_types[0]": "card",
  };
  if (body.email && typeof body.email === "string") params.customer_email = body.email.slice(0, 200);

  lineItems.forEach((li, i) => {
    params[`line_items[${i}][quantity]`] = "1";
    params[`line_items[${i}][price_data][currency]`] = li.currency;
    params[`line_items[${i}][price_data][unit_amount]`] = String(li.amount);
    params[`line_items[${i}][price_data][product_data][name]`] = li.product_data_name;
    params[`line_items[${i}][price_data][product_data][description]`] = li.product_data_description;
    params[`line_items[${i}][price_data][product_data][metadata][route_id]`] = li.product_data_metadata_route_id;
    params[`line_items[${i}][price_data][product_data][metadata][class_idx]`] = li.product_data_metadata_class_idx;
    params[`line_items[${i}][price_data][product_data][metadata][round_trip]`] = li.product_data_metadata_round_trip;
  });

  // Service fee as its own line item.
  const feeIdx = lineItems.length;
  params[`line_items[${feeIdx}][quantity]`] = "1";
  params[`line_items[${feeIdx}][price_data][currency]`] = "usd";
  params[`line_items[${feeIdx}][price_data][unit_amount]`] = String(feeCents);
  params[`line_items[${feeIdx}][price_data][product_data][name]`] = "Service fee";
  params[`line_items[${feeIdx}][price_data][product_data][description]`] = "5% with $0.50 floor";

  const session = await stripeFetch(env.STRIPE_SECRET_KEY, "/checkout/sessions", {
    method: "POST",
    body: form(params),
  });

  return json({ url: session.url, session_id: session.id }, {}, origin);
}

async function handleSessionGet(env, sessionId, origin) {
  if (!/^cs_(test|live)_[A-Za-z0-9_]+$/.test(sessionId)) {
    return json({ error: "bad session id" }, { status: 400 }, origin);
  }
  const s = await stripeFetch(env.STRIPE_SECRET_KEY,
    `/checkout/sessions/${encodeURIComponent(sessionId)}`);
  return json({
    id: s.id,
    status: s.status,
    payment_status: s.payment_status,
    amount_total: s.amount_total,
    currency: s.currency,
    customer_email: s.customer_details?.email || s.customer_email,
    payment_intent: s.payment_intent,
    livemode: s.livemode,
  }, {}, origin);
}

// ----- entry -----------------------------------------------------------------

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const reqOrigin = req.headers.get("origin") || "";
    const allowed = (env.ALLOWED_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
    const echoOrigin = allowed.includes(reqOrigin) ? reqOrigin : (allowed[0] || "*");

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(echoOrigin) });
    }

    try {
      if (url.pathname === "/healthz") {
        return json({ ok: true, livemode: env.STRIPE_SECRET_KEY?.startsWith("sk_live_") || false }, {}, echoOrigin);
      }
      if (url.pathname === "/api/checkout" && req.method === "POST") {
        return await handleCheckout(req, env, echoOrigin);
      }
      const m = url.pathname.match(/^\/api\/session\/(cs_(test|live)_[A-Za-z0-9_]+)$/);
      if (m && req.method === "GET") {
        return await handleSessionGet(env, m[1], echoOrigin);
      }
      return json({ error: "not found" }, { status: 404 }, echoOrigin);
    } catch (e) {
      return json({ error: e.message || "internal error" }, { status: e.status || 500 }, echoOrigin);
    }
  },
};
