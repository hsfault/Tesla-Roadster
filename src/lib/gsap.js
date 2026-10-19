import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
gsap.defaults({ ease: 'power2.out' });
ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap, ScrollTrigger, SplitText, useGSAP };

/**
 * Scrubbed headline wipe: the text is revealed left→right behind a red LED line that travels ahead of it.
 * `el` is a `.wipe` element containing `.wipe-text` and `.wipe-led`.
 */
export function wipeIn(tl, el, at = 0, dur = 0.08) {
  if (!el) return tl;
  const text = el.querySelector('.wipe-text');
  const led = el.querySelector('.wipe-led');
  tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.001, ease: 'none' }, at);
  tl.fromTo(text, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: dur, ease: 'power3.out' }, at);
  if (led) {
    tl.fromTo(led, { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: dur * 0.8, ease: 'power3.out' }, at);
    tl.to(led, { opacity: 0.35, duration: dur * 0.5, ease: 'none' }, at + dur);
  }
  return tl;
}

/** Fade an element out completely (outgoing text always clears before anything new arrives). */
export function fadeOut(tl, el, at, dur = 0.04) {
  if (!el) return tl;
  tl.to(el, { autoAlpha: 0, duration: dur, ease: 'none' }, at);
  return tl;
}

/** Fade (and lift) an element in. */
export function fadeIn(tl, el, at, dur = 0.05, y = 12) {
  if (!el) return tl;
  tl.fromTo(el, { autoAlpha: 0, y }, { autoAlpha: 1, y: 0, duration: dur, ease: 'power2.out' }, at);
  return tl;
}

/** Time-based headline wipe (0.9s, expo.out) for page headlines. */
export function playWipe(el, delay = 0) {
  if (!el) return null;
  const text = el.querySelector('.wipe-text');
  const led = el.querySelector('.wipe-led');
  const tl = gsap.timeline({ delay });
  tl.set(el, { autoAlpha: 1 });
  tl.fromTo(text, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'expo.out' }, 0);
  if (led) {
    tl.fromTo(led, { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.75, ease: 'expo.out' }, 0);
    tl.to(led, { opacity: 0.35, duration: 0.6 }, 0.8);
  }
  return tl;
}

/** Labels type in character by character (no scramble). */
export function typeIn(el, { delay = 0, stagger = 0.022 } = {}) {
  if (!el) return null;
  const split = SplitText.create(el, { type: 'chars' });
  const tl = gsap.timeline({ delay, onComplete: () => split.revert() });
  tl.set(el, { autoAlpha: 1 });
  tl.from(split.chars, { opacity: 0, duration: 0.01, stagger, ease: 'none' });
  return tl;
}
