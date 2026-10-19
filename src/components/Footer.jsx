import { useEffect, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { gsap, ScrollTrigger } from '../lib/gsap';
import { scrollToY } from '../lib/lenis';
import { useUI } from '../store/ui';
import { STATUS } from '../data/specs';
import TLink from './TLink';

const COLS = [
  {
    title: 'Explore',
    links: [
      { label: 'The reveal', to: '/#lights-on' },
      { label: '0.81', to: '/#launch' },
      { label: 'The wall', to: '/#wall' },
      { label: 'Flight', to: '/#flight' },
      { label: 'Configure', to: '/configure' },
    ],
  },
  {
    title: 'Specs',
    links: [
      { label: 'All specifications', to: '/specs' },
      { label: 'Variants', to: '/#variants' },
      { label: 'Charging', to: '/#charge' },
      { label: 'Road to 2028', to: '/#road' },
    ],
  },
  {
    title: 'Concept',
    links: [
      { label: 'About this concept', to: '/specs#concept' },
      { label: 'Credits', to: '/specs#credits' },
    ],
  },
  {
    title: 'Studio',
    links: [
      { label: 'Zeltrion Solutions', href: 'https://zeltrionsolutions.com' },
      { label: 'Contact', href: 'https://zeltrionsolutions.com/contact' },
      { label: 'Instagram', href: 'https://www.instagram.com/zeltrionsolutions' },
    ],
  },
];

export default function Footer() {
  const root = useRef();
  const line = useRef();

  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => useUI.getState().set({ footerVisible: self.isActive }),
    });
    const draw = gsap.fromTo(
      line.current,
      { scaleX: 0 },
      { scaleX: 1, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'top 55%', scrub: 1 } }
    );
    return () => {
      st.kill();
      draw.scrollTrigger?.kill();
      draw.kill();
      useUI.getState().set({ footerVisible: false });
    };
  }, []);

  return (
    <footer ref={root} className="relative z-30 bg-night pt-16 sm:pt-24">
      <span ref={line} className="led-line absolute left-0 right-0 top-0 block" aria-hidden="true" />
      <div className="gutter">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <p className="max-w-[18ch] font-medium text-white" style={{ fontSize: 'clamp(1.6rem, 3.6vw, 3rem)', lineHeight: 1.12 }}>
            It climbed a wall. Then it flew.
          </p>
          <a href={STATUS.reserveUrl} target="_blank" rel="noreferrer" className="btn-led self-start md:self-auto">
            Reserve on tesla.com <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-x-6 gap-y-10 border-t border-rig pt-10 md:grid-cols-[1.2fr_1fr_1fr_1.2fr]">
          {COLS.map((c) => (
            <div key={c.title}>
              <h3 className="label mb-3">{c.title}</h3>
              <ul>
                {c.links.map((l) => (
                  <li key={l.label}>
                    {l.href ? (
                      <a href={l.href} target="_blank" rel="noreferrer" className="flex min-h-[44px] items-center text-[15px] text-mist hover:text-white">
                        <span className="led-hover">{l.label}</span>
                      </a>
                    ) : (
                      <TLink to={l.to} className="flex min-h-[44px] items-center text-[15px] text-mist hover:text-white">
                        <span className="led-hover">{l.label}</span>
                      </TLink>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-12 max-w-[72ch] text-[13px] leading-relaxed text-mist">
          Design concept by Zeltrion Solutions. Not affiliated with or endorsed by Tesla, Inc. Tesla, Roadster and the T logo are trademarks of Tesla, Inc.
        </p>

        <div className="mt-10 flex flex-col gap-2 border-t border-rig py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="mono text-[12px] text-mist">© 2026 Zeltrion Solutions · Design concept</p>
          <button type="button" onClick={() => scrollToY(0, { duration: 2 })} className="flex min-h-[44px] items-center self-start font-mono text-[12px] uppercase tracking-[0.14em] text-mist hover:text-white sm:self-auto">
            <span className="led-hover">Back to top ↑</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
