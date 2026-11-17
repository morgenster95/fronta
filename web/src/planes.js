// Letadla pilotů nad frontou (17. 11. 2026, nová vzácná role PILOT: jeden na stranu; docs/MECHANICS.md).
// Sprite z PixelLabu (96×96 shora, nos vpravo, bez vrtule; art/props/plane/): Hegemonie šedá s rezavým pruhem, Concord oliva se žlutou hvězdou,
// každá strana má dva typy (0 = dvouplošník, 1 = trojplošník). Vrtule, stín, kouř z motoru a houpání jsou kreslené v kódu.
// Dráha (web/src/plane-path.js): letadlo bez přestávky pluje tam a zpět po celé otevřené frontě, nezávisle na kameře; mimo výřez se nekreslí.
// Zapnuto, když strana má pilota (`roster.pilots[f]` = { handle, variant }) nebo v dev náhledu /?planes=0,1 (strana) či /?planes=0:1,1:0 (strana:typ).
import { Container, Graphics, Sprite } from 'pixi.js';
import { loadTexture } from './assets.js';
import { planePos, PLANE_SPEED } from './plane-path.js';

const NAMES = ['heg', 'con'];
const NOSE = 36; // vrtule: vzdálenost nosu od středu sprite (px)

export function initPlanes({ world, map, roster, openX0, openX1 }) {
  const sp = import.meta.env.DEV ? new URLSearchParams(location.search) : null;
  const q = sp ? (sp.get('planes') ?? (sp.get('reel') === 'pilot' ? '0:0,1:1' : null)) : null; // reel „pilot“ ukazuje obě letadla
  const dev = q ? q.split(',').map((x) => { const [f, v] = x.split(':'); return { f: Number(f), v: Number(v) || 0 }; }) : [];
  const planes = [];
  for (const f of [0, 1]) {
    const p = roster?.pilots?.[f];
    const d = dev.find((x) => x.f === f);
    if (!p && !d) continue;
    const variant = d ? d.v : (p.variant ?? 0) % 2;
    planes.push({ f, variant, handle: p?.handle || null, t0: f * 7000, pass: -1, x: 0, y: 0, dir: 1, live: false, puffs: [] });
  }
  if (!planes.length) return { planes, update() {} };
  const layer = new Container();
  world.addChild(layer);
  const smoke = new Graphics();
  const shadowLayer = new Container(), bodyLayer = new Container();
  layer.addChild(shadowLayer, smoke, bodyLayer);
  for (const pl of planes) {
    pl.shadow = new Sprite(); pl.shadow.anchor.set(0.5); pl.shadow.tint = 0x000000; pl.shadow.alpha = 0.26;
    pl.body = new Container();
    pl.spr = new Sprite(); pl.spr.anchor.set(0.5);
    pl.prop = new Graphics();
    pl.body.addChild(pl.spr, pl.prop);
    shadowLayer.addChild(pl.shadow); bodyLayer.addChild(pl.body);
    pl.body.visible = pl.shadow.visible = false;
    loadTexture(`/assets/props/plane_${NAMES[pl.f]}_${pl.variant}.png`).then((t) => { pl.spr.texture = t; pl.shadow.texture = t; }).catch(() => {});
  }
  let raised = false;
  // poloha letadla v čase `now` (ms): sdílí ji kreslení i reel, který kameru vede za letadlem; `shift` posune čas (reel začíná uprostřed fronty)
  const poseOf = (pl, now) => {
    const n = now + (pl.shift || 0);
    const P = planePos(n, { x0: openX0, x1: openX1, phase: pl.f * 41 });
    const fy = map.front[pl.f] * map.tile;
    const lane = Math.sin(n / 9000 + pl.f * 2) * 45; // dráha se zvolna vlní nad oblastí vlastní fronty
    const bob = Math.sin(n / 520 + pl.f) * 3 + Math.sin(n / 190 + pl.f * 2) * 1;
    return { x: Math.round(P.x), y: Math.round(fy + (pl.f === 0 ? -70 : 70) + lane + bob), dir: P.dir, bob };
  };
  return {
    planes,
    range: [openX0, openX1],
    poseOf: (f, now) => { const pl = planes.find((p) => p.f === f); return pl && poseOf(pl, now); },
    // reel: letadlo strany `f` bude v čase `tSec` (s) na x (jen nastaví posun času)
    placeAt(f, tSec, x) {
      const pl = planes.find((p) => p.f === f); if (!pl) return;
      const a = openX0 - 160, T = 2 * (openX1 + 160 - a) / PLANE_SPEED;
      pl.shift = ((((x - a) / PLANE_SPEED - tSec - f * 41) % T) + T) % T * 1000;
    },
    update(now, view, sfx) {
      if (!raised) { raised = true; world.setChildIndex(layer, world.children.length - 1); }
      smoke.clear();
      for (const pl of planes) {
        const P = poseOf(pl, now), bob = P.bob;
        pl.dir = P.dir; pl.x = P.x; pl.y = P.y;
        const y = pl.y;
        pl.body.position.set(pl.x, y);
        pl.body.scale.x = pl.dir;
        pl.shadow.position.set(pl.x + 12, y + 30 - bob * 0.4); pl.shadow.scale.x = pl.dir;
        sfx?.plane?.(pl.f, pl.x, y, pl.dir);
        const onScreen = !view || (pl.x > view.x0 - 120 && pl.x < view.x1 + 120 && y > view.y0 - 120 && y < view.y1 + 120);
        pl.body.visible = pl.shadow.visible = onScreen;
        if (!onScreen) { pl.puffs.length = 0; continue; }
        // vrtule: tři střídavé stavy rozmazaného kotouče
        const ph = Math.floor(now / 45) % 3;
        pl.prop.clear();
        pl.prop.rect(NOSE, -13, 2, 26).fill({ color: 0xc4b8a0, alpha: ph === 0 ? 0.55 : 0.28 });
        if (ph === 1) pl.prop.rect(NOSE + 1, -9, 1, 18).fill({ color: 0xe3d9c3, alpha: 0.5 });
        if (ph === 2) pl.prop.rect(NOSE - 1, -5, 2, 10).fill({ color: 0x0e0d0c, alpha: 0.35 });
        pl.prop.rect(NOSE - 2, -1, 3, 2).fill({ color: 0x3d3730 }); // náboj vrtule
        // kouř z motoru za letadlem
        if (Math.floor(now / 140) !== pl.lastPuff) { pl.lastPuff = Math.floor(now / 140); pl.puffs.push({ x: pl.x - pl.dir * 34, y: y + (Math.random() * 3 | 0) - 1, t: now }); if (pl.puffs.length > 18) pl.puffs.shift(); }
        for (const pf of pl.puffs) {
          const a = (now - pf.t) / 2200;
          if (a >= 1) continue;
          smoke.rect(Math.round(pf.x - pl.dir * a * 10), Math.round(pf.y - a * 6), 2 + Math.floor(a * 3), 2 + Math.floor(a * 3)).fill({ color: 0x8a9295, alpha: 0.5 * (1 - a) });
        }
      }
    },
  };
}
