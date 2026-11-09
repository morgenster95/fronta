// Denní tah: nový den na frontě, zápisy do služebních záznamů, osudy, nástupci padlých. Spouští se 1× denně (GitHub Actions).
import { loadTheme, loadState, saveState, writePublic } from '../tools/lib.mjs';
import { dailyTick } from '../engine/roster.js';

const { theme, story } = loadTheme();
const state = loadState(theme);
// Nový den války začíná jednou denně v pevnou hodinu UTC (theme.schedule.editionUtc, ranní noviny pro USA/UK).
// Klíč dne = datum UTC posunuté o tuto hodinu: smyčka i ruční spuštění se nepřekryjí a nezáleží na letním čase.
const H = theme.schedule?.editionUtc ?? 0;
const key = new Date(Date.now() - H * 3600e3).toISOString().slice(0, 10);
if (!state.lastTickKey) {
  // přechod ze starého pravidla (pražská půlnoc): dnešní den už proběhl, další vydání v nejbližší editionUtc
  state.lastTickKey = key;
  if (!process.env.DRY_RUN) saveState(state);
  console.log(`denní tah: přechod na ${H}:00 UTC, další vydání po ${H}:00 UTC`);
  process.exit(0);
}
if (key <= state.lastTickKey && !process.env.FORCE) {
  console.log(`denní tah pro ${key} už proběhl (další v ${H}:00 UTC)`);
  process.exit(0);
}
const before = state.soldiers.reduce((n, s) => n + s.record.length, 0);
// TODO: danger a aktivní hráči z výsledku hlasování a návštěv (zatím výchozí)
dailyTick(state, theme, story, { activeIds: state.soldiers.filter((s) => s.claimed).map((s) => s.id) });
const after = state.soldiers.reduce((n, s) => n + s.record.length, 0);
console.log(`den ${state.day}: ${after - before} nových zápisů, ${state.soldiers.length} vojáků`);
state.lastTickKey = key;
if (!process.env.DRY_RUN) {
  saveState(state);
  writePublic(state, theme);
}
