"""Post „A letter for you“ (1080×1350), kreslený od nuly: zátiší s poštou na bedně ve světle lucerny.
Přední dopis s adresou, známkou a razítkem, pod ním dopis se zadní stranou a pečetí, svazek na provázku, blátivé otisky.
Bez čísel (výhodu dopisu neprozrazujeme). Použití: python marketing/make_letter_hand.py → marketing/promo/letter_hand_1.jpg
"""
import math, os, random, sys
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_posts import P, W, H, K, canvas, font, text_c, up, frame, footer  # noqa: E402
from day_art import grad, light, shade, noise, bayer, planks  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROMO = os.path.join(ROOT, "marketing", "promo")
ART_H = 206


def paper_tex(im, box, base, seed):
    """papír: základ, světlo zleva shora (dither do bone/sand), vlákna a skvrny"""
    d = ImageDraw.Draw(im)
    rnd = random.Random(seed)
    x0, y0, x1, y1 = box
    for y in range(y0, y1):
        for x in range(x0, x1):
            k = ((x - x0) / (x1 - x0) * 0.55 + (y - y0) / (y1 - y0) * 0.45)
            c = base
            if k > 0.45 + 0.35 * bayer(x, y):
                c = P["bone"]
            if k > 0.8 + 0.2 * bayer(x + 1, y):
                c = P["sand"]
            d.point((x, y), fill=c)
    for _ in range(int((x1 - x0) * (y1 - y0) * 0.012)):
        d.point((rnd.randrange(x0, x1), rnd.randrange(y0, y1)), fill=P["bone"])
    for _ in range(5):  # skvrny od vody a bláta
        cx, cy, r = rnd.randrange(x0, x1), rnd.randrange(y0, y1), rnd.randrange(3, 8)
        for yy in range(cy - r, cy + r):
            for xx in range(cx - r, cx + r):
                if x0 <= xx < x1 and y0 <= yy < y1 and math.hypot(xx - cx, yy - cy) < r and bayer(xx, yy) < 0.3:
                    d.point((xx, yy), fill=P["sand"])
    d.line((x0, y0, x1 - 1, y0), fill=P["white"])
    d.line((x0, y0, x0, y1 - 1), fill=P["white"])
    d.line((x0, y1 - 1, x1 - 1, y1 - 1), fill=P["mud3"])
    d.line((x1 - 1, y0, x1 - 1, y1 - 1), fill=P["mud3"])


def seal(d, cx, cy, r=8):
    for yy in range(-r, r + 1):
        for xx in range(-r - 1, r + 2):
            dist = math.hypot(xx, yy * 1.05)
            if dist <= r + (1 if (xx + yy) % 5 == 0 else 0):
                c = P["blood"]
                if dist > r - 2:
                    c = P["rust"] if (xx - yy) > 0 else P["mud2"]
                d.point((cx + xx, cy + yy), fill=c)
    # vyražená hvězda a odlesk
    for dx, dy in ((0, -4), (0, -3), (-1, -1), (0, -1), (1, -1), (-3, -1), (3, -1), (-2, 1), (2, 1), (-2, 3), (2, 3), (0, 1), (0, 0)):
        d.point((cx + dx, cy + dy), fill=P["rust"])
    d.point((cx - 5, cy - 4), fill=P["fire"])
    d.point((cx - 4, cy - 5), fill=P["fire"])
    d.point((cx - 3, cy - 5), fill=P["gold"])
    # kapka vosku
    d.point((cx + r - 1, cy + r), fill=P["blood"])
    d.point((cx + r - 1, cy + r + 1), fill=P["blood"])


def front_envelope():
    w, h = 124, 78
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    paper_tex(im, (0, 0, w, h), P["pale"], 3)
    d = ImageDraw.Draw(im)
    # modro-červený okraj „par avion“ nahoře a dole (pruhy)
    for x in range(0, w, 6):
        d.rectangle((x, 0, x + 2, 2), fill=P["blood"])
        d.rectangle((x + 3, 0, x + 5, 2), fill=P["water"])
        d.rectangle((x, h - 3, x + 2, h - 1), fill=P["water"])
        d.rectangle((x + 3, h - 3, x + 5, h - 1), fill=P["blood"])
    # známka (zoubkovaná), v pravém horním rohu
    sx, sy = w - 30, 8
    d.rectangle((sx - 1, sy - 1, sx + 21, sy + 25), fill=P["white"])
    for i in range(sx - 1, sx + 22, 2):
        d.point((i, sy - 1), fill=P["sand"]); d.point((i, sy + 25), fill=P["sand"])
    for j in range(sy - 1, sy + 26, 2):
        d.point((sx - 1, j), fill=P["sand"]); d.point((sx + 21, j), fill=P["sand"])
    d.rectangle((sx + 2, sy + 2, sx + 18, sy + 22), fill=P["olive"])
    d.rectangle((sx + 4, sy + 4, sx + 16, sy + 20), outline=P["gold"])
    d.ellipse((sx + 7, sy + 7, sx + 13, sy + 13), fill=P["gold"])  # slunce
    d.line((sx + 6, sy + 17, sx + 14, sy + 17), fill=P["bone"])
    d.text((sx + 6, sy + 15), "", font=font(8), fill=P["bone"])
    # razítko: kruh s čárami přes známku
    cx, cy, r = sx - 6, sy + 16, 15
    for a in range(0, 360, 3):
        x = cx + int(r * math.cos(math.radians(a)))
        y = cy + int(r * math.sin(math.radians(a)))
        if bayer(x, y) < 0.85:
            d.point((x, y), fill=P["mud1"])
    for a in range(0, 360, 4):
        x = cx + int((r - 5) * math.cos(math.radians(a)))
        y = cy + int((r - 5) * math.sin(math.radians(a)))
        d.point((x, y), fill=P["mud1"])
    d.line((cx - 5, cy, cx + 5, cy), fill=P["mud1"])
    d.line((cx - 4, cy + 3, cx + 4, cy + 3), fill=P["mud1"])
    d.line((cx - 4, cy - 3, cx + 4, cy - 3), fill=P["mud1"])
    for k in range(4):  # vlnovky přes známku
        d.line((sx + 6, sy + 4 + k * 5, sx + 24, sy + 2 + k * 5), fill=P["mud1"])
    # adresa rukou (3 řádky různě dlouhé), pod tím podtržení
    rnd = random.Random(5)
    ink = P["mud0"]
    d.text((10, 26), "TO MY SON", font=font(8, True), fill=ink)
    for i, (y, ln) in enumerate(((42, 52), (50, 40), (58, 30))):
        x = 10
        while x < 10 + ln:
            seg = rnd.randrange(4, 10)
            for k in range(min(seg, 10 + ln - x)):
                d.point((x + k, y + (1 if (k + i) % 3 == 0 else 0)), fill=ink)
            x += seg + 2
    d.line((10, 37, 66, 37), fill=P["mud2"])
    # poštovní „FIELD MAIL“ razítko skrz
    return im


def back_envelope():
    w, h = 108, 70
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    paper_tex(im, (0, 0, w, h), P["bone"], 8)
    d = ImageDraw.Draw(im)
    # klopa (trojúhelník) se stínem pod hranou
    for y in range(0, 40):
        half = int((w / 2) * (1 - y / 40))
        d.line((w // 2 - half, y, w // 2 + half, y), fill=P["pale"] if bayer(y, 3) > 0.15 else P["bone"])
    d.line((0, 0, w // 2, 40), fill=P["sand"])
    d.line((w - 1, 0, w // 2, 40), fill=P["sand"])
    for i in range(1, 4):  # stín pod klopou
        d.line((2 + i, i, w // 2, 40 + i), fill=P["mud3"]) if i == 1 else None
    d.line((0, h - 1, w // 2, 40), fill=P["sand"])
    d.line((w - 1, h - 1, w // 2, 40), fill=P["sand"])
    seal(d, w // 2, 40, 9)
    return im


def rot(im, deg):
    return im.rotate(deg, resample=Image.NEAREST, expand=True)


def shadow_of(im, off=(3, 4)):
    sh = Image.new("RGBA", im.size, (0, 0, 0, 0))
    px, sp = im.load(), sh.load()
    for y in range(im.height):
        for x in range(im.width):
            if px[x, y][3] and bayer(x, y) < 0.75:
                sp[x, y] = P["ink"] + (255,)
    return sh


def paste_shadowed(base, item, x, y):
    base.alpha_composite(shadow_of(item), (x + 3, y + 4))
    base.alpha_composite(item, (x, y))


def string(d, pts, col):
    for a, b in zip(pts, pts[1:]):
        d.line((a, b), fill=col)


def make():
    im = canvas()
    d = ImageDraw.Draw(im)
    # bedna z fošen, tmavá, hřebíky
    planks(im, (0, 0, W, ART_H), seed=9, vertical=False)
    shade(im, (0, 0, W, ART_H), strength=0.7, reverse=True)
    # další dopisy na hromádce vzadu (ledově tmavé, ve stínu)
    back = back_envelope()
    paste_shadowed(im, rot(back, 11), 10, 30)
    old = back_envelope()
    paste_shadowed(im, rot(old, -7), 82, 12)
    # provázek kolem svazku
    d = ImageDraw.Draw(im)
    string(d, [(20, 40), (70, 70), (110, 52), (150, 66)], P["sand"])
    # hlavní dopis vpředu
    front = rot(front_envelope(), -5)
    paste_shadowed(im, front, 46, 88)
    d = ImageDraw.Draw(im)
    # blátivé otisky prstů na rohu a kapky vody
    rnd = random.Random(2)
    for _ in range(26):
        x, y = rnd.randrange(46, 46 + front.width), rnd.randrange(92, 92 + front.height)
        if im.getpixel((x, y))[:3] in (P["pale"], P["bone"], P["white"]):
            d.point((x, y), fill=P["mud2"] if rnd.random() < 0.5 else P["steel"])
    # lucerna vlevo nahoře: světlo na papír
    light(im, 18, 12, 150, strength=0.6, steps=2)
    shade(im, (0, 0, W, ART_H), strength=0.55)
    d = ImageDraw.Draw(im)
    # prach a jiskry ve světle
    for _ in range(40):
        x, y = rnd.randrange(W), rnd.randrange(ART_H)
        if math.hypot(x - 18, y - 12) < 150:
            d.point((x, y), fill=P["gold"] if rnd.random() < 0.4 else P["pale"])
    # texty
    d.rectangle((0, ART_H, W, H), fill=P["dark"])
    d.line((0, ART_H, W, ART_H), fill=P["gold"])
    text_c(d, W // 2, ART_H + 5, "MAIL CALL", font(16, True), P["white"])
    text_c(d, W // 2, ART_H + 26, "A LETTER FOR YOUR SOLDIER.", font(8, True), P["gold"])
    text_c(d, W // 2, ART_H + 40, "LOG IN. OPEN YOUR CARD. SEND IT.", font(8), P["pale"])
    text_c(d, W // 2, ART_H + 51, "MUDANDIRON.WEB.APP", font(8), P["pale"])
    frame(im)
    out = os.path.join(PROMO, "letter_hand_1.jpg")
    up(im, K).convert("RGB").save(out, quality=95, subsampling=0)
    print(out)


if __name__ == "__main__":
    make()
