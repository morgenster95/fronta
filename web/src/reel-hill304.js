// Reel „vítězství na Hill 304“ (/?reel=hill304&vacant=700, jen vývojový server): Hegemonie dobyla kótu, hrdina (bez jména: vyrábí se předem),
// odměna pozorovatelna (falešný ocelový strom se spotterem, 3 dny přesnější odstřelovači a kulometčíci), záběr ve hře na strom a linii Concordu,
// nový závod o Blackwater Canal (cíl 200) a výzva. Hlas: marketing/reels/hill304.script.json (auto časování).
// Vychází z fronty automaticky po dobytí (trigger race: hill304, varianta jen pro Hegemonii), čísla ve videu proto nejsou konečné skóre.
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, slam, clamp01, win, typed, easeOut } from './reel-kit.js';
import script from '../../marketing/reels/hill304.script.json';
import { makeRaceScenes } from './cinema-race.js';
import { makeWireScenes } from './cinema-wire.js';

const files = import.meta.glob('../../marketing/reels/hill304.vo.json', { eager: true, import: 'default' });

const CSS = `${BASE}${FX_CSS}
#rh-race, #rh-wire { inset: 0; width: 100%; height: 100%; image-rendering: pixelated; }
#rh-title { left: 0; right: 0; top: 18%; text-align: center; }
#rh-title .a { font-family: 'Silkscreen', monospace; font-size: 24px; color: #d98f3f; letter-spacing: 0.12em; text-shadow: 3px 3px 0 #0e0d0c; min-height: 30px; }
#rh-title .b { font-family: 'Silkscreen', monospace; font-size: 62px; line-height: 1.05; text-shadow: 4px 4px 0 #0e0d0c; min-height: 66px; }
.rh-stamp { left: 0; right: 0; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; }
.rh-stamp span { font-family: 'Silkscreen', monospace; font-size: 40px; line-height: 1.05; background: rgba(126, 59, 42, 0.95); padding: 6px 14px; text-shadow: 3px 3px 0 #0e0d0c; }
.rh-stamp span + span { font-size: 26px; background: rgba(14, 13, 12, 0.85); }
#rh-reward { top: 30%; } #rh-warn { top: 34%; }
#rh-race2 { left: 7%; right: 7%; top: 36%; }
#rh-race2 .t { font-family: 'Silkscreen', monospace; font-size: 26px; margin-bottom: 4px; text-align: center; text-shadow: 3px 3px 0 #0e0d0c; }
#rh-race2 .g { font-family: 'Silkscreen', monospace; font-size: 54px; text-align: center; color: #d98f3f; text-shadow: 4px 4px 0 #0e0d0c; margin-bottom: 8px; }
#rh-race2 .row { margin: 10px 0; }
#rh-race2 .n { display: flex; justify-content: space-between; font-family: 'Silkscreen', monospace; font-size: 22px; margin-bottom: 4px; }
#rh-race2 .bar { height: 26px; background: #1c1a17; border: 2px solid #524a3f; position: relative; }
#rh-race2 .bar i { position: absolute; left: 0; top: 0; bottom: 0; width: 0; }
#rh-cta { left: 0; right: 0; top: 34%; text-align: center; }
#rh-cta span { display: inline-block; font-family: 'Silkscreen', monospace; font-size: 34px; line-height: 1.15; background: rgba(14, 13, 12, 0.85); padding: 8px 16px; text-shadow: 3px 3px 0 #0e0d0c; }
#rh-cta b { color: #d98f3f; font-weight: 400; }
`;

export async function startHillReel({ cam, life, map, theme, soldiers, tex, anims }) {
  let vo = files['../../marketing/reels/hill304.vo.json'];
  if (!vo) { // bez hlasu (náhled): odhad délky vět
    let c = 0;
    vo = { lines: script.lines.map(([at, text, id]) => { const s = Math.max(at, c), d = text.length / 15 + 0.2; c = s + d + 0.25; return [s, d, text, id]; }) };
    vo.seconds = c + 3.2;
  }
  const C = cues(vo);
  const at = C.at, END = vo.seconds;
  const T = map.tile;
  const W = 0, LOSE = 1; // vítěz Hegemonie (varianta reelu jen pro ni)
  const short = (f) => theme.factions[f].name.replace(/^The /, '');
  const front = (f) => soldiers.filter((s) => s.faction === f && s.slot?.line === 'front').sort((a, b) => a.x - b.x);
  const mid = (f) => { const l = front(f); return l[Math.floor(l.length / 2)] || { x: map.W * T / 2, y: map.front[f] * T }; };
  const obs = window.__front?.obsFx; // pozorovatelna ve hře (web/src/observation.js), v reelu vždy vidět
  const tHook = at('hook'), tWin = at('win'), tTree = at('tree'), tReward = at('reward'), tWarn = at('warn'), tNext = at('next'), tCta = at('cta'), tLogo = at('cta2');
  const tGame = tReward + (tWarn - tReward) * 0.45; // druhá půlka věty o odměně: strom ve hře
  const cM = mid(LOSE), tree = obs || { x: mid(W).x, y: map.front[W] * T + 80 };
  const K = [[0, tree.x, tree.y, 3]];
  K.push([tGame, tree.x - 40, tree.y - 10, 3.6, 'cut'], [tWarn - 0.01, tree.x + 30, tree.y - 10, 4.2]);
  K.push([tWarn, cM.x - 120, cM.y - 10, 3.4, 'cut'], [tNext - 0.01, cM.x + 120, cM.y - 10, 3.8]);
  K.push([tNext, (tree.x + cM.x) / 2, (tree.y + cM.y) / 2, 1.3, 'cut'], [END, (tree.x + cM.x) / 2 + 160, (tree.y + cM.y) / 2, 1.5]);
  const camAt = camPath(K);
  const sub = subtitles(vo);
  const isGame = (t) => (t >= tGame && t < tNext) || t >= tNext;
  const fx = transitions([[tWin, 'flash'], [tTree, 'black', 0.3], [tGame, 'whip'], [tWarn, 'flash'], [tNext, 'black', 0.35], [tCta, 'flash']]);

  // zvuk: výstřely odstřelovačů při záběru na linii Concordu, buben a zvon na konci
  const SFX = [];
  for (let t = tWarn + 0.4; t < tNext - 0.3; t += 0.9) SFX.push([+t.toFixed(2), 'shoot', 0]);
  SFX.push([tWin + 0.3, 'medal', 0], [tNext + 0.2, 'drum', 0], [END - 1.6, 'end', 0]);

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  root.innerHTML = `
    <div id="rh-title"><div class="a"></div><div class="b"></div></div>
    <div id="rh-reward" class="rh-stamp"><span>THE OBSERVATION<br>TREE</span><span>3 DAYS: SHARPER SNIPERS AND GUNS</span></div>
    <div id="rh-warn" class="rh-stamp"><span>CONCORD,<br>HEADS DOWN</span></div>
    <div id="rh-race2" class="panel"><div class="t">THE RACE FOR BLACKWATER CANAL</div><div class="g">FIRST TO 200</div>
      ${[W, LOSE].map((f) => `<div class="row"><div class="n"><span>${short(f).toUpperCase()}</span><span class="c" data-f="${f}">0 / 200</span></div><div class="bar"><i data-f="${f}" style="background:${f === 0 ? '#8f8a82' : '#8a8a52'}"></i></div></div>`).join('')}</div>
    <div id="rh-cta"><span>COMMENT<br><b>HEGEMONY</b> or <b>CONCORD</b><br>TO ENLIST</span></div>
    <div id="rd-big"></div>
    <div id="rd-sub"></div>
  `;
  document.body.appendChild(root);
  const race = makeRaceScenes(tex, anims);
  race.canvas.id = 'rh-race';
  const wire = makeWireScenes(tex, anims);
  wire.canvas.id = 'rh-wire';
  root.prepend(wire.canvas);
  root.prepend(race.canvas);
  const paint = fxLayers(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };

  function frame(t) {
    const f = fx(t);
    for (const q of soldiers) if (q.vacant && q.sprite && q.sprite.alpha < 1) { q.sprite.alpha = 1; q.sprite.tint = [0xffffff, 0xf0ece4, 0xe6e2da, 0xfff4e8][q.variant % 4]; }
    const [x, y, z] = camAt(t);
    cam.set(x, y, z * (1 + 0.03 * f.punch));
    // filmové záběry: kopec s praporem Hegemonie (hook), stužka hrdinovi (win), pozorovací strom (tree + první půlka reward)
    const rOn = t < tTree, wOn = t >= tTree && t < tGame;
    if (t < tWin) race.draw('march', t - tHook, { side: W });
    else if (t < tTree) race.draw('ribbon', t - tWin, { side: W });
    if (wOn) wire.draw('tree', t - tTree, { side: W });
    show('#rh-race', rOn ? 1 : 0);
    show('#rh-wire', wOn ? 1 : 0);
    paint({ ...f, black: Math.max(f.black, t < 0.3 ? 1 - t / 0.3 : 0, t > END - 0.6 ? clamp01((t - END + 0.6) / 0.5) : 0) });

    show('#rh-title', win(t, 0.5, tWin - 0.1, 0.25));
    $('#rh-title .a').textContent = typed('THE HEGEMONY TAKES', t, 0.6, 24);
    $('#rh-title .b').textContent = typed('HILL 304', t, 1.3, 10);
    slam($('#rh-reward'), t, tReward + 0.3, tGame - 0.05, 1.4, -4);
    slam($('#rh-warn'), t, tWarn + 0.2, tNext - 0.1, 1.4, 3);
    show('#rh-race2', win(t, tNext + 0.3, tCta - 0.05, 0.25));
    const ru = easeOut(clamp01((t - tNext - 1.2) / 2.5)); // pruhy naběhnou z nuly jen kousek: závod právě začal
    root.querySelectorAll('#rh-race2 i').forEach((el) => (el.style.width = `${(el.dataset.f === '0' ? 3 : 2) * ru}%`));
    show('#rh-cta', win(t, tCta + 0.2, tLogo - 0.05, 0.2));
    const logo = t >= tLogo;
    const bigEl = $('#rd-big');
    bigEl.style.opacity = logo ? Math.min(1, (t - tLogo) / 0.3) : 0;
    if (logo && !bigEl.dataset.on) { bigEl.dataset.on = 1; bigEl.className = 'logo'; bigEl.innerHTML = '<span>MUD <i>&amp;</i> IRON</span><span>@mudandiron · link in bio</span>'; }
    const s = sub(t);
    const subEl = $('#rd-sub');
    if (s && !logo) {
      subEl.style.opacity = 1;
      subEl.style.top = !isGame(t) ? '13%' : '69%';
      if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; }
    } else subEl.style.opacity = 0;
  }

  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
