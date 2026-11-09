// Generátor příběhů ze šablon tématu (zdarma, bez AI API). Deterministický: stejný voják + den = stejný zápis.

import { rngFor, pick, weighted, hashString } from './rng.js';

// --- rozmanitost zápisů ---
// Klíč šablony (ne výsledného textu): podle něj se pozná, že dva vojáci dostali „tu samou“ historku.
export const tplKey = (t) => hashString(t).toString(36);
// Výběr šablony tak, aby se neopakovala: co už voják někdy měl, skoro nikdy (×0.02);
// co dnes (nebo v poslední dávce nováčků) dostal někdo jiný, zřídka (×0.08). Až když je vše vyčerpané, opakuje se.
export function pickVaried(rand, entries, soldier, today) {
  const seen = new Set(soldier.seen || []);
  const t = weighted(rand, entries.map(([text, w]) => {
    const k = tplKey(text);
    return [text, w * (seen.has(k) ? 0.02 : 1) * (today?.has(k) ? 0.08 : 1)];
  }));
  const k = tplKey(t);
  soldier.seen = [...(soldier.seen || []).filter((x) => x !== k), k].slice(-200);
  today?.add(k);
  return t;
}
const even = (list) => list.map((x) => [x, 1]);

const PRONOUNS = {
  he: { he: 'he', him: 'him', his: 'his' },
  she: { he: 'she', him: 'her', his: 'her' },
  they: { he: 'they', him: 'them', his: 'their' },
};

export function fill(template, vars, rand) {
  // dvakrát: dosazené hodnoty (předměty, místa) můžou obsahovat další {zájmena}
  return fillOnce(fillOnce(template, vars, rand), vars, rand);
}

function fillOnce(template, vars, rand) {
  return template
    .replace(/\[([^\]]+)\]/g, (_, opts) => pick(rand, opts.split('|')))
    .replace(/\{(\w+)\}/g, (m, key) => {
      const p = PRONOUNS[vars.pronoun || 'he'];
      const lower = key.toLowerCase();
      if (p[lower]) {
        const v = p[lower];
        return key[0] === key[0].toUpperCase() ? v[0].toUpperCase() + v.slice(1) : v;
      }
      return vars[key] ?? m;
    });
}

export function soldierVars(soldier, theme, story, extra = {}) {
  const rand = rngFor(soldier.id, 'vars');
  return {
    name: soldier.name,
    family: soldier.family ?? '',
    rank: theme.ranks[soldier.rank],
    archetype: theme.archetypes.find((a) => a.id === soldier.archetype)?.name.toLowerCase() ?? 'soldier',
    sector: soldier.sector ?? 'the line',
    unit: soldier.unit ?? '',
    item: soldier.item ?? pick(rand, story.items),
    place: pick(rand, story.places),
    pronoun: soldier.pronoun || 'he',
    ...extra,
  };
}

export function enlistEntry(soldier, theme, story, today = null) {
  const rand = rngFor(soldier.id, 'enlist');
  return fill(pickVaried(rand, even(story.enlist), soldier, today), soldierVars(soldier, theme, story), rand);
}

// Počasí dne: stejné pro celou frontu, deterministické podle tématu a dne.
export function weatherFor(theme, story, day) {
  const list = story.weather || [];
  if (!list.length) return null;
  return weighted(rngFor(theme.id, 'weather', day), list.map((w) => [w, w.w]));
}

export function dailyEntry(soldier, day, theme, story, weather = null, today = null) {
  const rand = rngFor(soldier.id, 'day', day);
  const pool = story.daily.filter(
    (e) =>
      (!e.line || e.line === soldier.line) &&
      (!e.archetype || e.archetype === soldier.archetype) &&
      (!e.weather || e.weather === weather),
  );
  // povolání a počasí mají přednost před obecnými zápisy
  const tpl = pickVaried(rand, pool.map((e) => [e.text, e.w * (e.archetype ? 2 : 1) * (e.weather ? 1.5 : 1)]), soldier, today);
  const vars = soldierVars(soldier, theme, story, { place: pick(rand, story.places) });
  return fill(tpl, vars, rand);
}

export function eventEntry(kind, soldier, day, theme, story, extra = {}, today = null) {
  const rand = rngFor(soldier.id, kind, day);
  const vars = soldierVars(soldier, theme, story, { place: pick(rand, story.places), ...extra });
  return fill(pickVaried(rand, even(story[kind]), soldier, today), vars, rand);
}
