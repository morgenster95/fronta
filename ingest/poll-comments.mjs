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
import { loadTheme, loadMap, loadState, saveState, writePublic } from '../tools/lib.mjs';
import { applyComment, requestTransfer, applyTransfers } from '../engine/roster.js';
import { volunteer, raidReply } from '../engine/valley.js';

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
async function replyOnce(commentId, message) {
  if (replied.has(commentId)) return;
  await igPost(`${commentId}/replies`, { message });
  replied.add(commentId);
  if (REPLIED) fs.appendFileSync(REPLIED, `${commentId}\n`);
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
async function mediaIds() {
  const pinned = (process.env.IG_MEDIA_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const j = await ig(`${USER}/media`, { fields: 'id,timestamp', limit: process.env.IG_RECENT || 5 });
  return [...new Set([...pinned, ...j.data.map((m) => m.id)])];
}

async function* comments(mediaId, seen) {
  let next = null;
  let page = await ig(`${mediaId}/comments`, { fields: 'id,text,username,timestamp,from', limit: 50 });
  for (;;) {
    let allSeen = true;
    for (const c of page.data || []) {
      if (!seen.has(c.id)) allSeen = false;
      yield { id: c.id, text: c.text, username: c.username || c.from?.username, userId: c.from?.id, timestamp: c.timestamp, mediaId };
    }
    next = page.paging?.next;
    // komentáře chodí od nejnovějších: když je celá stránka známá, dál nemá smysl
    if (!next || allSeen) break;
    page = await ig(next);
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
  const db = await firestore();
  let enlisted = 0, claimed = 0;

  try {
    const prof = await ig(USER, { fields: 'followers_count,username' });
    state.followers = prof.followers_count ?? state.followers;
  } catch (e) {
    console.warn(e.message);
  }

  for (const mid of await mediaIds()) {
    for await (const c of comments(mid, seen)) {
      const res = applyComment(state, c, theme, story, map);
      if (!res) continue;
      // přihláška na výpravu (heslo místa v komentáři), i u nováčka, který tím zároveň narukoval
      const raid = res.type === 'volunteer' ? res : res.raid;
      if (raid) {
        const s = res.soldier;
        console.log(`⚑ výprava @${s.handle}: ${raid.reason}`);
        const text = raidReply(state, theme, s, raid.reason);
        if (text && process.env.IG_REPLY === '1' && !process.env.DRY_RUN && res.type === 'volunteer') {
          await replyOnce(c.id, text).catch((e) => console.warn(e.message));
        }
      }
      if (res.type === 'enlist') {
        enlisted++;
        console.log(`+ @${res.soldier.handle} → ${theme.factions[res.soldier.faction].name}, ${res.soldier.sector}`);
        if (res.victory) console.log(`★ ${theme.factions[res.victory.faction].name} dobyli ${res.victory.name} (rozhodl @${res.victory.hero})`);
        if (process.env.IG_REPLY === '1' && !process.env.DRY_RUN && theme.replies) {
          const s = res.soldier;
          const pool = theme.replies[theme.factions[s.faction].id] || theme.replies.any;
          const text = pool[Math.floor(Math.random() * pool.length)].replace('{handle}', s.handle).replace('{sector}', s.sector).replace('{rank}', theme.ranks[s.rank]);
          await replyOnce(c.id, text).catch((e) => console.warn(e.message));
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
      } else if (res.type === 'claim' && db && res.soldier) {
        // i už potvrzené (status done): opakované kolo smyčky musí převzetí zapsat znovu
        const q = await db.collection('claims').where('code', '==', res.code).limit(1).get();
        const doc = q.docs[0];
        if (doc && doc.get('handle') === res.handle && ['pending', 'done'].includes(doc.get('status')) && !res.soldier.claimed) {
          res.soldier.claimed = true;
          res.soldier.ownerUid = doc.get('uid');
          if (doc.get('status') !== 'done') await doc.ref.update({ status: 'done', verifiedAt: new Date() });
          claimed++;
          console.log(`✓ claim @${res.handle}`);
          if (process.env.IG_REPLY === '1' && !process.env.DRY_RUN) {
            await replyOnce(c.id, `✓ @${res.handle}, ${res.soldier.name} is now yours. Your claim is confirmed, soldier. Open your card on the front (link in bio) to request a transfer to another role.`).catch((e) => console.warn(e.message));
          }
        }
      }
    }
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

  console.log(`hotovo: +${enlisted} rekrutů, ${claimed} převzetí, celkem ${state.soldiers.length}, followers ${state.followers}`);
  if (process.env.DRY_RUN) return;
  saveState(state);
  writePublic(state, theme);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
