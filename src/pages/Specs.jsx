import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap, playWipe } from '../lib/gsap';
import { PAGE_ENTER } from '../lib/transition';
import { useUI } from '../store/ui';
import { SPEC_GROUPS, STATUS } from '../data/specs';
import { VARIANTS } from '../data/variants';
import { stillSrc } from '../components/StillsStage';
import Headline from '../components/Headline';
import Footer from '../components/Footer';
import { useMedia } from '../hooks';

function RollCell({ value }) {
  const el = useRef();
  const [shown, setShown] = useState(value);
  const prev = useRef(value);
  useLayoutEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    const tl = gsap.timeline();
    tl.to(el.current, { yPercent: -70, opacity: 0, duration: 0.16, ease: 'power2.in' });
    tl.add(() => setShown(value));
    tl.fromTo(el.current, { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.32, ease: 'power3.out' });
    return () => tl.kill();
  }, [value]);
  return (
    <span className="block overflow-hidden">
      <span ref={el} className="block">
        {shown}
      </span>
    </span>
  );
}

export default function Specs() {
  const h = useRef();
  const tabs = useRef([]);
  const underline = useRef();
  const [vi, setVi] = useState(1);
  const renderMode = useUI((s) => s.renderMode);
  const desktop = useMedia('(min-width: 768px)');
  const v = VARIANTS[vi];

  useEffect(() => {
    useUI.getState().setSceneMode('specs');
    document.title = 'Specifications · Roadster concept';
    const play = () => playWipe(h.current);
    if (!useUI.getState().transitioning) play();
    window.addEventListener(PAGE_ENTER, play);
    return () => window.removeEventListener(PAGE_ENTER, play);
  }, []);

  useLayoutEffect(() => {
    const t = tabs.current[vi];
    if (t && underline.current) gsap.to(underline.current, { x: t.offsetLeft, width: t.offsetWidth, duration: 0.55, ease: 'expo.out' });
  }, [vi]);

  return (
    <>
      <div className="relative z-10 md:grid md:grid-cols-[42fr_58fr]">
        {/* desktop: the persistent canvas draws the car here (sticky by nature: the canvas is fixed) */}
        <div className="pointer-events-none hidden md:block" aria-hidden="true" />

        <div className="relative bg-night md:border-l md:border-rig">
          <div className="gutter pb-20 pt-24 md:px-10 xl:px-14">
            <p className="label mb-3">Roadster · 2nd generation</p>
            <Headline ref={h} as="h1" className="display text-section" style={{ visibility: 'hidden' }}>
              Specifications
            </Headline>
            <p className="mt-5 max-w-[52ch] text-[17px] text-mist">{STATUS.headline}</p>

            {(renderMode === 'stills' || !desktop) && (
              <div className="relative mt-8 aspect-[16/10] w-full overflow-hidden border border-rig bg-night">
                <img src={stillSrc('specs').replace('-m.webp', '.webp')} alt="Technical line drawing of the Roadster with length, wheelbase and height marked" className="absolute inset-0 h-full w-full object-contain" loading="lazy" />
              </div>
            )}

            <div className="relative mt-10" role="tablist" aria-label="Variant">
              <div className="flex gap-1">
                {VARIANTS.map((x, i) => (
                  <button
                    key={x.id}
                    ref={(r) => (tabs.current[i] = r)}
                    role="tab"
                    type="button"
                    aria-selected={vi === i}
                    onClick={() => setVi(i)}
                    className={`min-h-[44px] px-3 text-[15px] font-medium ${vi === i ? 'text-white' : 'text-mist hover:text-white'}`}
                  >
                    {x.name}
                  </button>
                ))}
              </div>
              <span className="absolute bottom-0 left-0 h-px w-full bg-rig" aria-hidden="true" />
              <span ref={underline} className="led-line absolute bottom-0 left-0 block" style={{ width: 0 }} aria-hidden="true" />
            </div>
            {v.tag && <p className="mono mt-4 text-[12px] uppercase tracking-[0.14em] text-white">{v.tag}</p>}

            <div className="mt-6" role="tabpanel" aria-label={`${v.name} specifications`}>
              {SPEC_GROUPS.map((g) => (
                <section key={g.title} className="mt-10 first:mt-4">
                  <h2 className="label mb-2 flex items-center gap-3">
                    <span className="block h-[2px] w-5 bg-led" style={{ boxShadow: 'var(--led-glow)' }} aria-hidden="true" />
                    {g.title}
                  </h2>
                  <dl>
                    {g.rows.map((r) => {
                      const val = typeof r.v === 'string' ? r.v : r.v[v.id];
                      return (
                        <div key={r.label} className="grid grid-cols-1 gap-1 border-b border-rig py-4 sm:grid-cols-[minmax(160px,0.8fr)_1.2fr] sm:gap-6">
                          <dt className="text-[15px] text-mist">{r.label}</dt>
                          <dd className="mono text-[15px] text-white">
                            <RollCell value={val} />
                            {r.note && <span className="mt-1 block text-[13px] text-mist">{r.note}</span>}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </section>
              ))}
            </div>
            <p className="mt-8 text-[14px] text-mist">Figures as shown at the reveal. Final production figures may differ.</p>

            <section id="concept" className="mt-20 border-t border-rig pt-10">
              <h2 className="label mb-4">About this concept</h2>
              <p className="max-w-[60ch] text-[17px] text-mist">
                Reveal Night is a portfolio design concept by Zeltrion Solutions: a cinematic retelling of the evening the new Roadster
                climbed a curved wall, flew on cold-gas thrusters and landed in a cloud of smoke. It is not a Tesla website and takes no
                reservations — every reserve link goes to tesla.com.
              </p>
            </section>
            <section id="credits" className="mt-12">
              <h2 className="label mb-4">Credits</h2>
              <ul className="space-y-2 text-[15px] text-mist">
                <li>
                  3D model: “Tesla Roadster 2.0” by Michael (sketchfab.com/gmmichaelonearth), licensed CC-BY-4.0 — repainted in-browser.
                </li>
                <li>Smoke, vapor, flare sprites and arena textures: generated procedurally for this concept.</li>
                <li>Type: Michroma, Geist and Geist Mono via Google Fonts.</li>
                <li>Design and development: Zeltrion Solutions.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
