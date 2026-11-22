// Těžké dělo na mapě (odměna kóty reward 'gun', engine/gun.js → roster.guns), 20. 11. 2026:
// dělostřelecký okop z pytlů s maskovací sítí (PixelLab, props/gun_pit.png) mezi podpůrnou linií a zálohami vlastníka,
// v něm houfnice strany (gun_heg zepředu / gun_con zezadu) nebo vrak (gun_wreck), hromádka granátů a obsluha (sprity strany).
// Výstřel: záblesk u ústí, couvnutí hlavně, kouř; za chvíli dopad v cílovém úseku nepřítele (roster.guns[].last.x0..x1) přes life.debug.shell.
// Nic neletí přes celou frontu (pravidlo uživatele). Poškozené dělo (<60 %) kouří a je tmavší. Náhled: /?gun=0 nebo /?gun=0:0.4,1:0 (jen dev).
import { Container, Graphics, Sprite } from 'pixi.js';
import { loadTexture } from './assets.js';

export async function initGuns({ world, anchor, roster, map, theme, tex, life, openX0, openX1, V = '' }) {
  let guns = roster.guns || [];
  const dev = import.meta.env.DEV ? new URLSearchParams(location.search).get('gun') : null;
  if (dev) guns = dev.split(',').map((p) => { const [f, c] = p.split(':'); const cond = c != null ? Number(c) : 1; return { id: `dev${f}`, faction: Number(f), cond, destroyed: cond <= 0, last: null }; });
  if (!guns.length) return { update() {}, guns: [] };
  const T = map.tile;
  const load = (n) => loadTexture(`/assets/props/${n}.png${V}`).catch(() => null);
  const [pitT, hegT, conT, wreckT] = await Promise.all(['gun_pit', 'gun_heg', 'gun_con', 'gun_wreck'].map(load));
  if (!pitT) return { update() {}, guns: [] };
  const layer = new Container();
  world.addChildAt(layer, world.getChildIndex(anchor) + 1);
  const ext = (f, line) => { const ys = map.slots[f].filter((sl) => sl.line === line).map((sl) => sl.y); return ys.length ? [Math.min(...ys), Math.max(...ys)] : null; };
  const items = guns.map((g, i) => {
    const f = g.faction, sup = ext(f, 'support'), res = ext(f, 'reserve');
    const toEnemy = map.front[f] < map.front[1 - f] ? 1 : -1;
    const y = Math.round(sup && res ? (f === 0 ? (res[1] + sup[0]) / 2 : (sup[1] + res[0]) / 2) : (map.front[f] - toEnemy * 9) * T);
    const x = Math.round(openX0 + (openX1 - openX0) * (f === 0 ? 0.3 : 0.7) + i * 160);
    const box = new Container(); box.x = x; box.y = y; layer.addChild(box);
    const pit = new Sprite(pitT); pit.anchor.set(0.5, 0.6); box.addChild(pit);
    // hromádka granátů a nábojnic (kresleno v kódu, paleta Trench-24)
    const shells = new Graphics();
    for (let k = 0; k < 5; k++) { const sx = -30 + k * 4, sy = 6 + (k % 2) * 2; shells.rect(sx, sy - 7, 3, 7).fill(0x6b6152).rect(sx, sy - 9, 3, 2).fill(0x857a68).rect(sx, sy - 1, 3, 1).fill(0x3d3730); }
    for (let k = 0; k < 3; k++) shells.rect(-14 + k * 3, 9, 2, 4).fill(0xd98f3f).rect(-14 + k * 3, 9, 2, 1).fill(0xc9c26a);
    box.addChild(shells);
    // obsluha: 3 vojáci strany (plné krytí), u vraku nikdo; nabíječ za dělem (u Hegemonie za ním, u Concordu u lafety)
    const set = tex[theme.factions[f].sprite];
    const crew = (dx, dy, d) => { const sp = new Sprite(set[d] || set.south); sp.anchor.set(0.5, 30 / 32); sp.x = dx; sp.y = dy; box.addChild(sp); };
    if (set && !g.destroyed && toEnemy > 0) crew(6, -14, 'south');
    const gunT = g.destroyed ? wreckT : f === 0 ? hegT : conT;
    const gun = gunT ? new Sprite(gunT) : null;
    if (gun) { gun.anchor.set(0.5, 0.65); gun.y = -2; if (!g.destroyed && g.cond < 0.6) gun.tint = 0xb0a898; box.addChild(gun); }
    if (set && !g.destroyed) { crew(-32, 6, 'east'); crew(32, 6, 'west'); if (toEnemy < 0) crew(14, 20, 'north'); }
    const fx = new Graphics(); box.addChild(fx);
    // ústí hlavně (podle obrázku: Hegemonie míří dolů vpravo k nepříteli, Concord nahoru vlevo)
    const muzzle = f === 0 ? [20, 8] : [-22, -18];
    return { g, f, x, y, box, gun, fx, muzzle, next: 3000 + i * 2500, puffs: [], recoil: 0 };
  });

  function update(now, dt, view) {
    for (const it of items) {
      const { g } = it;
      // kouř z poškozeného nebo zničeného děla
      if ((g.destroyed || g.cond < 0.6) && Math.random() < dt / 260) it.puffs.push({ x: (Math.random() - 0.5) * 16, y: -6, r: 2, a: 0.55, vy: -0.012, dark: true });
      if (!g.destroyed && g.cond > 0.01) {
        it.next -= dt;
        if (it.next <= 0) {
          it.next = (g.cond >= 0.6 ? 7000 : 14000) + Math.random() * 6000;
          it.flash = 120; it.recoil = 160;
          api.sfx?.cannon?.(it.x + it.muzzle[0], it.y + it.muzzle[1]); // výstřel slyšet podle polohy (22. 11.)
          for (let k = 0; k < 5; k++) it.puffs.push({ x: it.muzzle[0] + (Math.random() - 0.5) * 6, y: it.muzzle[1] + (Math.random() - 0.5) * 4, r: 2 + Math.random() * 2, a: 0.7, vy: -0.01 - Math.random() * 0.01 });
          // dopad v cílovém úseku nepřítele až po letové době; jen místně, nic neletí přes frontu
          const L = g.last, e = 1 - it.f;
          const tx = L?.x0 != null ? L.x0 + Math.random() * Math.max(10, L.x1 - L.x0) : it.x + (Math.random() - 0.5) * 300;
          const ty = (map.front[e] * T + 16) + (e === 0 ? -1 : 1) * Math.random() * 30;
          setTimeout(() => { if (tx > view.x0 - 80 && tx < view.x1 + 80 && ty > view.y0 - 80 && ty < view.y1 + 80) life.debug?.shell?.(tx, ty, true); }, 1800 + Math.random() * 700);
        }
      }
      // couvnutí hlavně, záblesk, kouř
      if (it.gun) it.gun.x = it.recoil > 0 ? (it.f === 0 ? -2 : 2) * (it.recoil / 160) : 0;
      it.recoil = Math.max(0, it.recoil - dt);
      const fx = it.fx; fx.clear();
      if (it.flash > 0) { const [mx, my] = it.muzzle; fx.circle(mx, my, 7).fill({ color: 0xfff6dc, alpha: 0.9 }).circle(mx, my, 12).fill({ color: 0xd98f3f, alpha: 0.35 }); it.flash -= dt; }
      for (let k = it.puffs.length - 1; k >= 0; k--) {
        const p = it.puffs[k]; p.y += p.vy * dt; p.r += 0.006 * dt; p.a -= 0.00035 * dt;
        if (p.a <= 0) { it.puffs.splice(k, 1); continue; }
        fx.circle(p.x, p.y, p.r).fill({ color: p.dark ? 0x3d3730 : 0x9a958a, alpha: p.a });
      }
    }
  }
  // fire(): výstřel hned (natáčení reelů)
  const api = { update, sfx: null, fire() { for (const it of items) it.next = 0; }, guns: items.map((it) => ({ x: it.x, y: it.y, faction: it.f })) };
  return api;
}
