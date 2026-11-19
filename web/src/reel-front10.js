// Day reel Day 10 (19. 11. 2026, noviny 19. 11. 13:00 UTC; /?reel=front10&vacant=700, jen vývojový server), na výšku, ~65 s:
//  HÁČEK: noční raid přímo ve hře (víc dvojic se mlátí lopatkami v zákopu Concordu, střelec obránců) + DAY 10 a „186 WENT OVER THE TOP“
//  → druhá vlna v zákopu Hegemonie (raideři Concordu) → nejstatečnější (Enjoyer, Alessiosanto) → kanál pro Hegemonii (zásoby), hrdina Cubes
//  → ztráty (126) a druhá nemocnice → HRDINSKÁ OSLAVA: kamera se z jednoho vojáka vzdálí na celou frontu, počítadlo 1 435, +791 za den
//  → přejezd po liniích s počty obou stran → War Bonds (hvězda Thatdudesica) → Grey Mill 300 a výzva.
// Hlas: marketing/reels/front10.script.json, boj: web/src/fight-fx.js (herní sprity + lopatka), hudba war_score.
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, slam, clamp01, win, easeOut, tagAt } from './reel-kit.js';
import { makeFight } from './fight-fx.js';
import script from '../../marketing/reels/front10.script.json';

const files = import.meta.glob('../../marketing/reels/front10.vo.json', { eager: true, import: 'default' });
const D = { army: [616, 819], joined: 791, fell: [58, 68], raid: [[87, 35, 5], [99, 32, 12]], canal: [120, 100] };

const CSS = `${BASE}${FX_CSS}
#r10-hook { left: 4%; right: 4%; top: 12%; text-align: center; font-family: 'Silkscreen', monospace; color: #e3d9c3; text-shadow: 5px 5px 0 #0e0d0c; background: rgba(14,13,12,0.72); padding: 10px 0 14px; border-top: 3px solid #a33b2b; border-bottom: 3px solid #a33b2b; }
#r10-hook .d { font-size: 44px; letter-spacing: 0.1em; color: #c9b99a; }
#r10-hook .n { font-size: 78px; line-height: 1; color: #c8553d; }
#r10-hook .s { font-size: 30px; }
.r10-tag { position: absolute; transform: translate(-50%, -100%); font-family: 'Silkscreen', monospace; font-size: 24px; padding: 6px 12px; background: rgba(14,13,12,0.9); border: 3px solid #524a3f; white-space: nowrap; text-shadow: 2px 2px 0 #0e0d0c; opacity: 0; text-align: center; color: #e3d9c3; }
.r10-tag b { font-size: 40px; font-weight: 400; margin-left: 8px; }
.r10-tag small { display: block; font-family: 'VT323', monospace; font-size: 26px; color: #c9b99a; }
.r10-tag.gold { border-color: #d98f3f; } .r10-tag.gold small { color: #d98f3f; }
.r10-panel { left: 7%; right: 7%; background: rgba(14,13,12,0.92); border: 3px solid #524a3f; padding: 14px 16px; opacity: 0; }
.r10-panel .t { font-family: 'Silkscreen', monospace; font-size: 20px; color: #d98f3f; text-align: center; letter-spacing: 0.08em; margin-bottom: 8px; }
.r10-panel .row { display: flex; justify-content: space-between; align-items: baseline; font-family: 'Silkscreen', monospace; font-size: 22px; margin: 4px 0; color: #e3d9c3; }
.r10-panel .row b { font-size: 40px; font-weight: 400; }
.r10-panel .note { font-family: 'VT323', monospace; font-size: 28px; color: #c9b99a; text-align: center; margin-top: 8px; }
#r10-raid { top: 58%; } #r10-canal { top: 22%; } #r10-toll { top: 21%; }
#r10-big { left: 0; right: 0; top: 30%; text-align: center; font-family: 'Silkscreen', monospace; color: #e3d9c3; text-shadow: 6px 6px 0 #0e0d0c; opacity: 0; }
#r10-big .k { font-size: 30px; letter-spacing: 0.12em; color: #c9b99a; }
#r10-big b { display: block; font-size: 128px; font-weight: 400; color: #d98f3f; line-height: 1; }
#r10-big .s { font-size: 30px; letter-spacing: 0.06em; }
#r10-big .p { font-size: 36px; color: #c9c26a; margin-top: 10px; }
#r10-cta { left: 6%; right: 6%; top: 60%; text-align: center; background: rgba(14,13,12,0.93); border: 4px solid #d98f3f; padding: 14px; opacity: 0; }
#r10-cta .big { font-family: 'Silkscreen', monospace; font-size: 34px; color: #d98f3f; line-height: 1.15; }
#r10-cta .sm { font-family: 'VT323', monospace; font-size: 30px; color: #e3d9c3; margin-top: 6px; }
#r10-night { inset: 0; background: rgba(40, 46, 90, 0.36); mix-blend-mode: multiply; opacity: 0; }
#r10-flare { inset: 0; background: radial-gradient(circle at 60% 8%, rgba(255,246,220,0.6) 0, rgba(255,246,220,0.22) 25%, rgba(0,0,0,0) 60%); mix-blend-mode: screen; opacity: 0; }
#r10-flash { inset: 0; background: #fff6dc; opacity: 0; }
#r10-glory { inset: 0; background: radial-gradient(ellipse at 50% 40%, rgba(217,143,63,0.28), rgba(0,0,0,0) 70%); opacity: 0; }
`;

export async function startDay10Reel({ cam, life, map, soldiers, tex, anims }) {
  let vo = files['../../marketing/reels/front10.vo.json'];
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
  const pbs = F.orderFx?.pillboxes || [];
  const clear = (q) => !pbs.some((p) => Math.abs(p.s.x - q.x) < 90 && Math.abs(p.s.y - q.y) < 60);
  const pickAt = (list, from) => { for (let i = from; i < list.length - 10; i++) if (clear(list[i]) && clear(list[i + 4])) return i; return from; };

  // raid ve hře: 1) raideři Hegemonie v zákopu Concordu (háček), 2) raideři Concordu v zákopu Hegemonie
  const fight = await makeFight({ anims, soldiers, tex });
  const iC = pickAt(fC, Math.floor(fC.length / 2)), iH = pickAt(fH, Math.floor(fH.length / 2) + 8);
  const A1 = fC[iC], A2 = fH[iH];
  const R1 = [fight.scene({ at: 0, defender: fC[iC], side: 0, shooter: fC[iC + 1], end: tt.raid2 }),
    fight.scene({ at: 0, defender: fC[iC + 2], side: 0, win: 'defender', delay: 0.3, end: tt.raid2 }),
    fight.scene({ at: 0, defender: fC[iC + 4], side: 0, delay: 0.6, end: tt.raid2 }),
    fight.scene({ at: 0, defender: fC[iC - 2], side: 0, delay: 1.2, end: tt.raid2 })];
  const R2 = [fight.scene({ at: tt.raid, defender: fH[iH], side: 1, shooter: fH[iH + 1], end: tt.brave }),
    fight.scene({ at: tt.raid, defender: fH[iH + 2], side: 1, delay: 0.4, end: tt.brave }),
    fight.scene({ at: tt.raid, defender: fH[iH + 4], side: 1, win: 'defender', delay: 0.8, end: tt.brave }),
    fight.scene({ at: tt.raid, defender: fH[iH - 2], side: 1, delay: 1.4, end: tt.brave })];
  const flashes = [...R1, ...R2].flatMap((f) => [f?.hit, f?.shot]).filter(Boolean);
  // raideři, kteří se nevrátili: plazí se zpět zemí nikoho a padnou
  const back = fight.puppet({ x: A1.x + 30, y: mid - 10, from: tt.raid2, to: tt.brave, keys: [{ t0: tt.raid2, key: 'hegemony', anim: 'crawl', dir: 'north', fps: 7, loop: true, move: [A1.x + 30, mid - 40, 1.6] }, { t0: tt.raid2 + 1.6, key: 'hegemony', anim: 'die', dir: 'west', fps: 9 }] });

  const ens = by('autism_enjoyer_08') || mH, ale = by('alessiosantori') || mC, cub = by('sugar_cubes745') || mH, star = by('thatdudesicarius') || mH;
  const tBrave2 = (tt.brave + tt.canal) / 2, tArmyC = (tt.army + tt.bonds) / 2;
  const K = [[0, A1.x + 20, A1.y - 22, 6.0], [tt.raid - 0.01, A1.x + 30, A1.y - 22, 6.4]];
  K.push([tt.raid, A2.x - 20, A2.y - 22, 6.0, 'cut'], [tt.raid2 - 0.01, A2.x - 30, A2.y - 22, 6.4]);
  K.push([tt.raid2, A1.x + 30, mid - 30, 4.2, 'cut'], [tt.brave - 0.01, A1.x + 30, mid - 34, 4.6]);
  K.push([tt.brave, ens.x, ens.y - 24, 4.6, 'cut'], [tBrave2 - 0.01, ens.x + 6, ens.y - 24, 5.0], [tBrave2, ale.x, ale.y - 24, 4.6, 'cut'], [tt.canal - 0.01, ale.x - 6, ale.y - 24, 5.0]);
  K.push([tt.canal, mH.x - 260, mid, 1.2, 'cut'], [tt.hero - 0.01, mH.x + 260, mid, 1.3]);
  K.push([tt.hero, cub.x, cub.y - 24, 4.6, 'cut'], [tt.toll - 0.01, cub.x + 6, cub.y - 24, 5.0]);
  K.push([tt.toll, mC.x - 200, mid, 1.4, 'cut'], [tt.big - 0.01, mC.x + 200, mid, 1.5]);
  // hrdinská oslava: z jednoho vojáka se kamera vzdálí na celou frontu
  K.push([tt.big, mH.x, mH.y - 20, 6.5, 'cut'], [tt.army - 0.01, mH.x, mid, 0.42, 'ease']);
  K.push([tt.army, mH.x - 240, mH.y + 10, 2.2, 'cut'], [tArmyC - 0.01, mH.x + 240, mH.y + 10, 2.4], [tArmyC, mC.x + 240, mC.y - 10, 2.2, 'cut'], [tt.bonds - 0.01, mC.x - 240, mC.y - 10, 2.4]);
  K.push([tt.bonds, star.x, star.y - 24, 4.4, 'cut'], [tt.cta - 0.01, star.x + 6, star.y - 24, 4.8]);
  K.push([tt.cta, mC.x, mid, 0.8, 'cut'], [END, mC.x + 200, mid, 0.85]);
  const camAt = camPath(K);
  const sub = subtitles(vo);
  const fx = transitions([[tt.raid, 'whip'], [tt.raid2, 'black', 0.4], [tt.brave, 'flash'], [tBrave2, 'whip'], [tt.canal, 'flash'], [tt.hero, 'whip'], [tt.toll, 'black', 0.4], [tt.big, 'flash'], [tt.army, 'flash'], [tArmyC, 'whip'], [tt.bonds, 'flash'], [tt.cta, 'flash']]);
  const SFX = [];
  for (const f of [...R1, ...R2]) { if (f?.hit) SFX.push([+f.hit.toFixed(2), 'stamp', 0]); if (f?.shot) SFX.push([+f.shot.toFixed(2), 'shoot', 0]); }
  SFX.push([tt.raid2 + 1.5, 'shoot', 0], [tt.canal, 'drum', 0], [tt.big, 'drum', 0], [tt.army, 'drum', 0], [tt.cta, 'drum', 0], [END - 1.3, 'end', 0]);
  // salvy po celé frontě během oslavy (jen skuteční vojáci)
  const line = soldiers.filter((s) => !s.vacant && s.slot?.line === 'front');
  const shots = []; for (let k = 0, t = tt.big + 0.3; t < tt.bonds; t += 0.18, k++) shots.push([t, line[(k * 53) % Math.max(1, line.length)]]);

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  root.innerHTML = `
    <div id="r10-night"></div><div id="r10-flare"></div><div id="r10-glory"></div><div id="r10-flash"></div>
    <div id="r10-hook"><div class="d">DAY 10</div><div class="n">186 WENT</div><div class="s">OVER THE TOP</div></div>
    <div id="r10-raid" class="r10-panel"><div class="t">THE NIGHT RAID</div>
      <div class="row"><span>HEGEMONY RAIDERS ${D.raid[0][0]}</span><b>${D.raid[0][1]}</b></div>
      <div class="row"><span>CONCORD RAIDERS ${D.raid[1][0]}</span><b>${D.raid[1][1]}</b></div>
      <div class="note">enemies killed · ${D.raid[0][2] + D.raid[1][2]} raiders never came home</div></div>
    <div id="r10-ens" class="r10-tag gold">BASTIAN ENJOYER<small>@autism_enjoyer_08 · Hegemony · 2 men</small></div>
    <div id="r10-ale" class="r10-tag gold">ULRICH ALESSIOSANTO<small>@alessiosantori · Concord · 2 men</small></div>
    <div id="r10-canal" class="r10-panel"><div class="t">BLACKWATER CANAL</div><div class="row"><span>HEGEMONY</span><b>${D.canal[0]}</b></div><div class="row"><span>CONCORD</span><b>${D.canal[1]}</b></div><div class="note">kills · the Hegemony takes the canal<br>better supplies for 3 days</div></div>
    <div id="r10-cub" class="r10-tag gold">GIDEON "MUD" CUBES<small>@sugar_cubes745 · deadliest rifle</small></div>
    <div id="r10-toll" class="r10-panel"><div class="t">DAY 10 · THE DEAD</div><div class="row"><span>CONCORD</span><b>${D.fell[1]}</b></div><div class="row"><span>HEGEMONY</span><b>${D.fell[0]}</b></div><div class="note">most of them in the raid<br>a second hospital for each side</div></div>
    <div id="r10-big"><div class="k">THE FRONT IS</div><b>0</b><div class="s">STRONG</div><div class="p">+${D.joined} IN ONE DAY</div></div>
    <div id="r10-tagH" class="r10-tag">HEGEMONY<b>${D.army[0]}</b></div>
    <div id="r10-tagC" class="r10-tag">CONCORD<b>${D.army[1]}</b></div>
    <div id="r10-star" class="r10-tag gold">★ WAR BONDS<small>Florian · Casimir · Quentin · Pavel</small></div>
    <div id="r10-cta"><div class="big">NEXT: GREY MILL</div><div class="sm">first to 300 new soldiers takes it<br>comment HEGEMONY or CONCORD</div></div>
    <div id="rd-big"></div>
    <div id="rd-sub"></div>
  `;
  document.body.appendChild(root);
  const paint = fxLayers(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };
  let si = 0;
  const N = D.army[0] + D.army[1];

  function frame(t) {
    const f = fx(t);
    fight.update(t);
    for (const q of soldiers) if (q.vacant && q.sprite && q.sprite.alpha < 1) { q.sprite.alpha = 1; q.sprite.tint = [0xffffff, 0xf0ece4, 0xe6e2da, 0xfff4e8][q.variant % 4]; } // žádní duchové
    const [x, y, z] = camAt(t);
    cam.set(x, y, z * (1 + 0.03 * f.punch));
    while (si < shots.length && shots[si][0] <= t) { if (shots[si][1]) life.debug.shoot([shots[si][1]]); si++; }
    const night = t < tt.brave;
    show('#r10-night', night ? 1 : 0);
    show('#r10-flare', night ? 0.5 + Math.sin(t * 11) * 0.08 : 0);
    const fh = flashes.find((q) => t >= q && t < q + 0.12);
    show('#r10-flash', fh != null ? 0.5 * (1 - (t - fh) / 0.12) : 0);
    show('#r10-glory', t >= tt.big && t < tt.bonds ? 0.6 + 0.4 * Math.sin(t * 2) : 0);
    paint({ ...f, black: Math.max(f.black, t > END - 0.6 ? clamp01((t - END + 0.6) / 0.5) : 0) });
    const hk = $('#r10-hook');
    hk.style.opacity = t < tt.raid ? 1 : 0;
    hk.style.transform = `scale(${1 + 0.12 * clamp01(1 - t / 0.25)})`;
    show('#r10-raid', win(t, tt.raid2 + 0.2, tt.brave - 0.05, 0.2));
    tagAt($('#r10-ens'), { x: ens.x, y: ens.y + 50 }, cam, win(t, tt.brave + 0.2, tBrave2 - 0.05, 0.15), 0);
    tagAt($('#r10-ale'), { x: ale.x, y: ale.y + 50 }, cam, win(t, tBrave2 + 0.2, tt.canal - 0.05, 0.15), 0);
    show('#r10-canal', win(t, tt.canal + 0.2, tt.hero - 0.05, 0.2));
    tagAt($('#r10-cub'), { x: cub.x, y: cub.y + 50 }, cam, win(t, tt.hero + 0.2, tt.toll - 0.05, 0.15), 0);
    show('#r10-toll', win(t, tt.toll + 0.2, tt.big - 0.05, 0.2));
    // oslava: počítadlo stoupá s odjezdem kamery
    show('#r10-big', win(t, tt.big + 0.2, tt.army - 0.05, 0.25));
    $('#r10-big b').textContent = Math.round(N * easeOut(clamp01((t - tt.big - 0.2) / (tt.army - tt.big - 1.0)))).toLocaleString('en-US');
    $('#r10-big').style.transform = `scale(${1 + 0.06 * Math.sin(clamp01((t - tt.big) / 0.5) * Math.PI)})`;
    tagAt($('#r10-tagH'), { x, y: y - 30 }, cam, win(t, tt.army + 0.2, tArmyC - 0.05, 0.2), 0);
    tagAt($('#r10-tagC'), { x, y: y - 30 }, cam, win(t, tArmyC + 0.1, tt.bonds - 0.05, 0.2), 0);
    tagAt($('#r10-star'), { x: star.x, y: star.y + 52 }, cam, win(t, tt.bonds + 0.2, tt.cta - 0.05, 0.2), 0);
    slam($('#r10-cta'), t, tt.cta + 0.3, END - 1.4, 1.3, -3);
    const logo = t >= END - 1.3;
    const bigEl = $('#rd-big');
    bigEl.style.opacity = logo ? Math.min(1, (t - END + 1.3) / 0.3) : 0;
    if (logo && !bigEl.dataset.on) { bigEl.dataset.on = 1; bigEl.className = 'logo'; bigEl.innerHTML = '<span>MUD <i>&amp;</i> IRON</span><span>@mudandiron · link in bio</span>'; }
    const s = sub(t);
    const subEl = $('#rd-sub');
    if (s && !logo && t >= tt.raid && !(t >= tt.big && t < tt.army)) { subEl.style.opacity = 1; subEl.style.top = '13%'; if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; } } else subEl.style.opacity = 0;
  }

  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
