// preferences.js — turn free-text traveler preferences into a structured object.
// Mirrors store.jsx in the prototype; carved out so it's testable in isolation.
//
// Contract (requirement-set.v1.md, C6):
//   R-C6.2-01: parse free text; LLM path when available, deterministic heuristic
//              fallback that NEVER throws.
//   R-C6.2-02: keep() filters LLM output to the catalog's actual values.
//   R-C6.3-01: notices() returns at most 6 deal entries ordered by score desc.

export function catalogFacets(routes, regions) {
  return {
    regions: [...regions],
    providers: [...new Set(routes.map((r) => r.operator))],
    categories: [...new Set(routes.map((r) => r.category))],
  };
}

export function keep(arr, allow) {
  return Array.isArray(arr) ? arr.filter((x) => allow.includes(x)) : [];
}

export function heuristicPrefs(text, facets) {
  const t = String(text || "").toLowerCase();
  const f = facets || { regions: [], providers: [], categories: [] };

  const regions = f.regions.filter((r) => {
    const n = r.toLowerCase();
    return (
      t.includes(n) ||
      (n.includes("north america") && /(usa|america|states|canada)/.test(t)) ||
      (n === "europe" && /europe|alps|swiss|france|italy|spain|norway/.test(t)) ||
      (n === "asia" && /asia|japan|china|india|korea|vietnam|tibet/.test(t))
    );
  });
  const providers = f.providers.filter((p) => t.includes(p.toLowerCase()));
  const categories = f.categories.filter((c) =>
    t.includes(c.toLowerCase().replace("-", " ")) || t.includes(c.toLowerCase()),
  );
  if (/scenic|view|mountain|panoram|landscape|beautiful/.test(t) && !categories.includes("Scenic")) categories.push("Scenic");
  if (/luxury|luxe|first class|premium/.test(t) && !categories.includes("Luxury")) categories.push("Luxury");
  if (/sleeper|overnight|night train|night-train/.test(t) && !categories.includes("Sleeper")) categories.push("Sleeper");
  if (/fast|high.?speed|bullet|quick/.test(t) && !categories.includes("High-speed")) categories.push("High-speed");

  const pm = t.match(/\$?\s?(\d{2,5})/);
  const maxPrice = /under|below|less than|budget|max|cheap/.test(t) && pm ? +pm[1] : null;
  const scenicOnly = /scenic|most scenic|views|mountain/.test(t);

  const interests = [];
  ["scenic","mountain","luxury","high-speed","sleeper","coastal","historic","night train","budget"].forEach((k) => {
    if (t.includes(k.split(" ")[0])) interests.push(k);
  });

  return {
    regions,
    providers,
    categories,
    maxPrice,
    scenicOnly,
    interests: interests.slice(0, 6),
    source: "heuristic",
  };
}

export async function llmPrefs(text, facets, llm) {
  if (!llm || typeof llm.complete !== "function") throw new Error("no llm");
  const prompt =
    "You are a backend preference parser for a global train booking site. " +
    "Convert the traveler's free-text preferences into compact JSON ONLY (no prose, no markdown).\n" +
    "Allowed regions: " + JSON.stringify(facets.regions) + "\n" +
    "Allowed providers: " + JSON.stringify(facets.providers) + "\n" +
    "Allowed categories: " + JSON.stringify(facets.categories) + "\n" +
    'Output keys: regions (array subset), providers (array subset), categories (array subset), ' +
    'maxPrice (number USD or null), scenicOnly (boolean), interests (array of 2-5 short lowercase keywords).\n' +
    'Only include values clearly implied. Traveler text: """' + String(text).slice(0, 600) + '"""\nJSON:';
  const raw = await llm.complete(prompt);
  const m = String(raw).match(/\{[\s\S]*\}/);
  if (!m) throw new Error("no json");
  const j = JSON.parse(m[0]);
  return {
    regions: keep(j.regions, facets.regions),
    providers: keep(j.providers, facets.providers),
    categories: keep(j.categories, facets.categories),
    maxPrice: typeof j.maxPrice === "number" && j.maxPrice > 0 ? j.maxPrice : null,
    scenicOnly: !!j.scenicOnly,
    interests: Array.isArray(j.interests) ? j.interests.slice(0, 6).map((s) => String(s).toLowerCase()) : [],
    source: "ai",
  };
}

export function notices(prefs, routes, max = 6) {
  const matches = (r) => {
    if (prefs.regions.length && !prefs.regions.includes(r.region)) return false;
    if (prefs.providers.length && !prefs.providers.includes(r.operator)) return false;
    if (prefs.categories.length && !prefs.categories.includes(r.category)) return false;
    if (prefs.scenicOnly && r.scenicScore < 70) return false;
    if (prefs.maxPrice && r.priceFrom > prefs.maxPrice) return false;
    return true;
  };
  const any =
    prefs.regions.length ||
    prefs.providers.length ||
    prefs.categories.length ||
    prefs.scenicOnly ||
    prefs.maxPrice;
  const out = [];
  routes.forEach((r) => {
    if (any && !matches(r)) return;
    const best = (r.discounts || []).filter((d) => d.pct > 0).sort((a, b) => b.pct - a.pct)[0];
    if (!best) return;
    out.push({
      id: r.id + "_" + best.pct,
      routeId: r.id,
      name: r.name,
      region: r.region,
      origin: r.origin,
      destination: r.destination,
      pct: best.pct,
      deal: best.name,
      score: best.pct + (prefs.scenicOnly ? r.scenicScore / 10 : 0),
    });
  });
  return out.sort((a, b) => b.score - a.score).slice(0, max);
}
