// mapviewer-main.jsx — Vite entry for the full-screen Map Viewer page.

import React from "react";
import ReactDOM from "react-dom/client";

import { AM, REGIONS, REGION_COLORS, routeColor, ROUTES } from "./data/index.js";
import "./mapviewer.css";

window.RAIL = {
  AM,
  regions: REGIONS,
  regionColors: REGION_COLORS,
  routes: ROUTES,
  add() {},
};
window.routeColor = routeColor;

import { MapViewer } from "./mapviewer-app.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(<MapViewer />);
