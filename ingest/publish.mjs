// Publikování na Instagram (Content Publishing API, systémový token): fronta příspěvků v marketing/queue.json.
// Soubory leží v marketing/promo/ a po pushi je workflow media.yml vystaví na GitHub Pages (zdarma, mimo Firebase Hosting):
// https://morgenster95.github.io/fronta/<soubor>. Odtud si je Instagram stáhne.
//
// Použití: node ingest/publish.mjs <id> [<id> …]   zveřejní dané položky hned
//          node ingest/publish.mjs --due           zveřejní položky, jejichž publishAt už nastal (pro smyčku),
//                                                  a položky s `trigger`, jejichž událost ve hře nastala (ingest/triggers.mjs)
// Když soubor ještě není na GitHub Pages (workflow media ještě neproběhl), položka počká a zkusí se v dalším kole.
// Proměnné: IG_ACCESS_TOKEN, IG_USER_ID, MEDIA_URL (výchozí https://morgenster95.github.io/fronta), DRY_RUN=1
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, loadTheme, loadState, saveState } from '../tools/lib.mjs';
import { fireTriggers, openItemVote } from './triggers.mjs';

const API = `https://${process.env.IG_API_HOST || 'graph.facebook.com'}/${process.env.IG_API_VERSION || 'v23.0'}`;
const TOKEN = process.env.IG_ACCESS_TOKEN;
const USER = process.env.IG_USER_ID;
const QUEUE = path.join(ROOT, 'marketing', 'queue.json');
// Soubory pro Instagram: marketing/promo/ → GitHub Pages (workflow media.yml), Firebase Hosting je nenosí.
const MEDIA = process.env.MEDIA_URL || 'https://morgenster95.github.io/fronta';

// je soubor opravdu na webu? (Instagram by jinak zveřejnění odmítl)
async function live(item) {
  for (const f of item.files) {
    const r = await fetch(`${MEDIA}/${f}`, { method: 'HEAD' }).catch(() => null);
    if (!r || !r.ok) return false;
    // je tam opravdu TAHLE verze? (po novém renderu může na Pages ještě ležet stará: nasazení trvá nebo selhalo)
    const local = path.join(ROOT, 'marketing', 'promo', f);
    const len = Number(r.headers.get('content-length'));
    if (len && fs.existsSync(local) && fs.statSync(local).size !== len) {
      console.log(`… ${f}: na GitHub Pages je jiná verze (${len} B, v repu ${fs.statSync(local).size} B)`);
      return false;
    }
  }
  return true;
}

async function call(method, p, params = {}) {
  const u = new URL(`${API}/${p}`);
  for (const [k, v] of Object.entries({ ...params, access_token: TOKEN })) u.searchParams.set(k, v);
  const r = await fetch(u, { method });
  const j = await r.json();
  if (j.error) throw new Error(`${method} ${p}: ${j.error.message}`);
  return j;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// kontejner se musí zpracovat (videa trvají desítky sekund)
async function waitReady(id) {
  for (let i = 0; i < 60; i++) {
    const s = await call('GET', id, { fields: 'status_code,status' });
    if (s.status_code === 'FINISHED') return;
    if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') throw new Error(`kontejner ${id}: ${s.status_code} ${s.status || ''}`);
    await sleep(5000);
  }
  throw new Error(`kontejner ${id}: zpracování trvá příliš dlouho`);
}

async function publish(item) {
  const url = (f) => `${MEDIA}/${f}`;
  let creation;
  if (item.type === 'reel') {
    creation = (await call('POST', `${USER}/media`, { media_type: 'REELS', video_url: url(item.files[0]), caption: item.caption, share_to_feed: 'true' })).id;
  } else if (item.type === 'image') {
    creation = (await call('POST', `${USER}/media`, { image_url: url(item.files[0]), caption: item.caption })).id;
  } else if (item.type === 'carousel') {
    const children = [];
    // item.tags = { "<soubor>": [{ username, x, y }] } → označení lidí na snímku (x, y 0–1); když je IG odmítne
    // (soukromý nebo neexistující účet), snímek se nahraje bez označení (@zmínky v popisku zůstávají)
    for (const f of item.files) {
      const base = { image_url: url(f), is_carousel_item: 'true' };
      const tags = item.tags?.[f];
      let id = null;
      if (tags?.length) {
        try { id = (await call('POST', `${USER}/media`, { ...base, user_tags: JSON.stringify(tags) })).id; } catch (e) { console.warn(`! ${f}: označení odmítnuto (${e.message}), bez označení`); }
      }
      if (id) {
        try { await waitReady(id); } catch (e) { console.warn(`! ${f}: snímek s označením neprošel (${e.message}), bez označení`); id = null; }
      }
      if (!id) { id = (await call('POST', `${USER}/media`, base)).id; await waitReady(id); }
      children.push(id);
    }
    creation = (await call('POST', `${USER}/media`, { media_type: 'CAROUSEL', children: children.join(','), caption: item.caption })).id;
  } else if (item.type === 'story') {
    // příběh (24 h): video max 60 s, bez popisku; .mp4 = video, jinak obrázek
    const f = item.files[0];
    const media = /\.mp4$/i.test(f) ? { video_url: url(f) } : { image_url: url(f) };
    creation = (await call('POST', `${USER}/media`, { media_type: 'STORIES', ...media })).id;
  } else throw new Error(`neznámý typ ${item.type}`);
  await waitReady(creation);
  const media = await call('POST', `${USER}/media_publish`, { creation_id: creation });
  const info = await call('GET', media.id, { fields: 'permalink' }).catch(() => ({}));
  return { id: media.id, permalink: info.permalink, at: new Date().toISOString() };
}

// Zveřejněná videa v repu nezůstávají (repo by rostlo o desítky MB denně): hodinu po zveřejnění se soubor smaže,
// smyčka smazání commitne. Instagram už má vlastní kopii; kdo chce video mít, stáhne si ho před publikací z GitHub Pages.
function dropPublishedVideos(q) {
  for (const item of q.items) {
    if (!item.published?.at || Date.now() - Date.parse(item.published.at) < 3600e3) continue;
    for (const f of item.files || []) {
      const local = path.join(ROOT, 'marketing', 'promo', f);
      if (/\.mp4$/i.test(f) && fs.existsSync(local)) { fs.unlinkSync(local); console.log(`🧹 ${f}: zveřejněno, smazáno z repa`); }
    }
  }
}

function publishedLog() {
  const f = process.env.PUBLISHED_LOG;
  if (!f || !fs.existsSync(f)) return [];
  return fs.readFileSync(f, 'utf8').split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));
}

async function main() {
  const q = JSON.parse(fs.readFileSync(QUEUE, 'utf8'));
  const args = process.argv.slice(2);
  if (!TOKEN || !USER) throw new Error('Chybí IG_ACCESS_TOKEN nebo IG_USER_ID');
  const now = Date.now();
  const { theme } = loadTheme();
  const state = loadState(theme);
  const fired = args[0] === '--due' ? fireTriggers(q, state, theme) : [];
  for (const i of fired) console.log(`★ ${i.id}: událost nastala (${theme.factions[i.fired.faction].name}, @${i.fired.hero})`);
  if (fired.length && !process.env.DRY_RUN) fs.writeFileSync(QUEUE, JSON.stringify(q, null, 2));
  // odložená hlasování (post vyšel, když ještě běželo jiné): otevřít, jakmile je volno; lhůta minHours běží od otevření
  if (args[0] === '--due' && !process.env.DRY_RUN) {
    for (const item of q.items.filter((i) => i.votePending && i.published?.id)) {
      const st = loadState(theme);
      if ((st.events || []).some((e) => e.mediaId === item.published.id)) { delete item.votePending; fs.writeFileSync(QUEUE, JSON.stringify(q, null, 2)); continue; }
      if (openItemVote(st, item, new Date().toISOString()) !== 'open') continue;
      saveState(st);
      fs.writeFileSync(QUEUE, JSON.stringify(q, null, 2));
      console.log(`☑ ${item.id}: odložené hlasování otevřeno`);
    }
  }
  const todo = args[0] === '--due'
    ? [...q.items.filter((i) => !i.published && !i.trigger && i.publishAt && Date.parse(i.publishAt) <= now), ...fired]
    : args.map((id) => q.items.find((i) => i.id === id)).filter(Boolean);
  if (args[0] === '--due' && !process.env.DRY_RUN) dropPublishedVideos(q);
  if (!todo.length) return console.log('nic ke zveřejnění');
  for (const item of todo) {
    if (item.published) { console.log(`= ${item.id}: už zveřejněno ${item.published.permalink || ''}`); continue; }
    if (item.trigger && !item.fired) { console.log(`… ${item.id}: čeká na událost ve hře`); continue; }
    if (process.env.DRY_RUN) { console.log(`(dry) ${item.id}: ${item.type} ${item.files.join(', ')}\n${item.caption}`); continue; }
    // kolo smyčky se může opakovat: co už jednou vyšlo, nesmí vyjít podruhé
    const done = publishedLog().find((x) => x.id === item.id);
    if (done) {
      item.published = done.published;
      console.log(`= ${item.id}: už zveřejněno v tomto běhu`);
      fs.writeFileSync(QUEUE, JSON.stringify(q, null, 2));
      // kolo se opakovalo (stav z origin/main): hlasování otevřít znovu, jen pokud ještě neběží
      const st = loadState(theme);
      if (item.vote && st.vote?.mediaId !== item.published.id && !(st.events || []).some((e) => e.mediaId === item.published.id)) {
        if (openItemVote(st, item) === 'open') saveState(st);
        fs.writeFileSync(QUEUE, JSON.stringify(q, null, 2));
      }
      continue;
    }
    if (!(await live(item))) {
      if (args[0] === '--due') { console.log(`… ${item.id}: soubor ještě není na GitHub Pages, zkusí se v dalším kole`); continue; }
      throw new Error(`${item.id}: soubor není na ${MEDIA} (je v marketing/promo a proběhl workflow media?)`);
    }
    console.log(`→ ${item.id} (${item.type}) …`);
    item.published = await publish(item);
    if (process.env.PUBLISHED_LOG) fs.appendFileSync(process.env.PUBLISHED_LOG, `${JSON.stringify({ id: item.id, published: item.published })}\n`);
    console.log(`✓ ${item.id}: ${item.published.permalink}`);
    fs.writeFileSync(QUEUE, JSON.stringify(q, null, 2));
    // hlasování pod tímto postem (stav se načte znovu: mezitím ho nic jiného neměnilo, ale ať se nepřepíše starší kopií)
    if (item.vote) {
      const st = loadState(theme);
      if (openItemVote(st, item) === 'open') {
        saveState(st);
        console.log(`☑ ${item.id}: hlasování otevřeno (${item.vote.options.map((o) => o.kw).join(' / ')}${item.vote.perFaction ? ', po frakcích' : ''})`);
      } else console.log(`… ${item.id}: běží hlasování „${st.vote.question}“, nové se otevře po jeho vyhodnocení`);
      fs.writeFileSync(QUEUE, JSON.stringify(q, null, 2));
    }
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
