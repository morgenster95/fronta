// Testovací stav pro vyzkoušení webu nanečisto: skutečná soupiska + smyšlení rekruti + N odehraných dní boje.
// Zapíše data/state.fake.json (necommituje se). Pak: FAKE=1 npm run data:build && npx vite → http://localhost:5173
//   node tools/make-test-state.mjs [dní=30] [smyšlených=150]
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, loadTheme, loadMap, loadState } from './lib.mjs';
import { applyComment, dailyTick } from '../engine/roster.js';
import { build } from '../engine/battle.js';

const days = Number(process.argv[2] || 30);
const extra = Number(process.argv[3] || 150);
const { theme, story } = loadTheme();
const map = loadMap(theme);
const real = path.join(ROOT, 'data', 'state.json');
const s = JSON.parse(fs.readFileSync(real, 'utf8'));
s.vote = null;
for (let i = 0; i < extra; i++) {
  applyComment(s, { id: `test-c${i}`, userId: `test-u${i}`, username: `test_recruit_${i}`, text: `${i % 2 ? 'CONCORD' : 'HEGEMONY'}${i % 9 === 0 ? ' medic' : ''}` }, theme, story, map);
}
build(s, theme, 0, 'dugout'); // Hegemonie zvolila nemocnici, Concord ne
for (let d = 0; d < days; d++) {
  if (d === 3 && !s.victories?.length) { // Hegemonie dobude Verdel Ridge (pokud ji rekruti nedobyli sami): 3 dny granáty na Concord
    s.victories = [...(s.victories || []), { id: 'ridge', name: 'Verdel Ridge', faction: 0, day: s.day, hero: s.soldiers[0].handle, from: s.day + 1, to: s.day + 7, barrageTo: s.day + 3, counts: [100, 80] }];
    for (const x of s.soldiers) if (x.faction === 0 && x.status !== 'fallen') x.medals = [...(x.medals || []), 'obj:ridge'];
    s.soldiers[0].titles = [...(s.soldiers[0].titles || []), 'Hero of Verdel Ridge'];
  }
  dailyTick(s, theme, story);
}
fs.writeFileSync(path.join(ROOT, 'data', 'state.fake.json'), JSON.stringify(s));
const houses = s.soldiers.filter((x) => x.fallen?.length).sort((a, b) => b.fallen.length - a.fallen.length);
console.log(`den ${s.day}, vojáků ${s.soldiers.length}, padlých ${s.soldiers.reduce((a, x) => a + (x.fallen?.length || 0), 0)}`);
console.log('rody s padlými (na vyzkoušení):', houses.slice(0, 8).map((x) => `@${x.handle} (${x.generation}. gen)`).join(', '));
