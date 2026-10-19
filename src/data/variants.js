// VERIFY BEFORE PUBLISHING — variant split as presented at the reveal.
export const VARIANTS = [
  {
    id: 'performance',
    name: 'Performance',
    hp: 1073,
    zeroSixty: 'Not stated',
    fans: 'Yes',
    thrusters: 'None',
    availability: 'Reservations',
    rangeMi: '310–320',
    caliper: 'red',
    move: 'pivot',
    selectable: true,
    blurb: 'Suction fans pull it to the road, or the wall.',
  },
  {
    id: 'thrust',
    name: 'Thrust',
    hp: 1341,
    zeroSixty: '0.81 s',
    fans: 'Yes',
    thrusters: 'Rear thrust',
    availability: 'Limited',
    rangeMi: '310–320',
    caliper: 'grey',
    move: 'puff',
    selectable: true,
    blurb: 'Cold-gas thrust from the rear. The 0.81 s car.',
  },
  {
    id: 'rocket',
    name: 'Rocket',
    hp: 1341,
    zeroSixty: '0.81 s',
    fans: 'Yes',
    thrusters: 'All 10',
    availability: 'Invite only',
    rangeMi: '310–320',
    caliper: 'black',
    move: 'hop',
    selectable: false,
    tag: 'Invite only · Not street legal',
    blurb: 'Every nozzle. The one that flew.',
  },
];

export const variantById = (id) => VARIANTS.find((v) => v.id === id) || VARIANTS[0];

export const WHEELS = [
  { id: 'graphite', name: 'Graphite', hex: '#2B2E33', metal: 0.6, rough: 0.4 },
  { id: 'silver', name: 'Forged Silver', hex: '#A9AEB5', metal: 0.9, rough: 0.28 },
];

export const CALIPERS = [
  { id: 'red', name: 'Red', hex: '#E0201F' },
  { id: 'black', name: 'Black', hex: '#141416' },
  { id: 'grey', name: 'Grey', hex: '#7C8188' },
];
