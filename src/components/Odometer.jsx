import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react';
import { gsap } from '../lib/gsap';
import { rollPositions } from '../lib/odometer';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

/**
 * Rolling odometer. Imperative API (no React re-render per frame):
 *   ref.current.set(v)          — jump (continuous values roll the last digit smoothly)
 *   ref.current.to(v, seconds)  — animate to v (digits roll through)
 */
const Odometer = forwardRef(function Odometer({ value = 0, int = 1, dec = 0, commas = false, dimLeading = true, className = '', label }, ref) {
  const strips = useRef([]);
  const cols = useRef([]);
  const state = useRef({ v: value, dims: '' });

  const layout = useMemo(() => {
    const items = [];
    for (let i = 0; i < int; i++) {
      const fromRight = int - i;
      if (commas && i > 0 && fromRight % 3 === 0) items.push({ sep: ',' });
      items.push({ col: i });
    }
    if (dec > 0) {
      items.push({ sep: '.' });
      for (let i = 0; i < dec; i++) items.push({ col: int + i });
    }
    return items;
  }, [int, dec, commas]);

  const apply = (v) => {
    state.current.v = v;
    const pos = rollPositions(v, int, dec);
    let leading = dimLeading;
    let dims = '';
    for (let i = 0; i < pos.length; i++) {
      const el = strips.current[i];
      if (el) el.style.transform = `translate3d(0, ${(-pos[i] * 100) / 11}%, 0)`;
      if (i < int - 1 && leading && Math.floor(pos[i]) % 10 === 0 && pos[i] < 0.5) dims += '1';
      else {
        leading = false;
        dims += '0';
      }
    }
    if (dims !== state.current.dims) {
      state.current.dims = dims;
      for (let i = 0; i < int; i++) cols.current[i]?.classList.toggle('text-steel', dims[i] === '1');
    }
  };

  useImperativeHandle(ref, () => ({
    set: apply,
    to: (v, duration = 0.9) =>
      gsap.to(state.current, { v, duration, ease: 'power3.out', overwrite: true, onUpdate: () => apply(state.current.v) }),
    get: () => state.current.v,
  }));

  useLayoutEffect(() => {
    apply(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <span className={`odo mono ${className}`} role="text" aria-label={label}>
      {layout.map((it, k) =>
        it.sep ? (
          <span key={k} className="odo-ch" aria-hidden="true">
            {it.sep}
          </span>
        ) : (
          <span key={k} className="odo-col" aria-hidden="true" ref={(r) => (cols.current[it.col] = r)}>
            <span className="odo-strip" ref={(r) => (strips.current[it.col] = r)}>
              {DIGITS.map((d, j) => (
                <span key={j}>{d}</span>
              ))}
            </span>
          </span>
        )
      )}
    </span>
  );
});

export default Odometer;
