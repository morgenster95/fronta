// Filmové mezizáběry pro reely (kreslené v mřížce 180×320, herní paleta, dithering Bayer 4×4), aby každý reel
// nebyl jen záběr ze hry: světlice nad zákopem, kostel Saint-Ash proti měsíci, obvaziště při lucerně,
// dopis při svíčce, úsvit nad drátem. Volba podle dne: pickScene(den, seznam) – každý den jiný mix.
// Použití: const cine = makeScenes(tex); root.prepend(cine.canvas); cine.draw('flare', t) (t = sekundy od začátku záběru).
const W = 180, H = 320;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const by = (x, y) => BAYER[(y & 3) * 4 + (x & 3)] / 16;
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
const off = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const clamp01 = (x) => Math.min(1, Math.max(0, x));

export const SCENES = ['flare', 'church', 'aidpost', 'letter', 'dawnwire', 'grim'];
export const pickScene = (day, list, k = 0) => list[(day * 7 + k * 3) % list.length];

// dithered svislý přechod (barvy palety, žádné plynulé přechody)
function sky(g, y0, y1, stops, w = W) {
  const cs = stops.map(hex);
  for (let y = y0; y < y1; y++) for (let x = 0; x < w; x++) {
    const v = ((y - y0) / Math.max(1, y1 - y0 - 1)) * (cs.length - 1);
    const i = Math.min(cs.length - 2, Math.floor(v));
    g.fillStyle = rgb((v - i) > by(x, y) ? cs[i + 1] : cs[i]);
    g.fillRect(x, y, 1, 1);
  }
}
// dithered záře: pixely v kruhu dostanou barvu světla podle vzdálenosti (retro, bez rozmazání)
function glow(g, cx, cy, r, col, power = 1, sy = 1) {
  const c = rgb(hex(col));
  g.fillStyle = c;
  for (let y = Math.max(0, Math.floor(cy - r * sy)); y < Math.min(H, cy + r * sy); y++)
    for (let x = Math.max(0, Math.floor(cx - r)); x < Math.min(W, cx + r); x++) {
      const d = Math.hypot(x - cx, (y - cy) / sy) / r;
      if (d < 1 && (1 - d) ** 1.6 * power > by(x, y) + 0.04) g.fillRect(x, y, 1, 1);
    }
}
// silueta sprite (32×32 PixelLab) v jedné barvě
function silhouette(tx, col, flip = false) {
  if (!tx?.source?.resource) return null;
  const f = tx.frame;
  const o = off(f.width, f.height), og = o.getContext('2d');
  if (flip) { og.translate(f.width, 0); og.scale(-1, 1); }
  og.drawImage(tx.source.resource, f.x, f.y, f.width, f.height, 0, 0, f.width, f.height);
  og.setTransform(1, 0, 0, 1, 0, 0);
  og.globalCompositeOperation = 'source-in';
  og.fillStyle = col;
  og.fillRect(0, 0, f.width, f.height);
  return o;
}
function rain(g, t, n = 80, a = 0.35) {
  g.fillStyle = `rgba(170,180,195,${a})`;
  for (let k = 0; k < n; k++) {
    const p = (k * 0.6180339) % 1, q = (k * 0.7548776) % 1;
    const y = ((q * 340 + t * 260) % 340) - 10;
    const x = ((p * 230 - y * 0.25) % 230 + 230) % 230 - 20;
    g.fillRect(Math.round(x), Math.round(y), 1, 4);
  }
}
function crow(g, x, y, phase, col = '#0b0a09') {
  g.fillStyle = col;
  const up = Math.sin(phase) > 0;
  g.fillRect(x, y, 2, 1);
  if (up) { g.fillRect(x - 2, y - 1, 2, 1); g.fillRect(x + 2, y - 1, 2, 1); g.fillRect(x - 3, y - 2, 1, 1); g.fillRect(x + 4, y - 2, 1, 1); }
  else { g.fillRect(x - 2, y + 1, 2, 1); g.fillRect(x + 2, y + 1, 2, 1); }
}
function stakeWire(g, x0, x1, base, tall, step, col, hi) {
  const posts = [];
  for (let x = x0; x <= x1; x += step) posts.push(x);
  g.fillStyle = col;
  for (const p of posts) { g.fillRect(p, base - tall, 2, tall); g.fillRect(p - 1, base - tall, 4, 1); }
  for (let k = 0; k < 3; k++) for (let i = 0; i < posts.length - 1; i++) {
    const a = posts[i], b = posts[i + 1];
    for (let x = a; x < b; x++) {
      const y = base - tall + 3 + k * Math.round(tall / 4) + Math.round(2 * Math.sin(((x - a) / (b - a)) * Math.PI));
      g.fillStyle = (x + k) % 5 === 0 && hi ? hi : col;
      g.fillRect(x, y, 1, 1);
      if ((x + k) % 4 === 0) g.fillRect(x, y - 1, 1, 1); // ostny
    }
  }
}

// skutečný sprite ze hry (barevně), zvětšený a nasvícený: tint = barva přes sprite (světlo nebo protisvětlo)
function lit(tx, tint, flip = false) {
  if (!tx?.source?.resource) return null;
  const f = tx.frame;
  const o = off(f.width, f.height), og = o.getContext('2d');
  if (flip) { og.translate(f.width, 0); og.scale(-1, 1); }
  og.drawImage(tx.source.resource, f.x, f.y, f.width, f.height, 0, 0, f.width, f.height);
  og.setTransform(1, 0, 0, 1, 0, 0);
  if (tint) { og.globalCompositeOperation = 'source-atop'; og.fillStyle = tint; og.fillRect(0, 0, f.width, f.height); }
  return o;
}
const easeOut = (x) => 1 - Math.pow(1 - clamp01(x), 3);


// výbuch: záblesk, ohnivá koule, trosky, pak oheň u země a kouřový sloup, který nepřestane (obláčky se pořád rodí)
// u = s od výbuchu, k = velikost; smoke = barvy kouře podle stáří [nasvícený, mladý, starý, nejstarší (do barvy oblohy)]
function blast(g, ex, ey, u, k = 1, smoke = ['#5c2a22', '#2e2426', '#1d1b20', '#141a2c'], ground = 22) {
  if (u <= 0) return;
  const LIFE = 5, DT = 0.075;
  for (let i = 0; i < LIFE / DT; i++) {
    let a = u - 0.12 - i * DT;
    if (a <= 0) continue;
    a %= LIFE;
    const py = ey + ground - a * 26 * k, px = ex + Math.sin(i * 2.1) * 3 * k + a * a * 3 * k;
    const r = (4 + a * 4.5) * k + Math.sin(i * 3.3) * 1.5;
    g.fillStyle = a < 0.35 ? smoke[0] : a < 0.9 ? smoke[1] : a < 3.6 ? smoke[2] : smoke[3];
    g.beginPath(); g.ellipse(px, py, r, r * 0.85, 0, 0, Math.PI * 2); g.fill();
  }
  // oheň, který po výbuchu hoří dál (mihotá se)
  if (u > 0.5) {
    const fl = 0.75 + 0.25 * Math.sin(u * 13) * Math.sin(u * 7.7);
    glow(g, ex, ey + ground - 4, 18 * k, '#7e3b2a', 1.1 * fl);
    glow(g, ex, ey + ground - 4, 10 * k, '#d98f3f', 0.9 * fl);
    g.fillStyle = '#d98f3f';
    for (let i = 0; i < 6 * k; i++) g.fillRect(Math.round(ex - 6 * k + i * 2 + Math.sin(u * 9 + i) * 1.5), Math.round(ey + ground - 6 - Math.abs(Math.sin(u * 11 + i * 1.3)) * 7 * k), 1, 3);
  }
  if (u < 1.4) { // ohnivá koule přes spodek kouře
    const e = easeOut(u / 0.7), fade = clamp01(1 - (u - 0.45) / 0.9);
    glow(g, ex, ey - e * 12 * k, (16 + 52 * e) * k, '#7e3b2a', 1.4 * fade);
    glow(g, ex, ey - e * 14 * k, (12 + 40 * e) * k, '#a85a36', 1.3 * fade);
    glow(g, ex, ey - e * 16 * k, (8 + 28 * e) * k, '#d98f3f', 1.25 * fade);
    glow(g, ex, ey - e * 18 * k, (5 + 16 * e) * k, '#fff6dc', 1.2 * clamp01(1 - u / 0.55));
  }
  if (u < 1.6) for (let i = 0; i < 14; i++) { // trosky a hlína
    const vx = Math.cos(i * 2.4) * (18 + (i % 4) * 10) * k, vy = (40 + (i % 5) * 12) * k;
    g.fillStyle = i % 3 ? '#0b0a09' : '#a85a36';
    g.fillRect(Math.round(ex + vx * u), Math.round(ey - vy * u + 60 * u * u), 2, 2);
  }
}
const shakeOf = (u, k = 1) => (u > 0 && u < 0.45 ? Math.round(Math.sin(u * 70) * 2.5 * k * (1 - u / 0.45)) : 0);

export function makeScenes(tex, anims = {}) {
  const canvas = off(W, H);
  canvas.id = 'rd-cine2';
  const g = canvas.getContext('2d');
  const L = {}; // statické vrstvy
  const sentry = silhouette(tex.hegemony?.north || tex.concord?.north, '#0b0a09');
  const medic = silhouette(tex.hegemony_medic?.west || tex.concord_medic?.west, '#140f0c');
  // skutečné sprity v barvě: raněný (poslední snímek pádu), zdravotník, vojáci u drátu za úsvitu
  const fallTx = anims.hegemony?.fall?.south?.at(-1) || anims.concord?.fall?.south?.at(-1);
  const woundedLit = lit(fallTx, 'rgba(217,143,63,0.18)');
  const medicLit = lit(tex.hegemony_medic?.west || tex.concord_medic?.west, 'rgba(217,143,63,0.16)');
  const dawnA = lit(tex.hegemony?.['north-east'], 'rgba(30,16,14,0.42)');
  const dawnB = lit(tex.hegemony_machinegunner?.north || tex.hegemony?.north, 'rgba(30,16,14,0.5)');
  // ponurá varianta pro Concord: vojáci nasvícení požáry
  const grimA = lit(tex.concord?.north, 'rgba(92,42,34,0.35)');
  const grimB = lit(tex.concord_medic?.['north-east'] || tex.concord?.['north-east'], 'rgba(92,42,34,0.42)');
  const grimC = lit(tex.concord_machinegunner?.['north-west'] || tex.concord?.['north-west'], 'rgba(92,42,34,0.5)');
  const dawnC = lit(tex.hegemony_medic?.north || tex.hegemony?.north, 'rgba(30,16,14,0.55)');
  const church = new Image();
  church.src = '/assets/locations/church.png';
  let churchSil = null;
  church.onload = () => {
    const o = off(church.width, church.height), og = o.getContext('2d');
    og.drawImage(church, 0, 0);
    og.globalCompositeOperation = 'source-in';
    og.fillStyle = '#0b0a09';
    og.fillRect(0, 0, o.width, o.height);
    churchSil = o;
  };

  // --- světlice nad zákopem (noc, déšť, strážný za parapetem) ---
  {
    const c = off(W, H), cg = c.getContext('2d');
    sky(cg, 0, 215, ['#05070f', '#0b1020', '#151a2e', '#2a2236', '#4a2e2c']);
    cg.fillStyle = '#1a1519';
    for (let x = 0; x < W; x++) cg.fillRect(x, Math.round(200 + 3 * Math.sin(x * 0.05) + 2 * Math.sin(x * 0.19)), 1, 60);
    for (const [cx, cy, r] of [[30, 222, 9], [120, 216, 6], [160, 230, 11]]) { cg.fillStyle = '#100d10'; cg.beginPath(); cg.ellipse(cx, cy, r, r / 3, 0, 0, Math.PI * 2); cg.fill(); }
    stakeWire(cg, 4, 176, 214, 10, 17, '#0b0a09', null);
    L.flare = c;
    const p = off(W, H), pg = p.getContext('2d'); // parapet z pytlů (popředí)
    pg.fillStyle = '#0b0a09';
    pg.fillRect(0, 262, W, 70);
    for (let r = 0; r < 5; r++) for (let x = (r % 2) * -9; x < W; x += 18) {
      pg.fillStyle = (x + r) % 3 ? '#16120f' : '#1c1713';
      pg.beginPath(); pg.ellipse(x + 9, 246 + r * 8, 9, 4.5, 0, 0, Math.PI * 2); pg.fill();
      pg.fillStyle = '#0b0a09'; pg.fillRect(x + 12, 243 + r * 8, 1, 6);
    }
    L.parapet = p;
  }
  // --- kostel proti měsíci ---
  {
    const c = off(W, H), cg = c.getContext('2d');
    sky(cg, 0, 260, ['#04060d', '#0a1022', '#18203a', '#2b2a44', '#3a3346']);
    let s = 11;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k < 60; k++) { cg.fillStyle = r() < 0.25 ? '#d9d4c4' : '#6d7080'; cg.fillRect(Math.floor(r() * W), Math.floor(r() * 150), 1, 1); }
    L.church = c;
  }
  // --- úsvit nad drátem ---
  {
    const c = off(W, H), cg = c.getContext('2d');
    sky(cg, 0, 250, ['#1f2742', '#4b4560', '#8a5a5c', '#c87a52', '#e8a85c', '#f2c27a']);
    cg.fillStyle = '#4a3436';
    for (let x = 0; x < W; x++) cg.fillRect(x, Math.round(214 + 3 * Math.sin(x * 0.04 + 1)), 1, 60);
    L.dawn = c;
  }

  {
    const c = off(W, H), cg = c.getContext('2d');
    sky(cg, 0, 250, ['#141210', '#1f1a17', '#2e211d', '#4a2620', '#6e2e22', '#8a3c26']);
    L.grim = c;
  }
  // ponurý úsvit pro Concord: krvavé slunce v kouři, výbuchy všude kolem, padá hlína a popel
  const BOOMS = [[0.2, 30, 196, 0.8], [0.7, 132, 200, 1.1], [1.3, 76, 206, 0.7], [1.9, 160, 194, 0.9], [2.4, 14, 204, 1.2], [3.0, 104, 198, 0.8],
    [3.5, 56, 192, 1.0], [4.1, 150, 206, 0.7], [4.6, 88, 200, 1.3], [5.2, 24, 198, 0.9], [5.8, 128, 196, 1.0], [6.4, 66, 204, 0.8]];
  const GRIM_SMOKE = ['#6e2e22', '#2e211d', '#1f1a17', '#2a1d19'];
  const scenes = {
    flare(t) {
      g.drawImage(L.flare, 0, 0);
      // vzdálené záblesky děl jen jako mlčící obzor: tlumené mraky
      g.fillStyle = '#1b1e2e';
      for (const [x0, y, w, sp] of [[10, 80, 70, 2], [110, 110, 60, 1.4], [40, 140, 90, 2.6]]) g.fillRect(Math.round(((x0 + t * sp) % (W + 100)) - 50), y, w, 2);
      // světlice: vystoupá, pak pomalu klesá a kývá se
      const u = (t % 9);
      const fx = 46 + (u < 1.3 ? u * 20 : 26 + Math.sin(u * 1.7) * 6 + (u - 1.3) * 3);
      const fy = u < 1.3 ? 230 - (1 - (1 - u / 1.3) ** 2) * 170 : 60 + (u - 1.3) * 11;
      const life = u < 1.3 ? 0.55 : clamp01((8.6 - u) / 2);
      glow(g, fx, fy, 95, '#2b2a3a', 1.2 * life, 1.1);
      glow(g, fx, fy, 60, '#4a4458', 1.0 * life, 1.1);
      glow(g, fx, fy, 24, '#8a8070', 0.9 * life);
      g.fillStyle = '#fff6dc';
      g.fillRect(Math.round(fx), Math.round(fy), 2, 2);
      if (u < 1.3) { g.fillStyle = 'rgba(200,190,170,0.6)'; for (let k = 1; k < 8; k++) g.fillRect(Math.round(fx - k * 1.6), Math.round(fy + k * 4), 1, 2); }
      else { g.fillStyle = 'rgba(200,190,170,0.35)'; for (let k = 1; k < 6; k++) g.fillRect(Math.round(fx + Math.sin(u * 2 - k) * 2), Math.round(fy - k * 3), 1, 2); }
      // strážný za parapetem (hlava a ramena), okraj nasvícený světlicí
      if (sentry) { g.imageSmoothingEnabled = false; g.drawImage(sentry, 92, 168, 96, 96); }
      g.drawImage(L.parapet, 0, 0);
      // okraj pytlů a helmy nasvícený světlicí
      g.fillStyle = `rgba(200,190,170,${0.6 * life})`;
      for (let x = 0; x < W; x += 1) if ((x % 18) > 2 && (x % 18) < 16) g.fillRect(x, 242 - Math.round(Math.sin(((x % 18) / 18) * Math.PI) * 3), 1, 1);
      rain(g, t, 90, 0.3);
    },
    church(t) {
      // výbuch za kostelem (jednou, 0,9 s po začátku záběru): otřes obrazu, záblesk oblohy, ohnivá koule, kouř, trosky
      const u = t - 0.9;
      const shake = shakeOf(u);
      g.setTransform(1, 0, 0, 1, shake, Math.round(shake * 0.6));
      g.drawImage(L.church, 0, 0);
      const ex = 124, ey = 196;
      if (u > 0 && u < 0.6) { glow(g, ex, ey, 170, '#4a2e2c', 1.4 * (1 - u / 0.6), 1.3); glow(g, ex, ey, 110, '#7e3b2a', 1.2 * (1 - u / 0.6), 1.2); }
      // měsíc s korónou
      glow(g, 120, 78, 52, '#2a3150', 1.1);
      glow(g, 120, 78, 26, '#4c5470', 1);
      g.fillStyle = '#d8d2bc';
      for (let y = -11; y <= 11; y++) for (let x = -11; x <= 11; x++) if (x * x + y * y <= 121) g.fillRect(120 + x, 78 + y, 1, 1);
      g.fillStyle = '#b7b09a';
      for (const [x, y] of [[-4, -3], [3, 4], [5, -5], [-6, 5], [-1, 6], [6, 1]]) g.fillRect(120 + x, 78 + y, 2, 2);
      // mraky přes měsíc
      g.fillStyle = '#141a2c';
      for (const [x0, y, w, sp] of [[-40, 70, 80, 3], [60, 96, 70, 2], [20, 120, 100, 1.4]]) {
        const x = ((x0 + t * sp) % (W + 140)) - 60;
        g.fillRect(Math.round(x), y, w, 3); g.fillRect(Math.round(x + 8), y - 2, w - 22, 2);
      }
      // výbuch za kopcem a kostelem → kostel je proti ohni silueta; kouř a oheň zůstávají
      blast(g, ex, ey, u, 1);
      // kopec a kostel
      g.fillStyle = '#0b0a09';
      for (let x = 0; x < W; x++) g.fillRect(x, Math.round(236 - 16 * Math.exp(-(((x - 84) / 60) ** 2)) + 2 * Math.sin(x * 0.11)), 1, 100);
      if (churchSil) {
        const s = 0.42, w = churchSil.width * s, h = churchSil.height * s;
        g.imageSmoothingEnabled = false;
        g.drawImage(churchSil, Math.round(84 - w / 2), Math.round(232 - h * 0.86), Math.round(w), Math.round(h));
        // oheň v rozbitém okně
        const fl = 0.6 + 0.4 * Math.sin(t * 9) * Math.sin(t * 5.3);
        glow(g, 80, 214, 9, '#7e3b2a', fl);
        g.fillStyle = fl > 0.5 ? '#d98f3f' : '#a85a36';
        g.fillRect(80, 214, 2, 2);
      }
      // vrány
      for (let k = 0; k < 5; k++) crow(g, Math.round(((k * 47 + t * (14 + k * 3)) % (W + 40)) - 20), 150 + ((k * 23) % 40) + Math.round(Math.sin(t + k) * 4), t * 9 + k);
      g.fillStyle = '#070605';
      g.fillRect(0, 286, W, 40);
      stakeWire(g, 0, W, 300, 16, 26, '#070605', '#2a2a36');
      if (u > 0 && u < 0.5) { g.fillStyle = `rgba(255,220,160,${0.25 * (1 - u / 0.5)})`; g.fillRect(0, 0, W, H); } // záblesk přes celý obraz
      g.setTransform(1, 0, 0, 1, 0, 0);
    },
    aidpost(t) {
      // lucerna se houpe; světlo a obří stín zdravotníka na stěně se hýbou s ní
      g.fillStyle = '#141210';
      g.fillRect(0, 0, W, H);
      const ang = Math.sin(t * 1.2) * 0.07;
      const lx = 92 + Math.sin(ang) * 70, ly = 20 + Math.cos(ang) * 70;
      for (let x = 0; x < W; x += 12) { g.fillStyle = x % 24 ? '#1c1a17' : '#191714'; g.fillRect(x, 0, 11, 236); }
      glow(g, lx, ly + 20, 150, '#2b2722', 1.4, 1.2);
      glow(g, lx, ly + 20, 105, '#3d3730', 1.2, 1.2);
      glow(g, lx, ly + 20, 70, '#524a3f', 1.0, 1.1);
      glow(g, lx, ly + 10, 34, '#857a68', 0.9);
      g.fillStyle = '#0e0d0c';
      for (let x = 0; x < W; x += 12) g.fillRect(x, 0, 1, 236);
      g.fillRect(0, 60, W, 3);
      // obří stín zdravotníka na stěně (opačně od lucerny)
      // plachta s křížem
      g.fillStyle = '#a39782'; g.fillRect(14, 84, 32, 28);
      g.fillStyle = '#c4b8a0'; g.fillRect(14, 84, 32, 2);
      g.fillStyle = '#7e3b2a'; g.fillRect(27, 88, 6, 20); g.fillRect(20, 95, 20, 6);
      // podlaha
      g.fillStyle = '#0e0d0c'; g.fillRect(0, 236, W, 90);
      for (let y = 240; y < H; y += 7) { g.fillStyle = '#1a1714'; g.fillRect(0, y, W, 5); }
      glow(g, lx, 240, 90, '#2b2722', 0.9, 0.35);
      // polní lůžko (dřevo, plachtovina, nohy do X), nasvícené lucernou
      g.fillStyle = '#0b0a09'; g.fillRect(12, 214, 116, 3);
      g.fillStyle = '#6b6152'; g.fillRect(12, 211, 116, 4);
      g.fillStyle = '#857a68'; g.fillRect(12, 211, 116, 1);
      g.fillStyle = '#8c8a5c'; g.fillRect(16, 208, 108, 3); // plachtovina
      g.fillStyle = '#2b2722';
      for (const x of [18, 104]) for (let k = 0; k < 22; k++) { g.fillRect(x + k * 0.8, 217 + k, 2, 1); g.fillRect(x + 18 - k * 0.8, 217 + k, 2, 1); }
      g.fillStyle = '#c4b8a0'; g.fillRect(16, 203, 22, 6); g.fillStyle = '#e3d9c3'; g.fillRect(16, 203, 22, 1); // polštář
      // raněný: náš sprite padlého vojáka (3×), přikrytý dekou od pasu dolů
      g.imageSmoothingEnabled = false;
      if (woundedLit) g.drawImage(woundedLit, 6, 136, 96, 96);
      g.fillStyle = '#6b6152'; g.fillRect(58, 200, 66, 9);
      g.fillStyle = '#857a68'; g.fillRect(58, 200, 66, 2);
      g.fillStyle = '#524a3f'; for (const x of [72, 90, 108]) g.fillRect(x, 202, 1, 7);
      // zdravotník: náš Stretcher Bearer (3×), stojí u lůžka čelem k raněnému
      if (medicLit) g.drawImage(medicLit, 104, 146, 96, 96);
      // stín pod lůžkem a zdravotníkem
      g.fillStyle = 'rgba(14,13,12,0.6)'; g.fillRect(14, 239, 180, 3);
      // lucerna na drátu
      g.strokeStyle = '#0b0a09'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(92, 0); g.lineTo(lx, ly - 7); g.stroke();
      g.fillStyle = '#0b0a09'; g.fillRect(lx - 5, ly - 8, 10, 3);
      g.fillStyle = '#d98f3f'; g.fillRect(lx - 4, ly - 5, 8, 9);
      g.fillStyle = '#fff6dc'; g.fillRect(lx - 1, ly - 3, 3, 5);
      g.fillStyle = '#0b0a09'; g.fillRect(lx - 5, ly + 4, 10, 2); g.fillRect(lx - 4, ly - 5, 1, 9); g.fillRect(lx + 3, ly - 5, 1, 9);
    },
    letter(t) {
      // dopis při svíčce: bedna, papír, plamen se chvěje, řádky přibývají, pero se pohybuje
      g.fillStyle = '#0e0d0c'; g.fillRect(0, 0, W, H);
      const fl = Math.sin(t * 11) * 0.6 + Math.sin(t * 7.3) * 0.4;
      const cx = 140, cy = 150 + Math.round(fl * 0.6);
      glow(g, cx, cy, 150, '#1c1a17', 1.4, 1.1);
      glow(g, cx, cy, 100, '#2b2722', 1.2, 1.1);
      glow(g, cx, cy, 55, '#524a3f', 0.9);
      // deska bedny
      g.fillStyle = '#3d3730'; g.fillRect(0, 196, W, 124);
      for (let y = 200; y < H; y += 9) { g.fillStyle = '#2b2722'; g.fillRect(0, y, W, 1); }
      glow(g, cx, 196, 110, '#524a3f', 0.8, 0.5);
      // papír (lehce natočený): řádky textu přibývají
      g.save(); g.translate(56, 236); g.rotate(-0.06);
      g.fillStyle = '#c4b8a0'; g.fillRect(-46, -30, 92, 64);
      g.fillStyle = '#a39782'; g.fillRect(-46, 32, 92, 2);
      const lines = Math.min(7, Math.floor(t * 1.3) + 1);
      g.fillStyle = '#2a2118';
      for (let i = 0; i < lines; i++) {
        const w = i === lines - 1 ? Math.min(80, ((t * 1.3) % 1) * 80) : 64 + ((i * 13) % 16);
        for (let x = 0; x < w; x += 3) g.fillRect(-40 + x, -24 + i * 7, 2 + ((x * 7 + i) % 2), 1);
      }
      g.restore();
      // pero na konci rozepsaného řádku (bez ruky)
      const pi = Math.min(6, Math.floor(t * 1.3));
      const px = 16 + Math.min(80, ((t * 1.3) % 1) * 80) * 0.98, py = 212 + pi * 7 - px * 0.06 + 1;
      g.strokeStyle = '#1c1a17'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(px, py); g.lineTo(px + 14, py - 26); g.stroke();
      g.strokeStyle = '#a39782'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(px + 9, py - 16); g.lineTo(px + 14, py - 26); g.stroke();
      g.fillStyle = '#d98f3f'; g.fillRect(Math.round(px), Math.round(py) - 1, 1, 1); // odlesk hrotu
      // svíčka
      g.fillStyle = '#a39782'; g.fillRect(cx - 4, 172, 8, 26);
      g.fillStyle = '#c4b8a0'; g.fillRect(cx - 4, 172, 2, 26);
      g.fillStyle = '#857a68'; g.fillRect(cx - 5, 194, 10, 3);
      g.fillStyle = '#d98f3f'; g.fillRect(cx - 2, 162 + Math.round(fl), 4, 8);
      g.fillStyle = '#fff6dc'; g.fillRect(cx - 1, 165 + Math.round(fl), 2, 4);
      g.fillStyle = '#0e0d0c'; g.fillRect(cx, 170, 1, 2);
      // kouř ze svíčky
      g.fillStyle = 'rgba(163,151,130,0.25)';
      for (let k = 1; k < 10; k++) g.fillRect(Math.round(cx + Math.sin(t * 2 + k * 0.7) * k * 0.6), 160 - k * 6, 1, 3);
    },
    grim(t) {
      const sh = BOOMS.reduce((m, [t0, , , k]) => (Math.abs(shakeOf(t - t0, k)) > Math.abs(m) ? shakeOf(t - t0, k) : m), 0);
      g.setTransform(1, 0, 0, 1, sh, Math.round(sh * 0.6));
      g.drawImage(L.grim, 0, 0);
      // krvavé slunce za kouřem
      glow(g, 120, 150, 70, '#8a3c26', 0.9);
      g.fillStyle = '#a85a36';
      for (let y = -10; y <= 10; y++) for (let x = -10; x <= 10; x++) if (x * x + y * y <= 100) g.fillRect(120 + x, 150 + y, 1, 1);
      g.fillStyle = '#2e211d';
      for (const [x0, y, w, sp] of [[-30, 146, 90, 4], [40, 156, 120, 2.5], [0, 132, 70, 3]]) g.fillRect(Math.round(((x0 + t * sp) % (W + 120)) - 60), y, w, 3);
      // obzor, zbytky stromů
      g.fillStyle = '#120e0c';
      for (let x = 0; x < W; x++) g.fillRect(x, Math.round(220 + 3 * Math.sin(x * 0.07) + 2 * Math.sin(x * 0.23)), 1, 100);
      for (const [tx, h] of [[44, 26], [118, 18], [168, 30]]) { g.fillRect(tx, 220 - h, 2, h); g.fillRect(tx - 4, 220 - h + 6, 4, 1); g.fillRect(tx + 2, 220 - h + 10, 5, 1); }
      // výbuchy (za obzorem)
      for (const [t0, x, y, k] of BOOMS) blast(g, x, y, t - t0, k, GRIM_SMOKE, 24);
      if (BOOMS.some(([t0]) => t - t0 > 0 && t - t0 < 0.12)) { g.fillStyle = 'rgba(255,200,140,0.22)'; g.fillRect(-4, -4, W + 8, H + 8); }
      // popředí: rozbitá zem, drát, naši vojáci Concordu nasvícení požáry
      g.fillStyle = '#0b0908';
      g.fillRect(-4, 262, W + 8, 70);
      for (const [cx, w] of [[30, 26], [140, 34]]) { g.beginPath(); g.ellipse(cx, 268, w, 6, 0, Math.PI, 0); g.fillStyle = '#1a1210'; g.fill(); }
      g.imageSmoothingEnabled = false;
      if (grimC) g.drawImage(grimC, 118, 204, 72, 72);
      if (grimB) g.drawImage(grimB, 66, 196, 90, 90);
      if (grimA) g.drawImage(grimA, 0, 186, 108, 108);
      stakeWire(g, -6, W + 6, 296, 34, 38, '#0b0908', '#6e2e22');
      // padající hlína a popel
      for (let k = 0; k < 70; k++) {
        const p = (k * 0.6180339) % 1, q = (k * 0.7548776) % 1;
        const y = ((q * 340 + t * (60 + (k % 5) * 25)) % 340) - 10, x = ((p * 200 + Math.sin(t + k) * 6) % 200) - 10;
        g.fillStyle = k % 4 ? 'rgba(120,100,90,0.55)' : '#2e211d';
        g.fillRect(Math.round(x), Math.round(y), k % 4 ? 1 : 2, k % 4 ? 1 : 2);
      }
      g.setTransform(1, 0, 0, 1, 0, 0);
    },
    dawnwire(t) {
      g.drawImage(L.dawn, 0, 0);
      // slunce těsně nad obzorem
      glow(g, 52, 206, 90, '#f2c27a', 0.9);
      g.fillStyle = '#f4cf86';
      for (let y = -12; y <= 12; y++) for (let x = -12; x <= 12; x++) if (x * x + y * y <= 144 && 206 + y < 214) g.fillRect(52 + x, 206 + y, 1, 1);
      // pásy mlhy
      for (let k = 0; k < 5; k++) {
        g.fillStyle = k % 2 ? 'rgba(242,194,122,0.18)' : 'rgba(200,150,140,0.14)';
        g.fillRect(Math.round(((t * (6 + k * 2) + k * 40) % 60) - 60), 214 + k * 9, W + 60, 4);
      }
      // popředí: velké kůly s drátem, vrány vzlétají
      g.fillStyle = '#120e0c';
      g.fillRect(0, 268, W, 60);
      // naši vojáci (skutečné sprity, 3×) hledí do úsvitu; zadní řada menší
      g.imageSmoothingEnabled = false;
      if (dawnC) g.drawImage(dawnC, 120, 214, 64, 64);
      if (dawnB) g.drawImage(dawnB, 84 + Math.round(Math.sin(t * 0.8)), 196, 96, 96);
      if (dawnA) g.drawImage(dawnA, 4, 188, 108, 108);
      // protisvětlo: teplý lem na okrajích postav dělá slunce, drát jde přes ně
      stakeWire(g, -6, W + 6, 292, 44, 46, '#120e0c', '#7e4a32');
      stakeWire(g, 17, W + 6, 293, 30, 46, '#120e0c', null);
      for (let k = 0; k < 4; k++) {
        const t0 = 0.6 + k * 0.35, u = Math.max(0, t - t0);
        const x = 40 + k * 46 + u * (18 + k * 4), y = 247 - u * (26 + k * 6) + Math.sin(u * 3) * 3;
        if (u === 0) { g.fillStyle = '#120e0c'; g.fillRect(40 + k * 46, 247, 3, 2); } else crow(g, Math.round(x), Math.round(y), t * 10 + k, '#120e0c');
      }
    },
  };
  return {
    canvas,
    draw(name, t) {
      g.imageSmoothingEnabled = false;
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = 1;
      (scenes[name] || scenes.flare)(Math.max(0, t));
    },
  };
}

export const CINEMA_CSS = `#rd-cine2 { inset: 0; width: 100%; height: 100%; image-rendering: pixelated; }`;
