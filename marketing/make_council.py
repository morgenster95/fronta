"""Post „Front Council“ (1080×1350): hráči píšou do komentářů, co má jejich strana udělat dál; nejvíc olajkovaný nápad každé strany se stane skutečností
(rozkaz nebo stavba ve hře, nebo hlasování mezi nejlepšími). Velitelský kryt: dva důstojníci (Hegemonie a Concord) nad mapou fronty, špendlíky, lampa.
Použití: python marketing/make_council.py  → marketing/promo/council_1.jpg
"""
import os
import random
import sys

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_posts import P, W, H, K, canvas, font, vt, text_c, sprite, up, footer  # noqa: E402
from day_art import planks, light, paper, shade, sandbag_wall  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROMO = os.path.join(ROOT, "marketing", "promo")


def pin(d, x, y, col):
    d.rectangle((x - 1, y - 3, x + 1, y - 1), fill=col)
    d.point((x - 1, y - 3), fill=P["white"])
    d.line((x, y, x, y + 2), fill=P["ink"])


def lamp(im, x, y):
    d = ImageDraw.Draw(im)
    d.line((x, 19, x, y - 8), fill=P["mud1"])
    d.rectangle((x - 5, y - 8, x + 5, y - 6), fill=P["ink"])
    d.rectangle((x - 4, y - 6, x + 4, y + 4), fill=P["gold"], outline=P["ink"])
    d.rectangle((x - 2, y - 4, x + 2, y + 2), fill=P["white"])
    d.rectangle((x - 5, y + 4, x + 5, y + 5), fill=P["ink"])


def make_raw():
    im = canvas()
    d = ImageDraw.Draw(im)
    rnd = random.Random(21)
    planks(im, (0, 0, W, 176), seed=14, vertical=True)
    d.rectangle((0, 0, W, 10), fill=P["ink"])
    sandbag_wall(im, (0, 0, W, 14), seed=18)
    d.rectangle((0, 14, W, 19), fill=P["mud1"])
    d.line((0, 19, W, 19), fill=P["ink"])
    for x in (14, W - 18):
        d.rectangle((x, 19, x + 5, 176), fill=P["mud1"])
        d.line((x + 5, 19, x + 5, 176), fill=P["ink"])
        d.line((x, 19, x, 176), fill=P["mud2"])
    # důstojníci po stranách stolu (sprity ze hry ×2)
    for name, x in (("hegemony_officer_east.png", -6), ("concord_officer_west.png", W - 58)):
        try:
            im.alpha_composite(up(sprite(name), 2), (x, 100))
        except FileNotFoundError:
            pass
    d = ImageDraw.Draw(im)
    planks(im, (0, 150, W, 214), seed=16, vertical=False)  # deska stolu
    d.line((0, 150, W, 150), fill=P["bone"])
    # mapa fronty na stole: zákopy dvou stran, země nikoho, špendlíky, kóta uprostřed
    paper(im, (40, 118, 176, 206), seed=7)
    d = ImageDraw.Draw(im)
    for y0, col in ((140, P["steel"]), (186, P["olive"])):
        pts = [(46 + i * 6, y0 + (3 if (i // 2) % 2 else 0)) for i in range(22)]
        for a, b in zip(pts, pts[1:]):
            d.line((*a, *b), fill=col)
    d.polygon([(100, 160), (112, 152), (126, 160), (118, 170), (104, 170)], outline=P["mud2"], fill=P["pale"])
    d.text((104, 158), "304", font=font(6, True), fill=P["mud1"])
    for (x, y) in ((56, 131), (80, 133), (150, 132), (132, 135)):
        pin(d, x, y, P["rust"] if x < 100 else P["rust"])
    for (x, y) in ((58, 195), (96, 192), (140, 196), (160, 193)):
        pin(d, x, y, P["gold"])
    d.line((60, 133, 104, 160), fill=P["rust"])  # šipka útoku
    d.line((104, 160, 100, 156), fill=P["rust"]); d.line((104, 160, 108, 158), fill=P["rust"])
    lamp(im, 26, 76)
    light(im, 26, 76, 70, strength=0.8, steps=3)
    light(im, 108, 150, 90, strength=0.7, steps=3)
    shade(im, (0, 0, W, 214), strength=0.8)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 214, W, H), fill=P["dark"])
    d.line((0, 214, W, 214), fill=P["gold"])
    text_c(d, W // 2, 26, "FRONT", font(16, True), P["gold"])
    text_c(d, W // 2, 44, "COUNCIL", font(16, True), P["white"])
    text_c(d, W // 2, 219, "WHAT SHOULD YOUR SIDE DO NEXT?", font(8, True), P["white"])
    text_c(d, W // 2, 232, "WRITE YOUR IDEA IN THE COMMENTS.", font(8), P["pale"])
    text_c(d, W // 2, 244, "MOST LIKED IDEA BECOMES AN ORDER.", font(8), P["gold"])
    footer(d, H - 11)
    return im


def make():
    out = os.path.join(PROMO, "council_1.jpg")
    up(make_raw(), K).convert("RGB").save(out, quality=95, subsampling=0)
    print(out)


def make_story():
    """Story 1080×1350→1080×1920 (mřížka 216×384 ×5): scéna z postu uprostřed, texty mimo horní a spodní lištu Instagramu (~14 % a ~20 %)."""
    raw = make_raw()
    sc = raw.crop((0, 0, W, 214))
    im = Image.new("RGBA", (W, 384), P["dark"] + (255,))
    d = ImageDraw.Draw(im)
    for y in range(0, 384, 2):  # jemná textura pozadí
        if (y // 2) % 3 == 0:
            d.line((0, y, W, y), fill=P["ink"])
    im.alpha_composite(sc, (0, 58))
    d = ImageDraw.Draw(im)
    d.line((0, 58, W, 58), fill=P["gold"])
    d.line((0, 271, W, 271), fill=P["gold"])
    text_c(d, W // 2, 276, "OPEN THE LATEST POST.", font(8, True), P["white"])
    text_c(d, W // 2, 288, "COMMENT YOUR IDEA FOR THE FRONT.", font(8), P["pale"])
    text_c(d, W // 2, 300, "LIKE THE ONES YOU WANT TO SEE.", font(8), P["gold"])
    out = os.path.join(PROMO, "story_council.jpg")
    up(im, K).convert("RGB").save(out, quality=95, subsampling=0)
    print(out, up(im, K).size)


if __name__ == "__main__":
    make()
    make_story()
