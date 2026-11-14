"""Grafika pro stránku Patreonu (MUD & IRON, texty v marketing/patreon.md).
Profilové obrázky 512×512 (mřížka 64×64 ×8, Patreon je ořízne do kruhu: důležité věci drž uprostřed),
obrázky úrovní 1080×470 (mřížka 216×94 ×5) a obrázek k uvítacímu příspěvku 1080×1080.
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


# ---------------- obrázky úrovní (216×94 → 1080×470) ----------------
TW, TH = 216, 94


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
    save(im, "tier_recruit.jpg", 5)


def tier_bonds():
    import make_support
    make_support.make()  # nakreslí i promo/patreon_tier.jpg (kuchyně, sprity ×2)
    im = Image.open(os.path.join(ROOT, "marketing", "promo", "patreon_tier.jpg")).convert("RGBA")
    im = im.resize((TW, TH), Image.NEAREST)
    label(im, "WAR BONDS")
    save(im, "tier_war_bonds.jpg", 5)


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
    label(im, "OFFICERS' MESS")
    save(im, "tier_officers_mess.jpg", 5)


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
    save(im, "tier_trench_dog.jpg", 5)


# ---------------- uvítací příspěvek (216×216 → 1080) ----------------
def dugout(seed=7):
    """kryt z fošen s podlahou (216×94), společné pozadí úrovní"""
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
    save(im, "tier_tin_of_tea.jpg", 5)


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
    save(im, "tier_field_post.jpg", 5)


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
