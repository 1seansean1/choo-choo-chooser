// store.js — global app store (cart, account, UI flags) extracted from store.jsx.
// Production version uses pricing.js, preferences.js as importable libs.

import React from "react";
import { catalogFacets, heuristicPrefs, llmPrefs, notices } from "./preferences.js";
import { itemPrice, cartTotals, legBase, routeById, money } from "./pricing.js";

const KEY = "ccc_store_v1";

export function createStore(routes, regions, llm) {
  const store = {
    state: {
      cart: [],
      account: null,
      ui: { cartOpen: false, authOpen: false, authMode: "signin", checkout: null, toast: null },
    },
    listeners: new Set(),

    load() {
      try {
        const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
        if (raw.cart) this.state.cart = raw.cart;
        if (raw.account) this.state.account = raw.account;
      } catch {}
    },
    save() {
      try {
        localStorage.setItem(KEY, JSON.stringify({ cart: this.state.cart, account: this.state.account }));
      } catch {}
    },
    emit() { this.listeners.forEach((l) => l()); },
    _changed() { this.save(); this.emit(); },

    addToCart(item) {
      item.id = "ci_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      this.state.cart.push(item);
      this.toast(item.roundTrip ? "Added round trip to cart" : "Added to cart");
      this._changed();
    },
    updateItem(id, patch) {
      const it = this.state.cart.find((c) => c.id === id);
      if (it) Object.assign(it, patch);
      this._changed();
    },
    removeFromCart(id) { this.state.cart = this.state.cart.filter((c) => c.id !== id); this._changed(); },
    clearCart() { this.state.cart = []; this._changed(); },

    createAccount(name, email, card, prefsText) {
      this.state.account = {
        name: name || (email || "").split("@")[0],
        email,
        cards: card ? [card] : [],
        prefsText: prefsText || "",
        prefs: null,
        prefsBuilding: false,
        dismissed: [],
      };
      this._changed();
      if (prefsText && prefsText.trim()) this.buildPreferences(prefsText);
    },
    signIn(email) {
      this.state.account = {
        name: (email || "alex@example.com").split("@")[0].replace(/\b\w/g, (c) => c.toUpperCase()),
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
      this.state.account.cards = this.state.account.cards.filter((c) => c.id !== id);
      this._changed();
    },

    async buildPreferences(text) {
      const acct = this.state.account;
      if (!acct || !text || !text.trim()) return;
      acct.prefsBuilding = true; this.emit();
      const facets = catalogFacets(routes, regions);
      let prefs = null;
      try { prefs = await llmPrefs(text, facets, llm); } catch { prefs = null; }
      if (!prefs) prefs = heuristicPrefs(text, facets);
      prefs.notices = notices(prefs, routes);
      if (this.state.account === acct) {
        acct.prefs = prefs;
        acct.prefsBuilding = false;
        acct.prefsApplied = false;
        this._changed();
      }
    },
    dismissNotice(id) {
      const a = this.state.account; if (!a) return;
      a.dismissed = [...(a.dismissed || []), id]; this._changed();
    },
    markPrefsApplied() {
      if (this.state.account) { this.state.account.prefsApplied = true; this.save(); }
    },

    openCart() { this.state.ui.cartOpen = true; this.emit(); },
    closeCart() { this.state.ui.cartOpen = false; this.emit(); },
    openAuth(mode) { this.state.ui.authMode = mode || "signin"; this.state.ui.authOpen = true; this.emit(); },
    closeAuth() { this.state.ui.authOpen = false; this.emit(); },
    openCheckout(items, opts) {
      this.state.ui.checkout = { items, opts: opts || {} };
      this.state.ui.cartOpen = false; this.emit();
    },
    closeCheckout() { this.state.ui.checkout = null; this.emit(); },
    toast(msg) {
      this.state.ui.toast = { msg, t: Date.now() };
      this.emit();
      clearTimeout(this._toastT);
      this._toastT = setTimeout(() => { this.state.ui.toast = null; this.emit(); }, 2200);
    },
  };

  store.load();
  return store;
}

export function makeUseStore(store) {
  return function useStore() {
    const [, force] = React.useState(0);
    React.useEffect(() => {
      const l = () => force((x) => x + 1);
      store.listeners.add(l);
      return () => store.listeners.delete(l);
    }, []);
    return store;
  };
}

export const CCCPrice = { itemPrice, cartTotals, legBase, routeById };
export { money };
