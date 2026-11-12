"""Náborový post „Wiring party“ (1080×1350): noc v zemi nikoho, světlice nad drátem, dobrovolníci leží u kůlů a natahují nový drát.
Sprity ze hry (ležící voják = poslední snímek pádu), krátery ze hry, drát kreslí day_art.barbed. Bez čísel.
Použití: python marketing/make_wiring.py → marketing/promo/wiring_1.jpg
"""
import os, random, sys
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_posts import P, W, H, K, canvas, font, text_c, sprite, up, frame, footer  # noqa: E402
from day_art import grad, light, shade, noise, barbed, sandbag_wall  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROMO = os.path.join(ROOT, "marketing", "promo")
PROPS = os.path.join(ROOT, "web", "public", "assets", "props")
ART = 200


def prop(name, k=1):
    im = Image.open(os.path.join(PROPS, name)).convert("RGBA")
    return up(im, k) if k > 1 else im


def coil(d, cx, cy, r=6):
    """svitek nového drátu"""
    import math
    for a in range(0, 720, 15):
        t = math.radians(a)
        x, y = cx + int(math.cos(t) * r + a / 720 * 6), cy + int(math.sin(t) * r * 0.6)
        d.point((x, y), fill=P["steel"] if math.sin(t) < 0 else P["ink"])


def fence(d, x0, x1, y, broken=False, seed=0):
    """plot z drátu: kůly a dva prameny s ostny, nasvícené světlicí; broken = roztrhaný (mezery, visící konce)"""
    rnd = random.Random(seed)
    for x in range(x0, x1, 18):
        h = 12 + rnd.randrange(3)
        d.line((x, y, x + rnd.randrange(-1, 2), y - h), fill=P["mud3"])
        d.point((x, y - h), fill=P["sand"])
    for k, yy in enumerate((y - 9, y - 4)):
        x = x0
        while x < x1:
            if broken and rnd.random() < 0.18:
                d.line((x, yy, x + 2, yy + 5), fill=P["steel"])  # visící konec
                x += 10 + rnd.randrange(8)
                continue
            d.point((x, yy + (1 if (x // 3) % 2 else 0)), fill=P["pale"] if k == 0 else P["grey"])
            if x % 6 == 0:
                d.point((x, yy - 1), fill=P["white"])
                d.point((x + 1, yy + 1), fill=P["steel"])
            x += 1


def make():
    im = canvas()
    d = ImageDraw.Draw(im)
    rnd = random.Random(4)
    # obloha: noc, nízko kouř
    grad(im, (0, 0, W, 70), [P["ink"], P["dark"], P["mud0"]])
    # nepřátelský zákop na obzoru: pytle a kůly
    sandbag_wall(im, (0, 58, W, 72), seed=11)
    d = ImageDraw.Draw(im)
    grad(im, (0, 70, W, ART), [P["dark"], P["mud0"], P["mud1"]])
    noise(im, (0, 70, W, ART), [P["mud0"], P["mud2"], P["dark"]], 0.12, 3)
    d = ImageDraw.Draw(im)
    # krátery
    for name, x, y in (("crater_m.png", 14, 92), ("crater_s.png", 172, 86), ("crater_m.png", 70, 168), ("crater_s.png", 186, 150)):
        c = prop(name)
        im.alpha_composite(c, (x, y))
    d = ImageDraw.Draw(im)
    # starý roztrhaný drát vzadu a nový drát vpředu (kůly)
    fence(d, 0, 84, 104, broken=True, seed=2)
    fence(d, 150, W, 108, broken=True, seed=5)
    fence(d, 10, 206, 146, seed=7)
    # dobrovolníci: leží u kůlů (sprity ze hry ×2), jeden se svitkem
    for name, x, y in (("concord@fall_south_6.png", 18, 128), ("hegemony@fall_south_6.png", 112, 124), ("concord@fall_south_6.png", 148, 140)):
        try:
            im.alpha_composite(up(sprite(name), 2), (x, y))
        except FileNotFoundError:
            pass
    d = ImageDraw.Draw(im)
    coil(d, 96, 150)
    coil(d, 196, 176)
    # kladivo a kůl v ruce u prostředního
    d.line((112, 136, 112, 124), fill=P["mud3"])
    d.rectangle((110, 122, 114, 124), fill=P["steel"])
    # světlice: jasný bod se stopou kouře, světlo shora
    fx, fy = 132, 22
    for i in range(14):
        d.point((fx - i // 3, fy + 4 + i), fill=P["grey"] if i % 2 else P["steel"])
    light(im, fx, fy, 190, strength=0.8, steps=2)
    d = ImageDraw.Draw(im)
    d.ellipse((fx - 2, fy - 2, fx + 2, fy + 2), fill=P["white"])
    d.point((fx, fy - 3), fill=P["yellow"])
    shade(im, (0, 0, W, ART), strength=0.6, reverse=True)
    shade(im, (0, 0, W, ART), strength=0.4)
    # text
    d = ImageDraw.Draw(im)
    d.rectangle((0, ART, W, H), fill=P["dark"])
    d.line((0, ART, W, ART), fill=P["gold"])
    text_c(d, W // 2, ART + 5, "WIRING PARTY", font(16, True), P["white"])
    text_c(d, W // 2, ART + 25, "VOLUNTEERS WANTED. TONIGHT.", font(8, True), P["gold"])
    text_c(d, W // 2, ART + 38, "COMMENT WIRE. BOTH SIDES.", font(8), P["pale"])
    text_c(d, W // 2, ART + 49, "KEEP YOUR HEAD DOWN.", font(8), P["pale"])
    frame(im)
    out = os.path.join(PROMO, "wiring_1.jpg")
    up(im, K).convert("RGB").save(out, quality=95, subsampling=0)
    print(out)


if __name__ == "__main__":
    make()
