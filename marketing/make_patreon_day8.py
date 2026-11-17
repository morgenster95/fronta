"""Obrázek k postu na Patreonu s Day reelem Day 8 (17. 11. 2026), 1500×900 (mřížka 250×150 ×6), stejný styl jako make_patreon_day7.py:
vlevo výřez scény „tea“ z videa (pozadí z PixelLabu art/cine/cine_tea.png), vpravo titulek a krátký příběh dne."""
import os
import sys
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(__file__))
from make_posts import P, font, up  # noqa: E402

HERE = os.path.dirname(__file__)
W, H, K = 250, 150, 6
im = Image.new("RGB", (W, H), P["dark"])
scene = Image.open(os.path.join(HERE, "..", "art", "cine", "cine_tea.png")).convert("RGB")
im.paste(scene.crop((24, 62, 149, 212)), (0, 0))  # plecháček, křížek, knížka a slunce nad zemí nikoho
d = ImageDraw.Draw(im)
d.line((125, 0, 125, H), fill=P["gold"])


def text(x, y, s, f, fill):
    d.text((x + 1, y + 1), s, font=f, fill=P["ink"])
    d.text((x, y), s, font=f, fill=fill)


X = 133
text(X, 12, "NEW DAY REEL", font(8, True), P["gold"])
text(X, 24, "DAY 8", font(16, True), P["white"])
text(X, 46, "YOUR SHELLS FELL", font(8, True), P["white"])
text(X, 56, "ALL NIGHT", font(8, True), P["white"])
for i, s in enumerate(["383 SHELLS. FOUR IN", "TEN CONCORD", "PILLBOXES FELL.", "THE CHAPLAIN'S TEA", "WAS STILL HOT."]):
    text(X, 74 + i * 9, s, font(8), P["pale"])
text(X, 126, "MUD & IRON", font(8, True), P["gold"])
text(X, 136, "FREE TO PLAY", font(8), P["sand"])
out = os.path.join(HERE, "promo", "patreon", "post_day8_1500x900.jpg")
up(im, K).save(out, quality=95)
print(out)
