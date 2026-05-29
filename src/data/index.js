// data/index.js — catalog barrel. ROUTES is the union of every region file.

import americas from "./americas.js";
import europe from "./europe.js";
import asia from "./asia.js";
import southern from "./southern.js";
import extraEuas from "./extra-euas.js";
import extraWorld from "./extra-world.js";
import expansion2026 from "./expansion-2026.js";

export { AM, REGIONS, REGION_COLORS, routeColor } from "./constants.js";

export const ROUTES = [
  ...americas,
  ...europe,
  ...asia,
  ...southern,
  ...extraEuas,
  ...extraWorld,
  ...expansion2026,
];
