/* FTC Manager — core: namespace, RNG, helpers, save system */
(function (root) {
  'use strict';
  const G = (root.FTC = { VERSION: '0.6.0' });
  const SAVE_KEY = 'ftc-manager-save-v4';

  /** Small seeded PRNG (mulberry32). Returns a function producing floats in [0,1). */
  G.Rng = function (seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  /** Career RNG: its seed lives in the save so reloading doesn't reroll the world. */
  G.rand = function () {
    const st = G.state;
    st.seed = (st.seed + 0x6d2b79f5) >>> 0;
    let t = st.seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const U = (G.U = {});
  U.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  U.rint = (a, b, r) => a + Math.floor((r || G.rand)() * (b - a + 1));
  U.pick = (arr, r) => arr[Math.floor((r || G.rand)() * arr.length)];
  /** Roughly normal value in [-1,1]. */
  U.bell = (r) => { r = r || G.rand; return (r() + r() + r()) / 1.5 - 1; };
  U.shuffle = (arr, r) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor((r || G.rand)() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  U.money = (n) => (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString('en-US');
  U.avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  U.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const store = () => { try { return root.localStorage || null; } catch (e) { return null; } };
  G.save = function () {
    const s = store();
    if (!s || !G.state) return false;
    try { s.setItem(SAVE_KEY, JSON.stringify(G.state)); return true; } catch (e) { return false; }
  };
  G.load = function () {
    const s = store();
    if (!s) return false;
    try {
      const raw = s.getItem(SAVE_KEY);
      if (!raw) return false;
      const st = JSON.parse(raw);
      if (!st || st.v !== 4) return false;
      G.state = st;
      return true;
    } catch (e) { return false; }
  };
  G.hasSave = function () { const s = store(); try { return !!(s && s.getItem(SAVE_KEY)); } catch (e) { return false; } };
  G.wipe = function () { const s = store(); if (s) s.removeItem(SAVE_KEY); };
})(typeof window !== 'undefined' ? window : globalThis);
