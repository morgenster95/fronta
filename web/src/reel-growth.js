// Akviziční reel „Day 1 vs Day 11“ (20. 11. 2026; /?reel=growth&vacant=700, jen vývojový server), na výšku, trial reel.
// Timelapse: fronta se plní skutečnými vojáky v pořadí narukování, den po dni podle počtů z novin (git: 10.–20. 11.), s počítadlem dne,
// vojáků a padlých. Nakonec plná fronta a výzva. Neobsazená místa nejsou vidět vůbec (žádní duchové). Hlas: growth.script.json.
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, slam, clamp01, win, easeOut } from './reel-kit.js';
import script from '../../marketing/reels/growth.script.json';

const files = import.meta.glob('../../marketing/reels/growth.vo.json', { eager: true, import: 'default' });
// počty vojáků a padlých po ranních novinách (Day 1 = 10. 11.)
const DAYS = [[1, 124, 0], [2, 168, 0], [3, 241, 6], [4, 322, 20], [5, 370, 29], [6, 433, 54], [7, 466, 71], [8, 501, 90], [9, 634, 123], [10, 1429, 249], [11, 1823, 358]];

const CSS = `${BASE}${FX_CSS}
#rg-day { left: 0; right: 0; top: 14%; text-align: center; font-family: 'Silkscreen', monospace; color: #e3d9c3; text-shadow: 6px 6px 0 #0e0d0c; opacity: 0; }
#rg-day .d { font-size: 96px; line-height: 1; } #rg-day .d b { font-weight: 400; color: #d98f3f; }
#rg-stats { left: 6%; right: 6%; top: 66%; display: flex; justify-content: space-around; background: rgba(14,13,12,0.9); border: 3px solid #524a3f; padding: 14px 8px; opacity: 0; font-family: 'Silkscreen', monospace; text-align: center; }
#rg-stats b { display: block; font-size: 64px; font-weight: 400; line-height: 1; } #rg-stats span { font-size: 22px; color: #c9b99a; letter-spacing: 0.08em; }
#rg-stats .s b { color: #e3d9c3; } #rg-stats .f b { color: #c8553d; }
#rg-hook { left: 5%; right: 5%; top: 36%; text-align: center; font-family: 'Silkscreen', monospace; color: #e3d9c3; text-shadow: 5px 5px 0 #0e0d0c; background: rgba(14,13,12,0.82); padding: 14px 8px 18px; border-top: 3px solid #d98f3f; border-bottom: 3px solid #d98f3f; opacity: 0; }
#rg-hook .a { font-size: 34px; line-height: 1.2; } #rg-hook .b { font-size: 54px; color: #d98f3f; line-height: 1.1; margin-top: 6px; }
#rg-cta { left: 6%; right: 6%; top: 56%; text-align: center; background: rgba(14,13,12,0.95); border: 4px solid #d98f3f; padding: 16px; opacity: 0; }
#rg-cta .big { font-family: 'Silkscreen', monospace; font-size: 40px; color: #d98f3f; line-height: 1.15; }
#rg-cta .sm { font-family: 'VT323', monospace; font-size: 32px; color: #e3d9c3; margin-top: 6px; }
#rg-cta .url { font-family: 'Silkscreen', monospace; font-size: 32px; color: #e3d9c3; margin-top: 10px; border-top: 2px solid #524a3f; padding-top: 10px; }
`;

export async function startGrowthReel({ cam, life, map, soldiers }) {
  let vo = files['../../marketing/reels/growth.vo.json'];
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
  const order = new Map(real.map((s, i) => [s, i])); // pořadí v soupisce = pořadí narukování
  const mid = ((map.front[0] + map.front[1]) / 2) * T;
  const xs = real.map((s) => s.x).sort((a, b) => a - b);
  const x0 = xs[Math.floor(xs.length * 0.05)], x1 = xs[Math.floor(xs.length * 0.95)], xc = xs[Math.floor(xs.length / 2)];
  // časová osa: Day 1 drží do „grow“, pak dny 2–11 do „now“ (Day 10 skok přes „boom“)
  const G0 = tt.grow, G1 = tt.now;
  const dayAt = (t) => (t < G0 ? 1 : t >= G1 ? 11 : 1 + 10 * clamp01((t - G0) / (G1 - G0)));
  const statAt = (d) => { const i = Math.min(DAYS.length - 2, Math.floor(d) - 1), u = d - Math.floor(d); if (d >= 11) return DAYS[10]; return [d, DAYS[i][1] + (DAYS[i + 1][1] - DAYS[i][1]) * u, DAYS[i][2] + (DAYS[i + 1][2] - DAYS[i][2]) * u]; };
  // kamera na zákopu Concordu (blíž, ať je vidět, jak se plní), pak pomalé oddálení přes obě linie
  const cy = (real.find((s) => s.faction === 1 && s.slot?.line === 'front') || real[0]).y;
  const K = [[0, xc, cy - 20, 1.6], [G0, xc + 120, cy - 20, 1.5], [G1, xc + 480, cy - 30, 1.25], [tt.cta - 0.01, xc + 700, mid, 0.75, 'ease'], [tt.cta, xc, mid, 0.9, 'cut'], [END, xc + 200, mid, 0.95]];
  const camAt = camPath(K);
  const sub = subtitles(vo);
  const fx = transitions([[tt.boom, 'flash'], [tt.now, 'flash'], [tt.cta, 'black', 0.4]]);
  const SFX = [[tt.hook, 'drum', 0], [tt.grow, 'drum', 0], [tt.boom, 'drum', 0], [tt.now, 'drum', 0], [tt.cta, 'drum', 0], [END - 1.3, 'end', 0]];
  const shots = []; for (let t = tt.now + 0.3, k = 0; t < tt.cta; t += 0.15, k++) shots.push([t, real[(k * 53) % real.length]]);
  let si = 0;

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  root.innerHTML = `
    <div id="rg-day"><div class="d">DAY <b>1</b></div></div>
    <div id="rg-hook"><div class="a">I STARTED A WAR IN MY</div><div class="b">INSTAGRAM<br>COMMENTS</div></div>
    <div id="rg-stats"><div class="s"><b>0</b><span>SOLDIERS</span></div><div class="f"><b>0</b><span>FALLEN</span></div></div>
    <div id="rg-cta"><div class="big">DAY 12 STARTS<br>TOMORROW</div><div class="sm">comment HEGEMONY or CONCORD on @mudandiron</div><div class="url">mudandiron.app</div></div>
    <div id="rd-big"></div>
    <div id="rd-sub"></div>
  `;
  document.body.appendChild(root);
  const paint = fxLayers(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };

  function frame(t) {
    const f = fx(t);
    const [x, y, z] = camAt(t);
    cam.set(x, y, z);
    const d = dayAt(t), [, n, fallen] = statAt(d);
    const cnt = t >= tt.now ? real.length : Math.round(n);
    for (const q of soldiers) if (q.sprite) {
      if (q.vacant) { q.sprite.visible = false; continue; } // neobsazená místa vůbec (žádní duchové)
      q.sprite.visible = (order.get(q) ?? 1e9) < cnt;
    }
    while (si < shots.length && shots[si][0] <= t) { if (shots[si][1]) life.debug.shoot([shots[si][1]]); si++; }
    paint({ ...f, black: Math.max(f.black, t > END - 0.6 ? clamp01((t - END + 0.6) / 0.5) : 0) });
    const dayOn = t < tt.cta;
    show('#rg-day', dayOn ? 1 : 0);
    $('#rg-day b').textContent = String(Math.floor(d));
    show('#rg-hook', win(t, 0.1, tt.grow - 0.1, 0.2));
    show('#rg-stats', t >= tt.grow - 0.2 && t < tt.cta ? 1 : 0);
    $('#rg-stats .s b').textContent = cnt.toLocaleString('en-US');
    $('#rg-stats .f b').textContent = Math.round(fallen).toLocaleString('en-US');
    slam($('#rg-cta'), t, tt.cta + 0.3, END - 1.4, 1.3, -3);
    const logo = t >= END - 1.3;
    const bigEl = $('#rd-big');
    bigEl.style.opacity = logo ? Math.min(1, (t - END + 1.3) / 0.3) : 0;
    if (logo && !bigEl.dataset.on) { bigEl.dataset.on = 1; bigEl.className = 'logo'; bigEl.innerHTML = '<span>MUD <i>&amp;</i> IRON</span><span>@mudandiron · mudandiron.app</span>'; }
    const s = sub(t);
    const subEl = $('#rd-sub');
    if (s && !logo && t >= tt.grow) { subEl.style.opacity = 1; subEl.style.top = '8%'; if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; } } else subEl.style.opacity = 0;
  }

  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
