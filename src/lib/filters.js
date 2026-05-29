// filters.js — pure filter/sort/search/planner functions. Extracted so they are
// testable and reusable across the App shell and the Planner.
//
// Contract (requirement-set.v1.md, C1 and C4):
//   R-C1.2-01: matchPlace is case-insensitive substring across endpoint, country, stations.
//   R-C1.3-01: AND-combine all active filters.
//   R-C1.3-02: amenities are all-of.
//   R-C1.3-03: scenicOnly threshold = 70.
//   R-C1.4-01: 6 sort orders.
//   R-C1.5-01: lucky falls back to the full catalog when filtered is empty.
//   R-C4.2-01: planner suggests a leg whose origin AND destination contain the stop names.

export function matchPlace(route, query, isOrigin) {
  if (!query) return true;
  const q = String(query).toLowerCase();
  const ep = (isOrigin ? route.origin : route.destination).toLowerCase();
  if (ep.includes(q)) return true;
  if ((route.country || "").toLowerCase().includes(q)) return true;
  if ((route.stations || []).some((s) => s.name.toLowerCase().includes(q))) return true;
  return false;
}

export function filterRoutes(routes, opts = {}) {
  const {
    fromQ = "",
    toQ = "",
    regions = new Set(),
    operators = new Set(),
    cats = new Set(),
    ams = new Set(),
    maxPrice = Infinity,
    scenicOnly = false,
  } = opts;
  const asSet = (s) => (s instanceof Set ? s : new Set(s));
  const R = asSet(regions), O = asSet(operators), C = asSet(cats), A = asSet(ams);
  return routes.filter((r) => {
    if (!matchPlace(r, fromQ, true)) return false;
    if (!matchPlace(r, toQ, false)) return false;
    if (R.size && !R.has(r.region)) return false;
    if (O.size && !O.has(r.operator)) return false;
    if (C.size && !C.has(r.category)) return false;
    if (A.size && ![...A].every((a) => r.amenities.includes(a))) return false;
    if (r.priceFrom > maxPrice) return false;
    if (scenicOnly && r.scenicScore < 70) return false;
    return true;
  });
}

export const SORTS = [
  { id: "scenic",   label: "Most scenic" },
  { id: "price",    label: "Lowest price" },
  { id: "duration", label: "Shortest trip" },
  { id: "distance", label: "Longest distance" },
  { id: "speed",    label: "Fastest" },
  { id: "climb",    label: "Most climb" },
];

const COMPARATORS = {
  scenic:   (a, b) => b.scenicScore - a.scenicScore,
  price:    (a, b) => a.priceFrom - b.priceFrom,
  duration: (a, b) => a.durationMin - b.durationMin,
  distance: (a, b) => b.distanceMi - a.distanceMi,
  speed:    (a, b) => b.topSpeedMph - a.topSpeedMph,
  climb:    (a, b) => b.elevGainFt - a.elevGainFt,
};

export function sortRoutes(routes, sortId) {
  const cmp = COMPARATORS[sortId] || COMPARATORS.scenic;
  return [...routes].sort(cmp);
}

export function comparatorFor(sortId) {
  return COMPARATORS[sortId] || COMPARATORS.scenic;
}

export function lucky(filtered, all, rand = Math.random) {
  const pool = filtered && filtered.length ? filtered : all;
  if (!pool || pool.length === 0) return null;
  return pool[Math.floor(rand() * pool.length)];
}

export function suggestLeg(fromStop, toStop, routes) {
  if (!fromStop || !toStop) return null;
  const f = String(fromStop).toLowerCase();
  const t = String(toStop).toLowerCase();
  return routes.find((r) => matchPlace(r, f, true) && matchPlace(r, t, false)) || null;
}
