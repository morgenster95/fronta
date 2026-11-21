"""Náhled (thumbnail) 1920×1080 pro video Front News v našem stylu (kreslený pixel art, paleta Trench-24):
noční zem nikoho pod světlicí, voják Hegemonie a Concordu (sprity ze hry ×3) přes drát, vlevo zpravodajský panel s číslem dílu.
Kreslí se v mřížce 384×216 a zvětší ×5.
Použití: python marketing/make_news_thumb.py "DAYS 1-5" "THE FIRST FIVE DAYS" [výstup.jpg] ["TICKER · TEXT · …"]
"""
import os
import sys

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_posts import P, font, text_c, up, sprite, sky, mud, wire  # noqa: E402
from make_support import ribbon  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GW, GH, K = 384, 216, 5


def scene():
    im = Image.new("RGBA", (GW, GH), P["ink"] + (255,))
    sky(im, 130)
    d = ImageDraw.Draw(im)
    for r, c in ((9, P["fire"]), (5, P["gold"]), (2, P["white"])):  # světlice na padáčku
        d.ellipse((290 - r, 36 - r, 290 + r, 36 + r), fill=c)
    d.line((290, 22, 290, 27), fill=P["pale"])
    d.arc((282, 14, 298, 26), 180, 360, fill=P["pale"])
    mud(im, 126, GH, seed=3)
    d = ImageDraw.Draw(im)
    d.line((0, 126, GW, 126), fill=P["mud3"])
    for cx, cy, rr in ((230, 150, 14), (340, 170, 18), (200, 190, 10)):  # krátery
        d.ellipse((cx - rr, cy - rr // 3, cx + rr, cy + rr // 3), fill=P["mud0"], outline=P["ink"])
    wire(d, 160, 186, GW)
    for name, x in (("hegemony_east.png", 196), ("concord_west.png", 296)):  # stejné měřítko, nohy na stejné výšce
        sp = sprite(name)
        bb = sp.getbbox()
        im.alpha_composite(up(sp, 3), (x, 194 - bb[3] * 3))
    return im


def make(days, sub, out, ticker):
    o = scene()
    d = ImageDraw.Draw(o)
    for x in range(GW):  # ztmavení vlevo pod panelem
        a = int(max(0, 210 - x * 1.4)) if x < 170 else 0
        if a: d.line((x, 0, x, GH), fill=(14, 13, 12, a))
    # lišta FRONT NEWS a vedle ní značka ON AIR
    d.rectangle((12, 16, 160, 38), fill=P["rust"], outline=P["ink"])
    d.rectangle((12, 16, 160, 18), fill=P["fire"])
    d.text((18, 20), "FRONT NEWS", font=font(16, True), fill=P["white"])
    d.rectangle((164, 20, 190, 34), fill=P["ink"], outline=P["fire"])
    d.ellipse((167, 24, 172, 29), fill=P["fire"])
    d.text((175, 23), "ON", font=font(8, True), fill=P["white"])
    # číslo dílu
    d.rectangle((12, 46, 176, 118), fill=P["ink"], outline=P["gold"])
    text_c(d, 94, 52, days.split(" ")[0], font(16, True), P["pale"])
    text_c(d, 94, 72, " ".join(days.split(" ")[1:]), font(32, True), P["gold"])
    d.rectangle((12, 122, 176, 140), fill=P["dark"], outline=P["mud2"])
    text_c(d, 94, 127, sub, font(8, True), P["white"])
    text_c(d, 94, 150, "MUD & IRON", font(8, True), P["pale"])
    ribbon(d, 68, 162, scale=1, h=5)
    # ticker dole
    d.rectangle((0, GH - 18, GW, GH), fill=P["ink"])
    d.line((0, GH - 18, GW, GH - 18), fill=P["gold"])
    d.rectangle((0, GH - 17, 62, GH), fill=P["rust"])
    d.text((5, GH - 13), "BREAKING", font=font(8, True), fill=P["white"])
    d.text((68, GH - 13), ticker, font=font(8), fill=P["pale"])
    up(o, K).convert("RGB").save(out, quality=95, subsampling=0)
    print(out)


if __name__ == "__main__":
    a = sys.argv[1:]
    make(a[0] if a else "DAYS 1-5", a[1] if len(a) > 1 else "THE FIRST FIVE DAYS",
         a[2] if len(a) > 2 else os.path.join(ROOT, "marketing", "promo", "news_days_1-5.jpg"),
         a[3] if len(a) > 3 else "VERDEL RIDGE FALLS · SHELLS ON THE HEGEMONY · WIRING PARTIES · HILL 304")
