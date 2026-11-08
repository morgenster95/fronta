// Simulovaný život na frontě: dýchání, střelba, kulometné dávky, granáty, světlice, zdravotník u raněného, bombardování.
// Čistě vizuální a jen ve viditelné části mapy: nikoho to nezraní. Skutečné osudy řeší denní tah (pomalu).
//
// Tempo podle klidného dne na západní frontě: průběžná ojedinělá palba (odstřelovači, hlídky; plánovalo se ~4 náboje
// na pušku denně, tj. při tisících vojáků výstřel každých pár sekund někde na linii), občasné kulometné dávky
// a „morning hate“ při ranním a večerním stand-to, kdy obě strany pálí naplno.
import { AnimatedSprite, Container, Graphics, Sprite } from 'pixi.js';

const RATE = {
  shot: [600, 1600], // voják v záběru vystřelí (vždy s animací; záblesk patří k ní)
  distant: [250, 800], // záblesk na linii, jen při oddálení (vojáci jsou tečky)
  burst: [7000, 16000], // kulometná dávka (jen kulometčík s animací)
  shell: [20000, 50000],
  flare: [25000, 60000],
  barrageShell: [500, 1600],
};
const rnd = (a, b) => a + Math.random() * (b - a);

// Ústí hlavně vůči patě (px) pro animace střelby; builtin = záblesk už je nakreslený ve snímcích z PixelLabu.
const MUZZLE = {
  concord: { x: 5, y: -31 },
  concord_sniper: { x: 5, y: -31 },
  concord_machinegunner: { x: -12, y: -18, builtin: true },
  hegemony: { x: 9, y: -17, builtin: true },
  hegemony_sniper: { x: 10, y: -17, builtin: true },
  hegemony_machinegunner: { x: -11, y: -25 },
};
const MEDIC_SPEED = 0.016; // px/ms ≈ 1 m/s

// „Morning hate“: stand-to za úsvitu a za soumraku (místní čas diváka) → palba ×3
export function standTo(date = new Date()) {
  const m = date.getHours() * 60 + date.getMinutes();
  return (m >= 330 && m < 375) || (m >= 1110 && m < 1155);
}

// Animace z PixelLabu můžou mít větší plátno (např. 44 px, rozšířené symetricky).
// Pata je vždy na řádku 30 původního 32px plátna → kotvu dopočítáme z velikosti snímku.
function setTex(sp, t) {
  if (sp.texture === t) return;
  sp.texture = t;
  const off = (t.height - 32) / 2;
  sp.anchor.set(0.5, (30 + off) / t.height);
}

export function createLife({ world, actorLayer, theme, anims, tex, map, dirs, fx = {} }) {
  const layer = new Container(); // efekty nad terénem i vojáky
  world.addChild(layer);
  const particles = [];
  const actors = []; // dočasní chodící zdravotníci (ve vrstvě pod okrajem zákopu)
  const events = []; // naplánované výstřely kulometné dávky
  const t = { shot: rnd(...RATE.shot), distant: 0, burst: rnd(...RATE.burst), shell: rnd(...RATE.shell), flare: rnd(4000, 12000), barrage: 0 };
  const g = new Graphics();
  layer.addChild(g);
  let barrage = null; // { faction: cílová frakce }
  let shake = 0;
  const T = map.tile;
  const cellPos = ([cx, cy]) => ({ x: cx * T + 16, y: cy * T + 27 }); // stejně jako sloty vojáků

  // index buněk zákopů → (trasa, pořadí), aby zdravotník chodil po zákopu včetně cikcaku
  const cellIndex = new Map();
  map.paths.forEach((p, pi) => p.cells.forEach(([cx, cy], ci) => {
    const k = `${cx},${cy}`;
    if (!cellIndex.has(k)) cellIndex.set(k, { pi, ci });
  }));

  // --- animace postav: dýchání (idle) a jednorázová akce (výstřel) ---
  function setupSprite(s, sp) {
    const key = s.texKey;
    const dir = dirs[s.slot.d];
    const idle = anims[key]?.idle?.[dir];
    s.fire = anims[key]?.fire?.[dir];
    const phase = Math.random() * 4000;
    sp.animate = (now) => {
      if (s.action) {
        const f = Math.floor((now - s.action.t0) / s.action.ms);
        if (f < s.action.frames.length) {
          setTex(sp, s.action.frames[f]);
          if (f === s.action.fireAt && !s.action.fired) {
            s.action.fired = true;
            muzzle(s);
          }
          return;
        }
        s.action = null;
        setTex(sp, tex[key][dir]);
      }
      if (s.wounded) return;
      // dýchání: snímky z PixelLabu (nohy stojí), ne posun celého spritu
      if (idle) setTex(sp, idle[Math.floor((now + phase) / 450) % idle.length]);
    };
  }

  // --- výstřely ---
  function shoot(candidates, now) {
    // střílí jen ten, kdo má animaci střelby: záblesk a kouř vždy patří k pohybu postavy
    const pool = candidates.filter((s) => s.fire && !s.action && !s.wounded && s.archetype?.id !== 'machinegunner');
    if (!pool.length) return;
    const s = pool[Math.floor(Math.random() * pool.length)];
    s.action = { frames: s.fire, t0: now, ms: 100, fireAt: Math.floor(s.fire.length / 2), fired: false };
  }
  function muzzle(s) {
    const m = MUZZLE[s.texKey] || { x: 5, y: -28 };
    const x = s.x + m.x, y = s.y + m.y;
    flash(x, y, !m.builtin);
    playFx('smoke-small', x, y - 4, 0.5, 0.55);
    tracer(x, y, s.slot.d === 0 ? 1 : -1);
  }
  function flash(x, y, visible = true) {
    if (visible) particles.push({ kind: 'flash', x, y, life: 110, max: 110 });
    particles.push({ kind: 'glow', x, y, life: 140, max: 140 });
  }
  function tracer(x, y, dir) {
    particles.push({ kind: 'tracer', x, y, vx: rnd(-0.03, 0.03), vy: dir * 0.9, life: 420, max: 420 });
  }
  // vzdálený výstřel z linie (bez postavy, pro pocit živé fronty)
  function distantShot(view) {
    const f = Math.random() < 0.5 ? 0 : 1;
    const y = map.front[f] * T + (f === 0 ? 10 : 6);
    const x = rnd(view.x0, view.x1);
    flash(x, y);
    playFx('smoke-small', x, y - 4, 0.6, 0.35);
    if (Math.random() < 0.5) tracer(x, y, f === 0 ? 1 : -1);
  }
  // kulometná dávka: animace kulometčíka + série záblesků z jeho hlavně během ní
  function burst(gunners, now) {
    const pool = gunners.filter((s) => s.fire && !s.action && !s.wounded);
    if (!pool.length) return;
    const s = pool[Math.floor(Math.random() * pool.length)];
    const ms = 110;
    s.action = { frames: s.fire, t0: now, ms, fireAt: -1, fired: true };
    const m = MUZZLE[s.texKey] || { x: 6, y: -20 };
    const x = s.x + m.x, y = s.y + m.y;
    const dir = s.slot.d === 0 ? 1 : -1;
    const from = Math.floor(s.fire.length * 0.25), to = Math.floor(s.fire.length * 0.75);
    for (let t = from * ms; t < to * ms; t += 75) events.push({ at: now + t, run: () => { flash(x + rnd(-1, 1), y, !m.builtin); tracer(x, y, dir); } });
    events.push({ at: now + to * ms, run: () => playFx('smoke-small', x, y - 4, 0.5, 0.5) });
  }

  // přehraje efekt z PixelLab VFX (spritesheet) jednou a odstraní ho
  function playFx(name, x, y, speed = 1, alpha = 1) {
    const sheet = fx[name];
    if (!sheet) return false;
    const a = new AnimatedSprite(sheet.frames);
    a.anchor.set(sheet.pivot.x, sheet.pivot.y);
    a.x = Math.round(x);
    a.y = Math.round(y);
    a.loop = false;
    a.alpha = alpha;
    a.animationSpeed = (sheet.fps / 60) * speed;
    a.onComplete = () => a.destroy();
    layer.addChild(a);
    a.play();
    return true;
  }

  // --- granát: VFX z PixelLabu (sloup bláta, kouř), jinak jednoduchý záblesk ---
  function shell(x, y, big = false) {
    if (!playFx(big ? 'shell-blast' : 'shell-small', x, y)) particles.push({ kind: 'boom', x, y, life: 220, max: 220, r: big ? 22 : 14 });
    shake = Math.max(shake, big ? 3 : 1.5);
  }

  // --- světlice: stoupá, visí, osvětluje okolí, pomalu klesá ---
  function flare(view) {
    const mid = ((map.front[0] + map.front[1]) / 2) * T + 16;
    particles.push({ kind: 'flare', x: rnd(view.x0, view.x1), y: mid + rnd(-60, 60), vy: -0.05, life: 7000, max: 7000 });
  }

  // --- zdravotník: přijde po zákopu (po buňkách trasy, i cikcak), ošetří raněného, odejde zpět ---
  function sendMedic(s, now) {
    const fk = theme.factions[s.faction].sprite;
    const key = anims[`${fk}_medic`] ? `${fk}_medic` : fk;
    const walk = anims[key]?.walk;
    if (!walk) return;
    const cx = Math.round((s.x - 16) / T), cy = Math.round((s.y - 27) / T);
    let hit = null;
    for (let dy = -1; dy <= 1 && !hit; dy++) for (let dx = -1; dx <= 1 && !hit; dx++) hit = cellIndex.get(`${cx + dx},${cy + dy}`);
    if (!hit) return;
    const cells = map.paths[hit.pi].cells;
    const dirSign = Math.random() < 0.5 ? -1 : 1;
    let from = hit.ci + dirSign * Math.round(rnd(14, 26));
    from = Math.max(0, Math.min(cells.length - 1, from));
    if (Math.abs(from - hit.ci) < 4) return;
    // trasa po buňkách od startu k buňce vedle raněného
    const stop = hit.ci - Math.sign(hit.ci - from) * 1;
    const route = [];
    for (let i = from; i !== stop; i += Math.sign(stop - from)) route.push(cellPos(cells[i]));
    route.push(cellPos(cells[stop]));
    const sp = new Sprite(tex[key].south);
    sp.anchor.set(0.5, 30 / 32);
    sp.x = route[0].x;
    sp.y = route[0].y;
    actorLayer.addChild(sp);
    actors.push({ sp, walk, idle: tex[key], target: s, route, i: 0, x: route[0].x, y: route[0].y, phase: 'go', t0: now });
    s.medicOn = true;
  }
  function updateActors(now, dt) {
    for (let k = actors.length - 1; k >= 0; k--) {
      const a = actors[k];
      if (a.phase === 'tend') {
        const face = a.target.x > a.x ? 'east' : 'west';
        setTex(a.sp, a.idle[face]);
        if (now - a.t0 > 9000) {
          a.phase = 'back';
          a.route.reverse();
          a.i = 0;
          a.target.medicOn = false;
        }
        continue;
      }
      let budget = dt * MEDIC_SPEED;
      let dir = null;
      while (budget > 0 && a.i < a.route.length - 1) {
        const n = a.route[a.i + 1];
        const dx = n.x - a.x, dy = n.y - a.y;
        const d = Math.hypot(dx, dy);
        dir = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'east' : 'west') : dy > 0 ? 'south' : 'north';
        if (d <= budget) { a.x = n.x; a.y = n.y; a.i++; budget -= d; }
        else { a.x += (dx / d) * budget; a.y += (dy / d) * budget; budget = 0; }
      }
      a.sp.x = Math.round(a.x);
      a.sp.y = Math.round(a.y);
      if (dir) {
        const frames = a.walk[dir] || a.walk.east;
        setTex(a.sp, frames[Math.floor(now / 110) % frames.length]);
      }
      if (a.i >= a.route.length - 1) {
        if (a.phase === 'go') { a.phase = 'tend'; a.t0 = now; }
        else { a.sp.destroy(); actors.splice(k, 1); }
      }
    }
  }

  function update(now, dt, view, chunkSoldiers, showSprites) {
    // jen vojáci opravdu na obrazovce (bloky mapy jsou širší než záběr)
    const visibleSoldiers = chunkSoldiers.filter((s) => s.x > view.x0 + 8 && s.x < view.x1 - 8 && s.y > view.y0 + 30 && s.y < view.y1);
    const heat = standTo() ? 3 : 1; // morning hate
    t.shot -= dt * heat;
    t.distant -= dt * heat;
    t.burst -= dt * heat;
    t.shell -= dt;
    t.flare -= dt;
    if (showSprites && t.shot < 0) {
      t.shot = rnd(...RATE.shot);
      // střílí hlavně přední linie čelem k nepříteli
      shoot(visibleSoldiers, now);
    }
    if (t.distant < 0) {
      t.distant = rnd(...RATE.distant);
      if (!showSprites) distantShot(view); // zblízka by blikalo přes vojáky bez pohybu
    }
    if (showSprites && t.burst < 0) {
      t.burst = rnd(...RATE.burst);
      burst(visibleSoldiers.filter((s) => s.archetype?.id === 'machinegunner'), now);
    }
    for (let i = events.length - 1; i >= 0; i--) if (events[i].at <= now) { events[i].run(); events.splice(i, 1); }
    if (t.shell < 0) {
      t.shell = rnd(...RATE.shell);
      const mid = ((map.front[0] + map.front[1]) / 2) * T + 16;
      shell(rnd(view.x0, view.x1), mid + rnd(-map.nmlHalf * 10, map.nmlHalf * 10));
    }
    if (t.flare < 0) {
      t.flare = rnd(...RATE.flare);
      flare(view);
    }
    if (barrage) {
      t.barrage -= dt;
      if (t.barrage < 0) {
        t.barrage = rnd(...RATE.barrageShell);
        // dopady na stranu cílové frakce: přední linie a země nikoho před ní
        const fy = map.front[barrage.faction] * T + 16;
        const toRear = barrage.faction === 0 ? -1 : 1;
        shell(rnd(view.x0 - 100, view.x1 + 100), fy + toRear * rnd(-140, 260), Math.random() < 0.35);
      }
    }
    // zdravotníci k viditelným raněným (max 3 najednou)
    if (showSprites && actors.length < 3) {
      const w = visibleSoldiers.find((s) => s.wounded && !s.medicOn && Math.random() < 0.02);
      if (w) sendMedic(w, now);
    }
    updateActors(now, dt);

    // částice
    g.clear();
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      const k = p.life / p.max;
      if (p.vx !== undefined) { p.x += p.vx * dt; p.y += p.vy * dt; }
      switch (p.kind) {
        case 'flash':
          g.rect(Math.round(p.x) - 1, Math.round(p.y) - 1, 3, 3).fill({ color: 0xe3d9c3 });
          g.rect(Math.round(p.x) - 3, Math.round(p.y), 7, 1).fill({ color: 0xd98f3f, alpha: 0.9 });
          g.rect(Math.round(p.x), Math.round(p.y) - 3, 1, 7).fill({ color: 0xd98f3f, alpha: 0.6 });
          break;
        case 'glow':
          g.circle(p.x, p.y, 7).fill({ color: 0xd98f3f, alpha: 0.22 * k });
          break;
        case 'tracer':
          g.rect(Math.round(p.x), Math.round(p.y), 1, 4).fill({ color: 0xc9c26a, alpha: 0.8 * k });
          break;
        case 'boom': {
          const r = p.r * (1 - k * 0.5);
          g.circle(p.x, p.y - 4, r).fill({ color: 0xd98f3f, alpha: 0.35 * k });
          g.circle(p.x, p.y - 4, r * 0.5).fill({ color: 0xe3d9c3, alpha: 0.6 * k });
          break;
        }
        case 'flare': {
          if (p.life < p.max - 900) p.vy = 0.004; // po výstupu pomalu klesá
          g.circle(p.x, p.y, 90).fill({ color: 0xc9c26a, alpha: 0.06 * Math.min(1, k * 3) });
          g.circle(p.x, p.y, 40).fill({ color: 0xe3d9c3, alpha: 0.05 * Math.min(1, k * 3) });
          g.rect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2).fill({ color: 0xe3d9c3 });
          break;
        }
      }
    }
    const s = shake;
    shake = Math.max(0, shake - dt * 0.006);
    return s > 0 ? { x: rnd(-s, s), y: rnd(-s, s) } : null;
  }

  return {
    setupSprite,
    update,
    setBarrage: (b) => (barrage = b),
    shell,
    // ladění v konzoli (jen dev)
    debug: { shoot: (list) => list.forEach((s) => shoot([s], performance.now())), sendMedic: (s) => sendMedic(s, performance.now()), actors },
  };
}
