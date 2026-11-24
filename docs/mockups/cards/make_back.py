# Rub kartičky ve velikosti hotových karet (54 × 87, docs/mockups/cards/final): stejný vzor jako card_back.png (make_cards.py), Trench 24.
# python3 docs/mockups/cards/make_back.py  →  docs/mockups/cards/final/back.png
from PIL import Image, ImageDraw, ImageFont
R = '/home/user/fronta/'
PAL = ['#' + l.strip() for l in open(R + 'art/palette/trench24.hex') if l.strip()]
C = lambda i: tuple(int(PAL[i][j:j + 2], 16) for j in (1, 3, 5)) + (255,)
FONT = ImageFont.truetype(R + 'marketing/fonts/Silkscreen-Regular.ttf', 8)
W, H = 54, 87
im = Image.new('RGBA', (W, H), C(2)); d = ImageDraw.Draw(im)
for y in range(H):
    for x in range(W):
        if (x + y) % 6 == 0 or (x - y) % 6 == 0: im.putpixel((x, y), C(3))
d.rectangle([0, 0, W - 1, H - 1], outline=C(0)); d.rectangle([2, 2, W - 3, H - 3], outline=C(5))
x0, y0, x1, y1 = 7, 18, W - 8, 68
d.rectangle([x0, y0, x1, y1], fill=C(9)); d.rectangle([x0, y0, x1, y1], outline=C(0))
def tc(y, s, col):
    w = d.textlength(s, font=FONT); assert w <= x1 - x0 - 2, (s, w); d.text((x0 + (x1 - x0 + 1 - w) // 2, y), s, font=FONT, fill=col)
tc(y0 + 3, 'MUD', C(19)); tc(y0 + 12, 'AND', C(19)); tc(y0 + 21, 'IRON', C(19))
d.line([x0 + 6, y0 + 32, x1 - 6, y0 + 32], fill=C(6))
HEART = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...']
hx = (W - 7) // 2
for j, r in enumerate(HEART):
    for i, ch in enumerate(r):
        if ch == '#': im.putpixel((hx + i, y0 + 37 + j), C(19))
im.putpixel((hx + 1, y0 + 38), C(20))
im.save(R + 'docs/mockups/cards/final/back.png')
im.resize((W * 6, H * 6), Image.NEAREST).save('/tmp/claude-0/back_big.png'); print('ok')
