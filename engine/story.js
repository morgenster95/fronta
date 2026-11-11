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
    return [text, w * (seen.has(k) ? 0.02 : 1) * (today?.has(k) ? 0.01 : 1)];
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

// Minulost vojáka (odkud je, čím byl, zvyk, kdo na něj čeká): deterministická z ID, uloží se při narukování.
export function makeBackground(soldier, story) {
  const b = story.background;
  if (!b) return null;
  const rand = rngFor(soldier.id, 'background');
  return { home: pick(rand, b.homes), trade: pick(rand, b.trades), quirk: pick(rand, b.quirks), waiting: pick(rand, b.waiting) };
}

// Jedna věta na kartu vojáka: „Before the war: a baker from Coldwater. Hums hymns when frightened. Waiting at home: …“
export function backgroundLine(soldier) {
  const b = soldier.bg;
  if (!b) return null;
  const v = { pronoun: soldier.pronoun || 'he' };
  const cap = (x) => x[0].toUpperCase() + x.slice(1);
  return fill(`Before the war: a ${b.trade} from ${b.home}. ${cap(b.quirk)}. Waiting at home: ${b.waiting}.`, v, () => 0);
}

export function soldierVars(soldier, theme, story, extra = {}) {
  const rand = rngFor(soldier.id, 'vars');
  const bg = soldier.bg || makeBackground(soldier, story) || {};
  return {
    home: bg.home ?? 'home',
    trade: bg.trade ?? 'soldier',
    quirk: bg.quirk ?? 'keeps {his} head down',
    // „nobody“ ve větě („thought about nobody“) nedává smysl; na kartě zůstává původní text
    waiting: !bg.waiting || /^nobody/i.test(bg.waiting) ? 'the people {he} used to know' : bg.waiting,
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

export function enlistEntry(soldier, theme, story, today = null, day = soldier.enlisted ?? 0) {
  const rand = rngFor(soldier.id, 'enlist');
  // od 3. dne války přicházejí „náhradníci“: úvody, které vědí, že válka už běží
  const late = day >= 3 && story.enlistLate ? story.enlistLate.map((x) => [x, 3]) : [];
  const tpl = pickVaried(rand, [...even(story.enlist), ...late], soldier, today);
  return fill(tpl, soldierVars(soldier, theme, story, { day: String(day), daysIn: String(Math.max(1, day - 1)) }), rand);
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

// Dokud děla mlčí (téma: battle.gunsAfterVictory), vypustí ze šablon texty se slovy z battle.gunsWords (granáty z děl, ostřelování…).
// Pole, ve kterém by nic nezbylo, zůstane celé. Výsledek se pamatuje (stejný story objekt = stejná kopie).
const silentCache = new WeakMap();
export function silenceGuns(story, words) {
  const hit = silentCache.get(story);
  if (hit && hit.words === words) return hit.story;
  const re = new RegExp(words, 'i');
  const walk = (v) => {
    if (Array.isArray(v)) {
      const loud = (x) => (typeof x === 'string' ? re.test(x) : Array.isArray(x) ? typeof x[0] === 'string' && re.test(x[0]) : typeof x?.text === 'string' && re.test(x.text));
      const kept = v.filter((x) => !loud(x)).map(walk);
      return kept.length ? kept : v.map(walk);
    }
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
    return v;
  };
  const out = walk(story);
  silentCache.set(story, { words, story: out });
  return out;
}
