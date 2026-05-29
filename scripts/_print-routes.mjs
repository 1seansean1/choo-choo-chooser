import { ROUTES } from "../src/data/index.js";
for (const r of ROUTES) {
  console.log([r.id, r.region, r.operator, r.name, r.origin + " -> " + r.destination].join("\t"));
}
console.log("---TOTAL---", ROUTES.length);
