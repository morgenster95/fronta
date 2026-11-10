// Nemocnice na mapě: za podpůrnou linií každé strany. Spodní vrstva (val z pytlů, podlaha, lůžka, lampa, bedna)
// a plachta nahoře, která se při přiblížení odkryje (alpha podle zoomu). Na lůžkách leží skuteční ranění hráči,
// kdo se nevešel, leží na nosítkách před vchodem. Bez postavené nemocnice je jen menší obvaziště (2 lůžka).
// Postavená nemocnice (hlasování HOSPITAL) je větší hluboký dugout dál v týlu za zálohami (dugoutArt), se střechou z vlnitého plechu.
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

// rozměry nemocnice podle počtu lůžek (pro umístění na mapě a spojovací zákop)
export const hospitalSize = (beds) => (beds >= 4 ? { W: 168, H: 104 } : { W: 100, H: 54 });

// rozměry v pixelech světa; entrance: 1 = vchod dole (k přední linii Hegemonie), -1 = nahoře (Concord)
export function hospitalArt({ beds = 4, faction = 0, entrance = 1 }) {
  if (beds >= 4) return dugoutArt({ faction, entrance });
  const cots = beds; // 2 = obvaziště (stan s plachtou); 4 = nemocniční dugout (dugoutArt)
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

// --- nemocniční dugout (staví se hlasováním): hluboký kryt za zálohami, roubený trámy, 4 lůžka, operační stůl pod lampou,
// kamínka s rourou, police s obvazy, schody dolů z vchodu. Nahoře zaoblená vlnitá plechová střecha zasypaná hlínou a pytli,
// komín, bílé pole s červeným křížem a pruh plachtoviny v barvě strany. Kreslí se pro vchod dole a pro vchod nahoře se překlopí.
function dugoutArt({ faction = 0, entrance = 1 }) {
  const { W, H } = hospitalSize(4), wall = 8, door = 24;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const px = (x, y, i, a = 1) => { g.fillStyle = col(i, a); g.fillRect(x, y, 1, 1); };
  const rect = (x, y, w, h, i, a = 1) => { g.fillStyle = col(i, a); g.fillRect(x, y, w, h); };
  // podlaha: fošny (duckboards) přes udusanou hlínu
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) px(x, y, h2(x >> 1, y >> 1, 15) < 0.5 ? 1 : 2);
  for (let x = wall + 2; x < W - wall - 2; x += 7) {
    rect(x, wall + 2, 5, H - 2 * wall - 4, 4);
    rect(x, wall + 2, 1, H - 2 * wall - 4, 5);
    for (let y = wall + 6 + (x % 14 ? 0 : 9); y < H - wall - 2; y += 18) rect(x, y, 5, 1, 3); // příčky
  }
  // val: pytle venku, uvnitř roubení z trámů (svislé kůly, vodorovná prkna)
  const doorX0 = Math.round((W - door) / 2);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const edge = x < wall || x >= W - wall || y < wall || y >= H - wall;
    if (!edge) continue;
    if (y >= H - wall && x >= doorX0 && x < doorX0 + door) continue;
    px(x, y, sandbag(x, y));
  }
  const iw = 3; // roubení
  rect(wall, wall, W - 2 * wall, iw, 3); rect(wall, wall + iw - 1, W - 2 * wall, 1, 1);
  rect(wall, wall, iw, H - 2 * wall, 3); rect(W - wall - iw, wall, iw, H - 2 * wall, 3);
  rect(wall, H - wall - iw, doorX0 - wall, iw, 3); rect(doorX0 + door, H - wall - iw, W - wall - doorX0 - door, iw, 3);
  for (let x = wall; x < W - wall; x += 24) { rect(x, wall, 4, 4, 5); rect(x + 1, wall + 1, 2, 2, 6); rect(x, H - wall - 4, 4, 4, 5); rect(x + 1, H - wall - 3, 2, 2, 6); }
  for (let y = wall + 24; y < H - wall - 8; y += 24) { rect(wall, y, 4, 4, 5); rect(wall + 1, y + 1, 2, 2, 6); rect(W - wall - 4, y, 4, 4, 5); rect(W - wall - 3, y + 1, 2, 2, 6); }
  rect(wall + iw, wall + iw, W - 2 * (wall + iw), 2, 0, 0.45); // stín pod stropem
  // schody dolů ve vchodu (stupně z prken) a závěs proti plynu
  for (let k = 0; k < 4; k++) { rect(doorX0, H - wall + k * 2, door, 1, k % 2 ? 4 : 5); rect(doorX0, H - wall + k * 2 + 1, door, 1, 2); }
  rect(doorX0 + 1, H - wall - iw, door - 2, 2, faction === 0 ? 15 : 12); // srolovaný závěs
  rect(doorX0 + 1, H - wall - iw + 2, door - 2, 1, 1);
  // lůžka: 2 vlevo, 2 vpravo; rám, prostěradlo, deka v barvě strany, polštář
  const blanket = faction === 0 ? [14, 15] : [11, 12];
  const cw = 36, ch = 15, slots = [];
  const colsX = [wall + iw + 5, W - wall - iw - 5 - cw];
  const rows = [wall + iw + 9, H - wall - iw - 10 - ch - 4];
  for (const y of rows) for (const [ci, x] of colsX.entries()) {
    rect(x, y + ch - 1, cw, 2, 0, 0.6);
    rect(x, y, cw, ch, 3);
    rect(x + 2, y + 2, cw - 4, ch - 4, 8);
    const bx = ci === 0 ? x + 13 : x + 2; // deka přes nohy (polštář u zdi)
    rect(bx, y + 2, cw - 15, ch - 4, blanket[0]); rect(bx, y + 2, cw - 15, 1, blanket[1]);
    const pxx = ci === 0 ? x + 3 : x + cw - 10;
    rect(pxx, y + 3, 7, ch - 6, 9);
    px(x, y, 1); px(x + cw - 1, y, 1); px(x, y + ch - 1, 1); px(x + cw - 1, y + ch - 1, 1);
    slots.push({ x: x + cw / 2 + 2, y: y + ch / 2 + 1 });
  }
  // operační stůl uprostřed pod lampou: bílé plátno, tác s nástroji, kbelík
  const mx = Math.round(W / 2), my = Math.round(H / 2) - 4;
  g.fillStyle = 'rgba(217,143,63,0.16)';
  g.beginPath(); g.arc(mx, my, 26, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(217,143,63,0.12)';
  g.beginPath(); g.arc(mx, my, 15, 0, Math.PI * 2); g.fill();
  rect(mx - 15, my - 6, 30, 14, 0, 0.5);
  rect(mx - 15, my - 7, 30, 13, 5);
  rect(mx - 14, my - 6, 28, 11, 9);
  rect(mx - 14, my + 4, 28, 1, 8);
  px(mx + 4, my - 1, 18); px(mx + 5, my, 18); px(mx + 3, my + 1, 19);
  rect(mx + 17, my - 4, 7, 5, 16); px(mx + 18, my - 3, 9); px(mx + 20, my - 2, 9); px(mx + 22, my - 3, 9); // tác
  rect(mx - 23, my + 1, 5, 5, 15); rect(mx - 22, my + 2, 3, 1, 17); // kbelík
  rect(mx - 1, my - 15, 3, 3, 23); px(mx, my - 14, 9); // lampa na trámu
  rect(mx, my - 19, 1, 4, 5);
  // kamínka s rourou (u zadní stěny), žhavý otvor
  const sx = mx + 34, sy = wall + iw + 2;
  rect(sx, sy, 10, 9, 17); rect(sx + 1, sy + 1, 8, 1, 15);
  rect(sx + 3, sy + 5, 4, 2, 23); px(sx + 4, sy + 5, 9);
  rect(sx + 4, sy - 3, 3, 3, 15);
  g.fillStyle = 'rgba(217,143,63,0.14)'; g.beginPath(); g.arc(sx + 5, sy + 6, 10, 0, Math.PI * 2); g.fill();
  // police s obvazy a lahvičkami, bedna s červeným křížem
  const shx = mx - 44, shy = wall + iw + 1;
  rect(shx, shy, 22, 6, 4); rect(shx, shy + 5, 22, 1, 1);
  for (let k = 0; k < 6; k++) rect(shx + 1 + k * 3.5, shy + 1, 2, 3, [9, 17, 13, 9, 20, 9][k]);
  const cbx = mx + 26, cby = H - wall - iw - 13;
  rect(cbx, cby, 12, 10, 9); rect(cbx, cby + 9, 12, 1, 7);
  rect(cbx + 5, cby + 1, 2, 8, 19); rect(cbx + 2, cby + 4, 8, 2, 19);
  rect(mx - 40, H - wall - iw - 12, 14, 9, 5); rect(mx - 40, H - wall - iw - 12, 14, 1, 6); // bedna se zásobami
  // srolovaná nosítka opřená u vchodu
  rect(doorX0 - 9, H - wall - iw - 16, 3, 14, 6); rect(doorX0 - 5, H - wall - iw - 16, 3, 14, 13);
  // nosítka před vchodem (pro raněné bez lůžka)
  const stretchers = [];
  for (let i = 0; i < 6; i++) stretchers.push({ x: W / 2 + (i % 2 ? 1 : -1) * (30 + Math.floor(i / 2) * 36), y: H + 12 });

  // střecha: zaoblený vlnitý plech, okraje zasypané hlínou a pytli, komín, kříž, pruh plachty v barvě strany
  const R = 10;
  const r = document.createElement('canvas');
  r.width = W + 2 * R; r.height = H + 2 * R;
  const t = r.getContext('2d');
  const tp = (x, y, i, a = 1) => { t.fillStyle = col(i, a); t.fillRect(x, y, 1, 1); };
  const RW = r.width, RH = r.height;
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
    const ex = Math.min(x, RW - 1 - x), ey = Math.min(y, RH - 1 - y);
    const e = Math.min(ex, ey) + (h2(x >> 1, y >> 1, 21) - 0.5) * 3;
    if (e < 1) continue;
    if (e < 4) { tp(x, y, h2(x, y, 22) < 0.5 ? 2 : 3); continue; } // hlína přes okraj
    if (e < 12) { tp(x, y, sandbag(x, y + 2)); continue; } // pytle kolem střechy
    // vlnitý plech: svislé vlny, zaoblení = tmavší k horní a dolní hraně
    const k = Math.abs((y - RH / 2) / (RH / 2 - 12));
    const ridge = x % 4;
    let i = ridge === 0 ? 15 : ridge === 3 ? 17 : 14;
    if (k > 0.7) i = ridge === 0 ? 14 : 17;
    if (k > 0.9) i = 1;
    const rust = h2(x >> 3, y >> 3, 23);
    if (rust < 0.08 && h2(x, y, 26) < 0.45) i = rust < 0.03 ? 19 : 18; // rezavé skvrny po deštích
    tp(x, y, i);
  }
  // hlína a pár pytlů nahozených na plechu (maskování)
  for (const [x0, y0, w0, h0] of [[24, 18, 18, 8], [RW - 52, RH - 28, 22, 9], [RW - 40, 20, 14, 6], [30, RH - 30, 12, 7]])
    for (let y = y0; y < y0 + h0; y++) for (let x = x0; x < x0 + w0; x++) if (h2(x, y, 24) < 0.8) tp(x, y, h2(x >> 1, y >> 1, 25) < 0.5 ? 2 : 3);
  for (const [x0, y0] of [[RW - 60, 30], [44, RH - 38]]) for (let y = 0; y < 10; y++) for (let x = 0; x < 16; x++) tp(x0 + x, y0 + y, sandbag(x, y));
  // pruh plachtoviny v barvě strany přes hřeben
  const [c0, c1, c2] = faction === 0 ? [14, 15, 16] : [11, 12, 13];
  for (let y = Math.round(RH / 2) - 5; y < Math.round(RH / 2) + 5; y++) for (let x = 14; x < RW - 14; x++) {
    const fold = Math.sin(x / 6) * 0.5 + 0.5;
    tp(x, y, fold > 0.8 ? c2 : fold < 0.15 ? c0 : c1);
  }
  t.fillStyle = col(0, 0.35); t.fillRect(14, Math.round(RH / 2) + 5, RW - 28, 1);
  // komín z kamínek se slabým kouřem
  const chx = R + sx + 5, chy = R + sy - 2;
  t.fillStyle = col(1); t.fillRect(chx - 2, chy - 2, 5, 5);
  t.fillStyle = col(15); t.fillRect(chx - 1, chy - 1, 3, 3);
  t.fillStyle = col(0); t.fillRect(chx, chy, 1, 1);
  for (let k = 1; k < 6; k++) { t.fillStyle = col(7, 0.32 - k * 0.05); t.fillRect(chx + Math.round(Math.sin(k) * 2) - 1, chy - k * 3, 3, 2); }
  // bílé pole s červeným křížem (vidět ze vzduchu: dělostřelci ho mají šetřit)
  const cx = Math.round(RW / 2), cy = Math.round(RH / 2), s = 15;
  t.fillStyle = col(1); t.fillRect(cx - s - 1, cy - s - 1, 2 * s + 2, 2 * s + 2);
  t.fillStyle = col(9); t.fillRect(cx - s, cy - s, 2 * s, 2 * s);
  t.fillStyle = col(8); t.fillRect(cx - s, cy + s - 2, 2 * s, 2);
  t.fillStyle = col(19);
  const a = 5, b = 12;
  t.fillRect(cx - a, cy - b, 2 * a, 2 * b); t.fillRect(cx - b, cy - a, 2 * b, 2 * a);
  // kolíky s provazy v rozích
  for (const [x1, y1] of [[1, 1], [RW - 2, 1], [1, RH - 2], [RW - 2, RH - 2]]) { tp(x1, y1, 3); tp(x1 + Math.sign(RW / 2 - x1), y1 + Math.sign(RH / 2 - y1), 6); }

  if (entrance < 0) { // vchod nahoře: překlopit obraz i pozice
    const flip = (src) => { const o = document.createElement('canvas'); o.width = src.width; o.height = src.height; const og = o.getContext('2d'); og.translate(0, src.height); og.scale(1, -1); og.drawImage(src, 0, 0); return o; };
    const fb = flip(c), fr = flip(r);
    return { base: Texture.from(fb), roof: Texture.from(fr), W, H, R, slots: slots.map((p) => ({ x: p.x, y: H - p.y })), stretchers: stretchers.map((p) => ({ x: p.x, y: H - p.y })) };
  }
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
