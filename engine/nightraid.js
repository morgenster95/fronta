// Noční raid (theme.battle.raid, 18. 11. 2026, uživatel): dobrovolníci obou stran v noci přeběhnou zemi nikoho a vpadnou do nepřátelského zákopu.
// Otevře ho zveřejněný post s `raid: true` (ingest/publish.mjs → openRaid); přihláška = komentář s heslem (RAID) pod tím postem;
// vyhodnocení v příštím denním tahu (battleTick, krok 0b): každý raider zkusí zasáhnout jednoho obránce poblíž svého úseku,
// riziko podle drátu a kulometů nepřítele. Zabití se počítají do závodu o zabití (padlý s `by` raidera).
// Stejný tvar jako wiring party (engine/wiring.js): state.raid = { open: { day, media, medias?, ids }, nights: [...] }
export const RD = (theme) => theme.battle?.raid || null;

export function openRaid(state, mediaId, day) {
  const o = state.raid?.open;
  if (o && o.day === day) {
    if (!raidMedia(state, mediaId)) o.medias = [...(o.medias || []), mediaId];
    return o;
  }
  state.raid = { ...(state.raid || {}), open: { day, media: mediaId, ids: [] } };
  return state.raid.open;
}

export function raidMedia(state, mediaId) {
  const o = state.raid?.open;
  return !!o && (o.media === mediaId || (o.medias || []).includes(mediaId));
}

// komentář pod otevřeným postem s heslem (celé slovo; protahování „RAAAID“ taky)
export function raidCall(state, theme, comment) {
  const cfg = RD(theme), o = state.raid?.open;
  if (!cfg || !o || !raidMedia(state, comment.mediaId)) return false;
  const kw = (cfg.keyword || 'RAID').toUpperCase();
  return (String(comment.text || '').toUpperCase().match(/[A-Z]+/g) || []).some((w) => w.replace(/(.)\1+/g, '$1') === kw.replace(/(.)\1+/g, '$1'));
}

// přihláška: ok | already | wounded | fallen | captured | pilot | closed
export function joinRaid(state, s) {
  const o = state.raid?.open;
  if (!o) return 'closed';
  if (s.status === 'fallen') return 'fallen';
  if (s.status === 'captured') return 'captured';
  if (s.archetype === 'pilot') return 'pilot';
  if (s.wound) return 'wounded'; // na raid jen zdraví
  if (o.ids.includes(s.id)) return 'already';
  o.ids.push(s.id);
  return 'ok';
}
