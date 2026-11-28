// Day reel Day 19 (28. 11. 2026, noviny 28. 11. 13:00 UTC; /?reel=front19&vacant=700, jen vývojový server), na výšku, ~100 s.
// Uživatel 28. 11.: pěkný příběh kohokoliv, kdo má dobrý. Hrdina: rod Acquillae (vis.acquillae, Hegemonie, medik, 6. generace, War Bonds, pes Toby): šest mužů na jednom stanovišti S-F10 za 18 dní.
// Příběh: úvod u stanoviště → nádraží (Edmund a stuha) → pět padlých na mapě → jeho komentář (box) → zemljanka (pes Toby) → dnes (zranění, stužka) → ztráty, nemocnice, závod, počty, výzva.
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, slam, clamp01, win, easeOut, tagAt, dayTitle, typed } from './reel-kit.js';
import { makeDay19Scenes } from './cinema-d19.js';
import { makeFight } from './fight-fx.js';
import { loadImage } from './assets.js';
// rekvizity z PixelLabu (art/cine/prop_*.png, zmenšené podle skutečné velikosti: tools/fit-props.py)
import tableSrc from '../../art/cine/prop_recruit_table.png';
import lanternSrc from '../../art/cine/prop_lantern_post.png';
import cratesSrc from '../../art/cine/prop_ammo_crates.png';
import script from '../../marketing/reels/front19.script.json';
import D from '../../marketing/reels/front19.data.json';

const files = import.meta.glob('../../marketing/reels/front19.vo.json', { eager: true, import: 'default' });

const CSS = `${BASE}${FX_CSS}
#f19-art { position: absolute; inset: 0; width: 100%; height: 100%; image-rendering: pixelated; object-fit: cover; opacity: 0; }
.f19-panel { position: absolute; left: 7%; right: 7%; background: rgba(14,13,12,0.93); border: 3px solid #524a3f; padding: 14px 16px; opacity: 0; }
.f19-panel .t { font-family: 'Silkscreen', monospace; font-size: 20px; color: #d98f3f; text-align: center; letter-spacing: 0.08em; margin-bottom: 8px; }
.f19-panel .row { display: flex; justify-content: space-between; align-items: baseline; font-family: 'Silkscreen', monospace; font-size: 22px; margin: 4px 0; color: #e3d9c3; }
.f19-panel .row b { font-size: 36px; font-weight: 400; } .f19-panel .row b.r { color: #c8553d; } .f19-panel .row b.g { color: #c9c26a; }
.f19-panel .note { font-family: 'VT323', monospace; font-size: 28px; color: #c9b99a; text-align: center; margin-top: 8px; }
#f19-fell { top: 10%; border-color: #a33b2b; } #f19-hosp { top: 10%; border-color: #c9c26a; } #f19-race { top: 10%; border-color: #8a9295; }
.f19-tag { position: absolute; transform: translate(-50%, -100%); font-family: 'Silkscreen', monospace; font-size: 22px; max-width: 480px; text-align: center; padding: 6px 12px; background: rgba(14,13,12,0.92); border: 3px solid #c8553d; color: #e3d9c3; opacity: 0; }
.f19-tag small { display: block; font-family: 'VT323', monospace; font-size: 26px; color: #c9b99a; }
#f19-hero { transform: translate(-50%, 0); } #f19-friend { border-color: #c9c26a; }
#f19-cap { position: absolute; left: 0; right: 0; top: 17%; text-align: center; font-family: 'Silkscreen', monospace; font-size: 28px; letter-spacing: 0.1em; color: #e3d9c3; text-shadow: 4px 4px 0 #0e0d0c; opacity: 0; }
#f19-cap small { display: block; font-family: 'VT323', monospace; font-size: 34px; letter-spacing: 0.04em; color: #d98f3f; }
.f19-card { position: absolute; left: 7%; right: 7%; background: rgba(14,13,12,0.94); border: 4px solid #d98f3f; padding: 14px 18px; opacity: 0; text-align: center; }
.f19-card .k { font-family: 'Silkscreen', monospace; font-size: 24px; color: #d98f3f; letter-spacing: 0.08em; } .f19-card .b { font-family: 'VT323', monospace; font-size: 36px; color: #e3d9c3; margin-top: 6px; line-height: 1.12; } .f19-card .n { font-family: 'Silkscreen', monospace; font-size: 22px; color: #c9c26a; margin-top: 8px; }
#f19-bonds { top: 8%; }
#f19-five { position: absolute; left: 7%; right: 7%; top: 7%; background: rgba(14,13,12,0.94); border: 4px solid #a33b2b; padding: 12px 16px; opacity: 0; }
#f19-five .t { font-family: 'Silkscreen', monospace; font-size: 22px; color: #d98f3f; text-align: center; letter-spacing: 0.08em; margin-bottom: 6px; }
#f19-five .r { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; font-family: 'Silkscreen', monospace; font-size: 22px; color: #e3d9c3; margin: 5px 0; opacity: 0; }
#f19-five .r span { flex: 0 0 auto; } #f19-five .r i { font-style: normal; font-family: 'VT323', monospace; font-size: 28px; color: #c9b99a; text-align: right; line-height: 1; } #f19-five .r b { font-weight: 400; color: #c8553d; margin-right: 10px; }
#f19-comment { position: absolute; left: 6%; right: 6%; top: 8%; background: rgba(14,13,12,0.96); border: 3px solid #524a3f; padding: 14px 16px; opacity: 0; display: flex; gap: 14px; }
#f19-comment .av { flex: 0 0 64px; height: 64px; border-radius: 50%; background: #4f5a63; border: 3px solid #a4542b; color: #e3d9c3; font-family: 'Silkscreen', monospace; font-size: 34px; display: flex; align-items: center; justify-content: center; }
#f19-comment .nm { font-family: 'Silkscreen', monospace; font-size: 22px; color: #e3d9c3; } #f19-comment .nm small { font-family: 'VT323', monospace; font-size: 26px; color: #8a9295; margin-left: 8px; }
#f19-comment .tx { font-family: 'VT323', monospace; font-size: 30px; color: #e3d9c3; line-height: 1.08; margin-top: 4px; } #f19-comment .lk { font-family: 'VT323', monospace; font-size: 28px; color: #c8553d; margin-top: 4px; }
#f19-big { position: absolute; left: 0; right: 0; top: 26%; text-align: center; font-family: 'Silkscreen', monospace; color: #e3d9c3; text-shadow: 6px 6px 0 #0e0d0c; opacity: 0; }
#f19-big .k { font-size: 30px; letter-spacing: 0.12em; color: #c9b99a; } #f19-big b { display: block; font-size: 120px; font-weight: 400; color: #c9c26a; line-height: 1; } #f19-big .p { font-size: 34px; color: #d98f3f; margin-top: 10px; }
#f19-side { position: absolute; left: 0; right: 0; top: 58%; text-align: center; font-family: 'Silkscreen', monospace; opacity: 0; }
#f19-side span { display: inline-block; padding: 10px 18px; background: rgba(14,13,12,0.92); border: 3px solid #8a9295; font-size: 30px; color: #e3d9c3; } #f19-side span b { font-weight: 400; font-size: 50px; margin-left: 10px; }
#f19-cta { position: absolute; left: 6%; right: 6%; top: 46%; text-align: center; background: rgba(14,13,12,0.94); border: 4px solid #d98f3f; padding: 16px; opacity: 0; }
#f19-cta .big { font-family: 'Silkscreen', monospace; font-size: 40px; color: #d98f3f; line-height: 1.15; } #f19-cta .sm { font-family: 'VT323', monospace; font-size: 30px; color: #e3d9c3; margin-top: 6px; }
#f19-cta .url { font-family: 'Silkscreen', monospace; font-size: 24px; color: #e3d9c3; margin-top: 10px; border-top: 2px solid #524a3f; padding-top: 10px; }
`;

export async function startDay19Reel({ cam, map, soldiers, tex, anims }) {
  let vo = files['../../marketing/reels/front19.vo.json'];
  if (!vo) {
    let c = 0;
    vo = { lines: script.lines.map(([at, text, id]) => { const s = Math.max(at, c), d = text.length / 15 + 0.2; c = s + d + 0.25; return [s, d, text, id]; }) };
    vo.seconds = c + 2.4;
  }
  const C = cues(vo);
  const END = vo.seconds;
  const tt = Object.fromEntries(script.lines.map((l) => [l[2], C.at(l[2])]));
  const front = (f) => soldiers.filter((s) => s.faction === f && s.slot?.line === 'front' && !s.vacant).sort((a, b) => a.x - b.x);
  const fH = front(0), fC = front(1);
  const hRef = fH[Math.floor(fH.length * 0.55)] || soldiers[0];
  const fy = fH.length ? Math.max(...fH.map((q) => q.y)) : hRef.y;
  const hero = soldiers.find((s) => s.handle === D.hero.handle && s.sprite);
  const posOf = (q) => (q?.sprite ? { x: q.sprite.x, y: q.sprite.y } : q);
  const hp = hero ? posOf(hero) : { x: hRef.x, y: hRef.y };
  const post = hero?.slot && hero.slot.x ? { x: hero.slot.x, y: hero.slot.y } : hp; // stanoviště S-F10 na frontě (kde stáli všichni z rodu)
  const site = window.__front?.hospitals?.sites?.filter((s) => s.faction === 0).sort((a, b) => b.beds.length - a.beds.length)[0];
  const K = [[0, post.x, post.y - 30, 3.6, 'cut']];
  K.push([tt.five, post.x, post.y - 40, 3.2, 'cut'], [tt.dog - 0.01, post.x, post.y - 40, 4.0], [tt.bonds, post.x, post.y - 40, 3.4, 'cut'], [tt.fell - 0.01, post.x, post.y - 40, 3.9]);
  if (site) K.push([tt.fell - 0.01, site.x - 70, site.y - 10, 3.3, 'cut'], [tt.army - 0.01, site.x + 70, site.y - 10, 3.3]);
  else K.push([tt.fell, hRef.x, hRef.y, 1.4, 'cut'], [tt.army - 0.01, hRef.x, hRef.y, 1.4]);
  const pan = (l) => [l[Math.floor(l.length * 0.18)] || l[0], l[Math.floor(l.length * 0.82)] || l.at(-1)];
  if (fH.length) { const [a, b] = pan(fH); K.push([tt.army, a.x, a.y - 60, 1.6, 'cut'], [tt.army + 3.0, b.x, b.y - 60, 1.6]); }
  if (fC.length) { const [a, b] = pan(fC); K.push([tt.army + 3.0, a.x, a.y - 60, 1.6, 'cut'], [tt.cta - 0.01, b.x, b.y - 60, 1.6]); }
  K.push([tt.cta, hRef.x, fy + 20, 2.0, 'cut'], [END, hRef.x + 60, fy + 30, 2.1]);
  const spots = [[0, tt.depot, null, 3.8, 44, post]]; // úvodní záběr pod titulkem = hrdina dne na svém stanovišti; znovu v závěru příběhu
  const spotAt = (t) => spots.find(([a, b]) => t >= a && t < b);
  const camAt = camPath(K.sort((p, q) => p[0] - q[0]));
  const sub = subtitles(vo);
  const fx = transitions([[tt.depot, 'black', 0.4], [tt.five, 'whip'], [tt.dog, 'black', 0.4], [tt.bonds, 'flash'], [tt.fell, 'black', 0.4], [tt.race, 'whip'], [tt.army, 'whip'], [tt.cta, 'black', 0.4]].sort((x, y) => x[0] - y[0]));
  const SFX = [[tt.day, 'drum', 0], [tt.five + 1.2, 'drum', 0], [tt.five + 3.4, 'drum', 0], [tt.five + 5.6, 'drum', 0], [tt.comment + 2.0, 'drum', 0], [tt.bonds, 'drum', 0], [tt.fell, 'drum', 0], [tt.cta, 'drum', 0], [END - 1.3, 'end', 0]];

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  const C2 = D.comment;
  root.innerHTML = `
    <div id="f19-fell" class="f19-panel"><div class="t">DAY ${D.label} · CASUALTIES</div><div class="row"><span>HEGEMONY</span><b class="r">${D.fell[0]} FELL</b></div><div class="row"><span>CONCORD</span><b class="r">${D.fell[1]} FELL</b></div><div class="note">${D.fellNote || 'rifles and machine guns'}</div></div>
    <div id="f19-hosp" class="f19-panel"><div class="t">DIED WAITING FOR CARE</div><div class="row"><span>YESTERDAY</span><b class="r">${D.nocareYesterday[0] + D.nocareYesterday[1]}</b></div><div class="row"><span>TODAY</span><b class="g">${D.nocare[0] + D.nocare[1]}</b></div><div class="note">${D.hospNote || 'the hospitals are holding'}</div></div>
    <div id="f19-race" class="f19-panel"><div class="t">THE RACE FOR THE BONE QUARRY</div><div class="row"><span>HEGEMONY</span><b>${D.race[0]}</b></div><div class="row"><span>CONCORD</span><b>${D.race[1]}</b></div><div class="note">300 wins the heights</div></div>
    ${hero ? `<div id="f19-post" class="f19-tag">POST ${D.hero.sector}<small>six men in eighteen days</small></div>` : ''}
    <div id="f19-cap"></div>
    <div id="f19-five"><div class="t">THE POST AT ${D.hero.sector}</div>${D.five.map((r) => `<div class="r"><span><b>✝</b>${r[0]}</span><i>${r[1]} · ${r[2]}</i></div>`).join('')}</div>
    <div id="f19-comment"><div class="av">${C2.handle[0].toUpperCase()}</div><div><div class="nm">${C2.handle}<small>${C2.faction}</small></div><div class="tx">“${C2.text}”</div><div class="lk">♥ ${C2.likes}</div></div></div>
    <div id="f19-bonds" class="f19-card"><div class="k">THE FRONT THANKS</div><div class="b">${D.hero.name}<br>bought War Bonds</div><div class="n">${D.patronNote || '★ WAR BONDS · THE FRONT REMEMBERS WHO KEPT IT FED'}</div></div>
    <div id="f19-big"><div class="k">ON THE FRONT NOW</div><b>0</b><div class="p">+${D.joined[0] + D.joined[1]} yesterday</div></div>
    <div id="f19-side"><span></span></div>
    <div id="f19-cta"><div class="big">PICK A SIDE<br>HEGEMONY or CONCORD</div><div class="sm">comment it on any post<br>and your soldier joins the line</div><div class="url">mudandiron.app</div></div>
    <div id="rd-big"></div>
    <div id="rd-sub"></div>
  `;
  document.body.appendChild(root);
  const paint = fxLayers(root);
  const day = dayTitle(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };
  const fight = await makeFight({ anims, soldiers, tex });
  const sc = await makeDay19Scenes(tex, anims);
  sc.canvas.id = 'f19-art'; root.prepend(sc.canvas);

  // reflektor (pravidlo uživatele 23. 11.): představovaný voják musí být celý vidět; okolí se skryje (běží těsně před vykreslením)
  let hidden = [];
  window.__reelPost = (t) => {
    for (const o of hidden) o.visible = true;
    hidden = [];
    const hide = (o) => { if (o && o.visible) { o.visible = false; hidden.push(o); } };
    for (const pl of window.__front?.planeFx?.planes || []) { hide(pl.body); hide(pl.shadow); } // letadlo nesmí přeletět přes příběh (celé video)
    const F = spotAt(t)?.[2];
    if (!F) return;
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

  const CAPS = [[tt.depot, tt.five, 'MOBILIZATION', 'the first of the House'], [tt.dog, tt.bonds, 'DAY 17 · THE BUNK', 'the sixth arrives']];

  function frame(t) {
    const f = fx(t);
    let [x, y, z] = camAt(t);
    const S = spotAt(t);
    if (S) { const p = S[5] || posOf(S[2]); x = p.x; y = p.y - S[4]; z = S[3]; }
    cam.set(x, y, z * (1 + 0.05 * f.punch));
    for (const q of soldiers) if (q.sprite && q.vacant && q.sprite.alpha < 1) q.sprite.alpha = 1; // žádní duchové
    fight.update(t);
    const film0 = t >= tt.depot && t < tt.five ? ['station', t - tt.depot] : t >= tt.dog && t < tt.bonds ? ['bunk', t - tt.dog] : null;
    if (film0) sc.draw(film0[0], film0[1]);
    show('#f19-art', film0 ? 1 : 0);
    paint({ ...f, black: Math.max(f.black, t > END - 0.6 ? clamp01((t - END + 0.6) / 0.5) : 0) }, 0);
    day(t, { n: D.label, sub: 'THE HOUSE OF ACQUILLAE', from: 0.2, to: tt.depot - 0.1, subAt: 1.0 });
    const cap = CAPS.find(([a, b]) => t >= a + 0.2 && t < b - 0.2);
    const capEl = $('#f19-cap');
    if (cap) { if (capEl.dataset.text !== cap[2]) { capEl.dataset.text = cap[2]; capEl.innerHTML = `${cap[2]}<small>${cap[3]}</small>`; } capEl.style.opacity = win(t, cap[0] + 0.2, cap[1] - 0.2, 0.3); } else capEl.style.opacity = 0;
    // pět jmen na jednom stanovišti: řádky naskakují postupně, jak je hlas jmenuje
    const spanF = Math.max(2, tt.comment - tt.five);
    $('#f19-five').querySelectorAll('.r').forEach((el, i) => { el.style.opacity = t >= tt.five + spanF * (0.1 + 0.15 * i) ? 1 : 0; });
    slam($('#f19-five'), t, tt.five + 0.3, tt.comment - 0.2, 1.2, -2);
    slam($('#f19-comment'), t, tt.comment + 0.9, tt.dog - 0.2, 1.2, -2);
    slam($('#f19-fell'), t, tt.fell + 0.4, tt.hosp - 0.05, 1.3, -2);
    slam($('#f19-hosp'), t, tt.hosp + 0.4, tt.race - 0.05, 1.3, -2);
    slam($('#f19-race'), t, tt.race + 0.4, tt.army - 0.05, 1.3, -2);
    tagAt($('#f19-post'), { x: post.x, y: post.y + 12 }, cam, t < tt.depot ? win(t, 0.0, tt.depot - 0.05, 0.12) : (t >= tt.five && t < tt.comment ? win(t, tt.five, tt.comment, 0.2) : (t >= tt.bonds && t < tt.fell ? win(t, tt.bonds, tt.fell, 0.2) : 0)), 0);
    slam($('#f19-bonds'), t, tt.bonds + 0.3, tt.fell - 0.3, 1.25, -2);
    show('#f19-big', t >= tt.army && t < tt.cta ? 1 : 0);
    $('#f19-big b').textContent = Math.round((D.army[0] + D.army[1]) * easeOut(clamp01((t - tt.army) / 1.2))).toLocaleString('en-US');
    const split = tt.army + 3.0;
    const side = t >= tt.army + 1.2 && t < tt.cta ? (t < split ? 0 : 1) : -1;
    show('#f19-side', side >= 0 ? 1 : 0);
    if (side >= 0) $('#f19-side span').innerHTML = `${side ? 'CONCORD' : 'HEGEMONY'}<b>${D.army[side].toLocaleString('en-US')}</b>`;
    slam($('#f19-cta'), t, tt.cta + 0.2, END - 1.3, 1.25, -2);
    const logo = t >= END - 1.3;
    const bigEl = $('#rd-big');
    bigEl.style.opacity = logo ? Math.min(1, (t - END + 1.3) / 0.3) : 0;
    if (logo && !bigEl.dataset.on) { bigEl.dataset.on = 1; bigEl.className = 'logo'; bigEl.innerHTML = '<span>MUD <i>&amp;</i> IRON</span><span>@mudandiron · mudandiron.app</span>'; }
    const s = sub(t), subEl = $('#rd-sub');
    if (s && !logo && t >= tt.depot) {
      subEl.style.opacity = 1;
      const top = film0 ? '7%' : null; // v obrazech jsou postavy dole → titulky nahoře
      subEl.style.top = top || 'auto'; subEl.style.bottom = top ? 'auto' : '11%';
      if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; }
    } else subEl.style.opacity = 0;
  }
  window.__reel = { seconds: END, sfx: SFX, frame, ready: true, tt };
}
