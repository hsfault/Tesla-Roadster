import { useRef } from 'react';
import { fadeIn, fadeOut, wipeIn } from '../lib/gsap';
import { useSection } from './useSection';
import { flightShot, FLIGHT } from '../three/shots';
import { FLIGHT_LINE } from '../data/specs';
import Headline from '../components/Headline';
import SectionProgress from '../components/SectionProgress';

const MARKS = [
  { label: 'Take-off', at: FLIGHT.takeoff },
  { label: 'Roll', at: FLIGHT.roll },
  { label: 'Landing', at: FLIGHT.landing },
];
const SPAN = [0.2, 0.7]; // scrubber covers this slice of the section

/**
 * 05 · Flight — approach, four downward cold-gas jets, 360° barrel roll over the line-up, landing in smoke.
 * The line of text appears before take-off and is gone long before any smoke; the scrubber clears before
 * the landing cloud grows. The DOM smoke (director: domSmoke) carries the hand-off into Charge.
 */
export default function Flight() {
  const ref = useRef();
  const text = useRef();
  const scrub = useRef();
  const fill = useRef();
  const marks = useRef([]);
  const prog = useRef();
  const lit = useRef([false, false, false]);

  useSection(ref, {
    id: 'flight',
    order: 4,
    shot: flightShot,
    onProgress: (p) => {
      MARKS.forEach((m, i) => {
        const on = p >= m.at;
        if (on !== lit.current[i]) {
          lit.current[i] = on;
          marks.current[i]?.classList.toggle('is-on', on);
        }
      });
    },
    build: (tl) => {
      tl.fromTo(prog.current, { scaleY: 0 }, { scaleY: 1, duration: 1 }, 0);
      tl.fromTo(text.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.001 }, 0.03);
      wipeIn(tl, text.current.querySelector('.wipe'), 0.03, 0.05);
      fadeIn(tl, text.current.querySelector('.sub'), 0.07, 0.03);
      fadeOut(tl, text.current, 0.18, 0.025); // gone well before take-off (0.25) and the smoke (0.64+)
      fadeIn(tl, scrub.current, SPAN[0], 0.03, 0);
      tl.fromTo(fill.current, { scaleX: 0 }, { scaleX: 1, duration: SPAN[1] - SPAN[0] }, SPAN[0]);
      fadeOut(tl, scrub.current, 0.67, 0.03); // cleared before the landing cloud fills the screen
    },
  });

  return (
    <section ref={ref} id="flight" data-chapter="flight" data-scrolly className="relative" style={{ height: '400vh' }}>
      <div className="stage">
        <div ref={text} data-block className="absolute bottom-[96px] left-0 right-0 z-10" style={{ visibility: 'hidden' }}>
          <div className="gutter">
            <div className="scrim-bl max-w-[900px]">
              <p className="label mb-3">05 — Cold-gas thrusters</p>
              <Headline className="display text-[clamp(1.7rem,4.2vw,4rem)] leading-[1.08]">{FLIGHT_LINE}</Headline>
              <p className="sub mt-5 max-w-[48ch] text-[17px] text-mist">A 200-litre compressed-gas tank feeds the nozzles for a few seconds of thrust. Refilling takes two to six hours.</p>
            </div>
          </div>
        </div>

        <div ref={scrub} data-block className="rm-hide absolute bottom-[96px] left-1/2 z-10 w-[min(560px,calc(100vw-32px))] -translate-x-1/2" style={{ visibility: 'hidden' }}>
          <div className="plate px-5 pb-4 pt-5">
            <div className="relative h-[2px] bg-rig">
              <span ref={fill} className="led-line absolute inset-0 block" style={{ transform: 'scaleX(0)' }} />
              {MARKS.map((m, i) => {
                const x = ((m.at - SPAN[0]) / (SPAN[1] - SPAN[0])) * 100;
                return (
                  <span key={m.label} ref={(r) => (marks.current[i] = r)} className="group absolute top-1/2" style={{ left: `${x}%` }}>
                    <span className="absolute -left-[4px] -top-[4px] block h-[8px] w-[8px] rounded-full border border-steel bg-asphalt group-[.is-on]:border-led group-[.is-on]:bg-led" />
                    <span className={`mono absolute top-3 whitespace-nowrap text-[12px] uppercase tracking-[0.14em] text-mist group-[.is-on]:text-white ${i === 0 ? 'left-0' : i === MARKS.length - 1 ? 'right-0' : '-translate-x-1/2'}`}>
                      {m.label}
                    </span>
                  </span>
                );
              })}
            </div>
            <div className="h-6" />
          </div>
        </div>
        <SectionProgress ref={prog} label="Flight" />
      </div>
    </section>
  );
}
