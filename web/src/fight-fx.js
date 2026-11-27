// Boj zblízka PŘÍMO VE HŘE (reel, 18. 11. 2026; uživatel: cinematiky v měřítku hry se sprity ze hry, ne animace vložená do detailního obrázku).
// Do vrstvy vojáků na mapě přidá vlastní „herce“ (Pixi Sprite) se sprity a animacemi ze hry; skutečného vojáka na stanovišti na chvíli schová.
// Lopatka (úder zblízka) je z PixelLabu ve stejném měřítku jako herní sprity (art/cine/anim/shovel_*.png, jen pro videa, web je nestahuje).
//   const fight = await makeFight({ anims, soldiers });
//   fight.scene({ at: 0, defender: s, side: 1 })   // raider strany `side` vpadne k obránci `defender`; vrací časy (hit, kill)
//   fight.update(t)                                 // každý snímek reelu
import { Assets, Container, Sprite, Texture } from 'pixi.js';

const files = import.meta.glob('../../art/cine/anim/shovel_*.png', { eager: true, import: 'default' });

// kotva jako v life.js (pata na řádku 30 původních 32 px); u lopatek z PixelLabu pata podle spodku postavy v 1. snímku
const anchorOf = (t, foot) => [0.5, foot != null ? foot / t.height : (30 + (t.height - 32) / 2) / t.height];

export async function makeFight({ anims, soldiers, tex = {} }) {
  const load = async (side) => {
    const urls = Object.keys(files).filter((k) => k.includes(`shovel_${side}_`)).sort().map((k) => files[k]);
    const tx = await Promise.all(urls.map((u) => Assets.load(u)));
    tx.forEach((t) => { if (t.source) t.source.scaleMode = 'nearest'; });
    return tx;
  };
  const SH = { 1: await load('concord'), 0: await load('hegemony') };
  const FOOT = { 1: 39.5, 0: 41.5 }; // spodní řádek postavy v lopatkových snímcích (48×48 Concord, 56×52 Hegemonie)
  const A = (key, anim, dir) => anims[key]?.[anim]?.[dir] || [];
  // vlastní vrstva vedle bloků vojáků (do bloku se nic přidávat nesmí: main.js bere jeho děti jako vojáky)
  let parent = null;
  const par = () => {
    if (parent) return parent;
    const chunk = soldiers.find((s) => s.sprite?.parent?.parent)?.sprite.parent;
    if (!chunk) return null;
    parent = new Container();
    parent.sortableChildren = true;
    chunk.parent.addChild(parent); // nad všemi bloky (jinak by ho překryl další blok mapy)
    return parent;
  };
  const acts = []; // { sp, keys: [[t0, frames, fps, foot, loop, x0, y0, x1, y1, dur]], hide?: soldier, from, to }
  const hidden = [];
  const props = [];

  function actor(x, y) {
    const sp = new Sprite(Texture.EMPTY);
    sp.visible = false;
    sp.position.set(x, y);
    sp.zIndex = y + 0.5;
    par()?.addChild(sp);
    return { sp, keys: [] };
  }
  // úsek animace: od t0, snímky `fr` rychlostí fps (loop nebo poslední snímek drží), pohyb z (x0,y0) do (x1,y1) za dur
  const seg = (a, t0, fr, fps, { foot = null, loop = false, from = null, to = null, dur = 0 } = {}) => a.keys.push({ t0, fr, fps, foot, loop, from, to, dur });

  return {
    // souboj lopatek: raider strany `side` stojí u obránce už od prvního snímku (žádný pád z nebe), oba se rozmáchnou;
    // win = 'raider' (obránce padne, pak raidera zastřelí soused obránce, je vidět od začátku) nebo 'defender' (padne raider)
    scene({ at, defender, side, shooter = null, end = at + 4, win = 'raider', delay = 0 }) {
      if (!defender) return null;
      const dx = side === 1 ? -1 : 1; // Concord stojí vlevo (míří na východ), Hegemonie vpravo (na západ)
      const dirR = side === 1 ? 'east' : 'west', dirD = side === 1 ? 'west' : 'east';
      const kD = defender.faction === 0 ? 'hegemony' : 'concord', kR = side === 0 ? 'hegemony' : 'concord';
      const x = defender.x, y = defender.y;
      const R = actor(x + dx * 13, y), Dd = actor(x, y);
      const go = at + delay, HIT = go + 0.85, KILL = HIT + 0.95;
      seg(R, at, [SH[side][0]], 1, { foot: FOOT[side] });
      seg(R, go, SH[side], 10, { foot: FOOT[side], loop: win === 'defender' ? false : false });
      seg(Dd, at, [SH[defender.faction][0]], 1, { foot: FOOT[defender.faction] });
      seg(Dd, go + 0.05, SH[defender.faction], 10, { foot: FOOT[defender.faction] }); // brání se lopatkou
      let S = null;
      if (win === 'raider') {
        seg(Dd, HIT + 0.05, A(kD, 'die', dirD), 10, {});
        if (shooter) { // soused obránce (odstřelovač z boku) stojí vedle od začátku, zamíří a raidera zastřelí
          const kS = shooter.faction === 0 ? 'hegemony_sniper' : 'concord_sniper';
          S = actor(x - dx * 24, y);
          const fs = A(kS, 'fire-side', dirD);
          seg(S, at, [fs[0]], 1, {});
          seg(S, KILL - 0.45, fs, 12, {});
          hidden.push([shooter, at, end]);
          S.from = at; S.to = end;
          seg(R, KILL, A(kR, 'die', dirR), 10, {});
        }
      } else if (win === 'hurt') { // 27. 11.: obránce dostane lopatou a padne (přežije), raider se otočí a odejde od drátu (bez zastřelení)
        seg(Dd, HIT + 0.05, A(kD, 'fall', dirD), 10, {});
        seg(Dd, HIT + 1.0, A(kD, 'lying-wounded', dirD), 1, {});
        const away = side === 1 ? 'south' : 'north';
        seg(R, HIT + 0.5, A(kR, 'walk', away), 7, { loop: true, from: [x + dx * 13, y], to: [x + dx * 13, y + (side === 1 ? 70 : -70)], dur: 3.4 });
      } else {
        seg(R, HIT + 0.05, A(kR, 'die', dirR), 10, {});
      }
      R.from = at; R.to = end; Dd.from = at; Dd.to = end;
      acts.push(R, Dd, ...(S ? [S] : []));
      hidden.push([defender, at, end]);
      return { hit: HIT, shot: S ? KILL - 0.1 : null, kill: KILL, x, y };
    },
    // plazící se raideři v zemi nikoho (crawl ze hry), směr k nepříteli
    crawlers({ at, end, x, y, n = 4, side = 1 }) {
      
      const k = side === 1 ? 'concord' : 'hegemony', dir = side === 1 ? 'north' : 'south';
      const fr = A(k, 'crawl', dir);
      for (let i = 0; i < n; i++) {
        const ax = x + (i - (n - 1) / 2) * 16 + ((i * 7) % 5), ay = y + ((i * 11) % 9);
        const a = actor(ax, ay);
        seg(a, at + i * 0.1, fr, 7, { loop: true, from: [ax, ay], to: [ax, ay + (side === 1 ? -26 : 26)], dur: end - at });
        a.from = at; a.to = end;
        acts.push(a);
      }
    },
    // obecný herec (Front News, 19. 11.): úseky { t0, key, anim, dir, fps, loop, move: [x1, y1, dur] } nebo { t0, key, dir } = stojí (statický sprite)
    puppet({ x, y, from, to, keys, hide = null }) {
      const a = actor(x, y);
      let px = x, py = y;
      for (const k of keys) {
        const fr = k.anim ? A(k.key, k.anim, k.dir) : [tex[k.key]?.[k.dir]].filter(Boolean);
        const mv = k.move ? { from: [px, py], to: [k.move[0], k.move[1]], dur: k.move[2] } : { from: [px, py], to: [px, py], dur: 0 };
        seg(a, k.t0, fr, k.fps || 8, { loop: !!k.loop, ...mv });
        if (k.move) { px = k.move[0]; py = k.move[1]; }
      }
      a.from = from; a.to = to;
      acts.push(a);
      if (hide) hidden.push([hide, from, to]);
      return a;
    },
    // rekvizita z malého obrázku (canvas), poloha z funkce pos(t) → [x, y] nebo null (neviditelná)
    prop({ canvas, from, to, pos }) {
      const sp = new Sprite(Texture.from(canvas));
      if (sp.texture.source) sp.texture.source.scaleMode = 'nearest';
      sp.anchor.set(0.5, 0.5); sp.visible = false;
      props.push({ sp, from, to, pos });
    },
    update(t) {
      for (const [s, a, b] of hidden) if (s.sprite) s.sprite.visible = !(t >= a && t < b); // skutečný voják ustoupí herci (žádní dva na jednom místě)
      for (const p of props) {
        if (!p.sp.parent) par()?.addChild(p.sp);
        const q = t >= p.from && t < p.to ? p.pos(t) : null;
        p.sp.visible = !!q;
        if (q) { p.sp.position.set(q[0], q[1]); p.sp.zIndex = q[1] + 50; }
      }
      for (const a of acts) {
        if (!a.sp.parent) par()?.addChild(a.sp); // vrstva vojáků vzniká až se sprity
        const on = t >= a.from && t < a.to;
        a.sp.visible = on;
        if (!on) continue;
        const k = a.keys.filter((q) => q.t0 <= t).at(-1) || a.keys[0];
        if (!k?.fr?.length) { a.sp.visible = false; continue; }
        const i = Math.floor((t - k.t0) * k.fps);
        const tx = k.fr[k.loop ? ((i % k.fr.length) + k.fr.length) % k.fr.length : Math.max(0, Math.min(k.fr.length - 1, i))];
        if (a.sp.texture !== tx) { a.sp.texture = tx; a.sp.anchor.set(...anchorOf(tx, k.foot)); }
        if (k.from && k.to) { const u = k.dur ? Math.min(1, (t - k.t0) / k.dur) : 1; a.sp.position.set(k.from[0] + (k.to[0] - k.from[0]) * u, k.from[1] + (k.to[1] - k.from[1]) * u); a.sp.zIndex = a.sp.y + 0.5; }
      }
    },
  };
}
