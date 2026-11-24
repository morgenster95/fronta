// Day reel Day 15 (24. 11. 2026, noviny 24. 11. 13:00 UTC; /?reel=front15&vacant=700, jen vývojový server), na výšku. Vzor reel-front14.js.
// Pořadí (uživatel 24. 11.): DAY 15 → nejdřív výzva k raidu s filmovými scénami → pak shrnutí dne → na konci znovu COMMENT RAID.
// Bouře nad obvazištěm (cinema-d15 storm) → ztráty na mapě → odstřelovač Karel Pavla a patron Matthias Coop se psem Crumbem (reflektor)
// → War Bonds → Bone Quarry → nováčci a počty → VÝZVA K NOČNÍMU RAIDU: dopisy do helmy (letters) → přes val a drát (over) → nález v blátě
// (find) → zakryté kartičky rubem nahoru (jen náznak, líc se neukazuje; oznámí se, až ji někdo najde) → COMMENT RAID.
// Titulky jen mezi bezpečnými pásy IG (uživatel 24. 11.: včera byly moc vysoko): v obrazech nahoře od 17 %, na mapě dole nad 22 %.
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, slam, clamp01, win, easeOut, tagAt, dayTitle } from './reel-kit.js';
import { makeDay15Scenes } from './cinema-d15.js';
import script from '../../marketing/reels/front15.script.json';
import D from '../../marketing/reels/front15.data.json';

const files = import.meta.glob('../../marketing/reels/front15.vo.json', { eager: true, import: 'default' });

const CSS = `${BASE}${FX_CSS}
#f15-art { position: absolute; inset: 0; width: 100%; height: 100%; image-rendering: pixelated; opacity: 0; object-fit: cover; }
.f15-tag { position: absolute; transform: translate(-50%, -100%); font-family: 'Silkscreen', monospace; font-size: 24px; padding: 6px 12px; background: rgba(14,13,12,0.92); border: 3px solid #d98f3f; white-space: nowrap; color: #e3d9c3; opacity: 0; text-align: center; }
.f15-tag small { display: block; font-family: 'VT323', monospace; font-size: 26px; color: #c9b99a; }
.f15-tag.hero { border-color: #c8553d; }
.f15-panel { position: absolute; left: 7%; right: 7%; background: rgba(14,13,12,0.93); border: 3px solid #524a3f; padding: 14px 16px; opacity: 0; }
.f15-panel .t { font-family: 'Silkscreen', monospace; font-size: 20px; color: #d98f3f; text-align: center; letter-spacing: 0.08em; margin-bottom: 8px; }
.f15-panel .row { display: flex; justify-content: space-between; align-items: baseline; font-family: 'Silkscreen', monospace; font-size: 22px; margin: 4px 0; color: #e3d9c3; }
.f15-panel .row b { font-size: 36px; font-weight: 400; } .f15-panel .row b.r { color: #c8553d; }
.f15-panel .bar { height: 16px; background: #1c1a17; border: 2px solid #524a3f; position: relative; margin-bottom: 6px; } .f15-panel .bar i { position: absolute; left: 0; top: 0; bottom: 0; }
.f15-panel .note { font-family: 'VT323', monospace; font-size: 28px; color: #c9b99a; text-align: center; margin-top: 8px; }
#f15-fell { top: 30%; border-color: #a33b2b; } #f15-race { top: 27%; }
#f15-card { position: absolute; left: 8%; right: 8%; top: 30%; text-align: center; background: rgba(14,13,12,0.94); border: 3px solid #d98f3f; padding: 14px; opacity: 0; font-family: 'Silkscreen', monospace; color: #e3d9c3; font-size: 26px; line-height: 1.3; }
#f15-card small { display: block; font-family: 'VT323', monospace; font-size: 28px; color: #c9b99a; }
#f15-big { position: absolute; left: 0; right: 0; top: 30%; text-align: center; font-family: 'Silkscreen', monospace; color: #e3d9c3; text-shadow: 6px 6px 0 #0e0d0c; opacity: 0; }
#f15-big .k { font-size: 30px; letter-spacing: 0.12em; color: #c9b99a; } #f15-big b { display: block; font-size: 120px; font-weight: 400; color: #c9c26a; line-height: 1; } #f15-big .p { font-size: 34px; color: #d98f3f; margin-top: 10px; }
#f15-side { position: absolute; left: 0; right: 0; top: 58%; text-align: center; font-family: 'Silkscreen', monospace; opacity: 0; }
#f15-side span { display: inline-block; padding: 10px 18px; background: rgba(14,13,12,0.92); border: 3px solid #8a9295; font-size: 30px; color: #e3d9c3; } #f15-side span b { font-weight: 400; font-size: 50px; margin-left: 10px; }
#f15-dim { position: absolute; inset: 0; background: #0e0d0c; opacity: 0; }
#f15-cards { position: absolute; left: 0; right: 0; top: 27%; height: 380px; opacity: 0; }
#f15-cards img { position: absolute; top: 0; left: 50%; width: 216px; height: 348px; image-rendering: pixelated; box-shadow: 10px 12px 0 rgba(14,13,12,0.7); }
#f15-cards .q { position: absolute; left: 50%; top: 360px; transform: translateX(-50%); font-family: 'Silkscreen', monospace; font-size: 44px; color: #d98f3f; letter-spacing: 0.3em; text-shadow: 4px 4px 0 #0e0d0c; }
#f15-lore { position: absolute; left: 7%; right: 7%; top: 63%; text-align: center; opacity: 0; font-family: 'Silkscreen', monospace; color: #e3d9c3; font-size: 28px; line-height: 1.35; text-shadow: 3px 3px 0 #0e0d0c; }
#f15-lore small { display: block; font-family: 'VT323', monospace; font-size: 30px; color: #c9b99a; margin-top: 8px; }
#f15-cta { position: absolute; left: 6%; right: 6%; top: 52%; text-align: center; background: rgba(14,13,12,0.95); border: 4px solid #c8553d; padding: 16px; opacity: 0; }
#f15-cta .big { font-family: 'Silkscreen', monospace; font-size: 58px; color: #d98f3f; line-height: 1.1; } #f15-cta .sm { font-family: 'VT323', monospace; font-size: 30px; color: #e3d9c3; margin-top: 8px; line-height: 1.1; }
#f15-cta .url { font-family: 'Silkscreen', monospace; font-size: 22px; color: #c9b99a; margin-top: 10px; border-top: 2px solid #524a3f; padding-top: 10px; }
`;

export async function startDay15Reel({ cam, map, soldiers, tex, anims }) {
  let vo = files['../../marketing/reels/front15.vo.json'];
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
  const hRef = fH[Math.floor(fH.length * 0.55)] || soldiers[0];
  const cRef = fC[Math.floor(fC.length * 0.4)] || soldiers[0];
  const hero = by(D.hero.handle), coop = by(D.patron.handle);
  const posOf = (q) => (q?.sprite ? { x: q.sprite.x, y: q.sprite.y } : q);

  const K = [];
  K.push([0, hRef.x - 120, mid, 1.0, 'cut'], [tt.raid - 0.01, hRef.x - 60, mid, 1.05]);
  K.push([tt.fell, hRef.x - 250, mid, 1.3, 'cut'], [tt.hero - 0.01, hRef.x + 150, mid, 1.4]); // ztráty: přes celou frontu
  K.push([tt.bonds, cRef.x - 300, mid, 1.1, 'cut'], [tt.race - 0.01, cRef.x - 150, mid, 1.15]);
  K.push([tt.race, cRef.x + 200, mid, 1.2, 'cut'], [tt.joined - 0.01, cRef.x + 450, mid, 1.25]);
  K.push([tt.joined, hRef.x - 500, mid, 0.9, 'cut'], [tt.armyH - 0.01, hRef.x - 250, mid, 0.85]);
  const pan = (l) => [l[Math.floor(l.length * 0.08)] || l[0], l[Math.floor(l.length * 0.92)] || l.at(-1)];
  if (fH.length) { const [a, b] = pan(fH); K.push([tt.armyH, a.x, a.y + 32, 1.6, 'cut'], [tt.armyC - 0.01, b.x, b.y + 32, 1.6]); }
  if (fC.length) { const [a, b] = pan(fC); K.push([tt.armyC, a.x, a.y + 32, 1.6, 'cut'], [tt.cta2 - 0.01, b.x, b.y + 32, 1.6]); }
  K.push([tt.raid, hRef.x, mid, 1.2, 'cut'], [tt.storm - 0.01, hRef.x + 60, mid, 1.25]);
  K.push([tt.cta2, hRef.x, mid, 1.2, 'cut'], [END, hRef.x + 60, mid, 1.25]);
  const camAt = camPath(K);
  const spots = [[tt.hero, tt.coop, hero, 4.8], [tt.coop, tt.bonds, coop, 5.0]].filter((x) => x[2]);
  const spotAt = (t) => spots.find(([a, b]) => t >= a && t < b);
  const sub = subtitles(vo);
  const PICK = 2.6; // v obraze „find“ raider zvedne kartičku
  const fx = transitions([[tt.storm, 'black', 0.6], [tt.fell, 'flash'], [tt.hero, 'whip'], [tt.coop, 'whip'], [tt.bonds, 'black', 0.3], [tt.race, 'black', 0.4], [tt.joined, 'flash'], [tt.armyH, 'whip'], [tt.armyC, 'whip'], [tt.cta2, 'black', 0.4],
    [tt.raid, 'black', 0.7], [tt.over, 'flash'], [tt.find, 'black', 0.5], [tt.find + PICK, 'flash'], [tt.cta, 'whip']].sort((a, b) => a[0] - b[0]));
  const SFX = [[tt.day, 'drum', 0], [tt.fell, 'drum', 0], [tt.hero, 'drum', 0], [tt.joined, 'drum', 0], [tt.raid, 'drum', 0], [tt.over, 'drum', 0], [tt.find + PICK, 'drum', 0], [tt.cta, 'drum', 0], [tt.cta2, 'drum', 0], [END - 1.3, 'end', 0]];

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  const lead = D.race[0] >= D.race[1] ? 0 : 1, nm = ['HEGEMONY', 'CONCORD'], col = ['#8f8a82', '#8a8a52'];
  const back = '/assets/cards/back.png';
  root.innerHTML = `
    <div id="f15-fell" class="f15-panel"><div class="t">DAY ${D.label} · CASUALTIES</div><div class="row"><span>HEGEMONY</span><b class="r">${D.fell[0]} FELL</b></div><div class="row"><span>CONCORD</span><b class="r">${D.fell[1]} FELL</b></div><div class="note">${D.why}</div></div>
    ${hero ? `<div id="f15-hero" class="f15-tag hero">THE DEADLIEST RIFLE<br>${D.hero.name.toUpperCase()}<small>Concord sniper · ${D.hero.note}</small></div>` : ''}
    ${coop ? `<div id="f15-coop" class="f15-tag">★ ${D.patron.name.toUpperCase()}<small>Officers' Mess · with ${D.patron.dog} · @${D.patron.handle}</small></div>` : ''}
    <div id="f15-card">THE FRONT THANKS<small>${D.bonds.join('<br>')}</small><small>War Bonds · Field Post · Officers' Mess</small></div>
    <div id="f15-race" class="f15-panel"><div class="t">THE RACE FOR THE BONE QUARRY</div>
      <div class="row"><span>${nm[lead]}</span><b>${D.race[lead]}</b></div><div class="bar"><i style="width:${D.race[lead] / 3}%;background:${col[lead]}"></i></div>
      <div class="row"><span>${nm[1 - lead]}</span><b>${D.race[1 - lead]}</b></div><div class="bar"><i style="width:${D.race[1 - lead] / 3}%;background:${col[1 - lead]}"></i></div>
      <div class="note">first to 300 new soldiers digs a mine under the enemy line</div></div>
    <div id="f15-big"><div class="k">ON THE FRONT NOW</div><b>0</b><div class="p">+${D.joined[0] + D.joined[1]} yesterday</div></div>
    <div id="f15-side"><span></span></div>
    <div id="f15-dim"></div>
    <div id="f15-cards"><img src="${back}" alt=""><img src="${back}" alt=""><img src="${back}" alt=""><div class="q">? ? ?</div></div>
    <div id="f15-lore">SOMETHING IS HIDDEN<br>IN THE ENEMY MUD<small>Not every raider finds one.<br>Only the living bring it home.</small></div>
    <div id="f15-cta"><div class="big">COMMENT<br>RAID</div><div class="sm">Your soldier goes over the top tonight.<br>Very dangerous. Riflemen fight best.<br>Results in the Gazette, 13:00 UTC</div><div class="url">mudandiron.app</div></div>
    <div id="rd-big"></div>
    <div id="rd-sub"></div>
  `;
  document.body.appendChild(root);
  const paint = fxLayers(root);
  const day = dayTitle(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };
  const d15 = await makeDay15Scenes(tex, anims);
  d15.canvas.id = 'f15-art'; root.prepend(d15.canvas);
  const cardEls = [...root.querySelectorAll('#f15-cards img')];

  // reflektor (pravidlo 23. 11.): představovaný voják celý vidět, okolí (vojáci, psi cizích, bunkry, záblesky, letadla) se skryje
  let hidden = [];
  window.__reelPost = (t) => {
    for (const o of hidden) o.visible = true;
    hidden = [];
    const F = spotAt(t)?.[2];
    if (!F) return;
    const hide = (o) => { if (o && o.visible) { o.visible = false; hidden.push(o); } };
    const P = posOf(F);
    // jeho pes: vždy navrch (v lomeném zákopu ho jinak kryje sousední blok terénu)
    const dg = F.dogSprite, top = F.sprite?.parent?.parent;
    if (dg && top && dg.parent !== top) { top.addChild(dg); }
    for (const q of soldiers) {
      if (q === F || !q.sprite) continue;
      const Q = posOf(q), dx = Q.x - P.x, dy = Q.y - P.y;
      if (Math.abs(dx) < 40 && dy > -44 && dy < 34) { hide(q.sprite); hide(q.dogSprite); }
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
    const film = t >= tt.storm && t < tt.fell ? ['storm', t - tt.storm + 0.5]
      : t >= tt.raid && t < tt.over ? ['letters', t - tt.raid + 0.3]
      : t >= tt.over && t < tt.find ? ['over', t - tt.over]
      : t >= tt.find && t < tt.storm ? ['find', t - tt.find, { pick: PICK }] : null;
    if (film) d15.draw(film[0], film[1], film[2]);
    show('#f15-art', film ? 1 : 0);
    paint({ ...f, black: Math.max(f.black, t > END - 0.6 ? clamp01((t - END + 0.6) / 0.5) : 0) }, 0);
    day(t, { n: D.label, sub: 'TONIGHT: THE RAID', from: 0.2, to: tt.raid - 0.1, subAt: 1.1 });
    slam($('#f15-fell'), t, tt.fell + 0.5, tt.hero - 0.05, 1.3, -2);
    if (hero) tagAt($('#f15-hero'), { x: posOf(hero).x, y: posOf(hero).y - 30 }, cam, win(t, tt.hero + 0.2, tt.coop - 0.05, 0.12), 0);
    if (coop) tagAt($('#f15-coop'), { x: posOf(coop).x, y: posOf(coop).y - 30 }, cam, win(t, tt.coop + 0.2, tt.bonds - 0.05, 0.12), 0);
    show('#f15-card', win(t, tt.bonds + 0.2, tt.race - 0.05, 0.15));
    slam($('#f15-race'), t, tt.race + 0.2, tt.joined - 0.05, 1.3, -2);
    show('#f15-big', t >= tt.army && t < tt.armyH ? 1 : 0);
    $('#f15-big b').textContent = Math.round((D.army[0] + D.army[1]) * easeOut(clamp01((t - tt.army) / 1.2))).toLocaleString('en-US');
    const side = t >= tt.armyH && t < tt.cta2 ? (t < tt.armyC ? 0 : 1) : -1;
    show('#f15-side', side >= 0 ? 1 : 0);
    if (side >= 0) $('#f15-side span').innerHTML = `${side ? 'CONCORD' : 'HEGEMONY'}<b>${D.army[side].toLocaleString('en-US')}</b>`;
    // zakryté kartičky: po zvednutí v blátě se obraz ztmaví a vyjedou tři karty rubem nahoru; prostřední se zkusí otočit a spadne zpět
    const cIn = tt.find + PICK + 0.4;
    const inRaid = t >= cIn && t < tt.storm, inEnd = t >= tt.cta2 + 0.1; // kartičky: konec raidové části a závěrečná výzva
    const cv = inRaid ? clamp01((t - cIn) / 0.5) * clamp01((tt.storm - t) / 0.3) : inEnd ? clamp01((t - tt.cta2 - 0.1) / 0.4) : 0, fin = t > END - 1.3 ? clamp01(1 - (t - END + 1.3) / 0.3) : 1;
    show('#f15-dim', 0.55 * cv * fin);
    show('#f15-cards', cv * fin);
    const cta = (t >= tt.cta && t < tt.storm) || inEnd;
    const sc = cta ? 0.6 : 0.8, lift = cta ? -40 : -30;
    $('#f15-cards').style.transform = `translateY(${lift}px) scale(${sc})`;
    cardEls.forEach((el, i) => {
      const k = i - 1, rise = easeOut(clamp01((t - (inEnd ? tt.cta2 + 0.1 : cIn) - i * 0.15) / 0.5));
      const u = (t - cIn) % 3.2, tease = i === 1 && u > 1.6 && u < 2.4 ? Math.sin(((u - 1.6) / 0.8) * Math.PI) : 0; // náznak otočení, líc nikdy
      el.style.transform = `translate(${-108 + k * 150}px, ${(1 - rise) * 500 + Math.abs(k) * 26}px) rotate(${k * 11}deg) scaleX(${1 - 0.8 * tease}) translateY(${-tease * 18}px)`;
      el.style.zIndex = i === 1 ? 2 : 1;
    });
    $('#f15-cards .q').style.opacity = cta ? 0 : 1;
    show('#f15-lore', cta ? 0 : win(t, tt.secret + 0.1, tt.cta - 0.05, 0.2));
    slam($('#f15-cta'), t, t >= tt.cta2 ? tt.cta2 + 0.3 : tt.cta + 0.2, t >= tt.cta2 ? END - 1.3 : tt.storm - 0.1, 1.25, -2);
    const logo = t >= END - 1.3;
    const bigEl = $('#rd-big');
    bigEl.style.opacity = logo ? Math.min(1, (t - END + 1.3) / 0.3) : 0;
    if (logo && !bigEl.dataset.on) { bigEl.dataset.on = 1; bigEl.className = 'logo'; bigEl.innerHTML = '<span>MUD <i>&amp;</i> IRON</span><span>@mudandiron · mudandiron.app</span>'; }
    // titulky jen v bezpečném pásu: v obrazech a u karet nahoře od 17 %, na mapě dole s okrajem 22 % (lišta IG)
    const s = sub(t);
    const subEl = $('#rd-sub');
    if (s && !logo && t >= tt.raid) {
      subEl.style.opacity = 1;
      const topBand = film || cv > 0;
      subEl.style.top = topBand ? '17%' : 'auto'; subEl.style.bottom = topBand ? 'auto' : '22%';
      if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; }
    } else subEl.style.opacity = 0;
  }
  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
