// Tiny synthesized sound kit (no audio files): floodlight "clunk", countdown tick, low arena hum.
let ctx = null;
let hum = null;
let enabled = false;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function setSound(on) {
  enabled = on;
  if (!on) stopHum();
}

export const soundOn = () => enabled;

export function clunk(strength = 1) {
  if (!enabled) return;
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(90, t);
  osc.frequency.exponentialRampToValueAtTime(38, t + 0.25);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.5 * strength, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.45);
  // relay click
  const len = Math.floor(c.sampleRate * 0.03);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const n = c.createBufferSource();
  const f = c.createBiquadFilter();
  const ng = c.createGain();
  f.type = 'bandpass';
  f.frequency.value = 1800;
  ng.gain.value = 0.25 * strength;
  n.buffer = buf;
  n.connect(f).connect(ng).connect(c.destination);
  n.start(t);
}

export function tick() {
  if (!enabled) return;
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.frequency.value = 880;
  g.gain.setValueAtTime(0.12, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + 0.14);
}

export function startHum() {
  if (!enabled || hum) return;
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const o2 = c.createOscillator();
  const g = c.createGain();
  const f = c.createBiquadFilter();
  o.type = 'sawtooth';
  o.frequency.value = 55;
  o2.type = 'sine';
  o2.frequency.value = 110.4;
  f.type = 'lowpass';
  f.frequency.value = 180;
  g.gain.value = 0.0001;
  g.gain.exponentialRampToValueAtTime(0.05, c.currentTime + 1.2);
  o.connect(f);
  o2.connect(f);
  f.connect(g).connect(c.destination);
  o.start();
  o2.start();
  hum = { o, o2, g };
}

export function stopHum() {
  if (!hum || !ctx) return;
  const { o, o2, g } = hum;
  g.gain.cancelScheduledValues(ctx.currentTime);
  g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.2);
  o.stop(ctx.currentTime + 0.8);
  o2.stop(ctx.currentTime + 0.8);
  hum = null;
}
