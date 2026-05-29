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

## Risk register (forward)

| risk | likelihood | impact | mitigation |
|---|---|---|---|
| The implicit script ordering hides bugs the bundler will surface (e.g. cycles, missing globals) | M | M | Convert one slice at a time; run the app between each conversion |
| `world-map.jsx` has a manual Equirectangular projection that may misalign after refactor | L | M | Snapshot a known route's path-d string before and after |
| `_llmPrefs` is gated on `window.claude`; tests must not call it | L | L | Test the heuristic path; gate the LLM path on env detection |
| GH Pages base-path mangling breaks asset URLs | M | L | Set `vite.config.js` `base: "/choo-choo-chooser/"` and `<base>` accordingly |
