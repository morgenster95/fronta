// Kreslené detaily NA VÝŠKU pro Day reely (20. 11. 2026, uživatel: „scény nezabírají celou výšku, jen malé okénko“).
// Plátno 135×240 (×8 = 1080×1920), sprity ze hry 1:1, paleta Trench-24, žádná průhlednost postav.
//   const cv = makeVertCine(tex, anims); root.prepend(cv.canvas); cv.draw('ward', t, { dim })
// Scény: ward  – lazaret v krytu, 4 řady raněných do hloubky, dva medici obcházejí: dojdou, kleknou a obvazují, vstanou, jdou k dalšímu
//        trench – zákop v dešti po boji: padlí pod plachtami, ranění sedí u stěny, důstojník jde pomalu mezi nimi a u každého se zastaví
const W = 135, H = 240;
const PAL = { ink: '#0e0d0c', dark: '#1c1a17', mud0: '#2b2722', mud1: '#3d3730', mud2: '#524a3f', mud3: '#6b6152', sand: '#857a68', bone: '#a39782', pale: '#c4b8a0', white: '#e3d9c3', gold: '#d98f3f', rust: '#7e3b2a', steel: '#666d70', water: '#2a3138', navy: '#141a2c', dusk: '#4b4560', olive: '#6f7148' };
const off = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const B = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const by = (x, y) => (B[y & 3][x & 3] + 0.5) / 16;

function fromTex(tx, tint, flip = false) {
  if (!tx?.source?.resource) return null;
  const f = tx.frame, o = off(f.width, f.height), g = o.getContext('2d');
  if (flip) { g.translate(f.width, 0); g.scale(-1, 1); }
  g.drawImage(tx.source.resource, f.x, f.y, f.width, f.height, 0, 0, f.width, f.height);
  if (tint) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = tint; g.fillRect(0, 0, f.width, f.height); }
  return o;
}

export function makeVertCine(tex = {}, anims = {}) {
  const canvas = off(W, H);
  const g = canvas.getContext('2d');
  const WARM = 'rgba(120,70,20,0.16)', COLD = 'rgba(30,36,72,0.28)';
  const A = (k, a, d, tint) => (anims[k]?.[a]?.[d] || []).map((t) => fromTex(t, tint));
  const S = {
    lieE: A('hegemony', 'lying-wounded', 'east', WARM), lieW: A('hegemony', 'lying-wounded', 'west', WARM),
    sitE: A('hegemony', 'sit-wounded', 'east', WARM), medBand: A('hegemony_medic', 'bandage', 'east', WARM), medBandW: A('hegemony_medic', 'bandage', 'west', WARM),
    medWalkE: A('hegemony_medic', 'walk', 'east', WARM), medWalkW: A('hegemony_medic', 'walk', 'west', WARM),
    tSitE: A('hegemony', 'sit-wounded', 'east', COLD), tSitW: A('hegemony', 'sit-wounded', 'west', COLD),
    tLie: A('hegemony', 'lying-wounded', 'east', COLD),
    offE: A('hegemony_officer', 'walk', 'east', COLD), offW: A('hegemony_officer', 'walk', 'west', COLD),
    offStand: fromTex(tex.hegemony_officer?.west, COLD), offSouth: fromTex(tex.hegemony_officer?.south, COLD),
  };
  const at = (arr, i) => arr[((i % Math.max(1, arr.length)) + arr.length) % Math.max(1, arr.length)];
  const put = (fr, x, feet) => { if (fr) g.drawImage(fr, Math.round(x - fr.width / 2), Math.round(feet - (fr.height === 64 ? 46 : 30))); };
  const px = (c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const glow = (x, y, r, a, rgb = '255,205,130') => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
  function rain(t, n = 60) { g.fillStyle = 'rgba(170,180,195,0.45)'; for (let k = 0; k < n; k++) { const p = (k * 0.618) % 1, q = (k * 0.754) % 1; const y = ((q * 280 + t * 260) % 260) - 10; g.fillRect(Math.round((p * W - y * 0.2 + W) % W), Math.round(y), 1, 3); } }
  function sandbags(x0, x1, y, rows) {
    for (let r = rows - 1; r >= 0; r--) for (let x = x0 - (r % 2 ? 6 : 0) - 12, i = 0; x < x1; x += 11, i++) {
      const c = [[PAL.sand, PAL.bone, PAL.mud3], [PAL.mud3, PAL.sand, PAL.mud2], [PAL.bone, PAL.pale, PAL.sand]][(i * 7 + r * 3) % 3], yy = y + r * 5;
      px(PAL.ink, x + 1, yy, 10, 1); px(PAL.ink, x, yy + 1, 1, 5); px(PAL.ink, x + 11, yy + 1, 1, 5); px(PAL.ink, x + 1, yy + 6, 10, 1);
      px(c[0], x + 1, yy + 1, 10, 5); px(c[1], x + 2, yy + 1, 7, 1); px(c[2], x + 1, yy + 5, 10, 1); px(c[2], x + 9, yy + 2, 2, 3);
    }
  }
  // padlý pod plachtou (deka přes tělo, vyčnívají boty)
  function shroud(x, y) { px(PAL.ink, x - 13, y - 5, 26, 1); px(PAL.olive, x - 13, y - 4, 26, 5); px(PAL.mud2, x - 13, y, 26, 1); px('#52543a', x - 9, y - 3, 10, 1); px(PAL.ink, x + 13, y - 2, 3, 2); px(PAL.ink, x + 13, y + 1, 3, 1); }

  // trasa medika: sled zastávek (x, chodidla, směr obvazování), mezi nimi chůze; vrací pozici a snímek
  function rounds(t, stops, speed, dwell, phase) {
    const legs = [];
    let T0 = 0;
    for (let i = 0; i < stops.length; i++) {
      const a = stops[i], b = stops[(i + 1) % stops.length];
      const dist = Math.hypot(b[0] - a[0], b[1] - a[1]), walk = dist / speed;
      legs.push({ a, b, t0: T0, dwell, walk }); T0 += dwell + walk;
    }
    let u = (t + phase) % T0;
    for (const L of legs) {
      if (u < L.dwell) return { x: L.a[0], y: L.a[1], work: true, face: L.a[2], k: Math.floor(u * 7) };
      u -= L.dwell;
      if (u < L.walk) { const q = u / L.walk; return { x: L.a[0] + (L.b[0] - L.a[0]) * q, y: L.a[1] + (L.b[1] - L.a[1]) * q, work: false, face: L.b[0] >= L.a[0] ? 'e' : 'w', k: Math.floor(u * 10) }; }
      u -= L.walk;
    }
    return { x: stops[0][0], y: stops[0][1], work: true, face: 'e', k: 0 };
  }

  const scenes = {
    ward(t, o) {
      const dim = o.dim || 0, fl = 0.9 + 0.1 * Math.sin(t * 17) * Math.sin(t * 5.3);
      // stěny z prken, strop s trámem, podlaha do hloubky
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) px(y < 64 ? (y % 8 === 0 ? PAL.mud0 : by(x, y) < 0.15 ? PAL.mud2 : PAL.mud1) : (by(x, y) < 0.18 ? PAL.mud2 : PAL.mud1), x, y);
      px(PAL.mud3, 0, 16, W, 5); px(PAL.mud0, 0, 21, W, 1); for (const x of [10, 64, 118]) { px(PAL.mud3, x, 21, 4, 43); px(PAL.mud0, x + 4, 21, 1, 43); }
      px(PAL.mud3, 0, 64, W, 1);
      for (let y = 70; y < H; y += 14) px(PAL.mud0, 0, y, W, 1); // prkna podlahy
      // police s lahvemi a bedna s křížem na zadní stěně
      px(PAL.mud3, 80, 44, 30, 2); for (const [bx, c] of [[83, PAL.water], [89, PAL.steel], [95, PAL.rust], [101, PAL.water]]) { px(c, bx, 37, 4, 7); px(PAL.pale, bx + 1, 38, 1, 2); }
      px(PAL.sand, 22, 42, 20, 12); px(PAL.rust, 30, 45, 4, 6); px(PAL.rust, 28, 47, 8, 2);
      // 4 řady raněných do hloubky (lůžka nahoře, nosítka na zemi dole: přeplněno)
      const rows = [[30, 86, 'E', true], [100, 92, 'W', true], [36, 128, 'W', false], [96, 136, 'E', false], [28, 172, 'E', false], [104, 180, 'W', false], [62, 214, 'E', false]];
      for (const [x, y, d, bed] of rows) {
        if (bed) { px(PAL.mud3, x - 18, y - 5, 36, 3); px(PAL.sand, x - 18, y - 6, 36, 1); px(PAL.mud0, x - 16, y - 2, 2, 8); px(PAL.mud0, x + 14, y - 2, 2, 8); }
        else { px(PAL.sand, x - 15, y - 2, 30, 2); px(PAL.mud3, x - 15, y, 30, 1); }
        put(at(d === 'E' ? S.lieE : S.lieW, 1 + (x % 2)), x, y + (bed ? -2 : 3));
      }
      put(at(S.sitE, 2), 118, 154);
      // dva medici obcházejí: dojít, kleknout a obvazovat, vstát, k dalšímu
      const m1 = rounds(t, [[14, 92, 'e'], [116, 99, 'w'], [52, 134, 'e'], [80, 142, 'w']], 26, 1.3, 0);
      const m2 = rounds(t, [[10, 178, 'e'], [120, 186, 'w'], [44, 220, 'e']], 24, 1.3, 1.9);
      for (const m of [m1, m2]) put(m.work ? at(m.face === 'e' ? S.medBand : S.medBandW, m.k) : at(m.face === 'e' ? S.medWalkE : S.medWalkW, m.k), m.x, m.y + 6);
      // lampa a světlo, které slábne
      const LX = 67, LY = 34; px(PAL.ink, LX, 21, 1, 9); px(PAL.mud3, LX - 3, LY - 4, 7, 2); px(PAL.gold, LX - 2, LY - 2, 5, 5); px(PAL.white, LX - 1, LY - 1, 3, 2);
      const L = (1 - dim) * fl;
      glow(LX, LY + 30, 150, 0.5 * L);
      g.fillStyle = `rgba(10,9,8,${0.06 + 0.5 * dim})`; g.fillRect(0, 0, W, H);
    },
    trench(t, o) {
      const TOP = 70, STEP = 112, FLOOR = 132;
      // noční obloha s deštěm, světlice
      for (let y = 0; y < TOP; y++) for (let x = 0; x < W; x++) { const SKY = [PAL.navy, '#1d2238', '#262a44', '#2f2f4c', PAL.dusk]; const u = (y / TOP) * (SKY.length - 1) + (by(x, y) - 0.5); px(SKY[Math.max(0, Math.min(SKY.length - 1, Math.round(u)))], x, y); }
      const fl = (t * 0.25) % 1; glow(40 + fl * 40, 14 + fl * 10, 40, 0.3 * Math.sin(fl * Math.PI), '255,246,220');
      // zadní stěna s kůly a prkny, pytle na valu, stupínek
      for (let y = TOP + 14; y < FLOOR; y++) for (let x = 0; x < W; x++) px(by(x, y) < 0.12 ? PAL.mud2 : PAL.mud1, x, y);
      for (let y = TOP + 22; y < STEP; y += 9) { px(PAL.mud2, 0, y, W, 2); px(PAL.mud0, 0, y + 2, W, 1); }
      for (let x = 6; x < W; x += 32) { px(PAL.mud3, x, TOP + 14, 3, FLOOR - TOP - 14); px(PAL.mud0, x + 3, TOP + 14, 1, FLOOR - TOP - 14); }
      px(PAL.mud3, 0, STEP, W, 3); px(PAL.mud0, 0, STEP + 3, W, 1);
      sandbags(0, W, TOP, 3);
      // podlaha s kalužemi (hluboko, ať je vidět hodně)
      for (let y = FLOOR; y < H; y++) for (let x = 0; x < W; x++) px(by(x, y) < 0.22 ? PAL.mud2 : (y + x) % 9 === 0 ? PAL.mud0 : PAL.mud1, x, y);
      for (const [x, y, w] of [[8, 150, 22], [70, 168, 30], [20, 206, 26], [96, 222, 28]]) { px(PAL.water, x, y, w, 2); px('#3a4550', x + 3, y, w - 8, 1); }
      // ranění u stěny, padlí pod plachtami, jeden raněný leží
      put(at(S.tSitE, 2), 16, STEP + 2); put(at(S.tSitW, 3), 96, STEP + 2); put(at(S.tSitE, 1), 124, STEP + 2);
      shroud(36, 156); shroud(98, 184); shroud(44, 214);
      put(at(S.tLie, 2), 92, 150);
      // důstojník jde pomalu doleva a doprava mezi nimi, u padlých se zastaví a dívá se dolů
      const path = [[140, 172], [70, 172, 2.2], [20, 196, 2.0], [80, 200], [140, 196]];
      const seg = []; let T0 = 0;
      for (let i = 0; i < path.length - 1; i++) { const a = path[i], b = path[i + 1], walk = Math.hypot(b[0] - a[0], b[1] - a[1]) / 14; seg.push({ a, b, t0: T0, walk, stop: b[2] || 0 }); T0 += walk + (b[2] || 0); }
      let u = t % T0, ox = path[0][0], oy = path[0][1], fr = S.offStand;
      for (const sgm of seg) {
        if (u < sgm.walk) { const q = u / sgm.walk; ox = sgm.a[0] + (sgm.b[0] - sgm.a[0]) * q; oy = sgm.a[1] + (sgm.b[1] - sgm.a[1]) * q; fr = at(sgm.b[0] < sgm.a[0] ? S.offW : S.offE, Math.floor(u * 8)); break; }
        u -= sgm.walk;
        if (u < sgm.stop) { ox = sgm.b[0]; oy = sgm.b[1]; fr = S.offSouth || S.offStand; break; }
        u -= sgm.stop;
      }
      put(fr, ox, oy);
      rain(t, 70);
      g.fillStyle = 'rgba(20,24,48,0.12)'; g.fillRect(0, 0, W, H);
    },
  };
  return {
    canvas,
    draw(name, t, o = {}) {
      g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = false; g.globalAlpha = 1; g.clearRect(0, 0, W, H);
      scenes[name]?.(Math.max(0, t), o);
    },
  };
}
