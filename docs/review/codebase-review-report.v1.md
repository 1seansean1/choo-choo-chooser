# codebase-review-report.v1 — Choo Choo Chooser

Scope: the full repo at HEAD (commit `15e7199`).
Run-id: RUN-20260528-CCC-001.

## Gates

| gate | finding | status |
|---|---|---|
| Security | 5 LOW + 1 MEDIUM (dev-server esbuild advisory) | **CONDITIONAL** — remediate FND-RP-02 |
| Code quality | 1 HIGH (drift-risk duplicates at repo root) + 2 LOW | **CONDITIONAL** — remediate FND-RP-01 |
| Testing strategy | 39/39 green; every T-marked req bound to a real test | **PASS** |
| Ops readiness | 1 LOW (Node 20 runner deprecation) | **PASS** |
| Compliance / traceability | Full RTM, requirements ↔ tests ↔ commits | **PASS** |

**Overall decision: CONDITIONAL.** Two findings (HIGH + MEDIUM) must be remediated before this becomes a clean PASS. Remediation is dispatched in Phase 17.

## Findings

### FND-RP-01 [HIGH] Drift-risk duplicates at repo root

The Vite migration left the original prototype files on disk at the repo root:

```
app.jsx              cart.jsx       checkout.jsx       data.js
data-americas.js     data-asia.js   data-europe.js     data-southern.js
data-extra-euas.js   data-extra-world.js               datepicker.jsx
detail.jsx           mapviewer.jsx  scenes.jsx         store.jsx
tweaks-panel.jsx     world-map.jsx  Map Viewer.html
```

These files are no longer referenced by either `index.html` or `mapviewer.html`. A contributor who edits, say, `app.jsx` at the root will be confused when the change does not appear in the build (which compiles `src/all.jsx` instead). Worse, the dataset under `src/data/*.js` and the originals under `data-*.js` will silently drift apart.

**Fix.** `git rm` the root duplicates. `src/` is canonical.

**Verification.** `npm run build && npm test` still green after deletion; `dist/` produced; live site continues to render.

### FND-RP-02 [MEDIUM] esbuild < 0.24.3 — GHSA-67mh-4wv8-2f99

`npm audit` reports 5 moderate-severity advisories chained through `vite@5.4.21 → esbuild@0.21.5`. The vulnerability allows any website to send requests to the **development server** (not the production server) and read responses. Production builds are unaffected — `dist/` does not ship esbuild.

Still: the dev server runs on a developer's workstation while they have other tabs open. Worth fixing.

**Fix.** `npm i vite@^5.4.21` does not update the transitive esbuild pin; need to either bump to vite ≥ 6 (breaking) or pin an esbuild override in `package.json` (`"overrides": { "esbuild": "^0.24.3" }`).

**Verification.** `npm audit` reports 0 vulnerabilities; `npm run build` still exits 0.

### FND-RP-03 [LOW] GH Actions runner Node 20 deprecation

`.github/workflows/deploy.yml` pins `actions/setup-node@v4 with: node-version: "20"`. GH announced Node 20 will be removed from runners on 2026-09-16.

**Fix.** Bump `node-version: "22"`.

**Verification.** Re-run the workflow; build + deploy succeed.

### FND-RP-04 [LOW] Missing favicon

Every page load reports `Failed to load resource: 404 favicon.ico`. Cosmetic.

**Fix.** Drop a `favicon.svg` at repo root and reference it from both HTML entries.

### FND-RP-05 [LOW] Concat strategy in src/all.jsx loses tree-shaking

`src/all.jsx` is a 2455-line concatenation of all the prototype's JSX files. This was the right pragmatic call to ship the Vite migration on day 1 (avoided hand-editing 9 files), but it leaves the bundle without dead-code elimination at the component level and makes navigation harder.

**Fix.** Split back into per-file ESM modules over the next iteration. Defer.

### FND-RP-06 [LOW] account.email persisted in cleartext to localStorage

`src/lib/store.js` writes `{ cart, account }` to `localStorage.ccc_store_v1` without encryption. Account is a demo POJO (`{name, email, cards: [{id, brand, last4, exp, name}]}`) — last4 is not a secret, and email is the user's own. Acceptable for a prototype with no real auth.

**Fix.** Defer until real auth is wired.

### FND-RP-07 [LOW] Google Fonts CDN leaks visitor IP

Both HTML entries preconnect to `fonts.googleapis.com`. Privacy nit.

**Fix.** Self-host the three font families (Spectral, Hanken Grotesque, Space Mono) under `src/fonts/`. Defer.

### FND-RP-08 [INFO] No React component-level tests

Only pure-function tests + Playwright smoke at deploy time. RTM rows for `R-C2.*`, `R-C3.*`, `R-C7.*` are verified by inspection/demonstration. Acceptable; defer adding jsdom + RTL.

## Trace matrix (requirements ↔ tests ↔ commits)

The RTM in `docs/test/test-set.v1.md` already records test-pass status per requirement. All 16 T-marked requirements have at least one passing test bound to them. Commits:

- `039d01e` chore: initial import — closes R1 by inspection
- `68dfe44` docs: upstream phases — codifies the 36 requirements
- `e9ce86f` feat(R2): Vite migration — closes R-C8.1-01, R-C8.1-02
- `8e2d304` test(R3): vitest suite — closes R-C8.2-01 and binds all T-marked rows
- `15e7199` feat(R4): README + LICENSE + workflow — closes R-C8.3-01, R-C8.4-01, R-C8.4-02

## Operational state

- Repo: https://github.com/1seansean1/choo-choo-chooser
- Live: https://1seansean1.github.io/choo-choo-chooser/
- Live (map): https://1seansean1.github.io/choo-choo-chooser/mapviewer.html
- CI: `.github/workflows/deploy.yml` runs on every push to `main`
- Test command: `npm test` (39 tests, ~7s)
- Build command: `npm run build` (~1.8s)
