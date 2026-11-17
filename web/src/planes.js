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


// obláček z protiletadlového děla: oranžový záblesk, pak tmavý chuchvalec z hranatých „kuliček“ (jádro nejtmavší, okraj světlejší), který nabobtná, stoupá a řídne
const hh = (i, k) => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };
function puff(g, x, y, age, seed) {
  if (age < 0 || age >= 1) return;
  if (age < 0.1) { const a = 1 - age / 0.1; g.rect(x - 6, y - 6, 13, 13).fill({ color: 0xd98f3f, alpha: 0.85 * a }); g.rect(x - 3, y - 3, 7, 7).fill({ color: 0xfff6dc, alpha: a }); }
  const grow = 1 - Math.pow(1 - Math.min(1, age * 1.8), 2), R = 5 + 15 * grow, fade = age < 0.55 ? 1 : 1 - (age - 0.55) / 0.45;
  for (let i = 0; i < 40; i++) { // kompaktní chuchvalec: kuličky rovnoměrně v kruhu, jádro tmavé, okraj světlejší (vnější se kreslí první)
    const f1 = hh(i, seed), f2 = hh(i + 50, seed), a = hh(i + 100, seed) * 6.2832, r = R * Math.sqrt(f1); // nezávislé náhodné hodnoty (žádná spirála)
    const bx = x + Math.cos(a) * r, by = y + Math.sin(a) * r * 0.85 - age * 16 * (0.4 + 0.6 * f2);
    const s = Math.max(3, Math.round((5 + f2 * 5) * (1 - age * 0.25)));
    const col = r < R * 0.42 ? 0x0e0d0c : r < R * 0.8 ? 0x1c1a17 : 0x3d3730;
    g.rect(Math.round(bx - s / 2), Math.round(by - s / 2), s, s).fill({ color: col, alpha: 0.96 * fade });
  }
}
// palba ze země po letadle (jen vizuál): každých ~3 s obláček před a nad strojem, mezitím krátké stopovky z nepřátelského zákopu
function groundFire(g, pl, now) {
  for (const j of [-1, 0]) { // dvě poslední dávky
    const k = Math.floor(now / 3100 + pl.f * 0.37) + j, born = (k - pl.f * 0.37) * 3100;
    const h1 = (Math.sin(k * 12.9898 + pl.f * 4.1) * 43758.5453) % 1, h2 = (Math.sin(k * 78.233 + pl.f * 1.3) * 12345.6789) % 1;
    puff(g, Math.round(pl.x + pl.dir * (46 + Math.abs(h1) * 70)), Math.round(pl.y + h2 * 46 - 4), (now - born) / 2800, Math.abs(h1) + 0.1);
  }
  const k2 = Math.floor(now / 900 + pl.f * 0.5), u = (now / 900 + pl.f * 0.5) % 1;
  if (u < 0.45) { // stopovka: krátká zlatá čárka od země k letadlu
    const h = Math.abs((Math.sin(k2 * 37.719 + pl.f) * 9301.7) % 1), gx = pl.x + (h - 0.5) * 150, gy = pl.y - pl.toEnemyDir * 60, kk = u / 0.45;
    const x1 = gx + (pl.x - gx) * kk, y1 = gy + (pl.y - gy) * kk, x2 = gx + (pl.x - gx) * (kk + 0.2), y2 = gy + (pl.y - gy) * (kk + 0.2);
    const n = 6; for (let s = 0; s < n; s++) g.rect(Math.round(x1 + (x2 - x1) * s / n), Math.round(y1 + (y2 - y1) * s / n), 1, 2).fill({ color: s > 3 ? 0xfff6dc : 0xd98f3f });
  }
}

export function initPlanes({ world, map, roster, openX0, openX1 }) {
  const sp = import.meta.env.DEV ? new URLSearchParams(location.search) : null;
  const q = sp ? (sp.get('planes') ?? (['pilot', 'front8'].includes(sp.get('reel')) ? '0:0,1:1' : null)) : null; // reel „pilot“ ukazuje obě letadla
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
  const flak = new Graphics(); // protiletadlové obláčky a stopovky ze země (nad letadlem)
  const shadowLayer = new Container(), bodyLayer = new Container();
  layer.addChild(shadowLayer, smoke, bodyLayer, flak);
  for (const pl of planes) {
    pl.shadow = new Sprite(); pl.shadow.anchor.set(0.5); pl.shadow.tint = 0x000000; pl.shadow.alpha = 0.26;
    pl.body = new Container();
    pl.spr = new Sprite(); pl.spr.anchor.set(0.5);
    pl.prop = new Graphics();
    pl.body.addChild(pl.spr, pl.prop);
    shadowLayer.addChild(pl.shadow); bodyLayer.addChild(pl.body);
    pl.body.visible = pl.shadow.visible = false;
    loadTexture(`/assets/props/plane_${NAMES[pl.f]}_${pl.variant}_pilot.png`).then((t) => { pl.spr.texture = t; pl.shadow.texture = t; }).catch(() => {});
  }
  let raised = false;
  // poloha letadla v čase `now` (ms): sdílí ji kreslení i reel, který kameru vede za letadlem; `shift` posune čas (reel začíná uprostřed fronty)
  const poseOf = (pl, now) => {
    const n = now + (pl.shift || 0);
    const P = planePos(n, { x0: openX0, x1: openX1, phase: pl.f * 41 });
    // průzkumný stroj létá nad NEPŘÁTELSKOU frontou (kam vidí a odkud po něm střílí), ne nad vlastním zákopem
    const toEnemy = map.front[pl.f] < map.front[1 - pl.f] ? 1 : -1;
    const fy = map.front[1 - pl.f] * map.tile + toEnemy * 30;
    const lane = Math.sin(n / 9000 + pl.f * 2) * 38; // dráha se zvolna vlní nad nepřátelskou linií
    const bob = Math.sin(n / 520 + pl.f) * 3 + Math.sin(n / 190 + pl.f * 2) * 1;
    return { x: Math.round(P.x), y: Math.round(fy + lane + bob), dir: P.dir, bob, toEnemy };
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
      smoke.clear(); flak.clear();
      for (const pl of planes) {
        const P = poseOf(pl, now), bob = P.bob;
        pl.dir = P.dir; pl.x = P.x; pl.y = P.y; pl.toEnemyDir = P.toEnemy; // nepřítel je tímto směrem po ose y
        const y = pl.y;
        pl.body.position.set(pl.x, y);
        pl.body.scale.x = pl.dir;
        pl.shadow.position.set(pl.x + 12, y + 30 - bob * 0.4); pl.shadow.scale.x = pl.dir;
        sfx?.plane?.(pl.f, pl.x, y, pl.dir);
        const onScreen = !view || (pl.x > view.x0 - 120 && pl.x < view.x1 + 120 && y > view.y0 - 120 && y < view.y1 + 120);
        pl.body.visible = pl.shadow.visible = onScreen;
        if (!onScreen) { pl.puffs.length = 0; continue; }
        groundFire(flak, pl, now);
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
