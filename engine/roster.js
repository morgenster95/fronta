// Stav světa (soupiska) a jeho změny: komentář → narukování, kód → převzetí, denní tah, export statických dat pro web.

import { createSoldier, tickSoldier, heir, selectForStory } from './soldier.js';
import { enlistEntry, weatherFor, eventEntry, tplKey, makeBackground, backgroundLine, silenceGuns } from './story.js';
import { writeChronicle } from './chronicle.js';
import { checkRace, raceStatus, raceDanger, activeBarrage, awardHonors } from './race.js';
import { pick } from './rng.js';
import { hashString } from './rng.js';
import { openRange } from './mapgen.js';
import { orderDanger, orderRecover, issueOrders } from './orders.js';
import { battleTick, battlePublic, build as buildStructure, ensureBattle, levelOf, gunsSilent } from './battle.js';
import { awardHouseBadges, noticeDeath } from './house.js';
import { ensureValley, valleyTick, valleyDanger, valleyRecover, raidKeyword, volunteer, valleyPublic } from './valley.js';

export const SHARDS = 64;

export function emptyState(theme) {
  return {
    theme: theme.id,
    day: 0, // 0 = mobilizace, válka začíná dnem 1
    followers: 0,
    openSectors: 8, // kolik sektorů kolem středu je otevřeno; roste se zaplněním
    soldiers: [], // plné záznamy
    seenComments: [], // ID zpracovaných komentářů (posledních pár tisíc)
    votes: {}, // { voteId: { optionKeyword: [handles] } }
    log: [],
  };
}

const CLAIM_RE = /\bENLIST-([A-Z0-9]{4})\b/i;

// --- přání role v komentáři („CONCORD, I want to be a medic“, „MG please“) ---
// Role se pozná podle id, jména nebo aliasu (theme.archetypes[].aliases). Delší výrazy mají přednost a „spotřebují“ text
// („sniper rifle“ → sniper, ne rifleman). Víc různých rolí v jednom komentáři = nejasné → nic.
// Bez podmínky na „want/be…“: hráči píšou prostě „CONCORD medic“ i v delších větách. Výjimka: „let him cook“.
const NOT_A_WISH = /\blet (him|her|them|me|us) cook\b/g;
export function parseRole(text, theme) {
  let t = ` ${(text || '').toLowerCase().replace(NOT_A_WISH, ' ').replace(/[^a-z0-9' -]+/g, ' ')} `;
  const terms = theme.archetypes
    .flatMap((a) => [a.id, a.name, ...(a.aliases || [])].map((w) => [w.toLowerCase().replace(/[^a-z0-9' -]+/g, ' ').trim(), a.id]))
    .filter(([w]) => w)
    .sort((a, b) => b[0].length - a[0].length);
  const found = new Set();
  for (const [w, id] of terms) {
    const re = new RegExp(`(^|[^a-z0-9])${w.replace(/[-]/g, '[- ]?').replace(/ /g, '[ -]?')}s?(?=[^a-z0-9]|$)`, 'g');
    if (re.test(t)) {
      found.add(id);
      t = t.replace(re, '$1 ');
    }
  }
  if (found.size !== 1) return null;
  return [...found][0];
}

// Splní přání role: první volba je zdarma a hned (i bez převzetí karty), další změny už jen převelením z karty.
// Vrací důvod: granted | same | officer | used | fallen | locked
export function wishRole(state, s, role, theme, story) {
  if (role === 'officer') return 'officer';
  if (!s || s.status === 'fallen') return 'fallen';
  const fresh = !s.record.length; // právě vzniká (komentář s heslem frakce)
  if (s.archetype === 'officer' && !fresh) return 'locked';
  if (role === s.archetype) return 'same';
  if (s.roleWish || s.transferDay != null) return 'used';
  const nameOf = (id) => theme.archetypes.find((a) => a.id === id)?.name.toLowerCase();
  const oldRole = nameOf(s.archetype);
  if (s.archetype === 'officer') s.rank = 0;
  s.archetype = role;
  s.roleWish = role;
  s.pendingRole = null;
  s.arc = null;
  // nováček (narukoval dnes) nedostane zápis o převelení, rovnou začíná v nové roli
  if (!fresh) {
    s.record.push([state.day, eventEntry('transfer', s, state.day, theme, story, { role: nameOf(role), oldRole })]);
  }
  return 'granted';
}

// Veřejná odpověď pod komentář s přáním role (null = neodpovídat)
export function roleReply(theme, s, role, reason) {
  const name = theme.archetypes.find((a) => a.id === role)?.name;
  const kw = theme.factions.map((f) => f.keyword).join(' or ');
  switch (reason) {
    case 'granted': return `@${s.handle} Granted. ${s.name} now serves as ${name}. Find your soldier on the front, link in bio.`;
    case 'same': return `@${s.handle} ${s.name} already serves as ${name}, soldier.`;
    case 'officer': return `@${s.handle} Lieutenants are made by promotion only. Survive, get decorated, and the bars will come.`;
    case 'used': return `@${s.handle} ${s.name} already chose a role. Claim your soldier on the front (link in bio) to request a transfer to ${name}.`;
    case 'notEnlisted': return `@${s.handle} Pick a side first: comment ${kw} together with ${name} and you'll be enlisted straight into that role.`;
    default: return null;
  }
}

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
  const handle = (comment.username || '').toLowerCase();
  if (!handle) return null;
  // voják patří IG účtu (trvalé ID), ne jménu: @jméno jde změnit a uvolněné jméno si může vzít někdo jiný
  const existing = findOwnSoldier(state, comment.userId, handle);
  if (existing === TAKEN) return null; // jméno patří vojákovi jiného účtu: nic nepřebírá, nenarukuje pod cizím jménem
  if (parsed?.type === 'claim') return { type: 'claim', handle: existing?.handle ?? handle, code: parsed.code, soldier: existing };
  // heslo otevřené výpravy (např. CHURCH): přihláška dobrovolníka
  const raid = raidKeyword(state, theme, comment.text);
  // dopis domů (post s voices): zmínka role v textu („the medic carried me…“) není přání role
  const wish = comment.letter ? null : parseRole(comment.text, theme);
  if (!parsed || existing) {
    // přání role od už narukovaného (před přihláškou na výpravu: role se hned počítá)
    const role = existing && wish ? { role: wish, reason: wishRole(state, existing, wish, theme, story) } : null;
    if (raid && existing) return { type: 'volunteer', handle, soldier: existing, ...volunteer(state, theme, existing, 'comment'), roleWish: role };
    if (raid && !parsed) return { type: 'volunteer', handle, soldier: { handle }, ok: false, reason: 'notEnlisted' }; // nejdřív narukovat
    if (role) return { type: 'role', handle, soldier: existing, ...role };
    if (wish && !existing) return { type: 'role', handle, soldier: { handle }, role: wish, reason: 'notEnlisted' };
    // hlas frakce bez vojáka: nejdřív narukovat (odpověď poradí, jak)
    const vo = !existing && state.vote?.perFaction && voteOption(state, comment);
    if (vo) return { type: 'vote', handle, kw: vo.kw, reason: 'notEnlisted' };
    return null; // každý jen jednou, frakce se nemění
  }
  const f = parsed.faction;
  const order = state.soldiers.filter((s) => s.faction === f).length;
  const s = createSoldier({ id: comment.userId || handle, handle, faction: f, day: state.day, order }, theme, story);
  s.reply = comment.replyTo || comment.id; // náborový komentář: sem bot odpoví při smrti vojáka
  // „CONCORD medic“: rovnou v té roli (důstojník jen povýšením)
  const roleWish = wish ? { role: wish, reason: wishRole(state, s, wish, theme, story) } : null;
  placeSoldier(s, map, state);
  // nováček nedostane stejný úvod jako ti, kdo narukovali těsně před ním
  s.record.push([state.day, enlistEntry(s, theme, story, recentKeys(state, story.enlist.length - 1))]);
  state.soldiers.push(s);
  awardFirstWave(state, theme, story);
  awardHonors(state, theme);
  const victory = checkRace(state, theme, story, s);
  const raidRes = raid ? volunteer(state, theme, s, 'comment') : null;
  const voted = state.vote?.perFaction ? castVote(state, comment) : null;
  return { type: 'enlist', soldier: s, victory, raid: raidRes, roleWish, ...(voted ? { vote: voted } : {}) };
}

// Přidělí první volné místo podle priority (střed → ven, přední linie první) v otevřených sektorech.
// Místo je trvalé: otevření dalších sektorů nikoho nepřesune. Při zaplnění z 90 % se otevřou další 2 sektory.
// Medaile „First Wave“: prvních 100 narukovaných (pořadí v soupisce = pořadí narukování). Idempotentní.
export const FIRST_WAVE = 100;
export function awardFirstWave(state, theme = null, story = null) {
  state.soldiers.slice(0, FIRST_WAVE).forEach((s, i) => {
    s.medals ??= [];
    if (!s.medals.includes('first-wave')) {
      s.medals.push('first-wave');
      const text = story?.firstWave
        ? eventEntry('firstWave', s, state.day, theme, story, { n: String(i + 1) }, recentKeys(state, 6, s))
        : `${s.name} is one of the first hundred to answer the call. ${s.pronoun === 'she' ? 'She wears' : s.pronoun === 'they' ? 'They wear' : 'He wears'} the ribbon of the First Wave.`;
      s.record.push([state.day, text]);
    }
  });
}

// klíče šablon, které použili poslední narukovaní (aby nováčci po sobě neměli stejné věty)
function recentKeys(state, n, except = null) {
  const keys = new Set();
  for (const o of state.soldiers.slice(-n - 1)) if (o !== except) for (const k of (o.seen || []).slice(0, 2)) keys.add(k);
  return keys;
}

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
// perFaction: každá frakce volí vlastní rozkaz; hlas se páruje s vojákem podle IG účtu (frakci do komentáře psát netřeba),
// komentáře lidí bez vojáka se nepočítají. Možnosti pak nesou danger/recover/days (rozkaz, engine/orders.js), outcome smí mít {side}.
// minHours: denní tah hlasování nevyhodnotí dřív, než je otevřené aspoň tolik hodin (jinak počká na další vydání).
export function openVote(state, { mediaId, question, options, perFaction = false, minHours = 0, note = null, openedAt = null }) {
  state.vote = { mediaId, question, options, tallies: {}, openedDay: state.day, ...(perFaction ? { perFaction: true } : {}),
    ...(minHours ? { minHours } : {}), ...(note ? { note } : {}), ...(openedAt ? { openedAt } : {}) };
}

// Voják autora komentáře: podle IG ID; podle jména jen u starých vojáků bez ID (id === handle).
// TAKEN = jméno má voják jiného IG účtu.
export const TAKEN = Symbol('taken');
export function findOwnSoldier(state, userId, handle) {
  if (userId) {
    const byId = state.soldiers.find((s) => s.id === userId);
    if (byId) return byId;
  }
  const byName = state.soldiers.find((s) => s.handle === handle);
  if (!byName) return undefined;
  if (!userId || byName.id === byName.handle) return byName;
  return TAKEN;
}

function voteOption(state, comment) {
  const v = state.vote;
  if (!v || !comment.mediaId || comment.mediaId !== v.mediaId) return null;
  const t = (comment.text || '').toUpperCase();
  // „Sandbag“, „hospitals“: jednotné i množné číslo hesla platí stejně
  return v.options.find((o) => new RegExp(`\\b${o.kw.replace(/S$/, '')}S?\\b`).test(t)) || null;
}

// Dodatečný hlas z už zpracovaného komentáře: hlasování se otevřelo až po komentáři (odložené hlasování pod postem),
// nebo heslo dřív neprošlo. Jen hlasování po frakcích a jen kdo ještě nehlasoval (novější hlas se nepřepisuje).
export function lateVote(state, comment) {
  const v = state.vote;
  if (!v?.perFaction) return null;
  const opt = voteOption(state, comment);
  const handle = (comment.username || '').toLowerCase();
  if (!opt || !handle) return null;
  const s = findOwnSoldier(state, comment.userId, handle);
  if (!s || s === TAKEN || v.tallies[s.id]) return null;
  v.tallies[s.id] = { kw: opt.kw, f: s.faction };
  return { type: 'vote', handle, kw: opt.kw, faction: s.faction, late: true };
}

function castVote(state, comment) {
  const v = state.vote;
  const opt = voteOption(state, comment);
  const handle = (comment.username || '').toLowerCase();
  if (!opt || !handle) return null;
  if (v.perFaction) {
    const s = findOwnSoldier(state, comment.userId, handle);
    if (!s || s === TAKEN) return null; // bez vojáka nehlasuje (komentář může dál narukovat, viz applyComment)
    v.tallies[s.id] = { kw: opt.kw, f: s.faction };
    return { type: 'vote', handle, kw: opt.kw, faction: s.faction };
  }
  v.tallies[comment.userId || handle] = opt.kw; // 1 hlas na IG účet (ne na jméno), platí poslední
  return { type: 'vote', handle, kw: opt.kw };
}

const sideName = (theme, f) => theme?.factions?.[f]?.name.replace(/^The /, '') ?? `Side ${f + 1}`;

function resolveFactionVote(state, v, theme) {
  const nf = theme?.factions?.length || 2;
  const per = Array.from({ length: nf }, (_, f) => {
    const counts = Object.fromEntries(v.options.map((o) => [o.kw, 0]));
    for (const t of Object.values(v.tallies)) if (t.f === f) counts[t.kw] = (counts[t.kw] || 0) + 1;
    // strana bez jediného hlasu nedostane nic (stavba ani rozkaz nepřijde zadarmo); remíza → dřívější možnost
    const winner = Object.values(counts).some((n) => n > 0) ? v.options.reduce((best, o) => (counts[o.kw] > counts[best.kw] ? o : best), v.options[0]) : null;
    return { faction: f, counts, winner };
  });
  const total = Object.keys(v.tallies).length;

  const winner = per.map((p) => `${sideName(theme, p.faction)}: ${p.winner?.kw ?? 'no votes'}`).join(' · ');
  const orders = issueOrders(state, per.filter((p) => p.winner).map((p) => ({ ...p.winner, faction: p.faction })), state.day + 1);
  // stavby (dugout, pytle, drát…): trvalé, staví se jen hlasováním
  // věta o stavbě (theme.battle.buildings[].done) nahradí obecný výsledek možnosti, ať se v Gazette neříká totéž dvakrát
  const builtOf = per.map((p) => (p.winner?.build ? buildStructure(state, theme, p.faction, p.winner.build) : null));
  const built = builtOf.filter(Boolean);
  const text = per.map((p, i) => (builtOf[i] ? `${builtOf[i]}.`
    : (p.winner ? p.winner.outcome || '' : 'No word came back from the {side}: nothing was built.').replaceAll('{side}', sideName(theme, p.faction)))).join(' ');
  const result = { day: state.day, mediaId: v.mediaId, question: v.question, perFaction: true, winner, winners: per.map((p) => p.winner?.kw ?? null),
    counts: per.map((p) => p.counts), total, text: text.trim(), danger: 1, orders, built };
  state.events = [...(state.events || []), result].slice(-60);
  state.vote = null;
  return result;
}

export function resolveVote(state, theme, now = null) {
  const v = state.vote;
  if (!v) return null;
  if (now && v.minHours && v.openedAt && now - Date.parse(v.openedAt) < v.minHours * 3600e3) return null; // ještě počká
  if (v.perFaction) return resolveFactionVote(state, v, theme);
  const counts = Object.fromEntries(v.options.map((o) => [o.kw, 0]));
  for (const kw of Object.values(v.tallies)) counts[kw] = (counts[kw] || 0) + 1;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  // remíza nebo žádné hlasy → první možnost (výchozí „držet linii“ dej jako první)
  const winner = v.options.reduce((best, o) => (counts[o.kw] > counts[best.kw] ? o : best), v.options[0]);
  const result = { day: state.day, question: v.question, winner: winner.kw, counts, total, text: winner.outcome, danger: winner.danger ?? 1 };
  if (winner.effect) Object.assign(result, { effect: winner.effect, target: winner.target ?? 0 });
  state.events = [...(state.events || []), result].slice(-60);
  state.vote = null;
  return result;
}

// Odemčené schopnosti komunity (např. bombardování při 500 převzatých vojácích)
export function unlocks(state, theme) {
  const claimed = state.soldiers.filter((s) => s.claimed).length;
  return (theme.unlocks || []).map((u) => ({ id: u.id, label: u.label, need: u.claimed, have: claimed, open: claimed >= u.claimed }));
}

// Denní tah: nový den, zápisy, osudy, nástupci padlých, kronika dne do Deníku fronty.
export function dailyTick(state, theme, story, ctx = {}) {
  // děla mlčí do první výhry v závodě o kótu: žádné texty o ostřelování (bombardování začne až po výhře)
  if (gunsSilent(state, theme)) story = silenceGuns(story, theme.battle.gunsWords);
  const decided = resolveVote(state, theme, ctx.now);
  if (decided && !decided.perFaction) {
    ctx = { ...ctx, danger: ctx.danger ?? decided.danger };
  }
  const nightWeather = state.weather ?? weatherFor(theme, story, state.day)?.id ?? null; // počasí noci, kdy výprava vyrazila
  state.day++;
  const day = state.day;
  const weather = weatherFor(theme, story, day);
  state.weather = weather?.id ?? null;
  // výpravy: vyhodnocení té z minulého vydání, vyhlášení nové (účastníci dnes nemají běžný zápis)
  const raid = valleyTick(state, theme, story, day, nightWeather);
  // denní boj: zásahy, medici, lůžka, drát (engine/battle.js); účastníci výpravy dnes v linii nejsou
  const dangerOf = (s) => (ctx.danger ?? 1) * (theme.race ? raceDanger(state, theme, s.faction, day) : 1) * valleyDanger(state, theme, s, day) * orderDanger(state, s.faction, day);
  const careOf = (s) => orderRecover(state, s.faction, day, valleyRecover(state, theme, s)) / 0.35;
  const fight = theme.battle ? battleTick(state, theme, story, day, { busy: raid.ids, dangerOf, careOf }) : { events: [], news: [], ids: new Set() };
  const events = [...raid.events, ...fight.events];
  const today = new Set(); // šablony použité dnes (rozmanitost mezi vojáky)
  for (const s of state.soldiers) s.bg ??= makeBackground(s, story);
  const active = new Set(ctx.activeIds || []);
  const chosen = new Set(selectForStory(state.soldiers, day, active).map((s) => s.id));
  // kdo je dnes k dispozici pro společné příhody (stav na začátku dne)
  // účastníci výpravy mají dnes svůj zápis z výpravy, do společných historek je nebrat
  const onLine = theme.factions.map((_, f) => state.soldiers.filter((s) => s.faction === f && s.status === 'active' && !raid.ids.has(s.id)));
  const comrade = (s, rand) => {
    const mates = onLine[s.faction].filter((o) => o !== s && o.status === 'active');
    if (!mates.length) return null;
    const near = mates.filter((o) => o.sector === s.sector);
    return pick(rand, near.length && rand() < 0.7 ? near : mates);
  };
  const foe = (s, rand) => {
    const them = onLine[1 - s.faction]?.filter((o) => o.status === 'active') || [];
    return them.length ? pick(rand, them) : null;
  };
  for (let i = 0; i < state.soldiers.length; i++) {
    let s = state.soldiers[i];
    if (s.status === 'fallen') {
      // nástupce z rodu: hned ve stejném vydání, kdy se hráč o smrti dozví (theme.heirDelay dní, výchozí 0)
      if (day - s.fallenDay >= (theme.heirDelay ?? 0)) {
        state.soldiers[i] = s = heir(s, day, theme, story, today);
        noticeDeath(state, s);
        events.push({ type: 'heir', handle: s.handle, faction: s.faction, text: s.record.at(-1)[1] });
      }
      continue;
    }
    if (raid.ids.has(s.id) || fight.ids.has(s.id)) continue; // dnes už má zápis z výpravy nebo z boje
    if (!chosen.has(s.id) && s.status === 'active') continue;
    const danger = dangerOf(s);
    const recover = orderRecover(state, s.faction, day, valleyRecover(state, theme, s));
    const sctx = { active: active.has(s.id), danger, weather, events, comrade, foe, today, recover, battle: !!theme.battle };
    for (const text of tickSoldier(s, day, theme, story, sctx)) {
      s.record.push([day, text]);
    }
  }
  awardHouseBadges(state, theme); // odznaky rodu (zůstávají v rodu)
  const news = [...raid.news, ...fight.news, ...(state.news || []).filter((n) => n.day >= day - 1)];
  state.news = [];
  state.chronicle = [...(state.chronicle || []), writeChronicle(state, day, { theme, story, weather, events, decided, news })]; // celá historie, nic se nemaže
  return state;
}

// Žebříčky pro web (top N): nejdéle na frontě (živí), nejstarší rody, nejvíc vyznamenaní, přeživší (jizvy), medici (ošetření)
export function leaderboards(state, theme, n = 20) {
  const live = state.soldiers.filter((s) => s.status !== 'fallen');
  const row = (s, value) => ({ handle: s.handle, name: s.name, faction: s.faction, gen: s.generation || 1, value });
  // remíza: kdo narukoval dřív (pořadí narukování), ne abeceda; top n pro KAŽDOU stranu (web filtruje podle strany)
  const rank = (a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.handle.localeCompare(b.handle);
  const top = (list, fn) => {
    const all = list.map((s) => [s, fn(s)]).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1] || rank(a[0], b[0]));
    return (theme?.factions || [0, 1]).flatMap((_, f) => all.filter(([s]) => s.faction === f).slice(0, n))
      .sort((a, b) => b[1] - a[1] || rank(a[0], b[0])).map(([s, v]) => row(s, v));
  };
  const honours = (x) => (x.medals || []).length + (x.titles || []).length;
  const days = (s) => Math.max(0, state.day - s.enlisted) + 1; // dnešní den se počítá: kdo narukoval dnes, je na frontě 1. den
  return {
    longest: top(live, days), // dní na frontě bez přestávky (nástupce začíná od 1. dne)
    houses: top(state.soldiers, (s) => (s.fallen || []).reduce((a, p) => a + (p.days || 0), 0) + (s.status === 'fallen' ? 0 : days(s))), // dní rodu celkem
    decorated: top(live, honours),
    houseHonours: top(state.soldiers, (s) => honours(s) + (s.fallen || []).reduce((a, p) => a + (p.medals || []).length + (p.titles || []).length, 0)),
    survivors: top(live, (s) => s.scars || 0),
    medics: top(live.filter((s) => s.archetype === 'medic'), (s) => s.treated || 0),
    marksmen: top(live, (s) => s.hits || 0), // zásahy nepřítele palbou (docs/COMBAT_ROLES.md)
    experienced: top(live, (s) => Math.round(s.xp || 0)),
  };
}

// Pamětní listina: všichni padlí (nejnovější nahoře)
export function rollOfHonour(state, n = 300) {
  const all = [];
  for (const s of state.soldiers) {
    for (const p of s.fallen || []) {
      all.push({ handle: s.handle, family: s.family, faction: s.faction, name: p.name, gen: p.gen || 1, day: p.day, days: p.days ?? null,
        archetype: p.archetype || null, rank: p.rank, cause: p.cause || null });
    }
    if (s.status === 'fallen') {
      all.push({ handle: s.handle, family: s.family, faction: s.faction, name: s.name, gen: s.generation || 1, day: s.fallenDay,
        days: s.fallenDay - s.enlisted, archetype: s.archetype, rank: s.rank, cause: s.cause || null });
    }
  }
  return all.sort((a, b) => b.day - a.day || a.name.localeCompare(b.name)).slice(0, n);
}

// Statická data pro web: kompaktní soupiska + záznamy rozdělené do shardů (načítají se až po kliknutí).
// --- převelení (výběr povolání převzatým hráčem) ---
export const TRANSFER_COOLDOWN = 7;
export function requestTransfer(state, s, role, theme) {
  const ok = theme.archetypes.some((a) => a.id === role && a.id !== 'officer');
  if (!ok || !s || !s.claimed || s.archetype === 'officer') return false;
  s.pendingRole = role === s.archetype ? null : role;
  return true;
}
// provede čekající převelení, pokud uplynula lhůta (voják musí být na linii)
export function applyTransfers(state, theme, story) {
  const done = [];
  const nameOf = (id) => theme.archetypes.find((a) => a.id === id)?.name.toLowerCase();
  for (const s of state.soldiers) {
    if (!s.pendingRole || s.status !== 'active') continue;
    if (s.transferDay != null && state.day - s.transferDay < TRANSFER_COOLDOWN) continue;
    const oldRole = nameOf(s.archetype);
    s.archetype = s.pendingRole;
    s.pendingRole = null;
    s.transferDay = state.day;
    s.arc = null; // nová práce, nový příběh
    s.record.push([state.day, eventEntry('transfer', s, state.day, theme, story, { role: nameOf(s.archetype), oldRole })]);
    done.push(s);
  }
  return done;
}

const RECENT = 40;
export function buildPublic(state, theme) {
  awardHonors(state, theme);
  ensureValley(state, theme);
  const valley = valleyPublic(state, theme);
  const arch = theme.archetypes.map((a) => a.id);
  const roster = {
    unlocks: unlocks(state, theme),
    day: state.day,
    followers: state.followers,
    openSectors: state.openSectors ?? 8,
    dispatch: (state.events || []).slice(-1)[0] || null,
    weather: state.weather ?? null,
    race: raceStatus(state, theme),
    victories: (state.victories || []).slice(-10).reverse(),
    barrage: activeBarrage(state, state.day, true),
    history: (state.events || []).slice(-30).reverse(),
    valley: valley.roster,
    vote: state.vote ? {
      question: state.vote.question, options: state.vote.options.map((o) => ({ kw: o.kw, label: o.label })), votes: Object.keys(state.vote.tallies).length,
      ...(state.vote.perFaction ? { perFaction: true } : {}), ...(state.vote.note ? { note: state.vote.note } : {}),
    } : null,
    battle: battlePublic(state, theme),
    orders: (state.orders || []).filter((o) => state.day + 1 <= o.to).map(({ faction, kw, label, from, to }) => ({ faction, kw, label, from, to })),
    updated: new Date().toISOString(),
    nextEdition: nextEdition(state, theme),
    fields: ['handle', 'faction', 'x', 'y', 'dir', 'line', 'medals', 'archetype', 'rank', 'status', 'variant', 'claimed', 'generation', 'name'],
    soldiers: state.soldiers.map((s) => [
      s.handle,
      s.faction,
      s.pos ? s.pos[0] : -1,
      s.pos ? s.pos[1] : -1,
      s.pos ? s.pos[2] : 0,
      s.line ?? null,
      (s.medals || []).join(','),
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
  // starší zápisy (nad RECENT) jdou do archivních shardů, web je načte až na „Show older entries“
  const older = Array.from({ length: SHARDS }, () => ({}));
  for (const s of state.soldiers) {
    if (s.record.length > RECENT) older[shardOf(s.handle)][s.handle] = s.record.slice(0, -RECENT);
    shards[shardOf(s.handle)][s.handle] = {
      name: s.name,
      unit: s.unit,
      sector: s.sector,
      line: s.line,
      enlisted: s.enlisted,
      record: s.record.slice(-RECENT),
      older: Math.max(0, s.record.length - RECENT),
      fallen: s.fallen,
      family: s.family,
      bio: s.bio || null,
      background: backgroundLine(s),
      titles: s.titles || [],
      nextTransfer: s.transferDay != null ? s.transferDay + TRANSFER_COOLDOWN : null,
      raids: s.raids || 0,
      // rod: kolikátá generace, odkud v deníku začíná, vztah k předchozímu, vlastní čísla této generace
      generation: s.generation || 1,
      recFrom: s.recFrom || 0,
      relation: s.relation || null,
      archetype: s.archetype,
      days: Math.max(0, state.day - s.enlisted),
      scars: s.scars || 0,
      wounds: s.woundsTaken || 0,
      treated: s.treated || 0,
      medals: s.medals || [],
      houseBadges: s.houseBadges || [],
      xp: Math.round(s.xp || 0),
      level: theme.battle ? levelOf(theme, s).name : null,
      hits: s.hits || 0,
      hitsBy: s.hitsBy || {},
    };
  }
  // žebříčky a pamětní listina: samostatné soubory, web je načte až po otevření záložky (hlavní data nerostou)
  return { roster, shards, older, valley: valley.file, boards: leaderboards(state, theme), honour: rollOfHonour(state, 1000) };
}

// Čas příštího vydání novin (denního tahu): den po posledním vydání v theme.schedule.editionUtc.
export function nextEdition(state, theme) {
  if (!state.lastTickKey || !/^\d{4}-\d{2}-\d{2}$/.test(state.lastTickKey)) return null;
  const H = theme.schedule?.editionUtc ?? 0;
  return new Date(Date.parse(`${state.lastTickKey}T00:00:00Z`) + 86400e3 + H * 3600e3).toISOString();
}

export function shardOf(handle) {
  return hashString(handle) % SHARDS;
}
