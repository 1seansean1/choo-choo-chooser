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

  const [items, setItems] = React.useState(() => inItems.map(it => ({ ...it })));
  const [step, setStep] = React.useState(1);
  const [email, setEmail] = React.useState(acct ? acct.email : "");
  const [pm, setPm] = React.useState(acct && acct.cards.length ? acct.cards[0].id : "new");
  const [card, setCard] = React.useState({ name: "", num: "", exp: "", cvc: "", zip: "" });
  const [saveCard, setSaveCard] = React.useState(!!acct);
  const [createAcct, setCreateAcct] = React.useState(false);
  const [acctPw, setAcctPw] = React.useState("");
  const [processing, setProcessing] = React.useState(false);
  const [conf, setConf] = React.useState(null);

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
  const payReady = emailValid && (!usingNew || cardValid) && (!createAcct || acctPw.length >= 4);

  const fmtCardNum = v => _digits(v).slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const fmtExp = v => { const d = _digits(v).slice(0, 4); return d.length >= 3 ? d.slice(0, 2) + "/" + d.slice(2) : d; };

  // editing the single item (buy-now)
  function setItem(patch) { setItems([{ ...items[0], ...patch }]); }
  const route0 = headItem.route || P.routeById(headItem.routeId);

  function pay(viaLink) {
    setProcessing(true);
    setTimeout(() => {
      const tickets = items.map(it => ({
        id: it.id || Math.random().toString(36).slice(2),
        name: it.name, route: _city(it.origin) + " → " + _city(it.destination),
        coach: String.fromCharCode(65 + Math.floor(Math.random() * 6)) + Math.ceil(Math.random() * 14),
        seat: Math.ceil(Math.random() * 60) + "ABCD"[Math.floor(Math.random() * 4)],
        roundTrip: it.roundTrip, className: it.className,
      }));
      const code = "CCC-" + Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Math.floor(1000 + Math.random() * 9000);
      // save card / create account
      const newCard = usingNew && cardValid ? { brand, last4: _digits(card.num).slice(-4), exp: card.exp, name: card.name } : null;
      if (viaLink && !acct) { /* link express: nothing persisted */ }
      if (createAcct && !acct && emailValid) window.Store.createAccount(card.name || email.split("@")[0], email, newCard);
      else if (saveCard && acct && newCard) window.Store.addCard(newCard);
      if (fromCart) window.Store.clearCart();
      setConf({ code, tickets });
      setProcessing(false); setStep(3);
    }, 1500);
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
          </>}

          {/* ---------- STEP 3: confirmation ---------- */}
          {step === 3 && conf && <div className="ticket">
            <div className="tk-check"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6" /></svg></div>
            <div className="tk-conf">Confirmation <strong className="mono">{conf.code}</strong> · emailed to {email || "you"}</div>
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
