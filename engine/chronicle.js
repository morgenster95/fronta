// Kronika dne: automatický zápis do Deníku fronty po každém denním tahu.
// Jmenuje skutečné hráče (@handle → na webu odkaz na kartu vojáka). Deterministická: stejný stav + den = stejný text.

import { rngFor, pick } from './rng.js';
import { fill } from './story.js';

// Pořadí důležitosti událostí do kroniky (nejvýš = nejdřív)
const PRIORITY = { raid: -1, captured: 6, fallen: 9, heir: 8, 'arc-end': 7, missing: 6, enemy: 6, returned: 5, promotion: 5, wounded: 4, comrade: 4, 'arc-start': 3, recovered: 2, arc: 1 };
const MAX_HIGHLIGHTS = 5;

const list = (handles, max = 8) => {
  const shown = handles.slice(0, max).map((h) => `@${h}`);
  const rest = handles.length - shown.length;
  if (rest > 0) shown.push(`${rest} more`);
  return shown.length > 1 ? `${shown.slice(0, -1).join(', ')} and ${shown.at(-1)}` : shown[0] || '';
};

export function writeChronicle(state, day, { theme, story, weather, events = [], decided = null, news = [] }) {
  const rand = rngFor(theme.id, 'chronicle', day);
  const short = (f) => theme.factions[f].name.replace(/^The /, '');
  const place = pick(rand, story.places);
  const blocks = [];

  if (weather) blocks.push({ text: pick(rand, weather.diary) });

  // velké zprávy (dobytí kóty) jdou na začátek
  blocks.unshift(...news.map((n) => ({ h: n.h, text: n.text, kind: n.kind })));

  // noví vojáci: narukovali během včerejška (state.day byl day-1)
  const fresh = state.soldiers.filter((s) => s.enlisted === day - 1 && s.generation === 1);
  if (fresh.length) {
    const by = theme.factions.map((_, f) => fresh.filter((s) => s.faction === f).map((s) => s.handle));
    const parts = by.map((h, f) => (h.length ? `${short(f)}: ${list(h)}` : null)).filter(Boolean);
    blocks.push({
      h: 'New on the line',
      text: `${fresh.length === 1 ? 'One new soldier' : `${fresh.length} new soldiers`} came up the line. ${parts.join('. ')}.`,
    });
  }

  if (decided) {
    // po frakcích: „The Hegemony chose HOSPITAL (14 to 10).“; strana bez hlasů je popsaná ve výsledku (decided.text)
    const tally = (f) => Object.values(decided.counts[f]).sort((x, y) => y - x).join(' to ');
    const answer = decided.perFaction
      ? decided.winners.map((kw, f) => (kw ? `The ${short(f)} chose ${kw} (${tally(f)}).` : '')).filter(Boolean).join(' ')
      : `The answer was ${decided.winner}.`;
    blocks.push({ h: 'The front decided', text: `${decided.question} ${answer} ${decided.text || ''}`.replace(/\s+/g, ' ').trim() });
  }

  // nejzajímavější zápisy dne, každý hráč nejvýš jednou
  const seen = new Set();
  const top = events
    .filter((e) => !e.raid) // výprava má vlastní článek
    .map((e, i) => ({ ...e, i, p: (PRIORITY[e.type] ?? 0) + (state.soldiers.find((s) => s.handle === e.handle)?.claimed ? 0.5 : 0) + rngFor(e.handle, day)() * 0.4 }))
    .sort((a, b) => b.p - a.p || a.i - b.i)
    .filter((e) => {
      // každý hráč i každá šablona nejvýš jednou (ať se v jednom dni neopakuje stejná historka)
      if (seen.has(e.handle) || (e.other && seen.has(e.other)) || (e.tpl && seen.has(e.tpl))) return false;
      seen.add(e.handle);
      if (e.tpl) seen.add(e.tpl);
      if (e.other) seen.add(e.other);
      return true;
    })
    .slice(0, MAX_HIGHLIGHTS);
  if (top.length) {
    blocks.push({
      h: 'From the service records',
      items: top.map((e) => `${e.text} (@${e.handle}${e.other ? `, @${e.other}` : ''})`),
    });
  }

  // ztráty a síla
  const count = (st) => events.filter((e) => e.type === st).map((e) => e.handle);
  const losses = [
    ['Wounded', count('wounded')],
    ['Missing', count('missing')],
    ['Taken prisoner', count('captured')],
    ['Fallen', count('fallen')],
  ].filter(([, h]) => h.length);
  const alive = theme.factions.map((_, f) => state.soldiers.filter((s) => s.faction === f && s.status !== 'fallen').length);
  blocks.push({
    h: 'Roll call',
    text:
      (losses.length ? losses.map(([k, h]) => `${k}: ${list(h, 6)}.`).join(' ') + ' ' : 'No losses reported. ') +
      `Strength on the line: ${theme.factions.map((_, f) => `${short(f)} ${alive[f]}`).join(' · ')}.`,
  });

  // stav závodu o kótu
  const race = theme.race && state.race ? (() => {
    const need = theme.race.need;
    const c = theme.factions.map((_, f) => state.soldiers.filter((s) => s.faction === f).length - state.race.base[f]);
    const lead = c[0] === c[1] ? null : c[0] > c[1] ? 0 : 1;
    const name = (theme.race.objectives[state.race.idx % theme.race.objectives.length] || {}).name;
    return { h: `The race for ${name}`, text: `${theme.factions.map((_, f) => `${short(f)} ${c[f]}/${need}`).join(' · ')}. ` +
      (lead == null ? 'Dead level. One recruit could change everything.' : `The ${short(lead)} lead by ${Math.abs(c[0] - c[1])}. ${need - c[lead]} more and the heights are theirs.`) };
  })() : null;
  if (race) blocks.splice(blocks.length - 1, 0, race);

  const title = news.length ? news[0].h : weather ? fill(pick(rand, weather.titles), { place }, rand) : `Day ${day}`;
  return { day, kind: 'chronicle', by: 'Field Telegraph', title, weather: weather?.id ?? null, blocks };
}
