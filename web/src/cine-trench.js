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
    // Front News Day 3: spojka, dělostřelci na hřebeni, lazaret
    cRun: A('concord', 'run', 'west'),
    cEast: fromTex(tex.concord?.east, NIGHT), cWestPlain: fromTex(tex.concord?.west, NIGHT), cNorth: fromTex(tex.concord?.north, NIGHT),
    cKneel: A('concord', 'kneel', 'east'),
    hLie: A('hegemony', 'lying-wounded', 'east'), hLieW: A('hegemony', 'lying-wounded', 'west'),
    hMed: A('hegemony_medic', 'bandage', 'east'),
    cSitW: A('concord', 'sit-wounded', 'west'), cSitE: A('concord', 'sit-wounded', 'east'),
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
    sandbags(x0, x1, PAR, 4);
  }
  function rain(t) {
    g.fillStyle = 'rgba(170,180,195,0.4)';
    for (let k = 0; k < 70; k++) { const p = (k * 0.618) % 1, q = (k * 0.754) % 1; const y = ((q * 170 + t * 200) % 150) - 8; g.fillRect(Math.round((p * W - y * 0.25 + W) % W), Math.round(y), 1, 3); }
  }
  const glow = (x, y, r, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(255,246,220,${a})`); gr.addColorStop(1, 'rgba(255,246,220,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };

  // lazaret: teplé světlo lampy místo noční modři
  const WARM = 'rgba(120,70,20,0.18)';
  const AW = (k, a, d) => (anims[k]?.[a]?.[d] || []).map((t) => fromTex(t, WARM));
  const W2 = { lie: AW('hegemony', 'lying-wounded', 'east'), lieW: AW('hegemony', 'lying-wounded', 'west'), med: AW('hegemony_medic', 'bandage', 'east') };
  // obloha bez obzoru (celá výška) pro scénu na hřebeni
  function skyFull(o) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const u = (y / 100) * (SKY.length - 1) + (by(x, y) - 0.5);
      g.fillStyle = SKY[Math.max(0, Math.min(SKY.length - 1, Math.round(u)))]; g.fillRect(x, y, 1, 1);
    }
    if (o.flash) { g.fillStyle = `rgba(255,236,190,${0.35 * o.flash})`; g.fillRect(0, 0, W, H); }
  }
  // polní dělo z boku (hlaveň doleva = na Hegemonii), kreslené v kódu; recoil = posun hlavně
  function gun(x, y, recoil) {
    const r = Math.round(recoil);
    g.fillStyle = PAL.dark; g.fillRect(x - 14 + r, y - 13, 26, 3); // hlaveň
    g.fillStyle = PAL.steel; g.fillRect(x - 14 + r, y - 13, 26, 1);
    g.fillStyle = PAL.mud1; g.fillRect(x + 6, y - 17, 12, 11); g.fillStyle = PAL.grey; g.fillRect(x + 6, y - 17, 12, 1); // štít
    g.fillStyle = PAL.mud0; g.fillRect(x + 12, y - 8, 22, 3); // lafeta k zemi
    for (const [cx, rr] of [[x + 10, 7]]) { g.strokeStyle = PAL.ink; g.lineWidth = 2; g.beginPath(); g.arc(cx, y - 2, rr, 0, Math.PI * 2); g.stroke(); g.strokeStyle = PAL.mud3; g.lineWidth = 1; for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; g.beginPath(); g.moveTo(cx, y - 2); g.lineTo(cx + Math.cos(a) * rr, y - 2 + Math.sin(a) * rr); g.stroke(); } }
  }

  const BAGC = [[PAL.sand, PAL.bone, PAL.mud3], [PAL.mud3, PAL.sand, PAL.mud2], [PAL.bone, PAL.pale, PAL.sand]];
  const bagSprites = BAGC.map(([body, hi, sh]) => {
    const c = off(12, 7), q = c.getContext('2d'), P = (col, x, y, w = 1, h = 1) => { q.fillStyle = col; q.fillRect(x, y, w, h); };
    P(PAL.ink, 1, 0, 10, 1); P(PAL.ink, 0, 1, 1, 5); P(PAL.ink, 11, 1, 1, 5); P(PAL.ink, 1, 6, 10, 1); // obrys se zaoblenými rohy
    P(body, 1, 1, 10, 5); P(hi, 2, 1, 7, 1); P(hi, 1, 2, 2, 1); P(sh, 1, 5, 10, 1); P(sh, 9, 2, 2, 3); // tělo, světlo nahoře, stín dole a vpravo
    P(sh, 4, 3, 3, 1); P(PAL.mud1, 10, 1, 1, 1); P(sh, 10, 2, 1, 1); // šev a zavázaný roh
    return c;
  });
  // řada pytlů (vazba jako cihly), y = horní hrana nejvyšší řady
  function sandbags(x0, x1, y, rows) {
    for (let r = rows - 1; r >= 0; r--) for (let x = x0 - ((r % 2) ? 6 : 0) - 12, i = 0; x < x1; x += 11, i++) {
      const v = (i * 7 + r * 3) % 3; g.drawImage(bagSprites[v], x, y + r * 5);
    }
  }

  const TOP = 66, STEPY = 97, DECK = 120; // zákop zevnitř (runner, sick)
  function inside(t, o) {
      // pohled ZEVNITŘ zákopu Concordu: zadní stěna s pytli nahoře, hlídky na stupínku koukají přes val (zády k nám),
    // vpředu prkenná podlaha, spojka běží zprava doleva celá vidět (hlavou nic nezakrývá)
    
    for (let y = 0; y < TOP; y++) for (let x = 0; x < W; x++) { const u = (y / TOP) * (SKY.length - 2) + (by(x, y) - 0.5); g.fillStyle = SKY[Math.max(0, Math.min(SKY.length - 1, Math.round(u)))]; g.fillRect(x, y, 1, 1); }
    if (o.flash) { g.fillStyle = `rgba(227,217,195,${0.5 * o.flash})`; g.fillRect(0, 0, W, TOP); }
    // světlice daleko nad zemí nikoho (jen záře na obloze)
    const fl = (t * 0.35) % 1; glow(70 + fl * 30, 10 + fl * 14, 26, 0.25 * Math.sin(fl * Math.PI));
    // zadní stěna: hlína, svislé kůly a vodorovná prkna obložení
    for (let y = TOP + 14; y < DECK; y++) for (let x = 0; x < W; x++) px(by(x, y) < 0.12 ? PAL.mud2 : PAL.mud1, x, y);
    for (let y = TOP + 22; y < STEPY; y += 9) { px(PAL.mud2, 0, y, W, 2); px(PAL.mud0, 0, y + 2, W, 1); }
    for (let x = 8; x < W; x += 30) { px(PAL.mud3, x, TOP + 14, 3, DECK - TOP - 14); px(PAL.mud0, x + 3, TOP + 14, 1, DECK - TOP - 14); }
    // stupínek (fire step) a pytle na valu
    px(PAL.mud3, 0, STEPY, W, 3); px(PAL.mud0, 0, STEPY + 3, W, 1);
    sandbags(0, W, TOP, 3);
    // hlídky na stupínku zády k nám, hlavy nad pytli
    if (o.sentries !== false) for (const hx of [52, 150, 214]) put(S.cNorth, hx, STEPY + 1);
    // podlaha z prken (duckboards) a bláto
    for (let y = DECK; y < H; y++) for (let x = 0; x < W; x++) px(y < DECK + 6 ? ((x % 9) === 0 ? PAL.mud0 : (x % 9) < 2 ? PAL.sand : PAL.mud3) : (by(x, y) < 0.2 ? PAL.mud1 : PAL.mud0), x, y);
    px(PAL.water, 30, DECK + 8, 26, 1); px(PAL.water, 150, DECK + 10, 34, 1);
  }

  const scenes = {
    // spojka Concordu běží zákopem zprava doleva s číslem na papíře; hlídky stojí u valu
    // mokrý zákop, kde se schyluje k nemocem: voda na podlaze, vojáci sedí u stěny, déšť, krysa (20. 11.)
    sick(t, o) {
      inside(t, { ...o, sentries: false });
      for (let x = 0; x < W; x++) if (by(x, DECK + 3) < 0.7) px(PAL.water, x, DECK + 2 + ((x >> 3) % 2), 1, 1);
      for (const [x, fr, k] of [[40, S.cSitW, 0], [96, S.cSitE, 3], [168, S.cSitW, 5], [214, S.cSitE, 2]]) put(at(fr, k + Math.floor(t * 2) % 2), x, DECK + 2);
      const rx = ((t * 18) % 300) - 30; px(PAL.mud1, Math.round(rx), DECK + 1, 5, 2); px(PAL.mud0, Math.round(rx) + 5, DECK + 1, 2, 1); px(PAL.mud0, Math.round(rx) - 3, DECK + 2, 3, 1); // krysa
      rain(t); if (o.storm) rain(t + 0.37);
    },
    runner(t, o) {
      inside(t, o);
      // spojka: běží celý záběr, papír v ruce
      const X = 262 - t * 26;
      if (X > -20) { put(at(S.cRun, Math.floor(t * 12) % Math.max(1, S.cRun.length)), X, DECK + 4); px(PAL.white, Math.round(X - 7), DECK - 13, 3, 2); }
      if (o.storm) rain(t);
    },
    // baterie na hřebeni Verdel Ridge v noci: dělo pálí doleva, záblesk, kouř; granát NELETÍ přes frontu (dopad je samostatný záběr ve hře)
    battery(t, o) {
      const P0 = 0.6, every = 1.6, k = t < P0 ? -1 : Math.floor((t - P0) / every), u = t < P0 ? 9 : (t - P0) % every;
      skyFull({ flash: u < 0.12 ? 1 - u / 0.12 : 0 });
      // hřeben
      for (let x = 0; x < W; x++) { const top = 92 - Math.round(10 * Math.sin((x + 40) / 70) + 4 * Math.sin(x / 13)); for (let y = top; y < H; y++) px(y - top < 2 ? PAL.mud2 : by(x, y) < 0.15 ? PAL.mud1 : PAL.mud0, x, y); }
      const GX = 112, GY = 98;
      if (u < 0.15) { const gr = g.createRadialGradient(GX - 16, GY - 12, 0, GX - 16, GY - 12, 60); gr.addColorStop(0, 'rgba(255,220,150,0.35)'); gr.addColorStop(1, 'rgba(255,220,150,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
      put(S.cWestPlain, GX + 32, GY + 2); put(at(S.cKneel, 3), GX + 52, GY + 2);
      gun(GX, GY, u < 0.25 ? 4 * (1 - u / 0.25) : 0);
      if (u < 0.1) { glow(GX - 18, GY - 12, 12, 1); px(PAL.white, GX - 22, GY - 13, 5, 2); px(PAL.gold, GX - 27, GY - 14, 5, 4); }
      // kouř po výstřelech stoupá a řídne
      for (let j = Math.max(0, k - 2); j <= k; j++) {
        const age = t - P0 - j * every; if (age < 0) continue;
        for (let q = 0; q < 6; q++) { const r = 2 + age * 3 + q, a = Math.max(0, 0.5 - age * 0.18); if (a <= 0) continue;
          g.fillStyle = `rgba(150,145,135,${a})`; g.beginPath(); g.arc(GX - 20 - q * 3 + age * 6, GY - 14 - age * 9 - q, r * 0.6, 0, Math.PI * 2); g.fill(); }
      }
      if (o.storm) rain(t);
    },
    // lazaret v krytu: trámy, lampa (o.dim 0..1 = dohasíná), tři lůžka s raněnými, ošetřovatel u prvního
    ward(t, o) {
      const dim = o.dim || 0, fl = 0.9 + 0.1 * Math.sin(t * 17) * Math.sin(t * 5.3), FL = 100;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) px(y >= FL ? (by(x, y) < 0.25 ? PAL.mud2 : PAL.mud1) : (y % 9 === 0 ? PAL.mud0 : by(x, y) < 0.15 ? PAL.mud2 : PAL.mud1), x, y); // stěna z prken
      px(PAL.mud3, 0, FL, W, 1);
      for (let x = 14; x < W; x += 56) { px(PAL.mud3, x, 22, 5, FL - 22); px(PAL.mud0, x + 5, 22, 1, FL - 22); } // sloupy
      px(PAL.mud3, 0, 18, W, 5); px(PAL.mud0, 0, 23, W, 1); // strop, trám
      // police s lahvemi a bednou obvazů
      px(PAL.mud3, 150, 56, 44, 2); for (const [bx, c] of [[154, PAL.water], [160, PAL.grey], [166, PAL.water], [176, PAL.rust], [184, PAL.grey]]) { px(c, bx, 49, 4, 7); px(PAL.pale, bx + 1, 50, 1, 2); }
      px(PAL.sand, 30, 60, 22, 12); px(PAL.mud3, 30, 60, 22, 1); px(PAL.rust, 39, 63, 4, 6); px(PAL.rust, 37, 65, 8, 2); // bedna s křížem
      // lůžka (nosítka na kozách) a ranění na nich
      const beds = [[66, W2.lie], [134, W2.lieW], [202, W2.lie]];
      for (const [bx] of beds) { px(PAL.mud3, bx - 19, FL - 12, 38, 3); px(PAL.sand, bx - 19, FL - 13, 38, 1); px(PAL.mud0, bx - 17, FL - 9, 2, 9); px(PAL.mud0, bx + 15, FL - 9, 2, 9); }
      for (const [bx, fr] of beds) put(at(fr, 2), bx, FL - 5);
      put(at(W2.med, Math.floor(t * 5) % Math.max(1, W2.med.length)), 42, FL + 4); // ošetřovatel u prvního lůžka
      if (o.full) { // přeplněno: ranění na nosítkách na zemi mezi lůžky, druhý ošetřovatel
        for (const [bx, fr] of [[100, W2.lieW], [168, W2.lie], [236, W2.lieW]]) { px(PAL.sand, bx - 16, FL + 14, 32, 2); px(PAL.mud3, bx - 16, FL + 16, 32, 1); put(at(fr, 1), bx, FL + 18); }
        put(at(W2.med, (Math.floor(t * 5) + 3) % Math.max(1, W2.med.length)), 140, FL + 22);
      }
      // lampa na trámu
      const LX = 110, LY = 36; px(PAL.ink, LX, 23, 1, 9); px(PAL.mud3, LX - 3, LY - 4, 7, 2); px(PAL.gold, LX - 2, LY - 2, 5, 5); px(PAL.white, LX - 1, LY - 1, 3, 3 * (1 - dim) | 0 || 1);
      const L = (1 - dim) * fl;
      const gr = g.createRadialGradient(LX, LY, 0, LX, LY, 160); gr.addColorStop(0, `rgba(255,205,130,${0.6 * L})`); gr.addColorStop(0.55, `rgba(210,130,60,${0.24 * L})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.fillStyle = `rgba(10,9,8,${0.05 + 0.5 * dim})`; g.fillRect(0, 0, W, H);
    },
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
