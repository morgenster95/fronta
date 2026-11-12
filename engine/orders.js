// Rozkazy frakcí: výsledek hlasování po frakcích (každá strana volí vlastní rozkaz, hlas se páruje s vojákem podle IG účtu).
// Rozkaz platí `days` dní od dalšího dne války a mění nebezpečí (`danger`, násobek) nebo šanci na uzdravení (`recover`, minimum).
// Další druhy (od 2026-11-12): `shell` (násobek zásahů z granátů, hlubší kryty), `fire` (násobek palby vlastních střelců: číslo, nebo { role: násobek }),
// `heal` (násobek šance, že se raněný zahojí), `stretchers` (nosítka navíc po dobu rozkazu), `medics` (ošetřovatelé navíc: práce mediků po dobu rozkazu), `exposed` (násobek zásahů na vlastní vojáky kulkou i pozadím: útočící jsou na očích),
// `die` (násobek úmrtnosti kriticky raněných za noc: lékař),
// `mine` (po skončení lhůty vybuchne mina pod nejlidnatějším úsekem nepřítele; battle.js).
// state.orders = [{ faction, kw, label, from, to, danger?, recover?, shell?, fire?, mine? }]

const live = (state, faction, day) => (state.orders || []).filter((o) => o.faction === faction && day >= o.from && day <= o.to);

export function orderDanger(state, faction, day) {
  return live(state, faction, day).reduce((m, o) => m * (o.danger ?? 1), 1);
}

export function orderRecover(state, faction, day, base) {
  return live(state, faction, day).reduce((r, o) => Math.max(r, o.recover ?? 0), base);
}

export function orderShell(state, faction, day) {
  return live(state, faction, day).reduce((m, o) => m * (o.shell ?? 1), 1);
}

export function orderHeal(state, faction, day) {
  return live(state, faction, day).reduce((m, o) => m * (o.heal ?? 1), 1);
}

export function orderStretchers(state, faction, day) {
  return live(state, faction, day).reduce((n, o) => n + (o.stretchers ?? 0), 0);
}

export function orderMedics(state, faction, day) {
  return live(state, faction, day).reduce((n, o) => n + (o.medics ?? 0), 0);
}

export function orderExposed(state, faction, day) {
  return live(state, faction, day).reduce((m, o) => m * (o.exposed ?? 1), 1);
}

export function orderDie(state, faction, day) {
  return live(state, faction, day).reduce((m, o) => m * (o.die ?? 1), 1);
}

// `guns`: protipalba (counter-battery): násobek počtu ostřelovaných úseků, když je strana pod bombardováním
export function orderGuns(state, faction, day) {
  return live(state, faction, day).reduce((m, o) => m * (o.guns ?? 1), 1);
}

export function orderFire(state, faction, day, role) {
  return live(state, faction, day).reduce((m, o) => m * (typeof o.fire === 'number' ? o.fire : (o.fire?.[role] ?? 1)), 1);
}

// vítězné možnosti → rozkazy (začínají dnem `from`)
export function issueOrders(state, winners, from) {
  const add = winners
    .filter((w) => w && (w.danger != null || w.recover != null || w.shell != null || w.fire != null || w.mine || w.heal != null || w.stretchers != null || w.medics != null || w.exposed != null || w.die != null || w.guns != null))
    .map((w) => ({
      faction: w.faction, kw: w.kw, label: w.label, from, to: from + (w.days ?? 3) - 1,
      ...(w.danger != null ? { danger: w.danger } : {}), ...(w.recover != null ? { recover: w.recover } : {}),
      ...(w.shell != null ? { shell: w.shell } : {}), ...(w.fire != null ? { fire: w.fire } : {}), ...(w.mine ? { mine: true } : {}), ...(w.heal != null ? { heal: w.heal } : {}), ...(w.stretchers != null ? { stretchers: w.stretchers } : {}), ...(w.medics != null ? { medics: w.medics } : {}), ...(w.exposed != null ? { exposed: w.exposed } : {}), ...(w.die != null ? { die: w.die } : {}), ...(w.guns != null ? { guns: w.guns } : {}),
    }));
  state.orders = [...(state.orders || []), ...add].slice(-40);
  return add;
}
