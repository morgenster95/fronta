import puppeteer from 'puppeteer-core';
import fs from 'fs';
const R = '/home/user/fronta/docs/mockups/';
const uri = (p) => 'data:image/png;base64,' + fs.readFileSync(R + p).toString('base64');
const OUT = process.argv[2];
const M = ['valour','marksman','mercy','wire','raid','gun','sky','hill','wound','service','winter','truce'];
const NAMES = {valour:'Valley Cross',marksman:'Gallantry Star',mercy:'Lamp of Mercy',wire:'Picket Medal',raid:"Raider's Star",gun:'Shell Medal',sky:'Concord Wings',hill:'Cross of the Ridge',wound:'Wound Stripe',service:'Seven Winters',winter:'Snow Medal',truce:'Silent Night'};
const med = Object.fromEntries(M.map((m) => [m, uri(`medals/png/${m}_con.png`)]));
const card = [1,2,3,4,5,6,7,8].map((i) => uri(`cards/final/card_0${i}.png`));
const back = uri('cards/card_back.png');
const CN = ['HELLO','DREAMER','SUNDAY','CALL ME','GOGGLES','SEASIDE','WINGS','MY PAL'];
const css = `
.kit h3{margin:14px 0 6px}
.kit .row{display:flex;flex-wrap:wrap;gap:10px 8px;align-items:flex-end}
.kit img{image-rendering:pixelated;display:block}
.kit .m{position:relative;text-align:center}
.kit .m img{width:30px;height:46px}
.kit .x{position:absolute;right:-6px;bottom:-4px;font:10px Silkscreen,monospace;color:#e8b84a;background:#1a1815;padding:0 2px}
.kit .c{position:relative}
.kit .c img{width:54px;height:87px}
.kit .sep{width:1px;align-self:stretch;background:var(--line);margin:0 4px}
.kit .hint{color:var(--muted);font-size:14px;margin-top:6px}
.zoom{position:fixed;inset:0;background:rgba(10,9,8,.92);z-index:999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;color:#e8dcc4;font-family:Silkscreen,monospace}
.zoom .pair{display:flex;gap:16px}
.zoom img{image-rendering:pixelated;width:162px;height:261px}
.zoom .t{font-size:13px;text-align:center;line-height:1.6;max-width:340px;font-family:inherit}
.zoom .t span{color:#e8b84a}
.shelf h4{font:12px Silkscreen,monospace;color:var(--accent);margin:14px 0 6px;display:flex;justify-content:space-between}
.shelf .g{display:grid;gap:8px}
.shelf .gm{grid-template-columns:repeat(6,1fr)}
.shelf .gc{grid-template-columns:repeat(4,1fr)}
.shelf .s{border:1px solid var(--line);background:#211f1b;padding:6px 2px 4px;text-align:center;position:relative}
.shelf .s img{image-rendering:pixelated;margin:0 auto;display:block}
.shelf .gm img{width:30px;height:46px}
.shelf .gc img{width:72px;height:116px}
.shelf .s small{display:block;font:8px Silkscreen,monospace;color:var(--muted);margin-top:3px;white-space:nowrap;overflow:hidden}
.shelf .s.lock img{filter:brightness(0) opacity(.35)}
.shelf .s.lock small{opacity:.5}
.shelf .x{position:absolute;right:3px;top:2px;font:10px Silkscreen,monospace;color:#e8b84a}
`;
const kit = `<div class="kit"><h3>Medals &amp; keepsakes</h3><div class="row">
<div class="m"><img src="${med.wire}"></div>
<div class="m"><img src="${med.valour}"><span class="x">×2</span></div>
<div class="m"><img src="${med.wound}"></div>
<div class="m"><img src="${med.service}"></div>
<div class="sep"></div>
<div class="c"><img src="${card[2]}"></div>
<div class="c"><img src="${card[5]}"><span class="x">×2</span></div>
</div><div class="hint">Tap a medal or card to look closer.</div></div>`;
const have = {wire:1,valour:2,wound:1,service:1,raid:1};
const haveC = {3:1,6:2,8:1};
const shelf = `<div class="shelf"><h4><span>MEDALS</span><span>5 / 12</span></h4><div class="g gm">${M.map((m)=>`<div class="s ${have[m]?'':'lock'}"><img src="${med[m]}">${have[m]>1?`<span class="x">×${have[m]}</span>`:''}<small>${have[m]?NAMES[m]:'???'}</small></div>`).join('')}</div>
<h4><span>SWEETHEART CARDS · SET 1</span><span>3 / 8</span></h4><div class="g gc">${card.map((c,i)=>`<div class="s ${haveC[i+1]?'':'lock'}"><img src="${haveC[i+1]?c:c}">${haveC[i+1]>1?`<span class="x">×${haveC[i+1]}</span>`:''}<small>${haveC[i+1]?CN[i]:'???'}</small></div>`).join('')}</div></div>`;
const exe = fs.existsSync('/opt/pw-browsers/chromium/chrome') ? '/opt/pw-browsers/chromium/chrome' : (fs.readdirSync('/opt/pw-browsers/chromium-1243').map(d=>'/opt/pw-browsers/chromium-1243/'+d+'/chrome').find(fs.existsSync));
const b = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await p.goto('http://localhost:5187/?s=zidane_mcnamara', { waitUntil: 'networkidle0', timeout: 60000 });
await new Promise(r=>setTimeout(r,4000));
await p.addStyleTag({ content: css });
await p.evaluate((kit) => { document.getElementById('card').hidden=false; document.getElementById('card-family').insertAdjacentHTML('afterend', kit); }, kit);
await new Promise(r=>setTimeout(r,500));
const el = await p.$('#card');
await el.screenshot({ path: OUT + '/m1_card.png' });
await p.evaluate((h) => document.body.insertAdjacentHTML('beforeend', h), `<div class="zoom" id="zz"><div class="pair"><img src="${card[5]}"><img src="${back}"></div><div class="t">SEASIDE · <span>COMMON</span> · #06<br>Found by Edmund Mcnamara<br>on the wire, Day 12<br>Passed down 0 times · carried ×2</div></div>`);
await new Promise(r=>setTimeout(r,300));
await p.screenshot({ path: OUT + '/m2_zoom.png' });
await p.evaluate(() => document.getElementById('zz').remove());
await p.evaluate(() => document.getElementById('card-house').click());
await new Promise(r=>setTimeout(r,2500));
await p.evaluate((sh) => { const a=document.querySelector('#house .album'); (a||document.querySelector('#house')).insertAdjacentHTML(a?'beforebegin':'beforeend', sh); a?.scrollIntoView(); }, shelf);
await new Promise(r=>setTimeout(r,500));
const h = await p.$('#house');
await h.screenshot({ path: OUT + '/m3_house.png' });
await b.close();
