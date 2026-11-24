import puppeteer from 'puppeteer-core';
import fs from 'fs';
const R = '/home/user/fronta/docs/mockups/';
const uri = (p) => 'data:image/png;base64,' + fs.readFileSync(R + p).toString('base64');
const OUT = R + 'medals/support/';
const V = process.argv[2] || 'a';
const SUP = [['war-bonds','War Bonds'],['field-post','Field Post'],['officers-mess',"Officers' Mess"],['trench-dog','Trench Dog']];
const sm = Object.fromEntries(SUP.map(([id]) => [id, uri(`medals/support/${id}_${V}.png`)]));
const M = ['valour','marksman','mercy','wire','raid','gun','sky','hill','wound','service','winter','truce'];
const NM = {valour:'Valley Cross',marksman:'Gallantry Star',mercy:'Lamp of Mercy',wire:'Picket Medal',raid:"Raider's Star",gun:'Shell Medal',sky:'Concord Wings',hill:'Cross of the Ridge',wound:'Wound Stripe',service:'Seven Winters',winter:'Snow Medal',truce:'Silent Night'};
const med = Object.fromEntries(M.map((m) => [m, uri(`medals/png/${m}_con.png`)]));
const card = [1,2,3,4,5,6,7,8].map((i) => uri(`cards/final/card_0${i}.png`));
const back = uri('cards/card_back.png');
const CN = ['HELLO','DREAMER','SUNDAY','CALL ME','GOGGLES','SEASIDE','WINGS','MY PAL'];
const css = `
.kit h3{margin:14px 0 6px}.kit .row{display:flex;flex-wrap:wrap;gap:10px 10px;align-items:flex-end}
.kit img{image-rendering:pixelated;display:block;width:30px;height:46px}.kit .m{position:relative}
.kit .x{position:absolute;right:-6px;bottom:-4px;font:10px Silkscreen,monospace;color:#e8b84a;background:#1a1815;padding:0 2px}
.kit .sep{width:1px;align-self:stretch;background:var(--line);margin:0 2px}
.kit .hint{color:var(--muted);font-size:14px;margin-top:6px}
.shelf h4{font:12px Silkscreen,monospace;color:var(--accent);margin:14px 0 6px;display:flex;justify-content:space-between}
.shelf .g{display:grid;gap:8px;grid-template-columns:repeat(4,minmax(0,1fr))}
.shelf .s{border:1px solid var(--line);background:#211f1b;padding:6px 2px 4px;text-align:center;position:relative}
.shelf .s img{image-rendering:pixelated;margin:0 auto;display:block}
.shelf .gm img{width:30px;height:46px}.shelf .gc img{width:72px;height:116px}
.shelf .s small{display:block;font:8px Silkscreen,monospace;color:var(--muted);margin-top:3px;white-space:nowrap;overflow:hidden}
.shelf .gm .s.lock img{filter:brightness(0) opacity(.35)}.shelf .gc .s.lock img{opacity:.45}.shelf .s.lock small{opacity:.5}
.shelf .s.sup{border-color:#6b4a2a}
.shelf .x{position:absolute;right:3px;top:2px;font:10px Silkscreen,monospace;color:#e8b84a}`;
const kit = `<div class="kit"><h3>Medals</h3><div class="row">
${['war-bonds','officers-mess','trench-dog'].map((id)=>`<div class="m"><img src="${sm[id]}"></div>`).join('')}<div class="sep"></div>
<div class="m"><img src="${med.wire}"></div><div class="m"><img src="${med.valour}"><span class="x">×2</span></div><div class="m"><img src="${med.wound}"></div><div class="m"><img src="${med.service}"></div>
</div><div class="hint">Tap a medal to see what it was for.</div></div>`;
const have = {wire:1,valour:2,wound:1,service:1,raid:1}, haveC = {3:1,6:2,8:1}, haveS = {'war-bonds':1,'officers-mess':1,'trench-dog':1};
const shelf = `<div class="shelf"><h4><span>SUPPORTERS</span><span>3 / 4</span></h4><div class="g gm">${SUP.map(([id,n])=>`<div class="s ${haveS[id]?'sup':'lock'}"><img src="${sm[id]}"><small>${haveS[id]?n:'???'}</small></div>`).join('')}</div>
<h4><span>MEDALS</span><span>5 / 12</span></h4><div class="g gm">${M.map((m)=>`<div class="s ${have[m]?'':'lock'}"><img src="${med[m]}">${have[m]>1?`<span class="x">×${have[m]}</span>`:''}<small>${have[m]?NM[m]:'???'}</small></div>`).join('')}</div>
<h4><span>SWEETHEART CARDS · SET 1</span><span>3 / 8</span></h4><div class="g gc">${card.map((c,i)=>`<div class="s ${haveC[i+1]?'':'lock'}"><img src="${haveC[i+1]?c:back}">${haveC[i+1]>1?`<span class="x">×${haveC[i+1]}</span>`:''}<small>${haveC[i+1]?CN[i]:'???'}</small></div>`).join('')}</div></div>`;
const b = await puppeteer.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true, args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 1900, deviceScaleFactor: 2 });
await p.goto('http://localhost:5187/?s=zidane_mcnamara', { waitUntil: 'domcontentloaded', timeout: 60000 });
await new Promise(r=>setTimeout(r,9000));
await p.addStyleTag({ content: css });
await p.evaluate((kit) => { document.getElementById('card').hidden=false; document.querySelector('#card .facts').insertAdjacentHTML('afterend', kit); }, kit);
await new Promise(r=>setTimeout(r,500));
const top = await p.evaluate(() => { const c=document.getElementById('card').getBoundingClientRect(); const k=document.querySelector('.kit').getBoundingClientRect(); return {x:c.x,y:c.y,w:c.width,h:k.bottom-c.y+10}; });
await p.screenshot({ path: OUT + `in_card_${V}.png`, clip: { x: top.x, y: top.y, width: top.w, height: top.h } });
await p.evaluate(() => document.getElementById('card-house').click());
await new Promise(r=>setTimeout(r,2500));
await p.evaluate((sh) => { const a=document.querySelector('#house .album'); a.previousElementSibling.insertAdjacentHTML('beforebegin', sh); }, shelf);
await new Promise(r=>setTimeout(r,500));
const r2 = await p.evaluate(() => { const h=document.getElementById('house').getBoundingClientRect(); const s=document.querySelector('.shelf').getBoundingClientRect(); return {x:h.x,y:s.y-10,w:h.width,h:s.height+20}; });
await p.screenshot({ path: OUT + `in_house_${V}.png`, clip: { x: r2.x, y: r2.y, width: r2.w, height: r2.h } });
await b.close();
