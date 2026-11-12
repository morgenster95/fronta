// Filmové záběry k reelu „závod o kótu“ (den 3): posily, děla na výšině, bezpečný kryt, stužka a hrdina, počítadlo hráčů.
// Každý záběr je samostatný (kreslí se v mřížce 180×320 paletou hry, dithering Bayer 4×4, skutečné sprity vojáků ze hry),
// takže jde použít v jakémkoli reelu: const c = makeRaceScenes(tex, anims); root.prepend(c.canvas); c.draw('march', t, { side: 1 }).
// t = sekundy od začátku záběru; volby: side (0 Hegemonie, 1 Concord), n (číslo na počítadle; bez něj se ukáže „XXX“).
import { sky, glow, lit, blast, stakeWire, shakeOf, easeOut, off, hex, rgb, by, clamp01, CW as W, CH as H } from './cinema.js';

export const RACE_SCENES = { march: 7, guns: 9, shelter: 7, ribbon: 7, counter: 6, graves: 9, heir: 8, lineage: 8 };

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
    const r = rng(9);
    // --- kopec: plochý vrchol, terasy se zákopy, krátery, rozstřílené stromy, ruina bunkru ---
    const ridge = (x) => { const u = Math.abs(x - 98) / 64; return 180 - 78 * Math.exp(-Math.pow(u, 2.3)) + Math.sin(x * 0.23) * 1.5 + Math.sin(x * 0.071 + 1) * 3.2 * Math.exp(-u * u); };
    const ramp = [P.olive3, P.olive2, P.olive, P.khaki];
    for (let x = 14; x < 184; x++) {
      const y0 = Math.round(ridge(x)), sl = (ridge(x + 3) - ridge(x - 3)) / 6;
      for (let y = y0; y < 184; y++) {
        const dd = y - y0;
        let v = 1.45 - sl * 0.5 + (by(x, y) - 0.5) * 0.95 - dd * 0.003 + (Math.sin(x * 0.7 + y * 1.1) > 0.82 ? -0.35 : 0);
        if (dd < 2) v += 0.9; // světlo na hraně hřebene
        cg.fillStyle = ramp[Math.max(0, Math.min(3, Math.floor(v)))];
        cg.fillRect(x, y, 1, 1);
      }
    }
    const rr = r;
    // zákopy: tři terasy podél vrstevnic (tmavá rýha, násyp nahoře, pytle), s přestupy
    for (const [k, sx0, sx1] of [[13, 56, 140], [27, 40, 156], [43, 28, 168]]) {
      for (let x = sx0; x < sx1; x++) {
        const y = Math.round(ridge(x) + k + ((Math.floor(x / 17) % 2) ? 2 : 0));
        if (y > 176) continue;
        cg.fillStyle = P.ink; cg.fillRect(x, y, 1, 2);
        cg.fillStyle = P.mud3; cg.fillRect(x, y - 1, 1, 1);
        if (x % 3 === 0) { cg.fillStyle = P.bone; cg.fillRect(x, y - 2, 2, 1); }
      }
    }
    // spojovací zákop klikatě nahoru
    let zx = 88, zy = 178;
    for (const [tx, ty] of [[110, 156], [96, 138], [112, 122], [100, 112]]) {
      const n = Math.max(Math.abs(tx - zx), Math.abs(ty - zy));
      for (let i = 0; i <= n; i++) { const x = Math.round(zx + (tx - zx) * i / n), y = Math.round(zy + (ty - zy) * i / n); cg.fillStyle = P.ink; cg.fillRect(x, y, 2, 2); cg.fillStyle = P.mud3; cg.fillRect(x + 2, y, 1, 1); }
      zx = tx; zy = ty;
    }
    // krátery na svazích
    for (const [x, y, w] of [[62, 150, 7], [128, 146, 6], [44, 164, 8], [150, 160, 7], [82, 168, 5], [116, 172, 6], [100, 130, 4], [74, 134, 4]]) {
      cg.fillStyle = P.ink; cg.beginPath(); cg.ellipse(x, y, w / 2, w / 4 + 0.6, 0, 0, Math.PI * 2); cg.fill();
      cg.fillStyle = P.mud3; cg.fillRect(Math.round(x - w / 2), Math.round(y - w / 4 - 1), Math.round(w * 0.6), 1);
      cg.fillStyle = P.mud2; cg.fillRect(Math.round(x + 1), Math.round(y + w / 4), Math.round(w * 0.5), 1);
    }
    // rozstřílené stromy bez korun
    for (const [x, h] of [[54, 14], [70, 10], [136, 12], [150, 9], [34, 11], [166, 8], [118, 10], [84, 8]]) {
      const y = Math.round(ridge(x)) + 3; cg.fillStyle = P.mud1; cg.fillRect(x, y - h, 2, h);
      cg.fillStyle = P.ink; cg.fillRect(x + 2, y - h, 1, h); cg.fillStyle = P.mud2; cg.fillRect(x - 2, y - h + 3, 2, 1); cg.fillRect(x + 2, y - h + 5, 2, 1); cg.fillRect(x, y - h - 2, 1, 2);
    }
    // smrky u paty, kameny
    for (let i = 0; i < 18; i++) { const x = 18 + rr() * 160; fir(cg, Math.round(x), Math.round(ridge(x) + 52 + rr() * 8), 5 + Math.round(rr() * 5)); }
    for (let i = 0; i < 34; i++) { const x = 40 + rr() * 120, y = ridge(x) + 6 + rr() * 50; if (y < 178) { cg.fillStyle = rr() < 0.5 ? P.grey : P.steel; cg.fillRect(Math.round(x), Math.round(y), 2, 1); cg.fillStyle = P.ink; cg.fillRect(Math.round(x), Math.round(y) + 1, 2, 1); } }
    // ruina bunkru na vrcholu: rozbitá střecha z pytlů, střílna, nosník
    const tx0 = 86, ty0 = Math.round(ridge(98)) - 1;
    cg.fillStyle = P.ink; cg.fillRect(tx0 - 1, ty0 - 12, 24, 13);
    cg.fillStyle = P.mud2; cg.fillRect(tx0, ty0 - 11, 22, 11); cg.fillStyle = P.mud3; cg.fillRect(tx0, ty0 - 11, 22, 1); cg.fillRect(tx0, ty0 - 11, 1, 11);
    cg.fillStyle = P.mud1; for (let i = 0; i < 6; i++) cg.fillRect(tx0 + 2 + ((i * 7) % 18), ty0 - 9 + ((i * 5) % 8), 3, 1); // praskliny
    cg.fillStyle = P.ink; cg.fillRect(tx0 + 4, ty0 - 8, 7, 3); cg.fillRect(tx0 + 14, ty0 - 8, 5, 3); // střílny
    cg.fillStyle = P.bone; for (let i = 0; i < 5; i++) { cg.fillRect(tx0 - 1 + i * 5, ty0 - 14, 5, 3); cg.fillStyle = i % 2 ? P.bone : P.sand; } // pytle na střeše
    cg.fillStyle = P.ink; cg.fillRect(tx0 + 19, ty0 - 17, 2, 6); cg.fillRect(tx0 + 16, ty0 - 15, 3, 1); // zlomený trám
    // louka
    for (let y = 176; y < H; y++) for (let x = 0; x < W; x++) {
      const dd = (y - 176) / 144;
      cg.fillStyle = by(x, y) < 0.5 - dd * 0.4 ? P.olive : P.olive2;
      cg.fillRect(x, y, 1, 1);
    }
    for (let i = 0; i < 160; i++) { cg.fillStyle = r() < 0.5 ? P.khaki : P.olive3; cg.fillRect(Math.floor(r() * W), 180 + Math.floor(r() * 140), 1 + (r() < 0.3 ? 1 : 0), 1); }
    // tráva s perspektivou: větší chomáče blíž, tmavé skvrny, polní květy
    for (let i = 0; i < 70; i++) { const y = 184 + Math.floor(r() * 136), d = (y - 178) / 142, x = Math.floor(r() * W), w = 7 + d * 16, col = r() < 0.5 ? P.olive3 : P.olive2; cg.fillStyle = col; cg.beginPath(); cg.ellipse(x, y, w, 1 + d * 3, 0, 0, Math.PI * 2); cg.fill(); }
    for (let i = 0; i < 520; i++) {
      const y = 182 + Math.floor(r() * 138), d = (y - 178) / 142, x = Math.floor(r() * W), h = 1 + Math.round(d * 4 * r() + r()), q = r();
      cg.fillStyle = q < 0.4 ? P.khaki : q < 0.7 ? P.olive3 : q < 0.9 ? P.olive : P.sand;
      cg.fillRect(x, y - h, 1, h + 1); if (d > 0.35 && r() < 0.6) { cg.fillRect(x - 1, y - h + 1, 1, h); cg.fillRect(x + 1, y - h + 2, 1, h - 1); }
    }
    for (let i = 0; i < 26; i++) { const y = 200 + Math.floor(r() * 118), x = Math.floor(r() * W); cg.fillStyle = r() < 0.5 ? P.pale : P.gold; cg.fillRect(x, y, 1, 1); if (y > 250) { cg.fillRect(x + 1, y, 1, 1); } }
    for (let i = 0; i < 14; i++) { const y = 220 + Math.floor(r() * 96), x = Math.floor(r() * W), w = 2 + Math.floor((y - 178) / 40); cg.fillStyle = P.mud2; cg.fillRect(x, y, w, 1); cg.fillStyle = P.mud3; cg.fillRect(x, y - 1, w - 1, 1); }
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
    const fx0 = 105 + Math.round(sw * 0.3);
    g.fillStyle = P.ink; g.fillRect(fx0, 66, 1, 24);
    flag(fx0 + 1, 67, 11, 7, t, SIDE[side].band === P.gold ? P.olive : P.steel, SIDE[side].band === P.gold ? P.olive3 : P.mud2, null, 0.7);
    // drobní obránci na terasách a záblesky střelby / výbuchy na svazích
    for (const [x, y, ph] of [[60, 128, 0], [78, 134, 1.3], [128, 124, 2.1], [140, 154, 0.7], [52, 156, 1.9], [112, 112, 2.8], [96, 118, 0.4]]) {
      const kk = key(side, ph > 2 ? 'machinegunner' : null);
      put(pose(kk, 'idle', 'north', t + ph, 3) || tex[kk]?.north, x + Math.round(sw * 0.3), y, 0.2 + (y - 112) * 0.002);
    }
    for (const [ph, x, y] of [[0.4, 150, 152], [1.7, 48, 160], [2.6, 124, 132], [3.9, 66, 146], [5.2, 140, 164]]) {
      const u = t - ph; if (u > 0 && u < 0.45) { glow(g, x, y, 10 * (1 - u / 0.45) + 3, '#d98f3f', 1.2 * (1 - u / 0.45)); g.fillStyle = 'rgba(86,76,70,0.5)'; g.fillRect(x - 2, Math.round(y - 4 - u * 18), 4, 3); }
    }
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
    const bx = 104, by_ = 258;
    g.fillStyle = P.ink; g.fillRect(bx - 2, by_ - 2, 76, 50);
    g.fillStyle = P.sand; g.fillRect(bx - 1, by_ - 1, 74, 48);
    g.fillStyle = P.dark; g.fillRect(bx, by_, 72, 46);
    const num = String(n).padStart(3, '0'), pulse = n >= 100 && Math.floor(t * 4) % 2 === 0;
    txt(g, num, bx + 10, by_ + 5, 5, pulse ? P.yellow : P.white, P.ink);
    txt(g, 'NEW SOLDIERS', bx + 12, by_ + 35, 1, P.bone);
    if (n >= 100) glow(g, bx + 36, by_ + 23, 50, P.gold, 0.45 + 0.2 * Math.sin(t * 8));
  };

  // ====================================================================================================
  // 2) VYSOKÁ POZICE: děla na výšině ostřelují nepřítele v údolí
  // ====================================================================================================
  {
    const c = off(W, H), cg = c.getContext('2d');
    cloudy(cg, 0, 215, ['#1f2430', '#3a3b44', '#5a4b4a', '#8a5a4c', '#c4784a', '#d98f3f']);
    for (let k = 0; k < 6; k++) { cg.fillStyle = k % 2 ? 'rgba(31,36,48,0.7)' : 'rgba(58,59,68,0.6)'; cg.fillRect(Math.round(k * 37 - 20), 20 + k * 22, 84, 7); }
    // údolí: hřbety v mlze, zničená ves s věží kostela, nepřátelské zákopy
    for (const [base, col, amp, ph] of [[170, '#4a3f3a', 16, 1.4], [188, '#3a302d', 12, 0.2], [206, '#2b2420', 8, 2.7]]) {
      for (let x = 0; x < W; x++) { cg.fillStyle = col; cg.fillRect(x, Math.round(base - amp * (0.5 + 0.5 * Math.sin(x * 0.04 + ph)) - amp * 0.3 * Math.sin(x * 0.17)), 1, 90); }
    }
    cg.fillStyle = '#3a302d'; cg.fillRect(112, 156, 5, 34); cg.fillRect(111, 168, 7, 2); cg.fillRect(113, 152, 3, 4); cg.fillRect(114, 148, 1, 4); // věž kostela
    cg.fillStyle = '#4a3f3a'; cg.fillRect(112, 156, 1, 34);
    cg.fillStyle = '#1c1a17'; for (const [x, w] of [[96, 14], [122, 12], [138, 16], [158, 12]]) { cg.fillRect(x, 190, w, 10); cg.beginPath(); cg.moveTo(x - 1, 190); cg.lineTo(x + w / 2, 183); cg.lineTo(x + w + 1, 190); cg.fill(); }
    cg.fillStyle = '#2b2420'; for (const [x, w] of [[100, 3], [128, 4], [160, 3]]) cg.fillRect(x, 186, w, 6); // trosky komínů
    cg.fillStyle = '#1c1a17';
    for (const [y, x0, x1] of [[214, 70, 180], [224, 56, 180], [236, 92, 180]]) { for (let x = x0; x < x1; x++) cg.fillRect(x, y + Math.round(Math.sin(x * 0.4)), 1, 3); }
    for (const [x, y] of [[150, 208], [118, 214], [168, 220]]) { cg.fillStyle = P.mud1; cg.fillRect(x, y - 7, 14, 7); cg.fillStyle = P.mud2; cg.beginPath(); cg.moveTo(x - 1, y - 7); cg.lineTo(x + 7, y - 12); cg.lineTo(x + 15, y - 7); cg.fill(); }
    // výšina: svah dolů, kameny, tráva, krátery, koleje
    for (let x = 0; x < W; x++) {
      const top = Math.round(250 - Math.max(0, 70 - x * 0.55) + Math.sin(x * 0.2) * 1.5);
      for (let y = top; y < H; y++) {
        const rocky = by(x, y) < 0.35 + (y - top) / 120;
        cg.fillStyle = y < top + 2 ? P.khaki : y < top + 5 ? P.olive : rocky ? P.mud3 : P.mud2;
        cg.fillRect(x, y, 1, 1);
      }
    }
    const r = rng(17);
    for (let i = 0; i < 170; i++) { const x = Math.floor(r() * W), y = 256 + Math.floor(r() * 64); cg.fillStyle = r() < 0.5 ? P.sand : P.mud1; cg.fillRect(x, y, 2, 1); }
    for (let i = 0; i < 80; i++) { const x = Math.floor(r() * W), y = 254 + Math.floor(r() * 62); cg.fillStyle = r() < 0.5 ? P.olive : P.khaki; cg.fillRect(x, y, 1, 2 + Math.floor(r() * 2)); } // trsy trávy
    for (const [x, y, w] of [[150, 300, 24], [122, 314, 20], [8, 276, 12]]) { cg.fillStyle = P.ink; cg.beginPath(); cg.ellipse(x, y, w / 2, w / 5, 0, 0, Math.PI * 2); cg.fill(); cg.fillStyle = P.mud3; cg.fillRect(Math.round(x - w / 2), Math.round(y - w / 5 - 1), Math.round(w * 0.55), 1); } // krátery
    cg.fillStyle = P.mud1; for (let x = 0; x < W; x += 2) { cg.fillRect(x, 304 + Math.round(Math.sin(x * 0.05) * 2), 1, 1); cg.fillRect(x, 311 + Math.round(Math.sin(x * 0.05 + 1) * 2), 1, 1); } // koleje
    L.guns = c;
    const f = off(W, H), fg = f.getContext('2d'); // popředí: pytlový val vpravo a zásoba munice vlevo
    sandbags(fg, 108, 290, W, H, P.bone, P.sand, P.mud2);
    for (const [x, y, w, h] of [[2, 288, 22, 14], [6, 275, 15, 14]]) { // bedny
      fg.fillStyle = P.ink; fg.fillRect(x - 1, y - 1, w + 2, h + 2); fg.fillStyle = P.mud2; fg.fillRect(x, y, w, h); fg.fillStyle = P.mud3; fg.fillRect(x, y, w, 2);
      fg.fillStyle = P.mud1; fg.fillRect(x, y + Math.floor(h / 2), w, 1); fg.fillRect(x + 2, y, 1, h); fg.fillRect(x + w - 3, y, 1, h);
      fg.fillStyle = P.rust; fg.fillRect(x + 6, y + 4, 5, 3);
    }
    for (let i = 0; i < 4; i++) { // náboje: mosazná hlaveň, rezavá špice
      const sx = 28 + i * 5; fg.fillStyle = P.ink; fg.fillRect(sx - 1, 286, 5, 20);
      fg.fillStyle = P.gold; fg.fillRect(sx, 292, 3, 13); fg.fillStyle = P.yellow; fg.fillRect(sx, 292, 1, 13);
      fg.fillStyle = P.olive2; fg.fillRect(sx, 287, 3, 5); fg.fillStyle = P.rust; fg.fillRect(sx, 287, 3, 2);
    }
    L.gunsFront = f;
  }
  // --- pixelové pomůcky bez antialiasingu ---
  const px = (c, x, y, col, w = 1, h = 1) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); };
  const disc = (c, cx, cy, r, colFn) => { for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) { const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy); if (d <= r) { const col = colFn(d, dx, dy); if (col) px(c, x, y, col); } } };
  const beam = (c, x0, y0, x1, y1, w, colFn) => { // tlustá úsečka; colFn(q podél, v příčně: +1 = horní okraj)
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.6) + 1; let nx = -(y1 - y0), ny = x1 - x0; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl; if (ny > 0) { nx = -nx; ny = -ny; }
    for (let i = 0; i <= n; i++) { const q = i / n; for (let v = -w / 2; v <= w / 2 + 0.01; v += 0.5) { const col = colFn(q, v / (w / 2)); if (col) px(c, x0 + (x1 - x0) * q + nx * v, y0 + (y1 - y0) * q + ny * v, col); } }
  };
  const howitzer = (x, y, s, rec, ang = -0.5) => {
    const ca = Math.cos(ang), sa = Math.sin(ang), wy = y - 10 * s, ppx = x + 2 * s, ppy = y - 17 * s;
    const at = (ox, oy, u, v) => [ox + ca * u + sa * v, oy + sa * u - ca * v]; // u podél hlavně, v nahoru kolmo
    // ocas lafety s rýčem zaraženým do země
    const tx = x - 31 * s, ty = y + 0.5 * s;
    beam(g, x - 2 * s, wy + 1 * s, tx, ty, 3.6 * s, (q, v) => (Math.abs(v) > 0.86 ? P.ink : v > 0.3 ? P.mud3 : v > -0.3 ? P.mud2 : P.mud1));
    px(g, tx - 3 * s, ty - 3.5 * s, P.ink, Math.round(3 * s), Math.round(6 * s)); px(g, tx - 2 * s, ty - 2.5 * s, P.mud2, Math.round(1.2 * s), Math.round(4 * s));
    px(g, tx - 6 * s, ty + 1.5 * s, P.mud3, Math.round(7 * s), Math.round(1.6 * s)); px(g, tx - 5 * s, ty + 1.5 * s, P.mud2, Math.round(3 * s), 1);
    // kolo: pneumatika s hřeby, ráfek, loukoťové paprsky, náboj; sluneční světlo shora zleva
    const R = 10 * s;
    disc(g, x, wy, R, (d, dx, dy) => {
      const a = Math.atan2(dy, dx), lit_ = dx + dy < -R * 0.55;
      if (d > R - 1) return P.ink;
      if (d > R - 2.4 * s) return Math.floor((a + Math.PI) * 14 / Math.PI) % 2 ? (lit_ ? P.mud3 : P.mud2) : (lit_ ? P.sand : P.mud3);
      if (d > R - 3.1 * s) return P.ink;
      if (d < 2.6 * s) return d < 1.1 * s ? P.ink : lit_ ? P.sand : P.mud3;
      return Math.floor(((a + Math.PI) * 16) / (Math.PI * 2) % 1 * 100) < 32 ? (lit_ ? P.mud3 : P.mud2) : P.mud0;
    });
    // osa, kolébka a lícnice
    beam(g, x - 1 * s, wy, ppx, ppy, 5.4 * s, (q, v) => (Math.abs(v) > 0.8 ? P.ink : v > 0.2 ? P.olive : P.olive3));
    px(g, x - 5 * s, wy - 4 * s, P.ink, Math.round(11 * s), Math.round(6 * s)); px(g, x - 4 * s, wy - 3 * s, P.olive3, Math.round(9 * s), Math.round(4 * s)); px(g, x - 4 * s, wy - 3 * s, P.olive2, Math.round(9 * s), 1);
    // zdvihový oblouk s ozubením pod závěrem
    for (let a = 1.9; a < 2.9; a += 0.03) { const ex = ppx + Math.cos(a) * 11 * s, ey = ppy + Math.sin(a) * 11 * s; px(g, ex, ey, P.ink); if (Math.round(a * 33) % 2) px(g, ex - 1, ey, P.mud3); }
    // hlaveň (v odskoku) s kroužky, mosazným pásem a úsťovou brzdou; teplé světlo západu na horní hraně
    const bx = ppx - ca * rec, by_ = ppy - sa * rec, uA = -9 * s, uB = 31 * s;
    const [a0x, a0y] = at(bx, by_, uA, 0), [a1x, a1y] = at(bx, by_, uB, 0);
    beam(g, ...at(ppx, ppy, -2 * s, -4.4 * s), ...at(ppx, ppy, 18 * s, -4.4 * s), 3.2 * s, (q, v) => (Math.abs(v) > 0.8 ? P.ink : v > 0.1 ? P.mud3 : P.mud1)); // brzdový válec
    beam(g, a0x, a0y, a1x, a1y, 5.2 * s, (q, v) => {
      const u = q * (uB - uA) / s;
      if (Math.abs(v) > 0.9) return P.ink;
      if (u > 26 && u < 27.6) return P.gold;
      if (v > 0.68) return P.gold;
      if (u % 9 < 1.1) return P.olive3;
      return v > 0.15 ? P.olive : v > -0.45 ? P.olive2 : P.olive3;
    });
    beam(g, ...at(bx, by_, 29 * s, 0), ...at(bx, by_, 34.5 * s, 0), 6.8 * s, (q, v) => (Math.abs(v) > 0.82 ? P.ink : v > 0.3 ? P.olive2 : P.olive3)); // úsťová brzda
    beam(g, ...at(bx, by_, -10 * s, 0), ...at(bx, by_, -3 * s, 0), 6.4 * s, (q, v) => (Math.abs(v) > 0.84 ? P.ink : v > 0.3 ? P.olive : P.olive3)); // závěr
    px(g, ...at(bx, by_, -11 * s, -3 * s), P.ink, Math.round(2 * s), Math.round(2 * s)); // klika závěru
    // štít jako úzká deska před kolébkou s průlezem pro hlaveň
    beam(g, ppx + 3.2 * s, ppy - 8 * s, ppx + 3.2 * s, ppy + 3.5 * s, 2.4 * s, (q, v) => (Math.abs(v) > 0.8 ? P.ink : v > 0 ? P.olive : P.olive3));
    px(g, ppx + 2.4 * s, ppy - 10 * s, P.mud3, 1, 1); px(g, ppx + 2.4 * s, ppy - 6 * s, P.mud3, 1, 1); px(g, ppx + 2.4 * s, ppy + 1 * s, P.mud3, 1, 1); // nýty
  };
  const SHOTS = [[1.7, 0], [2.8, 1], [3.9, 0], [5.0, 1], [6.1, 0], [7.2, 1]];
  const TGT = [[150, 206], [122, 214], [166, 220], [138, 230], [100, 224], [172, 208]];
  const FLASH = [[0.5, 60, 190], [1.3, 22, 194], [2.1, 84, 186], [3.0, 40, 196], [3.9, 72, 190], [5.0, 18, 192], [6.2, 54, 188]]; // vzdálené baterie
  const GUN = [{ x: 86, y: 304, s: 1.9 }, { x: 160, y: 262, s: 0.78 }];
  const muzzle = (gi) => { const G = GUN[gi]; return [G.x + 2 * G.s + Math.cos(-0.5) * 33 * G.s, G.y - 17 * G.s + Math.sin(-0.5) * 33 * G.s]; };
  scene.guns = (t, o) => {
    const side = o.side ?? 1, k = key(side);
    let sh = 0;
    for (const [t0, who] of SHOTS) { const v = shakeOf(t - t0, 0.7) * (who ? 0.5 : 1); if (Math.abs(v) > Math.abs(sh)) sh = v; }
    TGT.forEach((_, i) => { const v = shakeOf(t - (SHOTS[i][0] + 1.25), 0.35); if (Math.abs(v) > Math.abs(sh)) sh = v; });
    g.setTransform(1, 0, 0, 1, Math.round(sh), Math.round(sh * 0.5));
    g.drawImage(L.guns, -4, -4, W + 8, H + 8);
    g.fillStyle = 'rgba(10,9,14,0.24)'; g.fillRect(-6, -6, W + 12, H + 12); // lehce potemnělá scéna
    // světlice nad údolím + záblesky vzdálených baterií
    { const fy = 44 + t * 6; glow(g, 132, fy, 20, '#e3d9c3', 0.4 + 0.1 * Math.sin(t * 13)); g.fillStyle = P.white; g.fillRect(131, Math.round(fy) - 1, 3, 3); for (let i = 1; i < 9; i++) { g.fillStyle = `rgba(227,217,195,${(0.5 - i * 0.055).toFixed(2)})`; g.fillRect(132 + (i % 2), Math.round(fy) + 2 + i * 2, 1, 1); } }
    for (const [t0, x, y] of FLASH) { const u = t - t0; if (u > 0 && u < 0.35) glow(g, x, y, 12 * (1 - u / 0.35) + 4, '#d98f3f', 1.4 * (1 - u / 0.35)); }
    // výbuchy v údolí (kouř se drží) a hořící ves
    TGT.forEach(([x, y], i) => blast(g, x, y, t - (SHOTS[i][0] + 1.25), 0.62 + (i % 3) * 0.12, ['#7e3b2a', '#3a2a26', '#2b2420', '#3a3b44'], 6));
    smoke(104, 190, t, 6, 'rgba(26,22,20,0.8)', 12); smoke(160, 192, t + 1.1, 6, 'rgba(26,22,20,0.8)', 12);
    glow(g, 104, 190, 14, '#d98f3f', 0.45 + 0.15 * Math.sin(t * 9)); glow(g, 160, 192, 12, '#d98f3f', 0.4 + 0.15 * Math.sin(t * 11 + 1));
    // dálka: druhé dělo a jeho obsluha
    const recOf = (gi) => SHOTS.reduce((m, [t0, who]) => { const u = t - t0; return who === gi && u > 0 && u < 0.6 ? Math.max(m, 7 * Math.exp(-u * 7)) : m; }, 0);
    howitzer(GUN[1].x, GUN[1].y, GUN[1].s, recOf(1) * GUN[1].s * 0.5);
    put(pose(k, 'idle', 'north', t, 4), 140, 264, 0.7);
    g.drawImage(L.gunsFront, -4, -4, W + 8, H + 8);
    // hlavní dělo
    howitzer(GUN[0].x, GUN[0].y, GUN[0].s, recOf(0) * GUN[0].s * 0.5);
    // nabíječ: pro každý náboj jedna cesta ze zásoby k závěru (nese ho), na místě ho zasune, vrátí se a čeká; jinak stojí
    const HOME = 28, BREECH = 56;
    let lx = HOME, mode = 'idle', carry = false, shellX = 0, shellY = 0;
    for (const [t0, who] of SHOTS) if (!who) {
      const a = t0 - 1.1, b = t0 - 0.3, c = t0 + 0.05, d = t0 + 0.15, e = t0 + 0.95;
      if (t >= a && t < b) { lx = HOME + (BREECH - HOME) * ((t - a) / (b - a)); mode = 'east'; carry = true; }
      else if (t >= b && t < c) { lx = BREECH; mode = 'load'; carry = true; }
      else if (t >= d && t < e) { lx = BREECH - (BREECH - HOME) * ((t - d) / (e - d)); mode = 'west'; }
      else if (t >= e - 0.01 && t < t0 + 1.0) lx = HOME;
      else if (t >= c && t < d) { lx = BREECH; mode = 'load'; }
    }
    const lfoot = 314;
    if (mode === 'east' || mode === 'west') put(pose(k, 'walk', mode, t, 5), lx, lfoot, 1.9);
    else put(tex[k]?.[mode === 'load' ? 'east' : 'east'] ?? tex[k]?.south, lx, lfoot, 1.9);
    // velitel baterie s dalekohledem u valu: při výstřelu sebou trhne
    const kick = SHOTS.some(([t0, who]) => !who && t - t0 > 0 && t - t0 < 0.16) ? -1 : 0;
    put(tex[key(side, 'officer')]?.east ?? tex[k]?.east, 126 + kick, 310, 1.6, 'rgba(14,13,12,0.12)');
    g.fillStyle = P.ink; g.fillRect(136 + kick, 281, 6, 3); g.fillStyle = P.mud3; g.fillRect(136 + kick, 281, 6, 1); // dalekohled
    // výstřely: záblesk, kouř z hlavně, prach od země kolem lafety
    SHOTS.forEach(([t0, who]) => {
      const u = t - t0, G = GUN[who], [mx, my] = muzzle(who);
      if (u > 0 && u < 0.5) { glow(g, mx, my, 28 * G.s, '#d98f3f', 1.4 * (1 - u / 0.5)); glow(g, mx, my, 13 * G.s, '#fff6dc', 1.5 * clamp01(1 - u / 0.2)); }
      if (u > 0.05 && u < 2.6) for (let i = 0; i < 8; i++) { const a = u - 0.05 - i * 0.06; if (a > 0) { g.fillStyle = `rgba(${i % 2 ? '120,108,98' : '86,76,70'},${(0.5 * (1 - u / 2.6)).toFixed(2)})`; g.beginPath(); g.ellipse(mx + a * 18 * G.s + i * 2.2 * G.s, my - a * 9 * G.s - i * 1.6 * G.s, (1.2 + a * 3.2) * G.s, (1.2 + a * 2.6) * G.s, 0, 0, Math.PI * 2); g.fill(); } }
      if (u > 0 && u < 1.1) { const q = u / 1.1; g.fillStyle = `rgba(196,184,160,${(0.35 * (1 - q)).toFixed(2)})`; g.beginPath(); g.ellipse(G.x + 6 * G.s, G.y + 1 * G.s, (10 + q * 30) * G.s, (2 + q * 3) * G.s, 0, 0, Math.PI * 2); g.fill(); }
      if (u > 0 && u < 0.12) { g.fillStyle = 'rgba(255,214,150,0.16)'; g.fillRect(-6, -6, W + 12, H + 12); }
    });
    // dráhy granátů s dithered stopou
    SHOTS.forEach(([t0, who], i) => {
      const p = (t - t0 - 0.12) / 1.13;
      if (p <= 0 || p >= 1) return;
      const [x0, y0] = muzzle(who), [xt, yt] = TGT[i];
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


  // ====================================================================================================
  // 6) HROBY: první noc bombardování, hroby padlých, vojáci před nimi, v dálce dopadají granáty
  //    volby: side (strana padlých), n (počet padlých; hroby se kreslí do 12), names (příjmení pro jmenovky prvních hrobů)
  // ====================================================================================================
  {
    const c = off(W, H), cg = c.getContext('2d');
    sky(cg, 0, 206, ['#12141a', '#1f2129', '#34323b', '#523a39', '#7c4333', '#a8582b']);
    for (let k = 0; k < 7; k++) { cg.fillStyle = k % 2 ? 'rgba(18,20,26,0.75)' : 'rgba(52,50,59,0.6)'; cg.fillRect(Math.round(k * 29 - 14), 18 + k * 23, 78, 6); }
    for (const [base, col, amp, ph] of [[188, '#2a2328', 12, 0.9], [200, '#1c181b', 9, 2.4]]) {
      for (let x = 0; x < W; x++) { cg.fillStyle = col; cg.fillRect(x, Math.round(base - amp * (0.5 + 0.5 * Math.sin(x * 0.05 + ph)) - amp * 0.35 * Math.sin(x * 0.16)), 1, 60); }
    }
    const rr = rng(41);
    for (let i = 0; i < 26; i++) { const x = Math.round(rr() * W), h = 5 + Math.round(rr() * 6); cg.fillStyle = '#141113'; for (let k = 0; k < h; k++) { const w = Math.max(1, Math.round(k * 0.35)); cg.fillRect(Math.round(x - w / 2), 202 - h + k, w, 1); } }
    for (let y = 204; y < H; y++) for (let x = 0; x < W; x++) { cg.fillStyle = by(x, y) < 0.5 - (y - 204) / 300 ? P.mud1 : P.mud0; cg.fillRect(x, y, 1, 1); }
    for (let i = 0; i < 160; i++) { cg.fillStyle = rr() < 0.5 ? P.mud2 : P.olive3; cg.fillRect(Math.floor(rr() * W), 206 + Math.floor(rr() * 112), 1, 1 + (rr() < 0.4 ? 1 : 0)); }
    for (const [x, y, w] of [[24, 232, 22], [150, 246, 26], [96, 224, 14]]) { cg.fillStyle = P.ink; cg.beginPath(); cg.ellipse(x, y, w / 2, w / 6 + 0.5, 0, 0, Math.PI * 2); cg.fill(); cg.fillStyle = P.mud2; cg.fillRect(Math.round(x - w / 2), Math.round(y - w / 6 - 1), Math.round(w * 0.5), 1); }
    L.graves = c;
  }
  const grave = (cx, foot, s, name, extra = {}) => { // dřevěný kříž na mohyle, jmenovka, helma, kytice
    const w = Math.round(14 * s), h = Math.round(5 * s);
    g.fillStyle = P.ink; g.beginPath(); g.ellipse(cx, foot - h / 2 + 1, w / 2 + 1, h / 2 + 1, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = P.mud2; g.beginPath(); g.ellipse(cx, foot - h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = P.mud3; g.fillRect(Math.round(cx - w / 3), Math.round(foot - h + 1), Math.round(w * 0.5), 1);
    const ph = Math.round(20 * s), bw = Math.max(2, Math.round(2.2 * s));
    g.fillStyle = P.ink; g.fillRect(Math.round(cx - bw / 2 - 1), foot - h - ph, bw + 2, ph + 1);
    g.fillStyle = P.mud3; g.fillRect(Math.round(cx - bw / 2), foot - h - ph + 1, bw, ph - 1);
    g.fillStyle = P.sand; g.fillRect(Math.round(cx - bw / 2), foot - h - ph + 1, 1, ph - 1);
    const ay = foot - h - Math.round(ph * 0.68), aw = Math.round(11 * s);
    g.fillStyle = P.ink; g.fillRect(Math.round(cx - aw / 2 - 1), ay - 1, aw + 2, bw + 2);
    g.fillStyle = P.mud3; g.fillRect(Math.round(cx - aw / 2), ay, aw, bw); g.fillStyle = P.sand; g.fillRect(Math.round(cx - aw / 2), ay, aw, 1);
    if (name && s >= 1.2) {
      const tw = txtW(name, 1), pw = Math.max(tw + 4, 14);
      g.fillStyle = P.ink; g.fillRect(Math.round(cx - pw / 2 - 1), ay + bw + 2, pw + 2, 9);
      g.fillStyle = P.bone; g.fillRect(Math.round(cx - pw / 2), ay + bw + 3, pw, 7);
      txt(g, name, Math.round(cx - tw / 2), ay + bw + 4, 1, P.ink);
    }
    if (extra.helmet) { const hy = foot - h - ph - 1; g.fillStyle = P.ink; g.beginPath(); g.ellipse(cx, hy, 3.6 * s, 2.4 * s, 0, Math.PI, 0); g.fill(); g.fillStyle = P.steel; g.beginPath(); g.ellipse(cx, hy, 2.8 * s, 1.8 * s, 0, Math.PI, 0); g.fill(); g.fillStyle = P.grey; g.fillRect(Math.round(cx - s), Math.round(hy - 1.6 * s), Math.max(1, Math.round(s)), 1); }
    if (extra.flowers) for (let i = 0; i < 3 + Math.round(s); i++) { g.fillStyle = i % 2 ? P.rust : P.gold; g.fillRect(Math.round(cx - w / 3 + i * (w / 3.5)), foot - h + 1 + (i % 2), 1, 1); }
  };
  const BURSTS = [[0.4, 30, 192], [1.2, 118, 196], [2.0, 66, 190], [2.9, 152, 194], [3.7, 12, 196], [4.5, 96, 192], [5.4, 138, 190], [6.3, 48, 195], [7.2, 124, 193], [8.0, 80, 191]];
  scene.graves = (t, o) => {
    const side = o.side ?? 0, k = key(side), n = o.n ?? null, names = (o.names || []).map((x) => String(x).toUpperCase().slice(0, 7));
    let sh = 0;
    for (const [t0] of BURSTS) { const v = shakeOf(t - t0 - 0.35, 0.5) * 0.5; if (Math.abs(v) > Math.abs(sh)) sh = v; }
    g.setTransform(1, 0, 0, 1, Math.round(sh), Math.round(sh * 0.4));
    g.drawImage(L.graves, -3, -3, W + 6, H + 6);
    for (const [t0, x, y] of BURSTS) {
      const u = t - t0; if (u < 0 || u > 1.6) continue;
      glow(g, x, y - 4, 34 * (1 - u / 1.6) + 8, '#d98f3f', 1.1 * Math.exp(-u * 2.2));
      blast(g, x, y, u, 0.45 + (x % 3) * 0.08, ['#7e3b2a', '#2a2328', '#1c181b', '#34323b'], 4);
    }
    const total = Math.min(12, n ?? 5), rows = [[3, 1.5, 252], [4, 1.15, 236], [5, 0.85, 222]];
    let gi = 0; const front = [];
    for (const [cnt, s, foot] of rows) for (let i = 0; i < cnt && gi < total; i++, gi++) {
      const cx = Math.round(24 + (i + (cnt < 5 ? 0.5 : 0.3)) * (W - 48) / cnt + Math.sin(gi * 2.3) * 3);
      front.push([cx, foot, s, gi]);
    }
    front.sort((a, b) => a[1] - b[1]);
    for (const [cx, foot, s, idx] of front) grave(cx, foot, s, idx < 3 ? names[idx] : null, { helmet: idx % 2 === 0, flowers: idx % 3 !== 1 });
    glow(g, 40, 254, 20, '#d98f3f', 0.55 + 0.15 * Math.sin(t * 9) + 0.08 * Math.sin(t * 23), 0.7);
    const stand = [[46, 314, 2.1], [90, 318, 2.2], [136, 312, 2.0]];
    stand.forEach(([x, foot, s], i) => put(pose(k, 'idle', 'north', t + i * 0.7, 3) || tex[k]?.north, x, foot + Math.round(Math.sin(t * 0.9 + i) * 0.6), s, 'rgba(14,13,12,0.28)'));
    for (let i = 0; i < 70; i++) { const rx = (i * 37 + t * 38) % W, ry = (i * 53 + t * 190) % H; g.fillStyle = 'rgba(163,151,130,0.22)'; g.fillRect(Math.round(rx), Math.round(ry), 1, 3); }
    const fade = clamp01((t - 1.0) / 0.8);
    if (fade > 0) {
      const lab = n == null ? 'XX FALLEN' : `${n} FALLEN`, lw = txtW(lab, 3), bx = Math.round((W - lw) / 2);
      g.globalAlpha = fade; txt(g, lab, bx, 64, 3, P.white, P.ink); const sub = 'FIRST NIGHT OF THE BARRAGE', sw = txtW(sub, 1); txt(g, sub, Math.round((W - sw) / 2), 86, 1, P.pale, P.ink); g.globalAlpha = 1;
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
  };


  // ====================================================================================================
  // 7) NÁSTUPCE: po cestě k frontě v soumraku přichází nový voják z rodu padlého (jmenovka s číslem generace)
  //    volby: side, heir (jméno nástupce), house (příjmení rodu), gen (která generace)
  // ====================================================================================================
  const clean = (s) => String(s || '').toUpperCase().replace(/"[^"]*"/g, '').replace(/[^A-Z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
  const ordinal = (n) => `${n}${[, 'ST', 'ND', 'RD'][n] || 'TH'}`;
  const BURSTS2 = [[0.6, 24, 170], [1.9, 150, 166], [3.1, 70, 172], [4.4, 120, 168], [5.6, 40, 170], [6.8, 140, 172]];
  scene.heir = (t, o) => {
    const side = o.side ?? 0, k = key(side), heir = clean(o.heir) || 'NEW RECRUIT', house = clean(o.house) || '';
    g.drawImage(L.march, 0, 0);
    g.fillStyle = 'rgba(16,14,22,0.5)'; g.fillRect(0, 0, W, H); // soumrak
    for (const [t0, x, y] of BURSTS2) { const u = t - t0; if (u > 0 && u < 1.4) glow(g, x, y, 22 * (1 - u / 1.4) + 6, '#d98f3f', 1.0 * Math.exp(-u * 2.4)); }
    const p = easeOut(clamp01(t / 5.2)), d = 0.14 + 0.66 * p;
    const y = 178 + Math.pow(d, 1.15) * 150, cx = 96 - d * 6, s = 0.3 + d * 1.5, walking = p < 0.985;
    const bob = walking ? Math.abs(Math.sin(t * 6.5)) * s * 0.35 : 0;
    put(walking ? pose(k, 'walk', 'south', t, 7) : tex[k]?.south, cx, y - bob, s, 'rgba(16,14,22,0.12)');
    // jmenovka nahoře (mimo horní lištu IG)
    const fade = clamp01((t - 3.6) / 0.7);
    if (fade > 0) {
      g.globalAlpha = fade;
      const w1 = txtW(heir, 2), bx = Math.max(6, Math.round((W - Math.max(w1, 100)) / 2) - 4);
      const bw = Math.max(w1, 100) + 8;
      g.fillStyle = P.ink; g.fillRect(bx - 2, 58, bw + 4, 38); g.fillStyle = P.gold; g.fillRect(bx - 1, 59, bw + 2, 36); g.fillStyle = P.dark; g.fillRect(bx, 60, bw, 34);
      txt(g, heir, Math.round((W - w1) / 2), 65, 2, P.white, P.ink);
      const line = `${ordinal(o.gen || 2)} OF THE HOUSE OF ${house}`, lw = txtW(line, 1);
      txt(g, line, Math.round((W - lw) / 2), 82, 1, P.pale);
      txt(g, 'REPORTS FOR DUTY', Math.round((W - txtW('REPORTS FOR DUTY', 1)) / 2), 89, 1, P.gold);
      g.globalAlpha = 1;
    }
  };

  // ====================================================================================================
  // 8) RODOKMEN: pergamen se jménem rodu, padlý nahoře (kříž), nástupce pod ním; čára se kreslí a rod pokračuje
  //    volby: side, house, fallen (jméno padlého), heir, gen, day
  // ====================================================================================================
  scene.lineage = (t, o) => {
    const side = o.side ?? 0, k = key(side), house = clean(o.house) || 'HOUSE', fallen = clean(o.fallen) || 'THE FALLEN', heir = clean(o.heir) || 'THE HEIR', gen = o.gen || 2, day = o.day ?? '';
    // tmavý podklad s pergamenem
    g.fillStyle = P.dark; g.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 2) { if ((y / 2) % 3 === 0) { g.fillStyle = P.ink; g.fillRect(0, y, W, 1); } }
    const px0 = 12, py0 = 50, pw = W - 24, ph = 214;
    g.fillStyle = P.ink; g.fillRect(px0 - 2, py0 - 2, pw + 4, ph + 4);
    for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) { g.fillStyle = by(x + px0, y + py0) < 0.5 - y / 600 ? P.pale : P.bone; g.fillRect(px0 + x, py0 + y, 1, 1); }
    g.fillStyle = P.mud3; g.fillRect(px0, py0, pw, 1); g.fillRect(px0, py0 + ph - 1, pw, 1);
    const cxm = W / 2;
    const head = `HOUSE OF ${house}`, hw = txtW(head, 2);
    txt(g, head, Math.round(cxm - hw / 2), py0 + 9, 2, P.mud1);
    g.fillStyle = P.mud2; g.fillRect(px0 + 14, py0 + 24, pw - 28, 1);
    // generace 1: padlý (kříž, jméno, datum)
    const a = easeOut(clamp01((t - 0.4) / 0.8));
    const n1y = py0 + 38;
    g.globalAlpha = a;
    const cr = (x, y) => { g.fillStyle = P.ink; g.fillRect(x - 1, y - 1, 5, 18); g.fillRect(x - 4, y + 3, 11, 4); g.fillStyle = P.mud3; g.fillRect(x, y, 3, 16); g.fillRect(x - 3, y + 4, 9, 2); };
    cr(Math.round(cxm - 1), n1y);
    const w1 = txtW(fallen, 1); txt(g, fallen, Math.round(cxm - w1 / 2), n1y + 22, 1, P.ink);
    const f1 = `GEN 1 · FELL DAY ${day}`, fw1 = txtW(f1, 1); txt(g, f1, Math.round(cxm - fw1 / 2), n1y + 30, 1, P.rust);
    g.globalAlpha = 1;
    // čára dolů (kreslí se)
    const lp = clamp01((t - 1.6) / 1.0), ly0 = n1y + 40, ly1 = py0 + 112;
    g.fillStyle = P.mud1; g.fillRect(Math.round(cxm), ly0, 1, Math.round((ly1 - ly0) * lp)); g.fillRect(Math.round(cxm) - 1, ly0, 1, Math.round((ly1 - ly0) * lp));
    if (lp > 0.95) { g.fillStyle = P.mud1; g.fillRect(Math.round(cxm) - 3, ly1 - 1, 7, 2); }
    // generace 2: nástupce (sprit ze hry, jméno, nástup do služby)
    const b = easeOut(clamp01((t - 2.8) / 0.7));
    if (b > 0) {
      g.globalAlpha = b;
      put(t > 3.6 ? tex[k]?.south : pose(k, 'idle', 'south', t, 3) || tex[k]?.south, cxm, ly1 + 52 - (1 - b) * 10, 1.55);
      g.globalAlpha = 1;
      const w2 = txtW(heir, 1); txt(g, heir, Math.round(cxm - w2 / 2), ly1 + 56, 1, P.ink);
      const f2 = `GEN ${gen} · SERVES FROM DAY ${day}`, fw2 = txtW(f2, 1); txt(g, f2, Math.round(cxm - fw2 / 2), ly1 + 64, 1, P.olive2);
    }
    // závěr
    const c = clamp01((t - 4.8) / 0.8);
    if (c > 0) {
      g.globalAlpha = c;
      const l1 = 'THE NAME DOES NOT DIE OUT.', w3 = txtW(l1, 1); txt(g, l1, Math.round(cxm - w3 / 2), py0 + ph - 22, 1, P.mud1);
      const l2 = 'YOUR SOLDIER HAS A HOUSE TOO.', w4 = txtW(l2, 1); txt(g, l2, Math.round(cxm - w4 / 2), py0 + ph - 12, 1, P.rust);
      g.globalAlpha = 1;
    }
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
