import { addEntry } from './soldier.js';
// Wiring party (theme.battle.wiring): noční oprava drátu dobrovolníky obou stran.
// Otevře ji zveřejněný post s `wiring: true` (ingest/publish.mjs → openWiring); přihláška = komentář s heslem (WIRE) pod tím postem;
// vyhodnocení v příštím denním tahu (battleTick, krok 0): riziko jen z palby hlídek nepřítele ze zákopu (kdo jde ven, nehlídá).
export const W = (theme) => theme.battle?.wiring || null;

// Další post s `wiring: true` téhož dne (např. reel) přihlášky nesmaže: přidá se k otevřené výzvě (open.medias), přihlášky platí pod všemi.
export function openWiring(state, mediaId, day) {
  const o = state.wiring?.open;
  if (o && o.day === day) {
    if (!wiringMedia(state, mediaId)) o.medias = [...(o.medias || []), mediaId];
    return o;
  }
  state.wiring = { ...(state.wiring || {}), open: { day, media: mediaId, ids: [] } };
  return state.wiring.open;
}

// je post (media id) součástí otevřené výzvy?
export function wiringMedia(state, mediaId) {
  const o = state.wiring?.open;
  return !!o && (o.media === mediaId || (o.medias || []).includes(mediaId));
}

// komentář pod otevřeným postem s heslem (celé slovo, velikost písmen nevadí)
export function wiringKeyword(state, theme, comment) {
  const cfg = W(theme), o = state.wiring?.open;
  if (!cfg || !o || !wiringMedia(state, comment.mediaId)) return false;
  return new RegExp(`\\b${cfg.keyword || 'WIRE'}\\b`, 'i').test(comment.text || '');
}

// Nezvěstný, který se přihlásí na wiring party, se vrátí do zákopu (hráč je zjevně „tady“; jinak by na mapě chyběl,
// přestože je přihlášený). Zápis do deníku se jen přidá (addEntry). Vrací true, když se vrátil.
export function returnToWire(state, theme, s) {
  if (s.status !== 'missing') return false;
  s.status = 'active';
  delete s.missingDay;
  const t = W(theme)?.returned || '{name} walked back into {sector} at dusk, covered in mud, and asked for a place on the wiring party.';
  addEntry(s, state.day, t.replaceAll('{name}', s.name).replaceAll('{sector}', s.sector));
  return true;
}

// pojistka: nezvěstní, kteří už jsou mezi přihlášenými (přihláška z doby před returnToWire), se vrátí taky
export function wiringReturns(state, theme) {
  const ids = new Set(state.wiring?.open?.ids || []);
  return state.soldiers.filter((s) => ids.has(s.id) && returnToWire(state, theme, s));
}

// přihláška: ok | returned | already | wounded | fallen | closed
export function joinWiring(state, s, theme) {
  const o = state.wiring?.open;
  if (!o) return 'closed';
  if (s.status === 'fallen') return 'fallen';
  if (s.status === 'captured') return 'captured';
  // těžce a kriticky raněný nejde (bot odpoví, že zůstává v zákopu; uživatel to tak chce), lehce raněný chodí a jít může
  if (s.wound && s.wound.sev !== 'light') return 'wounded';
  if (o.ids.includes(s.id)) return 'already';
  o.ids.push(s.id);
  return theme && returnToWire(state, theme, s) ? 'returned' : 'ok';
}
