import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { fadeIn, fadeOut, wipeIn } from '../lib/gsap';
import { useSection } from './useSection';
import { teaserShot } from '../three/shots';
import { PAINTS, paintById } from '../data/paints';
import { useConfig } from '../store/config';
import Headline from '../components/Headline';
import TLink from '../components/TLink';

/** 09 · Configure teaser — slow turntable under the floodlights, six paints, crossfade 0.6 s. */
export default function ConfigureTeaser() {
  const ref = useRef();
  const block = useRef();
  const paint = useConfig((s) => s.paint);
  const setPaint = useConfig((s) => s.setPaint);

  useSection(ref, {
    id: 'configure',
    order: 8,
    shot: teaserShot,
    build: (tl) => {
      tl.fromTo(block.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.001 }, 0.05);
      wipeIn(tl, block.current.querySelector('.wipe'), 0.05, 0.1);
      block.current.querySelectorAll('[data-in]').forEach((el, i) => fadeIn(tl, el, 0.12 + i * 0.05, 0.08));
      fadeOut(tl, block.current, 0.97, 0.02);
    },
  });

  return (
    <section ref={ref} id="configure" data-chapter="configure" data-scrolly className="relative" style={{ height: '220vh' }}>
      <div className="stage">
        <div ref={block} data-block className="absolute bottom-[96px] left-0 right-0 z-10">
          <div className="gutter">
            <div className="scrim-bl max-w-[640px]">
              <p className="label mb-3">09 — Configure</p>
              <Headline className="display text-section">Design yours.</Headline>
              <div data-in className="mt-7">
                <p className="mb-3 font-mono text-[13px] uppercase tracking-[0.12em] text-white">
                  Paint · <span className="text-mist">{paintById(paint).name}</span>
                </p>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Paint">
                  {PAINTS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={paint === p.id}
                      aria-label={p.name}
                      title={p.name}
                      onClick={() => setPaint(p.id)}
                      className="tap relative flex items-center justify-center"
                    >
                      <span className="block h-8 w-8 rounded-full border border-rig" style={{ background: p.swatch }} />
                      {paint === p.id && <span className="led-line absolute bottom-0 left-2 right-2 block" style={{ height: 2 }} aria-hidden="true" />}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-[15px] text-mist">The black lower body and the red light bar stay.</p>
              </div>
              <div data-in className="mt-7">
                <TLink to="/configure" className="btn-led">
                  Design yours <ArrowRight size={16} aria-hidden="true" />
                </TLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
