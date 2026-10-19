// The director: a flat, numeric scene state recomputed every frame from scroll progress (GSAP, scrub: 1)
// and pure shot functions (shots.js). Nothing here allocates per frame and nothing touches React state.

export const KEYS = [
  // camera
  'camX', 'camY', 'camZ', 'tgtX', 'tgtY', 'tgtZ', 'fov', 'shake', 'shiftX', 'shiftY', 'orbit', 'parallax',
  // car (contact-point position + Euler rotation)
  'carX', 'carY', 'carZ', 'carRX', 'carRY', 'carRZ', 'carVis',
  // lights
  'f0', 'f1', 'f2', 'env', 'bar', 'front', 'glow',
  'spot', 'spX', 'spY', 'spZ', 'stX', 'stY', 'stZ',
  // LED lines
  'ledLevel', 'ledDraw', 'ledFlow', 'ledDash', 'ledStretch', 'ledFlash', 'frame',
  // set pieces
  'arena', 'ramp', 'rampLed', 'lineup', 'lines',
  // particles / smoke
  'jetRear', 'jetDown', 'jetFan', 'landing', 'domSmoke',
  // hotspots
  'hot0', 'hot1', 'hot2', 'hot3',
];

export const DEFAULTS = {
  camX: 4.3, camY: 0.8, camZ: 5.4, tgtX: 0, tgtY: 0.5, tgtZ: 0.2, fov: 32, shake: 0, shiftX: 0, shiftY: 0, orbit: 0, parallax: 1,
  carX: 0, carY: 0, carZ: 0, carRX: 0, carRY: 0, carRZ: 0, carVis: 1,
  f0: 1, f1: 1, f2: 1, env: 1, bar: 1, front: 1, glow: 0,
  spot: 0, spX: 0, spY: 11, spZ: 0.5, stX: 0, stY: 0, stZ: 0,
  ledLevel: 1, ledDraw: 1, ledFlow: 0, ledDash: 0, ledStretch: 0, ledFlash: 0, frame: 0,
  arena: 1, ramp: 0, rampLed: 0, lineup: 0, lines: 0,
  jetRear: 0, jetDown: 0, jetFan: 0, landing: 0, domSmoke: 0,
  hot0: 0, hot1: 0, hot2: 0, hot3: 0,
};

export const makeState = () => ({ ...DEFAULTS });
export function reset(s) {
  for (let i = 0; i < KEYS.length; i++) s[KEYS[i]] = DEFAULTS[KEYS[i]];
  return s;
}
function blend(out, a, b, t) {
  for (let i = 0; i < KEYS.length; i++) {
    const k = KEYS[i];
    out[k] = a[k] + (b[k] - a[k]) * t;
  }
}
function copy(out, a) {
  for (let i = 0; i < KEYS.length; i++) out[KEYS[i]] = a[KEYS[i]];
}

/** The computed state everything reads. */
export const out = makeState();
const A = makeState();
const B = makeState();

/** Time-based effects layered on top of scroll (intro, film cuts, variant moves, capture overrides). */
export const fx = {
  time: 0,
  intro: 0, // 0→1 over the hero "lights on" sequence (6.5 s)
  bank: [1, 1, 1], // film-cut bank multipliers (left → right)
  blackout: 0, // 1 = scene fully black (film cuts)
  flare: [0, 0, 0], // per-bank glare spikes, decays automatically
  vmPivot: 0, // variant moves
  vmHop: 0,
  vmRear: 0,
  vmAll: 0,
  puffs: [], // queued puff bursts: 'rear' | 'all'
  override: null, // capture: { section, p } | { mode, ... }
  snapshot: null, // callback(blob) requested by the configurator
};

const sections = [];

/**
 * Register a home section. `shot(o, p)` writes state for progress p (0–1) into o (pre-reset to defaults);
 * `still(p)` names the pre-rendered still for the stills fallback.
 */
export function registerSection({ id, order, shot, still }) {
  unregisterSection(id);
  const entry = { id, order, shot, still, enter: order === 0 ? 1 : 0, p: 0, triggers: [] };
  sections.push(entry);
  sections.sort((a, b) => a.order - b.order);
  return entry;
}

export function unregisterSection(id) {
  const i = sections.findIndex((s) => s.id === id);
  if (i >= 0) sections.splice(i, 1);
}

export const getSections = () => sections;

/** Index of the section currently owning the screen. */
export function currentIndex(threshold = 0.0001) {
  let k = 0;
  for (let i = 0; i < sections.length; i++) if (sections[i].enter > threshold) k = i;
  return k;
}

/** Jump every scrubbed tween to its target (after film cuts / programmatic jumps). */
export function snapScrub() {
  for (const s of sections)
    for (const st of s.triggers) {
      const tw = st.getTween && st.getTween();
      if (tw) tw.progress(1);
    }
}

let modeShots = null;
export function setModeShots(shots) {
  modeShots = shots;
}

function computeHome(o) {
  if (!sections.length) {
    reset(o);
    return;
  }
  const k = currentIndex();
  const cur = sections[k];
  reset(B);
  cur.shot(B, cur.p);
  if (k > 0 && cur.enter < 0.9999) {
    const prev = sections[k - 1];
    reset(A);
    prev.shot(A, prev.p);
    const t = cur.enter;
    blend(o, A, B, t * t * (3 - 2 * t));
  } else copy(o, B);
}

/** Recompute `out` for this frame. */
export function compute(mode, time) {
  fx.time = time;
  const ov = fx.override;
  if (ov && ov.section) {
    const s = sections.find((x) => x.id === ov.section);
    reset(out);
    if (s) s.shot(out, ov.p);
  } else if (ov && ov.mode && modeShots?.[ov.mode]) {
    reset(out);
    modeShots[ov.mode](out, ov);
  } else if (mode === 'home') computeHome(out);
  else if (modeShots?.[mode]) {
    reset(out);
    modeShots[mode](out, 0);
  } else {
    reset(out);
    out.f0 = out.f1 = out.f2 = out.env = out.ledLevel = out.carVis = out.arena = 0;
  }
  out.f0 *= fx.bank[0];
  out.f1 *= fx.bank[1];
  out.f2 *= fx.bank[2];
  out.carY += fx.vmHop;
  out.carRY += fx.vmPivot;
  return out;
}
