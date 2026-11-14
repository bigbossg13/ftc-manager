/* Headless autoplay: node tools/smoke.js [careers] [seasons] [qual|league]
   Loads the game scripts without a browser and plays whole careers with a
   simple bot, to catch crashes and to eyeball balance. */
const fs = require('fs'), path = require('path'), vm = require('vm');
['core', 'data', 'world', 'match', 'event', 'career'].forEach((f) =>
  vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', 'js', f + '.js'), 'utf8'), { filename: f + '.js' }));
const G = globalThis.FTC, C = G.Career, D = G.Data;
const careers = +process.argv[2] || 5, seasons = +process.argv[3] || 4, format = process.argv[4] || 'qual';
const tally = {}, scores = [];
const bump = (k) => { tally[k] = (tally[k] || 0) + 1; };

function botWeek() {
  const st = G.state;
  if (!st.pitched && st.offers.length) C.pitch(0);
  D.FACILITIES.forEach((f) => { if (st.team.money > f.cost + 1500) C.buy(f.id); });
  st.mentorPool.slice().forEach((m) => C.invite(st.mentorPool.indexOf(m)));
  if (st.mentors.length && !st.compass) C.nominate(0);
  st.vendor.forEach((id) => { if (st.team.money > 2500) C.buyPerk(id); });
  st.alloc = {};
  if (!st.kickoff) { C.setAlloc('fundraise', 3); C.setAlloc('training', 99); return; }
  D.SUBS.forEach((s) => C.startUpgrade(s.id));
  const active = D.SUBS.filter((s) => st.robot.subs[s.id].active).map((s) => s.id);
  C.setAlloc('test', st.robot.rel < 75 ? 2 : 1);
  C.setAlloc('practice', 1);
  C.setAlloc('portfolio', 1);
  if (st.team.money < 600) C.setAlloc('fundraise', 2);
  let i = 0, guard = 0;
  while (active.length && C.used() < C.blocks() && guard++ < 50) C.setAlloc(active[i++ % active.length], 1);
  C.setAlloc('outreach', 99);
}

function playEvent() {
  const ev = G.state.event;
  for (;;) {
    const r = G.Event.advance(ev);
    if (r.need === 'done') break;
    if (r.need === 'pick') { ev.playerPick = r.options[0]; continue; }
    const res = G.Match.run(G.Event.build(ev, r.match, G.state.plan));
    scores.push(res.r, res.b);
    G.Event.complete(ev, r.match, res);
  }
  const s = ev.summary;
  bump(ev.type + ': ' + s.result);
  if (s.advanced) bump(ev.type + ': ADVANCED');
  s.awards.forEach((a) => bump(ev.type + ': ' + a));
  C.finishEvent();
}

for (let c = 0; c < careers; c++) {
  C.newGame({ name: 'Bots', number: 4242, difficulty: 'normal', format, seed: 1000 + c * 77 });
  for (let s = 0; s < seasons; s++) {
    let guard = 0;
    while (G.state.phase !== 'review' && guard++ < 60) {
      botWeek();
      if (C.advanceWeek() === 'event') playEvent();
    }
    const st = G.state, p = C.playerPerf();
    console.log(`career ${c} season ${st.season} ${st.game.padEnd(11)} wk${st.week} rep ${st.team.rep.toFixed(0).padStart(3)} $${Math.round(st.team.money)} perf ${Object.values(p).join('/')} goal ${st.review.met ? 'MET' : 'missed'} :: ` +
      st.review.events.map((e) => `${e.s.rank}/${e.s.of} ${e.s.record} ${e.s.result}`).join(' | '));
    C.nextSeason();
  }
}
scores.sort((a, b) => a - b);
console.log('alliance scores p10/p50/p90/max:', [0.1, 0.5, 0.9].map((q) => scores[Math.floor(scores.length * q)]).join(' / '), '/', scores[scores.length - 1]);
console.log(Object.keys(tally).sort().map((k) => k + ' = ' + tally[k]).join('\n'));
