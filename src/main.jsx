// main.jsx — production entry. Wires the ESM data/lib modules into the
// window globals the original component files expect, then loads them.

import React from "react";
import ReactDOM from "react-dom/client";

import { AM, REGIONS, REGION_COLORS, routeColor, ROUTES } from "./data/index.js";
import { createStore, makeUseStore, CCCPrice, money } from "./lib/store.js";
import { bookingUrl, bookingLabel, tipJarUrl, isAffiliateMonetized } from "./lib/booking.js";
import routeImagesDoc from "./data/route-images.json";
import affiliateConfig from "./data/affiliate-links.json";
import "./styles.css";

// --- legacy global shape expected by the components --------------------------
window.RAIL = {
  AM,
  regions: REGIONS,
  regionColors: REGION_COLORS,
  routes: ROUTES,
  add() { /* no-op: catalog is ESM-loaded at module init */ },
};
window.routeColor = routeColor;
// Back-compat alias for any leftover references in the prototype.
window.OP_COLORS = new Proxy({}, { get: () => REGION_COLORS["North America"] });

// Real-photo hero per route, sourced from Wikipedia summary thumbnails. The
// Card/Detail components look up by route.id and fall back to <Scene/>.
window.ROUTE_IMAGES = routeImagesDoc.images;

// Affiliate-network config. The frontend reads this to build outbound booking
// links; if affiliateIds are populated, links wrap through the named network
// so the operator pays commission on completed bookings.
window.AFFILIATE_CONFIG = affiliateConfig;
window.bookingUrl   = (route) => bookingUrl(route, affiliateConfig);
window.bookingLabel = (route) => bookingLabel(route, affiliateConfig);
window.tipJarUrl    = () => tipJarUrl(affiliateConfig);
window.isAffiliateMonetized = (operator) => isAffiliateMonetized(operator, affiliateConfig);

// Stripe Checkout backend wiring. Set at build time via VITE_CHECKOUT_API_URL:
//   unset / "" -> mock fallback (portfolio mode, no real backend)
//   "self" / "/" -> same-origin (Vercel deploy with /api routes)
//   "https://...workers.dev" -> cross-origin (Cloudflare Worker deploy)
{
  const raw = (import.meta.env.VITE_CHECKOUT_API_URL || "").trim();
  if (raw === "" || raw === "mock") {
    window.CHECKOUT_API_URL = "";
    window.CHECKOUT_API_ENABLED = false;
  } else if (raw === "self" || raw === "/") {
    window.CHECKOUT_API_URL = "";    // relative -> same-origin /api/checkout
    window.CHECKOUT_API_ENABLED = true;
  } else {
    window.CHECKOUT_API_URL = raw.replace(/\/$/, "");
    window.CHECKOUT_API_ENABLED = true;
  }
}

// Store + price + formatter + hook. window.claude is provided by the Claude.ai
// artifact runtime; outside it, preference parsing falls back to the heuristic.
const store = createStore(ROUTES, REGIONS, typeof window !== "undefined" ? window.claude : null);
window.Store    = store;
window.useStore = makeUseStore(store);
// CCCPrice is exported as pure functions that take (items, routes); the legacy
// callsites in cart.jsx/checkout.jsx/detail.jsx invoke them without `routes`,
// so we bind ROUTES here.
window.CCCPrice = {
  itemPrice:  (it)    => CCCPrice.itemPrice(it, ROUTES),
  cartTotals: (items) => CCCPrice.cartTotals(items, ROUTES),
  legBase:    CCCPrice.legBase,
  routeById:  (id)    => CCCPrice.routeById(ROUTES, id),
};
window.money    = money;

// --- load the components (defines App + sibling components in module scope) --
import { App } from "./all.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
