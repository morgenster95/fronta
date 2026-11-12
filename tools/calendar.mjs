// Kalendář příspěvků a novin jako samostatná stránka: marketing/promo/plan.html → GitHub Pages
//   https://morgenster95.github.io/fronta/plan.html
// Ukazuje, co je naplánované (čas UTC i Praha, živé odpočty), co už vyšlo (s odkazem na Instagram), co čeká bez termínu,
// kdy vyjdou Noviny a jaké byly ztráty posledního dne; videa a obrázky z fronty se dají přímo pustit/prohlédnout.
// Smyčka (tools/loop.sh) ho po každém kole přegeneruje; stránka se mění jen při změně fronty nebo dne (ne s každým novým vojákem).
//   node tools/calendar.mjs
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib.mjs';

const q = JSON.parse(fs.readFileSync(path.join(ROOT, 'marketing', 'queue.json'), 'utf8'));
const st = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'state.json'), 'utf8'));
const theme = JSON.parse(fs.readFileSync(path.join(ROOT, 'themes', 'front-ww1', 'theme.json'), 'utf8'));
const PAGES = 'https://morgenster95.github.io/fronta';
const short = (f) => theme.factions[f].name.replace(/^The /, '');
const first = (c) => String(c || '').split('\n')[0].slice(0, 90);

const items = q.items.map((i) => ({
  id: i.id, label: /^reel-(ridge|day\d+)$/.test(i.id) ? 'Day reel' : '', type: i.type, at: i.publishAt || null, files: i.files || [], caption: first(i.caption), full: i.caption || '',
  trigger: i.trigger ? Object.entries(i.trigger).map(([k, v]) => `${k}: ${v}`).join(', ') : null,
  published: i.published ? { at: i.published.at, link: i.published.permalink || null } : null,
}));
const last = st.battle?.stats?.at(-1);
const losses = last ? { day: last.day, sides: [0, 1].map((f) => {
  const a = last.sides[f], d = a.deaths;
  return { name: short(f), dead: (d.nobed || 0) + (d.nocare || 0) + (d.wounds || 0) + (d.shell || 0) + (d.shot || 0), light: a.sev.light, heavy: a.sev.heavy, crit: a.sev.crit, shell: a.hits?.shell || 0 };
}) } : null;
const now = [0, 1].map((f) => ({ name: short(f), wounded: st.soldiers.filter((s) => s.faction === f && s.wound).length, missing: st.soldiers.filter((s) => s.faction === f && s.status === 'missing').length }));
const v = (st.victories || []).at(-1);
const data = { day: st.day, items, losses, now, victory: v ? { name: v.name, faction: short(v.faction), day: v.day, to: v.barrageTo, loser: short(1 - v.faction) } : null, pages: PAGES,
  slots: { gazette: theme.schedule?.editionUtc ?? 13, evening: theme.schedule?.reelUtc ?? 23 } };

const html = `<!doctype html><html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mud &amp; Iron: plán</title>
<style>
:root{--bg:#1c1a17;--panel:#262320;--ink:#e3d9c3;--dim:#a39782;--gold:#d98f3f;--ok:#8fb36a;--warn:#c9c26a;--red:#b5402c}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.4 system-ui,sans-serif;padding:16px 16px 60px;max-width:760px;margin-inline:auto}
h1{font-size:22px;margin:0 0 4px;letter-spacing:.04em}h2{font-size:15px;color:var(--gold);text-transform:uppercase;letter-spacing:.08em;margin:26px 0 8px;border-bottom:1px solid #3d3730;padding-bottom:4px}
.clock{color:var(--dim);font-size:14px}.card{background:var(--panel);border-left:4px solid var(--gold);padding:10px 12px;margin:8px 0;border-radius:2px}
.card.done{border-color:var(--ok)}.card.free{border-color:var(--dim)}.card.sys{border-color:#524a3f;opacity:.9}.t{font-weight:600}.when{color:var(--warn);font-size:14px}.dim{color:var(--dim);font-size:14px}
.badge{display:inline-block;font-size:12px;padding:1px 7px;border-radius:9px;background:#3d3730;margin-left:6px}.badge.ok{background:#3b4a2d}.badge.go{background:#5a3b1e}
video,img.pv{width:100%;max-width:360px;display:block;margin:8px 0;background:#000;border:2px solid #0e0d0c}a{color:var(--gold)}
table{border-collapse:collapse;width:100%;margin:6px 0}td,th{padding:5px 8px;text-align:left;border-bottom:1px solid #3d3730;font-size:15px}th{color:var(--dim);font-weight:500}
details summary{cursor:pointer;color:var(--dim);font-size:14px}pre{white-space:pre-wrap;font:14px/1.35 system-ui;color:var(--dim)}
</style></head><body>
<h1>MUD &amp; IRON · plán</h1><div class="clock" id="clock"></div>
<div id="app"></div>
<script>
const D=${JSON.stringify(data)};
const fmt=(d,tz)=>new Intl.DateTimeFormat('cs-CZ',{timeZone:tz,weekday:'short',day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit'}).format(d);
const both=(d)=>fmt(d,'Europe/Prague')+' (Praha) · '+d.toISOString().slice(11,16)+' UTC';
const left=(d)=>{let s=Math.round((d-Date.now())/60000);if(s<=0)return 'právě teď / už mělo vyjít';const h=Math.floor(s/60),m=s%60;return 'za '+(h?h+' h ':'')+m+' min'};
const esc=(s)=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const media=(i)=>i.files.map(f=>/\\.mp4$/i.test(f)?'<video controls preload="none" playsinline src="'+D.pages+'/'+f+'"></video>':'<img class="pv" loading="lazy" src="'+D.pages+'/'+f+'" alt="">').join('');
function gazette(){const n=new Date();let g=new Date(Date.UTC(n.getUTCFullYear(),n.getUTCMonth(),n.getUTCDate(),D.slots.gazette));if(g<=n)g=new Date(g.getTime()+864e5);return g}
function render(){
  document.getElementById('clock').textContent='Teď: '+both(new Date());
  const now=Date.now(),g=gazette(),dayN=D.day+1;
  const ev=[];
  ev.push({at:g,html:'<div class="card sys"><div class="t">📰 Noviny (Den '+dayN+')'+'<span class="badge go">automaticky</span></div><div class="when">'+both(g)+' · '+left(g)+'</div><div class="dim">Denní tah, zápisy vojákům, The Trench Gazette'+(D.victory&&dayN<=D.victory.to?', bombardování '+D.victory.loser+' (noc '+(dayN-D.victory.day)+' ze 3)':'')+'</div></div>'});
  for(const i of D.items){ if(!i.at||i.published)continue; const d=new Date(i.at);
    ev.push({at:d,html:'<div class="card"><div class="t">'+(i.type==='reel'?'🎬':i.type==='story'?'📱':'🖼️')+' '+(i.label?esc(i.label)+' · ':'')+esc(i.id)+'<span class="badge go">naplánováno</span></div><div class="when">'+both(d)+' · '+left(d)+'</div><div class="dim">'+esc(i.caption)+'</div>'+media(i)+'<details><summary>celý popisek</summary><pre>'+esc(i.full)+'</pre></details></div>'});}
  ev.sort((a,b)=>a.at-b.at);
  let h='<h2>Co přijde (v pořadí)</h2>'+ev.map(e=>e.html).join('');
  const free=D.items.filter(i=>!i.at&&!i.published);
  h+='<h2>Připraveno bez termínu</h2>'+(free.map(i=>'<div class="card free"><div class="t">'+esc(i.id)+' <span class="badge">'+i.type+(i.trigger?' · spouštěč '+esc(i.trigger):'')+'</span></div><div class="dim">'+esc(i.caption)+'</div>'+media(i)+'</div>').join('')||'<div class="dim">nic</div>');
  const done=D.items.filter(i=>i.published).sort((a,b)=>b.published.at.localeCompare(a.published.at)).slice(0,8);
  h+='<h2>Vyšlo</h2>'+done.map(i=>'<div class="card done"><div class="t">'+(i.label?esc(i.label)+' · ':'')+esc(i.id)+'<span class="badge ok">vyšlo</span></div><div class="when">'+both(new Date(i.published.at))+'</div>'+(i.published.link?'<a href="'+i.published.link+'" target="_blank" rel="noopener">otevřít na Instagramu</a>':'')+'</div>').join('');
  if(D.losses){h+='<h2>Ztráty posledního vydání (Den '+D.losses.day+')</h2><table><tr><th></th><th>padlí</th><th>lehce</th><th>těžce</th><th>kriticky</th><th>z bombardování</th></tr>'+D.losses.sides.map(s=>'<tr><td>'+s.name+'</td><td>'+s.dead+'</td><td>'+s.light+'</td><td>'+s.heavy+'</td><td>'+s.crit+'</td><td>'+s.shell+'</td></tr>').join('')+'</table>';}
  h+='<h2>Stav teď</h2><table><tr><th></th><th>ranění</th><th>nezvěstní</th></tr>'+D.now.map(s=>'<tr><td>'+s.name+'</td><td>'+s.wounded+'</td><td>'+s.missing+'</td></tr>').join('')+'</table>';
  h+='<h2>Odkazy</h2><div class="dim"><a href="https://mudandiron.web.app" target="_blank">hra</a> · <a href="https://www.instagram.com/mudandiron/" target="_blank">Instagram</a></div>';
  document.getElementById('app').innerHTML=h;
}
render();setInterval(render,30000);
</script></body></html>`;
const out = path.join(ROOT, 'marketing', 'promo', 'plan.html');
const old = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
if (old !== html) { fs.writeFileSync(out, html); console.log('plan.html aktualizován'); } else console.log('plan.html beze změny');
