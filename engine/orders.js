// Rozkazy frakcí: výsledek hlasování po frakcích (každá strana volí vlastní rozkaz, hlas se páruje s vojákem podle IG účtu).
// Rozkaz platí `days` dní od dalšího dne války a mění nebezpečí (`danger`, násobek zásahů z pozadí), šanci na uzdravení (`recover`, minimum),
// palbu vlastních vojáků (`fire`, násobek) nebo práci mediků (`medics`, násobek). Jedna možnost může nést víc účinků najednou.
// state.orders = [{ faction, kw, label, from, to, danger?, recover?, fire?, medics? }]

const live = (state, faction, day) => (state.orders || []).filter((o) => o.faction === faction && day >= o.from && day <= o.to);

export function orderDanger(state, faction, day) {
  return live(state, faction, day).reduce((m, o) => m * (o.danger ?? 1), 1);
}

export function orderRecover(state, faction, day, base) {
  return live(state, faction, day).reduce((r, o) => Math.max(r, o.recover ?? 0), base);
}

export function orderFire(state, faction, day) {
  return live(state, faction, day).reduce((m, o) => m * (o.fire ?? 1), 1);
}

export function orderMedics(state, faction, day) {
  return live(state, faction, day).reduce((m, o) => m * (o.medics ?? 1), 1);
}

const EFFECTS = ['danger', 'recover', 'fire', 'medics'];
// vítězné možnosti → rozkazy (začínají dnem `from`)
export function issueOrders(state, winners, from) {
  const add = winners
    .filter((w) => w && EFFECTS.some((k) => w[k] != null))
    .map((w) => ({
      faction: w.faction, kw: w.kw, label: w.label, from, to: from + (w.days ?? 3) - 1,
      ...Object.fromEntries(EFFECTS.filter((k) => w[k] != null).map((k) => [k, w[k]])),
    }));
  state.orders = [...(state.orders || []), ...add].slice(-40);
  return add;
}
