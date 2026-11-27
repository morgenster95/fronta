// Filmové scény Day reelu Day 18 (27. 11. 2026). Kreslené scény místa, které na mapě hry není: pastvina nad Port Abel (domov hrdiny), statek.
// Pravidla (CLAUDE.md): měřítko 1:1 jako hra (voják 19×30 px, 1 px ≈ 5,8 cm), rekvizity z PixelLabu zmenšené podle skutečné velikosti (tools/fit-props.py),
// terén v kódu paletou Trench-24 s ditheringem, žádná průhlednost postav, jen pár postav a vždy celé vidět, žádné vstupy a zmizení uprostřed scény.
//  • pasture – úsvit nad Port Abel: kamenná zídka, ovce, jehně, kupka sena, hůl opřená o zídku; Karel jde po cestě pryč (armáda potřebuje dalšího muže)
//  • farm – ráno po mrazu: kráva u plotu, statek s děravou střechou a kapkou do kbelíku (dopis z domova)
import { off } from './cinema.js';
import { loadImage } from './assets.js';
import sheepSrc from '../../art/cine/prop_sheep.png';
import grazeSrc from '../../art/cine/prop_sheep_graze.png';
import lambSrc from '../../art/cine/prop_lamb.png';
import cowSrc from '../../art/cine/prop_cow.png';
import haySrc from '../../art/cine/prop_haystack.png';
import fenceSrc from '../../art/cine/prop_fence.png';
import wallSrc from '../../art/cine/prop_stonewall.png';
import crookSrc from '../../art/cine/prop_crook.png';

let W = 90, H = 160;
const SIZE = { pasture: [90, 160], farm: [90, 160] };
const P = { ink: '#0e0d0c', dark: '#1c1a17', mud0: '#2b2722', mud1: '#3d3730', mud2: '#524a3f', mud3: '#6b6152', sand: '#857a68', bone: '#a39782', pale: '#c4b8a0', white: '#e3d9c3',
  steel: '#666d70', grey: '#8a9295', water: '#2a3138', navy: '#141a2c', dusk: '#4b4560', rust: '#7e3b2a', rust2: '#5c2a22', fire: '#a85a36', gold: '#d98f3f', yellow: '#c9c26a', olive: '#6f7148', olive2: '#52543a', olive3: '#8c8a5c', olive4: '#3f4230' };
const B = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const by = (x, y) => (B[y & 3][x & 3] + 0.5) / 16;
const hash = (x, y, s = 0) => { let n = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
const clamp = (v) => Math.max(0, Math.min(1, v));

function sprite(tx, tint) {
  if (!tx?.source?.resource) return null;
  const f = tx.frame, o = off(f.width, f.height), g = o.getContext('2d');
  g.drawImage(tx.source.resource, f.x, f.y, f.width, f.height, 0, 0, f.width, f.height);
  if (tint) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = tint; g.fillRect(0, 0, f.width, f.height); }
  return o;
}
function tinted(img, tint) {
  if (!img) return null;
  const o = off(img.width, img.height), g = o.getContext('2d');
  g.drawImage(img, 0, 0);
  if (tint) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = tint; g.fillRect(0, 0, img.width, img.height); }
  return o;
}
function footOf(c) {
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  for (let y = c.height - 1; y >= 0; y--) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 0) return y + 1;
  return c.height;
}
const loadAny = (src) => loadImage(src).catch(() => null);

export async function makeDay18Scenes(tex = {}, anims = {}) {
  const canvas = off(W, H);
  const g = canvas.getContext('2d');
  g.imageSmoothingEnabled = false;
  const A = (k, a, d, tint) => (anims[k]?.[a]?.[d] || []).map((t) => sprite(t, tint));
  const prop = async (src, tint) => tinted(await loadAny(src), tint);
  const DAWN = 'rgba(120,80,70,0.07)', FROST = 'rgba(150,170,200,0.10)';
  const S = { walkE: A('concord', 'walk', 'east', DAWN), stand: sprite(tex.concord?.south, DAWN), standE: sprite(tex.concord?.east, DAWN) };
  const R = {
    sheep: await prop(sheepSrc, DAWN), graze: await prop(grazeSrc, DAWN), lamb: await prop(lambSrc, DAWN), hay: await prop(haySrc, DAWN), wall: await prop(wallSrc, DAWN), crook: await prop(crookSrc, DAWN),
    cow: await prop(cowSrc, FROST), fence: await prop(fenceSrc, FROST),
  };
  const feet = new Map();
  const at = (arr, t, fps) => (arr?.length ? arr[Math.floor(t * fps) % arr.length] : null);
  const put = (c, cx, foot, flip = false) => {
    if (!c) return;
    if (!feet.has(c)) feet.set(c, footOf(c));
    const x = Math.round(cx - c.width / 2), y = Math.round(foot - feet.get(c));
    if (flip) { g.save(); g.translate(x + c.width, y); g.scale(-1, 1); g.drawImage(c, 0, 0); g.restore(); } else g.drawImage(c, x, y);
  };
  const tl = (c, x, y) => { if (c) g.drawImage(c, Math.round(x), Math.round(y)); };
  const px = (c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  const glow = (x, y, r, a, rgb) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
  const field = (y0, y1, cols, f) => { for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) { const v = clamp(f(x, y)) * 0.999; const u = v * (cols.length - 1); const i = Math.floor(u); px(u - i > by(x, y) ? cols[Math.min(cols.length - 1, i + 1)] : cols[i], x, y); } };
  const hills = (base, amp, f1, f2, cols, seed, y1) => { for (let x = 0; x < W; x++) { const h = Math.round(base + amp * Math.sin(x / f1 + seed) + amp * 0.5 * Math.sin(x / f2 + seed * 2)); for (let y = h; y < y1; y++) px(((y - h) < 2 && by(x, y) < 0.5) ? cols[1] : cols[0], x, y); } };
  const tufts = (y0, y1, n, cols, seed) => { for (let k = 0; k < n; k++) { const x = Math.floor(hash(k, 1, seed) * W), y = y0 + Math.floor(hash(k, 2, seed) * (y1 - y0)); px(cols[k % cols.length], x, y, 1, 1); px(cols[k % cols.length], x, y - 1, 1, 1); } };

  const scenes = {
    pasture(t) {
      // úsvit: dithrovaná obloha, vzdálené kopce, louka, cesta; kamenná zídka s ovcemi, kupka sena, hůl; Karel jde po cestě zprava doleva… doprava pryč
      field(0, 70, ['#3a3048', '#7a5560', P.fire, P.gold, '#e3b97a'], (x, y) => y / 70);
      glow(58, 66, 34, 0.5, '240,190,120');
      hills(64, 4, 13, 5.3, [P.dusk, '#6a5870'], 1, 90);
      hills(74, 4, 9, 3.7, [P.olive4, P.olive2], 2, 100);
      field(82, 160, [P.olive2, P.olive, P.olive3], (x, y) => 0.15 + 0.55 * ((y - 82) / 78) + 0.15 * hash(x >> 1, y >> 1, 11));
      tufts(86, 158, 90, [P.olive3, P.olive, P.yellow], 7);
      // cesta (hlína) při spodním okraji, kudy Karel odchází
      for (let y = 138; y < 156; y++) for (let x = 0; x < W; x++) { const u = (y - 138) / 18, wob = Math.sin(x / 7) * 1.2; const v = hash(x, y, 21); if (u + wob * 0.05 > 0.0 && ((x + y) % 5 !== 0 || v > 0.5)) px(v < 0.35 ? P.mud3 : v < 0.75 ? P.sand : P.mud2, x, y); }
      // zídka přes celou šíři + sloupek
      for (const wx of [-6, 30, 66]) tl(R.wall, wx, 90);
      // kupka sena a hůl
      put(R.hay, 70, 124); put(R.crook, 78, 126);
      // ovce (pasou se: střídá se hlava dole a nahoře, každá jindy), jehně poskakuje
      const sw = (k, per) => (Math.floor((t + k) / per) % 2 === 0);
      put(sw(0, 1.7) ? R.graze : R.sheep, 14, 122); put(sw(0.9, 2.1) ? R.graze : R.sheep, 32, 131);
      put(R.lamb, 22, 136 - (Math.floor(t * 3) % 6 === 0 ? 1 : 0));
      // Karel přijde zleva po cestě, u zídky se na chvíli zastaví, otočí se k ovcím a pak odejde doprava (do armády)
      const x0 = -8, stop1 = 4.0, stop2 = 5.4, wx = (u) => x0 + 78 * u;
      let kx;
      if (t < stop1) kx = x0 + (58 - x0) * (t / stop1);
      else if (t < stop2) kx = 46;
      else kx = 58 + (110 - 58) * ((t - stop2) / 3.0);
      if (t >= stop1 && t < stop2) put(S.stand, 58, 150); else put(at(S.walkE, t, 7), kx, 150);
      g.fillStyle = 'rgba(100,60,50,0.05)'; g.fillRect(0, 0, W, H);
    },
    farm(t) {
      // ráno po mrazu: bledá obloha, namrzlá louka, plot a kráva, vpravo statek s děravou střechou; kapka padá do kbelíku
      field(0, 76, ['#2a3138', '#4b4560', '#8a9295', '#c4b8a0'], (x, y) => y / 76);
      hills(70, 3, 11, 4.1, [P.olive4, P.olive2], 3, 96);
      field(90, 160, [P.olive2, P.olive, P.olive3, P.white], (x, y) => 0.12 + 0.4 * ((y - 90) / 70) + 0.18 * hash(x, y >> 1, 12));
      for (let k = 0; k < 70; k++) px(P.white, Math.floor(hash(k, 3, 8) * W), 92 + Math.floor(hash(k, 4, 8) * 66)); // jinovatka
      for (let k = 0; k < 60; k++) px(P.olive3, Math.floor(hash(k, 5, 8) * W), 96 + Math.floor(hash(k, 6, 8) * 62));
      // statek vpravo: kamenné zdi, dveře, okno se světlem, střecha s dírou
      const hx = 44, hy = 56, hw = 50, hh = 64;
      for (let y = hy + 14; y < hy + hh; y++) for (let x = hx; x < hx + hw; x++) { const row = Math.floor((y - hy) / 5), o = row % 2 ? 4 : 0, jb = (y - hy) % 5 === 4 || (x + o) % 9 === 8; px(jb ? P.mud1 : (hash((x + o) / 9 | 0, row, 31) < 0.5 ? P.mud3 : P.mud2), x, y); }
      px(P.ink, hx, hy + hh, hw, 2);
      px(P.ink, hx + 20, hy + 36, 12, 28); px(P.rust2, hx + 21, hy + 37, 10, 27); px(P.ink, hx + 25, hy + 37, 1, 27); px(P.gold, hx + 28, hy + 52, 1, 2); // dveře
      px(P.ink, hx + 4, hy + 30, 12, 12); px(P.gold, hx + 5, hy + 31, 10, 10); px(P.ink, hx + 9, hy + 31, 1, 10); px(P.ink, hx + 5, hy + 36, 10, 1); glow(hx + 10, hy + 36, 16, 0.35, '240,190,110'); // okno
      for (let y = hy - 4; y < hy + 16; y++) { const w2 = Math.round(hw * 0.5 + (y - hy + 4) * 0.5); for (let x = hx + hw / 2 - w2 / 2 - 2; x < hx + hw / 2 + w2 / 2 + 2; x++) px(((x + y) % 4 === 0) ? P.rust : (hash(x, y, 13) < 0.5 ? P.rust2 : P.mud1), x, y); } // střecha
      px(P.ink, hx + 6, hy + 6, 7, 5); px(P.dark, hx + 7, hy + 7, 5, 3); // díra ve střeše
      const dropY = hy + 12 + ((t * 28) % 52); if (dropY < hy + hh - 6) { px(P.water, hx + 9, dropY, 1, 2); px(P.grey, hx + 9, dropY, 1, 1); }
      px(P.ink, hx + 4, hy + hh - 8, 8, 8); px(P.steel, hx + 5, hy + hh - 7, 6, 6); px(P.water, hx + 5, hy + hh - 7, 6, 2); // kbelík
      if (Math.floor(t * 2) % 3 === 0) px(P.grey, hx + 6, hy + hh - 7, 4, 1);
      // plot a kráva vlevo, kráva dýchá (pára)
      tl(R.fence, 0, 100); put(R.cow, 22, 132);
      if (Math.floor(t * 1.5) % 3 === 0) { px(P.pale, 38, 112, 2, 1); px(P.pale, 40, 111, 1, 1); }
      g.fillStyle = 'rgba(150,170,200,0.06)'; g.fillRect(0, 0, W, H);
    },
  };
  return { canvas, draw(name, t) { const sz = SIZE[name] || [90, 160]; if (canvas.width !== sz[0]) { canvas.width = sz[0]; canvas.height = sz[1]; } W = sz[0]; H = sz[1]; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.imageSmoothingEnabled = false; scenes[name]?.(Math.max(0, t)); } };
}
