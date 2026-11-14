"""Grafika pro stránku Patreonu (MUD & IRON, texty v marketing/patreon.md).
Profilové obrázky 512×512 (mřížka 64×64 ×8, Patreon je ořízne do kruhu: důležité věci drž uprostřed),
obrázky úrovní 460×200 (mřížka 230×100 ×2, doporučená velikost Patreonu) a obrázek k uvítacímu příspěvku 1080×1080.
Sprity vojáků jsou ze hry (web/public/assets/soldiers), paleta Trench-24 (make_posts.P).
Použití: python marketing/make_patreon.py  → marketing/promo/patreon/*.jpg
"""
import os
import sys

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_posts import P, font, text_c, sprite, up, sky, mud, wire  # noqa: E402
from day_art import planks, light, shade, lamp, sandbag_wall  # noqa: E402
from make_support import ribbon, mug, crate  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "marketing", "promo", "patreon")


def save(img, name, k):
    os.makedirs(OUT, exist_ok=True)
    out = os.path.join(OUT, name)
    up(img, k).convert("RGB").save(out, quality=95, subsampling=0)
    print(out)


def flare(d, x, y):
    for r, c in ((7, P["fire"]), (4, P["gold"]), (2, P["white"])):
        d.ellipse((x - r, y - r, x + r, y + r), fill=c)


def dog(d, x, y, flip=False):
    """pes ze zákopu (14×10), stojí bokem; x, y = levý horní roh"""
    rows = [
        "..........hh..",
        ".........hHHe.",
        "t........HHHHn",
        ".t.......HHH..",
        "..tBBBBBBBHH..",
        "..BBBBBBBBBH..",
        "..BbBBBBBBB...",
        "..L.L....L.L..",
        "..L.L....L.L..",
        "..k.k....k.k..",
    ]
    col = {"h": P["mud1"], "H": P["fire"], "e": P["ink"], "n": P["ink"], "t": P["fire"], "B": P["fire"],
           "b": P["rust"], "L": P["rust"], "k": P["ink"]}
    for j, r in enumerate(rows):
        for i, ch in enumerate(r if not flip else r[::-1]):
            if ch in col:
                d.point((x + i, y + j), fill=col[ch])


# ---------------- profilové obrázky (64×64 → 512) ----------------
def bust(name, k=3, rows=19):
    """hlava a ramena ze spritu 32×32 zvětšené k×"""
    s = sprite(name)
    bb = s.getbbox()
    s = s.crop((0, bb[1], 32, bb[1] + rows))
    return up(s, k)


def portrait(name, out, glow=True):
    S = 64
    im = Image.new("RGBA", (S, S), P["dark"] + (255,))
    sky(im, 64, glow=glow)
    b = bust(name)
    im.alpha_composite(b, ((S - b.width) // 2, S - b.height))
    d = ImageDraw.Draw(im)
    ribbon(d, 34, 47, scale=0.3, h=3)  # stužka War Bonds na hrudi
    save(im, out, 8)


def duo():
    S = 64
    im = Image.new("RGBA", (S, S), P["dark"] + (255,))
    sky(im, 44)
    d = ImageDraw.Draw(im)
    flare(d, 32, 30)
    mud(im, 40, S)
    d = ImageDraw.Draw(im)
    d.line((0, 40, S, 40), fill=P["mud3"])
    wire(d, 47, 22, 44)
    im.alpha_composite(sprite("hegemony_east.png"), (4, 22))
    im.alpha_composite(sprite("concord_west.png"), (S - 36, 22))
    d = ImageDraw.Draw(im)
    ribbon(d, 19, 56, scale=0.5, h=5)
    save(im, "profile_duo.jpg", 8)


def logo():
    S = 64
    im = Image.new("RGBA", (S, S), P["dark"] + (255,))
    sky(im, 64, glow=True)
    d = ImageDraw.Draw(im)
    text_c(d, 32, 12, "MUD", font(8, True), P["gold"])
    text_c(d, 32, 22, "& IRON", font(8, True), P["white"])
    ribbon(d, 6, 38, scale=1, h=8)
    save(im, "profile_logo.jpg", 8)


# ---------------- obrázky úrovní (230×100 → 460×200, doporučení Patreonu) ----------------
TW, TH = 230, 100
TK = 2


def label(im, text):
    d = ImageDraw.Draw(im)
    d.rectangle((0, TH - 13, TW, TH), fill=P["ink"])
    d.line((0, TH - 13, TW, TH - 13), fill=P["gold"])
    text_c(d, TW // 2, TH - 11, text, font(8, True), P["gold"])


def tier_recruit():
    im = Image.new("RGBA", (TW, TH), P["dark"] + (255,))
    sky(im, 52)
    d = ImageDraw.Draw(im)
    flare(d, 160, 16)
    mud(im, 52, TH)
    d = ImageDraw.Draw(im)
    d.line((0, 52, TW, 52), fill=P["mud3"])
    # řada nováčků obou stran
    for i, n in enumerate(["hegemony_south", "concord_medic_south", "hegemony_machinegunner_south", "concord_south", "hegemony_runner_south"]):
        im.alpha_composite(up(sprite(n + ".png"), 2), (-8 + i * 43, 18))
    label(im, "RECRUIT")
    save(im, "tier_recruit.jpg", TK)


def tier_bonds():
    """3 USD: polní kuchyně, příděly a stužka War Bonds"""
    im = dugout(7)
    lamp(im, 20, 30, top=12)
    im.alpha_composite(up(sprite("hegemony_east.png"), 2), (6, 16))
    im.alpha_composite(up(sprite("concord_cook_south.png"), 2), (86, 16))
    im.alpha_composite(up(sprite("concord_west.png"), 2), (122, 16))
    d = ImageDraw.Draw(im)
    d.rectangle((54, 54, 80, 80), fill=P["ink"])  # kamna s kotlem
    d.rectangle((56, 56, 78, 79), fill=P["mud0"])
    d.rectangle((61, 66, 73, 74), fill=P["fire"])
    d.rectangle((63, 68, 71, 72), fill=P["gold"])
    d.ellipse((50, 46, 84, 58), fill=P["steel"], outline=P["ink"])
    crate(d, 172, 54, 52, 18)
    ribbon(d, 178, 66, scale=0.78, h=4)
    mug(d, 180, 47, 0)
    mug(d, 200, 47, 1)
    light(im, 67, 66, 70, strength=1.0, steps=3, keep=(P["steel"], P["grey"]))
    shade(im, (0, 0, TW, TH), strength=0.6)
    label(im, "WAR BONDS")
    save(im, "tier_war_bonds.jpg", TK)


def tier_mess():
    im = Image.new("RGBA", (TW, TH), P["dark"] + (255,))
    planks(im, (0, 0, TW, TH), seed=11, vertical=True)
    sandbag_wall(im, (0, 0, TW, 12), seed=4)
    d = ImageDraw.Draw(im)
    planks(im, (0, 72, TW, TH), seed=5, vertical=False)
    d = ImageDraw.Draw(im)
    d.line((0, 72, TW, 72), fill=P["ink"])
    lamp(im, 108, 30, top=12)
    d = ImageDraw.Draw(im)
    # stůl s mapou, svíčkou a plecháčky; důstojníci obou stran naproti sobě
    im.alpha_composite(up(sprite("hegemony_officer_east.png"), 2), (22, 16))
    im.alpha_composite(up(sprite("concord_officer_west.png"), 2), (130, 16))
    d = ImageDraw.Draw(im)
    d.rectangle((74, 56, 142, 60), fill=P["mud3"], outline=P["ink"])
    d.rectangle((78, 61, 81, 80), fill=P["mud1"])
    d.rectangle((135, 61, 138, 80), fill=P["mud1"])
    d.rectangle((84, 52, 114, 55), fill=P["pale"])  # mapa
    d.line((88, 53, 110, 54), fill=P["rust"])
    d.point((99, 53), fill=P["ink"])
    d.rectangle((122, 47, 123, 55), fill=P["white"])  # svíčka
    d.point((122, 46), fill=P["gold"])
    mug(d, 127, 49, 0)
    light(im, 122, 48, 60, strength=1.0, steps=3)
    shade(im, (0, 0, TW, TH), strength=0.7)
    d = ImageDraw.Draw(im)
    for cx in (52, 160):  # zlatá hvězda nad důstojníkem, jako ve hře
        star(d, cx, 10)
    label(im, "OFFICERS' MESS")
    save(im, "tier_officers_mess.jpg", TK)


def tier_dog():
    im = Image.new("RGBA", (TW, TH), P["dark"] + (255,))
    sky(im, 40)
    d = ImageDraw.Draw(im)
    flare(d, 40, 14)
    sandbag_wall(im, (0, 36, TW, 50), seed=8)
    planks(im, (0, 50, TW, TH), seed=9, vertical=True)
    d = ImageDraw.Draw(im)
    d.line((0, 50, TW, 50), fill=P["ink"])
    im.alpha_composite(up(sprite("hegemony_east.png"), 2), (30, 18))
    im.alpha_composite(up(sprite("concord_west.png"), 2), (122, 18))
    pets = Image.new("RGBA", (40, 12), (0, 0, 0, 0))
    dp = ImageDraw.Draw(pets)
    dog(dp, 2, 1)
    dog(dp, 22, 1, flip=True)
    im.alpha_composite(up(pets, 2), (68, 58))
    shade(im, (0, 0, TW, TH), strength=0.5)
    label(im, "TRENCH DOG")
    save(im, "tier_trench_dog.jpg", TK)


# ---------------- uvítací příspěvek (216×216 → 1080) ----------------
def star(d, cx, cy, r=5):
    import math
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        rr = r if i % 2 == 0 else r * 0.45
        pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
    d.polygon([(x + 1, y + 1) for x, y in pts], fill=P["ink"])
    d.polygon(pts, fill=P["gold"])


def dugout(seed=7):
    """kryt z fošen s podlahou (230×100), společné pozadí úrovní"""
    im = Image.new("RGBA", (TW, TH), P["dark"] + (255,))
    planks(im, (0, 0, TW, TH), seed=seed, vertical=True)
    sandbag_wall(im, (0, 0, TW, 12), seed=seed + 1)
    planks(im, (0, 72, TW, TH), seed=seed + 2, vertical=False)
    d = ImageDraw.Draw(im)
    d.line((0, 72, TW, 72), fill=P["ink"])
    return im


def tier_tea():
    """1 USD: plecháček čaje pro frontu (jen podpora)"""
    im = dugout(21)
    lamp(im, 40, 30, top=12)
    im.alpha_composite(up(sprite("hegemony_cook_east.png"), 2), (50, 16))
    im.alpha_composite(up(sprite("concord_west.png"), 2), (100, 16))
    d = ImageDraw.Draw(im)
    crate(d, 156, 54, 52, 18)
    for i in range(4):
        mug(d, 161 + i * 11, 47, i)
    light(im, 110, 50, 70, strength=0.9, steps=2)
    shade(im, (0, 0, TW, TH), strength=0.6)
    label(im, "TIN OF TEA")
    save(im, "tier_tin_of_tea.jpg", TK)


def tier_post():
    """5 USD: polní pošta (videa a novinky dřív)"""
    im = dugout(31)
    lamp(im, 170, 30, top=12)
    im.alpha_composite(up(sprite("hegemony_runner_east.png"), 2), (40, 16))
    im.alpha_composite(up(sprite("concord_signaller_west.png"), 2), (128, 16))
    d = ImageDraw.Draw(im)
    # stůl s dopisy a pytel s poštou
    d.rectangle((82, 58, 130, 61), fill=P["mud3"], outline=P["ink"])
    d.rectangle((86, 62, 88, 80), fill=P["mud1"])
    d.rectangle((124, 62, 126, 80), fill=P["mud1"])
    for i, (x, y) in enumerate(((88, 54), (97, 55), (106, 53), (115, 55))):
        d.rectangle((x, y, x + 7, y + 4), fill=P["white"] if i % 2 else P["pale"], outline=P["sand"])
        d.line((x, y, x + 3, y + 2), fill=P["sand"])
        d.line((x + 7, y, x + 4, y + 2), fill=P["sand"])
    d.rectangle((110, 52, 112, 53), fill=P["rust"])  # pečeť
    d.ellipse((24, 60, 44, 82), fill=P["khaki"], outline=P["ink"])  # pytel s poštou
    d.rectangle((30, 57, 38, 61), fill=P["olive"], outline=P["ink"])
    d.rectangle((28, 70, 40, 74), fill=P["pale"])
    light(im, 170, 34, 70, strength=0.9, steps=2)
    shade(im, (0, 0, TW, TH), strength=0.6)
    label(im, "FIELD POST")
    save(im, "tier_field_post.jpg", TK)


def thanks():
    S = 216
    im = Image.new("RGBA", (S, S), P["dark"] + (255,))
    sky(im, 120)
    d = ImageDraw.Draw(im)
    flare(d, 160, 30)
    mud(im, 120, S)
    d = ImageDraw.Draw(im)
    d.line((0, 120, S, 120), fill=P["mud3"])
    wire(d, 132, 0, S)
    im.alpha_composite(up(sprite("hegemony_officer_east.png"), 2), (40, 70))
    im.alpha_composite(up(sprite("concord_east.png"), 2), (112, 70))
    d = ImageDraw.Draw(im)
    d.rectangle((0, 160, S, S), fill=P["ink"])
    d.line((0, 160, S, 160), fill=P["gold"])
    text_c(d, S // 2, 168, "THANK YOU, SOLDIER", font(16, True), P["gold"])
    ribbon(d, S // 2 - 26, 190, scale=1, h=8)
    text_c(d, S // 2, 202, "THE FRONT REMEMBERS WHO KEPT IT FED", font(8), P["pale"])
    d.rectangle((0, 0, S, 22), fill=P["ink"])
    text_c(d, S // 2, 6, "MUD & IRON", font(8, True), P["white"])
    save(im, "post_thank_you.jpg", 5)


def post_launch():
    """oznámení Patreonu 1080×1350 (mřížka 216×270): důstojníci se hvězdou nahoře, dole tři úrovně"""
    W, H = 216, 270
    im = Image.new("RGBA", (W, H), P["dark"] + (255,))
    planks(im, (0, 0, W, 132), seed=11, vertical=True)
    sandbag_wall(im, (0, 0, W, 12), seed=4)
    planks(im, (0, 112, W, 132), seed=5, vertical=False)
    d = ImageDraw.Draw(im)
    d.line((0, 112, W, 112), fill=P["ink"])
    lamp(im, 108, 50, top=12)
    im.alpha_composite(up(sprite("hegemony_officer_east.png"), 2), (20, 52))
    im.alpha_composite(up(sprite("concord_officer_west.png"), 2), (132, 52))
    d = ImageDraw.Draw(im)
    d.rectangle((72, 92, 144, 96), fill=P["mud3"], outline=P["ink"])
    d.rectangle((76, 97, 79, 116), fill=P["mud1"])
    d.rectangle((137, 97, 140, 116), fill=P["mud1"])
    d.rectangle((82, 88, 112, 91), fill=P["pale"])
    d.line((86, 89, 108, 90), fill=P["rust"])
    d.rectangle((120, 83, 121, 91), fill=P["white"])
    d.point((120, 82), fill=P["gold"])
    mug(d, 126, 85, 0)
    light(im, 120, 84, 70, strength=1.0, steps=3)
    shade(im, (0, 0, W, 132), strength=0.6)
    d = ImageDraw.Draw(im)
    star(d, 50, 46)
    star(d, 164, 46)
    # titulek
    d.rectangle((0, 14, W, 40), fill=P["ink"])
    text_c(d, W // 2, 16, "THE FRONT HAS A", font(8, True), P["white"])
    text_c(d, W // 2, 27, "SUPPLY LINE", font(8, True), P["gold"])
    # tři úrovně
    d.rectangle((0, 132, W, H), fill=P["dark"])
    d.line((0, 132, W, 132), fill=P["gold"])
    text_c(d, W // 2, 137, "SUPPORT MUD & IRON ON PATREON", font(8, True), P["white"])
    rows = [("$3", "WAR BONDS", "A RIBBON FOR YOUR SOLDIER"),
            ("$5", "FIELD POST", "BEHIND THE SCENES, WHAT'S NEXT"),
            ("$10", "OFFICERS' MESS", "A GOLD STAR OVER YOUR SOLDIER")]
    for i, (price, name, what) in enumerate(rows):
        y = 152 + i * 28
        d.rectangle((8, y, W - 9, y + 23), fill=P["mud0"], outline=P["mud2"])
        # ikona
        if i == 0:
            ribbon(d, 14, y + 8, scale=0.4, h=7)
        elif i == 1:
            d.rectangle((16, y + 6, 29, y + 15), fill=P["white"], outline=P["sand"])
            d.line((16, y + 6, 22, y + 11), fill=P["sand"])
            d.line((29, y + 6, 23, y + 11), fill=P["sand"])
            d.rectangle((22, y + 11, 23, y + 12), fill=P["rust"])
        else:
            star(d, 22, y + 11, r=6)
        d.text((40, y + 3), price, font=font(8, True), fill=P["gold"])
        d.text((70, y + 3), name, font=font(8, True), fill=P["white"])
        d.text((40, y + 13), what, font=font(8), fill=P["pale"])
    text_c(d, W // 2, 238, "FREE GAME. NO ADS. NO PAY-TO-WIN.", font(8), P["pale"])
    text_c(d, W // 2, 250, "PATREON.COM/CW/MUDANDIRON", font(8, True), P["gold"])
    save(im, "post_patreon_launch.jpg", 5)


def post_launch_wide():
    """oznámení Patreonu 1500×900 (mřížka 300×180 ×5): vlevo důstojníci se hvězdou, vpravo tři úrovně"""
    W, H = 300, 180
    im = Image.new("RGBA", (W, H), P["dark"] + (255,))
    SW = 120  # šířka scény
    planks(im, (0, 0, SW, H), seed=11, vertical=True)
    sandbag_wall(im, (0, 0, SW, 12), seed=4)
    planks(im, (0, 150, SW, H), seed=5, vertical=False)
    d = ImageDraw.Draw(im)
    d.line((0, 150, SW, 150), fill=P["ink"])
    lamp(im, 66, 70, top=12)
    im.alpha_composite(up(sprite("hegemony_officer_east.png"), 2), (-8, 90))
    im.alpha_composite(up(sprite("concord_officer_west.png"), 2), (66, 90))
    d = ImageDraw.Draw(im)
    d.rectangle((34, 130, 86, 134), fill=P["mud3"], outline=P["ink"])
    d.rectangle((38, 135, 41, 154), fill=P["mud1"])
    d.rectangle((79, 135, 82, 154), fill=P["mud1"])
    d.rectangle((40, 126, 62, 129), fill=P["pale"])
    d.line((43, 127, 59, 128), fill=P["rust"])
    d.rectangle((68, 121, 69, 129), fill=P["white"])
    d.point((68, 120), fill=P["gold"])
    mug(d, 72, 123, 0)
    light(im, 68, 122, 70, strength=1.0, steps=3)
    shade(im, (0, 0, SW, H), strength=0.6)
    d = ImageDraw.Draw(im)
    star(d, 22, 84)
    star(d, 98, 84)
    d.rectangle((0, 18, SW, 50), fill=P["ink"])
    text_c(d, SW // 2, 21, "THE FRONT", font(8, True), P["white"])
    text_c(d, SW // 2, 30, "HAS A", font(8, True), P["white"])
    text_c(d, SW // 2, 39, "SUPPLY LINE", font(8, True), P["gold"])
    # pravý sloupec
    d.line((SW, 0, SW, H), fill=P["gold"])
    X0 = SW + 8
    d.text((X0, 12), "SUPPORT MUD & IRON", font=font(8, True), fill=P["white"])
    d.text((X0, 22), "ON PATREON", font=font(8, True), fill=P["gold"])
    rows = [("$3", "WAR BONDS", "RIBBON FOR YOUR SOLDIER"),
            ("$5", "FIELD POST", "BEHIND THE SCENES"),
            ("$10", "OFFICERS' MESS", "STAR OVER YOUR SOLDIER")]
    for i, (price, name, what) in enumerate(rows):
        y = 40 + i * 30
        d.rectangle((X0, y, W - 8, y + 25), fill=P["mud0"], outline=P["mud2"])
        if i == 0:
            ribbon(d, X0 + 5, y + 9, scale=0.36, h=7)
        elif i == 1:
            d.rectangle((X0 + 7, y + 7, X0 + 20, y + 16), fill=P["white"], outline=P["sand"])
            d.line((X0 + 7, y + 7, X0 + 13, y + 12), fill=P["sand"])
            d.line((X0 + 20, y + 7, X0 + 14, y + 12), fill=P["sand"])
            d.rectangle((X0 + 13, y + 12, X0 + 14, y + 13), fill=P["rust"])
        else:
            star(d, X0 + 13, y + 12, r=6)
        d.text((X0 + 28, y + 4), price, font=font(8, True), fill=P["gold"])
        d.text((X0 + 54, y + 4), name, font=font(8, True), fill=P["white"])
        d.text((X0 + 28, y + 14), what, font=font(8), fill=P["pale"])
    d.text((X0, 136), "FREE GAME. NO ADS.", font=font(8), fill=P["pale"])
    d.text((X0, 146), "NO PAY-TO-WIN.", font=font(8), fill=P["pale"])
    d.text((X0, 160), "PATREON.COM/CW/MUDANDIRON", font=font(8, True), fill=P["gold"])
    save(im, "post_patreon_1500x900.jpg", 5)


if __name__ == "__main__":
    portrait("hegemony_south.png", "profile_hegemony.jpg")
    portrait("concord_south.png", "profile_concord.jpg")
    portrait("hegemony_officer_south.png", "profile_officer.jpg", glow=False)
    duo()
    logo()
    tier_recruit()
    tier_tea()
    tier_post()
    tier_bonds()
    tier_mess()
    tier_dog()
    thanks()
    post_launch()
    post_launch_wide()
