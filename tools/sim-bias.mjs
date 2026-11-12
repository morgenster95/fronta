// Rozbor férovosti a průběhu bombardování: odehraje několik dní na kopii skutečného stavu mnohokrát s jiným losem a ukáže
//  1) po dnech: střelci k dispozici (ranění nestřílí), medici, pokrytí, lůžka/nosítka, padlí a ranění po stranách,
//  2) zda nepadá a není raněn jen jeden typ vojáka: podíl na ztrátách vs. podíl v populaci podle role, dne naverbování, linie a strany.
//   node tools/sim-bias.mjs [--runs 40] [--days 5] [--state soubor]   (nic neukládá)
import { execFileSync } from 'node:child_process';
import { ROOT, loadTheme, loadState, stateFromGit } from './lib.mjs';
import { dailyTick } from '../engine/roster.js';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const RUNS = Number(opt('--runs', 40)), DAYS = Number(opt('--days', 5));
const { theme, story } = loadTheme();
let base;
if (opt('--state', null)) base = loadState(theme, opt('--state', null));
else { execFileSync('git', ['fetch', '-q', 'origin', 'main'], { cwd: ROOT }); base = stateFromGit('origin/main'); }
const short = (f) => theme.factions[f].name.replace(/^The /, '');
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const v = (base.victories || []).at(-1);
console.log(`Stav: Den ${base.day}, ${base.soldiers.length} vojáků; ${v ? `${short(v.faction)} ovládl ${v.name} (Den ${v.day}), bombardování ${short(1 - v.faction)} do Dne ${v.barrageTo}` : 'žádné bombardování'}. ${RUNS} běhů × ${DAYS} dní.`);

const perDay = Array.from({ length: DAYS }, () => ({ shooters: [[], []], medics: [[], []], cover: [[], []], beds: [[], []], str: [[], []], dead: [[], []], hurt: [[], []], shellHits: [[], []], deadNew: [[], []], hurtNew: [[], []] }));
const cat = { wounds: {}, deaths: {}, pop: {} };
const whoDied = {}, whoHurt = {}, sick = { n: 0, died: 0 }; // podle jména; ranění už na startu zvlášť (jejich smrt není „náhodný výběr“)
const key = (s) => {
  const F = short(s.faction), svc = Math.max(0, base.day - (s.enlisted ?? base.day));
  return { role: s.archetype, cohort: `Den ${s.enlisted}`, line: s.line, faction: F,
    [`role@${F}`]: s.archetype, [`cohort@${F}`]: `Den ${s.enlisted}`, [`sector@${F}`]: s.sector || '?', [`claimed@${F}`]: s.claimed ? 'převzatí' : 'nepřevzatí' };
};
const bump = (m, grp, k, n = 1) => { ((m[grp] ??= {})[k] = (m[grp][k] || 0) + n); };

for (let r = 0; r < RUNS; r++) {
  const s = JSON.parse(JSON.stringify(base));
  for (const x of s.soldiers) x.id = `${x.id}#${r}`;
  const woundedAtStart = new Set(s.soldiers.filter((x) => x.wound).map((x) => x.id));
  const meta = new Map(s.soldiers.filter((x) => !x.wound).map((x) => [x.id, key(x)]));
  for (const x of s.soldiers.filter((x) => !x.wound)) for (const [g, k] of Object.entries(key(x))) if (!g.startsWith('line')) bump(cat.pop, g, k, DAYS); // soldier-days na začátku (aproximace expozice)
  for (let d = 0; d < DAYS; d++) {
    const P = perDay[d];
    for (const f of [0, 1]) {
      const mine = s.soldiers.filter((x) => x.faction === f);
      P.shooters[f].push(mine.filter((x) => x.line === 'front' && x.status === 'active' && !x.wound).length);
      P.medics[f].push(mine.filter((x) => x.archetype === 'medic' && x.status === 'active' && !x.wound).length);
    }
    const before = new Map(s.soldiers.map((x) => [x.id, { wt: x.woundsTaken || 0, fl: (x.fallen || []).length }]));
    dailyTick(s, { ...theme, id: `${theme.id}#${r}` }, story);
    const st = s.battle.stats.at(-1);
    for (const f of [0, 1]) {
      const a = st.sides[f];
      P.cover[f].push(a.cover); P.str[f].push(a.stretchers); P.beds[f].push(a.beds ?? 0);
      P.dead[f].push(a.deaths.nobed + a.deaths.nocare + a.deaths.wounds + (a.deaths.shell || 0) + (a.deaths.shot || 0));
      P.hurt[f].push(a.sev.light + a.sev.heavy + a.sev.crit);
      P.shellHits[f].push(a.hits.shell || 0);
    }
    for (const x of s.soldiers) {
      const b = before.get(x.id); if (!b) continue;
      const m = meta.get(x.id);
      if (woundedAtStart.has(x.id)) { if (d === 0) sick.n++; if ((x.fallen || []).length > b.fl) sick.died++; continue; }
      if ((x.woundsTaken || 0) > b.wt) whoHurt[x.handle] = (whoHurt[x.handle] || 0) + 1;
      if ((x.fallen || []).length > b.fl) whoDied[x.handle] = (whoDied[x.handle] || 0) + 1;
      if ((x.woundsTaken || 0) > b.wt) for (const [g, k] of Object.entries(m)) if (!g.startsWith('line') && !m.__skip) bump(cat.wounds, g, k);
      if ((x.fallen || []).length > b.fl) for (const [g, k] of Object.entries(m)) if (!g.startsWith('line') && !m.__skip) bump(cat.deaths, g, k);
    }
  }
}
console.log('\nPo dnech (průměr z běhů):');
const row = (P, f) => `střelců ${mean(P.shooters[f]).toFixed(0)} · medici ${mean(P.medics[f]).toFixed(1)} (pokrytí ${Math.round(100 * mean(P.cover[f]))} %) · nosítka ${mean(P.str[f]).toFixed(1)} · zásahy granátem ${mean(P.shellHits[f]).toFixed(1)} · ranění ${mean(P.hurt[f]).toFixed(1)} · padlí ${mean(P.dead[f]).toFixed(2)}`;
perDay.forEach((P, d) => { console.log(`Den ${base.day + 1 + d}:`); for (const f of [0, 1]) console.log(`   ${short(f).padEnd(9)} ${row(P, f)}`); });

console.log('\nFérovost: podíl na ztrátách ÷ podíl v populaci (1,0 = přesně úměrně; < 0,6 nebo > 1,6 stojí za pozornost)');
for (const g of Object.keys(cat.pop).sort((a, b) => a.length - b.length || a.localeCompare(b))) {
  const popT = Object.values(cat.pop[g] || {}).reduce((a, b) => a + b, 0);
  const wT = Object.values(cat.wounds[g] || {}).reduce((a, b) => a + b, 0), dT = Object.values(cat.deaths[g] || {}).reduce((a, b) => a + b, 0);
  console.log(`\n${g.toUpperCase()}  (zranění celkem ${wT}, padlí ${dT})`);
  let ks = Object.keys(cat.pop[g]).sort((a, b) => cat.pop[g][b] - cat.pop[g][a]);
  if (g.startsWith('sector')) ks = ks.sort((a, b) => ((cat.deaths[g]?.[b] || 0) / cat.pop[g][b]) - ((cat.deaths[g]?.[a] || 0) / cat.pop[g][a])).filter((k) => cat.pop[g][k] > popT * 0.012).slice(0, 8);
  for (const k of ks) {
    const p = cat.pop[g][k] / popT, w = (cat.wounds[g]?.[k] || 0) / (wT || 1), dd = (cat.deaths[g]?.[k] || 0) / (dT || 1);
    console.log(`  ${k.padEnd(16)} populace ${(100 * p).toFixed(1).padStart(5)} %  zranění ${(100 * w).toFixed(1).padStart(5)} % (×${(w / p).toFixed(2)})  padlí ${(100 * dd).toFixed(1).padStart(5)} % (×${(dd / p).toFixed(2)})`);
  }
}

const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n);
console.log(`\nRaněný už na startu: ${sick.n / RUNS} vojáků na běh, zemřelo jich ${(sick.died / RUNS).toFixed(2)} na běh (ti se do výběru výše nepočítají).`);
console.log('Nejčastěji padlí jednotlivci (z ' + RUNS + ' běhů; jeden člověk padající v většině běhů = ne náhoda, ale jeho místo/situace):');
for (const [h, n] of top(whoDied, 6)) console.log(`  @${h}: padl v ${n} bězích`);
console.log('Nejčastěji ranění jednotlivci:');
for (const [h, n] of top(whoHurt, 5)) console.log(`  @${h}: raněn v ${n} bězích (z ${RUNS * DAYS} dnů)`);
const spread = Object.keys(whoDied).length;
console.log(`Padli celkem ${spread} různí lidé; rozptyl dle jmen: ${(Object.values(whoDied).reduce((a, b) => a + b, 0) / Math.max(1, spread)).toFixed(1)} smrtí na jednoho z těch, co kdy padli.`);
