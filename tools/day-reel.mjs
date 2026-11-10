// Podklady pro denní reel „co se stalo“ (web/src/reel-daily.js) ze skutečného stavu PO ranním tahu:
//   node tools/day-reel.mjs [--state soubor]   → marketing/reels/day<N>.data.json (jména, počty, lůžka, výprava)
//                                                 a marketing/reels/day<N>.script.json (věty voiceoveru s časy)
// Výroba videa: bash tools/make-reel.sh day<N> (nebo workflow reel s name=day<N>). Nic nepublikuje.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, loadTheme } from './lib.mjs';
import { gunsSilent } from '../engine/battle.js';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const state = JSON.parse(fs.readFileSync(opt('--state') || path.join(ROOT, 'data', 'state.json'), 'utf8'));
const { theme } = loadTheme();
const day = state.day;
const short = (f) => theme.factions[f].name.replace(/^The /, '');
const role = (id) => (theme.archetypes.find((a) => a.id === id)?.name || id).toLowerCase();
const words = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const say = (n) => words[n] ?? String(n);

const hit = [[], []];
for (const s of state.soldiers) {
  if (s.wound?.day === day) hit[s.faction].push({ handle: s.handle, sev: s.wound.sev, place: s.wound.place || 'trench', by: s.wound.by || null, role: s.archetype });
}
const sevRank = { crit: 0, heavy: 1, light: 2 };
for (const l of hit) l.sort((a, b) => sevRank[a.sev] - sevRank[b.sev]);
// hlavní příběh: nejvážnější zásah palbou (střelec → cíl)
const fire = hit.flat().filter((x) => x.by).sort((a, b) => sevRank[a.sev] - sevRank[b.sev])[0] || null;
const beds = state.battle.sides.map((side) => side.beds.map((id) => state.soldiers.find((s) => s.id === id)?.handle).filter(Boolean));
const stretchers = [0, 1].map((f) => state.soldiers.filter((s) => s.faction === f && s.wound?.place === 'stretcher').map((s) => s.handle));
// obvaziště do záběru: strana s plnějšími lůžky
const focus = beds[0].length >= beds[1].length ? 0 : 1;
const open = state.valley?.open;
const loc = open ? theme.valley?.locations?.find((l) => l.id === open.loc) : null;
const raid = open && open.day === day && loc ? { name: loc.name, short: loc.short || loc.name, kw: (loc.keyword || loc.id).toUpperCase(), seats: theme.valley?.slots ?? 5 } : null;

const sevWord = { light: 'Grazed.', heavy: 'Badly wounded.', crit: 'Gravely wounded.' };
const total = hit[0].length + hit[1].length;
const cap = (t) => t.replace(/(^|\. )([a-z])/g, (m, a, c) => a + c.toUpperCase());
const nb = beds[focus].length;
// [nejdřív v s, věta, id]; story_vo.py (auto) je řadí hned za sebe podle skutečné délky hlasu, reel si časy bere podle id
const lines = [
  [0.6, `Day ${say(day)}.`, 'day'],
  [1.8, gunsSilent(state, theme) ? 'The big guns are silent. The rifles are not.' : 'The guns spoke all night.', 'guns'],
  ...(fire ? [
    [4.6, `A ${short(fire.by.faction)} ${role(fire.by.role)} saw a movement across the wire.`, 'shooter'],
    [0, `One shot. ${sevWord[fire.sev]}`, 'shot'],
  ] : [[4.6, 'Stray rounds. A grenade. The wire. The front takes its toll.', 'shooter']]),
  [0, cap(`${say(total)} men hit by morning. ${say(hit[0].length)} Hegemony, ${say(hit[1].length)} Concord.`), 'count'],
  [0, `The ${short(focus)} aid post has two beds. ${nb >= 2 ? 'Both are taken.' : nb === 1 ? 'One is taken.' : 'Both still empty.'}`, 'aid'],
  [0, nb >= 2 ? 'The next man badly hit waits on a stretcher, in the mud.' : 'When they fill, the badly hit wait on stretchers, in the mud.', 'stretcher'],
  ...(raid ? [[0, `Field HQ wants ${say(raid.seats)} volunteers a side, for a night raid on Saint-Ash. Comment ${raid.kw.toLowerCase()}.`.replace('Saint-Ash', raid.short), 'raid']] : []),
  [0, 'And today, each side votes what to build.', 'vote'],
  [0, 'A hospital, or sandbags.', 'opts'],
  [0, 'Your soldier is your ballot. Link in bio.', 'cta'],
];
const seconds = 60; // horní odhad; skutečnou délku určí hlas (story_vo.py, auto)
const t2 = null;

const data = { day, total, hit, fire, beds, stretchers, focus, raid, seconds, t2, silent: gunsSilent(state, theme) };
const name = `day${day}`;
const dir = path.join(ROOT, 'marketing', 'reels');
fs.writeFileSync(path.join(dir, `${name}.data.json`), JSON.stringify(data, null, 1));
// bubny: start po úvodu, ticho pod obvazištěm, zdvojené ke konci
fs.writeFileSync(path.join(dir, `${name}.script.json`), JSON.stringify({ seconds, auto: true, lines, drums: ['shooter', [['aid', 'raid']], 'vote'] }, null, 1));
console.log(`${name}: ${total} raněných, palba ${fire ? `@${fire.by.handle} → @${fire.handle}` : '—'}, obvaziště ${short(focus)} ${nb}/2, výprava ${raid ? raid.kw : '—'}`);
for (const [, l, id] of lines) console.log(`  ${id.padEnd(9)} ${l}`);
