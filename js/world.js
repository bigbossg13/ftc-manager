/* FTC Manager — the simulated world: rival teams and how good they are */
(function (G) {
  'use strict';
  const U = G.U, D = G.Data;
  const W = (G.World = {});
  const STATS = ['speed', 'intake', 'scorer', 'endgame', 'auto', 'rel', 'driver'];

  function makeTeam(id, rating, used) {
    let num;
    do { num = U.rint(100, 29999); } while (used[num]);
    used[num] = 1;
    let name;
    do { name = U.pick(D.TEAM_A) + ' ' + U.pick(D.TEAM_B); } while (used[name]);
    used[name] = 1;
    const prof = {};
    STATS.forEach((s) => { prof[s] = Math.round(U.bell() * 14); });
    return {
      id, num, name,
      rating: Math.round(rating), prof,
      port: Math.round(U.clamp(rating * 0.7 + 15 + U.bell() * 30, 0, 100)),
      out: Math.round(U.clamp(rating * 0.5 + 25 + U.bell() * 35, 0, 100)),
    };
  }

  /** The regional pool the player competes against all season. */
  W.create = function (playerNum) {
    const used = {}; used[playerNum] = 1;
    const teams = [];
    for (let i = 0; i < 60; i++) teams.push(makeTeam('t' + i, U.clamp(48 + U.bell() * 34, 14, 90), used));
    return { teams };
  };

  /** Elite field from other regions for the World Championship. */
  W.elite = function (n) {
    const used = {}; used[G.state.team.number] = 1;
    const out = [];
    for (let i = 0; i < n; i++) {
      const t = makeTeam('w' + i, U.clamp(80 + U.bell() * 17, 62, 98), used);
      t.name += ' (' + U.pick(D.REGIONS) + ')';
      out.push(t);
    }
    return out;
  };

  /** How far along rival robots are at a given week of the season (0..1). */
  W.progress = (week) => U.clamp(0.45 + 0.025 * week, 0.45, 1);

  /** Performance snapshot of a rival at a given point in the season. */
  W.perf = function (team, progress) {
    const p = {};
    STATS.forEach((s) => { p[s] = Math.round(U.clamp(team.rating * progress + team.prof[s] + U.bell() * 4, 5, 100)); });
    p.rel = Math.round(U.clamp(45 + team.rating * 0.45 * progress + team.prof.rel, 30, 97));
    return p;
  };

  W.entry = function (team, week) {
    return { id: team.id, num: team.num, name: team.name, perf: W.perf(team, W.progress(week)), port: team.port, out: team.out };
  };

  /** Between seasons: programs rise and fall, with a pull toward the middle. */
  W.newSeason = function (world) {
    world.teams.forEach((t) => {
      t.rating = Math.round(U.clamp(t.rating + U.bell() * 12 + (50 - t.rating) * 0.08, 12, 94));
      t.port = Math.round(U.clamp(t.port + U.bell() * 15, 0, 100));
      t.out = Math.round(U.clamp(t.out + U.bell() * 15, 0, 100));
      t.qr = false;
    });
  };
})(typeof window !== 'undefined' ? window.FTC : globalThis.FTC);
