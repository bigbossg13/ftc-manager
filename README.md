# FTC Manager

A lightweight management game about running a *FIRST* Tech Challenge style robotics team, in the spirit of motorsport management games. You don't drive the robot. You build the program behind it: students, mentors, sponsors, design choices and match strategy.

Unofficial fan project. Not affiliated with or endorsed by *FIRST*. Every season game in here is made up.

## Play

Open `index.html` in a browser. There is nothing to install or build. It also works as-is on GitHub Pages.

The game autosaves to the browser's local storage.

## What's in it

- **Career over many seasons.** Students graduate, recruits arrive, sponsors renew or leave, rival programs rise and fall.
- **A new game every season**, revealed at kickoff. Five fictional games with different scoring, field layouts and endgames, so the best robot changes from year to year.
- **Robot design.** Five subsystems (drivetrain, intake, scoring mechanism, endgame, software), each with three design concepts that trade cost and build time against their ceiling. Experience with a concept carries into later seasons.
- **Weekly planning.** Split the team's work blocks between building, testing, driver practice, the engineering portfolio, outreach, fundraising and training.
- **Events.** Qualifiers, a Regional Championship and a World Championship with qualification matches, rankings, alliance selection, best-of-three playoffs, judged awards and advancement.
- **Live 2 v 2 matches** drawn on a top-down field: 30 s autonomous, two minutes of teleop, endgame in the last 30 s. Set a match plan beforehand and make coach calls during the match, or quick-sim it.
- **A simulated region** of 60 rival teams that play every match through the same engine.

## Code layout

Plain JavaScript, HTML and CSS. No framework, no build step.

| File | Purpose |
| --- | --- |
| `js/core.js` | Namespace, seeded RNG, helpers, save system |
| `js/data.js` | Season games, design concepts, facilities, names |
| `js/world.js` | Rival teams and how they develop |
| `js/match.js` | Match engine (used for live, quick-sim and rival matches) |
| `js/event.js` | Schedule, rankings, alliance selection, playoffs, awards |
| `js/career.js` | Team state, weekly work, finances, season rollover |
| `js/matchview.js` | Live match canvas |
| `js/ui.js` | All screens |
| `tools/smoke.js` | Headless autoplay for crash and balance checks |

## Balance testing

```bash
node tools/smoke.js 5 6
```

plays 5 careers of 6 seasons each with a simple bot and prints results, score distributions and how often the bot reached each stage.

## Ideas for later

Parts inventory and wear, a second robot, league meets, scouting other teams' robots in detail, more season games, three-team alliances at big events, save export and import.
