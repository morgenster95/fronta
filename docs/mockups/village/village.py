# Ukázka „Bitva o vesnici“ (NÁVRH 24. 11.): malá mapa vesnice ve stejné pixelové mřížce jako hra, domy kreslené v kódu (paleta Trench 24),
# vojáci = skutečné sprity ze hry 1:1. Hegemonie útočí shora (vidíme ji zepředu, střílí dolů), Concord zdola (zezadu, střílí nahoru).
# python3 docs/mockups/village/village.py  →  docs/mockups/village/village.png (×3) a village_1x.png
import random, math
from PIL import Image, ImageDraw, ImageFont
R = '/home/user/fronta/'; OUT = R + 'docs/mockups/village/'
PAL = ['#' + l.strip() for l in open(R + 'art/palette/trench24.hex') if l.strip()]
C = lambda i: tuple(int(PAL[i][j:j + 2], 16) for j in (1, 3, 5)) + (255,)
W, H, K = 384, 300, 3
rnd = random.Random(7)
im = Image.new('RGBA', (W, H), C(3)); d = ImageDraw.Draw(im)
px = lambda x, y, c: 0 <= x < W and 0 <= y < H and im.putpixel((x, y), c if len(c) == 4 else c + (255,))
def rect(x, y, w, h, c): d.rectangle([x, y, x + w - 1, y + h - 1], fill=C(c))

# ---- zem: bláto s ditheringem, ulice z kočičích hlav, krátery ----
for y in range(H):
    for x in range(W):
        r = rnd.random()
        im.putpixel((x, y), C(4) if r < 0.18 else C(2) if r < 0.26 else C(3))
def street(x0, y0, x1, y1, w):
    for t in range(0, 400):
        x = x0 + (x1 - x0) * t / 400; y = y0 + (y1 - y0) * t / 400
        for dx in range(-w // 2, w // 2 + 1):
            for dy in range(-w // 2, w // 2 + 1):
                xx, yy = int(x + dx), int(y + dy)
                if 0 <= xx < W and 0 <= yy < H:
                    im.putpixel((xx, yy), C(6) if (xx + yy * 2) % 5 == 0 else C(5) if (xx * 3 + yy) % 7 else C(4))
street(192, 0, 192, H, 16)      # hlavní ulice sever–jih
street(0, 150, W, 150, 14)      # příčná ulice
for (cx, cy, r) in [(150, 120, 9), (238, 186, 11), (96, 214, 8), (300, 96, 7), (200, 236, 10), (60, 70, 6)]:
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r - 3, cx + r + 4):
            dd = ((x - cx) / (r + 3)) ** 2 + ((y - cy) / r) ** 2
            if dd < 1: px(x, y, C(1) if dd < 0.45 else C(2) if dd < 0.75 else C(5))

BG = im.copy()
# ---- domy: fasáda zepředu + střecha shora, tři stavy ----
WALL = {'brick': (19, 20, 18), 'plaster': (8, 9, 7), 'stone': (16, 17, 15)}
ROOF = {'tile': (20, 19, 18), 'slate': (5, 4, 3)}
def house(x, y, w, wall_h, roof_h, wall='plaster', roof='tile', state='ok', floors=1, door=True, seed=1):
    r = random.Random(seed)
    wl, wb, wd = WALL[wall]; rl, rb, rd = ROOF[roof]
    top = y + roof_h
    # zeď
    rect(x, top, w, wall_h, wb)
    for i in range(w * wall_h // 6):
        px(x + r.randrange(w), top + r.randrange(wall_h), C(wl if r.random() < .5 else wd))
    if wall == 'brick':
        for yy in range(top + 2, top + wall_h, 3):
            for xx in range(x + (yy // 3 % 2) * 2, x + w, 4): px(xx, yy, C(wd))
    d.line([x, top + wall_h - 1, x + w - 1, top + wall_h - 1], fill=C(1))
    d.line([x, top, x, top + wall_h - 1], fill=C(1)); d.line([x + w - 1, top, x + w - 1, top + wall_h - 1], fill=C(1))
    # okna a dveře
    for fl in range(floors):
        wy = top + 3 + fl * 11
        for wx in range(x + 4, x + w - 6, 9):
            broken = state != 'ok' and r.random() < .6
            rect(wx, wy, 5, 6, 0 if broken else 17); d.rectangle([wx - 1, wy - 1, wx + 5, wy + 6], outline=C(1))
            if not broken: px(wx + 1, wy + 1, C(16)); px(wx + 2, wy + 3, C(14))
            else: px(wx + r.randrange(5), wy + 5, C(9))
    if door:
        dx = x + w // 2 - 3
        rect(dx, top + wall_h - 9, 6, 8, 2 if state == 'ruin' else 18); d.rectangle([dx - 1, top + wall_h - 10, dx + 6, top + wall_h - 1], outline=C(1))
    # střecha
    if state != 'ruin':
        for yy in range(y, top):
            inset = (top - yy) // 2
            for xx in range(x - 2 + inset, x + w + 2 - inset):
                c = rd if (yy - y) % 3 == 2 else rl if (xx + (yy // 3)) % 4 == 0 else rb
                px(xx, yy, C(c))
        d.line([x - 2, top - 1, x + w + 1, top - 1], fill=C(1))
        cx = x + w - 10; rect(cx, y - 3, 4, roof_h // 2 + 3, 19); rect(cx, y - 4, 4, 1, 1)  # komín
        if state == 'hit':
            for _ in range(2 + w // 20):
                hx, hy = x + r.randrange(4, w - 8), y + r.randrange(1, roof_h - 3)
                for yy in range(hy, hy + 4):
                    for xx in range(hx, hx + 6):
                        if (xx - hx - 3) ** 2 + (yy - hy - 2) ** 2 < 9: px(xx, yy, C(0) if r.random() < .8 else C(17))
                for i in range(4): px(hx + r.randrange(-2, 8), hy + r.randrange(-1, 6), C(rd))
    else:
        # ruina: zubatý vršek zdi, vnitřek tmavý, sutiny
        for xx in range(x - 2, x + w + 2):
            jag = int(abs(math.sin(xx * 0.45 + seed)) * 9 + r.randrange(3)) if x <= xx < x + w else wall_h
            for yy in range(y, min(top + jag, top + wall_h)):
                if 0 <= xx < W and 0 <= yy < H: im.putpixel((xx, yy), BG.getpixel((xx, yy)))
            if x <= xx < x + w and jag < wall_h: px(xx, top + jag, C(wl))
        for i in range(w // 3): px(x + r.randrange(w), top + wall_h - 2 - r.randrange(4), C(1))
        for i in range(w * 2):
            rx, ry = x - 3 + r.randrange(w + 6), top + wall_h - 3 + r.randrange(7)
            px(rx, ry, C(r.choice([wb, wl, wd, 6, 5])))
def flag(x, y, f):
    col, dark, mark = [(16, 15, 19), (12, 10, 22)][f]
    rect(x, y - 15, 1, 16, 0); px(x, y - 16, C(7))
    for i in range(12):
        o = round(math.sin(i * 0.5) * 1.2 * i / 12)
        rect(x + 1 + i, y - 14 + o, 1, 8, dark if i % 5 == 4 else col)
        if f == 0: rect(x + 1 + i, y - 11 + o, 1, 2, mark)
    if f == 1: cx, cy = x + 7, y - 10; rect(cx - 1, cy - 1, 3, 3, mark); rect(cx, cy - 2, 1, 5, mark); rect(cx - 2, cy, 5, 1, mark)

# kostel s věží (uprostřed nahoře, Hegemonie), pivovar, mlýn, škola, hospoda, statek, domy
def church(x, y, state):
    house(x, y + 14, 50, 26, 14, 'stone', 'slate', state, floors=1, seed=11)
    tx = x + 52
    rect(tx, y - 18, 14, 58, 16); d.rectangle([tx, y - 18, tx + 13, y + 39], outline=C(1))
    for yy in range(y - 18, y + 40, 4): d.line([tx + 1, yy, tx + 12, yy], fill=C(15))
    if state == 'hit':
        for yy in range(y - 30, y - 18):
            for xx in range(tx + max(0, (y - 18 - yy) // 3 - 2), tx + 14 - (y - 18 - yy) // 2): px(xx, yy, C(15 if xx % 3 else 1))
        rect(tx + 5, y - 10, 4, 7, 0); px(tx + 9, y - 22, C(0)); px(tx + 10, y - 23, C(0))
    else:
        for yy in range(y - 34, y - 18):
            ww = (yy - (y - 34)) // 2 + 1
            for xx in range(tx + 7 - ww, tx + 7 + ww): px(xx, yy, C(5 if xx < tx + 7 else 4))
        rect(tx + 5, y - 10, 4, 7, 1)
houses = [  # (x, y, w, wall_h, roof_h, wall, roof, state, floors, owner, name)
    (142, 22, 38, 22, 12, 'plaster', 'tile', 'hit', 1, 0, 'SCHOOL'),
    (236, 28, 62, 30, 14, 'brick', 'tile', 'ok', 2, 0, 'BREWERY'),
    (312, 52, 46, 22, 12, 'plaster', 'slate', 'ok', 1, 0, 'FARM'),
    (20, 170, 44, 24, 12, 'stone', 'tile', 'ruin', 1, None, 'MILL'),
    (214, 104, 40, 24, 12, 'plaster', 'tile', 'hit', 1, None, 'INN'),
    (124, 168, 44, 22, 12, 'brick', 'slate', 'ruin', 1, None, 'BAKERY'),
    (214, 172, 42, 22, 12, 'plaster', 'tile', 'hit', 1, 1, 'HOUSE'),
    (300, 160, 48, 26, 13, 'brick', 'tile', 'ok', 2, 1, 'MAYOR'),
    (62, 226, 46, 22, 12, 'plaster', 'tile', 'ok', 1, 1, 'POST'),
    (250, 234, 50, 22, 12, 'stone', 'slate', 'ok', 1, 1, 'BARN'),
]
church(70, 60, 'hit')
for (x, y, w, wh, rh, wa, ro, st, fl, ow, nm) in houses: house(x, y, w, wh, rh, wa, ro, st, fl, seed=x * 7 + y)
# hřbitov u kostelu
for (gx, gy) in [(24, 126), (36, 130), (48, 124), (30, 140), (44, 142), (58, 134)]:
    rect(gx, gy - 6, 1, 7, 7); rect(gx - 2, gy - 4, 5, 1, 7); px(gx, gy + 1, C(1)); px(gx + 1, gy + 1, C(2))
# vlajky vlastníků
flag(128, 26, 0); flag(170, 20, 0); flag(286, 24, 0); flag(348, 48, 0); flag(244, 168, 1); flag(338, 156, 1); flag(96, 222, 1); flag(290, 230, 1)
# barikády z pytlů a vozu na příčné ulici
def sandbags(x, y, n):
    for i in range(n):
        rect(x + i * 5, y, 5, 3, 8); px(x + i * 5, y, C(9)); d.line([x + i * 5, y + 3, x + i * 5 + 4, y + 3], fill=C(6))
sandbags(170, 140, 9); sandbags(176, 160, 7)
cart = Image.open(R + 'web/public/assets/props/cart_horse.png').convert('RGBA')
print('cart', cart.size)

# ---- vojáci (sprity ze hry 1:1) ----
S = R + 'web/public/assets/soldiers/'
def spr(name, x, y, flip=False):
    s = Image.open(S + name + '.png').convert('RGBA')
    if flip: s = s.transpose(Image.FLIP_LEFT_RIGHT)
    bb = s.getbbox(); s = s.crop(bb)
    im.alpha_composite(s, (x - s.width // 2, y - s.height))
    return s
def flash(x, y, down):
    pts = [(0, 0), (0, 1), (1, 0), (-1, 0), (0, 2 if down else -2)]
    for (a, b) in pts: px(x + a, y + (b if down else b), C(9))
    px(x, y + (1 if down else -1), C(23)); px(x, y + (3 if down else -3), C(22))
def smoke(x, y, r):
    for i in range(r * 6):
        a = i * 2.4; rr = (i / (r * 6)) * r
        px(int(x + math.cos(a) * rr), int(y + math.sin(a) * rr * 0.7), C(7 if i % 3 else 8))
# Hegemonie (shora, střílí dolů): u kostela, ve škole, pivovaru, za pytli
for (n, x, y) in [('hegemony@fire_south_3', 128, 96), ('hegemony@fire_south_5', 256, 104), ('hegemony@fire_south_1', 282, 104), ('hegemony@kneel_west_2', 172, 76),
                  ('hegemony@grenade_south_4', 204, 132), ('hegemony@fire_south-east_2', 334, 104), ('hegemony@run_south_3', 186, 110), ('hegemony@prone_south_0', 226, 146),
                  ('hegemony@duck_south_2', 96, 128), ('hegemony@lying-wounded_west_0', 150, 142)]:
    spr(n, x, y)
# Concord (zdola, střílí nahoru): za barikádou, v domech dole
for (n, x, y) in [('concord@fire_north_3', 182, 178), ('concord@fire_north_6', 204, 180), ('concord@kneel_north_2', 236, 222), ('concord@fire_north-east_4', 322, 214),
                  ('concord@crawl_north_3', 150, 222), ('concord@grenade_north_3', 120, 262), ('concord@run_north_2', 196, 256), ('concord@fire_north_1', 84, 278),
                  ('concord@lying-wounded_east_0', 272, 216), ('concord@duck_north_1', 300, 290), ('concord@kneel_north_2', 40, 210)]:
    spr(n, x, y)
for (x, y, dn) in [(126, 100, True), (254, 108, True), (280, 108, True), (332, 108, True), (182, 154, False), (204, 156, False), (322, 192, False), (84, 254, False)]: flash(x, y, dn)
for (x, y, r) in [(206, 120, 9), (146, 196, 7), (100, 62, 7), (40, 184, 10), (232, 128, 6)]: smoke(x, y, r)
# výbuch granátu u hospody
for i in range(40):
    a = i * 0.9; rr = (i % 7) + 1
    px(int(232 + math.cos(a) * rr), int(128 + math.sin(a) * rr * 0.6), C(23 if rr < 3 else 21 if rr < 5 else 7))

im.save(OUT + 'village_1x.png')
# ---- ×3 + jednoduché UI (popisky domů, stav bitvy) ----
big = im.resize((W * K, H * K), Image.NEAREST).convert('RGB'); bd = ImageDraw.Draw(big)
F = ImageFont.truetype(R + 'marketing/fonts/Silkscreen-Regular.ttf', 16); F2 = ImageFont.truetype(R + 'marketing/fonts/Silkscreen-Regular.ttf', 22)
HEG, CON, NEU = (138, 146, 149), (201, 194, 106), (227, 217, 195)
labels = [(70 + 30, 60 + 56, 'CHURCH', 0), (142 + 19, 22 + 36, 'SCHOOL', 0), (236 + 31, 28 + 46, 'BREWERY', 0), (312 + 23, 52 + 36, 'FARM', 0),
          (20 + 22, 170 + 38, 'MILL', None), (214 + 20, 104 + 38, 'INN', None), (124 + 22, 168 + 36, 'BAKERY', None), (214 + 21, 172 + 36, 'HOUSE', 1),
          (300 + 24, 160 + 41, 'MAYOR', 1), (62 + 23, 226 + 36, 'POST OFFICE', 1), (250 + 25, 234 + 36, 'BARN', 1)]
for (x, y, t, o) in labels:
    col = HEG if o == 0 else CON if o == 1 else NEU
    tw = bd.textlength(t, font=F); X, Y = x * K - tw / 2, y * K + 2
    bd.rectangle([X - 5, Y - 2, X + tw + 5, Y + 18], fill=(14, 13, 12)); bd.text((X, Y), t, font=F, fill=col)
bd.rectangle([0, 0, W * K, 44], fill=(14, 13, 12)); bd.text((14, 10), 'THE BATTLE FOR SAINT-ASH  ·  NIGHT 3 OF 5', font=F2, fill=(227, 217, 195))
bd.rectangle([0, H * K - 40, W * K, H * K], fill=(14, 13, 12))
bd.text((14, H * K - 31), 'HEGEMONY 5 HOUSES', font=F, fill=HEG); bd.text((400, H * K - 31), 'CONTESTED 3', font=F, fill=NEU); bd.text((640, H * K - 31), 'CONCORD 4 HOUSES', font=F, fill=CON)
big.save(OUT + 'village.png'); print('ok')
