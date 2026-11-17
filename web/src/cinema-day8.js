// Filmové scény k příběhům Day 8 (17. 11. 2026; mřížka 180×320, herní paleta, dithering jako cinema.js):
//  • bucket – nad zákopem Concordu se objeví kbelík na tyči, odstřelovač ho prostřelí (voda stříká), kbelík zmizí a na kůl se přibije cedulka
//             „WATER COSTS ENOUGH ALREADY“ (Ivo „Ghost“ Lettersabcd, hříčka z textů hry); na konci se uvolní pytel s pískem (dnes ho šel spravit)
//  • tea    – úsvit, na pytli s pískem plecháček čaje, z něj stoupá pára; vedle dřevěný křížek na šňůrce a otevřená knížka (kaplan Gideon „Whistle“ Vylet)
// Použití: const d8 = makeDay8Scenes(); root.prepend(d8.canvas); d8.draw('bucket', t)
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
    bucket(t) {
      // šedé odpoledne, pohled ze dna zákopu Concordu na val
      sky(g, 0, 150, ['#3a3d44', '#4a4c52', '#5a5a5c', '#66625c']);
      g.fillStyle = '#2b2a2a'; for (let k = 0; k < 9; k++) { const u = (t * 0.05 + k * 0.13) % 1; g.fillRect(Math.round(u * 200 - 10), 30 + k * 11, 14 + (k % 3) * 6, 2); } // mraky
      const SHOT = 2.4, DOWN = 4.0, SIGN = 5.0, SLIP = 8.6;
      // tyč s kbelíkem: vyjede nad val, po zásahu se zakymácí, pak zmizí dolů
      const up = easeOut(clamp01((t - 0.4) / 0.8)) - easeOut(clamp01((t - DOWN) / 0.5));
      const wob = t > SHOT && t < DOWN ? Math.sin((t - SHOT) * 18) * 3 * Math.exp(-(t - SHOT) * 1.5) : 0;
      const bx = 60, by0 = 150 - up * 46;
      if (up > 0.01) {
        g.fillStyle = '#5a4632'; g.fillRect(bx + 6, by0 + 12, 2, 80); // tyč
        g.save(); g.translate(bx + 7, by0 + 12); g.rotate(wob * 0.03); g.scale(1.7, 1.7);
        g.fillStyle = '#8a9295'; g.fillRect(-8, -14, 16, 14); // kbelík
        g.fillStyle = '#a7b0b3'; g.fillRect(-8, -14, 16, 2); g.fillStyle = '#666d70'; g.fillRect(4, -12, 3, 12);
        g.strokeStyle = '#3d3730'; g.beginPath(); g.arc(0, -14, 7, Math.PI, 0); g.stroke(); // ucho
        if (t > SHOT) { g.fillStyle = P.ink; g.fillRect(-3, -8, 2, 2); g.fillRect(3, -6, 2, 2); } // díry po kulce
        g.restore();
        // voda stříká z děr (oblouky kapek)
        if (t > SHOT) for (let i = 0; i < 18; i++) {
          const u = ((t - SHOT) * 1.6 + i * 0.07) % 1.2;
          if (u > 1) continue;
          const side = i % 2 ? 1 : -1;
          g.fillStyle = i % 3 ? P.water : P.water2;
          g.fillRect(Math.round(bx + 7 + side * (5 + u * 22)), Math.round(by0 + 2 + u * 12 + u * u * 46), 2, 2);
        }
      }
      // záblesk zásahu a jiskra
      if (t > SHOT && t < SHOT + 0.15) { glow(g, bx + 4, by0 - 4, 18, P.fire, 1.4); }
      // val (pytle) v popředí, na konci se jeden pytel uvolní a sjede
      bags(g, 150, 4, 1, 5, easeOut(clamp01((t - SLIP) / 0.7)));
      g.fillStyle = '#2b2722'; g.fillRect(0, 186, W, H - 186);
      for (let y = 196; y < H; y += 9) { g.fillStyle = '#332e28'; g.fillRect(0, y, W, 2); } // dno zákopu, prkna
      // kůl s cedulkou: přibije se po stažení kbelíku
      const sg = easeOut(clamp01((t - SIGN) / 0.4));
      if (sg > 0) {
        g.fillStyle = '#5a4632'; g.fillRect(118, 150 - sg * 36, 3, 50);
        g.save(); g.translate(119, 120 - sg * 6); g.rotate(-0.04 + (1 - sg) * 0.3);
        g.fillStyle = '#b49a72'; g.fillRect(-36, -12, 72, 24);
        g.fillStyle = '#8a7356'; g.fillRect(-36, 10, 72, 2); g.fillStyle = '#c9ae84'; g.fillRect(-36, -12, 72, 1);
        g.fillStyle = P.ink; g.fillRect(-33, -10, 2, 2); g.fillRect(31, -10, 2, 2); // hřebíky
        g.fillStyle = '#2a1d14'; g.font = '7px Silkscreen, monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('WATER COSTS', 0, -4); g.fillText('ENOUGH ALREADY', 0, 5);
        g.restore();
      }
      // déšť jemný
      g.fillStyle = 'rgba(170,180,195,0.35)';
      for (let k = 0; k < 40; k++) { const p = (k * 0.618) % 1, q = (k * 0.754) % 1; const y = ((q * 340 + t * 200) % 340) - 10; g.fillRect(Math.round((p * 220 - y * 0.2) % 200), Math.round(y), 1, 3); }
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
