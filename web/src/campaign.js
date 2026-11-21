// Mapa tažení (21. 11. 2026, uživatel: „mapa, která ukáže, kdo co vyhrál, co kdo obsadil a o co se aktuálně bojuje“).
// Kreslená pixelová mapa jako stará vojenská mapa (mřížka 480×260, jen zelené a modré odstíny: výškové pásma, vrstevnice, lesy, řeka), ikony kót z PixelLabu (props/map_<id>.png).
// Nahoře území Hegemonie (modravý nádech), dole Concordu (žlutozelený), mezi nimi fronta (zákopy, drát).
// Kóty z theme.race.objectives leží podél fronty: dobytá kóta je na území vítěze a fronta se kolem ní prohne k poraženému,
// o kterou se bojuje teď, stojí na frontě a bliká, budoucí jsou v mlze s otazníkem. Pod mapou seznam: kdo drží, od kdy, hrdina, odměna, stav děla/miny.
import { dayLabel } from './day.js';
import { loadImage } from './assets.js';

const W = 480, H = 260, MID = 130;
const PAL = { ink: '#0e0d0c', dark: '#1c1a17', mud0: '#2b2722', mud1: '#3d3730', mud2: '#524a3f', mud3: '#6b6152', sand: '#857a68', bone: '#a39782', pale: '#c4b8a0', white: '#e3d9c3', gold: '#d98f3f', rust: '#7e3b2a', steel: '#666d70', grey: '#8a9295', water: '#2a3138', olive: '#5c5a35', olive2: '#8a8a52', yellow: '#c9c26a', hegT: '#4a4f52', conT: '#4a4a30' };
const B = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const dith = (x, y) => (B[y & 3][x & 3] + 0.5) / 16;
const REWARD = { barrage: 'Artillery on the enemy for 3 days', observation: 'Observation tree: sharper snipers and machine guns', logistics: 'Better supplies: two shots a day', gun: 'A heavy howitzer, for good', mine: 'A mine under the enemy line' };

export function renderCampaign(root, roster, theme, esc) {
  const objs = theme.race?.objectives || [];
  const wins = new Map((roster.victories || []).map((v) => [v.id, v]));
  const race = roster.race;
  const curIdx = objs.findIndex((o) => o.id === race?.id);
  const xs = objs.map((_, i) => Math.round(40 + (i * (W - 80)) / Math.max(1, objs.length - 1)));
  // poloha kóty a prohnutí fronty: 0 = Hegemonie (nahoře), 1 = Concord (dole)
  const own = objs.map((o) => wins.get(o.id)?.faction ?? null);
  const oy = own.map((f) => (f === 0 ? MID - 44 : f === 1 ? MID + 44 : MID));
  const bulge = own.map((f) => (f === 0 ? 62 : f === 1 ? -62 : 0));
  const lineY = (x) => { let y = MID; xs.forEach((cx, i) => { const d = (x - cx) / 48; y += bulge[i] * Math.exp(-d * d); }); return y + 3 * Math.sin(x / 17) + 2 * Math.sin(x / 6.3); };
  const fog = (i) => own[i] == null && i > curIdx;

  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.className = 'camp-map';
  const g = cv.getContext('2d');
  const px = (c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  // terén jako mapa: výška z hladkého šumu → pásma zelené, vrstevnice, lesy, řeka (jen zelená a modrá)
  const GREEN = ['#2a3b2a', '#3a4f34', '#4f6640', '#6b7f4f', '#8a9a62', '#a3ad74'];
  const hgt = (x, y) => 0.5 + 0.22 * Math.sin(x / 41 + 1.3) * Math.cos(y / 37) + 0.16 * Math.sin((x + y) / 23) + 0.1 * Math.cos((x - 2 * y) / 13);
  const band = (x, y) => Math.max(0, Math.min(GREEN.length - 1, Math.floor(hgt(x, y) * GREEN.length)));
  const riverX = (y) => W * 0.36 + 18 * Math.sin(y / 29) + 9 * Math.sin(y / 11);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const b = band(x, y), edge = band(x + 1, y) !== b || band(x, y + 1) !== b;
    px(edge ? '#2a3b2a' : dith(x, y) < 0.18 && b > 0 ? GREEN[b - 1] : GREEN[b], x, y);
  }
  for (let k = 0; k < 140; k++) { const x = (k * 137) % W, y = (k * 71 + (k % 7) * 13) % H; if (hgt(x, y) > 0.55) continue; for (let j = 0; j < 4; j++) { g.fillStyle = j % 2 ? '#1d2a1f' : '#2a3b2a'; g.beginPath(); g.arc(x + (j % 2) * 3, y + (j >> 1) * 3, 2, 0, Math.PI * 2); g.fill(); } }
  for (let y = 0; y < H; y++) { const rx = Math.round(riverX(y)); px('#2a4258', rx - 3, y, 7, 1); px('#3f6280', rx - 2, y, 5, 1); if ((y >> 2) % 3 === 0) px('#6a8fa8', rx - 1, y, 2, 1); }
  // území stran jen jemným nádechem (Hegemonie do modra, Concord do žluté zeleně)
  for (let x = 0; x < W; x++) { const ly = Math.round(lineY(x)); g.fillStyle = 'rgba(42,66,88,0.28)'; g.fillRect(x, 0, 1, ly); g.fillStyle = 'rgba(201,194,106,0.12)'; g.fillRect(x, ly, 1, H - ly); }
  // fronta: pás země nikoho, zákopy obou stran, drát
  for (let x = 0; x < W; x++) {
    const ly = lineY(x), zz = ((x >> 3) % 2) * 2;
    px('#4a5040', x, Math.round(ly - 4), 1, 8);
    px('#1d2a1f', x, Math.round(ly - 12 - zz), 1, 2); px('#1d2a1f', x, Math.round(ly + 10 + zz), 1, 2);
    if (x % 3 === 0) px('#8a9295', x, Math.round(ly - 1 + ((x >> 1) % 2)), 1, 1);
    if (x % 11 === 0) px('#5c5f62', x, Math.round(ly - 4), 1, 7);
  }
  const label = (t, x, y, c) => { g.font = 'bold 10px monospace'; g.fillStyle = '#0e0d0c'; g.fillText(t, x + 1, y + 1); g.fillStyle = c; g.fillText(t, x, y); };
  label('HEGEMONY', 8, 16, '#9cbccc'); label('CONCORD', 8, H - 8, '#c9c26a');
  // kompas
  px('#d8d8b0', W - 22, 10, 1, 14); px('#d8d8b0', W - 28, 17, 13, 1); label('N', W - 25, 9, '#d8d8b0');
  const flag = (f, x, y) => {
    px('#0e0d0c', x, y - 16, 1, 16);
    if (f === 0) { px('#666d70', x + 1, y - 16, 12, 7); px('#7e3b2a', x + 1, y - 14, 12, 2); }
    else { px('#6f7148', x + 1, y - 16, 12, 7); px('#c9c26a', x + 6, y - 14, 2, 2); }
  };
  // ikony kót z PixelLabu (props/map_<id>.png, 48×48); bez obrázku kreslená náhrada
  const drawIcons = (imgs) => objs.forEach((o, i) => {
    const x = xs[i], y = oy[i], im = imgs[o.id];
    if (im) {
      g.save(); if (fog(i)) g.filter = 'grayscale(1) brightness(0.65)';
      g.drawImage(im, x - 24, y - 26); g.restore();
    } else { g.fillStyle = fog(i) ? '#3a4f34' : '#c4a882'; g.beginPath(); g.ellipse(x, y, 12, 7, 0, 0, Math.PI * 2); g.fill(); }
    if (own[i] != null) flag(own[i], x + 14, y - 10);
    if (i === curIdx) { g.strokeStyle = '#d98f3f'; g.lineWidth = 2; g.strokeRect(x - 27, y - 29, 54, 54); }
  });
  for (const gun of roster.guns || []) { const i = objs.findIndex((o) => o.id === gun.id); if (i < 0) continue; const x = xs[i] - 30, y = oy[i] + 10; px('#0e0d0c', x - 5, y, 11, 3); px(gun.destroyed ? '#7e3b2a' : '#5c5f62', x - 2, y - 3, 9, 3); }
  for (const m of roster.mines || []) { if (m.status !== 'blown' || !m.blown) continue; const i = objs.findIndex((o) => o.id === m.id); const x = xs[Math.max(0, i)] + 30; const y = Math.round(lineY(x) + (m.faction === 0 ? 16 : -16)); g.fillStyle = '#1d2a1f'; g.beginPath(); g.ellipse(x, y, 9, 5, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#8a9a62'; g.stroke(); }
  drawIcons({});
  const imgs = {};
  let left = objs.length;
  for (const o of objs) {
    loadImage(`/assets/props/map_${o.id}.png`).then((im) => { imgs[o.id] = im; }).catch(() => {}).finally(() => { if (--left === 0) drawIcons(imgs); });
  }

  // DOM: popisky kót nad mapou (ostré písmo, % pozice) a seznam pod mapou
  const wrap = document.createElement('div'); wrap.className = 'camp-wrap';
  wrap.appendChild(cv);
  objs.forEach((o, i) => {
    const t = document.createElement('span');
    t.className = 'camp-lbl' + (i === curIdx ? ' now' : own[i] == null && i > curIdx ? ' fog' : '');
    t.textContent = own[i] == null && i > curIdx ? '???' : o.name.replace(/^the /i, '');
    t.style.left = `${(xs[i] / W) * 100}%`; t.style.top = `${((oy[i] + (i % 2 ? 27 : -44)) / H) * 100}%`; // střídavě nad a pod ikonou, ať se sousední popisky nepřekrývají
    wrap.appendChild(t);
  });
  const fac = (f) => theme.factions[f].name.replace('The ', '');
  const rows = objs.map((o, i) => {
    const v = wins.get(o.id), kind = o.reward || 'barrage';
    if (v) {
      const gun = (roster.guns || []).find((x) => x.id === o.id), mine = (roster.mines || []).find((x) => x.id === o.id);
      const extra = gun ? ` · gun ${gun.destroyed ? 'destroyed' : `${Math.round((gun.cond ?? 1) * 100)}%`}` : mine ? ` · mine ${mine.status === 'blown' ? `went up: ${mine.blown?.hit ?? 0} hit, ${mine.blown?.killed ?? 0} killed` : mine.status === 'collapsed' ? 'caved in by the enemy' : 'being dug'}` : '';
      return `<li><span class="dot" style="background:${theme.factions[v.faction].color}"></span><b>${esc(o.name)}</b> · held by the ${esc(fac(v.faction))} since ${dayLabel(v.day)}<br><span class="muted">Hero: @${esc(v.hero)} · ${esc(REWARD[v.reward || kind] || '')}${esc(extra)}</span></li>`;
    }
    if (i === curIdx && race) {
      const bars = [0, 1].map((f) => `<div class="race-row"><span>${esc(fac(f))}</span><span class="bar"><i style="width:${Math.min(100, (race.counts[f] / race.need) * 100)}%;background:${theme.factions[f].color}"></i></span><span class="muted">${race.counts[f]}/${race.need}</span></div>`).join('');
      return `<li class="now"><span class="dot now"></span><b>${esc(o.name)}</b> · <span class="hot">fighting now</span><br><span class="muted">${race.type === 'kills' ? `First to kill ${race.need} enemy soldiers.` : `First to bring ${race.need} new soldiers to the front.`} Prize: ${esc(REWARD[kind] || '')}.</span>${bars}</li>`;
    }
    return `<li class="fog"><span class="dot"></span><b>Unknown ground</b><br><span class="muted">Not yet reached.</span></li>`;
  }).join('');
  root.innerHTML = '';
  root.appendChild(wrap);
  const list = document.createElement('ol'); list.className = 'camp-list'; list.innerHTML = rows; root.appendChild(list);
}
