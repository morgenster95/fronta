// Voják: vznik z komentáře, vzhled z hashe IG ID, denní tah (zápisy, povýšení, zranění, smrt a nástupce z rodu).

import { rngFor, pick, weighted } from './rng.js';
import { exchangeDue } from './valley.js';
import { dailyEntry, eventEntry, soldierVars, fill, pickVaried, tplKey, makeBackground } from './story.js';

export const STATUS = ['active', 'wounded', 'missing', 'captured', 'fallen'];

// Smrt vojáka. cause: nobed (zemřel na nosítkách, lůžka plná) | wounds (zemřel na lůžku) | raid (na výpravě) | line (starý model)
// extra: { shell: true } = zasažen při bombardování, place = kde
export function fallSoldier(s, day, cause, extra = {}) {
  s.status = 'fallen';
  s.fallenDay = day;
  s.arc = null;
  s.cause = { kind: cause, ...(s.wound?.shell ? { shell: true } : {}), ...(s.sector ? { sector: s.sector } : {}), ...extra };
  s.wound = null;
}

// Záznam o jedné generaci rodu (zůstává navždy v s.fallen; name/day/rank kvůli starším datům a webu)
export function lifeRecord(s) {
  return {
    name: s.name, day: s.fallenDay, rank: s.rank,
    gen: s.generation, first: s.first, nick: s.nick || null, archetype: s.archetype, variant: s.variant,
    enlisted: s.enlisted, days: Math.max(0, (s.fallenDay ?? s.enlisted) - s.enlisted),
    cause: s.cause || { kind: 'line' }, relation: s.relation || null,
    medals: s.medals || [], titles: s.titles || [], scars: s.scars || 0, wounds: s.woundsTaken || 0,
    treated: s.treated || 0, raids: s.raids || 0, sector: s.sector || null,
    rec: [s.recFrom || 0, s.record.length], // rozsah zápisů této generace v deníku rodu
    last: s.record.at(-1)?.[1] || null,
  };
}

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
  s.bg = makeBackground(s, story);
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
// ctx: { danger, active, weather, events: [] (pro kroniku dne), comrade(s, rand), foe(s, rand) }
export function tickSoldier(s, day, theme, story, ctx = {}) {
  const rand = rngFor(s.id, 'fate', day);
  const out = [];
  const ev = (type, text, extra = {}) => {
    ctx.events?.push({ type, handle: s.handle, faction: s.faction, text, ...extra });
    return text;
  };
  if (s.status === 'wounded') {
    if (ctx.battle) return out; // zranění vede engine/battle.js (lůžka, medici)
    if (rand() < (ctx.recover ?? 0.35)) {
      s.status = 'active';
      out.push(ev('recovered', eventEntry('recovered', s, day, theme, story, {}, ctx.today)));
    }
    return out;
  }
  if (s.status === 'missing') {
    // nezvěstný se vrátí do pár dnů (nejpozději čtvrtý den)
    if (rand() < 0.45 || day - (s.missingDay ?? day) >= 4) {
      s.status = 'active';
      delete s.missingDay;
      out.push(ev('returned', eventEntry('returned', s, day, theme, story, {}, ctx.today)));
    }
    return out;
  }
  if (s.status === 'captured') {
    // zajatý z výpravy: vrátí se výměnou zajatců za 3–6 dní
    if (exchangeDue(s, day, rand)) {
      s.status = 'active';
      delete s.capturedDay;
      out.push(ev('returned', eventEntry(story.exchanged ? 'exchanged' : 'returned', s, day, theme, story, {}, ctx.today)));
    }
    return out;
  }
  if (s.status !== 'active') return out;

  const danger = (ctx.danger ?? 1) * (s.line === 'front' ? 1.5 : s.line === 'reserve' ? 0.4 : 1);
  const protect = ctx.active || s.claimed ? 0.35 : 1; // aktivní hráči padají ~3× méně
  const wound = 0.03 * danger;
  const lost = wound + (story.missing ? 0.006 * danger : 0);
  const r = rand();
  if (ctx.battle) {
    // zásahy a smrt řeší denní boj (engine/battle.js); tady jen nezvěstní, povýšení a příběh
    if (story.missing && r < 0.006 * danger && day - s.enlisted >= 2) {
      s.status = 'missing';
      s.missingDay = day;
      out.push(ev('missing', eventEntry('missing', s, day, theme, story, {}, ctx.today)));
    } else if (r > 0.985 && s.rank < 4) {
      const oldRank = theme.ranks[s.rank];
      s.rank++;
      out.push(ev('promotion', eventEntry('promotion', s, day, theme, story, { oldRank }, ctx.today)));
    } else out.push(storyDay(s, day, theme, story, ctx, ev));
    return out;
  }
  if (r < 0.004 * danger * protect && day - s.enlisted >= 5) {
    // padl: smrt nikdy z ničeho nic, jen po aspoň 5 dnech služby
    out.push(ev('fallen', eventEntry('fallen', s, day, theme, story, {}, ctx.today)));
    fallSoldier(s, day, 'line');
  } else if (r < wound) {
    s.status = 'wounded';
    out.push(ev('wounded', eventEntry('wounded', s, day, theme, story, {}, ctx.today)));
  } else if (r < lost && day - s.enlisted >= 2) {
    s.status = 'missing';
    s.missingDay = day;
    out.push(ev('missing', eventEntry('missing', s, day, theme, story, {}, ctx.today)));
  } else if (r > 0.985 && s.rank < 4) {
    const oldRank = theme.ranks[s.rank];
    s.rank++;
    out.push(ev('promotion', eventEntry('promotion', s, day, theme, story, { oldRank }, ctx.today)));
  } else {
    out.push(storyDay(s, day, theme, story, ctx, ev));
  }
  return out;
}

// Běžný den: pokračování příběhové linky > nová linka > příhoda se spolubojovníkem / nepřítelem > zápis dne.
function storyDay(s, day, theme, story, ctx, ev) {
  const rand = rngFor(s.id, 'story', day);
  if (s.arc && day >= s.arc.next) return arcStep(s, day, theme, story, rand, ev, ctx.today);
  const r = rand();
  if (!s.arc && story.arcs && r < 0.12) {
    const done = new Set(s.arcsDone || []);
    const pool = story.arcs.filter((a) => !done.has(a.id) && (!a.archetype || a.archetype === s.archetype));
    if (pool.length) {
      // linku, kterou dnes začal někdo jiný, dostane druhý jen zřídka
      const a = weighted(rand, pool.map((x) => [x, x.w * (x.archetype ? 2 : 1) * (ctx.today?.has(`arc:${x.id}`) ? 0.1 : 1)]));
      ctx.today?.add(`arc:${a.id}`);
      const v = {};
      for (const [k, opts] of Object.entries(a.vars || {})) v[k] = pick(rand, opts);
      s.arc = { id: a.id, step: 0, next: day, v };
      return arcStep(s, day, theme, story, rand, ev, ctx.today);
    }
  }
  if (r >= 0.12 && r < 0.27 && story.comrade && ctx.comrade) {
    const o = ctx.comrade(s, rand);
    if (o) return pairEntry('comrade', s, o, day, theme, story, rand, ev, ctx.today);
  }
  if (r >= 0.27 && r < 0.34 && story.enemy && ctx.foe) {
    const o = ctx.foe(s, rand);
    if (o) return pairEntry('enemy', s, o, day, theme, story, rand, ev, ctx.today);
  }
  return dailyEntry(s, day, theme, story, ctx.weather?.id, ctx.today);
}

function arcStep(s, day, theme, story, rand, ev, today = null) {
  const a = story.arcs?.find((x) => x.id === s.arc.id);
  if (!a) {
    s.arc = null;
    return dailyEntry(s, day, theme, story, null, today);
  }
  const vars = soldierVars(s, theme, story, { place: pick(rngFor(s.id, 'arcplace', a.id), story.places), ...s.arc.v });
  const text = fill(a.steps[s.arc.step], vars, rand);
  const last = s.arc.step >= a.steps.length - 1;
  ev(last ? 'arc-end' : s.arc.step === 0 ? 'arc-start' : 'arc', text, { arc: a.id, tpl: `${a.id}${s.arc.step}` });
  if (last) {
    s.arcsDone = [...(s.arcsDone || []), a.id];
    s.arc = null;
  } else {
    s.arc.step++;
    s.arc.next = day + 1 + Math.floor(rand() * 3); // další díl za 1–3 dny
  }
  return text;
}

// Dva skuteční hráči v jednom zápisu: stejný text jde do záznamu obou.
function pairEntry(kind, s, o, day, theme, story, rand, ev, today = null) {
  const short = (f) => theme.factions[f].name.replace(/^The /, '');
  const shortName = (x) => x.nick || x.first || x.name;
  const vars = soldierVars(s, theme, story, {
    place: pick(rand, story.places), a: s.name, b: o.name, as: shortName(s), bs: shortName(o), af: short(s.faction), bf: short(o.faction),
  });
  // šablona, kterou neměl ani jeden z dvojice a dnes ji nedostal nikdo jiný
  const seenO = new Set(o.seen || []);
  const raw = pickVaried(rand, story[kind].map((x) => [x, seenO.has(tplKey(x)) ? 0.02 : 1]), s, today);
  o.seen = [...(o.seen || []), tplKey(raw)].slice(-200);
  const tpl = story[kind].indexOf(raw);
  const text = fill(raw, vars, rand);
  o.record.push([day, text]);
  ev(kind, text, { other: o.handle, tpl: `${kind}${tpl}` });
  return text;
}

// Nástupce z rodu: stejné IG jméno i místo, nové křestní jméno, odkaz na padlého.
// Nástupce z rodu: NOVÝ voják. Nic nedědí (medaile, tituly, jizvy, výdrž, zkušenosti, role, hodnost), dny se mu počítají od nuly.
// Zůstává jen rod: hráč (IG účet, převzetí), příjmení, stanoviště na frontě, domov a deník rodu (zápisy padlých se nemažou).
export function heir(s, day, theme, story, today = null) {
  const rand = rngFor(s.id, 'heir', s.generation);
  const prev = lifeRecord(s);
  const gen = s.generation + 1;
  const roles = theme.archetypes.filter((a) => a.id !== 'officer').map((a) => [a.id, a.weight]);
  const n = {
    id: s.id, handle: s.handle, faction: s.faction, order: s.order, family: s.family, pronoun: s.pronoun,
    claimed: s.claimed, ownerUid: s.ownerUid, bio: s.bio, slot: s.slot, pos: s.pos, sector: s.sector, line: s.line, unit: s.unit, seen: s.seen,
    generation: gen,
    first: pick(rand, story.firstNames.filter((f) => f !== s.first)),
    nick: rand() < 0.35 ? pick(rand, story.nicknames) : null,
    archetype: weighted(rand, roles),
    rank: 0,
    status: 'active',
    enlisted: day,
    variant: Math.floor(rand() * 4),
    medals: [],
    titles: [],
    fallen: [...(s.fallen || []), prev],
    arc: null,
    arcsDone: [],
    bg: s.bg ? { ...makeBackground({ id: `${s.id}#${gen}` }, story), home: s.bg.home } : undefined,
    record: [...s.record], // deník rodu pokračuje: zápisy padlého se nikdy nemažou
    recFrom: s.record.length,
  };
  n.name = displayName(n);
  n.relation = pick(rand, story.relations);
  n.record.push([day, eventEntry('heir', n, day, theme, story, { relation: n.relation, prevName: prev.name }, today)]);
  return n;
}
