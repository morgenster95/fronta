// Filmové scény Day reelu Day 17 (26. 11. 2026). Stejné měřítko jako hra (vzor cinema-d14.js): 135×240 (×8) nebo 90×160 (×12),
// sprity a rekvizity ze hry 1:1, terén v kódu paletou Trench-24 s ditheringem, žádná průhlednost postav, vždy jen pár postav a celé vidět.
// Všechny scény nové (marketing/reels/scenes-used.json); příběh Cyrila „Doc“ Zaboravljeniho podle jeho deníku. Verze 2 (26. 11., uživatel: mizí vojáci,
// divné animace, nejasný děj): každá postava je ve scéně po celou dobu, pohybuje se jen skutečnými chůzemi se správným natočením, nic se nevynořuje.
//  • signing – úsvit prvního dne: plakát „FIRST WAVE“ (kresba v našem stylu, voják ze hry), stůl s důstojníkem; Cyril přijde, zasalutuje, zlatý záblesk knoflíku
//  • letter  – kryt, noc: svíčka, dopis od matky, do okrajů dopisu se po jedné kreslí tváře kamarádů (bez postav)
//  • raid    – noc, světlice: střižený drát, raider Concordu odchází, Cyril leží raněný, medik přijde a obvazuje
//  • duel    – večer: Cyril na pytlích střílí (animace fire), tři nepřátelé jdou k drátu, dva padnou, třetí couvne
import { off } from './cinema.js';
import { loadImage } from './assets.js';
import propCratesSrc from '../../art/cine/prop_crates.png';
import stretcherSrc from '../../art/cine/prop_stretcher.png';

let W = 135, H = 240;
const SIZE = { signing: [90, 160], letter: [90, 160], raid: [90, 160], duel: [135, 240] };
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
  const DAWN = 'rgba(120,80,70,0.16)', CAND = 'rgba(120,70,20,0.16)', NIGHT = 'rgba(30,38,70,0.3)', DUSK = 'rgba(70,50,60,0.2)', SEPIA = 'rgba(140,100,50,0.45)';
  const A = (k, a, d, tint) => (anims[k]?.[a]?.[d] || []).map((t) => sprite(t, tint));
  const prop = async (src, tint) => tinted(await loadAny(src), tint);
  const S = {
    walkE: A('hegemony', 'walk', 'east', DAWN), saluteE: A('hegemony', 'salute', 'east', DAWN), standE: sprite(tex.hegemony?.east, DAWN), officer: sprite(tex.hegemony_officer?.south, DAWN), poster: sprite(tex.hegemony?.south, SEPIA),
    lyN: sprite((anims.hegemony?.['lying-wounded']?.east || [])[0], NIGHT), bandN: A('hegemony_medic', 'bandage', 'east', NIGHT), medN: A('hegemony_medic', 'walk', 'west', NIGHT), raiderW: A('concord', 'walk', 'west', NIGHT),
    fireS: A('hegemony', 'fire', 'south', DUSK), enemyN: A('concord', 'walk', 'north', DUSK), enemyS: A('concord', 'walk', 'south', DUSK), die: A('concord', 'die', 'north', DUSK),
  };
  const R = {
    wire: await Promise.all([0, 1, 2].map((i) => prop(`/assets/props/wire_intact_${i}.png`, DUSK))),
    broken: await Promise.all([0, 1, 2].map((i) => prop(`/assets/props/wire_broken_${i}.png`, NIGHT))),
    crater: await prop('/assets/props/crater_water.png', DUSK), stretcher: await prop(stretcherSrc, NIGHT), crates: await prop(propCratesSrc, CAND),
  };
  const feet = new Map();
  const at = (arr, t, fps) => (arr?.length ? arr[Math.floor(t * fps) % arr.length] : null);
  const once = (arr, t, fps) => (arr?.length ? arr[Math.max(0, Math.min(arr.length - 1, Math.floor(t * fps)))] : null);
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
  const label = (txt, x, y, col) => { g.fillStyle = col; g.font = '8px Silkscreen, monospace'; g.textBaseline = 'top'; g.fillText(txt, x, y); };

  const scenes = {
    signing(t) {
      // úsvit: dřevěná stěna s plakátem FIRST WAVE (papír, rámeček, voják ze hry v sépii), stůl s důstojníkem; Cyril přijde zleva, zasalutuje
      field(0, 60, ['#3a3048', '#7a5560', P.fire, P.gold], (x, y) => y / 60);
      glow(70, 60, 40, 0.5, '230,170,110');
      field(60, H, [P.mud0, P.mud1, P.mud2], (x, y) => 0.3 + 0.35 * hash(x >> 2, y >> 2, 171));
      for (let y = 18; y < 100; y++) for (let x = 0; x < W; x++) px(((x + (y >> 3) * 5) % 9 === 0) ? P.ink : (y % 8 === 0 ? P.mud1 : P.mud2), x, y);
      px(P.ink, 0, 17, W, 1); px(P.ink, 0, 100, W, 1);
      // plakát v našem stylu: tmavý rámeček, krémový papír, červený pruh s nápisem, voják v sépii, pruh dole
      px(P.ink, 10, 21, 70, 80); px(P.white, 12, 23, 66, 76); px(P.pale, 12, 88, 66, 11);
      px(P.rust, 12, 23, 66, 14); px(P.rust2, 12, 36, 66, 1);
      label('FIRST WAVE', 15, 27, P.white);
      px(P.mud1, 12, 38, 66, 50); field(38, 88, [P.mud2, P.sand, P.bone], (x, y) => 0.3 + 0.4 * hash(x >> 1, y >> 1, 177)); // pozadí obrazu
      put(S.poster, 45, 86); put(S.poster, 25, 86); put(S.poster, 65, 86);
      px(P.ink, 12, 87, 66, 1); label('SIGN TODAY', 17, 89, P.rust2);
      // stůl s knihou a důstojníkem
      put(S.officer, 70, 134); // důstojník stojí ZA stolem (stůl se kreslí přes jeho nohy)
      px(P.ink, 52, 120, 36, 3); px(P.mud3, 52, 121, 36, 16); px(P.mud1, 52, 135, 36, 2); px(P.ink, 54, 136, 2, 16); px(P.ink, 84, 136, 2, 16);
      px(P.white, 62, 117, 16, 4); px(P.pale, 62, 117, 16, 1);
      // Cyril: přichází zleva chůzí (east), u stolu stojí, pak zasalutuje (east) a zůstane v pozdravu
      const arrive = 3.0, x = Math.min(34, -6 + t * (40 / arrive));
      if (t < arrive) put(at(S.walkE, t, 7), Math.round(x), 150);
      else put(once(S.saluteE, t - arrive - 0.2, 7), 34, 150);
      if (t > arrive + 1.8) { const k = (Math.sin(t * 6) + 1) / 2; px(P.gold, 33, 132, 1, 1); glow(33, 132, 6, 0.25 + 0.4 * k, '240,200,110'); }
      g.fillStyle = 'rgba(100,60,50,0.08)'; g.fillRect(0, 0, W, H);
    },
    letter(t) {
      // kryt, noc: dřevěné stěny, bedna jako stůl, svíčka, dopis; do okrajů se po jedné kreslí tváře kamarádů (žádné postavy, nic nemizí)
      field(0, H, [P.ink, P.dark, P.mud0], (x, y) => 0.15 + 0.3 * hash(x >> 2, y >> 2, 173));
      for (let y = 0; y < H; y += 14) { px(P.mud1, 0, y, W, 1); px(P.ink, 0, y + 1, W, 1); }
      for (let x = 6; x < W; x += 22) { px(P.ink, x, 0, 3, H); px(P.mud2, x, 0, 1, H); }
      const fl = 0.85 + 0.15 * Math.sin(t * 9) * Math.sin(t * 3.7);
      glow(48, 92, 52, 0.55 * fl, '217,143,63'); glow(48, 92, 20, 0.4 * fl, '255,210,140');
      put(R.crates, 48, 118);
      px(P.mud3, 14, 108, 62, 4); px(P.ink, 14, 112, 62, 1);
      px(P.ink, 13, 78, 64, 31); px(P.white, 14, 79, 62, 29); px(P.pale, 14, 106, 62, 2);
      label('DEAR DOC,', 18, 81, P.dark);
      for (let y = 93; y < 105; y += 3) px(P.sand, 18, y, 26 + (y % 6), 1);
      const faces = [[50, 92], [59, 92], [68, 92]];
      faces.forEach(([x, y], i) => { const k = clamp((t - 0.8 - i * 1.5) / 1.0); if (k <= 0) return; const rows = Math.ceil(k * 8); const L = (r, ox, w) => { if (r < rows) px(P.dark, x + ox, y + r, w, 1); }; L(0, 1, 5); L(1, 0, 7); L(2, 0, 1); L(2, 6, 1); for (let r = 3; r < 6; r++) { L(r, 0, 1); L(r, 6, 1); } L(6, 1, 1); L(6, 5, 1); L(7, 2, 3); if (k > 0.6) { px(P.dark, x + 2, y + 3, 1, 1); px(P.dark, x + 4, y + 3, 1, 1); px(P.rust, x + 2, y + 5, 3, 1); } });
      const pk = clamp((t - 0.8) / 4.5); px(P.gold, 62 - pk * 15, 90 + (Math.floor(t * 8) % 2), 5, 1); px(P.ink, 67 - pk * 15, 90 + (Math.floor(t * 8) % 2), 1, 1);
      px(P.white, 79, 98, 3, 9); px(P.ink, 78, 107, 5, 1); px(P.gold, 80, 96 - (fl > 0.93 ? 1 : 0), 1, 2); px(P.white, 80, 96, 1, 1);
      g.fillStyle = 'rgba(10,8,20,0.22)'; g.fillRect(0, 0, W, 50);
    },
    raid(t) {
      // noc, světlice: zákop dole, nad ním střižený drát; raider Concordu odchází doleva po drátu, Cyril leží v zákopu, medik přijde a obvazuje
      field(0, H, [P.ink, P.dark, P.mud0, P.mud1], (x, y) => 0.1 + 0.28 * hash(x >> 2, y >> 2, 178) + (y > 90 ? 0.18 : 0));
      const u = (t % 5) / 5; glow(30 + u * 40, 26, 46, 0.4 * Math.sin(u * Math.PI), '220,230,255'); // světlice
      for (const [x, y, i] of [[14, 56, 0], [44, 60, 1], [74, 56, 2]]) put(R.broken[i], x, y);
      bags(86, 2, -8, W + 8);
      for (let y = 110; y < H; y += 12) { px(P.mud2, 8, y, 74, 7); px(P.mud3, 8, y, 74, 1); }
      put(at(S.raiderW, t, 7), Math.round(100 - t * 14), 76); // raider odchází přes drát (zleva doprava mimo záběr)
      put(R.stretcher, 28, 140); put(S.lyN, 28, 136);
      const arrive = 2.6, mx = Math.max(62, 110 - t * (48 / arrive));
      if (t < arrive) put(at(S.medN, t, 7), Math.round(mx), 142);
      else put(at(S.bandN, t - arrive, 6), 62, 142);
      glow(45, 140, 28, 0.12, '217,143,63');
      g.fillStyle = 'rgba(20,24,44,0.15)'; g.fillRect(0, 0, W, H);
    },
    duel(t) {
      // večer: nahoře pytle, Cyril střílí směrem dolů (fire south); tři nepřátelé jdou k drátu zdola; dva padnou (die north), třetí couvne
      field(0, 40, ['#3a3048', P.dusk, P.rust2], (x, y) => y / 40);
      field(40, H, [P.mud0, P.mud1, P.mud2], (x, y) => 0.3 + 0.38 * hash(x >> 2, y >> 2, 176));
      for (let x = 0; x < W; x++) if (hash(x, 4, 177) < 0.5) px(P.mud3, x, 110);
      bags(54, 2, 28, 108);
      put(R.wire[0], 28, 124); put(R.wire[1], 66, 126); put(R.wire[2], 106, 124); put(R.wire[0], 90, 144); put(R.crater, 22, 210);
      const T1 = 1.3, T2 = 3.0, T3 = 3.8;
      // enemy A (x 70) padne v T1, B (x 104) v T2, C (x 34) couvne po T3
      const walkN = (x, y0, hit) => { const dur = Math.min(t, hit); const y = y0 - dur * 14; if (t < hit) put(at(S.enemyN, t, 6), x, Math.round(y)); else put(once(S.die, t - hit, 8), x, Math.round(y)); };
      walkN(70, 215, T1); walkN(104, 225, T2);
      if (t < T3) put(at(S.enemyN, t, 6), 34, Math.round(228 - t * 14)); else put(at(S.enemyS, t, 6), 34, Math.round(228 - T3 * 14 + (t - T3) * 14));
      put(at(S.fireS, t, 9), 68, 66);
      const shot = (t0, tx, ty) => { const k = t - t0; if (k < 0 || k > 0.4) return; const a = clamp(1 - k * 4); glow(58, 60, 9, 0.9 * a, '255,230,170'); px(P.white, 57, 59, 2, 2); const m = clamp(k * 5); px(P.gold, 58 + (tx - 58) * m, 62 + (ty - 62) * m, 1, 3); };
      for (const [t0, tx, ty] of [[0.6, 70, 195 - 14 * 0.6], [1.0, 70, 215 - 14 * T1 - 4], [2.4, 104, 226 - 14 * 2.4], [2.8, 104, 225 - 14 * T2]]) shot(t0, tx, ty);
      const us = (T0) => (t > T0 && t < T0 + 0.4 ? 0.5 * (T0 + 0.4 - t) / 0.4 : 0);
      glow(70, 200 - 14 * T1, 16, us(T1), '220,40,40'); glow(104, 224 - 14 * T2, 16, us(T2), '220,40,40');
      const f = (t % 4) / 4; glow(60 + f * 50, 18, 36, 0.3 * Math.sin(f * Math.PI), '220,230,255'); // světlice
      g.fillStyle = 'rgba(40,30,60,0.12)'; g.fillRect(0, 0, W, H);
    },
  };
  return { canvas, draw(name, t, o = {}) { const sz = SIZE[name] || [135, 240]; if (canvas.width !== sz[0]) { canvas.width = sz[0]; canvas.height = sz[1]; } W = sz[0]; H = sz[1]; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.imageSmoothingEnabled = false; scenes[name]?.(Math.max(0, t), o); } };
}
