/* store.jsx — global app store: shopping cart, account, saved cards, UI flags.
   Persisted to localStorage. Components subscribe via window.useStore(). */
(function () {
  const KEY = "ccc_store_v1";
  const SERVICE_FEE_PCT = 0.05, FEE_MIN = 0.50, ROUND_TRIP_SAVER = 0.10;

  const Store = {
    state: {
      cart: [],
      account: null,        // { name, email, cards: [{id,brand,last4,exp,name}] }
      ui: { cartOpen: false, authOpen: false, authMode: "signin", checkout: null, toast: null },
    },
    listeners: new Set(),

    load() {
      try {
        const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
        if (raw.cart) this.state.cart = raw.cart;
        if (raw.account) this.state.account = raw.account;
      } catch (e) {}
    },
    save() {
      try { localStorage.setItem(KEY, JSON.stringify({ cart: this.state.cart, account: this.state.account })); } catch (e) {}
    },
    emit() { this.listeners.forEach(l => l()); },
    _changed() { this.save(); this.emit(); },

    addToCart(item) {
      item.id = "ci_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      this.state.cart.push(item);
      this.toast(item.roundTrip ? "Added round trip to cart" : "Added to cart");
      this._changed();
    },
    updateItem(id, patch) {
      const it = this.state.cart.find(c => c.id === id);
      if (it) Object.assign(it, patch);
      this._changed();
    },
    removeFromCart(id) { this.state.cart = this.state.cart.filter(c => c.id !== id); this._changed(); },
    clearCart() { this.state.cart = []; this._changed(); },

    createAccount(name, email, card, prefsText) {
      this.state.account = { name: name || (email || "").split("@")[0], email, cards: card ? [card] : [], prefsText: prefsText || "", prefs: null, prefsBuilding: false, dismissed: [] };
      this._changed();
      if (prefsText && prefsText.trim()) this.buildPreferences(prefsText);
    },
    signIn(email) {
      this.state.account = {
        name: (email || "alex@example.com").split("@")[0].replace(/\b\w/g, c => c.toUpperCase()),
        email: email || "alex@example.com",
        cards: [{ id: "pm_demo", brand: "visa", last4: "4242", exp: "08/29", name: "A. Rivera" }],
      };
      this._changed();
    },
    signOut() { this.state.account = null; this._changed(); },
    addCard(card) {
      if (!this.state.account) return;
      card.id = "pm_" + Math.random().toString(36).slice(2, 8);
      this.state.account.cards.push(card);
      this._changed();
    },
    removeCard(id) {
      if (!this.state.account) return;
      this.state.account.cards = this.state.account.cards.filter(c => c.id !== id);
      this._changed();
    },

    // ----- preferences (backend-style: LLM parses free text into filters + notices) -----
    async buildPreferences(text) {
      const acct = this.state.account;
      if (!acct || !text || !text.trim()) return;
      acct.prefsBuilding = true; this.emit();
      let prefs = null;
      try { prefs = await this._llmPrefs(text); } catch (e) { prefs = null; }
      if (!prefs) prefs = this._heuristicPrefs(text);
      prefs.notices = this._notices(prefs);
      if (this.state.account === acct) { acct.prefs = prefs; acct.prefsBuilding = false; acct.prefsApplied = false; this._changed(); }
    },
    _catalogFacets() {
      const R = window.RAIL.routes;
      return {
        regions: window.RAIL.regions.slice(),
        providers: [...new Set(R.map(r => r.operator))],
        categories: [...new Set(R.map(r => r.category))],
      };
    },
    async _llmPrefs(text) {
      if (!window.claude || !window.claude.complete) throw new Error("no llm");
      const f = this._catalogFacets();
      const prompt =
        "You are a backend preference parser for a global train booking site. Convert the traveler's free-text preferences into compact JSON ONLY (no prose, no markdown).\n" +
        "Allowed regions: " + JSON.stringify(f.regions) + "\n" +
        "Allowed providers: " + JSON.stringify(f.providers) + "\n" +
        "Allowed categories: " + JSON.stringify(f.categories) + "\n" +
        'Output keys: regions (array subset), providers (array subset), categories (array subset), maxPrice (number USD or null), scenicOnly (boolean), interests (array of 2-5 short lowercase keywords describing what they love).\n' +
        'Only include values clearly implied by the text. Traveler text: """' + text.slice(0, 600) + '"""\nJSON:';
      const raw = await window.claude.complete(prompt);
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("no json");
      const j = JSON.parse(m[0]);
      const f2 = this._catalogFacets();
      const keep = (arr, allow) => Array.isArray(arr) ? arr.filter(x => allow.includes(x)) : [];
      return {
        regions: keep(j.regions, f2.regions),
        providers: keep(j.providers, f2.providers),
        categories: keep(j.categories, f2.categories),
        maxPrice: typeof j.maxPrice === "number" && j.maxPrice > 0 ? j.maxPrice : null,
        scenicOnly: !!j.scenicOnly,
        interests: Array.isArray(j.interests) ? j.interests.slice(0, 6).map(s => String(s).toLowerCase()) : [],
        source: "ai",
      };
    },
    _heuristicPrefs(text) {
      const t = (text || "").toLowerCase();
      const f = this._catalogFacets();
      const regions = f.regions.filter(r => { const n = r.toLowerCase(); return t.includes(n) || (n.includes("north america") && /(usa|america|states|canada)/.test(t)) || (n === "europe" && /europe|alps|swiss|france|italy|spain|norway/.test(t)) || (n === "asia" && /asia|japan|china|india|korea|vietnam|tibet/.test(t)); });
      const providers = f.providers.filter(p => t.includes(p.toLowerCase()));
      const categories = f.categories.filter(c => t.includes(c.toLowerCase().replace("-", " ")) || t.includes(c.toLowerCase()));
      if (/scenic|view|mountain|panoram|landscape|beautiful/.test(t) && !categories.includes("Scenic")) categories.push("Scenic");
      if (/luxury|luxe|first class|premium/.test(t) && !categories.includes("Luxury")) categories.push("Luxury");
      if (/sleeper|overnight|night train|night-train/.test(t) && !categories.includes("Sleeper")) categories.push("Sleeper");
      if (/fast|high.?speed|bullet|quick/.test(t) && !categories.includes("High-speed")) categories.push("High-speed");
      const pm = t.match(/\$?\s?(\d{2,5})/);
      const maxPrice = /under|below|less than|budget|max|cheap|\bunder\b/.test(t) && pm ? +pm[1] : null;
      const scenicOnly = /scenic|most scenic|views|mountain/.test(t);
      const interests = [];
      ["scenic", "mountain", "luxury", "high-speed", "sleeper", "coastal", "historic", "night train", "budget"].forEach(k => { if (t.includes(k.split(" ")[0])) interests.push(k); });
      return { regions, providers, categories, maxPrice, scenicOnly, interests: interests.slice(0, 6), source: "heuristic" };
    },
    _notices(prefs) {
      const R = window.RAIL.routes;
      const out = [];
      const matches = r => {
        if (prefs.regions.length && !prefs.regions.includes(r.region)) return false;
        if (prefs.providers.length && !prefs.providers.includes(r.operator)) return false;
        if (prefs.categories.length && !prefs.categories.includes(r.category)) return false;
        if (prefs.scenicOnly && r.scenicScore < 70) return false;
        if (prefs.maxPrice && r.priceFrom > prefs.maxPrice) return false;
        return true;
      };
      const any = prefs.regions.length || prefs.providers.length || prefs.categories.length || prefs.scenicOnly || prefs.maxPrice;
      R.forEach(r => {
        if (any && !matches(r)) return;
        const best = (r.discounts || []).filter(d => d.pct > 0).sort((a, b) => b.pct - a.pct)[0];
        if (!best) return;
        out.push({ id: r.id + "_" + best.pct, routeId: r.id, name: r.name, region: r.region,
          origin: r.origin, destination: r.destination, pct: best.pct, deal: best.name,
          score: best.pct + (prefs.scenicOnly ? r.scenicScore / 10 : 0) });
      });
      return out.sort((a, b) => b.score - a.score).slice(0, 6);
    },
    dismissNotice(id) { const a = this.state.account; if (!a) return; a.dismissed = [...(a.dismissed || []), id]; this._changed(); },
    markPrefsApplied() { if (this.state.account) { this.state.account.prefsApplied = true; this.save(); } },

    openCart() { this.state.ui.cartOpen = true; this.emit(); },
    closeCart() { this.state.ui.cartOpen = false; this.emit(); },
    openAuth(mode) { this.state.ui.authMode = mode || "signin"; this.state.ui.authOpen = true; this.emit(); },
    closeAuth() { this.state.ui.authOpen = false; this.emit(); },
    openCheckout(items, opts) { this.state.ui.checkout = { items, opts: opts || {} }; this.state.ui.cartOpen = false; this.emit(); },
    closeCheckout() { this.state.ui.checkout = null; this.emit(); },
    toast(msg) {
      this.state.ui.toast = { msg, t: Date.now() };
      this.emit();
      clearTimeout(this._toastT);
      this._toastT = setTimeout(() => { this.state.ui.toast = null; this.emit(); }, 2200);
    },
  };

  Store.load();
  window.Store = Store;

  function routeById(id) { return window.RAIL.routes.find(r => r.id === id); }
  function legBase(route, classIdx, adults, kids) {
    if (!route) return 0;
    const base = route.classes[Math.min(classIdx, route.classes.length - 1)].price;
    const hasKid = route.discounts.some(d => /kid|child/i.test(d.name));
    return base * (adults || 1) + base * (kids || 0) * (hasKid ? 0.5 : 1);
  }
  function itemPrice(it) {
    const r = it.route || routeById(it.routeId);
    let one = legBase(r, it.classIdx, it.adults, it.kids);
    if (it.roundTrip) return +(one * 2 * (1 - ROUND_TRIP_SAVER)).toFixed(2);
    return +one.toFixed(2);
  }
  function cartTotals(items) {
    const subtotal = items.reduce((s, it) => s + itemPrice(it), 0);
    const fee = items.length ? Math.max(FEE_MIN, +(subtotal * SERVICE_FEE_PCT).toFixed(2)) : 0;
    return { subtotal: +subtotal.toFixed(2), fee, total: +(subtotal + fee).toFixed(2) };
  }
  window.CCCPrice = { itemPrice, cartTotals, legBase, routeById, SERVICE_FEE_PCT, ROUND_TRIP_SAVER, FEE_MIN };
  window.money = n => "$" + (n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
})();

function useStore() {
  const [, force] = React.useState(0);
  React.useEffect(() => {
    const l = () => force(x => x + 1);
    window.Store.listeners.add(l);
    return () => window.Store.listeners.delete(l);
  }, []);
  return window.Store;
}
window.useStore = useStore;
