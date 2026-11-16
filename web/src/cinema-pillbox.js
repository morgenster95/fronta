// Filmové scény k souboji o pevnůstky (reel „pillbox“, 16. 11. 2026; mřížka 180×320, herní paleta, dithering jako cinema.js):
//  • hq    – dvě velitelství nad sebou (nahoře Hegemonie, dole Concord): důstojník nad mapou fronty, na mapě přibývají červené křížky na bunkry nepřítele
//  • guns  – baterie v noci: děla střílejí, záblesky osvětlí obsluhu, vojáci nosí granáty z hromady beden
//  • boom  – bunkr nepřítele pod palbou: dva dopady vedle, přímý zásah, záblesk, z bunkru zbude ruina (sprite pillbox_ruin.png) a sloup kouře
// Použití: const pb = makePillboxScenes(tex); root.prepend(pb.canvas); pb.draw('hq', t)
import { sky, glow, lit, silhouette, blast, shakeOf, off, clamp01, easeOut, by, CW as W, CH as H } from './cinema.js';

const P = {
  ink: '#0e0d0c', ink2: '#0b0a09', mud0: '#2b2722', mud1: '#3d3730', mud2: '#524a3f', mud3: '#6b6152', sand: '#857a68', bone: '#a39782',
  pale: '#c4b8a0', white: '#e3d9c3', rust: '#7e3b2a', gold: '#d98f3f', fire: '#fff6dc', khaki: '#8c8a5c', olive: '#6f7148', olive3: '#3f4230', steel: '#666d70', grey: '#8a9295',
};
const img = (src) => { const i = new Image(); i.src = src; return i; };

export function makePillboxScenes(tex) {
  const canvas = off(W, H);
  const g = canvas.getContext('2d');
  const IM = { pb: img('/assets/props/pillbox.png'), ruin: img('/assets/props/pillbox_ruin.png') };
  const offH = lit(tex.hegemony_officer?.east || tex.hegemony?.east, 'rgba(217,143,63,0.12)');
  const offC = lit(tex.concord_officer?.west || tex.concord?.west, 'rgba(217,143,63,0.12)');
  const crewA = silhouette(tex.hegemony?.east || tex.concord?.east, '#07070a');
  const crewB = silhouette(tex.hegemony?.west || tex.concord?.west, '#07070a');
  const carry = silhouette(tex.hegemony?.east || tex.concord?.east, '#0a090b');

  // --- hq: jedna polovina (y0..y0+160), barvy strany ---
  function hqHalf(y0, side, t) {
    const wall = side ? ['#1f2016', '#262819'] : ['#1a1c1f', '#1f2226'];
    const lx = 90 + Math.sin(t * 1.4 + side) * 5, ly = y0 + 24;
    for (let x = 0; x < W; x += 12) { g.fillStyle = x % 24 ? wall[0] : wall[1]; g.fillRect(x, y0, 11, 96); }
    glow(g, lx, ly + 30, 120, side ? '#2a2b1c' : '#24272c', 1.3, 1.1);
    glow(g, lx, ly + 30, 70, side ? '#3f4230' : '#3a3f45', 1.0, 1.0);
    g.fillStyle = P.ink; for (let x = 0; x < W; x += 12) g.fillRect(x, y0, 1, 96);
    // stůl s mapou fronty
    g.fillStyle = '#2b2219'; g.fillRect(0, y0 + 96, W, 64);
    g.fillStyle = '#4a3a2a'; g.fillRect(0, y0 + 96, W, 3);
    const mx = 18, my = y0 + 100, mw = 144, mh = 52;
    g.fillStyle = '#b9ad92'; g.fillRect(mx, my, mw, mh);
    g.fillStyle = '#a39782'; g.fillRect(mx, my + mh - 2, mw, 2);
    // dvě linie zákopů (vlastní dole/nahoře podle strany) a zem nikoho
    const own = side ? my + 38 : my + 12, foe = side ? my + 12 : my + 38;
    for (let x = mx + 4; x < mx + mw - 4; x++) {
      g.fillStyle = side ? P.olive : P.steel; g.fillRect(x, own + Math.round(2 * Math.sin(x * 0.2)), 1, 2);
      g.fillStyle = side ? P.steel : P.olive; g.fillRect(x, foe + Math.round(2 * Math.sin(x * 0.17 + 1)), 1, 2);
    }
    for (let x = mx + 6; x < mx + mw - 6; x += 3) if ((x * 7) % 5 < 2) { g.fillStyle = '#857a68'; g.fillRect(x, my + 24, 1, 1); }
    // bunkry nepřítele na mapě (čtverečky) a červené křížky, jak je důstojník zakresluje
    const n = Math.min(6, Math.floor(clamp01((t - 0.5) / 3) * 7));
    for (let i = 0; i < 6; i++) {
      const bx = mx + 14 + i * 22, by0 = foe - 4;
      g.fillStyle = P.mud1; g.fillRect(bx, by0, 6, 4);
      if (i < n) { g.fillStyle = '#a3291c'; for (let k = 0; k < 7; k++) { g.fillRect(bx - 1 + k, by0 - 2 + k, 2, 1); g.fillRect(bx + 5 - k, by0 - 2 + k, 2, 1); } }
    }
    // tužka u posledního křížku
    if (n > 0 && n < 7) {
      const bx = mx + 14 + (n - 1) * 22 + 6, by0 = foe - 6;
      g.fillStyle = P.gold; g.fillRect(bx, by0 - 9, 2, 9); g.fillStyle = P.ink; g.fillRect(bx, by0, 2, 1);
    }
    // telefon na stole a důstojník za stolem
    g.fillStyle = P.ink; g.fillRect(150, y0 + 82, 18, 12); g.fillStyle = P.mud2; g.fillRect(151, y0 + 83, 16, 3); g.fillStyle = P.ink; g.fillRect(153, y0 + 79, 12, 3);
    const o = side ? offC : offH;
    if (o) g.drawImage(o, side ? 96 : 0, y0 + 14, 84, 84);
    // lampa
    g.fillStyle = P.ink; g.fillRect(lx - 4, ly - 6, 8, 3); g.fillStyle = P.gold; g.fillRect(lx - 3, ly - 3, 6, 7); g.fillStyle = P.fire; g.fillRect(lx - 1, ly - 1, 2, 4);
    g.strokeStyle = P.ink; g.beginPath(); g.moveTo(90, y0); g.lineTo(lx, ly - 6); g.stroke();
  }

  // --- guns: polní dělo (silueta) ---
  function gun(x, y, recoil, flip) {
    g.save(); g.translate(x, y); if (flip) g.scale(-1, 1);
    g.fillStyle = '#07070a';
    g.fillRect(-14, -6, 22, 8); // štít a lafeta
    g.save(); g.translate(2 - recoil * 3, -6); g.rotate(-0.42); g.fillRect(0, -2, 34, 4); g.fillRect(30, -3, 5, 6); g.restore(); // hlaveň
    g.fillRect(-20, 0, 20, 2); g.fillRect(-26, 1, 8, 2); // ocas lafety
    g.beginPath(); g.arc(-2, 4, 7, 0, Math.PI * 2); g.fill(); // kolo
    g.fillStyle = '#1a1716'; for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; g.fillRect(Math.round(-2 + Math.cos(a) * 4), Math.round(4 + Math.sin(a) * 4), 1, 1); }
    g.restore();
  }
  const SHOTS = [0.4, 1.3, 2.1, 2.9, 3.6, 4.4, 5.1, 5.9];

  const scenes = {
    hq(t) {
      g.fillStyle = P.ink; g.fillRect(0, 0, W, H);
      hqHalf(0, 0, t);
      hqHalf(162, 1, t + 0.7);
      g.fillStyle = P.gold; g.fillRect(0, 160, W, 2);
    },
    guns(t) {
      // noc, obzor, děla v dolní polovině; při výstřelu záblesk zalije scénu
      sky(g, 0, 236, ['#04050b', '#090c18', '#141728', '#231c26', '#33201e']);
      g.fillStyle = '#0c0b0d';
      for (let x = 0; x < W; x++) g.fillRect(x, Math.round(214 + 2 * Math.sin(x * 0.07)), 1, 110);
      let flash = 0;
      for (const s of SHOTS) { const u = t - s; if (u >= 0 && u < 0.5) flash = Math.max(flash, 1 - u / 0.5); }
      if (flash > 0) { glow(g, 112, 200, 150 * flash, '#5c2a22', 1.2); glow(g, 112, 200, 90 * flash, '#a85a36', 1.1); glow(g, 120, 196, 40 * flash, '#d98f3f', 1.0); }
      // hromada beden s granáty vlevo
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4 - r; c++) {
        const x = 8 + c * 13 + r * 6, y = 252 - r * 9;
        g.fillStyle = flash > 0.3 ? '#4a3a2a' : '#1c1713'; g.fillRect(x, y, 12, 8);
        g.fillStyle = flash > 0.3 ? P.rust : '#2b1c16'; g.fillRect(x + 4, y + 3, 4, 2);
      }
      // dvě děla, obsluha
      const rec = (o) => { let m = 0; for (const s of SHOTS) { const u = t - s - o; if (u >= 0 && u < 0.35) m = Math.max(m, 1 - u / 0.35); } return m; };
      gun(112, 236, rec(0), false); gun(160, 262, rec(0.4), false);
      if (crewA) { g.drawImage(crewA, 74, 210, 32, 32); g.drawImage(crewA, 128, 238, 32, 32); }
      // nosiči granátů: chodí od beden k dělu a zpět
      for (let k = 0; k < 2; k++) {
        const u = ((t * 0.32 + k * 0.5) % 1), p = u < 0.5 ? u * 2 : 2 - u * 2;
        const x = 40 + p * 46, y = 238 + k * 14;
        const sp = u < 0.5 ? carry : crewB;
        if (sp) g.drawImage(sp, Math.round(x), y, 30, 30);
        if (u < 0.5) { g.fillStyle = flash > 0.3 ? P.gold : '#3b2a1c'; g.fillRect(Math.round(x) + 18, y + 10, 3, 8); } // granát v náručí
      }
      // záblesky z hlavní a jiskry
      for (const [s, x, y] of SHOTS.flatMap((s, i) => [[s, 140, 222], [s + 0.4, 188, 248]])) {
        const u = t - s; if (u < 0 || u > 0.25) continue;
        glow(g, x, y, 22 * (1 - u / 0.25), '#fff6dc', 1.4);
        g.fillStyle = P.gold; for (let i = 0; i < 6; i++) g.fillRect(Math.round(x + Math.cos(i) * 10 * u * 8), Math.round(y - Math.sin(i * 1.3) * 8 * u * 8), 1, 1);
      }
      // stopy granátů letí k obzoru
      g.fillStyle = 'rgba(217,143,63,0.9)';
      for (const s of SHOTS) { const u = t - s - 0.05; if (u < 0 || u > 0.9) continue; g.fillRect(Math.round(140 - u * 40 - u * u * 30), Math.round(222 - u * 170 + u * u * 60), 2, 2); }
      // kouř po výstřelech
      for (const s of SHOTS) { const u = t - s; if (u < 0 || u > 3) continue; g.fillStyle = `rgba(82,74,63,${0.45 * (1 - u / 3)})`; g.beginPath(); g.ellipse(146 - u * 6, 214 - u * 12, 6 + u * 9, 4 + u * 6, 0, 0, Math.PI * 2); g.fill(); }
    },
    boom(t) {
      // soumrak, bunkr nepřítele s vlajkou na kopečku; dopady 0,6 s a 1,7 s vedle, přímý zásah 3,0 s → ruina, kouř
      const HIT = 2.0;
      const sh = shakeOf(t - 0.5, 0.6) + shakeOf(t - 1.2, 0.7) + shakeOf(t - HIT, 1.6);
      g.save(); g.translate(sh, Math.round(sh * 0.6));
      sky(g, -4, 236, ['#120f14', '#1e1720', '#33212a', '#55302a', '#7a3e2a', '#a85a36']);
      g.fillStyle = '#1a1612';
      for (let x = -4; x < W + 4; x++) g.fillRect(x, Math.round(206 + 10 * Math.exp(-(((x - 96) / 50) ** 2)) * -1 + Math.sin(x * 0.13) * 1.5), 1, 130);
      g.fillStyle = '#231e18';
      for (let x = -4; x < W + 4; x++) g.fillRect(x, Math.round(236 + Math.sin(x * 0.09) * 2), 1, 100);
      const bx = 50, byy = 162, k = 1.7; // bunkr ×1,7 zvětšený (48×32 → 82×54)
      const hit = t >= HIT;
      g.imageSmoothingEnabled = false;
      const im = hit ? IM.ruin : IM.pb;
      if (im.complete && im.naturalWidth) g.drawImage(im, bx, byy, 48 * k * 1.0, 32 * k);
      // vlajka Concordu na střeše (do zásahu), po zásahu ulomená tyčka padá
      if (!hit) {
        g.fillStyle = P.ink; g.fillRect(bx + 18, byy - 18, 1, 22);
        for (let i = 0; i < 14; i++) { const o = Math.round(Math.sin(t * 3.2 - i * 0.5) * 1.6 * (i / 14)); g.fillStyle = Math.cos(t * 3.2 - i * 0.5) > 0.4 ? P.olive3 : P.olive; g.fillRect(bx + 19 + i, byy - 17 + o, 1, 9); }
        g.fillStyle = '#c9c26a'; g.fillRect(bx + 25, byy - 14, 3, 3); g.fillRect(bx + 26, byy - 15, 1, 5); g.fillRect(bx + 24, byy - 13, 5, 1);
        // záblesky kulometu z průzoru
        if (Math.floor(t * 8) % 3 === 0) { g.fillStyle = P.fire; g.fillRect(bx + 40, byy + 26, 4, 3); g.fillStyle = P.gold; g.fillRect(bx + 44, byy + 27, 3, 1); }
      } else {
        const u = clamp01((t - HIT) / 0.8);
        g.save(); g.translate(bx + 10 - u * 22, byy - 4 + u * 40); g.rotate(-u * 2.2);
        g.fillStyle = P.ink; g.fillRect(0, -16, 1, 18); g.fillStyle = P.olive3; g.fillRect(1, -15, 8, 6); g.restore();
      }
      // dopady vedle (hlína, kouř) a přímý zásah
      blast(g, 150, 214, t - 0.5, 0.7, undefined, 18);
      blast(g, 20, 222, t - 1.2, 0.8, undefined, 14);
      blast(g, bx + 40, byy + 34, t - HIT, 1.5, undefined, 18);
      // příchozí granát (svislá čárka padá do cíle)
      for (const [s, x, y] of [[0.5, 150, 214], [1.2, 20, 222], [HIT, bx + 40, byy + 30]]) {
        const u = t - (s - 0.35); if (u < 0 || u > 0.35) continue;
        g.fillStyle = P.fire; g.fillRect(x, Math.round(y - 200 + u / 0.35 * 200), 2, 6);
      }
      // bílý záblesk přímého zásahu přes celý obraz (barevně, ne průhlednost vojáků: ve scéně žádní nejsou)
      const fl = t >= HIT && t < HIT + 0.18 ? 1 - (t - HIT) / 0.18 : 0;
      if (fl) { g.fillStyle = `rgba(255,246,220,${0.85 * fl})`; g.fillRect(-4, -4, W + 8, H + 8); }
      // uhlíky padající po zásahu
      if (hit) { g.fillStyle = P.gold; for (let i = 0; i < 16; i++) { const u = ((t - HIT) * 0.6 + i * 0.07) % 1; g.fillRect(Math.round(bx + 10 + (i * 37) % 70 + Math.sin(u * 6 + i) * 4), Math.round(byy - 40 + u * 100), 1, 1); } }
      g.restore();
    },
  };
  return {
    canvas,
    draw(name, t) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.imageSmoothingEnabled = false;
      g.globalAlpha = 1;
      g.clearRect(0, 0, W, H);
      scenes[name]?.(Math.max(0, t));
    },
  };
}
