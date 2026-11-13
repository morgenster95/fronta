// Denní reel „co se stalo“ (/?reel=day<N>&vacant=700, jen vývojový server). Podklady ze skutečného stavu po tahu:
// node tools/day-reel.mjs → marketing/reels/day<N>.data.json + .script.json; hlas python marketing/story_vo.py day<N>
// (auto: věty jdou hned za sebou). Střihy a přechody se řídí začátky vět (id) v day<N>.vo.json.
import { makeCinema, CSS as BASE } from './reel-day1.js';
import { paperTexture, tornClip } from './paper.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, tagAt, slam, ease, easeOut, clamp01, win, typed } from './reel-kit.js';
import voteImg from '../../marketing/promo/vote_build_2.jpg';
import { makeScenes, pickScene, CINEMA_CSS } from './cinema.js';

const files = import.meta.glob('../../marketing/reels/day*.json', { eager: true, import: 'default' });

const CSS = `${BASE}${FX_CSS}${CINEMA_CSS}
#rd-count { left: 7%; right: 7%; top: 54%; }
#rd-count .side { display: grid; grid-template-columns: 1fr auto; align-items: baseline; margin: 8px 0 2px; font-family: 'Silkscreen', monospace; font-size: 22px; }
#rd-count .side b { font-weight: 400; font-size: 50px; line-height: 1; display: inline-block; }
#rd-count ul { list-style: none; margin: 0; padding: 0; }
#rd-count li { font-size: 21px; opacity: 0; border-left: 3px solid #d98f3f; padding-left: 8px; margin: 2px 0; display: flex; justify-content: space-between; gap: 8px; }
#rd-count li span { color: #a39782; }
#rd-shot { left: 6%; right: 6%; top: 52%; }
#rd-shot .paper { --ink: #2a2118; --red: #7a2a1c; padding: 14px 16px 18px; color: var(--ink); background-size: 288px 288px; image-rendering: pixelated; font-size: 22px; position: relative; }
#rd-shot .h { font-family: 'Silkscreen', monospace; font-size: 13px; border-bottom: 2px solid var(--ink); padding-bottom: 4px; margin-bottom: 8px; display: flex; justify-content: space-between; }
#rd-shot .who { font-family: 'Silkscreen', monospace; font-size: 26px; color: var(--red); margin: 2px 0; }
#rd-shot .rk-stamp { left: 82%; top: 80%; font-size: 26px; border-width: 4px; }
#rd-raid { left: 7%; right: 7%; top: 27%; text-align: center; }
#rd-raid img { width: 62%; image-rendering: pixelated; filter: drop-shadow(0 6px 0 rgba(0,0,0,0.6)); }
#rd-raid .title { font-family: 'Silkscreen', monospace; font-size: 26px; line-height: 1.1; margin: 6px 0; }
#rd-raid .kw { display: inline-block; font-family: 'Silkscreen', monospace; font-size: 30px; background: rgba(126, 59, 42, 0.95); padding: 4px 14px; margin-top: 8px; }
#rd-army { left: 10%; right: 10%; top: 34%; text-align: center; }
#rd-army .k { font-family: 'Silkscreen', monospace; font-size: 20px; color: #d98f3f; }
#rd-army .n { font-family: 'Silkscreen', monospace; font-size: 96px; line-height: 1; text-shadow: 5px 5px 0 #0e0d0c; }
#rd-side { left: 0; right: 0; top: 66%; text-align: center; }
#rd-side span { display: inline-block; font-family: 'Silkscreen', monospace; font-size: 30px; background: rgba(14, 13, 12, 0.88); border-bottom: 4px solid currentColor; padding: 6px 16px; text-shadow: 3px 3px 0 #0e0d0c; }
#rd-side b { font-weight: 400; font-size: 64px; margin-right: 14px; vertical-align: -6px; }
#rd-fallen { left: 7%; right: 7%; top: 30%; }
#rd-fallen .paper { --ink: #2a2118; --red: #7a2a1c; padding: 14px 16px 16px; color: var(--ink); background-size: 288px 288px; image-rendering: pixelated; font-size: 23px; }
#rd-fallen .h { font-family: 'Silkscreen', monospace; font-size: 14px; border-bottom: 2px solid var(--ink); padding-bottom: 4px; margin-bottom: 8px; display: flex; justify-content: space-between; }
#rd-fallen li { list-style: none; display: flex; justify-content: space-between; gap: 8px; margin: 3px 0; opacity: 0; }
#rd-fallen ul { margin: 0; padding: 0; }
#rd-fallen li b { font-weight: 400; color: var(--red); }
#rd-fallen li span { font-size: 18px; opacity: 0.8; }
#rd-fallen .heir { font-family: 'Silkscreen', monospace; font-size: 15px; color: var(--red); margin-top: 10px; opacity: 0; }
#rd-hill { left: 7%; right: 7%; top: 27%; }
#rd-hill .k { font-family: 'Silkscreen', monospace; font-size: 20px; color: #d98f3f; text-align: center; margin-bottom: 8px; }
#rd-hill .row { display: grid; grid-template-columns: 1fr auto; align-items: baseline; font-family: 'Silkscreen', monospace; font-size: 24px; margin-top: 8px; }
#rd-hill .row b { font-weight: 400; font-size: 52px; line-height: 1; }
#rd-hill .bar { height: 14px; background: #2b2722; border: 2px solid #0e0d0c; margin-top: 4px; position: relative; }
#rd-hill .bar i { position: absolute; left: 0; top: 0; bottom: 0; background: currentColor; }
#rd-hill .goal { font-family: 'Silkscreen', monospace; font-size: 15px; color: #a39782; text-align: right; margin-top: 8px; }
#rd-night { left: 0; right: 0; top: 30%; text-align: center; }
#rd-night span { display: inline-block; font-family: 'Silkscreen', monospace; font-size: 30px; background: rgba(126,59,42,0.95); padding: 6px 16px; margin: 3px 0; text-shadow: 3px 3px 0 #0e0d0c; opacity: 0; }
#rd-letter { left: 8%; right: 8%; top: 27%; text-align: center; }
#rd-letter .btn { display: inline-block; font-family: 'Silkscreen', monospace; font-size: 21px; color: #efe6cf; background: #7e3b2a; border: 4px solid #0e0d0c; box-shadow: 0 0 0 3px #d98f3f, 6px 8px 0 rgba(0,0,0,0.6); padding: 10px 14px; line-height: 1.25; }
#rd-letter .n { font-family: 'Silkscreen', monospace; font-size: 22px; color: #d98f3f; margin-top: 18px; text-shadow: 3px 3px 0 #0e0d0c; }
#rd-letter .n b { font-weight: 400; font-size: 64px; display: block; line-height: 1; color: #efe6cf; }
#rd-vote { left: 17%; right: 17%; top: 25%; }
#rd-vote img { width: 100%; display: block; image-rendering: pixelated; box-shadow: 0 8px 0 rgba(0,0,0,0.5), 0 16px 28px rgba(0,0,0,0.6); }
#rd-vote .hl { position: absolute; left: 2.5%; right: 2.5%; border: 4px solid #d98f3f; box-shadow: 0 0 0 3px #0e0d0c, 0 0 22px rgba(217,143,63,0.7); opacity: 0; }
`;

export function startDailyReel({ name, cam, life, map, theme, soldiers, tex, anims, hospitals }) {
  const data = files[`../../marketing/reels/${name}.data.json`];
  const script = files[`../../marketing/reels/${name}.script.json`];
  let vo = files[`../../marketing/reels/${name}.vo.json`];
  if (!vo) { // bez hlasu (náhled): odhad délky vět
    let c = 0;
    vo = { lines: script.lines.map(([at, text, id]) => { const s = Math.max(at, c), d = text.length / 15 + 0.2; c = s + d + 0.25; return [s, d, text, id]; }) };
    vo.seconds = c + 3.2;
  }
  const C = cues(vo);
  const END = vo.seconds;
  const at = (id) => C.at(id);
  const tSh = at('shooter'), tShot = at('shot'), tCount = at('count'), tAid = at('aid'), tStr = at('stretcher');
  const tArmy = at('army'), tArmyH = at('armyH'), tArmyC = at('armyC'), tRaid = at('raid'), tVote = at('vote'), tOpts = at('opts'), tCta = at('cta');
  const tFallen = at('fallen'), tRace = at('race'), tRaceN = at('raceN'), tNight = at('tonight'), tLetter = at('letter'), tLetter2 = at('letter2');
  // co následuje po obvazišti (závod, děla, dopis, počty) a po přejezdu po linii (výprava, hlasování, závěr)
  const tPost = tRace ?? tNight ?? tLetter ?? tArmy ?? tRaid ?? tVote ?? tCta;
  const tTail = tRaid ?? tVote ?? tCta;
  const tEnd = (id) => at(id) + C.len(id);

  const T = map.tile;
  const short = (f) => theme.factions[f].name.replace(/^The /, '').toUpperCase();
  const roleName = (id) => theme.archetypes.find((a) => a.id === id)?.name || id;
  const byHandle = (h) => soldiers.find((s) => s.handle === h);
  const front = (f) => soldiers.filter((s) => s.faction === f && s.slot?.line === 'front').sort((a, b) => a.x - b.x);
  const hs = front(0), cs = front(1);
  const real = (f) => front(f).filter((s) => s.handle && !s.vacant && !s.hosp); // skuteční hráči v první linii
  const hx = hs[Math.floor(hs.length / 2)].x;
  const mid = ((map.front[0] + map.front[1]) / 2) * T + 16;
  const shooter = data.fire ? byHandle(data.fire.by.handle) : null;
  const sh = shooter ?? cs[Math.floor(cs.length / 2)];
  const site = hospitals?.sites.find((x) => x.faction === data.focus);
  const hosp = site ? { x: site.x, y: site.y } : { x: hx, y: mid };
  const bedded = soldiers.filter((s) => s.faction === data.focus && s.hosp === 'bed');
  const aim = (s, z) => [s.x, s.y - 14 + 58 / z, z];

  // přejezd po frontové linii jedné strany: střih na první stanoviště, jízda k poslednímu
  function sweep(line, a, b) {
    if (!line.length) return [];
    const f = line[0], l = line[line.length - 1];
    return [[a, ...aim(f, 2.6), 'cut'], [b, l.x, aim(l, 2.6)[1], 2.6]];
  }
  // --- kamera: tvrdé střihy na začátcích vět ---
  const afterShot = tShot ?? tCount;
  const rearY = (hs[0]?.y ?? mid) - 70; // za první linií Hegemonie (bombardování)
  const K = [
    [0, hx - 200, mid, 1.3],
    [tSh - 0.01, hx - 200, mid, 1.3],
    [tSh, ...aim(sh, 4.1), 'cut'],
    [afterShot - 0.01, sh.x + 14, aim(sh, 4.6)[1], 4.6],
    ...(tShot ? [[tShot, (sh.x + hx) / 2, mid + (sh.faction === 0 ? 40 : -40), 2.5, 'cut'], [tCount - 0.01, (sh.x + hx) / 2 + 40, mid, 2.2]] : []),
    [tCount, hx - 60, mid, 1.45, 'cut'],
    [tAid - 0.01, hx + 120, mid - 20, 1.25],
    [tAid, hosp.x - 30, hosp.y + 2, 3.7, 'cut'],
    [tStr, hosp.x, hosp.y + 4, 4.1],
    [Math.min(tStr + C.len('stretcher') + 0.2, tPost - 0.02), hosp.x + 16, hosp.y + (data.focus === 0 ? 26 : -26), 4.4],
    ...(tRace ? [[tRace, hx - 220, mid, 1.1, 'cut'], [(tNight ?? tLetter ?? tArmy) - 0.01, hx + 60, mid, 1.2]] : []),
    ...(tNight ? [[tNight, hx - 140, rearY, 1.7, 'cut'], [(tLetter ?? tArmy) - 0.01, hx + 120, rearY, 2.0]] : []),
    ...(tLetter ? [[tLetter, hx - 120, mid, 1.2, 'cut'], [tArmy - 0.01, hx - 100, mid, 1.2]] : []),
    ...(tArmy ? [[tArmy, hx - 160, mid, 1.15, 'cut'],
      ...(tArmyH && tArmyC ? [[tArmyH - 0.01, hx - 60, mid, 1.2], ...sweep(real(0), tArmyH, tArmyC - 0.01), ...sweep(real(1), tArmyC, tTail - 0.02)] : [])] : []),
    [tTail - 0.01, hx + 140, mid, 1.3],
    [tTail, hx - 120, mid, 1.2, 'cut'],
    [END, hx + 260, mid, 1.35],
  ];
  const camAt = camPath(K);
  const sub = subtitles(vo);
  const fx = transitions([
    [tSh, 'flash'], ...(tShot ? [[tShot - 0.12, 'flash'], [tShot, 'whip']] : []), [tCount, 'black', 0.36],
    ...(tFallen ? [[tFallen, 'black', 0.4]] : []), [tAid, 'whip'], [tStr, 'black', 0.3], ...(tRace ? [[tRace, 'black', 0.36]] : []), ...(tNight ? [[tNight, 'flash']] : []), ...(tLetter ? [[tLetter, 'black', 0.4]] : []),
    ...(tArmy ? [[tArmy, 'black', 0.36], ...(tArmyH ? [[tArmyH, 'whip'], [tArmyC, 'whip']] : [])] : []), ...(tRaid ? [[tRaid, 'black', 0.4]] : []), ...(tVote ? [[tVote, 'flash']] : []), [tCta, 'black', 0.5],
    [tSh + 1.2, 'punch'], ...(tShot ? [[tShot - 0.12, 'punch']] : []),
  ]);
  const NIGHT = { flares: [[0.8, 50], [3.2, 120]], flashes: [[0.3, 40], [2.4, 150]], march: 8 };
  const DAWN = { flares: [[0.3, 110]], flashes: [], march: 9 };

  const EV = [[tSh + 1.0, 'shootAt', sh], [(tShot ?? tSh + 2.4) - 0.7, 'shootAt', sh], [tCount + 0.5, 'shoot', 0], [tCount + 1.4, 'shoot', 1], [tCount + 2.2, 'shoot', 0],
    ...(tRaid ? [[tRaid + 0.6, 'flare', hx, mid]] : [])];
  const SFX = [];
  for (const e of EV) if (e[1] === 'shoot' || e[1] === 'shootAt') SFX.push([e[0] + 0.62, 'shoot', 0]);
  SFX.push([0.5, 'type', 0.4], [at('guns'), 'type', 0.9], [tSh, 'reveal', 0], [(tShot ?? tCount) + 0.3, 'stamp', 0], [tCount, 'drum', 0], [tAid, 'bell', 0], ...(tArmy ? [[tArmy, 'drum', 0], ...(tArmyH ? [[tArmyH, 'stamp', 0], [tArmyC, 'stamp', 0]] : [])] : []),
    ...(tRaid ? [[tRaid, 'whistle', 0]] : []), ...(tVote ? [[tVote, 'drum', 0], ...[0, 1].map((i) => [tOpts + i * 1.1, 'stamp', 0])] : []), [tCta, 'end', 0],
    ...(tFallen ? [[tFallen, 'bell', 0]] : []), ...(tRace ? [[tRace, 'drum', 0], [tRaceN + 0.3, 'tick', 2]] : []), ...(tNight ? [[tNight, 'barrage', 5]] : []),
    ...(tLetter ? [[tLetter + 0.4, 'type', 1.2], [tLetter2 + 0.4, 'stamp', 0]] : []));
  // dopady granátů za první linií (předem určené, video je vždy stejné)
  const BOOM = [];
  if (tNight) { let q = 4242; const rr = () => ((q = (q * 16807) % 2147483647) / 2147483647);
    for (let t = tNight + 0.2; t < (tLetter ?? tArmy) - 0.3; t += 0.18 + rr() * 0.2) BOOM.push([t, rr() < 0.55, rr(), rr()]); }

  // --- DOM ---
  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  const sevText = { light: 'GRAZED', heavy: 'BADLY WOUNDED', crit: 'GRAVELY WOUNDED', killed: 'KILLED' };
  const placeText = { bed: 'in a bed', stretcher: 'on a stretcher', trench: 'in the trench', fallen: 'the family sent the next in line' };
  const hitN = data.hitN || data.hit.map((l) => l.length);
  const fallenList = (data.fallen || []).slice(0, 6);
  const list = (f) => data.hit[f].slice(0, 3).map((r) => `<li>@${r.handle}<span>${sevText[r.sev].toLowerCase()}</span></li>`).join('')
    + (data.hit[f].length > 3 ? `<li style="border:0">+ ${data.hit[f].length - 3} more<span></span></li>` : '');
  root.innerHTML = `
    <div id="rd-dim"></div>
    <div id="rd-day"><div class="big"></div><div class="sub"></div></div>
    <div id="rd-big"></div>
    <div class="rd-tag" id="rd-tag-sh">@${data.fire?.by.handle ?? ''}<span>${data.fire ? `${short(data.fire.by.faction)} ${roleName(data.fire.by.role)}` : ''}</span></div>
    ${bedded.map((s, i) => `<div class="rd-tag" id="rd-bed${i}">@${s.handle}<span>${(sevText[s.sev] || '').toLowerCase()}</span></div>`).join('')}
    ${data.fire ? `<div id="rd-shot"><div class="paper" style="background-image:url(${paperTexture(5)});clip-path:${tornClip(5)}">
      <div class="h"><span>FIELD TELEGRAPH</span><span>DAY ${data.day}</span></div>
      <div class="who">@${data.fire.handle}</div>
      <div>${sevText[data.fire.sev]} · shot by @${data.fire.by.handle}</div>
      <div>${data.fire.sev === 'killed' ? placeText.fallen : `now ${placeText[data.fire.place] || 'in the trench'}`}</div><div class="rk-stamp">${data.fire.sev === 'killed' ? 'FALLEN' : 'HIT'}</div></div></div>` : ''}
    ${fallenList.length ? `<div id="rd-fallen"><div class="paper" style="background-image:url(${paperTexture(7)});clip-path:${tornClip(7)}">
      <div class="h"><span>ROLL OF HONOUR</span><span>DAY ${data.day}</span></div><ul>${fallenList.map((x) => `<li><b>† ${x.name}</b><span>${short(x.faction).toLowerCase()} ${roleName(x.role).toLowerCase()}</span></li>`).join('')}</ul>
      <div class="heir">THE NEXT OF EACH FAMILY TOOK THEIR PLACE</div></div></div>` : ''}
    ${data.race ? `<div id="rd-hill" class="panel"><div class="k">THE RACE FOR ${data.race.name.toUpperCase()}</div>${[0, 1].map((f) => `<div style="color:${f ? '#c9c26a' : '#a7b4bb'}"><div class="row"><span>${short(f)}</span><b>0</b></div><div class="bar"><i style="width:0"></i></div></div>`).join('')}<div class="goal">FIRST TO ${data.race.goal} TAKES THE HILL</div></div>` : ''}
    ${data.shelled ? `<div id="rd-night"><span>TONIGHT</span><br><span>${data.shelled.nights > 1 ? 'AND TOMORROW' : 'THE LAST NIGHT'}</span><br><span>ON THE ${short(data.shelled.side)}</span></div>` : ''}
    ${tLetter ? `<div id="rd-letter"><div class="btn">✉ SEND YOUR SOLDIER A LETTER<br>15% SAFER TONIGHT</div>${data.letters > 1 ? `<div class="n"><b>0</b>LETTERS ON THE WAY</div>` : ''}</div>` : ''}
    <div id="rd-count" class="panel"><span class="k">Day ${data.day} · the wounded</span>
      <div class="side" style="color:#a7b4bb"><span>HEGEMONY</span><b>0</b></div><ul>${list(0)}</ul>
      <div class="side" style="color:#c9c26a"><span>CONCORD</span><b>0</b></div><ul>${list(1)}</ul></div>
    ${data.raid ? `<div id="rd-raid"><img src="/assets/locations/church.png" alt=""><div class="title">VOLUNTEERS WANTED<br>${data.raid.short.toUpperCase()}</div>
      <div class="m">${data.raid.seats} per side · tonight</div><div class="kw">COMMENT ${data.raid.kw}</div></div>` : ''}
    ${data.army ? `<div id="rd-army" class="panel"><div class="k">ON THE LINE TODAY</div><div class="n">0</div></div>` : ''}
    <div id="rd-side"><span><b></b><em style="font-style:normal"></em></span></div>
    <div id="rd-vote" style="${tVote ? '' : 'display:none'}"><img src="${voteImg}" alt="">${[0, 1].map((i) => `<div class="hl" style="top:${(54 + i * 80) / 2.7}%;height:${72 / 2.7}%"></div>`).join('')}</div>
    <div id="rd-sub"></div>
    <div id="rd-every"><span>EVERY MORNING · 13:00 UTC</span></div>
  `;
  document.body.appendChild(root);
  const cine = makeCinema(tex, anims);
  root.prepend(cine.canvas);
  // filmové mezizáběry: úvod a závěr se mezi dny střídají, k nosítkům obvaziště při lucerně, k výpravě kostel
  const scenes = makeScenes(tex, anims);
  root.insertBefore(scenes.canvas, cine.canvas.nextSibling);
  const intro = pickScene(data.day, data.raid ? ['march', 'flare'] : ['march', 'flare', 'church']);
  const outro = pickScene(data.day, ['dawn', 'dawnwire', 'grim'], 1); // dawnwire = Hegemony za úsvitu, grim = Concord v ohni
  const sceneAt = (t) => {
    if (t < tSh && intro !== 'march') return [intro, t];
    if (t >= tStr && t < tPost) return ['aidpost', t - tStr];
    if (tLetter && t >= tLetter && t < (tArmy ?? tTail)) return ['letter', t - tLetter];
    if (tRaid && t >= tRaid && t < tVote) return ['church', t - tRaid];
    if (t >= tCta && outro !== 'dawn') return [outro, t - tCta];
    return null;
  };
  const paint = fxLayers(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };

  const fired = new Set(), boomed = new Set();
  let barraged = false;
  function frame(t) {
    const f = fx(t);
    const [x, y, z] = camAt(t);
    cam.set(x, y, z * (1 + 0.035 * f.punch));
    if (tNight && t >= tNight && !barraged) { barraged = true; life.setBarrage({ faction: data.shelled.side }); }
    for (const [i, [bt, big, ra, rb]] of BOOM.entries()) {
      if (boomed.has(i) || t < bt) continue;
      boomed.add(i);
      const [cx, cy, cz] = camAt(bt);
      life.shell(cx + (ra - 0.5) * 540 / cz, cy + (rb - 0.5) * 700 / cz, big);
    }
    for (const [i, ev] of EV.entries()) {
      if (fired.has(i) || t < ev[0]) continue;
      fired.add(i);
      if (ev[1] === 'flare') life.flareAt(ev[2], ev[3]);
      if (ev[1] === 'shootAt') {
        // odstřelovač ani kulometčík animaci míření nemají: vystřelí nejbližší střelec v záběru
        const who = ev[2]?.aim ? ev[2] : soldiers.filter((q) => q.aim && !q.hosp && Math.abs(q.x - x) < 260 / z && Math.abs(q.y - y) < 400 / z)
          .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
        if (who) life.debug.shoot([who]);
      }
      if (ev[1] === 'shoot') {
        const pool = soldiers.filter((s) => s.faction === ev[2] && s.aim && !s.hosp && Math.abs(s.x - x) < 600 / z && Math.abs(s.y - y) < 900 / z);
        if (pool.length) life.debug.shoot([pool[Math.floor(Math.random() * pool.length)]]);
      }
    }
    // noc na začátku, úsvit na konci
    const night = t < tSh, dawn = t >= tCta;
    const sc = sceneAt(t);
    if (sc) scenes.draw(sc[0], sc[1]);
    else if (night) cine.draw(t + 3, 'night', { ...NIGHT, pan: t * 6 });
    else if (dawn) cine.draw(t - tCta, 'dawn', { ...DAWN, pan: (t - tCta) * 5 });
    show('#rd-cine', !sc && (night || dawn) ? 1 : 0);
    show('#rd-cine2', sc ? 1 : 0);
    paint({ ...f, black: Math.max(f.black, t < 0.4 ? 1 - t / 0.4 : 0, t > END - 0.6 ? clamp01((t - END + 0.6) / 0.5) : 0) });

    show('#rd-day', night ? Math.min(1, t / 0.3) : 0);
    $('#rd-day .big').textContent = typed(`DAY ${data.day}`, t, 0.4, 12);
    $('#rd-day .sub').textContent = t > at('guns') ? typed(data.silent ? 'THE GUNS ARE SILENT' : 'THE GUNS SPOKE ALL NIGHT', t, at('guns'), 30) : '';

    const logo = t >= tCta + 0.4;
    const bigEl = $('#rd-big');
    bigEl.style.opacity = logo ? Math.min(1, (t - tCta - 0.4) / 0.3) : 0;
    if (logo && !bigEl.dataset.on) { bigEl.dataset.on = 1; bigEl.className = 'logo'; bigEl.innerHTML = '<span>MUD <i>&amp;</i> IRON</span><span>@mudandiron · link in bio</span>'; }
    const s = sub(t);
    const subEl = $('#rd-sub');
    if (s && t > tSh && !logo) {
      subEl.style.opacity = 1;
      subEl.style.top = '15.5%'; // pod horní lištou Instagramu (~12 % výšky)
      if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; }
    } else subEl.style.opacity = 0;

    tagAt($('#rd-tag-sh'), shooter, cam, win(t, tSh + 0.3, afterShot - 0.05, 0.2));
    if (tShot) {
      slam($('#rd-shot'), t, tShot + 0.05, tCount - 0.05);
      const st = $('#rd-shot .rk-stamp');
      const su = easeOut(clamp01((t - tShot - 0.55) / 0.18));
      st.style.opacity = t > tShot + 0.55 ? 1 : 0;
      st.style.transform = `translate(-50%, -50%) rotate(-12deg) scale(${2.2 - 1.2 * su})`;
    }
    bedded.forEach((who, i) => tagAt($(`#rd-bed${i}`), who, cam, win(t, tAid + 0.3 + i * 0.35, tStr - 0.05, 0.15)));

    show('#rd-count', win(t, tCount, tAid - 0.05, 0.15));
    root.querySelectorAll('#rd-count b').forEach((el, i) => {
      const a = tCount + 0.25 + i * 0.5;
      el.textContent = t > a ? hitN[i] : 0;
      el.style.transform = `scale(${1 + 0.8 * Math.exp(-Math.max(0, t - a) * 9) * (t > a)})`;
    });
    root.querySelectorAll('#rd-count li').forEach((el, i) => (el.style.opacity = t > tCount + 0.6 + i * 0.18 ? 1 : 0));
    show('#rd-every', win(t, tCount, tAid - 0.05, 0.15));

    if (tArmy && data.army) {
      const tE = tTail;
      show('#rd-army', win(t, tArmy + 0.1, (tArmyH ?? tE) - 0.05, 0.15));
      if (tArmyH && tArmyC) {
        const f = t >= tArmyC ? 1 : 0, a = f ? tArmyC : tArmyH;
        const side = $('#rd-side span');
        show('#rd-side', win(t, tArmyH + 0.15, tE - 0.05, 0.12) * (t < tArmyC - 0.08 || t > tArmyC + 0.12 ? 1 : 0));
        side.style.color = f ? '#c9c26a' : '#a7b4bb';
        side.querySelector('b').textContent = Math.round(easeOut(clamp01((t - a - 0.15) / 0.8)) * data.army[f]);
        side.querySelector('em').textContent = short(f);
      }
      const u = easeOut(clamp01((t - tArmy - 0.2) / 1.1));
      $('#rd-army .n').textContent = Math.round(u * (data.army[0] + data.army[1]));
    }
    show('#rd-dim', Math.min(0.95, (tShot ? win(t, tShot, tCount, 0.1) * 0.55 : 0) + (tFallen ? win(t, tFallen, tAid, 0.2) * 0.9 : 0) + (tRace ? win(t, tRace, tNight ?? tLetter ?? tArmy, 0.2) * 0.6 : 0)
      + ((tRaid || tVote) ? win(t, tRaid ?? tVote, tCta, 0.2) * 0.9 : 0)));
    if (tFallen) {
      slam($('#rd-fallen'), t, tFallen + 0.05, tAid - 0.05, 1.2, -2);
      root.querySelectorAll('#rd-fallen li').forEach((el, i) => (el.style.opacity = t > tFallen + 0.4 + i * 0.3 ? 1 : 0));
      show('#rd-fallen .heir', t > tFallen + C.len('fallen') * 0.6 ? 1 : 0);
    }
    if (tRace) {
      show('#rd-hill', win(t, tRace + 0.1, (tNight ?? tLetter ?? tArmy) - 0.05, 0.15));
      root.querySelectorAll('#rd-hill .row b').forEach((el, i) => {
        const n = Math.round(easeOut(clamp01((t - tRaceN - 0.2 - i * 0.4) / 1.2)) * data.race.counts[i]);
        el.textContent = n;
        el.parentNode.nextSibling.firstChild.style.width = `${Math.min(100, n / data.race.goal * 100)}%`;
      });
    }
    if (tNight) root.querySelectorAll('#rd-night span').forEach((el, i) => (el.style.opacity = t > tNight + 0.5 + i * 0.9 && t < (tLetter ?? tArmy) - 0.1 ? 1 : 0));
    if (tLetter) {
      const el = $('#rd-letter'), u = easeOut(clamp01((t - tLetter2) / 0.35));
      el.style.opacity = t < tLetter2 || t > tArmy - 0.05 ? 0 : Math.min(1, u * 1.5, (tArmy - t) / 0.2);
      el.style.transform = `scale(${1.25 - 0.25 * u})`;
      const nEl = $('#rd-letter .n b');
      if (nEl) nEl.textContent = Math.round(easeOut(clamp01((t - tLetter2 - C.len('letter2') * 0.55) / 1.0)) * data.letters);
    }
    if (tRaid) {
      const el = $('#rd-raid');
      const u = easeOut(clamp01((t - tRaid - 0.1) / 0.35));
      el.style.opacity = t < tRaid || t > tVote ? 0 : Math.min(u * 1.4, (tVote - t) / 0.15);
      el.style.transform = `translateX(${(1 - u) * 60}%)`;
    }
    const v = $('#rd-vote');
    if (tVote) {
    const vu = easeOut(clamp01((t - tVote) / 0.45));
    v.style.opacity = t < tVote || t > tCta ? 0 : Math.min(1, vu * 2, (tCta - t) / 0.2);
    v.style.transform = `rotate(${(1 - vu) * -9}deg) scale(${0.7 + 0.3 * vu})`;
    root.querySelectorAll('#rd-vote .hl').forEach((el, i) => {
      const a = tOpts + i * 1.1;
      el.style.opacity = t > a && t < tCta ? (t < a + 1.1 || i === 1 ? 1 : 0.25) : 0;
    });
    }
  }

  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
