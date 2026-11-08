// Ověří napojení na Instagram: účet, followery, poslední posty a komentáře (nic neukládá).
// Použití: IG_ACCESS_TOKEN=... IG_USER_ID=... node ingest/ig-check.mjs
const API = `https://${process.env.IG_API_HOST || 'graph.facebook.com'}/${process.env.IG_API_VERSION || 'v23.0'}`;
const TOKEN = process.env.IG_ACCESS_TOKEN;
const USER = process.env.IG_USER_ID;
if (!TOKEN || !USER) {
  console.error('Chybí IG_ACCESS_TOKEN nebo IG_USER_ID');
  process.exit(1);
}
async function ig(path, params = {}) {
  const u = new URL(`${API}/${path}`);
  for (const [k, v] of Object.entries({ ...params, access_token: TOKEN })) u.searchParams.set(k, v);
  const j = await (await fetch(u)).json();
  if (j.error) throw new Error(`${path}: ${j.error.message}`);
  return j;
}
const me = await ig(USER, { fields: 'username,followers_count,media_count,website,biography' });
console.log(`účet: @${me.username}, followers ${me.followers_count}, postů ${me.media_count}
web v biu: ${me.website ?? '(žádný)'}
bio: ${(me.biography || '').replace(/\s+/g, ' ')}`);
const perms = await ig('me/permissions').catch(() => null);
if (perms) console.log('oprávnění:', perms.data.filter((p) => p.status === 'granted').map((p) => p.permission).join(', '));
const media = await ig(`${USER}/media`, { fields: 'id,caption,media_type,timestamp,permalink,comments_count', limit: 10 });
if (!media.data.length) console.log('zatím žádné posty');
for (const m of media.data) {
  const caption = (m.caption || '').slice(0, 70).replace(/\s+/g, ' ');
  console.log(`\npost ${m.id}  ${m.media_type}  ${m.timestamp}  komentářů ${m.comments_count}\n  ${m.permalink}\n  ${caption}`);
  const c = await ig(`${m.id}/comments`, { fields: 'id,text,username,timestamp', limit: 5 }).catch((e) => ({ data: [], err: e.message }));
  if (c.err) console.log(`  ✗ komentáře: ${c.err}`);
  for (const x of c.data) console.log(`  @${x.username ?? '?'}: ${x.text}`);
  if (c.data.some((x) => !x.username)) console.log('  ⚠ API nevrací username → bez App Review nepůjde narukovat podle jména');
}
