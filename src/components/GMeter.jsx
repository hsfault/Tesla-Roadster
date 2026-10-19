import { forwardRef, useImperativeHandle, useRef } from 'react';

const R = 52;
const SWEEP = 270;
const C = 2 * Math.PI * R;
const ARC = (C * SWEEP) / 360;

/** Circular G gauge with a red LED arc. ref.current.set(g) with g in 0–2.5. */
const GMeter = forwardRef(function GMeter({ max = 2.5, className = '' }, ref) {
  const arc = useRef();
  const num = useRef();
  useImperativeHandle(ref, () => ({
    set(g) {
      const t = Math.max(0, Math.min(1, g / max));
      if (arc.current) arc.current.style.strokeDashoffset = String(ARC * (1 - t));
      if (num.current) num.current.textContent = g.toFixed(1);
    },
  }));
  const ticks = [0, 0.5, 1, 1.5, 2, 2.5];
  return (
    <div className={`relative ${className}`} role="img" aria-label="G-meter: up to 2 G">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-[225deg]" aria-hidden="true">
        <circle cx="70" cy="70" r={R} fill="none" stroke="#1C1E22" strokeWidth="6" strokeDasharray={`${ARC} ${C}`} />
        <circle
          ref={arc}
          cx="70"
          cy="70"
          r={R}
          fill="none"
          stroke="#FF2A2A"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${ARC} ${C}`}
          strokeDashoffset={ARC}
          style={{ filter: 'drop-shadow(0 0 4px rgba(255,42,42,.8))' }}
        />
        {ticks.map((t) => {
          const a = ((t / max) * SWEEP * Math.PI) / 180;
          return <line key={t} x1={70 + Math.cos(a) * 60} y1={70 + Math.sin(a) * 60} x2={70 + Math.cos(a) * 65} y2={70 + Math.sin(a) * 65} stroke="#8A929C" strokeWidth="1.5" />;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span ref={num} className="mono text-[28px] leading-none text-white">0.0</span>
        <span className="label mt-1">G</span>
      </div>
    </div>
  );
});

export default GMeter;
