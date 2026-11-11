// Reel „Verdel Ridge“ (/?reel=ridge, jen vývojový server): závod rozhodnut → nábor dne, vítěz, hrdina s medailí, jistota vítězů (dialog vojáků v obraze),
// bombardování poraženého (děla + hra), hlas hráče z komentářů, počet hráčů na frontě.
// Podklady: node tools/ridge-reel.mjs → marketing/reels/ridge.data.json + .script.json; hlas python marketing/story_vo.py ridge.
// Titulky vypravěče jsou nízko (kolem 70 % výšky), aby je nezakrývala horní ani spodní lišta Instagramu.
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, tagAt, slam, easeOut, clamp01, win, typed } from './reel-kit.js';
import { makeRaceScenes } from './cinema-race.js';
import data from '../../marketing/reels/ridge.data.json';

const files = import.meta.glob('../../marketing/reels/ridge.vo.json', { eager: true, import: 'default' });

const CSS = `${BASE}${FX_CSS}
#rd-race { inset: 0; width: 100%; height: 100%; image-rendering: pixelated; }
#rd-day { top: 22%; }
#rd-sub { left: 6%; right: 6%; top: 69%; text-align: center; }
#rd-score { left: 8%; right: 8%; top: 56%; }
#rd-score .row { display: flex; justify-content: space-between; align-items: baseline; font-family: 'Silkscreen', monospace; font-size: 24px; text-shadow: 3px 3px 0 #0e0d0c; margin: 4px 0; }
#rd-score .row b { font-weight: 400; font-size: 54px; line-height: 1; }
#rd-medal { left: 8%; right: 8%; top: 24%; text-align: center; }
#rd-medal .plate { display: inline-block; background: rgba(14,13,12,0.9); border: 4px solid #d98f3f; box-shadow: 0 0 0 3px #0e0d0c, 0 0 26px rgba(217,143,63,0.55); padding: 8px 18px 10px; }
#rd-medal .t { font-family: 'Silkscreen', monospace; font-size: 22px; color: #d98f3f; letter-spacing: 0.06em; }
#rd-medal .n { font-family: 'Silkscreen', monospace; font-size: 30px; margin: 2px 0; }
#rd-medal .h { font-size: 26px; color: #c9b99a; }
.rd-say { position: absolute; transform: translate(-50%, -100%); width: 280px; background: #e3d9c3; color: #1c1a17; border: 4px solid #0e0d0c; box-shadow: 4px 4px 0 rgba(0,0,0,0.55); padding: 6px 10px 8px; font-size: 27px; line-height: 1.05; }
.rd-say::after { content: ''; position: absolute; left: 50%; bottom: -14px; margin-left: -9px; border: 9px solid transparent; border-top: 11px solid #0e0d0c; border-bottom: 0; }
.rd-say .w { display: block; font-family: 'Silkscreen', monospace; font-size: 12px; color: #7e3b2a; margin-bottom: 2px; }
#rd-guns { left: 0; right: 0; top: 54%; text-align: center; }
#rd-guns span { display: inline-block; font-family: 'Silkscreen', monospace; font-size: 30px; background: rgba(126,59,42,0.95); padding: 6px 16px; margin: 3px 0; text-shadow: 3px 3px 0 #0e0d0c; }
#rd-quote { left: 7%; right: 7%; top: 60%; }
#rd-quote .paper { background: #d9cfb6; color: #1c1a17; border: 4px solid #0e0d0c; box-shadow: 6px 6px 0 rgba(0,0,0,0.5); padding: 12px 16px 12px; font-size: 29px; line-height: 1.08; }
#rd-quote .by { font-family: 'Silkscreen', monospace; font-size: 17px; color: #7e3b2a; margin-top: 8px; }
#rd-army { left: 10%; right: 10%; top: 46%; text-align: center; }
#rd-army .k { font-family: 'Silkscreen', monospace; font-size: 20px; color: #d98f3f; }
#rd-army .n { font-family: 'Silkscreen', monospace; font-size: 96px; line-height: 1; text-shadow: 5px 5px 0 #0e0d0c; }
#rd-side { left: 0; right: 0; top: 56%; text-align: center; }
#rd-side span { display: inline-block; font-family: 'Silkscreen', monospace; font-size: 30px; background: rgba(14,13,12,0.88); border-bottom: 4px solid currentColor; padding: 6px 16px; text-shadow: 3px 3px 0 #0e0d0c; }
#rd-side b { font-weight: 400; font-size: 64px; margin-right: 14px; vertical-align: -6px; }
`;

export function startRidgeReel({ cam, life, map, theme, soldiers, tex, anims }) {
  let vo = files['../../marketing/reels/ridge.vo.json'];
  if (!vo) { // bez hlasu (náhled): odhad délky vět
    vo = { lines: [], seconds: 60 };
    let c = 0;
    const sc = import.meta.glob('../../marketing/reels/ridge.script.json', { eager: true, import: 'default' })['../../marketing/reels/ridge.script.json'];
    for (const [at0, text, id] of sc.lines) { const s = Math.max(at0, c), d = text.startsWith('~') ? Number(text.slice(1)) : text.length / 15 + 0.2; vo.lines.push([s, d, text, id]); c = s + d + 0.25; }
    vo.seconds = c + 3.2;
  }
  const C = cues(vo);
  const at = (id) => C.at(id);
  const END = vo.seconds;
  const tDay = at('day'), tNew = at('new'), tRace = at('race'), tWon = at('won'), tHero = at('hero'), tSafe = at('safe'), tTalk = at('talk'), tGuns = at('guns'), tBomb = at('bomb');
  const tVoice = at('voice'), tQuote = at('quote'), tArmy = at('army'), tArmyH = at('armyH'), tArmyC = at('armyC'), tCta = at('cta');
  const tGunsEnd = tGuns + C.len('guns') + 0.2;

  const T = map.tile;
  const W = data.winner, L = data.loser;
  const short = (f) => theme.factions[f].name.replace(/^The /, '').toUpperCase();
  const mid = ((map.front[0] + map.front[1]) / 2) * T + 16;
  const front = (f) => soldiers.filter((s) => s.faction === f && s.slot?.line === 'front').sort((a, b) => a.x - b.x);
  const real = (f) => front(f).filter((s) => s.handle && !s.vacant && !s.hosp);
  const aim = (s, z) => [s.x, s.y - 14 + 58 / z, z];
  const hx = front(0)[Math.floor(front(0).length / 2)].x;
  const sweep = (line, a, b) => (line.length ? [[a, ...aim(line[0], 2.6), 'cut'], [b, line.at(-1).x, aim(line.at(-1), 2.6)[1], 2.6]] : []);

  // dva sousedé z vítězné strany do dialogu (ne hrdina); hráč s hlasem z komentáře
  const mates = real(W).filter((s) => s.handle !== data.hero?.handle);
  let pair = [mates[0], mates[1]];
  for (let i = 0; i + 1 < mates.length; i++) if (mates[i + 1].x - mates[i].x > 18 && mates[i + 1].x - mates[i].x < 70) { pair = [mates[i], mates[i + 1]]; break; }
  const speaker = soldiers.find((s) => s.handle === data.quote?.handle && !s.vacant) || mates[2] || pair[0];
  const dirRear = L === 0 ? -1 : 1;
  const fy = (front(L)[0]?.y ?? mid);

  const K = [
    [0, hx - 200, mid, 1.3],
    [tTalk, (pair[0].x + pair[1].x) / 2, aim(pair[0], 4.4)[1], 4.4, 'cut'],
    [tGuns - 0.01, (pair[0].x + pair[1].x) / 2 + 8, aim(pair[0], 4.6)[1], 4.6],
    [tBomb - 0.01, hx - 120, fy + dirRear * 80, 1.8, 'cut'],
    [tVoice - 0.01, hx + 160, fy + dirRear * 80, 2.1],
    [tVoice, ...aim(speaker, 3.6), 'cut'],
    [tArmy - 0.01, speaker.x + 12, aim(speaker, 4.4)[1], 4.4],
    [tArmy, hx - 160, mid, 1.15, 'cut'],
    ...(tArmyH && tArmyC ? [[tArmyH - 0.01, hx - 60, mid, 1.2], ...sweep(real(0), tArmyH, tArmyC - 0.01), ...sweep(real(1), tArmyC, tCta - 0.02)] : []),
    [tCta - 0.01, hx + 140, mid, 1.3],
    [END, hx + 260, mid, 1.35],
  ];
  const camAt = camPath(K);
  const voSub = { ...vo, lines: vo.lines.filter((l) => !String(l[2]).startsWith('~')) };
  const sub = subtitles(voSub);
  const fx = transitions([[tRace, 'black', 0.3], [tWon, 'flash'], [tHero, 'whip'], [tSafe, 'black', 0.3], [tTalk, 'black', 0.3], [tGuns, 'flash'], [tGunsEnd, 'whip'], [tVoice, 'black', 0.3], [tQuote, 'whip'], [tArmy, 'black', 0.36], [tArmyH, 'whip'], [tArmyC, 'whip'], [tCta, 'flash']]);

  // dopady pro bombardování v obraze: předem určené, ať je video vždy stejné
  const BOOM = [];
  { let s = 12345; const rr = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let t = tGunsEnd; t < tVoice; t += 0.1 + rr() * 0.12) BOOM.push([t, rr() < 0.65, rr(), rr()]); }
  const SFX = [[tNew, 'tick', 3], [tWon, 'drum', 0], [tHero + 0.9, 'medal', 0], [tTalk + 0.5, 'type', 0.3], [tTalk + 3.1, 'type', 0.3], [tGuns, 'barrage', 5.5], [tGunsEnd, 'barrage', 6],
    ...[0, 1, 2].map((i) => [tBomb + 0.5 + i * 1.3, 'stamp', 0]), [tQuote, 'reveal', 0], [tArmy, 'drum', 0], [tCta, 'end', 0]];

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  const q = data.quote;
  const role = (id) => theme.archetypes.find((a) => a.id === id)?.name || id;
  root.innerHTML = `
    <div id="rd-day"><div class="big"></div><div class="sub"></div></div>
    <div id="rd-score"><div class="row" style="color:${W ? '#c9c26a' : '#a7b4bb'}"><span>${short(W)}</span><b>100</b></div><div class="row" style="color:${L ? '#c9c26a' : '#a7b4bb'}"><span>${short(L)}</span><b>${Math.min(99, data.counts[L])}</b></div></div>
    <div id="rd-medal"><div class="plate"><div class="t">MEDAL OF VALOR</div><div class="n">${(data.hero?.name || '').replace(/"[^"]*"\s*/, '').toUpperCase()}</div><div class="h">@${data.hero?.handle || ''} · ${role(data.hero?.role)}</div></div></div>
    <div class="rd-say" id="rd-say0"><span class="w">SOLDIER 1</span><span class="x"></span></div>
    <div class="rd-say" id="rd-say1"><span class="w">SOLDIER 2</span><span class="x"></span></div>
    <div id="rd-guns"><span>TONIGHT</span><br><span>TOMORROW</span><br><span>THE NIGHT AFTER</span></div>
    <div id="rd-quote"><div class="paper"><span class="x"></span><div class="by">@${q?.handle || ''} · ${q ? `${theme.factions[q.faction].name.replace(/^The /, '')} ${role(q.role).toLowerCase()}` : ''}</div></div></div>
    <div id="rd-army" class="panel"><div class="k">ON THE LINE TODAY</div><div class="n">0</div></div>
    <div id="rd-side"><span><b></b><em style="font-style:normal"></em></span></div>
    <div id="rd-sub"></div>
    <div id="rd-big"></div>
  `;
  document.body.appendChild(root);
  const race = makeRaceScenes(tex, anims);
  root.prepend(race.canvas);
  const paint = fxLayers(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };
  const done = new Set();
  let barraged = false;

  const sceneAt = (t) => {
    if (t < tRace) return ['counter', Math.max(0, t - (tNew - 0.2)), { side: W, n: data.newToday }];
    if (t < tHero) return ['march', t - tRace, { side: W }];
    if (t < tSafe) return ['ribbon', t - tHero, { side: W }];
    if (t < tTalk) return ['shelter', t - tSafe, { side: W }];
    if (t >= tGuns && t < tGunsEnd) return ['guns', t - tGuns + 0.3, { side: W }];
    return null;
  };

  function frame(t) {
    const f = fx(t);
    const [x, y, z] = camAt(t);
    cam.set(x, y, z * (1 + 0.035 * f.punch));
    if (t >= tGuns && !barraged) { barraged = true; life.setBarrage({ faction: L }); }
    for (const [i, [bt, big, ra, rb]] of BOOM.entries()) {
      if (done.has(i) || t < bt) continue;
      done.add(i);
      const [cx, cy, cz] = camAt(bt);
      life.shell(cx + (ra - 0.5) * 540 / cz, cy + dirRear * 40 / cz + (rb - 0.45) * 820 / cz, big);
    }
    const sc = sceneAt(t);
    if (sc) race.draw(sc[0], sc[1], sc[2]);
    show('#rd-race', sc ? 1 : 0);
    paint({ ...f, black: Math.max(f.black, t < 0.4 ? 1 - t / 0.4 : 0, t > END - 0.6 ? clamp01((t - END + 0.6) / 0.5) : 0) });

    show('#rd-day', win(t, tDay, tNew + 0.6, 0.3));
    $('#rd-day .big').textContent = typed(`DAY ${data.day}`, t, tDay, 12);
    $('#rd-day .sub').textContent = t > tNew ? typed(data.objective.toUpperCase(), t, tNew, 24) : '';
    show('#rd-score', win(t, tWon + 0.1, tHero - 0.05, 0.2));
    const medal = $('#rd-medal'); slam(medal, t, tHero + 0.5, tSafe - 0.1);
    const logo = t >= tCta + 0.4;
    const bigEl = $('#rd-big');
    bigEl.style.opacity = logo ? Math.min(1, (t - tCta - 0.4) / 0.3) : 0;
    if (logo && !bigEl.dataset.on) { bigEl.dataset.on = 1; bigEl.className = 'logo'; bigEl.innerHTML = '<span>MUD <i>&amp;</i> IRON</span><span>@mudandiron · link in bio</span>'; }
    const s = sub(t);
    const subEl = $('#rd-sub');
    if (s && t > tDay && !logo) { subEl.style.opacity = 1; if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; } } else subEl.style.opacity = 0;

    // dialog dvou vojáků v obraze
    const lines = ['Hell is about to break loose out there.', "Yeah, but we'll be safe. Unless our own artillery hits us."];
    [0, 1].forEach((i) => {
      const a = tTalk + 0.4 + i * 2.8, el = $(`#rd-say${i}`);
      tagAt(el, pair[i], cam, t >= a && t < tGuns - 0.1 ? 1 : 0, 34);
      el.querySelector('.x').textContent = typed(lines[i], t, a + 0.1, 26);
    });
    // bombardování: tři noci
    $('#rd-guns').querySelectorAll('span').forEach((el, i) => (el.style.opacity = t > tBomb + 0.5 + i * 1.3 && t < tVoice ? 1 : 0));
    show('#rd-guns', t > tBomb && t < tVoice ? 1 : 0);
    // hlas hráče
    if (q) { $('#rd-quote .x').textContent = `"${typed(q.text, t, tQuote + 0.2, 34)}"`; slam($('#rd-quote'), t, tQuote, tArmy - 0.1, 1.2, -2); }
    // počet hráčů na frontě
    show('#rd-army', win(t, tArmy + 0.1, tArmyH - 0.05, 0.15));
    $('#rd-army .n').textContent = Math.round(easeOut(clamp01((t - tArmy - 0.2) / 1.1)) * (data.army[0] + data.army[1]));
    if (tArmyH && tArmyC) {
      const fct = t >= tArmyC ? 1 : 0, a = fct ? tArmyC : tArmyH, side = $('#rd-side span');
      show('#rd-side', win(t, tArmyH + 0.15, tCta - 0.05, 0.12) * (t < tArmyC - 0.08 || t > tArmyC + 0.12 ? 1 : 0));
      side.style.color = fct ? '#c9c26a' : '#a7b4bb';
      side.querySelector('b').textContent = Math.round(easeOut(clamp01((t - a - 0.15) / 0.8)) * data.army[fct]);
      side.querySelector('em').textContent = short(fct);
    }
  }
  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
