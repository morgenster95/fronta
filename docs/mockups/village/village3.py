# Ukázka 3 „Bitva o vesnici“ (24. 11.): VĚTŠÍ budovy (arch art/cine/village_big_a.png → art/village/big/*.png, 6 budov za 9 generací)
# a předměty do ulic (arch art/cine/village_props_a.png → art/village/props/*.png, 16 kusů za 6 generací). Vojáci = sprity ze hry 1:1.
# python3 docs/mockups/village/village3.py → village3.png (×3) a village3_1x.png
import random, math
from PIL import Image, ImageDraw, ImageFont
R = '/home/user/fronta/'; OUT = R + 'docs/mockups/village/'
PAL = ['#' + l.strip() for l in open(R + 'art/palette/trench24.hex') if l.strip()]
C = lambda i: tuple(int(PAL[i][j:j + 2], 16) for j in (1, 3, 5)) + (255,)
W, H, K = 360, 340, 3
rnd = random.Random(11)
im = Image.new('RGBA', (W, H), C(3)); d = ImageDraw.Draw(im)
px = lambda x, y, c: 0 <= x < W and 0 <= y < H and im.putpixel((x, y), c)
def rect(x, y, w, h, c): d.rectangle([x, y, x + w - 1, y + h - 1], fill=C(c))
# zem (bláto, tráva u zdí)
for y in range(H):
    for x in range(W):
        r = rnd.random(); im.putpixel((x, y), C(4) if r < 0.18 else C(2) if r < 0.26 else C(3))
# dlážděná ulice: kočičí hlavy v řadách se spárami
def cobbles(y0, y1):
    for y in range(y0, y1):
        for x in range(W):
            row = (y - y0) // 4; ox = (x + (row % 2) * 3) % 6
            c = 1 if (y - y0) % 4 == 3 or ox == 5 else (6 if (x * 7 + row * 13) % 11 == 0 else 5 if (x // 6 + row) % 3 else 4)
            if rnd.random() < 0.05: c = 3
            px(x, y, C(c))
    rect(0, y0 - 1, W, 1, 7); rect(0, y1, W, 1, 1)  # obrubník
cobbles(124, 160); cobbles(316, 340)
B = lambda n: Image.open(R + f'art/village/big/{n}.png').convert('RGBA')
Pp = lambda n: Image.open(R + f'art/village/props/{n}.png').convert('RGBA')
def put(img, cx, foot):
    im.alpha_composite(img, (int(cx - img.width / 2), int(foot - img.height)))
# řada domů u horní ulice a druhá řada dole
row1 = [('townhouse', 44), ('church', 128), ('townhall', 212), ('cafe', 300)]
row2 = [('bakery', 40), ('inn', 118), ('townhouse', 200)]
for n, cx in row1: put(B(n), cx, 124)
for n, cx in row2: put(B(n), cx, 316)
# předměty: lampy podél ulice, sutiny a barikády, rozbité věci
props = [('lamp', 86, 128), ('lamp', 170, 128), ('lamp_broken', 258, 132), ('bin', 16, 130), ('bench', 236, 126), ('pump', 346, 136),
         ('barricade_planks', 112, 170), ('barricade_bags', 200, 170), ('barricade_bags', 237, 170), ('rubble_brick', 40, 178), ('rubble_stone', 300, 180), ('door_fallen', 160, 192),
         ('crates', 268, 210), ('barrel', 330, 212), ('bicycle', 68, 212), ('handcart', 330, 300), ('wheel', 350, 318), ('signpost', 262, 318),
         ('rubble_brick', 290, 330), ('lamp', 80, 320), ('lamp_broken', 160, 322)]
for n, x, y in props: put(Pp(n), x, y)
S = R + 'web/public/assets/soldiers/'
def sp(name, x, y):
    s = Image.open(S + name + '.png').convert('RGBA'); s = s.crop(s.getbbox()); im.alpha_composite(s, (x - s.width // 2, y - s.height))
for (n, x, y) in [('hegemony@fire_south_3', 132, 150), ('hegemony@kneel_west_2', 206, 154), ('hegemony@fire_south_5', 70, 150), ('hegemony@run_south_3', 290, 156),
                  ('hegemony_medic_south', 24, 156), ('hegemony@fire_south-east_2', 228, 128)]: sp(n, x, y)
for (n, x, y) in [('concord@fire_north_3', 120, 204), ('concord@crawl_north_3', 160, 214), ('concord@kneel_north_2', 286, 206), ('concord@fire_north_6', 218, 200),
                  ('concord@grenade_north_3', 246, 212), ('concord@lying-wounded_east_0', 40, 210), ('concord_medic_north', 70, 196)]: sp(n, x, y)
im.save(OUT + 'village3_1x.png')
big = im.resize((W * K, H * K), Image.NEAREST).convert('RGB')
big.save(OUT + 'village3.png'); print('ok')
