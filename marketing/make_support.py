"""Post „Keep the front running“ (1080×1350): výzva k dobrovolné podpoře hry na Ko-fi (https://ko-fi.com/mudandiron).
Polní kuchyně v krytu: kuchař rozdává horké plecháčky vojákům obou stran, na bedně s příděly visí stužka War Bonds.
Dole: hra je zdarma, bez reklam a bez pay-to-win; za ration dostane voják stužku War Bonds (jen čest).
Použití: python marketing/make_support.py  → marketing/promo/support_1.jpg
"""
import os
import sys

from PIL import ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_posts import P, W, H, K, canvas, font, text_c, sprite, up, footer  # noqa: E402
from day_art import planks, light, shade, sandbag_wall, lamp  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROMO = os.path.join(ROOT, "marketing", "promo")

# pruhy stužky War Bonds (stejné jako na webu: .ribbon ve web/src/style.css)
STRIPES = ["rust", "gold", "white", "gold", "olive", "gold", "white", "gold", "rust"]
WIDTHS = [7, 6, 4, 5, 8, 5, 4, 6, 7]  # celkem 52


def ribbon(d, x, y, scale=1, h=9):
    xx = x
    for c, w in zip(STRIPES, WIDTHS):
        w = max(1, round(w * scale))
        d.rectangle((xx, y, xx + w - 1, y + h - 1), fill=P[c])
        xx += w
    d.line((x, y, xx - 1, y), fill=P["pale"])
    d.line((x, y + h - 1, xx - 1, y + h - 1), fill=P["blood"])
    d.rectangle((x - 1, y - 1, xx, y + h), outline=P["ink"])
    return xx - x


def mug(d, x, y, steam=0):
    """plecháček s kouřícím čajem"""
    d.rectangle((x, y, x + 5, y + 5), fill=P["steel"])
    d.line((x, y, x + 5, y), fill=P["grey"])
    d.rectangle((x + 1, y + 1, x + 4, y + 1), fill=P["mud0"])
    d.rectangle((x + 6, y + 1, x + 7, y + 4), outline=P["steel"])
    d.line((x, y + 5, x + 5, y + 5), fill=P["ink"])
    for k in range(3):
        sx = x + 1 + k * 2
        for j in range(4):
            if (j + k + steam) % 3 != 2:
                d.point((sx + (1 if (j + k) % 2 else 0), y - 2 - j * 2), fill=P["pale"] if j < 2 else P["sand"])


def crate(d, x, y, w=60, h=30):
    d.rectangle((x, y, x + w, y + h), fill=P["mud3"], outline=P["ink"])
    for yy in range(y + 7, y + h, 8):
        d.line((x + 1, yy, x + w - 1, yy), fill=P["mud2"])
    d.line((x + 1, y + 1, x + w - 1, y + 1), fill=P["sand"])
    for xx in (x + 3, x + w - 4):
        d.line((xx, y + 2, xx, y + h - 1), fill=P["mud1"])
    # vypálený nápis
    text_c(d, x + w // 2 + 1, y + 3, "RATIONS", font(8, True), P["ink"], shadow=None)


def make():
    im = canvas()
    d = ImageDraw.Draw(im)
    # kryt: roubení z fošen, pytle u stropu, trámy
    planks(im, (0, 0, W, 190), seed=7, vertical=True)
    d.rectangle((0, 0, W, 10), fill=P["ink"])
    sandbag_wall(im, (0, 0, W, 14), seed=5)
    d.rectangle((0, 14, W, 19), fill=P["mud1"])
    d.line((0, 19, W, 19), fill=P["ink"])
    for x in (14, W - 18):
        d.rectangle((x, 19, x + 5, 190), fill=P["mud1"])
        d.line((x + 5, 19, x + 5, 190), fill=P["ink"])
        d.line((x, 19, x, 190), fill=P["mud2"])
    # podlaha z prken
    planks(im, (0, 184, W, 214), seed=3, vertical=False)
    d = ImageDraw.Draw(im)
    d.line((0, 184, W, 184), fill=P["ink"])
    # police s plechovkami a lahvemi nahoře
    d = ImageDraw.Draw(im)
    for x in (118, 156):  # police s lahvemi a konzervami (bez beden se zdravotnickým křížem)
        d.rectangle((x, 92, x + 34, 94), fill=P["mud3"])
        d.line((x, 95, x + 34, 95), fill=P["ink"])
        for i, (h, c) in enumerate([(7, P["olive"]), (5, P["bone"]), (8, P["water"]), (4, P["steel"]), (6, P["khaki"])]):
            bx = x + 2 + i * 7
            d.rectangle((bx, 92 - h, bx + 3, 91), fill=c)
            d.point((bx + 1, 91 - h), fill=P["mud1"])
    # kamna s kotlem vlevo od středu
    sx = 50
    d.rectangle((sx, 146, sx + 32, 184), fill=P["ink"])
    d.rectangle((sx + 2, 148, sx + 30, 182), fill=P["mud0"])
    d.rectangle((sx + 8, 168, sx + 24, 178), fill=P["fire"])
    d.rectangle((sx + 10, 170, sx + 22, 176), fill=P["gold"])
    d.line((sx + 16, 132, sx + 16, 22), fill=P["ink"])  # komín
    d.line((sx + 17, 132, sx + 17, 22), fill=P["mud0"])
    d.ellipse((sx - 2, 132, sx + 34, 148), fill=P["steel"], outline=P["ink"])  # kotel
    d.rectangle((sx - 1, 137, sx + 33, 145), fill=P["steel"])
    d.line((sx, 136, sx + 32, 136), fill=P["grey"])
    for k, x in enumerate((sx + 6, sx + 14, sx + 24)):
        for j in range(7):
            if (j + k) % 3 != 1:
                d.point((x + (j % 2), 128 - j * 3), fill=P["pale"] if j < 3 else P["sand"])
    # lampa
    lamp(im, 30, 84, top=62)
    d = ImageDraw.Draw(im)
    # voják Hegemonie, kuchař u kotle a voják Concordu (sprity ze hry ×2), všichni celí v záběru
    for name, x, y in (("hegemony_east.png", -6, 122), ("concord_cook_south.png", 80, 122), ("concord_west.png", 118, 122)):
        try:
            im.alpha_composite(up(sprite(name), 2), (x, y))
        except FileNotFoundError:
            pass
    d = ImageDraw.Draw(im)
    # bedna s příděly vpravo, na ní plecháčky a stužka War Bonds
    crate(d, 158, 158, 52, 26)
    ribbon(d, 164, 174, scale=0.78, h=6)
    mug(d, 164, 151, 0)
    mug(d, 182, 151, 1)
    light(im, 66, 166, 110, strength=1.0, steps=3, keep=(P["steel"], P["grey"]))
    light(im, 30, 86, 60, strength=0.8, steps=2)
    shade(im, (0, 0, W, 214), strength=0.7)
    # titulek nahoře na tmavém pruhu
    d = ImageDraw.Draw(im)
    d.rectangle((0, 22, W, 62), fill=P["ink"])
    text_c(d, W // 2, 26, "KEEP THE FRONT", font(16, True), P["gold"])
    text_c(d, W // 2, 44, "RUNNING", font(16, True), P["white"])
    # čtvercová verze pro Ko-fi (1080×1080): scéna s titulkem a dole jeden řádek
    sq = im.crop((0, 0, W, W))
    ds = ImageDraw.Draw(sq)
    ds.rectangle((0, W - 18, W, W), fill=P["dark"])
    ds.line((0, W - 18, W, W - 18), fill=P["gold"])
    text_c(ds, W // 2, W - 14, "FREE. NO ADS. NO PAY-TO-WIN.", font(8, True), P["white"])
    out_sq = os.path.join(PROMO, "support_square.jpg")
    up(sq, K).convert("RGB").save(out_sq, quality=95, subsampling=0)
    print(out_sq)
    # textová část
    d.rectangle((0, 214, W, H), fill=P["dark"])
    d.line((0, 214, W, 214), fill=P["gold"])
    text_c(d, W // 2, 219, "FREE. NO ADS. NO PAY-TO-WIN.", font(8, True), P["white"])
    text_c(d, W // 2, 231, "BUY THE FRONT A RATION:", font(8), P["pale"])
    f = font(8)
    t = "WAR BONDS FOR YOUR SOLDIER"
    tw = d.textlength(t, font=f)
    x0 = int(W / 2 - (26 + 5 + tw) / 2)
    ribbon(d, x0, 246, scale=0.5, h=6)
    d.text((x0 + 31 + 1, 243 + 1), t, font=f, fill=P["ink"])
    d.text((x0 + 31, 243), t, font=f, fill=P["gold"])
    text_c(d, W // 2, 255, "KO-FI.COM/MUDANDIRON", font(8, True), P["white"])
    out = os.path.join(PROMO, "support_1.jpg")
    up(im, K).convert("RGB").save(out, quality=95, subsampling=0)
    print(out)


if __name__ == "__main__":
    make()
