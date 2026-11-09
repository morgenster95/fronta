// Rozkazy frakcí: výsledek hlasování po frakcích (každá strana volí vlastní rozkaz, hlas se páruje s vojákem podle IG účtu).
// Rozkaz platí `days` dní od dalšího dne války a mění nebezpečí (`danger`, násobek) nebo šanci na uzdravení (`recover`, minimum).
// state.orders = [{ faction, kw, label, from, to, danger?, recover? }]

const live = (state, faction, day) => (state.orders || []).filter((o) => o.faction === faction && day >= o.from && day <= o.to);

export function orderDanger(state, faction, day) {
  return live(state, faction, day).reduce((m, o) => m * (o.danger ?? 1), 1);
}

export function orderRecover(state, faction, day, base) {
  return live(state, faction, day).reduce((r, o) => Math.max(r, o.recover ?? 0), base);
}

// vítězné možnosti → rozkazy (začínají dnem `from`)
export function issueOrders(state, winners, from) {
  const add = winners
    .filter((w) => w && (w.danger != null || w.recover != null))
    .map((w) => ({
      faction: w.faction, kw: w.kw, label: w.label, from, to: from + (w.days ?? 3) - 1,
      ...(w.danger != null ? { danger: w.danger } : {}), ...(w.recover != null ? { recover: w.recover } : {}),
    }));
  state.orders = [...(state.orders || []), ...add].slice(-40);
  return add;
}
