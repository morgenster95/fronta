# Sběratelské kartičky (návrh 23. 11.): obraz z PixelLabu (art/cine/card_pinup_*.png, 72×96) v rámečku kresleném v kódu.
# Karta 88 × 128 px v mřížce hry (Trench 24), písmo Silkscreen 8 px přímo v mřížce, náhled ×5.  python3 docs/mockups/cards/make_cards.py
from PIL import Image, ImageDraw, ImageFont
R = '/home/user/fronta/'; OUT = R + 'docs/mockups/cards/'
PAL = ['#' + l.strip() for l in open(R + 'art/palette/trench24.hex') if l.strip()]
C = lambda i: tuple(int(PAL[i][j:j + 2], 16) for j in (1, 3, 5)) + (255,)
FONT = ImageFont.truetype(R + 'marketing/fonts/Silkscreen-Regular.ttf', 8)
W, H, K = 88, 128, 5
# vzácnost: (rám světlý, rám, rám tmavý, nýty, počet hvězd)
RAR = {'common': (7, 6, 4, 5, 1), 'rare': (9, 16, 15, 14, 2), 'legendary': (22, 23, 20, 18, 3)}
CARDS = [('card_pinup_rose', 'SUMMER ROSE', 3, 'common'), ('card_pinup_nurse', 'SISTER KISS', 7, 'rare'), ('card_pinup_dancer', 'MOONLIGHT', 12, 'legendary')]

def text_c(d, y, s, col, x0=0, x1=W):
    w = d.textlength(s, font=FONT); assert w <= (x1 - x0) - 4, f'text {s!r} je moc široký ({w} px)'; d.text((x0 + (x1 - x0 - w) // 2, y), s, font=FONT, fill=col)

def front(art, title, no, rar):
    hi, base, lo, rivet, stars = RAR[rar]
    im = Image.new('RGBA', (W, H), C(1)); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W - 1, H - 1], fill=C(base))
    # zestárlý papír: tečky a skvrny (pevný vzor)
    for i in range(170):
        x, y = (i * 37) % W, (i * 53 + i // 7) % H
        im.putpixel((x, y), C(hi if i % 3 else lo))
    d.rectangle([0, 0, W - 1, H - 1], outline=C(0))
    d.line([1, 1, W - 2, 1], fill=C(hi)); d.line([1, 1, 1, H - 2], fill=C(hi))
    d.line([W - 2, 2, W - 2, H - 2], fill=C(lo)); d.line([2, H - 2, W - 2, H - 2], fill=C(lo))
    for (x, y) in ((3, 3), (W - 5, 3), (3, H - 5), (W - 5, H - 5)):  # nýty v rozích
        d.rectangle([x, y, x + 1, y + 1], fill=C(rivet)); im.putpixel((x, y), C(hi))
    # horní lišta: číslo a hvězdy vzácnosti
    d.text((8, 2), f'No.{no:02d}', font=FONT, fill=C(0))
    for k in range(stars):
        sx = W - 13 - k * 8
        for (a, b) in ((2, 0), (1, 1), (2, 1), (3, 1), (0, 2), (1, 2), (2, 2), (3, 2), (4, 2), (1, 3), (3, 3), (0, 4), (4, 4)):
            im.putpixel((sx + a, 4 + b), C(0))
    # obraz s tmavým lemem
    d.rectangle([7, 12, 7 + 73, 12 + 97], fill=C(0))
    im.alpha_composite(art, (8, 13))
    # štítek se jménem
    py = 112
    d.rectangle([8, py, W - 9, py + 11], fill=C(9)); d.rectangle([8, py, W - 9, py + 11], outline=C(0))
    d.line([9, py + 10, W - 10, py + 10], fill=C(7))
    text_c(d, py + 1, title, C(0), 8, W - 8)
    return im

def back():
    im = Image.new('RGBA', (W, H), C(2)); d = ImageDraw.Draw(im)
    for y in range(H):
        for x in range(W):
            if (x + y) % 6 == 0 or (x - y) % 6 == 0: im.putpixel((x, y), C(3))
    d.rectangle([0, 0, W - 1, H - 1], outline=C(0)); d.rectangle([3, 3, W - 4, H - 4], outline=C(5))
    d.rectangle([10, 26, W - 11, 102], fill=C(9)); d.rectangle([10, 26, W - 11, 102], outline=C(0))
    text_c(d, 30, 'MUD AND', C(19)); text_c(d, 39, 'IRON', C(19)); d.line([18, 50, W - 19, 50], fill=C(6))
    for i, line in enumerate(['SWEETHEART', 'CARD', '', 'KEEP IT DRY', 'PASS IT ON']):
        text_c(d, 55 + i * 9, line, C(0) if i < 2 else C(5))
    return im

fronts = []
for name, title, no, rar in CARDS:
    art = Image.open(R + f'art/cine/{name}.png').convert('RGBA')
    f = front(art, title, no, rar); f.save(OUT + f'{name}_card.png'); fronts.append(f)
b = back(); b.save(OUT + 'card_back.png')
# náhled ×5 vedle sebe + rub
G = 20; sheet = Image.new('RGB', (4 * W * K + 5 * G, H * K + 2 * G + 40), (28, 26, 23)); dd = ImageDraw.Draw(sheet)
for i, im in enumerate(fronts + [b]):
    big = im.resize((W * K, H * K), Image.NEAREST); sheet.paste(big, (G + i * (W * K + G), G), big)
    lab = (CARDS[i][3].upper() if i < 3 else 'BACK')
    dd.text((G + i * (W * K + G), H * K + G + 8), lab, font=ImageFont.truetype(R + 'marketing/fonts/Silkscreen-Regular.ttf', 24), fill=(217, 143, 63))
sheet.save(OUT + 'cards_sheet.png'); print('ok')
