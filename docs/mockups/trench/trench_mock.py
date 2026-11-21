"""Návrhy vzhledu zákopů (jen ukázky, nic se nenasazuje). Mřížka 180×320 ×3 = 540×960, paleta Trench-24, sprity vojáků ze hry.
A zigzag  – skutečný zákop z 1. sv. války: zalomené úseky (bays) a příčné valy (traverses), klikatý spojovací zákop, nízký val z pytlů
B earth   – zablácený zákop s nepravidelnými okraji, kaluže, rozbité rošty, pytle jen místy
C clean   – čitelný styl: tmavé vnitřky, světlá hrana, tmavé nízké pytle, vojáci vyniknou
"""
import math
import os
import sys

from PIL import Image

ROOT = '/home/user/fronta'
SOLD = os.path.join(ROOT, 'web/public/assets/soldiers')
PAL = [tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) for h in [
    '0e0d0c', '1c1a17', '2b2722', '3d3730', '524a3f', '6b6152', '857a68', 'a39782', 'c4b8a0', 'e3d9c3',
    '3a3b2c', '545639', '6f7148', '8c8a5c', '4a4f52', '666d70', '8a9295', '2a3138', '5c2a22', '7e3b2a',
    'a85a36', '9fa640', 'c9c26a', 'd98f3f']]
W, H, K = 180, 320, 3


def h2(x, y, s):
    n = (x * 374761393 + y * 668265263 + s * 2147483647) & 0xffffffff
    n = ((n ^ (n >> 13)) * 1274126177) & 0xffffffff
    return ((n ^ (n >> 16)) & 0xffff) / 65535


def vn(x, y, s):
    xi, yi = math.floor(x), math.floor(y)
    xf, yf = x - xi, y - yi
    a, b, c, d = h2(xi, yi, s), h2(xi + 1, yi, s), h2(xi, yi + 1, s), h2(xi + 1, yi + 1, s)
    u, v = xf * xf * (3 - 2 * xf), yf * yf * (3 - 2 * yf)
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v


def ground(x, y, nml):
    v = vn(x / 12, y / 12, 1) * 0.5 + vn(x / 4, y / 4, 2) * 0.2 + vn(x / 40, y / 40, 11) * 0.22 + h2(x, y, 7) * 0.08
    if nml:
        return 1 if v < 0.22 else 2 if v < 0.58 else 3 if v < 0.93 else 4
    return 2 if v < 0.3 else 3 if v < 0.62 else 4 if v < 0.92 else 5


# ---------- tvary (maska vnitřku zákopu) ----------
def mask_zigzag():
    m = set()
    def rect(x0, y0, x1, y1):
        for y in range(y0, y1):
            for x in range(x0, x1):
                m.add((x, y))
    # přední zákop: střídavě úsek vpředu (bay) a vzadu za příčným valem (traverse)
    x = -10
    i = 0
    while x < W + 10:
        y = 176 if i % 2 == 0 else 160
        rect(x, y, x + 34, y + 28)
        if i % 2 == 1:
            rect(x - 3, 160, x + 3, 204)   # spojky kolem příčných valů
            rect(x + 31, 160, x + 37, 204)
        x += 34
        i += 1
    # klikatý spojovací zákop dozadu (nahoru)
    cx, cy = 85, 165
    for k in range(5):
        nx = cx + (18 if k % 2 == 0 else -18)
        ny = cy - 22
        rect(min(cx, nx) - 4, ny, max(cx, nx) + 5, ny + 10)  # vodorovný kus
        rect(nx - 4, ny, nx + 5, cy + 4)                       # svislý kus
        cx, cy = nx, ny
    # podpůrný zákop vzadu
    rect(-10, 40, W + 10, 62)
    return m


def mask_earth():
    m = set()
    for x in range(-10, W + 10):
        c = 182 + 7 * math.sin(x / 23) + 3 * math.sin(x / 7.3)
        hw = 13 + 3 * vn(x / 9, 3, 61)
        for y in range(int(c - hw), int(c + hw)):
            m.add((x, y))
        c2 = 52 + 4 * math.sin(x / 31)
        for y in range(int(c2 - 10), int(c2 + 10)):
            m.add((x, y))
    for y in range(44, 186):
        cx = 96 + 9 * math.sin(y / 17) + 3 * math.sin(y / 5)
        hw = 5 + vn(3, y / 8, 62) * 1.5
        for x in range(int(cx - hw), int(cx + hw)):
            m.add((x, y))
    return m


# ---------- kreslení ----------
def sprite(name):
    return Image.open(os.path.join(SOLD, name)).convert('RGBA')


def render(kind):
    m = mask_zigzag() if kind in ('A', 'C') else mask_earth()
    im = Image.new('RGB', (W, H))
    px = im.load()
    inm = lambda x, y: (x, y) in m
    WALL = 12 if kind != 'C' else 15
    # zem
    for y in range(H):
        for x in range(W):
            px[x, y] = PAL[ground(x, y, y > 205)]
    # země nikoho: krátery a drát
    for (cx, cy, rr) in ((40, 262, 11), (120, 284, 14), (150, 236, 7), (70, 300, 8)):
        for y in range(cy - rr, cy + rr):
            for x in range(cx - rr - 4, cx + rr + 4):
                if not (0 <= x < W and 0 <= y < H):
                    continue
                dd = math.hypot((x - cx) / 1.25, y - cy) / rr
                if dd > 1:
                    continue
                px[x, y] = PAL[(5 if y < cy else 2) if dd > 0.82 else (17 if dd < 0.45 and rr > 9 else 1)]
    for x in range(0, W):
        y1 = int(222 + 2 * math.sin(x * 0.55))
        y2 = int(225 + 2 * math.cos(x * 0.8))
        px[x, y1] = PAL[0]
        if x % 2:
            px[x, y2] = PAL[1]
        if x % 17 == 3:
            for k in range(8):
                if 0 <= x + k < W: px[x + k, 216 + k] = PAL[5]
                if 0 <= x + 7 - k < W: px[x + 7 - k, 216 + k] = PAL[4]
    # vnitřek zákopu
    for (x, y) in m:
        if not (0 <= x < W and 0 <= y < H):
            continue
        d = 0
        while inm(x, y - d - 1) and d < 30:
            d += 1
        r = h2(x, y, 9)
        if d < WALL:  # vzdálená stěna
            if kind == 'A':
                post = x % 11
                c = 2 if post == 0 else (6 if d < 2 else 4) if post == 1 else (1 if (d % 3) == 2 else 3 if r < 0.6 else 4)
                if d == 0:
                    c = 6
            elif kind == 'B':
                v = vn(x / 4, y / 3, 52) * 0.6 + r * 0.25 + (1 - d / WALL) * 0.35
                c = 5 if d == 0 else 4 if v > 0.85 else 3 if v > 0.6 else 2 if v > 0.35 else 1
            else:
                c = 8 if d == 0 else 5 if d == 1 else (3 if r < 0.5 else 2) if d < 5 else (2 if r < 0.3 else 1) if d < 10 else (1 if r < 0.3 else 0)
        elif d == WALL:
            c = 0
        else:  # dno
            vert = inm(x, y - 1) and inm(x, y + 1) and not (inm(x - 6, y) and inm(x + 6, y))
            if kind == 'B':
                v = vn(x / 5, y / 4, 55)
                c = (15 if r < 0.15 else 17) if v < 0.2 else 1 if v < 0.5 else 2
                if not vert and (y + 2) % 7 < 3 and h2(x >> 3, y >> 3, 56) > 0.35:
                    c = 1 if x % 4 == 3 else 3
            else:
                c = 1
                if (x % 3 == 2):
                    c = 0 if kind == 'C' else 1
                else:
                    c = 4 if kind == 'A' else 3
                if h2(x >> 2, y >> 2, 21) < 0.1:
                    c = 17
        px[x, y] = PAL[c]
    # val z pytlů na straně k nepříteli (dole)
    bags = []
    for (x, y) in m:
        if 0 <= x < W and not inm(x, y + 1) and y > 150:
            if kind == 'B' and vn(x / 14, 5, 63) < 0.45:
                continue
            bags.append((x, y + 1))
    edge = {}
    for x, y in bags:
        edge[x] = max(edge.get(x, 0), y)

    def bagpix(x, y, dark):
        row = y // 5
        off = 4 if row % 2 else 0
        bx, by = (x + off) % 8, y % 5
        if by == 4 or bx == 0:
            return 0 if dark else 1
        if by == 0:
            return 4 if dark else 8
        if by == 3:
            return 2 if dark else 5
        return 3 if dark else 6
    rows = 2 if kind == 'C' else 3
    # vojáci
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    spots = []
    if kind in ('A', 'C'):
        for i, x0 in enumerate(range(-10, W + 10, 34)):
            if i % 2 == 0:
                for k, sx in enumerate((x0 + 17,)):
                    spots.append((sx, 200 + (k % 2), ['hegemony_south.png', 'hegemony_machinegunner_south.png', 'hegemony_south.png', 'hegemony_medic_south.png'][(i + k) % 4]))
    else:
        for i, sx in enumerate(range(14, W, 34)):
            c = 182 + 7 * math.sin(sx / 23) + 3 * math.sin(sx / 7.3)
            spots.append((sx, int(c + 11), ['hegemony_south.png', 'hegemony_machinegunner_south.png', 'hegemony_medic_south.png'][i % 3]))
    for sx, fy, name in spots:
        sp = sprite(name)
        lay.alpha_composite(sp, (sx - 16, fy - 31))
    im = im.convert('RGBA')
    im.alpha_composite(lay)
    px = im.load()
    # bližší okraj + pytle přes nohy vojáků
    for x, ey in edge.items():
        if not (0 <= x < W):
            continue
        for k in range(3):  # bližší hrana zákopu zakryje spodek
            y = ey - 1 - k
            if inm(x, y):
                px[x, y] = PAL[6 if k == 2 else 4 if k == 1 else 3] + (255,)
        top = ey - rows * 5 + 3
        for y in range(top, ey + 4):
            if 0 <= y < H:
                px[x, y] = PAL[bagpix(x, y - top, kind == 'C')] + (255,)
    return im.convert('RGB')


if __name__ == '__main__':
    out = sys.argv[1]
    for k, name in (('A', 'zigzag'), ('B', 'earth'), ('C', 'clean')):
        render(k).resize((W * K, H * K), Image.NEAREST).save(f'{out}/trench_{name}.png')
        print(name)
