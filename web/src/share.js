// Obrázek vojáka ke sdílení do Instagram story (1080×1920).
// Pixelová vrstva se kreslí na malé plátno a zvětšuje se celočíselně (ostré pixely), text je ostrý přímo ve velkém rozlišení.

const W = 1080, H = 1920, K = 5; // pixelová vrstva 216×384, zvětšená ×5
const PAL = { ink: '#0e0d0c', dark: '#1c1a17', mud: '#2b2722', bone: '#a39782', white: '#e3d9c3', gold: '#d98f3f', rust: '#7e3b2a', grey: '#8a9295', khaki: '#c9c26a' };

function loadImg(src) {
  return new Promise((ok, err) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = err;
    i.src = src;
  });
}

function text(ctx, s, x, y, size, color, { font = 'Silkscreen', align = 'center', shadow = true } = {}) {
  ctx.font = `${size}px '${font}', monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  if (shadow) {
    ctx.fillStyle = PAL.ink;
    ctx.fillText(s, x + size / 8, y + size / 8);
  }
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

// zalomí text na řádky podle šířky
function wrap(ctx, s, maxW) {
  const words = s.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

export async function shareCard({ s, rec, theme, tex }) {
  await document.fonts.load("40px 'Silkscreen'");
  await document.fonts.load("40px 'VT323'");
  const f = theme.factions[s.faction];
  const fcol = s.faction === 0 ? PAL.grey : PAL.khaki;

  // --- pixelová vrstva 216×384 ---
  const px = document.createElement('canvas');
  px.width = W / K;
  px.height = H / K;
  const p = px.getContext('2d');
  p.imageSmoothingEnabled = false;
  p.fillStyle = PAL.dark;
  p.fillRect(0, 0, px.width, px.height);
  // atmosféra fronty nahoře
  try {
    const mood = await loadImg('/assets/props/mood.png');
    p.drawImage(mood, 20, 0, 216, 144, 0, 34, 216, 144);
  } catch {}
  // ztmavení k dolní části + barevný pruh frakce
  const g = p.createLinearGradient(0, 120, 0, 190);
  g.addColorStop(0, 'rgba(28,26,23,0)');
  g.addColorStop(1, 'rgba(28,26,23,1)');
  p.fillStyle = g;
  p.fillRect(0, 100, 216, 100);
  p.fillStyle = fcol;
  p.fillRect(0, 0, 216, 3);
  p.fillRect(0, 381, 216, 3);
  // voják ×4, stojí na hraně „zákopu“
  const sprite = tex.south?.source?.resource;
  if (sprite) {
    p.fillStyle = PAL.mud;
    p.fillRect(40, 214, 136, 6);
    p.drawImage(sprite, 0, 0, 32, 32, 44, 94, 128, 128);
  }

  // --- výsledné plátno ---
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(px, 0, 0, W, H);

  // hlavička
  text(ctx, 'MUD', W / 2 - 150, 52, 64, PAL.white);
  text(ctx, '&', W / 2, 30, 110, PAL.white, { font: 'VT323' });
  text(ctx, 'IRON', W / 2 + 170, 52, 64, PAL.white);
  text(ctx, 'I ENLISTED', W / 2, 130, 34, PAL.gold);

  // jméno a hodnost
  const rank = theme.ranks[s.rank].toUpperCase();
  text(ctx, rank, W / 2, 1140, 38, PAL.bone);
  ctx.font = "64px 'Silkscreen', monospace";
  const nameLines = wrap(ctx, s.name.toUpperCase(), W - 120);
  nameLines.forEach((l, i) => text(ctx, l, W / 2, 1192 + i * 76, 64, PAL.white));
  let y = 1192 + nameLines.length * 76 + 6;
  text(ctx, `@${s.handle}`, W / 2, y, 40, PAL.gold, { font: 'VT323' });
  y += 70;

  // frakce, jednotka, stanoviště
  text(ctx, f.name.toUpperCase(), W / 2, y, 44, fcol);
  y += 64;
  const facts = [rec?.unit, rec?.sector ? `SECTOR ${rec.sector}` : null, s.archetype?.name].filter(Boolean);
  for (const t of facts) {
    text(ctx, t.toUpperCase(), W / 2, y, 30, PAL.bone, { shadow: false });
    y += 44;
  }

  // medaile First Wave
  if (s.medals?.includes('first-wave')) {
    y += 20;
    ctx.fillStyle = PAL.rust;
    ctx.fillRect(W / 2 - 300, y, 600, 74);
    ctx.fillStyle = PAL.gold;
    ctx.fillRect(W / 2 - 300, y, 600, 6);
    ctx.fillRect(W / 2 - 300, y + 68, 600, 6);
    text(ctx, 'FIRST WAVE', W / 2, y + 16, 40, PAL.white);
    y += 100;
  }

  // výzva
  ctx.fillStyle = PAL.ink;
  ctx.fillRect(0, H - 250, W, 200);
  text(ctx, 'PICK YOUR SIDE', W / 2, H - 230, 36, PAL.white);
  text(ctx, `COMMENT ${theme.factions[1].keyword} OR ${theme.factions[0].keyword}`, W / 2, H - 180, 34, PAL.gold);
  text(ctx, theme.instagram.toUpperCase(), W / 2, H - 125, 40, PAL.white);

  return new Promise((ok) => c.toBlob(ok, 'image/png'));
}
