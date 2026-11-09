"""Zvuk k promo videím: temný hudební podklad + bubny + déšť + dunění děl a výstřely načasované podle scénáře.

Vše je syntetizované v kódu (žádné cizí nahrávky → žádná autorská práva). Výstup: marketing/reels/<název>_sound.mp4
Použití: python marketing/reel_audio.py [teaser enlist sides howto story day1]
"""
import json
import os
import subprocess
import sys
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REELS = os.path.join(ROOT, "marketing", "reels")
SR = 44100
rng = np.random.default_rng(7)


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):  # jednopólový filtr; pro pár desítek sekund dost rychlé
        acc = (1 - a) * x[i] + a * acc
        y[i] = acc
    return y


def lowpass_fast(x, cutoff, passes=2):
    # rychlá aproximace dolní propusti klouzavým průměrem (pro šum)
    n = max(1, int(SR / cutoff / 2))
    k = np.ones(n) / n
    for _ in range(passes):
        x = np.convolve(x, k, mode="same")
    return x


def env(n, attack, decay):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(attack, 1e-4)) * np.exp(-t / decay)
    return e


def add(buf, sig, at):
    i = int(at * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i]


def drone(dur):
    t = np.arange(int(dur * SR)) / SR
    # d moll: D2, A2, D3, F3 s pomalým „dýcháním“ a lehkým rozladěním
    out = np.zeros_like(t)
    for f, a in ((73.42, 0.5), (110.0, 0.32), (146.83, 0.22), (174.61, 0.14), (73.8, 0.25)):
        lfo = 0.6 + 0.4 * np.sin(2 * np.pi * (0.05 + f / 4000) * t + f)
        out += a * lfo * (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t))
    # pomalé zesilování k závěru
    out *= 0.55 + 0.45 * (t / dur)
    return out * 0.18


def rain(dur):
    n = int(dur * SR)
    noise = rng.standard_normal(n)
    hi = noise - lowpass_fast(noise, 900)
    hiss = lowpass_fast(hi, 6000, 1)
    drops = np.zeros(n)
    for at in rng.uniform(0, dur, int(dur * 25)):
        d = rng.standard_normal(int(0.01 * SR)) * env(int(0.01 * SR), 0.0005, 0.002)
        add(drops, d * rng.uniform(0.2, 0.6), at)
    return hiss * 0.05 + drops * 0.05


def drum(strength=1.0):
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    f = 62 * np.exp(-t * 4) + 38  # klesající tón jako tympán/taiko
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.28)
    click = lowpass_fast(rng.standard_normal(n), 2500, 1) * env(n, 0.0005, 0.015)
    return (body * 0.9 + click * 0.3) * strength


def boom(big=False):
    n = int((3.2 if big else 2.2) * SR)
    t = np.arange(n) / SR
    rumble = lowpass_fast(rng.standard_normal(n), 120 if big else 160, 3) * 9
    sub = np.sin(2 * np.pi * (34 + 20 * np.exp(-t * 3)) * t)
    crack = (rng.standard_normal(n) - lowpass_fast(rng.standard_normal(n), 1500, 1)) * env(n, 0.001, 0.05)
    e = env(n, 0.004, 0.9 if big else 0.6)
    return (rumble * e + sub * e * 0.8 + crack * 0.4) * (0.9 if big else 0.6)


def rifle(distance=1.0):
    n = int(1.2 * SR)
    noise = rng.standard_normal(n)
    crack = (noise - lowpass_fast(noise, 2000, 1)) * env(n, 0.0003, 0.012)
    thump = lowpass_fast(noise, 300, 2) * env(n, 0.001, 0.06) * 3
    s = crack * 0.7 + thump
    # ozvěna v zákopu
    for d, g in ((0.09, 0.35), (0.21, 0.2), (0.37, 0.12)):
        k = int(d * SR)
        s[k:] += s[:-k] * g
    return lowpass_fast(s, 9000 / max(1, distance), 1) * (0.5 / distance)


def master(x):
    x = np.tanh(x * 1.4) / np.tanh(1.4)  # měkké omezení
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.8
    n = len(x)
    fade = int(0.6 * SR)
    x[:fade] *= np.linspace(0, 1, fade)
    x[-fade:] *= np.linspace(1, 0, fade)
    return x


def build(name):
    meta = json.load(open(os.path.join(REELS, f"{name}.events.json")))
    dur = meta["seconds"]
    n = int(dur * SR)
    mix = np.zeros(n)
    mix += drone(dur)
    mix += rain(dur)
    # bubny: 70 BPM, od druhé třetiny hustší, silný úder při závěrečné výzvě (cta)
    beat = 60 / 70
    cta = next((c[0] for c in meta["captions"] if c[2] == "cta"), dur * 0.8)
    t = 1.0
    while t < dur - 0.5:
        strength = 0.35 + 0.65 * min(1, t / (dur * 0.7))
        add(mix, drum(strength), t)
        if t > dur * 0.45:
            add(mix, drum(strength * 0.5), t + beat / 2)
        t += beat
    add(mix, drum(1.5), cta)
    add(mix, boom(True) * 0.6, cta)
    # události ze scénáře: granát hned, výstřel ~0,6 s po povelu (voják nejdřív zamíří)
    for ev in meta["events"]:
        at, kind = ev[0], ev[1]
        big = len(ev) > 3 and ev[3]
        if kind == "shell":
            add(mix, boom(bool(big)), at)
        elif kind == "shoot":
            add(mix, rifle(1.0), at + 0.62)
    # vzdálená ojedinělá palba v pozadí
    for at in rng.uniform(0.5, dur - 1, int(dur * 0.8)):
        add(mix, rifle(rng.uniform(3, 6)), at)
    mix = master(mix)
    stereo = np.stack([mix, np.roll(mix, int(0.012 * SR)) * 0.96], axis=1)
    wav = os.path.join(REELS, f"_{name}.wav")
    with wave.open(wav, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((stereo * 32767).astype(np.int16).tobytes())
    out = os.path.join(REELS, f"{name}_sound.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", os.path.join(REELS, f"{name}.mp4"), "-i", wav,
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", out], check=True)
    os.remove(wav)
    print("hotovo:", out)


# --- příběhový reel s voiceoverem (story.sfx.json z nahrávání, _story_vo.wav z story_vo.py) ---

def typewriter(dur):
    out = np.zeros(int(dur * SR) + SR // 2)
    t = 0.0
    while t < dur:
        n = int(0.03 * SR)
        k = rng.standard_normal(n) * env(n, 0.0003, 0.004)
        add(out, (k - lowpass_fast(k, 1800, 1)) * rng.uniform(0.25, 0.45), t)
        t += rng.uniform(0.05, 0.11)
    return out


def bell():
    # vzdálený zvon o půlnoci: neharmonické alikvoty, dlouhý dozvuk
    n = int(5 * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for f, a, d in ((196, 1, 3.5), (392 * 1.002, 0.5, 2.5), (466, 0.35, 2), (588, 0.25, 1.4), (784 * 1.01, 0.15, 1)):
        out += a * np.sin(2 * np.pi * f * t) * np.exp(-t / d)
    return out * env(n, 0.003, 10) * 0.35


def stamp():
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * (90 * np.exp(-t * 12) + 50) * t) * env(n, 0.001, 0.08)
    slap = lowpass_fast(rng.standard_normal(n), 1200, 1) * env(n, 0.0005, 0.02)
    return body * 0.9 + slap * 0.6


def whistle():
    # píšťalka důstojníka: „nad okraj!“ (kulička uvnitř = rychlý trylek)
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    trill = 1 + 0.5 * (np.sin(2 * np.pi * 34 * t) > 0)
    tone = np.sin(2 * np.pi * (2750 + 60 * np.sin(2 * np.pi * 34 * t)) * t) * trill
    e = np.minimum(1, t / 0.03) * np.clip((1.5 - t) / 0.15, 0, 1)
    breath = (rng.standard_normal(n) - lowpass_fast(rng.standard_normal(n), 2500, 1)) * 0.08
    return (tone * 0.18 + breath) * e


def chime():
    n = int(2.5 * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for at, f in ((0, 880), (0.12, 1318.5)):
        k = int(at * SR)
        tt = t[: n - k]
        out[k:] += (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 2.01 * tt)) * np.exp(-tt / 0.7)
    return out * 0.12


def reveal():
    # nadechnutí + tlumený úder: stanoviště dostalo jméno
    n = int(1.4 * SR)
    t = np.arange(n) / SR
    swell = lowpass_fast(rng.standard_normal(n), 900, 2) * np.clip(t / 0.5, 0, 1) * np.exp(-np.maximum(0, t - 0.5) / 0.15) * 1.5
    hit = np.zeros(n)
    hit[int(0.5 * SR):] = drum(0.8)[: n - int(0.5 * SR)]
    return swell + hit


def counter(dur):
    out = np.zeros(int(dur * SR) + SR // 4)
    t, gap = 0.0, 0.12
    while t < dur:
        n = int(0.012 * SR)
        add(out, np.sin(2 * np.pi * 1900 * np.arange(n) / SR) * env(n, 0.0003, 0.003) * 0.25, t)
        t += gap
        gap = max(0.035, gap * 0.93)  # zrychluje se k pětistovce
    return out


# bubny podle scénáře: (začátek, tiché úseky, od kdy dvojitý úder)
DRUMS = {"story": (11.6, [(50.4, 53.5), (59.8, 63.4)], 63.4), "day1": (11.0, [(41.6, 45.0), (52.4, 55.2)], 55.2)}


def build_story(name="story"):
    meta = json.load(open(os.path.join(REELS, f"{name}.sfx.json")))
    start, quiet_parts, double = DRUMS[name]
    dur = meta["seconds"]
    n = int(dur * SR)
    music = drone(dur) * 1.1 + rain(dur)
    fx = np.zeros(n)
    beat = 60 / 70
    # bubny: od Hegemonie, ztichnou před půlnocí a po dědicovi se rozjedou ke konci
    t = start
    while t < dur - 3:
        quiet = any(a < t < b for a, b in quiet_parts)
        if not quiet:
            strength = 0.3 + 0.7 * min(1, (t - start) / (dur - start - 10))
            add(music, drum(strength), t)
            if t > double:
                add(music, drum(strength * 0.5), t + beat / 2)
        t += beat
    for at, kind, arg in meta["sfx"]:
        if kind == "shell":
            add(fx, boom(bool(arg)), at)
        elif kind == "shoot":
            add(fx, rifle(1.0), at)
        elif kind == "type":
            add(fx, typewriter(arg), at)
        elif kind == "bell":
            add(fx, bell(), at)
        elif kind == "stamp":
            add(fx, stamp(), at)
        elif kind == "whistle":
            add(fx, whistle(), at)
        elif kind == "tick":
            add(fx, counter(arg), at)
        elif kind == "medal":
            add(fx, chime(), at)
        elif kind == "reveal":
            add(fx, reveal(), at - 0.5)
        elif kind == "barrage":
            for k in np.arange(0, arg, 0.28):
                add(fx, boom(rng.random() < 0.4) * rng.uniform(0.5, 0.9), at + k + rng.uniform(0, 0.12))
        elif kind == "drum":
            add(fx, drum(1.6), at)
            add(fx, boom(True) * 0.5, at)
        elif kind == "end":
            add(fx, drum(1.8), at)
            add(fx, boom(True) * 0.7, at)
    for at in rng.uniform(4, dur - 2, int(dur * 0.7)):
        add(fx, rifle(rng.uniform(3, 6)), at)
    # hlas: lehké teplo + krátká ozvěna zákopu
    with wave.open(os.path.join(REELS, f"_{name}_vo.wav")) as w:
        voice = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float64) / 32768
    voice = np.pad(voice, (0, max(0, n - len(voice))))[:n]
    wet = np.zeros(n)
    for d, g in ((0.043, 0.16), (0.089, 0.1), (0.15, 0.06)):
        k = int(d * SR)
        wet[k:] += voice[:-k] * g
    voice = voice + lowpass_fast(wet, 2500, 1)
    voice = np.tanh(voice * 2.2) / np.tanh(2.2)
    # ducking: hudba a efekty ustoupí, když vypravěč mluví
    level = lowpass_fast(np.abs(voice), 4, 2)
    duck = 1 - 0.6 * np.clip(level / (np.percentile(level[level > 1e-4], 60) + 1e-9), 0, 1)
    bed = (music * 0.75 + fx * 0.85) * duck
    fade = int(1.0 * SR)
    bed[-fade:] *= np.linspace(1, 0, fade)
    bed = np.tanh(bed * 1.3) / np.tanh(1.3)
    mix = bed * 0.55 + voice * 0.95
    mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.89
    stereo = np.stack([mix, np.roll(mix, int(0.008 * SR)) * 0.97], axis=1)
    wav = os.path.join(REELS, f"_{name}.wav")
    with wave.open(wav, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((stereo * 32767).astype(np.int16).tobytes())
    out = os.path.join(REELS, f"{name}_sound.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", os.path.join(REELS, f"{name}.mp4"), "-i", wav,
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-shortest", out], check=True)
    print("hotovo:", out)


if __name__ == "__main__":
    for nm in sys.argv[1:] or ["teaser", "enlist", "sides", "howto"]:
        build_story(nm) if nm in DRUMS else build(nm)
