// Day reel Day 16 (25. 11. 2026, noviny 25. 11. 13:00 UTC; /?reel=front16&vacant=700, jen vývojový server), na výšku.
// Uživatel 25. 11.: titulek dne na jiném pozadí (kartičky nalezené v noci), opakované části zkrátit (jeden panel s čísly + jeden přejezd),
// hlasování HOSPITAL / TANK (Behemoth pro Hegemonii, Tortoise pro Concord, art/cine/tank_sheet_a.png → web/public/assets/props/tank_*).
// Titulek DAY 16 na pozadí padajících kartiček → WINGS (Felix Dougc) → raid v dešti (rainback) → zatopený zákop s raněnými (mudward) + panel ztrát
// → jeden přejezd po frontě s počty a závodem → nemocnice (hospital) → tanky (tanks) → hlasovací panel. Na mapě se nic neskrývá (žádné osiřelé záblesky).
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, slam, clamp01, win, easeOut, dayTitle } from './reel-kit.js';
import { makeDay16Scenes } from './cinema-d16.js';
import script from '../../marketing/reels/front16.script.json';
import D from '../../marketing/reels/front16.data.json';

const files = import.meta.glob('../../marketing/reels/front16.vo.json', { eager: true, import: 'default' });
const IMG = (id) => `/assets/cards/${id ? `card_${id}` : 'back'}.png`;

const CSS = `${BASE}${FX_CSS}
#rd { overflow: hidden; }
#f16-art { position: absolute; inset: 0; width: 100%; height: 100%; image-rendering: pixelated; opacity: 0; object-fit: cover; }
#f16-bg { position: absolute; inset: 0; background: #1c1a17; opacity: 0; overflow: hidden; }
#f16-bg img { position: absolute; width: 81px; height: 130px; image-rendering: pixelated; box-shadow: 5px 6px 0 rgba(14,13,12,0.7); }
#f16-count { position: absolute; left: 0; right: 0; top: 64%; text-align: center; font-family: 'Silkscreen', monospace; color: #e3d9c3; text-shadow: 3px 3px 0 #0e0d0c; opacity: 0; }
#f16-count b { font-weight: 400; font-size: 56px; color: #f0b25a; } #f16-count span { display: block; font-size: 22px; color: #c9b99a; letter-spacing: 0.08em; margin-top: 4px; }
#f16-wings { position: absolute; left: 0; right: 0; top: 16%; text-align: center; opacity: 0; }
#f16-wings img { width: 216px; height: 348px; image-rendering: pixelated; box-shadow: 0 0 40px 10px rgba(217,143,63,0.55), 10px 12px 0 rgba(14,13,12,0.8); }
#f16-wings .t { font-family: 'Silkscreen', monospace; font-size: 34px; color: #f0b25a; margin-top: 14px; text-shadow: 3px 3px 0 #0e0d0c; }
#f16-wings .n { display: inline-block; margin-top: 8px; font-family: 'Silkscreen', monospace; font-size: 22px; color: #e3d9c3; background: rgba(14,13,12,0.92); border: 3px solid #d98f3f; padding: 8px 14px; }
#f16-wings .n small { display: block; font-family: 'VT323', monospace; font-size: 26px; color: #c9b99a; }
.f16-panel { position: absolute; left: 7%; right: 7%; background: rgba(14,13,12,0.93); border: 3px solid #524a3f; padding: 12px 16px; opacity: 0; }
.f16-panel .t { font-family: 'Silkscreen', monospace; font-size: 20px; color: #d98f3f; text-align: center; letter-spacing: 0.08em; margin-bottom: 6px; }
.f16-panel .row { display: flex; justify-content: space-between; align-items: baseline; font-family: 'Silkscreen', monospace; font-size: 22px; margin: 4px 0; color: #e3d9c3; }
.f16-panel .row b { font-size: 34px; font-weight: 400; } .f16-panel .row b.r { color: #c8553d; }
.f16-panel .bar { height: 14px; background: #1c1a17; border: 2px solid #524a3f; position: relative; margin-bottom: 4px; } .f16-panel .bar i { position: absolute; left: 0; top: 0; bottom: 0; }
.f16-panel .note { font-family: 'VT323', monospace; font-size: 26px; color: #c9b99a; text-align: center; margin-top: 6px; }
#f16-raid { top: 66%; border-color: #8a9295; } #f16-cost { top: 60%; border-color: #a33b2b; } #f16-front { top: 22%; }
.f16-lab { position: absolute; left: 0; right: 0; top: 24%; text-align: center; font-family: 'Silkscreen', monospace; color: #e3d9c3; text-shadow: 4px 4px 0 #0e0d0c; opacity: 0; }
.f16-lab b { display: inline-block; font-size: 40px; font-weight: 400; background: rgba(14,13,12,0.9); padding: 4px 14px; border: 3px solid currentColor; }
.f16-tag { position: absolute; transform: translate(-50%, 0); font-family: 'Silkscreen', monospace; font-size: 18px; padding: 4px 10px; background: rgba(14,13,12,0.92); border: 2px solid #d98f3f; color: #e3d9c3; white-space: nowrap; opacity: 0; }
#f16-l-hosp b { color: #e3d9c3; } #f16-l-tank b { color: #d98f3f; }
#f16-vote { position: absolute; left: 5%; right: 5%; top: 22%; opacity: 0; font-family: 'Silkscreen', monospace; color: #e3d9c3; text-align: center; }
#f16-vote .q { font-size: 30px; margin-bottom: 14px; text-shadow: 3px 3px 0 #0e0d0c; }
#f16-vote .cols { display: flex; gap: 12px; }
#f16-vote .c { flex: 1; background: rgba(14,13,12,0.94); border: 4px solid #e3d9c3; padding: 12px 8px; }
#f16-vote .c.t { border-color: #d98f3f; }
#f16-vote .c b { display: block; font-size: 36px; font-weight: 400; margin: 8px 0 6px; } #f16-vote .c.t b { color: #d98f3f; }
#f16-vote .c small { display: block; font-family: 'VT323', monospace; font-size: 24px; color: #c9b99a; line-height: 1.05; }
#f16-vote .ico { height: 96px; display: flex; align-items: center; justify-content: center; gap: 10px; }
#f16-vote .ico img { image-rendering: pixelated; height: 88px; }
#f16-vote .cross { width: 70px; height: 70px; background: #e3d9c3; position: relative; } #f16-vote .cross::before, #f16-vote .cross::after { content: ''; position: absolute; background: #b5402c; }
#f16-vote .cross::before { left: 26px; top: 8px; width: 18px; height: 54px; } #f16-vote .cross::after { left: 8px; top: 26px; width: 54px; height: 18px; }
#f16-vote .end { margin-top: 14px; font-size: 22px; color: #e3d9c3; background: rgba(14,13,12,0.94); border: 3px solid #524a3f; padding: 8px; }
#f16-vote .end small { display: block; font-family: 'VT323', monospace; font-size: 24px; color: #c9b99a; }
`;

export async function startDay16Reel({ cam, map, soldiers, tex, anims }) {
  let vo = files['../../marketing/reels/front16.vo.json'];
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
  const a = fH[Math.floor(fH.length * 0.15)] || soldiers[0], b = fC[Math.floor(fC.length * 0.85)] || soldiers[0];
  // jediný záběr na mapu: přejezd přes celou frontu při počtech (bez skrývání, takže žádné osiřelé záblesky)
  const camAt = camPath([[0, a.x, mid, 1.0, 'cut'], [tt.army, a.x, mid, 1.05, 'cut'], [tt.vote - 0.01, b.x, mid, 1.05], [tt.vote, b.x, mid, 1.0, 'cut']]);
  const sub = subtitles(vo);
  const fx = transitions([[tt.wings, 'flash'], [tt.raid, 'black', 0.5], [tt.cost, 'black', 0.4], [tt.army, 'whip'], [tt.vote, 'black', 0.4], [tt.hosp, 'whip'], [tt.tank, 'whip'], [tt.cta, 'black', 0.4]].sort((x, y) => x[0] - y[0]));
  const SFX = [[tt.day, 'drum', 0], [tt.wings, 'reveal', 0], [tt.raid, 'drum', 0], [tt.cost, 'drum', 0], [tt.vote, 'drum', 0], [tt.cta, 'drum', 0], [END - 1.3, 'end', 0]];

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  const lead = D.race[0] >= D.race[1] ? 0 : 1, nm = ['HEGEMONY', 'CONCORD'], col = ['#8f8a82', '#8a8a52'];
  // pozadí titulku: nalezené kartičky (skutečná čísla z noci) padají a skládají se kolem titulku
  const cardsHtml = D.cards.ids.map((id, i) => `<img src="${IMG(id)}" alt="" data-i="${i}">`).join('');
  root.innerHTML = `
    <div id="f16-bg">${cardsHtml}</div>
        <div id="f16-wings"><img src="${IMG('07')}" alt=""><div class="t">LEGENDARY · 1 IN 20</div><div class="n">FOUND BY ${D.wings.name.toUpperCase()}<small>${D.wings.role} · @${D.wings.handle} · night raid</small></div></div>
    <div id="f16-raid" class="f16-panel"><div class="t">THE NIGHT RAID · IN THE RAIN</div><div class="row"><span>WENT OVER</span><b>${D.raid.out}</b></div><div class="row"><span>ENEMIES KILLED</span><b class="r">${D.raid.kills}</b></div><div class="row"><span>DID NOT COME BACK</span><b>${D.raid.lost}</b></div></div>
    <div id="f16-cost" class="f16-panel"><div class="t">DAY ${D.label} · THE DEADLIEST DAY</div><div class="row"><span>HEGEMONY</span><b class="r">${D.fell[0]} FELL</b></div><div class="row"><span>CONCORD</span><b class="r">${D.fell[1]} FELL</b></div><div class="note">${D.wounded} wounded · medics reach only ${D.cover}</div></div>
    <div id="f16-front" class="f16-panel"><div class="t">ON THE FRONT NOW</div>
      <div class="row"><span>HEGEMONY</span><b>${D.army[0].toLocaleString('en-US')}</b></div><div class="row"><span>CONCORD</span><b>${D.army[1].toLocaleString('en-US')}</b></div>
      <div class="note">+${D.joined[0] + D.joined[1]} yesterday · ${(D.army[0] + D.army[1]).toLocaleString('en-US')} in all</div>
      <div class="t" style="margin-top:10px">THE RACE FOR THE BONE QUARRY</div>
      <div class="row"><span>${nm[lead]}</span><b>${D.race[lead]}</b></div><div class="bar"><i style="width:${D.race[lead] / 3}%;background:${col[lead]}"></i></div>
      <div class="row"><span>${nm[1 - lead]}</span><b>${D.race[1 - lead]}</b></div><div class="bar"><i style="width:${D.race[1 - lead] / 3}%;background:${col[1 - lead]}"></i></div></div>
    <div id="f16-l-hosp" class="f16-lab"><b>HOSPITAL</b></div>
    <div id="f16-l-tank" class="f16-lab"><b>TANK</b></div>
    <div id="f16-t-heg" class="f16-tag" style="left:44%;top:52%">BEHEMOTH · HEGEMONY</div>
    <div id="f16-t-con" class="f16-tag" style="left:61%;top:74%">TORTOISE · CONCORD</div>
    <div id="f16-vote"><div class="q">SAVE YOUR WOUNDED<br>OR WIN THE FIGHT?</div>
      <div class="cols"><div class="c"><div class="ico"><div class="cross"></div></div><b>HOSPITAL</b><small>new hospital dugout<br>surgeons + stretchers<br>fewer dead</small></div>
      <div class="c t"><div class="ico"><img src="/assets/props/tank_heg_front.png" alt=""><img src="/assets/props/tank_con_front.png" alt="" style="height:66px"></div><b>TANK</b><small>shooters hit harder<br>for 4 days<br>but it draws fire</small></div></div>
      <div class="end">COMMENT HOSPITAL OR TANK<small>each side votes for itself · results 13:00 UTC</small></div></div>
    <div id="rd-big"></div>
    <div id="rd-sub"></div>
  `;
  document.body.appendChild(root);
  const paint = fxLayers(root);
  const day = dayTitle(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };
  const sc = await makeDay16Scenes(tex, anims);
  sc.canvas.id = 'f16-art'; root.prepend(sc.canvas);
  // rozložení padajících kartiček kolem titulku (pevné, aby se nepřekrývaly s pruhem titulku uprostřed)
  const bgCards = [...root.querySelectorAll('#f16-bg img')].map((el, i) => {
    const row = Math.floor(i / 8), k = i % 8; // tři řady nahoře (0–33 %), titulek uprostřed a počet pod ním zůstanou volné
    const x = 6 + k * 58 + (row % 2 ? 24 : 0), y = 20 + row * 88;
    return { el, x, y, r: ((i * 37) % 30) - 15, d: i * 0.07 };
  });

  function frame(t) {
    const f = fx(t);
    const [x, y, z] = camAt(t);
    cam.set(x, y, z * (1 + 0.05 * f.punch));
    for (const q of soldiers) if (q.sprite && q.vacant && q.sprite.alpha < 1) q.sprite.alpha = 1; // žádní duchové
    const film = t >= tt.raid && t < tt.cost ? ['rainback', t - tt.raid]
      : t >= tt.cost && t < tt.army ? ['mudward', t - tt.cost]
      : t >= tt.hosp && t < tt.tank ? ['hospital', t - tt.hosp]
      : t >= tt.tank && t < tt.cta ? ['tanks', t - tt.tank] : null;
    if (film) sc.draw(film[0], film[1]);
    show('#f16-art', film ? 1 : 0);
    // pozadí titulku a WINGS: tmavý stůl s kartičkami (místo mapy)
    const bgOn = t < tt.raid;
    show('#f16-bg', bgOn ? 1 : 0);
    if (bgOn) for (const c of bgCards) {
      const k = easeOut(clamp01((t - 0.2 - c.d) / 0.6));
      c.el.style.transform = `translate(${c.x}px, ${c.y - (1 - k) * 700}px) rotate(${c.r}deg)`;
      c.el.style.opacity = t >= tt.wings ? 0.12 : 1;
    }
    paint({ ...f, black: Math.max(f.black, t > END - 0.6 ? clamp01((t - END + 0.6) / 0.5) : 0) }, 0);
    day(t, { n: D.label, sub: `${D.cards.n} CARDS CAME BACK`, from: 0.2, to: tt.wings - 0.1, subAt: 1.0 });
    const w = $('#f16-wings');
    w.style.opacity = win(t, tt.wings, tt.raid - 0.05, 0.2);
    w.style.transform = `scale(${1 + 0.08 * Math.exp(-Math.max(0, t - tt.wings) * 5)})`;
    slam($('#f16-raid'), t, tt.raid + 1.0, tt.cost - 0.05, 1.3, -2);
    slam($('#f16-cost'), t, tt.cost + 0.5, tt.army - 0.05, 1.3, -2);
    slam($('#f16-front'), t, tt.army + 0.2, tt.vote - 0.05, 1.2, -2);
    show('#f16-l-hosp', win(t, tt.hosp + 0.3, tt.tank - 0.05, 0.2));
    show('#f16-l-tank', win(t, tt.tank + 0.3, tt.cta - 0.05, 0.2));
    show('#f16-t-heg', win(t, tt.tank + 0.8, tt.cta - 0.05, 0.2)); show('#f16-t-con', win(t, tt.tank + 1.4, tt.cta - 0.05, 0.2));
    // „Now each side decides“: tma s nadpisem, pak hlasovací panel na konci
    const vt = $('#f16-vote');
    vt.style.opacity = t >= tt.vote && t < tt.hosp ? win(t, tt.vote, tt.hosp - 0.05, 0.2) * 0.999 : t >= tt.cta ? 1 : 0;
    vt.querySelector('.cols').style.visibility = t >= tt.cta ? 'visible' : 'hidden';
    vt.querySelector('.end').style.visibility = t >= tt.cta ? 'visible' : 'hidden';
    const logo = t >= END - 1.3;
    const bigEl = $('#rd-big');
    bigEl.style.opacity = logo ? Math.min(1, (t - END + 1.3) / 0.3) : 0;
    if (logo && !bigEl.dataset.on) { bigEl.dataset.on = 1; bigEl.className = 'logo'; bigEl.innerHTML = '<span>MUD <i>&amp;</i> IRON</span><span>@mudandiron · mudandiron.app</span>'; }
    // titulky: ve scénách nahoře (17 %), jinak dole nad lištou IG; při titulku dne ne
    const s = sub(t), subEl = $('#rd-sub');
    if (s && !logo && t >= tt.cards) {
      subEl.style.opacity = 1;
      const topBand = !!film;
      subEl.style.top = topBand ? '17%' : 'auto'; subEl.style.bottom = topBand ? 'auto' : '22%';
      if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; }
    } else subEl.style.opacity = 0;
  }
  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
