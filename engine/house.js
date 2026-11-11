// Rod hráče: odznaky rodu (zůstávají v rodu napříč generacemi) a oznámení o smrti pro bota.
// Odznaky se udělují jednou a nikdy se neberou (s.houseBadges). Definice v theme.house.badges:
//   { id, name, desc, gens?: n (rod má aspoň n generací), days?: n (některý člen přežil n dní v kuse),
//     scars?: n (člen přežil n těžkých zranění), treated?: n (medik ošetřil n raněných), title?: true (člen má titul),
//     fallen?: n (rod ztratil n mužů) }

const lives = (s, day) => [...(s.fallen || []), {
  gen: s.generation || 1, days: Math.max(0, day - s.enlisted), scars: s.scars || 0, treated: s.treated || 0,
  titles: s.titles || [], medals: s.medals || [],
}];

export function awardHouseBadges(state, theme) {
  const defs = theme.house?.badges || [];
  const out = [];
  for (const s of state.soldiers) {
    const L = lives(s, state.day);
    const have = new Set(s.houseBadges?.map((b) => b.id) || []);
    for (const d of defs) {
      if (have.has(d.id)) continue;
      const ok = (d.gens == null || (s.generation || 1) >= d.gens)
        && (d.days == null || L.some((l) => l.days >= d.days))
        && (d.scars == null || L.some((l) => (l.scars || 0) >= d.scars))
        && (d.treated == null || L.some((l) => (l.treated || 0) >= d.treated))
        && (!d.title || L.some((l) => (l.titles || []).length))
        && (d.fallen == null || (s.fallen || []).length >= d.fallen);
      if (!ok) continue;
      s.houseBadges = [...(s.houseBadges || []), { id: d.id, day: state.day, gen: s.generation || 1 }];
      out.push({ handle: s.handle, id: d.id });
    }
  }
  return out;
}

// Oznámení „tvůj voják padl, nastoupil nástupce“ (čte ingest/poll-comments.mjs a odpoví pod náborový komentář hráče)
export function noticeDeath(state, heir) {
  const p = heir.fallen?.at(-1);
  if (!p) return;
  state.notices = [...(state.notices || []), {
    kind: 'death', handle: heir.handle, day: heir.enlisted, gen: heir.generation,
    prev: p.name, days: p.days, cause: p.cause?.kind || 'line', heir: heir.name, relation: heir.relation || null,
  }].slice(-500);
}

// vztah: předchůdce byl pro nástupce „relation“ (his uncle X never came home) → nástupce je pro předchůdce:
export const INVERSE = { brother: 'brother', 'older brother': 'younger brother', father: 'son', uncle: 'nephew', cousin: 'cousin' };

export function deathReply(n, theme, site) {
  const why = { nobed: 'on a stretcher, waiting for a bed', wounds: 'of his wounds', raid: 'on a night raid', line: 'at the front', shell: 'killed outright by a shell', shot: 'shot dead' }[n.cause] || 'at the front';
  const kin = INVERSE[n.relation] || 'kin';
  return `@${n.handle} ${n.prev} fell on Day ${n.day} ${why}, after ${n.days} ${n.days === 1 ? 'day' : 'days'} at the front. ` +
    `His ${kin} ${n.heir} has taken up the rifle. Your house: ${site || ''}/?s=${encodeURIComponent(n.handle)}&fell=1`;
}
