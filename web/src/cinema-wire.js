// Filmové záběry k reelu „wiring party“ (mřížka 180×320, paleta hry, dithering, skutečné sprity a NOVÉ animace z PixelLabu):
//   nml   – noc v zemi nikoho: tři vojáci se plazí k potrhanému drátu; s volbou flareAt vystoupá světlice a vojáci se přitisknou k zemi
//   stake – detail: voják klečí a zatlouká kůl, vedle svitek drátu, nový drát se natahuje od kůlu
// Použití: const c = makeWireScenes(tex, anims); root.prepend(c.canvas); c.draw('nml', t, { flareAt: 1.2 });
import { sky, glow, lit, stakeWire, blast, clamp01, CW as W, CH as H } from './cinema.js';

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
  const P = { tree: img('/assets/props/observation_tree.png'), coil: img('/assets/props/wire_coil_0.png'), picket: img('/assets/props/screw_picket_0.png'), broken: img('/assets/props/wire_broken_0.png'), broken2: img('/assets/props/wire_broken_3.png'), hog: img('/assets/props/hedgehog_1.png') };

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

  {
    // svítání nad Hill 304: nebe do teplé, vrchol kopce vlevo, v dálce val nepřítele (pozorovací strom)
    const c = off(W, H), cg = c.getContext('2d');
    sky(cg, 0, 200, ['#141a30', '#2a2c48', '#5a4458', '#a0644c', '#d8925a', '#ecb878']);
    cg.fillStyle = '#2a2220';
    for (let x = 0; x < W; x++) cg.fillRect(x, Math.round(176 + 3 * Math.sin(x * 0.05 + 2)), 1, 30); // vzdálená země
    cg.fillStyle = '#1e1816';
    for (let x = 4; x < W; x += 9) cg.fillRect(x, 174 + (x % 3), 8, 3); // val nepřítele na obzoru
    for (let x = 0; x < W; x++) { cg.fillStyle = '#231c1a'; cg.fillRect(x, Math.round(214 - 34 * Math.exp(-(((x - 40) / 70) ** 2))), 1, 140); } // svah kopce
    sky(cg, 236, H, ['#2a221e', '#30271f', '#362b22']);
    L.tree = c;
  }
  // útok na továrnu na kopci (Hill 304): běh (run east), hod granátem (grenade east), pád obránce (concord die west); všichni ×2
  const ASSAULT = {
    run: frames(anims.hegemony?.run?.east, 'rgba(60,30,20,0.18)'),
    nade: frames(anims.hegemony?.grenade?.east, 'rgba(60,30,20,0.18)'),
    duck: frames(anims.hegemony?.duck?.east, 'rgba(60,30,20,0.18)'),
    foeDie: frames(anims.concord?.die?.west, 'rgba(60,30,20,0.25)'),
  };
  {
    const c = off(W, H), cg = c.getContext('2d');
    sky(cg, 0, 190, ['#1a1420', '#3a2230', '#6e3428', '#a8502c', '#d07a3c', '#e8a050']); // ráno v kouři a ohni
    cg.fillStyle = '#2a1c1c'; cg.fillRect(0, 186, W, H - 186); // celé pozadí neprůhledné (pod oblohou nesmí prosvítat hra)
    // vzdálené kopce
    cg.fillStyle = '#2a1c1c';
    for (let x = 0; x < W; x++) cg.fillRect(x, Math.round(168 + 8 * Math.sin(x * 0.03 + 1) + 3 * Math.sin(x * 0.11)), 1, 60);
    // svah: zleva dole (útočníci) doprava nahoru (továrna)
    const slope = (x) => Math.round(292 - x * 0.62);
    for (let x = 0; x < W; x++) { cg.fillStyle = '#2e2420'; cg.fillRect(x, slope(x), 1, H); cg.fillStyle = '#3d3028'; cg.fillRect(x, slope(x), 1, 2); }
    for (const [cx, rr] of [[30, 10], [74, 13], [118, 8], [146, 11]]) { const cy = slope(cx) + 8; cg.fillStyle = '#1c1614'; cg.beginPath(); cg.ellipse(cx, cy, rr, rr / 3.2, -0.55, 0, Math.PI * 2); cg.fill(); }
    // továrna na vrcholu: cihlové zdi s dírami, rozbitá střecha, komín
    const fx = 112, fb = slope(150) - 2;
    const brick = (x, y, w, h) => { for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) { const by_ = Math.floor(yy / 3), bx = Math.floor((xx + (by_ % 2) * 3) / 6); cg.fillStyle = (yy % 3 === 2 || (xx + (by_ % 2) * 3) % 6 === 5) ? '#2a1814' : (bx + by_) % 3 ? '#5c2a22' : '#6e3428'; cg.fillRect(x + xx, y + yy, 1, 1); } };
    brick(fx, fb - 46, 64, 46);
    cg.fillStyle = '#140e0c';
    for (const [wx, wy] of [[fx + 6, fb - 38], [fx + 22, fb - 38], [fx + 38, fb - 38], [fx + 54, fb - 38], [fx + 6, fb - 20], [fx + 38, fb - 20]]) cg.fillRect(wx, wy, 8, 10); // okna
    cg.fillRect(fx + 20, fb - 20, 12, 20); // vrata
    for (let x = fx - 2; x < fx + 66; x++) { const r = Math.abs(Math.sin(x * 0.7)) * 6 + (x > fx + 30 && x < fx + 46 ? 10 : 0); cg.fillStyle = '#1a1210'; cg.fillRect(x, fb - 46 - 6 + Math.round(r), 1, 6 - Math.round(Math.min(6, r))); } // rozbitá střecha
    brick(fx + 8, fb - 86, 9, 40); cg.fillStyle = '#140e0c'; cg.fillRect(fx + 8, fb - 88, 9, 2); // komín
    L.factory = c; L.fx = fx; L.fb = fb; L.slope = slope;
  }
  const spotN = (k) => lit(tex[`${k}_sniper`]?.south || tex[k]?.south, 'rgba(230,140,80,0.14)');
  const SPOT = { hegemony: spotN('hegemony'), concord: spotN('concord') };

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
    factory(t) {
      // Hegemonie dobývá továrnu na kopci: skupina běží zleva nahoru po svahu (všichni stejně velcí, ×2), výbuchy, záblesky z oken,
      // obránce v okně padá, jeden útočník hází granát, nakonec vlaje prapor Hegemonie na komíně
      g.drawImage(L.factory, 0, 0);
      const { fx, fb, slope } = L;
      // oheň a záře v oknech, záblesky výstřelů obránců do 3,5 s
      glow(g, fx + 32, fb - 24, 40, '#7e3b2a', 0.6 + 0.2 * Math.sin(t * 8));
      if (t < 3.5) for (const [wx, wy, ph] of [[fx + 10, fb - 33, 0], [fx + 42, fb - 33, 0.7], [fx + 58, fb - 33, 1.3]]) if (((t + ph) % 1.1) < 0.12) { g.fillStyle = '#fff2c0'; g.fillRect(wx - 3, wy, 3, 2); }
      // výbuchy na svahu
      for (const [bt, bx] of [[0.6, 70], [1.7, 120], [2.6, 40], [3.8, 96]]) blast(g, bx, slope(bx) - 2, t - bt, 0.7, ['#5c2a22', '#3a2622', '#241c1c', '#1c1816'], 0);
      // útočníci (pevný rozestup, stejná velikost)
      const SQUAD = [[6, 0], [-16, 0.3], [-38, 0.6], [-60, 0.15], [-82, 0.45], [-104, 0.75]];
      const K = 2, SPEED = 30;
      SQUAD.forEach(([x0, ph], i) => {
        const x = Math.min(fx - 18 - (i % 3) * 10, x0 + t * SPEED);
        const yFoot = slope(x + 16) + 1;
        const atWall = x >= fx - 18 - (i % 3) * 10 - 0.5;
        let fr;
        if (i === 1 && t > 2.2 && t < 3.3 && ASSAULT.nade.length) fr = ASSAULT.nade[Math.min(ASSAULT.nade.length - 1, Math.floor((t - 2.2) / 0.13))];
        else if (atWall && ASSAULT.duck.length) fr = ASSAULT.duck[0];
        else if (ASSAULT.run.length) fr = ASSAULT.run[((Math.floor((t + ph) / 0.1) % ASSAULT.run.length) + ASSAULT.run.length) % ASSAULT.run.length];
        if (fr) g.drawImage(fr, Math.round(x - (fr.width * K) / 2 + 16), Math.round(yFoot - fr.height * K + (fr.height - 32) * K / 2 + 2 * K), fr.width * K, fr.height * K);
      });
      // granát do okna → výbuch v továrně, obránce padá
      if (t > 3.1) blast(g, fx + 42, fb - 30, t - 3.1, 0.9, ['#d98f3f', '#7e3b2a', '#3a2622', '#241c1c'], 0);
      // (padající obránce vynechán: v okně by byl větší než útočníci; výbuch v okně stačí)
      // prapor Hegemonie na komíně od 4,3 s (vlaje)
      if (t > 5.4) {
        const px = fx + 12, py = fb - 104, w = 18, h = 10, up = clamp01((t - 5.4) / 0.6);
        g.fillStyle = '#0e0d0c'; g.fillRect(px, py + 2, 1, 18);
        for (let x = 0; x < w; x++) { const dy = Math.round(Math.sin(t * 5 + x * 0.5) * 1.5); g.fillStyle = x < 3 ? '#4a4f52' : '#666d70'; g.fillRect(px + 1 + x, py + 2 + dy + Math.round((1 - up) * 14), 1, h); }
        g.fillStyle = '#8a9295'; g.fillRect(px + 6, py + 6 + Math.round((1 - up) * 14), 6, 2);
      }
      // kouř a popel
      g.fillStyle = 'rgba(30,24,22,0.5)';
      for (let i = 0; i < 18; i++) { const x = ((i * 53 + t * 9) % (W + 30)) - 15, y = 120 + ((i * 37) % 120) - t * 4; g.fillRect(Math.round(x), Math.round(y), 2, 2); }
    },
    tree(t, o = {}) {
      // pozorovací strom na vrcholu: zvětšený ×4, pozorovatel u paty kouká k nepříteli, telefonní drát dolů ze svahu, vítr cuchá trávu
      g.drawImage(L.tree, 0, 0);
      glow(g, 150, 150, 70, '#e8a060', 0.6, 0.8);
      const k = 4, tx = 64, base = 236;
      // telefonní drát: od stromu doleva dolů ze svahu
      g.fillStyle = '#120e0c';
      for (let x = tx - 6; x > -4; x -= 2) g.fillRect(x, Math.round(base - 6 + (tx - x) * 0.35 + Math.sin(x / 7) * 1.5), 2, 1);
      propAt(P.tree, tx, base + 4, k);
      const sp = SPOT[o.side === 1 ? 'concord' : 'hegemony'];
      if (sp) drawSp(sp, tx + 24, base - 30 * 3 + 6, 3);
      // záblesk dalekohledu (každé ~2 s)
      if (Math.floor(t / 2) % 2 === 0 && (t % 2) < 0.25) { g.fillStyle = '#fff6dc'; g.fillRect(tx + 24 + 44, base - 78, 2, 1); }
      // zrnka prachu ve vzduchu
      g.fillStyle = 'rgba(236,184,120,0.5)';
      for (let i = 0; i < 26; i++) { const x = ((i * 47 + t * (6 + (i % 5))) % (W + 20)) - 10, y = 60 + ((i * 83) % 160) + Math.sin(t + i) * 3; g.fillRect(Math.round(x), Math.round(y), 1, 1); }
    },
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
