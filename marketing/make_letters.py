"""Post „Letters from the front“ (1080×1350): výzva, ať hráči napíšou pořádný dopis domů do komentářů
(jak se jim na frontě žije, koho viděli odnášet na nosítkách, co by pro ně znamenala kóta). Nejlepší dopisy se přečtou v dalším reelu.
Noc v krytu: dva vojáci (Hegemonie a Concord) u stolu z prken, svíčka, rozepsaný dopis, obálka s pečetí.
Použití: python marketing/make_letters.py  → marketing/promo/letters_1.jpg
"""
import os
import random
import sys

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_posts import P, W, H, K, canvas, font, vt, text_c, sprite, up, footer  # noqa: E402
from day_art import planks, light, paper, shade, sandbag_wall, bayer  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROMO = os.path.join(ROOT, "marketing", "promo")


def scribble(d, x0, y, x1, rnd, col):
    """řádek rukopisu: slova z pixelových tahů různé délky"""
    x = x0
    while x < x1 - 4:
        w = rnd.randrange(3, 11)
        for k in range(min(w, x1 - x)):
            d.point((x + k, y + (1 if (k + rnd.randrange(3)) % 3 == 0 else 0)), fill=col)
            if rnd.random() < 0.25:
                d.point((x + k, y - 1), fill=col)
        x += w + 2


def candle(im, x, y):
    d = ImageDraw.Draw(im)
    d.rectangle((x - 2, y - 9, x + 1, y), fill=P["pale"])
    d.line((x - 2, y - 9, x - 2, y), fill=P["white"])
    d.rectangle((x - 4, y, x + 3, y + 1), fill=P["steel"])
    d.point((x - 1, y - 10), fill=P["ink"])
    d.line((x - 1, y - 14, x - 1, y - 11), fill=P["gold"])
    d.point((x - 1, y - 15), fill=P["white"])
    d.point((x, y - 12), fill=P["fire"])
    d.point((x - 2, y - 12), fill=P["fire"])


def envelope(d, x, y, w=30, h=18):
    d.rectangle((x, y, x + w, y + h), fill=P["bone"], outline=P["mud2"])
    d.line((x, y, x + w // 2, y + h // 2 + 1), fill=P["sand"])
    d.line((x + w, y, x + w // 2, y + h // 2 + 1), fill=P["sand"])
    d.ellipse((x + w // 2 - 3, y + h // 2 - 2, x + w // 2 + 3, y + h // 2 + 4), fill=P["rust"])
    d.point((x + w // 2 - 1, y + h // 2), fill=P["fire"])
    scribble(d, x + 4, y + h - 4, x + w - 10, random.Random(9), P["mud1"])


def make():
    im = canvas()
    d = ImageDraw.Draw(im)
    rnd = random.Random(11)
    # kryt: roubení z fošen, trám nahoře, pytle u stropu
    planks(im, (0, 0, W, 176), seed=4, vertical=True)
    d.rectangle((0, 0, W, 10), fill=P["ink"])
    sandbag_wall(im, (0, 0, W, 14), seed=8)
    d.rectangle((0, 14, W, 19), fill=P["mud1"])
    d.line((0, 19, W, 19), fill=P["ink"])
    for x in (18, W - 22):
        d.rectangle((x, 19, x + 5, 176), fill=P["mud1"])
        d.line((x + 5, 19, x + 5, 176), fill=P["ink"])
        d.line((x, 19, x, 176), fill=P["mud2"])
    # na hřebíku visí helma a fotka
    d.ellipse((40, 42, 58, 52), fill=P["steel"], outline=P["ink"])
    d.rectangle((38, 50, 60, 52), fill=P["water"])
    d.point((49, 40), fill=P["sand"])
    d.rectangle((W - 60, 38, W - 44, 56), fill=P["pale"], outline=P["mud1"])
    d.rectangle((W - 58, 40, W - 46, 50), fill=P["sand"])
    d.ellipse((W - 55, 41, W - 49, 47), fill=P["mud3"])
    d.point((W - 52, 36), fill=P["sand"])
    # vojáci po stranách stolu (sprity ze hry ×2), Hegemonie vlevo, Concord vpravo, oba skloněni nad dopisem
    for name, x in (("hegemony_east.png", -8), ("concord_west.png", W - 56)):
        try:
            s = up(sprite(name), 2)
            im.alpha_composite(s, (x, 116))  # za stolem, deska je zakryje od pasu
        except FileNotFoundError:
            pass
    d = ImageDraw.Draw(im)
    planks(im, (0, 168, W, 214), seed=6, vertical=False)  # deska stolu přes nohy vojáků
    d.line((0, 168, W, 168), fill=P["bone"])
    # dopis, obálka, tužka, svíčka
    paper(im, (64, 124, 152, 196), seed=5)
    d = ImageDraw.Draw(im)
    d.text((70, 127), "DEAR MOTHER,", font=font(8, True), fill=P["mud1"])
    for i, y in enumerate(range(144, 192, 6)):
        scribble(d, 70, y, 146 - (18 if i == 7 else 0), rnd, P["mud1"])
    d.line((150, 186, 166, 172), fill=P["gold"])  # tužka
    d.line((151, 186, 167, 172), fill=P["fire"])
    d.point((150, 187), fill=P["ink"])
    envelope(d, 16, 180)
    candle(im, 178, 182)
    light(im, 177, 170, 92, strength=1.0, steps=3)
    shade(im, (0, 0, W, 214), strength=0.8)
    # textová část
    d = ImageDraw.Draw(im)
    d.rectangle((0, 214, W, H), fill=P["dark"])
    d.line((0, 214, W, 214), fill=P["gold"])
    text_c(d, W // 2, 26, "LETTERS", font(16, True), P["gold"])
    text_c(d, W // 2, 44, "FROM THE FRONT", font(8, True), P["white"])
    text_c(d, W // 2, 219, "WRITE YOUR LETTER HOME", font(8, True), P["white"])
    text_c(d, W // 2, 232, "IN THE COMMENTS. TAKE YOUR TIME.", font(8), P["pale"])
    text_c(d, W // 2, 244, "THE BEST ARE READ ON THE FRONT.", font(8), P["gold"])
    footer(d, H - 11)
    out = os.path.join(PROMO, "letters_1.jpg")
    up(im, K).convert("RGB").save(out, quality=95, subsampling=0)
    print(out)


if __name__ == "__main__":
    make()
