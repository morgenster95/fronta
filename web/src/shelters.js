// NÁVRH (23. 11., jen dev náhled /?shelters=1): úkryty, kde vojáci spí, jako součást fronty.
//  • přední linie: vchod do krytu v hliněné stěně (trámový rám, deka proti plynu, pytle nahoře),
//  • podpůrná linie: obloukový kryt z vlnitého plechu obložený pytli („elephant shelter“),
//  • zálohy: stan.
// Perspektiva jako u bunkrů: vchod je vždy odvrácený od nepřítele. Concord vidíme zezadu → vchody k nám; Hegemonie se dívá k nám → vidíme záda úkrytů.
// Na jeden úkryt ~28 vojáků stejné linie (nejbližší podle x). Klik ukáže panel: jméno úkrytu, kolik tu spí, oblasti světa, ze kterých jsou (vybírá se v účtu).
// Oblasti jsou v náhledu smyšlené (hash jména); naostro by byly z profilu hráče.
import { Container, Sprite, Texture, Graphics } from 'pixi.js';

const P = { ink: '#0e0d0c', dark: '#1c1a17', mud0: '#2b2722', mud1: '#3d3730', mud2: '#524a3f', mud3: '#6b6152', sand: '#857a68', bone: '#a39782', pale: '#c4b8a0', white: '#e3d9c3',
  ol0: '#3a3b2c', ol1: '#545639', ol2: '#6f7148', ol3: '#8c8a5c', st0: '#4a4f52', st1: '#666d70', st2: '#8a9295', st3: '#2a3138', blood: '#5c2a22', rust: '#7e3b2a', rust2: '#a85a36', acid: '#9fa640', yellow: '#c9c26a', ochre: '#d98f3f' };
const CLOTH = [{ hi: P.st2, mid: P.st1, lo: P.st0 }, { hi: P.ol3, mid: P.ol2, lo: P.ol1 }];

function canvas(W, H, draw) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const px = (x, y, w = 1, h = 1, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  draw(px, g);
  const t = Texture.from(c); t.source.scaleMode = 'nearest';
  return t;
}
// pytel: zaoblený, světlo shora, spára dole
function bag(px, x, y, w = 6, col = P.sand) {
  px(x + 1, y, w - 2, 1, P.pale); px(x, y + 1, w, 2, col); px(x + 1, y + 3, w - 2, 1, P.mud2); px(x + w - 1, y + 1, 1, 2, P.mud3);
}
function earth(px, x0, y0, x1, y1, seed = 1) {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) px(x, y, 1, 1, ((x * 7 + y * 13 + seed) % 9) < 2 ? P.mud2 : ((x + y * 3 + seed) % 11) === 0 ? P.mud0 : P.mud1);
}

// --- přední linie: vchod do krytu (Concord: vchod; Hegemonie: násyp zezadu s kouřovodem) ---
function dugoutFront(f, seed) {
  const cl = CLOTH[f];
  return canvas(32, 28, (px) => {
    earth(px, 1, 6, 31, 28, seed);
    for (let i = 0; i < 5; i++) bag(px, 1 + i * 6, 3, 6, i % 2 ? P.bone : P.sand);
    for (let i = 0; i < 4; i++) bag(px, 4 + i * 6, 0, 6, i % 2 ? P.sand : P.bone);
    // trámový rám
    px(9, 8, 3, 20, P.mud3); px(20, 8, 3, 20, P.mud3); px(8, 7, 16, 3, P.mud3);
    px(8, 7, 16, 1, P.bone); px(9, 10, 1, 18, P.sand); px(20, 10, 1, 18, P.sand);
    px(12, 10, 8, 18, P.ink);                                   // tma uvnitř
    for (let k = 0; k < 3; k++) px(12, 23 + k * 2, 8, 1, k % 2 ? P.mud0 : P.mud1); // schody dolů
    // deka proti plynu: srolovaná nahoře, polovina visí
    px(12, 10, 8, 2, cl.hi); px(12, 11, 8, 1, cl.lo);
    for (let y = 12; y < 22; y++) px(12, y, 3 + (y % 3 === 0 ? 1 : 0), 1, y % 2 ? cl.mid : cl.lo);
    // cedulka se jménem na stěně + lucerna
    px(24, 11, 7, 5, P.mud3); px(24, 11, 7, 4, P.pale); px(25, 12, 5, 1, P.mud2); px(25, 14, 3, 1, P.mud2);
    px(6, 12, 2, 3, P.ochre); px(6, 11, 2, 1, P.ink); px(6, 15, 2, 1, P.ink);
  });
}
function dugoutBack(f, seed) {
  return canvas(32, 22, (px) => {
    // nízký násyp porostlý blátem, navrchu pytle, kouřovod a větrák
    for (let y = 8; y < 22; y++) { const half = Math.round(15 - Math.max(0, 12 - y) * 0.6); earth(px, 16 - half, y, 16 + half, y + 1, seed); }
    for (let i = 0; i < 4; i++) bag(px, 4 + i * 6, 6, 6, i % 2 ? P.bone : P.sand);
    for (let i = 0; i < 3; i++) bag(px, 7 + i * 6, 3, 6, i % 2 ? P.sand : P.bone);
    px(22, 0, 2, 6, P.st1); px(22, 0, 1, 6, P.st2); px(21, 0, 4, 1, P.st0); // kouřovod
    px(8, 12, 4, 2, P.ink); px(8, 11, 4, 1, P.mud3);                       // větrací otvor
  });
}
// --- podpůrná linie: oblouk z vlnitého plechu obložený pytli ---
function elephantFront(f, seed) {
  const cl = CLOTH[f];
  return canvas(46, 30, (px) => {
    const cx = 23, by = 29;
    for (let y = 0; y < 30; y++) for (let x = 0; x < 46; x++) {
      const d = Math.hypot(x + 0.5 - cx, (y + 0.5 - by) * 1.15);
      if (d > 21 || y > 28) continue;
      if (d > 16.5) { // pytle kolem oblouku (řady podle vzdálenosti)
        const row = Math.floor((d - 16.5) / 2.2), seg = Math.floor((Math.atan2(y - by, x - cx) * 7 + row * 1.5));
        px(x, y, 1, 1, (d - 16.5) % 2.2 < 0.7 ? P.pale : seg % 2 ? P.bone : P.sand);
        if ((d - 16.5) % 2.2 > 1.8) px(x, y, 1, 1, P.mud2);
      } else if (d > 14) { // čelo plechového oblouku: žebra
        const a = Math.atan2(y - by, x - cx); px(x, y, 1, 1, Math.floor(a * 9) % 2 ? P.st1 : P.st2);
        if (d > 16) px(x, y, 1, 1, P.st0);
      } else { // vnitřek: tma, zadní stěna, lavice
        px(x, y, 1, 1, d > 12.5 ? P.st3 : P.ink);
      }
    }
    px(14, 23, 18, 2, P.mud3); px(14, 23, 18, 1, P.sand);             // lavice / pryčna
    for (let y = 16; y < 28; y++) px(9 + (y % 2), y, 5, 1, y % 3 ? cl.mid : cl.lo); // plachta přes půlku vchodu
    px(9, 15, 7, 1, cl.hi);
    px(0, 28, 46, 2, P.mud1); px(16, 28, 14, 1, P.mud2);            // práh
    px(19, 1, 9, 5, P.mud3); px(19, 1, 9, 4, P.pale); px(20, 2, 7, 1, P.mud2); px(20, 4, 4, 1, P.mud2); // cedulka
  });
}
function elephantBack(f, seed) {
  return canvas(46, 26, (px) => {
    const cx = 23, by = 25;
    for (let y = 0; y < 26; y++) for (let x = 0; x < 46; x++) {
      const d = Math.hypot(x + 0.5 - cx, (y + 0.5 - by) * 1.2);
      if (d > 21) continue;
      const row = Math.floor(d / 2.3), seg = Math.floor(x / 6 + row * 0.5);
      px(x, y, 1, 1, d % 2.3 < 0.7 ? P.pale : seg % 2 ? P.bone : P.sand);
      if (d % 2.3 > 1.9) px(x, y, 1, 1, P.mud2);
    }
    for (let x = 14; x < 32; x++) px(x, 3, 1, 3, x % 2 ? P.st1 : P.st2); // vykukující plech na hřebeni
    px(30, 0, 2, 5, P.st1); px(29, 0, 4, 1, P.st0);                         // kouřovod
  });
}
// --- zálohy: stan (Concord: otevřený vchod; Hegemonie: zadní stěna) ---
function tent(f, seed, open) {
  const cl = CLOTH[f];
  return canvas(36, 30, (px) => {
    const ax = 18, ay = 2, by = 27, hw = 15;
    for (let y = ay; y <= by; y++) {
      const half = Math.round((y - ay) / (by - ay) * hw);
      for (let x = ax - half; x <= ax + half; x++) {
        const side = x < ax ? cl.hi : cl.mid;
        px(x, y, 1, 1, (x - ax + 40) % 6 === 0 ? cl.lo : side); // švy
        if (x === ax - half || x === ax + half) px(x, y, 1, 1, P.dark);
      }
    }
    if (open) { // vchod: tmavý trojúhelník, odhrnuté chlopně
      for (let y = 12; y <= by; y++) { const h = Math.round((y - 12) / (by - 12) * 5); px(ax - h, y, h * 2 + 1, 1, P.ink); px(ax - h - 2, y, 2, 1, cl.lo); px(ax + h + 1, y, 2, 1, P.pale); }
    } else { px(ax, 6, 1, by - 6, cl.lo); }
    px(ax, 0, 1, 3, P.mud3); px(ax, 0, 1, 1, P.bone);                    // tyč nad špičkou
    // kotevní lana a kolíky
    for (let k = 0; k < 6; k++) { px(ax - 16 + k, 22 + k, 1, 1, P.mud3); px(ax + 16 - k, 22 + k, 1, 1, P.mud3); }
    px(ax - 17, 27, 1, 2, P.sand); px(ax + 17, 27, 1, 2, P.sand);
    px(2, by + 1, 32, 1, P.mud2);
  });
}

// --- oblasti světa: malé praporky 11 × 7 (kreslené po pixelech, souměrné symboly) ---
export const REGIONS = [
  { id: 'na', name: 'North America', field: P.st3, sym: P.white, mark: ['..#..', '#####', '.###.', '.#.#.'] },
  { id: 'la', name: 'Latin America', field: P.ol2, sym: P.yellow, mark: ['#.#.#', '.###.', '#####', '.###.', '#.#.#'] },
  { id: 'eu', name: 'Europe', field: P.rust, sym: P.ochre, mark: ['.###.', '#...#', '#...#', '#...#', '.###.'] },
  { id: 'af', name: 'Africa', field: P.ochre, sym: P.dark, mark: ['.###.', '#####', '..#..', '..#..'] },
  { id: 'me', name: 'Middle East', field: P.sand, sym: P.ol1, mark: ['#.#.#', '.###.', '..#..', '..#..', '..#..'] },
  { id: 'as', name: 'Asia', field: P.white, sym: P.rust, mark: ['..#..', '.###.', '#####'] },
  { id: 'oc', name: 'Oceania', field: P.st0, sym: P.white, mark: ['..#..', '#...#', '.....', '..#..'] },
];
export function pennant(r, scale = 1) {
  const c = document.createElement('canvas'); c.width = 13 * scale; c.height = 9 * scale;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x * scale, y * scale, w * scale, h * scale); };
  px(0, 0, 13, 9, P.dark); px(1, 1, 11, 7, r.field);
  const m = r.mark, ox = 1 + Math.floor((11 - m[0].length) / 2), oy = 1 + Math.floor((7 - m.length) / 2);
  m.forEach((row, j) => [...row].forEach((ch, i) => ch === '#' && px(ox + i, oy + j, 1, 1, r.sym)));
  return c;
}

const NAMES = [
  ['Iron Rest', 'The Cellar', 'Steel Nest', 'Quiet Hall', 'Old Barracks', 'The Vault', 'Grey House', 'Post Eleven', 'The Crypt', 'Winter Rooms', 'The Anvil', 'Last Lamp'],
  ['The Ritz', 'Rat Hall', 'Mole End', 'Home Sweet Home', 'The Kennel', 'Muddy Arms', 'Little Paris', 'The Nook', 'Cheer Up Villa', 'The Ark', 'Rose Cottage', 'Hotel Mud'],
];
const LORE = {
  front: 'A hole in the trench wall, timber at the door and a wet blanket against the gas. Men sleep sitting up here.',
  support: 'Curved iron sheets under three rows of sandbags. Dry, mostly. The stove is the only warm thing for a mile.',
  reserve: 'Canvas and rope behind the lines. Here a man can lie flat and almost forget the guns.',
};
const hash = (s) => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
// náhled: smyšlená oblast (~40 % hráčů ji vyplní); naostro z profilu
const fakeRegion = (handle) => { const h = hash(handle || ''); if (h % 100 >= 40) return null; const w = (h >> 8) % 100; return w < 42 ? 'na' : w < 66 ? 'eu' : w < 78 ? 'la' : w < 88 ? 'as' : w < 93 ? 'oc' : w < 97 ? 'af' : 'me'; };

export function initShelters({ world, anchor, map, soldiers, theme, openX0, openX1, openCard, hospitals }) {
  const busy = (f, x, y) => (hospitals?.sites || []).some((h) => h.faction === f && Math.abs(h.x - x) < 420 && Math.abs(h.y - y) < 260); // obvaziště a sklad nechat volné
  const layer = new Container(); world.addChildAt(layer, world.getChildIndex(anchor) + 1);
  const shelters = [];
  const lines = [['front', 22, 24, (f, s) => (f === 1 ? dugoutFront(f, s) : dugoutBack(f, s))], ['support', 26, 28, (f, s) => (f === 1 ? elephantFront(f, s) : elephantBack(f, s))], ['reserve', 28, 30, (f, s) => tent(f, s, f === 1)]];
  theme.factions.forEach((_, f) => {
    let n = 0;
    for (const [line, offH, offC, make] of lines) {
      const men = soldiers.filter((s) => s.faction === f && !s.vacant && s.slot?.line === line && s.x >= openX0 && s.x <= openX1).sort((a, b) => a.x - b.x);
      for (let i = 0; i < men.length; i += 28) {
        const grp = men.slice(i, i + 28); if (grp.length < 6) continue;
        const mid = grp[Math.floor(grp.length / 2)];
        const ys = grp.map((s) => s.y);
        const y = f === 0 ? Math.min(...ys) - offH : Math.max(...ys) + offC; // vždy za vojáky (od nepřítele)
        if (busy(f, mid.x, y)) continue;
        const seed = Math.round(mid.x) % 7;
        const sp = new Sprite(make(f, seed)); sp.anchor.set(0.5, 1); sp.x = Math.round(mid.x); sp.y = Math.round(y + (f === 0 ? 0 : sp.texture.height));
        sp.eventMode = 'static'; sp.cursor = 'pointer';
        n++;
        const sh = { sp, f, line, men: grp, no: n, name: NAMES[f][(hash(`${f}:${line}:${i}`)) % NAMES[f].length] };
        // praporek oblasti, která v úkrytu převažuje (jen když ji aspoň 3 muži uvedli)
        const cnt = {}; for (const s of grp) { const r = fakeRegion(s.handle); if (r) cnt[r] = (cnt[r] || 0) + 1; }
        const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
        if (top && top[1] >= 3) {
          const r = REGIONS.find((x) => x.id === top[0]);
          const pole = new Graphics(); const tx = Math.round(sp.texture.width / 2) - 3, ty = -sp.texture.height - 4;
          pole.rect(tx, ty - 2, 1, 14).fill(0x0e0d0c);
          const fl = new Sprite(Texture.from(pennant(r))); fl.x = tx + 1; fl.y = ty - 2; fl.scale.set(0.85);
          sp.addChild(pole); sp.addChild(fl);
        }
        sp.on('pointertap', (e) => { e.stopPropagation?.(); openPanel(sh); });
        layer.addChild(sp); shelters.push(sh);
      }
    }
  });

  // panel po kliknutí (v náhledu jednoduchý; naostro jako karta vojáka)
  const panel = document.createElement('div');
  panel.id = 'shelter-panel';
  panel.style.cssText = 'position:fixed;left:12px;bottom:12px;width:min(360px,calc(100vw - 24px));max-height:70vh;overflow:auto;background:rgba(28,26,23,.96);border:2px solid #524a3f;color:#e3d9c3;padding:14px 16px;font-family:VT323,monospace;font-size:19px;z-index:60;display:none;image-rendering:pixelated';
  document.body.appendChild(panel);
  function openPanel(sh) {
    const counts = {}; let none = 0;
    for (const s of sh.men) { const r = fakeRegion(s.handle); if (r) counts[r] = (counts[r] || 0) + 1; else none++; }
    const kind = { front: 'Dugout', support: 'Iron shelter', reserve: 'Tent' }[sh.line];
    const where = { front: 'Front line', support: 'Support line', reserve: 'Reserve' }[sh.line];
    const regs = REGIONS.filter((r) => counts[r.id]).sort((a, b) => counts[b.id] - counts[a.id]);
    panel.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:start;gap:8px"><div>
        <div style="font-family:Silkscreen,monospace;font-size:12px;color:#d98f3f">${kind.toUpperCase()} No. ${sh.no} · ${theme.factions[sh.f].name.replace('The ', '').toUpperCase()}</div>
        <div style="font-family:Silkscreen,monospace;font-size:18px;margin:2px 0 4px">${sh.name.toUpperCase()}</div>
        <div style="color:#a39782">${where} · ${sh.men.length} men sleep here</div></div>
        <button id="sh-x" style="background:none;border:2px solid #524a3f;color:#a39782;font-family:Silkscreen;cursor:pointer">X</button></div>
      <p style="color:#a39782;margin:8px 0 10px;font-size:17px;line-height:1.05">${LORE[sh.line]}</p>
      <div style="font-family:Silkscreen,monospace;font-size:11px;color:#d98f3f;margin-bottom:6px">WHERE THEY COME FROM</div>
      <div id="sh-reg" style="display:grid;grid-template-columns:auto 1fr auto;gap:4px 8px;align-items:center"></div>
      <div style="color:#6b6152;margin-top:4px">Not stated: ${none}</div>
      <div style="font-family:Silkscreen,monospace;font-size:11px;color:#d98f3f;margin:10px 0 4px">SLEEPING HERE</div>
      <div id="sh-men" style="columns:2;column-gap:12px;font-size:17px"></div>`;
    const reg = panel.querySelector('#sh-reg');
    for (const r of regs) {
      const c = pennant(r, 3); c.style.display = 'block'; reg.appendChild(c);
      const n = document.createElement('div'); n.textContent = r.name; reg.appendChild(n);
      const k = document.createElement('div'); k.textContent = counts[r.id]; k.style.color = '#d98f3f'; reg.appendChild(k);
    }
    const men = panel.querySelector('#sh-men');
    for (const s of sh.men.slice().sort((a, b) => (fakeRegion(b.handle) ? 1 : 0) - (fakeRegion(a.handle) ? 1 : 0)).slice(0, 16)) {
      const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:5px;align-items:center;cursor:pointer;break-inside:avoid';
      const r = REGIONS.find((x) => x.id === fakeRegion(s.handle));
      if (r) { const c = pennant(r, 1); c.style.width = '13px'; row.appendChild(c); } else { const sp = document.createElement('span'); sp.style.width = '13px'; row.appendChild(sp); }
      const t = document.createElement('span'); t.textContent = s.name; row.appendChild(t);
      row.onclick = () => openCard?.(s); men.appendChild(row);
    }
    if (sh.men.length > 16) { const m = document.createElement('div'); m.style.color = '#6b6152'; m.textContent = `+ ${sh.men.length - 16} more`; men.appendChild(m); }
    panel.querySelector('#sh-x').onclick = () => (panel.style.display = 'none');
    panel.style.display = 'block';
  }
  return { shelters, openPanel };
}
