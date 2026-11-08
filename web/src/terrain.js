// Procedurální pixel art terénu z mřížky mapy (paleta Trench 24). Kreslí se po blocích (chunk) do canvasu.
// Je to dočasná náhrada za dlaždice z PixelLabu: stejné měřítko 16 px = 1 m, takže se dá později vyměnit.

import { T } from '../../engine/mapgen.js';
import { hash2 } from '../../engine/rng.js';

export const PAL = [
  '0e0d0c', '1c1a17', '2b2722', '3d3730', '524a3f', '6b6152', '857a68', 'a39782', 'c4b8a0', 'e3d9c3',
  '3a3b2c', '545639', '6f7148', '8c8a5c', '4a4f52', '666d70', '8a9295', '2a3138', '5c2a22', '7e3b2a',
  'a85a36', '9fa640', 'c9c26a', 'd98f3f',
].map((h) => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]);

export const CHUNK = 64; // dlaždic

// hladký šum z mřížky hodnot (bilineární)
function vnoise(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed), c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function paintChunk(map, cx, cy) {
  const S = map.tile;
  const tw = Math.min(CHUNK, map.W - cx * CHUNK);
  const th = Math.min(CHUNK, map.H - cy * CHUNK);
  const w = tw * S, h = th * S;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(w, h);
  const data = img.data;
  const ox = cx * CHUNK * S, oy = cy * CHUNK * S; // světové px levého horního rohu
  const g = (x, y) => (x < 0 || y < 0 || x >= map.W || y >= map.H ? T.MUD : map.grid[y * map.W + x]);
  const put = (px, py, ci) => {
    if (px < 0 || py < 0 || px >= w || py >= h) return;
    const p = PAL[ci];
    const i = (py * w + px) * 4;
    data[i] = p[0]; data[i + 1] = p[1]; data[i + 2] = p[2]; data[i + 3] = 255;
  };
  const isTr = (t) => t === T.TRENCH || t === T.DUGOUT;

  for (let ty = 0; ty < th; ty++) {
    for (let tx = 0; tx < tw; tx++) {
      const gx = cx * CHUNK + tx, gy = cy * CHUNK + ty;
      const t = g(gx, gy);
      const n = g(gx, gy - 1), s = g(gx, gy + 1), e = g(gx + 1, gy), wv = g(gx - 1, gy);
      for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
          const wx = ox + tx * S + x, wy = oy + ty * S + y; // světové px
          const px = tx * S + x, py = ty * S + y;
          const r = hash2(wx, wy, 7);
          let c;
          if (t === T.TRENCH || t === T.DUGOUT) {
            c = trenchPixel(x, y, r, wx, wy, isTr(n), isTr(s), isTr(e), isTr(wv), t === T.DUGOUT);
          } else if (t === T.PARAPET) {
            c = sandbagPixel(x, y, wx, wy, r, isTr(s), isTr(n));
          } else {
            const nml = t === T.NML || t === T.WIRE || ((t === T.CRATER || t === T.WATER) && Math.abs(gy - map.H / 2) < map.nmlHalf);
            c = groundPixel(nml, wx, wy, r, gy, map);
          }
          put(px, py, c);
        }
      }
      if (t === T.WIRE) drawWire(put, tx * S, ty * S, gx, gy);
    }
  }

  // kulaté krátery přes zem (bez zákopů)
  for (const cr of map.craters) {
    const ccx = cr.x * S + 8 - ox, ccy = cr.y * S + 8 - oy, R = cr.r * S + 6;
    if (ccx < -R || ccy < -R || ccx > w + R || ccy > h + R) continue;
    for (let y = Math.max(0, Math.floor(ccy - R)); y < Math.min(h, ccy + R); y++)
      for (let x = Math.max(0, Math.floor(ccx - R)); x < Math.min(w, ccx + R); x++) {
        const tt = g(Math.floor((x + ox) / S), Math.floor((y + oy) / S));
        if (tt === T.TRENCH || tt === T.PARAPET || tt === T.DUGOUT) continue;
        const dx = x - ccx, dy = (y - ccy) * 1.25; // mírně zploštělé (pohled shora pod úhlem)
        const d = Math.hypot(dx, dy) / R;
        if (d > 1) continue;
        const rr = hash2(x + ox, y + oy, 13);
        let c;
        if (d > 0.9) c = dy < 0 ? (rr < 0.35 ? 5 : rr < 0.8 ? 4 : 3) : rr < 0.5 ? 2 : 3; // val: horní osvětlený, spodní ve stínu
        else if (cr.r >= 2 && d < 0.55) c = d < 0.5 ? (rr < 0.04 ? 16 : dy < -R * 0.2 ? 14 : 17) : 1; // voda
        else c = dy < 0 ? 1 : rr < 0.5 ? 2 : 3;
        put(x, y, c);
      }
  }
  ctx.putImageData(img, 0, 0);
  // rekvizity (stromy, trosky) v tomto chunku
  for (const p of map.props) {
    const px = p.x * S - ox, py = p.y * S - oy;
    if (px < -40 || py < -60 || px > w + 40 || py > h + 20) continue;
    if (p.type === 'tree') drawTree(ctx, px, py, p.x * 31 + p.y);
    else if (p.type === 'debris') drawDebris(ctx, px, py, p.x + p.y * 17);
  }
  return canvas;
}

function groundPixel(nml, wx, wy, r, gy, map) {
  const big = vnoise(wx / 40, wy / 40, 11);
  const v = vnoise(wx / 12, wy / 12, 1) * 0.5 + vnoise(wx / 4, wy / 4, 2) * 0.2 + big * 0.22 + r * 0.08;
  let c;
  if (nml) c = v < 0.22 ? 1 : v < 0.58 ? 2 : v < 0.93 ? 3 : 4;
  else c = v < 0.3 ? 2 : v < 0.62 ? 3 : v < 0.92 ? 4 : 5;
  // dál od fronty trochu suchá tráva
  const fromMid = Math.abs(gy - map.H / 2);
  if (!nml && fromMid > 50 && r < 0.012 + (fromMid - 50) * 0.0006) c = r < 0.006 ? 12 : 11;
  if (r > 0.9975) c = nml ? 7 : 6; // kamínky / kosti
  if (nml && r < 0.003) c = 17; // louže
  return c;
}

function trenchPixel(x, y, r, wx, wy, n, s, e, w, dugout) {
  // vzdálená (severní) stěna je vidět jako svislá plocha: obložení vodorovnými prkny a kůly
  if (!n && y < 9) {
    if (y === 0) return 0;
    if (y === 1) return 6;
    if (wx % 12 === 0 || wx % 12 === 1) return wx % 12 === 0 ? 2 : 3; // kůl
    if ((y - 2) % 3 === 2) return 2; // spára mezi prkny
    return r < 0.12 ? 3 : r < 0.6 ? 4 : 5;
  }
  if (!n && y === 9) return 0; // stín pod stěnou
  if (!s && y > 13) return y === 15 ? 3 : 0; // hrana bližší stěny
  if (!w && x < 2) return x === 0 ? 0 : 2;
  if (!e && x > 13) return x === 15 ? 0 : 2;
  if (dugout) {
    if (y < 10) return x === 2 || x === 13 || y === 1 ? 19 : 0;
    return 1;
  }
  const horizontal = e || w;
  // rošty jen jako úzký pruh uprostřed dna
  if (horizontal && n && y >= 2 && y <= 9) {
    if (y === 2 || y === 9) return 3; // podélné trámy
    return wx % 3 === 2 ? 1 : r < 0.1 ? 4 : r < 0.14 ? 18 : 5; // příčky
  }
  if (!horizontal && x >= 5 && x <= 10) {
    if (x === 5 || x === 10) return 3;
    return wy % 3 === 2 ? 1 : r < 0.1 ? 4 : 5;
  }
  const v = hash2(wx >> 2, wy >> 2, 21);
  if (v < 0.08) return 17; // louže
  return v < 0.5 ? 1 : 2;
}

function sandbagPixel(x, y, wx, wy, r, trenchBelow, trenchAbove) {
  // řady pytlů 6×4 px, každá druhá posunutá
  const row = Math.floor(wy / 4);
  const off = row % 2 ? 3 : 0;
  const bx = (wx + off) % 6, by = wy % 4;
  if (bx === 0 || by === 3) return 1; // spáry
  if (by === 0) return r < 0.5 ? 7 : 8;
  if (by === 2) return 5;
  return r < 0.85 ? 6 : 7;
}

function drawWire(put, x0, y0, gx, gy) {
  // kůl s křížem a smyčky drátu
  if ((gx * 7 + gy) % 5 === 0) {
    for (let i = 0; i < 9; i++) {
      put(x0 + 4 + i, y0 + 3 + i, 5);
      put(x0 + 12 - i, y0 + 3 + i, 4);
    }
  }
  const ph = hash2(gx, gy, 9) * 6;
  for (let x = 0; x < 16; x++) {
    const y1 = Math.round(7 + 3 * Math.sin((x + gx * 16) * 0.55 + ph));
    const y2 = Math.round(9 + 2 * Math.cos((x + gx * 16) * 0.8 + ph));
    put(x0 + x, y0 + y1, hash2(x, gy, 1) < 0.15 ? 15 : 0);
    if (x % 2) put(x0 + x, y0 + y2, 1);
  }
}

function drawTree(ctx, px, py, seed) {
  // ohořelý pahýl stromu
  const r = (k) => hash2(seed, k, 4);
  const hgt = 18 + Math.floor(r(1) * 26);
  const c = (i) => `rgb(${PAL[i].join(',')})`;
  ctx.fillStyle = c(0);
  ctx.fillRect(px + 6, py + 16 - hgt, 4, hgt);
  ctx.fillStyle = c(3);
  ctx.fillRect(px + 7, py + 16 - hgt, 2, hgt - 1);
  ctx.fillStyle = c(2);
  ctx.fillRect(px + 7, py + 16 - hgt + 2, 1, hgt - 3);
  for (let b = 0; b < 3; b++) {
    const by = py + 16 - hgt + 4 + Math.floor(r(b + 5) * (hgt * 0.5));
    const dir = r(b + 9) < 0.5 ? -1 : 1;
    const len = 3 + Math.floor(r(b + 12) * 6);
    for (let i = 0; i < len; i++) {
      ctx.fillStyle = c(i === len - 1 ? 1 : 0);
      ctx.fillRect(px + 8 + dir * (2 + i), by - Math.floor(i / 2), 1, 1);
    }
  }
  ctx.fillStyle = c(18);
  ctx.fillRect(px + 7, py + 16 - hgt, 1, 1);
  ctx.fillStyle = 'rgba(14,13,12,0.45)';
  ctx.fillRect(px + 3, py + 16, 12, 2);
}

function drawDebris(ctx, px, py, seed) {
  const c = (i) => `rgb(${PAL[i].join(',')})`;
  const r = (k) => hash2(seed, k, 8);
  for (let i = 0; i < 3; i++) {
    const x = px + Math.floor(r(i) * 12), y = py + Math.floor(r(i + 3) * 10);
    ctx.fillStyle = c(1);
    ctx.fillRect(x, y + 1, 7, 2);
    ctx.fillStyle = c(r(i + 6) < 0.5 ? 5 : 19);
    ctx.fillRect(x, y, 7, 2);
  }
  if (r(10) < 0.3) {
    // zrezivělá přilba
    ctx.fillStyle = c(1);
    ctx.fillRect(px + 5, py + 9, 6, 3);
    ctx.fillStyle = c(r(11) < 0.5 ? 14 : 12);
    ctx.fillRect(px + 6, py + 9, 4, 2);
  }
}

// Přehledová textura: 1 px na dlaždici (pro velké oddálení)
export function paintOverview(map) {
  const canvas = document.createElement('canvas');
  canvas.width = map.W;
  canvas.height = map.H;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(map.W, map.H);
  const col = { [T.MUD]: 3, [T.NML]: 2, [T.TRENCH]: 0, [T.PARAPET]: 6, [T.CRATER]: 1, [T.WATER]: 17, [T.WIRE]: 1, [T.DUGOUT]: 0 };
  for (let i = 0; i < map.grid.length; i++) {
    const p = PAL[col[map.grid[i]] ?? 3];
    img.data[i * 4] = p[0]; img.data[i * 4 + 1] = p[1]; img.data[i * 4 + 2] = p[2]; img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}
