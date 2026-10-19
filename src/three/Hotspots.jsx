import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { out } from './director';

// LED callouts anchored to points on the car (car-local metres; the car faces +Z).
const SPOTS = [
  { key: 'hot0', label: 'Removable glass roof', pos: [0, 1.17, -0.15], dir: 'right' },
  { key: 'hot1', label: 'Carbon-ceramic brakes', pos: [0.96, 0.4, 1.39], dir: 'right' },
  { key: 'hot2', label: 'Suction fans', pos: [0.2, 0.28, -2.15], dir: 'right' },
  { key: 'hot3', label: 'Charge port behind the rear wing', pos: [0.55, 0.95, -1.95], dir: 'left' },
];

function Spot({ s }) {
  const el = useRef();
  useFrame(() => {
    const v = out[s.key];
    const node = el.current;
    if (!node) return;
    if (v < 0.002) {
      if (node.style.visibility !== 'hidden') node.style.visibility = 'hidden';
      return;
    }
    node.style.visibility = 'visible';
    node.style.opacity = String(Math.min(1, v * 1.2));
    node.style.setProperty('--draw', String(Math.min(1, v * 1.6)));
  });
  const left = s.dir === 'left';
  return (
    <Html position={s.pos} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
      <div ref={el} className="relative" style={{ visibility: 'hidden', opacity: 0 }}>
        <span className="absolute -left-[5px] -top-[5px] h-[10px] w-[10px] rounded-full border border-led bg-night" style={{ boxShadow: 'var(--led-glow)' }} />
        <span
          className="led-line absolute top-0"
          style={{
            width: 'clamp(48px, 7vw, 110px)',
            height: '1px',
            [left ? 'right' : 'left']: '5px',
            transformOrigin: left ? 'right center' : 'left center',
            transform: 'scaleX(var(--draw, 0))',
          }}
        />
        <span
          className="plate absolute -top-[16px] whitespace-nowrap px-3 py-[7px] font-mono text-[12px] uppercase tracking-[0.14em] text-white"
          style={{ [left ? 'right' : 'left']: 'calc(clamp(48px, 7vw, 110px) + 10px)' }}
        >
          {s.label}
        </span>
      </div>
    </Html>
  );
}

export default function Hotspots() {
  return (
    <group>
      {SPOTS.map((s) => (
        <Spot key={s.key} s={s} />
      ))}
    </group>
  );
}
