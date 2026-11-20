// Akviziční reel „If you commented, you're in this video“ (20. 11. 2026; /?reel=roll&vacant=700, jen vývojový server), na výšku, trial reel.
// V pozadí kamera pomalu jede po frontě (skuteční vojáci), přes obraz běží VŠECHNA jména podle pořadí narukování ve třech sloupcích
// (barva strany), nahoře stále „PAUSE TO FIND YOURSELF“. Diváci zastavují video a hledají se (opakovaná přehrání, sdílení).
// Hlas: marketing/reels/roll.script.json, hudba war_score ('roll' v reel_audio.py).
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, slam, clamp01, win, easeOut } from './reel-kit.js';
import script from '../../marketing/reels/roll.script.json';

const files = import.meta.glob('../../marketing/reels/roll.vo.json', { eager: true, import: 'default' });

const CSS = `${BASE}${FX_CSS}
#rr-hook { left: 5%; right: 5%; top: 30%; text-align: center; font-family: 'Silkscreen', monospace; color: #e3d9c3; text-shadow: 5px 5px 0 #0e0d0c; background: rgba(14,13,12,0.82); padding: 16px 8px 20px; border-top: 3px solid #d98f3f; border-bottom: 3px solid #d98f3f; }
#rr-hook .a { font-size: 40px; line-height: 1.15; } #rr-hook .b { font-size: 70px; color: #d98f3f; line-height: 1.05; margin-top: 8px; }
#rr-dim { inset: 0; background: rgba(14,13,12,0.62); opacity: 0; }
#rr-head { left: 0; right: 0; top: 6%; text-align: center; padding: 20px 0 12px; background: #0e0d0c; border-bottom: 3px solid #d98f3f; opacity: 0; font-family: 'Silkscreen', monospace; }
#rr-head .rn { font-size: 44px; color: #e3d9c3; } #rr-head .m { font-size: 20px; color: #c9b99a; letter-spacing: 0.1em; } #rr-head .p { font-size: 26px; color: #d98f3f; letter-spacing: 0.12em; margin-top: 4px; }
#rr-list { left: 0; right: 0; top: 0; bottom: 0; overflow: hidden; opacity: 0; }
#rr-list .in { position: absolute; left: 0; right: 0; display: grid; grid-template-columns: 1fr 1fr 1fr; column-gap: 6px; padding: 0 14px; }
#rr-list span { font-family: 'VT323', monospace; font-size: 25px; line-height: 38px; height: 38px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 2px 2px 0 #0e0d0c; }
#rr-list span b { font-weight: 400; color: #857a68; margin-right: 6px; }
#rr-list span.h { color: #b9c4ca; } #rr-list span.c { color: #d4cf86; } #rr-list span.d { color: #c8553d; }
#rr-key { left: 0; right: 0; bottom: 0; text-align: center; padding: 12px 0 18px; background: rgba(14,13,12,0.92); border-top: 3px solid #524a3f; font-family: 'Silkscreen', monospace; font-size: 22px; opacity: 0; }
#rr-key .h { color: #b9c4ca; } #rr-key .c { color: #d4cf86; } #rr-key .d { color: #c8553d; }
#rr-cta { left: 6%; right: 6%; top: 52%; text-align: center; background: rgba(14,13,12,0.95); border: 4px solid #d98f3f; padding: 16px; opacity: 0; }
#rr-cta .big { font-family: 'Silkscreen', monospace; font-size: 38px; color: #d98f3f; line-height: 1.15; }
#rr-cta .sm { font-family: 'VT323', monospace; font-size: 32px; color: #e3d9c3; margin-top: 6px; }
#rr-cta .url { font-family: 'Silkscreen', monospace; font-size: 32px; color: #e3d9c3; margin-top: 10px; border-top: 2px solid #524a3f; padding-top: 10px; }
`;

export async function startRollReel({ cam, map, soldiers }) {
  let vo = files['../../marketing/reels/roll.vo.json'];
  if (!vo) {
    let c = 0;
    vo = { lines: script.lines.map(([at, text, id]) => { const s = Math.max(at, c), d = text.length / 15 + 0.2; c = s + d + 0.25; return [s, d, text, id]; }) };
    vo.seconds = c + 2.4;
  }
  const C = cues(vo);
  const at = C.at, END = vo.seconds;
  const T = map.tile;
  const tt = Object.fromEntries(script.lines.map((l) => [l[2], at(l[2])]));
  const real = soldiers.filter((s) => !s.vacant && s.handle);
  const N = real.length;
  const front = (f) => real.filter((q) => q.faction === f && q.slot?.line === 'front').sort((a, b) => a.x - b.x);
  const fH = front(0), fC = front(1);
  const mid = ((map.front[0] + map.front[1]) / 2) * T;
  // seznam: pořadí narukování = pořadí v soupisce; padlí v rodu červeně (rod, který už ztratil vojáka)
  const rows = real.map((s, i) => `<span class="${(s.gen || s.generation || 1) > 1 ? 'd' : s.faction ? 'c' : 'h'}"><b>${i + 1}</b>@${s.handle}</span>`).join('');
  const L0 = tt.count, L1 = tt.cta - 0.3; // jména jedou od „count“ do výzvy
  const K = [[0, fH[0]?.x ?? 0, mid, 1.4], [L1, fH.at(-1)?.x ?? 0, mid, 1.4], [L1 + 0.01, fC[0]?.x ?? 0, mid, 1.0, 'cut'], [END, (fC[0]?.x ?? 0) + 300, mid, 1.05]];
  const camAt = camPath(K);
  const sub = subtitles(vo);
  const fx = transitions([[tt.count, 'flash'], [tt.cta, 'black', 0.4]]);
  const SFX = [[tt.hook, 'drum', 0], [tt.count, 'drum', 0], [tt.cta, 'drum', 0], [END - 1.3, 'end', 0]];

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  root.innerHTML = `
    <div id="rr-dim"></div>
    <div id="rr-list"><div class="in">${rows}</div></div>
    <div id="rr-head"><div class="rn">0 SOLDIERS</div><div class="m">ALL REAL PEOPLE · IN ORDER OF ENLISTMENT</div><div class="p">⏸ PAUSE TO FIND YOURSELF</div></div>
    <div id="rr-key"><span class="h">■ HEGEMONY</span> &nbsp; <span class="c">■ CONCORD</span> &nbsp; <span class="d">■ FAMILY LOST A SOLDIER</span></div>
    <div id="rr-hook"><div class="a">IF YOU COMMENTED<br>ON MY POSTS,</div><div class="b">YOU'RE IN<br>THIS VIDEO</div></div>
    <div id="rr-cta"><div class="big">NOT HERE YET?</div><div class="sm">comment HEGEMONY or CONCORD on @mudandiron<br>and you'll be in the next one</div><div class="url">mudandiron.app</div></div>
    <div id="rd-big"></div>
    <div id="rd-sub"></div>
  `;
  document.body.appendChild(root);
  const paint = fxLayers(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };
  const inner = $('#rr-list .in');
  const rowsN = Math.ceil(N / 3), RH = 38;

  function frame(t) {
    const f = fx(t);
    const [x, y, z] = camAt(t);
    cam.set(x, y, z);
    paint({ ...f, black: Math.max(f.black, t > END - 0.6 ? clamp01((t - END + 0.6) / 0.5) : 0) });
    const hk = $('#rr-hook');
    hk.style.opacity = t < tt.count - 0.05 ? 1 : 0;
    hk.style.transform = `scale(${1 + 0.1 * clamp01(1 - t / 0.25)})`;
    const listOn = t >= L0 && t < L1 + 0.4;
    show('#rr-dim', listOn ? 1 : 0);
    show('#rr-list', listOn ? 1 : 0);
    show('#rr-head', listOn ? 1 : 0);
    show('#rr-key', listOn ? 1 : 0);
    // seznam jede zdola nahoru: začne pod hlavičkou, skončí, když projede poslední řádek
    const u = clamp01((t - L0) / (L1 - L0));
    const H = window.innerHeight;
    inner.style.top = `${Math.round(H * 0.16 + (H * 0.1) - u * (rowsN * RH + H * 0.1 - H * 0.6))}px`;
    $("#rr-head .rn").textContent = `${Math.min(N, Math.round(N * easeOut(clamp01((t - L0) / 1.5)))).toLocaleString('en-US')} SOLDIERS`;
    slam($('#rr-cta'), t, tt.cta + 0.3, END - 1.4, 1.3, -3);
    const logo = t >= END - 1.3;
    const bigEl = $('#rd-big');
    bigEl.style.opacity = logo ? Math.min(1, (t - END + 1.3) / 0.3) : 0;
    if (logo && !bigEl.dataset.on) { bigEl.dataset.on = 1; bigEl.className = 'logo'; bigEl.innerHTML = '<span>MUD <i>&amp;</i> IRON</span><span>@mudandiron · mudandiron.app</span>'; }
    const s = sub(t);
    const subEl = $('#rd-sub');
    if (s && !logo && !listOn && t >= tt.real) { subEl.style.opacity = 1; subEl.style.top = '13%'; if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; } } else if (s && listOn) { subEl.style.opacity = 1; subEl.style.top = '79%'; if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; } } else subEl.style.opacity = 0;
  }

  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
