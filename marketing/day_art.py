"""Ručně kreslené pixelové scény pro denní posty (make_day.py): interiér obvaziště, nosiči za soumraku,
ostnatý drát, pytle s pískem, nemocniční dugout. Kreslí se v malém rozlišení (216×270) a paletě Trench 24
(+ dva tóny pleti), světlo a přechody ditheringem (Bayer 4×4), nakonec celočíselné zvětšení.
"""
import math
import random

from PIL import Image, ImageDraw

from make_posts import P

SKIN, SKIN_D = (201, 154, 116), (150, 104, 78)
BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
# o stupeň světlejší barva (lampa, světlice); co tu není, zůstane
LIGHTER = {
    P["ink"]: P["dark"], P["dark"]: P["mud0"], P["mud0"]: P["mud1"], P["mud1"]: P["mud2"], P["mud2"]: P["mud3"],
    P["mud3"]: P["sand"], P["sand"]: P["bone"], P["bone"]: P["pale"], P["pale"]: P["white"], P["steel"]: P["grey"],
    P["grey"]: P["pale"], P["olive"]: P["khaki"], P["khaki"]: P["yellow"], P["water"]: P["steel"], P["blood"]: P["rust"],
    P["rust"]: P["fire"], P["fire"]: P["gold"], SKIN_D: SKIN, SKIN: P["pale"],
}
DARKER = {v: k for k, v in LIGHTER.items() if k not in (P["steel"], SKIN_D, P["blood"], P["water"])}
DARKER.update({P["grey"]: P["steel"], P["khaki"]: P["olive"], SKIN: SKIN_D, P["rust"]: P["blood"], P["steel"]: P["water"]})


def bayer(x, y):
    return BAYER[(y % 4) * 4 + (x % 4)] / 16


def grad(im, box, cols, vertical=True):
    """přechod mezi barvami palety s ditheringem"""
    x0, y0, x1, y1 = box
    px = im.load()
    n = (y1 - y0) if vertical else (x1 - x0)
    for y in range(y0, y1):
        for x in range(x0, x1):
            k = ((y - y0) if vertical else (x - x0)) / max(1, n - 1) * (len(cols) - 1)
            i = min(len(cols) - 2, int(k))
            px[x, y] = (cols[i + 1] if (k - i) > bayer(x, y) else cols[i]) + (255,)


def light(im, cx, cy, r, strength=1.0, box=None, steps=2, keep=()):
    """teplé světlo: zesvětlí pixely v kruhu (víc stupňů blíž ke zdroji), dithering na okrajích"""
    px = im.load()
    x0, y0, x1, y1 = box or (0, 0, im.width, im.height)
    for y in range(max(0, y0, int(cy - r)), min(y1, im.height, int(cy + r) + 1)):
        for x in range(max(0, x0, int(cx - r)), min(x1, im.width, int(cx + r) + 1)):
            d = math.hypot((x - cx), (y - cy) * 1.15) / r
            if d >= 1:
                continue
            v = strength * (1 - d) ** 1.1 * steps
            c = px[x, y][:3]
            while v > 0:
                if min(1, v) > bayer(x, y) and c in LIGHTER and c not in keep:
                    c = LIGHTER[c]
                v -= 1
            px[x, y] = c + (255,)


def shade(im, box, strength=1.0, axis="y", reverse=False):
    """stín (vinětace): ztmaví k okraji"""
    px = im.load()
    x0, y0, x1, y1 = box
    for y in range(y0, y1):
        for x in range(x0, x1):
            k = (y - y0) / max(1, y1 - y0 - 1) if axis == "y" else (x - x0) / max(1, x1 - x0 - 1)
            k = 1 - k if reverse else k
            c = px[x, y][:3]
            if strength * k > bayer(x, y) and c in DARKER:
                px[x, y] = DARKER[c] + (255,)


def noise(im, box, cols, density, seed):
    rnd = random.Random(seed)
    d = ImageDraw.Draw(im)
    x0, y0, x1, y1 = box
    for _ in range(int((x1 - x0) * (y1 - y0) * density)):
        d.point((rnd.randrange(x0, x1), rnd.randrange(y0, y1)), fill=rnd.choice(cols))


def bitmap(d, x, y, rows, colmap):
    for j, row in enumerate(rows):
        for i, ch in enumerate(row):
            if ch in colmap:
                d.point((x + i, y + j), fill=colmap[ch])


# ---------------- prvky ----------------
def planks(im, box, seed=1, vertical=True):
    """fošny obložení: střídavé tóny, kresba dřeva, hřebíky"""
    d = ImageDraw.Draw(im)
    rnd = random.Random(seed)
    x0, y0, x1, y1 = box
    w = 11
    if vertical:
        for i, x in enumerate(range(x0, x1, w)):
            c = (P["mud1"], P["mud2"], P["mud1"], P["mud0"])[rnd.randrange(4)]
            d.rectangle((x, y0, min(x1, x + w - 1), y1), fill=c)
            d.line((x, y0, x, y1), fill=P["ink"])
            for _ in range(5):  # kresba
                gx, gy = x + rnd.randrange(2, w - 1), rnd.randrange(y0, y1 - 8)
                d.line((gx, gy, gx, gy + rnd.randrange(4, 12)), fill=DARKER.get(c, P["ink"]))
            for ny in (y0 + 4, y1 - 5):
                d.point((x + w // 2, ny), fill=P["sand"])
    else:
        h = 6
        for j, y in enumerate(range(y0, y1, h)):
            c = (P["mud2"], P["mud1"], P["mud2"], P["mud3"])[rnd.randrange(4)]
            d.rectangle((x0, y, x1, min(y1, y + h - 2)), fill=c)
            d.line((x0, y, x1, y), fill=LIGHTER.get(c, c))
            d.line((x0, y + h - 1, x1, y + h - 1), fill=P["ink"])
            off = rnd.randrange(30)
            for gx in range(x0 + off, x1, 37):
                d.line((gx, y + 1, gx, y + h - 2), fill=P["ink"])


def sandbag_wall(im, box, seed=3, rows_color=None):
    """zeď z pytlů: zaoblené pytle s přehybem, střídavé řady"""
    d = ImageDraw.Draw(im)
    rnd = random.Random(seed)
    x0, y0, x1, y1 = box
    bw, bh = 14, 7
    for r, y in enumerate(range(y1 - bh, y0 - bh, -bh)):
        off = -(bw // 2) if r % 2 else 0
        for x in range(x0 + off, x1, bw):
            base = rows_color or rnd.choice([P["sand"], P["sand"], P["mud3"], P["bone"]])
            bx0, bx1 = max(x0, x), min(x1, x + bw - 1)
            if bx1 - bx0 < 3:
                continue
            d.rounded_rectangle((bx0, y, bx1, y + bh - 1), 3, fill=base, outline=P["mud1"])
            d.line((bx0 + 2, y + 1, bx1 - 3, y + 1), fill=LIGHTER.get(base, base))  # odlesk nahoře
            d.line((bx0 + 2, y + bh - 2, bx1 - 2, y + bh - 2), fill=DARKER.get(base, base))
            if bx1 - bx0 > 8:
                tx = bx0 + (bx1 - bx0) * 2 // 3
                d.line((tx, y + 1, tx, y + bh - 2), fill=DARKER.get(base, base))  # zavázaný konec
            if rnd.random() < 0.3:
                d.point((bx0 + rnd.randrange(2, max(3, bx1 - bx0 - 2)), y + 3), fill=P["mud2"])


def red_cross(d, x, y, s=14, cloth=P["pale"]):
    """plachta s červeným křížem, zvlněný okraj"""
    d.rectangle((x, y, x + s * 2, y + s * 2 - 2), fill=cloth, outline=P["sand"])
    for i in range(0, s * 2, 4):
        d.point((x + i, y + s * 2 - 1), fill=cloth)
    d.line((x + 1, y + 1, x + s * 2 - 1, y + 1), fill=P["white"])
    a = s // 3
    d.rectangle((x + s - a, y + 4, x + s + a, y + s * 2 - 6), fill=P["rust"])
    d.rectangle((x + 4, y + s - a - 1, x + s * 2 - 4, y + s + a - 1), fill=P["rust"])
    d.line((x + s - a, y + 4, x + s + a, y + 4), fill=P["fire"])
    d.line((x + 2, y + s * 2 - 3, x + s * 2 - 2, y + s * 2 - 3), fill=P["bone"])


def lamp(im, x, y, top=0):
    d = ImageDraw.Draw(im)
    d.line((x, top, x, y - 4), fill=P["ink"])
    bitmap(d, x - 4, y - 4, [
        "...##...",
        "..####..",
        ".#oyyo#.",
        ".#yWWy#.",
        ".#oyyo#.",
        "..####..",
        ".######.",
    ], {"#": P["ink"], "o": P["fire"], "y": P["gold"], "W": P["white"]})


def cot(im, x, y, w=78, blanket=P["olive"]):
    """polní lůžko z boku: dřevěný rám, nohy do X, plachtovina s průhybem"""
    d = ImageDraw.Draw(im)
    # nohy do X
    for lx in (x + 6, x + w - 14):
        d.line((lx, y + 4, lx + 8, y + 16), fill=P["mud1"])
        d.line((lx + 8, y + 4, lx, y + 16), fill=P["mud2"])
        d.line((lx - 1, y + 16, lx + 9, y + 16), fill=P["ink"])
    # rám a plachtovina
    d.rectangle((x, y + 1, x + w, y + 4), fill=P["mud2"])
    d.line((x, y + 1, x + w, y + 1), fill=P["mud3"])
    d.line((x, y + 4, x + w, y + 4), fill=P["ink"])
    for i in range(w):
        sag = int(1.5 * math.sin(math.pi * i / w))
        d.point((x + i, y + 2 + sag), fill=P["khaki"] if i % 7 else P["olive"])
    # stín pod lůžkem
    for i in range(4, w - 2):
        if (i + y) % 2 == 0:
            d.point((x + i, y + 17), fill=P["ink"])


def wounded(im, x, y, w=78, faction=0, bandage="head", seed=0):
    """raněný na lůžku: polštář, hlava s obvazem, deka s přehyby, paže přes deku, boty"""
    d = ImageDraw.Draw(im)
    rnd = random.Random(seed)
    uni = (P["grey"], P["steel"]) if faction == 0 else (P["khaki"], P["olive"])
    blank = (P["mud3"], P["mud2"], P["sand"]) if faction == 0 else (P["sand"], P["mud3"], P["bone"])
    # polštář
    d.rounded_rectangle((x + 1, y - 5, x + 16, y + 1), 2, fill=P["pale"], outline=P["bone"])
    d.line((x + 3, y - 4, x + 13, y - 4), fill=P["white"])
    # hlava (z boku), vlasy, obvaz
    d.ellipse((x + 4, y - 11, x + 14, y - 2), fill=SKIN, outline=SKIN_D)
    d.point((x + 6, y - 7), fill=P["ink"])  # oko (zavřené)
    d.line((x + 5, y - 7, x + 7, y - 7), fill=SKIN_D)
    d.line((x + 9, y - 11, x + 14, y - 8), fill=P["mud1"])  # vlasy
    if bandage == "head":
        d.line((x + 8, y - 11, x + 14, y - 7), fill=P["white"])
        d.line((x + 8, y - 10, x + 14, y - 6), fill=P["pale"])
        d.point((x + 12, y - 9), fill=P["rust"])
    # deka: od ramen po kotníky, přehyby
    bx0, bx1 = x + 13, x + w - 7
    d.rounded_rectangle((bx0, y - 7, bx1, y + 2), 3, fill=blank[0], outline=P["mud1"])
    d.line((bx0 + 2, y - 6, bx1 - 2, y - 6), fill=blank[2])
    for fx in range(bx0 + 8, bx1 - 4, 9 + rnd.randrange(3)):
        d.line((fx, y - 5, fx + 3, y + 1), fill=blank[1])
    # kolena: mírný hrbol
    kx = bx0 + (bx1 - bx0) * 3 // 5
    d.arc((kx - 8, y - 10, kx + 8, y - 2), 200, 340, fill=blank[1])
    d.line((kx - 5, y - 9, kx + 5, y - 9), fill=blank[0])
    # paže v rukávu přes deku, dlaň
    ax = bx0 + 4
    d.line((ax, y - 5, ax + 14, y - 4), fill=uni[0], width=2)
    d.line((ax, y - 3, ax + 14, y - 2), fill=uni[1])
    d.rectangle((ax + 15, y - 5, ax + 17, y - 3), fill=SKIN)
    if bandage == "arm":
        d.rectangle((ax + 6, y - 6, ax + 10, y - 2), fill=P["white"])
        d.point((ax + 8, y - 4), fill=P["rust"])
    # boty
    d.rectangle((bx1 + 1, y - 6, bx1 + 4, y - 1), fill=P["mud0"])
    d.line((bx1 + 4, y - 5, bx1 + 4, y - 1), fill=P["ink"])


def folded_blanket(im, x, y, w=78):
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((x + 1, y - 4, x + 15, y + 1), 2, fill=P["pale"], outline=P["bone"])
    for i, c in enumerate([P["mud3"], P["sand"], P["mud3"]]):
        d.rectangle((x + w - 30, y - 3 - i * 2, x + w - 8, y - 2 - i * 2), fill=c)
    d.line((x + w - 30, y - 8, x + w - 8, y - 8), fill=P["bone"])


def stretcher_floor(im, x, y, faction=0, seed=0):
    """raněný na nosítkách na zemi (čeká na lůžko)"""
    d = ImageDraw.Draw(im)
    d.line((x - 4, y + 2, x + 72, y + 2), fill=P["mud1"], width=2)
    d.rectangle((x, y - 1, x + 68, y + 2), fill=P["bone"])
    wounded(im, x - 2, y - 1, 70, faction, bandage="arm", seed=seed)


def bottle_shelf(im, x, y):
    d = ImageDraw.Draw(im)
    d.rectangle((x, y, x + 34, y + 2), fill=P["mud3"])
    d.line((x, y + 3, x + 34, y + 3), fill=P["ink"])
    for i, (h, c) in enumerate([(7, P["olive"]), (5, P["bone"]), (8, P["water"]), (4, P["rust"]), (6, P["khaki"])]):
        bx = x + 2 + i * 7
        d.rectangle((bx, y - h, bx + 3, y - 1), fill=c)
        d.point((bx + 1, y - h - 1), fill=P["mud1"])
        d.point((bx, y - h + 1), fill=LIGHTER.get(c, c))
    # bedna s křížem pod policí
    d.rectangle((x + 4, y + 22, x + 26, y + 36), fill=P["mud2"], outline=P["ink"])
    d.line((x + 5, y + 23, x + 25, y + 23), fill=P["mud3"])
    d.rectangle((x + 13, y + 26, x + 17, y + 33), fill=P["rust"])
    d.rectangle((x + 10, y + 28, x + 20, y + 31), fill=P["rust"])


def interior(faction, occupants, stretchers=0, seed=1):
    """obvaziště v dugoutu: obložení, strop z vlnitého plechu, lampa, plachta s křížem, dvě lůžka"""
    W, H = 216, 270
    im = Image.new("RGBA", (W, H), P["dark"] + (255,))
    d = ImageDraw.Draw(im)
    # strop: vlnitý plech a trámy
    for x in range(W):
        for y in range(0, 22):
            d.point((x, y), fill=(P["steel"] if (x // 3) % 2 else P["water"]) if y < 18 else P["ink"])
    for bx in range(0, W, 54):
        d.rectangle((bx, 18, bx + 7, 26), fill=P["mud1"], outline=P["ink"])
    # zadní stěna: fošny, svislé sloupky, vodorovný trám
    planks(im, (0, 26, W, 196), seed=seed)
    for px_ in (10, W - 18):
        d.rectangle((px_, 22, px_ + 8, 200), fill=P["mud2"], outline=P["ink"])
        d.line((px_ + 2, 24, px_ + 2, 198), fill=P["mud3"])
    d.rectangle((0, 58, W, 64), fill=P["mud2"], outline=P["ink"])
    d.line((0, 59, W, 59), fill=P["mud3"])
    # pytle u paty stěny
    sandbag_wall(im, (0, 170, W, 196), seed=seed + 2)
    # podlaha: fošnová lávka a bláto
    grad(im, (0, 196, W, H), [P["mud0"], P["dark"], P["ink"]])
    planks(im, (8, 206, W - 8, 250), seed=seed + 4, vertical=False)
    d = ImageDraw.Draw(im)
    # plachta s křížem, police s lahvemi
    red_cross(d, 24, 70, 15)
    bottle_shelf(im, 158, 92)
    d = ImageDraw.Draw(im)
    # lůžka
    for i in range(2):
        x = 14 + i * 100
        cot(im, x, 156, 82)
        if i < len(occupants):
            wounded(im, x + 1, 156, 82, faction, bandage="head" if i % 2 == 0 else "arm", seed=seed + i)
        else:
            folded_blanket(im, x + 1, 156, 82)
    for k in range(min(stretchers, 2)):
        stretcher_floor(im, 30 + k * 90, 236 - k * 2, faction, seed + 9 + k)
    # lampa a světlo
    lamp(im, 108, 58, top=26)
    light(im, 108, 56, 150, 1.0, box=(0, 22, W, H), steps=2)
    shade(im, (0, 200, W, H), 0.9)
    shade(im, (0, 0, 26, H), 0.7, axis="x", reverse=True)
    shade(im, (W - 26, 0, W, H), 0.7, axis="x")
    return im


# ---------------- venkovní scény ----------------
BEARER = [
    "..####..",
    ".######.",
    "...##...",
    "..####..",
    ".######.",
    ".######.",
    ".##.###.",
    "..####..",
    "..####..",
    "..#..#..",
    ".##..##.",
    ".#....#.",
    "##....##",
]


def dusk_bearers(W=216, H=78, seed=5):
    """soumrak nad zákopem: světlice, mrtvý strom, drát na kůlech, dva nosiči s raněným"""
    im = Image.new("RGBA", (W, H), P["ink"] + (255,))
    grad(im, (0, 0, W, H - 18), [P["ink"], P["dark"], P["blood"], P["rust"], P["fire"]])
    d = ImageDraw.Draw(im)
    # světlice
    fx, fy = 158, 14
    light(im, fx, fy, 60, 0.9, steps=2)
    d.rectangle((fx - 1, fy - 1, fx + 1, fy + 1), fill=P["white"])
    for k in range(1, 8):
        d.point((fx - k // 2, fy + k * 2), fill=P["pale"] if k < 4 else P["bone"])
    # vzdálené kopce
    for x in range(W):
        h = int(H - 30 + 4 * math.sin(x * 0.05) + 2 * math.sin(x * 0.17))
        d.line((x, h, x, H), fill=P["blood"])
    # okraj zákopu (silueta) a parapet
    for x in range(W):
        h = int(H - 18 + 2 * math.sin(x * 0.09 + 1))
        d.line((x, h, x, H), fill=P["ink"])
    # mrtvý strom
    tx = 30
    d.line((tx, H - 19, tx, H - 52), fill=P["ink"], width=2)
    for (a, b, c, e) in [(tx, H - 40, tx - 10, H - 50), (tx, H - 46, tx + 9, H - 58), (tx + 1, H - 34, tx + 12, H - 40), (tx - 6, H - 46, tx - 9, H - 55)]:
        d.line((a, b, c, e), fill=P["ink"])
    # kůly s drátem
    for x in range(62, W, 26):
        h = int(H - 18 + 2 * math.sin(x * 0.09 + 1))
        d.line((x, h, x, h - 11), fill=P["ink"])
        d.line((x - 1, h - 11, x + 1, h - 12), fill=P["ink"])
        for i in range(26):
            yy = h - 8 + int(2 * math.sin(i / 26 * math.pi))
            if x + i < W:
                d.point((x + i, yy), fill=P["ink"])
                if i % 4 == 0:
                    d.point((x + i, yy - 1), fill=P["ink"])
    # nosiči s nosítky (siluety proti obloze)
    by = H - 31
    bitmap(d, 84, by, BEARER, {"#": P["ink"]})
    bitmap(d, 122, by, BEARER, {"#": P["ink"]})
    d.line((88, by + 6, 134, by + 6), fill=P["ink"], width=2)  # tyče
    d.rounded_rectangle((94, by + 1, 126, by + 6), 2, fill=P["ink"])  # raněný na nosítkách
    d.ellipse((92, by - 1, 98, by + 4), fill=P["ink"])
    return im


def barbed(d, x0, x1, y, seed=0, col=P["ink"], hi=P["steel"]):
    rnd = random.Random(seed)
    for x in range(x0, x1, 20):
        d.line((x, y + 2, x + rnd.randrange(-1, 2), y - 12), fill=P["mud1"])
        d.line((x + 1, y + 2, x + 1, y - 11), fill=P["mud0"])
    # spirála (svitek)
    for cx in range(x0, x1, 7):
        for a in range(0, 360, 20):
            r = math.radians(a)
            px_, py_ = int(cx + math.cos(r) * 5 + a / 360 * 7), int(y - 5 + math.sin(r) * 5)
            if x0 <= px_ < x1:
                d.point((px_, py_), fill=hi if math.sin(r) < -0.3 else col)
    for x in range(x0, x1, 3):
        d.point((x, y - 9 + (x % 5 == 0)), fill=hi)


def tile_hospital(w, h):
    """nemocniční dugout zvenku: násep, vchod v pytlích s teplým světlem, plachta s křížem, lucerna"""
    im = Image.new("RGBA", (w, h), P["ink"] + (255,))
    grad(im, (0, 0, w, h), [P["ink"], P["dark"], P["mud0"]])
    d = ImageDraw.Draw(im)
    for x in range(w):  # násep z hlíny
        top = int(h * 0.32 + 2 * math.sin(x * 0.12) + 1.5 * math.sin(x * 0.31))
        d.line((x, top, x, h), fill=P["mud1"])
        d.point((x, top), fill=P["mud2"])
    cx = w // 2
    for r, y in enumerate(range(h - 5, int(h * 0.42), -4)):  # pytle po stranách vchodu
        for x in range(-3 if r % 2 else 0, w, 8):
            if abs(x + 3 - cx) < 10:
                continue
            d.rounded_rectangle((x, y, x + 7, y + 3), 1, fill=(P["sand"], P["mud3"])[(x // 8 + r) % 2], outline=P["ink"])
    ex0, ex1, ey = cx - 7, cx + 7, int(h * 0.38)
    d.rectangle((ex0, ey, ex1, h - 1), fill=P["ink"])
    d.rectangle((ex0 + 2, ey + 3, ex1 - 2, h - 1), fill=P["mud0"])
    light(im, cx, h - 2, 9, 1.0, box=(ex0 + 2, ey + 3, ex1 - 1, h), steps=4, keep=(P["rust"],))
    d = ImageDraw.Draw(im)
    d.rectangle((ex0 - 2, ey - 2, ex1 + 2, ey), fill=P["mud2"], outline=P["ink"])
    d.line((ex0 - 1, ey, ex0 - 1, h - 1), fill=P["mud2"]); d.line((ex1 + 1, ey, ex1 + 1, h - 1), fill=P["mud2"])
    # plachta s křížem nad vchodem
    fx, fy = cx - 6, 2
    d.rectangle((fx, fy, fx + 12, fy + 9), fill=P["pale"], outline=P["sand"])
    d.rectangle((fx + 5, fy + 2, fx + 7, fy + 7), fill=P["rust"]); d.rectangle((fx + 3, fy + 4, fx + 9, fy + 5), fill=P["rust"])
    d.line((fx + 1, fy + 10, fx + 1, ey - 2), fill=P["ink"]); d.line((fx + 11, fy + 10, fx + 11, ey - 2), fill=P["ink"])
    # lucerna vpravo
    lx, ly = ex1 + 6, ey + 3
    d.line((lx, ey - 1, lx, ly), fill=P["ink"])
    bitmap(d, lx - 2, ly, [".K.", "KyK", "KWK", "KKK"], {"K": P["ink"], "y": P["gold"], "W": P["white"]})
    light(im, lx, ly + 2, 12, 0.8, steps=2, keep=(P["rust"], P["gold"], P["white"]))
    return im


def tile_wire(w, h):
    """noc v zemi nikoho: kůly s pásy ostnatého drátu proti obloze nasvícené světlicí"""
    im = Image.new("RGBA", (w, h), P["ink"] + (255,))
    d = ImageDraw.Draw(im)
    for y in range(h):  # klidná noční obloha: tři pásy, dithering jen na přechodu
        k = y / h
        c = P["water"] if k < 0.35 else P["steel"]
        if 0.3 < k < 0.4 and bayer(3, y) < 0.5:
            c = P["water"]
        d.line((0, y, w, y), fill=c)
    fx, fy = int(w * 0.72), 4
    light(im, fx, fy, 14, 0.7, steps=1)
    d = ImageDraw.Draw(im)
    d.point((fx, fy), fill=P["white"]); d.point((fx + 1, fy), fill=P["pale"]); d.point((fx, fy + 1), fill=P["pale"])
    for x in range(w):  # zem
        g = int(h * 0.72 + 1.5 * math.sin(x * 0.2))
        d.line((x, g, x, h), fill=P["mud1"])
        d.point((x, g), fill=P["mud2"])
    for row, (base, tall, step, off) in enumerate([(int(h * 0.62), 8, 9, 2), (h - 1, 12, 12, 6)]):
        posts = list(range(off, w + step, step))
        for px_ in posts:
            d.line((px_, base, px_ + (1 if px_ % 2 else 0), base - tall), fill=P["ink"])
        for k in range(3):  # tři prameny, prověšené mezi kůly
            yy = base - tall + 2 + k * 3
            for a_, b_ in zip(posts, posts[1:]):
                for x in range(a_, b_):
                    t = (x - a_) / (b_ - a_)
                    y = yy + int(1.5 * math.sin(t * math.pi))
                    if 0 <= x < w:
                        d.point((x, y), fill=P["ink"])
                        if (x + k) % 3 == 0:
                            d.point((x, y - 1), fill=P["ink"])  # ostny
    return im


def tile_sandbags(w, h):
    """parapet z čerstvých pytlů proti soumraku, ocelový štít s průzorem a puška"""
    im = Image.new("RGBA", (w, h), P["ink"] + (255,))
    grad(im, (0, 0, w, int(h * 0.5)), [P["dark"], P["blood"], P["rust"]])
    d = ImageDraw.Draw(im)
    top = int(h * 0.42)
    for r, y in enumerate(range(h - 5, top - 1, -4)):
        for x in range(-4 if r % 2 else 0, w, 8):
            c = (P["sand"], P["bone"], P["mud3"])[(x // 8 * 7 + r * 3) % 3]
            d.rounded_rectangle((x, y, x + 7, y + 3), 1, fill=c, outline=P["mud1"])
            d.line((x + 1, y + 1, x + 5, y + 1), fill=LIGHTER.get(c, c))
    sx = int(w * 0.58)
    d.rectangle((sx, top - 7, sx + 8, top), fill=P["steel"], outline=P["ink"])
    d.line((sx + 1, top - 6, sx + 7, top - 6), fill=P["grey"])
    d.rectangle((sx + 3, top - 4, sx + 5, top - 3), fill=P["ink"])
    d.line((sx + 4, top - 3, sx + 20, top - 6), fill=P["ink"])
    d.line((sx - 6, top - 1, sx + 1, top - 2), fill=P["mud0"])
    return im


# ================= v2: scény v polovičním rozlišení (108×135, zvětšení ×2 do plakátu 216×270) =================
# raněný na lůžku z boku, hlava vlevo na polštáři, obličej nahoru; 52×12
LYING = [
    ".......K..............................................",
    "......KsK.............................................",
    "..KKKKsssKK.....................................KKK...",
    ".KwwwwSsssK....KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKlllK..",
    "KwwwwwsNssKKKKKuuuuuuuuuuussKlllllllllllllllllllbbbbK.",
    "KwwwwhhsssKbbbbUUUUUUUUUUUbbbbbbbbbbBbbbbbbbbbbbbbbbK.",
    "KhhhhhhSSKbbbbbbbbbBbbbbbbbbbbbbbbbbBbbbbbbbbbbbbbbbK.",
    ".KhhhhSSKbbbbbbbbbbBbbbbbbbbbbbbbbbbbBbbbbbbbbbbbbbbK.",
    "KppppppppKbbbbbbbbBbbbbbbbbbbbbbbbbbbBbbbbbbbbbbbbbbK.",
    "KpppppppppKBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBK.",
    "KPPPPPPPPPPKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK.",
    ".KKKKKKKKKK...........................................",
]
# lůžko složené (prázdné): polštář a složená deka
EMPTY = [
    "..................................KKKKKKKKKK........",
    ".................................KllllllllllK.......",
    ".KKKKKKKKKKKKK...................KbbbbbbbbbbK.......",
    "KppppppppppppPK..................KBBBBBBBBBBK.......",
    "KPPPPPPPPPPPPPK..................KllllllllllK.......",
    ".KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKbbbbbbbbbbKKKKKKKK",
]
LAMP = [
    "....K....",
    "...KKK...",
    "..KKKKK..",
    ".KoyyyoK.",
    "KoyWWWyoK",
    "KoyWWWyoK",
    "KoyyWyyoK",
    ".KoyyyoK.",
    "..KKKKK..",
    ".KKKKKKK.",
]
BEARER2 = [
    "...KKK...",
    "..KKKKK..",
    ".KKKKKKK.",
    "...KKK...",
    "...KK....",
    "..KKKK...",
    ".KKKKKK..",
    ".KKKKKKKK",
    ".KKKKK...",
    "..KKKK...",
    "..KKKK...",
    "..K..K...",
    ".KK..KK..",
    ".K....K..",
    "KK....KK.",
]


def faction_cols(f):
    uni = (P["grey"], P["steel"]) if f == 0 else (P["khaki"], P["olive"])
    blank = (P["steel"], P["water"], P["grey"])  # šedomodrá vojenská deka (kontrast se dřevem); strana je poznat podle rukávu
    uni = (P["pale"], P["grey"]) if f == 0 else (P["khaki"], P["olive"])
    return {"K": P["ink"], "h": P["mud1"], "w": P["white"], "r": P["rust"], "s": SKIN, "S": SKIN_D, "N": SKIN_D,
            "u": uni[0], "U": uni[1], "b": blank[0], "B": blank[1], "l": blank[2], "o": P["mud0"], "p": P["pale"], "P": P["bone"]}


def cot2(d, x, y, w=50):
    """lůžko: dřevěný rám, nohy do X (tmavé, ať je vidět na podlaze); y = horní hrana rámu"""
    d.rectangle((x, y, x + w, y + 2), fill=P["mud3"], outline=P["ink"])
    d.line((x + 1, y, x + w - 1, y), fill=P["sand"])
    for lx in (x + 3, x + w - 11):
        d.line((lx, y + 3, lx + 8, y + 12), fill=P["ink"], width=2)
        d.line((lx + 8, y + 3, lx, y + 12), fill=P["mud1"], width=2)
    for i in range(-2, w + 3):
        d.point((x + i, y + 13), fill=P["ink"])
        if i % 2:
            d.point((x + i, y + 14), fill=P["ink"])


def medic_kit(d, x, y):
    """brašna se zdravotním křížem, kbelík, obvazy"""
    d.rounded_rectangle((x, y, x + 14, y + 9), 2, fill=P["mud3"], outline=P["ink"])
    d.line((x + 2, y + 1, x + 12, y + 1), fill=P["sand"])
    d.arc((x + 3, y - 5, x + 11, y + 3), 180, 360, fill=P["ink"])
    d.rectangle((x + 5, y + 3, x + 9, y + 7), fill=P["pale"]); d.rectangle((x + 6, y + 3, x + 8, y + 7), fill=P["rust"]); d.rectangle((x + 5, y + 4, x + 9, y + 6), fill=P["rust"])
    bx = x + 22
    d.polygon([(bx, y), (bx + 9, y), (bx + 8, y + 9), (bx + 1, y + 9)], fill=P["steel"], outline=P["ink"])
    d.line((bx + 1, y + 1, bx + 8, y + 1), fill=P["grey"])
    d.arc((bx, y - 5, bx + 9, y + 3), 180, 360, fill=P["ink"])
    for i, (ox, oy) in enumerate([(36, 6), (40, 8), (34, 9)]):
        d.ellipse((x + ox, y + oy, x + ox + 4, y + oy + 2), fill=P["pale"] if i else P["white"], outline=P["bone"])
    d.point((x + 38, y + 7), fill=P["rust"])


def interior2(faction, occupants, stretchers=0, seed=1):
    W, H = 108, 135
    im = Image.new("RGBA", (W, H), P["ink"] + (255,))
    d = ImageDraw.Draw(im)
    rnd = random.Random(seed)
    # strop z vlnitého plechu, trámy
    for x in range(W):
        for y in range(0, 9):
            d.point((x, y), fill=P["water"] if (x // 2) % 2 else P["dark"])
    d.line((0, 9, W, 9), fill=P["ink"])
    for bx in (6, 40, 74):
        d.rectangle((bx, 8, bx + 5, 12), fill=P["mud1"], outline=P["ink"])
    # zadní stěna z fošen
    for x in range(0, W, 7):
        c = rnd.choice([P["dark"], P["ink"], P["dark"], P["dark"], P["mud0"]])
        d.rectangle((x, 10, x + 6, 86), fill=c)
        d.line((x, 10, x, 86), fill=P["ink"])
        for _ in range(3):
            gx, gy = x + rnd.randrange(2, 6), rnd.randrange(12, 78)
            d.line((gx, gy, gx, gy + rnd.randrange(3, 8)), fill=DARKER.get(c, P["ink"]))
    for px_ in (2, W - 7):
        d.rectangle((px_, 9, px_ + 4, 88), fill=P["mud1"], outline=P["ink"])
        d.line((px_ + 1, 11, px_ + 1, 86), fill=P["mud2"])
    d.rectangle((0, 24, W, 27), fill=P["mud1"], outline=P["ink"])
    d.line((1, 25, W - 1, 25), fill=P["mud2"])
    # plachta s křížem
    x0, y0 = 12, 33
    d.rectangle((x0, y0, x0 + 18, y0 + 15), fill=P["pale"], outline=P["sand"])
    d.line((x0 + 1, y0 + 1, x0 + 17, y0 + 1), fill=P["white"])
    d.rectangle((x0 + 7, y0 + 3, x0 + 11, y0 + 12), fill=P["rust"])
    d.rectangle((x0 + 4, y0 + 6, x0 + 14, y0 + 9), fill=P["rust"])
    for i in range(0, 19, 3):
        d.point((x0 + i, y0 + 16), fill=P["pale"])
    d.line((x0 + 2, y0, x0 + 2, y0 - 2), fill=P["ink"]); d.line((x0 + 16, y0, x0 + 16, y0 - 2), fill=P["ink"])
    # police s lahvemi a bedna
    sx, sy = 76, 44
    d.rectangle((sx, sy, sx + 22, sy + 1), fill=P["mud3"]); d.line((sx, sy + 2, sx + 22, sy + 2), fill=P["ink"])
    for i, (h, c) in enumerate([(5, P["olive"]), (3, P["bone"]), (6, P["water"]), (3, P["rust"]), (4, P["khaki"])]):
        bx = sx + 1 + i * 4
        d.rectangle((bx, sy - h, bx + 2, sy - 1), fill=c)
        d.point((bx + 1, sy - h - 1), fill=P["mud1"])
        d.point((bx, sy - h + 1), fill=LIGHTER.get(c, c))
    d.rectangle((82, 58, 98, 70), fill=P["mud2"], outline=P["ink"])
    d.line((83, 59, 97, 59), fill=P["mud3"])
    d.rectangle((89, 61, 91, 67), fill=P["rust"]); d.rectangle((87, 63, 93, 65), fill=P["rust"])
    # pytle u paty stěny
    for r, y in enumerate((78, 82)):
        for x in range(-3 if r else 0, W, 8):
            d.rounded_rectangle((x, y, x + 7, y + 3), 1, fill=rnd.choice([P["mud1"], P["mud2"], P["mud1"]]), outline=P["ink"])
    # podlaha: tmavá fošnová lávka
    for j, y in enumerate(range(87, H, 4)):
        d.rectangle((0, y, W, y + 2), fill=(P["mud0"], P["dark"])[j % 2])
        d.line((0, y, W, y), fill=P["mud1"] if j % 2 == 0 else P["mud0"])
        d.line((0, y + 3, W, y + 3), fill=P["ink"])
    # světlo lampy (před kreslením lůžek: lůžka dostanou vlastní nasvícení)
    keep = (P["rust"], P["blood"], P["fire"], P["gold"], P["white"])
    light(im, 54, 40, 52, 1.0, box=(0, 10, W, H), steps=4, keep=keep)
    d = ImageDraw.Draw(im)
    # lůžka s raněnými
    cols = faction_cols(faction)
    for i in range(2):
        x = 3 + i * 53
        cot2(d, x, 93, 50)
        if i < len(occupants):
            bitmap(d, x, 81, LYING, cols)
        else:
            bitmap(d, x, 87, EMPTY, cols)
    d = ImageDraw.Draw(im)
    # vepředu: nosítka s čekajícím, jinak brašna a kbelík
    if stretchers:
        for k in range(min(stretchers, 2)):
            x = 8 + k * 50
            d.line((x - 4, 126, x + 48, 126), fill=P["mud2"], width=2)
            d.rectangle((x, 123, x + 44, 125), fill=P["bone"], outline=P["ink"])
            bitmap(d, x - 2, 112, LYING, cols)
    else:
        medic_kit(d, 30, 106)
    # lampa
    d.line((54, 10, 54, 30), fill=P["ink"])
    bitmap(d, 50, 30, LAMP, {"K": P["ink"], "o": P["fire"], "y": P["gold"], "W": P["white"]})
    for a_ in range(0, 360, 45):
        r = math.radians(a_)
        d.point((54 + round(math.cos(r) * 7), 35 + round(math.sin(r) * 7)), fill=P["fire"] if a_ % 90 else P["gold"])
    shade(im, (0, 0, 14, H), 0.9, axis="x", reverse=True)
    shade(im, (W - 14, 0, W, H), 0.9, axis="x")
    return im


def dusk2(W=108, H=40):
    im = Image.new("RGBA", (W, H), P["ink"] + (255,))
    grad(im, (0, 0, W, H - 8), [P["ink"], P["dark"], P["blood"], P["rust"], P["fire"]])
    d = ImageDraw.Draw(im)
    fx, fy = 80, 6
    light(im, fx, fy, 34, 0.9, steps=2)
    d.point((fx, fy), fill=P["white"]); d.point((fx + 1, fy), fill=P["pale"])
    for k in range(1, 6):
        d.point((fx - k // 3, fy + k * 2), fill=P["bone"])
    for x in range(W):
        d.line((x, int(H - 14 + 2 * math.sin(x * 0.09)), x, H), fill=P["blood"])
        d.line((x, int(H - 8 + 1.2 * math.sin(x * 0.15 + 1)), x, H), fill=P["ink"])
    tx = 14
    d.line((tx, H - 8, tx, H - 28), fill=P["ink"])
    d.line((tx + 1, H - 8, tx + 1, H - 22), fill=P["ink"])
    for a, b, c, e in [(tx, H - 20, tx - 6, H - 26), (tx, H - 24, tx + 5, H - 31), (tx + 1, H - 16, tx + 7, H - 20)]:
        d.line((a, b, c, e), fill=P["ink"])
    for x in range(30, W, 13):
        h = int(H - 8 + 1.2 * math.sin(x * 0.15 + 1))
        d.line((x, h, x, h - 6), fill=P["ink"])
        for i in range(13):
            if x + i < W:
                d.point((x + i, h - 4 + int(1.5 * math.sin(i / 13 * math.pi))), fill=P["ink"])
    by = H - 23
    bitmap(d, 40, by, BEARER2, {"K": P["ink"]})
    bitmap(d, 62, by, BEARER2, {"K": P["ink"]})
    d.line((44, by + 8, 70, by + 8), fill=P["ink"])
    d.rectangle((48, by + 5, 64, by + 8), fill=P["ink"])
    d.rectangle((47, by + 4, 50, by + 6), fill=P["ink"])
    return im


def paper(im, box, seed=2):
    """list papíru (telegram/Gazette): skvrny, vlákna, roztrhané okraje"""
    d = ImageDraw.Draw(im)
    rnd = random.Random(seed)
    x0, y0, x1, y1 = box
    d.rectangle(box, fill=P["pale"])
    noise(im, box, [P["bone"], P["white"], P["bone"]], 0.06, seed)
    for _ in range(6):  # skvrny od bláta a čaje
        cx, cy, r = rnd.randrange(x0, x1), rnd.randrange(y0, y1), rnd.randrange(3, 9)
        for yy in range(cy - r, cy + r):
            for xx in range(cx - r, cx + r):
                if x0 <= xx < x1 and y0 <= yy < y1 and math.hypot(xx - cx, yy - cy) < r and bayer(xx, yy) < 0.35:
                    d.point((xx, yy), fill=P["bone"])
    for x in range(x0, x1):  # roztrhané okraje
        for yy in range(rnd.randrange(0, 3)):
            d.point((x, y0 + yy), fill=P["dark"])
        for yy in range(rnd.randrange(0, 3)):
            d.point((x, y1 - yy), fill=P["dark"])
    shade_box = (x0, y1 + 1, x1, y1 + 3)
    d.rectangle(shade_box, fill=P["ink"])


def tag(d, x, y, w, text, f):
    """papírová cedulka na hřebíčku"""
    d.rectangle((x, y, x + w, y + 11), fill=P["pale"], outline=P["mud1"])
    d.line((x + 1, y + 1, x + w - 1, y + 1), fill=P["white"])
    d.point((x + w // 2, y - 1), fill=P["steel"]); d.point((x + w // 2, y), fill=P["ink"])
    tw = d.textlength(text, font=f)
    d.text((x + (w - tw) / 2, y - 2), text, font=f, fill=P["ink"])
