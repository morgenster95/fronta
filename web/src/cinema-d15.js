// Filmové scény Day reelu Day 15 (24. 11. 2026), STEJNÉ MĚŘÍTKO JAKO HRA (vzor cinema-d14.js, pravidla 23. 11.): plátno 135×240 (×8)
// nebo 90×160 (×12), sprity a rekvizity ze hry 1:1, terén v kódu paletou Trench-24 s ditheringem, žádná průhlednost postav.
// Všechny scény jsou nové (marketing/reels/scenes-used.json). Klíčový obsah je dole: horní pás nechává místo titulkům (pod lištou IG).
//  • storm   – bouře v noci: plachta obvaziště se trhá, dva zdravotníci ji drží vlastním tělem, před stanem řady nosítek, blesky a déšť
//  • letters – kryt z vlnitého plechu při svíčce: raideři s počerněnými tvářemi hází dopisy do helmy, seržant čeká, na stěně kyj a nůžky
//  • over    – pohled shora: raideři přelezou val, běží a plazí se mezerou v drátu k zákopu Concordu; světlomet přejíždí, kdo je ve světle, ztuhne
//  • find    – zákop Concordu: převržená lucerna, raider klečí v blátě, v něm se leskne malá kartička rubem nahoru; v o.pick ji zvedne
import { off } from './cinema.js';
import { loadImage } from './assets.js';
import stretcherSrc from '../../art/cine/prop_stretcher.png';
import searchSrc from '../../art/cine/prop_searchlight.png';
import corpseSrc from '../../art/cine/corpse_con_back.png';

let W = 135, H = 240;
const SIZE = { storm: [135, 240], over: [135, 240], letters: [90, 160], find: [90, 160] };
const P = { ink: '#0e0d0c', dark: '#1c1a17', mud0: '#2b2722', mud1: '#3d3730', mud2: '#524a3f', mud3: '#6b6152', sand: '#857a68', bone: '#a39782', pale: '#c4b8a0', white: '#e3d9c3',
  steel: '#666d70', grey: '#8a9295', water: '#2a3138', navy: '#141a2c', dusk: '#4b4560', rust: '#7e3b2a', rust2: '#5c2a22', fire: '#a85a36', gold: '#d98f3f', olive: '#6f7148', olive2: '#52543a', khaki: '#8c8a5c' };
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

export async function makeDay15Scenes(tex = {}, anims = {}) {
  const canvas = off(W, H);
  const g = canvas.getContext('2d');
  g.imageSmoothingEnabled = false;
  const NIGHT = 'rgba(30,36,72,0.32)', STORM = 'rgba(40,48,70,0.30)', CANDLE = 'rgba(120,70,20,0.16)', BLACK = 'rgba(12,10,10,0.42)';
  const A = (k, a, d, tint) => (anims[k]?.[a]?.[d] || []).map((t) => sprite(t, tint));
  const prop = async (src, tint) => tinted(await loadAny(src), tint);
  const S = {
    medic: sprite(tex.hegemony_medic?.south, STORM), medicE: sprite(tex.hegemony_medic?.east, STORM),
    lyingE: sprite((anims.hegemony?.['lying-wounded']?.east || [])[0], STORM), lyingW: sprite((anims.hegemony?.['lying-wounded']?.west || [])[0], STORM),
    lyingCE: sprite((anims.concord?.['lying-wounded']?.east || [])[0], STORM),
    idle: A('hegemony', 'idle', 'south', BLACK), smoke: A('hegemony', 'smoke', 'south', BLACK), warm: A('hegemony', 'warmhands', 'south', BLACK),
    sarge: sprite(tex.hegemony_officer?.south, CANDLE),
    run: A('hegemony', 'run', 'south', BLACK), crawl: A('hegemony', 'crawl', 'south', BLACK), prone: A('hegemony', 'prone', 'south', BLACK),
    kneel: A('hegemony', 'kneel', 'east', BLACK),
  };
  const R = {
    stretcher: await prop(stretcherSrc, STORM), search: await prop(searchSrc, NIGHT), corpse: await prop(corpseSrc, NIGHT),
    craterW: await prop('/assets/props/crater_water.png', NIGHT), craterM: await prop('/assets/props/crater_m.png', NIGHT), craterS: await prop('/assets/props/crater_s.png', NIGHT),
    wire: await Promise.all([0, 1, 2, 3].map((i) => prop(`/assets/props/wire_broken_${i}.png`, NIGHT))), picket: await prop('/assets/props/screw_picket_1.png', NIGHT),
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
  const field = (y0, y1, cols, f) => { for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) { const v = Math.max(0, Math.min(0.999, f(x, y))); const u = v * (cols.length - 1); const i = Math.floor(u); px(u - i > by(x, y) ? cols[Math.min(cols.length - 1, i + 1)] : cols[i], x, y); } };
  const glow = (x, y, r, a, rgb) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
  // déšť šikmo (vítr zleva): krátké čárky 1 px, rychlé
  const rain = (t, n, col, speed = 150) => { for (let k = 0; k < n; k++) { const p = (k * 0.618) % 1, q = (k * 0.7548) % 1; const y = ((q * (H + 20) + t * speed) % (H + 20)) - 10, x = ((p * (W + 60) + t * speed * 0.35) % (W + 60)) - 30; for (let i = 0; i < 3; i++) px(col, x - i * 0.5, y - i); } };
  const puddle = (x, y, w, t, s) => { px(P.water, x, y, w, 2); px(P.ink, x, y + 2, w, 1); for (let k = 0; k < 2; k++) { const r = (t * 3 + hash(x, k, s)) % 1; px(P.grey, x + Math.floor(hash(k, Math.floor(t * 3 + hash(x, k, s)), s) * w), y, 1, 1 + (r < 0.3 ? 0 : 0)); } };
  const bags = (y0, rows, top = P.bone, side = P.sand) => { for (let r = 0; r < rows; r++) for (let x = -8; x < W + 8; x += 12) { const ox = x + (r % 2 ? 6 : 0), y = y0 + r * 7; px(P.ink, ox - 1, y - 1, 12, 8); px(side, ox, y, 10, 6); px(top, ox + 1, y, 8, 1); px(P.mud3, ox, y + 5, 10, 1); } };

  const scenes = {
    storm(t) {
      // nebe s mraky, blesk (dva záblesky po sobě), bahno s loužemi
      const u = t % 3.4, flash = u < 0.1 ? 1 : u > 0.2 && u < 0.27 ? 0.7 : 0;
      field(0, 76, [P.ink, P.navy, P.dusk], (x, y) => y / 76 * 0.75 + 0.25 * Math.sin(x * 0.09 + y * 0.05 + t * 0.6) * 0.5 + (flash ? 0.3 : 0));
      if (u < 0.3) { let x = 20 + Math.floor(hash(Math.floor(t / 3.4), 1, 4) * 95); for (let y = 0; y < 66; y += 3) { x += Math.round((hash(x, y, Math.floor(t / 3.4)) - 0.5) * 6); px(P.white, x, y, 1, 3); if (y % 9 === 0) px(P.pale, x + 1, y + 1, 1, 2); } }
      field(76, H, [P.mud0, P.mud1, P.mud2], (x, y) => 0.25 + 0.4 * hash(x >> 2, y >> 2, 31) + (y - 76) / 700);
      for (const [x, y, w] of [[8, 208, 18], [96, 214, 22], [60, 176, 10], [118, 144, 12], [10, 140, 10]]) puddle(x, y, w, t, 1);
      // stan obvaziště (plátno, tyče, červený kříž), pravý kus střechy se trhá ve větru
      const L = 26, Rr = 102, top = 86, base = 132, peak = 72, cx = 64;
      for (let y = top; y < base; y++) for (let x = L; x < Rr; x++) { const sh = (x - L) / (Rr - L); px(sh + 0.15 * hash(x, y >> 1, 5) > 0.85 ? P.sand : (x + y) % 9 === 0 ? P.bone : P.pale, x, y); }
      px(P.ink, L, top, Rr - L, 1); px(P.mud2, L, base - 2, Rr - L, 2);
      px(P.dark, cx - 8, 104, 16, base - 104); px(P.ink, cx - 8, 104, 1, base - 104); px(P.ink, cx + 7, 104, 1, base - 104); // vchod
      glow(cx, 118, 18, 0.55, '217,143,63'); px(P.gold, cx - 1, 110, 3, 4); px(P.white, cx, 111, 1, 2); // lucerna uvnitř
      px(P.rust, cx - 2, 89, 4, 12); px(P.rust, cx - 6, 93, 12, 4); // kříž
      for (let x = L; x <= cx; x++) { const y = Math.round(peak + (top - peak) * (cx - x) / (cx - L)); px(P.bone, x, y, 1, top - y); px(P.ink, x, y - 1, 1, 1); } // levá střecha drží
      const lift = 12 * Math.abs(Math.sin(t * 5.3)) + 4 * Math.abs(Math.sin(t * 11)); // pravá střecha: utržený roh se zvedá
      for (let x = cx; x <= Rr + 6; x++) { const k = (x - cx) / (Rr + 6 - cx); const y = Math.round(peak + (top - peak) * k - lift * k * k + Math.sin(x * 0.5 + t * 14) * k * 2); px(k > 0.5 && (x + Math.floor(t * 20)) % 5 === 0 ? P.sand : P.bone, x, y, 1, Math.max(1, Math.round((top - peak) * (1 - k * 0.6)) - Math.round(lift * k))); px(P.ink, x, y - 1, 1, 1); }
      // utržený kus plachty vlaje doprava, provaz k zdravotníkovi, který ho drží
      const fl2 = 6 * Math.sin(t * 7.1) + 4 * Math.sin(t * 13.3);
      let ex = 0, ey = 0;
      for (let i = 0; i <= 30; i++) { const k = i / 30, x = Rr - 6 + i, y = top - 8 - i * 0.5 - fl2 * k + Math.sin(i * 0.55 + t * 17) * 2.2 * k, th = Math.round(9 * (1 - k * 0.55)); for (let j = 0; j < th; j++) px((i + j + Math.floor(t * 18)) % 6 === 0 ? P.sand : j === 0 ? P.pale : P.bone, x, y + j); px(P.ink, x, y - 1); px(P.ink, x, y + th); if (i === 30) { ex = x; ey = y + th / 2; } }
      for (let i = 0; i <= 12; i++) { const k = i / 12; px(P.mud3, ex + (Rr + 9 - ex) * k, ey + (base - 14 - ey) * k + Math.sin(k * Math.PI) * 3); }
      px(P.ink, cx, peak - 2, 1, 4); px(P.mud3, L - 1, top - 2, 1, base - top + 2); px(P.mud3, Rr, top - 2, 1, base - top + 2); // tyče
      // dva zdravotníci drží plachtu (vítr s nimi trhá o pixel)
      const jig = Math.round(Math.sin(t * 5.3));
      put(S.medic, Rr + 8, base + 4 + (jig > 0 ? -1 : 0));
      put(S.medic, L - 4, base + 4);
      // nosítka s raněnými před stanem (řady pokračují za okraj)
      for (const [x, y, s] of [[22, 162, 'E'], [78, 158, 'W'], [128, 164, 'CE'], [48, 192, 'W'], [104, 196, 'E'], [-10, 194, 'E'], [20, 224, 'W'], [80, 226, 'E']]) { put(R.stretcher, x, y); put(s === 'E' ? S.lyingE : s === 'CE' ? S.lyingCE : S.lyingW, x, y - 4); }
      rain(t, 170, P.grey, 190);
      if (flash) { g.fillStyle = `rgba(227,217,195,${0.22 * flash})`; g.fillRect(0, 0, W, H); }
    },
    letters(t) {
      // kryt z vlnitého plechu (oblouk), světlo svíčky, prkenná podlaha
      for (let y = 0; y < 104; y++) for (let x = 0; x < W; x++) { const edge = Math.abs(x - 45) / 45, rib = (y % 4); const v = (rib === 0 ? 0.75 : rib === 1 ? 0.55 : 0.35) - edge * 0.45 - y / 400; px(v > by(x, y) * 0.9 ? (rib === 0 ? P.mud3 : P.mud2) : v + 0.4 > by(x, y) ? P.mud1 : P.mud0, x, y); }
      field(104, H, [P.mud0, P.mud1, P.mud2], (x, y) => ((y - 104) % 9 === 0 ? 0 : 0.35 + 0.25 * hash(x >> 2, y, 12)));
      // na stěně: kyj s hřeby, nůžky na drát, mapka
      px(P.rust2, 8, 40, 2, 16); px(P.mud3, 7, 36, 4, 6); for (const [a, b] of [[6, 37], [11, 38], [6, 40], [11, 41]]) px(P.grey, a, b);
      px(P.steel, 16, 44, 1, 8); px(P.steel, 19, 44, 1, 8); px(P.steel, 17, 52, 2, 1); px(P.grey, 16, 42, 4, 2);
      px(P.ink, 67, 31, 18, 13); px(P.pale, 68, 32, 16, 11); px(P.sand, 68, 36, 16, 1); px(P.sand, 74, 32, 1, 11); px(P.mud3, 69, 39, 7, 1); px(P.rust, 79, 35, 1, 1); px(P.rust, 80, 36, 1, 1); px(P.rust, 81, 35, 1, 1); px(P.rust, 79, 37, 1, 1); px(P.rust, 81, 37, 1, 1);
      const fl = 0.85 + 0.15 * Math.sin(t * 11) * Math.sin(t * 7);
      glow(44, 96, 60, 0.5 * fl, '217,143,63');
      // seržant za bednou s hodinkami
      put(S.sarge, 66, 102);
      // bedna se svíčkou a převrácenou helmou plnou dopisů
      px(P.ink, 27, 104, 36, 18); px(P.mud3, 28, 105, 34, 16); px(P.sand, 28, 105, 34, 1); px(P.mud2, 28, 112, 34, 1); px(P.ink, 44, 106, 1, 15);
      px(P.bone, 33, 98, 2, 7); px(P.gold, 33, 96, 2, 2); px(P.white, 33, 96 + (fl > 0.9 ? 0 : 1), 1, 1);
      const hx = 51, hy = 102; px(P.ink, hx - 8, hy - 2, 17, 2); px(P.grey, hx - 7, hy - 2, 15, 1); for (const [w, dy] of [[13, 0], [11, 1], [9, 2]]) { px(P.ink, hx - Math.ceil(w / 2) - 1, hy + dy, w + 2, 1); px(dy ? P.steel : P.grey, hx - Math.ceil(w / 2), hy + dy, w, 1); } px(P.dark, hx - 5, hy - 1, 11, 1);
      // dopisy: každý raider hodí svůj do helmy, hromádka roste
      const throwers = [[16, 140], [76, 142], [44, 156]], every = 1.6;
      const n = Math.floor(t / every);
      for (let i = 0; i < Math.min(n, 7); i++) px(i % 2 ? P.white : P.pale, hx - 4 + (i * 3) % 9, hy - 2 - Math.floor(i / 3), 3, 1);
      const k = (t % every) / 0.6, who = throwers[n % 3];
      if (k < 1) { const x0 = who[0] + 4, y0 = who[1] - 18, x = x0 + (hx - x0) * k, y = y0 + (hy - 3 - y0) * k - Math.sin(k * Math.PI) * 14; px(P.ink, x - 1, y - 1, 5, 4); px(P.white, x, y, 3, 2); px(P.sand, x, y + 1, 3, 1); }
      // tři raideři s počerněnými tvářemi (popředí)
      put(at(S.warm, t, 5), 16, 140); put(at(S.smoke, t + 0.4, 4), 76, 142); put(at(S.idle, t, 3), 44, 156);
    },
    over(t) {
      // shora: nahoře val Hegemonie (odkud vylézají), dole val Concordu se světlometem, mezi tím bahno, krátery, drát s mezerou
      field(0, 12, [P.ink, P.dark], (x, y) => y / 12);
      field(12, 186, [P.mud0, P.mud1, P.mud2], (x, y) => 0.2 + 0.45 * hash(x >> 2, y >> 2, 41) + 0.1 * Math.sin(y * 0.12));
      for (let y = 40; y < 176; y++) for (let x = 0; x < W; x++) if (hash(x >> 1, y >> 1, 42) > 0.93) px(P.mud3, x, y); // hroudy
      put(R.craterW, 24, 92); put(R.craterM, 114, 74); put(R.craterS, 104, 160); put(R.craterM, 16, 160);
      for (const [x, y, w] of [[48, 100, 12], [90, 138, 10]]) puddle(x, y, w, t, 2);
      bags(14, 3, P.bone, P.sand);
      for (let i = 0, x = -4; x < W + 10; x += 19, i++) { if (x > 52 && x < 84) continue; put(R.wire[i % 4], x, 126 + (i % 2) * 2); if (i % 2) put(R.picket, x + 9, 128); }
      bags(178, 3, P.pale, P.bone); field(198, H, [P.ink, P.dark], (x, y) => 0.4 * hash(x >> 2, y >> 1, 44)); bags(220, 3, P.bone, P.sand);
      put(R.search, 112, 190);
      // světlomet: kužel z valu Concordu, pomalu přejíždí zleva doprava a zpět
      const ang = -Math.PI / 2 + Math.sin(t * 0.55 - 0.6) * 0.75, sx = 112, sy = 172, spread = 0.11;
      g.save(); g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(ang - spread) * 260, sy + Math.sin(ang - spread) * 260); g.lineTo(sx + Math.cos(ang + spread) * 260, sy + Math.sin(ang + spread) * 260); g.closePath();
      g.fillStyle = 'rgba(227,217,195,0.16)'; g.fill(); g.restore();
      const lit = (x, y) => { const a = Math.atan2(y - sy, x - sx); return Math.abs(a - ang) < spread + 0.03; };
      // raideři: přelezou val, běží k zemi, pak se plazí k mezeře v drátu a dál; ve světle ztuhnou (pokračují z místa)
      const crew = [[40, 0, 56], [64, 0.5, 64], [88, 1.0, 72], [108, 1.5, 80]];
      for (const [x0, d, x1] of crew) {
        const tt = Math.max(0, t - d);
        const runT = Math.min(tt, 1.3), crawlT = Math.max(0, tt - 1.3);
        let y = 30 + runT * 32, x = x0;
        if (tt > 1.3) { x = x0 + (x1 - x0) * Math.min(1, crawlT / 2.6); y = 72 + crawlT * 17; }
        if (y > 172) continue; // sklouzl do nepřátelského zákopu
        const frozen = tt > 1.3 && lit(x, y);
        put(tt <= 1.3 ? at(S.run, tt, 10) : frozen ? S.prone[0] : at(S.crawl, crawlT, 7), x, Math.round(y));
      }
      // kulomet z valu: krátké dávky stopovek do tmy
      const b = t % 2.6;
      if (b < 0.5) { px(P.gold, 30, 178, 2, 2); px(P.white, 30, 178); for (let i = 0; i < 4; i++) { const k = ((b * 6 + i * 0.25) % 1); px(P.gold, 30 + k * 40, 176 - k * 120, 1, 3); } }
      rain(t, 90, P.steel, 170);
    },
    find(t, o = {}) {
      // zákop Concordu v noci zblízka: proutěná stěna, pytle nahoře, prkna dole, převržená lucerna, mrtvý obránce, kartička v blátě
      field(0, 14, [P.ink, P.navy], (x, y) => y / 14);
      bags(14, 3, P.pale, P.bone);
      for (let y = 36; y < 80; y++) for (let x = 0; x < W; x++) { const w = ((x + (y >> 2) * 3) % 6 < 3) !== ((y >> 2) % 2 === 0); px(w ? P.mud2 : P.mud1, x, y); if (x % 12 === 0) px(P.mud3, x, y); } // proutí
      px(P.ink, 0, 80, W, 1);
      field(81, H, [P.mud0, P.mud1, P.water], (x, y) => 0.2 + 0.35 * hash(x >> 1, y >> 2, 51) + (Math.abs(x - 54) < 14 && Math.abs(y - 130) < 5 ? 0.4 : 0));
      for (let y = 88; y < H; y += 12) { px(P.mud2, 10, y, 70, 8); px(P.mud3, 10, y, 70, 1); px(P.ink, 10, y + 8, 70, 1); for (let x = 10; x < 80; x += 14) px(P.mud1, x, y + 1, 1, 7); } // prkna
      for (let y = 100; y < 160; y++) for (let x = 0; x < W; x++) if (hash(x >> 1, y >> 1, 53) > 0.72) px(P.mud1, x, y); // bláto přes prkna
      put(R.corpse, 68, 118);
      // převržená lucerna (světlo zdola)
      const fl = 0.8 + 0.2 * Math.sin(t * 9) * Math.sin(t * 5);
      glow(24, 132, 38, 0.55 * fl, '217,143,63');
      px(P.ink, 18, 130, 9, 6); px(P.gold, 19, 131, 6, 4); px(P.white, 20, 132, 2, 2); px(P.steel, 26, 129, 2, 8);
      // kartička rubem nahoru, napůl v blátě; lesk bliká; v o.pick zmizí (raider ji vezme)
      const pick = o.pick ?? 99;
      if (t < pick) { const cx = 50, cy = 140; px(P.ink, cx - 1, cy - 1, 7, 9); px(P.dark, cx, cy, 5, 7); px(P.white, cx + 1, cy + 1, 3, 5); px(P.rust, cx + 2, cy + 4, 1, 1); px(P.mud1, cx - 1, cy + 5, 7, 3); if ((t * 2.5) % 1 < 0.25) { px(P.white, cx + 5, cy - 2); px(P.pale, cx + 6, cy - 3); } }
      // raider klečí, natahuje se po ní; po zvednutí drží ruku u kapsy (dál klečí)
      put(t < pick ? at(S.kneel, t, 3) : S.kneel[0], 38, 146);
      rain(t, 60, P.steel, 160);
    },
  };
  return { canvas, draw(name, t, o = {}) { const sz = SIZE[name] || [135, 240]; if (canvas.width !== sz[0]) { canvas.width = sz[0]; canvas.height = sz[1]; } W = sz[0]; H = sz[1]; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.imageSmoothingEnabled = false; scenes[name]?.(Math.max(0, t), o); } };
}
