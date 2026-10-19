// Capture the pre-rendered stills (mobile / low-power / reduced-motion fallback) and the arena env images
// from the live scene, once. Usage: npm run capture  (starts Vite, drives headless Chromium, writes /public).
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { chromium } from 'playwright-core';

const PORT = 5179;
const ROOT = new URL('..', import.meta.url).pathname;
const EXE = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

// ONLY=hero,charge npm run capture → re-render just those stills
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
const STILLS_ALL = [
  { id: 'hero', section: 'lights-on', p: 0 },
  { id: 'walk-side', section: 'walkaround', p: 0.12 },
  { id: 'walk-rear', section: 'walkaround', p: 0.47 },
  { id: 'walk-top', section: 'walkaround', p: 0.86 },
  { id: 'launch', section: 'launch', p: 0.5 },
  { id: 'wall-wide', section: 'wall', p: 0.24 },
  { id: 'wall-top', section: 'wall', p: 0.44 },
  { id: 'wall-up', section: 'wall', p: 0.64 },
  { id: 'flight-approach', section: 'flight', p: 0.12 },
  { id: 'flight-roll', section: 'flight', p: 0.44 },
  { id: 'charge', section: 'charge', p: 0.6 },
  { id: 'variants', section: 'variants', p: 0.5 },
  { id: 'road', section: 'road', p: 0.5 },
  { id: 'teaser', section: 'configure', p: 0.5 },
  ...['white', 'black', 'silver', 'red', 'blue', 'quicksilver'].map((paint) => ({ id: `configure-${paint}`, mode: 'configure', paint, wait: 3200 })),
];
const STILLS = ONLY ? STILLS_ALL.filter((s) => ONLY.includes(s.id)) : STILLS_ALL;

const ENV = [
  { file: 'env/arena-night.jpg', shot: { position: [0, 1.7, -14], target: [0, 6, 30], fov: 52 }, patch: { ledDraw: 1 } },
  { file: 'env/legacy-1.jpg', shot: { position: [0, 2.6, -9], target: [0, 0.4, 0], fov: 40 }, patch: { f0: 0, f1: 0, f2: 0, spot: 1, spX: 0, spY: 11, spZ: 0.4, ledLevel: 0.3, env: 0.2 } },
  { file: 'env/legacy-2.jpg', shot: { position: [-9, 3, 4], target: [0, 0.8, 11.5], fov: 42 }, patch: { lineup: 1, f0: 0.3, f1: 0.3, f2: 0.3 } },
  { file: 'env/legacy-3.jpg', shot: { position: [-24, 5, 6], target: [0, 6, 20], fov: 42 }, patch: { ramp: 1, rampLed: 1, f0: 0.4, f1: 0.4, f2: 0.4 } },
];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const save = (rel, dataUrl) => {
  const file = `${ROOT}public/${rel}`;
  mkdirSync(file.slice(0, file.lastIndexOf('/')), { recursive: true });
  writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log('saved', rel);
};

const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve) => server.stdout.on('data', (d) => String(d).includes('Local') && resolve()));

const browser = await chromium.launch({
  executablePath: EXE,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'],
});

try {
  for (const view of [
    { suffix: '', width: 1600, height: 900, env: true },
    { suffix: '-m', width: 720, height: 1280, env: false },
  ]) {
    const page = await browser.newPage({ viewport: { width: view.width, height: view.height }, deviceScaleFactor: 1 });
    page.on('pageerror', (e) => console.error('pageerror', e.message));
    await page.goto(`http://localhost:${PORT}/?capture=1`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__captureReady === true && typeof window.__capture === 'function', null, { timeout: 240000 });
    await wait(4000);
    for (const s of STILLS) {
      const override = s.mode ? { mode: s.mode, paint: s.paint, wait: s.wait } : { section: s.section, p: s.p };
      const data = await page.evaluate((o) => window.__capture(o, 'image/webp', 0.84), override);
      save(`shots/${s.id}${view.suffix}.webp`, data);
    }
    if (ONLY && !ONLY.includes('specs')) {
      await page.close();
      continue;
    }
    // back to white, then the specs line drawing
    await page.evaluate(() => window.__capture({ mode: 'configure', paint: 'white', wait: 1500 }));
    const specs = await page.evaluate(() => window.__capture({ sceneMode: 'specs', wait: 6000 }, 'image/webp', 0.86));
    save(`shots/specs${view.suffix}.webp`, specs);
    await page.evaluate(() => window.__capture({ sceneMode: 'home', wait: 500 }));
    if (view.env) {
      for (const e of ENV) {
        if (existsSync(`${ROOT}public/${e.file}`) && !process.env.FORCE) continue;
        const data = await page.evaluate((o) => window.__capture({ mode: 'arena', ...o }, 'image/jpeg', 0.86), { shot: e.shot, patch: e.patch });
        save(e.file, data);
      }
    }
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
