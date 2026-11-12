// Ztráty před vydáním novin: odehraje několik dní (výchozí 3 = 3 noci bombardování) na kopii skutečného stavu, mnohokrát s jiným losem,
// a ukáže padlé a raněné podle stran (průměr, rozptyl, v kolika bězích má poražený strana víc ztrát než vítěz). Nic neukládá.
//   node tools/sim-edition.mjs [--runs 30] [--days 3] [--state soubor]
import { execFileSync } from 'node:child_process';
import { ROOT, loadTheme, loadState, stateFromGit } from './lib.mjs';
import { dailyTick } from '../engine/roster.js';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const RUNS = Number(opt('--runs', 30)), DAYS = Number(opt('--days', 3));
const { theme, story } = loadTheme();
let base;
if (opt('--state', null)) base = loadState(theme, opt('--state', null));
else { execFileSync('git', ['fetch', '-q', 'origin', 'main'], { cwd: ROOT }); base = stateFromGit('origin/main'); }
const short = (f) => theme.factions[f].name.replace(/^The /, '');
const v = (base.victories || []).at(-1);
console.log(`Stav: Den ${base.day}, ${base.soldiers.length} vojáků (${[0, 1].map((f) => `${short(f)} ${base.soldiers.filter((s) => s.faction === f).length}`).join(', ')}); ${v ? `${short(v.faction)} ovládl ${v.name} (Den ${v.day}), bombardování ${short(1 - v.faction)} do Dne ${v.barrageTo}` : 'žádná dobytá kóta'}`);
const dead = [], hurt = [], perDay = [];
for (let r = 0; r < RUNS; r++) {
  const s = JSON.parse(JSON.stringify(base));
  for (const x of s.soldiers) x.id = `${x.id}#${r}`; // jiný los v každém běhu
  const d = [[0, 0], [0, 0]], w = [[0, 0], [0, 0]];
  for (let k = 0; k < DAYS; k++) {
    dailyTick(s, { ...theme, id: `${theme.id}#${r}` }, story);
    const st = s.battle.stats.at(-1);
    for (const f of [0, 1]) {
      const a = st.sides[f];
      const dd = a.deaths.nobed + a.deaths.nocare + a.deaths.wounds + (a.deaths.shell || 0) + (a.deaths.shot || 0);
      const ww = a.sev.light + a.sev.heavy + a.sev.crit;
      d[f][0] += dd; w[f][0] += ww;
      (perDay[k] ??= [[], []])[f].push([dd, ww]);
    }
  }
  dead.push([d[0][0], d[1][0]]); hurt.push([w[0][0], w[1][0]]);
}
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const sd = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))); };
console.log(`\n${RUNS} běhů × ${DAYS} dní. Padlí / raněni za celé období (průměr ± směrodatná odchylka):`);
for (const f of [0, 1]) console.log(`  ${short(f).padEnd(9)} padlí ${mean(dead.map((x) => x[f])).toFixed(1)} ± ${sd(dead.map((x) => x[f])).toFixed(1)} · raněni ${mean(hurt.map((x) => x[f])).toFixed(1)} ± ${sd(hurt.map((x) => x[f])).toFixed(1)}`);
console.log('\nPo dnech (průměr padlých / raněných):');
perDay.forEach((p, k) => console.log(`  Den ${base.day + 1 + k}: ${[0, 1].map((f) => `${short(f)} ${mean(p[f].map((x) => x[0])).toFixed(2)} / ${mean(p[f].map((x) => x[1])).toFixed(1)}`).join(' · ')}`));
if (v) {
  const L = 1 - v.faction, W = v.faction;
  const moreDead = dead.filter((x) => x[L] > x[W]).length, eqDead = dead.filter((x) => x[L] === x[W]).length;
  const moreLoss = dead.map((x, i) => [x[L] + hurt[i][L], x[W] + hurt[i][W]]).filter((x) => x[0] > x[1]).length;
  console.log(`\nPoražený (${short(L)}) má víc padlých než vítěz (${short(W)}) v ${moreDead}/${RUNS} bězích (shoda ${eqDead}); víc padlých+raněných v ${moreLoss}/${RUNS}.`);
}
