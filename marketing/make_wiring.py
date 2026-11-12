"""Náborový post „Wiring party“ (1080×1350), filmový: světlice nad zemí nikoho, proti světlu silueta vojáka se svitkem drátu
a v popředí velký ostnatý drát na kozách. Siluety ze spritů hry (vyplněné tmavou barvou, okraj nasvícený světlicí). Bez čísel.
Použití: python marketing/make_wiring.py → marketing/promo/wiring_1.jpg
"""
import math, os, random, sys
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_posts import P, W, H, K, canvas, font, text_c, sprite, up, frame  # noqa: E402
from day_art import grad, light, bayer  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROMO = os.path.join(ROOT, "marketing", "promo")
GROUND = 196          # horizont / zem
FX, FY = 156, 70      # světlice


def silhouette(name, k, col, rim=None, rim_dx=1):
    """sprite → silueta (plná barva), volitelně světlý okraj na straně ke světlu"""
    s = up(sprite(name), k)
    a = s.split()[3]
    out = Image.new("RGBA", s.size, (0, 0, 0, 0))
    px, ap = out.load(), a.load()
    for y in range(s.height):
        for x in range(s.width):
            if ap[x, y] > 128:
                px[x, y] = col + (255,)
    if rim:
        for y in range(s.height):
            for x in range(s.width):
                if ap[x, y] > 128:
                    nx = x + rim_dx
                    if not (0 <= nx < s.width) or ap[nx, y] <= 128 or (y > 0 and ap[x, y - 1] <= 128):
                        px[x, y] = rim + (255,)
    return out


def trestle(d, x, y, h, col, rim):
    """koza z kůlů (X) pro drát"""
    d.line((x - h // 2, y, x + h // 3, y - h), fill=col, width=2)
    d.line((x + h // 2, y, x - h // 3, y - h), fill=col, width=2)
    d.point((x + h // 3, y - h), fill=rim)
    d.point((x - h // 3 + 1, y - h + 1), fill=rim)


def concertina(d, x0, x1, cy, r, col, rim, seed):
    """svitek ostnatého drátu: řada překrývajících se smyček s ostny, okraj ke světlu nasvícený"""
    rnd = random.Random(seed)
    x = x0
    while x < x1:
        rr = r + rnd.randrange(-2, 3)
        pts = []
        for a in range(0, 360, 6):
            t = math.radians(a)
            pts.append((x + math.cos(t) * rr * 0.55, cy + math.sin(t) * rr))
        for i in range(len(pts)):
            (ax, ay), (bx, by) = pts[i], pts[(i + 1) % len(pts)]
            d.line((ax, ay, bx, by), fill=col)
        for a in range(0, 360, 40):  # ostny
            t = math.radians(a + rnd.randrange(20))
            px_, py_ = x + math.cos(t) * rr * 0.55, cy + math.sin(t) * rr
            d.line((px_ - 1, py_ - 1, px_ + 1, py_ + 1), fill=col)
            if math.sin(t) < -0.2 and math.cos(t) > -0.3:
                d.point((int(px_), int(py_) - 1), fill=rim)
        x += int(rr * 0.75)


def make():
    im = canvas()
    # obloha: noc nahoře, dole kouř nasvícený světlicí
    grad(im, (0, 0, W, GROUND), [P["ink"], P["ink"], P["dark"], P["mud0"], P["rust"], P["fire"]])
    light(im, FX, FY, 170, strength=1.6, steps=3)
    d = ImageDraw.Draw(im)
    # světlice: jasné jádro, kouřová stopa
    for i in range(26):
        d.point((FX - 3 - i // 2 + (i % 3 == 0), FY + 3 + i), fill=P["grey"] if i % 3 else P["steel"])
    d.ellipse((FX - 3, FY - 3, FX + 3, FY + 3), fill=P["pale"])
    d.ellipse((FX - 1, FY - 1, FX + 1, FY + 1), fill=P["white"])
    # vzdálený obzor: rozstřílené stromy a nepřátelský val, dva plány
    rnd = random.Random(8)
    for x in range(0, W):
        h = 4 + int(2 * math.sin(x / 9)) + (rnd.random() < 0.1)
        d.line((x, GROUND - 14 - h, x, GROUND - 10), fill=P["mud0"])
    for tx in (14, 46, 92, 196, 208):
        hh = 18 + rnd.randrange(16)
        d.line((tx, GROUND - 12, tx + rnd.randrange(-2, 3), GROUND - 12 - hh), fill=P["dark"], width=2)
        d.line((tx, GROUND - 12 - hh + 6, tx + 5, GROUND - 12 - hh), fill=P["dark"])
    d.rectangle((0, GROUND - 10, W, H), fill=P["ink"])
    for x in range(0, W):  # nerovná zem
        d.line((x, GROUND - 10 - int(3 + 3 * math.sin(x / 13) + 2 * math.sin(x / 5)), x, GROUND - 10), fill=P["ink"])
    # kůly a drát v dálce
    for x in range(8, W, 26):
        d.line((x, GROUND - 12, x, GROUND - 22), fill=P["dark"])
    d.line((0, GROUND - 19, W, GROUND - 18), fill=P["dark"])
    # silueta: voják nese svitek drátu (chodí doprava, ke světlu); druhý leží a drží kůl
    man = silhouette("concord@walk_east_2.png", 3, P["ink"], rim=P["gold"], rim_dx=1)
    im.alpha_composite(man, (52, GROUND - 10 - 30 * 3))
    far = silhouette("hegemony@walk_east_4.png", 2, P["ink"], rim=P["fire"], rim_dx=1)
    im.alpha_composite(far, (134, GROUND - 12 - 30 * 2))
    d = ImageDraw.Draw(im)
    concertina(d, 88, 104, GROUND - 52, 7, P["ink"], P["gold"], 3)  # svitek v ruce
    d.line((166, GROUND - 40, 176, GROUND - 58), fill=P["ink"], width=2)  # kůl na rameni druhého
    d.point((176, GROUND - 59), fill=P["gold"])
    # popředí: velký ostnatý drát na kozách přes celou šířku
    for x in (-4, 66, 136, 206):
        trestle(d, x, GROUND + 2, 50, P["ink"], P["gold"])
    concertina(d, -14, W + 16, GROUND - 22, 18, P["ink"], P["gold"], 11)
    for yy in (GROUND - 44, GROUND - 32):  # napnuté prameny mezi kozami
        for x in range(0, W):
            d.point((x, yy + (1 if (x // 5) % 3 == 0 else 0)), fill=P["ink"])
            if x % 7 == 0:
                d.line((x - 1, yy - 1, x + 1, yy + 1), fill=P["ink"])
    d.line((0, GROUND - 10, W, GROUND - 8), fill=P["ink"])
    # spodní text na zemi
    text_c(d, W // 2, 208, "WIRING PARTY", font(16, True), P["white"])
    text_c(d, W // 2, 227, "VOLUNTEERS WANTED. TONIGHT.", font(8, True), P["gold"])
    text_c(d, W // 2, 240, "COMMENT WIRE. BOTH SIDES.", font(8), P["pale"])
    text_c(d, W // 2, 251, "KEEP YOUR HEAD DOWN.", font(8), P["pale"])
    frame(im)
    out = os.path.join(PROMO, "wiring_1.jpg")
    up(im, K).convert("RGB").save(out, quality=95, subsampling=0)
    print(out)


if __name__ == "__main__":
    make()
