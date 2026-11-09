"""Kreslená scéna pro 1. snímek po dobytí kóty, v měřítku herních spritů (1 pixel scény = 1 pixel spritu).

Obloha a obzor s dělostřelectvem = herní malba fronty (web/public/assets/props/mood.png), přes ni kóta s plošinou,
pevnůstkou z pytlů, praporem vítěze a starým zákopem po svahu; v popředí vojáci přímo ze hry za valem z pytlů
stejného vzoru jako ve hře (web/src/terrain.js). Hegemonie míří k nám, Concord stojí zepředu za valem (pózu míření má jen zezadu).

scene(side) → RGBA 216×270 (plátno postů), vykresleno v 108×135 a zvětšeno ×2.
"""
import math
import os
import random

from PIL import Image, ImageDraw

from make_posts import ROOT, up

SOLD = os.path.join(ROOT, "web", "public", "assets", "soldiers")
PROPS = os.path.join(ROOT, "web", "public", "assets", "props")
PAL = [tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) for h in (
    "0e0d0c 1c1a17 2b2722 3d3730 524a3f 6b6152 857a68 a39782 c4b8a0 e3d9c3 3a3b2c 545639 6f7148 8c8a5c 4a4f52 666d70 "
    "8a9295 2a3138 5c2a22 7e3b2a a85a36 9fa640 c9c26a d98f3f").split()]

SW, SH = 108, 135
MOOD_X, MOOD_Y = 52, 28  # výřez malby (x v malbě) a kam padne její horní okraj na plátně; obzor malby (y 42) → y 70


def h2(x, y, s=0):
    n = (x * 374761393 + y * 668265263 + s * 2246822519) & 0xFFFFFFFF
    n = ((n ^ (n >> 13)) * 1274126177) & 0xFFFFFFFF
    return ((n ^ (n >> 16)) & 0xFFFF) / 65535


def noise(x, y, s=0):
    xi, yi = math.floor(x), math.floor(y)
    xf, yf = x - xi, y - yi
    a, b, c, d = h2(xi, yi, s), h2(xi + 1, yi, s), h2(xi, yi + 1, s), h2(xi + 1, yi + 1, s)
    u, v = xf * xf * (3 - 2 * xf), yf * yf * (3 - 2 * yf)
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v


def fbm(x, y, s=0, o=3):
    return sum(noise(x * 2 ** i, y * 2 ** i, s + i) / 2 ** i for i in range(o)) / (2 - 2 ** (1 - o))


BAYER = (0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5)


def dither(px, x, y, c0, c1, t):
    px[x, y] = (c1 if t * 16 > BAYER[(y % 4) * 4 + x % 4] + 0.5 else c0) + (255,)


# ---------------- obloha: herní malba ----------------
def backdrop(im, flip):
    mood = Image.open(os.path.join(PROPS, "mood.png")).convert("RGBA")
    mx = MOOD_X
    if flip:  # zrcadlově, výřez posunutý tak, aby výbuchy zůstaly po stranách kóty
        mood, mx = mood.transpose(Image.FLIP_LEFT_RIGHT), 92
    im.alpha_composite(mood.crop((mx, 0, mx + SW, 70)), (0, MOOD_Y))
    # nad malbou pokračuje tmavnoucí obloha (pod nadpisem)
    px = im.load()
    for y in range(MOOD_Y):
        for x in range(SW):
            dither(px, x, y, PAL[1], PAL[2], y / MOOD_Y * 0.9)


# ---------------- kóta ----------------
def ridge_top(x):
    """široký hřbet: plošina na vrcholu (x 40–66), vlevo nižší rameno, paty pod obzorem až u okrajů"""
    dx = abs(x - 53)
    core = 52 + (0 if dx < 10 else 18 * ((dx - 10) / 22) ** 1.15)
    shoulder = -4 * math.exp(-((x - 30) / 6) ** 2)
    return min(86, core + shoulder + 1.8 * (fbm(x / 7, 0, 21) - 0.5))


def hill(im):
    px = im.load()
    tops = [ridge_top(x) for x in range(SW)]
    for x in range(SW):
        top = int(round(tops[x]))
        slope = tops[min(SW - 1, x + 2)] - tops[max(0, x - 2)]
        lit = max(-1.0, min(1.0, -slope / 4))  # levý svah chytá žár z obzoru, pravý je ve stínu
        for y in range(max(0, top), SH):
            depth = y - top
            n = fbm(x / 6, y / 4, 31)
            streak = noise(x / 1.6, y / 12, 32)  # svislé erozní rýhy
            v = 0.34 + 0.38 * (n - 0.5) + 0.2 * (streak - 0.5) + 0.2 * lit * math.exp(-depth / 16) - depth * 0.002
            cols = (PAL[1], PAL[2], PAL[3], PAL[4], PAL[5])
            i = max(0, min(4, int(v * 5)))
            dither(px, x, y, cols[i], cols[min(4, i + 1)], (v * 5) % 1 * 0.8)
            g = noise(x / 3.5, y / 2.5, 40)  # zbytky trávy
            if g > 0.7 and depth > 3 and h2(x, y, 41) < 0.55:
                px[x, y] = (PAL[11] if g > 0.78 else PAL[10]) + (255,)
        rim = (PAL[23], PAL[20]) if lit > 0.15 else (PAL[20], PAL[19])  # lem hřebene proti žáru
        for k, c in enumerate(rim):
            if top + k < SH:
                px[x, top + k] = c + (255,)
    d = ImageDraw.Draw(im)
    # starý zákop klikatící se po svahu: tmavá rýha, nad ní světlejší navršená hlína
    trench = [(22, 80), (28, 75), (34, 74), (39, 68), (46, 67), (52, 63), (60, 64), (66, 62), (71, 66), (78, 68), (84, 74), (90, 79)]
    for (ax, ay), (bx, by) in zip(trench, trench[1:]):
        d.line((ax, ay, bx, by), fill=PAL[0])
        d.line((ax, ay - 1, bx, by - 1), fill=PAL[5])
    for x, y in trench[1:-1:2]:  # traverzy
        d.point((x, y - 2), fill=PAL[6])
    # krátery
    rnd = random.Random(7)
    for _ in range(9):
        x = rnd.randrange(8, SW - 8)
        y = rnd.randrange(int(ridge_top(x)) + 5, 86)
        r = rnd.choice((2, 2, 3, 4))
        d.ellipse((x - r, y - 1, x + r, y + 1), fill=PAL[1])
        d.line((x - r + 1, y - 2, x + r - 1, y - 2), fill=PAL[6])
        if r > 2 and rnd.random() < 0.6:
            d.point((x, y), fill=PAL[17])
            d.point((x - 1, y), fill=PAL[20])


def sandbag(x, y):
    """vzor pytlů ze hry (terrain.js sandbagPixel), index palety"""
    r = h2(x, y, 3)
    row = y // 5
    bx, by = (x + (4 if row % 2 else 0)) % 8, y % 5
    if by == 4:
        return 0
    if bx == 0:
        return 0 if by == 0 else 1
    if bx in (1, 7) and by == 0:
        return 2
    if by == 0:
        return 8 if r < 0.6 else 7
    if by == 1:
        return 6 if bx == 1 else 7
    if by == 3:
        return 5
    return 6 if r < 0.85 else 7


def bags(im, x0, y0, w, h, shade=0):
    px = im.load()
    for y in range(h):
        for x in range(w):
            i = sandbag(x, y)
            if shade and i > 2:
                i = max(1, i - shade)
            if 0 <= x0 + x < SW and 0 <= y0 + y < SH:
                px[x0 + x, y0 + y] = PAL[i] + (255,)


def flag(im, x, top, col, dark, emblem):
    d = ImageDraw.Draw(im)
    d.line((x, top, x, top + 22), fill=PAL[0])
    d.point((x, top - 1), fill=PAL[8])
    fw, fh = 15, 9
    wave = lambda i: round(1.2 * math.sin(i / 2.6 + 0.4))
    for i in range(fw):
        light = math.cos(i / 2.6 + 0.4) > -0.1
        for j in range(fh):
            if i == fw - 1 and j % 3 == 1:  # roztřepený konec
                continue
            c = col if light else dark
            if j == 0 and light:
                c = tuple(min(255, v + 35) for v in col)
            d.point((x + 1 + i, top + 1 + j + wave(i)), fill=c)
    ex, ey = x + 1 + fw // 2, top + 1 + fh // 2 + wave(fw // 2)
    if emblem == "cross":  # železný kříž Hegemonie
        for k in range(-2, 3):
            d.point((ex + k, ey), fill=PAL[0])
            d.point((ex, ey + k), fill=PAL[0])
        for a, b in ((-2, -1), (-2, 1), (2, -1), (2, 1)):
            d.point((ex + a, ey + b), fill=PAL[0])
            d.point((ex + b, ey + a), fill=PAL[0])
    else:  # kruh Concordu (spojené provincie)
        for a, b in ((-1, -2), (0, -2), (1, -2), (-2, -1), (2, -1), (-2, 0), (2, 0), (-2, 1), (2, 1), (-1, 2), (0, 2), (1, 2)):
            d.point((ex + a, ey + b), fill=PAL[0])
        d.point((ex, ey), fill=PAL[0])


def summit(im, side):
    """pevnůstka z pytlů na plošině, prapor vítěze, kůly s drátem na svazích"""
    tx = 53
    ty = int(min(ridge_top(x) for x in range(tx - 12, tx + 12)))
    bags(im, tx - 12, ty - 4, 25, 5, shade=1)
    d = ImageDraw.Draw(im)
    for dx in (-8, -3, 7):  # helmy obránců nad valem
        d.line((tx + dx - 1, ty - 5, tx + dx + 1, ty - 5), fill=PAL[1])
        d.point((tx + dx, ty - 6), fill=PAL[1])
    flag(im, tx + 1, ty - 26, side["col"], side["dark"], side["emblem"])
    for x0, x1 in ((24, 42), (66, 86)):  # španělští jezdci a drát
        for x in range(x0, x1, 7):
            y = int(ridge_top(x)) + 7
            d.line((x - 2, y - 3, x + 2, y), fill=PAL[1])
            d.line((x + 2, y - 3, x - 2, y), fill=PAL[1])
        for x in range(x0, x1):
            y = int(ridge_top(x)) + 6 + (x % 3 == 0)
            if h2(x, 0, 12) < 0.75:
                d.point((x, y), fill=PAL[0] if x % 2 else PAL[15])


def trees(im):
    """ohořelé pahýly na svazích"""
    d = ImageDraw.Draw(im)
    for x, hgt, br in ((28, 8, 1), (79, 10, -1), (88, 6, 1)):
        y = int(ridge_top(x)) + 3
        d.rectangle((x, y - hgt, x + 1, y), fill=PAL[0])  # kmen 2 px
        d.point((x + 1, y - hgt), fill=PAL[1])  # roztříštěný vršek
        d.point((x, y - hgt - 1), fill=PAL[0])
        d.point((x + br * 2, y - hgt + 3), fill=PAL[0])  # useknutá větev
        d.point((x + br * 3, y - hgt + 2), fill=PAL[0])
        d.point((x + (0 if br > 0 else 1), y - hgt + 1), fill=PAL[19])  # žár na hraně
        d.line((x - 1, y, x + 2, y), fill=PAL[1])  # kořeny


# ---------------- popředí: vojáci ze hry ----------------
def spr(name):
    return Image.open(os.path.join(SOLD, name)).convert("RGBA")


def fire_frame(prefix):
    """snímek střelby s nejvýraznějším zábleskem"""
    best, score = None, -1
    for f in sorted(os.listdir(SOLD)):
        if f.startswith(prefix):
            im = spr(f)
            n = sum(1 for p in im.getdata() if p[3] and p[0] > 200 and p[1] > 150 and p[2] < 120)
            if n > score:
                best, score = im, n
    return best


def foreground(im, side):
    px = im.load()
    for y in range(86, SH):  # bahno před valem
        for x in range(SW):
            dither(px, x, y, PAL[1], PAL[2], fbm(x / 5, y / 3, 51) * 0.8)
    d = ImageDraw.Draw(im)
    if side["id"] == "hegemony":
        # míří k nám: stojí za valem, val jim kryje nohy
        for img, x, y in (
            (spr("aim_hegemony_south.png"), -4, 76),
            (fire_frame("hegemony_machinegunner@fire_south"), 14, 66),
            (spr("hegemony_officer_south.png"), 38, 73),
            (fire_frame("hegemony@fire_south"), 58, 66),
            (spr("aim_hegemony_south.png"), 80, 77),
        ):
            im.alpha_composite(img, (x, y))
        d.line((0, 99, SW, 99), fill=PAL[0])
        bags(im, 0, 100, SW, 12)
    else:
        # Concord zepředu za valem (zepředu nemá pózu míření, stojí s puškou u nohy jako na stráži)
        for img, x, y in (
            (spr("concord@idle_south_0.png"), -3, 74),
            (spr("concord_machinegunner_south.png"), 17, 70),
            (spr("concord_officer_south.png"), 38, 72),
            (spr("concord_south.png"), 59, 70),
            (spr("concord_medic_south.png"), 79, 75),
        ):
            im.alpha_composite(img, (x, y))
        d.line((0, 99, SW, 99), fill=PAL[0])
        bags(im, 0, 100, SW, 12)


def scene(side):
    im = Image.new("RGBA", (SW, SH), PAL[1] + (255,))
    backdrop(im, side.get("flip", False))
    hill(im)
    trees(im)
    summit(im, side)
    foreground(im, side)
    return up(im, 2)
