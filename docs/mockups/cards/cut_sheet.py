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

# Předloha ve vyšším rozlišení (uživatel 23. 11.: čistší arch ~8× větší, bez pravidelné pixelové mřížky) → vnitřek 40 × 56:
# zmenšení průměrem (BOX), převod na paletu karet (Trench 24 + pleť vojáků) a obrysy: pixel je obrys, když je v jeho bloku
# aspoň LINE_T podíl tenkých tmavých čar (tmavší než 75 a o LINE_D tmavší než okolí); tmavé plochy (vlasy, šaty) obrysem nejsou.
LINE_T, LINE_D = 0.22, 45   # 0.15 dávalo moc černé kolem očí, 0.28 rozmazané tváře
def from_reference(inner, skin_t=0.5):
    from PIL import ImageFilter
    pal = [l.split('\t')[1].strip() for l in open(R + 'docs/mockups/cards/edit/cards_palette.gpl') if '\t#' in l]
    PP = [tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for h in pal]
    q = lambda c: min(PP, key=lambda p: (p[0] - c[0]) ** 2 * 0.3 + (p[1] - c[1]) ** 2 * 0.59 + (p[2] - c[2]) ** 2 * 0.11)
    skin = {(0xd9, 0x8f, 0x3f), (0xdb, 0x9b, 0x71), (0xc8, 0x86, 0x5f), (0xad, 0x6d, 0x4f), (0xa8, 0x5a, 0x36)}
    inner = inner.convert('RGB'); w, h = inner.size; small = inner.resize((AW, AH), Image.BOX)
    g = inner.convert('L'); m = g.filter(ImageFilter.BoxBlur(6)); gp, mp = g.load(), m.load()
    base, frac, mn = {}, {}, {}
    for y in range(AH):
        for x in range(AW):
            x0, x1, y0, y1 = int(x * w / AW), int((x + 1) * w / AW), int(y * h / AH), int((y + 1) * h / AH)
            vals = [(gp[xx, yy], mp[xx, yy]) for yy in range(y0, y1) for xx in range(x0, x1)]
            frac[x, y] = sum(1 for v, mm in vals if v < 75 and v < mm - LINE_D) / len(vals)
            mn[x, y] = min(v for v, _ in vals); base[x, y] = q(small.getpixel((x, y)))
    out = Image.new('RGBA', (AW, AH)); ink = C(1)[:3]
    for y in range(AH):
        for x in range(AW):
            c = base[x, y]
            if c in skin:   # v obličeji a na kůži: tmavý pixel jen u výrazné čáry, nebo zornice (nejtmavší bod okolí)
                nb = [mn[a, b] for a in range(x - 1, x + 2) for b in range(y - 1, y + 2) if 0 <= a < AW and 0 <= b < AH and base[a, b] in skin]
                pupil = mn[x, y] < 50 and mn[x, y] <= min(nb)
                dark = frac[x, y] >= skin_t or pupil
            else:
                dark = frac[x, y] >= LINE_T
            out.putpixel((x, y), (ink if dark else c) + (255,))
    return out

# Oči (uživatel 23. 11.: „problém jsou oči“): po zmenšení z předlohy jsou oči tmavé fleky 2×2–3×3. Shluk obrysové barvy, který je
# skoro celý obklopený pletí (= oko / obočí v obličeji), se zmenší na zornici: 1 tmavý pixel (u vyššího shluku 1×2) ve středu,
# zbytek shluku dostane stín pleti. Obrysy tváře a vlasů se nemění (sousedí s vlasy, oblečením nebo pozadím).
SKINS = {'#db9b71', '#c8865f', '#ad6d4f', '#e3d9c3', '#a85a36'}
def fix_eyes(im, min_skin=0.7):
    out = im.copy(); px = out.load(); w, h = out.size
    hexc = lambda p: '#%02x%02x%02x' % p[:3]
    ink = '#1c1a17'; shade = (0xad, 0x6d, 0x4f, 255); dark = C(1)
    seen = set()
    for y in range(h):
        for x in range(w):
            if (x, y) in seen or hexc(px[x, y]) != ink: continue
            stack, cl = [(x, y)], []
            seen.add((x, y))
            while stack:
                a, b = stack.pop(); cl.append((a, b))
                for da, db in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    n = (a + da, b + db)
                    if 0 <= n[0] < w and 0 <= n[1] < h and n not in seen and hexc(px[n]) == ink: seen.add(n); stack.append(n)
            if len(cl) < 2 or len(cl) > 8: continue
            ring = {(a + da, b + db) for a, b in cl for da in (-1, 0, 1) for db in (-1, 0, 1)} - set(cl)
            ring = [r for r in ring if 0 <= r[0] < w and 0 <= r[1] < h]
            if not ring or sum(hexc(px[r]) in SKINS for r in ring) / len(ring) < min_skin: continue
            xs, ys = [a for a, _ in cl], [b for _, b in cl]
            cx, cy = round(sum(xs) / len(xs)), round(sum(ys) / len(ys))
            keep = {(cx, cy)} | ({(cx, cy + 1)} if max(ys) - min(ys) >= 2 and (cx, cy + 1) in cl else set())
            for q in cl: px[q] = dark if q in keep else shade
            for q in keep: px[q] = dark
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
    if not raw and not edited and '--ref' not in sys.argv: sheet = recolor(sheet)   # pleť a barvy mimo paletu; oprava skvrn na pleti až po kartičkách (chráněné oblasti)
    cs = cells(sheet); assert len(cs) == 8, f'čekám 8 kartiček, našel jsem {len(cs)}: {cs}'
    cards = []
    big = '--ref' in sys.argv   # předloha ve vyšším rozlišení (např. 1536 × 1024)
    for k, (x0, y0, x1, y1) in enumerate(cs):
        cx, cy = (x0 + x1) // 2, (y0 + y1) // 2                 # střed buňky → společný výřez 40 × 56 (bez tenkého rámečku z archu)
        if big:
            pad = max(4, (x1 - x0) // 35)                       # bez tmavého rámečku buňky
            art = recolor(from_reference(sheet.crop((x0 + pad, y0 + pad, x1 - pad, y1 - pad))))
        else:
            art = sheet.crop((cx - AW // 2, cy - AH // 2, cx - AW // 2 + AW, cy - AH // 2 + AH))
        no = first + k; title, rar = NAMES.get(no, (f'NO {no}', 'common'))
        if not raw and not edited and not big and '--nofix' not in sys.argv: art = fix_skin(art, protect=PROTECT.get(no, ()))
        if sepia: art = recolor(art, sepia)
        c = card(art, no, title, rar)
        if not raw and not sepia: c.save(OUT + f'card_{no:02d}.png')
        cards.append(c)
    K, G = 5, 16
    out = Image.new('RGB', (4 * (W * K + G) + G, 2 * (H * K + G) + G), (28, 26, 23))
    for k, c in enumerate(cards):
        b = c.resize((W * K, H * K), Image.NEAREST); out.paste(b, (G + (k % 4) * (W * K + G), G + (k // 4) * (H * K + G)), b)
    tag = '_ref' if big else '_raw' if raw else (f'_sepia{int(sepia*100)}' if sepia else '')
    out.save(OUT + f'sheet_cards_{first:02d}{tag}.png'); print('ok', len(cards), 'karet', W, 'x', H, tag)
