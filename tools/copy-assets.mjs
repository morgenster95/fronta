// Stáhne rotace postav z PixelLabu (veřejné URL), přepíše je ručně opravenými a uloží do web/public/assets/soldiers.
// Použití: node tools/copy-assets.mjs   (PIXELLAB_TOKEN v prostředí, jinak se zkusí ~/.claude.json)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT } from './lib.mjs';

const DIRS = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'];
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'art', 'sprites.json'), 'utf8'));
const out = path.join(ROOT, 'web', 'public', 'assets', 'soldiers');
fs.mkdirSync(out, { recursive: true });

function token() {
  if (process.env.PIXELLAB_TOKEN) return process.env.PIXELLAB_TOKEN;
  const j = fs.readFileSync(path.join(os.homedir(), '.claude.json'), 'utf8');
  return j.match(/api\.pixellab\.ai\/mcp"[\s\S]*?Bearer ([0-9a-f-]{36})/)?.[1];
}

async function mcp(name, args) {
  const r = await fetch('https://api.pixellab.ai/mcp', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }),
  });
  const txt = await r.text();
  const line = txt.split('\n').find((l) => l.startsWith('data: '));
  const d = JSON.parse(line.slice(6));
  return d.result.content.filter((c) => c.type === 'text').map((c) => c.text).join('\n');
}

const manifest = {};
for (const [key, c] of Object.entries(cfg)) {
  if (key.startsWith('_')) continue;
  manifest[key] = {};
  if (c.character) {
    const info = await mcp('get_character', { character_id: c.character });
    for (const d of DIRS) {
      const line = info.split('\n').find((l) => l.trim().startsWith(`${d}: https://`));
      const url = line?.trim().slice(d.length + 2);
      if (!url) continue;
      const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
      fs.writeFileSync(path.join(out, `${key}_${d}.png`), buf);
      manifest[key][d] = `${key}_${d}.png`;
    }
  }
  // animace: řádky "  <jméno> — ..." a pod nimi "    <směr>: <url s {i}> (i=0..N)"
  if (c.character) {
    const info = await mcp('get_character', { character_id: c.character });
    let anim = null;
    for (const line of info.split(/\r?\n/)) {
      const head = line.match(/^  (\S+) — /);
      if (head) { anim = head[1]; continue; }
      const fr = line.match(/^    ([a-z-]+): (https:\S+) \(i=0\.\.(\d+)\)/);
      if (!fr || !anim) continue;
      const [, dir, tpl, last] = fr;
      const files = [];
      for (let i = 0; i <= Number(last); i++) {
        const buf = Buffer.from(await (await fetch(tpl.replace('{i}', i))).arrayBuffer());
        const name = `${key}@${anim}_${dir}_${i}.png`;
        fs.writeFileSync(path.join(out, name), buf);
        files.push(name);
      }
      manifest[key].anims ??= {};
      manifest[key].anims[anim] ??= {};
      manifest[key].anims[anim][dir] = files;
    }
  }
  for (const [d, file] of Object.entries(c.fixed || {})) {
    fs.copyFileSync(path.join(ROOT, file), path.join(out, `${key}_${d}.png`));
    manifest[key][d] = `${key}_${d}.png`;
  }
  console.log(key, Object.keys(manifest[key]).filter((k) => k !== 'anims').length, 'směrů', manifest[key].anims ? 'animace: ' + Object.entries(manifest[key].anims).map(([a, d]) => `${a}(${Object.keys(d).join('/')})`).join(' ') : '');
}
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 1));
