"""Post hlasování o rozkazech (1080×1350): jedno hlasování, tři společné možnosti pro obě strany; každá strana si vybírá za sebe
a stejné heslo má podle strany jiný účinek (řádek HEGEMONY / CONCORD v kartě).
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

OPTIONS = [
    ("DUGOUTS", "DEEP SHELTERS", "FEWER SHELL HITS", "FEWER HITS ON THE RIDGE"),
    ("DOCTOR", "A SURGEON ARRIVES", "FEWER DEAD, FASTER HEALING", "FEWER DEAD, FASTER HEALING"),
    ("GUNS", "THE GUNS SPEAK", "COUNTERFIRE: LESS SHELLING", "MORE GUNS: MORE SHELLING"),
]


def make():
    im = canvas()
    grad(im, (0, 0, W, H), [P["ink"], P["dark"], P["mud0"]])
    shade(im, (0, 0, W, H), strength=0.4)
    d = ImageDraw.Draw(im)
    text_c(d, W // 2, 12, "THE FRONT DECIDES", font(14, True), P["gold"])
    text_c(d, W // 2, 32, "ONE VOTE. EACH SIDE CHOOSES FOR ITSELF.", font(8), P["pale"])
    for name, x, spr in (("HEGEMONY", 6, "hegemony_east.png"), ("CONCORD", W // 2 + 2, "concord_west.png")):
        pass
    for i, (kw, title, h, c) in enumerate(OPTIONS):
        y = 50 + i * 54
        d.rectangle((6, y, W - 7, y + 50), fill=P["dark"], outline=P["gold"])
        d.rectangle((6, y, 10, y + 50), fill=P["gold"])
        d.text((16, y + 3), kw, font=font(14, True), fill=P["gold"])
        d.text((16, y + 19), title, font=font(8), fill=P["white"])
        if h == c:  # stejný účinek pro obě strany
            d.rectangle((16, y + 33, 20, y + 38), fill=P["steel"]); d.rectangle((22, y + 33, 26, y + 38), fill=P["olive"]); d.text((30, y + 31), h, font=font(8), fill=P["pale"])
        else:
            d.rectangle((16, y + 30, 20, y + 35), fill=P["steel"]); d.text((24, y + 28), h, font=font(8), fill=P["pale"])
            d.rectangle((16, y + 40, 20, y + 45), fill=P["olive"]); d.text((24, y + 38), c, font=font(8), fill=P["pale"])
    # legenda stran
    d.rectangle((0, 214, W, H), fill=P["dark"])
    d.line((0, 214, W, 214), fill=P["gold"])
    text_c(d, W // 2, 218, "COMMENT ONE WORD.", font(8, True), P["white"])
    text_c(d, W // 2, 229, "YOUR SOLDIER IS YOUR VOTE.", font(8), P["pale"])
    d.rectangle((54, 242, 58, 247), fill=P["steel"]); d.text((62, 240), "HEGEMONY", font=font(8), fill=P["pale"])
    d.rectangle((118, 242, 122, 247), fill=P["olive"]); d.text((126, 240), "CONCORD", font=font(8), fill=P["pale"])
    footer(d, H - 9)
    out = os.path.join(PROMO, "vote_orders_1.jpg")
    up(im, K).convert("RGB").save(out, quality=95, subsampling=0)
    print(out)


if __name__ == "__main__":
    make()
