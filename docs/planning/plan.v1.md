# plan.v1 — Choo Choo Chooser

## Releases

| release | name | scope | status |
|---|---|---|---|
| R1 | Prototype | All current behavior (`R-C1.*` through `R-C7.*`) | **done by hand (this is the imported zip)** |
| R2 | Productionize build | `R-C8.1-01`, `R-C8.1-02` — Vite migration, modular extraction | todo |
| R3 | Test coverage | `R-C8.2-01` + all `T`-marked rows in `test-set.v1` go green | todo |
| R4 | Deploy + polish | `R-C8.3-01`, `R-C8.4-01`, `R-C8.4-02` — README, LICENSE, public deploy | todo |

R1 is verified by **inspection** of the running prototype (screenshot already present at `screenshots/mapviewer.png`) and **demonstration** by loading `index.html` in a browser. R1 has no T-marked rows because no test infrastructure existed in the prototype.

## Sprints (one sprint per release in this drive)

### Sprint S2 — Productionize (R2)
- S2.T1 Add `package.json`, `vite.config.js`, dev/build/preview scripts
- S2.T2 Extract `data/` modules from `window.RAIL.add(...)` into ESM
- S2.T3 Extract `lib/pricing.js`, `lib/preferences.js`, `lib/filters.js`, `lib/store.js`
- S2.T4 Convert all `*.jsx` components to ESM (default-export each)
- S2.T5 Hoist CSS from `index.html` into `src/styles.css`
- S2.T6 Wire `src/main.jsx` entry; rewrite `index.html` as Vite entry
- S2.T7 Wire `mapviewer.html` as second Vite entry
- S2.T8 `npm run build` produces `dist/` with no `babel.min.js`
- S2.T9 `npm run dev` opens app at localhost:5173; smoke pass

### Sprint S3 — Test the contract (R3)
- S3.T1 Add `vitest`, `@testing-library/jest-dom`, devDeps
- S3.T2 Implement `tests/pricing.test.js` (TC-PRICE-*, TC-CART-*)
- S3.T3 Implement `tests/preferences.test.js` (TC-PREF-*)
- S3.T4 Implement `tests/filters.test.js` (TC-FILT-*, TC-SORT-*, TC-LUCKY-*, TC-SEARCH-*)
- S3.T5 Implement `tests/catalog.test.js` (TC-CAT-*)
- S3.T6 Implement `tests/planner.test.js` (TC-PLAN-*)
- S3.T7 Implement `tests/deals.test.js` (TC-DEAL-*)
- S3.T8 Implement `tests/build.test.js` (TC-BUILD-*) — runs `npm run build` and inspects output
- S3.T9 `npm test` green; mark RTM rows passed

### Sprint S4 — Deploy + polish (R4)
- S4.T1 Write `README.md` (run-locally, test, build, deploy)
- S4.T2 Write `LICENSE` (MIT)
- S4.T3 Add GH Actions workflow `.github/workflows/deploy.yml` (publish `dist/` to `gh-pages`)
- S4.T4 Create remote at `1seansean1/choo-choo-chooser`, push, enable Pages
- S4.T5 Verify the deployed site loads, catalog renders, theme toggles work

## Dependencies / critical path

```
S2.T1 → S2.T2,T3,T4,T5 (parallelizable) → S2.T6,T7 → S2.T8 → S2.T9
                                                       └─→ S3.T1 → S3.T2..T8 (parallelizable) → S3.T9
                                                                                                 └─→ S4.T1..T2 (parallel) → S4.T3 → S4.T4 → S4.T5
```

Critical path: S2.T1 → S2.T6 → S2.T8 → S3.T1 → S3.T8 → S3.T9 → S4.T3 → S4.T4 → S4.T5.

## Done-definition per release

- R2: `npm run build` exits 0; `dist/index.html` exists; no `babel.min.js` referenced anywhere in `dist/`.
- R3: `npm test` exits 0; every `T`-marked req in `test-set.v1.md` has at least one PASSED test; RTM updated.
- R4: A live URL serves the app; the catalog loads; the cart persists across reload (demonstration); README + LICENSE in repo root.

## Out of scope (deferred)

- React component-level tests (would need jsdom + @testing-library/react). Defer until a regression motivates the cost.
- Real payment integration / live availability / operator APIs.
- AcqForge program registration. The user will get a follow-up offer at the end of this drive.
- Service-worker / installable PWA. Personal-app hosting memory mentions PWA as a recipe; defer to a later iteration.

## Cost / safety gate

- All work is local file edits + a public-repo push to the user's personal GitHub. No mutating-production GovCloud step. No covering token needed.
- The GH Pages publish is a destructive-ish step in that it creates a public artifact. **I'll confirm with the user before pushing to a public repo.**
