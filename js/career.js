/* FTC Manager — career: team state, weekly work, finances, season flow */
(function (G) {
  'use strict';
  const U = G.U, D = G.Data;
  const C = (G.Career = {});
  const SKILLS = ['mech', 'soft', 'drive', 'biz'];
  let uid = 0;

  const personName = () => U.pick(D.FIRST) + ' ' + U.pick(D.LAST);
  function student(grade, lo, hi) {
    const s = { id: 's' + Date.now().toString(36) + uid++, name: personName(), grade };
    SKILLS.forEach((k) => { s[k] = U.rint(lo, hi); });
    return s;
  }
  function freshRobot() {
    const subs = {};
    D.SUBS.forEach((s) => { subs[s.id] = { concept: s.concepts[1].id, level: 0, progress: 0, active: false }; });
    return { subs, rel: 70 };
  }
  function calendar(format) {
    const w = D.WEEKS;
    const first = format === 'league' ? [
      { week: 8, type: 'meet', name: 'League Meet 1', fee: 40 },
      { week: 10, type: 'meet', name: 'League Meet 2', fee: 40 },
      { week: 12, type: 'meet', name: 'League Meet 3', fee: 40 },
      { week: 14, type: 'league', name: 'League Tournament', fee: 150 },
    ] : [
      { week: w.q1, type: 'qual', name: 'Autumn Qualifier', fee: 150 },
      { week: w.q2, type: 'qual', name: 'Winter Qualifier', fee: 150 },
    ];
    return first.concat([
      { week: w.regional, type: 'regional', name: 'Regional Championship', fee: 400, need: 'qualRegional' },
      { week: w.worlds, type: 'worlds', name: 'World Championship', fee: 3500, need: 'qualWorlds' },
    ]);
  }
  function makeOffers(st) {
    const names = U.shuffle(D.SPONSORS).slice(0, 5);
    return names.map((name, i) => {
      const minRep = Math.round(U.clamp(st.team.rep - 8 + i * 11 + U.bell() * 5, 0, 95));
      return { name, minRep, amount: Math.round((250 + Math.pow(minRep, 1.15) * 20) / 50) * 50 };
    });
  }
  function makeMentors() {
    return Object.keys(D.MENTOR_AREAS).map((area) => {
      const skill = U.rint(1, 5);
      return { name: personName(), area, skill, minRep: Math.max(0, skill * 13 - 14 + U.rint(-4, 4)) };
    });
  }
  function pickGame(st) {
    if (st.order[st.season - 1]) return st.order[st.season - 1];
    return U.pick(D.GAMES.filter((g) => g.id !== st.game)).id;
  }
  /** Everything that is rebuilt at the start of each season. */
  function setupSeason(st) {
    st.game = pickGame(st);
    st.calendar = calendar(st.format);
    st.goal = goalIndex(st.team.rep);
    st.offers = makeOffers(st);
    st.mentorPool = makeMentors();
    st.vendor = U.shuffle(D.VENDOR).slice(0, 3).map((x) => x.id);
    st.perks = {};
    st.league = st.format === 'league' ? { ids: U.shuffle(st.world.teams).slice(0, 15).map((t) => t.id), stats: null } : null;
    C.autoDriveTeam();
  }
  C.yearLabel = (y) => y + '-' + String((y + 1) % 100).padStart(2, '0');
  const perk = (subId, kind) => D.VENDOR.reduce((a, x) => a + (G.state.perks[x.id] && x.sub === subId && x.kind === kind ? x.value : 0), 0);
  const goalIndex = (rep) => (rep < 28 ? 0 : rep < 50 ? 1 : rep < 72 ? 2 : 3);

  /** Older saves counted work in blocks and points; convert them to hours. */
  C.migrate = function (st) {
    if (st.v >= 3) return;
    Object.keys(st.alloc).forEach((id) => { st.alloc[id] *= 6; });
    Object.values(st.robot.subs).forEach((s) => { s.progress = s.progress / 2.667; });
    st.v = 3;
  };
  C.news = function (text) {
    const st = G.state;
    st.news.unshift({ s: st.season, w: st.week, text });
    if (st.news.length > 40) st.news.length = 40;
  };
  C.pay = function (amount) { G.state.team.money -= amount; G.state.ledger.spent += amount; };
  C.earn = function (amount) { G.state.team.money += amount; G.state.ledger.income += amount; };
  C.rep = function (d) { G.state.team.rep = U.clamp(G.state.team.rep + d, 0, 100); };

  C.newGame = function (opts) {
    const diff = D.DIFFICULTY[opts.difficulty] || D.DIFFICULTY.normal;
    const st = (G.state = {
      v: 3, seed: (opts.seed || Date.now()) >>> 0, difficulty: opts.difficulty,
      mode: opts.mode === 'single' ? 'single' : 'career', format: opts.format === 'league' ? 'league' : 'qual', order: [],
      banners: [], compass: null, vendor: [], perks: {}, league: null,
      team: { name: opts.name || 'Robo Rookies', number: opts.number || 31415, rep: diff.rep, money: diff.money },
      season: 1, year: 2022, week: 1, phase: 'play', game: null, kickoff: false,
      students: [], mentors: [], mentorPool: [], facilities: {}, sponsors: [], offers: [],
      robot: freshRobot(), knowledge: {}, practice: 0, morale: 75, overtime: false, alloc: {},
      awards: { portfolio: 0, outreach: 0 }, driveTeam: {}, plan: { auto: 'std', focus: 'high', end: 'normal' },
      world: null, calendar: [], event: null, flags: {}, news: [], history: [],
      ledger: { income: 0, spent: 0 }, pitched: false, review: null, goal: 0, modal: null,
    });
    [9, 9, 10, 10, 10, 11, 11, 12, 9, 10, 11, 12].slice(0, diff.roster).forEach((g) => st.students.push(student(g, 14 + (g - 9) * 5 + diff.skill, 34 + (g - 9) * 7 + diff.skill)));
    (diff.facilities || []).forEach((f) => { st.facilities[f] = true; });
    st.world = G.World.create(st.team.number);
    if (st.mode === 'single') {
      const g = D.game(opts.game) || D.GAMES[0];
      st.order = [g.id];
      st.year = g.year || 2026;
    } else st.order = D.REAL.map((g) => g.id);
    setupSeason(st);
    C.news('Summer vendor launches are in: see Finance for this year\'s new products.');
    C.news('Team ' + st.team.number + ' ' + st.team.name + ' is founded. Kickoff is in week ' + D.WEEKS.kickoff + '.');
    return st;
  };

  /* ---------- Robot ---------- */
  C.concept = (subId) => D.concept(subId, G.state.robot.subs[subId].concept);
  C.conceptName = function (subId, c) {
    c = c || C.concept(subId);
    if (subId !== 'scorer') return c.name;
    const g = D.game(G.state.game);
    return G.state.kickoff ? g.scorer[D.sub('scorer').concepts.indexOf(c)] : ['Basic', 'Standard', 'Advanced'][D.sub('scorer').concepts.indexOf(c)] + ' mechanism';
  };
  C.stat = function (subId) {
    const s = G.state.robot.subs[subId], c = C.concept(subId);
    return s.level === 0 ? 12 : Math.min(100, c.base + c.per * s.level + perk(subId, 'stat'));
  };
  C.levelCost = function (subId) { const s = G.state.robot.subs[subId]; return Math.round(C.concept(subId).cost * (1 + 0.35 * s.level) * (1 - perk(subId, 'cost'))); };
  /** Standard hours for the next level of a concept: the same for every team, in steps of 5. */
  C.baseHours = function (subId) {
    const s = G.state.robot.subs[subId];
    return Math.max(5, Math.round(10 * C.concept(subId).work * (1 + 0.45 * s.level) / 5) * 5);
  };
  /** Hours this team needs: the standard figure less experience with the concept and vendor kits. */
  C.levelWork = function (subId) {
    const s = G.state.robot.subs[subId];
    const know = Math.min(7, G.state.knowledge[subId + ':' + s.concept] || 0);
    return Math.max(1, Math.round(C.baseHours(subId) * (1 - 0.04 * know) * (1 - perk(subId, 'work'))));
  };
  C.canUpgrade = function (subId) {
    const st = G.state, s = st.robot.subs[subId];
    if (!st.kickoff) return 'Wait for kickoff';
    if (s.active) return 'In progress';
    if (s.level >= C.concept(subId).max) return 'Maxed out';
    if (st.team.money < C.levelCost(subId)) return 'Not enough money';
    return '';
  };
  C.startUpgrade = function (subId) {
    if (C.canUpgrade(subId)) return false;
    const s = G.state.robot.subs[subId];
    C.pay(C.levelCost(subId));
    s.active = true; s.progress = 0;
    return true;
  };
  C.setConcept = function (subId, conceptId) {
    const s = G.state.robot.subs[subId];
    if (s.concept === conceptId) return;
    s.concept = conceptId; s.active = false; s.progress = 0;
    s.level = Math.min(Math.floor(s.level / 2), C.concept(subId).max);
    C.sanitizeAlloc();
  };
  C.driverSkill = function () {
    const st = G.state, dt = st.driveTeam;
    const val = (role) => { const s = st.students.find((x) => x.id === dt[role]); return s ? s.drive : 10; };
    const skill = val('driver') * 0.5 + val('operator') * 0.25 + val('coach') * 0.15 + val('human') * 0.1;
    return Math.round(U.clamp(0.45 * skill + 0.45 * st.practice + 40 * C.mentorBonus('drive') + 5, 5, 100));
  };
  C.playerPerf = function () {
    return { speed: C.stat('drive'), intake: C.stat('intake'), scorer: C.stat('scorer'), endgame: C.stat('endgame'),
      auto: C.stat('software'), rel: Math.round(G.state.robot.rel), driver: C.driverSkill() };
  };
  C.ROLES = ['driver', 'operator', 'coach', 'human'];
  C.ROLE_NAMES = { driver: 'Driver', operator: 'Operator', coach: 'Drive Coach', human: 'Human Player' };
  C.setRole = function (studentId, role) {
    const dt = G.state.driveTeam;
    const old = C.ROLES.find((r) => dt[r] === studentId);
    if (old) dt[old] = role ? dt[role] : null;
    if (role) dt[role] = studentId;
  };
  C.autoDriveTeam = function () {
    const st = G.state, dt = st.driveTeam, by = st.students.slice().sort((a, b) => b.drive - a.drive);
    C.ROLES.forEach((role) => {
      if (st.students.some((s) => s.id === dt[role])) return;
      const free = by.find((s) => !C.ROLES.some((r) => dt[r] === s.id));
      dt[role] = free ? free.id : null;
    });
  };

  /* ---------- Weekly work ---------- */
  /** Team hours available this week. */
  C.hours = function () {
    const st = G.state;
    return st.students.length * 5 + 10 + (st.facilities.space ? 6 : 0) + (st.overtime ? 18 : 0);
  };
  C.used = () => Object.values(G.state.alloc).reduce((a, b) => a + b, 0);
  C.locked = function (id) {
    const st = G.state, sub = st.robot.subs[id];
    if (sub) return !st.kickoff ? 'Opens at kickoff' : !sub.active ? 'Start an upgrade first' : '';
    if (id === 'test') return Object.values(st.robot.subs).some((s) => s.level > 0) ? '' : 'Nothing to test yet';
    if (id === 'practice') return st.robot.subs.drive.level > 0 ? '' : 'Needs a drivetrain';
    return '';
  };
  C.setAlloc = function (id, delta) {
    const st = G.state;
    if (C.locked(id)) return;
    const cur = st.alloc[id] || 0;
    st.alloc[id] = U.clamp(Math.round(cur + delta), 0, cur + C.hours() - C.used());
  };
  /** Set an activity's hours outright (typed in); capped at what is still free. */
  C.setHours = function (id, value) { C.setAlloc(id, (Math.round(+value) || 0) - (G.state.alloc[id] || 0)); };
  C.sanitizeAlloc = function () {
    const st = G.state;
    Object.keys(st.alloc).forEach((id) => { if (C.locked(id)) st.alloc[id] = 0; });
    let over = C.used() - C.hours();
    Object.keys(st.alloc).reverse().forEach((id) => { const cut = Math.min(over, st.alloc[id]); if (cut > 0) { st.alloc[id] -= cut; over -= cut; } });
  };
  C.skillAvg = function (k) {
    const top = G.state.students.map((s) => s[k]).sort((a, b) => b - a).slice(0, 6);
    return U.avg(top);
  };
  C.mentorBonus = (k) => G.state.mentors.filter((m) => m.area === k).reduce((a, m) => a + 0.06 * m.skill, 0);
  C.mentorSlots = () => 3 + (G.state.facilities.space ? 1 : 0);
  const FAC = {
    drive: { printer: 0.1, cnc: 0.15 }, intake: { printer: 0.1, cnc: 0.15 }, scorer: { printer: 0.1, cnc: 0.15 }, endgame: { printer: 0.1, cnc: 0.15 },
    software: { sensors: 0.2, laptops: 0.1 }, test: { field: 0.3 }, practice: { field: 0.3 }, portfolio: { laptops: 0.1 },
    outreach: { pit: 0.15 }, fundraise: { pit: 0.15 }, training: {},
  };
  C.actSkill = (id) => (D.sub(id) ? D.sub(id).skill : D.ACTS.find((a) => a.id === id).skill);
  /** Efficiency: how much progress one assigned hour makes (1.0 = one standard hour). */
  C.eff = function (id) {
    const st = G.state, k = C.actSkill(id);
    let fac = 0;
    Object.keys(FAC[id]).forEach((f) => { if (st.facilities[f]) fac += FAC[id][f]; });
    const skill = k ? C.skillAvg(k) : 50;
    return (0.5 + skill / 100) * (1 + (k ? C.mentorBonus(k) : 0)) * (1 + fac) * (0.7 + 0.3 * st.morale / 100);
  };
  /** What one hour of each side activity produces. */
  C.RATE = { test: 0.53, practice: 0.59, portfolio: 0.35, outreach: 0.35 };
  C.fundPerHour = () => C.eff('fundraise') * (9.3 + G.state.team.rep * 0.16);

  function grow(k, amount) {
    const s = U.pick(G.state.students);
    const key = k || U.pick(SKILLS);
    s[key] = Math.min(100, s[key] + amount);
  }

  function applyWork() {
    const st = G.state;
    C.sanitizeAlloc();
    Object.keys(st.alloc).forEach((id) => {
      const n = st.alloc[id];
      if (!n) return;
      const p = n * C.eff(id), sub = st.robot.subs[id];
      if (id === 'training') for (let i = 0; i < Math.round(n / 3); i++) grow(null, 1);
      else for (let i = 0; i < Math.round(n / 6); i++) grow(C.actSkill(id), 0.25);
      if (sub) {
        sub.progress += p;
        if (sub.progress >= C.levelWork(id)) {
          const c = C.concept(id), key = id + ':' + sub.concept;
          sub.level++; sub.progress = 0; sub.active = false; st.alloc[id] = 0;
          st.robot.rel = Math.max(20, st.robot.rel - c.rel - 3);
          st.practice = Math.max(0, st.practice - 2);
          st.knowledge[key] = Math.max(st.knowledge[key] || 0, sub.level);
          C.news(D.sub(id).name + ' upgraded to level ' + sub.level + ' (' + C.conceptName(id) + ').');
        }
      } else if (id === 'test') st.robot.rel = Math.min(96, st.robot.rel + p * C.RATE.test);
      else if (id === 'practice') st.practice = Math.min(100, st.practice + p * C.RATE.practice);
      else if (id === 'portfolio') st.awards.portfolio = Math.min(100, st.awards.portfolio + p * C.RATE.portfolio);
      else if (id === 'outreach') { st.awards.outreach = Math.min(100, st.awards.outreach + p * C.RATE.outreach); C.rep(p * 0.021); }
      else if (id === 'fundraise') C.earn(Math.round(n * C.fundPerHour()));
    });
  }

  /* ---------- Calendar ---------- */
  C.nextEvent = function () {
    const st = G.state;
    return st.calendar.find((c) => !c.done && (!c.need || st.flags[c.need])) || null;
  };

  function startEvent(cal) {
    const st = G.state, W = G.World;
    C.pay(cal.fee);
    let entries;
    let carried = null;
    if (cal.type === 'qual') entries = U.shuffle(st.world.teams).slice(0, 23).map((t) => W.entry(t, st.week));
    else if (cal.type === 'meet' || cal.type === 'league') {
      entries = st.league.ids.map((id) => W.entry(st.world.teams.find((t) => t.id === id), st.week));
      carried = st.league.stats;
    }
    else if (cal.type === 'regional') {
      const sorted = st.world.teams.slice().sort((a, b) => (b.qr ? 1000 : 0) + b.rating - (a.qr ? 1000 : 0) - a.rating);
      entries = sorted.slice(0, 31).map((t) => W.entry(t, st.week));
    } else entries = W.elite(39).map((t) => W.entry(t, st.week));
    entries.push({ id: 'P', num: st.team.number, name: st.team.name, isPlayer: true });
    st.event = G.Event.create(cal.type, cal.name, U.shuffle(entries), carried);
    st.event.calWeek = cal.week;
    C.news('Arrived at the ' + cal.name + '. Entry and travel: ' + U.money(cal.fee) + '.');
  }

  /** Advance one week. Returns 'event' | 'review' | 'kickoff' | 'week'. */
  C.advanceWeek = function () {
    const st = G.state;
    if (st.event || st.phase === 'review') return 'blocked';
    applyWork();
    st.morale = U.clamp(st.morale + (st.overtime ? -5 : st.morale < 75 ? 2 : 0), 5, 100);
    st.pitched = false;
    const next = C.nextEvent();
    if (!next) { C.makeReview(); return 'review'; }
    st.week++;
    let out = 'week';
    if (st.week === D.WEEKS.kickoff) {
      st.kickoff = true;
      C.pay(300);
      C.news('KICKOFF! This season\'s game is ' + D.game(st.game).name + '. Season registration: $300.');
      st.modal = 'kickoff';
      out = 'kickoff';
    }
    if (st.week === next.week) { startEvent(next); out = 'event'; }
    return out;
  };

  C.finishEvent = function () {
    const st = G.state, ev = st.event, s = ev.summary;
    const cal = st.calendar.find((c) => c.week === ev.calWeek);
    if (ev.type === 'meet') {
      st.league.stats = ev.stats;
      C.rep(s.wins * 0.3);
      st.morale = U.clamp(st.morale + (s.wins - s.losses) * 2, 5, 100);
      cal.done = true; cal.summary = s;
      C.news(ev.name + ': ' + s.record + ', now ranked ' + s.rank + ' of ' + s.of + ' in the league.');
      st.event = null;
      return;
    }
    const first = ev.type === 'qual' || ev.type === 'league';
    const mult = { qual: 1, league: 1, regional: 1.8, worlds: 3 }[ev.type];
    if (s.result === 'Winning Alliance') st.banners.push({ season: st.season, text: 'Winning Alliance', sub: ev.name });
    s.awards.forEach((a) => { if (a === 'Inspire Award' || a === 'Compass Award') st.banners.push({ season: st.season, text: a, sub: ev.name }); });
    let rep = { 'Winning Alliance': 4, Finalist: 3, Semifinalist: 1.5 }[s.result] || 0;
    s.awards.forEach((a) => { rep += a === 'Inspire Award' ? 3 : 2; });
    if (s.rank <= s.of / 4) rep += 1;
    C.rep(rep * mult);
    st.morale = U.clamp(st.morale + (rep ? 4 + rep : -4), 5, 100);
    if (s.seed > 0) st.flags[{ qual: 'playoffsQ', league: 'playoffsQ', regional: 'playoffsR', worlds: 'playoffsW' }[ev.type]] = true;
    if (ev.type === 'worlds' && s.result === 'Winning Alliance') st.flags.wonWorlds = true;
    if (s.advanced) {
      const flag = first ? 'qualRegional' : 'qualWorlds';
      if (!st.flags[flag]) {
        st.flags[flag] = true;
        const gift = first ? 500 : 2500;
        C.earn(gift);
        C.news('Qualified for the ' + (first ? 'Regional Championship' : 'World Championship') + '! Supporters chip in ' + U.money(gift) + '.');
      }
    }
    if (first) ev.advancing.forEach((id) => { const t = st.world.teams.find((x) => x.id === id); if (t) t.qr = true; });
    cal.done = true; cal.summary = s;
    C.news(ev.name + ': ranked ' + s.rank + ' of ' + s.of + ' (' + s.record + '), ' + s.result + (s.awards.length ? ', ' + s.awards.join(' + ') : '') + '.');
    st.event = null;
  };

  /* ---------- Finance & people ---------- */
  C.pitchChance = (o) => U.clamp(0.55 + (G.state.team.rep - o.minRep) / 35 + (C.skillAvg('biz') - 30) / 250, 0.05, 0.95);
  C.pitch = function (i) {
    const st = G.state, o = st.offers[i];
    if (!o || st.pitched) return null;
    st.pitched = true;
    st.offers.splice(i, 1);
    if (G.rand() < C.pitchChance(o)) {
      st.sponsors.push({ name: o.name, amount: o.amount });
      C.earn(o.amount);
      C.news(o.name + ' signs on as a sponsor: ' + U.money(o.amount) + '.');
      return true;
    }
    C.news(o.name + ' passes on sponsoring the team this year.');
    return false;
  };
  C.buy = function (id) {
    const st = G.state, f = D.FACILITIES.find((x) => x.id === id);
    if (!f || st.facilities[id] || st.team.money < f.cost) return false;
    C.pay(f.cost); st.facilities[id] = true;
    return true;
  };
  C.invite = function (i) {
    const st = G.state, m = st.mentorPool[i];
    if (!m || st.mentors.length >= C.mentorSlots() || st.team.rep < m.minRep) return false;
    st.mentors.push(m); st.mentorPool.splice(i, 1);
    C.news(m.name + ' joins as a ' + D.MENTOR_AREAS[m.area] + ' mentor.');
    return true;
  };
  C.dismiss = function (i) { const m = G.state.mentors.splice(i, 1)[0]; if (m && G.state.compass === m.name) G.state.compass = null; };
  /** One mentor per season can be put forward for the Compass Award. */
  C.nominate = function (i) { const m = G.state.mentors[i]; if (m) G.state.compass = m.name; };
  C.buyPerk = function (id) {
    const st = G.state, x = D.VENDOR.find((p) => p.id === id);
    if (!x || st.perks[id] || !st.vendor.includes(id) || st.team.money < x.cost) return false;
    C.pay(x.cost); st.perks[id] = true;
    return true;
  };

  /* ---------- Season review & rollover ---------- */
  C.makeReview = function () {
    const st = G.state, goal = D.GOALS[st.goal];
    const met = !!st.flags[goal.id] || (st.goal === 0 && st.flags.qualRegional);
    st.review = { goal: goal.text, met, grant: met ? goal.grant : 0, rep: met ? 6 : -3,
      graduating: st.students.filter((s) => s.grade >= 12).map((s) => s.name),
      events: st.calendar.filter((c) => c.done).map((c) => ({ name: c.name, s: c.summary })),
      income: st.ledger.income, spent: st.ledger.spent, champion: !!st.flags.wonWorlds,
      grade: st.flags.wonWorlds ? 'S' : st.flags.qualWorlds ? 'A' : st.flags.qualRegional ? 'B' : st.flags.playoffsQ ? 'C' : 'D' };
    st.phase = 'review';
  };

  C.nextSeason = function () {
    const st = G.state, r = st.review;
    st.history.push({ season: st.season, year: st.year, game: st.game, goal: r.goal, met: r.met, events: r.events, champion: r.champion });
    if (r.grant) C.earn(r.grant);
    C.rep(r.rep);
    st.ledger = { income: 0, spent: 0 };
    st.students = st.students.filter((s) => s.grade < 12);
    st.students.forEach((s) => { s.grade++; });
    const recruits = U.clamp(2 + Math.floor(st.team.rep / 25) + (st.awards.outreach > 50 ? 1 : 0), 2, Math.max(2, 15 - st.students.length));
    for (let i = 0; i < recruits && st.students.length < 15; i++) st.students.push(student(U.pick([9, 9, 9, 10]), 10, 32 + Math.floor(st.team.rep / 5)));
    const kept = [];
    st.sponsors.forEach((s) => {
      if (kept.length < 6 && G.rand() < 0.45 + st.team.rep / 300 + (r.met ? 0.15 : 0)) { kept.push(s); C.earn(s.amount); }
    });
    const lost = st.sponsors.length - kept.length;
    st.sponsors = kept;
    st.season++; st.year++; st.week = 1; st.phase = 'play'; st.kickoff = false; st.review = null;
    st.flags = {}; st.alloc = {}; st.overtime = false; st.pitched = false;
    st.awards = { portfolio: 0, outreach: Math.round(st.awards.outreach * 0.3) };
    st.practice = Math.round(st.practice * 0.35);
    st.robot = freshRobot();
    G.World.newSeason(st.world);
    setupSeason(st);
    C.news('Summer vendor launches are in: see Finance for this year\'s new products.');
    C.news('Season ' + st.season + ' begins. ' + recruits + ' new students join' + (r.graduating.length ? ', ' + r.graduating.length + ' graduated' : '') +
      '. ' + kept.length + ' sponsor' + (kept.length === 1 ? '' : 's') + ' renewed' + (lost ? ', ' + lost + ' left' : '') + '.');
  };
})(typeof window !== 'undefined' ? window.FTC : globalThis.FTC);
