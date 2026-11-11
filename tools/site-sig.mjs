// Otisk toho, co návštěvník na webu uvidí: kód webu + veřejná data BEZ časových razítek.
// Smyčka nasazuje jen při změně otisku (dřív při každém commitu stavu = stovky zbytečných nasazení denně;
// každé nasazení je nová verze na Firebase Hosting a zabírá místo z 10 GB limitu).
//   node tools/site-sig.mjs   → vypíše otisk (40 znaků)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { ROOT } from './lib.mjs';

const h = crypto.createHash('sha1');
// kód a téma: hash stromů v gitu (rychlé, nezávislé na buildu)
for (const p of ['web', 'engine', 'themes', 'package-lock.json', 'vite.config.js', 'firebase.json']) {
  try { h.update(execFileSync('git', ['rev-parse', `HEAD:${p}`], { cwd: ROOT }).toString()); } catch { h.update(`-${p}`); }
}
const VOLATILE = new Set(['updated']); // mění se při každém buildu, na obsahu nic nemění
const strip = (v) => (Array.isArray(v) ? v.map(strip) : v && typeof v === 'object'
  ? Object.fromEntries(Object.entries(v).filter(([k]) => !VOLATILE.has(k)).map(([k, x]) => [k, strip(x)])) : v);
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
  .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
const data = path.join(ROOT, 'web', 'public', 'data');
for (const f of fs.existsSync(data) ? walk(data) : []) {
  h.update(path.relative(data, f));
  const raw = fs.readFileSync(f);
  try { h.update(JSON.stringify(strip(JSON.parse(raw)))); } catch { h.update(raw); }
}
console.log(h.digest('hex'));
