// Role PILOT (17. 11. 2026, schváleno uživatelem): extrémně vzácná, jeden pilot na stranu. Průzkumné letadlo zlepšuje palbu vlastních puškařů
// (letecký pozorovatel vidí příkopy nepřítele) a nad frontou létá. Historicky letěly průzkumné stroje nízko a dostávaly palbu ze země, takže
// pilot má malou denní šanci sestřelení. Podrobnosti a čísla: docs/MECHANICS.md, theme.pilot.
//   state.pilotCall = { mediaId, openedAt, minHours, apps: { userKey: { f, handle } }, ids: [commentId…] }   přihlášky (komentář PILOT pod příspěvkem)
//   state.pilots    = [ { handle, since, variant } | null, … ]                                             pilot strany (index = frakce)
// Pilot je voják s `archetype: 'pilot'` (nikdy se nelosuje, nejde si ho přát ani převelet); `s.prevRole` = role před povýšením na pilota.
import { rngFor } from './rng.js';

const short = (theme, f) => theme.factions[f].name.replace(/^The /, '');
const alive = (s) => s && s.status !== 'fallen';
const find = (state, handle) => state.soldiers.find((s) => s.handle === handle);

export function openPilotCall(state, { mediaId, openedAt, minHours = 24 }) {
  if (!mediaId) return null;
  if (state.pilotCall?.mediaId === mediaId) return state.pilotCall;
  state.pilotCall = { mediaId, openedAt: openedAt || new Date().toISOString(), minHours, apps: {}, ids: [] };
  return state.pilotCall;
}

// Komentář s hesly PILOT pod příspěvkem náboru: přihláška za stranu vojáka (bot neodpovídá). Vrací true, když se započítala.
export function addPilotApp(state, { commentId, userId, handle, faction, text }) {
  const C = state.pilotCall;
  if (!C || faction == null || !commentId || !/\bpilots?\b/i.test(text || '')) return false;
  if (C.ids.includes(commentId)) return false;
  C.ids.push(commentId);
  const key = String(userId || handle || '').toLowerCase();
  if (!key) return false;
  C.apps[key] ??= { f: faction, handle: handle ? String(handle).toLowerCase() : null };
  return true;
}

const variantOf = (handle) => [...handle].reduce((a, c) => a + c.charCodeAt(0), 0) % 2;

function makePilot(state, s, f, theme, day) {
  s.prevRole = s.archetype;
  s.archetype = 'pilot';
  s.roleWish = null; s.pendingRole = null;
  state.pilots[f] = { handle: s.handle, since: day, variant: variantOf(s.handle) };
}
function endPilot(state, f, s) {
  if (s && s.archetype === 'pilot') { s.archetype = s.prevRole && s.prevRole !== 'pilot' ? s.prevRole : 'rifleman'; s.prevRole = null; }
  state.pilots[f] = null;
}

// ranní vyhodnocení přihlášek (dailyTick, před přechodem dne): losuje se mezi přihlášenými živými vojáky strany bez pilota.
export function resolvePilotCall(state, theme, now = null) {
  state.pilots ??= theme.factions.map(() => null);
  const C = state.pilotCall;
  if (!C) return null;
  const t = now == null ? Date.now() : typeof now === 'number' ? now : Date.parse(now); // 17. 11.: denní tah posílá číslo (Date.now()), Date.parse(číslo) = NaN → lhůta se přeskočila a losovalo se hned
  if (Number.isFinite(Date.parse(C.openedAt)) && t - Date.parse(C.openedAt) < (C.minHours ?? 24) * 3600e3) return null; // přihlášky ještě běží
  state.pilotCall = null;
  const out = [];
  for (let f = 0; f < theme.factions.length; f++) {
    if (state.pilots[f]) continue;
    const pool = Object.values(C.apps).filter((a) => a.f === f).map((a) => find(state, a.handle)).filter((s) => alive(s) && s.faction === f && s.archetype !== 'officer');
    if (!pool.length) continue;
    const s = pool[Math.floor(rngFor(theme.id, 'pilot', state.day, f)() * pool.length)];
    makePilot(state, s, f, theme, state.day);
    const text = `${s.name} (@${s.handle}) of the ${short(theme, f)} is the new pilot. Out of ${pool.length} who stepped forward, one will fly. Their riflemen get a better view of the enemy trench. Keep your head down, pilot.`;
    state.news = [...(state.news || []), { day: state.day, kind: 'pilot', h: theme.pilot?.newsHead || 'A pilot takes the air', text }];
    out.push({ f, handle: s.handle, of: pool.length });
  }
  return out;
}

export const flyable = (theme, weatherId) => !(theme.pilot?.grounded || ['storm', 'fog']).includes(weatherId);

// palba puškařů strany s pilotem v dnešním dni (násobek) – letadlo ve vzduchu
export function pilotFire(state, theme, faction, weatherId) {
  const p = state.pilots?.[faction];
  if (!p || !flyable(theme, weatherId)) return 1;
  const s = find(state, p.handle);
  return alive(s) && s.archetype === 'pilot' && s.status !== 'wounded' ? 1 + (theme.pilot?.rifleman ?? 0.12) : 1;
}

// denní vzlet: bouře a mlha pilota drží na zemi; jinak malá šance sestřelení, roste s počtem nepřátelských kulometčíků.
// Smrt (50 %) = normální padlý; jinak těžce raněný (nemocnice). Role se uvolní, přihlášky se otevírají novým příspěvkem.
export function pilotSortie(state, theme, day, weatherId, fall, wound) {
  state.pilots ??= theme.factions.map(() => null);
  const out = [];
  for (let f = 0; f < theme.factions.length; f++) {
    const p = state.pilots[f];
    if (!p) continue;
    const s = find(state, p.handle);
    if (!alive(s) || s.archetype !== 'pilot') { endPilot(state, f, s && alive(s) ? s : null); continue; } // padl na zemi / převelen
    if (!flyable(theme, weatherId)) continue;
    const cfg = theme.pilot || {};
    const mgs = state.soldiers.filter((x) => x.faction === 1 - f && x.archetype === 'machinegunner' && x.status === 'active').length;
    const risk = (cfg.shotDown ?? 0.05) + (cfg.perTenMG ?? 0.01) * Math.floor(mgs / 10);
    const r = rngFor(theme.id, 'sortie', day, f);
    if (r() >= risk) continue;
    const dies = r() < (cfg.deathShare ?? 0.5);
    const name = s.name, handle = s.handle;
    endPilot(state, f, s);
    if (dies) fall(s, day, 'pilot'); else wound(s, 'heavy');
    const text = dies
      ? `The ${short(theme, f)} plane was hit from the ground and went down in flames behind the lines. ${name} (@${handle}) did not get out.`
      : `The ${short(theme, f)} plane was hit from the ground and crash-landed behind the lines. ${name} (@${handle}) was pulled out alive, badly hurt. The aviation post is open again.`;
    state.news = [...(state.news || []), { day, kind: 'pilotDown', h: cfg.downHead || 'Plane down', text }];
    state.crashes = [...(state.crashes || []).filter((c) => day - c.day < 3), { f, day }]; // vrak na mapě pár dní
    out.push({ f, handle, dies });
  }
  return out;
}

export function pilotsPublic(state) {
  return (state.pilots || []).map((p) => (p ? { handle: p.handle, variant: p.variant } : null));
}

// Oprava 17. 11. (pokyn uživatele): los pilotů proběhl o den dřív (chyba s časem). Vrátí vybraným pilotům předchozí roli,
// uvolní místa pilotů, smaže zprávy „A pilot takes the air“ z novin daného dne (výjimka z nedotknutelné kroniky na výslovný pokyn)
// a obnoví nábor s přihláškami ze stavu před losem (`call`), aby se losovalo až v dalších novinách. Vrací počet vrácených rolí.
export function undoPilots(state, theme, { day, call } = {}) {
  let n = 0;
  for (const p of state.pilots || []) {
    const s = p && state.soldiers.find((x) => x.handle === p.handle);
    if (s && s.archetype === 'pilot') { s.archetype = s.prevRole || 'rifleman'; delete s.prevRole; n++; }
  }
  state.pilots = theme.factions.map(() => null);
  for (const ch of state.chronicle || []) if (day == null || ch.day === day) ch.blocks = (ch.blocks || []).filter((b) => b.kind !== 'pilot');
  state.news = (state.news || []).filter((x) => x.kind !== 'pilot');
  if (call && !state.pilotCall) state.pilotCall = { ...call, apps: { ...call.apps }, ids: [...(call.ids || [])] };
  return n;
}
