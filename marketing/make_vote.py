"""Post hlasování o rozkazech (1080×1350): jedno hlasování, tři volby pro všechny (DUGOUTS, DOCTOR, AMMO), každá s ilustrací ze hry.
Použití: python marketing/make_vote.py  → marketing/promo/vote_orders_1.jpg
"""
import math
import os
import random
import sys

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_posts import P, W, H, K, canvas, font, text_c, sprite, up, footer  # noqa: E402
from day_art import grad, shade, bayer  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROMO = os.path.join(ROOT, "marketing", "promo")
AW, AH = 70, 50  # ilustrace (x, y rozměr)

OPTIONS = [
    ("DUGOUTS", "DEEP SHELTERS", "FEWER HITS TAKEN"),
    ("DOCTOR", "A SURGEON ARRIVES", "FEWER DEAD, HEALS FAST"),
    ("AMMO", "AMMUNITION TRAIN", "SHOOTERS HIT 40% MORE"),
]


def art_base(sky_cols, ground_cols, horizon=32):
    im = Image.new("RGBA", (AW, AH), P["ink"] + (255,))
    grad(im, (0, 0, AW, horizon), sky_cols)
    d = ImageDraw.Draw(im)
    for y in range(horizon, AH):
        for x in range(AW):
            d.point((x, y), fill=ground_cols[0] if bayer(x, y) < 0.5 - (y - horizon) / 40 else ground_cols[1])
    return im


def dugout_art():
    im = art_base([P["dark"], P["mud0"], P["blood"], P["rust"]], (P["mud1"], P["mud0"]))
    d = ImageDraw.Draw(im)
    # hliněný násyp s pytli nahoře, trámový rám vchodu, tma, schody
    for y in range(18, 44):
        k = (y - 18) / 26
        half = int(30 - (1 - math.sqrt(max(0, 1 - (1 - k) ** 2))) * 8)
        for x in range(35 - half, 35 + half):
            d.point((x, y), fill=P["mud2"] if (x * 7 + y * 3) % 5 < 2 else (P["mud0"] if x > 35 + half * 0.4 else P["mud1"]))
    for i in range(6):
        d.rectangle((12 + i * 7, 17 - (i % 2), 18 + i * 7, 20 - (i % 2)), fill=P["bone"] if i % 2 else P["sand"])
    d.rectangle((26, 26, 44, 43), fill=P["ink"])
    d.rectangle((24, 24, 27, 44), fill=P["mud3"]); d.rectangle((43, 24, 46, 44), fill=P["mud3"]); d.rectangle((24, 23, 46, 26), fill=P["mud3"])
    d.line((24, 23, 46, 23), fill=P["sand"])
    for k in range(4):
        d.line((28, 38 + k, 42, 38 + k), fill=P["mud1"] if k % 2 else P["mud2"])
    # granát padá a vybuchuje vedle (kryt drží)
    for i in range(7):
        d.point((60 - i * 2, 4 + i * 3), fill=P["pale"] if i else P["white"])
    d.ellipse((54, 40, 66, 48), fill=P["fire"]); d.ellipse((57, 42, 63, 47), fill=P["gold"]); d.point((60, 44), fill=P["white"])
    try:
        im.alpha_composite(sprite("hegemony_east.png").crop((6, 0, 26, 32)), (2, 14))
    except FileNotFoundError:
        pass
    return im


def doctor_art():
    im = art_base([P["dark"], P["mud0"], P["mud1"], P["mud2"]], (P["mud2"], P["mud1"]), horizon=14)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, AW, 13), fill=P["mud1"])
    for x in range(0, AW, 7):
        d.line((x, 0, x, 13), fill=P["mud0"])
    # lampa, červený kříž, lůžko s raněným, doktor
    d.rectangle((54, 2, 64, 12), fill=P["pale"]); d.rectangle((58, 3, 60, 11), fill=P["rust"]); d.rectangle((55, 6, 63, 8), fill=P["rust"])
    d.rectangle((28, 20, 31, 22), fill=P["gold"]); d.line((29, 14, 29, 19), fill=P["ink"])
    d.rectangle((5, 31, 38, 40), fill=P["steel"]); d.rectangle((5, 31, 38, 33), fill=P["grey"])
    d.rectangle((5, 28, 14, 31), fill=P["white"])
    d.rectangle((3, 40, 6, 47), fill=P["ink"]); d.rectangle((36, 40, 39, 47), fill=P["ink"])
    d.ellipse((7, 26, 13, 31), fill=P["pale"])
    d.rectangle((6, 25, 13, 27), fill=P["white"])  # obvaz
    try:
        im.alpha_composite(sprite("hegemony_medic_south.png"), (36, 14))
    except FileNotFoundError:
        pass
    return im


def ammo_art():
    im = art_base([P["dark"], P["mud0"], P["blood"], P["rust"]], (P["mud1"], P["mud0"]), horizon=22)
    d = ImageDraw.Draw(im)
    for x in range(0, AW, 9):  # pytlový val
        d.rectangle((x, 20, x + 8, 25), fill=P["ink"]); d.rectangle((x + 1, 21, x + 7, 24), fill=P["bone"] if (x // 9) % 2 else P["sand"])

    def crate(x, y, w=16, h=11, tone=0):
        d.rectangle((x - 1, y - 1, x + w, y + h), fill=P["ink"])
        d.rectangle((x, y, x + w - 1, y + h - 1), fill=P["mud3"] if tone else P["mud2"])
        d.rectangle((x, y, x + w - 1, y + 1), fill=P["sand"])
        d.rectangle((x + 2, y, x + 3, y + h - 1), fill=P["mud1"]); d.rectangle((x + w - 4, y, x + w - 3, y + h - 1), fill=P["mud1"])
        d.rectangle((x + 5, y + 4, x + 10, y + 6), fill=P["ink"]); d.line((x + 6, y + 5, x + 9, y + 5), fill=P["rust"])
    crate(4, 36); crate(21, 36, tone=1); crate(4, 25); crate(12, 14 + 12, tone=1)
    for r, yy in enumerate((22, 36)):  # police s náboji
        d.rectangle((44, yy + 7, 66, yy + 9), fill=P["mud2"])
        for i in range(6):
            x = 45 + i * 4
            d.rectangle((x, yy - 2, x + 2, yy + 7), fill=P["ink"]); d.line((x + 1, yy - 1, x + 1, yy + 6), fill=P["gold"] if r == 0 else P["yellow"]); d.rectangle((x, yy - 2, x + 2, yy), fill=P["rust"])
    return im


def make():
    im = canvas()
    grad(im, (0, 0, W, H), [P["ink"], P["dark"], P["mud0"]])
    shade(im, (0, 0, W, H), strength=0.4)
    d = ImageDraw.Draw(im)
    text_c(d, W // 2, 8, "THE FRONT DECIDES", font(14, True), P["gold"])
    text_c(d, W // 2, 27, "THREE ORDERS. PICK ONE.", font(8), P["pale"])
    arts = (dugout_art(), doctor_art(), ammo_art())
    for i, ((kw, title, line), art) in enumerate(zip(OPTIONS, arts)):
        y = 42 + i * 60
        d.rectangle((6, y, W - 7, y + 56), fill=P["dark"], outline=P["gold"])
        d.rectangle((6, y, 9, y + 56), fill=P["gold"])
        im.alpha_composite(art, (12, y + 3))
        d.rectangle((11, y + 2, 12 + AW, y + 3 + AH), outline=P["mud3"])
        d.text((90, y + 6), kw, font=font(14, True), fill=P["gold"])
        d.text((90, y + 28), title, font=font(8, True), fill=P["white"])
        d.text((90, y + 40), line, font=font(8), fill=P["pale"])
    d.rectangle((0, 224, W, H), fill=P["dark"])
    d.line((0, 224, W, 224), fill=P["gold"])
    text_c(d, W // 2, 228, "COMMENT ONE WORD.", font(8, True), P["white"])
    text_c(d, W // 2, 239, "YOUR SOLDIER IS YOUR VOTE.", font(8), P["pale"])
    text_c(d, W // 2, 248, "THE WINNING ORDER RUNS 3 DAYS.", font(8), P["gold"])
    footer(d, H - 11)
    out = os.path.join(PROMO, "vote_orders_1.jpg")
    up(im, K).convert("RGB").save(out, quality=95, subsampling=0)
    print(out)


if __name__ == "__main__":
    make()
