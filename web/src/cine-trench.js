// Kreslený zákop z boku pro detailní záběry Front News (19. 11. 2026, uživatel: „scénu nakreslenou – zákop, kde ukazujeme, jak po sobě střílejí“).
// Mřížka 240×135 (16:9, ×4 na 960×540), sprity ze hry 1:1 (postava ~30 px, stejné měřítko jako ve hře), kreslení v kódu paletou Trench-24.
//   const ct = makeTrenchCine(tex, anims); root.prepend(ct.canvas); ct.draw('duelA', t, { storm: true })
// Scény: duelA – zákop Hegemonie vlevo, odstřelovač míří doprava a vystřelí (o.shot), stopovka přes zemi nikoho
//        duelB – zákop Concordu vpravo, voják u valu dostane zásah (o.hit) a sesune se raněný
//        mg    – kulometčík Hegemonie vleže na valu pálí dávky doprava
// Noc, bouře (blesky o.flash), déšť. Žádná průhlednost postav (jen barevný nádech).
const W = 240, H = 135; // ×4 na 960×540: postava ~30 px = čtvrtina výšky záběru (detail)
const PAL = { ink: '#0e0d0c', dark: '#1c1a17', mud0: '#2b2722', mud1: '#3d3730', mud2: '#524a3f', mud3: '#6b6152', sand: '#857a68', bone: '#a39782', pale: '#c4b8a0', white: '#e3d9c3', fire: '#a85a36', gold: '#d98f3f', rust: '#7e3b2a', steel: '#666d70', grey: '#8a9295', water: '#2a3138', navy: '#141a2c', dusk: '#4b4560' };
const off = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const B = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const by = (x, y) => (B[y & 3][x & 3] + 0.5) / 16;

function fromTex(tx, tint) {
  if (!tx?.source?.resource) return null;
  const f = tx.frame, o = off(f.width, f.height), g = o.getContext('2d');
  g.drawImage(tx.source.resource, f.x, f.y, f.width, f.height, 0, 0, f.width, f.height);
  if (tint) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = tint; g.fillRect(0, 0, f.width, f.height); }
  return o;
}

export function makeTrenchCine(tex = {}, anims = {}) {
  const canvas = off(W, H);
  const g = canvas.getContext('2d');
  const NIGHT = 'rgba(30,36,72,0.3)';
  const A = (k, a, d) => (anims[k]?.[a]?.[d] || []).map((t) => fromTex(t, NIGHT));
  const S = {
    hSnipe: A('hegemony_sniper', 'fire-side', 'east'),
    cSit: A('concord', 'sit-wounded', 'west'),
    hMg: A('hegemony_machinegunner', 'fire-prone', 'east'),
    cStand: fromTex(tex.concord?.west, NIGHT),
  };
  const at = (arr, i) => arr[Math.max(0, Math.min(arr.length - 1, i))];
  const put = (fr, x, feet) => { if (fr) g.drawImage(fr, Math.round(x - fr.width / 2), Math.round(feet - (fr.height === 64 ? 46 : 30))); };
  const px = (c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const HOR = 66, PAR = 86, STEP = 112, FLOOR = 126; // obzor, horní hrana valu, stupínek, podlaha
  // obloha: plynulý přechod (rozptýlený), blesk zesvětlí
  const SKY = [PAL.navy, '#1d2238', '#262a44', '#2f2f4c', PAL.dusk, '#55485a'];
  function sky(t, o) {
    for (let y = 0; y < HOR; y++) for (let x = 0; x < W; x++) {
      const u = (y / HOR) * (SKY.length - 1) + (by(x, y) - 0.5);
      g.fillStyle = SKY[Math.max(0, Math.min(SKY.length - 1, Math.round(u)))]; g.fillRect(x, y, 1, 1);
    }
    if (o.flash) { g.fillStyle = `rgba(227,217,195,${0.5 * o.flash})`; g.fillRect(0, 0, W, HOR); }
  }
  function nml(far) {
    for (let y = HOR; y < PAR + 10; y++) for (let x = 0; x < W; x++) px(by(x, y) < 0.2 ? PAL.mud2 : (y - HOR) < 6 ? PAL.mud2 : PAL.mud1, x, y);
    for (const [cx, cy, r] of [[50, 80, 8], [120, 84, 10], [190, 76, 7]]) { g.fillStyle = PAL.mud0; g.beginPath(); g.ellipse(cx, cy, r, r * 0.3, 0, 0, Math.PI * 2); g.fill(); px(PAL.water, cx - r + 3, cy, (r - 3) * 2, 1); }
    for (let x = 10; x < W; x += 28) { px(PAL.mud3, x, HOR + 3, 1, 8); for (let k = 0; k < 28; k += 2) px(PAL.steel, x + k, HOR + 5 + ((k >> 1) % 3), 1, 1); }
    const x0 = far === 'right' ? 150 : 0, x1 = far === 'right' ? W : 90;
    for (let x = x0; x < x1; x += 5) { px(PAL.mud3, x, HOR - 3, 5, 2); px(PAL.mud2, x, HOR - 1, 5, 2); }
    for (let x = x0 + 7; x < x1; x += 19) { px(PAL.ink, x, HOR - 6, 3, 2); px(PAL.ink, x + 1, HOR - 7, 1, 1); }
  }
  // zákop v řezu: zadní stěna a podlaha (za vojákem), val z pytlů (PŘED vojákem, voják kouká přes něj)
  const span = (side) => (side === 'left' ? [0, 150] : [90, W]);
  function trenchBack(side) {
    const [x0, x1] = span(side);
    for (let y = PAR + 4; y < H; y++) for (let x = x0; x < x1; x++) px(y >= FLOOR ? PAL.mud0 : by(x, y) < 0.12 ? PAL.mud1 : PAL.dark, x, y);
    for (let x = x0 + 6; x < x1; x += 34) px(PAL.mud2, x, PAR + 6, 2, FLOOR - PAR - 6);
    for (let x = x0; x < x1; x += 7) { px(PAL.mud3, x, FLOOR, 6, 2); px(PAL.mud1, x + 6, FLOOR, 1, 2); }
    const sx = side === 'left' ? x1 - 56 : x0;
    px(PAL.mud3, sx, STEP, 56, 2); px(PAL.mud2, sx, STEP + 2, 56, 1);
  }
  function trenchFront(side) {
    const [x0, x1] = span(side);
    for (let r = 0; r < 4; r++) for (let x = x0 + (r % 2) * 4 - 4; x < x1; x += 8) {
      const y = PAR + r * 5;
      g.fillStyle = r === 0 ? PAL.bone : r === 3 ? PAL.mud3 : PAL.sand; g.fillRect(x, y, 7, 5);
      px(PAL.pale, x + 1, y, 5, 1); px(PAL.mud2, x, y + 4, 7, 1); px(PAL.mud1, x + 7, y, 1, 5);
    }
  }
  function rain(t) {
    g.fillStyle = 'rgba(170,180,195,0.4)';
    for (let k = 0; k < 70; k++) { const p = (k * 0.618) % 1, q = (k * 0.754) % 1; const y = ((q * 170 + t * 200) % 150) - 8; g.fillRect(Math.round((p * W - y * 0.25 + W) % W), Math.round(y), 1, 3); }
  }
  const glow = (x, y, r, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(255,246,220,${a})`); gr.addColorStop(1, 'rgba(255,246,220,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };

  const scenes = {
    duelA(t, o) {
      const SHOT = o.shot ?? 1.6, X = 118, FEET = PAR + 12; // stojí na stupínku, ramena a puška nad valem
      sky(t, o); nml('right'); trenchBack('left');
      const fi = t < SHOT ? Math.min(4, Math.floor((t / SHOT) * 5)) : 5 + Math.floor((t - SHOT) * 12);
      put(at(S.hSnipe, fi), X, FEET);
      trenchFront('left');
      if (t >= SHOT && t < SHOT + 0.08) glow(X + 16, FEET - 29, 9, 1);
      if (t >= SHOT && t < SHOT + 0.3) { const u = (t - SHOT) / 0.3; px(PAL.gold, Math.round(X + 20 + u * 110), FEET - 29 - Math.round(u * 12), 5, 1); }
      if (o.storm) rain(t);
    },
    duelB(t, o) {
      const HIT = o.hit ?? 0.5, X = 130;
      sky(t, o); nml('left'); trenchBack('right');
      put(t < HIT ? S.cStand : at(S.cSit, Math.floor((t - HIT) * 8)), X, t < HIT ? PAR + 12 : FLOOR);
      trenchFront('right');
      if (t >= HIT && t < HIT + 0.12) { glow(X, PAR - 14, 12, 0.9); for (let k = 0; k < 6; k++) px(PAL.rust, X - 4 + k * 2, PAR - 16 + (k % 3), 1, 1); }
      if (o.storm) rain(t);
    },
    mg(t, o) {
      const X = 104;
      sky(t, o); nml('right'); trenchBack('left');
      put(at(S.hMg, Math.floor(t * 14) % Math.max(1, S.hMg.length)), X, PAR + 2);
      trenchFront('left');
      if (Math.floor(t * 14) % 2 === 0) glow(X + 20, PAR - 3, 7, 0.9);
      for (let k = 0; k < 4; k++) { const u = ((t * 2.6 + k * 0.25) % 1); px(PAL.gold, Math.round(X + 24 + u * 130), PAR - 4 - Math.round(u * 14), 4, 1); }
      if (o.storm) rain(t);
    },
  };
  return {
    canvas,
    draw(name, t, o = {}) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.imageSmoothingEnabled = false;
      g.globalAlpha = 1;
      g.clearRect(0, 0, W, H);
      scenes[name]?.(Math.max(0, t), o);
    },
  };
}
