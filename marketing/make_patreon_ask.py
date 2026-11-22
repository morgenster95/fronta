"""Patreon post „You decide what comes next“ (22. 11. 2026): patroni navrhují v komentářích další odměnu.
1920×1080 (mřížka 300×180 ×6, make_patreon_dog.save). Vlevo otázka a výzva, vpravo čtyři okénka s nápady (bílý plášť, vlastní prapor, krokve, ???).
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
    d.text((14, 104), "A NEW REWARD FOR", font=font(8), fill=P["pale"])
    d.text((14, 116), "SUPPORTERS. YOU PICK IT.", font=font(8), fill=P["pale"])
    d.rectangle((14, 136, 146, 156), fill=P["rust"], outline=P["gold"])
    d.text((22, 142), "COMMENT YOUR IDEA", font=font(8, True), fill=P["white"])
    d.text((14, 164), "MUD AND IRON", font=font(8, True), fill=P["gold"])
    # čtyři okénka s nápady
    boxes = [(162, 22), (230, 22), (162, 98), (230, 98)]
    for (bx, by) in boxes:
        d.rectangle((bx, by, bx + 66, by + 70), fill=P["mud0"], outline=P["mud3"])
    heg = sprite("hegemony_south.png")
    white = Image.open(os.path.join(ROOT, "art", "cine", "mock_heg_white.png")).convert("RGBA")
    con = sprite("concord_north.png")
    # 1 zimní plášť
    im.alpha_composite(white, (162 + 17, 22 + 14))
    # 2 vlastní prapor
    im.alpha_composite(heg, (230 + 22, 22 + 14))
    flag(d, 230 + 14, 22 + 10, P["steel"], P["rust"])
    # 3 krokve / povýšení
    im.alpha_composite(con, (162 + 17, 98 + 14))
    chevrons(d, 162 + 33, 98 + 6, 3)
    # 4 vlastní nápad
    tw = d.textlength("?", font=font(24, True))
    d.text((230 + 33 - tw / 2, 98 + 12), "?", font=font(24, True), fill=P["gold"])
    for (bx, by), lab in zip(boxes, ["COAT?", "FLAG?", "STRIPES?", "YOUR IDEA"]):
        tw = d.textlength(lab, font=font(8))
        d.text((bx + 33 - tw / 2, by + 58), lab, font=font(8), fill=P["white"])
    star(d, 285, 14, 5)
    save(im, "post_ask_1500x900.jpg")


if __name__ == "__main__":
    main()
