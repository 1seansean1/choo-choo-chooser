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

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and publishes `dist/` to GitHub Pages.

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
