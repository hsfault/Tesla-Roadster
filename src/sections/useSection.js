import { useGSAP, gsap, ScrollTrigger } from '../lib/gsap';
import { registerSection, unregisterSection } from '../three/director';
import { useUI } from '../store/ui';

/**
 * Wires a home section to the director and to one scrubbed GSAP timeline (scrub: 1).
 * - `shot(o, p)`: the 3D shot for progress p (pure; see three/shots.js)
 * - `build(tl, entry)`: add DOM tweens positioned in 0–1 (the timeline's duration is exactly 1)
 * - `onProgress(p)`: per-update hook for imperative readouts (odometers, gauges)
 * Reduced motion: no scrub sequences — the section shows its final, readable state.
 */
export function useSection(ref, { id, order, shot, build, onProgress }) {
  const reduced = useUI((s) => s.reduced);

  useGSAP(
    () => {
      const el = ref.current;
      const entry = registerSection({ id, order, shot });

      ScrollTrigger.create({
        trigger: el,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => self.isActive && useUI.getState().setActiveSection(id),
      });

      if (reduced) {
        entry.p = 0.5;
        ScrollTrigger.create({
          trigger: el,
          start: 'top 60%',
          end: 'bottom 40%',
          onToggle: (self) => {
            entry.enter = self.isActive || self.progress > 0 ? 1 : order === 0 ? 1 : 0;
            el.querySelectorAll('.rm-fade').forEach((n) => n.classList.toggle('is-in', self.isActive));
          },
        });
        onProgress?.(1);
        return () => unregisterSection(id);
      }

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: 1, invalidateOnRefresh: true },
        onUpdate: onProgress ? () => onProgress(entry.p) : undefined,
      });
      tl.to(entry, { p: 1, duration: 1, ease: 'none' }, 0);
      build?.(tl, entry);
      entry.triggers.push(tl.scrollTrigger);

      if (order > 0) {
        const enter = gsap.to(entry, {
          enter: 1,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'top top', scrub: 1 },
        });
        entry.triggers.push(enter.scrollTrigger);
      }
      return () => unregisterSection(id);
    },
    { scope: ref, dependencies: [reduced], revertOnUpdate: true }
  );
}
