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

// přihláška: ok | already | wounded | fallen | closed
export function joinWiring(state, s) {
  const o = state.wiring?.open;
  if (!o) return 'closed';
  if (s.status === 'fallen') return 'fallen';
  // těžce a kriticky raněný nejde (bot odpoví, že zůstává v zákopu; uživatel to tak chce), lehce raněný chodí a jít může
  if (s.wound && s.wound.sev !== 'light') return 'wounded';
  if (o.ids.includes(s.id)) return 'already';
  o.ids.push(s.id);
  return 'ok';
}
