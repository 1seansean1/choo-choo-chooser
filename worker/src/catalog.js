// worker/src/catalog.js — bring the catalog + pricing constants into the
// Worker bundle by re-exporting from the frontend's ESM modules. wrangler
// (esbuild under the hood) inlines them at deploy time.

export { ROUTES } from "../../src/data/index.js";
export { SERVICE_FEE_PCT, FEE_MIN, ROUND_TRIP_SAVER } from "../../src/lib/pricing.js";
