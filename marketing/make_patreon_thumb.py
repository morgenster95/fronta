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
# bez „&“ (v pixelovém písmu vypadá jako dolar) a bez „free to play“ (uživatel 21. 11.)
text(X, 130, "MUD AND IRON", font(8, True), P["gold"])
out = os.path.join(HERE, "promo", "patreon", f"post_{out_id}_1500x900.jpg")
# Patreon chce aspoň 1920×1080 (16:9) a ořezává jiné poměry: mřížka ×7 = 1750×1050, uprostřed tmavého plátna 1920×1080
big = up(im, 7)
canvas = Image.new("RGB", (1920, 1080), P["dark"])
canvas.paste(big, ((1920 - big.width) // 2, (1080 - big.height) // 2))
out = out.replace("_1500x900", "_1920x1080")
canvas.save(out, quality=95)
print(out)
