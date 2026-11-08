// Příběhové promo video s voiceoverem (/?reel=story&vacant=700, jen vývojový server).
// Hlas: marketing/story_vo.py (časy vět v story.vo.json), zvuk: marketing/reel_audio.py story.
// Hrdina videa je jedno neobsazené stanoviště Concordu: přijde komentář, voják dostane jméno, kartu, padne, nastoupí dědic.
import vo from '../../marketing/reels/story.vo.json';

const HANDLE = 'your.name';
const SECONDS = vo.seconds;
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
// průhlednost prvku viditelného v [a, b] s náběhem/doběhem
const win = (t, a, b, f = 0.3) => clamp01(Math.min((t - a) / f, (b - t) / f));
// postupně psaný text (psací stroj)
const typed = (text, t, a, cps = 28) => text.slice(0, Math.max(0, Math.floor((t - a) * cps)));

const CSS = `
#rs { position: fixed; inset: 0; pointer-events: none; z-index: 40; font-family: 'VT323', monospace; color: #e3d9c3; }
#rs > * { position: absolute; opacity: 0; }
#rs .panel { left: 7%; right: 7%; bottom: 21%; background: rgba(28, 26, 23, 0.95); border: 2px solid #524a3f; padding: 12px 14px; font-size: 21px; }
#rs .sil { font-family: 'Silkscreen', monospace; letter-spacing: 0.04em; }
#rs .k { color: #d98f3f; font-family: 'Silkscreen', monospace; font-size: 12px; display: block; }
#rs .m { color: #a39782; }
#rs-black { inset: 0; background: #0e0d0c; }
#rs-grade { inset: 0; background: #2a3247; mix-blend-mode: multiply; }
#rs-intro { left: 0; right: 0; top: 40%; text-align: center; }
#rs-intro div { font-family: 'Silkscreen', monospace; font-size: 30px; letter-spacing: 0.12em; min-height: 40px; }
#rs-intro div + div { font-family: 'VT323', monospace; font-size: 30px; color: #a39782; letter-spacing: 0.1em; }
#rs-sub { left: 6%; right: 6%; top: 10.5%; text-align: center; }
#rs-sub span { font-size: 31px; line-height: 1.12; background: rgba(14, 13, 12, 0.72); padding: 2px 10px; box-decoration-break: clone; -webkit-box-decoration-break: clone; text-shadow: 2px 2px 0 #0e0d0c; }
#rs-big { left: 0; right: 0; top: 36%; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; }
#rs-big span { font-family: 'Silkscreen', monospace; font-size: 40px; letter-spacing: 0.04em; line-height: 1.05; background: rgba(14, 13, 12, 0.8); padding: 6px 14px; text-shadow: 3px 3px 0 #0e0d0c; }
#rs-big.heg span:first-child { color: #a7b4bb; font-size: 50px; }
#rs-big.con span:first-child { color: #c9c26a; font-size: 50px; }
#rs-big.cta span { background: rgba(126, 59, 42, 0.94); }
#rs-big.logo span { background: none; font-size: 64px; text-shadow: 4px 4px 0 #0e0d0c; }
#rs-big.logo span + span { font-family: 'VT323', monospace; font-size: 30px; color: #a39782; }
#rs-big i { font-family: 'VT323', monospace; font-style: normal; font-size: 1.3em; }
#rs-tag { transform: translate(-50%, -100%); font-family: 'Silkscreen', monospace; font-size: 15px; background: rgba(14, 13, 12, 0.88); border-bottom: 3px solid #c9c26a; padding: 3px 8px; white-space: nowrap; }
#rs-ring { width: 140px; height: 140px; margin: -70px 0 0 -70px; border-radius: 50%; background: radial-gradient(circle, rgba(227, 217, 195, 0.9) 0, rgba(201, 194, 106, 0.45) 30%, rgba(201, 194, 106, 0) 68%); }
#rs-comment { display: flex; gap: 12px; align-items: flex-start; }
#rs-comment canvas, #rs-card canvas { width: 64px; height: 64px; image-rendering: pixelated; background: #2b2722; border: 2px solid #524a3f; flex: none; }
#rs-comment canvas { border-radius: 50%; width: 52px; height: 52px; }
#rs-comment b { font-family: 'Silkscreen', monospace; font-weight: 400; font-size: 15px; }
#rs-comment .txt { font-size: 30px; margin-top: 2px; min-height: 32px; }
#rs-comment .txt::after, #rs-search .q::after { content: '▌'; color: #d98f3f; }
#rs-comment .meta { font-size: 18px; color: #a39782; }
#rs-card .head { display: flex; gap: 12px; align-items: center; }
#rs-card .name { font-family: 'Silkscreen', monospace; font-size: 22px; line-height: 1.1; }
#rs-card .handle { color: #d98f3f; font-size: 22px; }
#rs-card dl { display: grid; grid-template-columns: auto 1fr; gap: 0 14px; margin: 10px 0 8px; font-size: 21px; }
#rs-card dt { color: #a39782; }
#rs-card dd { margin: 0; }
#rs-card .rec { border-left: 2px solid #524a3f; padding-left: 10px; min-height: 80px; font-size: 21px; }
#rs-card .hl { color: #c9c26a; }
#rs-midnight { left: 0; right: 0; top: 38%; text-align: center; }
#rs-midnight .clock { font-family: 'Silkscreen', monospace; font-size: 76px; text-shadow: 4px 4px 0 #0e0d0c; }
#rs-midnight .sil { font-size: 24px; color: #d98f3f; background: rgba(14, 13, 12, 0.8); padding: 4px 10px; }
#rs-feed { left: 7%; right: 7%; bottom: 21%; display: grid; gap: 8px; opacity: 1; }
#rs-feed div { background: rgba(28, 26, 23, 0.95); border-left: 3px solid #d98f3f; padding: 6px 10px; font-size: 22px; opacity: 0; }
#rs-feed div.dead { border-color: #7e3b2a; }
#rs-heir .old { color: #a39782; font-size: 22px; }
#rs-heir .new { margin-top: 8px; }
#rs-war .opt { display: grid; grid-template-columns: 110px 1fr 52px; gap: 8px; align-items: center; margin-top: 8px; }
#rs-war .kw { font-family: 'Silkscreen', monospace; font-size: 14px; border: 2px solid #8c8a5c; padding: 2px 6px; text-align: center; }
#rs-war .bar, #rs-unlock .bar { height: 12px; background: #2b2722; border: 1px solid #524a3f; }
#rs-war .bar i, #rs-unlock .bar i { display: block; height: 100%; background: #7e3b2a; }
#rs-unlock .bar { height: 18px; margin: 8px 0 4px; }
#rs-unlock .big { font-family: 'Silkscreen', monospace; font-size: 28px; color: #d98f3f; }
#rs-medal { text-align: center; }
#rs-medal .ribbon { width: 46px; height: 46px; margin: 0 auto; background: repeating-linear-gradient(90deg, #7e3b2a 0 8px, #e3d9c3 8px 12px, #c9c26a 12px 18px); clip-path: polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%); }
#rs-medal .disc { width: 54px; height: 54px; margin: -10px auto 8px; border-radius: 50%; background: #d98f3f; border: 4px solid #8a5a2a; box-shadow: inset -6px -6px 0 rgba(0,0,0,0.25), 4px 4px 0 #0e0d0c; display: grid; place-items: center; font-family: 'Silkscreen', monospace; font-size: 22px; color: #3a2614; }
#rs-medal .sil { font-size: 26px; }
#rs-search { left: 7%; right: 7%; bottom: 21%; }
#rs-search .box { background: rgba(28, 26, 23, 0.95); border: 2px solid #d98f3f; padding: 8px 12px; font-size: 26px; }
#rs-search .hit { background: rgba(28, 26, 23, 0.95); border: 2px solid #524a3f; border-top: 0; padding: 6px 12px; font-size: 22px; display: flex; justify-content: space-between; }
#rs-search .url { margin-top: 10px; text-align: center; font-family: 'Silkscreen', monospace; font-size: 18px; color: #d98f3f; background: rgba(14, 13, 12, 0.8); padding: 4px; }
`;

const HTML = `
<div id="rs-grade"></div>
<div id="rs-black"></div>
<div id="rs-intro"><div></div><div></div></div>
<div id="rs-big"></div>
<div id="rs-sub"></div>
<div id="rs-ring"></div>
<div id="rs-tag">@${HANDLE}</div>
<div id="rs-comment" class="panel"><canvas width="32" height="32"></canvas><div><b>${HANDLE}</b> <span class="meta">now</span><div class="txt"></div><div class="meta">Reply · ♡</div></div></div>
<div id="rs-card" class="panel">
  <div class="head"><canvas width="32" height="32"></canvas><div><div class="m rank">Private</div><div class="name">Silas “Crow” Harlan</div><div class="handle">@${HANDLE}</div></div></div>
  <dl><dt>Faction</dt><dd><span style="color:#8c8a5c">■</span> The Concord</dd><dt>Role</dt><dd class="role hl">Rifleman</dd><dt>Position</dt><dd>Verdel Ridge · Front line</dd><dt>Status</dt><dd>On the line</dd></dl>
  <span class="k">Service record</span><div class="rec"></div>
</div>
<div id="rs-midnight"><div class="clock">00:00</div><span class="sil">THE FRONT TURNS</span></div>
<div id="rs-feed"></div>
<div id="rs-heir" class="panel">
  <div class="old">✝ Pvt. Silas Harlan · fell on Day 12, Hill 304</div>
  <div class="new"><span class="k">The bloodline fights on</span><div class="sil" style="font-size:22px">Pvt. Edmund Harlan</div><div style="color:#d98f3f">@${HANDLE}</div><div class="m">2nd of the House of Harlan at the front</div></div>
</div>
<div id="rs-war" class="panel">
  <span class="k">War Room · the front decides</span>
  <div style="font-size:23px">The rain has flooded Verdel Ridge. What are your orders?</div>
  <div class="opt"><span class="kw">HOLD</span><span class="bar"><i></i></span><span class="pct">0%</span></div>
  <div class="opt"><span class="kw">ADVANCE</span><span class="bar"><i></i></span><span class="pct">0%</span></div>
  <div class="m" style="margin-top:8px;font-size:19px">Comment one word under today's reel. Results at midnight.</div>
</div>
<div id="rs-unlock" class="panel"><span class="k">Unlock</span><div class="sil" style="font-size:22px">Artillery barrage</div><div class="bar"><i></i></div><div class="cnt m">0 / 500 claimed soldiers</div></div>
<div id="rs-medal" class="panel"><div class="ribbon"></div><div class="disc">I</div><div class="sil">FIRST WAVE</div><div class="m" style="font-size:22px">Only the first 100 recruits. Forever on their card.</div></div>
<div id="rs-search"><div class="box"><span class="q"></span></div><div class="hit"><span>@${HANDLE}</span><span class="m">Concord</span></div><div class="url">mudandiron.web.app · LINK IN BIO</div></div>
`;

export function startStoryReel({ cam, life, map, theme, soldiers, tex, anims, select }) {
  const T = map.tile;
  const front = (f) => soldiers.filter((s) => s.faction === f && s.slot?.line === 'front').sort((a, b) => a.x - b.x);
  const hs = front(0), cs = front(1);
  const hx = hs[Math.floor(hs.length / 2)].x, hy = hs[Math.floor(hs.length / 2)].y;
  const cx = cs[Math.floor(cs.length / 2)].x, cy = cs[Math.floor(cs.length / 2)].y;
  const mid = ((map.front[0] + map.front[1]) / 2) * T + 16;
  // hrdina: neobsazené stanoviště Concordu u středu, čelem k nepříteli
  const hero = cs.filter((s) => s.vacant && s.aim && Math.abs(s.x - cx) < 200).sort((a, b) => Math.abs(a.x - cx - 30) - Math.abs(b.x - cx - 30))[0] ?? cs[0];
  const Hx = hero.x, Hy = hero.y - 14;
  // voják nad panelem: posun kamery tak, aby byl v horní části obrazovky (frac = podíl výšky nad středem)
  const up = (z, frac) => Hy + (frac * 960) / z;

  // kamera [čas, x, y, zoom]
  const K = [
    [0, hx - 260, (hy + mid) / 2, 1.6],
    [10.4, hx + 30, mid - 30, 2.1],
    [11.8, hx + 20, hy - 8, 3.4],
    [16.3, hx + 120, hy - 8, 3.6],
    [18.0, cx - 90, cy - 10, 3.6],
    [22.8, cx + 10, cy - 10, 3.8],
    [28.6, Hx - 70, up(4.8, 0.05), 4.8],
    [30.8, Hx, up(5.6, 0.12), 5.6],
    [38.8, Hx + 4, up(5.6, 0.12), 5.6],
    [40.0, Hx, up(4.6, 0.12), 4.6],
    [50.2, Hx + 8, up(4.6, 0.12), 4.6],
    [51.6, Hx, up(3.4, 0.12), 3.4],
    [59.6, Hx - 6, up(3.6, 0.14), 3.6],
    [60.8, Hx, up(5, 0.1), 5],
    [66.4, Hx + 4, up(5, 0.1), 5],
    [68.4, Hx + 20, mid + 10, 2.0],
    [75.6, Hx + 160, mid, 2.1],
    [76.8, hx + 40, hy + 26, 2.6],
    [80.0, hx + 110, hy + 20, 2.8],
    [81.2, Hx, up(4.8, 0.1), 4.8],
    [85.4, Hx + 4, up(4.8, 0.1), 4.8],
    [86.2, Hx - 320, mid, 1.5],
    [87.4, Hx - 300, mid, 1.5],
    [89.2, Hx, up(4.2, 0.1), 4.2],
    [90.0, Hx, up(4.2, 0.1), 4.2],
    [95.0, Hx + 60, mid, 1.15],
    [SECONDS, Hx + 70, mid, 1.12],
  ];
  function camAt(t) {
    let i = 0;
    while (i < K.length - 2 && t > K[i + 1][0]) i++;
    const [t0, x0, y0, z0] = K[i], [t1, x1, y1, z1] = K[i + 1];
    const u = ease(clamp01((t - t0) / (t1 - t0)));
    return [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, z0 + (z1 - z0) * u];
  }

  // velké titulky [od, do, text, styl]
  const BIG = [
    [9.0, 11.4, 'MUD <i>&amp;</i> IRON\nTHE WAR THAT NEVER ENDED', 'logo'],
    [12.2, 16.6, 'THE HEGEMONY\nIRON ENDURES.', 'heg'],
    [17.8, 22.8, 'THE CONCORD\nTOGETHER, OR NOT AT ALL.', 'con'],
    [89.8, 92.4, 'COMMENT\nCONCORD  or  HEGEMONY', 'cta'],
    [92.6, 94.4, 'YOUR FRONT\nNEEDS YOU.', 'cta'],
    [94.6, SECONDS, 'MUD <i>&amp;</i> IRON\n@mudandiron · link in bio', 'logo'],
  ];
  // titulky voiceoveru: věty rozdělené podle počtu znaků na délku nahrávky
  const SUB = [];
  for (const [at, dur, text] of vo.lines) {
    const parts = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g).map((p) => p.trim().replace(/\.\.\.$/, '…'));
    // krátké kusy spojit, ať titulek nebliká
    const chunks = [];
    for (const p of parts) {
      if (chunks.length && (chunks.at(-1).length < 14 || p.length < 12) && chunks.at(-1).length + p.length < 48) chunks[chunks.length - 1] += ' ' + p;
      else chunks.push(p);
    }
    const total = chunks.reduce((a, c) => a + c.length, 0);
    let t0 = at;
    for (const c of chunks) {
      const d = (dur * c.length) / total;
      SUB.push([t0 - 0.05, t0 + d + 0.25, c]);
      t0 += d;
    }
  }

  // akce ve scéně [čas, kind, ...] + zvukové značky pro reel_audio.py
  const EV = [
    [3.0, 'flare', hx - 240, mid - 20], [5.0, 'shell', hx - 200, mid + 30, false], [7.6, 'flare', hx - 60, mid + 20],
    [8.4, 'shell', hx - 120, mid - 40, false], [10.5, 'shell', hx + 40, mid - 10, true],
    [12.6, 'shoot', 0], [13.5, 'shoot', 0], [14.4, 'shoot', 0], [15.6, 'shoot', 0], [16.8, 'shell', (hx + cx) / 2, mid, true],
    [18.8, 'shoot', 1], [19.9, 'shoot', 1], [21.0, 'shoot', 1], [22.2, 'shoot', 1],
    [25.0, 'shell', Hx - 90, mid + 10, false], [27.8, 'shell', Hx + 40, mid - 20, false],
    [35.0, 'reveal'],
    [44.0, 'shoot', 1, true], [48.5, 'shoot', 1, true],
    [51.8, 'shell', Hx - 40, Hy + 20, false], [52.6, 'shell', Hx + 50, Hy - 30, false], [53.5, 'shell', Hx + 14, Hy - 18, true],
    [53.7, 'wound'], [54.2, 'medic'], [55.6, 'shell', Hx - 70, Hy - 40, false], [57.0, 'shell', Hx + 80, Hy + 10, true],
    [63.4, 'heir'],
    [70.0, 'shell', Hx + 80, mid - 30, false], [72.8, 'shell', Hx + 200, mid + 10, true], [74.6, 'shoot', 1],
    [78.4, 'barrage', 0], [78.5, 'shell', hx + 60, hy + 12, true], [79.2, 'shell', hx + 130, hy + 30, true], [80.6, 'barrage', null],
    [82.0, 'shoot', 1, true], [84.0, 'shoot', 1, true],
    [92.6, 'shell', Hx - 40, mid - 40, true], [93.4, 'shell', Hx + 140, mid + 30, true], [95.2, 'shell', Hx + 10, mid, true],
  ];
  const SFX = [];
  for (const e of EV) {
    if (e[1] === 'shell') SFX.push([e[0], 'shell', e[4] ? 1 : 0]);
    if (e[1] === 'shoot') SFX.push([e[0] + 0.62, 'shoot', 0]);
  }
  SFX.push([2.0, 'type', 1.6], [32.0, 'type', 1.0], [46.6, 'type', 3.6], [35.0, 'reveal', 0], [51.0, 'bell', 0], [57.4, 'stamp', 0],
    [63.4, 'reveal', 0], [72.6, 'whistle', 0], [72.4, 'type', 0.5], [76.2, 'tick', 2.0], [78.4, 'stamp', 0], [78.4, 'barrage', 2.2],
    [80.6, 'medal', 0], [86.2, 'type', 0.6], [89.8, 'drum', 0], [92.6, 'drum', 0], [94.6, 'end', 0]);

  // --- DOM ---
  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rs';
  root.innerHTML = HTML;
  document.body.appendChild(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => ($(sel).style.opacity = o);

  const heroTex = (key) => tex[key] ?? tex.concord;
  const portrait = (canvas, key) => {
    const c = canvas.getContext('2d');
    c.clearRect(0, 0, 32, 32);
    const src = heroTex(key).south?.source?.resource;
    if (src) c.drawImage(src, 0, 0);
  };
  portrait($('#rs-comment canvas'), 'concord_sniper');
  const ROLES = [[39.4, 'Rifleman', 'concord'], [40.7, 'Sniper', 'concord_sniper'], [41.6, 'Stretcher Bearer', 'concord_medic'], [43.2, 'Sniper', 'concord_sniper']];
  let roleShown = null;

  const RECORD = 'Day 1 · Came up the line in the rain with a dented harmonica and nothing else. The sergeant pointed at the mud.';
  const FEED = [
    [53.8, 'Day 3 · @' + HANDLE + ' wounded by shrapnel at Verdel Ridge. The stretcher bearers came at dusk.'],
    [55.5, 'Day 7 · @' + HANDLE + ' promoted to Lance Corporal.'],
    [57.3, 'Day 12 · @' + HANDLE + ' fell at Hill 304.', 'dead'],
  ];
  $('#rs-feed').innerHTML = FEED.map(([, t, c]) => `<div class="${c || ''}">${t}</div>`).join('');
  const feedEls = [...root.querySelectorAll('#rs-feed div')];

  // proměna neobsazeného stanoviště ve skutečného vojáka (odstřelovač Concordu)
  function makeReal() {
    hero.vacant = false;
    hero.handle = HANDLE;
    if (tex.concord_sniper) {
      hero.texKey = 'concord_sniper';
      hero.tex = tex.concord_sniper;
    }
    hero.sprite.tint = 0xffffff;
    hero.sprite.alpha = 1;
    hero.action = null; // rozběhnutý výstřel by po výměně textur mířil se starým snímkem
    life.setupSprite(hero, hero.sprite);
  }
  function wound() {
    const fall = anims[hero.texKey]?.fall?.south ?? anims.concord?.fall?.south;
    if (!fall) return;
    hero.wounded = true;
    hero.sprite.texture = fall[fall.length - 1];
    hero.sprite.scale.x = 1;
  }
  function heir() {
    hero.wounded = false;
    hero.action = null; // rozběhnutý výstřel by po výměně textur mířil se starým snímkem
    life.setupSprite(hero, hero.sprite);
  }

  const fired = new Set();
  let ringAt = -10;
  function frame(t) {
    const [x, y, z] = camAt(t);
    cam.set(x, y, z);

    for (const [i, ev] of EV.entries()) {
      if (fired.has(i) || t < ev[0]) continue;
      fired.add(i);
      const kind = ev[1];
      if (kind === 'flare') life.flareAt(ev[2], ev[3]);
      if (kind === 'shell') life.shell(ev[2], ev[3], ev[4]);
      if (kind === 'shoot') {
        const pool = ev[3] ? [hero] : soldiers.filter((s) => s.faction === ev[2] && s.aim && !s.wounded && Math.abs(s.x - x) < 220 / z * 2.5 && Math.abs(s.y - y) < 330 / z * 2.5);
        if (pool.length) life.debug.shoot([pool[Math.floor(Math.random() * pool.length)]]);
      }
      if (kind === 'reveal') { makeReal(); ringAt = ev[0]; }
      if (kind === 'wound') wound();
      if (kind === 'medic') life.debug.sendMedic(hero);
      if (kind === 'heir') { heir(); ringAt = ev[0]; }
      if (kind === 'barrage') life.setBarrage(ev[2] == null ? null : { faction: ev[2] });
    }

    // úvod: černo → noc → den
    show('#rs-black', t < 2.2 ? 1 : t < 3.6 ? 1 - (t - 2.2) / 1.4 : t > 94.4 ? 0.7 * clamp01((t - 94.4) / 0.8) : 0);
    show('#rs-grade', t < 10 ? 0.45 : t < 12.5 ? 0.45 * (1 - (t - 10) / 2.5) : 0);
    show('#rs-intro', win(t, 0.3, 2.6, 0.25));
    $('#rs-intro div').textContent = typed('VERDEL RIDGE', t, 0.4, 14);
    $('#rs-intro div + div').textContent = t > 1.3 ? typed('the sixth winter of the war', t, 1.3, 26) : '';

    // titulky
    const b = BIG.find(([a, e]) => t >= a && t < e);
    const bigEl = $('#rs-big');
    if (b) {
      bigEl.style.opacity = win(t, b[0], b[1], 0.25);
      if (bigEl.dataset.text !== b[2]) {
        bigEl.dataset.text = b[2];
        bigEl.className = b[3];
        bigEl.innerHTML = b[2].split('\n').map((l) => `<span>${l}</span>`).join('');
      }
    } else bigEl.style.opacity = 0;
    const s = SUB.find(([a, e]) => t >= a && t < e);
    const subEl = $('#rs-sub');
    // během velkých titulků a závěru stačí hlas
    if (s && !b) {
      subEl.style.opacity = 1;
      if (subEl.dataset.text !== s[2]) { subEl.dataset.text = s[2]; subEl.innerHTML = `<span>${s[2]}</span>`; }
    } else subEl.style.opacity = 0;

    // jmenovka a záblesk nad hrdinou (přepočet světových souřadnic na obrazovku)
    const sx = (hero.x - cam.x) * cam.zoom + cam.w / 2, sy = (hero.y - 34 - cam.y) * cam.zoom + cam.h / 2;
    const tag = $('#rs-tag');
    tag.style.left = `${sx}px`;
    tag.style.top = `${sy - 4}px`;
    tag.style.opacity = Math.max(win(t, 36.4, 50.4), win(t, 64.0, 66.6), win(t, 81.0, 85.6), win(t, 88.8, 89.9, 0.3));
    const ring = $('#rs-ring');
    const rk = (t - ringAt) / 0.9;
    ring.style.left = `${sx}px`;
    ring.style.top = `${sy + 14 * cam.zoom}px`;
    ring.style.opacity = rk >= 0 && rk < 1 ? 1 - rk : 0;
    ring.style.transform = `scale(${0.4 + rk * 1.6})`;

    // komentář na Instagramu
    show('#rs-comment', Math.max(win(t, 31.4, 38.8), win(t, 72.0, 75.8)));
    $('#rs-comment .txt').textContent = t < 50 ? typed('CONCORD', t, 32.0, 7) : typed('ADVANCE', t, 72.4, 14);

    // karta vojáka
    show('#rs-card', win(t, 39.4, 50.4, 0.4));
    const role = [...ROLES].reverse().find(([a]) => t >= a) ?? ROLES[0];
    if (roleShown !== role) {
      roleShown = role;
      $('#rs-card .role').textContent = role[1];
      portrait($('#rs-card canvas'), role[2]);
    }
    $('#rs-card .rank').style.opacity = t > 44.2 ? 1 : 0.15;
    $('#rs-card .rec').textContent = typed(RECORD, t, 46.6, 30);

    // půlnoc a zprávy dne
    show('#rs-midnight', win(t, 50.9, 53.2, 0.25));
    feedEls.forEach((el, i) => (el.style.opacity = win(t, FEED[i][0], 59.8, 0.3)));
    show('#rs-heir', win(t, 60.2, 66.6, 0.4));
    $('#rs-heir .new').style.opacity = t > 63.2 ? 1 : 0;

    // War Room: hlasy přibývají
    show('#rs-war', win(t, 67.0, 71.9, 0.4));
    const v = ease(clamp01((t - 69.0) / 2.6));
    const bars = root.querySelectorAll('#rs-war .bar i'), pct = root.querySelectorAll('#rs-war .pct');
    [[0.42, bars[0], pct[0]], [0.58, bars[1], pct[1]]].forEach(([p, bar, label]) => {
      bar.style.width = `${p * v * 100}%`;
      label.textContent = `${Math.round(p * v * 100)}%`;
    });

    // odemčení dělostřelectva
    show('#rs-unlock', win(t, 76.0, 80.2, 0.3));
    const u = clamp01((t - 76.2) / 2.0);
    $('#rs-unlock .bar i').style.width = `${u * 100}%`;
    $('#rs-unlock .cnt').innerHTML = t < 78.4 ? `${Math.round(u * 500)} / 500 claimed soldiers` : '<span class="big">UNLOCKED</span>';

    show('#rs-medal', win(t, 80.6, 85.4, 0.35));

    // hledání sebe sama
    show('#rs-search', win(t, 85.8, 89.6, 0.3));
    $('#rs-search .q').textContent = '@' + typed(HANDLE, t, 86.2, 14);
    $('#rs-search .hit').style.opacity = t > 86.9 ? 1 : 0;
    if (t > 87.4 && !hero.picked) { hero.picked = true; select(hero); }
  }

  window.__reel = { seconds: SECONDS, sfx: SFX, frame, ready: true };
}
