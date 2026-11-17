// Day reel Day 8 (17. 11. 2026, noviny 17. 11. 13:00 UTC; /?reel=front8&vacant=700, jen vývojový server), do minuty:
//  výbuchy na ruinách bunkrů Concordu + titulek DAY 8 → výsledek souboje komentářů (granáty, 41 % bunkrů Concordu v troskách, nejpilnější obsluha)
//  → zničení dvou bunkrů Concordu ve hře (zásahy, ruina, kouř) → film „rifle“ (Oskar Guyy, student medicíny, puška namířená na střelce) → padlí s příčinami a proč (bez bunkrů, pozorovatelna na Hill 304)
//  → film „tea“ (kaplan Gideon Vylet) → závod o Blackwater Canal → noví patroni Officers' Mess se zlatou hvězdou nad vojákem (ve hře)
//  → přírůstek a počty hráčů s přejezdem po liniích → letadla nad frontou a výzva PILOT (los v novinách 18. 11.; piloti zatím nejsou!).
// Hlas: marketing/reels/front8.script.json. Filmové scény: web/src/cinema-day8.js.
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, slam, clamp01, win, typed, easeOut, tagAt } from './reel-kit.js';
import script from '../../marketing/reels/front8.script.json';
import { makeDay8Scenes } from './cinema-day8.js';
import { loadTexture } from './assets.js';

const files = import.meta.glob('../../marketing/reels/front8.vo.json', { eager: true, import: 'default' });

const D = {
  shells: [383, 301], ruined: 41, crew: ['Otto Tyner', 83], fell: [1, 18], army: [260, 242], joined: [17, 15], race: [32, 29],
  heg: [['Shot', 1]], con: [['Shot', 16], ['Waited for a doctor', 2]],
  roll: [['Ivo Lettersabcd', 'stood up to fix a sandbag'], ['Gideon Vylet', 'chaplain, shot at dawn'], ['Clement Tsanev', 'machine gunner'], ['Oskar Guyy', 'rifle still on the parapet']],
  stars: [['zidane_mcnamara', 'Edmund Mcnamara'], ['flying_wizzerd', 'Walter "Ghost" Wizzerd']],
};

const CSS = `${BASE}${FX_CSS}
#r8-film { inset: 0; width: 100%; height: 100%; image-rendering: pixelated; }
.r8-tag { position: absolute; transform: translate(-50%, -100%); font-family: 'Silkscreen', monospace; font-size: 24px; padding: 6px 12px; background: rgba(14,13,12,0.9); border: 3px solid #524a3f; white-space: nowrap; text-shadow: 2px 2px 0 #0e0d0c; opacity: 0; text-align: center; }
.r8-tag b { font-size: 40px; font-weight: 400; margin-left: 8px; }
.r8-tag.star { border-color: #d98f3f; } .r8-tag.star small { display: block; font-family: 'VT323', monospace; font-size: 26px; color: #d98f3f; }
.r8-panel { left: 7%; right: 7%; background: rgba(14,13,12,0.92); border: 3px solid #524a3f; padding: 14px 16px; opacity: 0; }
.r8-panel .t { font-family: 'Silkscreen', monospace; font-size: 20px; color: #d98f3f; text-align: center; letter-spacing: 0.08em; margin-bottom: 8px; }
.r8-panel .row { display: flex; justify-content: space-between; align-items: baseline; font-family: 'Silkscreen', monospace; font-size: 22px; margin: 4px 0; }
.r8-panel .row b { font-size: 44px; font-weight: 400; }
.r8-panel .c { font-family: 'VT323', monospace; font-size: 27px; color: #c9b99a; display: flex; justify-content: space-between; opacity: 0; }
.r8-panel .c span:last-child { color: #e3d9c3; }
.r8-panel .note { font-family: 'VT323', monospace; font-size: 28px; color: #c9b99a; text-align: center; margin-top: 8px; }
.r8-bar { height: 22px; background: #1c1a17; border: 2px solid #524a3f; position: relative; margin-bottom: 8px; } .r8-bar i { position: absolute; left: 0; top: 0; bottom: 0; width: 0; }
#r8-shells { top: 24%; } #r8-toll { top: 21%; } #r8-race { top: 26%; } #r8-army { top: 24%; }
#r8-roll { left: 8%; right: 8%; top: 58%; background: #c4b8a0; color: #1c1a17; padding: 10px 14px; transform: rotate(1deg); box-shadow: 0 8px 0 rgba(0,0,0,0.5); opacity: 0; }
#r8-roll .t { font-family: 'Silkscreen', monospace; font-size: 15px; color: #7e3b2a; border-bottom: 2px solid #7e3b2a; margin-bottom: 4px; }
#r8-roll div.r { display: flex; justify-content: space-between; font-family: 'VT323', monospace; font-size: 24px; line-height: 1.05; opacity: 0; }
#r8-roll div.r span { color: #5a4a3a; }
#r8-cap { left: 8%; right: 8%; top: 76%; font-family: 'Silkscreen', monospace; font-size: 22px; text-align: center; color: #e3d9c3; text-shadow: 3px 3px 0 #0e0d0c; opacity: 0; }
#r8-cap small { display: block; font-family: 'VT323', monospace; font-size: 28px; color: #c9b99a; }
#r8-pilot { left: 8%; right: 8%; top: 64%; background: rgba(14,13,12,0.93); border: 4px solid #d98f3f; padding: 14px; text-align: center; opacity: 0; }
#r8-pilot .big { font-family: 'Silkscreen', monospace; font-size: 40px; color: #d98f3f; }
#r8-pilot .sm { font-family: 'VT323', monospace; font-size: 30px; color: #e3d9c3; margin-top: 6px; }
#r8-rain { inset: 0; background: rgba(20, 24, 40, 0.26); mix-blend-mode: multiply; }
`;

export async function startDay8Reel({ cam, life, map, theme, soldiers, tex, anims }) {
  let vo = files['../../marketing/reels/front8.vo.json'];
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
  const ruin = nearest(pbs.filter((p) => p.f === 1 && p.ruin), mC)?.s || mC;
  const ruin2 = pbs.filter((p) => p.f === 1 && p.ruin && p.s !== ruin).sort((a, b) => Math.abs(a.s.x - ruin.x - 700) - Math.abs(b.s.x - ruin.x - 700))[0]?.s || ruin;
  const boxH = nearest(pbs.filter((p) => p.f === 0 && !p.ruin), mH)?.s || mH;
  const tree = F.obsFx || { x: mH.x, y: mH.y + 60 };
  const star1 = by(D.stars[0][0]) || mC, star2 = by(D.stars[1][0]) || mC;
  const planes = F.planeFx;
  const mid = ((map.front[0] + map.front[1]) / 2) * T;

  const id = ['open', 'shells', 'destroy', 'rifle', 'rifle2', 'toll', 'tea', 'race', 'stars', 'army', 'pilot'];
  const tt = Object.fromEntries(id.map((k) => [k, at(k)]));
  const half = (a, b) => a + (b - a) / 2;
  const tDes2 = half(tt.destroy, tt.rifle);
  const tStar2 = half(tt.stars, tt.army), tArmyC = half(tt.army, tt.pilot) + 0.6;
  planes?.placeAt?.(0, tt.pilot + 0.6, mC.x - 120); // letadlo Hegemonie přeletí nad frontou Concordu
  const pose = (t) => planes?.poseOf?.(0, t * 1000);
  const K = [[0, ruin.x - 20, ruin.y - 18, 3.4], [tt.shells - 0.01, ruin.x + 10, ruin.y - 18, 3.8]];
  K.push([tt.shells, boxH.x - 20, boxH.y - 16, 3.6, 'cut'], [tt.destroy - 0.01, boxH.x + 10, boxH.y - 16, 3.9]);
  K.push([tt.destroy, ruin.x - 20, ruin.y - 18, 3.6, 'cut'], [tDes2 - 0.01, ruin.x + 6, ruin.y - 18, 4.0]);
  K.push([tDes2, ruin2.x - 20, ruin2.y - 18, 3.6, 'cut'], [tt.rifle - 0.01, ruin2.x + 6, ruin2.y - 18, 4.0]);
  K.push([tt.rifle, ruin2.x, ruin2.y, 3], [tt.toll, tree.x - 40, tree.y - 40, 2.6, 'cut'], [tt.tea - 0.01, tree.x + 30, tree.y - 40, 2.9]);
  K.push([tt.tea, tree.x, tree.y, 2.9], [tt.race, mH.x - 220, mid, 1.2, 'cut'], [tt.stars - 0.01, mH.x + 220, mid, 1.3]);
  K.push([tt.stars, star1.x - 12, star1.y - 24, 4.0, 'cut'], [tStar2 - 0.01, star1.x + 10, star1.y - 24, 4.4]);
  K.push([tStar2, star2.x - 12, star2.y - 24, 4.0, 'cut'], [tt.army - 0.01, star2.x + 10, star2.y - 24, 4.4]);
  K.push([tt.army, mH.x - 240, mH.y + 10, 2.2, 'cut'], [tArmyC - 0.01, mH.x + 240, mH.y + 10, 2.4]);
  K.push([tArmyC, mC.x + 240, mC.y - 10, 2.2, 'cut'], [tt.pilot - 0.01, mC.x - 240, mC.y - 10, 2.4]);
  const camPathAt = camPath(K);
  const camAt = (t) => {
    if (t >= tt.pilot) { const p = pose(t); if (p) return [p.x + p.dir * 30, p.y + 50, 1.9]; }
    return camPathAt(t);
  };
  const sub = subtitles(vo);
  const film = (t) => (t >= tt.rifle && t < tt.toll ? 'rifle' : t >= tt.tea && t < tt.race ? 'tea' : null);
  const filmT = { rifle: tt.rifle, tea: tt.tea };
  const fx = transitions([[tt.shells, 'whip'], [tt.destroy, 'whip'], [tDes2, 'whip'], [tt.rifle, 'black', 0.35], [tt.toll, 'black', 0.35], [tt.tea, 'black', 0.35], [tt.race, 'flash'],
    [tt.stars, 'flash'], [tStar2, 'whip'], [tt.army, 'flash'], [tArmyC, 'whip'], [tt.pilot, 'flash']]);
  // výbuchy granátů na ruinách bunkrů Concordu (úvod)
  const booms = [];
  for (let k = 0, t = 0.3; t < tt.shells - 0.2; t += 0.55, k++) booms.push([t, ruin.x + ((k * 53) % 120) - 60, ruin.y + ((k * 37) % 50) - 25, k % 3 === 0]);
  // zničení: oba bunkry (dnes už ruiny) se na začátku úseku ukážou celé, dostanou zásahy a v okamžiku přímého zásahu se změní v ruinu
  const targets = [[ruin, tt.destroy], [ruin2, tDes2]].map(([sp, t0]) => ({ sp, t0, hit: t0 + 1.6, pb: pbs.find((p) => p.s === sp), done: false }));
  for (const g of targets) for (const [dt, dx, dy, big] of [[0.4, 46, 10, false], [1.0, -42, -6, false], [1.6, 0, 0, true], [1.85, 14, 6, true]]) booms.push([g.t0 + dt, g.sp.x + dx, g.sp.y + dy, big]);
  booms.sort((a, b) => a[0] - b[0]);
  const tex2 = {};
  for (const n of ['pillbox_back', 'pillbox_back_ruin']) loadTexture(`/assets/props/${n}.png`).then((x) => { tex2[n] = x; }).catch(() => {});
  const SFX = booms.map(([t, , , big]) => [+t.toFixed(2), 'shell', big ? 1 : 0]);
  SFX.push([tt.rifle + 0.5, 'shoot', 0], [tt.toll, 'drum', 0], [tt.race, 'drum', 0], [tt.stars, 'stamp', 0], [END - 1.3, 'end', 0]);
  for (let t = tt.toll + 0.6; t < tt.tea - 0.3; t += 0.8) SFX.push([+t.toFixed(2), 'shoot', 0]);

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  const causes = (list) => list.map(([k, n]) => `<div class="c"><span>${k}</span><span>${n}</span></div>`).join('');
  const bars = (a, b) => `<div class="row"><span>HEGEMONY</span><b class="n" data-v="${a}">0</b></div><div class="r8-bar"><i data-w="${(a / Math.max(a, b)) * 100}" style="background:#8f8a82"></i></div>
      <div class="row"><span>CONCORD</span><b class="n" data-v="${b}">0</b></div><div class="r8-bar"><i data-w="${(b / Math.max(a, b)) * 100}" style="background:#8a8a52"></i></div>`;
  root.innerHTML = `
    <div id="r8-rain"></div>
    <div id="rd-day"><div class="big"></div><div class="sub"></div></div>
    <div id="r8-shells" class="r8-panel"><div class="t">THE GUNS ANSWERED · SHELLS FIRED</div>${bars(...D.shells)}
      <div class="note">${D.ruined}% of Concord pillboxes destroyed<br>busiest gun: ${D.crew[0]}, ${D.crew[1]} shells</div></div>
    <div id="r8-ruinTag" class="r8-tag">CONCORD PILLBOX · DESTROYED</div>
    <div id="r8-boxTag" class="r8-tag">HEGEMONY PILLBOX · STANDING</div>
    <div id="r8-cap" >OSKAR "SMOKES" GUYY · CONCORD<small>R-F14 · medical student, soldier and doctor</small></div>
    <div id="r8-toll" class="r8-panel"><div class="t">DAY 8 · THE DEAD</div>
      <div class="row"><span>CONCORD</span><b>${D.fell[1]}</b></div>${causes(D.con)}
      <div class="row" style="margin-top:10px"><span>HEGEMONY</span><b>${D.fell[0]}</b></div>${causes(D.heg)}
      <div class="note">Why: Concord pillboxes in ruins,<br>Hegemony spotters on Hill 304</div></div>
    <div id="r8-roll"><div class="t">ROLL OF HONOUR · DAY 8</div>${D.roll.map(([n, w]) => `<div class="r"><b>† ${n}</b><span>${w}</span></div>`).join('')}</div>
    <div id="r8-capT">GIDEON "WHISTLE" VYLET<small>Concord chaplain · R-F17</small></div>
    <div id="r8-race" class="r8-panel"><div class="t">THE RACE FOR BLACKWATER CANAL</div>${bars(...D.race)}<div class="note">first to 100 enemy dead takes the canal</div></div>
    <div id="r8-s1" class="r8-tag star">★ ${D.stars[0][1].toUpperCase()}<small>@${D.stars[0][0]} · Officers' Mess</small></div>
    <div id="r8-s2" class="r8-tag star">★ ${D.stars[1][1].toUpperCase()}<small>@${D.stars[1][0]} · Officers' Mess</small></div>
    <div id="r8-mk" class="r8-tag" style="border:0;background:none;font-size:40px;color:#d98f3f;padding:0">▼</div>
    <div id="r8-army" class="r8-panel"><div class="t">THE FRONT TODAY</div><div class="row"><span>NEW YESTERDAY</span><b>+${D.joined[0] + D.joined[1]}</b></div>
      <div class="row"><span>ON THE LINE</span><b>${D.army[0] + D.army[1]}</b></div></div>
    <div id="r8-tagH" class="r8-tag">HEGEMONY<b>${D.army[0]}</b></div>
    <div id="r8-tagC" class="r8-tag">CONCORD<b>${D.army[1]}</b></div>
    <div id="r8-pilot"><div class="big">WANTED: PILOTS</div><div class="sm">Comment PILOT under our pilot reel.<br>One pilot per side · lottery in tomorrow's Gazette</div></div>
    <div id="rd-big"></div>
    <div id="rd-sub"></div>
  `;
  document.body.appendChild(root);
  const capT = root.querySelector('#r8-capT');
  capT.style.cssText = 'position:absolute;left:8%;right:8%;top:24%;font-family:Silkscreen,monospace;font-size:22px;text-align:center;color:#e3d9c3;text-shadow:3px 3px 0 #0e0d0c;opacity:0';
  capT.querySelector('small').style.cssText = "display:block;font-family:'VT323',monospace;font-size:28px;color:#c9b99a";
  const d8 = makeDay8Scenes();
  d8.canvas.id = 'r8-film';
  root.prepend(d8.canvas);
  const paint = fxLayers(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };
  const grow = (sel, t0) => {
    const u = easeOut(clamp01((t - t0) / 1.3));
    root.querySelectorAll(`${sel} .n`).forEach((el) => (el.textContent = Math.round(Number(el.dataset.v) * u)));
    root.querySelectorAll(`${sel} i`).forEach((el) => (el.style.width = `${Number(el.dataset.w) * u}%`));
  };
  let t = 0, bi = 0;

  function frame(tNow) {
    t = tNow;
    const f = fx(t);
    for (const q of soldiers) if (q.vacant && q.sprite && q.sprite.alpha < 1) { q.sprite.alpha = 1; q.sprite.tint = [0xffffff, 0xf0ece4, 0xe6e2da, 0xfff4e8][q.variant % 4]; } // žádní duchové
    const [x, y, z] = camAt(t);
    cam.set(x, y, z * (1 + 0.03 * f.punch));
    for (const g of targets) { // celý bunkr před zásahem, ruina po něm (vlajka a doutnání přes orders-fx)
      if (!g.pb || !tex2.pillbox_back || !tex2.pillbox_back_ruin) continue;
      const intact = t >= g.t0 - 0.5 && t < g.hit;
      if (intact && g.pb.ruin) { g.pb.ruin = false; g.sp.texture = tex2.pillbox_back; }
      if (!intact && !g.pb.ruin) { g.pb.ruin = true; g.sp.texture = tex2.pillbox_back_ruin; g.pb.fl.clear(); }
    }
    while (bi < booms.length && booms[bi][0] <= t) { const [, bx, by0, big] = booms[bi]; life.debug.shell?.(bx, by0, big); bi++; }
    const fl = film(t);
    if (fl) d8.draw(fl, t - filmT[fl]);
    show('#r8-film', fl ? 1 : 0);
    show('#r8-rain', fl ? 0 : 1);
    paint({ ...f, black: Math.max(f.black, t < tt.shells ? 0.35 : 0, t < 0.3 ? 1 - t / 0.3 : 0, t > END - 0.6 ? clamp01((t - END + 0.6) / 0.5) : 0) });

    // titulek DAY 8 nad nočními výbuchy
    show('#rd-day', win(t, 0.2, tt.shells - 0.05, 0.3));
    $('#rd-day .big').textContent = typed('DAY 8', t, 0.3, 10);
    $('#rd-day .sub').textContent = t > 1.2 ? typed('YOUR SHELLS FELL ALL NIGHT', t, 1.2, 30) : '';
    // souboj o bunkry
    show('#r8-shells', win(t, tt.shells + 0.1, tt.destroy - 0.05, 0.2));
    grow('#r8-shells', tt.shells + 0.3);
    tagAt($('#r8-boxTag'), { x: boxH.x, y: boxH.y + 40 }, cam, win(t, tt.shells + 0.2, tt.destroy - 0.05, 0.2), 0);
    { const who = t < tDes2 ? ruin : ruin2, hitAt = t < tDes2 ? tt.destroy + 1.6 : tDes2 + 1.6; tagAt($('#r8-ruinTag'), { x: who.x, y: who.y + 44 }, cam, t > hitAt + 0.3 && t < tt.rifle - 0.05 ? 1 : 0, 0); }
    // kbelík
    show('#r8-cap', win(t, tt.rifle + 0.3, tt.toll - 0.1, 0.3));
    // ztráty + proč
    show('#r8-toll', win(t, tt.toll + 0.1, tt.tea - 0.05, 0.2));
    root.querySelectorAll('#r8-toll .c').forEach((el, i) => (el.style.opacity = t > tt.toll + 0.5 + i * 0.3 ? 1 : 0));
    show('#r8-roll', win(t, tt.toll + 1.2, tt.tea - 0.05, 0.2));
    root.querySelectorAll('#r8-roll .r').forEach((el, i) => (el.style.opacity = t > tt.toll + 1.4 + i * 0.3 ? 1 : 0));
    // čaj
    show('#r8-capT', win(t, tt.tea + 0.3, tt.race - 0.1, 0.3));
    // závod
    show('#r8-race', win(t, tt.race + 0.1, tt.stars - 0.05, 0.2));
    grow('#r8-race', tt.race + 0.3);
    // patroni se zlatou hvězdou (ve hře nad vojákem)
    tagAt($('#r8-s1'), { x: star1.x, y: star1.y + 52 }, cam, win(t, tt.stars + 0.2, tStar2 - 0.05, 0.2), 0);
    tagAt($('#r8-s2'), { x: star2.x, y: star2.y + 52 }, cam, win(t, tStar2 + 0.2, tt.army - 0.05, 0.2), 0);
    { const who = t < tStar2 ? star1 : star2, o = win(t, tt.stars + 0.3, tt.army - 0.05, 0.2); tagAt($('#r8-mk'), { x: who.x, y: who.y - 34 - Math.abs(Math.sin(t * 5)) * 4 }, cam, o, 0); } // šipka nad podporovatelem
    // přírůstek a počty
    show('#r8-army', win(t, tt.army + 0.1, tt.army + 2.2, 0.2));
    tagAt($('#r8-tagH'), { x, y: y - 30 }, cam, win(t, tt.army + 2.3, tArmyC - 0.05, 0.2), 0);
    tagAt($('#r8-tagC'), { x, y: y - 30 }, cam, win(t, tArmyC + 0.1, tt.pilot - 0.05, 0.2), 0);
    // piloti: nábor (los zítra)
    slam($('#r8-pilot'), t, tt.pilot + 0.4, END - 1.4, 1.3, -3);
    const logo = t >= END - 1.3;
    const bigEl = $('#rd-big');
    bigEl.style.opacity = logo ? Math.min(1, (t - END + 1.3) / 0.3) : 0;
    if (logo && !bigEl.dataset.on) { bigEl.dataset.on = 1; bigEl.className = 'logo'; bigEl.innerHTML = '<span>MUD <i>&amp;</i> IRON</span><span>@mudandiron · link in bio</span>'; }
    const s = sub(t);
    const subEl = $('#rd-sub');
    if (s && !logo && t > tt.shells - 0.05) {
      subEl.style.opacity = 1;
      subEl.style.top = '13%';
      if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; }
    } else subEl.style.opacity = 0;
  }

  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
