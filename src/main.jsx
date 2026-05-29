// main.jsx — production entry. Wires the ESM data/lib modules into the
// window globals the original component files expect, then loads them.

import React from "react";
import ReactDOM from "react-dom/client";

import { AM, REGIONS, REGION_COLORS, routeColor, ROUTES } from "./data/index.js";
import { createStore, makeUseStore, CCCPrice, money } from "./lib/store.js";
import routeImagesDoc from "./data/route-images.json";
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

// Store + price + formatter + hook. window.claude is provided by the Claude.ai
// artifact runtime; outside it, preference parsing falls back to the heuristic.
const store = createStore(ROUTES, REGIONS, typeof window !== "undefined" ? window.claude : null);
window.Store    = store;
window.useStore = makeUseStore(store);
window.CCCPrice = CCCPrice;
window.money    = money;

// --- load the components (defines App + sibling components in module scope) --
import { App } from "./all.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
