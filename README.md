# Roadster · Reveal Night

A cinematic, scroll-driven design concept for the 2nd-generation Roadster, by **Zeltrion Solutions**.
Not affiliated with or endorsed by Tesla, Inc. Tesla, Roadster and the T logo are trademarks of Tesla, Inc.

The build spec is in [`PRD.md`](./PRD.md).

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # serve dist/
npm run capture    # re-render the stills in /public/shots (headless Chromium, ~5 min)
```

Query flags: `?render=stills` forces the pre-rendered fallback, `?render=live` forces WebGL.

## How it fits together

- **One persistent `<Canvas>`** (`src/three/Scene.jsx`), fixed behind the DOM and lazy-loaded after first paint.
- **Director** (`src/three/director.js`): a flat numeric scene state recomputed each frame from section progress
  (GSAP ScrollTrigger, `scrub: 1`) and pure shot functions (`src/three/shots.js`). Between sections the camera
  blends end-shot → start-shot while the next section scrolls in. Time-based effects (hero intro, film cuts,
  variant moves) layer on top through `fx`.
- **Sections** (`src/sections/*`) use `useSection()` to register their shot and build one scrubbed timeline whose
  duration is exactly 1, so DOM tweens are positioned by progress.
- **Film player** (`src/components/FilmPlayer.jsx`): the home page as one paused GSAP timeline of cuts and
  scroll glides; play / pause / seek are timeline operations.
- **Stills fallback**: phones (< 768 px), low-power devices and reduced motion get WebP stills of the same
  shots (`/public/shots`, `-m` = portrait), cross-faded by section, plus the DOM smoke / LED effects.

## The supplied model

`public/models/roadster.glb` (1.8 MB; already meshopt + quantized + WebP 2048 — `roadster.source.glb` kept).
Mesh / material names are recorded in `src/three/carMap.js`. The body shell, black lower body, glass, wheels
and tail lights share **one mesh with one baked-atlas material**, so the reveal look is applied in the shader
(`src/three/repaint.js`): bright atlas texels → paint, dark texels → satin black (glossy black glass above the
belt line), saturated red → emissive tail lights, geometric wheel cylinders → rims / tyres / caliper sector,
a band on the nose → front light strip. Splitting the mesh in Blender would allow exact per-part materials.

Model credit: “Tesla Roadster 2.0” by Michael (sketchfab.com/gmmichaelonearth), CC-BY-4.0.
