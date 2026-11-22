"""Patreon post „You decide what comes next“ (22. 11. 2026): patroni navrhují v komentářích další odměnu.
Obrázek je jen filmová ilustrace války bez textu (uživatel 22. 11.), v měřítku herních spritů (1 px scény = 1 px spritu):
obloha a obzor z herní malby (props/mood.png), světlice, země nikoho s drátem a krátery, první sníh;
v popředí val z pytlů (vzor ze hry) a za ním vojáci Hegemonie ze hry, na valu sedí pes (sprite ze hry, stejné měřítko).
Mřížka 192×108 ×10 = 1920×1080. Použití: python marketing/make_patreon_ask.py → marketing/promo/patreon/post_ask_1920x1080.jpg
"""
import math
import os
import sys

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_posts import ROOT  # noqa: E402
from victory_scene import PAL, PROPS, h2, fbm, dither, sandbag, spr, fire_frame  # noqa: E402

W, H = 192, 108
OUT = os.path.join(ROOT, "marketing", "promo", "patreon", "post_ask_1920x1080.jpg")
HZ = 50          # obzor (spodek výřezu malby)
PAR = 92         # horní hrana valu (pod ní necelé 3 řady pytlů)


def backdrop(im):
    mood = Image.open(os.path.join(PROPS, "mood.png")).convert("RGBA")
    im.alpha_composite(mood.crop((32, 0, 32 + W, 52)), (0, -2))


def no_mans_land(im):
    px = im.load()
    for y in range(HZ, PAR):
        k = (y - HZ) / (PAR - HZ)
        for x in range(W):
            v = fbm(x / (22 - 10 * k), y / (7 - 3 * k), 71)
            c0, c1 = (PAL[1], PAL[2]) if v < 0.45 else (PAL[2], PAL[3])
            dither(px, x, y, c0, c1, (v - (0 if v < 0.45 else 0.45)) / 0.55 if v >= 0.45 else v / 0.45)
            s = fbm(x / 14, y / 5, 72)                     # první sníh: jen tenké světlé poprašky
            if s > 0.72 and h2(x, y, 73) < 0.55:
                px[x, y] = (PAL[7] if s > 0.78 else PAL[6]) + (255,)
    d = ImageDraw.Draw(im)
    for cx, cy, r in ((26, 60, 8), (150, 56, 6), (112, 64, 7)):   # krátery
        for y in range(cy - r // 2, cy + r // 2 + 1):
            for x in range(cx - r, cx + r + 1):
                dd = math.hypot((x - cx) / r, (y - cy) / (r / 2))
                if dd <= 1 and 0 <= x < W:
                    px[x, y] = (PAL[17] if dd < 0.5 else PAL[1] if y > cy else PAL[5]) + (255,)
    # drát z boku: kůly s křížem a tři prověšené prameny s ostny
    def fence(y0, x0, x1, step, hgt, col):
        posts = list(range(x0, x1 + 1, step))
        for x in posts:
            d.line((x, y0 - hgt, x, y0), fill=col)
            d.point((x - 1, y0 - hgt + 1), fill=col); d.point((x + 1, y0 - hgt + 2), fill=col)
        for k in range(3):
            yy = y0 - hgt + 1 + k * (hgt // 3)
            for x in range(x0, x1):
                q = ((x - x0) % step) / step
                y = yy + round(math.sin(q * math.pi) * (1 + k * 0.5))
                if not 0 <= x < W:
                    continue
                if h2(x, k, 31) > 0.12:
                    px[x, y] = col + (255,)
                if x % 4 == 0:
                    px[x, y - 1] = col + (255,)
    fence(64, -4, W + 4, 17, 8, PAL[1])


def flare(im):
    """světlice nad zemí nikoho: bílý bod, záře a nasvícení"""
    fx, fy = 140, 12
    px = im.load()
    for y in range(0, PAR):
        for x in range(W):
            dd = math.hypot(x - fx, (y - fy) * 1.2)
            t = max(0.0, 1 - dd / 80) ** 1.6 * 0.55
            if t > 0:
                r, g, b, a = px[x, y]
                px[x, y] = (min(255, int(r + (230 - r) * t)), min(255, int(g + (220 - g) * t)), min(255, int(b + (170 - b) * t)), 255)
    d = ImageDraw.Draw(im)
    d.line((fx, fy - 9, fx - 2, fy - 2), fill=PAL[6])     # kouřová stopa
    d.rectangle((fx - 1, fy - 1, fx + 1, fy + 1), fill=(255, 250, 220))
    for dx, dy in ((0, -2), (0, 2), (-2, 0), (2, 0)):
        d.point((fx + dx, fy + dy), fill=PAL[23])


def parapet(im):
    px = im.load()
    for y in range(PAR, H):
        for x in range(W):
            i = sandbag(x, y - PAR)
            if i > 2 and y - PAR > 9:
                i -= 2
            c = PAL[i]
            if (y - PAR) % 5 == 0 and i >= 7 and h2(x, y, 9) < 0.7:  # sníh na pytlích
                c = PAL[9]
            px[x, y] = c + (255,)
    ImageDraw.Draw(im).line((0, PAR - 1, W, PAR - 1), fill=PAL[0])


def soldiers(im):
    # za valem; val kryje nohy (pata spritu ~ řádek 30 → PAR+7)
    row = PAR - 19
    dog = Image.open(os.path.join(PROPS, "dog_shepherd_sit.png")).convert("RGBA")
    smoke = sorted(f for f in os.listdir(os.path.join(ROOT, "web/public/assets/soldiers")) if f.startswith("hegemony@smoke_south_"))
    cast = [  # (sprite, střed x, kolik px postavy je nad valem) – zarovnané podle skutečného obrysu spritu
        (spr("aim_hegemony_south.png"), 10, 16),
        (fire_frame("hegemony@fire_south"), 40, 21),
        (spr("hegemony_officer_south.png"), 72, 22),
        (dog, 96, 18),                                     # pes ZA valem (uživatel 22. 11.): nad pytle hlava a hruď
        (spr(smoke[3]), 124, 20),
        (fire_frame("hegemony_machinegunner@fire_south"), 158, 21),
        (spr("aim_hegemony_south.png"), 186, 16),
    ]
    lay = Image.new("RGBA", (W, H))
    for img, cx, up_ in cast:
        l, t, r, b = img.getbbox()
        lay.alpha_composite(img, (round(cx - (l + r) / 2), PAR - up_ - t))
    lay = lay.crop((0, 0, W, PAR))                         # nic pod horní hranou valu
    im.alpha_composite(lay, (0, 0))


def snowfall(im):
    px = im.load()
    for k in range(90):
        x, y = int(h2(k, 1, 81) * W), int(h2(k, 2, 82) * H)
        a = 0.35 + 0.35 * h2(k, 3, 83)
        r, g, b, _ = px[x, y]
        px[x, y] = (int(r + (235 - r) * a), int(g + (232 - g) * a), int(b + (225 - b) * a), 255)


def vignette(im):
    px = im.load()
    for y in range(H):
        for x in range(W):
            dd = math.hypot((x - W / 2) / (W / 2), (y - H / 2) / (H / 2))
            t = max(0, dd - 0.75) * 0.9
            if t > 0:
                r, g, b, a = px[x, y]
                px[x, y] = (int(r * (1 - t)), int(g * (1 - t)), int(b * (1 - t)), 255)


def main():
    im = Image.new("RGBA", (W, H), PAL[1] + (255,))
    backdrop(im)
    no_mans_land(im)
    flare(im)
    parapet(im)
    soldiers(im)
    snowfall(im)
    vignette(im)
    im.convert("RGB").resize((W * 10, H * 10), Image.NEAREST).save(OUT, quality=95, subsampling=0)
    print(OUT)


if __name__ == "__main__":
    main()
