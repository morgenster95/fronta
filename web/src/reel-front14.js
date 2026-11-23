// Day reel Day 14 (23. 11. 2026, noviny 23. 11. 13:00 UTC; /?reel=front14&vacant=700, jen vývojový server), na výšku.
// Uživatel 23. 11.: „NOVÉ, NIC NEPOUŽÍVÁME VÍCKRÁT“ → všechny filmové scény jsou nové obrazy z PixelLabu bez postav a v nich naše sprity
// (web/src/cinema-d14.js): země nikoho pod světlicí (drátaři) → ztráty nad frontou → podzemní obvaziště (proč) → souboj lopatkami
// v zasněženém zákopu (raid na Gideona Cubese) → Cubes a medik Magnusmadsen na mapě → hřbitov s helmami, pes čeká, přijde nástupce
// → nástupce se psem na mapě → karta Gonza (Field Post) → Bone Quarry → nováčci na zásobovací cestě → počty → výzva.
// Představovaný voják je vždy celý vidět (reflektor přes window.__reelPost). Jednotný titulek dne (dayTitle).
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, slam, clamp01, win, easeOut, tagAt, dayTitle } from './reel-kit.js';
import { makeDay14Scenes } from './cinema-d14.js'; // nové obrazy (pravidlo 23. 11.: žádná scéna dvakrát, marketing/reels/scenes-used.json)
import script from '../../marketing/reels/front14.script.json';
import D from '../../marketing/reels/front14.data.json';

const files = import.meta.glob('../../marketing/reels/front14.vo.json', { eager: true, import: 'default' });

const CSS = `${BASE}${FX_CSS}
#f14-art { object-fit: cover; }
#f14-wire, #f14-cine, #f14-dog, #f14-art { position: absolute; inset: 0; width: 100%; height: 100%; image-rendering: pixelated; opacity: 0; }
.f14-tag { position: absolute; transform: translate(-50%, -100%); font-family: 'Silkscreen', monospace; font-size: 24px; padding: 6px 12px; background: rgba(14,13,12,0.92); border: 3px solid #d98f3f; white-space: nowrap; color: #e3d9c3; opacity: 0; text-align: center; }
.f14-tag small { display: block; font-family: 'VT323', monospace; font-size: 26px; color: #c9b99a; }
.f14-tag.hero { border-color: #c8553d; } .f14-tag.med { border-color: #e3d9c3; }
.f14-panel { position: absolute; left: 7%; right: 7%; background: rgba(14,13,12,0.93); border: 3px solid #524a3f; padding: 14px 16px; opacity: 0; }
.f14-panel .t { font-family: 'Silkscreen', monospace; font-size: 20px; color: #d98f3f; text-align: center; letter-spacing: 0.08em; margin-bottom: 8px; }
.f14-panel .row { display: flex; justify-content: space-between; align-items: baseline; font-family: 'Silkscreen', monospace; font-size: 22px; margin: 4px 0; color: #e3d9c3; }
.f14-panel .row b { font-size: 36px; font-weight: 400; } .f14-panel .row b.r { color: #c8553d; }
.f14-panel .bar { height: 16px; background: #1c1a17; border: 2px solid #524a3f; position: relative; margin-bottom: 6px; } .f14-panel .bar i { position: absolute; left: 0; top: 0; bottom: 0; }
.f14-panel .note { font-family: 'VT323', monospace; font-size: 28px; color: #c9b99a; text-align: center; margin-top: 8px; }
#f14-fell { top: 7%; border-color: #a33b2b; } #f14-race { top: 44%; } #f14-wirep { top: 40%; border-color: #8a9295; }
#f14-card { position: absolute; left: 8%; right: 8%; top: 9%; text-align: center; background: rgba(14,13,12,0.94); border: 3px solid #d98f3f; padding: 12px; opacity: 0; font-family: 'Silkscreen', monospace; color: #e3d9c3; font-size: 26px; }
#f14-card small { display: block; font-family: 'VT323', monospace; font-size: 28px; color: #c9b99a; }
#f14-big { position: absolute; left: 0; right: 0; top: 26%; text-align: center; font-family: 'Silkscreen', monospace; color: #e3d9c3; text-shadow: 6px 6px 0 #0e0d0c; opacity: 0; }
#f14-big .k { font-size: 30px; letter-spacing: 0.12em; color: #c9b99a; } #f14-big b { display: block; font-size: 120px; font-weight: 400; color: #c9c26a; line-height: 1; } #f14-big .p { font-size: 34px; color: #d98f3f; margin-top: 10px; }
#f14-side { position: absolute; left: 0; right: 0; top: 58%; text-align: center; font-family: 'Silkscreen', monospace; opacity: 0; }
#f14-side span { display: inline-block; padding: 10px 18px; background: rgba(14,13,12,0.92); border: 3px solid #8a9295; font-size: 30px; color: #e3d9c3; } #f14-side span b { font-weight: 400; font-size: 50px; margin-left: 10px; }
#f14-cta { position: absolute; left: 6%; right: 6%; top: 46%; text-align: center; background: rgba(14,13,12,0.94); border: 4px solid #d98f3f; padding: 16px; opacity: 0; }
#f14-cta .big { font-family: 'Silkscreen', monospace; font-size: 40px; color: #d98f3f; line-height: 1.15; } #f14-cta .sm { font-family: 'VT323', monospace; font-size: 30px; color: #e3d9c3; margin-top: 6px; }
#f14-cta .url { font-family: 'Silkscreen', monospace; font-size: 24px; color: #e3d9c3; margin-top: 10px; border-top: 2px solid #524a3f; padding-top: 10px; }
`;

export async function startDay14Reel({ cam, map, soldiers, tex, anims }) {
  let vo = files['../../marketing/reels/front14.vo.json'];
  if (!vo) {
    let c = 0;
    vo = { lines: script.lines.map(([at, text, id]) => { const s = Math.max(at, c), d = text.length / 15 + 0.2; c = s + d + 0.25; return [s, d, text, id]; }) };
    vo.seconds = c + 2.4;
  }
  const C = cues(vo);
  const at = C.at, END = vo.seconds;
  const T = map.tile;
  const tt = Object.fromEntries(script.lines.map((l) => [l[2], at(l[2])]));
  const by = (h) => soldiers.find((s) => s.handle === h && s.slot);
  const mid = ((map.front[0] + map.front[1]) / 2) * T;
  const front = (f) => soldiers.filter((s) => s.faction === f && s.slot?.line === 'front' && !s.vacant).sort((a, b) => a.x - b.x);
  const fH = front(0), fC = front(1);
  const hRef = fH[Math.floor(fH.length * 0.45)] || soldiers[0];
  const cRef = fC[Math.floor(fC.length / 2)] || soldiers[0];
  const hero = by(D.hero.handle), medic = by(D.medic.handle), heir = by(D.patron.handle);
  const posOf = (q) => (q?.sprite ? { x: q.sprite.x, y: q.sprite.y } : q); // skutečná poloha (medici ve hře chodí za raněnými)

  // souboj na mapě: raider Concordu vpadne k Cubesovi, Cubes ho odrazí (vyhraje obránce)

  // kamera (záběry na mapě; ostatní části jsou kreslené scény přes celý obraz)
  const K = [];
  K.push([0, hRef.x - 120, mid, 1.0, 'cut'], [tt.wire - 0.01, hRef.x - 60, mid, 1.05]); // sníh nad frontou zdálky
  K.push([tt.fell, hRef.x - 200, mid, 1.3, 'cut'], [tt.why - 0.01, hRef.x + 100, mid, 1.35]); // ztráty: pohled přes celou frontu
  K.push([tt.bonds2, cRef.x - 400, mid, 1.1, 'cut'], [tt.race - 0.01, cRef.x - 250, mid, 1.15]);
  K.push([tt.race, cRef.x, mid, 1.2, 'cut'], [tt.joined - 0.01, cRef.x + 300, mid, 1.25]);
  K.push([tt.joined, hRef.x + 400, mid, 0.9, 'cut'], [tt.armyH - 0.01, hRef.x + 650, mid, 0.85]);
  const pan = (l) => [l[Math.floor(l.length * 0.08)] || l[0], l[Math.floor(l.length * 0.92)] || l.at(-1)];
  if (fH.length) { const [a, b] = pan(fH); K.push([tt.armyH, a.x, a.y - 20, 1.6, 'cut'], [tt.armyC - 0.01, b.x, b.y - 20, 1.6]); }
  if (fC.length) { const [a, b] = pan(fC); K.push([tt.armyC, a.x, a.y - 20, 1.6, 'cut'], [tt.cta - 0.01, b.x, b.y - 20, 1.6]); }
  K.push([tt.cta, hRef.x, hRef.y + 60, 2.0, 'cut'], [END, hRef.x + 60, hRef.y + 70, 2.1]);
  const camAt = camPath(K);
  // reflektor: kdo je v kterém čase představovaný (kamera ho drží, okolí se skryje)
  const HS = tt.hero, MS = tt.medic, GH = tt.jasper + 2.2; // obraz hřbitova do GH, pak nástupce na mapě
  const spots = [[HS, tt.medic, hero, 4.8], [MS, tt.bonds, medic, 4.8], [GH, tt.bonds2, heir, 5.2]].filter((x) => x[2]);
  const spotAt = (t) => spots.find(([a, b]) => t >= a && t < b);
  const sub = subtitles(vo);
  const fx = transitions([[tt.wire, 'black', 0.4], [tt.wire2, 'flash'], [tt.fell, 'black', 0.4], [tt.why, 'whip'], [tt.raid, 'black', 0.3], [tt.raid + 2.35, 'flash'], [tt.hero, 'whip'], [tt.medic, 'whip'], [tt.bonds, 'black', 0.4], [GH, 'whip'], [tt.bonds2, 'whip'], [tt.race, 'black', 0.4], [tt.joined, 'flash'], [tt.armyH, 'whip'], [tt.armyC, 'whip'], [tt.cta, 'black', 0.4]].sort((a, b) => a[0] - b[0]));
  const SFX = [[tt.day, 'drum', 0], [tt.fell, 'drum', 0], [tt.raid + 1.4, 'drum', 0], [tt.hero, 'drum', 0], [tt.joined, 'drum', 0], [tt.cta, 'drum', 0], [END - 1.3, 'end', 0]];

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  const lead = D.race[0] >= D.race[1] ? 0 : 1, nm = ['HEGEMONY', 'CONCORD'], col = ['#8f8a82', '#8a8a52'];
  root.innerHTML = `
    <div id="f14-wirep" class="f14-panel"><div class="t">THE WIRING PARTIES</div><div class="row"><span>OUT ON THE WIRE</span><b>${D.wire.men}</b></div><div class="row"><span>NEW WIRE</span><b>${D.wire.yards.toLocaleString('en-US')} YD</b></div><div class="row"><span>HIT IN THE FLARES</span><b class="r">${D.wire.hit}</b></div></div>
    <div id="f14-fell" class="f14-panel"><div class="t">DAY ${D.label} · CASUALTIES</div><div class="row"><span>HEGEMONY</span><b class="r">${D.fell[0]} FELL</b></div><div class="row"><span>CONCORD</span><b class="r">${D.fell[1]} FELL</b></div><div class="note">${D.why}</div></div>
    ${hero ? `<div id="f14-hero" class="f14-tag hero">THE DEADLIEST RIFLE<br>${D.hero.name.toUpperCase()}<small>${D.hero.note}</small></div>` : ''}
    ${medic ? `<div id="f14-medic" class="f14-tag med">✚ ${D.medic.name.toUpperCase()}<small>Hegemony medic · ${D.medic.note}</small></div>` : ''}
    ${heir ? `<div id="f14-heir" class="f14-tag">★ ${D.patron.heir.toUpperCase()}<small>heir of ${D.patron.name} · with Jasper</small></div>` : ''}
    <div id="f14-card"></div>
    <div id="f14-race" class="f14-panel"><div class="t">THE RACE FOR THE BONE QUARRY</div>
      <div class="row"><span>${nm[lead]}</span><b>${D.race[lead]}</b></div><div class="bar"><i style="width:${D.race[lead] / 3}%;background:${col[lead]}"></i></div>
      <div class="row"><span>${nm[1 - lead]}</span><b>${D.race[1 - lead]}</b></div><div class="bar"><i style="width:${D.race[1 - lead] / 3}%;background:${col[1 - lead]}"></i></div>
      <div class="note">first to 300 new soldiers digs a mine under the enemy line</div></div>
    <div id="f14-big"><div class="k">ON THE FRONT NOW</div><b>0</b><div class="p">+${D.joined[0] + D.joined[1]} yesterday</div></div>
    <div id="f14-side"><span></span></div>
    <div id="f14-cta"><div class="big">PICK A SIDE<br>HEGEMONY or CONCORD</div><div class="sm">comment it on any post<br>and your soldier joins the line</div><div class="url">mudandiron.app</div></div>
    <div id="rd-big"></div>
    <div id="rd-sub"></div>
  `;
  document.body.appendChild(root);
  const paint = fxLayers(root);
  const day = dayTitle(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };
  const d14 = await makeDay14Scenes(tex, anims);
  for (const [c, id] of [[d14, 'f14-art']]) { c.canvas.id = id; root.prepend(c.canvas); }
  const cards = [
    [tt.bonds, tt.jasper + 2.2, `★ ${D.patron.name.toUpperCase()} ✝<small>Officers' Mess · @${D.patron.handle}</small>`],
    [tt.bonds2, tt.race, `★ ${D.fieldpost.name.toUpperCase()}<small>joined the Field Post · @${D.fieldpost.handle}</small>`],
  ];

  // reflektor (pravidlo uživatele 23. 11.): představovaný voják musí být celý vidět. V jeho okolí se skryje každý jiný voják (i pes),
  // bunkr s vlajkou a záblesky kulometů a letadla; běží po aktualizaci světa, těsně před vykreslením (window.__reelPost v main.js)
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
    if (S) { const p = posOf(S[2]); x = p.x; y = p.y - 16; z = S[3]; } // drží představovaného vojáka
    const truck = t >= tt.army && t < tt.armyH ? window.__front?.convoy?.fleet?.find((r) => !r.horse) : null;
    if (truck) { x = truck.x; y = window.__front.convoy.roadY[truck.f] - 52; z = 2.8; } // kolona na zásobovací cestě (poloha z logiky kolony, sprite mimo záběr se nepřepočítává)
    cam.set(x, y, z * (1 + 0.05 * f.punch));
    for (const q of soldiers) if (q.sprite && q.vacant && q.sprite.alpha < 1) q.sprite.alpha = 1; // žádní duchové
    // kreslené scény přes celý obraz
    const film = t >= tt.wire && t < tt.fell ? ['art', 'wirenight', t - tt.wire + 0.4]
      : t >= tt.why && t < tt.raid ? ['art', 'aid', t - tt.why]
      : t >= tt.raid && t < tt.hero ? ['art', 'raid', t - tt.raid, { fall: 2.4 }]
      : t >= tt.bonds && t < GH ? ['art', 'graves', t - tt.bonds, { breed: D.patron.breed, heir: tt.jasper - tt.bonds + 0.6 }]
      : t >= tt.joined && t < tt.army ? ['art', 'road', t - tt.joined + 2] : null;
    if (film) d14.draw(film[1], film[2], film[3]);
    show('#f14-art', film ? 1 : 0);
    paint({ ...f, black: Math.max(f.black, t > END - 0.6 ? clamp01((t - END + 0.6) / 0.5) : 0) }, 0);
    day(t, { n: D.label, sub: 'THE WIRE WAS MENDED', from: 0.2, to: tt.wire - 0.1, subAt: 1.1 });
    slam($('#f14-wirep'), t, tt.wire2 + 0.3, tt.fell - 0.05, 1.3, -2);
    slam($('#f14-fell'), t, tt.fell + 0.6, tt.why - 0.05, 1.3, -2);
    if (hero) tagAt($('#f14-hero'), { x: posOf(hero).x, y: posOf(hero).y - 30 }, cam, win(t, HS + 0.2, tt.medic - 0.05, 0.12), 0);
    if (medic) tagAt($('#f14-medic'), { x: posOf(medic).x, y: posOf(medic).y - 30 }, cam, win(t, MS + 0.2, tt.bonds - 0.05, 0.12), 0);
    if (heir) tagAt($('#f14-heir'), { x: posOf(heir).x, y: posOf(heir).y - 30 }, cam, win(t, tt.jasper + 2.4, tt.bonds2 - 0.05, 0.12), 0);
    const card = cards.find(([a, b]) => t >= a + 0.2 && t < b - 0.05);
    const cEl = $('#f14-card');
    cEl.style.opacity = card ? 1 : 0;
    if (card && cEl.dataset.k !== String(card[0])) { cEl.dataset.k = String(card[0]); cEl.innerHTML = card[2]; }
    slam($('#f14-race'), t, tt.race + 0.2, tt.joined - 0.05, 1.3, -2);
    show('#f14-big', t >= tt.army && t < tt.armyH ? 1 : 0);
    $('#f14-big b').textContent = Math.round((D.army[0] + D.army[1]) * easeOut(clamp01((t - tt.army) / 1.2))).toLocaleString('en-US');
    const side = t >= tt.armyH && t < tt.cta ? (t < tt.armyC ? 0 : 1) : -1;
    show('#f14-side', side >= 0 ? 1 : 0);
    if (side >= 0) $('#f14-side span').innerHTML = `${side ? 'CONCORD' : 'HEGEMONY'}<b>${D.army[side].toLocaleString('en-US')}</b>`;
    slam($('#f14-cta'), t, tt.cta + 0.2, END - 1.3, 1.25, -2);
    const logo = t >= END - 1.3;
    const bigEl = $('#rd-big');
    bigEl.style.opacity = logo ? Math.min(1, (t - END + 1.3) / 0.3) : 0;
    if (logo && !bigEl.dataset.on) { bigEl.dataset.on = 1; bigEl.className = 'logo'; bigEl.innerHTML = '<span>MUD <i>&amp;</i> IRON</span><span>@mudandiron · mudandiron.app</span>'; }
    const s = sub(t);
    const subEl = $('#rd-sub');
    if (s && !logo && t >= tt.wire) {
      subEl.style.opacity = 1;
      const top = film ? (film[1] === 'graves' ? '24%' : '7%') : null; // v obrazech jsou postavy dole → titulky nahoru (u hřbitova pod kartu)
      subEl.style.top = top || 'auto'; subEl.style.bottom = top ? 'auto' : '11%';
      if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; }
    } else subEl.style.opacity = 0;
  }
  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
