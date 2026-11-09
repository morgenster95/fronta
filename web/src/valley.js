// Mapa údolí za Verdel Ridge: místa, kdo je drží, kronika míst a otevřená výprava (přihláška tlačítkem Volunteer).
// Zem se kreslí kódem v pixelové mřížce 192×120 (×3), místa jsou obrázky z PixelLabu (theme.valley.locations[].img)
// nebo náhradní pixelové ikony, dokud obrázek není.
import { signInClaimed, sendVolunteer } from './claim.js';

const GW = 192, GH = 120, PX = 6; // mřížka 192×120, plátno ×6 (ostré i na telefonu s retinou)
const W = GW * PX, H = GH * PX;
const $ = (id) => document.getElementById(id);

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

// --- zem ---
function drawGround(g, theme) {
  const r = rng(1918);
  const cell = (x, y, c) => { g.fillStyle = c; g.fillRect(x * PX, y * PX, PX, PX); };
  const MUD = ['#4a3f31', '#463b2e', '#4f4334', '#433829', '#51453a'];
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) cell(x, y, MUD[Math.floor(r() * MUD.length)]);
  // tmavší skvrny a tráva v zemi nikoho
  for (let k = 0; k < 90; k++) {
    const cx = r() * GW, cy = r() * GH, rad = 2 + r() * 6, col = r() < 0.7 ? '#3d3327' : '#4d4a33';
    for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) if (x * x + y * y < rad * rad * (0.6 + r() * 0.4)) cell(Math.round(cx + x), Math.round(cy + y), col);
  }
  // linie frakcí: Hegemonie nahoře, Concord dole (pruh v barvě frakce + cikcak zákop)
  const lines = [[0, 4, theme.factions[0].color], [1, GH - 9, theme.factions[1].color]];
  for (const [f, y0, col] of lines) {
    g.globalAlpha = 0.22;
    g.fillStyle = col;
    g.fillRect(0, (f ? y0 - 3 : 0) * PX, W, 12 * PX);
    g.globalAlpha = 1;
    for (let x = 0; x < GW; x++) {
      const y = y0 + ((Math.floor(x / 6) % 2) ? 2 : 0);
      cell(x, y, '#231d16');
      cell(x, y + 1, '#2b241b');
      if (x % 6 === 0) { cell(x, y0, '#231d16'); cell(x, y0 + 1, '#231d16'); cell(x, y0 + 2, '#231d16'); }
      if (r() < 0.5) cell(x, f ? y - 1 : y + 2, '#6b5e48'); // pytle
    }
    // dráty
    for (let x = 2; x < GW; x += 3) { const y = f ? y0 - 5 : y0 + 6; cell(x, y, '#2e2a26'); cell(x + 1, y + 1, '#2e2a26'); cell(x + 1, y - 1, '#2e2a26'); }
  }
  // kanál
  const canal = [[0, 86], [40, 82], [70, 80], [110, 90], [150, 86], [192, 90]];
  for (let i = 0; i < canal.length - 1; i++) {
    const [x0, y0] = canal[i], [x1, y1] = canal[i + 1];
    for (let x = x0; x <= x1; x++) {
      const y = Math.round(y0 + ((y1 - y0) * (x - x0)) / (x1 - x0));
      cell(x, y - 1, '#3b4a4c'); cell(x, y, '#46585b'); cell(x, y + 1, '#3b4a4c');
      if (r() < 0.15) cell(x, y, '#6c8286');
    }
  }
  // cesta: město → kostel → hřbitov → pozorovatelna, mlýn → kostel
  const road = (pts) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let k = 0; k <= n; k++) if (k % 3 !== 2) cell(Math.round(x0 + ((x1 - x0) * k) / n), Math.round(y0 + ((y1 - y0) * k) / n), '#66573f');
    }
  };
  road([[44, 40], [70, 52], [92, 58], [122, 50], [150, 66]]);
  road([[70, 82], [80, 66], [92, 58]]);
  road([[24, 76], [44, 40]]);
  road([[134, 100], [150, 66], [164, 34]]);
  // krátery
  for (let k = 0; k < 70; k++) {
    const cx = Math.round(10 + r() * (GW - 20)), cy = Math.round(16 + r() * (GH - 34)), rad = 1 + Math.floor(r() * 3);
    for (let y = -rad - 1; y <= rad + 1; y++) for (let x = -rad - 1; x <= rad + 1; x++) {
      const d = x * x + y * y;
      if (d <= rad * rad) cell(cx + x, cy + y, d < (rad - 1) * (rad - 1) && rad > 1 && r() < 0.3 ? '#3e4c4c' : '#2e261d');
      else if (d <= (rad + 1) * (rad + 1) && y < 0) cell(cx + x, cy + y, '#5d503e');
    }
  }
  // mrtvé stromy
  for (let k = 0; k < 14; k++) {
    const x = Math.round(8 + r() * (GW - 16)), y = Math.round(18 + r() * (GH - 40));
    for (let i = 0; i < 4; i++) cell(x, y - i, '#2a221a');
    cell(x - 1, y - 3, '#2a221a'); cell(x + 1, y - 2, '#2a221a');
  }
}

// --- náhradní ikony míst (v buňkách mřížky, kotva = střed dole) ---
const ICONS = {
  cemetery(c) {
    for (const [x, y] of [[-6, -2], [-2, -4], [2, -2], [6, -4], [-4, 1], [4, 1], [0, 0]]) {
      c.rect(x - 2, y, 5, 2, '#3a3026'); // hrob
      c.rect(x, y - 4, 1, 5, '#b9b2a2'); c.rect(x - 1, y - 3, 3, 1, '#b9b2a2'); // kříž
    }
    c.rect(-9, 3, 19, 1, '#5d503e');
  },
  town(c) {
    const walls = [[-9, 7, '#7d7466'], [-5, 10, '#8a8070'], [-1, 5, '#6f675b'], [3, 12, '#857b6b'], [7, 6, '#766d60']];
    for (const [x, h, col] of walls) { c.rect(x, -h, 3, h, col); c.rect(x + 1, -h + 2, 1, 2, '#2a241d'); }
    c.rect(4, -15, 1, 3, '#5a5148'); // komín
    c.rect(-10, 0, 21, 1, '#4b4034');
    for (let i = 0; i < 6; i++) c.rect(-8 + i * 3, -1, 2, 1, '#6f675b'); // suť
  },
  outpost(c) {
    c.rect(-6, -3, 13, 4, '#7e6d4d'); // pytle
    for (let i = 0; i < 6; i++) c.rect(-6 + i * 2, -4, 2, 1, i % 2 ? '#8e7c58' : '#6f5f43');
    c.rect(-3, -2, 7, 2, '#1d1812'); // otvor
    c.rect(0, -9, 1, 6, '#3c3a35'); c.rect(0, -10, 2, 1, '#3c3a35'); // periskop
    c.rect(4, -7, 1, 4, '#5c4a32'); c.rect(3, -8, 3, 1, '#5c4a32'); // tyč telefonu
  },
  mill(c) {
    c.rect(-4, -13, 8, 13, '#8a857a'); c.rect(-3, -15, 6, 2, '#6b4e3a'); // věž a střecha
    c.rect(-1, -4, 2, 4, '#2a241d'); c.rect(-2, -10, 1, 2, '#2a241d');
    for (let i = 0; i < 8; i++) { c.rect(-i, -14 - i, 1, 1, '#5a4430'); c.rect(i, -14 - i, 1, 1, '#5a4430'); } // lopatky (polámané dole)
    for (let i = 0; i < 4; i++) { c.rect(-i, -14 + i, 1, 1, '#5a4430'); }
  },
  brickworks(c) {
    c.rect(-10, -6, 14, 6, '#8a4b36'); c.rect(-10, -7, 14, 1, '#6a3727');
    for (let i = 0; i < 3; i++) c.rect(-8 + i * 4, -4, 2, 2, '#2a1d17');
    c.rect(6, -14, 3, 14, '#7a4231'); c.rect(6, -15, 3, 1, '#4e2b20'); // komín
    c.rect(8, -17, 2, 2, '#6f6a62'); c.rect(10, -18, 2, 1, '#59554f'); // kouř
  },
  hospital(c) {
    c.rect(-9, -7, 18, 7, '#a59a82'); c.rect(-10, -11, 20, 4, '#6d3a2c'); // dům a střecha
    c.rect(-2, -11, 5, 4, '#d9d2c2'); c.rect(0, -11, 1, 4, '#9b2a22'); c.rect(-1, -10, 3, 1, '#9b2a22'); // červený kříž
    c.rect(-6, -4, 2, 4, '#3a2e22'); c.rect(3, -5, 3, 2, '#3a2e22');
    c.rect(11, -3, 4, 3, '#c9c2b0'); c.rect(12, -2, 1, 1, '#9b2a22'); // stan
  },
  quarry(c) {
    for (let y = -6; y <= 1; y++) for (let x = -11; x <= 11; x++) if ((x * x) / 121 + ((y + 2) * (y + 2)) / 18 < 1) c.rect(x, y, 1, 1, y < -3 ? '#c8c1ad' : '#a9a18c');
    c.rect(-5, -2, 3, 3, '#1d1812'); c.rect(3, -1, 3, 2, '#1d1812'); // tunely
    c.rect(-11, 1, 23, 1, '#6c6452');
  },
};

function drawIcon(g, loc) {
  const ax = loc.x, ay = loc.y + 8;
  const ctx = { rect: (x, y, w, h, col) => { g.fillStyle = col; g.fillRect((ax + x) * PX, (ay + y) * PX, w * PX, h * PX); } };
  (ICONS[loc.id] || ICONS.outpost)(ctx);
}

export function initValley({ theme, roster, soldiers, openSoldier, toast, show }) {
  const conf = theme.valley;
  const rv = roster.valley || { holders: {}, open: null };
  // údolí se na webu ukáže až v den, kdy noviny vyhlásí první výpravu (do té doby o něm hráči nevědí)
  if (!conf || (!rv.open && !rv.last)) { $('valley-btn').hidden = true; return { open() {} }; }
  const byHandle = new Map(soldiers.filter((s) => s.handle).map((s) => [s.handle, s]));
  const F = (f) => theme.factions[f].name.replace(/^The /, '');
  const roleName = Object.fromEntries(theme.archetypes.map((a) => [a.id, a.name]));
  let data = null;
  let selected = rv.open?.loc || conf.first || conf.locations[0].id;
  let drawn = false;

  async function draw() {
    if (drawn) return;
    drawn = true;
    const c = $('valley-map');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    drawGround(g, theme);
    for (const loc of conf.locations) {
      if (!loc.img) { drawIcon(g, loc); continue; }
      const img = new Image();
      img.src = `/assets/locations/${loc.img}`;
      await img.decode().catch(() => null);
      if (img.naturalWidth) {
        // obrázek se vejde do čtverce size×size buněk, pata na y+10
        const k = ((loc.size ?? 32) * PX) / Math.max(img.naturalWidth, img.naturalHeight);
        const w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
        g.imageSmoothingEnabled = true;
        g.imageSmoothingQuality = 'high';
        g.drawImage(img, Math.round(loc.x * PX - w / 2), Math.round((loc.y + 10) * PX - h), w, h);
        g.imageSmoothingEnabled = false;
      }
      else drawIcon(g, loc);
    }
  }

  function pins() {
    const box = $('valley-pins');
    box.innerHTML = conf.locations.map((l) => {
      const h = (data?.holders ?? rv.holders)?.[l.id];
      const col = h == null ? 'var(--line)' : theme.factions[h].color;
      const raid = rv.open?.loc === l.id;
      return `<button class="pin${l.id === selected ? ' on' : ''}${raid ? ' raid' : ''}" data-loc="${l.id}" style="left:${(l.x / GW) * 100}%;top:${((l.y + 11) / GH) * 100}%;border-color:${col}">${raid ? '⚑ ' : ''}${esc(cap(l.short))}</button>`;
    }).join('');
    box.onclick = (ev) => {
      const b = ev.target.closest('button[data-loc]');
      if (!b) return;
      selected = b.dataset.loc;
      pins();
      details();
    };
  }

  function banner() {
    const o = rv.open;
    const el = $('valley-call');
    if (o) {
      el.innerHTML = `<span class="d">Volunteers wanted · ${dayLabel(o.day)}</span><b>Night raid on ${esc(o.name)}.</b> ` +
        `Comment <span class="kw">${esc(o.keyword)}</span> under any ${esc(theme.instagram)} post, or press Volunteer if you have claimed your soldier. ` +
        `${o.slots} places per side, first come, first served. Results in the next edition. <span class="muted">${o.count} volunteer${o.count === 1 ? '' : 's'} so far; who they are stays secret until then.</span>`;
    } else {
      el.innerHTML = `<span class="d">No raid tonight</span>When Field HQ needs volunteers again, the morning Gazette will say so.`;
    }
  }

  function details() {
    const l = conf.locations.find((x) => x.id === selected);
    if (!l) return;
    const holders = data?.holders ?? rv.holders ?? {};
    const h = holders[l.id];
    const held = h == null ? (data?.contested?.[l.id] ? 'Contested' : 'Nobody') : `<span style="color:${theme.factions[h].color}">■</span> The ${esc(F(h))}`;
    const o = rv.open?.loc === l.id ? rv.open : null;
    const hist = (data?.history || []).filter((x) => x.loc === l.id);
    const at = (x) => (byHandle.has(x) ? `<a href="?s=${x}" data-h="${x}">@${esc(x)}</a>` : `@${esc(x)}`);
    const FATE = { wounded: '✚', missing: '?', captured: '⛓', fallen: '✝' };
    $('valley-detail').innerHTML =
      `<h3>${esc(l.name)}</h3><p>${esc(l.desc)}</p>` +
      `<dl class="facts"><dt>Held by</dt><dd>${held}</dd><dt>Gives</dt><dd>${esc(l.perkText)}</dd><dt>Keyword</dt><dd><span class="kw">${esc(l.keyword)}</span></dd></dl>` +
      (o ? `<div class="valley-raid"><b>Tonight's raid goes here.</b> ${o.count} volunteer${o.count === 1 ? '' : 's'} so far.<div class="actions"><button id="valley-volunteer" class="primary">Volunteer</button><button id="valley-copy">Copy ${esc(o.keyword)}</button></div></div>` : '') +
      `<h3>Chronicle of the place</h3>` +
      (hist.length
        ? `<ol class="history">${hist.map((x) => `<li><span class="d">${dayLabel(x.day)}</span><b>${esc(x.headline)}</b>` +
            x.squads.map((sq, f) => (sq.length ? `<br><span class="muted">${esc(F(f))}:</span> ${sq.map((m) => `${at(m)}${FATE[x.fates?.[m]] ? ` <span class="fate" title="${esc(x.fates[m])}">${FATE[x.fates[m]]}</span>` : ''}${x.mvp === m ? ' ★' : ''}`).join(', ')}` : '')).join('') +
            '</li>').join('')}</ol>`
        : '<p class="muted">Nobody has gone out here yet. The first names in this chronicle could be yours.</p>');
    const vb = $('valley-volunteer');
    if (vb) vb.onclick = () => volunteerFlow(o, l);
    const cb = $('valley-copy');
    if (cb) cb.onclick = () => navigator.clipboard?.writeText(o.keyword).then(() => toast(`${o.keyword} copied. Comment it under any ${theme.instagram} post.`), () => toast(o.keyword));
  }

  async function volunteerFlow(o, l) {
    const owner = await signInClaimed(toast).catch(() => null);
    if (!owner) return;
    const s = byHandle.get(owner.handle);
    if (!s) return toast('Your soldier is not on the roster yet. Try again in a few minutes.');
    if (s.status !== 0) return toast(`${s.name} is not on the line right now and cannot go on a raid.`);
    const ok = await sendVolunteer(owner, o.id).catch(() => false);
    if (!ok) return toast(`Orders could not be sent. Comment ${o.keyword} on Instagram instead.`);
    toast(`Orders received. @${s.handle} goes to ${l.short} if there is still a place.`);
    $('valley-volunteer').outerHTML = `<p><b>You volunteered.</b> If one of the ${o.slots} places for the ${esc(F(s.faction))} is still free, ${esc(s.name)} goes out tonight. The list is confirmed in a few minutes; the result is in the next edition.</p>`;
  }

  function rules() {
    $('valley-rules').innerHTML = `<summary>How raids work</summary>` +
      `<p>Every few days the Gazette calls for volunteers. Up to ${conf.slots} soldiers per side who are on the line can sign up. The next edition prints what happened, with names. ` +
      `Whoever wins takes the place and what it gives. If only one side turns up, it fights the place itself and almost always takes it. ` +
      `Losers can be wounded, go missing or be taken prisoner. Prisoners come home in an exchange a few days later. Death on a raid is rare, and claimed soldiers never die. Three raids earn the Raider's Cross.</p>` +
      `<ul class="roles">${Object.entries(conf.roles).map(([id, r]) => `<li><b>${esc(roleName[id] || id)}</b> <span class="muted">${r.hp} health · ${r.atk} attack · ${r.def} defence</span>${r.ability ? `<br>${esc(conf.abilities[r.ability] || '')}` : ''}</li>`).join('')}</ul>`;
  }

  async function open() {
    show('valley');
    banner();
    rules();
    pins();
    details();
    await draw();
    data ??= await fetch('/data/valley.json', { cache: 'no-cache' }).then((r) => r.json()).catch(() => ({ holders: rv.holders, history: [] }));
    pins();
    details();
  }

  $('valley-btn').onclick = open;
  $('valley-detail').onclick = (ev) => {
    const a = ev.target.closest('a[data-h]');
    if (!a) return;
    ev.preventDefault();
    const s = byHandle.get(a.dataset.h);
    if (s) openSoldier(s);
  };
  if (new URLSearchParams(location.search).has('valley')) setTimeout(open, 600);
  return { open };
}

const dayLabel = (d) => (d > 0 ? `Day ${d}` : 'Mobilization');
const cap = (t) => t[0].toUpperCase() + t.slice(1);
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
