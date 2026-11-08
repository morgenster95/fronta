// Voják: vznik z komentáře, vzhled z hashe IG ID, denní tah (zápisy, povýšení, zranění, smrt a nástupce z rodu).

import { rngFor, pick, weighted } from './rng.js';
import { dailyEntry, eventEntry } from './story.js';

export const STATUS = ['active', 'wounded', 'missing', 'captured', 'fallen'];

// Příjmení rodu z IG jména: "jan.novak_92" → "Novak"
export function familyName(handle) {
  const parts = handle
    .replace(/[0-9]+/g, ' ')
    .split(/[._\s-]+/)
    .filter((p) => p.length >= 3);
  const base = parts.length ? parts[parts.length - 1] : handle.replace(/[^a-z]/gi, '') || 'Doe';
  return base[0].toUpperCase() + base.slice(1, 12).toLowerCase();
}

export function createSoldier({ id, handle, faction, day, order }, theme, story) {
  const rand = rngFor(id, 'soldier');
  const archetype = weighted(rand, theme.archetypes.map((a) => [a.id, a.weight]));
  const first = pick(rand, story.firstNames);
  const s = {
    id,
    handle,
    faction,
    order, // pořadí narukování v rámci frakce = index slotu
    enlisted: day,
    archetype,
    rank: archetype === 'officer' ? 5 : 0,
    status: 'active',
    family: familyName(handle),
    generation: 1, // kolikátý člen rodu na frontě
    first,
    nick: rand() < 0.35 ? pick(rand, story.nicknames) : null,
    pronoun: 'he',
    claimed: false,
    variant: Math.floor(rand() * 4), // barevná obměna obličeje/výstroje v enginu
    record: [],
    fallen: [], // padlí předci: [{name, day, place}]
  };
  s.name = displayName(s);
  return s;
}

export function displayName(s) {
  return s.nick ? `${s.first} "${s.nick}" ${s.family}` : `${s.first} ${s.family}`;
}

// Kdo dnes dostane zápis: noví, převzatí a aktivní mají přednost, ostatní na střídačku (~1× za 4 dny).
export function selectForStory(soldiers, day, activeIds = new Set()) {
  return soldiers.filter((s) => {
    if (s.status === 'fallen') return false;
    if (s.enlisted === day) return false; // má zápis z narukování
    if (s.claimed || activeIds.has(s.id)) return true;
    return rngFor(s.id, 'pick', day)() < 0.25;
  });
}

// Jeden den pro jednoho vojáka. `ctx.active` = hráč se vrací (hlasoval, otevřel kartu) → chrání ho to.
export function tickSoldier(s, day, theme, story, ctx = {}) {
  const rand = rngFor(s.id, 'fate', day);
  const out = [];
  if (s.status === 'wounded') {
    if (rand() < 0.35) {
      s.status = 'active';
      out.push(eventEntry('recovered', s, day, theme, story));
    }
    return out;
  }
  if (s.status !== 'active') return out;

  const danger = (ctx.danger ?? 1) * (s.line === 'front' ? 1.5 : s.line === 'reserve' ? 0.4 : 1);
  const protect = ctx.active || s.claimed ? 0.35 : 1; // aktivní hráči padají ~3× méně
  const r = rand();
  if (r < 0.004 * danger * protect && day - s.enlisted >= 5) {
    // padl: smrt nikdy z ničeho nic, jen po aspoň 5 dnech služby
    s.status = 'fallen';
    s.fallenDay = day;
    out.push(eventEntry('fallen', s, day, theme, story));
  } else if (r < 0.03 * danger) {
    s.status = 'wounded';
    out.push(eventEntry('wounded', s, day, theme, story));
  } else if (r > 0.985 && s.rank < 4) {
    const oldRank = theme.ranks[s.rank];
    s.rank++;
    out.push(eventEntry('promotion', s, day, theme, story, { oldRank }));
  } else {
    out.push(dailyEntry(s, day, theme, story));
  }
  return out;
}

// Nástupce z rodu: stejné IG jméno i místo, nové křestní jméno, odkaz na padlého.
export function heir(s, day, theme, story) {
  const rand = rngFor(s.id, 'heir', s.generation);
  const prev = { name: s.name, day: s.fallenDay, rank: s.rank };
  const n = {
    ...s,
    generation: s.generation + 1,
    first: pick(rand, story.firstNames.filter((f) => f !== s.first)),
    nick: null,
    rank: 0,
    status: 'active',
    enlisted: day,
    fallenDay: undefined,
    fallen: [...s.fallen, prev],
    record: [],
  };
  n.name = displayName(n);
  const relation = pick(rand, story.relations);
  n.record.push([day, eventEntry('heir', n, day, theme, story, { relation, prevName: prev.name })]);
  return n;
}
