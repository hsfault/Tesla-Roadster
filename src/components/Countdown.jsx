import { useEffect, useRef } from 'react';
import { gsap } from '../lib/gsap';

const DOTS = 12;

/** 3 · 2 · 1 on solid black while the 12 floodlight dots switch off one by one (3 s). */
export default function Countdown({ onDone, onTick }) {
  const root = useRef();
  const num = useRef();
  const dots = useRef([]);

  useEffect(() => {
    const tl = gsap.timeline({ onComplete: onDone });
    tl.fromTo(root.current, { opacity: 0 }, { opacity: 1, duration: 0.15 });
    [3, 2, 1].forEach((n, i) => {
      tl.call(() => {
        if (num.current) num.current.textContent = String(n);
        onTick?.();
      }, null, 0.15 + i);
      tl.fromTo(num.current, { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'power3.out' }, 0.15 + i);
      tl.to(num.current, { opacity: 0, duration: 0.2 }, 0.15 + i + 0.75);
    });
    dots.current.forEach((d, i) => {
      tl.to(d.lastChild, { opacity: 0, duration: 0.08 }, 0.15 + (i + 1) * 0.24);
      tl.set(d.firstChild, { backgroundColor: '#1C1E22' }, 0.15 + (i + 1) * 0.24);
    });
    return () => tl.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={root} className="fixed inset-0 z-[67] flex flex-col items-center justify-center bg-black" role="timer" aria-label="Film starts in 3 seconds">
      <span ref={num} className="display" style={{ fontSize: 'clamp(4rem, 14vw, 9rem)', lineHeight: 1 }}>
        3
      </span>
      <div className="mt-10 flex gap-[10px] sm:gap-[14px]" aria-hidden="true">
        {Array.from({ length: DOTS }).map((_, i) => (
          <span key={i} ref={(r) => (dots.current[i] = r)} className="relative block h-[7px] w-[7px]">
            <span className="absolute inset-0 rounded-full" style={{ background: '#F3F5F7' }} />
            <span className="absolute -inset-[9px] rounded-full opacity-50" style={{ background: 'radial-gradient(circle, rgba(255,255,255,.8) 0%, rgba(255,255,255,0) 68%)' }} />
          </span>
        ))}
      </div>
    </div>
  );
}
