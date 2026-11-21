// Day reel Day 12 (21. 11. 2026, noviny 21. 11. 13:00 UTC; /?reel=front12&vacant=700, jen vývojový server), na výšku:
// DAY 12 nad nočním zákopem, kde se rozsvítí lucerna a u vojáka sedí pes (cine-dogs 'arrive') → psi ve hře u skutečných hráčů obou stran (Spot, Gyp, Bobby)
// → dělo z Grey Mill poprvé pálí (window.__front.gunFx.fire, dopady v cílovém úseku) → ztráty s příčinami (tabule) → Wizzerd propagandista → Lfer Officers' Mess
// → závod o Bone Quarry a mina → +336 včera, 2 034 na frontě s přejezdem po první linii obou stran (pravidlo) → výzva.
// Hlas: marketing/reels/front12.script.json, hudba war_score.
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, slam, clamp01, win, easeOut, tagAt } from './reel-kit.js';
import { makeDogCine } from './cine-dogs.js';
import { makeVertCine } from './cine-vert.js';
import { makeRaceScenes } from './cinema-race.js';
import { makePillboxScenes } from './cinema-pillbox.js';
import script from '../../marketing/reels/front12.script.json';
import dogData from '../../marketing/reels/dogs.data.json';

const files = import.meta.glob('../../marketing/reels/front12.vo.json', { eager: true, import: 'default' });
const D = { fell: [45, 81], hit: [125, 242], cover: [99, 71], race: [26, 31], joined: [198, 138], army: [933, 1101] };
const BREED = { airedale: 'AIREDALE', shepherd: 'GERMAN SHEPHERD', jackrussell: 'JACK RUSSELL', collie: 'BORDER COLLIE', dachshund: 'DACHSHUND' };

const CSS = `${BASE}${FX_CSS}
#f12-cine, #f12-cv, #f12-rc, #f12-pb { position: absolute; inset: 0; width: 100%; height: 100%; image-rendering: pixelated; opacity: 0; }
#f12-cine { inset: 0; width: 100%; height: 100%; image-rendering: pixelated; opacity: 0; }
#f12-day { left: 0; right: 0; top: 14%; text-align: center; font-family: 'Silkscreen', monospace; font-size: 96px; white-space: nowrap; color: #e3d9c3; text-shadow: 7px 7px 0 #0e0d0c; opacity: 0; }
#f12-day b { font-weight: 400; color: #d98f3f; }
.f12-tag { position: absolute; transform: translate(-50%, -100%); font-family: 'Silkscreen', monospace; font-size: 24px; padding: 6px 12px; background: rgba(14,13,12,0.92); border: 3px solid #d98f3f; white-space: nowrap; color: #e3d9c3; opacity: 0; text-align: center; }
.f12-tag small { display: block; font-family: 'VT323', monospace; font-size: 26px; color: #c9b99a; }
.f12-tag.dead { border-color: #a33b2b; } .f12-tag.dead small { color: #c8553d; }
.f12-panel { left: 7%; right: 7%; background: rgba(14,13,12,0.93); border: 3px solid #524a3f; padding: 14px 16px; opacity: 0; }
.f12-panel .t { font-family: 'Silkscreen', monospace; font-size: 20px; color: #d98f3f; text-align: center; letter-spacing: 0.08em; margin-bottom: 8px; }
.f12-panel .row { display: flex; justify-content: space-between; align-items: baseline; font-family: 'Silkscreen', monospace; font-size: 22px; margin: 4px 0; color: #e3d9c3; }
.f12-panel .row b { font-size: 36px; font-weight: 400; } .f12-panel .row b.r { color: #c8553d; }
.f12-panel .bar { height: 16px; background: #1c1a17; border: 2px solid #524a3f; position: relative; margin-bottom: 6px; } .f12-panel .bar i { position: absolute; left: 0; top: 0; bottom: 0; }
.f12-panel .note { font-family: 'VT323', monospace; font-size: 28px; color: #c9b99a; text-align: center; margin-top: 8px; }
#f12-fell { top: 7%; border-color: #a33b2b; } #f12-race { top: 44%; }
#f12-big { left: 0; right: 0; top: 26%; text-align: center; font-family: 'Silkscreen', monospace; color: #e3d9c3; text-shadow: 6px 6px 0 #0e0d0c; opacity: 0; }
#f12-big .k { font-size: 30px; letter-spacing: 0.12em; color: #c9b99a; } #f12-big b { display: block; font-size: 120px; font-weight: 400; color: #c9c26a; line-height: 1; } #f12-big .p { font-size: 34px; color: #d98f3f; margin-top: 10px; }
#f12-side { left: 0; right: 0; top: 58%; text-align: center; font-family: 'Silkscreen', monospace; opacity: 0; }
#f12-side span { display: inline-block; padding: 10px 18px; background: rgba(14,13,12,0.92); border: 3px solid #8a9295; font-size: 30px; color: #e3d9c3; } #f12-side span b { font-weight: 400; font-size: 50px; margin-left: 10px; }
#f12-cta { left: 6%; right: 6%; top: 48%; text-align: center; background: rgba(14,13,12,0.94); border: 4px solid #d98f3f; padding: 16px; opacity: 0; }
#f12-cta .big { font-family: 'Silkscreen', monospace; font-size: 38px; color: #d98f3f; line-height: 1.1; } #f12-cta .sm { font-family: 'VT323', monospace; font-size: 30px; color: #e3d9c3; margin-top: 6px; }
#f12-cta .url { font-family: 'Silkscreen', monospace; font-size: 26px; color: #e3d9c3; margin-top: 10px; border-top: 2px solid #524a3f; padding-top: 10px; }
`;

export async function startDay12Reel({ cam, life, map, soldiers, tex, anims }) {
  let vo = files['../../marketing/reels/front12.vo.json'];
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
  const dogName = Object.fromEntries(dogData.map((d) => [d.handle, d.dog.name]));
  const dogShots = ['zidane_mcnamara', 'thatdudesicarius', 'w0lfer2210'].map((h) => by(h)).filter((s) => s && s.dogSprite);
  const gunFx = window.__front?.gunFx, gun = gunFx?.guns?.[0];
  const wiz = by('flying_wizzerd'), lfer = by('w0lfer2210');
  const front = (f) => soldiers.filter((s) => s.faction === f && s.slot?.line === 'front' && !s.vacant).sort((a, b) => a.x - b.x);
  const fH = front(0), fC = front(1);
  const cRef = fC[Math.floor(fC.length / 2)] || soldiers[0];
  // kamera
  const K = [];
  const DOG0 = tt.dogs2 + 1.8, dSpan = (tt.gun - DOG0) / Math.max(1, dogShots.length);
  K.push([tt.dogs2, dogShots[0]?.x ?? cRef.x, (dogShots[0]?.y ?? cRef.y) - 16, 4.8, 'cut']);
  dogShots.forEach((d, i) => { const t0 = DOG0 + i * dSpan; K.push([t0, d.x - 6, d.y - 16, 4.8, 'cut'], [t0 + dSpan - 0.01, d.x + 6, d.y - 16, 5.2]); });
  if (gun) K.push([tt.gun2, gun.x - 30, gun.y - 10, 3.4, 'cut'], [tt.fell - 0.01, gun.x + 10, gun.y - 10, 3.6]);
  K.push([tt.fell, cRef.x - 200, cRef.y - 30, 1.8, 'cut'], [tt.wiz - 0.01, cRef.x + 200, cRef.y - 30, 1.9]);
  if (wiz) K.push([tt.wiz, wiz.x, wiz.y - 16, 4.6, 'cut'], [tt.bonds - 0.01, wiz.x + 8, wiz.y - 16, 5.0]);
  if (lfer) K.push([tt.bonds, lfer.x, lfer.y - 18, 4.6, 'cut'], [tt.race - 0.01, lfer.x + 8, lfer.y - 18, 5.0]);
  K.push([tt.race, cRef.x, mid, 1.2, 'cut'], [tt.joined - 0.01, cRef.x + 300, mid, 1.25]);
  K.push([tt.joined, cRef.x, mid, 0.9, 'cut'], [tt.armyH - 0.01, cRef.x + 200, mid, 0.85]);
  if (fH.length) K.push([tt.armyH, fH[0].x, fH[0].y - 20, 1.6, 'cut'], [tt.armyC - 0.01, fH.at(-1).x, fH.at(-1).y - 20, 1.6]);
  if (fC.length) K.push([tt.armyC, fC[0].x, fC[0].y - 20, 1.6, 'cut'], [tt.cta - 0.01, fC.at(-1).x, fC.at(-1).y - 20, 1.6]);
  K.push([tt.cta, cRef.x, mid, 1.1, 'cut'], [END, cRef.x + 60, mid, 1.15]);
  const camK = camPath(K);
  const camAt = (t) => (t < tt.dogs2 ? [cRef.x, mid, 1] : camK(t));
  const sub = subtitles(vo);
  const fx = transitions([[tt.dogs2, 'whip'], [tt.gun, 'flash'], [tt.fell, 'black', 0.4], [tt.wiz, 'whip'], [tt.bonds, 'whip'], [tt.race, 'black', 0.4], [tt.joined, 'flash'], [tt.armyH, 'whip'], [tt.armyC, 'whip'], [tt.cta, 'black', 0.4]]);
  const GUNAT = tt.gun2 + 0.3;
  const SFX = [[tt.day, 'drum', 0], [GUNAT, 'shell', 1], [tt.fell, 'drum', 0], [tt.joined, 'drum', 0], [tt.cta, 'drum', 0], [END - 1.3, 'end', 0]];

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  root.innerHTML = `
    <canvas id="f12-cine" width="135" height="240"></canvas>
    <div id="f12-day">DAY <b>12</b></div>
    ${dogShots.map((d, i) => `<div id="f12-d${i}" class="f12-tag">🐕 ${(dogName[d.handle] || '').toUpperCase()}<small>${BREED[d.dog] || ''} · with @${d.handle}</small></div>`).join('')}
    <div id="f12-gun" class="f12-tag dead">THE GREY MILL GUN<small>3 hit · 3 killed outright</small></div>
    <div id="f12-fell" class="f12-panel"><div class="t">DAY 12 · CASUALTIES</div><div class="row"><span>HEGEMONY</span><b class="r">${D.fell[0]} FELL</b></div><div class="row"><span>CONCORD</span><b class="r">${D.fell[1]} FELL</b></div><div class="note">Concord medics reached ${D.cover[1]}% · Hegemony ${D.cover[0]}%</div></div>
    <div id="f12-wiz" class="f12-tag">BASTIAN WIZZERD<small>Propagandist of the Concord · @flying_wizzerd</small></div>
    <div id="f12-lfer" class="f12-tag">★ BENEDIKT LFER<small>Officers' Mess · @w0lfer2210</small></div>
    <div id="f12-race" class="f12-panel"><div class="t">THE RACE FOR THE BONE QUARRY</div>
      <div class="row"><span>CONCORD</span><b>${D.race[1]}</b></div><div class="bar"><i style="width:${D.race[1] / 3}%;background:#8a8a52"></i></div>
      <div class="row"><span>HEGEMONY</span><b>${D.race[0]}</b></div><div class="bar"><i style="width:${D.race[0] / 3}%;background:#8f8a82"></i></div>
      <div class="note">first to 300 new soldiers digs a mine under the enemy line</div></div>
    <div id="f12-big"><div class="k">ON THE FRONT NOW</div><b>0</b><div class="p">+336 yesterday</div></div>
    <div id="f12-side"><span></span></div>
    <div id="f12-cta"><div class="big">COMMENT<br>HEGEMONY OR CONCORD</div><div class="sm">your soldier is real · free game<br>Trench Dogs: Field Post on Patreon</div><div class="url">mudandiron.app</div></div>
    <div id="rd-big"></div>
    <div id="rd-sub"></div>
  `;
  document.body.appendChild(root);
  const paint = fxLayers(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };
  const dc = await makeDogCine(tex);
  const cv = makeVertCine(tex, anims), rc = makeRaceScenes(tex, anims), pb = makePillboxScenes(tex);
  for (const [c, id] of [[cv, 'f12-cv'], [rc, 'f12-rc'], [pb, 'f12-pb']]) { c.canvas.id = id; root.insertBefore(c.canvas, $('#f12-cine').nextSibling); }
  const out = $('#f12-cine'), og = out.getContext('2d');
  og.imageSmoothingEnabled = false;
  let fired = false;

  function frame(t) {
    const f = fx(t);
    const [x, y, z] = camAt(t);
    cam.set(x, y, z * (1 + 0.05 * f.punch));
    for (const q of soldiers) if (q.sprite && q.vacant && q.sprite.alpha < 1) q.sprite.alpha = 1;
    if (!fired && t >= GUNAT && gunFx) { gunFx.fire(); fired = true; }
    // filmové záběry: příchod psů, pět psů na valu, baterie v noci, hroby, lazaret, štola s minou, posily
    const LINE = tt.dogs2 + 1.8;
    const film = t < tt.dogs2 ? ['dog', 'arrive', t, { breed: 'shepherd', flare: 2.4 }]
      : t < LINE ? ['dog', 'lineup', t - tt.dogs2 + 1, {}]
      : t >= tt.gun && t < tt.gun2 ? ['pb', 'guns', t - tt.gun + 0.25, {}]
      : t >= tt.fell && t < tt.why ? ['rc', 'graves', t - tt.fell + 1, { side: 1, n: D.fell[0] + D.fell[1], sub: 'ONE DAY ON THE FRONT' }]
      : t >= tt.why && t < tt.wiz ? ['cv', 'ward', t - tt.why + 1, {}]
      : t >= tt.race2 && t < tt.joined ? ['cv', 'mine', t - tt.race2 + 0.5, {}]
      : t >= tt.joined && t < tt.army ? ['rc', 'march', t - tt.joined + 1, { side: 1, n: D.joined[0] + D.joined[1], flag: '+' + (D.joined[0] + D.joined[1]) }] : null;
    if (film?.[0] === 'dog') { dc.draw(film[1], film[2], film[3]); og.clearRect(0, 0, 135, 240); og.drawImage(dc.canvas, 0, 0); }
    if (film?.[0] === 'cv') cv.draw(film[1], film[2], film[3]);
    if (film?.[0] === 'rc') rc.draw(film[1], film[2], film[3]);
    if (film?.[0] === 'pb') pb.draw(film[1], film[2]);
    show('#f12-cine', film?.[0] === 'dog' ? 1 : 0); show('#f12-cv', film?.[0] === 'cv' ? 1 : 0); show('#f12-rc', film?.[0] === 'rc' ? 1 : 0); show('#f12-pb', film?.[0] === 'pb' ? 1 : 0);
    paint({ ...f, black: Math.max(f.black, t > END - 0.6 ? clamp01((t - END + 0.6) / 0.5) : 0) }, 0);
    show('#f12-day', win(t, 0.2, tt.dogs - 0.1, 0.2));
    dogShots.forEach((d, i) => { const t0 = DOG0 + i * dSpan; tagAt($(`#f12-d${i}`), { x: d.x + 11, y: d.y }, cam, win(t, t0 + 0.15, t0 + dSpan - 0.05, 0.1), 24); });
    if (gun) tagAt($('#f12-gun'), { x: gun.x, y: gun.y - 20 }, cam, win(t, GUNAT + 0.2, tt.fell - 0.05, 0.12), 0);
    slam($('#f12-fell'), t, tt.why + 0.2, tt.wiz - 0.05, 1.3, -2);
    if (wiz) tagAt($('#f12-wiz'), { x: wiz.x, y: wiz.y - 30 }, cam, win(t, tt.wiz + 0.2, tt.bonds - 0.05, 0.12), 0);
    if (lfer) tagAt($('#f12-lfer'), { x: lfer.x, y: lfer.y - 30 }, cam, win(t, tt.bonds + 0.2, tt.race - 0.05, 0.12), 0);
    slam($('#f12-race'), t, tt.race + 0.2, tt.race2 - 0.05, 1.3, -2);
    const bigOn = t >= tt.army && t < tt.armyH, pre = false;
    $('#f12-big .k').textContent = pre ? 'CAME UP YESTERDAY' : 'ON THE FRONT NOW'; $('#f12-big .p').style.opacity = pre ? 0 : 1;
    show('#f12-big', bigOn ? 1 : 0);
    $('#f12-big b').textContent = pre ? '+' + (D.joined[0] + D.joined[1]) : Math.round((D.army[0] + D.army[1]) * easeOut(clamp01((t - tt.army) / 1.2))).toLocaleString('en-US');
    const side = t >= tt.armyH && t < tt.cta ? (t < tt.armyC ? 0 : 1) : -1;
    show('#f12-side', side >= 0 ? 1 : 0);
    if (side >= 0) $('#f12-side span').innerHTML = `${side ? 'CONCORD' : 'HEGEMONY'}<b>${D.army[side].toLocaleString('en-US')}</b>`;
    slam($('#f12-cta'), t, tt.cta + 0.2, END - 1.3, 1.25, -2);
    const logo = t >= END - 1.3;
    const bigEl = $('#rd-big');
    bigEl.style.opacity = logo ? Math.min(1, (t - END + 1.3) / 0.3) : 0;
    if (logo && !bigEl.dataset.on) { bigEl.dataset.on = 1; bigEl.className = 'logo'; bigEl.innerHTML = '<span>MUD <i>&amp;</i> IRON</span><span>@mudandiron · mudandiron.app</span>'; }
    const s = sub(t);
    const subEl = $('#rd-sub');
    if (s && !logo && t >= tt.dogs) { subEl.style.opacity = 1; const subTop = film && (film[1] === 'guns' || film[1] === 'march'); subEl.style.top = subTop ? '9%' : 'auto'; subEl.style.bottom = subTop ? 'auto' : '13%'; if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; } } else subEl.style.opacity = 0;
  }
  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
