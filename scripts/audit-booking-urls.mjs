// scripts/audit-booking-urls.mjs
//
// Probe every operator's home + search URL in affiliate-links.json. Reports:
//   ok      <op>  HEAD 200, no redirect to home/parking
//   redirect <op>  HEAD 200 but ended at a different URL
//   bad     <op>  4xx/5xx/timeout
// Writes results to docs/booking-url-audit.json with timestamps so we can diff.

import { readFileSync, writeFileSync } from "node:fs";

const cfg = JSON.parse(readFileSync("src/data/affiliate-links.json", "utf8"));

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36";

async function probe(url, kind, op) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, {
      method: "GET",   // some sites 405 on HEAD
      redirect: "follow",
      headers: {
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(15000),
    });
    const finalUrl = r.url;
    const ms = Date.now() - t0;
    return {
      op, kind, url, status: r.status, finalUrl,
      redirected: finalUrl !== url,
      ms,
      contentType: r.headers.get("content-type") || "",
    };
  } catch (e) {
    return { op, kind, url, error: e.message, ms: Date.now() - t0 };
  }
}

const targets = [];
for (const [op, c] of Object.entries(cfg.operators)) {
  if (c.home)   targets.push({ op, kind: "home",   url: c.home });
  if (c.search && c.search !== c.home) targets.push({ op, kind: "search", url: c.search });
}

console.log(`Probing ${targets.length} URLs across ${Object.keys(cfg.operators).length} operators...`);

const results = [];
const CONCURRENCY = 8;
for (let i = 0; i < targets.length; i += CONCURRENCY) {
  const batch = targets.slice(i, i + CONCURRENCY);
  const got = await Promise.all(batch.map((t) => probe(t.url, t.kind, t.op)));
  for (const r of got) {
    results.push(r);
    const tag = r.error ? "ERR " :
                r.status >= 400 ? "BAD " :
                r.redirected   ? "REDR" :
                                 "OK  ";
    console.log(`  ${tag}  ${r.op.padEnd(20)} ${r.kind.padEnd(7)} ${r.status || ""}  ${r.error || (r.redirected ? "→ " + r.finalUrl : r.url)}`);
  }
}

const summary = {
  generated_at: new Date().toISOString(),
  total: results.length,
  ok: results.filter((r) => !r.error && r.status < 400 && !r.redirected).length,
  redirected: results.filter((r) => !r.error && r.status < 400 && r.redirected).length,
  bad: results.filter((r) => r.error || r.status >= 400).length,
  results,
};
writeFileSync("docs/booking-url-audit.json", JSON.stringify(summary, null, 2) + "\n");
console.log(`\n${summary.ok}/${summary.total} OK · ${summary.redirected} redirected · ${summary.bad} bad`);
console.log("Wrote docs/booking-url-audit.json");
