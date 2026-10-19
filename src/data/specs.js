// Figures as presented at the live reveal demo.
// VERIFY BEFORE PUBLISHING: these are reveal-night claims, not homologated production data.

export const STATUS = {
  headline: 'Revealed in a live demo. Production planned in Texas for 2028.',
  deposit: 'Refundable $50,000 deposit',
  production: 'Production planned 2028 · Texas',
  reserveUrl: 'https://www.tesla.com/roadster',
};

export const HERO_STATS = '0–60 MPH · 0.81 S  |  1,341+ HP  |  2 G';

export const KEY = {
  zeroSixty: 0.81,
  topSpeed: '230+ mph',
  hpBase: 1073,
  hpTop: 1341,
  rangeMi: '310–320',
  chargeKw: 500,
  chargeMinutes: 10,
  downforceG: 2,
  nozzles: 10,
  tankLitres: 200,
  weightLb: 3700,
};

// Comparison bars in the 0.81 section (0–60 mph, seconds).
export const LAUNCH_COMPARE = [
  { name: 'Original Roadster', year: '2008', value: 3.7 },
  { name: 'Model S Plaid', year: '', value: 1.99 },
  { name: 'New Roadster', year: 'with thrust', value: 0.81, highlight: true },
];

// Spec rows: `v` is either a single value for every variant, or { performance, thrust, rocket }.
export const SPEC_GROUPS = [
  {
    title: 'Performance',
    rows: [
      { label: '0–60 mph', v: { performance: 'Not stated at reveal', thrust: '0.81 s measured', rocket: '0.81 s measured' }, note: '0.81 s is with thrust' },
      { label: 'Top speed', v: '230+ mph achieved so far' },
      { label: 'Cornering / downforce', v: { performance: 'Up to 2 G', thrust: 'Up to 2 G', rocket: 'Up to 2 G' } },
    ],
  },
  {
    title: 'Powertrain',
    rows: [
      { label: 'Drive', v: 'Rear-wheel drive, torque-vectoring motors' },
      { label: 'Power', v: { performance: '1,073+ hp', thrust: '1,341+ hp', rocket: '1,341+ hp' } },
    ],
  },
  {
    title: 'Battery & Charging',
    rows: [
      { label: 'Range', v: 'About 310–320 mi' },
      { label: 'Peak charging', v: 'Up to 500 kW' },
      { label: '10–80 %', v: 'About 10 min' },
    ],
  },
  {
    title: 'Aero',
    rows: [
      { label: 'Suction fans', v: { performance: 'Yes', thrust: 'Yes', rocket: 'Yes' } },
      { label: 'Wall climb', v: 'Curved wall to vertical, live demo' },
    ],
  },
  {
    title: 'Thrusters',
    rows: [
      { label: 'Cold-gas thrusters', v: { performance: 'None', thrust: 'Rear thrust (limited)', rocket: 'All 10 nozzles' } },
      { label: 'Gas tank', v: { performance: '—', thrust: '200 L compressed gas', rocket: '200 L compressed gas' } },
      { label: 'Thrust duration', v: { performance: '—', thrust: 'A few seconds', rocket: 'A few seconds' } },
      { label: 'Refill', v: { performance: '—', thrust: '2–6 h', rocket: '2–6 h' } },
    ],
  },
  {
    title: 'Chassis',
    rows: [
      { label: 'Structure', v: 'Aluminium + carbon-fibre' },
      { label: 'Controls', v: 'Steer-by-wire, brake-by-wire' },
      { label: 'Brakes', v: 'Carbon-ceramic' },
      { label: 'Body', v: 'Two seats, butterfly doors, removable upper glass (T-top)' },
    ],
  },
  {
    title: 'Weight',
    rows: [{ label: 'Lightest version', v: 'About 3,700 lb' }],
  },
];

// Fan readout in The Wall HUD. ILLUSTRATIVE — no fan RPM was stated at the reveal. Verify or replace before publishing.
export const FAN_RPM_ILLUSTRATIVE = 9800;

export const WALL_CAPTION = 'Suction fans pull it to the wall. Up to 2 G. It drove vertical in front of a live crowd.';
export const FLIGHT_LINE = 'Ten nozzles. 200 litres of gas. And then it flew.';
