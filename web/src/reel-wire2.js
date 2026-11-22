// Reel „WIRE před zimou“ (22. 11. 2026, /?reel=wire2&vacant=700, jen vývojový server), samostatná výzva k přihlášce WIRE (wiring party):
// filmové záběry (plazení k drátu, zatloukání kůlu, světlice: web/src/cinema-wire.js) → zasněžená mapa a potrhaný drát obou stran se stavem
// (marketing/reels/wire2.data.json) → proč na drátu záleží → riziko (hlídka za parapetem pod světlicí) → výzva COMMENT WIRE.
// Hlas: marketing/reels/wire2.script.json (auto časování).
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, slam, clamp01, win, typed } from './reel-kit.js';
import script from '../../marketing/reels/wire2.script.json';
import D from '../../marketing/reels/wire2.data.json';
import { makeScenes, CINEMA_CSS } from './cinema.js';
import { makeWireScenes } from './cinema-wire.js';

const files = import.meta.glob('../../marketing/reels/wire2.vo.json', { eager: true, import: 'default' });

const CSS = `${BASE}${FX_CSS}${CINEMA_CSS}
#rw-cine { inset: 0; width: 100%; height: 100%; image-rendering: pixelated; }
#rw-title { position: absolute; left: 0; right: 0; top: 50%; transform: translateY(-50%); text-align: center; padding: 28px 0;
  background: linear-gradient(180deg, rgba(14,13,12,0) 0%, rgba(14,13,12,0.6) 22%, rgba(14,13,12,0.6) 78%, rgba(14,13,12,0) 100%); opacity: 0; }
#rw-title .a { font-family: 'Silkscreen', monospace; font-size: 24px; color: #d98f3f; letter-spacing: 0.12em; text-shadow: 3px 3px 0 #0e0d0c; min-height: 30px; }
#rw-title .b { font-family: 'Silkscreen', monospace; font-size: 64px; line-height: 1.05; color: #e3d9c3; text-shadow: 4px 4px 0 #0e0d0c; min-height: 68px; }
.rw-panel { position: absolute; left: 7%; right: 7%; top: 8%; background: rgba(14,13,12,0.93); border: 3px solid #8a9295; padding: 14px 16px; opacity: 0; }
.rw-panel .t { font-family: 'Silkscreen', monospace; font-size: 22px; color: #d98f3f; text-align: center; letter-spacing: 0.08em; margin-bottom: 8px; }
.rw-panel .row { display: flex; justify-content: space-between; align-items: baseline; font-family: 'Silkscreen', monospace; font-size: 24px; color: #e3d9c3; margin: 4px 0; }
.rw-panel .row b { font-size: 44px; font-weight: 400; } .rw-panel .row b.r { color: #c8553d; }
.rw-panel .bar { height: 18px; background: #1c1a17; border: 2px solid #524a3f; position: relative; margin: 2px 0 8px; } .rw-panel .bar i { position: absolute; left: 0; top: 0; bottom: 0; }
.rw-panel .note { font-family: 'VT323', monospace; font-size: 30px; color: #c9b99a; text-align: center; margin-top: 4px; }
.rw-stamp { position: absolute; left: 0; right: 0; top: 30%; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; opacity: 0; }
.rw-stamp span { font-family: 'Silkscreen', monospace; font-size: 40px; line-height: 1.05; background: rgba(126, 59, 42, 0.95); padding: 6px 14px; text-shadow: 3px 3px 0 #0e0d0c; }
.rw-stamp span + span { font-size: 26px; background: rgba(14, 13, 12, 0.85); }
#rw-cta { position: absolute; left: 0; right: 0; top: 40%; text-align: center; opacity: 0; }
#rw-cta .k { display: inline-block; font-family: 'Silkscreen', monospace; font-size: 30px; color: #c9b99a; text-shadow: 3px 3px 0 #0e0d0c; }
#rw-cta .w { display: block; font-family: 'Silkscreen', monospace; font-size: 110px; line-height: 1; color: #e3d9c3; text-shadow: 5px 5px 0 #7e3b2a, 8px 8px 0 #0e0d0c; margin: 6px 0; }
#rw-cta .s { display: inline-block; font-family: 'VT323', monospace; font-size: 30px; background: rgba(14, 13, 12, 0.88); padding: 4px 12px; }
`;

export async function startWire2Reel({ cam, map, soldiers, tex, anims }) {
  let vo = files['../../marketing/reels/wire2.vo.json'];
  if (!vo) {
    let c = 0;
    vo = { lines: script.lines.map(([at, text, id]) => { const s = Math.max(at, c), d = text.length / 15 + 0.2; c = s + d + 0.25; return [s, d, text, id]; }) };
    vo.seconds = c + 3;
  }
  const C = cues(vo);
  const at = C.at, END = vo.seconds;
  const T = map.tile;
  const toEnemy = (f) => (map.front[f] < map.front[1 - f] ? 1 : -1);
  const wireY = (f) => (map.front[f] + toEnemy(f) * 6 + 1) * T;
  const front = (f) => soldiers.filter((s) => s.faction === f && s.slot?.line === 'front').sort((a, b) => a.x - b.x);
  const midX = (f) => { const l = front(f); return l[Math.floor(l.length * 0.45)]?.x ?? map.W * T / 2; };
  const hx = midX(0), cx = midX(1);
  const tt = Object.fromEntries(script.lines.map((l) => [l[2], at(l[2])]));
  // kamera: drát Hegemonie (stav), drát Concordu, linie se sněžením (proč), pak výzva nad drátem
  const K = [[0, hx, wireY(0), 3]];
  K.push([tt.state, hx - 150, wireY(0) - 16, 2.6, 'cut'], [tt.con - 0.01, hx + 150, wireY(0) - 10, 2.8]);
  K.push([tt.con, cx + 150, wireY(1) + 10, 2.6, 'cut'], [tt.why - 0.01, cx - 150, wireY(1) + 16, 2.8]);
  K.push([tt.why, hx + 40, wireY(0) - 50, 2.0, 'cut'], [tt.risk - 0.01, hx + 160, wireY(0) - 40, 2.1]);
  K.push([tt.cta, hx - 60, wireY(0) - 10, 2.4, 'cut'], [END, hx + 60, wireY(0) - 10, 2.6]);
  const camAt = camPath(K);
  const sub = subtitles(vo);
  const fx = transitions([[tt.stake, 'black', 0.3], [tt.flare, 'black', 0.25], [tt.state, 'flash'], [tt.con, 'whip'], [tt.why, 'whip'], [tt.risk, 'black', 0.3], [tt.cta, 'flash']]);
  const isCine = (t) => t < tt.state || (t >= tt.risk && t < tt.cta);

  const cineW = makeWireScenes(tex, anims);
  const SFX = [];
  for (let t = tt.stake + 0.9; t < tt.flare - 0.2; t += cineW.strikeEvery) SFX.push([+t.toFixed(2), 'stamp', 0]); // údery kladiva na kůl
  SFX.push([tt.flare + 0.25, 'shoot', 0], [tt.state, 'drum', 0], [tt.cta + 0.1, 'drum', 0], [END - 1.6, 'end', 0]);

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  root.innerHTML = `
    <div id="rw-title"><div class="a"></div><div class="b"></div></div>
    <div id="rw-state" class="rw-panel"><div class="t">THE WIRE BEFORE WINTER</div>
      <div class="row"><span>HEGEMONY</span><b class="r">${D.pct[0]}%</b></div><div class="bar"><i style="width:${D.pct[0]}%;background:#8f8a82"></i></div>
      <div class="row"><span>CONCORD</span><b>${D.pct[1]}%</b></div><div class="bar"><i style="width:${D.pct[1]}%;background:#8a8a52"></i></div>
      <div class="note" id="rw-note"></div></div>
    <div id="rw-why" class="rw-stamp"><span>NO WIRE,<br>NO COVER</span><span>RAIDS WALK RIGHT IN</span></div>
    <div id="rw-risk" class="rw-stamp"><span>HARD AND<br>DANGEROUS</span><span>FLARES · SNIPERS · COLD</span></div>
    <div id="rw-cta"><span class="k">COMMENT</span><span class="w">WIRE</span><span class="s">your soldier crawls out tonight · both sides can go</span></div>
    <div id="rd-big"></div>
    <div id="rd-sub"></div>
  `;
  document.body.appendChild(root);
  const scenes = makeScenes(tex, anims); // hlídka za parapetem pod světlicí (riziko)
  root.prepend(scenes.canvas);
  root.prepend(cineW.canvas);
  cineW.canvas.id = 'rw-cine';
  const paint = fxLayers(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };

  function frame(t) {
    const f = fx(t);
    for (const q of soldiers) if (q.vacant && q.sprite && q.sprite.alpha < 1) q.sprite.alpha = 1; // žádní duchové
    const [x, y, z] = camAt(t);
    cam.set(x, y, z * (1 + 0.03 * f.punch));
    // filmové záběry: noc v zemi nikoho (hook), kůl a drát (stake), světlice (flare), hlídka pod světlicí (risk)
    if (t < tt.stake) cineW.draw('nml', t);
    else if (t < tt.flare) cineW.draw('stake', t - tt.stake);
    else if (t < tt.state) cineW.draw('nml', t - tt.flare + 2.5, { flareAt: 2.7, side: 'concord' });
    const wOn = t < tt.state, sOn = t >= tt.risk && t < tt.cta;
    if (sOn) scenes.draw('flare', t - tt.risk + 1.2);
    show('#rw-cine', wOn ? 1 : 0);
    show('#rd-cine2', sOn ? 1 : 0);
    paint({ ...f, black: Math.max(f.black, t < 0.3 ? 1 - t / 0.3 : 0, t > END - 0.6 ? clamp01((t - END + 0.6) / 0.5) : 0) }, 0);

    show('#rw-title', win(t, 0.3, tt.stake - 0.1, 0.25));
    $('#rw-title .a').textContent = typed('BEFORE THE SNOW', t, 0.4, 24);
    $('#rw-title .b').textContent = typed('WIRING PARTY', t, 1.0, 12);
    slam($('#rw-state'), t, tt.state + 0.2, tt.why - 0.05, 1.3, -2);
    $('#rw-note').textContent = t < tt.con ? `Hegemony: ${D.torn[0]} sections torn apart, ${D.half[0]} sagging` : `Concord: ${D.half[1]} sections sagging`;
    slam($('#rw-why'), t, tt.why + 0.3, tt.risk - 0.1, 1.4, -3);
    slam($('#rw-risk'), t, tt.risk + 0.5, tt.cta - 0.1, 1.4, 3);
    show('#rw-cta', win(t, tt.cta + 0.2, tt.cta2 - 0.05, 0.2));
    const logo = t >= tt.cta2;
    const bigEl = $('#rd-big');
    bigEl.style.opacity = logo ? Math.min(1, (t - tt.cta2) / 0.3) : 0;
    if (logo && !bigEl.dataset.on) { bigEl.dataset.on = 1; bigEl.className = 'logo'; bigEl.innerHTML = '<span>MUD <i>&amp;</i> IRON</span><span>comment WIRE · @mudandiron</span>'; }
    const s = sub(t);
    const subEl = $('#rd-sub');
    if (s && !logo && t >= tt.stake) {
      subEl.style.opacity = 1;
      const top = isCine(t);
      subEl.style.top = top ? '9%' : 'auto'; subEl.style.bottom = top ? 'auto' : '13%';
      if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; }
    } else subEl.style.opacity = 0;
  }
  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
