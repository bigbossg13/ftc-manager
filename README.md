# FTC Manager

A lightweight management game about running a *FIRST* Tech Challenge style robotics team, in the spirit of motorsport management games. You don't drive the robot. You build the program behind it: students, mentors, sponsors, design choices and match strategy.

Unofficial fan project. Not affiliated with or endorsed by *FIRST*. The five real seasons are simplified models of the actual games, and the field drawings are schematic.

## Play

Open `index.html` in a browser. There is nothing to install or build. It also works as-is on GitHub Pages.

The game autosaves to the browser's local storage.

## What's in it

- **Five-season career** through POWERPLAY, CENTERSTAGE, INTO THE DEEP, DECODE and BIOBUZZ. Or play any one game, including five simulated ones, as a **single season** graded S to D. Students graduate, recruits arrive, sponsors renew or leave, rival programs rise and fall.
- **A new game every season**, revealed at kickoff, each with different scoring, field layouts and endgames, so the best robot changes from year to year.
- **Two region formats.** Qualifiers, or league play: three league meets with carried-over standings, then a League Tournament.
- **A year in two speeds.** The offseason (May to August) is played a month at a time; from kickoff in September you plan week by week.
- **Parts inventory and shop.** Upgrades are built from parts. Parts are cheaper in the offseason and can sell out once the season starts; leftovers carry over and half of last year's robot is salvaged.
- **Field preorders.** Preorder a half or full set of the season's game elements before kickoff to practise on; ordering after the reveal costs 40% more and takes two weeks to arrive.
- **Offseason events.** Optional summer tournaments played with last season's robot; the drivetrain can also be started before kickoff.
- **Skill tree.** Fifteen team skills across mechanical, software, drive team and business, studied in the offseason one at a time. Some make work go further; the advanced design concepts need theirs first.
- **Inbox.** Decisions land on your desk (sponsor requests, breakdowns, student issues) and must be answered before the calendar moves on.
- **Mentors cost money.** Each mentor has per-season expenses, billed when they join and every offseason.
- **Robot design.** Five subsystems (drivetrain, intake, scoring mechanism, endgame, software), each with three design concepts that trade cost and build time against their ceiling. Experience with a concept carries into later seasons.
- **Weekly planning.** Split the team's weekly hours, shown as one stacked bar, between building, testing, driver practice, the engineering portfolio, outreach, fundraising and training.
- **Events.** Qualifiers, a Regional Championship and a World Championship with qualification matches, rankings, alliance selection, best-of-three playoffs, judged awards (Inspire, Think, Connect, Design, and the Compass Award for a mentor you nominate) and advancement. Wins and top awards hang orange banners on the Season screen.
- **Summer vendor launches.** A few new products each preseason that boost or cheapen one subsystem for that season.
- **Four-person drive team:** driver, operator, drive coach and human player.
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
node tools/smoke.js 5 6 league
```

plays 5 careers of 6 seasons each (in a league region; use `qual` or omit for qualifiers) with a simple bot and prints results, score distributions and how often the bot reached each stage.

## Ideas for later

Parts inventory and wear, a second robot, scouting other teams' robots in detail, more season games, three-team alliances at big events, save export and import.
