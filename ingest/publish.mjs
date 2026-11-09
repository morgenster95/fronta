// Publikování na Instagram (Content Publishing API, systémový token): fronta příspěvků v marketing/queue.json.
// Soubory musí být veřejně na webu (web/public/promo → https://mudandiron.web.app/promo/...).
//
// Použití: node ingest/publish.mjs <id> [<id> …]   zveřejní dané položky hned (v uvedeném pořadí)
//          node ingest/publish.mjs --due           zveřejní položky, jejichž publishAt už nastal (pro plánovač)
// Proměnné: IG_ACCESS_TOKEN, IG_USER_ID, SITE_URL (výchozí https://mudandiron.web.app), DRY_RUN=1
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../tools/lib.mjs';

const API = `https://${process.env.IG_API_HOST || 'graph.facebook.com'}/${process.env.IG_API_VERSION || 'v23.0'}`;
const TOKEN = process.env.IG_ACCESS_TOKEN;
const USER = process.env.IG_USER_ID;
const SITE = process.env.SITE_URL || 'https://mudandiron.web.app';
const QUEUE = path.join(ROOT, 'marketing', 'queue.json');

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
  const url = (f) => `${SITE}/promo/${f}`;
  let creation;
  if (item.type === 'reel') {
    creation = (await call('POST', `${USER}/media`, { media_type: 'REELS', video_url: url(item.files[0]), caption: item.caption, share_to_feed: 'true' })).id;
  } else if (item.type === 'image') {
    creation = (await call('POST', `${USER}/media`, { image_url: url(item.files[0]), caption: item.caption })).id;
  } else if (item.type === 'carousel') {
    const children = [];
    for (const f of item.files) children.push((await call('POST', `${USER}/media`, { image_url: url(f), is_carousel_item: 'true' })).id);
    for (const c of children) await waitReady(c);
    creation = (await call('POST', `${USER}/media`, { media_type: 'CAROUSEL', children: children.join(','), caption: item.caption })).id;
  } else throw new Error(`neznámý typ ${item.type}`);
  await waitReady(creation);
  const media = await call('POST', `${USER}/media_publish`, { creation_id: creation });
  const info = await call('GET', media.id, { fields: 'permalink' }).catch(() => ({}));
  return { id: media.id, permalink: info.permalink, at: new Date().toISOString() };
}

async function main() {
  if (!TOKEN || !USER) throw new Error('Chybí IG_ACCESS_TOKEN nebo IG_USER_ID');
  const q = JSON.parse(fs.readFileSync(QUEUE, 'utf8'));
  const args = process.argv.slice(2);
  const now = Date.now();
  const todo = args[0] === '--due'
    ? q.items.filter((i) => !i.published && i.publishAt && Date.parse(i.publishAt) <= now)
    : args.map((id) => q.items.find((i) => i.id === id)).filter(Boolean);
  if (!todo.length) {
    cleanup(q);
    return console.log('nic ke zveřejnění');
  }
  for (const item of todo) {
    if (item.published) { console.log(`= ${item.id}: už zveřejněno ${item.published.permalink || ''}`); continue; }
    if (process.env.DRY_RUN) { console.log(`(dry) ${item.id}: ${item.type} ${item.files.join(', ')}`); continue; }
    console.log(`→ ${item.id} (${item.type}) …`);
    item.published = await publish(item);
    console.log(`✓ ${item.id}: ${item.published.permalink}`);
    fs.writeFileSync(QUEUE, JSON.stringify(q, null, 2));
  }
  cleanup(q);
}

// Po zveřejnění už Instagram soubor nepotřebuje: smazat z webu vše, co nečeká žádná nezveřejněná položka
// (jinak by se velká videa nasazovala pořád dokola a plnila úložiště hostingu).
function cleanup(q) {
  const dir = path.join(ROOT, 'web', 'public', 'promo');
  const needed = new Set(q.items.filter((i) => !i.published).flatMap((i) => i.files));
  for (const f of fs.existsSync(dir) ? fs.readdirSync(dir) : []) {
    if (!needed.has(f) && q.items.some((i) => i.files.includes(f))) {
      fs.unlinkSync(path.join(dir, f));
      console.log(`🗑 promo/${f} (už zveřejněno)`);
    }
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
