// Virální reel o sběratelských kartičkách (25. 11. 2026; /?reel=cards&vacant=700, jen vývojový server), na výšku.
// Hák: „My war game has 8 hidden cards. Almost nobody will ever find this one.“ (rub se točí → WINGS, legendární) → skuteční hráči (mapa)
// → jak se najdou: raid (nová scéna loot: kráter, mrtvý nepřítel, kartička z kapsy), drát (wire: jeden voják se plazí, lesk v blátě),
// dopis z domova (letter: obálka, dopis, kartička) → každý nález otočení velké kartičky s vzácností → celá sada podle vzácnosti (5 / 2 / 1)
// → dědí se (skutečný rod Catatfire) → další výpravy přijdou → výzva. Scény jsou nové jen pro toto video (web/src/cinema-cards.js).
// Na mapě se nic neskrývá (žádný reflektor), takže nejsou vidět ani osiřelé záblesky; titulky jen v bezpečném pásu IG.
import { CSS as BASE } from './reel-day1.js';
import { FX_CSS, cues, camPath, subtitles, transitions, fxLayers, slam, clamp01, win, easeOut } from './reel-kit.js';
import { makeCardScenes } from './cinema-cards.js';
import script from '../../marketing/reels/cards.script.json';
import D from '../../marketing/reels/cards.data.json';

const files = import.meta.glob('../../marketing/reels/cards.vo.json', { eager: true, import: 'default' });
const RAR = { common: ['COMMON', '#c4b8a0', '#a39782'], rare: ['RARE', '#bcd2dc', '#8fb3c9'], legendary: ['LEGENDARY', '#f0b25a', '#d98f3f'] };
const SET = [['01', 'HELLO', 'common'], ['02', 'DREAMER', 'rare'], ['03', 'SUNDAY', 'common'], ['04', 'CALL ME', 'common'], ['05', 'GOGGLES', 'rare'], ['06', 'SEASIDE', 'common'], ['07', 'WINGS', 'legendary'], ['08', 'MY PAL', 'common']];
const IMG = (id) => `/assets/cards/${id ? `card_${id}` : 'back'}.png`;

const CSS = `${BASE}${FX_CSS}
#rd { overflow: hidden; }
#cd-art { position: absolute; inset: 0; width: 100%; height: 100%; image-rendering: pixelated; opacity: 0; object-fit: cover; }
#cd-dim { position: absolute; inset: 0; background: #0e0d0c; opacity: 0; }
#cd-big { position: absolute; left: 50%; top: 19%; width: 243px; height: 392px; margin-left: -121px; opacity: 0; }
#cd-big .glow { position: absolute; inset: -60px; border-radius: 50%; opacity: 0.8; }
#cd-big img { position: absolute; inset: 0; width: 100%; height: 100%; image-rendering: pixelated; box-shadow: 10px 12px 0 rgba(14,13,12,0.8); }
#cd-lab { position: absolute; left: 0; right: 0; top: 60.5%; text-align: center; font-family: 'Silkscreen', monospace; opacity: 0; text-shadow: 3px 3px 0 #0e0d0c; }
#cd-lab b { display: block; font-size: 40px; font-weight: 400; color: #e3d9c3; } #cd-lab span { font-size: 26px; letter-spacing: 0.1em; }
#cd-hook { position: absolute; left: 6%; right: 6%; top: 15.5%; text-align: center; font-family: 'Silkscreen', monospace; font-size: 36px; line-height: 1.15; color: #e3d9c3; text-shadow: 4px 4px 0 #0e0d0c; opacity: 0; }
#cd-hook i { font-style: normal; color: #f0b25a; }
#cd-grid { position: absolute; left: 0; right: 0; top: 17%; height: 470px; opacity: 0; }
#cd-grid .c { position: absolute; width: 108px; height: 174px; transition: none; }
#cd-grid .c img { width: 100%; height: 100%; image-rendering: pixelated; box-shadow: 6px 8px 0 rgba(14,13,12,0.8); }
#cd-grid .t { position: absolute; left: -6px; right: -6px; top: 178px; text-align: center; font-family: 'Silkscreen', monospace; font-size: 12px; color: #c4b8a0; text-shadow: 2px 2px 0 #0e0d0c; }
#cd-tier { position: absolute; left: 0; right: 0; top: 66%; text-align: center; font-family: 'Silkscreen', monospace; font-size: 34px; opacity: 0; text-shadow: 3px 3px 0 #0e0d0c; }
#cd-heir { position: absolute; left: 6%; right: 6%; top: 18%; text-align: center; opacity: 0; font-family: 'Silkscreen', monospace; color: #e3d9c3; }
#cd-heir .n { display: inline-block; font-size: 24px; padding: 8px 12px; background: rgba(14,13,12,0.92); border: 3px solid #524a3f; }
#cd-heir .n.dead { color: #c9b99a; text-decoration: line-through; text-decoration-thickness: 3px; }
#cd-heir img { width: 162px; height: 261px; image-rendering: pixelated; margin: 18px 0; box-shadow: 8px 10px 0 rgba(14,13,12,0.8); }
#cd-heir .s { position: absolute; left: 50%; top: 46%; transform: translate(-50%, -50%) rotate(-10deg); font-size: 34px; color: #c8553d; border: 5px solid #c8553d; padding: 2px 14px; background: rgba(14,13,12,0.6); }
#cd-panel { position: absolute; left: 6%; right: 6%; top: 18%; text-align: center; background: rgba(14,13,12,0.92); border: 3px solid #d98f3f; padding: 14px; opacity: 0; font-family: 'Silkscreen', monospace; color: #e3d9c3; font-size: 30px; line-height: 1.2; }
#cd-panel b { display: block; font-size: 70px; font-weight: 400; color: #c9c26a; line-height: 1; margin: 6px 0; }
#cd-panel small { display: block; font-family: 'VT323', monospace; font-size: 30px; color: #c9b99a; }
#cd-cta { position: absolute; left: 6%; right: 6%; top: 30%; text-align: center; background: rgba(14,13,12,0.95); border: 4px solid #d98f3f; padding: 16px; opacity: 0; }
#cd-cta .big { font-family: 'Silkscreen', monospace; font-size: 38px; color: #d98f3f; line-height: 1.15; } #cd-cta .sm { font-family: 'VT323', monospace; font-size: 30px; color: #e3d9c3; margin-top: 8px; line-height: 1.1; }
#cd-cta .url { font-family: 'Silkscreen', monospace; font-size: 24px; color: #e3d9c3; margin-top: 10px; border-top: 2px solid #524a3f; padding-top: 10px; }
`;

export async function startCardsReel({ cam, map, soldiers, tex, anims }) {
  let vo = files['../../marketing/reels/cards.vo.json'];
  if (!vo) {
    let c = 0;
    vo = { lines: script.lines.map(([at, text, id]) => { const s = Math.max(at, c), d = text.length / 15 + 0.2; c = s + d + 0.25; return [s, d, text, id]; }) };
    vo.seconds = c + 2.0;
  }
  const C = cues(vo);
  const END = vo.seconds;
  const tt = Object.fromEntries(script.lines.map((l) => [l[2], C.at(l[2])]));
  const T = map.tile, mid = ((map.front[0] + map.front[1]) / 2) * T;
  const front = (f) => soldiers.filter((s) => s.faction === f && s.slot?.line === 'front' && !s.vacant).sort((a, b) => a.x - b.x);
  const fH = front(0), fC = front(1);
  const hRef = fH[Math.floor(fH.length * 0.5)] || soldiers[0], cRef = fC[Math.floor(fC.length * 0.5)] || soldiers[0];
  // kamera jen na mapě (skuteční hráči, „další výpravy“, výzva); ostatní je obraz přes celou plochu
  const camAt = camPath([[0, hRef.x, mid, 1.0, 'cut'], [tt.real, hRef.x - 250, mid, 1.15, 'cut'], [tt.raid - 0.01, hRef.x + 150, mid, 1.25],
    [tt.more, cRef.x - 200, mid, 1.0, 'cut'], [tt.cta - 0.01, cRef.x + 200, mid, 1.05], [tt.cta, hRef.x - 100, mid, 1.1, 'cut'], [END, hRef.x + 100, mid, 1.15]]);
  // velké otočení kartičky: [od, do, id] (hák: rub se točí a pak WINGS)
  const PICK = { raid: 3.0, wire: 3.4, letter: 2.8 };
  const reveals = [
    [tt.hook + 2.2, tt.real - 0.05, '07', 1.0],
    [tt.raid2, tt.wire - 0.05, '05', 0],
    [tt.wire + 4.2, tt.letter - 0.05, '03', 0],
    [tt.letter + 4.0, tt.rarity - 0.05, '08', 0],
  ];
  const sub = subtitles(vo);
  const fx = transitions([[tt.real, 'whip'], [tt.raid, 'black', 0.5], [tt.raid + PICK.raid, 'flash'], [tt.wire, 'black', 0.5], [tt.wire + PICK.wire, 'flash'], [tt.letter, 'black', 0.5],
    [tt.letter + PICK.letter, 'flash'], [tt.rarity, 'whip'], [tt.wings, 'flash'], [tt.heir, 'black', 0.4], [tt.more, 'whip'], [tt.cta, 'black', 0.4]].sort((a, b) => a[0] - b[0]));
  const SFX = [[tt.hook + 2.2, 'reveal', 0], [tt.raid2, 'reveal', 0], [tt.wire + 4.2, 'reveal', 0], [tt.letter + 4.0, 'reveal', 0], [tt.wings, 'medal', 0], [tt.heir + 1.2, 'stamp', 0], [tt.cta, 'drum', 0], [END - 1.3, 'end', 0]];

  document.body.classList.add('reel');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const root = document.createElement('div');
  root.id = 'rd';
  const pos = (i) => { const r = Math.floor(i / 4), c = i % 4; return [36 + c * 120, r * 228]; };
  root.innerHTML = `
    <div id="cd-dim"></div>
    <div id="cd-hook">MY WAR GAME HAS<br><i>8 HIDDEN CARDS</i></div>
    <div id="cd-big"><div class="glow"></div><img class="back" src="${IMG(null)}" alt=""><img class="face" src="${IMG('07')}" alt=""></div>
    <div id="cd-lab"><b></b><span></span></div>
    <div id="cd-grid">${SET.map(([id, n], i) => { const [x, y] = pos(i); return `<div class="c" data-r="${SET[i][2]}" style="left:${x}px;top:${y}px"><img src="${IMG(id)}" alt=""><div class="t">${n}</div></div>`; }).join('')}</div>
    <div id="cd-tier"></div>
    <div id="cd-heir"><div class="n dead">✝ ${D.heir.dead.toUpperCase()}</div><br><img src="${IMG('02')}" alt=""><br><div class="n">${D.heir.heir.toUpperCase()}</div><div class="s">INHERITED</div></div>
    <div id="cd-panel"></div>
    <div id="cd-cta"><div class="big">COMMENT<br>HEGEMONY or CONCORD</div><div class="sm">your soldier joins the war.<br>Then go find all 8 cards.</div><div class="url">mudandiron.app · free</div></div>
    <div id="rd-big"></div>
    <div id="rd-sub"></div>
  `;
  document.body.appendChild(root);
  const paint = fxLayers(root);
  const $ = (s) => root.querySelector(s);
  const show = (sel, o) => { const el = $(sel); if (el) el.style.opacity = o; };
  const sc = await makeCardScenes(tex, anims);
  sc.canvas.id = 'cd-art'; root.prepend(sc.canvas);
  const big = $('#cd-big'), back = big.querySelector('.back'), face = big.querySelector('.face'), glowEl = big.querySelector('.glow');
  const cells = [...root.querySelectorAll('#cd-grid .c')];

  function frame(t) {
    const f = fx(t);
    const [x, y, z] = camAt(t);
    cam.set(x, y, z * (1 + 0.05 * f.punch));
    for (const q of soldiers) if (q.sprite && q.vacant && q.sprite.alpha < 1) q.sprite.alpha = 1; // žádní duchové
    // filmové scény
    const film = t >= tt.raid && t < tt.wire ? ['loot', t - tt.raid, { pick: PICK.raid }]
      : t >= tt.wire && t < tt.letter ? ['wire', t - tt.wire, { pick: PICK.wire }]
      : t >= tt.letter && t < tt.rarity ? ['letter', t - tt.letter, { pick: PICK.letter }] : null;
    if (film) sc.draw(film[0], film[1], film[2]);
    show('#cd-art', film ? 1 : 0);
    // pozadí karet: tma (hák, sada, dědictví) nebo ztmavená scéna při otočení
    const R = reveals.find(([a, b]) => t >= a && t < b);
    const overlay = t < tt.real || (t >= tt.rarity && t < tt.more);
    show('#cd-dim', overlay ? 0.92 : R ? 0.6 * clamp01((t - R[0]) / 0.3) : t >= tt.cta ? 0.45 : 0);
    paint({ ...f, black: Math.max(f.black, t > END - 0.6 ? clamp01((t - END + 0.6) / 0.5) : 0) }, 0);
    // hák: rub se točí (0–2,2 s), pak otočení na WINGS
    show('#cd-hook', win(t, 0.1, tt.hook + 2.15, 0.2)); // po otočení zmizí, ať nepřekrývá kartičku
    let flip = null;
    if (t < tt.hook + 2.2 && t >= 0) flip = { id: '07', spin: t };
    else if (R) flip = { id: R[2], at: R[0] };
    big.style.opacity = flip ? 1 : 0;
    if (flip) {
      const id = flip.id, rar = SET.find((s) => s[0] === id)[2], [rn, col, gl] = RAR[rar];
      if (face.dataset.id !== id) { face.dataset.id = id; face.src = IMG(id); }
      let sx, showFace;
      if (flip.spin != null) { const a = flip.spin * 2.2; sx = Math.cos(a); showFace = false; } // rub se točí
      else { const k = clamp01((t - flip.at) / 0.45); sx = Math.cos((1 - k) * Math.PI); showFace = k > 0.5; }
      const s = flip.spin != null ? 0.85 + 0.05 * Math.sin(t * 3) : 1 + 0.06 * Math.exp(-(t - flip.at) * 4);
      big.style.transform = `translateY(${flip.spin != null ? 70 : 0}px) scale(${Math.max(0.02, Math.abs(sx)) * s}, ${s})`; // při háku níž, ať nepřekrývá nápis
      back.style.opacity = showFace ? 0 : 1; face.style.opacity = showFace ? 1 : 0;
      glowEl.style.background = showFace ? `radial-gradient(circle, ${gl}cc 0%, ${gl}00 65%)` : 'none';
      const lab = $('#cd-lab');
      lab.style.opacity = showFace ? 1 : 0;
      if (showFace && lab.dataset.id !== id) {
        lab.dataset.id = id;
        const name = SET.find((s) => s[0] === id)[1];
        lab.querySelector('b').textContent = `#${id} ${name}`;
        lab.querySelector('span').textContent = rar === 'legendary' ? `${rn} · 1 IN 20` : rn;
        lab.querySelector('span').style.color = col;
      }
    } else show('#cd-lab', 0);
    // panel: skuteční hráči / další výpravy
    const pan = t >= tt.real && t < tt.raid ? 'real' : t >= tt.more && t < tt.cta ? 'more' : null;
    const P = $('#cd-panel');
    P.style.opacity = pan ? win(t, pan === 'real' ? tt.real + 0.2 : tt.more + 0.2, pan === 'real' ? tt.raid - 0.05 : tt.cta - 0.05, 0.2) : 0;
    if (pan && P.dataset.k !== pan) {
      P.dataset.k = pan;
      P.innerHTML = pan === 'real' ? `EVERY SOLDIER IS<br>A REAL PERSON<b>0</b><small>on the front right now</small>` : `MORE MISSIONS<br>ARE COMING<small>night raids · the wire · letters home<br>and more ways to find them</small>`;
    }
    if (pan === 'real') P.querySelector('b').textContent = Math.round((D.army[0] + D.army[1]) * easeOut(clamp01((t - tt.real - 0.3) / 1.2))).toLocaleString('en-US');
    // celá sada: nejdřív běžné, pak vzácné, pak legendární (ostatní ztmavené)
    const gridOn = t >= tt.rarity && t < tt.heir;
    show('#cd-grid', gridOn ? win(t, tt.rarity, tt.heir - 0.05, 0.25) : 0);
    const tier = t < tt.rarity + C.len('rarity') * 0.45 ? 'common' : t < tt.wings ? 'rare' : 'legendary';
    if (gridOn) cells.forEach((el, i) => {
      const on = el.dataset.r === tier, k = easeOut(clamp01((t - tt.rarity - i * 0.08) / 0.4));
      el.style.opacity = k * (on ? 1 : 0.28);
      el.style.transform = `translateY(${(1 - k) * 60}px) scale(${on ? (tier === 'legendary' ? 1.25 : 1.06) : 0.94})`;
      el.style.zIndex = on ? 2 : 1;
      el.style.filter = on && tier === 'legendary' ? 'drop-shadow(0 0 18px #d98f3f)' : 'none';
    });
    const tierEl = $('#cd-tier');
    tierEl.style.opacity = gridOn ? 1 : 0;
    if (gridOn && tierEl.dataset.t !== tier) { tierEl.dataset.t = tier; tierEl.style.color = RAR[tier][1]; tierEl.textContent = tier === 'common' ? '5 COMMON' : tier === 'rare' ? '2 RARE' : '1 LEGENDARY'; }
    // dědictví
    show('#cd-heir', win(t, tt.heir + 0.1, tt.more - 0.05, 0.2));
    $('#cd-heir .s').style.opacity = t > tt.heir + 1.2 ? 1 : 0;
    $('#cd-heir .s').style.transform = `translate(-50%, -50%) rotate(-10deg) scale(${1 + 0.6 * Math.exp(-Math.max(0, t - tt.heir - 1.2) * 8)})`; // bez max se razítko před časem nafouklo a stránka ujela do strany
    // výzva
    slam($('#cd-cta'), t, tt.cta + 0.2, END - 1.3, 1.25, -2);
    const logo = t >= END - 1.3;
    const bigEl = $('#rd-big');
    bigEl.style.opacity = logo ? Math.min(1, (t - END + 1.3) / 0.3) : 0;
    if (logo && !bigEl.dataset.on) { bigEl.dataset.on = 1; bigEl.className = 'logo'; bigEl.innerHTML = '<span>MUD <i>&amp;</i> IRON</span><span>@mudandiron · mudandiron.app</span>'; }
    // titulky: ve scénách nahoře (17 %), u karet a na mapě dole (nad lištou IG)
    const s = sub(t), subEl = $('#rd-sub');
    if (s && !logo) {
      subEl.style.opacity = 1;
      const topBand = !!film && !R;
      subEl.style.top = topBand ? '17%' : 'auto'; subEl.style.bottom = topBand ? 'auto' : '22%';
      if (subEl.dataset.text !== s) { subEl.dataset.text = s; subEl.innerHTML = `<span>${s}</span>`; }
    } else subEl.style.opacity = 0;
  }
  window.__reel = { seconds: END, sfx: SFX, frame, ready: true };
}
