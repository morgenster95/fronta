// Krátký náborový reel pro nové publikum (17. 11. 2026, ~14 s, smyčka): v první vteřině háček „tvůj komentář = voják“,
// komentář „CONCORD“ se napíše do bubliny, spadne do zákopu a na prázdném stanovišti se objeví voják se jmenovkou → rychlý odjezd
// na celou frontu s počtem skutečných hráčů → střihy boje (výstřely, granát, zdravotník) → PICK A SIDE → výzva; konec navazuje na začátek.
// /?reel=hook&vacant=700 (jen vývojový server).
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, slam, clamp01, win, typed, easeOut, tagAt } from './reel-kit.js';
import script from '../../marketing/reels/hook.script.json';

const files = import.meta.glob('../../marketing/reels/hook.vo.json', { eager: true, import: 'default' });

const CSS = `${BASE}${FX_CSS}
#rh-top { left: 5%; right: 5%; top: 15%; text-align: center; font-family: 'Silkscreen', monospace; font-size: 50px; line-height: 1.05; color: #e3d9c3; text-shadow: 5px 5px 0 #0e0d0c; letter-spacing: 0.03em; opacity: 0; }
#rh-top b { color: #d98f3f; font-weight: 400; }
#rh-bub { left: 50%; top: 40%; width: 74%; transform: translate(-50%, 0); background: #f4f1ea; color: #111; border-radius: 22px; padding: 16px 20px; font-family: Arial, Helvetica, sans-serif; box-shadow: 0 8px 0 rgba(0,0,0,0.45); opacity: 0; }
#rh-bub .u { font-size: 24px; font-weight: 700; } #rh-bub .u span { font-weight: 400; color: #777; margin-left: 8px; }
#rh-bub .c { font-size: 40px; font-weight: 700; margin-top: 4px; min-height: 46px; letter-spacing: 0.02em; }
.rh-tag { position: absolute; transform: translate(-50%, -100%); font-family: 'Silkscreen', monospace; font-size: 24px; padding: 6px 12px; background: rgba(14,13,12,0.92); border: 3px solid #c9c26a; white-space: nowrap; text-align: center; opacity: 0; }
.rh-tag small { display: block; font-family: 'VT323', monospace; font-size: 26px; color: #c9c26a; }
#rh-count { left: 6%; right: 6%; top: 58%; text-align: center; font-family: 'Silkscreen', monospace; color: #e3d9c3; text-shadow: 4px 4px 0 #0e0d0c; opacity: 0; }
#rh-count b { display: block; font-size: 96px; font-weight: 400; color: #d98f3f; }
#rh-count span { font-size: 30px; }
#rh-war { left: 6%; right: 6%; top: 60%; text-align: center; font-family: 'Silkscreen', monospace; font-size: 40px; line-height: 1.15; color: #e3d9c3; text-shadow: 4px 4px 0 #0e0d0c; opacity: 0; }
#rh-side { left: 0; right: 0; top: 34%; display: flex; justify-content: space-around; font-family: 'Silkscreen', monospace; opacity: 0; }
#rh-side div { width: 44%; padding: 18px 6px; text-align: center; font-size: 30px; border: 4px solid; background: rgba(14,13,12,0.9); }
#rh-side .h { color: #a7b4bb; border-color: #8a9295; } #rh-side .c { color: #c9c26a; border-color: #8c8a5c; }
#rh-side small { display: block; font-family: 'VT323', monospace; font-size: 26px; color: #c9b99a; margin-top: 6px; }
#rh-cta { left: 6%; right: 6%; top: 62%; text-align: center; background: rgba(14,13,12,0.93); border: 4px solid #d98f3f; padding: 14px; opacity: 0; }
#rh-cta .big { font-family: 'Silkscreen', monospace; font-size: 34px; color: #d98f3f; line-height: 1.15; }
#rh-cta .sm { font-family: 'VT323', monospace; font-size: 30px; color: #e3d9c3; margin-top: 6px; }
#rh-flash { inset: 0; background: #fff6dc; opacity: 0; }
#rh-dim { inset: 0; background: rgba(14,13,12,0.45); opacity: 0; }
`;

export async function startHookReel({ cam, life, map, soldiers }) {
  let vo = files['../../marketing/reels/hook.vo.json'];
  if (!vo) {
    let c = 0;
    vo = { lines: script.lines.map(([at, text, id]) => { const s = Math.max(at, c), d = text.length / 15 + 0.2; c = s + d + 0.25; return [s, d, text, id]; }) };
    vo.seconds = c + 1.4;
  }
  const C = cues(vo);
  const at = C.at, END = vo.seconds;
  const T = map.tile;
  const real = soldiers.filter((s) => !s.vacant);
  const n = real.length, nH = real.filter((s) => s.faction === 0).length, nC = n - nH;
  const front = (f) => soldiers.filter((s) => s.faction === f && s.slot?.line === 'front').sort((a, b) => a.x - b.x);
  const fC = front(1), fH = front(0);
  const mC = fC[Math.floor(fC.length / 2)], mH = fH[Math.floor(fH.length / 2)];
  // nové stanoviště „@you“: prázdné místo v přední linii Concordu blízko středu (voják se tam objeví)
  const you = fC.filter((s) => s.vacant).sort((a, b) => Math.abs(a.x - mC.x) - Math.abs(b.x - mC.x))[0] || mC;
  const mid = ((map.front[0] + map.front[1]) / 2) * T;
  const shooters = real.filter((s) => s.slot?.line === 'front' && Math.abs(s.x - mC.x) < 260);
  const medicH = real.find((s) => s.faction === 0 && s.archetype === 'medic');

  const id = ['hook', 'spawn', 'army', 'war', 'side', 'cta'];
  const tt = Object.fromEntries(id.map((k) => [k, at(k)]));
  const SPAWN = tt.spawn + 0.5;
  const K = [[0, you.x, you.y - 36, 4.6], [SPAWN + 1.2, you.x, you.y - 36, 4.9], [tt.army, you.x, you.y - 36, 4.4], [tt.army + 1.4, you.x, mid, 0.85, 'ease'], [tt.war - 0.01, you.x + 160, mid, 0.9]];
  K.push([tt.war, mC.x - 30, mC.y - 16, 3.2, 'cut'], [tt.war + 1.2, mC.x + 10, mC.y - 16, 3.4], [tt.war + 1.2, mH.x - 20, mH.y + 10, 3.0, 'cut'], [tt.side - 0.01, mH.x + 20, mH.y + 10, 3.2]);
  K.push([tt.side, you.x, mid, 1.2, 'cut'], [END, you.x + 60, mid, 1.25]);
  const camAt = camPath(K);
  const sub = subtitles(vo);
  const fx = transitions([[tt.war, 'whip'], [tt.war + 1.2, 'whip'], [tt.side, 'flash']]);
  const booms = [[tt.war + 0.5, mC.x + 40, mC.y + 30, true], [tt.war + 1.6, mH.x - 60, mH.y - 30, false], [tt.side + 0.4, you.x - 120, mid - 40, false], [tt.side + 1.2, you.x + 140, mid + 60, true]];
  const shots = shooters.slice(0, 6).map((s, i) => [tt.war + 0.1 + i * 0.18, s]);
  const SFX = [[0.15, 'type', 0], [SPAWN, 'stamp', 0], [tt.army + 1.2, 'drum', 0], [tt.side, 'drum', 0], [END - 0.8, 'end', 0]];
  for (const [t0] of shots) SFX.push([+t0.toFixed(2), 'shoot', 0]);
  for (const [t0, , , big] of booms) SFX.push([+t0.toFixed(2), 'shell', big ? 1 : 0]);

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  root.innerHTML = `
    <div id="rh-dim"></div>
    <div id="rh-flash"></div>
    <div id="rh-top">YOUR COMMENT<br><b>BECOMES A SOLDIER</b></div>
    <div id="rh-bub"><div class="u">@you<span>now</span></div><div class="c"></div></div>
    <div id="rh-tag" class="rh-tag">@YOU<small>Concord rifleman · just enlisted</small></div>
    <div id="rh-count"><b>0</b><span>REAL PLAYERS ON THE FRONT</span></div>
    <div id="rh-war">NEW ORDERS EVERY DAY<br>REAL LOSSES · REAL HEROES</div>
    <div id="rh-side"><div class="h">HEGEMONY<small>${nH} soldiers</small></div><div class="c">CONCORD<small>${nC} soldiers</small></div></div>
    <div id="rh-cta"><div class="big">COMMENT ONE WORD:<br>HEGEMONY OR CONCORD</div><div class="sm">free game · link in bio</div></div>
    <div id="rd-sub"></div>
  `;
  document.body.appendChild(root);
  const paint = fxLayers(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };
  let bi = 0, si = 0;

  function frame(t) {
    const f = fx(t);
    for (const q of soldiers) if (q.vacant && q.sprite && q.sprite.alpha < 1) { q.sprite.alpha = 1; q.sprite.tint = [0xffffff, 0xf0ece4, 0xe6e2da, 0xfff4e8][q.variant % 4]; } // žádní duchové
    if (you.sprite) you.sprite.visible = t >= SPAWN; // nový voják se objeví až po dopadu komentáře
    const [x, y, z] = camAt(t);
    cam.set(x, y, z * (1 + 0.05 * f.punch));
    while (si < shots.length && shots[si][0] <= t) { life.debug.shoot([shots[si][1]]); si++; }
    while (bi < booms.length && booms[bi][0] <= t) { const [, bx, by, big] = booms[bi]; life.debug.shell?.(bx, by, big); bi++; }
    if (medicH && t >= tt.war + 1.3 && !frame.med) { frame.med = 1; life.debug.sendMedic?.(medicH); }
    paint({ ...f, black: Math.max(f.black, t > END - 0.35 ? clamp01((t - END + 0.35) / 0.3) : 0) });
    show('#rh-dim', t < SPAWN ? 1 : 0); // ztmavení pod texty (bublina zůstane bílá)
    // háček: nápis hned od první vteřiny, bublina s komentářem, který se napíše a spadne do zákopu
    const top = $('#rh-top');
    top.style.opacity = t < tt.army ? 1 : 0;
    top.style.transform = `scale(${1 + 0.15 * clamp01(1 - t / 0.25)})`;
    const bub = $('#rh-bub');
    const drop = easeOut(clamp01((t - (SPAWN - 0.45)) / 0.45));
    bub.style.opacity = t < SPAWN ? Math.min(1, t / 0.12) : 0;
    bub.style.transform = `translate(-50%, ${drop * 260}px) scale(${1 - drop * 0.6})`;
    $('#rh-bub .c').textContent = typed('CONCORD', t, 0.15, 14);
    const fl = t >= SPAWN && t < SPAWN + 0.2 ? 1 - (t - SPAWN) / 0.2 : 0;
    $('#rh-flash').style.opacity = fl * 0.8;
    tagAt($('#rh-tag'), { x: you.x, y: you.y - 34 }, cam, win(t, SPAWN + 0.15, tt.army + 0.8, 0.15), 0);
    // celá fronta: počítadlo skutečných hráčů
    show('#rh-count', win(t, tt.army + 0.6, tt.war - 0.05, 0.2));
    $('#rh-count b').textContent = Math.round(n * easeOut(clamp01((t - tt.army - 0.6) / 1.4)));
    show('#rh-war', win(t, tt.war + 0.1, tt.side - 0.05, 0.15));
    // strany a výzva
    const sd = $('#rh-side');
    sd.style.opacity = t >= tt.side ? 1 : 0;
    sd.style.transform = `scale(${1 + 0.2 * clamp01(1 - (t - tt.side) / 0.25)})`;
    slam($('#rh-cta'), t, tt.cta - 0.1, END - 0.2, 1.3, -3);
    const s = sub(t);
    const subEl = $('#rd-sub');
    if (s && t >= tt.army) {
      subEl.style.opacity = 1;
      subEl.style.top = '13%';
      if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; }
    } else subEl.style.opacity = 0;
  }

  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
