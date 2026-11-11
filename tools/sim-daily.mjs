// Padlí PO DNECH na skutečné soupisce a na N× větší (klon vojáků). Nic neukládá.
//   node tools/sim-daily.mjs [--scale 10] [--runs 20] [--days 21] [--set klíč=hodnota ...]
// Scénáře: klid s nemocnicí (stav hry od Dne 3), klid jen s obvazištěm, Concord 3 dny pod granáty (obě strany s nemocnicí).
import { loadTheme, loadState } from './lib.mjs';
import { dailyTick } from '../engine/roster.js';
import { build } from '../engine/battle.js';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const sets = args.flatMap((a, i) => (a === '--set' ? [args[i + 1]] : []));
const SCALE = Number(opt('--scale', 1)), RUNS = Number(opt('--runs', 20)), DAYS = Number(opt('--days', 21));
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

function setup(sc, run) {
  const s = JSON.parse(JSON.stringify(real));
  const orig = s.soldiers;
  s.soldiers = [];
  for (let c = 0; c < SCALE; c++) for (const x of orig) {
    const y = JSON.parse(JSON.stringify(x));
    y.id = `${x.id}#${run}#${c}`; y.handle = c ? `${x.handle}_${c}` : x.handle;
    if (y.pos) y.pos = [y.pos[0] + ((c * 7) % 40) - 20, y.pos[1]];
    s.soldiers.push(y);
  }
  s.vote = null;
  delete s.battle;
  for (const f of sc.hospital || []) build(s, theme, f, 'dugout');
  if (sc.win != null) s.victories = [{ id: 'sim', name: 'Verdel Ridge', faction: sc.win, day: s.day, hero: 'sim', from: s.day + 1, to: s.day + theme.race.days, barrageTo: s.day + theme.race.barrageDays, counts: [100, 60] }];
  return s;
}

const SC = [
  { name: 'Klid, obě strany mají nemocnici (STAV HRY TEĎ)', hospital: [0, 1] },
  { name: 'Klid, jen obvaziště', hospital: [] },
  { name: 'Hegemony dobude kótu → Concord 3 dny pod granáty (obě s nemocnicí)', hospital: [0, 1], win: 0 },
];
const short = ['Heg', 'Con'];
console.log(`Soupiska ×${SCALE}: ${real.soldiers.length * SCALE} vojáků, ${RUNS} běhů × ${DAYS} dní, vyvážení v${theme.battle.balance}${sets.length ? ` + ${sets.join(' ')}` : ''}`);
for (const sc of SC) {
  const per = [[], []], shellDays = [[], []], byDay = [Array(DAYS).fill(0), Array(DAYS).fill(0)], wounded = [[], []], crit = [[], []], capped = [0, 0], beds = [[], []];
  let n = [0, 0];
  for (let r = 0; r < RUNS; r++) {
    const s = setup(sc, r);
    n = [0, 1].map((f) => s.soldiers.filter((x) => x.faction === f).length);
    for (let d = 0; d < DAYS; d++) {
      dailyTick(s, theme, story);
      const st = s.battle.stats.at(-1);
      for (const f of [0, 1]) {
        const a = st.sides[f];
        const dead = a.deaths.nobed + a.deaths.nocare + a.deaths.wounds + (a.deaths.shell || 0);
        const shelled = a.hits.shell > 0;
        (shelled ? shellDays : per)[f].push(dead);
        byDay[f][d] += dead / RUNS;
        wounded[f].push(a.sev.light + a.sev.heavy + a.sev.crit); crit[f].push(a.sev.crit);
        capped[f] += a.capped; beds[f].push(a.beds);
      }
    }
  }
  const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const pct = (a, q) => { const b = [...a].sort((x, y) => x - y); return b.length ? b[Math.floor(q * (b.length - 1))] : 0; };
  console.log(`\n${sc.name}`);
  for (const f of [0, 1]) {
    const q = per[f];
    console.log(`  ${short[f]} ${String(n[f]).padStart(4)} voj. │ ranění/den ${mean(wounded[f]).toFixed(1)} (krit ${mean(crit[f]).toFixed(2)}) │ PADLÍ/DEN ${mean(q).toFixed(2)}`
      + ` (týdně ${(mean(q) * 7).toFixed(1)}, dny s padlým ${Math.round(100 * q.filter((x) => x > 0).length / Math.max(1, q.length))} %, nejhorší den ${Math.max(0, ...q)})`
      + (shellDays[f].length ? ` │ POD GRANÁTY ${mean(shellDays[f]).toFixed(2)}/den (nejhorší ${Math.max(...shellDays[f])})` : '')
      + (sc.win != null ? ` │ dny 1–7: ${byDay[f].slice(0, 7).map((x) => x.toFixed(1)).join(' ')} (za 7 dní ${byDay[f].slice(0, 7).reduce((a, b) => a + b, 0).toFixed(1)})` : '')
      + ` │ lůžka obsazená ø ${mean(beds[f]).toFixed(1)}${capped[f] ? ` │ pojistka ${(capped[f] / RUNS).toFixed(1)}×/běh` : ''}`);
  }
}
