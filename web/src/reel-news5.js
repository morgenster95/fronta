// FRONT NEWS, epizoda Day 5 (13.–14. 11. 2026, YouTube 16:9; /?reel=news5&vacant=700, jen vývojový server). Navazuje na Day 4 („Next time: the hill“).
// Studený začátek: rozkaz WIRE na stěně zákopu (cine-trench 'order'). Dál: první drátařské čety (stavba drátu 'picket', světlice 'wire'), poslední noc děl z Verdel Ridge
// (dopady ve hře jen v záběru), přeplněná Hegemonie (ranění v zákopu 'trenchwounded'), výstřel Edmunda Owenharta (Concord, den po smrti Felixe Owenharta)
// a pád Doriana Coletonmartiho (ve hře, dva záběry), padlí, 47 nováčků, závod o Hill 304 97 : 79. Data: news5.data.json, hlas news5.script.json.
import { cues, camPath, subtitles, transitions, fxLayers, clamp01 } from './reel-kit.js';
import { NEWS_CSS, makeNewsUI } from './news-kit.js';
import { makeFight } from './fight-fx.js';
import { makeTrenchCine } from './cine-trench.js';
import script from '../../marketing/reels/news5.script.json';
import data from '../../marketing/reels/news5.data.json';

const files = import.meta.glob('../../marketing/reels/news5.vo.json', { eager: true, import: 'default' });
const TICKER = 'DAY 5 · FIRST WIRING PARTIES: 67 VOLUNTEERS · 1,059 YARDS OF NEW WIRE · LAST NIGHT OF THE GUNS ON VERDEL RIDGE · HEGEMONY MEDICS REACH 40% · CONCORD: NO ONE FELL · HILL 304: HEGEMONY 97 · CONCORD 79 · ENLIST: COMMENT HEGEMONY OR CONCORD ON @MUDANDIRON · ';

export async function startNews5Reel({ cam, life, map, soldiers, tex, anims }) {
  let vo = files['../../marketing/reels/news5.vo.json'];
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
  const real = soldiers.filter((s) => !s.vacant && s.handle);
  const frontH = real.filter((s) => s.faction === 0 && s.slot?.line === 'front').sort((a, b) => a.x - b.x);
  const frontC = real.filter((s) => s.faction === 1 && s.slot?.line === 'front').sort((a, b) => a.x - b.x);
  const hRef = frontH[Math.floor(frontH.length * 0.55)] || real[0], cRef = frontC[Math.floor(frontC.length * 0.45)] || real[0];
  const owe = by('owenhart247') || cRef, col = by('coletonmartin') || hRef;

  const joinAt = new Map(data.joins.map(([t, h]) => [h, Date.parse(t)]));
  const T0 = Date.parse('2026-11-13T13:00:00Z'), T1 = Date.parse('2026-11-14T12:45:00Z');
  const clockOf = (t) => (t < tt.new ? T0 : t < tt.hill ? T0 + (T1 - T0) * clamp01((t - tt.new) / (tt.hill - tt.new - 0.4)) : T1);
  const curve = data.curve.map(([t, h, c]) => [Date.parse(t), h, c]);
  const countAt = (ms) => { let r = [170, 150]; for (const [x, h, c] of curve) if (x <= ms) r = [h, c]; return r; };
  const shownAt = (q, t) => !q.vacant && joinAt.has(q.handle) && joinAt.get(q.handle) <= clockOf(t);

  // výstřel a pád: puppet místo skutečného vojáka (dnes na jejich místech slouží nástupci)
  const fight = await makeFight({ anims, soldiers, tex });
  fight.puppet({ x: owe.x, y: owe.y, from: tt.shot, to: tt.shot2, hide: owe, keys: [{ t0: tt.shot, key: 'concord', anim: 'fire', dir: 'north', fps: 6, loop: true }] });
  fight.puppet({ x: col.x, y: col.y, from: tt.shot2, to: tt.dead, hide: col, keys: [{ t0: tt.shot2 + 1.2, key: 'hegemony', anim: 'die', dir: 'west', fps: 8 }] });

  const shells = [];
  for (let t = tt.guns + 0.3, k = 0; t < tt.guns2 - 0.3; t += 0.5 + ((k * 37) % 5) * 0.12, k++) shells.push([t, ((k * 53) % 11) / 10 - 0.5, ((k * 29) % 7) / 6, k % 3 === 0]);
  let si = 0;

  const wy = hRef.y + (mid - hRef.y) * 0.45;
  const K = [[tt.guns, hRef.x - 240, hRef.y - 16, 2.2, 'cut'], [tt.guns2 - 0.01, hRef.x + 60, hRef.y - 16, 2.3], [tt.guns2, hRef.x - 100, wy, 2.6, 'cut'], [tt.ward - 0.01, hRef.x + 160, wy, 2.8]];
  K.push([tt.shot, owe.x, owe.y - 14, 4.6, 'cut'], [tt.shot2 - 0.01, owe.x + 4, owe.y - 14, 5.0], [tt.shot2, col.x, col.y - 14, 4.8, 'cut'], [tt.dead - 0.01, col.x, col.y - 12, 5.4]);
  K.push([tt.dead, hRef.x, mid, 1.15, 'cut'], [tt.new - 0.01, hRef.x + 160, mid, 1.2]);
  const tNewMid = (tt.new + tt.hill) / 2;
  K.push([tt.new, hRef.x - 300, hRef.y - 10, 2.2, 'cut'], [tNewMid - 0.01, hRef.x + 80, hRef.y - 10, 2.3], [tNewMid, cRef.x + 300, cRef.y - 10, 2.2, 'cut'], [tt.hill - 0.01, cRef.x - 80, cRef.y - 10, 2.3]);
  K.push([tt.hill, hRef.x - 300, mid - 30, 1.4, 'cut'], [tt.out, hRef.x + 300, mid - 30, 1.5], [END, hRef.x + 340, mid - 30, 1.55]);
  const camK = camPath(K);
  const camAt = (t) => (t < tt.guns ? [hRef.x - 240, hRef.y - 16, 2.2] : camK(t));
  const sub = subtitles(vo);
  const fx = transitions([[tt.ident, 'black', 0.5], [tt.party, 'black', 0.5], [tt.party3, 'whip'], [tt.flare, 'black', 0.4], [tt.guns, 'black', 0.5], [tt.guns2, 'whip'], [tt.ward, 'black', 0.6],
    [tt.shot, 'black', 0.5], [tt.shot2, 'flash'], [tt.dead, 'black', 0.6], [tt.new, 'black', 0.5], [tNewMid, 'whip'], [tt.hill, 'black', 0.5], [tt.out, 'black', 0.6]]);
  const SHOT = tt.shot2 + 1.0;
  const SFX = [[tt.ident, 'drum', 0], [SHOT, 'shoot', 0], [tt.dead, 'drum', 0], [tt.hill, 'drum', 0], [END - 1.5, 'end', 0]];
  for (const [t, , , big] of shells) if (big) SFX.push([+t.toFixed(2), 'stamp', 0]);

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = NEWS_CSS + `
#rn-rain { inset: 0; width: 100%; height: 100%; opacity: 0; image-rendering: pixelated; }
#rn-board .names { font-size: 21px; text-align: center; line-height: 1.25; color: #e3d9c3; margin-top: 6px; }`;
  document.head.appendChild(style);
  const lts = [
    [tt.shot + 0.3, tt.shot2 - 0.1, 'EDMUND OWENHART', '@owenhart247 · CONCORD RIFLEMAN · THE SECOND OF HIS FAMILY'],
    [tt.shot2 + 0.4, tt.dead - 0.1, 'DORIAN COLETONMARTI', '@coletonmartin · HEGEMONY · FELL AT S-F15'],
  ];
  const boards = [
    [tt.party3 + 0.3, tt.flare - 0.1, `<div class="t">THE FIRST WIRING PARTIES</div><div class="row"><span>HEGEMONY · 35 MEN</span><b>577 YD</b></div><div class="row"><span>CONCORD · 32 MEN</span><b>482 YD</b></div><div class="note">caught in the flares: 16</div>`],
    [tt.guns2 + 0.3, tt.ward - 0.1, `<div class="t">THE HEGEMONY WIRE</div><div class="row"><span>STILL STANDING</span><b>22%</b></div><div class="bar"><i style="width:22%;background:#8f8a82"></i></div><div class="row"><span>WITHOUT THE WIRING PARTIES</span><b>9%</b></div><div class="note">last night of the guns: 21 hit, 7 killed</div>`],
    [tt.ward2 + 0.2, tt.shot - 0.1, `<div class="t">THE HOSPITALS</div><div class="row"><span>HEGEMONY ON STRETCHERS</span><b>24</b></div><div class="row"><span>STILL IN THE TRENCH</span><b>13</b></div><div class="row"><span>MEDICS REACH</span><b>40%</b></div><div class="row"><span>CONCORD MEDICS REACH</span><b>100%</b></div>`],
    [tt.dead + 0.3, tt.new - 0.1, `<div class="t">THE FALLEN · DAY 5</div><div class="row"><span>HEGEMONY</span><b>9</b></div><div class="row"><span>CONCORD</span><b>0</b></div><div class="names">Oskar Axebozo · Dorian Coletonmarti · Quentin Forn<br>Cyril Slade · Hugo Broadshoulde · Emil Team<br>Roland Broeringluke · Wendel Ethanbay · Zeno Cubes</div>`],
    [tt.hill + 0.3, tt.out - 0.1, `<div class="t">THE RACE FOR HILL 304</div><div class="row"><span>HEGEMONY</span><b>97</b></div><div class="bar"><i style="width:97%;background:#8f8a82"></i></div><div class="row"><span>CONCORD</span><b>79</b></div><div class="bar"><i style="width:79%;background:#8a8a52"></i></div><div class="note">three more, and the hill is theirs</div>`],
  ];
  const chapters = [[tt.party, 'THE WIRING PARTIES'], [tt.guns, 'THE LAST NIGHT OF THE GUNS'], [tt.ward, 'THE WOUNDED'], [tt.shot, 'THE FALLEN'], [tt.new, 'HILL 304']];
  const ui = makeNewsUI({ day: 5, ticker: TICKER, chapters, lts, boards });
  document.body.appendChild(ui.root);
  const ct = makeTrenchCine(tex, anims);
  ct.canvas.id = 'rn-film';
  ui.root.prepend(ct.canvas);
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
    while (si < shells.length && shells[si][0] <= t) { const [, dx, dy, big] = shells[si]; life.debug.shell?.(x + dx * 420, hRef.y + 10 - dy * 70, big); si++; }
    if (!shotDone && t >= SHOT - 0.9 && t < tt.dead) { life.debug.shoot?.([owe]); shotDone = true; }
    const film = t < tt.ident ? ['order', t, {}] : t >= tt.party && t < tt.party3 ? ['picket', t - tt.party, {}]
      : t >= tt.flare && t < tt.guns ? ['wire', t - tt.flare + 1.5, { flareAt: 2.2 }]
      : t >= tt.ward && t < tt.shot ? ['trenchwounded', t - tt.ward, {}] : null;
    if (film) ct.draw(film[0], film[1], film[2]);
    ui.show('#rn-film', film ? 1 : 0);
    const raining = (t >= tt.party3 && t < tt.flare) || (t >= tt.new && t < tt.hill);
    ui.show('#rn-rain', raining ? 1 : 0);
    if (raining) { rg.clearRect(0, 0, 240, 135); rg.fillStyle = 'rgba(170,180,195,0.45)'; for (let k = 0; k < 90; k++) { const p = (k * 0.618) % 1, q = (k * 0.754) % 1, yy = ((q * 170 + t * 220) % 150) - 8; rg.fillRect(Math.round((p * 240 - yy * 0.25 + 240) % 240), Math.round(yy), 1, 3); } }
    const night = (t >= tt.party && t < tt.ward) || raining;
    if (game) game.style.filter = 'sepia(0.22) contrast(1.06) saturate(0.9)';
    paint({ ...f, black: Math.max(f.black, t > END - 0.6 ? clamp01((t - END + 0.6) / 0.5) : 0) }, 0);
    const ms = clockOf(t), cnt = countAt(ms);
    const ident = t >= tt.ident && t < tt.party - 0.25 ? { date: 'NOVEMBER 13 · DAY 5 OF THE WAR' } : t >= tt.out + 0.4 ? { date: 'NEXT: THE HILL FALLS' } : null;
    const clockOn = t >= tt.new && t < tt.hill - 0.1;
    ui.update(t, {
      ident, night, sub: sub(t), hideChrome: t < tt.ident,
      clock: clockOn ? { t: fmt(ms), c: `<b>HEGEMONY ${cnt[0]}</b> · <u>CONCORD ${cnt[1]}</u>` } : null,
    });
  }

  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
