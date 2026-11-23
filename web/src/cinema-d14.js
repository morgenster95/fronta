// Nové filmové scény Day reelu Day 14 (23. 11. 2026). Uživatel: „NOVÉ, NIC NEPOUŽÍVÁME VÍCKRÁT“ → pět nových obrazů prostředí
// z PixelLabu BEZ postav a zbraní (art/cine/d14_*.png, 180×256; web je nestahuje) a do nich naše sprity a animace ze hry ×2.
// Plátno = celý obraz 180×256, v reelu přes celou výšku (CSS object-fit: cover). Evidence použitých scén: marketing/reels/scenes-used.json.
//  • wirenight – země nikoho v noci, světlice padá do kráteru: tři vojáci Hegemonie u drátu (jeden se plazí, dva zatloukají kůl);
//                když světlice zazáří, přitisknou se k zemi
//  • raid      – úzký zasněžený zákop s lampou: raider Concordu a Gideon Cubes se bijí lopatkami, raider padne (o.fall s)
//  • aid       – podzemní obvaziště: raněný leží na nosítkách, medik ho obvazuje, lampa bliká
//  • graves    – hřbitov za frontou za soumraku: pes sedí u kříže s helmou, v o.heir s přijde nástupce a zastaví se vedle psa
//  • road      – zásobovací cesta za úsvitu: nováčci jdou v zástupu po cestě k frontě (zády k nám), padá sníh
import { glow, off, by } from './cinema.js';
import { loadImage } from './assets.js';
import wireSrc from '../../art/cine/d14_wirenight.png';
import trenchSrc from '../../art/cine/d14_trenchnight.png';
import aidSrc from '../../art/cine/d14_aidstation.png';
import gravesSrc from '../../art/cine/d14_graves.png';
import roadSrc from '../../art/cine/d14_road.png';

const shovels = import.meta.glob('../../art/cine/anim/shovel_*.png', { eager: true, import: 'default' });
const W = 180, H = 256, K = 2;
const load = (src) => { const i = new Image(); i.src = src; return i; };

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

export async function makeDay14Scenes(tex = {}, anims = {}) {
  const canvas = off(W, H);
  const g = canvas.getContext('2d');
  g.imageSmoothingEnabled = false;
  const IM = { wirenight: load(wireSrc), raid: load(trenchSrc), aid: load(aidSrc), graves: load(gravesSrc), road: load(roadSrc) };
  const NIGHT = 'rgba(30,36,72,0.30)', LAMP = 'rgba(120,70,20,0.16)', DUSK = 'rgba(90,50,60,0.18)', DAWN = 'rgba(110,70,40,0.14)';
  const A = (k, a, d, tint) => (anims[k]?.[a]?.[d] || []).map((t) => sprite(t, tint));
  const shov = async (side, tint) => Promise.all(Object.keys(shovels).filter((k) => k.includes(`shovel_${side}_`)).sort().map(async (k) => tinted(await loadImage(shovels[k]).catch(() => null), tint)));
  const S = {
    crawl: A('hegemony', 'crawl', 'east', NIGHT), work: A('hegemony', 'work', 'north', NIGHT), prone: sprite(anims.hegemony?.prone?.north?.[0] || tex.hegemony?.north, NIGHT),
    shH: await shov('hegemony', LAMP), shC: await shov('concord', 'rgba(30,36,72,0.22)'), dieC: A('concord', 'die', 'east', 'rgba(30,36,72,0.22)'),
    band: A('hegemony_medic', 'bandage', 'west', LAMP), lying: sprite((anims.hegemony?.['lying-wounded']?.east || [])[0], LAMP),
    walkW: A('hegemony', 'walk', 'west', DUSK), standW: sprite(tex.hegemony?.west, DUSK),
    march: A('hegemony', 'walk', 'north', DAWN), marchC: A('concord', 'walk', 'north', DAWN),
  };
  const dog = tinted(await loadImage('/assets/props/dog_airedale_sit.png').catch(() => null), DUSK);
  const dogs = {};
  for (const b of ['airedale', 'shepherd', 'jackrussell', 'collie', 'dachshund']) dogs[b] = tinted(await loadImage(`/assets/props/dog_${b}_sit.png`).catch(() => null), DUSK);
  const feet = new Map();
  const at = (arr, t, fps) => (arr.length ? arr[Math.floor(t * fps) % arr.length] : null);
  const put = (c, cx, foot, flip = false, k = K) => {
    if (!c) return;
    if (!feet.has(c)) feet.set(c, footOf(c));
    const w = c.width * k, h = c.height * k, x = Math.round(cx - w / 2), y = Math.round(foot - feet.get(c) * k);
    if (flip) { g.save(); g.translate(x + w, y); g.scale(-1, 1); g.drawImage(c, 0, 0, w, h); g.restore(); } else g.drawImage(c, x, y, w, h);
  };
  const plate = (im) => { g.fillStyle = '#0e0d0c'; g.fillRect(0, 0, W, H); if (im.complete && im.naturalWidth) g.drawImage(im, 0, 0, W, H); };
  const snow = (t, n = 70, a = 0.55) => { g.fillStyle = `rgba(227,217,195,${a})`; for (let k = 0; k < n; k++) { const p = (k * 0.618) % 1, q = (k * 0.754) % 1; const y = ((q * 280 + t * 22) % 280) - 10; g.fillRect(Math.round((p * 200 + Math.sin(t + k) * 4) % 190 - 5), Math.round(y), 1, 1); } };

  const scenes = {
    wirenight(t) {
      plate(IM.wirenight);
      const u = t % 5, bright = u > 1.2 && u < 2.6 ? Math.sin(((u - 1.2) / 1.4) * Math.PI) : 0; // světlice zazáří
      glow(g, 118, 47, 30 + bright * 30, '#d98f3f', 0.35 + bright * 0.45);
      const down = bright > 0.3; // ve světle se přitisknou k zemi
      put(down ? S.prone : at(S.crawl, t, 6), 52, 226);
      put(down ? S.prone : at(S.work, t, 7), 112, 214);
      put(down ? S.prone : at(S.work, t + 0.4, 7), 140, 232, true);
      if (bright) { g.fillStyle = `rgba(217,143,63,${0.12 * bright})`; g.fillRect(0, 0, W, H); }
    },
    raid(t, o = {}) {
      plate(IM.raid);
      glow(g, 75, 84, 20 + Math.sin(t * 8) * 2, '#d98f3f', 0.5); // lampa na háku
      const fall = o.fall ?? 2.4;
      put(at(S.shH, t, 10), 112, 236, false, 1.6); // Cubes (lopata)
      if (t < fall) put(at(S.shC, t + 0.3, 10), 76, 238, false, 1.6); // raider
      else put(S.dieC[Math.min(S.dieC.length - 1, Math.floor((t - fall) * 9))], 70, 246, false, 1.6);
      snow(t, 50, 0.45);
    },
    aid(t) {
      plate(IM.aid);
      glow(g, 26, 62, 26 + Math.sin(t * 7) * 2 + Math.sin(t * 17), '#d98f3f', 0.45);
      put(S.lying, 62, 214); // nosítka jsou plná, další raněný leží na zemi
      put(at(S.band, t, 6), 98, 212);
    },
    graves(t, o = {}) {
      plate(IM.graves);
      glow(g, 106, 104, 18 + Math.sin(t * 1.3) * 2, '#d98f3f', 0.4);
      put(dogs[o.breed || 'airedale'] || dog, 66, 236);
      const T0 = o.heir ?? 99;
      if (t >= T0) { const q = Math.min(1, (t - T0) / 1.4); put(q < 1 ? at(S.walkW, t, 8) : S.standW, 190 - q * 86, 242); }
      snow(t, 80, 0.6);
    },
    road(t) {
      plate(IM.road);
      // zástup nováčků jde po cestě k frontě (zády k nám), střídají se strany
      for (let i = 0; i < 5; i++) {
        const q = ((t * 0.09 + i * 0.2) % 1), y = 252 - q * 70, x = 98 + q * 22 - (i % 2) * 8;
        const k = 2 - q * 0.9;
        put(at(i % 2 ? S.marchC : S.march, t + i * 0.3, 8), x, y, false, Math.max(1, Math.round(k * 2) / 2));
      }
      snow(t, 70, 0.5);
    },
  };
  return { canvas, draw(name, t, o = {}) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.imageSmoothingEnabled = false; scenes[name]?.(Math.max(0, t), o); } };
}
