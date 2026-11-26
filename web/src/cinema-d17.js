// Filmové scény Day reelu Day 17 (26. 11. 2026). Stejné měřítko jako hra (vzor cinema-d14.js): 135×240 (×8) nebo 90×160 (×12),
// sprity a rekvizity ze hry 1:1, terén v kódu paletou Trench-24 s ditheringem, žádná průhlednost postav, vždy jen pár postav a celé vidět.
// Všechny scény nové (marketing/reels/scenes-used.json); příběh Cyrila „Doc“ Zaboravljeniho podle jeho deníku:
//  • signing  – úsvit prvního dne: plakát, stůl s knihou zápisů, fronta mužů, Cyril salutuje, zlatý záblesk knoflíku v kapse
//  • portrait – krytová noc: svíčka na bedně, dopis, do jehož okrajů se po jednom objevují kresby tváří kamarádů
//  • call     – za soumraku u cihelny: komín a trosky, drát, Cyril volá přes zem nikoho, nepřítel odpovídá (hlas důstojníka), kolem se ztiší
//  • duel     – večerní palba: Cyril na pytlích střílí, dva nepřátelé za drátem padají (sprity ze hry: fire, die)
import { off } from './cinema.js';
import { loadImage } from './assets.js';
import propCratesSrc from '../../art/cine/prop_crates.png';

let W = 135, H = 240;
const SIZE = { signing: [90, 160], portrait: [90, 160], call: [135, 240], duel: [135, 240] };
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


export async function makeDay17Scenes(tex = {}, anims = {}) {
  const canvas = off(W, H);
  const g = canvas.getContext('2d');
  g.imageSmoothingEnabled = false;
  const DAWN = 'rgba(120,80,70,0.16)', CAND = 'rgba(120,70,20,0.16)', DUSK = 'rgba(70,50,60,0.2)';
  const A = (k, a, d, tint) => (anims[k]?.[a]?.[d] || []).map((t) => sprite(t, tint));
  const prop = async (src, tint) => tinted(await loadAny(src), tint);
  const S = {
    salute: A('hegemony', 'salute', 'south', DAWN), stand: sprite(tex.hegemony?.south, DAWN), walkE: A('hegemony', 'walk', 'east', DAWN), officer: A('hegemony_officer', 'walk', 'east', DAWN),
    warm: A('hegemony', 'warmhands', 'south', CAND),
    waveH: A('hegemony', 'wave', 'south', DUSK), waveC: A('concord', 'wave', 'north', DUSK), heg: sprite(tex.hegemony?.south, DUSK), con: sprite(tex.concord?.north, DUSK),
    fire: A('hegemony', 'fire', 'south-east', DUSK), kneel: A('hegemony', 'kneel', 'east', DUSK), conW: sprite(tex.concord?.west, DUSK), die: A('concord', 'die', 'west', DUSK),
  };
  const R = {
    wire: await Promise.all([0, 1, 2].map((i) => prop(`/assets/props/wire_intact_${i}.png`, DUSK))),
    broken: await Promise.all([0, 1].map((i) => prop(`/assets/props/wire_broken_${i}.png`, DUSK))),
    crater: await prop('/assets/props/crater_water.png', DUSK), tree: await prop('/assets/props/tree.png', 'rgba(20,16,24,0.5)'),
    crates: await prop(propCratesSrc, CAND),
  };
  const feet = new Map();
  const at = (arr, t, fps) => (arr?.length ? arr[Math.floor(t * fps) % arr.length] : null);
  const once = (arr, t, fps) => (arr?.length ? arr[Math.min(arr.length - 1, Math.floor(t * fps))] : null);
  const put = (c, cx, foot, flip = false) => {
    if (!c) return;
    if (!feet.has(c)) feet.set(c, footOf(c));
    const x = Math.round(cx - c.width / 2), y = Math.round(foot - feet.get(c));
    if (flip) { g.save(); g.translate(x + c.width, y); g.scale(-1, 1); g.drawImage(c, 0, 0); g.restore(); } else g.drawImage(c, x, y);
  };
  const px = (c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  const field = (y0, y1, cols, f) => { for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) { const v = clamp(f(x, y)) * 0.999; const u = v * (cols.length - 1); const i = Math.floor(u); px(u - i > by(x, y) ? cols[Math.min(cols.length - 1, i + 1)] : cols[i], x, y); } };
  const glow = (x, y, r, a, rgb) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
  const bags = (y0, rows, x0 = -8, x1 = W + 8, top = P.bone, side = P.sand) => { for (let r = 0; r < rows; r++) for (let x = x0; x < x1; x += 12) { const ox = x + (r % 2 ? 6 : 0), y = y0 + r * 7; px(P.ink, ox - 1, y - 1, 12, 8); px(side, ox, y, 10, 6); px(top, ox + 1, y, 8, 1); px(P.mud3, ox, y + 5, 10, 1); } };
  const bubble = (x, y, w, text, ink = P.ink) => { // pixelová bublina s krátkým textem (font Silkscreen, 7 px)
    px(P.ink, x - 1, y - 1, w + 2, 12); px(P.white, x, y, w, 10); px(P.ink, x + 6, y + 10, 3, 1); px(P.white, x + 6, y + 10, 2, 1); px(P.white, x + 7, y + 11, 1, 1);
    g.fillStyle = ink; g.font = '7px Silkscreen, monospace'; g.textBaseline = 'top'; g.fillText(text, x + 2, y + 2);
  };

  const scenes = {
    signing(t) {
      // úsvit prvního dne: dřevěná stěna s čerstvým plakátem, stůl s knihou zápisů, důstojník, fronta mužů; Cyril salutuje
      field(0, 70, ['#3a3048', '#7a5560', P.fire, P.gold], (x, y) => y / 70);
      glow(62, 70, 36, 0.5, '230,170,110');
      field(70, H, [P.mud0, P.mud1, P.mud2], (x, y) => 0.3 + 0.35 * hash(x >> 2, y >> 2, 171));
      // dřevěná stěna s plakátem (mokrý papír, červený pruh, silueta vojáka)
      for (let y = 30; y < 84; y++) for (let x = 4; x < W - 4; x++) px(((x + (y >> 3) * 5) % 9 === 0) ? P.ink : (y % 8 === 0 ? P.mud1 : P.mud2), x, y);
      px(P.ink, 4, 29, W - 8, 1); px(P.ink, 4, 84, W - 8, 1);
      px(P.white, 28, 36, 34, 40); px(P.pale, 28, 70, 34, 6); px(P.rust, 28, 36, 34, 7);
      for (let i = 0; i < 4; i++) px(P.rust2, 32 + i * 7, 38, 4, 3);
      px(P.mud2, 40, 49, 10, 10); px(P.mud3, 42, 51, 6, 6); px(P.steel, 41, 46, 8, 4); px(P.mud2, 36, 59, 18, 11); // silueta vojáka s helmou
      for (let y = 62; y < 69; y += 3) px(P.mud3, 32, y + 6, 26, 1);
      if (hash(Math.floor(t * 3), 1, 172) < 0.5) px(P.water, 31 + Math.floor(t * 4) % 24, 77, 1, 3); // kapka z mokrého plakátu
      // stůl s knihou zápisů
      px(P.ink, 58, 112, 30, 3); px(P.mud3, 58, 113, 30, 14); px(P.mud1, 58, 125, 30, 2); px(P.ink, 59, 126, 2, 14); px(P.ink, 85, 126, 2, 14);
      px(P.white, 66, 108, 14, 6); px(P.pale, 66, 108, 14, 1); px(P.ink, 73, 108, 1, 6);
      put(at(S.officer, t, 1) ? S.officer[0] : S.stand, 74, 108); // důstojník píše (stojí u stolu)
      // fronta mužů jde k stolu, Cyril stojí přímo před stolem a salutuje
      for (let i = 0; i < 3; i++) { const x0 = -10 - i * 14, x = Math.min(14 + i * -0, x0 + t * 7 + 38); put(i === 0 && t > 4 ? S.walkE[0] : at(S.walkE, t + i, 6), Math.round(Math.min(x, 12 - i * 14 + 20)), 150 - i * 3); }
      put(S.salute.length ? at(S.salute, t, 7) : S.stand, 46, 148);
      // zlatý záblesk knoflíku v kapse
      if (t > 1.8) { const k = (Math.sin(t * 6) + 1) / 2; px(P.gold, 44, 128, 1, 1); glow(44, 128, 6, 0.25 + 0.4 * k, '240,200,110'); }
      g.fillStyle = 'rgba(100,60,50,0.08)'; g.fillRect(0, 0, W, H);
    },
    portrait(t) {
      // kryt, noc: dřevěné stěny, bedna jako stůl, svíčka, dopis; do okrajů dopisu se po jedné objevují kresby tváří; Cyril u svíčky
      field(0, H, [P.ink, P.dark, P.mud0], (x, y) => 0.15 + 0.3 * hash(x >> 2, y >> 2, 173));
      for (let y = 0; y < H; y += 14) { px(P.mud1, 0, y, W, 1); px(P.ink, 0, y + 1, W, 1); }
      for (let x = 6; x < W; x += 22) { px(P.ink, x, 0, 3, H); px(P.mud2, x, 0, 1, H); }
      const fl = 0.8 + 0.2 * Math.sin(t * 9) * Math.sin(t * 3.7);
      glow(50, 110, 52, 0.55 * fl, '217,143,63'); glow(50, 110, 22, 0.4 * fl, '255,210,140');
      // bedna a dopis
      put(R.crates, 50, 128); px(P.mud3, 20, 118, 60, 4); px(P.ink, 20, 122, 60, 1);
      px(P.ink, 27, 98, 44, 21); px(P.white, 28, 99, 42, 19); px(P.pale, 28, 116, 42, 2);
      for (let y = 102; y < 114; y += 3) px(P.sand, 34, y, 22 + (y % 6), 1); // text dopisu
      // kresby tváří v okrajích (4 muži, postupně)
      const faces = [[30, 100], [60, 100], [30, 109], [61, 109]];
      faces.forEach(([x, y], i) => { const k = clamp((t - 0.6 - i * 1.2) / 0.8); if (k <= 0) return; const rows = Math.ceil(k * 5); for (let r = 0; r < rows; r++) px(P.dark, x + (r === 0 || r === 4 ? 1 : 0), y + r, r === 0 || r === 4 ? 3 : 5, 1); if (k > 0.7) { px(P.pale, x + 1, y + 1, 1, 1); px(P.pale, x + 3, y + 1, 1, 1); px(P.rust, x + 2, y + 3, 1, 1); } });
      // tužka, která kreslí poslední tvář
      const pk = clamp((t - 0.6) / 4.8); px(P.gold, 64 - pk * 6, 107 + (Math.floor(t * 8) % 2), 5, 1); px(P.ink, 69 - pk * 6, 107 + (Math.floor(t * 8) % 2), 1, 1);
      // svíčka
      px(P.white, 78, 110, 3, 9); px(P.ink, 77, 119, 5, 1); px(P.gold, 79, 108 - (fl > 0.9 ? 1 : 0), 1, 2); px(P.white, 79, 108, 1, 1);
      // Cyril drží ruce u plamene
      put(at(S.warm, t, 7), 16, 150);
      g.fillStyle = 'rgba(10,8,20,0.25)'; g.fillRect(0, 0, W, 60);
    },
    call(t) {
      // soumrak: ruiny cihelny s komínem, drát, země nikoho; dole Cyril, nahoře nepřítel; střídavě volají a po obou stranách se ztiší
      field(0, 90, ['#3a3048', P.dusk, P.rust2, P.fire], (x, y) => y / 90);
      glow(30, 88, 40, 0.4, '217,143,63');
      // komín a zdi cihelny
      for (let y = 24; y < 96; y++) for (let x = 104; x < 114; x++) px(((x + (y >> 2) * 3) % 5 === 0 || y % 4 === 0) ? P.rust2 : P.rust, x, y);
      px(P.ink, 103, 24, 1, 72); px(P.ink, 114, 24, 1, 72); px(P.ink, 103, 23, 12, 1);
      for (let x = 60; x < 100; x += 1) { const h = 12 + Math.floor(hash(x >> 2, 3, 174) * 14); for (let y = 96 - h; y < 96; y++) px(((x + (y >> 2) * 3) % 5 === 0 || y % 4 === 0) ? P.rust2 : P.rust, x, y); }
      field(96, H, [P.mud0, P.mud1, P.mud2], (x, y) => 0.3 + 0.35 * hash(x >> 2, y >> 2, 175) + (y > 120 && y < 150 ? -0.1 : 0));
      put(R.crater, 22, 150); put(R.tree, 124, 140);
      for (const [x, y, i] of [[20, 126, 0], [64, 130, 1], [108, 126, 2], [44, 132, 1], [88, 132, 0]]) put(R.wire[i], x, y);
      bags(72, 1, -8, 56); bags(72, 1, 80, W + 8); // zákop nepřítele nahoře (val)
      bags(206, 2, -8, W + 8); // náš val dole
      // volání: Cyril (dole, mává), nepřítel nahoře odpovídá; bubliny střídavě
      const cy = Math.floor(t / 2.2) % 2;
      put(at(S.waveH, t, 8), 42, 206);
      put(at(S.waveC, t, 8), 94, 84);
      if (t > 0.6 && cy === 0) bubble(48, 168, 46, 'HEY YOU!');
      if (t > 2.8 && cy === 1) bubble(74, 50, 56, 'ATTENTION!', P.rust);
      if (t > 5) for (const [x, y, s] of [[18, 214, S.heg], [66, 214, S.heg], [28, 74, S.con], [118, 74, S.con]]) put(s, x, y); // všichni vykukují a poslouchají
      if (t > 5.4) bubble(42, 158, 50, 'THE QUIET', P.dark);
      g.fillStyle = 'rgba(40,30,60,0.1)'; g.fillRect(0, 0, W, H);
    },
    duel(t) {
      // večer, pytle vlevo dole, Cyril střílí směrem doprava dolů; dva nepřátelé za drátem padají jeden po druhém
      field(0, 60, ['#3a3048', P.dusk, P.rust2], (x, y) => y / 60);
      field(60, H, [P.mud0, P.mud1, P.mud2], (x, y) => 0.3 + 0.38 * hash(x >> 2, y >> 2, 176));
      const f = Math.sin(t * 21) > 0.2 && t % 1.5 < 0.5 ? 1 : 0;
      for (let x = 0; x < W; x++) { if (hash(x, 4, 177) < 0.5) px(P.mud3, x, 150); }
      put(R.wire[0], 74, 148); put(R.wire[1], 112, 150); put(R.wire[2], 96, 168); put(R.broken[0], 124, 190);
      put(R.crater, 20, 214);
      bags(116, 3, -8, 58);
      // dva nepřátelé: první padne po první dávce (≈1,2 s), druhý po druhé (≈3,2 s)
      const e1 = t < 1.2 ? S.conW : once(S.die, t - 1.2, 9), e2 = t < 3.2 ? S.conW : once(S.die, t - 3.2, 9);
      put(e1, 96, 128); put(e2, 120, 188);
      // Cyril: palba (animace fire), záblesky a stopovka k cíli
      put(at(S.fire, t, 8), 40, 146);
      const shot = (t0, tx, ty) => { const k = t - t0; if (k < 0 || k > 0.5) return; const a = clamp(1 - k * 4); glow(54, 138, 10, 0.8 * a, '255,230,170'); const m = clamp(k * 5); px(P.gold, 54 + (tx - 54) * m, 138 + (ty - 138) * m, 3, 1); };
      for (const [t0, tx, ty] of [[0.5, 96, 118], [0.9, 96, 118], [2.5, 120, 178], [2.9, 120, 178]]) shot(t0, tx, ty);
      // světlice nad zemí nikoho
      const u = (t % 4) / 4; glow(70 + u * 40, 24 + u * 12, 40, 0.35 * Math.sin(u * Math.PI), '220,230,255');
      if (t > 1.2 && t < 1.6) glow(96, 122, 16, 0.5 * (1.6 - t) / 0.4, '220,40,40');
      if (t > 3.2 && t < 3.6) glow(120, 182, 16, 0.5 * (3.6 - t) / 0.4, '220,40,40');
      g.fillStyle = 'rgba(40,30,60,0.12)'; g.fillRect(0, 0, W, H);
    },
  };
  return { canvas, draw(name, t, o = {}) { const sz = SIZE[name] || [135, 240]; if (canvas.width !== sz[0]) { canvas.width = sz[0]; canvas.height = sz[1]; } W = sz[0]; H = sz[1]; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.imageSmoothingEnabled = false; scenes[name]?.(Math.max(0, t), o); } };
}
