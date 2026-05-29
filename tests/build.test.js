// build.test.js — verifies the production build artifact satisfies R-C8.1-*.
//
// This test runs `npm run build` and inspects dist/. It's slow, so split out so
// developers can `vitest run tests/pricing.test.js` for fast feedback.

import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("build artifact", () => {
  it("TC-BUILD-01 / R-C8.1-01 — npm run build exits 0 and produces dist/index.html", () => {
    execSync("npm run build", { stdio: "ignore" });
    expect(existsSync(join(ROOT, "dist", "index.html"))).toBe(true);
    expect(existsSync(join(ROOT, "dist", "mapviewer.html"))).toBe(true);
  }, 60_000);

  it("TC-BUILD-02 / R-C8.1-02 — built artifact contains no babel.min.js reference", () => {
    const distFiles = walk(join(ROOT, "dist"));
    for (const f of distFiles) {
      const text = readFileSync(f, "utf8");
      expect(text.includes("babel.min.js"), `babel.min.js found in ${f}`).toBe(false);
    }
  });
});

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (/\.(html|js|css)$/.test(entry.name)) out.push(p);
  }
  return out;
}
