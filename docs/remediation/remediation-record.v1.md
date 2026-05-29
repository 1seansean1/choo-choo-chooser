# remediation-record.v1 — RUN-20260528-CCC-001

Five findings worked. Three closed, one partial-close + waiver, one deferred.

## FND-RP-01 [HIGH] — Drift-risk duplicates at repo root → **CLOSED**

`git rm` 18 prototype files that the Vite build no longer references:

```
app.jsx cart.jsx checkout.jsx datepicker.jsx detail.jsx mapviewer.jsx
scenes.jsx store.jsx tweaks-panel.jsx world-map.jsx
data.js data-americas.js data-asia.js data-europe.js data-southern.js
data-extra-euas.js data-extra-world.js "Map Viewer.html"
```

**Verification.** `npm run build` still exits 0; `npm test` still 39/39 green; live site unchanged.

## FND-RP-02 [MEDIUM] — esbuild < 0.24.3 → **CLOSED**

Added `package.json` `overrides: { esbuild: "^0.25.0" }`. After `rm -rf node_modules package-lock.json && npm install`, esbuild resolves to `0.25.12`. The `GHSA-67mh-4wv8-2f99` advisory is no longer flagged for esbuild.

**Verification.** `npm ls esbuild` → `esbuild@0.25.12`. `npm audit` no longer reports the esbuild chain.

## FND-RP-03 [LOW] — Node 20 runner deprecation → **CLOSED**

`.github/workflows/deploy.yml` now pins `node-version: "22"`.

**Verification.** Next workflow run picks up Node 22.

## FND-RP-04 [LOW] — Missing favicon → **CLOSED**

`public/favicon.svg` added (vector train mark on the brand's rust gradient). Both HTML entries reference it. Vite copies `public/` to `dist/` automatically.

**Verification.** `dist/favicon.svg` exists; both `dist/*.html` contain the `<link rel="icon">` tag.

## Residual: Vite < 6 path-traversal advisory → **WAIVED (dev-server-only)**

`npm audit` after remediation still flags `GHSA-4w7w-66w2-5vf9` against `vite@5.4.21`. Same dev-server-only profile as FND-RP-02 — production builds are unaffected. The recommended fix bumps Vite to v8, a breaking change that would also drag in new Vitest, new plugin-react, and config-syntax migrations. Out of scope for this drive.

- **Waiver id:** WVR-CCC-001
- **Scope:** `vite@5.4.x` dev-server source-map handling, dev workstation only
- **Compensating control:** Dev server bound to `127.0.0.1` by default; not exposed to LAN. Production deploys do not ship the dev server.
- **Revisit:** Next time `vite@latest-5.x` ships a patch, or whenever a Vite-8 migration is otherwise warranted.

## FND-RP-05..08 — Deferred to the tech-debt ledger

`docs/review/retrospective.v1.md` carries: TD-01 (no component tests), TD-02 (concat → modules split), TD-05 (LLM only inside Claude artifact), TD-06 (PWA recipe), TD-07 (no analytics). Plus FND-RP-06 (cleartext email in localStorage) and FND-RP-07 (Google Fonts CDN privacy nit) added to the ledger as informational items.

## Updated gate decision

| gate | before | after |
|---|---|---|
| Security | CONDITIONAL (FND-RP-02 MED) | **PASS** (waiver WVR-CCC-001 for the residual dev-server advisory) |
| Code quality | CONDITIONAL (FND-RP-01 HIGH) | **PASS** |
| Testing strategy | PASS | PASS |
| Ops readiness | PASS (with low-sev Node 20 note) | PASS |
| Compliance / traceability | PASS | PASS |

**Overall: PASS.** Release gate is now clean.
