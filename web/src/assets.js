// Obrázky hry (sprity, efekty, rekvizity) se berou ze zrcadla na GitHub Pages, ať nezatěžují limit přenosu Firebase Hosting
// (Spark: 360 MB denně; sprity tvoří ~70 % dat jedné návštěvy). Zrcadlo se zapíná při sestavení proměnnou VITE_ASSET_BASE
// (adresa složky `…/game`, kde leží `assets/`); bez ní se vše bere z vlastní domény. Když zrcadlo selže, načte se obrázek
// z vlastní domény, takže hra běží dál (dokud Firebase nepřekročí limit).
import { Assets, Texture } from 'pixi.js';

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

// Atlas spritů (tools/make-atlas.py): jeden obrázek + pozice místo stovek samostatných souborů. Každý sprite se vyřízne
// do vlastního plátna, takže textura se chová jako samostatný obrázek (source.resource = jen ten sprite; dýchání, sdílení…).
// Vrací Map soubor → Texture; když atlas chybí nebo selže, prázdnou mapu (sprity se pak načtou jednotlivě).
export async function loadAtlas(dir) {
  const atlas = new Map();
  try {
    const meta = await getJson(`${dir}atlas.json`, { cache: 'no-cache' });
    const img = await loadImage(`${dir}atlas.png?v=${meta.v}`);
    for (const [file, [x, y, w, h]] of Object.entries(meta.frames)) {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      c.getContext('2d').drawImage(img, x, y, w, h, 0, 0, w, h);
      atlas.set(file, Texture.from(c));
    }
  } catch { /* bez atlasu: jednotlivé soubory */ }
  return atlas;
}
