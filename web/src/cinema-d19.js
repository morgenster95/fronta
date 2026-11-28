// Filmové scény Day reelu Day 19 (28. 11. 2026). Kreslené scény míst, která na mapě hry nejsou: nádraží v Haldenu (první z rodu Acquillae přijíždí), zemljanka s palandou (pes čeká).
// Pravidla (CLAUDE.md): měřítko 1:1 jako hra (voják 19×30 px, 1 px ≈ 5,8 cm), rekvizity z PixelLabu zmenšené podle skutečné velikosti (tools/fit-props.py),
// terén v kódu paletou Trench-24 s ditheringem, žádná průhlednost postav, jen pár postav a vždy celé vidět, žádné vstupy a zmizení uprostřed scény.
//  • station – úsvit na nádraží v Haldenu: lavička, kufr, konev, lucerna, stůl intendanta; Edmund Acquillae dostane stuhu First Wave („Don't let the mud have it“)
//  • bunk – zemljanka v noci: palanda, lucerna, miska; pes Toby leží u prázdné palandy, přijde nový muž (Ulrich) a pes k němu dojde a sedne si
import { off } from './cinema.js';
import { loadImage } from './assets.js';
import benchSrc from '../../art/cine/prop_bench.png';
import suitSrc from '../../art/cine/prop_suitcase.png';
import churnSrc from '../../art/cine/prop_churn.png';
import lampSrc from '../../art/cine/prop_stlamp.png';
import bunkSrc from '../../art/cine/prop_bunk.png';
import bowlSrc from '../../art/cine/prop_bowl.png';
import stoolSrc from '../../art/cine/prop_stool.png';
import cartSrc from '../../art/cine/prop_cart.png';
import tableSrc from '../../art/cine/prop_recruit_table.png';
import lanternSrc from '../../art/cine/prop_lantern_post.png';

let W = 90, H = 160;
const SIZE = { station: [90, 160], bunk: [90, 160] };
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

export async function makeDay19Scenes(tex = {}, anims = {}) {
  const canvas = off(W, H);
  const g = canvas.getContext('2d');
  g.imageSmoothingEnabled = false;
  const A = (k, a, d, tint) => (anims[k]?.[a]?.[d] || []).map((t) => sprite(t, tint));
  const prop = async (src, tint) => tinted(await loadAny(src), tint);
  const DAWN = 'rgba(120,80,70,0.07)', FROST = 'rgba(150,170,200,0.10)';
  const DAWN2 = 'rgba(120,80,70,0.07)', NIGHT = 'rgba(30,38,70,0.12)';
  const dogSit = await loadAny('/assets/props/dog_shepherd_sit.png'), dogLie = await loadAny('/assets/props/dog_shepherd_lie.png');
  const S = { walkE: A('hegemony', 'walk', 'east', DAWN2), standE: sprite(tex.hegemony?.east, DAWN2), stand: sprite(tex.hegemony?.south, DAWN2), officer: sprite(tex.hegemony_officer?.south, DAWN2),
    walkN: A('hegemony', 'walk', 'west', NIGHT), standN: sprite(tex.hegemony?.west, NIGHT) };
  const R = {
    bench: await prop(benchSrc, DAWN2), suit: await prop(suitSrc, DAWN2), churn: await prop(churnSrc, DAWN2), lamp: await prop(lampSrc, DAWN2), cart: await prop(cartSrc, DAWN2), table: await prop(tableSrc, DAWN2),
    bunk: await prop(bunkSrc, NIGHT), bowl: await prop(bowlSrc, NIGHT), stool: await prop(stoolSrc, NIGHT), lantern: await prop(lanternSrc, null),
    dogSit: tinted(dogSit, NIGHT), dogLie: tinted(dogLie, NIGHT),
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

  const word = (txt, x0, y0, col) => { const G = { H: '101101111101101', A: '010101111101101', L: '100100100100111', D: '110101101101110', E: '111100110100111', N: '111101101101101' }; g.fillStyle = col; [...txt].forEach((ch, i) => { const bits = G[ch]; if (!bits) return; for (let k = 0; k < 15; k++) if (bits[k] === '1') g.fillRect(x0 + i * 4 + (k % 3), y0 + Math.floor(k / 3), 1, 1); }); };
  const scenes = {
    station(t) {
      // úsvit: obloha a siluety městečka, prkenná budova nádraží s cedulí HALDEN, nástupiště, kolejnice; intendant za stolem, Edmund přijde a dostane stuhu
      field(0, 62, ['#2a3138', '#4b4560', '#7a5560', P.fire, P.gold], (x, y) => y / 62);
      glow(70, 60, 30, 0.45, '240,190,120');
      for (let k = 0; k < 8; k++) { const hx = 2 + k * 11, hh = 5 + Math.floor(hash(k, 1, 3) * 6); px(P.dusk, hx, 62 - hh, 8, hh); px(P.ink, hx + 1, 62 - hh + 2, 1, 1); } // siluety domů
      px(P.dusk, 38, 44, 3, 18); px(P.dusk, 37, 44, 5, 3); // věž
      field(62, 160, [P.mud0, P.mud1, P.mud2], (x, y) => 0.1 + 0.3 * ((y - 62) / 98));
      // budova nádraží: prkna, střecha, dveře, okno se světlem, cedule HALDEN
      for (let y = 70; y < 120; y++) for (let x = 0; x < W; x++) { const seam = x % 7 === 0, n = hash(x / 7 | 0, y >> 2, 17); px(seam ? P.ink : (n < 0.4 ? P.rust2 : n < 0.8 ? P.mud2 : P.rust), x, y); }
      px(P.ink, 0, 66, W, 4); px(P.rust2, 0, 67, W, 2); px(P.ink, 0, 119, W, 2);
      px(P.ink, 50, 84, 14, 35); px(P.mud0, 51, 85, 12, 34); px(P.ink, 56, 85, 1, 34);
      px(P.ink, 12, 84, 18, 14); px(P.gold, 13, 85, 16, 12); px(P.ink, 20, 85, 1, 12); px(P.ink, 13, 90, 16, 1); glow(21, 91, 22, 0.35, '240,190,110');
      px(P.ink, 28, 72, 34, 9); px(P.pale, 29, 73, 32, 7); word('HALDEN', 31, 74, P.rust2);
      // nástupiště (prkna) a okraj s kolejemi
      for (let y = 121; y < 150; y++) for (let x = 0; x < W; x++) { const pl = (y - 121) / 4 | 0, n = hash(x >> 3, pl, 19); px((y - 121) % 4 === 0 ? P.ink : (n < 0.4 ? P.mud1 : n < 0.8 ? P.mud2 : P.mud3), x, y); }
      px(P.ink, 0, 150, W, 2); field(152, 160, [P.mud0, P.mud1], (x, y) => 0.3 + 0.5 * hash(x, y, 5));
      for (let x = 0; x < W; x += 6) px(P.mud3, x, 154, 4, 1); px(P.steel, 0, 156, W, 1); px(P.grey, 0, 155, W, 1);
      // rekvizity (zadní nejdřív): lucerna, lavička, konev, vozík, kufr, stůl intendanta
      tl(R.lamp, 4, 84); tl(R.bench, 30, 100 + 22 - 22); put(R.churn, 80, 128); put(R.cart, 70, 140); put(R.suit, 24, 138);
      tl(R.table, 52, 124); put(R.officer, 66, 134);
      // pára z lokomotivy zleva
      for (let k = 0; k < 4; k++) { const u = ((t * 0.35 + k * 0.25) % 1), cx2 = 6 + u * 30 + k * 3, cy2 = 100 - u * 50; g.fillStyle = `rgba(227,217,195,${0.35 * (1 - u)})`; g.beginPath(); g.arc(cx2, cy2, 3 + u * 5, 0, 7); g.fill(); }
      // Edmund přijde po nástupišti, u stolu se zastaví; stuha (ocel, zlatý pruh) přeletí ze stolu na hruď
      const stop = 3.4, ex = t < stop ? -8 + 52 * (t / stop) : 44;
      if (t < stop) put(at(S.walkE, t, 7), ex, 142); else put(S.standE, 44, 142);
      if (t > stop + 0.6 && t < stop + 1.8) { const u = clamp((t - stop - 0.6) / 1.0); const rx = 56 - 10 * u, ry = 130 - 6 - 4 * Math.sin(u * Math.PI); px(P.ink, rx - 1, ry - 1, 5, 7); px(P.steel, rx, ry, 3, 5); px(P.gold, rx + 1, ry, 1, 5); }
      if (t >= stop + 1.8) { px(P.ink, 43, 127, 5, 7); px(P.steel, 44, 128, 3, 5); px(P.gold, 45, 128, 1, 5); const k = (Math.sin(t * 7) + 1) / 2; glow(45, 130, 7, 0.2 + 0.3 * k, '240,200,110'); }
      g.fillStyle = 'rgba(100,60,50,0.05)'; g.fillRect(0, 0, W, H);
    },
    bunk(t) {
      // zemljanka v noci: hliněná zeď s trámy (do výšky 96), podlaha níž; palanda u zdi, tally čárky dní, kabát na hřebíku, fotka, lucerna visí z trámu; pes leží u misky, přijde Ulrich, pes vstane, dojde k němu a sedne si
      field(0, 96, [P.ink, P.dark, P.mud0, P.mud1], (x, y) => 0.1 + 0.28 * hash(x >> 2, y >> 1, 71) + 0.08 * ((y % 22) / 22));
      for (const bx of [3, 45, 85]) { px(P.ink, bx - 1, 0, 6, 96); px(P.mud2, bx, 0, 4, 96); px(P.mud3, bx, 0, 1, 96); }
      px(P.ink, 0, 14, W, 5); px(P.mud2, 0, 15, W, 3); px(P.mud3, 0, 15, W, 1); // vodorovný trám
      for (let y = 96; y < 160; y++) for (let x = 0; x < W; x++) { const pl = Math.floor(x / 9), seam = x % 9 === 0, n = hash(pl, (y >> 3) + pl, 41) * 0.5; px(seam ? P.ink : [P.mud0, P.mud1, P.mud2][Math.min(2, Math.floor(n * 3))], x, y); }
      px(P.mud3, 0, 95, W, 1); px(P.ink, 0, 96, W, 2);
      // lucerna visící z trámu: řetízek, tělo, světlo
      px(P.ink, 62, 19, 1, 44); px(P.ink, 59, 63, 7, 9); px(P.gold, 60, 64, 5, 7); px(P.yellow, 61, 65, 3, 4); px(P.ink, 59, 63, 7, 1);
      glow(62, 68, 54, 0.38, '217,143,63'); glow(62, 68, 16, 0.4, '250,215,130');
      // tally čárky (18 dní, po pěti) vlevo na zdi, kabát na hřebíku, fotka v rámečku
      for (let d = 0; d < 18; d++) { const gx = 8 + (d / 5 | 0) * 9, k = d % 5; if (k < 4) px(P.pale, gx + k * 2, 52, 1, 8); else for (let q = 0; q < 8; q++) px(P.pale, gx + q * 0.5 | 0, 60 - q);} 
      px(P.ink, 74, 44, 8, 1); px(P.ink, 77, 44, 2, 22); px(P.olive2, 75, 45, 6, 18); px(P.olive4, 75, 45, 2, 18); // kabát
      px(P.ink, 30, 62, 12, 14); px(P.pale, 31, 63, 10, 12); px(P.bone, 32, 65, 8, 6); px(P.mud2, 35, 68, 2, 3); // fotka
      put(R.bunk, 20, 110); put(R.stool, 54, 124); put(R.bowl, 36, 130);
      // pes: nejdřív leží u prázdné palandy, od 3,6 s vstane a dojde k Ulrichovi (poskakuje), pak sedí vedle něj
      const stop = 3.2, ux = t < stop ? 94 - 48 * (t / stop) : 46;
      const dogX = t < 3.6 ? 28 : (t < 5.4 ? 28 + 22 * ((t - 3.6) / 1.8) : 50);
      const trot = t >= 3.6 && t < 5.4;
      put(trot || t >= 5.4 ? R.dogSit : R.dogLie, dogX, 134 - (trot && Math.floor(t * 8) % 2 ? 1 : 0));
      if (t < stop) put(at(S.walkN, t, 7), ux, 144); else put(S.standN, 72, 144);
      g.fillStyle = 'rgba(20,24,44,0.12)'; g.fillRect(0, 0, W, H);
    },
  };
  return { canvas, draw(name, t) { const sz = SIZE[name] || [90, 160]; if (canvas.width !== sz[0]) { canvas.width = sz[0]; canvas.height = sz[1]; } W = sz[0]; H = sz[1]; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.imageSmoothingEnabled = false; scenes[name]?.(Math.max(0, t)); } };
}
