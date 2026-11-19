// Podklady pro zpravodajská videa (Front News, široký formát): kdy kdo narukoval během dne, z historie gitu (stav po commitech smyčky).
//   node tools/news-data.mjs <od ISO> <do ISO> <výstup.json>   např. 2026-11-08T17:00:00Z 2026-11-10T13:05:00Z marketing/reels/news1.data.json
// Výstup: { joins: [[čas ISO, handle, frakce]], curve: [[čas ISO, H, C]] }. Jen čtení gitu, stav hry se nemění.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const [from, to, out] = process.argv.slice(2);
const git = (...a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 1 << 28 });
const commits = git('log', '--reverse', `--since=${from}`, `--before=${to}`, '--format=%H %cI', '--', 'data/state.json').trim().split('\n').filter(Boolean).map((l) => l.split(' '));
const seen = new Map(), curve = [];
let last = -1;
for (const [h, t] of commits) {
  let s;
  try { s = JSON.parse(git('show', `${h}:data/state.json`)); } catch { continue; }
  const n = [0, 1].map((f) => s.soldiers.filter((x) => x.faction === f).length);
  if (n[0] + n[1] !== last) { curve.push([t, ...n]); last = n[0] + n[1]; }
  for (const x of s.soldiers) if (!seen.has(x.handle)) seen.set(x.handle, [t, x.handle, x.faction]);
}
fs.writeFileSync(out, JSON.stringify({ from, to, joins: [...seen.values()], curve }));
console.log(`${out}: ${seen.size} nováčků, ${curve.length} bodů křivky`);
