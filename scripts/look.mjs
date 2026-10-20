// Dev helper: render a few shots of the live scene to a folder for look-dev. node scripts/look.mjs <outDir> [ids]
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
const OUT = process.argv[2];
const IDS = (process.argv[3] || 'hero,walk-side,walk-rear,launch').split(',');
const SH = { hero: ['lights-on', 0], 'walk-side': ['walkaround', 0.12], 'walk-rear': ['walkaround', 0.47], 'walk-top': ['walkaround', 0.86], launch: ['launch', 0.5], 'wall-top': ['wall', 0.44], charge: ['charge', 0.6], teaser: ['configure', 0.5], flight: ['flight', 0.44] };
mkdirSync(OUT, { recursive: true });
const server = spawn('npx', ['vite', '--port', '5181', '--strictPort'], { cwd: new URL('..', import.meta.url).pathname, stdio: ['ignore', 'pipe', 'ignore'], detached: true });
await new Promise((r) => server.stdout.on('data', (d) => String(d).includes('Local') && r()));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.goto('http://localhost:5181/?capture=1');
await page.waitForFunction(() => window.__captureReady === true && window.__capture, null, { timeout: 240000 });
await new Promise((r) => setTimeout(r, 3000));
for (const id of IDS) {
  const [section, p] = SH[id];
  const d = await page.evaluate((o) => window.__capture(o, 'image/png'), { section, p, wait: 2500 });
  writeFileSync(`${OUT}/${id}.png`, Buffer.from(d.split(',')[1], 'base64'));
  console.log('saved', id);
}
await browser.close().catch(() => {});
process.kill(-server.pid, 'SIGKILL');
process.exit(0);
