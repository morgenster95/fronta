// Filmové scény nočního raidu (Day reel Day 9, 18. 11. 2026) na pozadích z PixelLabu (art/cine/cine_raid_*.png, 180×256, obsah x 16–163;
// mimo web/public, do videa se načtou jen při natáčení). Mřížka 180×320 jako cinema-day8.js.
//  • melee – zákop v noci z boku: voják Concordu (odstřelovač, fire-side east) zastřelí obránce Hegemonie (die west); pak seskočí
//            raider Hegemonie s lopatkou (PixelLab shovel west) a v souboji lopatek (Concord shovel east) padne voják Concordu (die east)
//  • flare – země nikoho pod světlicí, raideři se plazí k nepřátelskému valu; světlice pulzuje a pomalu klesá, jiskry, mlha
// Použití: const rc = makeRaidScenes(tex, anims); root.prepend(rc.canvas); rc.draw('melee', t)
import { glow, off, clamp01, by, CW as W, CH as H } from './cinema.js';
import trenchSrc from '../../art/cine/cine_raid_trench.png';
import flareSrc from '../../art/cine/cine_raid_flare.png';

const shovelFiles = import.meta.glob('../../art/cine/anim/shovel_*.png', { eager: true, import: 'default' });
const X0 = 16, IW = 148, IH = 256, Y0 = 32;
const load = (src) => { const i = new Image(); i.src = src; return i; };
const NIGHT = 'rgba(30,36,70,0.28)';

function fromTex(tx, tint) {
  if (!tx?.source?.resource) return null;
  const f = tx.frame, o = off(f.width, f.height), g = o.getContext('2d');
  g.drawImage(tx.source.resource, f.x, f.y, f.width, f.height, 0, 0, f.width, f.height);
  if (tint) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = tint; g.fillRect(0, 0, f.width, f.height); }
  return o;
}
function fromImg(im, tint) {
  if (!im.complete || !im.naturalWidth) return null;
  const o = off(im.naturalWidth, im.naturalHeight), g = o.getContext('2d');
  g.drawImage(im, 0, 0);
  if (tint) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = tint; g.fillRect(0, 0, o.width, o.height); }
  return o;
}

export function makeRaidScenes(tex = {}, anims = {}) {
  const canvas = off(W, H);
  const g = canvas.getContext('2d');
  const IM = { trench: load(trenchSrc), flare: load(flareSrc) };
  const shovelImgs = (side) => Object.keys(shovelFiles).filter((k) => k.includes(`shovel_${side}_`)).sort().map((k) => load(shovelFiles[k]));
  const SH = { concord: shovelImgs('concord'), hegemony: shovelImgs('hegemony') };
  const cache = {};
  const shovel = (side, i) => (cache[`${side}${i}`] ??= fromImg(SH[side][i], NIGHT)) || null;
  const list = (arr) => (arr || []).map((t) => fromTex(t, NIGHT));
  const A = {
    cFire: list(anims.concord_sniper?.['fire-side']?.east),
    cDie: list(anims.concord?.die?.east),
    hDie: list(anims.hegemony?.die?.west),
    hStand: fromTex(tex.hegemony?.west, NIGHT),
    cStand: fromTex(tex.concord?.east, NIGHT),
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
  // postava: chodidla na (x, feet), měřítko k; snímky PixelLabu 48×48 mají chodidla kolem řádku 40
  const put = (fr, x, feet, k = 2.4, foot = 0.86) => { if (fr) g.drawImage(fr, Math.round(x - (fr.width * k) / 2), Math.round(feet - fr.height * k * foot), fr.width * k, fr.height * k); };
  const at = (arr, i) => arr[Math.max(0, Math.min(arr.length - 1, i))];
  const FEET = Y0 + 236;

  const scenes = {
    // o.cut: kdy přijde souboj lopatek (výchozí 1,7 s)
    melee(t, o = {}) {
      plate(IM.trench);
      glow(g, 128, Y0 + 30, 26 + Math.sin(t * 9) * 3, '#fff6dc', 0.5); // světlice nad valem
      glow(g, 40, Y0 + 150, 16, '#d98f3f', 0.35); // lampa v krytu
      const CUT = o.cut ?? 1.7, SHOT = 0.55;
      if (t < CUT) {
        // výstřel zleva doprava, obránce Hegemonie padá
        const fi = t < SHOT ? Math.floor((t / SHOT) * 5) : 5 + Math.floor((t - SHOT) * 10);
        put(at(A.cFire, fi), 52, FEET);
        if (t >= SHOT && t < SHOT + 0.09) { glow(g, 80, FEET - 46, 10, '#fff6dc', 1.5); glow(g, 120, FEET - 40, 22, '#fff6dc', 0.6); }
        put(t < SHOT + 0.05 ? A.hStand : at(A.hDie, Math.floor((t - SHOT - 0.05) * 11)), 126, FEET);
      } else {
        // souboj lopatek: Hegemonie seskočí z žebříku vpravo, oba se rozmáchnou, zásah, voják Concordu padá
        const u = t - CUT, land = clamp01(u / 0.25);
        const hx = 150 - land * 32, hy = FEET - (1 - land) * (1 - land) * 60;
        const HIT = 1.05;
        const hi = Math.min(8, Math.floor(u * 9));
        put(shovel('hegemony', u < 0.25 ? 0 : hi), hx, hy);
        if (u < HIT) put(shovel('concord', Math.min(4, Math.floor(u * 6))), 64, FEET);
        else put(at(A.cDie, Math.floor((u - HIT) * 10)), 64, FEET);
        if (u >= HIT - 0.04 && u < HIT + 0.08) { glow(g, 90, FEET - 30, 14, '#fff6dc', 1.4); }
      }
      // jiskry světlice
      g.fillStyle = '#e3d9c3';
      for (let k = 0; k < 6; k++) { const p = ((t * 0.7 + k * 0.17) % 1); if (p < 0.8) g.fillRect(Math.round(126 + Math.sin(k * 2.3) * 10 * p), Math.round(Y0 + 30 + p * 40), 1, 1); }
    },
    flare(t) {
      plate(IM.flare);
      const fy = Y0 + 30 + t * 3, pulse = 0.8 + Math.sin(t * 11) * 0.12 + Math.sin(t * 23) * 0.06;
      glow(g, 96, fy, 30 * pulse, '#fff6dc', 0.55);
      glow(g, 96, fy, 10, '#ffffff', 0.9);
      // kouř a mlha nízko nad blátem
      g.fillStyle = '#8a9295';
      for (let y = Y0 + 110; y < Y0 + 140; y++) for (let x = X0; x < X0 + IW; x++) if (0.12 * Math.sin((x + t * 6) * 0.07 + y * 0.4) + 0.04 > by(x, y) + Math.abs(y - Y0 - 125) * 0.012) g.fillRect(x, y, 1, 1);
      // padající jiskry
      g.fillStyle = '#fff6dc';
      for (let k = 0; k < 10; k++) { const p = ((t * 0.5 + k * 0.1) % 1); g.fillRect(Math.round(96 + Math.sin(k * 1.7) * 14 * p), Math.round(fy + p * 70), 1, 1); }
    },
  };
  return {
    canvas,
    draw(name, t, o) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.imageSmoothingEnabled = false;
      g.globalAlpha = 1;
      g.clearRect(0, 0, W, H);
      scenes[name]?.(Math.max(0, t), o);
    },
  };
}
