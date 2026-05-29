# test-set.v1 — Choo Choo Chooser

ISO/IEC/IEEE 29119-3. Implemented as Vitest under `tests/`. Per skill-chain rule **a row is `passed` only when its bound test ran green**; rows marked I/D are not eligible for `passed` from a test run.

## Test plan

- Framework: **Vitest** (browser-like jsdom env not required for these tests; pure-function modules are imported and called directly).
- Layers under test: `src/lib/pricing.js`, `src/lib/preferences.js`, `src/lib/filters.js`, `src/data/index.js` (catalog load), `src/lib/store.js` (cart ops).
- Out of scope for T-tests: React component rendering (deferred to I/D — visual inspection of the running app). Component test infra is a 2-day add we're not taking on in this drive.
- Pass bar: 100% of T-marked requirements have at least one runnable test that passes; zero failing tests; zero skipped.

## Test cases

| tc_id | requirement | description | inputs | expected | type |
|---|---|---|---|---|---|
| TC-CAT-01 | R-C1.1-01 | Catalog loads >= 40 routes | import `ROUTES` | `ROUTES.length >= 40` | T |
| TC-SEARCH-01 | R-C1.2-01 | Text query matches origin / station / country (case-insensitive) | `matchPlace(r, "denver", true)` for a Denver-origin route | true | T |
| TC-SEARCH-02 | R-C1.2-01 | Text query matches against an intermediate station name | `matchPlace(zephyr, "moffat", true)` | true | T |
| TC-SEARCH-03 | R-C1.2-01 | Empty query returns true | `matchPlace(any, "", true)` | true | T |
| TC-FILT-01 | R-C1.3-01 | AND-combination across filters | `filter({regions:["Europe"], cats:["Scenic"]})` | every result is region=Europe and category=Scenic | T |
| TC-FILT-02 | R-C1.3-02 | Amenities are all-of | `filter({ams:["dome","dining"]})` | every result has both | T |
| TC-FILT-03 | R-C1.3-03 | scenicOnly threshold = 70 | `filter({scenicOnly:true})` | every `scenicScore >= 70` | T |
| TC-SORT-01 | R-C1.4-01 | Sort orders are monotonic in the right direction | each of 6 sorts | adjacent pairs satisfy comparator | T |
| TC-LUCKY-01 | R-C1.5-01 | Lucky picks from filtered when non-empty | `lucky(filtered=[A,B,C])` | result ∈ {A,B,C} | T |
| TC-LUCKY-02 | R-C1.5-01 | Lucky falls back to all when filtered is empty | `lucky([], all)` | result ∈ all | T |
| TC-PLAN-01 | R-C4.2-01 | Planner suggests route whose origin and destination contain stop names | `suggestLeg("Denver","Chicago")` | id `cz-east` | T |
| TC-PRICE-01 | R-C5.1-01 | Round-trip saver 10% applied | `itemPrice({roundTrip:true, classIdx:0, adults:1, kids:0})` on Zephyr W | `2 * 88 * 0.9 == 158.40` | T |
| TC-PRICE-02 | R-C5.1-02 | Kid discount 50% on kid-eligible routes | `legBase(zephyr, 0, 1, 1)` | `88 + 88*0.5 == 132.00` | T |
| TC-PRICE-03 | R-C5.1-02 | Kid discount NOT applied when route lacks kid discount entry | route without kid discount, `legBase(..,1,1)` | `base * 2` | T |
| TC-CART-01 | R-C5.3-01 | Service fee floor $0.50 on non-empty cart | tiny cart with `subtotal=$1` | `fee == 0.50` | T |
| TC-CART-02 | R-C5.3-01 | Service fee 5% above floor | cart with `subtotal=$100` | `fee == 5.00` | T |
| TC-CART-03 | R-C5.3-01 | Empty cart fee = 0 | `cartTotals([])` | `fee === 0` | T |
| TC-CART-04 | R-C5.3-02 | All money values are 2-decimal-precise | sample `cartTotals` result | `n === +n.toFixed(2)` | T |
| TC-PREF-01 | R-C6.2-01 | Heuristic parser extracts region from text | `heuristicPrefs("scenic train in europe under $300")` | `regions includes "Europe"` | T |
| TC-PREF-02 | R-C6.2-01 | Heuristic parser extracts categories | same input | `categories includes "Scenic"` | T |
| TC-PREF-03 | R-C6.2-01 | Heuristic parser extracts maxPrice | same input | `maxPrice == 300` | T |
| TC-PREF-04 | R-C6.2-01 | Heuristic parser never throws on garbage | `heuristicPrefs(""), heuristicPrefs(null)` | returns an object | T |
| TC-PREF-05 | R-C6.2-02 | LLM output whitelist filters invalid values | `keepAgainst(["NotARegion","Europe"], REGIONS)` | `["Europe"]` | T |
| TC-DEAL-01 | R-C6.3-01 | Notices list capped at 6 | `notices(prefs={})` on full catalog | `length <= 6` | T |
| TC-DEAL-02 | R-C6.3-01 | Notices ordered by score desc | same | adjacent pairs satisfy `a.score >= b.score` | T |
| TC-BUILD-01 | R-C8.1-01 | `npm run build` produces dist/index.html | run build | exits 0; file exists | T |
| TC-BUILD-02 | R-C8.1-02 | dist/index.html has no babel.min.js reference | grep | no match | T |

## Requirements Traceability Matrix (RTM)

| req | verification | bound tests | status |
|---|---|---|---|
| R-C1.1-01 | T | TC-CAT-01 | (run-pending) |
| R-C1.2-01 | T | TC-SEARCH-01, -02, -03 | (run-pending) |
| R-C1.3-01 | T | TC-FILT-01 | (run-pending) |
| R-C1.3-02 | T | TC-FILT-02 | (run-pending) |
| R-C1.3-03 | T | TC-FILT-03 | (run-pending) |
| R-C1.4-01 | T | TC-SORT-01 | (run-pending) |
| R-C1.5-01 | T | TC-LUCKY-01, -02 | (run-pending) |
| R-C2.1-01 | I | — | inspection |
| R-C2.2-01 | D | — | demonstration |
| R-C2.3-01 | I | — | inspection |
| R-C2.3-02 | D | — | demonstration |
| R-C3.1-01 | I | — | inspection |
| R-C3.2-01 | D | — | demonstration |
| R-C3.3-01 | I | — | inspection |
| R-C4.1-01 | D | — | demonstration |
| R-C4.2-01 | T | TC-PLAN-01 | (run-pending) |
| R-C4.3-01 | D | — | demonstration |
| R-C5.1-01 | T | TC-PRICE-01 | (run-pending) |
| R-C5.1-02 | T | TC-PRICE-02, -03 | (run-pending) |
| R-C5.3-01 | T | TC-CART-01, -02, -03 | (run-pending) |
| R-C5.3-02 | T | TC-CART-04 | (run-pending) |
| R-C5.2-01 | D | — | demonstration |
| R-C5.4-01 | D | — | demonstration |
| R-C6.1-01 | D | — | demonstration |
| R-C6.2-01 | T | TC-PREF-01..04 | (run-pending) |
| R-C6.2-02 | T | TC-PREF-05 | (run-pending) |
| R-C6.3-01 | T | TC-DEAL-01, -02 | (run-pending) |
| R-C6.4-01 | I | — | inspection |
| R-C7.1-01 | I | — | inspection |
| R-C7.2-01 | I | — | inspection |
| R-C7.3-01 | D | — | demonstration |
| R-C8.1-01 | T | TC-BUILD-01 | (run-pending) |
| R-C8.1-02 | T | TC-BUILD-02 | (run-pending) |
| R-C8.2-01 | T | (the suite itself; meta) | (run-pending) |
| R-C8.3-01 | D | — | demonstration |
| R-C8.4-01 | I | — | inspection |
| R-C8.4-02 | I | — | inspection |
