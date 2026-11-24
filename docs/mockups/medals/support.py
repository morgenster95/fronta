# Medaile podporovatelů (Patreon): stejný postup jako medals.py (15 × 23 px, Trench 24, souměrné podle sloupce 7).
# Společné pro obě strany (podpora hry, ne strany). Stuha = pruhy War Bonds z webu (.ribbon), střed podle úrovně.
# python3 docs/mockups/medals/support.py  →  support/support_sheet.png, support/<id>_<a|b>.png
import sys, os
sys.argv = ['x']; sys.path.insert(0, os.path.dirname(__file__))
import medals as M
from PIL import Image, ImageDraw
OUT = M.OUT + 'support/'
M.GLYPH.update({
    'envelope': ['.#####.', '#.###.#', '##.#.##', '###.###', '#######'],
    'paw': ['.#.#.', '#...#', '.....', '.###.', '.###.'],
    'bond': ['#####', '#...#', '#####', '#...#', '#####'],
    'cup': ['#####', '#####', '.###.', '..#..', '.###.'],
    'star5': ['..#..', '#####', '.###.', '.#.#.'],
})
WB = lambda mid: [19, 23, 9, 23, mid]        # pruhy War Bonds; střed: olivová / ocel / zlatá
SET = [
 ('war-bonds', 'War Bonds', '4 $ · ribbon', [
   ('a', WB(12), M.disc, 'bronze', 'bond', 9),
   ('b', WB(12), M.small_disc, 'brass', 'star5', 18)]),
 ('field-post', 'Field Post', '6 $ · ribbon + dog', [
   ('a', WB(16), M.square, 'steel', 'envelope', 9),
   ('b', WB(16), M.lozenge, 'silver', 'envelope', 9)]),
 ('officers-mess', "Officers' Mess", '10 $ · star + ribbon + dog', [
   ('a', WB(22), M.star(8, 6.4, 4.2, 1.2), 'gold', 'star5', 18),
   ('b', WB(22), M.cross, 'gold', 'cup', 18)]),
 ('trench-dog', 'Trench Dog', 'clasp for Field Post and Officers\' Mess', [
   ('a', [5, 7, 5, 7, 5], M.disc, 'steel', 'paw', 9),
   ('b', [13, 12, 13, 9, 13], M.shield, 'bronze', 'paw', 9)]),
]
IMG = {}
for mid, name, why, vs in SET:
    for v, rib, shape, metal, sym, col in vs:
        im = M.medal(rib, shape, metal, sym, col)
        a = im.getchannel('A')
        for y in range(M.H):
            row = [a.getpixel((x, y)) > 0 for x in range(M.W)]
            assert row == row[::-1], f'{mid}_{v}: řádek {y} není souměrný'
        assert a.getpixel((M.CX, 8)) > 0, f'{mid}_{v}: nevisí na kroužku'
        IMG[(mid, v)] = im; im.save(OUT + f'{mid}_{v}.png')

K = 6; cw = M.W * K; rh = M.H * K + 24
sheet = Image.new('RGB', (1000, 80 + len(SET) * rh), M.BG); d = ImageDraw.Draw(sheet)
d.text((20, 16), 'MUD AND IRON · SUPPORTER MEDALS (same for both sides; shown 6x, 2x, 1x)', fill=M.INK, font=M.F(17, True))
d.text((40, 50), 'VARIANT A', fill=M.INK, font=M.F(13, True)); d.text((250, 50), 'VARIANT B', fill=M.INK, font=M.F(13, True))
for i, (mid, name, why, vs) in enumerate(SET):
    y = 76 + i * rh
    for j, (v, *_r) in enumerate(vs):
        x = 20 + j * (cw + 110)
        for gy in range(M.H):
            for gx in range(M.W):
                d.rectangle([x + gx * K, y + gy * K, x + gx * K + K - 1, y + gy * K + K - 1], fill=(226, 222, 212) if (gx + gy) % 2 else (236, 232, 222))
        im = IMG[(mid, v)]; big = im.resize((M.W * K, M.H * K), Image.NEAREST); sheet.paste(big, (x, y), big)
        i2 = im.resize((M.W * 2, M.H * 2), Image.NEAREST); sheet.paste(i2, (x + cw + 14, y + M.H * K - M.H * 2), i2)
        sheet.paste(im, (x + cw + 56, y + M.H * K - M.H), im)
    tx = 20 + 2 * (cw + 110) + 10
    d.text((tx, y + 30), name, fill=M.INK, font=M.F(18, True))
    d.text((tx, y + 58), why, fill=M.MUTED, font=M.F(14))
    d.text((tx, y + 80), f'id: {mid}', fill=(160, 150, 135), font=M.F(11))
sheet.save(OUT + 'support_sheet.png'); print('ok', len(IMG))
