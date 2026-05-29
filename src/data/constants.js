// constants.js — domain-wide vocab pulled from the original window.RAIL skeleton.

export const AM = {
  dome:       "Glass-dome lounge",
  panorama:   "Panoramic windows",
  dining:     "Full dining car",
  cafe:       "Café / snack car",
  sleeper:    "Sleeping cars",
  bar:        "Onboard bar",
  lounge:     "Lounge car",
  wifi:       "Wi-Fi",
  power:      "Power outlets",
  restroom:   "Restrooms",
  baggage:    "Checked baggage",
  bike:       "Bike spaces",
  ski:        "Ski & board racks",
  wheelchair: "Wheelchair accessible",
  pets:       "Pets allowed",
  meals:      "Gourmet meals included",
  butler:     "Cabin / suite service",
  seatRecline:"Reclining seats",
  luggage:    "Luggage racks",
  quiet:      "Quiet car",
  outdoor:    "Open-air viewing",
  host:       "Onboard hosts / guides",
  standee:    "Standing room",
  oxygen:     "Cabin oxygen supply",
};

export const REGIONS = [
  "North America",
  "Europe",
  "Asia",
  "Oceania",
  "Africa",
  "South America",
];

export const REGION_COLORS = {
  "North America": { fg: "#BB5430", bg: "rgba(187,84,48,.15)" },
  "Europe":        { fg: "#2E6E8E", bg: "rgba(46,110,142,.15)" },
  "Asia":          { fg: "#A33A57", bg: "rgba(163,58,87,.15)" },
  "Oceania":       { fg: "#2F8E7E", bg: "rgba(47,142,126,.16)" },
  "Africa":        { fg: "#5E8C49", bg: "rgba(94,140,73,.16)" },
  "South America": { fg: "#C8902B", bg: "rgba(200,144,43,.16)" },
};

export function routeColor(r) {
  return REGION_COLORS[r.region] || REGION_COLORS["North America"];
}
