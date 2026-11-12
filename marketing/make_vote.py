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
from day_art import grad, shade, bayer, light  # noqa: E402

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
    """řez zemí: nahoře explodují granáty, dole v hlubokém krytu (trámy, lucerna, lavice) sedí vojáci v bezpečí"""
    im = Image.new("RGBA", (AW, AH), P["ink"] + (255,))
    grad(im, (0, 0, AW, 16), [P["dark"], P["blood"], P["rust"]])
    d = ImageDraw.Draw(im)
    # země: hlína v dithered vrstvách, kameny
    rnd = random.Random(4)
    for y in range(16, AH):
        for x in range(AW):
            k = (y - 16) / (AH - 16)
            d.point((x, y), fill=P["mud2"] if bayer(x, y) < 0.5 - k * 0.4 else (P["mud1"] if bayer(x, y) < 0.8 - k * 0.3 else P["mud0"]))
    for _ in range(18):
        x, y = rnd.randrange(AW), rnd.randrange(30, AH)
        d.point((x, y), fill=P["mud3"]); d.point((x + 1, y), fill=P["sand"])
    d.line((0, 16, AW, 16), fill=P["olive"])
    # povrch: kráter, plechová střecha s pytli nad krytem, dopady granátů
    d.rectangle((18, 12, 56, 15), fill=P["steel"])
    for i in range(0, 38, 4):
        d.line((18 + i, 12, 18 + i, 15), fill=P["grey"])
    for i in range(7):
        d.rectangle((17 + i * 6, 9 - (i % 2), 22 + i * 6, 12 - (i % 2)), fill=P["bone"] if i % 2 else P["sand"])
    d.ellipse((2, 15, 12, 19), fill=P["ink"])
    for cx, cy, r in ((8, 9, 6), (62, 8, 7)):  # výbuchy po stranách
        d.ellipse((cx - r, cy - r + 2, cx + r, cy + r - 1), fill=P["fire"]); d.ellipse((cx - r // 2, cy - r // 2 + 1, cx + r // 2, cy + r // 2), fill=P["gold"]); d.point((cx, cy), fill=P["white"])
        for k in range(5):
            d.point((cx + rnd.randrange(-9, 10), cy + rnd.randrange(-9, 4)), fill=P["mud3"])
    for i in range(6):  # padající granát
        d.point((44 + i, 0 + i * 2), fill=P["pale"] if i else P["white"])
    # komora: trámy, strop, podlaha, schody, lucerna se světlem, lavice a dva vojáci
    cx0, cy0, cx1, cy1 = 14, 24, 58, 46
    d.rectangle((cx0 - 2, cy0 - 3, cx1 + 2, cy1 + 2), fill=P["ink"])
    d.rectangle((cx0, cy0, cx1, cy1), fill=P["mud0"])
    for x in range(cx0, cx1, 6):
        d.rectangle((x, cy0, x + 1, cy1), fill=P["mud2"])
    d.rectangle((cx0 - 2, cy0 - 3, cx1 + 2, cy0), fill=P["mud3"]); d.line((cx0 - 2, cy0 - 3, cx1 + 2, cy0 - 3), fill=P["sand"])
    d.rectangle((cx0, cy1 - 2, cx1, cy1), fill=P["mud2"])
    for k in range(3):  # schody dolů vlevo
        d.rectangle((cx0 - 8 + k * 3, cy0 + 4 + k * 4, cx0 - 1, cy0 + 7 + k * 4), fill=P["mud3"] if k % 2 else P["mud2"])
    d.rectangle((33, cy0 + 1, 34, cy0 + 4), fill=P["ink"]); d.rectangle((31, cy0 + 4, 36, cy0 + 8), fill=P["gold"]); d.rectangle((32, cy0 + 5, 35, cy0 + 7), fill=P["white"])
    light(im, 33, cy0 + 6, 18, strength=0.9, box=(cx0, cy0, cx1, cy1), steps=3)
    d = ImageDraw.Draw(im)
    d.rectangle((20, cy1 - 7, 52, cy1 - 5), fill=P["mud3"])  # lavice
    try:
        s = sprite("hegemony_south.png")
        for x in (21, 38):
            im.alpha_composite(s.crop((6, 1, 26, 22)), (x, cy1 - 24))
    except FileNotFoundError:
        pass
    return im


def doctor_art():
    """dugout-lazaret: lampa nad operačním lůžkem, raněný s obvazem pod dekou, doktor nad ním, police s lahvemi, červený kříž"""
    im = Image.new("RGBA", (AW, AH), P["ink"] + (255,))
    d = ImageDraw.Draw(im)
    for y in range(AH):
        for x in range(AW):
            d.point((x, y), fill=P["mud1"] if (x // 3) % 2 else P["mud0"])  # roubení z prken
    d.rectangle((0, 0, AW, 6), fill=P["mud2"]); d.line((0, 6, AW, 6), fill=P["ink"]); d.line((0, 0, AW, 0), fill=P["sand"])
    for x in (2, AW - 5):
        d.rectangle((x, 0, x + 2, AH), fill=P["mud3"]); d.line((x, 0, x, AH), fill=P["sand"])
    d.rectangle((0, 40, AW, AH), fill=P["mud2"])  # podlaha
    for x in range(0, AW, 8):
        d.line((x, 40, x, AH), fill=P["mud1"])
    d.line((0, 40, AW, 40), fill=P["ink"])
    # police s lahvemi a obvazy
    d.rectangle((44, 14, 66, 15), fill=P["mud3"]); d.rectangle((44, 22, 66, 23), fill=P["mud3"])
    for i, col in enumerate((P["water"], P["olive"], P["rust"], P["pale"], P["water"])):
        d.rectangle((46 + i * 4, 9, 48 + i * 4, 14), fill=col); d.point((47 + i * 4, 8), fill=P["bone"])
    for i in range(4):
        d.rectangle((46 + i * 5, 17, 50 + i * 5, 22), fill=P["white"]); d.line((46 + i * 5, 20, 50 + i * 5, 20), fill=P["pale"])
    # kříž na stěně
    d.rectangle((26, 9, 36, 19), fill=P["pale"]); d.rectangle((30, 10, 32, 18), fill=P["rust"]); d.rectangle((27, 13, 35, 15), fill=P["rust"])
    # lůžko: rám, matrace, dekra, polštář, raněný (hlava s obvazem, ruka přes deku)
    d.rectangle((3, 33, 40, 36), fill=P["ink"]); d.rectangle((4, 29, 39, 33), fill=P["steel"]); d.rectangle((4, 29, 39, 30), fill=P["grey"])
    d.rectangle((3, 36, 5, 44), fill=P["ink"]); d.rectangle((38, 36, 40, 44), fill=P["ink"])
    d.rectangle((6, 26, 14, 29), fill=P["white"]); d.line((6, 26, 14, 26), fill=P["pale"])
    d.ellipse((7, 21, 14, 28), fill=P["pale"]); d.rectangle((7, 21, 14, 23), fill=P["white"]); d.point((10, 25), fill=P["ink"]); d.line((7, 23, 14, 23), fill=P["rust"])  # obvaz s krví
    d.rectangle((13, 24, 38, 30), fill=P["olive"]); d.rectangle((13, 24, 38, 25), fill=P["khaki"])
    for x in range(16, 38, 5):
        d.line((x, 25, x, 30), fill=P["dark"])
    d.rectangle((23, 22, 28, 25), fill=P["pale"])  # ruka
    # lampa nad lůžkem se světlem
    d.line((22, 0, 22, 9), fill=P["ink"]); d.rectangle((17, 9, 27, 12), fill=P["ink"]); d.rectangle((18, 10, 26, 12), fill=P["white"])
    light(im, 22, 22, 24, strength=1.2, box=(3, 8, 44, 41), steps=3)
    d = ImageDraw.Draw(im)
    try:
        im.alpha_composite(sprite("hegemony_medic_south.png"), (40, 12))
    except FileNotFoundError:
        pass
    d.rectangle((52, 36, 62, 41), fill=P["ink"]); d.rectangle((53, 37, 61, 40), fill=P["mud3"]); d.rectangle((56, 37, 58, 40), fill=P["rust"])  # brašna lékaře
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
    text_c(d, W // 2, 248, "THE WINNER IS ANNOUNCED IN THE GAZETTE.", font(8), P["gold"])
    footer(d, H - 11)
    out = os.path.join(PROMO, "vote_orders_1.jpg")
    up(im, K).convert("RGB").save(out, quality=95, subsampling=0)
    print(out)


if __name__ == "__main__":
    make()
