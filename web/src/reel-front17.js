// Day reel Day 17 (26. 11. 2026, noviny 26. 11. 13:00 UTC; /?reel=front17&vacant=700, jen vývojový server), na výšku, do minuty.
// Uživatel 26. 11.: krátké statistiky, příběh hráče, který drží nejdéle naživu, podle logů, nové filmové scény, někde se střílí.
// Hrdina: Cyril „Doc“ Zaboravljeni (zaboravljeninemanjic, Hegemonie, puškař, První vlna, 4 medaile) podle jeho deníku.
// Stavba: titulek dne → ztráty → nemocnice (30 lůžek, na mapě) → Cyril na mapě (reflektor) → signing → portrait → call → duel (+ Cyril na mapě) → počty → výzva.
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, slam, clamp01, win, easeOut, tagAt, dayTitle } from './reel-kit.js';
import { makeDay17Scenes } from './cinema-d17.js';
import script from '../../marketing/reels/front17.script.json';
import D from '../../marketing/reels/front17.data.json';

const files = import.meta.glob('../../marketing/reels/front17.vo.json', { eager: true, import: 'default' });

const CSS = `${BASE}${FX_CSS}
#f17-art { position: absolute; inset: 0; width: 100%; height: 100%; image-rendering: pixelated; object-fit: cover; opacity: 0; }
.f17-panel { position: absolute; left: 7%; right: 7%; background: rgba(14,13,12,0.93); border: 3px solid #524a3f; padding: 14px 16px; opacity: 0; }
.f17-panel .t { font-family: 'Silkscreen', monospace; font-size: 20px; color: #d98f3f; text-align: center; letter-spacing: 0.08em; margin-bottom: 8px; }
.f17-panel .row { display: flex; justify-content: space-between; align-items: baseline; font-family: 'Silkscreen', monospace; font-size: 22px; margin: 4px 0; color: #e3d9c3; }
.f17-panel .row b { font-size: 36px; font-weight: 400; } .f17-panel .row b.r { color: #c8553d; }
.f17-panel .note { font-family: 'VT323', monospace; font-size: 28px; color: #c9b99a; text-align: center; margin-top: 8px; }
#f17-fell { top: 10%; border-color: #a33b2b; } #f17-hosp { top: 14%; border-color: #e3d9c3; }
.f17-tag { position: absolute; transform: translate(-50%, -100%); font-family: 'Silkscreen', monospace; font-size: 22px; max-width: 480px; text-align: center; padding: 6px 12px; background: rgba(14,13,12,0.92); border: 3px solid #c8553d; color: #e3d9c3; opacity: 0; }
.f17-tag small { display: block; font-family: 'VT323', monospace; font-size: 26px; color: #c9b99a; }
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
  const duelEnd = tt.duel + 4.9; // do konce filmové scény střelby, pak Cyril na mapě
  const K = [[0, hRef.x - 40, fy - 30, 1.6, 'cut'], [tt.fell - 0.01, hRef.x + 40, fy - 30, 1.65], [tt.fell, hRef.x - 60, fy - 30, 1.5, 'cut'], [tt.hosp - 0.01, hRef.x + 160, fy - 30, 1.55]];
  if (site) K.push([tt.hosp, site.x - 70, site.y - 10, 3.3, 'cut'], [tt.hero - 0.01, site.x + 70, site.y - 10, 3.3]); // zoom nad 3,2: střecha zmizí a vidět jsou lůžka s raněnými
  else K.push([tt.hosp, hRef.x, hRef.y, 1.4, 'cut'], [tt.hero - 0.01, hRef.x, hRef.y, 1.4]);
  const pan = (l) => [l[Math.floor(l.length * 0.08)] || l[0], l[Math.floor(l.length * 0.92)] || l.at(-1)];
  if (fH.length) { const [a, b] = pan(fH); K.push([tt.army, a.x, a.y - 20, 1.6, 'cut'], [tt.army + 3.2, b.x, b.y - 20, 1.6]); }
  if (fC.length) { const [a, b] = pan(fC); K.push([tt.army + 3.2, a.x, a.y - 20, 1.6, 'cut'], [tt.cta - 0.01, b.x, b.y - 20, 1.6]); }
  K.push([tt.cta, hRef.x, fy + 20, 2.0, 'cut'], [END, hRef.x + 60, fy + 30, 2.1]);
  const camAt = camPath(K.sort((p, q) => p[0] - q[0]));
  const spots = [[tt.hero, tt.sign, hero, 4.8], [duelEnd, tt.army, hero, 4.8]].filter((x) => x[2]);
  const spotAt = (t) => spots.find(([a, b]) => t >= a && t < b);
  const sub = subtitles(vo);
  const fx = transitions([[tt.fell, 'black', 0.4], [tt.hosp, 'whip'], [tt.hero, 'whip'], [tt.sign, 'black', 0.4], [tt.portrait, 'black', 0.4], [tt.call, 'black', 0.4], [tt.duel, 'black', 0.3], [duelEnd, 'flash'], [tt.army, 'whip'], [tt.cta, 'black', 0.4]].sort((x, y) => x[0] - y[0]));
  const SFX = [[tt.day, 'drum', 0], [tt.fell, 'drum', 0], [tt.hero, 'drum', 0], [tt.duel + 0.5, 'drum', 0], [tt.duel + 0.9, 'drum', 0], [tt.duel + 2.5, 'drum', 0], [tt.cta, 'drum', 0], [END - 1.3, 'end', 0]];

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
  const sc = await makeDay17Scenes(tex, anims);
  sc.canvas.id = 'f17-art'; root.prepend(sc.canvas);

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
    if (S) { const p = posOf(S[2]); x = p.x; y = p.y - 16; z = S[3]; }
    cam.set(x, y, z * (1 + 0.05 * f.punch));
    for (const q of soldiers) if (q.sprite && q.vacant && q.sprite.alpha < 1) q.sprite.alpha = 1; // žádní duchové
    const film = t >= tt.sign && t < tt.portrait ? ['signing', t - tt.sign]
      : t >= tt.portrait && t < tt.call ? ['portrait', t - tt.portrait]
      : t >= tt.call && t < tt.duel ? ['call', t - tt.call]
      : t >= tt.duel && t < duelEnd ? ['duel', t - tt.duel] : null;
    if (film) sc.draw(film[0], film[1]);
    show('#f17-art', film ? 1 : 0);
    paint({ ...f, black: Math.max(f.black, t > END - 0.6 ? clamp01((t - END + 0.6) / 0.5) : 0) }, 0);
    day(t, { n: D.label, sub: 'THE LAST MAN FROM DAY ONE', from: 0.2, to: tt.fell - 0.1, subAt: 1.0 });
    slam($('#f17-fell'), t, tt.fell + 0.5, tt.hosp - 0.05, 1.3, -2);
    slam($('#f17-hosp'), t, tt.hosp + 0.4, tt.hero - 0.05, 1.3, -2);
    if (hero) {
      tagAt($('#f17-hero'), { x: posOf(hero).x, y: posOf(hero).y - 30 }, cam, win(t, tt.hero + 0.3, tt.sign - 0.05, 0.12), 0);
      tagAt($('#f17-hero2'), { x: posOf(hero).x, y: posOf(hero).y - 30 }, cam, win(t, duelEnd + 0.2, tt.army - 0.05, 0.12), 0);
    }
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
  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
