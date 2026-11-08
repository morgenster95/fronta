// Natočí promo video ze hry: node tools/record-reel.mjs <scénář> [výstup.mp4]
// Potřebuje běžící vývojový server (npm run dev, port v REEL_URL) a Chrome. Snímá 540×960 a ffmpeg zvětší ×2
// metodou nejbližšího souseda (pixel art zůstane ostrý) → MP4 1080×1920, 30 fps.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';
import { ROOT } from './lib.mjs';

const name = process.argv[2] || 'teaser';
const out = process.argv[3] || path.join(ROOT, 'marketing', 'reels', `${name}.mp4`);
const base = process.env.REEL_URL || 'http://localhost:5187';
const FPS = 30;
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const tmp = path.join(ROOT, 'marketing', 'reels', `_frames_${name}`);
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, protocolTimeout: 600000, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const page = await browser.newPage();
await page.setViewport({ width: 540, height: 960, deviceScaleFactor: 1 });
await page.goto(`${base}/?reel=${name}&vacant=700`, { waitUntil: 'networkidle0', timeout: 120000 });
await page.waitForFunction(() => window.__reel?.ready, { timeout: 120000 });
await page.evaluate(() => document.fonts.ready);
const seconds = await page.evaluate(() => window.__reel.seconds);
// zahřátí: terén se kreslí po blocích, necháme ho dokreslit
for (let i = 0; i < 40; i++) await page.evaluate((t) => window.__reel.frame(t), i / FPS - 40 / FPS);
const total = Math.min(Math.round(seconds * FPS), Number(process.env.LIMIT) || Infinity);
console.time('frames');
for (let f = 0; f < total; f++) {
  await page.evaluate((t) => window.__reel.frame(t), f / FPS);
  await page.screenshot({ path: path.join(tmp, `f${String(f).padStart(5, '0')}.png`), optimizeForSpeed: true });
  if (f % 60 === 0) console.log(`${name}: ${f}/${total}`);
}
console.timeEnd('frames');
await browser.close();
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(tmp, 'f%05d.png'),
  '-vf', 'scale=1080:1920:flags=neighbor', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', out]);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`hotovo: ${out}`);
