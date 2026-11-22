// Zvuky fronty: syntetizované Web Audio (žádné nahrávky → žádná práva, nic se nestahuje).
// Každý zvuk spouští animace v life.js (výstřel = záblesk z hlavně, výbuch = efekt výbuchu), hlasitost a stereo
// podle polohy na obrazovce. Zapíná se tlačítkem (prohlížeče pustí zvuk až po kliknutí), volba se pamatuje.

const KEY = 'mi-sound';
const MAX_VOICES = 14;

export function createSound() {
  let ctx = null, master = null, comp = null, noise = null, ambience = null;
  let on = false;
  let voices = 0;
  let view = null; // { x0, x1, y0, y1 } ve světových souřadnicích
  let weather = null;

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    comp = ctx.createDynamicsCompressor(); // aby se překrývající výbuchy nepřebuzily
    comp.threshold.value = -14;
    comp.ratio.value = 6;
    master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(comp).connect(ctx.destination);
    // 2 s bílého šumu, sdílený všemi zvuky
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  // poloha → hlasitost a stereo; mimo obrazovku tišeji, oddálená kamera = vzdálenější zvuk
  function place(x, y) {
    if (!view) return { gain: 0.5, pan: 0, far: 0 };
    const w = view.x1 - view.x0, h = view.y1 - view.y0;
    const cx = (view.x0 + view.x1) / 2, cy = (view.y0 + view.y1) / 2;
    const dx = (x - cx) / (w / 2), dy = (y - cy) / (h / 2);
    const off = Math.max(0, Math.hypot(dx, dy) - 1); // 0 = na obrazovce
    const zoomFar = Math.min(1, Math.max(0, (w - 500) / 2500)); // širší záběr = dál od fronty
    const far = Math.min(1, zoomFar + off * 0.6);
    return { gain: (1 - far * 0.75) / (1 + off * 2), pan: Math.max(-1, Math.min(1, dx * 0.8)), far };
  }

  function out(x, y, extraGain = 1) {
    const p = place(x, y);
    const g = ctx.createGain();
    g.gain.value = p.gain * extraGain;
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    // vzdálené zvuky ztrácí výšky
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 12000 - p.far * 10500;
    if (pan) { pan.pan.value = p.pan; lp.connect(g).connect(pan).connect(master); } else lp.connect(g).connect(master);
    return { node: lp, far: p.far, gain: p.gain * extraGain };
  }

  function noiseSrc(t, dur) {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    s.loop = true;
    s.start(t, Math.random() * 1.5);
    s.stop(t + dur);
    return s;
  }
  function env(param, t, peak, attack, decay) {
    param.setValueAtTime(0.0001, t);
    param.exponentialRampToValueAtTime(peak, t + attack);
    param.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }
  function voice(dur) {
    if (voices >= MAX_VOICES) return false;
    voices++;
    setTimeout(() => voices--, dur * 1000);
    return true;
  }

  // výstřel z pušky: ostrý třesk + tupý úder + ozvěna zákopu
  function rifle(x, y, { gain = 1, mg = false } = {}) {
    if (!on || !voice(0.6)) return;
    const t = ctx.currentTime;
    const o = out(x, y, gain * (mg ? 0.55 : 0.7));
    if (o.gain < 0.02) return;
    const crackF = ctx.createBiquadFilter();
    crackF.type = 'highpass';
    crackF.frequency.value = 1800;
    const crackG = ctx.createGain();
    env(crackG.gain, t, 1, 0.0008, mg ? 0.03 : 0.045);
    noiseSrc(t, 0.12).connect(crackF).connect(crackG).connect(o.node);
    const thumpF = ctx.createBiquadFilter();
    thumpF.type = 'lowpass';
    thumpF.frequency.value = 420;
    const thumpG = ctx.createGain();
    env(thumpG.gain, t, 2.2, 0.002, mg ? 0.07 : 0.12);
    noiseSrc(t, 0.25).connect(thumpF).connect(thumpG).connect(o.node);
    // ozvěna (dvě odrazy od stěn zákopu)
    if (!mg) {
      for (const [d, g] of [[0.09, 0.3], [0.22, 0.15]]) {
        const dl = ctx.createDelay(0.5);
        dl.delayTime.value = d * (1 + o.far);
        const dg = ctx.createGain();
        dg.gain.value = g;
        thumpG.connect(dl).connect(dg).connect(o.node);
      }
    }
  }

  // výbuch granátu: hluboké dunění + klesající sub + třesk; velký = delší a hlubší
  function boom(x, y, big = false) {
    if (!on || !voice(big ? 3 : 2.2)) return;
    const t = ctx.currentTime;
    const o = out(x, y, big ? 1.1 : 0.85);
    if (o.gain < 0.02) return;
    const dur = big ? 2.8 : 1.9;
    const rumF = ctx.createBiquadFilter();
    rumF.type = 'lowpass';
    rumF.frequency.setValueAtTime(big ? 900 : 1300, t);
    rumF.frequency.exponentialRampToValueAtTime(big ? 90 : 130, t + 0.6);
    const rumG = ctx.createGain();
    env(rumG.gain, t, big ? 3.2 : 2.4, 0.006, dur);
    noiseSrc(t, dur + 0.2).connect(rumF).connect(rumG).connect(o.node);
    const sub = ctx.createOscillator();
    sub.frequency.setValueAtTime(big ? 70 : 90, t);
    sub.frequency.exponentialRampToValueAtTime(30, t + dur * 0.6);
    const subG = ctx.createGain();
    env(subG.gain, t, big ? 1.1 : 0.8, 0.005, dur * 0.7);
    sub.connect(subG).connect(o.node);
    sub.start(t);
    sub.stop(t + dur);
    // hlína a kamínky padající zpátky
    const dirtF = ctx.createBiquadFilter();
    dirtF.type = 'bandpass';
    dirtF.frequency.value = 2500;
    const dirtG = ctx.createGain();
    dirtG.gain.setValueAtTime(0.0001, t);
    dirtG.gain.linearRampToValueAtTime(0.18, t + 0.35);
    dirtG.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    noiseSrc(t, 1.5).connect(dirtF).connect(dirtG).connect(o.node);
  }

  // světlice: tlumené „pff“ a syčení
  function flare(x, y) {
    if (!on || !voice(2.5)) return;
    const t = ctx.currentTime;
    const o = out(x, y, 0.35);
    const popF = ctx.createBiquadFilter();
    popF.type = 'lowpass';
    popF.frequency.value = 700;
    const popG = ctx.createGain();
    env(popG.gain, t, 1.5, 0.003, 0.1);
    noiseSrc(t, 0.2).connect(popF).connect(popG).connect(o.node);
    const hissF = ctx.createBiquadFilter();
    hissF.type = 'highpass';
    hissF.frequency.value = 4000;
    const hissG = ctx.createGain();
    hissG.gain.setValueAtTime(0.0001, t + 0.15);
    hissG.gain.linearRampToValueAtTime(0.12, t + 0.5);
    hissG.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    noiseSrc(t + 0.15, 2.3).connect(hissF).connect(hissG).connect(o.node);
  }

  // tichý podkres: vítr/déšť podle počasí dne
  function startAmbience() {
    if (ambience || !ctx) return;
    const rainy = !weather || weather === 'rain' || weather === 'storm'; // v zimě main.js posílá 'snow'/'blizzard' → vítr (lowpass)
    const f = ctx.createBiquadFilter();
    f.type = rainy ? 'highpass' : 'lowpass';
    f.frequency.value = rainy ? 2500 : 500;
    const g = ctx.createGain();
    g.gain.value = 0;
    g.gain.linearRampToValueAtTime(rainy ? 0.05 : 0.07, ctx.currentTime + 2);
    const s = ctx.createBufferSource();
    s.buffer = noise;
    s.loop = true;
    s.connect(f).connect(g).connect(master);
    s.start();
    ambience = { s, g };
  }
  function stopAmbience() {
    if (!ambience) return;
    ambience.s.stop();
    ambience = null;
  }

  // motor letadla: tichý hluk (pilový tón ~75 Hz s kolísáním + šum), jeden hlas na letadlo, hlasitost a stereo podle polohy vůči kameře
  const planes = {};
  function plane(id, x, y, dir) {
    if (!on || !ctx) return;
    let p = planes[id];
    if (!p) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 74 + id * 9;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 17 + id * 3; // chvění motoru
      const lg = ctx.createGain(); lg.gain.value = 5; lfo.connect(lg).connect(o.frequency);
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 520;
      const n = ctx.createBufferSource(); n.buffer = noise; n.loop = true;
      const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 340; nf.Q.value = 0.8;
      const ng = ctx.createGain(); ng.gain.value = 0.35;
      const g = ctx.createGain(); g.gain.value = 0;
      const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      o.connect(f); n.connect(nf).connect(ng).connect(f);
      f.connect(g); if (pan) g.connect(pan).connect(master); else g.connect(master);
      o.start(); lfo.start(); n.start();
      p = planes[id] = { o, g, pan, f };
    }
    const pl = place(x, y);
    const t = ctx.currentTime;
    p.g.gain.setTargetAtTime(Math.min(0.05, pl.gain * 0.06), t, 0.3); // záměrně velmi tiché
    p.f.frequency.setTargetAtTime(520 - pl.far * 330, t, 0.3);
    p.o.frequency.setTargetAtTime((74 + id * 9) * (dir > 0 ? 1.03 : 1), t, 0.5); // jemný dopplerův posun podle směru
    if (p.pan) p.pan.pan.setTargetAtTime(pl.pan, t, 0.2);
  }
  function mutePlanes() { for (const p of Object.values(planes)) p.g.gain.value = 0; for (const l of Object.values(loops)) l.g.gain.value = 0; }

  // --- prostorové smyčky (22. 11.): motor auta, povoz, hlahol vojáků; každá se volá každý snímek s polohou, neaktualizovaná ztichne ---
  const loops = {};
  function loopNode(id, make) {
    let l = loops[id];
    if (!l) {
      const g = ctx.createGain(); g.gain.value = 0;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 4000;
      const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      f.connect(g); if (pan) g.connect(pan).connect(master); else g.connect(master);
      l = loops[id] = { g, f, pan, seen: 0, ...make(f) };
    }
    return l;
  }
  function placeLoop(l, x, y, peak, bright = 4000) {
    const pl = place(x, y), t = ctx.currentTime;
    // blízko (přiblížená kamera) plně, oddálená fronta skoro nic
    l.g.gain.setTargetAtTime(Math.max(0, pl.gain * (1 - pl.far) * peak), t, 0.25);
    l.f.frequency.setTargetAtTime(Math.max(300, bright - pl.far * (bright - 400)), t, 0.25);
    if (l.pan) l.pan.pan.setTargetAtTime(pl.pan, t, 0.15);
    l.seen = t;
    return pl;
  }
  // nákladní auto: hluboký motor (pila ~48 Hz s chvěním) + hrčení po rozbité cestě
  function truck(id, x, y, dir) {
    if (!on || !ctx) return;
    const l = loopNode(`truck${id}`, (f) => {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 44 + (id % 5) * 3;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 9 + (id % 3); const lg = ctx.createGain(); lg.gain.value = 4; lfo.connect(lg).connect(o.frequency);
      const og = ctx.createGain(); og.gain.value = 0.7; o.connect(og).connect(f);
      const n = ctx.createBufferSource(); n.buffer = noise; n.loop = true;
      const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 180; nf.Q.value = 0.7;
      const ng = ctx.createGain(); ng.gain.value = 0.5; n.connect(nf).connect(ng).connect(f);
      o.start(); lfo.start(); n.start(Math.random());
      return { o };
    });
    placeLoop(l, x, y, 0.16, 900);
    l.o.frequency.setTargetAtTime((44 + (id % 5) * 3) * (dir > 0 ? 1.02 : 0.98), ctx.currentTime, 0.4);
  }
  // povoz: klapot kopyt (krátké suché ťuknutí, rytmus chůze) + vrzání kol
  function cart(id, x, y) {
    if (!on || !ctx) return;
    const l = loopNode(`cart${id}`, (f) => {
      const n = ctx.createBufferSource(); n.buffer = noise; n.loop = true;
      const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 900; nf.Q.value = 6;
      const ng = ctx.createGain(); ng.gain.value = 0.06; n.connect(nf).connect(ng).connect(f); n.start(Math.random());
      return { next: 0, step: 0 };
    });
    const pl = placeLoop(l, x, y, 0.5, 5000);
    const t = ctx.currentTime;
    if (t >= l.next && pl.gain * (1 - pl.far) > 0.05 && voice(0.1)) {
      // čtyřtakt chůze: klap-klap … klap-klap
      l.step = (l.step + 1) % 4; l.next = t + (l.step % 2 ? 0.16 : 0.34);
      const o = out(x, y, 0.5 * (1 - pl.far));
      const bf = ctx.createBiquadFilter(); bf.type = 'bandpass'; bf.frequency.value = 1500 + Math.random() * 500; bf.Q.value = 3;
      const g = ctx.createGain(); env(g.gain, t, 0.9, 0.002, 0.05);
      noiseSrc(t, 0.07).connect(bf).connect(g).connect(o.node);
    }
  }
  // hlahol vojáků v zákopu: šum přes dva „hlasové“ formanty, hlasitost skáče v rytmu slabik; jen při přiblížení
  function murmur(x, y, crowd) {
    if (!on || !ctx) return;
    const l = loopNode('murmur', (f) => {
      const n = ctx.createBufferSource(); n.buffer = noise; n.loop = true;
      const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 520; f1.Q.value = 2.2;
      const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1350; f2.Q.value = 3;
      const sy = ctx.createGain(); sy.gain.value = 0.5;
      // slabiky: dvě pomalé vlny přes hlasitost (nepravidelný rytmus řeči)
      for (const [fq, a] of [[3.7, 0.35], [5.9, 0.25], [1.3, 0.2]]) { const o = ctx.createOscillator(); o.frequency.value = fq; const og = ctx.createGain(); og.gain.value = a; o.connect(og).connect(sy.gain); o.start(); }
      n.connect(f1).connect(sy); n.connect(f2).connect(sy); sy.connect(f); n.start(Math.random());
      return { f1, f2 };
    });
    l.f1.frequency.setTargetAtTime(480 + Math.random() * 120, ctx.currentTime, 0.6); // hlasy se mění
    placeLoop(l, x, y, Math.min(0.22, 0.03 + crowd * 0.012), 2400);
  }
  // těžké dělo: hluboký výstřel s dlouhým duněním a ozvěnou
  function cannon(x, y) {
    if (!on || !ctx || !voice(3)) return;
    const t = ctx.currentTime, o = out(x, y, 1.4);
    const th = ctx.createOscillator(); th.type = 'sine'; th.frequency.setValueAtTime(70, t); th.frequency.exponentialRampToValueAtTime(28, t + 0.9);
    const tg = ctx.createGain(); env(tg.gain, t, 1.0, 0.004, 1.1); th.connect(tg).connect(o.node); th.start(t); th.stop(t + 1.3);
    const cf = ctx.createBiquadFilter(); cf.type = 'lowpass'; cf.frequency.value = 2200 - o.far * 1500;
    const cg = ctx.createGain(); env(cg.gain, t, 0.9, 0.002, 0.35); noiseSrc(t, 0.5).connect(cf).connect(cg).connect(o.node);
    const rf = ctx.createBiquadFilter(); rf.type = 'lowpass'; rf.frequency.value = 320;
    const rg = ctx.createGain(); rg.gain.setValueAtTime(0.0001, t + 0.15); rg.gain.exponentialRampToValueAtTime(0.35, t + 0.4); rg.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);
    noiseSrc(t + 0.15, 2.7).connect(rf).connect(rg).connect(o.node);
  }
  // co se tento snímek neozvalo (auto mimo záběr), ztichne
  function tickLoops() {
    if (!ctx) return;
    const t = ctx.currentTime;
    for (const l of Object.values(loops)) if (t - l.seen > 0.25) l.g.gain.setTargetAtTime(0, t, 0.2);
  }

  function setOn(v) {
    on = v;
    try { localStorage.setItem(KEY, v ? '1' : '0'); } catch {}
    if (v) {
      init();
      ctx.resume();
      startAmbience();
    } else if (ctx) {
      stopAmbience();
      mutePlanes();
      ctx.suspend();
    }
  }

  let wanted = false;
  try { wanted = localStorage.getItem(KEY) === '1'; } catch {}

  return {
    rifle, boom, flare, plane, truck, cart, murmur, cannon, tickLoops,
    setView: (v) => (view = v),
    setWeather: (w) => (weather = w),
    get on() { return on; },
    // zapamatované „zapnuto“ se obnoví až po prvním dotyku (pravidla prohlížečů)
    wanted,
    toggle: () => setOn(!on),
    setOn,
  };
}
