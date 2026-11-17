// Snímky letadel pilotů ze hry (dev server `npx vite --port 5187` + Chrome): několik záběrů za sebou, kamera na frontu uprostřed.
//   node tools/shot-planes.mjs [výstupní složka]   → plane_0.png … plane_5.png (432×540 ×2)
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { ROOT } from './lib.mjs';
const out = process.argv[2] || path.join(ROOT, 'docs', 'mockups');
fs.mkdirSync(out, { recursive: true });
const base = process.env.REEL_URL || 'http://localhost:5187';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 540, height: 540, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
await page.goto(`${base}/?planes=0:0,1:1&orders=0:PILLBOXES,1:PILLBOXES`, { waitUntil: 'networkidle0', timeout: 120000 });
await page.waitForFunction(() => window.__front?.cam, { timeout: 120000 });
await page.evaluate(() => { document.getElementById('loading')?.remove(); const { cam } = window.__front; cam.anim = null; const S = window.__front.soldiers.filter((s) => s.sprite || s.x); const xs = S.map((s) => s.x).sort((a, b) => a - b), ys = S.map((s) => s.y).sort((a, b) => a - b); cam.set(xs[xs.length >> 1] ?? 3000, ys[ys.length >> 1] ?? 1000, 1.4); console.log(S.length); });
for (let i = 0; i < 6; i++) {
  await new Promise((r) => setTimeout(r, i ? 3000 : 3500));
  await page.screenshot({ path: path.join(out, `plane_${i}.png`) });
  console.log('shot', i);
}
await browser.close();
