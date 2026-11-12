// Stáhne nové komentáře pod našimi posty (Instagram API s Instagram Login, Standard Access = vlastní účet),
// narukuje vojáky, spáruje kódy pro převzetí, volitelně pošle soukromou odpověď a přegeneruje statická data webu.
//
// Proměnné prostředí:
//   IG_ACCESS_TOKEN   systémový token z firemního portfolia (instagram_basic, instagram_manage_comments, instagram_content_publish[, _manage_messages])
//   IG_USER_ID        ID IG účtu (Business Suite → Nastavení → Instagramové účty), @mudandiron = 17841437072520448
//   IG_MEDIA_IDS      čárkou oddělená ID postů, které se hlídají vždy (připnutý náborový Reel); k nim posledních IG_RECENT (5)
//   IG_REPLY=1        odpovědět veřejně pod komentář nového rekruta (šablony theme.replies)
//   IG_SEND_DM=1      poslat Private Reply novým rekrutům
//   SITE_URL          adresa webu pro odkaz v DM
//   FIREBASE_SERVICE_ACCOUNT  JSON service accountu (pro párování převzetí přes Firestore), volitelné
//   DRY_RUN=1         nic neukládat
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, loadTheme, loadMap, loadState, saveState, writePublic } from '../tools/lib.mjs';
import { switchFaction, lateVote, applyComment, parseComment, requestTransfer, applyTransfers, parseRole, wishRole, roleReply, findOwnSoldier, TAKEN } from '../engine/roster.js';
import { volunteer, raidReply } from '../engine/valley.js';
import { deathReply } from '../engine/house.js';

// Nové aplikace Meta: Unified login + systémový token z firemního portfolia → graph.facebook.com (token nevyprší).
// Starší token z „Instagram login“ funguje s IG_API_HOST=graph.instagram.com.
const API = `https://${process.env.IG_API_HOST || 'graph.facebook.com'}/${process.env.IG_API_VERSION || 'v23.0'}`;
const TOKEN = process.env.IG_ACCESS_TOKEN;
const USER = process.env.IG_USER_ID;

async function ig(path, params = {}) {
  const url = new URL(path.startsWith('http') ? path : `${API}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  if (!url.searchParams.has('access_token')) url.searchParams.set('access_token', TOKEN);
  const r = await fetch(url);
  const j = await r.json();
  if (j.error) throw new Error(`IG ${path}: ${j.error.message}`);
  return j;
}

// Odpovědi, které už odešly (kolo smyčky se může opakovat; nesmí odpovědět dvakrát)
const REPLIED = process.env.REPLIED_LOG;
const replied = new Set(REPLIED && fs.existsSync(REPLIED) ? fs.readFileSync(REPLIED, 'utf8').split(/\r?\n/).filter(Boolean) : []);
// c = komentář z comments(); odpověď na odpověď jde do vlákna nadřazeného komentáře (IG má jen jednu úroveň).
// key: jiný klíč než ID komentáře, když pod jeden komentář smí přijít druhá odpověď (dodatečně splněná role)
async function replyOnce(c, message, key = c.id) {
  if (replied.has(key)) return;
  await igPost(`${c.replyTo || c.id}/replies`, { message });
  replied.add(key);
  if (REPLIED) fs.appendFileSync(REPLIED, `${key}\n`);
}

async function igPost(path, body) {
  const r = await fetch(`${API}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (j.error) throw new Error(`IG POST ${path}: ${j.error.message}`);
  return j;
}

// připnuté posty (IG_MEDIA_IDS) + nejnovější posty; připnutý Reel by jinak časem vypadl z „posledních 5“
// Sledujeme VŠECHNY posty (až IG_SCAN, výchozí 100 nejnovějších), ale komentáře stahujeme jen tam, kde se od minula
// změnil počet komentářů (comments_count přijde se seznamem postů zadarmo) → pár dotazů na kolo i se stovkou postů.
// Připnuté (IG_MEDIA_IDS) a IG_RECENT nejnovějších se stahují vždy (pojistka: smazaný + nový komentář = stejný počet).
// Vrací [{ id, count }]; počet se uloží do state.mediaCounts až po zpracování postu (chyba = zkusí se znovu).
async function mediaToPoll(state) {
  const pinned = (process.env.IG_MEDIA_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const scan = Number(process.env.IG_SCAN || 100), recent = Number(process.env.IG_RECENT || 5);
  const known = (state.mediaCounts ||= {});
  const out = new Map(pinned.map((id) => [id, undefined]));
  let page = await ig(`${USER}/media`, { fields: 'id,comments_count', limit: Math.min(scan, 100) });
  let n = 0;
  for (;;) {
    for (const m of page.data || []) {
      if (n < recent || known[m.id] !== m.comments_count || out.has(m.id)) out.set(m.id, m.comments_count);
      n++;
    }
    if (n >= scan || !page.paging?.next) break;
    page = await ig(page.paging.next);
  }
  return [...out].map(([id, count]) => ({ id, count }));
}

// Komentáře i ODPOVĚDI pod nimi (hráči často píšou HEGEMONY jako odpověď pod cizí komentář).
// Komentáře našeho účtu se přeskakují: odpovědi bota obsahují hesla frakcí a bot by narukoval sám sebe.
// full = projít všechny stránky (změnil se počet komentářů: nová odpověď může být i pod starým komentářem).
let OWN = { id: USER, username: null };
const C_FIELDS = 'id,text,username,timestamp,from,like_count';
async function* comments(mediaId, seen, full = true) {
  const name = (c) => (c.username || c.from?.username || '').toLowerCase();
  const own = (c) => (c.from?.id && c.from.id === OWN.id) || (OWN.username && name(c) === OWN.username);
  const item = (c, parent = null) => ({ id: c.id, text: c.text, username: c.username || c.from?.username, userId: c.from?.id, timestamp: c.timestamp, likes: c.like_count ?? 0, mediaId, parentId: parent, replyTo: parent || c.id });
  let page = await ig(`${mediaId}/comments`, { fields: `${C_FIELDS},replies.limit(50){${C_FIELDS}}`, limit: 50 });
  for (;;) {
    let allSeen = true;
    for (const c of page.data || []) {
      if (!seen.has(c.id)) allSeen = false;
      if (!own(c)) yield item(c);
      let rp = c.replies;
      while (rp) {
        for (const x of rp.data || []) {
          if (!seen.has(x.id)) allSeen = false;
          if (!own(x)) yield item(x, c.id);
        }
        rp = rp.paging?.next ? await ig(rp.paging.next) : null;
      }
    }
    // komentáře chodí od nejnovějších: když je celá stránka známá a počet se nezměnil, dál nemá smysl
    if (!page.paging?.next || (allSeen && !full)) break;
    page = await ig(page.paging.next);
  }
}

// Firestore (převzetí vojáků přes Google) se používá až po zapnutí: variable FIRESTORE=1
async function firestore() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIRESTORE !== '1') return null;
  const { initializeApp, cert } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  return getFirestore();
}

async function main() {
  if (!TOKEN || !USER) {
    console.log('IG_ACCESS_TOKEN / IG_USER_ID chybí: nic se nestahuje.');
    return;
  }
  const { theme, story } = loadTheme();
  const map = loadMap(theme);
  const state = loadState(theme);
  const seen = new Set(state.seenComments);
  // ruční zrušení běžícího hlasování (např. smazaný post): data/cancel-vote.json { "mediaId": "…" } (jednou, pak se soubor ignoruje)
  try {
    const cv = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'cancel-vote.json'), 'utf8'));
    if (state.vote && state.vote.mediaId === cv.mediaId) { console.log(`✖ hlasování ${cv.mediaId} zrušeno: ${state.vote.question}`); state.vote = null; }
  } catch { /* soubor není */ }
  // ruční příkazy (data/commands.json): { id, cmd: 'switchFaction', handle, faction }; každý se provede jednou (state.commandsDone)
  try {
    const cmds = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'commands.json'), 'utf8'));
    state.commandsDone ??= [];
    for (const c of cmds) {
      if (state.commandsDone.includes(c.id)) continue;
      if (c.cmd === 'switchFaction') {
        const r = switchFaction(state, theme, map, c.handle, c.faction);
        console.log(r ? `⇄ @${r.handle}: ${r.from} → ${r.to}, ${r.unit}, ${r.sector}` : `⇄ příkaz ${c.id}: nic se nezměnilo`);
      }
      state.commandsDone.push(c.id);
    }
  } catch { /* žádné příkazy */ }
  const db = await firestore();
  let enlisted = 0, claimed = 0;

  try {
    const prof = await ig(USER, { fields: 'followers_count,username' });
    OWN = { id: USER, username: prof.username?.toLowerCase() || null };
    state.followers = prof.followers_count ?? state.followers;
  } catch (e) {
    console.warn(e.message);
  }

  const posts = await mediaToPoll(state);
  console.log(`posty ke kontrole: ${posts.length}`);
  // hlasy fronty: delší komentáře pod hlasováním (proč chtějí nemocnici…) a pod dopisovým postem do data/voices.json, pro reely a výběr nejlepších
  const VOICES = path.join(ROOT, 'data', 'voices.json');
  const voices = fs.existsSync(VOICES) ? JSON.parse(fs.readFileSync(VOICES, 'utf8')) : {};
  voices.posts ??= {};
  // + posty z fronty s `voices: true` (např. „Letters from the front“: dopisy domů do komentářů)
  const queue = JSON.parse(fs.readFileSync(path.join(ROOT, 'marketing', 'queue.json'), 'utf8'));
  const letterMedia = (queue.items || []).filter((i) => i.voices && i.published?.id).map((i) => i.published.id);
  const councilMedia = (queue.items || []).filter((i) => i.council && i.published?.id).map((i) => i.published.id); // „Rada fronty“: nápady hráčů, vyhrává nejvíc lajků (tools/council.mjs)
  const voteMedia = new Set([state.vote?.mediaId, ...(state.events || []).filter((e) => e.perFaction && e.day >= state.day - 2).map((e) => e.mediaId), ...letterMedia].filter(Boolean));
  for (const mid of voteMedia) if (!posts.some((p) => p.id === mid)) posts.push({ id: mid, count: undefined }); // hlasování projít vždy
  // hesla všech hlasování (běžící, nedávná i čekající ve frontě), ne napevno v kódu
  const voiceKws = [...new Set([...(state.vote?.options || []), ...(queue.items || []).flatMap((i) => i.vote?.options || [])].map((o) => o.kw))];
  let voicesDirty = false;
  const keepVoice = (c, mid) => {
    const text = (c.text || '').trim();
    const list = (voices.posts[mid] ??= []);
    const old = list.find((v) => v.id === c.id);
    if (old) { if (c.likes != null && old.likes !== c.likes) { old.likes = c.likes; voicesDirty = true; } return; } // počty lajků se obnovují při každém průchodu
    if (text.split(/\s+/).length < (councilMedia.includes(mid) ? 2 : 6)) return; // jen heslo nebo pár slov: to není zdůvodnění (v radě fronty stačí nápad o dvou slovech)
    const s = state.soldiers.find((x) => x.id === c.userId) || state.soldiers.find((x) => x.handle === (c.username || '').toLowerCase());
    const kw = voiceKws.find((k) => new RegExp(`\\b${k.replace(/S$/, '')}S?\\b`).test(text.toUpperCase())) || null;
    list.push({ id: c.id, handle: c.username, faction: s?.faction ?? null, kw, text: text.slice(0, 800), at: c.timestamp, likes: c.likes ?? 0, reply: !!c.parentId });
    voicesDirty = true;
  };
  for (const { id: mid, count } of posts) {
    const fullVote = voteMedia.has(mid) && !voices.scanned?.[mid]; // první průchod hlasováním: projít i už viděné komentáře
    // běžící hlasování: jednou projít i už zpracované komentáře (hlasy napsané před otevřením nebo jiným tvarem hesla)
    const recount = state.vote?.mediaId === mid && state.vote.perFaction && state.vote.recounted !== 1;
    const changed = count === undefined || state.mediaCounts?.[mid] !== count || fullVote || recount;
    for await (const c of comments(mid, seen, changed)) {
      if (voteMedia.has(mid)) keepVoice(c, mid);
      if (letterMedia.includes(mid)) c.letter = true;
      if (recount && seen.has(c.id)) { const lv = lateVote(state, c); if (lv) console.log(`☑ dodatečný hlas @${lv.handle}: ${lv.kw}`); }
      // náborový komentář starších vojáků (před uložením s.reply): pod něj bot odpoví při smrti
      if (seen.has(c.id) && c.userId) {
        const own = state.soldiers.find((s) => s.id === c.userId);
        if (own && !own.reply && parseComment(c.text, theme)?.type === 'enlist') own.reply = c.replyTo || c.id;
      }
      const res = applyComment(state, c, theme, story, map);
      if (!res) continue;
      // přihláška na výpravu (heslo místa v komentáři), i u nováčka, který tím zároveň narukoval
      const raid = res.type === 'volunteer' ? res : res.raid;
      if (raid) {
        const s = res.soldier;
        console.log(`⚑ výprava @${s.handle}: ${raid.reason}`);
        const text = raidReply(state, theme, s, raid.reason);
        if (text && process.env.IG_REPLY === '1' && !process.env.DRY_RUN && res.type === 'volunteer') {
          await replyOnce(c, text).catch((e) => console.warn(e.message));
        }
      }
      if (res.type === 'role' || res.roleWish) {
        const w = res.type === 'role' ? res : res.roleWish;
        console.log(`⚒ role @${res.soldier.handle} → ${w.role}: ${w.reason}`);
        const text = res.type === 'role' && roleReply(theme, res.soldier, w.role, w.reason);
        if (text && process.env.IG_REPLY === '1' && !process.env.DRY_RUN) await replyOnce(c, text).catch((e) => console.warn(e.message));
      }
      // hlas frakce (hlasování po vítězství v závodě): potvrzení pod komentář
      if (res.type === 'vote' && (res.faction != null || res.reason === 'notEnlisted')) {
        console.log(`☑ hlas @${res.handle}: ${res.kw}${res.reason ? ` (${res.reason})` : ` za ${theme.factions[res.faction].name}`}`);
        const side = res.faction != null && theme.factions[res.faction].name;
        const text = res.reason === 'otherSide'
          ? `@${res.handle} ${res.kw} is an order of the other side. Your side chooses: ${res.options.join(', ')}. Comment one of those.`
          : res.reason === 'notEnlisted'
          ? `@${res.handle} Only soldiers vote on orders. Comment ${theme.factions.map((f) => f.keyword).join(' or ')} together with ${res.kw} and you'll enlist and vote at once.`
          : `@${res.handle} Vote counted: ${res.kw} for ${side}. Orders are read out in the next Trench Gazette (13:00 UTC). Your last comment counts.`;
        if (process.env.IG_REPLY === '1' && !process.env.DRY_RUN) await replyOnce(c, text).catch((e) => console.warn(e.message));
      }
      if (res.type === 'enlist') {
        enlisted++;
        if (res.vote) console.log(`☑ hlas @${res.soldier.handle}: ${res.vote.kw} (při narukování)`);
        console.log(`+ @${res.soldier.handle} → ${theme.factions[res.soldier.faction].name}, ${res.soldier.sector}`);
        if (res.victory) console.log(`★ ${theme.factions[res.victory.faction].name} dobyli ${res.victory.name} (rozhodl @${res.victory.hero})`);
        if (process.env.IG_REPLY === '1' && !process.env.DRY_RUN && theme.replies) {
          const s = res.soldier;
          const pool = theme.replies[theme.factions[s.faction].id] || theme.replies.any;
          let text = pool[Math.floor(Math.random() * pool.length)].replace('{handle}', s.handle).replace('{sector}', s.sector).replace('{rank}', theme.ranks[s.rank]);
          const rw = res.roleWish;
          const role = theme.archetypes.find((a) => a.id === s.archetype).name;
          const extra = rw?.reason === 'granted' || rw?.reason === 'same' ? ` Role: ${role}, as you asked.` : rw?.reason === 'officer' ? ` Lieutenants are made by promotion only, so you start as ${role}.` : '';
          text += extra;
          if (res.vote) text += ` Your vote for ${res.vote.kw} is counted.`;
          // selže-li odeslání (limit IG, výpadek), komentář je už „viděný“ a voják narukoval: odpověď se zkusí znovu v dalších kolech
          await replyOnce(c, text).catch((e) => { console.warn(e.message); s.replyPending = { to: c.replyTo || c.id, text, tries: 1, day: state.day }; });
        }
        if (process.env.IG_SEND_DM === '1' && !process.env.DRY_RUN) {
          const s = res.soldier;
          const text = theme.dm.enlisted
            .replace('{rank}', theme.ranks[s.rank])
            .replace('{handle}', s.handle)
            .replace('{unit}', s.unit)
            .replace('{sector}', s.sector)
            .replace('{url}', `${process.env.SITE_URL || ''}/?s=${encodeURIComponent(s.handle)}`);
          await igPost(`${USER}/messages`, { recipient: { comment_id: c.id }, message: { text } }).catch((e) => console.warn(e.message));
        }
      } else if (res.type === 'claim' && db && !res.soldier) {
        // kód od někoho, kdo ještě nenarukoval
        console.log(`✗ claim @${res.handle}: nenarukovaný`);
        if (process.env.IG_REPLY === '1' && !process.env.DRY_RUN) {
          await replyOnce(c, `@${res.handle}, you need a soldier first. Comment ${theme.factions.map((f) => f.keyword).join(' or ')} to enlist, then send your claim code again.`).catch((e) => console.warn(e.message));
        }
      } else if (res.type === 'claim' && db && res.soldier) {
        // i už potvrzené (status done): opakované kolo smyčky musí převzetí zapsat znovu
        const q = await db.collection('claims').where('code', '==', res.code).limit(1).get();
        const doc = q.docs[0];
        const valid = doc && doc.get('handle') === res.handle && ['pending', 'done'].includes(doc.get('status'));
        if (!valid && !res.soldier.claimed) {
          // starý (přepsaný) kód nebo kód z cizí karty
          console.log(`✗ claim @${res.handle}: neplatný kód ${res.code}`);
          if (process.env.IG_REPLY === '1' && !process.env.DRY_RUN) {
            await replyOnce(c, `@${res.handle}, that code isn't valid. Open your own soldier's card (link in bio), tap claim and comment the code shown there.`).catch((e) => console.warn(e.message));
          }
        }
        if (valid && !res.soldier.claimed) {
          res.soldier.claimed = true;
          res.soldier.ownerUid = doc.get('uid');
          if (doc.get('status') !== 'done') await doc.ref.update({ status: 'done', verifiedAt: new Date() });
          claimed++;
          console.log(`✓ claim @${res.handle}`);
          if (process.env.IG_REPLY === '1' && !process.env.DRY_RUN) {
            await replyOnce(c, `✓ @${res.handle}, ${res.soldier.name} is now yours. Your claim is confirmed, soldier. Open your card on the front (link in bio) to request a transfer to another role.`).catch((e) => console.warn(e.message));
          }
        }
      }
    }
    // post zpracován: zapamatovat počet komentářů (příště se stáhne jen při změně)
    if (count !== undefined) state.mediaCounts[mid] = count;
  }

  // opakování odpovědí novým rekrutům, které se napoprvé nepodařilo odeslat (max. 12 pokusů, jen 2 dny)
  if (process.env.IG_REPLY === '1' && !process.env.DRY_RUN) {
    for (const s of state.soldiers) {
      const p = s.replyPending;
      if (!p) continue;
      if (p.tries >= 12 || state.day - p.day > 2) { delete s.replyPending; continue; }
      try {
        await replyOnce({ id: p.to, replyTo: p.to }, p.text, `pending:${s.id}`);
        console.log(`↻ odpověď odeslána dodatečně @${s.handle}`);
        delete s.replyPending;
      } catch (e) { console.warn(e.message); p.tries++; }
    }
  }

  // oznámení o smrti: odpověď pod náborový komentář hráče („tvůj voják padl, nastoupil …“). Jen s IG_DEATH_NOTICE=1.
  if (state.notices?.length && process.env.IG_REPLY === '1' && process.env.IG_DEATH_NOTICE === '1' && !process.env.DRY_RUN) {
    const left = [];
    for (const n of state.notices) {
      const s = state.soldiers.find((x) => x.handle === n.handle);
      if (n.kind !== 'death' || !s?.reply || state.day - n.day > 2) continue; // bez náborového komentáře není kam odpovědět; stará oznámení se neposílají
      try {
        await replyOnce({ id: s.reply, replyTo: s.reply }, deathReply(n, theme, process.env.SITE_URL), `death:${n.handle}:${n.gen}`);
        console.log(`✝ oznámení @${n.handle}: ${n.prev} → ${n.heir}`);
      } catch (e) {
        console.warn(e.message);
        if ((n.tries = (n.tries || 0) + 1) < 3) left.push(n);
      }
    }
    state.notices = left;
  } else if (state.notices?.length > 200) state.notices = state.notices.slice(-200);

  // jednorázově: přání rolí ze starších (už zpracovaných) komentářů, od nejstarších; první přání platí
  // verze 2 = znovu s volnějším pravidlem (bez slov „want/be“); už přidělené role se nemění, odpovědi se neopakují
  if ((state.roleBackfillV || 0) < 3) try {
    const all = [];
    let page = await ig(`${USER}/media`, { fields: 'id', limit: 100 });
    for (;;) {
      for (const m of page.data || []) for await (const c of comments(m.id, new Set())) if (seen.has(c.id)) all.push(c);
      if (!page.paging?.next) break;
      page = await ig(page.paging.next);
    }
    all.sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
    let granted = 0;
    for (const c of all) {
      const role = parseRole(c.text, theme);
      const s = role && findOwnSoldier(state, c.userId, (c.username || '').toLowerCase());
      if (!s || s === TAKEN) continue;
      const reason = wishRole(state, s, role, theme, story);
      // v3: i těm, kterým role padla v minulém průchodu a odpověď se kvůli chybě klíče neposlala
      if (reason !== 'granted' && !(reason === 'same' && s.roleWish === role)) continue;
      granted++;
      console.log(`⚒ role (zpětně) @${s.handle} → ${role}`);
      if (process.env.IG_REPLY === '1' && !process.env.DRY_RUN) await replyOnce(c, roleReply(theme, s, role, 'granted'), `${c.id}:role`).catch((e) => console.warn(e.message));
    }
    console.log(`přání rolí zpětně: ${all.length} komentářů, splněno ${granted}`);
    state.roleBackfill = new Date().toISOString();
    state.roleBackfillV = 3;
  } catch (e) {
    console.warn('role backfill:', e.message);
  }

  // úpravy karet od převzatých hráčů (bio, zájmena, převelení) z Firestore
  if (db) try {
    const owners = new Map(state.soldiers.filter((s) => s.ownerUid).map((s) => [s.ownerUid, s]));
    const since = new Date(state.profilesSyncedAt || 0);
    const snap = await db.collection('profiles').where('updatedAt', '>', since).get();
    for (const d of snap.docs) {
      const s = owners.get(d.id);
      if (!s) continue;
      const p = d.data();
      if (typeof p.bio === 'string') s.bio = p.bio.slice(0, 280);
      if (['he', 'she', 'they'].includes(p.pronoun)) s.pronoun = p.pronoun;
      if (typeof p.role === 'string' && requestTransfer(state, s, p.role, theme)) console.log(`žádost o převelení @${s.handle} → ${p.role}`);
      // dobrovolník na výpravu z webu (tlačítko Volunteer), platí jen pro právě otevřenou výpravu
      if (typeof p.volunteer === 'string' && p.volunteer === state.valley?.open?.id) console.log(`⚑ výprava (web) @${s.handle}: ${volunteer(state, theme, s, 'web').reason}`);
    }
    state.profilesSyncedAt = new Date().toISOString();
  } catch (e) {
    console.warn('Firestore:', e.message);
  }
  for (const s of applyTransfers(state, theme, story)) console.log(`⇄ @${s.handle} převelen: ${s.archetype}`);

  for (const mid of voteMedia) if (posts.some((p) => p.id === mid)) { (voices.scanned ??= {})[mid] = true; voicesDirty = true; }
  if (state.vote?.perFaction && posts.some((p) => p.id === state.vote.mediaId)) state.vote.recounted = 1;
  if (voicesDirty && !process.env.DRY_RUN) fs.writeFileSync(VOICES, JSON.stringify(voices, null, 1) + '\n');
  console.log(`hlasy fronty: ${Object.values(voices.posts).reduce((a, l) => a + l.length, 0)} delších komentářů pod hlasováním`);
  console.log(`hotovo: +${enlisted} rekrutů, ${claimed} převzetí, celkem ${state.soldiers.length}, followers ${state.followers}`);
  if (process.env.DRY_RUN) return;
  saveState(state);
  writePublic(state, theme);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
