// Rod hráče (záložka „House of …“), oznámení o smrti, pamětní listina a žebříčky. Návrh: docs/mockups/family/.
// Data: karta vojáka ze shardu (records/N.json: fallen = záznamy generací, generation, recFrom, medals, houseBadges…),
// /data/honour.json a /data/boards.json se načtou až po otevření záložky.
import { shareMemorial } from './share.js';

const $ = (id) => document.getElementById(id);
const ORD = (n) => `${n}${['th', 'st', 'nd', 'rd'][((n % 100) - 20) % 10] || ['th', 'st', 'nd', 'rd'][n % 100] || 'th'}`;
// relation = kým byl padlý předchůdce pro nástupce („his uncle X never came home“) → nástupce je pro předchůdce:
const INV = { brother: 'brother', 'older brother': 'younger brother', father: 'son', uncle: 'nephew', cousin: 'cousin' };
const ME = 'mi:me';
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};

export function initHouse({ theme, roster, soldiers, show, loadRecord, loadOlder, toast, openSoldier, esc }) {
  const fac = (f) => theme.factions[f];
  const role = (id) => theme.archetypes.find((a) => a.id === id)?.name ?? (id || 'Soldier');
  const sprite = (f, arch) => `/assets/soldiers/${fac(f).sprite}${arch && arch !== 'rifleman' ? `_${arch}` : ''}_south.png`;
  const badgeDef = (id) => theme.house?.badges?.find((b) => b.id === id);
  const medalName = (m) => {
    if (m === 'first-wave') return ['🎖', 'First Wave', 'One of the first 100 to enlist'];
    if (m === 'raiders-cross') return ['✠', "Raider's Cross", 'Three night raids'];
    if (m.startsWith('obj:')) {
      const v = (roster.victories || []).find((x) => x.id === m.slice(4));
      return ['🎖', v?.name ?? 'Battle honour', 'Fought on the winning side'];
    }
    return ['🎖', m, ''];
  };
  const causeText = (c) => {
    if (!c) return 'Fell at the front.';
    const where = c.shell ? `Hit in the barrage on ${c.sector}. ` : '';
    return where + ({
      nobed: 'Died on a stretcher outside the aid post. Every bed was taken.',
      wounds: 'Died of wounds in the hospital dugout.',
      raid: `Fell on a night raid${c.place ? ` at ${c.place}` : ''}.`,
      shell: 'Killed outright by a shell.',
      shot: `Shot dead by the enemy${c.by ? ` (@${c.by})` : ''}.`,
      line: 'Fell at the front.',
    }[c.kind] || 'Fell at the front.');
  };
  const causeShort = (c) => (c?.shell ? 'barrage, ' : '') + ({ nobed: 'no bed', wounds: 'of wounds', raid: 'night raid', line: 'at the front', shell: 'direct hit', shot: 'shot dead' }[c?.kind || 'line'] || 'at the front');
  const dayL = (d) => (d > 0 ? `Day ${d}` : 'Mobilization');

  async function family(handle) {
    const rec = await loadRecord(handle);
    if (!rec) return null;
    const s = soldiers.find((x) => x.handle === handle);
    const cur = {
      alive: s?.status !== 4, st: s?.status ?? 0, name: rec.name, first: rec.name.split(' ')[0], archetype: rec.archetype, rank: s?.rank ?? 0,
      enlisted: rec.enlisted, gen: rec.generation || 1, days: rec.days ?? Math.max(0, roster.day - rec.enlisted), medals: rec.medals || [],
      titles: rec.titles || [], scars: rec.scars || 0, wounds: rec.wounds || 0, treated: rec.treated || 0, raids: rec.raids || 0,
      relation: rec.relation, rec: [rec.recFrom || 0, (rec.older || 0) + rec.record.length],
    };
    const fallen = (rec.fallen || []).map((p, i) => ({
      ...p, alive: false, first: p.first || p.name.split(' ')[0], gen: p.gen || i + 1, days: p.days ?? null, medals: p.medals || [], titles: p.titles || [],
    }));
    const gens = [...fallen, cur];
    gens.forEach((g, i) => { g.prev = gens[i - 1] || null; });
    return { rec, s, faction: s?.faction ?? 0, gens, handle };
  }

  // celý deník rodu (starší zápisy jsou v records-old)
  async function fullRecord(F) {
    const older = F.rec.older ? await loadOlder(F.handle) : [];
    return [...older, ...F.rec.record];
  }

  // ---------- záložka rodu ----------
  async function openHouse(handle) {
    show('house');
    $('house-body').innerHTML = '<p class="muted">Fetching the family papers…</p>';
    const F = await family(handle);
    if (!F) { $('house-body').innerHTML = '<p class="muted">No papers for this house.</p>'; return; }
    const { rec, gens, faction: f } = F;
    const total = gens.reduce((a, g) => a + (g.days || 0), 0);
    const honours = gens.reduce((a, g) => a + g.medals.length + g.titles.length, 0) + (rec.houseBadges || []).length;
    const crest = f === 0
      ? '<path d="M14 9h4v5h5v4h-5v8h-4v-8H9v-4h5z" fill="#0e0d0c"/><path d="M15 10h2v5h5v2h-5v8h-2v-8h-5v-2h5z" fill="#c4b8a0"/>'
      : '<circle cx="16" cy="17" r="7" fill="none" stroke="#0e0d0c" stroke-width="3"/><circle cx="16" cy="17" r="7" fill="none" stroke="#c9c26a" stroke-width="1.5"/><rect x="15" y="16" width="2" height="2" fill="#c9c26a"/>';
    const tree = gens.map((g, i) => `${i ? `<div class="hs-link"><span>${esc(INV[g.relation] || 'kin')}</span></div>` : ''}
      <div class="hs-node ${g.alive ? 'alive' : ''}">
        <div class="frame"><img class="spr ${g.alive ? '' : 'dead'}" src="${sprite(f, g.archetype)}" alt="">${g.alive ? '' : '<span class="cross">✝</span>'}</div>
        <div class="gen">${ORD(g.gen).toUpperCase()} GENERATION</div>
        <div class="nm">${esc(g.first)}</div>
        <div class="yrs">${g.alive ? `${dayL(g.enlisted)} → now` : `Day ${g.enlisted}–${g.day}`}</div>
      </div>`).join('');
    // rodinné album: medaile a tituly všech generací + odznaky rodu (získané i ty, které ještě čekají)
    const got = new Map((rec.houseBadges || []).map((b) => [b.id, b]));
    const album = [
      ...gens.flatMap((g) => [
        ...g.medals.map((m) => { const [i, n, d] = medalName(m); return { icon: i, name: n, desc: d, who: g.first }; }),
        ...g.titles.map((t) => ({ icon: '★', name: t, desc: 'Title', who: g.first })),
      ]),
    ];
    const badges = (theme.house?.badges || []).map((b) => ({ ...b, got: got.get(b.id) }));
    const cards = gens.slice().reverse().map((g, i) => `
      <div class="gen-card ${g.alive ? 'alive' : ''}" data-gen="${g.gen}">
        <div class="gc-head">
          <div class="pf"><img class="spr ${g.alive ? '' : 'dead'}" src="${sprite(f, g.archetype)}" alt=""></div>
          <div class="gc-title">
            <div class="rk">${esc(theme.ranks[g.rank] ?? '')} · ${esc(role(g.archetype))}</div>
            <div class="nm">${esc(g.name)}</div>
            <div class="muted sub">${ORD(g.gen)} of the House · ${g.prev ? `${esc(g.prev.first)}'s ${esc(INV[g.relation] || 'kin')}` : 'founder'}</div>
          </div>
          <span class="status ${g.alive ? 'alive' : 'fell'}">${g.alive ? (['ON THE LINE', 'WOUNDED', 'MISSING IN ACTION', 'PRISONER OF WAR'][g.st] ?? 'ON THE LINE') : `✝ DAY ${g.day}`}</span>
        </div>
        <div class="gc-body">
          ${g.alive ? '' : `<div class="cause"><span class="sil">CAUSE OF DEATH</span>${esc(causeText(g.cause))}</div>`}
          <div class="mini">
            <div><b>${g.days ?? '?'}</b>days</div><div><b>${g.wounds ?? 0}</b>wounds</div><div><b>${g.scars ?? 0}</b>scars</div>
            <div><b>${g.treated ?? 0}</b>patients</div><div><b>${g.raids ?? 0}</b>raids</div>
          </div>
          ${g.medals.length + g.titles.length ? `<div>${[...g.medals.map((m) => medalName(m).slice(0, 2).join(' ')), ...g.titles.map((t) => `★ ${t}`)].map((m) => `<span class="chip on medal">${esc(m)}</span>`).join('')}</div>` : '<div class="muted sub">No decorations.</div>'}
          ${g.last && !g.alive ? `<div class="quote">${esc(g.last)}</div>` : ''}
          <button type="button" class="diary-toggle" data-from="${g.rec?.[0] ?? 0}" data-to="${g.rec?.[1] ?? 0}">▸ SERVICE RECORD · ${Math.max(0, (g.rec?.[1] ?? 0) - (g.rec?.[0] ?? 0))} ENTRIES</button>
          <ol class="diary" hidden></ol>
          ${g.alive ? '' : `<button type="button" class="memorial">Share his memory</button>`}
        </div>
      </div>`).join('');
    $('house-body').innerHTML = `
      <div class="house-head">
        <div class="crest"><svg viewBox="0 0 32 38" shape-rendering="crispEdges"><path d="M2 2h28v20l-14 14L2 22z" fill="${f === 0 ? '#4a4f52' : '#545639'}" stroke="#0e0d0c" stroke-width="2"/><path d="M4 4h24v17L16 33 4 21z" fill="none" stroke="${fac(f).color}"/>${crest}</svg></div>
        <div>
          <div class="sil muted kicker">${esc(fac(f).name.toUpperCase())}</div>
          <h2 class="house-name">House of ${esc(rec.family)}</h2>
          <div class="muted">@${esc(F.handle)}</div>
        </div>
      </div>
      <div class="hs-stats">
        <div><b>${gens.length}</b><span>generations</span></div>
        <div><b>${total}</b><span>days at the front</span></div>
        <div><b>${gens.length - 1}</b><span>fallen</span></div>
        <div><b>${honours}</b><span>honours</span></div>
      </div>
      <h3>Family tree</h3>
      <div class="hs-tree" id="hs-tree">${tree}</div>
      <h3>The generations</h3>
      ${cards}
      <h3>Family album</h3>
      <div class="album">
        ${badges.map((b) => `<div class="al ${b.got ? 'got' : 'locked'}" title="${esc(b.desc)}"><span class="ic">${b.got ? esc(b.icon) : '?'}</span><b>${esc(b.name)}</b><small>${b.got ? `Day ${b.got.day}` : esc(b.desc)}</small></div>`).join('')}
        ${album.map((m) => `<div class="al got medal"><span class="ic">${esc(m.icon)}</span><b>${esc(m.name)}</b><small>${esc(m.who)}</small></div>`).join('')}
      </div>
      <div class="actions">
        <button type="button" class="primary" id="hs-share">Share the House</button>
        <button type="button" id="hs-honour">Roll of Honour</button>
        <button type="button" id="hs-boards">Leaderboards</button>
      </div>`;
    $('hs-tree').scrollLeft = 9999; // na telefonu je vidět současná generace
    $('hs-share').onclick = () => shareLink(`${location.origin}/?s=${encodeURIComponent(F.handle)}&house=1`, `The House of ${rec.family} at the front in ${theme.title}.`);
    $('hs-honour').onclick = () => openHonour();
    $('hs-boards').onclick = () => openBoards();
    let full = null;
    for (const btn of document.querySelectorAll('#house-body .diary-toggle')) {
      btn.onclick = async () => {
        const ol = btn.nextElementSibling;
        if (!ol.hidden) { ol.hidden = true; btn.textContent = btn.textContent.replace('▾', '▸'); return; }
        full ??= await fullRecord(F);
        const part = full.slice(Number(btn.dataset.from), Number(btn.dataset.to));
        ol.innerHTML = part.slice().reverse().map(([d, t]) => `<li><span class="d">${dayL(d)}</span>${esc(t)}</li>`).join('') || '<li class="muted">No entries.</li>';
        ol.hidden = false;
        btn.textContent = btn.textContent.replace('▸', '▾');
      };
    }
    for (const btn of document.querySelectorAll('#house-body .memorial')) {
      const g = gens.find((x) => String(x.gen) === btn.closest('.gen-card').dataset.gen);
      btn.onclick = () => memorial(F, g);
    }
  }

  async function memorial(F, g) {
    const next = F.gens[F.gens.indexOf(g) + 1];
    try {
      const blob = await shareMemorial({
        life: g, family: F.rec.family, faction: F.faction, theme, spriteUrl: sprite(F.faction, g.archetype), cause: causeText(g.cause),
        heir: next ? { name: next.name, kin: INV[next.relation] || 'kin' } : null,
      });
      const file = new File([blob], `in-memory-${F.handle}-${g.gen}.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) return void (await navigator.share({ files: [file], title: theme.title }));
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast('Story card saved.');
    } catch (e) {
      if (e?.name !== 'AbortError') toast('Could not make the card.');
    }
  }

  function shareLink(url, text) {
    if (navigator.share) navigator.share({ title: theme.title, text, url }).catch(() => {});
    else navigator.clipboard?.writeText(url).then(() => toast('Link copied'), () => toast(url));
  }

  // ---------- oznámení o smrti (po návratu do hry) ----------
  async function checkDeath(handle, force = false) {
    if (!handle) return;
    const F = await family(handle);
    if (!F || F.gens.length < 2) return;
    const p = F.gens.at(-2), cur = F.gens.at(-1);
    const seen = Number(store.get(`mi:seen:${handle}`) || 0);
    if (!force && (seen >= cur.gen || p.day < roster.day - 3)) return;
    const o = document.createElement('div');
    o.id = 'death-overlay';
    o.innerHTML = `<div class="death">
      <div class="ttl">✝ NEWS FROM THE FRONT · DAY ${p.day}</div>
      <div class="pair">
        <div><div class="frame"><img class="spr dead" src="${sprite(F.faction, p.archetype)}" alt=""></div><div class="nm">${esc(p.first)}</div></div>
        <div class="arrow">▸</div>
        <div><div class="frame new"><img class="spr" src="${sprite(F.faction, cur.archetype)}" alt=""></div><div class="nm">${esc(cur.first)}</div></div>
      </div>
      <p><b>${esc(p.name)}</b> fell on Day ${p.day}.</p>
      <p class="muted">${esc(causeText(p.cause))}</p>
      <div class="days">${p.days ?? '?'} ${p.days === 1 ? 'DAY' : 'DAYS'}</div>
      <div class="muted small">at the front</div>
      <p class="heir">His ${esc(INV[cur.relation] || 'kin')} <b>${esc(cur.name)}</b> has taken up the rifle. ${esc(role(cur.archetype))}, Day ${Math.max(1, roster.day - cur.enlisted + 1)} of his war.</p>
      <div class="actions">
        <button type="button" class="primary" id="do-meet">Meet ${esc(cur.first)}</button>
        <button type="button" id="do-house">House of ${esc(F.rec.family)}</button>
      </div>
      <button type="button" class="link" id="do-memorial">Share his memory: Story card ▸</button>
    </div>`;
    document.body.appendChild(o);
    const close = () => { store.set(`mi:seen:${handle}`, String(cur.gen)); o.remove(); };
    o.onclick = (e) => { if (e.target === o) close(); };
    $('do-meet').onclick = () => { close(); const s = soldiers.find((x) => x.handle === handle); if (s) openSoldier(s); };
    $('do-house').onclick = () => { close(); openHouse(handle); };
    $('do-memorial').onclick = () => memorial(F, p);
  }

  // ---------- pamětní listina ----------
  let honourData = null;
  async function openHonour(filter = 'all') {
    show('honour');
    honourData ??= await fetch('/data/honour.json', { cache: 'no-cache' }).then((r) => r.json()).catch(() => ({ fallen: [] }));
    const all = honourData.fallen || [];
    const me = store.get(ME);
    const list = all.filter((r) => filter === 'all' || (filter === 'me' ? r.handle === me : r.faction === Number(filter)));
    const cnt = [0, 1].map((f) => all.filter((r) => r.faction === f).length);
    const by = new Map();
    for (const r of list) by.set(r.day, [...(by.get(r.day) || []), r]);
    $('honour-body').innerHTML = `
      <div class="sides">${[0, 1].map((f) => `<div class="side-box"><b style="color:${fac(f).color}">${cnt[f]}</b><span class="muted">${esc(fac(f).name)} fallen</span></div>`).join('')}</div>
      <div class="chips">${[['all', 'ALL'], ['0', fac(0).name.replace('The ', '').toUpperCase()], ['1', fac(1).name.replace('The ', '').toUpperCase()], ...(me ? [['me', 'MY HOUSE']] : [])]
        .map(([k, l]) => `<button type="button" class="chip ${k === filter ? 'on' : ''}" data-f="${k}">${esc(l)}</button>`).join('')}</div>
      ${list.length ? [...by].map(([d, rows]) => `<div class="day-h">DAY ${d}</div>` + rows.map((r) => `
        <button type="button" class="fallen-row" data-h="${esc(r.handle)}">
          <img class="spr dead" src="${sprite(r.faction, r.archetype)}" alt="">
          <span><span class="nm"><span class="dot" style="background:${fac(r.faction).color}"></span>${esc(r.name)}</span>
            <span class="sub">@${esc(r.handle)} · ${esc(role(r.archetype))} · ${r.days ?? '?'} days · House of ${esc(r.family)}${r.gen > 1 ? ` (${ORD(r.gen)})` : ''}</span></span>
          <span class="cs">${esc(causeShort(r.cause))}</span>
        </button>`).join('')).join('') : '<p class="muted">Nobody has fallen yet. Long may it last.</p>'}`;
    for (const b of document.querySelectorAll('#honour-body .chip')) b.onclick = () => openHonour(b.dataset.f);
    for (const b of document.querySelectorAll('#honour-body .fallen-row')) b.onclick = () => openHouse(b.dataset.h);
  }

  // ---------- žebříčky ----------
  const BOARDS = [
    ['longest', 'LONGEST ALIVE', 'Days at the front without dying. When a soldier falls, his heir starts again from Day 1.', (v) => (v === 1 ? 'Day 1' : `${v} days`)],
    ['houses', 'OLDEST HOUSES', 'Days the whole house has spent at the front, every generation together.', (v) => `${v} days`],
    ['decorated', 'MOST DECORATED', 'Medals and titles of the living.', (v) => `${v} honours`],
    ['houseHonours', 'HOUSE HONOURS', 'Every medal and title the house has ever won.', (v) => `${v} honours`],
    ['survivors', 'SURVIVORS', 'Came back from the most bad wounds.', (v) => `${v} scars`],
    ['medics', 'MEDICS', 'Wounded men treated in the field.', (v) => `${v} patients`],
    ['marksmen', 'MARKSMEN', 'Enemy soldiers hit across the wire.', (v) => `${v} hits`],
    ['experienced', 'EXPERIENCE', 'Experience earned at the front: days survived, hits, wounded treated, wire repaired.', (v) => `${v} XP`],
  ];
  let boardsData = null;
  async function openBoards(tab = 'longest', side = 'all') {
    show('boards');
    boardsData ??= await fetch('/data/boards.json', { cache: 'no-cache' }).then((r) => r.json()).catch(() => ({}));
    const [, , desc, fmt] = BOARDS.find((b) => b[0] === tab);
    const rows = (boardsData[tab] || []).filter((r) => side === 'all' || r.faction === Number(side)).slice(0, 20);
    const me = store.get(ME);
    const meAt = rows.findIndex((r) => r.handle === me);
    const pod = (r, cls, pl) => (r ? `<button type="button" class="pod ${cls}" data-h="${esc(r.handle)}"><img class="spr" src="${sprite(r.faction, soldiers.find((x) => x.handle === r.handle)?.archetype?.id)}" alt="">
      <span class="blk"><span class="pl">${pl}</span><span class="nm">${esc(r.name)}</span><span class="muted h">@${esc(r.handle)}</span><span class="val" style="color:${fac(r.faction).color}">${esc(fmt(r.value))}</span></span></button>` : '<div></div>');
    $('boards-body').innerHTML = `
      <div class="tabs">${BOARDS.map(([k, l]) => `<button type="button" class="tab ${k === tab ? 'on' : ''}" data-t="${k}">${l}</button>`).join('')}</div>
      <p class="board-desc">${esc(desc)}</p>
      <div class="chips">${[['all', 'ALL'], ['0', fac(0).name.replace('The ', '').toUpperCase()], ['1', fac(1).name.replace('The ', '').toUpperCase()]]
        .map(([k, l]) => `<button type="button" class="chip ${k === side ? 'on' : ''}" data-s="${k}">${esc(l)}</button>`).join('')}</div>
      ${rows.length ? `<div class="podium">${pod(rows[1], 'p2', '2')}${pod(rows[0], 'p1', '1')}${pod(rows[2], 'p3', '3')}</div>
      <ol class="rows">${rows.slice(3).map((r, i) => `<li class="${r.handle === me ? 'me' : ''}" data-h="${esc(r.handle)}"><span class="n">${i + 4}</span><span><span class="dot" style="background:${fac(r.faction).color}"></span>${esc(r.name)} <span class="muted h">@${esc(r.handle)}</span></span><span class="v">${esc(fmt(r.value))}</span></li>`).join('')}</ol>` : '<p class="muted">Nobody here yet.</p>'}
      ${me ? `<div class="you"><span><span class="sil">YOU${meAt >= 0 ? ` · #${meAt + 1}` : ''}</span> @${esc(me)}</span><span class="sil">${meAt >= 0 ? esc(fmt(rows[meAt].value)) : 'not in the top 20 yet'}</span></div>` : ''}
      <div class="actions"><button type="button" id="bd-honour">Roll of Honour</button></div>`;
    for (const b of document.querySelectorAll('#boards-body .tab')) b.onclick = () => openBoards(b.dataset.t, side);
    for (const b of document.querySelectorAll('#boards-body .chip')) b.onclick = () => openBoards(tab, b.dataset.s);
    for (const b of document.querySelectorAll('#boards-body [data-h]')) b.onclick = () => { const s = soldiers.find((x) => x.handle === b.dataset.h); if (s) openSoldier(s); };
    $('bd-honour').onclick = () => openHonour();
  }

  const setMe = (handle) => handle && store.set(ME, handle);
  return { openHouse, openHonour, openBoards, checkDeath, setMe };
}
