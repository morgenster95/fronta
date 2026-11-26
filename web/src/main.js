// Prohlížeč fronty: terén po blocích, tisíce vojáků, úrovně detailu, kamera a UI.
import { Application, Container, Graphics, Rectangle, Sprite, Texture, TextureSource, Ticker, TilingSprite } from 'pixi.js';
import { generateFront, openRange, DIRS, T, connectSite } from '../../engine/mapgen.js';
import { Camera } from './camera.js';
import { paintChunk, paintOverview, CHUNK } from './terrain.js';
import { winterAt, winterFall } from './winter.js';
import { initConvoy } from './convoy.js';
import { initUI } from './ui.js';
import { createLife } from './life.js';
import { createSound } from './sound.js';
import { startReel } from './reel.js';
import { buildHospitals, roofAlpha, hospitalSize } from './hospital.js';
import { hospitalNav } from './hospital-nav.js';
import { initOrderFx } from './orders-fx.js';
import { initTankFx } from './tank-fx.js';
import { initPlanes } from './planes.js';
import { initWire, placeVolunteers } from './wire.js';
import { initObservation } from './observation.js';
import { initGuns } from './guns.js';
import { initMines } from './mine.js';
import { getJson, loadTexture, loadImage, loadAtlas } from './assets.js';
import { setDayShift } from './day.js';

TextureSource.defaultOptions.scaleMode = 'nearest';

const SPRITE_ZOOM = 0.9; // pod tímhle zoomem jsou vojáci jen tečky
const DETAIL_ZOOM = 0.3; // pod tímhle se terén kreslí z přehledové textury
const MIRROR = { west: 'east', 'south-west': 'south-east', 'north-west': 'north-east' };

// Dýchání jako v ručně kresleném pixel artu: horní polovina těla klesne o 1 px, nohy zůstanou.
// Mění se jen pár desítek pixelů a barvy zůstávají přesně stejné (žádné blikání mezi snímky).
function breathFrame(tex) {
  const img = tex.source.resource;
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const src = ctx.getImageData(0, 0, c.width, c.height);
  const out = ctx.createImageData(c.width, c.height);
  out.data.set(src.data);
  let top = c.height, bottom = 0;
  for (let y = 0; y < c.height; y++)
    for (let x = 0; x < c.width; x++)
      if (src.data[(y * c.width + x) * 4 + 3] > 127) { top = Math.min(top, y); bottom = Math.max(bottom, y); }
  const waist = Math.round(top + (bottom - top) * 0.55);
  for (let y = waist; y > top; y--) out.data.copyWithin(y * c.width * 4, (y - 1) * c.width * 4, y * c.width * 4);
  out.data.fill(0, top * c.width * 4, (top + 1) * c.width * 4);
  ctx.putImageData(out, 0, 0);
  return Texture.from(c);
}

// ústí hlavně kulometu: nejvzdálenější neprůhledný pixel ve směru, kam míří; kotva = pata (spodní řádek)
function muzzleOf(img, dir) {
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, c.width, c.height);
  const sx = dir.endsWith('east') ? 1 : -1, sy = dir.startsWith('south') ? 1 : -1;
  let best = -Infinity, bx = 0, by = 0, minX = c.width, maxX = 0, maxY = 0;
  for (let y = 0; y < c.height; y++)
    for (let x = 0; x < c.width; x++) {
      if (data[(y * c.width + x) * 4 + 3] < 128) continue;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      const score = sx * x * 1.6 + sy * y; // hlaveň míří hlavně do strany
      if (score > best) { best = score; bx = x; by = y; }
    }
  const ax = (minX + maxX) / 2 / c.width, ay = (maxY + 1) / c.height;
  return { ax, ay, mx: bx - ax * c.width, my: by - ay * c.height };
}

// střed obrysu neprůhledných pixelů textury jako kotva (0..1); výsledek se pamatuje
const anchorCache = new Map();
function bodyAnchor(tx) {
  if (anchorCache.has(tx)) return anchorCache.get(tx);
  let out = { x: 0.5, y: 0.75 };
  try {
    const f = tx.frame, c = document.createElement('canvas');
    c.width = f.width; c.height = f.height;
    const g = c.getContext('2d');
    g.drawImage(tx.source.resource, f.x, f.y, f.width, f.height, 0, 0, f.width, f.height);
    const d = g.getImageData(0, 0, f.width, f.height).data;
    let x0 = f.width, x1 = -1, y0 = f.height, y1 = -1;
    for (let y = 0; y < f.height; y++) for (let x = 0; x < f.width; x++) if (d[(y * f.width + x) * 4 + 3] > 0) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    if (x1 >= 0) out = { x: (x0 + x1 + 1) / 2 / f.width, y: (y0 + y1 + 1) / 2 / f.height };
  } catch { /* bez přístupu k pixelům: výchozí kotva */ }
  anchorCache.set(tx, out);
  return out;
}

// Stará otevřená stránka (18. 11.: hráčka měla v telefonu kartu z noci wiring party, deník se dočítal čerstvý, ale stav vojáka ne):
// data fronty se mění jednou denně a stránka je jinak nikdy znovu nenačte. Když se uživatel ke kartě vrátí po víc než 30 min,
// stránka se načte znovu (jen při návratu, žádné dotazy na pozadí, ať nezatěžujeme limit přenosu Firebase).
if (!new URLSearchParams(location.search).get('reel')) {
  const loadedAt = Date.now();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && Date.now() - loadedAt > 30 * 60e3) location.reload();
  });
}

async function boot() {
  const [theme, roster, manifest] = await Promise.all([
    fetch('/data/theme.json').then((r) => r.json()),
    fetch('/data/roster.json').then((r) => r.json()),
    getJson('/assets/soldiers/manifest.json', { cache: 'no-cache' }),
  ]);
  setDayShift(theme); // zobrazené číslo dne (theme.dayShift, web/src/day.js)
  // Front News (zpětné zpravodajství, /?reel=news…): mapa bez pozdějších staveb a událostí (bunkry, letadla, pozorovatelna, nemocnice, ruiny)
  if (import.meta.env.DEV && /^news/.test(new URLSearchParams(location.search).get('reel') || '')) {
    roster.orders = []; roster.pilots = (roster.pilots || []).map(() => null); roster.observation = null; roster.barrage = null; roster.shells = null; roster.victories = []; roster.guns = [];
    for (const b of roster.battle || []) if (b) { b.built = {}; b.party = {}; }
  }
  const map = generateFront(theme.map);
  const worldW = map.W * map.tile, worldH = map.H * map.tile;
  // otevřené sektory; zbytek mapy je „neprozkoumaný“ (ztmavený) a kamera tam nepustí
  const [openFrom, openTo] = openRange(map, roster.openSectors ?? 8);
  const sectorPx = map.sectorW * map.tile;
  const openX0 = openFrom * sectorPx, openX1 = openTo * sectorPx;
  // bombardování: na straně poraženého přibývají krátery s každou nocí (pseudonáhoda podle kóty, takže je vidí všichni stejně)
  // krátery z dělostřelectva kóty: během bombardování přibývají každou nocí; po jeho konci (bez roster.barrage) se země pomalu „zahojí“:
  // první den po konci zůstane ~40 % kráterů, pak o 8 % méně za den, nejméně 15 % (pokyn uživatele 14. 11.: uber rozbombardované země)
  // reel o vítězství na Hill 304 se vyrábí předem: bombardování z Verdel Ridge v něm už neběží (po vítězství už skončilo)
  if (import.meta.env.DEV && new URLSearchParams(location.search).get('reel') === 'hill304' && roster.barrage) {
    const v = (roster.victories || []).find((x) => x.name === roster.barrage.name);
    if (v) v.barrageTo = roster.day;
    roster.barrage = null;
  }
  const lastShelled = roster.barrage
    ? { v: (roster.victories || []).find((x) => x.name === roster.barrage.name), target: roster.barrage.target, on: true }
    : (() => { const v = (roster.victories || []).find((x) => x.barrageTo != null && x.barrageTo <= roster.day); return v ? { v, target: 1 - v.faction, on: false } : null; })();
  if (lastShelled) {
    const v = lastShelled.v;
    const nights = Math.max(0, Math.min(3, roster.day - (v?.day ?? roster.day)));
    const tiles = (openX1 - openX0) / map.tile, tgt = lastShelled.target, dir = tgt === 0 ? -1 : 1;
    let seed = 2166136261;
    for (const ch of `${v?.id || 'x'}:${tgt}`) seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619) >>> 0;
    const rr = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    const total = Math.round(tiles * 3.2);
    const since = lastShelled.on ? 0 : Math.max(0, roster.day - (v?.barrageTo ?? roster.day)); // dny od posledního tahu s granáty
    const share = lastShelled.on ? 0.45 + 0.18 * nights : Math.max(0.15, 0.4 - 0.08 * since);
    const shown = Math.round(total * share); // první den hned hustě, pak přibývá; po konci ubývá
    for (let i = 0; i < total; i++) {
      const x = Math.floor(openX0 / map.tile + rr() * tiles), y = Math.round(map.front[tgt] + dir * (rr() * rr() * 34 - 14)), q = rr();
      if (i < shown) map.craters.push({ x, y, r: q < 0.3 ? 1 : q < 0.6 ? 2 : q < 0.82 ? 3 : 4 });
    }
  }

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

  // textury vojáků: klíč = "frakce" (střelec) nebo "frakce_archetyp"; chybějící archetyp → střelec
  const V = `?v=${manifest._v || '1'}`; // verze proti staré mezipaměti
  delete manifest._v;
  // sprity vojáků z atlasu (2 požadavky místo ~390); co v atlasu není, načte se samostatně
  const atlas = await loadAtlas('/assets/soldiers/');
  const soldierTex = async (file) => atlas.get(file) ?? loadTexture(`/assets/soldiers/${file}${V}`);
  const tex = {};
  const mirrored = {}; // směr chybí v manifestu → použije se zrcadlený protějšek
  const anims = {}; // anims[klíč][animace][směr] = [Texture]
  await Promise.all(
    Object.keys(manifest).flatMap((key) => {
      tex[key] = {};
      mirrored[key] = {};
      const jobs = DIRS.map(async (d) => {
        mirrored[key][d] = !manifest[key][d] && !!manifest[key][MIRROR[d]];
        const file = manifest[key][d] ?? manifest[key][MIRROR[d]] ?? manifest[key].south;
        tex[key][d] = await soldierTex(file);
      });
      for (const [anim, byDir] of Object.entries(manifest[key].anims || {})) {
        anims[key] ??= {};
        anims[key][anim] = {};
        for (const [d, files] of Object.entries(byDir)) {
          jobs.push(Promise.all(files.map((f) => soldierTex(f))).then((t) => (anims[key][anim][d] = t)));
        }
      }
      return jobs;
    }),
  );
  const loadImg = (path) => loadImage(path).catch(() => null);
  const winter = (() => { const q = new URLSearchParams(location.search).get('snow'); return q != null ? { snow: +q, on: +q > 0 } : winterAt(theme, roster.day); })(); // zima: pokrytí sněhem podle dne hry
  const propImages = Object.fromEntries(await Promise.all(['tree', 'grave', 'crater_s', 'crater_m', 'crater_water', 'crater_huge'].map(async (k) => [k, await loadImg(`/assets/props/${k}.png${V}`)])));
  const keyFor = (s) => {
    const k = `${theme.factions[s.faction].sprite}_${s.archetype?.id}`;
    return tex[k] ? k : theme.factions[s.faction].sprite;
  };

  const world = new Container();
  app.stage.addChild(world);
  const overview = new Sprite(Texture.from(paintOverview(map, winter.snow)));
  overview.scale.set(map.tile);
  world.addChild(overview);
  const terrainLayer = new Container();
  world.addChild(terrainLayer);
  const gunLayer = new Container(); // kulomety ZA vojáky (Concord míří na sever, zbraň je dál od kamery)
  world.addChild(gunLayer);
  const soldierLayer = new Container();
  world.addChild(soldierLayer);
  const actorLayer = new Container(); // chodící postavy (zdravotníci) – v zákopu, pod jeho okrajem
  world.addChild(actorLayer);
  const overLayer = new Container(); // bližší okraje zákopů a pytle před vojáky
  world.addChild(overLayer);
  const dots = new Graphics();
  world.addChild(dots);
  const marker = new Graphics();
  world.addChild(marker);
  // hvězdy Officers' Mess (Patreon 10 USD): zlatá hvězda nad vojákem, stejně velká na obrazovce při každém přiblížení (i v přehledu s tečkami)
  const starLayer = new Graphics();
  world.addChild(starLayer);
  const devStar = import.meta.env.DEV ? Number(new URLSearchParams(location.search).get('stars')) || 0 : 0; // náhled: /?stars=20
  // neprozkoumané sektory po stranách: tma a mlha
  const uncharted = new Graphics();
  uncharted.rect(openX0 - sectorPx * 2, 0, sectorPx * 2, worldH).fill({ color: 0x0e0d0c, alpha: 0.75 });
  uncharted.rect(openX1, 0, sectorPx * 2, worldH).fill({ color: 0x0e0d0c, alpha: 0.75 });
  world.addChild(uncharted);

  // --- vojáci ---
  const F = Object.fromEntries(roster.fields.map((f, i) => [f, i]));
  const soldiers = roster.soldiers.map((row, i) => {
    // pozice je uložená u vojáka (trvalá), mapa ji jen vykresluje
    const slot = row[F.x] >= 0 ? { x: row[F.x], y: row[F.y], d: row[F.dir], line: row[F.line] } : null;
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
      dog: F.dog != null ? row[F.dog] || null : null, // plemeno psa (Trench Dog)
      medals: row[F.medals] ? row[F.medals].split(',') : [],
      slot,
      x: slot ? slot.x : null,
      y: slot ? slot.y : null,
    };
  });
  // Neobsazená stanoviště: dokud je narukovaných málo, drží linii bezejmenní vojáci. Karta každého z nich zve k naverbování
  // a místo připadne prvnímu, kdo napíše frakci do komentáře (pořadí plnění je stejné jako u skutečných vojáků).
  const vacantTarget = Number(new URLSearchParams(location.search).get('vacant')) || theme.vacantPosts || 0;
  for (let f = 0; f < theme.factions.length; f++) {
    const real = soldiers.filter((s) => s.faction === f && s.slot);
    const taken = new Set(real.map((s) => `${s.x},${s.y}`));
    let need = Math.max(0, vacantTarget - real.length);
    for (const sl of map.slots[f]) {
      if (need <= 0) break;
      if (taken.has(`${sl.x},${sl.y}`)) continue;
      need--;
      const r = (sl.x * 31 + sl.y * 17) % 100;
      soldiers.push({
        i: soldiers.length,
        vacant: true,
        handle: null,
        faction: f,
        archetype: theme.archetypes[r < 70 ? 0 : r < 80 ? 1 : r < 88 ? 2 : r < 94 ? 3 : 4],
        rank: 0,
        status: 0,
        variant: r % 4,
        claimed: false,
        generation: 1,
        name: 'Unclaimed post',
        slot: { x: sl.x, y: sl.y, d: sl.d, line: sl.line, label: sl.label },
        x: sl.x,
        y: sl.y,
      });
    }
  }
  // --- nemocnice za podpůrnou linií každé strany; těžce ranění v nich leží na lůžkách (jejich místo v zákopu je prázdné) ---
  const hospitals = (() => {
    const pub = roster.battle;
    if (!pub) return null;
    const ext = (f, line) => {
      const ys = map.slots[f].filter((sl) => sl.line === line).map((sl) => sl.y);
      return ys.length ? [Math.min(...ys), Math.max(...ys)] : null;
    };
    const sites = [];
    theme.factions.forEach((_, f) => {
      const cx = (openX0 + openX1) / 2; // střed otevřené fronty: stálé místo (nemění se s vojáky), jen když se otevřou nové sektory
      const sup = ext(f, 'support'), res = ext(f, 'reserve');
      // náhled postavené nemocnice na vývojovém serveru: /?hospital=dugout
      const built = !!pub[f]?.hospital?.dugout || new URLSearchParams(import.meta.env.DEV ? location.search : '').get('hospital') === 'big' || (import.meta.env.DEV && new URLSearchParams(location.search).get('hospital') === 'dugout');
      const devBig = import.meta.env.DEV && new URLSearchParams(location.search).get('hospital') === 'big';
      const big = !!pub[f]?.hospital?.big || devBig; // polní nemocnice je NAVÍC k obvazišti a zemnicím
      const HH = hospitalSize(4).H;
      // obvaziště (stan) mezi podpůrnou linií a zálohami; postavená nemocnice je hluboký dugout dál v týlu, za zálohami
      // (mimo dosah kulek, ranění se k ní nosí spojovacím zákopem), když se tam vejde; jinak na místě obvaziště
      let y = sup && res ? (f === 0 ? (res[1] + sup[0]) / 2 : (sup[1] + res[0]) / 2) : map.front[f] * map.tile + (f === 0 ? -200 : 200);
      if (built && res) {
        const back = f === 0 ? res[0] - 70 - HH / 2 : res[1] + 70 + HH / 2;
        if (back - HH / 2 > 24 && back + HH / 2 < map.H * map.tile - 24) y = back;
      }
      const n = Math.max(1, pub[f]?.hospital?.dugouts || 0);
      const kinds = [...(big ? [10] : []), ...Array.from({ length: n }, () => (built ? 4 : 2))]; // velká napřed (první lůžka)
      // volné místo bez zákopů (nemocnice nesmí stát na spojovacím zákopu), co nejblíž středu vojáků
      const T2 = map.tile, taken = [];
      let HW = 100;
      const free = (x, y0) => {
        for (const t of taken) if (Math.abs(t.x - x) < (t.w + HW) / 2 + 24) return false;
        for (let ty = Math.floor((y0 - HH / 2 - 12) / T2); ty <= Math.floor((y0 + HH / 2 + 12) / T2); ty++)
          for (let tx = Math.floor((x - HW / 2 - 8) / T2); tx <= Math.floor((x + HW / 2 + 8) / T2); tx++) {
            const g = map.grid[ty * map.W + tx];
            if (g === T.TRENCH || g === T.PARAPET || g === T.DUGOUT || g === T.WATER) return false;
          }
        return true;
      };
      for (const kb of kinds) {
        HW = hospitalSize(kb).W;
        let x = cx;
        for (let k = 0; k < 120; k++) {
          const cand = cx + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 16;
          if (free(cand, y)) { x = cand; break; }
        }
        taken.push({ x, w: HW });
        sites.push({ faction: f, x, y, beds: kb, entrance: f === 0 ? 1 : -1 });
      }
    });
    const H = buildHospitals(sites);
    // ke každé nemocnici vede spojovací zákop od vchodu k nejbližšímu zákopu (skutečné dlaždice: později se po něm bude chodit)
    for (const site of H.sites) connectSite(map, site.faction, site.x, site.y + site.entrance * (hospitalSize(site.beds.length).H / 2), site.entrance);
    overview.texture = Texture.from(paintOverview(map, winter.snow));
    world.addChildAt(H.base, world.getChildIndex(terrainLayer) + 1);
    world.addChildAt(H.roofs, world.getChildIndex(overLayer) + 1);
    // lůžka a nosítka podle dat z denního tahu (battlePublic)
    const byHandle = new Map(soldiers.map((s) => [s.handle, s]));
    theme.factions.forEach((_, f) => {
      const mine = H.sites.filter((x) => x.faction === f);
      const beds = mine.flatMap((x) => x.beds.map((b) => ({ ...b, right: b.x > x.x })));
      (pub[f]?.beds || []).forEach((b, i) => {
        const s = byHandle.get(b.handle);
        if (s && beds[i]) Object.assign(s, { x: beds[i].x, y: beds[i].y, hosp: 'bed', bedRight: beds[i].right, sev: b.sev });
      });
      const st = mine[0]?.stretchers || [];
      (pub[f]?.stretchers || []).forEach((b, i) => {
        const s = byHandle.get(b.handle);
        const p = st[i % st.length];
        if (!s || !p) return;
        Object.assign(s, { x: p.x, y: p.y + Math.floor(i / st.length) * 20 * (f === 0 ? 1 : -1), hosp: 'stretcher', sev: b.sev }); // řady nosítek před vchodem
        // nosítka pod raněným: dvě tyče a plachtovina
        const g = new Graphics();
        g.rect(Math.round(s.x - 16), Math.round(s.y - 4), 32, 1).fill(0x3d3730);
        g.rect(Math.round(s.x - 16), Math.round(s.y + 4), 32, 1).fill(0x3d3730);
        g.rect(Math.round(s.x - 13), Math.round(s.y - 3), 26, 7).fill(0xa39782);
        g.rect(Math.round(s.x - 13), Math.round(s.y + 3), 26, 1).fill(0x857a68);
        H.base.addChild(g);
      });
    });
    return H;
  })();

  // viditelné účinky rozkazů z hlasování (kryty proti bombardování, lékař u obvaziště)
  const orderFx = initOrderFx({ world, anchor: terrainLayer, roster, map, tex, anims, hospitals, theme, openX0, openX1 });
  // tank z hlasování TANK: jezdí vpřed, pálí, couvá (web/src/tank-fx.js; dev náhled /?orders=0:TANK)
  const tankFx = initTankFx({ world, roster, map, theme, openX0, openX1 });
  // letadla pilotů nad frontou (web/src/planes.js; dev náhled /?planes=0,1)
  const planeFx = initPlanes({ world, map, roster, openX0, openX1 });
  // NÁVRH úkrytů (jen dev náhled /?shelters=1, web/src/shelters.js)
  let shelterFx = null;
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('shelters')) import('./shelters.js').then((m) => { shelterFx = m.initShelters({ world, anchor: terrainLayer, map, soldiers, theme, openX0, openX1, openCard: (s) => ui.openSoldier(s), hospitals }); window.__shelters = shelterFx; });
  // drát podle stavu úseků a wiring party (web/src/wire.js); když se rekvizity načtou, terén už drát nekreslí čarami
  // wiring party: přihlášení dobrovolníci jdou ze zákopu k drátu svého úseku (před vytvořením spritů, ať je karta i výběr najdou tam)
  // reel o noci wiring party (/?reel=nightN): skuteční dobrovolníci té noci z marketing/reels/nightN.volunteers.json (po tahu už ve stavu nejsou)
  if (import.meta.env.DEV) {
    const rn = new URLSearchParams(location.search).get('reel');
    const vf = import.meta.glob('../../marketing/reels/night*.volunteers.json', { eager: true, import: 'default' })[`../../marketing/reels/${rn}.volunteers.json`];
    if (vf && roster.battle) vf.party.forEach((hs, f) => { if (roster.battle[f]) roster.battle[f].party = { all: hs }; });
  }
  const volunteers = placeVolunteers({ soldiers, roster, map, theme, openX0, openX1 });
  const wireFx = await initWire({ world, anchor: terrainLayer, roster, map, anims, theme, openX0, openX1, V, volunteers });
  if (wireFx) propImages.noWire = true;
  propImages.snow = winter.snow;
  const obsFx = await initObservation({ world, anchor: terrainLayer, over: overLayer, roster, map, theme, tex, openX0, openX1, V }); // pozorovatelna na kótě (odměna)
  if (import.meta.env.DEV && new URLSearchParams(location.search).get('reel') === 'front11') roster.guns = [{ id: 'teaser', faction: 0, cond: 1, destroyed: false, last: null }]; // Day reel 11: ukázka odměny za Grey Mill
  const mineFx = await initMines({ world, anchor: terrainLayer, roster, map, theme, tex, openX0, openX1, V }); // mina z kóty (odměna Bone Quarry, web/src/mine.js)
  const convoy = await initConvoy({ world, anchor: terrainLayer, map, openX0, openX1, V }); // zásobovací auta a povozy za zálohami (web/src/convoy.js)
  const gunFx = await initGuns({ world, anchor: terrainLayer, roster, map, theme, tex, life: { debug: { shell: (...a) => life.debug.shell(...a) } }, openX0, openX1, V }); // těžké dělo (odměna Grey Mill, web/src/guns.js)

  const placed = soldiers.filter((s) => s.slot && s.status !== 4 && s.status !== 2 && s.status !== 3);
  const TINT = [0xffffff, 0xf0ece4, 0xe6e2da, 0xfff4e8];
  const chunkSoldiers = new Map(); // chunk key → Container
  const ckey = (x, y) => `${Math.floor(x / (CHUNK * map.tile))},${Math.floor(y / (CHUNK * map.tile))}`;
  for (const s of placed.sort((a, b) => a.y - b.y)) {
    const d = DIRS[s.slot.d];
    s.texKey = keyFor(s);
    s.tex = tex[s.texKey];
    const sp = new Sprite(s.tex[d]);
    sp.anchor.set(0.5, 30 / 32);
    if (mirrored[s.texKey][d]) sp.scale.x = -1;
    sp.x = s.x;
    sp.y = s.y;
    sp.tint = TINT[s.variant % TINT.length];
    // neobsazené stanoviště: šedé a poloprůhledné, aby bylo jasné, kdo je skutečný hráč
    // Ve videích (?reel=) žádní „duchové“: neobsazená stanoviště mají plnou barvu a krytí jako skuteční vojáci (pravidlo v CLAUDE.md).
    if (s.vacant && !new URLSearchParams(location.search).has('reel')) {
      sp.tint = 0x8f8a82;
      sp.alpha = 0.55;
    }
    // raněný leží (poslední snímek pádu střelce frakce), dokud ho nedá dohromady denní tah
    if (s.status === 1) {
      const fall = anims[theme.factions[s.faction].sprite]?.fall?.south;
      if (fall) {
        s.wounded = true;
        sp.texture = fall[fall.length - 1];
        sp.scale.x = 1;
        if (s.hosp) {
          // leží na lůžku / nosítkách: animace „raněný leží“ (vodorovně, hlavou vlevo), střed těla přesně na středu lůžka;
          // na pravých lůžkách hlavou k polštáři vpravo
          const lie = anims[theme.factions[s.faction].sprite]?.['lying-wounded']?.east;
          if (lie?.length) sp.texture = lie[0];
          const a = bodyAnchor(sp.texture);
          sp.anchor.set(a.x, a.y);
          if (s.bedRight) sp.scale.x = -1;
        }
      } else sp.tint = 0xd8b8a8;
    }
    sp.soldier = s;
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
  // Trench Dog: pes sedí vedle svého vojáka (vždy sedí, sjednocené sprity se spodkem na stejné čáře); sprity props/dog_<plemeno>_<sit|lie>.png, náhled /?dogs=30 (jen dev)
  {
    const devDogs = import.meta.env.DEV ? Number(new URLSearchParams(location.search).get('dogs')) || 0 : 0;
    const breeds = (theme.dog?.breeds || []).map((b) => b.id).concat(theme.dog ? [] : ['airedale', 'shepherd', 'jackrussell', 'collie', 'dachshund']);
    const withDog = placed.filter((q, i) => !q.vacant && (q.dog || (devDogs && breeds.length && i % Math.max(1, Math.floor(placed.length / devDogs)) === 0)));
    const dogTex = {};
    await Promise.all(withDog.map((q) => `${q.dog || breeds[q.i % breeds.length]}_sit`).filter((k, i, a) => a.indexOf(k) === i)
      .map((k) => loadTexture(`/assets/props/dog_${k}.png${V}`).then((t) => { dogTex[k] = t; }).catch(() => {})));
    for (const q of withDog) {
      const t = dogTex[`${q.dog || breeds[q.i % breeds.length]}_sit`]; // vždy stejná poloha (sedí), ať jsou psi na mapě jednotní (uživatel 21. 11.)
      if (!t || !q.sprite) continue;
      const dsp = new Sprite(t);
      dsp.anchor.set(0.5, 1);
      const left = q.sprite.scale.x < 0; // pes sedí na straně, kam se voják dívá, otočený stejně
      dsp.scale.x = left ? -1 : 1;
      dsp.x = q.x + (left ? -11 : 11); dsp.y = q.y + 1; // vedle vojáka na stejné čáře nohou (níž by ho zakryl val z pytlů)
      q.dogSprite = dsp;
      q.sprite.parent.addChild(dsp); // navrch bloku: pes je vidět i v hustě obsazeném zákopu
    }
  }
  const starMedal = theme.support?.star?.medal;
  const starred = soldiers.filter((q, i) => q.slot && !q.vacant && ((starMedal && q.medals?.includes(starMedal)) || (devStar && i % Math.max(1, Math.floor(soldiers.length / devStar)) === 0)));
  // efekty z PixelLab VFX workbench: spritesheet (TexturePacker JSON) → snímky v pořadí + kotva + fps
  const fxSheets = {};
  await Promise.all(['shell-blast', 'shell-small', 'smoke-small'].map(async (name) => {
    try {
      const meta = await getJson(`/assets/fx/${name}.json`, { cache: 'no-cache' });
      const base = await loadTexture(`/assets/fx/${name}.png${V}`);
      fxSheets[name] = {
        frames: meta.frames.map(({ frame: f }) => new Texture({ source: base.source, frame: new Rectangle(f.x, f.y, f.w, f.h) })),
        pivot: meta.frames[0].pivot,
        fps: 1000 / (meta.frames[0].duration || 100),
      };
    } catch (e) {
      console.warn('fx', name, e);
    }
  }));
  // snímky zamíření (přesná střelba): props/aim_<klíč>_<směr>.png + ústí hlavně z jejich JSON
  const aims = {};
  try {
    const meta = await getJson(`/assets/soldiers/aims.json${V}`, { cache: 'no-cache' });
    await Promise.all(Object.entries(meta).map(async ([key, byDir]) => {
      aims[key] = {};
      for (const [d, m] of Object.entries(byDir)) aims[key][d] = { tex: await soldierTex(m.file), mx: m.mx, my: m.my };
    }));
  } catch (e) {
    console.warn('aims', e);
  }
  // dýchání pro všechny typy a směry (z rotací, ne ze šumících snímků PixelLabu)
  const breath = {};
  for (const [key, byDir] of Object.entries(tex)) {
    breath[key] = {};
    for (const [d, t] of Object.entries(byDir)) breath[key][d] = breathFrame(t);
  }
  // výška spodní lišty (na úzkém telefonu se zalomí): zoom a zvuk stojí vždy nad ní (style.css --bar-h)
  const bar = document.getElementById('bar');
  if (bar) { const setBarH = () => document.documentElement.style.setProperty('--bar-h', `${bar.offsetHeight}px`); setBarH(); new ResizeObserver(setBarH).observe(bar); }
  // zvuky (ne při nahrávání reelů – ty mají vlastní zvukovou stopu)
  const recording = import.meta.env.DEV && new URLSearchParams(location.search).has('reel');
  const sfx = recording ? null : createSound();
  if (sfx) {
    sfx.setWeather(new URLSearchParams(location.search).get('wx') || (winter.on ? winterFall(roster.weather) || 'clear' : roster.weather)); // v zimě vítr místo deště
    if (gunFx) gunFx.sfx = sfx;
    convoy.sfx = sfx;
    tankFx.sfx = sfx;
    const btn = document.getElementById('sound');
    const paint = () => {
      btn.textContent = sfx.on ? '🔊' : '🔇';
      btn.setAttribute('aria-label', sfx.on ? 'Sound off' : 'Sound on');
      btn.classList.toggle('on', sfx.on);
    };
    btn.hidden = false;
    btn.onclick = () => { sfx.toggle(); paint(); };
    // zapamatované „zapnuto“: prohlížeč pustí zvuk až po prvním dotyku stránky
    if (sfx.wanted) {
      const resume = () => { if (!sfx.on) { sfx.setOn(true); paint(); } };
      addEventListener('pointerdown', resume, { once: true, capture: true });
    } else {
      // jemné upozornění, že web má zvuk
      setTimeout(() => btn.classList.add('hint'), 4000);
      setTimeout(() => btn.classList.remove('hint'), 9000);
    }
    paint();
  }
  const life = createLife({ world, actorLayer, theme, anims, tex, map, dirs: DIRS, fx: fxSheets, aims, breath, sfx, winter: winter.on });
  tankFx.life = life;
  for (const s of placed) life.setupSprite(s, s.sprite);

  // kulometná hnízda: kulometčík v přední linii se přikrčí za kulomet na trojnožce (objekt z PixelLabu, šikmo k nepříteli)
  const gunTex = {};
  const gunMeta = {};
  await Promise.all(['south-east', 'south-west', 'north-east', 'north-west'].map(async (d) => {
    try {
      const t = await loadTexture(`/assets/props/mg_${d}.png${V}`);
      gunTex[d] = t;
      gunMeta[d] = muzzleOf(t.source.resource, d);
    } catch {
      // bez obrázku kulometu hnízda nevzniknou
    }
  }));
  const nests = [];
  if (false && gunTex['south-east'] && gunTex['north-west']) { // hnízda vypnutá, viz life.js
    for (const s of placed) {
      if (s.archetype?.id !== 'machinegunner' || s.slot.line !== 'front' || s.wounded) continue;
      if (s.slot.d !== 0 && s.slot.d !== 4) continue;
      const south = s.slot.d === 0;
      const right = Math.random() < 0.5;
      const d = `${south ? 'south' : 'north'}-${right ? 'east' : 'west'}`;
      const meta = gunMeta[d];
      const gun = new Sprite(gunTex[d]);
      gun.anchor.set(meta.ax, meta.ay);
      // kulometčík klečí u rukojetí (zadní konec), hlaveň míří šikmo k nepříteli
      gun.x = s.x + (right ? 12 : -12);
      gun.y = s.y + (south ? 4 : -3);
      (south ? actorLayer : gunLayer).addChild(gun);
      const crouch = anims[s.texKey]?.crouch?.[south ? 'south' : 'north'];
      if (crouch) s.sprite.texture = crouch[crouch.length - 1];
      s.nest = true;
      nests.push({ gun, gunner: s, gx: gun.x, mx: gun.x + meta.mx, my: gun.y + meta.my, dx: right ? 1 : -1, dy: south ? 1 : -1 });
    }
  }
  life.setNests(nests);
  life.setShooters(placed.filter((s) => !s.vacant)); // vzdálené výstřely jen od skutečných vojáků
  // bombardování: výsledek včerejšího hlasování, nebo náhled přes ?fx=barrage
  const fxParam = new URLSearchParams(location.search).get('fx');
  const disp = roster.dispatch;
  if (roster.barrage) life.setBarrage({ faction: roster.barrage.target }); // dělostřelectvo z dobyté kóty
  else if (fxParam === 'barrage' || (disp?.effect === 'barrage' && disp.day >= roster.day - 1)) {
    life.setBarrage({ faction: disp?.target ?? 0 });
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
      const { base, over } = paintChunk(map, cx, cy, propImages);
      const sp = new Sprite(Texture.from(base));
      const ov = new Sprite(Texture.from(over));
      sp.x = ov.x = cx * CHUNK * map.tile;
      sp.y = ov.y = cy * CHUNK * map.tile;
      entry.sprite = sp;
      entry.over = ov;
      entry.queued = false;
      terrainLayer.addChild(sp);
      overLayer.addChild(ov);
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
  // počasí dne z denního tahu (bez údaje = déšť jako dřív)
  // zima (web/src/winter.js): místo deště sněží, bouře = vánice
  const wxQ = new URLSearchParams(location.search).get('wx');
  const wx = wxQ || (winter.on ? winterFall(roster.weather) || 'clear' : roster.weather);
  const raining = !wx || wx === 'rain' || wx === 'storm';
  const snowing = wx === 'snow' || wx === 'blizzard';
  const tint = { fog: [0xa39782, 0.13], frost: [0xc4d6e4, 0.07], clear: [0xffe6b0, 0.03], snow: [0xd6e2ec, 0.04], blizzard: [0xdfe8ef, 0.14] }[wx];
  const flakes = Array.from({ length: wx === 'blizzard' ? 380 : 130 }, () => ({ x: Math.random(), y: Math.random(), v: 0.4 + Math.random() * 0.8, p: Math.random() * 6.28, s: Math.random() < 0.2 ? 3 : 2 }));
  fog.alpha = wx === 'clear' || wx === 'frost' ? 0.5 : 1;
  const drops = Array.from({ length: wx === 'storm' ? 260 : 160 }, () => ({ x: Math.random(), y: Math.random(), v: 0.6 + Math.random() * 0.6 }));
  let flashT = 0, nextFlash = 3000;

  // --- kamera ---
  const openW = openX1 - openX0;
  const minZoom = Math.min(app.screen.width / openW, app.screen.height / worldH);
  const cam = new Camera(app.canvas, {
    minZoom: Math.max(minZoom, 0.05),
    maxZoom: 6,
    bounds: { x0: openX0 - sectorPx * 0.25, y0: 0, w: openW + sectorPx * 0.5, h: worldH },
    onTap: (p) => {
      const s = pickAt(p.x, p.y);
      if (s) ui.openSoldier(s);
      else ui.closeAll();
    },
  });

  // o kolik posunout kameru, aby byl voják vidět nad kartou (na telefonu karta zabírá víc než půlku)
  const cardOffset = () => cam.h * (cam.w < 600 ? 0.3 : 0.22);
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
        cam.flyTo(s.x, s.y - 16 + cardOffset() / z, z);
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
    cam.set(start.x, start.y - 16 + cardOffset() / Math.max(initZoom, 3), Math.max(initZoom, 3));
    select(start);
    setTimeout(() => ui.openSoldier(start, false), 400);
  } else {
    const fi = Math.random() < 0.5 ? 0 : 1;
    // prvních ~60 narukovaných stojí v přední linii uprostřed; prázdná soupiska → střed mapy
    const pool = soldiers.filter((s) => s.slot && s.faction === fi).slice(0, 60);
    const first = pool[Math.floor(Math.random() * pool.length)] ?? map.slots[fi][0];
    // pohled tak, aby byla vidět přední linie i kus země nikoho
    // na širokém displeji je vidět i země nikoho, na telefonu (na výšku) víc zákopů za linií
    const toNml = fi === 0 ? 1 : -1;
    cam.set(first.x, first.y + toNml * (cam.w < 600 ? -70 : 60), initZoom);
  }

  // odznak nemocnice na oddálené mapě a směrovka k ní v detailu (při natáčení reelů skryté)
  const reelParam = import.meta.env.DEV ? new URLSearchParams(location.search).get('reel') : null;
  // v reelech jen odznaky; směrovku ukazuje reel s novinkami (news)
  const hospNav = hospitalNav({ world, cam, sites: hospitals?.sites, theme, soldiers, hidden: !!reelParam && reelParam !== 'news' });

  // --- smyčka ---
  if (import.meta.env.DEV) window.__front = { tankFx, convoy, planeFx, obsFx, gunFx, mineFx, life, cam, soldiers, tex, anims, hospitals, orderFx, open: (s) => ui.openSoldier(s) }; // ladění v konzoli
  const visibleSoldiers = [];
  // ?slow=N zpomalí animace a efekty N× (jen pro kontrolu výstřelů na snímcích obrazovky)
  const slow = Math.max(1, Number(new URLSearchParams(location.search).get('slow')) || 1);
  const t0 = performance.now();
  const reelName = import.meta.env.DEV ? new URLSearchParams(location.search).get('reel') : null;
  let reelTime = null; // ms, řízené nahrávacím skriptem
  app.ticker.add(() => {
    const now = reelTime ?? t0 + (performance.now() - t0) / slow;
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
    overLayer.visible = detail;
    if (hospitals) {
      const a = roofAlpha(z);
      for (const r of hospitals.roofs.children) r.alpha = a;
    }
    hospNav.update(now);
    for (const [k, e] of chunks) if (e.sprite) e.sprite.visible = e.over.visible = visible.has(k);

    const showSprites = z >= SPRITE_ZOOM;
    visibleSoldiers.length = 0;
    dots.visible = !showSprites;
    if (!showSprites) drawDots(z);
    for (const [k, c] of chunkSoldiers) {
      c.visible = showSprites && visible.has(k);
      if (!c.visible) continue;
      // jemné „dýchání“: posun o 1 px
      for (const sp of c.children) {
        sp.animate?.(now);
        if (sp.soldier) visibleSoldiers.push(sp.soldier); // psi (Trench Dog) sedí ve stejném bloku, ale nejsou vojáci
      }
    }

    // simulovaný život (výstřely, granáty, světlice, zdravotníci) + otřes kamery při blízkém dopadu
    orderFx.update(now, view);
    tankFx.update(now, view);
    planeFx.update(now, view, sfx);
    gunFx?.update(now, app.ticker.deltaMS, view);
    convoy.update(now, app.ticker.deltaMS, view);
    if (sfx) {
      sfx.tickLoops();
      // hlahol vojáků: jen při přiblížení, střed viditelných vojáků, hlasitost podle počtu
      if (showSprites && visibleSoldiers.length > 2) {
        let sx = 0, sy = 0; for (const q of visibleSoldiers) { sx += q.x; sy += q.y; }
        sfx.murmur(sx / visibleSoldiers.length, sy / visibleSoldiers.length, visibleSoldiers.length);
      }
    }
    mineFx?.update(now, app.ticker.deltaMS);
    wireFx?.update(now);
    const sh = life.update(now, reelTime != null ? app.ticker.deltaMS : app.ticker.deltaMS / slow, view, visibleSoldiers, showSprites);
    if (sh) world.position.set(world.position.x + Math.round(sh.x), world.position.y + Math.round(sh.y));

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

    starLayer.clear();
    if (starred.length) {
      const k = 1 / z, r = 7 * k;
      for (const q of starred) {
        if (q.status === 2 || q.x < view.x0 - 20 || q.x > view.x1 + 20 || q.y < view.y0 - 60 || q.y > view.y1 + 20) continue;
        const bob = Math.sin(now / 400 + q.x) * 1.5 * k;
        const cx = q.x, cy = q.y - (showSprites ? 34 : 4) - 10 * k + bob;
        const pts = [];
        for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; pts.push(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
        starLayer.poly(pts.map((v) => v + k)).fill({ color: 0x0e0d0c });
        starLayer.poly(pts).fill({ color: 0xe8b84a });
      }
    }

    // déšť
    const W = app.screen.width, H = app.screen.height;
    fog.width = W;
    fog.height = H;
    fog.tilePosition.x = -cam.x * z * 0.3 + now * 0.004;
    fog.tilePosition.y = -cam.y * z * 0.3;
    rain.clear();
    if (tint) rain.rect(0, 0, W, H).fill({ color: tint[0], alpha: tint[1] });
    if (raining) for (const d of drops) {
      d.y += 0.012 * d.v;
      d.x -= 0.002 * d.v;
      if (d.y > 1) { d.y = 0; d.x = Math.random() * 1.1; }
      rain.moveTo(d.x * W, d.y * H).lineTo(d.x * W - 3, d.y * H + 12 * d.v);
    }
    if (raining) rain.stroke({ color: 0xa39782, alpha: 0.25, width: 1 });
    if (snowing) for (const f of flakes) {
      const bl = wx === 'blizzard';
      f.y += (bl ? 0.006 : 0.0022) * f.v;
      f.x += (bl ? -0.004 : Math.sin(now * 0.001 + f.p) * 0.0006) * f.v;
      if (f.y > 1) { f.y = 0; f.x = Math.random() * 1.1; }
      if (f.x < -0.05) f.x = 1.05;
      rain.rect(Math.round(f.x * W), Math.round(f.y * H), f.s, f.s).fill({ color: 0xf4f7f8, alpha: (bl ? 0.45 : 0.28) + 0.22 * f.v / 1.2 }); // jemně a průhledně, ať neruší (22. 11.)
    }
    // vzdálené záblesky
    flash.clear();
    nextFlash -= app.ticker.deltaMS;
    if (nextFlash < 0) { flashT = 1; nextFlash = wx === 'storm' ? 900 + Math.random() * 3000 : 2500 + Math.random() * 7000; }
    if (flashT > 0) {
      flash.rect(0, 0, W, H).fill({ color: 0xd98f3f, alpha: 0.07 * flashT });
      flashT -= app.ticker.deltaMS / 400;
    }
  });

  document.getElementById('loading').classList.add('done');

  // režim natáčení: zastavit oba tickery a krokovat čas po snímcích (efekty AnimatedSprite běží na Ticker.shared)
  if (reelName) {
    app.ticker.stop();
    Ticker.shared.stop();
    startReel({
      name: reelName, app, cam, life, map, theme, soldiers, ui, tex, anims, select, hospitals,
      tick: (ms) => {
        reelTime = ms;
        app.ticker.update(ms);
        Ticker.shared.update(ms);
        window.__reelPost?.(ms / 1000); // reel může po aktualizaci světa ještě něco skrýt (např. kdo zakrývá představovaného vojáka)
        app.render();
      },
    });
  }
}

boot().catch((e) => {
  console.error(e);
  document.getElementById('loading').textContent = 'The line has been cut. Reload.';
});
