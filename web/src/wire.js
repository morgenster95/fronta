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

export async function initWire({ world, anchor, roster, map, anims, theme, openX0, openX1, V = '' }) {
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
  const devParty = Object.fromEntries((dev?.get('party') || '').split(',').filter(Boolean).map((x) => x.split(':').map(Number)));
  const put = (k, x, y) => { const s = new Sprite(tex[k]); s.anchor.set(0.5, 1); s.x = Math.round(x); s.y = Math.round(y); layer.addChild(s); return s; };
  const workers = [];

  theme.factions.forEach((fac, f) => {
    const toEnemy = map.front[f] < map.front[1 - f] ? 1 : -1;
    const rowY = (map.front[f] + toEnemy * 6 + 1) * T; // spodek dlaždice drátu
    // úseky přední linie: rozsah x podle stanovišť
    const segs = {};
    for (const sl of map.slots[f]) {
      if (sl.line !== 'front' || !sl.label) continue;
      const g = (segs[sl.label] ??= { label: sl.label, x0: Infinity, x1: -Infinity });
      g.x0 = Math.min(g.x0, sl.x); g.x1 = Math.max(g.x1, sl.x);
    }
    const list = Object.values(segs).sort((a, b) => a.x0 - b.x0);
    list.forEach((g, i) => { g.a = i ? (list[i - 1].x1 + g.x0) / 2 : g.x0 - 40; g.b = i < list.length - 1 ? (g.x1 + list[i + 1].x0) / 2 : g.x1 + 40; });
    const wireBy = pub[f]?.wireBy || {};
    const party = { ...(pub[f]?.party || {}) };
    const mid = (openX0 + openX1) / 2;
    if (devParty[f]) [...list].sort((p, q) => Math.abs((p.x0 + p.x1) / 2 - mid) - Math.abs((q.x0 + q.x1) / 2 - mid)).slice(0, 3).forEach((g) => (party[g.label] = devParty[f]));
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
      // wiring party: u díry klečí a zatlouká kůl, další se plazí se svitkem
      const n = Math.min(3, party[g.label] || 0);
      if (!n) continue;
      const key = fac.sprite;
      const dir = toEnemy > 0 ? 'south' : 'north';
      const cx = (Math.max(a, g.x0) + Math.min(b, g.x1)) / 2;
      put(PROPS.picket[0], cx - 9, rowY + 1);
      put(PROPS.coil[f % 2], cx + 12, rowY + 3);
      const plan = [
        { anim: 'work', dir, x: cx, y: rowY + 3 },
        { anim: 'crawl', dir: 'east', x: cx - 26, y: rowY + toEnemy * -10, move: 14 },
        { anim: 'work', dir, x: cx + 26, y: rowY + 2, t0: 400 },
      ];
      for (const p of plan.slice(0, n)) {
        const fr = anims[key]?.[p.anim]?.[p.dir];
        if (!fr?.length) continue;
        const s = new Sprite(fr[0]);
        s.anchor.set(0.5, (30 + (fr[0].width - 32) / 2) / fr[0].height);
        s.x = Math.round(p.x); s.y = Math.round(p.y);
        layer.addChild(s);
        workers.push({ s, fr, x: p.x, move: p.move || 0, t0: p.t0 || hash(Math.round(p.x), 3) * 3000 });
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
      for (const w of workers) {
        const k = Math.floor((now + w.t0) / 130) % w.fr.length;
        w.s.texture = w.fr[k];
        if (w.move) w.s.x = Math.round(w.x + Math.sin((now + w.t0) / 2200) * w.move);
      }
    },
  };
}
