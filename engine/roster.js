// Stav světa (soupiska) a jeho změny: komentář → narukování, kód → převzetí, denní tah, export statických dat pro web.

import { createSoldier, tickSoldier, heir, selectForStory, addEntry, fallSoldier } from './soldier.js';
import { dogStories } from './dog.js';
import { enlistEntry, weatherFor, eventEntry, tplKey, makeBackground, backgroundLine, silenceGuns } from './story.js';
import { writeChronicle } from './chronicle.js';
import { checkRace, checkKillRace, raceStatus, raceDanger, activeBarrage, activeObservation, activeLogistics, awardHonors } from './race.js';
import { pick, weighted, rngFor } from './rng.js';
import { hashString } from './rng.js';
import { openRange } from './mapgen.js';
import { orderDanger, orderRecover, orderShell, orderFire, orderHeal, orderExposed, orderDie, issueOrders } from './orders.js';
import { resolveShells } from './shells.js';
import { findCard } from './cards.js';
import { resolvePilotCall, pilotFire, pilotSortie, pilotsPublic } from './pilots.js';
import { wiringKeyword, joinWiring } from './wiring.js';
import { raidCall, joinRaid } from './nightraid.js';
import { battleTick, battlePublic, build as buildStructure, ensureBattle, levelOf, gunsSilent } from './battle.js';
import { awardHouseBadges, noticeDeath } from './house.js';
import { ensureValley, valleyTick, valleyDanger, valleyRecover, raidKeyword, volunteer, valleyPublic } from './valley.js';

export const SHARDS = 64; // nejmenší počet dávek se zápisy pro web
// Dávek přibývá s vojáky (~25 vojáků na dávku), ať otevření karty stahuje pár KB i při tisících hráčů; počet je v roster.json (`shards`)
export const shardCount = (n) => Math.min(400, Math.max(SHARDS, Math.ceil(n / 25)));

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
// odkaz na převzetí místo kódu (21. 11.: ~25 hráčů z prohlížeče v Instagramu vložilo do komentáře zkopírovaný odkaz ?s=…&claim=1)
const CLAIM_LINK_RE = /[?&]claim=1\b/i;

// --- přání role v komentáři („CONCORD, I want to be a medic“, „MG please“) ---
// Role se pozná podle id, jména nebo aliasu (theme.archetypes[].aliases). Delší výrazy mají přednost a „spotřebují“ text
// („sniper rifle“ → sniper, ne rifleman). Víc různých rolí v jednom komentáři = nejasné → nic.
// Bez podmínky na „want/be…“: hráči píšou prostě „CONCORD medic“ i v delších větách. Výjimka: „let him cook“.
const NOT_A_WISH = /\blet (him|her|them|me|us) cook\b/g;
export function parseRole(text, theme) {
  let t = ` ${(text || '').toLowerCase().replace(NOT_A_WISH, ' ').replace(/[^a-z0-9' -]+/g, ' ')} `;
  const terms = theme.archetypes.filter((a) => !a.special) // zvláštní role (pilot) se nepřeje v komentáři, jen se losuje
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
    addEntry(s, state.day, eventEntry('transfer', s, state.day, theme, story, { role: nameOf(role), oldRole }));
  }
  return 'granted';
}

// Veřejná odpověď pod komentář s přáním role (null = neodpovídat)
export function roleReply(theme, s, role, reason) {
  const name = theme.archetypes.find((a) => a.id === role)?.name;
  const kw = theme.factions.map((f) => f.keyword).join(' or ');
  switch (reason) {
    case 'granted': return `@${s.handle} Granted. ${s.name} now serves as ${name}. Find your soldier on the front, link in bio.`;
    case 'same': return null; // 17. 11.: už tu roli má, není co sdělit (bot mlčí)
    case 'officer': return `@${s.handle} Lieutenants aren't requested, soldier. The front chooses them. Pick another role.`;
    case 'used': return `@${s.handle} ${s.name} already chose a role. Claim your soldier on the front (link in bio) to request a transfer to ${name}.`;
    case 'notEnlisted': return `@${s.handle} Pick a side first: comment ${kw} together with ${name} and you'll be enlisted straight into that role.`;
    default: return null;
  }
}

export function parseComment(text, theme) {
  const t = (text || '').toUpperCase();
  const claim = t.match(CLAIM_RE);
  if (claim) return { type: 'claim', code: `ENLIST-${claim[1].toUpperCase()}` };
  if (CLAIM_LINK_RE.test(text || '')) return { type: 'claimLink' };
  const hits = theme.factions
    .map((f, i) => ({ i, at: t.search(new RegExp(`\\b${f.keyword}\\b`)) }))
    .filter((h) => h.at >= 0)
    .sort((a, b) => a.at - b.at);
  if (hits.length) return { type: 'enlist', faction: hits[0].i };
  // 18. 11. (uživatel): překlepy a citové protahování („CONCORRRRD“, „HEGEMONYYY“, „concrod“, „hegemny“) – první slovo, které je heslu blízko
  for (const w of t.match(/[A-Z]+/g) || []) {
    const i = theme.factions.findIndex((f) => nearKeyword(w, f.keyword));
    if (i >= 0) return { type: 'enlist', faction: i };
  }
  return null;
}

// slovo odpovídá heslu i s překlepem: po sloučení opakovaných písmen se liší nejvýš o jednu záměnu, vynechání, přidání
// nebo prohození dvou sousedních písmen (jen u slov aspoň 6 písmen, ať se krátká slova nepletou)
const squeeze = (w) => w.replace(/(.)\1+/g, '$1');
function nearKeyword(word, keyword) {
  const a = squeeze(word), b = squeeze(keyword);
  if (a === b) return true;
  if (b.length < 6 || Math.abs(a.length - b.length) > 1 || a[0] !== b[0]) return false;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
  }
  return d[a.length][b.length] <= 1;
}

// comment: { id, userId, username, text, timestamp, mediaId }
export function applyComment(state, comment, theme, story, map) {
  if (state.seenComments.includes(comment.id)) return null;
  story = storyFor(state, theme, story);
  state.seenComments.push(comment.id);
  if (state.seenComments.length > 20000) state.seenComments.splice(0, 5000);
  const vote = castVote(state, comment);
  if (vote) return vote;
  let parsed = parseComment(comment.text, theme);
  // dopis domů (post s voices): delší text často jmenuje i nepřítele („the Hegemony guns…“), to není narukování;
  // narukuje jen krátký komentář s heslem strany
  if (comment.letter && parsed?.type === 'enlist' && (comment.text || '').trim().split(/\s+/).length > 4) parsed = null;
  const handle = (comment.username || '').toLowerCase();
  if (!handle) return null;
  // voják patří IG účtu (trvalé ID), ne jménu: @jméno jde změnit a uvolněné jméno si může vzít někdo jiný
  const existing = findOwnSoldier(state, comment.userId, handle);
  if (existing === TAKEN) return null; // jméno patří vojákovi jiného účtu: nic nepřebírá, nenarukuje pod cizím jménem
  if (parsed?.type === 'claim') return { type: 'claim', handle: existing?.handle ?? handle, code: parsed.code, soldier: existing };
  if (parsed?.type === 'claimLink') return { type: 'claimLink', handle: existing?.handle ?? handle, soldier: existing };
  // wiring party (engine/wiring.js): heslo WIRE pod otevřeným postem = přihláška dobrovolníka na noc
  if (wiringKeyword(state, theme, comment)) {
    if (!existing) return { type: 'wiring', handle, soldier: { handle }, reason: 'notEnlisted' };
    return { type: 'wiring', handle, soldier: existing, reason: joinWiring(state, existing, theme) };
  }
  // noční raid (engine/nightraid.js): heslo RAID pod otevřeným postem = přihláška na příští noc
  if (raidCall(state, theme, comment) && (existing || parsed?.type !== 'enlist')) { // nováček s heslem strany nejdřív narukuje
    if (!existing) return { type: 'nightRaid', handle, soldier: { handle }, reason: 'notEnlisted' };
    return { type: 'nightRaid', handle, soldier: existing, reason: joinRaid(state, existing) };
  }
  // heslo otevřené výpravy (např. CHURCH): přihláška dobrovolníka
  const raid = raidKeyword(state, theme, comment.text);
  // dopis domů (post s voices): zmínka role v textu („the medic carried me…“) není přání role
  const wish = comment.letter ? null : parseRole(comment.text, theme);
  // 17. 11. (uživatel): roli si hráč volí JEN při náboru (heslo strany + role v jednom komentáři, „CONCORD medic“).
  // Kdo už vojáka má, tomu komentář roli nemění a bot mlčí (otázka „what does a lieutenant do“ ani zmínka „the medic…“ nic nedělá);
  // změna role jen převelením z karty vojáka na webu.
  if (!parsed || existing) {
    const role = null;
    if (raid && existing) return { type: 'volunteer', handle, soldier: existing, ...volunteer(state, theme, existing, 'comment'), roleWish: role };
    if (raid && !parsed) return { type: 'volunteer', handle, soldier: { handle }, ok: false, reason: 'notEnlisted' }; // nejdřív narukovat
    if (role) return { type: 'role', handle, soldier: existing, ...role };
    if (wish && !existing) return { type: 'role', handle, soldier: { handle }, role: wish, reason: 'notEnlisted' }; // bez vojáka: i otázka je žádost, odpověď poradí narukovat
    // hlas frakce bez vojáka: nejdřív narukovat (odpověď poradí, jak)
    const vo = !existing && state.vote?.perFaction && voteOption(state, comment);
    if (vo) return { type: 'vote', handle, kw: vo.kw, reason: 'notEnlisted' };
    return null; // každý jen jednou, frakce se nemění
  }
  const f = parsed.faction;
  const order = state.soldiers.filter((s) => s.faction === f).length;
  const s = createSoldier({ id: comment.userId || handle, handle, faction: f, day: state.day, order }, theme, story);
  s.reply = comment.replyTo || comment.id; // náborový komentář: sem bot odpoví při smrti vojáka
  balanceOfficer(state, theme, s); // strana s méně poručíky dostane poručíka (přání role ho níž přepíše)
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

// Jednorázový přepis textu War Bonds u dárce (příkaz rewriteSupport { handle, old }), výjimka z pravidla „deníky se nepřepisují“
// na výslovný pokyn uživatele 2026-11-12: starý text odměny v deníku nahradí aktuálním theme.support.entry a poděkování v novinách
// jména do věty: „A“, „A and B“, „A, B and C“
const andList = (n) => (n.length < 2 ? n.join('') : `${n.slice(0, -1).join(', ')} and ${n.at(-1)}`);
// přepočítá podle aktuálního theme.support.newsText. Vrací počet změněných zápisů.
export function rewriteSupport(state, theme, handle, old) {
  const sup = theme.support;
  const s = state.soldiers.find((x) => x.handle === handle);
  if (!sup || !s) return 0;
  const from = old.replaceAll('{name}', s.name), to = sup.entry.replaceAll('{name}', s.name);
  let n = 0;
  for (const r of s.record || []) if (typeof r[1] === 'string' && r[1].includes(from)) { r[1] = r[1].replace(from, to); n++; }
  for (const t of state.news || []) if (t.kind === 'thanks' && t.names) t.text = sup.newsText.replace('{names}', andList(t.names));
  return n;
}

// Vyrovnání poručíků (theme.officerBalance, od 2026-11-12): poručík se losuje jen při narukování, a tak měla jedna strana 6 a druhá 1.
// Nováček strany, která má méně živých poručíků než druhá strana, je poručík (když si napíše roli, dostane ji: wishRole ho přepíše).
// Strana, která jich má víc, nového poručíka nedostane. Při rovnosti platí běžné losování (váha role). Vrací true, když se role změnila.
export function balanceOfficer(state, theme, s) {
  if (!theme.officerBalance) return false;
  const n = theme.factions.map((_, f) => state.soldiers.filter((x) => x.faction === f && x !== s && x.archetype === 'officer' && x.status !== 'fallen').length);
  const others = n.filter((_, f) => f !== s.faction);
  if (n[s.faction] < Math.max(...others)) {
    if (s.archetype === 'officer') return false;
    s.archetype = 'officer';
    s.rank = theme.ranks.indexOf('Second Lieutenant') >= 0 ? theme.ranks.indexOf('Second Lieutenant') : s.rank;
    return true;
  }
  if (s.archetype === 'officer' && n[s.faction] > Math.min(...others)) {
    const roles = theme.archetypes.filter((a) => a.id !== 'officer').map((a) => [a.id, a.weight]);
    s.archetype = weighted(rngFor(s.id, 'officer-balance'), roles);
    s.rank = 0;
    return true;
  }
  return false;
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
      addEntry(s, state.day, text); // první den: úvod a First Wave v jednom zápisu
    }
  });
}

// Odznak „First Thousand“ (20. 11., uživatel): narukovaní 101.–1 000. (pořadí v soupisce jako u First Wave). Jednorázově příkazem firstThousand
// (zápis do deníku, zpráva do novin); dědí se na nástupce (theme.inheritMedals), v albu rodu ho mají všechny generace. Idempotentní.
export const FIRST_THOUSAND = 1000;
export function awardFirstThousand(state, theme, story) {
  let n = 0;
  state.soldiers.slice(FIRST_WAVE, FIRST_THOUSAND).forEach((s, i) => {
    s.medals ??= [];
    if (s.medals.includes('first-thousand')) return;
    s.medals.push('first-thousand');
    const t = story?.firstThousand?.length ? story.firstThousand[(i * 7) % story.firstThousand.length] : '{name} is one of the first thousand to answer the call.';
    addEntry(s, state.day, t.replaceAll('{name}', s.name).replaceAll('{n}', String(FIRST_WAVE + i + 1)));
    n++;
  });
  return n;
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
    // 19. 11. (uživatel): nováčci jdou do PŘEDNÍ linie; když je v otevřené části plná, fronta se rozšíří o další sektory (vypadá to lépe)
    const frontFree = free.filter((x) => x.line === 'front');
    if (frontFree.length) { slot = frontFree[0]; break; }
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

// Převedení hráče k druhé straně (na jeho žádost): faction, nové stanoviště, jednotka a zápis do deníku. Role, XP, zásahy, rod i medaile zůstávají.
// Počty stran a stav závodu o kótu se přepočítají samy (počítají se vojáci podle `faction`).
export function switchFaction(state, theme, map, handle, faction) {
  const s = state.soldiers.find((x) => x.handle === handle);
  if (!s || s.faction === faction || !theme.factions[faction]) return null;
  const from = theme.factions[s.faction].name.replace(/^The /, '');
  const to = theme.factions[faction].name.replace(/^The /, '');
  s.faction = faction;
  s.pos = null; // staré stanoviště patřilo druhé frontě
  s.slot = null;
  placeSoldier(s, map, state);
  s.pendingRole = null;
  addEntry(s, state.day, `${s.name} asked to serve with the ${to} instead of the ${from}. The transfer came through: ${s.unit}, sector ${s.sector}.`);
  return { handle, from, to, sector: s.sector, unit: s.unit };
}

// Poděkování za dobrovolný dar (data/commands.json: { id, cmd: 'support', handle }): medaile z theme.support, zápis do deníku a jedna řádka
// poděkování do příštích novin (víc dárců téhož dne se spojí do jedné řádky). Jen čest, žádná herní výhoda. Vrací null, když voják není nebo už medaili má.
export function grantSupport(state, theme, handle) {
  const sup = theme.support;
  const s = state.soldiers.find((x) => x.handle === String(handle || '').toLowerCase().replace(/^@/, ''));
  if (!sup || !s || (s.medals || []).includes(sup.medal)) return null;
  s.medals = [...(s.medals || []), sup.medal];
  if (s.status !== 'fallen' && sup.entry) addEntry(s, state.day, sup.entry.replaceAll('{name}', s.name));
  state.news ??= [];
  const n = state.news.find((x) => x.kind === 'thanks' && x.day === state.day);
  const who = `${s.name} (@${s.handle})`; // 16. 11. (uživatel): s handlem, ať jde na dárce v novinách kliknout
  if (n) n.names.push(who);
  else state.news.push({ day: state.day, kind: 'thanks', routine: true, h: sup.newsHead, names: [who] });
  const t = state.news.find((x) => x.kind === 'thanks' && x.day === state.day);
  t.h = sup.newsHead; // nadpis i text vždy podle aktuálního tématu
  t.text = sup.newsText.replace('{names}', andList(t.names));
  return { handle: s.handle, name: s.name };
}

// Jednorázové doplnění @handle k dárci v už vydaných novinách (příkaz linkSupport { handle, day }), výjimka z pravidla „kronika se nepřepisuje“
// na výslovný pokyn uživatele 2026-11-16 (vis.acquillae, Day 7): v poděkování za War Bonds se ke jménu přidá „(@handle)“, ať jde kliknout. Vrací počet změn.
export function linkSupport(state, handle, day) {
  const s = state.soldiers.find((x) => x.handle === String(handle || '').toLowerCase().replace(/^@/, ''));
  if (!s) return 0;
  const names = [s.name, ...(s.fallen || []).map((f) => f.name)];
  let n = 0;
  for (const ch of state.chronicle || []) {
    if (day != null && ch.day !== day) continue;
    for (const b of ch.blocks || []) {
      if (b.kind !== 'thanks' || typeof b.text !== 'string' || b.text.includes(`@${s.handle}`)) continue;
      const nm = names.find((x) => b.text.includes(x));
      if (nm) { b.text = b.text.replace(nm, `${nm} (@${s.handle})`); n++; }
    }
  }
  return n;
}

// Čestný titul hráči (příkaz title { handle, title, entry?, newsHead?, newsText? }), jen čest, žádná herní výhoda (17. 11.: Konrad Sebs,
// „Propagandist of the Hegemony“ za plakáty a burcování pod příspěvky). Titul na kartě, zápis do deníku ({name}), zpráva do příštích novin ({name}, {handle}).
export function grantTitle(state, handle, { title, entry, newsHead, newsText } = {}) {
  const s = state.soldiers.find((x) => x.handle === String(handle || '').toLowerCase().replace(/^@/, ''));
  if (!s || !title || (s.titles || []).includes(title)) return null;
  s.titles = [...(s.titles || []), title];
  if (entry && s.status !== 'fallen') addEntry(s, state.day, entry.replaceAll('{name}', s.name));
  if (newsText) state.news = [...(state.news || []), { day: state.day, kind: 'title', h: newsHead || title, text: newsText.replaceAll('{name}', s.name).replaceAll('{handle}', s.handle) }];
  return { handle: s.handle, name: s.name, title };
}

// Patreon Officers' Mess: hvězda nad vojákem (jen vzhled). Dá i stužku War Bonds, pokud ji voják nemá. Odebrání (patron odešel) nechá stužku i deník.
export function grantStar(state, theme, handle) {
  const st = theme.support?.star;
  const h = String(handle || '').toLowerCase().replace(/^@/, '');
  const s = state.soldiers.find((x) => x.handle === h);
  if (!st || !s || (s.medals || []).includes(st.medal)) return null;
  if (!(s.medals || []).includes(theme.support.medal)) grantSupport(state, theme, h);
  s.medals = [...(s.medals || []), st.medal];
  if (s.status !== 'fallen' && st.entry) addEntry(s, state.day, st.entry.replaceAll('{name}', s.name));
  return { handle: s.handle, name: s.name };
}
export function revokeStar(state, theme, handle) {
  const st = theme.support?.star;
  const s = state.soldiers.find((x) => x.handle === String(handle || '').toLowerCase().replace(/^@/, ''));
  if (!st || !s || !(s.medals || []).includes(st.medal)) return null;
  s.medals = s.medals.filter((m) => m !== st.medal);
  return { handle: s.handle, name: s.name };
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
  if (opt.only != null && opt.only !== s.faction) return null; // možnost patří druhé straně
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
    if (opt.only != null && opt.only !== s.faction) return { type: 'vote', handle, kw: opt.kw, faction: s.faction, reason: 'otherSide', options: v.options.filter((o) => o.only == null || o.only === s.faction).map((o) => o.kw) };
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
    const opts = v.options.filter((o) => o.only == null || o.only === f); // každá strana volí ze své nabídky (option.only = frakce)
    const counts = Object.fromEntries(opts.map((o) => [o.kw, 0]));
    for (const t of Object.values(v.tallies)) if (t.f === f && t.kw in counts) counts[t.kw] = (counts[t.kw] || 0) + 1;
    // strana bez jediného hlasu nedostane nic (stavba ani rozkaz nepřijde zadarmo); remíza → dřívější možnost
    const winner = Object.values(counts).some((n) => n > 0) ? opts.reduce((best, o) => (counts[o.kw] > counts[best.kw] ? o : best), opts[0]) : null;
    return { faction: f, counts, winner };
  });
  const total = Object.keys(v.tallies).length;

  const winner = per.map((p) => `${sideName(theme, p.faction)}: ${p.winner?.kw ?? 'no votes'}`).join(' · ');
  const tankOrder = (w) => { // TANK (26. 11.): místo plošného bonusu tank vázaný na místo (theme.tank: dosah r, palba, zásahy na vlastní, dny); bez theme.tank platí starý plošný rozkaz
    if (w.kw !== 'TANK' || !theme.tank) return w;
    const { fire, exposed, ...rest } = w;
    return { ...rest, tank: { r: theme.tank.r, fire: theme.tank.fire, exposed: theme.tank.exposed }, days: theme.tank.days ?? w.days };
  };
  const orders = issueOrders(state, per.filter((p) => p.winner).map((p) => tankOrder({ ...p.winner, ...(p.winner.byFaction?.[p.faction] || {}), faction: p.faction })), state.day + 2); // 16. 11. (uživatel): rozkaz platí až od příští bitvy (dnes se teprve postaví, na mapě je vidět hned); byFaction: stejné heslo, jiný účinek podle strany
  // stavby (dugout, pytle, drát…): trvalé, staví se jen hlasováním
  // věta o stavbě (theme.battle.buildings[].done) nahradí obecný výsledek možnosti, ať se v Gazette neříká totéž dvakrát
  const builtOf = per.map((p) => (p.winner?.build ? buildStructure(state, theme, p.faction, p.winner.build) : null));
  const built = builtOf.filter(Boolean);
  const text = per.map((p, i) => (builtOf[i] ? `${builtOf[i]}.`
    : (p.winner ? p.winner.byFaction?.[p.faction]?.outcome || p.winner.outcome || '' : 'No word came back from the {side}: nothing was built.').replaceAll('{side}', sideName(theme, p.faction)))).join(' ');
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

// Příběhy bez toho, co ve hře zatím není (texty i místa se vypustí, viz silenceGuns):
//   děla do první výhry v závodě o kótu (theme.battle.gunsWords), výpravy, když jsou vypnuté (theme.valley.words),
//   a kóty, o které se ještě nebojuje (theme.race.objectives za tou právě dobývanou).
export function storyFor(state, theme, story) {
  const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const words = [
    gunsSilent(state, theme) ? theme.battle.gunsWords : null,
    theme.valley?.enabled === false ? theme.valley.words : null,
    ...(theme.race?.objectives || []).slice((state.race?.idx ?? 0) + 1).map((o) => esc(o.name)),
  ].filter(Boolean);
  return words.length ? silenceGuns(story, words.join('|')) : story;
}

// Denní tah: nový den, zápisy, osudy, nástupci padlých, kronika dne do Deníku fronty.
export function dailyTick(state, theme, story, ctx = {}) {
  story = storyFor(state, theme, story);
  const decided = resolveVote(state, theme, ctx.now);
  resolveShells(state, theme, ctx.now); // souboj komentářů (granáty): zpráva do novin, rozbité bunkry poraženého
  resolvePilotCall(state, theme, ctx.now); // nábor pilotů: los mezi přihlášenými, jeden pilot na stranu
  if (decided && !decided.perFaction) {
    ctx = { ...ctx, danger: ctx.danger ?? decided.danger };
  }
  const nightWeather = state.weather ?? weatherFor(theme, story, state.day)?.id ?? null; // počasí noci, kdy výprava vyrazila
  state.day++;
  const day = state.day;
  if (decided) decided.day = day; // výsledek vyjde v ranním vydání tohoto dne (vyhodnocuje se před přechodem na nový den)
  const weather = weatherFor(theme, story, day);
  state.weather = weather?.id ?? null;
  // výpravy: vyhodnocení té z minulého vydání, vyhlášení nové (účastníci dnes nemají běžný zápis)
  const raid = valleyTick(state, theme, story, day, nightWeather);
  // denní boj: zásahy, medici, lůžka, drát (engine/battle.js); účastníci výpravy dnes v linii nejsou
  const dangerOf = (s) => (ctx.danger ?? 1) * (theme.race ? raceDanger(state, theme, s.faction, day) : 1) * valleyDanger(state, theme, s, day) * orderDanger(state, s.faction, day);
  const careOf = (s) => orderRecover(state, s.faction, day, valleyRecover(state, theme, s)) / 0.35;
  // dopis domů (odeslán ve dne před tahem): -15 % zásahů všeho druhu na jednu noc (theme.battle.letter.cut)
  const letterCut = theme.battle?.letter?.cut ?? 0.15;
  const letterOf = (s) => (s.letter === day - 1 ? 1 - letterCut : 1);
  const shellOf = (s) => orderShell(state, s.faction, day) * letterOf(s);
  // pozorovatelna na kótě (theme.race.observation): odstřelovači a kulometčíci strany, která ji drží, střílí přesněji
  const obs = theme.race?.observation && activeObservation(state, day);
  const obsOf = (s) => (obs && s.faction === obs.by && (theme.race.observation.roles || []).includes(s.archetype) ? 1 + (theme.race.observation.fire || 0) : 1);
  const fireOf = (s) => orderFire(state, s.faction, day, s.archetype) * obsOf(s) * (s.archetype === 'rifleman' ? pilotFire(state, theme, s.faction, weather?.id) : 1); // letecký průzkum zlepšuje puškaře
  // pozorovatel hlásí přesné místo: zásah střelce s pozorovatelnou častěji zabije na místě (×(1 + observation.kill))
  const killOf = (s) => (obsOf(s) > 1 ? 1 + (theme.race.observation.kill || 0) : 1);
  const unsuppressed = (s) => !!(obs && s.faction === obs.by);
  const logi = theme.race?.logistics && activeLogistics(state, day);
  const shotsOf = (s) => (logi && s.faction === logi.by ? theme.race.logistics.shots || 2 : null); // lepší logistika: víc výstřelů vítězi // strana s pozorovatelnou: kulomety naproti ji nepotlačí
  const healOf = (s) => orderHeal(state, s.faction, day);
  const exposedOf = (s) => orderExposed(state, s.faction, day) * letterOf(s);
  const dieOf = (s) => orderDie(state, s.faction, day);
  pilotSortie(state, theme, day, weather?.id, fallSoldier, (s, sev) => { s.wound = { sev, day }; s.status = 'wounded'; s.woundsTaken = (s.woundsTaken || 0) + 1; }); // denní vzlet: bouře/mlha drží na zemi, jinak malá šance sestřelení
  const fight = theme.battle ? battleTick(state, theme, story, day, { busy: raid.ids, dangerOf, careOf, shellOf, fireOf, killOf, unsuppressed, healOf, exposedOf, dieOf, shotsOf }) : { events: [], news: [], ids: new Set() };
  if (theme.race) checkKillRace(state, theme, story); // závod „kdo první zabije N“: zpráva o dobytí jde do state.news (níž se přidá do novin)
  const events = [...raid.events, ...fight.events];
  const today = new Set(); // šablony použité dnes (rozmanitost mezi vojáky)
  for (const s of state.soldiers) s.bg ??= makeBackground(s, story);
  const active = new Set(ctx.activeIds || []);
  const chosen = new Set(selectForStory(state.soldiers, day, active, theme.storyShare ?? 0.25).map((s) => s.id));
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
    if (s.record.at(-1)?.[0] === day) continue; // dnes už má zápis (např. společná příhoda): jeden zápis za den
    if (!chosen.has(s.id) && s.status === 'active') continue;
    const danger = dangerOf(s);
    const recover = orderRecover(state, s.faction, day, valleyRecover(state, theme, s));
    const sctx = { active: active.has(s.id), danger, weather, events, comrade, foe, today, recover, battle: !!theme.battle };
    for (const text of tickSoldier(s, day, theme, story, sctx)) addEntry(s, day, text);
  }
  dogStories(state, theme, story, day, today); // příběhy psů (Trench Dog): jen vojáci se psem
  awardHouseBadges(state, theme); // odznaky rodu (zůstávají v rodu)
  const news = [...(state.news || []).filter((n) => n.day >= day - 1), ...raid.news, ...fight.news]; // zprávy o dobytí kóty jdou první
  // pošta: hráč „posílá“ svému vojákovi dopis z domova; kdo ho včera dostal, má o něm zápis (v novinách se nezmiňuje)
  const readers = state.soldiers.filter((s) => s.letter === day - 1 && s.status !== 'fallen');
  // 24. 11. (edheadl: „v deníku pořád to samé s dopisem“): kdo posílá denně, dostal dřív každý den stejnou větu (výběr jen podle s.order); teď víc vět a střídají se po dnech
  const LETTERS = theme.letters?.lines || ['A letter from home reached {n} before dusk. {n} read it twice and slept a little easier.', 'Mail came up the line with a letter for {n}. {n} read it in the dugout and kept the envelope.', 'A letter from home found {n} before the night shift. {n} folded it small and kept it close.'];
  for (const s of readers) { addEntry(s, day, LETTERS[((s.order || 0) + day) % LETTERS.length].replaceAll('{n}', s.name)); findCard(state, theme, s, 'letter', day); } // 24. 11.: v dopise občas kartička (theme.cards.chance.letter)
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
    medics: top(live, (s) => s.treated || 0), // celoživotní počet ošetřených: drží se i po převelení na jinou roli (stejně jako zásahy a XP)
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
  const ok = theme.archetypes.some((a) => a.id === role && a.id !== 'officer' && !a.special);
  if (!ok || !s || !s.claimed || s.archetype === 'officer' || s.archetype === 'pilot') return false;
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
    addEntry(s, state.day, eventEntry('transfer', s, state.day, theme, story, { role: nameOf(s.archetype), oldRole }));
    done.push(s);
  }
  return done;
}

const RECENT = 10; // posledních 10 zápisů je v dávce karty (karta ukáže 3, „Show more“ zbylých 7), starší v records-old
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
    // padlí celkem po stranách (všichni předchůdci rodů + aktuálně padlí), pruh „Fallen“ v horním panelu
    fallen: [0, 1].map((f) => state.soldiers.reduce((a, s) => a + (s.faction === f ? (s.fallen || []).length + (s.status === 'fallen' ? 1 : 0) : 0), 0)),
    dispatch: (state.events || []).slice(-1)[0] || null,
    weather: state.weather ?? null,
    race: raceStatus(state, theme),
    victories: (state.victories || []).slice(-10).reverse(),
    barrage: activeBarrage(state, state.day, true),
    observation: activeObservation(state, state.day, true), // pozorovatelna na kótě (web: falešný strom za linií vítěze)
    mines: (state.mines || []).map((m) => ({ id: m.id, name: m.name, faction: m.faction, status: m.status, at: m.at, blown: m.blown ? { x0: m.blown.x0, x1: m.blown.x1, hit: m.blown.hit, killed: m.blown.killed, day: m.blown.day } : null })), // mina z kóty (web/src/mine.js)
    guns: (state.guns || []).map((g) => ({ id: g.id, name: g.name, faction: g.faction, cond: g.cond, destroyed: !!g.destroyed, since: g.since, last: g.last ? { x0: g.last.x0, x1: g.last.x1, secs: g.last.secs, hit: g.last.hit, killed: g.last.killed } : null })), // těžká děla (web/src/guns.js)
    history: (state.events || []).slice(-30).reverse(),
    valley: valley.roster,
    vote: state.vote ? {
      question: state.vote.question, options: state.vote.options.map((o) => ({ kw: o.kw, label: o.label, ...(o.only != null ? { only: o.only } : {}) })), votes: Object.keys(state.vote.tallies).length,
      ...(state.vote.perFaction ? { perFaction: true } : {}), ...(state.vote.note ? { note: state.vote.note } : {}),
    } : null,
    battle: battlePublic(state, theme),
    orders: (state.orders || []).filter((o) => state.day + 1 <= o.to).map(({ faction, kw, label, from, to, ruined, tankX }) => ({ faction, kw, label, from, to, ...(ruined ? { ruined } : {}), ...(tankX != null ? { tankX } : {}) })),
    pilots: pilotsPublic(state), // piloti stran pro web (letadlo nad frontou)
    shells: state.shells ? { counts: state.shells.counts, target: state.shells.target, openedAt: state.shells.openedAt } : null, // souboj komentářů: živé počty granátů
    updated: new Date().toISOString(),
    nextEdition: nextEdition(state, theme),
    fields: ['handle', 'faction', 'x', 'y', 'dir', 'line', 'medals', 'archetype', 'rank', 'status', 'variant', 'claimed', 'generation', 'name', 'dog'],
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
      s.dog?.breed || '', // plemeno psa (Trench Dog), prázdné = bez psa
    ]),
  };
  const NS = shardCount(state.soldiers.length);
  roster.shards = NS;
  const shards = Array.from({ length: NS }, () => ({}));
  // starší zápisy (nad RECENT) jdou do archivních shardů, web je načte až na „Show older entries“
  const older = Array.from({ length: NS }, () => ({}));
  for (const s of state.soldiers) {
    if (s.record.length > RECENT) older[shardOf(s.handle, NS)][s.handle] = s.record.slice(0, -RECENT);
    shards[shardOf(s.handle, NS)][s.handle] = {
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
      wiring: s.wiring || 0,
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
      dog: s.dog ? { name: s.dog.name, breed: s.dog.breed, since: s.dog.since } : null,
      cards: s.cards || [], // sběratelské kartičky rodu (engine/cards.js)
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

export function shardOf(handle, n = SHARDS) {
  return hashString(handle) % n;
}

// Jednorázově (příkaz inheritMedals, 18. 11.): nástupcům vrátí dědičné medaile (theme.inheritMedals), které měl některý padlý předek. Bez zápisu do deníku.
export function inheritMedals(state, theme) {
  const keep = theme.inheritMedals || [];
  let n = 0;
  for (const s of state.soldiers) {
    const had = new Set((s.fallen || []).flatMap((r) => r.medals || []).filter((m) => keep.includes(m)));
    for (const m of had) if (!(s.medals || []).includes(m)) { s.medals = [...(s.medals || []), m]; n++; }
  }
  return n;
}
