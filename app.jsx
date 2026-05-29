/* app.jsx — Choo Choo Chooser main app */
const { useState, useMemo, useEffect } = React;

/* ---- chrome icons ---- */
function Ico({ d, size = 18, sw = 1.8, fill = "none" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
}
const I = {
  search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
  grid: <><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="8" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" /></>,
  list: <><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></>,
  train: <><rect x="5" y="3" width="14" height="13" rx="3" /><path d="M5 11h14M9 3v8" /><path d="M7 20l2-3M17 20l-2-3" /><circle cx="9" cy="13.5" r="0" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  marker: <><path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></>,
  pin: <><path d="M12 2v6M12 22v-6M2 12h6M22 12h-6" /></>,
  dice: <><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="8.5" cy="8.5" r="1.4" fill="currentColor" stroke="none" /><circle cx="15.5" cy="15.5" r="1.4" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="15.5" cy="8.5" r="1.4" fill="currentColor" stroke="none" /><circle cx="8.5" cy="15.5" r="1.4" fill="currentColor" stroke="none" /></>,
  swap: <><path d="M4 8h15l-4-4M20 16H5l4 4" /></>,
};

/* ---- mini elevation sparkline ---- */
function Spark({ data, color }) {
  const W = 108, H = 38;
  const mi = data.map(d => d.mi), ft = data.map(d => d.ft);
  const minMi = Math.min(...mi), maxMi = Math.max(...mi);
  const lo = Math.min(...ft), hi = Math.max(...ft);
  const X = m => ((m - minMi) / (maxMi - minMi || 1)) * W;
  const Y = f => H - 4 - ((f - lo) / (hi - lo || 1)) * (H - 8);
  const pts = data.map(d => [X(d.mi), Y(d.ft)]);
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const area = line + ` L${W},${H} L0,${H} Z`;
  const gid = "sp" + Math.round(lo) + maxMi;
  return (
    <svg className="spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity="0.3" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function fmtDur2(min) { if (min < 60) return min + "m"; const h = Math.floor(min / 60), m = min % 60; return h + "h" + (m ? " " + m : ""); }
function num(n) { return n.toLocaleString("en-US"); }

/* ---- route card ---- */
function Card({ route, accent, onOpen, roundTrip }) {
  const op = window.routeColor(route);
  const price = roundTrip ? Math.round(route.priceFrom * 2 * 0.9) : route.priceFrom;
  return (
    <div className="card" onClick={onOpen} data-screen-label={"Card: " + route.name}>
      <div className="card-photo">
        <Scene type={route.scenes[0].type} />
        <span className="ribbon">{route.category}</span>
        <span className="scenic"><Ico d={<path d="M3 20l6-12 4 7 3-5 5 10z" />} size={12} sw={2.2} />{route.scenicScore} scenic</span>
      </div>
      <div className="card-body">
        <div className="card-top">
          <div className="card-title">
            <h2>{route.name}</h2>
            <div className="tag">{route.tag}</div>
          </div>
          <span className="opbadge" style={{ background: op.bg, color: op.fg }}><span className="opdot" style={{ background: op.fg }}></span>{route.operator}</span>
        </div>
        <div className="routeline">
          <span className="ep">{route.origin}</span>
          <span className="dots"><Ico d={I.arrow} size={16} sw={2.2} /></span>
          <span className="ep">{route.destination}</span>
        </div>
        <div className="via">via {route.via}</div>
        <div className="metrics">
          <div className="metric"><div className="k">Depart</div><div className="v">{route.depart}</div></div>
          <div className="metric"><div className="k">Duration</div><div className="v">{fmtDur2(route.durationMin)}</div></div>
          <div className="metric"><div className="k">Distance</div><div className="v">{num(route.distanceMi)}<span className="u">mi</span></div></div>
          <div className="metric"><div className="k">Top speed</div><div className="v">{route.topSpeedMph}<span className="u">mph</span></div></div>
          <div className="metric"><div className="k">Climb</div><div className="v">+{num(route.elevGainFt)}<span className="u">ft</span></div></div>
          <div className="metric" style={{ marginLeft: "auto", textAlign: "right" }}>
            <div className="k">Elevation</div>
            <Spark data={route.elevation} color={accent} />
          </div>
          <div className="metric price"><div className="k">{roundTrip ? "Round trip" : "From"}</div><div className="v">${num(price)}</div></div>
        </div>
      </div>
    </div>
  );
}

/* ---- compact table ---- */
function Table({ routes, accent, onOpen, roundTrip }) {
  return (
    <table className="tbl">
      <thead><tr>
        <th>Route</th><th>To</th><th>Depart</th><th>Duration</th><th>Dist</th><th>Top mph</th><th>Climb</th><th>Scenic</th><th style={{ textAlign: "right" }}>From</th>
      </tr></thead>
      <tbody>
        {routes.map(r => {
          const op = window.routeColor(r);
          return (
            <tr key={r.id} onClick={() => onOpen(r)} data-screen-label={"Row: " + r.name}>
              <td><div className="t-name">{r.name}</div><div className="t-sub" style={{ color: op.fg, fontWeight: 700 }}>{r.operator} · {r.tag}</div></td>
              <td>{r.destination}</td>
              <td className="num">{r.depart}</td>
              <td className="num">{fmtDur2(r.durationMin)}</td>
              <td className="num">{num(r.distanceMi)}</td>
              <td className="num">{r.topSpeedMph}</td>
              <td className="num">+{num(r.elevGainFt)}</td>
              <td className="num">{r.scenicScore}</td>
              <td className="t-price" style={{ textAlign: "right" }}>${num(roundTrip ? Math.round(r.priceFrom * 2 * 0.9) : r.priceFrom)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ---- compact mini row (map view) ---- */
function MiniRow({ route, hot, onOpen, onHover }) {
  const op = window.routeColor(route);
  return (
    <div className={"minirow" + (hot ? " hot" : "")} onClick={onOpen}
      onMouseEnter={() => onHover(route.id)} onMouseLeave={() => onHover(null)}>
      <span className="mdot" style={{ background: op.fg }}></span>
      <div className="mmain">
        <div className="mname">{route.name}</div>
        <div className="msub">{route.operator} · to {route.destination}</div>
        <div className="mmeta">{fmtDur2(route.durationMin)} · {num(route.distanceMi)} mi · {route.topSpeedMph} mph</div>
      </div>
      <div className="mprice">${num(route.priceFrom)}</div>
    </div>
  );
}

function fmtLong(min) {
  if (min < 60) return min + "m";
  if (min < 1440) { const h = Math.floor(min / 60), m = min % 60; return h + "h" + (m ? " " + m + "m" : ""); }
  const d = Math.floor(min / 1440), h = Math.round((min % 1440) / 60); return d + "d" + (h ? " " + h + "h" : "");
}

/* ---- multi-stop journey planner ---- */
function Planner({ stops, all, legSel, setLegSel, onOpen, onBook }) {
  const short = s => (s || "").split(",")[0];
  const legs = [];
  for (let i = 0; i < stops.length - 1; i++) if (stops[i] && stops[i + 1]) legs.push({ i, from: stops[i], to: stops[i + 1] });
  function matchLeg(r, from, to) {
    const stn = q => r.origin.toLowerCase().includes(q) || r.stations.some(s => s.name.toLowerCase().includes(q));
    const dst = q => r.destination.toLowerCase().includes(q) || r.stations.some(s => s.name.toLowerCase().includes(q));
    const f = from.toLowerCase(), t = to.toLowerCase();
    return (stn(f) && dst(t)) || (stn(t) && dst(f));
  }
  const legData = legs.map(l => ({ ...l, cands: all.filter(r => matchLeg(r, l.from, l.to)) }));
  const selFor = l => { const id = legSel[l.i]; return (id && l.cands.find(c => c.id === id)) || l.cands[0] || null; };
  const selected = legData.map(selFor);
  const valid = selected.filter(Boolean);
  const allChosen = legData.length > 0 && selected.every(Boolean);
  const totalDist = valid.reduce((s, r) => s + r.distanceMi, 0);
  const totalMin = valid.reduce((s, r) => s + r.durationMin, 0);
  const totalPrice = valid.reduce((s, r) => s + r.priceFrom, 0);

  if (legData.length === 0)
    return <div className="empty"><span className="serif">Plan a multi-stop journey.</span>Enter at least two stops in the bar above — add more with “+ Stop”.</div>;

  return (
    <div className="planner">
      <div className="journey-summary">
        <div className="js-stat"><div className="k">Legs chosen</div><div className="v">{valid.length}/{legData.length}</div></div>
        <div className="js-stat"><div className="k">Distance</div><div className="v">{num(totalDist)} mi</div></div>
        <div className="js-stat"><div className="k">Travel time</div><div className="v">{fmtLong(totalMin)}</div></div>
        <div className="js-stat price"><div className="k">From</div><div className="v">${num(totalPrice)}</div></div>
        <button className="js-book" disabled={!allChosen} onClick={() => onBook(selected.map(r => ({ route: r, classIdx: 0 })))}>Book journey →</button>
      </div>
      {legData.map((l, idx) => {
        const sel = selFor(l);
        return (
          <div className="leg" key={l.i}>
            <div className="leg-head">
              <span className="leg-num">{idx + 1}</span>
              <span className="leg-route">{short(l.from)}<span className="arr">→</span>{short(l.to)}</span>
              <span className="leg-count">{l.cands.length} option{l.cands.length === 1 ? "" : "s"}</span>
            </div>
            {l.cands.length === 0
              ? <div className="leg-empty">No direct train in our catalog for this leg yet — try a hub like Denver, Chicago, Paris, or Tokyo.</div>
              : l.cands.map(r => {
                const c = window.routeColor(r);
                return (
                  <div className={"legcard" + (sel && sel.id === r.id ? " sel" : "")} key={r.id} onClick={() => setLegSel(prev => ({ ...prev, [l.i]: r.id }))}>
                    <span className="lc-radio"></span>
                    <span className="lc-dot" style={{ background: c.fg }}></span>
                    <div style={{ minWidth: 0 }}><div className="lc-name">{r.name}</div><div className="lc-sub">{r.operator} · {short(r.origin)}→{short(r.destination)}</div></div>
                    <span className="lc-meta">{fmtDur2(r.durationMin)} · {num(r.distanceMi)} mi</span>
                    <span className="lc-price">${num(r.priceFrom)}</span>
                    <button className="lc-open" onClick={e => { e.stopPropagation(); onOpen(r); }}>Details</button>
                  </div>
                );
              })}
          </div>
        );
      })}
    </div>
  );
}

/* ---- check row ---- */
function Check({ on, onClick, label, count, dot }) {
  return (
    <div className={"checkrow" + (on ? " on" : "")} onClick={onClick}>
      <span className="cbox"><Ico d={<path d="M5 12l4.5 4.5L19 7" />} size={13} sw={2.6} /></span>
      <span className="lbl">{dot && <span className="opchip"><span className="opdot" style={{ background: dot }}></span>{label}</span>}{!dot && label}</span>
      {count != null && <span className="cnt">{count}</span>}
    </div>
  );
}

const CATEGORIES = ["High-speed", "Long-distance", "Scenic", "Sleeper", "Luxury", "Seasonal"];
const FILTER_AMS = ["panorama", "dome", "dining", "sleeper", "meals", "wifi", "wheelchair", "oxygen"];
const SORTS = [
  { id: "scenic", label: "Most scenic" },
  { id: "price", label: "Price (low→high)" },
  { id: "duration", label: "Shortest trip" },
  { id: "distance", label: "Longest journey" },
  { id: "speed", label: "Top speed" },
  { id: "climb", label: "Biggest climb" },
];
const ACCENTS = { Pine: "#1E4A37", "Red Rocks": "#BB5430", Alpine: "#2E6E8E", Gold: "#C99227" };
const ACCENT_VALUES = Object.values(ACCENTS);

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#1E4A37",
  "dark": false,
  "layout": "cards"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const store = useStore();
  const [fromQ, setFromQ] = useState("");
  const [toQ, setToQ] = useState("");
  const [regions, setRegions] = useState(new Set());
  const [operators, setOperators] = useState(new Set());
  const [cats, setCats] = useState(new Set());
  const [ams, setAms] = useState(new Set());
  const [maxPrice, setMaxPrice] = useState(6500);
  const [scenicOnly, setScenicOnly] = useState(false);
  const [sort, setSort] = useState("scenic");
  const [open, setOpen] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [tripMode, setTripMode] = useState("oneway"); // oneway | round | multi
  const [stops, setStops] = useState(["", ""]);
  const [legSel, setLegSel] = useState({});
  const [departWhen, setDepartWhen] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 7); return { date: d.toISOString().slice(0, 10), time: "any" }; });
  const [returnWhen, setReturnWhen] = useState(null);

  const rt = tripMode === "round";

  const accent = t.accent || ACCENTS.Pine;
  const layout = t.layout;

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accent);
    document.body.setAttribute("data-theme", t.dark ? "dark" : "light");
  }, [accent, t.dark]);

  // apply LLM-built default filters once when a logged-in user's prefs arrive
  const acctPrefs = store.state.account && store.state.account.prefs;
  const acctApplied = store.state.account && store.state.account.prefsApplied;
  useEffect(() => {
    const a = store.state.account;
    if (a && a.prefs && !a.prefsApplied) {
      const p = a.prefs;
      if (p.regions && p.regions.length) setRegions(new Set(p.regions));
      if (p.providers && p.providers.length) setOperators(new Set(p.providers));
      if (p.categories && p.categories.length) setCats(new Set(p.categories));
      if (p.maxPrice) setMaxPrice(p.maxPrice);
      if (p.scenicOnly) setScenicOnly(true);
      store.markPrefsApplied();
    }
  }, [acctPrefs, acctApplied]);

  const all = window.RAIL.routes;
  const regionCounts = useMemo(() => {
    const m = {}; all.forEach(r => m[r.region] = (m[r.region] || 0) + 1); return m;
  }, [all]);
  const operatorList = useMemo(() => {
    const m = {};
    all.forEach(r => { (m[r.operator] = m[r.operator] || { name: r.operator, count: 0, region: r.region }).count++; });
    return Object.values(m).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [all]);
  const PLACES = useMemo(() => {
    const s = new Set();
    all.forEach(r => { s.add(r.origin); s.add(r.destination); });
    return [...s].sort();
  }, [all]);

  const toggle = (set, setter) => (v) => { const n = new Set(set); n.has(v) ? n.delete(v) : n.add(v); setter(n); };

  function placeHit(r, query, isFrom) {
    if (!query) return true;
    const q = query.toLowerCase();
    const ep = (isFrom ? r.origin : r.destination).toLowerCase();
    if (ep.includes(q)) return true;
    if ((r.country || "").toLowerCase().includes(q)) return true;
    if (r.stations.some(s => s.name.toLowerCase().includes(q))) return true;
    return false;
  }

  const filtered = useMemo(() => {
    let rs = all.filter(r => {
      if (!placeHit(r, fromQ, true)) return false;
      if (!placeHit(r, toQ, false)) return false;
      if (regions.size && !regions.has(r.region)) return false;
      if (operators.size && !operators.has(r.operator)) return false;
      if (cats.size && !cats.has(r.category)) return false;
      if (ams.size && ![...ams].every(a => r.amenities.includes(a))) return false;
      if (r.priceFrom > maxPrice) return false;
      if (scenicOnly && r.scenicScore < 70) return false;
      return true;
    });
    const cmp = {
      scenic: (a, b) => b.scenicScore - a.scenicScore,
      price: (a, b) => a.priceFrom - b.priceFrom,
      duration: (a, b) => a.durationMin - b.durationMin,
      distance: (a, b) => b.distanceMi - a.distanceMi,
      speed: (a, b) => b.topSpeedMph - a.topSpeedMph,
      climb: (a, b) => b.elevGainFt - a.elevGainFt,
    }[sort];
    return [...rs].sort(cmp);
  }, [all, fromQ, toQ, regions, operators, cats, ams, maxPrice, scenicOnly, sort]);

  const activeFilters = regions.size + operators.size + cats.size + ams.size + (scenicOnly ? 1 : 0) + (maxPrice < 6500 ? 1 : 0) + (fromQ ? 1 : 0) + (toQ ? 1 : 0);

  function clearAll() { setFromQ(""); setToQ(""); setRegions(new Set()); setOperators(new Set()); setCats(new Set()); setAms(new Set()); setMaxPrice(6500); setScenicOnly(false); }

  function chooseMode(m) { if (m === "multi") setStops(prev => prev.some(x => x) ? prev : [fromQ || "", toQ || ""]); setTripMode(m); }
  function setStop(i, v) { setStops(prev => { const n = [...prev]; n[i] = v; return n; }); }
  function addStop() { setStops(prev => prev.length < 5 ? [...prev.slice(0, -1), "", prev[prev.length - 1]] : prev); }
  function removeStop(i) { setStops(prev => prev.filter((_, j) => j !== i)); }

  function feelLucky() {
    if (rolling) return;
    const pool = filtered.length ? filtered : all;
    setRolling(true);
    setTimeout(() => { setOpen(pool[Math.floor(Math.random() * pool.length)]); setRolling(false); }, 560);
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="mark"><Ico d={I.train} size={24} sw={1.7} /></span>
          <div><h1>Choo Choo Chooser</h1><div className="sub">Every passenger train on Earth</div></div>
        </div>
        <div className="tripseg">
          {[["oneway", "One-way"], ["round", "Round trip"], ["multi", "Multi-stop"]].map(([m, lbl]) => (
            <button key={m} className={tripMode === m ? "on" : ""} onClick={() => chooseMode(m)}>{lbl}</button>
          ))}
        </div>
        {tripMode === "multi" ? (
          <div className="stopsbar">
            {stops.map((s, i) => {
              const isFirst = i === 0, isLast = i === stops.length - 1;
              return (
                <div className="stopfield" key={i}>
                  <span className="sf-ic"><Ico d={isFirst ? I.marker : isLast ? I.arrow : I.pin} size={16} /></span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <label>{isFirst ? "From" : isLast ? "To" : "Stop " + i}</label>
                    <input list="places" value={s} placeholder="Add a stop" onChange={e => setStop(i, e.target.value)} />
                  </div>
                  {stops.length > 2 && !isFirst && !isLast && <button className="rmstop" onClick={() => removeStop(i)} aria-label="Remove stop">×</button>}
                </div>
              );
            })}
            {stops.length < 5 && <button className="addstop" onClick={addStop}>+ Stop</button>}
          </div>
        ) : (
          <div className="searchwrap">
            <div className="searchfield">
              <span style={{ color: "#8FAE9C" }}><Ico d={I.marker} size={16} /></span>
              <div style={{ minWidth: 0, flex: 1 }}><label>From</label><input list="places" value={fromQ} onChange={e => setFromQ(e.target.value)} placeholder="Anywhere" /></div>
            </div>
            <div className="searchfield">
              <span style={{ color: "#8FAE9C" }}><Ico d={rt ? I.swap : I.arrow} size={16} /></span>
              <div style={{ minWidth: 0, flex: 1 }}><label>{rt ? "To & back" : "To"}</label><input list="places" value={toQ} onChange={e => setToQ(e.target.value)} placeholder="Anywhere" /></div>
            </div>
            <DateTimeField dark compact label={rt ? "Trip dates" : "When"} value={rt ? { start: departWhen, stop: returnWhen } : departWhen} onChange={v => { if (rt) { setDepartWhen(v.start || departWhen); setReturnWhen(v.stop || null); } else setDepartWhen(v); }} range={rt} align="right" />
          </div>
        )}
        {tripMode === "multi" && <DateTimeField dark compact label="Depart" value={departWhen} onChange={setDepartWhen} align="right" />}
        <datalist id="places">{PLACES.map(p => <option key={p} value={p} />)}</datalist>
        <div className="tb-actions">
          <a className="iconbtn" href="Map Viewer.html" style={{ textDecoration: "none" }} title="Open the full map viewer">
            <Ico d={I.marker} size={16} />Map
          </a>
          <CartButton />
          <AccountMenu />
          <button className="iconbtn" onClick={() => setTweak("dark", !t.dark)} title={t.dark ? "Light mode" : "Dark mode"}>
            <Ico d={t.dark ? <><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" /></> : <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />} size={16} />
          </button>
        </div>
      </header>

      <ForYouBar onOpen={setOpen} />

      <div className="body">
        <aside className="filters">
          <div className="fgroup">
            <h3>Region</h3>
            {window.RAIL.regions.map(rg => (
              <Check key={rg} on={regions.has(rg)} onClick={toggle(regions, setRegions).bind(null, rg)} label={rg} dot={window.RAIL.regionColors[rg].fg} count={regionCounts[rg]} />
            ))}
          </div>
          <div className="fgroup">
            <h3>Provider</h3>
            <div style={{ maxHeight: 210, overflowY: "auto", margin: "0 -4px", padding: "0 4px" }}>
              {operatorList.map(o => (
                <Check key={o.name} on={operators.has(o.name)} onClick={toggle(operators, setOperators).bind(null, o.name)} label={o.name} dot={window.RAIL.regionColors[o.region].fg} count={o.count} />
              ))}
            </div>
          </div>
          <div className="fgroup">
            <h3>Trip type</h3>
            <div className="pillrow">
              {CATEGORIES.map(c => (
                <button key={c} className={"pill" + (cats.has(c) ? " on" : "")} onClick={() => toggle(cats, setCats)(c)}>{c}</button>
              ))}
            </div>
          </div>
          <div className="fgroup">
            <h3>Max price (from)</h3>
            <div className="slider-wrap">
              <input type="range" min="25" max="6500" step="5" value={maxPrice} onChange={e => setMaxPrice(+e.target.value)} />
              <div className="slider-val"><span>$25</span><span style={{ color: "var(--rust)", fontWeight: 700 }}>{maxPrice >= 6500 ? "Any" : "≤ $" + num(maxPrice)}</span><span>$6,500</span></div>
            </div>
          </div>
          <div className="fgroup">
            <h3>Amenities</h3>
            {FILTER_AMS.map(a => (
              <Check key={a} on={ams.has(a)} onClick={toggle(ams, setAms).bind(null, a)} label={window.RAIL.AM[a]} />
            ))}
          </div>
          <div className="fgroup">
            <h3>Scenery</h3>
            <Check on={scenicOnly} onClick={() => setScenicOnly(s => !s)} label="Scenic routes only (70+)" />
          </div>
          {activeFilters > 0 && <button className="clearbtn" onClick={clearAll}>Clear all filters ({activeFilters})</button>}
        </aside>

        <main className={"results" + (layout === "map" && tripMode !== "multi" ? " map-mode" : "")}>
          <div className="results-head">
            {tripMode === "multi"
              ? <div className="plan-label">Journey planner <em>· build your route leg by leg</em></div>
              : <div className="count"><span className="serif">{filtered.length}</span> <em>route{filtered.length === 1 ? "" : "s"} worldwide</em></div>}
            <div className="rh-spacer"></div>
            {tripMode !== "multi" && <>
            <button className={"luckybtn" + (rolling ? " rolling" : "")} onClick={feelLucky} title="Open a random route from your results">
              <span className="dice"><Ico d={I.dice} size={17} sw={1.8} /></span>
              {rolling ? "Rolling…" : "Feeling lucky?"}
            </button>
            <div className="sortsel">
              <label>Sort</label>
              <select value={sort} onChange={e => setSort(e.target.value)}>
                {SORTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div className="segbtns">
              <button className={layout === "cards" ? "on" : ""} onClick={() => setTweak("layout", "cards")} title="Cards"><Ico d={I.grid} size={16} /></button>
              <button className={layout === "table" ? "on" : ""} onClick={() => setTweak("layout", "table")} title="Compact"><Ico d={I.list} size={16} /></button>
              <button className={layout === "map" ? "on" : ""} onClick={() => setTweak("layout", "map")} title="Map"><Ico d={I.marker} size={16} /></button>
            </div>
            </>}
          </div>

          {tripMode === "multi" ? (
            <Planner stops={stops} all={all} legSel={legSel} setLegSel={setLegSel} onOpen={setOpen} onBook={(legs) => window.Store.openCheckout(legs.map(l => ({ routeId: l.route.id, name: l.route.name, region: l.route.region, operator: l.route.operator, origin: l.route.origin, destination: l.route.destination, classIdx: l.classIdx, className: l.route.classes[l.classIdx].name, roundTrip: false, adults: 1, kids: 0, date: departWhen.date, time: departWhen.time })), { fromCart: false })} />
          ) : filtered.length === 0 ? (
            <div className="empty"><span className="serif">No trains match.</span>Try widening your price range or clearing filters.</div>
          ) : layout === "map" ? (
            <div className="splitwrap">
              <div className="listcol">
                <div className="lc-hint">{filtered.length} route{filtered.length === 1 ? "" : "s"} · hover to trace on map</div>
                {filtered.map(r => (
                  <MiniRow key={r.id} route={r} hot={hoveredId === r.id} onOpen={() => setOpen(r)} onHover={setHoveredId} />
                ))}
              </div>
              <WorldMap routes={filtered} hoveredId={hoveredId} setHoveredId={setHoveredId} onOpen={setOpen} selectedId={open && open.id} />
            </div>
          ) : layout === "cards" ? (
            <div className="cards">
              {filtered.map(r => <Card key={r.id} route={r} accent={accent} roundTrip={rt} onOpen={() => setOpen(r)} />)}
            </div>
          ) : (
            <div style={{ padding: "16px 30px 80px" }}>
              <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
                <Table routes={filtered} accent={accent} roundTrip={rt} onOpen={setOpen} />
              </div>
            </div>
          )}
        </main>
      </div>

      {open && <Detail route={open} accent={accent} roundTrip={rt} departWhen={departWhen} returnWhen={returnWhen} onClose={() => setOpen(null)} />}
      <CartDrawer />
      <AuthModal />
      <CheckoutHost />
      <Toast />

      <TweaksPanel>
        <TweakSection label="Theme" />
        <TweakColor label="Accent" value={t.accent} options={ACCENT_VALUES} onChange={v => setTweak("accent", v)} />
        <TweakToggle label="Dark mode" value={t.dark} onChange={v => setTweak("dark", v)} />
        <TweakSection label="Results" />
        <TweakRadio label="Layout" value={t.layout} options={["cards", "table", "map"]} onChange={v => setTweak("layout", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
