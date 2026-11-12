"""Post R.I.P. (1080×1350): první padlí bombardování. Hřbitov při soumraku, kříže s jmény padlých, vojáci před hroby, v dálce výbuchy.
Podklady: node tools/rip-data.mjs → marketing/reels/rip.data.json (padlí zadaného dne, ranění, strana s největšími ztrátami).
Použití: python marketing/make_rip.py  → marketing/promo/rip_1.jpg
"""
import json
import math
import os
import random
import sys

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_posts import P, W, H, K, canvas, font, text_c, sprite, up, footer, mud  # noqa: E402
from day_art import grad, light, shade  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROMO = os.path.join(ROOT, "marketing", "promo")


def cross(im, cx, foot, s, name=None, helmet=False, flowers=False):
    d = ImageDraw.Draw(im)
    w, h = int(14 * s), int(5 * s)
    d.ellipse((cx - w // 2 - 1, foot - h - 1, cx + w // 2 + 1, foot + 1), fill=P["ink"])
    d.ellipse((cx - w // 2, foot - h, cx + w // 2, foot), fill=P["mud2"])
    d.line((cx - w // 3, foot - h + 1, cx, foot - h + 1), fill=P["mud3"])
    ph, bw = int(20 * s), max(2, int(2.2 * s))
    d.rectangle((cx - bw // 2 - 1, foot - h - ph, cx + bw // 2 + 1, foot - h), fill=P["ink"])
    d.rectangle((cx - bw // 2, foot - h - ph + 1, cx + bw // 2, foot - h), fill=P["mud3"])
    d.line((cx - bw // 2, foot - h - ph + 1, cx - bw // 2, foot - h), fill=P["sand"])
    ay, aw = foot - h - int(ph * 0.68), int(11 * s)
    d.rectangle((cx - aw // 2 - 1, ay - 1, cx + aw // 2 + 1, ay + bw), fill=P["ink"])
    d.rectangle((cx - aw // 2, ay, cx + aw // 2, ay + bw - 1), fill=P["mud3"])
    d.line((cx - aw // 2, ay, cx + aw // 2, ay), fill=P["sand"])
    if name and s >= 1.2:
        f = font(6, True)
        tw = int(d.textlength(name, font=f)) + 4
        d.rectangle((cx - tw // 2 - 1, ay + bw + 2, cx + tw // 2 + 1, ay + bw + 11), fill=P["ink"])
        d.rectangle((cx - tw // 2, ay + bw + 3, cx + tw // 2, ay + bw + 10), fill=P["bone"])
        d.text((cx - tw // 2 + 2, ay + bw + 3), name, font=f, fill=P["ink"])
    if helmet:
        hy = foot - h - ph - 1
        d.pieslice((cx - int(3.6 * s), hy - int(2.4 * s), cx + int(3.6 * s), hy + int(2.4 * s)), 180, 360, fill=P["ink"])
        d.pieslice((cx - int(2.8 * s), hy - int(1.8 * s), cx + int(2.8 * s), hy + int(1.8 * s)), 180, 360, fill=P["steel"])
    if flowers:
        for i in range(3 + int(s)):
            d.point((cx - w // 3 + int(i * w / 3.5), foot - h + 1 + (i % 2)), fill=P["rust"] if i % 2 else P["gold"])


def make():
    data = json.load(open(os.path.join(ROOT, "marketing", "reels", "rip.data.json")))
    lead = data["lead"]
    fac = ("hegemony", "concord")[lead]
    n = data["byCount"][lead]
    names = data["names"]
    im = canvas()
    d = ImageDraw.Draw(im)
    rnd = random.Random(5)
    grad(im, (0, 0, W, 150), [P["ink"], P["dark"], P["mud0"], P["blood"], P["rust"], P["fire"]])
    for i in range(7):  # pásy mraků
        y = 12 + i * 17
        d.rectangle((i * 31 - 20, y, i * 31 + 52, y + 3), fill=P["dark"] if i % 2 else P["mud0"])
    for base, col, amp, ph in ((136, P["mud0"], 9, 0.9), (146, P["ink"], 7, 2.4)):
        for x in range(W):
            y = int(base - amp * (0.5 + 0.5 * math.sin(x * 0.05 + ph)) - amp * 0.3 * math.sin(x * 0.16))
            d.line((x, y, x, 160), fill=col)
    for i in range(24):  # siluety smrků
        x, h = rnd.randrange(W), 5 + rnd.randrange(6)
        for k in range(h):
            w = max(1, int(k * 0.35))
            d.line((x - w // 2, 144 - h + k, x + w // 2, 144 - h + k), fill=P["ink"])
    mud(im, 146, 214, seed=7)
    shade(im, (0, 146, W, 214), strength=0.6)
    # dálka: záblesky granátů na obzoru
    for x, y, r in ((30, 138, 24), (118, 142, 30), (176, 136, 22), (74, 140, 18)):
        light(im, x, y, r, strength=0.9, steps=2)
        d.ellipse((x - 2, y - 2, x + 2, y + 2), fill=P["gold"])
        d.point((x, y), fill=P["white"])
    d = ImageDraw.Draw(im)
    # hroby: do 12, tři řady; první tři dostanou jména
    rows = [(3, 1.5, 178), (4, 1.15, 164), (5, 0.85, 152)]
    gi, items = 0, []
    for cnt, s, foot in rows:
        for i in range(cnt):
            if gi >= min(12, max(n, 0)):
                break
            cx = int(24 + (i + (0.5 if cnt < 5 else 0.3)) * (W - 48) / cnt + math.sin(gi * 2.3) * 3)
            items.append((cx, foot, s, gi))
            gi += 1
    for cx, foot, s, idx in sorted(items, key=lambda x: x[1]):
        cross(im, cx, foot, s, names[idx][:8] if idx < 3 and idx < len(names) else None, helmet=idx % 2 == 0, flowers=idx % 3 != 1)
    # vojáci před hroby (zády k nám)
    for x, foot in ((38, 216), (92, 220), (146, 214)):
        try:
            sp = sprite(f"{fac}_north.png")
            sp = sp.resize((44, 44), Image.NEAREST)
            im.alpha_composite(sp, (x - 22, foot - 41))
        except FileNotFoundError:
            pass
    d = ImageDraw.Draw(im)
    # texty
    text_c(d, W // 2, 22, "R.I.P.", font(16, True), P["gold"])
    text_c(d, W // 2, 42, "THE FIRST NIGHT OF THE BARRAGE", font(6, True), P["pale"])
    d.rectangle((0, 214, W, H), fill=P["dark"])
    d.line((0, 214, W, 214), fill=P["gold"])
    side = data["leadName"].upper()
    wd = data["wounded"][lead]
    text_c(d, W // 2, 217, f"{n} OF THE {side} FELL." if n else f"THE {side} LINES HELD.", font(8, True), P["white"])
    line, y = "", 228
    for nm in names:
        if len(line) + len(nm) + 3 > 34:
            text_c(d, W // 2, y, line, font(8), P["pale"]); y += 11; line = ""
        line = f"{line} · {nm}" if line else nm
    if line:
        text_c(d, W // 2, y, line, font(8), P["pale"]); y += 11
    text_c(d, W // 2, y + 1, (f"{wd} WOUNDED. " if wd else "") + "TWO MORE NIGHTS.", font(8), P["gold"])
    footer(d, H - 11)
    out = os.path.join(PROMO, "rip_1.jpg")
    up(im, K).convert("RGB").save(out, quality=95, subsampling=0)
    print(out)


if __name__ == "__main__":
    make()
