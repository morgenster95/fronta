// Viditelné účinky rozkazů z hlasování na mapě (stav z roster.orders: { faction, kw, from, to }):
//  • DUGOUTS  – hluboké kryty proti bombardování: u zálohy strany stojí pytlové kryty s trámovým vchodem a hlínou (jen po dobu rozkazu),
//  • DOCTOR   – u obvaziště / nemocnice se mezi raněnými prochází lékař v bílém plášti (sprite zdravotníka, červený kříž nad hlavou).
//  • AMMO    – sklad munice v týlu vedle obvaziště: bedny, police s náboji, plachta a pytlový val (mechanika zvyšuje palbu vlastních střelců),
//  • PILLBOXES – betonové kulometné bunkry (obrázek z PixelLabu) v přední linii (nápad Hegemonie z Rady fronty): kulometčíci a odstřelovači střílí víc (rozkaz `fire`).
//    Od 16. 11. má každý bunkr vlající vlajku strany (Hegemonie ocel s rezavým pruhem, Concord oliva se žlutou hvězdou), ukázka docs/mockups/pillbox_flags.png.
// V dev režimu jde vyzkoušet bez hlasování: /?orders=0:DUGOUTS,0:DOCTOR  (strana:heslo).
import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { loadTexture } from './assets.js';

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


// vlajka strany na bunkru: tyčka z rohu střechy, vlající látka (Hegemonie: ocel s rezavým pruhem, Concord: oliva se žlutou hvězdou; barvy jako prapory v reelech)
const FLAG = [{ col: 0x8a9295, dark: 0x666d70, mark: 0x7e3b2a }, { col: 0x6f7148, dark: 0x3f4230, mark: 0xc9c26a }];
function drawFlag(g, x, y, f, t) {
  const F = FLAG[f] || FLAG[0], W = 12, H = 8, top = y - 15;
  g.clear();
  g.rect(x, top, 1, 16).fill(0x0e0d0c); // tyčka
  g.rect(x, top - 1, 1, 1).fill(0xa39782); // hlavička
  for (let i = 0; i < W; i++) {
    const o = Math.round(Math.sin(t * 3.2 - i * 0.5) * 1.4 * (i / W));
    const c = Math.cos(t * 3.2 - i * 0.5) > 0.4 ? F.dark : F.col;
    const yy = top + 1 + o;
    g.rect(x + 1 + i, yy, 1, H).fill(c);
    if (f === 0) g.rect(x + 1 + i, yy + 3, 1, 2).fill(F.mark); // rezavý pruh přes střed
    g.rect(x + 1 + i, yy + H, 1, 1).fill({ color: 0x0e0d0c, alpha: 0.5 }); // stín spodní hrany
  }
  if (f === 1) { // hvězda uprostřed (tvar plus s jádrem)
    const cx = x + 7, o = Math.round(Math.sin(t * 3.2 - 6 * 0.5) * 1.4 * (6 / W)), cy = top + 4 + o;
    g.rect(cx - 1, cy - 1, 3, 3).fill(F.mark); g.rect(cx, cy - 2, 1, 5).fill(F.mark); g.rect(cx - 2, cy, 5, 1).fill(F.mark);
  }
}

// betonový kulometný bunkr: šestiúhelníkový blok s průzorem, pytle po stranách, proužek v barvě strany
function pillboxTexture(faction = 0, seed = 1) {
  const W = 44, H = 24, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const px = (x, y, w, h, col) => { g.fillStyle = `#${col.toString(16).padStart(6, '0')}`; g.fillRect(x, y, w, h); };
  const CON = [0x8a8a84, 0x76766f, 0x9c9a92, 0x63625c];
  // pytle po stranách
  for (let i = 0; i < 3; i++) { px(1, 9 + i * 4, 8, 4, i % 2 ? C.bone : C.sand); px(W - 9, 9 + i * 4, 8, 4, i % 2 ? C.sand : C.bone); px(1, 9 + i * 4, 8, 1, C.pale); px(W - 9, 9 + i * 4, 8, 1, C.pale); }
  // betonový blok se zkosenými rohy
  for (let y = 2; y < H - 1; y++) {
    const cut = Math.max(0, 4 - y, y - (H - 6));
    for (let x = 7 + cut; x < W - 7 - cut; x++) px(x, y, 1, 1, CON[((x * 5 + y * 3 + seed) % 7 < 2) ? 3 : y < 5 ? 2 : (x > W / 2 + 6 ? 1 : 0)]);
  }
  px(9, 2, W - 18, 1, 0xb4b2a9); // horní hrana na světle
  // průzor pro kulomet
  px(12, 9, W - 24, 3, C.ink); px(12, 12, W - 24, 1, 0x4a4a45);
  px(W / 2 - 1, 10, 6, 1, C.steel); // hlaveň v průzoru
  // praskliny a proužek strany
  px(14, 15, 1, 3, 0x55554f); px(15, 17, 2, 1, 0x55554f); px(W - 16, 5, 1, 2, 0x55554f);
  px(10, H - 4, W - 20, 2, faction === 0 ? C.steel : 0x6f7148);
  return Texture.from(c);
}

// sklad munice: pytlový val, hromady beden se značkami, police s mosaznými náboji, plachta, lucerna
function ammoTexture(faction = 0) {
  const W = 92, H = 60, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const px = (x, y, w, h, col) => { g.fillStyle = `#${col.toString(16).padStart(6, '0')}`; g.fillRect(x, y, w, h); };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) px(x, y, 1, 1, ((x >> 1) * 7 + (y >> 1) * 3) % 5 < 2 ? C.mud1 : C.mud0); // udusaná hlína
  // pytlový val kolem
  const bag = (x, y, w) => { px(x, y, w, 5, C.ink); px(x + 1, y + 1, w - 2, 3, (x + y) % 2 ? C.bone : C.sand); px(x + 2, y + 1, w - 5, 1, C.pale); };
  for (let x = 0; x < W; x += 9) { bag(x, 0, 9); bag(x + 4, 4, 9); bag(x, H - 9, 9); bag(x + 4, H - 5, 9); }
  for (let y = 5; y < H - 9; y += 9) { bag(0, y, 9); bag(W - 9, y, 9); }
  // bedny (hromady), prkna a svislé latě, značka
  const crate = (x, y, w = 18, h = 12, tone = 0) => {
    px(x - 1, y - 1, w + 2, h + 2, C.ink); px(x, y, w, h, tone ? C.mud3 : C.mud2);
    px(x, y, w, 2, C.sand); px(x, y + h - 2, w, 1, C.mud1);
    px(x + 2, y, 2, h, C.mud1); px(x + w - 4, y, 2, h, C.mud1);
    px(x + 6, y + 4, 6, 3, C.ink); px(x + 7, y + 5, 4, 1, C.rust);
  };
  crate(14, 34); crate(33, 34, 18, 12, 1); crate(14, 21); crate(23, 9, 18, 12, 1); crate(33, 21);
  // police s náboji (mosazné hlavně, rezavé špice)
  px(60, 12, 24, 3, C.mud2); px(60, 12, 24, 1, C.sand);
  for (let i = 0; i < 6; i++) { px(62 + i * 4, 3, 3, 9, C.ink); px(63 + i * 4, 4, 1, 7, 0xd98f3f); px(62 + i * 4, 3, 3, 2, C.rust); }
  for (let i = 0; i < 6; i++) { px(62 + i * 4, 18, 3, 9, C.ink); px(63 + i * 4, 19, 1, 7, 0xc9c26a); px(62 + i * 4, 18, 3, 2, C.rust); }
  px(60, 27, 24, 3, C.mud2);
  // plachta přes část beden
  px(58, 34, 26, 14, C.ink); px(59, 35, 24, 12, faction === 0 ? 0x666d70 : 0x52543a); px(59, 35, 24, 2, faction === 0 ? 0x8a9295 : 0x6f7148);
  for (let i = 0; i < 5; i++) px(61 + i * 5, 38 + (i % 2), 1, 8, 0x3f4230);
  // lucerna na kůlu
  px(53, 31, 1, 14, C.ink); px(51, 29, 5, 4, C.ink); px(52, 30, 3, 2, 0xd98f3f);
  return Texture.from(c);
}

export function initOrderFx({ world, anchor, roster, map, tex, anims, hospitals, theme, openX0, openX1 }) {
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

  // --- AMMO: sklad munice v týlu (jako obvaziště): bedny, police s náboji, plachta, pytlový val ---
  theme.factions.forEach((_, f) => {
    if (!has('AMMO', f)) return;
    const site = hospitals?.sites.find((x) => x.faction === f);
    if (!site) return;
    const s = new Sprite(ammoTexture(f));
    s.anchor.set(0.5, 0.5);
    s.x = Math.round(site.x + 150); s.y = Math.round(site.y);
    layer.addChild(s);
  });

  const pbTop = new Container(); // bunkry před valem (nad pytli)
  world.addChild(pbTop);
  const pbs = []; // bunkry: záblesky kulometu v update()
  const flash = new Graphics();
  // --- PILLBOXES: betonové bunkry v přední linii před stanovišti, ~jeden na 10 stanovišť otevřené části fronty ---
  theme.factions.forEach((_, f) => {
    if (!has('PILLBOXES', f)) return;
    const toEnemy = map.front[f] < map.front[1 - f] ? 1 : -1;
    const slots = map.slots[f].filter((sl) => sl.line === 'front' && sl.x >= openX0 && sl.x <= openX1).sort((a, b) => a.x - b.x);
    let lastX = -999;
    for (const sl of slots) {
      if (sl.x - lastX < 300) continue;
      lastX = sl.x;
      const s = new Sprite(pillboxTexture(f, Math.round(sl.x) % 7)); // kreslená náhrada, než se načte obrázek z PixelLabu
      // obrázky z PixelLabu (15. 11.): zepředu s průzorem (strana míří dolů, vidíme čelo), zezadu se vchodem (strana míří nahoru)
      loadTexture(toEnemy > 0 ? '/assets/props/pillbox.png' : '/assets/props/pillbox_back.png').then((t) => { s.texture = t; }).catch(() => {});
      const fl = new Graphics(); // vlajka strany na střeše (16. 11.: aby se bunkry obou stran rozlišily)
      pbs.push({ s, fl, f, front: toEnemy > 0, t0: (Math.round(sl.x) * 37) % 4000 });
      s.anchor.set(0.5, 0.5);
      s.x = Math.round(sl.x + 14); s.y = Math.round(sl.y + toEnemy * 18);
      // bunkr před valem: u strany, která míří dolů, leží před pytli (nad nimi); u druhé ho zakryjí vojáci v zákopu
      (toEnemy > 0 ? pbTop : layer).addChild(s);
      (toEnemy > 0 ? pbTop : layer).addChild(fl);
      drawFlag(fl, s.x - 15, s.y - 10, f, 0);
    }
  });
  if (pbs.length) { world.addChild(flash); }
  let flagT = 0;
  let raised = false;
  return {
    shelters: [...layer.children, ...pbTop.children],
    docs,
    update(now, view) {
      // kulomet v bunkru střílí dávkami: každé ~3 s dávka 6 záblesků z průzoru (u bunkru zezadu je záblesk vidět nad střechou)
      if (pbs.length && now - flagT > 120) { // vlajky vlají (překreslení ~8× za s, jen viditelné)
        flagT = now;
        for (const p of pbs) {
          const { s } = p;
          if (view && (s.x < view.x0 - 40 || s.x > view.x1 + 40 || s.y < view.y0 - 40 || s.y > view.y1 + 40)) continue;
          drawFlag(p.fl, s.x - 15, s.y - 10, p.f, (now + p.t0) / 1000);
        }
      }
      if (pbs.length) {
        flash.clear();
        for (const p of pbs) {
          const { s } = p;
          if (view && (s.x < view.x0 - 40 || s.x > view.x1 + 40 || s.y < view.y0 - 40 || s.y > view.y1 + 40)) continue;
          const u = (now + p.t0) % 3000;
          if (u > 900) continue; // mezi dávkami ticho
          if (Math.floor(u / 70) % 2) continue; // záblesk / pauza
          const x = s.x, y = p.front ? s.y + 7 : s.y - 17, k = Math.floor(u / 140) % 2;
          flash.rect(x - 2, y - 1, 4, 3).fill({ color: 0xffe9a8 });
          flash.rect(x - 1 - k, y + (p.front ? 2 : -3), 2 + 2 * k, 2).fill({ color: 0xf2a43a });
          flash.rect(x - 3, y, 1, 1).fill({ color: 0xf2a43a }); flash.rect(x + 2, y, 1, 1).fill({ color: 0xf2a43a });
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
        d.sp.texture = pause || !fr?.length ? d.idle[dir] ?? d.idle.south : fr[((Math.floor(now / 110) % fr.length) + fr.length) % fr.length];
        d.cross.x = d.sp.x; d.cross.y = d.sp.y + (pause ? -1 : -Math.abs(Math.sin(now / 160)));
      }
    },
  };
}
