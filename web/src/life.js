// Simulovaný život na frontě: dýchání, občasný výstřel, granát, světlice, zdravotník u raněného, bombardování.
// Čistě vizuální a jen ve viditelné části mapy: nikoho to nezraní. Skutečné osudy řeší denní tah (pomalu).
import { AnimatedSprite, Container, Graphics, Sprite } from 'pixi.js';

const DIRS_BY_FACING = { 0: 'south', 4: 'north' };

// pomalé tempo: výstřel jednou za pár sekund, granát jednou za půl minuty až minutu
const RATE = { shot: [3500, 8000], shell: [25000, 60000], flare: [30000, 70000], barrageShell: [500, 1600] };
const rnd = (a, b) => a + Math.random() * (b - a);

// Animace z PixelLabu můžou mít větší plátno (např. 44 px, rozšířené symetricky).
// Pata je vždy na řádku 30 původního 32px plátna → kotvu dopočítáme z velikosti snímku.
function setTex(sp, t) {
  if (sp.texture === t) return;
  sp.texture = t;
  const off = (t.height - 32) / 2;
  sp.anchor.set(0.5, (30 + off) / t.height);
}

export function createLife({ world, theme, soldiers, anims, tex, map, dirs, fx = {} }) {
  const layer = new Container(); // efekty nad terénem i vojáky
  world.addChild(layer);
  const particles = [];
  const actors = []; // dočasní chodící zdravotníci
  const t = { shot: rnd(...RATE.shot), shell: rnd(...RATE.shell), flare: rnd(4000, 12000), barrage: 0 };
  const g = new Graphics();
  layer.addChild(g);
  let barrage = null; // { faction: cílová frakce }

  // --- animace postav: dýchání (idle) a jednorázová akce (výstřel) ---
  function setupSprite(s, sp) {
    const key = s.texKey;
    const dir = dirs[s.slot.d];
    const idle = anims[key]?.idle?.[dir];
    s.idle = idle;
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
      // dýchání: 4 snímky po ~450 ms, nohy stojí (snímky z PixelLabu), ne posun celého spritu
      if (idle) setTex(sp, idle[Math.floor((now + phase) / 450) % idle.length]);
    };
  }

  // --- výstřel: animace + záblesk + kouř + stopa ---
  function shoot(candidates, now) {
    const pool = candidates.filter((s) => s.fire && !s.action && !s.wounded);
    if (!pool.length) return;
    const s = pool[Math.floor(Math.random() * pool.length)];
    s.action = { frames: s.fire, t0: now, ms: 100, fireAt: Math.floor(s.fire.length / 2), fired: false };
  }
  function muzzle(s) {
    // ústí hlavně podle snímků z PixelLabu: čelem k nám (jih) vpravo ve výšce hrudi, zády (sever) nad pravým ramenem
    const south = s.slot.d === 0;
    const x = s.x + (south ? 9 : 5), y = s.y - (south ? 17 : 31);
    if (!south) particles.push({ kind: 'flash', x, y, life: 90, max: 90 }); // jižní snímky mají záblesk v sobě
    const puff = playFx('smoke-small', x + (south ? 4 : 0), y - 4, 0.5, 0.55);
    if (!puff)
      for (let i = 0; i < 4; i++) particles.push({ kind: 'smoke', x: x + rnd(-2, 2), y, vx: rnd(-0.004, 0.004), vy: -rnd(0.006, 0.012), life: rnd(900, 1500), max: 1500, size: rnd(1.5, 3) });
    particles.push({ kind: 'tracer', x, y, vx: rnd(-0.02, 0.02), vy: (south ? 1 : -1) * 0.55, life: 260, max: 260 });
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

  // --- granát: záblesk, sloup bláta, kouř ---
  function shell(x, y, big = false) {
    if (playFx(big ? 'shell-blast' : 'shell-small', x, y)) {
      shake = Math.max(shake, big ? 3 : 1.5);
      return;
    }
    particles.push({ kind: 'boom', x, y, life: 220, max: 220, r: big ? 22 : 14 });
    const n = big ? 26 : 16;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + rnd(-0.9, 0.9);
      const v = rnd(0.05, big ? 0.16 : 0.12);
      particles.push({ kind: 'dirt', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rnd(600, 1100), max: 1100, g: 0.00028 });
    }
    for (let i = 0; i < (big ? 10 : 6); i++) particles.push({ kind: 'smoke', x: x + rnd(-6, 6), y: y - rnd(0, 6), vx: rnd(-0.006, 0.006), vy: -rnd(0.004, 0.01), life: rnd(2500, 4500), max: 4500, size: rnd(3, big ? 7 : 5) });
    shake = Math.max(shake, big ? 3 : 1.5);
  }

  // --- světlice: stoupá, visí, osvětluje okolí, pomalu klesá ---
  function flare(view) {
    const x = rnd(view.x0, view.x1);
    const mid = (map.front[0] + map.front[1]) / 2 * map.tile + 16;
    particles.push({ kind: 'flare', x, y: mid + rnd(-60, 60), vy: -0.05, life: 7000, max: 7000 });
  }

  // --- zdravotník: dojde ke zraněnému, chvíli u něj klečí, odejde ---
  function sendMedic(s, now) {
    const f = theme.factions[s.faction].sprite;
    const key = anims[`${f}_medic`] ? `${f}_medic` : f;
    const walk = anims[key]?.walk;
    if (!walk) return;
    const from = s.x + (Math.random() < 0.5 ? -1 : 1) * rnd(80, 140);
    const sp = new Sprite(tex[key].south);
    sp.anchor.set(0.5, 30 / 32);
    sp.x = from;
    sp.y = s.y;
    layer.addChild(sp);
    actors.push({ sp, walk, idle: tex[key], target: s, x: from, phase: 'go', t0: now, back: from });
    s.medicOn = true;
  }
  function updateActors(now, dt) {
    for (let i = actors.length - 1; i >= 0; i--) {
      const a = actors[i];
      const goal = a.phase === 'go' ? a.target.x + 10 : a.phase === 'back' ? a.back : a.x;
      const dx = goal - a.x;
      if (a.phase === 'tend') {
        setTex(a.sp, a.idle.west);
        a.sp.scale.x = 1;
        if (now - a.t0 > 9000) { a.phase = 'back'; a.target.medicOn = false; }
        continue;
      }
      if (Math.abs(dx) < 1) {
        if (a.phase === 'go') { a.phase = 'tend'; a.t0 = now; continue; }
        layer.removeChild(a.sp);
        actors.splice(i, 1);
        continue;
      }
      const step = Math.sign(dx) * Math.min(Math.abs(dx), dt * 0.018); // ~1 m/s
      a.x += step;
      a.sp.x = Math.round(a.x);
      const dir = step > 0 ? 'east' : 'west';
      const frames = a.walk[dir] || a.walk.east;
      a.sp.scale.x = !a.walk[dir] && dir === 'west' ? -1 : 1;
      setTex(a.sp, frames[Math.floor(now / 110) % frames.length]);
    }
  }

  let shake = 0;

  function update(now, dt, view, visibleSoldiers, showSprites) {
    // časovače
    t.shot -= dt;
    t.shell -= dt;
    t.flare -= dt;
    if (showSprites && t.shot < 0) {
      t.shot = rnd(...RATE.shot);
      shoot(visibleSoldiers.filter((s) => s.slot.line === 'front' || s.slot.d === 0 || s.slot.d === 4), now);
    }
    if (t.shell < 0) {
      t.shell = rnd(...RATE.shell);
      const mid = (map.front[0] + map.front[1]) / 2 * map.tile + 16;
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
        const fy = map.front[barrage.faction] * map.tile + 16;
        const toRear = barrage.faction === 0 ? -1 : 1;
        shell(rnd(view.x0 - 100, view.x1 + 100), fy + toRear * rnd(-140, 260), Math.random() < 0.35);
      }
    }
    // zdravotníci k viditelným raněným (max 3 najednou)
    if (showSprites && actors.length < 3) {
      const w = visibleSoldiers.find((s) => s.wounded && !s.medicOn && Math.random() < 0.01);
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
      if (p.g) p.vy += p.g * dt;
      switch (p.kind) {
        case 'flash':
          g.rect(Math.round(p.x) - 1, Math.round(p.y) - 1, 3, 3).fill({ color: 0xe3d9c3 });
          g.rect(Math.round(p.x) - 2, Math.round(p.y), 5, 1).fill({ color: 0xd98f3f, alpha: 0.9 });
          break;
        case 'tracer':
          g.rect(Math.round(p.x), Math.round(p.y), 1, 3).fill({ color: 0xc9c26a, alpha: k });
          break;
        case 'smoke':
          g.rect(Math.round(p.x - p.size / 2), Math.round(p.y - p.size / 2), Math.ceil(p.size), Math.ceil(p.size)).fill({ color: 0x857a68, alpha: 0.45 * k });
          p.size += dt * 0.002;
          break;
        case 'dirt':
          g.rect(Math.round(p.x), Math.round(p.y), 2, 2).fill({ color: k > 0.5 ? 0x3d3730 : 0x524a3f });
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
    shootNow: (list) => list.forEach((s) => shoot([s], performance.now())), // ladění
    shell,
  };
}

export { DIRS_BY_FACING };
