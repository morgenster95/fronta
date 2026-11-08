// Kamera: posun tažením, pinch a kolečko pro zoom, plynulý přelet na vojáka. Pozice = světový bod uprostřed obrazovky.

export class Camera {
  constructor(el, { minZoom, maxZoom, bounds, onTap, onChange }) {
    this.el = el;
    this.x = 0;
    this.y = 0;
    this.zoom = 2;
    this.minZoom = minZoom;
    this.maxZoom = maxZoom;
    this.bounds = bounds;
    this.onTap = onTap;
    this.onChange = onChange;
    this.pointers = new Map();
    this.anim = null;
    this.bind();
  }

  get w() { return this.el.clientWidth; }
  get h() { return this.el.clientHeight; }

  screenToWorld(sx, sy) {
    return { x: this.x + (sx - this.w / 2) / this.zoom, y: this.y + (sy - this.h / 2) / this.zoom };
  }

  set(x, y, zoom = this.zoom) {
    this.zoom = Math.min(this.maxZoom, Math.max(this.minZoom, zoom));
    const halfW = this.w / 2 / this.zoom, halfH = this.h / 2 / this.zoom;
    const b = this.bounds;
    this.x = b.w > halfW * 2 ? Math.min(b.w - halfW, Math.max(halfW, x)) : b.w / 2;
    this.y = b.h > halfH * 2 ? Math.min(b.h - halfH, Math.max(halfH, y)) : b.h / 2;
    this.onChange?.();
  }

  zoomAt(sx, sy, factor) {
    const before = this.screenToWorld(sx, sy);
    const z = Math.min(this.maxZoom, Math.max(this.minZoom, this.zoom * factor));
    // po zoomu má stejný světový bod zůstat pod prstem
    const x = before.x - (sx - this.w / 2) / z;
    const y = before.y - (sy - this.h / 2) / z;
    this.set(x, y, z);
  }

  flyTo(x, y, zoom = this.zoom, ms = 1100) {
    const from = { x: this.x, y: this.y, z: this.zoom };
    const t0 = performance.now();
    this.anim = (now) => {
      const t = Math.min(1, (now - t0) / ms);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      // při delším přeletu se kamera na půli cesty trochu oddálí
      const dist = Math.hypot(x - from.x, y - from.y);
      const dip = Math.min(0.6, dist / 6000) * Math.sin(Math.PI * t);
      const z = (from.z + (zoom - from.z) * e) * (1 - dip);
      this.set(from.x + (x - from.x) * e, from.y + (y - from.y) * e, z);
      if (t >= 1) this.anim = null;
    };
  }

  update(now) {
    if (this.anim) this.anim(now);
  }

  bind() {
    const el = this.el;
    let moved = 0;
    let pinch = null;
    el.addEventListener('pointerdown', (e) => {
      el.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.anim = null;
      moved = 0;
      if (this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: this.zoom };
      }
    });
    el.addEventListener('pointermove', (e) => {
      const p = this.pointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      if (this.pointers.size === 1) {
        moved += Math.abs(dx) + Math.abs(dy);
        this.set(this.x - dx / this.zoom, this.y - dy / this.zoom);
      } else if (this.pointers.size === 2 && pinch) {
        const [a, b] = [...this.pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
        moved += 100;
        this.zoomAt(cx, cy, (pinch.z * (d / pinch.d)) / this.zoom);
      }
    });
    const up = (e) => {
      if (this.pointers.has(e.pointerId) && this.pointers.size === 1 && moved < 8) {
        const r = el.getBoundingClientRect();
        this.onTap?.(this.screenToWorld(e.clientX - r.left, e.clientY - r.top));
      }
      this.pointers.delete(e.pointerId);
      if (this.pointers.size < 2) pinch = null;
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const r = el.getBoundingClientRect();
        this.zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.0015));
      },
      { passive: false },
    );
  }
}
