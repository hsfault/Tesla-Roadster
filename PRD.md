# PRD — "Reveal Night" · Tesla Roadster (2nd gen) design concept

A portfolio showcase by **Zeltrion Solutions**. Not affiliated with or endorsed by Tesla, Inc.

## 1. Purpose
Relive the Roadster reveal night as a cinematic, scroll-driven 3D experience: a black arena, floodlight towers,
red LED lines on the ground and along a giant curved wall, drifting white smoke, and the white car as the only
bright object. It must feel hand-directed (never template / AI-looking), hold ~60 fps on a mid-range laptop,
and keep every line of text readable at every moment.

## 2. Pages
| Route | Content |
|---|---|
| `/` | 9 scroll chapters (Lights On → Configure teaser) + footer. Each section has `data-chapter`. |
| `/configure` | Persistent canvas car (left ~65%) + solid asphalt control panel (right). Stepper, live summary, share URL, snapshot. |
| `/specs` | Headline wipe, variant switcher, ruled mono spec rows; sticky line drawing of the car (desktop) / still (mobile). |
| `*` | 404 in the same language. |

## 3. Home sections (one persistent 3D scene, camera moves between shots)
1. **Lights On (hero)** — darkness → 3 floodlight banks clunk on (exposure 1→1.15→1), LED ground lines draw outward,
   rear view: light bar ignites centre-out, camera glides to low front ¾ (3.5 s). Idle ±3° orbit + 2° mouse parallax.
   Bottom-left scrim: ROADSTER / mono stats / Replay the reveal + Configure. Top-right live Texas clock. LED scroll cue.
2. **Walkaround** (sticky 250 vh) — side → rear → top-down spotlight. Three headlines (one per shot, own scrim).
   Four LED callout hotspots (drei `<Html>` on solid plates). Doors: not separable in the supplied model → skipped.
3. **0.81** (sticky 200 vh) — low rear chase; LED ground lines stream backward and stretch into speed lines;
   rear vapor; timer 0.00→0.81 s, speed 0→60 mph, camera shake; lock + LED flash; LED comparison bars (3.7 / 1.99 / 0.81).
4. **The Wall** (sticky 300 vh) — quarter-pipe rises, edge LEDs light bottom→top; car drives in and climbs to vertical;
   wide side → overhead with spotlight pool riding with the car → base looking straight up; G-meter to 2 G,
   fan RPM odometer, fan vapor; car rolls back down, ramp lights switch off.
5. **Flight** (sticky 300 vh) — line-up of 4 abstract blocks with red underglow; approach, 4 downward cold-gas jets
   (cones + sprites), 360° barrel roll over the line-up (side → overhead cut at apex), landing → enormous smoke cloud
   (instanced sprites + DOM smoke) that fills the screen. Scrubber TAKE-OFF · ROLL · LANDING. Text before take-off only.
6. **Charge** — smoke clears; side shot, red glow at the rear wing; LED battery bar 10→80 %, clock 00:00→10:00, kW→500.
7. **Variants** — overhead spotlight + broadcast LED frame; tabs Performance / Thrust / Rocket with sliding LED underline;
   rolling readouts; per-variant move (pivot / rear puff / all-thruster puff + 20 cm hop). Rocket tag.
8. **Road to 2028** — horizontal sticky timeline driven by vertical scroll with an LED line; 4 nodes. Mobile: vertical list.
9. **Configure teaser** — slow rotation, 6 paint swatches (0.6 s crossfade), "Design yours" → `/configure`.

## 4. Design system "Reveal Night"
Tokens: night `#050507`, asphalt `#0F1012`, rig `#1C1E22`, steel `#8A929C` (12px+ uppercase only), mist `#C9CED6`,
white `#F3F5F7`, led `#FF2A2A` (single accent), smoke `#DADDE0` (backgrounds only).
Fonts: Michroma (display, uppercase, 0.02em), Geist 400/500 (UI/body), Geist Mono (tabular numbers).
Scale: hero `clamp(4rem,14vw,14rem)`, section `clamp(2rem,5vw,5rem)`, body 16–18px / 1.6.
Signature: 1–2 px red LED lines with soft glow that draw segment by segment; floodlight glare spikes;
headline wipe behind a travelling LED line (0.9 s expo.out); odometer number rolls; typed labels.
Contrast: all text on scrims (black→transparent, 80% at the text side) or solid panels; no mix-blend on text;
smoke never carries text. Contrast check for the red CTA: white `#F3F5F7` on `#FF2A2A` is 3.4:1 (fails AA for
14 px labels). **Decision:** CTA fill is a deeper LED red `#C8161B` (white label 5.4:1) with an `#FF2A2A` 1 px glowing
edge, so the accent reads as the LED red while the label passes AA.

## 5. 3D pipeline
- Model `/public/models/roadster.glb` (1.8 MB, already meshopt + WebP 2048 — `roadster.source.glb` kept).
  Inspected with `gltf-transform inspect`; names recorded in `src/three/carMap.js`.
- The body shell, black trim, glass and wheels share ONE baked-atlas material (`26_10_18_21_33_26_302_0`).
  **Repaint by shader mask** (`src/three/repaint.js`): luminance of the baked atlas → paint vs satin black;
  saturated red texels → emissive red; height mask → glossy black glass vs satin lower body; geometric cylinders →
  wheel rims (graphite / forged silver) + caliper sector (variant/config colour); nose band → cool-white light strip.
  Separate meshes: rear light bar (emissive red via its texture), rear fascia, plate, plate holder.
- One `<Canvas>` fixed behind the DOM; `CameraRig` reads a mutable director state (`src/three/director.js`) that is
  computed every frame from section progress values (GSAP ScrollTrigger, `scrub: 1`) and pure shot functions
  (`src/three/shots.js`). Between sections the camera blends end-shot → start-shot while the next section scrolls in.
- Arena: asphalt ground (MeshReflectorMaterial 512, blur [300,100], mixStrength .8 — desktop only), merged LED strip
  geometry with a shader (draw / flow / dash / flash), 3 floodlight towers (instanced truss + emissive panels + glare
  sprites + spot lights), fog `#050507` 20→90.
- Wall ramp: extruded quarter-pipe profile, concrete texture, LED tube edges (draw bottom→top), instanced truss.
- Lighting: Environment + Lightformer strips, overhead pool spot, tower spots, ACES tone mapping (post effect),
  one baked ContactShadows frame. Bloom low-res (mipmapBlur, ≤ .7) for emissives only.
- Mobile (<768 px) / low-power / reduced-motion: no live 3D; pre-rendered WebP stills of the same shots
  (`/public/shots/*.webp`, captured once with `npm run capture`), cross-faded by section.

## 6. Global components
Loader "Lights On" (12 dots driven by real progress: useProgress + fonts + scene ready; session skip) ·
Nav (wordmark, links, Reserve, Zeltrion chip, LED hover underline, active dot, hide on scroll down) ·
MobileMenu (solid night overlay, Michroma 9vw, LED lines, mono indices) ·
FilmPlayer (bottom-left 56 px LED ring → player bar; countdown; chapters from `film.js`; blackout cuts inside the
canvas; letterbox; lower-third; any input pauses; Space / Esc) · Countdown · SmokeTransition (text out → 7 smoke
sprites + #DADDE0 → swap → clear → headline) · Footer (LED top line, statement, 4 columns, disclaimer, small bar) ·
Odometer · Scrim · LedLine · GMeter · ConceptChip.

## 7. Data files
`src/data/specs.js`, `variants.js`, `paints.js`, `film.js`, `timeline.js` (all copy lives there).

## 8. Interactions
Lenis (lerp .1) driven by GSAP ticker; ScrollTrigger scrub 1 everywhere; only transform / opacity animated
(clip-path on small elements). Default cursor; pointer only on interactive elements. 44×44 px tap targets.
Configurator: OrbitControls (damping, polar 55–88°, zoom .8–1.4, no pan), presets Front / Side / Rear / Top
(no interior in model), stepper Variant / Paint / Wheels / Calipers (Interior skipped: no interior materials),
live summary, Copy my build (URL `?v=&p=&w=&c=`), Snapshot (PNG), Reserve on tesla.com ↗.

## 9. Performance budget
1 WebGL canvas · dpr [1, 1.5] · PerformanceMonitor → dpr 1, plain ground, no bloom · section-gated visibility ·
frameloop `demand` when covered · GLB < 8 MB · textures ≤ 2048, sprites ≤ 1024 · no real-time shadows, no
transmission / SSR / SSAO / DOF · ≤ 300 pooled instanced sprites, depthWrite false · no React state in useFrame ·
ScrollTriggers created once per section, killed on unmount · routes code-split, 3D chunk after first paint ·
reduced motion: still shots, simple fades, no smoke, no film player.

## 10. Assets
| Path | Source |
|---|---|
| `/public/models/roadster.glb` | supplied |
| `/public/brand/tesla-logo.*`, `tesla-wordmark.*` | supplied raster (emblem + wordmark, recoloured white, not redrawn); SVGs not supplied |
| `/public/fx/smoke-1..6.jpg`, `vapor-jet.jpg`, `flare.jpg` | Pollinations planned → account had no balance; generated procedurally (noise) instead |
| `/public/textures/asphalt-dark.jpg`, `concrete-ramp.jpg` | procedural (seamless noise) |
| `/public/env/arena-night.jpg`, `legacy-1..3.jpg` | rendered from the site's own empty arena scene (no vehicles) |
| `/public/shots/*.webp` | captured from the live scene (desktop 16:9 + mobile portrait) |
| `/public/press/*.jpg` | optional — not supplied → timeline uses env images |
