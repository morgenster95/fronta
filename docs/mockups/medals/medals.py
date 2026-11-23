# Medaile Mud & Iron: pixel art kreslený v kódu, paleta Trench 24.
# Pravidla: plátno 15 × 23 px (lichá šířka → skutečný střed ve sloupci 7), stuha 9 px, kroužek, tělo medaile,
# vše souměrné podle sloupce 7; světlo shora (souměrně), jeden odlesk vlevo nahoře; obrys tmavý dokola.
# python3 docs/mockups/medals/medals.py  →  medals_sheet.png, medals_in_use.png, png/<id>_<strana>.png
import math, os
from PIL import Image, ImageDraw, ImageFont
R = '/home/user/fronta/'; OUT = R + 'docs/mockups/medals/'
os.makedirs(OUT + 'png', exist_ok=True)
PAL = ['#' + l.strip() for l in open(R + 'art/palette/trench24.hex') if l.strip()]
C = lambda i: tuple(int(PAL[i][j:j + 2], 16) for j in (1, 3, 5)) + (255,)
W, H, CX = 15, 23, 7
# kov: (odlesk, světlá, základ, stín, obrys)
METAL = {'gold': (9, 22, 23, 20, 18), 'silver': (9, 9, 16, 15, 17), 'bronze': (22, 23, 20, 19, 18),
         'iron': (16, 15, 2, 1, 0), 'steel': (9, 16, 15, 14, 17), 'brass': (9, 22, 13, 12, 10)}

# ---- tvary (test v souřadnicích od středu; střed je přesně pixel) ----
def cross(dx, dy):  # kříž s rozšířenými rameny
    ax, ay = abs(dx), abs(dy)
    return (ay <= 6 and ax <= 1 + ay * 0.4) if ay >= ax else (ax <= 6 and ay <= 1 + ax * 0.4)
def maltese(dx, dy):  # kříž s vykrojenými konci
    ax, ay = abs(dx), abs(dy)
    if ay >= ax: return ay <= 6 and ax <= 0.6 + ay * 0.55 and not (ay >= 5 and ax <= (ay - 5) * 1.6 and ay > 5.2 and ax < 1)
    return ax <= 6 and ay <= 0.6 + ax * 0.55 and not (ax >= 5 and ay <= (ax - 5) * 1.6 and ax > 5.2 and ay < 1)
def disc(dx, dy): return dx * dx + dy * dy <= 5.8 ** 2
def small_disc(dx, dy): return dx * dx + dy * dy <= 4.9 ** 2
def ring(dx, dy): d = math.hypot(dx, dy); return 3.2 <= d <= 6.2
def oval(dx, dy): return (dx / 5.2) ** 2 + (dy / 6.4) ** 2 <= 1
def lozenge(dx, dy): return abs(dx) / 5.6 + abs(dy) / 6.6 <= 1
def shield(dx, dy): return abs(dx) <= 5 and dy <= 2 and dy >= -6 or (dy > 2 and abs(dx) <= 5 - (dy - 2) * 1.25)
def square(dx, dy): return abs(dx) <= 5 and abs(dy) <= 5
WINGS = ['......#......', '#.....#.....#', '##....#....##', '###..###..###', '####.###.####', '.####.#.####.', '.###########.',
         '..#########..', '...#######...', '....#####....', '.....###.....', '......#......', '.............']
def wings(dx, dy):
    return WINGS[int(dy) + 6][int(dx) + 6] == '#'
def _old_wings(dx, dy):
    ax = abs(dx)
    if dx * dx + dy * dy <= 2.6 ** 2: return True
    return 1.5 <= ax <= 6.4 and -2.2 - (ax - 1.5) * 0.25 <= dy <= 1.6 - (ax - 1.5) * 0.55 and not (ax > 3 and dy > 0 and int(ax) % 2 == 0)
def bar(dx, dy): return abs(dx) <= 6 and abs(dy) <= 2
def star(n, r, ri, p=1.6):
    def f(dx, dy):
        a = math.atan2(dx, -dy); d = math.hypot(dx, dy)
        k = (a % (2 * math.pi / n)) / (2 * math.pi / n); t = abs(k - 0.5) * 2
        return d <= ri + (r - ri) * t ** p
    return f

def body(test, metal, size=13):
    hi, li, base, sh, rim = METAL[metal]
    c = (size - 1) // 2
    m = [[test(x - c, y - c) for x in range(size)] for y in range(size)]
    ins = lambda x, y: 0 <= x < size and 0 <= y < size and m[y][x]
    im = Image.new('RGBA', (size, size))
    for y in range(size):
        for x in range(size):
            if not m[y][x]: continue
            if not all(ins(x + a, y + b) for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))): col = rim
            elif y <= c and not ins(x, y - 1) or y < c - 1 and not ins(x, y - 2): col = li   # horní polovina: světlá hrana
            elif y >= c and (not ins(x, y + 1) or not ins(x, y + 2)): col = sh                # spodní polovina: stín
            else: col = base
            im.putpixel((x, y), C(col))
    # jeden odlesk vlevo nahoře (první vnitřní pixel shora-zleva)
    for s in range(size * 2):
        hit = next(((x, s - x) for x in range(size) if 0 <= s - x < size and ins(x, s - x) and im.getpixel((x, s - x))[:3] != C(rim)[:3]), None)
        if hit: im.putpixel(hit, C(hi)); break
    return im

# symboly uprostřed (souměrné, lichá šířka)
GLYPH = {
    'dot': ['#'],
    'dot3': ['.#.', '###', '.#.'],
    'helmet_h': ['.###.', '#####', '#...#'],
    'helmet_c': ['.###.', '#####', '#####'],
    'wire': ['#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
    'dagger': ['.#.', '.#.', '.#.', '###', '.#.'],
    'shell': ['.#.', '###', '###', '###', '###'],
    'cross': ['.#.', '###', '.#.'],
    'star': ['..#..', '.###.', '#####', '.#.#.'],
    'wing': ['#.....#', '##...##', '.##.##.', '...#...'],
    'flake': ['#.#.#', '.###.', '#####', '.###.', '#.#.#'],
    'candle': ['..#..', '..#..', '.###.', '.###.', '.###.'],
    'seven': ['###', '..#', '..#', '.#.', '.#.'],
    'tower': ['#.#.#', '#####', '.###.', '.###.'],
    'eye': ['.###.', '#.#.#', '.###.'],
    'wreath': ['#...#', '#...#', '.#.#.'],
    'bolt': ['..#', '.#.', '###', '.#.', '#..'],
}
def glyph(im, name, col, dy=0):
    g = GLYPH[name]; w, h = len(g[0]), len(g)
    ox = (im.width - w) // 2; oy = (im.height - h) // 2 + dy
    for j, r in enumerate(g):
        for i, ch in enumerate(r):
            if ch == '#': im.putpixel((ox + i, oy + j), C(col))

def ribbon(half):  # half = barvy od kraje ke středu (5 položek → stuha 9 px, souměrná)
    cols = half + half[-2::-1]
    im = Image.new('RGBA', (9, 6))
    for y in range(6):
        for x in range(9):
            col = cols[x]
            if x in (0, 8) or y == 5: col = 1
            im.putpixel((x, y), C(col))
    return im

def medal(half, shape, metal, sym=None, symcol=1, size=13, sdy=0):
    out = Image.new('RGBA', (W, H))
    rb = ribbon(half); out.alpha_composite(rb, ((W - 9) // 2, 0))
    s1, s2 = METAL['silver'][3], METAL['silver'][4]
    out.putpixel((CX, 6), C(s1)); out.putpixel((CX, 7), C(s2))       # kroužek (1 px, přesně na ose)
    b = body(shape, metal, size)
    if sym: glyph(b, sym, symcol, sdy)
    top = b.getbbox()[1]
    out.alpha_composite(b, ((W - size) // 2, 8 - top))   # tělo přisazené přímo pod kroužek
    return out

# ---- celá sada: (id, název H, název C, za co, tvar/kov/symbol H, C) ----
H_RIB = {'iron': [1, 16, 1, 19, 1], 'grey': [17, 16, 17, 9, 17], 'rust': [1, 19, 19, 1, 19], 'wire': [14, 16, 14, 1, 14], 'night': [17, 17, 1, 19, 1],
         'gun': [1, 19, 1, 23, 1], 'sky': [14, 16, 9, 16, 9], 'mercy': [14, 9, 9, 19, 9], 'eye': [17, 15, 16, 15, 1], 'long': [16, 1, 16, 1, 16],
         'winter': [16, 9, 16, 9, 9], 'truce': [18, 9, 13, 9, 23]}
C_RIB = {'iron': [12, 23, 12, 23, 12], 'grey': [11, 22, 18, 22, 18], 'rust': [13, 18, 13, 18, 18], 'wire': [11, 13, 11, 22, 11], 'night': [10, 10, 11, 18, 1],
         'gun': [11, 18, 23, 18, 23], 'sky': [12, 9, 22, 9, 22], 'mercy': [18, 9, 18, 9, 9], 'eye': [11, 13, 12, 13, 22], 'long': [13, 12, 13, 12, 23],
         'winter': [12, 9, 12, 9, 9], 'truce': [18, 9, 13, 9, 23]}
SET = [
 ('valour', 'Iron Wreath', 'Valley Cross', 'Most enemy hits in the day (one per side, every edition)',
   (H_RIB['iron'], cross, 'iron', 'dot', 19), (C_RIB['iron'], cross, 'bronze', 'dot3', 18)),
 ('marksman', 'Star of the Steady Hand', 'Gallantry Star', 'Best sniper or machine gunner of the day',
   (H_RIB['grey'], star(8, 6.4, 3.8, 1.5), 'silver', 'dot3', 19), (C_RIB['grey'], star(5, 6.5, 3.1, 1.3), 'gold', None, 1)),
 ('mercy', 'Field Cross', 'Lamp of Mercy', 'Medic who treated the most wounded that night',
   (H_RIB['mercy'], cross, 'silver', 'cross', 19), (C_RIB['mercy'], disc, 'silver', 'cross', 18)),
 ('wound', 'Wound Clasp', 'Wound Stripe', 'Every soldier who survives a heavy or critical wound',
   (H_RIB['rust'], oval, 'steel', 'helmet_h', 1), (C_RIB['rust'], small_disc, 'bronze', 'helmet_c', 1)),
 ('wire', 'Wire Clasp', 'Picket Medal', 'Best man of the wiring party (most yards of wire repaired)',
   (H_RIB['wire'], square, 'steel', 'wire', 1), (C_RIB['wire'], lozenge, 'bronze', 'wire', 18)),
 ('raid', 'Night Dagger', "Raider's Star", 'Best raider of the night raid (most hits, came back)',
   (H_RIB['night'], lozenge, 'iron', 'dagger', 16), (C_RIB['night'], star(6, 6.4, 4.0, 1.3), 'brass', 'dagger', 10)),
 ('gun', "Gunner's Badge", 'Shell Medal', 'Top gun crew in a comment duel of the guns (most shells)',
   (H_RIB['gun'], disc, 'iron', 'shell', 23), (C_RIB['gun'], shield, 'bronze', 'shell', 18)),
 ('sky', 'Iron Wings', 'Concord Wings', 'Pilot who flew and came back (and who brings a plane down)',
   (H_RIB['sky'], wings, 'silver', 'dot', 19), (C_RIB['sky'], wings, 'gold', 'dot', 18)),
 ('hill', 'Order of the Height', 'Cross of the Ridge', 'Hero of a captured hill or objective (one per victory)',
   (H_RIB['eye'], star(8, 6.4, 4.2, 1.2), 'gold', 'tower', 18), (C_RIB['eye'], cross, 'gold', 'dot3', 18)),
 ('service', 'Long Service Bar', 'Seven Winters Medal', 'Long service: 7, 14 and 30 days alive at the front',
   (H_RIB['long'], ring, 'steel', None, 1), (C_RIB['long'], disc, 'brass', 'seven', 10)),
 ('winter', 'Frost Ribbon', 'Snow Medal', 'Held the line through the first snow and the deep winter',
   (H_RIB['winter'], disc, 'silver', 'flake', 14), (C_RIB['winter'], small_disc, 'silver', 'flake', 12)),
 ('truce', 'Silent Night Medal', 'Silent Night Medal', 'Christmas truce: met the enemy in no man\'s land (same for both)',
   (H_RIB['truce'], star(8, 6.4, 4.4, 1.2), 'gold', 'candle', 18), (C_RIB['truce'], star(8, 6.4, 4.4, 1.2), 'gold', 'candle', 18)),
]
MEDALS = {}
for mid, nh, nc, why, h, c in SET:
    for side, spec, name in (('heg', h, nh), ('con', c, nc)):
        im = medal(spec[0], spec[1], spec[2], spec[3], spec[4])
        MEDALS[(mid, side)] = (name, im); im.save(OUT + f'png/{mid}_{side}.png')
        # kontrola středu: stuha + kroužek souměrné, tělo medaile souměrné v obrysu
        a = im.getchannel('A')
        for y in range(H):
            row = [a.getpixel((x, y)) > 0 for x in range(W)]
            assert row == row[::-1], f'{mid}_{side}: řádek {y} není souměrný'
        assert a.getpixel((CX, 8)) > 0, f'{mid}_{side}: medaile nevisí na kroužku'

# ---- arch ----
F = lambda s, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), s)
BG = (244, 240, 231); INK = (30, 28, 25); MUTED = (107, 97, 82)
K = 6; cw = W * K; rh = H * K + 18
sheet = Image.new('RGB', (1180, 70 + len(SET) * rh), BG); d = ImageDraw.Draw(sheet)
d.text((20, 16), 'MUD AND IRON · MEDALS  (15 x 23 px, Trench 24, centred on column 7; shown 6x and 1x)', fill=INK, font=F(17, True))
d.text((40, 46), 'HEGEMONY', fill=INK, font=F(13, True)); d.text((210, 46), 'CONCORD', fill=INK, font=F(13, True))
for i, (mid, nh, nc, why, *_r) in enumerate(SET):
    y = 70 + i * rh
    for j, side in enumerate(('heg', 'con')):
        x = 20 + j * (cw + 80)
        for gy in range(H):
            for gx in range(W):
                d.rectangle([x + gx * K, y + gy * K, x + gx * K + K - 1, y + gy * K + K - 1], fill=(226, 222, 212) if (gx + gy) % 2 else (236, 232, 222))
        d.line([x + CX * K + K // 2, y - 3, x + CX * K + K // 2, y + H * K + 3], fill=(200, 70, 60), width=1)  # osa
        im = MEDALS[(mid, side)][1]; big = im.resize((W * K, H * K), Image.NEAREST)
        sheet.paste(big, (x, y), big); sheet.paste(im, (x + cw + 10, y + H * K - H), im)
        im2 = im.resize((W * 2, H * 2), Image.NEAREST); sheet.paste(im2, (x + cw + 30, y + H * K - H * 2), im2)
    tx = 20 + 2 * (cw + 80) + 10
    d.text((tx, y + 20), f'{nh}  /  {nc}' if nh != nc else nh, fill=INK, font=F(16, True))
    d.text((tx, y + 46), why, fill=MUTED, font=F(13))
    d.text((tx, y + 68), f'id: {mid}', fill=(160, 150, 135), font=F(11))
sheet.save(OUT + 'medals_sheet.png')

# ---- ukázka na kartě a v novinách ----
S = R + 'web/public/assets/soldiers/'
card = Image.new('RGB', (160, 96), C(1)[:3]); cd = ImageDraw.Draw(card)
cd.rectangle([0, 0, 159, 95], outline=C(5)[:3])
sold = Image.open(S + 'concord_south.png').convert('RGBA'); card.paste(sold, (6, 8), sold)
cd.text((44, 8), 'EDMUND MCNAMARA', fill=C(9)[:3], font=F(8, True)); cd.text((44, 20), 'Rifleman, 3rd Platoon', fill=C(7)[:3], font=F(8))
cd.text((6, 48), 'MEDALS', fill=C(23)[:3], font=F(8, True))
for i, mid in enumerate(['valour', 'wire', 'wound', 'service']):
    im = MEDALS[(mid, 'con')][1]; card.paste(im, (6 + i * 19, 62), im)
card = card.resize((160 * 5, 96 * 5), Image.NEAREST)
gaz = Image.new('RGB', (800, 190), (228, 219, 196)); gd = ImageDraw.Draw(gaz)
gd.text((20, 14), 'THE TRENCH GAZETTE · DAY 15', fill=INK, font=F(16, True))
gd.text((20, 44), 'DECORATED TODAY', fill=(126, 59, 42), font=F(20, True))
for k, (mid, side, line) in enumerate([('valour', 'heg', 'Iron Wreath to Otto Tyner (Hegemony), 4 hits in one night.'),
                                        ('wire', 'con', 'Picket Medal to Edmund Mcnamara (Concord), 60 yards of wire.')]):
    im = MEDALS[(mid, side)][1].resize((W * 2, H * 2), Image.NEAREST); gaz.paste(im, (20, 80 + k * 54), im)
    gd.text((70, 92 + k * 54), line, fill=INK, font=F(16))
both = Image.new('RGB', (800, 96 * 5 + 190 + 20), BG); both.paste(card, (0, 0)); both.paste(gaz, (0, 96 * 5 + 20))
both.save(OUT + 'medals_in_use.png'); print('ok', len(MEDALS), 'medailí')
