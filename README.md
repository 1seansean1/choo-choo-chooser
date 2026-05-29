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

## Payments (Stripe Checkout, test mode)

The cart's "Pay" button posts to `/api/checkout`, which uses the bundled catalog to recompute prices server-side (the client cannot influence `unit_amount`) and creates a real [Stripe Checkout Session](https://stripe.com/docs/payments/checkout). The browser is redirected to Stripe's hosted page, the customer enters their card, Stripe charges and redirects back to `/?session_id=cs_test_...`, the app fetches `/api/session/:id`, and renders the confirmation panel with the real Stripe session id + amount + `livemode` flag.

To test on the live site: add anything to the cart, check out, enter any email, click **Pay**, then on Stripe's page use card `4242 4242 4242 4242`, any future expiry, any CVC. The dashboard at https://dashboard.stripe.com/test/payments shows the (test-mode, no-real-money) charge.

**To flip to live mode:** rotate the Vercel env var `STRIPE_SECRET_KEY` to `sk_live_...`. **Do not flip to live without an actual ticket inventory** — without real fulfillment, every charge is "services not provided" the moment the train departs without the buyer aboard. See `docs/architecture/architecture.v1.md` for the rail-aggregator paths that make live mode legal.

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
