"""Návod „How to change your role“ (21. 11. 2026, hráči se ptají, kde je převelení): karusel 3× 1080×1350.
Vlevo telefon se skutečným snímkem webu (karta vojáka, jméno nahrazené „Your Soldier“), vpravo kroky.
Snímky: marketing/promo/howto/howto_{claim,code,transfer}.png (390×844 @2x, puppeteer z dev serveru).
Použití: python marketing/make_howto_role.py → marketing/promo/howto_role_{1,2,3}.jpg
"""
import os
import sys

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_posts import P, font, vt  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROMO = os.path.join(ROOT, "marketing", "promo")
SHOTS = os.path.join(PROMO, "howto")
W, H = 1080, 1350

SLIDES = [
    ("claim", "HOW TO CHANGE", "YOUR ROLE", "STEP 1 · CLAIM YOUR SOLDIER", [
        ("1", "Open mudandiron.app", "(link in bio)"),
        ("2", "Search your @name", "and open your card"),
        ("3", "Tap THIS IS ME: CLAIM", ""),
        ("4", "Sign in with Google", ""),
    ], "SWIPE >"),
    ("code", "CLAIM", "WITH A CODE", "STEP 2 · CONFIRM ON INSTAGRAM", [
        ("5", "You get a code", "like ENLIST-7K2Q (copied)"),
        ("6", "Comment the code", "under any @mudandiron post"),
        ("7", "Wait a few minutes", "the soldier is yours"),
    ], "SWIPE >"),
    ("transfer", "REQUEST", "A TRANSFER", "STEP 3 · PICK A NEW ROLE", [
        ("8", "Tap REQUEST A TRANSFER", "on your card, pick a role"),
        ("+", "First transfer", "comes through in minutes"),
        ("+", "Then 1 every 7 days", "ask anytime, it waits"),
        ("+", "If your soldier falls", "the heir starts in the new role"),
    ], "LIEUTENANTS ARE CHOSEN BY THE FRONT"),
]


def bg():
    im = Image.new("RGB", (W, H), P["ink"])
    d = ImageDraw.Draw(im)
    for y in range(0, H, 5):
        for x in range(0, W, 5):
            if ((x // 5) * 7 + (y // 5) * 3) % 23 == 0:
                d.rectangle((x, y, x + 4, y + 4), fill=P["dark"])
    d.rectangle((20, 20, W - 21, H - 21), outline=P["mud2"], width=5)
    return im, d


def phone(im, shot, x, y, h):
    s = Image.open(shot).convert("RGB")
    w = round(s.width * h / s.height)
    s = s.resize((w, h), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    d.rectangle((x - 18, y - 18, x + w + 17, y + h + 17), fill=P["mud0"], outline=P["mud3"], width=5)
    d.rectangle((x - 3, y - 3, x + w + 2, y + h + 2), fill=P["ink"])
    im.paste(s, (x, y))
    return w


def make(i, slide):
    key, t1, t2, sub, steps, foot = slide
    im, d = bg()
    d.text((60, 56), t1, font=font(60, True), fill=P["white"])
    d.text((60, 126), t2, font=font(60, True), fill=P["gold"])
    d.text((60, 214), sub, font=font(25), fill=P["bone"])
    pw = phone(im, os.path.join(SHOTS, f"howto_{key}.png"), 78, 290, 900)
    x0 = 78 + pw + 60
    y = 330
    for n, a, b in steps:
        d.text((x0, y - 6), n, font=font(50, True), fill=P["gold"])
        d.text((x0 + 56, y), a, font=vt(45), fill=P["white"])
        if b:
            d.text((x0 + 56, y + 46), b, font=vt(30), fill=P["pale"])
        y += 150 if b else 110
    d.text((60, H - 92), foot, font=font(25, True), fill=P["gold"] if foot.startswith("SWIPE") else P["bone"])
    d.text((W - 60 - d.textlength(f"{i + 1}/3", font=font(25, True)), H - 92), f"{i + 1}/3", font=font(25, True), fill=P["mud3"])
    out = os.path.join(PROMO, f"howto_role_{i + 1}.jpg")
    im.save(out, quality=92)
    print(out)


if __name__ == "__main__":
    for i, s in enumerate(SLIDES):
        make(i, s)
