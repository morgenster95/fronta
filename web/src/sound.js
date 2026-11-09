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
    const rainy = !weather || weather === 'rain' || weather === 'storm';
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

  function setOn(v) {
    on = v;
    try { localStorage.setItem(KEY, v ? '1' : '0'); } catch {}
    if (v) {
      init();
      ctx.resume();
      startAmbience();
    } else if (ctx) {
      stopAmbience();
      ctx.suspend();
    }
  }

  let wanted = false;
  try { wanted = localStorage.getItem(KEY) === '1'; } catch {}

  return {
    rifle, boom, flare,
    setView: (v) => (view = v),
    setWeather: (w) => (weather = w),
    get on() { return on; },
    // zapamatované „zapnuto“ se obnoví až po prvním dotyku (pravidla prohlížečů)
    wanted,
    toggle: () => setOn(!on),
    setOn,
  };
}
