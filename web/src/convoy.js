// Zásobovací linie (22. 11. 2026, pokyn uživatele: pohyblivé vozidlo v zásobovací linii): za zálohami každé strany vede
// rozježděná cesta a po ní občas projede nákladní auto strany (PixelLab: props/truck_heg|truck_con) nebo povoz s koněm (cart_horse).
// Po každé cestě jezdí pořád několik vozidel tam i zpět (jedno zhruba na 700 px fronty), kreslí se jen to, co je v záběru.
// Pohyb v kódu: houpání o 1 px, kouř z výfuku (auto), kroky koně (povoz). Náhled: zoom na zálohy kterékoli strany.
import { Container, Graphics, Sprite } from 'pixi.js';
import { loadTexture } from './assets.js';

export async function initConvoy({ world, anchor, map, openX0, openX1, V = '' }) {
  const load = (n) => loadTexture(`/assets/props/${n}.png${V}`).catch(() => null);
  const [truckH, truckC, cart] = await Promise.all(['truck_heg', 'truck_con', 'cart_horse'].map(load));
  if (!truckH || !truckC) return { update() {} };
  const layer = new Container();
  world.addChildAt(layer, world.getChildIndex(anchor) + 1);
  // cesta mezi podpůrnou linií a zálohami (tam, kde je vidět i dělo), ať ji hráč při prohlížení fronty opravdu uvidí
  const ext = (f, line) => { const ys = map.slots[f].filter((sl) => sl.line === line).map((sl) => sl.y); return ys.length ? [Math.min(...ys), Math.max(...ys)] : null; };
  const roadY = [0, 1].map((f) => {
    const sup = ext(f, 'support'), res = ext(f, 'reserve');
    if (sup && res) return Math.round(f === 0 ? (res[1] + sup[0]) / 2 : (sup[1] + res[0]) / 2) + (f === 0 ? -14 : 14);
    const ys = map.slots[f].map((sl) => sl.y);
    return f === 0 ? Math.min(...ys) - 60 : Math.max(...ys) + 60;
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
  // kolona: po každé cestě jezdí pořád několik vozidel rozmístěných po celé otevřené frontě (jedno zhruba na 700 px), tam i zpět
  const smoke = [];
  const fleet = [];
  const span = openX1 - openX0;
  for (const f of [0, 1]) {
    const n = Math.max(4, Math.round(span / 700));
    for (let i = 0; i < n; i++) {
      const horse = cart && i % 3 === 2;
      const sp = new Sprite(horse ? cart : f === 0 ? truckH : truckC);
      const dir = (i + f) % 2 ? 1 : -1; // obrázky míří doprava
      sp.anchor.set(0.5, 1);
      sp.scale.x = dir;
      layer.addChild(sp);
      fleet.push({ sp, f, dir, horse, v: horse ? 0.014 : 0.028, x: openX0 + ((i + 0.5 + f * 0.3) / n) * span });
    }
  }
  layer.addChild(puffs);
  return {
    roadY,
    update(now, dt, view) {
      dt = Math.min(dt, 100);
      for (const r of fleet) {
        r.x += r.dir * r.v * dt;
        if (r.x > openX1 + 60) r.x = openX0 - 60; else if (r.x < openX0 - 60) r.x = openX1 + 60;
        const y = roadY[r.f], seen = r.x > view.x0 - 80 && r.x < view.x1 + 80 && y > view.y0 - 60 && y < view.y1 + 60;
        r.sp.visible = seen;
        if (!seen) continue;
        r.sp.x = Math.round(r.x);
        r.sp.y = y + 4 + (Math.floor(now / (r.horse ? 180 : 120)) % 2); // houpání po rozbité cestě
        if (!r.horse && Math.random() < dt / 160) smoke.push({ x: r.sp.x - r.dir * 28, y: r.sp.y - 6, life: 900 }); // výfuk vzadu u země
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
