// Otevře hlasování pod Reelem. Hlasuje se komentářem s klíčovým slovem, vyhodnotí ho další denní tah.
// node tools/open-vote.mjs <mediaId> "Question?" "HOLD|Hold the line|0.7|The line held. The rain did not stop." "ATTACK|Go over the top|1.8|At dawn the whistles blew…"
import { loadTheme, loadState, saveState, writePublic } from './lib.mjs';
import { openVote } from '../engine/roster.js';

const [mediaId, question, ...opts] = process.argv.slice(2);
if (!mediaId || !question || opts.length < 2) {
  console.error('použití: node tools/open-vote.mjs <mediaId> "otázka" "KW|popis|nebezpečí|výsledek" "KW|…"');
  process.exit(1);
}
const options = opts.map((o) => {
  const [kw, label, danger, outcome] = o.split('|');
  return { kw: kw.toUpperCase(), label, danger: Number(danger) || 1, outcome };
});
const { theme } = loadTheme();
const state = loadState(theme);
openVote(state, { mediaId, question, options });
saveState(state);
writePublic(state, theme);
console.log(`hlasování otevřeno pod ${mediaId}: ${options.map((o) => o.kw).join(' / ')}`);
