import { useEffect, useRef, useState } from 'react';
import { gsap } from '../lib/gsap';
import { useUI } from '../store/ui';
import BrandImg from './BrandImg';

const DOTS = 12;
const SEEN = 'rn:loaded';
const MAX_WAIT_MS = 20000; // never hold the page hostage: after 20 s the lights come on regardless

/**
 * "Lights on" loader. 12 floodlight dots switch on with REAL progress:
 * fonts (10 %) + 3D chunk (10 %) + asset loading via useProgress (70 %) + scene compiled (10 %).
 * In stills mode the asset share is the first still. Skipped on return visits within the session.
 */
export default function Loader() {
  const [visible, setVisible] = useState(() => {
    try {
      return sessionStorage.getItem(SEEN) !== '1';
    } catch {
      return true;
    }
  });
  const root = useRef();
  const dots = useRef([]);
  const line = useRef();
  const lit = useRef(0);
  const done = useRef(false);

  useEffect(() => {
    if (!visible) {
      useUI.getState().set({ loaderDone: true });
      return;
    }
    let fontsDone = false;
    const started = performance.now();
    document.fonts?.ready.then(() => (fontsDone = true));
    const tick = () => {
      const s = useUI.getState();
      const assets = s.renderMode === 'live' ? s.loadProgress ?? 0 : s.stillsProgress ?? 0;
      // live: the last 10 % is the compiled scene; stills: there is no scene, the first still being in is "ready"
      const ready = s.renderMode === 'live' ? s.sceneReady : (s.stillsProgress ?? 0) >= 1;
      const timedOut = performance.now() - started > MAX_WAIT_MS;
      const total = timedOut
        ? 1
        : (fontsDone ? 0.1 : 0) + (s.chunkLoaded || s.renderMode !== 'live' ? 0.1 : 0) + assets * 0.7 + (ready ? 0.1 : 0);
      const target = Math.min(DOTS, Math.floor(total * DOTS + 1e-6));
      while (lit.current < target) {
        const el = dots.current[lit.current];
        if (el) {
          el.firstChild.style.background = '#F3F5F7';
          gsap.fromTo(el.lastChild, { opacity: 1, scale: 1.8 }, { opacity: 0.45, scale: 1, duration: 0.55, ease: 'power2.out' });
        }
        lit.current++;
      }
      if (lit.current >= DOTS && !done.current) {
        done.current = true;
        finish();
      }
    };
    const finish = () => {
      gsap.ticker.remove(tick);
      const tl = gsap.timeline();
      tl.fromTo(line.current, { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'expo.out' }, 0.15);
      tl.to(root.current, { opacity: 0, duration: 0.6, ease: 'power1.out' }, '+=0.15');
      tl.add(() => {
        try {
          sessionStorage.setItem(SEEN, '1');
        } catch {
          /* private mode */
        }
        useUI.getState().set({ loaderDone: true });
        setVisible(false);
      });
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [visible]);

  if (!visible) return null;
  return (
    <div ref={root} className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-night" role="progressbar" aria-label="Loading the reveal">
      <BrandImg kind="logo" alt="Tesla" style={{ height: 44, width: 'auto' }} />
      <div className="mt-10 flex flex-col items-stretch">
        <div className="flex gap-[10px] sm:gap-[14px]">
          {Array.from({ length: DOTS }).map((_, i) => (
            <span key={i} ref={(r) => (dots.current[i] = r)} className="relative block h-[7px] w-[7px]">
              <span className="absolute inset-0 rounded-full bg-rig" />
              <span className="absolute -inset-[9px] rounded-full opacity-0" style={{ background: 'radial-gradient(circle, rgba(255,255,255,.8) 0%, rgba(255,255,255,0) 68%)' }} />
            </span>
          ))}
        </div>
        <span ref={line} className="led-line mt-5 block" style={{ transform: 'scaleX(0)' }} />
      </div>
      <p className="label mt-6">Lights on</p>
    </div>
  );
}
