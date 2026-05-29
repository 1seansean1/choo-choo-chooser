/* world-map.jsx — global rail map. Routes drawn as arcs between endpoints on an
   equirectangular world. Subtle continents for context; hover syncs with the list. */

const CONTINENTS = [
  // rough, low-detail outlines [lng,lat] — context only, not survey-accurate
  [[-168,65],[-160,71],[-128,70],[-95,69],[-80,73],[-62,60],[-55,49],[-66,44],[-76,35],[-81,25],[-97,18],[-106,23],[-110,30],[-117,32],[-125,40],[-124,48],[-136,57],[-150,59],[-168,65]],
  [[-80,9],[-60,11],[-50,0],[-35,-7],[-40,-20],[-48,-25],[-58,-34],[-65,-43],[-74,-52],[-75,-44],[-71,-30],[-70,-18],[-78,-5],[-80,9]],
  [[-10,36],[-9,44],[-3,49],[-6,53],[2,59],[12,58],[24,56],[30,60],[42,60],[40,47],[28,41],[18,40],[9,44],[1,43],[-5,40],[-10,36]],
  [[-17,15],[-11,34],[10,37],[24,33],[33,31],[43,12],[51,12],[42,-2],[40,-16],[32,-27],[20,-35],[16,-30],[12,-17],[9,4],[-8,5],[-17,15]],
  [[40,47],[40,66],[58,71],[95,78],[140,73],[162,70],[180,66],[170,60],[156,52],[142,46],[135,34],[122,30],[120,22],[108,18],[100,7],[92,7],[80,8],[70,20],[58,26],[46,38],[40,47]],
  [[114,-22],[122,-18],[130,-12],[142,-11],[146,-18],[151,-25],[153,-29],[149,-38],[142,-39],[135,-35],[129,-32],[120,-34],[115,-30],[114,-22]],
];
const REGION_CENTERS = {
  "North America": [-100, 47], "South America": [-61, -14], "Europe": [16, 52],
  "Africa": [21, 6], "Asia": [92, 47], "Oceania": [134, -26],
};

function WorldMap({ routes, hoveredId, setHoveredId, onOpen, selectedId }) {
  const wrapRef = React.useRef(null);
  const [tip, setTip] = React.useState(null);
  const W = 1000, H = 500;
  const X = lng => (lng + 180) / 360 * W;
  const Y = lat => (90 - lat) / 180 * H;

  const arcs = React.useMemo(() => routes.map(r => {
    const [lng0, lat0] = r.geo.from, [lng1, lat1] = r.geo.to;
    const x0 = X(lng0), y0 = Y(lat0), x1 = X(lng1), y1 = Y(lat1);
    let dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
    let nx = -dy / len, ny = dx / len;
    if (ny > 0) { nx = -nx; ny = -ny; } // bow toward top
    const k = Math.max(14, Math.min(70, len * 0.2));
    const cx = (x0 + x1) / 2 + nx * k, cy = (y0 + y1) / 2 + ny * k;
    return { r, x0, y0, x1, y1, cx, cy, path: `M${x0.toFixed(1)},${y0.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}` };
  }), [routes]);

  const anyHover = hoveredId != null;
  const short = s => (s || "").split(",")[0];

  function onMove(e) {
    const rect = wrapRef.current.getBoundingClientRect();
    setTip(t => t ? { ...t, x: e.clientX - rect.left, y: e.clientY - rect.top } : t);
  }

  return (
    <div className="mapcol" ref={wrapRef} onMouseMove={onMove}>
      <div className="maplabel" style={{ zIndex: 4 }}>World rail map · {routes.length} route{routes.length === 1 ? "" : "s"}</div>
      <svg className="netmap" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "100%" }}>
        <defs>
          <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--surface-2)" />
            <stop offset="1" stopColor="var(--surface-3)" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={W} height={H} fill="url(#ocean)" />
        {/* graticule */}
        <g stroke="var(--line)" strokeWidth="0.8" opacity="0.5">
          {[-120,-60,0,60,120].map(l => <line key={"m"+l} x1={X(l)} y1="0" x2={X(l)} y2={H} />)}
          {[60,30,0,-30,-60].map(l => <line key={"p"+l} x1="0" y1={Y(l)} x2={W} y2={Y(l)} />)}
        </g>
        {/* continents */}
        <g fill="var(--surface)" stroke="var(--line)" strokeWidth="1" opacity="0.95">
          {CONTINENTS.map((poly, i) => (
            <path key={i} d={poly.map(([lng,lat],j)=>(j?"L":"M")+X(lng).toFixed(1)+","+Y(lat).toFixed(1)).join(" ")+" Z"} />
          ))}
        </g>
        {/* region labels */}
        {Object.entries(REGION_CENTERS).map(([name, c]) => (
          <text key={name} x={X(c[0])} y={Y(c[1])} textAnchor="middle" fontSize="13" fontWeight="800" letterSpacing="0.8"
            fill="var(--ink-faint)" opacity="0.55" style={{ textTransform: "uppercase" }}>{name}</text>
        ))}

        {/* route arcs */}
        {arcs.map(({ r, x0, y0, x1, y1, path }) => {
          const col = window.routeColor(r).fg;
          const isHot = hoveredId === r.id || selectedId === r.id;
          const dim = anyHover && !isHot;
          return (
            <g key={r.id} style={{ opacity: dim ? 0.18 : 1, transition: "opacity .15s", cursor: "pointer" }}
              onMouseEnter={() => setHoveredId(r.id)} onMouseLeave={() => setHoveredId(null)}
              onMouseMove={e => { const rect = wrapRef.current.getBoundingClientRect(); setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top, route: r }); }}
              onClick={() => onOpen(r)}>
              <path d={path} fill="none" stroke="transparent" strokeWidth="14" />
              <path d={path} fill="none" stroke={col} strokeWidth={isHot ? 3.4 : 2} strokeLinecap="round"
                style={{ transition: "stroke-width .12s", filter: isHot ? "drop-shadow(0 2px 4px rgba(0,0,0,.3))" : "none" }} />
              <circle cx={x0} cy={y0} r={isHot ? 4.5 : 3} fill="var(--surface)" stroke={col} strokeWidth="2" />
              <circle cx={x1} cy={y1} r={isHot ? 5.5 : 3.6} fill={col} stroke="var(--surface)" strokeWidth="1.6" />
              {isHot && <g>
                <text x={x0} y={y0 - 9} textAnchor="middle" fontSize="11.5" fontWeight="700" fill="var(--ink)" stroke="var(--surface)" strokeWidth="3" style={{ paintOrder: "stroke" }}>{short(r.origin)}</text>
                <text x={x1} y={y1 - 9} textAnchor="middle" fontSize="11.5" fontWeight="700" fill="var(--ink)" stroke="var(--surface)" strokeWidth="3" style={{ paintOrder: "stroke" }}>{short(r.destination)}</text>
              </g>}
            </g>
          );
        })}
      </svg>

      {tip && tip.route && (() => {
        const r = tip.route, col = window.routeColor(r).fg;
        const dur = r.durationMin < 60 ? r.durationMin + "m" : (r.durationMin < 1440 ? Math.floor(r.durationMin / 60) + "h" : Math.round(r.durationMin / 1440) + "d");
        return (
          <div className="maptip" style={{ left: tip.x, top: tip.y, opacity: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
              <span style={{ width: 9, height: 9, borderRadius: 99, background: col }}></span>
              <strong style={{ fontFamily: "var(--serif)", fontSize: 15 }}>{r.name}</strong>
            </div>
            <div style={{ fontSize: 12, color: "#B9D2C4", marginBottom: 6 }}>{short(r.origin)} → {short(r.destination)} · {r.country}</div>
            <div style={{ display: "flex", gap: 14, fontFamily: "var(--mono)", fontSize: 12.5 }}>
              <span>{dur}</span><span>{r.distanceMi.toLocaleString()} mi</span>
              <span style={{ color: "#E8A877" }}>${r.priceFrom.toLocaleString()}+</span>
            </div>
          </div>
        );
      })()}

      <div className="maplegend" style={{ flexWrap: "wrap", maxWidth: 360, justifyContent: "flex-end" }}>
        {window.RAIL.regions.map(rg => (
          <span className="lg" key={rg}><span style={{ width: 12, height: 4, borderRadius: 9, background: window.RAIL.regionColors[rg].fg, display: "inline-block" }}></span>{rg.replace("North America","N. America").replace("South America","S. America")}</span>
        ))}
      </div>
    </div>
  );
}

window.WorldMap = WorldMap;
window.CONTINENTS = CONTINENTS;
