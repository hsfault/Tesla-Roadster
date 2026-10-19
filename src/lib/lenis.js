import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsap';

let lenis = null;
const listeners = new Set();

export function initLenis() {
  if (lenis) return lenis;
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 0.9, touchMultiplier: 1.2 });
  lenis.on('scroll', ScrollTrigger.update);
  lenis.on('scroll', (l) => listeners.forEach((fn) => fn(l)));
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export const getLenis = () => lenis;

export function onScroll(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function scrollToY(y, opts = {}) {
  if (lenis) lenis.scrollTo(y, { force: true, ...opts });
  else window.scrollTo(0, y);
}

export function scrollToEl(target, opts = {}) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY;
  scrollToY(y, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 3), ...opts });
}
