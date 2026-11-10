// Jak najít nemocnici: na oddálené mapě odznak s červeným křížem (stálá velikost na obrazovce),
// v detailu směrovka u okraje obrazovky, která ukazuje k nemocnici vlastní strany; klik na ni kameru přenese.
import { Container, Graphics } from 'pixi.js';

const BADGE_FROM = 1.15, BADGE_TO = 1.6; // pod BADGE_FROM plný odznak, nad BADGE_TO už je vidět nemocnice sama
const EDGE = { top: 78, bottom: 96, left: 14, right: 62 }; // okraje bez HUD, lišty a tlačítek zoomu

function badge(color) {
  const g = new Graphics();
  g.roundRect(-12, -12, 24, 24, 4).fill({ color: 0x0e0d0c });
  g.roundRect(-10, -10, 20, 20, 3).fill({ color: 0xe3d9c3 });
  g.rect(-2.5, -7, 5, 14).fill({ color: 0x9a2f22 });
  g.rect(-7, -2.5, 14, 5).fill({ color: 0x9a2f22 });
  g.roundRect(-12, -12, 24, 24, 4).stroke({ color, width: 2 });
  g.poly([-5, 12, 5, 12, 0, 18]).fill({ color: 0x0e0d0c }); // špička dolů (ukazuje na místo)
  return g;
}

export function hospitalNav({ world, cam, sites, theme, soldiers, hidden = false }) {
  if (!sites?.length) return { update() {} };
  const color = (f) => parseInt(theme.factions[f].dot.slice(1), 16);
  // odznaky ve světě
  const layer = new Container();
  world.addChild(layer);
  const badges = sites.map((s) => {
    const b = badge(color(s.faction));
    b.x = s.x;
    b.y = s.y;
    layer.addChild(b);
    return b;
  });
  // směrovky v DOM (jedna na stranu, ukazují na první nemocnici strany)
  const firstOf = theme.factions.map((_, f) => sites.find((s) => s.faction === f)).filter(Boolean);
  const label = (s) => (s.beds >= 4 ? 'HOSPITAL' : 'AID POST');
  const ptrs = firstOf.map((s) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'hosp-ptr';
    el.hidden = true;
    el.style.setProperty('--c', theme.factions[s.faction].dot);
    const side = theme.factions[s.faction].name.replace(/^The /, '');
    el.setAttribute('aria-label', `Go to the ${side} ${label(s).toLowerCase()}`);
    el.innerHTML = `<span class="arr"></span><span class="ic">✚</span><span class="lb">${label(s)}</span>`;
    el.addEventListener('click', (e) => { e.stopPropagation(); cam.flyTo(s.x, s.y, Math.max(cam.zoom, 3.6)); });
    el.addEventListener('pointerdown', (e) => e.stopPropagation());
    document.body.appendChild(el);
    return { el, s, arr: el.querySelector('.arr'), shown: false, key: '' };
  });
  // vlastní strana podle přihlášeného vojáka (house.js ukládá @handle do mi:me); neznámá = obě
  const mine = () => {
    let me = null;
    try { me = localStorage.getItem('mi:me'); } catch { /* bez úložiště */ }
    const s = me && soldiers.find((x) => x.handle === me);
    return s ? s.faction : null;
  };
  let myFaction = mine(), checked = 0;

  return {
    update(now) {
      const z = cam.zoom;
      // odznak: stálá velikost na obrazovce, mizí, když už je nemocnice vidět sama
      const a = hidden ? 0 : Math.max(0, Math.min(1, (BADGE_TO - z) / (BADGE_TO - BADGE_FROM)));
      layer.visible = a > 0;
      if (a > 0) for (const b of badges) { b.alpha = a; b.scale.set(1 / z); }
      if (now - checked > 3000) { myFaction = mine(); checked = now; } // po přihlášení se přepne bez obnovení stránky
      const w = cam.w, h = cam.h;
      for (const p of ptrs) {
        const sx = (p.s.x - cam.x) * z + w / 2, sy = (p.s.y - cam.y) * z + h / 2;
        const inside = sx > EDGE.left && sx < w - EDGE.right && sy > EDGE.top && sy < h - EDGE.bottom;
        const show = !hidden && z >= BADGE_TO && !inside && (myFaction == null || myFaction === p.s.faction);
        if (show !== p.shown) { p.el.hidden = !show; p.shown = show; }
        if (!show) continue;
        // průsečík paprsku ze středu obrazovky s okrajem bezpečné oblasti
        const cx = (EDGE.left + w - EDGE.right) / 2, cy = (EDGE.top + h - EDGE.bottom) / 2;
        const dx = sx - cx, dy = sy - cy;
        const hw = (w - EDGE.left - EDGE.right) / 2 - 26, hh = (h - EDGE.top - EDGE.bottom) / 2 - 26;
        const k = Math.min(hw / Math.abs(dx || 1e-6), hh / Math.abs(dy || 1e-6));
        const x = Math.round(cx + dx * k), y = Math.round(cy + dy * k);
        const ang = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
        const key = `${x},${y},${ang}`;
        if (key === p.key) continue; // DOM jen při změně
        p.key = key;
        p.el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
        p.arr.style.transform = `rotate(${ang}deg) translateX(30px)`;
      }
    },
  };
}
