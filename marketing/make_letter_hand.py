"""Post „A letter for you“ (1080×1350): detailní plakátový voják (art/pixellab/poster) podává dopis; prsty drží obálku.
Bez čísel (výhodu dopisu neprozrazujeme). Použití: python marketing/make_letter_hand.py → marketing/promo/letter_hand_1.jpg
"""
import os, sys
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_posts import P, W, H, K, canvas, font, text_c, up, frame, footer  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROMO = os.path.join(ROOT, "marketing", "promo")


def envelope(im, x, y, w=36, h=24):
    d = ImageDraw.Draw(im)
    d.rectangle((x - 1, y - 1, x + w + 1, y + h + 1), fill=P["ink"])
    d.rectangle((x, y, x + w, y + h), fill=P["bone"])
    d.line((x, y + h, x + w // 2, y + h // 2 + 1), fill=P["sand"])
    d.line((x + w, y + h, x + w // 2, y + h // 2 + 1), fill=P["sand"])
    d.polygon([(x, y), (x + w, y), (x + w // 2, y + h // 2 + 2)], fill=P["pale"])
    d.line((x, y, x + w // 2, y + h // 2 + 2), fill=P["sand"])
    d.line((x + w, y, x + w // 2, y + h // 2 + 2), fill=P["sand"])
    cx, cy = x + w // 2, y + h // 2 + 2
    d.ellipse((cx - 4, cy - 4, cx + 4, cy + 4), fill=P["blood"], outline=P["ink"])
    d.ellipse((cx - 2, cy - 2, cx + 1, cy + 1), fill=P["rust"])
    d.point((cx - 2, cy - 2), fill=P["fire"])
    d.line((x, y, x + w, y), fill=P["white"])


def make():
    im = canvas()
    art = Image.open(os.path.join(ROOT, "art", "pixellab", "poster", "poster_176x208.png")).convert("RGBA")
    base = art.copy()
    envelope(base, 52, 111, 32, 21)
    # prsty a kloub zpět přes spodek obálky: obálka je držená v pěsti
    base.alpha_composite(art.crop((44, 124, 96, 150)), (44, 124))
    im.alpha_composite(base, ((W - art.width) // 2, 0))
    d = ImageDraw.Draw(im)
    y = art.height
    d.rectangle((0, y, W, H), fill=P["dark"])
    d.line((0, y, W, y), fill=P["gold"])
    text_c(d, W // 2, y + 4, "A LETTER FOR YOU", font(16, True), P["white"])
    text_c(d, W // 2, y + 24, "WRITE HOME. EVERY DAY.", font(8, True), P["gold"])
    text_c(d, W // 2, y + 38, "LOG IN. OPEN YOUR SOLDIER'S CARD.", font(8), P["pale"])
    text_c(d, W // 2, y + 49, "MUDANDIRON.WEB.APP", font(8), P["pale"])
    frame(im)
    out = os.path.join(PROMO, "letter_hand_1.jpg")
    up(im, K).convert("RGB").save(out, quality=95, subsampling=0)
    print(out)


if __name__ == "__main__":
    make()
