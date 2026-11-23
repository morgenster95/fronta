// Filmové scény k reelu „Trench Dogs“ (21. 11. 2026), na výšku: mřížka 135×240 (×8 na 1080×1920), paleta Trench-24,
// psi jsou sprity ze hry (props/dog_<plemeno>_sit.png, PixelLab), vojáci ze hry. Žádná průhlednost postav (jen barevný nádech).
//   arrive  – noc v zákopu, lucerna se rozsvítí: u vojáka na stupínku sedí pes; světlice
//   breed   – detail jednoho psa ×2 v krytu u lampy (o.i = plemeno 0..4)
//   lineup  – všech pět psů sedí na valu z pytlů za soumraku
//   diary   – stůl v krytu, svíčka, pes leží u nohou (deník je v DOM přes obraz)
//   family  – soumrak, puška s helmou nad hrobem, pes sedí a čeká; v o.next přijde nový voják rodu, pes se k němu otočí
import { loadImage } from './assets.js';

const W = 135, H = 240;
const PAL = { ink: '#0e0d0c', dark: '#1c1a17', mud0: '#2b2722', mud1: '#3d3730', mud2: '#524a3f', mud3: '#6b6152', sand: '#857a68', bone: '#a39782', pale: '#c4b8a0', white: '#e3d9c3', gold: '#d98f3f', rust: '#7e3b2a', steel: '#666d70', grey: '#8a9295', navy: '#141a2c', dusk: '#4b4560', fire: '#a85a36', olive: '#6f7148' };
export const BREEDS = ['airedale', 'shepherd', 'jackrussell', 'collie', 'dachshund'];
const B4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const dith = (x, y) => (B4[y & 3][x & 3] + 0.5) / 16;
const off = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
function tinted(src, tint) {
  if (!src) return null;
  const w = src.width || src.frame?.width, h = src.height || src.frame?.height;
  const c = off(w, h), q = c.getContext('2d');
  q.drawImage(src, 0, 0);
  if (tint) { q.globalCompositeOperation = 'source-atop'; q.fillStyle = tint; q.fillRect(0, 0, w, h); }
  return c;
}
function fromTex(tx, tint) {
  if (!tx?.source?.resource) return null;
  const f = tx.frame, c = off(f.width, f.height), q = c.getContext('2d');
  q.drawImage(tx.source.resource, f.x, f.y, f.width, f.height, 0, 0, f.width, f.height);
  if (tint) { q.globalCompositeOperation = 'source-atop'; q.fillStyle = tint; q.fillRect(0, 0, f.width, f.height); }
  return c;
}
const flip = (img) => { if (!img) return null; const c = off(img.width, img.height), q = c.getContext('2d'); q.translate(img.width, 0); q.scale(-1, 1); q.drawImage(img, 0, 0); return c; };

export async function makeDogCine(tex = {}) {
  const canvas = off(W, H);
  const g = canvas.getContext('2d');
  g.imageSmoothingEnabled = false;
  const raw = {};
  await Promise.all(BREEDS.map(async (b) => { raw[b] = await loadImage(`/assets/props/dog_${b}_sit.png`).catch(() => null); raw[`${b}_lie`] = await loadImage(`/assets/props/dog_${b}_lie.png`).catch(() => null); }));
  const NIGHT = 'rgba(30,36,72,0.28)', WARM = 'rgba(120,70,20,0.14)', DUSK = 'rgba(90,50,60,0.18)';
  const D = {};
  for (const b of BREEDS) { D[b] = { night: tinted(raw[b], NIGHT), warm: tinted(raw[b], WARM), dusk: tinted(raw[b], DUSK), lie: tinted(raw[`${b}_lie`], WARM) }; D[b].duskL = flip(D[b].dusk); }
  const SOL = { hegS: fromTex(tex.hegemony?.south, NIGHT), conS: fromTex(tex.concord?.south, DUSK), conW: fromTex(tex.concord?.west, DUSK), hegW: fromTex(tex.hegemony?.west, DUSK) };
  const px = (c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const glow = (x, y, r, a, rgb = '255,205,130') => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
  const dog = (img, x, feet, k = 1) => { if (img) g.drawImage(img, Math.round(x - 16 * k), Math.round(feet - 32 * k), 32 * k, 32 * k); };
  const man = (img, x, feet, k = 1) => { if (img) g.drawImage(img, Math.round(x - img.width * k / 2), Math.round(feet - 30 * k), img.width * k, img.height * k); };
  function sky(cols, h) { for (let y = 0; y < h; y++) for (let x = 0; x < W; x++) { const u = (y / h) * (cols.length - 1) + (dith(x, y) - 0.5); px(cols[Math.max(0, Math.min(cols.length - 1, Math.round(u)))], x, y); } }
  function bags(x0, x1, y, rows) {
    for (let r = rows - 1; r >= 0; r--) for (let x = x0 - (r % 2 ? 6 : 0) - 12, i = 0; x < x1; x += 11, i++) {
      const c = [[PAL.sand, PAL.bone, PAL.mud3], [PAL.mud3, PAL.sand, PAL.mud2], [PAL.bone, PAL.pale, PAL.sand]][(i * 7 + r * 3) % 3], yy = y + r * 5;
      px(PAL.ink, x + 1, yy, 10, 1); px(PAL.ink, x, yy + 1, 1, 5); px(PAL.ink, x + 11, yy + 1, 1, 5); px(PAL.ink, x + 1, yy + 6, 10, 1);
      px(c[0], x + 1, yy + 1, 10, 5); px(c[1], x + 2, yy + 1, 7, 1); px(c[2], x + 1, yy + 5, 10, 1);
    }
  }
  function planks(y0, y1, warm = 1) { for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) px((x % 17) === 0 ? PAL.mud0 : dith(x, y) < 0.14 ? PAL.mud2 : warm ? PAL.mud1 : PAL.dark, x, y); }
  function rain(t, n = 50) { g.fillStyle = 'rgba(170,180,195,0.4)'; for (let k = 0; k < n; k++) { const p = (k * 0.618) % 1, q = (k * 0.754) % 1; const y = ((q * 280 + t * 240) % 260) - 10; g.fillRect(Math.round((p * W - y * 0.2 + W) % W), Math.round(y), 1, 3); } }
  const NIGHTSKY = [PAL.navy, '#1d2238', '#262a44', '#2f2f4c', PAL.dusk];
  const DUSKSKY = ['#262a44', '#3a3550', '#55485a', '#7a5a58', '#a0705a', '#c48a62'];

  const scenes = {
    arrive(t, o) {
      const L = Math.min(1, Math.max(0, (t - 0.6) / 1.2)); // lucerna se rozsvěcí
      sky(NIGHTSKY, 110);
      if (t > (o.flare ?? 9)) { const u = t - o.flare; glow(40 + u * 3, 30 - Math.min(18, u * 20) + Math.max(0, u - 1) * 4, 50, 0.4 * Math.max(0, 1 - Math.max(0, u - 2.5) / 2)); }
      bags(0, W, 96, 3);
      planks(111, 200, 0);
      px(PAL.mud3, 0, 186, W, 3); // stupínek
      for (let y = 200; y < H; y++) for (let x = 0; x < W; x++) px(y < 205 ? ((x % 9) === 0 ? PAL.mud0 : PAL.mud3) : dith(x, y) < 0.2 ? PAL.mud1 : PAL.mud0, x, y);
      // lucerna na sloupku
      px(PAL.mud3, 104, 120, 2, 66); px(PAL.ink, 100, 128, 10, 2); px(PAL.gold, 101, 131, 8, 7); px(PAL.white, 103, 133, 4, 3 * L | 0 || 1);
      man(SOL.hegS, 44, 188, 2); // detail: voják a pes ×2
      dog(D[o.breed || 'shepherd'].night, 88, 189, 2);
      g.fillStyle = `rgba(14,13,12,${0.55 * (1 - L)})`; g.fillRect(0, 0, W, H);
      if (L > 0) glow(105, 134, 70, 0.45 * L * (0.92 + 0.08 * Math.sin(t * 13)));
      rain(t, 40);
    },
    breed(t, o) {
      planks(0, H, 1);
      px(PAL.mud3, 0, 172, W, 3); px(PAL.mud0, 0, 175, W, 1);
      for (let y = 176; y < H; y++) for (let x = 0; x < W; x++) px(dith(x, y) < 0.18 ? PAL.mud2 : PAL.mud1, x, y);
      px(PAL.ink, 66, 0, 1, 40); px(PAL.mud3, 62, 40, 9, 2); px(PAL.gold, 63, 42, 7, 6); px(PAL.white, 65, 43, 3, 3);
      glow(67, 46, 120, 0.5 * (0.94 + 0.06 * Math.sin(t * 11)));
      dog(D[BREEDS[o.i % 5]].warm, 67, 175, 3);
    },
    lineup(t, o) {
      sky(DUSKSKY, 150);
      glow(110, 150, 60, 0.35, '255,180,110');
      for (const [x, h] of [[12, 30], [118, 22]]) { px(PAL.ink, x, 150 - h, 2, h); px(PAL.ink, x - 4, 150 - h + 6, 4, 1); }
      bags(0, W, 150, 4);
      for (let y = 170; y < H; y++) for (let x = 0; x < W; x++) px(dith(x, y) < 0.2 ? PAL.mud1 : PAL.mud0, x, y);
      BREEDS.forEach((b, i) => dog(D[b].dusk, 15 + i * 26, 151));
    },
    diary(t, o) {
      planks(0, 150, 1);
      for (let y = 150; y < H; y++) for (let x = 0; x < W; x++) px(y < 154 ? PAL.sand : dith(x, y) < 0.15 ? PAL.mud3 : PAL.mud2, x, y); // stůl
      px(PAL.white, 112, 132, 4, 18); px(PAL.gold, 113, 128, 2, 4); // svíčka
      glow(114, 128, 90, 0.5 * (0.9 + 0.1 * Math.sin(t * 9)));
      const lie = D[o.breed || 'jackrussell'].lie; if (lie) g.drawImage(lie, 4, 200, 64, 64);
    },
    family(t, o) {
      sky(DUSKSKY, 170);
      glow(30, 165, 70, 0.4, '255,180,110');
      for (let y = 170; y < H; y++) for (let x = 0; x < W; x++) px(y < 173 ? PAL.mud3 : dith(x, y) < 0.18 ? PAL.mud2 : PAL.mud1, x, y);
      // dřevěný kříž s helmou (hrob), hlína kolem
      px(PAL.ink, 42, 140, 5, 36); px(PAL.mud3, 43, 141, 3, 35); px(PAL.ink, 34, 148, 21, 5); px(PAL.mud3, 35, 149, 19, 3);
      g.fillStyle = PAL.ink; g.beginPath(); g.ellipse(44.5, 141, 8, 5, 0, Math.PI, 0); g.fill(); g.fillStyle = PAL.steel; g.beginPath(); g.ellipse(44.5, 141, 7, 4, 0, Math.PI, 0); g.fill(); px(PAL.ink, 36, 141, 18, 1);
      g.fillStyle = PAL.mud2; g.beginPath(); g.ellipse(45, 176, 16, 3, 0, 0, Math.PI * 2); g.fill(); // hrob
      const came = t > (o.next ?? 99);
      dog(came ? D[o.breed || 'collie'].dusk : D[o.breed || 'collie'].duskL, 72, 177, 1.5);
      if (came) man(SOL[o.man || 'conW'] || SOL.conW, 110, 177, 1.5); // o.man: kdo přijde (nástupce strany psa)
    },
  };
  return { canvas, draw(name, t, o = {}) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.clearRect(0, 0, W, H); scenes[name]?.(Math.max(0, t), o); } };
}
