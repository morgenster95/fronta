// Denní rozhodnutí (theme.decisions): seznam, návrh postu do fronty a rychlá simulace účinku. NIC neukládá ani nepublikuje.
//   node tools/decision.mjs                 seznam rozhodnutí
//   node tools/decision.mjs <id>            návrh položky pro marketing/queue.json (popisek + hlasování) k odsouhlasení
//   node tools/decision.mjs <id> --sim      co která možnost udělá: 30 běhů na skutečném stavu, obě strany zvolí totéž
import fs from 'node:fs';
import { loadTheme, loadState } from './lib.mjs';
import { dailyTick } from '../engine/roster.js';
import { issueOrders } from '../engine/orders.js';
import { build } from '../engine/battle.js';

const { theme, story } = loadTheme();
const list = theme.decisions?.list || [];
const [id, flag] = process.argv.slice(2);
const d = list.find((x) => x.id === id);
const effect = (o) => [o.build && `stavba ${o.build}`, o.fire && `palba ×${o.fire}`, o.danger && `zásahy ×${o.danger}`, o.medics && `medici ×${o.medics}`,
  o.recover && `uzdravení ${o.recover}`, o.days && `${o.days} d`].filter(Boolean).join(', ');
if (!d) {
  for (const x of list) console.log(`${x.id.padEnd(20)} [${x.when}] ${x.question}\n${x.options.map((o) => `    ${o.kw.padEnd(9)} ${effect(o)}`).join('\n')}`);
  process.exit(0);
}
if (flag === '--sim') {
  const base = JSON.stringify(loadState(theme));
  const run = (opt) => {
    const sum = { hit: [0, 0], dead: [0, 0] };
    const RUNS = 30, DAYS = 7;
    for (let r = 0; r < RUNS; r++) {
      const s = JSON.parse(base);
      s.theme = `${s.theme}#${r}`; // jiné kostky v každém běhu
      const t = { ...theme, id: `${theme.id}#${r}` };
      for (const x of s.soldiers) x.id = `${x.id}#${r}`;
      s.battle.sides.forEach((side) => { side.beds = side.beds.map((b) => `${b}#${r}`); });
      if (opt) { if (opt.build) [0, 1].forEach((f) => build(s, t, f, opt.build)); issueOrders(s, [0, 1].map((f) => ({ ...opt, faction: f })), s.day + 1); }
      const before = [0, 1].map((f) => s.soldiers.filter((x) => x.faction === f && (x.fallen || []).length).length);
      for (let i = 0; i < DAYS; i++) dailyTick(s, t, story);
      for (const st of s.battle.stats.slice(-DAYS)) [0, 1].forEach((f) => { const v = st.sides[f].sev; sum.hit[f] += v.light + v.heavy + v.crit; });
      [0, 1].forEach((f) => { sum.dead[f] += s.soldiers.filter((x) => x.faction === f && (x.fallen || []).length).length - before[f]; });
    }
    return `raněných za týden ${sum.hit.map((v) => (v / RUNS).toFixed(1)).join(' / ')} · rodů s novým padlým ${sum.dead.map((v) => (v / RUNS).toFixed(2)).join(' / ')}`;
  };
  console.log(`${d.title}: obě strany zvolí totéž, 7 dní, průměr 30 běhů (Hegemony / Concord)`);
  console.log(`  bez rozkazu  ${run(null)}`);
  for (const o of d.options) console.log(`  ${o.kw.padEnd(11)}  ${run(o)}   [${effect(o)}]`);
  process.exit(0);
}
const kws = d.options.map((o) => o.kw);
const item = {
  id: `decision-${d.id}`, type: 'image', files: [`decision_${d.id.replace(/-/g, '_')}.jpg`],
  caption: `🗳️ ${d.title.toUpperCase()}. Comment one word below 👇\n\n${d.question}\n\n${d.options.map((o) => `▪️ ${o.kw}: ${o.label}`).join('\n')}\n\n` +
    `Each side votes for itself. Your soldier is your ballot, so no need to write your side. A side that sends no votes gets no orders.\n` +
    `Orders are read out in the Trench Gazette at 13:00 UTC.\nNot enlisted yet? Comment ${theme.factions.map((f) => f.keyword).join(' or ')} together with your choice.\n\n` +
    '#pixelart #ww1 #indiegame #trenchwarfare #instagramgame #gamedev #mudandiron',
  vote: { question: d.question, perFaction: true, minHours: 8, note: `Each side decides for itself: comment ${kws.join(' or ')} under the post on @mudandiron. Your soldier is your ballot.`, options: d.options },
  _note: 'NÁVRH z tools/decision.mjs. Bez publishAt se nezveřejní; obrázek je potřeba nakreslit (1080×1350) a čas doplnit se souhlasem uživatele.',
};
console.log(JSON.stringify(item, null, 2));
console.log(`\nVečerní reel otevře: „${d.reel}“`);
