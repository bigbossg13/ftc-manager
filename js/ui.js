/* FTC Manager — user interface: every screen is re-rendered from state */
(function (G) {
  'use strict';
  const U = G.U, D = G.Data, C = G.Career, E = G.Event, M = G.Match, V = G.MatchView;
  const UI = (G.UI = { tab: 'hq', need: null, live: null, liveDone: false, result: null, diff: 'normal', mode: 'career', format: 'qual', game: 'powerplay', name: 'Robo Rookies', num: 10000 + Math.floor(Math.random() * 20000) });
  const app = document.getElementById('app');
  const e = U.esc;

  /* ---------- small builders ---------- */
  const bar = (v, cls) => '<div class="bar ' + (cls || '') + '"><i style="width:' + U.clamp(v, 0, 100) + '%"></i></div>';
  const stat = (label, v, cls) => '<div class="stat"><span>' + label + '</span>' + bar(v, cls) + '<b class="num right">' + Math.round(v) + '</b></div>';
  const pips = (n, max) => '<span class="pips">' + Array.from({ length: max }, (_, i) => '<i class="' + (i < n ? 'f' : '') + '"></i>').join('') + '</span>';
  const btn = (label, a, v, o) => '<button class="' + ((o && o.cls) || '') + '" data-a="' + a + '"' + (v !== undefined ? ' data-v="' + e(v) + '"' : '') +
    (o && o.off ? ' disabled' : '') + (o && o.title ? ' title="' + e(o.title) + '"' : '') + '>' + label + '</button>';
  const seg = (a, cur, opts) => '<span class="seg">' + opts.map((o) => btn(o[1], a, o[0], { cls: cur === o[0] ? 'on' : '' })).join('') + '</span>';
  const planSeg = (k, opts) => '<span class="seg">' + opts.map((o) => btn(o[1], 'plan', k + ':' + o[0], { cls: G.state.plan[k] === o[0] ? 'on' : '' })).join('') + '</span>';
  const relCls = (v) => (v >= 75 ? 'g' : v >= 50 ? 'w' : 'r');
  const tname = (t) => '<b class="num">' + t.num + '</b> ' + e(t.name);

  const gameOpt = (g) => '<option value="' + g.id + '"' + (UI.game === g.id ? ' selected' : '') + '>' + g.name + (g.year ? ' (' + C.yearLabel(g.year) + ')' : '') + '</option>';

  const gameCard = (g) => '<button class="gamecard ' + (UI.game === g.id ? 'on' : '') + '" data-a="game" data-v="' + g.id + '"><canvas data-game="' + g.id + '"></canvas><b>' + g.name + '</b><span class="muted">' + (g.year ? C.yearLabel(g.year) : 'Simulated') + '</span></button>';

  /* ---------- menu ---------- */
  function menu() {
    return '<div class="menu"><div class="logo">FTC <span>MANAGER</span></div>' +
      '<p class="muted">Run a robotics team from the garage to the World Championship. You don\'t drive the robot. You build the program behind it.</p>' +
      (G.hasSave() ? '<div class="card" style="margin:14px 0"><div class="row spread"><b>Saved career found</b>' + btn('Continue', 'continue', undefined, { cls: 'primary' }) + '</div></div>' : '') +
      '<div class="card"><h2>New career</h2>' +
      '<div class="field"><label for="tn">Team name</label><input id="tn" type="text" maxlength="28" value="' + e(UI.name) + '"></div>' +
      '<div class="field"><label for="tnum">Team number</label><input id="tnum" type="number" min="1" max="99999" value="' + e(UI.num) + '"></div>' +
      '<div class="field"><label>Mode</label>' + seg('mode', UI.mode, [['career', 'Career'], ['single', 'Single season']]) +
      '<div class="muted" style="margin-top:6px">' + (UI.mode === 'career' ? D.CAREER_SEASONS + ' seasons: ' + D.REAL.map((g) => g.name).join(', ') + '.'
        : 'One season of the game you pick, graded S to D.') + '</div>' +
      (UI.mode === 'single' ? '<h3 style="margin-top:12px">FTC seasons</h3><div class="games">' + D.REAL.map(gameCard).join('') + '</div><h3 style="margin-top:12px">Simulated games</h3><div class="games">' + D.SIM.map(gameCard).join('') + '</div>' : '') + '</div>' +
      '<div class="field"><label>Region format</label>' + seg('format', UI.format, [['qual', 'Qualifiers'], ['league', 'League meets']]) +
      '<div class="muted" style="margin-top:6px">' + (UI.format === 'league' ? 'Three league meets with carried-over standings, then a League Tournament.' : 'Two qualifying tournaments, each with playoffs and awards.') + '</div></div>' +
      '<div class="field"><label>Starting situation</label>' +
      Object.keys(D.DIFFICULTY).map((k) => { const d = D.DIFFICULTY[k]; return '<button class="opt ' + (UI.diff === k ? 'on' : '') + '" data-a="diff" data-v="' + k + '"><b>' + d.name + '</b> · ' + U.money(d.money) + '<div class="muted">' + d.desc + '</div></button>'; }).join('') +
      '</div>' + btn('Start career', 'new', undefined, { cls: 'primary big' }) + '</div>' +
      '<p class="muted" style="margin-top:14px">An unofficial fan project. Not affiliated with or endorsed by <i>FIRST</i>. Real season games are simplified for the simulation.</p></div>';
  }

  /* ---------- chrome ---------- */
  function top() {
    const st = G.state, pend = C.pending();
    const tabs = [['hq', 'HQ'], ['inbox', 'Inbox' + (pend ? ' (' + pend + ')' : '')], ['build', 'Build'], ['skills', 'Skills'], ['team', 'Team'], ['sponsors', 'Sponsors'], ['inventory', 'Inventory'], ['shop', 'Shop'], ['workshop', 'Workshop'], ['season', 'Season']];
    if (st.event) tabs.push(['event', 'Event ●']);
    tabs.push(['help', 'How to play']);
    const adv = st.event ? btn('Go to event', 'tab', 'event', { cls: 'primary' })
      : st.phase === 'review' ? '' : btn('Advance ' + C.turn() + ' ▶', 'advance', undefined, { cls: 'primary' });
    return '<div class="top"><div class="top-in"><span class="badge">' + st.team.number + '</span><span class="teamname">' + e(st.team.name) + '</span>' +
      '<div class="kpis"><span class="kpi">' + (st.kickoff ? D.game(st.game).name + ' ' : '') + '<b>' + C.yearLabel(st.year) + '</b> · <b>' + C.dateLabel() + '</b></span>' +
      '<span class="kpi">Budget <b class="' + (st.team.money < 0 ? 'bad' : '') + '">' + U.money(st.team.money) + '</b></span>' +
      '<span class="kpi">Reputation <b>' + Math.round(st.team.rep) + '</b></span><span class="kpi">Morale <b>' + Math.round(st.morale) + '</b></span>' + adv + '</div></div>' +
      '<nav>' + tabs.map((t) => '<button class="' + (UI.tab === t[0] ? 'on' : t[0] === 'event' || (t[0] === 'inbox' && pend) ? 'alert' : '') + '" data-a="tab" data-v="' + t[0] + '">' + t[1] + '</button>').join('') + '</nav></div>';
  }

  function gameInfo(g) {
    return '<p>' + g.tagline + '</p><div class="scroll"><table>' +
      '<tr><th>Autonomous (0:30)</th><td>Leave or park: <b>+' + g.autoLeave + '</b>.' + (g.autoBonus ? ' ' + g.autoBonus.name + ': <b>+' + g.autoBonus.pts + '</b> (Auto ' + g.autoBonus.req + '+).' : '') + '</td></tr>' +
      '<tr><th>' + g.low.name + '</th><td><b>' + g.low.pts + '</b> per ' + g.element + ' (<b>' + M.autoPts(g, g.low) + '</b> in auto). Any robot can score here.</td></tr>' +
      '<tr><th>' + g.high.name + '</th><td>' + (g.high.pts ? '<b>' + g.high.pts + '</b> per ' + g.element + ' (<b>' + M.autoPts(g, g.high) + '</b> in auto).' : 'Counts toward the bonus below.') + ' Needs Scoring ' + g.high.req + '+.</td></tr>' +
      (g.set ? '<tr><th>Bonus</th><td>Every ' + g.set.size + ' ' + g.elements + ' your alliance scores: ' + g.set.name + ', <b>+' + g.set.bonus + '</b>.</td></tr>' : '') +
      g.end.map((x, i) => '<tr><th>' + (i ? '' : 'Endgame (last 0:30)') + '</th><td>' + x.name + ': <b>+' + x.pts + '</b>' + (x.req ? ' (Endgame ' + x.req + '+)' : '') + '</td></tr>').join('') +
      '</table></div><p class="muted" style="margin-top:8px">Scouting notes: ' + g.keys.join('. ') + '.</p>' +
      (g.note ? '<p class="muted">' + g.note + '</p>' : '') + (g.real ? '<p class="muted">A simplified model of the ' + C.yearLabel(g.year) + ' game.</p>' : '');
  }

  function perfCard() {
    const st = G.state, p = C.playerPerf();
    return '<div class="card c6"><h3>Robot</h3>' +
      (st.kickoff ? D.SUBS.map((s) => stat(s.stat, p[{ drive: 'speed', intake: 'intake', scorer: 'scorer', endgame: 'endgame', software: 'auto' }[s.id]])).join('') +
        stat('Reliability', p.rel, relCls(p.rel)) + stat('Drive team', p.driver, 'b')
        : '<p class="muted">The game is revealed at kickoff in September. Use the offseason to fundraise, sign sponsors, find mentors, stock up on parts and train students.</p>') + '</div>';
  }

  /* ---------- HQ ---------- */
  function hq() {
    const st = G.state, next = C.nextEvent(), goal = D.GOALS[st.goal];
    let up;
    if (st.event) up = '<h2>You are at the ' + st.event.name + '</h2><p class="muted">Matches are waiting.</p>' + btn('Go to event', 'tab', 'event', { cls: 'primary big' });
    else if (next) {
      const wk = next.week - st.week, free = C.hours() - C.used(), mo = D.MONTHS.length - st.month, pend = C.pending();
      up = '<h2>' + (st.kickoff ? 'Next: ' + next.name : (st.month < 2 ? 'Offseason' : 'Preseason') + ' · ' + C.dateLabel()) + '</h2>' +
        '<p>' + (st.kickoff ? next.name + ' in <b>' + wk + '</b> week' + (wk === 1 ? '' : 's') + ' (entry ' + U.money(next.fee) + ').'
          : 'Kickoff in <b>' + mo + '</b> month' + (mo === 1 ? '' : 's') + '. Each offseason turn is one month; once the game is revealed you plan week by week. Hours on projects and skills carry over from turn to turn until they finish; one-off jobs such as testing, practice and fundraising start each turn at zero.') + '</p>' +
        (pend ? '<p class="warn">' + pend + ' decision' + (pend === 1 ? ' is' : 's are') + ' waiting in your inbox. ' + btn('Open inbox', 'tab', 'inbox', { cls: 'small' }) + '</p>' : '') +
        '<p>Team hours assigned this ' + C.turn() + ': <b>' + C.used() + ' / ' + C.hours() + ' h</b>' + (free ? ' <span class="warn">(' + free + ' h idle)</span>' : '') + '</p>' + hoursBar(false) +
        '<div class="row" style="margin-top:12px">' + btn('Plan the ' + C.turn(), 'tab', 'build') + btn('Advance ' + C.turn() + ' ▶', 'advance', undefined, { cls: 'primary big' }) + '</div>';
    } else up = '<h2>Season complete</h2><p class="muted">No more events for the team this season.</p>' + btn('Go to season review ▶', 'advance', undefined, { cls: 'primary big' });
    return '<div class="grid"><div class="card c8 hl">' + up + '</div>' +
      '<div class="card c4"><h3>Season goal</h3><p>' + goal.text + '</p><p class="muted">Meet it for a ' + U.money(goal.grant) + ' grant and a reputation boost. Goals get harder as your reputation grows.</p>' +
      (st.flags[goal.id] ? '<span class="tag a">Achieved</span>' : '') + '</div>' +
      perfCard() +
      '<div class="card c6"><h3>News</h3><ul class="news">' + st.news.map((n) => '<li><span>S' + n.s + ' ' + n.d + '</span>' + e(n.text) + '</li>').join('') + '</ul></div></div>';
  }

  /* ---------- Workshop ---------- */
  function stepper(id) {
    const st = G.state, n = st.alloc[id] || 0, lock = C.locked(id);
    if (lock) return '<span class="muted">' + lock + '</span>';
    return '<span class="step">' + btn('−', 'alloc', id + ':-5', { off: n <= 0, title: 'Remove 5 hours' }) +
      '<input class="hrs" type="number" min="0" step="1" inputmode="numeric" aria-label="Hours" data-c="hours" data-v="' + id + '" value="' + n + '"><span class="muted">h</span>' +
      btn('+', 'alloc', id + ':5', { off: C.used() >= C.hours(), title: 'Add 5 hours' }) + '</span>';
  }
  const ACT_COLORS = { research: '#ffffff', drive: '#f57e25', intake: '#f0c33d', scorer: '#e5484d', endgame: '#d6409f', software: '#8e6cf0', test: '#3e7bfa', practice: '#2bb8c4', portfolio: '#46c37b', outreach: '#9bd44a', fundraise: '#c9a36b', training: '#9aa5b8' };
  const actName = (id) => (id === 'research' ? 'Skill Development' : (D.sub(id) || D.ACTS.find((a) => a.id === id)).name);
  /** The week's team hours as one stacked bar, a segment per job. */
  function hoursBar(legend) {
    const st = G.state, total = C.hours() || 1, free = C.hours() - C.used();
    const hrs = (id) => (id === 'research' ? C.studyHours() : st.alloc[id] || 0);
    const ids = Object.keys(ACT_COLORS).filter((id) => hrs(id) > 0);
    return '<div class="hbar" role="img" aria-label="Team hours this ' + C.turn() + '">' + ids.map((id) => '<i style="width:' + hrs(id) / total * 100 + '%;background:' + ACT_COLORS[id] + '" title="' + actName(id) + ': ' + hrs(id) + ' h">' + (hrs(id) / total > 0.07 ? hrs(id) + 'h' : '') + '</i>').join('') +
      (free > 0 ? '<i class="free" style="width:' + free / total * 100 + '%" title="Idle: ' + free + ' h">' + (free / total > 0.1 ? free + 'h idle' : '') + '</i>' : '') + '</div>' +
      (legend ? '<div class="hlegend">' + ids.map((id) => '<span><i style="background:' + ACT_COLORS[id] + '"></i>' + actName(id) + ' ' + hrs(id) + ' h</span>').join('') + (free > 0 ? '<span><i class="free"></i>Idle ' + free + ' h</span>' : '') + '</div>' : '');
  }
  const projHours = (id) => { const std = C.baseHours(id), mine = C.levelWork(id); return mine < std ? mine + ' h (standard ' + std + ' h)' : std + ' h project'; };
  function build() {
    const st = G.state;
    const effRow = [['mech', 'Mechanical', 'drive'], ['soft', 'Software', 'software'], ['drive', 'Driving', 'practice'], ['biz', 'Business', 'outreach']].map((x) => '<span class="tag">' + x[1] + ' ×' + C.eff(x[2]).toFixed(2) + '</span>').join(' ');
    const subs = D.SUBS.map((s) => {
      const r = st.robot.subs[s.id], c = C.concept(s.id), n = st.alloc[s.id] || 0;
      let proj;
      if (r.active) {
        const need = C.levelWork(s.id), eta = n ? Math.ceil((need - r.progress) / (n * C.eff(s.id))) : 0;
        proj = '<div>Building level ' + (r.level + 1) + '</div>' + bar(r.progress / need * 100) + '<div class="muted">' + Math.floor(r.progress) + ' / ' + need + ' h' + (n ? ' · about ' + eta + ' wk' : ' · no hours assigned') + '</div>';
      } else {
        const why = C.canUpgrade(s.id);
        const need = C.recipe(s.id), short = C.missing(s.id), cost = C.levelCost(s.id);
        proj = why === 'Maxed out' ? '<span class="tag a">Maxed out</span>' : btn('Start level ' + (r.level + 1) + ' · ' + (cost ? 'buy parts ' + U.money(cost) : 'parts in stock'), 'upgrade', s.id, { off: !!why, title: why, cls: why ? '' : 'primary' }) +
          '<div class="muted">' + (why && why !== 'In progress' ? why : projHours(s.id)) + '</div>' +
          '<div class="muted">Needs ' + Object.keys(need).map((id) => '<span class="' + (short[id] ? 'warn' : '') + '">' + need[id] + '× ' + D.part(id).name + '</span>').join(', ') + '</div>';
      }
      return '<tr><td><b><i class="dot" style="background:' + ACT_COLORS[s.id] + '"></i>' + s.name + '</b><div class="muted">' + s.stat + ' ' + C.stat(s.id) + '</div></td>' +
        '<td><select data-c="concept" data-v="' + s.id + '">' + s.concepts.map((x) => { const lock = C.conceptLocked(x.id); return '<option value="' + x.id + '"' + (x.id === c.id ? ' selected' : '') + (lock ? ' disabled' : '') + '>' + C.conceptName(s.id, x) + (lock ? ' (needs ' + lock + ')' : ' (max ' + (x.base + x.per * x.max) + ')') + '</option>'; }).join('') + '</select><div class="muted">' + c.desc + '</div></td>' +
        '<td>' + pips(r.level, c.max) + '<div class="muted">Level ' + r.level + ' / ' + c.max + '</div></td><td style="min-width:170px">' + proj + '</td><td class="right">' + stepper(s.id) + '</td></tr>';
    }).join('');
    const acts = D.ACTS.map((a) => {
      const per = C.eff(a.id) * 10;
      const fx = a.id === 'training' ? 'about 3 skill gains' : a.id === 'fundraise' ? 'half rate beyond ' + C.fundCap() + ' h; +' + U.money(C.fundPerHour() * 10) : '+' + (per * C.RATE[a.id]).toFixed(1) + ' ' + { test: 'reliability', practice: 'practice', portfolio: 'portfolio', outreach: 'outreach' }[a.id];
      return '<tr><td><b><i class="dot" style="background:' + ACT_COLORS[a.id] + '"></i>' + a.name + '</b><div class="muted">' + a.desc + '</div></td><td class="muted">' + fx + ' per 10 h' + '</td><td class="right">' + stepper(a.id) + '</td></tr>';
    }).join('');
    const studyRow = '<tr><td><b><i class="dot" style="background:' + ACT_COLORS.research + '"></i>Skill Development</b><div class="muted">Study toward the team skill tree.</div></td><td class="muted">' + C.studyHours() + ' h assigned</td><td class="right">' + btn('Open Skills', 'tab', 'skills', { cls: 'small' }) + '</td></tr>';
    return '<div class="grid"><div class="card c12"><div class="row spread"><div><h2>This ' + C.turn() + '\'s plan</h2><span class="muted">Team hours assigned: </span><b>' + C.used() + ' / ' + C.hours() + ' h</b></div>' +
      (C.inPre() ? '<span class="tag">Offseason month: ' + D.HOURS.perStudentMonth + ' h per student + ' + D.HOURS.monthBase + '</span>' : '<div class="row"><span class="muted">Overtime (+18 h, costs morale)</span>' + seg('overtime', st.overtime ? '1' : '0', [['0', 'Off'], ['1', 'On']]) + '</div>') + '</div>' + hoursBar(true) +
      '<p class="muted" style="margin-top:10px">Type hours into any job, or use − and + for steps of 5. Projects and skills keep their hours until they finish; other jobs reset each turn. Efficiency is how much standard work one of your hours gets done: ' + effRow + '</p></div>' +
      '<div class="card c12"><h3>Robot' + (st.kickoff ? ' · ' + D.game(st.game).name : '') + '</h3><div class="scroll"><table><tr><th>Subsystem</th><th>Design concept</th><th>Level</th><th>Project</th><th class="right">Hours this ' + C.turn() + '</th></tr>' + subs + '</table></div>' +
      '<p class="muted" style="margin-top:8px">The drivetrain can be started in the offseason, before the game is known; everything else waits for kickoff. Advanced concepts need a skill from the Skills page first. Changing a concept halves that subsystem\'s level. Experience with a concept carries into future seasons and makes it quicker to build.</p></div>' +
      '<div class="card c8"><h3>Other work</h3><div class="scroll"><table>' + acts + studyRow + '</table></div></div>' +
      '<div class="card c4"><h3>Readiness</h3>' + stat('Reliability', st.robot.rel, relCls(st.robot.rel)) + stat('Practice', st.practice, 'b') + stat('Portfolio', st.awards.portfolio, 'g') + stat('Outreach', st.awards.outreach, 'g') +
      '<p class="muted" style="margin-top:8px">Unreliable robots jam, brown out or drop off the field entirely. Judges read the portfolio and outreach record for awards.</p></div></div>';
  }

  /* ---------- Skills ---------- */
  function skills() {
    const t = C.tree(), study = C.studyHours(), free = C.hours() - C.used();
    const learned = D.SKILLS.filter((k) => t.done[k.id]).length;
    const cols = Object.keys(D.BRANCHES).map((b) => '<div class="branch"><h3>' + D.BRANCHES[b] + ' <span class="tag">×' + C.eff(C.skillKey(D.SKILLS.find((k) => k.branch === b).id)).toFixed(2) + '</span></h3>' + D.SKILLS.filter((k) => k.branch === b).map((k) => {
      const key = C.skillKey(k.id), done = t.done[k.id], lock = C.skillLocked(k.id), prog = t.progress[k.id] || 0, n = G.state.alloc[key] || 0;
      const eta = n ? Math.ceil((k.hours - prog) / (n * C.eff(key))) : 0;
      return '<div class="node ' + (done ? 'done' : n ? 'cur' : lock ? 'lock' : '') + (k.req ? ' child' : '') + '"><b>' + k.name + '</b><div class="muted">' + k.desc + '</div>' +
        (done ? '<span class="tag a">Learned</span>'
          : '<div class="muted" style="margin-top:6px">' + Math.floor(prog) + ' / ' + k.hours + ' h' + (n ? ' · about ' + eta + ' ' + C.turn() + (eta === 1 ? '' : 's') : '') + '</div>' + bar(prog / k.hours * 100) +
            '<div style="margin-top:8px">' + (lock ? '<span class="tag">' + lock + '</span>' : stepper(key)) + '</div>') + '</div>';
    }).join('') + '</div>').join('');
    return '<div class="grid"><div class="card c12"><div class="row spread"><div><h2>Skill development</h2><span class="muted">' + learned + ' of ' + D.SKILLS.length + ' skills learned. Give hours to any skill that is open, as many at once as you like, in or out of season.</span></div>' +
      '<div class="right"><b>' + study + ' h</b> on skills this ' + C.turn() + '<div class="muted">' + free + ' h unassigned</div></div></div>' + hoursBar(false) +
      '<p class="muted" style="margin-top:10px">Each skill has a standard number of hours. The multiplier beside each branch is your efficiency there: how much of that one of your hours gets done.</p></div>' +
      '<div class="card c12"><div class="tree">' + cols + '</div></div></div>';
  }

  /* ---------- Team ---------- */
  function team() {
    const st = G.state, dt = st.driveTeam;
    const rows = st.students.slice().sort((a, b) => b.grade - a.grade).map((s) =>
      '<tr><td><b>' + e(s.name) + '</b></td><td>Grade ' + s.grade + (s.grade === 12 ? ' <span class="tag">senior</span>' : '') + '</td>' +
      ['mech', 'soft', 'drive', 'biz'].map((k) => '<td><span class="num">' + Math.round(s[k]) + '</span>' + bar(s[k]) + '</td>').join('') +
      '<td class="right"><select data-c="role" data-v="' + s.id + '"><option value="">-</option>' + C.ROLES.map((r) => '<option value="' + r + '"' + (dt[r] === s.id ? ' selected' : '') + '>' + C.ROLE_NAMES[r] + '</option>').join('') + '</select></td></tr>').join('');
    const mentors = st.mentors.map((m, i) => '<tr><td><b>' + e(m.name) + '</b><div class="muted">' + D.MENTOR_AREAS[m.area] + '</div></td><td>' + pips(m.skill, 5) + '</td><td class="muted">+' + m.skill * 6 + '%<div>' + U.money(m.cost || 0) + ' / season</div></td><td class="right">' + (st.compass === m.name ? '<span class="tag a">Compass nominee</span> ' : btn('Nominate for Compass', 'nominate', i, { cls: 'small' }) + ' ') + btn('Part ways', 'dismiss', i, { cls: 'small' }) + '</td></tr>').join('');
    const full = st.mentors.length >= C.mentorSlots();
    const pool = st.mentorPool.map((m, i) => {
      const why = full ? 'No free mentor slot' : st.team.rep < m.minRep ? 'Needs reputation ' + m.minRep : st.team.money < m.cost ? 'Not enough money' : '';
      return '<tr><td><b>' + e(m.name) + '</b><div class="muted">' + D.MENTOR_AREAS[m.area] + '</div></td><td>' + pips(m.skill, 5) + '</td><td class="right">' + btn('Bring on · ' + U.money(m.cost), 'invite', i, { off: !!why, cls: 'small' }) + (why ? '<div class="muted">' + why + '</div>' : '') + '</td></tr>';
    }).join('');
    return '<div class="grid"><div class="card c12"><h3>Students (' + st.students.length + ') · drive team rating ' + C.driverSkill() + '</h3><div class="scroll"><table><tr><th>Name</th><th>Year</th><th>Mechanical</th><th>Software</th><th>Driving</th><th>Business</th><th class="right">Drive team</th></tr>' + rows + '</table></div>' +
      '<p class="muted" style="margin-top:8px">The drive team is four students: driver, operator, drive coach and human player. The six best students in a skill set the pace for that kind of work. Seniors graduate at the end of the season; outreach and reputation bring in recruits.</p></div>' +
      '<div class="card c6"><h3>Mentors (' + st.mentors.length + ' / ' + C.mentorSlots() + ')</h3>' + (mentors ? '<table>' + mentors + '</table>' : '<p class="muted">No mentors yet. Volunteers speed up work in their area.</p>') + '<p class="muted" style="margin-top:8px">Mentors volunteer their time, but the team covers their travel, training and screening each season, billed when they join and again every offseason. Nominate one for the Compass Award, judged at tournaments on their skill and your outreach record.</p></div>' +
      '<div class="card c6"><h3>Mentors available</h3>' + (pool ? '<table>' + pool + '</table>' : '<p class="muted">Nobody else is available this season.</p>') + '</div></div>';
  }

  /* ---------- Sponsors ---------- */
  function sponsors() {
    const st = G.state;
    const offers = st.offers.map((o, i) => '<tr><td><b>' + e(o.name) + '</b></td><td class="num">' + U.money(o.amount) + '</td><td class="num">' + Math.round(C.pitchChance(o) * 100) + '%</td><td class="right">' + btn('Pitch', 'pitch', i, { off: st.pitched, cls: 'small primary' }) + '</td></tr>').join('');
    return '<div class="grid"><div class="card c4"><h3>Budget this season</h3><table><tr><td>Budget</td><td class="right num"><b>' + U.money(st.team.money) + '</b></td></tr><tr><td>Income</td><td class="right num good">' + U.money(st.ledger.income) + '</td></tr><tr><td>Spent</td><td class="right num bad">' + U.money(st.ledger.spent) + '</td></tr></table>' +
      '<h3 style="margin-top:14px">Current sponsors</h3>' + (st.sponsors.length ? '<table>' + st.sponsors.map((s) => '<tr><td>' + e(s.name) + '</td><td class="right num">' + U.money(s.amount) + '</td></tr>').join('') + '</table>' : '<p class="muted">None yet.</p>') +
      '<p class="muted" style="margin-top:8px">Sponsors pay once per season. Most renew if you keep your reputation up and meet your goal.</p></div>' +
      '<div class="card c8"><h3>Sponsor prospects</h3>' + (offers ? '<div class="scroll"><table><tr><th>Company</th><th>Offer</th><th>Chance</th><th></th></tr>' + offers + '</table></div>' : '<p class="muted">No prospects left this season.</p>') +
      '<p class="muted" style="margin-top:8px">One pitch per ' + C.turn() + (st.pitched ? ' (done for this ' + C.turn() + ')' : '') + '. A failed pitch closes that door until next season. Reputation and business skills improve your odds.</p></div></div>';
  }

  /* ---------- Inventory ---------- */
  function inventory() {
    const st = G.state, planned = {};
    D.SUBS.forEach((s) => { const r = st.robot.subs[s.id]; if (!r.active && r.level < C.concept(s.id).max) { const need = C.recipe(s.id); Object.keys(need).forEach((id) => { planned[id] = (planned[id] || 0) + need[id]; }); } });
    const rows = D.PARTS.map((p) => { const have = st.inventory[p.id] || 0, need = planned[p.id] || 0;
      return '<tr><td><b>' + p.name + '</b>' + (p.desc ? '<div class="muted">' + p.desc + '</div>' : '') + '</td><td class="num right"><b>' + have + '</b></td><td class="num right">' + (st.robot.used[p.id] || 0) + '</td><td class="num right ' + (need > have ? 'warn' : '') + '">' + need + '</td><td class="num right">' + U.money(C.partPrice(p.id)) + '</td><td class="num right">' + (C.stock(p.id) || '<span class="tag s">Sold out</span>') + '</td></tr>'; }).join('');
    const value = D.PARTS.reduce((a, p) => a + (st.inventory[p.id] || 0) * p.price, 0);
    return '<div class="grid"><div class="card c8"><h3>Parts inventory</h3><div class="scroll"><table><tr><th>Part</th><th class="right">In stock</th><th class="right">On the robot</th><th class="right">Next upgrades need</th><th class="right">Shop price</th><th class="right">At vendors</th></tr>' + rows + '</table></div>' +
      '<p class="muted" style="margin-top:8px">"Next upgrades need" adds up the next level of every subsystem you have not started yet. Stock worth ' + U.money(value) + ' at list price.</p>' +
      '<div class="row">' + btn('Go to the shop', 'tab', 'shop') + '</div></div>' +
      '<div class="card c4"><h3>How parts work</h3><p class="muted">Starting an upgrade takes its parts from here and buys whatever is missing at the current shop price.</p><p class="muted">Parts cost ' + Math.round(D.IN_SEASON_MARKUP * 100) + '% more during the season and can sell out, so buying ahead in the offseason saves money and delays.</p><p class="muted">At the end of the season half of the parts on the robot are salvaged back into stock. Unused parts stay with the team.</p></div></div>';
  }

  /* ---------- Shop ---------- */
  function shop() {
    const st = G.state;
    const parts = D.PARTS.map((p) => { const price = C.partPrice(p.id);
      const left = C.stock(p.id);
      return '<tr><td><b>' + p.name + '</b>' + (p.desc ? '<div class="muted">' + p.desc + '</div>' : '') + '</td><td class="num right">' + U.money(price) + '</td><td class="num right">' + (left ? left : '<span class="tag s">Sold out</span>') + '</td><td class="num right">' + (st.inventory[p.id] || 0) + '</td><td class="right"><span class="seg">' +
        [1, 5, 10].map((n) => btn('+' + n, 'part', p.id + ':' + n, { off: st.team.money < price * n || left < n, title: left < n ? 'Only ' + left + ' left at the vendors' : 'Buy ' + n + ' for ' + U.money(price * n) })).join('') + '</span></td></tr>'; }).join('');
    const vend = C.vendorOpen() ? '<div class="scroll"><table>' + st.vendor.map((id) => { const x = D.VENDOR.find((p) => p.id === id); return '<tr><td><b>' + x.name + '</b> <span class="muted">' + x.vendor + '</span><div class="muted">' + x.desc + '</div></td><td class="right">' +
        (st.perks[id] ? '<span class="tag a">In use</span>' : btn(U.money(x.cost), 'perk', id, { off: st.team.money < x.cost, cls: 'small' })) + '</td></tr>'; }).join('') + '</table></div><p class="muted" style="margin-top:8px">Good for this season only: next year\'s game needs next year\'s products.</p>'
      : '<p class="muted">Vendors announce this year\'s products in ' + D.MONTHS[D.VENDOR_MONTH] + '.</p>';
    return '<div class="grid"><div class="card c7"><div class="row spread"><h3>Parts</h3><span class="tag ' + (C.inPre() ? 'a' : '') + '">' + (C.inPre() ? 'Offseason: list price' : 'In season: +' + Math.round(D.IN_SEASON_MARKUP * 100) + '% rush shipping') + '</span></div>' +
      '<div class="scroll"><table><tr><th>Part</th><th class="right">Price</th><th class="right">At vendors</th><th class="right">You have</th><th class="right">Buy</th></tr>' + parts + '</table></div>' +
      '<p class="muted" style="margin-top:8px">' + (C.inPre() ? 'Shelves are full all offseason. Once the game is revealed every team orders at once: stock halves at kickoff and parts can sell out for a week at a time.' : 'Each week a part either sells out or is partly restocked. Sell-outs are most common in the first ' + D.SELLOUT.rushWeeks + ' weeks after kickoff.') + '</p></div>' +
      '<div class="card c5"><h3>New from vendors</h3>' + vend + '</div>' +
      '<div class="card c12"><div class="row spread"><h3>Season field kit</h3><span class="tag ' + (C.inPre() ? 'a' : '') + '">' + (C.inPre() ? 'Preorder price: ships at kickoff' : 'After kickoff: +' + Math.round(D.FIELD_MARKUP * 100) + '%, ' + D.FIELD_DELAY + ' weeks to arrive') + '</span></div>' +
      '<div class="scroll"><table>' + Object.keys(D.FIELD_KITS).map((type) => { const k = D.FIELD_KITS[type], mine = st.fieldKit && st.fieldKit.type === type, why = C.canBuyKit(type), b = k.bonus;
        return '<tr><td><b>' + k.name + '</b><div class="muted">' + k.desc + '. +' + Math.round(b.practice * 100) + '% driver practice and testing, +' + Math.round(b.software * 100) + '% software.</div></td><td class="right">' +
          (mine ? '<span class="tag a">' + (C.kitActive() ? 'In the workshop' : st.kickoff ? 'Arrives week ' + st.fieldKit.arrives : 'Preordered') + '</span>'
            : st.fieldKit && st.fieldKit.type === 'full' ? '<span class="muted">Covered by the full set</span>'
            : btn((st.fieldKit ? 'Upgrade · ' : C.inPre() ? 'Preorder · ' : 'Order · ') + U.money(C.kitPrice(type)), 'kit', type, { off: !!why, title: why, cls: 'small' })) + '</td></tr>'; }).join('') + '</table></div>' +
      '<p class="muted" style="margin-top:8px">The game elements for the coming season, to practise and tune on. They are specific to one game, so a kit lasts one season' + (C.inPre() ? ', and you are ordering before you know what the game is' : '') + '. The field perimeter on the Workshop page is separate and permanent.</p></div></div>';
  }

  /* ---------- Workshop: space and equipment ---------- */
  function workshop() {
    const st = G.state, pct = (v) => (v ? '<b class="good">+' + Math.round(v * 100) + '%</b>' : '<span class="muted">none</span>');
    const fac = D.FACILITIES.map((f) => '<tr><td><b>' + f.name + '</b><div class="muted">' + f.desc + '</div></td><td class="right">' +
      (st.facilities[f.id] ? '<span class="tag a">Owned</span>' : btn(U.money(f.cost), 'buy', f.id, { off: st.team.money < f.cost, cls: 'small' })) + '</td></tr>').join('');
    const owned = D.FACILITIES.filter((f) => st.facilities[f.id]).length;
    return '<div class="grid"><div class="card c7"><h3>Equipment (' + owned + ' of ' + D.FACILITIES.length + ' owned)</h3><div class="scroll"><table>' + fac + '</table></div>' +
      '<p class="muted" style="margin-top:8px">Equipment is bought once and stays with the team for good.</p></div>' +
      '<div class="card c5"><h3>What your workshop gives you</h3><table>' +
      '<tr><td>Team hours</td><td class="right"><b>' + C.hours() + ' h</b> this ' + C.turn() + '</td></tr>' +
      '<tr><td>Mentor slots</td><td class="right"><b>' + C.mentorSlots() + '</b></td></tr>' +
      '<tr><td>Building</td><td class="right">' + pct(C.facBonus('drive')) + '</td></tr>' +
      '<tr><td>Software</td><td class="right">' + pct(C.facBonus('software')) + '</td></tr>' +
      '<tr><td>Season field kit</td><td class="right">' + (st.fieldKit ? D.FIELD_KITS[st.fieldKit.type].name.replace(' Game Set', '') + (C.kitActive() ? '' : ' <span class="muted">(on order)</span>') : '<span class="muted">none</span>') + '</td></tr>' +
      '<tr><td>Testing and driver practice</td><td class="right">' + pct(C.facBonus('test')) + '</td></tr>' +
      '<tr><td>Portfolio</td><td class="right">' + pct(C.facBonus('portfolio')) + '</td></tr>' +
      '<tr><td>Outreach and fundraising</td><td class="right">' + pct(C.facBonus('outreach')) + '</td></tr></table>' +
      '<p class="muted" style="margin-top:8px">These bonuses are already included in the efficiency figures on the Build page.</p></div></div>';
  }

  /* ---------- Inbox ---------- */
  function inbox() {
    const st = G.state;
    const list = st.inbox.map((m) => {
      const opts = C.msgOptions(m);
      let foot = '';
      if (!m.done) foot = '<div class="choices">' + opts.map((o, i) => { const fx = C.fxText(o.fx), ok = C.canChoose(o);
        return '<button class="choice" data-a="decide" data-v="' + m.id + ':' + i + '"' + (ok ? '' : ' disabled') + '><b>' + o.label + '</b><span class="muted">' + (ok ? (fx || 'No effect') + (o.risk ? (fx ? ' · ' : '') + Math.round(o.risk.p * 100) + '% chance it works out' : '') : 'Not enough money') + '</span></button>'; }).join('') + '</div>';
      else if (!m.info) foot = '<p class="muted" style="margin:8px 0 0">You chose: <b>' + opts[m.choice].label + '</b>' + (C.fxText(opts[m.choice].fx) ? ' (' + C.fxText(opts[m.choice].fx) + ')' : '') + (m.result ? ' ' + e(m.result) : '') + '</p>';
      return '<div class="card msg ' + (m.done ? '' : 'hl') + '"><div class="row spread"><b>' + e(C.msgText(m, 'title')) + '</b><span class="muted">S' + m.season + ' ' + m.date + '</span></div><div class="muted">From: ' + e(C.msgText(m, 'from')) + '</div><p style="margin:8px 0 0">' + e(C.msgText(m, 'body')) + '</p>' + foot + '</div>';
    }).join('');
    return '<div style="max-width:760px"><p class="muted">Decisions marked in orange need an answer before the calendar can move on.</p>' + (list || '<div class="card">Nothing yet.</div>') + '</div>';
  }

  /* ---------- Offseason events (shown on the Season page) ---------- */
  function offCard() {
    const st = G.state;
    if (!st.lastRobot) return '<div class="card c12"><h3>Offseason events</h3><p class="muted">Summer tournaments are played with last season\'s robot. Your team does not have one yet, so these open up after your first season.</p></div>';
    const rows = D.OFFSEASON.map((info) => {
      const o = st.offseason.find((x) => x.id === info.id), why = C.offLocked(info.id), s = o && o.summary;
      return '<tr><td><b>' + info.name + '</b><div class="muted">' + info.desc + '</div></td><td>' + D.MONTHS[info.month] + '</td><td class="num">' + U.money(info.fee) + '</td><td class="right">' +
        (s ? 'Rank ' + s.rank + '/' + s.of + ' · ' + s.result : !why ? btn('Sign up', 'offseason', info.id, { cls: 'small primary' }) : '<span class="tag ' + (why === 'Registered' ? 'a' : '') + '">' + why + '</span>') + '</td></tr>';
    }).join('');
    return '<div class="card c12"><h3>Offseason events</h3><div class="scroll"><table><tr><th>Event</th><th>Month</th><th>Entry</th><th></th></tr>' + rows + '</table></div>' +
      '<p class="muted" style="margin-top:8px">Played with last season\'s robot in ' + D.game(st.lastRobot.game).name + ', with this year\'s drive team. Sign up before the month it is held. Each one costs a weekend of team hours and gives the drive team practice and experience; a win hangs a banner.</p></div>';
  }

  /* ---------- Season ---------- */
  function season() {
    const st = G.state, next = C.nextEvent();
    const cal = st.calendar.map((c) => {
      const s = c.summary, off = c.need && !st.flags[c.need] && !c.done;
      return '<div class="' + (c === next ? 'next' : off ? 'off' : '') + '"><div class="muted">Week ' + c.week + '</div><b>' + c.name + '</b><div class="muted">' +
        (s ? 'Rank ' + s.rank + '/' + s.of + ' · ' + s.record + '<br>' + s.result + (s.awards.length ? '<br>' + s.awards.join(', ') : '') + (s.advanced ? '<br><span class="good">Advanced</span>' : '')
          : off ? 'Must qualify' : 'Entry ' + U.money(c.fee)) + '</div></div>';
    }).join('');
    const grade = (r) => (r >= 78 ? 'A+' : r >= 66 ? 'A' : r >= 54 ? 'B' : r >= 42 ? 'C' : r >= 30 ? 'D' : 'E');
    const rivals = st.world.teams.slice().sort((a, b) => b.rating - a.rating).slice(0, 20).map((t) => '<tr><td>' + tname(t) + '</td><td>' + grade(t.rating) + '</td><td>' + (t.qr ? '<span class="tag a">Regional</span>' : '') + '</td></tr>').join('');
    const hist = st.history.slice().reverse().map((h) => '<tr><td>Season ' + h.season + '</td><td>' + D.game(h.game).name + '</td><td>' + h.events.map((x) => x.name.replace(' Championship', '') + ': ' + x.s.result).join(' · ') + (h.champion ? ' 🏆' : '') + '</td><td>' + (h.met ? '<span class="good">Goal met</span>' : '<span class="muted">Goal missed</span>') + '</td></tr>').join('');
    return '<div class="grid"><div class="card c12"><h3>Season ' + st.season + ' (' + C.yearLabel(st.year) + ') calendar</h3><div class="timeline"><div class="' + (st.kickoff ? '' : 'next') + '"><div class="muted">September</div><b>Kickoff</b><div class="muted">' + (st.kickoff ? D.game(st.game).name : 'Game reveal') + '</div></div>' + cal + '</div></div>' +
      '<div class="card c7"><h3>The game</h3>' + (st.kickoff ? '<h2>' + D.game(st.game).name + '</h2>' + gameInfo(D.game(st.game)) : '<p class="muted">Revealed at kickoff.</p>') + '</div>' +
      '<div class="card c5"><h3>Top programs in your region</h3><div class="scroll"><table><tr><th>Team</th><th>Strength</th><th></th></tr>' + rivals + '</table></div></div>' +
      offCard() +
      '<div class="card c12"><h3>Banners</h3>' + (st.banners.length ? '<div class="banners">' + st.banners.map((b) => '<div class="banner"><b>' + b.text + '</b><span>' + b.sub + '</span><span>Season ' + b.season + '</span></div>').join('') + '</div>' : '<p class="muted">Win an event, the Inspire Award or the Compass Award to hang a banner here.</p>') + '</div>' +
      (hist ? '<div class="card c12"><h3>Team history</h3><div class="scroll"><table>' + hist + '</table></div></div>' : '') + '</div>';
  }

  /* ---------- Event ---------- */
  function ensureNeed() {
    if (G.state.event && !UI.need && !UI.live && !UI.result) { UI.need = E.advance(G.state.event); G.save(); }
  }
  function allianceCard(ev, ids, side) {
    return '<div class="al-card ' + (side ? 'b' : '') + '"><h3 class="' + (side ? 'bluec' : 'redc') + '">' + (side ? 'Blue' : 'Red') + ' alliance</h3>' + ids.map((id) => {
      const t = E.team(ev, id), s = ev.stats[id];
      return '<div style="margin:6px 0">' + tname(t) + (t.isPlayer ? ' <span class="tag a">you</span>' : '') + '<div class="muted">' + s.w + '-' + s.l + '-' + s.t + ' · avg ' + (s.n ? E.avg(ev, id).toFixed(0) + ' pts' : 'unknown') + '</div></div>';
    }).join('') + '</div>';
  }
  function scoreHead(r, b, sub) {
    return '<div class="score"><div class="al r"><div class="pts" id="sc-r">' + r + '</div><div>' + sub[0] + '</div></div><div class="clock"><b id="clock">2:30</b><div class="muted" id="phase">READY</div></div><div class="al b"><div class="pts" id="sc-b">' + b + '</div><div>' + sub[1] + '</div></div></div>';
  }
  const nums = (ev, ids) => ids.map((id) => E.team(ev, id).num).join(' · ');

  function eventMain(ev) {
    const st = G.state, g = D.game(ev.game || st.game);
    if (UI.live) {
      const m = UI.live.match, p = V.player() || UI.live.m.robots.find((r) => r.isPlayer);
      return '<h2>' + m.label + '</h2>' + scoreHead(0, 0, [nums(ev, m.red), nums(ev, m.blue)]) + '<canvas id="field"></canvas>' +
        '<div class="row spread" style="margin:10px 0"><div class="row"><span class="muted">Speed</span>' + seg('speed', String(V.speed), [['1', '1×'], ['2', '2×'], ['4', '4×'], ['8', '8×']]) + btn('Skip to end', 'skip', undefined, { off: UI.liveDone }) + '</div>' +
        (UI.liveDone ? btn('Continue ▶', 'finishLive', undefined, { cls: 'primary' }) : '') + '</div>' +
        '<div class="row" style="margin-bottom:10px"><span class="muted">Coach calls</span>' + seg('pace', p.plan.pace, [['safe', 'Play it safe'], ['normal', 'Normal'], ['push', 'Push!']]) +
        '<button id="endnow" data-a="endnow" disabled>Go for endgame now</button></div><ul class="mlog" id="mlog"></ul>';
    }
    if (UI.result) {
      const { match: m, res } = UI.result, side = m.red.includes('P') ? 0 : 1;
      const mine = side ? res.b : res.r, theirs = side ? res.r : res.b;
      const head = mine > theirs ? '<span class="good">Victory</span>' : mine < theirs ? '<span class="bad">Defeat</span>' : 'Tie';
      const row = (label, k) => '<tr><td class="right num">' + res.score[0][k] + '</td><th class="center">' + label + '</th><td class="num">' + res.score[1][k] + '</td></tr>';
      const contrib = (ids) => ids.map((id) => E.team(ev, id).num + ': ' + res.contrib[id] + ' pts').join(' · ');
      return '<h2>' + m.label + ' · ' + head + '</h2>' + scoreHead(res.r, res.b, [contrib(m.red), contrib(m.blue)]).replace('2:30', 'FINAL').replace('READY', '') +
        '<table>' + row('Autonomous', 'auto') + row('Teleop', 'tele') + row('Endgame', 'end') + row('Opponent penalties', 'pen') + '</table>' +
        '<ul class="mlog" style="margin-top:10px">' + UI.result.log.filter((l) => l.side >= 0).slice(-12).map((l) => '<li class="' + (l.side ? 'bluec' : 'redc') + '">' + e(l.text) + '</li>').join('') + '</ul>' +
        '<div class="row" style="margin-top:12px">' + btn('Continue ▶', 'next', undefined, { cls: 'primary big' }) + '</div>';
    }
    const need = UI.need;
    if (!need) return '';
    if (need.need === 'match') {
      const m = need.match, side = m.red.includes('P') ? 0 : 1, p = C.playerPerf();
      const canHigh = p.scorer >= g.high.req;
      return '<h2>' + m.label + '</h2><p class="muted">You are on the <b class="' + (side ? 'bluec' : 'redc') + '">' + (side ? 'blue' : 'red') + '</b> alliance. Set the match plan, then watch or simulate.</p>' +
        '<div class="vs">' + allianceCard(ev, m.red, 0) + allianceCard(ev, m.blue, 1) + '</div>' +
        '<h3 style="margin-top:14px">Match plan</h3><table>' +
        '<tr><td>Autonomous</td><td>' + planSeg('auto', [['safe', 'Safe'], ['std', 'Standard'], ['bold', 'Ambitious']]) + '<div class="muted">Ambitious routines score more but fail more often.</div></td></tr>' +
        '<tr><td>Scoring focus</td><td>' + planSeg('focus', [['high', g.high.name], ['mix', 'Mixed'], ['low', g.low.name]]) + '<div class="muted">' + (canHigh ? 'Your robot can reach the ' + g.high.name + '.' : '<span class="warn">Scoring ' + p.scorer + ' is below the ' + g.high.req + ' needed for the ' + g.high.name + '. You will score low.</span>') + '</div></td></tr>' +
        '<tr><td>Endgame</td><td>' + planSeg('end', [['early', 'Leave early'], ['normal', 'Normal'], ['late', 'Last second'], ['park', 'Just park']]) + '<div class="muted">Leaving late squeezes in more cycles but risks running out of time.</div></td></tr></table>' +
        '<div class="row" style="margin-top:14px">' + btn('Watch match', 'watch', undefined, { cls: 'primary big' }) + btn('Quick sim', 'quick', undefined, { cls: 'big' }) + '</div>';
    }
    if (need.need === 'pick') {
      const order = E.rankings(ev);
      return '<h2>Alliance selection</h2><p>You are captain of <b>Alliance ' + need.seed + '</b>. Pick your partner for the playoffs.</p><div class="scroll"><table><tr><th>Rank</th><th>Team</th><th>Record</th><th>Avg pts</th><th></th></tr>' +
        need.options.map((id) => { const t = E.team(ev, id), s = ev.stats[id]; return '<tr><td class="num">' + (order.indexOf(id) + 1) + '</td><td>' + tname(t) + '</td><td class="num">' + s.w + '-' + s.l + '-' + s.t + '</td><td class="num">' + E.avg(ev, id).toFixed(1) + '</td><td class="right">' + btn('Pick', 'pick', id, { cls: 'small primary' }) + '</td></tr>'; }).join('') + '</table></div>';
    }
    const s = ev.summary;
    if (ev.type === 'meet') return '<h2>' + ev.name + ' complete</h2><table><tr><td>Record at this meet</td><td class="right"><b>' + s.record + '</b></td></tr><tr><td>League standing</td><td class="right"><b>' + s.rank + '</b> of ' + s.of + '</td></tr></table>' +
      '<p class="muted" style="margin-top:10px">League meets have no playoffs or awards. Your standing carries into the League Tournament.</p><div class="row" style="margin-top:14px">' + btn('Pack up and head home ▶', 'leave', undefined, { cls: 'primary big' }) + '</div>';
    if (ev.type === 'offseason') return '<h2>' + ev.name + ' complete</h2><table><tr><td>Qualification rank</td><td class="right"><b>' + s.rank + '</b> of ' + s.of + ' (' + s.record + ')</td></tr><tr><td>Playoffs</td><td class="right"><b>' + s.result + '</b></td></tr></table>' +
      '<p class="muted" style="margin-top:10px">Offseason events have no judged awards and nothing rides on them, but the drive team gains practice and experience.</p><div class="row" style="margin-top:14px">' + btn('Pack up and head home ▶', 'leave', undefined, { cls: 'primary big' }) + '</div>';
    return '<h2>' + ev.name + ' complete</h2><table><tr><td>Qualification rank</td><td class="right"><b>' + s.rank + '</b> of ' + s.of + ' (' + s.record + ')</td></tr><tr><td>Playoffs</td><td class="right"><b>' + s.result + '</b></td></tr>' +
      '<tr><td>Awards</td><td class="right">' + (s.awards.length ? '<b>' + s.awards.join(', ') + '</b>' : 'None') + '</td></tr>' +
      (ev.type !== 'worlds' ? '<tr><td>Advancement</td><td class="right">' + (s.advanced ? '<b class="good">Advanced!</b>' : 'Did not advance') + '</td></tr>' : '') + '</table>' +
      '<h3 style="margin-top:14px">Event awards</h3><table>' + ev.awards.map((a) => '<tr><td>' + a.name + '</td><td>' + tname(E.team(ev, a.id)) + '</td></tr>').join('') + '</table>' +
      '<div class="row" style="margin-top:14px">' + btn('Pack up and head home ▶', 'leave', undefined, { cls: 'primary big' }) + '</div>';
  }

  function eventScreen() {
    const ev = G.state.event;
    if (!ev) return '<div class="card">No event in progress.</div>';
    const order = E.rankings(ev);
    const ranks = order.map((id, i) => { const t = E.team(ev, id), s = ev.stats[id]; return '<tr class="' + (t.isPlayer ? 'me' : '') + '"><td class="num">' + (i + 1) + '</td><td>' + tname(t) + '</td><td class="num">' + s.w + '-' + s.l + '-' + s.t + '</td><td class="num">' + s.rp + '</td><td class="num">' + (s.n ? E.avg(ev, id).toFixed(0) : '-') + '</td></tr>'; }).join('');
    let bracket = '';
    if (ev.alliances) {
      bracket = '<div class="card" style="margin-bottom:14px"><h3>Playoffs</h3>' + ev.alliances.map((a, i) => '<div class="' + (a.includes('P') ? 'good' : '') + '"><span class="muted">A' + (i + 1) + '</span> ' + nums(ev, a) + '</div>').join('') +
        '<table style="margin-top:8px">' + ev.series.filter((s) => s.a >= 0).map((s) => '<tr><td>' + s.name + '</td><td class="num right">A' + (s.a + 1) + ' <b>' + s.wa + ' - ' + s.wb + '</b> A' + (s.b + 1) + '</td></tr>').join('') + '</table></div>';
    }
    return '<div class="grid"><div class="card c8"><div class="muted">' + ev.name + ' · ' + ev.teams.length + ' teams</div>' + eventMain(ev) + '</div>' +
      '<div class="c4">' + bracket + '<div class="card" style="margin-bottom:14px"><h3>Rankings</h3><div style="max-height:380px;overflow:auto"><table><tr><th>#</th><th>Team</th><th>W-L-T</th><th>RP</th><th>Avg</th></tr>' + ranks + '</table></div></div>' +
      (ev.feed.length ? '<div class="card"><h3>Event feed</h3><ul class="news">' + ev.feed.slice().reverse().map((f) => '<li>' + e(f) + '</li>').join('') + '</ul></div>' : '') + '</div></div>';
  }

  /* ---------- Help ---------- */
  function help() {
    return '<div class="card help"><h2 style="margin-top:0">How to play</h2><p>You manage a robotics team across many seasons. Each turn is one week.</p>' +
      '<h2>The season</h2><ul><li><b>Offseason (' + D.MONTHS[0] + ' to ' + D.MONTHS[D.MONTHS.length - 1] + '):</b> one turn is a month. Raise money, pitch sponsors, bring on mentors, train students and buy parts at list price. Vendors launch new products in ' + D.MONTHS[D.VENDOR_MONTH] + '.</li><li><b>Kickoff (September):</b> the game is revealed and turns become weekly. Read the scoring: every game rewards different robots.</li>' +
      '<li><b>Build and compete:</b> Qualifiers in weeks ' + D.WEEKS.q1 + ' and ' + D.WEEKS.q2 + ' (or, in a league region, three meets and a League Tournament). Advance from either to the Regional Championship (week ' + D.WEEKS.regional + '), and from there to the World Championship (week ' + D.WEEKS.worlds + '). You keep improving the robot between events.</li></ul>' +
      '<h2>Building the robot</h2><ul><li>Each week the team has a pool of <b>hours</b>, shown as one bar. Split them between subsystem projects and other jobs by typing hours in.</li><li>Every project has a <b>standard number of hours</b>. Your efficiency in that discipline (skills, mentors, equipment, morale) decides how much of it one of your hours gets done.</li><li>Pick a <b>design concept</b> per subsystem. Simple concepts are cheap and fast but top out early. Advanced ones cost more money and work.</li>' +
      '<li>Every upgrade costs <b>reliability</b>. Spend hours on Test & Tune before an event or watch your robot die on the field.</li><li><b>Driver practice</b> makes cycles faster and penalties rarer.</li></ul>' +
      '<h2>Parts and the inbox</h2><ul><li>Every upgrade is built from <b>parts</b>. Starting an upgrade uses what is in your inventory and buys the rest. Parts cost ' + Math.round(D.IN_SEASON_MARKUP * 100) + '% more once the season starts, and vendors can <b>sell out</b> of a part for a week, most often right after kickoff. Stock up over the summer.</li><li>The <b>skill tree</b> on the Skills page is studied with team hours, in or out of season, and you can split hours across several skills at once. Skills are permanent: some make work go further, and the advanced design concepts cannot be built without theirs.</li><li><b>Offseason events</b> on the Season page are optional summer tournaments played with last season\'s robot. Sign up before the month they are held. The <b>drivetrain</b> is the one subsystem you can start building before kickoff.</li><li><b>Field kits</b> are this season\'s game elements to practise on. Preorder one in the Shop before kickoff; afterwards they cost ' + Math.round(D.FIELD_MARKUP * 100) + '% more and take ' + D.FIELD_DELAY + ' weeks to arrive.</li><li>Leftover parts carry over, and half of the parts on last year\'s robot are salvaged.</li><li>The <b>inbox</b> brings decisions: sponsor requests, breakdowns, student issues. You must answer them before the calendar moves on.</li></ul><h2>Events</h2><ul><li>Matches are 2 v 2: 30 seconds of autonomous, then two minutes of driving, with endgame tasks in the last 30 seconds.</li><li>Win = 2 ranking points, tie = 1. The top four teams become alliance captains and pick a partner each.</li>' +
      '<li>Playoffs are best-of-three semifinals and a final.</li><li>Advancement goes to the Inspire Award winner, the winning and finalist alliances, the Think Award winner, then by rank. Nominate a mentor on the Team screen for the Compass Award. A great portfolio and outreach record can carry a team with an average robot.</li>' +
      '<li>During a live match you can make <b>coach calls</b>: push for speed at the risk of breakdowns and penalties, play it safe, or send the robot to the endgame early.</li></ul>' +
      '<h2>The long game</h2><ul><li>Meeting your season goal brings a grant and reputation. Reputation unlocks better sponsors, mentors and recruits.</li><li>Seniors graduate. Train the younger students before you need them.</li></ul>' +
      '<h2>Save</h2><p>The game autosaves in this browser after every action.</p><div class="row">' + btn('Delete save and return to menu', 'wipe') + '</div></div>';
  }

  /* ---------- Modals ---------- */
  function modal() {
    const st = G.state;
    if (st.phase === 'review' && st.review) {
      const r = st.review;
      return '<div class="veil"><div class="modal"><h3>Season ' + st.season + ' review</h3>' + (r.champion ? '<div class="gamename">🏆 WORLD CHAMPIONS</div>' : '<h2>' + e(st.team.name) + '</h2>') +
        '<table>' + (r.events.length ? r.events.map((x) => '<tr><td>' + x.name + '</td><td class="right">Rank ' + x.s.rank + '/' + x.s.of + ' · ' + x.s.result + (x.s.awards.length ? ' · ' + x.s.awards.join(', ') : '') + '</td></tr>').join('') : '<tr><td>No events played</td></tr>') + '</table>' +
        '<p style="margin-top:12px"><b>Goal:</b> ' + r.goal + ' — ' + (r.met ? '<span class="good">met. Grant of ' + U.money(r.grant) + ', reputation +' + r.rep + '.</span>' : '<span class="bad">missed. Reputation ' + r.rep + '.</span>') + '</p>' +
        '<p>Income ' + U.money(r.income) + ' · Spent ' + U.money(r.spent) + '</p>' +
        '<p>' + (r.graduating.length ? 'Graduating: ' + r.graduating.map(e).join(', ') + '.' : 'Nobody graduates this year.') + '</p>' +
        (st.mode === 'single' ? '<div class="gamename">Grade: ' + r.grade + '</div><p class="muted">Single season complete.</p>' + btn('Back to menu', 'endSingle', undefined, { cls: 'primary big' })
          : (st.season === D.CAREER_SEASONS ? '<p class="good">That completes the ' + D.CAREER_SEASONS + '-season career. You can keep playing: later seasons draw from all ten games.</p>' : '') +
            '<p class="muted">A new game means a new robot. Your students, equipment, mentors and design experience carry over.</p>' + btn('Start season ' + (st.season + 1) + ' ▶', 'nextSeason', undefined, { cls: 'primary big' })) + '</div></div>';
    }
    if (st.modal === 'kickoff') {
      const g = D.game(st.game);
      return '<div class="veil"><div class="modal"><h3>Kickoff · Season ' + st.season + '</h3><div class="gamename" style="color:' + g.color + '">' + g.name + '</div>' + gameInfo(g) +
        '<div class="row" style="margin-top:12px">' + btn('Plan the build ▶', 'closeKickoff', undefined, { cls: 'primary big' }) + '</div></div></div>';
    }
    return '';
  }

  const screens = { hq, inbox, build, skills, workshop, team, sponsors, inventory, shop, season, event: eventScreen, help };

  UI.render = function () {
    if (!G.state) {
      app.innerHTML = menu();
      app.querySelectorAll('canvas[data-game]').forEach((cv) => V.preview(cv, D.game(cv.dataset.game)));
      return;
    }
    if (UI.tab === 'event') { if (!G.state.event) UI.tab = 'hq'; else ensureNeed(); }
    app.innerHTML = top() + '<main>' + screens[UI.tab]() + '</main><footer>FTC Manager v' + G.VERSION + ' · unofficial fan project, not affiliated with <i>FIRST</i></footer>' + modal();
    if (UI.live) V.refresh();
  };

  /* ---------- actions ---------- */
  function finishMatch(match, m) {
    const res = M.result(m);
    E.complete(G.state.event, match, res);
    UI.result = { match, res, log: m.log };
    UI.need = null; UI.live = null; UI.liveDone = false;
  }
  const act = {
    diff(v) { UI.diff = v; },
    decide(v) { const [id, i] = v.split(':'); C.decide(id, +i); },
    part(v) { const [id, n] = v.split(':'); C.buyPart(id, +n); },
    kit(v) { C.buyKit(v); },
    offseason(v) { C.enterOffseason(v); },
    mode(v) { UI.mode = v; },
    game(v) { UI.game = v; },
    format(v) { UI.format = v; },
    nominate(v) { C.nominate(+v); },
    perk(v) { C.buyPerk(v); },
    endSingle() { G.wipe(); G.state = null; },
    new() {
      C.newGame({ name: UI.name.trim() || 'Robo Rookies', number: U.clamp(parseInt(UI.num, 10) || 12345, 1, 99999), difficulty: UI.diff, mode: UI.mode, format: UI.format, game: UI.game });
      UI.tab = 'hq';
    },
    continue() { if (G.load()) UI.tab = G.state.event ? 'event' : 'hq'; },
    wipe() { if (confirm('Delete your saved career? This cannot be undone.')) { V.stop(); G.wipe(); G.state = null; Object.assign(UI, { need: null, live: null, result: null }); } },
    tab(v) { UI.tab = v; },
    advance() {
      const st = G.state, free = C.hours() - C.used();
      if (st.phase !== 'review' && C.nextEvent() && free > 0 && !confirm(free + ' team hour' + (free === 1 ? ' is' : 's are') + ' unassigned this ' + C.turn() + '. Advance anyway?')) { UI.tab = 'build'; return; }
      if (C.pending()) { UI.tab = 'inbox'; return; }
      const out = C.advanceWeek();
      if (out === 'event') UI.tab = 'event';
      else if (C.pending()) UI.tab = 'inbox';
      else if (out === 'kickoff') UI.tab = 'build';
    },
    alloc(v) { const [id, d] = v.split(':'); C.setAlloc(id, +d); },
    overtime(v) { G.state.overtime = v === '1'; C.sanitizeAlloc(); },
    upgrade(v) { if (C.startUpgrade(v)) C.setAlloc(v, 10); },
    invite(v) { C.invite(+v); },
    dismiss(v) { C.dismiss(+v); },
    pitch(v) { C.pitch(+v); },
    buy(v) { C.buy(v); },
    closeKickoff() { G.state.modal = null; UI.tab = 'build'; },
    nextSeason() { C.nextSeason(); UI.tab = 'hq'; },
    plan(v) { const [k, x] = v.split(':'); G.state.plan[k] = x; },
    watch() {
      const match = UI.need.match;
      UI.live = { match, m: E.build(G.state.event, match, G.state.plan) };
      UI.need = null; UI.liveDone = false;
      UI.render();
      V.start(UI.live.m, () => { UI.liveDone = true; UI.render(); });
      return false;
    },
    quick() { const match = UI.need.match, m = E.build(G.state.event, match, G.state.plan); M.run(m); finishMatch(match, m); },
    speed(v) { V.speed = +v; },
    skip() { V.skip(); },
    pace(v) { const p = V.player(); if (p) p.plan.pace = v; },
    endnow() { const p = V.player(); if (p) p.endNow = true; },
    finishLive() { V.stop(); finishMatch(UI.live.match, UI.live.m); },
    next() { UI.result = null; },
    pick(v) { G.state.event.playerPick = v; UI.need = null; },
    leave() { C.finishEvent(); UI.need = null; UI.tab = 'hq'; },
  };

  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-a]');
    if (!el || el.disabled) return;
    const fn = act[el.dataset.a];
    if (!fn) return;
    if (!G.state && document.getElementById('tn')) { UI.name = document.getElementById('tn').value; UI.num = document.getElementById('tnum').value; }
    if (fn(el.dataset.v) === false) return;
    G.save();
    UI.render();
  });
  document.addEventListener('change', (ev) => {
    const any = ev.target.closest('[data-c]');
    if (any && any.dataset.c === 'game') { UI.game = any.value; return; }
    if (any && any.dataset.c === 'hours') { C.setHours(any.dataset.v, any.value); G.save(); UI.render(); return; }
    if (any && any.dataset.c === 'role') { C.setRole(any.dataset.v, any.value); G.save(); UI.render(); return; }
    const el = ev.target.closest('[data-c="concept"]');
    if (!el) return;
    const sub = G.state.robot.subs[el.dataset.v];
    if (sub.level === 0 && !sub.active || confirm('Switch design concept? The subsystem drops to level ' + Math.floor(sub.level / 2) + ' and any project in progress is lost.')) C.setConcept(el.dataset.v, el.value);
    G.save();
    UI.render();
  });

  UI.render();
})(window.FTC);
