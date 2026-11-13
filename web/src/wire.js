// Ostnatý drát v zemi nikoho podle skutečného stavu (roster.battle[f].wireBy: úsek → 0..1) a wiring party při práci (roster.battle[f].party).
// Rekvizity z PixelLabu: web/public/assets/props/wire_*.png, hedgehog_*.png, screw_picket_*.png, wire_coil_*.png (zdroj art/props/wire/).
// Úsek = skupina 4 stanovišť přední linie se stejným označením (map.slots[f][].label, např. "R-F12"); drát leží 6 dlaždic před linií
// (engine/mapgen.js). Celý drát ≥ 0,65, potrhaný 0,35–0,65 napůl, pod 0,35 potrhaný s dírami.
// Náhled na vývojovém serveru: /?wire=0:0.1,1:0.9 (průměr pro stranu) a /?party=0:3,1:1 (lidé v prvních úsecích strany).
import { Container, Sprite } from 'pixi.js';
import { loadTexture } from './assets.js';

const PROPS = {
  intact: ['wire_intact_0', 'wire_intact_1', 'wire_intact_2'],
  broken: ['wire_broken_0', 'wire_broken_1', 'wire_broken_2', 'wire_broken_3'],
  hedgehog: ['hedgehog_0', 'hedgehog_1', 'hedgehog_2'],
  picket: ['screw_picket_0', 'screw_picket_1'],
  coil: ['wire_coil_0', 'wire_coil_1'],
};
const STEP = 22; // rozestup zátarasů (px světa)
const hash = (a, b) => { let h = Math.imul(a ^ 0x9e3779b9, 2654435761) ^ Math.imul(b + 0x7f4a7c15, 1597334677); h ^= h >>> 15; return (h >>> 0) / 4294967296; };

// úseky přední linie strany f: { label, x0, x1, a, b } (a–b = souvislý kus drátu) a řada drátu (y spodku)
function segments(map, f) {
  const toEnemy = map.front[f] < map.front[1 - f] ? 1 : -1;
  const rowY = (map.front[f] + toEnemy * 6 + 1) * map.tile;
  const segs = {};
  for (const sl of map.slots[f]) {
    if (sl.line !== 'front' || !sl.label) continue;
    const g = (segs[sl.label] ??= { label: sl.label, x0: Infinity, x1: -Infinity });
    g.x0 = Math.min(g.x0, sl.x); g.x1 = Math.max(g.x1, sl.x);
  }
  const list = Object.values(segs).sort((p, q) => p.x0 - q.x0);
  list.forEach((g, i) => { g.a = i ? (list[i - 1].x1 + g.x0) / 2 : g.x0 - 40; g.b = i < list.length - 1 ? (g.x1 + list[i + 1].x0) / 2 : g.x1 + 40; });
  return { toEnemy, rowY, list };
}

// Skuteční dobrovolníci (roster.battle[f].party: úsek → [handle]) se přesunou ze zákopu k drátu svého úseku: s.x/s.y se změní
// PŘED vytvořením spritů (karta, výběr i kamera je najdou u drátu), s.onWire = { anim, dir } (life.js je nenechá střílet).
// Náhled na vývojovém serveru: /?party=0:4,1:2 (tolik vojáků přední linie strany nejblíž středu).
export function placeVolunteers({ soldiers, roster, map, theme, openX0, openX1 }) {
  const pub = roster.battle || [];
  const dev = import.meta.env.DEV ? new URLSearchParams(location.search) : null;
  const devParty = Object.fromEntries((dev?.get('party') || '').split(',').filter(Boolean).map((x) => x.split(':').map(Number)));
  const out = [];
  theme.factions.forEach((fac, f) => {
    const { toEnemy, rowY, list } = segments(map, f);
    const byLabel = Object.fromEntries(list.map((g) => [g.label, g]));
    let handles = Object.values(pub[f]?.party || {}).flat().filter((h) => typeof h === 'string');
    if (devParty[f]) {
      const mid = (openX0 + openX1) / 2;
      handles = soldiers.filter((s) => s.faction === f && s.slot?.line === 'front' && !s.vacant && s.handle).sort((p, q) => Math.abs(p.x - mid) - Math.abs(q.x - mid)).slice(0, devParty[f]).map((s) => s.handle);
    }
    const perSeg = {};
    for (const h of handles) {
      const s = soldiers.find((x) => x.handle === h && x.slot);
      if (!s) continue;
      // úsek vojáka: podle stanoviště (nejbližší úsek přední linie strany)
      const g = list.reduce((best, q) => (Math.abs((q.x0 + q.x1) / 2 - s.x) < Math.abs((best.x0 + best.x1) / 2 - s.x) ? q : best), list[0]);
      if (!g) continue;
      const i = (perSeg[g.label] = (perSeg[g.label] || 0) + 1) - 1;
      const cx = Math.min(Math.max((g.x0 + g.x1) / 2, openX0 + 20), openX1 - 20);
      const role = i % 3; // 0 a 2 klečí a zatloukají, 1 se plazí se svitkem
      s.x = Math.round(cx + Math.ceil(i / 2) * 24 * (i % 2 ? -1 : 1)); // podél drátu: střed, vlevo, vpravo, dál vlevo…
      s.y = Math.round(rowY + (role === 1 ? -toEnemy * 10 : 3));
      s.onWire = { anim: role === 1 ? 'crawl' : 'work', dir: role === 1 ? 'east' : toEnemy > 0 ? 'south' : 'north', seg: g.label, t0: (i * 700) % 3000, x0: s.x };
      out.push(s);
    }
  });
  return out;
}

export async function initWire({ world, anchor, roster, map, anims, theme, openX0, openX1, V = '', volunteers = [] }) {
  const tex = {};
  try {
    await Promise.all(Object.values(PROPS).flat().map(async (k) => { tex[k] = await loadTexture(`/assets/props/${k}.png${V}`); }));
  } catch { return null; } // bez rekvizit zůstane kreslený drát v terénu
  const layer = new Container();
  world.addChildAt(layer, world.getChildIndex(anchor) + 1);
  const pub = roster.battle || [];
  const T = map.tile;
  const dev = import.meta.env.DEV ? new URLSearchParams(location.search) : null;
  const devWire = Object.fromEntries((dev?.get('wire') || '').split(',').filter(Boolean).map((x) => x.split(':').map(Number)));
  const put = (k, x, y) => { const s = new Sprite(tex[k]); s.anchor.set(0.5, 1); s.x = Math.round(x); s.y = Math.round(y); layer.addChild(s); return s; };

  const busySegs = new Set((volunteers || []).map((v) => `${v.faction}:${v.onWire.seg}`));
  theme.factions.forEach((fac, f) => {
    const { rowY, list } = segments(map, f);
    const wireBy = pub[f]?.wireBy || {};
    for (const g of list) {
      const a = Math.max(g.a, openX0), b = Math.min(g.b, openX1);
      if (b <= a) continue;
      const v = devWire[f] ?? wireBy[g.label] ?? pub[f]?.wire ?? 0.6;
      for (let x = a + STEP / 2, i = 0; x < b; x += STEP, i++) {
        const r = hash(Math.round(x), f * 977 + 13);
        const y = rowY + Math.round((hash(Math.round(x), 5) - 0.5) * 6);
        let kind;
        if (v >= 0.65) kind = 'intact';
        else if (v >= 0.35) kind = r < 0.5 ? 'intact' : 'broken';
        else kind = r < 0.3 ? null : 'broken'; // díra
        if (kind) put(PROPS[kind][Math.floor(hash(i, Math.round(x)) * PROPS[kind].length)], x, y);
      }
      // u úseku s dobrovolníky: nový kůl a svitek drátu
      if (busySegs.has(`${f}:${g.label}`)) {
        const cx = Math.min(Math.max((g.x0 + g.x1) / 2, openX0 + 20), openX1 - 20);
        put(PROPS.picket[0], cx - 10, rowY + 1);
        put(PROPS.coil[f % 2], cx + 12, rowY + 3);
      }
    }
    // ježci v zemi nikoho (pevně podle mapy, ať je všichni vidí stejně)
    const midY = ((map.front[0] + map.front[1]) / 2) * T;
    for (let x = openX0 + 60; x < openX1; x += 150) {
      if (f) break;
      const r = hash(Math.round(x), 41);
      if (r < 0.35) continue;
      put(PROPS.hedgehog[Math.floor(r * 30) % 3], x + (r - 0.5) * 80, midY + (hash(Math.round(x), 43) - 0.5) * 8 * T);
    }
  });

  return {
    update(now) {
      // skuteční dobrovolníci u drátu: práce (klečí a zatloukají) nebo plazení sem a tam
      for (const s of volunteers) {
        const sp = s.sprite, w = s.onWire;
        if (!sp) continue;
        const key = s.texKey && anims[s.texKey]?.[w.anim] ? s.texKey : theme.factions[s.faction].sprite;
        const fr = anims[key]?.[w.anim]?.[w.dir];
        if (!fr?.length) continue;
        const t = fr[Math.floor((now + w.t0) / 130) % fr.length];
        if (sp.texture !== t) { sp.texture = t; sp.scale.x = 1; sp.anchor.set(0.5, (30 + (t.width - 32) / 2) / t.height); }
        if (w.anim === 'crawl') sp.x = Math.round(w.x0 + Math.sin((now + w.t0) / 2200) * 12);
      }
    },
  };
}
