// Společné načítání tématu, stavu a mapy pro Node skripty (build, ingest, denní tah).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateFront } from '../engine/mapgen.js';
import { emptyState, buildPublic } from '../engine/roster.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const THEME_ID = process.env.THEME || 'front-ww1';
// FAKE=1 → pracuje se s falešnou soupiskou (data/state.fake.json), ostrá je data/state.json
export const STATE_FILE = path.join(ROOT, 'data', process.env.FAKE ? 'state.fake.json' : 'state.json');

export function loadTheme(id = THEME_ID) {
  const dir = path.join(ROOT, 'themes', id);
  return {
    theme: JSON.parse(fs.readFileSync(path.join(dir, 'theme.json'), 'utf8')),
    story: JSON.parse(fs.readFileSync(path.join(dir, 'story.json'), 'utf8')),
  };
}

export function loadMap(theme) {
  return generateFront(theme.map);
}

export function loadState(theme, file = STATE_FILE) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : emptyState(theme);
}

export function saveState(state, file = STATE_FILE) {
  fs.writeFileSync(file, JSON.stringify(state));
}

export function writePublic(state, theme, outDir = path.join(ROOT, 'web', 'public', 'data')) {
  const { roster, shards } = buildPublic(state, theme);
  fs.mkdirSync(path.join(outDir, 'records'), { recursive: true });
  fs.writeFileSync(path.join(outDir, 'roster.json'), JSON.stringify(roster));
  shards.forEach((s, i) => fs.writeFileSync(path.join(outDir, 'records', `${i}.json`), JSON.stringify(s)));
  fs.copyFileSync(path.join(ROOT, 'themes', theme.id, 'theme.json'), path.join(outDir, 'theme.json'));
  return roster;
}
