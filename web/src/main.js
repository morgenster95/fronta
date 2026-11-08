// Prohlížeč fronty: terén po blocích, tisíce vojáků, úrovně detailu, kamera a UI.
import { Application, Assets, Container, Graphics, Sprite, Texture, TextureSource, TilingSprite } from 'pixi.js';
import { generateFront, DIRS } from '../../engine/mapgen.js';
import { hash2 } from '../../engine/rng.js';
import { Camera } from './camera.js';
import { paintChunk, paintOverview, CHUNK } from './terrain.js';
import { initUI } from './ui.js';

TextureSource.defaultOptions.scaleMode = 'nearest';

const SPRITE_ZOOM = 0.9; // pod tímhle zoomem jsou vojáci jen tečky
const DETAIL_ZOOM = 0.3; // pod tímhle se terén kreslí z přehledové textury
const MIRROR = { west: 'east', 'south-west': 'south-east', 'north-west': 'north-east' };

async function boot() {
  const [theme, roster, manifest] = await Promise.all([
    fetch('/data/theme.json').then((r) => r.json()),
    fetch('/data/roster.json').then((r) => r.json()),
    fetch('/assets/soldiers/manifest.json').then((r) => r.json()),
  ]);
  const map = generateFront(theme.map);
  const worldW = map.W * map.tile, worldH = map.H * map.tile;

  const app = new Application();
  await app.init({
    resizeTo: window,
    background: '#1c1a17',
    antialias: false,
    roundPixels: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
  });
  document.getElementById('stage').appendChild(app.canvas);

  // textury vojáků
  const tex = {};
  await Promise.all(
    theme.factions.flatMap((f) => {
      tex[f.sprite] = {};
      return DIRS.map(async (d) => {
        const file = manifest[f.sprite]?.[d] ?? manifest[f.sprite]?.[MIRROR[d]] ?? manifest[f.sprite]?.south;
        tex[f.sprite][d] = await Assets.load(`/assets/soldiers/${file}`);
      });
    }),
  );

  const world = new Container();
  app.stage.addChild(world);
  const overview = new Sprite(Texture.from(paintOverview(map)));
  overview.scale.set(map.tile);
  world.addChild(overview);
  const terrainLayer = new Container();
  world.addChild(terrainLayer);
  const soldierLayer = new Container();
  world.addChild(soldierLayer);
  const dots = new Graphics();
  world.addChild(dots);
  const marker = new Graphics();
  world.addChild(marker);

  // --- vojáci ---
  const F = Object.fromEntries(roster.fields.map((f, i) => [f, i]));
  const soldiers = roster.soldiers.map((row, i) => {
    const slot = map.slots[row[F.faction]][row[F.order]];
    return {
      i,
      handle: row[F.handle],
      faction: row[F.faction],
      archetype: theme.archetypes[row[F.archetype]],
      rank: row[F.rank],
      status: row[F.status],
      variant: row[F.variant],
      claimed: !!row[F.claimed],
      generation: row[F.generation],
      name: row[F.name],
      slot,
      x: slot ? slot.x : null,
      y: slot ? slot.y : null,
    };
  });
  const placed = soldiers.filter((s) => s.slot && s.status !== 4 && s.status !== 2 && s.status !== 3);
  const TINT = [0xffffff, 0xf0ece4, 0xe6e2da, 0xfff4e8];
  const chunkSoldiers = new Map(); // chunk key → Container
  const ckey = (x, y) => `${Math.floor(x / (CHUNK * map.tile))},${Math.floor(y / (CHUNK * map.tile))}`;
  for (const s of placed.sort((a, b) => a.y - b.y)) {
    const f = theme.factions[s.faction];
    const d = DIRS[s.slot.d];
    const sp = new Sprite(tex[f.sprite][d]);
    sp.anchor.set(0.5, 30 / 32);
    if (MIRROR[d]) sp.scale.x = -1;
    sp.x = s.x;
    sp.y = s.y;
    sp.tint = s.status === 1 ? 0xd8b8a8 : TINT[s.variant % TINT.length];
    sp.baseY = s.y;
    sp.phase = hash2(s.i, 3, 1) * 3000;
    s.sprite = sp;
    const k = ckey(s.x, s.y);
    if (!chunkSoldiers.has(k)) {
      const c = new Container();
      c.visible = false;
      chunkSoldiers.set(k, c);
      soldierLayer.addChild(c);
    }
    chunkSoldiers.get(k).addChild(sp);
  }
  // prostorový index pro klepnutí
  const grid = new Map();
  const gk = (x, y) => `${Math.floor(x / 64)},${Math.floor(y / 64)}`;
  for (const s of placed) {
    const k = gk(s.x, s.y);
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(s);
  }
  function pickAt(wx, wy) {
    let best = null, bd = 22;
    for (let gx = -1; gx <= 1; gx++)
      for (let gy = -1; gy <= 1; gy++) {
        for (const s of grid.get(gk(wx + gx * 64, wy + gy * 64)) || []) {
          const d = Math.hypot(s.x - wx, s.y - 14 - wy);
          if (d < bd) { bd = d; best = s; }
        }
      }
    return best;
  }

  let dotZoom = 0;
  function drawDots(zoom) {
    const size = Math.max(3, 2.5 / zoom);
    if (Math.abs(size - dotZoom) / size < 0.25) return;
    dotZoom = size;
    dots.clear();
    for (const fi of [0, 1]) {
      const col = parseInt(theme.factions[fi].dot.slice(1), 16);
      for (const s of placed) if (s.faction === fi) dots.rect(s.x - size / 2, s.y - size, size, size);
      dots.fill({ color: col });
    }
  }

  // --- terén po blocích, kreslí se líně ---
  const chunks = new Map();
  const queue = [];
  function ensureChunk(cx, cy) {
    const k = `${cx},${cy}`;
    if (chunks.has(k)) return chunks.get(k);
    const entry = { sprite: null, queued: true };
    chunks.set(k, entry);
    queue.push([cx, cy, entry]);
    return entry;
  }
  function pump(budgetMs) {
    const t0 = performance.now();
    while (queue.length && performance.now() - t0 < budgetMs) {
      // nejdřív bloky nejblíž středu kamery
      queue.sort((a, b) => dist2(b) - dist2(a));
      const [cx, cy, entry] = queue.pop();
      const sp = new Sprite(Texture.from(paintChunk(map, cx, cy)));
      sp.x = cx * CHUNK * map.tile;
      sp.y = cy * CHUNK * map.tile;
      entry.sprite = sp;
      entry.queued = false;
      terrainLayer.addChild(sp);
    }
  }
  const dist2 = ([cx, cy]) => {
    const s = CHUNK * map.tile;
    return ((cx + 0.5) * s - cam.x) ** 2 + ((cy + 0.5) * s - cam.y) ** 2;
  };

  // --- atmosféra: déšť, mlha, záblesky dělostřelectva ---
  const fx = new Container();
  app.stage.addChild(fx);
  const fogCanvas = document.createElement('canvas');
  fogCanvas.width = fogCanvas.height = 256;
  {
    const c = fogCanvas.getContext('2d');
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * 256, y = Math.random() * 256, r = 20 + Math.random() * 50;
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(163,151,130,0.05)');
      g.addColorStop(1, 'rgba(163,151,130,0)');
      c.fillStyle = g;
      for (const ox of [-256, 0, 256]) for (const oy of [-256, 0, 256]) { c.save(); c.translate(ox, oy); c.fillRect(x - r, y - r, r * 2, r * 2); c.restore(); }
    }
  }
  const fogTex = Texture.from(fogCanvas);
  fogTex.source.scaleMode = 'linear';
  const fog = new TilingSprite({ texture: fogTex, width: app.screen.width, height: app.screen.height });
  fog.tileScale.set(3);
  fx.addChild(fog);
  const rain = new Graphics();
  fx.addChild(rain);
  const flash = new Graphics();
  fx.addChild(flash);
  const drops = Array.from({ length: 160 }, () => ({ x: Math.random(), y: Math.random(), v: 0.6 + Math.random() * 0.6 }));
  let flashT = 0, nextFlash = 3000;

  // --- kamera ---
  const minZoom = Math.min(app.screen.width / worldW, app.screen.height / worldH);
  const cam = new Camera(app.canvas, {
    minZoom: Math.max(minZoom, 0.05),
    maxZoom: 6,
    bounds: { w: worldW, h: worldH },
    onTap: (p) => {
      const s = pickAt(p.x, p.y);
      if (s) ui.openSoldier(s);
      else ui.closeAll();
    },
  });

  let selected = null;
  function select(s) {
    selected = s;
  }

  // --- UI ---
  const ui = initUI({
    theme,
    roster,
    soldiers,
    tex,
    onSelect: (s, fly = true) => {
      select(s);
      if (fly && s.slot) {
        // karta zakrývá spodní část obrazovky → voják ve horní třetině
        const z = Math.max(cam.zoom, 3);
        cam.flyTo(s.x, s.y - 16 + (cam.h * 0.22) / z, z);
      }
    },
    onZoom: (f) => cam.zoomAt(cam.w / 2, cam.h / 2, f),
  });

  // výchozí pohled: přiblížené bojiště u obsazené přední linie (nebo voják z odkazu ?s=handle)
  const params = new URLSearchParams(location.search);
  const wanted = params.get('s')?.toLowerCase().replace(/^@/, '');
  const start = (wanted && soldiers.find((s) => s.handle === wanted && s.slot)) || null;
  const initZoom = Math.min(4, Math.max(2, app.screen.width / (22 * map.tile)));
  if (start) {
    cam.set(start.x, start.y - 16 + (cam.h * 0.22) / Math.max(initZoom, 3), Math.max(initZoom, 3));
    select(start);
    setTimeout(() => ui.openSoldier(start, false), 400);
  } else {
    const fi = Math.random() < 0.5 ? 0 : 1;
    const first = map.slots[fi][Math.floor(Math.random() * Math.min(60, placed.length / 2))] || map.slots[fi][0];
    // pohled tak, aby byla vidět přední linie i kus země nikoho
    cam.set(first.x, first.y + (fi === 0 ? 60 : -60), initZoom);
  }

  // --- smyčka ---
  app.ticker.add(() => {
    const now = performance.now();
    cam.update(now);
    const z = cam.zoom;
    world.scale.set(z);
    world.position.set(Math.round(cam.w / 2 - cam.x * z), Math.round(cam.h / 2 - cam.y * z));

    const view = {
      x0: cam.x - cam.w / 2 / z, y0: cam.y - cam.h / 2 / z,
      x1: cam.x + cam.w / 2 / z, y1: cam.y + cam.h / 2 / z,
    };
    const S = CHUNK * map.tile;
    const detail = z >= DETAIL_ZOOM;
    overview.visible = true;
    terrainLayer.visible = detail;
    const visible = new Set();
    if (detail) {
      for (let cy = Math.max(0, Math.floor(view.y0 / S)); cy <= Math.min(Math.ceil(map.H / CHUNK) - 1, Math.floor(view.y1 / S)); cy++)
        for (let cx = Math.max(0, Math.floor(view.x0 / S)); cx <= Math.min(Math.ceil(map.W / CHUNK) - 1, Math.floor(view.x1 / S)); cx++) {
          visible.add(`${cx},${cy}`);
          ensureChunk(cx, cy);
        }
      pump(queue.length > 4 ? 24 : 12);
    }
    for (const [k, e] of chunks) if (e.sprite) e.sprite.visible = visible.has(k);

    const showSprites = z >= SPRITE_ZOOM;
    dots.visible = !showSprites;
    if (!showSprites) drawDots(z);
    for (const [k, c] of chunkSoldiers) {
      c.visible = showSprites && visible.has(k);
      if (!c.visible) continue;
      // jemné „dýchání“: posun o 1 px
      for (const sp of c.children) sp.y = sp.baseY - ((now + sp.phase) % 3000 < 1500 ? 0 : 1);
    }

    // značka vybraného vojáka
    marker.clear();
    if (selected?.slot) {
      const bob = Math.round(Math.sin(now / 250) * 2);
      const mx = selected.x, my = selected.y - 38 + bob;
      const col = parseInt(theme.factions[selected.faction].dot.slice(1), 16);
      const sz = Math.max(1, 2 / Math.min(z, 2));
      marker.poly([mx - 4 * sz, my - 5 * sz, mx + 4 * sz, my - 5 * sz, mx, my]).fill({ color: 0x0e0d0c });
      marker.poly([mx - 3 * sz, my - 4.5 * sz, mx + 3 * sz, my - 4.5 * sz, mx, my - sz]).fill({ color: col });
    }

    // déšť
    const W = app.screen.width, H = app.screen.height;
    fog.width = W;
    fog.height = H;
    fog.tilePosition.x = -cam.x * z * 0.3 + now * 0.004;
    fog.tilePosition.y = -cam.y * z * 0.3;
    rain.clear();
    for (const d of drops) {
      d.y += 0.012 * d.v;
      d.x -= 0.002 * d.v;
      if (d.y > 1) { d.y = 0; d.x = Math.random() * 1.1; }
      rain.moveTo(d.x * W, d.y * H).lineTo(d.x * W - 3, d.y * H + 12 * d.v);
    }
    rain.stroke({ color: 0xa39782, alpha: 0.25, width: 1 });
    // vzdálené záblesky
    flash.clear();
    nextFlash -= app.ticker.deltaMS;
    if (nextFlash < 0) { flashT = 1; nextFlash = 2500 + Math.random() * 7000; }
    if (flashT > 0) {
      flash.rect(0, 0, W, H).fill({ color: 0xd98f3f, alpha: 0.07 * flashT });
      flashT -= app.ticker.deltaMS / 400;
    }
  });

  document.getElementById('loading').classList.add('done');
}

boot().catch((e) => {
  console.error(e);
  document.getElementById('loading').textContent = 'The line has been cut. Reload.';
});
