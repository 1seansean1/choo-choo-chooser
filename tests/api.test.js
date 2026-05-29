// tests/api.test.js — regression guard for the api/checkout.js Vercel function.
// We import the handler directly with a stub Stripe (intercepted via globalThis.fetch)
// to verify the request shape, server-side pricing, and CORS-free same-origin response.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import handler from "../api/checkout.js";
import { ROUTES } from "../src/data/index.js";

function mockReqRes({ method = "POST", body = {}, headers = {} } = {}) {
  const req = {
    method,
    body,
    headers: { host: "choo-choo-chooser.vercel.app", "x-forwarded-proto": "https", ...headers },
    query: {},
  };
  const captured = { statusCode: 200, jsonBody: null };
  const res = {
    status(n) { captured.statusCode = n; return this; },
    json(b) { captured.jsonBody = b; return this; },
  };
  return { req, res, captured };
}

describe("api/checkout handler", () => {
  const realFetch = globalThis.fetch;
  let lastCall = null;
  beforeEach(() => {
    lastCall = null;
    process.env.STRIPE_SECRET_KEY = "sk_test_fake";
    globalThis.fetch = vi.fn(async (url, init) => {
      lastCall = { url, init };
      return {
        ok: true,
        text: async () =>
          JSON.stringify({
            id: "cs_test_FAKE_SESSION",
            url: "https://checkout.stripe.com/c/pay/cs_test_FAKE_SESSION",
          }),
      };
    });
  });
  afterEach(() => { globalThis.fetch = realFetch; });

  it("recomputes price server-side from ROUTES; client-supplied price is ignored", async () => {
    const { req, res } = mockReqRes({
      body: {
        items: [
          // a malicious client tries to send a $0 price for the Zephyr
          { routeId: "cz-west", classIdx: 0, adults: 1, kids: 0, roundTrip: false, price: 0 },
        ],
        email: "test@example.com",
      },
    });
    await handler(req, res);

    const body = String(lastCall.init.body);
    // California Zephyr west coach = $88.00 = 8800 cents
    expect(body).toContain("line_items%5B0%5D%5Bprice_data%5D%5Bunit_amount%5D=8800");
    // service fee: max(50, round(8800*0.05)) = 440 cents
    expect(body).toContain("line_items%5B1%5D%5Bprice_data%5D%5Bunit_amount%5D=440");
    expect(body).not.toContain("unit_amount=0");
  });

  it("applies round-trip 10% saver and kid 50% discount server-side", async () => {
    const { req, res } = mockReqRes({
      body: {
        items: [
          { routeId: "cz-west", classIdx: 0, adults: 1, kids: 2, roundTrip: true },
        ],
      },
    });
    await handler(req, res);
    const body = String(lastCall.init.body);
    // base * (1 + 0.5 * 2) = 88 * 2 = 176; *2 (rt) = 352; * 0.9 (saver) = 316.80 -> 31680 cents
    expect(body).toContain("line_items%5B0%5D%5Bprice_data%5D%5Bunit_amount%5D=31680");
  });

  it("rejects empty cart with 400", async () => {
    const { req, res, captured } = mockReqRes({ body: { items: [] } });
    await handler(req, res);
    expect(captured.statusCode).toBe(400);
  });

  it("rejects unknown route id", async () => {
    const { req, res, captured } = mockReqRes({
      body: { items: [{ routeId: "no-such-route", classIdx: 0, adults: 1 }] },
    });
    await handler(req, res);
    expect(captured.statusCode).toBe(500);
    expect(captured.jsonBody.error).toMatch(/unknown route/);
  });

  it("rejects non-POST", async () => {
    const { req, res, captured } = mockReqRes({ method: "GET" });
    await handler(req, res);
    expect(captured.statusCode).toBe(405);
  });

  it("returns Stripe-provided URL on success", async () => {
    const { req, res, captured } = mockReqRes({
      body: { items: [{ routeId: ROUTES[0].id, classIdx: 0, adults: 1 }] },
    });
    await handler(req, res);
    expect(captured.statusCode).toBe(200);
    expect(captured.jsonBody.url).toMatch(/^https:\/\/checkout\.stripe\.com\//);
    expect(captured.jsonBody.session_id).toBe("cs_test_FAKE_SESSION");
  });
});

describe("CCCPrice bridge (regression for the routes-undefined runtime bug)", () => {
  it("cartTotals + itemPrice + routeById bound to ROUTES work without a 2nd arg", async () => {
    // Re-create the bridge the same way src/main.jsx does.
    const { itemPrice, cartTotals, routeById } = await import("../src/lib/pricing.js");
    const bound = {
      itemPrice:  (it)    => itemPrice(it, ROUTES),
      cartTotals: (items) => cartTotals(items, ROUTES),
      routeById:  (id)    => routeById(ROUTES, id),
    };
    expect(() => bound.cartTotals([])).not.toThrow();
    expect(bound.cartTotals([])).toEqual({ subtotal: 0, fee: 0, total: 0 });
    const t = bound.cartTotals([
      { routeId: "cz-west", classIdx: 0, adults: 1, kids: 0, roundTrip: false },
    ]);
    expect(t.subtotal).toBe(88);
    expect(t.fee).toBe(4.4);
    expect(t.total).toBe(92.4);
    expect(bound.routeById("cz-west")).toBeTruthy();
  });
});
