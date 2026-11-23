"""Patreon post: představení sběratelských kartiček (Sweetheart cards), sneak peek: 2 kartičky zepředu, 1 rubem, 1 zamčená.
1920×1080 (pravidlo 21. 11.): mřížka 250×150, ×7 = 1750×1050 uprostřed tmavého plátna. Bez „&“ a bez „free to play“.
python3 marketing/make_patreon_cards.py  →  marketing/promo/patreon/post_cards_1920x1080.jpg"""
import importlib.util
import os
import sys

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
R = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from make_posts import P, font, up  # noqa: E402

sys.argv = [sys.argv[0], '--inner', '44x62']
spec = importlib.util.spec_from_file_location('cs', os.path.join(R, 'docs/mockups/cards/cut_sheet.py'))
cs = importlib.util.module_from_spec(spec); spec.loader.exec_module(cs)
ART = os.path.join(R, 'docs/mockups/cards/edit3/')
card = lambda f, n, t, r: cs.card(Image.open(ART + f).convert('RGBA'), n, t, r)


def back(W=cs.W, H=cs.H):
    im = Image.new('RGBA', (W, H), P['mud0'] + (255,)); d = ImageDraw.Draw(im)
    for y in range(H):
        for x in range(W):
            if (x + y) % 6 == 0 or (x - y) % 6 == 0: im.putpixel((x, y), P['mud1'] + (255,))
    d.rectangle([0, 0, W - 1, H - 1], outline=P['ink']); d.rectangle([3, 3, W - 4, H - 4], outline=P['mud3'])
    d.rectangle([7, 26, W - 8, 60], fill=P['white']); d.rectangle([7, 26, W - 8, 60], outline=P['ink'])
    f = font(8)
    for i, s in enumerate(['SWEET', 'HEART', 'CARD']):
        w = d.textlength(s, font=f); d.text(((W - w) // 2, 29 + i * 10), s, font=f, fill=P['ink'] if i < 2 else P['rust'])
    return im


def locked(W=cs.W, H=cs.H):
    """zamčená kartička: zlatý rámeček legendární, uvnitř silueta a otazník"""
    im = Image.new('RGBA', (W, H), P['gold'] + (255,)); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W - 1, H - 1], outline=P['ink'])
    d.rectangle([4, 8, 5 + cs.AW, 9 + cs.AH], fill=P['ink']); d.rectangle([5, 9, 4 + cs.AW, 8 + cs.AH], fill=P['mud0'])
    cx = W // 2
    d.ellipse([cx - 9, 18, cx + 9, 38], fill=P['mud1'])                  # hlava
    d.pieslice([cx - 20, 38, cx + 20, 80], 180, 360, fill=P['mud1'])      # ramena
    f = font(16, True); w = d.textlength('?', font=f); d.text((cx - w // 2, 22), '?', font=f, fill=P['gold'])
    d.rectangle([3, 11 + cs.AH, W - 4, 21 + cs.AH], fill=P['white']); d.rectangle([3, 11 + cs.AH, W - 4, 21 + cs.AH], outline=P['ink'])
    s = '???'; w = d.textlength(s, font=font(8)); d.text(((W - w) // 2, 12 + cs.AH), s, font=font(8), fill=P['ink'])
    for k in range(3):                                                    # 3 hvězdy
        sx = W - 9 - k * 6
        for (a, b) in ((2, 0), (1, 1), (2, 1), (3, 1), (0, 2), (1, 2), (2, 2), (3, 2), (4, 2), (1, 3), (3, 3), (0, 4), (4, 4)):
            im.putpixel((sx + a, 2 + b), P['ink'] + (255,))
    return im


W, H = 250, 150
im = Image.new('RGB', (W, H), P['dark']); d = ImageDraw.Draw(im)
# jemný vzor pozadí (dithering)
for y in range(H):
    for x in range(W):
        if (x * 3 + y * 5) % 11 == 0: im.putpixel((x, y), P['mud0'])


def text(tx, ty, s, f, fill, maxw=108):
    assert d.textlength(s, font=f) <= maxw, f'{s!r} je moc široký'
    d.text((tx + 1, ty + 1), s, font=f, fill=P['ink']); d.text((tx, ty), s, font=f, fill=fill)


X = 9
text(X, 12, 'PATRONS FIRST', font(8, True), P['gold'])
text(X - 2, 25, 'SWEETHEART', font(14, True), P['white'], 118)   # nad kartičkami (ty začínají níž)
text(X - 2, 41, 'CARDS', font(14, True), P['white'])
for i, s in enumerate(['FOUND ON THE WIRE', 'AND ON NIGHT RAIDS.', 'VERY RARE.', 'PASSED DOWN', 'TO YOUR HEIR.']):
    text(X, 68 + i * 10, s, font(8), P['pale'])
text(X, 128, 'MUD AND IRON', font(8, True), P['gold'])

# kartičky: rub, zamčená legendární, dvě zepředu (sneak peek)
cards = [(back(), 117, 46), (locked(), 141, 36), (card('art_01_hello.png', 1, 'HELLO', 'common'), 165, 24), (card('art_03_sunday.png', 3, 'SUNDAY', 'common'), 192, 44)]
for c, x, y in cards:
    sh = Image.new('RGBA', c.size, P['ink'] + (150,)); im.paste(sh, (x + 2, y + 2), sh)   # stín
    im.paste(c, (x, y), c)

out = os.path.join(HERE, 'promo', 'patreon', 'post_cards_1920x1080.jpg')
os.makedirs(os.path.dirname(out), exist_ok=True)
big = up(im, 7)
canvas = Image.new('RGB', (1920, 1080), P['dark'])
canvas.paste(big, ((1920 - big.width) // 2, (1080 - big.height) // 2))
canvas.save(out, quality=95)
print(out)
