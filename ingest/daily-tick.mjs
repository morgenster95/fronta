// Denní tah: nový den na frontě, zápisy do služebních záznamů, osudy, nástupci padlých. Spouští se 1× denně (GitHub Actions).
import { loadTheme, loadState, saveState, writePublic } from '../tools/lib.mjs';
import { dailyTick } from '../engine/roster.js';

const { theme, story } = loadTheme();
const state = loadState(theme);
const before = state.soldiers.reduce((n, s) => n + s.record.length, 0);
// TODO: danger a aktivní hráči z výsledku hlasování a návštěv (zatím výchozí)
dailyTick(state, theme, story, { activeIds: state.soldiers.filter((s) => s.claimed).map((s) => s.id) });
const after = state.soldiers.reduce((n, s) => n + s.record.length, 0);
console.log(`den ${state.day}: ${after - before} nových zápisů, ${state.soldiers.length} vojáků`);
if (!process.env.DRY_RUN) {
  saveState(state);
  writePublic(state, theme);
}
