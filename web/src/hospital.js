// Nemocnice na mapě: za podpůrnou linií každé strany. Spodní vrstva (val z pytlů, podlaha, lůžka, lampa, bedna)
// a plachta nahoře, která se při přiblížení odkryje (alpha podle zoomu). Na lůžkách leží skuteční ranění hráči,
// kdo se nevešel, leží na nosítkách před vchodem. Bez postavené nemocnice je jen menší obvaziště (2 lůžka).
// Vše se kreslí do plátna v herní paletě (stejný vzor pytlů jako terrain.js), žádné nové soubory.
import { Container, Sprite, Texture } from 'pixi.js';
import { PAL } from './terrain.js';

const col = (i, a = 1) => `rgba(${PAL[i].join(',')},${a})`;
const h2 = (x, y, s = 0) => {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
function sandbag(x, y) {
  const r = h2(x, y, 3), row = Math.floor(y / 5), bx = (((x + (row % 2 ? 4 : 0)) % 8) + 8) % 8, by = ((y % 5) + 5) % 5;
  if (by === 4) return 0;
  if (bx === 0) return by === 0 ? 0 : 1;
  if ((bx === 1 || bx === 7) && by === 0) return 2;
  if (by === 0) return r < 0.6 ? 8 : 7;
  if (by === 1) return bx === 1 ? 6 : 7;
  if (by === 3) return 5;
  return r < 0.85 ? 6 : 7;
}

// rozměry v pixelech světa; entrance: 1 = vchod dole (k přední linii Hegemonie), -1 = nahoře (Concord)
export function hospitalArt({ beds = 4, faction = 0, entrance = 1 }) {
  const cots = beds; // 4 = nemocnice, 2 = obvaziště
  const W = cots >= 4 ? 112 : 100, H = cots >= 4 ? 80 : 54, wall = 6, door = 20;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  const px = (x, y, i) => { g.fillStyle = col(i); g.fillRect(x, y, 1, 1); };
  // podlaha: udusaná hlína a fošny
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) px(x, y, h2(x >> 1, y >> 1, 5) < 0.5 ? 2 : 3);
  for (let y = wall + 2; y < H - wall - 2; y += 6) {
    g.fillStyle = col(4); g.fillRect(wall + 2, y, W - 2 * wall - 4, 4);
    g.fillStyle = col(5); g.fillRect(wall + 2, y, W - 2 * wall - 4, 1);
    for (let x = wall + 2 + (y % 12 ? 7 : 15); x < W - wall - 2; x += 18) px(x, y + 1, 2);
  }
  // val z pytlů kolem dokola, vchod na straně k frontě
  const doorX0 = (W - door) / 2, doorY = entrance > 0 ? H - wall : 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const edge = x < wall || x >= W - wall || y < wall || y >= H - wall;
    if (!edge) continue;
    if (y >= doorY && y < doorY + wall && x >= doorX0 && x < doorX0 + door) continue;
    px(x, y, sandbag(x, y));
  }
  g.fillStyle = col(0, 0.5); // stín valu dovnitř
  g.fillRect(wall, wall, W - 2 * wall, 2);
  // lůžka: rám, plachtovina, polštář (2 sloupce, uprostřed ulička)
  const slots = [];
  const cw = 34, ch = 15;
  const colsX = [wall + 6, W - wall - 6 - cw];
  const rows = cots >= 4 ? [wall + 8, H - wall - 10 - ch - (entrance > 0 ? 6 : 0)] : [Math.round(H / 2 - ch / 2)];
  if (entrance < 0 && cots >= 4) rows[0] += 6;
  for (const y of rows) for (const x of colsX) {
    g.fillStyle = col(1); g.fillRect(x, y + ch - 1, cw, 2); // stín
    g.fillStyle = col(3); g.fillRect(x, y, cw, ch);
    g.fillStyle = col(8); g.fillRect(x + 2, y + 2, cw - 4, ch - 4);
    g.fillStyle = col(7); g.fillRect(x + 2, y + ch - 4, cw - 4, 2);
    g.fillStyle = col(9); g.fillRect(x + 3, y + 3, 7, ch - 6); // polštář
    px(x, y, 1); px(x + cw - 1, y, 1); px(x, y + ch - 1, 1); px(x + cw - 1, y + ch - 1, 1);
    slots.push({ x: x + cw / 2 + 2, y: y + ch / 2 + 1 });
  }
  // lampa, bedna s červeným křížem, kbelík
  const mx = W / 2, my = H / 2;
  g.fillStyle = 'rgba(217,143,63,0.18)';
  g.beginPath(); g.arc(mx, my, 16, 0, Math.PI * 2); g.fill();
  g.fillStyle = col(23); g.fillRect(mx - 1, my - 1, 3, 3);
  px(mx, my, 9);
  const bx = W - wall - 14, byy = entrance > 0 ? wall + 1 : H - wall - 11;
  g.fillStyle = col(9); g.fillRect(bx, byy, 10, 9);
  g.fillStyle = col(19); g.fillRect(bx + 4, byy + 1, 2, 7); g.fillRect(bx + 1, byy + 3, 8, 2);
  g.fillStyle = col(15); g.fillRect(wall + 2, entrance > 0 ? wall + 1 : H - wall - 7, 6, 6);
  // nosítka před vchodem (místa pro raněné, na které nezbylo lůžko)
  const stretchers = [];
  for (let i = 0; i < 6; i++) {
    const sx = W / 2 + (i % 2 ? 1 : -1) * (22 + Math.floor(i / 2) * 36) - (i % 2 ? 0 : 0);
    stretchers.push({ x: sx, y: entrance > 0 ? H + 12 : -12 });
  }

  // plachta: celá střecha s přesahem, záhyby, provazy ke kolíkům, červený kříž
  const R = 8;
  const r = document.createElement('canvas');
  r.width = W + 2 * R;
  r.height = H + 2 * R;
  const t = r.getContext('2d');
  const tp = (x, y, i, a = 1) => { t.fillStyle = col(i, a); t.fillRect(x, y, 1, 1); };
  const [c0, c1, c2] = faction === 0 ? [14, 15, 16] : [11, 12, 13];
  for (let y = 4; y < r.height - 4; y++) for (let x = 4; x < r.width - 4; x++) {
    const fold = Math.sin((x + y * 0.15) / 7) * 0.5 + 0.5;
    const n = h2(x >> 1, y >> 1, 9);
    tp(x, y, fold > 0.75 ? c2 : fold < 0.2 || n < 0.08 ? c0 : c1);
  }
  t.fillStyle = col(1);
  t.fillRect(4, 4, r.width - 8, 1); t.fillRect(4, r.height - 5, r.width - 8, 1);
  t.fillRect(4, 4, 1, r.height - 8); t.fillRect(r.width - 5, 4, 1, r.height - 8);
  t.fillStyle = col(0, 0.35);
  t.fillRect(5, r.height - 7, r.width - 10, 2); // spodní lem ve stínu
  // hřeben střechy
  t.fillStyle = col(c2); t.fillRect(4, Math.round(r.height / 2) - 1, r.width - 8, 1);
  t.fillStyle = col(c0); t.fillRect(4, Math.round(r.height / 2), r.width - 8, 1);
  // provazy a kolíky
  for (const [x0, y0, x1, y1] of [[4, 4, 0, 0], [r.width - 5, 4, r.width - 1, 0], [4, r.height - 5, 0, r.height - 1], [r.width - 5, r.height - 5, r.width - 1, r.height - 1]]) {
    for (let k = 0; k <= 4; k++) tp(Math.round(x0 + (x1 - x0) * k / 4), Math.round(y0 + (y1 - y0) * k / 4), 6);
    tp(x1, y1, 3);
  }
  // červený kříž v bílém poli
  const cx = Math.round(r.width / 2), cy = Math.round(r.height / 2);
  const s = cots >= 4 ? 13 : 10;
  t.fillStyle = col(9); t.fillRect(cx - s, cy - s, 2 * s, 2 * s);
  t.fillStyle = col(8); t.fillRect(cx - s, cy + s - 1, 2 * s, 1);
  t.fillStyle = col(19);
  const a = Math.round(s * 0.32), b = Math.round(s * 0.8);
  t.fillRect(cx - a, cy - b, 2 * a, 2 * b); t.fillRect(cx - b, cy - a, 2 * b, 2 * a);
  return { base: Texture.from(c), roof: Texture.from(r), W, H, R, slots, stretchers };
}

// Postaví nemocnice obou stran. sites: [{ faction, x, y, beds, entrance }]. Vrací vrstvy a pozice lůžek/nosítek.
export function buildHospitals(sites) {
  const base = new Container(), roofs = new Container();
  const out = [];
  for (const site of sites) {
    const art = hospitalArt(site);
    const b = new Sprite(art.base);
    b.x = Math.round(site.x - art.W / 2);
    b.y = Math.round(site.y - art.H / 2);
    base.addChild(b);
    const r = new Sprite(art.roof);
    r.x = b.x - art.R;
    r.y = b.y - art.R;
    roofs.addChild(r);
    out.push({
      ...site,
      roof: r,
      beds: art.slots.map((p) => ({ x: b.x + p.x, y: b.y + p.y })),
      stretchers: art.stretchers.map((p) => ({ x: b.x + p.x, y: b.y + p.y })),
    });
  }
  return { base, roofs, sites: out };
}

// plachta se odkryje při přiblížení (zoom od `from` do `to`)
export function roofAlpha(zoom, from = 2.4, to = 3.2) {
  return Math.max(0, Math.min(1, (to - zoom) / (to - from)));
}
