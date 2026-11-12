// Vyrenderuje samostatné filmové záběry (web/src/cinema-race.js) do MP4 1080×1920, 30 fps (mřížka 180×320 zvětšená ×6 metodou nejbližšího souseda).
// Použití: node tools/render-cine.mjs <záběr|all> [výstupní složka] [--side 0|1] [--n 123]
// Potřebuje běžící vývojový server (REEL_URL, výchozí http://localhost:5187) a Chrome (CHROME).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';
import { ROOT } from './lib.mjs';

const args = process.argv.slice(2);
const flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const pos = args.filter((a, i) => !a.startsWith('--') && !String(args[i - 1] || '').startsWith('--'));
const which = pos[0] || 'all';
const outDir = pos[1] || path.join(ROOT, 'marketing', 'reels', 'cine');
const base = process.env.REEL_URL || 'http://localhost:5187';
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
const FPS = 30;
fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, protocolTimeout: 600000, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
await page.setViewport({ width: 540, height: 960, deviceScaleFactor: 1 });
await page.goto(`${base}/?reel=cine`, { waitUntil: 'networkidle0', timeout: 120000 });
await page.waitForFunction(() => window.__cine, { timeout: 120000 });
const { names, seconds } = await page.evaluate(() => ({ names: window.__cine.names, seconds: window.__cine.seconds }));
const opts = { side: flag('--side') != null ? Number(flag('--side')) : undefined, n: flag('--n') != null ? Number(flag('--n')) : undefined, names: flag('--names') ? flag('--names').split(',') : undefined, heir: flag('--heir') || undefined, house: flag('--house') || undefined, fallen: flag('--fallen') || undefined, gen: flag('--gen') ? Number(flag('--gen')) : undefined, day: flag('--day') ? Number(flag('--day')) : undefined };
for (const name of which === 'all' ? names : [which]) {
  const tmp = path.join(outDir, `_f_${name}`);
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  const total = Math.round((seconds[name] || 7) * FPS);
  for (let f = 0; f < total; f++) {
    const url = await page.evaluate((nm, t, o) => window.__cine.png(nm, t, o), name, f / FPS, opts);
    fs.writeFileSync(path.join(tmp, `f${String(f).padStart(4, '0')}.png`), Buffer.from(url.split(',')[1], 'base64'));
  }
  const out = path.join(outDir, `${name}.mp4`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(tmp, 'f%04d.png'), '-vf', 'scale=1080:1920:flags=neighbor',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'medium', '-movflags', '+faststart', out]);
  // pár náhledových snímků (ve velikosti 540×960) pro kontrolu
  for (const s of [0.5, 2, 4, 6]) { const i = Math.min(total - 1, Math.round(s * FPS)); fs.copyFileSync(path.join(tmp, `f${String(i).padStart(4, '0')}.png`), path.join(outDir, `${name}_t${s}.png`)); }
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`hotovo: ${out}`);
}
await browser.close();
