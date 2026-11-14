/* FTC Manager — static data: season games, robot concepts, facilities, names */
(function (G) {
  'use strict';
  const D = (G.Data = {});

  D.WEEKS = { kickoff: 3, q1: 10, q2: 14, regional: 18, worlds: 22 };
  D.MATCH = { auto: 30, total: 150, endgame: 120, penalty: 10 };

  /* ---- Season games (all fictional). Layout coordinates are for the red
     alliance on a unit field; blue is rotated 180 degrees. ---- */

  /* ---- Real FTC seasons, simplified to fit the match engine: one low and
     one high scoring location, an optional repeating bonus, three endgame
     tiers. Field positions are schematic, not to scale. ---- */
  D.REAL = [
    {
      id: 'powerplay', real: true, year: 2022, name: 'POWERPLAY', element: 'cone', elements: 'cones', color: '#f2c230',
      tagline: 'Stack cones on spring-loaded junctions and connect your terminals with a circuit.',
      keys: ['High junctions need a tall, steady lift', 'Reading the signal sleeve in autonomous is worth 20', 'Owning junctions adds up over a match'],
      scorer: ['Claw Arm', 'Linear Slides', 'Slides + Turret'],
      low: { name: 'Low Junction', pts: 3, auto: 3 }, high: { name: 'High Junction', pts: 5, auto: 5, req: 36 },
      autoMult: 1, autoLeave: 2, autoBonus: { name: 'Parks in the signal zone', pts: 20, req: 30 },
      set: { size: 3, bonus: 3, name: 'junction (owned)' },
      end: [{ name: 'Park in the terminal', pts: 2, req: 0 }, { name: 'Cap a junction with the beacon', pts: 10, req: 30 }, { name: 'Beacon cap + completed circuit', pts: 30, req: 58 }],
      collectTime: 0.9, scoreTime: 1.15,
      layout: { start: [[0.08, 0.3], [0.08, 0.7]], collect: [[0.07, 0.5], [0.45, 0.08], [0.45, 0.92]], low: [0.26, 0.6], high: [0.42, 0.42], end: [0.1, 0.9] },
    },
    {
      id: 'centerstage', real: true, year: 2023, name: 'CENTERSTAGE', element: 'pixel', elements: 'pixels', color: '#e9e9ee',
      tagline: 'Build mosaics on the backdrop, hang from the rigging and launch a drone.',
      keys: ['Pixels are a full field away: speed matters', 'Team prop detection is worth 20 in autonomous', 'Suspend and drone together are worth 50'],
      scorer: ['Drop Bucket', 'Linear Slides', 'Slides + Pixel Aligner'],
      low: { name: 'Backstage', pts: 1, auto: 3 }, high: { name: 'Backdrop', pts: 3, auto: 5, req: 30 },
      autoMult: 1, autoLeave: 5, autoBonus: { name: 'Team prop bonus pixels', pts: 20, req: 35 },
      set: { size: 5, bonus: 10, name: 'mosaic or set line' },
      end: [{ name: 'Park backstage', pts: 5, req: 0 }, { name: 'Suspend from the rigging', pts: 20, req: 35 }, { name: 'Suspend and land the drone', pts: 50, req: 62 }],
      collectTime: 0.95, scoreTime: 1.05,
      layout: { start: [[0.08, 0.35], [0.08, 0.65]], collect: [[0.9, 0.12], [0.9, 0.3], [0.5, 0.5]], low: [0.12, 0.25], high: [0.06, 0.15], end: [0.5, 0.86] },
    },
    {
      id: 'intothedeep', real: true, year: 2024, name: 'INTO THE DEEP', element: 'sample', elements: 'samples', color: '#f0c33d',
      tagline: 'Pull samples out of the submersible, fill the baskets and ascend.',
      keys: ['Digging in the submersible is slow: invest in the intake', 'Autonomous scores count double', 'A level 3 ascent is worth 30'],
      scorer: ['Claw Arm', 'Linear Slides', 'Slides + Pivot Arm'],
      low: { name: 'Low Basket', pts: 4, auto: 8 }, high: { name: 'High Basket', pts: 8, auto: 16, req: 38 },
      autoMult: 2, autoLeave: 3, set: null,
      end: [{ name: 'Level 1 ascent', pts: 3, req: 0 }, { name: 'Level 2 ascent', pts: 15, req: 40 }, { name: 'Level 3 ascent', pts: 30, req: 68 }],
      collectTime: 1.3, scoreTime: 1.05,
      layout: { start: [[0.08, 0.35], [0.08, 0.65]], collect: [[0.4, 0.42], [0.4, 0.58], [0.2, 0.2]], low: [0.13, 0.16], high: [0.07, 0.08], end: [0.4, 0.74] },
    },
    {
      id: 'decode', real: true, year: 2025, name: 'DECODE', element: 'artifact', elements: 'artifacts', color: '#a05cf0',
      tagline: 'Launch artifacts into the goal, build the motif pattern and return to base.',
      keys: ['Fast shooting cycles: intake and launcher both matter', 'Classified artifacts are worth three times overflow', 'Both robots in base at the end pays a bonus'],
      scorer: ['Fixed Flywheel', 'Adjustable-Hood Shooter', 'Turreted Shooter'],
      low: { name: 'Overflow', pts: 1, auto: 1 }, high: { name: 'Goal (classified)', pts: 3, auto: 3, req: 28 },
      autoMult: 1, autoLeave: 3, autoBonus: { name: 'Motif pattern in autonomous', pts: 6, req: 40 },
      set: { size: 3, bonus: 3, name: 'pattern match' },
      end: [{ name: 'Partially in base', pts: 5, req: 0 }, { name: 'Fully in base', pts: 10, req: 25 }, { name: 'Full return with partner bonus', pts: 20, req: 55 }],
      collectTime: 0.8, scoreTime: 0.75,
      layout: { start: [[0.1, 0.2], [0.55, 0.92]], collect: [[0.45, 0.3], [0.45, 0.6], [0.9, 0.9]], low: [0.16, 0.2], high: [0.08, 0.08], end: [0.3, 0.75] },
    },
    {
      id: 'biobuzz', real: true, year: 2026, provisional: true, name: 'BIOBUZZ', element: 'pollen', elements: 'pollen', color: '#f5c518',
      tagline: 'Launch pollen and nectar into your hive until it tips, then claim the flowers.',
      keys: ['Enough pollen in the cell tips the hive for a bonus', 'Flowers are contested late in the match', 'Owning a flower means your nectar is on top'],
      scorer: ['Push Launcher', 'Flywheel Launcher', 'Turreted Launcher'],
      low: { name: 'Flower', pts: 2, auto: 4 }, high: { name: 'Hive Cell', pts: 3, auto: 6, req: 30 },
      autoMult: 2, autoLeave: 3, set: { size: 4, bonus: 8, name: 'hive tip' },
      end: [{ name: 'Nectar in a flower', pts: 5, req: 0 }, { name: 'Own a flower', pts: 12, req: 35 }, { name: 'Own several flowers', pts: 25, req: 62 }],
      collectTime: 0.85, scoreTime: 0.85,
      layout: { start: [[0.08, 0.3], [0.08, 0.7]], collect: [[0.5, 0.2], [0.5, 0.8], [0.35, 0.5]], low: [0.3, 0.3], high: [0.1, 0.5], end: [0.6, 0.5] },
    },
  ];

  D.SIM = [
    {
      id: 'summit', name: 'SUMMIT STACK', element: 'crate', elements: 'crates', color: '#e8a33d',
      tagline: 'Haul supply crates up the mountain and race to the summit.',
      keys: ['Tall towers reward a strong scoring mechanism', 'Every 4 crates on the tower completes a stack', 'The summit climb is worth a lot'],
      scorer: ['Claw Arm', 'Linear Slides', 'Slides + Turret'],
      low: { name: 'Base Camp', pts: 2 }, high: { name: 'Tower', pts: 5, req: 38 },
      autoMult: 2, autoLeave: 5, set: { size: 4, bonus: 8, name: 'stack' },
      end: [{ name: 'Park at the trailhead', pts: 5, req: 0 }, { name: 'Climb to the ledge', pts: 15, req: 35 }, { name: 'Reach the summit', pts: 35, req: 62 }],
      collectTime: 1, scoreTime: 1.15,
      layout: { start: [[0.08, 0.28], [0.08, 0.72]], collect: [[0.46, 0.12], [0.46, 0.88], [0.3, 0.5]], low: [0.1, 0.5], high: [0.24, 0.3], end: [0.4, 0.62] },
    },
    {
      id: 'tidal', name: 'TIDAL RUSH', element: 'orb', elements: 'orbs', color: '#3db8e8',
      tagline: 'Launch orbs into the tide pools before the water rises.',
      keys: ['Orbs are everywhere, so intake speed drives your cycle count', 'Long field crossings favor a fast drivetrain', 'Autonomous orbs count triple'],
      scorer: ['Push Ramp', 'Flywheel Launcher', 'Turreted Launcher'],
      low: { name: 'Shallow Pool', pts: 1 }, high: { name: 'Deep Pool', pts: 4, req: 32 },
      autoMult: 3, autoLeave: 3, set: { size: 6, bonus: 6, name: 'wave' },
      end: [{ name: 'Park on the beach', pts: 4, req: 0 }, { name: 'Dock on the pier', pts: 12, req: 35 }, { name: 'Balance on the float', pts: 25, req: 60 }],
      collectTime: 0.75, scoreTime: 0.85,
      layout: { start: [[0.08, 0.2], [0.08, 0.8]], collect: [[0.7, 0.2], [0.62, 0.8], [0.5, 0.5]], low: [0.14, 0.5], high: [0.1, 0.36], end: [0.3, 0.84] },
    },
    {
      id: 'orbit', name: 'ORBIT RELAY', element: 'ring', elements: 'rings', color: '#b07cf0',
      tagline: 'Thread rings onto the orbit posts and hang from the station.',
      keys: ['Rings are awkward to grab: invest in the intake', 'Posts need precision more than raw speed', 'Hanging from the station decides close matches'],
      scorer: ['Hook Arm', 'Linear Slides', 'Slides + Wrist'],
      low: { name: 'Ground Post', pts: 2 }, high: { name: 'Orbit Post', pts: 6, req: 42 },
      autoMult: 2, autoLeave: 4, set: { size: 3, bonus: 6, name: 'orbit' },
      end: [{ name: 'Park in the bay', pts: 5, req: 0 }, { name: 'Low hang', pts: 15, req: 38 }, { name: 'High hang', pts: 30, req: 66 }],
      collectTime: 1.35, scoreTime: 1.1,
      layout: { start: [[0.08, 0.3], [0.08, 0.7]], collect: [[0.36, 0.1], [0.36, 0.9], [0.44, 0.5]], low: [0.2, 0.66], high: [0.22, 0.38], end: [0.1, 0.5] },
    },
    {
      id: 'harvest', name: 'HARVEST HAUL', element: 'bale', elements: 'bales', color: '#8bc34a',
      tagline: 'Bring in the harvest and get everyone into the barn before the storm.',
      keys: ['Short cycles: the whole robot matters evenly', 'A reliable robot beats a fancy one here', 'Endgame is modest, cycles are king'],
      scorer: ['Dump Bucket', 'Conveyor Lift', 'Dual Conveyor'],
      low: { name: 'Wagon', pts: 2 }, high: { name: 'Silo', pts: 4, req: 30 },
      autoMult: 2, autoLeave: 6, set: { size: 5, bonus: 10, name: 'full load' },
      end: [{ name: 'Park by the barn', pts: 4, req: 0 }, { name: 'Drive into the barn', pts: 10, req: 30 }, { name: 'Raise the barn door', pts: 20, req: 55 }],
      collectTime: 0.9, scoreTime: 0.9,
      layout: { start: [[0.08, 0.25], [0.08, 0.75]], collect: [[0.34, 0.14], [0.34, 0.86], [0.42, 0.5]], low: [0.14, 0.6], high: [0.14, 0.4], end: [0.24, 0.9] },
    },
    {
      id: 'circuit', name: 'CIRCUIT BREAKER', element: 'cell', elements: 'cells', color: '#f0d43d',
      tagline: 'Slot power cells into the grid and bring the charging station online.',
      keys: ['Completed circuits pay big: keep the cells flowing', 'A strong autonomous sets up the whole match', 'The charging station is hard but worth 40'],
      scorer: ['Pincer Arm', 'Linear Slides', 'Slides + Pivot'],
      low: { name: 'Low Bus', pts: 3 }, high: { name: 'Grid', pts: 5, req: 36 },
      autoMult: 2.5, autoLeave: 5, set: { size: 3, bonus: 9, name: 'circuit' },
      end: [{ name: 'Park in the substation', pts: 3, req: 0 }, { name: 'Dock on the station', pts: 14, req: 40 }, { name: 'Bring the station online', pts: 40, req: 72 }],
      collectTime: 1.1, scoreTime: 1.2,
      layout: { start: [[0.08, 0.3], [0.08, 0.7]], collect: [[0.56, 0.14], [0.56, 0.86], [0.08, 0.92]], low: [0.3, 0.6], high: [0.3, 0.4], end: [0.44, 0.5] },
    },
  ];
  D.GAMES = D.REAL.concat(D.SIM);
  D.game = (id) => D.GAMES.find((g) => g.id === id);

  /* ---- Robot subsystems and the design concepts available for each ---- */
  const c = (id, name, desc, base, per, max, cost, work, rel) => ({ id, name, desc, base, per, max, cost, work, rel });
  D.SUBS = [
    { id: 'drive', name: 'Drivetrain', stat: 'Speed', skill: 'mech', concepts: [
      c('tank', 'Tank Drive', 'Cheap and tough, but slow around the field.', 22, 6, 5, 60, 0.7, 2),
      c('mecanum', 'Mecanum Drive', 'The standard. Strafes, well understood.', 28, 7, 8, 110, 1, 4),
      c('swerve', 'Coaxial Swerve', 'Highest ceiling. Expensive and fragile to develop.', 30, 7, 10, 220, 1.5, 7),
    ] },
    { id: 'intake', name: 'Intake', stat: 'Pickup', skill: 'mech', concepts: [
      c('claw', 'Servo Claw', 'One piece at a time, needs careful lining up.', 22, 6, 5, 30, 0.6, 2),
      c('roller', 'Roller Intake', 'Touch it, own it.', 28, 7, 8, 70, 1, 4),
      c('active', 'Vectored Intake', 'Funnels pieces from any angle. Hard to tune.', 30, 7, 10, 130, 1.4, 6),
    ] },
    { id: 'scorer', name: 'Scoring Mechanism', stat: 'Scoring', skill: 'mech', concepts: [
      c('s1', '', 'Simple and quick to build. Limited reach.', 22, 6, 5, 50, 0.7, 2),
      c('s2', '', 'Reaches the high goal consistently.', 28, 7, 8, 100, 1, 4),
      c('s3', '', 'Scores from anywhere. A serious engineering project.', 30, 7, 10, 190, 1.5, 7),
    ] },
    { id: 'endgame', name: 'Endgame Mechanism', stat: 'Endgame', skill: 'mech', concepts: [
      c('hooks', 'Passive Hooks', 'Light and simple. Slow, tops out early.', 26, 6, 5, 40, 0.6, 2),
      c('winch', 'Winch Lift', 'A dependable powered lift.', 30, 7, 8, 90, 1, 4),
      c('fast', 'Spring-Assist Climber', 'Up in seconds, if it works.', 32, 7, 10, 170, 1.4, 7),
    ] },
    { id: 'software', name: 'Software & Auto', stat: 'Auto', skill: 'soft', concepts: [
      c('timed', 'Timed Paths', 'Drive forward for two seconds and hope.', 20, 6, 5, 10, 0.7, 1),
      c('odo', 'Encoder Odometry', 'Knows where it is, most of the time.', 28, 7, 8, 60, 1, 2),
      c('vision', 'Vision + Dead Wheels', 'Precise, adaptive autonomous. Lots of tuning.', 30, 7, 10, 140, 1.5, 3),
    ] },
  ];
  D.sub = (id) => D.SUBS.find((s) => s.id === id);
  D.concept = (subId, conceptId) => D.sub(subId).concepts.find((x) => x.id === conceptId);

  /* ---- Weekly activities besides subsystem projects ---- */
  D.ACTS = [
    { id: 'test', name: 'Test & Tune', skill: 'mech', desc: 'Raises reliability. Every upgrade knocks it back down.' },
    { id: 'practice', name: 'Driver Practice', skill: 'drive', desc: 'Faster cycles and fewer penalties. Needs a driving robot.' },
    { id: 'portfolio', name: 'Engineering Portfolio', skill: 'biz', desc: 'Documents your season for the judges (Inspire, Think).' },
    { id: 'outreach', name: 'Outreach', skill: 'biz', desc: 'Builds reputation, recruits and the Connect award case.' },
    { id: 'fundraise', name: 'Fundraising', skill: 'biz', desc: 'Car washes, bake sales and grant writing.' },
    { id: 'training', name: 'Skills Training', skill: null, desc: 'Workshops that raise student skills for the long run.' },
  ];

  D.FACILITIES = [
    { id: 'printer', name: '3D Printer', cost: 400, desc: '+10% build speed' },
    { id: 'cnc', name: 'CNC Router', cost: 1500, desc: '+15% build speed' },
    { id: 'field', name: 'Practice Field', cost: 700, desc: '+30% driver practice and testing' },
    { id: 'sensors', name: 'Sensor & Odometry Kit', cost: 500, desc: '+20% software progress' },
    { id: 'laptops', name: 'Team Laptops', cost: 700, desc: '+10% software and portfolio' },
    { id: 'pit', name: 'Pit Display & Banner', cost: 300, desc: '+15% outreach and fundraising' },
    { id: 'space', name: 'Bigger Workshop', cost: 2200, desc: '+1 work block per week, +1 mentor slot' },
  ];

  /* ---- Vendor products. A few launch each summer and last one season. ---- */
  const v = (id, vendor, name, cost, sub, kind, value, desc) => ({ id, vendor, name, cost, sub, kind, value, desc });
  D.VENDOR = [
    v('chassis', 'Pinion Labs', 'Pre-cut Chassis Kit', 350, 'drive', 'work', 0.3, 'Drivetrain upgrades take 30% less work'),
    v('modules', 'Gridline Robotics', 'Low-friction Wheel Modules', 400, 'drive', 'stat', 5, '+5 Speed once the drivetrain is built'),
    v('servo', 'TorqueWorks', 'High-torque Servo Line', 220, 'intake', 'stat', 5, '+5 Pickup once the intake is built'),
    v('slides', 'Gridline Robotics', 'Belt-driven Slide Kit', 300, 'scorer', 'work', 0.25, 'Scoring mechanism upgrades take 25% less work'),
    v('bulk', 'TorqueWorks', 'Bulk Hardware Bundle', 150, 'scorer', 'cost', 0.3, 'Scoring mechanism upgrades cost 30% less'),
    v('winch', 'Volt & Bolt', 'Compact Winch Gearbox', 240, 'endgame', 'stat', 6, '+6 Endgame once the mechanism is built'),
    v('optical', 'Pinion Labs', 'Optical Odometry Sensor', 280, 'software', 'stat', 6, '+6 Auto once software is started'),
    v('camera', 'Volt & Bolt', 'Smart Camera v2', 200, 'software', 'work', 0.25, 'Software upgrades take 25% less work'),
  ];

  D.CAREER_SEASONS = 5;
  D.DIFFICULTY = {
    easy: { name: 'Well-Funded Rookie', money: 4500, rep: 22, desc: 'A supportive school and a starter grant.' },
    normal: { name: 'Garage Team', money: 2800, rep: 15, desc: 'A kit of parts, a folding table and big plans.' },
    hard: { name: 'Shoestring', money: 1400, rep: 8, desc: 'Borrowed tools and no sponsors. Good luck.' },
  };

  D.GOALS = [
    { id: 'playoffsQ', text: 'Be part of a playoff alliance at a Qualifier or League Tournament', grant: 800 },
    { id: 'qualRegional', text: 'Qualify for the Regional Championship', grant: 1500 },
    { id: 'qualWorlds', text: 'Qualify for the World Championship', grant: 3000 },
    { id: 'playoffsW', text: 'Reach the playoffs at the World Championship', grant: 5000 },
  ];

  D.FIRST = ['Ava', 'Liam', 'Maya', 'Noah', 'Zoe', 'Eli', 'Priya', 'Mateo', 'Nora', 'Kai', 'Sofia', 'Jalen', 'Mei', 'Omar', 'Ruby', 'Diego', 'Hana', 'Theo', 'Amara', 'Lucas', 'Isla', 'Arjun', 'Chloe', 'Malik', 'Elena', 'Finn', 'Yuki', 'Sam', 'Leila', 'Owen', 'Tessa', 'Ravi', 'Jade', 'Marco', 'Ines', 'Caleb', 'Nia', 'Hugo', 'Anika', 'Jonah'];
  D.LAST = ['Nguyen', 'Garcia', 'Patel', 'Kim', 'Okafor', 'Rossi', 'Chen', 'Walker', 'Silva', 'Haddad', 'Novak', 'Reyes', 'Tanaka', 'Brooks', 'Larsen', 'Singh', 'Moreau', 'Diaz', 'Cohen', 'Ward', 'Ito', 'Mensah', 'Fischer', 'Lopez', 'Park', 'Bauer', 'Khan', 'Murphy', 'Sato', 'Rivera'];
  D.TEAM_A = ['Iron', 'Quantum', 'Rogue', 'Cyber', 'Turbo', 'Solar', 'Midnight', 'Atomic', 'Electric', 'Rusty', 'Golden', 'Neon', 'Static', 'Lunar', 'Wired', 'Brass', 'Hyper', 'Crimson', 'Galactic', 'Clockwork', 'Voltage', 'Titanium', 'Rapid', 'Phantom'];
  D.TEAM_B = ['Gears', 'Owls', 'Circuits', 'Mechanics', 'Hawks', 'Robotics', 'Bolts', 'Wolves', 'Sprockets', 'Engineers', 'Foxes', 'Servos', 'Knights', 'Comets', 'Tigers', 'Makers', 'Dragons', 'Pistons', 'Ravens', 'Rockets', 'Otters', 'Vectors', 'Lynx', 'Titans'];
  D.SPONSORS = ['Harbor Machine Works', 'Lakeside Credit Union', 'Pine Street Hardware', 'Northgate Dental', 'Vertex Aerospace', 'Blue Heron Software', 'Summit Fasteners', 'Rotary Club', 'Kestrel Engineering', 'Maple Valley Auto', 'Cascade Power Co-op', 'Brightline Plastics', 'Old Mill Pizza', 'Granite Bank', 'Orchard Family Fund', 'Delta Precision Tooling', 'Foxglove Labs', 'Riverbend Realty'];
  D.MENTOR_AREAS = { mech: 'Mechanical', soft: 'Programming', drive: 'Drive Coach', biz: 'Business & Outreach' };
  D.REGIONS = ['Texas', 'Ontario', 'Michigan', 'California', 'Romania', 'Netherlands', 'Washington', 'New York', 'Australia', 'Minnesota', 'India', 'Israel', 'Georgia', 'Brazil', 'Colorado', 'Korea'];
})(typeof window !== 'undefined' ? window.FTC : globalThis.FTC);
