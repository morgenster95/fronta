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
import { activeBarrage } from './race.js';
import { orderStretchers, orderMedics, orderGuns, orderBarrage } from './orders.js';
import { fallSoldier, addEntry } from './soldier.js';

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
  if (!n) return { name: a.name, dugout: false, dugouts: 0, beds: a.beds, stretchers: sc(a.stretchers), care: a.care, critRisk: a.critRisk };
  return { name: d.name, dugout: true, dugouts: n, beds: n * d.beds, stretchers: sc(a.stretchers + n * (d.stretchers || 0)), care: d.care, critRisk: d.critRisk };
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

export function canBuild(state, theme, f, id) {
  const def = B(theme)?.buildings?.[id];
  if (!def) return false;
  const side = ensureBattle(state, theme).sides[f];
  return !(def.requires && !count(side, def.requires)) && !(def.max && count(side, id) >= def.max);
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
  const ev = (s, type, text) => {
    out.events.push({ type, handle: s.handle, faction: s.faction, text });
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
  const coverOf = (s) => {
    const side = state.battle.sides[s.faction];
    const wire = side.wire[s.sector] ?? (side.wire[s.sector] = cfg.wire.start);
    const service = day - (s.enlisted ?? day);
    return (cfg.line[s.line] ?? 1) * (1 - cfg.buildings.sandbags.cover * count(side, 'sandbags')) * (1 - cfg.wire.cover * wire)
      * (1 - cfg.experience * Math.min(1, service / cfg.experienceDays)) * (ctx.exposedOf?.(s) ?? 1);
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
  if (WC && wo && wo.day < day) {
    const vol = wo.ids.map((id) => state.soldiers.find((s) => s.id === id)).filter((s) => s && able(s));
    const outside = new Set(vol.map((s) => s.id));
    const watch = theme.factions.map((_, f) => lineup(state, f, (s) => able(s) && s.line === 'front' && !outside.has(s.id)));
    const wk = WC.weather?.[state.weather] ?? 1;
    const res = theme.factions.map(() => ({ n: 0, yards: 0, hit: [], secs: {} }));
    for (const s of vol) {
      const f = s.faction, side = state.battle.sides[f];
      let sec = s.sector;
      if ((side.wire[sec] ?? cfg.wire.start) >= (WC.full ?? 0.95)) sec = Object.entries(side.wire).sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? sec;
      const fire = near(watch[1 - f], X(s), range).reduce((a, m) => a + role(cfg, m, 'fire'), 0);
      const sap = s.archetype === 'sapper';
      const p = Math.min(WC.max ?? 1, (WC.base + WC.perFire * fire) * wk * (barrage?.target === f ? WC.barrage ?? 1 : 1) * (sap ? WC.sapperRisk ?? 1 : 1));
      const add = (sap ? WC.sapperRepair : WC.repair) * mult(theme, s);
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
    }
    if (vol.length) {
      const nm = (f) => short(theme, f);
      const who = (h) => `${h.name} (@${h.handle})${h.sev === 'light' ? '' : h.sev === 'heavy' ? ', badly' : ', gravely'}`;
      const parts = theme.factions.map((_, f) => (res[f].n ? `${res[f].n} ${nm(f)} soldier${res[f].n > 1 ? 's' : ''} put up ${res[f].yards} yards of wire` : null)).filter(Boolean);
      const hit = theme.factions.flatMap((_, f) => res[f].hit);
      const home = theme.factions.map((_, f) => f).filter((f) => !res[f].n);
      out.news.push({
        day, kind: 'wiring', h: 'Wiring parties in no man\'s land',
        text: `Last night ${parts.join(', and ')}.` +
          (home.length === 1 ? ` The ${nm(home[0])} stayed in the trench and kept every rifle on the parapet.` : '') +
          (hit.length ? ` Caught in the flares: ${hit.map(who).join(', ')}.` : ' Everyone came back.'),
        wiring: res,
      });
    }
    state.wiring.nights = [...(state.wiring.nights || []), { day, media: wo.media, ids: wo.ids.length, sides: res.map((r) => ({ n: r.n, yards: r.yards, hit: r.hit.length, bad: r.hit.filter((h) => h.sev !== 'light').length, secs: r.secs })) }].slice(-60);
    state.wiring.open = null;
  }

  // 1) palba hráčů
  const front = theme.factions.map((_, f) => lineup(state, f, (s) => able(s) && s.line === 'front'));
  const targetsOf = theme.factions.map((_, f) => lineup(state, f, (s) => able(s) && (cfg.line[s.line] ?? 0) > 0));
  const shooters = theme.factions.flatMap((_, f) => front[f]);
  const taken = new Set(); // každý cíl nejvýš jeden zásah za den
  const fireLog = [];
  for (const s of shooters) {
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
    const p = fire * mult(theme, s) * (1 + lead) * (1 - suppress) * sat * (ctx.fireOf?.(s) ?? 1);
    stats[f].shots++;
    const rand = rngFor(s.id, 'fire', day);
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
    const sev = severity(t, R[src].severity, rand, false);
    taken.add(t.id);
    wound(t, sev, { by: { handle: s.handle, name: s.name, role: s.archetype, faction: f } });
    // smrtelný zásah kulkou (roles.<role>.kill nebo roles.kill): kritický zásah může zabít na místě
    const kill = R[s.archetype]?.kill ?? R.kill ?? 0;
    if (sev === 'crit' && kill && rand() < kill) t.wound.outright = 'shot';
    stats[f].hits.fire[s.archetype] = (stats[f].hits.fire[s.archetype] || 0) + 1;
    s.hits = (s.hits || 0) + 1;
    s.hitsBy = { ...(s.hitsBy || {}), [sev]: ((s.hitsBy || {})[sev] || 0) + 1 };
    gainXp(theme, s, cfg.xp.gain.hit[sev] * (mates.some((m) => m.archetype === 'officer') ? 1 + R.officer.xp : 1));
    const by = ` Shot by ${s.name} of the ${short(theme, f)} (@${s.handle}).`;
    const bk = { light: 'bulletLight', heavy: 'bulletHeavy', crit: 'bulletCrit' }[sev];
    ev(t, sev === 'light' ? 'hit' : 'wounded', eventEntry(story[bk] ? bk : hitKind(sev), t, day, theme, story, {}, today) + by);
    fireLog.push({ by: s.handle, byF: f, role: s.archetype, at: t.handle, sev });
    ev(s, 'shot', eventEntry('shotHit', s, day, theme, story, { target: t.name, targetHandle: t.handle, how: { light: 'grazed', heavy: 'badly wounded', crit: 'gravely wounded' }[sev] }, today));
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
    const underMine = !!mineAt.get(s.faction)?.has(s.sector); // mina vybuchla pod jeho úsekem
    const underShells = (barrage?.target === s.faction && shelled.has(s.sector)) || underMine;
    const sig = share(near(signallers[s.faction], X(s), range).length, R.signaller.covers, near(targetsOf[s.faction], X(s), range).length);
    const own = R.signaller.counter * sig;
    // roles.signaller.counterShell: spojař navádí protipalbu i proti bombardování (snižuje zásahy granátem v jeho okolí, podle pokrytí)
    const p = underMine ? cfg.mine.hit : underShells
      ? cfg.shell.hit * (cfg.line[s.line] ?? 1) * (1 - cfg.buildings.sandbags.cover * count(side, 'sandbags')) * (1 - (R.signaller.counterShell || 0) * sig) * (ctx.shellOf?.(s) ?? 1)
      : cfg.hit * coverOf(s) * (ctx.dangerOf?.(s) ?? 1) * (barrage?.target === s.faction ? cfg.barrage : 1) * (1 - own); // spojař poblíž: telefon k vlastnímu dělostřelectvu, protipalba
    if (rand() >= p) continue;
    bgHit(s, severity(s, underShells ? cfg.shell.severity : cfg.severity, rand, underShells), underShells);
    // přímý zásah granátem (battle.shell.kill): kritický zásah pod granáty může zabít na místě, lůžko ani medik nepomůže
    if (underShells && s.wound?.sev === 'crit' && cfg.shell.kill && rand() < cfg.shell.kill) s.wound.outright = 'shell';
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
  const die = (s, kind, cause, vars = {}) => {
    const f = s.faction;
    if (deathsToday[f] >= cap[f]) { stats[f].capped++; return false; } // pojistka: přežije do zítřka
    deathsToday[f]++;
    stats[f].deaths[cause]++;
    const by = s.wound?.by;
    ev(s, 'fallen', eventEntry(kind, s, day, theme, story, vars, today) + (cause === 'shot' && by ? ` Shot by ${by.name} of the ${short(theme, by.faction)} (@${by.handle}).` : ''));
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
      const key = how === 'shot' ? 'killedShot' : 'killedShell';
      die(s, story[key] ? key : 'diedNoBed', how, by ? { target: by.name, targetHandle: by.handle, side: short(theme, by.faction) } : {});
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
    const dying = mine().filter((s) => s.wound.sev === 'crit' && s.wound.place !== 'bed').length;
    const faith = R.chaplain.faith * share(chaplains, R.chaplain.covers, dying);
    const lights = mine().filter((s) => s.wound.sev === 'light').sort((a, b) => X(a) - X(b));
    const patients = mine().filter((s) => s.wound.place !== 'bed').sort((a, b) => pri(a) - pri(b) || a.wound.day - b.wound.day);
    const need = patients.reduce((a, s) => a + needOf(cfg, s), 0);
    stats[f].cover = need ? Math.min(1, supply / need) : 1;
    const medics = state.soldiers.filter((s) => s.faction === f && s.archetype === 'medic' && s.status !== 'fallen' && !(s.wound && s.wound.sev !== 'light') && !busy.has(s.id));
    for (const s of patients) {
      const n = needOf(cfg, s);
      const g = n ? Math.min(1, supply / n) : 1;
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
        const worsen = C.worsen * (1 - g) * (cook ? 1 - cook.worsen : 1);
        if (!(day - (s.enlisted ?? day) < cfg.newbieDays) && rand() < worsen) {
          w.sev = 'heavy';
          w.place = null;
          ev(s, 'wounded', eventEntry('worsened', s, day, theme, story, {}, today));
        } else if (rand() < Math.min(1, C.heal * g * (ctx.healOf?.(s) ?? 1) + (cook ? cook.heal : 0) * (1 - g) + C.baseHeal)) {
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
          if (w.sev === 'crit') { w.sev = 'heavy'; ev(s, 'stabilized', eventEntry('stabilized', s, day, theme, story, {}, today)); }
        } else if (day - (w.bedDay ?? day) >= 2) {
          recover(s, 'recovered');
        }
      } else if (w.sev === 'heavy') {
        const trench = w.place === 'trench';
        const newbie = day - (s.enlisted ?? day) < cfg.newbieDays && !w.shell;
        if (!fresh && !newbie && rand() < C.worsen * (1 - g) * (trench ? C.trench : 1)) {
          w.sev = 'crit';
          s.lastCrit = day;
          ev(s, 'wounded', eventEntry('worsened', s, day, theme, story, {}, today));
        } else if (!fresh && day - w.day >= C.minDays && rand() < C.heal * g * (trench ? 0.5 : 1) * (ctx.healOf?.(s) ?? 1)) {
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
    for (const sec of Object.keys(side.wire)) {
      let v = side.wire[sec] - cfg.wire.decay - (barrage?.target === f ? cfg.wire.barrage : 0) - (barrage?.target === f && shelled.has(sec) ? cfg.shell.wire : 0);
      for (const sp of state.soldiers.filter((s) => s.faction === f && s.archetype === 'sapper' && able(s) && s.sector === sec)) {
        const add = R.sapper.repair * mult(theme, sp);
        if (v < 1) gainXp(theme, sp, cfg.xp.gain.repair * Math.min(1, (1 - v) / add));
        v += add;
      }
      side.wire[sec] = Math.round(Math.max(0, Math.min(1, v)) * 100) / 100;
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
      return WN.side.replace('{side}', short(theme, f)).replace('{pct}', Math.round(avg * 100)).replace('{cause}', cause)
        .replace('{gaps}', v.filter((x) => x < 0.3).length).replace('{secs}', v.length);
    }).filter(Boolean);
    if (sides.length) out.news.push({ day, kind: 'wire', h: WN.h, text: [...sides, WN.why, WN.call].filter(Boolean).join(' ') });
  }
  // Gazette: jen čísla ztrát po stranách a jména padlých (každý zásah a každé zranění vidí hráč u svého vojáka)
  {
    const nameOf = (e) => {
      const x = state.soldiers.find((s) => s.handle === e.handle);
      const nm = String(x?.name || '').replace(/"[^"]*"\s*/g, '').trim(); // nástupce se dosazuje až po tahu boje, jméno padlého je ještě u vojáka
      return nm ? `${nm} (@${e.handle})` : `@${e.handle}`;
    };
    const parts = theme.factions.map((_, f) => {
      const v = stats[f].sev, hit = v.light + v.heavy + v.crit;
      const dead = out.events.filter((e) => e.type === 'fallen' && e.faction === f);
      const split = [v.light && `${v.light} grazed`, v.heavy && `${v.heavy} badly`, v.crit && `${v.crit} gravely wounded`].filter(Boolean).join(', ');
      return `${short(theme, f)}: ${hit ? `${hit} hit (${split})` : 'nobody hit'}${dead.length ? `; ${dead.length} fallen: ${dead.map(nameOf).join(', ')}` : '; no one fell'}.`;
    });
    out.news.push({ day, kind: 'fire', routine: true, h: 'Casualties of the day', text: parts.join(' ') });
  }
  const lines = theme.factions.map((_, f) => {
    const H = hospital(state, theme, f), st = stats[f];
    return `${short(theme, f)}: ${H.dugout ? 'hospital' : 'aid post'} ${st.beds}/${H.beds} beds, ${st.stretchers}/${H.stretchers} stretchers` +
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
  const out = {};
  const add = (sec, n = 1) => { if (sec) out[sec] = (out[sec] || 0) + n; };
  for (const id of state.wiring?.open?.ids || []) {
    const s = state.soldiers.find((x) => x.id === id);
    if (s && s.faction === f && s.status === 'active') add(s.sector);
  }
  const last = (state.wiring?.nights || []).at(-1);
  if (last && last.day >= (state.day ?? 0) - 1) for (const [sec, n] of Object.entries(last.sides?.[f]?.secs || {})) add(sec, n);
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
