import { describe, it, expect } from "vitest";
import { bookingUrl, bookingLabel, tipJarUrl, isAffiliateMonetized, coverageSummary } from "../src/lib/booking.js";
import { ROUTES } from "../src/data/index.js";
import affiliateConfig from "../src/data/affiliate-links.json";

describe("bookingUrl", () => {
  it("returns the operator's direct deep link when no affiliateId is set", () => {
    const route = ROUTES.find((r) => r.operator === "Amtrak");
    const url = bookingUrl(route, affiliateConfig);
    expect(url).toBe("https://www.amtrak.com/tickets/departure.html");
    expect(url).not.toContain("anrdoezrs.net");
  });

  it("wraps Awin links when affiliateId + merchantId are present", () => {
    const route = { operator: "Eurostar" };
    const cfg = JSON.parse(JSON.stringify(affiliateConfig));
    cfg.operators["Eurostar"].affiliateId = "12345";
    const url = bookingUrl(route, cfg);
    expect(url).toContain("https://www.awin1.com/cread.php");
    expect(url).toContain("awinmid=5707");
    expect(url).toContain("awinaffid=12345");
    expect(url).toContain("ued=https%3A%2F%2Fwww.eurostar.com");
  });

  it("wraps CJ links when affiliateId + advertiserId are present", () => {
    const route = { operator: "Amtrak" };
    const cfg = JSON.parse(JSON.stringify(affiliateConfig));
    cfg.operators["Amtrak"].affiliateId = "67890";
    const url = bookingUrl(route, cfg);
    expect(url).toContain("https://www.anrdoezrs.net/click-67890-9929080");
    expect(url).toContain("url=https%3A%2F%2Fwww.amtrak.com%2Ftickets%2Fdeparture.html");
  });

  it("wraps Travelpayouts links when affiliateId is present", () => {
    const route = { operator: "JR Central" };
    const cfg = JSON.parse(JSON.stringify(affiliateConfig));
    cfg.operators["JR Central"].affiliateId = "abc123";
    const url = bookingUrl(route, cfg);
    expect(url).toContain("https://tp.media/r?marker=abc123");
    expect(url).toContain("p=klook");
  });

  it("returns null for an unknown operator", () => {
    expect(bookingUrl({ operator: "Made-Up Rail" }, affiliateConfig)).toBeNull();
    expect(bookingUrl(null, affiliateConfig)).toBeNull();
    expect(bookingUrl({ operator: "Amtrak" }, null)).toBeNull();
  });

  it("every route in ROUTES resolves to a non-null URL", () => {
    const broken = ROUTES.filter((r) => !bookingUrl(r, affiliateConfig));
    expect(broken.map((r) => r.id + " (" + r.operator + ")")).toEqual([]);
  });
});

describe("bookingLabel + tipJarUrl + isAffiliateMonetized", () => {
  it("bookingLabel falls back to the operator name", () => {
    expect(bookingLabel({ operator: "Amtrak" }, affiliateConfig)).toBe("Continue on Amtrak");
  });

  it("tipJarUrl is empty by default", () => {
    expect(tipJarUrl(affiliateConfig)).toBe("");
  });

  it("isAffiliateMonetized is false when affiliateId is unset, true when set", () => {
    expect(isAffiliateMonetized("Amtrak", affiliateConfig)).toBe(false);
    const cfg = JSON.parse(JSON.stringify(affiliateConfig));
    cfg.operators["Amtrak"].affiliateId = "xyz";
    expect(isAffiliateMonetized("Amtrak", cfg)).toBe(true);
  });
});

describe("coverage", () => {
  it("every operator in ROUTES has an entry in affiliate-links.json", () => {
    const ops = [...new Set(ROUTES.map((r) => r.operator))];
    const summary = coverageSummary(ops, affiliateConfig);
    expect(summary.missing).toEqual([]);
    expect(summary.total).toBeGreaterThan(0);
  });
});
