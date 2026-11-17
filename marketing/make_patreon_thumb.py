"""Thumbnail k Patreon postu s videem, 1500×900 (mřížka 250×150 ×6), styl make_patreon_day8.py. Obecně pro každé video:
  python marketing/make_patreon_thumb.py <out_id> <obrázek> "<x0,y0,šířka,výška výřezu v px obrázku>" "<NADPIS>" "<VELKÝ>" "<ŘÁDEK 1|ŘÁDEK 2>" "<text 1|...|text 5>"
Výřez se zmenší / zvětší nejbližším sousedem na levý panel 125×150 (u velkých fotek se zachová poměr, ořízne se střed)."""
import os
import sys
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(__file__))
from make_posts import P, font, up  # noqa: E402

HERE = os.path.dirname(__file__)
out_id, src, box, head, big, title, lines = sys.argv[1:8]
W, H, K = 250, 150, 6
im = Image.new("RGB", (W, H), P["dark"])
x, y, w, h = (int(v) for v in box.split(","))
crop = Image.open(src).convert("RGB").crop((x, y, x + w, y + h))
im.paste(crop.resize((125, 150), Image.NEAREST if w <= 250 else Image.LANCZOS), (0, 0))
d = ImageDraw.Draw(im)
d.line((125, 0, 125, H), fill=P["gold"])


def text(tx, ty, s, f, fill):
    d.text((tx + 1, ty + 1), s, font=f, fill=P["ink"])
    d.text((tx, ty), s, font=f, fill=fill)


X = 133
text(X, 12, head, font(8, True), P["gold"])
text(X, 24, big, font(16, True), P["white"])
for i, s in enumerate(title.split("|")[:2]):
    text(X, 46 + i * 10, s, font(8, True), P["white"])
for i, s in enumerate(lines.split("|")[:5]):
    text(X, 74 + i * 9, s, font(8), P["pale"])
text(X, 126, "MUD & IRON", font(8, True), P["gold"])
text(X, 136, "FREE TO PLAY", font(8), P["sand"])
out = os.path.join(HERE, "promo", "patreon", f"post_{out_id}_1500x900.jpg")
up(im, K).save(out, quality=95)
print(out)
