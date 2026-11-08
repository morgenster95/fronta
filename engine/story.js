// Generátor příběhů ze šablon tématu (zdarma, bez AI API). Deterministický: stejný voják + den = stejný zápis.

import { rngFor, pick, weighted } from './rng.js';

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

export function enlistEntry(soldier, theme, story) {
  const rand = rngFor(soldier.id, 'enlist');
  return fill(pick(rand, story.enlist), soldierVars(soldier, theme, story), rand);
}

export function dailyEntry(soldier, day, theme, story) {
  const rand = rngFor(soldier.id, 'day', day);
  const pool = story.daily.filter(
    (e) => (!e.line || e.line === soldier.line) && (!e.archetype || e.archetype === soldier.archetype),
  );
  const tpl = weighted(rand, pool.map((e) => [e.text, e.w * (e.archetype ? 2 : 1)]));
  const vars = soldierVars(soldier, theme, story, { place: pick(rand, story.places) });
  return fill(tpl, vars, rand);
}

export function eventEntry(kind, soldier, day, theme, story, extra = {}) {
  const rand = rngFor(soldier.id, kind, day);
  const vars = soldierVars(soldier, theme, story, { place: pick(rand, story.places), ...extra });
  return fill(pick(rand, story[kind]), vars, rand);
}
