// Filmové záběry k reelu „závod o kótu“ (den 3): posily, děla na výšině, bezpečný kryt, stužka a hrdina, počítadlo hráčů.
// Každý záběr je samostatný (kreslí se v mřížce 180×320 paletou hry, dithering Bayer 4×4, skutečné sprity vojáků ze hry),
// takže jde použít v jakémkoli reelu: const c = makeRaceScenes(tex, anims); root.prepend(c.canvas); c.draw('march', t, { side: 1 }).
// t = sekundy od začátku záběru; volby: side (0 Hegemonie, 1 Concord), n (číslo na počítadle; bez něj se ukáže „XXX“).
import { sky, glow, lit, blast, stakeWire, shakeOf, easeOut, off, hex, rgb, by, clamp01, CW as W, CH as H } from './cinema.js';

export const RACE_SCENES = { march: 7, guns: 7, shelter: 7, ribbon: 7, counter: 6 };

// pixelové písmo 3×5 (písmena, číslice, +), ať záběr nezávisí na fontech
const FONT = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100',
  G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
  M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101',
  S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
  Y: '101101010010010', Z: '111001010100111', 0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
  4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001110',
  '+': '000010111010000', ' ': '000000000000000',
};
const FONT5 = { M: '1000111011101011000110001', W: '1000110001101011101110001' }; // široké M a W (5×5), ve 3 sloupcích by splynuly s H a N
const cols = (ch) => (FONT5[ch] ? 5 : 3);
export function txt(g, s, x, y, k, col, shadow = null) {
  let cx = x;
  for (const ch of String(s)) {
    const wide = !!FONT5[ch], bits = FONT5[ch] || FONT[ch] || FONT[' '], c = wide ? 5 : 3;
    const rows = wide ? 5 : 5;
    if (shadow) {
      g.fillStyle = shadow;
      for (let i = 0; i < c * rows; i++) if (bits[i] === '1') g.fillRect(cx + (i % c) * k + Math.max(1, k >> 2), y + Math.floor(i / c) * k + Math.max(1, k >> 2), k, k);
    }
    g.fillStyle = col;
    for (let i = 0; i < c * rows; i++) if (bits[i] === '1') g.fillRect(cx + (i % c) * k, y + Math.floor(i / c) * k, k, k);
    cx += (c + 1) * k;
  }
  return cx - k; // pravý okraj
}
const txtW = (s, k) => [...String(s)].reduce((a, ch) => a + (cols(ch) + 1) * k, 0) - k;

const P = {
  ink: '#0e0d0c', dark: '#1c1a17', mud0: '#2b2722', mud1: '#3d3730', mud2: '#524a3f', mud3: '#6b6152', sand: '#857a68', bone: '#a39782', pale: '#c4b8a0',
  white: '#e3d9c3', grey: '#8a9295', steel: '#666d70', khaki: '#8c8a5c', olive: '#6f7148', olive2: '#52543a', olive3: '#3f4230', rust: '#7e3b2a',
  blood: '#5c2a22', fire: '#a85a36', gold: '#d98f3f', yellow: '#c9c26a', water: '#2a3138',
};
const rng = (seed) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };
const frac = (x) => x - Math.floor(x);

export function makeRaceScenes(tex, anims = {}) {
  const canvas = off(W, H);
  canvas.id = 'rd-race';
  const g = canvas.getContext('2d');
  const cache = new Map();

  // --- sprity ze hry (barevně, volitelně nasvícené) ---
  const tintOf = (tx, tint, flip) => {
    if (!tx?.source?.resource) return null;
    const k = `${tint || ''}|${flip ? 1 : 0}`;
    let m = cache.get(tx);
    if (!m) cache.set(tx, (m = new Map()));
    if (!m.has(k)) m.set(k, lit(tx, tint, flip));
    return m.get(k);
  };
  const pose = (key, anim, dir, t, fps = 8) => {
    const fr = anims[key]?.[anim]?.[dir];
    if (fr?.length) return fr[Math.floor(Math.max(0, t) * fps) % fr.length];
    return tex[key]?.[dir] ?? tex[key]?.south ?? null;
  };
  // pata na (cx, foot), s = násobek (sprite 32×32, postava ~30 px, chodidla na řádku 30)
  const put = (tx, cx, foot, s, tint = null, flip = false) => {
    const c = tintOf(tx, tint, flip);
    if (!c) return;
    const w = Math.round(32 * s);
    g.drawImage(c, Math.round(cx - w / 2), Math.round(foot - 30 * s), w, w);
  };
  const SIDE = [{ base: 'hegemony', col: P.steel, hi: P.grey, band: P.rust }, { base: 'concord', col: P.olive, hi: P.khaki, band: P.gold }];
  const key = (side, role) => (role ? `${SIDE[side].base}_${role}` : SIDE[side].base);

  // --- pomocné kresby ---
  const hill = (cg, cx, top, base, half, col, shade, seed = 1) => { // kopec (Gauss) s dithered stínem na pravé straně
    const r = rng(seed);
    for (let x = Math.max(0, cx - half * 2.2); x < Math.min(W, cx + half * 2.2); x++) {
      const u = (x - cx) / half, y = Math.round(base - (base - top) * Math.exp(-u * u) + Math.sin(x * 0.31) * 0.8);
      for (let yy = y; yy < base + 4; yy++) {
        const lit_ = u < 0.15 || (u < 0.6 && by(x, yy) < 0.5 - u * 0.5);
        cg.fillStyle = lit_ ? col : shade;
        cg.fillRect(x, yy, 1, 1);
      }
      if (r() < 0.07) { cg.fillStyle = P.mud3; cg.fillRect(x, y + 3 + Math.floor(r() * 8), 2, 1); }
    }
  };
  const fir = (cg, x, y, h, dark = P.olive3, hi = P.olive2) => { // smrk
    for (let i = 0; i < h; i++) {
      const w = Math.max(1, Math.round((i / h) * h * 0.42));
      cg.fillStyle = i % 3 === 0 ? hi : dark;
      cg.fillRect(Math.round(x - w / 2), y - h + i, w, 1);
    }
    cg.fillStyle = P.ink; cg.fillRect(x, y, 1, 2);
  };
  const flag = (x, y, w, h, t, col, dark, mark = null, wave = 1) => { // vlající prapor: sloupce se zvlněním
    for (let i = 0; i < w; i++) {
      const o = Math.round(Math.sin(t * 3.2 + i * 0.16) * 2.4 * (i / w) * wave);
      const sh = Math.cos(t * 3.2 + i * 0.16) > 0.3 ? dark : col;
      g.fillStyle = sh; g.fillRect(x + i, y + o, 1, h);
      g.fillStyle = P.ink; g.fillRect(x + i, y + o, 1, 1); g.fillRect(x + i, y + o + h - 1, 1, 1);
    }
    if (mark) mark(x, y, w, h, Math.round(Math.sin(t * 3.2 + (w / 2) * 0.16) * 2.4 * 0.5 * wave));
  };
  const star = (x, y, c) => { g.fillStyle = c; g.fillRect(x, y - 3, 1, 7); g.fillRect(x - 3, y, 7, 1); g.fillRect(x - 2, y - 2, 5, 5); g.fillRect(x - 1, y - 3, 3, 7); };
  const cloudy = (cg, y0, y1, stops) => sky(cg, y0, y1, stops);
  const ribbonAt = (x, y, sp = 0) => { // stužka s hvězdou na hrudi
    g.fillStyle = P.rust; g.fillRect(x - 1, y, 3, 5);
    g.fillStyle = P.white; g.fillRect(x, y, 1, 5);
    g.fillStyle = P.ink; g.fillRect(x - 2, y, 1, 5); g.fillRect(x + 2, y, 1, 5);
    g.fillStyle = P.gold; g.fillRect(x - 1, y + 5, 3, 3); g.fillRect(x, y + 4, 1, 5);
    if (sp > 0) { g.fillStyle = P.white; g.fillRect(x - 4 - sp * 3, y + 2, 2, 1); g.fillRect(x + 3 + sp * 3, y + 3, 2, 1); g.fillRect(x, y - 3 - sp * 3, 1, 2); }
  };
  const sandbags = (cg, x0, y0, x1, y1, a = P.bone, b = P.sand, joint = P.mud2) => { // pytle: kulaté, různě velké, světlo shora (jako ve hře)
    cg.fillStyle = joint; cg.fillRect(x0, y0, x1 - x0, y1 - y0);
    const r = rng(77);
    let row = 0;
    for (let y = y0 - 5; y < y1; y += 8, row++) for (let x = x0 - 14 + (row % 2) * 11 - Math.floor(r() * 3); x < x1 + 14; x += 21 + Math.floor(r() * 4)) {
      const w = 22 + Math.floor(r() * 3), h = 10 + Math.floor(r() * 2), shade = r();
      cg.fillStyle = joint; cg.beginPath(); cg.ellipse(x + w / 2, y + h / 2 + 1, w / 2 + 0.5, h / 2 + 0.5, 0, 0, Math.PI * 2); cg.fill();
      cg.fillStyle = shade < 0.5 ? a : b; cg.beginPath(); cg.ellipse(x + w / 2, y + h / 2, w / 2 - 0.5, h / 2 - 0.5, 0, 0, Math.PI * 2); cg.fill();
      cg.fillStyle = P.white; cg.beginPath(); cg.ellipse(x + w / 2 - 1, y + 2.5, w / 2 - 4, 1.4, 0, 0, Math.PI * 2); cg.fill();
      cg.fillStyle = joint; cg.fillRect(Math.round(x + w / 2 + 3), y + 4, 1, 4); cg.fillRect(Math.round(x + w / 2 - 6), y + 5, 3, 1); // švy
    }
    cg.fillStyle = P.ink; cg.fillRect(x0, y0 - 2, x1 - x0, 1);
  };
  const smoke = (cx, base, t, n = 7, col = 'rgba(42,49,56,0.8)', rise = 20) => { // sloup kouře
    for (let i = 0; i < n; i++) {
      const a = frac(t * 0.25 + i / n);
      g.fillStyle = col.replace(/[\d.]+\)$/, `${(0.85 * (1 - a)).toFixed(2)})`);
      g.beginPath(); g.ellipse(cx + Math.sin(i * 2.3 + t) * 3 * a + a * 6, base - a * rise * 3.2, 3 + a * 8, 3 + a * 7, 0, 0, Math.PI * 2); g.fill();
    }
  };

  const L = {};
  const scene = {};

  // ====================================================================================================
  // 1) POSILY: kolona nových vojáků míří na Verdel Ridge, nad kolonou prapor +100, počítadlo roste do 100
  // ====================================================================================================
  {
    const c = off(W, H), cg = c.getContext('2d');
    cloudy(cg, 0, 190, [P.water, '#3a4048', P.steel, P.grey, P.bone, '#c9a67a']);
    for (let k = 0; k < 7; k++) { // mraky: dithered pruhy
      cg.fillStyle = k % 2 ? 'rgba(42,49,56,0.55)' : 'rgba(102,109,112,0.5)';
      cg.fillRect(Math.round(k * 31 - 20), 30 + k * 17, 70, 6);
    }
    // vzdálené hřbety
    for (const [base, col, amp, ph] of [[158, '#4a4f52', 13, 0.8], [168, '#3a4048', 9, 2.1]]) {
      for (let x = 0; x < W; x++) { cg.fillStyle = col; cg.fillRect(x, Math.round(base - amp * (0.5 + 0.5 * Math.sin(x * 0.045 + ph)) - amp * 0.4 * Math.sin(x * 0.13)), 1, 40); }
    }
    hill(cg, 96, 116, 178, 46, P.olive, P.olive3, 5);
    const r = rng(9);
    for (let i = 0; i < 46; i++) { const x = 96 + (r() - 0.5) * 110, u = (x - 96) / 46, y = 178 - 62 * Math.exp(-u * u) + 4 + r() * 12; fir(cg, Math.round(x), Math.round(y), 5 + Math.round(r() * 6)); }
    // bunker na vrcholu
    cg.fillStyle = P.mud2; cg.fillRect(88, 108, 17, 8); cg.fillStyle = P.mud3; cg.fillRect(88, 108, 17, 1);
    cg.fillStyle = P.ink; cg.fillRect(91, 111, 5, 2); cg.fillRect(98, 111, 4, 2);
    cg.fillStyle = P.mud1; cg.fillRect(87, 107, 19, 2);
    // louka
    for (let y = 176; y < H; y++) for (let x = 0; x < W; x++) {
      const dd = (y - 176) / 144;
      cg.fillStyle = by(x, y) < 0.5 - dd * 0.4 ? P.olive : P.olive2;
      cg.fillRect(x, y, 1, 1);
    }
    for (let i = 0; i < 160; i++) { cg.fillStyle = r() < 0.5 ? P.khaki : P.olive3; cg.fillRect(Math.floor(r() * W), 180 + Math.floor(r() * 140), 1 + (r() < 0.3 ? 1 : 0), 1); }
    // cesta: lichoběžník k patě kopce, kolejnice, okraje
    for (let y = 178; y < H; y++) {
      const d = (y - 178) / 142, half = 3 + d * 64, cx = 96 - d * 6;
      cg.fillStyle = by(Math.round(cx), y) < 0.5 ? P.sand : P.bone;
      cg.fillRect(Math.round(cx - half), y, Math.round(half * 2), 1);
      cg.fillStyle = P.mud2; cg.fillRect(Math.round(cx - half), y, 1, 1); cg.fillRect(Math.round(cx + half), y, 1, 1);
      cg.fillStyle = P.mud3; cg.fillRect(Math.round(cx - half * 0.45), y, 1, 1); cg.fillRect(Math.round(cx + half * 0.45), y, 1, 1);
    }
    // protitankové ježky a drát u cesty
    for (const [x, y, s] of [[22, 214, 1], [152, 222, 1.2], [36, 262, 1.7], [168, 270, 1.9]]) {
      cg.strokeStyle = P.ink; cg.lineWidth = Math.max(1, s);
      cg.beginPath(); cg.moveTo(x - 5 * s, y); cg.lineTo(x + 5 * s, y - 10 * s); cg.moveTo(x - 5 * s, y - 10 * s); cg.lineTo(x + 5 * s, y); cg.stroke();
    }
    stakeWire(cg, 0, 52, 238, 12, 17, P.ink, null);
    stakeWire(cg, 138, 190, 246, 12, 17, P.ink, null);
    L.march = c;
  }
  const truckAt = (x, foot, s) => { // nákladní vůz zezadu-zboku (jede od kamery)
    const w = 40 * s, h = 26 * s;
    g.fillStyle = P.ink; g.fillRect(Math.round(x - w / 2 - s), Math.round(foot - h - s), Math.round(w + 2 * s), Math.round(h + 2 * s));
    g.fillStyle = P.olive2; g.fillRect(Math.round(x - w / 2), Math.round(foot - h), Math.round(w), Math.round(h));
    g.fillStyle = P.khaki; g.fillRect(Math.round(x - w / 2), Math.round(foot - h), Math.round(w), Math.round(5 * s)); // plachta
    g.fillStyle = P.olive; g.fillRect(Math.round(x - w / 2 + 2 * s), Math.round(foot - h + 6 * s), Math.round(w - 4 * s), Math.round(12 * s));
    g.fillStyle = P.rust; g.fillRect(Math.round(x - 3 * s), Math.round(foot - h + 8 * s), Math.round(6 * s), Math.round(6 * s)); // značka
    g.fillStyle = P.ink; g.fillRect(Math.round(x - w / 2), Math.round(foot - 4 * s), Math.round(7 * s), Math.round(5 * s)); g.fillRect(Math.round(x + w / 2 - 7 * s), Math.round(foot - 4 * s), Math.round(7 * s), Math.round(5 * s));
  };
  scene.march = (t, o) => {
    const side = o.side ?? 1, k = key(side), sw = Math.sin(t * 0.5) * 2;
    g.drawImage(L.march, Math.round(sw * 0.3), 0);
    // vlajka na bunkru
    flag(96 + Math.round(sw * 0.3), 96, 9, 6, t, SIDE[side].band === P.gold ? P.olive : P.steel, SIDE[side].band === P.gold ? P.olive3 : P.mud2, null, 0.6);
    g.fillStyle = P.ink; g.fillRect(96 + Math.round(sw * 0.3), 94, 1, 14);
    // kolona (hloubka d: 0 u paty kopce … 1 u kamery); jdou zády k nám
    const N = 20, list = [];
    for (let i = 0; i < N; i++) {
      const lane = [-0.7, -0.25, 0.25, 0.7][i % 4] + ((i * 37) % 7 - 3) * 0.02, d = 0.04 + 0.86 * frac(1 - i / N - t * 0.1 + 0.3 + (i % 4) * 0.011);
      list.push({ i, lane, d });
    }
    list.sort((a, b) => a.d - b.d);
    for (const e of list) {
      const d = e.d, y = 178 + Math.pow(d, 1.15) * 150, half = 3 + d * 64, cx = 96 - d * 6 + e.lane * half, s = 0.3 + d * 1.5;
      if (y < 182 || y > H + 60) continue;
      const bob = Math.abs(Math.sin(t * 7 + e.i)) * s * 0.4;
      const tint = d < 0.25 ? 'rgba(82,84,58,0.35)' : null; // vzdálené vojáky zalévá mlha
      put(pose(k + (e.i % 7 === 3 ? '_machinegunner' : e.i % 9 === 4 ? '_medic' : ''), 'walk', 'north', t + e.i * 0.13, 7) || pose(k, 'walk', 'north', t, 7), cx, y - bob, s, tint);
      if (d > 0.3) { g.fillStyle = 'rgba(163,151,130,0.28)'; g.fillRect(Math.round(cx - s * 7), Math.round(y - 1), Math.round(s * 14), 2); } // prach pod botami
    }
    // prach nad cestou a dým z boje za kopcem
    for (let i = 0; i < 12; i++) { const a = frac(t * 0.35 + i / 12); g.fillStyle = `rgba(196,184,160,${(0.2 * (1 - a)).toFixed(2)})`; g.beginPath(); g.ellipse(70 + (i * 17) % 60 + a * 8, 270 - a * 70, 6 + a * 12, 3 + a * 6, 0, 0, Math.PI * 2); g.fill(); }
    smoke(34, 170, t, 7, 'rgba(42,49,56,0.8)', 16);
    smoke(168, 168, t + 1.3, 7, 'rgba(58,64,72,0.75)', 14);
    // prapor +100 na žerdi v popředí
    const px = 20;
    g.fillStyle = P.ink; g.fillRect(px, 120, 3, 200); g.fillStyle = P.mud3; g.fillRect(px + 1, 120, 1, 200);
    g.fillStyle = P.gold; g.fillRect(px - 1, 117, 5, 4);
    flag(px + 3, 126, 62, 34, t, P.olive, P.olive3, (x, y, w, h, off2) => {
      txt(g, '+100', x + 7, y + 13 + off2, 3, P.white, P.olive3);
      g.fillStyle = P.gold; for (let i = 0; i < 5; i++) { g.fillRect(x + 4, y + 4 + i * 5 + off2, 2, 3); g.fillRect(x + w - 6, y + 4 + i * 5 + off2, 2, 3); }
    });
    // počítadlo
    const n = Math.round(100 * easeOut(clamp01((t - 0.4) / 4.2)));
    const bx = 104, by_ = 266;
    g.fillStyle = P.ink; g.fillRect(bx - 2, by_ - 2, 76, 40);
    g.fillStyle = P.sand; g.fillRect(bx - 1, by_ - 1, 74, 38);
    g.fillStyle = P.dark; g.fillRect(bx, by_, 72, 36);
    const num = String(n).padStart(3, '0'), pulse = n >= 100 && Math.floor(t * 4) % 2 === 0;
    txt(g, num, bx + 10, by_ + 5, 5, pulse ? P.yellow : P.white, P.ink);
    txt(g, 'NEW SOLDIERS', bx + 7, by_ + 28, 1, P.bone);
    if (n >= 100) glow(g, bx + 36, by_ + 18, 50, P.gold, 0.45 + 0.2 * Math.sin(t * 8));
  };

  // ====================================================================================================
  // 2) VYSOKÁ POZICE: děla na výšině ostřelují nepřítele v údolí
  // ====================================================================================================
  {
    const c = off(W, H), cg = c.getContext('2d');
    cloudy(cg, 0, 215, ['#1f2430', '#3a3b44', '#5a4b4a', '#8a5a4c', '#c4784a', '#d98f3f']);
    for (let k = 0; k < 6; k++) { cg.fillStyle = k % 2 ? 'rgba(31,36,48,0.7)' : 'rgba(58,59,68,0.6)'; cg.fillRect(Math.round(k * 37 - 20), 20 + k * 22, 84, 7); }
    // údolí: hřbety v mlze a nepřátelské linie (vpravo dole)
    for (const [base, col, amp, ph] of [[170, '#4a3f3a', 16, 1.4], [188, '#3a302d', 12, 0.2], [206, '#2b2420', 8, 2.7]]) {
      for (let x = 0; x < W; x++) { cg.fillStyle = col; cg.fillRect(x, Math.round(base - amp * (0.5 + 0.5 * Math.sin(x * 0.04 + ph)) - amp * 0.3 * Math.sin(x * 0.17)), 1, 90); }
    }
    cg.fillStyle = '#1c1a17'; // nepřátelské zákopy
    for (const [y, x0, x1] of [[214, 70, 180], [224, 56, 180], [236, 92, 180]]) { for (let x = x0; x < x1; x++) cg.fillRect(x, y + Math.round(Math.sin(x * 0.4)), 1, 3); }
    for (const [x, y] of [[150, 208], [118, 214], [168, 220]]) { cg.fillStyle = P.mud1; cg.fillRect(x, y - 7, 14, 7); cg.fillStyle = P.mud2; cg.beginPath(); cg.moveTo(x - 1, y - 7); cg.lineTo(x + 7, y - 12); cg.lineTo(x + 15, y - 7); cg.fill(); }
    // výšina vlevo dole: skála a tráva
    for (let x = 0; x < W; x++) {
      const top = Math.round(252 - Math.max(0, 70 - x * 0.55) + Math.sin(x * 0.2) * 1.5);
      for (let y = top; y < H; y++) {
        const rocky = by(x, y) < 0.35 + (y - top) / 120;
        cg.fillStyle = y < top + 4 ? P.olive : rocky ? P.mud3 : P.mud2;
        cg.fillRect(x, y, 1, 1);
      }
    }
    const r = rng(17);
    for (let i = 0; i < 90; i++) { cg.fillStyle = r() < 0.5 ? P.sand : P.mud1; cg.fillRect(Math.floor(r() * 120), 258 + Math.floor(r() * 60), 2, 1); }
    L.guns = c;
  }
  const howitzer = (x, y, s, rec, ang = -0.5) => {
    g.save();
    // lafetové nohy a kolo
    g.strokeStyle = P.ink; g.lineWidth = Math.max(2, 3 * s);
    g.beginPath(); g.moveTo(x - 4 * s, y - 10 * s); g.lineTo(x - 26 * s, y + 1 * s); g.stroke();
    g.strokeStyle = P.mud2; g.lineWidth = Math.max(1, 1.5 * s);
    g.beginPath(); g.moveTo(x - 4 * s, y - 10 * s); g.lineTo(x - 26 * s, y + 1 * s); g.stroke();
    g.fillStyle = P.ink; g.beginPath(); g.arc(x, y - 9 * s, 10 * s, 0, Math.PI * 2); g.fill();
    g.fillStyle = P.mud1; g.beginPath(); g.arc(x, y - 9 * s, 8.4 * s, 0, Math.PI * 2); g.fill();
    g.strokeStyle = P.mud3; g.lineWidth = 1;
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.beginPath(); g.moveTo(x, y - 9 * s); g.lineTo(x + Math.cos(a) * 8 * s, y - 9 * s + Math.sin(a) * 8 * s); g.stroke(); }
    g.fillStyle = P.mud2; g.beginPath(); g.arc(x, y - 9 * s, 2.2 * s, 0, Math.PI * 2); g.fill();
    // hlaveň (odskok při výstřelu)
    g.translate(x + 2 * s, y - 17 * s); g.rotate(ang);
    g.fillStyle = P.ink; g.fillRect(-9 * s - rec, -3.6 * s, 42 * s, 7.2 * s);
    g.fillStyle = P.olive2; g.fillRect(-8 * s - rec, -2.8 * s, 40 * s, 5.6 * s);
    g.fillStyle = P.olive; g.fillRect(-8 * s - rec, -2.8 * s, 40 * s, 1.6 * s);
    g.fillStyle = P.ink; g.fillRect(30 * s - rec, -4.4 * s, 4 * s, 8.8 * s); // úsťová brzda
    g.fillStyle = P.mud1; g.fillRect(-5 * s - rec * 0.4, 2.4 * s, 18 * s, 3 * s); // recoil válec
    g.restore();
    g.fillStyle = P.ink; g.fillRect(Math.round(x - 6 * s), Math.round(y - 27 * s), Math.round(12 * s), Math.round(16 * s)); // štít
    g.fillStyle = P.olive2; g.fillRect(Math.round(x - 5 * s), Math.round(y - 26 * s), Math.round(10 * s), Math.round(14 * s));
    g.fillStyle = P.olive; g.fillRect(Math.round(x - 5 * s), Math.round(y - 26 * s), Math.round(10 * s), Math.round(2 * s));
  };
  const SHOTS = [[0.7, 0], [1.7, 1], [2.7, 0], [3.5, 1], [4.4, 0], [5.3, 1]];
  const TGT = [[150, 206], [122, 214], [166, 220], [138, 230], [100, 224], [172, 208]];
  scene.guns = (t, o) => {
    const side = o.side ?? 1, k = key(side);
    let sh = 0;
    for (const [t0] of SHOTS) { const v = shakeOf(t - t0, 0.7); if (Math.abs(v) > Math.abs(sh)) sh = v; }
    TGT.forEach((_, i) => { const v = shakeOf(t - (SHOTS[i][0] + 1.25), 0.35); if (Math.abs(v) > Math.abs(sh)) sh = v; });
    g.setTransform(1, 0, 0, 1, sh, Math.round(sh * 0.5));
    g.drawImage(L.guns, -4, -4, W + 8, H + 8);
    // výbuchy v údolí (kouř se drží)
    TGT.forEach(([x, y], i) => blast(g, x, y, t - (SHOTS[i][0] + 1.25), 0.62 + (i % 3) * 0.12, ['#7e3b2a', '#3a2a26', '#2b2420', '#3a3b44'], 6));
    // dvě děla: dál menší, blíž velké
    const rec = (i) => { const u = t - SHOTS[i][0]; return u > 0 && u < 0.6 ? 7 * Math.exp(-u * 7) : 0; };
    const gun = (gi, gx, gy, gs) => {
      const rcl = SHOTS.reduce((m, [t0, who], idx) => (who === gi ? Math.max(m, rec(idx)) : m), 0);
      howitzer(gx, gy, gs, rcl * gs * 0.5);
      for (const [t0, who] of SHOTS) if (who === gi) {
        const u = t - t0;
        const mx = gx + 2 * gs + Math.cos(-0.5) * 32 * gs, my = gy - 17 * gs + Math.sin(-0.5) * 32 * gs;
        if (u > 0 && u < 0.5) { glow(g, mx, my, 26 * gs, '#d98f3f', 1.4 * (1 - u / 0.5)); glow(g, mx, my, 12 * gs, '#fff6dc', 1.5 * clamp01(1 - u / 0.2)); }
        if (u > 0.05 && u < 2.6) for (let i = 0; i < 7; i++) { const a = u - 0.05 - i * 0.06; if (a > 0) { g.fillStyle = `rgba(${i % 2 ? '120,108,98' : '86,76,70'},${(0.5 * (1 - u / 2.6)).toFixed(2)})`; g.beginPath(); g.ellipse(mx + a * 18 * gs + i * 2.2 * gs, my - a * 9 * gs - i * 1.6 * gs, (1.2 + a * 3.2) * gs, (1.2 + a * 2.6) * gs, 0, 0, Math.PI * 2); g.fill(); } }
      }
    };
    gun(1, 126, 252, 0.85);
    // poslední beztvará zeď před velkým dělem (bedny s municí a pytle)
    g.fillStyle = P.ink; g.fillRect(66, 282, 28, 24); g.fillStyle = P.mud2; g.fillRect(67, 283, 26, 22); g.fillStyle = P.mud3; g.fillRect(67, 283, 26, 2);
    g.fillStyle = P.ink; g.fillRect(67, 292, 26, 1); g.fillRect(78, 283, 1, 22);
    gun(0, 50, 296, 1.7);
    // obsluha: nabíječ s granátem a velitel s dalekohledem (skutečné sprity)
    const bobL = Math.sin(t * 5) * 1.2;
    const cyc = frac(t * 0.8);
    put(pose(k, 'walk', 'east', t, 7), 86 + Math.sin(cyc * Math.PI * 2) * 5, 306 + bobL * 0.2, 1.9);
    g.fillStyle = P.ink; g.fillRect(Math.round(88 + Math.sin(cyc * Math.PI * 2) * 5), 279 + Math.round(bobL), 12, 5); g.fillStyle = P.gold; g.fillRect(Math.round(89 + Math.sin(cyc * Math.PI * 2) * 5), 280 + Math.round(bobL), 10, 3); g.fillStyle = P.white; g.fillRect(Math.round(89 + Math.sin(cyc * Math.PI * 2) * 5), 280 + Math.round(bobL), 10, 1);
    put(tex[key(side, 'officer')]?.east ?? tex[k]?.east, 20, 292, 1.5, 'rgba(14,13,12,0.18)');
    g.fillStyle = P.ink; g.fillRect(34, 268, 5, 3); // dalekohled
    // vzdálená obsluha druhého děla
    put(pose(k, 'idle', 'north', t, 4), 106, 254, 0.8);
    // zábleskové světlo na popředí
    for (const [t0] of SHOTS) { const u = t - t0; if (u > 0 && u < 0.12) { g.fillStyle = 'rgba(255,214,150,0.18)'; g.fillRect(-6, -6, W + 12, H + 12); } }
    // dráhy granátů s dithered stopou
    SHOTS.forEach(([t0, who], i) => {
      const p = (t - t0 - 0.12) / 1.13;
      if (p <= 0 || p >= 1) return;
      const gx = who ? 126 : 50, gy = who ? 252 : 296, gs = who ? 0.85 : 1.7;
      const x0 = gx + 2 * gs + Math.cos(-0.5) * 32 * gs, y0 = gy - 17 * gs + Math.sin(-0.5) * 32 * gs, [xt, yt] = TGT[i];
      for (let s = 0; s < 14; s++) {
        const q = Math.max(0, p - s * 0.012);
        const sx = x0 + (xt - x0) * q, sy = y0 + (yt - y0) * q - 120 * Math.sin(Math.PI * q) * (who ? 0.8 : 1);
        g.fillStyle = s ? (s % 2 ? 'rgba(227,217,195,0.55)' : 'rgba(196,184,160,0.3)') : P.white;
        g.fillRect(Math.round(sx), Math.round(sy), s ? 1 : 2, s ? 1 : 2);
      }
    });
    g.setTransform(1, 0, 0, 1, 0, 0);
  };

  // ====================================================================================================
  // 3) BEZPEČNĚJŠÍ TÝDEN: kryt za pytli, strážný s dalekohledem, lucerna v úkrytu, výbuchy jen daleko u nepřítele
  // ====================================================================================================
  {
    const c = off(W, H), cg = c.getContext('2d');
    cloudy(cg, 0, 170, ['#3a4048', P.steel, P.grey, '#b8aa90', P.pale]);
    for (let k = 0; k < 6; k++) { cg.fillStyle = k % 2 ? 'rgba(58,64,72,0.5)' : 'rgba(163,151,130,0.35)'; cg.fillRect(Math.round(k * 33 - 10), 26 + k * 16, 66, 6); }
    for (const [base, col, amp, ph] of [[150, '#5a6064', 12, 0.4], [162, '#4a4f52', 9, 1.9]]) {
      for (let x = 0; x < W; x++) { cg.fillStyle = col; cg.fillRect(x, Math.round(base - amp * (0.5 + 0.5 * Math.sin(x * 0.05 + ph)) - amp * 0.3 * Math.sin(x * 0.19)), 1, 40); }
    }
    hill(cg, 128, 126, 168, 40, P.olive2, P.olive3, 11); // protější kopec
    const r = rng(23);
    for (let i = 0; i < 30; i++) fir(cg, 128 + Math.round((r() - 0.5) * 90), 150 + Math.round(r() * 14), 4 + Math.round(r() * 5), P.olive3, P.olive2);
    for (let y = 168; y < 290; y++) for (let x = 0; x < W; x++) { cg.fillStyle = by(x, y) < 0.55 - (y - 168) / 230 ? P.olive : P.olive2; cg.fillRect(x, y, 1, 1); }
    for (let i = 0; i < 130; i++) { cg.fillStyle = r() < 0.5 ? P.khaki : P.olive3; cg.fillRect(Math.floor(r() * W), 170 + Math.floor(r() * 118), 1, 1); }
    stakeWire(cg, 0, W, 216, 16, 23, P.ink, P.mud3);
    for (const [x, y, s] of [[40, 226, 1.1], [112, 230, 1.4], [162, 224, 1]]) { cg.strokeStyle = P.ink; cg.lineWidth = s; cg.beginPath(); cg.moveTo(x - 5 * s, y); cg.lineTo(x + 5 * s, y - 10 * s); cg.moveTo(x - 5 * s, y - 10 * s); cg.lineTo(x + 5 * s, y); cg.stroke(); }
    L.shelter = c;
    // kryt: pytle, trámy a maskovací síť
    const f = off(W, H), fg = f.getContext('2d');
    sandbags(fg, 0, 276, W, H, P.bone, P.sand, P.mud2);
    // úkryt vpravo: dřevěné rámy, tma uvnitř, maskovací síť
    fg.fillStyle = P.ink; fg.fillRect(122, 208, 58, 68);
    fg.fillStyle = P.mud2; fg.fillRect(118, 204, 6, 72); fg.fillRect(118, 204, 62, 6);
    fg.fillStyle = P.mud3; fg.fillRect(118, 204, 62, 1); fg.fillRect(118, 204, 1, 72);
    for (let x = 112; x < W; x++) for (let y = 196; y < 210; y++) { if ((x * 7 + y * 3) % 5 < 3) { fg.fillStyle = (x + y) % 4 ? P.olive3 : P.olive; fg.fillRect(x, y, 1, 1); } }
    L.shelterFront = f;
  }
  const BANG = [0.5, 1.9, 3.2, 4.4, 5.7];
  scene.shelter = (t, o) => {
    const side = o.side ?? 0, k = key(side), sway = Math.round(Math.sin(t * 0.7) * 1.5);
    g.drawImage(L.shelter, 0, 0);
    // výbuchy daleko na nepřátelské straně (malé, kouř stoupá)
    BANG.forEach((t0, i) => blast(g, [150, 118, 166, 104, 140][i], [168, 166, 170, 166, 168][i], t - t0, 0.5, ['#7e3b2a', '#5a4b4a', '#4a4f52', '#666d70'], 4));
    // stopovky z dálky, dopadají před drátem, ne k nám
    for (let i = 0; i < 6; i++) { const a = frac(t * 0.9 + i * 0.37), x = 176 - a * 90, y = 178 + a * 40 + i * 2; g.fillStyle = P.gold; g.fillRect(Math.round(x), Math.round(y), 2, 1); if (a > 0.97) { g.fillStyle = P.sand; g.fillRect(Math.round(x), Math.round(y) - 2, 1, 2); } }
    // úkryt: lucerna a vojáček, který píše dopis
    g.drawImage(L.shelterFront, 0, 0);
    g.fillStyle = P.mud0; g.fillRect(124, 212, 54, 64);
    glow(g, 150, 226 + Math.round(Math.sin(t * 9)), 36, P.mud3, 0.9);
    glow(g, 150, 226, 22, P.gold, 0.7 + 0.15 * Math.sin(t * 11));
    g.fillStyle = P.ink; g.fillRect(148, 212, 1, 8); g.fillRect(146, 219, 9, 2); g.fillRect(146, 229, 9, 2); g.fillRect(146, 219, 1, 12); g.fillRect(154, 219, 1, 12);
    g.fillStyle = P.gold; g.fillRect(147, 221, 7, 8); g.fillStyle = P.white; g.fillRect(149, 223, 3, 4);
    put(pose(k, 'idle', 'south', t, 3), 166, 262, 1.6, 'rgba(217,143,63,0.22)');
    g.fillStyle = P.mud2; g.fillRect(156, 250, 18, 12); g.fillStyle = P.bone; g.fillRect(158, 248, 14, 2);
    // nad pytli: dva strážní, jeden s dalekohledem
    put(pose(k, 'idle', 'north', t, 3), 44 + sway, 296, 2.6);
    put(pose(k + '_machinegunner', 'idle', 'north', t, 3) || pose(k, 'idle', 'north', t, 3), 98 + sway * 0.5, 298, 2.6);
    // pytle přes dolní polovinu postav
    g.drawImage(L.shelterFront, 0, 268, W, H - 268, 0, 268, W, H - 268);
    // jiskry a prach, kdy něco zapraská o pytle
    for (let i = 0; i < 3; i++) { const u = frac(t * 0.6 + i * 0.33); if (u < 0.08) { g.fillStyle = P.gold; g.fillRect(24 + i * 66, 249, 1, 1); g.fillStyle = 'rgba(196,184,160,0.6)'; g.fillRect(22 + i * 66, 247, 5, 2); } }
  };

  // ====================================================================================================
  // 4) STUŽKA A HRDINA
  // ====================================================================================================
  {
    const c = off(W, H), cg = c.getContext('2d');
    cloudy(cg, 0, 230, ['#3a4048', P.steel, P.grey, P.bone, P.pale, P.white]);
    for (let k = 0; k < 7; k++) { cg.fillStyle = k % 2 ? 'rgba(138,146,149,0.45)' : 'rgba(58,64,72,0.35)'; cg.fillRect(Math.round(k * 29 - 14), 14 + k * 18, 64, 6); }
    for (let x = 0; x < W; x++) { cg.fillStyle = '#4a4f52'; cg.fillRect(x, Math.round(168 - 22 * (0.5 + 0.5 * Math.sin(x * 0.04 + 1)) - 7 * Math.sin(x * 0.15)), 1, 80); }
    hill(cg, 150, 132, 214, 54, P.olive2, P.olive3, 6);
    const r = rng(31);
    for (let i = 0; i < 55; i++) fir(cg, Math.round(r() * W), 176 + Math.round(r() * 54), 6 + Math.round(r() * 8), P.olive3, P.olive2);
    cg.fillStyle = P.mud2; cg.fillRect(143, 126, 15, 7); cg.fillStyle = P.ink; cg.fillRect(146, 129, 4, 2); cg.fillStyle = P.mud1; cg.fillRect(142, 125, 17, 2);
    for (let y = 214; y < H; y++) for (let x = 0; x < W; x++) { cg.fillStyle = by(x, y) < 0.5 - (y - 214) / 220 ? P.olive : P.olive2; cg.fillRect(x, y, 1, 1); }
    for (let i = 0; i < 70; i++) { cg.fillStyle = r() < 0.5 ? P.khaki : P.olive3; cg.fillRect(Math.floor(r() * W), 216 + Math.floor(r() * 100), 1, 1); }
    L.ribbon = c;
  }
  const CONFETTI = Array.from({ length: 70 }, (_, i) => { const r = rng(i * 7919 + 13); r(); r(); r(); return { x: r() * W, sp: 14 + r() * 30, ph: r() * 6, c: [P.gold, P.white, P.rust, P.yellow, P.khaki][i % 5], s: r() < 0.35 ? 2 : 1, d: r() }; });
  scene.ribbon = (t, o) => {
    const side = o.side ?? 1, k = key(side), S = SIDE[side];
    g.drawImage(L.ribbon, 0, 0);
    // sluneční paprsky shora (dithered), pomalu se otáčejí a pulzují
    g.fillStyle = 'rgba(227,217,195,0.5)';
    for (let y = 36; y < 250; y++) for (let x = 0; x < W; x++) {
      const ang = Math.atan2(x - 90, y - 30) + Math.sin(t * 0.35) * 0.04, ph = ((ang * 9) % 2 + 2) % 2;
      if (ph < 0.8 && by(x, y) < 0.42 * (1 - (y - 30) / 240) * (0.8 + 0.2 * Math.sin(t * 1.6 + ang * 5))) g.fillRect(x, y, 1, 1);
    }
    glow(g, 90, 24, 80, P.pale, 0.8);
    glow(g, 90, 24, 36, P.white, 0.8);
    // skála s tabulkou HRDINA
    g.fillStyle = P.ink; g.beginPath(); g.moveTo(34, 322); g.lineTo(44, 262); g.lineTo(70, 246); g.lineTo(110, 244); g.lineTo(138, 258); g.lineTo(150, 322); g.fill();
    g.fillStyle = P.mud3; g.beginPath(); g.moveTo(38, 322); g.lineTo(48, 264); g.lineTo(71, 250); g.lineTo(109, 248); g.lineTo(135, 261); g.lineTo(146, 322); g.fill();
    g.fillStyle = P.sand; g.beginPath(); g.moveTo(71, 250); g.lineTo(109, 248); g.lineTo(104, 254); g.lineTo(76, 255); g.fill();
    g.fillStyle = P.mud2; for (const [x, y, w, h] of [[52, 280, 18, 5], [104, 270, 22, 6], [68, 300, 26, 5], [118, 296, 18, 5]]) g.fillRect(x, y, w, h);
    g.fillStyle = P.ink; g.fillRect(62, 270, 56, 20); g.fillStyle = P.gold; g.fillRect(63, 271, 54, 18); g.fillStyle = '#f1c27a'; g.fillRect(63, 271, 54, 2); g.fillStyle = P.ink; g.fillRect(65, 273, 50, 14); g.fillStyle = P.gold; g.fillRect(66, 274, 48, 12);
    txt(g, 'HERO', 66 + Math.round((48 - txtW('HERO', 3)) / 2), 275, 3, P.ink);
    for (const sgn of [-1, 1]) for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? P.gold : P.yellow; g.fillRect(sgn < 0 ? 56 - i * 2 : 120 + i * 2, 286 - i * 3, 4, 3); }
    // hrdina na skále: prapor, stužka na hrudi
    const hy = 252 + Math.round(Math.sin(t * 2) * 0.5);
    put(pose(k, 'idle', 'south', t, 3), 90, hy, 3.1);
    g.fillStyle = P.ink; g.fillRect(112, 130, 3, 124); g.fillStyle = P.mud3; g.fillRect(113, 130, 1, 124); g.fillStyle = P.gold; g.fillRect(111, 127, 5, 4);
    flag(115, 134, 50, 30, t, side ? P.olive : P.steel, side ? P.olive3 : P.mud2, (x, y, w, h, off2) => star(x + 25, y + 15 + off2, P.white));
    ribbonAt(88, 195, clamp01((t - 0.6) * 2) > 0 ? Math.max(0, Math.sin(t * 5)) * 0.8 : 0);
    // vlevo důstojník připíná stužku vojákovi
    put(tex[key(side, 'officer')]?.east ?? tex[k]?.east, 16, 312, 1.9);
    put(tex[k]?.west, 40, 312, 1.9);
    if (t > 1.2) ribbonAt(36, 312 - 30 * 1.9 * 0.55, clamp01(1 - (t - 1.2) / 0.6) * 2);
    // vpravo tleskající skupina (pohupují se, na hrudi stužky)
    [[146, 312, 0.2], [170, 314, 1.3]].forEach(([x, y, ph], i) => {
      const bob = Math.abs(Math.sin(t * 6 + ph)) * 2;
      put(pose(k + (i === 1 ? '_medic' : ''), 'idle', 'south', t + ph, 4) || pose(k, 'idle', 'south', t + ph, 4), x, y - bob, 1.9);
      ribbonAt(x - 1, y - 30 * 1.9 * 0.55 - bob, 0);
    });
    // konfety
    for (const p of CONFETTI) {
      const y = ((p.ph * 40 + t * p.sp) % 360) - 20, x = p.x + Math.sin(t * 1.5 + p.ph) * 6;
      g.fillStyle = p.c; g.fillRect(Math.round(x), Math.round(y), p.s, p.s + 1);
    }
  };

  // ====================================================================================================
  // 5) KOLIK SE PŘIDALO? počítadlo nových hráčů, běžící vojáci obou stran, výbuchy za obzorem
  // ====================================================================================================
  {
    const c = off(W, H), cg = c.getContext('2d');
    cloudy(cg, 0, 205, ['#1a1417', '#2e1d1c', P.blood, '#8a3c26', P.fire, P.gold]);
    for (let k = 0; k < 6; k++) { cg.fillStyle = k % 2 ? 'rgba(14,13,12,0.55)' : 'rgba(46,29,28,0.6)'; cg.fillRect(Math.round(k * 35 - 20), 18 + k * 26, 76, 8); }
    for (let x = 0; x < W; x++) { cg.fillStyle = '#1c1013'; cg.fillRect(x, Math.round(206 + 4 * Math.sin(x * 0.07) + 2 * Math.sin(x * 0.23)), 1, 40); }
    for (let y = 236; y < H; y++) for (let x = 0; x < W; x++) { cg.fillStyle = by(x, y) < 0.4 ? '#1c1a17' : P.ink; cg.fillRect(x, y, 1, 1); }
    L.counter = c;
  }
  const CB = [[0.3, 24, 204, 0.8], [1.0, 150, 206, 1.0], [1.9, 82, 208, 0.7], [2.8, 168, 204, 0.9], [3.7, 40, 206, 1.1], [4.6, 120, 204, 0.8], [5.4, 64, 206, 0.9]];
  scene.counter = (t, o) => {
    let sh = 0;
    for (const [t0, , , kk] of CB) { const v = shakeOf(t - t0, kk * 0.6); if (Math.abs(v) > Math.abs(sh)) sh = v; }
    g.setTransform(1, 0, 0, 1, sh, Math.round(sh * 0.6));
    g.drawImage(L.counter, -4, -4, W + 8, H + 8);
    for (const [t0, x, y, kk] of CB) blast(g, x, y, t - t0, kk, ['#7e3b2a', '#2e1d1c', '#1c1013', '#2a1d19'], 22);
    // bleskové osvětlení vojáků při výbuchu
    const flash = CB.reduce((m, [t0]) => Math.max(m, clamp01(1 - (t - t0) / 0.5) * (t > t0 ? 1 : 0)), 0);
    // vojáci obou stran bíhají (Concord zleva doprava, Hegemonie zprava doleva), tři řady podle hloubky
    const rows = [{ y: 276, s: 1.5, sp: 40 }, { y: 296, s: 2.0, sp: 58 }, { y: 318, s: 2.6, sp: 78 }];
    rows.forEach((r, ri) => {
      for (let i = 0; i < 5; i++) {
        const dir = (i + ri) % 2 ? 1 : -1, x0 = frac(i * 0.21 + ri * 0.13 + t * r.sp / 260 * dir) * (W + 60) - 30;
        const sd = dir > 0 ? 1 : 0, kk = key(sd, i % 3 === 0 ? 'machinegunner' : null);
        put(pose(kk, 'walk', dir > 0 ? 'east' : 'west', t + i * 0.11, 9) || pose(key(sd), 'walk', dir > 0 ? 'east' : 'west', t, 9), x0, r.y - Math.abs(Math.sin(t * 9 + i)) * r.s * 0.5, r.s, `rgba(217,143,63,${(0.12 + flash * 0.2).toFixed(2)})`);
      }
    });
    // tabule s číslem
    const cx = 90, cy = 130;
    glow(g, cx, cy, 96, P.gold, 0.5 + 0.15 * Math.sin(t * 3));
    glow(g, cx, cy, 62, P.fire, 0.55);
    g.fillStyle = P.ink; g.fillRect(14, 84, 152, 94);
    g.fillStyle = P.sand; g.fillRect(16, 86, 148, 90); g.fillStyle = P.mud1; g.fillRect(18, 88, 144, 86);
    g.fillStyle = P.dark; g.fillRect(20, 90, 140, 82);
    for (const [x, y] of [[22, 92], [156, 92], [22, 168], [156, 168]]) { g.fillStyle = P.bone; g.fillRect(x, y, 3, 3); g.fillStyle = P.mud0; g.fillRect(x + 2, y + 2, 1, 1); }
    // vavřínové listy po stranách
    for (const sgn of [-1, 1]) for (let i = 0; i < 7; i++) { const lx = cx + sgn * (66 + Math.abs(i - 3) * 1.5), ly = 98 + i * 11; g.fillStyle = i % 2 ? P.gold : P.yellow; g.fillRect(lx - 2, ly, 5, 3); g.fillStyle = P.ink; g.fillRect(lx - 2, ly + 3, 5, 1); }
    const shown = o.n == null ? 'XXX' : String(Math.round(o.n * easeOut(clamp01((t - 0.3) / 2.8))));
    const full = '+' + shown, k = full.length > 4 ? 6 : 7;
    const wN = txtW(full, k);
    txt(g, full, Math.round(cx - wN / 2), 104, k, P.white, P.ink);
    txt(g, 'NEW PLAYERS', Math.round(cx - txtW('NEW PLAYERS', 2) / 2), 152, 2, P.gold, P.ink);
    // záblesk po dosažení čísla
    if (o.n != null) { const u = t - 3.1; if (u > 0 && u < 0.3) { g.fillStyle = `rgba(255,246,220,${(0.5 * (1 - u / 0.3)).toFixed(2)})`; g.fillRect(14, 84, 152, 94); } }
    g.setTransform(1, 0, 0, 1, 0, 0);
  };

  return {
    canvas,
    seconds: RACE_SCENES,
    draw(name, t, opts = {}) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.imageSmoothingEnabled = false;
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = 1;
      g.clearRect(0, 0, W, H);
      (scene[name] || scene.march)(Math.max(0, t), opts);
    },
  };
}
