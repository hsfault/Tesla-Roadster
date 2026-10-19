import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { gsap, ScrollTrigger } from '../lib/gsap';
import { getLenis, scrollToEl, scrollToY } from '../lib/lenis';
import { announcePageEnter, registerNavigator } from '../lib/transition';
import { snapScrub } from '../three/director';
import { useUI } from '../store/ui';

const SPRITES = [
  { src: '/fx/smoke-1.jpg', x: -38, s: 1.5 },
  { src: '/fx/smoke-3.jpg', x: -12, s: 1.8 },
  { src: '/fx/smoke-5.jpg', x: 16, s: 1.6 },
  { src: '/fx/smoke-2.jpg', x: 38, s: 1.5 },
  { src: '/fx/smoke-6.jpg', x: -26, s: 1.3 },
  { src: '/fx/smoke-4.jpg', x: 4, s: 2.0 },
  { src: '/fx/smoke-1.jpg', x: 28, s: 1.4 },
];

const frame = () => new Promise((r) => requestAnimationFrame(() => r()));

export async function settleOnHash(hash) {
  await frame();
  await frame();
  ScrollTrigger.refresh();
  if (hash) {
    const el = document.querySelector(hash);
    if (el) scrollToY(el.getBoundingClientRect().top + window.scrollY, { immediate: true });
  } else scrollToY(0, { immediate: true });
  await frame();
  ScrollTrigger.update();
  snapScrub();
}

/**
 * Route change: outgoing text fades (0.2 s) → white smoke billows up from the bottom (no text on it) →
 * page swaps while fully covered → smoke drifts apart (0.7 s) → only then the new headline wipes in.
 */
export default function SmokeTransition() {
  const navigate = useNavigate();
  const location = useLocation();
  const loc = useRef(location);
  loc.current = location;
  const root = useRef();
  const base = useRef();
  const sprites = useRef([]);
  const busy = useRef(false);

  useEffect(
    () =>
      registerNavigator(async (to) => {
        const url = new URL(to, window.location.origin);
        const path = url.pathname;
        const hash = url.hash;
        if (path === loc.current.pathname) {
          if (hash) scrollToEl(hash);
          else scrollToY(0, { duration: 1.6 });
          return;
        }
        if (busy.current) return;
        busy.current = true;
        const ui = useUI.getState();
        ui.set({ transitioning: true, menuOpen: false });
        const page = document.getElementById('page');
        const reduced = ui.reduced;
        const el = root.current;
        gsap.set(el, { display: 'block' });

        if (reduced) {
          gsap.set(base.current, { backgroundColor: '#050507' });
          await gsap.to(base.current, { opacity: 1, duration: 0.3 });
          navigate(path + url.search);
          await settleOnHash(hash);
          await gsap.to(base.current, { opacity: 0, duration: 0.3 });
        } else {
          gsap.set(base.current, { backgroundColor: '#DADDE0', opacity: 0 });
          // 1. outgoing text fades fully before any smoke appears
          await gsap.to(page, { autoAlpha: 0, duration: 0.2, ease: 'none' });
          // 2. billow up from the bottom
          const tl = gsap.timeline();
          tl.to(base.current, { opacity: 1, duration: 0.5, ease: 'power2.in' }, 0);
          sprites.current.forEach((sp, i) => {
            const d = SPRITES[i];
            tl.fromTo(
              sp,
              { xPercent: -50, x: `${d.x}vw`, y: '70vh', scale: d.s * 0.5, opacity: 0, rotation: i * 23 },
              { y: `${-6 - (i % 3) * 6}vh`, scale: d.s, opacity: 1, rotation: i * 23 + 12, duration: 0.5, ease: 'power2.out' },
              i * 0.035
            );
          });
          await tl;
          useUI.getState().set({ transitionCovered: true });
          // 3. swap while fully covered
          navigate(path + url.search);
          await settleOnHash(hash);
          useUI.getState().set({ transitionCovered: false });
          await frame();
          // 4. drift apart and clear
          const out = gsap.timeline();
          sprites.current.forEach((sp, i) => {
            const d = SPRITES[i];
            out.to(sp, { x: `${d.x * 2.2}vw`, y: `${-30 - (i % 2) * 15}vh`, scale: d.s * 1.5, opacity: 0, duration: 0.7, ease: 'power2.in' }, 0);
          });
          out.to(base.current, { opacity: 0, duration: 0.6, ease: 'power1.in' }, 0.05);
          await out;
          gsap.set(page, { autoAlpha: 1 });
        }
        gsap.set(el, { display: 'none' });
        getLenis()?.start();
        busy.current = false;
        useUI.getState().set({ transitioning: false });
        // 5. the new headline may wipe in now
        announcePageEnter();
      }),
    [navigate]
  );

  return (
    <div ref={root} className="pointer-events-none fixed inset-0 z-[80] hidden overflow-hidden" aria-hidden="true">
      <div ref={base} className="absolute inset-0 opacity-0" />
      {SPRITES.map((s, i) => (
        <img
          key={i}
          ref={(r) => (sprites.current[i] = r)}
          src={s.src}
          alt=""
          className="absolute left-1/2 top-1/2 w-[90vmax] max-w-none opacity-0"
          style={{ mixBlendMode: 'screen', marginTop: '-45vmax' }}
          draggable={false}
        />
      ))}
    </div>
  );
}
