# omega-space.v1 — Choo Choo Chooser

**Scope.** Discovery, comparison, and booking of scheduled passenger-rail journeys, worldwide, for leisure-leaning consumers. The prototype is the corpus.

## Distinctions (Ω)
- `Trip.intent`: { commute, business, leisure-fast, leisure-scenic, sleeper-overnight, multi-stop-itinerary } — leisure-scenic dominates the prototype's affordances.
- `Route.kind`: { commuter, regional, high-speed, long-distance, scenic, sleeper, luxury } — drives the **Trip type** filter pill.
- `Region`: { North America, Europe, Asia, Oceania, Africa, South America } — partitions both data and operator palette.
- `Operator`: open set, ~30 operators across 6 region files.
- `Layout.view`: { cards, table, map } — three views over the same filtered set.
- `Trip.mode`: { one-way, round-trip, multi-stop } — multi-stop opens a different planner UI.
- `Pricing.scope`: { per-leg, round-trip-saver-10pct, service-fee-5pct-floor-$0.50 } — encoded in `CCCPrice`.

## Generators (G — what shapes the space)
- A route record: identity, geo endpoints, schedule, distance/duration/speed, elevation profile + scenic score, classes (with price), discounts (kid/senior/pass), amenities, scenes (typed thumbnails), stations.
- A filter projection: `(fromQ, toQ, regions, operators, cats, ams, maxPrice, scenicOnly, sort) → filtered ⊆ all`.
- A pricing function: `(route, classIdx, adults, kids, roundTrip) → price`, with `subtotal + max(fee_min, subtotal·fee_pct) = total`.
- A preference parser: `free-text → {regions, providers, categories, maxPrice, scenicOnly, interests}`, with an LLM path and a deterministic heuristic fallback.
- A persistence layer: `localStorage` for cart + account + prefs.

## Partitions (P)
- **Catalog × Filter** — the as-built UX is a faceted browse over a static-but-rich catalog. Personalization is a derived filter, not a separate engine.
- **Browse × Plan** — single-route browse (one-way / round) vs. multi-leg planner. Different reducers; same catalog.
- **Free × Auth** — anonymous browse + cart works; checkout requires an account; preferences require an account.
- **Static × Live** — schedules are seeded constants. No live-availability call exists in the prototype; this is a known boundary.

## μ-family (credence bands on what's true of the domain)
- High: users want to compare routes visually (cards, map, elevation sparkline). Backed by three layouts, the world map, and the elevation spark/profile.
- High: scenery is first-class, not a filter afterthought. `scenicScore`, "Scenic routes only (70+)", scenes carousel.
- Medium: users want a multi-stop planner. Present, but visibly less polished than the one-way/round path.
- Medium: users want LLM-shaped preferences. Wired but gated on `window.claude.complete` (artifact env only) with a heuristic fallback.
- Low: real-time booking. The prototype mocks payment and persists locally; not wired to any reservation system.

## Obstacle registers
- **Distinction obstacles** — the catalog conflates "long-distance" and "scenic" loosely (e.g. California Zephyr eastbound has scenicScore 62, westbound 98 — the *direction* matters for the partition).
- **Avoidance obstacles** — no live availability, no payment processor, no operator API; the prototype deliberately avoids the integration burden.

## Viewpoint registers
- Consumer/traveler — the primary persona; everything in the UI optimizes their browse-and-book.
- Operator — absent; no marketplace tooling.
- Developer — implicit: in-browser Babel, no build, JSX files served raw. Productionization is the principal viewpoint conflict to resolve in later phases.
