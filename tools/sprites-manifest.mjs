// Sestaví manifest spritů vojáků ze SOUBORŮ na disku (bez PixelLabu): stačí nakreslit PNG, uložit je se správným jménem
// do web/public/assets/soldiers/ a spustit `npm run sprites` (manifest + atlas). Jména souborů:
//   <klíč>_<směr>.png                 rotace: klíč = frakce (střelec) nebo frakce_role, směr = south, south-east, east, …
//   <klíč>@<animace>_<směr>_<n>.png   snímky animace (idle, walk, fire, fall), n od 0
// Směry, které chybí, web zrcadlí z protějšku (east ↔ west…); role bez spritů se kreslí jako střelec své strany.
//   node tools/sprites-manifest.mjs [--check]   --check jen porovná s uloženým manifestem (nic nezapíše)
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib.mjs';

const dir = path.join(ROOT, 'web', 'public', 'assets', 'soldiers');
const DIRS = ['south-east', 'south-west', 'north-east', 'north-west', 'south', 'north', 'east', 'west'];
const ORDER = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'];
const file = path.join(dir, 'manifest.json');
const old = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
const found = {};
const ROT = new RegExp(`^(.+)_(${DIRS.join('|')})\\.png$`);
const ANIM = new RegExp(`^(.+)@([a-z0-9]+)_(${DIRS.join('|')})_(\\d+)\\.png$`);
for (const f of fs.readdirSync(dir).sort()) {
  if (!f.endsWith('.png') || f === 'atlas.png' || f.startsWith('aim_')) continue;
  let m = f.match(ANIM);
  if (m) { (((found[m[1]] ??= {}).anims ??= {})[m[2]] ??= {})[m[3]] ??= []; found[m[1]].anims[m[2]][m[3]][Number(m[4])] = f; continue; }
  m = f.match(ROT);
  if (m) { (found[m[1]] ??= {})[m[2]] = f; continue; }
  console.warn(`? ${f}: jméno neodpovídá vzoru, přeskočeno`);
}
// pořadí klíčů a směrů jako v uloženém manifestu (stabilní rozdíly), nové na konec
const keys = [...Object.keys(old).filter((k) => k !== '_v' && found[k]), ...Object.keys(found).filter((k) => !(k in old)).sort()];
const manifest = {};
for (const k of keys) {
  const e = {};
  const dirOrder = [...Object.keys(old[k] || {}).filter((d) => d !== 'anims'), ...ORDER];
  for (const d of dirOrder) if (found[k][d] && !(d in e)) e[d] = found[k][d];
  if (found[k].anims) {
    e.anims = {};
    const animOrder = [...Object.keys(old[k]?.anims || {}), ...Object.keys(found[k].anims).sort()];
    for (const a of animOrder) {
      if (!found[k].anims[a] || e.anims[a]) continue;
      e.anims[a] = {};
      for (const d of [...Object.keys(old[k]?.anims?.[a] || {}), ...ORDER]) {
        const frames = found[k].anims[a][d];
        if (!frames || e.anims[a][d]) continue;
        if (frames.includes(undefined) || [...frames].some((x) => !x)) throw new Error(`${k}@${a}_${d}: chybí některý snímek (číslování musí být 0…n bez mezer)`);
        e.anims[a][d] = frames;
      }
    }
  }
  manifest[k] = e;
}
const same = JSON.stringify({ ...old, _v: 0 }) === JSON.stringify({ ...manifest, _v: 0 });
if (process.argv.includes('--check')) {
  console.log(same ? 'manifest odpovídá souborům' : 'manifest se liší od souborů (spusť npm run sprites)');
  process.exit(same ? 0 : 1);
}
if (same) console.log(`manifest beze změny (${keys.length} klíčů)`);
else {
  manifest._v = Date.now().toString(36); // nová verze = prohlížeče nepoužijí starou mezipaměť
  fs.writeFileSync(file, JSON.stringify(manifest, null, 1));
  const added = keys.filter((k) => !(k in old));
  console.log(`manifest: ${keys.length} klíčů${added.length ? `, nové: ${added.join(', ')}` : ''}`);
}
