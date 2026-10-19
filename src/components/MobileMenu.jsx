import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { gsap } from '../lib/gsap';
import { getLenis } from '../lib/lenis';
import { useUI } from '../store/ui';
import { NAV_LINKS } from './Nav';
import TLink from './TLink';
import ConceptChip from './ConceptChip';

export default function MobileMenu() {
  const open = useUI((s) => s.menuOpen);
  const root = useRef();
  const close = useRef();

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const lenis = getLenis();
    if (open) {
      lenis?.stop();
      const items = el.querySelectorAll('[data-item]');
      const lines = el.querySelectorAll('[data-line]');
      const tl = gsap.timeline();
      tl.set(el, { display: 'flex' });
      tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'none' });
      tl.fromTo(items, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out' }, 0.1);
      tl.fromTo(lines, { scaleX: 0 }, { scaleX: 1, duration: 0.7, stagger: 0.06, ease: 'expo.out' }, 0.2);
      close.current?.focus();
      const onKey = (e) => e.key === 'Escape' && useUI.getState().setMenuOpen(false);
      window.addEventListener('keydown', onKey);
      return () => {
        window.removeEventListener('keydown', onKey);
        tl.kill();
      };
    }
    lenis?.start();
    gsap.to(el, { opacity: 0, duration: 0.2, onComplete: () => gsap.set(el, { display: 'none' }) });
  }, [open]);

  const shut = () => useUI.getState().setMenuOpen(false);

  return (
    <div ref={root} className="fixed inset-0 z-[70] hidden flex-col bg-night" role="dialog" aria-modal="true" aria-label="Menu" style={{ display: 'none' }}>
      <div className="gutter flex h-16 items-center justify-between">
        <span className="label">Menu</span>
        <button ref={close} type="button" className="tap -mr-2 flex items-center justify-center text-white" aria-label="Close menu" onClick={shut}>
          <X size={26} strokeWidth={1.5} />
        </button>
      </div>
      <nav className="gutter flex flex-1 flex-col justify-center gap-[3.5vh]" aria-label="Mobile">
        {NAV_LINKS.map((l, i) => (
          <div key={l.label} data-item>
            <TLink to={l.to} onClick={shut} className="flex min-h-[44px] items-baseline gap-4">
              <span className="mono text-[12px] text-steel">{String(i + 1).padStart(2, '0')}</span>
              <span className="display" style={{ fontSize: 'min(9vw, 64px)', lineHeight: 1.1 }}>
                {l.label}
              </span>
            </TLink>
            <span data-line className="led-line mt-2 block" style={{ height: 1 }} />
          </div>
        ))}
      </nav>
      <div className="gutter flex flex-wrap items-center gap-3 pb-8" data-item>
        <TLink to="/configure" onClick={shut} className="btn-led">
          Reserve
        </TLink>
        <ConceptChip />
      </div>
    </div>
  );
}
