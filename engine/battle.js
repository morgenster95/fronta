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
import { fallSoldier } from './soldier.js';

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
  // care = násobek hojení těžce raněného proti nosítkům s plnou péčí (≥ 1), critRisk = násobek rizika smrti kritického za noc
  // proti nosítkům (≤ 1): lůžko je tak VŽDY lepší než nosítka, nemocnice lepší než obvaziště
  if (!n) return { name: a.name, dugout: false, dugouts: 0, beds: a.beds, stretchers: a.stretchers, care: a.care, critRisk: a.critRisk };
  return { name: d.name, dugout: true, dugouts: n, beds: n * d.beds, stretchers: a.stretchers + n * (d.stretchers || 0), care: d.care, critRisk: d.critRisk };
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
  return supply;
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
    s.record.push([day, text]);
    return text;
  };
  const barrage = activeBarrage(state, day);
  const stats = theme.factions.map(() => ({
    hits: { bg: 0, shell: 0, fire: {} }, sev: { light: 0, heavy: 0, crit: 0 }, deaths: { nobed: 0, nocare: 0, wounds: 0 },
    beds: 0, stretchers: 0, trench: 0, cover: 1, capped: 0, shots: 0,
  }));
  const shelled = new Set();
  if (barrage && cfg.shell) {
    const secs = sectorsOf(state, barrage.target).sort();
    const r = rngFor(theme.id, 'shell', day);
    while (shelled.size < Math.min(cfg.shell.sectors, secs.length)) shelled.add(secs[Math.floor(r() * secs.length)]);
  }
  const shellHits = [];

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
      * (1 - cfg.experience * Math.min(1, service / cfg.experienceDays));
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
    const lead = mates.some((m) => m.archetype === 'officer') ? R.officer.lead : mates.some((m) => m.archetype === 'runner') ? R.runner.relay : 0;
    const mgs = near(front[e], X(s), range).filter((m) => m.archetype === 'machinegunner').length;
    const suppress = Math.min(R.machinegunner.suppressMax, mgs * R.machinegunner.suppress);
    const p = fire * mult(theme, s) * (1 + lead) * (1 - suppress) * (ctx.fireOf?.(s) ?? 1);
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
  const maxOf = (f) => (!D ? Infinity : barrage?.target === f && shelled.size ? D.shellMax ?? Infinity : D.max ?? Infinity);
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
    const underShells = barrage?.target === s.faction && shelled.has(s.sector);
    const own = near(signallers[s.faction], X(s), range).length ? R.signaller.counter : 0;
    const p = underShells
      ? cfg.shell.hit * (cfg.line[s.line] ?? 1) * (1 - cfg.buildings.sandbags.cover * count(side, 'sandbags'))
      : cfg.hit * coverOf(s) * (ctx.dangerOf?.(s) ?? 1) * (barrage?.target === s.faction ? cfg.barrage : 1) * (1 - own); // spojař poblíž: telefon k vlastnímu dělostřelectvu, protipalba
    if (rand() >= p) continue;
    bgHit(s, severity(s, underShells ? cfg.shell.severity : cfg.severity, rand, underShells), underShells);
  }
  // klidný den bez raněných nebývá: aspoň D.min zásahů z pozadí na stranu (vybráni podle vystavení, přední linie častěji)
  if (D?.min) theme.factions.forEach((_, f) => {
    const pool = lineup(state, f, (s) => able(s) && (cfg.line[s.line] ?? 0) > 0);
    const r = rngFor(theme.id, `floor${f}`, day);
    while (newToday(f) < D.min && pool.length) {
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
  const die = (s, kind, cause) => {
    const f = s.faction;
    if (deathsToday[f] >= cap[f]) { stats[f].capped++; return false; } // pojistka: přežije do zítřka
    deathsToday[f]++;
    stats[f].deaths[cause]++;
    ev(s, 'fallen', eventEntry(kind, s, day, theme, story, {}, today));
    fallSoldier(s, day, cause === 'wounds' ? 'wounds' : 'nobed');
    return true;
  };

  theme.factions.forEach((_, f) => {
    const side = state.battle.sides[f];
    const H = hospital(state, theme, f);
    const mine = () => state.soldiers.filter((s) => s.faction === f && isWounded(s));
    const pri = (s) => ({ crit: 0, heavy: 1, light: 2 })[s.wound.sev];
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
      for (const s of mine()) if (s.wound.sev === 'light' && !s.wound.place) s.wound.place = 'trench';
    };
    place();

    // práce mediků podle závažnosti: kritičtí, těžce, lehce (stejná skupina: kdo je raněný déle)
    let supply = medicWork(state, theme, f, busy);
    const cooks = lineup(state, f, (s) => s.archetype === 'cook' && s.status !== 'fallen' && !(s.wound && s.wound.sev !== 'light'));
    const chaplain = state.soldiers.some((s) => s.faction === f && s.archetype === 'chaplain' && s.status !== 'fallen' && !(s.wound && s.wound.sev !== 'light'));
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
      const g = w.place === 'bed' ? 1 : (w.care ?? 0);
      const C = cfg.care[w.sev];
      const fresh = w.day === day;
      if (w.sev === 'light') {
        if (fresh) continue; // ošetří se a druhý den je v pořádku
        const cook = near(cooks, X(s), range).length ? R.cook : null;
        const worsen = C.worsen * (1 - g) * (cook ? 1 - cook.worsen : 1);
        if (!(day - (s.enlisted ?? day) < cfg.newbieDays) && rand() < worsen) {
          w.sev = 'heavy';
          w.place = null;
          ev(s, 'wounded', eventEntry('worsened', s, day, theme, story, {}, today));
        } else if (rand() < Math.min(1, C.heal * g + (cook ? cook.heal : 0) * (1 - g) + C.baseHeal)) {
          s.wound = null;
          s.status = 'active';
          ev(s, 'patched', eventEntry('patched', s, day, theme, story, {}, today));
        }
      } else if (w.place === 'bed') {
        // na lůžku: plná péče místa (medika nepotřebuje); stejný vzorec jako na nosítkách, jen s lepšími násobky místa
        if (w.sev === 'crit') {
          if (rand() < C.dieBase * H.critRisk) { if (die(s, 'diedInBed', 'wounds')) continue; }
          w.critDays = (w.critDays || 0) + 1;
          if (w.critDays >= C.stabilizeBed) { w.sev = 'heavy'; ev(s, 'stabilized', eventEntry('stabilized', s, day, theme, story, {}, today)); }
        } else if (!fresh && day - w.day >= cfg.care.heavy.minDays && rand() < cfg.care.heavy.heal * H.care * (ctx.careOf?.(s) ?? 1)) {
          recover(s, 'recovered');
        }
      } else if (w.sev === 'heavy') {
        const trench = w.place === 'trench';
        const newbie = day - (s.enlisted ?? day) < cfg.newbieDays && !w.shell;
        if (!fresh && !newbie && rand() < C.worsen * (1 - g) * (trench ? C.trench : 1)) {
          w.sev = 'crit';
          s.lastCrit = day;
          ev(s, 'wounded', eventEntry('worsened', s, day, theme, story, {}, today));
        } else if (!fresh && day - w.day >= C.minDays && rand() < C.heal * g * (trench ? 0.5 : 1)) {
          recover(s, 'patchedStretcher');
        }
      } else {
        // kritický mimo lůžko: bez nosítek noc nepřežije, na nosítkách rozhoduje péče mediků
        if (w.place === 'trench') {
          if (die(s, 'diedNoBed', 'nobed')) continue;
        } else {
          const pDie = (C.dieBase + C.dieNoCare * (1 - g)) * (chaplain ? 1 - R.chaplain.faith : 1);
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
    out.news.push({
      day, kind: 'barrage', h: `The guns on ${barrage.name} fell on ${[...shelled].join(' and ')}`,
      text: `All day the ${short(theme, barrage.by)} guns pounded the ${short(theme, f)} sectors ${[...shelled].join(' and ')}. ` +
        `${shellHits.length ? `${shellHits.length} ${shellHits.length === 1 ? 'man was' : 'men were'} hit` : 'By some miracle nobody was hit'}` +
        `${bad.length ? `, badly: ${bad.join(', ')}` : ''}. The wire there is in shreds.`,
    });
  }
  // Gazette: kdo koho trefil přes drát
  if (fireLog.length) {
    const how = { light: 'grazed', heavy: 'badly wounded', crit: 'gravely wounded' };
    const roleName = (id) => theme.archetypes.find((a) => a.id === id)?.name.toLowerCase() ?? 'soldier';
    out.news.push({
      day, kind: 'fire', h: 'Across the wire',
      text: fireLog.map((x) => `@${x.by} (${short(theme, x.byF)} ${roleName(x.role)}) ${how[x.sev]} @${x.at}.`).join(' '),
    });
  }
  const lines = theme.factions.map((_, f) => {
    const H = hospital(state, theme, f), st = stats[f];
    return `${short(theme, f)}: ${H.dugout ? 'hospital' : 'aid post'} ${st.beds}/${H.beds} beds, ${st.stretchers}/${H.stretchers} stretchers` +
      `${st.trench ? `, ${st.trench} badly wounded still lying in the trench` : ''}, medics covering ${Math.round(st.cover * 100)}% of the wounded.`;
  });
  const hosp = theme.factions.map((_, f) => hospital(state, theme, f).dugout);
  out.news.push({ day, h: hosp.every(Boolean) ? 'The hospitals' : hosp.some(Boolean) ? 'Hospitals and aid posts' : 'The aid posts', text: lines.join(' '), kind: 'hospital' });

  // denní metriky (ladění, upozornění v ostrém provozu)
  out.stats = { day, balance: cfg.balance ?? 1, sides: stats };
  state.battle.stats = [...(state.battle.stats || []), out.stats].slice(-60);
  return out;
}

// pro web: stavby, lůžka a nosítka se jmény, raněnými v zákopu, pokrytí mediky, stav drátu
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
    };
  });
}
