// Společné načítání tématu, stavu a mapy pro Node skripty (build, ingest, denní tah).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateFront } from '../engine/mapgen.js';
import { emptyState, buildPublic } from '../engine/roster.js';
import { hashString } from '../engine/rng.js';
import { execFileSync } from 'node:child_process';

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

// Stav hry se ukládá ve dvou částech, aby `state.json` nerostl do desítek MB (GitHub odmítne soubor nad 100 MB):
//   data/state.json              všechno kromě zápisů vojáků (u vojáka jen počet zápisů `recN`)
//   data/state-records/NNN.json  zápisy vojáků po dávkách { handle: [[den, text], …] } (128 dávek podle handle; přepíšou se jen změněné soubory)
// Deníky jsou nedotknutelné: zápisy se jen přidávají. Pojistka: když se zápisy vojáka nenačtou celé (počet nesedí s `recN`), načtení spadne
// a nic se neuloží, takže se deník nemůže omylem zkrátit. Starý formát (zápisy přímo ve state.json) se načte a při prvním uložení převede.
export const REC_SHARDS = 128;
export const recordsDir = (file = STATE_FILE) => file.replace(/\.json$/, '') + '-records';
const recFile = (dir, i) => path.join(dir, `${String(i).padStart(3, '0')}.json`);

function attachRecords(st, readShard) {
  if (!st.soldiers?.some((s) => s.record === undefined)) return st;
  const cache = new Map();
  for (const s of st.soldiers) {
    if (s.record !== undefined) continue;
    const i = hashString(s.handle) % REC_SHARDS;
    if (!cache.has(i)) cache.set(i, readShard(i) ?? {});
    const rec = cache.get(i)[s.handle] ?? [];
    if (s.recN != null && rec.length !== s.recN) {
      throw new Error(`Zápisy vojáka ${s.handle} se nenačetly celé (${rec.length} z ${s.recN}). Stav se neukládá, aby se deník neztratil.`);
    }
    s.record = rec;
    delete s.recN;
  }
  return st;
}

export function loadState(theme, file = STATE_FILE) {
  if (!fs.existsSync(file)) return emptyState(theme);
  const dir = recordsDir(file);
  return attachRecords(JSON.parse(fs.readFileSync(file, 'utf8')), (i) => {
    const f = recFile(dir, i);
    return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
  });
}

// Stav z gitu (náhledy, simulace): `git show <ref>:data/state.json` a dávky zápisů z téhož commitu.
export function stateFromGit(ref = 'origin/main') {
  const show = (p) => execFileSync('git', ['show', `${ref}:${p}`], { cwd: ROOT, maxBuffer: 1 << 29 }).toString();
  return attachRecords(JSON.parse(show('data/state.json')), (i) => {
    try { return JSON.parse(show(`data/state-records/${String(i).padStart(3, '0')}.json`)); } catch { return null; }
  });
}

// Ukládání po částech se zapíná proměnnou SPLIT_STATE=1 (workflow front-loop) nebo tím, že složka dávek už existuje (po převodu).
// Bez toho se ukládá po staru (zápisy ve state.json), aby běžící starší smyčka, která dávky nepřidává do gitu, nemohla zápisy ztratit.
export function saveState(state, file = STATE_FILE) {
  const dir = recordsDir(file);
  if (process.env.SPLIT_STATE !== '1' && !fs.existsSync(dir)) {
    fs.writeFileSync(file, JSON.stringify(state));
    return;
  }
  fs.mkdirSync(dir, { recursive: true });
  const shards = Array.from({ length: REC_SHARDS }, () => ({}));
  for (const s of [...state.soldiers].sort((a, b) => (a.handle < b.handle ? -1 : 1))) shards[hashString(s.handle) % REC_SHARDS][s.handle] = s.record;
  // nejdřív zápisy (jen změněné dávky), až potom stav: kdyby uložení spadlo uprostřed, state.json zůstane starý a úplný
  shards.forEach((obj, i) => {
    const text = JSON.stringify(obj), f = recFile(dir, i);
    if (!fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== text) fs.writeFileSync(f, text);
  });
  const slim = { ...state, soldiers: state.soldiers.map(({ record, ...rest }) => ({ ...rest, recN: record.length })) };
  fs.writeFileSync(file, JSON.stringify(slim));
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
  const { roster, shards, older, valley, boards, honour } = buildPublic(state, theme);
  const diary = buildDiary(state);
  const latest = diary[0];
  roster.diary = latest ? { day: latest.day, title: latest.title, count: diary.length } : null;
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'diary.json'), JSON.stringify({ updated: new Date().toISOString(), entries: diary }));
  fs.mkdirSync(path.join(outDir, 'records'), { recursive: true });
  fs.writeFileSync(path.join(outDir, 'roster.json'), JSON.stringify(roster));
  if (valley) fs.writeFileSync(path.join(outDir, 'valley.json'), JSON.stringify(valley));
  fs.writeFileSync(path.join(outDir, 'boards.json'), JSON.stringify({ day: state.day, ...boards }));
  fs.writeFileSync(path.join(outDir, 'honour.json'), JSON.stringify({ day: state.day, fallen: honour }));
  shards.forEach((s, i) => fs.writeFileSync(path.join(outDir, 'records', `${i}.json`), JSON.stringify(s)));
  fs.mkdirSync(path.join(outDir, 'records-old'), { recursive: true });
  older.forEach((s, i) => fs.writeFileSync(path.join(outDir, 'records-old', `${i}.json`), JSON.stringify(s)));
  fs.copyFileSync(path.join(ROOT, 'themes', theme.id, 'theme.json'), path.join(outDir, 'theme.json'));
  return roster;
}
