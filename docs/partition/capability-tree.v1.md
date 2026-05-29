# capability-tree.v1 — Choo Choo Chooser

Root: **C0 · Help a traveler choose and book a passenger-rail journey.**

```
C0 Choose-and-book a rail journey
├── C1 Discover the catalog
│   ├── C1.1 Browse all routes worldwide
│   ├── C1.2 Search by origin / destination text
│   ├── C1.3 Filter by region, operator, trip-type, amenities, price ceiling, scenic-only
│   ├── C1.4 Sort by scenic / price / duration / distance / speed / climb
│   └── C1.5 "Feeling lucky?" — randomized pick from current results
├── C2 Compare results in three views
│   ├── C2.1 Card grid with elevation sparkline
│   ├── C2.2 Compact table
│   └── C2.3 World map (hover-traces route, click opens detail)
├── C3 Inspect a route in depth
│   ├── C3.1 Route detail panel (scenes, stations, elevation profile, classes, amenities, discounts)
│   ├── C3.2 Open separate full-screen Map Viewer
│   └── C3.3 Class + passenger-count selection
├── C4 Plan a multi-stop itinerary
│   ├── C4.1 Add up to 5 stops
│   ├── C4.2 Auto-suggest a route per leg (matched on origin/destination)
│   └── C4.3 Book all legs as a single checkout
├── C5 Cart and checkout
│   ├── C5.1 Add a leg to cart (one-way or round-trip; round-trip saver 10%)
│   ├── C5.2 Edit cart line (class, passengers, date)
│   ├── C5.3 Compute totals (subtotal + service fee 5% / $0.50 min)
│   └── C5.4 Checkout with saved card
├── C6 Account and personalization
│   ├── C6.1 Sign in / sign up (email + name + card; demo flow)
│   ├── C6.2 Free-text preferences → LLM or heuristic → applied filters
│   ├── C6.3 Personalized "For You" deal carousel from discounts
│   └── C6.4 Persistence to localStorage (cart, account, prefs)
├── C7 Presentation / theming
│   ├── C7.1 Light / dark themes
│   ├── C7.2 Accent color tweak
│   └── C7.3 Layout default (cards / table / map)
└── C8 Productionization (NEW — does not yet exist in prototype)
    ├── C8.1 Build / bundle the app (Vite or equivalent)
    ├── C8.2 Test suite for pricing + filters + preferences + cart
    ├── C8.3 Deploy as a public PWA-capable site
    └── C8.4 Repo hygiene (README, license, contributing, CI)
```

Each leaf carries an implicit `requirement_slot[]` — phase 9 attaches one or more 29148 shall-statements per leaf.
