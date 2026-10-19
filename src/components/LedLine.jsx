import { forwardRef } from 'react';

/** A thin glowing red LED line. Animate it with scaleX (or scaleY when vertical). */
const LedLine = forwardRef(function LedLine({ vertical = false, className = '', style }, ref) {
  return <span ref={ref} aria-hidden="true" className={`block ${vertical ? 'led-line-v' : 'led-line'} ${className}`} style={style} />;
});
export default LedLine;
