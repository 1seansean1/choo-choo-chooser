# test-eval-report.v1 — Choo Choo Chooser

## Run

```
vitest v2.1.9
 ✓ tests/pricing.test.js     (8 tests,    7 ms)
 ✓ tests/preferences.test.js (11 tests,  16 ms)
 ✓ tests/catalog.test.js     (3 tests,   41 ms)
 ✓ tests/filters.test.js     (15 tests,  38 ms)
 ✓ tests/build.test.js       (2 tests, 5985 ms)
Test Files  5 passed (5)
Tests       39 passed (39)
Duration    7.42 s
```

## Coverage by capability

| capability | T-tests | passed | notes |
|---|---|---|---|
| C1 — discover | 11 | 11 | catalog, search, filters, sorts, lucky |
| C4 — multi-stop planner | 1 | 1 | `suggestLeg` happy path + null path |
| C5 — cart + pricing | 7 | 7 | round-trip saver, kid discount, fee floor, fee %, money precision |
| C6 — preferences | 11 | 11 | heuristic robustness, whitelist, LLM mock, notices |
| C8 — productionization | 3 | 3 | build exit code, no babel in dist, plus the suite itself |
| (component-level UI) | 0 | n/a | verified by I/D — see RTM |

Every T-marked requirement has at least one bound, passing test. Zero skipped tests. Zero `xfail`. Zero `.only`. No flaky retries.

## Anti-pattern audit

- **Mocking too much?** Only `llmPrefs` is mocked (test of whitelist behavior on a controlled LLM response). All other tests run against the real `ROUTES` import — no fixtures, no stubs.
- **Hidden assertions?** Each test asserts at least one explicit `expect(...)`. The build test additionally inspects the on-disk artifact rather than just trusting `execSync`'s exit code.
- **Flakiness surface?** The lucky test pins the RNG via dependency injection (`() => 0.5`). The build test bounds at `60_000` ms but completes in ~6s.
- **Coupling to internals?** Tests import only the public surface of each lib module — no internal helpers.

## Gaps deferred

- React component-level rendering tests (would require `jsdom` + `@testing-library/react`). Marked I/D in the RTM; verified by Playwright smoke at deploy time.
- End-to-end browser tests (deferred — Playwright smoke at deploy substitutes).
- Performance budgets (deferred — out of scope for v0.1).

Gate decision: **PASS.** Move forward to retro + codebase-review.
