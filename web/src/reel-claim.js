// Reel „jak claimnout vojáka“ (/?reel=claim, jen vývojový server): návod (karta → Google → kód → komentář → odpověď bota)
// a co umí claimnutý voják (dopis z domova, převelení, rodokmen). Telefon s replikou karty ze hry + filmové záběry (cinema-race.js).
// Hlas: marketing/reels/claim.script.json (python marketing/story_vo.py claim). Žádný skutečný hráč: jméno a handle jsou smyšlené.
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, subtitles, transitions, fxLayers, clamp01, easeOut, typed } from './reel-kit.js';
import { makeRaceScenes } from './cinema-race.js';

const files = import.meta.glob('../../marketing/reels/claim.vo.json', { eager: true, import: 'default' });
const scripts = import.meta.glob('../../marketing/reels/claim.script.json', { eager: true, import: 'default' });

const CSS = `${BASE}${FX_CSS}
#rd-race { inset: 0; width: 100%; height: 100%; image-rendering: pixelated; }
#rd-dim2 { inset: 0; background: rgba(14,13,12,0.95); }
#rd-sub { left: 6%; right: 6%; top: 77%; text-align: center; }
#cl-phone { left: 11%; right: 11%; top: 17%; height: 54%; background: #1c1a17; border: 6px solid #0e0d0c; outline: 2px solid #524a3f;
  box-shadow: 0 10px 0 rgba(0,0,0,0.5), 0 24px 40px rgba(0,0,0,0.6); overflow: hidden; }
#cl-phone .scr { position: absolute; inset: 0; padding: 16px 16px; font-size: 22px; line-height: 1.15; }
#cl-phone h2 { font-family: 'Silkscreen', monospace; font-size: 19px; margin: 0; letter-spacing: 0.04em; }
#cl-phone h3 { font-family: 'Silkscreen', monospace; font-size: 12px; color: #a39782; margin: 12px 0 6px; text-transform: uppercase; font-weight: 400; }
#cl-phone .m { color: #a39782; }
#cl-phone .head { display: flex; gap: 12px; align-items: center; }
#cl-phone canvas { width: 64px; height: 64px; image-rendering: pixelated; background: #2b2722; border: 2px solid #524a3f; }
#cl-phone dl { display: grid; grid-template-columns: auto 1fr; gap: 2px 14px; margin: 10px 0 0; }
#cl-phone dt { color: #a39782; } #cl-phone dd { margin: 0; }
#cl-phone .btn { display: block; width: 100%; font-family: 'VT323', monospace; font-size: 22px; background: #2b2722; color: #e3d9c3; border: 2px solid #524a3f; padding: 9px 10px; margin-top: 8px; text-align: center; }
#cl-phone .btn.p { background: #7e3b2a; border-color: #a85a36; }
#cl-phone .btn.hit { transform: translateY(2px); filter: brightness(1.35); }
#cl-phone .code { font-family: 'Silkscreen', monospace; font-size: 30px; letter-spacing: 0.08em; color: #d98f3f; background: #2b2722; border: 2px dashed #d98f3f; padding: 12px; text-align: center; margin: 12px 0; }
#cl-phone .role { display: grid; text-align: left; gap: 2px; padding: 8px 10px; margin-top: 6px; background: #2b2722; border: 2px solid #524a3f; }
#cl-phone .role span { color: #a39782; font-size: 0.8em; }
#cl-phone .role.on { border-color: #d98f3f; }
#cl-phone .ig { background: #0f0f10; position: absolute; inset: 0; padding: 14px; font-family: system-ui, sans-serif; font-size: 15px; color: #f2f2f2; line-height: 1.3; }
#cl-phone .ig .bar { font-weight: 700; border-bottom: 1px solid #2a2a2c; padding-bottom: 10px; margin-bottom: 12px; text-align: center; }
#cl-phone .ig .c { display: flex; gap: 10px; margin: 12px 0; }
#cl-phone .ig .av { width: 34px; height: 34px; border-radius: 50%; background: #3a3a3c; flex: none; }
#cl-phone .ig .av.bot { background: #7e3b2a; }
#cl-phone .ig b { font-weight: 700; } #cl-phone .ig .t { color: #9a9a9d; font-size: 12px; }
#cl-phone .ig .in { position: absolute; left: 14px; right: 14px; bottom: 14px; border: 1px solid #3a3a3c; border-radius: 22px; padding: 11px 14px; color: #f2f2f2; min-height: 44px; }
#cl-phone .ig .rep { margin-left: 44px; }
#cl-phone .toast { position: absolute; left: 14px; right: 14px; bottom: 16px; background: #0e0d0c; border: 2px solid #d98f3f; padding: 9px 12px; }
#cl-step { position: absolute; left: 0; right: 0; top: 0; background: #d98f3f; color: #0e0d0c; font-family: 'Silkscreen', monospace; font-size: 14px; letter-spacing: 0.08em; padding: 7px 14px; z-index: 3; }
#cl-phone .scr { top: 30px; }
#cl-phone .gbtn { background: #fff; color: #222; font-family: system-ui, sans-serif; font-size: 17px; padding: 12px; text-align: center; margin-top: 30px; border: 2px solid #ccc; }
#cl-phone .gbtn.hit { background: #e8e8e8; transform: translateY(2px); }
`;

const ROLES = [['Medic', 'Stretcher Bearer', 'Carries the wounded out. Saves other players’ soldiers.'], ['Sniper', 'Sniper', 'Patient, alone, deadly. Duels across the wire.'], ['Machine Gunner', 'Machine Gunner', 'Holds the line with the gun. Feared by both sides.']];

export function startClaimReel({ tex, anims }) {
  let vo = files['../../marketing/reels/claim.vo.json'];
  if (!vo) { // bez hlasu (náhled): odhad délky vět
    const sc = scripts['../../marketing/reels/claim.script.json'];
    vo = { lines: [], seconds: 40 };
    let c = 0;
    for (const [a, text, id] of sc.lines) { const s = Math.max(a, c), d = text.length / 15 + 0.2; vo.lines.push([s, d, text, id]); c = s + d + 0.25; }
    vo.seconds = c + 3.2;
  }
  const C = cues(vo);
  const END = vo.seconds, T = (id) => C.at(id);
  const sub = subtitles(vo);
  const fx = transitions(['but', 's1', 's2', 's3', 's4', 'letter', 'transfer', 'house', 'cta'].filter((i) => C.has(i)).map((i) => [T(i) - 0.05, i === 'cta' ? 'flash' : 'whip']));
  const SFX = [];
  for (const id of ['s1', 's2', 's3', 's4', 'letter', 'transfer']) if (C.has(id)) SFX.push([T(id) + 1.0, 'type', 0.5]);
  if (C.has('s4')) SFX.push([T('s4') + 2.4, 'medal', 0]);
  SFX.push([T('cta'), 'end', 0]);

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  root.innerHTML = '<div id="rd-dim2"></div><div id="cl-phone"><div id="cl-step"></div><div class="scr" id="cl-scr"></div></div><div id="rd-sub"></div><div id="rd-big"></div>';
  document.body.appendChild(root);
  const race = makeRaceScenes(tex, anims);
  root.prepend(race.canvas);
  const paint = fxLayers(root);
  const $ = (s) => root.querySelector(s);

  // portrét ze spritu hry
  const portrait = () => {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const tx = tex.concord?.south;
    const img = tx?.source?.resource, fr = tx?.frame;
    if (img && fr) c.getContext('2d').drawImage(img, fr.x, fr.y, fr.width, fr.height, 0, 0, 32, 32);
    return c;
  };
  const cardHtml = (claimed, extra = '') => `<div class="head"><canvas width="32" height="32" data-p></canvas><div><div class="m">Private</div><h2>Anton Kessler</h2><div style="color:#d98f3f">@your.handle</div></div></div>
    <dl><dt>Faction</dt><dd>Concord</dd><dt>Role</dt><dd>Rifleman</dd><dt>Unit</dt><dd>3rd Platoon</dd><dt>Status</dt><dd>On the line</dd></dl>
    <div style="display:flex;gap:8px;margin-top:12px"><span class="btn" style="margin:0">House</span><span class="btn" style="margin:0">Share</span></div>${extra}`;
  const PHASES = {
    card: () => cardHtml(false, '<span class="btn p" id="b-claim">This is me: claim</span>'),
    google: () => `<h2>Claim your soldier</h2><p class="m">Sign in so the game knows it is you.</p><div class="gbtn" id="b-g">G&nbsp; Sign in with Google</div>`,
    code: () => `<h2>Claim your soldier</h2><p class="m">Signed in with Google. Your claim code:</p><div class="code" id="cl-code"></div><p>Comment it under any @mudandiron post. Within minutes the soldier is yours.</p>`,
    ig: () => `<div class="ig"><div class="bar">Comments</div>
      <div class="c"><div class="av bot"></div><div><b>mudandiron</b> <span class="t">Verdel Ridge needs you</span><br>Comment CONCORD or HEGEMONY to enlist.</div></div>
      <div class="c" id="ig-me" style="opacity:0"><div class="av"></div><div><b>your.handle</b> <span class="t">now</span><br><span id="ig-code"></span></div></div>
      <div class="c rep" id="ig-bot" style="opacity:0"><div class="av bot"></div><div><b>mudandiron</b> <span class="t">now</span><br>✓ @your.handle, Anton Kessler is now yours. Your claim is confirmed, soldier.</div></div>
      <div class="in" id="ig-in"></div></div>`,
    mine: () => cardHtml(true, '<span class="btn" id="b-letter">✉ Send your soldier a letter</span><span class="btn" id="b-tr">Request a transfer</span>'),
    roles: () => `<h3>Request a transfer</h3><p class="m">Choose where Anton Kessler serves.</p>${ROLES.map((r, i) => `<div class="role" id="r${i}"><b>${r[1]}</b><span>${r[2]}</span></div>`).join('')}<div class="toast" id="tr-toast" style="opacity:0">Transfer requested.</div>`,
  };
  let phase = null;
  const setPhase = (p) => {
    if (phase === p) return;
    phase = p;
    $('#cl-scr').innerHTML = PHASES[p]();
    const cv = $('#cl-scr canvas[data-p]');
    if (cv) cv.getContext('2d').drawImage(portrait(), 0, 0);
  };

  function frame(t) {
    const f = fx(t);
    const tBut = T('but'), t1 = T('s1'), t2 = T('s2'), t3 = T('s3'), t4 = T('s4'), tL = T('letter'), tT = T('transfer'), tH = T('house'), tCta = T('cta');
    const phone = $('#cl-phone'), step = $('#cl-step');
    const showPhone = t >= t1 && t < tH;
    // filmový podklad: záběr pochodu / úkryt / rodokmen; telefon je nad ním
    if (t >= tH) race.draw('lineage', t - tH, { side: 1, house: 'Kessler', fallen: 'Anton Kessler', heir: 'Pavel Kessler', gen: 2, day: 4 });
    else if (t >= tL) race.draw('shelter', (t - tL) % 7, { side: 0 });
    else if (t >= t1) race.draw('shelter', (t - t1) % 7, { side: 1 });
    else race.draw('march', t, { side: 1, n: 12 });
    race.canvas.style.opacity = 1;
    $('#rd-dim2').style.opacity = showPhone ? 0.55 : t >= tCta ? clamp01((t - tCta) / 0.5) : 0;
    phone.style.opacity = showPhone ? 1 : 0;
    phone.style.transform = `translateY(${((1 - easeOut(clamp01((t - t1) / 0.4))) * 40).toFixed(1)}px)`;
    step.textContent = t < t2 ? 'STEP 1 \u00b7 TAP YOUR SOLDIER' : t < t3 ? 'STEP 2 \u00b7 SIGN IN, GET A CODE' : t < t4 ? 'STEP 3 \u00b7 COMMENT THE CODE' : t < tL ? 'DONE \u00b7 THE SOLDIER IS YOURS' : t < tT ? 'EVERY DAY \u00b7 A LETTER FROM HOME' : 'ANY TIME \u00b7 ASK FOR A TRANSFER';
    if (showPhone) {
      if (t < t2) { setPhase('card'); const b = $('#b-claim'); if (b) b.classList.toggle('hit', t > t2 - 1.2); }
      else if (t < t2 + 1.6) { setPhase('google'); const g = $('#b-g'); if (g) g.classList.toggle('hit', t > t2 + 0.9); }
      else if (t < t3) { setPhase('code'); const c = $('#cl-code'); if (c) c.textContent = typed('ENLIST-7KQ2', t, t2 + 1.9, 7); }
      else if (t < tL - 0.0 && t < t4 + 3.2) {
        setPhase('ig');
        const me = $('#ig-me'), bot = $('#ig-bot'), inp = $('#ig-in');
        if (inp) { inp.textContent = t < t3 + 3.2 ? typed('ENLIST-7KQ2', t, t3 + 1.2, 8) : ''; }
        if (me) me.style.opacity = t >= t3 + 3.2 ? 1 : 0;
        if ($('#ig-code')) $('#ig-code').textContent = 'ENLIST-7KQ2';
        if (bot) bot.style.opacity = t >= t4 + 1.2 ? 1 : 0;
      } else if (t < tT) {
        setPhase('mine');
        const b = $('#b-letter'); if (b) { b.classList.toggle('hit', t > tL + 1.8 && t < tL + 2.4); if (t > tL + 2.2) b.textContent = '✉ Letter sent'; }
      } else {
        setPhase('roles');
        const k = t > tT + 2.6 ? 0 : -1, r = $('#r0'), tt = $('#tr-toast');
        if (r) r.classList.toggle('on', k === 0);
        if (tt) tt.style.opacity = t > tT + 3.0 ? 1 : 0;
      }
    }
    paint({ ...f, black: Math.max(f.black, t < 0.5 ? 1 - t / 0.5 : 0, t > END - 0.8 ? clamp01((t - END + 0.8) / 0.7) : 0) });
    const logo = t >= tCta + 0.4;
    const bigEl = $('#rd-big');
    bigEl.style.opacity = logo ? Math.min(1, (t - tCta - 0.4) / 0.3) : 0;
    if (logo && !bigEl.dataset.on) { bigEl.dataset.on = 1; bigEl.className = 'logo'; bigEl.innerHTML = '<span>MUD <i>&amp;</i> IRON</span><span>@mudandiron · link in bio</span>'; }
    const s = sub(t), subEl = $('#rd-sub');
    subEl.style.top = showPhone ? '78%' : '69%';
    if (s && !logo) { subEl.style.opacity = 1; if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; } } else subEl.style.opacity = 0;
  }
  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
