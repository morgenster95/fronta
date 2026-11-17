// Filmové scény Day reelu Day 8 (17. 11. 2026) na pozadích z PixelLabu (art/cine/*.png, 180×256 s obsahem 148×256; mimo web/public,
// do videa se načtou jen při natáčení, web je nestahuje). Mřížka 180×320, okraje 16 px po stranách doplní zrcadlený kraj s vinětou.
//  • tea   – úsvit, na pytlích plecháček čaje, křížek na šňůrce a otevřená knížka (kaplan Gideon „Whistle“ Vylet); v kódu pára, záře slunce, ptáci
//  • rifle – zákop za šedého svítání, puška a brašna s křížem na valu; u valu stojí voják Concordu (herní sprite zezadu) a střílí,
//            na obzoru blikne výstřel a voják padne (animace die ze hry) (Oskar „Smokes“ Guyy, student medicíny, voják i doktor)
// Použití: const d8 = makeDay8Scenes(tex, anims); root.prepend(d8.canvas); d8.draw('tea', t)
import { glow, off, clamp01, by, CW as W, CH as H } from './cinema.js';
import teaSrc from '../../art/cine/cine_tea.png';
import rifleSrc from '../../art/cine/cine_rifle.png';

const X0 = 16, IW = 148, IH = 256, Y0 = 32; // obsah obrázku a jeho umístění v mřížce 180×320
const load = (src) => { const i = new Image(); i.src = src; return i; };

// sprite ze hry (texture z atlasu) do malého plátna, s barevným nádechem (bez průhlednosti postavy)
function sprite(tx, tint) {
  if (!tx?.source?.resource) return null;
  const f = tx.frame, o = off(f.width, f.height), g = o.getContext('2d');
  g.drawImage(tx.source.resource, f.x, f.y, f.width, f.height, 0, 0, f.width, f.height);
  if (tint) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = tint; g.fillRect(0, 0, f.width, f.height); }
  return o;
}

export function makeDay8Scenes(tex = {}, anims = {}) {
  const canvas = off(W, H);
  const g = canvas.getContext('2d');
  const IM = { tea: load(teaSrc), rifle: load(rifleSrc) };
  const DAWN = 'rgba(40,46,70,0.22)';
  const aim = (anims.concord?.fire?.north || []).map((t) => sprite(t, DAWN));
  const die = (anims.concord?.die?.north || []).map((t) => sprite(t, DAWN));
  const stand = sprite(tex.concord?.north, DAWN);

  // pozadí: obrázek uprostřed, po stranách zrcadlený kraj a vinětace, nahoře a dole tma (černé pruhy videa)
  function plate(im) {
    g.fillStyle = '#0e0d0c'; g.fillRect(0, 0, W, H);
    if (!im.complete || !im.naturalWidth) return false;
    g.drawImage(im, X0, 0, IW, IH, X0, Y0, IW, IH);
    g.save(); g.translate(X0, 0); g.scale(-1, 1); g.drawImage(im, X0, 0, X0, IH, 0, Y0, X0, IH); g.restore(); // levý okraj zrcadlem
    g.save(); g.translate(X0 + IW + X0, 0); g.scale(-1, 1); g.drawImage(im, X0 + IW - X0, 0, X0, IH, 0, Y0, X0, IH); g.restore(); // pravý
    g.fillStyle = '#0e0d0c';
    for (let y = Y0; y < Y0 + IH; y++) for (let x = 0; x < X0 + 2; x++) {
      const d = 1 - x / (X0 + 2);
      if (d * 0.95 > by(x, y)) g.fillRect(x, y, 1, 1);
      if (d * 0.95 > by(W - 1 - x, y)) g.fillRect(W - 1 - x, y, 1, 1);
    }
    return true;
  }

  const scenes = {
    tea(t) {
      plate(IM.tea);
      // slunce na obzoru pulzuje (obrázek: slunce kolem x 126, y 75)
      glow(g, 126, Y0 + 75, 22 + Math.sin(t * 1.5) * 2, '#d98f3f', 0.55);
      // pára z plecháčku (plecháček kolem x 62, y 130 v obrázku): stoupá a stáčí se ve větru
      for (let i = 0; i < 30; i++) {
        const u = ((t * 0.45 + i * 0.034) % 1);
        const x = 62 + Math.sin(u * 6 + i) * 2.5 * u + u * u * 10, y = Y0 + 128 - u * 62;
        if (0.6 - u * 0.6 > by(Math.round(x), Math.round(y))) { g.fillStyle = u < 0.35 ? '#e3d9c3' : '#a39782'; g.fillRect(Math.round(x), Math.round(y), 2, 2); }
      }
      // ptáci nad zemí nikoho
      for (let k = 0; k < 3; k++) {
        const x = ((t * 12 + k * 46) % 190) - 10, y = Y0 + 40 + k * 9 + Math.sin(t * 2 + k) * 2, w = Math.sin(t * 9 + k) > 0 ? -1 : 1;
        g.fillStyle = '#1c1a17'; g.fillRect(Math.round(x), Math.round(y), 2, 1); g.fillRect(Math.round(x) - 2, Math.round(y) + w, 2, 1); g.fillRect(Math.round(x) + 2, Math.round(y) + w, 2, 1);
      }
    },
    rifle(t, o = {}) {
      plate(IM.rifle);
      // mlha nad zemí nikoho se pomalu posouvá (pás kolem y 80–100 obrázku)
      g.fillStyle = '#8a9295';
      for (let y = Y0 + 78; y < Y0 + 100; y++) for (let x = X0; x < X0 + IW; x++) if (0.16 * Math.sin((x + t * 4) * 0.08 + y * 0.5) + 0.06 > by(x, y) + Math.abs(y - Y0 - 89) * 0.015) g.fillRect(x, y, 1, 1);
      // voják u valu (zezadu, hlídka): míří a střílí; v 6,0 s záblesk na nepřátelské linii, v 6,2 s padá (die), pak leží
      const SHOT = o.shot ?? 6.0, FALL = SHOT + 0.2;
      let fr = stand;
      if (t < SHOT && aim.length) fr = aim[Math.floor((t * 6) % aim.length)];
      if (t >= FALL && die.length) fr = die[Math.min(die.length - 1, Math.floor((t - FALL) * 8))];
      if (t >= SHOT && t < FALL) fr = aim[0] || stand;
      if (fr) { const k = 2, w = fr.width * k, h = fr.height * k; g.drawImage(fr, Math.round(56 - w / 2), Math.round(Y0 + 226 - h * 0.94), w, h); }
      // vzdálený výstřel z nepřátelské linie (obzor kolem y 58 obrázku)
      if (t >= SHOT - 0.05 && t < SHOT + 0.18) { glow(g, 100, Y0 + 58, 9, '#fff6dc', 1.4); glow(g, 100, Y0 + 58, 18, '#d98f3f', 0.8); }
      // jemný déšť
      g.fillStyle = 'rgba(170,180,195,0.35)';
      for (let k = 0; k < 40; k++) { const p = (k * 0.618) % 1, q = (k * 0.754) % 1; const y = ((q * 340 + t * 180) % 300) + 10; g.fillRect(Math.round(X0 + (p * IW - y * 0.15 + IW) % IW), Math.round(y), 1, 3); }
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
