// Sběratelské kartičky (theme.cards, návrh docs/CARDS.md, nasazeno 24. 11.): voják, který se vrátí živý z akce s přihláškou
// (wiring party, noční raid, let pilota), najde se šancí theme.cards.chance[how] kartičku v blátě. Vzácnost podle theme.cards.rarity,
// v rámci vzácnosti rovnoměrně. Kartičky patří rodu: s.cards = [{ id, day, how, by }] a nástupce je zdědí (soldier.js heir).
// Bez stropu (uživatel 23. 11.), jen u pilota strop theme.cards.cap.pilot. Los je pevný (seed vojáka a dne), stejný jako jinde v enginu.
import { rngFor } from './rng.js';
import { addEntry } from './soldier.js';

const C = (theme) => (theme.cards?.enabled === false ? null : theme.cards);

// Vrátí nalezenou kartičku (a zapíše ji vojákovi i do deníku), jinak null.
export function findCard(state, theme, s, how, day) {
  const cfg = C(theme);
  if (!cfg || !s || s.status === 'fallen' || s.wound?.outright) return null;
  if (s.wound && s.wound.sev !== 'light' && s.wound.day === day) return null; // těžce raněný na akci nic nenajde
  const p = cfg.chance?.[how] ?? 0;
  if (!p) return null;
  const cap = cfg.cap?.[how];
  if (cap != null && (s.cards || []).filter((c) => c.how === how).length >= cap) return null;
  const r = rngFor(theme.id, s.id, `card:${how}`, day);
  if (r() >= p) return null;
  const rar = Object.entries(cfg.rarity || { common: 1 });
  const total = rar.reduce((a, [, w]) => a + w, 0);
  let x = r() * total, tier = rar[0][0];
  for (const [k, w] of rar) { if (x < w) { tier = k; break; } x -= w; }
  const pool = cfg.set.filter((c) => c.rarity === tier);
  const card = (pool.length ? pool : cfg.set)[Math.floor(r() * (pool.length || cfg.set.length))];
  s.cards = [...(s.cards || []), { id: card.id, day, how, by: s.name }];
  const t = cfg.entry?.[how] || cfg.entry?.any;
  if (t) addEntry(s, day, t.replaceAll('{name}', s.name).replaceAll('{card}', card.name).replaceAll('{rarity}', cfg.rarityName?.[card.rarity] || card.rarity));
  return { handle: s.handle, faction: s.faction, id: card.id, rarity: card.rarity };
}

// Řádek do novin (jen čísla, pravidlo od 19. 11.): „2 sweetheart cards were picked up in the mud.“
export function cardsNewsLine(theme, found) {
  const cfg = C(theme);
  if (!cfg || !found.length) return '';
  const n = found.length;
  return ' ' + (n === 1 ? cfg.news?.one : cfg.news?.many || '').replaceAll('{n}', String(n));
}
