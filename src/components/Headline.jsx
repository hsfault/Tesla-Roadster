import { forwardRef } from 'react';

/** Headline with the LED wipe structure (.wipe > .wipe-text + .wipe-led). */
const Headline = forwardRef(function Headline({ as: Tag = 'h2', className = '', children, hidden = false, ...rest }, ref) {
  return (
    <Tag ref={ref} className={`wipe ${className}`} style={hidden ? { visibility: 'hidden' } : undefined} {...rest}>
      <span className="wipe-text">{children}</span>
      <span className="wipe-led" aria-hidden="true" />
    </Tag>
  );
});
export default Headline;
