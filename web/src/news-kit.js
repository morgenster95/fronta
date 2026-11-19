// Sdílené kusy Front News (široké zpravodajské epizody na YouTube): CSS, překryvy (logo v rohu, lišta, jmenovky, kapitoly, tabule, titulky, zrno)
// a jejich řízení po snímcích. Používá reel-news2.js a další epizody (reel-news1.js má svou kopii, je natočený).
import { FX_CSS, clamp01, win, easeOut } from './reel-kit.js';

export const NEWS_CSS = `${FX_CSS}
#rn { position: fixed; inset: 0; pointer-events: none; z-index: 40; font-family: 'VT323', monospace; color: #e3d9c3; }
#rn > * { position: absolute; }
#rn .sil { font-family: 'Silkscreen', monospace; }
#rn-film { inset: 0; width: 100%; height: 100%; image-rendering: pixelated; opacity: 0; }
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

export function makeNewsUI({ day, ticker, chapters = [], lts = [], boards = [] }) {
  const root = document.createElement('div');
  root.id = 'rn';
  root.innerHTML = `
    <div id="rn-night"></div>
    <canvas id="rn-grain" width="240" height="135"></canvas>
    <div id="rn-vig"></div>
    <div id="rn-bug"><div class="l">FRONT NEWS</div><div class="r"><i></i>DAY ${day} · FROM THE LINE</div></div>
    <div id="rn-clock"><div class="t"></div><div class="c"></div></div>
    <div id="rn-ch"><div class="k">CHAPTER</div><div class="t"></div></div>
    <div id="rn-lt"><div class="n"></div><div class="s"></div></div>
    <div id="rn-board"></div>
    <div id="rn-sub"></div>
    <div id="rn-tick"><div class="lab">FRONT NEWS</div><div class="run">${ticker.repeat(3)}</div></div>
    <div id="rn-id"><div class="logo">FRONT <b>NEWS</b></div><div class="bar"></div><div class="sub">REPORTING FROM THE LINE</div><div class="date"></div></div>
  `;
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };
  const grain = $('#rn-grain').getContext('2d');
  return {
    root, $, show,
    // ident: { on, date } · night · sub: text · film: překrývá obraz filmová scéna (bez lišty a loga)
    update(t, { ident = null, night = false, sub = null, clock = null, hideChrome = false }) {
      show('#rn-night', night ? 1 : 0);
      $('#rn-grain').style.opacity = night ? 0.08 : 0.16;
      const img = grain.createImageData(240, 135);
      let s0 = Math.floor(t * 30) * 9301 + 49297;
      for (let i = 0; i < img.data.length; i += 4) { s0 = (s0 * 9301 + 49297) % 233280; const v = (s0 / 233280) * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      grain.putImageData(img, 0, 0);
      show('#rn-id', ident ? 1 : 0);
      if (ident) { $('#rn-id .date').textContent = ident.date || ''; $('#rn-id .logo').style.opacity = 0.85 + 0.15 * Math.sin(t * 37) * Math.sin(t * 11); }
      const chrome = !ident && !hideChrome;
      show('#rn-bug', chrome ? 1 : 0);
      show('#rn-tick', chrome ? 1 : 0);
      $('#rn-tick .run').style.left = `${110 - ((t * 60) % 1400)}px`;
      const ch = chapters.find(([a]) => t >= a - 0.1 && t < a + 2.0);
      show('#rn-ch', ch ? win(t, ch[0] - 0.1, ch[0] + 2.0, 0.25) : 0);
      if (ch) $('#rn-ch .t').textContent = ch[1];
      const lt = lts.find(([a, b]) => t >= a && t < b);
      const ltEl = $('#rn-lt');
      ltEl.style.opacity = lt ? win(t, lt[0], lt[1], 0.2) : 0;
      ltEl.style.transform = `translateX(${lt ? -30 * (1 - easeOut(clamp01((t - lt[0]) / 0.3))) : 0}px)`;
      if (lt && ltEl.dataset.k !== lt[2] + lt[3]) { ltEl.dataset.k = lt[2] + lt[3]; $('#rn-lt .n').textContent = lt[2]; $('#rn-lt .s').textContent = lt[3]; }
      show('#rn-clock', clock ? 1 : 0);
      if (clock) { $('#rn-clock .t').textContent = clock.t; $('#rn-clock .c').innerHTML = clock.c; }
      const bd = boards.find(([a, b]) => t >= a && t < b);
      const bEl = $('#rn-board');
      bEl.style.opacity = bd ? win(t, bd[0], bd[1], 0.2) : 0;
      if (bd && bEl.dataset.k !== String(bd[0])) { bEl.dataset.k = String(bd[0]); bEl.innerHTML = bd[2]; }
      const subEl = $('#rn-sub');
      if (sub && !ident && !bd) { subEl.style.opacity = 1; if (subEl.dataset.text !== sub) { subEl.dataset.text = sub; subEl.innerHTML = `<span>${sub}</span>`; } } else subEl.style.opacity = 0;
    },
  };
}
