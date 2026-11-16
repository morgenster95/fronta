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
import { activeObservation, activeBarrage } from '../engine/race.js';

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
// stav před tahem (pro vysvětlení „Proč“): kolik raněných už leželo, kolik střelců a mediků má každá strana
const snap = (f) => {
  const A = s.soldiers.filter((x) => x.faction === f && x.status !== 'fallen');
  const role = (r) => A.filter((x) => x.archetype === r && !x.wound && x.status === 'active').length;
  const W = A.filter((x) => x.wound);
  return { alive: A.length, mg: role('machinegunner'), sniper: role('sniper'), rifle: role('rifleman'), medic: role('medic'),
    light: W.filter((x) => x.wound.sev === 'light').length, heavy: W.filter((x) => x.wound.sev !== 'light').length };
};
const pre = [snap(0), snap(1)];
dailyTick(s, theme, story);
const short = (f) => theme.factions[f].name.replace(/^The /, '');
const out = [];
const p = (l = '') => out.push(l);
p(`# Náhled vydání: Den ${s.day + (theme.dayShift ?? 0)} (hráči vidí; vnitřně ${s.day}) (nový boj, vyvážení v${theme.battle.balance})`);
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

// --- Proč (jen pro uživatele, česky): odkud ztráty každé strany přišly a co je ovlivnilo ---
p('\n## Proč (vysvětlení, jen pro tebe)');
{
  const D = s.day, sumV = (o) => Object.values(o || {}).reduce((x, y) => x + y, 0);
  const obs = activeObservation(s, D), bar = activeBarrage(s, D);
  const ordersOf = (f) => (s.orders || []).filter((o) => o.faction === f && D >= o.from && D <= o.to);
  const CAUSE = { shot: 'kulkou na místě', shell: 'granátem na místě', wounds: 'na těžká zranění', nocare: 'bez péče (těžce raněný se nezahojil, medici nestíhali)', nobed: 'chybělo lůžko nebo nosítka' };
  const row = [0, 1].map((f) => {
    const e = 1 - f, a = st.sides[f], b = st.sides[e];
    const byFire = sumV(b.hits.fire), got = a.sev.light + a.sev.heavy + a.sev.crit, dead = sumV(a.deaths);
    return { f, e, a, byFire, got, dead };
  });
  for (const r of row) {
    const { f, e, a, byFire, got, dead } = r, P = pre[f], E = pre[e];
    p(`### ${short(f)}: ${got} zasažených, ${dead} padlých`);
    const src = [`palba ${short(e)} ${byFire}× (${Object.entries(st.sides[e].hits.fire).map(([k, n]) => `${k} ${n}`).join(', ') || 'nic'})`];
    if (a.hits.shell) src.push(`granáty z bombardování ${a.hits.shell}×`);
    if (a.hits.bg) src.push(`náhodné pozadí (miny, zbloudilé kulky) ${a.hits.bg}×`);
    p(`- **Odkud zásahy:** ${src.join('; ')}.`);
    p(`- **Střelci proti nim (${short(e)}, zdraví):** kulometčíci ${E.mg}, odstřelovači ${E.sniper}, puškaři ${E.rifle} (vlastní: ${P.mg} / ${P.sniper} / ${P.rifle}).`);
    const mods = [];
    if (obs && obs.by === e) mods.push(`${short(e)} drží pozorovatelnu (přesnější a smrtelnější kulomety a odstřelovači, jejich kulomety nepotlačíš)`);
    if (obs && obs.by === f) mods.push(`${short(f)} drží pozorovatelnu (výhoda pro ně)`);
    if (bar && bar.by === e) mods.push(`${short(e)} bombarduje tuto stranu (${bar.name})`);
    for (const o of ordersOf(e)) mods.push(`rozkaz ${short(e)} ${o.kw} (do vnitřního dne ${o.to}) posiluje jejich palbu: ${typeof o.fire === 'number' ? '×' + o.fire : Object.entries(o.fire || {}).map(([k, v]) => `${k} ×${v}`).join(', ') || o.label}`);
    for (const o of ordersOf(f)) mods.push(`vlastní rozkaz ${o.kw} (${o.label})`);
    p(`- **Co to ovlivnilo:** ${mods.join('; ') || 'nic zvláštního (žádná pozorovatelna, bombardování ani rozkaz)'}.`);
    p(`- **Péče:** před tahem leželo ${P.heavy} těžce/kriticky a ${P.light} lehce raněných, zdravých mediků ${P.medic}; medici pokryli ${Math.round(a.cover * 100)} % potřeby${a.trench ? `, ${a.trench} těžce raněných zůstalo v zákopu bez nosítek` : ''}.`);
    if (dead) p(`- **Jak padli:** ${Object.entries(a.deaths).filter(([, n]) => n).map(([k, n]) => `${n} ${CAUSE[k] || k}`).join(', ')}.`);
  }
  // shrnutí: kdo je na tom hůř a hlavní důvod
  const [h, c] = row, worse = h.got + h.dead * 2 >= c.got + c.dead * 2 ? h : c, better = worse === h ? c : h;
  const why = [];
  if (worse.byFire > better.byFire) why.push(`dostali víc palby (${worse.byFire} : ${better.byFire})`);
  if (worse.a.hits.shell > better.a.hits.shell) why.push(`granáty (${worse.a.hits.shell})`);
  if ((worse.a.deaths.nocare || 0) + (worse.a.deaths.nobed || 0) > (better.a.deaths.nocare || 0) + (better.a.deaths.nobed || 0)) why.push(`víc mrtvých z nedostatku péče (${(worse.a.deaths.nocare || 0) + (worse.a.deaths.nobed || 0)})`);
  if (worse.a.cover < better.a.cover - 0.05) why.push(`medici stíhali méně (${Math.round(worse.a.cover * 100)} % : ${Math.round(better.a.cover * 100)} %)`);
  if (obs && obs.by === better.f) why.push('druhá strana drží pozorovatelnu');
  p(`\n**Shrnutí:** hůř je na tom ${short(worse.f)}${why.length ? `, protože ${why.join(', ')}` : ' (rozdíl je jen náhoda)'}.`);
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
