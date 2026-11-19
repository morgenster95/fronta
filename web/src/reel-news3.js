// FRONT NEWS, epizoda Day 3 (11. 11. 2026, YouTube 16:9; /?reel=news3&vacant=700, jen vývojový server). Navazuje na Day 2 („Next time: the ridge falls“).
// Jiný začátek než Day 1 (znělka) a Day 2 (odstřelovač): noc, spojka Concordu běží zákopem s číslem 100 (kreslený detail, web/src/cine-trench.js).
// Dál: pád Verdel Ridge (hodiny a počty podle skutečných časů náboru, kuchař Lucien Jro), děla na hřebeni (detail), dopady na linii Hegemonie (ve hře,
// jen v záběru: nic neletí přes celou frontu), lazaret při dohasínající lampě (detail), výstřel Edmunda Potata a pád Henrika Eccentricreda (dva záběry, střih),
// první padlí války, déšť a 72 nováčků, závod o Hill 304. Data: marketing/reels/news3.data.json (tools/news-data.mjs), hlas news3.script.json.
import { cues, camPath, subtitles, transitions, fxLayers, clamp01 } from './reel-kit.js';
import { NEWS_CSS, makeNewsUI } from './news-kit.js';
import { makeFight } from './fight-fx.js';
import { makeTrenchCine } from './cine-trench.js';
import script from '../../marketing/reels/news3.script.json';
import data from '../../marketing/reels/news3.data.json';

const files = import.meta.glob('../../marketing/reels/news3.vo.json', { eager: true, import: 'default' });
const TICKER = 'DAY 3 · VERDEL RIDGE FALLS TO THE CONCORD · GUNS ON THE HEGEMONY LINE · FIRST DEAD OF THE WAR · +72 NEW SOLDIERS · HILL 304: HEGEMONY 24 · CONCORD 20 · ENLIST: COMMENT HEGEMONY OR CONCORD ON @MUDANDIRON · ';

export async function startNews3Reel({ cam, life, map, soldiers, tex, anims }) {
  let vo = files['../../marketing/reels/news3.vo.json'];
  if (!vo) {
    let c = 0;
    vo = { lines: script.lines.map(([at, text, id]) => { const s = Math.max(at, c), d = text.length / 14 + 0.2; c = s + d + 0.3; return [s, d, text, id]; }) };
    vo.seconds = c + 3;
  }
  const C = cues(vo);
  const at = C.at, END = vo.seconds;
  const T = map.tile;
  const tt = Object.fromEntries(script.lines.map((l) => [l[2], at(l[2])]));
  const by = (h) => soldiers.find((s) => s.handle === h);
  const mid = ((map.front[0] + map.front[1]) / 2) * T;
  const P = Object.fromEntries(['jro_se11', 'boiled_potato31', 'eccentricredeye', 'yoollyfox', 'jewnipers', 'wolfmanantony', 'rayan.zulfi', 'brunoescobar36'].map((h) => [h, by(h)]));
  const anyH = soldiers.find((s) => s.faction === 0 && !s.vacant && s.slot?.line === 'front'), anyC = soldiers.find((s) => s.faction === 1 && !s.vacant && s.slot?.line === 'front');
  const jro = P.jro_se11 || anyC, pot = P.boiled_potato31 || anyH, ecc = P.eccentricredeye || anyC;
  const hRef = P.yoollyfox || anyH;

  // na mapě jen vojáci, kteří v tu dobu byli na frontě; nábor běží podle skutečných časů (večer do pádu hřebene, pak noc do rána)
  const joinAt = new Map(data.joins.map(([t, h]) => [h, Date.parse(t)]));
  const T0 = Date.parse('2026-11-11T13:00:00Z'), TR = Date.parse('2026-11-11T21:57:25Z'), T1 = Date.parse('2026-11-12T12:45:00Z');
  const clockOf = (t) => (t < tt.ridge ? TR - 180e3 : t < tt.ridge2 ? T0 + (TR - T0) * clamp01((t - tt.ridge) / (tt.ridge2 - tt.ridge - 0.4))
    : t < tt.rain ? TR : t < tt.hill ? TR + (T1 - TR) * clamp01((t - tt.rain) / (tt.hill - tt.rain - 0.4)) : T1);
  const curve = data.curve.map(([t, h, c]) => [Date.parse(t), h, c]);
  const countAt = (ms) => { let r = [82, 84]; for (const [x, h, c] of curve) if (x <= ms) r = [h, c]; return r; };
  const shownAt = (q, t) => !q.vacant && joinAt.has(q.handle) && joinAt.get(q.handle) <= clockOf(t);

  // výstřel a pád: dva záběry se střihem, puppet místo skutečného vojáka (padne a zůstane ležet)
  const fight = await makeFight({ anims, soldiers, tex });
  if (pot) fight.puppet({ x: pot.x, y: pot.y, from: tt.shot, to: tt.shot2, hide: pot, keys: [{ t0: tt.shot, key: 'hegemony', anim: 'fire', dir: 'south', fps: 6, loop: true }] }); // Potato tehdy stál a střílel (dnes je raněný)
  if (ecc) fight.puppet({ x: ecc.x, y: ecc.y, from: tt.shot2, to: tt.dead, hide: ecc, keys: [{ t0: tt.shot2, key: ecc.faction ? 'concord' : 'hegemony', anim: 'die', dir: 'north', fps: 8 }] });

  // dopady granátů na linii Hegemonie: jen v okolí kamery (záběr se pohybuje pomalu podél linie)
  const shells = [];
  for (let t = tt.guns2 + 0.3, k = 0; t < tt.ward - 0.2; t += 0.55 + ((k * 37) % 5) * 0.12, k++) shells.push([t, ((k * 53) % 11) / 10 - 0.5, ((k * 29) % 7) / 6, k % 3 === 0]);
  let si = 0;

  // kamera
  const tR1 = tt.ridge1, tG3 = tt.guns3;
  const K = [[tt.ridge, jro.x - 260, jro.y - 10, 1.9, 'cut'], [tt.ridge2 - 0.01, jro.x + 60, jro.y - 10, 2.1], [tt.ridge2, jro.x, jro.y - 14, 4.4, 'cut'], [tt.guns - 0.01, jro.x + 6, jro.y - 14, 4.9]];
  K.push([tt.guns2, hRef.x - 220, hRef.y - 20, 2.2, 'cut'], [tG3 - 0.01, hRef.x + 40, hRef.y - 20, 2.3], [tG3, hRef.x + 40, mid - 20, 1.6, 'cut'], [tt.ward - 0.01, hRef.x + 200, mid - 20, 1.7]);
  K.push([tt.shot, pot.x, pot.y - 14, 4.6, 'cut'], [tt.shot2 - 0.01, pot.x + 4, pot.y - 14, 5.0], [tt.shot2, ecc.x, ecc.y - 14, 4.8, 'cut'], [tt.dead - 0.01, ecc.x, ecc.y - 12, 5.4]);
  K.push([tt.dead, mid ? hRef.x : 0, mid, 1.2, 'cut'], [tt.rain - 0.01, hRef.x + 140, mid, 1.25]);
  K.push([tt.rain, hRef.x - 300, hRef.y - 10, 2.2, 'cut'], [(tt.rain + tt.hill) / 2 - 0.01, hRef.x + 80, hRef.y - 10, 2.3], [(tt.rain + tt.hill) / 2, jro.x + 300, jro.y - 10, 2.2, 'cut'], [tt.hill - 0.01, jro.x - 80, jro.y - 10, 2.3]);
  K.push([tt.hill, hRef.x - 300, mid - 30, 1.4, 'cut'], [tt.out, hRef.x + 300, mid - 30, 1.5], [END, hRef.x + 340, mid - 30, 1.55]);
  const camK = camPath(K);
  const camAt = (t) => (t < tt.ridge ? [jro.x, jro.y, 2] : camK(t));
  const sub = subtitles(vo);
  const tRainMid = (tt.rain + tt.hill) / 2;
  const fx = transitions([[tt.ident, 'black', 0.5], [tt.ridge, 'black', 0.5], [tt.ridge2, 'whip'], [tt.guns, 'black', 0.5], [tt.guns2, 'flash'], [tG3, 'whip'], [tt.ward, 'black', 0.6],
    [tt.shot, 'black', 0.5], [tt.shot2, 'flash'], [tt.dead, 'black', 0.6], [tt.rain, 'black', 0.5], [tRainMid, 'whip'], [tt.hill, 'black', 0.5], [tt.out, 'black', 0.6]]);
  const SHOT = tt.shot2 - 0.25;
  const SFX = [[tt.ident, 'drum', 0], [SHOT, 'shoot', 0], [tt.dead, 'drum', 0], [tt.hill, 'drum', 0], [END - 1.5, 'end', 0]];
  for (let k = 0; k < 6; k++) SFX.push([+(tt.guns + 0.6 + k * 1.6).toFixed(2), 'shoot', 0]);
  for (const [t, , , big] of shells) if (big) SFX.push([+t.toFixed(2), 'stamp', 0]);

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = NEWS_CSS + `
#rn-rain { inset: 0; width: 100%; height: 100%; opacity: 0; image-rendering: pixelated; }
#rn-board .names { font-size: 24px; text-align: center; line-height: 1.25; color: #e3d9c3; margin-top: 6px; }`;
  document.head.appendChild(style);
  const lts = [
    [tt.ridge2 + 0.3, tt.guns - 0.1, 'LUCIEN "SHADOW" JRO', '@jro_se11 · CONCORD COOK · THE HUNDREDTH MAN'],
    [tt.shot + 0.3, tt.shot2 - 0.1, 'EDMUND POTATO', '@boiled_potato31 · HEGEMONY RIFLEMAN'],
    [tt.shot2 + 0.4, tt.dead - 0.1, 'HENRIK ECCENTRICRED', '@eccentricredeye · CONCORD · FELL AT S-F16'],
  ];
  const boards = [
    [tR1 + 0.3, tt.ridge2 - 0.1, `<div class="t">THE RACE FOR VERDEL RIDGE · 21:57</div><div class="row"><span>CONCORD</span><b>100</b></div><div class="bar"><i style="width:100%;background:#8a8a52"></i></div><div class="row"><span>HEGEMONY</span><b>94</b></div><div class="bar"><i style="width:94%;background:#8f8a82"></i></div><div class="note">the Concord takes the heights</div>`],
    [tG3 + 0.3, tt.ward - 0.1, `<div class="t">NIGHT ONE UNDER THE GUNS</div><div class="row"><span>HEGEMONY MEN HIT</span><b>15</b></div><div class="row"><span>BADLY</span><b>9</b></div><div class="note">the wire in front of them torn to shreds</div>`],
    [tt.dead + 0.3, tt.rain - 0.1, `<div class="t">THE FIRST FALLEN</div><div class="row"><span>HEGEMONY</span><b>5</b></div><div class="row"><span>CONCORD</span><b>1</b></div><div class="names">Pavel Zulfi · Bram Yoollyfox · Nils Wolfmananton<br>Oskar Brunoescobar · Lucien Jewnipers<br>Henrik Eccentricred</div>`],
    [tt.hill + 0.3, tt.out - 0.1, `<div class="t">THE RACE FOR HILL 304</div><div class="row"><span>HEGEMONY</span><b>24</b></div><div class="bar"><i style="width:24%;background:#8f8a82"></i></div><div class="row"><span>CONCORD</span><b>20</b></div><div class="bar"><i style="width:20%;background:#8a8a52"></i></div><div class="note">first to 100 new soldiers takes the hill</div>`],
  ];
  const chapters = [[tt.ridge, 'THE RIDGE'], [tt.guns, 'THE GUNS'], [tt.ward, 'THE FIRST DEAD'], [tt.rain, 'THE RAIN'], [tt.hill, 'HILL 304']];
  const ui = makeNewsUI({ day: 3, ticker: TICKER, chapters, lts, boards });
  document.body.appendChild(ui.root);
  const ct = makeTrenchCine(tex, anims);
  ct.canvas.id = 'rn-film';
  ui.root.prepend(ct.canvas);
  // déšť přes obraz hry (kapitola THE RAIN)
  const rainC = document.createElement('canvas'); rainC.id = 'rn-rain'; rainC.width = 240; rainC.height = 135;
  ui.root.insertBefore(rainC, ui.root.querySelector('#rn-grain'));
  const rg = rainC.getContext('2d');
  const paint = fxLayers(ui.root);
  const game = document.querySelector('canvas');
  life.debug.quiet?.(true);
  const fmt = (ms) => { const d = new Date(ms); return `NOV ${d.getUTCDate()} · ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`; };
  let shotDone = false;

  function frame(t) {
    const f = fx(t);
    fight.update(t);
    for (const q of soldiers) if (q.sprite) { if (q.vacant && q.sprite.alpha < 1) q.sprite.alpha = 1; q.sprite.visible = shownAt(q, t); }
    const [x, y, z] = camAt(t);
    cam.set(x, y, z);
    // dopady jen kolem záběru (x podle kamery, y na linii Hegemonie a v drátu před ní)
    while (si < shells.length && shells[si][0] <= t) { const [, dx, dy, big] = shells[si]; life.debug.shell?.(x + dx * 420, hRef.y + 10 - dy * 70, big); si++; }
    if (!shotDone && t >= SHOT && pot) { life.debug.shoot([pot]); shotDone = true; }
    const film = t < tt.ident ? ['runner', t, { storm: false }] : t >= tt.guns && t < tt.guns2 ? ['battery', t - tt.guns, {}]
      : t >= tt.ward && t < tt.shot ? ['ward', t - tt.ward, { dim: clamp01((t - tt.ward) / (tt.ward2 - tt.ward + 1.5)) * 0.45 }] : null;
    if (film) ct.draw(film[0], film[1], film[2]);
    ui.show('#rn-film', film ? 1 : 0);
    const raining = t >= tt.rain && t < tt.hill;
    ui.show('#rn-rain', raining ? 1 : 0);
    if (raining) { rg.clearRect(0, 0, 240, 135); rg.fillStyle = 'rgba(170,180,195,0.45)'; for (let k = 0; k < 90; k++) { const p = (k * 0.618) % 1, q = (k * 0.754) % 1, yy = ((q * 170 + t * 220) % 150) - 8; rg.fillRect(Math.round((p * 240 - yy * 0.25 + 240) % 240), Math.round(yy), 1, 3); } }
    const night = (t >= tt.ridge && t < tt.dead) || raining;
    if (game) game.style.filter = 'sepia(0.22) contrast(1.06) saturate(0.9)';
    paint({ ...f, black: Math.max(f.black, t > END - 0.6 ? clamp01((t - END + 0.6) / 0.5) : 0) }, 0);
    const ms = clockOf(t), cnt = countAt(ms);
    const ident = t >= tt.ident && t < tt.ridge - 0.25 ? { date: 'NOVEMBER 11 · DAY 3 OF THE WAR' } : t >= tt.out + 0.4 ? { date: 'NEXT: THE GUNS DO NOT STOP' } : null;
    const clockOn = (t >= tt.ridge && t < tt.ridge2 - 0.1) || (t >= tt.rain && t < tt.hill - 0.1);
    ui.update(t, {
      ident, night, sub: sub(t), hideChrome: t < tt.ident,
      clock: clockOn ? { t: fmt(ms), c: `<b>HEGEMONY ${cnt[0]}</b> · <u>CONCORD ${cnt[1]}</u>` } : null,
    });
  }

  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
