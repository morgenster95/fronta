# Arch kartiček z PixelLabu (192 × 128 = 8 kartiček 4 × 2, cena 6 generací) → rozstříhat, oříznout na společný vnitřek 40 × 56,
# zarámovat jako sběratelskou kartu 50 × 81 px (Trench 24, štítek písmem Silkscreen 8 px, číslo písmem 3 × 5).
# python3 docs/mockups/cards/cut_sheet.py art/cine/card_sheet_a.png 1     (1 = číslo první kartičky na archu)
import sys
from PIL import Image, ImageDraw, ImageFont
R = '/home/user/fronta/'; OUT = R + 'docs/mockups/cards/'
PAL = ['#' + l.strip() for l in open(R + 'art/palette/trench24.hex') if l.strip()]
C = lambda i: tuple(int(PAL[i][j:j + 2], 16) for j in (1, 3, 5)) + (255,)
FONT = ImageFont.truetype(R + 'marketing/fonts/Silkscreen-Regular.ttf', 8)
AW, AH = 40, 56                     # vnitřek obrazu
W, H = AW + 10, AH + 25             # karta 50 × 81
RAR = {'common': (7, 6, 4, 5, 1), 'rare': (9, 16, 15, 14, 2), 'legendary': (22, 23, 20, 18, 3)}
NAMES = {1: ('HELLO', 'common'), 2: ('ENCORE', 'rare'), 3: ('SUNDAY', 'common'), 4: ('LETTER', 'common'),
         5: ('SALUTE', 'rare'), 6: ('SEASIDE', 'common'), 7: ('WINGS', 'legendary'), 8: ('MY PAL', 'common')}
DIG = {'#': ['.#.#.', '#####', '.#.#.', '#####', '.#.#.'], '0': ['###', '#.#', '#.#', '#.#', '###'], '1': ['.#.', '##.', '.#.', '.#.', '###'],
       '2': ['###', '..#', '###', '#..', '###'], '3': ['###', '..#', '.##', '..#', '###'], '4': ['#.#', '#.#', '###', '..#', '..#'],
       '5': ['###', '#..', '###', '..#', '###'], '6': ['###', '#..', '###', '#.#', '###'], '7': ['###', '..#', '.#.', '.#.', '.#.'],
       '8': ['###', '#.#', '###', '#.#', '###'], '9': ['###', '#.#', '###', '..#', '###']}

# Barvy (uživatel 23. 11.: doladit): pleť jako u vojáků ve hře (tlumená broskvová řada ze spritů), barvy mimo Trench 24 na nejbližší z palety.
# A2 (zvoleno): jen nejsvětlejší okrová → světlá pleť vojáků; tmavší rezavé zůstávají, ať vlasy nezesvětlí (varianta A měnila i je, colors_A_vs_A2.png)
SKIN = {'#d98f3f': '#db9b71'}
FIX = {'#52543a': '#545639', '#3f4230': '#3a3b2c', '#4b4560': '#4a4f52', '#141a2c': '#2a3138'}
def recolor(im, sepia=0.0):
    """přemapuje barvy podle SKIN a FIX; sepia > 0 = stará tiskovina (každá barva se přiblíží k #857a68)"""
    hexc = lambda p: '#%02x%02x%02x' % p[:3]
    rgb = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
    out = im.copy(); px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            p = px[x, y]
            if p[3] == 0: continue
            h = hexc(p); h = SKIN.get(h, FIX.get(h, h)); c = rgb(h)
            if sepia: c = tuple(round(a + (b - a) * sepia) for a, b in zip(c, (133, 122, 104)))
            px[x, y] = c + (255,)
    return out

# Pleť: PixelLab míchal do obličejů a paží šedobéžové barvy (#c4b8a0, #a39782, #857a68) → skvrny. Pixel z těchto barev se přebarví na tón
# pleti podle světlosti, jen když je uvnitř pleti (v okně 5 × 5 je dost broskvových pixelů); halenky, límce, papír a pes zůstanou.
SKIN_SEED = {'#db9b71', '#a85a36'}
SKIN_FIX = {'#c4b8a0': '#db9b71', '#a39782': '#c8865f', '#857a68': '#ad6d4f'}
# chráněné oblasti (číslo kartičky → obdélníky x0, y0, x1, y1 ve vnitřku 40 × 56), kam oprava pleti nesmí (pes, kožešina)
PROTECT = {2: [(24, 36, 40, 56)], 4: [(0, 24, 15, 44)], 8: [(1, 24, 22, 48)]}
def fix_skin(im, need=5, rounds=8, protect=()):
    out = im.copy(); px = out.load(); w, h = out.size
    guard = lambda x, y: any(a <= x < c and b <= y < d for a, b, c, d in protect)
    hexc = lambda p: '#%02x%02x%02x' % p[:3]
    rgb = lambda hh: tuple(int(hh[i:i + 2], 16) for i in (1, 3, 5)) + (255,)
    for _ in range(rounds):
        cur = [[hexc(px[x, y]) for x in range(w)] for y in range(h)]
        for y in range(h):
            for x in range(w):
                c = cur[y][x]
                if c not in SKIN_FIX or guard(x, y): continue
                n = sum(1 for j in range(max(0, y - 2), min(h, y + 3)) for i in range(max(0, x - 2), min(w, x + 3)) if cur[j][i] in SKIN_SEED or cur[j][i] in SKIN_FIX.values())
                if n >= need: px[x, y] = rgb(SKIN_FIX[c])
    return out

def tiny(im, x, y, s, col):
    for ch in s:
        g = DIG[ch]
        for j, r in enumerate(g):
            for i, c in enumerate(r):
                if c == '#': im.putpixel((x + i, y + j), col)
        x += len(g[0]) + 1

def cells(sheet):
    """mezery = sloupce/řádky převážně světlé (krémové pozadí archu) → buňky mezi nimi"""
    w, h = sheet.size; rgb = sheet.convert('RGB')
    lum = lambda x, y: sum(rgb.getpixel((x, y))) / 3
    gx = [x for x in range(w) if sum(lum(x, y) > 170 for y in range(h)) / h > 0.6]
    gy = [y for y in range(h) if sum(lum(x, y) > 170 for x in range(w)) / w > 0.6]
    def spans(gaps, n):
        out, start = [], 0
        for v in sorted(set(gaps)) + [n]:
            if v > start + 8: out.append((start, v))
            start = v + 1
        return out
    return [(x0, y0, x1, y1) for (y0, y1) in spans(gy, h) for (x0, x1) in spans(gx, w)]

def card(art, no, title, rar):
    hi, base, lo, rivet, stars = RAR[rar]
    im = Image.new('RGBA', (W, H), C(base)); d = ImageDraw.Draw(im)
    for i in range(70): im.putpixel(((i * 37) % W, (i * 53 + i // 5) % H), C(hi if i % 3 else lo))   # zestárlý papír
    d.rectangle([0, 0, W - 1, H - 1], outline=C(0))
    d.line([1, 1, W - 2, 1], fill=C(hi)); d.line([1, 1, 1, H - 2], fill=C(hi))
    d.line([W - 2, 2, W - 2, H - 2], fill=C(lo)); d.line([2, H - 2, W - 2, H - 2], fill=C(lo))
    tiny(im, 4, 2, f'#{no:02d}', C(0))
    for k in range(stars):                                   # hvězdy vzácnosti 5 × 5
        sx = W - 9 - k * 6
        for (a, b) in ((2, 0), (1, 1), (2, 1), (3, 1), (0, 2), (1, 2), (2, 2), (3, 2), (4, 2), (1, 3), (3, 3), (0, 4), (4, 4)):
            im.putpixel((sx + a, 2 + b), C(0))
    d.rectangle([4, 8, 5 + AW, 9 + AH], fill=C(0)); im.alpha_composite(art, (5, 9))
    py = 11 + AH
    d.rectangle([3, py, W - 4, py + 10], fill=C(9)); d.rectangle([3, py, W - 4, py + 10], outline=C(0))
    tw = d.textlength(title, font=FONT); assert tw <= W - 10, f'{title!r} je moc široký ({tw} px)'
    bb = d.textbbox((0, 0), title, font=FONT); th = bb[3] - bb[1]
    d.text((3 + (W - 6 - tw) // 2 + 1, py + (11 - th) // 2 - bb[1]), title, font=FONT, fill=C(0))   # svisle na střed štítku
    return im

if __name__ == '__main__':
    src, first = sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 1
    sepia = float(sys.argv[sys.argv.index('--sepia') + 1]) if '--sepia' in sys.argv else 0.0
    raw = '--raw' in sys.argv   # bez úpravy barev (pro srovnání)
    edited = '--edited' in sys.argv   # arch ručně dobarvený (Aseprite): žádné automatické úpravy barev, jen rozstříhat a zarámovat
    sheet = Image.open(R + src if not src.startswith('/') else src).convert('RGBA')
    if not raw and not edited: sheet = recolor(sheet)   # pleť a barvy mimo paletu; oprava skvrn na pleti až po kartičkách (chráněné oblasti)
    cs = cells(sheet); assert len(cs) == 8, f'čekám 8 kartiček, našel jsem {len(cs)}: {cs}'
    cards = []
    for k, (x0, y0, x1, y1) in enumerate(cs):
        cx, cy = (x0 + x1) // 2, (y0 + y1) // 2                 # střed buňky → společný výřez 40 × 56 (bez tenkého rámečku z archu)
        art = sheet.crop((cx - AW // 2, cy - AH // 2, cx - AW // 2 + AW, cy - AH // 2 + AH))
        no = first + k; title, rar = NAMES.get(no, (f'NO {no}', 'common'))
        if not raw and not edited and '--nofix' not in sys.argv: art = fix_skin(art, protect=PROTECT.get(no, ()))
        if sepia: art = recolor(art, sepia)
        c = card(art, no, title, rar)
        if not raw and not sepia: c.save(OUT + f'card_{no:02d}.png')
        cards.append(c)
    K, G = 5, 16
    out = Image.new('RGB', (4 * (W * K + G) + G, 2 * (H * K + G) + G), (28, 26, 23))
    for k, c in enumerate(cards):
        b = c.resize((W * K, H * K), Image.NEAREST); out.paste(b, (G + (k % 4) * (W * K + G), G + (k // 4) * (H * K + G)), b)
    tag = '_raw' if raw else (f'_sepia{int(sepia*100)}' if sepia else '')
    out.save(OUT + f'sheet_cards_{first:02d}{tag}.png'); print('ok', len(cards), 'karet', W, 'x', H, tag)
