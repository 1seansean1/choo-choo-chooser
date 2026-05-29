// api/_lib/catalog.js — re-export the catalog + pricing constants so the
// Vercel build inlines them into the serverless function bundle.

export { ROUTES } from "../../src/data/index.js";
export { SERVICE_FEE_PCT, FEE_MIN, ROUND_TRIP_SAVER } from "../../src/lib/pricing.js";
