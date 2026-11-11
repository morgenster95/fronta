// Matice simulací: velikost stran × složení rolí × nemocnice × klid/bombardování. Padlí DENNĚ na stranu. Nic neukládá.
//   node tools/sim-matrix.mjs [--runs 8] [--days 14] [--quick] [--set klíč=hodnota ...]
// Soupiska = skutečná (pozice, úseky, linie), naklonovaná na danou velikost; role se u ROLE-mixů rozdají znovu podle podílů.
// Výstup: padlí/den (na 100 vojáků), dny bombardování zvlášť, padlí za 7 dní od dobytí kóty, pokrytí mediky a obsazení nosítek.
import { loadTheme, loadState } from './lib.mjs';
import { dailyTick } from '../engine/roster.js';
import { build } from '../engine/battle.js';
import { rngFor } from '../engine/rng.js';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const sets = args.flatMap((a, i) => (a === '--set' ? [args[i + 1]] : []));
const RUNS = Number(opt('--runs', 8)), DAYS = Number(opt('--days', 14)), QUICK = args.includes('--quick');
const { theme: base, story } = loadTheme();
const theme = JSON.parse(JSON.stringify(base));
for (const s of sets) {
  const [k, v] = s.split('=');
  const path = k.split('.');
  let o = theme.battle;
  for (const p of path.slice(0, -1)) o = o[p] ??= {};
  o[path.at(-1)] = isNaN(Number(v)) ? v : Number(v);
}
const real = loadState(theme);

// složení stran (podíly rolí); REAL = skutečné role ze soupisky
const MIX = {
  REAL: null,
  'MÁLO MEDIKŮ 3 %': { rifleman: 45, machinegunner: 15, sniper: 12, medic: 3, cook: 5, chaplain: 3, signaller: 5, runner: 4, officer: 2, sapper: 6 },
  'HODNĚ MEDIKŮ 15 %': { rifleman: 37, machinegunner: 12, sniper: 8, medic: 15, cook: 5, chaplain: 3, signaller: 6, runner: 5, officer: 2, sapper: 7 },
  'KULOMETY 35 %': { rifleman: 25, machinegunner: 35, sniper: 10, medic: 5, cook: 4, chaplain: 2, signaller: 6, runner: 5, officer: 2, sapper: 6 },
  'STŘELCI 60 %': { rifleman: 60, machinegunner: 12, sniper: 8, medic: 8, cook: 3, chaplain: 1, signaller: 3, runner: 2, officer: 1, sapper: 2 },
  'KULOMETY 35 % + MEDICI 13 %': { rifleman: 25, machinegunner: 35, sniper: 8, medic: 13, cook: 4, chaplain: 2, signaller: 5, runner: 3, officer: 1, sapper: 4 },
  'STŘELCI 55 % + MEDICI 13 %': { rifleman: 55, machinegunner: 12, sniper: 8, medic: 13, cook: 3, chaplain: 1, signaller: 3, runner: 2, officer: 1, sapper: 2 },
  'ODSTŘELOVAČI 30 %': { rifleman: 30, machinegunner: 10, sniper: 30, medic: 6, cook: 4, chaplain: 3, signaller: 5, runner: 4, officer: 2, sapper: 6 },
};
const ALLPAIRS = [['REAL', 'REAL'], ['MÁLO MEDIKŮ 3 %', 'HODNĚ MEDIKŮ 15 %'], ['KULOMETY 35 %', 'ODSTŘELOVAČI 30 %'], ['REAL', 'KULOMETY 35 %'], ['REAL', 'STŘELCI 60 %'], ['REAL', 'KULOMETY 35 % + MEDICI 13 %'], ['REAL', 'STŘELCI 55 % + MEDICI 13 %']];
const SIZES = opt('--sizes') ? opt('--sizes').split(',').map((x) => x.split('/').map(Number)) : QUICK ? [[1, 1], [10, 10]] : [[1, 1], [10, 10], [10, 3]];
const PAIRS = opt('--pairs') ? opt('--pairs').split(',').map((i) => ALLPAIRS[Number(i)]) : QUICK ? [['REAL', 'REAL'], ['MÁLO MEDIKŮ 3 %', 'HODNĚ MEDIKŮ 15 %']]
  : [['REAL', 'REAL'], ['MÁLO MEDIKŮ 3 %', 'HODNĚ MEDIKŮ 15 %'], ['KULOMETY 35 %', 'ODSTŘELOVAČI 30 %']];
const HOSP = opt('--hosp') ? opt('--hosp').split(',').map((x) => x.split('/').map(Number)) : QUICK ? [[1, 1]] : [[1, 1], [3, 0]];

function pick(mix, r) {
  const tot = Object.values(mix).reduce((a, b) => a + b, 0);
  let k = r * tot;
  for (const [id, w] of Object.entries(mix)) if ((k -= w) <= 0) return id;
  return 'rifleman';
}

function setup(size, pair, hosp, war, run) {
  const s = JSON.parse(JSON.stringify(real));
  const orig = s.soldiers;
  s.soldiers = [];
  for (const f of [0, 1]) {
    const mine = orig.filter((x) => x.faction === f);
    for (let c = 0; c < size[f]; c++) for (const x of mine) {
      const y = JSON.parse(JSON.stringify(x));
      y.id = `${x.id}#${run}#${c}`; y.handle = c ? `${x.handle}_${c}` : x.handle;
      if (c && y.pos) y.pos = [y.pos[0] + ((c * 7) % 40) - 20, y.pos[1]];
      const mix = MIX[pair[f]];
      if (mix) y.archetype = pick(mix, rngFor(y.id, 'mix', 0)());
      s.soldiers.push(y);
    }
  }
  s.vote = null;
  delete s.battle;
  for (const f of [0, 1]) for (let i = 0; i < hosp[f]; i++) build(s, theme, f, 'dugout');
  if (war) s.victories = [{ id: 'sim', name: 'Verdel Ridge', faction: 0, day: s.day, hero: 'sim', from: s.day + 1, to: s.day + theme.race.days, barrageTo: s.day + theme.race.barrageDays, counts: [100, 60] }];
  return s;
}

let LAST_EFF = null;
const CAUSES = [], PLACE = [];
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
function sim(size, pair, hosp, war) {
  const dealt = [[], []], taken = [[], []], eff = {}, quiet = [[], []], shell = [[], []], week = [0, 0], cover = [[], []], n = [0, 0], medics = [0, 0], str = [[], []];
  const runs = Math.max(2, Math.round(RUNS / Math.max(...size) ** 0.5));
  for (let r = 0; r < runs; r++) {
    const s = setup(size, pair, hosp, war, r);
    for (const f of [0, 1]) { n[f] = s.soldiers.filter((x) => x.faction === f).length; medics[f] = s.soldiers.filter((x) => x.faction === f && x.archetype === 'medic').length; }
    for (let d = 0; d < DAYS; d++) {
      for (const x of s.soldiers) if (x.line === 'front' && x.status === 'active' && !x.wound) { eff[x.archetype] ??= { h: 0, n: 0 }; eff[x.archetype].n++; }
      dailyTick(s, theme, story);
      const st = s.battle.stats.at(-1);
      for (const f of [0, 1]) {
        const a = st.sides[f];
        const dead = a.deaths.nobed + a.deaths.nocare + a.deaths.wounds + (a.deaths.shell || 0) + (a.deaths.shot || 0);
        (a.hits.shell ? shell : quiet)[f].push(dead);
        if (d < 7) week[f] += dead / runs;
        cover[f].push(a.cover); str[f].push(a.stretchers);
        CAUSES[f] ??= {}; for (const [k, v] of Object.entries(a.deaths)) CAUSES[f][k] = (CAUSES[f][k] || 0) + v;
        PLACE[f] ??= { heavyStr: 0, n: 0 }; PLACE[f].heavyStr += s.soldiers.filter((x) => x.faction === f && x.wound?.sev === 'heavy' && x.wound.place === 'stretcher').length; PLACE[f].n++;
        dealt[f].push(Object.values(a.hits.fire).reduce((x, y) => x + y, 0));
        taken[f].push(a.sev.light + a.sev.heavy + a.sev.crit);
        for (const [role, h] of Object.entries(a.hits.fire)) { eff[role] ??= { h: 0, n: 0 }; eff[role].h += h; }
      }
    }
  }
  LAST_EFF = eff;
  return [0, 1].map((f) => ({ dealt: mean(dealt[f]), taken: mean(taken[f]), n: n[f], medics: medics[f], quiet: mean(quiet[f]), shell: shell[f].length ? mean(shell[f]) : null, shellMax: Math.max(0, ...shell[f]), week: week[f], cover: mean(cover[f]), str: mean(str[f]) }));
}

console.log(`Matice simulací, vyvážení v${theme.battle.balance}${sets.length ? ` + ${sets.join(' ')}` : ''}; ${DAYS} dní, padlí na stranu DENNĚ (v závorce na 100 vojáků)`);
const f2 = (v, n) => `${v.toFixed(2)} (${(100 * v / n).toFixed(2)})`;
for (const war of [false, true]) {
  console.log(`\n=== ${war ? 'Hegemony dobude kótu → Concord 3 dny pod granáty' : 'Klidná fronta'} ===`);
  for (const size of SIZES) for (const pair of PAIRS) for (const hosp of HOSP) {
    const r = sim(size, pair, hosp, war);
    const line = r.map((x, f) => `${['Heg', 'Con'][f]} ${String(x.n).padStart(4)} (${pair[f]}, medici ${x.medics}, nemocnic ${hosp[f]}): ${war && f === 1 ? `granáty ${f2(x.shell ?? 0, x.n)}/den, 7 dní ${x.week.toFixed(1)} (${(100 * x.week / x.n).toFixed(1)} %)` : `${f2(x.quiet, x.n)}/den`} · palba dává ${x.dealt.toFixed(1)}/den, ranění ${x.taken.toFixed(1)}/den · medici ${Math.round(100 * x.cover)} % · nosítka ø ${x.str.toFixed(1)}`);
    console.log(`×${size.join('/')} │ ${line.join(' │ ')}`);
    if (args.includes('--causes')) { console.log('      příčiny smrti: ' + [0, 1].map((f) => JSON.stringify(CAUSES[f]) + ` těžce na nosítkách ø ${(PLACE[f].heavyStr / PLACE[f].n).toFixed(1)}`).join(' │ ')); CAUSES.length = 0; PLACE.length = 0; }
    if (args.includes('--eff') && !war) console.log('      zásahů na střelce v přední linii za týden: ' + Object.entries(LAST_EFF).filter(([, v]) => v.n).map(([k, v]) => `${k} ${(7 * v.h / v.n).toFixed(2)}`).join(', '));
  }
}
