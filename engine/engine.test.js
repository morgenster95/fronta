import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { generateFront } from './mapgen.js';
import { emptyState, applyComment, parseComment, dailyTick } from './roster.js';

const theme = JSON.parse(fs.readFileSync(new URL('../themes/front-ww1/theme.json', import.meta.url)));
const story = JSON.parse(fs.readFileSync(new URL('../themes/front-ww1/story.json', import.meta.url)));
const map = generateFront(theme.map);

test('mapa je deterministická a má místa pro obě frakce', () => {
  const again = generateFront(theme.map);
  assert.equal(Buffer.compare(Buffer.from(map.grid), Buffer.from(again.grid)), 0);
  assert.ok(map.slots[0].length > 1500 && map.slots[1].length > 1500);
});

test('komentář s klíčovým slovem narukuje, podruhé ne', () => {
  const s = emptyState(theme);
  const r = applyComment(s, { id: 'c1', userId: 'u1', username: 'Jan.Novak', text: 'concord!!' }, theme, story, map);
  assert.equal(r.type, 'enlist');
  assert.equal(r.soldier.faction, 1);
  assert.equal(r.soldier.family, 'Novak');
  assert.ok(r.soldier.record[0][1].length > 20);
  assert.equal(applyComment(s, { id: 'c2', userId: 'u1', username: 'jan.novak', text: 'HEGEMONY' }, theme, story, map), null);
  assert.equal(applyComment(s, { id: 'c1', userId: 'u1', username: 'jan.novak', text: 'concord' }, theme, story, map), null);
});

test('kód pro převzetí se rozpozná', () => {
  assert.deepEqual(parseComment('here: enlist-7kq2 :)', theme), { type: 'claim', code: 'ENLIST-7KQ2' });
  assert.equal(parseComment('nice reel', theme), null);
});

test('denní tah přidá zápisy a v textech nezůstanou zástupné znaky', () => {
  const s = emptyState(theme);
  for (let i = 0; i < 300; i++) applyComment(s, { id: `c${i}`, userId: `u${i}`, username: `user${i}`, text: i % 2 ? 'CONCORD' : 'HEGEMONY' }, theme, story, map);
  for (let d = 0; d < 30; d++) dailyTick(s, theme, story);
  const all = s.soldiers.flatMap((x) => x.record.map((r) => r[1]));
  assert.ok(all.length > 300);
  assert.ok(!all.some((t) => /\{\w+\}/.test(t)), all.find((t) => /\{\w+\}/.test(t)));
});

test('při zaplnění se otevřou další sektory a nikdo se nepřesune', () => {
  const s = emptyState(theme);
  const first = [];
  for (let i = 0; i < 2600; i++) {
    const r = applyComment(s, { id: `c${i}`, userId: `u${i}`, username: `p${i}`, text: 'CONCORD' }, theme, story, map);
    if (i < 50) first.push([r.soldier, r.soldier.slot]);
  }
  assert.ok(s.openSectors > 8);
  for (const [sol, slot] of first) assert.equal(sol.slot, slot);
  const slots = s.soldiers.map((x) => x.pos.join(','));
  assert.equal(new Set(slots).size, slots.length, 'dva vojáci na jednom místě');
});
