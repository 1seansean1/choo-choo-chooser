# requirement-set.v1 — Choo Choo Chooser

IEEE 29148 form. Each row: `req_code | statement | acceptance_criteria | verification_method (T/A/I/D) | priority | trace`.

Verification key: **T**=test, **A**=analysis, **I**=inspection, **D**=demonstration. A row gets `T` only when a runnable executed test can decide it.

## C1 — Discover the catalog

| req_code | statement | acceptance_criteria | v | priority | trace |
|---|---|---|---|---|---|
| R-C1.1-01 | The system **shall** load the full route catalog (>= 40 routes, current prototype = 43) at startup with zero network calls beyond static assets. | `ROUTES.length >= 40` after data modules load; no XHR to non-CDN origins. | T | M | C1.1 |
| R-C1.2-01 | The system **shall** match an origin/destination text query against route origin, destination, country, and any station name (case-insensitive substring). | Query "denver" returns >= 1 route; query "moffat" returns the California Zephyr; empty query returns all. | T | M | C1.2 |
| R-C1.3-01 | The system **shall** AND-combine all active filters (region, operator, category, amenity, price ceiling, scenic-only) with the search query. | With `regions={"Europe"}` and `cats={"Scenic"}`, every result satisfies both. | T | M | C1.3 |
| R-C1.3-02 | The system **shall** treat amenity filters as **all-of** (every selected amenity must be present), not any-of. | Selecting `["dome","dining"]` returns only routes whose `amenities` contains both. | T | M | C1.3 |
| R-C1.3-03 | The system **shall** treat `scenicOnly` as `scenicScore >= 70`. | Threshold value = 70 in code; results enforce it. | T | M | C1.3 |
| R-C1.4-01 | The system **shall** support sort orders: scenic (desc), price (asc), duration (asc), distance (desc), top-speed (desc), climb (desc). | One executed test per order verifies the ordering predicate. | T | M | C1.4 |
| R-C1.5-01 | The system **shall** provide a randomized "Feeling lucky" pick drawn from the current filtered set, falling back to the full catalog when empty. | When `filtered.length === 0`, the chosen route comes from `all`; otherwise from `filtered`. | T | L | C1.5 |

## C2 — Compare in three views

| req_code | statement | acceptance_criteria | v | priority | trace |
|---|---|---|---|---|---|
| R-C2.1-01 | The system **shall** render a card grid where each card shows: ribbon (category), scenic badge, origin → destination, depart time, duration, distance, top speed, climb, elevation sparkline, and from-price. | Visual inspection of `Card` against the live page. | I | M | C2.1 |
| R-C2.2-01 | The system **shall** render a compact table view sharing the same filter/sort state as the card view. | Switching layout preserves results count and order. | D | L | C2.2 |
| R-C2.3-01 | The system **shall** render a world-map view that draws each filtered route as a polyline between its geo endpoints. | Inspection of the SVG output for a known route count. | I | M | C2.3 |
| R-C2.3-02 | The system **shall** highlight a route on the map when the user hovers its mini-row, and open route detail on click. | Demonstration in the live UI. | D | M | C2.3 |

## C3 — Inspect a route

| req_code | statement | acceptance_criteria | v | priority | trace |
|---|---|---|---|---|---|
| R-C3.1-01 | The system **shall** open a route-detail overlay showing scenes, stations, elevation profile, classes, amenities, discounts, and a book bar. | Inspection of `Detail` component output. | I | M | C3.1 |
| R-C3.2-01 | The system **shall** link from the topbar to a separate full-screen Map Viewer (`Map Viewer.html`). | The "Map" button navigates to `Map Viewer.html`; that page loads route data and renders without console errors. | D | L | C3.2 |
| R-C3.3-01 | The system **shall** let the user choose travel class and passenger counts (adults, kids) before adding to cart. | Inspection of the Detail book bar; price re-computes on change. | I | M | C3.3 |

## C4 — Multi-stop planner

| req_code | statement | acceptance_criteria | v | priority | trace |
|---|---|---|---|---|---|
| R-C4.1-01 | The system **shall** support a multi-stop itinerary of 2 to 5 stops. | Add-stop disabled at 5; remove disabled at 2; demonstrated. | D | M | C4.1 |
| R-C4.2-01 | The system **shall** suggest a candidate route for each leg whose origin and destination contain the entered stop names. | Stops `["Denver","Chicago"]` suggests California Zephyr eastbound. | T | M | C4.2 |
| R-C4.3-01 | The system **shall** check out all legs as a single order. | Demonstration: clicking "Book" on a 3-stop plan opens checkout with 2 line items. | D | M | C4.3 |

## C5 — Cart and checkout

| req_code | statement | acceptance_criteria | v | priority | trace |
|---|---|---|---|---|---|
| R-C5.1-01 | The system **shall** apply a 10% round-trip saver when `roundTrip=true`. | `itemPrice({roundTrip:true,...})` equals `2·one·0.9`, ±$0.01. | T | M | C5.1 |
| R-C5.1-02 | The system **shall** apply a 50% discount to kid passengers on routes whose discounts include a kid/child entry. | Catalog route with `discounts:[{name:"Kids 2–12"}]` yields adult+kid total = `base·(adults + 0.5·kids)`. | T | M | C5.1 |
| R-C5.3-01 | The system **shall** compute a 5% service fee with a $0.50 floor on any non-empty cart. | `cartTotals([x])` returns `fee == max(0.50, round(subtotal·0.05, 2))`; empty cart returns `fee = 0`. | T | M | C5.3 |
| R-C5.3-02 | The system **shall** round all monetary outputs to 2 decimal places. | `cartTotals` outputs satisfy `n === +n.toFixed(2)`. | T | M | C5.3 |
| R-C5.2-01 | The system **shall** persist the cart and account across page reload via `localStorage`. | Add → reload → cart still present. | D | M | C5.2 |
| R-C5.4-01 | The system **shall** require an authenticated account at checkout. | Demonstration: checkout button on cart opens auth if no account. | D | M | C5.4 |

## C6 — Account and personalization

| req_code | statement | acceptance_criteria | v | priority | trace |
|---|---|---|---|---|---|
| R-C6.1-01 | The system **shall** allow the user to create an account with name, email, optional card, and optional free-text preferences. | Demonstration of `Store.createAccount(...)`. | D | M | C6.1 |
| R-C6.2-01 | The system **shall** parse free-text preferences into a structured preference object via LLM when available, with a deterministic heuristic fallback that never throws. | Unit test of `_heuristicPrefs` on representative inputs (regions/categories/maxPrice extraction). | T | M | C6.2 |
| R-C6.2-02 | The system **shall** filter LLM output to only the catalog's actual regions, providers, and categories. | The `keep(...)` filter is invoked on each list. | T | M | C6.2 |
| R-C6.3-01 | The system **shall** surface up to 6 deal notices ranked by discount percentage, restricted to routes that match active prefs when prefs are non-empty. | `_notices(prefs).length <= 6` and ordered by `score` desc. | T | M | C6.3 |
| R-C6.4-01 | The system **shall** persist account, prefs, and cart to `localStorage` under one versioned key. | Inspection of `KEY = "ccc_store_v1"`. | I | L | C6.4 |

## C7 — Presentation

| req_code | statement | acceptance_criteria | v | priority | trace |
|---|---|---|---|---|---|
| R-C7.1-01 | The system **shall** offer light and dark themes via a `data-theme` attribute on `<body>`. | Inspection: toggling flips the attribute and re-themes the page. | I | M | C7.1 |
| R-C7.2-01 | The system **shall** offer an accent-color tweak that updates the `--accent` CSS variable. | Inspection of the Tweaks panel. | I | L | C7.2 |
| R-C7.3-01 | The system **shall** offer a default layout (cards / table / map) that persists for the session. | Demonstration. | D | L | C7.3 |

## C8 — Productionization (NEW)

| req_code | statement | acceptance_criteria | v | priority | trace |
|---|---|---|---|---|---|
| R-C8.1-01 | The build system **shall** produce a static, single-directory bundle (`dist/`) deployable to any static host. | `npm run build` exits 0 and writes `dist/index.html` plus hashed assets. | T | H | C8.1 |
| R-C8.1-02 | The build system **shall not** require in-browser Babel-standalone at runtime. | Built `dist/index.html` contains no `babel.min.js` reference; JSX is pre-compiled. | T | H | C8.1 |
| R-C8.2-01 | The repository **shall** include an executable test suite covering all `T`-marked requirements (Vitest or equivalent). | `npm test` exits 0 with N >= 15 passing cases. | T | H | C8.2 |
| R-C8.3-01 | The repository **shall** be deployable to GitHub Pages from `dist/` via a documented procedure. | A successful `gh-pages` publish (or `peaceiris/actions-gh-pages` run) is recorded. | D | M | C8.3 |
| R-C8.4-01 | The repository **shall** contain a README that explains run-locally, run-tests, and build-and-deploy. | Inspection of `README.md`. | I | M | C8.4 |
| R-C8.4-02 | The repository **shall** contain a `LICENSE` file. | Inspection. | I | L | C8.4 |
