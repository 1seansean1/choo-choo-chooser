// src/mapviewer-app.jsx — the mapviewer component (preserved from mapviewer.jsx),
// with the ReactDOM.createRoot moved to the entry.

import React from "react";

/* mapviewer.jsx — standalone pan/zoom world rail map for Choo Choo Chooser.
   Shows every line in the catalog with interpolated station stops. */
const { useState, useMemo, useRef, useEffect, useCallback } = React;

const CONTINENTS = [
  [[-168,65],[-160,71],[-128,70],[-95,69],[-80,73],[-62,60],[-55,49],[-66,44],[-76,35],[-81,25],[-97,18],[-106,23],[-110,30],[-117,32],[-125,40],[-124,48],[-136,57],[-150,59],[-168,65]],
  [[-80,9],[-60,11],[-50,0],[-35,-7],[-40,-20],[-48,-25],[-58,-34],[-65,-43],[-74,-52],[-75,-44],[-71,-30],[-70,-18],[-78,-5],[-80,9]],
  [[-10,36],[-9,44],[-3,49],[-6,53],[2,59],[12,58],[24,56],[30,60],[42,60],[40,47],[28,41],[18,40],[9,44],[1,43],[-5,40],[-10,36]],
  [[-17,15],[-11,34],[10,37],[24,33],[33,31],[43,12],[51,12],[42,-2],[40,-16],[32,-27],[20,-35],[16,-30],[12,-17],[9,4],[-8,5],[-17,15]],
  [[40,47],[40,66],[58,71],[95,78],[140,73],[162,70],[180,66],[170,60],[156,52],[142,46],[135,34],[122,30],[120,22],[108,18],[100,7],[92,7],[80,8],[70,20],[58,26],[46,38],[40,47]],
  [[114,-22],[122,-18],[130,-12],[142,-11],[146,-18],[151,-25],[153,-29],[149,-38],[142,-39],[135,-35],[129,-32],[120,-34],[115,-30],[114,-22]],
];
const REGION_CENTERS = { "North America": [-104, 47], "South America": [-61, -14], "Europe": [18, 53], "Africa": [21, 4], "Asia": [100, 50], "Oceania": [134, -26] };

const W = 2000, H = 1000;
const projX = lng => (lng + 180) / 360 * W;
const projY = lat => (90 - lat) / 180 * H;
const short = s => (s || "").split(",")[0];
const num = n => n.toLocaleString("en-US");
const fmtDur = m => m < 60 ? m + "m" : m < 1440 ? Math.floor(m / 60) + "h" + (m % 60 ? " " + (m % 60) + "m" : "") : Math.round(m / 1440) + "d";

function bez(t, p0, c, p1) { const u = 1 - t; return [u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]]; }

// precompute geometry for one route
function geom(r) {
  const [lng0, lat0] = r.geo.from, [lng1, lat1] = r.geo.to;
  const p0 = [projX(lng0), projY(lat0)], p1 = [projX(lng1), projY(lat1)];
  let dx = p1[0] - p0[0], dy = p1[1] - p0[1], len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len, ny = dx / len; if (ny > 0) { nx = -nx; ny = -ny; }
  const k = Math.max(26, Math.min(150, len * 0.22));
  const c = [(p0[0] + p1[0]) / 2 + nx * k, (p0[1] + p1[1]) / 2 + ny * k];
  const path = `M${p0[0].toFixed(1)},${p0[1].toFixed(1)} Q${c[0].toFixed(1)},${c[1].toFixed(1)} ${p1[0].toFixed(1)},${p1[1].toFixed(1)}`;
  const totalMi = r.stations[r.stations.length - 1].mi || 1;
  const stops = r.stations.map((s, i) => {
    const t = Math.max(0, Math.min(1, s.mi / totalMi));
    const pt = bez(t, p0, c, p1);
    return { x: pt[0], y: pt[1], s, end: i === 0 || i === r.stations.length - 1 };
  });
  return { p0, p1, c, path, stops };
}

function Ico({ d, size = 18, sw = 1.8 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
}

function MapViewer() {
  const all = window.RAIL.routes;
  const RC = window.RAIL.regionColors;
  const svgRef = useRef(null);

  const [theme, setTheme] = useState("light");
  const [q, setQ] = useState("");
  const [activeRegions, setActiveRegions] = useState(new Set());
  const [hoverId, setHoverId] = useState(null);
  const [selId, setSelId] = useState(null);
  const [tip, setTip] = useState(null);
  const [view, setView] = useState({ k: 1, x: 0, y: 0 });

  useEffect(() => { document.body.setAttribute("data-theme", theme); }, [theme]);

  // precompute geometry once
  const G = useMemo(() => { const m = {}; all.forEach(r => m[r.id] = geom(r)); return m; }, [all]);

  const filtered = useMemo(() => all.filter(r => {
    if (activeRegions.size && !activeRegions.has(r.region)) return false;
    if (q) {
      const hay = (r.name + " " + r.operator + " " + r.origin + " " + r.destination + " " + r.country + " " + r.stations.map(s => s.name).join(" ")).toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  }), [all, activeRegions, q]);
  const visibleIds = useMemo(() => new Set(filtered.map(r => r.id)), [filtered]);

  const stats = useMemo(() => {
    const ops = new Set(), countries = new Set(); let stops = 0;
    filtered.forEach(r => { ops.add(r.operator); (r.country || "").split(/[·,]/).forEach(c => countries.add(c.trim())); stops += r.stations.length; });
    return { lines: filtered.length, stops, ops: ops.size, countries: countries.size };
  }, [filtered]);

  const sel = selId ? all.find(r => r.id === selId) : null;

  // ----- pan / zoom -----
  const clientToVB = useCallback((cx, cy) => {
    const svg = svgRef.current; const pt = svg.createSVGPoint(); pt.x = cx; pt.y = cy;
    const m = svg.getScreenCTM(); if (!m) return { x: 0, y: 0 };
    return pt.matrixTransform(m.inverse());
  }, []);

  function onWheel(e) {
    e.preventDefault();
    const vb = clientToVB(e.clientX, e.clientY);
    const factor = e.deltaY < 0 ? 1.18 : 1 / 1.18;
    setView(v => {
      const k2 = Math.max(0.85, Math.min(16, v.k * factor));
      const f = k2 / v.k;
      return { k: k2, x: vb.x - (vb.x - v.x) * f, y: vb.y - (vb.y - v.y) * f };
    });
  }
  const drag = useRef(null);
  function onDown(e) { drag.current = { vb: clientToVB(e.clientX, e.clientY), moved: false }; svgRef.current.classList.add("grabbing"); }
  function onMove(e) {
    if (!drag.current) return;
    const vb = clientToVB(e.clientX, e.clientY);
    const dx = vb.x - drag.current.vb.x, dy = vb.y - drag.current.vb.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.current.moved = true;
    setView(v => ({ k: v.k, x: v.x + dx, y: v.y + dy }));
    // recompute against the updated transform on next event
    drag.current.vb = clientToVB(e.clientX, e.clientY);
  }
  function onUp() { if (svgRef.current) svgRef.current.classList.remove("grabbing"); setTimeout(() => { drag.current = null; }, 0); }

  function zoomBy(factor) {
    setView(v => {
      const k2 = Math.max(0.85, Math.min(16, v.k * factor));
      const f = k2 / v.k;
      const cx = W / 2, cy = H / 2;
      return { k: k2, x: cx - (cx - v.x) * f, y: cy - (cy - v.y) * f };
    });
  }
  function resetView() { setView({ k: 1, x: 0, y: 0 }); }

  // frame a route's bbox
  const fitRoute = useCallback((r) => {
    const g = G[r.id]; const xs = [g.p0[0], g.p1[0], g.c[0]], ys = [g.p0[1], g.p1[1], g.c[1]];
    let minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const padX = Math.max(120, (maxX - minX) * 0.45), padY = Math.max(120, (maxY - minY) * 0.6);
    minX -= padX; maxX += padX; minY -= padY; maxY += padY;
    const bw = maxX - minX, bh = maxY - minY;
    const k = Math.max(0.85, Math.min(16, Math.min(W / bw, H / bh)));
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    setView({ k, x: W / 2 - cx * k, y: H / 2 - cy * k });
  }, [G]);

  function selectRoute(r) { setSelId(r.id); fitRoute(r); }

  function moveTip(e, r) {
    const rect = svgRef.current.getBoundingClientRect();
    setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top, r });
  }

  const anyFocus = hoverId || selId;
  const labelK = view.k; // show more labels when zoomed in

  return (
    <div className="mv">
      {/* ---------- side panel ---------- */}
      <aside className="mv-panel">
        <div className="mv-brand">
          <span className="mark"><Ico d={<><rect x="5" y="3" width="14" height="13" rx="3" /><path d="M5 11h14M9 3v8M7 20l2-3M17 20l-2-3" /></>} size={23} sw={1.7} /></span>
          <div><h1>Rail Map Viewer</h1><div className="sub">Every line on Earth</div></div>
        </div>
        <div className="mv-stats">
          <div className="mv-stat"><div className="n">{stats.lines}</div><div className="l">Lines</div></div>
          <div className="mv-stat"><div className="n">{num(stats.stops)}</div><div className="l">Stops</div></div>
          <div className="mv-stat"><div className="n">{stats.ops}</div><div className="l">Operators</div></div>
          <div className="mv-stat"><div className="n">{stats.countries}</div><div className="l">Countries</div></div>
        </div>
        <div className="mv-search">
          <div className="box">
            <Ico d={<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>} size={16} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search lines, cities, stations…" />
            {q && <button onClick={() => setQ("")} style={{ border: "none", background: "none", color: "var(--ink-faint)" }}><Ico d={<path d="M6 6l12 12M18 6L6 18" />} size={15} sw={2} /></button>}
          </div>
        </div>
        <div className="mv-chips">
          {window.RAIL.regions.map(rg => {
            const on = activeRegions.has(rg);
            return (
              <button key={rg} className={"mv-chip" + (on ? " on" : "")} style={on ? { background: RC[rg].fg } : null}
                onClick={() => setActiveRegions(p => { const n = new Set(p); n.has(rg) ? n.delete(rg) : n.add(rg); return n; })}>
                <span className="cdot" style={{ background: on ? "#fff" : RC[rg].fg }}></span>{rg.replace("North America", "N. America").replace("South America", "S. America")}
              </button>
            );
          })}
        </div>
        <div className="mv-listhdr"><span>{filtered.length} lines</span>{(q || activeRegions.size) ? <button onClick={() => { setQ(""); setActiveRegions(new Set()); }} style={{ border: "none", background: "none", color: "var(--rust)", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: ".4px" }}>Reset</button> : <span></span>}</div>
        <div className="mv-list">
          {filtered.map(r => {
            const c = RC[r.region];
            return (
              <div key={r.id} className={"lineitem" + (selId === r.id ? " sel" : "")}
                onMouseEnter={() => setHoverId(r.id)} onMouseLeave={() => setHoverId(null)}
                onClick={() => selectRoute(r)}>
                <span className="ldot" style={{ background: c.fg }}></span>
                <div className="lmain">
                  <div className="lname">{r.name}</div>
                  <div className="lsub">{r.operator} · {short(r.origin)} → {short(r.destination)}</div>
                  <div className="lmeta">{fmtDur(r.durationMin)} · {num(r.distanceMi)} mi · {r.topSpeedMph} mph</div>
                </div>
                <div className="lstops">{r.stations.length}<br /><span style={{ fontSize: 9, color: "var(--ink-faint)" }}>stops</span></div>
              </div>
            );
          })}
          {filtered.length === 0 && <div style={{ padding: 24, textAlign: "center", color: "var(--ink-faint)" }}>No lines match.</div>}
        </div>
      </aside>

      {/* ---------- map ---------- */}
      <div className="mv-map">
        <svg ref={svgRef} className="mv-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
          onWheel={onWheel} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}>
          <defs>
            <linearGradient id="mvocean" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--surface-2)" /><stop offset="1" stopColor="var(--surface-3)" /></linearGradient>
          </defs>
          <rect x="0" y="0" width={W} height={H} fill="url(#mvocean)" />
          <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
            {/* graticule */}
            <g stroke="var(--line)" strokeWidth={0.8 / view.k} opacity="0.45">
              {[-120, -60, 0, 60, 120].map(l => <line key={"m" + l} x1={projX(l)} y1="0" x2={projX(l)} y2={H} />)}
              {[60, 30, 0, -30, -60].map(l => <line key={"p" + l} x1="0" y1={projY(l)} x2={W} y2={projY(l)} />)}
            </g>
            {/* continents */}
            <g fill="var(--surface)" stroke="var(--line)" strokeWidth={1 / view.k}>
              {CONTINENTS.map((poly, i) => <path key={i} d={poly.map(([lng, lat], j) => (j ? "L" : "M") + projX(lng).toFixed(1) + "," + projY(lat).toFixed(1)).join(" ") + " Z"} />)}
            </g>
            {/* region labels */}
            {!anyFocus && Object.entries(REGION_CENTERS).map(([name, cc]) => (
              <text key={name} x={projX(cc[0])} y={projY(cc[1])} textAnchor="middle" fontSize={26 / view.k} fontWeight="800" letterSpacing="1.5" fill="var(--ink-faint)" opacity="0.5" style={{ textTransform: "uppercase" }}>{name}</text>
            ))}

            {/* arcs */}
            {filtered.map(r => {
              const g = G[r.id], c = RC[r.region];
              const hot = hoverId === r.id || selId === r.id;
              const dim = anyFocus && !hot;
              return (
                <g key={r.id} style={{ opacity: dim ? 0.13 : 1, transition: "opacity .14s", cursor: "pointer" }}
                  onMouseEnter={() => setHoverId(r.id)} onMouseLeave={() => setHoverId(null)}
                  onMouseMove={e => moveTip(e, r)}
                  onClick={() => selectRoute(r)}>
                  <path d={g.path} fill="none" stroke="transparent" strokeWidth={20 / view.k} />
                  <path d={g.path} fill="none" stroke={c.fg} strokeWidth={(hot ? 4.5 : 2.4) / view.k} strokeLinecap="round"
                    style={{ filter: hot ? "drop-shadow(0 1px 3px rgba(0,0,0,.35))" : "none" }} />
                </g>
              );
            })}

            {/* station dots (only for focused, or all when zoomed in) */}
            {filtered.map(r => {
              const g = G[r.id], c = RC[r.region];
              const hot = hoverId === r.id || selId === r.id;
              const showAll = view.k > 3.2;
              if (anyFocus && !hot) return null;
              if (!hot && !showAll) {
                // just endpoints in overview
                return <g key={r.id}>{g.stops.filter(s => s.end).map((s, i) => (
                  <circle key={i} cx={s.x} cy={s.y} r={3.4 / view.k} fill={c.fg} stroke="var(--surface)" strokeWidth={1.4 / view.k} />
                ))}</g>;
              }
              return (
                <g key={r.id}>
                  {g.stops.map((s, i) => (
                    <circle key={i} cx={s.x} cy={s.y} r={(s.end ? 5.5 : 3.8) / view.k}
                      fill={s.end ? c.fg : "var(--surface)"} stroke={c.fg} strokeWidth={(s.end ? 2 : 2.4) / view.k} />
                  ))}
                  {hot && g.stops.map((s, i) => (
                    <text key={"t" + i} x={s.x} y={s.y - (s.end ? 11 : 8) / view.k} textAnchor="middle"
                      fontSize={(s.end ? 13 : 11) / view.k} fontWeight={s.end ? 800 : 600} fill="var(--ink)"
                      stroke="var(--surface)" strokeWidth={3 / view.k} style={{ paintOrder: "stroke" }}>{short(s.s.name)}</text>
                  ))}
                </g>
              );
            })}
          </g>
        </svg>

        {/* top controls */}
        <div className="mv-top">
          <a className="mv-back" href="index.html"><Ico d={<path d="M15 6l-6 6 6 6" />} size={16} sw={2.2} />Back to search</a>
          <span className="mv-hint">Scroll to zoom · drag to pan · click a line</span>
        </div>
        <button className="mv-themebtn" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} title="Toggle theme">
          <Ico d={theme === "dark" ? <><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" /></> : <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />} size={17} />
        </button>

        {/* zoom controls */}
        <div className="mv-zoom">
          <button onClick={() => zoomBy(1.4)} title="Zoom in">+</button>
          <button onClick={() => zoomBy(1 / 1.4)} title="Zoom out">−</button>
          <button className="sm" onClick={resetView} title="Reset view">RESET</button>
        </div>

        {/* legend */}
        <div className="mv-legend">
          <div className="lg-t">Lines by region</div>
          {window.RAIL.regions.map(rg => (
            <div className="lg-row" key={rg}><span className="sw" style={{ background: RC[rg].fg }}></span>{rg}</div>
          ))}
          <div className="lg-foot">Station positions are interpolated along each line — schematic, not survey-exact.</div>
        </div>

        {/* hover tooltip */}
        {tip && !drag.current && (() => {
          const c = RC[tip.r.region];
          return (
            <div className="mv-tip" style={{ left: tip.x, top: tip.y }}>
              <div className="t-name">{tip.r.name}</div>
              <div className="t-sub">{tip.r.operator} · {short(tip.r.origin)} → {short(tip.r.destination)}</div>
              <div className="t-meta"><span>{fmtDur(tip.r.durationMin)}</span><span>{num(tip.r.distanceMi)} mi</span><span style={{ color: "#E8A877" }}>${num(tip.r.priceFrom)}+</span></div>
            </div>
          );
        })()}

        {/* selected route detail */}
        {sel && (() => {
          const c = RC[sel.region];
          return (
            <div className="mv-detail">
              <div className="d-head" style={{ background: c.fg }}>
                <button className="d-close" onClick={() => setSelId(null)}><Ico d={<path d="M6 6l12 12M18 6L6 18" />} size={15} sw={2.2} /></button>
                <h3>{sel.name}</h3>
                <div className="d-tag">{sel.operator} · {sel.region}</div>
              </div>
              <div className="d-body">
                <div className="d-stat"><span>Route</span><b style={{ fontFamily: "var(--serif)", fontWeight: 600 }}>{short(sel.origin)} → {short(sel.destination)}</b></div>
                <div className="d-stat"><span>Distance</span><b>{num(sel.distanceMi)} mi</b></div>
                <div className="d-stat"><span>Duration</span><b>{fmtDur(sel.durationMin)}</b></div>
                <div className="d-stat"><span>Top speed</span><b>{sel.topSpeedMph} mph</b></div>
                <div className="d-stat"><span>Highest point</span><b>{num(sel.elevHighFt)} ft</b></div>
                <div className="d-stat"><span>Fares from</span><b style={{ color: "var(--rust)" }}>${num(sel.priceFrom)}</b></div>
                <div className="mv-stops">
                  <div className="ss-t">{sel.stations.length} stations</div>
                  {sel.stations.map((s, i) => {
                    const end = i === 0 || i === sel.stations.length - 1;
                    return (
                      <div className={"stoprow" + (end ? " end" : "")} key={i}>
                        <span className="sdot" style={{ borderColor: c.fg, background: end ? c.fg : "var(--surface)" }}></span>
                        <span className="sname">{s.name}</span>
                        <span className="selev">{num(s.elevFt)} ft</span>
                      </div>
                    );
                  })}
                </div>
                <a className="mv-openbtn" href={"index.html"}>Search & book this line →</a>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}


export { MapViewer };
