// booking.js — turn a route into the outbound URL we send the customer to,
// wrapping in the right affiliate-network deep link when an ID is configured.
//
// Contract:
//   - bookingUrl(route, config) returns a string URL or null.
//   - When no operator entry exists, returns null (caller hides the button).
//   - When an entry exists but no affiliateId is set, returns the operator's
//     direct deep link (no commission, but a working "Book on X" UX).
//   - When an entry exists and affiliateId is filled, wraps via the named
//     network's template.

export function bookingUrl(route, config) {
  if (!route || !config || !config.operators) return null;
  const op = config.operators[route.operator];
  if (!op) return null;

  const target = op.search || op.home;
  if (!target) return null;

  const networkName = op.network || "direct";
  const network = config.networks && config.networks[networkName];

  if (!network || !network.wrap || !op.affiliateId) {
    return target;
  }

  let url = String(network.template || target);
  url = url
    .replace("{affiliateId}",  encodeURIComponent(op.affiliateId))
    .replace("{merchantId}",   encodeURIComponent(op.merchantId || ""))
    .replace("{advertiserId}", encodeURIComponent(op.advertiserId || ""))
    .replace("{target}",       encodeURIComponent(target));
  return url;
}

export function bookingLabel(route, config) {
  if (!route) return "Continue";
  const op = config && config.operators && config.operators[route.operator];
  const name = (op && op.shortName) || route.operator || "operator";
  return `Continue on ${name}`;
}

export function tipJarUrl(config) {
  return (config && config.tipJar && config.tipJar.stripePaymentLinkUrl) || "";
}

export function isAffiliateMonetized(operator, config) {
  if (!operator || !config) return false;
  const op = config.operators && config.operators[operator];
  if (!op) return false;
  return !!(op.affiliateId && op.network && op.network !== "direct");
}

// Coverage summary for the README / docs / debug output.
export function coverageSummary(operators, config) {
  const out = { total: 0, byNetwork: {}, monetized: 0, direct: 0, missing: [] };
  for (const op of operators) {
    out.total++;
    const cfg = config.operators[op];
    if (!cfg) {
      out.missing.push(op);
      continue;
    }
    const n = cfg.network || "direct";
    out.byNetwork[n] = (out.byNetwork[n] || 0) + 1;
    if (cfg.affiliateId && n !== "direct") out.monetized++;
    else out.direct++;
  }
  return out;
}
