// Named camera shots + the pure shot functions each home section uses. Units are metres; the car faces +Z.
import { fx } from './director';

// ---------------------------------------------------------------- helpers
export const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const seg = (p, a, b) => clamp01((p - a) / (b - a));
export const smooth = (t) => t * t * (3 - 2 * t);
export const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);
export const easeIn = (t) => t * t;
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;
/** 0 → 1 → 0 window with soft edges */
export const win = (p, a, b, edge = 0.03) => seg(p, a, a + edge) * (1 - seg(p, b - edge, b));

export const PIVOT = 0.5; // car rotates around a point 0.5 m above its contact point

// ---------------------------------------------------------------- named shots ({ position, target, fov, ... })
export const SHOTS = {
  rear: { position: [0.0, 0.95, -6.4], target: [0, 0.62, 0], fov: 32 },
  front34: { position: [4.4, 0.78, 5.5], target: [0, 0.5, 0.15], fov: 32 },
  heroPush: { position: [3.5, 0.62, 4.5], target: [0, 0.52, 0.05], fov: 30 },
  side: { position: [7.4, 0.72, 0.05], target: [0, 0.55, 0], fov: 30 },
  rear34: { position: [2.8, 1.15, -6.0], target: [0, 0.62, -0.2], fov: 30 },
  top: { position: [0.0, 9.2, 0.35], target: [0, 0, 0], fov: 32 },
  chase: { position: [0.85, 0.52, -6.1], target: [0, 0.6, 3], fov: 40 },
  wallWide: { position: [-34, 7.2, 9.5], target: [0, 5.2, 12.5], fov: 44 },
  chargeSide: { position: [-8.6, 1.15, -2.2], target: [0, 0.62, -0.5], fov: 30 },
  overhead: { position: [-0.02, 14, 0], target: [0, 0, 0], fov: 30 },
  teaser: { position: [4.6, 1.0, 4.9], target: [0, 0.48, 0], fov: 30 },
  configure: { position: [4.8, 1.25, 5.2], target: [0, 0.5, 0], fov: 32 },
  specs: { position: [-15.5, 0.62, 0], target: [0, 0.6, 0], fov: 19 },
};

function cam(o, shot) {
  o.camX = shot.position[0];
  o.camY = shot.position[1];
  o.camZ = shot.position[2];
  o.tgtX = shot.target[0];
  o.tgtY = shot.target[1];
  o.tgtZ = shot.target[2];
  o.fov = shot.fov;
}

const _scratch = { position: [0, 0, 0], target: [0, 0, 0], fov: 30 };
/** Current camera of `o` as a shot (scratch object, no allocation). */
function capture(o) {
  _scratch.position[0] = o.camX;
  _scratch.position[1] = o.camY;
  _scratch.position[2] = o.camZ;
  _scratch.target[0] = o.tgtX;
  _scratch.target[1] = o.tgtY;
  _scratch.target[2] = o.tgtZ;
  _scratch.fov = o.fov;
  return _scratch;
}

/** Glide between two shots around their targets (cylindrical interpolation, never through the car). */
function orbitCam(o, a, b, t) {
  const tx = lerp(a.target[0], b.target[0], t);
  const ty = lerp(a.target[1], b.target[1], t);
  const tz = lerp(a.target[2], b.target[2], t);
  const ax = a.position[0] - a.target[0];
  const az = a.position[2] - a.target[2];
  const bx = b.position[0] - b.target[0];
  const bz = b.position[2] - b.target[2];
  let aa = Math.atan2(ax, az);
  let ab = Math.atan2(bx, bz);
  if (ab - aa > Math.PI) ab -= Math.PI * 2;
  if (aa - ab > Math.PI) ab += Math.PI * 2;
  const ang = lerp(aa, ab, t);
  const r = lerp(Math.hypot(ax, az), Math.hypot(bx, bz), t);
  const h = lerp(a.position[1] - a.target[1], b.position[1] - b.target[1], t);
  o.camX = tx + Math.sin(ang) * r;
  o.camZ = tz + Math.cos(ang) * r;
  o.camY = ty + h;
  o.tgtX = tx;
  o.tgtY = ty;
  o.tgtZ = tz;
  o.fov = lerp(a.fov, b.fov, t);
}

/** Place the car by its centre (pivot) — used in flight so the roll turns around the centre of mass. */
function carCenter(o, x, y, z, rx, ry, rz) {
  // up vector of Euler(rx, ry, rz) in XYZ order applied to (0,1,0)
  const cx = Math.cos(rx), sx = Math.sin(rx), cz = Math.cos(rz), sz = Math.sin(rz);
  const cy = Math.cos(ry), sy = Math.sin(ry);
  // R = Rx * Ry * Rz ; up = R * (0,1,0)
  const ux0 = -sz, uy0 = cz; // Rz
  const ux1 = ux0 * cy, uz1 = -ux0 * sy, uy1 = uy0; // Ry
  const ux = ux1, uy = uy1 * cx - uz1 * sx, uz = uy1 * sx + uz1 * cx; // Rx
  o.carX = x - ux * PIVOT;
  o.carY = y - uy * PIVOT;
  o.carZ = z - uz * PIVOT;
  o.carRX = rx;
  o.carRY = ry;
  o.carRZ = rz;
}

// ---------------------------------------------------------------- hero intro (time-based, 6.5 s)
export const INTRO_SECONDS = 6.5;
const bankLevel = (t, at) => smooth(seg(t, at, at + 0.08));

export function heroShot(o, p) {
  const t = fx.intro * INTRO_SECONDS;
  o.f0 = bankLevel(t, 0.3);
  o.f1 = bankLevel(t, 0.85);
  o.f2 = bankLevel(t, 1.4);
  o.env = 0.08 + 0.92 * ((o.f0 + o.f1 + o.f2) / 3);
  o.ledDraw = easeOut(seg(t, 1.6, 3.2));
  o.ledLevel = 1;
  o.bar = seg(t, 1.9, 2.8);
  o.front = seg(t, 2.8, 3.3);
  const glide = easeInOut(seg(t, 3.0, 6.5));
  orbitCam(o, SHOTS.rear, SHOTS.front34, glide);
  // scroll: dolly in, then hand over to the walkaround
  const push = smooth(seg(p, 0.0, 1.0)) * glide;
  if (push > 0) orbitCam(o, capture(o), SHOTS.heroPush, push);
  o.shiftX = -0.15 * glide;
  o.shiftY = 0.2; // portrait: car in the upper half
  o.liftL = 0.055; // landscape: extra lift so the car clears the headline block
  o.orbit = glide;
}

// ---------------------------------------------------------------- walkaround
export function walkShot(o, p) {
  if (p < 0.22) cam(o, SHOTS.side);
  else if (p < 0.36) orbitCam(o, SHOTS.side, SHOTS.rear34, easeInOut(seg(p, 0.22, 0.36)));
  else if (p < 0.58) cam(o, SHOTS.rear34);
  else orbitCam(o, SHOTS.rear34, SHOTS.top, easeInOut(seg(p, 0.58, 0.72)));
  const top = seg(p, 0.6, 0.74);
  o.spot = top;
  o.spX = 0;
  o.spY = 11;
  o.spZ = 0.4;
  o.f0 = o.f1 = o.f2 = 1 - 0.75 * top;
  o.env = 1 - 0.4 * top;
  o.shiftX = p < 0.6 ? -0.12 : -0.12 * (1 - top);
  o.shiftY = p < 0.6 ? 0.12 : 0.12 * (1 - top);
  o.orbit = 0.35;
  o.hot1 = win(p, 0.06, 0.24); // brakes (side)
  o.hot2 = win(p, 0.38, 0.57); // suction fans (rear)
  o.hot3 = win(p, 0.42, 0.57); // charge port (rear)
  o.hot0 = win(p, 0.76, 0.97); // glass roof (top)
}

// ---------------------------------------------------------------- 0.81 launch
export const LAUNCH = { start: 0.12, lock: 0.62 };
export function launchShot(o, p) {
  const u = seg(p, LAUNCH.start, LAUNCH.lock);
  cam(o, SHOTS.chase);
  o.fov = 40 + 7 * easeIn(u);
  o.ledDash = smooth(seg(p, 0.02, 0.12));
  o.ledStretch = u;
  o.ledFlow = 140 * u * u + 90 * Math.max(0, p - LAUNCH.lock);
  o.ledFlash = win(p, LAUNCH.lock, LAUNCH.lock + 0.07, 0.01);
  o.jetRear = seg(p, LAUNCH.start, LAUNCH.start + 0.03) * (1 - seg(p, LAUNCH.lock - 0.04, LAUNCH.lock + 0.04));
  o.shake = 0.06 * easeIn(u) * (1 - seg(p, LAUNCH.lock, LAUNCH.lock + 0.12));
  o.carRX = -0.012 * u * (1 - seg(p, LAUNCH.lock, LAUNCH.lock + 0.1)); // squat
  o.f0 = o.f1 = o.f2 = 0.75;
  o.env = 0.8;
  o.shiftY = 0.1;
  // after the lock: settle wider to make room for the comparison bars
  const settle = easeInOut(seg(p, 0.72, 0.86));
  if (settle > 0) orbitCam(o, capture(o), SHOTS.rear34, settle);
  o.shiftX = -0.14 * settle;
}

// ---------------------------------------------------------------- the wall
export const RAMP = { z0: 18, R: 7, H: 7, W: 7, startZ: -8 };
const ARC = (Math.PI / 2) * RAMP.R;
const FLAT = RAMP.z0 - RAMP.startZ;
export const RAMP_LEN = FLAT + ARC + 3.2; // where the car holds, vertical

/** Point + angle on the ramp profile at arc length s (s=0 at startZ on the ground). */
export function rampPath(s, outP) {
  if (s <= FLAT) {
    outP.z = RAMP.startZ + s;
    outP.y = 0;
    outP.a = 0;
  } else if (s <= FLAT + ARC) {
    const th = (s - FLAT) / RAMP.R;
    outP.z = RAMP.z0 + RAMP.R * Math.sin(th);
    outP.y = RAMP.R - RAMP.R * Math.cos(th);
    outP.a = th;
  } else {
    outP.z = RAMP.z0 + RAMP.R;
    outP.y = RAMP.R + (s - FLAT - ARC);
    outP.a = Math.PI / 2;
  }
  return outP;
}
const _pf = { z: 0, y: 0, a: 0 };
const _pr = { z: 0, y: 0, a: 0 };
const AXLE_F = 1.39;
const AXLE_R = 1.66;
/** Car on the ramp: wheels on the surface (chord between axle contact points). */
function carOnRamp(o, s) {
  rampPath(s + AXLE_F, _pf);
  rampPath(s - AXLE_R, _pr);
  const dz = _pf.z - _pr.z;
  const dy = _pf.y - _pr.y;
  const len = Math.hypot(dz, dy) || 1;
  const th = Math.atan2(dy, dz);
  o.carZ = _pr.z + (dz / len) * AXLE_R;
  o.carY = _pr.y + (dy / len) * AXLE_R;
  o.carX = 0;
  o.carRX = -th;
  return th;
}

export const WALL = { ramp: [0, 0.12], drive: [0.16, 0.5], hold: [0.5, 0.76], back: [0.76, 0.96], overhead: 0.3, base: 0.5, wide: 0.76 };
export function wallShot(o, p) {
  o.ramp = easeOut(seg(p, 0, 0.12));
  o.rampLed = seg(p, 0.05, 0.2) * (1 - seg(p, 0.84, 0.93));
  o.f0 = o.f1 = o.f2 = 0.55;
  o.env = 0.7;
  o.ledLevel = 0.55;
  let s = 0;
  if (p < WALL.drive[0]) s = 0;
  else if (p < WALL.drive[1]) s = RAMP_LEN * easeInOut(seg(p, WALL.drive[0], WALL.drive[1]));
  else if (p < WALL.back[0]) s = RAMP_LEN;
  else s = RAMP_LEN - (RAMP_LEN + 16) * easeIn(seg(p, WALL.back[0], WALL.back[1]));
  carOnRamp(o, s);
  o.jetFan = seg(p, 0.1, 0.2) * (1 - seg(p, 0.8, 0.9));

  if (p < WALL.overhead || p >= WALL.wide) {
    cam(o, SHOTS.wallWide);
    o.shiftY = 0.06;
  } else if (p < WALL.base) {
    // overhead, looking down the wall, spotlight pool riding with the car
    o.camX = 1.4;
    o.camY = RAMP.R + RAMP.H + 7.5;
    o.camZ = RAMP.z0 + RAMP.R - 7.5;
    o.tgtX = o.carX;
    o.tgtY = o.carY + 0.3;
    o.tgtZ = o.carZ;
    o.fov = 42;
  } else {
    // from the foot of the curve, looking straight up the wall at the car
    o.camX = 1.4;
    o.camY = 1.05;
    o.camZ = RAMP.z0 + 2.5;
    o.tgtX = 0;
    o.tgtY = RAMP.R + 3.2;
    o.tgtZ = RAMP.z0 + RAMP.R - 0.6;
    o.fov = 56;
  }
  // spotlight pool rides with the car (positioned off the surface along its normal)
  const onWall = p >= WALL.overhead && p < WALL.wide;
  o.spot = onWall ? 1 : 0.25;
  const a = -o.carRX;
  o.stX = o.carX;
  o.stY = o.carY;
  o.stZ = o.carZ;
  o.spX = o.carX + 0.5;
  o.spY = o.carY + Math.cos(a) * 10;
  o.spZ = o.carZ - Math.sin(a) * 10;
}

// ---------------------------------------------------------------- flight
export const LINEUP_Z = [8, 10.3, 12.6, 14.9];
export const FLIGHT = { takeoff: 0.25, roll: 0.32, rollEnd: 0.62, landing: 0.64, apex: 0.47 };
export function flightShot(o, p) {
  o.lineup = easeOut(seg(p, 0, 0.08));
  o.f0 = o.f1 = o.f2 = 0.7;
  o.env = 0.8;
  o.ledLevel = 0.7;
  let z, y, roll = 0;
  if (p < FLIGHT.takeoff) {
    z = -22 + 24 * easeIn(seg(p, 0.02, FLIGHT.takeoff));
    y = PIVOT;
  } else if (p < FLIGHT.roll) {
    const u = seg(p, FLIGHT.takeoff, FLIGHT.roll);
    z = 2 + 3 * u;
    y = PIVOT + 0.9 * easeOut(u);
  } else if (p < FLIGHT.rollEnd) {
    const u = seg(p, FLIGHT.roll, FLIGHT.rollEnd);
    z = 5 + 14 * u;
    y = PIVOT + 0.9 + 3.6 * Math.sin(Math.PI * u);
    roll = Math.PI * 2 * easeInOut(u);
  } else {
    const u = seg(p, FLIGHT.rollEnd, 0.7);
    z = 19 + 3 * easeOut(u);
    y = PIVOT + 0.9 * (1 - easeIn(u));
  }
  carCenter(o, 0, y, z, 0, 0, roll);
  o.jetDown = seg(p, FLIGHT.takeoff - 0.01, FLIGHT.takeoff + 0.02) * (1 - seg(p, 0.64, 0.69));
  o.landing = seg(p, 0.64, 0.92);
  o.domSmoke = seg(p, 0.8, 0.95);

  if (p < FLIGHT.apex) {
    o.camX = -9.5;
    o.camY = 1.3 + (y - PIVOT) * 0.35;
    o.camZ = z - 2.5;
    o.tgtX = 0;
    o.tgtY = y * 0.65 + 0.4;
    o.tgtZ = z + 1.2;
    o.fov = 40;
  } else if (p < 0.69) {
    o.camX = 0.8;
    o.camY = y + 9.5;
    o.camZ = z - 1.2;
    o.tgtX = 0;
    o.tgtY = y;
    o.tgtZ = z;
    o.fov = 40;
  } else {
    const u = easeOut(seg(p, 0.69, 1));
    o.camX = 3.2 - 1.2 * u;
    o.camY = 1.3 + 0.4 * u;
    o.camZ = 31 - 4 * u;
    o.tgtX = 0;
    o.tgtY = 1.0;
    o.tgtZ = 22;
    o.fov = 40;
  }
}

// ---------------------------------------------------------------- charge
export function chargeShot(o, p) {
  cam(o, SHOTS.chargeSide);
  o.domSmoke = 1 - smooth(seg(p, 0.0, 0.26));
  o.glow = seg(p, 0.18, 0.36);
  o.f0 = o.f1 = o.f2 = 0.45;
  o.env = 0.6;
  o.ledLevel = 0.5;
  o.shiftX = -0.11;
  o.shiftY = 0.16;
  o.orbit = 0.4;
}

// ---------------------------------------------------------------- variants (overhead spotlight)
export function variantsShot(o) {
  cam(o, SHOTS.overhead);
  o.spot = 1;
  o.spX = 0;
  o.spY = 11;
  o.spZ = 0.4;
  o.f0 = o.f1 = o.f2 = 0.12;
  o.env = 0.45;
  o.ledLevel = 0.35;
  o.frame = 1;
  o.shiftX = -0.16;
  o.shiftY = 0.24;
  o.jetRear = fx.vmRear;
  o.jetDown = fx.vmAll;
}

// ---------------------------------------------------------------- road to 2028
export function roadShot(o, p) {
  o.camX = -9.5;
  o.camY = 2.4;
  o.camZ = lerp(6, -6, p);
  o.tgtX = 0;
  o.tgtY = 0.6;
  o.tgtZ = lerp(1, -1, p);
  o.fov = 30;
  o.f0 = o.f1 = o.f2 = 0.35;
  o.env = 0.5;
  o.ledLevel = 0.6;
}

// ---------------------------------------------------------------- configure teaser
export function teaserShot(o) {
  cam(o, SHOTS.teaser);
  o.carRY = fx.time * 0.16;
  o.shiftX = -0.12;
  o.shiftY = 0.08;
  o.orbit = 0.4;
}

// ---------------------------------------------------------------- non-home modes
export const MODE_SHOTS = {
  configure(o) {
    cam(o, SHOTS.configure);
    o.f0 = 0.12;
    o.f1 = 1;
    o.f2 = 0.12;
    o.env = 0.9;
    o.spot = 0.55;
    o.spY = 11;
    o.ledLevel = 0.5;
    o.shiftX = 0.175;
    o.shiftY = 0.2;
    o.parallax = 0;
  },
  specs(o) {
    cam(o, SHOTS.specs);
    o.lines = 1;
    o.carVis = 0;
    o.arena = 0;
    o.f0 = o.f1 = o.f2 = 0;
    o.env = 0;
    o.ledLevel = 0;
    o.bar = 0;
    o.front = 0;
    o.shiftX = 0.24;
    o.parallax = 0.4;
  },
  // capture-only: empty arena renders used as timeline/env images
  arena(o, ov) {
    o.parallax = 0;
    cam(o, ov.shot || SHOTS.front34);
    o.carVis = 0;
    if (ov.patch) Object.assign(o, ov.patch);
  },
};

// ---------------------------------------------------------------- stills (mobile / low-power / reduced motion)
// Each still is captured once on desktop (npm run capture) into /public/shots/<id>.webp and <id>-m.webp.
export const STILLS = [
  { id: 'hero', section: 'lights-on', p: 0 },
  { id: 'walk-side', section: 'walkaround', p: 0.12 },
  { id: 'walk-rear', section: 'walkaround', p: 0.47 },
  { id: 'walk-top', section: 'walkaround', p: 0.86 },
  { id: 'launch', section: 'launch', p: 0.5 },
  { id: 'wall-wide', section: 'wall', p: 0.24 },
  { id: 'wall-top', section: 'wall', p: 0.44 },
  { id: 'wall-up', section: 'wall', p: 0.64 },
  { id: 'flight-approach', section: 'flight', p: 0.12 },
  { id: 'flight-roll', section: 'flight', p: 0.44 },
  { id: 'charge', section: 'charge', p: 0.6 },
  { id: 'variants', section: 'variants', p: 0.5 },
  { id: 'road', section: 'road', p: 0.5 },
  { id: 'teaser', section: 'configure', p: 0.5 },
];

export const STILL_FOR = {
  'lights-on': () => 'hero',
  walkaround: (p) => (p < 0.3 ? 'walk-side' : p < 0.66 ? 'walk-rear' : 'walk-top'),
  launch: () => 'launch',
  wall: (p) => (p < WALL.overhead || p >= WALL.wide ? 'wall-wide' : p < WALL.base ? 'wall-top' : 'wall-up'),
  flight: (p) => (p < 0.27 ? 'flight-approach' : 'flight-roll'),
  charge: () => 'charge',
  variants: () => 'variants',
  road: () => 'road',
  configure: () => 'teaser',
};
