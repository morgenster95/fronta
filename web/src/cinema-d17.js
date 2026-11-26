// Filmové scény Day reelu Day 17 (26. 11. 2026). Stejné měřítko jako hra (vzor cinema-d14.js): 135×240 (×8) nebo 90×160 (×12),
// sprity a rekvizity ze hry 1:1, terén v kódu paletou Trench-24 s ditheringem, žádná průhlednost postav, vždy jen pár postav a celé vidět.
// Kreslené scény Day reelu Day 17 pro místa, která na mapě hry nejsou (nábor v zázemí, lazaret, kancelář); fronta (raid, střelba) se točí na mapě.
// Měřítko 1:1 jako hra (voják 19×30 px), rekvizity z PixelLabu zmenšené podle skutečné velikosti (tools/fit-props.py), textury (cihly, prkna, dlažba) kreslené s ditheringem.
//  • signing – úsvit prvního dne: cihlová zeď a dlážděné nádvoří, plakát FIRST WAVE, stůl náboru s důstojníkem; Cyril přijde a zasalutuje
//  • ward    – lazaret v noci: prkenná podlaha a stěna, okno s měsícem, lůžka; medik obvazuje Cyrila, ten se posadí a vstane
//  • office  – kancelář velitele za úsvitu: mapový stůl, stojan na pušky, telefon; důstojník předá rozkaz, Cyril zasalutuje, naskočí stuhy
import { off } from './cinema.js';
import { loadImage } from './assets.js';
import tableSrc from '../../art/cine/prop_recruit_table.png';
import boardSrc from '../../art/cine/prop_notice_board.png';
import lanternSrc from '../../art/cine/prop_lantern_post.png';
import cratesSrc from '../../art/cine/prop_ammo_crates.png';
import medSrc from '../../art/cine/prop_medic_box.png';
import cotSrc from '../../art/cine/prop_cot_blue.png';
import mapSrc from '../../art/cine/prop_map_table.png';
import rackSrc from '../../art/cine/prop_rifle_rack.png';
import phoneSrc from '../../art/cine/prop_phone_table.png';
import deskSrc from '../../art/cine/prop_field_desk.png';

let W = 135, H = 240;
const SIZE = { signing: [90, 160], ward: [90, 160], office: [90, 160] };
const P = { ink: '#0e0d0c', dark: '#1c1a17', mud0: '#2b2722', mud1: '#3d3730', mud2: '#524a3f', mud3: '#6b6152', sand: '#857a68', bone: '#a39782', pale: '#c4b8a0', white: '#e3d9c3',
  steel: '#666d70', grey: '#8a9295', water: '#2a3138', navy: '#141a2c', dusk: '#4b4560', rust: '#7e3b2a', rust2: '#5c2a22', fire: '#a85a36', gold: '#d98f3f', yellow: '#c9c26a', olive: '#6f7148', olive2: '#52543a' };
const B = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const by = (x, y) => (B[y & 3][x & 3] + 0.5) / 16;
const hash = (x, y, s = 0) => { let n = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
const clamp = (v) => Math.max(0, Math.min(1, v));

function sprite(tx, tint) {
  if (!tx?.source?.resource) return null;
  const f = tx.frame, o = off(f.width, f.height), g = o.getContext('2d');
  g.drawImage(tx.source.resource, f.x, f.y, f.width, f.height, 0, 0, f.width, f.height);
  if (tint) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = tint; g.fillRect(0, 0, f.width, f.height); }
  return o;
}
function tinted(img, tint) {
  if (!img) return null;
  const o = off(img.width, img.height), g = o.getContext('2d');
  g.drawImage(img, 0, 0);
  if (tint) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = tint; g.fillRect(0, 0, img.width, img.height); }
  return o;
}
function footOf(c) {
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  for (let y = c.height - 1; y >= 0; y--) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 0) return y + 1;
  return c.height;
}
const loadAny = (src) => loadImage(src).catch(() => null);



export async function makeDay17Scenes(tex = {}, anims = {}, posterC = null) {
  const canvas = off(W, H);
  const g = canvas.getContext('2d');
  g.imageSmoothingEnabled = false;
  const A = (k, a, d, tint) => (anims[k]?.[a]?.[d] || []).map((t) => sprite(t, tint));
  const prop = async (src, tint) => tinted(await loadAny(src), tint);
  const DAWN = 'rgba(120,80,70,0.07)', NIGHT = 'rgba(30,38,70,0.12)', MORN = 'rgba(150,110,80,0.06)';
  const S = {
    walkE: A('hegemony', 'walk', 'east', DAWN), saluteE: A('hegemony', 'salute', 'east', DAWN), officer: sprite(tex.hegemony_officer?.south, DAWN), stand: sprite(tex.hegemony?.south, DAWN),
    lyE: sprite((anims.hegemony?.['lying-wounded']?.east || [])[0], NIGHT), lyW: sprite((anims.hegemony?.['lying-wounded']?.west || [])[0], NIGHT), sitE: A('hegemony', 'sit-wounded', 'east', NIGHT), standN: sprite(tex.hegemony?.south, NIGHT),
    medWalk: A('hegemony_medic', 'walk', 'east', NIGHT), band: A('hegemony_medic', 'bandage', 'east', NIGHT),
    saluteO: A('hegemony', 'salute', 'east', MORN), standO: sprite(tex.hegemony?.south, MORN), officerO: sprite(tex.hegemony_officer?.west, MORN),
  };
  const R = {
    table: await prop(tableSrc, DAWN), board: posterC ? tinted(posterC, DAWN) : await prop(boardSrc, DAWN), lantern: await prop(lanternSrc, DAWN), crates: await prop(cratesSrc, DAWN),
    cotN: await prop(cotSrc, NIGHT), medN: await prop(medSrc, NIGHT), lanternN: await prop(lanternSrc, null),
    map: await prop(mapSrc, MORN), rack: await prop(rackSrc, MORN), phone: await prop(phoneSrc, MORN), desk: await prop(deskSrc, MORN),
  };
  const feet = new Map();
  const at = (arr, t, fps) => (arr?.length ? arr[Math.floor(t * fps) % arr.length] : null);
  const once = (arr, t, fps) => (arr?.length ? arr[Math.max(0, Math.min(arr.length - 1, Math.floor(t * fps)))] : null);
  const put = (c, cx, foot, flip = false) => {
    if (!c) return;
    if (!feet.has(c)) feet.set(c, footOf(c));
    const x = Math.round(cx - c.width / 2), y = Math.round(foot - feet.get(c));
    if (flip) { g.save(); g.translate(x + c.width, y); g.scale(-1, 1); g.drawImage(c, 0, 0); g.restore(); } else g.drawImage(c, x, y);
  };
  const tl = (c, x, y) => { if (c) g.drawImage(c, Math.round(x), Math.round(y)); };
  const px = (c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  const glow = (x, y, r, a, rgb) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
  const field = (y0, y1, cols, f) => { for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) { const v = clamp(f(x, y)) * 0.999; const u = v * (cols.length - 1); const i = Math.floor(u); px(u - i > by(x, y) ? cols[Math.min(cols.length - 1, i + 1)] : cols[i], x, y); } };
  // textury: cihlová zeď (řady cihel s posunem a spárami), prkna podlahy (svislé fošny s letokruhy), dlažba (nepravidelné kameny)
  const bricks = (y0, y1, base, light, dark) => { for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) { const row = Math.floor((y - y0) / 5), off2 = row % 2 ? 4 : 0, bx = (x + off2) % 9, by2 = (y - y0) % 5; const joint = by2 === 4 || bx === 8; const n = hash((x + off2) / 9 | 0, row, 31); px(joint ? dark : (by2 === 0 ? light : (n < 0.3 ? base : n < 0.7 ? light : base)), x, y); } };
  const planks = (y0, y1, cols) => { for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) { const pl = Math.floor(x / 11), seam = x % 11 === 0; const n = hash(pl, (y >> 3) + pl, 41) * 0.5 + hash(x, y >> 1, 42) * 0.25; px(seam ? cols[0] : cols[Math.min(cols.length - 1, 1 + Math.floor(n * (cols.length - 1)))], x, y); } };
  const cobble = (y0, y1, cols) => { for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) { const cx2 = Math.floor(x / 7 + (Math.floor(y / 6) % 2) * 0.5), cy2 = Math.floor(y / 6); const n = hash(cx2, cy2, 51); const edge = x % 7 === 0 || y % 6 === 0; px(edge ? cols[0] : cols[1 + Math.floor(n * (cols.length - 1.01))], x, y); } };
  const label = (txt, x, y, col) => { g.fillStyle = col; g.font = '8px Silkscreen, monospace'; g.textBaseline = 'top'; g.fillText(txt, x, y); };

  const scenes = {
    signing(t) {
      // úsvit, nádvoří náborové stanice: obloha, cihlová zeď s okny, dřevěný plot, dlažba; stůl s důstojníkem, nástěnka s plakátem, lucerna, bedny
      field(0, 30, ['#3a3048', '#7a5560', P.fire, P.gold], (x, y) => y / 30);
      glow(70, 30, 36, 0.55, '230,170,110');
      bricks(30, 82, P.rust2, P.rust, P.ink);
      for (const wx of [8, 34, 60]) { px(P.ink, wx, 42, 14, 20); px(P.dusk, wx + 1, 43, 12, 18); px(P.gold, wx + 1, 43, 12, 3); px(P.ink, wx + 6, 43, 1, 18); px(P.ink, wx + 1, 52, 12, 1); px(P.mud3, wx - 1, 62, 16, 2); }
      px(P.ink, 0, 82, W, 2); px(P.mud3, 0, 84, W, 1);
      cobble(85, H, [P.mud0, P.mud1, P.mud2, P.mud3]);
      for (let k = 0; k < 14; k++) { const x = Math.floor(hash(k, 1, 61) * W), y = 88 + Math.floor(hash(k, 2, 61) * 68); px(P.sand, x, y, 2, 1); } // drobné kamínky
      // stín pod zdí
      g.fillStyle = 'rgba(14,13,12,0.25)'; g.fillRect(0, 85, W, 5);
      tl(R.lantern, -2, 56); tl(R.crates, 66, 82); tl(R.board, 56, 52);
      put(S.officer, 28, 120);
      tl(R.table, 14, 108);
      const arrive = 3.2, x = Math.min(52, -6 + t * (58 / arrive));
      if (t < arrive) put(at(S.walkE, t, 7), Math.round(x), 150);
      else put(once(S.saluteE, t - arrive - 0.2, 7), 52, 150);
      if (t > arrive + 1.8) { const k = (Math.sin(t * 6) + 1) / 2; px(P.gold, 51, 133, 1, 1); glow(51, 133, 6, 0.25 + 0.4 * k, '240,200,110'); }
      g.fillStyle = 'rgba(100,60,50,0.06)'; g.fillRect(0, 0, W, H);
    },
    ward(t) {
      // lazaret v noci: prkenná podlaha, stěna s okenicemi a měsíčním světlem, tři lůžka; Cyril leží, medik obvazuje; později se posadí a vstane
      field(0, 62, [P.ink, P.dark, P.mud0, P.mud1], (x, y) => 0.12 + 0.22 * hash(x >> 2, y >> 1, 71) + (Math.floor(x / 11) % 2 ? 0.05 : 0));
      for (let x = 0; x < W; x += 11) px(P.ink, x, 0, 1, 62);
      px(P.mud3, 0, 61, W, 1); px(P.ink, 0, 62, W, 2);
      // okno s měsícem a paprsek světla na podlaze
      px(P.ink, 52, 12, 24, 30); px(P.navy, 53, 13, 22, 28); px(P.pale, 62, 18, 5, 5); px(P.white, 63, 19, 3, 3); px(P.ink, 63, 13, 1, 28); px(P.ink, 53, 27, 22, 1);
      planks(64, H, [P.ink, P.mud0, P.mud1, P.mud2]);
      g.fillStyle = 'rgba(160,190,230,0.10)'; g.beginPath(); g.moveTo(54, 64); g.lineTo(74, 64); g.lineTo(88, 140); g.lineTo(46, 140); g.fill();
      glow(45, 72, 40, 0.18, '217,143,63');
      tl(R.lanternN, 78, 44);
      // lůžka (PixelLab); Cyril na prvním, další raněný na druhém
      tl(R.cotN, 8, 74); put(S.lyW, 62, 128);
      tl(R.cotN, 44, 118);
      const lie = t < 4.6, sit = t >= 4.6 && t < 6.4;
      if (lie) put(S.lyE, 24, 100); else if (sit) put(once(S.sitE, t - 4.6, 6), 24, 100); else put(S.standN, 22, 112);
      if (t < 4.6) put(at(S.band, t, 6), 8, 104 - 0); else if (t < 6.4) put(S.standN, 70, 140);
      tl(R.medN, 70, 150 - 11);
      g.fillStyle = 'rgba(20,24,44,0.14)'; g.fillRect(0, 0, W, H);
    },
    office(t) {
      // kancelář velitele za úsvitu: dřevěná stěna a prkna, okno s úsvitem, mapový stůl s důstojníkem, stojan na pušky, telefon; Cyril salutuje
      field(0, 58, [P.dark, P.mud0, P.mud1, P.mud2], (x, y) => 0.18 + 0.25 * hash(x >> 2, y >> 1, 81));
      for (let x = 0; x < W; x += 11) px(P.ink, x, 0, 1, 58);
      px(P.mud3, 0, 57, W, 1); px(P.ink, 0, 58, W, 2);
      px(P.ink, 8, 10, 26, 30); px(P.rust2, 9, 11, 24, 28); field(11, 39, ['#7a5560', P.fire, P.gold], (x, y) => ((y - 11) / 28)); px(P.ink, 20, 11, 1, 28); px(P.ink, 9, 25, 24, 1); // okno s úsvitem (pruhy uvnitř rámu)
      glow(21, 30, 36, 0.4, '230,170,110');
      planks(60, H, [P.ink, P.mud1, P.mud2, P.mud3]);
      // koberec s okrajem a vzorem (kosočtverce, dithering)
      px(P.ink, 10, 112, 70, 40); px(P.rust2, 11, 113, 68, 38); px(P.gold, 13, 115, 64, 1); px(P.gold, 13, 149, 64, 1); px(P.gold, 13, 115, 1, 35); px(P.gold, 76, 115, 1, 35);
      for (let y = 117; y < 148; y++) for (let x = 15; x < 75; x++) { const dd = (Math.abs(((x - 15) % 10) - 5) + Math.abs(((y - 117) % 10) - 5)); if (dd < 3) px(P.rust, x, y); else if (dd === 3 && by(x, y) < 0.5) px(P.rust, x, y); }
      tl(R.rack, 66, 38); tl(R.phone, 4, 54);
      put(S.officerO, 50, 100);
      tl(R.map, 36, 92);
      put(t > 1.6 ? once(S.saluteO, t - 1.6, 7) : S.standO, 20, 134);
      if (t > 0.4) { const k = clamp((t - 0.4) / 0.6), px0 = 30, py0 = 92 - k * 6;
        px(P.ink, px0, py0, 10, 13); px(P.white, px0 + 1, py0 + 1, 8, 11); px(P.pale, px0 + 1, py0 + 10, 8, 2);
        for (let i = 0; i < 2; i++) { const yy = py0 + 2 + i * 4; px(P.gold, px0 + 2, yy + 2, 6, 1); px(P.gold, px0 + 3, yy + 1, 4, 1); px(P.gold, px0 + 4, yy, 2, 1); }
        if (t > 2.4) glow(px0 + 5, py0 + 7, 10 + 2 * Math.sin(t * 8), 0.4, '240,200,110'); }
      g.fillStyle = 'rgba(100,60,50,0.05)'; g.fillRect(0, 0, W, H);
    },
  };
  return { canvas, draw(name, t, o = {}) { const sz = SIZE[name] || [90, 160]; if (canvas.width !== sz[0]) { canvas.width = sz[0]; canvas.height = sz[1]; } W = sz[0]; H = sz[1]; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.imageSmoothingEnabled = false; scenes[name]?.(Math.max(0, t), o); } };
}
