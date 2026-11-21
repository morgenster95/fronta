// Mina pod frontou (odměna kóty reward 'mine', 21. 11. 2026, uživatel: „mina je dobrá, ale ať kopou den“).
// Vítěz závodu dostane jednu minu: jeho ženisti jeden den kopou tunel z kóty pod nepřátelskou linii (m.at = příští noviny, nejdřív za M.minHours),
// pak mina vybuchne pod nejhustším úsekem nepřítele (okno M.men vojáků po sobě podle x, nejkratší z M.tries náhodných). Kráter zůstane na mapě natrvalo.
// Nepřátelští ženisti můžou kopání zaslechnout a tunel zavalit (šance M.counterBase + M.counterPer × jejich ženisti, nejvýš M.counterMax).
// state.mines = [{ id, name, faction, won, at, diggers:[handle], status: 'digging'|'blown'|'collapsed', blown?: { day, target, secs, x0, x1, hit, killed } }]
import { rngFor } from './rng.js';

export function grantMine(state, theme, f, id, name, day, now = Date.now()) {
  const M = theme.battle?.mine || {};
  // „kopou den“: vybuchne v příštích novinách; když do nich zbývá méně než M.minHours, až v těch dalších
  const tick = (theme.tickHourUTC ?? 13) * 3600e3, dayMs = 86400e3;
  const left = (tick - (now % dayMs) + dayMs) % dayMs || dayMs;
  const at = day + (left < (M.minHours ?? 12) * 3600e3 ? 2 : 1);
  const r = rngFor(theme.id, `mine:${id}`, day);
  const sappers = state.soldiers.filter((s) => s.faction === f && s.archetype === 'sapper' && s.status === 'active' && !s.wound)
    .map((s) => [r(), s]).sort((a, b) => a[0] - b[0]).slice(0, M.diggers ?? 6).map(([, s]) => s.handle);
  state.mines = [...(state.mines || []), { id, name, faction: f, won: day, at, diggers: sappers, status: 'digging' }];
  return state.mines.at(-1);
}

// miny, které dnes vybuchnou (nebo je nepřítel zavalí): [{ mine, target, ids:Set, secs, x0, x1, res }] + zavalené
export function mineBlasts(state, theme, day, X, able) {
  const M = theme.battle?.mine;
  const out = [];
  if (!M) return out;
  for (const m of state.mines || []) {
    if (m.status !== 'digging' || day < m.at) continue;
    const e = 1 - m.faction;
    const r = rngFor(theme.id, `mineblast:${m.id}`, day);
    const listeners = state.soldiers.filter((s) => s.faction === e && s.archetype === 'sapper' && able(s)).length;
    const chance = Math.min(M.counterMax ?? 0.25, (M.counterBase ?? 0) + listeners * (M.counterPer ?? 0));
    if (r() < chance) { m.status = 'collapsed'; m.collapsed = { day, listeners }; out.push({ mine: m, collapsed: true }); continue; }
    const men = state.soldiers.filter((s) => s.faction === e && s.sector && able(s) && s.line === 'front').sort((a, b) => X(a) - X(b));
    const n = Math.min(M.men || 24, men.length);
    if (!n) continue;
    let best = null;
    for (let k = 0; k < (M.tries || 8); k++) {
      const i = Math.floor(r() * (men.length - n + 1));
      const span = X(men[i + n - 1]) - X(men[i]);
      if (!best || span < best.span) best = { i, span };
    }
    const win = men.slice(best.i, best.i + n);
    m.status = 'blown';
    out.push({ mine: m, target: e, ids: new Set(win.map((s) => s.id)), secs: [...new Set(win.map((s) => s.sector))], x0: X(win[0]), x1: X(win.at(-1)), res: { hit: 0, killed: 0 } });
  }
  return out;
}
