// Souboj komentářů „counter-battery“ (16. 11. 2026, na přání uživatele: něco svižného, co každý okomentuje):
// pod postem s `shells` je KAŽDÝ komentář jeden granát pro stranu, ke které komentující patří (voják; nováček narukuje heslem strany
// v tom komentáři a jeho granát se počítá taky). Bez stropu (kolik komentářů, tolik střel; `cap` jen volitelně). Ranní noviny (nejdřív `minHours` po otevření) sečtou:
// strana s víc granáty rozbije část staveb `target` (rozkaz z hlasování, např. PILLBOXES) poražené strany. Podíl zničených:
//   ruined = base + (1 − base) × (víc − míň) / víc   (při shodě nic). Rozkaz pak střílí jen zbytkem: násobek palby 1 + (m − 1) × (1 − ruined).
// Na mapě se z podílu bunkrů stanou ruiny (web/src/orders-fx.js). Žádné mrtvé navíc: je to o slávě a o pevnůstkách, ne masakr.
// state.shells = { mediaId, openedAt, minHours, cap, target, counts: [h, c], by: { userId: { n, f, handle } }, ids: [commentId…] }

export function openShells(state, { mediaId, openedAt, minHours = 8, cap = null, target = 'PILLBOXES' }) {
  if (!mediaId) return null;
  if (state.shells?.mediaId === mediaId) return state.shells;
  state.shells = { mediaId, openedAt: openedAt || new Date().toISOString(), minHours, cap, target, counts: [0, 0], by: {}, ids: [] };
  return state.shells;
}

// jeden komentář pod postem souboje → granát pro frakci `faction` (strana vojáka). Vrací true, když se započítal.
export function addShell(state, { commentId, userId, handle, faction }) {
  const S = state.shells;
  if (!S || faction == null || !commentId) return false;
  if (S.ids.includes(commentId)) return false;
  S.ids.push(commentId);
  const key = String(userId || handle || '').toLowerCase();
  if (!key) return false;
  const u = (S.by[key] ??= { n: 0, f: faction, handle: handle ? String(handle).toLowerCase() : null });
  if (S.cap && u.n >= S.cap) return false; // strop na účet jen když je nastavený (16. 11. uživatel: bez stropu, kolik komentářů, tolik střel)
  u.n++;
  S.counts[u.f]++; // granát jde vždy straně, za kterou účet střílí poprvé (voják nemění stranu uprostřed palby)
  return true;
}

const short = (theme, f) => theme.factions[f].name.replace(/^The /, '');

// ranní vyhodnocení (dailyTick, před přechodem dne). Vrací výsledek a přidá zprávu do novin, nebo null (ještě se střílí / nic neběží).
export function resolveShells(state, theme, now = null) {
  const S = state.shells;
  if (!S) return null;
  const opened = Date.parse(S.openedAt);
  const t = now == null ? Date.now() : typeof now === 'number' ? now : Date.parse(now); // 17. 11.: denní tah posílá číslo (Date.now()), Date.parse(číslo) = NaN → lhůta se přeskočila a losovalo se hned
  if (Number.isFinite(opened) && t - opened < (S.minHours ?? 8) * 3600e3) return null; // ještě se střílí
  const cfg = theme.shells || {};
  const [h, c] = S.counts;
  state.shells = null;
  if (!h && !c) return { counts: [h, c], winner: null };
  const winner = h === c ? null : h > c ? 0 : 1;
  const loser = winner == null ? null : 1 - winner;
  const base = cfg.base ?? 0.25;
  const ruined = winner == null ? 0 : Math.min(1, base + (1 - base) * (S.counts[winner] - S.counts[loser]) / S.counts[winner]);
  const live = (state.orders || []).filter((o) => o.faction === loser && o.kw === S.target && o.to >= state.day + 1);
  for (const o of live) o.ruined = Math.max(o.ruined || 0, Math.round(ruined * 100) / 100);
  // nejpilnější obsluha děla (nejvíc granátů) u vítěze: jméno vojáka a @handle do novin
  const top = Object.values(S.by).filter((u) => u.f === winner && u.handle).sort((a, b) => b.n - a.n)[0];
  const sol = top && state.soldiers.find((s) => s.handle === top.handle);
  const W = winner != null ? short(theme, winner) : null, L = loser != null ? short(theme, loser) : null;
  const pct = Math.round(ruined * 100);
  const text = winner == null
    ? `Both sides fired ${h} shells. Neither line gave an inch, and every pillbox is still standing.`
    : `The ${W} fired ${S.counts[winner]} shells, the ${L} ${S.counts[loser]}. ` +
      (live.length ? `The ${W} guns knocked out ${pct}% of the ${L} pillboxes. Their machine guns and snipers lost that cover.` : `The ${W} guns churned the ${L} line, but there was no concrete left to break.`) +
      (sol ? ` The busiest gun crew: ${sol.name} (@${sol.handle}), ${top.n} shells.` : '');
  state.news = [...(state.news || []), { day: state.day, kind: 'shells', h: cfg.newsHead || 'The guns answered', text }];
  return { counts: [h, c], winner, ruined, target: S.target, top: sol ? { handle: sol.handle, name: sol.name, n: top.n } : null };
}
