// Podklady pro reel „Verdel Ridge“ (Den 3: závod rozhodnut, hrdina s medailí, jistota vs. bombardování, hlasy hráčů):
//   node tools/ridge-reel.mjs [--state soubor]  → marketing/reels/ridge.data.json + ridge.script.json
// Výroba: bash tools/make-reel.sh ridge. Před rozhodnutím závodu jde o náhled (vítěz = strana v čele, hrdina = poslední narukovaný);
// ostré video se natáčí až po dobytí kóty (state.victories). Nic nepublikuje.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { ROOT, loadTheme } from './lib.mjs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const state = JSON.parse(fs.readFileSync(opt('--state') || path.join(ROOT, 'data', 'state.json'), 'utf8'));
const { theme } = loadTheme();
const short = (f) => theme.factions[f].name.replace(/^The /, '');
const role = (id) => (theme.archetypes.find((a) => a.id === id)?.name || id).toLowerCase();
const words = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const say = (n) => words[n] ?? String(n);

const v = (state.victories || []).at(-1);
const decided = !!v;
const counts = v ? v.counts : [0, 1].map((f) => state.soldiers.filter((s) => s.faction === f).length - (state.race?.base?.[f] ?? 0)); // skóre závodu v okamžiku výhry
const winner = v ? v.faction : counts[0] >= counts[1] ? 0 : 1;
const loser = 1 - winner;
const objective = v?.name || theme.race.objectives[state.race?.idx ?? 0]?.name || 'Verdel Ridge';
const hero = v ? state.soldiers.find((s) => s.handle === v.hero) : state.soldiers.filter((s) => s.faction === winner).sort((a, b) => b.order - a.order)[0];
// kolik vojáků přibylo od minulého zveřejněného reelu (stav z gitu k tomu času; bez historie aspoň ti z dnešního dne)
const last = JSON.parse(fs.readFileSync(path.join(ROOT, 'marketing', 'reels', 'last-reel.json'), 'utf8'));
const since = opt('--since') || last.since;
let newToday = state.soldiers.filter((s) => s.enlisted === state.day).length;
if (last.soldiers != null && !opt('--since')) newToday = state.soldiers.length - last.soldiers; // počet uložený při posledním reelu (klon v Actions je mělký)
else try {
  const sha = execFileSync('git', ['log', `--before=${since}`, '-1', '--format=%H', '--', 'data/state.json'], { cwd: ROOT, encoding: 'utf8' }).trim();
  const old = JSON.parse(execFileSync('git', ['show', `${sha}:data/state.json`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 }));
  newToday = state.soldiers.length - old.soldiers.length;
} catch (e) { console.warn('baseline z gitu nejde, počítám jen dnešní nábor:', e.message); }
const army = [0, 1].map((f) => state.soldiers.filter((s) => s.faction === f && s.status !== 'dead' && !s.dead).length);

// hlas fronty: nejlepší delší komentář vojáka z vítězné strany (ne jen přihláška)
const voices = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'voices.json'), 'utf8'));
const clean = (t) => t.replace(/@\w+/g, '').replace(/ENLIST-\w+/gi, '').replace(/\s+/g, ' ').trim();
const cands = Object.values(voices.posts).flat().map((c) => ({ ...c, text: clean(c.text), s: state.soldiers.find((x) => x.handle === (c.handle || '').toLowerCase()) }))
  .filter((c) => c.s && c.text.split(' ').length >= 9 && c.text.length <= 170 && !/code/i.test(c.text))
  .sort((a, b) => (b.s.faction === winner) - (a.s.faction === winner) || b.text.length - a.text.length);
const q = cands[0];
const quote = q ? { handle: q.s.handle, faction: q.s.faction, role: q.s.archetype, text: q.text } : null;

const W = short(winner), L = short(loser);
const lines = [
  [0.6, `Day ${say(state.day)}.`, 'day'],
  [0, newToday ? `${say(newToday)} new soldiers joined the front since the last report.` : 'New soldiers keep marching to the front.', 'new'],
  [0, `And the race for ${objective} is over.`, 'race'],
  [0, `The ${W} reached one hundred first.`, 'won'],
  [0, `The deciding soldier was ${hero?.name.replace(/"[^"]*"\s*/, '') || 'a new recruit'}, ${hero ? `a ${role(hero.archetype)}` : ''}. The Medal of Valor is theirs.`.replace(', .', '.'), 'hero'],
  [0, `The ${W} hold the high ground now. A safer week for every one of them.`, 'safe'],
  [0, '~6.5', 'talk'],
  [0, `But the guns of the ridge have turned on the ${L}. Three nights of shelling begin tonight.`, 'guns'],
  [0, '~5', 'bomb'],
  [0, 'Both sides dug hospitals. Will they pay off? One soldier saw the shells coming.', 'voice'],
  [0, '~6.5', 'quote'],
  [0, `${army[0] + army[1]} soldiers hold the line now.`, 'army'],
  [0, `${army[0]} for the Hegemony.`, 'armyH'],
  [0, `${army[1]} for the Concord.`, 'armyC'],
  [0, 'Comment Concord... or Hegemony. Link in bio.', 'cta'],
];
const data = { since, day: state.day, decided, winner, loser, objective, counts, hero: hero ? { handle: hero.handle, name: hero.name, role: hero.archetype } : null, newToday, army, quote };
const dir = path.join(ROOT, 'marketing', 'reels');
fs.writeFileSync(path.join(dir, 'ridge.data.json'), JSON.stringify(data, null, 1));
fs.writeFileSync(path.join(dir, 'ridge.script.json'), JSON.stringify({ seconds: 70, auto: true, lines, drums: ['won', [['talk', 'bomb']], 'guns'] }, null, 1));
console.log(`ridge: ${decided ? 'ROZHODNUTO' : 'NÁHLED (závod běží)'} · vítěz ${W} (${counts.join(':')}) · hrdina ${hero?.name} @${hero?.handle} · nově dnes ${newToday} · hlas ${quote ? '@' + quote.handle + ': ' + quote.text : '—'}`);
for (const [, l, id] of lines) console.log(`  ${id.padEnd(7)} ${l}`);
