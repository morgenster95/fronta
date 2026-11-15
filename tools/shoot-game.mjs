// Snímek přímo ze hry (stejné sprity a terén jako ve hře) pro ilustrace postů: node tools/shoot-game.mjs <režim> <výstup.png> [zoom] [šířka] [výška]
//   režimy: dugouts | doctor | ammo   (hra s rozkazem ?orders=0:<…>, kamera na místo, panel skrytý)
//           pillbox (betonový bunkr, ?orders=0:PILLBOXES) | hospital (postavená nemocnice, ?hospital=dugout) | wire (wiring party na drátu, ?party=0:6&wire=0:0.25)
// Potřebuje běžící vývojový server (REEL_URL, výchozí http://127.0.0.1:5187) a Chrome (CHROME). Nic neukládá do hry.
import puppeteer from 'puppeteer-core';

const [mode = 'dugouts', out = 'shot.png', zoomArg = '5', wArg = '350', hArg = '250'] = process.argv.slice(2);
const base = process.env.REEL_URL || 'http://127.0.0.1:5187';
const zoom = Number(zoomArg), W = Number(wArg), H = Number(hArg);
const ord = { dugouts: 'DUGOUTS', doctor: 'DOCTOR', ammo: 'AMMO' }[mode];
const q = mode === 'hospital' ? 'hospital=dugout' : mode === 'wire' ? 'party=0:6&wire=0:0.25' : mode === 'pillbox' ? 'orders=0:PILLBOXES' : `orders=0:${ord}&hospital=dugout`;
const b = await puppeteer.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium', headless: true, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage();
await p.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
await p.goto(`${base}/?${q}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
await new Promise((r) => setTimeout(r, 14000));
await p.evaluate(() => { for (const id of ['dispatch', 'bar', 'toolbar', 'support-fab']) { const e = document.getElementById(id); if (e) e.hidden = true; } document.querySelectorAll('button, .hud, #search, header, nav').forEach((e) => (e.style.display = 'none')); });
const target = await p.evaluate((mode, zoom) => {
  const f = window.__front, site = f.hospitals?.sites.find((x) => x.faction === 0);
  let x, y;
  if (mode === 'hospital') { x = site.x; y = site.y - 4; }
  else if (mode === 'pillbox') { const h = f.soldiers.filter((s) => s.faction === 0 && s.slot?.line === 'front'); const pb = f.orderFx.shelters.filter((c) => c.texture.width === 44).map((c) => ({ c, d: Math.min(...h.map((s) => Math.hypot(s.x - c.x, s.y - c.y))) })).sort((a, b) => a.d - b.d); const c = pb[0].c; x = c.x; y = c.y - 16; }
  else if (mode === 'wire') { const w = f.soldiers.filter((s) => s.onWire); const m = w[Math.floor(w.length / 2)] || site; x = m.x; y = m.y - 6; }
  else if (mode === 'doctor') { const bd = site.beds[0]; x = (bd.x + site.x) / 2 - 6; y = bd.y + 8; }
  else if (mode === 'ammo') { x = site.x + 150; y = site.y + 2; }
  else { // kryt s nejvíc vojáky poblíž; kamera mezi nimi
    let best = null;
    for (const sh of f.orderFx.shelters) {
      const near = f.soldiers.filter((s) => s.faction === 0 && !s.vacant && Math.hypot(s.x - sh.x, s.y - sh.y) < 70);
      if (!best || near.length > best.n) best = { sh, n: near.length, near };
    }
    x = best.sh.x - 18; y = best.sh.y + 6;
  }
  f.cam.set(x, y, zoom);
  return { x, y };
}, mode, zoom);
if (mode === 'doctor') { // počkej, až doktor stojí u lůžka
  for (let i = 0; i < 120; i++) {
    const near = await p.evaluate(() => { const d = window.__front.orderFx.docs[0]; const s = window.__front.hospitals.sites.find((x) => x.faction === 0); const bd = s.beds[0]; return d ? Math.abs(d.sp.x - (bd.x + 26)) : 999; });
    if (near < 8) break;
    await new Promise((r) => setTimeout(r, 250));
  }
}
await new Promise((r) => setTimeout(r, 1200));
await p.screenshot({ path: out });
await b.close();
console.log(out, JSON.stringify(target));
