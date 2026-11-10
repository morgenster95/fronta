// Společné nástroje pro reely s hlasem (reel-daily.js, reel-news.js): časy podle vět hlasu (id),
// dráha kamery s tvrdými střihy, titulky, jmenovky a přechody (záblesk, švih, střih do černa, ráz kamery, razítko).
export const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const win = (t, a, b, f = 0.3) => clamp01(Math.min((t - a) / f, (b - t) / f));
export const typed = (text, t, a, cps = 28) => text.slice(0, Math.max(0, Math.floor((t - a) * cps)));

export const FX_CSS = `
#rk-flash { inset: 0; background: #fff6dc; mix-blend-mode: screen; }
#rk-black { inset: 0; background: #0e0d0c; }
#rk-whip { inset: -10%; background: repeating-linear-gradient(90deg, rgba(227,217,195,0.0) 0 18px, rgba(227,217,195,0.22) 18px 22px, rgba(14,13,12,0.5) 22px 40px); filter: blur(6px); }
#rk-bars::before, #rk-bars::after { content: ''; position: absolute; left: 0; right: 0; height: 7%; background: #0e0d0c; }
#rk-bars { inset: 0; } #rk-bars::before { top: 0; } #rk-bars::after { bottom: 0; }
.rk-stamp { position: absolute; left: 50%; top: 44%; transform: translate(-50%, -50%) rotate(-8deg); font-family: 'Silkscreen', monospace; font-size: 44px;
  color: #b5402c; border: 5px solid #b5402c; padding: 4px 16px; letter-spacing: 0.06em; background: rgba(227,217,195,0.08); text-shadow: 2px 2px 0 rgba(14,13,12,0.5); }
`;

// časy vět: cue('shot') = začátek věty s id 'shot' (z <scénář>.vo.json); bez hlasu odhad
export function cues(vo, fallback = {}) {
  const map = Object.fromEntries((vo.lines || []).filter((l) => l[3]).map((l) => [l[3], l[0]]));
  const len = Object.fromEntries((vo.lines || []).filter((l) => l[3]).map((l) => [l[3], l[1]]));
  return { at: (id) => map[id] ?? fallback[id] ?? null, len: (id) => len[id] ?? 2.5, has: (id) => id in map || id in fallback };
}

// dráha kamery: [čas, x, y, zoom, 'cut'?]; 'cut' = tvrdý střih (skok bez přeletu)
export function camPath(K) {
  K.sort((a, b) => a[0] - b[0]);
  return (t) => {
    let i = 0;
    while (i < K.length - 2 && t >= K[i + 1][0]) i++;
    const [t0, x0, y0, z0] = K[i], [t1, x1, y1, z1, kind] = K[i + 1];
    if (kind === 'cut') return [x0, y0, z0];
    const u = ease(clamp01((t - t0) / Math.max(0.01, t1 - t0)));
    return [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, z0 + (z1 - z0) * u];
  };
}

// titulky z hlasu: věty rozdělené na krátké kousky
export function subtitles(vo) {
  const SUB = [];
  for (const [t0, dur, text] of vo.lines || []) {
    const parts = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g).map((p) => p.trim());
    const chunks = [];
    for (const p of parts) {
      if (chunks.length && (chunks.at(-1).length < 14 || p.length < 12) && chunks.at(-1).length + p.length < 44) chunks[chunks.length - 1] += ' ' + p;
      else chunks.push(p);
    }
    const total = chunks.reduce((a, c) => a + c.length, 0);
    let s0 = t0;
    for (const c of chunks) {
      const d = (dur * c.length) / total;
      SUB.push([s0 - 0.05, s0 + d + 0.2, c]);
      s0 += d;
    }
  }
  return (t) => SUB.find(([a, e]) => t >= a && t < e)?.[2] ?? null;
}

// přechody: seznam [čas, druh]; vrací průhlednosti vrstev a ráz kamery pro čas t
export function transitions(list) {
  return (t) => {
    let flash = 0, whip = 0, black = 0, punch = 0;
    for (const [at, kind, len = 0.5] of list) {
      const u = t - at;
      if (kind === 'flash' && u > -0.02 && u < 0.35) flash = Math.max(flash, 0.9 * Math.exp(-u * 11));
      if (kind === 'whip' && Math.abs(u) < 0.22) whip = Math.max(whip, 1 - Math.abs(u) / 0.22);
      if (kind === 'black' && Math.abs(u) < len / 2) black = Math.max(black, 1 - Math.abs(u) / (len / 2));
      if (kind === 'punch' && u > 0 && u < 0.5) punch = Math.max(punch, Math.exp(-u * 8) * Math.sin(u * 30));
    }
    return { flash, whip, black, punch };
  };
}

export function fxLayers(root) {
  const mk = (id) => { const el = document.createElement('div'); el.id = id; root.appendChild(el); return el; };
  const flash = mk('rk-flash'), whip = mk('rk-whip'), black = mk('rk-black'), bars = mk('rk-bars');
  return (fx, barsOn = 1) => {
    flash.style.opacity = fx.flash;
    whip.style.opacity = fx.whip;
    whip.style.transform = `translateX(${(fx.whip * 30).toFixed(1)}%)`;
    black.style.opacity = fx.black;
    bars.style.opacity = barsOn;
  };
}

// jmenovka nad vojákem / místem ve světě
export function tagAt(el, who, cam, o, lift = 30) {
  if (!el || !who) return;
  el.style.left = `${(who.x - cam.x) * cam.zoom + cam.w / 2}px`;
  el.style.top = `${(who.y - lift - cam.y) * cam.zoom + cam.h / 2}px`;
  el.style.opacity = o;
}

// „vlétnutí“ panelu: z větší velikosti a natočení na místo (razítko, telegram)
export function slam(el, t, at, out, from = 1.35, rot = -5) {
  if (!el) return;
  const u = easeOut(clamp01((t - at) / 0.28));
  el.style.opacity = t < at || t > out ? 0 : Math.min(1, u * 1.5, (out - t) / 0.2);
  el.style.transform = `${el.dataset.base || ''} scale(${from + (1 - from) * u}) rotate(${rot * (1 - u)}deg)`;
}
