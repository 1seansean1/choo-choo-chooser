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
              <div className="cart-line"><span>Subtotal</span><span className="mono">{window.money(totals.subtotal)}</span></div>
              <div className="cart-line"><span>Service fee (5%)</span><span className="mono">{window.money(totals.fee)}</span></div>
              <div className="cart-line total"><span>Total</span><span className="mono">{window.money(totals.total)}</span></div>
              <button className="cart-checkout" onClick={() => s.openCheckout(cart.map(c => ({ ...c })), { fromCart: true })}>Checkout · {window.money(totals.total)}</button>
              <button className="cart-clear" onClick={() => s.clearCart()}>Clear cart</button>
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
