import { useRef, useState } from 'react';
import { gsap, useGSAP, fadeOut, wipeIn } from '../lib/gsap';
import { useSection } from './useSection';
import { roadShot } from '../three/shots';
import { TIMELINE } from '../data/timeline';
import { useMedia } from '../hooks';
import { useUI } from '../store/ui';
import Headline from '../components/Headline';

/** Press photo if supplied (/public/press), otherwise the arena render. Fixed aspect box, lazy. */
function NodeImage({ node }) {
  const [src, setSrc] = useState(node.press);
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-asphalt">
      <img src={src} alt={node.alt} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" onError={() => src !== node.image && setSrc(node.image)} />
    </div>
  );
}

function Node({ node, i }) {
  return (
    <article className="plate flex w-full flex-col md:w-[min(380px,30vw)] md:shrink-0" data-node>
      <NodeImage node={node} />
      <div className="p-5 sm:p-6">
        <p className="mono text-[12px] text-led">{String(i + 1).padStart(2, '0')}</p>
        <h3 className="display mt-2 text-[clamp(1.8rem,3.2vw,2.8rem)]">{node.year}</h3>
        <p className="mt-2 text-[15px] font-medium text-white">{node.title}</p>
        {node.lines.map((l) => (
          <p key={l} className="text-[15px] leading-relaxed text-mist">
            {l}
          </p>
        ))}
      </div>
    </article>
  );
}

/** 08 · Road to 2028 — horizontal pinned timeline on desktop, vertical list on mobile. */
export default function RoadTo2028() {
  const ref = useRef();
  const head = useRef();
  const track = useRef();
  const line = useRef();
  const desktop = useMedia('(min-width: 768px)');
  const reduced = useUI((s) => s.reduced);
  const horizontal = desktop && !reduced;

  useSection(ref, {
    id: 'road',
    order: 7,
    shot: roadShot,
    build: (tl) => {
      wipeIn(tl, head.current.querySelector('.wipe'), 0.02, 0.06);
      if (!horizontal) return;
      const dist = () => Math.max(0, track.current.scrollWidth - window.innerWidth);
      tl.fromTo(track.current, { x: 0 }, { x: () => -dist(), duration: 0.84, ease: 'none', immediateRender: false }, 0.08);
      tl.fromTo(line.current, { scaleX: 0 }, { scaleX: 1, duration: 0.84 }, 0.08);
      fadeOut(tl, head.current, 0.95, 0.03);
      fadeOut(tl, track.current, 0.95, 0.03);
    },
  });

  // mobile: simple fade-ins, no pin
  useGSAP(
    () => {
      if (horizontal || reduced) return;
      ref.current.querySelectorAll('[data-node]').forEach((n) => {
        gsap.fromTo(n, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: n, start: 'top 85%' } });
      });
    },
    { scope: ref, dependencies: [horizontal, reduced], revertOnUpdate: true }
  );

  return (
    <section ref={ref} id="road" data-chapter="road" data-scrolly={horizontal ? '' : undefined} className="relative" style={{ height: horizontal ? '420vh' : 'auto' }}>
      <div className={horizontal ? 'stage' : 'relative py-28'}>
        <div ref={head} data-block className={horizontal ? 'absolute left-0 right-0 top-[96px] z-10' : 'relative z-10'}>
          <div className="gutter">
            <div className="scrim-tl inline-block pr-8">
              <p className="label mb-3">08 — Timeline</p>
              <Headline className="display text-section">Road to 2028</Headline>
            </div>
          </div>
        </div>

        <div className={horizontal ? 'absolute bottom-[96px] left-0 right-0 z-10' : 'relative z-10 mt-10'}>
          {horizontal && (
            <div className="gutter mb-8">
              <div className="relative h-[2px] bg-rig">
                <span ref={line} className="led-line absolute inset-0 block" style={{ transform: 'scaleX(0)' }} />
              </div>
            </div>
          )}
          <div ref={track} className={horizontal ? 'gutter flex w-max gap-8 pr-[30vw]' : 'gutter flex flex-col gap-8'}>
            {TIMELINE.map((n, i) => (
              <div key={n.year} className={horizontal ? '' : 'relative border-l border-rig pl-5'}>
                {!horizontal && <span className="led-line absolute -left-px top-0 block h-16 w-[2px]" style={{ height: 64, width: 2 }} aria-hidden="true" />}
                <Node node={n} i={i} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
