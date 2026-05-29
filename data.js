/* Choo Choo Chooser — global passenger rail catalog (CORE)
   A curated, worldwide selection of notable passenger trains. Figures are
   realistic and rounded for a prototype — not for booking. Geo coords are
   [lng, lat] of the endpoints, used by the world map. */
(function () {
  const AM = {
    dome:      "Glass-dome lounge",
    panorama:  "Panoramic windows",
    dining:    "Full dining car",
    cafe:      "Café / snack car",
    sleeper:   "Sleeping cars",
    bar:       "Onboard bar",
    lounge:    "Lounge car",
    wifi:      "Wi-Fi",
    power:     "Power outlets",
    restroom:  "Restrooms",
    baggage:   "Checked baggage",
    bike:      "Bike spaces",
    ski:       "Ski & board racks",
    wheelchair:"Wheelchair accessible",
    pets:      "Pets allowed",
    meals:     "Gourmet meals included",
    butler:    "Cabin / suite service",
    seatRecline:"Reclining seats",
    luggage:   "Luggage racks",
    quiet:     "Quiet car",
    outdoor:   "Open-air viewing",
    host:      "Onboard hosts / guides",
    standee:   "Standing room",
    oxygen:    "Cabin oxygen supply",
  };

  const REGIONS = ["North America", "Europe", "Asia", "Oceania", "Africa", "South America"];

  const REGION_COLORS = {
    "North America":  { fg: "#BB5430", bg: "rgba(187,84,48,.15)" },
    "Europe":         { fg: "#2E6E8E", bg: "rgba(46,110,142,.15)" },
    "Asia":           { fg: "#A33A57", bg: "rgba(163,58,87,.15)" },
    "Oceania":        { fg: "#2F8E7E", bg: "rgba(47,142,126,.16)" },
    "Africa":         { fg: "#5E8C49", bg: "rgba(94,140,73,.16)" },
    "South America":  { fg: "#C8902B", bg: "rgba(200,144,43,.16)" },
  };

  window.RAIL = {
    AM: AM,
    regions: REGIONS,
    regionColors: REGION_COLORS,
    routes: [],
    add: function (arr) { this.routes.push.apply(this.routes, arr); },
  };
  // color helper used across components
  window.routeColor = function (r) { return REGION_COLORS[r.region] || REGION_COLORS["North America"]; };
  // back-compat alias for any leftover references
  window.OP_COLORS = new Proxy({}, { get: () => REGION_COLORS["North America"] });
})();
