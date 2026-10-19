import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Play, Pause, ListVideo, Volume2, VolumeX } from 'lucide-react';
import { gsap } from '../lib/gsap';
import { getLenis } from '../lib/lenis';
import { timecode } from '../lib/time';
import { startHum, stopHum, tick as tickSound } from '../lib/sound';
import { CHAPTERS, FILM_TOTAL, CUT } from '../data/film';
import { fx, snapScrub } from '../three/director';
import { INTRO_SECONDS } from '../three/shots';
import { useUI } from '../store/ui';
import Countdown from './Countdown';

// Global handle so the hero's "Replay the reveal" button can start the film.
export const film = { play: () => {} };

const sectionRange = (id) => {
  const el = document.querySelector(`[data-chapter="${id}"]`);
  if (!el) return null;
  const top = el.getBoundingClientRect().top + window.scrollY;
  return { start: top, end: Math.max(top, top + el.offsetHeight - window.innerHeight) };
};

/**
 * "Replay the reveal": the home page played as a film. One paused GSAP timeline holds every cut and scroll
 * glide, so play / pause / seek / chapter jumps are all just timeline operations.
 */
export default function FilmPlayer() {
  const { pathname } = useLocation();
  const reduced = useUI((s) => s.reduced);
  const footerVisible = useUI((s) => s.footerVisible);
  const filmActive = useUI((s) => s.filmActive);
  const playing = useUI((s) => s.filmPlaying);
  const sound = useUI((s) => s.sound);
  const activeSection = useUI((s) => s.activeSection);

  const [expanded, setExpanded] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [chapterIdx, setChapterIdx] = useState(0);
  const [countdown, setCountdown] = useState(false);
  const [title, setTitle] = useState(null);

  const tl = useRef(null);
  const scroll = useRef({ y: 0 });
  const lastY = useRef(0);
  const fill = useRef();
  const tc = useRef();
  const titleEl = useRef();
  const letterTop = useRef();
  const letterBottom = useRef();
  const idleTimer = useRef();
  const chapterRef = useRef(0);
  const barRef = useRef();

  const visible = pathname === '/' && !reduced && (!footerVisible || filmActive);

  // ---------------------------------------------------------------- timeline
  const build = useCallback(() => {
    tl.current?.kill();
    const t = gsap.timeline({ paused: true, onUpdate: onUpdate, onComplete: () => stop() });
    let at = 0;
    CHAPTERS.forEach((c) => {
      const r = sectionRange(c.id) || { start: 0, end: 0 };
      t.addLabel(c.id, at);
      // cut: floodlights snap off → title on solid black → lights back on in banks, left → right
      t.to(fx, { blackout: 1, duration: CUT.blackout, ease: 'none' }, at);
      t.set(titleEl.current, { autoAlpha: 1 }, at + CUT.blackout);
      t.set(scroll.current, { y: r.start }, at + CUT.blackout);
      t.set(fx.bank, { 0: 0, 1: 0, 2: 0 }, at + CUT.blackout);
      t.set(titleEl.current, { autoAlpha: 0 }, at + CUT.blackout + CUT.title);
      t.set(fx, { blackout: 0 }, at + CUT.blackout + CUT.title);
      const on = at + CUT.blackout + CUT.title;
      t.to(fx.bank, { 0: 1, duration: 0.05, ease: 'none' }, on + 0.02);
      t.to(fx.bank, { 1: 1, duration: 0.05, ease: 'none' }, on + 0.13);
      t.to(fx.bank, { 2: 1, duration: 0.05, ease: 'none' }, on + 0.24);
      let glideStart = on + CUT.banks;
      if (c.id === 'lights-on') {
        // the hero replays its own lights-on sequence before the camera moves on
        t.set(fx.bank, { 0: 1, 1: 1, 2: 1 }, on);
        t.fromTo(fx, { intro: 0 }, { intro: 1, duration: INTRO_SECONDS, ease: 'none', immediateRender: false }, on);
        glideStart = on + INTRO_SECONDS - 0.5;
      }
      const glide = Math.max(1, at + c.duration - glideStart);
      t.fromTo(scroll.current, { y: r.start }, { y: r.end, duration: glide, ease: 'sine.inOut', immediateRender: false }, glideStart);
      at += c.duration;
    });
    tl.current = t;
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onUpdate() {
    const t = tl.current;
    if (!t) return;
    const y = scroll.current.y;
    const lenis = getLenis();
    if (Math.abs(y - lastY.current) > 0.5) {
      lenis ? lenis.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y);
      if (Math.abs(y - lastY.current) > window.innerHeight * 0.6) requestAnimationFrame(snapScrub);
      lastY.current = y;
    }
    const time = t.time();
    if (fill.current) fill.current.style.transform = `scaleX(${time / FILM_TOTAL})`;
    if (tc.current) tc.current.textContent = `${timecode(time)} / ${timecode(FILM_TOTAL)}`;
    let acc = 0;
    let idx = 0;
    for (let i = 0; i < CHAPTERS.length; i++) {
      if (time >= acc) idx = i;
      acc += CHAPTERS[i].duration;
    }
    if (idx !== chapterRef.current) {
      chapterRef.current = idx;
      setChapterIdx(idx);
      useUI.getState().set({ chapter: CHAPTERS[idx].id });
    }
    setTitleFor(idx);
  }

  const titleIdx = useRef(-1);
  function setTitleFor(idx) {
    if (titleIdx.current === idx) return;
    titleIdx.current = idx;
    setTitle(CHAPTERS[idx]);
  }

  // ---------------------------------------------------------------- controls
  const enterFilm = () => {
    useUI.getState().set({ filmActive: true, filmPlaying: true });
    gsap.to([letterTop.current, letterBottom.current], { scaleY: 1, duration: 0.6, ease: 'power3.out' });
    startHum();
  };

  const exitFilm = () => {
    useUI.getState().set({ filmActive: false, filmPlaying: false });
    gsap.to([letterTop.current, letterBottom.current], { scaleY: 0, duration: 0.5, ease: 'power3.inOut' });
    gsap.set(titleEl.current, { autoAlpha: 0 });
    fx.blackout = 0;
    fx.bank[0] = fx.bank[1] = fx.bank[2] = 1;
    stopHum();
  };

  function pause(fromInput) {
    if (!tl.current) return;
    tl.current.pause();
    fx.blackout = 0;
    fx.bank[0] = fx.bank[1] = fx.bank[2] = 1;
    gsap.set(titleEl.current, { autoAlpha: 0 });
    if (fromInput) exitFilm();
    else useUI.getState().set({ filmPlaying: false });
  }

  function stop() {
    tl.current?.pause();
    exitFilm();
  }

  const playFrom = (id, withCountdown) => {
    const t = build();
    lastY.current = -1;
    const go = () => {
      enterFilm();
      t.play(id);
    };
    if (withCountdown) {
      setCountdown(true);
      useUI.getState().set({ filmActive: true });
      gsap.to([letterTop.current, letterBottom.current], { scaleY: 1, duration: 0.6, ease: 'power3.out' });
    } else go();
    countdownDone.current = go;
  };
  const countdownDone = useRef(null);

  const toggle = () => {
    if (playing) return pause(false);
    const st = useUI.getState();
    if (tl.current && tl.current.time() > 0 && tl.current.progress() < 1) {
      // resume from the start of the current chapter
      const id = CHAPTERS[chapterRef.current].id;
      enterFilm();
      tl.current.play(id);
    } else {
      const fromSection = CHAPTERS.findIndex((c) => c.id === st.activeSection);
      playFrom(CHAPTERS[Math.max(0, fromSection)].id, true);
    }
  };

  film.play = () => playFrom(CHAPTERS[0].id, true);

  const seek = (e) => {
    const rect = barRef.current.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    if (!tl.current) build();
    lastY.current = -1;
    tl.current.time(f * FILM_TOTAL);
    requestAnimationFrame(snapScrub);
  };

  // any wheel / touch / drag / key (except Space) pauses; Space toggles; Esc stops
  useEffect(() => {
    if (!filmActive) return;
    const onWheel = () => pause(true);
    const onTouch = () => pause(true);
    const onPointer = (e) => {
      if (e.target.closest?.('[data-film-ui]')) return;
      pause(true);
    };
    const onKey = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        toggle();
      } else if (e.key === 'Escape') stop();
      else if (!e.target.closest?.('[data-film-ui]')) pause(true);
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filmActive, playing]);

  // leaving the page stops the film
  useEffect(() => {
    if (pathname !== '/' && useUI.getState().filmActive) stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => () => tl.current?.kill(), []);

  // chapter shown while idle follows the scroll position
  useEffect(() => {
    if (playing) return;
    const i = CHAPTERS.findIndex((c) => c.id === activeSection);
    if (i >= 0) {
      chapterRef.current = i;
      setChapterIdx(i);
    }
  }, [activeSection, playing]);

  const open = () => {
    clearTimeout(idleTimer.current);
    setExpanded(true);
  };
  const scheduleClose = () => {
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      setExpanded(false);
      setListOpen(false);
    }, 1800);
  };

  const ch = CHAPTERS[chapterIdx];

  return (
    <>
      {/* letterbox (solid black) */}
      <div ref={letterTop} className="pointer-events-none fixed inset-x-0 top-0 z-[60] origin-top bg-black" style={{ height: '6vh', transform: 'scaleY(0)' }} aria-hidden="true" />
      <div ref={letterBottom} className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex origin-bottom items-center justify-center bg-black" style={{ height: 'max(6vh, 64px)', transform: 'scaleY(0)' }}>
        {filmActive && title && (
          <div className="plate flex max-w-[calc(100vw-176px)] items-center gap-3 px-3 py-2">
            <span className="mono text-[12px] text-led">{title.n}</span>
            <span className="truncate font-mono text-[12px] uppercase tracking-[0.14em] text-white">{title.title}</span>
            <span className="hidden truncate text-[13px] text-mist md:inline">{title.caption}</span>
          </div>
        )}
      </div>

      {/* chapter title card / countdown on solid black */}
      <div ref={titleEl} className="pointer-events-none fixed inset-0 z-[65] flex flex-col items-center justify-center bg-black" style={{ visibility: 'hidden', opacity: 0 }} aria-live="polite">
        {title && (
          <>
            <span className="mono text-[13px] text-led">{title.n}</span>
            <span className="display mt-3 text-center" style={{ fontSize: 'clamp(1.8rem, 6vw, 4.5rem)' }}>
              {title.title}
            </span>
          </>
        )}
      </div>
      {countdown && (
        <Countdown
          onTick={tickSound}
          onDone={() => {
            setCountdown(false);
            countdownDone.current?.();
          }}
        />
      )}

      {/* the player */}
      <div
        data-film-ui
        className="fixed bottom-4 left-4 z-[66] transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none' }}
        onPointerEnter={open}
        onPointerLeave={scheduleClose}
        onFocus={open}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) scheduleClose();
        }}
      >
        {expanded ? (
          <div className="plate relative flex h-14 items-center gap-1 pr-2" style={{ width: 'min(640px, calc(100vw - 32px))' }}>
            <button type="button" onClick={toggle} className="tap flex h-14 w-14 shrink-0 items-center justify-center text-white" aria-label={playing ? 'Pause the film' : 'Play the reveal as a film'}>
              {playing ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <span className="hidden w-[132px] shrink-0 truncate font-mono text-[12px] uppercase tracking-[0.12em] text-white sm:block">
              <span className="text-led">{ch.n}</span> {ch.title}
            </span>
            <div
              ref={barRef}
              role="slider"
              tabIndex={0}
              aria-label="Film position"
              aria-valuemin={0}
              aria-valuemax={FILM_TOTAL}
              aria-valuenow={Math.round(tl.current?.time() || 0)}
              className="relative flex h-11 min-w-[60px] flex-1 cursor-pointer items-center"
              onPointerDown={(e) => {
                seek(e);
                const move = (ev) => seek(ev);
                const up = () => {
                  window.removeEventListener('pointermove', move);
                  window.removeEventListener('pointerup', up);
                };
                window.addEventListener('pointermove', move);
                window.addEventListener('pointerup', up);
              }}
              onKeyDown={(e) => {
                if (!tl.current) build();
                if (e.key === 'ArrowRight') tl.current.time(Math.min(FILM_TOTAL, tl.current.time() + 5));
                if (e.key === 'ArrowLeft') tl.current.time(Math.max(0, tl.current.time() - 5));
              }}
            >
              <span className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-rig" />
              <span ref={fill} className="led-line absolute left-0 right-0 top-1/2 -translate-y-1/2" style={{ transform: `scaleX(${(tl.current?.time() || 0) / FILM_TOTAL})` }} />
              {CHAPTERS.reduce(
                (acc, c) => {
                  acc.items.push(<span key={c.id} className="absolute top-1/2 h-[8px] w-px -translate-y-1/2 bg-steel" style={{ left: `${(acc.t / FILM_TOTAL) * 100}%` }} />);
                  acc.t += c.duration;
                  return acc;
                },
                { t: 0, items: [] }
              ).items}
            </div>
            <span ref={tc} className="mono hidden shrink-0 px-2 text-[12px] text-mist sm:block">
              {timecode(tl.current?.time() || 0)} / {timecode(FILM_TOTAL)}
            </span>
            <button type="button" onClick={() => setListOpen((v) => !v)} className="tap flex shrink-0 items-center justify-center text-mist hover:text-white" aria-label="Chapters" aria-expanded={listOpen}>
              <ListVideo size={18} />
            </button>
            <button type="button" onClick={() => useUI.getState().toggleSound()} className="tap flex shrink-0 items-center justify-center text-mist hover:text-white" aria-label={sound ? 'Sound off' : 'Sound on'} aria-pressed={sound}>
              {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            {listOpen && (
              <ul className="plate absolute bottom-[calc(100%+8px)] left-0 w-full max-w-[340px] py-2">
                {CHAPTERS.map((c, i) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setListOpen(false);
                        playFrom(c.id, false);
                      }}
                      className="flex min-h-[44px] w-full items-center gap-3 px-4 text-left hover:bg-rig"
                      aria-current={i === chapterIdx ? 'true' : undefined}
                    >
                      <span className={`mono text-[12px] ${i === chapterIdx ? 'text-led' : 'text-steel'}`}>{c.n}</span>
                      <span className="text-[14px] text-white">{c.title}</span>
                      <span className="mono ml-auto text-[12px] text-mist">{timecode(c.duration)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => (window.matchMedia('(hover: hover)').matches ? toggle() : open())}
            className="pulse-ring relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-led bg-night text-white"
            style={{ boxShadow: '0 0 12px rgba(255,42,42,.45)' }}
            aria-label={playing ? 'Pause the film' : 'Replay the reveal'}
          >
            {playing ? <Pause size={20} /> : <Play size={20} className="translate-x-[1px]" />}
          </button>
        )}
      </div>
    </>
  );
}
