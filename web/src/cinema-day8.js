// Filmové scény k příběhům Day 8 (17. 11. 2026; mřížka 180×320, herní paleta, dithering jako cinema.js):
//  • rifle  – svítání nad valem, puška pořád namířená do země nikoho a brašna s červeným křížem (Oskar „Smokes“ Guyy, student medicíny,
//             v zákopu voják i doktor, padl na hlídce); kbelík (bucket) uživatel 17. 11. zamítl
//  • tea    – úsvit, na pytli s pískem plecháček čaje, z něj stoupá pára; vedle dřevěný křížek na šňůrce a otevřená knížka (kaplan Gideon „Whistle“ Vylet)
// Použití: const d8 = makeDay8Scenes(); root.prepend(d8.canvas); d8.draw('rifle', t)
import { sky, glow, off, clamp01, easeOut, by, CW as W, CH as H } from './cinema.js';

const P = {
  ink: '#0e0d0c', mud0: '#2b2722', mud1: '#3d3730', mud2: '#524a3f', mud3: '#6b6152', sand: '#857a68', bone: '#a39782',
  pale: '#c4b8a0', white: '#e3d9c3', rust: '#7e3b2a', gold: '#d98f3f', fire: '#fff6dc', steel: '#666d70', grey: '#8a9295', water: '#5d7084', water2: '#8fa3b5',
};

// pytlová zeď přes celou šířku (řady pytlů, světlo shora)
function bags(g, y0, rows, light = 1, loose = -1, slip = 0) {
  for (let r = 0; r < rows; r++) for (let x = (r % 2) * -10, i = 0; x < W + 10; x += 20, i++) {
    const y = y0 + r * 10;
    let dx = 0, dy = 0;
    if (r === 0 && i === loose) { dx = Math.round(slip * 6); dy = Math.round(slip * slip * 14); }
    g.fillStyle = light > 0.5 ? ((x + r) % 3 ? '#6b6152' : '#756a58') : ((x + r) % 3 ? '#3d3730' : '#433c34');
    g.beginPath(); g.ellipse(x + 10 + dx, y + dy, 10, 5.5, slip && r === 0 && i === loose ? slip * 0.3 : 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = light > 0.5 ? '#8a7f6b' : '#524a3f'; g.fillRect(x + 4 + dx, y - 5 + dy, 12, 1);
    g.fillStyle = P.mud0; g.fillRect(x + 15 + dx, y - 3 + dy, 1, 6);
  }
}

export function makeDay8Scenes() {
  const canvas = off(W, H);
  const g = canvas.getContext('2d');

  const scenes = {
    rifle(t) {
      // svítání nad valem: na pytlích leží puška, pořád namířená do země nikoho; vedle brašna s červeným křížem (Oskar „Smokes“ Guyy,
      // před válkou student medicíny, v zákopu voják i doktor). Na začátku vzdálený záblesk výstřelu, pak ticho a mlha.
      const dawn = clamp01(t / 6);
      sky(g, 0, 190, ['#0d1120', '#1a2034', '#2c2c40', '#4a3a44', dawn > 0.5 ? '#7a5248' : '#5a4448']);
      g.fillStyle = '#14141a';
      for (let x = 0; x < W; x++) g.fillRect(x, Math.round(176 + 2 * Math.sin(x * 0.06)), 1, 30); // obzor (val nepřítele)
      for (const [x, h] of [[20, 14], [64, 9], [118, 16], [160, 11]]) { g.fillRect(x, 176 - h, 2, h); g.fillRect(x - 4, 176 - h + 4, 10, 1); }
      if (t > 0.5 && t < 0.62) glow(g, 150, 172, 16, '#fff6dc', 1.4); // výstřel z druhé strany
      // mlha nad zemí nikoho
      g.fillStyle = '#3a3e52';
      for (let y = 180; y < 206; y++) for (let x = 0; x < W; x++) if (0.2 * Math.sin((x + t * 5) * 0.06 + y * 0.4) + 0.14 > by(x, y) + Math.abs(y - 193) * 0.02) g.fillRect(x, y, 1, 1);
      // val (popředí, detail ×1,9 kolem pušky): brašna s křížem leží za puškou, puška míří doprava k nepříteli
      g.save(); g.translate(90, 205); g.scale(1.9, 1.9); g.translate(-70, -214);
      bags(g, 214, 3, 0);
      g.fillStyle = '#17151a'; g.fillRect(-60, 240, W + 120, H);
      g.fillStyle = '#6b6152'; g.fillRect(36, 192, 22, 13); g.fillStyle = '#857a68'; g.fillRect(36, 192, 22, 2);
      g.fillStyle = '#e3d9c3'; g.fillRect(43, 195, 8, 8); g.fillStyle = '#a3291c'; g.fillRect(46, 196, 2, 6); g.fillRect(44, 198, 6, 2);
      g.fillStyle = '#4a3a2a'; g.fillRect(32, 189, 2, 10); g.fillRect(60, 189, 2, 10); // popruh
      g.fillStyle = '#4a3a2a'; g.fillRect(28, 204, 30, 4); g.fillRect(24, 205, 6, 5); // pažba
      g.fillStyle = '#5a4632'; g.fillRect(28, 204, 30, 1);
      g.fillStyle = '#3e4447'; g.fillRect(58, 204, 44, 3); g.fillStyle = '#5c6366'; g.fillRect(58, 204, 44, 1); // hlaveň
      g.fillStyle = '#2b2722'; g.fillRect(50, 207, 4, 3); // spoušť
      g.fillStyle = '#a7b0b3'; g.fillRect(102, 205, 12, 1); // bodák
      g.restore();
      // jemný déšť
      g.fillStyle = 'rgba(170,180,195,0.3)';
      for (let k = 0; k < 36; k++) { const p = (k * 0.618) % 1, q = (k * 0.754) % 1; const y = ((q * 340 + t * 180) % 340) - 10; g.fillRect(Math.round((p * 220 - y * 0.2) % 200), Math.round(y), 1, 3); }
    },
    tea(t) {
      // úsvit: obloha se rozjasňuje, plecháček na pytli, pára stoupá a ohýbá se ve větru
      const dawn = clamp01(t / 4);
      sky(g, 0, 200, dawn < 0.5 ? ['#141826', '#2a2a3a', '#5a3e3e', '#a8664a'] : ['#2a2f44', '#4b4560', '#8a5a5c', '#d0884e', '#f0b46a']);
      glow(g, 130, 196, 70 + dawn * 30, '#d98f3f', 0.6 + dawn * 0.5, 0.6);
      g.fillStyle = '#1c1714';
      for (let x = 0; x < W; x++) g.fillRect(x, Math.round(188 + 3 * Math.sin(x * 0.07)), 1, 20); // obzor
      for (const [x, h] of [[24, 18], [70, 10], [150, 22]]) { g.fillRect(x, 188 - h, 2, h); g.fillRect(x - 3, 188 - h + 5, 8, 1); } // kůly s drátem
      // popředí jako detail (×1,8, střed mezi plecháčkem a knížkou): pytle, plecháček, křížek, knížka
      g.save(); g.translate(90, 250); g.scale(1.8, 1.8); g.translate(-110, -214);
      bags(g, 214, 3, dawn > 0.4 ? 1 : 0);
      g.fillStyle = '#211c18'; g.fillRect(-60, 240, W + 120, H);
      // plecháček a pára
      const cx = 72, cy = 206;
      g.fillStyle = '#5c6366'; g.fillRect(cx - 7, cy - 12, 14, 12);
      g.fillStyle = '#7d8689'; g.fillRect(cx - 7, cy - 12, 14, 2); g.fillStyle = '#3e4447'; g.fillRect(cx + 4, cy - 10, 3, 10);
      g.strokeStyle = '#5c6366'; g.beginPath(); g.arc(cx + 9, cy - 6, 3, -Math.PI / 2, Math.PI / 2); g.stroke(); // ucho
      g.fillStyle = '#6b3e1f'; g.fillRect(cx - 6, cy - 11, 12, 1); // čaj
      for (let i = 0; i < 26; i++) {
        const u = ((t * 0.55 + i * 0.039) % 1);
        const x = cx + Math.sin(u * 7 + i) * 3 * u + u * u * 14, y = cy - 13 - u * 70;
        if (0.55 - u * 0.55 > by(Math.round(x), Math.round(y))) { g.fillStyle = u < 0.4 ? '#d7d2c6' : '#a8a296'; g.fillRect(Math.round(x), Math.round(y), 2, 2); }
      }
      // dřevěný křížek na šňůrce a otevřená knížka
      g.fillStyle = '#4a3a2a'; g.fillRect(104, 198, 2, 9); g.fillRect(101, 200, 8, 2);
      g.strokeStyle = '#2b2219'; g.beginPath(); g.moveTo(105, 198); g.quadraticCurveTo(96, 190, 92, 204); g.stroke();
      const flip = Math.sin(t * 2.2) * 0.5 + 0.5;
      g.fillStyle = '#c4b8a0'; g.fillRect(120, 200, 16, 10); g.fillRect(136, 200, 16, 10);
      g.fillStyle = '#a39782'; g.fillRect(135, 200, 2, 10);
      g.fillStyle = '#d6cbb2'; g.fillRect(Math.round(136 - flip * 10), 199, Math.max(2, Math.round(16 - flip * 12)), 9); // list se zvedá ve větru
      g.fillStyle = '#5a4632'; for (let r = 0; r < 4; r++) { g.fillRect(122, 202 + r * 2, 12, 1); g.fillRect(139, 202 + r * 2, 11, 1); }
      g.restore();
      // ptáci za úsvitu
      for (let k = 0; k < 3; k++) { const x = ((t * 14 + k * 50) % 220) - 20, y = 90 + k * 14 + Math.sin(t * 2 + k) * 3; g.fillStyle = '#1c1714'; g.fillRect(Math.round(x), Math.round(y), 2, 1); g.fillRect(Math.round(x) - 2, Math.round(y) - (Math.sin(t * 9 + k) > 0 ? 1 : -1), 2, 1); g.fillRect(Math.round(x) + 2, Math.round(y) - (Math.sin(t * 9 + k) > 0 ? 1 : -1), 2, 1); }
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
