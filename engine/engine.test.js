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

import { battleTick, build, hospital, medicCover, battlePublic, levelOf } from './battle.js';
const enlist = (s, n, tag = 'b') => {
  for (let i = 0; i < n; i++) applyComment(s, { id: `${tag}${i}`, userId: `${tag}${i}`, username: `${tag}${i}`, text: i % 2 ? 'CONCORD' : 'HEGEMONY' }, theme, story, map);
};

test('boj: stavby jen hlasováním, obvaziště 2 lůžka, každá nemocnice má 4 lůžka, další se dá odhlasovat', () => {
  const s = emptyState(theme);
  assert.equal(hospital(s, theme, 0).beds, 2);
  assert.equal(hospital(s, theme, 0).dugout, false);
  assert.ok(build(s, theme, 0, 'dugout'));
  assert.equal(hospital(s, theme, 0).beds, 4);
  assert.ok(build(s, theme, 0, 'dugout'), 'druhá nemocnice (další hlasování)');
  assert.equal(hospital(s, theme, 0).beds, 8);
  assert.equal(hospital(s, theme, 0).dugouts, 2);
  assert.equal(hospital(s, theme, 1).beds, 2, 'druhá strana má pořád obvaziště');
  for (let i = 0; i < 20; i++) build(s, theme, 0, 'dugout');
  assert.equal(hospital(s, theme, 0).dugouts, theme.battle.buildings.dugout.max, 'nejvýš max nemocnic');
});

test('boj: bombardování po výhře udělá paseku ve 2 sektorech poražené strany, nováčky nešetří, roztrhá drát', () => {
  const s = emptyState(theme);
  enlist(s, 120, 'sh');
  s.day = 2; // všichni jsou nováčci
  s.victories = [{ id: 'ridge', name: 'Verdel Ridge', faction: 0, day: 2, hero: 'sh0', from: 3, to: 9, barrageTo: 5, counts: [60, 60] }];
  const pre = JSON.parse(JSON.stringify(s));
  const out = battleTick(s, theme, story, 3);
  const news = out.news.find((n) => n.kind === 'barrage');
  assert.ok(news, 'Gazette hlásí bombardování');
  const secs = news.h.replace(/.* fell on /, '').split(' and ');
  assert.equal(secs.length, 2);
  const there = s.soldiers.filter((x) => x.faction === 1 && secs.includes(x.sector));
  const elsewhere = s.soldiers.filter((x) => x.faction === 1 && !secs.includes(x.sector));
  const rate = (l) => l.filter((x) => x.wound).length / l.length;
  assert.ok(rate(there) > rate(elsewhere) * 3, `pod granáty ${rate(there)} vs jinde ${rate(elsewhere)}`);
  assert.ok(!s.soldiers.some((x) => x.faction === 0 && x.wound?.shell), 'vítěz granáty nedostává');
  for (const sec of secs) assert.ok(s.battle.sides[1].wire[sec] <= theme.battle.wire.start - theme.battle.shell.wire + 1e-9, 'drát v sektoru roztrhaný');
  // tři dny bombardování na nováčky bez nemocnice: kritičtí i padlí jsou možní (granát nešetří)
  let crit = 0, dead = 0;
  for (let seed = 0; seed < 10; seed++) {
    const t = JSON.parse(JSON.stringify(pre));
    t.soldiers.forEach((x) => { x.id = `${x.id}_${seed}`; });
    for (let d = 3; d <= 8; d++) battleTick(t, theme, story, d);
    crit += t.soldiers.filter((x) => x.lastCrit != null).length;
    dead += t.soldiers.filter((x) => x.status === 'fallen').length;
  }
  assert.ok(crit > 0 && dead > 0, `kritických ${crit}, padlých ${dead} v 10 bězích`);
});

test('boj: převzatí hráči nejsou chránění, nováčci prvních 5 dní nedostanou kritický zásah', () => {
  const s = emptyState(theme);
  enlist(s, 200);
  s.soldiers.forEach((x, i) => { if (i % 2) x.claimed = true; });
  const hot = { ...theme, battle: { ...theme.battle, hit: 0.5 } };
  battleTick(s, hot, story, 2);
  const hit = s.soldiers.filter((x) => x.wound);
  assert.ok(hit.some((x) => x.claimed), 'i převzatí dostávají zásahy');
  assert.ok(!hit.some((x) => x.wound.sev === 'crit'), 'nováček nemá kritický zásah');
});

test('boj: hlídací simulace – 100 vojáků, 9 týdnů: horní mez úmrtí (obvaziště < 3, nemocnice < 2 na stranu týdně), nemocnice pomáhá, texty doplněné', () => {
  const run = (builds, seed) => {
    const s = emptyState(theme);
    enlist(s, 100, `g${seed}_`);
    for (let d = 0; d < 63; d++) {
      if (d === 6) for (const b of builds) for (const f of [0, 1]) build(s, theme, f, b);
      dailyTick(s, theme, story);
    }
    const dead = s.soldiers.reduce((a, x) => a + (x.fallen?.length || 0) + (x.status === 'fallen' ? 1 : 0), 0);
    for (const x of s.soldiers) for (const [, t] of x.record) assert.doesNotMatch(t, /\{\w+\}|undefined/);
    const pub = battlePublic(s, theme);
    pub.forEach((p) => assert.ok(p.beds.length <= p.hospital.beds, 'lůžek nikdy víc, než je místa'));
    return dead / 18; // na stranu za týden
  };
  const dug = [0, 1, 2].map((i) => run(['dugout'], i)).reduce((a, b) => a + b) / 3;
  const aid = [0, 1, 2].map((i) => run([], i)).reduce((a, b) => a + b) / 3;
  assert.ok(dug < 2, `s dugoutem ${dug.toFixed(2)} mrtvých na stranu týdně`);
  assert.ok(aid < 3, `jen obvaziště ${aid.toFixed(2)} mrtvých na stranu týdně`);
  assert.ok(aid > dug, 'nemocnice zachraňuje životy');
});

test('hlasování po frakcích staví: HOSPITAL postaví dugout jen té straně, která ho zvolila', () => {
  const s = emptyState(theme);
  enlist(s, 6, 'hv');
  openVote(s, { mediaId: 'mv', perFaction: true, question: 'Build?', options: [
    { kw: 'FORTIFY', label: 'f', build: 'sandbags', outcome: 'The {side} raised the parapets.' },
    { kw: 'HOSPITAL', label: 'h', build: 'dugout', outcome: 'The {side} dug a hospital.' },
  ] });
  const c = (id, u, text) => applyComment(s, { id, userId: u, username: u, text, mediaId: 'mv' }, theme, story, map);
  c('x1', 'hv0', 'HOSPITAL'); c('x2', 'hv1', 'FORTIFY'); c('x3', 'hv3', 'FORTIFY');
  dailyTick(s, theme, story);
  assert.equal(s.battle.sides[0].built.dugout, 1);
  assert.equal(s.battle.sides[1].built.sandbags, 1);
  assert.ok(!s.battle.sides[1].built.dugout);
  assert.match(s.events.at(-1).text, /hospital dugout/);
});

import { heir as heirOf, lifeRecord, fallSoldier } from './soldier.js';
import { leaderboards, rollOfHonour } from './roster.js';
test('rod: nástupce je nový voják – nic nedědí, dny od nuly, přijde hned ve stejném vydání', () => {
  const s = emptyState(theme);
  enlist(s, 4, 'fam');
  s.day = 20;
  const x = s.soldiers[0];
  Object.assign(x, { archetype: 'medic', rank: 3, medals: ['first-wave', 'obj:ridge'], titles: ['Hero of Verdel Ridge'], scars: 2, tough: 5, treated: 14, woundsTaken: 3, raids: 2, claimed: true });
  x.wound = { sev: 'crit', day: 20, wait: 1, shell: true };
  x.record.push([21, 'Every bed was taken. He died waiting on a stretcher.']);
  fallSoldier(x, 21, 'nobed'); // zemřel v boji dnešního tahu (den 21)
  const gen = x.generation;
  dailyTick(s, theme, story);
  const n = s.soldiers[0];
  assert.equal(n.generation, gen + 1, 'nástupce už je ve hře');
  assert.equal(n.status, 'active');
  assert.equal(n.enlisted, s.day, 'dny na frontě od nuly');
  assert.deepEqual(n.medals, []);
  assert.deepEqual(n.titles, []);
  assert.ok(!n.scars && !n.treated && !n.woundsTaken && !n.raids && n.tough == null, 'žádné jizvy, zkušenosti ani výdrž po předkovi');
  assert.equal(n.rank, 0);
  assert.equal(n.claimed, true, 'hráč (převzetí) zůstává');
  assert.equal(n.handle, x.handle);
  const p = n.fallen.at(-1);
  assert.equal(p.archetype, 'medic');
  assert.deepEqual(p.medals, ['first-wave', 'obj:ridge']);
  assert.equal(p.cause.kind, 'nobed');
  assert.equal(p.cause.shell, true);
  assert.equal(p.days, 20 - x.enlisted + 1);
  assert.equal(p.treated, 14);
  assert.match(n.record.at(-1)[1], new RegExp(p.name.split(' ')[0]), 'příchod nástupce zmiňuje padlého');
  assert.equal(n.recFrom, n.record.length - 1, 'deník nástupce začíná jeho příchodem');
  const [a, b] = p.rec;
  assert.ok(b > a && n.record.slice(a, b).some(([, t]) => /stretcher|died|waiting/.test(t)), 'rozsah deníku padlého obsahuje jeho smrt');
  const honour = rollOfHonour(s);
  assert.equal(honour[0].name, p.name);
  assert.equal(honour[0].cause.kind, 'nobed');
});

test('žebříčky: nejdéle na frontě, nejstarší rody, vyznamenaní, přeživší, medici', () => {
  const s = emptyState(theme);
  enlist(s, 6, 'lb');
  s.day = 30;
  s.soldiers.forEach((x) => { x.enlisted = 25; x.medals = []; });
  s.soldiers[0].enlisted = 2;
  s.soldiers[1].enlisted = 10;
  s.soldiers[2].medals = ['first-wave', 'x'];
  s.soldiers[3].scars = 2;
  s.soldiers[4].archetype = 'medic'; s.soldiers[4].treated = 9;
  s.soldiers[5].fallen = [{ name: 'Old One', day: 15, days: 40, medals: ['a', 'b', 'c'] }];
  const b = leaderboards(s, theme);
  assert.equal(b.longest[0].handle, s.soldiers[0].handle);
  assert.equal(b.longest[0].value, 28);
  assert.equal(b.houses[0].handle, s.soldiers[5].handle, 'rod se počítá i s padlými předky');
  assert.equal(b.decorated[0].handle, s.soldiers[2].handle);
  assert.equal(b.houseHonours[0].handle, s.soldiers[5].handle);
  assert.equal(b.survivors[0].handle, s.soldiers[3].handle);
  assert.equal(b.medics[0].value, 9);
});

import { awardHouseBadges, deathReply } from './house.js';
test('rod: odznaky rodu zůstávají napříč generacemi, bot dostane oznámení o smrti s odkazem', () => {
  const s = emptyState(theme);
  enlist(s, 2, 'hb');
  const x = s.soldiers[0];
  x.reply = 'c-enlist-1';
  s.day = 20;
  awardHouseBadges(s, theme);
  assert.ok(x.houseBadges.some((b) => b.id === 'days14'), 'přežil 14 dní');
  x.record.push([21, 'Every bed was taken. He died waiting on a stretcher.']);
  fallSoldier(x, 21, 'nobed');
  dailyTick(s, theme, story);
  const n = s.soldiers[0];
  assert.equal(n.generation, 2);
  assert.ok(n.houseBadges.some((b) => b.id === 'days14'), 'odznak rodu zůstal');
  assert.ok(n.houseBadges.some((b) => b.id === 'gen2'), 'nový odznak: druhá generace');
  assert.equal(n.reply, 'c-enlist-1', 'bot ví, kam odpovědět');
  const note = s.notices.at(-1);
  assert.equal(note.handle, n.handle);
  const msg = deathReply(note, theme, 'https://mudandiron.web.app');
  assert.match(msg, new RegExp(`^@${n.handle} .+ fell on Day 21 on a stretcher, waiting for a bed`));
  assert.match(msg, /has taken up the rifle\. Your house: https:\/\/mudandiron\.web\.app\/\?s=.+&fell=1$/);
});

// --- péče, střelba, role (docs/COMBAT_ROLES.md) ---
const quiet = (over = {}) => ({ ...theme, battle: { ...theme.battle, hit: 0, roles: { ...theme.battle.roles, default: { fire: 0 }, rifleman: { ...theme.battle.roles.rifleman, fire: 0 }, machinegunner: { ...theme.battle.roles.machinegunner, fire: 0 }, sniper: { ...theme.battle.roles.sniper, fire: 0 }, officer: { ...theme.battle.roles.officer, fire: 0 } }, ...over } });
const setup = (n = 40, tag = 'pc') => {
  const s = emptyState(theme);
  enlist(s, n, tag);
  s.day = 20;
  s.soldiers.forEach((x) => { x.enlisted = 0; x.archetype = 'rifleman'; });
  return s;
};
const hurt = (x, sev, day = 20) => { x.status = 'wounded'; x.wound = { sev, day }; };

test('péče: lehce raněný leží v zákopu, s 1 medikem je druhý den v pořádku; potřeba mediků lehký 1, těžký 2, na lůžku 0', () => {
  const s = setup();
  const side = s.soldiers.filter((x) => x.faction === 0);
  side[0].archetype = 'medic';
  hurt(side[1], 'light', 20);
  battleTick(s, quiet(), story, 20); // den zásahu: zůstává ležet
  assert.equal(side[1].wound.place, 'trench');
  battleTick(s, quiet(), story, 21);
  assert.equal(side[1].status, 'active', 'druhý den v pořádku');
  hurt(side[2], 'heavy', 21);
  hurt(side[3], 'light', 21);
  battleTick(s, quiet(), story, 21);
  const m = medicCover(s, theme, 0);
  assert.equal(side[2].wound.place, 'bed', 'těžce raněný dostal lůžko');
  assert.equal(m.demand, theme.battle.care.light.need, 'na lůžku medik není potřeba, lehký potřebuje 1');
});

test('péče: kritičtí první na lůžka, pak nosítka; kritický bez nosítek nepřežije; na nosítkách s 2 mediky přežije, bez nich většinou ne', () => {
  const s = setup(60);
  const side = s.soldiers.filter((x) => x.faction === 0);
  side.slice(0, 2).forEach((x) => { x.archetype = 'medic'; });
  hurt(side[2], 'heavy', 19); hurt(side[3], 'crit', 20); hurt(side[4], 'crit', 20); hurt(side[5], 'crit', 20);
  const cfg = quiet({ aidPost: { ...theme.battle.aidPost, beds: 2, stretchers: 1, critDie: 0 }, care: { ...theme.battle.care, crit: { ...theme.battle.care.crit, dieBase: 0 } } });
  battleTick(s, cfg, story, 20);
  const bedded = [side[3], side[4], side[5]].filter((x) => x.wound?.place === 'bed');
  assert.equal(bedded.length, 2, 'dva kritičtí na lůžkách');
  const third = [side[3], side[4], side[5]].find((x) => !bedded.includes(x));
  assert.equal(third.wound.place, 'stretcher', 'třetí kritický na posledních nosítkách');
  assert.equal(side[2].wound.place, 'trench', 'těžký už se nevešel ani na nosítka');
  assert.equal(third.status, 'wounded', 's 2 mediky přežil noc');
  // bez mediků a bez nosítek: kritický v zákopu umírá
  const t = setup(20, 'pd');
  const v = t.soldiers.find((x) => x.faction === 0);
  hurt(v, 'crit', 20);
  battleTick(t, quiet({ aidPost: { ...theme.battle.aidPost, beds: 0, stretchers: 0 } }), story, 20);
  assert.equal(t.soldiers.find((x) => x.handle === v.handle).generation, 1);
  assert.equal(v.status, 'fallen', 'kritický bez nosítek noc nepřežil');
  // na nosítkách bez mediků: většinou zemře
  let dead = 0;
  for (let i = 0; i < 30; i++) {
    const u = setup(10, `pn${i}_`);
    const x = u.soldiers.find((y) => y.faction === 0);
    hurt(x, 'crit', 20);
    battleTick(u, quiet({ aidPost: { ...theme.battle.aidPost, beds: 0 } }), story, 20);
    if (x.status === 'fallen') dead++;
  }
  assert.ok(dead >= 15, `bez mediků zemřelo ${dead}/30`);
});

test('střelba: všichni občas vystřelí (podpůrné role méně), zapíše se kdo koho trefil, střelec dostane zásah a XP', () => {
  const s = emptyState(theme);
  enlist(s, 200, 'sh2_');
  s.day = 30;
  s.soldiers.forEach((x) => { x.enlisted = 0; });
  const hot = { ...theme, battle: { ...theme.battle, hit: 0, roles: { ...theme.battle.roles, rifleman: { ...theme.battle.roles.rifleman, fire: 0.6 } } } };
  battleTick(s, hot, story, 30);
  const shot = s.soldiers.filter((x) => x.wound?.by);
  assert.ok(shot.length > 10, `zasaženo ${shot.length}`);
  const v = shot[0];
  const shooter = s.soldiers.find((x) => x.handle === v.wound.by.handle);
  assert.notEqual(shooter.faction, v.faction, 'střílí se na nepřítele');
  assert.ok(shooter.hits >= 1 && shooter.xp > 0);
  assert.match(v.record.at(-1)[1], new RegExp(`Shot by .+ \\(@${shooter.handle}\\)`));
  assert.ok(shooter.record.some(([d, t]) => d === 30 && t.includes(v.name)), 'střelec má zásah v deníku');
  const stats = s.battle.stats.at(-1);
  assert.ok(stats.sides[0].shots > 0 && stats.sides[1].shots > 0);
  // podpůrná role střílí méně než střelec
  assert.ok(theme.battle.roles.default.fire < theme.battle.roles.rifleman.fire);
});

test('zkušenosti: úroveň zvyšuje hlavní schopnost (palba, práce medika)', () => {
  const s = setup(4, 'xp');
  const m = s.soldiers.find((x) => x.faction === 0);
  m.archetype = 'medic';
  assert.equal(levelOf(theme, m).name, 'Recruit');
  const w0 = medicCover(s, theme, 0).supply;
  m.xp = 200;
  assert.equal(levelOf(theme, m).name, 'Veteran');
  assert.ok(medicCover(s, theme, 0).supply > w0 * 1.4);
});

test('pojistka: nejvýš maxDeaths padlých za den na stranu, ostatní přežijí do zítřka', () => {
  const s = setup(200, 'cap');
  const side = s.soldiers.filter((x) => x.faction === 0);
  side.slice(0, 30).forEach((x) => hurt(x, 'crit', 20));
  battleTick(s, quiet({ aidPost: { ...theme.battle.aidPost, beds: 0, stretchers: 0 } }), story, 20);
  const dead = side.filter((x) => x.status === 'fallen').length;
  const cap = Math.max(theme.battle.maxDeaths.min, Math.floor(100 * theme.battle.maxDeaths.share));
  assert.equal(dead, cap);
  assert.ok(s.battle.stats.at(-1).sides[0].capped > 0);
});

test('vypínač: battle.enabled = false nic nedělá', () => {
  const s = setup(10, 'off');
  const x = s.soldiers[0];
  hurt(x, 'crit', 20);
  battleTick(s, { ...theme, battle: { ...theme.battle, enabled: false } }, story, 20);
  assert.equal(x.status, 'wounded');
});
