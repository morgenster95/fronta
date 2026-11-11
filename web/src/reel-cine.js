// Náhled a natáčení samostatných filmových záběrů: /?reel=cine (jen vývojový server), nahrává tools/render-cine.mjs.
// window.__cine.png(jméno, t, volby) vrátí snímek 180×320 jako PNG (data URL), window.__reel.frame(t) kreslí záběr z adresy (?scene=march&side=1&n=123).
import { makeRaceScenes, RACE_SCENES } from './cinema-race.js';

export function startCineReel({ tex, anims }) {
  const c = makeRaceScenes(tex, anims);
  const q = new URLSearchParams(location.search);
  const scene = q.get('scene') || 'march';
  const opts = { side: q.has('side') ? Number(q.get('side')) : undefined, n: q.has('n') ? Number(q.get('n')) : undefined };
  document.body.classList.add('reel');
  const cv = c.canvas;
  cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;image-rendering:pixelated;z-index:5;background:#0e0d0c';
  document.body.appendChild(cv);
  window.__cine = { names: Object.keys(RACE_SCENES), seconds: RACE_SCENES, png: (name, t, o = opts) => { c.draw(name, t, o); return cv.toDataURL('image/png'); } };
  window.__reel = { ready: true, seconds: RACE_SCENES[scene] || 7, frame: (t) => c.draw(scene, t, opts) };
  window.__reel.frame(0);
}
