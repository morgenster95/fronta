// Testovací (trial) reel „I let 2,000 strangers fight a war in my comments“ (21. 11. 2026), varianta trialA s aktuálními čísly a novinkami:
// háček nad hořící frontou → počítadlo skutečných hráčů a padlých (z roster.fallen) → dělo z Grey Mill pálí na mapě (window.__front.gunFx)
// → „then I gave them dogs“ (skuteční psi patronů, bez v01py) → upoutávka na minu (závod o Bone Quarry) → výzva. ~20 s, konec navazuje na začátek.
// /?reel=trialC&vacant=700 (jen vývojový server). Hlas: marketing/reels/trialC.script.json.
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, slam, clamp01, win, easeOut, tagAt } from './reel-kit.js';
import script from '../../marketing/reels/trialC.script.json';
import dogData from '../../marketing/reels/dogs.data.json';

const files = import.meta.glob('../../marketing/reels/trialC.vo.json', { eager: true, import: 'default' });
const HIDE = new Set(['v01py']);
const BREED = { airedale: 'AIREDALE', shepherd: 'GERMAN SHEPHERD', jackrussell: 'JACK RUSSELL', collie: 'BORDER COLLIE', dachshund: 'DACHSHUND' };

const CSS = `${BASE}${FX_CSS}
#tc-top { left: 4%; right: 4%; top: 14%; text-align: center; font-family: 'Silkscreen', monospace; font-size: 50px; line-height: 1.05; color: #e3d9c3; text-shadow: 5px 5px 0 #0e0d0c; }
#tc-top b { color: #d98f3f; font-weight: 400; }
#tc-count { left: 4%; right: 4%; top: 58%; display: flex; justify-content: space-around; font-family: 'Silkscreen', monospace; text-align: center; opacity: 0; background: rgba(14,13,12,0.9); border: 3px solid #524a3f; padding: 14px 6px; }
#tc-count b { display: block; font-size: 72px; font-weight: 400; line-height: 1; color: #e3d9c3; } #tc-count .f b { color: #c8553d; }
#tc-count span { font-size: 22px; color: #c9b99a; letter-spacing: 0.08em; }
.tc-tag { position: absolute; transform: translate(-50%, -100%); font-family: 'Silkscreen', monospace; font-size: 26px; padding: 6px 12px; background: rgba(14,13,12,0.92); border: 3px solid #d98f3f; white-space: nowrap; color: #e3d9c3; opacity: 0; text-align: center; }
.tc-tag small { display: block; font-family: 'VT323', monospace; font-size: 26px; color: #c9b99a; }
#tc-mine { left: 6%; right: 6%; top: 40%; text-align: center; background: rgba(14,13,12,0.94); border: 4px solid #a33b2b; padding: 18px 12px; opacity: 0; font-family: 'Silkscreen', monospace; }
#tc-mine .k { font-size: 22px; color: #c9b99a; letter-spacing: 0.2em; } #tc-mine .big { font-size: 46px; color: #c8553d; line-height: 1.1; margin: 6px 0; } #tc-mine .sm { font-family: 'VT323', monospace; font-size: 32px; color: #e3d9c3; }
#tc-cta { left: 6%; right: 6%; top: 60%; text-align: center; background: rgba(14,13,12,0.94); border: 4px solid #d98f3f; padding: 14px; opacity: 0; }
#tc-cta .big { font-family: 'Silkscreen', monospace; font-size: 34px; color: #d98f3f; line-height: 1.15; } #tc-cta .sm { font-family: 'VT323', monospace; font-size: 30px; color: #e3d9c3; margin-top: 6px; }
`;

export async function startTrialCReel({ cam, life, map, soldiers }) {
  const roster = await fetch('/data/roster.json').then((r) => r.json()).catch(() => null);
  const dogName = Object.fromEntries(dogData.map((d) => [d.handle, d.dog.name]));
  let vo = files['../../marketing/reels/trialC.vo.json'];
  if (!vo) {
    let c = 0;
    vo = { lines: script.lines.map(([at, text, id]) => { const s = Math.max(at, c), d = text.length / 15 + 0.2; c = s + d + 0.25; return [s, d, text, id]; }) };
    vo.seconds = c + 1.6;
  }
  const C = cues(vo);
  const at = C.at, END = vo.seconds;
  const T = map.tile;
  const tt = Object.fromEntries(script.lines.map((l) => [l[2], at(l[2])]));
  const real = soldiers.filter((s) => !s.vacant && s.handle);
  const N = real.length;
  const fallen = roster?.fallen ? roster.fallen[0] + roster.fallen[1] : 0;
  const front = (f) => soldiers.filter((s) => s.faction === f && s.slot?.line === 'front').sort((a, b) => a.x - b.x);
  const fC = front(1), mC = fC[Math.floor(fC.length / 2)] || real[0];
  const mid = ((map.front[0] + map.front[1]) / 2) * T;
  const gunFx = window.__front?.gunFx;
  const gun = gunFx?.guns?.[0];
  const dogs = real.filter((s) => s.dog && s.dogSprite && !HIDE.has(s.handle)).sort((a, b) => (a.handle === 'rakan_1027' ? -1 : b.handle === 'rakan_1027' ? 1 : 0)).slice(0, 2);
  const K = [[0, mC.x, mC.y - 50, 2.3], [tt.real - 0.01, mC.x + 70, mC.y - 50, 2.5], [tt.real, mC.x, mid, 0.9, 'cut'], [tt.gun - 0.01, mC.x + 260, mid, 0.85]];
  if (gun) K.push([tt.gun, gun.x - 30, gun.y - 10, 3.4, 'cut'], [tt.dogs - 0.01, gun.x + 10, gun.y - 10, 3.6]);
  const dSpan = (tt.mine - tt.dogs) / Math.max(1, dogs.length);
  dogs.forEach((d, i) => { const t0 = tt.dogs + i * dSpan; K.push([t0, d.x - 6, d.y - 16, 5.2, 'cut'], [t0 + dSpan - 0.01, d.x + 6, d.y - 16, 5.6]); });
  K.push([tt.mine, mC.x, mC.y - 40, 2.0, 'cut'], [tt.cta - 0.01, mC.x + 80, mC.y - 40, 2.1], [tt.cta, mC.x, mid, 1.1, 'cut'], [END, mC.x + 60, mid, 1.15]);
  const camAt = camPath(K);
  const sub = subtitles(vo);
  const fx = transitions([[tt.real, 'whip'], [tt.gun, 'whip'], [tt.dogs, 'flash'], [tt.mine, 'whip'], [tt.cta, 'flash']]);
  const booms = [[0.05, mC.x + 30, mC.y - 70, true], [0.55, mC.x - 90, mC.y - 110, false], [1.0, mC.x + 120, mC.y - 40, true], [1.6, mC.x - 40, mC.y - 140, false], [2.2, mC.x + 60, mC.y - 100, true],
    [tt.mine + 0.5, mC.x + 40, mC.y + 30, true], [tt.mine + 0.8, mC.x - 30, mC.y + 40, true], [tt.mine + 1.1, mC.x + 10, mC.y + 20, true]];
  const shots = real.filter((s) => s.slot?.line === 'front' && Math.abs(s.x - mC.x) < 160).slice(0, 8).map((s, i) => [0.1 + i * 0.25, s]);
  const SFX = [[tt.real, 'drum', 0], [tt.dogs, 'drum', 0], [tt.cta, 'drum', 0], [END - 0.8, 'end', 0]];
  for (const [t0] of shots) SFX.push([+t0.toFixed(2), 'shoot', 0]);
  for (const [t0, , , big] of booms) SFX.push([+t0.toFixed(2), 'shell', big ? 1 : 0]);
  const GUNAT = tt.gun + 0.5; SFX.push([+GUNAT.toFixed(2), 'shell', 1]);

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  const nTxt = N >= 1000 ? `${(Math.floor(N / 100) * 100).toLocaleString('en-US')}` : String(N);
  root.innerHTML = `
    <div id="tc-top">I LET <b>${nTxt} STRANGERS</b><br>FIGHT A WAR<br>IN MY COMMENTS</div>
    <div id="tc-count"><div><b>0</b><span>REAL PLAYERS</span></div><div class="f"><b>0</b><span>FALLEN</span></div></div>
    <div id="tc-gun" class="tc-tag">THE GREY MILL GUN<small>captured by the players</small></div>
    ${dogs.map((d, i) => `<div id="tc-d${i}" class="tc-tag">🐕 ${(dogName[d.handle] || '').toUpperCase()}<small>${BREED[d.dog] || 'TRENCH DOG'} · with @${d.handle}</small></div>`).join('')}
    <div id="tc-mine"><div class="k">NEXT ON THE FRONT</div><div class="big">A MINE UNDER<br>THE ENEMY LINE</div><div class="sm">first side to 300 new soldiers digs it</div></div>
    <div id="tc-cta"><div class="big">COMMENT ONE WORD:<br>HEGEMONY OR CONCORD</div><div class="sm">free game · you're in within minutes</div></div>
    <div id="rd-sub"></div>
  `;
  document.body.appendChild(root);
  const paint = fxLayers(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };
  let bi = 0, si = 0, fired = false;

  function frame(t) {
    const f = fx(t);
    for (const q of soldiers) if (q.vacant && q.sprite && q.sprite.alpha < 1) { q.sprite.alpha = 1; q.sprite.tint = [0xffffff, 0xf0ece4, 0xe6e2da, 0xfff4e8][q.variant % 4]; }
    const [x, y, z] = camAt(t);
    cam.set(x, y, z * (1 + 0.05 * f.punch));
    while (si < shots.length && shots[si][0] <= t) { life.debug.shoot([shots[si][1]]); si++; }
    while (bi < booms.length && booms[bi][0] <= t) { const [, bx, by0, big] = booms[bi]; life.debug.shell?.(bx, by0, big); bi++; }
    if (!fired && t >= GUNAT && gunFx) { gunFx.fire(); fired = true; }
    paint({ ...f, black: Math.max(f.black, t > END - 0.35 ? clamp01((t - END + 0.35) / 0.3) : 0) });
    const tp = $('#tc-top');
    tp.style.opacity = t < tt.real ? 1 : 0;
    tp.style.transform = `scale(${1 + 0.12 * clamp01(1 - t / 0.25)})`;
    show('#tc-count', win(t, tt.real + 0.2, tt.gun - 0.05, 0.15));
    const u = easeOut(clamp01((t - tt.real - 0.2) / 1.4));
    $('#tc-count div b').textContent = Math.round(N * u).toLocaleString('en-US');
    $('#tc-count .f b').textContent = Math.round(fallen * u).toLocaleString('en-US');
    if (gun) tagAt($('#tc-gun'), { x: gun.x, y: gun.y - 20 }, cam, win(t, tt.gun + 0.2, tt.dogs - 0.05, 0.12), 0);
    dogs.forEach((d, i) => { const t0 = tt.dogs + i * dSpan; tagAt($(`#tc-d${i}`), { x: d.x + 11, y: d.y }, cam, win(t, t0 + 0.15, t0 + dSpan - 0.05, 0.1), 24); });
    slam($('#tc-mine'), t, tt.mine + 0.1, tt.cta - 0.05, 1.3, -3);
    slam($('#tc-cta'), t, tt.cta, END - 0.2, 1.3, -3);
    const s = sub(t);
    const subEl = $('#rd-sub');
    if (s && t >= tt.real) { subEl.style.opacity = 1; subEl.style.top = '13%'; if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; } } else subEl.style.opacity = 0;
  }
  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
