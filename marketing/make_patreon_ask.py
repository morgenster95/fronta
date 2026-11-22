"""Patreon post „You decide what comes next“ (22. 11. 2026): patroni navrhují v komentářích další odměnu.
1920×1080 (mřížka 300×180 ×6, make_patreon_dog.save). Vlevo otázka a výzva, vpravo voják se psem a velký otazník (obecně, bez konkrétních nápadů; uživatel 22. 11.).
Použití: python marketing/make_patreon_ask.py → marketing/promo/patreon/post_ask_1920x1080.jpg
"""
import os
import sys
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_posts import P, font, sprite  # noqa: E402
from make_patreon_dog import save, dog  # noqa: E402
from make_patreon import star  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 300, 180


def flag(d, x, y, col, band):
    d.rectangle((x, y, x, y + 26), fill=P["ink"])
    d.rectangle((x + 1, y, x + 17, y + 11), fill=col)
    d.rectangle((x + 1, y + 4, x + 17, y + 6), fill=band)
    d.rectangle((x + 1, y + 11, x + 17, y + 11), fill=P["ink"])


def chevrons(d, cx, top, n):
    d.rectangle((cx - 6, top - 1, cx + 6, top + n * 3 + 2), fill=P["ink"])
    for i in range(n):
        y = top + i * 3
        d.line([(cx - 4, y), (cx, y + 2), (cx + 4, y)], fill=(240, 196, 96))
        d.line([(cx - 4, y + 1), (cx, y + 3), (cx + 4, y + 1)], fill=P["gold"])


def main():
    im = Image.new("RGBA", (W, H), P["dark"] + (255,))
    d = ImageDraw.Draw(im)
    # jemná zrnitost pozadí
    for y in range(0, H, 3):
        for x in range((y // 3) % 2 * 2, W, 5):
            d.point((x, y), fill=P["ink"])
    d.text((14, 16), "PATRONS ONLY", font=font(8), fill=P["gold"])
    d.text((14, 34), "YOU DECIDE", font=font(14, True), fill=P["white"])
    d.text((14, 54), "WHAT COMES", font=font(14, True), fill=P["white"])
    d.text((14, 74), "NEXT", font=font(14, True), fill=P["gold"])
    d.text((14, 104), "WHAT SHOULD WE ADD", font=font(8), fill=P["pale"])
    d.text((14, 116), "FOR PATRONS NEXT?", font=font(8), fill=P["pale"])
    d.rectangle((14, 136, 146, 156), fill=P["rust"], outline=P["gold"])
    d.text((22, 142), "COMMENT YOUR IDEA", font=font(8, True), fill=P["white"])
    d.text((14, 164), "MUD AND IRON", font=font(8, True), fill=P["gold"])
    # vpravo: voják se psem u zákopu a velký otazník nad ním (obecná výzva, bez konkrétních nápadů)
    d.rectangle((168, 24, 286, 156), fill=P["mud0"], outline=P["mud3"])
    for x in range(170, 276, 12):  # val z pytlů dole (uvnitř rámu)
        d.rectangle((x, 140, x + 10, 146), fill=P["sand"], outline=P["ink"])
    for x in range(176, 270, 12):
        d.rectangle((x, 147, x + 10, 153), fill=P["bone"], outline=P["ink"])
    heg = sprite("hegemony_south.png")
    im.alpha_composite(heg, (200, 110))
    dg = dog("shepherd")
    im.alpha_composite(dg, (228, 141 - dg.height))
    tw = d.textlength("?", font=font(40, True))
    d.text((227 - tw / 2, 34), "?", font=font(40, True), fill=P["gold"])
    star(d, 285, 14, 5)
    save(im, "post_ask_1500x900.jpg")


if __name__ == "__main__":
    main()
