// Reel „co je nového“ (/?reel=news&vacant=700, jen vývojový server): palba hráčů, záznamy v deníku, role, zkušenosti,
// obvaziště a jak ho najít, hlasování o stavbách, rod, žebříčky. Hlas: marketing/reels/news.script.json (auto časování),
// střihy podle začátků vět v news.vo.json. Skuteční hráči ze soupisky a poslední denní podklady (day<N>.data.json).
import { makeCinema, CSS as BASE } from './reel-day1.js';
import { paperTexture, tornClip } from './paper.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, tagAt, slam, easeOut, clamp01, win, typed } from './reel-kit.js';
import voteImg from '../../marketing/promo/vote_build_1.jpg';
import script from '../../marketing/reels/news.script.json';
import { makeScenes, CINEMA_CSS } from './cinema.js';

const files = import.meta.glob('../../marketing/reels/{news.vo,day*.data}.json', { eager: true, import: 'default' });

const CSS = `${BASE}${FX_CSS}${CINEMA_CSS}
#rn-title { left: 0; right: 0; top: 30%; text-align: center; }
#rn-title .a { font-family: 'Silkscreen', monospace; font-size: 30px; color: #d98f3f; letter-spacing: 0.1em; text-shadow: 3px 3px 0 #0e0d0c; min-height: 36px; }
#rn-title .b { font-family: 'Silkscreen', monospace; font-size: 58px; line-height: 1.05; text-shadow: 4px 4px 0 #0e0d0c; min-height: 124px; }
.rn-card { left: 6%; right: 6%; }
.rn-card .paper { --ink: #2a2118; --red: #7a2a1c; padding: 12px 14px 16px; color: var(--ink); background-size: 288px 288px; image-rendering: pixelated; font-size: 20px; line-height: 1.22; }
.rn-card .h { font-family: 'Silkscreen', monospace; font-size: 12px; border-bottom: 2px solid var(--ink); padding-bottom: 3px; margin-bottom: 6px; display: flex; justify-content: space-between; }
.rn-card b { font-weight: 400; color: var(--red); }
#rn-d1 { top: 24%; } #rn-d2 { top: 52%; }
#rn-role { left: 0; right: 0; bottom: 21%; text-align: center; }
#rn-role .n { font-family: 'Silkscreen', monospace; font-size: 40px; text-shadow: 4px 4px 0 #0e0d0c; }
#rn-role .d { display: inline-block; font-size: 24px; background: rgba(14,13,12,0.85); padding: 2px 10px; margin-top: 4px; }
#rn-role .c { font-size: 18px; color: #a39782; }
#rn-xp { left: 9%; right: 9%; top: 48%; }
#rn-xp .step { display: grid; grid-template-columns: 1fr auto; align-items: center; font-family: 'Silkscreen', monospace; font-size: 22px; padding: 7px 10px; margin: 6px 0;
  background: rgba(28,26,23,0.95); border: 2px solid #524a3f; opacity: 0.25; }
#rn-xp .step.on { opacity: 1; border-color: #d98f3f; }
#rn-xp .step span { font-family: 'VT323', monospace; font-size: 22px; color: #a39782; }
#rn-vote { left: 9%; right: 9%; top: 13%; }
#rn-vote img { width: 100%; display: block; image-rendering: pixelated; box-shadow: 0 8px 0 rgba(0,0,0,0.5), 0 16px 28px rgba(0,0,0,0.6); }
#rn-vote .hl { position: absolute; left: 2.5%; right: 2.5%; border: 4px solid #d98f3f; box-shadow: 0 0 0 3px #0e0d0c, 0 0 22px rgba(217,143,63,0.7); opacity: 0; }
#rn-house { top: 44%; }
#rn-house .gen { display: flex; justify-content: space-between; border-top: 1px dashed #5b4a35; padding: 4px 0; }
#rn-house .gen.dead { color: #5b4a35; text-decoration: line-through; }
#rn-ranks { left: 7%; right: 7%; top: 46%; }
#rn-ranks .t { font-family: 'Silkscreen', monospace; font-size: 22px; margin-bottom: 6px; }
#rn-ranks li { list-style: none; display: grid; grid-template-columns: 30px 1fr auto; gap: 6px; font-size: 22px; padding: 3px 0; border-bottom: 1px solid #3d3730; opacity: 0; }
#rn-ranks ol { margin: 0; padding: 0; }
#rn-ranks .v { color: #a39782; }
#rn-cursor { width: 30px; height: 30px; border-radius: 50%; border: 4px solid #fff6dc; background: rgba(255,246,220,0.35); box-shadow: 0 0 0 3px #0e0d0c, 0 0 18px rgba(255,246,220,0.8); transform: translate(-50%, -50%); z-index: 60; }
#rn-ripple { width: 30px; height: 30px; border-radius: 50%; border: 3px solid #fff6dc; transform: translate(-50%, -50%); z-index: 60; }
#rn-cta { left: 0; right: 0; top: 58%; text-align: center; }
#rn-cta span { display: inline-block; font-family: 'Silkscreen', monospace; font-size: 24px; background: rgba(126, 59, 42, 0.95); padding: 6px 14px; text-shadow: 3px 3px 0 #0e0d0c; }
`;

export async function startNewsReel({ cam, life, map, theme, soldiers, tex, anims, hospitals }) {
  let vo = files['../../marketing/reels/news.vo.json'];
  if (!vo) { // bez hlasu (náhled): odhad délky vět
    let c = 0;
    vo = { lines: script.lines.map(([at, text, id]) => { const s = Math.max(at, c), d = text.length / 15 + 0.2; c = s + d + 0.25; return [s, d, text, id]; }) };
    vo.seconds = c + 3.2;
  }
  const days = Object.entries(files).filter(([k]) => /day\d+\.data/.test(k)).map(([, v]) => v).sort((a, b) => b.day - a.day);
  const day = days[0] || null;
  const boards = await fetch('/data/boards.json').then((r) => r.json()).catch(() => ({}));
  const C = cues(vo);
  const at = C.at, END = vo.seconds;
  const T = map.tile;
  const real = soldiers.filter((s) => s.handle && !s.vacant && s.slot?.line === 'front' && !s.hosp);
  const pick = (role, f) => real.find((s) => s.archetype?.id === role && (f == null || s.faction === f)) || real.find((s) => s.archetype?.id === role) || real[0];
  const byHandle = (h) => soldiers.find((s) => s.handle === h);
  const short = (f) => theme.factions[f].name.replace(/^The /, '');
  const role = (id) => theme.archetypes.find((a) => a.id === id);
  const front = (f) => soldiers.filter((s) => s.faction === f && s.slot?.line === 'front').sort((a, b) => a.x - b.x);
  const hs = front(0);
  const hx = hs[Math.floor(hs.length / 2)].x;
  const mid = ((map.front[0] + map.front[1]) / 2) * T + 16;
  const aim = (s, z) => [s.x, s.y - 14 + 58 / z, z];
  const site = hospitals?.sites[0];
  const hosp = site ? { x: site.x, y: site.y } : { x: hx, y: mid };

  // střelec a zasažený: skutečný zásah z posledního tahu, jinak odstřelovač ze soupisky
  const shooter = (day?.fire && byHandle(day.fire.by.handle)) || pick('sniper');
  const target = day?.fire ? byHandle(day.fire.handle) : null;
  // montáž rolí: [věta, role] – každá role jeden rychlý záběr
  const montage = [
    ['roles', ['rifleman', 'officer', 'runner', 'chaplain']],
    ['roles2', ['sniper', 'machinegunner', 'medic']],
    ['roles3', ['sapper', 'cook']],
  ].flatMap(([id, list]) => {
    const t0 = at(id), d = C.len(id) + 0.25;
    return list.map((r, i) => ({ t: t0 + (d * i) / list.length, role: r, s: pick(r, i % 2) }));
  });
  const lvls = theme.battle?.xp?.levels || [{ name: 'Recruit', xp: 0 }, { name: 'Seasoned', xp: 60 }, { name: 'Veteran', xp: 180 }, { name: 'Elite', xp: 400 }];
  const me = byHandle('hodnepijumaloctu') || real.find((s) => s.claimed) || real[0];

  // --- kamera ---
  const K = [[0, hx - 200, mid, 1.3], [at('fire') - 0.01, hx - 200, mid, 1.3]];
  K.push([at('fire'), ...aim(shooter, 4.0), 'cut'], [at('diary') - 0.01, shooter.x + 16, aim(shooter, 4.5)[1], 4.5]);
  K.push([at('diary'), (shooter.x + hx) / 2, mid, 2.2, 'cut'], [at('roles') - 0.01, (shooter.x + hx) / 2 + 60, mid, 2.0]);
  for (const [i, m] of montage.entries()) {
    const next = montage[i + 1]?.t ?? at('xp');
    K.push([m.t, ...aim(m.s, 4.4), 'cut'], [next - 0.01, m.s.x + 10, aim(m.s, 4.7)[1], 4.7]);
  }
  K.push([at('xp'), ...aim(me, 3.6), 'cut'], [at('aid') - 0.01, me.x + 20, aim(me, 3.9)[1], 3.9]);
  K.push([at('aid'), hosp.x - 30, hosp.y, 3.6, 'cut'], [at('mud') - 0.01, hosp.x, hosp.y + 4, 4.0]);
  K.push([at('mud') + 0.6, hosp.x + 10, hosp.y + 30, 4.3]);
  const tf = at('find'), tv = at('vote'), L = C.len('find');
  // jak ji najít: oddálit (odznak s křížem), přiblížit jinam (směrovka u okraje), klik → přelet k nemocnici
  K.push([tf, hosp.x, hosp.y, 0.9, 'cut'], [tf + 0.38 * L, hosp.x, hosp.y, 0.55], [tf + 0.42 * L, hosp.x - 900, mid, 2.6, 'cut'], [tf + 0.82 * L, hosp.x - 900, mid, 2.6], [tv - 0.01, hosp.x, hosp.y, 3.6]);
  K.push([tv, hx - 100, mid, 1.2, 'cut'], [at('house') - 0.01, hx + 100, mid, 1.25]);
  K.push([at('house'), ...aim(me, 4.2), 'cut'], [at('ranks') - 0.01, me.x + 14, aim(me, 4.5)[1], 4.5]);
  K.push([at('ranks'), hx - 80, mid, 1.3, 'cut'], [END, hx + 240, mid, 1.4]);
  const camAt = camPath(K);
  const sub = subtitles(vo);
  const fx = transitions([
    [at('fire'), 'flash'], [at('fire') + 1.3, 'punch'], [at('diary'), 'whip'], ...montage.map((m) => [m.t, 'whip']),
    [at('xp'), 'black', 0.3], [at('aid'), 'whip'], [at('mud'), 'black', 0.3], [tf, 'black', 0.3], [tf + 0.42 * L, 'whip'], [tf + 0.8 * L, 'flash'], [tv, 'flash'],
    [at('house'), 'black', 0.3], [at('ranks'), 'whip'], [at('cta'), 'black', 0.5],
  ]);
  const NIGHT = { flares: [[0.5, 60]], flashes: [[0.2, 40], [1.4, 150]], march: 8 };
  const DAWN = { flares: [[0.3, 110]], flashes: [], march: 9 };
  const EV = [[at('fire') + 0.6, 'shootAt', shooter], [at('fire') + 1.6, 'shootAt', shooter], ...montage.map((m) => [m.t + 0.15, 'shootAt', m.s])];
  const SFX = [];
  for (const e of EV) SFX.push([e[0] + 0.62, 'shoot', 0]);
  SFX.push([0.4, 'type', 0.8], [at('fire'), 'reveal', 0], [at('diary') + 0.2, 'stamp', 0], [at('diary') + 1.4, 'stamp', 0], ...montage.map((m) => [m.t, 'tick', 0.15]),
    ...[0, 1, 2, 3].map((i) => [at('xp') + C.len('xp') * (0.45 + i * 0.14), 'medal', 0]), [at('aid'), 'bell', 0], [tf + 0.8 * L, 'reveal', 0], [tv, 'drum', 0],
    [at('house'), 'bell', 0], [at('ranks'), 'drum', 0], [at('cta'), 'end', 0]);

  // --- DOM ---
  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  const sevWord = { light: 'grazed', heavy: 'badly wounded', crit: 'gravely wounded' };
  const fireBy = day?.fire?.by;
  const d1 = target && fireBy
    ? `<div class="h"><span>SERVICE RECORD · @${target.handle}</span><span>DAY ${day.day}</span></div>A bullet found ${target.name} across from the ${short(fireBy.faction)} line, ${sevWord[day.fire.sev]}. <b>Shot by ${fireBy.name} of the ${short(fireBy.faction)} (@${fireBy.handle}).</b>`
    : `<div class="h"><span>SERVICE RECORD</span><span>DAY 2</span></div>A single shot from across the wire, high in the shoulder. <b>Shot by a ${short(shooter.faction)} ${role(shooter.archetype?.id)?.name} (@${shooter.handle}).</b>`;
  const d2 = target && fireBy
    ? `<div class="h"><span>SERVICE RECORD · @${fireBy.handle}</span><span>DAY ${day.day}</span></div>${fireBy.name} fired at a movement across the wire. The man went down: <b>${target.name} (@${target.handle}), ${sevWord[day.fire.sev]}.</b>`
    : `<div class="h"><span>SERVICE RECORD · @${shooter.handle}</span><span>DAY 2</span></div>Fired at a movement across the wire. <b>The man went down.</b>`;
  const board = (boards.longest || []).slice(0, 5);
  root.innerHTML = `
    <div id="rd-dim"></div>
    <div id="rn-title"><div class="a"></div><div class="b"></div></div>
    <div class="rd-tag" id="rn-tag-sh">@${shooter.handle}<span>${short(shooter.faction)} ${role(shooter.archetype?.id)?.name ?? ''}</span></div>
    <div class="rn-card" id="rn-d1"><div class="paper" style="background-image:url(${paperTexture(7)});clip-path:${tornClip(7)}">${d1}</div></div>
    <div class="rn-card" id="rn-d2"><div class="paper" style="background-image:url(${paperTexture(8)});clip-path:${tornClip(8)}">${d2}</div></div>
    <div id="rn-role"><div class="n"></div><div class="d"></div></div>
    <div id="rn-xp">${lvls.map((l) => `<div class="step">${l.name.toUpperCase()}<span>${l.xp} XP</span></div>`).join('')}</div>
    <div class="rd-tag" id="rn-tag-me">@${me.handle}<span>${role(me.archetype?.id)?.name ?? ''}</span></div>
    <div class="rd-tag" id="rn-tag-aid">${site?.beds >= 4 ? 'HOSPITAL' : 'AID POST'}<span>2 beds</span></div>
    <div id="rn-cursor"></div><div id="rn-ripple"></div>
    <div id="rn-vote"><img src="${voteImg}" alt="">${[0, 1, 2].map((i) => `<div class="hl" style="top:${(52 + i * 54) / 2.7}%;height:${50 / 2.7}%"></div>`).join('')}</div>
    <div class="rn-card" id="rn-house"><div class="paper" style="background-image:url(${paperTexture(9)});clip-path:${tornClip(9)}">
      <div class="h"><span>HOUSE OF ${(me.family || me.name.split(' ').at(-1)).toUpperCase()}</span><span>${short(me.faction).toUpperCase()}</span></div>
      <div class="gen"><span>${me.name}</span><span>1st · on the line</span></div>
      <div class="gen" style="opacity:.55"><span>the next of the house</span><span>2nd · waiting</span></div></div></div>
    <div id="rn-ranks" class="panel"><span class="k">Ranks</span><div class="t">LONGEST ALIVE</div>
      <ol>${board.map((r, i) => `<li><span>${i + 1}</span><span>@${r.handle}</span><span class="v">${r.value === 1 ? 'Day 1' : `${r.value} days`}</span></li>`).join('')}</ol></div>
    <div id="rd-big"></div>
    <div id="rn-cta"><span>COMMENT CONCORD or HEGEMONY</span></div>
    <div id="rd-sub"></div>
  `;
  document.body.appendChild(root);
  const cine = makeCinema(tex, anims);
  root.prepend(cine.canvas);
  // filmové mezizáběry: světlice v úvodu, dopis pod záznamy z deníku, obvaziště při lucerně, úsvit nad drátem k rodu
  const scenes = makeScenes(tex, anims);
  root.insertBefore(scenes.canvas, cine.canvas.nextSibling);
  const sceneAt = (t) => {
    if (t < at('fire')) return ['flare', t + 1.2];
    if (t >= at('diary') && t < at('roles')) return ['letter', t - at('diary') + 0.8];
    if (t >= at('mud') && t < tf) return ['aidpost', t - at('mud')];
    if (t >= at('house') && t < at('ranks')) return ['dawnwire', t - at('house')];
    return null;
  };
  const paint = fxLayers(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };
  const nav = () => [...document.querySelectorAll('.hosp-ptr')].find((e) => !e.hidden);

  const fired = new Set();
  function frame(t) {
    const f = fx(t);
    document.body.classList.toggle('show-nav', t >= tf + 0.42 * L && t < tv); // směrovka jen v ukázce „jak ji najít“
    const [x, y, z] = camAt(t);
    cam.set(x, y, z * (1 + 0.035 * f.punch));
    for (const [i, ev] of EV.entries()) {
      if (fired.has(i) || t < ev[0]) continue;
      fired.add(i);
      // střílí ten, kdo má animaci míření (střelci); jinak střelec nejblíž v záběru
      const who = ev[2]?.aim ? ev[2] : soldiers.filter((q) => q.aim && !q.hosp && Math.abs(q.x - x) < 260 / z && Math.abs(q.y - y) < 400 / z)
        .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
      if (who) life.debug.shoot([who]);
    }
    const night = t < at('fire'), dawn = t >= at('cta');
    const sc = sceneAt(t);
    if (sc) scenes.draw(sc[0], sc[1]);
    else if (dawn) cine.draw(t - at('cta'), 'dawn', { ...DAWN, pan: (t - at('cta')) * 5 });
    show('#rd-cine', !sc && dawn ? 1 : 0);
    show('#rd-cine2', sc ? 1 : 0);
    paint({ ...f, black: Math.max(f.black, t < 0.3 ? 1 - t / 0.3 : 0, t > END - 0.6 ? clamp01((t - END + 0.6) / 0.5) : 0) });

    show('#rn-title', night ? 1 : 0);
    $('#rn-title .a').textContent = typed('NEW ON THE FRONT', t, 0.3, 26);
    $('#rn-title .b').innerHTML = typed("WHAT'S NEW", t, 0.9, 12);

    const logo = t >= at('cta') + 0.3;
    const bigEl = $('#rd-big');
    bigEl.style.opacity = logo ? Math.min(1, (t - at('cta') - 0.3) / 0.3) : 0;
    if (logo && !bigEl.dataset.on) { bigEl.dataset.on = 1; bigEl.className = 'logo'; bigEl.innerHTML = '<span>MUD <i>&amp;</i> IRON</span><span>@mudandiron · link in bio</span>'; }
    show('#rn-cta', win(t, at('cta') + 0.8, END, 0.25));
    const s = sub(t);
    const subEl = $('#rd-sub');
    if (s && t > at('fire') && !logo) {
      subEl.style.opacity = 1;
      subEl.style.top = (t >= tv && t < at('house')) || (t >= at('diary') && t < at('roles')) ? '7.5%' : '10.5%';
      if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; }
    } else subEl.style.opacity = 0;

    tagAt($('#rn-tag-sh'), shooter, cam, win(t, at('fire') + 0.25, at('diary') - 0.05, 0.15));
    show('#rd-dim', win(t, at('diary'), at('roles'), 0.12) * 0.3 + win(t, tv, at('house'), 0.15) * 0.85 + win(t, at('ranks'), at('cta'), 0.15) * 0.6);
    slam($('#rn-d1'), t, at('diary') + 0.1, at('roles') - 0.05, 1.3, -4);
    slam($('#rn-d2'), t, at('diary') + 1.3, at('roles') - 0.05, 1.3, 4);

    // montáž rolí
    const m = [...montage].reverse().find((q) => t >= q.t);
    const inMont = m && t < at('xp');
    show('#rn-role', inMont ? 1 : 0);
    if (inMont && $('#rn-role').dataset.r !== m.role + m.s.handle) {
      $('#rn-role').dataset.r = m.role + m.s.handle;
      const r = role(m.role);
      $('#rn-role .n').textContent = (r?.name || m.role).toUpperCase();
      $('#rn-role .d').innerHTML = `@${m.s.handle} <span class="c">· ${short(m.s.faction)}</span>`;
    }
    if (inMont) $('#rn-role').style.transform = `translateY(${(1 - easeOut(clamp01((t - m.t) / 0.2))) * 30}px)`;

    // zkušenosti: stupně se rozsvěcují s hlasem
    show('#rn-xp', win(t, at('xp') + 0.1, at('aid') - 0.05, 0.15));
    root.querySelectorAll('#rn-xp .step').forEach((el, i) => el.classList.toggle('on', t > at('xp') + C.len('xp') * (0.45 + i * 0.14)));
    tagAt($('#rn-tag-me'), me, cam, win(t, at('xp') + 0.2, at('aid') - 0.05, 0.15) + win(t, at('house') + 0.2, at('ranks') - 0.05, 0.15));
    tagAt($('#rn-tag-aid'), hosp, cam, win(t, at('aid') + 0.3, tf - 0.05, 0.15), 52);

    // klik na směrovku (kurzor dojede, ťukne, kamera přeletí)
    const cur = $('#rn-cursor'), p = nav();
    if (p && t > tf + 0.5 * L && t < tf + 0.95 * L) {
      const r = p.getBoundingClientRect();
      const u = easeOut(clamp01((t - tf - 0.5 * L) / (0.25 * L)));
      cur.style.left = `${cam.w / 2 + (r.left + r.width / 2 - cam.w / 2) * u}px`;
      cur.style.top = `${cam.h * 0.62 + (r.top + r.height / 2 - cam.h * 0.62) * u}px`;
      cur.style.opacity = 1;
      cur.style.transform = `translate(-50%, -50%) scale(${t > tf + 0.78 * L && t < tf + 0.84 * L ? 0.7 : 1})`;
      const rp = $('#rn-ripple'), ru = clamp01((t - tf - 0.8 * L) / 0.45);
      rp.style.left = cur.style.left; rp.style.top = cur.style.top;
      rp.style.opacity = t > tf + 0.8 * L ? 1 - ru : 0;
      rp.style.transform = `translate(-50%, -50%) scale(${1 + ru * 2.5})`;
    } else { cur.style.opacity = 0; $('#rn-ripple').style.opacity = 0; }

    const v = $('#rn-vote');
    const vu = easeOut(clamp01((t - tv) / 0.45));
    v.style.opacity = t < tv || t > at('house') ? 0 : Math.min(1, vu * 2, (at('house') - t) / 0.15);
    v.style.transform = `rotate(${(1 - vu) * -9}deg) scale(${0.7 + 0.3 * vu})`;
    const opts = tv + C.len('vote') * 0.5;
    root.querySelectorAll('#rn-vote .hl').forEach((el, i) => {
      const a = opts + i * (C.len('vote') * 0.17);
      el.style.opacity = t > a && t < at('house') ? 1 : 0;
    });
    slam($('#rn-house'), t, at('house') + 0.15, at('ranks') - 0.05, 1.25, -3);
    show('#rn-ranks', win(t, at('ranks') + 0.1, at('cta') - 0.05, 0.15));
    root.querySelectorAll('#rn-ranks li').forEach((el, i) => (el.style.opacity = t > at('ranks') + 0.4 + i * 0.2 ? 1 : 0));
  }

  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
