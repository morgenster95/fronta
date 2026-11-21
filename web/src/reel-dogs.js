// Reel „Trench Dogs“ (21. 11. 2026, novinka na Instagram, na výšku; /?reel=dogs&vacant=700, jen vývojový server).
// Jemné představení psů pro patrony od Field Post: příchod psa v noci (cine-dogs 'arrive') → TRENCH DOGS → pět plemen zblízka ('breed')
// → všichni na valu ('lineup') → skuteční psi patronů ve hře (jméno psa a vojáka, bez v01py: nechce, aby se o podpoře vědělo)
// → skutečný zápis z deníku (Blue a Anselm Rakan, marketing/reels/dogs.data.json) → pes čeká u hrobu a přijde nový voják rodu ('family') → Patreon od Field Post, hra zdarma.
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, slam, clamp01, win, tagAt } from './reel-kit.js';
import { makeDogCine, BREEDS } from './cine-dogs.js';
import script from '../../marketing/reels/dogs.script.json';
import data from '../../marketing/reels/dogs.data.json';

const files = import.meta.glob('../../marketing/reels/dogs.vo.json', { eager: true, import: 'default' });
const NAMES = ['AIREDALE', 'GERMAN SHEPHERD', 'JACK RUSSELL', 'BORDER COLLIE', 'DACHSHUND'];
const HIDE = new Set(['v01py']); // nechce, aby se vědělo, že podporuje

const CSS = `${BASE}${FX_CSS}
#dg-cine { inset: 0; width: 100%; height: 100%; image-rendering: pixelated; opacity: 0; }
#dg-title { left: 0; right: 0; top: 16%; text-align: center; font-family: 'Silkscreen', monospace; color: #e3d9c3; text-shadow: 6px 6px 0 #0e0d0c; opacity: 0; }
#dg-title .k { font-size: 30px; letter-spacing: 0.25em; color: #d98f3f; }
#dg-title b { display: block; font-size: 96px; font-weight: 400; line-height: 1; margin-top: 10px; }
#dg-breed { left: 0; right: 0; top: 76%; text-align: center; font-family: 'Silkscreen', monospace; font-size: 54px; color: #e3d9c3; text-shadow: 5px 5px 0 #0e0d0c; opacity: 0; }
#dg-breed small { display: block; font-size: 26px; color: #d98f3f; letter-spacing: 0.2em; }
.dg-tag { position: absolute; transform: translate(-50%, -100%); font-family: 'Silkscreen', monospace; font-size: 26px; padding: 6px 12px; background: rgba(14,13,12,0.92); border: 3px solid #d98f3f; white-space: nowrap; color: #e3d9c3; opacity: 0; text-align: center; }
.dg-tag small { display: block; font-family: 'VT323', monospace; font-size: 26px; color: #c9b99a; }
#dg-diary { left: 9%; right: 9%; top: 16%; background: #e3d9c3; color: #2b2722; border: 4px solid #0e0d0c; box-shadow: 10px 10px 0 rgba(14,13,12,0.6); padding: 26px 28px; font-family: 'VT323', monospace; font-size: 38px; line-height: 1.15; opacity: 0; transform: rotate(-1.5deg); }
#dg-diary .h { font-family: 'Silkscreen', monospace; font-size: 20px; color: #7e3b2a; letter-spacing: 0.12em; margin-bottom: 10px; }
#dg-cta { left: 6%; right: 6%; top: 50%; text-align: center; background: rgba(14,13,12,0.95); border: 4px solid #d98f3f; padding: 18px 16px; opacity: 0; }
#dg-cta .k { font-family: 'Silkscreen', monospace; font-size: 20px; color: #c9b99a; letter-spacing: 0.2em; }
#dg-cta .big { font-family: 'Silkscreen', monospace; font-size: 44px; color: #d98f3f; line-height: 1.1; margin: 6px 0; }
#dg-cta .sm { font-family: 'VT323', monospace; font-size: 32px; color: #e3d9c3; }
#dg-cta .url { font-family: 'Silkscreen', monospace; font-size: 21px; color: #e3d9c3; margin-top: 10px; border-top: 2px solid #524a3f; padding-top: 10px; }
`;

export async function startDogsReel({ cam, map, soldiers, tex }) {
  let vo = files['../../marketing/reels/dogs.vo.json'];
  if (!vo) {
    let c = 0;
    vo = { lines: script.lines.map(([at, text, id]) => { const s = Math.max(at, c), d = text.length / 14 + 0.25; c = s + d + 0.25; return [s, d, text, id]; }) };
    vo.seconds = c + 2.6;
  }
  const C = cues(vo);
  const at = C.at, END = vo.seconds;
  const T = map.tile;
  const tt = Object.fromEntries(script.lines.map((l) => [l[2], at(l[2])]));
  const mid = ((map.front[0] + map.front[1]) / 2) * T;
  // skuteční psi patronů ve hře (bez v01py); pořadí: ovčák Blue, pak další
  const pats = data.filter((d) => !HIDE.has(d.handle)).sort((a, b) => (a.handle === 'rakan_1027' ? -1 : b.handle === 'rakan_1027' ? 1 : 0));
  const onMap = pats.map((d) => ({ d, s: soldiers.find((q) => q.handle === d.handle && q.slot) })).filter((x) => x.s).slice(0, 3);
  const story = (pats.find((d) => d.handle === 'rakan_1027') || pats[0])?.story || '';
  const storyWho = pats.find((d) => d.handle === 'rakan_1027') || pats[0];
  const tMap2 = tt.map2;
  const shots = onMap.length ? onMap : [{ s: soldiers.find((q) => q.slot && !q.vacant) || soldiers[0], d: null }];
  const span = (tt.diary - tt.map) / shots.length;
  const K = [];
  shots.forEach((x, i) => { const t0 = tt.map + i * span; K.push([t0, x.s.x - 20, x.s.y - 16, 4.6, 'cut'], [t0 + span - 0.01, x.s.x + 16, x.s.y - 16, 5.0]); });
  K.push([tt.diary, shots[0].s.x, mid, 1.5, 'cut'], [END, shots[0].s.x + 100, mid, 1.5]);
  const camAt = camPath(K);
  const sub = subtitles(vo);
  const fx = transitions([[tt.title, 'flash'], [tt.b0, 'black', 0.4], [tt.map, 'black', 0.5], [tt.diary, 'black', 0.5], [tt.family, 'black', 0.6], [tt.cta, 'black', 0.5]]);
  const SFX = [[tt.title, 'drum', 0], [tt.cta, 'drum', 0], [END - 1.3, 'end', 0]];
  for (const k of ['b0', 'b1', 'b2', 'b3', 'b4']) SFX.push([+tt[k].toFixed(2), 'stamp', 0]);

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  root.innerHTML = `
    <canvas id="dg-cine" width="135" height="240"></canvas>
    <div id="dg-title"><div class="k">NEW ON THE FRONT</div><b>TRENCH<br>DOGS</b></div>
    <div id="dg-breed"><small>BREED</small><span></span></div>
    ${shots.map((x, i) => `<div class="dg-tag" id="dg-t${i}">🐕 ${x.d ? x.d.dog.name.toUpperCase() : ''}<small>${x.d ? `with ${x.d.name}` : ''}</small></div>`).join('')}
    <div id="dg-diary"><div class="h">SERVICE RECORD · ${storyWho ? storyWho.name.toUpperCase() : ''}</div><div class="tx"></div></div>
    <div id="dg-cta"><div class="k">ON PATREON</div><div class="big">TRENCH DOGS</div><div class="sm">with Field Post and Officers' Mess<br>the game stays free</div><div class="url">patreon.com/cw/MudandIron</div></div>
    <div id="rd-big"></div>
    <div id="rd-sub"></div>
  `;
  document.body.appendChild(root);
  const paint = fxLayers(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };
  const dc = await makeDogCine(tex);
  const out = $('#dg-cine'), og = out.getContext('2d');
  og.imageSmoothingEnabled = false;
  const breedAt = (t) => (t < tt.b1 ? 0 : t < tt.b2 ? 1 : t < tt.b3 ? 2 : t < tt.b4 ? 3 : 4);

  function frame(t) {
    const f = fx(t);
    const [x, y, z] = camAt(t);
    cam.set(x, y, z);
    for (const q of soldiers) if (q.sprite && q.vacant && q.sprite.alpha < 1) q.sprite.alpha = 1;
    const film = t < tt.b0 ? ['arrive', t, { breed: 'shepherd', flare: 2.6 }] : t < tt.map - 0.05 ? (t < tt.b4 + 1.6 ? ['breed', t, { i: breedAt(t) }] : ['lineup', t, {}])
      : t >= tt.diary && t < tt.family ? ['diary', t - tt.diary, { breed: 'shepherd' }] : t >= tt.family && t < tt.cta ? ['family', t - tt.family, { breed: 'collie', next: 2.6 }]
      : t >= tt.cta ? ['lineup', t, {}] : null;
    if (film) { dc.draw(film[0], film[1], film[2]); og.clearRect(0, 0, 135, 240); og.drawImage(dc.canvas, 0, 0); }
    show('#dg-cine', film ? 1 : 0);
    paint({ ...f, black: Math.max(f.black, t > END - 0.6 ? clamp01((t - END + 0.6) / 0.5) : 0) });
    slam($('#dg-title'), t, tt.title, tt.b0 - 0.1, 1.3, -3);
    const bOn = t >= tt.b0 && t < tt.b4 + 1.6;
    show('#dg-breed', bOn ? 1 : 0);
    if (bOn) $('#dg-breed span').textContent = NAMES[breedAt(t)];
    shots.forEach((sh, i) => { const t0 = tt.map + i * span; tagAt($(`#dg-t${i}`), { x: sh.s.x + 11, y: sh.s.y }, cam, sh.d ? win(t, t0 + 0.3, t0 + span - 0.15, 0.15) : 0, 26); });
    const dOn = t >= tt.diary + 0.3 && t < tt.family - 0.1;
    show('#dg-diary', dOn ? 1 : 0);
    if (dOn) { const n = Math.floor(story.length * clamp01((t - tt.diary - 0.4) / Math.max(1, tt.family - tt.diary - 1.6))); $('#dg-diary .tx').textContent = story.slice(0, n); }
    slam($('#dg-cta'), t, tt.cta + 0.2, END - 1.3, 1.25, -2);
    const logo = t >= END - 1.3;
    const bigEl = $('#rd-big');
    bigEl.style.opacity = logo ? Math.min(1, (t - END + 1.3) / 0.3) : 0;
    if (logo && !bigEl.dataset.on) { bigEl.dataset.on = 1; bigEl.className = 'logo'; bigEl.innerHTML = '<span>MUD <i>&amp;</i> IRON</span><span>@mudandiron · mudandiron.app</span>'; }
    const s = sub(t);
    const subEl = $('#rd-sub');
    if (s && !logo && !dOn && t >= tt.title) { subEl.style.opacity = 1; subEl.style.top = t < tt.map && t >= tt.b0 ? '8%' : '84%'; if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; } } else subEl.style.opacity = 0;
  }
  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
