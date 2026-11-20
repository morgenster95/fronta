// Day reel Day 11 (20. 11. 2026, noviny 20. 11. 13:00 UTC; /?reel=front11&vacant=700, jen vývojový server), na výšku:
//  háček: přeplněný lazaret (kreslený detail, web/src/cine-trench.js 'ward' full) + DAY 11 / 109 FELL → plné nemocnice (tabule) → mokrý zákop a nemoci ('sick')
//  → výzva MEDIC → Rafael Ali a jeho nástupce Karel (medik) → Hugo Kitty → závod o Grey Mill → dělo jako odměna (okop ve hře, web/src/guns.js)
//  → hlasy fronty (propagandisté Sebs a Wizzerd) → War Bonds → +615 a Concord přes 1 000 → počty stran (pravidlo) → Patreon Front News + mudandiron.app. (20. 11. odpoledne: zkráceno na ~60 s, scény na výšku přes celé video, web/src/cine-vert.js)
// Hlas: marketing/reels/front11.script.json, hudba war_score (front11 v reel_audio.py).
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, slam, clamp01, win, easeOut, tagAt } from './reel-kit.js';
import { makeVertCine } from './cine-vert.js';
import script from '../../marketing/reels/front11.script.json';

const files = import.meta.glob('../../marketing/reels/front11.vo.json', { eager: true, import: 'default' });
const D = { fell: [51, 58], army: [817, 1000], race: [209, 185], joined: 615 };

const CSS = `${BASE}${FX_CSS}
#r11-cine { inset: 0; width: 100%; height: 100%; image-rendering: pixelated; opacity: 0; }
#r11-black { inset: 0; background: #0e0d0c; opacity: 0; }
#r11-hook { left: 4%; right: 4%; top: 66%; text-align: center; font-family: 'Silkscreen', monospace; color: #e3d9c3; text-shadow: 5px 5px 0 #0e0d0c; }
#r11-hook .d { font-size: 46px; letter-spacing: 0.1em; color: #c9b99a; }
#r11-hook .n { font-size: 76px; line-height: 1; color: #c8553d; }
#r11-hook .s { font-size: 30px; }
.r11-tag { position: absolute; transform: translate(-50%, -100%); font-family: 'Silkscreen', monospace; font-size: 24px; padding: 6px 12px; background: rgba(14,13,12,0.9); border: 3px solid #524a3f; white-space: nowrap; text-shadow: 2px 2px 0 #0e0d0c; opacity: 0; text-align: center; color: #e3d9c3; }
.r11-tag b { font-size: 40px; font-weight: 400; margin-left: 8px; }
.r11-tag small { display: block; font-family: 'VT323', monospace; font-size: 26px; color: #c9b99a; }
.r11-tag.gold { border-color: #d98f3f; } .r11-tag.gold small { color: #d98f3f; }
.r11-tag.dead { border-color: #a33b2b; } .r11-tag.dead small { color: #c8553d; }
.r11-panel { left: 7%; right: 7%; background: rgba(14,13,12,0.93); border: 3px solid #524a3f; padding: 14px 16px; opacity: 0; }
.r11-panel .t { font-family: 'Silkscreen', monospace; font-size: 20px; color: #d98f3f; text-align: center; letter-spacing: 0.08em; margin-bottom: 8px; }
.r11-panel .row { display: flex; justify-content: space-between; align-items: baseline; font-family: 'Silkscreen', monospace; font-size: 22px; margin: 4px 0; color: #e3d9c3; }
.r11-panel .row b { font-size: 36px; font-weight: 400; }
.r11-panel .bar { height: 16px; background: #1c1a17; border: 2px solid #524a3f; position: relative; margin-bottom: 6px; } .r11-panel .bar i { position: absolute; left: 0; top: 0; bottom: 0; }
.r11-panel .note { font-family: 'VT323', monospace; font-size: 28px; color: #c9b99a; text-align: center; margin-top: 8px; }
#r11-hosp { top: 68%; } #r11-mill { top: 30%; } #r11-medic { top: 62%; border-color: #a33b2b; }
#r11-big { left: 0; right: 0; top: 28%; text-align: center; font-family: 'Silkscreen', monospace; color: #e3d9c3; text-shadow: 6px 6px 0 #0e0d0c; opacity: 0; }
#r11-big .k { font-size: 30px; letter-spacing: 0.12em; color: #c9b99a; }
#r11-big b { display: block; font-size: 120px; font-weight: 400; color: #c9c26a; line-height: 1; }
#r11-big .p { font-size: 34px; color: #d98f3f; margin-top: 10px; }
#r11-cta { left: 6%; right: 6%; top: 56%; text-align: center; background: rgba(14,13,12,0.94); border: 4px solid #d98f3f; padding: 16px; opacity: 0; }
#r11-cta .k { font-family: 'Silkscreen', monospace; font-size: 18px; color: #c9b99a; letter-spacing: 0.2em; }
#r11-cta .big { font-family: 'Silkscreen', monospace; font-size: 40px; color: #d98f3f; line-height: 1.1; margin: 4px 0; }
#r11-cta .sm { font-family: 'VT323', monospace; font-size: 30px; color: #e3d9c3; }
#r11-cta .url { font-family: 'Silkscreen', monospace; font-size: 34px; color: #e3d9c3; margin-top: 10px; border-top: 2px solid #524a3f; padding-top: 10px; }
#r11-night { inset: 0; background: rgba(40, 46, 90, 0.34); mix-blend-mode: multiply; opacity: 0; }
`;

export async function startDay11Reel({ cam, life, map, soldiers, tex, anims }) {
  let vo = files['../../marketing/reels/front11.vo.json'];
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
  const front = (f) => soldiers.filter((q) => q.faction === f && q.slot?.line === 'front' && !q.vacant).sort((a, b) => a.x - b.x);
  const fH = front(0), fC = front(1);
  const mH = fH[Math.floor(fH.length / 2)], mC = fC[Math.floor(fC.length / 2)];
  const mid = ((map.front[0] + map.front[1]) / 2) * T;
  const F = window.__front || {};
  const hosp = F.hospitals?.sites?.find((s) => s.faction === 0) || { x: mH.x, y: mH.y - 120 };
  const gunPit = F.gunFx?.guns?.[0] || { x: mH.x, y: mH.y - 160 };
  const ali = by('alice.is.ali') || mH, kit = by('buff_kitty85') || mC, sebs = by('_sebs.c_') || mH, wiz = by('flying_wizzerd') || mC;
  const rak = by('rakan_1027') || mC;

  const tVoice2 = (tt.voice + tt.bonds) / 2, tArmyC = (tt.army + tt.cta) / 2;
  const K = [[tt.sick, mH.x, mH.y, 2, 'cut']];
  K.push([tt.medic, hosp.x - 40, hosp.y, 2.6, 'cut'], [tt.ali - 0.01, hosp.x + 40, hosp.y, 2.8]);
  K.push([tt.ali, ali.x, ali.y - 24, 4.6, 'cut'], [tt.mill - 0.01, ali.x + 6, ali.y - 24, 5.2]);
  K.push([tt.mill, mH.x - 260, mid, 1.2, 'cut'], [tt.gun - 0.01, mH.x + 260, mid, 1.3]);
  K.push([tt.gun, gunPit.x, gunPit.y - 6, 3.4, 'cut'], [tt.voice - 0.01, gunPit.x, gunPit.y - 6, 4.0]);
  K.push([tt.voice, sebs.x, sebs.y - 24, 4.6, 'cut'], [tVoice2 - 0.01, sebs.x + 6, sebs.y - 24, 5.0], [tVoice2, wiz.x, wiz.y - 24, 4.6, 'cut'], [tt.bonds - 0.01, wiz.x - 6, wiz.y - 24, 5.0]);
  K.push([tt.bonds, rak.x, rak.y - 24, 4.4, 'cut'], [tt.big - 0.01, rak.x + 6, rak.y - 24, 4.8]);
  K.push([tt.big, mC.x, mC.y - 20, 6.0, 'cut'], [tt.army - 0.01, mC.x, mid, 0.45, 'ease']);
  K.push([tt.army, mH.x - 240, mH.y + 10, 2.2, 'cut'], [tArmyC - 0.01, mH.x + 240, mH.y + 10, 2.4], [tArmyC, mC.x + 240, mC.y - 10, 2.2, 'cut'], [tt.cta - 0.01, mC.x - 240, mC.y - 10, 2.4]);
  K.push([tt.cta, mC.x, mid, 0.8, 'cut'], [END, mC.x + 200, mid, 0.85]);
  const camAt = camPath(K);
  const sub = subtitles(vo);
  const fx = transitions([[tt.hosp, 'flash'], [tt.sick, 'black', 0.4], [tt.medic, 'flash'], [tt.ali, 'black', 0.4], [tt.mill, 'black', 0.4], [tt.gun, 'flash'],
    [tt.voice, 'whip'], [tVoice2, 'whip'], [tt.bonds, 'flash'], [tt.big, 'flash'], [tt.army, 'flash'], [tArmyC, 'whip'], [tt.cta, 'black', 0.4]]);
  const SFX = [[tt.mill, 'drum', 0], [tt.big, 'drum', 0], [tt.army, 'drum', 0], [tt.cta, 'drum', 0], [END - 1.3, 'end', 0]];
  for (let k = 0; k < 4; k++) SFX.push([+(tt.gun + 0.6 + k * 2.2).toFixed(2), 'stamp', 0]);
  const line = soldiers.filter((s) => !s.vacant && s.slot?.line === 'front');
  const shots = []; for (let k = 0, t = tt.big + 0.3; t < tt.cta; t += 0.2, k++) shots.push([t, line[(k * 53) % Math.max(1, line.length)]]);

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  root.innerHTML = `
    <div id="r11-night"></div>
    <div id="r11-hook"><div class="d">DAY 11</div><div class="n">${D.fell[0] + D.fell[1]} FELL</div><div class="s">THE AID POSTS ARE FULL</div></div>
    <div id="r11-hosp" class="r11-panel"><div class="t">THE HOSPITALS</div>
      <div class="row"><span>BEDS</span><b>8/8 · 8/8</b></div><div class="row"><span>ON STRETCHERS</span><b>33 · 34</b></div>
      <div class="row"><span>MEDICS REACH</span><b>73% · 88%</b></div><div class="note">Hegemony · Concord</div></div>
    <div id="r11-medic" class="r11-panel"><div class="t">THE FRONT NEEDS MEDICS</div><div class="note">new soldiers: comment<br><b style="color:#e3d9c3">HEGEMONY MEDIC</b> or <b style="color:#e3d9c3">CONCORD MEDIC</b></div></div>
    <div id="r11-ali" class="r11-tag dead">RAFAEL ALI ✝<small>@alice.is.ali · heir Karel: MEDIC</small></div>
    <div id="r11-mill" class="r11-panel"><div class="t">THE RACE FOR GREY MILL</div>
      <div class="row"><span>HEGEMONY</span><b>${D.race[0]}</b></div><div class="bar"><i style="width:${D.race[0] / 3}%;background:#8f8a82"></i></div>
      <div class="row"><span>CONCORD</span><b>${D.race[1]}</b></div><div class="bar"><i style="width:${D.race[1] / 3}%;background:#8a8a52"></i></div>
      <div class="note">first to 300 new soldiers takes the mill</div></div>
    <div id="r11-gun" class="r11-tag gold">THE PRIZE: A HEAVY HOWITZER<small>fires every day · until it is destroyed</small></div>
    <div id="r11-sebs" class="r11-tag gold">KONRAD SEBS<small>@_sebs.c_ · Propagandist of the Hegemony</small></div>
    <div id="r11-wiz" class="r11-tag gold">BASTIAN WIZZERD<small>@flying_wizzerd · Propagandist of the Concord</small></div>
    <div id="r11-bonds" class="r11-tag gold">★ WAR BONDS<small>Walter · Anselm · Quentin<br>Zeno · Lucien</small></div>
    <div id="r11-big"><div class="k">THE CONCORD</div><b>1,000</b><div class="p">+${D.joined} SOLDIERS YESTERDAY</div></div>
    <div id="r11-tagH" class="r11-tag">HEGEMONY<b>${D.army[0]}</b></div>
    <div id="r11-tagC" class="r11-tag">CONCORD<b>${D.army[1].toLocaleString('en-US')}</b></div>
    <div id="r11-cta"><div class="k">COMING SOON ON PATREON</div><div class="big">FRONT NEWS</div><div class="sm">the first days of the war, day by day</div><div class="url">mudandiron.app</div></div>
    <div id="rd-big"></div>
    <div id="rd-sub"></div>
  `;
  document.body.appendChild(root);
  const ct = makeVertCine(tex, anims);
  ct.canvas.id = 'r11-cine';
  root.insertBefore(ct.canvas, root.querySelector('#r11-hook'));
  const paint = fxLayers(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };
  let si = 0;

  function frame(t) {
    const f = fx(t);
    for (const q of soldiers) if (q.vacant && q.sprite && q.sprite.alpha < 1) { q.sprite.alpha = 1; q.sprite.tint = [0xffffff, 0xf0ece4, 0xe6e2da, 0xfff4e8][q.variant % 4]; } // žádní duchové
    const [x, y, z] = camAt(Math.max(t, tt.sick));
    cam.set(x, y, z);
    while (si < shots.length && shots[si][0] <= t) { if (shots[si][1]) life.debug.shoot([shots[si][1]]); si++; }
    // kreslené detaily: přeplněný lazaret (háček a nemocnice), mokrý zákop (nemoci)
    const film = t < tt.sick ? ['ward', t, { dim: clamp01(t / (tt.sick + 1)) * 0.3 }] : t < tt.medic ? ['trench', t - tt.sick + 2, {}] : null;
    if (film) ct.draw(film[0], film[1], film[2]);
    show('#r11-cine', film ? 1 : 0);
    show('#r11-night', !film && t < tt.mill ? 1 : 0);
    paint({ ...f, black: Math.max(f.black, t > END - 0.6 ? clamp01((t - END + 0.6) / 0.5) : 0) });
    const hk = $('#r11-hook');
    hk.style.opacity = t < tt.hosp - 0.1 ? 1 : 0;
    hk.style.transform = `scale(${1 + 0.12 * clamp01(1 - t / 0.25)})`;
    show('#r11-hosp', win(t, tt.hosp + 0.2, tt.sick - 0.05, 0.2));
    show('#r11-medic', win(t, tt.medic + 0.3, tt.ali - 0.05, 0.2));
    tagAt($('#r11-ali'), { x: ali.x, y: ali.y + 50 }, cam, win(t, tt.ali + 0.3, tt.mill - 0.05, 0.15), 0);
    show('#r11-mill', win(t, tt.mill + 0.2, tt.gun - 0.05, 0.2));
    tagAt($('#r11-gun'), { x: gunPit.x, y: gunPit.y + 60 }, cam, win(t, tt.gun + 0.3, tt.voice - 0.05, 0.2), 0);
    tagAt($('#r11-sebs'), { x: sebs.x, y: sebs.y + 50 }, cam, win(t, tt.voice + 0.3, tVoice2 - 0.05, 0.15), 0);
    tagAt($('#r11-wiz'), { x: wiz.x, y: wiz.y + 50 }, cam, win(t, tVoice2 + 0.2, tt.bonds - 0.05, 0.15), 0);
    tagAt($('#r11-bonds'), { x: rak.x, y: rak.y + 52 }, cam, win(t, tt.bonds + 0.2, tt.big - 0.05, 0.2), 0);
    show('#r11-big', win(t, tt.big + 0.2, tt.army - 0.05, 0.25));
    $('#r11-big b').textContent = Math.round(1000 * easeOut(clamp01((t - tt.big - 0.2) / ((tt.army - tt.big) * 0.6)))).toLocaleString('en-US');
    tagAt($('#r11-tagH'), { x, y: y - 30 }, cam, win(t, tt.army + 0.2, tArmyC - 0.05, 0.2), 0);
    tagAt($('#r11-tagC'), { x, y: y - 30 }, cam, win(t, tArmyC + 0.1, tt.cta - 0.05, 0.2), 0);
    slam($('#r11-cta'), t, tt.cta + 0.3, END - 1.4, 1.3, -3);
    const logo = t >= END - 1.3;
    const bigEl = $('#rd-big');
    bigEl.style.opacity = logo ? Math.min(1, (t - END + 1.3) / 0.3) : 0;
    if (logo && !bigEl.dataset.on) { bigEl.dataset.on = 1; bigEl.className = 'logo'; bigEl.innerHTML = '<span>MUD <i>&amp;</i> IRON</span><span>@mudandiron · mudandiron.app</span>'; }
    const s = sub(t);
    const subEl = $('#rd-sub');
    if (s && !logo && t >= tt.hosp && !(t >= tt.big && t < tt.army)) { subEl.style.opacity = 1; subEl.style.top = '13%'; if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; } } else subEl.style.opacity = 0;
  }

  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
