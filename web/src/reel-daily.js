// Denní reel „co se stalo“ (/?reel=day<N>&vacant=700, jen vývojový server). Podklady ze skutečného stavu po tahu:
// node tools/day-reel.mjs → marketing/reels/day<N>.data.json + .script.json; hlas python marketing/story_vo.py day<N>.
// Záběry: noc nad hřebenem, střelec ze soupisky, počty raněných, obvaziště se skutečnými raněnými, výprava, hlasování.
import { makeCinema, CSS as BASE } from './reel-day1.js';
import { paperTexture, tornClip } from './paper.js';
import voteImg from '../../marketing/promo/vote_build_1.jpg';

const files = import.meta.glob('../../marketing/reels/day*.json', { eager: true, import: 'default' });
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const win = (t, a, b, f = 0.3) => clamp01(Math.min((t - a) / f, (b - t) / f));
const typed = (text, t, a, cps = 28) => text.slice(0, Math.max(0, Math.floor((t - a) * cps)));

const CSS = `${BASE}
#rd-count { left: 7%; right: 7%; top: 56%; }
#rd-count .side { display: grid; grid-template-columns: 1fr auto; align-items: baseline; margin: 8px 0 2px; font-family: 'Silkscreen', monospace; font-size: 22px; }
#rd-count .side b { font-weight: 400; font-size: 46px; line-height: 1; }
#rd-count ul { list-style: none; margin: 0; padding: 0; }
#rd-count li { font-size: 21px; opacity: 0; border-left: 3px solid #d98f3f; padding-left: 8px; margin: 2px 0; display: flex; justify-content: space-between; gap: 8px; }
#rd-count li span { color: #a39782; }
#rd-shot { left: 6%; right: 6%; top: 58%; }
#rd-shot .paper { --ink: #2a2118; --red: #7a2a1c; padding: 14px 16px 18px; color: var(--ink); background-size: 288px 288px; image-rendering: pixelated; font-size: 22px; }
#rd-shot .h { font-family: 'Silkscreen', monospace; font-size: 13px; border-bottom: 2px solid var(--ink); padding-bottom: 4px; margin-bottom: 8px; display: flex; justify-content: space-between; }
#rd-shot .who { font-family: 'Silkscreen', monospace; font-size: 24px; color: var(--red); margin: 2px 0; }
#rd-raid { left: 7%; right: 7%; top: 27%; text-align: center; }
#rd-raid img { width: 62%; image-rendering: pixelated; filter: drop-shadow(0 6px 0 rgba(0,0,0,0.6)); }
#rd-raid .title { font-family: 'Silkscreen', monospace; font-size: 26px; line-height: 1.1; margin: 6px 0; }
#rd-raid .kw { display: inline-block; font-family: 'Silkscreen', monospace; font-size: 30px; background: rgba(126, 59, 42, 0.95); padding: 4px 14px; margin-top: 8px; }
#rd-vote { left: 9%; right: 9%; top: 12%; }
#rd-vote img { width: 100%; image-rendering: pixelated; box-shadow: 0 8px 0 rgba(0,0,0,0.5), 0 16px 28px rgba(0,0,0,0.6); }
`;

export function startDailyReel({ name, cam, life, map, theme, soldiers, tex, anims, hospitals }) {
  const data = files[`../../marketing/reels/${name}.data.json`];
  const vo = files[`../../marketing/reels/${name}.vo.json`] || { seconds: data.seconds, lines: [] };
  const SECONDS = vo.seconds || data.seconds;
  const T = map.tile, t2 = data.t2;
  const short = (f) => theme.factions[f].name.replace(/^The /, '').toUpperCase();
  const roleName = (id) => theme.archetypes.find((a) => a.id === id)?.name || id;
  const byHandle = (h) => soldiers.find((s) => s.handle === h);
  const front = (f) => soldiers.filter((s) => s.faction === f && s.slot?.line === 'front').sort((a, b) => a.x - b.x);
  const hs = front(0), cs = front(1);
  const hx = hs[Math.floor(hs.length / 2)].x;
  const mid = ((map.front[0] + map.front[1]) / 2) * T + 16;
  const at = (s, z) => [s.x, s.y - 14 + 58 / z, z];

  const shooter = data.fire ? byHandle(data.fire.by.handle) : null;
  const site = hospitals?.sites.find((x) => x.faction === data.focus);
  const bedded = soldiers.filter((s) => s.faction === data.focus && s.hosp === 'bed');
  const hosp = site ? { x: site.x, y: site.y } : { x: hx, y: mid };
  const sh = shooter ?? cs[Math.floor(cs.length / 2)];
  const target = data.fire ? byHandle(data.fire.handle) : null;

  const K = [
    [0, hx - 200, mid, 1.3],
    [8.0, hx - 200, mid, 1.3],
    [8.6, ...at(sh, 3.6)],
    [12.6, sh.x + 20, at(sh, 3.8)[1], 3.8],
    [13.4, (sh.x + (target?.x ?? sh.x)) / 2, mid, 2.2],
    [17.0, hx, mid, 1.5],
    [23.4, hx + 140, mid - 30, 1.35],
    [24.4, hosp.x, hosp.y + 4, 3.6],
    [33.4, hosp.x + 10, hosp.y + 4, 4.0],
    [34.2, hx - 80, mid, 1.2],
    [SECONDS, hx + 260, mid, 1.3],
  ];
  function camAt(t) {
    let i = 0;
    while (i < K.length - 2 && t > K[i + 1][0]) i++;
    const [t0, x0, y0, z0] = K[i], [t1, x1, y1, z1] = K[i + 1];
    const u = ease(clamp01((t - t0) / Math.max(0.01, t1 - t0)));
    return [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, z0 + (z1 - z0) * u];
  }

  // titulky z hlasu (stejné dělení jako reel-day1)
  const SUB = [];
  for (const [t0, dur, text] of vo.lines) {
    const parts = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g).map((p) => p.trim());
    const chunks = [];
    for (const p of parts) {
      if (chunks.length && (chunks.at(-1).length < 14 || p.length < 12) && chunks.at(-1).length + p.length < 48) chunks[chunks.length - 1] += ' ' + p;
      else chunks.push(p);
    }
    const total = chunks.reduce((a, c) => a + c.length, 0);
    let s0 = t0;
    for (const c of chunks) {
      const d = (dur * c.length) / total;
      SUB.push([s0 - 0.05, s0 + d + 0.25, c]);
      s0 += d;
    }
  }
  const BIG = [
    [t2 + 7.2, SECONDS, 'MUD <i>&amp;</i> IRON\n@mudandiron · link in bio', 'logo'],
  ];
  const NIGHT = { flares: [[1.4, 50], [5.0, 120]], flashes: [], march: 8 };
  const DAWN = { flares: [[0.4, 110]], flashes: [], march: 9 };

  const EV = [[10.4, 'shootAt', sh], [11.6, 'shootAt', sh], [9.2, 'shoot', 0], [15.0, 'shoot', 1], [16.2, 'shoot', 0], [19.0, 'shoot', 1], [20.8, 'shoot', 0], [36.0, 'flare', hx, mid], [38.0, 'shoot', 0], [39.0, 'shoot', 1]];
  const SFX = [];
  for (const e of EV) if (e[1] === 'shoot' || e[1] === 'shootAt') SFX.push([e[0] + 0.62, 'shoot', 0]);
  SFX.push([0.9, 'type', 0.5], [3.0, 'type', 0.8], [13.6, 'stamp', 0], [17.6, 'reveal', 0], [24.2, 'bell', 0], [34.0, 'whistle', 0],
    [t2, 'drum', 0], [t2 + 3.6, 'drum', 0], [t2 + 7.2, 'end', 0]);

  // --- DOM ---
  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  const sevText = { light: 'GRAZED', heavy: 'BADLY WOUNDED', crit: 'GRAVELY WOUNDED' };
  const placeText = { bed: 'in a bed', stretcher: 'on a stretcher', trench: 'in the trench' };
  const list = (f) => data.hit[f].slice(0, 3).map((r) => `<li>@${r.handle}<span>${sevText[r.sev].toLowerCase()}</span></li>`).join('')
    + (data.hit[f].length > 3 ? `<li style="border:0">+ ${data.hit[f].length - 3} more<span></span></li>` : '');
  root.innerHTML = `
    <div id="rd-dim"></div>
    <div id="rd-black"></div>
    <div id="rd-day"><div class="big"></div><div class="sub"></div></div>
    <div id="rd-big"></div>
    <div id="rd-sub"></div>
    <div class="rd-tag" id="rd-tag-sh">@${data.fire?.by.handle ?? ''}<span>${data.fire ? `${short(data.fire.by.faction)} ${roleName(data.fire.by.role)}` : ''}</span></div>
    ${bedded.map((s, i) => `<div class="rd-tag" id="rd-bed${i}">@${s.handle}<span>${(sevText[s.sev] || '').toLowerCase()}</span></div>`).join('')}
    ${data.fire ? `<div id="rd-shot"><div class="paper" style="background-image:url(${paperTexture(5)});clip-path:${tornClip(5)}">
      <div class="h"><span>FIELD TELEGRAPH</span><span>DAY ${data.day}</span></div>
      <div class="who">@${data.fire.handle}</div>
      <div>${sevText[data.fire.sev]} · shot by @${data.fire.by.handle}</div>
      <div>now ${placeText[data.fire.place] || 'in the trench'}</div></div></div>` : ''}
    <div id="rd-count" class="panel"><span class="k">Day ${data.day} · the wounded</span>
      <div class="side" style="color:#a7b4bb"><span>HEGEMONY</span><b>0</b></div><ul>${list(0)}</ul>
      <div class="side" style="color:#c9c26a"><span>CONCORD</span><b>0</b></div><ul>${list(1)}</ul></div>
    ${data.raid ? `<div id="rd-raid"><img src="/assets/locations/church.png" alt=""><div class="title">VOLUNTEERS WANTED<br>${data.raid.short.toUpperCase()}</div>
      <div class="m">${data.raid.seats} per side · tonight</div><div class="kw">COMMENT ${data.raid.kw}</div></div>` : ''}
    <div id="rd-vote"><img src="${voteImg}" alt=""></div>
    <div id="rd-every"><span>EVERY MORNING · 13:00 UTC</span></div>
  `;
  document.body.appendChild(root);
  const cine = makeCinema(tex, anims);
  root.prepend(cine.canvas);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };

  const fired = new Set();
  function frame(t) {
    const [x, y, z] = camAt(t);
    cam.set(x, y, z);
    for (const [i, ev] of EV.entries()) {
      if (fired.has(i) || t < ev[0]) continue;
      fired.add(i);
      if (ev[1] === 'flare') life.flareAt(ev[2], ev[3]);
      if (ev[1] === 'shootAt' && ev[2]?.aim) life.debug.shoot([ev[2]]);
      if (ev[1] === 'shoot') {
        const pool = soldiers.filter((s) => s.faction === ev[2] && s.aim && !s.hosp && Math.abs(s.x - x) < 600 / z && Math.abs(s.y - y) < 900 / z);
        if (pool.length) life.debug.shoot([pool[Math.floor(Math.random() * pool.length)]]);
      }
    }
    // noc na začátku, úsvit na konci
    const night = t < 8.3, dawn = t >= t2 + 6.8;
    if (night) cine.draw(t, 'night', { ...NIGHT, pan: t * 5 });
    else if (dawn) cine.draw(t - t2 - 6.8, 'dawn', { ...DAWN, pan: (t - t2 - 6.8) * 4 });
    show('#rd-cine', night ? 1 : dawn ? clamp01((t - t2 - 6.8) / 0.6) : 0);
    show('#rd-black', t < 0.8 ? 1 - t / 0.8 : t > 7.8 && t < 9.0 ? 1 - Math.abs(t - 8.4) / 0.6 : t > SECONDS - 0.8 ? clamp01((t - SECONDS + 0.8) / 0.6) * 0.8 : 0);
    show('#rd-day', win(t, 0.8, 7.8, 0.4));
    $('#rd-day .big').textContent = typed(`DAY ${data.day}`, t, 0.9, 9);
    $('#rd-day .sub').textContent = t > 3.0 ? typed(data.silent ? 'THE GUNS ARE SILENT. THE RIFLES ARE NOT.' : 'THE GUNS SPOKE ALL NIGHT', t, 3.0, 24) : '';

    const b = BIG.find(([a, e]) => t >= a && t < e);
    const bigEl = $('#rd-big');
    if (b) {
      bigEl.style.opacity = win(t, b[0], b[1], 0.25);
      if (bigEl.dataset.text !== b[2]) { bigEl.dataset.text = b[2]; bigEl.className = b[3]; bigEl.innerHTML = b[2].split('\n').map((l) => `<span>${l}</span>`).join(''); }
    } else bigEl.style.opacity = 0;
    const s = SUB.find(([a, e]) => t >= a && t < e);
    const subEl = $('#rd-sub');
    if (s && !b && t > 8.0) {
      subEl.style.opacity = 1;
      subEl.style.top = t > t2 - 0.2 && t < t2 + 7 ? '3.5%' : '10.5%';
      if (subEl.dataset.text !== s[2]) { subEl.dataset.text = s[2]; subEl.innerHTML = `<span>${s[2]}</span>`; }
    } else subEl.style.opacity = 0;

    const tagAt = (el, who, o) => {
      if (!el || !who) return;
      el.style.left = `${(who.x - cam.x) * cam.zoom + cam.w / 2}px`;
      el.style.top = `${(who.y - 30 - cam.y) * cam.zoom + cam.h / 2}px`;
      el.style.opacity = o;
    };
    tagAt($('#rd-tag-sh'), shooter, win(t, 9.0, 12.8, 0.3));
    show('#rd-shot', win(t, 13.6, 17.2, 0.3));
    bedded.forEach((who, i) => tagAt($(`#rd-bed${i}`), who, win(t, 25.0 + i * 0.6, 33.4, 0.3)));

    show('#rd-count', win(t, 17.6, 23.6, 0.35));
    const cu = ease(clamp01((t - 17.8) / 1.6));
    root.querySelectorAll('#rd-count b').forEach((el, i) => (el.textContent = Math.round(data.hit[i].length * cu)));
    root.querySelectorAll('#rd-count li').forEach((el, i) => (el.style.opacity = t > 19.0 + i * 0.35 ? 1 : 0));

    show('#rd-dim', Math.max(win(t, 34.0, t2 + 7.0, 0.5) * 0.9, win(t, 13.6, 17.2, 0.3) * 0.4));
    show('#rd-raid', data.raid ? win(t, 34.2, t2 - 0.2, 0.4) : 0);
    const vu = clamp01((t - t2) / 0.8);
    $('#rd-vote').style.opacity = t < t2 || t > t2 + 7.0 ? 0 : Math.min(1, vu * 2, (t2 + 7.0 - t) / 0.4);
    $('#rd-vote').style.transform = `rotate(${(1 - ease(vu)) * -6}deg) scale(${0.9 + 0.1 * ease(vu)})`;
    show('#rd-every', win(t, 17.6, 23.6, 0.4));
  }

  window.__reel = { seconds: SECONDS, sfx: SFX, frame, ready: true };
}
