// Otevře hlasování pod Reelem. Hlasuje se komentářem s klíčovým slovem, vyhodnotí ho další denní tah.
// node tools/open-vote.mjs <mediaId> "Question?" "HOLD|Hold the line|0.7|The line held." "BARRAGE|Shell their lines|1.4|The guns spoke all night.|barrage|0"
// 5. pole = efekt (barrage = bombardování, jen když je odemčené), 6. pole = cílová frakce (0 hegemony, 1 concord)
import { loadTheme, loadState, saveState, writePublic } from './lib.mjs';
import { openVote, unlocks } from '../engine/roster.js';

const [mediaId, question, ...opts] = process.argv.slice(2);
if (!mediaId || !question || opts.length < 2) {
  console.error('použití: node tools/open-vote.mjs <mediaId> "otázka" "KW|popis|nebezpečí|výsledek" "KW|…"');
  process.exit(1);
}
const options = opts.map((o) => {
  const [kw, label, danger, outcome, effect, target] = o.split('|');
  return { kw: kw.toUpperCase(), label, danger: Number(danger) || 1, outcome, ...(effect ? { effect, target: Number(target) || 0 } : {}) };
});
const { theme } = loadTheme();
const state = loadState(theme);
for (const o of options.filter((x) => x.effect)) {
  const u = unlocks(state, theme).find((x) => x.id === o.effect);
  if (u && !u.open) {
    console.error(`${o.effect} ještě není odemčené: ${u.have}/${u.need} převzatých vojáků`);
    process.exit(1);
  }
}
openVote(state, { mediaId, question, options });
saveState(state);
writePublic(state, theme);
console.log(`hlasování otevřeno pod ${mediaId}: ${options.map((o) => o.kw).join(' / ')}`);
