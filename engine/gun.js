// Těžké dělo (odměna kóty reward 'gun', 20. 11. 2026, uživatel): vítěz dostane jednu houfnici natrvalo.
// Každý den vybere úsek nepřátelské fronty, kde stojí nejvíc lidí pohromadě (okno G.men vojáků po sobě podle x), a ten ostřeluje.
// Dělo má stav 0..1: opotřebení hlavně za každý den palby, palba nepřítele na dělostřelecký okop, protipalba nepřátelského děla;
// opravují ho ženisti jen z VOLNÉ práce (nejdřív drát ve svém úseku, pak dělo, pak bunkry). Při 0 je zničené, zase střílí od G.rebuild.
// state.guns = [{ id, name, faction, cond, since, destroyed, last: { day, target, secs, x0, x1, hit, killed, wear, fix } }]
import { rngFor } from './rng.js';

export function grantGun(state, f, id, name, day) {
  state.guns = [...(state.guns || []), { id, name, faction: f, cond: 1, since: day + 1, destroyed: false }];
}

// síla palby podle stavu (G.power: [[od stavu, násobek]] sestupně)
export function gunPower(G, gun) {
  if (gun.destroyed) return 0;
  for (const [c, p] of G.power || [[0.6, 1], [0.3, 0.5], [0.01, 0.15]]) if (gun.cond >= c) return p;
  return 0;
}

// cíle na tento den: { gun, target, ids:Set, secs:[...], x0, x1, power }
export function gunTargets(state, theme, day, X, able) {
  const G = theme.battle?.gun;
  if (!G) return [];
  const out = [];
  for (const gun of state.guns || []) {
    if (day < gun.since) continue;
    const power = gunPower(G, gun);
    if (!power) continue;
    const e = 1 - gun.faction;
    const men = state.soldiers.filter((s) => s.faction === e && s.sector && able(s)).sort((a, b) => X(a) - X(b));
    const n = Math.min(G.men || 20, men.length);
    if (!n) continue;
    // náhodných G.tries oken po n vojácích, vybere to nejhustší (nejkratší úsek fronty)
    const r = rngFor(theme.id, `gun:${gun.id}`, day);
    let best = null;
    for (let k = 0; k < (G.tries || 6); k++) {
      const i = Math.floor(r() * (men.length - n + 1));
      const span = X(men[i + n - 1]) - X(men[i]);
      if (!best || span < best.span) best = { i, span };
    }
    const win = men.slice(best.i, best.i + n);
    const secs = [...new Set(win.map((s) => s.sector))];
    out.push({ gun, target: e, ids: new Set(win.map((s) => s.id)), secs, x0: X(win[0]), x1: X(win.at(-1)), power });
  }
  return out;
}

// opotřebení a oprava jednoho děla (volá battle.js po drátu); spare = volná práce ženistů strany (jednotky), vrací spotřebovanou práci
export function gunUpkeep(state, theme, day, gun, { enemyShooters = 0, counter = 0, spare = 0 } = {}) {
  const G = theme.battle.gun;
  const fired = day >= gun.since && !gun.destroyed && gunPower(G, gun) > 0;
  const wear = (fired ? G.wear || 0 : 0) + Math.min(G.fireMax ?? 0.06, enemyShooters * (G.perShooter || 0)) + counter;
  const can = Math.min(G.maxRepair ?? 0.08, spare * (G.sapperRepair || 0));
  const before = gun.cond;
  let cond = Math.max(0, before - wear);
  const fix = Math.min(can, 1 - cond);
  cond = Math.min(1, cond + fix);
  const wasDestroyed = gun.destroyed;
  if (cond <= 0) gun.destroyed = true;
  else if (gun.destroyed && cond >= (G.rebuild ?? 0.5)) gun.destroyed = false;
  gun.cond = Math.round(cond * 100) / 100;
  return { used: G.sapperRepair ? fix / G.sapperRepair : 0, wear: Math.round(wear * 100) / 100, fix: Math.round(fix * 100) / 100, before, destroyedNow: !wasDestroyed && gun.destroyed, rebuiltNow: wasDestroyed && !gun.destroyed };
}
