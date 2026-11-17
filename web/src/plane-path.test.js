import test from 'node:test';
import assert from 'node:assert/strict';
import { planePos, PLANE_SPEED } from './plane-path.js';

const cfg = { x0: 3000, x1: 15000, margin: 160 };
test('letadlo dolétne přes celou frontu tam i zpět a nikdy nezmizí', () => {
  const { period } = planePos(0, cfg);
  let min = Infinity, max = -Infinity, prev = null, flips = 0;
  for (let t = 0; t <= period * 3 * 1000; t += 100) {
    const p = planePos(t, cfg);
    assert.ok(Number.isFinite(p.x));
    assert.ok(p.x >= cfg.x0 - cfg.margin - 1 && p.x <= cfg.x1 + cfg.margin + 1, `mimo meze: ${p.x}`);
    if (prev) { assert.ok(Math.abs(p.x - prev.x) <= PLANE_SPEED * 0.1 + 1e-6, 'skok polohy'); if (p.dir !== prev.dir) flips++; }
    min = Math.min(min, p.x); max = Math.max(max, p.x); prev = p;
  }
  assert.ok(min <= cfg.x0 && max >= cfg.x1, 'nepokryje celou frontu');
  assert.ok(flips >= 5, 'obrací se na koncích');
});
test('dvě strany s posunem fáze jsou jinde', () => {
  assert.notEqual(planePos(5000, { ...cfg, phase: 0 }).x, planePos(5000, { ...cfg, phase: 40 }).x);
});
