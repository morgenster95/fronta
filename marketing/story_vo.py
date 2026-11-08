"""Voiceover k příběhovému promo videu (reel „story“): Microsoft Edge TTS (zdarma, bez klíče) → WAV + časy vět.

Každá věta má pevný začátek v sekundách (stejné časy používá scénář ve web/src/reel.js → záběry sedí na hlas).
Skript ověří, že se věta vejde před začátek další, a uloží marketing/reels/story.vo.json (začátek, délka, text).
Použití: python marketing/story_vo.py [hlas]
"""
import asyncio
import json
import os
import subprocess
import sys
import wave

import edge_tts
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REELS = os.path.join(ROOT, "marketing", "reels")
TMP = os.path.join(REELS, "_vo")
VOICE = sys.argv[1] if len(sys.argv) > 1 else "en-GB-RyanNeural"
SR = 44100

# [začátek s, text]; časy drží krok se scénářem „story“ v reel.js
LINES = [
    [2.6, "Six winters. One valley of mud."],
    [6.4, "The Great War ended everywhere else. Here... it never did."],
    [11.6, "On one side, the Hegemony. Field grey, and iron discipline."],
    [17.0, "On the other, the Concord. Free men in khaki, who only want to go home."],
    [23.2, "And between them, a front full of empty posts. Rifles with no names."],
    [29.2, "That's where you come in."],
    [31.2, "Comment your side under our pinned reel, and a soldier takes the line. With your name on it. For good."],
    [39.4, "Rifleman. Sniper. Stretcher bearer. Every soldier gets a trade, a rank, and a service record, written one day at a time."],
    [51.0, "Every midnight, the front turns. Men are wounded. Men are promoted. Some don't come back."],
    [60.2, "But no name dies out. When a soldier falls, the next of the family picks up the rifle."],
    [67.0, "And every day, you decide what happens next. Hold the line, or go over the top. Vote in the comments."],
    [76.0, "Five hundred claimed soldiers, and the big guns wake up."],
    [80.2, "The first hundred recruits wear the First Wave medal. Forever."],
    [85.6, "Find yourself on the front. Link in bio."],
    [89.8, "Comment Concord... or Hegemony."],
    [92.6, "Your front needs you."],
]
SECONDS = 97


async def speak(text, path):
    # pomalejší a hlubší vypravěč
    await edge_tts.Communicate(text, VOICE, rate="-6%", pitch="-6Hz").save(path)


def to_wav(src, dst):
    # oříznout ticho na začátku/konci, mono 44,1 kHz
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-af",
                    "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse",
                    "-ac", "1", "-ar", str(SR), dst], check=True)
    with wave.open(dst) as w:
        return np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768


def main():
    os.makedirs(TMP, exist_ok=True)
    track = np.zeros(int(SECONDS * SR), np.float32)
    meta = []
    ok = True
    for i, (at, text) in enumerate(LINES):
        mp3 = os.path.join(TMP, f"{i:02d}.mp3")
        asyncio.run(speak(text, mp3))
        x = to_wav(mp3, os.path.join(TMP, f"{i:02d}.wav"))
        dur = len(x) / SR
        nxt = LINES[i + 1][0] if i + 1 < len(LINES) else SECONDS - 1
        flag = "" if at + dur + 0.25 <= nxt else f"  !!! přetéká o {at + dur + 0.25 - nxt:.2f} s"
        ok = ok and not flag
        print(f"{at:6.1f}  {dur:5.2f} s  {text}{flag}")
        s = int(at * SR)
        track[s:s + len(x)] += x[: len(track) - s]
        meta.append([at, round(dur, 2), text])
    with wave.open(os.path.join(REELS, "_story_vo.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(track, -1, 1) * 32767).astype(np.int16).tobytes())
    json.dump({"seconds": SECONDS, "voice": VOICE, "lines": meta}, open(os.path.join(REELS, "story.vo.json"), "w"), indent=1)
    print("OK" if ok else "NĚKTERÉ VĚTY PŘETÉKAJÍ")


if __name__ == "__main__":
    main()
