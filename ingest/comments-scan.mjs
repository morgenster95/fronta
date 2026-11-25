// Přehled komentářů na IG, kde hráči hlásí problémy nebo se ptají (jen čte, nic neukládá ani neodpovídá).
// Spouští workflow comments-scan (ručně): node ingest/comments-scan.mjs [dní=3] [postů=20]
// Vypíše: 1) komentáře se slovy o chybách a otázky, 2) ostatní delší komentáře (ne jen hesla CONCORD/HEGEMONY, role, kódy).
const API = `https://${process.env.IG_API_HOST || 'graph.facebook.com'}/${process.env.IG_API_VERSION || 'v23.0'}`;
const TOKEN = process.env.IG_ACCESS_TOKEN;
const USER = process.env.IG_USER_ID;
const DAYS = Number(process.argv[2] || 3), POSTS = Number(process.argv[3] || 20);
const since = Date.now() - DAYS * 86400e3;

async function ig(path, params = {}) {
  const url = new URL(path.startsWith('http') ? path : `${API}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  if (!url.searchParams.has('access_token')) url.searchParams.set('access_token', TOKEN);
  const j = await (await fetch(url)).json();
  if (j.error) throw new Error(`IG ${path}: ${j.error.message}`);
  return j;
}

// slova, podle kterých poznáme hlášení chyby nebo dotaz
const PROBLEM = /\b(bug|bugs|broken|error|glitch|crash|lag|stuck|freez|not work|doesn'?t work|dont work|isn'?t work|won'?t|can'?t|cannot|couldn'?t|didn'?t|did not|no reply|never got|not (load|show|showing|appear|there)|missing|wrong|help|log ?in|sign ?in|login|claim|code|card|site|website|page|link|blank|black screen|white screen|loading)\b/i;
// komentáře, které jsou jen herní hesla (nábor, role, akce, hlasy, kódy)
const KEYWORDS = /^(?:[@#]\S+\s*)*(?:hegemony|concord|wire|raid|pilot|hospital|tanks?|pillbox(es)?|ammo|dugouts?|doctor|sandbags?|fortify|rifleman|medic|sniper|mg|machine ?gunner|sapper|runner|signaller|cook|chaplain|officer|lieutenant|enlist-\w{4}|[\s\p{Emoji}\p{P}])+$/iu;

const me = await ig(USER, { fields: 'username' });
const own = (me.username || '').toLowerCase();
let page = await ig(`${USER}/media`, { fields: 'id,caption,timestamp,permalink,comments_count', limit: POSTS });
const media = (page.data || []).filter((m) => Date.parse(m.timestamp) > since - 14 * 86400e3);
const problems = [], other = [];
let total = 0;
for (const m of media) {
  const title = (m.caption || '').split('\n')[0].slice(0, 60);
  let p = await ig(`${m.id}/comments`, { fields: 'id,text,username,timestamp,replies.limit(50){id,text,username,timestamp}', limit: 50 });
  for (;;) {
    for (const c of p.data || []) {
      for (const x of [c, ...(c.replies?.data || [])]) {
        if (!x.text || (x.username || '').toLowerCase() === own || Date.parse(x.timestamp) < since) continue;
        total++;
        const row = { at: x.timestamp.slice(0, 16).replace('T', ' '), who: x.username, text: x.text.replace(/\s+/g, ' ').slice(0, 300), post: title, link: m.permalink };
        if (PROBLEM.test(x.text) || /\?/.test(x.text)) problems.push(row);
        else if (!KEYWORDS.test(x.text.trim()) && x.text.trim().split(/\s+/).length >= 4) other.push(row);
      }
    }
    if (!p.paging?.next) break;
    p = await ig(p.paging.next);
  }
}
const show = (l) => l.sort((a, b) => b.at.localeCompare(a.at)).forEach((r) => console.log(`- ${r.at} @${r.who}: ${r.text}\n    (${r.post} · ${r.link})`));
console.log(`Komentáře za posledních ${DAYS} dní na ${media.length} postech: ${total}`);
console.log(`\n=== MOŽNÉ CHYBY A DOTAZY (${problems.length}) ===`);
show(problems);
console.log(`\n=== OSTATNÍ DELŠÍ KOMENTÁŘE (${other.length}) ===`);
show(other);
