// Samostatný editor spritů pro PC: jeden soubor, otevře se dvojklikem (bez serveru, bez internetu).
// Referenční sprity z hry (vojáci, rekvizity, místa) se vloží přímo do souboru.
//   node tools/build-editor.mjs [výstup]      výchozí: editor-pc/sprite-editor.html (mimo git)
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib.mjs';

const pub = path.join(ROOT, 'web/public');
const out = process.argv[2] || path.join(ROOT, 'editor-pc/sprite-editor.html');
let html = fs.readFileSync(path.join(pub, 'editor/index.html'), 'utf8');

const embed = {};
for (const dir of ['soldiers', 'props', 'locations']) {
  const d = path.join(pub, 'assets', dir);
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (f.endsWith('.png')) embed[`${dir}/${f}`] = 'data:image/png;base64,' + fs.readFileSync(p).toString('base64');
    else if (f === 'manifest.json') embed[`${dir}/${f}`] = 'data:application/json;base64,' + fs.readFileSync(p).toString('base64');
  }
}
const subs = [
  ["fetch('/assets/soldiers/manifest.json'", "fetch(asset('soldiers/manifest.json')"],
  ["loadImg('/assets/soldiers/concord_south.png')", "loadImg(asset('soldiers/concord_south.png'))"],
  ["const refSrc = () => '/assets/' + $('refFrame').value;", "const refSrc = () => asset($('refFrame').value);"],
  ["loadImg('/assets/' + f)", "loadImg(asset(f))"],
];
for (const [a, b] of subs) {
  if (!html.includes(a)) throw new Error('v editoru chybí očekaný řetězec: ' + a);
  html = html.split(a).join(b);
}
const head = `<script>const EMBED = ${JSON.stringify(embed)}; const asset = (p) => EMBED[p] || ('/assets/' + p);</script>\n`;
const i = html.lastIndexOf('<script');
html = html.slice(0, i) + head + html.slice(i);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`${out}: ${(html.length / 1e6).toFixed(1)} MB, ${Object.keys(embed).length} souborů`);
