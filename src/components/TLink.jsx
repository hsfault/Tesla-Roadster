import { go } from '../lib/transition';

/** Internal link that routes through the smoke transition (falls back to a normal href). */
export default function TLink({ to, children, className = '', onClick, ...rest }) {
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        onClick?.(e);
        go(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
