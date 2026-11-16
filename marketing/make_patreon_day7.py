"""Obrázek k postu na Patreonu s Day reelem Day 7 (16. 11. 2026), 1500×900 (mřížka 250×150 ×6), ve stylu post_patreon_1500x900:
vlevo scéna „song“ z videa (hlídka Concordu pod měsícem, noty přes drát; čistý snímek marketing/art/day7_song_still.png), vpravo titulek a příběh."""
import os
import sys
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(__file__))
from make_posts import P, font, up  # noqa: E402

HERE = os.path.dirname(__file__)
W, H, K = 250, 150, 6
im = Image.new("RGB", (W, H), P["dark"])
# vlevo: výřez scény (snímek 1080×1920 = mřížka 180×320 ×6)
still = Image.open(os.path.join(HERE, "art", "day7_song_still.png")).convert("RGB").resize((180, 320), Image.NEAREST)
im.paste(still.crop((16, 104, 141, 254)), (0, 0))
d = ImageDraw.Draw(im)
d.line((125, 0, 125, H), fill=P["gold"])


def text(x, y, s, f, fill):
    d.text((x + 1, y + 1), s, font=f, fill=P["ink"])
    d.text((x, y), s, font=f, fill=fill)


X = 133
text(X, 12, "NEW DAY REEL", font(8, True), P["gold"])
text(X, 24, "DAY 7", font(16, True), P["white"])
text(X, 46, "A SONG ACROSS", font(8, True), P["white"])
text(X, 56, "THE WIRE", font(8, True), P["white"])
lines = ["FELIX KAGR SANG", "ON NIGHT WATCH.", "ACROSS THE WIRE,", "SOMEBODY SANG", "THE NEXT LINE."]
for i, s in enumerate(lines):
    text(X, 74 + i * 9, s, font(8), P["pale"])
text(X, 126, "MUD & IRON", font(8, True), P["gold"])
text(X, 136, "FREE TO PLAY", font(8), P["sand"])
out = os.path.join(HERE, "promo", "patreon", "post_day7_1500x900.jpg")
up(im, K).save(out, quality=95)
print(out)
