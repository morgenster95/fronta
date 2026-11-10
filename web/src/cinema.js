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

export const SCENES = ['flare', 'church', 'aidpost', 'letter', 'dawnwire'];
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

export function makeScenes(tex) {
  const canvas = off(W, H);
  canvas.id = 'rd-cine2';
  const g = canvas.getContext('2d');
  const L = {}; // statické vrstvy
  const sentry = silhouette(tex.hegemony?.north || tex.concord?.north, '#0b0a09');
  const medic = silhouette(tex.hegemony_medic?.east || tex.concord_medic?.east, '#140f0c');
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
      g.drawImage(L.church, 0, 0);
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
    },
    aidpost(t) {
      // lucerna se houpe; světlo a obří stín zdravotníka na stěně se hýbou s ní
      g.fillStyle = '#141210';
      g.fillRect(0, 0, W, H);
      const ang = Math.sin(t * 1.5) * 0.22;
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
      if (medic) { g.globalAlpha = 0.5; g.imageSmoothingEnabled = false; g.drawImage(medic, 40 + (92 - lx) * 1.4, 40, 150, 150); g.globalAlpha = 1; }
      // plachta s křížem
      g.fillStyle = '#a39782'; g.fillRect(14, 84, 32, 28);
      g.fillStyle = '#c4b8a0'; g.fillRect(14, 84, 32, 2);
      g.fillStyle = '#7e3b2a'; g.fillRect(27, 88, 6, 20); g.fillRect(20, 95, 20, 6);
      // podlaha
      g.fillStyle = '#0e0d0c'; g.fillRect(0, 236, W, 90);
      for (let y = 240; y < H; y += 7) { g.fillStyle = '#1a1714'; g.fillRect(0, y, W, 5); }
      glow(g, lx, 240, 90, '#2b2722', 0.9, 0.35);
      // lůžko a raněný (silueta, okraj nasvícený)
      g.fillStyle = '#0b0a09';
      g.fillRect(16, 222, 130, 8);
      for (const x of [22, 136]) { g.fillRect(x, 230, 4, 26); }
      g.beginPath(); g.ellipse(30, 214, 10, 8, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.ellipse(84, 216, 56, 9, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#e3d9c3'; g.fillRect(22, 207, 13, 3);
      g.fillStyle = '#7e3b2a'; g.fillRect(29, 207, 3, 2);
      g.fillStyle = '#857a68';
      for (let x = 30; x < 140; x++) { const y = 216 - Math.round(9 * Math.sqrt(Math.max(0, 1 - ((x - 84) / 56) ** 2))); g.fillRect(x, y, 1, 1); }
      // zdravotník se sklání nad raněným (3×)
      if (medic) { g.drawImage(medic, 108, 128, 96, 96); }
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
      // ruka s perem na konci řádku
      const pi = Math.min(6, Math.floor(t * 1.3));
      const px = 16 + Math.min(80, ((t * 1.3) % 1) * 80) * 0.98, py = 212 + pi * 7 - px * 0.06 + 6;
      g.fillStyle = '#0b0a09';
      g.fillRect(px - 2, py - 18, 3, 18); // pero
      g.beginPath(); g.ellipse(px + 6, py - 4, 9, 5, -0.4, 0, Math.PI * 2); g.fill(); // ruka
      g.fillRect(px + 10, py - 8, 40, 9); // rukáv
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
