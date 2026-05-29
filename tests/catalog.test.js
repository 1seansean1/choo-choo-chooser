import { describe, it, expect } from "vitest";
import { ROUTES, REGIONS, REGION_COLORS } from "../src/data/index.js";

describe("catalog", () => {
  it("TC-CAT-01 / R-C1.1-01 — catalog loads >= 40 routes", () => {
    expect(ROUTES.length).toBeGreaterThanOrEqual(40);
  });

  it("every route has the structural fields the UI depends on", () => {
    for (const r of ROUTES) {
      expect(r.id, `route ${r.name}`).toBeTypeOf("string");
      expect(r.name).toBeTypeOf("string");
      expect(r.region).toBeTypeOf("string");
      expect(REGIONS).toContain(r.region);
      expect(REGION_COLORS[r.region]).toBeTruthy();
      expect(r.operator).toBeTypeOf("string");
      expect(r.origin).toBeTypeOf("string");
      expect(r.destination).toBeTypeOf("string");
      expect(r.priceFrom, `route ${r.name} priceFrom`).toBeGreaterThan(0);
      expect(r.scenicScore).toBeGreaterThanOrEqual(0);
      expect(r.scenicScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(r.classes)).toBe(true);
      expect(r.classes.length).toBeGreaterThan(0);
      expect(Array.isArray(r.amenities)).toBe(true);
      expect(Array.isArray(r.discounts)).toBe(true);
      expect(Array.isArray(r.stations)).toBe(true);
    }
  });

  it("route ids are unique across the whole catalog", () => {
    const seen = new Set();
    const dupes = [];
    for (const r of ROUTES) {
      if (seen.has(r.id)) dupes.push(r.id);
      seen.add(r.id);
    }
    expect(dupes, `duplicate route ids: ${dupes.join(", ")}`).toEqual([]);
  });
});
