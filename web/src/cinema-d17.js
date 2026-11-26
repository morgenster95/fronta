// Filmové scény Day reelu Day 17 (26. 11. 2026). Stejné měřítko jako hra (vzor cinema-d14.js): 135×240 (×8) nebo 90×160 (×12),
// sprity a rekvizity ze hry 1:1, terén v kódu paletou Trench-24 s ditheringem, žádná průhlednost postav, vždy jen pár postav a celé vidět.
// Všechny scény nové (marketing/reels/scenes-used.json); příběh Cyrila „Doc“ Zaboravljeniho podle jeho deníku, jen nejzásadnější okamžiky.
// Verze 3 (26. 11., uživatel: nelogické, divná střelba, mrtví s vojákem nad sebou): v každé scéně žije nejvýš jeden nepřítel naráz, mrtví zůstávají ležet sami,
// střelba je výměna střel (Hegemonie střílí na jih, Concord na sever = proti sobě), sprity jen z her animací se správným směrem.
//  • signing – úsvit prvního dne: plakát „FIRST WAVE“ (kresba v našem stylu), stůl s důstojníkem; Cyril přijde a zasalutuje
//  • hit     – noc, Den 11: raider vyjde k drátu a střelí, Cyril padne, raider odejde, medik přijde a obvazuje
//  • promo   – úsvit, Den 16: důstojník, Cyril salutuje, nad ním naskočí zlaté stuhy (lance corporal)
//  • duel    – večer, Den 17: Cyril na pytlích; první nepřítel přijde k drátu, vymění si s ním střelbu a padne; po něm druhý
import { off } from './cinema.js';
import { loadImage } from './assets.js';
import propCratesSrc from '../../art/cine/prop_crates.png';
import stretcherSrc from '../../art/cine/prop_stretcher.png';

let W = 135, H = 240;
const SIZE = { signing: [90, 160], hit: [90, 160], promo: [90, 160], duel: [135, 240] };
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
    walkE: A('hegemony', 'walk', 'east', DAWN), saluteE: A('hegemony', 'salute', 'east', DAWN), officer: sprite(tex.hegemony_officer?.south, DAWN), poster: sprite(tex.hegemony?.south, SEPIA), officerW: sprite(tex.hegemony_officer?.west, DAWN), saluteP: A('hegemony', 'salute', 'east', DAWN),
    stand: sprite(tex.hegemony?.south, NIGHT), fireN: A('hegemony', 'fire', 'south', NIGHT), fall: A('hegemony', 'fall', 'south', NIGHT), lyN: sprite((anims.hegemony?.['lying-wounded']?.east || [])[0], NIGHT),
    medE: A('hegemony_medic', 'walk', 'east', NIGHT), bandN: A('hegemony_medic', 'bandage', 'east', NIGHT),
    rWalkN: A('concord', 'walk', 'north', NIGHT), rFireN: A('concord', 'fire', 'north', NIGHT), rWalkS: A('concord', 'walk', 'south', NIGHT),
    dFire: A('hegemony', 'fire', 'south', DUSK), dStand: sprite(tex.hegemony?.south, DUSK), eWalk: A('concord', 'walk', 'north', DUSK), eFire: A('concord', 'fire', 'north', DUSK), eKneel: A('concord', 'kneel', 'north', DUSK), eDie: A('concord', 'die', 'north', DUSK),
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
    hit(t) {
      // noc, Den 11: nahoře zákop (pytle) a Cyril, dole za drátem raider Concordu. Raider přijde, vymění si s Cyrilem střely, Cyril padne, raider odejde, medik přijde a obvazuje.
      field(0, H, [P.ink, P.dark, P.mud0, P.mud1], (x, y) => 0.1 + 0.28 * hash(x >> 2, y >> 2, 178));
      const fl = (t % 6) / 6; glow(20 + fl * 55, 30, 56, 0.4 * Math.sin(fl * Math.PI), '220,230,255'); // světlice
      bags(80, 2, -8, W + 8);
      for (const [x, y, i] of [[18, 124, 0], [48, 128, 1], [78, 124, 2]]) put(R.broken[i], x, y); // střižený drát
      
      // raider: přichází zdola k drátu (0–1,8 s), stojí a střílí (1,8–3,2 s), pak odchází dolů (od 3,8 s)
      const rx = 45;
      if (t < 1.8) put(at(S.rWalkN, t, 6), rx, Math.round(186 - t * 26));
      else if (t < 3.8) put(at(S.rFireN, t, 8), rx, 137);
      else put(at(S.rWalkS, t, 6), rx, Math.round(137 + (t - 3.8) * 26));
      // Cyril: do 1,0 stojí, od 1,0 do 3,2 střílí zpět, ve 3,2 je zasažen a padá (0,9 s), pak leží
      const cx = 48, cy = 78;
      if (t < 1.0) put(S.stand, cx, cy);
      else if (t < 3.2) put(at(S.fireN, t, 8), cx, cy);
      else if (t < 4.2) put(once(S.fall, t - 3.2, 8), cx, cy);
      else put(S.lyN, cx, cy);
      // záblesky výstřelů
      for (const t0 of [1.9, 2.3, 2.7]) { const k = t - t0; if (k >= 0 && k < 0.15) glow(rx + 6, 124, 8, 0.8 * (1 - k / 0.15), '255,230,170'); }
      for (const t0 of [1.3, 2.1, 2.9]) { const k = t - t0; if (k >= 0 && k < 0.15) glow(cx - 10, 88, 8, 0.8 * (1 - k / 0.15), '255,230,170'); }
      if (t > 3.1 && t < 3.5) glow(cx, 62, 14, 0.5 * (3.5 - t) / 0.4, '220,40,40');
      // medik přijde zleva k ležícímu (od 4,4 s), pak obvazuje
      if (t >= 4.4) { const mx = Math.min(24, -8 + (t - 4.4) * 20); if (mx < 24) put(at(S.medE, t, 7), Math.round(mx), cy); else put(at(S.bandN, t - 6.0, 6), 24, cy); }
      glow(36, 78, 26, 0.12, '217,143,63');
      g.fillStyle = 'rgba(20,24,44,0.15)'; g.fillRect(0, 0, W, H);
    },
    promo(t) {
      // úsvit, Den 16: důstojník předá rozkaz (papír s dvěma zlatými stuhami lance corporala), Cyril zasalutuje
      field(0, 50, ['#3a3048', '#7a5560', P.fire, P.gold], (x, y) => y / 50);
      glow(45, 50, 40, 0.5, '230,170,110');
      field(50, H, [P.mud0, P.mud1, P.mud2], (x, y) => 0.3 + 0.35 * hash(x >> 2, y >> 2, 179));
      bags(50, 3, -8, W + 8, P.bone, P.sand);
      put(S.officerW, 62, 134);
      const sal = t > 1.6 ? once(S.saluteE, t - 1.6, 7) : null;
      put(sal || S.stand, 26, 134);
      if (t > 0.4) { // papír s rozkazem mezi nimi (rozkaz se objeví v ruce důstojníka a zůstane viset)
        const k = clamp((t - 0.4) / 0.6), px0 = 44, py0 = 98 - k * 4;
        px(P.ink, px0, py0, 14, 18); px(P.white, px0 + 1, py0 + 1, 12, 16); px(P.pale, px0 + 1, py0 + 14, 12, 3);
        for (let i = 0; i < 2; i++) { const yy = py0 + 3 + i * 5; px(P.gold, px0 + 3, yy + 2, 8, 1); px(P.gold, px0 + 4, yy + 1, 6, 1); px(P.gold, px0 + 5, yy, 4, 1); }
        if (t > 2.4) glow(px0 + 7, py0 + 9, 12 + 3 * Math.sin(t * 8), 0.4, '240,200,110');
      }
      g.fillStyle = 'rgba(100,60,50,0.08)'; g.fillRect(0, 0, W, H);
    },
    duel(t) {
      // večer, Den 17: nahoře Cyril za pytli (fire, míří dolů), dole za drátem jdou dva nepřátelé vedle sebe; každý klekne, vymění střely s Cyrilem a padne; leží sám
      field(0, 40, ['#3a3048', P.dusk, P.rust2], (x, y) => y / 40);
      field(40, H, [P.mud0, P.mud1, P.mud2], (x, y) => 0.3 + 0.38 * hash(x >> 2, y >> 2, 176));
      bags(54, 2, 28, 108);
      for (let x = 0; x < W; x++) if (hash(x, 4, 177) < 0.5) px(P.mud3, x, 112);
      put(R.wire[0], 28, 126); put(R.wire[1], 66, 128); put(R.wire[2], 106, 126); put(R.crater, 14, 214);
      const cx = 68, cy = 66;
      put(at(S.dFire, t, 9), cx, cy);
      // dva nepřátelé (x 40 a x 98): chůze 0–2,0 s od y 205 k drátu (y 150), klekají a střílí, první padá ve 3,6 s, druhý v 5,0 s; mrtví zůstávají ležet sami
      const foe = (x, tFire, tDie) => {
        if (t < 2.0) put(at(S.eWalk, t, 6), x, Math.round(205 - t * 27));
        else if (t < tFire) put(once(S.eKneel, t - 2.0, 8), x, 151);
        else if (t < tDie) put(at(S.eFire, t, 8), x, 151);
        else put(once(S.eDie, t - tDie, 8), x, 151);
      };
      foe(40, 2.6, 3.6); foe(98, 3.4, 5.0);
      const flash = (x, y, t0) => { const k = t - t0; if (k >= 0 && k < 0.15) glow(x, y, 9, 0.9 * (1 - k / 0.15), '255,230,170'); };
      const tracer = (t0, x1, y1) => { const k = t - t0; if (k < 0 || k > 0.25) return; const m = clamp(k * 4); px(P.gold, 58 + (x1 - 58) * m, 70 + (y1 - 70) * m, 1, 3); };
      for (const t0 of [2.8, 3.1, 3.4]) flash(46, 142, t0); // první střílí nahoru
      for (const t0 of [3.5, 4.0, 4.5]) flash(104, 142, t0); // druhý střílí nahoru
      for (const t0 of [3.0, 3.3, 3.55]) { flash(58, 66, t0); tracer(t0, 42, 140); } // Cyril na prvního
      for (const t0 of [4.2, 4.7, 4.95]) { flash(58, 66, t0); tracer(t0, 100, 140); } // Cyril na druhého
      for (const [t0, x] of [[3.6, 40], [5.0, 98]]) if (t > t0 && t < t0 + 0.4) glow(x, 140, 14, 0.5 * (t0 + 0.4 - t) / 0.4, '220,40,40');
      const f = (t % 4) / 4; glow(60 + f * 50, 18, 36, 0.3 * Math.sin(f * Math.PI), '220,230,255'); // světlice
      g.fillStyle = 'rgba(40,30,60,0.12)'; g.fillRect(0, 0, W, H);
    },
  };
  return { canvas, draw(name, t, o = {}) { const sz = SIZE[name] || [135, 240]; if (canvas.width !== sz[0]) { canvas.width = sz[0]; canvas.height = sz[1]; } W = sz[0]; H = sz[1]; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.imageSmoothingEnabled = false; scenes[name]?.(Math.max(0, t), o); } };
}
