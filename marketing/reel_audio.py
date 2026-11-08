"""Zvuk k promo videím: temný hudební podklad + bubny + déšť + dunění děl a výstřely načasované podle scénáře.

Vše je syntetizované v kódu (žádné cizí nahrávky → žádná autorská práva). Výstup: marketing/reels/<název>_sound.mp4
Použití: python marketing/reel_audio.py [teaser enlist sides howto]
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


if __name__ == "__main__":
    for nm in sys.argv[1:] or ["teaser", "enlist", "sides", "howto"]:
        build(nm)
