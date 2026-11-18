// Day reel Day 9 (18. 11. 2026, noviny 18. 11. 13:00 UTC; /?reel=front9&vacant=700, jen vývojový server), do minuty, rychlý háček:
//  HÁČEK 0–3,5 s: boj zblízka PŘÍMO NA MAPĚ (raider Concordu s lopatkou v zákopu Hegemonie, obránce padne, soused raidera zastřelí) + DAY 9 a „33 DEAD“
//  → palba dvakrát denně (výstřely po celé linii) → padlí s příčinami (bunkry Hegemonie stojí, Concordu v troskách)
//  → příběh Marka Hama (skutečný hráč, zastřelen @gremlin_jngaf) → noví piloti a jejich letadla nad frontou
//  → přírůstek a počty → závod o Blackwater Canal → raideři se plazí zemí nikoho pod světlicí → raid Hegemonie v zákopu Concordu → výzva RAID.
// Hlas: marketing/reels/front9.script.json. Boj: web/src/fight-fx.js (herní sprity + lopatka z PixelLabu ve stejném měřítku). Uživatel 18. 11.: žádné detailní obrázky pozadí.
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, slam, clamp01, win, easeOut, tagAt } from './reel-kit.js';
import script from '../../marketing/reels/front9.script.json';
import { makeFight } from './fight-fx.js';

const files = import.meta.glob('../../marketing/reels/front9.vo.json', { eager: true, import: 'default' });

const D = {
  dead: 33, fell: [13, 20], hit: [39, 48], army: [300, 316], joined: 101, race: [52, 42],
  story: { handle: 'rals.ham', name: 'Marek Ham', by: 'gremlin_jngaf', line: 'killed passing a message' },
  pilots: [['eurotrashhhhhh', 'Dorian "Owl" Eurotrashhhh', 32], ['antonioo_sg', 'Nils Antonioo', 29]],
};

const CSS = `${BASE}${FX_CSS}
#r9-flare { inset: 0; background: radial-gradient(circle at 60% 8%, rgba(255,246,220,0.7) 0, rgba(255,246,220,0.3) 25%, rgba(255,246,220,0.08) 55%, rgba(0,0,0,0) 75%); mix-blend-mode: screen; opacity: 0; }
#r9-flash { inset: 0; background: #fff6dc; opacity: 0; }
#r9-hook { left: 4%; right: 4%; top: 12%; text-align: center; background: rgba(14,13,12,0.72); padding: 10px 0 14px; border-top: 3px solid #a33b2b; border-bottom: 3px solid #a33b2b; font-family: 'Silkscreen', monospace; color: #e3d9c3; text-shadow: 5px 5px 0 #0e0d0c; }
#r9-hook .d { font-size: 44px; letter-spacing: 0.1em; color: #c9b99a; }
#r9-hook .n { font-size: 92px; line-height: 1; color: #c8553d; }
#r9-hook .s { font-size: 34px; }
.r9-tag { position: absolute; transform: translate(-50%, -100%); font-family: 'Silkscreen', monospace; font-size: 24px; padding: 6px 12px; background: rgba(14,13,12,0.9); border: 3px solid #524a3f; white-space: nowrap; text-shadow: 2px 2px 0 #0e0d0c; opacity: 0; text-align: center; color: #e3d9c3; }
.r9-tag b { font-size: 40px; font-weight: 400; margin-left: 8px; }
.r9-tag small { display: block; font-family: 'VT323', monospace; font-size: 26px; color: #c9b99a; }
.r9-tag.gold { border-color: #d98f3f; } #r9-p0, #r9-p1 { left: 50%; top: 24%; transform: translate(-50%, 0); font-size: 24px; } .r9-tag.gold small { color: #d98f3f; }
.r9-tag.red { border-color: #a33b2b; } .r9-tag.red small { color: #c8553d; }
.r9-panel { left: 7%; right: 7%; background: rgba(14,13,12,0.92); border: 3px solid #524a3f; padding: 14px 16px; opacity: 0; }
.r9-panel .t { font-family: 'Silkscreen', monospace; font-size: 20px; color: #d98f3f; text-align: center; letter-spacing: 0.08em; margin-bottom: 8px; }
.r9-panel .row { display: flex; justify-content: space-between; align-items: baseline; font-family: 'Silkscreen', monospace; font-size: 22px; margin: 4px 0; color: #e3d9c3; }
.r9-panel .row b { font-size: 44px; font-weight: 400; }
.r9-panel .note { font-family: 'VT323', monospace; font-size: 28px; color: #c9b99a; text-align: center; margin-top: 8px; }
.r9-bar { height: 22px; background: #1c1a17; border: 2px solid #524a3f; position: relative; margin-bottom: 8px; } .r9-bar i { position: absolute; left: 0; top: 0; bottom: 0; width: 0; }
#r9-two { top: 60%; } #r9-toll { top: 21%; } #r9-race { top: 26%; } #r9-army { top: 24%; }
#r9-cta { left: 6%; right: 6%; top: 60%; text-align: center; background: rgba(14,13,12,0.93); border: 4px solid #c8553d; padding: 16px; opacity: 0; }
#r9-cta .big { font-family: 'Silkscreen', monospace; font-size: 46px; color: #c8553d; line-height: 1.1; }
#r9-cta .sm { font-family: 'VT323', monospace; font-size: 30px; color: #e3d9c3; margin-top: 6px; }
#r9-night { inset: 0; background: rgba(40, 46, 90, 0.38); mix-blend-mode: multiply; opacity: 0; }
`;

export async function startDay9Reel({ cam, life, map, soldiers, tex, anims }) {
  let vo = files['../../marketing/reels/front9.vo.json'];
  if (!vo) {
    let c = 0;
    vo = { lines: script.lines.map(([at, text, id]) => { const s = Math.max(at, c), d = text.length / 15 + 0.2; c = s + d + 0.25; return [s, d, text, id]; }) };
    vo.seconds = c + 2.6;
  }
  const C = cues(vo);
  const at = C.at, END = vo.seconds;
  const T = map.tile;
  const by = (h) => soldiers.find((s) => s.handle === h);
  const lineMid = (f) => { const l = soldiers.filter((s) => s.faction === f && s.slot?.line === 'front' && !s.vacant).sort((a, b) => a.x - b.x); return l[Math.floor(l.length / 2)]; };
  const mH = lineMid(0), mC = lineMid(1);
  const F = window.__front || {};
  const pbs = F.orderFx?.pillboxes || [];
  const nearest = (list, ref) => list.slice().sort((a, b) => Math.abs(a.s.x - ref.x) - Math.abs(b.s.x - ref.x))[0];
  const boxH = nearest(pbs.filter((p) => p.f === 0 && !p.ruin), mH)?.s || mH;
  const ruinC = nearest(pbs.filter((p) => p.f === 1 && p.ruin), mC)?.s || mC;
  const ham = by(D.story.handle) || mC;
  const planes = F.planeFx;
  const mid = ((map.front[0] + map.front[1]) / 2) * T;

  const id = ['hook', 'deadly', 'toll', 'story', 'pilots', 'army', 'race', 'raid', 'raid2', 'cta'];
  const tt = Object.fromEntries(id.map((k) => [k, at(k)]));
  const half = (a, b) => a + (b - a) / 2;
  const tToll2 = half(tt.toll, tt.story), tPil2 = half(tt.pilots, tt.army), tArmyC = half(tt.army, tt.race) + 0.5;
  planes?.placeAt?.(0, tt.pilots + 0.5, mC.x - 100); // letadlo Hegemonie nad frontou Concordu
  planes?.placeAt?.(1, tPil2 + 0.5, mH.x + 100); // letadlo Concordu nad frontou Hegemonie
  // boj zblízka na mapě: obránci = skuteční vojáci v přední linii (jejich sprite se na chvíli schová), soused vystřelí
  const front = (f) => soldiers.filter((q) => q.faction === f && q.slot?.line === 'front' && !q.vacant).sort((a, b) => a.x - b.x);
  const fH = front(0), fC = front(1);
  // obránce na volném místě zákopu (žádný bunkr do 90 px), se sousedem pro výstřel
  const clear = (q) => !pbs.some((p) => Math.abs(p.s.x - q.x) < 90 && Math.abs(p.s.y - q.y) < 60);
  const pickDef = (list, from) => { for (let i = from; i < list.length - 1; i++) if (clear(list[i]) && Math.abs(list[i + 1].x - list[i].x) < 40) return [list[i], list[i + 1]]; return [list[from], list[from + 1]]; };
  const [defH, shH] = pickDef(fH, Math.floor(fH.length / 2));
  const [defC, shC] = pickDef(fC, Math.floor(fC.length / 2) + 6);
  const fight = await makeFight({ anims, soldiers });
  // háček: souboj lopatek hned od prvního snímku (oba už stojí v zákopu), obránce padne, soused raidera zastřelí
  const F1 = fight.scene({ at: 0, defender: defH, side: 1, shooter: shH, end: tt.deadly });
  // raid: víc dvojic najednou v zákopu Concordu (raideři Hegemonie), jeden obránce vyhraje, střelec je vidět od začátku
  const iC = fC.indexOf(defC);
  const crowd = [fC[iC], fC[iC + 2], fC[iC + 4], fC[iC - 2]].filter(Boolean);
  const F2 = fight.scene({ at: tt.raid2, defender: crowd[0], side: 0, shooter: shC === crowd[1] ? null : shC, end: END });
  const F3 = fight.scene({ at: tt.raid2, defender: crowd[1], side: 0, win: 'defender', delay: 0.35, end: END });
  const F4 = fight.scene({ at: tt.raid2, defender: crowd[2], side: 0, delay: 0.7, end: END });
  const F5 = fight.scene({ at: tt.raid2, defender: crowd[3], side: 0, win: 'defender', delay: 0.2, end: END });
  // druhá vlna dál vpravo (kamera se k ní posune), ať se bojuje až do výzvy
  const W2 = tt.raid2 + 3.2;
  const F6 = fight.scene({ at: tt.raid2, defender: fC[iC + 6], side: 0, delay: W2 - tt.raid2, end: END });
  const F7 = fight.scene({ at: tt.raid2, defender: fC[iC + 8], side: 0, win: 'defender', delay: W2 - tt.raid2 + 0.5, end: END });
  const F8 = fight.scene({ at: tt.raid2, defender: fC[iC + 10], side: 0, delay: W2 - tt.raid2 + 1.1, end: END });
  // raideři Hegemonie se plazí zemí nikoho čelem k divákovi (k zákopu Concordu)
  fight.crawlers({ at: tt.raid, end: tt.raid2, x: mC.x, y: mid - 14, n: 5, side: 0 });
  const K = [[0, defH.x + 4, defH.y - 22, 8.0], [tt.deadly - 0.01, defH.x + 6, defH.y - 22, 8.6]];
  K.push([tt.deadly, mC.x - 300, mid, 1.15, 'cut'], [tt.toll - 0.01, mC.x + 300, mid, 1.25]);
  K.push([tt.toll, boxH.x - 20, boxH.y - 16, 3.4, 'cut'], [tToll2 - 0.01, boxH.x + 10, boxH.y - 16, 3.7]);
  K.push([tToll2, ruinC.x - 20, ruinC.y - 18, 3.4, 'cut'], [tt.story - 0.01, ruinC.x + 10, ruinC.y - 18, 3.7]);
  K.push([tt.story, ham.x - 10, ham.y - 24, 4.2, 'cut'], [tt.pilots - 0.01, ham.x + 6, ham.y - 24, 4.7]);
  K.push([tt.army, mH.x - 240, mH.y + 10, 2.2, 'cut'], [tArmyC - 0.01, mH.x + 240, mH.y + 10, 2.4]);
  K.push([tArmyC, mC.x + 240, mC.y - 10, 2.2, 'cut'], [tt.race - 0.01, mC.x - 240, mC.y - 10, 2.4]);
  K.push([tt.race, mH.x - 220, mid, 1.2, 'cut'], [tt.raid - 0.01, mH.x + 220, mid, 1.3]);
  K.push([tt.raid, mC.x, mid, 6.0, 'cut'], [tt.raid2 - 0.01, mC.x, mid - 14, 6.6]);
  K.push([tt.raid2, defC.x + 22, defC.y - 22, 6.0, 'cut'], [tt.raid2 + 2.6, defC.x + 30, defC.y - 22, 6.2], [tt.raid2 + 3.4, (fC[iC + 8] || defC).x + 10, defC.y - 22, 6.2, 'ease'], [END, (fC[iC + 8] || defC).x + 16, defC.y - 22, 6.4]); // víc dvojic v záběru, pak druhá vlna
  const camPathAt = camPath(K);
  const camAt = (t) => {
    if (t >= tt.pilots && t < tt.army) { const p = planes?.poseOf?.(t < tPil2 ? 0 : 1, t * 1000); if (p) return [p.x + p.dir * 20, p.y + 10, 2.6]; }
    return camPathAt(t);
  };
  const sub = subtitles(vo);
  const night = (t) => t < tt.deadly || t >= tt.raid; // noc: háček a raid
  const flashes = [F1?.hit, F1?.shot, F2?.hit, F2?.shot, F3?.hit, F4?.hit, F6?.hit, F8?.hit].filter(Boolean);
  const fx = transitions([[tt.deadly, 'flash'], [tt.toll, 'whip'], [tToll2, 'whip'], [tt.story, 'black', 0.3], [tt.pilots, 'flash'], [tPil2, 'whip'], [tt.army, 'flash'], [tArmyC, 'whip'], [tt.race, 'flash'], [tt.raid, 'black', 0.35], [tt.raid2, 'whip']]);
  // palba dvakrát denně: výstřely po celé linii obou stran
  const line = soldiers.filter((s) => !s.vacant && s.slot?.line === 'front' && Math.abs(s.x - mC.x) < 700);
  const shots = [];
  for (let k = 0, t = tt.deadly + 0.1; t < tt.toll - 0.2; t += 0.12, k++) shots.push([t, line[(k * 37) % Math.max(1, line.length)]]);
  for (let k = 0, t = tt.story + 0.5; t < tt.story + 1.2; t += 0.6, k++) shots.push([t, by(D.story.by)].filter(Boolean));
  const SFX = shots.filter((s) => s[1]).map(([t]) => [+t.toFixed(2), 'shoot', 0]);
  for (const F of [F1, F2, F3, F4, F5, F6, F7, F8]) { if (F?.hit) SFX.push([+F.hit.toFixed(2), 'stamp', 0]); if (F?.shot) SFX.push([+F.shot.toFixed(2), 'shoot', 0]); }
  SFX.push( [tt.toll, 'drum', 0], [tt.race, 'drum', 0], [tt.cta, 'drum', 0], [END - 1.3, 'end', 0]);

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  const bars = (a, b) => `<div class="row"><span>HEGEMONY</span><b class="n" data-v="${a}">0</b></div><div class="r9-bar"><i data-w="${(a / Math.max(a, b)) * 100}" style="background:#8f8a82"></i></div>
      <div class="row"><span>CONCORD</span><b class="n" data-v="${b}">0</b></div><div class="r9-bar"><i data-w="${(b / Math.max(a, b)) * 100}" style="background:#8a8a52"></i></div>`;
  root.innerHTML = `
    <div id="r9-night"></div>
    <div id="r9-flare"></div>
    <div id="r9-flash"></div>
    <div id="r9-hook"><div class="d">DAY 9</div><div class="n">${D.dead} DEAD</div><div class="s">IN ONE DAY</div></div>
    <div id="r9-two" class="r9-panel"><div class="t">NEW ORDERS</div><div class="row" style="justify-content:center"><b>2 SHOTS</b>&nbsp;<span>A DAY · EVERY RIFLE</span></div></div>
    <div id="r9-toll" class="r9-panel"><div class="t">DAY 9 · THE DEAD</div>
      <div class="row"><span>CONCORD</span><b>${D.fell[1]}</b></div><div class="row"><span>HEGEMONY</span><b>${D.fell[0]}</b></div>
      <div class="note">${D.hit[0] + D.hit[1]} wounded · nearly all by rifle fire</div></div>
    <div id="r9-boxH" class="r9-tag">HEGEMONY PILLBOX<small>still standing</small></div>
    <div id="r9-ruinC" class="r9-tag red">CONCORD PILLBOX<small>in ruins</small></div>
    <div id="r9-ham" class="r9-tag red">† ${D.story.name.toUpperCase()}<small>@${D.story.handle} · shot by @${D.story.by}</small></div>
    <div id="r9-p0" class="r9-tag gold">✈ ${'DORIAN "OWL"'}<small>@${D.pilots[0][0]} · Hegemony pilot</small></div>
    <div id="r9-p1" class="r9-tag gold">✈ ${'NILS ANTONIOO'}<small>@${D.pilots[1][0]} · Concord pilot</small></div>
    <div id="r9-army" class="r9-panel"><div class="t">THE FRONT TODAY</div><div class="row"><span>NEW YESTERDAY</span><b>+${D.joined}</b></div>
      <div class="row"><span>ON THE LINE</span><b>${D.army[0] + D.army[1]}</b></div></div>
    <div id="r9-tagH" class="r9-tag">HEGEMONY<b>${D.army[0]}</b></div>
    <div id="r9-tagC" class="r9-tag">CONCORD<b>${D.army[1]}</b></div>
    <div id="r9-race" class="r9-panel"><div class="t">BLACKWATER CANAL · ENEMY DEAD</div>${bars(...D.race)}<div class="note">first to 100 takes the canal</div></div>
    <div id="r9-cta"><div class="big">COMMENT<br>RAID</div><div class="sm">Your soldier goes over the top tonight.<br>Results in the Gazette, 13:00 UTC</div></div>
    <div id="rd-big"></div>
    <div id="rd-sub"></div>
  `;
  document.body.appendChild(root);
  const paint = fxLayers(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };
  const grow = (sel, t, t0) => {
    const u = easeOut(clamp01((t - t0) / 1.3));
    root.querySelectorAll(`${sel} .n`).forEach((el) => (el.textContent = Math.round(Number(el.dataset.v) * u)));
    root.querySelectorAll(`${sel} i`).forEach((el) => (el.style.width = `${Number(el.dataset.w) * u}%`));
  };
  let si = 0;

  function frame(t) {
    const f = fx(t);
    for (const q of soldiers) if (q.vacant && q.sprite && q.sprite.alpha < 1) { q.sprite.alpha = 1; q.sprite.tint = [0xffffff, 0xf0ece4, 0xe6e2da, 0xfff4e8][q.variant % 4]; } // žádní duchové
    const [x, y, z] = camAt(t);
    cam.set(x, y, z * (1 + 0.04 * f.punch));
    while (si < shots.length && shots[si][0] <= t) { if (shots[si][1]) life.debug.shoot([shots[si][1]]); si++; }
    fight.update(t);
    const n = night(t);
    show('#r9-night', n ? 1 : 0);
    show('#r9-flare', n ? 0.5 + Math.sin(t * 11) * 0.08 : 0); // světlice nad frontou
    const fh = flashes.find((q) => t >= q && t < q + 0.12);
    show('#r9-flash', fh != null ? 0.55 * (1 - (t - fh) / 0.12) : 0);
    paint({ ...f, black: Math.max(f.black, t > END - 0.6 ? clamp01((t - END + 0.6) / 0.5) : 0) });

    // háček: od prvního snímku, bez náběhu
    const hk = $('#r9-hook');
    hk.style.opacity = t < tt.deadly ? 1 : 0;
    hk.style.transform = `scale(${1 + 0.12 * clamp01(1 - t / 0.25)})`;
    show('#r9-two', win(t, tt.deadly + 0.2, tt.toll - 0.05, 0.15));
    show('#r9-toll', win(t, tt.toll + 0.1, tt.story - 0.05, 0.2));
    tagAt($('#r9-boxH'), { x: boxH.x, y: boxH.y + 40 }, cam, win(t, tt.toll + 0.3, tToll2 - 0.05, 0.15), 0);
    tagAt($('#r9-ruinC'), { x: ruinC.x, y: ruinC.y + 44 }, cam, win(t, tToll2 + 0.2, tt.story - 0.05, 0.15), 0);
    tagAt($('#r9-ham'), { x: ham.x, y: ham.y - 30 }, cam, win(t, tt.story + 0.3, tt.pilots - 0.05, 0.2), 0);
    show('#r9-p0', win(t, tt.pilots + 0.3, tPil2 - 0.05, 0.15)); show('#r9-p1', win(t, tPil2 + 0.3, tt.army - 0.05, 0.15)); // pevně pod titulky (letadlo se hýbe rychle)
    show('#r9-army', win(t, tt.army + 0.1, tt.army + 2.2, 0.2));
    tagAt($('#r9-tagH'), { x, y: y - 30 }, cam, win(t, tt.army + 2.3, tArmyC - 0.05, 0.2), 0);
    tagAt($('#r9-tagC'), { x, y: y - 30 }, cam, win(t, tArmyC + 0.1, tt.race - 0.05, 0.2), 0);
    show('#r9-race', win(t, tt.race + 0.1, tt.raid - 0.05, 0.2));
    grow('#r9-race', t, tt.race + 0.3);
    slam($('#r9-cta'), t, tt.cta - 0.1, END - 1.4, 1.35, -4);
    const logo = t >= END - 1.3;
    const bigEl = $('#rd-big');
    bigEl.style.opacity = logo ? Math.min(1, (t - END + 1.3) / 0.3) : 0;
    if (logo && !bigEl.dataset.on) { bigEl.dataset.on = 1; bigEl.className = 'logo'; bigEl.innerHTML = '<span>MUD <i>&amp;</i> IRON</span><span>@mudandiron · link in bio</span>'; }
    const s = sub(t);
    const subEl = $('#rd-sub');
    if (s && !logo && t >= tt.deadly) {
      subEl.style.opacity = 1;
      subEl.style.top = '13%';
      if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; }
    } else subEl.style.opacity = 0;
  }

  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
