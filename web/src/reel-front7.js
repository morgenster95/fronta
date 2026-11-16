// Day reel Day 7 „příběhy vojáků“ (/?reel=front7&vacant=700, jen vývojový server), 16. 11. 2026 na přání uživatele: nové filmové scény
// a víc příběhů skutečných vojáků (z novin Day 7, state.day 8), k tomu povinné části denního reelu: ztráty s příčinami, závod, shrnutí fronty, počty hráčů.
//  píseň přes drát (Felix Kagr, film „song“) → ráno ho trefí Wendel Freddie (hra) → R-F9: Silas Samhatespeac trefí Leopolda Shadowizarda, Silase pak kulomet Marka Izu (hra)
//  → šachy poštou (Rafael Superfeisty, film „chess“) → padlí s příčinami + Roll of Honour → strom na Hill 304 (hra) → pevnůstky s vlajkami obou stran (hra)
//  → závod o Blackwater Canal → iniciály ve zdi (Severin Samhatespeac, film „initials“) → přírůstek a počty hráčů s přejezdem po liniích → výzva.
// Hlas: marketing/reels/front7.script.json (auto časování podle hlasu).
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, slam, clamp01, win, typed, easeOut, tagAt } from './reel-kit.js';
import script from '../../marketing/reels/front7.script.json';
import { makeStoryScenes } from './cinema-stories.js';

const files = import.meta.glob('../../marketing/reels/front7.vo.json', { eager: true, import: 'default' });

const D = {
  army: [241, 225], joined: [22, 20], fell: [7, 10], race: [14, 28], tree: 32,
  heg: [['Shot', 3], ['Waited for a doctor', 3], ['Died of wounds', 1]],
  con: [['Shot', 9], ['Waited for a doctor', 1]],
  roll: [['Felix Kagr', 'shot by Wendel Freddie'], ['Leopold Shadowizard', 'shot by Silas Samhatespeac'], ['Silas Samhatespeac', 'shot by Marek Izu'],
    ['Rafael Superfeisty', 'shot by Roland Hud'], ['Teodor Zgeorges', 'no bed came free'], ['Jakub Hill', 'died in a hospital bed']],
};

const CSS = `${BASE}${FX_CSS}
#r7-film { inset: 0; width: 100%; height: 100%; image-rendering: pixelated; }
.r7-tag { position: absolute; transform: translate(-50%, -100%); font-family: 'Silkscreen', monospace; font-size: 26px; padding: 6px 12px; background: rgba(14,13,12,0.88); border: 3px solid #524a3f; white-space: nowrap; text-shadow: 2px 2px 0 #0e0d0c; opacity: 0; }
.r7-tag b { font-size: 40px; font-weight: 400; margin-left: 8px; }
.r7-bub { position: absolute; transform: translate(-50%, -100%); max-width: 60%; font-family: 'VT323', monospace; font-size: 34px; line-height: 1.02; color: #1c1a17; background: #e3d9c3;
  padding: 8px 14px 10px; border: 3px solid #0e0d0c; box-shadow: 4px 4px 0 rgba(0,0,0,0.55); opacity: 0; }
.r7-bub::after { content: ''; position: absolute; left: 50%; bottom: -15px; margin-left: -9px; border: 9px solid transparent; border-top: 9px solid #0e0d0c; border-bottom: 0; }
.r7-bub .who { display: block; font-family: 'Silkscreen', monospace; font-size: 15px; color: #7e3b2a; margin-bottom: 2px; }
.r7-bub.song { background: #c9cbbf; font-style: italic; }
.r7-card { left: 9%; right: 9%; top: 24%; background: #c4b8a0; color: #1c1a17; padding: 14px 16px; box-shadow: 0 8px 0 rgba(0,0,0,0.5); transform: rotate(-1.5deg); }
.r7-card .t { font-family: 'Silkscreen', monospace; font-size: 16px; color: #7e3b2a; border-bottom: 2px solid #7e3b2a; padding-bottom: 4px; margin-bottom: 6px; display: flex; justify-content: space-between; }
.r7-card .n { font-family: 'Silkscreen', monospace; font-size: 30px; }
.r7-card .w { font-family: 'VT323', monospace; font-size: 28px; }
.r7-card .st { position: absolute; right: 14px; bottom: 10px; font-family: 'Silkscreen', monospace; font-size: 24px; color: #7e3b2a; border: 4px solid #7e3b2a; padding: 2px 8px; transform: rotate(-12deg); }
.r7-cap { left: 8%; right: 8%; font-family: 'Silkscreen', monospace; font-size: 22px; text-align: center; color: #e3d9c3; text-shadow: 3px 3px 0 #0e0d0c; letter-spacing: 0.06em; }
.r7-cap small { display: block; font-family: 'VT323', monospace; font-size: 28px; color: #c9b99a; letter-spacing: 0; }
.r7-panel { left: 7%; right: 7%; background: rgba(14,13,12,0.92); border: 3px solid #524a3f; padding: 14px 16px; }
.r7-panel .t { font-family: 'Silkscreen', monospace; font-size: 20px; color: #d98f3f; text-align: center; letter-spacing: 0.08em; margin-bottom: 8px; }
.r7-panel .row { display: flex; justify-content: space-between; align-items: baseline; font-family: 'Silkscreen', monospace; font-size: 22px; margin: 4px 0; }
.r7-panel .row b { font-size: 44px; font-weight: 400; }
.r7-panel .c { font-family: 'VT323', monospace; font-size: 27px; color: #c9b99a; display: flex; justify-content: space-between; opacity: 0; }
.r7-panel .c span:last-child { color: #e3d9c3; }
.r7-bar { height: 22px; background: #1c1a17; border: 2px solid #524a3f; position: relative; margin-bottom: 8px; } .r7-bar i { position: absolute; left: 0; top: 0; bottom: 0; width: 0; }
#r7-toll { top: 20%; } #r7-race { top: 26%; } #r7-army { top: 24%; }
#r7-roll { left: 8%; right: 8%; top: 55%; background: #c4b8a0; color: #1c1a17; padding: 10px 14px; transform: rotate(1deg); box-shadow: 0 8px 0 rgba(0,0,0,0.5); }
#r7-roll .t { font-family: 'Silkscreen', monospace; font-size: 15px; color: #7e3b2a; border-bottom: 2px solid #7e3b2a; margin-bottom: 4px; }
#r7-roll div.r { display: flex; justify-content: space-between; font-family: 'VT323', monospace; font-size: 23px; line-height: 1.05; opacity: 0; }
#r7-roll div.r span { color: #5a4a3a; }
#r7-rain { inset: 0; background: rgba(20, 24, 40, 0.24); mix-blend-mode: multiply; }
`;

export async function startStoriesReel({ cam, life, map, theme, soldiers, tex, anims }) {
  let vo = files['../../marketing/reels/front7.vo.json'];
  if (!vo) {
    let c = 0;
    vo = { lines: script.lines.map(([at, text, id]) => { const s = Math.max(at, c), d = text.length / 15 + 0.2; c = s + d + 0.25; return [s, d, text, id]; }) };
    vo.seconds = c + 3.2;
  }
  const C = cues(vo);
  const at = C.at, END = vo.seconds;
  const T = map.tile;
  const by = (h) => soldiers.find((s) => s.handle === h);
  const lineMid = (f) => { const l = soldiers.filter((s) => s.faction === f && s.slot?.line === 'front' && !s.vacant).sort((a, b) => a.x - b.x); return l[Math.floor(l.length / 2)]; };
  const mH = lineMid(0), mC = lineMid(1);
  const kagr = by('k4a.gr') || mC, freddie = by('0__freddie__0') || mH;
  const silas = by('samhatespeace') || mC, leo = by('shadowizard__') || mH, izu = by('arch_izu') || mH;
  const F = window.__front || {};
  const tree = F.obsFx || { x: mH.x, y: mH.y + 60 };
  const boxes = (F.orderFx?.shelters || []).filter((c) => c.texture?.width === 48 && c.texture?.height === 32);
  const near = (f) => { const ref = f ? mC : mH; const own = boxes.filter((c) => Math.abs(c.y - ref.y) < 120).sort((a, b) => Math.abs(a.x - ref.x) - Math.abs(b.x - ref.x)); return own[0] || ref; };
  const boxH = near(0), boxC = near(1);
  const mid = ((map.front[0] + map.front[1]) / 2) * T;

  const id = ['open', 'song', 'song2', 'morning', 'duel', 'duel2', 'chess', 'chess2', 'toll', 'tree', 'pill', 'pill2', 'race', 'init', 'init2', 'joined', 'army', 'armyH', 'armyC', 'cta', 'cta2'];
  const tt = Object.fromEntries(id.map((k) => [k, at(k)]));
  // kamera (ve filmových scénách stojí; jen ve hře): Kagr → Freddie → Shadowizard → Silas → Izu → (šachy) → linie Concordu → strom → bunkr H → bunkr C → (iniciály) → přehled → linie H → linie C
  const K = [[0, kagr.x, kagr.y - 20, 3.6]];
  K.push([tt.morning, kagr.x - 10, kagr.y - 18, 3.4, 'cut'], [tt.morning + 1.5, kagr.x + 10, kagr.y - 18, 3.7]);
  K.push([tt.morning + 1.5, freddie.x - 10, freddie.y - 16, 3.6, 'cut'], [tt.duel - 0.01, freddie.x + 14, freddie.y - 16, 3.9]);
  K.push([tt.duel, leo.x - 10, leo.y - 18, 3.6, 'cut'], [tt.duel + 1.7, leo.x + 10, leo.y - 18, 3.9]);
  K.push([tt.duel + 1.7, silas.x - 10, silas.y - 18, 3.6, 'cut'], [tt.duel2 - 0.01, silas.x + 10, silas.y - 18, 3.9]);
  K.push([tt.duel2, izu.x - 14, izu.y - 16, 3.5, 'cut'], [tt.chess - 0.01, izu.x + 10, izu.y - 16, 3.8]);
  K.push([tt.chess, mC.x, mC.y, 2.0], [tt.toll, mC.x - 160, mC.y - 30, 1.7, 'cut'], [tt.tree - 0.01, mC.x + 160, mC.y - 30, 1.9]);
  K.push([tt.tree, tree.x - 40, tree.y - 30, 3.0, 'cut'], [tt.tree + 2.6, tree.x + 10, tree.y - 30, 3.3], [tt.tree + 2.6, mC.x - 80, mC.y - 10, 2.6, 'cut'], [tt.pill - 0.01, mC.x + 80, mC.y - 10, 2.8]);
  K.push([tt.pill, boxH.x - 26, boxH.y - 14, 4.0, 'cut'], [tt.pill2 - 0.01, boxH.x + 6, boxH.y - 14, 4.3]);
  K.push([tt.pill2, boxC.x - 20, boxC.y - 18, 4.0, 'cut'], [tt.race - 0.01, boxC.x + 10, boxC.y - 18, 4.3]);
  K.push([tt.race, mC.x - 200, mC.y + 40, 1.4, 'cut'], [tt.init - 0.01, mC.x + 200, mC.y + 40, 1.5]);
  K.push([tt.joined, mH.x - 300, mH.y + 40, 1.5, 'cut'], [tt.armyH - 0.01, mH.x + 300, mH.y + 40, 1.6]);
  K.push([tt.armyH, mH.x - 260, mH.y + 10, 2.3, 'cut'], [tt.armyC - 0.01, mH.x + 260, mH.y + 10, 2.5]);
  K.push([tt.armyC, mC.x + 260, mC.y - 10, 2.3, 'cut'], [tt.cta - 0.01, mC.x - 260, mC.y - 10, 2.5]);
  K.push([tt.cta, mH.x, mH.y + 40, 1.4, 'cut'], [END, mH.x + 200, mH.y + 40, 1.5]);
  const camAt = camPath(K);
  const sub = subtitles(vo);
  const film = (t) => (t < tt.morning ? 'song' : t >= tt.chess && t < tt.toll ? 'chess' : t >= tt.init && t < tt.joined ? 'initials' : null);
  const filmT = { song: 0, chess: tt.chess, initials: tt.init };
  const fx = transitions([[tt.morning, 'flash'], [tt.duel, 'whip'], [tt.duel2, 'whip'], [tt.chess, 'black', 0.4], [tt.toll, 'black', 0.4], [tt.tree, 'flash'], [tt.pill, 'whip'], [tt.pill2, 'whip'],
    [tt.race, 'flash'], [tt.init, 'black', 0.5], [tt.joined, 'black', 0.4], [tt.armyH, 'whip'], [tt.armyC, 'whip'], [tt.cta, 'flash']]);

  // výstřely: Freddie na Kagra, Silas na Shadowizarda, Izu na Silase; na stromě a u bunkrů občasné výstřely
  const shots = [[tt.morning + 2.0, freddie], [tt.duel + 2.1, silas], [tt.duel2 + 1.0, izu], [tt.duel2 + 1.3, izu], [tt.duel2 + 1.6, izu]];
  const SFX = [[tt.morning + 2.0, 'shoot', 0], [tt.morning + 2.6, 'stamp', 0], [tt.duel + 2.1, 'shoot', 0], [tt.duel + 2.7, 'stamp', 0], [tt.duel2 + 1.0, 'shoot', 0], [tt.duel2 + 1.3, 'shoot', 0], [tt.duel2 + 1.6, 'shoot', 0],
    [tt.duel2 + 2.2, 'stamp', 0], [tt.toll, 'drum', 0], [tt.race, 'drum', 0], [END - 1.6, 'end', 0]];
  for (let t = tt.tree + 2.8; t < tt.pill - 0.3; t += 0.9) SFX.push([+t.toFixed(2), 'shoot', 0]);

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  const causes = (list) => list.map(([k, n]) => `<div class="c"><span>${k}</span><span>${n}</span></div>`).join('');
  const card = (idn, name, w) => `<div id="${idn}" class="r7-card"><div class="t"><span>FIELD TELEGRAPH</span><span>DAY 7</span></div><div class="n">${name}</div><div class="w">${w}</div><div class="st">FALLEN</div></div>`;
  root.innerHTML = `
    <div id="r7-rain"></div>
    <div id="rd-day"><div class="big"></div><div class="sub"></div></div>
    <div id="r7-b1" class="r7-bub song"><span class="who">Felix Kagr · Concord</span>♪ Keep the home fires burning... ♪</div>
    <div id="r7-b2" class="r7-bub song"><span class="who">Across the wire · Hegemony</span>♪ ...while your hearts are yearning ♪</div>
    <div id="r7-b3" class="r7-bub"><span class="who">Wendel Freddie · Hegemony</span>The singer. Left of the post.</div>
    <div id="r7-b4" class="r7-bub"><span class="who">Leopold Shadowizard · Hegemony</span>Just one more look...</div>
    <div id="r7-b5" class="r7-bub"><span class="who">Silas Samhatespeac · Concord</span>Got him!</div>
    <div id="r7-b6" class="r7-bub"><span class="who">Rafael Superfeisty · Concord</span>Your move, old friend.</div>
    <div id="r7-b7" class="r7-bub"><span class="who">Spotter · Hill 304</span>Helmet up, sector twelve. Fire!</div>
    <div id="r7-b8" class="r7-bub"><span class="who">Hegemony · machine gunner</span>Concrete. Finally.</div>
    <div id="r7-b9" class="r7-bub"><span class="who">Concord · machine gunner</span>Let them come.</div>
    ${card('r7-c1', 'FELIX KAGR', 'Concord rifleman, sector R-F12.<br>He sang on night watch.<br>Shot by Wendel "Mole" Freddie.')}
    ${card('r7-c2', 'LEOPOLD SHADOWIZARD', 'Hegemony sniper, sector R-F8.<br>Shot by Silas "Mud" Samhatespeac.')}
    ${card('r7-c3', 'SILAS SAMHATESPEAC', 'Concord rifleman, sector R-F9.<br>Shot by Marek Izu, a few hours later.')}
    <div id="r7-capc" class="r7-cap" style="top:27%">CHESS BY POST<small>Rafael "Button" Superfeisty · Concord</small></div>
    <div id="r7-capi" class="r7-cap" style="top:76%">R-F9 · THE SAME POST<small>Silas Samhatespeac → his nephew Severin</small></div>
    <div id="r7-toll" class="r7-panel"><div class="t">DAY 7 · THE DEAD</div>
      <div class="row"><span>CONCORD</span><b>${D.fell[1]}</b></div>${causes(D.con)}
      <div class="row" style="margin-top:12px"><span>HEGEMONY</span><b>${D.fell[0]}</b></div>${causes(D.heg)}</div>
    <div id="r7-roll"><div class="t">ROLL OF HONOUR · DAY 7</div>${D.roll.map(([n, w]) => `<div class="r"><b>† ${n}</b><span>${w}</span></div>`).join('')}</div>
    <div id="r7-treeTag" class="r7-tag">EYES ON HILL 304<b>${D.tree} HIT</b></div>
    <div id="r7-pbH" class="r7-tag">HEGEMONY PILLBOX</div>
    <div id="r7-pbC" class="r7-tag">CONCORD PILLBOX</div>
    <div id="r7-race" class="r7-panel"><div class="t">THE RACE FOR BLACKWATER CANAL</div>
      <div class="row"><span>CONCORD</span><b class="n" data-v="${D.race[1]}">0</b></div><div class="r7-bar"><i data-w="${D.race[1]}" style="background:#8a8a52"></i></div>
      <div class="row"><span>HEGEMONY</span><b class="n" data-v="${D.race[0]}">0</b></div><div class="r7-bar"><i data-w="${D.race[0]}" style="background:#8f8a82"></i></div>
      <div class="c" style="opacity:1;justify-content:center"><span>first to 100 enemy dead takes the canal</span></div></div>
    <div id="r7-army" class="r7-panel"><div class="t">THE FRONT TODAY</div><div class="row"><span>NEW YESTERDAY</span><b>+${D.joined[0] + D.joined[1]}</b></div>
      <div class="row"><span>ON THE LINE</span><b>${D.army[0] + D.army[1]}</b></div></div>
    <div id="r7-tagH" class="r7-tag">HEGEMONY<b>${D.army[0]}</b></div>
    <div id="r7-tagC" class="r7-tag">CONCORD<b>${D.army[1]}</b></div>
    <div id="rd-big"></div>
    <div id="rd-sub"></div>
  `;
  document.body.appendChild(root);
  const st = makeStoryScenes(tex, anims);
  st.canvas.id = 'r7-film';
  root.prepend(st.canvas);
  const paint = fxLayers(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };
  let t = 0;
  // bublina nad vojákem ve hře (posunutá ke středu obrazu), nebo na místě ve filmové scéně (procenta)
  const bubAt = (sel, who, t0, t1, lift = 40) => {
    const el = $(sel); if (!el) return;
    const o = t >= t0 && t < t1 ? Math.min(1, (t - t0) / 0.15, (t1 - t) / 0.15) : 0;
    if (!o) { el.style.opacity = 0; return; }
    tagAt(el, who, cam, o, lift);
    el.style.left = `${Math.min(cam.w * 0.68, Math.max(cam.w * 0.32, parseFloat(el.style.left)))}px`;
  };
  const bubPct = (sel, x, y, t0, t1) => { const el = $(sel); const o = t >= t0 && t < t1 ? Math.min(1, (t - t0) / 0.15, (t1 - t) / 0.15) : 0; el.style.opacity = o; el.style.left = `${x}%`; el.style.top = `${y}%`; };
  let si = 0;

  function frame(tNow) {
    t = tNow;
    const f = fx(t);
    for (const q of soldiers) if (q.vacant && q.sprite && q.sprite.alpha < 1) { q.sprite.alpha = 1; q.sprite.tint = [0xffffff, 0xf0ece4, 0xe6e2da, 0xfff4e8][q.variant % 4]; } // žádní duchové
    const [x, y, z] = camAt(t);
    cam.set(x, y, z * (1 + 0.03 * f.punch));
    while (si < shots.length && shots[si][0] <= t) { life.debug.shoot([shots[si][1]]); si++; }
    const fl = film(t);
    if (fl) st.draw(fl, t - filmT[fl]);
    show('#r7-film', fl ? 1 : 0);
    show('#r7-rain', fl ? 0 : 1);
    paint({ ...f, black: Math.max(f.black, t < 0.3 ? 1 - t / 0.3 : 0, t > END - 0.6 ? clamp01((t - END + 0.6) / 0.5) : 0) });

    // titulek DAY 7 v noci nad písní
    show('#rd-day', win(t, 0.3, tt.song + 0.2, 0.3));
    $('#rd-day .big').textContent = typed('DAY 7', t, 0.4, 10);
    $('#rd-day .sub').textContent = t > 1.4 ? typed('A SONG ACROSS THE WIRE', t, 1.4, 30) : '';
    // píseň a odpověď
    bubPct('#r7-b1', 40, 52, tt.song + 0.3, tt.song2 + 0.6);
    bubPct('#r7-b2', 60, 45, tt.song2 + 1.2, tt.morning - 0.05);
    // ráno: Freddie zamíří a vystřelí, karta Kagra
    bubAt('#r7-b3', freddie, tt.morning + 1.55, tt.morning + 2.0);
    slam($('#r7-c1'), t, tt.morning + 2.6, tt.duel - 0.05, 1.4, -4);
    // R-F9: Shadowizard vykoukne, Silas vystřelí, karta; pak kulomet Marka Izu, karta Silase
    bubAt('#r7-b4', leo, tt.duel + 0.2, tt.duel + 1.6);
    bubAt('#r7-b5', silas, tt.duel + 2.2, tt.duel + 2.7);
    slam($('#r7-c2'), t, tt.duel + 2.75, tt.duel2 - 0.05, 1.3, 4);
    slam($('#r7-c3'), t, tt.duel2 + 2.2, tt.chess - 0.05, 1.3, -4);
    // šachy
    show('#r7-capc', win(t, tt.chess + 0.3, tt.chess2 - 0.1, 0.3));
    bubPct('#r7-b6', 34, 58, tt.chess + 2.8, tt.chess2 - 0.1);
    // ztráty
    show('#r7-toll', win(t, tt.toll + 0.1, tt.tree - 0.05, 0.2));
    root.querySelectorAll('#r7-toll .c').forEach((el, i) => (el.style.opacity = t > tt.toll + 0.6 + i * 0.35 ? 1 : 0));
    show('#r7-roll', win(t, tt.toll + 0.8, tt.tree - 0.05, 0.2));
    root.querySelectorAll('#r7-roll .r').forEach((el, i) => (el.style.opacity = t > tt.toll + 1.0 + i * 0.3 ? 1 : 0));
    // strom na Hill 304
    tagAt($('#r7-treeTag'), { x: tree.x, y: tree.y - 120 }, cam, win(t, tt.tree + 0.2, tt.tree + 2.5, 0.2), 0);
    bubPct('#r7-b7', 50, 44, tt.tree + 2.8, tt.pill - 0.05);
    // pevnůstky obou stran (vlajky)
    tagAt($('#r7-pbH'), { x: boxH.x, y: boxH.y - 34 }, cam, win(t, tt.pill + 0.3, tt.pill2 - 0.05, 0.2), 0);
    bubPct('#r7-b8', 50, 80, tt.pill + 1.6, tt.pill2 - 0.05);
    tagAt($('#r7-pbC'), { x: boxC.x, y: boxC.y - 34 }, cam, win(t, tt.pill2 + 0.3, tt.race - 0.05, 0.2), 0);
    bubPct('#r7-b9', 50, 80, tt.pill2 + 2.0, tt.race - 0.05);
    // závod
    show('#r7-race', win(t, tt.race + 0.1, tt.init - 0.05, 0.2));
    const ru = easeOut(clamp01((t - tt.race - 0.4) / 1.4));
    root.querySelectorAll('#r7-race .n').forEach((el) => (el.textContent = Math.round(Number(el.dataset.v) * ru)));
    root.querySelectorAll('#r7-race i').forEach((el) => (el.style.width = `${Number(el.dataset.w) * ru}%`));
    // iniciály
    show('#r7-capi', win(t, tt.init + 0.4, tt.init2 + 1.5, 0.3));
    // přehled a počty po stranách
    show('#r7-army', win(t, tt.joined + 0.1, tt.armyH - 0.05, 0.2));
    tagAt($('#r7-tagH'), { x, y: y - 30 }, cam, win(t, tt.armyH + 0.1, tt.armyC - 0.05, 0.2), 0);
    tagAt($('#r7-tagC'), { x, y: y - 30 }, cam, win(t, tt.armyC + 0.1, tt.cta - 0.05, 0.2), 0);
    const logo = t >= tt.cta2;
    const bigEl = $('#rd-big');
    bigEl.style.opacity = logo ? Math.min(1, (t - tt.cta2) / 0.3) : 0;
    if (logo && !bigEl.dataset.on) { bigEl.dataset.on = 1; bigEl.className = 'logo'; bigEl.innerHTML = '<span>MUD <i>&amp;</i> IRON</span><span>@mudandiron · link in bio</span>'; }
    const s = sub(t);
    const subEl = $('#rd-sub');
    if (s && !logo && t > tt.song - 0.05) {
      subEl.style.opacity = 1;
      subEl.style.top = '13%';
      if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; }
    } else subEl.style.opacity = 0;
  }

  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
