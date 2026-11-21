"""Patreon post „The front has a supply line“ v2 (21. 11. 2026): nové ceny 4/6/10 $ a Trench Dog.
Obrázky 1500×900 (mřížka 300×180 ×5): post_tiers_v2 (úrovně s ikonami), post_dogs (pět plemen se jmény).
Psi: web/public/assets/props/dog_<plemeno>_sit.png (PixelLab). Použití: python marketing/make_patreon_dog.py
"""
import os
import sys
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_posts import P, font, text_c, sprite, up  # noqa: E402
from day_art import planks, light, shade, lamp, sandbag_wall  # noqa: E402
from make_support import ribbon, mug  # noqa: E402
from make_patreon import star, OUT  # noqa: E402


def save(img, name, k=6):
    """Patreon: 1920×1080 (16:9), mřížka 300×180 ×6 = 1800×1080 uprostřed tmavého plátna"""
    big = up(img, k).convert("RGB")
    canvas = Image.new("RGB", (1920, 1080), P["dark"])
    canvas.paste(big, ((1920 - big.width) // 2, (1080 - big.height) // 2))
    out = os.path.join(OUT, name.replace("_1500x900", "_1920x1080"))
    canvas.save(out, quality=95, subsampling=0)
    print(out)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOGS = [("airedale", "AIREDALE"), ("shepherd", "SHEPHERD"), ("jackrussell", "TERRIER"), ("collie", "COLLIE"), ("dachshund", "DACHSHUND")]


def dog(b):
    return Image.open(os.path.join(ROOT, "web", "public", "assets", "props", f"dog_{b}_sit.png")).convert("RGBA")


def post_tiers():
    W, H = 300, 180
    im = Image.new("RGBA", (W, H), P["dark"] + (255,))
    SW = 120
    planks(im, (0, 0, SW, H), seed=11, vertical=True)
    sandbag_wall(im, (0, 0, SW, 12), seed=4)
    planks(im, (0, 150, SW, H), seed=5, vertical=False)
    d = ImageDraw.Draw(im)
    d.line((0, 150, SW, 150), fill=P["ink"])
    lamp(im, 60, 70, top=12)
    im.alpha_composite(up(sprite("hegemony_officer_south.png"), 2), (-8, 90))  # důstojníci čelem k divákovi
    im.alpha_composite(up(sprite("concord_officer_south.png"), 2), (64, 90))
    light(im, 60, 122, 70, strength=1.0, steps=3)
    shade(im, (0, 0, SW, H), strength=0.55)
    im.alpha_composite(up(dog("shepherd"), 2), (28, 90))  # náš pes ze hry, až po světle a stínu (bez přebarvení)
    d = ImageDraw.Draw(im)
    star(d, 20, 84)
    star(d, 92, 84)
    d.rectangle((0, 18, SW, 50), fill=P["ink"])
    text_c(d, SW // 2, 21, "THE FRONT", font(8, True), P["white"])
    text_c(d, SW // 2, 30, "HAS A", font(8, True), P["white"])
    text_c(d, SW // 2, 39, "SUPPLY LINE", font(8, True), P["gold"])
    d.line((SW, 0, SW, H), fill=P["gold"])
    X0 = SW + 8
    d.text((X0, 10), "SUPPORT MUD AND IRON", font=font(8, True), fill=P["white"])
    d.text((X0, 20), "ON PATREON", font=font(8, True), fill=P["gold"])
    rows = [("$4", "WAR BONDS", "RIBBON FOR YOUR SOLDIER"),
            ("$6", "FIELD POST", "+ A TRENCH DOG"),
            ("$10", "OFFICERS' MESS", "+ STAR OVER YOUR SOLDIER")]
    for i, (price, name, what) in enumerate(rows):
        y = 36 + i * 31
        d.rectangle((X0, y, W - 8, y + 26), fill=P["mud0"], outline=P["gold"] if i else P["mud2"])
        if i == 0:
            ribbon(d, X0 + 5, y + 9, scale=0.36, h=7)
        elif i == 1:
            im.alpha_composite(dog("jackrussell"), (X0 - 2, y - 6))
            d = ImageDraw.Draw(im)
        else:
            star(d, X0 + 13, y + 12, r=6)
        d.text((X0 + 28, y + 4), price, font=font(8, True), fill=P["gold"])
        d.text((X0 + 54, y + 4), name, font=font(8, True), fill=P["white"])
        d.text((X0 + 28, y + 14), what, font=font(8), fill=P["pale"])
    # všech pět plemen psů v řadě (místo textu o hře zdarma)
    for i, (b, _) in enumerate(DOGS):
        im.alpha_composite(dog(b), (X0 - 6 + i * 33, 124))
    d = ImageDraw.Draw(im)
    d.text((X0, 160), "PATREON.COM/CW/MUDANDIRON", font=font(8, True), fill=P["gold"])
    save(im, "post_tiers_v2_1500x900.jpg")


def post_dogs():
    W, H = 300, 180
    im = Image.new("RGBA", (W, H), P["dark"] + (255,))
    planks(im, (0, 0, W, 112), seed=21, vertical=True)
    sandbag_wall(im, (0, 104, W, 120), seed=6)
    planks(im, (0, 120, W, H), seed=9, vertical=False)
    lamp(im, 150, 40, top=0)
    light(im, 150, 60, 150, strength=0.9, steps=3)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 8, W, 34), fill=P["ink"])
    text_c(d, W // 2, 11, "TRENCH DOGS", font(16, True), P["gold"])
    for i, (b, name) in enumerate(DOGS):
        cx = 30 + i * 60
        im.alpha_composite(up(dog(b), 2), (cx - 32, 46))
        d = ImageDraw.Draw(im)
        for k, part in enumerate(name.split('|')):
            text_c(d, cx, 112 - (len(name.split('|')) - 1) * 9 + k * 9, part, font(8), P["white"])
    shade(im, (0, 0, W, H), strength=0.25)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 126, W, H), fill=P["ink"])
    text_c(d, W // 2, 131, "A DOG AT YOUR SOLDIER'S SIDE, ON THE FRONT MAP", font(8), P["pale"])
    text_c(d, W // 2, 142, "ITS OWN NAME. ITS OWN STORIES IN YOUR DIARY.", font(8), P["pale"])
    text_c(d, W // 2, 153, "IF YOUR SOLDIER FALLS, THE DOG STAYS WITH THE FAMILY.", font(8), P["pale"])
    text_c(d, W // 2, 166, "FIELD POST $6 · OFFICERS' MESS $10", font(8, True), P["gold"])
    save(im, "post_dogs_1500x900.jpg")


if __name__ == "__main__":
    post_tiers()
    post_dogs()


# ---------------- obrázky úrovní 460×200 (mřížka 230×100 ×2, doporučení Patreonu) se psy, 21. 11. ----------------
from make_patreon import TW, TH, label, dugout, tier_bonds  # noqa: E402


def save_tier(im, name):
    out = os.path.join(OUT, name)
    up(im, 2).convert("RGB").save(out, quality=95, subsampling=0)
    print(out)


def tier_post_dog():
    """Field Post: voják čte dopis, vedle sedí pes, na bedně dopisy a balík"""
    im = dugout(12)
    lamp(im, 112, 30, top=12)
    im.alpha_composite(up(sprite("concord_south.png"), 2), (60, 16))
    im.alpha_composite(up(sprite("hegemony_east.png"), 2), (136, 16))
    light(im, 112, 50, 80, strength=1.0, steps=3)
    shade(im, (0, 0, TW, TH), strength=0.55)
    im.alpha_composite(up(dog("collie"), 2), (94, 22))  # pes až po světle (bez přebarvení)
    im.alpha_composite(up(dog("jackrussell"), 2), (176, 22))
    d = ImageDraw.Draw(im)
    for k, (x, y) in enumerate(((16, 70), (26, 66), (20, 62))):  # obálky na bedně
        d.rectangle((x, y, x + 14, y + 9), fill=P["white"], outline=P["sand"])
        d.line((x, y, x + 7, y + 5), fill=P["sand"]); d.line((x + 14, y, x + 7, y + 5), fill=P["sand"])
        d.rectangle((x + 6, y + 5, x + 8, y + 6), fill=P["rust"])
    label(im, "FIELD POST")
    save_tier(im, "tier_field_post.jpg")


def tier_mess_dog():
    """Officers' Mess: důstojníci obou stran se zlatou hvězdou u stolu, u každého pes"""
    im = Image.new("RGBA", (TW, TH), P["dark"] + (255,))
    planks(im, (0, 0, TW, TH), seed=11, vertical=True)
    sandbag_wall(im, (0, 0, TW, 12), seed=4)
    planks(im, (0, 72, TW, TH), seed=5, vertical=False)
    d = ImageDraw.Draw(im)
    d.line((0, 72, TW, 72), fill=P["ink"])
    lamp(im, 112, 30, top=12)
    im.alpha_composite(up(sprite("hegemony_officer_south.png"), 2), (20, 16))
    im.alpha_composite(up(sprite("concord_officer_south.png"), 2), (146, 16))
    d = ImageDraw.Draw(im)
    d.rectangle((82, 56, 142, 60), fill=P["mud3"], outline=P["ink"])
    d.rectangle((86, 61, 89, 80), fill=P["mud1"]); d.rectangle((135, 61, 138, 80), fill=P["mud1"])
    d.rectangle((90, 52, 116, 55), fill=P["pale"]); d.line((93, 53, 112, 54), fill=P["rust"])
    d.rectangle((124, 47, 125, 55), fill=P["white"]); d.point((124, 46), fill=P["gold"])
    mug(d, 128, 49, 0)
    light(im, 124, 48, 60, strength=1.0, steps=3)
    shade(im, (0, 0, TW, TH), strength=0.6)
    im.alpha_composite(up(dog("shepherd"), 2), (56, 22))
    im.alpha_composite(up(dog("airedale"), 2), (108, 22))
    d = ImageDraw.Draw(im)
    for cx in (52, 178):
        star(d, cx, 10)
    label(im, "OFFICERS' MESS")
    save_tier(im, "tier_officers_mess.jpg")


if __name__ == "__main__":
    tier_post_dog()
    tier_mess_dog()
