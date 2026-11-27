// Day reel Day 18 (27. 11. 2026, noviny 27. 11. 13:00 UTC; /?reel=front18&vacant=700, jen vývojový server), na výšku, ~90 s.
// Uživatel 27. 11.: pěkný příběh, pěkné scény, správné barvy a měřítko, žádné opakující se nesmyslné animace, žádní duchové ani zbylé výstřely.
// Hrdina: Karel Hier (winters_ist_hier, Concord, kaplan, pastýř z Port Abel, Officers' Mess, pes Sparky) podle deníku.
// Příběh: lůžko → pastvina (domov) → mezera u V-F11 → notes s kresbou → kaplan → raid (lopata) → lůžko, stužka, pes → dopis. Pak ztráty, nemocnice, závod, počty, výzva.
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, slam, clamp01, win, easeOut, tagAt, dayTitle, typed } from './reel-kit.js';
import { makeDay18Scenes } from './cinema-d18.js';
import { makeFight } from './fight-fx.js';
import { loadImage } from './assets.js';
// rekvizity z PixelLabu (art/cine/prop_*.png, zmenšené podle skutečné velikosti: tools/fit-props.py)
import tableSrc from '../../art/cine/prop_recruit_table.png';
import lanternSrc from '../../art/cine/prop_lantern_post.png';
import cratesSrc from '../../art/cine/prop_ammo_crates.png';
import script from '../../marketing/reels/front18.script.json';
import D from '../../marketing/reels/front18.data.json';

const files = import.meta.glob('../../marketing/reels/front18.vo.json', { eager: true, import: 'default' });

const CSS = `${BASE}${FX_CSS}
#f18-art { position: absolute; inset: 0; width: 100%; height: 100%; image-rendering: pixelated; object-fit: cover; opacity: 0; }
.f18-panel { position: absolute; left: 7%; right: 7%; background: rgba(14,13,12,0.93); border: 3px solid #524a3f; padding: 14px 16px; opacity: 0; }
.f18-panel .t { font-family: 'Silkscreen', monospace; font-size: 20px; color: #d98f3f; text-align: center; letter-spacing: 0.08em; margin-bottom: 8px; }
.f18-panel .row { display: flex; justify-content: space-between; align-items: baseline; font-family: 'Silkscreen', monospace; font-size: 22px; margin: 4px 0; color: #e3d9c3; }
.f18-panel .row b { font-size: 36px; font-weight: 400; } .f18-panel .row b.r { color: #c8553d; } .f18-panel .row b.g { color: #c9c26a; }
.f18-panel .note { font-family: 'VT323', monospace; font-size: 28px; color: #c9b99a; text-align: center; margin-top: 8px; }
#f18-fell { top: 10%; border-color: #a33b2b; } #f18-hosp { top: 10%; border-color: #c9c26a; } #f18-race { top: 10%; border-color: #8a9295; }
.f18-tag { position: absolute; transform: translate(-50%, -100%); font-family: 'Silkscreen', monospace; font-size: 22px; max-width: 480px; text-align: center; padding: 6px 12px; background: rgba(14,13,12,0.92); border: 3px solid #c8553d; color: #e3d9c3; opacity: 0; }
.f18-tag small { display: block; font-family: 'VT323', monospace; font-size: 26px; color: #c9b99a; }
#f18-hero { transform: translate(-50%, 0); } #f18-friend { border-color: #c9c26a; }
#f18-cap { position: absolute; left: 0; right: 0; top: 15%; text-align: center; font-family: 'Silkscreen', monospace; font-size: 28px; letter-spacing: 0.1em; color: #e3d9c3; text-shadow: 4px 4px 0 #0e0d0c; opacity: 0; }
#f18-cap small { display: block; font-family: 'VT323', monospace; font-size: 34px; letter-spacing: 0.04em; color: #d98f3f; }
.f18-card { position: absolute; left: 7%; right: 7%; background: rgba(14,13,12,0.94); border: 4px solid #d98f3f; padding: 14px 18px; opacity: 0; text-align: center; }
.f18-card .k { font-family: 'Silkscreen', monospace; font-size: 24px; color: #d98f3f; letter-spacing: 0.08em; } .f18-card .b { font-family: 'VT323', monospace; font-size: 36px; color: #e3d9c3; margin-top: 6px; line-height: 1.12; } .f18-card .n { font-family: 'Silkscreen', monospace; font-size: 22px; color: #c9c26a; margin-top: 8px; }
#f18-letter { top: 7%; border-color: #c4b8a0; } #f18-bonds { top: 8%; }
#f18-big { position: absolute; left: 0; right: 0; top: 26%; text-align: center; font-family: 'Silkscreen', monospace; color: #e3d9c3; text-shadow: 6px 6px 0 #0e0d0c; opacity: 0; }
#f18-big .k { font-size: 30px; letter-spacing: 0.12em; color: #c9b99a; } #f18-big b { display: block; font-size: 120px; font-weight: 400; color: #c9c26a; line-height: 1; } #f18-big .p { font-size: 34px; color: #d98f3f; margin-top: 10px; }
#f18-side { position: absolute; left: 0; right: 0; top: 58%; text-align: center; font-family: 'Silkscreen', monospace; opacity: 0; }
#f18-side span { display: inline-block; padding: 10px 18px; background: rgba(14,13,12,0.92); border: 3px solid #8a9295; font-size: 30px; color: #e3d9c3; } #f18-side span b { font-weight: 400; font-size: 50px; margin-left: 10px; }
#f18-cta { position: absolute; left: 6%; right: 6%; top: 46%; text-align: center; background: rgba(14,13,12,0.94); border: 4px solid #d98f3f; padding: 16px; opacity: 0; }
#f18-cta .big { font-family: 'Silkscreen', monospace; font-size: 40px; color: #d98f3f; line-height: 1.15; } #f18-cta .sm { font-family: 'VT323', monospace; font-size: 30px; color: #e3d9c3; margin-top: 6px; }
#f18-cta .url { font-family: 'Silkscreen', monospace; font-size: 24px; color: #e3d9c3; margin-top: 10px; border-top: 2px solid #524a3f; padding-top: 10px; }
`;

export async function startDay18Reel({ cam, map, soldiers, tex, anims }) {
  let vo = files['../../marketing/reels/front18.vo.json'];
  if (!vo) {
    let c = 0;
    vo = { lines: script.lines.map(([at, text, id]) => { const s = Math.max(at, c), d = text.length / 15 + 0.2; c = s + d + 0.25; return [s, d, text, id]; }) };
    vo.seconds = c + 2.4;
  }
  const C = cues(vo);
  const END = vo.seconds;
  const tt = Object.fromEntries(script.lines.map((l) => [l[2], C.at(l[2])]));
  const T = map.tile;
  const front = (f) => soldiers.filter((s) => s.faction === f && s.slot?.line === 'front' && !s.vacant).sort((a, b) => a.x - b.x);
  const fH = front(0), fC = front(1);
  const hRef = fC[Math.floor(fC.length * 0.55)] || soldiers[0];
  const fy = fC.length ? Math.max(...fC.map((q) => q.y)) : hRef.y;
  const hero = soldiers.find((s) => s.handle === D.hero.handle && s.sprite);
  const friend = soldiers.find((s) => s.handle === D.hero.friend && s.sprite);
  const posOf = (q) => (q?.sprite ? { x: q.sprite.x, y: q.sprite.y } : q);
  const hs = hero?.slot || friend?.slot || { x: hRef.x, y: hRef.y }; // Karlovo stanoviště na frontě (V-F11); skutečný Karel leží v nemocnici
  const nb = soldiers.filter((s) => s.faction === 1 && s.slot?.line === 'front' && s.sprite && !s.vacant && s !== hero && Math.hypot(s.x - hs.x, s.y - hs.y) < 90).sort((a, b) => Math.hypot(a.x - hs.x, a.y - hs.y) - Math.hypot(b.x - hs.x, b.y - hs.y));
  const gp = { x: hs.x, y: hs.y };
  const site = window.__front?.hospitals?.sites?.filter((s) => s.faction === 1).sort((a, b) => b.beds.length - a.beds.length)[0];
  const K = [[0, hRef.x - 40, fy - 30, 1.6, 'cut']];
  if (site) K.push([tt.fell - 0.01, site.x - 70, site.y - 10, 3.3, 'cut'], [tt.race - 0.01, site.x + 70, site.y - 10, 3.3]); // zoom nad 3,2: střecha zmizí a vidět jsou lůžka s raněnými
  else K.push([tt.fell, hRef.x, hRef.y, 1.4, 'cut'], [tt.race - 0.01, hRef.x, hRef.y, 1.4]);
  K.push([tt.gap, gp.x, gp.y - 70, 4.0, 'cut'], [tt.draw - 0.01, gp.x, gp.y - 75, 4.0]);
  K.push([tt.chap, gp.x + 10, gp.y + 316, 4.0, 'cut'], [tt.raid - 0.01, gp.x + 30, gp.y + 316, 4.0]);
  K.push([tt.raid, gp.x, gp.y - 20, 4.0, 'cut'], [tt.bed - 0.01, gp.x, gp.y - 20, 4.0]);
  const pan = (l) => [l[Math.floor(l.length * 0.18)] || l[0], l[Math.floor(l.length * 0.82)] || l.at(-1)];
  if (fH.length) { const [a, b] = pan(fH); K.push([tt.army, a.x, a.y - 60, 1.6, 'cut'], [tt.army + 3.0, b.x, b.y - 60, 1.6]); }
  if (fC.length) { const [a, b] = pan(fC); K.push([tt.army + 3.0, a.x, a.y - 60, 1.6, 'cut'], [tt.cta - 0.01, b.x, b.y - 60, 1.6]); }
  K.push([tt.cta, hRef.x, fy + 20, 2.0, 'cut'], [END, hRef.x + 60, fy + 30, 2.1]);
  const spots = [[0, tt.sheep, hero, 4.2, 44], [tt.bed, tt.letter, hero, 4.4, 14]].filter((x) => x[2]); // úvodní záběr pod titulkem = hrdina dne na lůžku; a znovu u příběhu stužky a psa
  const spotAt = (t) => spots.find(([a, b]) => t >= a && t < b);
  const camAt = camPath(K.sort((p, q) => p[0] - q[0]));
  const sub = subtitles(vo);
  const fx = transitions([[tt.sheep, 'black', 0.4], [tt.gap, 'whip'], [tt.draw, 'black', 0.4], [tt.chap, 'black', 0.4], [tt.raid, 'black', 0.4], [tt.bed, 'flash'], [tt.letter, 'black', 0.4], [tt.fell, 'black', 0.4], [tt.race, 'whip'], [tt.army, 'whip'], [tt.cta, 'black', 0.4]].sort((x, y) => x[0] - y[0]));
  const SFX = [[tt.day, 'drum', 0], [tt.raid + 2.0, 'drum', 0], [tt.raid + 3.0, 'drum', 0], [tt.bonds, 'drum', 0], [tt.fell, 'drum', 0], [tt.cta, 'drum', 0], [END - 1.3, 'end', 0]];

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  root.innerHTML = `
    <div id="f18-fell" class="f18-panel"><div class="t">DAY ${D.label} · CASUALTIES</div><div class="row"><span>HEGEMONY</span><b class="r">${D.fell[0]} FELL</b></div><div class="row"><span>CONCORD</span><b class="r">${D.fell[1]} FELL</b></div><div class="note">rifles and machine guns</div></div>
    <div id="f18-hosp" class="f18-panel"><div class="t">DIED WAITING FOR CARE</div><div class="row"><span>YESTERDAY</span><b class="r">${D.nocareYesterday[0] + D.nocareYesterday[1]}</b></div><div class="row"><span>TODAY</span><b class="g">${D.nocare[0] + D.nocare[1]}</b></div><div class="note">38 beds in each hospital</div></div>
    <div id="f18-race" class="f18-panel"><div class="t">THE RACE FOR THE BONE QUARRY</div><div class="row"><span>HEGEMONY</span><b>${D.race[0]}</b></div><div class="row"><span>CONCORD</span><b>${D.race[1]}</b></div><div class="note">300 wins the heights</div></div>
    ${hero ? `<div id="f18-hero" class="f18-tag">★ ${D.hero.name.toUpperCase()}<small>${D.hero.note}</small></div><div id="f18-karel" class="f18-tag">KAREL HIER</div><div id="f18-sparky" class="f18-tag">SPARKY<small>Officers' Mess</small></div>` : ''}
    ${friend ? `<div id="f18-friend" class="f18-tag">BENEDIKT<small>his friend</small></div>` : ''}
    <div id="f18-cap"></div>
    <div id="f18-letter" class="f18-card"><div class="k">A LETTER FROM HOME</div><div class="b"></div></div>
    <div id="f18-bonds" class="f18-card"><div class="k">THE FRONT THANKS</div><div class="b">Karel Hier and Pavel Owl Hughesjack<br>bought War Bonds</div><div class="n">★ OFFICERS' MESS · A DOG NAMED SPARKY</div></div>
    <div id="f18-big"><div class="k">ON THE FRONT NOW</div><b>0</b><div class="p">+${D.joined[0] + D.joined[1]} yesterday</div></div>
    <div id="f18-side"><span></span></div>
    <div id="f18-cta"><div class="big">PICK A SIDE<br>HEGEMONY or CONCORD</div><div class="sm">comment it on any post<br>and your soldier joins the line</div><div class="url">mudandiron.app</div></div>
    <div id="rd-big"></div>
    <div id="rd-sub"></div>
  `;
  document.body.appendChild(root);
  const paint = fxLayers(root);
  const day = dayTitle(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };

  // ---- scény na mapě hry: skutečný zákop, drát, sousední vojáci ----
  const fight = await makeFight({ anims, soldiers, tex });
  const sc = await makeDay18Scenes(tex, anims);
  sc.canvas.id = 'f18-art'; root.prepend(sc.canvas);
  const tG = tt.gap, tC = tt.chap, tR = tt.raid;
  // Sparky (pes Karla Hiera, plemeno z deníku) sedí u lůžka: sprite psa ze hry (props/dog_<plemeno>_sit.png), postavou stejně velký jako ve hře
  const dogImg = await loadImage(`/assets/props/dog_shepherd_sit.png`).catch(() => null);
  const dogC = dogImg ? (() => { const c = document.createElement('canvas'); c.width = dogImg.width; c.height = dogImg.height; c.getContext('2d').drawImage(dogImg, 0, 0); return c; })() : null;
  const hp0 = hero ? posOf(hero) : null;
  if (dogC && hp0) fight.prop({ canvas: dogC, from: tt.bonds + 1.2, to: tt.letter, pos: () => [hp0.x + 26, hp0.y + 10 - dogC.height / 2 + 6] });
  const stand = nb.find((q) => q !== friend) || soldiers.find((s) => s.faction === 1); // soused v úseku V-F11: na dobu raidu zahraje Karla (skutečný Karel leží v nemocnici)
  const cx = stand ? stand.x : gp.x, cy = stand ? stand.y : gp.y;
  // 3) Den 10: Karel přijde zezadu zákopem a zastaví se v mezeře vedle souseda
  const gx = hs.x, gy = hs.y;
  fight.puppet({ x: gx, y: gy + 100, from: tG, to: tt.draw, keys: [{ t0: tG, key: 'concord', anim: 'walk', dir: 'north', fps: 6, loop: true, move: [gx, gy, 3.4] }, { t0: tG + 3.4, key: 'concord', dir: 'north' }] });
  // 4) Den 16: v zázemí od důstojníka dostane pásku kaplana a odchází jako kaplan
  const rx = gp.x, ry = gp.y + 330;
  const cvs = async (src) => { const im = await loadImage(src); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im, 0, 0); return c; };
  const tableC = await cvs(tableSrc), lanternC = await cvs(lanternSrc), cratesC = await cvs(cratesSrc);
  const band = (() => { const c = document.createElement('canvas'); c.width = 6; c.height = 3; const g = c.getContext('2d'); g.fillStyle = '#0e0d0c'; g.fillRect(0, 0, 6, 3); g.fillStyle = '#e3d9c3'; g.fillRect(1, 0, 4, 3); g.fillStyle = '#d98f3f'; g.fillRect(3, 0, 1, 3); g.fillRect(2, 1, 3, 1); return c; })();
  const prop = (c, x, y, from, to) => fight.prop({ canvas: c, from, to, pos: () => [x, y - c.height / 2] });
  prop(tableC, rx + 8, ry + 6, tC, tR); prop(lanternC, rx + 44, ry + 2, tC, tR); prop(cratesC, rx - 40, ry + 2, tC, tR);
  fight.prop({ canvas: band, from: tC + 3.0, to: tC + 4.6, pos: (t) => { const u = Math.min(1, (t - (tC + 3.0)) / 1.2); return [rx + 14 - 18 * u, ry - 15 - 2 * Math.sin(u * Math.PI)]; } });
  fight.puppet({ x: rx + 24, y: ry, from: tC, to: tR, keys: [{ t0: tC, key: 'concord_officer', dir: 'west' }] });
  fight.puppet({ x: rx - 60, y: ry, from: tC, to: tR, keys: [{ t0: tC, key: 'concord', anim: 'walk', dir: 'east', fps: 6, loop: true, move: [rx - 8, ry, 2.8] }, { t0: tC + 2.8, key: 'concord', anim: 'salute', dir: 'east', fps: 5 }, { t0: tC + 4.6, key: 'concord_chaplain', dir: 'east' }, { t0: tC + 5.6, key: 'concord_chaplain', anim: 'walk', dir: 'east', fps: 6, loop: true, move: [rx + 90, ry, 3.0] }] });
  // 5) Den 17: raid. Raider (Hegemonie) skočí do zákopu u V-F11, Karel (soused jako herec) dostane lopatou a padne; raider odejde
  const helmet = (() => { const c = document.createElement('canvas'); c.width = 8; c.height = 5; const g = c.getContext('2d'); g.fillStyle = '#0e0d0c'; g.fillRect(1, 0, 6, 1); g.fillRect(0, 1, 8, 4); g.fillStyle = '#8a9295'; g.fillRect(1, 1, 6, 1); g.fillRect(1, 2, 6, 2); g.fillStyle = '#666d70'; g.fillRect(2, 3, 5, 1); g.fillStyle = '#7e3b2a'; g.fillRect(1, 3, 6, 1); return c; })(); // helma Hegemonie (ocel, rezavý pruh), suvenýr z raidu
  if (stand) fight.prop({ canvas: helmet, from: tR + 3.0, to: tt.bed, pos: () => [cx + 10, cy + 2] });
  if (stand) fight.scene({ at: tR + 0.4, defender: stand, side: 0, end: tt.bed, win: 'hurt' });

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

  const CAPS = [[tt.sheep, tt.gap, 'PORT ABEL', 'two weeks before'], [tt.gap, tt.draw, 'DAY 10 · V-F11', 'the gap'], [tt.draw, tt.chap, 'DAY 13', 'two sheets of paper'], [tt.chap, tt.raid, 'DAY 16', 'the chaplain'], [tt.raid, tt.bed, 'DAY 17 · V-F11', 'night raid'], [tt.bed, tt.letter, 'DAY 18', 'a bed, this time'], [tt.letter, tt.fell, 'DAY 18 · MAIL', 'from the neighbor']];
  const LETTER = 'The fence is fixed.\nThe cow is fine.\nThe roof still leaks.';

  function frame(t) {
    const f = fx(t);
    let [x, y, z] = camAt(t);
    const S = spotAt(t);
    if (S) { const p = posOf(S[2]); x = p.x; y = p.y - S[4]; z = S[3]; } // hrdina níž než střed (střed zakrývá titulek dne)
    cam.set(x, y, z * (1 + 0.05 * f.punch));
    for (const q of soldiers) if (q.sprite && q.vacant && q.sprite.alpha < 1) q.sprite.alpha = 1; // žádní duchové
    fight.update(t);
    const film0 = t >= tt.sheep && t < tt.gap ? ['pasture', t - tt.sheep] : t >= tt.draw && t < tt.chap ? ['notebook', t - tt.draw] : t >= tt.letter && t < tt.fell ? ['farm', t - tt.letter] : null;
    if (film0) sc.draw(film0[0], film0[1]);
    show('#f18-art', film0 ? 1 : 0);
    const filmMap = t >= tt.gap && t < tt.bed && !film0; // scény na mapě: titulky nahoře (postavy uprostřed)
    paint({ ...f, black: Math.max(f.black, t > END - 0.6 ? clamp01((t - END + 0.6) / 0.5) : 0) }, 0);
    day(t, { n: D.label, sub: 'THE SHEPHERD', from: 0.2, to: tt.sheep - 0.1, subAt: 1.0 });
    const cap = CAPS.find(([a, b]) => t >= a + 0.2 && t < b - 0.2);
    const capEl = $('#f18-cap');
    if (cap) { if (capEl.dataset.text !== cap[2]) { capEl.dataset.text = cap[2]; capEl.innerHTML = `${cap[2]}<small>${cap[3]}</small>`; } capEl.style.opacity = win(t, cap[0] + 0.2, cap[1] - 0.2, 0.3); } else capEl.style.opacity = 0;
    slam($('#f18-fell'), t, tt.fell + 0.4, tt.hosp - 0.05, 1.3, -2);
    slam($('#f18-hosp'), t, tt.hosp + 0.4, tt.race - 0.05, 1.3, -2);
    slam($('#f18-race'), t, tt.race + 0.4, tt.army - 0.05, 1.3, -2);
    if (hero) tagAt($('#f18-hero'), { x: posOf(hero).x, y: posOf(hero).y + 10 }, cam, t < tt.sheep ? win(t, 0.0, tt.sheep - 0.05, 0.12) : (t >= tt.bed + 0.3 && t < tt.bonds ? win(t, tt.bed + 0.3, tt.bonds, 0.2) : 0), 0); // pod hrdinou (střed obrazu zabírá titulek dne)
    if (hero && stand) tagAt($('#f18-karel'), { x: t >= tR ? cx : gx, y: (t >= tR ? cy : gy) - 34 }, cam, ((t >= tG + 1.4 && t < tt.draw) || (t >= tR && t < tt.bed)) ? 0.95 : 0, 0);
    if (hero) tagAt($('#f18-sparky'), { x: posOf(hero).x + 26, y: posOf(hero).y - 6 }, cam, win(t, tt.bonds + 1.4, tt.letter - 0.3, 0.2) * 0.95, 0);
    if (friend) tagAt($('#f18-friend'), { x: posOf(friend).x, y: posOf(friend).y - 34 }, cam, t >= tG && t < tt.draw ? 0.9 : 0, 0);
    // karty: stužka a pes, dopis (píše se po znacích)
    slam($('#f18-bonds'), t, tt.bonds + 0.3, tt.letter - 0.3, 1.25, -2);
    if (t >= tt.letter + 0.5 && t < tt.fell - 0.2) { $('#f18-letter .b').innerHTML = typed(LETTER, t, tt.letter + 1.0, 20).replace(/\n/g, '<br>'); show('#f18-letter', 1); } else show('#f18-letter', 0);
    show('#f18-big', t >= tt.army && t < tt.cta ? 1 : 0);
    $('#f18-big b').textContent = Math.round((D.army[0] + D.army[1]) * easeOut(clamp01((t - tt.army) / 1.2))).toLocaleString('en-US');
    const split = tt.army + 3.0;
    const side = t >= tt.army + 1.2 && t < tt.cta ? (t < split ? 0 : 1) : -1;
    show('#f18-side', side >= 0 ? 1 : 0);
    if (side >= 0) $('#f18-side span').innerHTML = `${side ? 'CONCORD' : 'HEGEMONY'}<b>${D.army[side].toLocaleString('en-US')}</b>`;
    slam($('#f18-cta'), t, tt.cta + 0.2, END - 1.3, 1.25, -2);
    const logo = t >= END - 1.3;
    const bigEl = $('#rd-big');
    bigEl.style.opacity = logo ? Math.min(1, (t - END + 1.3) / 0.3) : 0;
    if (logo && !bigEl.dataset.on) { bigEl.dataset.on = 1; bigEl.className = 'logo'; bigEl.innerHTML = '<span>MUD <i>&amp;</i> IRON</span><span>@mudandiron · mudandiron.app</span>'; }
    const s = sub(t), subEl = $('#rd-sub');
    if (s && !logo && t >= tt.sheep) {
      subEl.style.opacity = 1;
      const top = (film0 && film0[0] !== 'farm') || (t >= tt.gap && t < tt.bed) ? '7%' : null; // v obrazech a na scénách s postavami uprostřed jsou titulky nahoře
      subEl.style.top = top || 'auto'; subEl.style.bottom = top ? 'auto' : '11%';
      if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; }
    } else subEl.style.opacity = 0;
  }
  window.__reel = { seconds: END, sfx: SFX, frame, ready: true, tt };
}
