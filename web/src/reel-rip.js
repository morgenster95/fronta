// Reel R.I.P. (/?reel=rip, jen vývojový server): první padlí bombardování. Filmový záběr „graves“ (cinema-race.js), titulky nízko,
// vzdálené dopady jako zvuk. Podklady: node tools/rip-data.mjs → marketing/reels/rip.data.json + rip.script.json; hlas python marketing/story_vo.py rip.
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, subtitles, transitions, fxLayers, clamp01 } from './reel-kit.js';
import { makeRaceScenes } from './cinema-race.js';
import data from '../../marketing/reels/rip.data.json';

const files = import.meta.glob('../../marketing/reels/rip.vo.json', { eager: true, import: 'default' });
const scripts = import.meta.glob('../../marketing/reels/rip.script.json', { eager: true, import: 'default' });

const CSS = `${BASE}${FX_CSS}
#rd-race { inset: 0; width: 100%; height: 100%; image-rendering: pixelated; }
#rd-sub { left: 6%; right: 6%; top: 69%; text-align: center; }
#rd-dim2 { inset: 0; background: rgba(14,13,12,0.86); }
`;

export function startRipReel({ tex, anims }) {
  let vo = files['../../marketing/reels/rip.vo.json'];
  if (!vo) { // bez hlasu (náhled): odhad délky vět
    const sc = scripts['../../marketing/reels/rip.script.json'];
    vo = { lines: [], seconds: 30 };
    let c = 0;
    for (const [a, text, id] of sc.lines) { const s = Math.max(a, c), d = text.length / 15 + 0.2; vo.lines.push([s, d, text, id]); c = s + d + 0.25; }
    vo.seconds = c + 3.2;
  }
  const C = cues(vo);
  const END = vo.seconds, tCta = C.at('cta'), tHeir = C.has('heir') ? C.at('heir') : null, tTree = C.has('tree') ? C.at('tree') : null;
  const sub = subtitles(vo);
  const fx = transitions([[tCta, 'flash']]);
  const BURSTS = [0.4, 1.2, 2.0, 2.9, 3.7, 4.5, 5.4, 6.3, 7.2, 8.0];
  const SFX = [];
  for (let c = 0; c * 8 < END; c++) for (const b of BURSTS) { const at = c * 8 + b + 0.35; if (at < END - 1) SFX.push([at, 'boomv', 0.28]); }
  if (tHeir) SFX.push([tHeir, 'bell', 0]);
  if (tTree) SFX.push([tTree + 1.0, 'type', 0.5], [tTree + 3.2, 'medal', 0]);
  SFX.push([tCta, 'end', 0]);

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  root.innerHTML = '<div id="rd-dim2"></div><div id="rd-sub"></div><div id="rd-big"></div>';
  document.body.appendChild(root);
  const race = makeRaceScenes(tex, anims);
  root.prepend(race.canvas);
  const paint = fxLayers(root);
  const $ = (s) => root.querySelector(s);

  function frame(t) {
    const f = fx(t);
    const H = data.heirs, base = { side: data.lead, house: H?.house, fallen: H?.fallen, heir: H?.heir, gen: H?.gen, day: data.day };
    if (tTree != null && t >= tTree) race.draw('lineage', t - tTree, base);
    else if (tHeir != null && t >= tHeir) race.draw('heir', t - tHeir, base);
    else race.draw('graves', t < 9 ? t : 1 + ((t - 1) % 8), { ...base, n: data.byCount[data.lead], names: data.names }); // záběr 9 s, pak se dopady opakují
    $('#rd-dim2').style.opacity = clamp01((t - tCta - 0.1) / 0.5);
    race.canvas.style.opacity = 1;
    paint({ ...f, black: Math.max(f.black, t < 0.5 ? 1 - t / 0.5 : 0, t > END - 0.8 ? clamp01((t - END + 0.8) / 0.7) : 0) });
    const logo = t >= tCta + 0.4;
    const bigEl = $('#rd-big');
    bigEl.style.opacity = logo ? Math.min(1, (t - tCta - 0.4) / 0.3) : 0;
    if (logo && !bigEl.dataset.on) { bigEl.dataset.on = 1; bigEl.className = 'logo'; bigEl.innerHTML = '<span>MUD <i>&amp;</i> IRON</span><span>@mudandiron · link in bio</span>'; }
    const s = sub(t), subEl = $('#rd-sub');
    subEl.style.top = tTree != null && t >= tTree ? '46%' : tHeir != null && t >= tHeir ? '69%' : '41%'; // titulky nezakrývají jmenovky na křížích ani strom rodu (a jsou pod horní lištou IG)
    if (s && !logo) { subEl.style.opacity = 1; if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; } } else subEl.style.opacity = 0;
  }
  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
