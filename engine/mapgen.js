// Generátor fronty: zákopy, ostnaté dráty, krátery a místa (sloty) pro vojáky.
// Mapa je deterministická ze seedu, takže ji prohlížeč i build skript spočítají stejně a mapa se nemusí posílat.
// Jednotky: dlaždice 16 px = 1 m.

import { mulberry32, hashString } from './rng.js';

export const T = {
  MUD: 0,
  NML: 1, // země nikoho
  TRENCH: 2,
  PARAPET: 3, // pytle s pískem
  CRATER: 4,
  WATER: 5,
  WIRE: 6,
  DUGOUT: 7,
};

export const DIRS = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'];
export const LINES = ['front', 'support', 'comm', 'reserve'];

export const DEFAULTS = {
  seed: 'front-ww1',
  sectors: 32, // celková šířka mapy; otevírají se postupně od středu (state.openSectors)
  sectorW: 128,
  height: 176,
  tile: 16,
  nmlHalf: 18, // polovina šířky země nikoho
  slotSpacing: 2, // dlaždic mezi vojáky v zákopu
};

export function generateFront(opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const W = o.sectors * o.sectorW;
  const H = o.height;
  const rand = mulberry32(hashString(o.seed));
  const grid = new Uint8Array(W * H);
  const idx = (x, y) => y * W + x;
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const get = (x, y) => (inb(x, y) ? grid[idx(x, y)] : T.MUD);
  const set = (x, y, v) => {
    if (inb(x, y)) grid[idx(x, y)] = v;
  };

  const mid = Math.floor(H / 2);
  const front = [mid - o.nmlHalf, mid + o.nmlHalf]; // [hegemony, concord] y přední linie
  const rearDir = [-1, 1]; // týl hegemonie je nahoře, concordu dole

  // země nikoho
  for (let y = front[0] + 2; y < front[1]; y++) for (let x = 0; x < W; x++) set(x, y, T.NML);

  // krátery (nejdřív, zákopy je pak přeříznou)
  const craters = [];
  const crater = (cx, cy, r) => {
    for (let y = -r; y <= r; y++)
      for (let x = -r; x <= r; x++) {
        const d = Math.hypot(x, y);
        if (d > r + 0.3) continue;
        const t = get(cx + x, cy + y);
        if (t === T.TRENCH) continue;
        set(cx + x, cy + y, r >= 2 && d < r - 1.2 ? T.WATER : T.CRATER);
      }
    craters.push({ x: cx, y: cy, r });
  };
  const nmlCount = Math.floor(W * 0.22);
  for (let i = 0; i < nmlCount; i++) {
    const r = rand() < 0.15 ? 3 + Math.floor(rand() * 2) : 1 + Math.floor(rand() * 2);
    crater(Math.floor(rand() * W), front[0] + 3 + Math.floor(rand() * (front[1] - front[0] - 4)), r);
  }
  for (let i = 0; i < W * 0.05; i++) {
    crater(Math.floor(rand() * W), Math.floor(rand() * H), 1 + Math.floor(rand() * 2));
  }

  // rasterizace zákopu štětcem 2×2
  const paths = []; // {line, faction, pts:[[x,y]...]} v dlaždicích (levý horní roh štětce)
  const carve = (pts, line, faction) => {
    const cells = [];
    for (let i = 0; i < pts.length - 1; i++) {
      let [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx - dy;
      for (;;) {
        set(x0, y0, T.TRENCH); set(x0 + 1, y0, T.TRENCH); set(x0, y0 + 1, T.TRENCH); set(x0 + 1, y0 + 1, T.TRENCH);
        cells.push([x0, y0]);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
      }
    }
    paths.push({ line, faction, pts, cells });
  };

  for (let f = 0; f < 2; f++) {
    const rd = rearDir[f];
    // přední linie: cimbuří (palebné úseky + traverzy)
    {
      const yb = front[f];
      const pts = [[0, yb]];
      let x = 0;
      while (x < W) {
        const bay = 7 + Math.floor(rand() * 4);
        const trav = 3 + Math.floor(rand() * 2);
        const depth = 3;
        pts.push([Math.min(x + bay, W - 1), yb]);
        pts.push([Math.min(x + bay, W - 1), yb + rd * depth]);
        pts.push([Math.min(x + bay + trav, W - 1), yb + rd * depth]);
        pts.push([Math.min(x + bay + trav, W - 1), yb]);
        x += bay + trav;
      }
      carve(pts, 'front', f);
    }
    // podpůrná linie: cikcak
    {
      const yb = front[f] + rd * 17;
      const pts = [];
      for (let x = 0, k = 0; x <= W + 14; x += 14, k++) pts.push([Math.min(x, W - 1), yb + (k % 2 ? 3 : -3) * rd]);
      carve(pts, 'support', f);
    }
    // záložní linie: mírná vlna
    {
      const yb = front[f] + rd * 36;
      const ph = rand() * 10;
      const pts = [];
      for (let x = 0; x <= W; x += 4) pts.push([Math.min(x, W - 1), Math.round(yb + 3 * Math.sin(x / 23 + ph))]);
      carve(pts, 'reserve', f);
    }
    // spojovací zákopy (cikcak dozadu)
    for (let x = 20 + Math.floor(rand() * 20); x < W - 4; x += 34 + Math.floor(rand() * 18)) {
      const y0 = front[f] + rd * 2;
      const y1 = front[f] + rd * 37;
      const pts = [];
      let k = 0;
      for (let y = y0; rd > 0 ? y <= y1 : y >= y1; y += rd * 5, k++) pts.push([x + (k % 2 ? 3 : 0), y]);
      carve(pts, 'comm', f);
    }
  }

  // kryty (dugouty) za podpůrnou linií
  const props = [];
  for (const p of paths) {
    if (p.line !== 'support') continue;
    const rd = rearDir[p.faction];
    for (let i = 10; i < p.cells.length; i += 26 + Math.floor(rand() * 10)) {
      const [cx, cy] = p.cells[i];
      const oy = rd > 0 ? cy + 2 : cy - 2;
      for (let y = 0; y < 2; y++) for (let x = 0; x < 3; x++) set(cx + x, oy + (rd > 0 ? y : -y), T.DUGOUT);
      props.push({ type: 'dugout', x: cx, y: oy, faction: p.faction });
    }
  }

  // pytle s pískem na straně k nepříteli a ostnatý drát před linií
  for (let f = 0; f < 2; f++) {
    const toEnemy = -rearDir[f];
    for (let x = 0; x < W; x++)
      for (let y = 1; y < H - 1; y++) {
        if (get(x, y) !== T.TRENCH) continue;
        const ny = y + toEnemy;
        const nearFront = Math.abs(y - front[f]) <= 4;
        if (nearFront && get(x, ny) !== T.TRENCH && get(x, ny) !== T.DUGOUT) set(x, ny, T.PARAPET);
      }
    const wy = front[f] + toEnemy * 6;
    for (let x = 0; x < W; x++) {
      if (rand() < 0.12) continue; // mezery v drátech
      const jy = wy + (rand() < 0.3 ? toEnemy : 0);
      if (get(x, jy) === T.NML || get(x, jy) === T.CRATER || get(x, jy) === T.MUD) set(x, jy, T.WIRE);
      if (rand() < 0.5 && get(x, jy + toEnemy) !== T.TRENCH) set(x, jy + toEnemy, T.WIRE);
    }
  }

  // mrtvé stromy a trosky
  for (let i = 0; i < W * 0.04; i++) {
    const x = Math.floor(rand() * W), y = Math.floor(rand() * H);
    const t = get(x, y);
    if (t === T.NML || t === T.MUD || t === T.CRATER) props.push({ type: rand() < 0.6 ? 'tree' : 'debris', x, y });
  }

  // polní hřbitovy za záložní linií (řady hrobů)
  for (let f = 0; f < 2; f++) {
    const rd = rearDir[f];
    for (let x = 40 + Math.floor(rand() * 60); x < W - 20; x += 180 + Math.floor(rand() * 120)) {
      const y0 = front[f] + rd * 44;
      for (let r = 0; r < 2 + Math.floor(rand() * 2); r++)
        for (let c = 0; c < 4 + Math.floor(rand() * 4); c++) {
          const gx = x + c * 2, gy = y0 + rd * r * 3;
          if (get(gx, gy) === T.MUD) props.push({ type: 'grave', x: gx, y: gy });
        }
    }
  }

  // sloty pro vojáky
  const slots = [];
  const centerSector = (o.sectors - 1) / 2;
  const linePri = { front: 0, support: 1, comm: 2, reserve: 3 };
  for (const p of paths) {
    const f = p.faction;
    const facingEnemy = f === 0 ? 0 : 4; // hegemonie (nahoře) se dívá na jih, concord na sever
    let last = -999;
    for (let i = 0; i < p.cells.length; i++) {
      const [cx, cy] = p.cells[i];
      if (i - last < o.slotSpacing) continue;
      // jen tam, kde je zákop opravdu průchozí (ne na rohu přes dugout apod.)
      if (get(cx, cy) !== T.TRENCH || get(cx + 1, cy + 1) !== T.TRENCH) continue;
      last = i;
      let d;
      if (p.line === 'front') d = facingEnemy;
      else if (p.line === 'comm') d = rand() < 0.5 ? 0 : 4;
      else d = [0, 2, 6, 0, 1, 7, facingEnemy][Math.floor(rand() * 7)];
      // svislý úsek → jinak se vojáci překrývají; ber jen každý druhý
      const vertical = i > 0 && p.cells[i - 1][0] === cx;
      if (vertical && p.line !== 'comm' && rand() < 0.5) continue;
      const sector = Math.floor(cx / o.sectorW);
      slots.push({
        x: cx * o.tile + 16 + Math.round((rand() - 0.5) * 6),
        y: cy * o.tile + 27, // pata ve spodní řadě zákopu: bližší okraj zakryje boty
        f,
        d,
        line: p.line,
        sector,
        pri: Math.abs(sector - centerSector) * 10 + linePri[p.line],
        cx: Math.abs(cx - (sector + 0.5) * o.sectorW),
      });
    }
  }
  // pořadí plnění: od středového sektoru ven, v sektoru přední linie první
  slots.sort((a, b) => a.pri - b.pri || a.cx - b.cx);
  const byFaction = [slots.filter((s) => s.f === 0), slots.filter((s) => s.f === 1)];
  // trvalé ID místa = pořadí v tomhle (pevném) seznamu; voják si ho nese ve stavu
  byFaction.forEach((list) => list.forEach((s, i) => (s.id = i)));
  for (const list of byFaction) {
    // označení místa: sektor-linie+číslo úseku zleva, např. "D-F12" (sektor D, přední linie, 12. úsek)
    const counters = {};
    [...list].sort((a, b) => a.x - b.x).forEach((s) => {
      const key = s.sector + s.line;
      counters[key] = (counters[key] || 0) + 1;
      s.label = `${sectorName(s.sector)}-${s.line[0].toUpperCase()}${Math.ceil(counters[key] / 4)}`;
    });
  }

  return { ...o, W, H, grid, front, paths, props, craters, slots: byFaction };
}

export const SECTOR_NAMES = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

export function sectorName(i) {
  return i < SECTOR_NAMES.length ? SECTOR_NAMES[i] : SECTOR_NAMES[Math.floor(i / SECTOR_NAMES.length) - 1] + SECTOR_NAMES[i % SECTOR_NAMES.length];
}

// Otevřené sektory: n sektorů kolem středu → rozsah indexů [from, to)
export function openRange(map, n) {
  const c = Math.floor(map.sectors / 2);
  const from = Math.max(0, c - Math.ceil(n / 2));
  return [from, Math.min(map.sectors, from + n)];
}
