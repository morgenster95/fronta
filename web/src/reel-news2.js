// FRONT NEWS, epizoda Day 2 (19. 11. 2026, YouTube 16:9; /?reel=news2&vacant=700, jen vývojový server). Navazuje na Day 1, ale NEZAČÍNÁ znělkou:
// studený začátek detailem v kresleném zákopu (web/src/cine-trench.js, sprity 1:1): odstřelovač Hegemonie Rafael Gaita zasáhne Nilse Photo,
// teprve pak krátká znělka. Dál: nábor (+46, H 82 : C 84), bouře a kulomety (detail v zákopu), nezvěstní (Hanka, Chloe), hlasování o nemocnici,
// příběhy přes drát (fotbalový míč Rocka a Jula ve hře, urážky a recepty, Ham a Matteozrybak) s poznámkou o Hamově smrti, závod a cliffhanger.
// Data: marketing/reels/news2.data.json (tools/news-data.mjs), hlas marketing/reels/news2.script.json, sdílené prvky web/src/news-kit.js.
import { cues, camPath, subtitles, transitions, fxLayers, clamp01 } from './reel-kit.js';
import { NEWS_CSS, makeNewsUI } from './news-kit.js';
import { makeFight } from './fight-fx.js';
import { makeTrenchCine } from './cine-trench.js';
import script from '../../marketing/reels/news2.script.json';
import data from '../../marketing/reels/news2.data.json';

const files = import.meta.glob('../../marketing/reels/news2.vo.json', { eager: true, import: 'default' });
const TICKER = 'DAY 2 · HEGEMONY 82 · CONCORD 84 · VERDEL RIDGE: 16 MORE TO WIN · BOTH ARMIES VOTE: HOSPITAL · STORM OVER THE LINE · STILL NO DEAD · ENLIST: COMMENT HEGEMONY OR CONCORD ON @MUDANDIRON · ';

export async function startNews2Reel({ cam, life, map, soldiers, tex, anims }) {
  let vo = files['../../marketing/reels/news2.vo.json'];
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
  const P = Object.fromEntries(['gaita_4119', 'yoi.photo', 'mng.ngaihte', 'hanka_b97', 'chloe.g.t', 'rotrek_rock', 'vic_jul11', 'acakostic11', 'ask._.vee', 'rals.ham', 'matteozrybak'].map((h) => [h, by(h)]));
  const ref = P['hodnepijumaloctu'] || by('hodnepijumaloctu') || soldiers.find((s) => !s.vacant);
  const yH = ref.y, cRef = by('k4a.gr') || soldiers.find((s) => s.faction === 1 && !s.vacant), yC = cRef.y;

  // na mapě jen vojáci, kteří v tu dobu byli na frontě; nábor běží podle skutečných časů během „recruits“
  const joinAt = new Map(data.joins.map(([t, h]) => [h, Date.parse(t)]));
  const T0 = Date.parse('2026-11-10T13:00:00Z');
  const T1 = Date.parse((data.curve.find(([, h, c]) => h >= 82 && c >= 84) || data.curve.at(-1))[0]);
  const clockOf = (t) => (t < tt.recruits ? T0 : t >= tt.storm ? T1 : T0 + (T1 - T0) * clamp01((t - tt.recruits) / (tt.storm - tt.recruits - 0.3)));
  const curve = data.curve.map(([t, h, c]) => [Date.parse(t), h, c]);
  const countAt = (ms) => { let r = [57, 63]; for (const [x, h, c] of curve) if (x <= ms) r = [h, c]; return r; };
  const missing = new Set(['hanka_b97', 'chloe.g.t']);
  const shownAt = (q, t) => !q.vacant && joinAt.has(q.handle) && joinAt.get(q.handle) <= clockOf(t) && !(missing.has(q.handle) && t >= tt.missing);

  // míč přes zemi nikoho: od Rocka (Concord) k Julovi (Hegemonie) a zpět
  const fight = await makeFight({ anims, soldiers, tex });
  const rock = P.rotrek_rock, jul = P.vic_jul11;
  const KICK = tt.ball + 1.4, LAND = KICK + 2.4, BACK = LAND + 1.2, HOME = BACK + 2.2;
  let ballPos = null;
  if (rock && jul) {
    const ball = document.createElement('canvas'); ball.width = 5; ball.height = 5;
    const g = ball.getContext('2d'); g.fillStyle = '#857a68'; g.fillRect(1, 0, 3, 5); g.fillRect(0, 1, 5, 3); g.fillStyle = '#c4b8a0'; g.fillRect(1, 1, 2, 1); g.fillStyle = '#3d3730'; g.fillRect(2, 2, 1, 2);
    const arc = (a, b, u, hgt) => [a.x + (b.x - a.x) * u, a.y - 8 + (b.y - a.y) * u - Math.sin(u * Math.PI) * hgt];
    ballPos = (t) => (t < KICK ? [rock.x + 6, rock.y - 4] : t < LAND ? arc(rock, jul, (t - KICK) / (LAND - KICK), 60) : t < BACK ? [jul.x + 6, jul.y - 2] : t < HOME ? arc(jul, rock, (t - BACK) / (HOME - BACK), 50) : [rock.x + 6, rock.y - 4]);
    fight.prop({ canvas: ball, from: tt.ball, to: tt.recipes, pos: ballPos });
  }

  // kamera
  const tR2 = tt.recruits2;
  const K = [[tt.ident, ref.x, yH, 1.2], [tt.recruits, ref.x - 260, yH - 10, 2.3, 'cut'], [tR2 - 0.01, ref.x + 120, yH - 10, 2.4], [tR2, cRef.x + 260, yC - 10, 2.3, 'cut'], [tt.storm - 0.01, cRef.x - 120, yC - 10, 2.4]];
  K.push([tt.storm, ref.x, mid, 1.0, 'cut'], [tt.mg - 0.01, ref.x + 120, mid, 1.1]);
  const hk = P.hanka_b97 || ref;
  K.push([tt.missing, hk.x, hk.y - 14, 4.6, 'cut'], [tt.vote - 0.01, hk.x + 6, hk.y - 14, 5.0]);
  K.push([tt.vote, ref.x - 200, yH + 120, 1.6, 'cut'], [tt.wire - 0.01, ref.x + 200, yH + 120, 1.7]);
  K.push([tt.wire, ref.x, mid, 1.3, 'cut'], [tt.ball - 0.01, ref.x + 100, mid, 1.4]);
  const ac = P.acakostic11 || ref, vee = P['ask._.vee'] || cRef, ham = P['rals.ham'] || cRef, mz = P.matteozrybak || ref;
  const tRec2 = (tt.recipes + tt.names) / 2, tNam2 = (tt.names + tt.ham) / 2;
  K.push([tt.recipes, ac.x, ac.y - 14, 4.6, 'cut'], [tRec2 - 0.01, ac.x + 6, ac.y - 14, 5.0], [tRec2, vee.x, vee.y - 14, 4.6, 'cut'], [tt.names - 0.01, vee.x - 6, vee.y - 14, 5.0]);
  K.push([tt.names, ham.x, ham.y - 14, 4.6, 'cut'], [tNam2 - 0.01, ham.x + 6, ham.y - 14, 5.0], [tNam2, mz.x, mz.y - 14, 4.6, 'cut'], [tt.ham - 0.01, mz.x - 6, mz.y - 14, 5.0]);
  K.push([tt.ham, ham.x, ham.y - 14, 5.2, 'cut'], [tt.race - 0.01, ham.x, ham.y - 14, 5.8]);
  K.push([tt.race, ref.x - 300, yC - 20, 1.8, 'cut'], [tt.out, ref.x + 300, yH - 20, 1.8]);
  const camK = camPath(K);
  const camAt = (t) => {
    if (ballPos && t >= tt.ball && t < tt.recipes) { const [x, y] = ballPos(t); return [x, y - 6, t >= KICK && t < HOME && !(t >= LAND && t < BACK) ? 3.4 : 4.6]; }
    if (t < tt.ident) return [ref.x, yH, 1.2];
    return camK(t);
  };
  const sub = subtitles(vo);
  const fx = transitions([[tt.hit, 'flash'], [tt.ident, 'black', 0.5], [tt.recruits, 'black', 0.5], [tR2, 'whip'], [tt.storm, 'black', 0.5], [tt.mg, 'flash'], [tt.missing, 'whip'], [tt.vote, 'black', 0.5],
    [tt.wire, 'black', 0.5], [tt.ball, 'whip'], [tt.recipes, 'whip'], [tRec2, 'whip'], [tt.names, 'black', 0.4], [tNam2, 'whip'], [tt.race, 'black', 0.5], [tt.out, 'black', 0.6],
    ...[0.6, 2.4, 4.1].map((d) => [tt.storm + d, 'flash'])]);
  const SHOT = tt.hit - tt.aim - 0.4; // výstřel v detailu těsně před větou o zásahu
  const SFX = [[tt.aim + SHOT, 'shoot', 0], [tt.hit + 0.5, 'stamp', 0], [tt.ident, 'drum', 0], [KICK, 'type', 0], [BACK, 'type', 0], [tt.race, 'drum', 0], [END - 1.5, 'end', 0]];
  for (let k = 0; k < 8; k++) SFX.push([+(tt.mg + 0.2 + k * 0.35).toFixed(2), 'shoot', 0]);

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = NEWS_CSS;
  document.head.appendChild(style);
  const lts = [
    [tt.aim + 0.2, tt.hit - 0.1, 'RAFAEL "BONES" GAITA', '@gaita_4119 · HEGEMONY SNIPER'],
    [tt.hit + 0.6, tt.ident - 0.1, 'NILS PHOTO', '@yoi.photo · CONCORD · BADLY WOUNDED'],
    [tt.mg + 0.3, tt.missing - 0.1, 'BENEDIKT NGAIHTE', '@mng.ngaihte · HEGEMONY MACHINE GUNNER'],
    [tt.missing + 2.2, tt.vote - 0.1, 'BASTIAN "OWL" HANKA · ALBIN CHLOE', '@hanka_b97 · @chloe.g.t · HEGEMONY · MISSING'],
    [tt.ball + 0.3, LAND, 'ANSELM "PARSON" ROCK', '@rotrek_rock · CONCORD · THE BALL WITH HIS NAME'],
    [LAND, tt.recipes - 0.1, 'GUSTAV "TIN" JUL', '@vic_jul11 · HEGEMONY · KICKED IT BACK'],
    [tt.recipes + 0.3, tRec2 - 0.05, 'TEODOR ACAKOSTIC', '@acakostic11 · HEGEMONY'],
    [tRec2 + 0.2, tt.names - 0.1, 'YANN VEE', '@ask._.vee · CONCORD · INSULTS, THEN RECIPES'],
    [tt.names + 0.3, tNam2 - 0.05, 'MAREK HAM', '@rals.ham · CONCORD'],
    [tNam2 + 0.2, tt.ham - 0.1, 'EDMUND MATTEOZRYBAK', '@matteozrybak · HEGEMONY'],
  ];
  const boards = [
    [tt.storm - 2.8, tt.storm - 0.1, `<div class="t">DAY 2 · NEW ON THE LINE</div><div class="row"><span>NEW SOLDIERS</span><b>+46</b></div><div class="row"><span>HEGEMONY</span><b>82</b></div><div class="row"><span>CONCORD</span><b>84</b></div>`],
    [tt.missing + 0.2, tt.missing + 2.1, `<div class="t">DAY 2 · CASUALTIES</div><div class="row"><span>WOUNDED</span><b>3</b></div><div class="row"><span>FALLEN</span><b>0</b></div><div class="row"><span>MISSING</span><b>2</b></div>`],
    [tt.vote2 - 0.2, tt.wire - 0.1, `<div class="t">WHAT DOES YOUR SIDE BUILD?</div><div class="row"><span>HEGEMONY: HOSPITAL</span><b>17:11</b></div><div class="row"><span>CONCORD: HOSPITAL</span><b>25:7</b></div><div class="note">a deep dugout behind the reserve line · 4 beds each</div>`],
    [tt.ham + 0.2, tt.race - 0.1, `<div class="t">IN MEMORIAM</div><div class="row"><span>MAREK HAM</span><b>✝</b></div><div class="note">Concord machine gunner · fell on Day 9</div>`],
    [tt.race + 0.3, tt.out - 0.1, `<div class="t">THE RACE FOR VERDEL RIDGE</div><div class="row"><span>CONCORD</span><b>84</b></div><div class="bar"><i style="width:84%;background:#8a8a52"></i></div><div class="row"><span>HEGEMONY</span><b>82</b></div><div class="bar"><i style="width:82%;background:#8f8a82"></i></div><div class="note">first to 100 takes the heights</div>`],
  ];
  const chapters = [[tt.recruits, 'REINFORCEMENTS'], [tt.storm, 'THE STORM'], [tt.vote, 'THE VOTE'], [tt.wire, 'ACROSS THE WIRE'], [tt.race, 'THE RACE']];
  const ui = makeNewsUI({ day: 2, ticker: TICKER, chapters, lts, boards });
  document.body.appendChild(ui.root);
  const ct = makeTrenchCine(tex, anims);
  ct.canvas.id = 'rn-film';
  ui.root.prepend(ct.canvas);
  const paint = fxLayers(ui.root);
  const game = document.querySelector('canvas');
  life.debug.quiet?.(true);
  const fmt = (ms) => { const d = new Date(ms); return `NOV ${d.getUTCDate()} · ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`; };

  function frame(t) {
    const f = fx(t);
    fight.update(t);
    for (const q of soldiers) if (q.sprite) { if (q.vacant && q.sprite.alpha < 1) q.sprite.alpha = 1; q.sprite.visible = shownAt(q, t); }
    const [x, y, z] = camAt(t);
    cam.set(x, y, z);
    // filmové detaily: studený začátek (duel) a kulomety v bouři
    const film = t < tt.hit ? ['duelA', t - tt.aim + 0.3, { storm: true, shot: SHOT + 0.3 }] : t < tt.ident ? ['duelB', t - tt.hit, { storm: true, hit: 0.35 }]
      : t >= tt.mg && t < tt.missing ? ['mg', t - tt.mg, { storm: true, flash: Math.max(0, Math.sin(t * 3.1) > 0.97 ? 1 : 0) }] : null;
    if (film) ct.draw(film[0], film[1], film[2]);
    ui.show('#rn-film', film ? 1 : 0);
    const night = (t >= tt.storm && t < tt.vote) || (t >= tt.names && t < tt.race);
    if (game) game.style.filter = 'sepia(0.22) contrast(1.06) saturate(0.9)';
    paint({ ...f, black: Math.max(f.black, t > END - 0.6 ? clamp01((t - END + 0.6) / 0.5) : 0) }, 0);
    const ms = clockOf(t), cnt = countAt(ms);
    const ident = t >= tt.ident && t < tt.recruits - 0.25 ? { date: 'NOVEMBER 10 · DAY 2 OF THE WAR' } : t >= tt.out + 0.4 ? { date: 'NEXT: THE RIDGE FALLS' } : null;
    ui.update(t, {
      ident, night, sub: sub(t), hideChrome: t < tt.ident,
      clock: t >= tt.recruits && t < tt.storm - 0.2 ? { t: fmt(ms), c: `<b>HEGEMONY ${cnt[0]}</b> · <u>CONCORD ${cnt[1]}</u>` } : null,
    });
  }

  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
