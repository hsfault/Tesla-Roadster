// "Replay the reveal" — each chapter is a home section marked data-chapter="<id>".
// duration = seconds of film time for the chapter (includes the 1.1 s cut).
export const CHAPTERS = [
  { id: 'lights-on', n: '01', title: 'Lights On', caption: 'Texas, reveal night. The arena wakes up.', duration: 10 },
  { id: 'walkaround', n: '02', title: 'Walkaround', caption: 'Shaped by air. Glass that comes off.', duration: 14 },
  { id: 'launch', n: '03', title: '0.81', caption: '0–60 mph in 0.81 seconds, measured.', duration: 10 },
  { id: 'wall', n: '04', title: 'The Wall', caption: 'Suction fans. Up to 2 G. Vertical.', duration: 16 },
  { id: 'flight', n: '05', title: 'Flight', caption: 'Ten nozzles. A barrel roll over the line-up.', duration: 16 },
  { id: 'charge', n: '06', title: 'Charge', caption: '500 kW. About ten minutes, 10–80 %.', duration: 8 },
  { id: 'variants', n: '07', title: 'Variants', caption: 'Performance, Thrust, Rocket.', duration: 8 },
  { id: 'road', n: '08', title: 'Road to 2028', caption: 'From 2008 to production in Texas.', duration: 10 },
  { id: 'configure', n: '09', title: 'Configure', caption: 'Pick a paint. Design yours.', duration: 8 },
];

export const FILM_TOTAL = CHAPTERS.reduce((a, c) => a + c.duration, 0);
export const CUT = { blackout: 0.15, title: 0.6, banks: 0.35 };
export const CUT_TOTAL = CUT.blackout + CUT.title + CUT.banks;
