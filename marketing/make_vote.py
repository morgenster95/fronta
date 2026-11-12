"""Post hlasování o rozkazech (1080×1350): jeden příspěvek, jedno hlasování; vlevo nabídka Hegemonie, vpravo Concordu (každá strana volí jen ze své).
Použití: python marketing/make_vote.py  → marketing/promo/vote_orders_1.jpg
"""
import os
import sys

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_posts import P, W, H, K, canvas, font, text_c, sprite, up, footer  # noqa: E402
from day_art import grad, shade  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROMO = os.path.join(ROOT, "marketing", "promo")

SIDES = [
    ("HEGEMONY", "hegemony_east.png", P["steel"], P["grey"], [
        ("DUGOUTS", ["DEEP SHELTERS", "-30% SHELL HITS"]),
        ("DOCTOR", ["SURGEON ARRIVES", "FEWER DEAD"]),
        ("COUNTERFIRE", ["OUR GUNS REPLY", "LESS SHELLING"]),
    ]),
    ("CONCORD", "concord_west.png", P["olive"], P["khaki"], [
        ("SNIPERS", ["SNIPING SCHOOL", "SNIPERS +80%"]),
        ("VICKERS", ["MG CORPS", "MG FIRE +80%"]),
        ("MINE", ["TUNNELLERS", "MINE IN 3 DAYS"]),
    ]),
]


def make():
    im = canvas()
    d = ImageDraw.Draw(im)
    grad(im, (0, 0, W, H), [P["ink"], P["dark"], P["mud0"]])
    shade(im, (0, 0, W, H), strength=0.4)
    d = ImageDraw.Draw(im)
    text_c(d, W // 2, 14, "THE FRONT DECIDES", font(14, True), P["gold"])
    text_c(d, W // 2, 34, "EACH SIDE VOTES FOR ITSELF", font(8), P["pale"])
    mid = W // 2
    d.line((mid, 50, mid, 220), fill=P["mud2"])
    for si, (name, spr, col, hi, opts) in enumerate(SIDES):
        x0 = 6 + si * (mid)
        cx = x0 + (mid - 12) // 2
        d.rectangle((x0, 48, x0 + mid - 13, 62), fill=col)
        text_c(d, cx, 51, name, font(8, True), P["white"])
        try:
            s = sprite(spr)
            im.alpha_composite(s, (cx - 16, 64))
        except FileNotFoundError:
            pass
        d = ImageDraw.Draw(im)
        for i, (kw, lines) in enumerate(opts):
            y = 98 + i * 40
            d.rectangle((x0, y, x0 + mid - 13, y + 36), fill=P["dark"], outline=col)
            d.rectangle((x0, y, x0 + 3, y + 36), fill=hi)
            d.text((x0 + 8, y + 3), kw, font=font(8, True), fill=P["gold"])
            for j, ln in enumerate(lines):
                d.text((x0 + 8, y + 14 + j * 10), ln, font=font(8), fill=P["pale"])
    d.rectangle((0, 222, W, H), fill=P["dark"])
    d.line((0, 222, W, 222), fill=P["gold"])
    text_c(d, W // 2, 228, "COMMENT ONE WORD FROM YOUR SIDE.", font(8, True), P["white"])
    text_c(d, W // 2, 240, "YOUR SOLDIER IS YOUR VOTE.", font(8), P["pale"])
    text_c(d, W // 2, 251, "ORDERS RUN FOR 3 DAYS.", font(8), P["gold"])
    footer(d, H - 9)
    out = os.path.join(PROMO, "vote_orders_1.jpg")
    up(im, K).convert("RGB").save(out, quality=95, subsampling=0)
    print(out)


if __name__ == "__main__":
    make()
