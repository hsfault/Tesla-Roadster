import { useRef } from 'react';
import { fadeIn, fadeOut, wipeIn } from '../lib/gsap';
import { useSection } from './useSection';
import { wallShot, WALL, seg } from '../three/shots';
import { FAN_RPM_ILLUSTRATIVE, WALL_CAPTION } from '../data/specs';
import Odometer from '../components/Odometer';
import GMeter from '../components/GMeter';
import Headline from '../components/Headline';
import SectionProgress from '../components/SectionProgress';

const CAMS = ['Cam 1 · Wide', 'Cam 2 · Overhead', 'Cam 3 · Base'];

/** 04 · The Wall — the curved ramp lights up, the car climbs to vertical; G-meter + fan readout HUD. */
export default function TheWall() {
  const ref = useRef();
  const head = useRef();
  const hud = useRef();
  const g = useRef();
  const rpm = useRef();
  const cam = useRef();
  const caption = useRef();
  const prog = useRef();
  const camIdx = useRef(-1);

  useSection(ref, {
    id: 'wall',
    order: 3,
    shot: wallShot,
    onProgress: (p) => {
      g.current?.set(2 * seg(p, 0.3, 0.48) * (1 - seg(p, 0.78, 0.9)));
      rpm.current?.set(FAN_RPM_ILLUSTRATIVE * seg(p, 0.08, 0.28) * (1 - seg(p, 0.82, 0.92)));
      const c = p < WALL.overhead || p >= WALL.wide ? 0 : p < WALL.base ? 1 : 2;
      if (c !== camIdx.current && cam.current) {
        camIdx.current = c;
        cam.current.textContent = CAMS[c];
      }
    },
    build: (tl) => {
      tl.fromTo(prog.current, { scaleY: 0 }, { scaleY: 1, duration: 1 }, 0);
      wipeIn(tl, head.current.querySelector('.wipe'), 0.02, 0.06);
      fadeIn(tl, head.current.querySelector('.cam'), 0.05, 0.03, 0);
      fadeIn(tl, hud.current, 0.1, 0.05, 0);
      fadeOut(tl, head.current, 0.9, 0.04);
      fadeOut(tl, hud.current, 0.9, 0.04);
      tl.fromTo(caption.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.001 }, 0.53);
      fadeIn(tl, caption.current.querySelector('p'), 0.53, 0.04);
      fadeOut(tl, caption.current, 0.74, 0.03);
    },
  });

  return (
    <section ref={ref} id="wall" data-chapter="wall" data-scrolly className="relative" style={{ height: '400vh' }}>
      <div className="stage">
        <div ref={head} data-block className="absolute left-0 right-0 top-[96px] z-10">
          <div className="gutter">
            <div className="scrim-tl inline-block pr-8">
              <p className="label mb-3">04 — Suction fans</p>
              <Headline className="display text-section">The wall</Headline>
              <p className="cam mono mt-4 inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-white">
                <span className="h-[6px] w-[6px] rounded-full bg-led" style={{ boxShadow: 'var(--led-glow)' }} aria-hidden="true" />
                <span ref={cam}>{CAMS[0]}</span>
              </p>
            </div>
          </div>
        </div>

        <div ref={hud} data-block className="absolute bottom-[96px] right-[var(--gutter)] z-10 md:right-[calc(var(--gutter)+40px)]">
          <div className="plate flex items-center gap-4 p-3 sm:gap-6 sm:p-4">
            <GMeter ref={g} className="h-[92px] w-[92px] sm:h-[128px] sm:w-[128px]" />
            <div className="flex flex-col gap-1">
              <span className="label">Fan rpm</span>
              <Odometer ref={rpm} int={5} commas className="text-[clamp(1.3rem,2.6vw,2rem)] text-white" label="Fan speed" />
              <span className="label mt-2">Downforce</span>
              <span className="mono text-[15px] text-white">up to 2 G</span>
            </div>
          </div>
        </div>

        <div ref={caption} data-block className="absolute bottom-[250px] left-0 right-0 z-10 lg:bottom-[96px]" style={{ visibility: 'hidden' }}>
          <div className="gutter">
            <p className="scrim-bl max-w-[560px] text-[clamp(1.2rem,2.2vw,1.75rem)] font-medium leading-snug text-white">{WALL_CAPTION}</p>
          </div>
        </div>
        <SectionProgress ref={prog} label="The wall" />
      </div>
    </section>
  );
}
