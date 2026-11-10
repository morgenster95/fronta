// Snímky obvazišť přímo ze hry (pro karusel make_day.py): kamera na nemocnici každé strany, skuteční ranění na lůžkách
// a nosítkách, cedulky se jmény. Potřebuje běžící vývojový server (npx vite --port 5187) a Chrome.
//   node tools/shot-hospital.mjs [výstupní složka]   → hosp_0.png, hosp_1.png (1080×1350, bez textů; texty doplní make_day.py)
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { ROOT } from './lib.mjs';

const out = process.argv[2] || path.join(ROOT, 'marketing', 'promo');
const base = process.env.REEL_URL || 'http://localhost:5187';
const CHROME = process.env.CHROME || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : '/usr/bin/google-chrome');
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 432, height: 540, deviceScaleFactor: 2.5 });
await page.goto(base, { waitUntil: 'networkidle0', timeout: 120000 });
await page.waitForFunction(() => window.__front?.hospitals, { timeout: 120000 });
for (const f of [0, 1]) {
  await page.evaluate((f) => {
    document.body.classList.add('reel');
    document.getElementById('loading')?.remove();
    document.querySelectorAll('.hs-tag').forEach((e) => e.remove());
    const { cam, hospitals, soldiers } = window.__front;
    const site = hospitals.sites.find((s) => s.faction === f);
    cam.anim = null;
    cam.set(site.x, site.y + (f === 0 ? 10 : -10), 4.6);
    window.__hs = { site, who: soldiers.filter((s) => s.faction === f && (s.hosp === 'bed' || s.hosp === 'stretcher')) };
  }, f);
  await new Promise((r) => setTimeout(r, 2500)); // terén a sprity se dokreslí
  await page.evaluate(() => {
    const { cam } = window.__front;
    if (!document.getElementById('hs-css')) {
      const st = document.createElement('style');
      st.id = 'hs-css';
      st.textContent = `.hs-tag { position: fixed; transform: translate(-50%, -100%); z-index: 50; font-family: 'VT323', monospace; font-size: 17px; color: #2a2118;
        background: #e3d9c3; border: 2px solid #0e0d0c; padding: 0 6px 1px; white-space: nowrap; box-shadow: 0 2px 0 #0e0d0c; }
        .hs-tag::after { content: ''; position: absolute; left: 50%; bottom: -7px; margin-left: -5px; border: 5px solid transparent; border-top-color: #0e0d0c; }`;
      document.head.appendChild(st);
    }
    for (const s of window.__hs.who) {
      const el = document.createElement('div');
      el.className = 'hs-tag';
      el.textContent = `@${s.handle}`;
      el.style.left = `${(s.x - cam.x) * cam.zoom + cam.w / 2}px`;
      el.style.top = `${(s.y - 16 - cam.y) * cam.zoom + cam.h / 2}px`;
      document.body.appendChild(el);
    }
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(out, `hosp_${f}.png`) });
  console.log(`hosp_${f}.png`, await page.evaluate(() => window.__hs.who.map((s) => `@${s.handle} (${s.hosp})`).join(', ') || '—'));
}
await browser.close();
