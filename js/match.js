/* FTC Manager — match engine.
   One engine drives live matches, quick sims and rival-only matches.
   2 v 2, 30 s autonomous + 2:00 driver-controlled, endgame in the last 30 s. */
(function (G) {
  'use strict';
  const U = G.U, D = G.Data;
  const M = (G.Match = {});
  const DT = 0.5;
  const T = D.MATCH;
  M.DT = DT;

  /** Blue's copy of a red field position: rotated 180 degrees, or mirrored top-to-bottom ('y') or left-to-right ('x') on fields laid out that way. */
  const pos = (M.pos = (side, p, L) => (!side ? [p[0], p[1]] : L.mirror === 'y' ? [p[0], 1 - p[1]] : L.mirror === 'x' ? [1 - p[0], p[1]] : [1 - p[0], 1 - p[1]]));
  const dist = (r, x, y) => Math.hypot(r.x - x, r.y - y);

  function log(m, side, text) { m.log.push({ t: m.t, side, text }); }
  function add(m, r, cat, pts) { m.score[r.side][cat] += pts; r.pts += pts; }

  function bestTier(g, r) {
    let tier = 0;
    g.end.forEach((e, i) => { if (r.perf.endgame >= e.req) tier = i; });
    if (r.plan.end === 'park') tier = 0;
    return tier;
  }

  /** alliances: arrays of two entries { id, num, name, perf, plan?, isPlayer? } */
  M.create = function (game, red, blue, seed) {
    const rng = G.Rng(seed);
    const m = { game: game.id, t: 0, done: false, robots: [], count: [0, 0], log: [], rng, teleStarted: false,
      score: [{ auto: 0, tele: 0, end: 0, pen: 0 }, { auto: 0, tele: 0, end: 0, pen: 0 }] };
    [red, blue].forEach((al, side) => al.forEach((e, idx) => {
      const p = pos(side, game.layout.start[idx], game.layout);
      const plan = Object.assign({ auto: 'std', focus: 'high', end: 'normal', pace: 'normal' }, e.plan || {});
      const k = plan.auto === 'bold' ? 1.6 : plan.auto === 'safe' ? 0.5 : 1;
      const r = { side, idx, id: e.id, num: e.num, name: e.name, isPlayer: !!e.isPlayer, perf: e.perf, plan,
        x: p[0], y: p[1], px: p[0], py: p[1], tx: p[0], ty: p[1], state: 'idle', timer: 0, goal: null,
        carrying: true, disabled: 0, dead: false, pts: 0, scored: 0, endTier: -1, endDone: false, moved: false, endNow: false,
        autoBroken: rng() < U.clamp((0.5 - e.perf.auto * 0.005) * k, 0.02, 0.8),
        autoLeft: Math.max(0, Math.floor(e.perf.auto / 28) + (plan.auto === 'bold' ? 1 : plan.auto === 'safe' ? -1 : 0)) };
      const tier = bestTier(game, r);
      const v = (0.1 + 0.26 * r.perf.speed / 100) * (0.8 + 0.4 * r.perf.driver / 100);
      r.endTime = tier > 0 ? 11 - 8 * r.perf.endgame / 100 : 1;
      const margin = plan.end === 'early' ? 9 : plan.end === 'late' ? 1 : 4;
      r.endAt = Math.max(T.endgame, T.total - (0.5 / v + r.endTime + margin));
      m.robots.push(r);
    }));
    return m;
  };

  function go(r, p, state) {
    const off = r.idx ? 0.035 : -0.035;
    r.tx = p[0]; r.ty = U.clamp(p[1] + off, 0.04, 0.96); r.state = state;
  }

  function decide(m, g, r, auto) {
    const rng = m.rng;
    if (!auto && !r.endDone && m.t >= T.endgame && (r.endNow || m.t >= r.endAt)) {
      r.tryTier = bestTier(g, r);
      return go(r, pos(r.side, g.layout.end, g.layout), 'toEnd');
    }
    if (r.carrying) {
      const canHigh = r.perf.scorer >= g.high.req;
      const f = r.plan.focus;
      r.goal = canHigh && (f === 'high' || (f === 'mix' && rng() < 0.5)) ? 'high' : 'low';
      return go(r, pos(r.side, g.layout[r.goal], g.layout), 'toGoal');
    }
    if (auto) {
      if (r.autoLeft <= 0) { r.state = 'wait'; return; }
      r.autoLeft--;
    }
    const zones = g.layout.collect.map((z) => pos(r.side, z, g.layout)).sort((a, b) => dist(r, a[0], a[1]) - dist(r, b[0], b[1]));
    go(r, zones[rng() < 0.7 ? 0 : 1], 'toCollect');
  }

  function resolve(m, g, r, auto) {
    const rng = m.rng, pf = r.perf;
    if (r.state === 'collecting') {
      if (rng() < 0.72 + 0.27 * pf.intake / 100) { r.carrying = true; r.state = 'idle'; }
      else r.timer = 0.8; // fumbled, grab again
    } else if (r.state === 'scoring') {
      const high = r.goal === 'high', goal = g[r.goal];
      let p = high
        ? 0.55 + 0.4 * (pf.scorer - g.high.req) / (100 - g.high.req) + (pf.driver - 50) / 500
        : 0.82 + pf.scorer / 600 + (pf.driver - 50) / 500;
      if (auto) p *= 0.5 + 0.5 * pf.auto / 100;
      if (r.plan.pace === 'push') p -= 0.05;
      r.carrying = false; r.state = 'idle';
      if (rng() < U.clamp(p, 0.25, 0.985)) {
        add(m, r, auto ? 'auto' : 'tele', auto ? M.autoPts(g, goal) : goal.pts);
        r.scored++;
        if (g.set && ++m.count[r.side] % g.set.size === 0) {
          add(m, r, auto ? 'auto' : 'tele', g.set.bonus);
          log(m, r.side, (r.side ? 'Blue' : 'Red') + ' completes a ' + g.set.name + ' (+' + g.set.bonus + ')');
        }
      }
    } else if (r.state === 'ending') {
      const tier = r.tryTier, e = g.end[tier];
      r.endDone = true; r.state = 'done';
      if (tier === 0 || rng() < U.clamp(0.6 + 0.38 * (pf.endgame - e.req) / 30, 0.5, 0.97)) {
        r.endTier = tier; add(m, r, 'end', e.pts);
        log(m, r.side, r.num + ': ' + e.name + ' (+' + e.pts + ')');
      } else {
        r.endTier = 0; add(m, r, 'end', g.end[0].pts);
        log(m, r.side, r.num + ' fails "' + e.name + '" and settles for a park');
      }
    }
  }

  function stepRobot(m, g, r, auto) {
    const rng = m.rng, pf = r.perf;
    r.px = r.x; r.py = r.y;
    if (r.dead) return;
    if (r.disabled > 0) {
      r.disabled -= DT;
      if (r.disabled <= 0) log(m, r.side, r.num + ' is moving again');
      return;
    }
    const pace = r.plan.pace;
    const speedUp = pace === 'push' ? 1.12 : pace === 'safe' ? 0.93 : 1;
    const risk = pace === 'push' ? 1.9 : pace === 'safe' ? 0.5 : 1;
    if (r.state !== 'done' && rng() < (DT / T.total) * ((100 - pf.rel) / 100) * 1.4 * risk) {
      if (rng() < 0.12) { r.dead = true; log(m, r.side, r.num + ' has lost connection and is out for the match!'); }
      else { r.disabled = 4 + rng() * 14; log(m, r.side, r.num + U.pick([' has a jammed mechanism', ' browns out', ' throws a chain', ' loses a servo horn'], rng)); }
      return;
    }
    if (!auto && r.state !== 'done' && rng() < (DT / T.total) * (0.32 - 0.27 * pf.driver / 100) * risk) {
      m.score[1 - r.side].pen += T.penalty;
      log(m, r.side, 'Penalty on ' + r.num + ' (+' + T.penalty + ' to ' + (r.side ? 'Red' : 'Blue') + ')');
    }
    if (r.state === 'done' || (auto && (r.autoBroken || r.state === 'wait'))) return;

    const af = auto ? 0.35 + 0.65 * pf.auto / 100 : 1;
    const v = (0.1 + 0.26 * pf.speed / 100) * (auto ? af : 0.8 + 0.4 * pf.driver / 100) * speedUp;
    const tf = (auto ? 1 / af : 1) / speedUp;
    if (r.state === 'idle') { decide(m, g, r, auto); if (r.state === 'wait') return; }

    if (r.state === 'toCollect' || r.state === 'toGoal' || r.state === 'toEnd') {
      const d = dist(r, r.tx, r.ty), stepLen = v * DT;
      if (auto) r.moved = true;
      if (d <= stepLen) {
        r.x = r.tx; r.y = r.ty;
        const jitter = 0.85 + 0.3 * rng();
        if (r.state === 'toCollect') { r.state = 'collecting'; r.timer = (3.6 - 2.8 * pf.intake / 100) * g.collectTime * jitter * tf; }
        else if (r.state === 'toGoal') { r.state = 'scoring'; r.timer = (r.goal === 'high' ? 4.2 - 3 * pf.scorer / 100 : 2.2 - 1.2 * pf.scorer / 100) * g.scoreTime * jitter * tf; }
        else { r.state = 'ending'; r.timer = r.tryTier > 0 ? r.endTime * jitter / speedUp : 1; }
      } else { r.x += (r.tx - r.x) / d * stepLen; r.y += (r.ty - r.y) / d * stepLen; }
    } else {
      r.timer -= DT;
      if (r.timer <= 0) resolve(m, g, r, auto);
    }
  }

  M.step = function (m) {
    if (m.done) return;
    const g = D.game(m.game);
    m.t += DT;
    const auto = m.t <= T.auto;
    if (!auto && !m.teleStarted) {
      m.teleStarted = true;
      m.robots.forEach((r) => {
        if (r.moved && !r.dead) {
          add(m, r, 'auto', g.autoLeave);
          const ab = g.autoBonus;
          if (ab && r.perf.auto >= ab.req && m.rng() < 0.6 + 0.35 * (r.perf.auto - ab.req) / (100 - ab.req)) {
            add(m, r, 'auto', ab.pts);
            log(m, r.side, r.num + ': ' + ab.name + ' (+' + ab.pts + ')');
          }
        }
        if (r.state === 'wait') r.state = 'idle';
      });
      log(m, -1, 'Autonomous ends: Red ' + m.score[0].auto + ' - ' + m.score[1].auto + ' Blue');
    }
    if (m.t === T.endgame) log(m, -1, 'Endgame! 30 seconds left');
    m.robots.forEach((r) => stepRobot(m, g, r, auto));
    if (m.t >= T.total) {
      m.robots.forEach((r) => {
        if (r.state === 'ending' && !r.dead) { r.endTier = 0; add(m, r, 'end', g.end[0].pts); r.state = 'done'; }
      });
      m.done = true;
      const [a, b] = M.totals(m);
      log(m, -1, 'Final: Red ' + a + ' - ' + b + ' Blue');
    }
  };

  /** Points for a goal during autonomous: explicit value, or the game's multiplier. */
  M.autoPts = (g, goal) => (goal.auto != null ? goal.auto : Math.round(goal.pts * g.autoMult));
  M.total = (s) => s.auto + s.tele + s.end + s.pen;
  M.totals = (m) => [M.total(m.score[0]), M.total(m.score[1])];
  M.run = function (m) { while (!m.done) M.step(m); return M.result(m); };
  M.result = function (m) {
    const [r, b] = M.totals(m);
    const contrib = {};
    m.robots.forEach((x) => { contrib[x.id] = x.pts; });
    return { r, b, winner: r > b ? 0 : b > r ? 1 : -1, score: m.score, contrib };
  };
})(typeof window !== 'undefined' ? window.FTC : globalThis.FTC);
