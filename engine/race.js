// Závod frakcí o kóty: kdo první naverbuje `need` nových vojáků, dobude kótu.
// Odměna („výšina“): dělostřelectvo na poraženého, nižší nebezpečí pro vítěze / vyšší pro poraženého, stuha, titul hrdiny,
// zápis do záznamu všem vojákům a zpráva do deníku. Pak začíná nový závod o další kótu (počítají se jen noví rekruti).

import { eventEntry } from './story.js';
import { addEntry } from './soldier.js';

const short = (theme, f) => theme.factions[f].name.replace(/^The /, '');

// kolik nových vojáků je třeba na kótu (objectives[].need, jinak race.need); další kóty můžou být větší
export const raceNeed = (theme, idx) => raceObjective(theme, idx)?.need || theme.race.need;
// věta o cíli závodu („the first side to …“)
export const raceGoal = (theme, idx) => (raceObjective(theme, idx)?.type === 'kills'
  ? `the first side to kill ${raceNeed(theme, idx)} enemy soldiers takes it`
  : `the first side to bring ${raceNeed(theme, idx)} new soldiers takes it`);

export function raceObjective(theme, idx) {
  const list = theme.race?.objectives || [];
  if (!list.length) return null;
  const o = list[idx % list.length];
  const round = Math.floor(idx / list.length);
  return round ? { ...o, id: `${o.id}-${round + 1}`, name: `${o.name} (${round + 1})` } : o;
}

// počty narukovaných podle frakcí (nástupci padlých se nepočítají znovu – jsou to stejní hráči)
const counts = (state, theme) => theme.factions.map((_, f) => state.soldiers.filter((s) => s.faction === f).length);

// zabití: padlí soupeře od začátku závodu (záznamy rodů s.fallen, den padnutí > začátek závodu); recruits: noví vojáci
function killCounts(state, theme) {
  const from = state.race.startDay ?? Infinity;
  return theme.factions.map((_, f) => state.soldiers.reduce((a, s) => a + (s.faction !== f ? (s.fallen || []).filter((r) => (r.day ?? -1) > from).length : 0), 0));
}

export function raceStatus(state, theme) {
  if (!theme.race) return null;
  state.race ??= { idx: 0, base: theme.factions.map(() => 0) };
  const o = raceObjective(theme, state.race.idx);
  const type = o.type || 'recruits';
  const cnt = type === 'kills' ? killCounts(state, theme) : counts(state, theme).map((n, f) => n - state.race.base[f]);
  return { id: o.id, name: o.name, type, need: o.need || theme.race.need, counts: cnt, reward: o.rewardText || theme.race.reward, rewardKind: o.reward || 'barrage' };
}

// Volá se po každém narukování. Vrací vítězství nebo null.
export function checkRace(state, theme, story, recruit) {
  const st = raceStatus(state, theme);
  if (!st) return null;
  if (st.type === 'kills') return null; // závod o zabití se vyhodnocuje po boji (checkKillRace)
  const f = recruit.faction;
  if (st.counts[f] < st.need) return null;
  return winRace(state, theme, story, st, f, recruit);
}

// Závod „kdo první zabije N nepřátel“ (objectives[].type = 'kills'): po denním boji. Při shodě vyhrává ten, kdo má víc.
// Hrdina = voják vítězné strany, který od začátku závodu zabil nejvíc (s.kills; při shodě kdo střílel naposled).
export function checkKillRace(state, theme, story) {
  const st = raceStatus(state, theme);
  if (!st || st.type !== 'kills') return null;
  const ok = st.counts.map((n) => n >= st.need);
  if (!ok.some(Boolean)) return null;
  const f = ok[0] && ok[1] ? (st.counts[0] >= st.counts[1] ? 0 : 1) : ok[0] ? 0 : 1;
  const from = state.race.killsFrom || {};
  const alive = state.soldiers.filter((s) => s.faction === f && s.status !== 'fallen');
  const hero = alive.sort((a, b) => ((b.kills || 0) - (from[b.handle] || 0)) - ((a.kills || 0) - (from[a.handle] || 0)) || (b.order || 0) - (a.order || 0))[0];
  return hero ? winRace(state, theme, story, st, f, hero) : null;
}

function winRace(state, theme, story, st, f, recruit) {
  const R = theme.race;
  const day = state.day;
  const v = {
    id: st.id, name: st.name, faction: f, day, hero: recruit.handle,
    from: day + 1, to: day + R.days, counts: st.counts,
    reward: st.rewardKind || 'barrage',
  };
  // odměna kóty: dělostřelectvo (výchozí) nebo pozorovatelna (theme.race.observation) na pár dní
  if (v.reward === 'observation') v.obsTo = day + (R.observation?.days || 3);
  else v.barrageTo = day + R.barrageDays;
  state.victories = [...(state.victories || []), v];
  // stuha všem vojákům vítězné strany, titul hrdinovi, zápis každému vojákovi obou stran
  const vars = (s) => ({ objective: st.name, us: short(theme, s.faction), them: short(theme, 1 - s.faction), day: String(day) });
  for (const s of state.soldiers) {
    if (s.status === 'fallen') continue;
    const won = s.faction === f;
    if (won) {
      s.medals ??= [];
      s.medals.push(`obj:${st.id}`);
    }
    const kind = s === recruit ? 'raceHero' : won ? 'raceWin' : 'raceLose';
    addEntry(s, day, eventEntry(kind, s, day, theme, story, vars(s)));
  }
  recruit.titles = [...(recruit.titles || []), `Hero of ${st.name}`];
  recruit.medals ??= [];
  recruit.medals.push(`hero:${st.id}`); // medaile za statečnost: jen pro hráče, který kótu rozhodl (ostatní vítězové dostanou stuhu obj:)
  state.news = [...(state.news || []), {
    day,
    h: `${short(theme, f)} took ${st.name}`,
    text: (st.type === 'kills'
      ? `The ${short(theme, f)} killed ${st.need} enemy soldiers first (${st.counts[f]} against ${st.counts[1 - f]}) and took ${st.name}. The deadliest rifle belonged to @${recruit.handle}. `
      : `The ${short(theme, f)} reached ${st.need} soldiers first (${st.counts[f]} against ${st.counts[1 - f]}) and took ${st.name}. The deciding rifle belonged to @${recruit.handle}. `) + `${v.reward === 'observation'
        ? `${(R.observation?.victory || '').replace('{days}', R.observation?.days || 3).replace('{objective}', st.name).replace('{them}', short(theme, 1 - f)).replace('{us}', short(theme, f))}, `
        : `For ${R.barrageDays} days the guns on the heights will pound the ${short(theme, 1 - f)} lines, `}` +
      `and for ${R.days} days the high ground keeps the ${short(theme, f)} safer. The race for ${raceObjective(theme, state.race.idx + 1).name} begins now: ${raceGoal(theme, state.race.idx + 1)}.`,
  }];
  state.race = { idx: state.race.idx + 1, base: counts(state, theme), startDay: day, killsFrom: Object.fromEntries(state.soldiers.filter((s) => s.kills).map((s) => [s.handle, s.kills])) };
  return v;
}

// násobek nebezpečí pro frakci v daný den podle platných vítězství
export function raceDanger(state, theme, faction, day) {
  let m = 1;
  for (const v of state.victories || []) {
    if (day < v.from || day > v.to) continue;
    m *= v.faction === faction ? theme.race.winDanger : theme.race.loseDanger;
  }
  return m;
}

// aktivní dělostřelectvo: cílová frakce, nebo null. visual = pro web už v den dobytí (palba je vidět hned, zásahy počítá boj až od dalšího dne)
export function activeBarrage(state, day, visual = false) {
  // boj: dny from..barrageTo (poslední noc je tah dne barrageTo); web (visual): od dne dobytí do dne PŘED posledním tahem,
  // po posledním tahu už děla mlčí i na mapě (pokyn uživatele 14. 11.)
  const v = (state.victories || []).filter((x) => x.barrageTo != null && (visual ? day >= x.day && day < x.barrageTo : day >= x.from && day <= x.barrageTo)).at(-1);
  return v ? { target: 1 - v.faction, by: v.faction, name: v.name, since: v.day } : null;
}

// aktivní pozorovatelna (odměna kóty 'observation'): kdo vidí do zákopů soupeře, nebo null. visual = pro web už v den dobytí
export function activeObservation(state, day, visual = false) {
  const v = (state.victories || []).filter((x) => x.obsTo != null && day >= (visual ? x.day : x.from) && day <= x.obsTo).at(-1);
  return v ? { by: v.faction, target: 1 - v.faction, name: v.name, since: v.day, to: v.obsTo } : null;
}

// Čestné tituly: první narukovaný každé frakce + ruční tituly z tématu (theme.honors: { handle: "titul" }).
export function awardHonors(state, theme) {
  theme.factions.forEach((fac, f) => {
    const first = state.soldiers.find((s) => s.faction === f);
    const t = `First of the ${short(theme, f)}`;
    if (first && !(first.titles || []).includes(t)) first.titles = [...(first.titles || []), t];
  });
  for (const [handle, t] of Object.entries(theme.honors || {})) {
    const s = state.soldiers.find((x) => x.handle === handle);
    if (s && !(s.titles || []).includes(t)) s.titles = [...(s.titles || []), t];
  }
}
