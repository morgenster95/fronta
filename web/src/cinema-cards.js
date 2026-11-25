// Filmové scény pro virální reel o sběratelských kartičkách (25. 11. 2026). Stejné měřítko jako hra (vzor cinema-d14.js / cinema-d15.js):
// blízký záběr 90×160 (×12), sprity a rekvizity ze hry 1:1, terén v kódu paletou Trench-24 s ditheringem, žádná průhlednost postav.
// Vždy JEDEN hlavní voják, celý vidět, pohybuje se plynule (uživatel: „plazí se víc vojáků za sebou a nejsou vidět“, „plazí se a nevyjde“).
//  • loot   – noc, kráter po granátu, na zemi hoří světlice: raider se doplazí k mrtvému nepříteli, klekne, z kapsy vytáhne kartičku (o.pick)
//  • wire   – noc pod drátem: voják se plazí zleva doprava, v blátě před ním se něco leskne, zastaví se a kartička se zvedne (o.pick)
//  • letter – kryt při svíčce: na stole obálka, otevře se, vyjede dopis a zpod něj vyklouzne kartička (o.pick)
import { off } from './cinema.js';
import { loadImage } from './assets.js';
import corpseSrc from '../../art/cine/corpse_con_crater.png';

let W = 90, H = 160;
const SIZE = { loot: [90, 160], wire: [90, 160], letter: [54, 96] }; // dopis: těsný záběr 54×96 (×20), voják větší (uživatel: „voják je miniaturní“)
const P = { ink: '#0e0d0c', dark: '#1c1a17', mud0: '#2b2722', mud1: '#3d3730', mud2: '#524a3f', mud3: '#6b6152', sand: '#857a68', bone: '#a39782', pale: '#c4b8a0', white: '#e3d9c3',
  steel: '#666d70', grey: '#8a9295', water: '#2a3138', navy: '#141a2c', dusk: '#4b4560', rust: '#7e3b2a', rust2: '#5c2a22', fire: '#a85a36', gold: '#d98f3f', yellow: '#c9c26a', olive: '#6f7148' };
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

export async function makeCardScenes(tex = {}, anims = {}) {
  const canvas = off(W, H);
  const g = canvas.getContext('2d');
  g.imageSmoothingEnabled = false;
  const NIGHT = 'rgba(30,36,72,0.30)', FLARE = 'rgba(150,50,30,0.16)', CANDLE = 'rgba(120,70,20,0.16)';
  const A = (k, a, d, tint) => (anims[k]?.[a]?.[d] || []).map((t) => sprite(t, tint));
  const prop = async (src, tint) => tinted(await loadAny(src), tint);
  const S = {
    crawlF: A('hegemony', 'crawl', 'east', FLARE), kneelF: A('hegemony', 'kneel', 'east', FLARE),
    crawlN: A('hegemony', 'crawl', 'east', NIGHT), proneN: A('hegemony', 'prone', 'east', NIGHT),
    reader: A('hegemony', 'idle', 'south', CANDLE),
  };
  const R = {
    corpse: await prop(corpseSrc, FLARE), wire: await Promise.all([0, 1, 2, 3].map((i) => prop(`/assets/props/wire_broken_${i}.png`, NIGHT))),
    picket: await prop('/assets/props/screw_picket_0.png', NIGHT), craterS: await prop('/assets/props/crater_s.png', NIGHT),
  };
  const feet = new Map();
  const at = (arr, t, fps) => (arr?.length ? arr[Math.floor(t * fps) % arr.length] : null);
  const once = (arr, t, fps) => (arr?.length ? arr[Math.min(arr.length - 1, Math.floor(t * fps))] : null);
  const put = (c, cx, foot) => {
    if (!c) return;
    if (!feet.has(c)) feet.set(c, footOf(c));
    g.drawImage(c, Math.round(cx - c.width / 2), Math.round(foot - feet.get(c)));
  };
  const px = (c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  const field = (y0, y1, cols, f) => { for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) { const v = clamp(f(x, y)) * 0.999; const u = v * (cols.length - 1); const i = Math.floor(u); px(u - i > by(x, y) ? cols[Math.min(cols.length - 1, i + 1)] : cols[i], x, y); } };
  const glow = (x, y, r, a, rgb) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
  // malá kartička ve hře (rub: tmavý rám, světlý střed, rudé srdíčko), zvedá se a třpytí
  const miniCard = (x, y, t) => {
    px(P.ink, x - 1, y - 1, 7, 10); px(P.mud1, x, y, 5, 8); px(P.white, x + 1, y + 1, 3, 6); px(P.rust, x + 2, y + 4, 1, 1);
    const s = (t * 3) % 1;
    if (s < 0.5) { px(P.white, x + 6, y - 2); px(P.pale, x + 7, y - 3); px(P.pale, x + 5, y - 3); }
  };
  const rays = (x, y, t, a) => { // záře nálezu: paprsky střídavě
    glow(x, y, 16, 0.55 * a, '230,190,110');
    for (let k = 0; k < 8; k++) { const ang = k * Math.PI / 4 + t * 0.8, L = 7 + ((k + Math.floor(t * 6)) % 2) * 3; for (let i = 3; i < L; i++) if (i % 2) px(k % 2 ? P.gold : P.yellow, x + Math.cos(ang) * i, y + Math.sin(ang) * i); }
  };
  const mud = (seed) => field(0, H, [P.mud0, P.mud1, P.mud2], (x, y) => 0.25 + 0.45 * hash(x >> 1, y >> 1, seed) + 0.1 * Math.sin((x + y * 2) * 0.2));

  const scenes = {
    loot(t, o = {}) {
      mud(61);
      // kráter: tmavý kruh s okrajem, voda na dně
      for (let y = 70; y < 140; y++) for (let x = 0; x < W; x++) {
        const dx = (x - 50) / 40, dy = (y - 104) / 26, d = dx * dx + dy * dy;
        if (d < 1) px(d < 0.25 ? (y > 108 ? P.water : P.mud0) : d < 0.6 ? (by(x, y) < 0.5 ? P.mud0 : P.mud1) : d > 0.85 && dy < 0 ? P.mud3 : P.mud1, x, y);
      }
      for (let x = 34; x < 66; x++) if (hash(x, 1, 63) < 0.4) px(P.steel, x, 112);
      // světlice hořící na zemi vlevo: rudé světlo, kouř
      const fl = 0.8 + 0.2 * Math.sin(t * 17) * Math.sin(t * 7);
      glow(14, 128, 40 * fl, 0.55, '200,70,40'); px(P.ink, 12, 124, 4, 6); px(P.fire, 13, 121, 2, 3); px(P.white, 13, 120, 2, 2);
      for (let k = 0; k < 10; k++) { const p = ((t * 0.5 + k / 10) % 1); px(k % 2 ? P.mud3 : P.sand, 14 + Math.sin(k + t) * 3 + p * 8, 118 - p * 60); }
      put(R.corpse, 54, 112);
      // raider se doplazí (0–2 s), klekne a hledá (2–pick), pak drží kartičku
      const pick = o.pick ?? 3.2;
      if (t < 2) put(at(S.crawlF, t, 8), -8 + t * 15, 116);
      else put(once(S.kneelF, t - 2, 6), 22, 116);
      if (t >= pick) { const k = clamp((t - pick) / 0.6); miniCard(40, 100 - k * 14, t); rays(43, 104 - k * 14, t, k); }
      g.fillStyle = 'rgba(20,14,30,0.18)'; g.fillRect(0, 0, W, 60); // noc nahoře (místo pro titulky)
    },
    wire(t, o = {}) {
      field(0, 46, [P.navy, P.dark, P.mud0], (x, y) => y / 46);
      for (let x = 0; x < W; x++) { const h = 2 + Math.round(2 * Math.sin(x * 0.3) + hash(x, 0, 71) * 2); px(P.ink, x, 44 - h, 1, h + 2); }
      mud(72);
      for (let y = 46; y < H; y++) for (let x = 0; x < W; x++) if (hash(x >> 2, y >> 2, 73) > 0.93 && by(x, y) < 0.6) px(P.bone, x, y); // zbytky sněhu (řídce, v hroudách)
      put(R.craterS, 70, 150);
      // drát nahoře přes celou šířku (za vojákem, nic ho nezakrývá)
      for (let i = 0, x = -6; x < W + 10; x += 22, i++) { put(R.wire[i % 4], x, 86); if (i % 2) put(R.picket, x + 11, 88); }
      // světlice vysoko: pomalu klesá a mírně svítí
      const fx = 70 - t * 2, fy = 8 + t * 2.5;
      glow(fx, fy, 50, 0.35, '230,200,130'); px(P.white, fx, fy, 2, 2);
      // jeden voják se plazí zleva (vždy celý v záběru), před ním se v blátě leskne kartička
      const pick = o.pick ?? 3.4, stop = 3.0;
      const x = 8 + Math.min(t, stop) * 13;
      put(t < stop ? at(S.crawlN, t, 8) : S.crawlN[0], x, 126); // stojí na místě vleže (první snímek plazení), ne vstávací póza
      const cx = 66, cy = 120;
      if (t < pick) { px(P.mud0, cx - 1, cy + 4, 7, 2); px(P.white, cx + 1, cy + 3, 3, 1); if ((t * 2.2) % 1 < 0.3) { px(P.white, cx + 5, cy); px(P.pale, cx + 6, cy - 1); px(P.pale, cx + 4, cy - 1); } }
      else { const k = clamp((t - pick) / 0.6); miniCard(cx, cy - k * 16, t); rays(cx + 3, cy + 4 - k * 16, t, k); }
    },
    letter(t, o = {}) {
      // těsný záběr 54×96 ve stejném měřítku jako hra (voják ~30 px = třetina výšky): stěna z prken, polička, stůl se svíčkou;
      // obálka, dopis a kartička jsou jen pár pixelů (detail pak ukáže velké otočení kartičky)
      field(0, 70, [P.dark, P.mud0, P.mud1], (x, y) => (x % 9 === 0 ? 0 : 0.3 + 0.35 * hash(x >> 1, y >> 3, 81)));
      for (let x = 0; x < W; x += 9) px(P.ink, x, 0, 1, 70);
      px(P.mud2, 0, 4, W, 2); px(P.ink, 0, 6, W, 1);
      px(P.ink, 30, 26, 22, 2); px(P.mud3, 30, 25, 22, 1); for (const [x, c] of [[32, P.steel], [37, P.rust], [42, P.grey], [47, P.gold]]) { px(P.ink, x, 19, 4, 6); px(c, x + 1, 20, 2, 4); }
      px(P.olive, 3, 22, 7, 15); px(P.ink, 6, 20, 1, 3); // kabát na háku
      field(70, H, [P.mud0, P.mud1, P.mud2], (x, y) => ((y - 70) % 7 === 0 ? 0 : 0.35 + 0.3 * hash(x >> 2, y, 82)));
      px(P.ink, 0, 69, W, 1);
      const fl = 0.85 + 0.15 * Math.sin(t * 10) * Math.sin(t * 6);
      glow(38, 58, 34, 0.55 * fl, '217,143,63');
      put(at(S.reader, t, 3), 24, 76); // voják za stolem (stůl mu zakryje nohy)
      px(P.ink, 10, 62, 34, 6); px(P.sand, 11, 62, 32, 2); px(P.mud3, 11, 64, 32, 3); px(P.ink, 12, 68, 2, 12); px(P.ink, 40, 68, 2, 12);
      px(P.bone, 38, 57, 2, 5); px(P.gold, 38, 55, 2, 2); px(P.white, 38, 55 + (fl > 0.9 ? 0 : 1), 1, 1);
      const ex = 20, ey = 59;
      px(P.ink, ex - 1, ey - 1, 9, 6); px(P.pale, ex, ey, 7, 4); px(P.rust, ex + 5, ey + 1, 1, 1);
      const open = clamp((t - 0.8) / 0.5);
      if (open < 0.5) { px(P.bone, ex + 1, ey + 1, 2, 1); px(P.bone, ex + 3, ey + 2, 1, 1); px(P.bone, ex + 4, ey + 1, 2, 1); } else px(P.bone, ex + 1, ey - 2, 5, 2);
      if (t > 1.3) { const k = clamp((t - 1.3) / 0.8); px(P.ink, ex + 1, ey - 2 - k * 4, 5, 6); px(P.white, ex + 2, ey - 1 - k * 4, 3, 4); px(P.steel, ex + 2, ey - k * 4, 3, 1); }
      const pick = o.pick ?? 2.8;
      if (t >= pick) { const k = clamp((t - pick) / 0.7); const cx = ex + 8 + k * 4, cy = ey - 3 - k * 6; px(P.ink, cx - 1, cy - 1, 6, 8); px(P.mud1, cx, cy, 4, 6); px(P.white, cx + 1, cy + 1, 2, 4); rays(cx + 2, cy + 3, t, k); }
    },
  };
  return { canvas, draw(name, t, o = {}) { const sz = SIZE[name] || [90, 160]; if (canvas.width !== sz[0]) { canvas.width = sz[0]; canvas.height = sz[1]; } W = sz[0]; H = sz[1]; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.imageSmoothingEnabled = false; scenes[name]?.(Math.max(0, t), o); } };
}
