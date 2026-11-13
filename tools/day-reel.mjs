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
// padlí dne (nástupce už stojí na stanovišti, padlý je v s.fallen); smrtelný výstřel má přednost před zraněním
const fallen = [];
for (const s of state.soldiers) for (const f of s.fallen || []) if (f.day === day) fallen.push({ handle: s.handle, faction: s.faction, name: f.name.replace(/"[^"]*"\s*/g, ''), role: f.archetype, cause: f.cause || {}, heir: s.name.replace(/"[^"]*"\s*/g, '') });
const fallBy = [0, 1].map((f) => fallen.filter((x) => x.faction === f));
const kill = fallen.find((x) => x.cause.by && state.soldiers.some((q) => q.handle === x.cause.by));
const killer = kill && state.soldiers.find((q) => q.handle === kill.cause.by);
const fire = kill ? { handle: kill.handle, sev: 'killed', place: 'fallen', role: kill.role, by: { handle: killer.handle, name: killer.name, role: killer.archetype, faction: killer.faction } }
  : hit.flat().filter((x) => x.by).sort((a, b) => sevRank[a.sev] - sevRank[b.sev])[0] || null;
// závod o další kótu (počty od začátku závodu), dopisy na dnešní noc, bombardování, nováčci od vydání
const obj = theme.race?.objectives?.[state.race?.idx ?? 0];
const raceN = [0, 1].map((f) => state.soldiers.filter((s) => s.faction === f).length - (state.race?.base?.[f] ?? 0));
const race = obj && state.race?.idx > 0 ? { name: obj.name, counts: raceN, lead: raceN[0] >= raceN[1] ? 0 : 1, goal: theme.race.goal ?? 100 } : null;
const letters = state.soldiers.filter((s) => s.letter === day && s.status !== 'fallen').length;
const vic = (state.victories || []).at(-1);
const shelled = vic && vic.barrageTo >= day + 1 ? { side: 1 - vic.faction, nights: vic.barrageTo - day, from: vic.name } : null;
const newSince = state.soldiers.filter((s) => s.enlisted === day).length;
const voteOpen = !!state.vote?.mediaId;
// přírůstek hráčů za včerejší den (půlnoc–půlnoc UTC), spočtený předem z gitu: marketing/reels/day<N>.joined.json
const jf = path.join(ROOT, 'marketing', 'reels', `day${day}.joined.json`);
const joined = fs.existsSync(jf) ? JSON.parse(fs.readFileSync(jf, 'utf8')).joined : null;
const beds = state.battle.sides.map((side) => side.beds.map((id) => state.soldiers.find((s) => s.id === id)?.handle).filter(Boolean));
const stretchers = [0, 1].map((f) => state.soldiers.filter((s) => s.faction === f && s.wound?.place === 'stretcher').map((s) => s.handle));
// obvaziště do záběru: strana s plnějšími lůžky
const focus = beds[0].length >= beds[1].length ? 0 : 1;
const open = state.valley?.open;
const loc = open ? theme.valley?.locations?.find((l) => l.id === open.loc) : null;
const raid = open && open.day === day && loc ? { name: loc.name, short: loc.short || loc.name, kw: (loc.keyword || loc.id).toUpperCase(), seats: theme.valley?.slots ?? 5 } : null;

// počet hráčů na frontě patří do každého denního reelu (i do popisku)
const army = [0, 1].map((f) => state.soldiers.filter((s) => s.faction === f && s.status !== 'dead' && !s.dead).length);
const sevWord = { light: 'Grazed.', heavy: 'Badly wounded.', crit: 'Gravely wounded.', killed: 'The ' + (fire ? short(1 - fire.by.faction) : '') + ` ${fire ? role(fire.role) : ''} never got up.` };
const total = hit[0].length + hit[1].length + fallen.length;
const hitN = [0, 1].map((f) => hit[f].length + fallBy[f].length);
const numWord = (n) => (n < 13 ? say(n) : n < 20 ? ['thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'][n - 13]
  : n < 100 ? ['twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'][Math.floor(n / 10) - 2] + (n % 10 ? '-' + words[n % 10] : '') : String(n));
const stretchN = stretchers[focus].length;
const cap = (t) => t.replace(/(^|\. )([a-z])/g, (m, a, c) => a + c.toUpperCase());
const nb = beds[focus].length;
// [nejdřív v s, věta, id]; story_vo.py (auto) je řadí hned za sebe podle skutečné délky hlasu, reel si časy bere podle id
const lines = [
  [0.6, `Day ${say(day)}.`, 'day'],
  [1.8, shelled ? `The guns of ${shelled.from} fired all night. On the ${short(shelled.side)}.` : gunsSilent(state, theme) ? 'The big guns are silent. The rifles are not.' : 'The guns spoke all night.', 'guns'],
  ...(fire ? [
    [4.6, shelled && fire.by.faction === shelled.side ? `But the ${short(fire.by.faction)} fired back. One ${role(fire.by.role)} saw a movement across the wire.` : `A ${short(fire.by.faction)} ${role(fire.by.role)} saw a movement across the wire.`, 'shooter'],
    [0, `One shot. ${sevWord[fire.sev]}`, 'shot'],
  ] : [[4.6, 'Stray rounds. A grenade. The wire. The front takes its toll.', 'shooter']]),
  [0, cap(`${numWord(total)} men hit by morning. ${numWord(hitN[0])} Hegemony, ${numWord(hitN[1])} Concord.`), 'count'],
  ...(fallen.length ? [[0, cap(`${say(fallen.length)} of them fell. ${fallBy[0].length && fallBy[1].length ? `${say(Math.max(...fallBy.map((l) => l.length)))} ${short(fallBy[0].length >= fallBy[1].length ? 0 : 1)}.` : ''} Their families sent the next in line.`), 'fallen']] : []),
  [0, nb >= 4 ? 'Both hospitals are full. Every bed is taken.' : `The ${short(focus)} aid post has ${say(beds[focus].length)} ${nb === 1 ? 'bed' : 'beds'} taken.`, 'aid'],
  [0, stretchN ? cap(`${numWord(stretchN)} ${short(focus)} wounded wait on stretchers, in the mud.`) : 'When they fill, the badly hit wait on stretchers, in the mud.', 'stretcher'],
  ...(race ? [
    [0, `And a new race has begun. ${race.name}.`, 'race'],
    [0, `${short(race.lead)} ${numWord(race.counts[race.lead])}. ${short(1 - race.lead)} ${numWord(race.counts[1 - race.lead])}. First to one hundred takes the hill.`, 'raceN'],
  ] : []),
  ...(shelled ? [[0, `Tonight the guns fire again. ${say(shelled.nights)} more ${shelled.nights === 1 ? 'night' : 'nights'} of shelling for the ${short(shelled.side)}.`.replace(/(\. )([a-z])/, (m, a, c) => a + c.toUpperCase()), 'tonight']] : []),
  [0, 'New at the front: a letter from home.', 'letter'],
  [0, `Open your soldier's card and send one. It keeps your soldier fifteen percent safer for one night.${letters > 1 ? ` ${cap(numWord(letters))} letters are already on the way.` : ''}`, 'letter2'],
  ...(joined ? [[0, `Yesterday, ${joined[0] + joined[1]} new soldiers came up the line. ${joined[0]} Hegemony, ${joined[1]} Concord.`, 'joined']] : []),
  [0, `${army[0] + army[1]} soldiers hold the line now.`, 'army'],
  [0, `${army[0]} for the Hegemony.`, 'armyH'],
  [0, `${army[1]} for the Concord.`, 'armyC'],
  ...(raid ? [[0, `Field HQ wants ${say(raid.seats)} volunteers a side, for a night raid on Saint-Ash. Comment ${raid.kw.toLowerCase()}.`.replace('Saint-Ash', raid.short), 'raid']] : []),
  ...(voteOpen ? [[0, 'And today, each side votes what to build.', 'vote'], [0, 'A hospital, or sandbags.', 'opts']] : []),
  [0, 'Comment Concord... or Hegemony. Link in bio.', 'cta'],
];
const seconds = 90; // horní odhad; skutečnou délku určí hlas (story_vo.py, auto)
const t2 = null;

const data = { day, army, total, hitN, hit, fire, fallen, fallBy: fallBy.map((l) => l.length), beds, stretchers, focus, raid, race, letters, shelled, newSince, joined, seconds, t2, silent: gunsSilent(state, theme) };
const name = `day${day}`;
const dir = path.join(ROOT, 'marketing', 'reels');
fs.writeFileSync(path.join(dir, `${name}.data.json`), JSON.stringify(data, null, 1));
// bubny: start po úvodu, ticho pod obvazištěm, zdvojené ke konci
fs.writeFileSync(path.join(dir, `${name}.script.json`), JSON.stringify({ seconds, auto: true, lines, drums: ['shooter', [['letter', 'army']], 'army'] }, null, 1));
console.log(`${name}: ${total} raněných, palba ${fire ? `@${fire.by.handle} → @${fire.handle}` : '—'}, obvaziště ${short(focus)} ${nb}/2, výprava ${raid ? raid.kw : '—'}`);
for (const [, l, id] of lines) console.log(`  ${id.padEnd(9)} ${l}`);
