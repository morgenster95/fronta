// Stav světa (soupiska) a jeho změny: komentář → narukování, kód → převzetí, denní tah, export statických dat pro web.

import { createSoldier, tickSoldier, heir, selectForStory } from './soldier.js';
import { enlistEntry } from './story.js';
import { hashString } from './rng.js';

export const SHARDS = 64;

export function emptyState(theme) {
  return {
    theme: theme.id,
    day: 1,
    followers: 0,
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
  placeSoldier(s, map);
  s.record.push([state.day, enlistEntry(s, theme, story)]);
  state.soldiers.push(s);
  return { type: 'enlist', soldier: s };
}

export function placeSoldier(s, map) {
  const slot = map.slots[s.faction][s.order];
  if (slot) {
    s.sector = slot.label;
    s.line = slot.line;
    s.unit = unitName(s.order);
  } else {
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

// Denní tah: nový den, zápisy, osudy, nástupci padlých.
export function dailyTick(state, theme, story, ctx = {}) {
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
    updated: new Date().toISOString(),
    fields: ['handle', 'faction', 'order', 'archetype', 'rank', 'status', 'variant', 'claimed', 'generation', 'name'],
    soldiers: state.soldiers.map((s) => [
      s.handle,
      s.faction,
      s.order,
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
