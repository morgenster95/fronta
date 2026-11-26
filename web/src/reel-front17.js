// Day reel Day 17 (26. 11. 2026, noviny 26. 11. 13:00 UTC; /?reel=front17&vacant=700, jen vývojový server), na výšku, do minuty.
// Uživatel 26. 11.: krátké statistiky, příběh hráče, který drží nejdéle naživu, podle logů, nové filmové scény, někde se střílí.
// Hrdina: Cyril „Doc“ Zaboravljeni (zaboravljeninemanjic, Hegemonie, puškař, První vlna, 4 medaile) podle jeho deníku.
// Stavba: titulek dne přes záběr hrdiny na mapě (úvodní snímek je každý den jiný) → ztráty → nemocnice → signing → hit → promo → duel → Cyril na mapě → počty → výzva.
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, slam, clamp01, win, easeOut, tagAt, dayTitle } from './reel-kit.js';
import { makeFight } from './fight-fx.js';
import { loadImage } from './assets.js';
// rekvizity z PixelLabu (art/cine/prop_*.png, zmenšené podle skutečné velikosti: tools/fit-props.py, pravidla měřítka v CLAUDE.md)
import tableSrc from '../../art/cine/prop_recruit_table.png';
import boardSrc from '../../art/cine/prop_notice_board.png';
import medSrc from '../../art/cine/prop_medic_box.png';
import cratesSrc from '../../art/cine/prop_ammo_crates.png';
import lanternSrc from '../../art/cine/prop_lantern_post.png';
import script from '../../marketing/reels/front17.script.json';
import D from '../../marketing/reels/front17.data.json';

const files = import.meta.glob('../../marketing/reels/front17.vo.json', { eager: true, import: 'default' });

const CSS = `${BASE}${FX_CSS}
.f17-panel { position: absolute; left: 7%; right: 7%; background: rgba(14,13,12,0.93); border: 3px solid #524a3f; padding: 14px 16px; opacity: 0; }
.f17-panel .t { font-family: 'Silkscreen', monospace; font-size: 20px; color: #d98f3f; text-align: center; letter-spacing: 0.08em; margin-bottom: 8px; }
.f17-panel .row { display: flex; justify-content: space-between; align-items: baseline; font-family: 'Silkscreen', monospace; font-size: 22px; margin: 4px 0; color: #e3d9c3; }
.f17-panel .row b { font-size: 36px; font-weight: 400; } .f17-panel .row b.r { color: #c8553d; }
.f17-panel .note { font-family: 'VT323', monospace; font-size: 28px; color: #c9b99a; text-align: center; margin-top: 8px; }
#f17-fell { top: 10%; border-color: #a33b2b; } #f17-hosp { top: 14%; border-color: #e3d9c3; }
.f17-tag { position: absolute; transform: translate(-50%, -100%); font-family: 'Silkscreen', monospace; font-size: 22px; max-width: 480px; text-align: center; padding: 6px 12px; background: rgba(14,13,12,0.92); border: 3px solid #c8553d; color: #e3d9c3; opacity: 0; }
.f17-tag small { display: block; font-family: 'VT323', monospace; font-size: 26px; color: #c9b99a; }
#f17-hero { transform: translate(-50%, 0); }
#f17-big { position: absolute; left: 0; right: 0; top: 26%; text-align: center; font-family: 'Silkscreen', monospace; color: #e3d9c3; text-shadow: 6px 6px 0 #0e0d0c; opacity: 0; }
#f17-big .k { font-size: 30px; letter-spacing: 0.12em; color: #c9b99a; } #f17-big b { display: block; font-size: 120px; font-weight: 400; color: #c9c26a; line-height: 1; } #f17-big .p { font-size: 34px; color: #d98f3f; margin-top: 10px; }
#f17-side { position: absolute; left: 0; right: 0; top: 58%; text-align: center; font-family: 'Silkscreen', monospace; opacity: 0; }
#f17-side span { display: inline-block; padding: 10px 18px; background: rgba(14,13,12,0.92); border: 3px solid #8a9295; font-size: 30px; color: #e3d9c3; } #f17-side span b { font-weight: 400; font-size: 50px; margin-left: 10px; }
#f17-cta { position: absolute; left: 6%; right: 6%; top: 46%; text-align: center; background: rgba(14,13,12,0.94); border: 4px solid #d98f3f; padding: 16px; opacity: 0; }
#f17-cta .big { font-family: 'Silkscreen', monospace; font-size: 40px; color: #d98f3f; line-height: 1.15; } #f17-cta .sm { font-family: 'VT323', monospace; font-size: 30px; color: #e3d9c3; margin-top: 6px; }
#f17-cta .url { font-family: 'Silkscreen', monospace; font-size: 24px; color: #e3d9c3; margin-top: 10px; border-top: 2px solid #524a3f; padding-top: 10px; }
`;

export async function startDay17Reel({ cam, map, soldiers, tex, anims }) {
  let vo = files['../../marketing/reels/front17.vo.json'];
  if (!vo) {
    let c = 0;
    vo = { lines: script.lines.map(([at, text, id]) => { const s = Math.max(at, c), d = text.length / 15 + 0.2; c = s + d + 0.25; return [s, d, text, id]; }) };
    vo.seconds = c + 2.4;
  }
  const C = cues(vo);
  const END = vo.seconds;
  const tt = Object.fromEntries(script.lines.map((l) => [l[2], C.at(l[2])]));
  const T = map.tile, mid = ((map.front[0] + map.front[1]) / 2) * T;
  const front = (f) => soldiers.filter((s) => s.faction === f && s.slot?.line === 'front' && !s.vacant).sort((a, b) => a.x - b.x);
  const fH = front(0), fC = front(1);
  const hRef = fH[Math.floor(fH.length * 0.55)] || soldiers[0];
  const fy = fH.length ? Math.max(...fH.map((q) => q.y)) : hRef.y; // přední linie Hegemonie (kamera na hustý zákop)
  const hero = soldiers.find((s) => s.handle === D.hero.handle && s.slot);
  const posOf = (q) => (q?.sprite ? { x: q.sprite.x, y: q.sprite.y } : q);
  const site = window.__front?.hospitals?.sites?.filter((s) => s.faction === 0).sort((a, b) => b.beds.length - a.beds.length)[0];
  const duelEnd = tt.medals;
  const K = [[0, hRef.x - 40, fy - 30, 1.6, 'cut'], [tt.fell - 0.01, hRef.x + 40, fy - 30, 1.65], [tt.fell, hRef.x - 60, fy - 30, 1.5, 'cut'], [tt.hosp - 0.01, hRef.x + 160, fy - 30, 1.55]];
  if (site) K.push([tt.hosp, site.x - 70, site.y - 10, 3.3, 'cut'], [tt.sign - 0.01, site.x + 70, site.y - 10, 3.3]); // zoom nad 3,2: střecha zmizí a vidět jsou lůžka s raněnými
  else K.push([tt.hosp, hRef.x, hRef.y, 1.4, 'cut'], [tt.sign - 0.01, hRef.x, hRef.y, 1.4]);
  const pan = (l) => [l[Math.floor(l.length * 0.08)] || l[0], l[Math.floor(l.length * 0.92)] || l.at(-1)];
  if (fH.length) { const [a, b] = pan(fH); K.push([tt.army, a.x, a.y - 20, 1.6, 'cut'], [tt.army + 3.2, b.x, b.y - 20, 1.6]); }
  if (fC.length) { const [a, b] = pan(fC); K.push([tt.army + 3.2, a.x, a.y - 20, 1.6, 'cut'], [tt.cta - 0.01, b.x, b.y - 20, 1.6]); }
  if (hero) { const hp = posOf(hero); const sx0 = hp.x - 6, sy0 = hp.y - 400; K.push([tt.sign, sx0 + 8, sy0 - 6, 4.0, 'cut'], [tt.hit, hp.x, hp.y + 32, 4.2, 'cut'], [tt.promo, hp.x + 10, hp.y - 8, 5.0, 'cut'], [tt.duel, hp.x, hp.y + 34, 4.0, 'cut'], [tt.medals - 0.01, hp.x, hp.y + 34, 4.0]); }
  K.push([tt.cta, hRef.x, fy + 20, 2.0, 'cut'], [END, hRef.x + 60, fy + 30, 2.1]);
  const camAt = camPath(K.sort((p, q) => p[0] - q[0]));
  const spots = [[0, tt.fell, hero, 4.2, 44], [tt.medals, tt.army, hero, 4.8, 44]].filter((x) => x[2]); // úvodní záběr pod titulkem = hrdina dne (každý den jiný, ať feed nemá stejné náhledy)
  const spotAt = (t) => spots.find(([a, b]) => t >= a && t < b);
  const sub = subtitles(vo);
  const fx = transitions([[tt.fell, 'black', 0.4], [tt.hosp, 'whip'], [tt.sign, 'black', 0.4], [tt.hit, 'black', 0.4], [tt.promo, 'black', 0.4], [tt.duel, 'black', 0.3], [duelEnd, 'flash'], [tt.army, 'whip'], [tt.cta, 'black', 0.4]].sort((x, y) => x[0] - y[0]));
  const SFX = [[tt.day, 'drum', 0], [tt.fell, 'drum', 0], [tt.hit + 2.4, 'drum', 0], [tt.hit + 3.2, 'drum', 0], [tt.duel + 2.4, 'drum', 0], [tt.duel + 3.4, 'drum', 0], [tt.duel + 5.6, 'drum', 0], [tt.duel + 6.3, 'drum', 0], [tt.cta, 'drum', 0], [END - 1.3, 'end', 0]];

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  root.innerHTML = `
    <div id="f17-fell" class="f17-panel"><div class="t">DAY ${D.label} · CASUALTIES</div><div class="row"><span>HEGEMONY</span><b class="r">${D.fell[0]} FELL</b></div><div class="row"><span>CONCORD</span><b class="r">${D.fell[1]} FELL</b></div></div>
    <div id="f17-hosp" class="f17-panel"><div class="t">THE FIELD HOSPITAL</div><div class="row"><span>WOUNDED</span><b class="r">${D.wounded}</b></div><div class="row"><span>BEDS FROM TOMORROW</span><b>${D.beds}</b></div></div>
    ${hero ? `<div id="f17-hero" class="f17-tag">★ ${D.hero.name.toUpperCase()}<small>@${D.hero.handle}<br>${D.hero.note}</small></div><div id="f17-hero2" class="f17-tag">${D.hero.name.toUpperCase()}<small>${D.hero.wounds} wounds · ${D.hero.medals} medals · sector ${D.hero.sector}</small></div>` : ''}
    <div id="f17-doc" class="f17-tag">CYRIL "DOC"</div>
    <div id="f17-big"><div class="k">ON THE FRONT NOW</div><b>0</b><div class="p">+${D.joined[0] + D.joined[1]} yesterday</div></div>
    <div id="f17-side"><span></span></div>
    <div id="f17-cta"><div class="big">PICK A SIDE<br>HEGEMONY or CONCORD</div><div class="sm">comment it on any post<br>and your soldier joins the line</div><div class="url">mudandiron.app</div></div>
    <div id="rd-big"></div>
    <div id="rd-sub"></div>
  `;
  document.body.appendChild(root);
  const paint = fxLayers(root);
  const day = dayTitle(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };

  // ---- scény přímo na mapě hry (uživatel 26. 11.: kreslená „hlína“ nevypadá jako fronta): skutečné zákopy, drát, krátery, sousední vojáci ----
  const fight = await makeFight({ anims, soldiers, tex });
  const cvs = async (src) => { const im = await loadImage(src); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im, 0, 0); return c; };
  const tableC = await cvs(tableSrc), boardC = await cvs(boardSrc), medC = await cvs(medSrc), cratesC = await cvs(cratesSrc), lanternC = await cvs(lanternSrc);
  const posterC = (() => { // nástěnka s plakátem FIRST WAVE (barvy Hegemonie: ocel a rez), nápis ručním pixelovým písmem 3×5 na PixelLab nástěnce
    const G = { F: '111100110100100', I: '111010010010111', R: '110101110101101', S: '011100010001110', T: '111010010010010', W: '101101101111101', A: '010101111101101', V: '101101101101010', E: '111100110100111' };
    const c = document.createElement('canvas'); c.width = boardC.width; c.height = boardC.height; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    g.drawImage(boardC, 0, 0);
    const px = 4, py = 3, w = c.width - 8, h = 19;
    g.fillStyle = '#0e0d0c'; g.fillRect(px - 1, py - 1, w + 2, h + 2); g.fillStyle = '#c4b8a0'; g.fillRect(px, py, w, h);
    g.fillStyle = '#7e3b2a'; g.fillRect(px, py, w, 8);
    const word = (txt, x0, y0, col) => { g.fillStyle = col; [...txt].forEach((ch, i) => { const bits = G[ch]; for (let k = 0; k < 15; k++) if (bits[k] === '1') g.fillRect(x0 + i * 4 + (k % 3), y0 + Math.floor(k / 3), 1, 1); }); };
    word('FIRST', px + Math.round((w - 19) / 2), py + 1, '#e3d9c3'); word('WAVE', px + Math.round((w - 15) / 2), py + 10, '#3d3730');
    return c;
  })();
  const chevC = (() => { const c = document.createElement('canvas'); c.width = 10; c.height = 13; const g = c.getContext('2d'); g.fillStyle = '#0e0d0c'; g.fillRect(0, 0, 10, 13); g.fillStyle = '#e3d9c3'; g.fillRect(1, 1, 8, 11);
    g.fillStyle = '#d98f3f'; for (const y of [3, 7]) { g.fillRect(2, y + 2, 6, 1); g.fillRect(3, y + 1, 4, 1); g.fillRect(4, y, 2, 1); } return c; })();
  const H0 = hero ? posOf(hero) : { x: hRef.x, y: hRef.y }, cx = H0.x, cy = H0.y;
  const sx = cx - 6, sy = cy - 400; // zázemí (náborová stanice) mezi podpůrnou a záložní linií
  const tS = tt.sign, tH = tt.hit, tP = tt.promo, tD = tt.duel, tM = tt.medals;
  const prop = (c, x, y, from, to, rise = null) => fight.prop({ canvas: c, from, to, pos: (t) => [x, y - c.height / 2 - (rise ? rise(t) : 0)] });
  if (hero) {
    fight.puppet({ x: -9999, y: -9999, from: tS, to: tM, keys: [], hide: hero }); // skutečný Cyril ustoupí hercům po celou dobu příběhu
    // 1) Den 1: nábor
    prop(tableC, sx + 16, sy + 4, tS, tH); prop(posterC, sx + 50, sy + 6, tS, tH); prop(cratesC, sx + 74, sy + 2, tS, tH); prop(lanternC, sx - 34, sy - 6, tS, tH);
    fight.puppet({ x: sx + 16, y: sy - 4, from: tS, to: tH, keys: [{ t0: tS, key: 'hegemony_officer', dir: 'south' }] });
    fight.puppet({ x: sx - 60, y: sy + 10, from: tS, to: tH, keys: [{ t0: tS, key: 'hegemony', anim: 'walk', dir: 'east', fps: 7, loop: true, move: [sx - 4, sy + 10, 3.2] }, { t0: tS + 3.4, key: 'hegemony', anim: 'salute', dir: 'east', fps: 7 }] });
    // 2) Den 11: raid. Raider přijde k drátu, Cyril střílí, je zasažen a padne, raider odejde, medik přijde a obvazuje
    fight.puppet({ x: cx, y: cy, from: tH, to: tP, keys: [{ t0: tH, key: 'hegemony', dir: 'south' }, { t0: tH + 1.0, key: 'hegemony', anim: 'fire', dir: 'south', fps: 8, loop: true }, { t0: tH + 3.2, key: 'hegemony', anim: 'fall', dir: 'south', fps: 8 }, { t0: tH + 4.3, key: 'hegemony', anim: 'lying-wounded', dir: 'east', fps: 1 }] });
    fight.puppet({ x: cx - 12, y: cy + 112, from: tH, to: tH + 6.2, keys: [{ t0: tH, key: 'concord', anim: 'walk', dir: 'north', fps: 6, loop: true, move: [cx - 12, cy + 62, 2.2] }, { t0: tH + 2.2, key: 'concord', anim: 'fire', dir: 'north', fps: 8, loop: true }, { t0: tH + 3.9, key: 'concord', anim: 'walk', dir: 'south', fps: 6, loop: true, move: [cx - 12, cy + 120, 2.3] }] });
    fight.puppet({ x: cx - 70, y: cy + 4, from: tH + 4.4, to: tP, keys: [{ t0: tH + 4.4, key: 'hegemony_medic', anim: 'walk', dir: 'east', fps: 7, loop: true, move: [cx - 16, cy + 4, 3.3] }, { t0: tH + 7.7, key: 'hegemony_medic', anim: 'bandage', dir: 'east', fps: 6, loop: true }] });
    prop(medC, cx + 16, cy + 6, tH + 4.4, tP);
    // 3) Den 16: povýšení. Důstojník předá rozkaz, Cyril zasalutuje, nad rozkazem naskočí stuhy
    fight.puppet({ x: cx, y: cy, from: tP, to: tD, keys: [{ t0: tP, key: 'hegemony', dir: 'south' }, { t0: tP + 1.2, key: 'hegemony', anim: 'salute', dir: 'east', fps: 7 }] });
    fight.puppet({ x: cx + 22, y: cy, from: tP, to: tD, keys: [{ t0: tP, key: 'hegemony_officer', dir: 'west' }] });
    prop(chevC, cx + 11, cy - 22, tP + 0.5, tD, (t) => Math.min(6, (t - tP - 0.5) * 8));
    // 4) Den 17: dva nepřátelé jdou k drátu vedle sebe, každý klekne, vymění si s Cyrilem střely a padne; Cyril drží pozici
    fight.puppet({ x: cx, y: cy, from: tD, to: tM, keys: [{ t0: tD, key: 'hegemony', dir: 'south' }, { t0: tD + 0.8, key: 'hegemony', anim: 'fire', dir: 'south', fps: 8, loop: true }] });
    const foe = (x, tKneel, tFire, tDie) => fight.puppet({ x, y: cy + 112, from: tD, to: tM, keys: [{ t0: tD, key: 'concord', anim: 'walk', dir: 'north', fps: 6, loop: true, move: [x, cy + 64, tKneel] }, { t0: tD + tKneel, key: 'concord', anim: 'kneel', dir: 'north', fps: 8 }, { t0: tD + tFire, key: 'concord', anim: 'fire', dir: 'north', fps: 8, loop: true }, { t0: tD + tDie, key: 'concord', anim: 'die', dir: 'north', fps: 8 }] });
    foe(cx - 26, 2.0, 2.7, 3.7); foe(cx + 26, 2.2, 3.3, 5.0);
  }

  // reflektor (pravidlo uživatele 23. 11.): představovaný voják musí být celý vidět; okolí se skryje (běží těsně před vykreslením)
  let hidden = [];
  window.__reelPost = (t) => {
    for (const o of hidden) o.visible = true;
    hidden = [];
    const F = spotAt(t)?.[2];
    if (!F) return;
    const hide = (o) => { if (o && o.visible) { o.visible = false; hidden.push(o); } };
    const P = posOf(F);
    for (const q of soldiers) {
      if (q === F || !q.sprite) continue;
      const Q = posOf(q), dx = Q.x - P.x, dy = Q.y - P.y;
      if (Math.abs(dx) < 26 && dy > -44 && dy < 34) { hide(q.sprite); hide(q.dogSprite); }
    }
    const fr = window.__front;
    for (const pb of fr?.orderFx?.pillboxes || []) if (Math.abs(pb.s.x - P.x) < 60 && Math.abs(pb.s.y - P.y) < 60) { hide(pb.s); hide(pb.fl); }
    hide(fr?.orderFx?.flash);
    for (const pl of fr?.planeFx?.planes || []) { hide(pl.body); hide(pl.shadow); }
  };

  function frame(t) {
    const f = fx(t);
    let [x, y, z] = camAt(t);
    const S = spotAt(t);
    if (S) { const p = posOf(S[2]); x = p.x; y = p.y - S[4]; z = S[3]; } // hrdina níž než střed (střed zakrývá titulek dne)
    cam.set(x, y, z * (1 + 0.05 * f.punch));
    for (const q of soldiers) if (q.sprite && q.vacant && q.sprite.alpha < 1) q.sprite.alpha = 1; // žádní duchové
    fight.update(t);
    const film = t >= tt.sign && t < tt.medals; // scény na mapě: titulky nahoře (postavy uprostřed)
    paint({ ...f, black: Math.max(f.black, t > END - 0.6 ? clamp01((t - END + 0.6) / 0.5) : 0) }, 0);
    day(t, { n: D.label, sub: 'THE LAST MAN FROM DAY ONE', from: 0.2, to: tt.fell - 0.1, subAt: 1.0 });
    slam($('#f17-fell'), t, tt.fell + 0.5, tt.hosp - 0.05, 1.3, -2);
    slam($('#f17-hosp'), t, tt.hosp + 0.4, tt.sign - 0.05, 1.3, -2);
    if (hero) {
      tagAt($('#f17-hero'), { x: posOf(hero).x, y: posOf(hero).y + 10 }, cam, t < tt.fell ? win(t, 0.0, tt.fell - 0.05, 0.12) : 0, 0); // pod hrdinou (střed obrazu zabírá titulek dne)
      tagAt($('#f17-hero2'), { x: posOf(hero).x, y: posOf(hero).y - 30 }, cam, win(t, tt.medals + 0.2, tt.army - 0.05, 0.12), 0);
    }
    if (hero) tagAt($('#f17-doc'), { x: cx, y: cy - 34 }, cam, (t >= tH && t < tM) ? 0.95 : 0, 0);
    show('#f17-big', t >= tt.army && t < tt.cta ? 1 : 0);
    $('#f17-big b').textContent = Math.round((D.army[0] + D.army[1]) * easeOut(clamp01((t - tt.army) / 1.2))).toLocaleString('en-US');
    const split = tt.army + 3.2;
    const side = t >= tt.army + 1.2 && t < tt.cta ? (t < split ? 0 : 1) : -1;
    show('#f17-side', side >= 0 ? 1 : 0);
    if (side >= 0) $('#f17-side span').innerHTML = `${side ? 'CONCORD' : 'HEGEMONY'}<b>${D.army[side].toLocaleString('en-US')}</b>`;
    slam($('#f17-cta'), t, tt.cta + 0.2, END - 1.3, 1.25, -2);
    const logo = t >= END - 1.3;
    const bigEl = $('#rd-big');
    bigEl.style.opacity = logo ? Math.min(1, (t - END + 1.3) / 0.3) : 0;
    if (logo && !bigEl.dataset.on) { bigEl.dataset.on = 1; bigEl.className = 'logo'; bigEl.innerHTML = '<span>MUD <i>&amp;</i> IRON</span><span>@mudandiron · mudandiron.app</span>'; }
    const s = sub(t), subEl = $('#rd-sub');
    if (s && !logo && t >= tt.fell) {
      subEl.style.opacity = 1;
      const top = film ? '7%' : null; // v obrazech jsou postavy dole → titulky nahoru
      subEl.style.top = top || 'auto'; subEl.style.bottom = top ? 'auto' : '11%';
      if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; }
    } else subEl.style.opacity = 0;
  }
  window.__reel = { seconds: END, sfx: SFX, frame, ready: true, tt };
}
