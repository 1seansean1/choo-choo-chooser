import { describe, it, expect } from "vitest";
import {
  itemPrice,
  cartTotals,
  legBase,
  routeById,
  SERVICE_FEE_PCT,
  FEE_MIN,
  ROUND_TRIP_SAVER,
} from "../src/lib/pricing.js";
import { ROUTES } from "../src/data/index.js";

const ZEPHYR_W_ID = "cz-west";
const zephyr = () => routeById(ROUTES, ZEPHYR_W_ID);

describe("pricing", () => {
  it("ZephyrW fixture is present (sanity for downstream)", () => {
    const z = zephyr();
    expect(z).toBeDefined();
    expect(z.classes[0].price).toBe(88);
    expect(z.discounts.some((d) => /kid|child/i.test(d.name))).toBe(true);
  });

  it("TC-PRICE-01 / R-C5.1-01 — round-trip saver is 10%", () => {
    const z = zephyr();
    const price = itemPrice(
      { route: z, classIdx: 0, adults: 1, kids: 0, roundTrip: true },
      ROUTES,
    );
    expect(price).toBeCloseTo(2 * 88 * 0.9, 2); // 158.40
    expect(ROUND_TRIP_SAVER).toBe(0.1);
  });

  it("TC-PRICE-02 / R-C5.1-02 — kid discount 50% on kid-eligible route", () => {
    const z = zephyr();
    const oneAdultOneKid = legBase(z, 0, 1, 1);
    expect(oneAdultOneKid).toBeCloseTo(88 + 88 * 0.5, 2); // 132.00
  });

  it("TC-PRICE-03 / R-C5.1-02 — no kid discount on routes lacking a kid entry", () => {
    const noKid = ROUTES.find(
      (r) => !(r.discounts || []).some((d) => /kid|child/i.test(d.name)),
    );
    expect(noKid, "expected at least one route without a kid discount").toBeDefined();
    const base = noKid.classes[0].price;
    expect(legBase(noKid, 0, 1, 1)).toBeCloseTo(base * 2, 2);
  });

  describe("service fee + totals", () => {
    it("TC-CART-01 / R-C5.3-01 — fee floor of $0.50 on tiny carts", () => {
      // Build a synthetic 1-item cart whose price is $1.
      const cheap = ROUTES.find((r) => r.classes[0].price === 1)
        || { id: "_synth", classes: [{ price: 1 }], discounts: [] };
      const totals = cartTotals(
        [{ route: cheap, classIdx: 0, adults: 1, kids: 0, roundTrip: false }],
        ROUTES,
      );
      expect(totals.subtotal).toBe(1);
      expect(totals.fee).toBe(0.5);
      expect(totals.fee).toBe(FEE_MIN);
      expect(totals.total).toBe(1.5);
    });

    it("TC-CART-02 / R-C5.3-01 — fee is 5% above the floor", () => {
      // Build a synthetic $100-subtotal cart by reusing the Zephyr coach price stack.
      const z = zephyr();
      // 88 + 12 stub
      const items = [
        { route: z, classIdx: 0, adults: 1, kids: 0, roundTrip: false }, // 88
        {
          route: { ...z, classes: [{ price: 12 }], discounts: [] },
          classIdx: 0, adults: 1, kids: 0, roundTrip: false,
        }, // 12
      ];
      const totals = cartTotals(items, ROUTES);
      expect(totals.subtotal).toBe(100);
      expect(totals.fee).toBe(5);
      expect(totals.fee).toBeGreaterThan(FEE_MIN);
      expect(totals.fee).toBe(+(totals.subtotal * SERVICE_FEE_PCT).toFixed(2));
      expect(totals.total).toBe(105);
    });

    it("TC-CART-03 / R-C5.3-01 — empty cart fee is zero", () => {
      const totals = cartTotals([], ROUTES);
      expect(totals.subtotal).toBe(0);
      expect(totals.fee).toBe(0);
      expect(totals.total).toBe(0);
    });

    it("TC-CART-04 / R-C5.3-02 — all money outputs are 2-decimal-precise", () => {
      const z = zephyr();
      const totals = cartTotals(
        [{ route: z, classIdx: 1, adults: 2, kids: 1, roundTrip: true }],
        ROUTES,
      );
      for (const n of [totals.subtotal, totals.fee, totals.total]) {
        expect(n).toBe(+n.toFixed(2));
      }
    });
  });
});
