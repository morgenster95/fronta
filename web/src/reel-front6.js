// Day reel Day 6 „příběhy fronty“ (/?reel=front6&vacant=700, jen vývojový server), 15. 11. 2026 na přání uživatele místo šablonového denního reelu:
// jiný začátek (titulní strana Trench Gazette), představení fronty ve hře (počty stran), příběhy dne s bublinami rozhovorů uprostřed scény
// (pozorovatel na Hill 304, odstřelovač Concordu, kaplan, přeplněná nemocnice Hegemonie), ztráty s příčinami, kanál Blackwater,
// příběhový přechod k hlasování HOSPITAL / PILLBOXES / AMMO, přírůstek a výzva. Bez dopisů a bez podporovatelů.
// Čísla a jména: Gazette Day 6 (state.day 7 v datech), marketing/reels/day7.data.json. Hlas: marketing/reels/front6.script.json.
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, slam, clamp01, win, typed, easeOut, tagAt } from './reel-kit.js';
import { paperTexture } from './paper.js';
import script from '../../marketing/reels/front6.script.json';
import voteImg from '../../marketing/promo/vote_build_1.jpg';
import { makeScenes } from './cinema.js';
import { makeWireScenes } from './cinema-wire.js';

const files = import.meta.glob('../../marketing/reels/front6.vo.json', { eager: true, import: 'default' });

const D = {
  army: [227, 206], joined: [29, 24], fell: [21, 4], hit: [40, 27], race: [4, 21],
  heg: [['Waited for a doctor', 19], ['Died in a hospital bed', 1], ['Shot', 1]],
  con: [['Shot', 4]],
  roll: [['Anselm Rock', 'Concord sniper', 'shot by Karel Check'], ['Bram Hop', 'Concord chaplain', 'shot by Dietrich Slade'], ['Felix Menezes', 'Hegemony medic', 'no doctor came'],
    ['Jakub Ebrrrvole', 'Hegemony medic', 'no doctor came'], ['Isidor Lowelleast', 'Hegemony officer', 'no doctor came'], ['Rafael Donaldgregor', 'Hegemony officer', 'shot by Leopold Moovin']],
};

const CSS = `${BASE}${FX_CSS}
#rf-cine, #rf-wire { inset: 0; width: 100%; height: 100%; image-rendering: pixelated; }
#rf-paper { left: 6%; right: 6%; top: 17%; padding: 18px 20px 22px; color: #2a2118; background-size: 288px 288px; image-rendering: pixelated; box-shadow: 0 10px 0 rgba(0,0,0,0.5), 0 18px 40px rgba(0,0,0,0.6); }
#rf-paper .m { display: flex; justify-content: space-between; font-family: 'Silkscreen', monospace; font-size: 16px; border-bottom: 3px solid #2a2118; padding-bottom: 6px; }
#rf-paper .n { font-family: 'Silkscreen', monospace; font-size: 42px; text-align: center; letter-spacing: 0.06em; margin: 10px 0 4px; }
#rf-paper .d { font-family: 'Silkscreen', monospace; font-size: 30px; text-align: center; color: #7a2a1c; border-top: 2px solid #2a2118; border-bottom: 2px solid #2a2118; padding: 4px 0; margin-bottom: 10px; }
#rf-paper .h { font-family: 'Silkscreen', monospace; font-size: 34px; line-height: 1.08; text-align: center; min-height: 80px; }
#rf-paper .s { font-family: 'VT323', monospace; font-size: 28px; text-align: center; margin-top: 8px; color: #4a3a2a; }
.rf-tag { position: absolute; transform: translate(-50%, -100%); font-family: 'Silkscreen', monospace; font-size: 26px; padding: 6px 12px; background: rgba(14,13,12,0.88); border: 3px solid #524a3f; white-space: nowrap; text-shadow: 2px 2px 0 #0e0d0c; }
.rf-tag b { font-size: 40px; font-weight: 400; margin-left: 8px; }
.rf-bub { position: absolute; transform: translate(-50%, -100%); max-width: 58%; font-family: 'VT323', monospace; font-size: 34px; line-height: 1.02; color: #1c1a17; background: #e3d9c3;
  padding: 8px 14px 10px; border: 3px solid #0e0d0c; box-shadow: 4px 4px 0 rgba(0,0,0,0.55); opacity: 0; }
.rf-bub::after { content: ''; position: absolute; left: 50%; bottom: -15px; margin-left: -9px; border: 9px solid transparent; border-top: 9px solid #0e0d0c; border-bottom: 0; }
.rf-bub .who { display: block; font-family: 'Silkscreen', monospace; font-size: 15px; color: #7e3b2a; margin-bottom: 2px; }
.rf-card { left: 9%; right: 9%; top: 18%; background: #c4b8a0; color: #1c1a17; padding: 14px 16px; box-shadow: 0 8px 0 rgba(0,0,0,0.5); transform: rotate(-1.5deg); }
.rf-card .t { font-family: 'Silkscreen', monospace; font-size: 16px; color: #7e3b2a; border-bottom: 2px solid #7e3b2a; padding-bottom: 4px; margin-bottom: 6px; display: flex; justify-content: space-between; }
.rf-card .n { font-family: 'Silkscreen', monospace; font-size: 32px; }
.rf-card .w { font-family: 'VT323', monospace; font-size: 28px; }
.rf-card .st { position: absolute; right: 14px; bottom: 10px; font-family: 'Silkscreen', monospace; font-size: 24px; color: #7e3b2a; border: 4px solid #7e3b2a; padding: 2px 8px; transform: rotate(-12deg); }
.rf-panel { left: 7%; right: 7%; background: rgba(14,13,12,0.92); border: 3px solid #524a3f; padding: 14px 16px; }
.rf-panel .t { font-family: 'Silkscreen', monospace; font-size: 20px; color: #d98f3f; text-align: center; letter-spacing: 0.08em; margin-bottom: 8px; }
.rf-panel .row { display: flex; justify-content: space-between; align-items: baseline; font-family: 'Silkscreen', monospace; font-size: 22px; margin: 4px 0; }
.rf-panel .row b { font-size: 44px; font-weight: 400; }
.rf-panel .c { font-family: 'VT323', monospace; font-size: 27px; color: #c9b99a; display: flex; justify-content: space-between; opacity: 0; }
.rf-panel .c span:last-child { color: #e3d9c3; }
.rf-bar { height: 22px; background: #1c1a17; border: 2px solid #524a3f; position: relative; margin-bottom: 8px; } .rf-bar i { position: absolute; left: 0; top: 0; bottom: 0; width: 0; }
#rf-toll { top: 20%; } #rf-race { top: 12%; } #rf-army { top: 30%; }
#rf-roll { left: 8%; right: 8%; top: 56%; background: #c4b8a0; color: #1c1a17; padding: 10px 14px; transform: rotate(1deg); box-shadow: 0 8px 0 rgba(0,0,0,0.5); }
#rf-roll .t { font-family: 'Silkscreen', monospace; font-size: 15px; color: #7e3b2a; border-bottom: 2px solid #7e3b2a; margin-bottom: 4px; }
#rf-roll div.r { display: flex; justify-content: space-between; font-family: 'VT323', monospace; font-size: 23px; line-height: 1.05; opacity: 0; }
#rf-roll div.r span { color: #5a4a3a; }
#rf-vote { left: 15%; right: 15%; top: 20%; }
#rf-vote img { width: 100%; display: block; image-rendering: pixelated; box-shadow: 0 8px 0 rgba(0,0,0,0.5), 0 16px 28px rgba(0,0,0,0.6); }
#rf-vote .hl { position: absolute; left: 2.5%; right: 2.5%; border: 4px solid #d98f3f; box-shadow: 0 0 0 3px #0e0d0c, 0 0 22px rgba(217,143,63,0.7); opacity: 0; }
#rf-rain { inset: 0; background: rgba(20, 24, 40, 0.28); mix-blend-mode: multiply; }
`;

export async function startFrontReel({ cam, life, map, theme, soldiers, tex, anims }) {
  let vo = files['../../marketing/reels/front6.vo.json'];
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
  const check = by('no_one_here_to_check') || mH, rock = by('rotrek_rock') || mC, hop = by('its.hop_') || mC, slade = by('slade_2233') || mH;
  const site = window.__front?.hospitals?.sites.find((x) => x.faction === 0) || { x: mH.x, y: mH.y - 200, beds: [] };
  const conMG = soldiers.find((s) => s.faction === 1 && s.archetype === 'machinegunner' && s.slot?.line === 'front' && !s.vacant) || mC;
  const hegMedic = soldiers.find((s) => s.faction === 0 && s.archetype === 'medic' && !s.vacant && Math.hypot(s.x - site.x, s.y - site.y) < 400) || soldiers.find((s) => s.faction === 0 && s.archetype === 'medic' && !s.vacant) || mH;
  const mid = ((map.front[0] + map.front[1]) / 2) * T;

  const id = ['open', 'front', 'sides', 'tree', 'shot1', 'rock', 'chaplain', 'concord', 'hosp', 'hosp2', 'wait', 'toll', 'canal', 'canal2', 'vote', 'vote2', 'joined', 'cta', 'cta2'];
  const tt = Object.fromEntries(id.map((k) => [k, at(k)]));
  // kamera: noviny (bez hry) → široký záběr fronty → strom (film) → Check střílí → Rock → kaplan → nemocnice Hegemonie → ztráty → kanál (film) → hlasování → přehled
  const K = [[0, mH.x - 200, mid, 0.9]];
  // fronta: nejdřív linie Hegemonie, pak linie Concordu (obě najednou se do záběru nevejdou)
  K.push([tt.front, mH.x - 200, mH.y + 10, 2.4, 'cut'], [tt.sides + 1.6, mH.x + 160, mH.y + 10, 2.6]);
  K.push([tt.sides + 1.6, mC.x + 200, mC.y - 10, 2.4, 'cut'], [tt.tree - 0.01, mC.x - 160, mC.y - 10, 2.6]);
  // odstřelovač Concordu vykoukne, pak střih na Checka, který vystřelí
  K.push([tt.shot1, rock.x - 10, rock.y - 16, 3.6, 'cut'], [tt.shot1 + 1.6, rock.x + 10, rock.y - 16, 3.9]);
  K.push([tt.shot1 + 1.6, check.x - 10, check.y - 16, 3.4, 'cut'], [tt.rock - 0.01, check.x + 10, check.y - 16, 3.7]);
  K.push([tt.rock, rock.x, rock.y - 20, 4.2, 'cut'], [tt.chaplain - 0.01, rock.x + 20, rock.y - 20, 4.6]);
  K.push([tt.chaplain, hop.x - 30, hop.y - 30, 3.6, 'cut'], [tt.hosp - 0.01, hop.x + 30, hop.y - 30, 4.0]);
  K.push([tt.hosp, site.x - 60, site.y + 10, 3.0, 'cut'], [tt.toll - 0.01, site.x + 60, site.y + 10, 3.6]);
  K.push([tt.toll, mH.x - 160, (map.front[0] * T) - 40, 1.6, 'cut'], [tt.canal - 0.01, mH.x + 160, (map.front[0] * T) - 40, 1.8]);
  K.push([tt.vote, hegMedic.x, hegMedic.y - 16, 3.4, 'cut'], [tt.vote2 - 0.01, hegMedic.x + 20, hegMedic.y - 16, 3.6]);
  K.push([tt.vote2, mid, mid, 1.2, 'cut'], [tt.joined - 0.01, mH.x + 100, mid, 1.25]);
  K.push([tt.joined, mH.x - 300, mid, 1.1, 'cut'], [END, mH.x + 300, mid, 1.2]);
  const camAt = camPath(K);
  const sub = subtitles(vo);
  const film = (t) => (t >= tt.tree && t < tt.shot1 ? 'tree' : t >= tt.canal && t < tt.vote ? 'canal' : null);
  const fx = transitions([[tt.front, 'black', 0.4], [tt.tree, 'flash'], [tt.shot1, 'whip'], [tt.rock, 'flash'], [tt.chaplain, 'black', 0.3], [tt.hosp, 'black', 0.4], [tt.toll, 'flash'], [tt.canal, 'black', 0.4], [tt.vote, 'whip'], [tt.vote2, 'flash'], [tt.joined, 'black', 0.35], [tt.cta, 'whip']]);

  // výstřely: Check na Rocka, Slade na kaplana; v záběru na ztráty a na frontu občasné výstřely
  const shots = [[tt.shot1 + 1.9, check], [tt.chaplain + 2.4, slade]];
  const SFX = [[0.5, 'type', 0.6], [tt.shot1 + 1.6, 'shoot', 0], [tt.rock + 0.1, 'stamp', 0], [tt.chaplain + 2.4, 'shoot', 0], [tt.toll, 'drum', 0], [tt.vote2, 'drum', 0], [END - 1.6, 'end', 0]];
  for (let t = tt.front + 0.6; t < tt.tree - 0.3; t += 0.8) SFX.push([+t.toFixed(2), 'shoot', 0]);
  for (let t = tt.canal + 0.8; t < tt.vote - 0.3; t += 1.3) SFX.push([+t.toFixed(2), 'shoot', 0]);

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  const causes = (list) => list.map(([k, n]) => `<div class="c"><span>${k}</span><span>${n}</span></div>`).join('');
  root.innerHTML = `
    <div id="rf-rain"></div>
    <div id="rf-paper" class="paper"><div class="m"><span>Price: one cigarette</span><span>Rain</span></div><div class="n">TRENCH GAZETTE</div><div class="d">DAY 6</div>
      <div class="h"></div><div class="s">Hill 304 taken · 25 men fell · 67 hit</div></div>
    <div id="rf-tagH" class="rf-tag">HEGEMONY<b>227</b></div>
    <div id="rf-tagC" class="rf-tag">CONCORD<b>206</b></div>
    <div id="rf-b1" class="rf-bub"><span class="who">Spotter · Hill 304</span>Sector nine. A sniper, left of the broken post.</div>
    <div id="rf-b2" class="rf-bub"><span class="who">Anselm Rock · Concord</span>Just one look...</div>
    <div id="rf-b3" class="rf-bub"><span class="who">Karel Check · Hegemony</span>Got him.</div>
    <div id="rf-b4" class="rf-bub"><span class="who">Bram Hop · chaplain</span>Stay with me, son. Stay with me.</div>
    <div id="rf-b5" class="rf-bub"><span class="who">Wounded · Hegemony</span>Doc... am I next?</div>
    <div id="rf-b6" class="rf-bub"><span class="who">Medic · Hegemony</span>Everyone is next. There are thirteen of us.</div>
    <div id="rf-b7" class="rf-bub"><span class="who">Hegemony</span>We are dying for a ditch of black water?</div>
    <div id="rf-b8" class="rf-bub"><span class="who">Hegemony</span>They have twenty-one. We have four.</div>
    <div id="rf-b9" class="rf-bub"><span class="who">Medic · Hegemony</span>Give us beds, not medals.</div>
    <div id="rf-card1" class="rf-card"><div class="t"><span>FIELD TELEGRAPH</span><span>DAY 6</span></div><div class="n">ANSELM ROCK</div><div class="w">Concord sniper, sector R-F9.<br>Shot by Karel Check of the Hegemony.</div><div class="st">FALLEN</div></div>
    <div id="rf-card2" class="rf-card"><div class="t"><span>FIELD TELEGRAPH</span><span>DAY 6</span></div><div class="n">BRAM HOP</div><div class="w">Concord chaplain, sector S-F4.<br>Shot by Dietrich Slade of the Hegemony.</div><div class="st">FALLEN</div></div>
    <div id="rf-toll" class="rf-panel"><div class="t">DAY 6 · THE DEAD</div>
      <div class="row"><span>HEGEMONY</span><b>${D.fell[0]}</b></div>${causes(D.heg)}
      <div class="row" style="margin-top:12px"><span>CONCORD</span><b>${D.fell[1]}</b></div>${causes(D.con)}</div>
    <div id="rf-roll"><div class="t">ROLL OF HONOUR · DAY 6</div>${D.roll.map(([n, r, w]) => `<div class="r"><b>† ${n}</b><span>${w}</span></div>`).join('')}</div>
    <div id="rf-race" class="rf-panel"><div class="t">THE RACE FOR BLACKWATER CANAL</div>
      <div class="row"><span>CONCORD</span><b class="n" data-v="${D.race[1]}">0</b></div><div class="rf-bar"><i data-w="${D.race[1]}" style="background:#8a8a52"></i></div>
      <div class="row"><span>HEGEMONY</span><b class="n" data-v="${D.race[0]}">0</b></div><div class="rf-bar"><i data-w="${D.race[0]}" style="background:#8f8a82"></i></div>
      <div class="c" style="opacity:1;justify-content:center"><span>first to 100 enemy dead takes the canal</span></div></div>
    <div id="rf-vote"><img src="${voteImg}" alt="">${[0, 1, 2].map((i) => `<div class="hl" style="top:${(42 + i * 60) / 2.7}%;height:${56 / 2.7}%"></div>`).join('')}</div>
    <div id="rf-army" class="rf-panel"><div class="t">THE FRONT TODAY</div><div class="row"><span>NEW YESTERDAY</span><b>+${D.joined[0] + D.joined[1]}</b></div>
      <div class="row"><span>ON THE LINE</span><b>${D.army[0] + D.army[1]}</b></div><div class="c" style="opacity:1"><span>Hegemony ${D.army[0]}</span><span>Concord ${D.army[1]}</span></div></div>
    <div id="rd-big"></div>
    <div id="rd-sub"></div>
  `;
  document.body.appendChild(root);
  root.querySelector('#rf-paper').style.backgroundImage = `url(${paperTexture()})`;
  const cine = makeScenes(tex, anims);
  cine.canvas.id = 'rf-cine';
  root.prepend(cine.canvas);
  const wire = makeWireScenes(tex, anims);
  wire.canvas.id = 'rf-wire';
  root.insertBefore(wire.canvas, cine.canvas.nextSibling);
  const paint = fxLayers(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };
  // bublina nad vojákem ve hře (posunutá do středu obrazu, ať není u okraje), nebo na místě ve filmové scéně (procenta)
  const bubAt = (sel, who, t0, t1, lift = 40) => {
    const el = $(sel); if (!el) return;
    const o = t >= t0 && t < t1 ? Math.min(1, (t - t0) / 0.15, (t1 - t) / 0.15) : 0;
    if (!o) { el.style.opacity = 0; return; }
    tagAt(el, who, cam, o, lift);
    const x = parseFloat(el.style.left), w = cam.w;
    el.style.left = `${Math.min(w * 0.68, Math.max(w * 0.32, x))}px`;
  };
  const bubPct = (sel, x, y, t0, t1) => { const el = $(sel); const o = t >= t0 && t < t1 ? Math.min(1, (t - t0) / 0.15, (t1 - t) / 0.15) : 0; el.style.opacity = o; el.style.left = `${x}%`; el.style.top = `${y}%`; };
  let t = 0;
  let si = 0;

  function frame(tNow) {
    t = tNow;
    const f = fx(t);
    for (const q of soldiers) if (q.vacant && q.sprite && q.sprite.alpha < 1) { q.sprite.alpha = 1; q.sprite.tint = [0xffffff, 0xf0ece4, 0xe6e2da, 0xfff4e8][q.variant % 4]; }
    const [x, y, z] = camAt(t);
    cam.set(x, y, z * (1 + 0.03 * f.punch));
    while (si < shots.length && shots[si][0] <= t) { life.debug.shoot([shots[si][1]]); si++; }
    const fl = film(t);
    if (fl === 'tree') wire.draw('tree', t - tt.tree, { side: 0 });
    if (fl === 'canal') cine.draw('canal', t - tt.canal);
    show('#rf-wire', fl === 'tree' ? 1 : 0);
    show('#rf-cine', fl === 'canal' ? 1 : 0);
    show('#rf-rain', fl ? 0 : 1);
    const paperOn = t < tt.front;
    paint({ ...f, black: Math.max(f.black, paperOn ? 0.55 : 0, t < 0.3 ? 1 - t / 0.3 : 0, t > END - 0.6 ? clamp01((t - END + 0.6) / 0.5) : 0) });

    // titulní strana novin (DAY 6) místo noční scény
    slam($('#rf-paper'), t, 0.25, tt.front - 0.05, 1.5, -6);
    $('#rf-paper .h').textContent = typed('HILL 304 IS OURS. NOW WE COUNT THE DEAD.', t, 0.9, 26);
    // fronta: jmenovky stran nad liniemi
    const tH = win(t, tt.front + 0.2, tt.sides + 1.55, 0.2), tC = win(t, tt.sides + 1.7, tt.tree - 0.05, 0.2);
    tagAt($('#rf-tagH'), { x, y: y - 30 }, cam, tH, 0);
    tagAt($('#rf-tagC'), { x, y: y - 30 }, cam, tC, 0);
    // příběhy: pozorovatel, odstřelovači, kaplan, nemocnice, kanál, hlasování
    bubPct('#rf-b1', 52, 40, tt.tree + 0.6, tt.shot1 - 0.05);
    bubAt('#rf-b2', rock, tt.shot1 + 0.1, tt.shot1 + 1.6);
    bubAt('#rf-b3', check, tt.shot1 + 2.3, tt.rock - 0.05);
    slam($('#rf-card1'), t, tt.rock + 0.1, tt.chaplain - 0.05, 1.4, -4);
    bubAt('#rf-b4', hop, tt.chaplain + 0.2, tt.chaplain + 2.4);
    slam($('#rf-card2'), t, tt.chaplain + 2.7, tt.hosp - 0.05, 1.4, 4);
    bubAt('#rf-b5', site.beds?.[0] ? { x: site.beds[0].x, y: site.beds[0].y } : site, tt.hosp2 + 0.1, tt.hosp2 + 2.3, 30);
    bubAt('#rf-b6', hegMedic.x ? hegMedic : site, tt.hosp2 + 2.5, tt.wait + 1.8, 40);
    show('#rf-toll', win(t, tt.toll + 0.1, tt.canal - 0.05, 0.2));
    root.querySelectorAll('#rf-toll .c').forEach((el, i) => (el.style.opacity = t > tt.toll + 0.6 + i * 0.35 ? 1 : 0));
    show('#rf-roll', win(t, tt.toll + 0.8, tt.canal - 0.05, 0.2));
    root.querySelectorAll('#rf-roll .r').forEach((el, i) => (el.style.opacity = t > tt.toll + 1.0 + i * 0.25 ? 1 : 0));
    bubPct('#rf-b7', 36, 62, tt.canal + 0.3, tt.canal2 + 0.4);
    bubPct('#rf-b8', 68, 60, tt.canal2 + 2.6, tt.vote - 0.05);
    show('#rf-race', win(t, tt.canal2 + 0.1, tt.vote - 0.05, 0.2));
    const ru = easeOut(clamp01((t - tt.canal2 - 0.4) / 1.4));
    root.querySelectorAll('#rf-race .n').forEach((el) => (el.textContent = Math.round(Number(el.dataset.v) * ru)));
    root.querySelectorAll('#rf-race i').forEach((el) => (el.style.width = `${Number(el.dataset.w) * ru}%`));
    bubAt('#rf-b9', hegMedic, tt.vote + 0.2, tt.vote2 - 0.05, 40);
    const v = $('#rf-vote');
    const vu = easeOut(clamp01((t - tt.vote2) / 0.45));
    v.style.opacity = t < tt.vote2 || t > tt.joined ? 0 : Math.min(1, vu * 2, (tt.joined - t) / 0.2);
    v.style.transform = `rotate(${(1 - vu) * -8}deg) scale(${0.7 + 0.3 * vu})`;
    root.querySelectorAll('#rf-vote .hl').forEach((el, i) => { const a = tt.vote2 + 0.6 + i * 0.9; el.style.opacity = t > a && t < tt.joined ? (t < a + 0.9 ? 1 : 0.25) : 0; });
    show('#rf-army', win(t, tt.joined + 0.1, tt.cta2 - 0.05, 0.2));
    const logo = t >= tt.cta2;
    const bigEl = $('#rd-big');
    bigEl.style.opacity = logo ? Math.min(1, (t - tt.cta2) / 0.3) : 0;
    if (logo && !bigEl.dataset.on) { bigEl.dataset.on = 1; bigEl.className = 'logo'; bigEl.innerHTML = '<span>MUD <i>&amp;</i> IRON</span><span>@mudandiron · link in bio</span>'; }
    const s = sub(t);
    const subEl = $('#rd-sub');
    if (s && !logo) {
      subEl.style.opacity = 1;
      subEl.style.top = t < tt.front ? '72%' : '13%';
      if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; }
    } else subEl.style.opacity = 0;
  }

  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
