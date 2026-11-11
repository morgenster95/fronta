// Náhled příštího ranního vydání s novým bojem: vezme skutečný stav (výchozí: origin/main), odehraje JEDEN denní tah
// na kopii a vypíše Trench Gazette a všechno, co se stalo (kdo koho trefil, nosítka, padlí). Nic neukládá ani nepublikuje.
//   node tools/preview-tick.mjs                  stav z origin/main (git fetch)
//   node tools/preview-tick.mjs --state soubor   jiný stav
//   node tools/preview-tick.mjs --md out.md      zapsat i jako Markdown (k procházení)
//   node tools/preview-tick.mjs --save-state f   uložit stav po tahu do souboru (k vyzkoušení grafiky, NE do data/)
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { ROOT, loadTheme, loadState, stateFromGit } from './lib.mjs';
import { dailyTick } from '../engine/roster.js';
import { battlePublic } from '../engine/battle.js';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const { theme, story } = loadTheme();
let s;
if (opt('--state')) s = loadState(theme, opt('--state'));
else {
  execFileSync('git', ['fetch', '-q', 'origin', 'main'], { cwd: ROOT });
  s = stateFromGit('origin/main');
}
const before = new Map(s.soldiers.map((x) => [x.id, { len: x.record.length, gen: x.generation || 1 }]));
dailyTick(s, theme, story);
const short = (f) => theme.factions[f].name.replace(/^The /, '');
const out = [];
const p = (l = '') => out.push(l);
p(`# Náhled vydání: Den ${s.day} (nový boj, vyvážení v${theme.battle.balance})`);
p(`Ze stavu s ${s.soldiers.length} vojáky. NIC SE NEULOŽILO ani nepublikovalo.\n`);
const ch = s.chronicle.at(-1);
p('## Trench Gazette');
for (const b of ch.blocks || []) {
  if (b.h) p(`### ${b.h}`);
  if (b.text) p(b.text);
  for (const it of b.items || []) p(`- ${it}`);
  p();
}
p('## Boj dne');
const st = s.battle.stats.at(-1);
for (const f of [0, 1]) {
  const a = st.sides[f];
  const fire = Object.entries(a.hits.fire).map(([r, n]) => `${r} ${n}`).join(', ') || 'žádné';
  p(`- **${short(f)}**: zásahy palbou udělené: ${fire}; utržené z pozadí ${a.hits.bg}${a.hits.shell ? `, z bombardování ${a.hits.shell}` : ''}; ` +
    `zranění lehce ${a.sev.light} / těžce ${a.sev.heavy} / kriticky ${a.sev.crit}; padlí ${Object.values(a.deaths).reduce((x, y) => x + y, 0)}; ` +
    `obvaziště: lůžka ${a.beds}, nosítka ${a.stretchers}, těžce raněných v zákopu ${a.trench}; medici pokrývají ${Math.round(a.cover * 100)} %${a.capped ? `; POJISTKA zachránila ${a.capped}` : ''}`);
}
p('\n## Kdo koho trefil a co se stalo raněným');
for (const x of s.soldiers) {
  const b = before.get(x.id);
  if (!b) continue;
  const fresh = x.record.slice(b.len).filter(([d]) => d === s.day).map(([, t]) => t);
  const battle = fresh.filter((t) => /Shot by|across the wire|went down|fired|hit|wounded|stretcher|aid post|bed|medic|died|fell|shell|splinter|bullet|grenade/i.test(t));
  if ((x.generation || 1) > b.gen) p(`- ✝ **@${x.handle}** (${short(x.faction)}) padl ${x.fallen.at(-1).name}; nástupce ${x.name}: ${fresh.join(' / ')}`);
  else if (x.wound?.day === s.day || battle.some((t) => /Shot by|across the wire/.test(t))) p(`- ${x.wound ? { light: 'lehce', heavy: 'TĚŽCE', crit: 'KRITICKY' }[x.wound.sev] : 'střelec'} **@${x.handle}** (${short(x.faction)}, ${x.archetype}): ${battle[0] ?? fresh[0] ?? ''}`);
}
p('\n## Obvaziště');
for (const [f, pub] of battlePublic(s, theme).entries()) {
  p(`- ${short(f)}: na lůžkách ${pub.beds.map((b) => `@${b.handle} (${b.sev})`).join(', ') || 'nikdo'}; na nosítkách ${pub.stretchers.map((b) => `@${b.handle} (${b.sev})`).join(', ') || 'nikdo'}; lehce ranění v zákopu ${pub.walking}`);
}
const text = out.join('\n');
console.log(text);
if (opt('--md')) fs.writeFileSync(opt('--md'), text);
if (opt('--save-state')) fs.writeFileSync(opt('--save-state'), JSON.stringify(s));
