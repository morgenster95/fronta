// Reel Dne 6 „noc wiring party“ (/?reel=night6&vacant=700, jen vývojový server): místo obvyklého denního reelu, protože hlavní událostí noci byla wiring party.
// Ve hře v noci skuteční dobrovolníci u drátu (marketing/reels/night6.volunteers.json, umístí je web/src/wire.js), počty po stranách,
// nová filmová scéna zblízka přes drát pod světlicí (cinema-wire.js flarewire), lístek se jmény zasažených (Gazette Dne 6),
// poslední granáty z Verdel Ridge na drát Hegemonie, krátké shrnutí (ztráty, Hill 304, počet vojáků) a výzva.
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, slam, clamp01, win, typed, easeOut } from './reel-kit.js';
import script from '../../marketing/reels/night6.script.json';
import { makeWireScenes } from './cinema-wire.js';

const files = import.meta.glob('../../marketing/reels/night6.vo.json', { eager: true, import: 'default' });

// výsledky noci a dne (Gazette Dne 6, 14. 11. 2026)
const N = { out: [35, 32], yards: [577, 482], hitWire: 16, names: ['Isidor Szymanski', 'Otto Jacob', 'Konrad Danielmcmena', 'Bastian Enjoyer', 'Albin Prokes', 'Severin Heheheha',
  'Otto Elitecelebs', 'Viktor Ssprinklez', 'Rafael Helldiver', 'Ivo Beck', 'Cyril Latsch', 'Zeno Cubes', 'Otto Alexanderbat', 'Felix Singh', 'Konrad Someonenamed', 'Oskar Davis'],
  hit: [55, 16], fell: [9, 0], wire: [22, 77], race: [97, 79], army: [191, 179] };

const CSS = `${BASE}${FX_CSS}
#rn-cine { inset: 0; width: 100%; height: 100%; image-rendering: pixelated; }
#rn-night { inset: 0; background: rgba(14, 18, 48, 0.62); mix-blend-mode: multiply; }
#rn-title { left: 0; right: 0; top: 23%; text-align: center; }
#rn-title .a { font-family: 'Silkscreen', monospace; font-size: 24px; color: #d98f3f; letter-spacing: 0.12em; text-shadow: 3px 3px 0 #0e0d0c; min-height: 30px; }
#rn-title .b { font-family: 'Silkscreen', monospace; font-size: 54px; line-height: 1.05; text-shadow: 4px 4px 0 #0e0d0c; min-height: 58px; }
.rn-panel { left: 7%; right: 7%; background: rgba(14,13,12,0.9); border: 3px solid #524a3f; padding: 14px 16px; }
.rn-panel .t { font-family: 'Silkscreen', monospace; font-size: 20px; color: #d98f3f; text-align: center; letter-spacing: 0.08em; margin-bottom: 8px; }
.rn-panel .row { display: flex; justify-content: space-between; align-items: baseline; font-family: 'Silkscreen', monospace; font-size: 22px; margin: 6px 0; }
.rn-panel .row b { font-size: 40px; font-weight: 400; }
.rn-panel .row span.m { font-family: 'VT323', monospace; font-size: 24px; color: #c9b99a; }
#rn-sides { top: 15%; } #rn-count { top: 28%; } #rn-race { top: 30%; } #rn-army { top: 30%; }
#rn-names { left: 9%; right: 9%; top: 18%; background: #c4b8a0; color: #1c1a17; padding: 14px 16px; box-shadow: 0 8px 0 rgba(0,0,0,0.5); transform: rotate(-1.2deg); }
#rn-names .t { font-family: 'Silkscreen', monospace; font-size: 18px; color: #7e3b2a; letter-spacing: 0.06em; border-bottom: 2px solid #7e3b2a; padding-bottom: 4px; margin-bottom: 6px; }
#rn-names .l { columns: 2; column-gap: 14px; font-family: 'VT323', monospace; font-size: 22px; line-height: 1.05; }
#rn-names .l div { opacity: 0; }
#rn-stamp { left: 0; right: 0; top: 30%; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; }
#rn-stamp span { font-family: 'Silkscreen', monospace; font-size: 40px; line-height: 1.05; background: rgba(126, 59, 42, 0.95); padding: 6px 14px; text-shadow: 3px 3px 0 #0e0d0c; }
#rn-stamp span + span { font-size: 26px; background: rgba(14, 13, 12, 0.85); }
.rn-bar { height: 22px; background: #1c1a17; border: 2px solid #524a3f; position: relative; margin-bottom: 8px; } .rn-bar i { position: absolute; left: 0; top: 0; bottom: 0; width: 0; }
`;

export async function startNightReel({ cam, life, map, theme, soldiers, tex, anims }) {
  let vo = files['../../marketing/reels/night6.vo.json'];
  if (!vo) {
    let c = 0;
    vo = { lines: script.lines.map(([at, text, id]) => { const s = Math.max(at, c), d = text.length / 15 + 0.2; c = s + d + 0.25; return [s, d, text, id]; }) };
    vo.seconds = c + 3.2;
  }
  const C = cues(vo);
  const at = C.at, END = vo.seconds;
  const T = map.tile;
  const lineY = (f) => map.front[f] * T + 16;
  const vols = (f) => soldiers.filter((s) => s.faction === f && s.onWire).sort((a, b) => a.x - b.x);
  const vH = vols(0), vC = vols(1);
  const pickMid = (l, f) => l[Math.floor(l.length / 2)] || soldiers.find((s) => s.faction === f && s.slot?.line === 'front');
  const mH = pickMid(vH, 0), mC = pickMid(vC, 1);
  const tHook = at('hook'), tSides = at('sides'), tFlare = at('flare'), tNames = at('names'), tShells = at('shells'), tWithout = at('without'), tCount = at('count'), tRace = at('race'), tCta = at('cta'), tLogo = at('cta2');
  const mid = ((map.front[0] + map.front[1]) / 2) * T;
  const K = [[0, mH.x - 70, mH.y + 6, 4.0], [tSides - 0.01, mH.x + 50, mH.y + 6, 4.5]];
  K.push([tSides, mC.x + 60, mC.y - 22, 3.4, 'cut'], [tFlare - 0.01, mC.x - 40, mC.y - 22, 3.8]); // kamera výš nad drátem: panel nahoře nezakryje vojáky
  K.push([tShells, mH.x - 120, (mH.y + lineY(0)) / 2, 2.2, 'cut'], [tWithout - 0.01, mH.x + 40, (mH.y + lineY(0)) / 2, 2.6]);
  K.push([tWithout, mH.x + 60, mH.y - 4, 3.2, 'cut'], [tCount - 0.01, mH.x + 140, mH.y - 4, 3.4]);
  K.push([tCount, mH.x - 200, mid, 1.2, 'cut'], [tRace - 0.01, mH.x + 100, mid, 1.3]);
  K.push([tRace, mH.x, lineY(0) - 30, 1.8, 'cut'], [tCta - 0.01, mH.x + 200, lineY(0) - 30, 2.0]);
  K.push([tCta, mH.x - 100, mid, 1.15, 'cut'], [END, mH.x + 200, mid, 1.25]);
  const camAt = camPath(K);
  const sub = subtitles(vo);
  const cineOn = (t) => t >= tFlare && t < tShells;
  const fx = transitions([[tSides, 'whip'], [tFlare, 'flash'], [tShells, 'flash'], [tWithout, 'whip'], [tCount, 'black', 0.35], [tRace, 'black', 0.3], [tCta, 'black', 0.35]]);

  // poslední granáty na drát Hegemonie (jen ve větách shells/without)
  const SHELLS = [];
  let sd = 77; const R = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  for (let t = tShells + 0.2; t < tCount - 0.4; t += 0.18 + R() * 0.25) SHELLS.push([t, mH.x + (R() - 0.5) * 360, lineY(0) + 50 + R() * 50, R() < 0.35]);
  const SFX = [];
  for (const [ts, , , big] of SHELLS) SFX.push([+ts.toFixed(2), 'boomv', big ? 0.5 : 0.3]);
  for (let t = tFlare + 1.1; t < tNames + 0.8; t += 0.6) SFX.push([+t.toFixed(2), 'shoot', 0]);
  SFX.push([tHook + 0.4, 'type', 0.6], [tNames + 0.2, 'stamp', 0], [tCount, 'drum', 0], [END - 1.6, 'end', 0]);

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  const bar = (v, max, c) => `<div class="rn-bar"><i style="background:${c}" data-w="${Math.min(100, (v / max) * 100)}"></i></div>`;
  root.innerHTML = `
    <div id="rn-night"></div>
    <div id="rn-title"><div class="a"></div><div class="b"></div></div>
    <div id="rn-sides" class="rn-panel"><div class="t">LAST NIGHT ON THE WIRE</div>
      <div class="row"><span>HEGEMONY</span><b class="c" data-v="${N.out[0]}">0</b></div><div class="row"><span class="m">volunteers · ${N.yards[0]} yards of wire</span></div>
      <div class="row"><span>CONCORD</span><b class="c" data-v="${N.out[1]}">0</b></div><div class="row"><span class="m">volunteers · ${N.yards[1]} yards of wire</span></div></div>
    <div id="rn-names"><div class="t">CAUGHT IN THE FLARES · DAY 6</div><div class="l">${N.names.map((n) => `<div>✚ ${n}</div>`).join('')}</div></div>
    <div id="rn-stamp"><span>HEGEMONY WIRE<br>${N.wire[0]}% LEFT</span><span>WITHOUT THE WIRING PARTIES: 9%</span></div>
    <div id="rn-count" class="rn-panel"><div class="t">DAY 6 · BY MORNING</div>
      <div class="row"><span>HIT</span><b>${N.hit[0] + N.hit[1]}</b></div><div class="row"><span class="m">Hegemony ${N.hit[0]} · Concord ${N.hit[1]}</span></div>
      <div class="row"><span>FALLEN</span><b>${N.fell[0] + N.fell[1]}</b></div><div class="row"><span class="m">all of them Hegemony</span></div></div>
    <div id="rn-race" class="rn-panel"><div class="t">THE RACE FOR HILL 304</div>
      <div class="row"><span>HEGEMONY</span><b>${N.race[0]}</b></div>${bar(N.race[0], 100, '#8f8a82')}
      <div class="row"><span>CONCORD</span><b>${N.race[1]}</b></div>${bar(N.race[1], 100, '#8a8a52')}
      <div class="row"><span class="m">first to 100 takes the hill · 3 more</span></div></div>
    <div id="rn-army" class="rn-panel"><div class="t">ON THE FRONT NOW</div><div class="row"><span>SOLDIERS</span><b>${N.army[0] + N.army[1]}</b></div>
      <div class="row"><span class="m">Hegemony ${N.army[0]} · Concord ${N.army[1]}</span></div><div class="row"><span class="m">comment CONCORD or HEGEMONY</span></div></div>
    <div id="rd-big"></div>
    <div id="rd-sub"></div>
  `;
  document.body.appendChild(root);
  const cine = makeWireScenes(tex, anims);
  cine.canvas.id = 'rn-cine';
  root.prepend(cine.canvas);
  const paint = fxLayers(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };

  let si = 0;
  function frame(t) {
    const f = fx(t);
    for (const q of soldiers) if (q.vacant && q.sprite && q.sprite.alpha < 1) { q.sprite.alpha = 1; q.sprite.tint = [0xffffff, 0xf0ece4, 0xe6e2da, 0xfff4e8][q.variant % 4]; }
    const [x, y, z] = camAt(t);
    cam.set(x, y, z * (1 + 0.03 * f.punch));
    while (si < SHELLS.length && SHELLS[si][0] <= t) { const [, sx, sy, big] = SHELLS[si++]; life.shell(sx, sy, big); }
    // dobrovolníci jen v noci (do světlice); pak se vrátili do zákopů
    for (const q of [...vH, ...vC]) if (q.sprite) q.sprite.visible = t < tShells;
    if (cineOn(t)) cine.draw('flarewire', t - tFlare, { side: 'hegemony' });
    show('#rn-cine', cineOn(t) ? 1 : 0);
    show('#rn-night', !cineOn(t) ? (t < tShells ? 0.3 : t < tCount ? 0.3 : 0.15) : 0);
    paint({ ...f, black: Math.max(f.black, t < 0.3 ? 1 - t / 0.3 : 0, t > END - 0.6 ? clamp01((t - END + 0.6) / 0.5) : 0) });

    show('#rn-title', win(t, 0.4, tSides - 0.1, 0.25));
    $('#rn-title .a').textContent = typed('DAY 6 · NO MAN\'S LAND', t, 0.5, 24);
    $('#rn-title .b').textContent = typed('THE WIRING PARTY', t, 1.1, 14);
    show('#rn-sides', win(t, tSides + 0.15, tFlare - 0.05, 0.2));
    const su = easeOut(clamp01((t - tSides - 0.3) / 1.6));
    root.querySelectorAll('#rn-sides .c').forEach((el) => (el.textContent = Math.round(Number(el.dataset.v) * su)));
    show('#rn-names', win(t, tNames, tShells - 0.05, 0.2));
    root.querySelectorAll('#rn-names .l div').forEach((el, i) => (el.style.opacity = t > tNames + 0.15 + i * 0.12 ? 1 : 0));
    slam($('#rn-stamp'), t, tWithout + 0.1, tCount - 0.05, 1.4, -3);
    show('#rn-count', win(t, tCount + 0.15, tRace - 0.05, 0.2));
    show('#rn-race', win(t, tRace + 0.15, tCta - 0.05, 0.2));
    const ru = easeOut(clamp01((t - tRace - 0.3) / 1.4));
    root.querySelectorAll('#rn-race i').forEach((el) => (el.style.width = `${Number(el.dataset.w) * ru}%`));
    show('#rn-army', win(t, tCta + 0.15, tLogo - 0.05, 0.2));
    const logo = t >= tLogo;
    const bigEl = $('#rd-big');
    bigEl.style.opacity = logo ? Math.min(1, (t - tLogo) / 0.3) : 0;
    if (logo && !bigEl.dataset.on) { bigEl.dataset.on = 1; bigEl.className = 'logo'; bigEl.innerHTML = '<span>MUD <i>&amp;</i> IRON</span><span>@mudandiron · link in bio</span>'; }
    const s = sub(t);
    const subEl = $('#rd-sub');
    if (s && !logo) {
      subEl.style.opacity = 1;
      subEl.style.top = cineOn(t) || t < tSides ? '13%' : '72%';
      if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; }
    } else subEl.style.opacity = 0;
  }

  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
