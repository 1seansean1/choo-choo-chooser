/* detail.jsx — route detail overlay: gallery, map, elevation, amenities, fares, timetable */

function fmtDur(min) {
  if (min < 60) return min + "m";
  const h = Math.floor(min / 60), m = min % 60;
  return h + "h" + (m ? " " + m + "m" : "");
}
function commas(n) { return n.toLocaleString("en-US"); }

/* ---- amenity icons (functional line icons) ---- */
function AmIcon({ id }) {
  const s = { width: 19, height: 19, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  const P = {
    dome: <><path d="M3 14a9 5 0 0 1 18 0" /><path d="M3 14v3h18v-3" /><path d="M8 10v4M12 9v5M16 10v4" /></>,
    dining: <><path d="M5 3v8M8 3v8M6.5 11v10M16 3c-1.5 0-2 4-2 7h4V3" /></>,
    cafe: <><path d="M4 8h13v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" /><path d="M17 9h2a2 2 0 0 1 0 4h-2" /><path d="M7 3v2M11 3v2" /></>,
    sleeper: <><path d="M3 17v-5h13a3 3 0 0 1 3 3v2" /><path d="M3 17h18M3 12V7" /><circle cx="7" cy="10" r="1.6" /></>,
    bar: <><path d="M5 4h14l-7 8z" /><path d="M12 12v6M8 21h8" /></>,
    wifi: <><path d="M5 12a10 10 0 0 1 14 0M8 15.5a5 5 0 0 1 8 0" /><circle cx="12" cy="19" r="1" /></>,
    power: <><rect x="6" y="3" width="12" height="18" rx="2" /><path d="M12 7v4l2 2" /></>,
    restroom: <><path d="M8 21V3M16 21V3M4 8h8M12 8h8" /></>,
    baggage: <><rect x="5" y="7" width="14" height="13" rx="2" /><path d="M9 7V4h6v3M9 11v5M15 11v5" /></>,
    bike: <><circle cx="6" cy="17" r="3.2" /><circle cx="18" cy="17" r="3.2" /><path d="M6 17l4-7h5l3 7M10 10l-1-3h4" /></>,
    ski: <><path d="M4 20l16-14M6 18l3 3M5 6l13 13" /></>,
    wheelchair: <><circle cx="12" cy="4.5" r="1.8" /><path d="M11 7v6h5l2 5M11 10a5 5 0 1 0 4 8" /></>,
    pets: <><circle cx="5.5" cy="9" r="1.6" /><circle cx="9.5" cy="6" r="1.6" /><circle cx="14.5" cy="6" r="1.6" /><circle cx="18.5" cy="9" r="1.6" /><path d="M12 11c-3 0-5 3-5 5a2.5 2.5 0 0 0 4 1.8 3 3 0 0 1 2 0A2.5 2.5 0 0 0 17 16c0-2-2-5-5-5z" /></>,
    meals: <><circle cx="12" cy="13" r="7" /><path d="M12 13l3-3M5 5h14" /></>,
    seatRecline: <><path d="M7 20v-6l3-9 2 1-2 8h7v6" /><circle cx="9" cy="4" r="1.6" /></>,
    luggage: <><rect x="6" y="6" width="12" height="14" rx="2" /><path d="M9 6V3h6v3M11 10v6M14 10v6" /></>,
    quiet: <><path d="M11 5 6 9H3v6h3l5 4z" /><path d="M16 9a5 5 0 0 1 0 6" /><path d="M19 6l-3 12" stroke="currentColor" /></>,
    outdoor: <><path d="M3 12h18M5 12V8a7 7 0 0 1 14 0v4" /><path d="M3 16h18M3 20h18" /></>,
    host: <><circle cx="12" cy="8" r="3.4" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
    standee: <><circle cx="12" cy="5" r="2" /><path d="M12 7v7M9 21l3-7 3 7M8 11h8" /></>,
  };
  return <svg {...s}>{P[id] || <circle cx="12" cy="12" r="3" />}</svg>;
}

/* ---- interactive elevation chart ---- */
function ElevationChart({ route, accent }) {
  const [hover, setHover] = React.useState(null);
  const W = 760, H = 220, padL = 48, padR = 16, padT = 18, padB = 30;
  const data = route.elevation;
  const maxMi = data[data.length - 1].mi;
  const minMi = data[0].mi;
  const fts = data.map(d => d.ft);
  let lo = Math.min(...fts), hi = Math.max(...fts);
  const pad = Math.max(200, (hi - lo) * 0.12);
  lo = Math.floor((lo - pad) / 250) * 250;
  hi = Math.ceil((hi + pad) / 250) * 250;

  const X = mi => padL + ((mi - minMi) / (maxMi - minMi)) * (W - padL - padR);
  const Y = ft => padT + (1 - (ft - lo) / (hi - lo)) * (H - padT - padB);

  const linePts = data.map(d => [X(d.mi), Y(d.ft)]);
  const linePath = linePts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const areaPath = linePath + ` L${X(maxMi)},${H - padB} L${X(minMi)},${H - padB} Z`;

  // y gridlines
  const gridFt = [];
  for (let f = lo; f <= hi; f += (hi - lo) / 4) gridFt.push(Math.round(f));

  function move(e) {
    const svg = e.currentTarget;
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const mi = minMi + ((px - padL) / (W - padL - padR)) * (maxMi - minMi);
    if (mi < minMi || mi > maxMi) { setHover(null); return; }
    // interpolate ft
    let ft = data[0].ft;
    for (let i = 1; i < data.length; i++) {
      if (mi <= data[i].mi) {
        const a = data[i - 1], b = data[i];
        const t = (mi - a.mi) / (b.mi - a.mi || 1);
        ft = a.ft + (b.ft - a.ft) * t; break;
      }
    }
    setHover({ mi, ft, x: X(mi), y: Y(ft) });
  }

  const peak = data.reduce((m, d) => d.ft > m.ft ? d : m, data[0]);

  return (
    <div className="elevwrap">
      <div className="elev-summary">
        <div className="es"><div className="arrow up"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg></div><div><div className="et">+{commas(route.elevGainFt)} ft</div><div className="el">Total climb</div></div></div>
        <div className="es"><div className="arrow down"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7" /></svg></div><div><div className="et">−{commas(route.elevLossFt)} ft</div><div className="el">Total descent</div></div></div>
        <div className="es"><div className="arrow peak"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20l6-12 4 7 3-5 5 10z" /></svg></div><div><div className="et">{commas(route.elevHighFt)} ft</div><div className="el">Highest point</div></div></div>
        <div className="es"><div className="arrow down" style={{ background: "rgba(110,97,53,.14)", color: "var(--ink-soft)" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 18h16M4 18l4-6 4 3 4-7 4 4" /></svg></div><div><div className="et">{commas(route.elevLowFt)} ft</div><div className="el">Lowest point</div></div></div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block", cursor: "crosshair" }} onMouseMove={move} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="elevfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={accent} stopOpacity="0.34" />
            <stop offset="1" stopColor={accent} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {gridFt.map((f, i) => (
          <g key={i}>
            <line x1={padL} y1={Y(f)} x2={W - padR} y2={Y(f)} stroke="var(--line)" strokeWidth="1" strokeDasharray="2 4" />
            <text x={padL - 8} y={Y(f) + 4} textAnchor="end" fontSize="11" fontFamily="var(--mono)" fill="var(--ink-faint)">{commas(f)}</text>
          </g>
        ))}
        <path d={areaPath} fill="url(#elevfill)" />
        <path d={linePath} fill="none" stroke={accent} strokeWidth="2.5" strokeLinejoin="round" />
        {/* station markers w/ labels */}
        {data.filter(d => d.label).map((d, i) => (
          <g key={i}>
            <circle cx={X(d.mi)} cy={Y(d.ft)} r="4.5" fill="var(--surface)" stroke={accent} strokeWidth="2.5" />
            <text x={X(d.mi)} y={Y(d.ft) - 12} textAnchor={i === 0 ? "start" : (d.mi === maxMi ? "end" : "middle")} fontSize="10.5" fontWeight="700" fill="var(--ink-soft)">{d.label}</text>
          </g>
        ))}
        {/* x-axis miles */}
        <text x={padL} y={H - 8} fontSize="11" fontFamily="var(--mono)" fill="var(--ink-faint)">{minMi} mi</text>
        <text x={W - padR} y={H - 8} textAnchor="end" fontSize="11" fontFamily="var(--mono)" fill="var(--ink-faint)">{commas(maxMi)} mi</text>
        {hover && <g>
          <line x1={hover.x} y1={padT} x2={hover.x} y2={H - padB} stroke={accent} strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
          <circle cx={hover.x} cy={hover.y} r="5" fill={accent} stroke="var(--surface)" strokeWidth="2" />
        </g>}
      </svg>
      {hover && <div className="elev-tip" style={{ left: (hover.x / W * 100) + "%", top: (hover.y / H * 100) + "%", opacity: 1 }}>
        <span className="tipft">{commas(Math.round(hover.ft / 5) * 5)} ft</span>
        <span className="tipmi">mile {Math.round(hover.mi)}{route.avgSpeedMph ? " · ≈ " + fmtDur(Math.round(hover.mi / route.avgSpeedMph * 60)) + " in" : ""}</span>
      </div>}
    </div>
  );
}

/* ---- stylized route map ---- */
/* ---- geographic route map ---- */
function RouteMap({ route, accent }) {
  const DW = 760, DH = 300, TARGET = DW / DH;
  const PW = 2000, PH = 1000;
  const X = lng => (lng + 180) / 360 * PW;
  const Y = lat => (90 - lat) / 180 * PH;
  const short = s => (s || "").split(",")[0];
  const bez = (t, a, c, b) => { const u = 1 - t; return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]; };

  const st = route.stations;
  const [lng0, lat0] = route.geo.from, [lng1, lat1] = route.geo.to;
  const p0 = [X(lng0), Y(lat0)], p1 = [X(lng1), Y(lat1)];
  let dx = p1[0] - p0[0], dy = p1[1] - p0[1], len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len, ny = dx / len; if (ny > 0) { nx = -nx; ny = -ny; }
  const k = Math.max(10, Math.min(70, len * 0.18));
  const c = [(p0[0] + p1[0]) / 2 + nx * k, (p0[1] + p1[1]) / 2 + ny * k];
  const arc = `M${p0[0].toFixed(1)},${p0[1].toFixed(1)} Q${c[0].toFixed(1)},${c[1].toFixed(1)} ${p1[0].toFixed(1)},${p1[1].toFixed(1)}`;

  const totalMi = route.distanceMi || st[st.length - 1].mi || 1;
  const inter = st.filter(s => s.mi > totalMi * 0.012 && s.mi < totalMi * 0.985).map(s => {
    const t = s.mi / totalMi; const pt = bez(t, p0, c, p1);
    return { x: pt[0], y: pt[1], s };
  });
  const ends = [{ x: p0[0], y: p0[1], name: short(route.origin) }, { x: p1[0], y: p1[1], name: short(route.destination) }];

  // fit a viewBox to the route, matched to the display aspect ratio
  const pts = [p0, p1, c, ...inter.map(n => [n.x, n.y])];
  let minX = Math.min(...pts.map(p => p[0])), maxX = Math.max(...pts.map(p => p[0]));
  let minY = Math.min(...pts.map(p => p[1])), maxY = Math.max(...pts.map(p => p[1]));
  let bw = maxX - minX, bh = maxY - minY;
  const padX = Math.max(34, bw * 0.42), padY = Math.max(34, bh * 0.5);
  minX -= padX; maxX += padX; minY -= padY; maxY += padY; bw = maxX - minX; bh = maxY - minY;
  if (bw / bh < TARGET) { const want = bh * TARGET, add = (want - bw) / 2; minX -= add; maxX += add; bw = want; }
  else { const want = bw / TARGET, add = (want - bh) / 2; minY -= add; maxY += add; bh = want; }
  const sc = bw / DW;                       // user units per displayed px
  const px = v => v * sc;                   // size helper
  const compass = [maxX - px(30), minY + px(30)];

  const grat = [];
  for (let l = -180; l <= 180; l += 10) grat.push({ x1: X(l), y1: 0, x2: X(l), y2: PH, k: "v" + l });
  for (let l = -80; l <= 80; l += 10) grat.push({ x1: 0, y1: Y(l), x2: PW, y2: Y(l), k: "h" + l });

  return (
    <div className="mapwrap">
      <div className="maplabel">{short(route.origin)} → {short(route.destination)} · geographic route</div>
      <svg viewBox={`${minX.toFixed(1)} ${minY.toFixed(1)} ${bw.toFixed(1)} ${bh.toFixed(1)}`} style={{ width: "100%", display: "block" }}>
        <defs>
          <linearGradient id="rmocean" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--surface-2)" /><stop offset="1" stopColor="var(--surface-3)" /></linearGradient>
        </defs>
        <rect x={minX} y={minY} width={bw} height={bh} fill="url(#rmocean)" />
        <g stroke="var(--line)" strokeWidth={px(0.7)} opacity="0.4">
          {grat.map(g => <line key={g.k} x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} />)}
        </g>
        <g fill="var(--surface)" stroke="var(--line)" strokeWidth={px(1)}>
          {(window.CONTINENTS || []).map((poly, i) => <path key={i} d={poly.map(([lng, lat], j) => (j ? "L" : "M") + X(lng).toFixed(1) + "," + Y(lat).toFixed(1)).join(" ") + " Z"} />)}
        </g>
        {/* route line */}
        <path d={arc} fill="none" stroke="rgba(0,0,0,.16)" strokeWidth={px(5.5)} strokeLinecap="round" transform={`translate(0,${px(2)})`} />
        <path d={arc} fill="none" stroke={accent} strokeWidth={px(3.5)} strokeLinecap="round" />
        {/* intermediate stations */}
        {inter.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={px(4)} fill="var(--surface)" stroke={accent} strokeWidth={px(2.6)} />
            <text x={p.x} y={p.y + (i % 2 ? px(16) : -px(9))} textAnchor="middle" fontSize={px(10.5)} fontWeight="600"
              fill="var(--ink-soft)" stroke="var(--surface)" strokeWidth={px(3)} style={{ paintOrder: "stroke" }}>{short(p.s.name)}</text>
          </g>
        ))}
        {/* origin & destination */}
        {ends.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={px(6.5)} fill={accent} stroke="var(--surface)" strokeWidth={px(2.4)} />
            <text x={p.x} y={p.y - px(12)} textAnchor="middle" fontSize={px(13.5)} fontWeight="800"
              fill="var(--ink)" stroke="var(--surface)" strokeWidth={px(3.4)} style={{ paintOrder: "stroke" }}>{p.name}</text>
          </g>
        ))}
        {/* compass */}
        <g transform={`translate(${compass[0]},${compass[1]})`}>
          <circle r={px(15)} fill="var(--surface)" stroke="var(--line)" strokeWidth={px(1.2)} />
          <path d={`M0,${-px(10)} L${px(3)},${px(1)} L0,${-px(1)} L${-px(3)},${px(1)} Z`} fill="var(--rust)" />
          <path d={`M0,${px(10)} L${px(3)},${-px(1)} L0,${px(1)} L${-px(3)},${-px(1)} Z`} fill="var(--ink-faint)" />
          <text y={-px(17)} textAnchor="middle" fontSize={px(8)} fontWeight="800" fill="var(--ink-soft)">N</text>
        </g>
      </svg>
      <div className="maplegend">
        <span className="lg"><span style={{ width: 16, height: 3, background: accent, borderRadius: 9, display: "inline-block" }}></span>Rail line</span>
        <span className="lg">● stations</span>
      </div>
    </div>
  );
}

/* ---- the detail overlay ---- */
function Detail({ route, onClose, accent, roundTrip = false, departWhen, returnWhen }) {
  const [shot, setShot] = React.useState(0);
  React.useEffect(() => {
    const onKey = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const mkItem = (classIdx) => ({
    routeId: route.id, name: route.name, region: route.region, operator: route.operator,
    origin: route.origin, destination: route.destination,
    classIdx, className: route.classes[classIdx].name, roundTrip, adults: 1, kids: 0,
    date: departWhen && departWhen.date, time: departWhen && departWhen.time,
    returnDate: returnWhen && returnWhen.date, returnTime: returnWhen && returnWhen.time,
  });
  const addToCart = (classIdx) => window.Store.addToCart(mkItem(classIdx));
  const buyNow = (classIdx) => window.Store.openCheckout([mkItem(classIdx)], { editable: true });

  const scene = route.scenes[shot] || route.scenes[0];
  const opColor = window.routeColor(route);

  return (
    <div className="scrim" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="detail" data-screen-label="Route detail">
        <button className="detail-close" onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>

        <div className="hero">
          <Scene type={scene.type} />
          <div className="hero-grad"></div>
          <div className="thumbs">
            {route.scenes.map((s, i) => (
              <button key={i} className={i === shot ? "on" : ""} onClick={() => setShot(i)} aria-label={s.caption}><Scene type={s.type} vignette={false} /></button>
            ))}
          </div>
          <div className="hero-info">
            <span className="opbadge" style={{ background: opColor.bg, color: opColor.fg }}><span className="opdot" style={{ background: opColor.fg }}></span>{route.operator}</span>
            <h1>{route.name}</h1>
            <div className="htag">{route.tag} · {route.frequency}</div>
          </div>
        </div>
        <div className="caption">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="12" cy="12" r="3.2" /><path d="M8 5l1.5-2h5L16 5" /></svg>
          {scene.caption} <span style={{ color: "var(--ink-faint)", fontWeight: 500 }}>· representative scenery placeholder</span>
        </div>

        <div className="dsection">
          <p className="blurb">{route.blurb}</p>
          <div className="statgrid" style={{ marginTop: 22 }}>
            <div className="statcard"><div className="k">Duration</div><div className="v">{fmtDur(route.durationMin)}</div></div>
            <div className="statcard"><div className="k">Distance</div><div className="v">{commas(route.distanceMi)}<span className="u">mi</span></div></div>
            <div className="statcard accent"><div className="k">Top speed</div><div className="v">{route.topSpeedMph}<span className="u">mph</span></div><div className="speedbar"><i style={{ width: (route.topSpeedMph / 90 * 100) + "%" }}></i></div></div>
            <div className="statcard"><div className="k">Avg speed</div><div className="v">{route.avgSpeedMph}<span className="u">mph</span></div></div>
          </div>
        </div>

        <div className="dsection">
          <h3>Rail line<span className="ln"></span></h3>
          <RouteMap route={route} accent={accent} />
        </div>

        <div className="dsection">
          <h3>Elevation profile<span className="ln"></span></h3>
          <ElevationChart route={route} accent={accent} />
        </div>

        <div className="dsection">
          <h3>Amenities<span className="ln"></span></h3>
          <div className="amgrid">
            {route.amenities.map(id => (
              <div className="amitem" key={id}><span className="ai"><AmIcon id={id} /></span><span className="at">{window.RAIL.AM[id]}</span></div>
            ))}
          </div>
        </div>

        <div className="dsection">
          <h3>Fares &amp; discounts<span className="ln"></span></h3>
          <div className="fares">
            {route.classes.map((c, i) => (
              <div className="fare" key={i}>
                <div><div className="fname">{c.name}</div><div className="fnote">{c.note}</div></div>
                <div className="fprice"><span className="from">from</span>${commas(c.price)}</div>
                <button className="fselect" onClick={() => addToCart(i)}>Add to cart</button>
              </div>
            ))}
          </div>
          <div className="disc">
            {route.discounts.map((d, i) => (
              <div className="discitem" key={i}>
                <span className="badge">{d.pct ? "−" + d.pct + "%" : "DEAL"}</span>
                <div><div className="dn">{d.name}</div><div className="dd">{d.detail}</div></div>
              </div>
            ))}
          </div>
        </div>

        <div className="dsection" style={{ borderBottom: "none" }}>
          <h3>Stations &amp; schedule<span className="ln"></span></h3>
          <div className="timetable">
            {route.stations.map((s, i) => {
              const first = i === 0, last = i === route.stations.length - 1;
              return (
                <div className={"ttrow" + (first ? " tt-row-first" : "") + (last ? " tt-row-last" : "")} key={i}>
                  <div className="tt-time mono">{s.time}</div>
                  <div className="tt-rail">{!first && <div className="tt-stem"></div>}<div className="tt-dot"></div>{!last && <div className="tt-stem"></div>}</div>
                  <div className="tt-name">{s.name}</div>
                  <div className="tt-elev">{commas(s.elevFt)} ft</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bookbar">
          <div className="bb-price">{roundTrip ? "Round trip from" : "Fares from"}<strong>${commas(roundTrip ? Math.round(route.priceFrom * 2 * 0.9) : route.priceFrom)}</strong></div>
          <button className="bb-add" onClick={() => addToCart(0)}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h3l2.5 13h11l2.5-9H6" /></svg>Add to cart</button>
          <button className="bb-cta" onClick={() => buyNow(0)}>{roundTrip ? "Book round trip" : "Book now"}</button>
        </div>
      </div>
    </div>
  );
}

window.Detail = Detail;
