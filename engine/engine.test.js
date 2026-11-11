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
  assert.ok(hero.medals.includes(`hero:${v.id}`), 'hrdina dostane medaili za statečnost');
  assert.equal(s.soldiers.filter((x) => x.medals.some((m) => m.startsWith('hero:'))).length, 1);
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

// výpravy jsou ve hře zatím vypnuté (theme.valley.enabled = false), mechanika se testuje zapnutá
const raidsOn = { ...theme, valley: { ...theme.valley, enabled: true } };
test('90 dní války s výpravami: žádný text nemá nedoplněnou proměnnou ani [volbu]', () => {
  const theme = raidsOn;
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
  const theme = raidsOn;
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
  assert.match(s.chronicle.at(-1).blocks?.map((b) => b.text).join(' ') ?? JSON.stringify(s.chronicle.at(-1)), /The Hegemony chose FORTIFY \(2 to 1\)/);
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

import { battleTick, build, hospital, medicCover, battlePublic, levelOf, share } from './battle.js';
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

test('boj: bombardování po výhře udělá paseku v několika sektorech poražené strany (theme.battle.shell.sectors), nováčky nešetří, roztrhá drát', () => {
  const s = emptyState(theme);
  enlist(s, 120, 'sh');
  s.day = 2; // všichni jsou nováčci
  s.victories = [{ id: 'ridge', name: 'Verdel Ridge', faction: 0, day: 2, hero: 'sh0', from: 3, to: 9, barrageTo: 5, counts: [60, 60] }];
  const pre = JSON.parse(JSON.stringify(s));
  const out = battleTick(s, theme, story, 3);
  const news = out.news.find((n) => n.kind === 'barrage');
  assert.ok(news, 'Gazette hlásí bombardování');
  const secs = news.h.replace(/.* fell on /, '').split(' and ');
  const SH = theme.battle.shell, nSecs = new Set(s.soldiers.filter((x) => x.faction === 1 && x.sector).map((x) => x.sector)).size;
  assert.equal(secs.length, Math.min(nSecs, Math.max(SH.sectors || 0, Math.round(nSecs * (SH.share || 0)))), 'počet úseků roste s frontou');
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

test('boj: převzatí hráči nejsou chránění, nováčci prvních newbieDays dní nedostanou kritický zásah', () => {
  const s = emptyState(theme);
  enlist(s, 200);
  s.soldiers.forEach((x, i) => { if (i % 2) x.claimed = true; });
  const hot = { ...theme, battle: { ...theme.battle, hit: 0.5 } };
  battleTick(s, hot, story, 2);
  const hit = s.soldiers.filter((x) => x.wound);
  assert.ok(hit.some((x) => x.claimed), 'i převzatí dostávají zásahy');
  assert.ok(!hit.some((x) => x.wound.sev === 'crit'), 'nováček nemá kritický zásah');
});

test('boj: hlídací simulace – 100 vojáků, 9 týdnů: horní mez úmrtí (obvaziště < 9, nemocnice < 3 na stranu týdně), nemocnice pomáhá, texty doplněné', () => {
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
  assert.ok(dug < 3, `s dugoutem ${dug.toFixed(2)} mrtvých na stranu týdně`);
  assert.ok(aid < 9, `jen obvaziště ${aid.toFixed(2)} mrtvých na stranu týdně`);
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
  assert.equal(b.longest[0].value, 29, 'dnešní den se počítá');
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
const quiet = (over = {}) => ({ ...theme, battle: { ...theme.battle, hit: 0, daily: { ...theme.battle.daily, min: 0 }, roles: { ...theme.battle.roles, default: { fire: 0 }, rifleman: { ...theme.battle.roles.rifleman, fire: 0 }, machinegunner: { ...theme.battle.roles.machinegunner, fire: 0 }, sniper: { ...theme.battle.roles.sniper, fire: 0 }, officer: { ...theme.battle.roles.officer, fire: 0 } }, ...over } });
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
  const cfg = quiet({ aidPost: { ...theme.battle.aidPost, beds: 2, stretchers: 1, critRisk: 0, stretchersPerMedic: 0 }, care: { ...theme.battle.care, crit: { ...theme.battle.care.crit, dieBase: 0 } } });
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

test('nastavení dává smysl: lůžko je vždy lepší než nosítka s plnou péčí, nemocnice lepší než obvaziště', () => {
  const b = theme.battle, C = b.care.crit, Hv = b.care.heavy;
  const dieStretcher = 1 - (1 - C.dieBase) ** C.stabilize; // kritický na nosítkách s 2 mediky, dokud se nezlepší
  const dieBed = (risk) => 1 - (1 - C.dieBase * risk) ** C.stabilizeBed;
  assert.ok(dieBed(b.aidPost.critRisk) < dieStretcher, `obvaziště ${dieBed(b.aidPost.critRisk)} vs nosítka ${dieStretcher}`);
  assert.ok(dieBed(b.buildings.dugout.critRisk) < dieBed(b.aidPost.critRisk), 'nemocnice < obvaziště');
  assert.ok(b.aidPost.care >= 1 && b.buildings.dugout.care >= b.aidPost.care, 'hojení na lůžku ≥ nosítka s plnou péčí');
  assert.ok(C.stabilizeBed <= C.stabilize);
  assert.ok(Hv.heal * b.aidPost.care <= 1);
});

test('ostrá čísla: střelci za běžného dne náhodou trefí nepřítele (ne každý, ale za 4 týdny se to stane na obou stranách)', () => {
  const s = emptyState(theme);
  enlist(s, 200, 'rnd_');
  s.soldiers.forEach((x) => { x.enlisted = 0; });
  let hits = 0, shots = 0;
  const byF = [0, 0];
  const shooters = new Set();
  for (let day = 30; day < 58; day++) {
    s.day = day;
    battleTick(s, theme, story, day); // výchozí vyvážení, nic nezvýšeno
    const st = s.battle.stats.at(-1);
    shots += st.sides[0].shots + st.sides[1].shots;
    st.sides.forEach((x, f) => { const n = Object.values(x.hits.fire).reduce((a, b) => a + b, 0); hits += n; byF[f] += n; });
    for (const x of s.soldiers) if (x.wound?.by && x.wound.day === day) shooters.add(x.wound.by.handle);
  }
  assert.ok(byF[0] > 0 && byF[1] > 0, `zásahy palbou Heg ${byF[0]}, Con ${byF[1]}`);
  assert.ok(hits < shots * 0.15, `trefa je náhoda: ${hits} zásahů z ${shots} výstřelů`);
  assert.ok(shooters.size > 1, `trefilo víc různých střelců (${shooters.size})`);
  // deterministické kostky: stejný den a stav = stejné zásahy
  const a = emptyState(theme), b = emptyState(theme);
  enlist(a, 200, 'det_'); enlist(b, 200, 'det_');
  [a, b].forEach((x) => { x.day = 30; x.soldiers.forEach((y) => { y.enlisted = 0; }); battleTick(x, theme, story, 30); });
  assert.deepEqual(a.soldiers.map((x) => x.wound?.by?.handle ?? null), b.soldiers.map((x) => x.wound?.by?.handle ?? null));
});

test('zásah → lůžko: těžce/kriticky zasažený palbou jde hned na lůžko (obvaziště i nemocnice), odtud se vrátí do linie', () => {
  for (const withDugout of [false, true]) {
    const s = emptyState(theme);
    enlist(s, 200, withDugout ? 'hd_' : 'ha_');
    s.soldiers.forEach((x) => { x.enlisted = 0; });
    if (withDugout) { build(s, theme, 0, 'dugout'); build(s, theme, 1, 'dugout'); }
    let patient = null;
    for (let day = 30; day < 90 && !patient; day++) {
      s.day = day;
      battleTick(s, theme, story, day);
      for (let f = 0; f < 2; f++) {
        const H = hospital(s, theme, f);
        const serious = s.soldiers.filter((x) => x.faction === f && x.status === 'wounded' && x.wound.sev !== 'light');
        // kdo není na lůžku, je tam jen proto, že jsou lůžka plná
        if (serious.some((x) => x.wound.place !== 'bed')) assert.equal(s.battle.sides[f].beds.length, H.beds, `den ${day}: volné lůžko a raněný mimo`);
        assert.ok(s.battle.sides[f].beds.length <= H.beds);
      }
      patient = s.soldiers.find((x) => x.wound?.by && x.wound.day === day && x.wound.sev !== 'light' && x.wound.place === 'bed');
    }
    assert.ok(patient, `${withDugout ? 'nemocnice' : 'obvaziště'}: zasažený palbou skončil na lůžku`);
    assert.ok(s.battle.sides[patient.faction].beds.includes(patient.id));
    assert.match(patient.record.at(-1)[1], /Shot by .+ \(@.+\)/);
    assert.ok(battlePublic(s, theme), 'web dostane data o lůžkách');
    // odtud: buď se uzdraví a vrátí do linie, nebo (kritický) zemře na lůžku; nikdy nezůstane viset
    const id = patient.id;
    for (let day = s.day + 1; day < s.day + 40; day++) {
      battleTick(s, theme, story, day);
      const p = s.soldiers.find((x) => x.id === id);
      if (!p || p.status !== 'wounded') break;
      assert.notEqual(p.wound.place, 'trench', 'z lůžka nikdo nevypadne do zákopu');
    }
    const p = s.soldiers.find((x) => x.id === id);
    assert.ok(!p || p.status !== 'wounded' || p.wound.sev === 'light', `po 40 dnech pořád na lůžku (${p?.wound?.sev})`);
  }
});

test('denní mez: za klidu 2–5 nově raněných na stranu (výslovná konfigurace), pod granáty víc, ale nejvýš shellMax', () => {
  // ostrá hra má od v12 max 99 (bez meze) a hlavním zdrojem ztrát je palba hráčů; logiku mezí zkoušíme bez palby a s dřívějšími čísly pozadí
  const cfgD = { ...theme, battle: { ...theme.battle, hit: 0.04, daily: { min: 2, max: 5, shellMax: 8, per: 80 }, roles: { ...theme.battle.roles, default: { fire: 0 }, rifleman: { ...theme.battle.roles.rifleman, fire: 0 }, machinegunner: { ...theme.battle.roles.machinegunner, fire: 0 }, sniper: { ...theme.battle.roles.sniper, fire: 0 }, officer: { ...theme.battle.roles.officer, fire: 0 } } } };
  const D = cfgD.battle.daily;
  const s = emptyState(theme);
  enlist(s, 160, 'dm_');
  s.soldiers.forEach((x) => { x.enlisted = 0; });
  for (let day = 30; day < 44; day++) {
    s.day = day;
    battleTick(s, cfgD, story, day);
    const st = s.battle.stats.at(-1);
    for (const f of [0, 1]) {
      const n = st.sides[f].sev.light + st.sides[f].sev.heavy + st.sides[f].sev.crit;
      assert.ok(n >= D.min, `den ${day}, strana ${f}: ${n} raněných (min ${D.min})`);
      assert.ok(n <= D.max, `den ${day}, strana ${f}: ${n} raněných (max ${D.max})`);
    }
  }
  // bombardování: bombardovaná strana nejvýš shellMax a v průměru víc než za klidu
  let sum = 0;
  for (let day = 50; day < 53; day++) {
    s.victories = [{ id: 'ridge', name: 'Verdel Ridge', faction: 0, day: 49, hero: 'dm_0', from: 50, to: 56, barrageTo: 52, counts: [80, 80] }];
    s.day = day;
    battleTick(s, cfgD, story, day);
    const a = s.battle.stats.at(-1).sides[1];
    const n = a.sev.light + a.sev.heavy + a.sev.crit;
    assert.ok(n <= D.shellMax, `pod granáty ${n} > ${D.shellMax}`);
    sum += n;
  }
  assert.ok(sum / 3 > D.max, `pod granáty v průměru ${sum / 3} za den`);
});

test('hlasování po frakcích: strana bez hlasů nic nepostaví (nemocnice nepřijde zadarmo)', () => {
  const s = emptyState(theme);
  enlist(s, 6, 'nv');
  openVote(s, { mediaId: 'mn', perFaction: true, question: 'Build?', options: [
    { kw: 'HOSPITAL', label: 'h', build: 'dugout', outcome: 'The {side} dug a hospital.' },
    { kw: 'WIRE', label: 'w', build: 'wire', outcome: 'The {side} ran new wire.' },
    { kw: 'SANDBAGS', label: 's', build: 'sandbags', outcome: 'The {side} raised sandbags.' },
  ] });
  applyComment(s, { id: 'y1', userId: 'nv1', username: 'nv1', text: 'wire!', mediaId: 'mn' }, theme, story, map); // Concord
  applyComment(s, { id: 'y2', userId: 'nv3', username: 'nv3', text: 'SANDBAGS', mediaId: 'mn' }, theme, story, map);
  applyComment(s, { id: 'y3', userId: 'nv5', username: 'nv5', text: 'sandbags please', mediaId: 'mn' }, theme, story, map);
  dailyTick(s, theme, story);
  const ev = s.events.at(-1);
  assert.deepEqual(ev.winners, [null, 'SANDBAGS']);
  assert.ok(!s.battle.sides[0].built.dugout, 'Hegemony nehlasovala, nic nedostala');
  assert.equal(s.battle.sides[1].built.sandbags, 1);
  assert.match(ev.text, /No word came back from the Hegemony/);
});

test('děla mlčí do první výhry v závodě: žádné texty o ostřelování, bombardování až po výhře', () => {
  const re = new RegExp(theme.battle.gunsWords, 'i');
  const s = emptyState(theme);
  enlist(s, 160, 'gs_');
  s.soldiers.forEach((x) => { x.enlisted = -10; });
  const len = new Map(s.soldiers.map((x) => [x.id, x.record.length]));
  for (let i = 0; i < 20; i++) dailyTick(s, theme, story);
  const fresh = s.soldiers.flatMap((x) => x.record.slice(len.get(x.id) ?? 0).map(([, t]) => t));
  const loud = fresh.filter((t) => re.test(t.replace(/more than shelling|shell fuses/g, ''))); // povahové rysy z minulých zim jsou v pořádku
  assert.equal(loud.length, 0, `texty s děly před výhrou: ${loud.slice(0, 3).join(' | ')}`);
  const gaz = JSON.stringify(s.chronicle.slice(-20).map((c) => ({ ...c, blocks: (c.blocks || []).filter((b) => b.kind !== 'expedition-call') }))); // popis odměn výprav není palba
  assert.ok(!re.test(gaz.replace(/shell holes?/gi, '')), 'Gazette bez ostřelování');
  assert.ok(s.battle.stats.slice(-20).every((x) => x.sides.every((a) => a.hits.shell === 0)));
  assert.ok(s.battle.stats.slice(-20).some((x) => x.sides.some((a) => a.hits.bg > 0)), 'zásahy z pozadí jsou dál (kulky, granáty)');
  // po výhře: děla se ozvou (texty i bombardování)
  s.victories = [{ id: 'ridge', name: 'Verdel Ridge', faction: 0, day: s.day, hero: 'gs_0', from: s.day + 1, to: s.day + 7, barrageTo: s.day + 3, counts: [100, 60] }];
  dailyTick(s, theme, story);
  assert.ok(s.battle.stats.at(-1).sides[1].hits.shell > 0, 'bombardování po výhře');
});

test('žebříčky: při shodě rozhoduje pořadí narukování, každá strana má vlastní top, nováček dne se počítá', () => {
  const s = emptyState(theme);
  enlist(s, 60, 'tie_'); // střídavě Hegemony / Concord
  s.day = 1;
  s.soldiers.forEach((x, i) => { x.enlisted = i < 4 ? 0 : 1; });
  s.soldiers.find((x) => x.handle === 'tie_2').handle = '_aaa_first_by_name'; // abecedně první, ale narukoval později než tie_0
  const b = leaderboards(s, theme);
  const heg = b.longest.filter((r) => r.faction === 0), con = b.longest.filter((r) => r.faction === 1);
  assert.equal(heg[0].handle, 'tie_0', 'první narukovaný je první, ne abecedně první');
  assert.equal(heg[1].handle, '_aaa_first_by_name');
  assert.equal(heg.length, 20, 'Hegemony má plný žebříček');
  assert.equal(con.length, 20, 'Concord taky (i ti, co narukovali dnes)');
  assert.equal(con.at(-1).value, 1);
});

test('web: obvaziště jsou vidět i před prvním tahem s bojem (stav se nemění)', () => {
  const s = emptyState(theme);
  enlist(s, 4, 'pre_');
  const pub = battlePublic(s, theme);
  assert.equal(pub.length, 2);
  assert.equal(pub[0].hospital.beds, 2);
  assert.deepEqual(pub[1].beds, []);
  assert.equal(s.battle, undefined, 'náhled stav neupravil');
});

test('výpravy vypnuté: žádná výzva, otevřená se zruší', () => {
  const s = emptyState(theme);
  enlist(s, 10, 'off_');
  s.valley = { holders: {}, contested: {}, next: 2, open: { id: 'x1-church-d2', loc: 'church', day: 2, closesDay: 3, volunteers: [] }, history: [], n: 1 };
  dailyTick(s, theme, story);
  assert.equal(s.valley.open, null);
  assert.ok(!JSON.stringify(s.chronicle.at(-1)).includes('Volunteers wanted'));
});

test('dopis domů: zmínka role v komentáři pod dopisovým postem roli nemění', async () => {
  const { theme, story } = await import('../tools/lib.mjs').then((m) => m.loadTheme());
  const map = (await import('../tools/lib.mjs')).loadMap(theme);
  const state = (await import('../tools/lib.mjs')).loadState(theme);
  const s = state.soldiers.find((x) => x.userId || x.id) || state.soldiers[0];
  const before = s.archetype;
  const role = theme.archetypes.find((a) => a.id !== before && a.id !== 'officer').id;
  const text = `The ${theme.archetypes.find((a) => a.id === role).name.toLowerCase()} dragged a man past our post last night and nobody slept after that.`;
  applyComment(state, { id: 'x1', text, username: s.handle, userId: s.id, mediaId: 'm', letter: true }, theme, story, map);
  assert.equal(s.archetype, before);
});

import { lateVote } from './roster.js';
test('hlasování: běžící se nepřepíše (nové počká), jednotné číslo hesla platí, hlas napsaný před otevřením se dopočítá', () => {
  const s = emptyState(theme);
  applyComment(s, { id: 'e1', userId: 'u1', username: 'anna', text: 'CONCORD' }, theme, story, map);
  applyComment(s, { id: 'e2', userId: 'u2', username: 'bert', text: 'HEGEMONY' }, theme, story, map);
  const opts = [{ kw: 'HOSPITAL', label: 'h', build: 'dugout' }, { kw: 'SANDBAGS', label: 's', build: 'sandbags' }];
  openVote(s, { mediaId: 'm1', perFaction: true, question: 'Build?', options: opts });
  // „Sandbag“ (jednotné číslo) i „hospitals“ se počítá
  assert.equal(applyComment(s, { id: 'v1', userId: 'u1', username: 'anna', text: 'Sandbag for us, prevention beats cure', mediaId: 'm1' }, theme, story, map)?.kw, 'SANDBAGS');
  // post s vlastním hlasováním vyjde, když ještě běží jiné: nepřepíše ho, počká
  const item = { id: 'win', published: { id: 'm2', at: '2026-11-11T10:00:00Z' }, vote: { question: 'After the ridge?', perFaction: true, options: [{ kw: 'FORTIFY', label: 'f' }, { kw: 'HOSPITAL', label: 'h' }] } };
  assert.equal(openItemVote(s, item), 'pending');
  assert.equal(s.vote.mediaId, 'm1');
  assert.equal(Object.keys(s.vote.tallies).length, 1, 'hlasy běžícího hlasování zůstaly');
  assert.ok(item.votePending);
  // komentář pod čekajícím postem se zatím nepočítá, ale zpracuje se (seen)
  assert.equal(applyComment(s, { id: 'v2', userId: 'u2', username: 'bert', text: 'fortify!', mediaId: 'm2' }, theme, story, map), null);
  s.vote = null; // denní tah běžící hlasování vyhodnotil
  assert.equal(openItemVote(s, item, '2026-11-11T13:05:00Z'), 'open');
  assert.equal(s.vote.mediaId, 'm2');
  assert.equal(s.vote.openedAt, '2026-11-11T13:05:00Z', 'lhůta běží od skutečného otevření');
  assert.ok(!item.votePending);
  // dříve napsaný hlas se dopočítá, ale jen jednou a nepřepíše novější
  assert.equal(lateVote(s, { id: 'v2', userId: 'u2', username: 'bert', text: 'fortify!', mediaId: 'm2' })?.kw, 'FORTIFY');
  assert.equal(lateVote(s, { id: 'v0', userId: 'u2', username: 'bert', text: 'hospital', mediaId: 'm2' }), null);
  assert.equal(lateVote(s, { id: 'v3', userId: 'u9', username: 'nobody', text: 'hospital', mediaId: 'm2' }), null, 'bez vojáka se nepočítá');
});

test('dopis domů: dlouhý dopis se jménem nepřítele nikoho nenarukuje, krátké heslo ano', () => {
  const s = emptyState(theme);
  const c = (id, u, text) => applyComment(s, { id, userId: u, username: u, text, mediaId: 'L', letter: true }, theme, story, map);
  assert.equal(c('l1', 'pen', 'Dear mother, the Hegemony guns have not stopped for three nights and we need a hospital.'), null);
  assert.equal(s.soldiers.length, 0);
  assert.equal(c('l2', 'pen', 'CONCORD')?.type, 'enlist');
  assert.equal(s.soldiers[0].faction, 1);
});

test('příběhy nezmiňují výpravy, když jsou vypnuté, ani kóty, o které se ještě nebojuje', async () => {
  const { storyFor } = await import('./roster.js');
  const s = emptyState(theme);
  const off = { ...theme, valley: { ...theme.valley, enabled: false } };
  const q = storyFor(s, off, story);
  const texts = JSON.stringify([q.daily, q.missing, q.enemy, q.arcs, q.enlist, q.background]);
  assert.ok(!/\braid/i.test(texts), 'text o výpravě prošel');
  assert.ok(q.places.includes(theme.race.objectives[0].name), 'dobývaná kóta v místech zůstává');
  for (const o of theme.race.objectives.slice(1)) assert.ok(!q.places.includes(o.name), `${o.name} je v místech předčasně`);
  // po dobytí první kóty se další odemkne; se zapnutými výpravami se texty vrátí
  const later = storyFor({ ...s, race: { idx: 1, base: [0, 0] }, victories: [{ id: 'ridge' }] }, { ...theme, valley: { ...theme.valley, enabled: true } }, story);
  assert.ok(later.places.includes(theme.race.objectives[1].name));
  assert.ok(/\braid/i.test(JSON.stringify(later.daily)));
});

test('titulek novin není každodenní rubrika (Across the wire, obvaziště)', () => {
  const s = emptyState(theme);
  for (let i = 0; i < 120; i++) applyComment(s, { id: `t${i}`, userId: `ut${i}`, username: `titulek${i}x`, text: i % 2 ? 'concord sniper' : 'hegemony sniper' }, theme, story, map);
  const titles = [];
  for (let d = 0; d < 12; d++) { dailyTick(s, theme, story); titles.push(s.chronicle.at(-1).title); }
  for (const t of titles) assert.ok(!/^(Across the wire|The aid posts|The hospitals|Hospitals and aid posts)$/.test(t), `titulek je rubrika: ${t}`);
  for (let i = 1; i < titles.length; i++) assert.notEqual(titles[i], titles[i - 1], `dva dny po sobě stejný titulek: ${titles[i]}`);
});

test('role škálují s počtem hráčů: účinek podle poměru (kulomet, spojař, kuchař, kaplan, velení), nikdy přes plný účinek', () => {
  const R = theme.battle.roles;
  for (const k of ['machinegunner', 'signaller', 'officer', 'runner', 'cook', 'chaplain']) assert.ok(R[k].covers > 0, `${k}.covers`);
  // 4 kulomety naproti 100 střelcům: jen část potlačení; další kulomet vždy přidá
  const mg = (n, crowd) => R.machinegunner.suppressMax * share(n, R.machinegunner.covers, crowd);
  assert.ok(mg(4, 100) < 0.1, `4 kulomety na 100 střelců: ${mg(4, 100)}`);
  assert.ok(mg(5, 100) > mg(4, 100), 'každý kulometčík navíc pomůže');
  assert.ok(mg(50, 10) <= R.machinegunner.suppressMax, 'nikdy víc než suppressMax');
  assert.equal(share(0, 4, 10), 0);
  assert.equal(share(3, 4, 6), 1);
});

test('denní meze rostou s velikostí strany (battle.daily.per; výslovná konfigurace)', () => {
  // ostrá hra má od v12 max 99 (bez meze) a hlavním zdrojem ztrát je palba hráčů; logiku mezí zkoušíme bez palby a s dřívějšími čísly pozadí
  const cfgD = { ...theme, battle: { ...theme.battle, hit: 0.04, daily: { min: 2, max: 5, shellMax: 8, per: 80 }, roles: { ...theme.battle.roles, default: { fire: 0 }, rifleman: { ...theme.battle.roles.rifleman, fire: 0 }, machinegunner: { ...theme.battle.roles.machinegunner, fire: 0 }, sniper: { ...theme.battle.roles.sniper, fire: 0 }, officer: { ...theme.battle.roles.officer, fire: 0 } } } };
  const D = cfgD.battle.daily;
  const s = emptyState(theme);
  enlist(s, D.per * 4, 'big_'); // 2× per na stranu
  s.soldiers.forEach((x) => { x.enlisted = 0; });
  let most = 0;
  for (let day = 30; day < 40; day++) {
    s.day = day;
    battleTick(s, cfgD, story, day);
    for (const f of [0, 1]) {
      const v = s.battle.stats.at(-1).sides[f].sev;
      const n = v.light + v.heavy + v.crit;
      assert.ok(n >= D.min * 2 && n <= D.max * 2, `den ${day}: ${n} raněných (mez ${D.min * 2}–${D.max * 2})`);
      most = Math.max(most, n);
    }
  }
  assert.ok(most > D.max, 'větší strana může mít víc raněných než malá');
});

test('v12: nosítka rostou s medici (aidPost.stretchersPerMedic), lůžka zůstávají pevná', () => {
  const s = setup(60, 'spm');
  const side = s.soldiers.filter((x) => x.faction === 0);
  const base = hospital(s, theme, 0);
  side.slice(0, 5).forEach((x) => { x.archetype = 'medic'; });
  const withMedics = hospital(s, theme, 0);
  assert.equal(withMedics.beds, base.beds, 'lůžka pevná');
  assert.equal(withMedics.stretchers, base.stretchers + 5 * theme.battle.aidPost.stretchersPerMedic, 'nosítka +1 za medika');
});

test('v12: triáž – kritický bez místa vezme lůžko těžce raněnému', () => {
  const s = setup(60, 'tri');
  const side = s.soldiers.filter((x) => x.faction === 0);
  const cfg = quiet({ aidPost: { ...theme.battle.aidPost, beds: 1, stretchers: 0, stretchersPerMedic: 0, critRisk: 0 }, care: { ...theme.battle.care, triage: 1, crit: { ...theme.battle.care.crit, dieBase: 0 } } });
  hurt(side[0], 'heavy', 19);
  battleTick(s, cfg, story, 19);
  assert.equal(side[0].wound.place, 'bed', 'těžký dostal lůžko');
  hurt(side[1], 'crit', 20);
  battleTick(s, cfg, story, 20);
  assert.equal(side[1].wound.place, 'bed', 'kritický vzal lůžko');
  assert.equal(side[0].wound.place, 'trench', 'těžký šel o stupeň níž');
  assert.equal(side[1].status, 'wounded', 'kritický na lůžku přežil noc');
});

test('v12: přímý zásah granátem (shell.kill) zabije na místě, lůžko ani medik nepomůže', () => {
  const s = emptyState(theme);
  enlist(s, 120, 'sk');
  s.day = 2;
  s.soldiers.forEach((x) => { x.enlisted = 0; });
  s.victories = [{ id: 'ridge', name: 'Verdel Ridge', faction: 0, day: 2, hero: 'sk0', from: 3, to: 9, barrageTo: 5, counts: [60, 60] }];
  const cfg = { ...theme, battle: { ...theme.battle, shell: { ...theme.battle.shell, hit: 1, kill: 1, severity: { light: 2, heavy: 2 } } } };
  battleTick(s, cfg, story, 3);
  const st = s.battle.stats.at(-1).sides[1];
  assert.ok(st.deaths.shell >= 1, `padlí přímým zásahem: ${st.deaths.shell}`);
  assert.ok(s.soldiers.some((x) => x.faction === 1 && x.status === 'fallen' && x.cause?.kind === 'shell'), 'příčina smrti shell');
  assert.ok(!s.soldiers.some((x) => x.faction === 0 && x.status === 'fallen'), 'vítěz granáty nedostává');
});

test('deník: každý voják má každý den právě jeden zápis, bez mezer (theme.storyShare = 1)', () => {
  const s = emptyState(theme);
  enlist(s, 80, 'dj');
  const born = new Map(s.soldiers.map((x) => [x.id, x.record.length]));
  for (let d = 0; d < 15; d++) dailyTick(s, theme, story);
  let checked = 0;
  for (const x of s.soldiers) {
    if (!born.has(x.id) || (x.generation || 1) > 1) continue; // nástupce padlého: smrt předchůdce a jeho příchod jsou dva různí lidé téhož rodu
    const days = x.record.map((r) => r[0]);
    assert.equal(new Set(days).size, days.length, `${x.handle}: víc zápisů za jeden den (${days.join(',')})`);
    for (let d = x.enlisted + 1; d <= s.day; d++) {
      assert.ok(days.includes(d), `${x.handle} (${x.status}) nemá zápis ze dne ${d}; má ${days.join(',')}`);
    }
    checked++;
  }
  assert.ok(checked > 40);
});

test('stav se ukládá po částech: state.json bez zápisů, zápisy po dávkách; načtení vrátí totéž a ztracenou dávku pozná', async () => {
  const os = await import('node:os'), path = await import('node:path');
  const { loadState, saveState, recordsDir } = await import('../tools/lib.mjs');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fronta-state-'));
  const f = path.join(dir, 'state.json');
  const s = emptyState(theme);
  enlist(s, 30, 'sp');
  for (let d = 0; d < 4; d++) dailyTick(s, theme, story);
  const ref = JSON.parse(JSON.stringify(s)); // stav tak, jak ho vrátí JSON (bez undefined)
  // bez SPLIT_STATE a bez složky dávek se ukládá po staru (zápisy ve state.json): starší smyčka dávky nepřidává do gitu
  delete process.env.SPLIT_STATE;
  saveState(s, f);
  assert.ok(JSON.parse(fs.readFileSync(f, 'utf8')).soldiers.every((x) => Array.isArray(x.record)), 'výchozí = starý formát');
  assert.ok(!fs.existsSync(recordsDir(f)), 'složka dávek nevznikla');
  process.env.SPLIT_STATE = '1';
  saveState(s, f);
  const slim = JSON.parse(fs.readFileSync(f, 'utf8'));
  assert.ok(slim.soldiers.every((x) => x.record === undefined && x.recN > 0), 'state.json nemá zápisy, jen jejich počet');
  assert.ok(fs.statSync(f).size < JSON.stringify(s).length, 'state.json je menší');
  assert.deepEqual(loadState(theme, f), ref, 'načtení vrátí totéž');
  // starý formát (zápisy přímo ve state.json) se načte a při uložení převede
  fs.writeFileSync(f, JSON.stringify(s));
  assert.deepEqual(loadState(theme, f), ref);
  saveState(loadState(theme, f), f);
  assert.deepEqual(loadState(theme, f), ref);
  // pojistka: ztracená dávka zápisů shodí načtení, deník se neuloží zkrácený
  const shards = fs.readdirSync(recordsDir(f)).filter((n) => fs.readFileSync(path.join(recordsDir(f), n), 'utf8') !== '{}');
  fs.writeFileSync(path.join(recordsDir(f), shards[0]), '{}');
  assert.throws(() => loadState(theme, f), /nenačetly celé/);
  delete process.env.SPLIT_STATE;
});

test('web: počet dávek se zápisy roste s vojáky (~25 na dávku), roster ho udává a karta má v dávce jen posledních 10 zápisů', async () => {
  const { shardCount, buildPublic } = await import('./roster.js');
  assert.equal(shardCount(100), 64);
  assert.equal(shardCount(5000), 200);
  assert.equal(shardCount(50000), 400, 'strop 400 dávek');
  const s = emptyState(theme);
  enlist(s, 20, 'sh');
  s.soldiers[0].record = Array.from({ length: 30 }, (_, i) => [i, `e${i}`]);
  const pub = buildPublic(s, theme);
  assert.equal(pub.roster.shards, 64);
  const card = pub.shards.flatMap((x) => Object.entries(x)).find(([h]) => h === s.soldiers[0].handle)[1];
  assert.equal(card.record.length, 10);
  assert.equal(card.older, 20);
});
