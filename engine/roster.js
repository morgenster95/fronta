// Stav světa (soupiska) a jeho změny: komentář → narukování, kód → převzetí, denní tah, export statických dat pro web.

import { createSoldier, tickSoldier, heir, selectForStory } from './soldier.js';
import { enlistEntry } from './story.js';
import { hashString } from './rng.js';
import { openRange } from './mapgen.js';

export const SHARDS = 64;

export function emptyState(theme) {
  return {
    theme: theme.id,
    day: 1,
    followers: 0,
    openSectors: 8, // kolik sektorů kolem středu je otevřeno; roste se zaplněním
    soldiers: [], // plné záznamy
    seenComments: [], // ID zpracovaných komentářů (posledních pár tisíc)
    votes: {}, // { voteId: { optionKeyword: [handles] } }
    log: [],
  };
}

const CLAIM_RE = /\bENLIST-([A-Z0-9]{4})\b/i;

export function parseComment(text, theme) {
  const t = (text || '').toUpperCase();
  const claim = t.match(CLAIM_RE);
  if (claim) return { type: 'claim', code: `ENLIST-${claim[1].toUpperCase()}` };
  const hits = theme.factions
    .map((f, i) => ({ i, at: t.search(new RegExp(`\\b${f.keyword}\\b`)) }))
    .filter((h) => h.at >= 0)
    .sort((a, b) => a.at - b.at);
  if (hits.length) return { type: 'enlist', faction: hits[0].i };
  return null;
}

// comment: { id, userId, username, text, timestamp, mediaId }
export function applyComment(state, comment, theme, story, map) {
  if (state.seenComments.includes(comment.id)) return null;
  state.seenComments.push(comment.id);
  if (state.seenComments.length > 20000) state.seenComments.splice(0, 5000);
  const vote = castVote(state, comment);
  if (vote) return vote;
  const parsed = parseComment(comment.text, theme);
  if (!parsed) return null;
  const handle = (comment.username || '').toLowerCase();
  if (!handle) return null;
  const existing = state.soldiers.find((s) => s.handle === handle);
  if (parsed.type === 'claim') return { type: 'claim', handle, code: parsed.code, soldier: existing };
  if (existing) return null; // každý jen jednou, frakce se nemění
  const f = parsed.faction;
  const order = state.soldiers.filter((s) => s.faction === f).length;
  const s = createSoldier({ id: comment.userId || handle, handle, faction: f, day: state.day, order }, theme, story);
  placeSoldier(s, map, state);
  s.record.push([state.day, enlistEntry(s, theme, story)]);
  state.soldiers.push(s);
  return { type: 'enlist', soldier: s };
}

// Přidělí první volné místo podle priority (střed → ven, přední linie první) v otevřených sektorech.
// Místo je trvalé: otevření dalších sektorů nikoho nepřesune. Při zaplnění z 90 % se otevřou další 2 sektory.
export function placeSoldier(s, map, state) {
  // obsazenost podle pozice (ne ID): úprava generátoru mapy pak nikoho nepřesune ani nezdvojí
  const taken = new Set(state.soldiers.filter((o) => o.faction === s.faction && o.pos).map((o) => `${o.pos[0]},${o.pos[1]}`));
  let slot = null;
  for (;;) {
    const [from, to] = openRange(map, state.openSectors ?? 8);
    const open = map.slots[s.faction].filter((x) => x.sector >= from && x.sector < to);
    const free = open.filter((x) => !taken.has(`${x.x},${x.y}`));
    if (free.length && (free.length - 1) / open.length >= 0.1) { slot = free[0]; break; }
    if ((state.openSectors ?? 8) >= map.sectors) { slot = free[0] ?? null; break; }
    state.openSectors = Math.min(map.sectors, (state.openSectors ?? 8) + 2);
    state.log?.push([state.day, `front expanded to ${state.openSectors} sectors`]);
  }
  if (slot) {
    s.slot = slot.id;
    s.pos = [slot.x, slot.y, slot.d]; // trvalá pozice ve světě (px) a směr pohledu
    s.sector = slot.label;
    s.line = slot.line;
    s.unit = unitName(s.order);
  } else {
    s.slot = null;
    s.pos = null;
    s.sector = 'Rear camp';
    s.line = 'camp';
    s.unit = 'Replacement depot';
  }
}

const ORD = (n) => n + (['th', 'st', 'nd', 'rd'][((n % 100) - 20) % 10] || ['th', 'st', 'nd', 'rd'][n % 100] || 'th');
export function unitName(order) {
  const company = Math.floor(order / 120) + 1;
  const platoon = Math.floor((order % 120) / 30) + 1;
  return `${ORD(platoon)} Platoon, ${ORD(company)} Company`;
}

// --- hlasování v komentářích pod Reelem ---
// state.vote = { mediaId, question, options: [{ kw, label, danger, outcome }], tallies: { handle: kw } }
export function openVote(state, { mediaId, question, options }) {
  state.vote = { mediaId, question, options, tallies: {}, openedDay: state.day };
}

function castVote(state, comment) {
  const v = state.vote;
  if (!v || !comment.mediaId || comment.mediaId !== v.mediaId) return null;
  const t = (comment.text || '').toUpperCase();
  const opt = v.options.find((o) => new RegExp(`\\b${o.kw}\\b`).test(t));
  const handle = (comment.username || '').toLowerCase();
  if (!opt || !handle) return null;
  v.tallies[handle] = opt.kw; // platí poslední hlas
  return { type: 'vote', handle, kw: opt.kw };
}

export function resolveVote(state) {
  const v = state.vote;
  if (!v) return null;
  const counts = Object.fromEntries(v.options.map((o) => [o.kw, 0]));
  for (const kw of Object.values(v.tallies)) counts[kw] = (counts[kw] || 0) + 1;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  // remíza nebo žádné hlasy → první možnost (výchozí „držet linii“ dej jako první)
  const winner = v.options.reduce((best, o) => (counts[o.kw] > counts[best.kw] ? o : best), v.options[0]);
  const result = { day: state.day, question: v.question, winner: winner.kw, counts, total, text: winner.outcome, danger: winner.danger ?? 1 };
  state.events = [...(state.events || []), result].slice(-60);
  state.vote = null;
  return result;
}

// Denní tah: nový den, zápisy, osudy, nástupci padlých.
export function dailyTick(state, theme, story, ctx = {}) {
  const decided = resolveVote(state);
  if (decided) {
    ctx = { ...ctx, danger: ctx.danger ?? decided.danger };
  }
  state.day++;
  const day = state.day;
  const active = new Set(ctx.activeIds || []);
  const chosen = new Set(selectForStory(state.soldiers, day, active).map((s) => s.id));
  for (let i = 0; i < state.soldiers.length; i++) {
    let s = state.soldiers[i];
    if (s.status === 'fallen') {
      // nástupce dorazí 2. den po smrti
      if (day - s.fallenDay >= 2) {
        state.soldiers[i] = s = heir(s, day, theme, story);
      }
      continue;
    }
    if (!chosen.has(s.id) && s.status === 'active') continue;
    for (const text of tickSoldier(s, day, theme, story, { active: active.has(s.id), danger: ctx.danger })) {
      s.record.push([day, text]);
    }
  }
  return state;
}

// Statická data pro web: kompaktní soupiska + záznamy rozdělené do shardů (načítají se až po kliknutí).
export function buildPublic(state, theme) {
  const arch = theme.archetypes.map((a) => a.id);
  const roster = {
    day: state.day,
    followers: state.followers,
    openSectors: state.openSectors ?? 8,
    dispatch: (state.events || []).slice(-1)[0] || null,
    vote: state.vote ? { question: state.vote.question, options: state.vote.options.map((o) => ({ kw: o.kw, label: o.label })), votes: Object.keys(state.vote.tallies).length } : null,
    updated: new Date().toISOString(),
    fields: ['handle', 'faction', 'x', 'y', 'dir', 'archetype', 'rank', 'status', 'variant', 'claimed', 'generation', 'name'],
    soldiers: state.soldiers.map((s) => [
      s.handle,
      s.faction,
      s.pos ? s.pos[0] : -1,
      s.pos ? s.pos[1] : -1,
      s.pos ? s.pos[2] : 0,
      arch.indexOf(s.archetype),
      s.rank,
      ['active', 'wounded', 'missing', 'captured', 'fallen'].indexOf(s.status),
      s.variant,
      s.claimed ? 1 : 0,
      s.generation,
      s.name,
    ]),
  };
  const shards = Array.from({ length: SHARDS }, () => ({}));
  for (const s of state.soldiers) {
    shards[shardOf(s.handle)][s.handle] = {
      name: s.name,
      unit: s.unit,
      sector: s.sector,
      line: s.line,
      enlisted: s.enlisted,
      record: s.record.slice(-40),
      fallen: s.fallen,
      family: s.family,
      bio: s.bio || null,
    };
  }
  return { roster, shards };
}

export function shardOf(handle) {
  return hashString(handle) % SHARDS;
}
