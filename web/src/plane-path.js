// Dráha letadla pilota (čistá matematika, bez Pixi, aby šla testovat): letadlo neustále plave tam a zpět po CELÉ otevřené frontě
// (od x0 − margin do x1 + margin), nikdy nemizí a nezávisí na kameře. Poloha je funkce času, takže ji všichni vidí stejně.
// Záruka (test web/src/plane-path.test.js): při každém čase je v mezích, pohyb je spojitý a za jednu periodu se dotkne obou konců fronty.
export const PLANE_SPEED = 130; // px/s (voják = 32 px, přelet přes obrazovku ~6 s)

export function planePos(now, { x0, x1, margin = 160, speed = PLANE_SPEED, phase = 0 }) {
  const a = x0 - margin, b = x1 + margin, L = b - a;
  const T = 2 * L / speed; // tam a zpět
  const s = (((now / 1000 + phase) % T) + T) % T * speed; // ujetá dráha po trojúhelníkové vlně
  const east = s < L;
  const x = east ? a + s : b - (s - L);
  return { x, dir: east ? 1 : -1, period: T };
}
