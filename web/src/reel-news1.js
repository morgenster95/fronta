// FRONT NEWS, epizoda Day 1 (19. 11. 2026, YouTube, na šířku 960×540 → 1920×1080; /?reel=news1&vacant=700, jen vývojový server).
// Zpravodajský týdeník z fronty: znělka, logo v rohu, lišta se zprávami dole, jmenovky (lower third), kapitoly, hodiny a graf náboru.
// Vše se točí PŘÍMO VE HŘE (měřítko spritů drží): na mapě jsou jen vojáci, kteří v tu dobu opravdu byli na frontě
// (marketing/reels/news1.data.json z historie gitu, tools/news-data.mjs), scény hrají „herci“ ze spritů hry (web/src/fight-fx.js).
//  1 MOBILISATION: prázdný zákop → první voják Hegemonie (Valentin „Crow“ Hodnepijumal) → první za Concord (Felix Kagr) → noc a den náboru
//    (vojáci přibývají podle skutečných časů, hodiny a křivka H/C, Concord předběhne kolem půlnoci) → 120 na frontě (H 57, C 63)
//  2 FIRST BLOOD: odstřelovač Concordu Ulrich Gpt zasáhne Wendela „Mole“ Freddieho (první těžce raněný), 3 ranění, nikdo nepadl
//  3 THE NIGHT: Biwott hodí plechovku tabáku „for the one who sings“, chytí ji Valentin; Vee a Zdsh se potkají v kráteru a odplazí se zpět
//  4 THE RACE: Verdel Ridge, C 63 : H 57, chybí 37 → shrnutí dne → rozloučení.
// Hlas: marketing/reels/news1.script.json (klidný hlas hlasatele), hudba: war_score tlumeně (marketing/reel_audio.py).
import { cues, camPath, subtitles, transitions, fxLayers, FX_CSS, clamp01, win, easeOut, tagAt } from './reel-kit.js';
import { makeFight } from './fight-fx.js';
import script from '../../marketing/reels/news1.script.json';
import data from '../../marketing/reels/news1.data.json';

const files = import.meta.glob('../../marketing/reels/news1.vo.json', { eager: true, import: 'default' });

const H = 'hodnepijumaloctu', C1 = 'k4a.gr', GPT = 'ghai.gpt', FRED = '0__freddie__0', BIW = 'a_k_biwott', VEE = 'ask._.vee', ZD = 'reza_zdsh';
const TICKER = 'DAY 1 · HEGEMONY 57 · CONCORD 63 · RACE FOR VERDEL RIDGE: CONCORD LEADS BY 6 · FIRST WOUNDED: WENDEL FREDDIE · NO DEAD ON THE FIRST DAY · A TIN OF TOBACCO CROSSED NO MAN\'S LAND · ENLIST: COMMENT HEGEMONY OR CONCORD ON @MUDANDIRON · ';

const CSS = `${FX_CSS}
#rn { position: fixed; inset: 0; pointer-events: none; z-index: 40; font-family: 'VT323', monospace; color: #e3d9c3; }
#rn > * { position: absolute; }
#rn .sil { font-family: 'Silkscreen', monospace; }
#rn-grain { inset: 0; width: 100%; height: 100%; opacity: 0.16; mix-blend-mode: overlay; image-rendering: pixelated; }
#rn-vig { inset: 0; background: radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(8,7,6,0.55) 100%); }
#rn-night { inset: 0; background: rgba(40, 46, 90, 0.3); mix-blend-mode: multiply; opacity: 0; }
#rn-bug { left: 18px; top: 16px; display: flex; align-items: stretch; opacity: 0; }
#rn-bug .l { background: #d98f3f; color: #1c1a17; font-family: 'Silkscreen', monospace; font-size: 15px; padding: 5px 9px; letter-spacing: 0.06em; }
#rn-bug .r { background: rgba(14,13,12,0.85); font-family: 'Silkscreen', monospace; font-size: 13px; padding: 6px 9px; color: #e3d9c3; letter-spacing: 0.05em; }
#rn-bug .r i { display: inline-block; width: 7px; height: 7px; background: #b5402c; border-radius: 50%; margin-right: 6px; vertical-align: 1px; font-style: normal; }
#rn-tick { left: 0; right: 0; bottom: 0; height: 28px; background: rgba(14,13,12,0.92); border-top: 2px solid #d98f3f; overflow: hidden; white-space: nowrap; opacity: 0; }
#rn-tick .lab { position: absolute; left: 0; top: 0; bottom: 0; background: #b5402c; color: #e3d9c3; font-family: 'Silkscreen', monospace; font-size: 12px; padding: 7px 10px; z-index: 2; }
#rn-tick .run { position: absolute; top: 3px; font-size: 21px; color: #e3d9c3; letter-spacing: 0.04em; }
#rn-lt { left: 40px; bottom: 104px; opacity: 0; }
#rn-lt .n { background: #e3d9c3; color: #1c1a17; font-family: 'Silkscreen', monospace; font-size: 18px; padding: 5px 12px; display: inline-block; }
#rn-lt .s { background: rgba(14,13,12,0.9); border-left: 4px solid #d98f3f; font-size: 21px; padding: 3px 12px; margin-top: 2px; }
#rn-ch { left: 0; right: 0; top: 40%; text-align: center; opacity: 0; }
#rn-ch .k { font-family: 'Silkscreen', monospace; font-size: 14px; color: #d98f3f; letter-spacing: 0.3em; }
#rn-ch .t { font-family: 'Silkscreen', monospace; font-size: 46px; letter-spacing: 0.06em; text-shadow: 4px 4px 0 #0e0d0c; border-top: 2px solid #d98f3f; border-bottom: 2px solid #d98f3f; display: inline-block; padding: 6px 26px; margin-top: 6px; background: rgba(14,13,12,0.6); }
#rn-id { inset: 0; background: #0e0d0c; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; }
#rn-id .logo { font-family: 'Silkscreen', monospace; font-size: 74px; letter-spacing: 0.08em; color: #e3d9c3; text-shadow: 5px 5px 0 #3d3730; }
#rn-id .logo b { color: #d98f3f; font-weight: 400; }
#rn-id .bar { width: 420px; height: 3px; background: #d98f3f; margin: 10px 0; }
#rn-id .sub { font-family: 'Silkscreen', monospace; font-size: 16px; letter-spacing: 0.32em; color: #c9b99a; }
#rn-id .date { font-size: 30px; color: #c9b99a; margin-top: 16px; letter-spacing: 0.1em; }
#rn-clock { right: 20px; top: 16px; background: rgba(14,13,12,0.88); border: 2px solid #524a3f; padding: 6px 12px; text-align: right; opacity: 0; }
#rn-clock .t { font-family: 'Silkscreen', monospace; font-size: 18px; color: #d98f3f; }
#rn-clock .c { font-size: 24px; } #rn-clock .c b { font-weight: 400; color: #a7b4bb; } #rn-clock .c u { text-decoration: none; color: #c9c26a; }
#rn-chart { left: 22px; bottom: 70px; width: 300px; height: 150px; background: rgba(14,13,12,0.88); border: 2px solid #524a3f; opacity: 0; }
#rn-chart .h { position: absolute; left: 10px; top: 6px; font-family: 'Silkscreen', monospace; font-size: 11px; color: #d98f3f; letter-spacing: 0.08em; }
#rn-board { left: 50%; top: 50%; transform: translate(-50%, -50%); width: 520px; background: rgba(14,13,12,0.93); border: 3px solid #524a3f; padding: 16px 22px; opacity: 0; }
#rn-board .t { font-family: 'Silkscreen', monospace; font-size: 16px; color: #d98f3f; text-align: center; letter-spacing: 0.12em; margin-bottom: 8px; }
#rn-board .row { display: flex; justify-content: space-between; align-items: baseline; font-family: 'Silkscreen', monospace; font-size: 20px; margin: 6px 0; }
#rn-board .row b { font-size: 40px; font-weight: 400; }
#rn-board .bar { height: 18px; background: #1c1a17; border: 2px solid #524a3f; position: relative; margin-bottom: 6px; } #rn-board .bar i { position: absolute; left: 0; top: 0; bottom: 0; }
#rn-board .note { font-size: 24px; color: #c9b99a; text-align: center; margin-top: 6px; }
#rn-sub { left: 10%; right: 10%; bottom: 38px; text-align: center; opacity: 0; }
#rn-sub span { font-size: 25px; line-height: 1.1; background: rgba(14,13,12,0.75); padding: 1px 8px; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
`;

export async function startNews1Reel({ cam, life, map, soldiers, tex, anims }) {
  let vo = files['../../marketing/reels/news1.vo.json'];
  if (!vo) {
    let c = 0;
    vo = { lines: script.lines.map(([at, text, id]) => { const s = Math.max(at, c), d = text.length / 14 + 0.2; c = s + d + 0.3; return [s, d, text, id]; }) };
    vo.seconds = c + 3;
  }
  const C = cues(vo);
  const at = C.at, END = vo.seconds;
  const T = map.tile;
  const by = (h) => soldiers.find((s) => s.handle === h);
  const mid = ((map.front[0] + map.front[1]) / 2) * T;
  const ids = script.lines.map((l) => l[2]);
  const tt = Object.fromEntries(ids.map((k) => [k, at(k)]));
  const val = by(H), kagr = by(C1), gpt = by(GPT), fred = by(FRED), biw = by(BIW), vee = by(VEE), zd = by(ZD);
  const ref = val || soldiers.find((s) => !s.vacant);

  // kdo byl kdy na frontě (skutečné časy náboru), hodiny náboru běží během „fill“ a „overtake“
  const joinAt = new Map(data.joins.map(([t, h]) => [h, Date.parse(t)]));
  const T0 = Date.parse('2026-11-08T18:30:00Z');
  const T1 = Date.parse((data.curve.find(([, h, c]) => h >= 57 && c >= 63) || data.curve.at(-1))[0]); // hodiny dojdou do chvíle, kdy byl stav jako v prvních novinách (H 57, C 63)
  const clockOf = (t) => (t < tt.fill ? T0 : t >= tt.count ? T1 : T0 + (T1 - T0) * clamp01((t - tt.fill) / (tt.count - tt.fill - 0.3)));
  const shownAt = (q, t) => {
    if (q.vacant || !joinAt.has(q.handle)) return false;
    if (t < tt.first0) return false; // prázdný zákop
    if (t < tt.fill) return q.handle === H || (t >= tt.first1 && q.handle === C1);
    return joinAt.get(q.handle) <= clockOf(t) || q.handle === H || q.handle === C1;
  };
  const curve = data.curve.map(([t, h, c]) => [Date.parse(t), h, c]);
  const countAt = (ms) => { let r = [0, 0]; for (const [x, h, c] of curve) if (x <= ms) r = [h, c]; return r; };

  // herci (sprity hry): Freddie padá raněný, Biwott hází plechovku, Vee a Zdsh se plazí do kráteru a zpět
  const fight = await makeFight({ anims, soldiers, tex });
  const hides = []; // [soldier, od, do] – skutečný voják ustoupí herci
  if (fred) {
    fight.puppet({ x: fred.x, y: fred.y, from: tt.blood, to: tt.night, keys: [{ t0: tt.blood, key: 'hegemony', dir: 'south' }, { t0: tt.blood + 1.6, key: 'hegemony', anim: 'fall', dir: 'south', fps: 9 }] });
    hides.push([fred, tt.blood, tt.night]);
  }
  const THROW = tt.tin + 2.2, LAND = THROW + 2.6;
  if (biw) {
    fight.puppet({ x: biw.x, y: biw.y, from: tt.tin, to: tt.tin2, keys: [{ t0: tt.tin, key: 'concord', dir: 'north' }, { t0: THROW - 0.5, key: 'concord', anim: 'grenade', dir: 'north', fps: 10 }] });
    hides.push([biw, tt.tin, tt.tin2]);
  }
  if (biw && val) {
    const tin = document.createElement('canvas'); tin.width = 6; tin.height = 4;
    const g = tin.getContext('2d'); g.fillStyle = '#e3d9c3'; g.fillRect(0, 0, 6, 4); g.fillStyle = '#d98f3f'; g.fillRect(0, 0, 6, 1); g.fillStyle = '#7e3b2a'; g.fillRect(1, 2, 4, 1); g.fillStyle = '#524a3f'; g.fillRect(0, 3, 6, 1);
    const ax = biw.x, ay = biw.y - 20, bx = val.x + 9, by0 = val.y + 4;
    fight.prop({ canvas: tin, from: THROW, to: tt.hole, pos: (t) => { const u = clamp01((t - THROW) / (LAND - THROW)); return [ax + (bx - ax) * u, ay + (by0 - ay) * u - Math.sin(u * Math.PI) * 70]; } });
  }
  const HX = vee ? vee.x : (zd ? zd.x : ref.x);
  const yC = vee ? vee.y : mid + 60, yH = zd ? zd.y : mid - 60, yM = (yC + yH) / 2;
  const MEET = tt.hole + 3.2, BACK = tt.hole2 + 0.6;
  if (vee) {
    fight.puppet({ x: HX - 5, y: yC, from: tt.hole, to: tt.race, keys: [{ t0: tt.hole, key: 'concord', anim: 'crawl', dir: 'north', fps: 7, loop: true, move: [HX - 5, yM + 6, MEET - tt.hole] }, { t0: MEET, key: 'concord', anim: 'prone', dir: 'north', fps: 1 }, { t0: BACK, key: 'concord', anim: 'crawl', dir: 'south', fps: 7, loop: true, move: [HX - 5, yC, tt.race - BACK] }] });
    hides.push([vee, tt.hole, tt.race]);
  }
  if (zd) {
    fight.puppet({ x: HX + 5, y: yH, from: tt.hole, to: tt.race, keys: [{ t0: tt.hole, key: 'hegemony', anim: 'crawl', dir: 'south', fps: 7, loop: true, move: [HX + 5, yM - 6, MEET - tt.hole] }, { t0: MEET, key: 'hegemony', anim: 'prone', dir: 'south', fps: 1 }, { t0: BACK, key: 'hegemony', anim: 'crawl', dir: 'north', fps: 7, loop: true, move: [HX + 5, yH, tt.race - BACK] }] });
    hides.push([zd, tt.hole, tt.race]);
  }

  // kamera
  const K = [[0, ref.x, ref.y, 1.2], [tt.empty, ref.x - 220, ref.y - 10, 2.6, 'cut'], [tt.first0 - 0.01, ref.x - 20, ref.y - 10, 2.9]]; // prázdný zákop Hegemonie, kamera dojede k místu prvního vojáka
  if (val) K.push([tt.first0, val.x, val.y - 14, 5.5, 'cut'], [tt.first1 - 0.01, val.x + 6, val.y - 14, 6.0]);
  if (kagr) K.push([tt.first1, kagr.x, kagr.y - 14, 5.5, 'cut'], [tt.fill - 0.01, kagr.x - 6, kagr.y - 14, 6.0]);
  // nábor: zákop Hegemonie, pak zákop Concordu (vojáci přibývají podle skutečných časů), pak celá fronta
  const yHl = val ? val.y : mid - 80, yCl = kagr ? kagr.y : mid + 80, tFillC = (tt.fill + tt.overtake) / 2;
  K.push([tt.fill, ref.x - 260, yHl - 10, 2.3, 'cut'], [tFillC - 0.01, ref.x + 120, yHl - 10, 2.4]);
  K.push([tFillC, ref.x + 260, yCl - 10, 2.3, 'cut'], [tt.count - 0.01, ref.x - 120, yCl - 10, 2.4]);
  K.push([tt.count, ref.x, (yHl + yCl) / 2, 0.95, 'cut'], [tt.shots - 0.01, ref.x + 80, (yHl + yCl) / 2, 1.0]);
  if (gpt) K.push([tt.shots, gpt.x, gpt.y - 14, 5.0, 'cut'], [tt.blood + 0.8, gpt.x + 4, gpt.y - 14, 5.3]);
  if (fred) K.push([tt.blood + 0.8, fred.x, fred.y - 14, 5.5, 'cut'], [tt.nodead - 0.01, fred.x + 4, fred.y - 14, 6.0]);
  K.push([tt.nodead, ref.x, mid, 1.4, 'cut'], [tt.night - 0.01, ref.x + 120, mid, 1.5]);
  K.push([tt.night, ref.x - 100, mid, 2.0, 'cut'], [tt.tin - 0.01, ref.x + 100, mid, 2.2]);
  if (biw) K.push([tt.tin, biw.x, biw.y - 16, 4.8, 'cut'], [THROW, biw.x, biw.y - 20, 4.8]);
  const camK = camPath(K);
  const tinPos = biw && val ? (t) => { const u = clamp01((t - THROW) / (LAND - THROW)); return [biw.x + (val.x - biw.x) * u, (biw.y + (val.y - biw.y) * u) - Math.sin(u * Math.PI) * 40]; } : null;
  const camAt = (t) => {
    if (tinPos && t >= THROW && t < tt.hole) { const [x, y] = tinPos(Math.min(t, LAND)); return [x, y - 10, t < LAND ? 3.6 : 5.0]; }
    if (t >= tt.hole && t < tt.race) return [HX, yM - 4, 4.4 + 0.3 * clamp01((t - tt.hole) / 6)];
    if (t >= tt.race) { const u = clamp01((t - tt.race) / (END - tt.race)); return [ref.x - 300 + 600 * u, t < tt.sum ? yCl - 20 : yHl - 20, 1.8]; } // závod: linie Concordu, shrnutí: linie Hegemonie
    return camK(t);
  };
  const sub = subtitles(vo);
  const fx = transitions([[tt.date, 'black', 0.6], [tt.empty, 'black', 0.5], [tt.first0, 'flash'], [tt.first1, 'whip'], [tt.fill, 'whip'], [tt.shots, 'flash'], [tt.blood + 0.8, 'whip'],
    [tt.nodead, 'black', 0.4], [tt.night, 'black', 0.6], [tt.tin, 'whip'], [tt.hole, 'black', 0.5], [tt.race, 'flash'], [tt.sum, 'black', 0.5], [tt.out, 'black', 0.6]]);
  const SFX = [[0.3, 'drum', 0], [tt.first0, 'stamp', 0], [tt.first1, 'stamp', 0], [tt.shots + 0.9, 'shoot', 0], [tt.blood + 1.7, 'stamp', 0], [THROW, 'type', 0], [tt.race, 'drum', 0], [tt.sum, 'drum', 0], [END - 1.5, 'end', 0]];
  // výstřely během náboru (jen vojáci, kteří už jsou na frontě)
  const shots = [];
  if (gpt) shots.push([tt.shots + 0.9, gpt]);
  const craterAt = tt.hole - 1.2; // kráter na místě setkání (granát dopadne mimo záběr, než se kamera přesune)

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rn';
  root.innerHTML = `
    <div id="rn-night"></div>
    <canvas id="rn-grain" width="240" height="135"></canvas>
    <div id="rn-vig"></div>
    <div id="rn-bug"><div class="l">FRONT NEWS</div><div class="r"><i></i>DAY 1 · FROM THE LINE</div></div>
    <div id="rn-clock"><div class="t">NOV 8 · 18:30</div><div class="c"><b>HEGEMONY 0</b> · <u>CONCORD 0</u></div></div>
    <div id="rn-chart"><div class="h">ON THE LINE · FIRST 40 HOURS</div><svg width="300" height="150" style="position:absolute;left:0;top:0"><polyline id="rn-ph" fill="none" stroke="#a7b4bb" stroke-width="3"/><polyline id="rn-pc" fill="none" stroke="#c9c26a" stroke-width="3"/></svg></div>
    <div id="rn-ch"><div class="k">CHAPTER</div><div class="t"></div></div>
    <div id="rn-lt"><div class="n"></div><div class="s"></div></div>
    <div id="rn-board"></div>
    <div id="rn-sub"></div>
    <div id="rn-tick"><div class="lab">FRONT NEWS</div><div class="run">${TICKER.repeat(3)}</div></div>
    <div id="rn-id"><div class="logo">FRONT <b>NEWS</b></div><div class="bar"></div><div class="sub">REPORTING FROM THE LINE</div><div class="date"></div></div>
  `;
  document.body.appendChild(root);
  const paint = fxLayers(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };
  const game = document.querySelector('canvas');
  life.debug.quiet?.(true);
  const grain = $('#rn-grain').getContext('2d');
  const chapters = [[tt.empty, 'MOBILISATION'], [tt.shots, 'FIRST BLOOD'], [tt.night, 'THE NIGHT'], [tt.race, 'THE RACE']];
  const LT = [
    [tt.first0 + 0.6, tt.first1 - 0.1, 'VALENTIN "CROW" HODNEPIJUMAL', `@${H} · FIRST OF THE HEGEMONY · NOV 8, EVENING`],
    [tt.first1 + 0.4, tt.fill - 0.1, 'FELIX KAGR', `@${C1} · FIRST OF THE CONCORD`],
    [tt.shots + 0.4, tt.blood + 0.75, 'ULRICH GPT', `@${GPT} · CONCORD SNIPER`],
    [tt.blood + 1.0, tt.nodead - 0.1, 'WENDEL "MOLE" FREDDIE', `@${FRED} · HEGEMONY · FIRST BADLY WOUNDED OF THE WAR`],
    [tt.tin + 0.4, THROW + 0.3, 'EDMUND "HOLLOW" BIWOTT', `@${BIW} · CONCORD · "FOR THE ONE WHO SINGS"`],
    [LAND + 0.2, tt.hole - 0.1, 'VALENTIN "CROW" HODNEPIJUMAL', `@${H} · KEPT THE TIN`],
    [tt.hole + 0.6, tt.race - 0.1, 'YANN VEE · SILAS ZDSH', `@${VEE} (CONCORD) · @${ZD} (HEGEMONY) · ONE SHELL HOLE`],
  ];
  const boards = [
    [tt.count + 0.2, tt.shots - 0.1, `<div class="t">THE FIRST MORNING PAPER</div><div class="row"><span>ON THE LINE</span><b>120</b></div><div class="row"><span>HEGEMONY</span><b>57</b></div><div class="row"><span>CONCORD</span><b>63</b></div>`],
    [tt.nodead + 0.2, tt.night - 0.1, `<div class="t">DAY 1 · CASUALTIES</div><div class="row"><span>WOUNDED</span><b>3</b></div><div class="row"><span>FALLEN</span><b>0</b></div><div class="note">one badly wounded, two grazed</div>`],
    [tt.race + 0.3, tt.sum - 0.1, `<div class="t">THE RACE FOR VERDEL RIDGE</div><div class="row"><span>CONCORD</span><b>63</b></div><div class="bar"><i style="width:63%;background:#8a8a52"></i></div><div class="row"><span>HEGEMONY</span><b>57</b></div><div class="bar"><i style="width:57%;background:#8f8a82"></i></div><div class="note">first to 100 soldiers takes the heights</div>`],
    [tt.sum + 0.2, tt.out + 0.2, `<div class="t">DAY 1 · SUMMARY</div><div class="row"><span>SOLDIERS</span><b>120</b></div><div class="row"><span>WOUNDED</span><b>3</b></div><div class="row"><span>FALLEN</span><b>0</b></div><div class="note">next time: the race for the ridge</div>`],
  ];
  const fmt = (ms) => { const d = new Date(ms); const day = d.getUTCDate(); return `NOV ${day} · ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`; };
  const px = (ms) => 10 + 280 * (ms - T0) / (T1 - T0), py = (n) => 140 - n * 1.6;
  let si = 0;

  function frame(t) {
    const f = fx(t);
    fight.update(t);
    for (const q of soldiers) if (q.sprite) {
      if (q.vacant && q.sprite.alpha < 1) q.sprite.alpha = 1; // žádní duchové (neobsazená místa se tu stejně neukazují)
      q.sprite.visible = shownAt(q, t) && !hides.some(([s, a, b]) => s === q && t >= a && t < b);
    }
    const [x, y, z] = camAt(t);
    cam.set(x, y, z * (1 + 0.03 * f.punch));
    while (si < shots.length && shots[si][0] <= t) { life.debug.shoot([shots[si][1]]); si++; }
    if (t >= craterAt && !frame.crater) { frame.crater = 1; life.debug.shell?.(HX, yM, true); }
    const night = t >= tt.night && t < tt.race;
    show('#rn-night', night ? 1 : 0);
    if (night && Math.floor(t * 2) % 7 === 0 && !frame.fl) { frame.fl = 1; life.debug.flare?.(); } else if (Math.floor(t * 2) % 7) frame.fl = 0;
    if (game) game.style.filter = 'sepia(0.22) contrast(1.06) saturate(0.9)';
    paint({ ...f, black: Math.max(f.black, t > END - 0.6 ? clamp01((t - END + 0.6) / 0.5) : 0) }, 0);
    // zrno filmu
    $('#rn-grain').style.opacity = night ? 0.08 : 0.16;
    const img = grain.createImageData(240, 135);
    let s0 = Math.floor(t * 30) * 9301 + 49297;
    for (let i = 0; i < img.data.length; i += 4) { s0 = (s0 * 9301 + 49297) % 233280; const v = (s0 / 233280) * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    grain.putImageData(img, 0, 0);
    // znělka a datum
    const idOn = t < tt.empty - 0.25 || t >= tt.out + 0.4; // znělka na začátku i na konci (rozloučení)
    show('#rn-id', idOn ? 1 : 0);
    $('#rn-id .date').textContent = t >= tt.out ? 'NEXT: THE RACE FOR THE RIDGE' : t >= tt.date ? 'NOVEMBER 9 · DAY 1 OF THE WAR' : '';
    $('#rn-id .logo').style.opacity = 0.85 + 0.15 * Math.sin(t * 37) * Math.sin(t * 11);
    show('#rn-bug', idOn ? 0 : 1);
    show('#rn-tick', idOn ? 0 : 1);
    $('#rn-tick .run').style.left = `${110 - ((t * 60) % 1400)}px`;
    // kapitoly
    const ch = chapters.find(([a]) => t >= a - 0.1 && t < a + 2.0);
    show('#rn-ch', ch ? win(t, ch[0] - 0.1, ch[0] + 2.0, 0.25) : 0);
    if (ch) $('#rn-ch .t').textContent = ch[1];
    // jmenovky
    const lt = LT.find(([a, b]) => t >= a && t < b);
    const ltEl = $('#rn-lt');
    ltEl.style.opacity = lt ? win(t, lt[0], lt[1], 0.2) : 0;
    ltEl.style.transform = `translateX(${lt ? -30 * (1 - easeOut(clamp01((t - lt[0]) / 0.3))) : 0}px)`;
    if (lt && ltEl.dataset.k !== lt[2] + lt[3]) { ltEl.dataset.k = lt[2] + lt[3]; $('#rn-lt .n').textContent = lt[2]; $('#rn-lt .s').textContent = lt[3]; }
    // hodiny a graf náboru
    const ms = clockOf(t), cnt = countAt(ms);
    const clk = t >= tt.fill - 0.2 && t < tt.shots - 0.2;
    show('#rn-clock', clk ? 1 : 0);
    show('#rn-chart', clk ? 1 : 0);
    if (clk) {
      $('#rn-clock .t').textContent = fmt(ms);
      $('#rn-clock .c').innerHTML = `<b>HEGEMONY ${cnt[0]}</b> · <u>CONCORD ${cnt[1]}</u>`;
      const pts = curve.filter(([x]) => x <= ms);
      $('#rn-ph').setAttribute('points', pts.map(([x, h]) => `${px(x)},${py(h)}`).join(' '));
      $('#rn-pc').setAttribute('points', pts.map(([x, , c]) => `${px(x)},${py(c)}`).join(' '));
    }
    // tabule s čísly
    const bd = boards.find(([a, b]) => t >= a && t < b);
    const bEl = $('#rn-board');
    bEl.style.opacity = bd ? win(t, bd[0], bd[1], 0.2) : 0;
    if (bd && bEl.dataset.k !== String(bd[0])) { bEl.dataset.k = String(bd[0]); bEl.innerHTML = bd[2]; }
    // titulky
    const s = sub(t);
    const subEl = $('#rn-sub');
    if (s && !idOn && !bd) { subEl.style.opacity = 1; if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; } } else subEl.style.opacity = 0;
  }

  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
