import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Camera, Link2 } from 'lucide-react';
import { playWipe } from '../lib/gsap';
import { PAGE_ENTER } from '../lib/transition';
import { useUI } from '../store/ui';
import { useConfig, buildUrl, readBuildFromUrl } from '../store/config';
import { VARIANTS, WHEELS, CALIPERS, variantById } from '../data/variants';
import { PAINTS, paintById } from '../data/paints';
import { STATUS } from '../data/specs';
import { fx } from '../three/director';
import { stillSrc } from '../components/StillsStage';
import Headline from '../components/Headline';
import Odometer from '../components/Odometer';

function Step({ n, title, active, onFocus, children, note }) {
  return (
    <section className="relative border-t border-rig py-6 pl-12" onPointerDown={onFocus} onFocusCapture={onFocus} aria-labelledby={`step-${n}`}>
      <span
        className={`mono absolute left-0 top-6 flex h-8 w-8 items-center justify-center rounded-full border text-[12px] ${active ? 'border-led text-white' : 'border-rig text-mist'}`}
        style={active ? { boxShadow: 'var(--led-glow)' } : undefined}
        aria-hidden="true"
      >
        {n}
      </span>
      {active && <span className="led-line-v absolute bottom-0 left-[15px] top-[56px] block" style={{ width: 1 }} aria-hidden="true" />}
      <h2 id={`step-${n}`} className={`mb-4 font-mono text-[13px] uppercase tracking-[0.14em] ${active ? 'text-white' : 'text-mist'}`}>
        {title}
      </h2>
      {children}
      {note && <p className="mt-3 text-[14px] text-mist">{note}</p>}
    </section>
  );
}

function Option({ selected, disabled, onClick, children, sub }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onClick={onClick}
      className={`relative flex min-h-[48px] w-full items-center justify-between gap-3 border px-4 text-left transition-colors ${
        selected ? 'border-led text-white' : disabled ? 'border-rig text-mist' : 'border-rig text-mist hover:border-steel hover:text-white'
      }`}
    >
      <span className="text-[15px] font-medium">{children}</span>
      {sub && <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-mist">{sub}</span>}
    </button>
  );
}

export default function Configure() {
  const h = useRef();
  const hp = useRef();
  const status = useRef();
  const renderMode = useUI((s) => s.renderMode);
  const cfg = useConfig();
  const [step, setStep] = useState(1);
  const variant = variantById(cfg.variant);
  const live = renderMode === 'live';

  useEffect(() => {
    useUI.getState().setSceneMode('configure');
    document.title = 'Configure · Roadster concept';
    const saved = readBuildFromUrl();
    if (saved) useConfig.getState().restore(saved);
    const play = () => playWipe(h.current);
    if (!useUI.getState().transitioning) play();
    window.addEventListener(PAGE_ENTER, play);
    return () => window.removeEventListener(PAGE_ENTER, play);
  }, []);

  useEffect(() => {
    hp.current?.to(variant.hp, 0.9);
  }, [variant.hp]);

  const say = (msg) => {
    if (!status.current) return;
    status.current.textContent = msg;
    clearTimeout(say.t);
    say.t = setTimeout(() => status.current && (status.current.textContent = ''), 2600);
  };

  const copyBuild = async () => {
    const url = buildUrl(useConfig.getState());
    window.history.replaceState(null, '', url.replace(window.location.origin, ''));
    try {
      await navigator.clipboard.writeText(url);
      say('Link to your build copied.');
    } catch {
      say('Your build is in the address bar.');
    }
  };

  const download = (blob, name) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  const snapshot = async () => {
    const name = `roadster-${cfg.variant}-${cfg.paint}.png`;
    if (live) {
      fx.snapshot = Object.assign((blob) => blob && (download(blob, name), say('Snapshot saved.')), { type: 'image/png' });
    } else {
      try {
        const res = await fetch(stillSrc(`configure-${cfg.paint}`));
        download(await res.blob(), name.replace('.png', '.webp'));
        say('Snapshot saved.');
      } catch {
        say('Snapshot unavailable.');
      }
    }
  };

  const view = (p) => import('../three/Scene').then((m) => m.flyTo(p));

  return (
    <div className="relative z-10 md:grid md:min-h-[100svh] md:grid-cols-[65fr_35fr]">
      {/* the car lives in the persistent canvas behind this transparent column */}
      <div className="pointer-events-none relative h-[55svh] md:sticky md:top-0 md:h-[100svh]">
        {live && (
          <div className="pointer-events-auto absolute bottom-6 left-[var(--gutter)] hidden items-center gap-1 md:flex" role="group" aria-label="Camera presets">
            {['front', 'side', 'rear', 'top'].map((p) => (
              <button key={p} type="button" onClick={() => view(p)} className="plate min-h-[44px] px-4 font-mono text-[12px] uppercase tracking-[0.14em] text-mist hover:text-white">
                {p}
              </button>
            ))}
            <span className="label ml-3 hidden lg:inline">Drag to orbit · scroll to zoom</span>
          </div>
        )}
      </div>

      <aside className="relative bg-asphalt md:border-l md:border-rig">
        <div className="gutter pb-16 pt-8 md:px-8 md:pt-24 xl:px-12">
          <p className="label mb-3">Configurator</p>
          <Headline ref={h} as="h1" className="display text-[clamp(1.8rem,3vw,2.8rem)]" style={{ visibility: 'hidden' }}>
            Your Roadster
          </Headline>

          <div className="mt-8" role="presentation">
            <Step n={1} title="Variant" active={step === 1} onFocus={() => setStep(1)}>
              <div className="grid gap-2" role="radiogroup" aria-label="Variant">
                {VARIANTS.map((v) => (
                  <Option key={v.id} selected={cfg.variant === v.id} disabled={!v.selectable} onClick={() => cfg.setVariant(v.id)} sub={v.selectable ? `${v.hp.toLocaleString('en-US')}+ hp` : 'Invite only'}>
                    {v.name}
                  </Option>
                ))}
              </div>
            </Step>

            <Step n={2} title="Paint" active={step === 2} onFocus={() => setStep(2)}>
              <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Paint">
                {PAINTS.map((p) => (
                  <button key={p.id} type="button" role="radio" aria-checked={cfg.paint === p.id} aria-label={p.name} title={p.name} onClick={() => cfg.setPaint(p.id)} className="tap relative flex items-center justify-center">
                    <span className="block h-8 w-8 rounded-full border border-rig" style={{ background: p.swatch }} />
                    {cfg.paint === p.id && <span className="led-line absolute bottom-0 left-2 right-2 block" style={{ height: 2 }} aria-hidden="true" />}
                  </button>
                ))}
              </div>
              <p className="mt-2 font-mono text-[13px] uppercase tracking-[0.12em] text-white">{paintById(cfg.paint).name}</p>
            </Step>

            <Step n={3} title="Wheels" active={step === 3} onFocus={() => setStep(3)} note={live ? undefined : 'Wheel and caliper choices show in the live 3D view on larger screens.'}>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Wheels">
                {WHEELS.map((w) => (
                  <Option key={w.id} selected={cfg.wheels === w.id} onClick={() => cfg.setWheels(w.id)}>
                    {w.name}
                  </Option>
                ))}
              </div>
            </Step>

            <Step n={4} title="Brake calipers" active={step === 4} onFocus={() => setStep(4)}>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Brake calipers">
                {CALIPERS.map((c) => (
                  <Option key={c.id} selected={cfg.calipers === c.id} onClick={() => cfg.setCalipers(c.id)}>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full border border-rig" style={{ background: c.hex }} aria-hidden="true" />
                      {c.name}
                    </span>
                  </Option>
                ))}
              </div>
            </Step>
          </div>

          {/* live summary */}
          <section className="mt-4 border-t border-rig pt-6" aria-label="Summary">
            <h2 className="label mb-4">Summary</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 text-[15px]">
              {[
                ['Variant', variant.name],
                ['Power', null],
                ['0–60 mph', variant.zeroSixty],
                ['Range', `${variant.rangeMi} mi`],
                ['Paint', paintById(cfg.paint).name],
                ['Deposit', '$50,000 refundable'],
                ['Production', 'Planned 2028 · Texas'],
              ].map(([k, val]) => (
                <div key={k} className="contents">
                  <dt className="border-b border-rig py-3 font-mono text-[12px] uppercase tracking-[0.14em] text-mist">{k}</dt>
                  <dd className="mono border-b border-rig py-3 text-right text-white">
                    {val ?? (
                      <span className="inline-flex items-baseline gap-1">
                        <Odometer ref={hp} value={variant.hp} int={4} commas label="Horsepower" />
                        <span className="text-mist">hp+</span>
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            <a href={STATUS.reserveUrl} target="_blank" rel="noreferrer" className="btn-led mt-7 w-full">
              Reserve on tesla.com <ArrowUpRight size={16} aria-hidden="true" />
            </a>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={copyBuild} className="btn-outline">
                <Link2 size={16} aria-hidden="true" /> Copy my build
              </button>
              <button type="button" onClick={snapshot} className="btn-outline">
                <Camera size={16} aria-hidden="true" /> Snapshot
              </button>
            </div>
            <p ref={status} className="mono mt-3 min-h-[20px] text-[13px] text-white" aria-live="polite" />
            <p className="mt-4 text-[13px] text-mist">
              Design concept. No payment or personal data is collected here — reservations happen on tesla.com.
            </p>
          </section>
        </div>
      </aside>
    </div>
  );
}
