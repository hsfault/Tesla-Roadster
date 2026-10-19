import { Component, lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ScrollTrigger } from './lib/gsap';
import { initLenis } from './lib/lenis';
import { isCapture } from './lib/device';
import { useUI } from './store/ui';
import Loader from './components/Loader';
import Nav from './components/Nav';
import MobileMenu from './components/MobileMenu';
import FilmPlayer from './components/FilmPlayer';
import SmokeTransition, { settleOnHash } from './components/SmokeTransition';
import StillsStage from './components/StillsStage';
import DomSmoke from './components/DomSmoke';

const Home = lazy(() => import('./pages/Home'));
const Configure = lazy(() => import('./pages/Configure'));
const Specs = lazy(() => import('./pages/Specs'));
const NotFound = lazy(() => import('./pages/NotFound'));

/** If WebGL or the scene fails for any reason, switch to the pre-rendered stills instead of a black page. */
class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err) {
    console.warn('3D scene failed, using stills:', err);
    useUI.getState().set({ renderMode: 'stills' });
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** The persistent WebGL canvas: its chunk is requested only after the first paint. */
function LiveScene() {
  const [Scene, setScene] = useState(null);
  useEffect(() => {
    let alive = true;
    const load = () =>
      import('./three/Scene').then((m) => {
        if (!alive) return;
        useUI.getState().set({ chunkLoaded: true });
        setScene(() => m.default);
      })
      .catch((err) => {
        console.warn('3D chunk failed to load, using stills:', err);
        useUI.getState().set({ renderMode: 'stills' });
      });
    const id = requestAnimationFrame(() => setTimeout(load, 0));
    return () => {
      alive = false;
      cancelAnimationFrame(id);
    };
  }, []);
  return Scene ? (
    <SceneBoundary>
      <Scene />
    </SceneBoundary>
  ) : null;
}

function RouteEffects() {
  const location = useLocation();
  useEffect(() => {
    // direct loads / browser back-forward: settle on the hash once the page has mounted
    if (!useUI.getState().transitioning) settleOnHash(location.hash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);
  return null;
}

function Shell() {
  const renderMode = useUI((s) => s.renderMode);
  return (
    <>
      {!isCapture && <Loader />}
      {renderMode === 'live' ? <LiveScene /> : <StillsStage />}
      <DomSmoke />
      {!isCapture && (
        <>
          <Nav />
          <MobileMenu />
        </>
      )}
      <main id="page" className="relative z-10">
        <Suspense fallback={<div className="h-[100svh]" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/configure" element={<Configure />} />
            <Route path="/specs" element={<Specs />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {!isCapture && <FilmPlayer />}
      <SmokeTransition />
      <RouteEffects />
    </>
  );
}

export default function App() {
  useEffect(() => {
    const { reduced } = useUI.getState();
    document.documentElement.classList.toggle('rm', reduced);
    if (!reduced && !isCapture) initLenis();
    // throttled resize → one ScrollTrigger refresh
    let t;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(() => ScrollTrigger.refresh(), 200);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
