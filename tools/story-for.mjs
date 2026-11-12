// Ke KAŽDÉMU příspěvku nebo reelu ve frontě přidá story (pravidlo uživatele, 2026-11-12): obrázek 1080×1920 + položka `story-<id>` v marketing/queue.json
// (čas = čas příspěvku + 10 min, nebo --at ISO). Udělej to před zveřejněním (zveřejněné video se z repa po hodině maže).
//   node tools/story-for.mjs <id> [--at 2026-11-12T18:10:00Z] [--frame 4] [--still snimek.png] [--title "TEXT"]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT } from './lib.mjs';

const args = process.argv.slice(2);
const id = args[0];
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
if (!id) { console.error('použití: node tools/story-for.mjs <id> [--at ISO] [--frame s] [--title TEXT]'); process.exit(1); }
const qf = path.join(ROOT, 'marketing', 'queue.json');
const q = JSON.parse(fs.readFileSync(qf, 'utf8'));
const it = q.items.find((i) => i.id === id);
if (!it) { console.error(`položka ${id} není ve frontě`); process.exit(1); }
const promo = path.join(ROOT, 'marketing', 'promo');
const file = it.files[0];
const out = `story_${id}.jpg`;
let src = path.join(promo, file), kind = 'post';
if (/\.mp4$/i.test(file)) {
  kind = 'reel';
  src = opt('--still') ? path.resolve(opt('--still')) : path.join(promo, `_frame_${id}.png`); // --still = čistý snímek (180×320 ze záběru nebo 1080×1920)
  if (!opt('--still')) execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', opt('--frame') || '4', '-i', path.join(promo, file), '-frames:v', '1', src]);
}
execFileSync(process.env.PYTHON || 'python3', [path.join(ROOT, 'marketing', 'make_story.py'), src, path.join(promo, out), kind, ...(opt('--title') ? [opt('--title')] : [])], { stdio: 'inherit' });
if (kind === 'reel' && !opt('--still')) fs.unlinkSync(src);
const at = opt('--at') || (it.publishAt ? new Date(Date.parse(it.publishAt) + 10 * 60e3).toISOString().replace(/\.\d+Z$/, 'Z') : null);
q.items = q.items.filter((i) => i.id !== `story-${id}`);
q.items.push({ id: `story-${id}`, type: 'story', files: [out], caption: '', ...(at ? { publishAt: at } : {}), _note: `Story k položce ${id} (pravidlo: ke každé novince i story). ${at ? '' : 'Bez publishAt se nezveřejní.'}` });
fs.writeFileSync(qf, JSON.stringify(q, null, 2) + '\n');
console.log(`story-${id}: ${out}${at ? ` · ${at}` : ' (bez termínu)'}`);
