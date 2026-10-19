import { useRef } from 'react';
import { SplitText, fadeIn, fadeOut, wipeIn } from '../lib/gsap';
import { useSection } from './useSection';
import { launchShot, LAUNCH, seg } from '../three/shots';
import { LAUNCH_COMPARE, KEY } from '../data/specs';
import Odometer from '../components/Odometer';
import Headline from '../components/Headline';
import SectionProgress from '../components/SectionProgress';

const MAX = Math.max(...LAUNCH_COMPARE.map((c) => c.value));

/** 03 · 0.81 — low rear chase, streaming LED speed lines, timer lock, LED comparison bars. */
export default function Launch() {
  const ref = useRef();
  const hud = useRef();
  const timer = useRef();
  const speed = useRef();
  const lockLine = useRef();
  const caption = useRef();
  const compare = useRef();
  const bars = useRef([]);
  const prog = useRef();
  const locked = useRef(false);

  useSection(ref, {
    id: 'launch',
    order: 2,
    shot: launchShot,
    onProgress: (p) => {
      const u = seg(p, LAUNCH.start, LAUNCH.lock);
      timer.current?.set(KEY.zeroSixty * u);
      speed.current?.set(60 * u);
      const isLocked = p >= LAUNCH.lock;
      if (isLocked !== locked.current) {
        locked.current = isLocked;
        hud.current?.classList.toggle('is-locked', isLocked);
      }
    },
    build: (tl) => {
      tl.fromTo(prog.current, { scaleY: 0 }, { scaleY: 1, duration: 1 }, 0);
      fadeIn(tl, hud.current, 0.02, 0.05, 0);
      tl.fromTo(lockLine.current, { scaleX: 0 }, { scaleX: 1, duration: 0.04 }, LAUNCH.lock);
      // caption types in after the lock (character by character, no scramble)
      const split = SplitText.create(caption.current.querySelector('.type'), { type: 'chars' });
      tl.fromTo(caption.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.001 }, LAUNCH.lock + 0.02);
      tl.fromTo(split.chars, { opacity: 0 }, { opacity: 1, duration: 0.002, stagger: 0.0011 }, LAUNCH.lock + 0.02);
      fadeOut(tl, hud.current, 0.72, 0.03);
      fadeOut(tl, caption.current, 0.72, 0.03);
      // comparison: red LED bars grow to scale
      tl.fromTo(compare.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.001 }, 0.77);
      wipeIn(tl, compare.current.querySelector('.wipe'), 0.77, 0.05);
      bars.current.forEach((b, i) => {
        tl.fromTo(b.querySelector('[data-bar]'), { scaleX: 0 }, { scaleX: LAUNCH_COMPARE[i].value / MAX, duration: 0.08, ease: 'power2.out' }, 0.8 + i * 0.03);
        tl.fromTo(b.querySelector('[data-val]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.02 }, 0.84 + i * 0.03);
      });
      fadeOut(tl, compare.current, 0.97, 0.025);
    },
  });

  return (
    <section ref={ref} id="launch" data-chapter="launch" data-scrolly className="relative" style={{ height: '300vh' }}>
      <div className="stage">
        <div ref={hud} data-block className="group absolute left-0 right-0 top-[96px] z-10">
          <div className="gutter">
            <div className="scrim-tl inline-block pr-10">
              <p className="label mb-3">03 — 0–60 mph</p>
              <div className="flex items-end gap-3 text-white">
                <Odometer ref={timer} int={1} dec={2} className="text-hero font-medium tracking-tight text-white" label="0 to 60 timer" dimLeading={false} />
                <span className="mono mb-[0.6em] text-[clamp(1rem,2.4vw,2rem)] text-mist">s</span>
              </div>
              <span ref={lockLine} className="led-line mt-1 block w-full" style={{ transform: 'scaleX(0)' }} aria-hidden="true" />
              <div className="mt-5 flex items-baseline gap-3">
                <Odometer ref={speed} int={2} className="mono text-[clamp(2rem,5vw,3.5rem)] text-white" label="Speed in mph" />
                <span className="label">mph</span>
                <span className="label ml-4 hidden text-led group-[.is-locked]:inline">Locked</span>
              </div>
            </div>
          </div>
        </div>

        <div ref={caption} data-block className="absolute bottom-[96px] left-0 right-0 z-10" style={{ visibility: 'hidden' }}>
          <div className="gutter">
            <p className="scrim-bl max-w-[620px] text-[clamp(1.25rem,2.4vw,1.9rem)] font-medium leading-snug text-white">
              <span className="type">0–60 in 0.81 seconds. Measured, not promised.</span>
            </p>
          </div>
        </div>

        <div ref={compare} data-block className="absolute bottom-[96px] left-0 right-0 z-10" style={{ visibility: 'hidden' }}>
          <div className="gutter">
            <div className="scrim-bl max-w-[720px]">
              <Headline className="display text-[clamp(1.4rem,3vw,2.4rem)]">0–60 mph, compared</Headline>
              <ul className="mt-6 space-y-5">
                {LAUNCH_COMPARE.map((c, i) => (
                  <li key={c.name} ref={(r) => (bars.current[i] = r)}>
                    <div className="mb-2 flex items-baseline justify-between gap-4">
                      <span className={`text-[15px] ${c.highlight ? 'font-medium text-white' : 'text-mist'}`}>
                        {c.name} {c.year && <span className="mono ml-1 text-[12px] text-steel">{c.year}</span>}
                      </span>
                      <span data-val className={`mono text-[15px] ${c.highlight ? 'text-white' : 'text-mist'}`}>
                        {c.value} s
                      </span>
                    </div>
                    <div className="relative h-[2px] w-full bg-rig">
                      <span data-bar className="led-line absolute left-0 right-0 top-0 block" style={{ height: c.highlight ? 3 : 2, opacity: c.highlight ? 1 : 0.6 }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <SectionProgress ref={prog} label="0.81" />
      </div>
    </section>
  );
}
