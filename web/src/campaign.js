// Mapa tažení (21. 11. 2026, uživatel: „mapa, která ukáže, kdo co vyhrál, co kdo obsadil a o co se aktuálně bojuje“).
// Kreslená pixelová mapa (mřížka 320×180, paleta Trench-24): nahoře území Hegemonie, dole Concordu, mezi nimi fronta (drát).
// Kóty z theme.race.objectives leží podél fronty: dobytá kóta je na území vítěze a fronta se kolem ní prohne k poraženému,
// o kterou se bojuje teď, stojí na frontě a bliká, budoucí jsou v mlze s otazníkem. Pod mapou seznam: kdo drží, od kdy, hrdina, odměna, stav děla/miny.
import { dayLabel } from './day.js';

const W = 320, H = 180, MID = 92;
const PAL = { ink: '#0e0d0c', dark: '#1c1a17', mud0: '#2b2722', mud1: '#3d3730', mud2: '#524a3f', mud3: '#6b6152', sand: '#857a68', bone: '#a39782', pale: '#c4b8a0', white: '#e3d9c3', gold: '#d98f3f', rust: '#7e3b2a', steel: '#666d70', grey: '#8a9295', water: '#2a3138', olive: '#5c5a35', olive2: '#8a8a52', yellow: '#c9c26a', hegT: '#4a4f52', conT: '#4a4a30' };
const B = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const dith = (x, y) => (B[y & 3][x & 3] + 0.5) / 16;
const REWARD = { barrage: 'Artillery on the enemy for 3 days', observation: 'Observation tree: sharper snipers and machine guns', logistics: 'Better supplies: two shots a day', gun: 'A heavy howitzer, for good', mine: 'A mine under the enemy line' };

export function renderCampaign(root, roster, theme, esc) {
  const objs = theme.race?.objectives || [];
  const wins = new Map((roster.victories || []).map((v) => [v.id, v]));
  const race = roster.race;
  const curIdx = objs.findIndex((o) => o.id === race?.id);
  const xs = objs.map((_, i) => Math.round(28 + (i * (W - 56)) / Math.max(1, objs.length - 1)));
  // poloha kóty a prohnutí fronty: 0 = Hegemonie (nahoře), 1 = Concord (dole)
  const own = objs.map((o) => wins.get(o.id)?.faction ?? null);
  const oy = own.map((f) => (f === 0 ? MID - 30 : f === 1 ? MID + 30 : MID));
  const bulge = own.map((f) => (f === 0 ? 44 : f === 1 ? -44 : 0));
  const lineY = (x) => { let y = MID; xs.forEach((cx, i) => { const d = (x - cx) / 34; y += bulge[i] * Math.exp(-d * d); }); return y + 3 * Math.sin(x / 13) + 2 * Math.sin(x / 5.3); };

  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.className = 'camp-map';
  const g = cv.getContext('2d');
  const px = (c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  // území: nahoře Hegemonie (ocelová šedá), dole Concord (olivová), dithering, krátery
  for (let x = 0; x < W; x++) { const ly = Math.round(lineY(x)); for (let y = 0; y < H; y++) { const top = y < ly, d = dith(x, y); px(top ? (d < 0.25 ? PAL.mud1 : PAL.hegT) : (d < 0.25 ? PAL.mud1 : PAL.conT), x, y); } }
  for (let k = 0; k < 70; k++) { const x = (k * 97) % W, y = (k * 53) % H; g.fillStyle = PAL.mud0; g.beginPath(); g.ellipse(x, y, 2 + (k % 3), 1 + (k % 2), 0, 0, Math.PI * 2); g.fill(); }
  // zákopy obou stran (cikcak kousek od fronty) a země nikoho s drátem
  for (let x = 0; x < W; x++) {
    const ly = lineY(x), zz = ((x >> 3) % 2) * 2;
    px(PAL.mud0, x, Math.round(ly - 9 - zz), 1, 2); px(PAL.mud0, x, Math.round(ly + 8 + zz), 1, 2);
    px(PAL.mud2, x, Math.round(ly - 2), 1, 4);
    if (x % 3 === 0) px(PAL.grey, x, Math.round(ly - 1 + ((x >> 1) % 2)), 1, 1);
    if (x % 9 === 0) px(PAL.sand, x, Math.round(ly - 3), 1, 5);
  }
  // nápisy stran
  const label = (t, x, y, c) => { g.font = '8px monospace'; g.fillStyle = PAL.ink; g.fillText(t, x + 1, y + 1); g.fillStyle = c; g.fillText(t, x, y); };
  label('HEGEMONY', 6, 12, '#b9c4ca'); label('CONCORD', 6, H - 6, PAL.yellow);
  // ikony kót (kreslené v kódu, ~18 px)
  const icon = (id, x, y, fog) => {
    const c = (a) => (fog ? PAL.mud3 : a);
    if (id === 'ridge') { for (let i = 0; i < 12; i++) px(c(PAL.sand), x - 12 + i, y + 4 - Math.min(i, 11 - i) , 1, Math.min(i, 11 - i) + 2); for (let i = 0; i < 10; i++) px(c(PAL.bone), x - 2 + i, y + 4 - Math.min(i, 9 - i) + 1, 1, Math.min(i, 9 - i) + 1); }
    else if (id === 'hill304') { g.fillStyle = c(PAL.sand); g.beginPath(); g.ellipse(x, y + 5, 11, 6, 0, Math.PI, 0); g.fill(); px(c(PAL.ink), x + 2, y - 7, 1, 7); px(c(PAL.ink), x, y - 5, 5, 1); }
    else if (id === 'canal') { px(c(PAL.water), x - 12, y + 1, 24, 4); px(c('#4a5866'), x - 10, y + 2, 6, 1); px(c('#4a5866'), x + 3, y + 3, 6, 1); px(c(PAL.mud3), x - 12, y, 24, 1); px(c(PAL.mud3), x - 12, y + 5, 24, 1); }
    else if (id === 'mill') { px(c(PAL.bone), x - 5, y - 3, 10, 9); px(c(PAL.rust), x - 6, y - 5, 12, 2); px(c(PAL.ink), x - 1, y + 2, 2, 4); g.strokeStyle = c(PAL.mud3); g.lineWidth = 1; g.beginPath(); g.arc(x + 8, y + 2, 4, 0, Math.PI * 2); g.stroke(); }
    else if (id === 'quarry') { g.fillStyle = c(PAL.pale); g.beginPath(); g.ellipse(x, y + 2, 11, 5, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = c(PAL.mud0); g.beginPath(); g.ellipse(x, y + 3, 8, 3, 0, 0, Math.PI * 2); g.fill(); px(c(PAL.bone), x - 3, y + 2, 2, 1); px(c(PAL.bone), x + 3, y + 3, 2, 1); }
    else if (id === 'orchard') { for (const dx of [-7, 0, 7]) { px(c(PAL.ink), x + dx, y, 1, 5); g.fillStyle = c(PAL.olive); g.beginPath(); g.arc(x + dx, y - 2, 3, 0, Math.PI * 2); g.fill(); } }
    else { px(c(PAL.sand), x - 6, y, 12, 5); }
  };
  const flag = (f, x, y) => {
    px(PAL.ink, x, y - 14, 1, 14);
    if (f === 0) { px(PAL.steel, x + 1, y - 14, 10, 6); px(PAL.rust, x + 1, y - 12, 10, 2); }
    else { px(PAL.olive2, x + 1, y - 14, 10, 6); px(PAL.yellow, x + 5, y - 12, 2, 2); }
  };
  objs.forEach((o, i) => {
    const x = xs[i], y = oy[i], fog = own[i] == null && i > curIdx;
    if (fog) { g.fillStyle = 'rgba(196,184,160,0.10)'; g.beginPath(); g.ellipse(x, y, 20, 12, 0, 0, Math.PI * 2); g.fill(); }
    icon(o.id, x, y, fog);
    if (own[i] != null) flag(own[i], x + 6, y - 2);
    if (i === curIdx) { g.strokeStyle = PAL.gold; g.lineWidth = 1; g.strokeRect(x - 15.5, y - 10.5, 31, 20); px(PAL.gold, x - 2, y - 15, 5, 3); }
    if (fog) label('?', x - 2, y - 6, PAL.pale);
  });
  // těžké dělo a mina na mapě tažení
  for (const gun of roster.guns || []) { const i = objs.findIndex((o) => o.id === gun.id); if (i < 0) continue; const x = xs[i] - 14, y = oy[i] + (gun.faction === 0 ? -14 : 14); px(PAL.ink, x - 4, y, 9, 3); px(gun.destroyed ? PAL.rust : PAL.steel, x - 1, y - 2, 7, 2); }
  for (const m of roster.mines || []) { if (m.status !== 'blown' || !m.blown) continue; const i = objs.findIndex((o) => o.id === m.id); const x = xs[Math.max(0, i)]; const y = Math.round(lineY(x) + (m.faction === 0 ? 14 : -14)); g.fillStyle = PAL.ink; g.beginPath(); g.ellipse(x, y, 7, 4, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = PAL.sand; g.stroke(); }

  // DOM: popisky kót nad mapou (ostré písmo, % pozice) a seznam pod mapou
  const wrap = document.createElement('div'); wrap.className = 'camp-wrap';
  wrap.appendChild(cv);
  objs.forEach((o, i) => {
    const t = document.createElement('span');
    t.className = 'camp-lbl' + (i === curIdx ? ' now' : own[i] == null && i > curIdx ? ' fog' : '');
    t.textContent = own[i] == null && i > curIdx ? '???' : o.name.replace(/^the /i, '');
    t.style.left = `${(xs[i] / W) * 100}%`; t.style.top = `${((oy[i] + (i % 2 ? 13 : i === curIdx ? -30 : -25)) / H) * 100}%`; // střídavě nad a pod ikonou, ať se sousední popisky nepřekrývají
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
