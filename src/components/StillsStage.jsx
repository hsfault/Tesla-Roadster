import { useEffect, useRef, useState } from 'react';
import { gsap } from '../lib/gsap';
import { compute, currentIndex, getSections, out } from '../three/director';
import { STILL_FOR } from '../three/shots';
import { useUI } from '../store/ui';
import { useConfig } from '../store/config';

// Pre-rendered stills (mobile / low-power / reduced motion): same shots as the live scene, cross-faded.
const ALL = [
  'hero', 'walk-side', 'walk-rear', 'walk-top', 'launch', 'wall-wide', 'wall-top', 'wall-up',
  'flight-approach', 'flight-roll', 'charge', 'variants', 'road', 'teaser', 'specs',
  'configure-white', 'configure-black', 'configure-silver', 'configure-red', 'configure-blue', 'configure-quicksilver',
];

export function stillSrc(id) {
  const portrait = typeof window !== 'undefined' && window.innerWidth / window.innerHeight < 1;
  return `/shots/${id}${portrait ? '-m' : ''}.webp`;
}

export default function StillsStage() {
  const mode = useUI((s) => s.sceneMode);
  const paint = useConfig((s) => s.paint);
  const [active, setActive] = useState('hero');
  const [loaded, setLoaded] = useState(() => new Set(['hero']));
  const [failed, setFailed] = useState(() => new Set());
  const activeRef = useRef('hero');

  useEffect(() => {
    const tick = (time) => {
      const m = useUI.getState().sceneMode;
      compute(m, time);
      let id = 'hero';
      if (m === 'home') {
        const secs = getSections();
        const s = secs[currentIndex(0.5)];
        if (s && STILL_FOR[s.id]) id = STILL_FOR[s.id](s.p);
      } else if (m === 'configure') id = `configure-${useConfig.getState().paint}`;
      else id = '__none'; // specs shows its drawing inline; other pages have no backdrop
      if (id !== activeRef.current) {
        activeRef.current = id;
        setActive(id);
        setLoaded((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  useEffect(() => {
    // report first-still progress to the loader
    const img = new Image();
    img.onload = img.onerror = () => useUI.getState().set({ stillsProgress: 1 });
    img.src = stillSrc('hero');
  }, []);

  const shown = mode === 'configure' ? `configure-${paint}` : active;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 bg-night" aria-hidden="true">
      {ALL.filter((id) => loaded.has(id) || id === shown).map((id) => (
        <div key={id} className="absolute inset-0 transition-opacity duration-700 ease-out" style={{ opacity: id === shown ? 1 : 0 }}>
          {failed.has(id) ? (
            <div className="flex h-full w-full items-end justify-end p-6">
              <span className="label">Still “{id}” not captured</span>
            </div>
          ) : (
            <img
              src={stillSrc(id)}
              alt=""
              className="h-full w-full object-cover"
              decoding="async"
              onError={() => setFailed((prev) => new Set(prev).add(id))}
            />
          )}
        </div>
      ))}
      <StillsGlow />
    </div>
  );
}

/** Light-weight DOM echo of the floodlight "switch on" over stills (opacity only). */
function StillsGlow() {
  const el = useRef();
  useEffect(() => {
    const tick = () => {
      if (el.current) el.current.style.opacity = String(1 - Math.min(1, (out.f0 + out.f1 + out.f2) / 3));
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);
  return <div ref={el} className="absolute inset-0 bg-night" style={{ opacity: 0 }} />;
}
