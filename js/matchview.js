/* FTC Manager — live match view: runs the engine in real time and draws the field */
(function (G) {
  'use strict';
  const D = G.Data, M = G.Match;
  const V = (G.MatchView = { m: null, speed: 2, acc: 0, last: 0, raf: 0, onDone: null, finished: false, logN: -1 });
  const RED = '#e5484d', BLUE = '#3e7bfa';
  const $ = (id) => document.getElementById(id);

  V.start = function (m, onDone) {
    V.stop();
    Object.assign(V, { m, onDone, acc: 0, last: performance.now(), finished: false, logN: -1 });
    V.raf = requestAnimationFrame(frame);
  };
  V.stop = function () { cancelAnimationFrame(V.raf); V.m = null; };
  V.skip = function () { if (V.m) while (!V.m.done) M.step(V.m); };
  V.player = () => V.m && V.m.robots.find((r) => r.isPlayer);

  function frame(now) {
    const m = V.m;
    if (!m) return;
    const dt = Math.min(0.1, (now - V.last) / 1000);
    V.last = now;
    V.acc += dt * V.speed;
    while (V.acc >= M.DT && !m.done) { M.step(m); V.acc -= M.DT; }
    if (m.done) V.acc = M.DT;
    draw(m, Math.min(1, V.acc / M.DT));
    hud(m);
    if (m.done) { if (!V.finished) { V.finished = true; if (V.onDone) V.onDone(); } return; }
    V.raf = requestAnimationFrame(frame);
  }

  /** Redraw after the page was re-rendered around a running or finished match. */
  V.refresh = function () { V.logN = -1; if (V.m) { draw(V.m, 1); hud(V.m); } };

  function hud(m) {
    const [r, b] = M.totals(m), T = D.MATCH;
    if (!$('sc-r')) return;
    $('sc-r').textContent = r; $('sc-b').textContent = b;
    const left = Math.max(0, T.total - m.t), auto = m.t <= T.auto;
    const shown = auto ? T.auto - m.t : left;
    $('clock').textContent = Math.floor(shown / 60) + ':' + String(Math.floor(shown % 60)).padStart(2, '0');
    $('phase').textContent = m.done ? 'FINAL' : auto ? 'AUTONOMOUS' : m.t >= T.endgame ? 'ENDGAME' : 'TELEOP';
    const p = V.player(), btn = $('endnow');
    if (btn && p) btn.disabled = m.done || m.t < T.endgame || p.endNow || p.endDone || p.state === 'toEnd' || p.state === 'ending';
    if (m.log.length !== V.logN) {
      V.logN = m.log.length;
      $('mlog').innerHTML = m.log.slice(-40).reverse().map((l) =>
        '<li><span class="muted num">' + Math.floor(l.t / 60) + ':' + String(Math.floor(l.t % 60)).padStart(2, '0') + '</span> ' +
        '<span class="' + (l.side === 0 ? 'redc' : l.side === 1 ? 'bluec' : '') + '">' + G.U.esc(l.text) + '</span></li>').join('');
    }
  }

  function draw(m, a) {
    const cv = $('field');
    if (!cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), size = cv.clientWidth || 560;
    if (cv.width !== Math.round(size * dpr)) { cv.width = cv.height = Math.round(size * dpr); }
    const c = cv.getContext('2d'), S = cv.width, g = D.game(m.game), L = g.layout;
    const px = (v) => v * S;
    c.clearRect(0, 0, S, S);
    c.fillStyle = '#262b34'; c.fillRect(0, 0, S, S);
    if (L.mirror !== 'y') {
      c.fillStyle = 'rgba(229,72,77,.10)'; c.fillRect(0, 0, S * 0.18, S);
      c.fillStyle = 'rgba(62,123,250,.10)'; c.fillRect(S * 0.82, 0, S * 0.18, S);
    }
    c.strokeStyle = '#343b48'; c.lineWidth = 1;
    for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(px(i / 6), 0); c.lineTo(px(i / 6), S); c.moveTo(0, px(i / 6)); c.lineTo(S, px(i / 6)); c.stroke(); }
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const pos = (side, p) => M.pos(side, p, L), aim = L.aim || L;
    // Game-specific field markings, in absolute field coordinates.
    (L.deco || []).forEach((d) => {
      const col = { red: RED, blue: BLUE, white: '#f2f2f2', grey: '#6b7280', yellow: '#f5c518' }[d.c];
      c.beginPath();
      d.p.forEach((q, i) => (i ? c.lineTo(px(q[0]), px(q[1])) : c.moveTo(px(q[0]), px(q[1]))));
      if (d.fill) { c.closePath(); c.fillStyle = col; c.globalAlpha = d.fill; c.fill(); c.globalAlpha = 1; }
      else { if (d.close) c.closePath(); c.strokeStyle = col; c.lineWidth = px(0.008); c.stroke(); }
    });

    [0, 1].forEach((side) => {
      const col = side ? BLUE : RED;
      L.collect.forEach((z, zi) => {
        const p = pos(side, z);
        c.globalAlpha = 0.22; c.fillStyle = g.color; c.beginPath(); c.arc(px(p[0]), px(p[1]), px(0.055), 0, 7); c.fill();
        c.globalAlpha = 0.9;
        for (let k = 0; k < 5; k++) { const an = k * 1.26 + zi; c.beginPath(); c.arc(px(p[0]) + Math.cos(an) * px(0.028), px(p[1]) + Math.sin(an) * px(0.028), px(0.011), 0, 7); c.fill(); }
        c.globalAlpha = 1;
      });
      const e = pos(side, L.end);
      c.strokeStyle = col; c.lineWidth = 2 * dpr;
      if (!L.deco) { c.setLineDash([px(0.012), px(0.008)]); c.strokeRect(px(e[0] - 0.075), px(e[1] - 0.085), px(0.15), px(0.17)); c.setLineDash([]); }
      const lo = pos(side, aim.low), hi = pos(side, aim.high);
      c.fillStyle = col; c.globalAlpha = 0.3; c.fillRect(px(lo[0] - 0.04), px(lo[1] - 0.04), px(0.08), px(0.08)); c.globalAlpha = 1;
      c.strokeRect(px(lo[0] - 0.04), px(lo[1] - 0.04), px(0.08), px(0.08));
      c.globalAlpha = 0.55; c.beginPath(); c.arc(px(hi[0]), px(hi[1]), px(0.05), 0, 7); c.fill(); c.globalAlpha = 1; c.stroke();
      c.fillStyle = '#fff'; c.font = '700 ' + px(0.03) + 'px system-ui';
      c.fillText('L', px(lo[0]), px(lo[1])); c.fillText('H', px(hi[0]), px(hi[1]));
    });

    const R = px(0.038);
    m.robots.forEach((r) => {
      const x = px(r.px + (r.x - r.px) * a), y = px(r.py + (r.y - r.py) * a);
      const down = r.dead || r.disabled > 0;
      c.fillStyle = r.dead ? '#3a3f49' : down ? '#777f8d' : r.side ? BLUE : RED;
      c.beginPath(); c.roundRect(x - R, y - R, R * 2, R * 2, R * 0.3); c.fill();
      c.lineWidth = (r.isPlayer ? 3 : 1.5) * dpr; c.strokeStyle = r.isPlayer ? '#ffd24a' : 'rgba(255,255,255,.55)'; c.stroke();
      if (r.endTier > 0) { c.strokeStyle = '#7dffa8'; c.lineWidth = 2 * dpr; c.beginPath(); c.arc(x, y, R * 1.45, 0, 7); c.stroke(); }
      if (r.carrying && !down) { c.fillStyle = g.color; c.strokeStyle = '#111'; c.lineWidth = dpr; c.beginPath(); c.arc(x + R * 0.75, y - R * 0.75, R * 0.36, 0, 7); c.fill(); c.stroke(); }
      c.fillStyle = '#fff'; c.font = '700 ' + px(0.024) + 'px system-ui';
      c.fillText(down ? (r.dead ? 'X' : '!') : String(r.num), x, y);
    });

    if (m.t <= D.MATCH.auto && !m.done) { c.fillStyle = 'rgba(255,255,255,.75)'; c.font = '700 ' + px(0.026) + 'px system-ui'; c.fillText('AUTONOMOUS', S / 2, px(0.035)); }
  }
})(window.FTC);
