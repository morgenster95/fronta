// Wiring party (theme.battle.wiring): noční oprava drátu dobrovolníky obou stran.
// Otevře ji zveřejněný post s `wiring: true` (ingest/publish.mjs → openWiring); přihláška = komentář s heslem (WIRE) pod tím postem;
// vyhodnocení v příštím denním tahu (battleTick, krok 0): riziko jen z palby hlídek nepřítele ze zákopu (kdo jde ven, nehlídá).
export const W = (theme) => theme.battle?.wiring || null;

export function openWiring(state, mediaId, day) {
  state.wiring = { ...(state.wiring || {}), open: { day, media: mediaId, ids: [] } };
  return state.wiring.open;
}

// komentář pod otevřeným postem s heslem (celé slovo, velikost písmen nevadí)
export function wiringKeyword(state, theme, comment) {
  const cfg = W(theme), o = state.wiring?.open;
  if (!cfg || !o || comment.mediaId !== o.media) return false;
  return new RegExp(`\\b${cfg.keyword || 'WIRE'}\\b`, 'i').test(comment.text || '');
}

// přihláška: ok | already | wounded | fallen | closed
export function joinWiring(state, s) {
  const o = state.wiring?.open;
  if (!o) return 'closed';
  if (s.status === 'fallen') return 'fallen';
  // ranění se přihlásit můžou (bot jim neodpovídá zamítnutím): lehce raněný jde v noci ven, těžce raněného nepustí medik (zápis v deníku, engine/battle.js)
  if (o.ids.includes(s.id)) return 'already';
  o.ids.push(s.id);
  return 'ok';
}
