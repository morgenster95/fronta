// Údolí a výpravy (docs/MAP_MISSIONS.md): místa, která frakce drží, dobrovolníci (komentář s heslem / tlačítko na webu),
// souboj družstev 5 na 5 se staty rolí, následky (zranění, nezvěstní, zajatí, výjimečně padlí), článek do ranních novin.
// Deterministické (seed = id výpravy), bez AI. Nastavení v theme.valley, texty v story.expedition.

import { fallSoldier, addEntry } from './soldier.js';
import { rngFor, pick } from './rng.js';
import { fill, soldierVars } from './story.js';
import { activeBarrage } from './race.js';

const cap = (t) => t[0].toUpperCase() + t.slice(1);
const short = (theme, f) => theme.factions[f].name.replace(/^The /, '');
const V = (theme) => theme.valley;

export function ensureValley(state, theme) {
  if (!V(theme)) return null;
  state.valley ??= { holders: {}, contested: {}, next: V(theme).firstDay ?? state.day + 1, open: null, history: [], n: 0 };
  return state.valley;
}

export const locationOf = (theme, id) => V(theme)?.locations.find((l) => l.id === id) || null;

// kdo drží místo s danou výhodou (perk) → frakce nebo null
export function perkHolder(state, theme, perk) {
  const loc = V(theme)?.locations.find((l) => l.perk === perk);
  const h = loc ? state.valley?.holders?.[loc.id] : null;
  return h ?? null;
}
const holds = (state, theme, perk, f) => perkHolder(state, theme, perk) === f;

// --- výhody z území mimo souboj (denní tah) ---
// násobek nebezpečí pro vojáka
export function valleyDanger(state, theme, s, day) {
  if (!V(theme) || !state.valley) return 1;
  let m = 1;
  if (holds(state, theme, 'supplies', s.faction)) m *= 0.9; // zásoby z ruin města: méně zraněných
  if (holds(state, theme, 'cover', s.faction) && s.line === 'front') m *= 0.85; // cihelna: úkryt pro přední linii
  if (holds(state, theme, 'morale', s.faction) && activeBarrage(state, day)?.target === s.faction) m *= 0.8; // hřbitov: morálka při bombardování
  return m;
}
// šance na uzdravení za den (polní nemocnice ji zvedá)
export function valleyRecover(state, theme, s) {
  return holds(state, theme, 'hospital', s.faction) ? 0.55 : 0.35;
}

// --- přihlášky ---
const eligible = (s) => s && s.status === 'active';

export function raidKeyword(state, theme, text) {
  const o = state.valley?.open;
  if (!o) return false;
  const kw = locationOf(theme, o.loc)?.keyword;
  return !!kw && new RegExp(`\\b${kw}\\b`, 'i').test(text || '');
}

// přihlásí vojáka na otevřenou výpravu; vrací { ok, reason }
export function volunteer(state, theme, s, via = 'comment') {
  const o = state.valley?.open;
  if (!o) return { ok: false, reason: 'closed' };
  if (!eligible(s)) return { ok: false, reason: 'notActive' };
  if (o.volunteers.some((v) => v.h === s.handle)) return { ok: false, reason: 'already' };
  const slots = V(theme).slots ?? 5;
  if (o.volunteers.filter((v) => v.f === s.faction).length >= slots) return { ok: false, reason: 'full' };
  o.volunteers.push({ h: s.handle, f: s.faction, via, day: state.day });
  return { ok: true, reason: 'ok', loc: locationOf(theme, o.loc) };
}

// odpověď pod komentář s přihláškou (theme.valley.replies[reason]); null = neodpovídat (např. „already“)
export function raidReply(state, theme, s, reason, rand = Math.random) {
  const pool = V(theme)?.replies?.[reason];
  if (!pool?.length) return null;
  const o = state.valley?.open;
  const loc = o ? locationOf(theme, o.loc) : null;
  const n = o ? o.volunteers.filter((v) => v.f === s.faction).length : 0;
  return pool[Math.floor(rand() * pool.length)]
    .replace(/\{handle\}/g, s.handle).replace(/\{loc\}/g, loc?.name ?? 'the raid').replace(/\{slots\}/g, String(V(theme).slots ?? 5))
    .replace(/\{kw\}/g, loc?.keyword ?? '').replace(/\{n\}/g, String(n)).replace(/\{us\}/g, s.faction != null ? short(theme, s.faction) : '');
}

// --- vyhlášení ---
function chooseLocation(state, theme) {
  const last = {};
  for (const h of state.valley.history) last[h.loc] = h.day;
  const locs = V(theme).locations;
  if (!state.valley.history.length && V(theme).first) return locationOf(theme, V(theme).first);
  // nejdéle nenavštívené místo (pořadí v tématu rozhoduje remízu)
  return locs.reduce((best, l) => ((last[l.id] ?? -1) < (last[best.id] ?? -1) ? l : best), locs[0]);
}

function announce(state, theme, story, day) {
  const v = state.valley;
  const loc = chooseLocation(state, theme);
  v.n++;
  v.open = { id: `x${v.n}-${loc.id}-d${day}`, loc: loc.id, day, closesDay: day + 1, volunteers: [] };
  v.next = day + (V(theme).every ?? 3);
  const E = story.expedition;
  const rand = rngFor(theme.id, 'announce', v.open.id);
  const holder = v.holders[loc.id];
  const vars = {
    loc: loc.name, short: loc.short, kw: loc.keyword, slots: String(V(theme).slots ?? 5), ig: theme.instagram,
    held: holder == null ? (v.contested[loc.id] ? E.contested : E.nobody) : fill(E.heldBy, { us: short(theme, holder) }, rand),
    perk: loc.perkText,
  };
  return { day, kind: 'expedition-call', h: cap(fill(pick(rand, E.callTitles), vars, rand)), text: fill(E.call, vars, rand) };
}

// --- souboj ---
function roll(rand) {
  return 1 + Math.floor(rand() * 9);
}

function buildSquad(state, theme, soldiers, side, ctx) {
  const roles = V(theme).roles;
  const K = ctx.K;
  const units = soldiers.map((s) => {
    const r = roles[s.archetype] || roles.rifleman;
    return { s, side, ab: r.ability || null, hp: r.hp * K, max: r.hp * K, atk: r.atk, def: r.def, dmg: 0, downs: 0, healed: 0, down: false, saved: false };
  });
  const has = (ab) => units.some((u) => u.ab === ab);
  for (const u of units) {
    if (has('morale') && u.ab !== 'morale') { u.atk++; u.def++; } // kuchař: ostatním +1/+1
    if (has('faith')) { u.hp += 2 * K; u.max += 2 * K; } // kaplan: +2 životy
    if (ctx.perks.crossing === side) { u.hp += 2 * K; u.max += 2 * K; } // mlýn: odpočatí přes kanál
    if (u.ab === 'demolition' && ctx.loc.demolition) u.atk += 3; // ženista u budov a tunelů
    if (u.ab === 'demolition' && ctx.perks.tunnels === side) u.atk += 2; // lom: tunely
    if (ctx.holder === side) u.def++; // obránce místa
    if (ctx.weather === 'fog' && ctx.holder !== side) u.atk++; // mlha pomáhá nájezdům
    if (ctx.heights === side) u.atk++; // výhoda z dobyté kóty
    if (u.ab === 'firstshot') {
      if (ctx.weather === 'fog') u.atk = Math.floor(u.atk / 2);
      if (ctx.weather === 'clear') u.atk += 2;
    }
  }
  return units;
}

function fight(squads, ctx, rand) {
  const log = [];
  const alive = (side) => squads[side].filter((u) => !u.down);
  const start = squads.map((sq) => sq.reduce((n, u) => n + u.hp, 0));
  const suppress = squads.map((sq) => sq.some((u) => u.ab === 'suppress'));
  const command = squads.map((sq) => sq.some((u) => u.ab === 'command'));
  const fled = [false, false];
  const savers = squads.map((sq) => sq.some((u) => u.ab === 'heal'));
  const hit = (a, t, atk, kind, round) => {
    const dmg = Math.max(1, atk + roll(rand) - Math.floor(t.def / 2));
    t.hp -= dmg;
    a.dmg += dmg;
    log.push({ round, kind, a: a.s.handle, t: t.s.handle, dmg });
    if (t.hp <= 0 && !t.down) {
      t.down = true;
      t.hp = 0;
      a.downs++;
      // zdravotník zachrání jednoho před smrtí
      if (savers[t.side]) {
        savers[t.side] = false;
        t.saved = squads[t.side].find((u) => u.ab === 'heal' && !u.down)?.s.handle || squads[t.side].find((u) => u.ab === 'heal').s.handle;
      }
      log.push({ round, kind: 'down', a: a.s.handle, t: t.s.handle });
    }
  };
  const target = (a) => {
    const foes = alive(1 - a.side);
    if (!foes.length) return null;
    if (a.ab === 'command') return foes.reduce((w, u) => (u.hp < w.hp ? u : w), foes[0]);
    return pick(rand, foes);
  };
  // kolo 0: ostřelovači a dělostřelectvo spojařů
  for (const side of [0, 1]) {
    let guns = 0;
    for (const u of squads[side]) {
      if (u.ab === 'firstshot') { const t = target(u); if (t) hit(u, t, u.atk, 'snipe', 0); }
      if (u.ab === 'artillery' && guns < 2 && (ctx.perks.observe === side || ctx.perks.intel === side || ctx.weather === 'clear')) {
        const t = target(u);
        if (t) {
          guns++;
          t.hp -= 5 * ctx.K;
          u.dmg += 5 * ctx.K;
          log.push({ round: 0, kind: 'shell', a: u.s.handle, t: t.s.handle, dmg: 5 * ctx.K });
          if (t.hp <= 0) { t.hp = 0; t.down = true; u.downs++; log.push({ round: 0, kind: 'down', a: u.s.handle, t: t.s.handle }); }
        }
      }
    }
  }
  let rounds = 0;
  for (let round = 1; round <= 5; round++) {
    if (!alive(0).length || !alive(1).length || fled[0] || fled[1]) break;
    rounds = round;
    const order = [...squads[0], ...squads[1]]
      .map((u) => ({ u, init: (u.ab === 'initiative' ? 3 : u.ab === 'command' ? 2 : 0) + (ctx.perks.intel === u.side ? 1 : 0) + rand() }))
      .sort((a, b) => b.init - a.init)
      .map((x) => x.u);
    for (const u of order) {
      if (u.down) continue;
      if (u.ab === 'heal') {
        const hurt = alive(u.side).filter((x) => x.hp < x.max).sort((a, b) => a.hp / a.max - b.hp / b.max)[0];
        if (hurt) {
          const h = Math.min(3 * ctx.K, hurt.max - hurt.hp);
          hurt.hp += h;
          u.healed += h;
          log.push({ round, kind: 'heal', a: u.s.handle, t: hurt.s.handle, dmg: h });
        }
      }
      // potlačení kulometem v 1. kole; rozkaz poručíka: +1 útok celému družstvu v 1. kole
      const atk = u.atk - (round === 1 && suppress[1 - u.side] ? 1 : 0) + (round === 1 && command[u.side] ? 1 : 0);
      if (u.ab === 'suppress' && (ctx.weather === 'rain' || ctx.weather === 'storm') && rand() < 0.3) {
        log.push({ round, kind: 'jam', a: u.s.handle });
        continue;
      }
      const shots = u.ab === 'suppress' ? 2 : 1;
      for (let k = 0; k < shots; k++) {
        const t = target(u);
        // dávka: dva cíle, každý slabším zásahem
        const a = u.ab === 'suppress' ? atk - (ctx.burstMalus ?? 2) : atk;
        if (t && a > 0) hit(u, t, a, u.ab === 'suppress' ? 'burst' : 'shot', round);
      }
    }
    // útěk: ztráta 70 % životů (kaplan útěku brání); utíká jen ta strana, která je na tom hůř
    const ratio = [0, 1].map((side) => alive(side).reduce((n, u) => n + u.hp, 0) / start[side]);
    const breaks = [0, 1].filter((side) => ratio[side] <= 0.3 && alive(side).length && !squads[side].some((u) => u.ab === 'faith' && !u.down));
    if (breaks.length) {
      const side = breaks.length === 1 ? breaks[0] : ratio[0] < ratio[1] ? 0 : ratio[1] < ratio[0] ? 1 : ctx.holder === 0 ? 1 : ctx.holder === 1 ? 0 : rand() < 0.5 ? 0 : 1;
      fled[side] = true;
      log.push({ round, kind: 'rout', side });
    }
  }
  const left = [0, 1].map((side) => alive(side).reduce((n, u) => n + u.hp, 0));
  let winner = null, decisive = false;
  for (const side of [0, 1]) {
    if (!alive(side).length || fled[side]) { winner = 1 - side; decisive = true; }
  }
  if ((!alive(0).length || fled[0]) && (!alive(1).length || fled[1])) winner = null;
  if (winner == null && !decisive) {
    // po 5 kolech: víc zbylých životů (poměrně k začátku); těsný rozdíl = remíza, obránce místo udrží
    const share = [0, 1].map((side) => left[side] / start[side]);
    if (Math.abs(share[0] - share[1]) >= 0.1) winner = share[0] > share[1] ? 0 : 1;
    else if (ctx.holder != null) winner = ctx.holder;
  }
  return { log, winner, decisive, fled, left, start, rounds };
}

// výprava jen jedné frakce: bojuje s místem samotným (miny, plyn, zřícení) a téměř jistě uspěje
function hazard(squad, ctx, rand) {
  const log = [];
  for (const u of squad) {
    if (rand() < 0.22) {
      const dmg = Math.ceil((3 + Math.floor(rand() * 5)) * ctx.K * (u.ab === 'demolition' ? 0.5 : 1));
      u.hp -= dmg;
      log.push({ round: 1, kind: 'hazard', t: u.s.handle, dmg });
      if (u.hp <= 0) { u.hp = 0; u.down = true; log.push({ round: 1, kind: 'down', t: u.s.handle }); }
    }
  }
  const bonus = squad.some((u) => u.ab === 'demolition' || u.ab === 'command') ? 0.04 : 0;
  const ok = squad.some((u) => !u.down) && rand() < 0.9 + bonus;
  return { log, winner: ok ? squad[0].side : null, decisive: ok, fled: [false, false], left: [0, 0], start: [0, 0], rounds: 1 };
}

// osud vojáka na 0 životů (smrt výjimečně, převzatí hráči a zachránění zdravotníkem nikdy)
function fateOf(u, lost, runner, day, rand) {
  const r = rand();
  if (!u.s.claimed && !u.saved && day - u.s.enlisted >= 5 && r < 0.04) return 'fallen';
  if (lost && !runner) return r < 0.35 ? 'captured' : r < 0.55 ? 'missing' : 'wounded';
  return r < 0.8 ? 'wounded' : 'missing';
}

// --- vyhodnocení otevřené výpravy ---
export function resolveExpedition(state, theme, story, day, weather) {
  const v = state.valley;
  const o = v.open;
  v.open = null;
  const loc = locationOf(theme, o.loc);
  const E = story.expedition;
  const rand = rngFor(theme.id, 'raid', o.id);
  const byHandle = new Map(state.soldiers.map((s) => [s.handle, s]));
  // kdo se přihlásil a pořád je na linii
  const sides = [0, 1].map((f) => o.volunteers.filter((x) => x.f === f).map((x) => byHandle.get(x.h)).filter((s) => eligible(s) && s.faction === f));
  const holder = v.holders[loc.id] ?? null;
  const perks = Object.fromEntries(['observe', 'intel', 'crossing', 'tunnels'].map((p) => [p, perkHolder(state, theme, p)]));
  const heightsV = (state.victories || []).filter((x) => day >= x.from && day <= x.to).at(-1);
  const ctx = { loc, holder, weather, perks, heights: heightsV ? heightsV.faction : null, K: V(theme).hpScale ?? 1, burstMalus: V(theme).burstMalus ?? 2 };
  const squads = sides.map((list, f) => buildSquad(state, theme, list, f, ctx));
  const n = squads.map((s) => s.length);
  const result = { id: o.id, loc: loc.id, day, announced: o.day, weather, holderBefore: holder, squads: sides.map((l) => l.map((s) => s.handle)), fates: {}, mvp: null };

  if (!n[0] && !n[1]) {
    result.outcome = 'empty';
    result.winner = null;
  } else {
    const solo = !n[0] || !n[1];
    const b = solo ? hazard(squads[n[0] ? 0 : 1], ctx, rand) : fight(squads, ctx, rand);
    Object.assign(result, { winner: b.winner, decisive: b.decisive, rounds: b.rounds, fled: b.fled, log: b.log.slice(0, 80) });
    result.outcome = solo ? (b.winner != null ? 'solo' : 'soloFail') : b.winner == null ? 'stalemate' : b.winner === holder ? 'hold' : 'take';
    // následky
    const all = [...squads[0], ...squads[1]];
    for (const u of all) {
      if (!u.down) { result.fates[u.s.handle] = 'ok'; continue; }
      const lost = b.winner != null && b.winner !== u.side;
      const runner = squads[u.side].some((x) => x.ab === 'initiative');
      result.fates[u.s.handle] = solo ? 'wounded' : fateOf(u, lost, runner, day, rand);
    }
    const best = (b.winner != null ? squads[b.winner] : all).filter((u) => u.dmg > 0).sort((a, z) => z.dmg - a.dmg)[0];
    if (best) result.mvp = best.s.handle;
    result.stats = Object.fromEntries(all.map((u) => [u.s.handle, [u.dmg, u.downs, u.healed]]));
    // změna majitele
    if (b.winner != null) {
      v.holders[loc.id] = b.winner;
      delete v.contested[loc.id];
    } else if (!solo) v.contested[loc.id] = true;
  }
  result.holderAfter = v.holders[loc.id] ?? null;
  const news = gazette(result, loc, theme, story, rand);
  result.headline = news.h;
  v.history = [...v.history, { ...result, log: undefined }].slice(-200);
  const events = applyFates(state, theme, story, result, loc, day);
  return { news, events, ids: new Set([...sides[0], ...sides[1]].map((s) => s.id)), result };
}

// zápisy do služebních záznamů, stavy, medaile
function applyFates(state, theme, story, r, loc, day) {
  const E = story.expedition;
  const events = [];
  const byHandle = new Map(state.soldiers.map((s) => [s.handle, s]));
  const nameOf = (h) => byHandle.get(h)?.name ?? `@${h}`;
  r.squads.forEach((list, f) => {
    for (const h of list) {
      const s = byHandle.get(h);
      if (!s) continue;
      const rand = rngFor(s.id, 'raid', r.id);
      const mates = list.filter((x) => x !== h).map(nameOf);
      const won = r.winner === f;
      const kind = r.outcome === 'solo' ? 'solo' : r.outcome === 'soloFail' ? 'soloFail' : r.winner == null ? 'stalemate' : won ? 'won' : 'lost';
      const fate = r.fates[h] || 'ok';
      const vars = soldierVars(s, theme, story, {
        loc: loc.name, short: loc.short, us: short(theme, f), them: short(theme, 1 - f),
        mates: mates.length ? listNames(mates) : E.alone,
        withMates: mates.length ? fill(E.withMates, { mates: listNames(mates) }, rand) : '',
      });
      let text = fill(pick(rand, E.record[kind]), vars, rand) + ' ' + fill(pick(rand, E.fate[fate]), vars, rand);
      if (r.mvp === h && won) text += ' ' + fill(pick(rand, E.mvp), vars, rand);
      text = text.replace(/\s+/g, ' ').replace(/ ([.,;:])/g, '$1').trim(); // prázdné {withMates} nesmí nechat „ .“
      s.raids = (s.raids || 0) + 1;
      s.medals ??= [];
      if (s.raids >= 3 && !s.medals.includes('raiders-cross')) {
        s.medals.push('raiders-cross');
        text += ' ' + fill(pick(rand, E.cross), vars, rand);
      }
      if (r.mvp === h && won) {
        const t = `${theme.valley.mvpTitle || 'Raider of'} ${loc.short}`;
        if (!(s.titles || []).includes(t)) s.titles = [...(s.titles || []), t];
      }
      addEntry(s, day, text);
      if (fate === 'wounded') s.status = 'wounded';
      else if (fate === 'missing') { s.status = 'missing'; s.missingDay = day; }
      else if (fate === 'captured') { s.status = 'captured'; s.capturedDay = day; }
      else if (fate === 'fallen') fallSoldier(s, day, 'raid', { place: loc.short });
      events.push({ type: fate === 'ok' ? 'raid' : fate, handle: h, faction: f, text, raid: true });
    }
  });
  return events;
}

function listNames(names, max = 6) {
  const shown = names.slice(0, max);
  if (names.length > max) shown.push(`${names.length - max} others`);
  return shown.length > 1 ? `${shown.slice(0, -1).join(', ')} and ${shown.at(-1)}` : shown[0];
}

// článek na titulní stranu novin
function gazette(r, loc, theme, story, rand) {
  const E = story.expedition;
  const at = (h) => `@${h}`;
  const F = (f) => short(theme, f);
  const vars = {
    loc: loc.name, short: loc.short, perk: loc.perkText,
    W: r.winner != null ? F(r.winner) : '', L: r.winner != null ? F(1 - r.winner) : '',
    A: F(0), B: F(1), nA: String(r.squads[0].length), nB: String(r.squads[1].length),
    weather: E.weather[r.weather] || E.weather.default,
    S: r.squads[0].length ? F(0) : F(1),
  };
  if (r.outcome === 'empty') return { day: r.day, kind: 'expedition', h: cap(fill(pick(rand, E.headlines.empty), vars, rand)), text: fill(pick(rand, E.lines.empty), vars, rand) };
  const parts = [];
  const solo = r.outcome === 'solo' || r.outcome === 'soloFail';
  const team = (f) => r.squads[f].map(at);
  parts.push(fill(pick(rand, solo ? E.lines.openSolo : E.lines.open), vars, rand));
  parts.push(r.squads.map((l, f) => (l.length ? `${F(f)}: ${listNames(team(f), 5)}.` : null)).filter(Boolean).join(' '));
  const log = r.log || [];
  const first = log.find((x) => x.kind === 'snipe' || x.kind === 'shell');
  if (first) parts.push(fill(pick(rand, E.lines[first.kind]), { ...vars, a: at(first.a), t: at(first.t) }, rand));
  const jam = log.find((x) => x.kind === 'jam');
  if (jam) parts.push(fill(pick(rand, E.lines.jam), { ...vars, a: at(jam.a) }, rand));
  if (r.mvp && !solo) {
    const downs = r.stats?.[r.mvp]?.[1] ?? 0;
    parts.push(fill(pick(rand, downs > 1 ? E.lines.mvp : downs === 1 ? E.lines.mvpOne : E.lines.mvpNone), { ...vars, a: at(r.mvp), n: String(downs) }, rand));
  }
  const healer = Object.entries(r.stats || {}).filter(([, s]) => s[2] > 0).sort((a, b) => b[1][2] - a[1][2])[0];
  const healed = healer ? log.find((x) => x.kind === 'heal' && x.a === healer[0] && x.t !== healer[0]) : null;
  if (healed) parts.push(fill(pick(rand, E.lines.heal), { ...vars, a: at(healer[0]), t: at(healed.t) }, rand));
  const rout = log.find((x) => x.kind === 'rout');
  if (rout) parts.push(fill(pick(rand, E.lines.rout), { ...vars, X: F(rout.side), round: String(rout.round) }, rand));
  if (r.outcome === 'solo' || r.outcome === 'soloFail') {
    const hz = log.filter((x) => x.kind === 'hazard');
    if (hz.length) parts.push(fill(pick(rand, E.lines.hazard), { ...vars, t: listNames(hz.map((x) => at(x.t))) }, rand));
  }
  // ztráty
  const by = (k) => Object.entries(r.fates).filter(([, f]) => f === k).map(([h]) => at(h));
  const losses = [['Wounded', by('wounded')], ['Missing', by('missing')], ['Taken prisoner', by('captured')], ['Fallen', by('fallen')]].filter(([, l]) => l.length);
  parts.push(losses.length ? losses.map(([k, l]) => `${k}: ${listNames(l)}.`).join(' ') : fill(pick(rand, [].concat(E.lines.noLoss)), vars, rand));
  parts.push(fill(pick(rand, E.lines[r.outcome]), vars, rand));
  return { day: r.day, kind: 'expedition', h: cap(fill(pick(rand, E.headlines[r.outcome]), vars, rand)), text: parts.filter(Boolean).join(' ') };
}

// Volá denní tah po posunu dne: vyhodnotí výpravu z minulého vydání a případně vyhlásí novou.
// Vrací { news: [], events: [], ids: Set (účastníci, ti dnes nemají běžný zápis) }.
export function valleyTick(state, theme, story, day, weatherOfNight) {
  const v = ensureValley(state, theme);
  const out = { news: [], events: [], ids: new Set() };
  if (!v) return out;
  if (v.open && day >= v.open.closesDay) {
    const r = resolveExpedition(state, theme, story, day, weatherOfNight);
    out.news.push(r.news);
    out.events.push(...r.events);
    r.ids.forEach((id) => out.ids.add(id));
  }
  // výpravy jdou vypnout (theme.valley.enabled = false): žádná nová výzva, otevřená se zruší bez boje
  if (V(theme).enabled === false) { v.open = null; return out; }
  if (!v.open && day >= v.next) out.news.push(announce(state, theme, story, day));
  return out;
}

// zajatci: výměna zajatců po pár dnech (do příchodu společné události výměny)
export function exchangeDue(s, day, rand) {
  const d = day - (s.capturedDay ?? day);
  return d >= 6 || (d >= 3 && rand() < 0.4);
}

// --- veřejná data pro web ---
export function valleyPublic(state, theme) {
  const v = state.valley;
  if (!V(theme) || !v) return { roster: null, file: null };
  const o = v.open;
  const loc = o ? locationOf(theme, o.loc) : null;
  const last = v.history.at(-1);
  const roster = {
    open: o ? { id: o.id, loc: o.loc, name: loc.name, keyword: loc.keyword, day: o.day, closesDay: o.closesDay, count: o.volunteers.length, slots: V(theme).slots ?? 5 } : null,
    next: v.next,
    holders: v.holders,
    last: last ? { day: last.day, loc: last.loc, headline: last.headline } : null,
  };
  const file = {
    updated: new Date().toISOString(),
    holders: v.holders,
    contested: v.contested,
    open: roster.open,
    next: v.next,
    // kronika míst: kdo kdy vyrazil, za jakou frakci, jak to dopadlo
    history: v.history.slice(-120).reverse().map((h) => ({
      day: h.day, loc: h.loc, outcome: h.outcome, winner: h.winner, headline: h.headline, squads: h.squads, fates: h.fates, mvp: h.mvp, weather: h.weather,
    })),
  };
  return { roster, file };
}
