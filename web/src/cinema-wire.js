// Filmové záběry k reelu „wiring party“ (mřížka 180×320, paleta hry, dithering, skutečné sprity a NOVÉ animace z PixelLabu):
//   nml   – noc v zemi nikoho: tři vojáci se plazí k potrhanému drátu; s volbou flareAt vystoupá světlice a vojáci se přitisknou k zemi
//   stake – detail: voják klečí a zatlouká kůl, vedle svitek drátu, nový drát se natahuje od kůlu
// Použití: const c = makeWireScenes(tex, anims); root.prepend(c.canvas); c.draw('nml', t, { flareAt: 1.2 });
import { sky, glow, lit, stakeWire, clamp01, CW as W, CH as H } from './cinema.js';

const off = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const img = (src) => { const i = new Image(); i.src = src; return i; };

export function makeWireScenes(tex, anims = {}) {
  const canvas = off(W, H);
  canvas.id = 'rw-cine';
  const g = canvas.getContext('2d');
  g.imageSmoothingEnabled = false;
  // sady snímků pro obě strany; scéna kreslí vždy jen jednu (o.side), strany se na jednom snímku nemíchají
  // snímky v nočním a ve světle světlice (tint jen barvou, plné krytí: žádní duchové)
  const frames = (list, tint) => (list || []).map((tx) => lit(tx, tint)).filter(Boolean);
  const NIGHT = 'rgba(14,18,40,0.5)', FLARE = 'rgba(255,228,170,0.14)', MOON = 'rgba(20,26,54,0.38)';
  const SETS = {};
  for (const k of ['hegemony', 'concord']) {
    const A = anims[k] || {};
    SETS[k] = {
      crawlN: frames(A.crawl?.east, NIGHT), crawlF: frames(A.crawl?.east, FLARE),
      proneN: frames(A.prone?.east, NIGHT), proneF: frames(A.prone?.east, FLARE),
      work: frames(A.work?.east, MOON), crawl2: frames(A.crawl?.east, MOON),
    };
  }
  const setOf = (o) => SETS[o?.side] || SETS.hegemony;
  const P = { coil: img('/assets/props/wire_coil_0.png'), picket: img('/assets/props/screw_picket_0.png'), broken: img('/assets/props/wire_broken_0.png'), broken2: img('/assets/props/wire_broken_3.png'), hog: img('/assets/props/hedgehog_1.png') };

  // --- statické vrstvy ---
  const L = {};
  {
    const c = off(W, H), cg = c.getContext('2d');
    sky(cg, 0, 196, ['#03050c', '#070b18', '#0c1124', '#141829', '#20192a']);
    let s = 7; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k < 40; k++) { cg.fillStyle = r() < 0.3 ? '#9a98a0' : '#4d5064'; cg.fillRect(Math.floor(r() * W), Math.floor(r() * 120), 1, 1); }
    // nepřátelský val na obzoru (pytle) a pahýly stromů
    cg.fillStyle = '#0d0b10';
    for (let x = 0; x < W; x++) cg.fillRect(x, Math.round(186 + 2 * Math.sin(x * 0.07) + Math.sin(x * 0.31)), 1, 20);
    for (let x = 4; x < W; x += 9) { cg.fillRect(x, 182 + (x % 3), 8, 4); }
    for (const [tx, h] of [[30, 24], [118, 16], [156, 30]]) { cg.fillRect(tx, 186 - h, 2, h); cg.fillRect(tx - 4, 186 - h + 6, 4, 1); cg.fillRect(tx + 2, 186 - h + 10, 5, 1); }
    // bahno země nikoho: tmavé pásy s ditheringem, krátery
    sky(cg, 196, H, ['#1a1618', '#1e1a1a', '#231e1c', '#28221e', '#2c2520']);
    for (const [cx, cy, rr] of [[40, 214, 14], [128, 226, 18], [80, 300, 22], [168, 276, 12], [14, 268, 10]]) {
      cg.fillStyle = '#120f10'; cg.beginPath(); cg.ellipse(cx, cy, rr, rr / 3.2, 0, 0, Math.PI * 2); cg.fill();
      cg.fillStyle = '#2f2823'; cg.fillRect(cx - rr + 2, Math.round(cy - rr / 3.2) - 1, rr * 2 - 4, 1);
    }
    // vzdálený drát (celý, nepřátelský)
    stakeWire(cg, -2, W + 2, 200, 7, 11, '#0a080b', null);
    L.nml = c;
  }
  {
    const c = off(W, H), cg = c.getContext('2d');
    sky(cg, 0, 210, ['#04060e', '#0a1022', '#121a33', '#1b2240', '#262a44']);
    glow(cg, 140, 54, 40, '#2a3150', 1.1); glow(cg, 140, 54, 18, '#4c5470', 1);
    cg.fillStyle = '#cfc9b4';
    for (let y = -7; y <= 7; y++) for (let x = -7; x <= 7; x++) if (x * x + y * y <= 49) cg.fillRect(140 + x, 54 + y, 1, 1);
    cg.fillStyle = '#0f0c10';
    for (let x = 0; x < W; x++) cg.fillRect(x, Math.round(206 + 2 * Math.sin(x * 0.05)), 1, 14);
    sky(cg, 214, H, ['#1d191b', '#221d1c', '#28221e', '#2d2621']);
    L.stake = c;
  }

  const drawSp = (cv, x, y, k = 2) => { if (cv) g.drawImage(cv, Math.round(x), Math.round(y), cv.width * k, cv.height * k); };
  const propAt = (im, x, yb, k = 2) => { if (im.complete && im.naturalWidth) g.drawImage(im, Math.round(x - (im.naturalWidth * k) / 2), Math.round(yb - im.naturalHeight * k), im.naturalWidth * k, im.naturalHeight * k); };
  const rain = (t, n = 70, a = 0.3) => {
    g.fillStyle = `rgba(160,170,190,${a})`;
    for (let k = 0; k < n; k++) {
      const p = (k * 0.6180339) % 1, q = (k * 0.7548776) % 1;
      const y = ((q * 340 + t * 240) % 340) - 10, x = ((p * 230 - y * 0.25) % 230 + 230) % 230 - 20;
      g.fillRect(Math.round(x), Math.round(y), 1, 3);
    }
  };

  const scenes = {
    nml(t, o = {}) {
      const { crawlN, crawlF, proneN, proneF } = setOf(o);
      g.drawImage(L.nml, 0, 0);
      // světlice: vystoupá, visí a pomalu klesá; light = jak moc svítí
      let light = 0, fx = 0, fy = 0;
      if (o.flareAt != null) {
        const u = t - o.flareAt;
        if (u > 0) {
          fx = 96 + (u < 1.1 ? u * 10 : 11 + Math.sin(u * 1.6) * 4 + (u - 1.1) * 2);
          fy = u < 1.1 ? 200 - (1 - (1 - u / 1.1) ** 2) * 150 : 50 + (u - 1.1) * 9;
          light = u < 1.1 ? u / 1.1 * 0.6 : clamp01((7 - u) / 1.5);
          glow(g, fx, fy, 120, '#2f2c38', 1.2 * light, 1.2);
          glow(g, fx, fy, 70, '#57503f', 1.0 * light, 1.2);
          glow(g, fx, fy + 150, 110, '#3d352a', 0.9 * light, 0.35); // světlo na bahně
          g.fillStyle = '#fff4d6'; g.fillRect(Math.round(fx), Math.round(fy), 2, 2);
          g.fillStyle = 'rgba(200,190,170,0.4)';
          if (u < 1.1) for (let k = 1; k < 8; k++) g.fillRect(Math.round(fx - k), Math.round(fy + k * 4), 1, 2);
          else for (let k = 1; k < 6; k++) g.fillRect(Math.round(fx + Math.sin(u * 2 - k) * 2), Math.round(fy - k * 3), 1, 2);
        }
      }
      const flat = light > 0.25; // ve světle světlice ztuhnou na zemi
      // tři vojáci se plazí zleva k potrhanému drátu (každý jinou fází)
      const crew = [[-30, 236, 0], [-74, 250, 0.4], [-6, 262, 0.8]];
      for (const [x0, yb, ph] of crew) {
        const moveT = o.flareAt != null ? Math.min(t, o.flareAt + 0.35) + Math.max(0, t - (o.flareAt + 7.2)) : t; // při světlici stojí
        const x = x0 + moveT * 9 + ph * 6;
        if (flat && proneN.length) {
          const pr = light > 0.5 ? proneF : proneN;
          drawSp(pr[pr.length - 1], x, yb - 92);
        } else if (crawlN.length) {
          const fr = light > 0.15 ? crawlF : crawlN;
          drawSp(fr[((Math.floor((t + ph) / 0.13) % fr.length) + fr.length) % fr.length], x, yb - 92);
        }
      }
      // potrhaný drát v popředí (blíž ke kameře)
      propAt(P.broken, 120, 300, 3); propAt(P.broken2, 40, 312, 3); propAt(P.hog, 168, 318, 3);
      rain(t, 60, 0.22 + 0.15 * light);
    },
    stake(t, o = {}) {
      const { work, crawl2 } = setOf(o);
      g.drawImage(L.stake, 0, 0);
      // nový drát: od kůlu doprava se natahuje (3 prameny s ostny)
      const px = 112, base = 262;
      const grow = clamp01((t - 0.8) / 4.5);
      g.fillStyle = '#4a4f52';
      for (let k = 0; k < 3; k++) {
        for (let x = px; x < px + (W - px + 10) * grow; x++) {
          const y = base - 34 + k * 9 + Math.round(2 * Math.sin((x - px) / 24 * Math.PI));
          g.fillRect(x, y, 1, 1);
          if ((x + k) % 4 === 0) { g.fillRect(x, y - 1, 1, 1); g.fillRect(x, y + 1, 1, 1); }
        }
      }
      propAt(P.picket, px, base + 2, 3);
      propAt(P.picket, 172, base + 2, 3);
      // voják klečí a zatlouká kůl (nová animace work), za ním druhý se plazí se svitkem
      const cyc = (list, dt) => list[((Math.floor(t / dt) % list.length) + list.length) % list.length];
      if (crawl2.length) drawSp(cyc(crawl2, 0.14), -84 + t * 3, base - 138 + 4, 3); // stejné měřítko jako voják u kůlu (×3), plazí se za ním
      if (work.length) drawSp(cyc(work, 0.13), 84 - 96, base - 138 + 2, 3); // klečí, kladivo dopadá na kůl vpravo
      propAt(P.coil, 150, base + 14, 3);
      rain(t, 70, 0.28);
    },
  };
  return {
    canvas,
    draw(name, t, o) { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); scenes[name]?.(t, o); },
    strikeEvery: (anims.hegemony?.work?.east?.length || 9) * 0.13, // jeden úder kladiva na cyklus animace (zvuk)
  };
}
