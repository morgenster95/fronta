// Náborový reel „1,000+“ (19. 11. 2026, testovací reel pro neodběratele, na výšku): oslava přes tisíc vojáků a představení rolí.
// Háček: počítadlo skutečných hráčů letí přes 1 000 nad celou frontou → „every one of them started as a comment“ (bubliny se skutečnými @handle)
// → přehlídka rolí: voják Hegemonie a voják Concordu se otáčejí dokola (8 směrů spritů ze hry, 1 px = 8 px, žádná průhlednost),
// jméno role a jedna věta → výzva „comment your side and your role“ (bublina „CONCORD medic“). Konec navazuje na začátek.
// Hlas: marketing/reels/thousand.script.json. /?reel=thousand&vacant=700 (jen vývojový server).
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, slam, clamp01, win, typed, easeOut } from './reel-kit.js';
import script from '../../marketing/reels/thousand.script.json';

const files = import.meta.glob('../../marketing/reels/thousand.vo.json', { eager: true, import: 'default' });
const DIRS = ['south', 'south-west', 'west', 'north-west', 'north', 'north-east', 'east', 'south-east'];
const ROLES = [
  ['rifleman', 'RIFLEMAN', 'holds the line'],
  ['machinegunner', 'MACHINE GUNNER', 'owns the line'],
  ['sniper', 'SNIPER', 'duels across the wire'],
  ['medic', 'MEDIC', 'carries the wounded out'],
  ['runner', 'RUNNER', 'orders under fire'],
  ['sapper', 'SAPPER', 'digs under the enemy'],
  ['signaller', 'SIGNALLER', 'keeps the wires alive'],
  ['cook', 'FIELD COOK', 'feeds the line'],
  ['chaplain', 'CHAPLAIN', 'keeps the faith'],
  ['pilot', 'PILOT', 'flies above it all'],
];

const CSS = `${BASE}${FX_CSS}
#rt-dim { inset: 0; background: rgba(14,13,12,0.62); }
#rt-count { left: 0; right: 0; top: 30%; text-align: center; font-family: 'Silkscreen', monospace; color: #e3d9c3; text-shadow: 6px 6px 0 #0e0d0c; }
#rt-count b { display: block; font-size: 130px; font-weight: 400; color: #d98f3f; line-height: 1; }
#rt-count span { font-size: 34px; letter-spacing: 0.06em; }
.rt-bub { position: absolute; left: 50%; width: 70%; background: #f4f1ea; color: #111; border-radius: 20px; padding: 10px 16px; font-family: Arial, Helvetica, sans-serif; box-shadow: 0 6px 0 rgba(0,0,0,0.45); opacity: 0; }
.rt-bub .u { font-size: 21px; font-weight: 700; } .rt-bub .c { font-size: 32px; font-weight: 700; letter-spacing: 0.02em; }
#rt-stage { left: 0; right: 0; top: 30%; height: 330px; opacity: 0; }
#rt-stage canvas { position: absolute; width: 256px; height: 256px; image-rendering: pixelated; top: 20px; }
#rt-stage .ped { position: absolute; width: 190px; height: 26px; top: 252px; background: radial-gradient(ellipse at 50% 50%, rgba(14,13,12,0.85), rgba(14,13,12,0)); }
#rt-stage .fl { position: absolute; top: 0; font-family: 'Silkscreen', monospace; font-size: 20px; letter-spacing: 0.1em; }
#rt-role { left: 4%; right: 4%; top: 13%; text-align: center; opacity: 0; }
#rt-role .k { font-family: 'Silkscreen', monospace; font-size: 18px; color: #c9b99a; letter-spacing: 0.3em; }
#rt-role .n { font-family: 'Silkscreen', monospace; font-size: 44px; white-space: nowrap; color: #e3d9c3; text-shadow: 5px 5px 0 #0e0d0c; line-height: 1.05; }
#rt-role .d { font-size: 34px; color: #d98f3f; }
#rt-dots { left: 0; right: 0; top: 70%; text-align: center; font-size: 26px; letter-spacing: 6px; color: #524a3f; opacity: 0; }
#rt-dots b { color: #d98f3f; font-weight: 400; }
#rt-cta { left: 6%; right: 6%; top: 60%; text-align: center; background: rgba(14,13,12,0.93); border: 4px solid #d98f3f; padding: 14px; opacity: 0; }
#rt-cta .big { font-family: 'Silkscreen', monospace; font-size: 34px; color: #d98f3f; line-height: 1.15; }
#rt-cta .sm { font-family: 'VT323', monospace; font-size: 30px; color: #e3d9c3; margin-top: 6px; }
`;

export async function startThousandReel({ cam, life, map, soldiers, tex }) {
  let vo = files['../../marketing/reels/thousand.vo.json'];
  if (!vo) {
    let c = 0;
    vo = { lines: script.lines.map(([at, text, id]) => { const s = Math.max(at, c), d = text.length / 15 + 0.2; c = s + d + 0.25; return [s, d, text, id]; }) };
    vo.seconds = c + 1.6;
  }
  const C = cues(vo);
  const at = C.at, END = vo.seconds;
  const T = map.tile;
  const tt = Object.fromEntries(script.lines.map((l) => [l[2], at(l[2])]));
  const real = soldiers.filter((s) => !s.vacant);
  const N = real.length;
  const mid = ((map.front[0] + map.front[1]) / 2) * T;
  const cx = real[Math.floor(real.length / 2)]?.x || 0;
  const handles = real.filter((s) => s.handle && s.handle.length < 16).slice(-60);
  const pickH = (i) => handles[(i * 17) % Math.max(1, handles.length)];
  const bubs = [0, 1, 2].map((i) => { const s = pickH(i + 3); return { h: s?.handle || 'you', w: s?.faction === 0 ? 'HEGEMONY' : 'CONCORD' }; });

  const K = [[0, cx - 400, mid, 0.55], [tt.comment, cx + 300, mid, 0.62], [tt.pick, cx, mid, 0.6], [END, cx + 600, mid, 0.7]];
  const camAt = camPath(K);
  const sub = subtitles(vo);
  const roleT = ROLES.map(([id]) => tt[id]);
  const fx = transitions([[tt.comment, 'whip'], [tt.pick, 'flash'], ...roleT.map((x) => [x, 'flash']), [tt.cta, 'flash']]);
  const SFX = [[0.2, 'drum', 0], [tt.comment, 'type', 0], ...roleT.map((x) => [+x.toFixed(2), 'stamp', 0]), [tt.cta, 'drum', 0], [END - 0.8, 'end', 0]];
  const shooters = real.filter((s) => s.slot?.line === 'front');
  const shots = []; for (let t = 0.3; t < END; t += 0.35) shots.push([t, shooters[Math.floor((t * 977) % shooters.length)]]);

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  root.innerHTML = `
    <div id="rt-dim"></div>
    <div id="rt-count"><b>0</b><span>SOLDIERS AT WAR</span></div>
    ${bubs.map((b, i) => `<div class="rt-bub" id="rt-b${i}" style="top:${30 + i * 15}%"><div class="u">@${b.h}</div><div class="c">${b.w}</div></div>`).join('')}
    <div id="rt-role"><div class="k">PICK YOUR ROLE</div><div class="n"></div><div class="d"></div></div>
    <div id="rt-stage"><canvas id="rt-h" width="32" height="32" style="left:4%"></canvas><canvas id="rt-c" width="32" height="32" style="right:4%"></canvas>
      <div class="ped" style="left:calc(4% + 33px)"></div><div class="ped" style="right:calc(4% + 33px)"></div>
      <div class="fl" style="left:calc(4% + 60px);color:#a7b4bb">HEGEMONY</div><div class="fl" style="right:calc(4% + 64px);color:#c9c26a">CONCORD</div></div>
    <div id="rt-dots">${ROLES.map(() => '■').join('')}</div>
    <div class="rt-bub" id="rt-me" style="top:42%"><div class="u">@you</div><div class="c"></div></div>
    <div id="rt-cta"><div class="big">COMMENT YOUR SIDE<br>+ YOUR ROLE</div><div class="sm">HEGEMONY medic · CONCORD sniper<br>free game · link in bio</div></div>
    <div id="rd-sub"></div>
  `;
  document.body.appendChild(root);
  const paint = fxLayers(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };
  const ctxH = $('#rt-h').getContext('2d'), ctxC = $('#rt-c').getContext('2d');
  const keyOf = (f, role) => `${f ? 'concord' : 'hegemony'}${role === 'rifleman' ? '' : `_${role}`}`;
  const drawSprite = (g, key, dir) => {
    const tx = tex[key]?.[dir] || tex[key]?.south;
    g.clearRect(0, 0, 32, 32);
    if (!tx?.source?.resource) return;
    const f = tx.frame;
    g.imageSmoothingEnabled = false;
    g.drawImage(tx.source.resource, f.x, f.y, f.width, f.height, (32 - f.width) / 2, 32 - f.height, f.width, f.height);
  };
  let si = 0;

  function frame(t) {
    const f = fx(t);
    for (const q of soldiers) if (q.sprite && q.sprite.alpha < 1) { q.sprite.alpha = 1; q.sprite.tint = [0xffffff, 0xf0ece4, 0xe6e2da, 0xfff4e8][q.variant % 4]; } // žádní duchové
    const [x, y, z] = camAt(t);
    cam.set(x, y, z);
    while (si < shots.length && shots[si][0] <= t) { if (shots[si][1]) life.debug.shoot([shots[si][1]]); si++; }
    paint({ ...f, black: Math.max(f.black, t > END - 0.35 ? clamp01((t - END + 0.35) / 0.3) : 0) });
    // háček: počítadlo přes 1 000
    show('#rt-count', t < tt.comment ? 1 : t < tt.pick ? 0.25 : 0);
    $('#rt-count b').textContent = Math.round(N * easeOut(clamp01(t / 1.6))).toLocaleString('en-US');
    $('#rt-count').style.transform = `scale(${1 + 0.15 * clamp01(1 - t / 0.3)})`;
    bubs.forEach((_, i) => { const a = tt.comment + i * 0.45; const el = $(`#rt-b${i}`); el.style.opacity = t >= a && t < tt.pick ? Math.min(1, (t - a) / 0.15) : 0; el.style.transform = `translate(-50%, ${(1 - easeOut(clamp01((t - a) / 0.3))) * 40}px) rotate(${(i - 1) * 2}deg)`; });
    // přehlídka rolí: oba se otáčejí (8 směrů, 0,11 s na směr)
    const ri = ROLES.findIndex((_, i) => t >= roleT[i] && (i === ROLES.length - 1 ? t < tt.cta : t < roleT[i + 1]));
    const stageOn = t >= tt.pick && t < tt.cta;
    show('#rt-stage', stageOn ? 1 : 0);
    show('#rt-role', stageOn ? 1 : 0);
    show('#rt-dots', stageOn ? 1 : 0);
    if (stageOn) {
      const role = ri >= 0 ? ROLES[ri] : ROLES[0];
      const dir = DIRS[Math.floor(t / 0.11) % 8];
      drawSprite(ctxH, keyOf(0, role[0]), dir);
      drawSprite(ctxC, keyOf(1, role[0]), DIRS[(Math.floor(t / 0.11) + 4) % 8]);
      $('#rt-role .n').textContent = ri >= 0 ? role[1] : 'TEN ROLES';
      $('#rt-role .d').textContent = ri >= 0 ? role[2] : 'one comment each';
      $('#rt-role').style.transform = `scale(${ri >= 0 ? 1 + 0.12 * clamp01(1 - (t - roleT[ri]) / 0.2) : 1})`;
      $('#rt-dots').innerHTML = ROLES.map((_, i) => (i === ri ? '<b>■</b>' : '■')).join('');
    }
    // výzva: bublina „CONCORD medic“ se napíše
    const me = $('#rt-me');
    me.style.opacity = t >= tt.cta && t < END - 0.3 ? 1 : 0;
    me.style.transform = 'translate(-50%, -40px)';
    $('#rt-me .c').textContent = typed('CONCORD medic', t, tt.cta + 0.1, 16);
    slam($('#rt-cta'), t, tt.cta + 0.9, END - 0.2, 1.3, -3);
    show('#rt-dim', 1);
    const s = sub(t);
    const subEl = $('#rd-sub');
    if (s && t >= tt.comment && !stageOn) { subEl.style.opacity = 1; subEl.style.top = '13%'; if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; } } else subEl.style.opacity = 0;
  }

  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
