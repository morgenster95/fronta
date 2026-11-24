// Medaile podporovatelů a sběratelské kartičky (24. 11.): řádek MEDALS a SWEETHEART CARDS na kartě vojáka, police v rodu, zvětšení kartičky.
// Data: rec.medals (war-bonds, officers-star), rec.dog (Field Post / Officers' Mess mají psa), rec.cards = [{ id, day, how, by }] (engine/cards.js).
// Obrázky: assets/medals/<img>.png (15 × 23), assets/cards/card_<id>.png a back.png (54 × 87). Bojové medaile (docs/MEDALS.md) zatím nejsou.
import { BASE } from './assets.js';
import { dayLabel } from './day.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const HOW = { wire: 'on the wire', raid: 'on a night raid', pilot: 'after a flight' };

// nejvyšší úroveň podpory (jen jedna medaile): hvězda → Officers' Mess, stužka + pes → Field Post, stužka → War Bonds
export function supporterMedal(theme, medals = [], dog = null, handle = '') {
  const S = theme.support, list = S?.medals;
  if (!list) return null;
  const has = (m) => medals.includes(m);
  const mess = (S.star && has(S.star.medal)) || (S.messNoStar || []).includes(handle); // Officers' Mess bez hvězdy nad hlavou (přání patrona)
  const id = mess ? 'officers-mess' : has(S.medal) && dog ? 'field-post' : has(S.medal) ? 'war-bonds' : null;
  return id ? list.find((m) => m.id === id) || null : null;
}

const medalImg = (m) => `<img class="px-medal" src="${BASE}/assets/medals/${esc(m.img)}.png" alt="${esc(m.name)}" width="30" height="46">`;
const cardImg = (id, cls = '') => `<img class="px-card ${cls}" src="${BASE}/assets/cards/${id ? `card_${esc(id)}` : 'back'}.png" alt="" width="54" height="87">`;

// karty seskupené podle druhu, v pořadí sady: [{ card, n, first }]
function grouped(theme, cards = []) {
  const set = theme.cards?.set || [];
  return set.map((c) => ({ card: c, list: cards.filter((x) => x.id === c.id) })).filter((g) => g.list.length).map((g) => ({ card: g.card, n: g.list.length, first: g.list[0] }));
}

// řádky na kartě vojáka (prázdný řetězec, když nic nemá)
export function cardRows(theme, rec, handle = '') {
  const m = supporterMedal(theme, rec.medals, rec.dog, handle);
  const g = grouped(theme, rec.cards);
  let h = '';
  if (m) h += `<h3>Medals</h3><div class="ks-row">${`<button type="button" class="ks-m" data-medal="${esc(m.id)}" title="${esc(m.name)}">${medalImg(m)}</button>`}</div>`;
  if (g.length) h += `<h3>Sweetheart cards</h3><div class="ks-row">${g.map((x) => `<button type="button" class="ks-c" data-card="${esc(x.card.id)}">${cardImg(x.card.id)}${x.n > 1 ? `<span class="ks-x">×${x.n}</span>` : ''}</button>`).join('')}</div>`;
  return h;
}

// police v rodu: medaile podpory (jen když je) + celá sada kartiček (chybějící rubem)
export function houseShelf(theme, rec, handle = '') {
  const C = theme.cards;
  const m = supporterMedal(theme, rec.medals, rec.dog, handle);
  const g = new Map(grouped(theme, rec.cards).map((x) => [x.card.id, x]));
  let h = '';
  if (m) h += `<h3 class="ks-h"><span>Medals</span></h3><div class="ks-grid ks-gm"><button type="button" class="ks-s got" data-medal="${esc(m.id)}">${medalImg(m)}<small>${esc(m.name)}</small></button></div>`;
  if (C?.set?.length && C.enabled !== false) {
    h += `<h3 class="ks-h"><span>Sweetheart cards · ${esc(C.setName || 'Set 1')}</span><span>${g.size} / ${C.set.length}</span></h3>`;
    h += `<div class="ks-grid ks-gc">${C.set.map((c) => {
      const x = g.get(c.id);
      return x ? `<button type="button" class="ks-s got" data-card="${esc(c.id)}">${cardImg(c.id)}${x.n > 1 ? `<span class="ks-x">×${x.n}</span>` : ''}<small>${esc(c.name)}</small></button>`
        : `<div class="ks-s lock">${cardImg(null)}<small>???</small></div>`;
    }).join('')}</div>`;
    if (C.lore) h += `<p class="muted ks-lore">${esc(C.lore)}</p>`;
  }
  return h;
}

// ťuknutí na medaili / kartičku uvnitř `root` (karta vojáka nebo rod)
export function wireKeepsakes(root, theme, rec, toast) {
  for (const b of root.querySelectorAll('[data-medal]')) b.onclick = () => {
    const m = theme.support?.medals?.find((x) => x.id === b.dataset.medal);
    if (m) toast(`${m.name}: ${m.line}. Same for both sides, no advantage in battle.`);
  };
  for (const b of root.querySelectorAll('[data-card]')) b.onclick = () => openCard(theme, rec, b.dataset.card);
}

// zvětšení: líc a rub vedle sebe, pod tím kdo kartičku našel a kde
export function openCard(theme, rec, id) {
  const c = theme.cards?.set?.find((x) => x.id === id);
  if (!c) return;
  const list = (rec.cards || []).filter((x) => x.id === id);
  const f = list[0];
  const rar = theme.cards.rarityName?.[c.rarity] || c.rarity;
  const old = document.getElementById('ks-zoom');
  if (old) old.remove();
  const el = document.createElement('div');
  el.id = 'ks-zoom';
  el.setAttribute('role', 'dialog');
  el.innerHTML = `<div class="ks-pair">${cardImg(c.id, 'big')}${cardImg(null, 'big')}</div>
    <div class="ks-t"><b>${esc(c.name)}</b> · <span class="r-${esc(c.rarity)}">${esc(rar)}</span> · #${esc(c.id)}<br>
    ${f ? `Found by ${esc(f.by)} ${esc(HOW[f.how] || '')}, ${esc(dayLabel(f.day))}` : ''}${list.length > 1 ? `<br>Carried ×${list.length}` : ''}${f && f.by !== rec.name ? `<br>Passed down in the House of ${esc(rec.family)}` : ''}</div>
    <button type="button" class="ks-close">Close</button>`;
  el.onclick = (e) => { if (e.target === el || e.target.classList.contains('ks-close')) el.remove(); };
  document.body.appendChild(el);
}
