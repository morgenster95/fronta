// Trench Dog (21. 11. 2026, uživatel): pes u vojáka pro nejvyšší úroveň podpory na Patreonu. Jen čest a příběhy, žádná výhoda v boji.
// s.dog = { name, breed, since }: jméno se vylosuje (story.dogNames), plemeno z theme.dog.breeds (nebo zadané v příkazu).
// Pes přechází na nástupce v rodu (soldier.js heir), v deníku má vlastní příběhy jen voják, který psa má (story.dog / dogWard / dogHeir).
import { rngFor } from './rng.js';
import { addEntry } from './soldier.js';
import { eventEntry } from './story.js';

const norm = (h) => String(h || '').toLowerCase().replace(/^@/, '');
export const breedName = (theme, id) => theme.dog?.breeds?.find((b) => b.id === id)?.name || 'dog';

export function grantDog(state, theme, story, handle, { breed = null, name = null } = {}) {
  const D = theme.dog;
  const s = state.soldiers.find((x) => x.handle === norm(handle));
  if (!D || !s || s.dog) return null;
  const r = rngFor(theme.id, `dog:${s.handle}`, 0);
  const breeds = D.breeds.map((b) => b.id);
  const b = breeds.includes(breed) ? breed : breeds[Math.floor(r() * breeds.length)];
  const taken = new Set(state.soldiers.filter((x) => x.dog).map((x) => x.dog.name));
  const free = (story.dogNames || ['Rags']).filter((n) => !taken.has(n));
  const pool = free.length ? free : story.dogNames || ['Rags'];
  s.dog = { name: name || pool[Math.floor(r() * pool.length)], breed: b, since: state.day };
  if (s.status !== 'fallen') addEntry(s, state.day, eventEntry('dogArrive', s, state.day, theme, story, { dog: s.dog.name, breed: breedName(theme, b) }));
  return { handle: s.handle, name: s.name, dog: s.dog };
}

// přejmenování psa (patron si vybral jméno): zápis do deníku, staré zápisy zůstávají
export function renameDog(state, theme, story, handle, name) {
  const s = state.soldiers.find((x) => x.handle === norm(handle));
  const nm = String(name || '').trim().slice(0, 24);
  if (!s || !s.dog || !nm || s.dog.name === nm) return null;
  const old = s.dog.name; s.dog.name = nm;
  if (s.status !== 'fallen' && story.dogRename?.length) addEntry(s, state.day, eventEntry('dogRename', s, state.day, theme, story, { dog: nm, oldDog: old, breed: breedName(theme, s.dog.breed) }));
  return { handle: s.handle, old, name: nm };
}

export function revokeDog(state, handle) {
  const s = state.soldiers.find((x) => x.handle === norm(handle));
  if (!s || !s.dog) return null;
  const dog = s.dog; delete s.dog;
  return { handle: s.handle, name: s.name, dog };
}

// denní příběhy psů: jen vojáci se psem, živí (zdraví nebo ranění), s šancí theme.dog.storyChance; zápis se připojí k dnešnímu
export function dogStories(state, theme, story, day, today = null) {
  const D = theme.dog;
  if (!D) return 0;
  let n = 0;
  for (const s of state.soldiers) {
    if (!s.dog || s.status === 'fallen' || s.dog.since === day) continue;
    if (rngFor(s.id, 'dogday', day)() >= (D.storyChance ?? 0.5)) continue;
    const kind = s.status === 'wounded' || s.wound ? 'dogWard' : 'dog';
    if (!story[kind]?.length) continue;
    addEntry(s, day, eventEntry(kind, s, day, theme, story, { dog: s.dog.name, breed: breedName(theme, s.dog.breed) }, today));
    n++;
  }
  return n;
}
