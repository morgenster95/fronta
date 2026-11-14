// Pozorovatelna na kótě (odměna 'observation', engine/race.js activeObservation → roster.observation):
// falešný ocelový strom těsně před linií strany, která kótu drží, pod ním pozorovatel (sprite odstřelovače strany) a telefonní drát zpět do zákopu.
// Je vidět od dne dobytí do posledního dne odměny. Náhled na vývojovém serveru: /?obs=0 (Hegemonie) nebo /?obs=1 (Concord).
import { Container, Graphics, Sprite } from 'pixi.js';
import { loadTexture } from './assets.js';

export async function initObservation({ world, anchor, over, roster, map, theme, tex, openX0, openX1, V = '' }) {
  const dev = import.meta.env.DEV ? new URLSearchParams(location.search).get('obs') : null;
  const reel = import.meta.env.DEV ? new URLSearchParams(location.search).get('reel') : null;
  const obs = roster.observation || (dev != null && dev !== '' ? { by: Number(dev), name: 'Hill 304' } : reel === 'hill304' ? { by: 0, name: 'Hill 304' } : null); // reel o vítězství se vyrábí předem
  if (!obs) return null;
  let treeTex;
  try { treeTex = await loadTexture(`/assets/props/observation_tree.png${V}`); } catch { return null; }
  const f = obs.by, T = map.tile;
  const toEnemy = map.front[f] < map.front[1 - f] ? 1 : -1;
  // víc stromů podél linie vítěze (jen vzhled; uživatel 14. 11.): hlavní kousek od středu (na něj míří kamera reelu), další po stranách,
  // pevné pozice a drobné posuny, ať je všichni vidí stejně
  // 5 stromů po celé frontě (jen vzhled; uživatel 14. 11.); hlavní (první, na něj míří kamera reelu) kousek od středu
  const x0 = openX0 + (openX1 - openX0) * 0.42;
  const SPOTS = [0.42, 0.1, 0.26, 0.6, 0.82].map((u) => openX0 + (openX1 - openX0) * u - x0);
  const yBase = (map.front[f] + toEnemy * 4.5 + 1) * T; // mezi pytlovým valem a drátem (drát je 6 dlaždic před linií)
  const layer = new Container();
  world.addChildAt(layer, world.getChildIndex(over || anchor) + 1); // nad pytlovým valem, ať ho nezakryje
  const key = `${theme.factions[f].sprite}_sniper`;
  const set = tex[key] || tex[theme.factions[f].sprite];
  const look = set?.[toEnemy > 0 ? 'south' : 'north'];
  const placed = SPOTS.map((u, i) => {
    const x = Math.round(x0 + u + (i ? ((i * 37) % 41) - 20 : 0));
    const y = Math.round(yBase + (i ? ((i * 13) % 9) - 4 : 0));
    // telefonní drát: tečkovaná čára od stromu zpět k zákopu
    const wire = new Graphics();
    const y0 = y - 4, y1 = Math.round(map.front[f] * T + 16);
    for (let yy = Math.min(y0, y1); yy < Math.max(y0, y1); yy += 3) wire.rect(x + 3 + Math.round(Math.sin(yy / 9 + i) * 2), yy, 1, 2).fill(0x1c1a17);
    layer.addChild(wire);
    const tree = new Sprite(treeTex);
    tree.anchor.set(0.5, 1);
    tree.x = x; tree.y = y;
    if (i % 2) tree.scale.x = -1; // zrcadlově, ať nejsou všechny stejné
    layer.addChild(tree);
    // pozorovatel u paty stromu (otočený k nepříteli), plné krytí
    if (look) {
      const sp = new Sprite(look);
      sp.anchor.set(0.5, 30 / 32);
      sp.x = x + (i % 2 ? -17 : 17); sp.y = y + 3;
      layer.addChild(sp);
    }
    return { x, y };
  });
  const { x, y } = placed[0];
  return { x, y, by: f };
}
