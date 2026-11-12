// Nanečisto: wiring party na aktuálním stavu (nic neukládá). node tools/sim-wiring.mjs [hegemonie] [concord] [běhů]
// Vybere N dobrovolníků každé strany (zdravých, z přední linie i záloh), pustí denní tah a sečte zásahy, smrti a opravený drát.
import { loadTheme, loadState } from './lib.mjs';
import { dailyTick } from '../engine/roster.js';
import { openWiring, joinWiring } from '../engine/wiring.js';
const [nH = 20, nC = 20, runs = 30] = process.argv.slice(2).map(Number);
const { theme, story } = loadTheme();
const base = loadState(theme);
const tot = [0, 1].map(() => ({ n: 0, hit: 0, heavy: 0, dead: 0, yards: 0, wire0: 0, wire1: 0 }));
for (let r = 0; r < runs; r++) {
  const s = structuredClone(base);
  openWiring(s, 'sim', s.day);
  [nH, nC].forEach((n, f) => {
    const pool = s.soldiers.filter((x) => x.faction === f && x.status === 'active' && !x.wound);
    for (let i = 0; i < n && i < pool.length; i++) joinWiring(s, pool[(i * 7 + r * 3) % pool.length]);
  });
  const ids = new Set(s.wiring.open.ids);
  [0, 1].forEach((f) => { const w = Object.values(s.battle.sides[f].wire); tot[f].wire0 += w.reduce((a, b) => a + b, 0) / w.length; });
  dailyTick(s, { ...theme, id: `simw${r}` }, story);
  const night = s.wiring.nights.at(-1);
  [0, 1].forEach((f) => {
    const vol = s.soldiers.filter((x) => ids.has(x.id) && x.faction === f);
    tot[f].n += vol.length;
    tot[f].hit += night.sides[f].hit;
    tot[f].heavy += vol.filter((x) => x.wound?.wiring && x.wound.sev !== 'light').length;
    tot[f].dead += vol.filter((x) => x.status === 'fallen' && x.fallenDay === s.day).length;
    tot[f].yards += night.sides[f].yards;
    const w = Object.values(s.battle.sides[f].wire); tot[f].wire1 += w.reduce((a, b) => a + b, 0) / w.length;
  });
}
const name = ['Hegemony', 'Concord'];
console.log(`${runs} běhů, dobrovolníků: Hegemonie ${nH}, Concord ${nC}, počasí dne: ${base.weather}`);
tot.forEach((t, f) => {
  if (!t.n) return console.log(`${name[f]}: nikdo nešel ven`);
  console.log(`${name[f]}: zasažen ${(100 * t.hit / t.n).toFixed(1)} % dobrovolníků (těžce/kriticky ${(100 * t.heavy / t.n).toFixed(1)} %), padlo ${(100 * t.dead / t.n).toFixed(1)} % (do konce tahu), drát ${(100 * t.wire0 / runs).toFixed(0)} % → ${(100 * t.wire1 / runs).toFixed(0)} %, opraveno ${Math.round(t.yards / runs)} yd za noc`);
});
