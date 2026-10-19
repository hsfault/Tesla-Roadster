import { useEffect, useRef } from 'react';
import { playWipe } from '../lib/gsap';
import { PAGE_ENTER } from '../lib/transition';
import { useUI } from '../store/ui';
import Headline from '../components/Headline';
import TLink from '../components/TLink';

export default function NotFound() {
  const h = useRef();
  useEffect(() => {
    useUI.getState().setSceneMode('none');
    document.title = 'Off the track · Roadster concept';
    const play = () => playWipe(h.current);
    if (!useUI.getState().transitioning) play();
    window.addEventListener(PAGE_ENTER, play);
    return () => window.removeEventListener(PAGE_ENTER, play);
  }, []);
  return (
    <section className="gutter relative z-10 flex min-h-[100svh] flex-col justify-center pt-16">
      <p className="label mb-4">404</p>
      <Headline ref={h} as="h1" className="display text-section" style={{ visibility: 'hidden' }}>
        Off the track.
      </Headline>
      <p className="mt-6 max-w-[44ch] text-[17px] text-mist">This page left the arena. The car is still under the floodlights.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <TLink to="/" className="btn-led">Back to the reveal</TLink>
        <TLink to="/configure" className="btn-outline">Configure</TLink>
      </div>
    </section>
  );
}
