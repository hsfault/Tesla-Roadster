import { useEffect, useRef } from 'react';
import { Play } from 'lucide-react';
import { gsap, fadeOut } from '../lib/gsap';
import { texasTime } from '../lib/time';
import { useSection } from './useSection';
import { heroShot, INTRO_SECONDS } from '../three/shots';
import { fx } from '../three/director';
import { useUI } from '../store/ui';
import { HERO_STATS } from '../data/specs';
import Headline from '../components/Headline';
import TLink from '../components/TLink';
import { film } from '../components/FilmPlayer';

/** 01 · Lights On — the hero. The intro is time-based (fx.intro); scrolling dollies the camera on. */
export default function LightsOn() {
  const ref = useRef();
  const block = useRef();
  const title = useRef();
  const stats = useRef();
  const ctas = useRef();
  const clock = useRef();
  const readout = useRef();
  const cue = useRef();
  const reduced = useUI((s) => s.reduced);
  const loaderDone = useUI((s) => s.loaderDone);
  const sceneReady = useUI((s) => s.sceneReady);
  const renderMode = useUI((s) => s.renderMode);

  useSection(ref, {
    id: 'lights-on',
    order: 0,
    shot: heroShot,
    build: (tl) => {
      fadeOut(tl, block.current, 0.5, 0.2);
      fadeOut(tl, readout.current, 0.5, 0.2);
      tl.fromTo(cue.current, { scaleY: 0 }, { scaleY: 1, duration: 0.4 }, 0);
      fadeOut(tl, cue.current.parentNode, 0.6, 0.15);
    },
  });

  // live Texas clock
  useEffect(() => {
    const set = () => clock.current && (clock.current.textContent = texasTime());
    set();
    const id = setInterval(set, 1000);
    return () => clearInterval(id);
  }, []);

  // hero text is slaved to the intro clock (so the film can replay it)
  useEffect(() => {
    const textTl = gsap.timeline({ paused: true });
    const text = title.current.querySelector('.wipe-text');
    const led = title.current.querySelector('.wipe-led');
    textTl.fromTo(title.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, 0);
    textTl.fromTo(text, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'expo.out' }, 0);
    textTl.fromTo(led, { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.75, ease: 'expo.out' }, 0);
    textTl.to(led, { opacity: 0.35, duration: 0.5 }, 0.8);
    textTl.fromTo(stats.current, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 0.55);
    textTl.fromTo(ctas.current, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 0.8);
    textTl.fromTo(readout.current.firstChild, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0.3);
    const dur = textTl.duration();
    const start = 3.4;
    const tick = () => {
      const t = fx.intro * INTRO_SECONDS;
      textTl.progress(Math.min(1, Math.max(0, (t - start) / dur)));
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      textTl.kill();
    };
  }, []);

  // start the lights-on sequence once the loader is gone and the scene is compiled
  useEffect(() => {
    if (!loaderDone) return;
    if (reduced || renderMode === 'stills') {
      if (reduced) fx.intro = 1;
      else gsap.fromTo(fx, { intro: 0.45 }, { intro: 1, duration: INTRO_SECONDS * 0.55, ease: 'none' });
      return;
    }
    if (!sceneReady || fx.intro > 0) return;
    const tw = gsap.fromTo(fx, { intro: 0 }, { intro: 1, duration: INTRO_SECONDS, ease: 'none', delay: 0.15 });
    return () => tw.kill();
  }, [loaderDone, sceneReady, reduced, renderMode]);

  return (
    <section ref={ref} id="lights-on" data-chapter="lights-on" data-scrolly className="relative" style={{ height: '200vh' }}>
      <div className="stage">
        <div ref={readout} className="absolute right-[var(--gutter)] top-[84px] z-10">
          <p className="plate mono px-3 py-2 text-[12px] uppercase tracking-[0.12em] text-mist" style={{ visibility: 'hidden' }}>
            Reveal night · Texas · <span ref={clock} className="text-white" />
          </p>
        </div>

        <div ref={block} data-block className="absolute bottom-[96px] left-0 right-0 z-10 sm:bottom-[104px]">
          <div className="gutter">
            <div className="scrim-bl max-w-[1100px]">
              <Headline as="h1" ref={title} className="display text-hero" style={{ visibility: 'hidden' }}>
                Roadster
              </Headline>
              <p ref={stats} className="mono mt-6 whitespace-pre-wrap text-[13px] uppercase tracking-[0.12em] text-white sm:text-[15px]" style={{ visibility: 'hidden' }}>
                {HERO_STATS.split('|').map((s, i) => (
                  <span key={i} className="mr-3 inline-block">
                    {i > 0 && <span className="mr-3 text-led">|</span>}
                    {s.trim()}
                  </span>
                ))}
              </p>
              <div ref={ctas} className="mt-7 flex flex-wrap gap-3" style={{ visibility: 'hidden' }}>
                {!reduced && (
                  <button type="button" className="btn-led" onClick={() => film.play()}>
                    <Play size={16} aria-hidden="true" /> Replay the reveal
                  </button>
                )}
                <TLink to="/configure" className="btn-outline">
                  Configure
                </TLink>
              </div>
            </div>
          </div>
        </div>

        <div className="rm-hide absolute bottom-6 right-[var(--gutter)] z-10 flex flex-col items-center gap-3" aria-hidden="true">
          <span className="label [writing-mode:vertical-rl]">Scroll</span>
          <span className="relative block h-16 w-[2px] bg-rig">
            <span ref={cue} className="led-line-v absolute inset-0 block" style={{ transform: 'scaleY(0)' }} />
          </span>
        </div>
      </div>
    </section>
  );
}
