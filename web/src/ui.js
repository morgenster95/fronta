// DOM vrstva: počty, hledání @handle, karta vojáka se služebním záznamem, panel „Enlist“, sdílení.
import { shardOf } from '../../engine/roster.js';
import { startClaim, sendTransfer, sendLetter, signInAsOwner, myAccount, signOutHere, signInHere } from './claim.js';
import { shareCard } from './share.js';
import { paperTexture, tornClip } from './paper.js';
import { initValley } from './valley.js';
import { initHouse } from './house.js';

const $ = (id) => document.getElementById(id);
const STATUS = ['On the line', 'Wounded', 'Missing in action', 'Prisoner of war', 'Fallen'];
const ORD = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
const shardCache = new Map();
const oldCache = new Map(); // starší zápisy (records-old), načtou se až na kliknutí

// Den 0 = mobilizace (nábor před začátkem války)
const dayLabel = (d) => (d > 0 ? `Day ${d}` : 'Mobilization');

export function initUI({ theme, roster, soldiers, tex, onSelect, onZoom }) {
  const [A, B] = theme.factions;
  // ampersand ve Silkscreenu vypadá jako €, proto ho sázíme písmem VT323
  $('title').innerHTML = esc(theme.title).replace('&amp;', '<span class="amp">&amp;</span>');
  document.title = theme.title;
  $('day').textContent = roster.day > 0 ? `Day ${roster.day}` : 'Mobilization';
  const n = [0, 1].map((f) => soldiers.filter((s) => s.faction === f && !s.vacant).length);
  const vacantCount = soldiers.filter((s) => s.vacant).length;
  $('total').textContent = `${(n[0] + n[1]).toLocaleString('en')} enlisted` + (vacantCount ? ` · ${vacantCount} posts waiting` : '');
  $('split-a').style.flex = n[0] || 1;
  $('split-b').style.flex = n[1] || 1;
  $('split-a').style.background = A.color;
  $('split-b').style.background = B.color;
  $('lab-a').textContent = `${A.name.replace('The ', '')} ${n[0].toLocaleString('en')}`;
  $('lab-b').textContent = `${B.name.replace('The ', '')} ${n[1].toLocaleString('en')}`;

  // padlí: přetahovaný pruh ve barvách stran (kdo má méně padlých, vede)
  const fl = roster.fallen;
  if (fl && fl[0] + fl[1] > 0) {
    $('fallen').hidden = false;
    $('fallen-total').textContent = (fl[0] + fl[1]).toLocaleString('en');
    $('split-fa').style.flex = fl[0] || 0.0001;
    $('split-fb').style.flex = fl[1] || 0.0001;
    $('split-fa').style.background = A.color;
    $('split-fb').style.background = B.color;
    $('lab-fa').textContent = `${A.name.replace('The ', '')} ${fl[0].toLocaleString('en')}`;
    $('lab-fb').textContent = `${B.name.replace('The ', '')} ${fl[1].toLocaleString('en')}`;
  }

  // hlasování (starší „Dispatch“ o výsledku minulého hlasování a stavbách se v panelu už neukazuje: jen aktuální věci, deník fronty a závod)
  if (roster.vote) {
    $('dispatch').hidden = false;
    // na telefonu sbalené do jednoho řádku, klepnutím se rozbalí
    $('dispatch-more').textContent = `▸ The front decides · ${roster.vote.votes} votes`;
    if (innerWidth < 600) $('dispatch').classList.add('collapsed');
    $('dispatch').onclick = () => $('dispatch').classList.toggle('collapsed');
    if (roster.vote) {
      const v = roster.vote;
      $('vote').hidden = false;
      $('vote').innerHTML = `<span class="d">The front decides</span>${esc(v.question)}<br>` +
        v.options.map((o) => `<span class="kw" title="${esc(o.label)}">${esc(o.kw)}</span>`).join('') +
        `<span class="muted"> ${v.perFaction ? 'comment under our latest post · each side votes for itself' : "comment under today's reel"} · ${v.votes} votes</span>`;
    }
  }

  // závod frakcí o kótu (motivace pozvat další)
  const race = roster.race;
  const raceBars = (r) => [0, 1].map((f) => {
    const fac = theme.factions[f];
    return `<div class="race-row"><span>${esc(fac.name.replace('The ', ''))}</span><span class="bar"><i style="width:${Math.min(100, (r.counts[f] / r.need) * 100)}%;background:${fac.color}"></i></span><span class="muted">${r.counts[f]}/${r.need}</span></div>`;
  }).join('');
  if (race) {
    $('dispatch').hidden = false;
    const el = document.createElement('div');
    el.className = 'unlock';
    el.innerHTML = `<span class="d">The race for ${esc(race.name)}</span>${raceBars(race)}`;
    el.onclick = (ev) => { ev.stopPropagation(); show('warroom'); };
    $('dispatch').appendChild(el);
  }

  $('zoom-in').onclick = () => onZoom(1.5);
  $('zoom-out').onclick = () => onZoom(1 / 1.5);

  // panel náboru
  const ig = theme.instagram.replace('@', '');
  $('ig-link').href = `https://instagram.com/${ig}`;
  $('ig-link').textContent = theme.instagram;
  $('enlist-factions').innerHTML = '';
  for (const f of theme.factions) {
    const b = document.createElement('span');
    b.className = 'kw';
    b.style.borderColor = f.color;
    b.textContent = f.keyword;
    b.title = 'Copy';
    b.onclick = () => copy(f.keyword, `${f.keyword} copied. Paste it as a comment.`);
    $('enlist-factions').appendChild(b);
  }
  const lore = theme.lore || {};
  $('lore-tagline').textContent = lore.tagline || '';
  $('lore-short').textContent = lore.short || '';
  $('side-a').innerHTML = `<b style="color:${A.color}">${esc(A.name)}</b>${esc(lore.hegemony || A.motto)}`;
  $('side-b').innerHTML = `<b style="color:${B.color}">${esc(B.name)}</b>${esc(lore.concord || B.motto)}`;
  $('enlist-btn').onclick = () => show('enlist');

  // War Room: aktuální rozhodnutí, odemykání, historie rozhodnutí
  $('wr-day').textContent = `${roster.day > 0 ? `Day ${roster.day} of the war` : 'Mobilization'} · ${(n[0] + n[1]).toLocaleString('en')} soldiers on the line`;
  if (roster.vote) {
    $('wr-vote').innerHTML = `<p>${esc(roster.vote.question)}</p>` +
      roster.vote.options.map((o) => `<div class="vote-opt"><span class="kw">${esc(o.kw)}</span><span>${esc(o.label)}</span></div>`).join('') +
      `<p class="muted">${roster.vote.note ? esc(roster.vote.note) : `Comment one word under today's reel on ${esc(theme.instagram)}.`} One vote per account, your last comment counts. ${roster.vote.votes} votes so far.</p>`;
  } else {
    $('wr-vote').innerHTML = `<p class="muted">No open decision right now. The next one comes with the next reel on ${esc(theme.instagram)}.</p>`;
  }
  $('wr-unlocks').innerHTML = race
    ? `<p>The first side to bring <b>${race.need}</b> new soldiers to the front takes <b>${esc(race.name)}</b>. ${esc(race.reward || '')}</p>${raceBars(race)}` +
      `<p class="muted">Every friend who comments ${theme.factions.map((x) => `<b>${esc(x.keyword)}</b>`).join(' or ')} on ${esc(theme.instagram)} counts. After the battle, a new race begins.</p>` +
      ((roster.victories || []).length ? `<ol class="history">${roster.victories.map((v) => `<li><span class="d">Day ${v.day} · ${esc(theme.factions[v.faction].name.replace('The ', ''))}</span>took ${esc(v.name)} · deciding rifle: @${esc(v.hero)}</li>`).join('')}</ol>` : '')
    : '<p class="muted">—</p>';
  $('wr-history').innerHTML = (roster.history || []).map((e) => {
    const tot = Object.values(e.counts || {}).reduce((a, b) => a + b, 0) || 1;
    const res = Object.entries(e.counts || {}).map(([k, v]) => `${esc(k)} ${Math.round((v / tot) * 100)}%`).join(' · ');
    return `<li><span class="d">Day ${e.day} · ${esc(e.winner)}</span>${esc(e.question)}<br><span class="muted">${res}</span><br>${esc(e.text || '')}</li>`;
  }).join('') || '<li class="muted">The war has just begun. The first decision is yours.</li>';
  $('warroom-btn').onclick = () => show('warroom');

  // Deník fronty: ruční zápisy + kronika dne; @handle → karta vojáka
  const byHandle = new Map(soldiers.filter((s) => s.handle).map((s) => [s.handle, s]));
  let diaryLoaded = null;
  const WEATHER = { rain: '🌧', fog: '🌫', frost: '❄', clear: '☀', storm: '⛈', wind: '💨' };
  const linkify = (html) =>
    html.replace(/@([a-z0-9._]+[a-z0-9_])/gi, (m, h) => (byHandle.has(h.toLowerCase()) ? `<a href="?s=${h}" data-h="${h.toLowerCase()}">@${h}</a>` : m));
  const para = (t) => String(t).split(/\n\n+/).map((p) => `<p>${linkify(esc(p))}</p>`).join('');
  // příští vydání novin (pevná hodina UTC) v místním čase čtenáře
  const H = theme.schedule?.editionUtc ?? 0;
  function nextEdition() {
    // přesný čas ze stavu hry (dnešní vydání už mohlo vyjít); jinak nejbližší H:00 UTC
    if (roster.nextEdition && Date.parse(roster.nextEdition) > Date.now()) return new Date(roster.nextEdition);
    const n = new Date();
    const t = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate(), H));
    if (t <= n) t.setUTCDate(t.getUTCDate() + 1);
    return t;
  }
  function editionTime() {
    return nextEdition().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  async function openDiary() {
    show('diary');
    const hrs = Math.max(1, Math.round((nextEdition() - Date.now()) / 3600e3));
    const when = nextEdition().toDateString() === new Date().toDateString() ? 'today' : 'tomorrow';
    $('diary-next').textContent = `Next edition ${when} at ${editionTime()} your time (in ${hrs} h). Every day at ${H}:00 UTC.`;
    diaryLoaded ??= fetch('/data/diary.json', { cache: 'no-cache' }).then((r) => r.json()).catch(() => null);
    const d = await diaryLoaded;
    const list = $('diary-list');
    if (!d?.entries?.length) {
      list.innerHTML = `<p class="muted">The diary is still blank. The first edition is printed at ${editionTime()}.</p>`;
      return;
    }
    const WNAME = { rain: 'Rain', fog: 'Fog', frost: 'Frost', clear: 'Clear', storm: 'Storm', wind: 'Wind' };
    list.innerHTML = d.entries.map((e, i) => {
      const seed = e.day * 2 + (e.kind === 'note' ? 1 : 0);
      const mast = `<header class="mast">
          <div class="mast-top"><span>${dayLabel(e.day)}</span><span>${e.weather ? `${WEATHER[e.weather] || ''} ${WNAME[e.weather] || esc(e.weather)}` : 'Special edition'}</span><span>Price: one cigarette</span></div>
          <div class="mast-name">The Trench Gazette</div>
          <div class="mast-sub">${e.kind === 'note' ? `Dispatch from ${esc(e.by || 'Field HQ')}` : 'Printed in a dugout behind Verdel Ridge · by field telegraph'}</div>
        </header>`;
      const headline = `<h4 class="headline">${esc(e.title || '')}</h4>`;
      const body = e.kind === 'note'
        ? `<div class="cols">${para(e.text)}</div>`
        : `<div class="cols">${(e.blocks || []).map((b) =>
            `<section class="art${b.h === 'Roll call' || b.kind === 'expedition-call' ? ' notice' : ''}">` +
            (b.h ? `<h5>${esc(b.h)}</h5>` : '') +
            (b.items ? `<ul>${b.items.map((x) => `<li>${linkify(esc(x))}</li>`).join('')}</ul>` : `<p>${linkify(esc(b.text))}</p>`) +
            '</section>').join('')}</div>`;
      const style = `background-image:url(${paperTexture(seed)});clip-path:${tornClip(seed)};--tilt:${i % 2 ? 0.5 : -0.4}deg`;
      return `<div class="paper-wrap"><article class="paper ${e.kind}" style="${style}">${mast}${headline}${body}</article></div>`;
    }).join('');
    list.onclick = (ev) => {
      const a = ev.target.closest('a[data-h]');
      if (!a) return;
      ev.preventDefault();
      const s = byHandle.get(a.dataset.h);
      if (s) openSoldier(s);
    };
  }
  $('diary-btn').onclick = openDiary;
  if (roster.diary) {
    // upoutávka na poslední zápis v horním panelu
    $('dispatch').hidden = false;
    const el = document.createElement('div');
    el.className = 'diary-teaser';
    el.innerHTML = `<span class="d">Front Diary · ${dayLabel(roster.diary.day)}</span>${esc(roster.diary.title)} <span class="muted">· read</span>`;
    el.onclick = (ev) => { ev.stopPropagation(); openDiary(); };
    $('dispatch').prepend(el);
    // sbalený řádek ukazuje nejnovější: dnešní Deník fronty má přednost před starší zprávou (hlasování má přednost vždy)
    if (!roster.vote) $('dispatch-more').textContent = `▸ Front Diary · ${dayLabel(roster.diary.day)}`;
  }
  // Údolí a výpravy; upoutávka na otevřenou výpravu v horním panelu
  const valley = initValley({ theme, roster, soldiers, openSoldier: (s) => openSoldier(s), toast: (m) => toast(m), show: (id) => show(id) });
  if (roster.valley?.open) {
    $('dispatch').hidden = false;
    const el = document.createElement('div');
    el.className = 'diary-teaser';
    el.innerHTML = `<span class="d">Volunteers wanted</span>Night raid on ${esc(roster.valley.open.name)} · comment ${esc(roster.valley.open.keyword)} <span class="muted">· map</span>`;
    el.onclick = (ev) => { ev.stopPropagation(); valley.open(); };
    $('dispatch').prepend(el);
    if (!roster.vote) $('dispatch-more').textContent = `▸ Volunteers wanted · ${roster.valley.open.keyword}`;
  }
  // na telefonu je horní panel vždy sbalený do jednoho řádku, klepnutím se rozbalí
  // tlačítko × panel sbalí (klepnutí na sbalený panel ho zase rozbalí)
  $('dispatch-close').onclick = (e) => { e.stopPropagation(); $('dispatch').classList.add('collapsed'); };
  if (!$('dispatch').hidden && !$('dispatch').onclick) {
    if (!$('dispatch-more').textContent) $('dispatch-more').textContent = '▸ News from the front';
    if (innerWidth < 600) $('dispatch').classList.add('collapsed');
    $('dispatch').onclick = () => $('dispatch').classList.toggle('collapsed');
  }
  if (new URLSearchParams(location.search).has('diary')) setTimeout(openDiary, 600);
  document.querySelectorAll('[data-close]').forEach((b) => (b.onclick = () => closeAll()));

  // hledání
  const index = soldiers.map((s) => s.handle || '');
  const input = $('search-input');
  const list = $('suggest');
  let hits = [];
  let cursor = -1;
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase().replace(/^@/, '');
    if (q.length < 2) return hide();
    hits = [];
    for (let i = 0; i < index.length && hits.length < 8; i++) if (index[i].startsWith(q)) hits.push(soldiers[i]);
    for (let i = 0; i < index.length && hits.length < 8; i++) if (!index[i].startsWith(q) && index[i].includes(q)) hits.push(soldiers[i]);
    cursor = -1;
    list.innerHTML = '';
    for (const s of hits) {
      const li = document.createElement('li');
      li.innerHTML = `<span>@${esc(s.handle)}</span><span class="muted">${esc(theme.factions[s.faction].name.replace('The ', ''))}</span>`;
      li.onpointerdown = (e) => { e.preventDefault(); choose(s); };
      list.appendChild(li);
    }
    if (!hits.length) list.innerHTML = '<li class="muted">No such soldier. Not enlisted yet?</li>';
    list.hidden = false;
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      cursor = (cursor + (e.key === 'ArrowDown' ? 1 : -1) + hits.length) % hits.length;
      [...list.children].forEach((li, i) => li.classList.toggle('on', i === cursor));
      e.preventDefault();
    }
  });
  $('search').addEventListener('submit', (e) => {
    e.preventDefault();
    if (hits.length) choose(hits[Math.max(0, cursor)]);
  });
  input.addEventListener('blur', () => setTimeout(hide, 150));
  function hide() { list.hidden = true; }
  function choose(s) {
    input.value = `@${s.handle}`;
    hide();
    input.blur();
    openSoldier(s);
  }

  // karta vojáka
  async function openSoldier(s, fly = true) {
    onSelect(s, fly);
    const f = theme.factions[s.faction];
    if (s.vacant) {
      $('card-rank').textContent = 'Nobody yet';
      $('card-name').textContent = 'Unclaimed post';
      $('card-handle').textContent = '';
      $('card-faction').innerHTML = `<span style="color:${f.color}">■</span> ${esc(f.name)}`;
      $('card-role').textContent = s.archetype?.name ?? '';
      $('card-unit').textContent = '—';
      $('card-sector').textContent = `${s.slot.label || ''} · ${theme.lines[s.slot.line] ?? ''}`;
      $('card-status').textContent = 'Waiting for a name';
      $('card-enlisted').textContent = '—';
      $('card-family').innerHTML = '';
      $('card-record').innerHTML = `<li>This rifle has no name yet. Comment <b>${esc(f.keyword)}</b> under our pinned reel on ${esc(theme.instagram)} and the next free post on the ${esc(f.name.replace('The ', ''))} line is yours.</li>`;
      drawPortrait(s);
      $('card-share').onclick = () => show('enlist');
      $('card-house').hidden = true;
      $('card-share').textContent = 'How to enlist';
      $('card-claim').hidden = true;
      $('card-transfer').hidden = true;
      $('card-transfer-box').hidden = true;
      $('card-transfer-box').innerHTML = '';
      $('card-account').hidden = true;
      $('card-name').dataset.handle = '';
      show('card');
      return;
    }
    $('card-share').textContent = 'Share';
    $('card-rank').textContent = theme.ranks[s.rank];
    $('card-name').textContent = s.name;
    $('card-handle').textContent = `@${s.handle}`;
    $('card-handle').href = `https://instagram.com/${encodeURIComponent(s.handle)}`;
    $('card-faction').innerHTML = `<span style="color:${f.color}">■</span> ${esc(f.name)}`;
    $('card-role').textContent = s.archetype?.name ?? '';
    $('card-status').textContent = STATUS[s.status] ?? '';
    $('card-unit').textContent = '…';
    $('card-sector').textContent = '…';
    $('card-enlisted').textContent = '…';
    $('card-family').innerHTML = '';
    $('card-record').innerHTML = '<li class="muted">Fetching papers…</li>';
    drawPortrait(s);
    $('card-share').onclick = () => share(s);
    $('card-house').hidden = false;
    $('card-house').onclick = () => house.openHouse(s.handle);
    $('card-claim').hidden = s.claimed;
    $('card-claim').onclick = () => startClaim(s, theme, toast);
    // převelení: jen převzatý voják, ne důstojník
    $('card-transfer').hidden = true;
    $('card-transfer-box').hidden = true;
    $('card-transfer-box').innerHTML = '';
    $('card-account').hidden = true;
    $('card-name').dataset.handle = s.handle;
    renderAccount(s);
    show('card');
    const rec = await loadRecord(s.handle);
    if (!rec) return;
    $('card-transfer').onclick = () => openTransfer(s, rec);
    $('card-unit').textContent = rec.unit;
    $('card-sector').textContent = `${rec.sector} · ${theme.lines[rec.line] ?? rec.line}`;
    $('card-enlisted').textContent = dayLabel(rec.enlisted);
    const fam = [];
    if (s.generation > 1) fam.push(`<b>${ORD[s.generation] || s.generation + 'th'}</b> of the House of ${esc(rec.family)} at the front.`);
    for (const p of rec.fallen || []) fam.push(`✝ ${esc(p.name)}, fell on Day ${p.day}`);
    if (rec.background) fam.unshift(`<span class="bg">${esc(rec.background)}</span>`);
    if (s.medals?.includes('first-wave')) fam.unshift('<span class="medal">🎖 First Wave</span> one of the first 100 to enlist');
    if (s.medals?.includes('raiders-cross')) fam.unshift(`<span class="medal">✠ Raider's Cross</span> ${rec.raids || 3} night raids`);
    else if (rec.raids) fam.push(`Night raids: ${rec.raids}`);
    for (const m of s.medals || []) {
      if (m.startsWith('hero:')) {
        const v = (roster.victories || []).find((x) => x.id === m.slice(5));
        fam.unshift(`<span class="medal">🏅 Medal of Valor</span> decided the battle for ${esc(v?.name ?? 'the ridge')}${v ? `, Day ${v.day}` : ''}`);
        continue;
      }
      if (!m.startsWith('obj:')) continue;
      const v = (roster.victories || []).find((x) => x.id === m.slice(4));
      fam.unshift(`<span class="medal">🎖 ${esc(v?.name ?? 'Battle')}</span> fought on the winning side${v ? `, Day ${v.day}` : ''}`);
    }
    for (const title of rec.titles || []) fam.unshift(`<span class="title">★ ${esc(title)}</span>`);
    $('card-family').innerHTML = fam.join('<br>');
    // zápisy téhož dne (starší záznamy z úvodu, smrt a příchod nástupce) se ukážou pod jedním nadpisem dne
    const li = (list) => {
      const days = [];
      for (const [d, t] of list) {
        const g = days.at(-1);
        if (g && g.d === d) g.t.push(t);
        else days.push({ d, t: [t] });
      }
      return days.reverse().map(({ d, t }) => `<li><span class="d">${dayLabel(d)}</span>${t.map((x) => esc(x)).join('<br>')}</li>`).join('');
    };
    // karta ukáže poslední 3 zápisy; „Show more“ odkryje dalších (už načtených) a nakonec starší (stáhnou se až teď)
    const FIRST = 3;
    const wireOlder = () => {
      if (!rec.older) return;
      $('card-older').onclick = async (e) => {
        e.target.disabled = true;
        const old = await loadOlder(s.handle);
        if ($('card-name').dataset.handle !== s.handle) return; // mezitím jiná karta
        e.target.closest('li').outerHTML = li(old);
      };
    };
    const hidden = Math.max(0, rec.record.length - FIRST);
    if (hidden || rec.older) {
      $('card-record').innerHTML = li(rec.record.slice(-FIRST)) + `<li class="older"><button type="button" id="card-more">Show ${hidden + (rec.older || 0)} more entries</button></li>`;
      $('card-more').onclick = () => {
        if ($('card-name').dataset.handle !== s.handle) return;
        $('card-record').innerHTML = li(rec.record) + (rec.older ? `<li class="older"><button type="button" id="card-older">Show ${rec.older} older entries</button></li>` : '');
        wireOlder();
      };
    } else {
      $('card-record').innerHTML = li(rec.record);
    }
  }

  // Řádek účtu pod kartou + co smí přihlášený dělat. Převelení jen když s jistotou víme, že voják je můj.
  async function renderAccount(s) {
    const a = await myAccount();
    if ($('card-name').dataset.handle !== s.handle) return; // mezitím otevřená jiná karta
    const h = a?.handle;
    if (h) house.setMe(h); // přihlášený hráč: jeho rod (pamětní listina „My house“, žebříčky „You“)
    $('card-transfer').hidden = !(s.claimed && s.archetype?.id !== 'officer' && h && h === s.handle);
    // dopis domů: jen majitel, jednou za den (denně znovu; kdo ho neodešle, buff nemá)
    const L = $('card-letter'), mine = !!(h && h === s.handle && s.status !== 'fallen');
    L.hidden = !mine;
    if (mine) {
      let sent = false;
      try { sent = localStorage.getItem(`letter:${s.handle}`) === String(roster.day); } catch { /* bez úložiště */ }
      L.disabled = sent;
      L.textContent = sent ? '✉ Letter sent. 15% safer tonight' : '✉ Send a letter home (15% safer tonight)';
      L.onclick = async () => {
        L.disabled = true;
        const owner = await signInAsOwner(s, toast).catch(() => null);
        if (!owner) { L.disabled = false; return; }
        const ok = await sendLetter(owner, roster.day).catch(() => false);
        if (!ok) { toast('The letter could not be sent. Try again.'); L.disabled = false; return; }
        try { localStorage.setItem(`letter:${s.handle}`, String(roster.day)); } catch { /* bez úložiště */ }
        L.textContent = '✉ Letter sent. 15% safer tonight';
        toast('Letter sent. Your soldier is 15% less likely to be hurt tonight.');
      };
    }
    // kdo už vojáka má (nebo na něj čeká), nemá u cizích karet nabízené převzetí
    $('card-claim').hidden = s.claimed || !!h || !!(a?.pending && a.pending !== s.handle);
    const box = $('card-account');
    if (!a) {
      // nepřihlášen: u převzatého vojáka nabídnout přihlášení majiteli
      box.hidden = !s.claimed;
      if (!s.claimed) return;
      box.innerHTML = 'Your soldier? <a href="#" id="card-signin">Sign in</a> to manage it.';
      $('card-signin').onclick = async (e) => {
        e.preventDefault();
        if (await signInHere(s, toast).catch(() => false)) renderAccount(s);
      };
      return;
    }
    const who = h ? `your soldier: <a href="?s=${encodeURIComponent(h)}">@${esc(h)}</a>`
      : a.pending ? `claim of <a href="?s=${encodeURIComponent(a.pending)}">@${esc(a.pending)}</a> waiting for your Instagram comment`
      : 'no soldier claimed yet';
    box.innerHTML = `Signed in as ${esc(a.email)} · ${who} · <a href="#" id="card-signout">Sign out</a>`;
    box.hidden = false;
    $('card-signout').onclick = async (e) => {
      e.preventDefault();
      await signOutHere().catch(() => {});
      toast('Signed out');
      renderAccount(s);
    };
  }

  // výběr nového povolání (zápis do Firestore, smyčka ho provede do pár minut)
  async function openTransfer(s, rec) {
    const box = $('card-transfer-box');
    if (!box.hidden) { box.hidden = true; return; }
    // výběr ukázat jen majiteli vojáka (přihlášení + kontrola převzetí)
    const owner = await signInAsOwner(s, toast).catch(() => null);
    if (!owner || $('card-name').dataset.handle !== s.handle) return; // mezitím otevřená jiná karta
    const wait = rec.nextTransfer != null && rec.nextTransfer > roster.day ? rec.nextTransfer - roster.day : 0;
    const days = (n) => `${n} day${n > 1 ? 's' : ''}`;
    box.innerHTML = '<h3>Request a transfer</h3>' +
      (wait ? `<p class="muted">Your last transfer was recent. You can ask now; it goes through in ${days(wait)}.</p>`
            : `<p class="muted">Choose where ${esc(s.name)} serves. One transfer per 7 days. The new role changes your soldier on the map and the stories you get.</p>`) +
      theme.archetypes.filter((a) => a.id !== 'officer').map((a) =>
        `<button class="role${a.id === s.archetype?.id ? ' on' : ''}" data-role="${a.id}"><b>${esc(a.name)}</b><span>${esc(a.desc || '')}</span></button>`).join('');
    box.hidden = false;
    box.onclick = async (ev) => {
      const b = ev.target.closest('button[data-role]');
      if (!b || b.classList.contains('on')) return;
      box.querySelectorAll('button').forEach((x) => (x.disabled = true));
      const ok = await sendTransfer(owner, b.dataset.role).catch(() => {
        toast('Orders could not be sent. Try again.');
        return false;
      });
      box.querySelectorAll('button').forEach((x) => (x.disabled = false));
      if (ok) {
        const role = esc(b.querySelector('b').textContent);
        box.innerHTML = `<p><b>Orders sent.</b> If this is your soldier, the transfer to ${role} comes through ${wait ? `in ${days(wait)}` : 'within minutes'}.</p>`;
        toast('Transfer requested');
      }
    };
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function drawPortrait(s) {
    const c = $('card-portrait').getContext('2d');
    c.clearRect(0, 0, 32, 32);
    const t = (s.tex ?? tex[theme.factions[s.faction].sprite]).south;
    const src = t.source.resource;
    if (src) c.drawImage(src, 0, 0);
  }

  async function loadOlder(handle) {
    const k = shardOf(handle, roster.shards);
    if (!oldCache.has(k)) oldCache.set(k, fetch(`/data/records-old/${k}.json`).then((r) => r.json()).catch(() => ({})));
    return (await oldCache.get(k))[handle] || [];
  }

  async function loadRecord(handle) {
    const k = shardOf(handle, roster.shards);
    if (!shardCache.has(k)) shardCache.set(k, fetch(`/data/records/${k}.json`).then((r) => r.json()));
    try {
      const hit = (await shardCache.get(k))[handle];
      if (hit) return hit;
      // dávka ze starší verze dat (po nasazení do minuty): načíst znovu bez mezipaměti
      const fresh = await fetch(`/data/records/${k}.json`, { cache: 'no-cache' }).then((r) => r.json());
      shardCache.set(k, Promise.resolve(fresh));
      return fresh[handle] ?? null;
    } catch {
      return null;
    }
  }

  async function share(s) {
    const url = `${location.origin}/?s=${encodeURIComponent(s.handle)}`;
    const text = `I enlisted in ${theme.title}. ${theme.ranks[s.rank]} ${s.name}, holding the line. Find me: ${url}`;
    const rec = await loadRecord(s.handle).catch(() => null);
    try {
      // obrázek pro Instagram story (1080×1920); na mobilu systémová nabídka sdílení, jinak stažení
      const blob = await shareCard({ s, rec, theme, tex: s.tex ?? tex[theme.factions[s.faction].sprite] });
      const file = new File([blob], `mud-and-iron-${s.handle}.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: theme.title, text });
        return;
      }
      // prohlížeč uvnitř Instagramu/Facebooku neumí sdílet soubory → obrázek přes celou obrazovku s návodem
      if (/Instagram|FBAN|FBAV|FB_IAB/i.test(navigator.userAgent) || /iPhone|iPad|Android/i.test(navigator.userAgent)) {
        showShareOverlay(URL.createObjectURL(blob), url);
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      copy(url, 'Story image saved. Link copied too.');
    } catch (e) {
      if (e?.name === 'AbortError') return;
      if (navigator.share) navigator.share({ title: theme.title, text, url }).catch(() => {});
      else copy(url, 'Link copied');
    }
  }

  function show(id) {
    for (const el of document.querySelectorAll('.sheet')) el.hidden = el.id !== id;
    document.body.classList.add('card-open');
  }
  function closeAll() {
    for (const el of document.querySelectorAll('.sheet')) el.hidden = true;
    document.body.classList.remove('card-open');
  }
  function copy(text, msg) {
    navigator.clipboard?.writeText(text).then(() => toast(msg), () => toast(text));
  }
  let tt;
  function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(tt);
    tt = setTimeout(() => (el.hidden = true), 2600);
  }

  // rod, oznámení o smrti, pamětní listina, žebříčky (web/src/house.js)
  const house = initHouse({ theme, roster, soldiers, show, loadRecord, loadOlder, toast, openSoldier, esc });
  $('boards-btn').onclick = () => house.openBoards();
  {
    const q = new URLSearchParams(location.search);
    const h = q.get('s')?.toLowerCase().replace(/^@/, '');
    if (h && (q.has('fell') || q.has('house'))) house.setMe(h); // odkaz od bota / sdílený rod: tohle je „můj“ rod
    // až po načtení mapy (jinak by je překryl nápis „Digging trenches…“)
    const ready = (fn, t = 0) => (!$('loading')?.classList.contains('done') && t < 120 ? setTimeout(() => ready(fn, t + 1), 250) : setTimeout(fn, 400));
    if (h && q.has('house')) ready(() => house.openHouse(h));
    else if (h) ready(() => house.checkDeath(h, q.has('fell')));
  }

  return { openSoldier, closeAll, toast, house };
}

function showShareOverlay(src, url) {
  document.getElementById('share-overlay')?.remove();
  const o = document.createElement('div');
  o.id = 'share-overlay';
  o.innerHTML = `<button class="close" aria-label="Close">×</button>
    <img src="${src}" alt="Your Mud & Iron soldier card">
    <p><b>Press and hold the image → Save to Photos</b>, then post it to your Instagram Story and tag @mudandiron.</p>
    <p class="muted">Tip: open this page in Safari or Chrome (••• → Open in browser) to share it to your Story in one tap.</p>`;
  o.querySelector('.close').onclick = () => { o.remove(); URL.revokeObjectURL(src); };
  document.body.appendChild(o);
  navigator.clipboard?.writeText(url).catch(() => {});
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
