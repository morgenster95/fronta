// Ověří napojení na Instagram: účet, počet followerů, poslední posty a komentáře (nic neukládá).
// Použití: IG_ACCESS_TOKEN=... node ingest/ig-check.mjs   (IG_USER_ID není potřeba, zjistí se)
const API = `https://graph.instagram.com/${process.env.IG_API_VERSION || 'v23.0'}`;
const TOKEN = process.env.IG_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('Chybí IG_ACCESS_TOKEN');
  process.exit(1);
}
async function ig(path, params = {}) {
  const u = new URL(`${API}/${path}`);
  for (const [k, v] of Object.entries({ ...params, access_token: TOKEN })) u.searchParams.set(k, v);
  const j = await (await fetch(u)).json();
  if (j.error) throw new Error(`${path}: ${j.error.message}`);
  return j;
}
const me = await ig('me', { fields: 'user_id,username,followers_count,media_count,account_type' });
console.log(`účet: @${me.username} (${me.account_type}), followers ${me.followers_count}, postů ${me.media_count}`);
console.log(`IG_USER_ID = ${me.user_id}`);
const media = await ig(`${me.user_id}/media`, { fields: 'id,caption,media_type,timestamp,permalink,comments_count', limit: 10 });
for (const m of media.data) {
  console.log(`\npost ${m.id}  ${m.media_type}  ${m.timestamp}  komentářů ${m.comments_count}\n  ${m.permalink}\n  ${(m.caption || '').slice(0, 70).replace(/\n/g, ' ')}`);
  const c = await ig(`${m.id}/comments`, { fields: 'id,text,username,timestamp', limit: 5 }).catch((e) => ({ data: [], err: e.message }));
  if (c.err) console.log(`  ✗ komentáře: ${c.err}`);
  for (const x of c.data) console.log(`  @${x.username ?? '?'}: ${x.text}`);
  if (c.data.length && c.data.some((x) => !x.username)) console.log('  ⚠ API nevrací username → bez App Review nepůjde narukovat podle jména');
}
