// Vyzkoušení denního boje nanečisto na kopii SKUTEČNÉHO stavu (data/state.json). Nic neukládá, hra ani web se nemění.
//
//   node tools/sim-battle.mjs                 všechny scénáře, každý 40× po 14 dnech, průměry na stranu
//   node tools/sim-battle.mjs 3 --story       scénář 3 jednou, den po dni se zápisy z deníků
//   node tools/sim-battle.mjs --days 21 --runs 100
//
// Každý běh dostane jiné „kostky“ (ID vojáků s příponou běhu), soupiska, role, sektory i medici jsou skutečné.
import { loadTheme, loadState } from './lib.mjs';
import { dailyTick } from '../engine/roster.js';
import { build, battlePublic } from '../engine/battle.js';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? Number(args[i + 1]) : d; };
const only = Number(args.find((a, i) => /^\d+$/.test(a) && !['--days', '--runs'].includes(args[i - 1])) || 0);
const DAYS = opt('--days', 14);
const RUNS = args.includes('--story') ? 1 : opt('--runs', 40);
const STORY = args.includes('--story');

const { theme, story } = loadTheme();
const H = 0, C = 1;
const short = (f) => theme.factions[f].name.replace(/^The /, '');

// win: kdo vyhraje závod hned první den (poražený je pak 3 dny pod granáty), hospital: kdo má nemocnici
const SCENARIOS = [
  { name: 'Klidná fronta, nikdo nic nepostavil', hospital: [] },
  { name: 'Klidná fronta, obě strany mají nemocnici', hospital: [H, C] },
  { name: 'Hegemony vyhraje závod, Concord 3 dny pod granáty, Concord BEZ nemocnice', win: H, hospital: [] },
  { name: 'Hegemony vyhraje závod, Concord 3 dny pod granáty, Concord S nemocnicí (zvolil HOSPITAL)', win: H, hospital: [C] },
  { name: 'Concord vyhraje závod, Hegemony 3 dny pod granáty, Hegemony BEZ nemocnice', win: C, hospital: [] },
  { name: 'Concord vyhraje závod, Hegemony 3 dny pod granáty, Hegemony S nemocnicí', win: C, hospital: [H] },
];

function setup(sc, run) {
  const s = JSON.parse(JSON.stringify(loadState(theme)));
  for (const x of s.soldiers) x.id = `${x.id}#${run}`; // jiné kostky v každém běhu
  s.vote = null;
  for (const f of sc.hospital) build(s, theme, f, 'dugout');
  if (sc.win != null) {
    const R = theme.race;
    s.victories = [...(s.victories || []), { id: 'ridge', name: 'Verdel Ridge', faction: sc.win, day: s.day, hero: 'sim', from: s.day + 1, to: s.day + R.days, barrageTo: s.day + R.barrageDays, counts: [100, 60] }];
  }
  return s;
}

function simulate(sc, run, print) {
  const s = setup(sc, run);
  const m = theme.factions.map(() => ({ hits: 0, light: 0, heavy: 0, crit: 0, dead: 0, deadNames: [], peakBeds: 0, peakStretch: 0, minCover: 1, shellHits: 0 }));
  if (print) {
    const medics = theme.factions.map((_, f) => s.soldiers.filter((x) => x.faction === f && x.archetype === 'medic').length);
    const sappers = theme.factions.map((_, f) => s.soldiers.filter((x) => x.faction === f && x.archetype === 'sapper').length);
    console.log(`Start: den ${s.day}. ${theme.factions.map((_, f) => `${short(f)} ${s.soldiers.filter((x) => x.faction === f).length} vojáků, ${medics[f]} mediků, ${sappers[f]} ženistů`).join(' · ')}\n`);
  }
  for (let d = 0; d < DAYS; d++) {
    const status = new Map(s.soldiers.map((x) => [x.id, x.status]));
    const before = new Map(s.soldiers.map((x) => [x.id, x.record.length]));
    dailyTick(s, theme, story);
    const day = s.day;
    const lines = [];
    for (const x of s.soldiers) {
      const k = m[x.faction];
      const newEntries = x.record.slice(before.get(x.id) ?? 0).filter(([dd]) => dd === day).map(([, t]) => t);
      if (x.status === 'fallen' && status.get(x.id) !== 'fallen') {
        k.dead++;
        k.deadNames.push(x.handle);
        lines.push(`  ✝ @${x.handle} (${short(x.faction)}) PADL: ${newEntries[0] ?? ''}`);
      } else if (x.wound && x.wound.day === day) {
        k.hits++;
        k[x.wound.sev]++;
        if (x.wound.shell) k.shellHits++;
        lines.push(`  ${{ light: '·', heavy: '+', crit: '!' }[x.wound.sev]} @${x.handle} (${short(x.faction)}) ${{ light: 'lehce', heavy: 'TĚŽCE', crit: 'KRITICKY' }[x.wound.sev]}${x.wound.shell ? ' granát' : ''}: ${newEntries[0] ?? ''}`);
      } else if (x.wound && newEntries.length && /stretcher|bed came free|finally has a bed|room for|onto it/.test(newEntries[0])) {
        lines.push(`  ~ @${x.handle} (${short(x.faction)}): ${newEntries[0]}`);
      }
    }
    const pub = battlePublic(s, theme);
    pub.forEach((p, f) => {
      m[f].peakBeds = Math.max(m[f].peakBeds, p.beds.length);
      m[f].peakStretch = Math.max(m[f].peakStretch, p.stretchers.length);
      m[f].minCover = Math.min(m[f].minCover, p.medics.cover);
    });
    if (print) {
      const barrage = (s.chronicle.at(-1)?.blocks || []).find((b) => /^The guns on/.test(b.h || ''));
      console.log(`── Den ${day} ── ${pub.map((p, f) => `${short(f)}: ${p.hospital.dugout ? 'nemocnice' : 'obvaziště'} ${p.beds.length}/${p.hospital.beds}${p.stretchers.length ? `, NA NOSÍTKÁCH ${p.stretchers.length}` : ''}, lehce ranění ${p.walking}, medici stačí na ${Math.round(p.medics.cover * 100)} %, drát ${Math.round((p.wire ?? 0) * 100)} %`).join('  |  ')}`);
      if (barrage) console.log(`  💥 ${barrage.h}. ${barrage.text}`);
      for (const l of lines) console.log(l.length > 200 ? `${l.slice(0, 197)}…` : l);
    }
  }
  return m;
}

const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const list = only ? [SCENARIOS[only - 1]] : SCENARIOS;
if (!STORY) console.log(`Simulace na skutečné soupisce: ${DAYS} dní, každý scénář ${RUNS}× s jinými kostkami. Čísla = průměr za ${DAYS} dní na stranu.\n`);
list.forEach((sc, i) => {
  const n = only || i + 1;
  if (STORY) console.log(`Scénář ${n}: ${sc.name}\n`);
  const res = Array.from({ length: RUNS }, (_, r) => simulate(sc, r, STORY));
  if (STORY) {
    console.log(`\nSouhrn: ${res[0].map((k, f) => `${short(f)} ${k.hits} zásahů (${k.heavy} těžce, ${k.crit} kriticky), padlí: ${k.dead ? k.deadNames.map((h) => `@${h}`).join(', ') : 'nikdo'}`).join(' · ')}`);
    return;
  }
  console.log(`${n}) ${sc.name}`);
  theme.factions.forEach((_, f) => {
    const g = (k) => mean(res.map((r) => r[f][k]));
    const anyDead = res.filter((r) => r[f].dead > 0).length / RUNS;
    console.log(`   ${short(f).padEnd(9)} zásahů ${g('hits').toFixed(1).padStart(4)} (lehce ${g('light').toFixed(1)}, těžce ${g('heavy').toFixed(1)}, kriticky ${g('crit').toFixed(1)}${g('shellHits') ? `, z granátů ${g('shellHits').toFixed(1)}` : ''})` +
      ` │ padlých ${g('dead').toFixed(2)}, aspoň 1 padlý v ${Math.round(anyDead * 100)} % běhů │ nejvíc obsazených lůžek ${g('peakBeds').toFixed(1)}, nejvíc na nosítkách ${g('peakStretch').toFixed(1)}, medici nejhůř ${Math.round(g('minCover') * 100)} %`);
  });
  console.log('');
});
