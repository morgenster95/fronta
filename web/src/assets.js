// Obrázky hry (sprity, efekty, rekvizity) se berou ze zrcadla na GitHub Pages, ať nezatěžují limit přenosu Firebase Hosting
// (Spark: 360 MB denně; sprity tvoří ~70 % dat jedné návštěvy). Zrcadlo se zapíná při sestavení proměnnou VITE_ASSET_BASE
// (adresa složky `…/game`, kde leží `assets/`); bez ní se vše bere z vlastní domény. Když zrcadlo selže, načte se obrázek
// z vlastní domény, takže hra běží dál (dokud Firebase nepřekročí limit).
import { Assets } from 'pixi.js';

export const BASE = (import.meta.env.VITE_ASSET_BASE || '').replace(/\/$/, '');

async function withFallback(path, load) {
  if (BASE) {
    try { return await load(BASE + path); } catch { /* zrcadlo nedostupné → vlastní doména */ }
  }
  return load(path);
}

export const getJson = (path, opts) => withFallback(path, (u) => fetch(u, opts).then((r) => {
  if (!r.ok) throw new Error(`${r.status} ${u}`);
  return r.json();
}));

export const loadTexture = (path) => withFallback(path, (u) => Assets.load(u));

export const loadImage = (path) => withFallback(path, (u) => new Promise((ok, err) => {
  const i = new Image();
  i.crossOrigin = 'anonymous'; // zrcadlo posílá CORS hlavičky; obrázek jde použít i v plátně
  i.onload = () => ok(i);
  i.onerror = err;
  i.src = u;
}));
