import { describe, it, expect } from "vitest";
import {
  heuristicPrefs,
  llmPrefs,
  notices,
  catalogFacets,
  keep,
} from "../src/lib/preferences.js";
import { ROUTES, REGIONS } from "../src/data/index.js";

const F = catalogFacets(ROUTES, REGIONS);

describe("heuristicPrefs", () => {
  it("TC-PREF-01 / R-C6.2-01 — extracts region from free text", () => {
    const p = heuristicPrefs("scenic train through europe under $300", F);
    expect(p.regions).toContain("Europe");
  });

  it("TC-PREF-02 / R-C6.2-01 — extracts categories", () => {
    const p = heuristicPrefs("scenic train through europe under $300", F);
    expect(p.categories).toContain("Scenic");
  });

  it("TC-PREF-03 / R-C6.2-01 — extracts maxPrice when text signals a budget", () => {
    const p = heuristicPrefs("scenic train under $300", F);
    expect(p.maxPrice).toBe(300);
  });

  it("TC-PREF-04 / R-C6.2-01 — never throws on garbage input", () => {
    expect(() => heuristicPrefs("", F)).not.toThrow();
    expect(() => heuristicPrefs(null, F)).not.toThrow();
    expect(() => heuristicPrefs(undefined, F)).not.toThrow();
    expect(() => heuristicPrefs("こんにちは", F)).not.toThrow();
    expect(() => heuristicPrefs("zzzz!!!", F)).not.toThrow();
  });

  it("returns the expected shape", () => {
    const p = heuristicPrefs("japan high-speed", F);
    expect(p).toMatchObject({
      regions: expect.any(Array),
      providers: expect.any(Array),
      categories: expect.any(Array),
      scenicOnly: expect.any(Boolean),
      interests: expect.any(Array),
      source: "heuristic",
    });
  });
});

describe("keep (whitelist filter)", () => {
  it("TC-PREF-05 / R-C6.2-02 — filters out values not in the allowed set", () => {
    expect(keep(["Europe", "Mars"], REGIONS)).toEqual(["Europe"]);
    expect(keep(["NotARegion"], REGIONS)).toEqual([]);
    expect(keep(null, REGIONS)).toEqual([]);
    expect(keep(undefined, REGIONS)).toEqual([]);
  });
});

describe("llmPrefs", () => {
  it("rejects (throws) when no LLM is provided", async () => {
    await expect(llmPrefs("anything", F, null)).rejects.toThrow();
    await expect(llmPrefs("anything", F, {})).rejects.toThrow();
  });

  it("parses a mock LLM response and whitelists against facets", async () => {
    const llm = {
      async complete() {
        return JSON.stringify({
          regions: ["Europe", "Atlantis"],
          providers: ["Amtrak", "FakeOp"],
          categories: ["Scenic", "Phantom"],
          maxPrice: 250,
          scenicOnly: true,
          interests: ["coastal", "historic"],
        });
      },
    };
    const out = await llmPrefs("luxury europe", F, llm);
    expect(out.regions).toEqual(["Europe"]);
    expect(out.providers).toContain("Amtrak");
    expect(out.providers).not.toContain("FakeOp");
    expect(out.categories).toContain("Scenic");
    expect(out.categories).not.toContain("Phantom");
    expect(out.maxPrice).toBe(250);
    expect(out.scenicOnly).toBe(true);
    expect(out.interests).toEqual(["coastal", "historic"]);
    expect(out.source).toBe("ai");
  });
});

describe("notices (deal carousel)", () => {
  it("TC-DEAL-01 / R-C6.3-01 — cap of 6 entries", () => {
    const out = notices(
      { regions: [], providers: [], categories: [], scenicOnly: false, maxPrice: null },
      ROUTES,
    );
    expect(out.length).toBeLessThanOrEqual(6);
  });

  it("TC-DEAL-02 / R-C6.3-01 — ordered by score descending", () => {
    const out = notices(
      { regions: [], providers: [], categories: [], scenicOnly: false, maxPrice: null },
      ROUTES,
    );
    for (let i = 1; i < out.length; i++) {
      expect(out[i - 1].score).toBeGreaterThanOrEqual(out[i].score);
    }
  });

  it("non-empty prefs narrow the candidate set", () => {
    const narrow = notices(
      { regions: ["Europe"], providers: [], categories: [], scenicOnly: false, maxPrice: null },
      ROUTES,
    );
    for (const n of narrow) {
      const r = ROUTES.find((x) => x.id === n.routeId);
      expect(r.region).toBe("Europe");
    }
  });
});
