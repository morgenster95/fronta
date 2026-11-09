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

// Deník fronty: ručně psané zápisy (data/diary.json) + automatická kronika dne ze stavu. Nejnovější nahoře,
// v rámci dne napřed ruční zápis.
export const DIARY_FILE = path.join(ROOT, 'data', 'diary.json');
export function buildDiary(state) {
  let notes = [];
  try {
    notes = JSON.parse(fs.readFileSync(DIARY_FILE, 'utf8')).entries || [];
  } catch {}
  notes = notes.filter((n) => !n.draft && n.day <= state.day).map((n) => ({ kind: 'note', by: 'Field HQ', ...n }));
  const all = [...notes, ...(state.chronicle || [])];
  return all.sort((a, b) => b.day - a.day || (a.kind === 'note' ? -1 : 1) - (b.kind === 'note' ? -1 : 1)); // celý deník fronty
}

export function writePublic(state, theme, outDir = path.join(ROOT, 'web', 'public', 'data')) {
  const { roster, shards, older, valley } = buildPublic(state, theme);
  const diary = buildDiary(state);
  const latest = diary[0];
  roster.diary = latest ? { day: latest.day, title: latest.title, count: diary.length } : null;
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'diary.json'), JSON.stringify({ updated: new Date().toISOString(), entries: diary }));
  fs.mkdirSync(path.join(outDir, 'records'), { recursive: true });
  fs.writeFileSync(path.join(outDir, 'roster.json'), JSON.stringify(roster));
  if (valley) fs.writeFileSync(path.join(outDir, 'valley.json'), JSON.stringify(valley));
  shards.forEach((s, i) => fs.writeFileSync(path.join(outDir, 'records', `${i}.json`), JSON.stringify(s)));
  fs.mkdirSync(path.join(outDir, 'records-old'), { recursive: true });
  older.forEach((s, i) => fs.writeFileSync(path.join(outDir, 'records-old', `${i}.json`), JSON.stringify(s)));
  fs.copyFileSync(path.join(ROOT, 'themes', theme.id, 'theme.json'), path.join(outDir, 'theme.json'));
  return roster;
}
