// Reel „pilot“ (17. 11. 2026, náborové video jen na piloty a letadla; NENÍ Day reel): hák (letadlo nad frontou ve hře), svítání na letišti (film),
// let nad frontou, bonus pro puškaře, druhé letadlo (Concord), země střílí (film: stopovky, flak, zásah a pád), výzva PILOT (komentář = přihláška, los v novinách).
// Letadla jsou skutečná ze hry (web/src/planes.js), kamera je sleduje (planeFx.poseOf). Náhled /?reel=pilot&vacant=700 (jen vývojový server).
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, slam, clamp01, win } from './reel-kit.js';
import script from '../../marketing/reels/pilot.script.json';
import { makePilotScenes } from './cinema-pilot.js';

const files = import.meta.glob('../../marketing/reels/pilot.vo.json', { eager: true, import: 'default' });

const CSS = `${BASE}${FX_CSS}
#rpl-film { inset: 0; width: 100%; height: 100%; image-rendering: pixelated; }
#rpl-title { left: 0; right: 0; top: 24%; text-align: center; font-family: 'Silkscreen', monospace; font-size: 66px; line-height: 1.05; color: #e3d9c3; text-shadow: 5px 5px 0 #0e0d0c; letter-spacing: 0.06em; }
#rpl-title b { color: #d98f3f; font-weight: 400; display: block; }
.rpl-stamp { left: 0; right: 0; text-align: center; opacity: 0; }
.rpl-stamp span { display: inline-block; font-family: 'Silkscreen', monospace; font-size: 34px; line-height: 1.1; background: rgba(14,13,12,0.88); border: 3px solid #d98f3f; padding: 8px 16px; color: #e3d9c3; text-shadow: 3px 3px 0 #0e0d0c; }
.rpl-stamp.red span { background: rgba(126,59,42,0.95); border-color: #0e0d0c; }
#rpl-eye { top: 70%; } #rpl-rifle { top: 70%; } #rpl-fire { top: 70%; }
#rpl-cta { left: 6%; right: 6%; top: 22%; background: rgba(14,13,12,0.94); border: 4px solid #d98f3f; padding: 18px 16px 22px; text-align: center; }
#rpl-cta .big { font-family: 'Silkscreen', monospace; font-size: 48px; color: #d98f3f; line-height: 1.05; letter-spacing: 0.04em; }
#rpl-cta .word { font-family: 'Silkscreen', monospace; font-size: 104px; line-height: 1; color: #e3d9c3; text-shadow: 5px 5px 0 #7e3b2a, 8px 8px 0 #0e0d0c; margin: 8px 0; }
#rpl-cta .mid { font-family: 'Silkscreen', monospace; font-size: 24px; color: #e3d9c3; margin-top: 10px; line-height: 1.3; }
#rpl-cta .mid span { color: #8a9295; } #rpl-cta .mid i { color: #c9c26a; font-style: normal; }
#rpl-cta .sm { font-family: 'VT323', monospace; font-size: 30px; color: #c9b99a; margin-top: 12px; line-height: 1.05; }
#rpl-sky { inset: 0; background: rgba(217, 143, 63, 0.10); mix-blend-mode: multiply; }
`;

export async function startPilotReel({ cam, life, map, theme, soldiers, tex, anims }) {
  let vo = files['../../marketing/reels/pilot.vo.json'];
  if (!vo) { // bez hlasu (náhled): odhad délky vět
    let c = 0;
    vo = { lines: script.lines.map(([at, text, id]) => { const s = Math.max(at, c), d = text.length / 15 + 0.2; c = s + d + 0.25; return [s, d, text, id]; }) };
    vo.seconds = c + 3.0;
  }
  const C = cues(vo);
  const at = C.at, END = vo.seconds;
  const F = window.__front || {};
  const planes = F.planeFx;
  const T = map.tile;
  const front = (f) => soldiers.filter((s) => s.faction === f && s.slot?.line === 'front' && !s.vacant).sort((a, b) => a.x - b.x);
  const midX = (f, k = 0.5) => { const l = front(f); return l[Math.floor(l.length * k)]?.x ?? (map.W * T) / 2; };
  const id = ['hook', 'field', 'fly', 'rifles', 'other', 'risk', 'down', 'cta', 'cta2', 'cta3'];
  const tt = Object.fromEntries(id.map((k) => [k, at(k)]));
  // letadla budou v daných časech na daných místech fronty (hák a let: Hegemonie, druhé letadlo: Concord)
  const xH = midX(0, 0.35), xH2 = midX(0, 0.65), xC = midX(1, 0.5);
  planes?.placeAt(0, tt.hook + 1.0, xH);
  planes?.placeAt(1, tt.other, xC);
  const pose = (f, t) => planes?.poseOf(f, t * 1000) || { x: xH, y: ((map.front[0] + map.front[1]) / 2) * T, dir: 1 };
  const follow = (f, t, z, lead = 30) => { const p = pose(f, t); return [p.x + p.dir * lead, p.y + (f === 0 ? 26 : -26), z]; };
  const isFilm = (t) => (t >= tt.field && t < tt.fly) || (t >= tt.risk && t < tt.cta);
  const K = [];
  const camAt = (t) => {
    if (t < tt.field) return follow(0, t, 1.8 + 0.5 * clamp01(t / tt.field));
    if (t < tt.other) return follow(0, t, t < tt.rifles ? 2.2 : 1.7, 20);
    if (t < tt.risk) return follow(1, t, 1.9);
    return follow(1, t, 1.4, 0);
  };
  void K;
  void camPath;
  void xH2;
  const sub = subtitles(vo);
  const fx = transitions([[tt.field, 'black', 0.25], [tt.fly, 'whip'], [tt.rifles, 'flash'], [tt.other, 'whip'], [tt.risk, 'black', 0.25], [tt.down, 'flash'], [tt.cta, 'flash']]);
  const SFX = [];
  for (let t = tt.risk + 0.6; t < tt.down + 1.5; t += 0.35) SFX.push([+t.toFixed(2), 'shoot', 0]);
  for (const s of [0.8, 1.35, 1.9, 2.4, 2.9, 3.35]) SFX.push([+(tt.risk + s).toFixed(2), 'shell', 0]);
  SFX.push([tt.down + 0.2, 'shell', 1], [tt.down + 1.9, 'shell', 1]);
  SFX.push([tt.cta, 'drum', 0], [tt.cta3, 'drum', 0], [END - 1.4, 'end', 0]);

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  root.innerHTML = `
    <div id="rpl-sky"></div>
    <div id="rpl-title">PILOTS<b>WANTED</b></div>
    <div id="rpl-eye" class="rpl-stamp"><span>SEES EVERY TRENCH</span></div>
    <div id="rpl-rifle" class="rpl-stamp"><span>RIFLEMEN<br>SHOOT BETTER</span></div>
    <div id="rpl-fire" class="rpl-stamp red"><span>GROUND FIRE</span></div>
    <div id="rpl-cta"><div class="big">COMMENT</div><div class="word">PILOT</div>
      <div class="mid">ONE PER SIDE<br><span>HEGEMONY</span> · <i>CONCORD</i></div>
      <div class="sm">Applications close in 24 hours. The Trench Gazette draws one pilot for each side. New here? Add HEGEMONY or CONCORD to enlist.</div></div>
    <div id="rd-big"></div>
    <div id="rd-sub"></div>
  `;
  document.body.appendChild(root);
  const ps = makePilotScenes(tex, anims);
  ps.canvas.id = 'rpl-film';
  ps.state.hit = Math.max(2.4, tt.down - tt.risk + 0.1); // zásah ve filmu v okamžiku věty „the ground will find you“
  root.prepend(ps.canvas);
  const paint = fxLayers(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };

  function frame(t) {
    const f = fx(t);
    for (const q of soldiers) if (q.vacant && q.sprite && q.sprite.alpha < 1) { q.sprite.alpha = 1; q.sprite.tint = [0xffffff, 0xf0ece4, 0xe6e2da, 0xfff4e8][q.variant % 4]; } // žádní duchové
    const [x, y, z] = camAt(t);
    cam.set(x, y, z * (1 + 0.04 * f.punch));
    const film = t >= tt.field && t < tt.fly ? 'field' : t >= tt.risk && t < tt.cta ? 'archie' : null;
    if (film) ps.draw(film, t - (film === 'field' ? tt.field : tt.risk));
    show('#rpl-film', film ? 1 : 0);
    show('#rpl-sky', film ? 0 : 1);
    paint({ ...f, black: Math.max(f.black, t < 0.2 ? 1 - t / 0.2 : 0, t > END - 0.5 ? clamp01((t - END + 0.5) / 0.4) : 0) });
    const ti = $('#rpl-title');
    ti.style.opacity = win(t, 0.05, tt.field - 0.1, 0.15);
    ti.style.transform = `scale(${1 + 0.25 * clamp01(1 - t / 0.35)})`;
    const stamp = (sel, a, b) => { const el = $(sel); el.style.opacity = win(t, a, b, 0.2); if (t >= a && t < b) slam(el, t, a, b, 1.3, -2); };
    stamp('#rpl-eye', tt.fly + 0.5, tt.rifles - 0.05);
    stamp('#rpl-rifle', tt.rifles + 0.4, tt.other - 0.05);
    stamp('#rpl-fire', tt.risk + 0.3, tt.down - 0.1);
    const cta = $('#rpl-cta');
    cta.style.opacity = t >= tt.cta && t < END - 0.3 ? 1 : 0;
    if (t >= tt.cta) slam(cta, t, tt.cta + 0.05, END - 0.3, 1.25, -2);
    const s = sub(t);
    const subEl = $('#rd-sub');
    if (s && t < tt.cta) {
      subEl.style.opacity = 1;
      subEl.style.top = '13%';
      if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; }
    } else subEl.style.opacity = 0;
  }

  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
