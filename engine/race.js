// Závod frakcí o kóty: kdo první naverbuje `need` nových vojáků, dobude kótu.
// Odměna („výšina“): dělostřelectvo na poraženého, nižší nebezpečí pro vítěze / vyšší pro poraženého, stuha, titul hrdiny,
// zápis do záznamu všem vojákům a zpráva do deníku. Pak začíná nový závod o další kótu (počítají se jen noví rekruti).

import { eventEntry } from './story.js';
import { addEntry } from './soldier.js';

const short = (theme, f) => theme.factions[f].name.replace(/^The /, '');

export function raceObjective(theme, idx) {
  const list = theme.race?.objectives || [];
  if (!list.length) return null;
  const o = list[idx % list.length];
  const round = Math.floor(idx / list.length);
  return round ? { ...o, id: `${o.id}-${round + 1}`, name: `${o.name} (${round + 1})` } : o;
}

// počty narukovaných podle frakcí (nástupci padlých se nepočítají znovu – jsou to stejní hráči)
const counts = (state, theme) => theme.factions.map((_, f) => state.soldiers.filter((s) => s.faction === f).length);

export function raceStatus(state, theme) {
  if (!theme.race) return null;
  state.race ??= { idx: 0, base: theme.factions.map(() => 0) };
  const o = raceObjective(theme, state.race.idx);
  const c = counts(state, theme);
  return { id: o.id, name: o.name, need: theme.race.need, counts: c.map((n, f) => n - state.race.base[f]), reward: theme.race.reward };
}

// Volá se po každém narukování. Vrací vítězství nebo null.
export function checkRace(state, theme, story, recruit) {
  const st = raceStatus(state, theme);
  if (!st) return null;
  const f = recruit.faction;
  if (st.counts[f] < st.need) return null;
  const R = theme.race;
  const day = state.day;
  const v = {
    id: st.id, name: st.name, faction: f, day, hero: recruit.handle,
    from: day + 1, to: day + R.days, barrageTo: day + R.barrageDays,
    counts: st.counts,
  };
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
    text: `The ${short(theme, f)} reached ${st.need} soldiers first (${st.counts[f]} against ${st.counts[1 - f]}) and took ${st.name}. ` +
      `The deciding rifle belonged to @${recruit.handle}. For ${R.barrageDays} days the guns on the heights will pound the ${short(theme, 1 - f)} lines, ` +
      `and for ${R.days} days the high ground keeps the ${short(theme, f)} safer. The race for ${raceObjective(theme, state.race.idx + 1).name} begins now.`,
  }];
  state.race = { idx: state.race.idx + 1, base: counts(state, theme) };
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
  const v = (state.victories || []).filter((x) => day >= (visual ? x.day : x.from) && day <= x.barrageTo).at(-1);
  return v ? { target: 1 - v.faction, by: v.faction, name: v.name, since: v.day } : null;
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
