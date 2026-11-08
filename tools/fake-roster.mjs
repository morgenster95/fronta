// Falešná soupiska pro test vieweru: N narukovaných + pár odehraných dní.
// Použití: node tools/fake-roster.mjs 5000 [dní]
import { loadTheme, loadMap, writePublic, saveState, ROOT } from './lib.mjs';
import { emptyState, applyComment, dailyTick } from '../engine/roster.js';
import { mulberry32 } from '../engine/rng.js';
import path from 'node:path';

const N = Number(process.argv[2] || 5000);
const DAYS = Number(process.argv[3] || 6);
const { theme, story } = loadTheme();
const map = loadMap(theme);
const state = emptyState(theme);
const rand = mulberry32(42);
const A = ['dark', 'little', 'the', 'real', 'mr', 'its', 'just', 'old', 'grey', 'iron', 'wild', 'lazy', 'silent', 'lost'];
const B = ['novak', 'svoboda', 'dvorak', 'cerny', 'kral', 'smith', 'muller', 'rossi', 'dubois', 'kowalski', 'jansen', 'larsen', 'garcia', 'horak', 'nemec', 'fox', 'wolf', 'raven', 'baker', 'fisher', 'hunter', 'stone', 'marek', 'tomas', 'jakub', 'lukas'];

const perDay = Math.ceil(N / DAYS);
let n = 0;
for (let d = 1; d <= DAYS; d++) {
  for (let i = 0; i < perDay && n < N; i++, n++) {
    const sep = ['.', '_', '', '_'][Math.floor(rand() * 4)];
    const handle = `${A[Math.floor(rand() * A.length)]}${sep}${B[Math.floor(rand() * B.length)]}${rand() < 0.6 ? Math.floor(rand() * 999) : ''}`;
    const kw = theme.factions[rand() < 0.5 ? 0 : 1].keyword;
    const text = rand() < 0.5 ? kw : `${kw.toLowerCase()} for the win ⚔️`;
    applyComment(state, { id: `c${n}`, userId: `u${n}`, username: `${handle}${n}`, text }, theme, story, map);
  }
  if (d < DAYS) dailyTick(state, theme, story, { activeIds: [] });
}
state.followers = Math.round(N * 1.6);
saveState(state, path.join(ROOT, 'data', 'state.fake.json'));
const roster = writePublic(state, theme);
const cnt = [0, 1].map((f) => state.soldiers.filter((s) => s.faction === f).length);
console.log(`fake: ${roster.soldiers.length} soldiers (H ${cnt[0]} / C ${cnt[1]}), day ${state.day}, capacity ${map.slots[0].length}/${map.slots[1].length}`);
const ex = state.soldiers[7];
console.log(ex.name, ex.sector, ex.unit, '\n ' + ex.record.map((r) => `D${r[0]}: ${r[1]}`).join('\n '));
