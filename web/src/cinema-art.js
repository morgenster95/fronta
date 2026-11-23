// Kreslené obrazy pro atmosféru (art/cine/*.png z PixelLabu, 180×256 s obsahem 148×256) a v nich NAŠE sprity ze hry (×2),
// uživatel 23. 11.: „cinematické byly dřív pěkné kresby pro atmosféru, ty chci zachovat, ale dodávat tam naše sprity“.
// Obrázky leží mimo web/public (web je nestahuje), do videa se načtou jen při natáčení. Mřížka 180×320 jako cinema.js / cinema-day8.js.
//  • lantern – noční zákop s lucernou a žebříkem: voják (zezadu) hlídá u valu, na prknech leží odražený raider; lucerna bliká,
//              přes val občas přejede světlo světlice (o.side = strana hlídky, o.raider = strana raidera nebo null)
//  • medic   – šedé svítání, puška a brašna s křížem na valu: medik klečí u raněného a obvazuje ho (animace bandage ze hry)
//  • vigil   – úsvit, na pytlích plecháček čaje, křížek a knížka; vedle sedí pes (o.breed) a čeká, z hrnku stoupá pára
// Použití: const art = await makeArtScenes(tex, anims); root.prepend(art.canvas); art.draw('lantern', t, { side: 0, raider: 1 })
import { glow, off, by } from './cinema.js';
import { loadImage } from './assets.js';
import trenchSrc from '../../art/cine/cine_raid_trench.png';
import rifleSrc from '../../art/cine/cine_rifle.png';
import teaSrc from '../../art/cine/cine_tea.png';

// plátno = celý obrázek 180×256 bez pruhů; v reelu se roztáhne přes celou výšku (CSS object-fit: cover, kraje se oříznou)
const W = 180, H = 256, X0 = 16, IW = 148, IH = 256, Y0 = 0;
const load = (src) => { const i = new Image(); i.src = src; return i; };
const K = 2; // sprity ×2 (postava ~60 px proti dveřím a žebříku v obrázku)

function sprite(tx, tint, flip = false) {
  if (!tx?.source?.resource) return null;
  const f = tx.frame, o = off(f.width, f.height), g = o.getContext('2d');
  if (flip) { g.translate(f.width, 0); g.scale(-1, 1); }
  g.drawImage(tx.source.resource, f.x, f.y, f.width, f.height, 0, 0, f.width, f.height);
  g.setTransform(1, 0, 0, 1, 0, 0);
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
// spodní řádek postavy (pata) v plátně spritu, ať stojí na zemi obrázku
function footOf(c) {
  if (!c) return 0;
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  for (let y = c.height - 1; y >= 0; y--) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 0) return y + 1;
  return c.height;
}

export async function makeArtScenes(tex = {}, anims = {}) {
  const canvas = off(W, H);
  const g = canvas.getContext('2d');
  g.imageSmoothingEnabled = false;
  const IM = { lantern: load(trenchSrc), medic: load(rifleSrc), vigil: load(teaSrc) };
  const NIGHT = 'rgba(30,36,72,0.30)', DAWN = 'rgba(40,46,70,0.22)', SUN = 'rgba(120,70,40,0.16)';
  const side = ['hegemony', 'concord'];
  const A = (k, a, d, tint) => (anims[k]?.[a]?.[d] || []).map((t) => sprite(t, tint));
  const S = {
    guard: side.map((k) => sprite(tex[k]?.north, NIGHT)),
    raider: side.map((k) => { const fr = anims[k]?.die?.west || anims[k]?.die?.east || []; return sprite(fr.at(-1), 'rgba(120,70,20,0.18)'); }), // nasvícený lucernou
    band: side.map((k) => A(`${k}_medic`, 'bandage', 'east', 'rgba(40,46,70,0.12)')),
    lying: side.map((k) => sprite((anims[k]?.['lying-wounded']?.east || [])[0], 'rgba(40,46,70,0.12)')),
  };
  const dogs = {};
  for (const b of ['airedale', 'shepherd', 'jackrussell', 'collie', 'dachshund']) dogs[b] = tinted(await loadImage(`/assets/props/dog_${b}_sit.png`).catch(() => null), SUN);
  const feet = new Map();
  const put = (c, cx, foot, flip = false) => {
    if (!c) return;
    if (!feet.has(c)) feet.set(c, footOf(c));
    const w = c.width * K, h = c.height * K;
    const x = Math.round(cx - w / 2), y = Math.round(foot - feet.get(c) * K);
    if (flip) { g.save(); g.translate(x + w, y); g.scale(-1, 1); g.drawImage(c, 0, 0, w, h); g.restore(); } else g.drawImage(c, x, y, w, h);
  };

  function plate(im) {
    g.fillStyle = '#0e0d0c'; g.fillRect(0, 0, W, H);
    if (!im.complete || !im.naturalWidth) return false;
    g.drawImage(im, X0, 0, IW, IH, X0, Y0, IW, IH);
    g.save(); g.translate(X0, 0); g.scale(-1, 1); g.drawImage(im, X0, 0, X0, IH, 0, Y0, X0, IH); g.restore();
    g.save(); g.translate(X0 + IW + X0, 0); g.scale(-1, 1); g.drawImage(im, X0 + IW - X0, 0, X0, IH, 0, Y0, X0, IH); g.restore();
    g.fillStyle = '#0e0d0c';
    for (let y = Y0; y < Y0 + IH; y++) for (let x = 0; x < X0 + 2; x++) {
      const d = 1 - x / (X0 + 2);
      if (d * 0.95 > by(x, y)) g.fillRect(x, y, 1, 1);
      if (d * 0.95 > by(W - 1 - x, y)) g.fillRect(W - 1 - x, y, 1, 1);
    }
    return true;
  }
  const rain = (t, a = 0.3) => { g.fillStyle = `rgba(170,180,195,${a})`; for (let k = 0; k < 60; k++) { const p = (k * 0.618) % 1, q = (k * 0.754) % 1; const y = ((q * 340 + t * 240) % 340) - 10; g.fillRect(Math.round((p * 230 - y * 0.2 + 230) % 230 - 20), Math.round(y), 1, 3); } };

  const scenes = {
    lantern(t, o = {}) {
      plate(IM.lantern);
      const f = o.side ?? 0;
      // lucerna ve dveřích krytu (obrázek ~x 18, y 120) bliká
      glow(g, X0 + 4, Y0 + 122, 26 + Math.sin(t * 7) * 2 + Math.sin(t * 17) * 1, '#d98f3f', 0.55);
      // odražený raider leží na prknech, hlídka stojí u valu zády k nám
      if (o.raider != null) put(S.raider[o.raider], 62, Y0 + 226);
      put(S.guard[f], 112, Y0 + 212);
      // světlice: přes val přejede světlo
      const u = (t % 6) / 6;
      if (u > 0.15 && u < 0.7) glow(g, 30 + u * 140, Y0 + 30, 50, '#c4b8a0', 0.35 * Math.sin(((u - 0.15) / 0.55) * Math.PI));
      rain(t, 0.22);
    },
    medic(t, o = {}) {
      plate(IM.medic);
      const f = o.side ?? 0;
      g.fillStyle = '#8a9295';
      for (let y = Y0 + 78; y < Y0 + 100; y++) for (let x = X0; x < X0 + IW; x++) if (0.14 * Math.sin((x + t * 4) * 0.08 + y * 0.5) + 0.05 > by(x, y) + Math.abs(y - Y0 - 89) * 0.015) g.fillRect(x, y, 1, 1);
      // raněný leží na dně zákopu, medik u něj klečí a obvazuje
      put(S.lying[f], 108, Y0 + 226);
      const band = S.band[f];
      if (band.length) put(band[Math.floor(t * 6) % band.length], 62, Y0 + 224);
      rain(t, 0.25);
    },
    vigil(t, o = {}) {
      plate(IM.vigil);
      glow(g, 126, Y0 + 75, 22 + Math.sin(t * 1.5) * 2, '#d98f3f', 0.55);
      for (let i = 0; i < 30; i++) {
        const u = ((t * 0.45 + i * 0.034) % 1);
        const x = 62 + Math.sin(u * 6 + i) * 2.5 * u + u * u * 10, y = Y0 + 128 - u * 62;
        if (0.6 - u * 0.6 > by(Math.round(x), Math.round(y))) { g.fillStyle = u < 0.35 ? '#e3d9c3' : '#a39782'; g.fillRect(Math.round(x), Math.round(y), 2, 2); }
      }
      // pes sedí na pytlích vedle hrnku, dívá se k obzoru (zrcadlený, ať hledí doprava)
      put(dogs[o.breed || 'airedale'], 35, Y0 + 149, true);
      for (let k = 0; k < 3; k++) {
        const x = ((t * 12 + k * 46) % 190) - 10, y = Y0 + 40 + k * 9 + Math.sin(t * 2 + k) * 2, w = Math.sin(t * 9 + k) > 0 ? -1 : 1;
        g.fillStyle = '#1c1a17'; g.fillRect(Math.round(x), Math.round(y), 2, 1); g.fillRect(Math.round(x) - 2, Math.round(y) + w, 2, 1); g.fillRect(Math.round(x) + 2, Math.round(y) + w, 2, 1);
      }
    },
  };
  return { canvas, draw(name, t, o = {}) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.imageSmoothingEnabled = false; scenes[name]?.(Math.max(0, t), o); } };
}
