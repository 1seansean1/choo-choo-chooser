// pricing.js — pure pricing functions extracted from the prototype's store.jsx.
//
// Contract (from requirement-set.v1.md, capability C5):
//   R-C5.1-01: round-trip saver = 10%
//   R-C5.1-02: kid discount 50% when route's discounts list includes a kid/child entry
//   R-C5.3-01: service fee = 5% of subtotal, floor of $0.50, on any non-empty cart
//   R-C5.3-02: all monetary outputs are 2-decimal-precise

export const SERVICE_FEE_PCT  = 0.05;
export const FEE_MIN          = 0.50;
export const ROUND_TRIP_SAVER = 0.10;

export function routeById(routes, id) {
  return routes.find((r) => r.id === id);
}

export function legBase(route, classIdx, adults, kids) {
  if (!route) return 0;
  const idx = Math.min(classIdx, route.classes.length - 1);
  const base = route.classes[idx].price;
  const hasKid = (route.discounts || []).some((d) => /kid|child/i.test(d.name));
  const a = adults || 1;
  const k = kids || 0;
  return base * a + base * k * (hasKid ? 0.5 : 1);
}

export function itemPrice(it, routes) {
  const r = it.route || routeById(routes, it.routeId);
  const one = legBase(r, it.classIdx, it.adults, it.kids);
  if (it.roundTrip) return +(one * 2 * (1 - ROUND_TRIP_SAVER)).toFixed(2);
  return +one.toFixed(2);
}

export function cartTotals(items, routes) {
  const subtotal = items.reduce((s, it) => s + itemPrice(it, routes), 0);
  const fee = items.length
    ? Math.max(FEE_MIN, +(subtotal * SERVICE_FEE_PCT).toFixed(2))
    : 0;
  return {
    subtotal: +subtotal.toFixed(2),
    fee,
    total: +(subtotal + fee).toFixed(2),
  };
}

export const money = (n) =>
  "$" + (n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
