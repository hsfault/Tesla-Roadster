import { useEffect, useRef } from 'react';
import { gsap } from '../lib/gsap';
import { out } from '../three/director';

// Full-coverage DOM smoke for the landing → Charge hand-off. Driven by the director (out.domSmoke).
// Plain images, transform/opacity only; screen blending on the smoke images only (never on text).
const LAYERS = [
  { src: '/fx/smoke-3.jpg', x: -30, y: 10, s: 1.5 },
  { src: '/fx/smoke-5.jpg', x: 25, y: 5, s: 1.7 },
  { src: '/fx/smoke-6.jpg', x: -5, y: 20, s: 2.0 },
  { src: '/fx/smoke-2.jpg', x: 10, y: -15, s: 1.6 },
];

export default function DomSmoke() {
  const root = useRef();
  const base = useRef();
  const imgs = useRef([]);
  useEffect(() => {
    let last = -1;
    const tick = () => {
      const v = Math.round(out.domSmoke * 1000) / 1000;
      if (v === last) return;
      last = v;
      const r = root.current;
      if (!r) return;
      r.style.visibility = v > 0.001 ? 'visible' : 'hidden';
      base.current.style.opacity = String(Math.min(1, v * 1.15));
      imgs.current.forEach((im, i) => {
        const d = LAYERS[i];
        const spread = 1 - v;
        im.style.opacity = String(Math.min(1, v * 1.6));
        im.style.transform = `translate3d(${d.x * (1 + spread * 2)}vw, ${d.y - spread * 25}vh, 0) scale(${d.s * (0.8 + v * 0.4)})`;
      });
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);
  return (
    <div ref={root} className="pointer-events-none fixed inset-0 z-[40] overflow-hidden" style={{ visibility: 'hidden' }} aria-hidden="true">
      <div ref={base} className="absolute inset-0" style={{ background: '#DADDE0', opacity: 0 }} />
      {LAYERS.map((l, i) => (
        <img
          key={i}
          ref={(r) => (imgs.current[i] = r)}
          src={l.src}
          alt=""
          loading="lazy"
          className="absolute left-[calc(50%-45vmax)] top-[calc(50%-45vmax)] w-[90vmax] max-w-none"
          style={{ mixBlendMode: 'screen', opacity: 0 }}
          draggable={false}
        />
      ))}
    </div>
  );
}
