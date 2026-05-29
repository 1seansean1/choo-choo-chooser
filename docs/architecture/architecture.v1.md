# architecture.v1 — Choo Choo Chooser

## As-built (prototype, R1)

**Stack.** React 18 (UMD CDN) + ReactDOM (UMD CDN) + Babel-standalone (CDN, in-browser JSX compile). Pure ES2019+/JSX. No build, no bundler, no package manager. Served as static files from any HTTP root.

**Module layout (file-as-module via `<script>` tags).** All modules attach behavior to `window.*` because the in-browser Babel pipeline has no module resolver.

```
index.html              page shell; loads React/Babel from CDN; <script> chain in fixed order
  data.js               window.RAIL skeleton + region-color palette + window.routeColor()
  data-{region}.js      6 files; each calls window.RAIL.add([...route records...])
  tweaks-panel.jsx      a floating settings drawer (theme, accent, layout)
  store.jsx             window.Store (global), window.useStore, window.CCCPrice, window.money
  scenes.jsx            <Scene type=...> typed SVG thumbnails
  world-map.jsx         <WorldMap routes hoveredId .../> Equirectangular SVG renderer
  datepicker.jsx        <DateTimeField/> with range support
  cart.jsx              <CartDrawer/>, <CartButton/>, <AccountMenu/>, <AuthModal/>
  checkout.jsx          <CheckoutHost/>, <Toast/>
  detail.jsx            <Detail/> full route panel
  app.jsx               <App/> shell + ReactDOM.createRoot().render(...)
Map Viewer.html         standalone, depends on the same data files + mapviewer.jsx
```

**State model.**
- Global app store: `window.Store` — POJO with `state`, `listeners: Set`, mutator methods, `_changed()` saves + emits. Components subscribe via `useStore()` (a forceUpdate hook).
- Per-screen UI state: `useState` in `App` for filters, query, layout, trip mode, planner stops, etc.
- Persisted slice: `{ cart, account }` under `localStorage.ccc_store_v1`.

**Data model.** A route is the central entity (see `data-americas.js:3-43` for the canonical shape). Fields cluster as: identity, geo, schedule, distance/duration/speed, elevation (high/low/gain/loss + sampled `elevation[]`), scenic score, classes (with price), discounts, amenities, scenes, stations.

**Pricing.** `window.CCCPrice.itemPrice` and `cartTotals` ([store.jsx:179-189](store.jsx#L179-L189)). Round-trip saver 10%, service fee 5% with $0.50 floor, kid discount 50% on routes that include a kid/child discount entry.

**Personalization.** Free-text preferences → `_llmPrefs` (via `window.claude.complete`, the Claude artifact-runtime API) or `_heuristicPrefs` fallback. Output is whitelisted against catalog facets before being applied as default filters.

**Maps.** `world-map.jsx` and `mapviewer.jsx` both render an Equirectangular projection in SVG. Routes are great-circle-ish polylines between the two `geo` endpoints. Hover state is lifted to `App`.

## Constraints / known limits

- In-browser Babel adds a ~2s parse-and-compile cost on first load and forbids `import` syntax.
- The `<script>` chain is order-sensitive; `data.js` must come before any `data-*.js`, and `store.jsx` before `app.jsx`.
- `window.claude.complete` exists only inside the Claude.ai artifact runtime; outside it, preferences fall back to the heuristic parser silently.
- No live availability, no real payments, no operator API — the prototype is a closed-world demo.

## Productionization design (R2 target)

**Choice.** Migrate to **Vite** with `@vitejs/plugin-react`. Rationale: minimal config, native ESM dev server, fast HMR, single `npm run build` produces a static `dist/` deployable anywhere. Output is a static SPA — no SSR, no server runtime — which preserves the prototype's GH-Pages-friendly nature.

**Why not other options?**
- esbuild alone: viable but Vite gives me a dev server "for free".
- Next.js: routing + SSR overkill; the app is a single page.
- Keep Babel-standalone: fails R-C8.1-02 (no runtime Babel).

**Migration mechanics.**
1. Add `package.json`, `vite.config.js`, `index.html` rewritten as a Vite entry.
2. Convert each `window.*` global into an ES module export. `window.RAIL` becomes a singleton built by `data/index.js` that imports the six region files. `window.Store` becomes an importable `store` object (keeps the listeners pattern; React-Redux-style subscription).
3. Replace `<script src=...>` chain with a single `<script type="module" src="/src/main.jsx">`.
4. Map Viewer.html becomes a second Vite entry (`mapviewer.html` → `src/mapviewer-main.jsx`).
5. CSS: lift the `<style>` block in `index.html` into `src/styles.css` imported from `main.jsx`.

**Module graph after migration:**

```
src/main.jsx                  ReactDOM.createRoot + <App/>
src/styles.css                global stylesheet (was inline in index.html)
src/data/                     window.RAIL re-shaped as `import { ROUTES, REGIONS, ... }`
  ├── index.js
  ├── americas.js  asia.js  europe.js  southern.js  extra-euas.js  extra-world.js
src/lib/
  ├── pricing.js              SERVICE_FEE_PCT, ROUND_TRIP_SAVER, FEE_MIN, itemPrice, cartTotals
  ├── preferences.js          heuristicPrefs (LLM call dropped from build — see below)
  └── store.js                createStore() with listeners
src/components/               1:1 with current *.jsx
src/main-mapviewer.jsx        mapviewer entry
```

**LLM call.** `_llmPrefs` depends on `window.claude.complete` which only exists inside Claude.ai artifacts. For the production build I keep the call wired (no-op when unavailable, fallback to heuristic) and remove the import of any Claude SDK at build time. This preserves dual-environment behavior.

**Build.** `npm run build` → `dist/index.html` + `dist/assets/*` (hashed). `npm run dev` → `localhost:5173`. `npm test` → vitest watch-or-run.

**Deploy.** GitHub Pages from `dist/` via `gh-pages` npm package OR a GH Actions workflow using `peaceiris/actions-gh-pages`. Per memory: personal apps land in `1seansean1` org. **Decision deferred to the deploy step** (workflow vs. one-shot CLI publish).

## Payments (added 2026-05-28)

A real Stripe-Checkout backend was added after the initial release-gate PASS. Layout:

```
api/checkout.js          Vercel serverless function. POST { items, email } →
                         creates a Stripe Checkout Session with line items
                         recomputed from the bundled catalog (server-trusted).
                         Returns { url, session_id }.
api/session/[id].js      GET → proxies a Stripe Checkout Session by id so the
                         return page can confirm payment_status="paid" without
                         exposing the secret key.
api/_lib/catalog.js      Re-exports ROUTES + pricing constants from src/ so
                         the Vercel build inlines them into the function bundle.
vercel.json              Build/output config. /api/* auto-detected as Node funcs.
```

Frontend wiring (in `src/all.jsx` Checkout component):
- `pay()` posts the cart payload to `/api/checkout`, persists a snapshot to
  `sessionStorage["ccc_pending_checkout"]`, then `window.location.assign(url)`.
- App's mount-time useEffect detects `?session_id=cs_test_...`, fetches
  `/api/session/:id`, opens Checkout pre-positioned at step 3 with the real
  Stripe session details, clears cart, removes the URL param.
- Falls back to the original mock confirmation flow when `VITE_CHECKOUT_API_URL`
  is unset (e.g. the GitHub Pages mirror).

**Why Vercel, not Cloudflare Workers?** Wrangler's OAuth login uses a localhost
HTTP callback that gets silently dropped by Windows Defender Firewall on this
machine (same root cause as the broken git-credential-manager issue noted in
memory). Vercel CLI uses a device-code OAuth flow that doesn't depend on a
local listener, so login completed cleanly. Vercel also hosts the frontend at
the same origin as the API, which eliminates the CORS allowlist that the
Worker path needed.

**Trust boundary.** The frontend can be tampered to send arbitrary `routeId`
+ `classIdx` + `roundTrip` + passenger counts, but `unit_amount` is recomputed
server-side from `ROUTES[routeId].classes[classIdx].price`, so the worst a
client can do is order a different real product. Quantities are clamped
(1≤adults≤8, 0≤kids≤8, ≤12 items per cart).

## Affiliate model (added 2026-05-29, supersedes the MoR Stripe path for bookings)

Rather than become a merchant-of-record (months of contracts + KYC + per-
country tax + inventory partnerships), the live revenue model is **affiliate
out-link**: the "Continue on [Operator]" button on every route opens the
operator's own booking site (Amtrak.com, Eurostar.com, Trenitalia.com, JR
Central, …). The customer buys directly from the operator. The operator
delivers a real ticket and pays us a small commission (~3-8%) via an
affiliate network.

```
src/data/affiliate-links.json   per-operator URL + network + affiliateId slot
src/lib/booking.js              bookingUrl(route, config) resolver
  - direct                       no commission, plain deep link
  - awin                         wraps via awin1.com/cread.php
  - cj                           wraps via anrdoezrs.net/click-...
  - travelpayouts                wraps via tp.media/r
src/main.jsx                    bridges window.bookingUrl(route)
src/all.jsx                     all Buy buttons resolve to bookingUrl()
                                Cart "Continue on Operator ↗" opens new tab per leg
                                Detail "Continue on Operator ↗" replaces "Book now"
                                Planner onBook opens one tab per leg
                                AffiliateDisclosureFooter   persistent FTC disclosure
                                "How it works" modal        explains the model
```

Every outbound link carries `rel="noopener noreferrer sponsored"` per FTC
guidance and the networks' terms.

**Status table (operator → network → monetized?):**

| operator              | network        | merchantId   | monetized? |
|---|---|---|---|
| Amtrak                | CJ             | 9929080      | once affiliateId set |
| Eurostar              | Awin           | 5707         | once affiliateId set |
| Trenitalia            | Awin           | 20830        | once affiliateId set |
| SNCF                  | Awin           | 20831        | once affiliateId set |
| Deutsche Bahn         | Awin           | 16175        | once affiliateId set |
| Belmond               | Awin           | 12086        | once affiliateId set |
| JR Central, Korail, THSR | Travelpayouts | klook       | once affiliateId set |
| China Railway         | Travelpayouts  | trip         | once affiliateId set |
| Vietnam Rys, Indian Rys | Travelpayouts | 12go        | once affiliateId set |
| Rocky Mountaineer, VIA Rail, RhB/MGB, Vy, Caledonian Sleeper, KiwiRail, Blue Train, TAZARA, Tren a las Nubes, Renfe, ÖBB, Russian Rys, Brightline, ONCF, Kenya Rys, Serra Verde, FCCA | direct | — | direct deep-link (no commission) |

For the "direct" rows, monetization needs either (a) a direct affiliate program
with that operator, or (b) routing through a multi-modal aggregator like
GetYourGuide / Omio that does cover them. Future iteration.

## Stripe Checkout — kept, repurposed

The `api/checkout.js` + `api/session/[id].js` endpoints from the prior
iteration are still wired (test mode) but no UI path triggers them in the
default flow. Two retained uses:

- **Tip jar** — `affiliate-links.json::tipJar.stripePaymentLinkUrl` can hold a
  Stripe Payment Link URL for a "tip the developer" button (live-mode-safe
  because there's no fulfillment promise).
- **Future first-party premium** — if a future feature is genuinely
  deliverable digitally (e.g. a "Pro" rail-nerd account with saved itineraries,
  PDF exports), the existing infrastructure is ready.

## Live-mode rail booking (not a current path; kept for context)

To genuinely sell train tickets and route real money for them, we'd need
either operator-direct contracts or an aggregator:

- **Rail Europe Connect** — most European operators, merchant-of-record
- **Silverrail / SilverCore** — global aggregator, B2B API
- **Sabre Rail / Amadeus Rail / Travelport** — GDS-style integration
- **Direct with Amtrak partner program** — US-only

Each is a contracted relationship (weeks to months, financial guarantees,
sometimes IATA-grade accreditation). The affiliate pivot avoids all of this
while still earning real revenue per booking — at the cost of a smaller per-
booking margin and one extra click for the customer.

## Risk register (forward)

| risk | likelihood | impact | mitigation |
|---|---|---|---|
| The implicit script ordering hides bugs the bundler will surface (e.g. cycles, missing globals) | M | M | Convert one slice at a time; run the app between each conversion |
| `world-map.jsx` has a manual Equirectangular projection that may misalign after refactor | L | M | Snapshot a known route's path-d string before and after |
| `_llmPrefs` is gated on `window.claude`; tests must not call it | L | L | Test the heuristic path; gate the LLM path on env detection |
| GH Pages base-path mangling breaks asset URLs | M | L | Set `vite.config.js` `base: "/choo-choo-chooser/"` and `<base>` accordingly |
