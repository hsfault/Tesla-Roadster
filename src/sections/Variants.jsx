import { useLayoutEffect, useRef, useState } from 'react';
import { gsap, fadeIn, fadeOut, wipeIn } from '../lib/gsap';
import { useSection } from './useSection';
import { variantsShot } from '../three/shots';
import { fx } from '../three/director';
import { VARIANTS } from '../data/variants';
import Odometer from '../components/Odometer';
import Headline from '../components/Headline';

/** Swap a text value with a short vertical roll (transform/opacity only). */
function RollText({ value, className = '' }) {
  const el = useRef();
  const prev = useRef(value);
  const [shown, setShown] = useState(value);
  useLayoutEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    const node = el.current;
    const tl = gsap.timeline();
    tl.to(node, { yPercent: -60, opacity: 0, duration: 0.18, ease: 'power2.in' });
    tl.add(() => setShown(value));
    tl.fromTo(node, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.32, ease: 'power3.out' });
    return () => tl.kill();
  }, [value]);
  return (
    <span className="inline-block overflow-hidden align-bottom">
      <span ref={el} className={`inline-block ${className}`}>
        {shown}
      </span>
    </span>
  );
}

function playMove(move) {
  if (move === 'pivot') {
    gsap.timeline().to(fx, { vmPivot: 0.55, duration: 0.45, ease: 'power2.inOut' }).to(fx, { vmPivot: 0, duration: 0.7, ease: 'power3.inOut' });
  } else if (move === 'puff') {
    fx.puffs.push('rear');
    gsap.fromTo(fx, { vmRear: 1 }, { vmRear: 0, duration: 0.9, ease: 'power2.out' });
  } else if (move === 'hop') {
    fx.puffs.push('all');
    gsap.fromTo(fx, { vmAll: 1 }, { vmAll: 0, duration: 1.0, ease: 'power2.out' });
    gsap.timeline().to(fx, { vmHop: 0.2, duration: 0.32, ease: 'power2.out' }).to(fx, { vmHop: 0, duration: 0.45, ease: 'bounce.out' });
  }
}

/** 07 · Variants — overhead spotlight, LED broadcast frame, tabs with a sliding LED underline. */
export default function Variants() {
  const ref = useRef();
  const block = useRef();
  const tabs = useRef([]);
  const underline = useRef();
  const hp = useRef();
  const [idx, setIdx] = useState(0);
  const v = VARIANTS[idx];

  useSection(ref, {
    id: 'variants',
    order: 6,
    shot: variantsShot,
    build: (tl) => {
      tl.fromTo(block.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.001 }, 0.06);
      wipeIn(tl, block.current.querySelector('.wipe'), 0.06, 0.08);
      block.current.querySelectorAll('[data-in]').forEach((el, i) => fadeIn(tl, el, 0.1 + i * 0.03, 0.06));
      fadeOut(tl, block.current, 0.94, 0.04);
    },
  });

  useLayoutEffect(() => {
    const t = tabs.current[idx];
    if (!t || !underline.current) return;
    gsap.to(underline.current, { x: t.offsetLeft, width: t.offsetWidth, duration: 0.55, ease: 'expo.out' });
  }, [idx]);

  const select = (i) => {
    if (i === idx) return;
    setIdx(i);
    hp.current?.to(VARIANTS[i].hp, 0.9);
    playMove(VARIANTS[i].move);
  };

  const onKey = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const n = (idx + (e.key === 'ArrowRight' ? 1 : VARIANTS.length - 1)) % VARIANTS.length;
      select(n);
      tabs.current[n]?.focus();
    }
  };

  return (
    <section ref={ref} id="variants" data-chapter="variants" data-scrolly className="relative" style={{ height: '250vh' }}>
      <div className="stage">
        <div ref={block} data-block className="absolute bottom-[96px] left-0 right-0 z-10 md:bottom-auto md:top-1/2 md:-translate-y-1/2">
          <div className="gutter">
            <div className="scrim-l max-w-[560px]">
              <p className="label mb-3">07 — Variants</p>
              <Headline className="display text-section">Three ways in</Headline>

              <div data-in className="relative mt-7" role="tablist" aria-label="Variant" onKeyDown={onKey}>
                <div className="flex gap-1">
                  {VARIANTS.map((x, i) => (
                    <button
                      key={x.id}
                      ref={(r) => (tabs.current[i] = r)}
                      role="tab"
                      type="button"
                      aria-selected={i === idx}
                      tabIndex={i === idx ? 0 : -1}
                      onClick={() => select(i)}
                      className={`min-h-[44px] px-3 text-[15px] font-medium transition-colors ${i === idx ? 'text-white' : 'text-mist hover:text-white'}`}
                    >
                      {x.name}
                    </button>
                  ))}
                </div>
                <span className="absolute bottom-0 left-0 h-px w-full bg-rig" aria-hidden="true" />
                <span ref={underline} className="led-line absolute bottom-0 left-0 block" style={{ width: 0 }} aria-hidden="true" />
              </div>

              <div data-in className="mt-6" role="tabpanel" aria-label={`${v.name} specifications`}>
                <p className="min-h-[3.2em] text-[17px] text-mist">
                  <RollText value={v.blurb} />
                </p>
                <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-8 border-t border-rig">
                  <dt className="label border-b border-rig py-3">Power</dt>
                  <dd className="flex items-baseline gap-2 border-b border-rig py-3 text-white">
                    <Odometer ref={hp} value={VARIANTS[0].hp} int={4} commas className="text-[20px]" label="Horsepower" />
                    <span className="mono text-[14px] text-mist">hp+</span>
                  </dd>
                  <dt className="label border-b border-rig py-3">0–60 mph</dt>
                  <dd className="mono border-b border-rig py-3 text-[17px] text-white"><RollText value={v.zeroSixty} /></dd>
                  <dt className="label border-b border-rig py-3">Suction fans</dt>
                  <dd className="mono border-b border-rig py-3 text-[17px] text-white"><RollText value={v.fans} /></dd>
                  <dt className="label border-b border-rig py-3">Thrusters</dt>
                  <dd className="mono border-b border-rig py-3 text-[17px] text-white"><RollText value={v.thrusters} /></dd>
                  <dt className="label border-b border-rig py-3">Availability</dt>
                  <dd className="mono border-b border-rig py-3 text-[17px] text-white"><RollText value={v.availability} /></dd>
                </dl>
                <p className="mt-4 h-[32px]">
                  {v.tag && (
                    <span className="inline-flex items-center gap-2 border border-led px-3 py-[6px] font-mono text-[12px] uppercase tracking-[0.14em] text-white">
                      <span className="h-[6px] w-[6px] rounded-full bg-led" aria-hidden="true" />
                      {v.tag}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
