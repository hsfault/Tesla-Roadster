// Device capability detection — decides between the live 3D scene and pre-rendered stills.
const mq = (q) => typeof window !== 'undefined' && window.matchMedia(q).matches;

export const isCapture = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('capture');

export function prefersReducedMotion() {
  return !isCapture && mq('(prefers-reduced-motion: reduce)');
}

export function isSmallScreen() {
  return mq('(max-width: 767.98px)');
}

export function isLowPower() {
  if (typeof navigator === 'undefined') return false;
  const cores = navigator.hardwareConcurrency || 8;
  const mem = navigator.deviceMemory || 8;
  return cores <= 4 || mem <= 4;
}

function hasWebGL2() {
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch {
    return false;
  }
}

/** Decided once per session load: 'live' (WebGL scene) or 'stills' (pre-rendered WebP shots). */
export function detectRenderMode() {
  if (isCapture) return 'live';
  const forced = new URLSearchParams(window.location.search).get('render');
  if (forced === 'live' || forced === 'stills') return forced;
  if (prefersReducedMotion() || isSmallScreen() || isLowPower() || !hasWebGL2()) return 'stills';
  return 'live';
}
