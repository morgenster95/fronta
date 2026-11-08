// Přegeneruje statická data webu ze stavu (data/state.json, s FAKE=1 z data/state.fake.json).
import { loadTheme, loadState, writePublic } from './lib.mjs';
const { theme } = loadTheme();
const roster = writePublic(loadState(theme), theme);
console.log(`web/public/data: ${roster.soldiers.length} vojáků, den ${roster.day}`);
