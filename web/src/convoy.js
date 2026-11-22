// Zásobovací linie (22. 11. 2026, pokyn uživatele: pohyblivé vozidlo v zásobovací linii): za zálohami každé strany vede
// rozježděná cesta a po ní občas projede nákladní auto strany (PixelLab: props/truck_heg|truck_con) nebo povoz s koněm (cart_horse).
// Jen tam, kam se hráč dívá: když je cesta v záběru a nic nejede, za 6–16 s vyjede nové vozidlo z kraje záběru a přejede ho.
// Pohyb v kódu: houpání o 1 px, kouř z výfuku (auto), kroky koně (povoz). Náhled: zoom na zálohy kterékoli strany.
import { Container, Graphics, Sprite } from 'pixi.js';
import { loadTexture } from './assets.js';

export async function initConvoy({ world, anchor, map, openX0, openX1, V = '' }) {
  const load = (n) => loadTexture(`/assets/props/${n}.png${V}`).catch(() => null);
  const [truckH, truckC, cart] = await Promise.all(['truck_heg', 'truck_con', 'cart_horse'].map(load));
  if (!truckH || !truckC) return { update() {} };
  const layer = new Container();
  world.addChildAt(layer, world.getChildIndex(anchor) + 1);
  // cesta: kousek za nejzadnějšími stanovišti každé strany
  const roadY = [0, 1].map((f) => {
    const ys = map.slots[f].map((s) => s.y);
    return f === 0 ? Math.max(40, Math.min(...ys) - 110) : Math.min(map.H * map.tile - 40, Math.max(...ys) + 110);
  });
  const ruts = new Graphics();
  for (const y of roadY) {
    // dvě vyjeté koleje (tmavé, místy kaluž) a mezi nimi ušlapaný pruh
    for (let x = openX0; x < openX1; x += 4) {
      const k = (x * 7919) % 17;
      ruts.rect(x, y - 9 + (k % 3 === 0 ? 1 : 0), 4, 2).fill({ color: 0x1c1a17, alpha: 0.6 });
      ruts.rect(x, y + 1 + (k % 4 === 0 ? 1 : 0), 4, 2).fill({ color: 0x1c1a17, alpha: 0.6 });
      ruts.rect(x, y - 6, 4, 6).fill({ color: 0x3d3730, alpha: 0.35 });
      if (k === 5) ruts.rect(x, y - 8, 6, 2).fill({ color: 0x2a3138, alpha: 0.7 });
    }
  }
  layer.addChild(ruts);
  const puffs = new Graphics();
  const runs = [null, null], wait = [3000, 5000], smoke = [];
  function spawn(f, view) {
    const horse = cart && Math.random() < 0.3;
    const sp = new Sprite(horse ? cart : f === 0 ? truckH : truckC);
    const dir = Math.random() < 0.5 ? 1 : -1; // obrázky míří doprava
    sp.anchor.set(0.5, 1);
    sp.scale.x = dir;
    sp.y = roadY[f] + 4;
    sp.x = dir > 0 ? view.x0 - 50 : view.x1 + 50;
    layer.addChild(sp);
    runs[f] = { sp, dir, horse, v: horse ? 0.016 : 0.03, t0: performance.now() };
  }
  layer.addChild(puffs);
  return {
    roadY,
    update(now, dt, view) {
      for (const f of [0, 1]) {
        const y = roadY[f], seen = y > view.y0 - 20 && y < view.y1 + 40;
        const r = runs[f];
        if (!r) { if (seen) { wait[f] -= dt; if (wait[f] < 0) { spawn(f, view); wait[f] = 6000 + Math.random() * 10000; } } continue; }
        r.sp.x += r.dir * r.v * dt;
        r.sp.y = y + 4 + (Math.floor(now / (r.horse ? 180 : 120)) % 2); // houpání po rozbité cestě
        if (!r.horse && Math.random() < dt / 160) smoke.push({ x: r.sp.x - r.dir * 26, y: r.sp.y - 8, life: 900 });
        if (r.sp.x < view.x0 - 120 || r.sp.x > view.x1 + 120 || !seen) { r.sp.destroy(); runs[f] = null; }
      }
      puffs.clear();
      for (let i = smoke.length - 1; i >= 0; i--) {
        const p = smoke[i]; p.life -= dt; p.y -= dt * 0.01;
        if (p.life <= 0) { smoke.splice(i, 1); continue; }
        const a = p.life / 900, s = 2 + Math.round((1 - a) * 3);
        puffs.rect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s).fill({ color: 0x857a68, alpha: a * 0.5 });
      }
    },
  };
}
