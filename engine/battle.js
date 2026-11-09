// Denní boj na frontě, medici v poli, nemocnice a ostnatý drát (návrh: docs/BATTLE.md).
//
// Každý den před zápisy do deníků:
//  1) zásahy: voják v linii dostane zásah s pravděpodobností hit × linie × nebezpečí × krytí × zkušenost;
//     závažnost lehké / těžké / kritické, výdrž posouvá k lehčímu. Zásah sám nikdy nezabíjí.
//  2) medici: každý raněný spotřebuje práci 2 mediků (theme.battle.medicWork). Pokrytí c = práce mediků / potřeba.
//     Nedostatek zvyšuje riziko zhoršení, zpomaluje léčení a snižuje šanci přežít.
//  3) lůžka: těžce a kriticky ranění potřebují lůžko (kritičtí mají přednost). Bez stavby je jen obvaziště.
//     Kdo se nevejde, čeká na nosítkách: těžký se může zhoršit, kritický přečká nejvýš jednu noc.
//  4) drát: výdrž po sektorech, trhá ho boj a dělostřelectvo, ženisté ho opravují.
//  Bombardování (po výhře v závodě, activeBarrage): každý den dopadne na theme.battle.shell.sectors sektorů poražené strany.
//  Tam má každý voják vysokou šanci na zásah, střepiny zraňují tíž, granát nebere ohled na nováčky a drát v sektoru roztrhá.
//  Zbytek poražené strany má zvýšené nebezpečí (barrage). Vede to k plné nemocnici, přetíženým medikům a padlým.
// Stavby (nemocniční dugout – každý další přidá 4 lůžka, pytle, drát) se stavějí jen hlasováním frakce (build v možnosti hlasování).
//
// state.battle = { sides: [{ built: { id: počet }, beds: [soldierId], wire: { sector: 0..1 } }] }
// voják: s.wound = { sev: 'light'|'heavy'|'crit', day, wait, bed, bedDay }, s.tough (1–5), s.scars, s.treated (medik), s.lastCrit

import { rngFor } from './rng.js';
import { eventEntry } from './story.js';
import { activeBarrage } from './race.js';
import { fallSoldier } from './soldier.js';

const B = (theme) => theme.battle;
const short = (theme, f) => theme.factions[f].name.replace(/^The /, '');

export function ensureBattle(state, theme) {
  if (!B(theme)) return null;
  state.battle ??= { sides: theme.factions.map(() => ({ built: {}, beds: [], wire: {} })) };
  return state.battle;
}

const count = (side, id) => side.built[id] || 0;

// nemocnice strany podle staveb: lůžka, péče (násobek léčení) a úmrtnost kritických na lůžku
export function hospital(state, theme, f) {
  const cfg = B(theme);
  const side = ensureBattle(state, theme).sides[f];
  const b = cfg.buildings;
  // bez dugoutu jen obvaziště; každý postavený nemocniční dugout přidá svá lůžka (žádná rozšíření, jen další dugouty)
  const n = count(side, 'dugout');
  if (!n) return { name: cfg.aidPost.name, dugout: false, dugouts: 0, beds: cfg.aidPost.beds, care: cfg.aidPost.care, critDie: cfg.aidPost.critDie };
  const d = b.dugout;
  return { name: d.name, dugout: true, dugouts: n, beds: n * d.beds, care: d.care, critDie: d.critDie };
}

// postavit stavbu (výsledek hlasování); vrací text do kroniky nebo null
export function build(state, theme, f, id) {
  const def = B(theme)?.buildings?.[id];
  if (!def) return null;
  const side = ensureBattle(state, theme).sides[f];
  if (def.requires && !count(side, def.requires)) return null;
  if (def.max && count(side, id) >= def.max) return null;
  side.built[id] = count(side, id) + 1;
  if (def.wire) for (const k of Object.keys(side.wire)) side.wire[k] = Math.min(1, side.wire[k] + def.wire);
  return `${short(theme, f)}: ${def.done || def.name}`;
}

export function canBuild(state, theme, f, id) {
  const def = B(theme)?.buildings?.[id];
  if (!def) return false;
  const side = ensureBattle(state, theme).sides[f];
  return !(def.requires && !count(side, def.requires)) && !(def.max && count(side, id) >= def.max);
}

const isWounded = (s) => s.status !== 'fallen' && !!s.wound;
const toughOf = (s) => (s.tough ??= 1 + Math.floor(rngFor(s.id, 'tough', s.generation || 1)() * 4)); // 1–4, jizvy až 5 (každá generace jiná)

// práce mediků a potřeba (pro web i pro výpočet)
export function medicCover(state, theme, f, busy = new Set()) {
  const cfg = B(theme);
  let supply = 0;
  for (const s of state.soldiers) {
    if (s.faction !== f || s.archetype !== 'medic' || busy.has(s.id)) continue;
    if (s.status !== 'active') continue;
    const vet = (s.treated || 0) >= cfg.veteranMedic.treated ? cfg.veteranMedic.work : 1;
    supply += vet * (s.wound?.sev === 'light' ? 0.5 : 1);
  }
  const wounded = state.soldiers.filter((s) => s.faction === f && isWounded(s)).length;
  const demand = cfg.medicWork * wounded;
  return { supply, demand, wounded, cover: demand ? Math.min(1, supply / demand) : 1 };
}

function sectorsOf(state, f) {
  return [...new Set(state.soldiers.filter((s) => s.faction === f && s.sector).map((s) => s.sector))];
}

function die(s, day, kind, theme, story, ev, today) {
  const text = ev('fallen', eventEntry(kind, s, day, theme, story, {}, today));
  fallSoldier(s, day, kind === 'diedNoBed' ? 'nobed' : 'wounds');
  return text;
}

// ctx: { dangerOf(s) → násobek nebezpečí, careOf(s) → násobek léčení (Calvary Farm, rozkazy), busy: Set (výprava) }
export function battleTick(state, theme, story, day, ctx = {}) {
  const cfg = B(theme);
  const out = { events: [], news: [], ids: new Set() };
  if (!cfg) return out;
  ensureBattle(state, theme);
  const busy = ctx.busy || new Set();
  const ev = (s, type, text) => {
    out.events.push({ type, handle: s.handle, faction: s.faction, text });
    out.ids.add(s.id);
    s.record.push([day, text]);
    return text;
  };
  const barrage = activeBarrage(state, day);
  const today = new Set(); // šablony použité dnes (ať se ve stejném dni neopakují)
  // sektory pod palbou dnes (deterministicky podle dne)
  const shelled = new Set();
  if (barrage && cfg.shell) {
    const secs = sectorsOf(state, barrage.target).sort();
    const r = rngFor(theme.id, 'shell', day);
    while (shelled.size < Math.min(cfg.shell.sectors, secs.length)) shelled.add(secs[Math.floor(r() * secs.length)]);
  }
  const shellHits = [];

  // převod starých raněných (před bojem existoval jen stav wounded bez detailu)
  for (const s of state.soldiers) {
    if (s.status === 'wounded' && !s.wound) s.wound = { sev: 'heavy', day, wait: 0 };
  }

  // 1) zásahy
  for (const s of state.soldiers) {
    if (s.status !== 'active' || s.wound || busy.has(s.id)) continue;
    const side = state.battle.sides[s.faction];
    const rand = rngFor(s.id, 'battle', day);
    const service = day - (s.enlisted ?? day);
    const wire = side.wire[s.sector] ?? (side.wire[s.sector] = cfg.wire.start);
    const underShells = barrage?.target === s.faction && shelled.has(s.sector);
    const p = underShells ? cfg.shell.hit * (cfg.line[s.line] ?? 1) * (1 - cfg.buildings.sandbags.cover * count(side, 'sandbags')) : cfg.hit * (cfg.line[s.line] ?? 1) * (ctx.dangerOf?.(s) ?? 1)
      * (barrage?.target === s.faction ? cfg.barrage : 1)
      * (1 - cfg.buildings.sandbags.cover * count(side, 'sandbags'))
      * (1 - cfg.wire.cover * wire)
      * (1 - cfg.experience * Math.min(1, service / cfg.experienceDays));
    if (rand() >= p) continue;
    const sevT = underShells ? cfg.shell.severity : cfg.severity;
    let r = rand() + cfg.toughShift * (toughOf(s) - 2);
    let sev = r > sevT.light ? 'light' : r > sevT.heavy ? 'heavy' : 'crit';
    // kritický zásah ne v prvních dnech služby (granát ale nováčky nešetří) a ne dvakrát za týden
    if (sev === 'crit' && ((service < cfg.newbieDays && !underShells) || (s.lastCrit != null && day - s.lastCrit < cfg.critCooldown))) sev = 'heavy';
    if (underShells) shellHits.push(s);
    if (sev === 'crit') s.lastCrit = day;
    s.wound = { sev, day, wait: 0, ...(underShells ? { shell: true } : {}) };
    s.woundsTaken = (s.woundsTaken || 0) + 1;
    if (sev !== 'light') s.status = 'wounded';
    const kind = { light: 'hitLight', heavy: 'hitHeavy', crit: 'hitCrit' }[sev];
    const shellKind = underShells && story[`shell${kind.slice(3)}`] ? `shell${kind.slice(3)}` : kind; // shellLight / shellHeavy / shellCrit
    ev(s, sev === 'light' ? 'hit' : 'wounded', eventEntry(shellKind, s, day, theme, story, {}, today));
  }

  theme.factions.forEach((_, f) => {
    const side = state.battle.sides[f];
    const H = hospital(state, theme, f);
    const { cover: c } = medicCover(state, theme, f, busy);
    const care = (s) => H.care * (ctx.careOf?.(s) ?? 1);
    const mine = state.soldiers.filter((s) => s.faction === f && isWounded(s));

    // 2) lůžka: kritičtí první, pak podle toho, kdo čeká déle (znovu i na konci dne, když se lůžko uvolní)
    const admit = (late) => {
      side.beds = side.beds.filter((id) => state.soldiers.some((s) => s.id === id && s.status !== 'fallen' && s.wound?.bed));
      const queue = state.soldiers.filter((s) => s.faction === f && isWounded(s) && s.wound.sev !== 'light' && !s.wound.bed)
        .sort((a, b) => (a.wound.sev === 'crit' ? 0 : 1) - (b.wound.sev === 'crit' ? 0 : 1) || a.wound.day - b.wound.day);
      for (const s of queue) {
        if (side.beds.length >= H.beds) break;
        s.wound.bed = true;
        s.wound.bedDay = late ? day + 1 : day; // přijatý večer se léčí od zítřka
        side.beds.push(s.id);
        if (s.wound.day !== day || s.wound.wait) ev(s, 'admitted', eventEntry('admitted', s, day, theme, story, { hospital: H.name.toLowerCase() }, today));
      }
    };
    admit(false);

    // 3) průběh zranění
    for (const s of mine) {
      const w = s.wound;
      const rand = rngFor(s.id, 'care', day);
      if (w.sev === 'light') {
        if (w.day === day) continue;
        if (rand() < cfg.lightWorsen * (1 - c)) {
          w.sev = 'heavy';
          s.status = 'wounded';
          ev(s, 'wounded', eventEntry('worsened', s, day, theme, story, {}, today));
        } else if (rand() < cfg.lightHeal.base + cfg.lightHeal.cover * c) {
          s.wound = null;
          ev(s, 'patched', eventEntry('patched', s, day, theme, story, {}, today));
        }
      } else if (!w.bed) {
        // nosítka před nemocnicí
        w.wait = (w.wait || 0) + 1;
        if (w.sev === 'heavy') {
          // čerstvě raněný ani nováček (mimo zásah granátem) se na nosítkách na kritický stav nezhorší
          const fresh = w.day === day || (day - (s.enlisted ?? day) < cfg.newbieDays && !w.shell);
          if (!fresh && rand() < cfg.stretcher.heavyWorsen * (1.2 - c)) {
            w.sev = 'crit';
            w.wait = 0;
            s.lastCrit = day;
            ev(s, 'wounded', eventEntry('worsened', s, day, theme, story, {}, today));
          } else if (w.wait === 1) ev(s, 'stretcher', eventEntry('stretcher', s, day, theme, story, {}, today));
        } else if (w.wait >= 2 || rand() > cfg.stretcher.critSurvive + cfg.stretcher.critCover * c) {
          die(s, day, 'diedNoBed', theme, story, (t, x) => ev(s, t, x), today);
          out.news.push({ day, h: `No bed for ${s.name}`, text: `The ${short(theme, f)} ${H.dugout ? 'dugout' : 'aid post'} was full. @${s.handle} died on a stretcher outside, waiting for a bed.` });
        } else if (w.wait === 1) ev(s, 'stretcher', eventEntry('stretcher', s, day, theme, story, {}, today));
      } else {
        // na lůžku
        const days = day - w.bedDay + 1;
        if (w.sev === 'crit') {
          if (days === 1 && rand() < H.critDie * (1.5 - 0.5 * c)) {
            die(s, day, 'diedInBed', theme, story, (t, x) => ev(s, t, x), today);
          } else if (days >= cfg.critDays) {
            w.sev = 'heavy';
            ev(s, 'stabilized', eventEntry('stabilized', s, day, theme, story, {}, today));
          }
        } else if (days >= cfg.heavyMinDays && rand() < cfg.heal * care(s) * (0.5 + 0.5 * c)) {
          s.wound = null;
          s.status = 'active';
          s.scars = (s.scars || 0) + 1;
          s.tough = Math.min(5, toughOf(s) + 1); // přežité těžké zranění: jizva a víc výdrže
          ev(s, 'recovered', eventEntry('recovered', s, day, theme, story, {}, today));
        }
      }
    }
    admit(true);

    // práce mediků: každý ošetřený raněný připíše zkušenost jednomu z mediků
    const medics = state.soldiers.filter((s) => s.faction === f && s.archetype === 'medic' && s.status === 'active' && !busy.has(s.id));
    if (medics.length) {
      for (const s of state.soldiers.filter((x) => x.faction === f && isWounded(x))) {
        const m = medics[Math.floor(rngFor(s.id, 'medic', day)() * medics.length)];
        m.treated = (m.treated || 0) + 1;
      }
    }

    // 4) drát: opotřebení, dělostřelectvo, opravy ženistů
    for (const sec of sectorsOf(state, f)) side.wire[sec] ??= cfg.wire.start;
    for (const sec of Object.keys(side.wire)) {
      let v = side.wire[sec] - cfg.wire.decay - (barrage?.target === f ? cfg.wire.barrage : 0) - (barrage?.target === f && shelled.has(sec) ? cfg.shell.wire : 0);
      const sappers = state.soldiers.filter((s) => s.faction === f && s.archetype === 'sapper' && s.status === 'active' && s.sector === sec && !busy.has(s.id)).length;
      v += cfg.wire.repair * sappers;
      side.wire[sec] = Math.round(Math.max(0, Math.min(1, v)) * 100) / 100;
    }
  });

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

  // přehled pro Gazette: lůžka a nosítka
  const lines = theme.factions.map((_, f) => {
    const H = hospital(state, theme, f);
    const inBed = state.battle.sides[f].beds.length;
    const waiting = state.soldiers.filter((s) => s.faction === f && s.wound && s.wound.sev !== 'light' && !s.wound.bed && s.status !== 'fallen').length;
    const light = state.soldiers.filter((s) => s.faction === f && s.wound?.sev === 'light').length;
    const m = medicCover(state, theme, f, busy);
    return `${short(theme, f)}: ${H.dugout ? (H.dugouts > 1 ? `${H.dugouts} hospital dugouts` : 'hospital dugout') : 'aid post'} ${inBed}/${H.beds} beds${waiting ? `, ${waiting} on stretchers outside` : ''}, ${light} walking wounded, medics ${Math.round(m.supply * 10) / 10} for ${m.demand / B(theme).medicWork || 0} wounded.`;
  });
  out.news.push({ day, h: 'The aid posts', text: lines.join(' '), kind: 'hospital' });
  return out;
}

// pro web: stavby, lůžka se jmény, nosítka, pokrytí mediky, stav drátu
export function battlePublic(state, theme) {
  if (!B(theme) || !state.battle) return null;
  return theme.factions.map((_, f) => {
    const side = state.battle.sides[f];
    const H = hospital(state, theme, f);
    const m = medicCover(state, theme, f);
    const who = (s) => ({ handle: s.handle, sev: s.wound.sev, since: s.wound.day });
    const wire = Object.values(side.wire);
    return {
      built: side.built, hospital: H,
      beds: side.beds.map((id) => state.soldiers.find((s) => s.id === id)).filter(Boolean).map(who),
      stretchers: state.soldiers.filter((s) => s.faction === f && s.wound && s.wound.sev !== 'light' && !s.wound.bed && s.status !== 'fallen').map(who),
      walking: state.soldiers.filter((s) => s.faction === f && s.wound?.sev === 'light').length,
      medics: { supply: Math.round(m.supply * 10) / 10, demand: m.demand, cover: Math.round(m.cover * 100) / 100 },
      wire: wire.length ? Math.round((wire.reduce((a, b) => a + b, 0) / wire.length) * 100) / 100 : null,
    };
  });
}
