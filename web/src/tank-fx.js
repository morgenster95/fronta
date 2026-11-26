// Tank na mapě (hlasování HOSPITAL / TANK, 26. 11. 2026; stav z roster.orders: { faction, kw: 'TANK', tankX? }).
// Tank stojí v nejhustším úseku vlastní první linie (engine vybírá `tankX`, battle.js, jako mina) a jezdí v cyklu, který vidí všichni stejně (z času):
//   A (u zákopu) → jede VPŘED do země nikoho (B) → pálí → COUVÁ (C, kousek zpět) → pálí → couvá zpět k zákopu (A) → pálí → znovu dokola.
// Tank se nikdy neotáčí: vždy míří k nepříteli (Hegemonie čelním pohledem, Concord zadním, jako bunkry), couvání je couvání.
// Střelba: hlaveň zášlehem, zpětný ráz, kouř, dopad granátu v zákopu nepřítele (life.debug.shell), kulometné dávky, zvuk děla; při jízdě prach a výfuk.
// V dev režimu jde vyzkoušet bez hlasování: /?orders=0:TANK  (strana:heslo).
import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { loadTexture } from './assets.js';

const NAME = ['heg', 'con'];
// ústí hlavně a kulometů vůči středu sprite podle strany (0 = Behemoth, 1 = Tortoise) a pohledu (čelní/zadní)
const MUZZLE = { 0: { front: [[-13, 29], [13, 29]], back: [[-13, -31], [13, -31]] }, 1: { front: [[-1, -16], [-1, -16]], back: [[0, -28], [0, -28]] } };
// cyklus (ms): [druh, délka, ze stanice, do stanice]; stanice A = u zákopu, B = vpředu v zemi nikoho, C = mezi nimi
const CYCLE = [['drive', 4200, 'A', 'B'], ['fire', 7000, 'B'], ['drive', 3000, 'B', 'C'], ['fire', 6000, 'C'], ['drive', 3000, 'C', 'A'], ['fire', 4500, 'A']];
const TOTAL = CYCLE.reduce((a, c) => a + c[1], 0);
const ease = (u) => u * u * (3 - 2 * u);

export function initTankFx({ world, roster, map, theme, openX0, openX1 }) {
  let orders = (roster.orders || []).filter((o) => o.kw === 'TANK');
  if (import.meta.env.DEV) {
    const q = new URLSearchParams(location.search).get('orders');
    if (q) orders = [...orders, ...q.split(',').map((x) => { const [f, kw] = x.split(':'); return { faction: Number(f), kw: kw.toUpperCase() }; }).filter((o) => o.kw === 'TANK')];
  }
  const api = { update() {}, sfx: null, life: null, tanks: [] }; // life se doplní po vytvoření (main.js)
  if (!orders.length) return api;
  const T = map.tile;
  const layer = new Container();
  world.addChild(layer);
  const tanks = [];
  for (const o of orders) {
    const f = o.faction, e = 1 - f;
    const toEnemy = map.front[f] < map.front[e] ? 1 : -1;
    const front = map.slots[f].filter((sl) => sl.line === 'front' && sl.x >= openX0 && sl.x <= openX1).sort((a, b) => a.x - b.x);
    if (!front.length) continue;
    // poloha: z enginu (`tankX`), jinak nejhustší okno první linie (stejně jako v enginu)
    let x = o.tankX;
    if (x == null) { const R = theme.tank?.r ?? 1200; let best = 0, j = 0; for (let i = 0; i < front.length; i++) { while (front[j].x < front[i].x - 2 * R) j++; if (i - j + 1 > best) { best = i - j + 1; x = Math.round((front[j].x + front[i].x) / 2); } } }
    const near = front.filter((sl) => Math.abs(sl.x - x) < 220).map((sl) => sl.y);
    const fy = near.length ? (toEnemy > 0 ? Math.max(...near) : Math.min(...near)) : front[0].y;
    const gap = Math.abs(map.front[e] - map.front[f]) * T;
    const yA = fy + toEnemy * 38, reach = Math.min(84, gap * 0.4);
    const Y = { A: yA, B: yA + toEnemy * reach, C: yA + toEnemy * reach * 0.45 };
    const view = toEnemy > 0 ? 'front' : 'back';
    const shadow = new Graphics(), body = new Sprite(Texture.EMPTY), fx = new Graphics();
    body.anchor.set(0.5, 0.5);
    layer.addChild(shadow, body, fx);
    loadTexture(`/assets/props/tank_${NAME[f]}_${view}.png`).then((t) => { body.texture = t; }).catch(() => {});
    tanks.push({ f, e, x, Y, toEnemy, view, shadow, body, fx, t0: (Math.round(x) * 53) % 9000, puffs: [], nextShot: 0, nextMg: 1200, mgBurst: 0, mgNext: 0, recoil: 0, flash: 0, mgFlash: 0, dust: 0, id: 200 + f });
  }
  let last = 0;
  function update(now, view) {
    const dt = Math.min(100, last ? now - last : 16); last = now;
    for (const k of tanks) {
      const seen = k.x > view.x0 - 160 && k.x < view.x1 + 160 && k.Y.A > view.y0 - 200 && k.Y.B > view.y0 - 200 && Math.min(k.Y.A, k.Y.B) < view.y1 + 200 && Math.max(k.Y.A, k.Y.B) > view.y0 - 200;
      k.body.visible = k.shadow.visible = k.fx.visible = seen;
      if (!seen) continue;
      // fáze cyklu z času (všichni vidí totéž)
      let ph = (now + k.t0) % TOTAL, step = CYCLE[0], base = 0;
      for (const c of CYCLE) { if (ph < base + c[1]) { step = c; break; } base += c[1]; }
      const u = (ph - base) / step[1], driving = step[0] === 'drive';
      const y = driving ? k.Y[step[2]] + (k.Y[step[3]] - k.Y[step[2]]) * ease(u) : k.Y[step[2]];
      const dir = k.toEnemy;
      // zpětný ráz a otřes při jízdě
      k.recoil = Math.max(0, k.recoil - dt);
      const kick = (k.recoil / 180) * 3 * -dir;
      const rumble = driving ? (Math.floor(now / 90) % 2 ? 0.7 : -0.7) : (Math.floor(now / 300) % 2 ? 0.25 : 0);
      k.body.x = Math.round(k.x); k.body.y = Math.round(y + kick + rumble);
      k.shadow.clear().ellipse(k.x + 2, y + 6, (k.body.texture.width || 46) * 0.55, (k.body.texture.height || 50) * 0.5).fill({ color: 0x000000, alpha: 0.28 });
      const mz = MUZZLE[k.f][k.view];
      // jízda: prach zpoza pásů, zvuk motoru
      if (driving) {
        k.dust += dt;
        if (k.dust > 110) { k.dust = 0; for (const sx of [-1, 1]) k.puffs.push({ x: k.x + sx * (k.body.texture.width || 46) * 0.36, y: y - dir * ((k.body.texture.height || 50) * 0.4), vx: sx * 0.004, vy: -dir * 0.006, r: 2.5, a: 0.5, c: 0x6b6152 }); }
        api.sfx?.truck?.(k.id, k.x, y, dir);
      }
      // výfuk (vždy, jemně)
      if (Math.random() < dt / 260) k.puffs.push({ x: k.x + (k.f === 0 ? 8 : -6), y: y - dir * ((k.body.texture.height || 50) * 0.45), vx: 0, vy: -0.012, r: 2, a: 0.35, c: 0x2b2722 });
      // střelba na stanicích (ne za jízdy)
      if (step[0] === 'fire') {
        if (now >= k.nextShot) {
          k.nextShot = now + 1500 + Math.random() * 800;
          k.recoil = 180; k.flash = 110;
          const [mx, my] = mz[Math.floor(Math.random() * mz.length)]; k.mz = [k.x + mx, y + my];
          k.puffs.push({ x: k.mz[0], y: k.mz[1], vx: (Math.random() - 0.5) * 0.01, vy: dir * 0.004, r: 4, a: 0.7, c: 0xc4b8a0 }, { x: k.mz[0], y: k.mz[1], vx: 0, vy: dir * 0.008, r: 3, a: 0.5, c: 0x857a68 });
          api.sfx?.cannon?.(k.x, y);
          // dopad v zákopu nepřítele
          const ty = map.front[k.e] * T + 16 + (k.e === 0 ? -1 : 1) * Math.random() * 30, tx = k.x + (Math.random() - 0.5) * 220;
          setTimeout(() => { if (tx > view.x0 - 80 && tx < view.x1 + 80 && ty > view.y0 - 80 && ty < view.y1 + 80) api.life?.debug?.shell?.(tx, ty, true); }, 700 + Math.random() * 300);
        }
        if (k.mgBurst > 0 && now >= k.mgNext) { k.mgBurst--; k.mgNext = now + 70; k.mgFlash = 45; }
        else if (k.mgBurst <= 0 && now >= k.nextMg) { k.mgBurst = 8; k.nextMg = now + 2600 + Math.random() * 1600; }
      } else { k.mgBurst = 0; }
      // kreslení záblesků a částic
      const fx = k.fx; fx.clear();
      if (k.flash > 0 && k.mz) { fx.circle(k.mz[0], k.mz[1], 8).fill({ color: 0xfff6dc, alpha: 0.95 }).circle(k.mz[0], k.mz[1], 14).fill({ color: 0xd98f3f, alpha: 0.4 }); k.flash -= dt; }
      if (k.mgFlash > 0) { const m = mz[Math.floor(now / 70) % 2]; fx.circle(k.x + m[0], y + m[1] + dir * 3, 3).fill({ color: 0xffe9a8, alpha: 0.95 }); k.mgFlash -= dt; }
      for (let i = k.puffs.length - 1; i >= 0; i--) {
        const p = k.puffs[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.r += 0.004 * dt; p.a -= 0.00042 * dt;
        if (p.a <= 0) { k.puffs.splice(i, 1); continue; }
        fx.circle(p.x, p.y, p.r).fill({ color: p.c, alpha: p.a });
      }
    }
  }
  api.update = update;
  api.tanks = tanks;
  return api;
}
