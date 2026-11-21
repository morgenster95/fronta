// Mina pod frontou na mapě (odměna kóty reward 'mine', engine/mine.js → roster.mines), 21. 11. 2026:
// kopání (status digging): vstup do štoly v první linii vítěze (rám z trámů, rumpál), hromada vytěžené hlíny v pytlích, ženista u rumpálu, z tunelu občas vyletí hlína.
// výbuch (status blown): obří kráter natrvalo uprostřed zasaženého úseku nepřátelské první linie (props/crater_huge.png, okraje z rozházené hlíny).
// zavalená (collapsed): jen zasypaný vstup. Náhled: /?mine=0 (kope Hegemonie), /?mine=0:blown, /?mine=1:collapsed (jen dev).
import { Container, Graphics, Sprite } from 'pixi.js';
import { loadTexture } from './assets.js';

export async function initMines({ world, anchor, roster, map, theme, tex, openX0, openX1, V = '' }) {
  let mines = roster.mines || [];
  const dev = import.meta.env.DEV ? new URLSearchParams(location.search).get('mine') : null;
  if (dev) mines = dev.split(',').map((p) => { const [f, st] = p.split(':'); const fx = Number(f); const mid = (openX0 + openX1) / 2; return { id: `dev${fx}`, faction: fx, status: st || 'digging', blown: st === 'blown' ? { x0: mid - 200, x1: mid + 200 } : null }; });
  if (!mines.length) return { update() {} };
  const T = map.tile;
  const crater = await loadTexture(`/assets/props/crater_huge.png${V}`).catch(() => null);
  const layer = new Container();
  world.addChildAt(layer, world.getChildIndex(anchor) + 1);
  const frontY = (f) => { const ys = map.slots[f].filter((sl) => sl.line === 'front').map((sl) => sl.y); return ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : map.front[f] * T; };
  const items = [];
  for (const m of mines) {
    const f = m.faction, e = 1 - f;
    const toEnemy = map.front[f] < map.front[e] ? 1 : -1;
    if (m.status === 'blown' && m.blown && crater) {
      // kráter v nepřátelské první linii, natrvalo
      const box = new Container(); box.x = Math.round((m.blown.x0 + m.blown.x1) / 2); box.y = Math.round(frontY(e)); layer.addChild(box);
      const c = new Sprite(crater); c.anchor.set(0.5); c.scale.set(2.2); box.addChild(c);
      const lip = new Graphics();
      for (let k = 0; k < 40; k++) { const a = (k / 40) * Math.PI * 2, r = 70 + ((k * 37) % 23); lip.rect(Math.round(Math.cos(a) * r * 1.3), Math.round(Math.sin(a) * r * 0.75), 3 + (k % 3), 2 + (k % 2)).fill(k % 3 ? 0x3d3730 : 0x524a3f); }
      box.addChildAt(lip, 0);
      items.push({ m, box, fx: null, bits: [] });
      continue;
    }
    // vstup do štoly: v první linii vítěze, směrem k nepříteli
    const x = Math.round(openX0 + (openX1 - openX0) * (f === 0 ? 0.45 : 0.55)), y = Math.round(frontY(f) + toEnemy * 10);
    const box = new Container(); box.x = x; box.y = y; layer.addChild(box);
    const g = new Graphics();
    // vytěžená hlína v pytlích (hromada roste s časem kopání)
    for (let k = 0; k < 14; k++) { const bx = -38 + (k % 7) * 7 - ((k / 7) | 0) * 3, by = 10 - ((k / 7) | 0) * 4; g.rect(bx, by, 7, 4).fill(0x3d3730).rect(bx + 1, by, 5, 3).fill(k % 2 ? 0x857a68 : 0x6b6152).rect(bx + 1, by, 5, 1).fill(0xa39782); }
    if (m.status === 'collapsed') {
      g.rect(-10, -8, 20, 14).fill(0x2b2722); for (let k = 0; k < 10; k++) g.rect(-10 + ((k * 7) % 20), -8 + ((k * 5) % 14), 4, 3).fill(0x524a3f); // zasypáno
      g.rect(-12, -10, 2, 6).fill(0x6b6152).rect(8, -12, 2, 5).fill(0x6b6152); // zlomené trámy
    } else {
      g.rect(-11, -12, 22, 18).fill(0x0e0d0c); // černý otvor štoly
      g.rect(-13, -14, 3, 20).fill(0x6b6152).rect(10, -14, 3, 20).fill(0x6b6152).rect(-14, -16, 28, 3).fill(0x857a68); // rám z trámů
      g.rect(18, -12, 2, 14).fill(0x524a3f).rect(30, -12, 2, 14).fill(0x524a3f).rect(18, -13, 14, 2).fill(0x857a68).circle(25, -12, 3).fill(0x3d3730); // rumpál
      g.rect(24, -12, 1, 10).fill(0xa39782); // lano
    }
    box.addChild(g);
    const set = tex[theme.factions[f].sprite];
    if (set && m.status !== 'collapsed') { const sp = new Sprite(set.west || set.south); sp.anchor.set(0.5, 30 / 32); sp.x = 40; sp.y = 4; box.addChild(sp); }
    const fx = new Graphics(); box.addChild(fx);
    items.push({ m, box, fx, bits: [], next: 1500 });
  }
  function update(now, dt) {
    for (const it of items) {
      if (it.m.status !== 'digging') continue;
      it.next -= dt;
      if (it.next <= 0) { it.next = 1800 + Math.random() * 2600; for (let k = 0; k < 4; k++) it.bits.push({ x: (Math.random() - 0.5) * 10, y: -4, vx: (Math.random() - 0.5) * 0.04, vy: -0.05 - Math.random() * 0.04, t: 0 }); }
      it.fx.clear();
      it.bits = it.bits.filter((b) => (b.t += dt) < 700);
      for (const b of it.bits) { b.x += b.vx * dt; b.vy += 0.00018 * dt; b.y += b.vy * dt; it.fx.rect(Math.round(b.x), Math.round(b.y), 2, 2).fill(0x524a3f); }
    }
  }
  return { update, items };
}
