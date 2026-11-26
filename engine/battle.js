// Denní boj na frontě (návrh: docs/COMBAT_ROLES.md, docs/BATTLE.md). Všechna čísla jsou v theme.battle (ladění bez programování).
//
// Pořadí kroků v ranním tahu:
//  1) palba hráčů: každý voják v přední linii občas vystřelí na nepřítele naproti (dosah roles.range px podle pozice x).
//     Šance podle role (roles.fire), úrovně (xp), velitele a spojky poblíž, potlačení nepřátelskými kulomety a krytí cíle.
//     Zapíše se, kdo koho trefil (deník obou, žebříček zásahů, XP).
//  2) pozadí: dělostřelectvo, granáty, miny (battle.hit) – ~60 % zásahů jako ve skutečné válce; spojař poblíž snižuje.
//     Po výhře v závodě bombardování úseků poražené strany (battle.shell.sectors, 3 dny).
//  3) kam s raněným: lůžko (kritičtí první, pak těžce ranění), pak nosítka (stejné pořadí); lehce ranění leží v zákopu.
//     Kritický bez nosítek ani lůžka noc nepřežije. Těžký bez nosítek leží v zákopu (horší).
//  4) medici: každý má za den práci 1 (víc s úrovní). Potřeba: kritický 2, těžký 2, lehký 1 (na lůžku 0 – léčí nemocnice).
//     Práce se rozdělí podle závažnosti (kritičtí první). Plná péče: lehký je druhý den v pořádku, těžký se stabilizuje a hojí,
//     kritický přežije noc. Chybějící péče = riziko zhoršení / smrti úměrně tomu, kolik péče chybí.
//  5) drát (ženisté), XP, denní metriky, pojistka proti masakru (battle.maxDeaths).
//
// state.battle = { sides: [{ built, beds: [id], wire: { sector: 0..1 } }], stats: [{ day, … }] }
// voják: s.wound = { sev, day, place: 'bed'|'stretcher'|'trench', by?, shell? }, s.xp, s.hits, s.tough, s.scars, s.treated

import { rngFor } from './rng.js';
import { eventEntry } from './story.js';
import { activeBarrage, activeObservation } from './race.js';
import { orderStretchers, orderMedics, orderGuns, orderBarrage, orderTank } from './orders.js';
import { fallSoldier, addEntry } from './soldier.js';
import { gunTargets, gunUpkeep } from './gun.js';
import { mineBlasts } from './mine.js';
import { findCard, cardsNewsLine } from './cards.js';

const B = (theme) => theme.battle;
const short = (theme, f) => theme.factions[f].name.replace(/^The /, '');
const X = (s) => s.pos?.[0] ?? s.slot?.x ?? 0;

export function ensureBattle(state, theme) {
  if (!B(theme)) return null;
  state.battle ??= { sides: theme.factions.map(() => ({ built: {}, beds: [], wire: {} })) };
  return state.battle;
}

const count = (side, id) => side.built[id] || 0;

// obvaziště (vždy) + postavené nemocnice: lůžka, nosítka, péče, úmrtnost kritických na lůžku
export function hospital(state, theme, f) {
  const cfg = B(theme);
  const side = ensureBattle(state, theme).sides[f];
  const n = count(side, 'dugout');
  const a = cfg.aidPost, d = cfg.buildings.dugout;
  // aidPost.stretchersPerMedic: každý medik schopný služby nese nosítka navíc (kapacita roste s volbou hráčů, ne s velikostí strany)
  const medics = a.stretchersPerMedic ? state.soldiers.filter((s) => s.faction === f && s.archetype === 'medic' && s.status !== 'fallen' && !(s.wound && s.wound.sev !== 'light')).length : 0;
  const sc = (v) => v + Math.floor(medics * (a.stretchersPerMedic || 0)) + orderStretchers(state, f, state.day); // + nosítka z rozkazu (BEARERS)
  // care = násobek hojení těžce raněného proti nosítkům s plnou péčí (≥ 1), critRisk = násobek rizika smrti kritického za noc
  // proti nosítkům (≤ 1): lůžko je tak VŽDY lepší než nosítka, nemocnice lepší než obvaziště
  const F = cfg.buildings.hospital, big = F && count(side, 'hospital') > 0; // polní nemocnice (26. 11.): velká stavba NAVÍC k obvazišti a zemnicím (lůžka, nosítka se sčítají, péče nejlepší z nich)
  const base = !n ? { name: a.name, dugout: false, dugouts: 0, beds: a.beds, stretchers: sc(a.stretchers), care: a.care, critRisk: a.critRisk }
    : { name: d.name, dugout: true, dugouts: n, beds: n * d.beds, stretchers: sc(a.stretchers + n * (d.stretchers || 0)), care: d.care, critRisk: d.critRisk };
  if (!big) return base;
  return { ...base, name: F.name, big: true, beds: base.beds + F.beds, stretchers: base.stretchers + (F.stretchers || 0), care: Math.max(base.care, F.care), critRisk: Math.min(base.critRisk, F.critRisk) };
}

// Po dostavění nemocnice (polní nemocnice, 26. 11.) obsadí nová lůžka těžce a kriticky ranění z nosítek (kritičtí první, pak kdo leží déle).
// Jen přesun místa: účinek lůžek na péči a smrti se projeví až v dalším tahu.
export function fillBeds(state, theme, day = state.day) {
  let n = 0;
  theme.factions.forEach((_, f) => {
    const side = ensureBattle(state, theme).sides[f], H = hospital(state, theme, f);
    const mine = state.soldiers.filter((s) => s.faction === f && isWounded(s));
    side.beds = (side.beds || []).filter((id) => mine.some((s) => s.id === id && s.wound.place === 'bed'));
    const pri = (s) => (s.wound.sev === 'crit' ? 0 : 1);
    const queue = mine.filter((s) => s.wound.sev !== 'light' && s.wound.place !== 'bed').sort((a, b) => pri(a) - pri(b) || a.wound.day - b.wound.day);
    for (const s of queue) {
      if (side.beds.length >= H.beds) break;
      s.wound.place = 'bed'; s.wound.bedDay = day; side.beds.push(s.id); n++;
    }
  });
  return n;
}

export function build(state, theme, f, id) {
  const def = B(theme)?.buildings?.[id];
  if (!def) return null;
  const side = ensureBattle(state, theme).sides[f];
  if (def.requires && !count(side, def.requires)) return null;
  if (def.max && count(side, id) >= def.max) return null;
  side.built[id] = count(side, id) + 1;
  if (def.wire) for (const k of Object.keys(side.wire)) side.wire[k] = Math.min(1, side.wire[k] + def.wire);
  return `The ${short(theme, f)} ${def.done || `built: ${def.name}`}`;
}

// --- zkušenosti ---
export function levelOf(theme, s) {
  const L = B(theme).xp.levels;
  let lv = L[0];
  for (const l of L) if ((s.xp || 0) >= l.xp) lv = l;
  return lv;
}
const mult = (theme, s) => levelOf(theme, s).mult;
const gainXp = (theme, s, n) => { if (s && n) s.xp = (s.xp || 0) + n; };

const isWounded = (s) => s.status !== 'fallen' && !!s.wound;
const toughOf = (s) => (s.tough ??= 1 + Math.floor(rngFor(s.id, 'tough', s.generation || 1)() * 4)); // 1–4, jizvy až 5
const role = (cfg, s, key) => cfg.roles[s.archetype]?.[key] ?? cfg.roles.default?.[key] ?? 0;

// práce mediků (pro web a výpočet). Medik: 1 × úroveň; lehce raněný medik polovina, těžce/kriticky raněný nic.
export function medicWork(state, theme, f, busy = new Set()) {
  let supply = 0;
  for (const s of state.soldiers) {
    if (s.faction !== f || s.archetype !== 'medic' || busy.has(s.id) || s.status === 'fallen') continue;
    if (s.wound && s.wound.sev !== 'light') continue;
    supply += role(B(theme), s, 'work') * mult(theme, s) * (s.wound ? 0.5 : 1);
  }
  return supply + orderMedics(state, f, state.day); // + ošetřovatelé z rozkazu (MEDICS)
}
const needOf = (cfg, s) => (s.wound.place === 'bed' ? 0 : cfg.care[s.wound.sev].need);
export function medicCover(state, theme, f, busy = new Set()) {
  const cfg = B(theme);
  const supply = medicWork(state, theme, f, busy);
  const pts = state.soldiers.filter((s) => s.faction === f && isWounded(s) && s.wound.place !== 'bed');
  const demand = pts.reduce((a, s) => a + needOf(cfg, s), 0);
  return { supply, demand, wounded: pts.length, cover: demand ? Math.min(1, supply / demand) : 1 };
}

function sectorsOf(state, f) {
  return [...new Set(state.soldiers.filter((s) => s.faction === f && s.sector).map((s) => s.sector))];
}

// vojáci strany seřazení podle x (pro „kdo je poblíž“)
function lineup(state, f, filter) {
  return state.soldiers.filter((s) => s.faction === f && filter(s)).sort((a, b) => X(a) - X(b));
}
function near(list, x, r) {
  // binární hledání by stačilo, ale listy jsou malé (stovky)
  return list.filter((s) => Math.abs(X(s) - x) <= r);
}
// podíl pokrytí podpůrnou rolí: každý z n vojáků role pokryje nejvýš `covers` lidí, o účinek se dělí `crowd` lidí poblíž.
// Účinek tak roste s poměrem role k počtu vojáků (každý panáček má smysl) a nikdy nepřekročí 100 % účinku role.
// Bez `covers` v theme (starší témata): stačí jeden poblíž.
export function share(n, covers, crowd) {
  if (!n) return 0;
  return covers ? Math.min(1, (n * covers) / Math.max(1, crowd)) : 1;
}

// ctx: { dangerOf(s), careOf(s), busy: Set (výprava) }
// dělostřelectvo střílí až po první výhře v závodě (theme.battle.gunsAfterVictory); do té doby zásahy z pozadí = kulky, granáty, drát
export const gunsSilent = (state, theme) => !!B(theme)?.gunsAfterVictory && !(state.victories || []).length;

export function battleTick(state, theme, story, day, ctx = {}) {
  const cfg = B(theme);
  const out = { events: [], news: [], ids: new Set(), stats: null };
  if (!cfg || cfg.enabled === false) return out;
  ensureBattle(state, theme);
  const R = cfg.roles, range = R.range;
  const busy = ctx.busy || new Set();
  const today = new Set();
  // tpl = klíč šablony, kterou eventEntry právě vybral (poslední v s.seen): kronika podle něj nedá stejnou historku dvakrát do jednoho vydání
  const ev = (s, type, text) => {
    out.events.push({ type, handle: s.handle, faction: s.faction, text, tpl: s.seen?.at(-1) });
    out.ids.add(s.id);
    addEntry(s, day, text);
    return text;
  };
  const barrage = activeBarrage(state, day);
  const stats = theme.factions.map(() => ({
    hits: { bg: 0, shell: 0, fire: {} }, sev: { light: 0, heavy: 0, crit: 0 }, deaths: { nobed: 0, nocare: 0, wounds: 0, shell: 0, shot: 0 },
    beds: 0, stretchers: 0, trench: 0, cover: 1, capped: 0, shots: 0,
  }));
  const shelled = new Set();
  if (barrage && cfg.shell) {
    const secs = sectorsOf(state, barrage.target).sort();
    const r = rngFor(theme.id, 'shell', day);
    const want0 = Math.max(cfg.shell.sectors || 0, Math.round(secs.length * (cfg.shell.share || 0))); // podíl úseků roste s frontou
    const want = Math.max(1, Math.round(want0 * orderGuns(state, barrage.target, day) * orderBarrage(state, barrage.by, day))); // protipalba (COUNTERFIRE) zredukuje počet ostřelovaných úseků
    while (shelled.size < Math.min(want, secs.length)) shelled.add(secs[Math.floor(r() * secs.length)]);
  }
  const shellHits = [];
  // mina (rozkaz TUNNELLERS): v poslední den rozkazu vybuchne pod nejlidnatějším úsekem nepřítele (cfg.mine), jednou za rozkaz
  const mineAt = new Map(); // frakce → množina úseků, pod kterými vybuchla mina
  for (const o of (state.orders || []).filter((x) => x.mine && x.to === day && cfg.mine)) {
    const f = 1 - o.faction, bySec = new Map();
    for (const s of state.soldiers.filter((x) => x.faction === f && x.sector && x.status === 'active')) bySec.set(s.sector, (bySec.get(s.sector) || 0) + 1);
    const best = [...bySec].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, cfg.mine.sectors || 1);
    if (best.length) {
      mineAt.set(f, new Set(best.map(([sec]) => sec)));
      const men = best.reduce((a, [, n]) => a + n, 0);
      out.news.push({ day, kind: 'mine', h: `Mines went up under the ${short(theme, f)} line`, text: `${short(theme, o.faction)} tunnellers had been digging for days. At dawn the ground lifted under sectors ${best.map(([sec]) => sec).join(', ')} and fell back. ${men} ${short(theme, f)} men were in it.` });
    }
  }

  // převod starších raněných (dřívější modely): vše raněné je status wounded, místo se určí v kroku 3
  for (const s of state.soldiers) {
    if (s.status === 'wounded' && !s.wound) s.wound = { sev: 'heavy', day };
    if (s.wound && s.status === 'active') s.status = 'wounded';
    if (s.wound && s.wound.bed && !s.wound.place) s.wound.place = 'bed';
  }

  const able = (s) => s.status === 'active' && !s.wound && !busy.has(s.id);
  // těžké dělo (reward 'gun', engine/gun.js): každý den nejhustší kus nepřátelské fronty; zásahy jako granát
  const gunFire = gunTargets(state, theme, day, X, able);
  const gunOn = (s) => gunFire.find((g) => g.target === s.faction && g.ids.has(s.id));
  for (const g of gunFire) g.res = { hit: 0, killed: 0 };
  // mina z kóty (reward 'mine', engine/mine.js): po dni kopání vybuchne pod nejhustším úsekem nepřátelské první linie, nebo ji nepřítel zavalí
  const mineFire = mineBlasts(state, theme, day, X, able);
  const mineOn = (s) => mineFire.find((m) => m.ids && m.target === s.faction && m.ids.has(s.id));
  // tank (26. 11., NÁVRH): v okně poloměru r kolem tanku střílí vlastní střelci víc (fire) a nepřítel víc zasahuje vlastní vojáky (exposed: tank přitahuje palbu).
  // Poloha = nejhustší okno vlastní první linie (jako mina); ukládá se do rozkazu (`tankX`), web podle ní kreslí tank
  const tankOf = theme.factions.map((_, f) => {
    const o = orderTank(state, f, day);
    if (!o) return null;
    const T = o.tank, xs = state.soldiers.filter((x) => x.faction === f && x.line === 'front' && x.status === 'active' && !x.wound).map(X).sort((a, b) => a - b);
    if (!xs.length) return null;
    let best = 0, bi = 0, j = 0;
    for (let i = 0; i < xs.length; i++) { while (xs[j] < xs[i] - 2 * T.r) j++; if (i - j + 1 > best) { best = i - j + 1; bi = Math.round((xs[j] + xs[i]) / 2); } }
    o.tankX = bi;
    return { x: bi, r: T.r, fire: T.fire ?? 1, exposed: T.exposed ?? 1 };
  });
  const tankNear = (s, k) => { const t = tankOf[s.faction]; return t && Math.abs(X(s) - t.x) <= t.r ? t[k] : 1; };
  const coverOf = (s) => {
    const side = state.battle.sides[s.faction];
    const wire = side.wire[s.sector] ?? (side.wire[s.sector] = cfg.wire.start);
    const service = day - (s.enlisted ?? day);
    return (cfg.line[s.line] ?? 1) * (1 - cfg.buildings.sandbags.cover * count(side, 'sandbags')) * (1 - cfg.wire.cover * wire)
      * (1 - cfg.experience * Math.min(1, service / cfg.experienceDays)) * (ctx.exposedOf?.(s) ?? 1) * tankNear(s, 'exposed');
  };
  const severity = (s, table, rand, shell) => {
    const service = day - (s.enlisted ?? day);
    const r = rand() + cfg.toughShift * (toughOf(s) - 2);
    let sev = r > table.light ? 'light' : r > table.heavy ? 'heavy' : 'crit';
    // kritický ne v prvních dnech služby (granát nováčky nešetří) a ne dvakrát za týden
    if (sev === 'crit' && ((service < cfg.newbieDays && !shell) || (s.lastCrit != null && day - s.lastCrit < cfg.critCooldown))) sev = 'heavy';
    return sev;
  };
  const wound = (s, sev, extra = {}) => {
    if (sev === 'crit') s.lastCrit = day;
    s.wound = { sev, day, ...extra };
    s.status = 'wounded';
    s.woundsTaken = (s.woundsTaken || 0) + 1;
    stats[s.faction].sev[sev]++;
  };
  const hitKind = (sev) => ({ light: 'hitLight', heavy: 'hitHeavy', crit: 'hitCrit' })[sev];

  // 0) wiring party (theme.battle.wiring, engine/wiring.js): dobrovolníci v noci opraví drát svého úseku (nebo nejhoršího, když je jejich celý);
  // riziko dává jen palba hlídek nepřítele na dostřel (kdo z nepřátel šel ven, nehlídá) × počasí × bombardování × ženista; zásah = běžné zranění
  const WC = cfg.wiring, wo = state.wiring?.open;
  const wireAvg = (f) => { const v = Object.values(state.battle.sides[f].wire); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const mended = theme.factions.map(() => null); // { before, after, yards } po nočních opravách (Gazette: co z nich zbylo po ostřelování)
  if (WC && wo && wo.day < day) {
    const signed = wo.ids.map((id) => state.soldiers.find((s) => s.id === id)).filter((s) => s && s.status !== 'fallen' && !busy.has(s.id));
    const fit = (s) => !s.wound || s.wound.sev === 'light'; // lehce raněný chodí, jde taky
    const vol = signed.filter(fit);
    const wireBefore = theme.factions.map((_, f) => wireAvg(f));
    for (const s of signed.filter((x) => !fit(x))) ev(s, 'wiring', (WC.keptBack || '{n} signed up for the wiring party, but the medic would not let {n} leave the aid post. The wire will wait for another night.').replaceAll('{n}', s.name));
    const outside = new Set(vol.map((s) => s.id));
    const watch = theme.factions.map((_, f) => lineup(state, f, (s) => able(s) && s.line === 'front' && !outside.has(s.id)));
    const wk = WC.weather?.[state.weather] ?? 1;
    const res = theme.factions.map(() => ({ n: 0, yards: 0, hit: [], secs: {} }));
    const cardsFound = [];
    for (const s of vol) {
      const f = s.faction, side = state.battle.sides[f];
      let sec = s.sector;
      if ((side.wire[sec] ?? cfg.wire.start) >= (WC.full ?? 0.95)) sec = Object.entries(side.wire).sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? sec;
      const fire = near(watch[1 - f], X(s), range).reduce((a, m) => a + role(cfg, m, 'fire'), 0);
      const sap = s.archetype === 'sapper';
      const WR = WC.roles?.[s.archetype] || {}; // výhoda role na drátu (24. 11. NÁVRH): risk = násobek rizika (po stropu max), repair = násobek opravy
      const p = Math.min(WC.max ?? 1, (WC.base + WC.perFire * fire) * wk * (barrage?.target === f ? WC.barrage ?? 1 : 1) * (sap ? WC.sapperRisk ?? 1 : 1)) * (WR.risk ?? 1);
      const add = (sap ? WC.sapperRepair : WC.repair) * mult(theme, s) * (WR.repair ?? 1);
      const before = side.wire[sec] ?? cfg.wire.start;
      side.wire[sec] = Math.round(Math.min(1, before + add) * 100) / 100;
      res[f].n++;
      res[f].secs[sec] = (res[f].secs[sec] || 0) + 1;
      res[f].yards += Math.round((side.wire[sec] - before) * 100);
      s.wiring = (s.wiring || 0) + 1;
      gainXp(theme, s, WC.xp || 0);
      if (WC.badgeAt && s.wiring >= WC.badgeAt && !(s.medals || []).includes('wire-party')) s.medals = [...(s.medals || []), 'wire-party'];
      const rand = rngFor(theme.id, s.id, 'wiring', day);
      if (rand() < p) {
        const sev = severity(s, WC.severity || cfg.roles.rifleman?.severity || cfg.severity, rngFor(theme.id, s.id, 'wiringSev', day), false); // vlastní řada: po zásahu (malé číslo) by další číslo téže řady nebylo nezávislé
        wound(s, sev, { wiring: true });
        stats[f].hits.bg++;
        res[f].hit.push({ handle: s.handle, name: s.name, sev });
        const bk = { light: 'bulletLight', heavy: 'bulletHeavy', crit: 'bulletCrit' }[sev];
        ev(s, sev === 'light' ? 'hit' : 'wounded', `Out on the wire with the wiring party. ${eventEntry(story[bk] ? bk : hitKind(sev), s, day, theme, story, {}, today)}`);
      } else if (story.wiringSafe?.length) ev(s, 'wiring', eventEntry('wiringSafe', s, day, theme, story, { sector: sec }, today));
      const card = findCard(state, theme, s, 'wire', day); // kartička v blátě (engine/cards.js): jen kdo se vrátí živý a ne těžce raněný
      if (card) cardsFound.push(card);
    }
    if (vol.length) {
      const nm = (f) => short(theme, f);
      const parts = theme.factions.map((_, f) => (res[f].n ? `${res[f].n} ${nm(f)} soldier${res[f].n > 1 ? 's' : ''} put up ${res[f].yards} yards of wire` : null)).filter(Boolean);
      const hit = theme.factions.flatMap((_, f) => res[f].hit);
      const home = theme.factions.map((_, f) => f).filter((f) => !res[f].n);
      out.news.push({
        day, kind: 'wiring', h: 'Wiring parties in no man\'s land',
        text: `Last night ${parts.join(', and ')}.` +
          (home.length === 1 ? ` The ${nm(home[0])} stayed in the trench and kept every rifle on the parapet.` : '') +
          (hit.length ? ` Caught in the flares: ${theme.factions.map((_, f) => res[f].hit.length ? `${res[f].hit.length} ${nm(f)} (${res[f].hit.filter((h) => h.sev !== 'light').length} badly)` : null).filter(Boolean).join(', ')}.` : ' Everyone came back.') + cardsNewsLine(theme, cardsFound), // noviny jen čísla (uživatel 19. 11. a 23. 11.), jména zůstávají v denících
        wiring: res,
      });
    }
    theme.factions.forEach((_, f) => { if (res[f].n) mended[f] = { before: wireBefore[f], after: wireAvg(f), yards: res[f].yards, n: res[f].n }; });
    state.wiring.nights = [...(state.wiring.nights || []), { day, media: wo.media, ids: wo.ids.length, sides: res.map((r) => ({ n: r.n, yards: r.yards, hit: r.hit.length, bad: r.hit.filter((h) => h.sev !== 'light').length, secs: r.secs })) }].slice(-60);
    state.wiring.open = null;
  }

  // 0b) noční raid (theme.battle.raid, engine/nightraid.js): dobrovolníci vpadnou do nepřátelského zákopu poblíž svého úseku.
  //     Úspěch roste s potrhaným drátem nepřítele a mlhou/deštěm, klesá s kulomety obránců. Zásah raidera je zblízka (lopatka, bajonet,
  //     pistole): hlavně těžký a kritický, zabití se počítá do závodu. Raider může padnout nebo být raněn.
  const resting = new Set(); // raideři té noci (ráno nestřílí, když battle.raid.rest)
  const raidHits = theme.factions.map(() => 0); // zásahy raiderů do zákopu strany (opotřebení bunkrů)
  const RC = cfg.raid, ro = state.raid?.open;
  if (RC && ro && ro.day < day) {
    const raiders = ro.ids.map((id) => state.soldiers.find((x) => x.id === id)).filter((x) => x && x.status === 'active' && !x.wound && !busy.has(x.id));
    const res = theme.factions.map(() => ({ n: 0, kills: 0, wounded: 0, fell: 0, hurt: 0, empty: 0, best: {} }));
    const hitByRaid = new Set();
    const cardsFound = [];
    const wk = RC.weather?.[state.weather] ?? 1;
    for (const s of raiders) {
      const f = s.faction, e = 1 - f, r = res[f];
      r.n++;
      s.raids = (s.raids || 0) + 1;
      gainXp(theme, s, RC.xp || 0);
      if (RC.badgeAt && s.raids >= RC.badgeAt && !(s.medals || []).includes('raider')) s.medals = [...(s.medals || []), 'raider'];
      const rand = rngFor(theme.id, s.id, 'raid', day);
      const defenders = near(lineup(state, e, (x) => able(x) && x.line === 'front'), X(s), range * (RC.reach || 2));
      const mgs = defenders.filter((x) => x.archetype === 'machinegunner').length;
      const wire = wireAvg(e) ?? cfg.wire.start;
      const RR = RC.roles?.[s.archetype] || {}; // výhoda role na raidu (24. 11. NÁVRH: puškař): win = násobek šance vyhrát souboj, hurt = násobek rizika na cestě zpět
      const pWin = Math.max(RC.minWin ?? 0.15, Math.min(RC.maxWin ?? 0.85, (RC.base + (RC.perGap || 0) * (1 - wire)) * wk * mult(theme, s) * (RR.win ?? 1) - (RC.perMG || 0) * mgs));
      if (RC.rest) resting.add(s.id);
      // souboje: až RC.rounds za noc, další jen když raider vyhrál předchozí (19. 11., uživatel: raid má být opravdu smrtící)
      let won = 0;
      for (let round = 0; round < (RC.rounds || 1) && (round === 0 || won === round); round++) {
      const pool = defenders.filter((x) => !hitByRaid.has(x.id));
      if (pool.length && rand() < pWin) {
        won++;
        raidHits[e]++;
        const t = pool[Math.floor(rand() * pool.length)];
        hitByRaid.add(t.id);
        const sev = severity(t, RC.severity, rngFor(theme.id, t.id, 'raidSev', day), false);
        const prev = t.wound;
        wound(t, prev ? 'crit' : sev, { by: { handle: s.handle, name: s.name, role: s.archetype, faction: f }, raid: true });
        const dies = (t.wound.sev === 'crit' && rand() < (RC.kill ?? 0.8)) || (t.wound.sev === 'heavy' && rand() < (RC.killHeavy ?? 0.5));
        if (dies) { t.wound.outright = 'raid'; r.kills++; r.best[s.handle] = (r.best[s.handle] || 0) + 1; }
        else r.wounded++;
        stats[f].hits.fire.raider = (stats[f].hits.fire.raider || 0) + 1;
        s.hits = (s.hits || 0) + 1;
        ev(s, 'raid', eventEntry(dies ? 'nightRaidKill' : 'nightRaidWound', s, day, theme, story, { target: t.name, targetHandle: t.handle, side: short(theme, e) }, today) + ` (@${t.handle})`);
        if (!dies) ev(t, 'wounded', eventEntry('nightRaidStabbed', t, day, theme, story, { target: s.name, side: short(theme, f) }, today) + ` Raider: ${s.name} of the ${short(theme, f)} (@${s.handle}).`);
      } else if (round === 0) r.empty++;
      }
      // cesta zpátky: světlice, kulomet, drát
      const pHurt = Math.min(RC.maxHurt ?? 0.6, ((RC.hurt ?? 0.25) + (RC.hurtPerMG || 0) * mgs) * (RR.hurt ?? 1));
      const rr = rngFor(theme.id, s.id, 'raidBack', day);
      if (rr() < pHurt) {
        const sev = severity(s, RC.severity, rngFor(theme.id, s.id, 'raidBackSev', day), false);
        const shooter = defenders.filter((x) => x.archetype === 'machinegunner' || x.archetype === 'rifleman' || x.archetype === 'sniper')[Math.floor(rr() * Math.max(1, defenders.length))] || null;
        wound(s, sev, { raid: true, back: true, ...(shooter ? { by: { handle: shooter.handle, name: shooter.name, role: shooter.archetype, faction: e } } : {}) });
        if ((sev === 'crit' && rr() < (RC.raiderKill ?? 0.6)) || (sev === 'heavy' && rr() < (RC.raiderKillHeavy ?? 0.3))) { s.wound.outright = 'raid'; r.fell++; }
        else r.hurt++;
        if (!s.wound.outright) ev(s, sev === 'light' ? 'hit' : 'wounded', eventEntry('nightRaidHurt', s, day, theme, story, {}, today));
      } else if (!res[f].best[s.handle] && rr() < 0.5) ev(s, 'raid', eventEntry('nightRaidBack', s, day, theme, story, {}, today));
      const card = findCard(state, theme, s, 'raid', day);
      if (card) cardsFound.push(card);
    }
    if (raiders.length) {
      const nm = (f) => short(theme, f);
      const parts = theme.factions.map((_, f) => {
        const r = res[f];
        if (!r.n) return null;
        const best = Object.entries(r.best).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
        const hero = best && state.soldiers.find((x) => x.handle === best[0]);
        return `${r.n} ${nm(f)} raider${r.n > 1 ? 's' : ''} went over: ${r.kills} ${nm(1 - f)} dead, ${r.wounded} wounded in their own trench. ` +
          `${r.fell ? `${r.fell} raider${r.fell > 1 ? 's' : ''} did not come back` : 'Every raider came back'}${r.hurt ? `, ${r.hurt} hurt` : ''}.` +
          (hero ? ` Bravest of the night: ${hero.name} (@${hero.handle}), ${best[1]} ${best[1] > 1 ? 'men' : 'man'}.` : '');
      }).filter(Boolean);
      const home = theme.factions.map((_, f) => f).filter((f) => !res[f].n);
      out.news.push({
        day, kind: 'raid', h: RC.newsHead || 'Night raid',
        text: parts.join(' ') + (home.length === 1 ? ` The ${nm(home[0])} sent nobody over and waited behind the parapet.` : '') + cardsNewsLine(theme, cardsFound),
        raid: res.map(({ best, ...x }) => x),
      });
    }
    state.raid.nights = [...(state.raid.nights || []), { day, media: ro.media, ids: ro.ids.length, sides: res.map(({ best, ...x }) => x) }].slice(-60);
    state.raid.open = null;
  }

  // 1) palba hráčů
  // střílí přední linie a od 19. 11. i podpůrná (battle.shootLines: linie → násobek palby; dřív jen přední, takže s přibývajícími hráči,
  // kteří se řadí dozadu, palba nerostla); raideři té noci ráno nestřílí (vyčerpaní, battle.raid.rest)
  const SL = cfg.shootLines || { front: 1 };
  const front = theme.factions.map((_, f) => lineup(state, f, (s) => able(s) && (SL[s.line] ?? 0) > 0 && !resting.has(s.id)));
  // cíle: zdraví vojáci v linii a od 15. 11. i ranění, kteří od včerejška leží v zákopu bez nosítek (uživatel: „taky se na ně střílí“)
  const lying = (s) => s.status === 'wounded' && s.wound?.place === 'trench' && s.wound.day < day && !busy.has(s.id);
  const targetsOf = theme.factions.map((_, f) => lineup(state, f, (s) => (able(s) || (cfg.hitLying && lying(s))) && (cfg.line[s.line] ?? 0) > 0));
  const shooters = theme.factions.flatMap((_, f) => front[f]);
  const sigFire = theme.factions.map((_, f) => lineup(state, f, (s) => s.archetype === 'signaller' && able(s)));
  const taken = new Set(); // každý cíl nejvýš jeden zásah za den
  const fireLog = [];
  // výstřelů za den: roles.<role>.shots (24. 11., NÁVRH: puškař má víc nábojů a střílí celý den), jinak roles.shots;
  // lepší logistika vítěze kóty (ctx.shotsOf) násobí počet výstřelů v poměru k roles.shots
  const shotsOf = (s) => { const own = R[s.archetype]?.shots ?? R.shots ?? 1, c = ctx.shotsOf?.(s); return Math.max(1, Math.round(c != null ? own * c / (R.shots || 1) : own)); };
  const rounds = Math.max(1, ...shooters.map(shotsOf)); // každý cíl dál nejvýš jeden zásah za den
  // přeplnění role (23. 11., NÁVRH): roles.<role>.ideal = podíl role ve straně, nad kterým každý další střílí méně
  // (odstřelovačů na jednu stranu nemůže být neomezeně: o stejná místa a cíle se dělí). účinnost = (ideal / podíl)^crowdPow, nejvýš 1
  const crowd = theme.factions.map((_, f) => {
    const alive = state.soldiers.filter((x) => x.faction === f && x.status !== 'fallen');
    const out = {};
    for (const [r, c] of Object.entries(R)) if (c?.ideal) { const sh = alive.filter((x) => x.archetype === r).length / Math.max(1, alive.length); out[r] = sh > c.ideal ? Math.pow(c.ideal / sh, R.crowdPow ?? 1) : 1; }
    return out;
  });
  for (let round = 0; round < rounds; round++) for (const s of (round ? shooters.filter(able) : shooters).filter((x) => shotsOf(x) > round)) { // v dalším kole střílí jen ti, kdo zůstali zdraví po předchozím (obě strany naráz)
    const f = s.faction, e = 1 - f;
    const fire = role(cfg, s, 'fire');
    if (!fire) continue;
    const mates = near(front[f], X(s), range);
    const officers = mates.filter((m) => m.archetype === 'officer').length;
    const runners = mates.filter((m) => m.archetype === 'runner').length;
    const lead = officers ? R.officer.lead * share(officers, R.officer.covers, mates.length)
      : runners ? R.runner.relay * share(runners, R.runner.covers, mates.length) : 0;
    const mgs = near(front[e], X(s), range).filter((m) => m.archetype === 'machinegunner').length;
    const MG = R.machinegunner;
    const suppress = MG.covers ? MG.suppressMax * share(mgs, MG.covers, mates.length) : Math.min(MG.suppressMax, mgs * MG.suppress);
    // nasycení palby (roles.saturation = k): když je u střelce víc vlastních střelců než nepřátel na dostřel, každý trefí méně
    // (cílů je omezeně, kryjí se). Početní převaha tak nedrtí s druhou mocninou a složení rolí menší strany má váhu.
    const foes = R.saturation ? near(targetsOf[e], X(s), range).length : 0;
    const sat = R.saturation ? Math.min(1, (R.saturation * foes) / Math.max(1, mates.length)) : 1;
    // pozorovatelna (15. 11., uživatel): pozorovatel hlásí, kde stojí nepřátelské kulomety, takže střelce strany s pozorovatelnou nepotlačí
    // spojař (roles.signaller.counterFire, 24. 11. NÁVRH): telefonem navádí vlastní děla na střelecká hnízda; střelec, u kterého jsou nepřátelští spojaři, trefí méně
    const cf = R.signaller?.counterFire ? R.signaller.counterFire * share(near(sigFire[e], X(s), range).length, R.signaller.covers, near(targetsOf[e], X(s), range).length) : 0;
    const p = fire * (SL[s.line] ?? 1) * mult(theme, s) * (1 + lead) * (ctx.unsuppressed?.(s) ? 1 : 1 - suppress) * sat * (crowd[f][s.archetype] ?? 1) * (ctx.fireOf?.(s) ?? 1) * tankNear(s, 'fire') * (1 - cf);
    stats[f].shots++;
    const rand = round ? rngFor(s.id, `fire${round}`, day) : rngFor(s.id, 'fire', day);
    if (rand() >= p) continue;
    let pool = near(targetsOf[e], X(s), range).filter((t) => !taken.has(t.id));
    if (!pool.length) continue; // naproti nikdo (prázdný úsek)
    if (s.archetype === 'sniper' && rand() < R.sniper.pick) {
      const pri = pool.filter((t) => t.archetype === 'machinegunner' || t.archetype === 'officer');
      if (pri.length) pool = pri;
    }
    // výběr cíle podle vystavení (krytí cíle snižuje šanci, že zásah sedí)
    const w = pool.map(coverOf);
    let k = rand() * w.reduce((a, b) => a + b, 0), t = pool[0];
    for (let i = 0; i < pool.length; i++) { k -= w[i]; if (k <= 0) { t = pool[i]; break; } }
    if (rand() > coverOf(t) / (cfg.line.front || 1)) continue; // krytí zachytilo kulku
    const src = R[s.archetype]?.severity ? s.archetype : 'rifleman';
    const prev = t.wound; // raněný ležící v zákopu: lehký se zhorší, těžký a kritický druhou kulku nepřežije
    let sev = severity(t, R[src].severity, rand, false);
    if (prev) sev = prev.sev === 'light' ? (sev === 'light' ? 'heavy' : sev) : 'crit';
    taken.add(t.id);
    wound(t, sev, { by: { handle: s.handle, name: s.name, role: s.archetype, faction: f } });
    if (prev && prev.sev !== 'light') t.wound.outright = 'shot';
    // smrtelný zásah kulkou (roles.<role>.kill nebo roles.kill): kritický zásah může zabít na místě
    const kill = R[s.archetype]?.kill ?? R.kill ?? 0;
    const km = ctx.killOf?.(s) ?? 1; // pozorovatelna: přesnější a smrtelnější zásahy
    if ((sev === 'crit' && kill && rand() < Math.min(1, kill * km)) || (sev === 'heavy' && R.killHeavy && rand() < Math.min(1, R.killHeavy * km))) t.wound.outright = 'shot'; // i těžký zásah může zabít (roles.killHeavy)
    stats[f].hits.fire[s.archetype] = (stats[f].hits.fire[s.archetype] || 0) + 1;
    s.hits = (s.hits || 0) + 1;
    s.hitsBy = { ...(s.hitsBy || {}), [sev]: ((s.hitsBy || {})[sev] || 0) + 1 };
    gainXp(theme, s, cfg.xp.gain.hit[sev] * (mates.some((m) => m.archetype === 'officer') ? 1 + R.officer.xp : 1));
    const by = ` Shot by ${s.name} of the ${short(theme, f)} (@${s.handle}).`;
    const bk = { light: 'bulletLight', heavy: 'bulletHeavy', crit: 'bulletCrit' }[sev];
    ev(t, sev === 'light' ? 'hit' : 'wounded', eventEntry(story[bk] ? bk : hitKind(sev), t, day, theme, story, {}, today) + by);
    fireLog.push({ by: s.handle, byF: f, role: s.archetype, at: t.handle, sev });
    // texty role (story.shotHit_<role>) se přimíchají k obecným: jeden společný balík, takže se nic neopakuje, dokud se nevyčerpá celý
    const own = story[`shotHit_${s.archetype}`];
    ev(s, 'shot', eventEntry('shotHit', s, day, theme, own?.length ? { ...story, shotHit: [...story.shotHit, ...own] } : story, { target: t.name, targetHandle: t.handle, how: { light: 'grazed', heavy: 'badly wounded', crit: 'gravely wounded' }[sev] }, today));
  }

  // 2) pozadí: dělostřelectvo, granáty, miny; bombardování po výhře
  const signallers = theme.factions.map((_, f) => lineup(state, f, (s) => s.archetype === 'signaller' && able(s)));
  // denní mez nových raněných na stranu (theme.battle.daily): za klidu nejvýš max, pod granáty nejvýš shellMax, a aspoň min;
  // pořadí vojáků se každý den losuje, aby mez nešetřila stále stejné
  const D = cfg.daily;
  const silent = gunsSilent(state, theme);
  const newToday = (f) => { const v = stats[f].sev; return v.light + v.heavy + v.crit; };
  // meze rostou s velikostí strany (D.per vojáků = 1×; menší strana má meze jako D.per)
  const size = theme.factions.map((_, f) => state.soldiers.filter((s) => s.faction === f && s.status !== 'fallen').length);
  const scale = (f) => (D?.per ? Math.max(1, size[f] / D.per) : 1);
  const maxOf = (f) => (!D ? Infinity : Math.round((barrage?.target === f && shelled.size ? D.shellMax ?? Infinity : D.max ?? Infinity) * scale(f)));
  const minOf = (f) => Math.round((D?.min || 0) * scale(f));
  const bgHit = (s, sev, underShells) => {
    wound(s, sev, underShells ? { shell: true } : {});
    if (underShells) { shellHits.push(s); stats[s.faction].hits.shell++; } else stats[s.faction].hits.bg++;
    const kind = hitKind(sev);
    const bullet = `bullet${kind.slice(3)}`;
    const k2 = underShells && story[`shell${kind.slice(3)}`] ? `shell${kind.slice(3)}`
      : silent && story[bullet] && rngFor(s.id, 'quiet', day)() < 0.5 ? bullet : kind;
    ev(s, sev === 'light' ? 'hit' : 'wounded', eventEntry(k2, s, day, theme, story, {}, today));
  };
  const order = state.soldiers.map((s) => [rngFor(s.id, 'order', day)(), s]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  for (const s of order) {
    if (!able(s)) continue;
    if (newToday(s.faction) >= maxOf(s.faction)) continue;
    const side = state.battle.sides[s.faction];
    const rand = rngFor(s.id, 'battle', day);
    const mf = mineOn(s); // mina z kóty vybuchla přímo pod ním
    const underMine = !!mineAt.get(s.faction)?.has(s.sector) || !!mf; // mina vybuchla pod jeho úsekem
    const gf = cfg.gun && gunOn(s); // pod palbou těžkého děla
    const underShells = (barrage?.target === s.faction && shelled.has(s.sector)) || underMine || !!gf;
    const sig = share(near(signallers[s.faction], X(s), range).length, R.signaller.covers, near(targetsOf[s.faction], X(s), range).length);
    const own = R.signaller.counter * sig;
    // roles.signaller.counterShell: spojař navádí protipalbu i proti bombardování (snižuje zásahy granátem v jeho okolí, podle pokrytí)
    const p = underMine ? cfg.mine.hit : gf ? cfg.gun.hit * gf.power * (cfg.line[s.line] ?? 1) * (1 - (R.signaller.counterShell || 0) * sig) : underShells
      ? cfg.shell.hit * (cfg.line[s.line] ?? 1) * (1 - cfg.buildings.sandbags.cover * count(side, 'sandbags')) * (1 - (R.signaller.counterShell || 0) * sig) * (ctx.shellOf?.(s) ?? 1)
      : cfg.hit * coverOf(s) * (ctx.dangerOf?.(s) ?? 1) * (barrage?.target === s.faction ? cfg.barrage : 1) * (1 - own); // spojař poblíž: telefon k vlastnímu dělostřelectvu, protipalba
    if (rand() >= p) continue;
    bgHit(s, severity(s, underShells ? cfg.shell.severity : cfg.severity, rand, underShells), underShells);
    // přímý zásah granátem (battle.shell.kill): kritický zásah pod granáty může zabít na místě, lůžko ani medik nepomůže
    if (underShells && s.wound?.sev === 'crit' && cfg.shell.kill && rand() < (mf ? cfg.mine.kill ?? cfg.shell.kill : gf ? cfg.gun.kill ?? cfg.shell.kill : cfg.shell.kill)) s.wound.outright = 'shell';
    if (mf) { mf.res.hit++; if (s.wound?.outright) mf.res.killed++; } else if (gf) { gf.res.hit++; if (s.wound?.outright) gf.res.killed++; }
  }
  // zprávy o minách z kóty (theme.race.mine)
  for (const mb of mineFire) {
    const m = mb.mine, T = theme.race?.mine || {};
    const fill = (t) => (t || '').replaceAll('{name}', m.name).replaceAll('{us}', short(theme, m.faction)).replaceAll('{them}', short(theme, 1 - m.faction))
      .replaceAll('{diggers}', m.diggers.map((h) => '@' + h).join(', ') || 'the sappers').replaceAll('{listeners}', String(m.collapsed?.listeners ?? 0))
      .replaceAll('{from}', mb.secs?.[0] || '').replaceAll('{to}', mb.secs?.at(-1) || '').replaceAll('{hit}', String(mb.res?.hit || 0)).replaceAll('{killed}', String(mb.res?.killed || 0));
    if (mb.digging) { out.news.push({ day, kind: 'mine', h: fill(T.diggingH), text: fill(T.digging) }); continue; }
    if (mb.collapsed) { out.news.push({ day, kind: 'mine', h: fill(T.collapsedH), text: fill(T.collapsed) }); continue; }
    m.blown = { day, target: mb.target, secs: mb.secs, x0: mb.x0, x1: mb.x1, hit: mb.res.hit, killed: mb.res.killed };
    stats[m.faction].mine = m.blown;
    out.news.push({ day, kind: 'mine', h: fill(T.h), text: fill(T.text) });
  }
  // klidný den bez raněných nebývá: aspoň D.min zásahů z pozadí na stranu (vybráni podle vystavení, přední linie častěji)
  if (D?.min) theme.factions.forEach((_, f) => {
    const pool = lineup(state, f, (s) => able(s) && (cfg.line[s.line] ?? 0) > 0);
    const r = rngFor(theme.id, `floor${f}`, day);
    while (newToday(f) < minOf(f) && pool.length) {
      const w = pool.map(coverOf);
      let k = r() * w.reduce((a, b) => a + b, 0), i = 0;
      while (i < pool.length - 1 && (k -= w[i]) > 0) i++;
      const [s] = pool.splice(i, 1);
      bgHit(s, severity(s, cfg.severity, rngFor(s.id, 'floor', day), false), false);
    }
  });

  // 3–4) místo pro raněné a péče mediků, po stranách
  const deathsToday = theme.factions.map(() => 0);
  const alive = theme.factions.map((_, f) => state.soldiers.filter((s) => s.faction === f && s.status !== 'fallen').length);
  const cap = theme.factions.map((_, f) => Math.max(cfg.maxDeaths.min, Math.floor(alive[f] * cfg.maxDeaths.share)));
  const die = (s, kind, cause, vars = {}, raid = false) => {
    const f = s.faction;
    if (deathsToday[f] >= cap[f]) { stats[f].capped++; return false; } // pojistka: přežije do zítřka
    deathsToday[f]++;
    stats[f].deaths[cause]++;
    const by = s.wound?.by;
    ev(s, 'fallen', eventEntry(kind, s, day, theme, story, vars, today) + (cause === 'shot' && by ? ` ${raid ? 'Killed in the night raid by' : 'Shot by'} ${by.name} of the ${short(theme, by.faction)} (@${by.handle}).` : ''));
    fallSoldier(s, day, ['wounds', 'shell', 'shot'].includes(cause) ? cause : 'nobed', cause === 'shot' && by ? { by: by.handle } : {});
    if (cause === 'shot' && by) { const k = state.soldiers.find((x) => x.handle === by.handle); if (k) k.kills = (k.kills || 0) + 1; }
    return true;
  };

  theme.factions.forEach((_, f) => {
    const side = state.battle.sides[f];
    const H = hospital(state, theme, f);
    const mine = () => state.soldiers.filter((s) => s.faction === f && isWounded(s));
    const pri = (s) => ({ crit: 0, heavy: 1, light: 2 })[s.wound.sev];
    for (const s of state.soldiers.filter((x) => x.faction === f && x.wound?.outright)) {
      const how = s.wound.outright, by = s.wound.by;
      delete s.wound.outright;
      const key = how === 'raid' ? (s.wound.back ? 'nightRaidFell' : 'nightRaidKilled') : how === 'shot' ? 'killedShot' : 'killedShell'; // raider padlý na cestě zpět má vlastní texty (19. 11.: dřív dostal text obránce)
      die(s, story[key] ? key : 'diedNoBed', how === 'raid' ? 'shot' : how, by ? { target: by.name, targetHandle: by.handle, side: short(theme, by.faction) } : {}, how === 'raid');
    }
    const place = () => {
      side.beds = side.beds.filter((id) => state.soldiers.some((s) => s.id === id && isWounded(s) && s.wound.place === 'bed'));
      const queue = mine().filter((s) => s.wound.sev !== 'light' && s.wound.place !== 'bed').sort((a, b) => pri(a) - pri(b) || a.wound.day - b.wound.day);
      let str = mine().filter((s) => s.wound.place === 'stretcher' && s.wound.sev !== 'light').length;
      for (const s of queue) {
        const was = s.wound.place;
        if (side.beds.length < H.beds) {
          s.wound.place = 'bed';
          s.wound.bedDay = day;
          side.beds.push(s.id);
          if (was === 'stretcher') str--;
          if (was) ev(s, 'admitted', eventEntry('admitted', s, day, theme, story, { hospital: H.name.toLowerCase() }, today));
        } else if (was !== 'stretcher' && str < H.stretchers) {
          s.wound.place = 'stretcher';
          str++;
          if (was === 'trench') ev(s, 'stretcher', eventEntry('stretcher', s, day, theme, story, {}, today));
        } else if (!was) s.wound.place = 'trench';
      }
      // triáž (battle.care.triage): kritický bez místa vezme lůžko nebo nosítka těžce raněnému (ten jde o stupeň níž, nejdřív kdo leží nejdéle)
      if (cfg.care.triage) {
        for (const c of mine().filter((s) => s.wound.sev === 'crit' && s.wound.place !== 'bed').sort((a, b) => a.wound.day - b.wound.day)) {
          const bedHeavy = side.beds.map((id) => state.soldiers.find((x) => x.id === id)).filter((x) => x?.wound?.sev === 'heavy').sort((a, b) => a.wound.day - b.wound.day)[0];
          if (bedHeavy) {
            side.beds = side.beds.filter((id) => id !== bedHeavy.id);
            bedHeavy.wound.place = c.wound.place === 'stretcher' ? 'stretcher' : 'trench';
            c.wound.place = 'bed'; c.wound.bedDay = day; side.beds.push(c.id);
            ev(c, 'admitted', eventEntry('admitted', c, day, theme, story, { hospital: H.name.toLowerCase() }, today));
            continue;
          }
          if (c.wound.place === 'stretcher') continue;
          const strHeavy = mine().filter((x) => x.wound.sev === 'heavy' && x.wound.place === 'stretcher').sort((a, b) => a.wound.day - b.wound.day)[0];
          if (strHeavy) { strHeavy.wound.place = 'trench'; c.wound.place = 'stretcher'; ev(c, 'stretcher', eventEntry('stretcher', c, day, theme, story, {}, today)); }
        }
      }
      for (const s of mine()) if (s.wound.sev === 'light' && !s.wound.place) s.wound.place = 'trench';
    };
    place();

    // práce mediků podle závažnosti: kritičtí, těžce, lehce (stejná skupina: kdo je raněný déle)
    let supply = medicWork(state, theme, f, busy);
    const cooks = lineup(state, f, (s) => s.archetype === 'cook' && s.status !== 'fallen' && !(s.wound && s.wound.sev !== 'light'));
    const chaplains = state.soldiers.filter((s) => s.faction === f && s.archetype === 'chaplain' && s.status !== 'fallen' && !(s.wound && s.wound.sev !== 'light')).length;
    const dying = mine().filter((s) => (s.wound.sev === 'crit' || (R.chaplain.heavy && s.wound.sev === 'heavy')) && s.wound.place !== 'bed').length;
    const faith = R.chaplain.faith * share(chaplains, R.chaplain.covers, dying); // roles.chaplain.heavy (24. 11. NÁVRH): kaplan stojí i u těžce raněných
    // kuchař (roles.cook.relief, 24. 11. NÁVRH): lehce raněné poblíž ošetří sám (čaj, obvaz, teplo), takže potřebují méně práce mediků
    const cookK = (s) => share(near(cooks, X(s), range).length, R.cook.covers, near(mine().filter((x) => x.wound.sev === 'light'), X(s), range).length);
    const need1 = (s) => needOf(cfg, s) * (R.cook.relief && s.wound.sev === 'light' ? 1 - R.cook.relief * cookK(s) : 1);
    const lights = mine().filter((s) => s.wound.sev === 'light').sort((a, b) => X(a) - X(b));
    const patients = mine().filter((s) => s.wound.place !== 'bed').sort((a, b) => pri(a) - pri(b) || a.wound.day - b.wound.day);
    const need = patients.reduce((a, s) => a + need1(s), 0);
    stats[f].cover = need ? Math.min(1, supply / need) : 1;
    const medics = state.soldiers.filter((s) => s.faction === f && s.archetype === 'medic' && s.status !== 'fallen' && !(s.wound && s.wound.sev !== 'light') && !busy.has(s.id));
    for (const s of patients) {
      const n = need1(s);
      // care.spread (15. 11., uživatel): medici, kteří nestíhají, se rozdělí mezi všechny raněné rovným dílem (každý dostane jen část péče),
      // místo aby nejvážnější měli plnou péči a ostatní nic
      const g = cfg.care.spread ? (n ? stats[f].cover : 1) : n ? Math.min(1, supply / n) : 1;
      supply = Math.max(0, supply - n);
      s.wound.care = g;
      if (g > 0 && medics.length) {
        const m = medics[Math.floor(rngFor(s.id, 'medic', day)() * medics.length)];
        m.treated = (m.treated || 0) + 1;
        gainXp(theme, m, cfg.xp.gain.treat * g);
      }
    }

    for (const s of mine()) {
      const w = s.wound;
      const rand = rngFor(s.id, 'care', day);
      // pod granáty se medici a nosiči k raněným v ostřelovaném úseku dostanou jen zčásti (battle.shell.careCut)
      const pinned = barrage?.target === s.faction && shelled.has(s.sector) && w.place === 'trench' ? 1 - (cfg.shell.careCut || 0) : 1; // jen kdo ještě leží v ostřelovaném zákopu (nosítka už jsou na obvazišti)
      const g = w.place === 'bed' ? 1 : (w.care ?? 0) * pinned;
      const C = cfg.care[w.sev];
      const fresh = w.day === day;
      if (w.sev === 'light') {
        if (fresh) continue; // ošetří se a druhý den je v pořádku
        const k = share(near(cooks, X(s), range).length, R.cook.covers, near(lights, X(s), range).length);
        const cook = k ? { heal: R.cook.heal * k, worsen: R.cook.worsen * k } : null;
        const cookHeal = cook ? cook.heal * (R.cook.always ? 1 : 1 - g) : 0; // roles.cook.always: kuchař pomáhá i lehce raněným, které ošetřují medici
        const worsen = C.worsen * (1 - g) * (cook ? 1 - cook.worsen : 1);
        if (!(day - (s.enlisted ?? day) < cfg.newbieDays) && rand() < worsen) {
          w.sev = 'heavy';
          w.place = null;
          ev(s, 'wounded', eventEntry('worsened', s, day, theme, story, {}, today));
        } else if (rand() < Math.min(1, C.heal * g * (ctx.healOf?.(s) ?? 1) + cookHeal + C.baseHeal)) {
          s.wound = null;
          s.status = 'active';
          ev(s, 'patched', eventEntry('patched', s, day, theme, story, {}, today));
        }
      } else if (w.place === 'bed') {
        // na lůžku v nemocnici se operuje (domluveno s uživatelem 13. 11.): první noc na lůžku rozhoduje. Kritický ji přežije s rizikem
        // dieBase × critRisk místa (nemocnice 0,2, obvaziště 0,4); kdo ji přežije, je z nejhoršího venku a druhý den se vrací na frontu
        // (na lůžku nejvýš 2 dny, nikdo jen nečeká)
        if (!w.operated) {
          if (w.sev === 'crit' && rand() < C.dieBase * H.critRisk * (ctx.dieOf?.(s) ?? 1)) { if (die(s, 'diedInBed', 'wounds')) continue; }
          w.operated = true;
          if (w.sev === 'crit') { w.wasCrit = true; w.sev = 'heavy'; ev(s, 'stabilized', eventEntry('stabilized', s, day, theme, story, {}, today)); }
        }
        // 2 dny od uložení: zpět na frontu (i kdo ležel déle podle starých pravidel, odchází hned)
        if (day - (w.bedDay ?? day) >= (cfg.care.bedDays ? (w.wasCrit ? cfg.care.bedDays.crit : cfg.care.bedDays.heavy) : 2)) recover(s, 'recovered'); // bedDays (26. 11.): těžký 1 den, kritický 2
      } else if (w.sev === 'heavy') {
        const trench = w.place === 'trench';
        const newbie = day - (s.enlisted ?? day) < cfg.newbieDays && !w.shell;
        // dlouho ležící těžce raněný bez lůžka (uživatel 15. 11.): riziko smrti roste s každým dnem a s chybějící péčí mediků,
        // v zákopu víc než na nosítkách. Ukazuje, že bez lůžek (nemocnice) a mediků se raněné udržet nedaří.
        // rozhodnutí (15. 11., uživatel: „je to dlouhé, rychleji ozdravovat nebo zabíjet“): kdo leží těžce raněný maxDays nocí,
        // ten se buď zahojí (šance resolveHeal + resolveCare × péče mediků), nebo zemře; jiné hody ten den nehází
        if (C.maxDays && !fresh && day - w.day >= C.maxDays) {
          const ph = C.resolveHeal + C.resolveCare * g;
          if (rand() < ph + (R.chaplain.heavy ? faith * (1 - ph) : 0)) recover(s, 'patchedStretcher');
          else if (C.resolveWorsen != null && rand() < C.resolveWorsen + (C.resolveWorsenCare || 0) * g + (R.chaplain.heavy ? faith * 0.5 : 0)) { // podíl zhoršení (místo smrti) roste s péčí mediků a vírou kaplana // rozhodnutí v jednom dni (26. 11., uživatel): zahojí se, zhorší se na kritického, nebo zemře
            w.sev = 'crit'; w.critDays = 0; s.lastCrit = day;
            ev(s, 'wounded', eventEntry('worsened', s, day, theme, story, {}, today));
          } else if (die(s, 'diedNoBed', 'nocare')) continue;
          continue;
        }
        const L = cfg.care.linger;
        if (L && (!fresh || trench) && !newbie) { // v zákopu bez nosítek hrozí smrt už první noc (uživatel 15. 11.)
          const p = Math.min(L.max, (L.base + L.perDay * (day - w.day)) * (1 - L.care * g) * (trench ? L.trench : 1) * (ctx.dieOf?.(s) ?? 1)) * (R.chaplain.heavy ? 1 - faith : 1);
          if (rand() < p) { if (die(s, 'diedNoBed', 'nocare')) continue; }
        }
        if (!fresh && !newbie && rand() < C.worsen * (1 - g) * (trench ? C.trench : 1)) {
          w.sev = 'crit';
          s.lastCrit = day;
          ev(s, 'wounded', eventEntry('worsened', s, day, theme, story, {}, today));
        } else if (!fresh && day - w.day >= C.minDays && rand() < C.heal * Math.pow(g, C.healPow ?? 1) * (trench ? 0.5 : 1) * (ctx.healOf?.(s) ?? 1)) { // healPow: bez péče se těžký skoro nezahojí
          recover(s, 'patchedStretcher');
        }
      } else {
        // kritický mimo lůžko: bez nosítek noc nepřežije, na nosítkách rozhoduje péče mediků
        if (w.place === 'trench') {
          if (die(s, 'diedNoBed', 'nobed')) continue;
        } else {
          const pDie = (C.dieBase + C.dieNoCare * (1 - g)) * (1 - faith) * (ctx.dieOf?.(s) ?? 1);
          if (rand() < pDie) { if (die(s, 'diedNoBed', 'nocare')) continue; }
          w.critDays = (w.critDays || 0) + 1;
          if (w.critDays >= C.stabilize && g >= 1) { w.sev = 'heavy'; ev(s, 'stabilized', eventEntry('stabilized', s, day, theme, story, {}, today)); }
        }
      }
    }
    place(); // uvolněná lůžka a nosítka obsadí čekající (kritičtí první)

    stats[f].beds = side.beds.length;
    stats[f].stretchers = mine().filter((s) => s.wound.place === 'stretcher').length;
    stats[f].trench = mine().filter((s) => s.wound.place === 'trench' && s.wound.sev !== 'light').length;

    // drát: opotřebení, dělostřelectvo, opravy ženistů (úroveň zvyšuje)
    for (const sec of sectorsOf(state, f)) side.wire[sec] ??= cfg.wire.start;
    // práce ženistů (20. 11., uživatel): každý zdravý ženista má za den 1 jednotku práce; nejdřív drát ve svém úseku, co zbude (volná práce), jde na dělo a bunkry
    let spare = 0;
    for (const sec of Object.keys(side.wire)) {
      let v = side.wire[sec] - cfg.wire.decay - (barrage?.target === f ? cfg.wire.barrage : 0) - (barrage?.target === f && shelled.has(sec) ? cfg.shell.wire : 0);
      for (const sp of state.soldiers.filter((s) => s.faction === f && s.archetype === 'sapper' && able(s) && s.sector === sec)) {
        const add = R.sapper.repair * mult(theme, sp);
        const used = v < 1 ? Math.min(1, (1 - v) / add) : 0;
        if (v < 1) gainXp(theme, sp, cfg.xp.gain.repair * used);
        spare += 1 - used;
        v += add;
      }
      side.wire[sec] = Math.round(Math.max(0, Math.min(1, v)) * 100) / 100;
    }
    spare += state.soldiers.filter((x) => x.faction === f && x.archetype === 'sapper' && able(x) && !(x.sector in side.wire)).length;
    const sappersAll = state.soldiers.filter((x) => x.faction === f && x.archetype === 'sapper' && able(x)).length;
    // těžké dělo strany: opotřebení, palba nepřítele na okop, protipalba nepřátelského děla; oprava z volné práce ženistů
    for (const gun of (state.guns || []).filter((x) => x.faction === f)) {
      const G = cfg.gun;
      if (!G) break;
      const shooters = state.soldiers.filter((x) => x.faction !== f && able(x) && (x.archetype === 'sniper' || x.archetype === 'machinegunner')).length;
      const enemyGun = gunFire.find((g) => g.gun.faction !== f);
      const counter = enemyGun && rngFor(theme.id, `counter:${gun.id}`, day)() < (G.counterChance || 0) ? (G.counter || 0) * enemyGun.power : 0;
      const u = gunUpkeep(state, theme, day, gun, { enemyShooters: shooters, counter, spare });
      spare = Math.max(0, spare - u.used);
      const g = gunFire.find((x) => x.gun === gun);
      gun.last = { day, target: g?.target ?? null, secs: g?.secs || [], x0: g?.x0 ?? null, x1: g?.x1 ?? null, hit: g?.res.hit || 0, killed: g?.res.killed || 0, wear: u.wear, fix: u.fix, counter: Math.round(counter * 100) / 100 };
      stats[f].gun = { ...gun.last, cond: gun.cond, destroyed: gun.destroyed };
      const fill = (t) => t.replaceAll('{gun}', gun.name).replaceAll('{us}', short(theme, f)).replaceAll('{them}', short(theme, 1 - f))
        .replaceAll('{from}', g?.secs[0] || '').replaceAll('{to}', g?.secs.at(-1) || '').replaceAll('{hit}', String(g?.res.hit || 0)).replaceAll('{killed}', String(g?.res.killed || 0))
        .replaceAll('{cond}', String(Math.round(gun.cond * 100))).replaceAll('{fix}', String(Math.round(u.fix * 100)));
      if (u.destroyedNow) out.news.push({ day, kind: 'gun', h: fill(G.news.destroyedH), text: fill(G.news.destroyed) });
      else if (g) out.news.push({ day, kind: 'gun', h: fill(G.news.h), text: fill(G.news.text) + (u.fix ? ' ' + fill(G.news.repair) : '') + (u.rebuiltNow ? ' ' + fill(G.news.rebuilt) : '') });
      else if (gun.destroyed && u.fix) out.news.push({ day, kind: 'gun', h: fill(G.news.wreckH), text: fill(G.news.wreck) });
    }
    // bunkry (rozkaz PILLBOXES, 19. 11., uživatel): zůstávají natrvalo, válka je opotřebovává (denně, víc pod bombardováním a po zásazích raiderů),
    // ženisti strany je opravují (každý zdravý ženista kousek, a k tomu dál drát). Stav = 1 − ruined (stejné pole jako po souboji granátů, na mapě ruiny).
    const PB = cfg.pillbox;
    if (PB) for (const o of (state.orders || []).filter((x) => x.faction === f && x.kw === 'PILLBOXES' && day >= x.from)) {
      if (PB.permanent) o.to = Math.max(o.to, day + 2);
      const sappers = sappersAll;
      const wear = (PB.wear || 0) + (barrage?.target === f ? PB.barrage || 0 : 0) + raidHits[f] * (PB.perRaid || 0);
      const fix = Math.min(PB.maxRepair ?? 1, spare * (PB.sapperRepair || 0)); // jen volná práce ženistů (po drátu a dělu)
      if (PB.sapperRepair) spare = Math.max(0, spare - fix / PB.sapperRepair);
      const before = o.ruined || 0;
      o.ruined = Math.round(Math.max(0, Math.min(1, before + wear - fix)) * 100) / 100;
      stats[f].pillbox = { before, after: o.ruined, wear: Math.round(wear * 100) / 100, fix: Math.round(fix * 100) / 100, sappers };
    }
  });

  function recover(s, kind) {
    s.wound = null;
    s.status = 'active';
    s.scars = (s.scars || 0) + 1;
    s.tough = Math.min(5, toughOf(s) + 1);
    gainXp(theme, s, cfg.xp.gain.scar);
    ev(s, 'recovered', eventEntry(kind, s, day, theme, story, {}, today));
  }

  // XP za přežitý den
  for (const s of state.soldiers) {
    if (s.status !== 'active' || busy.has(s.id)) continue;
    gainXp(theme, s, s.line === 'front' ? cfg.xp.gain.dayFront : cfg.xp.gain.dayReserve);
  }

  if (shelled.size) {
    const f = barrage.target;
    const bad = shellHits.filter((s) => s.wound && s.wound.sev !== 'light').map((s) => `@${s.handle}`);
    const killed = stats[f].deaths.shell || 0; // přímé zásahy granátem (zabiti na místě)
    out.news.push({
      day, kind: 'barrage', sectors: [...shelled], h: `Hell on the ${short(theme, f)} lines, night ${Math.max(1, day - (barrage.since ?? day))}: the guns of ${barrage.name} are firing`,
      text: `All day the ${short(theme, barrage.by)} guns on ${barrage.name} pounded the ${short(theme, f)} lines, sectors ${[...shelled].slice(0, 6).join(', ')}${shelled.size > 6 ? ` and ${shelled.size - 6} more` : ''}. ` +
        `${shellHits.length ? `${shellHits.length} ${shellHits.length === 1 ? 'man was' : 'men were'} hit` : 'By some miracle nobody was hit'}` +
        `${bad.length ? `, ${bad.length} of them badly` : ''}` +
        `${killed ? `. ${killed} ${killed === 1 ? 'man was' : 'men were'} killed where they stood, and the bearers could not reach every stretcher under the shells` : ''}. The wire there is in shreds.`,
    });
  }
  // Gazette: hlášení z pozorovatelny na kótě (odměna 'observation'): kolik mužů trefili odstřelovači a kulometčíci, kolik dní zbývá
  const OB = theme.race?.observation, obs = OB && activeObservation(state, day);
  if (obs && day >= (obs.since ?? day) + 1) {
    const hits = (OB.roles || []).reduce((a, r) => a + (stats[obs.by].hits.fire[r] || 0), 0);
    const n = obs.to - day, L = OB.left || [];
    const left = (n > 1 ? L[0] : n === 1 ? L[1] : L[2] || '').replace('{n}', n);
    const fill = (x) => x.replaceAll('{objective}', obs.name).replaceAll('{us}', short(theme, obs.by)).replaceAll('{them}', short(theme, obs.target)).replace('{hits}', hits).replace('{left}', left);
    out.news.push({ day, kind: 'observation', h: fill(OB.h), text: fill(OB.text) });
  }
  // Gazette: stav drátu v zemi nikoho a výzva k wiring party (texty theme.battle.wiring.news)
  const WN = cfg.wiring?.news;
  if (WN) {
    const sides = theme.factions.map((_, f) => {
      const v = Object.values(state.battle.sides[f].wire);
      if (!v.length) return null;
      const avg = v.reduce((a, b) => a + b, 0) / v.length;
      if (avg >= (WN.below ?? 0.5)) return null;
      const shellDays = barrage?.target === f ? Math.max(1, day - (barrage.since ?? day)) : 0;
      const cause = shellDays ? WN.causeBarrage.replace('{days}', shellDays === 1 ? 'a day' : `${shellDays} days`).replace('{ridge}', barrage.name) : WN.causeWear;
      const line = WN.side.replace('{side}', short(theme, f)).replace('{pct}', Math.round(avg * 100)).replace('{cause}', cause)
        .replace('{gaps}', v.filter((x) => x < 0.3).length).replace('{secs}', v.length);
      const m = mended[f];
      if (!m || !WN.mendedShelled || !(shellDays && m.after > avg)) return line;
      const without = Math.max(0, Math.round((avg - (m.after - m.before)) * 100));
      return `${line} ${WN.mendedShelled.replace('{n}', m.n).replace('{yards}', m.yards).replace('{without}', without)}`;
    }).filter(Boolean);
    // titulek a pevné věty můžou být pole variant: každý den jiná (ať noviny neopakují doslova stejný odstavec)
    const wr = rngFor(theme.id, 'wirenews', day), one = (x) => (Array.isArray(x) ? x[Math.floor(wr() * x.length)] : x);
    if (sides.length) out.news.push({ day, kind: 'wire', h: one(WN.h), text: [...sides, one(WN.why), one(WN.call)].filter(Boolean).join(' ') });
  }
  // Gazette: jen čísla ztrát po stranách a jména padlých (každý zásah a každé zranění vidí hráč u svého vojáka)
  {
    const parts = theme.factions.map((_, f) => {
      const v = stats[f].sev, hit = v.light + v.heavy + v.crit;
      const dead = out.events.filter((e) => e.type === 'fallen' && e.faction === f);
      const split = [v.light && `${v.light} grazed`, v.heavy && `${v.heavy} badly`, v.crit && `${v.crit} gravely wounded`].filter(Boolean).join(', ');
      return `${short(theme, f)}: ${hit ? `${hit} hit (${split})` : 'nobody hit'}${dead.length ? `; ${dead.length} fallen` : '; no one fell'}.`; // 18. 11. (uživatel): jen čísla, jména najde každý u svého vojáka a v Roll of Honour
    });
    out.news.push({ day, kind: 'fire', routine: true, h: 'Casualties of the day', text: parts.join(' ') });
  }
  const lines = theme.factions.map((_, f) => {
    const H = hospital(state, theme, f), st = stats[f];
    return `${short(theme, f)}: ${H.dugout ? 'hospital' : 'aid post'} ${st.beds}/${H.beds} beds, ${st.stretchers} on stretchers` +
      `${st.trench ? `, ${st.trench} badly wounded still lying in the trench` : ''}, medics covering ${Math.round(st.cover * 100)}% of the wounded.`;
  });
  const hosp = theme.factions.map((_, f) => hospital(state, theme, f).dugout);
  out.news.push({ day, h: hosp.every(Boolean) ? 'The hospitals' : hosp.some(Boolean) ? 'Hospitals and aid posts' : 'The aid posts', text: lines.join(' '), kind: 'hospital', routine: true });

  // denní metriky (ladění, upozornění v ostrém provozu)
  out.stats = { day, balance: cfg.balance ?? 1, sides: stats };
  state.battle.stats = [...(state.battle.stats || []), out.stats].slice(-60);
  return out;
}

// pro web: stavby, lůžka a nosítka se jmény, raněnými v zákopu, pokrytí mediky, stav drátu
function wiringParty(state, f) {
  // úsek → [handle]: kdo se přihlásil WIRE na příští noc (a není těžce raněný); web ho ukáže u drátu jeho úseku při práci
  const out = {};
  for (const id of state.wiring?.open?.ids || []) {
    const s = state.soldiers.find((x) => x.id === id);
    if (s && s.faction === f && s.status !== 'fallen' && (!s.wound || s.wound.sev === 'light')) (out[s.sector] ??= []).push(s.handle);
  }
  return out;
}

export function battlePublic(state, theme) {
  if (!B(theme)) return null;
  // před prvním tahem s bojem: prázdná obvaziště (web je má ukázat hned), stav se tu nemění
  if (!state.battle) state = { ...state, battle: { sides: theme.factions.map(() => ({ built: {}, beds: [], wire: {} })) } };
  return theme.factions.map((_, f) => {
    const side = state.battle.sides[f];
    const H = hospital(state, theme, f);
    const m = medicCover(state, theme, f);
    const who = (s) => ({ handle: s.handle, sev: s.wound.sev, since: s.wound.day });
    const wnd = state.soldiers.filter((s) => s.faction === f && isWounded(s));
    const wire = Object.values(side.wire);
    return {
      built: side.built, hospital: H,
      beds: side.beds.map((id) => state.soldiers.find((s) => s.id === id)).filter((s) => s && isWounded(s)).map(who),
      stretchers: wnd.filter((s) => s.wound.place === 'stretcher').map(who),
      trench: wnd.filter((s) => s.wound.place === 'trench' && s.wound.sev !== 'light').map(who),
      walking: wnd.filter((s) => s.wound.sev === 'light').length,
      medics: { supply: Math.round(m.supply * 10) / 10, demand: m.demand, cover: Math.round(m.cover * 100) / 100 },
      wire: wire.length ? Math.round((wire.reduce((a, b) => a + b, 0) / wire.length) * 100) / 100 : null,
      wireBy: side.wire, // úsek → 0..1 (web kreslí drát celý / potrhaný / díru)
      party: wiringParty(state, f), // úsek → počet lidí z wiring party (přihlášení na příští noc + kdo byl venku minulou noc)
    };
  });
}
