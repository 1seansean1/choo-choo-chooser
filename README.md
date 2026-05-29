# Choo Choo Chooser

A worldwide passenger-rail discovery and booking prototype.

Browse 40+ named train routes on six continents — California Zephyr, Glacier Express, Rocky Mountaineer, Coast Starlight, Bernina Express, Tōkaidō Shinkansen and friends — with scenic-score filters, an elevation sparkline on every card, a hover-traceable world map, and a multi-stop journey planner. Cart, account, and free-text preference parsing (LLM-backed when available, deterministic heuristic fallback) round out the demo.

This is a personal prototype. Schedules, prices, and class definitions are realistic and rounded for shape — **not for booking**.

## Run locally

```bash
npm install
npm run dev           # http://localhost:5173
```

The main app is `/` (`index.html`). The full-screen map viewer is `/mapviewer.html`.

## Test

```bash
npm test              # one shot
npm run test:watch    # watch mode
```

The Vitest suite covers every `T`-marked requirement in [docs/test/test-set.v1.md](docs/test/test-set.v1.md) — pricing, filters, sorts, preference parsing, the catalog shape, and the build artifact. Visual/UX requirements are verified by inspection of the running app.

## Build + deploy

```bash
npm run build         # writes dist/
npm run preview       # serve the built artifact at http://localhost:4173
```

**Primary deployment — Vercel** at https://choo-choo-chooser.vercel.app. Vercel hosts both the static frontend (from `dist/`) and the `api/` serverless functions on one domain. Configured via `vercel.json`. Required env vars on the Vercel project (`vercel env add ...`):

- `STRIPE_SECRET_KEY` — `sk_test_...` from https://dashboard.stripe.com/test/apikeys
- `VITE_CHECKOUT_API_URL=self` — tells the frontend build to call same-origin `/api/checkout`

**Mirror deployment — GitHub Pages** at https://1seansean1.github.io/choo-choo-chooser via `.github/workflows/deploy.yml`. The Pages mirror runs in mock-checkout mode (no `VITE_CHECKOUT_API_URL`), so the cart and UX work but the "Pay" button issues fake confirmation codes. The Vercel deploy is the real one.

## Bookings (affiliate)

We don't sell tickets — we'd need to become a licensed travel reseller for every operator. Instead, the **"Continue on [Operator]"** button on each route opens the operator's own booking site (Amtrak.com, Eurostar.com, Trenitalia.com, JR Central, …) in a new tab. The customer buys directly from the operator. The operator delivers a real ticket. They're the merchant of record.

When you sign up for affiliate networks (Awin, CJ, Travelpayouts) and drop your publisher IDs into `src/data/affiliate-links.json`, the outbound links wrap through the network so operators pay you a commission (~3-8%) on completed bookings. Until you do, the buttons still work — they just link directly without earning anything.

**To enable affiliate revenue:**

1. **Awin** ([awin.com](https://www.awin.com/gb/affiliates)) — covers Eurostar, Trenitalia, SNCF, Deutsche Bahn, Belmond. Free signup, 1-2 day approval per merchant.
2. **CJ Affiliate** ([cj.com](https://www.cj.com/)) — covers Amtrak (advertiserId `9929080`). Free signup, can take ~1 week.
3. **Travelpayouts** ([travelpayouts.com](https://www.travelpayouts.com/)) — wraps Klook, 12Go, Trip.com (covers Asian rail: JR Central, China Railway, Vietnam Railways, KTX, Indian Railways, THSR). Single account, multiple merchants.

Once approved, edit `src/data/affiliate-links.json`: paste your publisher ID into each operator's `affiliateId` field, commit, push. Vercel auto-redeploys. Commissions land in the network's payout to your bank.

## Stripe (kept, but optional)

The Stripe Checkout backend at `api/checkout.js` is still wired (test mode), and the `tipJar.stripePaymentLinkUrl` field in `affiliate-links.json` can hold a [Stripe Payment Link](https://dashboard.stripe.com/payment-links) for a future "tip the developer" button. Live mode (`sk_live_...`) is appropriate for tips (you're not promising fulfillment of anything), but **not** for ticket-style charges without rail-operator inventory contracts.

## Layout

```
src/
  data/                ESM catalog: one file per region, barrel in index.js
  lib/                 pure modules (pricing, preferences, filters, store)
  all.jsx              React component layer (concat of the prototype's .jsx files)
  main.jsx             primary entry — wires globals + renders <App/>
  mapviewer-main.jsx   secondary entry for /mapviewer.html
  styles.css           main app styles (hoisted from the prototype's index.html)
  mapviewer.css        map-viewer styles
docs/
  partition/           omega-space + capability tree
  requirements/        IEEE 29148 requirement set
  architecture/        architecture.v1
  test/                test-set.v1 + RTM
  planning/            release + sprint plan
  review/              codebase-review report (release gate)
  remediation/         remediation records
tests/                 vitest
```

## Lifecycle

This repo was driven through `/skill-chain` end-to-end on 2026-05-28 — partitioning, capability decomposition, IEEE 29148 requirements, architecture, ISO 29119-3 test design, release planning, productionization (Vite migration), test execution, codebase review, and remediation. The artifacts live under `docs/`.

## License

[MIT](LICENSE).
