import { forwardRef } from 'react';

/** Vertical LED progress strip on the right edge of a pinned section. Animate the inner line's scaleY. */
const SectionProgress = forwardRef(function SectionProgress({ label }, ref) {
  return (
    <div className="rm-hide pointer-events-none absolute right-[calc(var(--gutter)*0.5)] top-1/2 hidden h-[28vh] -translate-y-1/2 items-start gap-3 md:flex" aria-hidden="true">
      <span className="label [writing-mode:vertical-rl]">{label}</span>
      <span className="relative block h-full w-[2px] bg-rig">
        <span ref={ref} className="led-line-v absolute inset-0 block" style={{ transform: 'scaleY(0)' }} />
      </span>
    </div>
  );
});
export default SectionProgress;
