import { useRef } from 'react';
import { fadeIn, fadeOut, wipeIn } from '../lib/gsap';
import { useSection } from './useSection';
import { chargeShot, seg } from '../three/shots';
import { KEY } from '../data/specs';
import Odometer from '../components/Odometer';
import Headline from '../components/Headline';
import SectionProgress from '../components/SectionProgress';

const FILL = [0.36, 0.84];

/** 06 · Charge — appears only after the landing smoke has cleared. */
export default function Charge() {
  const ref = useRef();
  const block = useRef();
  const kw = useRef();
  const clock = useRef();
  const pct = useRef();
  const bar = useRef();
  const prog = useRef();

  useSection(ref, {
    id: 'charge',
    order: 5,
    shot: chargeShot,
    onProgress: (p) => {
      const u = seg(p, FILL[0], FILL[1]);
      kw.current?.set(KEY.chargeKw * Math.min(1, u * 1.6));
      const secs = Math.round(u * KEY.chargeMinutes * 60);
      if (clock.current) clock.current.textContent = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
      if (pct.current) pct.current.textContent = `${Math.round(10 + 70 * u)} %`;
    },
    build: (tl) => {
      tl.fromTo(prog.current, { scaleY: 0 }, { scaleY: 1, duration: 1 }, 0);
      tl.fromTo(block.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.001 }, 0.3); // after the smoke clears
      wipeIn(tl, block.current.querySelector('.wipe'), 0.3, 0.06);
      block.current.querySelectorAll('[data-in]').forEach((el, i) => fadeIn(tl, el, 0.33 + i * 0.025, 0.04));
      tl.fromTo(bar.current, { scaleX: 0.1 }, { scaleX: 0.8, duration: FILL[1] - FILL[0] }, FILL[0]);
      fadeOut(tl, block.current, 0.95, 0.03);
    },
  });

  return (
    <section ref={ref} id="charge" data-chapter="charge" data-scrolly className="relative" style={{ height: '300vh' }}>
      <div className="stage">
        <div ref={block} data-block className="absolute bottom-[96px] left-0 right-0 z-10" style={{ visibility: 'hidden' }}>
          <div className="gutter">
            <div className="scrim-bl max-w-[760px]">
              <p className="label mb-3">06 — Charge</p>
              <Headline className="display text-section">500 kW</Headline>
              <div data-in className="mt-6 flex flex-wrap items-baseline gap-x-8 gap-y-2">
                <span className="mono text-[clamp(1.2rem,2.4vw,1.8rem)] uppercase text-white">~10 min · 10–80 %</span>
                <span className="mono text-[clamp(1.2rem,2.4vw,1.8rem)] uppercase text-white">310–320 mi</span>
              </div>
              <div data-in className="mt-8">
                <div className="mb-2 flex items-center justify-between">
                  <span className="label">Battery</span>
                  <span ref={pct} className="mono text-[14px] text-white">10 %</span>
                </div>
                <div className="relative h-[10px] w-full max-w-[560px] border border-rig bg-night p-[2px]">
                  <span ref={bar} className="led-line block h-full w-full" style={{ height: '100%', transform: 'scaleX(0.1)' }} />
                  {[10, 80].map((t) => (
                    <span key={t} className="absolute -bottom-5 font-mono text-[12px] text-steel" style={{ left: `${t}%`, transform: 'translateX(-50%)' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div data-in className="mt-9 flex flex-wrap gap-x-10 gap-y-3">
                <div>
                  <span className="label block">Elapsed</span>
                  <span ref={clock} className="mono text-[clamp(1.4rem,3vw,2.2rem)] text-white">00:00</span>
                </div>
                <div>
                  <span className="label block">Power</span>
                  <span className="flex items-baseline gap-2 text-white">
                    <Odometer ref={kw} int={3} className="text-[clamp(1.4rem,3vw,2.2rem)]" label="Charging power in kilowatts" />
                    <span className="mono text-[14px] text-mist">kW</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <SectionProgress ref={prog} label="Charge" />
      </div>
    </section>
  );
}
