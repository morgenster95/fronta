// Reel „pillbox“ (16. 11. 2026, na přání uživatele: svižné video, které hned vyzve ke komentování): na frontě stojí pevnůstky obou stran,
// velitelství chtějí ty nepřátelské zničit, děla dostávají každý granát → přímý zásah a ruina (film i ve hře) → výzva:
// každý komentář = jeden granát (souboj komentářů, engine/shells.js). Náhled /?reel=pillbox&vacant=700 (jen vývojový server).
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, slam, clamp01, win, typed, tagAt } from './reel-kit.js';
import script from '../../marketing/reels/pillbox.script.json';
import { makePillboxScenes } from './cinema-pillbox.js';
import { loadTexture } from './assets.js';

const files = import.meta.glob('../../marketing/reels/pillbox.vo.json', { eager: true, import: 'default' });

const CSS = `${BASE}${FX_CSS}
#rp-film { inset: 0; width: 100%; height: 100%; image-rendering: pixelated; }
#rp-title { left: 0; right: 0; top: 30%; text-align: center; font-family: 'Silkscreen', monospace; font-size: 64px; line-height: 1.05; color: #e3d9c3; text-shadow: 5px 5px 0 #0e0d0c; letter-spacing: 0.06em; }
#rp-title b { color: #d98f3f; font-weight: 400; display: block; }
.rp-tag { position: absolute; transform: translate(-50%, -100%); font-family: 'Silkscreen', monospace; font-size: 26px; padding: 6px 12px; background: rgba(14,13,12,0.88); border: 3px solid #524a3f; white-space: nowrap; text-shadow: 2px 2px 0 #0e0d0c; opacity: 0; }
.rp-bub { position: absolute; transform: translate(-50%, -100%); max-width: 62%; font-family: 'VT323', monospace; font-size: 34px; line-height: 1.02; color: #1c1a17; background: #e3d9c3;
  padding: 8px 14px 10px; border: 3px solid #0e0d0c; box-shadow: 4px 4px 0 rgba(0,0,0,0.55); opacity: 0; }
.rp-bub::after { content: ''; position: absolute; left: 50%; bottom: -15px; margin-left: -9px; border: 9px solid transparent; border-top: 9px solid #0e0d0c; border-bottom: 0; }
.rp-bub .who { display: block; font-family: 'Silkscreen', monospace; font-size: 15px; color: #7e3b2a; margin-bottom: 2px; }
#rp-cta { left: 6%; right: 6%; top: 24%; background: rgba(14,13,12,0.94); border: 4px solid #d98f3f; padding: 18px 16px 20px; text-align: center; }
#rp-cta .big { font-family: 'Silkscreen', monospace; font-size: 46px; color: #d98f3f; line-height: 1.05; letter-spacing: 0.04em; }
#rp-cta .mid { font-family: 'Silkscreen', monospace; font-size: 26px; color: #e3d9c3; margin-top: 14px; line-height: 1.25; }
#rp-cta .mid span { color: #8a9295; } #rp-cta .mid i { color: #c9c26a; font-style: normal; }
#rp-cta .sm { font-family: 'VT323', monospace; font-size: 30px; color: #c9b99a; margin-top: 12px; line-height: 1.05; }
#rp-cta .race { margin-top: 14px; }
#rp-cta .race .r { display: flex; align-items: center; gap: 10px; margin: 6px 0; }
#rp-cta .race span { font-family: 'Silkscreen', monospace; font-size: 18px; width: 128px; text-align: right; color: #c9b99a; }
#rp-cta .sh { display: flex; gap: 6px; }
#rp-cta .sh u { display: block; width: 10px; height: 24px; border: 2px solid #0e0d0c; border-radius: 5px 5px 0 0; text-decoration: none; opacity: 0.12; }
#rp-cta .sh.h u { background: #8a9295; } #rp-cta .sh.c u { background: #c9c26a; }
#rp-fire { left: 0; right: 0; top: 70%; text-align: center; font-family: 'Silkscreen', monospace; font-size: 92px; color: #d98f3f; text-shadow: 6px 6px 0 #0e0d0c; letter-spacing: 0.08em; opacity: 0; }
#rp-rain { inset: 0; background: rgba(20, 24, 40, 0.22); mix-blend-mode: multiply; }
`;

export async function startPillboxReel({ cam, life, map, theme, soldiers, tex, anims }) {
  let vo = files['../../marketing/reels/pillbox.vo.json'];
  if (!vo) {
    let c = 0;
    vo = { lines: script.lines.map(([at, text, id]) => { const s = Math.max(at, c), d = text.length / 15 + 0.2; c = s + d + 0.25; return [s, d, text, id]; }) };
    vo.seconds = c + 3.0;
  }
  const C = cues(vo);
  const at = C.at, END = vo.seconds;
  const lineMid = (f) => { const l = soldiers.filter((s) => s.faction === f && s.slot?.line === 'front' && !s.vacant).sort((a, b) => a.x - b.x); return l[Math.floor(l.length / 2)]; };
  const mH = lineMid(0), mC = lineMid(1);
  const F = window.__front || {};
  const boxes = (F.orderFx?.shelters || []).filter((c) => c.texture?.width === 48 && c.texture?.height === 32);
  const near = (ref, list = boxes) => list.filter((c) => Math.abs(c.y - ref.y) < 120).sort((a, b) => Math.abs(a.x - ref.x) - Math.abs(b.x - ref.x))[0] || ref;
  const boxH = near(mH), boxC = near(mC);
  // druhý bunkr Concordu (ten se ve hře rozstřílí) a ruina pro něj
  const boxC2 = boxes.filter((c) => c !== boxC && Math.abs(c.y - mC.y) < 120).sort((a, b) => Math.abs(a.x - mC.x - 900) - Math.abs(b.x - mC.x - 900))[0] || boxC;
  let ruinTex = null;
  loadTexture('/assets/props/pillbox_back_ruin.png').then((t) => { ruinTex = t; }).catch(() => {});

  const id = ['open', 'open2', 'hq', 'guns', 'boom', 'ruin', 'cta', 'cta2', 'cta3'];
  const tt = Object.fromEntries(id.map((k) => [k, at(k)]));
  const HIT = tt.ruin + 2.2; // přímý zásah bunkru ve hře
  const K = [[0, boxH.x - 30, boxH.y - 16, 4.4], [tt.open2 - 0.01, boxH.x + 6, boxH.y - 16, 4.8]];
  K.push([tt.open2, boxC.x - 26, boxC.y - 18, 4.4, 'cut'], [tt.hq - 0.01, boxC.x + 8, boxC.y - 18, 4.8]);
  K.push([tt.hq, mC.x, mC.y, 3], [tt.ruin, boxC2.x - 30, boxC2.y - 20, 3.4, 'cut'], [HIT, boxC2.x - 6, boxC2.y - 20, 4.0], [tt.cta - 0.01, boxC2.x + 4, boxC2.y - 20, 4.4]);
  K.push([tt.cta, mH.x - 200, ((map.front[0] + map.front[1]) / 2) * map.tile, 1.3, 'cut'], [END, mH.x + 200, ((map.front[0] + map.front[1]) / 2) * map.tile, 1.4]);
  const camAt = camPath(K);
  const sub = subtitles(vo);
  const film = (t) => (t >= tt.hq && t < tt.guns ? 'hq' : t >= tt.guns && t < tt.boom ? 'guns' : t >= tt.boom && t < tt.ruin ? 'boom' : null);
  const fx = transitions([[tt.open2, 'whip'], [tt.hq, 'black', 0.3], [tt.guns, 'flash'], [tt.boom, 'whip'], [tt.ruin, 'black', 0.3], [HIT, 'flash'], [tt.cta, 'flash'], [tt.cta3, 'flash']]);
  // výbuchy ve hře kolem bunkru Concordu: dva vedle, pak přímý zásah
  const booms = [[tt.ruin + 0.6, boxC2.x + 46, boxC2.y + 10, false], [tt.ruin + 1.4, boxC2.x - 40, boxC2.y - 6, false], [HIT, boxC2.x, boxC2.y, true], [HIT + 0.25, boxC2.x + 14, boxC2.y + 6, true]];
  const SFX = [[0.3, 'shell', 1], [tt.open2 + 0.2, 'shoot', 0]];
  for (let t = tt.guns + 0.4; t < tt.boom; t += 0.8) SFX.push([+t.toFixed(2), 'shell', 1]); // děla
  for (const s of [0.5, 1.2, 2.0]) SFX.push([+(tt.boom + s).toFixed(2), 'shell', s === 2.0 ? 1 : 0]);
  for (const [t0, , , big] of booms) SFX.push([+t0.toFixed(2), 'shell', big ? 1 : 0]);
  SFX.push([tt.cta, 'drum', 0], [tt.cta3, 'drum', 0], [END - 1.4, 'end', 0]);
  for (let t = tt.cta + 0.4, k = 0; t < END - 1; t += 0.7, k++) SFX.push([+t.toFixed(2), 'shell', k % 3 === 0 ? 1 : 0]);
  for (let t = tt.open + 0.4; t < tt.hq - 0.2; t += 0.45) SFX.push([+t.toFixed(2), 'shoot', 0]); // kulomety z bunkrů

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  root.innerHTML = `
    <div id="rp-rain"></div>
    <div id="rp-title">THE GUNS<b>ARE YOURS</b></div>
    <div id="rp-tagH" class="rp-tag">HEGEMONY PILLBOX</div>
    <div id="rp-tagC" class="rp-tag">CONCORD PILLBOX</div>
    <div id="rp-b1" class="rp-bub"><span class="who">Hegemony HQ</span>Every gun on their concrete.</div>
    <div id="rp-b2" class="rp-bub"><span class="who">Concord HQ</span>Knock them out. Tonight.</div>
    <div id="rp-b3" class="rp-bub"><span class="who">Gunner</span>More shells! Keep them coming!</div>
    <div id="rp-cta"><div class="big">1 COMMENT<br>= 1 SHELL</div>
      <div class="mid">COMMENT <span>HEGEMONY</span><br>OR <i>CONCORD</i></div>
      <div class="race"><div class="r"><span>HEGEMONY</span><div class="sh h">${'<u></u>'.repeat(12)}</div></div><div class="r"><span>CONCORD</span><div class="sh c">${'<u></u>'.repeat(12)}</div></div></div>
      <div class="sm">Up to 20 shells each. Most shells by the next Trench Gazette destroys the enemy pillboxes.</div></div>
    <div id="rp-fire">FIRE!</div>
    <div id="rd-big"></div>
    <div id="rd-sub"></div>
  `;
  document.body.appendChild(root);
  const pb = makePillboxScenes(tex);
  pb.canvas.id = 'rp-film';
  root.prepend(pb.canvas);
  const paint = fxLayers(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };
  const bubPct = (sel, x, y, t0, t1, t) => { const el = $(sel); const o = t >= t0 && t < t1 ? Math.min(1, (t - t0) / 0.15, (t1 - t) / 0.15) : 0; el.style.opacity = o; el.style.left = `${x}%`; el.style.top = `${y}%`; };
  let bi = 0, ci = 0, ruined = false;
  const ctaBooms = [];
  for (let t = tt.cta + 0.4, k = 0; t < END - 1; t += 0.7, k++) ctaBooms.push([t, ((k * 0.618) % 1), ((k * 0.382 + 0.2) % 1)]);

  function frame(t) {
    const f = fx(t);
    for (const q of soldiers) if (q.vacant && q.sprite && q.sprite.alpha < 1) { q.sprite.alpha = 1; q.sprite.tint = [0xffffff, 0xf0ece4, 0xe6e2da, 0xfff4e8][q.variant % 4]; } // žádní duchové
    const [x, y, z] = camAt(t);
    cam.set(x, y, z * (1 + 0.04 * f.punch));
    while (bi < booms.length && booms[bi][0] <= t) { const [, bx, by, big] = booms[bi]; life.debug.shell?.(bx, by, big); bi++; }
    // přímý zásah: bunkr Concordu ve hře se změní v ruinu, vlajka zmizí
    if (!ruined && t >= HIT && ruinTex && boxC2.texture) {
      ruined = true;
      boxC2.texture = ruinTex;
      const pbx = (F.orderFx?.pillboxes || []).find((q) => q.s === boxC2);
      if (pbx) { pbx.ruin = true; pbx.fl.clear(); } // bez vlajky, nestřílí, doutná (orders-fx.js)
    }
    const fl = film(t);
    if (fl) pb.draw(fl, t - tt[fl]);
    show('#rp-film', fl ? 1 : 0);
    show('#rp-rain', fl ? 0 : 1);
    paint({ ...f, black: Math.max(f.black, t < 0.2 ? 1 - t / 0.2 : 0, t > END - 0.5 ? clamp01((t - END + 0.5) / 0.4) : 0) });
    // úvodní titulek (háček v první vteřině)
    const ti = $('#rp-title');
    ti.style.opacity = win(t, 0.05, tt.open2 - 0.1, 0.15);
    ti.style.transform = `scale(${1 + 0.25 * clamp01(1 - t / 0.35)})`;
    tagAt($('#rp-tagH'), { x: boxH.x, y: boxH.y - 34 }, cam, win(t, tt.open + 1.6, tt.open2 - 0.05, 0.2), 0);
    tagAt($('#rp-tagC'), { x: boxC.x, y: boxC.y - 34 }, cam, win(t, tt.open2 + 0.3, tt.hq - 0.05, 0.2), 0);
    bubPct('#rp-b1', 54, 37, tt.hq + 0.8, tt.guns - 0.05, t);
    bubPct('#rp-b2', 46, 78, tt.hq + 1.8, tt.guns - 0.05, t);
    bubPct('#rp-b3', 40, 52, tt.guns + 1.0, tt.boom - 0.1, t);
    // výzva: panel, granáty přibývají
    const cta = $('#rp-cta');
    cta.style.opacity = t >= tt.cta && t < END - 0.3 ? 1 : 0;
    if (t >= tt.cta) slam(cta, t, tt.cta + 0.05, END - 0.3, 1.25, -2);
    // granáty obou stran přibývají na přeskáčku (jen ilustrace, žádná čísla): kdo napíše víc, má delší řadu
    root.querySelectorAll('#rp-cta .sh.h u').forEach((el, i) => (el.style.opacity = t > tt.cta + 0.5 + i * 0.5 ? 1 : 0.12));
    root.querySelectorAll('#rp-cta .sh.c u').forEach((el, i) => (el.style.opacity = t > tt.cta + 0.75 + i * 0.5 ? 1 : 0.12));
    slam($('#rp-fire'), t, tt.cta3 + 1.2, END - 0.2, 1.8, -6);
    // výbuchy v pozadí během výzvy (v záběru kamery)
    while (ci < ctaBooms.length && ctaBooms[ci][0] <= t) { const [, u, v] = ctaBooms[ci]; life.debug.shell?.(x + (u - 0.5) * 300, y + (v - 0.5) * 360, ci % 3 === 0); ci++; }
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
