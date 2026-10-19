import { useRef } from 'react';
import { wipeIn, fadeIn, fadeOut } from '../lib/gsap';
import { useSection } from './useSection';
import { walkShot } from '../three/shots';
import Headline from '../components/Headline';
import SectionProgress from '../components/SectionProgress';

const BEATS = [
  { at: 0.03, out: 0.2, pos: 'bottom', title: 'Shaped by air.', body: 'Two seats and a body drawn around the wind, then pinned to the road by fans.' },
  { at: 0.39, out: 0.56, pos: 'top', title: 'Doors that open to the sky.', body: 'Butterfly doors lift up and out of the way. Step over the sill, drop in low.' },
  { at: 0.75, out: 0.96, pos: 'bottom', title: 'Glass that comes off.', body: 'The upper glass removes for a T-top. Aluminium and carbon-fibre underneath.' },
];

/** 02 · Walkaround — side → rear → overhead broadcast camera, one headline per shot, LED callouts. */
export default function Walkaround() {
  const ref = useRef();
  const beats = useRef([]);
  const prog = useRef();

  useSection(ref, {
    id: 'walkaround',
    order: 1,
    shot: walkShot,
    build: (tl) => {
      tl.fromTo(prog.current, { scaleY: 0 }, { scaleY: 1, duration: 1 }, 0);
      BEATS.forEach((b, i) => {
        const el = beats.current[i];
        const h = el.querySelector('.wipe');
        const p = el.querySelector('.beat-body');
        tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.001 }, b.at);
        wipeIn(tl, h, b.at, 0.06);
        fadeIn(tl, p, b.at + 0.04, 0.04);
        fadeOut(tl, el, b.out, 0.025);
      });
    },
  });

  return (
    <section ref={ref} id="walkaround" data-chapter="walkaround" data-scrolly className="relative" style={{ height: '350vh' }}>
      <div className="stage">
        {BEATS.map((b, i) => (
          <div
            key={b.title}
            ref={(r) => (beats.current[i] = r)}
            data-block
            className={`absolute left-0 right-0 z-10 ${b.pos === 'top' ? 'top-[96px]' : 'bottom-[96px]'}`}
          >
            <div className="gutter">
              <div className={`${b.pos === 'top' ? 'scrim-tl' : 'scrim-bl'} max-w-[760px]`}>
                <p className="label mb-4" aria-hidden="true">
                  02 — Walkaround · {String(i + 1).padStart(2, '0')}/03
                </p>
                <Headline className="display text-section">{b.title}</Headline>
                <p className="beat-body mt-5 max-w-[46ch] text-[17px] text-mist">{b.body}</p>
              </div>
            </div>
          </div>
        ))}
        <SectionProgress ref={prog} label="Walkaround" />
      </div>
    </section>
  );
}
