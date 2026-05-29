import { describe, it, expect } from "vitest";
import {
  matchPlace,
  filterRoutes,
  sortRoutes,
  comparatorFor,
  lucky,
  suggestLeg,
  SORTS,
} from "../src/lib/filters.js";
import { ROUTES } from "../src/data/index.js";

describe("search / matchPlace", () => {
  const zephyrW = ROUTES.find((r) => r.id === "cz-west");

  it("TC-SEARCH-01 — case-insensitive match against origin", () => {
    expect(matchPlace(zephyrW, "denver", true)).toBe(true);
    expect(matchPlace(zephyrW, "DENVER", true)).toBe(true);
  });

  it("TC-SEARCH-02 — substring match against a station name", () => {
    // Moffat Tunnel station is in cz-west.elevation labels but matchPlace
    // checks `route.stations[]`, not elevation. Use a station that IS in stations:
    expect(matchPlace(zephyrW, "glenwood", true)).toBe(true);
  });

  it("TC-SEARCH-03 — empty query returns true", () => {
    expect(matchPlace(zephyrW, "", true)).toBe(true);
    expect(matchPlace(zephyrW, "", false)).toBe(true);
  });

  it("missing endpoint returns false", () => {
    expect(matchPlace(zephyrW, "tokyo", false)).toBe(false);
  });
});

describe("filterRoutes", () => {
  it("TC-FILT-01 / R-C1.3-01 — AND-combines filters", () => {
    const out = filterRoutes(ROUTES, {
      regions: new Set(["Europe"]),
      cats: new Set(["Scenic"]),
    });
    expect(out.length).toBeGreaterThan(0);
    for (const r of out) {
      expect(r.region).toBe("Europe");
      expect(r.category).toBe("Scenic");
    }
  });

  it("TC-FILT-02 / R-C1.3-02 — amenities are all-of, not any-of", () => {
    const out = filterRoutes(ROUTES, { ams: new Set(["dome", "dining"]) });
    expect(out.length).toBeGreaterThan(0);
    for (const r of out) {
      expect(r.amenities).toContain("dome");
      expect(r.amenities).toContain("dining");
    }
  });

  it("TC-FILT-03 / R-C1.3-03 — scenicOnly threshold is 70", () => {
    const out = filterRoutes(ROUTES, { scenicOnly: true });
    expect(out.length).toBeGreaterThan(0);
    for (const r of out) expect(r.scenicScore).toBeGreaterThanOrEqual(70);
  });

  it("price ceiling excludes pricier routes", () => {
    const out = filterRoutes(ROUTES, { maxPrice: 100 });
    for (const r of out) expect(r.priceFrom).toBeLessThanOrEqual(100);
  });
});

describe("sortRoutes", () => {
  it("TC-SORT-01 / R-C1.4-01 — all 6 sort orders are monotonic in the right direction", () => {
    for (const { id } of SORTS) {
      const sorted = sortRoutes(ROUTES, id);
      const cmp = comparatorFor(id);
      for (let i = 1; i < sorted.length; i++) {
        // ascending sort means cmp(a, b) <= 0 across the run.
        expect(cmp(sorted[i - 1], sorted[i]), `sort ${id} broke at i=${i}`).toBeLessThanOrEqual(0);
      }
    }
  });

  it("sortRoutes does not mutate input", () => {
    const before = [...ROUTES];
    sortRoutes(ROUTES, "price");
    expect(ROUTES).toEqual(before);
  });
});

describe("lucky", () => {
  it("TC-LUCKY-01 / R-C1.5-01 — picks from filtered when non-empty", () => {
    const filtered = ROUTES.slice(0, 3);
    const pick = lucky(filtered, ROUTES, () => 0.5);
    expect(filtered).toContain(pick);
  });

  it("TC-LUCKY-02 / R-C1.5-01 — falls back to all when filtered is empty", () => {
    const pick = lucky([], ROUTES, () => 0);
    expect(ROUTES).toContain(pick);
  });

  it("returns null when neither pool has items", () => {
    expect(lucky([], [], () => 0)).toBeNull();
  });
});

describe("suggestLeg (multi-stop planner)", () => {
  it("TC-PLAN-01 / R-C4.2-01 — Denver→Chicago resolves to cz-east", () => {
    const leg = suggestLeg("Denver", "Chicago", ROUTES);
    expect(leg).toBeTruthy();
    expect(leg.id).toBe("cz-east");
  });

  it("returns null when no route bridges the two stops", () => {
    expect(suggestLeg("Atlantis", "El Dorado", ROUTES)).toBeNull();
  });
});
