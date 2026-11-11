// „Rada fronty“: nejlepší nápady hráčů z komentářů pod postem s `council: true` (marketing/queue.json), podle lajků, zvlášť za každou stranu.
//   node tools/council.mjs [--top 5]       (čte data/voices.json a data/state.json; nic nemění)
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, loadTheme } from './lib.mjs';

const args = process.argv.slice(2);
const top = Number(args[args.indexOf('--top') + 1]) || 5;
const { theme } = loadTheme();
const queue = JSON.parse(fs.readFileSync(path.join(ROOT, 'marketing', 'queue.json'), 'utf8'));
const voices = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'voices.json'), 'utf8'));
const ids = queue.items.filter((i) => i.council && i.published?.id).map((i) => i.published.id);
if (!ids.length) { console.log('Žádný zveřejněný post s council: true.'); process.exit(0); }
const all = ids.flatMap((id) => voices.posts[id] || []);
console.log(`${all.length} nápadů`);
for (const f of [0, 1]) {
  const list = all.filter((v) => v.faction === f).sort((a, b) => (b.likes || 0) - (a.likes || 0) || b.text.length - a.text.length).slice(0, top);
  console.log(`\n== ${theme.factions[f].name} ==`);
  for (const v of list) console.log(`  ♥ ${String(v.likes || 0).padStart(3)}  @${v.handle}: ${v.text.replace(/\s+/g, ' ').slice(0, 200)}`);
}
const none = all.filter((v) => v.faction == null);
if (none.length) console.log(`\n(${none.length} komentářů od lidí bez vojáka se nepočítá)`);
