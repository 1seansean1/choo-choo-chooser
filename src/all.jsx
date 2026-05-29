// src/all.jsx — concatenated JSX components, compiled by Vite + plugin-react.
// Source files preserved as-is from the prototype; only the top-level ReactDOM call
// is stripped (moved to main.jsx).

import React from "react";
import ReactDOM from "react-dom/client";

// RouteHero — replaces the SVG <Scene/> placeholder with a real photo when
// window.ROUTE_IMAGES has an entry for this route.id. Falls back to <Scene/>
// (defined in scenes.jsx) for any route without a fetched image.
function RouteHero({ route, sceneType, className = "" }) {
  const img = (typeof window !== "undefined" && window.ROUTE_IMAGES) ? window.ROUTE_IMAGES[route.id] : null;
  if (img && img.thumbnail_url) {
    return (
      <img
        className={"route-hero-img " + className}
        src={img.original_url || img.thumbnail_url}
        alt={img.title || route.name}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
      />
    );
  }
  return <Scene type={sceneType || (route.scenes && route.scenes[0] && route.scenes[0].type)} />;
}
function hasRouteImage(route) {
  return !!(typeof window !== "undefined" && window.ROUTE_IMAGES && window.ROUTE_IMAGES[route.id] && window.ROUTE_IMAGES[route.id].thumbnail_url);
}

// Persistent affiliate disclosure. Required by the FTC for any site that earns
// commission on outbound links; also required by Awin / CJ / Travelpayouts
// network terms.
function AffiliateDisclosureFooter() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <div style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 5,
        background: "var(--surface)", borderTop: "1px solid var(--line)",
        padding: "8px 18px", fontSize: 11.5, color: "var(--ink-faint)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        pointerEvents: "auto",
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
        Choo Choo Chooser is a search-and-compare tool. We don't sell tickets — we link to operators. We may earn a commission on bookings.
        <button onClick={() => setOpen(true)} style={{
          background: "none", border: "none", color: "var(--pine)",
          textDecoration: "underline", cursor: "pointer", fontSize: 11.5, padding: 0,
        }}>How it works</button>
      </div>
      {open && (
        <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }} style={{zIndex: 99}}>
          <div style={{
            maxWidth: 560, margin: "8vh auto 0", background: "var(--surface)",
            borderRadius: "var(--r-lg)", padding: "26px 28px", boxShadow: "var(--shadow-lg)",
            lineHeight: 1.55,
          }}>
            <h2 style={{fontFamily: "var(--serif)", fontSize: 26, margin: "0 0 12px"}}>How Choo Choo Chooser works</h2>
            <p>We're a search-and-compare site for passenger rail worldwide. We don't sell tickets — that would require us to be a licensed travel reseller for every operator (months of contracts, per-country sales-tax registration, IATA-grade accreditation). What we do instead:</p>
            <ul>
              <li><strong>Discover:</strong> filter, sort, and compare ~43 named train routes on six continents — scenic scores, elevation profiles, prices, amenities.</li>
              <li><strong>Plan:</strong> save legs to a trip; the planner suggests routes for multi-stop itineraries.</li>
              <li><strong>Book:</strong> the "Continue on [Operator]" button opens the operator's own site (Amtrak, Eurostar, Trenitalia, JR Central, …) in a new tab. You buy directly from them; you get a real ticket; they're the merchant of record.</li>
            </ul>
            <p>We may earn a small commission (~3-8%) on bookings made via our outbound links, through affiliate networks Awin, CJ, and Travelpayouts. Your price isn't affected. <a href="https://en.wikipedia.org/wiki/Affiliate_marketing" target="_blank" rel="noreferrer" style={{color: "var(--pine)"}}>Affiliate marketing</a> is how most travel comparison sites stay free.</p>
            <p style={{fontSize: 13, color: "var(--ink-soft)"}}>Prices in our cards are illustrative starting fares — the operator's real price at booking is canonical. Schedules and seat availability are static placeholders here; the operator's live system is canonical for those too.</p>
            <div style={{marginTop: 18, textAlign: "right"}}>
              <button onClick={() => setOpen(false)} style={{
                background: "var(--pine)", color: "#fff", border: "none",
                padding: "9px 18px", borderRadius: 8, fontWeight: 700, cursor: "pointer",
              }}>Got it</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================
// === tweaks-panel.jsx
// ============================================================

/* BEGIN USAGE */
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
// Exports (to window): useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider,
//   TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "palette": ["#D97757", "#29261b", "#f6f4ef"],
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        options={['#D97757', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakColor  label="Palette" value={t.palette}
//                        options={[['#D97757', '#29261b', '#f6f4ef'],
//                                  ['#475569', '#0f172a', '#f1f5f9']]}
//                        onChange={(v) => setTweak('palette', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// TweakRadio is the segmented control for 2–3 short options (auto-falls-back to
// TweakSelect past ~16/~10 chars per label); reach for TweakSelect directly when
// options are many or long. For color tweaks always curate 3-4 options rather than
// a free picker; an option can also be a whole 2–5 color palette (the stored value
// is the array). The Tweak* controls are a floor, not a ceiling — build custom
// controls inside the panel if a tweak calls for UI they don't cover.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom right;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;box-sizing:border-box;min-width:0;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null
      ? keyOrEdits : { [keyOrEdits]: val };
    setValues((prev) => ({ ...prev, ...edits }));
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', { detail: edits }));
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({ title = 'Tweaks', children }) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({ x: 16, y: 16 });
  const PAD = 16;

  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth, h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y)),
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);

  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);

  React.useEffect(() => {
    const onMsg = (e) => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);
      else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*');
  };

  const onDragStart = (e) => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = (ev) => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy),
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  if (!open) return null;
  return (
    <>
      <style>{__TWEAKS_STYLE}</style>
      <div ref={dragRef} className="twk-panel" data-omelette-chrome=""
           style={{ right: offsetRef.current.x, bottom: offsetRef.current.y }}>
        <div className="twk-hd" onMouseDown={onDragStart}>
          <b>{title}</b>
          <button className="twk-x" aria-label="Close tweaks"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={dismiss}>✕</button>
        </div>
        <div className="twk-body">
          {children}
        </div>
      </div>
    </>
  );
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({ label, children }) {
  return (
    <>
      <div className="twk-sect">{label}</div>
      {children}
    </>
  );
}

function TweakRow({ label, value, children, inline = false }) {
  return (
    <div className={inline ? 'twk-row twk-row-h' : 'twk-row'}>
      <div className="twk-lbl">
        <span>{label}</span>
        {value != null && <span className="twk-val">{value}</span>}
      </div>
      {children}
    </div>
  );
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({ label, value, min = 0, max = 100, step = 1, unit = '', onChange }) {
  return (
    <TweakRow label={label} value={`${value}${unit}`}>
      <input type="range" className="twk-slider" min={min} max={max} step={step}
             value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </TweakRow>
  );
}

function TweakToggle({ label, value, onChange }) {
  return (
    <div className="twk-row twk-row-h">
      <div className="twk-lbl"><span>{label}</span></div>
      <button type="button" className="twk-toggle" data-on={value ? '1' : '0'}
              role="switch" aria-checked={!!value}
              onClick={() => onChange(!value)}><i /></button>
    </div>
  );
}

function TweakRadio({ label, value, options, onChange }) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = (o) => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({ 2: 16, 3: 10 }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = (s) => {
      const m = options.find((o) => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return <TweakSelect label={label} value={value} options={options}
                        onChange={(s) => onChange(resolve(s))} />;
  }
  const opts = options.map((o) => (typeof o === 'object' ? o : { value: o, label: o }));
  const idx = Math.max(0, opts.findIndex((o) => o.value === value));
  const n = opts.length;

  const segAt = (clientX) => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor(((clientX - r.left - 2) / inner) * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };

  const onPointerDown = (e) => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = (ev) => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <TweakRow label={label}>
      <div ref={trackRef} role="radiogroup" onPointerDown={onPointerDown}
           className={dragging ? 'twk-seg dragging' : 'twk-seg'}>
        <div className="twk-seg-thumb"
             style={{ left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
                      width: `calc((100% - 4px) / ${n})` }} />
        {opts.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={o.value === value}>
            {o.label}
          </button>
        ))}
      </div>
    </TweakRow>
  );
}

function TweakSelect({ label, value, options, onChange }) {
  return (
    <TweakRow label={label}>
      <select className="twk-field" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => {
          const v = typeof o === 'object' ? o.value : o;
          const l = typeof o === 'object' ? o.label : o;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
    </TweakRow>
  );
}

function TweakText({ label, value, placeholder, onChange }) {
  return (
    <TweakRow label={label}>
      <input className="twk-field" type="text" value={value} placeholder={placeholder}
             onChange={(e) => onChange(e.target.value)} />
    </TweakRow>
  );
}

function TweakNumber({ label, value, min, max, step = 1, unit = '', onChange }) {
  const clamp = (n) => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({ x: 0, val: 0 });
  const onScrubStart = (e) => {
    e.preventDefault();
    startRef.current = { x: e.clientX, val: value };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = (ev) => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return (
    <div className="twk-num">
      <span className="twk-num-lbl" onPointerDown={onScrubStart}>{label}</span>
      <input type="number" value={value} min={min} max={max} step={step}
             onChange={(e) => onChange(clamp(Number(e.target.value)))} />
      {unit && <span className="twk-num-unit">{unit}</span>}
    </div>
  );
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, (c) => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}

const __TwkCheck = ({ light }) => (
  <svg viewBox="0 0 14 14" aria-hidden="true">
    <path d="M3 7.2 5.8 10 11 4.2" fill="none" strokeWidth="2.2"
          strokeLinecap="round" strokeLinejoin="round"
          stroke={light ? 'rgba(0,0,0,.78)' : '#fff'} />
  </svg>
);

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function TweakColor({ label, value, options, onChange }) {
  if (!options || !options.length) {
    return (
      <div className="twk-row twk-row-h">
        <div className="twk-lbl"><span>{label}</span></div>
        <input type="color" className="twk-swatch" value={value}
               onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = (o) => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return (
    <TweakRow label={label}>
      <div className="twk-chips" role="radiogroup">
        {options.map((o, i) => {
          const colors = Array.isArray(o) ? o : [o];
          const [hero, ...rest] = colors;
          const sup = rest.slice(0, 4);
          const on = key(o) === cur;
          return (
            <button key={i} type="button" className="twk-chip" role="radio"
                    aria-checked={on} data-on={on ? '1' : '0'}
                    aria-label={colors.join(', ')} title={colors.join(' · ')}
                    style={{ background: hero }}
                    onClick={() => onChange(o)}>
              {sup.length > 0 && (
                <span>
                  {sup.map((c, j) => <i key={j} style={{ background: c }} />)}
                </span>
              )}
              {on && <__TwkCheck light={__twkIsLight(hero)} />}
            </button>
          );
        })}
      </div>
    </TweakRow>
  );
}

function TweakButton({ label, onClick, secondary = false }) {
  return (
    <button type="button" className={secondary ? 'twk-btn secondary' : 'twk-btn'}
            onClick={onClick}>{label}</button>
  );
}

Object.assign(window, {
  useTweaks, TweaksPanel, TweakSection, TweakRow,
  TweakSlider, TweakToggle, TweakRadio, TweakSelect,
  TweakText, TweakNumber, TweakColor, TweakButton,
});

// ============================================================
// === scenes.jsx
// ============================================================
/* scenes.jsx — abstract layered-landscape placeholders standing in for photos.
   Deterministic per `type`. Not photographs — drop real imagery in later. */

const SCENE_DEFS = {
  tunnel: {
    sky: ["#F4C8A0", "#E89A6B"], sun: { x: 300, y: 70, r: 30, c: "#FBE3B8" },
    layers: [
      { c: "#7E5E78", p: [[0,150],[80,120],[160,140],[240,108],[330,135],[400,118],[400,280],[0,280]] },
      { c: "#3E3550", p: [[0,200],[110,150],[210,185],[300,150],[400,180],[400,280],[0,280]] },
    ],
    tunnel: { c: "#15101C", x: 175, w: 90 },
  },
  canyon: {
    sky: ["#BFE0F0", "#7FB6D6"], sun: null,
    layers: [
      { c: "#B5613A", p: [[0,40],[60,70],[60,280],[0,280]] },
      { c: "#B5613A", p: [[400,40],[330,80],[330,280],[400,280]] },
      { c: "#8C432A", p: [[0,120],[70,150],[70,280],[0,280]] },
      { c: "#8C432A", p: [[400,110],[320,150],[320,280],[400,280]] },
    ],
    river: { c: "#5E93AE", y: 232 },
  },
  mesa: {
    sky: ["#F3D9B0", "#E2A86C"], sun: { x: 90, y: 64, r: 26, c: "#FBEAC4" },
    layers: [
      { c: "#C97B4E", p: [[0,170],[120,168],[120,120],[230,120],[230,168],[400,166],[400,280],[0,280]] },
      { c: "#A04E2E", p: [[0,210],[90,208],[150,178],[260,178],[300,210],[400,206],[400,280],[0,280]] },
    ],
  },
  plains: {
    sky: ["#F6D7A8", "#E59A5E"], sun: { x: 320, y: 86, r: 34, c: "#FCEAC0" },
    layers: [
      { c: "#9A8650", p: [[0,196],[400,182],[400,280],[0,280]] },
      { c: "#6E6135", p: [[0,232],[400,224],[400,280],[0,280]] },
    ],
  },
  river: {
    sky: ["#CDE6EE", "#94C2D6"], sun: null,
    layers: [
      { c: "#7C9A6A", p: [[0,170],[150,160],[280,168],[400,158],[400,200],[0,200]] },
    ],
    river: { c: "#6FA0BC", y: 200 },
  },
  city: {
    sky: ["#9FB8D6", "#5E7BA6"], sun: null,
    skyline: true,
  },
  snow: {
    sky: ["#D8EAF4", "#A9CCE2"], sun: null,
    layers: [
      { c: "#9FB6C9", p: [[0,150],[90,80],[150,120],[230,60],[320,110],[400,80],[400,280],[0,280]] },
      { c: "#E9F1F6", p: [[0,150],[90,80],[110,95],[150,120],[200,82],[230,60],[270,95],[320,110],[360,92],[400,80],[400,140],[0,150]], snow: true },
      { c: "#6E8597", p: [[0,200],[120,150],[240,195],[340,160],[400,185],[400,280],[0,280]] },
    ],
  },
  resort: {
    sky: ["#CFE6F2", "#9CC6E0"], sun: { x: 70, y: 60, r: 24, c: "#FBF4DC" },
    layers: [
      { c: "#A8BECE", p: [[0,140],[120,70],[220,110],[320,64],[400,100],[400,280],[0,280]] },
      { c: "#EDF3F8", p: [[0,150],[120,70],[170,100],[220,110],[270,82],[320,64],[360,92],[400,100],[400,160],[0,170]], snow: true },
    ],
    slopes: true,
  },
  airport: {
    sky: ["#E3D3F0", "#B79AD2"], sun: { x: 310, y: 70, r: 28, c: "#F6E6C0" },
    layers: [
      { c: "#8D8068", p: [[0,210],[400,202],[400,280],[0,280]] },
    ],
    tents: true,
  },
  town: {
    sky: ["#E8DDC0", "#CBB98C"], sun: null,
    layers: [
      { c: "#9CB29B", p: [[0,140],[110,95],[200,125],[300,90],[400,120],[400,170],[0,170]] },
    ],
    town: true,
  },
  alps: {
    sky: ["#CFE6F2", "#9CC6E0"], sun: null,
    layers: [
      { c: "#8DA2B5", p: [[0,150],[70,55],[130,120],[200,38],[280,110],[350,50],[400,100],[400,280],[0,280]] },
      { c: "#EDF3F8", p: [[0,150],[70,55],[95,86],[130,120],[170,68],[200,38],[240,80],[280,110],[320,76],[350,50],[380,82],[400,100],[400,150],[0,150]], snow: true },
      { c: "#5E7A52", p: [[0,205],[120,165],[240,205],[340,168],[400,195],[400,280],[0,280]] },
    ],
  },
  viaduct: {
    sky: ["#CFE2EE", "#9DBFD6"], sun: null,
    layers: [
      { c: "#7E9A6E", p: [[0,150],[120,108],[260,140],[400,112],[400,280],[0,280]] },
    ],
    arches: { c: "#B7A684", topY: 118, baseY: 232, n: 6 },
  },
  fjord: {
    sky: ["#CFE6F2", "#A6CADD"], sun: null,
    layers: [
      { c: "#3C5A46", p: [[0,30],[100,95],[100,280],[0,280]] },
      { c: "#34503E", p: [[400,20],[300,100],[300,280],[400,280]] },
      { c: "#5E7A52", p: [[0,150],[100,95],[140,200],[0,220]] },
      { c: "#3E6E86", p: [[0,218],[400,210],[400,280],[0,280]] },
    ],
  },
  forest: {
    sky: ["#D7E4D0", "#A9C29A"], sun: null,
    layers: [
      { c: "#5E7A52", p: [[0,150],[120,108],[260,142],[400,108],[400,280],[0,280]] },
      { c: "#3E5A3A", p: [[0,200],[140,165],[280,202],[400,168],[400,280],[0,280]] },
    ],
    trees: { style: "conifer", c: "#2C4630" },
  },
  coast: {
    sky: ["#F3D9B0", "#E2A86C"], sun: { x: 300, y: 78, r: 30, c: "#FBEAC4" },
    layers: [
      { c: "#3E6E86", p: [[0,168],[400,158],[400,280],[0,280]] },
      { c: "#6E5A44", p: [[0,158],[90,148],[150,188],[150,280],[0,280]] },
    ],
  },
  fuji: {
    sky: ["#F3CBD6", "#C9A0C0"], sun: { x: 320, y: 66, r: 26, c: "#FBE3E8" },
    layers: [{ c: "#6E8060", p: [[0,238],[400,230],[400,280],[0,280]] }],
    cone: { c: "#5E6E8C", snowC: "#EDF3F8", baseY: 240, peakX: 200, peakY: 66, halfW: 152 },
  },
  plateau: {
    sky: ["#CFE0EE", "#9AB8D0"], sun: null,
    layers: [
      { c: "#A7B8C4", p: [[0,150],[80,118],[150,145],[230,116],[320,142],[400,120],[400,172],[0,172]] },
      { c: "#B89A6A", p: [[0,182],[400,178],[400,280],[0,280]] },
      { c: "#9C7E50", p: [[0,224],[400,218],[400,280],[0,280]] },
    ],
  },
  desert: {
    sky: ["#F3D2A0", "#E09B5C"], sun: { x: 92, y: 70, r: 30, c: "#FBE6BE" },
    layers: [
      { c: "#D08A50", p: [[0,182],[120,168],[240,184],[360,168],[400,176],[400,280],[0,280]] },
      { c: "#A85E32", p: [[0,222],[140,206],[280,224],[400,210],[400,280],[0,280]] },
    ],
  },
  savanna: {
    sky: ["#F1D79E", "#D99A4E"], sun: { x: 300, y: 80, r: 32, c: "#FBE6B8" },
    layers: [
      { c: "#B79A4E", p: [[0,186],[400,178],[400,280],[0,280]] },
      { c: "#8A6E32", p: [[0,226],[400,220],[400,280],[0,280]] },
    ],
    trees: { style: "acacia", c: "#3E3522" },
  },
  dome: { interior: true, sky: ["#CFE6F2", "#8FB8D4"], warm: "#3A2C22", frame: "#1E150F",
    layers: [{ c: "#6E8597", p: [[0,120],[100,70],[200,105],[300,68],[400,100],[400,160],[0,160]] }] },
  meal: { interior: true, sky: ["#F4D7A8", "#E1A36A"], warm: "#3A2C22", frame: "#1E150F", plate: true,
    layers: [{ c: "#8C7B58", p: [[0,130],[400,118],[400,160],[0,160]] }] },
};

function ridgePath(points) {
  return points.map((p, i) => (i === 0 ? "M" : "L") + p[0] + "," + p[1]).join(" ") + " Z";
}

function Scene({ type, className, vignette = true }) {
  const d = SCENE_DEFS[type] || SCENE_DEFS.plains;
  const gid = "g_" + type;
  const W = 400, H = 280;

  // skyline (city) buildings
  const buildings = [];
  if (d.skyline) {
    let x = 0;
    const hs = [120, 70, 150, 95, 175, 60, 200, 110, 140, 80, 160, 100];
    let i = 0;
    while (x < W) {
      const w = 26 + ((i * 13) % 22);
      const top = hs[i % hs.length];
      buildings.push(<rect key={"b"+i} x={x} y={top} width={w - 3} height={H - top} fill={i % 2 ? "#465E84" : "#3A4E70"} />);
      x += w; i++;
    }
  }

  return (
    <svg className={"scene " + (className || "")} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={d.sky[0]} />
          <stop offset="1" stopColor={d.sky[1]} />
        </linearGradient>
        <radialGradient id={gid + "_v"} cx="0.5" cy="0.42" r="0.75">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.28" />
        </radialGradient>
        <clipPath id={gid + "_win"}><path d="M40,250 L40,90 Q200,30 360,90 L360,250 Z" /></clipPath>
      </defs>

      {!d.interior && <>
        <rect x="0" y="0" width={W} height={H} fill={`url(#${gid})`} />
        {d.sun && <circle cx={d.sun.x} cy={d.sun.y} r={d.sun.r} fill={d.sun.c} opacity="0.92" />}
        {buildings}
        {(d.layers || []).map((L, i) => (
          <g key={i}>
            <path d={ridgePath(L.p)} fill={L.c} />
          </g>
        ))}
        {d.river && <rect x="0" y={d.river.y} width={W} height={H - d.river.y} fill={d.river.c} opacity="0.85" />}
        {d.tunnel && <path d={`M${d.tunnel.x},280 L${d.tunnel.x},${190} Q${d.tunnel.x + d.tunnel.w/2},150 ${d.tunnel.x + d.tunnel.w},190 L${d.tunnel.x + d.tunnel.w},280 Z`} fill={d.tunnel.c} />}
        {d.slopes && <g stroke="#C9DCE8" strokeWidth="2" opacity="0.7">
          <path d="M120,72 L150,260" fill="none" /><path d="M210,108 L235,260" fill="none" /><path d="M310,66 L330,260" fill="none" />
        </g>}
        {d.tents && <g fill="#F0E9DA" stroke="#C9BFA8" strokeWidth="1.5">
          <path d="M60,210 Q110,150 160,210 Z" /><path d="M150,210 Q200,150 250,210 Z" /><path d="M240,210 Q290,150 340,210 Z" /><path d="M330,210 Q370,160 400,210 Z" />
        </g>}
        {d.town && <g fill="#6E5A48">
          <rect x="60" y="135" width="40" height="35" /><rect x="110" y="120" width="30" height="50" /><rect x="160" y="142" width="46" height="28" /><rect x="230" y="125" width="34" height="45" /><rect x="290" y="138" width="40" height="32" />
        </g>}
        {d.cone && (() => {
          const c = d.cone, lx = c.peakX - c.halfW, rx = c.peakX + c.halfW;
          const capH = (c.baseY - c.peakY) * 0.34, capHalf = c.halfW * 0.34;
          return <g>
            <path d={`M${c.peakX},${c.peakY} L${rx},${c.baseY} L${lx},${c.baseY} Z`} fill={c.c} />
            <path d={`M${c.peakX},${c.peakY} L${c.peakX + capHalf},${c.peakY + capH} Q${c.peakX},${c.peakY + capH - 10} ${c.peakX - capHalf},${c.peakY + capH} Z`} fill={c.snowC} />
          </g>;
        })()}
        {d.arches && (() => {
          const a = d.arches, span = W / a.n, pierW = span * 0.2, deckH = 13;
          const els = [<rect key="deck" x="0" y={a.topY} width={W} height={deckH} fill={a.c} />];
          for (let i = 0; i <= a.n; i++) {
            const x = i * span - pierW / 2;
            els.push(<rect key={"p" + i} x={x} y={a.topY + deckH} width={pierW} height={a.baseY - a.topY - deckH} fill={a.c} />);
          }
          els.push(<rect key="sh" x="0" y={a.topY + deckH} width={W} height="4" fill="#000" opacity="0.12" />);
          return <g>{els}</g>;
        })()}
        {d.trees && (() => {
          const t = d.trees, els = [];
          if (t.style === "conifer") {
            const base = 206;
            for (let i = 0; i < 13; i++) {
              const x = 12 + i * 31, h = 26 + ((i * 17) % 22), w = 11;
              els.push(<path key={i} d={`M${x},${base - h} L${x + w},${base} L${x - w},${base} Z`} fill={t.c} opacity={0.85} />);
            }
          } else {
            // acacia umbrella trees
            [[70, 196, 1], [180, 188, 1.25], [300, 198, 0.95], [360, 192, 1.1]].forEach((s, i) => {
              const [x, y, k] = s;
              els.push(<g key={i} fill={t.c}>
                <rect x={x - 1.5} y={y - 22 * k} width="3" height={22 * k} />
                <ellipse cx={x} cy={y - 24 * k} rx={26 * k} ry={7 * k} />
              </g>);
            });
          }
          return <g>{els}</g>;
        })()}
      </>}

      {d.interior && <>
        <rect x="0" y="0" width={W} height={H} fill={d.warm} />
        <g clipPath={`url(#${gid}_win)`}>
          <rect x="0" y="0" width={W} height={H} fill={`url(#${gid})`} />
          {(d.layers || []).map((L, i) => <path key={i} d={ridgePath(L.p)} fill={L.c} />)}
        </g>
        <path d="M40,250 L40,90 Q200,30 360,90 L360,250 Z" fill="none" stroke={d.frame} strokeWidth="13" />
        <line x1="200" y1="42" x2="200" y2="250" stroke={d.frame} strokeWidth="7" />
        <path d="M40,90 Q200,30 360,90" fill="none" stroke={d.frame} strokeWidth="7" opacity="0.5" />
        {d.plate && <g>
          <ellipse cx="200" cy="250" rx="78" ry="18" fill="#241B14" />
          <ellipse cx="200" cy="245" rx="60" ry="13" fill="#EDE3CE" />
          <ellipse cx="200" cy="243" rx="30" ry="7" fill="#C98A5A" />
        </g>}
      </>}

      {vignette && <rect x="0" y="0" width={W} height={H} fill={`url(#${gid}_v)`} />}
    </svg>
  );
}

window.Scene = Scene;

// ============================================================
// === world-map.jsx
// ============================================================
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

// ============================================================
// === datepicker.jsx
// ============================================================
/* datepicker.jsx — custom date + time popover field (window.DateTimeField).
   Single mode:  value = { date:'YYYY-MM-DD', time:'HH:MM' } | null
   Range mode (range prop): value = { start:{date,time}, stop:{date,time} } */

const _MON = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const _MONS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const _DOW = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function fmtWhen(v, withTime) {
  if (!v || !v.date) return null;
  const d = new Date(v.date + "T00:00");
  const ds = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  if (!withTime || !v.time) return ds;
  if (v.time === "any") return ds + " · any time";
  const [h, m] = v.time.split(":").map(Number);
  const ap = h < 12 ? "am" : "pm", h12 = ((h + 11) % 12) + 1;
  return ds + " · " + h12 + (m ? ":" + String(m).padStart(2, "0") : "") + ap;
}
function shortDate(d) { return d ? _MONS[+d.slice(5, 7) - 1] + " " + +d.slice(8, 10) : null; }

const TIMES = (() => { const a = []; for (let h = 5; h <= 23; h++) for (const m of [0, 30]) a.push(String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0")); return a; })();
function time12(t) { const [h, m] = t.split(":").map(Number); const ap = h < 12 ? "a" : "p"; return (((h + 11) % 12) + 1) + (m ? ":" + String(m).padStart(2, "0") : "") + ap; }
function ampm(t) { if (!t) return ""; if (t === "any") return "any time"; const [h, m] = t.split(":").map(Number); const ap = h < 12 ? "am" : "pm"; return (((h + 11) % 12) + 1) + (m ? ":" + String(m).padStart(2, "0") : "") + ap; }

function DateTimeField({ value, onChange, label, dark, withTime = true, align = "left", range = false, compact = false }) {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef(null);
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const start = range ? (value && value.start) : value;
  const stop = range ? (value && value.stop) : null;
  const anchorISO = (start && start.date) || (value && value.date);
  const initDate = anchorISO ? new Date(anchorISO + "T00:00") : today;
  const [vy, setVy] = React.useState(initDate.getFullYear());
  const [vm, setVm] = React.useState(initDate.getMonth());

  React.useEffect(() => {
    if (!open) return;
    const onDoc = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const firstDow = new Date(vy, vm, 1).getDay();
  const daysInMonth = new Date(vy, vm + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(vy, vm, d));
  const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");

  function prevMonth() { const m = vm - 1; if (m < 0) { setVm(11); setVy(vy - 1); } else setVm(m); }
  function nextMonth() { const m = vm + 1; if (m > 11) { setVm(0); setVy(vy + 1); } else setVm(m); }

  function pickDay(d) {
    const ds = iso(d);
    if (!range) { onChange({ date: ds, time: (value && value.time) || "any" }); return; }
    const sTime = (start && start.time) || "any";
    const eTime = (stop && stop.time) || "any";
    if (!start || (start && stop)) {            // begin a new range
      onChange({ start: { date: ds, time: sTime }, stop: null });
    } else {                                    // closing the range
      if (ds < start.date) onChange({ start: { date: ds, time: sTime }, stop: null });
      else onChange({ start: start, stop: { date: ds, time: eTime } });
    }
  }
  function pickTime(which, t) {
    if (!range) { onChange({ date: (value && value.date) || iso(today), time: t }); return; }
    if (which === "start") onChange({ start: { date: (start && start.date) || iso(today), time: t }, stop: stop });
    else onChange({ start: start, stop: { date: (stop && stop.date) || (start && start.date) || iso(today), time: t } });
  }

  // display
  let disp;
  if (!range) {
    if (compact && value && value.date) disp = shortDate(value.date) + (withTime ? (value.time === "any" ? " · any time" : (value.time ? " · " + ampm(value.time) : "")) : "");
    else if (compact) disp = null;
    else disp = fmtWhen(value, withTime);
  }
  else if (start && start.date && stop && stop.date) disp = shortDate(start.date) + " → " + shortDate(stop.date);
  else if (start && start.date) disp = shortDate(start.date) + " → return?";
  else disp = null;

  const sISO = start && start.date, eISO = stop && stop.date;

  return (
    <div className="dtf-wrap" ref={wrapRef}>
      <button className={"dtf" + (dark ? " dtf-dark" : "")} onClick={() => setOpen(o => !o)} type="button">
        <span className="dtf-ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /></svg></span>
        <span style={{ minWidth: 0 }}>
          <span className="dtf-lbl">{label}</span>
          <span className={"dtf-val" + (disp ? "" : " empty")}>{disp || (range ? "Select dates" : "Select date")}</span>
        </span>
      </button>
      {open && (
        <div className={"dtf-pop" + (align === "right" ? " right" : "") + (range ? " wide" : "")}>
          {range && <div className="rng-head">
            <div className={"rng-end" + (!eISO ? " active" : "")}><span className="re-k">Start</span><span className="re-v">{sISO ? shortDate(sISO) + (start.time ? " · " + ampm(start.time) : "") : "Pick a date"}</span></div>
            <span className="rng-arrow">→</span>
            <div className={"rng-end" + (sISO && !eISO ? " active" : "")}><span className="re-k">Stop</span><span className="re-v">{eISO ? shortDate(eISO) + (stop.time ? " · " + ampm(stop.time) : "") : "Pick a date"}</span></div>
          </div>}
          <div className="cal-head">
            <button onClick={prevMonth} type="button" aria-label="Previous month"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M15 6l-6 6 6 6" /></svg></button>
            <span className="cal-title">{_MON[vm]} {vy}</span>
            <button onClick={nextMonth} type="button" aria-label="Next month"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg></button>
          </div>
          <div className="cal-grid">
            {_DOW.map(d => <div className="dow" key={d}>{d}</div>)}
            {cells.map((d, i) => {
              if (d === null) return <span key={"e" + i}></span>;
              const ds = iso(d);
              const isStart = ds === sISO, isEnd = ds === eISO;
              const inRange = range && sISO && eISO && ds > sISO && ds < eISO;
              const cls = "cal-day"
                + ((isStart || isEnd) ? " sel" : "")
                + (inRange ? " inrange" : "")
                + (range && isStart && eISO ? " rstart" : "")
                + (range && isEnd ? " rend" : "");
              return <button key={i} type="button" className={cls} disabled={d < today} onClick={() => pickDay(d)}>{d.getDate()}</button>;
            })}
          </div>
          {withTime && (range ? (
            <div className="time-sec">
              <div className="ts-lbl">Departure time</div>
              <div className="time-list"><button type="button" className={"any-opt" + (start && start.time === "any" ? " on" : "")} onClick={() => pickTime("start", "any")}>Any time</button>{TIMES.map(t => <button key={t} type="button" className={(start && start.time === t) ? "on" : ""} onClick={() => pickTime("start", t)}>{time12(t)}</button>)}</div>
              <div className="ts-lbl" style={{ marginTop: 10, opacity: eISO ? 1 : .45 }}>Return time</div>
              <div className="time-list"><button type="button" disabled={!eISO} className={"any-opt" + (stop && stop.time === "any" ? " on" : "")} onClick={() => pickTime("stop", "any")}>Any time</button>{TIMES.map(t => <button key={t} type="button" disabled={!eISO} className={(stop && stop.time === t) ? "on" : ""} onClick={() => pickTime("stop", t)}>{time12(t)}</button>)}</div>
            </div>
          ) : (
            <div className="time-sec">
              <div className="ts-lbl">Departure time</div>
              <div className="time-list"><button type="button" className={"any-opt" + (value && value.time === "any" ? " on" : "")} onClick={() => pickTime("start", "any")}>Any time</button>{TIMES.map(t => <button key={t} type="button" className={(value && value.time === t) ? "on" : ""} onClick={() => pickTime("start", t)}>{time12(t)}</button>)}</div>
            </div>
          ))}
          <button className="dtf-done" type="button" onClick={() => setOpen(false)}>Done</button>
        </div>
      )}
    </div>
  );
}

window.DateTimeField = DateTimeField;
window.fmtWhen = fmtWhen;

// ============================================================
// === cart.jsx
// ============================================================
/* cart.jsx — cart button, cart drawer, account menu, auth modal, toast.
   Relies on window.Store / useStore from store.jsx. */

function cardBrand(num) {
  const n = (num || "").replace(/\s/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  if (/^6/.test(n)) return "discover";
  return "card";
}
function BrandMark({ brand, size = 30 }) {
  const w = size, h = Math.round(size * 0.63);
  const wrap = (kids, bg) => <svg width={w} height={h} viewBox="0 0 40 25" style={{ borderRadius: 4, background: bg || "#fff", boxShadow: "inset 0 0 0 1px rgba(0,0,0,.08)" }}>{kids}</svg>;
  if (brand === "visa") return wrap(<text x="20" y="17" textAnchor="middle" fontFamily="Georgia,serif" fontStyle="italic" fontWeight="700" fontSize="11" fill="#1A1F71">VISA</text>);
  if (brand === "mastercard") return wrap(<g><circle cx="16" cy="12.5" r="7" fill="#EB001B" /><circle cx="24" cy="12.5" r="7" fill="#F79E1B" opacity="0.9" /></g>);
  if (brand === "amex") return wrap(<g><rect width="40" height="25" fill="#2E77BC" /><text x="20" y="15" textAnchor="middle" fontFamily="Arial" fontWeight="700" fontSize="7" fill="#fff">AMEX</text></g>, "#2E77BC");
  if (brand === "discover") return wrap(<g><text x="18" y="16" textAnchor="middle" fontFamily="Arial" fontWeight="700" fontSize="6.5" fill="#222">DISC</text><circle cx="31" cy="13" r="4" fill="#F76E11" /></g>);
  return wrap(<g stroke="#999" fill="none"><rect x="4" y="6" width="32" height="13" rx="2" /><path d="M4 10h32" stroke="#999" /></g>);
}
window.cardBrand = cardBrand;
window.BrandMark = BrandMark;

function CIco({ d, size = 18, sw = 1.8 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
}

/* ---------- top-bar cart button ---------- */
function CartButton() {
  const s = useStore();
  const n = s.state.cart.length;
  return (
    <button className="iconbtn cartbtn" onClick={() => s.openCart()} title="Cart">
      <CIco d={<><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h3l2.5 13h11l2.5-9H6" /></>} size={17} />
      Cart
      {n > 0 && <span className="cart-badge">{n}</span>}
    </button>
  );
}
window.CartButton = CartButton;

/* ---------- top-bar account menu ---------- */
function AccountMenu() {
  const s = useStore();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn); return () => document.removeEventListener("mousedown", fn);
  }, [open]);
  const acct = s.state.account;
  if (!acct) return <button className="iconbtn" onClick={() => s.openAuth("signin")}><CIco d={<><circle cx="12" cy="8" r="3.4" /><path d="M5 20a7 7 0 0 1 14 0" /></>} size={16} />Sign in</button>;
  const initials = acct.name.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button className="iconbtn" onClick={() => setOpen(o => !o)}><span className="acct-av">{initials}</span>{acct.name.split(" ")[0]}</button>
      {open && (
        <div className="acct-pop">
          <div className="acct-id"><span className="acct-av lg">{initials}</span><div style={{ minWidth: 0 }}><div className="an">{acct.name}</div><div className="ae">{acct.email}</div></div></div>
          <div className="acct-cards-h">Saved payment methods</div>
          {acct.cards.length === 0 && <div className="acct-empty">No cards saved yet</div>}
          {acct.cards.map(c => (
            <div className="acct-card" key={c.id}>
              <BrandMark brand={c.brand} size={30} />
              <span className="ac-num">···· {c.last4}</span><span className="ac-exp">{c.exp}</span>
              <button className="ac-rm" onClick={() => s.removeCard(c.id)} title="Remove"><CIco d={<path d="M6 6l12 12M18 6L6 18" />} size={13} sw={2} /></button>
            </div>
          ))}
          <button className="acct-signout" onClick={() => { s.signOut(); setOpen(false); }}>Sign out</button>
        </div>
      )}
    </div>
  );
}
window.AccountMenu = AccountMenu;

/* ---------- cart drawer ---------- */
function Stepper2({ value, min, max, onChange }) {
  return (
    <div className="stepper" style={{ padding: 3 }}>
      <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} style={{ width: 26, height: 26, fontSize: 16 }}>−</button>
      <span className="stepper-val mono" style={{ minWidth: 20, fontSize: 13 }}>{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} style={{ width: 26, height: 26, fontSize: 16 }}>+</button>
    </div>
  );
}

function CartDrawer() {
  const s = useStore();
  if (!s.state.ui.cartOpen) return null;
  const cart = s.state.cart;
  const totals = window.CCCPrice.cartTotals(cart);
  const RC = window.RAIL.regionColors;
  const short = x => (x || "").split(",")[0];
  return (
    <div className="drawer-scrim" onMouseDown={e => { if (e.target === e.currentTarget) s.closeCart(); }}>
      <div className="cart-drawer" data-screen-label="Cart">
        <div className="cart-head">
          <h2 className="serif">Your cart</h2>
          <span className="cart-count">{cart.length} item{cart.length === 1 ? "" : "s"}</span>
          <button className="cart-x" onClick={() => s.closeCart()}><CIco d={<path d="M6 6l12 12M18 6L6 18" />} size={18} sw={2.2} /></button>
        </div>
        {cart.length === 0 ? (
          <div className="cart-empty">
            <CIco d={<><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h3l2.5 13h11l2.5-9H6" /></>} size={40} sw={1.4} />
            <p className="serif">Your cart is empty</p>
            <span>Add a train from any route to get started.</span>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map(it => {
                const c = RC[it.region] || RC["North America"];
                const r = window.CCCPrice.routeById(it.routeId);
                return (
                  <div className="cart-item" key={it.id}>
                    <span className="ci-dot" style={{ background: c.fg }}></span>
                    <div className="ci-main">
                      <div className="ci-name">{it.name}{it.roundTrip && <span className="rtbadge">⇄ RT</span>}</div>
                      <div className="ci-sub">{short(it.origin)} → {short(it.destination)} · {it.className}</div>
                      <div className="ci-when">{window.fmtWhen ? window.fmtWhen({ date: it.date, time: it.time }, true) : it.date}</div>
                      <div className="ci-pax">
                        <span>Adults</span><Stepper2 value={it.adults} min={1} max={8} onChange={v => s.updateItem(it.id, { adults: v })} />
                        <span style={{ marginLeft: 8 }}>Kids</span><Stepper2 value={it.kids} min={0} max={8} onChange={v => s.updateItem(it.id, { kids: v })} />
                      </div>
                    </div>
                    <div className="ci-right">
                      <div className="ci-price mono">{window.money(window.CCCPrice.itemPrice(it))}</div>
                      <button className="ci-rm" onClick={() => s.removeFromCart(it.id)}>Remove</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="cart-foot">
              <div className="cart-line"><span>Est. total{cart.length > 1 ? " · across " + cart.length + " legs" : ""}</span><span className="mono">{window.money(totals.subtotal)}</span></div>
              <div className="cart-line" style={{fontSize: 11.5, color: "var(--ink-faint)", marginTop: 4}}>You'll book each leg on the operator's own site. We may earn a commission.</div>
              <button
                className="cart-checkout"
                onClick={() => {
                  let openedAny = false;
                  cart.forEach((c) => {
                    const route = (window.RAIL && window.RAIL.routes.find((r) => r.id === c.routeId)) || c.route;
                    const url = route && window.bookingUrl && window.bookingUrl(route);
                    if (url) { window.open(url, "_blank", "noopener,noreferrer"); openedAny = true; }
                  });
                  if (!openedAny) window.Store.toast("No bookable routes in this trip");
                  else if (cart.length > 1) window.Store.toast("Opened " + cart.length + " operator tabs");
                }}
              >
                {cart.length === 1 ? ("Continue on " + (cart[0].operator || "operator") + " ↗") : ("Open " + cart.length + " operator tabs ↗")}
              </button>
              <button className="cart-clear" onClick={() => s.clearCart()}>Clear trip</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
window.CartDrawer = CartDrawer;

/* ---------- auth modal (sign in / create account) ---------- */
function AuthModal() {
  const s = useStore();
  const [mode, setMode] = React.useState(s.state.ui.authMode);
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [pw, setPw] = React.useState("");
  const [prefs, setPrefs] = React.useState("");
  React.useEffect(() => { setMode(s.state.ui.authMode); }, [s.state.ui.authMode, s.state.ui.authOpen]);
  if (!s.state.ui.authOpen) return null;
  const isSignup = mode === "signup";
  const valid = /@/.test(email) && pw.length >= 4 && (!isSignup || name.trim());
  function submit() {
    if (!valid) return;
    if (isSignup) s.createAccount(name, email, null, prefs); else s.signIn(email);
    s.closeAuth();
  }
  return (
    <div className="co-scrim" onMouseDown={e => { if (e.target === e.currentTarget) s.closeAuth(); }}>
      <div className="auth-modal" data-screen-label="Auth">
        <button className="co-close" onClick={() => s.closeAuth()}><CIco d={<path d="M6 6l12 12M18 6L6 18" />} size={18} sw={2.2} /></button>
        <div className="auth-tabs">
          <button className={!isSignup ? "on" : ""} onClick={() => setMode("signin")}>Sign in</button>
          <button className={isSignup ? "on" : ""} onClick={() => setMode("signup")}>Create account</button>
        </div>
        <div className="auth-body">
          <p className="auth-lead serif">{isSignup ? "Save your details for faster checkout." : "Welcome back, traveler."}</p>
          {isSignup && <div className="co-field"><label>Full name</label><input className="co-input" value={name} onChange={e => setName(e.target.value)} placeholder="Ada Lovelace" /></div>}
          <div className="co-field"><label>Email</label><input className="co-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></div>
          <div className="co-field"><label>Password</label><input className="co-input" type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" /></div>
          {isSignup && <div className="co-field">
            <label>What kind of trips do you love? <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 600, color: "var(--ink-faint)" }}>· optional</span></label>
            <textarea className="co-input prefs-area" rows={3} value={prefs} onChange={e => setPrefs(e.target.value)} placeholder="e.g. scenic mountain routes in Europe, especially overnight sleepers, and I love a deal — keep me under $300." />
            <div className="prefs-hint">We use this to preset your filters and flag sales on trips you'd love.</div>
          </div>}
          <button className="co-cta" disabled={!valid} onClick={submit}>{isSignup ? "Create account" : "Sign in"}</button>
          <div className="auth-alt">{isSignup ? "Already have an account? " : "New here? "}<button onClick={() => setMode(isSignup ? "signin" : "signup")}>{isSignup ? "Sign in" : "Create one"}</button></div>
          <div className="auth-demo">Demo only — no real credentials are stored or verified.</div>
        </div>
      </div>
    </div>
  );
}
window.AuthModal = AuthModal;

/* ---------- "For you" notices bar (LLM-curated, backend-built) ---------- */
function ForYouBar({ onOpen }) {
  const s = useStore();
  const acct = s.state.account;
  if (!acct) return null;
  if (acct.prefsBuilding) return (
    <div className="foryou building"><span className="fy-spin"></span>Curating your preferences…</div>
  );
  const prefs = acct.prefs;
  if (!prefs || !prefs.notices || !prefs.notices.length) return null;
  const dis = acct.dismissed || [];
  const notices = prefs.notices.filter(n => !dis.includes(n.id));
  if (!notices.length) return null;
  const short = x => (x || "").split(",")[0];
  return (
    <div className="foryou">
      <span className="fy-tag"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7-4.5-9.3-9C1 8.5 3 5 6.5 5 8.6 5 10 6.3 12 8.5 14 6.3 15.4 5 17.5 5 21 5 23 8.5 21.3 12 19 16.5 12 21 12 21z" /></svg>For you</span>
      <div className="fy-scroll">
        {notices.map(n => {
          const c = window.RAIL.regionColors[n.region] || window.RAIL.regionColors["North America"];
          const r = window.CCCPrice.routeById(n.routeId);
          return (
            <div className="fy-card" key={n.id} onClick={() => r && onOpen(r)} role="button">
              <span className="fy-dot" style={{ background: c.fg }}></span>
              <span className="fy-main"><b>{n.name}</b><span className="fy-deal">−{n.pct}% · {n.deal} · {short(n.origin)}→{short(n.destination)}</span></span>
              <button className="fy-x" onClick={e => { e.stopPropagation(); s.dismissNotice(n.id); }} aria-label="Dismiss"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
window.ForYouBar = ForYouBar;

/* ---------- toast ---------- */
function Toast() {
  const s = useStore();
  const t = s.state.ui.toast;
  if (!t) return null;
  return <div className="toast" key={t.t}><CIco d={<path d="M5 12l4.5 4.5L19 7" />} size={16} sw={2.4} />{t.msg}</div>;
}
window.Toast = Toast;

// ============================================================
// === checkout.jsx
// ============================================================
/* checkout.jsx — items-based checkout with Stripe-style payment, guest/account
   checkout, and saved cards. Reads cart/account from window.Store. */

function _money(n) { return "$" + (n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function _digits(s) { return (s || "").replace(/\D/g, ""); }
function _city(s) { return (s || "").split(",")[0]; }
function _ampm(t) { if (!t) return ""; const [h, m] = t.split(":").map(Number); const ap = h < 12 ? "am" : "pm"; return (((h + 11) % 12) + 1) + (m ? ":" + String(m).padStart(2, "0") : "") + ap; }
function _niceDate(d) { return d ? new Date(d + "T00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : ""; }

function CkStepper({ value, min, max, onChange, label, sub }) {
  return (
    <div className="stepper-row">
      <div><div className="sr-label">{label}</div>{sub && <div className="sr-sub">{sub}</div>}</div>
      <div className="stepper">
        <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>−</button>
        <span className="stepper-val mono">{value}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>+</button>
      </div>
    </div>
  );
}

function Checkout({ items: inItems, opts, onClose, onDone }) {
  const s = useStore();
  const editable = opts && opts.editable;
  const fromCart = opts && opts.fromCart;
  const acct = s.state.account;

  const returned = opts && opts.returnedSession;
  const [items, setItems] = React.useState(() => inItems.map(it => ({ ...it })));
  const [step, setStep] = React.useState(returned ? 3 : 1);
  const [email, setEmail] = React.useState(returned ? (returned.email || "") : (acct ? acct.email : ""));
  const [pm, setPm] = React.useState(acct && acct.cards.length ? acct.cards[0].id : "new");
  const [card, setCard] = React.useState({ name: "", num: "", exp: "", cvc: "", zip: "" });
  const [saveCard, setSaveCard] = React.useState(!!acct);
  const [createAcct, setCreateAcct] = React.useState(false);
  const [acctPw, setAcctPw] = React.useState("");
  const [processing, setProcessing] = React.useState(false);
  const [conf, setConf] = React.useState(() => {
    if (!returned) return null;
    return {
      code: returned.id || ("STRIPE-" + Date.now().toString(36).toUpperCase()),
      paymentIntent: returned.paymentIntent,
      amountTotalCents: returned.amountTotal,
      currency: returned.currency,
      livemode: returned.livemode,
      stripe: true,
      tickets: (inItems || []).map(it => ({
        id: it.id || Math.random().toString(36).slice(2),
        name: it.name,
        route: (it.origin || "").split(",")[0] + " → " + (it.destination || "").split(",")[0],
        coach: String.fromCharCode(65 + Math.floor(Math.random() * 6)) + Math.ceil(Math.random() * 14),
        seat: Math.ceil(Math.random() * 60) + "ABCD"[Math.floor(Math.random() * 4)],
        roundTrip: !!it.roundTrip,
        className: it.className,
      })),
    };
  });

  const RC = window.RAIL.regionColors;
  const P = window.CCCPrice;
  const totals = P.cartTotals(items);
  const headItem = items[0];
  const headColor = RC[headItem.region] || RC["North America"];
  const single = items.length === 1;

  const usingNew = pm === "new";
  const brand = window.cardBrand(card.num);
  const cardValid = card.name.trim() && _digits(card.num).length >= 15 && card.exp.length === 5 && _digits(card.cvc).length >= 3;
  const emailValid = /@/.test(email);
  // When a real Stripe backend is wired, the card is collected on Stripe's
  // hosted page; we only need a valid email here. Otherwise (mock mode), keep
  // requiring the legacy in-form card details.
  const stripeBackend = !!(typeof window !== "undefined" && window.CHECKOUT_API_ENABLED);
  const payReady = stripeBackend
    ? emailValid
    : (emailValid && (!usingNew || cardValid) && (!createAcct || acctPw.length >= 4));

  const fmtCardNum = v => _digits(v).slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const fmtExp = v => { const d = _digits(v).slice(0, 4); return d.length >= 3 ? d.slice(0, 2) + "/" + d.slice(2) : d; };

  // editing the single item (buy-now)
  function setItem(patch) { setItems([{ ...items[0], ...patch }]); }
  const route0 = headItem.route || P.routeById(headItem.routeId);

  async function pay(viaLink) {
    setProcessing(true);

    // Persist account/card preferences BEFORE we hand off to Stripe — they
    // should survive the redirect.
    const newCard = usingNew && cardValid ? { brand, last4: _digits(card.num).slice(-4), exp: card.exp, name: card.name } : null;
    if (createAcct && !acct && emailValid) window.Store.createAccount(card.name || email.split("@")[0], email, newCard);
    else if (saveCard && acct && newCard) window.Store.addCard(newCard);

    // Remember the cart items so the return-from-Stripe handler can render
    // a real "Booking confirmed" panel from the same data we charged for.
    try {
      sessionStorage.setItem("ccc_pending_checkout", JSON.stringify({
        items: items.map(it => ({
          routeId: it.routeId || (it.route && it.route.id),
          name: it.name,
          region: it.region,
          operator: it.operator,
          origin: it.origin,
          destination: it.destination,
          className: it.className,
          classIdx: it.classIdx,
          adults: it.adults,
          kids: it.kids,
          roundTrip: !!it.roundTrip,
          date: it.date,
          time: it.time,
        })),
        email,
        fromCart: !!fromCart,
        t: Date.now(),
      }));
    } catch {}

    // If the backend isn't configured, fall back to the original mock so the
    // app still works for local dev / portfolio viewing.
    if (!window.CHECKOUT_API_ENABLED) {
      setTimeout(() => {
        const tickets = items.map(it => ({
          id: it.id || Math.random().toString(36).slice(2),
          name: it.name, route: _city(it.origin) + " → " + _city(it.destination),
          coach: String.fromCharCode(65 + Math.floor(Math.random() * 6)) + Math.ceil(Math.random() * 14),
          seat: Math.ceil(Math.random() * 60) + "ABCD"[Math.floor(Math.random() * 4)],
          roundTrip: it.roundTrip, className: it.className,
        }));
        const code = "MOCK-" + Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Math.floor(1000 + Math.random() * 9000);
        if (fromCart) window.Store.clearCart();
        setConf({ code, tickets, mock: true });
        setProcessing(false); setStep(3);
      }, 700);
      return;
    }

    // Real path: ask the backend for a Stripe Checkout Session and redirect.
    try {
      const base = (window.CHECKOUT_API_URL || "").replace(/\/$/, "");
      const r = await fetch(base + "/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email || (acct && acct.email) || "",
          items: items.map(it => ({
            routeId: it.routeId || (it.route && it.route.id),
            classIdx: it.classIdx,
            adults: it.adults,
            kids: it.kids,
            roundTrip: !!it.roundTrip,
            date: it.date,
            time: it.time,
          })),
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.url) throw new Error(j.error || `checkout failed (${r.status})`);
      window.location.assign(j.url);
    } catch (e) {
      setProcessing(false);
      window.Store.toast("Checkout error: " + e.message);
    }
  }

  return (
    <div className="co-scrim" onMouseDown={e => { if (e.target === e.currentTarget && !processing) onClose(); }}>
      <div className="co-modal wide-modal" data-screen-label="Checkout">
        <div className="co-head">
          <div>
            <span className="opbadge" style={{ background: headColor.bg, color: headColor.fg, marginBottom: 7 }}><span className="opdot" style={{ background: headColor.fg }}></span>{single ? headItem.operator : items.length + " trips"}</span>
            <h2>{step === 3 ? "Booking confirmed" : single ? "Book " + headItem.name : "Checkout"}</h2>
            <div className="co-sub">{single ? _city(headItem.origin) + (headItem.roundTrip ? " ⇄ " : " → ") + _city(headItem.destination) : "Your cart · " + items.length + " trips"}</div>
          </div>
          {!processing && <button className="co-close" onClick={onClose}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></button>}
        </div>

        {step < 3 && <div className="co-steps">
          <span className={step >= 1 ? "on" : ""}>1 · Review</span><span className="co-stepline"></span>
          <span className={step >= 2 ? "on" : ""}>2 · Payment</span><span className="co-stepline"></span>
          <span>3 · Tickets</span>
        </div>}

        <div className="co-body">
          {/* ---------- STEP 1: review ---------- */}
          {step === 1 && <>
            {editable && single ? <>
              <div className="co-field">
                <label>Fare class</label>
                <div className="fareopts">
                  {route0.classes.map((c, i) => (
                    <button key={i} className={"fareopt" + (i === headItem.classIdx ? " on" : "")} onClick={() => setItem({ classIdx: i, className: c.name })}>
                      <span className="fo-radio"></span>
                      <span className="fo-main"><span className="fo-name">{c.name}</span><span className="fo-note">{c.note}</span></span>
                      <span className="fo-price mono">{_money(c.price)}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="co-field">
                <label>Travelers</label>
                <CkStepper label="Adults" value={headItem.adults} min={1} max={8} onChange={v => setItem({ adults: v })} />
                <CkStepper label="Children" sub="50% off where offered" value={headItem.kids} min={0} max={8} onChange={v => setItem({ kids: v })} />
              </div>
            </> : (
              <div className="co-field">
                <label>{items.length} trip{items.length === 1 ? "" : "s"}</label>
                {items.map((it, i) => {
                  const c = RC[it.region] || RC["North America"];
                  return (
                    <div className="co-legrow" key={i}>
                      <span className="lc-dot" style={{ background: c.fg }}></span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="clr-name">{it.name}{it.roundTrip && <span className="rtbadge">⇄ RT</span>}</div>
                        <div className="clr-sub">{_city(it.origin)} → {_city(it.destination)} · {it.className} · {it.adults}A{it.kids ? " " + it.kids + "C" : ""}{it.date ? " · " + _niceDate(it.date) : ""}</div>
                      </div>
                      <span className="clr-price mono">{_money(P.itemPrice(it))}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="co-field">
              <label>Contact email {acct && <span style={{ textTransform: "none", letterSpacing: 0, color: "var(--pine)", fontWeight: 700 }}>· signed in</span>}</label>
              <input className="co-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
              {!acct && <div className="guest-row">Have an account? <button onClick={() => window.Store.openAuth("signin")}>Sign in</button> for saved cards — or continue as guest.</div>}
            </div>
          </>}

          {/* ---------- STEP 2: payment (Stripe-style) ---------- */}
          {step === 2 && <>
            <div className="pay-paying">Paying as <b>{email || "guest"}</b>{!acct && <button className="pp-link" onClick={() => window.Store.openAuth("signin")}>Sign in</button>}</div>

            {stripeBackend ? (
              <div style={{padding: "18px 16px", border: "1px dashed var(--line)", borderRadius: "var(--r)", background: "var(--surface)", margin: "8px 0 14px", lineHeight: 1.45}}>
                <div style={{display: "flex", alignItems: "center", gap: 9, marginBottom: 6}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
                  <b>Secure payment on Stripe</b>
                </div>
                <div style={{fontSize: 13.5, color: "var(--ink-soft)"}}>
                  Click <b>Pay {_money(totals.total)}</b> below to continue to Stripe's hosted checkout page. You'll enter your card there and be returned here when payment completes. <b>Test mode</b> — use card <span className="mono">4242 4242 4242 4242</span>, any future expiry, any CVC.
                </div>
              </div>
            ) : (<>
            <button className="link-express" onClick={() => pay(true)} disabled={processing}>
              <span className="le-badge">link</span> Pay instantly with Link
            </button>
            <div className="pay-or"><span>Or pay with card</span></div>

            {acct && acct.cards.length > 0 && <div className="saved-cards">
              {acct.cards.map(c => (
                <button key={c.id} className={"saved-card" + (pm === c.id ? " on" : "")} onClick={() => setPm(c.id)}>
                  <span className="sc-radio"></span>
                  <window.BrandMark brand={c.brand} size={32} />
                  <span className="sc-num">···· {c.last4}</span><span className="sc-exp">{c.exp}</span>
                </button>
              ))}
              <button className={"saved-card newcard" + (pm === "new" ? " on" : "")} onClick={() => setPm("new")}>
                <span className="sc-radio"></span><span className="sc-plus">＋</span> Use a new card
              </button>
            </div>}

            {usingNew && <div className="pay-card-wrap">
              <input className="co-input" placeholder="Cardholder name" value={card.name} onChange={e => setCard({ ...card, name: e.target.value })} style={{ marginBottom: 9 }} />
              <div className="pay-card">
                <div className="pc-row pc-num">
                  <input inputMode="numeric" placeholder="1234 1234 1234 1234" value={card.num} onChange={e => setCard({ ...card, num: fmtCardNum(e.target.value) })} />
                  <window.BrandMark brand={brand} size={30} />
                </div>
                <div className="pc-row pc-split">
                  <input inputMode="numeric" placeholder="MM / YY" value={card.exp} onChange={e => setCard({ ...card, exp: fmtExp(e.target.value) })} />
                  <input inputMode="numeric" placeholder="CVC" value={card.cvc} onChange={e => setCard({ ...card, cvc: _digits(e.target.value).slice(0, 4) })} />
                  <input inputMode="numeric" placeholder="ZIP" value={card.zip} onChange={e => setCard({ ...card, zip: _digits(e.target.value).slice(0, 5) })} />
                </div>
              </div>
              {acct ? (
                <label className="pay-check"><input type="checkbox" checked={saveCard} onChange={e => setSaveCard(e.target.checked)} /> Save this card to my account</label>
              ) : (
                <label className="pay-check"><input type="checkbox" checked={createAcct} onChange={e => setCreateAcct(e.target.checked)} /> Save my info & create an account</label>
              )}
              {!acct && createAcct && <input className="co-input" type="password" placeholder="Choose a password" value={acctPw} onChange={e => setAcctPw(e.target.value)} style={{ marginTop: 9 }} />}
            </div>}

            <div className="pay-secure"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>Payments secured by <b>Stripe</b> · test mode — no real charge.</div>
            </>)}
          </>}

          {/* ---------- STEP 3: confirmation ---------- */}
          {step === 3 && conf && <div className="ticket">
            <div className="tk-check"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6" /></svg></div>
            {conf.stripe ? (
              <div className="tk-conf">
                Stripe session <strong className="mono">{(conf.code || "").slice(0, 24)}…</strong>
                {conf.amountTotalCents != null && (
                  <> · charged <strong>${(conf.amountTotalCents / 100).toFixed(2)} {(conf.currency || "usd").toUpperCase()}</strong></>
                )}
                {" · "}{conf.livemode ? <strong style={{color: "var(--rust)"}}>LIVE MODE</strong> : <span>test mode — no real charge</span>}
                {email && <> · emailed to <strong>{email}</strong></>}
              </div>
            ) : (
              <div className="tk-conf">Confirmation <strong className="mono">{conf.code}</strong> · emailed to {email || "you"}{conf.mock && <> · <span style={{color: "var(--ink-faint)"}}>mock</span></>}</div>
            )}
            {conf.tickets.map((tk, i) => (
              <div className="tk-stub" key={tk.id} style={{ marginBottom: 10 }}>
                <div className="tk-route"><span className="serif">{tk.route.split(" → ")[0]}</span><svg width="24" height="13" viewBox="0 0 26 14" fill="none" stroke={headColor.fg} strokeWidth="2" strokeLinecap="round"><path d={tk.roundTrip ? "M1 5h22M18 1l5 4-5 4M25 9H3M8 13l-5-4 5-4" : "M1 7h22M18 2l5 5-5 5"} /></svg><span className="serif">{tk.route.split(" → ")[1]}</span></div>
                <div className="tk-grid">
                  <div><span className="tk-k">Train</span><span className="tk-v">{tk.name}</span></div>
                  <div><span className="tk-k">Class</span><span className="tk-v">{tk.className}</span></div>
                  <div><span className="tk-k">Coach</span><span className="tk-v mono">{tk.coach}</span></div>
                  <div><span className="tk-k">Seat</span><span className="tk-v mono">{tk.seat}</span></div>
                </div>
              </div>
            ))}
            <div className="tk-stub">
              <div className="tk-paid"><span>Total paid</span><strong className="mono">{_money(totals.total)}</strong></div>
              <div className="tk-fee">includes {_money(totals.fee)} Choo Choo Chooser service fee{s.state.account ? " · receipt saved to your account" : ""}</div>
            </div>
          </div>}
        </div>

        {/* ---------- footer ---------- */}
        {step < 3 ? (
          <div className="co-foot">
            <div className="co-breakdown">
              <div className="bd-row"><span>{single ? "Fare" : items.length + " trips"}{single && (headItem.adults + headItem.kids) > 1 ? " × " + (headItem.adults + headItem.kids) : ""}</span><span className="mono">{_money(totals.subtotal)}</span></div>
              <div className="bd-row"><span className="bd-fee">Service fee (5%) <span className="bd-info" title="How we keep search free">ⓘ</span></span><span className="mono">{_money(totals.fee)}</span></div>
              <div className="bd-row bd-total"><span>Total</span><span className="mono">{_money(totals.total)}</span></div>
            </div>
            {step === 1 && <button className="co-cta" disabled={!emailValid} onClick={() => setStep(2)}>Continue to payment</button>}
            {step === 2 && <button className="co-cta" disabled={!payReady || processing} onClick={() => pay(false)}>{processing ? <span className="co-spin"></span> : "Pay " + _money(totals.total)}</button>}
            {step === 2 && <button className="co-back" onClick={() => setStep(1)} disabled={processing}>← Back to review</button>}
          </div>
        ) : (
          <div className="co-foot"><button className="co-cta" onClick={() => { onDone && onDone(); onClose(); }}>Done</button></div>
        )}
      </div>
    </div>
  );
}
window.Checkout = Checkout;

/* CheckoutHost — mounts Checkout from the store's UI flag */
function CheckoutHost() {
  const s = useStore();
  const ck = s.state.ui.checkout;
  if (!ck) return null;
  return <Checkout items={ck.items} opts={ck.opts} onClose={() => s.closeCheckout()} onDone={() => {}} />;
}
window.CheckoutHost = CheckoutHost;

// ============================================================
// === detail.jsx
// ============================================================
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
  const buyNow = (classIdx) => {
    const url = window.bookingUrl && window.bookingUrl(route);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      window.Store.openCheckout([mkItem(classIdx)], { editable: true });
    }
  };

  const scene = route.scenes[shot] || route.scenes[0];
  const opColor = window.routeColor(route);

  return (
    <div className="scrim" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="detail" data-screen-label="Route detail">
        <button className="detail-close" onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>

        <div className="hero">
          <RouteHero route={route} sceneType={scene.type} />
          <div className="hero-grad"></div>
          {!hasRouteImage(route) && (
            <div className="thumbs">
              {route.scenes.map((s, i) => (
                <button key={i} className={i === shot ? "on" : ""} onClick={() => setShot(i)} aria-label={s.caption}><Scene type={s.type} vignette={false} /></button>
              ))}
            </div>
          )}
          <div className="hero-info">
            <span className="opbadge" style={{ background: opColor.bg, color: opColor.fg }}><span className="opdot" style={{ background: opColor.fg }}></span>{route.operator}</span>
            <h1>{route.name}</h1>
            <div className="htag">{route.tag} · {route.frequency}</div>
          </div>
        </div>
        <div className="caption">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="12" cy="12" r="3.2" /><path d="M8 5l1.5-2h5L16 5" /></svg>
          {scene.caption}{" "}
          {hasRouteImage(route) ? (
            <span style={{ color: "var(--ink-faint)", fontWeight: 500 }}>
              · photo via{" "}
              <a href={window.ROUTE_IMAGES[route.id].source_page} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>
                Wikipedia / Commons
              </a>
            </span>
          ) : (
            <span style={{ color: "var(--ink-faint)", fontWeight: 500 }}>· representative scenery placeholder</span>
          )}
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

        <div style={{padding: "0 24px 6px", fontSize: 11.5, color: "var(--ink-faint)", display: "flex", alignItems: "center", gap: 6}}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><path d="M14 4h6v6M20 4l-8 8"/></svg>
          Booking happens on {route.operator}'s site. Prices, availability, and fees are theirs. We may earn a commission.
        </div>
        <div className="bookbar">
          <div className="bb-price">{roundTrip ? "Round trip from" : "Fares from"}<strong>${commas(roundTrip ? Math.round(route.priceFrom * 2 * 0.9) : route.priceFrom)}</strong></div>
          <button className="bb-add" onClick={() => addToCart(0)}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h3l2.5 13h11l2.5-9H6" /></svg>Save to trip</button>
          {(() => {
            const url = window.bookingUrl && window.bookingUrl(route);
            const label = window.bookingLabel ? window.bookingLabel(route) : ("Book on " + route.operator);
            return url ? (
              <a className="bb-cta" href={url} target="_blank" rel="noopener noreferrer sponsored" style={{textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8}}>
                {label}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4h6v6M20 4l-8 8M10 4H4v16h16v-6"/></svg>
              </a>
            ) : (
              <button className="bb-cta" onClick={() => buyNow(0)}>{roundTrip ? "Book round trip" : "Book now"}</button>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

window.Detail = Detail;

// ============================================================
// === app.jsx
// ============================================================
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
        <RouteHero route={route} />
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

  // ?route=<id> deep link — landing from sitemap / SEO / shared URL opens the
  // matching route's Detail panel and updates the document title for indexability.
  useEffect(() => {
    const url = new URL(window.location.href);
    const id = url.searchParams.get("route");
    if (!id || !window.RAIL) return;
    const r = window.RAIL.routes.find((x) => x.id === id);
    if (r) {
      setOpen(r);
      document.title = `${r.name} — ${r.origin} → ${r.destination} · Choo Choo Chooser`;
    }
  }, []);

  // Return-from-Stripe: if the URL has ?session_id=cs_test_..., fetch the
  // session from the Worker, clear the cart, and open the Checkout component
  // pre-loaded onto its confirmation step with the real Stripe details.
  useEffect(() => {
    const url = new URL(window.location.href);
    const sessionId = url.searchParams.get("session_id");
    const cancelled = url.searchParams.get("checkout") === "cancelled";
    if (cancelled) {
      url.searchParams.delete("checkout");
      window.history.replaceState({}, "", url.pathname + (url.search ? url.search : "") + url.hash);
      window.Store.toast("Checkout cancelled");
      return;
    }
    if (!sessionId || !window.CHECKOUT_API_ENABLED) return;
    let cancelledFlag = false;
    (async () => {
      try {
        const base = (window.CHECKOUT_API_URL || "").replace(/\/$/, "");
        const r = await fetch(base + "/api/session/" + encodeURIComponent(sessionId));
        const j = await r.json();
        if (cancelledFlag) return;
        if (!r.ok) throw new Error(j.error || "session lookup failed");
        let pending = null;
        try { pending = JSON.parse(sessionStorage.getItem("ccc_pending_checkout") || "null"); } catch {}
        // Reconstruct the items the Checkout component expects.
        const items = (pending && pending.items) || [];
        if (j.payment_status === "paid") {
          if (pending && pending.fromCart) window.Store.clearCart();
          window.Store.openCheckout(items, {
            returnedSession: {
              id: j.id,
              email: j.customer_email,
              paymentIntent: j.payment_intent,
              amountTotal: j.amount_total,
              currency: j.currency,
              livemode: j.livemode,
            },
            fromCart: !!(pending && pending.fromCart),
          });
          sessionStorage.removeItem("ccc_pending_checkout");
        } else {
          window.Store.toast("Payment " + (j.payment_status || "incomplete"));
        }
      } catch (e) {
        window.Store.toast("Checkout return error: " + e.message);
      } finally {
        url.searchParams.delete("session_id");
        window.history.replaceState({}, "", url.pathname + (url.search ? url.search : "") + url.hash);
      }
    })();
    return () => { cancelledFlag = true; };
  }, []);

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
          <a className="iconbtn" href="./mapviewer.html" style={{ textDecoration: "none" }} title="Open the full map viewer">
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
            <Planner stops={stops} all={all} legSel={legSel} setLegSel={setLegSel} onOpen={setOpen} onBook={(legs) => {
              let openedAny = false;
              legs.forEach((l) => {
                const url = window.bookingUrl && window.bookingUrl(l.route);
                if (url) { window.open(url, "_blank", "noopener,noreferrer"); openedAny = true; }
              });
              if (openedAny && legs.length > 1) window.Store.toast("Opened " + legs.length + " operator tabs");
              else if (!openedAny) window.Store.toast("No bookable legs in this plan");
            }} />
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
      <AffiliateDisclosureFooter />

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



// ESM bridge — main.jsx imports App from here.
export { App };
