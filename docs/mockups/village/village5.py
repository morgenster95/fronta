# Ukázka 5 „Bitva o vesnici“ (24. 11. večer): městečko jako v klasických RPG. Všechny domy čelem ke kameře v řadách nad sebou,
# vodorovné ulice před každou řadou, svislá ulice prochází mezerou mezi bloky; na jejích rozích domy štítem (art/village/side/*_side.png),
# mezery vyplní zídky, ploty, stromy, lampy. Nic není natočené. python3 docs/mockups/village/village5.py → village5.png (×3)
import random
from PIL import Image, ImageDraw
R = '/home/user/fronta/'; OUT = R + 'docs/mockups/village/'
PAL = ['#' + l.strip() for l in open(R + 'art/palette/trench24.hex') if l.strip()]
C = lambda i: tuple(int(PAL[i][j:j + 2], 16) for j in (1, 3, 5)) + (255,)
W, H, K = 400, 400, 3
rnd = random.Random(9)
im = Image.new('RGBA', (W, H), C(3)); d = ImageDraw.Draw(im)
def px(x, y, c):
    if 0 <= x < W and 0 <= y < H: im.putpixel((x, y), c)
for y in range(H):
    for x in range(W):
        r = rnd.random(); im.putpixel((x, y), C(13) if r < 0.12 else C(4) if r < 0.22 else C(2) if r < 0.3 else C(3))
VS, VE = 176, 214  # svislá ulice
STREETS = [(140, 176), (318, 354)]  # vodorovné ulice před řadami domů
def cob(a, b):
    row = b // 4; ox = (a + (row % 2) * 3) % 6
    c = 1 if b % 4 == 3 or ox == 5 else (6 if (a * 7 + row * 13) % 11 == 0 else 5 if (a // 6 + row) % 3 else 4)
    return 3 if rnd.random() < 0.04 else c
for y in range(H):
    for x in range(W):
        inH = any(a <= y < b for a, b in STREETS); inV = VS <= x < VE
        if inH: px(x, y, C(cob(x, y)))
        elif inV: px(x, y, C(cob(y, x)))
        elif any(a - 4 <= y < a or b <= y < b + 3 for a, b in STREETS) or VS - 3 <= x < VS or VE <= x < VE + 3: px(x, y, C(6 if (x + y) % 7 else 5))
L = lambda p: Image.open(R + 'art/village/' + p + '.png').convert('RGBA')
Q = []
def put(img, cx, foot, flip=False):
    if flip: img = img.transpose(Image.FLIP_LEFT_RIGHT)
    Q.append((foot, lambda: im.alpha_composite(img, (int(cx - img.width / 2), int(foot - img.height)))))
# řada 1 (dveře do horní ulice), u svislé ulice rohové domy štítem
for n, cx in [('big/house_ochre', 40), ('big/shop_epicerie', 118), ('side/house_cream_side', 152), ('side/house_brick_side', 240), ('big/house_stone', 300), ('big/shop_boucherie', 374)]:
    put(L(n), cx, 136, flip=n.endswith('cream_side'))
# řada 2: domy čelem do dolní ulice; za nimi (nahoře, u horní ulice) dvorky: zídky, ploty, stromy, dříví, studna
for n, cx in [('big/house_brick', 42), ('big/house_cream', 124), ('side/house_stone_side', 152), ('side/shop_mustard_side', 238), ('big/shop_mustard' if False else 'big/house_ochre', 302), ('big/shop_epicerie', 378)]:
    put(L(n), cx, 314, flip=n.endswith('stone_side'))
yard = [('wall_broken', 22, 196), ('wall_broken', 62, 196), ('fence', 104, 198), ('tree_planter', 140, 200), ('firewood', 268, 196), ('fence', 300, 198), ('fence', 334, 198), ('wall_broken', 372, 196),
        ('hay', 320, 206), ('well', 80, 206), ('tree_planter', 260, 210)]
# ulice: lampy, kavárna, sloup s plakáty, truhlíky, válečné věci; svislá ulice: barikáda a hnízdo
street = [('lamp', 168, 140), ('lamp', 222, 140), ('lamp', 168, 318), ('lamp_broken', 222, 322), ('poster_column', 226, 178), ('cafe_table', 340, 150), ('cafe_table', 312, 150),
          ('flower_box', 20, 138), ('plant_pot', 90, 138), ('plant_pot', 330, 139), ('bench', 66, 152), ('mailbox', 270, 146), ('milk_churns', 106, 156), ('barrel_small', 254, 150), ('barrel_small', 262, 153),
          ('crater_cobble', 194, 162), ('papers_glass', 150, 170), ('sandbag_corner', 196, 230), ('barricade_planks', 194, 252), ('mg_nest', 196, 300), ('ammo_boxes', 228, 296),
          ('tiles_beams', 46, 340), ('helmet_rifle', 286, 344), ('fire_rubble', 352, 340), ('bicycle', 120, 346), ('plant_pot', 92, 316), ('flower_box', 140, 316), ('crates', 360, 330)]
for n, x, y in yard + street: put(L('props/' + n), x, y)
S = R + 'web/public/assets/soldiers/'
def sp(name, x, y):
    s = Image.open(S + name + '.png').convert('RGBA'); s = s.crop(s.getbbox()); put(s, x, y)
for n, x, y in [('hegemony@fire_south_3', 120, 166), ('hegemony@kneel_west_2', 80, 172), ('hegemony_medic_south', 30, 170), ('hegemony@run_south_3', 286, 168), ('hegemony@fire_south_5', 196, 212)]: sp(n, x, y)
for n, x, y in [('concord@fire_north_3', 196, 286), ('concord@crawl_north_3', 186, 336), ('concord@kneel_north_2', 250, 346), ('concord@fire_north_6', 330, 350)]: sp(n, x, y)
for _, f in sorted(Q, key=lambda q: q[0]): f()
im.save(OUT + 'village5_1x.png')
im.resize((W * K, H * K), Image.NEAREST).convert('RGB').save(OUT + 'village5.png'); print('ok')
