// Příspěvky ve frontě, které nevyjdou v pevný čas, ale při události ve hře (marketing/queue.json).
//   "trigger": { "race": "ridge" }   vyjde, jakmile některá frakce dobude kótu `ridge` (state.victories)
//   "variants": [ {files, caption}, {files, caption} ]   podle vítězné frakce (index = frakce)
//   v popisku: {hero} rozhodující voják, {win} / {lose} počty rekrutů, {next} další kóta, {objective} dobytá kóta
//   "vote": { question, options, perFaction, minHours, note }   po zveřejnění se pod postem otevře hlasování
import { raceObjective } from '../engine/race.js';
import { openVote } from '../engine/roster.js';

const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));

// Položky, jejichž událost nastala: doplní soubory a popisek vítězné varianty (mění item na místě). Vrací je.
export function fireTriggers(queue, state, theme) {
  const fired = [];
  for (const item of queue.items) {
    if (item.published || !item.trigger?.race) continue;
    if (item.fired) { fired.push(item); continue; } // už připravená, čeká jen na zveřejnění
    const v = (state.victories || []).find((x) => x.id === item.trigger.race);
    if (!v) continue;
    const variant = item.variants?.[v.faction];
    if (!variant) continue;
    const vars = {
      hero: v.hero, objective: v.name, win: String(v.counts[v.faction]), lose: String(v.counts[1 - v.faction]),
      next: raceObjective(theme, state.race?.idx ?? 0)?.name ?? 'the next objective',
    };
    item.type = variant.type || item.type;
    item.files = variant.files;
    item.caption = fill(variant.caption, vars);
    item.fired = { faction: v.faction, hero: v.hero, day: v.day };
    fired.push(item);
  }
  return fired;
}

// po zveřejnění: hlasování pod nově zveřejněným postem
// Hlasování je vždy jen jedno: když už nějaké běží, nové ho NEPŘEPÍŠE (hlasy by se ztratily), ale počká
// (item.votePending) a otevře se, až denní tah to běžící vyhodnotí. Vrací 'open' | 'pending' | false.
export function openItemVote(state, item, openedAt = item.published?.at) {
  if (!item.vote || !item.published?.id) return false;
  if (state.vote && state.vote.mediaId !== item.published.id) { item.votePending = true; return 'pending'; }
  if (state.vote?.mediaId === item.published.id) { delete item.votePending; return 'open'; } // už běží
  openVote(state, { ...item.vote, mediaId: item.published.id, openedAt });
  delete item.votePending;
  return 'open';
}
