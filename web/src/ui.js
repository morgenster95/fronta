// DOM vrstva: počty, hledání @handle, karta vojáka se služebním záznamem, panel „Enlist“, sdílení.
import { shardOf } from '../../engine/roster.js';
import { startClaim } from './claim.js';

const $ = (id) => document.getElementById(id);
const STATUS = ['On the line', 'Wounded', 'Missing in action', 'Prisoner of war', 'Fallen'];
const ORD = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
const shardCache = new Map();

export function initUI({ theme, roster, soldiers, tex, onSelect, onZoom }) {
  const [A, B] = theme.factions;
  $('title').textContent = theme.title;
  document.title = theme.title;
  $('day').textContent = `Day ${roster.day}`;
  const n = [0, 1].map((f) => soldiers.filter((s) => s.faction === f).length);
  $('total').textContent = `${soldiers.length.toLocaleString('en')} enlisted`;
  $('split-a').style.flex = n[0] || 1;
  $('split-b').style.flex = n[1] || 1;
  $('split-a').style.background = A.color;
  $('split-b').style.background = B.color;
  $('lab-a').textContent = `${A.name.replace('The ', '')} ${n[0].toLocaleString('en')}`;
  $('lab-b').textContent = `${B.name.replace('The ', '')} ${n[1].toLocaleString('en')}`;

  // denní zpráva a hlasování
  if (roster.dispatch || roster.vote) {
    $('dispatch').hidden = false;
    if (roster.dispatch) {
      $('dispatch-text').innerHTML = `<span class="d">Dispatch · Day ${roster.dispatch.day}</span>${esc(roster.dispatch.text)}`;
    }
    if (roster.vote) {
      const v = roster.vote;
      $('vote').hidden = false;
      $('vote').innerHTML = `<span class="d">The front decides</span>${esc(v.question)}<br>` +
        v.options.map((o) => `<span class="kw" title="${esc(o.label)}">${esc(o.kw)}</span>`).join('') +
        `<span class="muted"> comment under today's reel · ${v.votes} votes</span>`;
    }
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
  $('enlist-btn').onclick = () => show('enlist');
  document.querySelectorAll('[data-close]').forEach((b) => (b.onclick = () => closeAll()));

  // hledání
  const index = soldiers.map((s) => s.handle);
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
    $('card-claim').hidden = s.claimed;
    $('card-claim').onclick = () => startClaim(s, theme, toast);
    show('card');
    const rec = await loadRecord(s.handle);
    if (!rec) return;
    $('card-unit').textContent = rec.unit;
    $('card-sector').textContent = `${rec.sector} · ${theme.lines[rec.line] ?? rec.line}`;
    $('card-enlisted').textContent = `Day ${rec.enlisted}`;
    const fam = [];
    if (s.generation > 1) fam.push(`<b>${ORD[s.generation] || s.generation + 'th'}</b> of the House of ${esc(rec.family)} at the front.`);
    for (const p of rec.fallen || []) fam.push(`✝ ${esc(p.name)}, fell on Day ${p.day}`);
    $('card-family').innerHTML = fam.join('<br>');
    $('card-record').innerHTML = rec.record
      .slice()
      .reverse()
      .map(([d, t]) => `<li><span class="d">Day ${d}</span>${esc(t)}</li>`)
      .join('');
  }

  function drawPortrait(s) {
    const c = $('card-portrait').getContext('2d');
    c.clearRect(0, 0, 32, 32);
    const t = (s.tex ?? tex[theme.factions[s.faction].sprite]).south;
    const src = t.source.resource;
    if (src) c.drawImage(src, 0, 0);
  }

  async function loadRecord(handle) {
    const k = shardOf(handle);
    if (!shardCache.has(k)) shardCache.set(k, fetch(`/data/records/${k}.json`).then((r) => r.json()));
    try {
      return (await shardCache.get(k))[handle];
    } catch {
      return null;
    }
  }

  function share(s) {
    const url = `${location.origin}/?s=${encodeURIComponent(s.handle)}`;
    const text = `${theme.ranks[s.rank]} ${s.name} is holding the line at ${theme.title}.`;
    if (navigator.share) navigator.share({ title: theme.title, text, url }).catch(() => {});
    else copy(url, 'Link copied');
  }

  function show(id) {
    for (const el of document.querySelectorAll('.sheet')) el.hidden = el.id !== id;
  }
  function closeAll() {
    for (const el of document.querySelectorAll('.sheet')) el.hidden = true;
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

  return { openSoldier, closeAll, toast };
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
