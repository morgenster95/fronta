// Režim natáčení promo videí: /?reel=<scénář>&vacant=700 (jen vývojový server).
// Čas běží po snímcích (window.__reel.frame), takže nahrávání (tools/record-reel.mjs) je plynulé a přesné.
// Scénář = dráha kamery, titulky a události (výstřely, granáty, dávky) v sekundách.

const SCRIPTS = {
  // 1) upoutávka: atmosféra a výzva k naverbování
  teaser: ({ hx, hy, cx, cy, mid }) => ({
    seconds: 22,
    camera: [
      [0, hx - 200, mid, 1.5],
      [6, hx - 60, hy - 10, 3.0],
      [11, hx + 80, hy - 10, 3.4],
      [15, cx + 40, cy - 14, 3.4],
      [22, cx + 200, mid, 1.5],
    ],
    captions: [
      [0.5, 3.6, 'THE GREAT WAR ENDED.', 'big'],
      [3.8, 7, 'HERE, IT NEVER DID.', 'big'],
      [7.5, 11, 'EVERY FOLLOWER\nIS A SOLDIER.', 'big'],
      [11.3, 14.8, 'EVERY DAY\nTHE FRONT DECIDES.', 'big'],
      [15.2, 18.5, 'PICK A SIDE.', 'big'],
      [18.6, 22, 'COMMENT\nCONCORD  or  HEGEMONY\n@mudandiron', 'cta'],
    ],
    events: [
      [2.2, 'shell', 0], [5.5, 'shell', 1], [8.2, 'shoot', 0], [9.4, 'shoot', 0], [10.1, 'shell', 0, true],
      [12.0, 'shoot', 0], [12.6, 'shoot', 0], [13.3, 'shoot', 0], [16.0, 'shoot', 1], [16.8, 'shoot', 1],
      [17.4, 'shell', 1, true], [19.5, 'shell', 0], [20.6, 'shell', 1],
    ],
  }),
  // 2) vyber si stranu: Hegemonie zepředu, přes zemi nikoho, Concord zezadu
  sides: ({ hx, hy, cx, cy, mid }) => ({
    seconds: 18,
    camera: [
      [0, hx, hy - 10, 3.6],
      [6, hx + 60, hy - 6, 3.6],
      [9, (hx + cx) / 2, mid, 2.0],
      [12, cx - 40, cy - 14, 3.6],
      [18, cx + 40, cy - 14, 3.6],
    ],
    captions: [
      [0.4, 5.6, 'THE HEGEMONY\nIRON ENDURES.', 'heg'],
      [6.2, 8.8, 'BETWEEN THEM:\nSIX WINTERS OF MUD.', 'big'],
      [9.2, 14.2, 'THE CONCORD\nTOGETHER, OR NOT AT ALL.', 'con'],
      [14.6, 18, 'WHICH SIDE\nARE YOU ON?\nCOMMENT BELOW', 'cta'],
    ],
    events: [
      [1.2, 'shoot', 0], [2.4, 'shoot', 0], [3.1, 'shoot', 0], [4.5, 'shoot', 0], [7.2, 'shell', 0], [8.4, 'shell', 1],
      [10.5, 'shoot', 1], [11.6, 'shoot', 1], [12.8, 'shoot', 1], [13.7, 'shell', 1, true], [16.0, 'shoot', 1],
    ],
  }),
  // 4) nábor: prázdná stanoviště čekají na jména
  enlist: ({ hx, hy, cx, cy, mid }) => ({
    seconds: 18,
    camera: [
      [0, cx - 60, cy - 14, 4.6],
      [5, cx + 20, cy - 14, 4.6],
      [9, cx + 60, mid, 1.6],
      [13, hx + 40, hy - 10, 3.8],
      [18, hx - 40, hy - 10, 3.8],
    ],
    captions: [
      [0.4, 4.4, 'THIS RIFLE\nHAS NO NAME YET.', 'big'],
      [4.6, 8.6, 'THE FRONT NEEDS\nEVERY HAND.', 'big'],
      [9.0, 12.6, 'YOUR FRONT\nNEEDS YOU.', 'big'],
      [13.0, 18, 'ENLIST NOW\nCOMMENT\nCONCORD or HEGEMONY\n@mudandiron', 'cta'],
    ],
    events: [[2.0, 'shoot', 1], [3.2, 'shoot', 1], [6.4, 'shell', 1], [10.4, 'shell', 0, true], [14.0, 'shoot', 0], [15.2, 'shoot', 0], [16.6, 'shoot', 0]],
  }),
  // 3) jak se přidat: vyber stranu, napiš komentář, najdi se na frontě
  howto: ({ hx, hy, cx, cy, mid }) => ({
    seconds: 16,
    camera: [
      [0, cx - 120, mid + 60, 2.2],
      [5, cx - 30, cy - 14, 3.2],
      [10, cx, cy - 14, 4.4],
      [16, cx + 30, cy - 14, 4.4],
    ],
    captions: [
      [0.3, 3.8, '1. FOLLOW\n@mudandiron', 'big'],
      [4.0, 8.2, '2. COMMENT YOUR SIDE\nUNDER THE PINNED REEL\nCONCORD / HEGEMONY', 'big'],
      [8.4, 12.6, '3. YOUR SOLDIER\nTAKES A POST\nON THE FRONT', 'big'],
      [12.8, 16, 'FIND YOURSELF\nLINK IN BIO', 'cta'],
    ],
    events: [[2.0, 'shell', 1], [6.0, 'shoot', 1], [7.0, 'shoot', 1], [11.0, 'shoot', 1], [13.5, 'shell', 1]],
    select: 9.0, // otevře kartu volného stanoviště uprostřed záběru
  }),
};

const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function startReel({ name, app, cam, life, map, theme, soldiers, ui, tick, tex, anims, select, hospitals }) {
  if (name === 'cine') {
    // samostatné filmové záběry (cinema-race.js): náhled a natáčení tools/render-cine.mjs
    return import('./reel-cine.js').then(({ startCineReel }) => startCineReel({ tex, anims }));
  }
  if (name === 'news') {
    // novinky na frontě: palba, role, XP, obvaziště, hlasování, rod, žebříčky (reel-news.js)
    return import('./reel-news.js').then(async ({ startNewsReel }) => {
      await startNewsReel({ cam, life, map, theme, soldiers, tex, anims, hospitals });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'barrage') {
    // noční bombardování + závod o kótu: kdo ji dobude, dostane dělostřelectvo (reel-barrage.js)
    return import('./reel-barrage.js').then(async ({ startBarrageReel }) => {
      await startBarrageReel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'claim') {
    // návod: jak claimnout vojáka + co umí claimnutý voják (reel-claim.js)
    return import('./reel-claim.js').then(({ startClaimReel }) => startClaimReel({ theme, tex, anims }));
  }
  if (name === 'rip') {
    // první padlí bombardování: hroby, vojáci před nimi, v dálce výbuchy (reel-rip.js)
    return import('./reel-rip.js').then(({ startRipReel }) => startRipReel({ theme, tex, anims }));
  }
  if (name === 'ridge') {
    // závod o kótu rozhodnut: nábor, hrdina s medailí, dialog vojáků, bombardování, hlas hráče (reel-ridge.js)
    return import('./reel-ridge.js').then(({ startRidgeReel }) => {
      startRidgeReel({ cam, life, map, theme, soldiers, tex, anims });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (/^day\d+$/.test(name) && name !== 'day1') {
    // denní reel „co se stalo“ z podkladů tools/day-reel.mjs (reel-daily.js)
    return import('./reel-daily.js').then(({ startDailyReel }) => {
      startDailyReel({ name, cam, life, map, theme, soldiers, tex, anims, hospitals });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'day1') {
    // den 1: filmové záběry, závod o kótu, noviny (reel-day1.js)
    return import('./reel-day1.js').then(({ startDay1Reel }) => {
      startDay1Reel({ cam, life, map, theme, soldiers, tex, anims, select });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  if (name === 'story') {
    // příběhové video má vlastní scénář s překryvy (reel-story.js)
    return import('./reel-story.js').then(({ startStoryReel }) => {
      startStoryReel({ cam, life, map, theme, soldiers, tex, anims, select });
      const frame = window.__reel.frame;
      window.__reel.frame = (t) => { frame(t); tick(t * 1000); };
    });
  }
  const T = map.tile;
  const pick = (f) => soldiers.filter((s) => s.faction === f && s.slot?.line === 'front').sort((a, b) => a.x - b.x);
  const hs = pick(0), cs = pick(1);
  const anchor = {
    hx: hs[Math.floor(hs.length / 2)]?.x ?? map.slots[0][0].x,
    hy: hs[Math.floor(hs.length / 2)]?.y ?? map.slots[0][0].y,
    cx: cs[Math.floor(cs.length / 2)]?.x ?? map.slots[1][0].x,
    cy: cs[Math.floor(cs.length / 2)]?.y ?? map.slots[1][0].y,
    mid: ((map.front[0] + map.front[1]) / 2) * T + 16,
  };
  const sc = SCRIPTS[name]?.(anchor);
  if (!sc) throw new Error(`reel: neznámý scénář ${name}`);

  // skrýt herní UI, přidat titulky
  document.body.classList.add('reel');
  const cap = document.createElement('div');
  cap.id = 'reel-caption';
  document.body.appendChild(cap);
  const fired = new Set();
  let selected = false;

  function camAt(t) {
    const k = sc.camera;
    let i = 0;
    while (i < k.length - 2 && t > k[i + 1][0]) i++;
    const [t0, x0, y0, z0] = k[i], [t1, x1, y1, z1] = k[i + 1];
    const u = ease(Math.min(1, Math.max(0, (t - t0) / (t1 - t0))));
    return [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, z0 + (z1 - z0) * u];
  }

  function frame(t) {
    const [x, y, z] = camAt(t);
    cam.set(x, y, z);
    for (const [i, ev] of sc.events.entries()) {
      if (fired.has(i) || t < ev[0]) continue;
      fired.add(i);
      const [, kind, f, big] = ev;
      if (kind === 'shell') life.shell(x + (Math.random() - 0.5) * 260 / z, (f === 0 ? anchor.hy + 60 : anchor.cy - 70) + (Math.random() - 0.5) * 40, !!big);
      if (kind === 'shoot') {
        const vis = soldiers.filter((s) => s.faction === f && s.aim && Math.abs(s.x - x) < 200 / z * 2.5 && Math.abs(s.y - y) < 300 / z * 2.5);
        if (vis.length) life.debug.shoot([vis[Math.floor(Math.random() * vis.length)]]);
      }
    }
    if (sc.select && !selected && t >= sc.select) {
      selected = true;
      const near = soldiers.filter((s) => s.vacant && s.faction === 1).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
      if (near) ui.openSoldier(near, false);
    }
    const c = sc.captions.find(([a, b]) => t >= a && t < b);
    if (c) {
      const [a, b, text, style] = c;
      const fade = Math.min(1, (t - a) / 0.25, (b - t) / 0.25);
      cap.className = style;
      cap.style.opacity = fade;
      if (cap.dataset.text !== text) {
        cap.dataset.text = text;
        cap.innerHTML = text.split('\n').map((l) => `<span>${l.replace('&', '<i>&amp;</i>')}</span>`).join('');
      }
    } else cap.style.opacity = 0;
  }

  window.__reel = { seconds: sc.seconds, frame: (t) => { frame(t); tick(t * 1000); }, ready: true };
}

// pro tools/reel-audio (načasování zvuku podle scénáře)
export { SCRIPTS };
