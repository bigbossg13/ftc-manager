/* FTC Manager — events: schedule, rankings, alliance selection, playoffs, awards */
(function (G) {
  'use strict';
  const U = G.U, D = G.Data;
  const E = (G.Event = {});
  const SLOTS = { qual: 6, regional: 5, worlds: 0 };
  const ROUNDS = { qual: 5, regional: 6, worlds: 6 };

  /** entries: [{ id, num, name, perf?, port, out, isPlayer? }], count divisible by 4 */
  E.create = function (type, name, entries) {
    const ev = { type, name, teams: entries, stage: 'quals', mi: 0, schedule: [], stats: {}, feed: [],
      sel: null, alliances: null, series: null, awards: null, advancing: [], summary: null, playerPick: null };
    entries.forEach((t) => { ev.stats[t.id] = { w: 0, l: 0, t: 0, rp: 0, pf: 0, n: 0, contrib: 0 }; });
    const ids = entries.map((t) => t.id);
    let n = 1;
    for (let r = 0; r < ROUNDS[type]; r++) {
      const s = U.shuffle(ids);
      for (let i = 0; i < s.length; i += 4) ev.schedule.push({ kind: 'qual', label: 'Qualification ' + n++, red: [s[i], s[i + 1]], blue: [s[i + 2], s[i + 3]], res: null });
    }
    return ev;
  };

  E.team = (ev, id) => ev.teams.find((t) => t.id === id);
  E.hasPlayer = (m) => m.red.concat(m.blue).includes('P');
  E.avg = (ev, id) => { const s = ev.stats[id]; return s.n ? s.contrib / s.n : 0; };

  function entry(ev, id, plan) {
    const t = E.team(ev, id);
    return { id, num: t.num, name: t.name, isPlayer: !!t.isPlayer, perf: t.isPlayer ? G.Career.playerPerf() : t.perf, plan: t.isPlayer ? plan : null };
  }

  /** Build a live match object for a schedule/playoff entry. */
  E.build = function (ev, m, plan) {
    return G.Match.create(D.game(G.state.game), m.red.map((id) => entry(ev, id, plan)), m.blue.map((id) => entry(ev, id, plan)), Math.floor(G.rand() * 4294967296));
  };

  /** Record a finished match and move the event forward. */
  E.complete = function (ev, m, res) {
    m.res = { r: res.r, b: res.b };
    if (m.kind === 'qual') {
      [m.red, m.blue].forEach((al, side) => al.forEach((id) => {
        const s = ev.stats[id], mine = side ? res.b : res.r, theirs = side ? res.r : res.b;
        s.n++; s.pf += mine; s.contrib += res.contrib[id];
        if (mine > theirs) { s.w++; s.rp += 2; } else if (mine < theirs) s.l++; else { s.t++; s.rp += 1; }
      }));
      ev.mi++;
    } else {
      const s = ev.series[m.series];
      if (res.winner === 0) s.wa++; else if (res.winner === 1) s.wb++;
      s.games.push(m.res);
      if (s.wa === 2 || s.wb === 2) {
        const w = s.wa === 2 ? s.a : s.b;
        ev.feed.push(s.name + ': Alliance ' + (w + 1) + ' wins ' + Math.max(s.wa, s.wb) + '-' + Math.min(s.wa, s.wb));
      }
    }
  };

  E.rankings = function (ev) {
    return ev.teams.map((t) => t.id).sort((a, b) => {
      const x = ev.stats[a], y = ev.stats[b];
      return y.rp - x.rp || y.pf / (y.n || 1) - x.pf / (x.n || 1) || y.contrib - x.contrib;
    });
  };

  const taken = (ev) => [].concat.apply([], ev.sel.alliances);

  function selectStep(ev) {
    const sel = ev.sel;
    while (sel.alliances.length < 4) {
      const used = taken(ev);
      const cap = sel.order.find((id) => !used.includes(id));
      const avail = sel.order.filter((id) => id !== cap && !used.includes(id));
      let pick;
      if (cap === 'P') {
        if (!ev.playerPick) return { need: 'pick', options: avail, seed: sel.alliances.length + 1 };
        pick = ev.playerPick; ev.playerPick = null;
      } else {
        // Captains scout by average contribution, imperfectly.
        let best = -1;
        avail.forEach((id) => { const v = (E.avg(ev, id) + 3) * (0.8 + 0.4 * G.rand()); if (v > best) { best = v; pick = id; } });
      }
      sel.alliances.push([cap, pick]);
      ev.feed.push('Alliance ' + sel.alliances.length + ': ' + E.team(ev, cap).num + ' selects ' + E.team(ev, pick).num + ' ' + E.team(ev, pick).name);
    }
    return null;
  }

  function nextSeries(ev) {
    const [s1, s2, f] = ev.series;
    const won = (s) => (s.wa === 2 ? s.a : s.wb === 2 ? s.b : -1);
    if (won(s1) < 0) return 0;
    if (won(s2) < 0) return 1;
    if (f.a < 0) { const x = won(s1), y = won(s2); f.a = Math.min(x, y); f.b = Math.max(x, y); }
    return won(f) < 0 ? 2 : -1;
  }

  function awards(ev) {
    const order = E.rankings(ev), n = order.length, done = [];
    const P = G.state.awards;
    const val = (id, k) => { const t = E.team(ev, id); return t.isPlayer ? Math.min(100, P[k === 'port' ? 'portfolio' : 'outreach']) : t[k]; };
    const robot = (id) => { const p = E.team(ev, id).isPlayer ? G.Career.playerPerf() : E.team(ev, id).perf; return (p.speed + p.intake + p.scorer + p.endgame + p.auto + p.rel) / 6; };
    const give = (name, fn) => {
      let best = null, bv = -1;
      order.forEach((id, i) => { if (done.includes(id)) return; const v = fn(id, i) + G.rand() * 6; if (v > bv) { bv = v; best = id; } });
      done.push(best);
      ev.awards.push({ name, id: best });
      ev.feed.push(name + ': ' + E.team(ev, best).num + ' ' + E.team(ev, best).name);
    };
    ev.awards = [];
    give('Inspire Award', (id, i) => 0.36 * val(id, 'port') + 0.34 * val(id, 'out') + 30 * (1 - i / n));
    give('Think Award', (id) => val(id, 'port'));
    give('Connect Award', (id) => val(id, 'out'));
    give('Design Award', (id) => robot(id));

    const f = ev.series[2], win = f.wa === 2 ? f.a : f.b, lose = f.wa === 2 ? f.b : f.a;
    const adv = [ev.awards[0].id].concat(ev.alliances[win], ev.alliances[lose], [ev.awards[1].id], order);
    adv.forEach((id) => { if (ev.advancing.length < SLOTS[ev.type] && !ev.advancing.includes(id)) ev.advancing.push(id); });

    const ai = ev.alliances.findIndex((a) => a.includes('P'));
    const s = ev.stats.P;
    ev.summary = {
      rank: order.indexOf('P') + 1, of: n, record: s.w + '-' + s.l + '-' + s.t, seed: ai + 1,
      result: ai < 0 ? 'Not selected' : ai === win ? 'Winning Alliance' : ai === lose ? 'Finalist' : 'Semifinalist',
      awards: ev.awards.filter((a) => a.id === 'P').map((a) => a.name),
      advanced: ev.advancing.includes('P'),
    };
  }

  /** Simulate until the player has something to do.
      Returns { need: 'match', match } | { need: 'pick', options } | { need: 'done' }. */
  E.advance = function (ev) {
    for (;;) {
      if (ev.stage === 'quals') {
        if (ev.mi >= ev.schedule.length) {
          ev.stage = 'selection';
          ev.sel = { order: E.rankings(ev), alliances: [] };
          ev.feed.push('Qualification matches complete. Alliance selection begins.');
          continue;
        }
        const m = ev.schedule[ev.mi];
        if (E.hasPlayer(m)) return { need: 'match', match: m };
        E.complete(ev, m, G.Match.run(E.build(ev, m)));
      } else if (ev.stage === 'selection') {
        const r = selectStep(ev);
        if (r) return r;
        ev.alliances = ev.sel.alliances;
        ev.series = ['Semifinal 1', 'Semifinal 2', 'Final'].map((name, i) => ({ name, a: [0, 1, -1][i], b: [3, 2, -1][i], wa: 0, wb: 0, games: [] }));
        ev.stage = 'playoffs';
      } else if (ev.stage === 'playoffs') {
        const si = nextSeries(ev);
        if (si < 0) { ev.stage = 'awards'; continue; }
        const s = ev.series[si];
        const m = { kind: 'playoff', series: si, label: s.name + ' - Match ' + (s.games.length + 1), red: ev.alliances[s.a], blue: ev.alliances[s.b], res: null };
        if (E.hasPlayer(m)) return { need: 'match', match: m };
        E.complete(ev, m, G.Match.run(E.build(ev, m)));
      } else if (ev.stage === 'awards') {
        awards(ev);
        ev.stage = 'done';
      } else return { need: 'done' };
    }
  };
})(typeof window !== 'undefined' ? window.FTC : globalThis.FTC);
