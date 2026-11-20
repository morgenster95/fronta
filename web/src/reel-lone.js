// Akviziční reel „One man commented 152 times to save his army“ (20. 11. 2026; /?reel=lone&vacant=700, jen vývojový server), na výšku, trial reel.
// Skutečný souboj komentářů o bunkry (16.–17. 11.): @autistic_monkey3 (Concord) sám 152 granátů = polovina jeho strany, Hegemonie přesto vyhrála 383 : 301
// (Otto Tyner 83, brandon_marc_beck 67, angel._.mihai 46) a rozbila 41 % bunkrů Concordu. Pointa: jeden muž válku nevyhraje → výzva.
// Kreslené scény web/src/cinema-pillbox.js (hq, guns, boom), ve hře jeho voják, střelci Hegemonie a rozbitý bunkr Concordu. Hlas: lone.script.json.
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, slam, clamp01, win, easeOut, tagAt } from './reel-kit.js';
import { makePillboxScenes } from './cinema-pillbox.js';
import script from '../../marketing/reels/lone.script.json';

const files = import.meta.glob('../../marketing/reels/lone.vo.json', { eager: true, import: 'default' });

const CSS = `${BASE}${FX_CSS}
#rl-film { inset: 0; width: 100%; height: 100%; image-rendering: pixelated; opacity: 0; }
#rl-hook { left: 5%; right: 5%; top: 56%; text-align: center; font-family: 'Silkscreen', monospace; color: #e3d9c3; text-shadow: 5px 5px 0 #0e0d0c; background: rgba(14,13,12,0.85); padding: 14px 8px 18px; border-top: 3px solid #d98f3f; border-bottom: 3px solid #d98f3f; }
#rl-hook .a { font-size: 44px; } #rl-hook .b { font-size: 96px; color: #d98f3f; line-height: 1; } #rl-hook .c { font-size: 34px; }
#rl-feed { left: 6%; right: 6%; top: 20%; height: 44%; overflow: hidden; opacity: 0; background: rgba(14,13,12,0.88); border: 3px solid #524a3f; }
#rl-feed .in { position: absolute; left: 0; right: 0; }
#rl-feed div.c { display: flex; justify-content: space-between; font-family: 'VT323', monospace; font-size: 28px; line-height: 44px; height: 44px; padding: 0 10px; color: #e3d9c3; border-bottom: 1px solid #2b2722; white-space: nowrap; }
#rl-feed div.c b { color: #d4cf86; font-weight: 400; } #rl-feed div.c i { color: #d98f3f; font-style: normal; }
#rl-count { left: 0; right: 0; top: 66%; text-align: center; font-family: 'Silkscreen', monospace; color: #d4cf86; text-shadow: 5px 5px 0 #0e0d0c; opacity: 0; }
#rl-count b { display: block; font-size: 120px; font-weight: 400; line-height: 1; } #rl-count span { font-size: 30px; color: #e3d9c3; }
.rl-tag { position: absolute; transform: translate(-50%, -100%); font-family: 'Silkscreen', monospace; font-size: 26px; padding: 6px 12px; background: rgba(14,13,12,0.92); border: 3px solid #524a3f; white-space: nowrap; text-shadow: 2px 2px 0 #0e0d0c; opacity: 0; text-align: center; color: #e3d9c3; }
.rl-tag small { display: block; font-family: 'VT323', monospace; font-size: 28px; color: #d98f3f; }
.rl-panel { left: 7%; right: 7%; background: rgba(14,13,12,0.94); border: 3px solid #524a3f; padding: 14px 16px; opacity: 0; }
.rl-panel .t { font-family: 'Silkscreen', monospace; font-size: 22px; color: #d98f3f; text-align: center; letter-spacing: 0.08em; margin-bottom: 8px; }
.rl-panel .row { display: flex; justify-content: space-between; align-items: baseline; font-family: 'Silkscreen', monospace; font-size: 24px; margin: 6px 0; color: #e3d9c3; }
.rl-panel .row b { font-size: 40px; font-weight: 400; }
.rl-panel .bar { height: 20px; background: #1c1a17; border: 2px solid #524a3f; position: relative; margin-bottom: 8px; } .rl-panel .bar i { position: absolute; left: 0; top: 0; bottom: 0; }
.rl-panel .note { font-family: 'VT323', monospace; font-size: 30px; color: #c9b99a; text-align: center; margin-top: 8px; }
#rl-team { top: 58%; } #rl-score { top: 60%; }
#rl-moral { left: 0; right: 0; top: 40%; text-align: center; font-family: 'Silkscreen', monospace; font-size: 56px; color: #e3d9c3; text-shadow: 6px 6px 0 #0e0d0c; line-height: 1.15; opacity: 0; }
#rl-cta { left: 6%; right: 6%; top: 58%; text-align: center; background: rgba(14,13,12,0.95); border: 4px solid #d98f3f; padding: 16px; opacity: 0; }
#rl-cta .big { font-family: 'Silkscreen', monospace; font-size: 40px; color: #d98f3f; line-height: 1.15; }
#rl-cta .sm { font-family: 'VT323', monospace; font-size: 32px; color: #e3d9c3; margin-top: 6px; }
#rl-cta .url { font-family: 'Silkscreen', monospace; font-size: 32px; color: #e3d9c3; margin-top: 10px; border-top: 2px solid #524a3f; padding-top: 10px; }
`;

export async function startLoneReel({ cam, life, map, soldiers, tex }) {
  let vo = files['../../marketing/reels/lone.vo.json'];
  if (!vo) {
    let c = 0;
    vo = { lines: script.lines.map(([at, text, id]) => { const s = Math.max(at, c), d = text.length / 15 + 0.2; c = s + d + 0.25; return [s, d, text, id]; }) };
    vo.seconds = c + 2.4;
  }
  const C = cues(vo);
  const at = C.at, END = vo.seconds;
  const T = map.tile;
  const tt = Object.fromEntries(script.lines.map((l) => [l[2], at(l[2])]));
  const by = (h) => soldiers.find((s) => s.handle === h);
  const mid = ((map.front[0] + map.front[1]) / 2) * T;
  const mon = by('autistic_monkey3') || soldiers.find((s) => s.faction === 1 && !s.vacant);
  const ty = by('tyner_1776') || soldiers.find((s) => s.faction === 0 && !s.vacant);
  const F = window.__front || {};
  const ruinC = (F.orderFx?.pillboxes || []).find((p) => p.f === 1 && p.ruin) || (F.orderFx?.pillboxes || []).find((p) => p.f === 1);
  const rc = ruinC ? { x: ruinC.s.x, y: ruinC.s.y } : { x: mon.x, y: mon.y };
  const tHim2 = tt.him + 3.2;
  const K = [[0, mon.x, mid, 1.2], [tt.him, mon.x, mon.y - 18, 5.0, 'cut'], [tHim2 - 0.01, mon.x, mon.y - 18, 5.4]];
  K.push([tt.team, ty.x, ty.y - 18, 4.4, 'cut'], [tt.result - 0.01, ty.x + 160, ty.y - 18, 3.6]);
  K.push([tt.moral, rc.x, rc.y - 14, 4.0, 'cut'], [tt.cta - 0.01, rc.x + 8, rc.y - 14, 4.6]);
  K.push([tt.cta, mon.x, mid, 1.0, 'cut'], [END, mon.x + 200, mid, 1.05]);
  const camAt = camPath(K);
  const sub = subtitles(vo);
  // filmové scény: velitelství (vysvětlení), děla (háček a jeho palba), přímý zásah (výsledek)
  const film = (t) => (t < tt.real ? ['guns', t + 1] : t < tt.him ? ['hq', t - tt.real] : t >= tHim2 && t < tt.team ? ['guns', t - tHim2] : t >= tt.result && t < tt.moral ? ['boom', t - tt.result] : null);
  const fx = transitions([[tt.real, 'black', 0.3], [tt.him, 'flash'], [tHim2, 'whip'], [tt.team, 'black', 0.3], [tt.result, 'flash'], [tt.moral, 'black', 0.5], [tt.cta, 'flash']]);
  const SFX = [[tt.hook, 'drum', 0], [tt.team, 'drum', 0], [tt.moral, 'drum', 0], [tt.cta, 'drum', 0], [END - 1.3, 'end', 0]];
  for (let t = 0.3; t < tt.real; t += 0.7) SFX.push([+t.toFixed(2), 'shell', 1]);
  for (let t = tHim2 + 0.3; t < tt.team; t += 0.6) SFX.push([+t.toFixed(2), 'shell', 1]);
  for (const s of [0.6, 1.4, 2.2]) SFX.push([+(tt.result + s).toFixed(2), 'shell', s > 2 ? 1 : 0]);
  // proud jeho komentářů: každý = 1 granát (text komentářů neznáme, proto jen pořadí)
  const feed = Array.from({ length: 152 }, (_, i) => `<div class="c"><span><b>@autistic_monkey3</b> #${i + 1}</span><i>+1 SHELL</i></div>`).join('');

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  root.innerHTML = `
    <div id="rl-hook"><div class="a">ONE MAN.</div><div class="b">152</div><div class="c">COMMENTS TO SAVE HIS ARMY</div></div>
    <div id="rl-feed"><div class="in">${feed}</div></div>
    <div id="rl-count"><b>0</b><span>SHELLS FROM ONE MAN</span></div>
    <div id="rl-mon" class="rl-tag">FLORIAN MONKEY<small>@autistic_monkey3 · Concord · 152 shells</small></div>
    <div id="rl-team" class="rl-panel"><div class="t">THE HEGEMONY FIRED TOGETHER</div>
      <div class="row"><span>OTTO TYNER</span><b>83</b></div><div class="row"><span>BRANDON</span><b>67</b></div><div class="row"><span>ANGEL</span><b>46</b></div><div class="note">and dozens more</div></div>
    <div id="rl-score" class="rl-panel"><div class="t">THE GUNS ANSWERED</div>
      <div class="row"><span>HEGEMONY</span><b>383</b></div><div class="bar"><i style="width:100%;background:#8f8a82"></i></div>
      <div class="row"><span>CONCORD</span><b>301</b></div><div class="bar"><i style="width:${(301 / 383) * 100}%;background:#8a8a52"></i></div>
      <div class="note">41% of the Concord bunkers knocked out</div></div>
    <div id="rl-moral">ONE MAN<br>CAN'T WIN<br>A WAR ALONE</div>
    <div id="rl-cta"><div class="big">YOUR SIDE<br>NEEDS YOU</div><div class="sm">comment HEGEMONY or CONCORD on @mudandiron</div><div class="url">mudandiron.app</div></div>
    <div id="rd-big"></div>
    <div id="rd-sub"></div>
  `;
  document.body.appendChild(root);
  const pb = makePillboxScenes(tex);
  pb.canvas.id = 'rl-film';
  root.prepend(pb.canvas);
  const paint = fxLayers(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };
  const feedIn = $('#rl-feed .in');

  function frame(t) {
    const f = fx(t);
    const [x, y, z] = camAt(t);
    cam.set(x, y, z);
    const fl = film(t);
    if (fl) pb.draw(fl[0], fl[1]);
    show('#rl-film', fl ? 1 : 0);
    paint({ ...f, black: Math.max(f.black, t > END - 0.6 ? clamp01((t - END + 0.6) / 0.5) : 0) });
    const hk = $('#rl-hook');
    hk.style.opacity = t < tt.real - 0.05 ? 1 : 0;
    hk.style.transform = `scale(${1 + 0.12 * clamp01(1 - t / 0.25)})`;
    // jeho komentáře: proud běží a počítadlo roste (od „him“ do konce palby)
    const u = clamp01((t - tt.him) / (tt.team - tt.him - 0.4));
    const feedOn = t >= tt.him + 0.2 && t < tt.team;
    show('#rl-feed', feedOn && t >= tHim2 ? 1 : 0);
    show('#rl-count', feedOn && t >= tHim2 ? 1 : 0);
    $('#rl-count b').textContent = String(Math.round(152 * easeOut(u)));
    feedIn.style.top = `${-Math.max(0, Math.round(152 * easeOut(u)) - 8) * 44}px`;
    tagAt($('#rl-mon'), { x: mon.x, y: mon.y + 50 }, cam, win(t, tt.him + 0.3, tHim2 - 0.05, 0.15), 0);
    show('#rl-team', win(t, tt.team + 0.3, tt.result - 0.05, 0.2));
    show('#rl-score', win(t, tt.result + 0.3, tt.moral - 0.05, 0.2));
    show('#rl-moral', win(t, tt.moral + 0.2, tt.cta - 0.05, 0.2));
    slam($('#rl-cta'), t, tt.cta + 0.3, END - 1.4, 1.3, -3);
    const logo = t >= END - 1.3;
    const bigEl = $('#rd-big');
    bigEl.style.opacity = logo ? Math.min(1, (t - END + 1.3) / 0.3) : 0;
    if (logo && !bigEl.dataset.on) { bigEl.dataset.on = 1; bigEl.className = 'logo'; bigEl.innerHTML = '<span>MUD <i>&amp;</i> IRON</span><span>@mudandiron · mudandiron.app</span>'; }
    const s = sub(t);
    const subEl = $('#rd-sub');
    if (s && !logo && t >= tt.real && !(t >= tt.moral && t < tt.cta)) { subEl.style.opacity = 1; subEl.style.top = '13%'; if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; } } else subEl.style.opacity = 0;
  }

  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
