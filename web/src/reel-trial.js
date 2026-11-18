// Testovací reely pro neodběratele (IG „trial reels“, 18. 11. 2026): stejné tělo, dva různé háčky v první vteřině (A/B test).
//  trialA – „I let 500 strangers fight a war in my comments“: celá fronta v ohni, nápis hned od 1. snímku, pak jmenovky skutečných hráčů
//  trialB – skutečný příběh: voják hráče, kterého včera zastřelil jiný hráč (oba @handle), černobílé zastavení „KILLED IN ACTION“,
//           ráno nastoupil nástupce z rodu (data v marketing/reels/trialB.script.json → hero)
// Společné tělo: komentář → voják, počítadlo hráčů, noviny ve 13:00 rozhodují, strany, výzva. Konec navazuje na začátek (smyčka).
// /?reel=trialA&vacant=700, /?reel=trialB&vacant=700 (jen vývojový server).
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, slam, clamp01, win, typed, easeOut, tagAt } from './reel-kit.js';
import scriptA from '../../marketing/reels/trialA.script.json';
import scriptB from '../../marketing/reels/trialB.script.json';

const files = import.meta.glob('../../marketing/reels/trial[AB].vo.json', { eager: true, import: 'default' });

const CSS = `${BASE}${FX_CSS}
#rt-top { left: 4%; right: 4%; top: 14%; text-align: center; font-family: 'Silkscreen', monospace; font-size: 50px; line-height: 1.05; color: #e3d9c3; text-shadow: 5px 5px 0 #0e0d0c; letter-spacing: 0.02em; opacity: 0; }
#rt-top b { color: #d98f3f; font-weight: 400; }
.rt-tag { position: absolute; transform: translate(-50%, -100%); font-family: 'Silkscreen', monospace; font-size: 24px; padding: 6px 12px; background: rgba(14,13,12,0.92); border: 3px solid #c9c26a; white-space: nowrap; text-align: center; opacity: 0; color: #e3d9c3; }
.rt-tag small { display: block; font-family: 'VT323', monospace; font-size: 26px; color: #c9c26a; }
.rt-tag.h { border-color: #8a9295; } .rt-tag.h small { color: #a7b4bb; }
#rt-kia { left: 6%; right: 6%; top: 56%; text-align: center; background: rgba(14,13,12,0.94); border: 4px solid #a33b2b; padding: 16px 10px; opacity: 0; }
#rt-kia .big { font-family: 'Silkscreen', monospace; font-size: 40px; color: #c8553d; }
#rt-kia .nm { font-family: 'Silkscreen', monospace; font-size: 28px; color: #e3d9c3; margin-top: 8px; }
#rt-kia .sm { font-family: 'VT323', monospace; font-size: 30px; color: #c9b99a; margin-top: 4px; }
#rt-bub { left: 50%; top: 40%; width: 74%; transform: translate(-50%, 0); background: #f4f1ea; color: #111; border-radius: 22px; padding: 16px 20px; font-family: Arial, Helvetica, sans-serif; box-shadow: 0 8px 0 rgba(0,0,0,0.45); opacity: 0; }
#rt-bub .u { font-size: 24px; font-weight: 700; } #rt-bub .u span { font-weight: 400; color: #777; margin-left: 8px; }
#rt-bub .c { font-size: 40px; font-weight: 700; margin-top: 4px; min-height: 46px; letter-spacing: 0.02em; }
#rt-count { left: 6%; right: 6%; top: 58%; text-align: center; font-family: 'Silkscreen', monospace; color: #e3d9c3; text-shadow: 4px 4px 0 #0e0d0c; opacity: 0; }
#rt-count b { display: block; font-size: 96px; font-weight: 400; color: #d98f3f; }
#rt-count span { font-size: 30px; }
#rt-news { left: 8%; right: 8%; top: 52%; background: #e8dfc8; color: #1c1a17; padding: 14px 16px; border: 4px solid #1c1a17; box-shadow: 8px 8px 0 rgba(0,0,0,0.5); opacity: 0; }
#rt-news .mh { font-family: 'Silkscreen', monospace; font-size: 30px; text-align: center; border-bottom: 3px double #1c1a17; padding-bottom: 6px; }
#rt-news .ln { font-family: 'VT323', monospace; font-size: 34px; margin-top: 8px; line-height: 1.05; }
#rt-news .ln b { color: #8c2a1e; font-weight: 400; }
#rt-side { left: 0; right: 0; top: 34%; display: flex; justify-content: space-around; font-family: 'Silkscreen', monospace; opacity: 0; }
#rt-side div { width: 44%; padding: 18px 6px; text-align: center; font-size: 30px; border: 4px solid; background: rgba(14,13,12,0.9); }
#rt-side .h { color: #a7b4bb; border-color: #8a9295; } #rt-side .c { color: #c9c26a; border-color: #8c8a5c; }
#rt-side small { display: block; font-family: 'VT323', monospace; font-size: 26px; color: #c9b99a; margin-top: 6px; }
#rt-cta { left: 6%; right: 6%; top: 62%; text-align: center; background: rgba(14,13,12,0.93); border: 4px solid #d98f3f; padding: 14px; opacity: 0; }
#rt-cta .big { font-family: 'Silkscreen', monospace; font-size: 34px; color: #d98f3f; line-height: 1.15; }
#rt-cta .sm { font-family: 'VT323', monospace; font-size: 30px; color: #e3d9c3; margin-top: 6px; }
#rt-flash { inset: 0; background: #fff6dc; opacity: 0; }
#rt-dim { inset: 0; background: rgba(14,13,12,0.45); opacity: 0; }
`;

const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export async function startTrialReel({ cam, life, map, soldiers }, variant = 'A') {
  const B = variant === 'B';
  const script = B ? scriptB : scriptA;
  let vo = files[`../../marketing/reels/trial${variant}.vo.json`];
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
  const mid = ((map.front[0] + map.front[1]) / 2) * T;
  const by = (h) => soldiers.find((s) => s.handle === h);
  const hero = script.hero || {};
  const victim = (B && by(hero.victim)) || mC;
  const shooter = (B && by(hero.shooter)) || mH;
  // nové stanoviště „@you“: prázdné místo v přední linii Concordu blízko středu
  const you = fC.filter((s) => s.vacant).sort((a, b) => Math.abs(a.x - mC.x) - Math.abs(b.x - mC.x))[0] || mC;
  // varianta A: tři skuteční hráči v přední linii kolem středu pro rychlé jmenovky
  const named = real.filter((s) => s.slot?.line === 'front' && s.handle && Math.abs(s.x - mC.x) < 600).slice(0, 12);
  const trio = [named[1], named[5], named[9]].filter(Boolean);

  const tt = Object.fromEntries(script.lines.map(([, , k]) => [k, at(k)]));
  const SPAWN = tt.spawn + 0.5;
  const K = [];
  let booms = [], shots = [];
  if (B) {
    const KIA = tt.shot + 1.15; // výstřel dopadne
    K.push([0, victim.x, victim.y - 30, 5.2], [tt.shot - 0.01, victim.x, victim.y - 30, 5.5]);
    K.push([tt.shot, shooter.x, shooter.y - 24, 4.6, 'cut'], [KIA - 0.01, shooter.x, shooter.y - 24, 4.9]);
    K.push([KIA, victim.x, victim.y - 30, 5.6, 'cut'], [tt.spawn - 0.01, victim.x, victim.y - 30, 5.0]);
    shots = [[tt.shot + 0.25, shooter]];
    tt.kia = KIA;
  } else {
    K.push([0, mC.x, mC.y - 50, 2.3], [tt.real - 0.01, mC.x + 70, mC.y - 50, 2.5]);
    trio.forEach((s, i) => { const t0 = tt.real + i * ((tt.spawn - tt.real) / Math.max(1, trio.length)); K.push([t0, s.x, s.y - 30, 4.4, 'cut'], [t0 + 0.6, s.x, s.y - 30, 4.6]); });
    booms = [[0.05, mC.x + 30, mC.y - 70, true], [0.55, mC.x - 90, mC.y - 110, false], [1.0, mC.x + 120, mC.y - 40, true], [1.6, mC.x - 40, mC.y - 140, false], [2.2, mC.x + 60, mC.y - 100, true]];
    shots = real.filter((s) => s.slot?.line === 'front' && Math.abs(s.x - mC.x) < 160).slice(0, 8).map((s, i) => [0.1 + i * 0.25, s]);
  }
  K.push([tt.spawn, you.x, you.y - 36, 4.6, 'cut'], [SPAWN + 1.2, you.x, you.y - 36, 4.9]);
  const tArmy = tt.army ?? tt.war;
  K.push([tArmy, you.x, you.y - 36, 4.4], [tArmy + 1.4, you.x, mid, 0.85, 'ease']);
  const tEnd = tt.side ?? tt.cta;
  K.push([tEnd, you.x, mid, 1.2, 'cut'], [END, you.x + 60, mid, 1.25]);
  const camAt = camPath(K);
  const sub = subtitles(vo);
  const fx = transitions(B ? [[tt.shot, 'whip'], [tt.kia, 'flash'], [tt.spawn, 'whip'], [tEnd, 'flash']] : [[tt.real, 'whip'], [tt.spawn, 'whip'], [tEnd, 'flash']]);
  booms.push([tEnd + 0.4, you.x - 120, mid - 40, false], [tEnd + 1.2, you.x + 140, mid + 60, true]);
  const SFX = [[SPAWN - 0.4, 'type', 0], [SPAWN, 'stamp', 0], [tArmy + 1.2, 'drum', 0], [tEnd, 'drum', 0], [END - 0.8, 'end', 0]];
  if (B) SFX.push([+(tt.kia).toFixed(2), 'stamp', 0]);
  for (const [t0] of shots) SFX.push([+t0.toFixed(2), 'shoot', 0]);
  for (const [t0, , , big] of booms) SFX.push([+t0.toFixed(2), 'shell', big ? 1 : 0]);

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  const top = B ? 'THIS SOLDIER<br>BELONGED TO<br><b>A REAL PLAYER</b>' : 'I LET <b>500 STRANGERS</b><br>FIGHT A WAR<br>IN MY COMMENTS';
  root.innerHTML = `
    <div id="rt-dim"></div>
    <div id="rt-flash"></div>
    <div id="rt-top">${top}</div>
    <div id="rt-vic" class="rt-tag">@${esc(hero.victim || '')}<small>Concord · ${hero.days || 0} days on the front</small></div>
    <div id="rt-sho" class="rt-tag h">@${esc(hero.shooter || '')}<small>Hegemony sniper · a real player</small></div>
    <div id="rt-heir" class="rt-tag">${esc(victim.name || '')}<small>same family · took his place today</small></div>
    ${trio.map((s, i) => `<div id="rt-n${i}" class="rt-tag ${s.faction === 0 ? 'h' : ''}">@${esc(s.handle)}<small>${s.faction === 0 ? 'Hegemony' : 'Concord'} · real player</small></div>`).join('')}
    <div id="rt-kia"><div class="big">✝ KILLED IN ACTION</div><div class="nm">${esc(hero.name || '')}</div><div class="sm">shot by @${esc(hero.shooter || '')}</div></div>
    <div id="rt-bub"><div class="u">@you<span>now</span></div><div class="c"></div></div>
    <div id="rt-you" class="rt-tag">@YOU<small>Concord rifleman · just enlisted</small></div>
    <div id="rt-count"><b>0</b><span>REAL PLAYERS ON THE FRONT</span></div>
    <div id="rt-news"><div class="mh">TRENCH GAZETTE</div><div class="ln">1 PM, every day.<br>Who was hit. <b>Who fell.</b><br>Who held the line.</div></div>
    <div id="rt-side"><div class="h">HEGEMONY<small>${nH} soldiers</small></div><div class="c">CONCORD<small>${nC} soldiers</small></div></div>
    <div id="rt-cta"><div class="big">COMMENT ONE WORD:<br>HEGEMONY OR CONCORD</div><div class="sm">free game · you're in within minutes</div></div>
    <div id="rd-sub"></div>
  `;
  document.body.appendChild(root);
  const paint = fxLayers(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };
  const game = document.querySelector('canvas');
  let bi = 0, si = 0;

  function frame(t) {
    const f = fx(t);
    for (const q of soldiers) if (q.vacant && q.sprite && q.sprite.alpha < 1) { q.sprite.alpha = 1; q.sprite.tint = [0xffffff, 0xf0ece4, 0xe6e2da, 0xfff4e8][q.variant % 4]; } // žádní duchové
    if (you.sprite) you.sprite.visible = t >= SPAWN;
    const [x, y, z] = camAt(t);
    cam.set(x, y, z * (1 + 0.05 * f.punch));
    while (si < shots.length && shots[si][0] <= t) { life.debug.shoot([shots[si][1]]); si++; }
    while (bi < booms.length && booms[bi][0] <= t) { const [, bx, by0, big] = booms[bi]; life.debug.shell?.(bx, by0, big); bi++; }
    // B: po zásahu černobílé zastavení (jen barva, žádná průhlednost)
    const gray = B && t >= tt.kia && t < tt.heir ? 1 : B && t >= tt.heir && t < tt.heir + 0.6 ? 1 - (t - tt.heir) / 0.6 : 0;
    if (game) game.style.filter = gray ? `grayscale(${gray}) contrast(${1 + 0.15 * gray})` : '';
    paint({ ...f, black: Math.max(f.black, t > END - 0.35 ? clamp01((t - END + 0.35) / 0.3) : 0) });
    show('#rt-dim', (B && t < tt.shot) || (t >= tt.spawn && t < SPAWN) ? 1 : 0); // A: háček bez ztmavení (výbuchy musí být vidět)
    // háček: nápis od prvního snímku (bez náběhu z nuly), jen krátké „bouchnutí“
    const tp = $('#rt-top');
    tp.style.opacity = t < (B ? tt.shot : tt.real) ? 1 : 0;
    tp.style.transform = `scale(${1 + 0.12 * clamp01(1 - t / 0.25)})`;
    if (B) {
      tagAt($('#rt-vic'), { x: victim.x, y: victim.y - 30 }, cam, win(t, 0.4, tt.shot, 0.15), 0);
      tagAt($('#rt-sho'), { x: shooter.x, y: shooter.y - 30 }, cam, win(t, tt.shot + 0.1, tt.kia, 0.12), 0);
      slam($('#rt-kia'), t, tt.kia, tt.heir - 0.05, 1.4, -4);
      const fl = t >= tt.kia && t < tt.kia + 0.18 ? 1 - (t - tt.kia) / 0.18 : 0;
      $('#rt-flash').style.opacity = fl * 0.85;
      tagAt($('#rt-heir'), { x: victim.x, y: victim.y - 30 }, cam, win(t, tt.heir + 0.2, tt.spawn, 0.15), 0);
    } else {
      trio.forEach((s, i) => { const t0 = tt.real + i * ((tt.spawn - tt.real) / Math.max(1, trio.length)); tagAt($(`#rt-n${i}`), { x: s.x, y: s.y - 30 }, cam, win(t, t0 + 0.05, t0 + (tt.spawn - tt.real) / trio.length - 0.02, 0.08), 0); });
    }
    // tělo: komentář → voják
    const bub = $('#rt-bub');
    const drop = easeOut(clamp01((t - (SPAWN - 0.45)) / 0.45));
    bub.style.opacity = t >= tt.spawn && t < SPAWN ? 1 : 0;
    bub.style.transform = `translate(-50%, ${drop * 260}px) scale(${1 - drop * 0.6})`;
    $('#rt-bub .c').textContent = typed('CONCORD', t, tt.spawn + 0.05, 16);
    const fl2 = t >= SPAWN && t < SPAWN + 0.2 ? 1 - (t - SPAWN) / 0.2 : 0;
    if (!B || t > tt.spawn) $('#rt-flash').style.opacity = Math.max(fl2 * 0.8, B ? 0 : 0);
    tagAt($('#rt-you'), { x: you.x, y: you.y - 34 }, cam, win(t, SPAWN + 0.15, tArmy + 0.8, 0.15), 0);
    if (tt.army != null) {
      show('#rt-count', win(t, tt.army + 0.6, tEnd - 0.05, 0.2));
      $('#rt-count b').textContent = Math.round(n * easeOut(clamp01((t - tt.army - 0.6) / 1.2)));
    }
    if (tt.war != null) show('#rt-news', win(t, tt.war + 0.6, tEnd - 0.05, 0.15));
    const sd = $('#rt-side');
    sd.style.opacity = t >= tEnd ? 1 : 0;
    sd.style.transform = `scale(${1 + 0.2 * clamp01(1 - (t - tEnd) / 0.25)})`;
    slam($('#rt-cta'), t, tt.cta - 0.1, END - 0.2, 1.3, -3);
    const s = sub(t);
    const subEl = $('#rd-sub');
    const hookOn = t < (B ? tt.shot : tt.real);
    if (s && !hookOn) {
      subEl.style.opacity = 1;
      subEl.style.top = '13%';
      if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; }
    } else subEl.style.opacity = 0;
  }

  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
