// Filmové scény Day reelu Day 14 (23. 11. 2026), STEJNÉ MĚŘÍTKO JAKO HRA (uživatel 23. 11.: malby z PixelLabu měly jiné měřítko i pixely,
// „musí to sedět velikostně a pixelově“). Plátno 135×240 (×8 na 1080×1920), sprity ze hry 1:1 (voják ~30 px = osmina výšky),
// rekvizity ze hry 1:1 (art/cine/prop_*, corpse_*, web/public/assets/props/*: nosítka, bedny, sudy, hroby, krátery, drát, kůly, stromy,
// náklaďák, povoz), terén kreslený v kódu paletou Trench-24 s ditheringem. Pohled jako ve hře (zepředu shora). Žádná průhlednost postav.
// Plazící se vojáci se opravdu posouvají (uživatel: „většinou se ve videu nikam neposouvají“), auta a povoz jedou, nástupce dojde k psovi.
//  • wirenight – noc v zemi nikoho: krátery, potrhaný drát s mrtvým; dva vojáci se plazí vpřed, třetí zatlouká kůl; světlice → všichni ztuhnou
//  • raid      – zákop v noci: raider Concordu seskočí přes val, souboj lopatkami s Gideonem Cubesem, raider padne (o.fall s)
//  • aid       – obvaziště v krytu: raněný na nosítkách, medik ho obvazuje, další raněný na druhých nosítkách, lampa bliká
//  • graves    – hřbitov za frontou za soumraku, sníh: pes sedí u hrobu, v o.heir s přijde nástupce a zastaví se u něj
//  • road      – zásobovací cesta za úsvitu: náklaďák a povoz s koněm jedou, nováčci jdou v zástupu k frontě
import { off } from './cinema.js';
import { loadImage } from './assets.js';
import stretcherSrc from '../../art/cine/prop_stretcher.png';
import cratesSrc from '../../art/cine/prop_crates.png';
import barrelsSrc from '../../art/cine/prop_barrels.png';
import doorSrc from '../../art/cine/prop_dugout_door.png';
import corpseSrc from '../../art/cine/corpse_con_wire.png';
import signSrc from '../../art/cine/prop_signpost.png';

const shovels = import.meta.glob('../../art/cine/anim/shovel_*.png', { eager: true, import: 'default' });
let W = 135, H = 240; // široký záběr 135×240 (×8); blízký záběr 90×160 (×12): pořád jedna pixelová mřížka pro sprity i terén
const SIZE = { wirenight: [135, 240], road: [135, 240], raid: [90, 160], aid: [90, 160], graves: [90, 160] };
const P = { ink: '#0e0d0c', dark: '#1c1a17', mud0: '#2b2722', mud1: '#3d3730', mud2: '#524a3f', mud3: '#6b6152', sand: '#857a68', bone: '#a39782', pale: '#c4b8a0', white: '#e3d9c3',
  steel: '#666d70', grey: '#8a9295', water: '#2a3138', navy: '#141a2c', dusk: '#4b4560', rust: '#7e3b2a', rust2: '#5c2a22', fire: '#a85a36', gold: '#d98f3f', olive: '#6f7148', olive2: '#52543a' };
const B = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const by = (x, y) => (B[y & 3][x & 3] + 0.5) / 16;
const hash = (x, y, s = 0) => { let n = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };

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

export async function makeDay14Scenes(tex = {}, anims = {}) {
  const canvas = off(W, H);
  const g = canvas.getContext('2d');
  g.imageSmoothingEnabled = false;
  const NIGHT = 'rgba(30,36,72,0.30)', LAMP = 'rgba(120,70,20,0.14)', DUSK = 'rgba(90,50,60,0.2)', DAWN = 'rgba(110,70,40,0.12)';
  const A = (k, a, d, tint) => (anims[k]?.[a]?.[d] || []).map((t) => sprite(t, tint));
  const shov = async (side, tint) => Promise.all(Object.keys(shovels).filter((k) => k.includes(`shovel_${side}_`)).sort().map(async (k) => tinted(await loadAny(shovels[k]), tint)));
  const prop = async (src, tint) => tinted(await loadAny(src), tint);
  const S = {
    crawl: A('hegemony', 'crawl', 'east', NIGHT), work: A('hegemony', 'work', 'east', NIGHT),
    shH: await shov('hegemony', LAMP), shC: await shov('concord', NIGHT), dieC: A('concord', 'die', 'east', NIGHT),
    band: A('hegemony_medic', 'bandage', 'east', LAMP),
    lyingE: sprite((anims.hegemony?.['lying-wounded']?.east || [])[0], LAMP), lyingW: sprite((anims.hegemony?.['lying-wounded']?.west || [])[0], LAMP),
    walkW: A('hegemony', 'walk', 'west', DUSK), standW: sprite(tex.hegemony?.west, DUSK),
    marchH: A('hegemony', 'walk', 'east', DAWN), marchC: A('concord', 'walk', 'east', DAWN),
  };
  const R = {
    stretcher: await prop(stretcherSrc, LAMP), crates: await prop(cratesSrc, LAMP), barrels: await prop(barrelsSrc, LAMP), door: await prop(doorSrc, NIGHT),
    corpse: await prop(corpseSrc, NIGHT), sign: await prop(signSrc, DAWN),
    craterW: await prop('/assets/props/crater_water.png', NIGHT), craterM: await prop('/assets/props/crater_m.png', NIGHT), craterS: await prop('/assets/props/crater_s.png', NIGHT),
    wire: await Promise.all([0, 1, 2, 3].map((i) => prop(`/assets/props/wire_broken_${i}.png`, NIGHT))), picket: await prop('/assets/props/screw_picket_0.png', NIGHT),
    grave: await prop('/assets/props/grave.png', DUSK), treeD: await prop('/assets/props/tree.png', 'rgba(20,16,24,0.55)'), treeA: await prop('/assets/props/tree.png', DAWN),
    truck: await prop('/assets/props/truck_heg_anim.png', DAWN), cart: await prop('/assets/props/cart_horse_anim.png', DAWN),
    dogs: Object.fromEntries(await Promise.all(['airedale', 'shepherd', 'jackrussell', 'collie', 'dachshund'].map(async (b) => [b, await prop(`/assets/props/dog_${b}_sit.png`, DUSK)]))),
  };
  const feet = new Map();
  const at = (arr, t, fps) => (arr?.length ? arr[Math.floor(t * fps) % arr.length] : null);
  const put = (c, cx, foot, flip = false) => {
    if (!c) return;
    if (!feet.has(c)) feet.set(c, footOf(c));
    const x = Math.round(cx - c.width / 2), y = Math.round(foot - feet.get(c));
    if (flip) { g.save(); g.translate(x + c.width, y); g.scale(-1, 1); g.drawImage(c, 0, 0); g.restore(); } else g.drawImage(c, x, y);
  };
  const frameOf = (img, n, i, cx, foot, flip = false) => { // snímek z pásu (vozidla)
    if (!img) return;
    const fw = img.width / n, fh = img.height, x = Math.round(cx - fw / 2), y = Math.round(foot - fh);
    if (flip) { g.save(); g.translate(x + fw, y); g.scale(-1, 1); g.drawImage(img, (i % n) * fw, 0, fw, fh, 0, 0, fw, fh); g.restore(); } else g.drawImage(img, (i % n) * fw, 0, fw, fh, x, y, fw, fh);
  };
  const px = (c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  // plocha s ditheringem: v = 0..1 vybírá barvu z řady cols
  const field = (y0, y1, cols, f) => { for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) { const v = Math.max(0, Math.min(0.999, f(x, y))); const u = v * (cols.length - 1); const i = Math.floor(u); px(u - i > by(x, y) ? cols[Math.min(cols.length - 1, i + 1)] : cols[i], x, y); } };
  const glow = (x, y, r, a, rgb) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
  const vnoise = (x, y, s) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
  const snowGround = (y0, y1, dens, seed) => { for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) { const n = vnoise(x / 9, y / 4, seed) * 0.75 + vnoise(x / 3, y / 2, seed + 7) * 0.25; const th = 1 - dens; if (n > th + 0.06) px(n > th + 0.16 ? P.white : P.pale, x, y); else if (n > th && (n - th) / 0.06 > by(x, y)) px(P.bone, x, y); } }; // závěje, ne šum
  const snowFall = (t, n, a) => { g.fillStyle = `rgba(227,217,195,${a})`; for (let k = 0; k < n; k++) { const p = (k * 0.618) % 1, q = (k * 0.754) % 1; const y = ((q * 260 + t * 16) % 260) - 10; g.fillRect(Math.round((p * 150 + Math.sin(t * 0.8 + k) * 3) % 140 - 2), Math.round(y), 1, 1); } };
  // řada pytlů (vzor jako ve hře)
  const bags = (y0, rows, light = 0) => { for (let r = 0; r < rows; r++) for (let x = -8; x < W + 8; x += 12) { const ox = x + (r % 2 ? 6 : 0), y = y0 + r * 7; px(P.ink, ox - 1, y - 1, 12, 8); px(r === 0 && light ? P.bone : P.sand, ox, y, 10, 6); px(P.bone, ox + 1, y, 8, 1); px(P.mud3, ox, y + 5, 10, 1); } };

  const scenes = {
    wirenight(t) {
      // nebe a obzor (nepřátelský val jako tmavé hrboly)
      field(0, 62, [P.navy, P.dark, P.mud0], (x, y) => y / 62 * 0.9);
      for (let x = 0; x < W; x++) { const h = 3 + Math.round(2 * Math.sin(x * 0.4) + hash(x, 0, 3) * 2); px(P.ink, x, 60 - h, 1, h + 2); }
      field(62, H, [P.mud0, P.mud1, P.mud2], (x, y) => 0.35 + 0.35 * hash(x >> 2, y >> 2, 7) + (y - 62) / 600);
      snowGround(64, H, 0.22, 11);
      put(R.craterS, 112, 96); put(R.craterW, 34, 166); put(R.craterM, 104, 214);
      for (let i = 0, x = -4; x < W + 10; x += 21, i++) { put(R.wire[i % 4], x, 122 + (i % 2) * 3); if (i % 2) put(R.picket, x + 10, 124); }
      put(R.corpse, 92, 126);
      // světlice: pomalu klesá, každých 5 s zazáří; ve světle vojáci ztuhnou
      const u = t % 5, bright = u > 1.2 && u < 2.6 ? Math.sin(((u - 1.2) / 1.4) * Math.PI) : 0;
      const fx = 96 - (t % 10) * 1.5, fy = 12 + (t % 10) * 2.2;
      glow(fx, fy, 22 + bright * 40, 0.25 + bright * 0.5, '230,190,120');
      px(P.white, Math.round(fx), Math.round(fy), 2, 2);
      // čas, kdy se smělo lézt (mimo záři), aby se po světle pokračovalo z místa
      const moved = Math.floor(t / 5) * 3.6 + (u < 1.2 ? u : u < 2.6 ? 1.2 : u - 1.4);
      const still = bright > 0.15;
      put(still ? S.crawl[0] : at(S.crawl, t, 7), 6 + moved * 7, 176);
      put(still ? S.crawl[2] : at(S.crawl, t + 0.3, 7), -16 + moved * 6, 204);
      put(still ? S.work[0] : at(S.work, t, 7), 64, 132);
      if (bright) { g.fillStyle = `rgba(217,160,90,${0.1 * bright})`; g.fillRect(0, 0, W, H); }
    },
    raid(t, o = {}) {
      // blízký záběr: noc nad valem, val z pytlů se sněhem, dno z prken, zadní stěna, dveře krytu, lampa na kůlu
      field(0, 22, [P.navy, P.dark], (x, y) => y / 22);
      for (let x = 0; x < W; x += 2) if (hash(x, 1, 5) < 0.5) px(P.ink, x, 17 + Math.round(Math.sin(x * 0.5) * 2), 2, 1);
      bags(22, 4, 1);
      for (let x = 0; x < W; x++) if (hash(x, 22, 2) < 0.7) px(P.white, x, 21, 1, 1);
      field(50, 136, [P.mud0, P.mud1], (x, y) => hash(x >> 1, y >> 1, 9) * 0.6);
      for (let y = 56; y < 132; y += 9) { px(P.mud2, 4, y, 82, 7); px(P.mud3, 4, y, 82, 1); px(P.ink, 4, y + 7, 82, 1); for (let x = 4; x < 86; x += 17) px(P.mud1, x, y + 1, 1, 6); }
      bags(136, 4);
      put(R.door, 74, 142);
      glow(12, 64, 22 + Math.sin(t * 8) * 2, 0.45, '217,143,63'); px(P.ink, 11, 60, 2, 34); px(P.gold, 10, 57, 4, 4); px(P.white, 11, 58, 2, 2);
      const fall = o.fall ?? 3.0;
      const jump = Math.min(1, t / 0.5), jy = 34 + jump * 68 - Math.sin(jump * Math.PI) * 12;
      put(at(S.shH, t, 10), 58, 102);
      if (t < fall) put(t < 0.5 ? S.shC[0] : at(S.shC, t + 0.3, 10), 34, Math.round(jy));
      else put(S.dieC[Math.min(S.dieC.length - 1, Math.floor((t - fall) * 9))], 34, 104);
      snowFall(t, 24, 0.5);
    },
    aid(t) {
      // blízký záběr do krytu: prkenná stěna, trám, podlaha; lampa bliká; raněný na nosítkách, medik ho obvazuje; druhá nosítka
      field(0, 68, [P.dark, P.mud0, P.mud1], (x, y) => (x % 11 === 0 ? 0 : 0.35 + 0.3 * hash(x >> 1, y >> 3, 4)));
      for (let x = 0; x < W; x += 11) px(P.ink, x, 0, 1, 68);
      px(P.mud2, 0, 6, W, 4); px(P.ink, 0, 10, W, 1);
      field(68, H, [P.mud0, P.mud1, P.mud2], (x, y) => ((y - 68) % 10 === 0 ? 0 : 0.3 + 0.25 * hash(x >> 2, y, 8)));
      const fl = 0.85 + 0.15 * Math.sin(t * 9) * Math.sin(t * 13);
      glow(46, 22, 56, 0.5 * fl, '217,143,63'); px(P.ink, 46, 10, 1, 8); px(P.gold, 44, 18, 4, 5); px(P.white, 45, 20, 2, 2);
      put(R.crates, 14, 72); put(R.barrels, 78, 72);
      put(R.stretcher, 50, 108); put(S.lyingE, 50, 104);
      put(at(S.band, t, 6), 27, 110);
      put(R.stretcher, 58, 148); put(S.lyingW, 58, 144);
    },
    graves(t, o = {}) {
      // blízký záběr: soumrak, ohořelé stromy, hroby se sněhem, pes čeká u hrobu, přijde nástupce
      field(0, 62, ['#2a2238', P.dusk, P.rust2, P.fire, P.gold], (x, y) => y / 62);
      glow(64, 60, 24, 0.6, '217,143,63');
      put(R.treeD, 10, 70); put(R.treeD, 82, 66);
      field(62, H, [P.mud0, P.mud1, P.mud2], (x, y) => 0.3 + 0.4 * hash(x >> 2, y >> 2, 6));
      snowGround(62, H, 0.42, 13);
      for (const [x, f] of [[16, 92], [42, 86], [68, 92], [28, 116], [60, 118]]) put(R.grave, x, f);
      put(R.grave, 34, 144); // hrob, u kterého čeká pes
      put(R.dogs[o.breed] || R.dogs.airedale, 52, 148, true);
      const T0 = o.heir ?? 99;
      if (t >= T0) { const q = Math.min(1, (t - T0) / 2.0); put(q < 1 ? at(S.walkW, t, 8) : S.standW, 104 - q * 34, 154); }
      snowFall(t, 40, 0.6);
    },
    road(t) {
      field(0, 70, ['#3a3048', P.dusk, P.fire, P.gold], (x, y) => y / 70);
      glow(40, 66, 26, 0.5, '217,143,63');
      put(R.treeA, 104, 82); put(R.treeA, 122, 86);
      for (let x = 60; x < 90; x++) px(P.ink, x, 70 - Math.round(Math.max(0, 6 - Math.abs(x - 72) * 0.5)), 1, 8); // zbořený statek v siluetě
      field(70, 140, [P.mud1, P.mud2, P.mud3], (x, y) => 0.3 + 0.4 * hash(x >> 2, y >> 2, 21));
      snowGround(70, 140, 0.35, 22);
      // cesta s kolejemi a loužemi
      field(140, 178, [P.mud0, P.mud1], (x, y) => ((y === 152 || y === 166) ? 0 : 0.6 * hash(x >> 1, y, 23)));
      for (const [x, y, w] of [[18, 158, 14], [74, 146, 10], [110, 170, 12]]) { px(P.water, x, y, w, 2); px(P.fire, x + 2, y, Math.round(w / 3), 1); }
      field(178, H, [P.mud1, P.mud2, P.mud3], (x, y) => 0.3 + 0.4 * hash(x >> 2, y >> 2, 24));
      snowGround(178, H, 0.4, 25);
      for (let x = 6; x < W; x += 26) { px(P.ink, x, 112, 1, 30); px(P.ink, x - 4, 114, 9, 1); } // telegrafní sloupy
      for (let x = 2; x < W; x += 14) { px(P.mud0, x, 178, 2, 7); } // plot
      put(R.sign, 118, 196);
      // náklaďák a povoz jedou doprava, nováčci jdou k frontě
      frameOf(R.truck, 9, Math.floor(t * 11), -40 + t * 26, 166);
      frameOf(R.cart, 9, Math.floor(t * 8), -120 + t * 16, 172);
      for (let i = 0; i < 4; i++) put(at(i % 2 ? S.marchC : S.marchH, t + i * 0.25, 8), 10 + t * 9 - i * 15, 228);
      snowFall(t, 50, 0.45);
    },
  };
  return { canvas, draw(name, t, o = {}) { const sz = SIZE[name] || [135, 240]; if (canvas.width !== sz[0]) { canvas.width = sz[0]; canvas.height = sz[1]; } W = sz[0]; H = sz[1]; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.imageSmoothingEnabled = false; scenes[name]?.(Math.max(0, t), o); } };
}
