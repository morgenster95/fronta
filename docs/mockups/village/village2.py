# Ukázka 2 „Bitva o vesnici“: budovy z PixelLabu (arch art/cine/village_sheet_a.png → art/village/*.png, 1 arch = 12 budov za 9 generací),
# zem, ulice a vojáci jako ve hře (sprity 1:1). python3 docs/mockups/village/village2.py → village2.png (×3)
import random, math
from PIL import Image, ImageDraw, ImageFont
R = '/home/user/fronta/'; OUT = R + 'docs/mockups/village/'
PAL = ['#' + l.strip() for l in open(R + 'art/palette/trench24.hex') if l.strip()]
C = lambda i: tuple(int(PAL[i][j:j + 2], 16) for j in (1, 3, 5)) + (255,)
W, H, K = 400, 320, 3
rnd = random.Random(7)
im = Image.new('RGBA', (W, H), C(3)); d = ImageDraw.Draw(im)
px = lambda x, y, c: 0 <= x < W and 0 <= y < H and im.putpixel((x, y), c)
def rect(x, y, w, h, c): d.rectangle([x, y, x + w - 1, y + h - 1], fill=C(c))
for y in range(H):
    for x in range(W):
        r = rnd.random(); im.putpixel((x, y), C(4) if r < 0.18 else C(2) if r < 0.26 else C(3))
def street(x0, y0, x1, y1, w):
    for t in range(500):
        x = x0 + (x1 - x0) * t / 500; y = y0 + (y1 - y0) * t / 500
        for dx in range(-w // 2, w // 2 + 1):
            for dy in range(-w // 2, w // 2 + 1):
                xx, yy = int(x + dx), int(y + dy)
                if 0 <= xx < W and 0 <= yy < H: im.putpixel((xx, yy), C(6) if (xx + yy * 2) % 5 == 0 else C(5) if (xx * 3 + yy) % 7 else C(4))
street(200, 0, 200, H, 16); street(0, 164, W, 164, 14)
for (cx, cy, r) in [(140, 126, 9), (262, 196, 11), (96, 230, 8), (330, 112, 7), (204, 262, 9), (40, 90, 6)]:
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r - 3, cx + r + 4):
            dd = ((x - cx) / (r + 3)) ** 2 + ((y - cy) / r) ** 2
            if dd < 1: px(x, y, C(1) if dd < 0.45 else C(2) if dd < 0.75 else C(5))
B = lambda n: Image.open(R + f'art/village/{n}.png').convert('RGBA')
# (budova, x levý okraj, y spodní okraj, majitel 0=H 1=C None=sporné)
PLACE = [('school', 52, 66, 0), ('church', 120, 100, 0), ('brewery', 232, 72, 0), ('farmhouse', 300, 62, 0), ('inn', 210, 150, None),
         ('mill', 18, 152, None), ('bakery', 128, 214, None), ('townhall', 300, 220, 1), ('cottage', 212, 222, 1), ('postoffice', 40, 270, 1),
         ('barn', 300, 312, 1), ('cottage_well', 130, 300, 1)]
spr = {}
for (n, x, yb, o) in PLACE:
    b = B(n); im.alpha_composite(b, (x, yb - b.height)); spr[n] = (x, yb, b.width, b.height, o)
def flag(x, y, f):
    col, dark, mark = [(16, 15, 19), (12, 10, 22)][f]
    rect(x, y - 15, 1, 16, 0); px(x, y - 16, C(7))
    for i in range(12):
        o = round(math.sin(i * 0.5) * 1.2 * i / 12)
        rect(x + 1 + i, y - 14 + o, 1, 8, dark if i % 5 == 4 else col)
        if f == 0: rect(x + 1 + i, y - 11 + o, 1, 2, mark)
    if f == 1: cx, cy = x + 7, y - 10; rect(cx - 1, cy - 1, 3, 3, mark); rect(cx, cy - 2, 1, 5, mark); rect(cx - 2, cy, 5, 1, mark)
for (n, (x, yb, w, h, o)) in spr.items():
    if o is not None: flag(x + w - 8, yb - h + 6, o)
def sandbags(x, y, n):
    for i in range(n): rect(x + i * 5, y, 5, 3, 8); px(x + i * 5, y, C(9)); d.line([x + i * 5, y + 3, x + i * 5 + 4, y + 3], fill=C(6))
sandbags(176, 154, 10)
S = R + 'web/public/assets/soldiers/'
def sp(name, x, y):
    s = Image.open(S + name + '.png').convert('RGBA'); s = s.crop(s.getbbox()); im.alpha_composite(s, (x - s.width // 2, y - s.height))
def flash(x, y, down):
    for (a, b) in [(0, 0), (0, 1), (1, 0), (-1, 0), (0, 2)]: px(x + a, y + (b if down else -b), C(9))
    px(x, y + (3 if down else -3), C(22))
def smoke(x, y, r):
    for i in range(r * 6):
        a = i * 2.4; rr = (i / (r * 6)) * r; px(int(x + math.cos(a) * rr), int(y + math.sin(a) * rr * 0.7), C(7 if i % 3 else 8))
for (n, x, y) in [('hegemony@fire_south_3', 76, 80), ('hegemony@fire_south_5', 142, 116), ('hegemony@fire_south_1', 250, 88), ('hegemony@fire_south_3', 274, 88),
                  ('hegemony@grenade_south_4', 188, 140), ('hegemony@fire_south-east_2', 330, 80), ('hegemony@kneel_west_2', 108, 118), ('hegemony@prone_south_0', 232, 160),
                  ('hegemony@lying-wounded_west_0', 160, 150), ('hegemony@run_south_3', 196, 112)]: sp(n, x, y)
for (n, x, y) in [('concord@fire_north_3', 186, 186), ('concord@fire_north_6', 210, 190), ('concord@kneel_north_2', 250, 238), ('concord@fire_north-east_4', 322, 236),
                  ('concord@crawl_north_3', 150, 232), ('concord@grenade_north_3', 110, 248), ('concord@run_north_2', 196, 290), ('concord@fire_north_1', 66, 288),
                  ('concord@lying-wounded_east_0', 286, 248), ('concord@duck_north_1', 150, 312)]: sp(n, x, y)
for (x, y, dn) in [(74, 84, True), (140, 120, True), (248, 92, True), (272, 92, True), (328, 84, True), (186, 162, False), (210, 166, False), (322, 214, False), (66, 266, False)]: flash(x, y, dn)
for (x, y, r) in [(206, 130, 9), (150, 206, 7), (44, 128, 10), (232, 140, 6)]: smoke(x, y, r)
im.save(OUT + 'village2_1x.png')
big = im.resize((W * K, H * K), Image.NEAREST).convert('RGB'); bd = ImageDraw.Draw(big)
F = ImageFont.truetype(R + 'marketing/fonts/Silkscreen-Regular.ttf', 16); F2 = ImageFont.truetype(R + 'marketing/fonts/Silkscreen-Regular.ttf', 22)
HEG, CON, NEU = (138, 146, 149), (201, 194, 106), (227, 217, 195)
NM = {'school': 'SCHOOL', 'church': 'CHURCH', 'brewery': 'BREWERY', 'farmhouse': 'FARM', 'inn': 'INN', 'mill': 'MILL', 'bakery': 'BAKERY', 'townhall': 'TOWN HALL',
      'cottage': 'COTTAGE', 'postoffice': 'POST OFFICE', 'barn': 'BARN', 'cottage_well': 'WELL HOUSE'}
for (n, (x, yb, w, h, o)) in spr.items():
    t = NM[n]; col = HEG if o == 0 else CON if o == 1 else NEU
    tw = bd.textlength(t, font=F); X, Y = (x + w / 2) * K - tw / 2, yb * K + 2
    bd.rectangle([X - 5, Y - 2, X + tw + 5, Y + 18], fill=(14, 13, 12)); bd.text((X, Y), t, font=F, fill=col)
bd.rectangle([0, 0, W * K, 44], fill=(14, 13, 12)); bd.text((14, 10), 'THE BATTLE FOR SAINT-ASH  ·  NIGHT 3 OF 5', font=F2, fill=(227, 217, 195))
bd.rectangle([0, H * K - 40, W * K, H * K], fill=(14, 13, 12))
bd.text((14, H * K - 31), 'HEGEMONY 4 HOUSES', font=F, fill=HEG); bd.text((440, H * K - 31), 'CONTESTED 3', font=F, fill=NEU); bd.text((800, H * K - 31), 'CONCORD 5 HOUSES', font=F, fill=CON)
big.save(OUT + 'village2.png'); print('ok')
