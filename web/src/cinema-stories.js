// Filmové scény k příběhům skutečných vojáků (Day reel Day 7, 16. 11. 2026; mřížka 180×320, herní paleta, dithering jako cinema.js):
//  • song     – noční hlídka Concordu zpívá, noty letí přes drát; z druhé strany potichu odpoví hlídka Hegemonie (Felix Kagr)
//  • chess    – šachy poštou při svíčce: pěšec táhne e2–e4, tah se opíše do dopisu, nakonec svíčka zhasne (Rafael „Button“ Superfeisty)
//  • initials – iniciály vyřezané ve stěně zákopu; nástupce pod ně nožem vyřeže svoje (Silas → synovec Severin Samhatespeac, oba S.S.)
// Použití: const st = makeStoryScenes(tex, anims); root.prepend(st.canvas); st.draw('song', t)  (t = s od začátku záběru)
import { sky, glow, silhouette, lit, stakeWire, off, clamp01, easeOut, by, CW as W, CH as H } from './cinema.js';

const P = {
  ink: '#0e0d0c', ink2: '#0b0a09', mud0: '#2b2722', mud1: '#3d3730', mud2: '#524a3f', mud3: '#6b6152', sand: '#857a68', bone: '#a39782',
  pale: '#c4b8a0', white: '#e3d9c3', rust: '#7e3b2a', gold: '#d98f3f', fire: '#fff6dc', khaki: '#8c8a5c', olive: '#6f7148', steel: '#666d70', grey: '#8a9295',
};

// osmina (nota) v pixelech: hlavička 2×2, nožička 5 px, praporek; a = krytí přes dithering (retro, bez průhlednosti)
function note(g, x, y, col, a = 1, k = 1) {
  x = Math.round(x); y = Math.round(y);
  g.fillStyle = col;
  const px = (dx, dy, w = 1, h = 1) => { for (let j = 0; j < h * k; j++) for (let i = 0; i < w * k; i++) if (a >= 1 || a > by(x + dx * k + i, y + dy * k + j)) g.fillRect(x + dx * k + i, y + dy * k + j, 1, 1); };
  px(0, 4, 2, 2); px(1, 0, 1, 5); px(2, 0, 1, 1); px(3, 1, 1, 1);
}

// písmeno S a tečka 5×7 (vyřezané do dřeva)
const GLYPH = {
  S: [' ####', '#    ', '#    ', ' ### ', '    #', '    #', '#### '],
  '.': ['     ', '     ', '     ', '     ', '     ', '     ', '  #  '],
  E: ['#####', '#    ', '#    ', '#### ', '#    ', '#    ', '#####'],
  Z: ['#####', '    #', '   # ', '  #  ', ' #   ', '#    ', '#####'],
  K: ['#   #', '#  # ', '# #  ', '##   ', '# #  ', '#  # ', '#   #'],
};
// pořadí řezu: body písmene od shora dolů po tazích (S: horní oblouk, levý bok, střed, pravý bok, spodní oblouk)
function strokes(ch) {
  // S řezané jedním tahem: horní oblouk zprava doleva, levý bok, střed, pravý bok, spodní oblouk zprava doleva
  if (ch === 'S') return [[4, 0], [3, 0], [2, 0], [1, 0], [0, 1], [0, 2], [1, 3], [2, 3], [3, 3], [4, 4], [4, 5], [3, 6], [2, 6], [1, 6], [0, 6]];
  const pts = [];
  GLYPH[ch].forEach((row, y) => [...row].forEach((c, x) => { if (c === '#') pts.push([x, y]); }));
  return pts;
}

export function makeStoryScenes(tex, anims = {}) {
  const canvas = off(W, H);
  const g = canvas.getContext('2d');
  const L = {};
  // hlídka Concordu v měsíčním světle (skutečný sprite, zezadu: dívá se přes drát) a vzdálená silueta hlídky Hegemonie
  const sentryC = lit(tex.concord?.north || tex.concord?.['north-east'], 'rgba(36,48,78,0.38)');
  const farH = silhouette(tex.hegemony?.south, '#06070c');

  // --- song: statické pozadí (obloha s měsícem, zem nikoho s drátem, vzdálený val Hegemonie) ---
  {
    const c = off(W, H), cg = c.getContext('2d');
    sky(cg, 0, 196, ['#03050c', '#070b18', '#0e1428', '#1b2238', '#2a2f44']);
    let s = 7;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k < 70; k++) { cg.fillStyle = r() < 0.2 ? '#d9d4c4' : '#5d6276'; cg.fillRect(Math.floor(r() * W), Math.floor(r() * 120), 1, 1); }
    glow(cg, 138, 52, 46, '#1f2a44', 1.2);
    glow(cg, 138, 52, 26, '#3a4560', 1.0);
    cg.fillStyle = '#c9cbbf'; cg.beginPath(); cg.arc(138, 52, 9, 0, Math.PI * 2); cg.fill();
    cg.fillStyle = '#e3e2d6'; cg.beginPath(); cg.arc(136, 50, 6, 0, Math.PI * 2); cg.fill();
    cg.fillStyle = '#a9ab9f'; cg.fillRect(139, 54, 2, 2); cg.fillRect(134, 49, 1, 1);
    // vzdálený val Hegemonie (tmavý pás s pytli na obzoru)
    cg.fillStyle = '#10121b';
    for (let x = 0; x < W; x++) cg.fillRect(x, Math.round(160 + 1.5 * Math.sin(x * 0.11)), 1, 12);
    cg.fillStyle = '#171a26';
    for (let x = 2; x < W; x += 7) cg.fillRect(x, Math.round(158 + 1.5 * Math.sin(x * 0.11)), 6, 3);
    // zem nikoho: bláto s krátery, měsíc se leskne v louži
    cg.fillStyle = '#141519';
    for (let x = 0; x < W; x++) cg.fillRect(x, Math.round(171 + 2 * Math.sin(x * 0.05) + Math.sin(x * 0.23)), 1, 160);
    for (const [cx, cy, rr] of [[34, 200, 12], [110, 188, 8], [160, 206, 10]]) { cg.fillStyle = '#0d0e12'; cg.beginPath(); cg.ellipse(cx, cy, rr, rr / 3.2, 0, 0, Math.PI * 2); cg.fill(); }
    cg.fillStyle = '#3a4560'; cg.fillRect(106, 188, 7, 1); cg.fillStyle = '#5d6276'; cg.fillRect(108, 188, 3, 1);
    stakeWire(cg, -6, W + 6, 186, 11, 15, '#08090d', '#2a2f44');
    stakeWire(cg, -10, W + 10, 214, 16, 19, '#060609', '#20263a');
    L.song = c;
    // popředí: val Concordu (pytle nasvícené měsícem shora)
    const p = off(W, H), pg = p.getContext('2d');
    pg.fillStyle = '#08080a'; pg.fillRect(0, 266, W, 60);
    for (let row = 0; row < 5; row++) for (let x = (row % 2) * -10; x < W; x += 20) {
      const y = 248 + row * 9;
      pg.fillStyle = (x + row) % 3 ? '#16161a' : '#1b1b1f';
      pg.beginPath(); pg.ellipse(x + 10, y, 10, 5, 0, 0, Math.PI * 2); pg.fill();
      pg.fillStyle = row === 0 ? '#3a4058' : '#252836'; pg.fillRect(x + 4, y - 5, 12, 1);
      pg.fillStyle = '#08080a'; pg.fillRect(x + 14, y - 3, 1, 6);
    }
    L.songFront = p;
  }

  // --- chess: kryt, bedna od munice jako stůl, šachovnice ---
  const BOARD = { x: 14, y: 196, sw: 12, sh: 7 }; // levý horní roh, čtverec 12×7 px (pohled shora šikmo)
  const sq = (f, r) => ({ x: BOARD.x + f * BOARD.sw + (7 - r) * 1.2, y: BOARD.y + (7 - r) * BOARD.sh }); // f = sloupec a–h (0–7), r = řada 1–8 (0–7)
  // figurky: [sloupec, řada, druh, bílá]; bílé dole (řada 0–1)
  const PIECES = [];
  'rnbqkbnr'.split('').forEach((k, f) => { PIECES.push([f, 0, k, 1], [f, 1, 'p', 1], [f, 6, 'p', 0], [f, 7, k, 0]); });
  const pieceArt = (k) => ({ p: [[1, 0, 1, 1], [0, 1, 3, 1], [1, 2, 1, 1], [0, 3, 3, 1]], r: [[0, 0, 1, 1], [2, 0, 1, 1], [0, 1, 3, 3], [0, 4, 3, 1]], n: [[1, 0, 2, 1], [0, 1, 3, 1], [1, 2, 2, 2], [0, 4, 3, 1]],
    b: [[1, 0, 1, 1], [0, 1, 3, 2], [1, 3, 1, 1], [0, 4, 3, 1]], q: [[0, 0, 1, 1], [2, 0, 1, 1], [1, 0, 1, 1], [0, 1, 3, 3], [0, 4, 3, 1]], k: [[1, -1, 1, 1], [0, 0, 3, 1], [1, 1, 1, 1], [0, 2, 3, 2], [0, 4, 3, 1]] }[k]);
  function piece(x, y, k, white, light) {
    const base = white ? (light > 0.5 ? P.white : P.pale) : (light > 0.5 ? P.mud1 : P.mud0);
    const hi = white ? P.fire : P.mud3;
    const h = (k === 'p' ? 4 : 5) * 2, X = Math.round(x), Y = Math.round(y);
    g.fillStyle = 'rgba(14,13,12,0.55)'; g.fillRect(X - 1, Y + 1, 8, 2); // stín
    for (const [dx, dy, w, hh] of pieceArt(k)) { g.fillStyle = base; g.fillRect(X + dx * 2, Y - h + dy * 2, w * 2, hh * 2); }
    g.fillStyle = white ? P.bone : P.ink; g.fillRect(X + 4, Y - h + 2, 2, h - 2); // stín na pravé straně figurky
    g.fillStyle = hi; g.fillRect(X + 1, Y - h + 2, 1, 2);
  }

  // --- initials: stěna zákopu z prken, bláto mezi nimi, staré značky ---
  {
    const c = off(W, H), cg = c.getContext('2d');
    cg.fillStyle = '#1a1511'; cg.fillRect(0, 0, W, H);
    for (let row = 0; row < 8; row++) {
      const y = 14 + row * 42;
      for (let x = 0; x < W; x++) {
        const grain = (Math.sin(x * 0.09 + row * 1.7) + Math.sin(x * 0.031 + row)) * 0.5;
        const v = grain + (by(x, y) - 0.5) * 0.25;
        cg.fillStyle = v > 0.55 ? '#5a4632' : v > -0.35 ? '#4e3d2c' : '#433426';
        cg.fillRect(x, y, 1, 39);
      }
      // suky, praskliny a hřebíky
      for (let k = 0; k < 2; k++) { const kx = (row * 53 + k * 89) % 170 + 4; cg.fillStyle = '#2e241a'; cg.beginPath(); cg.ellipse(kx, y + (k ? 30 : 8), 3, 2, 0, 0, Math.PI * 2); cg.fill(); }
      cg.fillStyle = '#6b5640'; cg.fillRect(0, y, W, 1);
      cg.fillStyle = '#120e0b'; cg.fillRect(0, y + 39, W, 3);
      cg.fillStyle = '#666d70'; cg.fillRect(4, y + 4, 2, 2); cg.fillRect(4, y + 33, 2, 2); cg.fillRect(172, y + 4, 2, 2); cg.fillRect(172, y + 33, 2, 2);
    }
    // bláto vytékající ze spár
    cg.fillStyle = '#2b2219';
    for (let k = 0; k < 14; k++) { const x = (k * 41) % 176, y = 53 + ((k * 3) % 7) * 42; cg.fillRect(x, y, 1 + (k % 3), 3 + (k % 5)); }
    // staré značky: čárky počítání dnů a vyřezané srdce
    const cut = (x, y, w, h) => { cg.fillStyle = '#1c1510'; cg.fillRect(x, y, w, h); cg.fillStyle = '#8a7356'; cg.fillRect(x, y + h, w, 1); };
    for (let i = 0; i < 4; i++) cut(122 + i * 4, 66, 1, 9);
    cg.fillStyle = '#1c1510'; for (let i = 0; i < 18; i++) cg.fillRect(120 + i, 72 - Math.round(i * 0.45), 1, 1);
    cut(26, 274, 1, 7); cut(30, 274, 1, 7); cut(34, 274, 1, 7);
    L.wall = c;
  }
  // vyřezané písmeno (×2): rýha tmavá, spodní hrana světlá; n = kolik bodů je už vyřezáno (pro animaci)
  const KS = 4; // zvětšení písmen
  function carve(ch, x0, y0, n = Infinity, fresh = false) {
    const pts = strokes(ch).slice(0, n);
    for (const [px, py] of pts) {
      g.fillStyle = fresh ? '#d8be92' : '#8a7356'; g.fillRect(x0 + px * KS, y0 + py * KS + 1, KS, KS); // světlá spodní hrana řezu
      g.fillStyle = fresh ? '#0c0805' : '#160f0a'; g.fillRect(x0 + px * KS, y0 + py * KS, KS, KS - 1); // rýha
    }
    return pts.at(-1);
  }

  const scenes = {
    song(t) {
      g.drawImage(L.song, 0, 0);
      // mlha nad zemí nikoho (dithered pás, pomalu se posouvá)
      g.fillStyle = '#2a2f44';
      for (let y = 176; y < 196; y++) for (let x = 0; x < W; x++) if (0.18 * Math.sin((x + t * 6) * 0.07 + y * 0.3) + 0.12 > by(x, y) + (Math.abs(y - 186) / 10) * 0.2) g.fillRect(x, y, 1, 1);
      // vzdálená hlídka Hegemonie: po chvíli vykoukne nad val (silueta proti obloze)
      const up = easeOut(clamp01((t - 3.6) / 1.0));
      if (farH) g.drawImage(farH, 0, 0, farH.width, Math.round(farH.height * (0.35 + 0.3 * up)), 128, Math.round(156 - 6 * up), 14, Math.round(14 * (0.35 + 0.3 * up)));
      // noty Concordu: letí od hlídky přes drát (velké, světlé), postupně slábnou
      for (let i = 0; i < 9; i++) {
        const u = t - 0.4 - i * 0.42;
        if (u < 0 || u > 3.4) continue;
        const x = 64 + u * 24 + Math.sin(u * 3 + i) * 4, y = 222 - u * 22 - Math.sin(u * 1.7 + i) * 6;
        note(g, x, y, i % 3 ? P.pale : P.white, clamp01(1 - u / 3.4) * 1.1, 2 - (u > 2 ? 1 : 0));
      }
      // odpověď z druhé strany: menší šedé noty letí zpátky
      for (let i = 0; i < 7; i++) {
        const u = t - 4.4 - i * 0.5;
        if (u < 0 || u > 3.6) continue;
        const x = 134 - u * 20 + Math.sin(u * 2.6 + i) * 3, y = 150 - u * 6 + Math.sin(u * 2 + i) * 4;
        note(g, x, y, P.grey, clamp01(Math.min(u / 0.4, (3.6 - u) / 1.4)), u > 1.6 ? 2 : 1);
      }
      g.drawImage(L.songFront, 0, 0);
      // hlídka Concordu za pytli (zezadu), dech v mrazu
      if (sentryC) g.drawImage(sentryC, 6, 170, 108, 108);
      for (let k = 0; k < 3; k++) {
        const u = ((t * 0.7 + k * 0.33) % 1);
        g.fillStyle = '#5d6276';
        for (let j = 0; j < 4; j++) if (u < 0.8 && 0.6 - u * 0.7 > by(62 + j + Math.round(u * 10), 196 - Math.round(u * 8))) g.fillRect(62 + j + Math.round(u * 10), 196 - Math.round(u * 8) - (j % 2), 1, 1);
      }
    },
    chess(t) {
      // svíčka: hoří, po 5,6 s se plamen zmenšuje, v 6,8 s zhasne (zůstane jen kouř a tma)
      const die = clamp01((t - 5.6) / 1.2), out = t > 6.8;
      const fl = (Math.sin(t * 11) * 0.6 + Math.sin(t * 7.3) * 0.4) * (1 - die);
      const light = out ? 0.12 : 1 - die * 0.75;
      const cx = 150, cy = 140;
      g.fillStyle = P.ink; g.fillRect(0, 0, W, H);
      // stěna krytu (prkna), nasvícená svíčkou
      for (let x = 0; x < W; x += 14) { g.fillStyle = x % 28 ? '#17140f' : '#14110d'; g.fillRect(x, 0, 13, 180); }
      if (!out) {
        glow(g, cx, cy, 160 * light, '#1c1a17', 1.4, 1.1);
        glow(g, cx, cy, 110 * light, '#2b2722', 1.2, 1.1);
        glow(g, cx, cy, 60 * light, '#524a3f', 0.9);
      }
      g.fillStyle = P.ink; for (let x = 0; x < W; x += 14) g.fillRect(x, 0, 1, 180);
      // fotka připíchnutá na stěně (kamarád z domova)
      g.fillStyle = light > 0.5 ? '#857a68' : '#3d3730'; g.fillRect(28, 124, 24, 30);
      g.fillStyle = light > 0.5 ? '#524a3f' : '#2b2722'; g.fillRect(30, 126, 20, 22);
      g.fillStyle = light > 0.5 ? '#a39782' : '#3d3730'; g.fillRect(37, 130, 6, 6); g.fillRect(35, 137, 10, 11);
      g.fillStyle = P.steel; g.fillRect(39, 123, 2, 2);
      // bedna od munice = stůl
      g.fillStyle = light > 0.5 ? '#4a3a2a' : '#2b2219'; g.fillRect(0, 180, W, 140);
      for (let y = 184; y < H; y += 10) { g.fillStyle = '#2b2219'; g.fillRect(0, y, W, 1); }
      g.fillStyle = light > 0.5 ? '#6b6152' : '#3d3730'; g.fillRect(0, 180, W, 2);
      if (!out) glow(g, cx, 186, 130 * light, '#524a3f', 0.75, 0.5);
      
      // šachovnice (8×8, šikmo)
      for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) {
        const p0 = sq(f, r);
        const dark = (f + r) % 2 === 0;
        g.fillStyle = dark ? (light > 0.5 ? '#3d3730' : '#1c1a17') : (light > 0.5 ? '#a39782' : '#3d3730');
        for (let j = 0; j < BOARD.sh; j++) g.fillRect(Math.round(p0.x - j * 0.18), p0.y + j, BOARD.sw, 1);
      }
      g.fillStyle = light > 0.5 ? '#2b2219' : '#14110d'; g.fillRect(BOARD.x - 2, BOARD.y + 8 * BOARD.sh, 8 * BOARD.sw + 8, 3);
      // tah e2–e4: pěšec se zvedne, přesune o dvě pole, dosedne
      const mv = easeOut(clamp01((t - 1.2) / 1.1));
      for (const [f, r, k, w] of PIECES) {
        let p0 = sq(f, r), lift = 0;
        if (f === 4 && r === 1 && w) { const p1 = sq(4, 3); p0 = { x: p0.x + (p1.x - p0.x) * mv, y: p0.y + (p1.y - p0.y) * mv }; lift = Math.sin(mv * Math.PI) * 8; }
        piece(p0.x + 3, p0.y + 5 - lift, k, w, light);
      }
      // dopis s tahem: „1. e4“ a malý náčrt šachovnice v rohu
      const lt = clamp01((t - 2.6) / 0.6);
      g.save(); g.translate(128, 268 + (1 - lt) * 30); g.rotate(0.08);
      g.fillStyle = light > 0.5 ? P.pale : '#3d3730'; g.fillRect(-34, -22, 68, 44);
      g.fillStyle = light > 0.5 ? P.bone : '#2b2722'; g.fillRect(-34, 20, 68, 2);
      g.fillStyle = '#2a2118';
      for (let i = 0; i < 4; i++) for (let x = 0; x < 34 + (i * 7) % 12; x += 3) g.fillRect(-28 + x, -16 + i * 6, 2, 1);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) g.fillRect(14 + i * 3, 2 + j * 3, 3, 3);
      g.strokeStyle = '#2a2118'; g.strokeRect(13.5, 1.5, 12, 12);
      if (t > 3.0) { g.fillStyle = P.rust; const w = Math.min(14, Math.floor((t - 3.0) * 16)); g.fillRect(-28, 6, w, 2); g.fillRect(-28, 10, Math.max(0, w - 6), 2); }
      g.restore();
      // svíčka (v držáku z nábojnice)
      const top = 150 + Math.round(die * 8);
      g.fillStyle = '#857a68'; g.fillRect(cx - 5, 170, 10, 10);
      g.fillStyle = '#a39782'; g.fillRect(cx - 5, 170, 2, 10);
      g.fillStyle = light > 0.3 ? '#c4b8a0' : '#524a3f'; g.fillRect(cx - 3, top, 6, 170 - top);
      if (!out) {
        const fh = Math.max(1, Math.round(8 * (1 - die)));
        g.fillStyle = P.gold; g.fillRect(cx - 2, top - fh + Math.round(fl), 4, fh);
        g.fillStyle = P.fire; g.fillRect(cx - 1, top - Math.max(1, fh - 3) + Math.round(fl), 2, Math.max(1, fh - 4));
      }
      g.fillStyle = P.ink; g.fillRect(cx, top - 2, 1, 2);
      // kouř: tenký, po zhasnutí silnější proužek
      const sm = out ? 0.55 : 0.22;
      g.fillStyle = `rgba(163,151,130,${sm})`;
      for (let k = 1; k < (out ? 18 : 10); k++) g.fillRect(Math.round(cx + Math.sin(t * 2 + k * 0.7) * k * 0.7), top - 6 - k * 6, 1, 3);
    },
    initials(t, o = {}) {
      // lucerna vlevo nahoře se mírně houpe; staré iniciály S.S. nahoře, nové se vyřezávají pod ně
      g.drawImage(L.wall, 0, 0);
      const sw = Math.sin(t * 1.3) * 4;
      // ztmavení okrajů (vinětace), světlo lucerny míří na iniciály
      g.fillStyle = '#0e0b08';
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot((x - 90) / 95, (y - 160) / 150); if (d > 0.75 && (d - 0.75) * 2.2 > by(x, y)) g.fillRect(x, y, 1, 1); }
      glow(g, 70 + sw, 150, 120, '#5a4632', 0.75, 1.1);
      glow(g, 70 + sw, 150, 70, '#7a6046', 0.6, 1.0);
      // staré iniciály (zčernalé, tečky po písmenech)
      const X0 = 34, Y0 = 104, X1 = 34, Y1 = 188;
      const OLD = o.old || 'SS', NEW = o.new || 'SS'; // iniciály: staré (padlý) a nové (nástupce), dvě písmena
      carve(OLD[0], X0, Y0); carve('.', X0 + 22, Y0); carve(OLD[1], X0 + 46, Y0); carve('.', X0 + 68, Y0);
      // čárky dnů vedle (poslední škrtnutá)
      g.fillStyle = '#160f0a'; for (let i = 0; i < 5; i++) g.fillRect(X0 + 100 + i * 5, Y0 + 4, 2, 20);
      for (let i = 0; i < 28; i++) g.fillRect(X0 + 98 + i, Y0 + 22 - Math.round(i * 0.6), 2, 2);
      // nové iniciály: písmena se vyřezávají postupně, nůž sleduje hrot řezu
      const seq = [[NEW[0], X1, Y1], ['.', X1 + 22, Y1], [NEW[1], X1 + 46, Y1], ['.', X1 + 68, Y1]];
      let tip = null, k = Math.max(0, (t - 1.2) * 8);
      for (const [ch, x, y] of seq) {
        const n = strokes(ch).length;
        if (k <= 0) break;
        const last = carve(ch, x, y, Math.ceil(Math.min(n, k)), true);
        if (last) tip = { x: x + last[0] * KS + 2, y: y + last[1] * KS + 2 };
        k -= n + 2;
      }
      // třísky padají od hrotu
      if (tip && t < 6.6) {
        g.fillStyle = '#c9ae84';
        for (let i = 0; i < 5; i++) { const u = ((t * 1.7 + i * 0.21) % 1); g.fillRect(Math.round(tip.x + 3 + i * 2 - u * 5), Math.round(tip.y + 4 + u * u * 60), 2, 1); }
      }
      // nůž: čepel z hrotu doprava nahoru, dřevěná rukojeť; po dokončení se odtáhne
      const away = easeOut(clamp01((t - 6.6) / 0.6));
      if (tip) {
        const nx = tip.x + 1 + away * 40, ny = tip.y + 1 - away * 26;
        g.save(); g.translate(nx, ny); g.rotate(-0.62);
        g.fillStyle = '#8a9295'; g.fillRect(0, -2, 34, 5); g.fillRect(-3, -1, 3, 3);
        g.fillStyle = '#d4d8d2'; g.fillRect(2, -2, 30, 1);
        g.fillStyle = '#666d70'; g.fillRect(0, 2, 34, 1);
        g.fillStyle = '#3d3730'; g.fillRect(34, -4, 4, 9);
        g.fillStyle = '#4a3a2a'; g.fillRect(38, -3, 36, 7);
        g.fillStyle = '#7a6046'; g.fillRect(38, -3, 36, 2);
        g.fillStyle = '#2b2219'; for (let i = 0; i < 4; i++) g.fillRect(44 + i * 8, -3, 1, 7);
        g.restore();
      }
      // kapky vody stékají po prknech
      g.fillStyle = '#3a4560';
      for (let i = 0; i < 4; i++) { const u = (t * 0.4 + i * 0.27) % 1; g.fillRect(14 + i * 47, Math.round(20 + u * 280), 1, 3); }
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
