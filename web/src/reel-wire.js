// Reel „wiring party“ (/?reel=wire&vacant=700, jen vývojový server): co byla wiring party (historie: noc, tiché vrtací kůly, při světlici k zemi),
// filmové záběry s novými animacemi (plazení, přitisknutí k zemi, zatloukání kůlu), pak přímo ve hře: potrhaný drát Hegemonie pod granáty,
// dobrovolníci u drátu (web/src/wire.js; bez skutečných přihlášek ukáže náhledovou skupinu bez jmen), hlídka za parapetem a výzva WIRE.
// Hlas: marketing/reels/wire.script.json (auto časování), střihy podle začátků vět v wire.vo.json.
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, slam, clamp01, win, typed } from './reel-kit.js';
import script from '../../marketing/reels/wire.script.json';
import { makeScenes, CINEMA_CSS } from './cinema.js';
import { makeWireScenes } from './cinema-wire.js';

const files = import.meta.glob('../../marketing/reels/wire.vo.json', { eager: true, import: 'default' });

const CSS = `${BASE}${FX_CSS}${CINEMA_CSS}
#rw-cine { inset: 0; width: 100%; height: 100%; image-rendering: pixelated; }
#rw-night { inset: 0; background: rgba(18, 22, 52, 0.55); mix-blend-mode: multiply; }
#rw-title { left: 0; right: 0; top: 30%; text-align: center; }
#rw-title .a { font-family: 'Silkscreen', monospace; font-size: 24px; color: #d98f3f; letter-spacing: 0.12em; text-shadow: 3px 3px 0 #0e0d0c; min-height: 30px; }
#rw-title .b { font-family: 'Silkscreen', monospace; font-size: 58px; line-height: 1.05; text-shadow: 4px 4px 0 #0e0d0c; min-height: 62px; }
.rw-stamp { left: 0; right: 0; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; }
.rw-stamp span { font-family: 'Silkscreen', monospace; font-size: 40px; line-height: 1.05; background: rgba(126, 59, 42, 0.95); padding: 6px 14px; text-shadow: 3px 3px 0 #0e0d0c; }
.rw-stamp span + span { font-size: 26px; background: rgba(14, 13, 12, 0.85); }
#rw-wire { top: 30%; } #rw-both { top: 30%; } #rw-watch { top: 30%; }
#rw-cta { left: 0; right: 0; top: 33%; text-align: center; }
#rw-cta .k { display: inline-block; font-family: 'Silkscreen', monospace; font-size: 30px; color: #c9b99a; text-shadow: 3px 3px 0 #0e0d0c; }
#rw-cta .w { display: block; font-family: 'Silkscreen', monospace; font-size: 96px; line-height: 1; color: #e3d9c3; text-shadow: 5px 5px 0 #7e3b2a, 8px 8px 0 #0e0d0c; margin: 6px 0; }
#rw-cta .s { display: inline-block; font-family: 'VT323', monospace; font-size: 30px; background: rgba(14, 13, 12, 0.85); padding: 4px 12px; }
`;

function rng(seed) { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

export async function startWireReel({ cam, life, map, theme, soldiers, tex, anims }) {
  let vo = files['../../marketing/reels/wire.vo.json'];
  if (!vo) { // bez hlasu (náhled): odhad délky vět
    let c = 0;
    vo = { lines: script.lines.map(([at, text, id]) => { const s = Math.max(at, c), d = text.length / 15 + 0.2; c = s + d + 0.25; return [s, d, text, id]; }) };
    vo.seconds = c + 3.2;
  }
  const roster = await fetch('/data/roster.json').then((r) => r.json()).catch(() => ({}));
  const C = cues(vo);
  const at = C.at, END = vo.seconds;
  const T = map.tile;
  const R = rng(1916);
  const short = (f) => theme.factions[f].name.replace(/^The /, '');
  const toEnemy = (f) => (map.front[f] < map.front[1 - f] ? 1 : -1);
  const wireY = (f) => (map.front[f] + toEnemy(f) * 6 + 1) * T;
  const lineY = (f) => map.front[f] * T + 16;
  const front = (f) => soldiers.filter((s) => s.faction === f && s.slot?.line === 'front').sort((a, b) => a.x - b.x);
  const midX = (f) => { const l = front(f); return l[Math.floor(l.length / 2)]?.x ?? map.W * T / 2; };
  const vols = (f) => soldiers.filter((s) => s.faction === f && s.onWire).sort((a, b) => a.x - b.x);
  const hx = midX(0), cx = midX(1);
  const volH = vols(0), volC = vols(1);
  const vH = volH[Math.floor(volH.length / 2)] || { x: hx, y: wireY(0) }, vC = volC[Math.floor(volC.length / 2)] || { x: cx, y: wireY(1) };
  const hWire = roster.battle?.[0]?.wire;

  // --- časy (začátky vět) ---
  const tHook = at('hook'), tHist = at('hist'), tFlare = at('flare'), tBroken = at('broken'), tWhy = at('why'), tHow = at('how'), tRisk = at('risk'), tCta = at('cta'), tLogo = at('cta2');
  const tHow2 = tHow + (tRisk - tHow) * 0.55;
  const isCine = (t) => t < tBroken || (t >= tRisk && t < tCta);
  // --- kamera ve hře ---
  const K = [[0, hx, wireY(0), 3]];
  K.push([tBroken, hx - 160, wireY(0) - 10, 2.6, 'cut'], [tWhy - 0.01, hx + 120, wireY(0) - 6, 3.0]);
  K.push([tWhy, hx + 40, wireY(0) - 4, 4.2, 'cut'], [tHow - 0.01, hx + 70, wireY(0) - 4, 4.6]);
  K.push([tHow, vH.x - 30, vH.y - 10, 4.4, 'cut'], [tHow2 - 0.01, vH.x + 20, vH.y - 10, 4.8]);
  K.push([tHow2, vC.x + 30, vC.y - 10, 4.4, 'cut'], [tRisk - 0.01, vC.x - 20, vC.y - 10, 4.8]);
  K.push([tCta, vH.x - 60, vH.y - 4, 2.6, 'cut'], [END, vH.x + 40, vH.y - 4, 3.0]);
  const camAt = camPath(K);
  const sub = subtitles(vo);

  // granáty na linii Hegemonie (dělostřelectvo z Verdel Ridge), drát je v záběru
  const SHELLS = [];
  const rain = (t0, t1, x0, spread, every) => { for (let t = t0; t < t1; t += every * (0.6 + R() * 0.8)) SHELLS.push([t, x0 + (R() - 0.5) * spread, lineY(0) - toEnemy(0) * (6 + R() * 30), R() < 0.3]); };
  rain(tBroken + 0.2, tWhy, hx, 420, 0.22);
  rain(tWhy, tHow, hx + 60, 240, 0.45);
  SHELLS.sort((a, b) => a[0] - b[0]);

  const fx = transitions([[tHist, 'black', 0.3], [tFlare, 'black', 0.25], [tBroken, 'flash'], [tWhy, 'whip'], [tHow, 'black', 0.3], [tHow2, 'whip'], [tRisk, 'black', 0.3], [tCta, 'flash']]);

  // --- zvuk ---
  const cineW = makeWireScenes(tex, anims);
  const SFX = [];
  for (const [ts, sx, sy, big] of SHELLS) {
    const [qx, qy, qz] = camAt(ts);
    const dx = Math.abs(sx - qx) * qz / 270, dy = Math.abs(sy - qy) * qz / 480;
    if (dx > 1.2 || dy > 1.2) continue;
    SFX.push([ts, 'boomv', +((big ? 0.5 : 0.3) * (1 - 0.4 * Math.min(1, Math.max(dx, dy)))).toFixed(2)]);
  }
  for (let t = tHist + 0.9; t < tFlare - 0.2; t += cineW.strikeEvery) SFX.push([+t.toFixed(2), 'stamp', 0]); // údery kladiva na kůl
  SFX.push([tFlare + 0.25, 'shoot', 0]); // výstřel světlice
  SFX.push([tCta + 0.1, 'drum', 0]);
  SFX.push([END - 1.6, 'end', 0]);

  // --- DOM ---
  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  root.innerHTML = `
    <div id="rw-night"></div>
    <div id="rw-title"><div class="a"></div><div class="b"></div></div>
    <div id="rw-wire" class="rw-stamp"><span>${hWire != null ? `HEGEMONY WIRE<br>${Math.round(hWire * 100)}% LEFT` : 'HEGEMONY WIRE<br>TORN APART'}</span><span>SHELLED FROM VERDEL RIDGE</span></div>
    <div id="rw-both" class="rw-stamp"><span>BOTH SIDES<br>CAN GO</span><span>MEND YOUR OWN SECTOR</span></div>
    <div id="rw-watch" class="rw-stamp"><span>WHO STAYS<br>KEEPS WATCH</span><span>EVERY RIFLE ON THE PARAPET</span></div>
    <div id="rw-cta"><span class="k">COMMENT</span><span class="w">WIRE</span><span class="s">your soldier crawls out after dark</span></div>
    <div id="rd-big"></div>
    <div id="rd-sub"></div>
  `;
  document.body.appendChild(root);
  const scenes = makeScenes(tex, anims); // hlídka za parapetem pod světlicí
  root.prepend(scenes.canvas);
  root.prepend(cineW.canvas);
  const paint = fxLayers(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };

  let si = 0;
  function frame(t) {
    const f = fx(t);
    for (const q of soldiers) if (q.vacant && q.sprite && q.sprite.alpha < 1) { q.sprite.alpha = 1; q.sprite.tint = [0xffffff, 0xf0ece4, 0xe6e2da, 0xfff4e8][q.variant % 4]; }
    const [x, y, z] = camAt(t);
    cam.set(x, y, z * (1 + 0.03 * f.punch));
    for (const q of [...volH, ...volC]) if (q.sprite) q.sprite.visible = t >= tHow; // dobrovolníci až od věty „both sides can send…“
    while (si < SHELLS.length && SHELLS[si][0] <= t) { const [, sx, sy, big] = SHELLS[si++]; life.shell(sx, sy, big); }

    // filmové záběry: noc v zemi nikoho (hook), kůl (hist), světlice (flare), hlídka (risk)
    const wOn = t < tBroken, sOn = t >= tRisk && t < tCta;
    if (t < tHist) cineW.draw('nml', t - tHook);
    else if (t < tFlare) cineW.draw('stake', t - tHist);
    else if (t < tBroken) cineW.draw('nml', t - tFlare + 2.5, { flareAt: 2.7, side: 'concord' }); // světlice: Concord (strany se střídají po scénách, nikdy spolu)
    if (sOn) scenes.draw('flare', t - tRisk + 1.2);
    show('#rw-cine', wOn ? 1 : 0);
    show('#rd-cine2', sOn ? 1 : 0);
    show('#rw-night', !isCine(t) ? (t >= tHow ? 0.6 : 0.35) : 0);
    paint({ ...f, black: Math.max(f.black, t < 0.3 ? 1 - t / 0.3 : 0, t > END - 0.6 ? clamp01((t - END + 0.6) / 0.5) : 0) });

    show('#rw-title', win(t, 0.5, tHist - 0.1, 0.25));
    $('#rw-title .a').textContent = typed("NO MAN'S LAND · NIGHT", t, 0.6, 24);
    $('#rw-title .b').textContent = typed('WIRING PARTY', t, 1.3, 12);
    slam($('#rw-wire'), t, tBroken + 0.4, tWhy - 0.1, 1.4, -4);
    slam($('#rw-both'), t, tHow + 0.3, tHow2 - 0.1, 1.4, 3);
    slam($('#rw-watch'), t, tRisk + 0.6, tCta - 0.1, 1.4, -3);
    show('#rw-cta', win(t, tCta + 0.2, tLogo - 0.05, 0.2));
    const logo = t >= tLogo;
    const bigEl = $('#rd-big');
    bigEl.style.opacity = logo ? Math.min(1, (t - tLogo) / 0.3) : 0;
    if (logo && !bigEl.dataset.on) { bigEl.dataset.on = 1; bigEl.className = 'logo'; bigEl.innerHTML = '<span>MUD <i>&amp;</i> IRON</span><span>comment WIRE · @mudandiron</span>'; }

    const s = sub(t);
    const subEl = $('#rd-sub');
    if (s && !logo) {
      subEl.style.opacity = 1;
      subEl.style.top = t < tBroken ? (t < tHist ? '15%' : '13%') : t >= tCta ? '64%' : '69%'; // ve filmových záběrech nahoře (dole jsou vojáci)
      if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; }
    } else subEl.style.opacity = 0;
  }

  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
