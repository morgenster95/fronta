// Filmové scény k náboru pilotů (reel „pilot“, 17. 11. 2026; mřížka 180×320, herní paleta, pohled shora jako ve hře):
//  • field  – svítání na letišti: nahoře Hegemonie, dole Concord; pilot jde od stanu k letadlu, roztočí se vrtule a stroj vyrazí do vzduchu
//  • archie – nad frontou: země střílí (stopovky z pušek a kulometů, černé obláčky z protiletadlového děla), letadlo uhýbá; zásah, kouř a pád
// Použití: const ps = makePilotScenes(tex, anims); root.prepend(ps.canvas); ps.draw('field', t)
import { sky, glow, lit, blast, shakeOf, off, clamp01, easeOut, CW as W, CH as H } from './cinema.js';

const P = {
  ink: '#0e0d0c', mud0: '#2b2722', mud1: '#3d3730', mud2: '#524a3f', mud3: '#6b6152', sand: '#857a68', bone: '#a39782',
  pale: '#c4b8a0', white: '#e3d9c3', rust: '#7e3b2a', gold: '#d98f3f', fire: '#fff6dc', khaki: '#8c8a5c', olive: '#6f7148', olive3: '#3f4230', steel: '#666d70', grey: '#8a9295',
};
const img = (src) => { const i = new Image(); i.src = src; return i; };
const rng = (seed) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };

export function makePilotScenes(tex, anims = {}) {
  const canvas = off(W, H);
  const g = canvas.getContext('2d');
  const IM = { heg: [img('/assets/props/plane_heg_0.png'), img('/assets/props/plane_heg_1.png')], con: [img('/assets/props/plane_con_0.png'), img('/assets/props/plane_con_1.png')] };
  const DAWN = 'rgba(217,143,63,0.10)';
  const walk = (k) => (anims[k]?.walk?.east || []).map((t) => lit(t, DAWN)).filter(Boolean);
  const W_ = { hegemony: walk('hegemony_pilot'), concord: walk('concord_pilot') };
  const idle = { hegemony: lit(tex.hegemony_pilot?.east, DAWN), concord: lit(tex.concord_pilot?.east, DAWN) };
  const plane = (side, v) => IM[side === 0 ? 'heg' : 'con'][v];

  // statické pozadí jedné poloviny letiště (tráva a bahno s ditheringem, dráha, stan, rukáv)
  const field = (side) => {
    const c = off(W, 160), cg = c.getContext('2d');
    const r = rng(side ? 41 : 17);
    sky(cg, 0, 160, side ? ['#3c3a2a', '#3a3828', '#37352a', '#34322a'] : ['#3a3d3a', '#383a38', '#363835', '#33352f']);
    for (let i = 0; i < 260; i++) { cg.fillStyle = r() < 0.5 ? '#2a2a20' : '#4a4a36'; cg.fillRect(Math.floor(r() * W), Math.floor(r() * 160), 1 + (r() < 0.3 ? 1 : 0), 1); }
    cg.fillStyle = '#524a3f'; cg.fillRect(0, 70, W, 40); // udusaná dráha
    cg.fillStyle = '#6b6152'; for (let x = 0; x < W; x += 6) cg.fillRect(x, 89, 3, 1); // osa
    for (let i = 0; i < 120; i++) { cg.fillStyle = r() < 0.5 ? '#3d3730' : '#6b6152'; cg.fillRect(Math.floor(r() * W), 70 + Math.floor(r() * 40), 1, 1); }
    // stan (hangár) vlevo: plachta s rezavým pruhem, tmavý vchod
    cg.fillStyle = P.ink; cg.fillRect(2, 10, 50, 44);
    cg.fillStyle = side ? '#4a4d34' : '#6b7075'; cg.fillRect(4, 12, 46, 40);
    cg.fillStyle = side ? '#3a3d28' : '#555a5e'; for (let x = 4; x < 50; x += 8) cg.fillRect(x, 12, 1, 40);
    cg.fillStyle = P.rust; cg.fillRect(4, 28, 46, 4);
    cg.fillStyle = P.ink; cg.fillRect(18, 38, 18, 14);
    cg.fillStyle = P.white; cg.fillRect(8, 15, 12, 6); cg.fillStyle = P.ink; cg.fillRect(10, 17, 8, 2);
    // větrný rukáv na tyči vpravo nahoře
    cg.fillStyle = P.ink; cg.fillRect(160, 14, 2, 30);
    // sudy s benzínem
    for (let k = 0; k < 3; k++) { cg.fillStyle = P.ink; cg.fillRect(70 + k * 9, 124, 8, 11); cg.fillStyle = k % 2 ? P.rust : P.steel; cg.fillRect(71 + k * 9, 125, 6, 9); cg.fillStyle = P.pale; cg.fillRect(71 + k * 9, 128, 6, 1); }
    // řada pytlů a bedny
    for (let x = 100; x < 176; x += 10) { cg.fillStyle = P.ink; cg.fillRect(x, 128, 10, 6); cg.fillStyle = x % 20 ? P.bone : P.sand; cg.fillRect(x + 1, 129, 8, 4); }
    return c;
  };
  const BG = [field(0), field(1)];

  function half(y0, side, t) {
    g.drawImage(BG[side], 0, y0);
    // stín od horizontu: svítání zleva (teplé světlo), zlatý pruh
    g.fillStyle = 'rgba(217,143,63,0.07)'; g.fillRect(0, y0, W, 160);
    // rukáv se vlní
    const wob = Math.sin(t * 3 + side) * 2;
    g.fillStyle = side ? P.olive : P.grey; g.fillRect(162, y0 + 14, 14, 3); g.fillStyle = P.rust; g.fillRect(168, y0 + 14, 3, 3); g.fillRect(163, y0 + 16 + Math.round(wob), 12, 2);
    // letadlo: stojí uprostřed dráhy, po 3,4 s vyjede doprava a mizí
    const run = clamp01((t - 2.0) / 1.5);
    const px = 36 + easeOut(run) * 0 + run * run * 160, py = y0 + 40 + Math.round(Math.sin(t * 40) * (t > 1.4 ? 0.6 : 0));
    const im = plane(side, side);
    // stín letadla
    g.fillStyle = 'rgba(0,0,0,0.28)'; g.beginPath(); g.ellipse(px + 52, py + 70, 44, 6, 0, 0, Math.PI * 2); g.fill();
    g.imageSmoothingEnabled = false;
    if (im.complete && im.naturalWidth) g.drawImage(im, Math.round(px), py);
    // vrtule: od 2,3 s se rozmazává, před tím stojí
    if (t > 1.4 && im.complete) {
      const ph = Math.floor(t * 22) % 3;
      g.fillStyle = `rgba(196,184,160,${ph === 0 ? 0.55 : 0.28})`; g.fillRect(Math.round(px) + 48 + 36, py + 48 - 13, 2, 26);
      if (ph === 1) { g.fillStyle = 'rgba(227,217,195,0.5)'; g.fillRect(Math.round(px) + 48 + 37, py + 48 - 9, 1, 18); }
    }
    // prach za letadlem při rozjezdu
    if (run > 0) for (let i = 0; i < 12; i++) { const u = (t * 2 + i * 0.13) % 1; g.fillStyle = `rgba(133,122,104,${0.5 * (1 - u)})`; g.fillRect(Math.round(px - u * 24 - i * 3), py + 56 + Math.round(Math.sin(i * 3) * 8), 3, 2); }
    // pilot: jde od stanu k letadlu (0,1–1,4 s), zastaví se u kabiny a po 1,6 s zmizí (nasedl)
    const key = side ? 'concord' : 'hegemony';
    const wf = W_[key], u = clamp01((t - 0.1) / 1.3);
    if (t < 1.6) {
      const x = 22 + u * 38, y = y0 + 78 + Math.round(Math.sin(t * 9) * (u < 1 ? 1 : 0));
      const sp = u < 1 && wf.length ? wf[Math.floor(t * 8) % wf.length] : idle[key];
      if (sp) g.drawImage(sp, Math.round(x), y, 48, 48);
    }
    // mechanik s kolem u letadla (kdo to má)
    g.fillStyle = P.ink; g.fillRect(150, y0 + 100, 2, 8);
  }

  const state = { hit: 3.7 }; // okamžik zásahu ve scéně archie (reel ho sladí s hlasem)
  const SHOTS = [];
  { const r = rng(5); for (let i = 0; i < 70; i++) SHOTS.push([0.3 + i * 0.07, 20 + r() * 150]); }
  const FLAK = [[0.8, 120, 128], [1.35, 70, 150], [1.9, 140, 118], [2.4, 100, 158], [2.9, 60, 132], [3.35, 128, 144]];

  const scenes = {
    field(t) {
      g.fillStyle = P.ink; g.fillRect(0, 0, W, H);
      half(0, 0, t);
      half(162, 1, t + 0.5);
      g.fillStyle = P.gold; g.fillRect(0, 160, W, 2);
    },
    archie(t) {
      // pohled shora na frontu: země se posouvá doleva, nahoře naše zákopy, dole nepřátelské, mezi nimi zem nikoho; letadlo letí doprava
      const HIT = state.hit;
      const sh = shakeOf(t - HIT, 1.2);
      g.save(); g.translate(sh, Math.round(sh * 0.6));
      sky(g, -4, H + 4, ['#3a3a2c', '#38362a', '#35332a', '#322f27']);
      const sc = t * 46, r0 = rng(99);
      // bahno a krátery (posouvají se)
      for (let i = 0; i < 90; i++) { const x = ((r0() * 400 - sc * (0.6 + (i % 3) * 0.2)) % 220 + 220) % 220 - 20, y = r0() * H; g.fillStyle = i % 2 ? '#2a2a20' : '#4a4a36'; g.fillRect(Math.round(x), Math.round(y), 2, 1); }
      for (const [cy, hh] of [[70, 26], [236, 26]]) { // zákopy: tmavý pás s pytli
        g.fillStyle = P.ink; g.fillRect(-4, cy, W + 8, hh);
        g.fillStyle = P.mud1; g.fillRect(-4, cy + 4, W + 8, hh - 8);
        for (let x = -((sc * 0.9) % 14); x < W + 8; x += 14) { g.fillStyle = P.bone; g.fillRect(Math.round(x), cy - 3, 11, 4); g.fillStyle = P.sand; g.fillRect(Math.round(x), cy + hh - 1, 11, 3); }
      }
      for (let x = -((sc * 0.9) % 20); x < W + 10; x += 20) { g.fillStyle = '#1c1a17'; g.fillRect(Math.round(x), 150 + (Math.round(x) % 3), 9, 1); g.fillRect(Math.round(x) + 3, 148, 1, 5); } // drát uprostřed
      for (const [cx, cy, rr] of [[40, 150, 12], [130, 176, 14], [90, 130, 8]]) { const x = ((cx - sc * 0.9) % 240 + 240) % 240 - 30; g.fillStyle = '#2a251f'; g.beginPath(); g.ellipse(x, cy, rr, rr / 2.4, 0, 0, Math.PI * 2); g.fill(); }
      // letadlo (Hegemonie, trojplošník) letí doprava; do zásahu uhýbá, potom se kouří a padá (zmenšuje se)
      const fall = clamp01((t - HIT) / 1.7);
      const px = 18 + t * 14 + fall * 30, py = 112 + Math.sin(t * 2.3) * 14 + fall * 50;
      const scl = 1 - fall * 0.6;
      const im = plane(0, 1);
      g.fillStyle = 'rgba(0,0,0,0.28)'; g.beginPath(); g.ellipse(px + 56, py + 84 + fall * 30, 44 * scl, 8 * scl, 0, 0, Math.PI * 2); g.fill();
      // stopovky z nepřátelského zákopu ke stroji (do zásahu)
      if (t < HIT + 0.3) for (const [s, x] of SHOTS) {
        const u = t - s; if (u < 0 || u > 0.4) continue;
        const k = u / 0.4, tx = px + 40 + (x - 90) * 0.3, ty = py + 40, k2 = Math.min(1, k + 0.18);
        g.strokeStyle = P.gold; g.lineWidth = 1; g.beginPath();
        g.moveTo(Math.round(x + (tx - x) * k), Math.round(250 + (ty - 250) * k)); g.lineTo(Math.round(x + (tx - x) * k2), Math.round(250 + (ty - 250) * k2)); g.stroke(); // stopovka
        if (u < 0.1) { g.fillStyle = P.fire; g.fillRect(Math.round(x) - 1, 246, 3, 3); }
      }
      g.imageSmoothingEnabled = false;
      if (im.complete && im.naturalWidth) {
        g.save(); g.translate(px + 48 * scl, py + 48 * scl); g.rotate(fall * 0.9); g.scale(scl, scl);
        g.drawImage(im, -48, -48); g.restore();
      }
      // vrtule
      if (t < HIT + 0.8) { const ph = Math.floor(t * 22) % 3; g.fillStyle = `rgba(196,184,160,${ph === 0 ? 0.55 : 0.28})`; g.fillRect(Math.round(px + 84), Math.round(py + 35), 2, 26); }
      // protiletadlové obláčky kolem
      for (const [s, x, y] of FLAK) {
        const u = t - s; if (u < 0 || u > 1.4) continue;
        if (u < 0.15) { glow(g, x, y, 16, '#d98f3f', 1.2); g.fillStyle = P.fire; g.fillRect(x - 3, y - 3, 7, 7); }
        const k = u / 1.4; g.fillStyle = `rgba(14,12,16,${0.9 * (1 - k * 0.8)})`;
        for (let i = 0; i < 14; i++) g.fillRect(Math.round(x + Math.cos(i * 2.1) * (4 + k * 14)), Math.round(y + Math.sin(i * 1.7) * (4 + k * 10) - k * 8), 7 - Math.floor(k * 3), 7 - Math.floor(k * 3));
      }
      // zásah: záblesk, kouř za strojem, stopa padá
      if (t >= HIT) {
        const fl = t < HIT + 0.2 ? 1 - (t - HIT) / 0.2 : 0;
        if (fl) glow(g, Math.round(px + 60), Math.round(py + 56), 40 * fl + 10, '#d98f3f', 1.3);
        for (let i = 0; i < 26; i++) { const u = ((t - HIT) * 0.9 + i * 0.04) % 1.4; g.fillStyle = `rgba(30,27,28,${0.8 * (1 - u / 1.4)})`; g.fillRect(Math.round(px + 40 - u * 60 + Math.sin(i) * 3), Math.round(py + 52 + u * 12 + Math.sin(i * 2) * 3 - u * 8), 4, 4); }
        if (fall >= 1) blast(g, Math.round(px + 60 + 20), 218, t - HIT - 1.7, 1.2, undefined, 14); // dopad za linií
      }
      g.restore();
    },
  };
  return {
    canvas,
    state,
    draw(name, t) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.imageSmoothingEnabled = false;
      g.globalAlpha = 1;
      g.clearRect(0, 0, W, H);
      scenes[name]?.(Math.max(0, t));
    },
  };
}
