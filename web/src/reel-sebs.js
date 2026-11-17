// Krátký reel o hráči Konradu Sebsovi (@_sebs.c_, Hegemonie), propagandistovi fronty (17. 11. 2026, na přání uživatele):
// jeho plakáty (art/cine/sebs_poster_*.png, ze screenshotů, mimo web) → jeho voják ve hře → jeho slova pod příspěvky → bunkry z jeho plánu
// → titul Propagandist of the Hegemony → výzva oběma stranám kreslit plakáty. /?reel=sebs&vacant=700 (jen vývojový server).
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, slam, clamp01, win, typed, tagAt } from './reel-kit.js';
import script from '../../marketing/reels/sebs.script.json';
import poster1 from '../../art/cine/sebs_poster_1.png';
import poster2 from '../../art/cine/sebs_poster_2.png';

const files = import.meta.glob('../../marketing/reels/sebs.vo.json', { eager: true, import: 'default' });

const CSS = `${BASE}${FX_CSS}
.rs-poster { position: absolute; left: 50%; top: 50%; width: 70%; transform-origin: 50% 50%; box-shadow: 0 10px 0 rgba(0,0,0,0.55), 0 22px 40px rgba(0,0,0,0.7); border: 6px solid #e3d9c3; opacity: 0; }
.rs-poster img { display: block; width: 100%; }
.rs-credit { position: absolute; left: 0; right: 0; top: 86.5%; text-align: center; font-family: 'VT323', monospace; font-size: 30px; color: #c9b99a; text-shadow: 2px 2px 0 #0e0d0c; opacity: 0; }
.rs-tag { position: absolute; transform: translate(-50%, -100%); font-family: 'Silkscreen', monospace; font-size: 24px; padding: 6px 12px; background: rgba(14,13,12,0.92); border: 3px solid #d98f3f; white-space: nowrap; text-align: center; opacity: 0; }
.rs-tag small { display: block; font-family: 'VT323', monospace; font-size: 26px; color: #d98f3f; }
.rs-quote { position: absolute; left: 8%; right: 8%; top: 56%; background: #c4b8a0; color: #1c1a17; padding: 14px 16px; transform: rotate(-1.5deg); box-shadow: 0 8px 0 rgba(0,0,0,0.5); opacity: 0; }
.rs-quote .w { font-family: 'Silkscreen', monospace; font-size: 26px; line-height: 1.15; min-height: 92px; }
.rs-quote .by { font-family: 'VT323', monospace; font-size: 26px; color: #7e3b2a; text-align: right; margin-top: 6px; }
#rs-cta { left: 7%; right: 7%; top: 60%; background: rgba(14,13,12,0.93); border: 4px solid #d98f3f; padding: 16px; text-align: center; opacity: 0; }
#rs-cta .big { font-family: 'Silkscreen', monospace; font-size: 36px; color: #d98f3f; line-height: 1.1; }
#rs-cta .sm { font-family: 'VT323', monospace; font-size: 30px; color: #e3d9c3; margin-top: 8px; }
#rs-dark { inset: 0; background: rgba(14,13,12,0.62); opacity: 0; }
`;

export async function startSebsReel({ cam, map, soldiers }) {
  let vo = files['../../marketing/reels/sebs.vo.json'];
  if (!vo) {
    let c = 0;
    vo = { lines: script.lines.map(([at, text, id]) => { const s = Math.max(at, c), d = text.length / 15 + 0.2; c = s + d + 0.25; return [s, d, text, id]; }) };
    vo.seconds = c + 2.6;
  }
  const C = cues(vo);
  const at = C.at, END = vo.seconds;
  const me = soldiers.find((s) => s.handle === '_sebs.c_') || soldiers.find((s) => s.faction === 0 && s.slot?.line === 'front');
  const F = window.__front || {};
  const boxH = (F.orderFx?.pillboxes || []).filter((p) => p.f === 0 && !p.ruin).sort((a, b) => Math.abs(a.s.x - me.x) - Math.abs(b.s.x - me.x))[0]?.s || me;
  const id = ['open', 'who', 'words', 'bunkers', 'title', 'cta'];
  const tt = Object.fromEntries(id.map((k) => [k, at(k)]));
  const K = [[0, me.x, me.y - 30, 1.6], [tt.words, me.x - 14, me.y - 18, 3.8, 'cut'], [tt.bunkers - 0.01, me.x + 10, me.y - 18, 4.2]];
  K.push([tt.bunkers, boxH.x - 24, boxH.y - 16, 3.6, 'cut'], [tt.title - 0.01, boxH.x + 10, boxH.y - 16, 3.9]);
  K.push([tt.title, me.x, me.y - 20, 4.4, 'cut'], [tt.cta - 0.01, me.x, me.y - 20, 4.8], [tt.cta, me.x, me.y + 60, 2.0, 'cut'], [END, me.x + 120, me.y + 60, 2.1]);
  const camAt = camPath(K);
  const sub = subtitles(vo);
  const fx = transitions([[tt.who, 'flash'], [tt.words, 'whip'], [tt.bunkers, 'whip'], [tt.title, 'flash'], [tt.cta, 'flash']]);
  const SFX = [[tt.open + 0.1, 'stamp', 0], [tt.who + 0.1, 'stamp', 0], [tt.title + 0.3, 'stamp', 0], [tt.cta, 'drum', 0], [END - 1.3, 'end', 0]];

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  root.innerHTML = `
    <div id="rs-dark"></div>
    <div id="rs-p1" class="rs-poster"><img src="${poster1}" alt=""></div>
    <div id="rs-p2" class="rs-poster"><img src="${poster2}" alt=""></div>
    <div id="rs-credit" class="rs-credit">poster by @_sebs.c_</div>
    <div id="rs-q" class="rs-quote"><div class="w"></div><div class="by">Konrad Sebs · Hegemony sniper</div></div>
    <div id="rs-tagB" class="rs-tag">HEGEMONY PILLBOX<small>from the plan that won the Front Council</small></div>
    <div id="rs-tagT" class="rs-tag">★ PROPAGANDIST OF THE HEGEMONY<small>Konrad Sebs · @_sebs.c_</small></div>
    <div id="rs-mk" class="rs-tag" style="border:0;background:none;font-size:40px;color:#d98f3f;padding:0">▼</div>
    <div id="rs-cta"><div class="big">DRAW FOR YOUR SIDE</div><div class="sm">Post your poster and tag @mudandiron.<br>The best ones will be shown here.</div></div>
    <div id="rd-big"></div>
    <div id="rd-sub"></div>
  `;
  document.body.appendChild(root);
  const paint = fxLayers(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };
  // plakát: vlétne (slam), pak pomalu přibližuje (Ken Burns)
  const poster = (sel, t, t0, t1, rot) => {
    const el = $(sel);
    const o = t >= t0 && t < t1 ? Math.min(1, (t - t0) / 0.2, (t1 - t) / 0.2) : 0;
    el.style.opacity = o;
    const u = clamp01((t - t0) / Math.max(0.1, t1 - t0)), k = Math.min(1, (t - t0) / 0.3);
    el.style.transform = `translate(-50%, -50%) rotate(${rot * (1 - k) + rot * 0.15}deg) scale(${(1.25 - 0.25 * k) * (1 + 0.06 * u)})`;
  };

  function frame(t) {
    const f = fx(t);
    for (const q of soldiers) if (q.vacant && q.sprite && q.sprite.alpha < 1) { q.sprite.alpha = 1; q.sprite.tint = [0xffffff, 0xf0ece4, 0xe6e2da, 0xfff4e8][q.variant % 4]; } // žádní duchové
    const [x, y, z] = camAt(t);
    cam.set(x, y, z * (1 + 0.03 * f.punch));
    const posters = t < tt.words;
    show('#rs-dark', posters ? 1 : 0);
    paint({ ...f, black: Math.max(f.black, t < 0.2 ? 1 - t / 0.2 : 0, t > END - 0.5 ? clamp01((t - END + 0.5) / 0.4) : 0) });
    poster('#rs-p1', t, 0.15, tt.who, -6);
    poster('#rs-p2', t, tt.who, tt.words, 5);
    show('#rs-credit', posters && t > 0.4 ? 1 : 0);
    const q = $('#rs-q');
    slam(q, t, tt.words + 0.6, tt.bunkers - 0.05, 1.3, -4);
    q.querySelector('.w').textContent = typed('"THE KAISER AND THE FATHERLAND DEMAND YOUR STEEL!"', t, tt.words + 0.8, 26);
    tagAt($('#rs-tagB'), { x: boxH.x, y: boxH.y + 44 }, cam, win(t, tt.bunkers + 0.3, tt.title - 0.05, 0.2), 0);
    tagAt($('#rs-tagT'), { x: me.x, y: me.y + 50 }, cam, win(t, tt.title + 0.3, tt.cta - 0.05, 0.2), 0);
    tagAt($('#rs-mk'), { x: me.x, y: me.y - 34 - Math.abs(Math.sin(t * 5)) * 4 }, cam, win(t, tt.words + 0.2, tt.bunkers - 0.05, 0.2) || win(t, tt.title + 0.2, tt.cta - 0.05, 0.2), 0); // šipka nad Konradem
    slam($('#rs-cta'), t, tt.cta + 0.2, END - 1.3, 1.3, -3);
    const logo = t >= END - 1.3;
    const bigEl = $('#rd-big');
    bigEl.style.opacity = logo ? Math.min(1, (t - END + 1.3) / 0.3) : 0;
    if (logo && !bigEl.dataset.on) { bigEl.dataset.on = 1; bigEl.className = 'logo'; bigEl.innerHTML = '<span>MUD <i>&amp;</i> IRON</span><span>@mudandiron · link in bio</span>'; }
    const s = sub(t);
    const subEl = $('#rd-sub');
    if (s && !logo) {
      subEl.style.opacity = 1;
      subEl.style.top = '9%';
      if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; }
    } else subEl.style.opacity = 0;
  }

  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
