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
