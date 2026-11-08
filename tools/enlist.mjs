// Ruční odbavení (než bude napojené Instagram API): přidá vojáky ze seznamu "handle FRAKCE".
// Použití: node tools/enlist.mjs "jan.novak CONCORD" "petra_k HEGEMONY"   nebo   node tools/enlist.mjs --file seznam.txt
// Opakované jméno se ignoruje (každý narukuje jen jednou). Pak: npm run build a nasadit.
import fs from 'node:fs';
import { loadTheme, loadMap, loadState, saveState, writePublic } from './lib.mjs';
import { applyComment } from '../engine/roster.js';

const args = process.argv.slice(2);
const lines = args[0] === '--file' ? fs.readFileSync(args[1], 'utf8').split(/\r?\n/) : args;
const { theme, story } = loadTheme();
const map = loadMap(theme);
const state = loadState(theme);
let added = 0;
for (const raw of lines) {
  const [handle, kw] = raw.trim().replace(/^@/, '').split(/[\s,;]+/);
  if (!handle || !kw) continue;
  const res = applyComment(state, { id: `manual-${handle}-${Date.now()}`, userId: handle.toLowerCase(), username: handle, text: kw }, theme, story, map);
  if (res?.type === 'enlist') {
    added++;
    console.log(`+ @${res.soldier.handle} → ${theme.factions[res.soldier.faction].name}, ${res.soldier.sector}, ${res.soldier.unit}`);
  } else console.log(`= @${handle}: přeskočeno (už narukoval, nebo neznámá frakce "${kw}")`);
}
saveState(state);
writePublic(state, theme);
console.log(`hotovo: +${added}, celkem ${state.soldiers.length}`);
