// Reel pro sledující o podpoře (18. 11. 2026, uživatel: citlivě, „nejdu po penězích“, bez cen, krátké, 3 úrovně):
//  háček: voják se zlatou hvězdou v noci + „THESE SOLDIERS KEPT THE FRONT ALIVE“ → kamera po vojácích podporovatelů na mapě
//  (hvězda/stužka ze hry, jméno a @handle) → proč (hra zdarma, bez reklam) → tři úrovně jako odznaky (bez cen) → jemná výzva, „keep fighting“.
// Hlas: marketing/reels/bonds.script.json. /?reel=bonds&vacant=700 (jen vývojový server). v01py se neukazuje (nechce, aby se o podpoře vědělo).
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, slam, clamp01, win, tagAt } from './reel-kit.js';
import script from '../../marketing/reels/bonds.script.json';

const files = import.meta.glob('../../marketing/reels/bonds.vo.json', { eager: true, import: 'default' });

const P = [
  ['zidane_mcnamara', 'Edmund Mcnamara', 'Officers\' Mess', true],
  ['flying_wizzerd', 'Walter "Ghost" Wizzerd', 'Officers\' Mess', true],
  ['cwilliam357', 'Florian "Spark" Cwilliam', 'War Bonds', false],
  ['jwessels530', 'Ulrich Jwessels', 'War Bonds', false],
];

const CSS = `${BASE}${FX_CSS}
#rb-top { left: 5%; right: 5%; top: 13%; text-align: center; font-family: 'Silkscreen', monospace; font-size: 46px; line-height: 1.08; color: #e3d9c3; text-shadow: 5px 5px 0 #0e0d0c; background: rgba(14,13,12,0.6); padding: 12px 0; border-top: 3px solid #d98f3f; border-bottom: 3px solid #d98f3f; }
#rb-top b { color: #d98f3f; font-weight: 400; }
.rb-tag { position: absolute; transform: translate(-50%, -100%); font-family: 'Silkscreen', monospace; font-size: 24px; padding: 6px 12px; background: rgba(14,13,12,0.92); border: 3px solid #c9c26a; white-space: nowrap; text-align: center; opacity: 0; color: #e3d9c3; }
.rb-tag small { display: block; font-family: 'VT323', monospace; font-size: 26px; color: #c9c26a; }
.rb-tag.star { border-color: #d98f3f; } .rb-tag.star small { color: #d98f3f; }
#rb-why { left: 7%; right: 7%; top: 60%; text-align: center; background: rgba(14,13,12,0.92); border: 3px solid #524a3f; padding: 14px; opacity: 0; }
#rb-why .big { font-family: 'Silkscreen', monospace; font-size: 34px; color: #e3d9c3; line-height: 1.15; }
#rb-why .sm { font-family: 'VT323', monospace; font-size: 30px; color: #c9b99a; margin-top: 6px; }
#rb-tiers { left: 5%; right: 5%; top: 30%; display: flex; flex-direction: column; gap: 14px; }
.rb-tier { background: rgba(14,13,12,0.93); border: 3px solid #524a3f; padding: 12px 16px; display: flex; align-items: center; gap: 16px; opacity: 0; }
.rb-tier .ic { font-size: 50px; width: 64px; text-align: center; }
.rb-tier .t { font-family: 'Silkscreen', monospace; font-size: 30px; color: #e3d9c3; }
.rb-tier .d { font-family: 'VT323', monospace; font-size: 30px; color: #c9b99a; }
.rb-tier.gold { border-color: #d98f3f; } .rb-tier.gold .t { color: #d98f3f; }
#rb-cta { left: 7%; right: 7%; top: 60%; text-align: center; background: rgba(14,13,12,0.93); border: 4px solid #d98f3f; padding: 16px; opacity: 0; }
#rb-cta .big { font-family: 'Silkscreen', monospace; font-size: 36px; color: #d98f3f; line-height: 1.15; }
#rb-cta .sm { font-family: 'VT323', monospace; font-size: 30px; color: #e3d9c3; margin-top: 6px; }
#rb-night { inset: 0; background: rgba(40, 46, 90, 0.3); mix-blend-mode: multiply; }
#rb-mk { font-size: 40px; color: #d98f3f; }
`;

export async function startBondsReel({ cam, life, map, soldiers }) {
  let vo = files['../../marketing/reels/bonds.vo.json'];
  if (!vo) {
    let c = 0;
    vo = { lines: script.lines.map(([at, text, id]) => { const s = Math.max(at, c), d = text.length / 15 + 0.2; c = s + d + 0.25; return [s, d, text, id]; }) };
    vo.seconds = c + 2.2;
  }
  const C = cues(vo);
  const at = C.at, END = vo.seconds;
  const T = map.tile;
  const by = (h) => soldiers.find((s) => s.handle === h);
  const who = P.map(([h, n, tier, star]) => ({ s: by(h), h, n, tier, star })).filter((p) => p.s);
  const lineMid = (f) => { const l = soldiers.filter((s) => s.faction === f && s.slot?.line === 'front' && !s.vacant).sort((a, b) => a.x - b.x); return l[Math.floor(l.length / 2)]; };
  const mid = ((map.front[0] + map.front[1]) / 2) * T, mC = lineMid(1);
  const id = ['hook', 'names', 'why', 'tiers', 'cta'];
  const tt = Object.fromEntries(id.map((k) => [k, at(k)]));
  // jména: každý podporovatel svůj úsek času v části „names“
  const slot = (tt.why - tt.names) / Math.max(1, who.length);
  const first = who[0]?.s || mC;
  const K = [[0, first.x - 4, first.y - 24, 6.0], [tt.names - 0.01, first.x + 4, first.y - 24, 6.4]];
  who.forEach((p, i) => { const t0 = tt.names + i * slot; K.push([t0, p.s.x - 8, p.s.y - 24, 4.6, i ? 'cut' : undefined], [t0 + slot - 0.01, p.s.x + 8, p.s.y - 24, 5.0]); });
  K.push([tt.why, mC.x - 200, mid, 1.3, 'cut'], [tt.tiers - 0.01, mC.x + 200, mid, 1.4]);
  K.push([tt.tiers, mC.x + 200, mid, 1.4], [END, mC.x + 320, mid, 1.45]);
  const camAt = camPath(K.map((k) => k.filter((v) => v !== undefined)));
  const sub = subtitles(vo);
  const cuts = who.slice(1).map((_, i) => [tt.names + (i + 1) * slot, 'whip']);
  const fx = transitions([[tt.names, 'flash'], ...cuts, [tt.why, 'black', 0.3], [tt.tiers, 'flash']]);
  const SFX = [[tt.names, 'stamp', 0], [tt.tiers, 'drum', 0], [tt.tiers + 0.6, 'stamp', 0], [tt.tiers + 1.2, 'stamp', 0], [tt.tiers + 1.8, 'stamp', 0], [END - 1.3, 'end', 0]];
  const shooters = soldiers.filter((s) => !s.vacant && s.slot?.line === 'front' && Math.abs(s.x - mC.x) < 500);
  const shots = []; for (let k = 0, t = tt.why + 0.3; t < tt.tiers - 0.2; t += 0.45, k++) shots.push([t, shooters[(k * 29) % Math.max(1, shooters.length)]]);

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  root.innerHTML = `
    <div id="rb-night"></div>
    <div id="rb-top">THESE SOLDIERS<br><b>KEPT THE FRONT ALIVE</b></div>
    ${who.map((p, i) => `<div id="rb-p${i}" class="rb-tag ${p.star ? 'star' : ''}">${p.star ? '★ ' : '🎗 '}${esc(p.n.toUpperCase())}<small>@${esc(p.h)} · ${esc(p.tier)}</small></div>`).join('')}
    <div id="rb-mk" class="rb-tag" style="border:0;background:none;padding:0">▼</div>
    <div id="rb-why"><div class="big">FREE TO PLAY<br>NO ADS</div><div class="sm">New scenes, planes and shovels<br>are made with their help</div></div>
    <div id="rb-tiers">
      <div class="rb-tier"><div class="ic">🎗</div><div><div class="t">WAR BONDS</div><div class="d">a ribbon and your name in the Gazette</div></div></div>
      <div class="rb-tier"><div class="ic">✉</div><div><div class="t">FIELD POST</div><div class="d">letters from behind the scenes</div></div></div>
      <div class="rb-tier gold"><div class="ic">★</div><div><div class="t">OFFICERS' MESS</div><div class="d">a gold star over your soldier</div></div></div>
    </div>
    <div id="rb-cta"><div class="big">SUPPORT THE FRONT</div><div class="sm">link in bio · no game advantage, only honour<br>or just keep fighting. that helps too.</div></div>
    <div id="rd-big"></div>
    <div id="rd-sub"></div>
  `;
  document.body.appendChild(root);
  const paint = fxLayers(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };
  let si = 0;

  function frame(t) {
    const f = fx(t);
    for (const q of soldiers) if (q.vacant && q.sprite && q.sprite.alpha < 1) { q.sprite.alpha = 1; q.sprite.tint = [0xffffff, 0xf0ece4, 0xe6e2da, 0xfff4e8][q.variant % 4]; } // žádní duchové
    const [x, y, z] = camAt(t);
    cam.set(x, y, z * (1 + 0.03 * f.punch));
    while (si < shots.length && shots[si][0] <= t) { if (shots[si][1]) life.debug.shoot([shots[si][1]]); si++; }
    show('#rb-night', t < tt.why || t >= tt.tiers ? 1 : 0.4);
    paint({ ...f, black: Math.max(f.black, t > END - 0.5 ? clamp01((t - END + 0.5) / 0.4) : 0) });
    const top = $('#rb-top');
    top.style.opacity = t < tt.names ? 1 : 0;
    top.style.transform = `scale(${1 + 0.1 * clamp01(1 - t / 0.25)})`;
    who.forEach((p, i) => {
      const t0 = tt.names + i * slot;
      tagAt($(`#rb-p${i}`), { x: p.s.x, y: p.s.y + 50 }, cam, win(t, t0 + 0.15, t0 + slot - 0.05, 0.12), 0);
    });
    if (t < tt.names) tagAt($('#rb-mk'), { x: first.x, y: first.y - 34 - Math.abs(Math.sin(t * 5)) * 4 }, cam, 1, 0);
    else { const i = Math.min(who.length - 1, Math.floor((t - tt.names) / slot)), p = who[i]; tagAt($('#rb-mk'), { x: p?.s.x ?? 0, y: (p?.s.y ?? 0) - 34 - Math.abs(Math.sin(t * 5)) * 4 }, cam, t < tt.why ? 1 : 0, 0); }
    show('#rb-why', win(t, tt.why + 0.2, tt.tiers - 0.05, 0.2));
    show('#rb-tiers', t >= tt.tiers - 0.1 && t < tt.cta + 0.6 ? 1 : 0);
    root.querySelectorAll('.rb-tier').forEach((el, i) => { const a = tt.tiers + 0.6 * i; el.style.opacity = t >= a && t < END - 1.4 && t < tt.cta + 0.6 ? Math.min(1, (t - a) / 0.2) : 0; el.style.transform = `scale(${1 + 0.15 * clamp01(1 - (t - a) / 0.2)})`; });
    slam($('#rb-cta'), t, tt.cta + 0.3, END - 1.4, 1.2, -2);
    const logo = t >= END - 1.3;
    const bigEl = $('#rd-big');
    bigEl.style.opacity = logo ? Math.min(1, (t - END + 1.3) / 0.3) : 0;
    if (logo && !bigEl.dataset.on) { bigEl.dataset.on = 1; bigEl.className = 'logo'; bigEl.innerHTML = '<span>MUD <i>&amp;</i> IRON</span><span>@mudandiron · link in bio</span>'; }
    const s = sub(t);
    const subEl = $('#rd-sub');
    if (s && !logo && t >= tt.names) {
      subEl.style.opacity = 1;
      subEl.style.top = '13%';
      if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; }
    } else subEl.style.opacity = 0;
  }

  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
