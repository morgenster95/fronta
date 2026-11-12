// Viditelné účinky rozkazů z hlasování na mapě (stav z roster.orders: { faction, kw, from, to }):
//  • DUGOUTS  – hluboké kryty proti bombardování: u zálohy strany stojí pytlové kryty s trámovým vchodem a hlínou (jen po dobu rozkazu),
//  • DOCTOR   – u obvaziště / nemocnice se mezi raněnými prochází lékař v bílém plášti (sprite zdravotníka, červený kříž nad hlavou).
//  • AMMO – víc munice: za nepřátelskou linií dopadá víc granátů (vizuálně; mechanika zvyšuje palbu vlastních střelců),
// V dev režimu jde vyzkoušet bez hlasování: /?orders=0:DUGOUTS,0:DOCTOR  (strana:heslo).
import { Container, Graphics, Sprite, Texture } from 'pixi.js';

const C = { ink: 0x0e0d0c, mud0: 0x2b2722, mud1: 0x3d3730, mud2: 0x524a3f, mud3: 0x6b6152, sand: 0x857a68, bone: 0xa39782, pale: 0xc4b8a0, white: 0xe3d9c3, rust: 0x7e3b2a, steel: 0x666d70 };

// kryt: hliněný násyp s pytli nahoře, trámový rám vchodu, tma a schody dolů, cedulka
function shelterTexture(faction = 0, seed = 1) {
  const W = 46, H = 30, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const px = (x, y, w, h, col) => { g.fillStyle = `#${col.toString(16).padStart(6, '0')}`; g.fillRect(x, y, w, h); };
  // násyp: zaoblený, stínovaný zprava
  for (let y = 6; y < H - 1; y++) {
    const k = (y - 6) / (H - 8), half = Math.round(W / 2 - 2 - (1 - Math.sqrt(1 - Math.pow(1 - k, 2))) * 6);
    for (let x = W / 2 - half; x < W / 2 + half; x++) px(x, y, 1, 1, ((x * 7 + y * 3 + seed) % 5 < 2) ? C.mud2 : (x > W / 2 + half * 0.4 ? C.mud0 : C.mud1));
  }
  px(8, 6, 30, 1, C.mud3);
  // pytle nahoře
  for (let i = 0; i < 5; i++) { px(10 + i * 6, 5 - (i % 2), 6, 3, i % 2 ? C.bone : C.sand); px(10 + i * 6, 5 - (i % 2), 6, 1, C.pale); }
  // vchod: trámový rám, tma, schody
  px(16, 13, 14, 15, C.ink);
  px(14, 12, 3, 17, C.mud3); px(29, 12, 3, 17, C.mud3); px(14, 11, 18, 3, C.mud3);
  px(14, 11, 18, 1, C.sand); px(14, 12, 1, 17, C.sand);
  for (let k = 0; k < 4; k++) px(17, 23 + k, 12, 1, k % 2 ? C.mud1 : C.mud2); // schody dolů
  px(17, 14, 12, 2, faction === 0 ? C.steel : 0x6f7148); // roletka v barvě strany
  // cedulka SHELTER
  px(33, 18, 9, 5, C.ink); px(34, 19, 7, 3, C.pale); px(36, 20, 3, 1, C.rust);
  return Texture.from(c);
}

export function initOrderFx({ world, anchor, roster, map, tex, anims, hospitals, theme, openX0, openX1, life }) {
  let orders = (roster.orders || []).filter((o) => o.kw);
  if (import.meta.env.DEV) {
    const q = new URLSearchParams(location.search).get('orders');
    if (q) orders = [...orders, ...q.split(',').map((x) => { const [f, kw] = x.split(':'); return { faction: Number(f), kw: kw.toUpperCase() }; })];
  }
  const has = (kw, f) => orders.some((o) => o.kw === kw && o.faction === f);
  const layer = new Container();
  world.addChildAt(layer, world.getChildIndex(anchor) + 1);
  const top = new Container(); // lékař nad vojáky
  world.addChild(top);

  // --- DUGOUTS: kryty podél zálohy a podpůrné linie, ~každé 4. stanoviště v otevřené části fronty ---
  theme.factions.forEach((_, f) => {
    if (!has('DUGOUTS', f)) return;
    const slots = map.slots[f].filter((sl) => (sl.line === 'reserve' || sl.line === 'support') && sl.x >= openX0 && sl.x <= openX1).sort((a, b) => a.x - b.x);
    let lastX = -999;
    for (const sl of slots) {
      if (sl.x - lastX < 380) continue; // ~jeden kryt na 12 vojáků
      lastX = sl.x;
      const s = new Sprite(shelterTexture(f, Math.round(sl.x) % 7));
      s.anchor.set(0.5, 0.9);
      s.scale.set(1.3);
      s.x = Math.round(sl.x + 26); s.y = Math.round(sl.y + (f === 0 ? -14 : 14));
      layer.addChild(s);
    }
  });

  // --- DOCTOR: lékař pochoduje mezi lůžky a nosítky u obvaziště strany ---
  const docs = [];
  theme.factions.forEach((_, f) => {
    if (!has('DOCTOR', f)) return;
    const site = hospitals?.sites.find((x) => x.faction === f);
    if (!site) return;
    const key = anims[`${theme.factions[f].sprite}_medic`] ? `${theme.factions[f].sprite}_medic` : theme.factions[f].sprite;
    const walk = anims[key]?.walk;
    if (!walk) return;
    const sp = new Sprite(tex[key].south);
    sp.anchor.set(0.5, 30 / 32);
    sp.scale.set(1.08);
    const cross = new Graphics();
    cross.rect(-3, -41, 7, 7).fill(0xe3d9c3).stroke({ width: 1, color: 0x0e0d0c });
    cross.rect(-1, -40, 3, 5).fill(0x7e3b2a); cross.rect(-2, -38, 5, 1).fill(0x7e3b2a);
    top.addChild(sp); top.addChild(cross);
    docs.push({ sp, cross, walk, idle: tex[key], x0: site.x - 30, x1: site.x + 30, y: site.y + (site.beds?.[0] ? 0 : 0), t0: Math.random() * 6000 });
  });

  // --- COUNTERFIRE: občasné dopady za nepřátelskou linií v záběru kamery ---
  const back = theme.factions.map((_, f) => has('AMMO', f));
  let nextShot = 0;
  let raised = false;
  return {
    shelters: layer.children,
    update(now, view) {
      if (view && life && back.some(Boolean) && now > nextShot) {
        nextShot = now + 700 + Math.random() * 1800;
        for (let f = 0; f < back.length; f++) {
          if (!back[f]) continue;
          const e = 1 - f, y = map.front[e] * map.tile + 16 + (e === 1 ? 1 : -1) * (80 + Math.random() * 260); // za nepřátelskou frontou
          if (y > view.y0 - 40 && y < view.y1 + 40) life.shell(view.x0 + Math.random() * (view.x1 - view.x0), y, Math.random() < 0.5);
        }
      }
      if (!raised && docs.length) { raised = true; world.setChildIndex(top, world.children.length - 1); } // lékař nad vojáky
      for (const d of docs) {
        const T = 9000, u = ((now + d.t0) % (2 * T)) / T; // tam a zpět
        const p = u < 1 ? u : 2 - u, east = u < 1;
        const pause = p < 0.08 || p > 0.92 || (p > 0.45 && p < 0.55); // u lůžka se na chvíli zastaví
        const x = d.x0 + (d.x1 - d.x0) * p;
        d.sp.x = Math.round(x); d.sp.y = Math.round(d.y);
        const dir = east ? 'east' : 'west';
        const fr = d.walk[dir];
        d.sp.texture = pause || !fr?.length ? d.idle[dir] ?? d.idle.south : fr[Math.floor(now / 110) % fr.length];
        d.cross.x = d.sp.x; d.cross.y = d.sp.y + (pause ? -1 : -Math.abs(Math.sin(now / 160)));
      }
    },
  };
}
