// Reel „Day 1“ (/?reel=day1&vacant=700, jen vývojový server): co se stalo první den, závod o Verdel Ridge, Trench Gazette.
// Hlas: python marketing/story_vo.py day1 (časy vět v day1.vo.json), zvuk: python marketing/reel_audio.py day1.
// Kromě záběrů ze hry má dva filmové záběry kreslené zvlášť (noční hřeben se siluetami, úsvit) v mřížce 180×320.
import vo from '../../marketing/reels/day1.vo.json';
import { paperTexture, tornClip } from './paper.js';

const SECONDS = vo.seconds;
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const win = (t, a, b, f = 0.3) => clamp01(Math.min((t - a) / f, (b - t) / f));
const typed = (text, t, a, cps = 28) => text.slice(0, Math.max(0, Math.floor((t - a) * cps)));

// čísla a jména ze dne 1 (stejná jako v hlasu)
const COUNT = [18, 14];
const NEED = 100;
const FEATURED = [
  ['masis_xiii', 'Machine Gunner', 15.6, 18.5],
  ['yee.zle', 'Sapper', 19.3, 21.5],
  ['knightowlvt', 'Field Cook', 21.9, 24.0],
];
const ARTICLE = [
  'Day one of the war. Nobody on either side quite believed it would start, and then the guns opened at dawn and everybody believed it. Twenty-three more volunteers came up the line before nightfall.',
  'The Hegemony holds the centre of Verdel Ridge with fifteen rifles. The Concord holds the low ground opposite with thirteen and says it prefers it that way. @masis_xiii has the only machine gun in the sector. The Concord has a sapper (@yee.zle) and a cook (@knightowlvt), which may matter more than it sounds.',
];

const CSS = `
#rd { position: fixed; inset: 0; pointer-events: none; z-index: 40; font-family: 'VT323', monospace; color: #e3d9c3; }
#rd > * { position: absolute; opacity: 0; }
#rd .sil { font-family: 'Silkscreen', monospace; letter-spacing: 0.04em; }
#rd .k { color: #d98f3f; font-family: 'Silkscreen', monospace; font-size: 12px; display: block; }
#rd .m { color: #a39782; }
#rd .panel { left: 7%; right: 7%; background: rgba(28, 26, 23, 0.95); border: 2px solid #524a3f; padding: 12px 14px; font-size: 21px; }
#rd-cine { inset: 0; width: 100%; height: 100%; image-rendering: pixelated; }
#rd-black { inset: 0; background: #0e0d0c; }
#rd-dim { inset: 0; background: radial-gradient(ellipse at 50% 50%, rgba(14,13,12,0.55), rgba(8,7,6,0.92)); }
#rd-day { left: 0; right: 0; top: 30%; text-align: center; }
#rd-day .big { font-family: 'Silkscreen', monospace; font-size: 86px; letter-spacing: 0.08em; text-shadow: 5px 5px 0 #0e0d0c; min-height: 100px; }
#rd-day .sub { font-size: 30px; color: #c9b99a; letter-spacing: 0.08em; text-shadow: 2px 2px 0 #0e0d0c; min-height: 34px; }
#rd-sub { left: 6%; right: 6%; top: 10.5%; text-align: center; }
#rd-sub span { font-size: 31px; line-height: 1.12; background: rgba(14, 13, 12, 0.72); padding: 2px 10px; box-decoration-break: clone; -webkit-box-decoration-break: clone; text-shadow: 2px 2px 0 #0e0d0c; }
#rd-big { left: 0; right: 0; top: 36%; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; }
#rd-big span { font-family: 'Silkscreen', monospace; font-size: 40px; letter-spacing: 0.04em; line-height: 1.05; background: rgba(14, 13, 12, 0.8); padding: 6px 14px; text-shadow: 3px 3px 0 #0e0d0c; }
#rd-big.cta span { background: rgba(126, 59, 42, 0.94); }
#rd-big.logo span { background: none; font-size: 64px; text-shadow: 4px 4px 0 #0e0d0c; }
#rd-big.logo span + span { font-family: 'VT323', monospace; font-size: 30px; color: #c9b99a; }
#rd-big.quote span { background: rgba(14, 13, 12, 0.92); font-size: 32px; text-shadow: 3px 3px 0 #0e0d0c; }
#rd-big i { font-family: 'VT323', monospace; font-style: normal; font-size: 1.3em; }
#rd-split { left: 7%; right: 7%; top: 60%; }
#rd-split .row { display: flex; justify-content: space-between; font-family: 'Silkscreen', monospace; font-size: 26px; text-shadow: 3px 3px 0 #0e0d0c; }
#rd-split .row b { font-weight: 400; font-size: 54px; line-height: 1; }
#rd-split .bar { display: flex; height: 18px; border: 2px solid #0e0d0c; margin-top: 8px; }
.rd-tag { transform: translate(-50%, -100%); font-family: 'Silkscreen', monospace; font-size: 15px; background: rgba(14, 13, 12, 0.9); border-bottom: 3px solid #d98f3f; padding: 4px 8px; white-space: nowrap; text-align: center; }
.rd-tag span { display: block; font-family: 'VT323', monospace; font-size: 18px; color: #c9b99a; }
#rd-race { bottom: 19%; }
#rd-race .title { font-family: 'Silkscreen', monospace; font-size: 24px; line-height: 1.1; margin: 2px 0 10px; }
#rd-race .r { display: grid; grid-template-columns: 112px 1fr 72px; gap: 8px; align-items: center; margin: 6px 0; font-size: 22px; }
#rd-race .bar { height: 16px; background: #2b2722; border: 1px solid #524a3f; }
#rd-race .bar i { display: block; height: 100%; }
#rd-race .goal { font-size: 20px; color: #a39782; margin-top: 4px; }
#rd-race ul { list-style: none; margin: 10px 0 0; padding: 0; display: grid; gap: 4px; }
#rd-race li { font-size: 22px; opacity: 0; border-left: 3px solid #d98f3f; padding-left: 8px; }
#rd-hero { left: 0; right: 0; bottom: 21%; text-align: center; }
#rd-hero .star { font-size: 54px; color: #d98f3f; text-shadow: 3px 3px 0 #0e0d0c; line-height: 1; }
#rd-hero .sil { font-size: 26px; background: rgba(14, 13, 12, 0.85); padding: 4px 12px; }
#rd-paper { left: 6%; right: 6%; top: 13%; bottom: 7%; overflow: hidden; transform-origin: 50% 40%; filter: drop-shadow(0 6px 0 rgba(0,0,0,0.5)) drop-shadow(0 14px 22px rgba(0,0,0,0.6)); }
#rd-paper .paper { --ink: #2a2118; --ink-soft: #5b4a35; --red: #7a2a1c; padding: 18px 16px 24px; color: var(--ink); background-size: 288px 288px; image-rendering: pixelated; }
#rd-paper .mast { text-align: center; border-bottom: 3px double var(--ink); padding-bottom: 6px; margin-bottom: 8px; }
#rd-paper .mast-top { display: flex; justify-content: space-between; font-family: 'Silkscreen', monospace; font-size: 10px; color: var(--ink-soft); border-top: 2px solid var(--ink); border-bottom: 1px solid var(--ink); padding: 2px 0; text-transform: uppercase; }
#rd-paper .mast-name { font-family: 'Silkscreen', monospace; font-size: 34px; letter-spacing: 1px; line-height: 1.1; margin: 6px 0 2px; text-transform: uppercase; }
#rd-paper .mast-sub { font-size: 16px; color: var(--ink-soft); font-style: italic; }
#rd-paper .headline { font-family: 'Silkscreen', monospace; font-size: 26px; line-height: 1.15; text-align: center; text-transform: uppercase; margin: 6px 0 12px; }
#rd-paper p { font-size: 20px; line-height: 1.25; margin: 0 0 10px; }
#rd-paper p:first-of-type::first-letter { font-family: 'Silkscreen', monospace; font-size: 2.3em; float: left; line-height: 0.9; margin: 2px 5px 0 0; }
#rd-paper h5 { font-family: 'Silkscreen', monospace; font-weight: 400; font-size: 12px; border-bottom: 1px solid var(--ink); margin: 12px 0 4px; padding-bottom: 2px; }
#rd-paper .name { color: var(--red); background-image: linear-gradient(var(--red), var(--red)); background-repeat: no-repeat; background-position: 0 100%; background-size: var(--u, 0%) 2px; }
#rd-paper .notice { border: 2px solid var(--ink); padding: 6px 8px; font-size: 18px; margin-top: 10px; }
#rd-paper .roll { font-size: 18px; line-height: 1.3; }
#rd-every { left: 0; right: 0; bottom: 2.5%; text-align: center; }
#rd-every span { font-family: 'Silkscreen', monospace; font-size: 18px; color: #d98f3f; background: rgba(14, 13, 12, 0.85); padding: 4px 10px; }
#rd-mini { left: 12%; right: 12%; top: 60%; }
`;

// --- filmový záběr: hřeben v noci / za úsvitu, kreslený v mřížce 180×320 ---
const CW = 180, CH = 320;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const lerpC = (a, b, u) => a.map((v, i) => Math.round(v + (b[i] - v) * u));
const hills = (x) => 208 + 5 * Math.sin(x * 0.031) + 3 * Math.sin(x * 0.113 + 2) + 2 * Math.sin(x * 0.27);
const ridge = (x) => 224 - 9 * Math.sin(x * 0.011 + 1.2) - 3 * Math.sin(x * 0.063) - 1.5 * Math.sin(x * 0.21);

function makeCinema(tex, anims) {
  const canvas = document.createElement('canvas');
  canvas.id = 'rd-cine';
  canvas.width = CW;
  canvas.height = CH;
  const g = canvas.getContext('2d');
  const off = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  // siluety pochodujících vojáků (snímky chůze z PixelLabu, vybarvené do černa)
  const sil = (list, col) => list.filter(Boolean).map((tx) => {
    const f = tx.frame, src = tx.source?.resource;
    const o = off(f.width, f.height), og = o.getContext('2d');
    if (src) og.drawImage(src, f.x, f.y, f.width, f.height, 0, 0, f.width, f.height);
    og.globalCompositeOperation = 'source-in';
    og.fillStyle = col;
    og.fillRect(0, 0, f.width, f.height);
    return o;
  });
  const walk = {
    night: sil(anims.hegemony?.walk?.east ?? [tex.hegemony?.east], '#0b0a09'),
    dawn: sil(anims.concord?.walk?.east ?? [tex.concord?.east], '#120e0c'),
  };

  // statické vrstvy pro každou náladu
  const MOODS = {
    night: { sky: ['#070a14', '#10162a', '#1d1e33', '#4a2a2c', '#8a4a28'], hill: '#2b2638', ridge: '#0b0a09', fg: '#070605', cloud: '#141826', rain: true },
    dawn: { sky: ['#1f2742', '#4b4560', '#8a5a5c', '#c87a52', '#e8a85c'], hill: '#6a4a52', ridge: '#120e0c', fg: '#0a0807', cloud: '#5a4458', rain: false },
  };
  const layers = {};
  for (const [name, m] of Object.entries(MOODS)) {
    const sky = off(CW, 216), sg = sky.getContext('2d');
    const stops = m.sky.map(hex);
    for (let y = 0; y < 216; y++) for (let x = 0; x < CW; x++) {
      const v = (y / 215) * (stops.length - 1) + (BAYER[(y % 4) * 4 + (x % 4)] / 16 - 0.5) * 0.35;
      const i = Math.max(0, Math.min(stops.length - 2, Math.floor(v)));
      const c = lerpC(stops[i], stops[i + 1], clamp01(Math.round((v - i) * 4) / 4));
      sg.fillStyle = `rgb(${c})`;
      sg.fillRect(x, y, 1, 1);
    }
    if (name === 'night') {
      let s = 7;
      const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      for (let k = 0; k < 70; k++) { sg.fillStyle = r() < 0.2 ? '#d9d4c4' : '#7d7f8c'; sg.fillRect(Math.floor(r() * CW), Math.floor(r() * 150), 1, 1); }
    }
    // vzdálené kopce (šířka 400 pro paralaxu)
    const hl = off(400, CH), hg = hl.getContext('2d');
    hg.fillStyle = m.hill;
    for (let x = 0; x < 400; x++) hg.fillRect(x, Math.round(hills(x)), 1, CH);
    // hřeben: kůly s dráty, kříže, mrtvý strom (šířka 520)
    const rl = off(520, CH), rg = rl.getContext('2d');
    rg.fillStyle = m.ridge;
    for (let x = 0; x < 520; x++) rg.fillRect(x, Math.round(ridge(x)), 1, CH);
    for (let x = 14; x < 520; x += 27) {
      const y = Math.round(ridge(x));
      rg.fillRect(x, y - 9, 1, 9);
      for (let k = 1; k < 27 && x + k < 520; k += 2) rg.fillRect(x + k, Math.round(ridge(x + k)) - 7 + Math.round(Math.sin((k / 27) * Math.PI) * 2), 1, 1);
    }
    for (const x of [96, 104, 300, 309, 316]) { const y = Math.round(ridge(x)); rg.fillRect(x, y - 8, 1, 8); rg.fillRect(x - 2, y - 6, 5, 1); }
    const tx = 205, ty = Math.round(ridge(tx));
    rg.fillRect(tx, ty - 26, 2, 26);
    for (const [dx, dy, len, dir] of [[1, -20, 9, 1], [0, -16, 7, -1], [1, -24, 5, 1], [0, -11, 6, -1]]) for (let k = 0; k < len; k++) rg.fillRect(tx + dx + k * dir, ty + dy - Math.floor(k / 2), 1, 1);
    // popředí: svitek ostnatého drátu a pytle (šířka 360)
    const fl = off(360, CH), fg = fl.getContext('2d');
    fg.fillStyle = m.fg;
    for (let x = 0; x < 360; x++) fg.fillRect(x, 298 + Math.round(2 * Math.sin(x * 0.05)), 1, 30);
    fg.fillStyle = name === 'night' ? '#2a2420' : '#5a3a2c'; // drát zachytí světlo
    for (let cx = 6; cx < 360; cx += 11) for (let a = 0; a < Math.PI * 2; a += 0.22) fg.fillRect(Math.round(cx + Math.cos(a) * 7), Math.round(292 + Math.sin(a) * 7), 1, 1);
    fg.fillStyle = m.fg;
    for (let i = 0; i < 4; i++) fg.fillRect(250 + i * 9, 286 - (i % 2) * 2, 9, 10);
    layers[name] = { sky, hl, rl, fl, m };
  }

  // dynamika: světlice, záblesky na obzoru, mraky, déšť, vojáci
  function draw(t, mood, { flares = [], flashes = [], pan = 0, march = 6 } = {}) {
    const L = layers[mood], m = L.m;
    g.globalCompositeOperation = 'source-over';
    g.drawImage(L.sky, 0, 0);
    // měsíc / slunce
    if (mood === 'night') {
      const glow = g.createRadialGradient(132, 54, 2, 132, 54, 40);
      glow.addColorStop(0, 'rgba(220,214,190,0.25)');
      glow.addColorStop(1, 'rgba(220,214,190,0)');
      g.fillStyle = glow;
      g.fillRect(80, 10, 110, 90);
      g.fillStyle = '#d8d2bc';
      for (let y = -9; y <= 9; y++) for (let x = -9; x <= 9; x++) if (x * x + y * y <= 81) g.fillRect(132 + x, 54 + y, 1, 1);
      g.fillStyle = '#b7b09a';
      for (const [x, y] of [[-3, -2], [2, 3], [4, -4], [-5, 4], [-1, 5]]) g.fillRect(132 + x, 54 + y, 2, 2);
    } else {
      const sy = 214 - Math.min(18, t * 1.6);
      const glow = g.createRadialGradient(46, sy, 4, 46, sy, 90);
      glow.addColorStop(0, 'rgba(255,200,120,0.55)');
      glow.addColorStop(1, 'rgba(255,200,120,0)');
      g.fillStyle = glow;
      g.fillRect(0, 100, CW, 140);
      g.fillStyle = '#f4cf86';
      for (let y = -13; y <= 13; y++) for (let x = -13; x <= 13; x++) if (x * x + y * y <= 169) g.fillRect(46 + x, Math.round(sy) + y, 1, 1);
    }
    // mraky
    g.fillStyle = m.cloud;
    for (const [x0, y, w, sp] of [[10, 70, 60, 2.2], [120, 96, 80, 1.4], [60, 128, 70, 3], [150, 40, 50, 1.8], [-40, 150, 90, 2.6]]) {
      const x = ((x0 + t * sp - pan * 0.1) % (CW + 120)) - 60;
      g.fillRect(Math.round(x), y, w, 3);
      g.fillRect(Math.round(x + 6), y - 2, w - 18, 2);
      g.fillRect(Math.round(x + 14), y - 4, w - 36, 2);
    }
    // záblesky dělostřelectva za kopci (před kopci → kopce zůstanou siluetou)
    g.globalCompositeOperation = 'lighter';
    for (const [t0, x] of flashes) {
      if (t < t0) continue;
      const f = Math.exp(-(t - t0) * 4.5);
      if (f < 0.02) continue;
      const gr = g.createRadialGradient(x, 210, 1, x, 210, 70);
      gr.addColorStop(0, `rgba(255,190,110,${0.75 * f})`);
      gr.addColorStop(1, 'rgba(255,190,110,0)');
      g.fillStyle = gr;
      g.fillRect(x - 70, 140, 140, 80);
    }
    g.globalCompositeOperation = 'source-over';
    g.imageSmoothingEnabled = false;
    g.drawImage(L.hl, -Math.round(pan * 0.25) % 220, 0);
    g.drawImage(L.rl, -Math.round(pan * 0.6), 0);
    // vojáci na hřebeni (souřadnice vrstvy hřebene)
    const frames = walk[mood];
    if (frames.length) {
      for (let i = 0; i < march; i++) {
        const x = 6 + i * 19 + t * 6;
        const f = frames[(((Math.floor(t * 7) + i * 2) % frames.length) + frames.length) % frames.length];
        // siluety proti zářícímu obzoru
        const sx = Math.round(x - pan * 0.6 - f.width / 2);
        if (sx < -40 || sx > CW + 10) continue;
        g.drawImage(f, sx, Math.round(ridge(x)) - f.height + 3);
      }
    }
    // světlice: vystoupá, pak pomalu klesá a kývá se; osvětlí okolí
    for (const [t0, x0] of flares) {
      const u = t - t0;
      if (u < 0 || u > 7) continue;
      const fx = x0 + (u < 1.2 ? u * 6 : 7 + Math.sin(u * 2) * 3) - pan * 0.6;
      const fy = u < 1.2 ? 250 - (ease(u / 1.2) * 170) : 80 + (u - 1.2) * 9;
      const life = u < 1.2 ? 0.5 : clamp01((7 - u) / 1.5);
      g.globalCompositeOperation = 'lighter';
      const gr = g.createRadialGradient(fx, fy, 1, fx, fy, 85);
      gr.addColorStop(0, `rgba(255,238,200,${0.42 * life})`);
      gr.addColorStop(1, 'rgba(255,238,200,0)');
      g.fillStyle = gr;
      g.fillRect(fx - 85, fy - 85, 170, 170);
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = '#fff6dc';
      g.fillRect(Math.round(fx), Math.round(fy), 2, 2);
      if (u < 1.2) { g.fillStyle = 'rgba(200,190,170,0.5)'; for (let k = 1; k < 6; k++) g.fillRect(Math.round(fx - k * 1.2), Math.round(fy + k * 4), 1, 2); }
    }
    g.drawImage(L.fl, -Math.round(pan * 1.1) % 180, 0);
    if (m.rain) {
      g.fillStyle = 'rgba(170,180,195,0.35)';
      for (let k = 0; k < 70; k++) {
        const a = (k * 0.6180339) % 1, b = (k * 0.7548776) % 1;
        const y = ((b * 340 + t * 240) % 340) - 10;
        const x = ((a * 230 - y * 0.25) % 230 + 230) % 230 - 20;
        g.fillRect(Math.round(x), Math.round(y), 1, 4);
      }
    } else {
      // ranní mlha v údolí
      g.fillStyle = 'rgba(230,190,160,0.08)';
      for (let k = 0; k < 4; k++) g.fillRect(0, 222 + k * 7 + Math.round(Math.sin(t * 0.5 + k) * 2), CW, 5);
    }
  }
  return { canvas, draw };
}

export function startDay1Reel({ cam, life, map, theme, soldiers, tex, anims }) {
  const T = map.tile;
  const front = (f) => soldiers.filter((s) => s.faction === f && s.slot?.line === 'front').sort((a, b) => a.x - b.x);
  const hs = front(0), cs = front(1);
  const hx = hs[Math.floor(hs.length / 2)].x, hy = hs[Math.floor(hs.length / 2)].y;
  const cx = cs[Math.floor(cs.length / 2)].x, cy = cs[Math.floor(cs.length / 2)].y;
  const mid = ((map.front[0] + map.front[1]) / 2) * T + 16;
  const byHandle = (h) => soldiers.find((s) => s.handle === h);
  const feat = FEATURED.map(([h, role, a, b]) => ({ s: byHandle(h) ?? hs[0], h, role, a, b }));
  // „hrdina kóty“: volné stanoviště Hegemonie u středu (může to být kdokoli, kdo se přidá)
  const hero = hs.filter((s) => s.vacant && Math.abs(s.x - hx) < 300).sort((a, b) => Math.abs(a.x - hx) - Math.abs(b.x - hx))[0] ?? hs[0];
  const at = (s, z, frac = 0.06) => [s.x, s.y - 14 + (frac * 960) / z, z];

  const [A, B, C] = feat.map((f) => f.s);
  const K = [
    [0, hx - 200, mid, 1.3],
    [10.6, hx - 200, mid, 1.3],
    [15.0, hx + 100, mid - 20, 1.5],
    [15.8, ...at(A, 3.8)],
    [18.6, A.x + 18, at(A, 3.9)[1], 3.9],
    [19.4, ...at(B, 3.8)],
    [21.4, B.x + 10, at(B, 3.8)[1], 3.8],
    [22.0, ...at(C, 3.8)],
    [24.0, C.x + 12, at(C, 4.0)[1], 4.0],
    [25.6, hx - 120, mid - 40, 1.25],
    [33.0, hx + 160, mid - 60, 1.15],
    [34.0, cx - 40, cy - 10 + 60, 2.6],
    [38.6, cx + 50, cy - 10 + 60, 2.8],
    [39.4, ...at(hero, 4.4, 0.02)],
    [41.8, hero.x, at(hero, 4.8, 0.02)[1], 4.8],
    [43.0, hx, mid, 1.6],
    [SECONDS, hx + 300, mid, 1.4],
  ];
  function camAt(t) {
    let i = 0;
    while (i < K.length - 2 && t > K[i + 1][0]) i++;
    const [t0, x0, y0, z0] = K[i], [t1, x1, y1, z1] = K[i + 1];
    const u = ease(clamp01((t - t0) / (t1 - t0)));
    return [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, z0 + (z1 - z0) * u];
  }

  const BIG = [
    [28.6, 29.1, '', ''],
    [52.6, 55.0, 'IF YOUR NAME IS IN IT,\nYOU WERE THERE.', 'quote'],
    [55.4, 58.0, 'EVERY FRIEND\nIS ONE MORE RIFLE', 'cta'],
    [58.1, 60.5, 'COMMENT\nCONCORD  or  HEGEMONY', 'cta'],
    [60.6, SECONDS, 'MUD <i>&amp;</i> IRON\n@mudandiron · link in bio', 'logo'],
  ].filter((b) => b[2]);
  const SUB = [];
  for (const [t0, dur, text] of vo.lines) {
    const parts = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g).map((p) => p.trim().replace(/\.\.\.$/, '…'));
    const chunks = [];
    for (const p of parts) {
      if (chunks.length && (chunks.at(-1).length < 14 || p.length < 12) && chunks.at(-1).length + p.length < 48) chunks[chunks.length - 1] += ' ' + p;
      else chunks.push(p);
    }
    const total = chunks.reduce((a, c) => a + c.length, 0);
    let s0 = t0;
    for (const c of chunks) {
      const d = (dur * c.length) / total;
      SUB.push([s0 - 0.05, s0 + d + 0.25, c]);
      s0 += d;
    }
  }

  // filmové záběry: noc (0–10.6) a úsvit (54.8–konec)
  const NIGHT = { flares: [[1.6, 40], [5.4, 120], [8.6, 70]], flashes: [[0.6, 30], [2.6, 150], [4.2, 90], [6.6, 20], [7.8, 160], [9.6, 110]], march: 9 };
  const DAWN = { flares: [], flashes: [[55.4, 140], [58.0, 30], [60.4, 100]], march: 10 };

  const EV = [
    [12.0, 'shoot', 0], [13.0, 'shoot', 1], [14.0, 'shoot', 0], [16.4, 'shootAt', A], [17.6, 'shootAt', A],
    [19.8, 'shell', B.x + 60, B.y - 50, false], [22.4, 'shell', C.x - 70, C.y + 40, false],
    [26.0, 'flare', hx - 60, mid], [28.0, 'shell', hx + 40, mid + 20, false], [30.6, 'flare', hx + 120, mid - 30], [32.2, 'shell', hx + 160, mid, true],
    [33.8, 'barrage', 1], [34.0, 'shell', cx, cy, true], [35.0, 'shell', cx + 70, cy + 20, true], [36.3, 'shell', cx - 40, cy + 10, true],
    [37.4, 'shell', cx + 30, cy - 10, true], [38.6, 'barrage', null],
    [40.2, 'shoot', 0], [41.0, 'shoot', 0],
  ];
  const SFX = [];
  for (const e of EV) {
    if (e[1] === 'shell') SFX.push([e[0], 'shell', e[4] ? 1 : 0]);
    if (e[1] === 'shoot' || e[1] === 'shootAt') SFX.push([e[0] + 0.62, 'shoot', 0]);
  }
  for (const [t0] of NIGHT.flashes) SFX.push([t0 + 0.25, 'shell', 0]);
  for (const [t0] of DAWN.flashes) SFX.push([t0 + 0.25, 'shell', 0]);
  SFX.push([0.9, 'type', 0.5], [3.2, 'type', 1.1], [11.0, 'reveal', 0], [24.4, 'whistle', 0], [29.4, 'tick', 2.6], [33.6, 'barrage', 4.8],
    [39.2, 'medal', 0], [42.2, 'type', 0.9], [43.6, 'stamp', 0], [52.6, 'bell', 0], [55.4, 'drum', 0], [58.1, 'drum', 0], [60.6, 'end', 0]);

  // --- DOM ---
  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  const name = (h) => `<span class="name">@${h}</span>`;
  const linkify = (t) => t.replace(/@([a-z0-9._]+[a-z0-9_])/gi, (m, h) => name(h));
  const recruits = soldiers.filter((s) => s.handle && !s.vacant).map((s) => s.handle);
  root.innerHTML = `
    <div id="rd-dim"></div>
    <div id="rd-every"><span>EVERY MORNING · 13:00 UTC</span></div>
    <div id="rd-paper"><article class="paper" style="background-image:url(${paperTexture(3)});clip-path:${tornClip(3)}">
      <header class="mast"><div class="mast-top"><span>Day 1</span><span>🌧 Rain</span><span>Price: one cigarette</span></div>
      <div class="mast-name">The Trench Gazette</div><div class="mast-sub">Printed in a dugout behind Verdel Ridge · by field telegraph</div></header>
      <h4 class="headline">The first morning</h4>
      ${ARTICLE.map((p) => `<p>${linkify(p)}</p>`).join('')}
      <h5>NEW ON THE LINE</h5><div class="roll">${recruits.map(name).join(', ')}</div>
      <div class="notice"><b>THE RACE FOR VERDEL RIDGE</b><br>Hegemony ${COUNT[0]}/${NEED} · Concord ${COUNT[1]}/${NEED}. ${NEED - COUNT[0]} more and the heights belong to the Hegemony.</div>
    </article></div>
    <div id="rd-black"></div>
    <div id="rd-day"><div class="big"></div><div class="sub"></div></div>
    <div id="rd-big"></div>
    <div id="rd-sub"></div>
    <div id="rd-split"><div class="row"><span style="color:#a7b4bb">HEGEMONY<br><b>0</b></span><span style="color:#c9c26a;text-align:right">CONCORD<br><b>0</b></span></div>
      <div class="bar"><i style="background:#8a9295;flex:${COUNT[0]}"></i><i style="background:#8c8a5c;flex:${COUNT[1]}"></i></div></div>
    ${feat.map((f, i) => `<div class="rd-tag" id="rd-tag${i}">@${f.h}<span>${f.role}</span></div>`).join('')}
    <div class="rd-tag" id="rd-tagh">@you?<span>the deciding rifle</span></div>
    <div id="rd-race" class="panel"><span class="k">The first fight</span><div class="title">THE RACE FOR VERDEL RIDGE</div>
      <div class="r"><span>Hegemony</span><span class="bar"><i style="background:#8a9295"></i></span><span class="c m">0/${NEED}</span></div>
      <div class="r"><span>Concord</span><span class="bar"><i style="background:#8c8a5c"></i></span><span class="c m">0/${NEED}</span></div>
      <div class="goal">First side to ${NEED} soldiers takes the heights.</div>
      <ul><li>3 days of artillery on the enemy</li><li>A safer week for the winners</li><li>A ribbon for every soldier on the winning side</li></ul></div>
    <div id="rd-hero"><div class="star">★</div><span class="sil">HERO OF VERDEL RIDGE</span></div>
    <div id="rd-mini" class="panel" style="padding:8px 12px"><div class="r" style="display:flex;justify-content:space-between;font-family:Silkscreen,monospace;font-size:16px"><span style="color:#a7b4bb">HEGEMONY ${COUNT[0]}/${NEED}</span><span style="color:#c9c26a">CONCORD ${COUNT[1]}/${NEED}</span></div></div>
  `;
  document.body.appendChild(root);
  const cine = makeCinema(tex, anims);
  root.prepend(cine.canvas);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => ($(sel).style.opacity = o);
  const names = [...root.querySelectorAll('#rd-paper .name')];
  const paperEl = $('#rd-paper');
  const article = $('#rd-paper .paper');

  const fired = new Set();
  function frame(t) {
    const [x, y, z] = camAt(t);
    cam.set(x, y, z);
    for (const [i, ev] of EV.entries()) {
      if (fired.has(i) || t < ev[0]) continue;
      fired.add(i);
      if (ev[1] === 'flare') life.flareAt(ev[2], ev[3]);
      if (ev[1] === 'shell') life.shell(ev[2], ev[3], ev[4]);
      if (ev[1] === 'barrage') life.setBarrage(ev[2] == null ? null : { faction: ev[2] });
      if (ev[1] === 'shoot') {
        const pool = soldiers.filter((s) => s.faction === ev[2] && s.aim && Math.abs(s.x - x) < 300 / z * 2 && Math.abs(s.y - y) < 450 / z * 2);
        if (pool.length) life.debug.shoot([pool[Math.floor(Math.random() * pool.length)]]);
      }
      if (ev[1] === 'shootAt' && ev[2].aim) life.debug.shoot([ev[2]]);
    }

    // filmové záběry
    const night = t < 10.9, dawn = t >= 54.6;
    if (night) cine.draw(t, 'night', { ...NIGHT, pan: t * 5 });
    else if (dawn) cine.draw(t - 54.6, 'dawn', { ...DAWN, flashes: DAWN.flashes.map(([a, b]) => [a - 54.6, b]), pan: (t - 54.6) * 4 });
    show('#rd-cine', night ? 1 : dawn ? clamp01((t - 54.6) / 0.6) : 0);
    show('#rd-black', t < 0.8 ? 1 - t / 0.8 : t > 10.1 && t < 11.3 ? 1 - Math.abs(t - 10.7) / 0.6 : t > 54.0 && t < 55.2 ? 1 - Math.abs(t - 54.6) / 0.6 : t > 63.2 ? clamp01((t - 63.2) / 0.6) * 0.8 : 0);

    // DAY 1
    show('#rd-day', win(t, 0.8, 9.9, 0.4));
    $('#rd-day .big').textContent = typed('DAY 1', t, 0.9, 9);
    $('#rd-day .sub').textContent = t > 3.2 ? typed('VERDEL RIDGE · 32 VOLUNTEERS', t, 3.2, 22) : '';

    // titulky
    const b = BIG.find(([a, e]) => t >= a && t < e);
    const bigEl = $('#rd-big');
    if (b) {
      bigEl.style.opacity = win(t, b[0], b[1], 0.25);
      if (bigEl.dataset.text !== b[2]) { bigEl.dataset.text = b[2]; bigEl.className = b[3]; bigEl.innerHTML = b[2].split('\n').map((l) => `<span>${l}</span>`).join(''); }
    } else bigEl.style.opacity = 0;
    const s = SUB.find(([a, e]) => t >= a && t < e);
    const subEl = $('#rd-sub');
    const paperUp = t > 42.0 && t < 54.4;
    if (s && !b && !(t < 10 && t > 0.8 && s[2] === 'Day one.')) {
      subEl.style.opacity = 1;
      subEl.style.top = paperUp ? '3.5%' : '10.5%';
      if (subEl.dataset.text !== s[2]) { subEl.dataset.text = s[2]; subEl.innerHTML = `<span>${s[2]}</span>`; }
    } else subEl.style.opacity = 0;

    // počty frakcí
    show('#rd-split', win(t, 11.0, 15.0, 0.35));
    const cu = ease(clamp01((t - 11.2) / 2.2));
    root.querySelectorAll('#rd-split b').forEach((el, i) => (el.textContent = Math.round(COUNT[i] * cu)));

    // jmenovky skutečných hráčů
    const tagAt = (el, s, o) => {
      el.style.left = `${(s.x - cam.x) * cam.zoom + cam.w / 2}px`;
      el.style.top = `${(s.y - 36 - cam.y) * cam.zoom + cam.h / 2}px`;
      el.style.opacity = o;
    };
    feat.forEach((f, i) => tagAt($(`#rd-tag${i}`), f.s, win(t, f.a + 0.4, f.b, 0.3)));
    tagAt($('#rd-tagh'), hero, win(t, 39.8, 42.0, 0.3));

    // závod o kótu
    show('#rd-race', win(t, 24.6, 33.4, 0.4));
    const ru = ease(clamp01((t - 29.4) / 2.6));
    root.querySelectorAll('#rd-race .bar i').forEach((el, i) => (el.style.width = `${(COUNT[i] / NEED) * 100 * ru}%`));
    root.querySelectorAll('#rd-race .c').forEach((el, i) => (el.textContent = `${Math.round(COUNT[i] * ru)}/${NEED}`));
    root.querySelectorAll('#rd-race li').forEach((el, i) => (el.style.opacity = t > 31.6 + i * 0.5 ? 1 : 0));
    show('#rd-hero', win(t, 39.2, 42.0, 0.35));
    $('#rd-hero .star').style.transform = `scale(${1 + 0.3 * Math.exp(-(t - 39.2) * 4) * (t > 39.2)})`;

    // noviny: roztočené přiletí, pak se pomalu čtou (posun dolů) a jména se podtrhnou
    show('#rd-dim', win(t, 42.0, 54.6, 0.5));
    show('#rd-every', win(t, 43.8, 52.4, 0.4));
    const pu = clamp01((t - 42.2) / 1.4);
    paperEl.style.opacity = t < 42.2 || t > 54.6 ? 0 : t > 54.0 ? (54.6 - t) / 0.6 : 1;
    const spin = (1 - ease(pu)) * 900, sc = 0.04 + 0.96 * ease(pu);
    const scroll = Math.max(0, article.offsetHeight - paperEl.clientHeight);
    const sy = ease(clamp01((t - 46.2) / 6.0)) * scroll;
    paperEl.style.transform = `rotate(${spin - 1.2}deg) scale(${sc * (1 + 0.03 * clamp01((t - 43.6) / 9))})`;
    article.style.transform = `translateY(${-sy}px)`;
    names.forEach((el, i) => el.style.setProperty('--u', `${clamp01((t - 44.6 - i * 0.12) / 0.4) * 100}%`));

    show('#rd-mini', win(t, 55.4, 60.4, 0.4));
  }

  window.__reel = { seconds: SECONDS, sfx: SFX, frame, ready: true };
}
