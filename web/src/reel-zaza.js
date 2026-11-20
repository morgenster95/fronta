// Akviziční reel „This family has died 4 times in my game“ (20. 11. 2026; /?reel=zaza&vacant=700, jen vývojový server), na výšku, trial reel:
// rod Zaza (@tf.is.zaza, Concord) drží stanoviště R-F21; za 4 dny tam padli 4 muži (Yann, Albin, Emil, Karel), dva z nich zabil tentýž nepřítel.
// Ve hře: smrt každého na tom samém místě (puppet 'die' / noční raid z fight-fx), počítadlo křížů nahoře; Karel = kreslená scéna iniciál
// (web/src/cinema-stories.js 'initials', E.Z. → K.Z.); nakonec skutečný 5. voják Dietrich (medik). Hlas: marketing/reels/zaza.script.json.
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, slam, clamp01, win, tagAt } from './reel-kit.js';
import { makeFight } from './fight-fx.js';
import { makeStoryScenes } from './cinema-stories.js';
import script from '../../marketing/reels/zaza.script.json';

const files = import.meta.glob('../../marketing/reels/zaza.vo.json', { eager: true, import: 'default' });

const CSS = `${BASE}${FX_CSS}
#rz-film { inset: 0; width: 100%; height: 100%; image-rendering: pixelated; opacity: 0; }
#rz-hook { left: 5%; right: 5%; top: 9%; text-align: center; font-family: 'Silkscreen', monospace; color: #e3d9c3; text-shadow: 5px 5px 0 #0e0d0c; background: rgba(14,13,12,0.78); padding: 12px 8px 16px; border-top: 3px solid #a33b2b; border-bottom: 3px solid #a33b2b; }
#rz-hook .a { font-size: 34px; letter-spacing: 0.06em; } #rz-hook .b { font-size: 62px; color: #c8553d; line-height: 1.05; } #rz-hook .c { font-size: 34px; }
#rz-cross { left: 0; right: 0; top: 23%; text-align: center; font-family: 'Silkscreen', monospace; font-size: 64px; color: #c8553d; text-shadow: 4px 4px 0 #0e0d0c; letter-spacing: 0.25em; opacity: 0; }
#rz-cross i { font-style: normal; color: #3d3730; }
.rz-tag { position: absolute; transform: translate(-50%, -100%); font-family: 'Silkscreen', monospace; font-size: 26px; padding: 6px 12px; background: rgba(14,13,12,0.92); border: 3px solid #a33b2b; white-space: nowrap; text-shadow: 2px 2px 0 #0e0d0c; opacity: 0; text-align: center; color: #e3d9c3; }
.rz-tag small { display: block; font-family: 'VT323', monospace; font-size: 28px; color: #c8553d; }
.rz-tag.gold { border-color: #d98f3f; } .rz-tag.gold small { color: #d98f3f; }
#rz-post { left: 0; right: 0; top: 64%; text-align: center; font-family: 'Silkscreen', monospace; font-size: 30px; color: #e3d9c3; text-shadow: 3px 3px 0 #0e0d0c; opacity: 0; }
#rz-cta { left: 6%; right: 6%; top: 58%; text-align: center; background: rgba(14,13,12,0.94); border: 4px solid #d98f3f; padding: 16px; opacity: 0; }
#rz-cta .big { font-family: 'Silkscreen', monospace; font-size: 38px; color: #d98f3f; line-height: 1.15; }
#rz-cta .sm { font-family: 'VT323', monospace; font-size: 32px; color: #e3d9c3; margin-top: 6px; }
#rz-cta .url { font-family: 'Silkscreen', monospace; font-size: 32px; color: #e3d9c3; margin-top: 10px; border-top: 2px solid #524a3f; padding-top: 10px; }
#rz-night { inset: 0; background: rgba(40, 46, 90, 0.4); mix-blend-mode: multiply; opacity: 0; }
`;

export async function startZazaReel({ cam, life, map, soldiers, tex, anims }) {
  let vo = files['../../marketing/reels/zaza.vo.json'];
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
  const z = by('tf.is.zaza') || soldiers.find((s) => s.faction === 1 && !s.vacant);
  const mid = ((map.front[0] + map.front[1]) / 2) * T;
  const fight = await makeFight({ anims, soldiers, tex });
  const K0 = tt.karel + 6.6; // po vyřezání iniciál zpátky do hry, Karel padne
  // smrti na stejném místě: Yann (stojí, padne), Albin (přijde, padne), Emil (noční raid), Karel (stojí, padne); mezi tím skutečný voják skrytý
  fight.puppet({ x: z.x, y: z.y, from: tt.hook, to: tt.albin, hide: z, keys: [{ t0: tt.hook, key: 'concord_medic', dir: 'north' }, { t0: tt.yann + 3.4, key: 'concord', anim: 'die', dir: 'west', fps: 8 }] });
  fight.puppet({ x: z.x + 70, y: z.y, from: tt.albin, to: tt.emil, hide: z, keys: [{ t0: tt.albin, key: 'concord', anim: 'walk', dir: 'west', fps: 9, loop: true, move: [z.x, z.y, 1.4] }, { t0: tt.albin + 1.4, key: 'concord', dir: 'north' }, { t0: tt.albin + 2.6, key: 'concord', anim: 'die', dir: 'west', fps: 8 }] });
  const raid = fight.scene({ at: tt.emil, defender: z, side: 0, end: tt.karel });
  fight.puppet({ x: z.x, y: z.y, from: K0 - 0.5, to: tt.dietrich, hide: z, keys: [{ t0: K0 - 0.5, key: 'concord', dir: 'north' }, { t0: K0 + 0.4, key: 'concord', anim: 'die', dir: 'west', fps: 8 }] });

  const K = [[0, z.x, z.y - 18, 5.0], [tt.real - 0.01, z.x, z.y - 18, 5.4], [tt.real, z.x, z.y - 18, 5.4], [tt.yann - 0.01, z.x, mid, 0.9, 'ease']];
  K.push([tt.yann, z.x, z.y - 18, 5.2, 'cut'], [tt.albin - 0.01, z.x, z.y - 18, 5.6], [tt.albin, z.x + 20, z.y - 18, 4.8, 'cut'], [tt.emil - 0.01, z.x, z.y - 18, 5.4]);
  K.push([tt.emil, z.x, z.y - 18, 5.6, 'cut'], [tt.karel - 0.01, z.x, z.y - 18, 6.0], [tt.karel, z.x, z.y - 18, 5.4, 'cut'], [tt.dietrich - 0.01, z.x, z.y - 18, 5.8]);
  K.push([tt.dietrich, z.x, z.y - 18, 4.6, 'cut'], [tt.cta - 0.01, z.x, z.y - 18, 5.4], [tt.cta, z.x, mid, 1.0, 'cut'], [END, z.x + 120, mid, 1.05]);
  const camAt = camPath(K);
  const sub = subtitles(vo);
  const fx = transitions([[tt.yann, 'black', 0.3], [tt.albin, 'black', 0.4], [tt.emil, 'black', 0.4], [tt.karel, 'black', 0.4], [K0 - 0.5, 'black', 0.3], [tt.dietrich, 'flash'], [tt.cta, 'black', 0.4]]);
  const deaths = [tt.yann + 3.4, tt.albin + 2.6, raid?.kill ?? tt.emil + 2, K0 + 0.4];
  // střelci (skuteční hráči Hegemonie naproti přes zemi nikoho): střih na ně těsně před každou smrtí, pak zpátky na stanoviště
  const shooters = [
    { h: 'chamra_universal', key: 'hegemony_machinegunner', d: deaths[0], what: 'MACHINE GUN' },
    { h: 'angelogia55', key: 'hegemony_machinegunner', d: deaths[1], what: 'MACHINE GUN' },
    { h: 'saam_1z', key: 'hegemony', d: deaths[3], what: 'RIFLE' },
  ].map((o) => ({ ...o, s: by(o.h) })).filter((o) => o.s);
  for (const o of shooters) {
    o.t0 = o.d - 1.5; o.t1 = o.d - 0.12;
    fight.puppet({ x: o.s.x, y: o.s.y, from: o.t0, to: o.t1, hide: o.s, keys: [{ t0: o.t0, key: o.key, anim: 'fire', dir: 'south', fps: 12, loop: true }] });
  }
  const shotAt = (t) => shooters.find((o) => t >= o.t0 && t < o.t1);
  // sousedé na stanovišti R-F21 se během příběhu skryjí, ať je vidět jen rod Zaza
  const near = soldiers.filter((q) => q !== z && Math.abs(q.x - z.x) < 40 && Math.abs(q.y - z.y) < 30);
  const SFX = [[tt.hook, 'drum', 0], [deaths[0] - 0.1, 'shoot', 0], [deaths[1] - 0.2, 'shoot', 0], [deaths[3] - 0.2, 'shoot', 0], [tt.dietrich, 'drum', 0], [tt.cta, 'drum', 0], [END - 1.3, 'end', 0]];
  if (raid?.hit) SFX.push([+raid.hit.toFixed(2), 'stamp', 0]);
  for (const o of shooters) for (let k = 0; k < (o.what === 'RIFLE' ? 1 : 4); k++) SFX.push([+(o.t0 + 0.5 + k * 0.18).toFixed(2), 'shoot', 0]);

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  root.innerHTML = `
    <div id="rz-night"></div>
    <div id="rz-hook"><div class="a">THIS FAMILY HAS</div><div class="b">DIED 4 TIMES</div><div class="c">IN MY GAME</div></div>
    <div id="rz-cross"></div>
    <div id="rz-post">POST R-F21 · CONCORD</div>
    <div id="rz-y" class="rz-tag">YANN "BRICK" ZAZA ✝<small>medic · day 8 · shot by @chamra_universal</small></div>
    <div id="rz-a" class="rz-tag">ALBIN "SAINT" ZAZA ✝<small>day 9 · lasted 1 day · @angelogia55</small></div>
    <div id="rz-e" class="rz-tag">EMIL "BUTTON" ZAZA ✝<small>day 10 · night raid · @chamra_universal AGAIN</small></div>
    <div id="rz-k" class="rz-tag">KAREL ZAZA ✝<small>day 11 · killed on watch · @saam_1z</small></div>
    <div id="rz-sh" class="rz-tag"><span></span><small></small></div>
    <div id="rz-d" class="rz-tag gold">DIETRICH ZAZA · THE 5TH<small>@tf.is.zaza · medic · alive</small></div>
    <div id="rz-cta"><div class="big">YOUR COMMENT<br>BECOMES A SOLDIER</div><div class="sm">comment HEGEMONY or CONCORD on @mudandiron</div><div class="url">mudandiron.app</div></div>
    <div id="rd-big"></div>
    <div id="rd-sub"></div>
  `;
  document.body.appendChild(root);
  const st = makeStoryScenes(tex, anims);
  st.canvas.id = 'rz-film';
  root.prepend(st.canvas);
  const paint = fxLayers(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };

  function frame(t) {
    const f = fx(t);
    fight.update(t);
    for (const q of soldiers) if (q.vacant && q.sprite && q.sprite.alpha < 1) { q.sprite.alpha = 1; q.sprite.tint = [0xffffff, 0xf0ece4, 0xe6e2da, 0xfff4e8][q.variant % 4]; } // žádní duchové
    const sh = shotAt(t);
    const [x, y, zz] = sh ? [sh.s.x, sh.s.y - 18, 5.4] : camAt(t);
    for (const q of near) if (q.sprite) q.sprite.visible = !(t >= tt.yann && t < tt.dietrich);
    if (z.sprite) z.sprite.visible = t >= tt.dietrich; // skutečný voják (Dietrich) až na konci; předtím jen herci rodu (fight.hide se u více úseků přepisoval)
    if (sh && !sh.fired && t > sh.t0 + 0.5) { sh.fired = true; life.debug.shoot?.([sh.s]); }
    cam.set(x, y, zz);
    const film = t >= tt.karel && t < K0 - 0.5;
    if (film) st.draw('initials', t - tt.karel, { old: 'EZ', new: 'KZ' });
    show('#rz-film', film ? 1 : 0);
    show('#rz-night', t >= tt.emil && t < tt.karel ? 1 : 0);
    paint({ ...f, black: Math.max(f.black, t > END - 0.6 ? clamp01((t - END + 0.6) / 0.5) : 0) });
    const hk = $('#rz-hook');
    hk.style.opacity = t < tt.real - 0.05 ? 1 : 0;
    hk.style.transform = `scale(${1 + 0.1 * clamp01(1 - t / 0.25)})`;
    // počítadlo: kříž za každou smrt (od háčku ukazuje všechny 4, pak se plní znovu)
    const n = t < tt.yann ? 4 : deaths.filter((d) => t >= d).length;
    show('#rz-cross', t < tt.dietrich && !film ? 1 : 0);
    $('#rz-cross').innerHTML = '✝'.repeat(n) + `<i>${'✝'.repeat(4 - n)}</i>`;
    show('#rz-post', win(t, tt.real + 0.2, tt.yann - 0.05, 0.2));
    tagAt($('#rz-y'), { x: z.x, y: z.y + 50 }, cam, win(t, deaths[0] + 0.3, tt.albin - 0.05, 0.15), 0);
    tagAt($('#rz-a'), { x: z.x, y: z.y + 50 }, cam, win(t, deaths[1] + 0.3, tt.emil - 0.05, 0.15), 0);
    tagAt($('#rz-e'), { x: z.x, y: z.y + 50 }, cam, win(t, deaths[2] + 0.3, tt.karel - 0.05, 0.15), 0);
    tagAt($('#rz-k'), { x: z.x, y: z.y + 50 }, cam, win(t, deaths[3] + 0.3, tt.dietrich - 0.05, 0.15), 0);
    const shEl = $('#rz-sh');
    if (sh) { shEl.querySelector('span').textContent = `@${sh.h}`; shEl.querySelector('small').textContent = `Hegemony · ${sh.what}`; }
    tagAt(shEl, sh ? { x: sh.s.x, y: sh.s.y + 50 } : { x: 0, y: 0 }, cam, sh ? win(t, sh.t0 + 0.1, sh.t1 - 0.02, 0.1) : 0, 0);
    tagAt($('#rz-d'), { x: z.x, y: z.y + 50 }, cam, win(t, tt.dietrich + 0.3, tt.cta - 0.05, 0.15), 0);
    slam($('#rz-cta'), t, tt.cta + 0.3, END - 1.4, 1.3, -3);
    const logo = t >= END - 1.3;
    const bigEl = $('#rd-big');
    bigEl.style.opacity = logo ? Math.min(1, (t - END + 1.3) / 0.3) : 0;
    if (logo && !bigEl.dataset.on) { bigEl.dataset.on = 1; bigEl.className = 'logo'; bigEl.innerHTML = '<span>MUD <i>&amp;</i> IRON</span><span>@mudandiron · mudandiron.app</span>'; }
    const s = sub(t);
    const subEl = $('#rd-sub');
    if (s && !logo && t >= tt.real) { subEl.style.opacity = 1; subEl.style.top = '13%'; if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; } } else subEl.style.opacity = 0;
  }

  window.__reel = { seconds: END, sfx: SFX, frame, ready: true, dbg: { deaths, tt } };
}
