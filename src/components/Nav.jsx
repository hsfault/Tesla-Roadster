import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { gsap } from '../lib/gsap';
import { onScroll } from '../lib/lenis';
import { useUI } from '../store/ui';
import BrandImg from './BrandImg';
import ConceptChip from './ConceptChip';
import TLink from './TLink';

export const NAV_LINKS = [
  { label: 'Reveal', to: '/#lights-on', section: 'lights-on' },
  { label: 'Launch', to: '/#launch', section: 'launch' },
  { label: 'Wall', to: '/#wall', section: 'wall' },
  { label: 'Flight', to: '/#flight', section: 'flight' },
  { label: 'Specs', to: '/specs', route: '/specs' },
  { label: 'Configure', to: '/configure', route: '/configure' },
];

export default function Nav() {
  const bar = useRef();
  const { pathname } = useLocation();
  const active = useUI((s) => s.activeSection);
  const filmActive = useUI((s) => s.filmActive);
  const menuOpen = useUI((s) => s.menuOpen);

  // hide on scroll down, show on scroll up
  useEffect(() => {
    let last = 0;
    let hidden = false;
    return onScroll((l) => {
      const y = l.scroll;
      const down = y > last + 2 && y > 120;
      const up = y < last - 2 || y < 120;
      if (down && !hidden) {
        hidden = true;
        gsap.to(bar.current, { yPercent: -110, duration: 0.45, ease: 'power3.out' });
      } else if (up && hidden) {
        hidden = false;
        gsap.to(bar.current, { yPercent: 0, duration: 0.45, ease: 'power3.out' });
      }
      last = y;
    });
  }, []);

  useEffect(() => {
    gsap.to(bar.current, { autoAlpha: filmActive ? 0 : 1, duration: 0.3 });
  }, [filmActive]);

  const isActive = (l) => (l.route ? pathname === l.route : pathname === '/' && active === l.section);

  return (
    <header ref={bar} className="fixed inset-x-0 top-0 z-50" style={{ background: 'rgba(5,5,7,0.92)' }}>
      <nav className="gutter flex h-16 items-center justify-between gap-4" aria-label="Main">
        <TLink to="/" className="tap -ml-2 flex items-center px-2" aria-label="Roadster concept — home">
          <BrandImg kind="wordmark" alt="Tesla" style={{ height: 13, width: 'auto' }} />
        </TLink>
        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.label}>
              <TLink to={l.to} className="relative flex min-h-[44px] items-center px-3 text-[14px] font-medium text-mist transition-colors hover:text-white" aria-current={isActive(l) ? 'true' : undefined}>
                <span className="led-hover">{l.label}</span>
                {isActive(l) && <span className="absolute left-1/2 top-[6px] h-[5px] w-[5px] -translate-x-1/2 rounded-full bg-led" style={{ boxShadow: 'var(--led-glow)' }} aria-hidden="true" />}
              </TLink>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <ConceptChip className="hidden xl:inline-flex" />
          <TLink to="/configure" className="btn-led hidden sm:inline-flex">
            Reserve
          </TLink>
          <button
            type="button"
            className="tap -mr-2 flex items-center justify-center text-white lg:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => useUI.getState().setMenuOpen(true)}
          >
            <Menu size={24} strokeWidth={1.5} />
          </button>
        </div>
      </nav>
    </header>
  );
}
