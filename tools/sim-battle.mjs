// Vyzkoušení denního boje nanečisto na kopii SKUTEČNÉHO stavu. Nic neukládá, hra ani web se nemění.
//
//   node tools/sim-battle.mjs                       scénáře (každý 40× po 14 dnech) + cílová čísla (✓/⚠)
//   node tools/sim-battle.mjs --roles               navíc tabulka přínosu podpůrných rolí (simulace s rolí a bez ní)
//   node tools/sim-battle.mjs 2 --story             scénář 2 jednou, den po dni: kdo koho trefil, nosítka, padlí
//   node tools/sim-battle.mjs --set roles.sniper.fire=0.03 --set hit=0.012   zkusit jiná čísla (bez úpravy theme.json)
//   node tools/sim-battle.mjs --state cesta/state.json --days 21 --runs 100
// Každý běh má jiné kostky (ID vojáků s příponou běhu); soupiska, role, sektory a medici jsou skutečné.
import fs from 'node:fs';
import { loadTheme, loadState } from './lib.mjs';
import { dailyTick } from '../engine/roster.js';
import { build } from '../engine/battle.js';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const all = (k) => args.flatMap((a, i) => (a === k ? [args[i + 1]] : []));
const only = Number(args.find((a, i) => /^\d+$/.test(a) && !['--days', '--runs'].includes(args[i - 1])) || 0);
const DAYS = Number(opt('--days', 14));
const STORY = args.includes('--story');
const RUNS = STORY ? 1 : Number(opt('--runs', 40));
const { theme: base, story } = loadTheme();

// --set klíč=hodnota: klíč v theme.battle (např. roles.sniper.fire, hit, care.crit.dieNoCare)
function withSets(theme, sets) {
  const t = JSON.parse(JSON.stringify(theme));
  for (const s of sets) {
    const [k, v] = s.split('=');
    const path = k.replace(/^battle\./, '').split('.');
    let o = t.battle;
    for (const p of path.slice(0, -1)) o = o[p] ??= {};
    o[path.at(-1)] = isNaN(Number(v)) ? v : Number(v);
  }
  return t;
}
const theme = withSets(base, all('--set'));
const statePath = opt('--state', null);
const real = statePath ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : loadState(theme);
const H = 0, C = 1;
const short = (f) => theme.factions[f].name.replace(/^The /, '');

// nikdo zatím nemá nemocnici: všude jen obvaziště; win = kdo hned vyhraje závod (poražený 3 dny pod granáty)
const SCENARIOS = [
  { name: 'Klidná fronta (jen obvaziště)' },
  { name: 'Hegemony vyhraje závod, Concord 3 dny pod granáty' , win: H },
  { name: 'Concord vyhraje závod, Hegemony 3 dny pod granáty', win: C },
  { name: 'Klidná fronta, obě strany mají nemocnici (jen pro srovnání, zatím ji nikdo nemá)', hospital: [H, C] },
];

function setup(sc, run, th) {
  const s = JSON.parse(JSON.stringify(real));
  for (const x of s.soldiers) x.id = `${x.id}#${run}`;
  s.vote = null;
  delete s.battle;
  for (const f of sc.hospital || []) build(s, th, f, 'dugout');
  if (sc.win != null) {
    const R = th.race;
    s.victories = [...(s.victories || []), { id: 'sim', name: 'Verdel Ridge', faction: sc.win, day: s.day, hero: 'sim', from: s.day + 1, to: s.day + R.days, barrageTo: s.day + R.barrageDays, counts: [100, 60] }];
  }
  return s;
}

function simulate(sc, run, th, print) {
  const s = setup(sc, run, th);
  const n0 = th.factions.map((_, f) => s.soldiers.filter((x) => x.faction === f && x.status !== 'fallen').length);
  const m = th.factions.map(() => ({ fire: 0, bg: 0, shell: 0, light: 0, heavy: 0, crit: 0, dead: 0, names: [], trenchMax: 0, cover: 1, capped: 0, lightDays: 0 }));
  if (print) {
    const r = (f, a) => s.soldiers.filter((x) => x.faction === f && x.archetype === a).length;
    for (const f of [0, 1]) console.log(`${short(f)}: ${n0[f]} vojáků — střelci ${r(f, 'rifleman')}, kulomety ${r(f, 'machinegunner')}, odstřelovači ${r(f, 'sniper')}, medici ${r(f, 'medic')}, kuchaři ${r(f, 'cook')}, kaplani ${r(f, 'chaplain')}, spojaři ${r(f, 'signaller')}, ženisté ${r(f, 'sapper')}, runneři ${r(f, 'runner')}, důstojníci ${r(f, 'officer')}`);
    console.log('');
  }
  for (let d = 0; d < DAYS; d++) {
    const gens = new Map(s.soldiers.map((x) => [x.id, x.generation || 1]));
    const before = new Map(s.soldiers.map((x) => [x.id, x.record.length]));
    dailyTick(s, th, story);
    const day = s.day;
    const st = s.battle.stats.at(-1);
    const lines = [];
    th.factions.forEach((_, f) => {
      const a = st.sides[f], k = m[f];
      k.fire += Object.values(a.hits.fire).reduce((x, y) => x + y, 0); // zásahy, které strana UDĚLILA palbou
      k.bg += a.hits.bg; k.shell += a.hits.shell;
      k.light += a.sev.light; k.heavy += a.sev.heavy; k.crit += a.sev.crit;
      k.trenchMax = Math.max(k.trenchMax, a.trench); k.cover = Math.min(k.cover, a.cover); k.capped += a.capped;
      k.lightDays += s.soldiers.filter((x) => x.faction === f && x.wound?.sev === 'light').length;
    });
    for (const x of s.soldiers) {
      if ((x.generation || 1) > gens.get(x.id)) {
        m[x.faction].dead++;
        m[x.faction].names.push(x.handle);
        const p = x.fallen.at(-1);
        if (print) lines.push(`  ✝ @${x.handle} (${short(x.faction)}) PADL ${p.name}, ${p.days} dní na frontě: ${x.record[(p.rec?.[1] ?? 1) - 1]?.[1] ?? ''}`);
      } else if (print) {
        const fresh = x.record.slice(before.get(x.id) ?? 0).filter(([dd]) => dd === day).map(([, t]) => t);
        const t = fresh.find((y) => /Shot by/.test(y)) || (x.wound?.day === day ? fresh[0] : null);
        if (t) lines.push(`  ${{ light: '·', heavy: '+', crit: '!' }[x.wound?.sev] || '·'} @${x.handle} (${short(x.faction)}): ${t}`);
      }
    }
    if (print) {
      console.log(`── Den ${day} ── ${th.factions.map((_, f) => { const a = st.sides[f]; return `${short(f)}: lůžka ${a.beds}, nosítka ${a.stretchers}${a.trench ? `, těžce raněných V ZÁKOPU ${a.trench}` : ''}, medici ${Math.round(a.cover * 100)} %`; }).join('  |  ')}`);
      for (const n of (s.chronicle.at(-1)?.blocks || []).filter((b) => /^The guns on/.test(b.h || ''))) console.log(`  💥 ${n.h}. ${n.text}`);
      for (const l of lines) console.log(l.length > 240 ? `${l.slice(0, 237)}…` : l);
    }
  }
  return m.map((k, f) => {
    const live = s.soldiers.filter((x) => x.faction === f && x.status !== 'fallen');
    const takenFire = m[1 - f].fire;
    return { ...k, n: n0[f], takenFire, taken: k.bg + k.shell + takenFire,
      top: Math.max(0, ...s.soldiers.filter((x) => x.faction === f).map((x) => x.hits || 0)),
      seasoned: live.filter((x) => (x.xp || 0) >= th.battle.xp.levels[1].xp).length / Math.max(1, live.length) };
  });
}

const mean = (a) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
function run(sc, th, runs = RUNS) {
  const rs = Array.from({ length: runs }, (_, r) => simulate(sc, r, th, false));
  return th.factions.map((_, f) => {
    const g = (k) => mean(rs.map((r) => r[f][k]));
    return { n: g('n'), taken: g('taken'), takenFire: g('takenFire'), light: g('light'), heavy: g('heavy'), crit: g('crit'), dead: g('dead'),
      anyDead: rs.filter((r) => r[f].dead > 0).length / runs, trench: g('trenchMax'), cover: g('cover'), capped: g('capped'),
      lightDays: g('lightDays'), top: g('top'), seasoned: g('seasoned') };
  });
}

if (STORY) {
  const sc = SCENARIOS[(only || 1) - 1];
  console.log(`Scénář ${only || 1}: ${sc.name}\n`);
  const r = simulate(sc, 0, theme, true);
  console.log(`\nSouhrn: ${r.map((k, f) => `${short(f)} utržil ${k.taken} zásahů (z palby ${k.takenFire}), padlí: ${k.dead ? k.names.map((h) => `@${h}`).join(', ') : 'nikdo'}`).join(' · ')}`);
  process.exit(0);
}

const wk = 7 / DAYS;
console.log(`Simulace na skutečné soupisce (den ${real.day}, ${real.soldiers.length} vojáků): ${DAYS} dní, ${RUNS} běhů na scénář, vyvážení v${theme.battle.balance}.`);
console.log('Čísla jsou na stranu a TÝDEN (přepočteno ze simulovaných dnů); zásahy = utržené.\n');
const results = [];
(only ? [SCENARIOS[only - 1]] : SCENARIOS).forEach((sc, i) => {
  const r = run(sc, theme);
  results.push(r);
  console.log(`${only || i + 1}) ${sc.name}`);
  r.forEach((x, f) => console.log(`   ${short(f).padEnd(9)} ${String(Math.round(x.n)).padStart(3)} voj. │ zásahů ${(x.taken * wk).toFixed(1).padStart(4)} (palba ${Math.round(100 * x.takenFire / Math.max(0.01, x.taken))} %) │ lehce ${(x.light * wk).toFixed(1)} těžce ${(x.heavy * wk).toFixed(1)} krit. ${(x.crit * wk).toFixed(2)} │ padlých ${(x.dead * wk).toFixed(2)} (aspoň 1 za ${DAYS} dní: ${Math.round(x.anyDead * 100)} %) │ v zákopu max ${x.trench.toFixed(1)}, medici min ${Math.round(x.cover * 100)} %${x.capped ? `, pojistka ${x.capped.toFixed(1)}×` : ''}`));
  console.log('');
});

if (!only) {
  const per50 = (x) => 50 / Math.max(1, x.n);
  const quiet = results[0];
  const barrage = [results[1][1], results[2][0]];
  const K = [
    ['zásahy týdně (klid, na 50 vojáků)', mean(quiet.map((x) => x.taken * wk * per50(x))), 10, 16, false],
    ['podíl palby hráčů na zásazích (klid)', mean(quiet.map((x) => x.takenFire / Math.max(0.01, x.taken))), 0.35, 0.45, true],
    ['kritické zásahy týdně (klid, na 50)', mean(quiet.map((x) => x.crit * wk * per50(x))), 1, 2, false],
    ['padlí týdně, jen obvaziště (klid, na 50)', mean(quiet.map((x) => x.dead * wk * per50(x))), 1.5, 3, false],
    [`padlí za ${DAYS} dní u bombardované strany (na 50)`, mean(barrage.map((x) => x.dead * per50(x))), 12, 20, false],
    [`nejlepší střelec strany za ${DAYS} dní (zásahů)`, mean(quiet.map((x) => x.top)), 1, 4, false],
  ];
  console.log('Cílová čísla (docs/COMBAT_ROLES.md, kap. 6):');
  for (const [k, v, lo, hi, pct] of K) console.log(`  ${v >= lo && v <= hi ? '✓' : '⚠'} ${k}: ${pct ? `${Math.round(v * 100)} %` : v.toFixed(2)} (pásmo ${pct ? `${lo * 100}–${hi * 100} %` : `${lo}–${hi}`})`);
}

// přínos rolí: stejný scénář s vypnutým účinkem role (rozdíl = co role přináší)
if (args.includes('--roles')) {
  const off = {
    'medic (nosič)': ['roles.medic.work=0'], 'officer (velení)': ['roles.officer.lead=0', 'roles.officer.xp=0'], 'runner (spojka)': ['roles.runner.relay=0'],
    'signaller (protipalba)': ['roles.signaller.counter=0'], 'cook (morálka)': ['roles.cook.heal=0', 'roles.cook.worsen=0'], 'chaplain (útěcha)': ['roles.chaplain.faith=0'],
    'mg (potlačení)': ['roles.machinegunner.suppress=0', 'roles.machinegunner.suppressMax=0'], 'sniper (výběr cíle)': ['roles.sniper.pick=0'], 'sapper (drát)': ['roles.sapper.repair=0'],
  };
  const runs = Math.max(20, Math.round(RUNS / 2));
  const sc = SCENARIOS[1];
  const b = run(sc, theme, runs);
  const fmt = (v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}`.padStart(6);
  console.log(`\nPřínos rolí (scénář 2 = Concord pod granáty, ${runs} běhů × ${DAYS} dní, na stranu za celé období). Rozdíl = s rolí − bez jejího účinku:`);
  console.log('  role                    │ utržené zásahy Heg / Con │ padlí Heg / Con │ dny lehce raněných Heg / Con');
  for (const [r, sets] of Object.entries(off)) {
    const o = run(sc, withSets(theme, sets), runs);
    const d = (k, f) => b[f][k] - o[f][k];
    console.log(`  ${r.padEnd(23)} │ ${fmt(d('taken', 0))} / ${fmt(d('taken', 1))}          │ ${fmt(d('dead', 0))} / ${fmt(d('dead', 1))} │ ${fmt(d('lightDays', 0))} / ${fmt(d('lightDays', 1))}`);
  }
  console.log('  Záporné číslo = role pomáhá (méně zásahů, padlých, dnů zranění). Kulomet a odstřelovač působí hlavně na DRUHOU stranu.');
}
