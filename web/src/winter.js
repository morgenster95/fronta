// Zima na mapě (pokyn uživatele 22. 11. 2026): 1. týden sněží a padá poprašek, 2. týden víc sněhu, 3. týden plná zima.
// Sníh přibývá plynule po dnech hry podle theme.winter.points ([den od začátku zimy, pokrytí 0..1]), datum dne = warStart + state.day.
// Srážky: v zimě místo deště sněží, bouře = vánice, jasno = bez sněžení. Terén přebarví terrain.js (images.snow), vločky kreslí main.js.
const DAY = 864e5;

export function winterAt(theme, day) {
  const w = theme?.winter;
  if (!w?.start || !theme.warStart) return { snow: 0, on: false };
  const date = Date.parse(theme.warStart + 'T00:00:00Z') + day * DAY;
  const d = (date - Date.parse(w.start + 'T00:00:00Z')) / DAY;
  if (d < 0) return { snow: 0, on: false };
  const pts = w.points || [[0, 0.1], [7, 0.35], [14, 0.6], [21, 0.85]];
  let snow = pts.at(-1)[1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, va] = pts[i], [b, vb] = pts[i + 1];
    if (d <= b) { snow = va + ((vb - va) * Math.max(0, d - a)) / (b - a); break; }
  }
  return { snow, on: true };
}

// počasí dne → srážky v zimě
export function winterFall(weather) {
  if (weather === 'storm') return 'blizzard';
  if (weather === 'clear') return null;
  return 'snow';
}
