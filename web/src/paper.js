// Pixelartový novinový papír pro Deník fronty: zažloutlý papír, vlákna, skvrny od bláta a kávy, potrhané okraje.
// Vše se kreslí v prohlížeči (žádné obrázky), deterministicky podle čísla vydání.

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PAPER = [203, 189, 152]; // zažloutlý papír
const cache = new Map();

// textura papíru 96×96 px (na stránce zvětšená 3× s ostrými pixely)
export function paperTexture(seed = 1) {
  if (cache.has(seed)) return cache.get(seed);
  const W = 96, H = 96;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  const img = g.createImageData(W, H);
  const r = rng(seed * 7919 + 13);
  for (let i = 0; i < W * H; i++) {
    const n = (r() - 0.5) * 16 + (r() < 0.04 ? -22 : 0); // šum + tmavší vlákna
    img.data[i * 4] = PAPER[0] + n;
    img.data[i * 4 + 1] = PAPER[1] + n;
    img.data[i * 4 + 2] = PAPER[2] + n * 0.8;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  // skvrny: bláto (hnědé shluky pixelů) a kroužek od hrnku
  const blot = (x, y, rad, col, alpha) => {
    g.fillStyle = col;
    for (let k = 0; k < rad * rad * 2.2; k++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * rad;
      g.globalAlpha = alpha * (1 - d / rad) * (0.6 + r() * 0.4);
      g.fillRect(Math.round(x + Math.cos(a) * d) % W, Math.round(y + Math.sin(a) * d) % H, 1, 1);
    }
    g.globalAlpha = 1;
  };
  for (let s = 0; s < 4; s++) blot(r() * W, r() * H, 3 + r() * 7, '#4e3820', 0.5);
  if (r() < 0.6) {
    const cx = r() * W, cy = r() * H, R = 8 + r() * 4;
    g.fillStyle = '#7a5a34';
    for (let a = 0; a < Math.PI * 2; a += 0.08) {
      if (r() < 0.25) continue;
      g.globalAlpha = 0.25 + r() * 0.15;
      g.fillRect(Math.round(cx + Math.cos(a) * R), Math.round(cy + Math.sin(a) * R), 1, 1);
    }
    g.globalAlpha = 1;
  }
  const url = c.toDataURL();
  cache.set(seed, url);
  return url;
}

// potrhané okraje: clip-path se „schody“ po 3 px (pixelový vzhled)
export function tornClip(seed = 1) {
  const r = rng(seed * 104729 + 7);
  const top = [], bottom = [];
  for (let x = 0; x <= 100; x += 2 + Math.floor(r() * 3)) {
    top.push(`${x}% ${Math.floor(r() * 3) * 3}px`);
    bottom.push(`${x}% calc(100% - ${Math.floor(r() * 4) * 3}px)`);
  }
  top.push('100% 0px');
  bottom.push('100% 100%');
  return `polygon(${[...top, ...bottom.reverse()].join(',')})`;
}
