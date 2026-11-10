// Reel „barrage“ (/?reel=barrage&vacant=700, jen vývojový server): hustá palba přímo ve hře, skuteční hráči padají raněni vedle dopadů,
// filmové noční záběry (v záblesku granátu letí vzduchem siluety vojáků), stav závodu o kótu a výzva: kdo dobude kótu, dostane dělostřelectvo.
// Hlas: marketing/reels/barrage.script.json (auto časování), střihy podle začátků vět v barrage.vo.json.
import { makeCinema, CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, tagAt, slam, easeOut, clamp01, win, typed } from './reel-kit.js';
import script from '../../marketing/reels/barrage.script.json';
import { makeScenes, CINEMA_CSS } from './cinema.js';

const files = import.meta.glob('../../marketing/reels/barrage.vo.json', { eager: true, import: 'default' });

const CSS = `${BASE}${FX_CSS}${CINEMA_CSS}
#rb-night { inset: 0; background: rgba(18, 22, 52, 0.5); mix-blend-mode: multiply; }
#rb-fire { inset: 0; background: radial-gradient(ellipse at 50% 60%, rgba(217,143,63,0.55), rgba(126,59,42,0.25) 45%, rgba(0,0,0,0) 75%); mix-blend-mode: screen; }
#rb-title { left: 0; right: 0; top: 27%; text-align: center; }
#rb-title .a { font-family: 'Silkscreen', monospace; font-size: 28px; color: #d98f3f; letter-spacing: 0.12em; text-shadow: 3px 3px 0 #0e0d0c; min-height: 34px; }
#rb-title .b { font-family: 'Silkscreen', monospace; font-size: 60px; line-height: 1.05; text-shadow: 4px 4px 0 #0e0d0c; min-height: 64px; }
.rb-tag { position: absolute; transform: translate(-50%, -100%); font-family: 'Silkscreen', monospace; font-size: 20px; background: rgba(126, 59, 42, 0.95);
  padding: 3px 9px; white-space: nowrap; text-shadow: 2px 2px 0 #0e0d0c; }
.rb-tag span { display: block; font-family: 'VT323', monospace; font-size: 20px; color: #f0d8b8; }
#rb-race { left: 7%; right: 7%; top: 40%; }
#rb-race .t { font-family: 'Silkscreen', monospace; font-size: 24px; margin-bottom: 10px; text-align: center; }
#rb-race .row { margin: 10px 0; }
#rb-race .n { display: flex; justify-content: space-between; font-family: 'Silkscreen', monospace; font-size: 22px; margin-bottom: 4px; }
#rb-race .bar { height: 26px; background: #1c1a17; border: 2px solid #524a3f; position: relative; }
#rb-race .bar i { position: absolute; left: 0; top: 0; bottom: 0; }
#rb-race .goal { font-family: 'VT323', monospace; font-size: 24px; color: #c9b99a; text-align: center; margin-top: 8px; }
#rb-reward { left: 0; right: 0; top: 34%; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; }
#rb-reward span { font-family: 'Silkscreen', monospace; font-size: 44px; line-height: 1.05; background: rgba(126, 59, 42, 0.95); padding: 6px 14px; text-shadow: 3px 3px 0 #0e0d0c; }
#rb-reward span + span { font-size: 30px; background: rgba(14, 13, 12, 0.85); }
#rb-ask { left: 0; right: 0; top: 36%; text-align: center; }
#rb-ask span { display: inline-block; font-family: 'Silkscreen', monospace; font-size: 46px; line-height: 1.1; background: rgba(14, 13, 12, 0.85); padding: 6px 14px; text-shadow: 3px 3px 0 #0e0d0c; }
#rb-cta { left: 0; right: 0; top: 58%; text-align: center; }
#rb-cta span { display: inline-block; font-family: 'Silkscreen', monospace; font-size: 24px; background: rgba(126, 59, 42, 0.95); padding: 6px 14px; text-shadow: 3px 3px 0 #0e0d0c; }
`;

// deterministická náhoda (každé natočení stejné)
function rng(seed) { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

export async function startBarrageReel({ cam, life, map, theme, soldiers, tex, anims }) {
  let vo = files['../../marketing/reels/barrage.vo.json'];
  if (!vo) { // bez hlasu (náhled): odhad délky vět
    let c = 0;
    vo = { lines: script.lines.map(([at, text, id]) => { const s = Math.max(at, c), d = text.length / 15 + 0.2; c = s + d + 0.25; return [s, d, text, id]; }) };
    vo.seconds = c + 3.2;
  }
  const roster = await fetch('/data/roster.json').then((r) => r.json()).catch(() => ({}));
  const race = roster.race || { name: 'Verdel Ridge', need: 100, counts: [0, 0] };
  const C = cues(vo);
  const at = C.at, END = vo.seconds;
  const T = map.tile;
  const R = rng(304);
  const short = (f) => theme.factions[f].name.replace(/^The /, '');
  const front = (f) => soldiers.filter((s) => s.faction === f && s.slot?.line === 'front').sort((a, b) => a.x - b.x);
  const real = (f) => front(f).filter((s) => s.handle && !s.vacant && !s.hosp && s.status !== 1);
  const midOf = (list) => list[Math.floor(list.length / 2)] || map.slots[0][0];
  const mid = ((map.front[0] + map.front[1]) / 2) * T + 16;
  const aim = (s, z) => [s.x, s.y - 14 + 58 / z, z];
  // vede ten, kdo má víc; bombarduje se hlavně linie toho, kdo prohrává (výzva: dožeňte to)
  const lead = race.counts[1] >= race.counts[0] ? 1 : 0, trail = 1 - lead;
  const heroes = [real(trail)[Math.floor(real(trail).length * 0.4)], real(lead)[Math.floor(real(lead).length * 0.55)], real(trail)[Math.floor(real(trail).length * 0.7)]].filter(Boolean);
  const A = midOf(front(trail)), B = midOf(front(lead));

  // --- kamera ---
  const tF = at('fall'), tC = at('cine'), tR = at('race'), tW = at('reward'), tA = at('cta');
  const hero = heroes.map((s, i) => ({ s, t: tF + (C.len('fall') + 0.25) * (i / heroes.length) }));
  const K = [[0, A.x - 50, aim(A, 2.8)[1], 2.8], [tF - 0.01, A.x + 50, aim(A, 3.6)[1], 3.6]];
  for (const [i, h] of hero.entries()) {
    const next = hero[i + 1]?.t ?? tC;
    K.push([h.t, ...aim(h.s, 4.6), 'cut'], [next - 0.01, h.s.x + 12, aim(h.s, 5.0)[1], 5.0]);
  }
  K.push([tC, A.x, A.y, 3.0, 'cut'], [tR - 0.01, A.x, A.y, 3.0]);
  K.push([tR, (A.x + B.x) / 2 - 140, mid, 1.15, 'cut'], [tW - 0.01, (A.x + B.x) / 2 + 140, mid, 1.3]);
  K.push([tW, B.x - 100, B.y, 2.4, 'cut'], [tA - 0.01, B.x + 80, B.y, 2.9]);
  K.push([tA, B.x, B.y, 3.0, 'cut'], [END, B.x, B.y, 3.0]);
  const camAt = camPath(K);
  const sub = subtitles(vo);

  // --- palba ve hře: hustý déšť granátů kolem kamery, velké dopady vedle hrdinů ---
  const SHELLS = []; // [čas, x, y, velký]
  const rain = (t0, t1, cx, cy, spread, every) => { for (let t = t0; t < t1; t += every * (0.6 + R() * 0.8)) SHELLS.push([t, cx + (R() - 0.5) * spread, cy + (R() - 0.5) * spread * 0.7, R() < 0.3]); };
  const lineY = (f) => map.front[f] * T + 16;
  const toRear = (f) => (f === 0 ? -1 : 1);
  rain(0.2, tF, A.x, A.y + toRear(trail) * 10, 260, 0.13);
  for (const [i, h] of hero.entries()) {
    const next = hero[i + 1]?.t ?? tC;
    rain(h.t, next, h.s.x, h.s.y, 200, 0.28);
    SHELLS.push([h.t + 0.55, h.s.x + 18, h.s.y + toRear(h.s.faction) * 6, true]); // dopad hned vedle: voják padá
  }
  rain(tR, tW, (A.x + B.x) / 2, lineY(trail) + toRear(trail) * 10, 600, 0.07);
  rain(tR, tW, (A.x + B.x) / 2, lineY(lead) + toRear(lead) * 10, 600, 0.12);
  rain(tW, tA, B.x, B.y, 340, 0.07); // „na nepřítele“: jedno peklo
  rain(tA, END - 0.8, B.x, B.y, 300, 0.22);
  SHELLS.sort((a, b) => a[0] - b[0]);
  const isGame = (t) => t < tC || (t >= tR && t < tA);

  // pády: snímky animace pádu frakce, pak leží
  const falls = hero.map((h) => ({ s: h.s, t: h.t + 0.6 }));
  // pár dalších raněných v záběrech na linie (blízko dopadů)
  for (const t of [1.6, 2.6, tR + 1.2, tW + 0.8, tW + 1.9]) {
    const f = t >= tW ? lead : trail;
    const pool = real(f).filter((s) => !falls.some((q) => q.s === s));
    if (pool.length) falls.push({ s: pool[Math.floor(R() * pool.length)], t });
  }

  const flashes = [...hero.map((h) => [h.t + 0.55, 'flash']), ...hero.map((h) => [h.t + 0.56, 'punch'])];
  const fx = transitions([
    ...flashes, [tF, 'flash'], ...hero.slice(1).map((h) => [h.t, 'whip']), [tC, 'flash'], [tR, 'black', 0.35], [tW, 'flash'], [tA, 'black', 0.4],
  ]);

  // --- zvuk ---
  // dunění jen u výbuchů, které jsou opravdu v obraze (hlasitost podle velikosti a vzdálenosti od středu), tlumeně pod hudbou
  const SFX = [];
  let lastS = -1;
  for (const [ts, sx, sy, big] of SHELLS) {
    if (!isGame(ts)) continue;
    const [cx, cy, cz] = camAt(ts);
    const dx = Math.abs(sx - cx) * cz / 270, dy = Math.abs(sy - cy) * cz / 480; // 1 = okraj obrazu
    if (dx > 1 || dy > 1) continue;
    const vol = (big ? 0.55 : 0.32) * (1 - 0.5 * Math.max(dx, dy));
    if (ts - lastS < 0.09 && !big) continue; // v hustém dešti nekupit zvuky přes sebe
    lastS = ts;
    SFX.push([ts, 'boomv', +vol.toFixed(2)]);
  }
  const NB = [0.25, 1.05, 1.6, 2.5, 3.1, 3.7, 4.5, 5.0, 5.8];
  const NK = [1.3, 0.9, 1.4, 1.0, 1.2, 1.5, 0.9, 1.3, 1.1];
  for (const [i, u] of NB.entries()) if (tC + u < tR) SFX.push([tC + u, 'boomv', +(0.35 * NK[i]).toFixed(2)]);
  for (const [i, u] of NB.entries()) if (tA + u < END - 1) SFX.push([tA + u, 'boomv', +(0.3 * NK[i]).toFixed(2)]);
  SFX.push([END - 2.2, 'bell', 0]);

  // --- DOM ---
  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  const col = (f) => (f === 0 ? '#8f8a82' : '#8a8a52');
  root.innerHTML = `
    <div id="rb-night"></div><div id="rb-fire"></div>
    <div id="rb-title"><div class="a"></div><div class="b"></div></div>
    ${hero.map((h, i) => `<div class="rb-tag" id="rb-tag${i}">@${h.s.handle}<span>${short(h.s.faction)} · WOUNDED</span></div>`).join('')}
    <div id="rb-race" class="panel"><div class="t">THE RACE FOR ${race.name.toUpperCase()}</div>
      ${[lead, trail].map((f) => `<div class="row"><div class="n"><span>${short(f).toUpperCase()}</span><span class="c" data-f="${f}">0</span></div>
        <div class="bar"><i data-f="${f}" style="background:${col(f)};width:0"></i></div></div>`).join('')}
      <div class="goal">first to ${race.need} soldiers takes the ridge</div></div>
    <div id="rb-reward"><span>THE WINNER<br>GETS THE GUNS</span><span>3 DAYS OF ARTILLERY<br>ON THE ENEMY</span></div>
    <div id="rb-ask"><span>WHO GETS<br>THE GUNS?</span></div>
    <div id="rd-big"></div>
    <div id="rb-cta"><span>COMMENT CONCORD or HEGEMONY</span></div>
    <div id="rd-sub"></div>
  `;
  document.body.appendChild(root);
  const cine = makeCinema(tex, anims);
  root.prepend(cine.canvas);
  const scenes = makeScenes(tex, anims);
  root.insertBefore(scenes.canvas, cine.canvas.nextSibling);
  const paint = fxLayers(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };
  show('#rd-cine', 0);

  const fired = new Set(), fell = new Set();
  let si = 0, lastBoom = -9;
  function frame(t) {
    const f = fx(t);
    // žádní „duchové“: neobsazená stanoviště ve videu v plných barvách jako skuteční vojáci
    for (const q of soldiers) if (q.vacant && q.sprite && q.sprite.alpha < 1) { q.sprite.alpha = 1; q.sprite.tint = [0xffffff, 0xf0ece4, 0xe6e2da, 0xfff4e8][q.variant % 4]; }
    const [x, y, z] = camAt(t);
    const boom = Math.exp(-(t - lastBoom) * 6);
    cam.set(x, y, z * (1 + 0.035 * f.punch));

    // granáty (jen ve hře; filmové záběry mají vlastní)
    while (si < SHELLS.length && SHELLS[si][0] <= t) {
      const [ts, sx, sy, big] = SHELLS[si++];
      if (!isGame(ts)) continue;
      life.shell(sx, sy, big);
      if (big && Math.abs(sx - x) < 200 / z && Math.abs(sy - y) < 320 / z) lastBoom = ts;
    }
    for (const [i, q] of falls.entries()) {
      if (t < q.t) continue;
      const fk = theme.factions[q.s.faction].sprite;
      const fr = anims[fk]?.fall?.south;
      const sp = q.s.sprite;
      if (!fr || !sp) continue;
      if (!fell.has(i)) { fell.add(i); q.s.wounded = true; q.s.action = null; sp.scale.x = 1; }
      sp.texture = fr[Math.min(fr.length - 1, Math.floor((t - q.t) / 0.09))];
    }

    // vrstvy: noční nádech ve hře, filmový záběr, záře výbuchů
    const cineOn = (t >= tC && t < tR) || t >= tA;
    if (cineOn) scenes.draw('nightshell', t - (t >= tA ? tA : tC));
    show('#rd-cine2', cineOn ? 1 : 0);
    show('#rb-night', !cineOn ? (t < tF ? 0.7 : 0.5) : 0);
    show('#rb-fire', !cineOn ? Math.min(1, 0.25 + 0.6 * boom + 0.12 * Math.sin(t * 9) ** 2) : 0);
    paint({ ...f, black: Math.max(f.black, t < 0.3 ? 1 - t / 0.3 : 0, t > END - 0.6 ? clamp01((t - END + 0.6) / 0.5) : 0) });

    show('#rb-title', win(t, 0.4, tF - 0.1, 0.25));
    $('#rb-title .a').textContent = typed(`NIGHT ${roster.day || 2} · THE FRONT`, t, 0.5, 24);
    $('#rb-title .b').textContent = typed(race.name.toUpperCase(), t, 1.2, 14);

    for (const [i, h] of hero.entries()) {
      const next = hero[i + 1]?.t ?? tC;
      tagAt($(`#rb-tag${i}`), h.s, cam, win(t, h.t + 0.75, next - 0.05, 0.12), 26);
    }

    show('#rb-race', win(t, tR + 0.2, tW - 0.05, 0.2));
    const ru = easeOut(clamp01((t - tR - 0.6) / 1.4));
    root.querySelectorAll('#rb-race .c').forEach((el) => (el.textContent = `${Math.round(race.counts[el.dataset.f] * ru)} / ${race.need}`));
    root.querySelectorAll('#rb-race i').forEach((el) => (el.style.width = `${Math.min(100, (race.counts[el.dataset.f] / race.need) * 100 * ru)}%`));
    slam($('#rb-reward'), t, tW + 0.15, tA - 0.05, 1.4, -4);

    const logo = t >= at('cta2');
    show('#rb-ask', win(t, tA + 0.3, at('cta2') - 0.05, 0.2));
    const bigEl = $('#rd-big');
    bigEl.style.opacity = logo ? Math.min(1, (t - at('cta2')) / 0.3) : 0;
    if (logo && !bigEl.dataset.on) { bigEl.dataset.on = 1; bigEl.className = 'logo'; bigEl.innerHTML = '<span>MUD <i>&amp;</i> IRON</span><span>@mudandiron · link in bio</span>'; }
    show('#rb-cta', win(t, at('cta2') + 0.4, END, 0.25));

    const s = sub(t);
    const subEl = $('#rd-sub');
    if (s && !logo) {
      subEl.style.opacity = 1;
      subEl.style.top = t >= tR && t < tA ? '10.5%' : '12%';
      if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; }
    } else subEl.style.opacity = 0;
  }

  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
