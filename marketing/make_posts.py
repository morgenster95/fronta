"""Promo grafika pro Instagram (Mud & Iron): profilovka a posty 4:5.

Vše se kreslí v malém pixelovém rozlišení (paleta Trench 24, písmo Silkscreen v násobcích 8 px)
a teprve nakonec se celočíselně zvětší, takže pixely zůstanou ostré.
Použití: python marketing/make_posts.py   (z kořene repa)
"""
import os
import random

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOLD = os.path.join(ROOT, "web", "public", "assets", "soldiers")
OUT = os.path.join(ROOT, "marketing", "posts")
FONTS = os.path.join(ROOT, "marketing", "fonts")
os.makedirs(OUT, exist_ok=True)

P = {k: tuple(int(v[i:i + 2], 16) for i in (0, 2, 4)) for k, v in {
    "ink": "0e0d0c", "dark": "1c1a17", "mud0": "2b2722", "mud1": "3d3730", "mud2": "524a3f", "mud3": "6b6152",
    "sand": "857a68", "bone": "a39782", "pale": "c4b8a0", "white": "e3d9c3", "grey": "8a9295", "steel": "666d70",
    "khaki": "8c8a5c", "olive": "6f7148", "rust": "7e3b2a", "blood": "5c2a22", "fire": "a85a36", "gold": "d98f3f",
    "yellow": "c9c26a", "water": "2a3138",
}.items()}
HEG, CON = P["grey"], P["yellow"]


def font(size=8, bold=False):
    return ImageFont.truetype(os.path.join(FONTS, "Silkscreen-Bold.ttf" if bold else "Silkscreen-Regular.ttf"), size)


def vt(size=16):
    return ImageFont.truetype(os.path.join(FONTS, "VT323-Regular.ttf"), size)


def sprite(name):
    return Image.open(os.path.join(SOLD, name)).convert("RGBA")


def up(im, k):
    return im.resize((im.width * k, im.height * k), Image.NEAREST)


def text_c(d, cx, y, s, f, fill, shadow=P["ink"]):
    w = d.textlength(s, font=f)
    x = int(cx - w / 2)
    if shadow:
        d.text((x + 1, y + 1), s, font=f, fill=shadow)
    d.text((x, y), s, font=f, fill=fill)


def title_amp(d, cx, y, size, fill):
    """MUD & IRON: ampersand písmem VT323 (Silkscreen ho kreslí jako €)."""
    f, fa = font(size, True), vt(int(size * 1.5))
    parts = [("MUD ", f), ("&", fa), (" IRON", f)]
    w = sum(d.textlength(t, font=ff) for t, ff in parts)
    x = cx - w / 2
    for t, ff in parts:
        dy = -int(size * 0.3) if ff is fa else 0
        d.text((x + 1, y + 1 + dy), t, font=ff, fill=P["ink"])
        d.text((x, y + dy), t, font=ff, fill=fill)
        x += d.textlength(t, font=ff)


def mud(im, y0, y1, seed=1):
    rnd = random.Random(seed)
    px = im.load()
    for y in range(y0, y1):
        for x in range(im.width):
            v = rnd.random() * 0.4 + ((x // 6 + y // 4 + (x * 7 + y * 3) % 5) % 4) * 0.15
            px[x, y] = (P["mud0"], P["mud1"], P["mud1"], P["mud2"], P["mud3"])[min(4, int(v * 5))] + (255,)


def sky(im, y1, glow=True):
    d = ImageDraw.Draw(im)
    cols = [P["ink"], P["dark"], P["mud0"], P["blood"], P["rust"]] if glow else [P["ink"], P["dark"], P["mud0"]]
    for y in range(y1):
        k = y / max(1, y1 - 1)
        # pásy s ditheringem na přechodech
        i = k * (len(cols) - 1)
        a, b = int(i), min(len(cols) - 1, int(i) + 1)
        frac = i - a
        for x in range(im.width):
            c = cols[b] if frac > 0.85 or (frac > 0.6 and (x + y) % 2 == 0) else cols[a]
            d.point((x, y), fill=c)


def wire(d, y, x0, x1):
    for x in range(x0, x1, 9):
        d.line((x, y - 5, x + 4, y + 2), fill=P["mud3"])
        d.line((x + 4, y - 5, x, y + 2), fill=P["mud2"])
    for x in range(x0, x1):
        d.point((x, y - 2 + (x % 6 > 2)), fill=P["ink"])
        if x % 3 == 0:
            d.point((x, y - 3 + (x % 5 > 2)), fill=P["steel"])


# ---------------- profilovka 1080×1080 ----------------
def profile():
    S = 64
    im = Image.new("RGBA", (S, S), P["dark"] + (255,))
    sky(im, 44)
    d = ImageDraw.Draw(im)
    # záblesk na obzoru
    for r, c in ((7, P["fire"]), (4, P["gold"]), (2, P["white"])):
        d.ellipse((32 - r, 36 - r, 32 + r, 36 + r), fill=c)
    mud(im, 40, S)
    d.rectangle((0, 40, S, 40), fill=P["mud3"])
    wire(d, 47, 22, 44)
    h = sprite("hegemony_east.png")
    c = sprite("concord_west.png")
    im.alpha_composite(h, (2, 54 - 30 - 1 + 0))
    im.alpha_composite(c, (S - 34, 54 - 30 - 1))
    big = up(im, 16)  # 1024
    out = Image.new("RGBA", (1080, 1080), P["dark"] + (255,))
    out.alpha_composite(big, (28, 28))
    out.convert("RGB").save(os.path.join(OUT, "00_profile_1080.png"))


# ---------------- posty 4:5 (216×270 → ×5 = 1080×1350) ----------------
W, H, K = 216, 270, 5


def canvas():
    return Image.new("RGBA", (W, H), P["dark"] + (255,))


def frame(im):
    d = ImageDraw.Draw(im)
    d.rectangle((2, 2, W - 3, H - 3), outline=P["mud2"])
    return d


def footer(d, y=H - 18):
    text_c(d, W // 2, y, "@MUDANDIRON", font(8, True), P["gold"])


def post_war():
    im = canvas()
    mood = Image.open(os.path.join(ROOT, "art", "pixellab", "test01", "mood_front_256x144.png")).convert("RGBA")
    im.alpha_composite(mood.crop((20, 0, 20 + W, 144)), (0, 60))
    d = frame(im)
    title_amp(d, W // 2, 14, 16, P["white"])
    text_c(d, W // 2, 38, "AN INSTAGRAM WAR", font(8), P["bone"])
    text_c(d, W // 2, 214, "THE GREAT WAR ENDED.", font(8, True), P["white"])
    text_c(d, W // 2, 228, "HERE, IT NEVER DID.", font(8, True), P["gold"])
    footer(d)
    up(im, K).convert("RGB").save(os.path.join(OUT, "01_the_war_never_ended.png"))


def post_sides():
    im = canvas()
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, W // 2 - 1, H), fill=P["water"])
    d.rectangle((W // 2, 0, W, H), fill=P["mud0"])
    mud(im, 196, 220, 3)
    d.line((W // 2, 0, W // 2, H), fill=P["ink"], width=2)
    text_c(d, W // 2, 12, "CHOOSE YOUR SIDE", font(16, True), P["white"])
    for i, (nm, spr, col, kw, line1, line2) in enumerate((
        ("THE HEGEMONY", "hegemony_south.png", HEG, "HEGEMONY", "IRON", "ENDURES."),
        ("THE CONCORD", "concord_south.png", CON, "CONCORD", "TOGETHER, OR", "NOT AT ALL."),
    )):
        cx = W // 4 + i * W // 2
        s = up(sprite(spr), 3)
        im.alpha_composite(s, (cx - 48, 214 - 93))
        text_c(d, cx, 44, nm, font(8, True), col)
        text_c(d, cx, 60, line1, font(8), P["pale"])
        text_c(d, cx, 72, line2, font(8), P["pale"])
        d.rectangle((cx - 42, 226, cx + 42, 242), fill=P["rust"])
        text_c(d, cx, 230, kw, font(8, True), P["white"])
    text_c(d, W // 2, 252, "COMMENT YOUR SIDE  @MUDANDIRON", font(8), P["gold"])
    frame(im)
    up(im, K).convert("RGB").save(os.path.join(OUT, "02_choose_your_side.png"))


def post_howto():
    im = canvas()
    sky(im, 60, glow=False)
    d = frame(im)
    text_c(d, W // 2, 14, "HOW TO ENLIST", font(16, True), P["white"])
    steps = [
        ("1", "FOLLOW", "@MUDANDIRON", "hegemony_officer_south.png"),
        ("2", "COMMENT", "CONCORD / HEGEMONY", "concord_south.png"),
        ("3", "FIND YOURSELF", "ON THE FRONT", "hegemony_medic_south.png"),
    ]
    for i, (n, a, b, spr) in enumerate(steps):
        y = 52 + i * 62
        d.rectangle((14, y, W - 15, y + 52), fill=P["mud0"], outline=P["mud2"])
        im.alpha_composite(sprite(spr), (20, y + 12))
        text_c(d, 70, y + 8, n, font(24, True), P["gold"])
        d.text((90, y + 12), a, font=font(8, True), fill=P["white"])
        d.text((90, y + 28), b, font=font(8), fill=P["bone"])
    text_c(d, W // 2, 242, "LINK IN BIO: MUDANDIRON.WEB.APP", font(8), P["pale"])
    footer(d)
    up(im, K).convert("RGB").save(os.path.join(OUT, "03_how_to_enlist.png"))


def post_poster(art_path, name, band, head, sub, kw):
    im = canvas()
    art = Image.open(art_path).convert("RGBA")
    im.alpha_composite(art, ((W - art.width) // 2, 0))
    d = ImageDraw.Draw(im)
    y = art.height
    d.rectangle((0, y, W, H), fill=P["dark"])
    text_c(d, W // 2, y + 3, head, font(16, True), P["white"])
    text_c(d, W // 2, y + 22, sub, font(8), P["pale"])
    d.rectangle((8, H - 26, W - 9, H - 9), fill=band)
    text_c(d, W // 2, H - 22, f"COMMENT {kw} @MUDANDIRON", font(8, True), P["white"])
    frame(im)
    up(im, K).convert("RGB").save(os.path.join(OUT, name))


if __name__ == "__main__":
    profile()
    post_war()
    post_sides()
    post_howto()
    art = os.path.join(ROOT, "art", "pixellab", "poster", "poster_176x208.png")
    if os.path.exists(art):
        post_poster(art, "04_enlist_poster.png", P["rust"], "YOUR FRONT", "NEEDS YOU. EVERY FOLLOWER IS A SOLDIER.", "YOUR SIDE")
        post_poster(art, "05_enlist_hegemony.png", P["water"], "IRON ENDURES", "THE EMPIRE NEEDS YOU", "HEGEMONY")
        post_poster(art, "06_enlist_concord.png", P["olive"], "STAND TOGETHER", "THE ALLIANCE NEEDS YOU", "CONCORD")
    print("hotovo:", sorted(os.listdir(OUT)))
