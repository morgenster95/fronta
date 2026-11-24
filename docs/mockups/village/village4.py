# Ukázka 4 „Bitva o vesnici“ (24. 11. večer): KŘIŽOVATKA. Barevné domy čelem (art/village/big/house_*, shop_*) u vodorovné ulice,
# domy bokem (art/village/side/side_*: hřeben střechy nahoru-dolů, štít dole) u svislé ulice, dekorace art/village/props/*, vojáci ze hry 1:1.
# python3 docs/mockups/village/village4.py → village4.png (×3) a village4_1x.png
import random
from PIL import Image, ImageDraw
R = '/home/user/fronta/'; OUT = R + 'docs/mockups/village/'
PAL = ['#' + l.strip() for l in open(R + 'art/palette/trench24.hex') if l.strip()]
C = lambda i: tuple(int(PAL[i][j:j + 2], 16) for j in (1, 3, 5)) + (255,)
W, H, K = 360, 360, 3
rnd = random.Random(5)
im = Image.new('RGBA', (W, H), C(3)); d = ImageDraw.Draw(im)
def px(x, y, c):
    if 0 <= x < W and 0 <= y < H: im.putpixel((x, y), c)
for y in range(H):
    for x in range(W):
        r = rnd.random(); im.putpixel((x, y), C(13) if r < 0.10 else C(4) if r < 0.22 else C(2) if r < 0.3 else C(3))
# dlažba: vodorovná ulice y 150–188, svislá x 160–198; chodníky (světlejší pás) podél
HS, HE, VS, VE = 150, 188, 160, 198
def cob(x, y, vert):
    a, b = (y, x) if vert else (x, y)
    row = (b // 4); ox = (a + (row % 2) * 3) % 6
    c = 1 if b % 4 == 3 or ox == 5 else (6 if (a * 7 + row * 13) % 11 == 0 else 5 if (a // 6 + row) % 3 else 4)
    return 3 if rnd.random() < 0.04 else c
for y in range(H):
    for x in range(W):
        inH, inV = HS <= y < HE, VS <= x < VE
        if inH or inV: px(x, y, C(cob(x, y, inV and not inH)))
        elif HS - 5 <= y < HS or HE <= y < HE + 4 or VS - 4 <= x < VS or VE <= x < VE + 4: px(x, y, C(6 if (x + y) % 7 else 5))  # chodník
d.rectangle([0, HS - 6, W, HS - 6], fill=C(1)); d.rectangle([VS - 5, 0, VS - 5, H], fill=C(1)); d.rectangle([VE + 4, 0, VE + 4, H], fill=C(1))
L = lambda p: Image.open(R + 'art/village/' + p + '.png').convert('RGBA')
Q = []  # vše se kreslí podle čáry nohou (co je níž, je vpředu)
def put(img, cx, foot):
    Q.append((foot, lambda: im.alpha_composite(img, (int(cx - img.width / 2), int(foot - img.height)))))
# za domy (zahrady, ploty) dřív než domy
for n, x, y in [('fence', 20, 300), ('fence', 54, 300), ('tree_planter', 110, 40), ('hay', 300, 330), ('firewood', 88, 348), ('well', 270, 352)]: put(L('props/' + n), x, y)
# horní řady: domy čelem k vodorovné ulici
for n, cx in [('big/house_ochre', 38), ('big/shop_epicerie', 118), ('big/house_brick', 240), ('big/shop_boucherie', 320)]: put(L(n), cx, HS - 5)
# dole: domy bokem podél svislé ulice (štít ke kameře), za nimi druhý dům
# domy z boku (štítová stěna ke kameře) v řadě podél svislé ulice; vlevo od ulice zrcadlené, ať boční pás míří k ulici
def putm(img, cx, foot): put(img.transpose(Image.FLIP_LEFT_RIGHT), cx, foot)
for i, (n, f) in enumerate([('house_cream', 300), ('house_stone', 368)]): putm(L(f'side/{n}_side'), 128, f)
for i, (n, f) in enumerate([('house_brick', 300), ('shop_epicerie', 368)]): put(L(f'side/{n}_side'), 230, f)
for n, cx, f in [('side/house_ochre_side', 62, 330), ('side/shop_mustard_side', 304, 330)]: put(L(n), cx, f)
# dekorace podél ulic a na křižovatce
props = [('lamp', 152, HS - 2), ('lamp', 206, HS - 2), ('lamp', 152, HE + 30), ('lamp_broken', 210, HE + 34), ('poster_column', 206, HS + 2), ('cafe_table', 266, HS + 10),
         ('flower_box', 18, HS - 4), ('plant_pot', 92, HS - 3), ('plant_pot', 294, HS - 3), ('shop_sign', 150, 108), ('bench', 76, HS + 14), ('mailbox', 102, HS + 8),
         ('milk_churns', 340, HS + 12), ('barrel_small', 22, HS + 12), ('barrel_small', 32, HS + 14), ('bicycle', 312, HE + 16),
         ('crater_cobble', 178, 170), ('papers_glass', 230, 178), ('sandbag_corner', 112, HE + 18), ('mg_nest', 182, HE + 60), ('ammo_boxes', 150, HE + 72),
         ('tiles_beams', 260, HE + 24), ('helmet_rifle', 50, HE + 22), ('wall_broken', 266, HE + 40), ('fire_rubble', 330, HE + 30), ('wheelbarrow', 40, HE + 60),
         ('chair_table_broken', 288, 182), ('bricks', 186, 146), ('pole_fallen', 330, 200)]
for n, x, y in props: put(L('props/' + n), x, y)
S = R + 'web/public/assets/soldiers/'
def sp(name, x, y):
    s = Image.open(S + name + '.png').convert('RGBA'); s = s.crop(s.getbbox()); put(s, x, y)
for n, x, y in [('hegemony@fire_south_3', 128, 176), ('hegemony@kneel_west_2', 70, 182), ('hegemony_medic_south', 22, 180), ('hegemony@run_south_3', 250, 176)]: sp(n, x, y)
for n, x, y in [('concord@fire_north_3', 184, 254), ('concord@crawl_north_3', 178, 300), ('concord@kneel_north_2', 112, 226), ('concord@fire_north_6', 262, 232)]: sp(n, x, y)
for _, f in sorted(Q, key=lambda q: q[0]): f()
im.save(OUT + 'village4_1x.png')
im.resize((W * K, H * K), Image.NEAREST).convert('RGB').save(OUT + 'village4.png'); print('ok')
