import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { generateFront } from './mapgen.js';
import { emptyState, applyComment, parseComment, dailyTick, parseRole, roleReply } from './roster.js';

const theme = JSON.parse(fs.readFileSync(new URL('../themes/front-ww1/theme.json', import.meta.url)));
const story = JSON.parse(fs.readFileSync(new URL('../themes/front-ww1/story.json', import.meta.url)));
const map = generateFront(theme.map);

test('mapa je deterministická a má místa pro obě frakce', () => {
  const again = generateFront(theme.map);
  assert.equal(Buffer.compare(Buffer.from(map.grid), Buffer.from(again.grid)), 0);
  assert.ok(map.slots[0].length > 1500 && map.slots[1].length > 1500);
});

test('komentář s klíčovým slovem narukuje, podruhé ne', () => {
  const s = emptyState(theme);
  const r = applyComment(s, { id: 'c1', userId: 'u1', username: 'Jan.Novak', text: 'concord!!' }, theme, story, map);
  assert.equal(r.type, 'enlist');
  assert.equal(r.soldier.faction, 1);
  assert.equal(r.soldier.family, 'Novak');
  assert.ok(r.soldier.record[0][1].length > 20);
  assert.equal(applyComment(s, { id: 'c2', userId: 'u1', username: 'jan.novak', text: 'HEGEMONY' }, theme, story, map), null);
  assert.equal(applyComment(s, { id: 'c1', userId: 'u1', username: 'jan.novak', text: 'concord' }, theme, story, map), null);
});

test('kód pro převzetí se rozpozná', () => {
  assert.deepEqual(parseComment('here: enlist-7kq2 :)', theme), { type: 'claim', code: 'ENLIST-7KQ2' });
  assert.equal(parseComment('nice reel', theme), null);
});

test('převzetí patří IG účtu, ne jménu (uvolněné @jméno nic nepřebírá)', () => {
  const s = emptyState(theme);
  applyComment(s, { id: 'c1', userId: 'u1', username: 'bob', text: 'CONCORD' }, theme, story, map);
  // Bob se přejmenoval na bob2, jméno „bob“ si vzal jiný účet u2
  assert.equal(applyComment(s, { id: 'c2', userId: 'u2', username: 'bob', text: 'ENLIST-AB12' }, theme, story, map), null);
  assert.equal(applyComment(s, { id: 'c3', userId: 'u2', username: 'bob', text: 'HEGEMONY' }, theme, story, map), null);
  assert.equal(s.soldiers.length, 1);
  // Bob pod novým jménem převzetí dokončí (kód na webu je vystavený na původní jméno vojáka)
  const r = applyComment(s, { id: 'c4', userId: 'u1', username: 'bob2', text: 'ENLIST-AB12' }, theme, story, map);
  assert.equal(r.type, 'claim');
  assert.equal(r.handle, 'bob');
  assert.equal(r.soldier.id, 'u1');
});

test('denní tah přidá zápisy a v textech nezůstanou zástupné znaky', () => {
  const s = emptyState(theme);
  for (let i = 0; i < 300; i++) applyComment(s, { id: `c${i}`, userId: `u${i}`, username: `user${i}`, text: i % 2 ? 'CONCORD' : 'HEGEMONY' }, theme, story, map);
  for (let d = 0; d < 30; d++) dailyTick(s, theme, story);
  const all = s.soldiers.flatMap((x) => x.record.map((r) => r[1]));
  assert.ok(all.length > 300);
  assert.ok(!all.some((t) => /\{\w+\}/.test(t)), all.find((t) => /\{\w+\}/.test(t)));
});

test('při zaplnění se otevřou další sektory a nikdo se nepřesune', () => {
  const s = emptyState(theme);
  const first = [];
  for (let i = 0; i < 2600; i++) {
    const r = applyComment(s, { id: `c${i}`, userId: `u${i}`, username: `p${i}`, text: 'CONCORD' }, theme, story, map);
    if (i < 50) first.push([r.soldier, r.soldier.slot]);
  }
  assert.ok(s.openSectors > 8);
  for (const [sol, slot] of first) assert.equal(sol.slot, slot);
  const slots = s.soldiers.map((x) => x.pos.join(','));
  assert.equal(new Set(slots).size, slots.length, 'dva vojáci na jednom místě');
});

import { openVote } from './roster.js';
test('hlasování: jeden hlas na účet, platí poslední, vyhodnotí denní tah', () => {
  const s = emptyState(theme);
  openVote(s, { mediaId: 'm1', question: 'Attack?', options: [
    { kw: 'HOLD', label: 'Hold', danger: 0.5, outcome: 'held' },
    { kw: 'ATTACK', label: 'Attack', danger: 2, outcome: 'attacked' },
  ] });
  const c = (id, u, text, mediaId = 'm1') => applyComment(s, { id, userId: u, username: u, text, mediaId }, theme, story, map);
  c('1', 'a', 'attack!'); c('2', 'b', 'ATTACK'); c('3', 'c', 'hold'); c('4', 'b', 'hold now'); c('5', 'd', 'ATTACK', 'other');
  dailyTick(s, theme, story);
  const ev = s.events.at(-1);
  assert.equal(ev.winner, 'HOLD');
  assert.deepEqual(ev.counts, { HOLD: 2, ATTACK: 1 });
  assert.equal(s.vote, null);
});

import { requestTransfer, applyTransfers, buildPublic } from './roster.js';
import { raceDanger } from './race.js';
test('First Wave: medaili má prvních 100 rekrutů, 101. už ne', () => {
  const s = emptyState(theme);
  for (let i = 0; i < 101; i++) applyComment(s, { id: `c${i}`, userId: `u${i}`, username: `fw${i}`, text: i % 2 ? 'CONCORD' : 'HEGEMONY' }, theme, story, map);
  assert.ok(s.soldiers[0].medals.includes('first-wave'));
  assert.ok(s.soldiers[99].medals.includes('first-wave'));
  assert.ok(!(s.soldiers[100].medals || []).includes('first-wave'));
});

test('příběhové linky, dvojice, počasí a kronika dne', () => {
  const s = emptyState(theme);
  for (let i = 0; i < 200; i++) applyComment(s, { id: `c${i}`, userId: `u${i}`, username: `user${i}`, text: i % 2 ? 'CONCORD' : 'HEGEMONY' }, theme, story, map);
  for (let d = 0; d < 40; d++) dailyTick(s, theme, story, { activeIds: s.soldiers.slice(0, 50).map((x) => x.id) });
  const all = s.soldiers.flatMap((x) => x.record.map((r) => r[1]));
  assert.ok(!all.some((t) => /\{\w+\}|\[[^\]]*\|/.test(t)), all.find((t) => /\{\w+\}|\[[^\]]*\|/.test(t)));
  assert.ok(s.soldiers.some((x) => (x.arcsDone || []).length), 'aspoň jedna dokončená linka');
  assert.equal(s.chronicle.length, 40);
  const txt = JSON.stringify(s.chronicle);
  assert.ok(!/\{\w+\}/.test(txt), txt.match(/.{40}\{\w+\}.{20}/)?.[0]);
  assert.ok(/@user\d+/.test(txt));
  assert.ok(s.chronicle.every((c) => c.title && c.blocks.length >= 2));
});

test('rozmanitost: nováčci ani vojáci v jednom dni nemají stejné zápisy, voják neopakuje své', () => {
  const s = emptyState(theme);
  for (let i = 0; i < 60; i++) applyComment(s, { id: `c${i}`, userId: `u${i}`, username: `user${i}`, text: i % 2 ? 'CONCORD' : 'HEGEMONY' }, theme, story, map);
  const strip = (x, t) => t.split(x.name).join('#');
  // úvody: v každé skupině po sobě jdoucích nováčků se neopakují
  const intros = s.soldiers.map((x) => strip(x, x.record[0][1]).replace(/at [A-Z]-F\d+|in [A-Z]-F\d+/g, ''));
  for (let i = 0; i + story.enlist.length <= intros.length; i += story.enlist.length) {
    const grp = intros.slice(i, i + story.enlist.length).map((t) => t.slice(0, 25));
    assert.ok(new Set(grp).size >= grp.length - 2, grp.join('\n'));
  }
  for (let d = 0; d < 20; d++) dailyTick(s, theme, story, { activeIds: s.soldiers.map((x) => x.id) });
  for (let d = 2; d <= 20; d++) {
    const texts = s.soldiers.flatMap((x) => x.record.filter((r) => r[0] === d).map((r) => strip(x, r[1]).slice(0, 30)));
    const uniq = new Set(texts).size;
    assert.ok(uniq / texts.length > 0.7, `den ${d}: ${uniq}/${texts.length} různých`);
  }
  for (const x of s.soldiers) {
    const own = x.record.map((r) => strip(x, r[1]).slice(0, 30));
    assert.ok(new Set(own).size >= own.length - 2, own.join('\n'));
  }
});

test('pozdní nováček dostane úvod náhradníka a každý má vlastní minulost', () => {
  const s = emptyState(theme);
  s.day = 7;
  const intros = [];
  for (let i = 0; i < 30; i++) {
    const r = applyComment(s, { id: `l${i}`, userId: `lu${i}`, username: `late${i}`, text: 'CONCORD' }, theme, story, map);
    intros.push(r.soldier.record[0][1]);
    assert.ok(r.soldier.bg?.trade && r.soldier.bg?.home);
  }
  assert.ok(intros.filter((t) => /Day 7|6 days/.test(t)).length >= 10, intros.join('\n'));
  assert.ok(!intros.some((t) => /\{\w+\}/.test(t)));
  const bgs = new Set(s.soldiers.map((x) => JSON.stringify(x.bg)));
  assert.equal(bgs.size, 30);
});

test('závod o kótu: první na 100 vyhraje, dostane výhodu, začne nový závod', () => {
  const s = emptyState(theme);
  let v = null;
  for (let i = 0; i < 260 && !v; i++) {
    // Hegemonie naverbuje 2 na každého z Concordu
    const r = applyComment(s, { id: `c${i}`, userId: `u${i}`, username: `user${i}`, text: i % 3 === 2 ? 'CONCORD' : 'HEGEMONY' }, theme, story, map);
    v = r.victory;
  }
  assert.ok(v, 'někdo vyhrál');
  assert.equal(v.faction, 0);
  assert.equal(s.soldiers.filter((x) => x.faction === 0).length, 100);
  const hero = s.soldiers.find((x) => x.handle === v.hero);
  assert.ok(hero.titles.some((t) => t.startsWith('Hero of')));
  assert.ok(s.soldiers.filter((x) => x.faction === 0).every((x) => x.medals.includes(`obj:${v.id}`)));
  assert.ok(s.soldiers.every((x) => x.record.some((r) => /Verdel Ridge/.test(r[1]))));
  assert.ok(s.soldiers.find((x) => x.faction === 0).titles.includes('First of the Hegemony'));
  assert.ok(raceDanger(s, theme, 0, s.day + 1) < 1 && raceDanger(s, theme, 1, s.day + 1) > 1);
  assert.equal(raceDanger(s, theme, 0, s.day), 1, 'výhoda platí až od dalšího dne');
  const pub = buildPublic(s, theme).roster;
  assert.deepEqual(pub.race.counts, [0, 0]);
  assert.equal(pub.race.name, 'Hill 304');
  dailyTick(s, theme, story);
  assert.match(JSON.stringify(s.chronicle.at(-1)), /took Verdel Ridge/);
  assert.ok(buildPublic(s, theme).roster.barrage?.target === 1);
});

test('převelení: jen převzatý voják, jednou za 7 dní, ne na důstojníka', () => {
  const s = emptyState(theme);
  const x = applyComment(s, { id: 'c1', userId: 'u1', username: 'jan', text: 'CONCORD' }, theme, story, map).soldier;
  assert.equal(requestTransfer(s, x, 'medic', theme), false, 'nepřevzatý');
  x.claimed = true;
  x.archetype = 'rifleman';
  assert.equal(requestTransfer(s, x, 'officer', theme), false);
  assert.ok(requestTransfer(s, x, 'medic', theme));
  assert.equal(applyTransfers(s, theme, story).length, 1);
  assert.equal(x.archetype, 'medic');
  assert.match(x.record.at(-1)[1], /stretcher bearer/);
  requestTransfer(s, x, 'sniper', theme);
  assert.equal(applyTransfers(s, theme, story).length, 0, 'lhůta 7 dní');
  s.day += 7;
  assert.equal(applyTransfers(s, theme, story).length, 1);
  assert.equal(x.archetype, 'sniper');
});

test('90 dní války s výpravami: žádný text nemá nedoplněnou proměnnou ani [volbu]', () => {
  const s = emptyState(theme);
  const bad = /\{\w+\}|undefined|NaN|\[|\]|\||\(\)| [.,]/;
  let n = 0;
  for (let i = 0; i < 400; i++) applyComment(s, { id: `c${i}`, userId: `u${i}`, username: `user${i}`, text: i % 3 ? 'CONCORD' : 'HEGEMONY' }, theme, story, map);
  s.soldiers.slice(0, 40).forEach((x) => (x.claimed = true));
  for (let d = 0; d < 90; d++) {
    if (s.valley?.open) {
      const kw = theme.valley.locations.find((l) => l.id === s.valley.open.loc).keyword;
      for (let i = 0; i < 30; i++) applyComment(s, { id: `r${d}-${i}`, userId: `u${(d * 7 + i * 13) % 400}`, username: `user${(d * 7 + i * 13) % 400}`, text: kw }, theme, story, map);
    }
    dailyTick(s, theme, story);
  }
  for (const x of s.soldiers) for (const [, t] of x.record) { n++; assert.ok(!bad.test(t), `@${x.handle}: ${t}`); }
  for (const c of s.chronicle) for (const b of c.blocks) for (const t of [b.h, b.text, ...(b.items || [])]) if (t) assert.ok(!bad.test(t), `den ${c.day}: ${t}`);
  assert.ok(s.valley.history.length >= 20, 'výpravy proběhly');
  assert.ok(n > 3000, `zápisů ${n}`);
  console.log(`simulace: ${n} zápisů, ${s.valley.history.length} výprav`);
});

test('výpravy: vyhlášení, přihlášky komentářem, vyhodnocení, převzatí nepadnou', async () => {
  const { resolveExpedition } = await import('./valley.js');
  const s = emptyState(theme);
  for (let i = 0; i < 40; i++) applyComment(s, { id: `c${i}`, userId: `u${i}`, username: `user${i}`, text: i % 2 ? 'CONCORD' : 'HEGEMONY' }, theme, story, map);
  s.soldiers.forEach((x) => (x.claimed = true));
  s.day = 1;
  dailyTick(s, theme, story); // den 2: vyhlášení (theme.valley.firstDay)
  assert.ok(s.valley.open, 'výprava vyhlášena');
  const kw = theme.valley.locations.find((l) => l.id === s.valley.open.loc).keyword;
  const r = applyComment(s, { id: 'v1', userId: 'u3', username: 'user3', text: `${kw.toLowerCase()}!` }, theme, story, map);
  assert.equal(r.type, 'volunteer');
  assert.equal(r.ok, true);
  assert.equal(applyComment(s, { id: 'v2', userId: 'u3', username: 'user3', text: kw }, theme, story, map).reason, 'already');
  for (let i = 0; i < 20; i++) applyComment(s, { id: `w${i}`, userId: `u${i}`, username: `user${i}`, text: kw }, theme, story, map);
  assert.equal(s.valley.open.volunteers.filter((v) => v.f === 1).length, theme.valley.slots);
  const copy = JSON.parse(JSON.stringify(s));
  dailyTick(s, theme, story); // den 3: vyhodnocení
  dailyTick(copy, theme, story);
  assert.deepEqual(s.valley.history, copy.valley.history, 'deterministické');
  const h = s.valley.history[0];
  assert.ok(['take', 'hold', 'stalemate'].includes(h.outcome));
  assert.ok(!s.soldiers.some((x) => x.status === 'fallen'), 'převzatí hráči na výpravě nepadnou');
  const ch = s.chronicle.at(-1);
  assert.equal(ch.blocks[0].kind, 'expedition');
  assert.ok(!JSON.stringify(ch).match(/\{\w+\}|undefined/));
  assert.ok(resolveExpedition);
});

test('přání role v komentáři: rozpoznání, první volba zdarma, důstojník ne', () => {
  const r = (t) => parseRole(t, theme);
  assert.equal(r('CONCORD I want to be a machine gunner'), 'machinegunner');
  assert.equal(r('HEGEMONY MG'), 'machinegunner');
  assert.equal(r('Concord! doctor please 🙏'), 'medic');
  assert.equal(r('can I be a medic?'), 'medic');
  assert.equal(r('HEGEMONY sniper rifle'), 'sniper');
  assert.equal(r('let him cook 🔥'), null);
  assert.equal(r('medic or sniper?'), null);
  assert.equal(r('HEGEMONY I am a nurse irl so medic for me'), 'medic');
  assert.equal(r('CONCORD'), null);
  assert.equal(r('make me a lieutenant'), 'officer');

  const s = emptyState(theme);
  const a = applyComment(s, { id: 'c1', userId: 'u1', username: 'jan', text: 'CONCORD, I wanna be a medic' }, theme, story, map);
  assert.equal(a.type, 'enlist');
  assert.equal(a.soldier.archetype, 'medic');
  assert.equal(a.roleWish.reason, a.roleWish.reason === 'same' ? 'same' : 'granted');
  const b = applyComment(s, { id: 'c2', userId: 'u2', username: 'eva', text: 'HEGEMONY' }, theme, story, map).soldier;
  const was = b.archetype;
  const want = was === 'sniper' ? 'cook' : 'sniper';
  const c = applyComment(s, { id: 'c3', userId: 'u2', username: 'eva', text: `I want to be a ${want}` }, theme, story, map);
  assert.equal(c.type, 'role');
  assert.equal(c.reason, b.archetype === 'officer' && was === 'officer' ? 'locked' : 'granted');
  if (c.reason === 'granted') {
    assert.equal(b.archetype, want);
    assert.match(b.record.at(-1)[1], new RegExp(theme.archetypes.find((x) => x.id === want).name.toLowerCase()));
    const d = applyComment(s, { id: 'c4', userId: 'u2', username: 'eva', text: 'actually make me a runner' }, theme, story, map);
    assert.equal(d.reason, 'used', 'druhá změna jen převelením z karty');
  }
  const e = applyComment(s, { id: 'c5', userId: 'u9', username: 'nobody', text: 'can I be a doctor?' }, theme, story, map);
  assert.equal(e.reason, 'notEnlisted');
  assert.equal(s.soldiers.length, 2);
  const f = applyComment(s, { id: 'c6', userId: 'u7', username: 'boss', text: 'CONCORD make me captain' }, theme, story, map);
  assert.equal(f.roleWish.reason, 'officer');
  for (const x of [a, c, e, f]) {
    const w = x.type === 'enlist' ? x.roleWish : x;
    const t = roleReply(theme, x.soldier, w.role, w.reason);
    if (t) assert.doesNotMatch(t, /undefined|\{/);
  }
});

test('deník se nemaže: nástupce pokračuje v zápisech rodu, web má starší zápisy v archivu', async () => {
  const { heir } = await import('./soldier.js');
  const { buildPublic, shardOf } = await import('./roster.js');
  const s = emptyState(theme);
  const x = applyComment(s, { id: 'c1', userId: 'u1', username: 'jan', text: 'CONCORD' }, theme, story, map).soldier;
  for (let d = 1; d <= 60; d++) x.record.push([d, `entry ${d}`]);
  const before = x.record.map((r) => r[1]);
  x.status = 'fallen'; x.fallenDay = 60;
  const n = heir(x, 61, theme, story);
  assert.deepEqual(n.record.slice(0, before.length).map((r) => r[1]), before, 'zápisy padlého zůstanou');
  assert.equal(n.record.length, before.length + 1);
  s.soldiers[0] = n;
  const pub = buildPublic(s, theme);
  const k = shardOf('jan');
  const card = pub.shards[k].jan;
  assert.equal(card.record.length + card.older, n.record.length);
  assert.deepEqual([...pub.older[k].jan, ...card.record], n.record, 'archiv + karta = celý deník');
});

import { orderDanger, orderRecover } from './orders.js';
import { fireTriggers, openItemVote } from '../ingest/triggers.mjs';
test('hlasování po frakcích: hlas se páruje s vojákem, každá strana má vlastní výsledek a rozkaz', () => {
  const s = emptyState(theme);
  const c = (id, u, text, mediaId) => applyComment(s, { id, userId: u, username: u, text, mediaId }, theme, story, map);
  c('e1', 'h1', 'HEGEMONY'); c('e2', 'h2', 'HEGEMONY'); c('e3', 'k1', 'CONCORD'); c('e4', 'k2', 'CONCORD'); c('e5', 'k3', 'CONCORD');
  openVote(s, { mediaId: 'v1', perFaction: true, question: 'Orders?', options: [
    { kw: 'FORTIFY', label: 'f', danger: 0.7, days: 3, outcome: 'The {side} dug in.' },
    { kw: 'HOSPITAL', label: 'h', recover: 0.6, days: 3, outcome: 'The {side} built a hospital.' },
  ] });
  assert.equal(c('v1', 'h1', 'fortify', 'v1').faction, 0);
  c('v2', 'h2', 'FORTIFY!', 'v1');
  c('v3', 'k1', 'hospital', 'v1'); c('v4', 'k2', 'HOSPITAL', 'v1'); c('v5', 'k3', 'fortify', 'v1');
  c('v6', 'k3', 'hospital pls', 'v1'); // platí poslední
  assert.equal(c('v7', 'nobody', 'FORTIFY', 'v1').reason, 'notEnlisted'); // bez vojáka se nepočítá
  const r = c('v8', 'newbie', 'HEGEMONY hospital', 'v1'); // narukuje a rovnou hlasuje
  assert.equal(r.type, 'enlist');
  assert.equal(r.vote.kw, 'HOSPITAL');
  assert.equal(c('v9', 'h1', 'HOSPITAL', 'other'), null); // pod jiným postem se nehlasuje (už narukovaný)
  dailyTick(s, theme, story);
  const ev = s.events.at(-1);
  assert.equal(ev.perFaction, true);
  assert.deepEqual(ev.winners, ['FORTIFY', 'HOSPITAL']);
  assert.deepEqual(ev.counts, [{ FORTIFY: 2, HOSPITAL: 1 }, { FORTIFY: 0, HOSPITAL: 3 }]);
  assert.match(ev.text, /The Hegemony dug in\. The Concord built a hospital\./);
  assert.equal(s.vote, null);
  // rozkazy platí od dnešního dne (tah už proběhl) 3 dny
  assert.equal(orderDanger(s, 0, s.day), 0.7);
  assert.equal(orderDanger(s, 1, s.day), 1);
  assert.equal(orderDanger(s, 0, s.day + 3), 1);
  assert.equal(orderRecover(s, 1, s.day + 2, 0.35), 0.6);
  assert.equal(orderRecover(s, 0, s.day, 0.35), 0.35);
  assert.match(s.chronicle.at(-1).blocks?.map((b) => b.text).join(' ') ?? JSON.stringify(s.chronicle.at(-1)), /Hegemony: FORTIFY/);
});

test('hlasování s minHours počká na další vydání', () => {
  const s = emptyState(theme);
  openVote(s, { mediaId: 'm', perFaction: true, minHours: 8, openedAt: '2026-11-09T10:00:00Z', question: 'q', options: [{ kw: 'A', label: 'a' }, { kw: 'B', label: 'b' }] });
  dailyTick(s, theme, story, { now: Date.parse('2026-11-09T13:00:00Z') });
  assert.ok(s.vote);
  dailyTick(s, theme, story, { now: Date.parse('2026-11-10T13:00:00Z') });
  assert.equal(s.vote, null);
});

test('příspěvek s triggerem vyjde při dobytí kóty ve variantě vítěze a otevře hlasování', () => {
  const s = emptyState(theme);
  const q = { items: [{ id: 'win', type: 'carousel', trigger: { race: 'ridge' }, files: [], caption: '',
    variants: [{ files: ['h.jpg'], caption: 'H @{hero} {win}-{lose} next {next}' }, { files: ['c.jpg'], caption: 'C @{hero} {win}-{lose} next {next}' }],
    vote: { question: 'q', perFaction: true, options: [{ kw: 'FORTIFY', label: 'f' }, { kw: 'HOSPITAL', label: 'h' }] } }] };
  assert.equal(fireTriggers(q, s, theme).length, 0);
  const need = theme.race.need;
  for (let i = 0; i < need; i++) applyComment(s, { id: `k${i}`, userId: `k${i}`, username: `k${i}`, text: 'CONCORD' }, theme, story, map);
  for (let i = 0; i < 3; i++) applyComment(s, { id: `h${i}`, userId: `h${i}`, username: `h${i}`, text: 'HEGEMONY' }, theme, story, map);
  assert.equal(s.victories.length, 1);
  const [item] = fireTriggers(q, s, theme);
  assert.deepEqual(item.files, ['c.jpg']);
  assert.equal(item.caption, `C @k${need - 1} ${need}-0 next Hill 304`);
  assert.equal(fireTriggers(q, s, theme).length, 1); // čeká na zveřejnění, nepřepočítává se
  item.published = { id: 'm42', at: new Date().toISOString() };
  assert.ok(openItemVote(s, item));
  assert.equal(s.vote.mediaId, 'm42');
  assert.equal(s.vote.perFaction, true);
  assert.equal(fireTriggers(q, s, theme).length, 0);
});
