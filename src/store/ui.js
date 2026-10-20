import { create } from 'zustand';
import { setSound } from '../lib/sound';
import { detectRenderMode, prefersLite, prefersReducedMotion } from '../lib/device';

const hasWindow = typeof window !== 'undefined';

export const useUI = create((set) => ({
  renderMode: hasWindow ? detectRenderMode() : 'live', // 'live' | 'stills'
  reduced: hasWindow ? prefersReducedMotion() : false,
  chunkLoaded: false,
  loadProgress: 0,
  stillsProgress: 0,
  transitionCovered: false,
  loaderDone: false,
  sceneReady: false,
  perfLow: false, // set by PerformanceMonitor when FPS drops: also drops bloom
  lite: hasWindow ? prefersLite() : false,
  sceneMode: 'home', // 'home' | 'configure' | 'specs' | 'none'
  activeSection: 'lights-on',
  menuOpen: false,
  navHidden: false,
  footerVisible: false,
  transitioning: false,
  // film player
  filmActive: false, // letterbox + chapter card visible
  filmPlaying: false,
  chapter: 'lights-on',
  sound: false,

  set: (patch) => set(patch),
  setSceneMode: (sceneMode) => set({ sceneMode }),
  setActiveSection: (activeSection) => set({ activeSection }),
  setMenuOpen: (menuOpen) => set({ menuOpen }),
  toggleSound: () =>
    set((s) => {
      setSound(!s.sound);
      return { sound: !s.sound };
    }),
}));
