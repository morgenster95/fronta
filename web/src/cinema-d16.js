// Filmové scény Day reelu Day 16 (25. 11. 2026). Stejné měřítko jako hra (vzor cinema-d14.js): 135×240 (×8) nebo 90×160 (×12),
// sprity a rekvizity ze hry 1:1, terén v kódu paletou Trench-24 s ditheringem, žádná průhlednost postav, vždy jen pár postav a celé vidět.
// Všechny scény nové (marketing/reels/scenes-used.json):
//  • rainback – noc a liják: raideři se vracejí přes val do vlastního zákopu (běží ke kameře), poslední zvedne nad hlavu kartičku
//  • mudward  – zatopený zákop v dešti: ranění na nosítkách v řadě, voda stoupá, jeden medik obvazuje (medici nestíhají)
//  • hospital – hlasování 1: vchod do nového nemocničního krytu (oblouk z pytlů, vlajka s křížem, lucerna), nosítka nesou dovnitř
//  • tanks    – hlasování 2: rozbitá cesta za frontou, Behemoth (Hegemonie) a Tortoise (Concord) stojí proti sobě, motory kouří
import { off } from './cinema.js';
import { loadImage } from './assets.js';
import stretcherSrc from '../../art/cine/prop_stretcher.png';

let W = 135, H = 240;
const SIZE = { rainback: [135, 240], mudward: [90, 160], hospital: [90, 160], tanks: [135, 240] };
const P = { ink: '#0e0d0c', dark: '#1c1a17', mud0: '#2b2722', mud1: '#3d3730', mud2: '#524a3f', mud3: '#6b6152', sand: '#857a68', bone: '#a39782', pale: '#c4b8a0', white: '#e3d9c3',
  steel: '#666d70', grey: '#8a9295', water: '#2a3138', navy: '#141a2c', dusk: '#4b4560', rust: '#7e3b2a', rust2: '#5c2a22', fire: '#a85a36', gold: '#d98f3f', yellow: '#c9c26a', olive: '#6f7148', olive2: '#52543a' };
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

export async function makeDay16Scenes(tex = {}, anims = {}) {
  const canvas = off(W, H);
  const g = canvas.getContext('2d');
  g.imageSmoothingEnabled = false;
  const RAIN = 'rgba(30,38,70,0.32)', LAMP = 'rgba(120,70,20,0.14)', DUSK = 'rgba(70,50,60,0.18)';
  const A = (k, a, d, tint) => (anims[k]?.[a]?.[d] || []).map((t) => sprite(t, tint));
  const prop = async (src, tint) => tinted(await loadAny(src), tint);
  const S = {
    runS: A('hegemony', 'run', 'south', RAIN), wave: A('hegemony', 'wave', 'south', RAIN), standS: sprite(tex.hegemony?.south, RAIN),
    band: A('hegemony_medic', 'bandage', 'east', RAIN), lyE: sprite((anims.hegemony?.['lying-wounded']?.east || [])[0], RAIN), lyW: sprite((anims.hegemony?.['lying-wounded']?.west || [])[0], RAIN),
    medW: A('hegemony_medic', 'walk', 'west', LAMP), lyL: sprite((anims.hegemony?.['lying-wounded']?.east || [])[0], LAMP),
    guardS: sprite(tex.hegemony?.south, DUSK), conN: sprite(tex.concord?.north, DUSK),
  };
  const R = {
    stretcherR: await prop(stretcherSrc, RAIN), stretcherL: await prop(stretcherSrc, LAMP),
    hegSide: await prop('/assets/props/tank_heg_side.png', DUSK), conSide: await prop('/assets/props/tank_con_side.png', DUSK),
    crater: await prop('/assets/props/crater_water.png', DUSK), tree: await prop('/assets/props/tree.png', 'rgba(20,16,24,0.5)'),
    wire: await Promise.all([0, 1].map((i) => prop(`/assets/props/wire_broken_${i}.png`, RAIN))),
  };
  const feet = new Map();
  const at = (arr, t, fps) => (arr?.length ? arr[Math.floor(t * fps) % arr.length] : null);
  const put = (c, cx, foot, flip = false) => {
    if (!c) return;
    if (!feet.has(c)) feet.set(c, footOf(c));
    const x = Math.round(cx - c.width / 2), y = Math.round(foot - feet.get(c));
    if (flip) { g.save(); g.translate(x + c.width, y); g.scale(-1, 1); g.drawImage(c, 0, 0); g.restore(); } else g.drawImage(c, x, y);
  };
  const px = (c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  const field = (y0, y1, cols, f) => { for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) { const v = clamp(f(x, y)) * 0.999; const u = v * (cols.length - 1); const i = Math.floor(u); px(u - i > by(x, y) ? cols[Math.min(cols.length - 1, i + 1)] : cols[i], x, y); } };
  const glow = (x, y, r, a, rgb) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
  const rain = (t, n, col, speed = 170) => { for (let k = 0; k < n; k++) { const p = (k * 0.618) % 1, q = (k * 0.7548) % 1; const y = ((q * (H + 20) + t * speed) % (H + 20)) - 10, x = ((p * (W + 40) + t * speed * 0.2) % (W + 40)) - 20; for (let i = 0; i < 3; i++) px(col, x - i * 0.3, y - i); } };
  const bags = (y0, rows, top = P.bone, side = P.sand) => { for (let r = 0; r < rows; r++) for (let x = -8; x < W + 8; x += 12) { const ox = x + (r % 2 ? 6 : 0), y = y0 + r * 7; px(P.ink, ox - 1, y - 1, 12, 8); px(side, ox, y, 10, 6); px(top, ox + 1, y, 8, 1); px(P.mud3, ox, y + 5, 10, 1); } };
  const ripples = (y0, y1, t, seed) => { for (let k = 0; k < 14; k++) { const r = (t * 2 + hash(k, 1, seed)) % 1, x = Math.floor(hash(k, 2, seed) * W), y = y0 + Math.floor(hash(k, 3, seed) * (y1 - y0)); const w = 1 + Math.floor(r * 4); px(P.grey, x - w, y, 1, 1); px(P.grey, x + w, y, 1, 1); } };

  const scenes = {
    rainback(t) {
      // shora: nahoře země nikoho s drátem, uprostřed val z pytlů, dole dno zákopu s loužemi; liják
      field(0, 90, [P.mud0, P.mud1, P.mud2], (x, y) => 0.25 + 0.4 * hash(x >> 2, y >> 2, 91) + y / 900);
      put(R.wire[0], 20, 40); put(R.wire[1], 112, 44); put(R.wire[0], 70, 36);
      bags(90, 3, P.bone, P.sand);
      field(111, H, [P.mud0, P.mud1, P.water], (x, y) => 0.25 + 0.35 * hash(x >> 1, y >> 2, 92) + (Math.sin(x * 0.2) > 0.6 && y > 180 ? 0.5 : 0));
      for (let y = 120; y < H; y += 12) { px(P.mud2, 20, y, 95, 8); px(P.mud3, 20, y, 95, 1); px(P.ink, 20, y + 8, 95, 1); }
      ripples(125, 235, t, 93);
      // tři raideři po sobě, každý ve vlastním pruhu (nikdo nikoho nezakrývá): přeběhnou val a seskočí do zákopu
      const crew = [[30, 0.0], [68, 0.8], [104, 1.6]];
      for (const [x, d] of crew) {
        const k = t - d;
        if (k < 0) continue;
        const run = Math.min(k, 1.6), y = 48 + run * 66; // od drátu k valu a dolů do zákopu
        put(k < 1.6 ? at(S.runS, k, 10) : S.standS, x, Math.round(y));
      }
      // poslední zvedne kartičku nad hlavu (lesk)
      if (t > 3.6) { const k = clamp((t - 3.6) / 0.4), x = 104, y = 154 - 32 - k * 4; px(P.ink, x - 3, y - 1, 6, 8); px(P.white, x - 2, y, 4, 6); px(P.rust, x - 1, y + 3, 1, 1); glow(x, y + 3, 14, 0.5 * k, '230,190,110'); }
      rain(t, 160, P.grey, 200);
      g.fillStyle = 'rgba(20,24,44,0.12)'; g.fillRect(0, 0, W, H);
    },
    mudward(t) {
      // blízký záběr: zatopené dno zákopu, stěny z prken po stranách, v řadě nosítka s raněnými, voda stoupá
      field(0, H, [P.mud0, P.mud1, P.mud2], (x, y) => 0.25 + 0.4 * hash(x >> 1, y >> 2, 94));
      for (let y = 0; y < H; y++) { px(y % 9 === 0 ? P.ink : P.mud2, 0, y, 8, 1); px(y % 9 === 0 ? P.ink : P.mud2, W - 8, y, 8, 1); }
      px(P.ink, 8, 0, 1, H); px(P.ink, W - 9, 0, 1, H);
      const lvl = 0.35 + 0.15 * clamp(t / 4); // voda
      const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const a = hash(xi, yi, 95), b = hash(xi + 1, yi, 95), c = hash(xi, yi + 1, 95), d = hash(xi + 1, yi + 1, 95); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
      for (let y = 0; y < H; y++) for (let x = 9; x < W - 9; x++) { const n = vn(x / 11, y / 6); if (n < lvl) px(n > lvl - 0.04 ? P.steel : P.water, x, y); else if (n < lvl + 0.03 && by(x, y) < 0.5) px(P.mud3, x, y); }
      ripples(0, H, t, 96);
      put(R.stretcherR, 45, 44); put(S.lyE, 45, 40);
      put(R.stretcherR, 45, 82); put(S.lyW, 45, 78);
      put(R.stretcherR, 45, 152); put(S.lyE, 45, 148);
      put(at(S.band, t, 6), 30, 120); put(S.lyW, 52, 120); // medik u raněného přímo v blátě (nosítka došla)
      rain(t, 90, P.grey, 190);
      g.fillStyle = 'rgba(20,24,44,0.2)'; g.fillRect(0, 0, W, H);
    },
    hospital(t) {
      // soumrak; vchod do nového nemocničního krytu: oblouk z pytlů, vlajka s červeným křížem, lucerna; medik nese raněného dovnitř
      field(0, 50, ['#3a3048', P.dusk, P.rust2, P.fire], (x, y) => y / 50);
      field(50, H, [P.mud0, P.mud1, P.mud2], (x, y) => 0.3 + 0.4 * hash(x >> 2, y >> 2, 97));
      // násep krytu
      for (let y = 48; y < 104; y++) for (let x = 0; x < W; x++) { const d = Math.abs(x - 45) / 45 + (y - 48) / 140; if (d < 0.9) px(by(x, y) < 0.5 ? P.mud2 : P.mud3, x, y); }
      // oblouk z pytlů a tmavý vchod
      for (let r = 0; r < 4; r++) for (let x = 22 + r * 3; x < 68 - r * 3; x += 7) { const y = 62 + r * 6; px(P.ink, x - 1, y - 1, 8, 6); px(P.sand, x, y, 6, 4); px(P.bone, x + 1, y, 4, 1); }
      px(P.ink, 34, 80, 22, 26); px(P.dark, 36, 82, 18, 24);
      const fl = 0.85 + 0.15 * Math.sin(t * 9);
      glow(45, 92, 16, 0.6 * fl, '217,143,63'); px(P.gold, 44, 84, 3, 4); px(P.white, 45, 85, 1, 2);
      // vlajka s křížem na tyči (vlaje)
      px(P.ink, 72, 56, 1, 40);
      for (let i = 0; i < 14; i++) { const o = Math.round(Math.sin(t * 5 + i * 0.6) * 1.2 * i / 14); px(P.white, 73 + i, 57 + o, 1, 9); }
      px(P.rust, 78, 59 + Math.round(Math.sin(t * 5 + 3) * 0.6), 2, 6); px(P.rust, 76, 61 + Math.round(Math.sin(t * 5 + 3) * 0.6), 6, 2);
      // řada nosítek venku a medik, který jde se světlem dovnitř
      put(R.stretcherL, 20, 124); put(S.lyL, 20, 120);
      put(R.stretcherL, 70, 126); put(S.lyL, 70, 122, true);
      const k = (t % 4) / 4; put(at(S.medW, t, 8), 82 - k * 28, 112);
    },
    tanks(t) {
      // soumrak za frontou: rozbitá cesta, krátery, holý strom; Behemoth vlevo (k pravé), Tortoise vpravo (zrcadlený, k levé); stráže
      field(0, 70, ['#3a3048', P.dusk, P.fire, P.gold], (x, y) => y / 70);
      glow(68, 70, 30, 0.45, '217,143,63');
      field(70, H, [P.mud0, P.mud1, P.mud2], (x, y) => 0.3 + 0.35 * hash(x >> 2, y >> 2, 98) + (y > 140 && y < 176 ? -0.15 : 0));
      for (let x = 0; x < W; x++) { if (hash(x, 9, 99) < 0.5) px(P.mud3, x, 150); if (hash(x, 10, 99) < 0.5) px(P.mud3, x, 166); } // koleje cesty
      put(R.tree, 122, 96); put(R.crater, 22, 200);
      // tanky stojí, motor běží: lehké chvění o pixel a kouř z výfuku
      const j = Math.round(Math.sin(t * 22)) * (Math.sin(t * 3) > 0 ? 1 : 0);
      put(R.hegSide, 60, 122 + (j > 0 ? -1 : 0));
      put(R.conSide, 82, 176 + (j < 0 ? -1 : 0), true);
      for (const [x, y, s] of [[4, 96, 1], [128, 150, -1]]) for (let k = 0; k < 8; k++) { const p = ((t * 0.6 + k / 8) % 1); px(k % 2 ? P.mud3 : P.sand, x + s * p * 10 + Math.sin(k + t) * 2, y - p * 30); }
      put(S.guardS, 124, 124); put(S.conN, 26, 178);
    },
  };
  return { canvas, draw(name, t, o = {}) { const sz = SIZE[name] || [135, 240]; if (canvas.width !== sz[0]) { canvas.width = sz[0]; canvas.height = sz[1]; } W = sz[0]; H = sz[1]; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.imageSmoothingEnabled = false; scenes[name]?.(Math.max(0, t), o); } };
}
