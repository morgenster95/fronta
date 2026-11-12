// Podklady pro příspěvek a video RIP (první padlí bombardování): padlí zadaného dne (výchozí poslední tah) ze stavu hry.
//   node tools/rip-data.mjs [--day 4] [--state soubor]  → marketing/reels/rip.data.json + rip.script.json (hlas k videu)
// Nic nepublikuje. V popisku na Instagramu se hráči neoznačují (jména bez zavináče).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, loadTheme, loadState } from './lib.mjs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const { theme } = loadTheme();
const st = opt('--state') ? loadState(theme, opt('--state')) : JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'state.json'), 'utf8'));
const day = Number(opt('--day')) || st.day;
const short = (f) => theme.factions[f].name.replace(/^The /, '');
const words = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const say = (n) => words[n] ?? String(n);
const clean = (n) => String(n || '').replace(/"[^"]*"\s*/g, '').trim();

const fallen = [];
for (const s of st.soldiers) for (const f of s.fallen || []) if (f.day === day) fallen.push({ name: clean(f.name), faction: s.faction, handle: s.handle, role: f.archetype, shell: !!f.cause?.shell, heir: clean(s.name), house: s.family, gen: s.generation || 2, heirRole: s.archetype });
const by = [0, 1].map((f) => fallen.filter((x) => x.faction === f));
const lead = by[0].length >= by[1].length ? 0 : 1; // strana s nejvíc padlými
const wounded = [0, 1].map((f) => st.soldiers.filter((s) => s.faction === f && s.wound).length);
const army = [0, 1].map((f) => st.soldiers.filter((s) => s.faction === f && s.status !== 'dead').length);
const surnames = by[lead].map((x) => x.name.split(/\s+/).pop().toUpperCase());
const first = by[lead][0] || null; // nástupce prvního padlého ukazuje filmový záběr „nástup nového vojáka“ a rodokmen
const data = { day, heirs: first ? { fallen: first.name, heir: first.heir, house: first.house, gen: first.gen } : null, fallen, byCount: by.map((l) => l.length), lead, leadName: short(lead), wounded, army, names: surnames, shelled: fallen.filter((x) => x.shell).length };
const dir = path.join(ROOT, 'marketing', 'reels');
fs.writeFileSync(path.join(dir, 'rip.data.json'), JSON.stringify(data, null, 1));
const n = by[lead].length;
const full = by[lead].slice(0, 4).map((x) => x.name);
const other = by[1 - lead];
const lines = [
  [0.8, `Night ${say(Math.max(1, day - (st.victories?.at(-1)?.day ?? day)))}. The guns of the ridge never stopped.`, 'night'],
  [0, n ? `${say(n)} ${n === 1 ? 'man' : 'men'} of the ${short(lead)} did not see the morning.` : `The ${short(lead)} lines held. This time.`, 'fell'],
  ...(n ? [[0, `${full.join('. ')}${by[lead].length > 4 ? `. And ${say(by[lead].length - 4)} more` : ''}.${other.length ? ` The ${short(1 - lead)} buried ${say(other.length)} too.` : ''}`, 'names']] : []),
  ...(first ? [
    [0, 'But no name dies out here.', 'heir'],
    [0, `That same night, ${first.heir} reports for duty. The next of the family picks up the rifle.`, 'heir2'],
    [0, `Every family keeps a tree. Every fall is written in it. Open your soldier's card, and read your house.`, 'tree'],
  ] : []),
  [0, 'Comment Concord... or Hegemony. Link in bio.', 'cta'],
];
fs.writeFileSync(path.join(dir, 'rip.script.json'), JSON.stringify({ seconds: 40, auto: true, lines, drums: ['night', [['fell', 'cta']], 'cta'] }, null, 1));
console.log(`RIP Den ${day}: padlí ${short(0)} ${by[0].length}, ${short(1)} ${by[1].length}; ranění ${wounded.join('/')}; jména: ${data.names.join(', ') || '—'}`);
