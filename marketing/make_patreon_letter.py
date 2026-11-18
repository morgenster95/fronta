"""Obrázky k dopisu patronům na Patreon (18. 11. 2026, 1 000 sledujících), 1500×900 (mřížka 250×150 ×6), pixel art se sprity ze hry.
  1) letter  – noc v krytu: voják Hegemonie a voják Concordu u jednoho stolu nad dopisem „TO EVERY SOLDIER,“, svíčka, obálka s pečetí,
               nahoře „A LETTER TO THE FRONT“, dole „1,000 STRONG · THANK YOU“
  2) plans   – mapa fronty připíchnutá na prknech, čtyři lístky s plány (newsreel, stabilní fronta, vozidla, výpravy do měst), dva vojáci se dívají
Použití: python marketing/make_patreon_letter.py → marketing/promo/patreon/letter_{1,2}_1500x900.jpg
"""
import os
import random
import sys

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_posts import P, font, sprite, up  # noqa: E402
from day_art import planks, light, paper, shade, sandbag_wall  # noqa: E402
from make_letters import scribble, candle, envelope  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "marketing", "promo", "patreon")
W, H, K = 250, 150, 6


def text_c(d, cx, y, s, f, fill):
    w = d.textlength(s, font=f)
    d.text((cx - w / 2 + 1, y + 1), s, font=f, fill=P["ink"])
    d.text((cx - w / 2, y), s, font=f, fill=fill)


def soldier(im, name, x, y, k=2):
    try:
        im.alpha_composite(up(sprite(name), k), (x, y))
    except FileNotFoundError:
        pass


def dugout(im, seed=4):
    d = ImageDraw.Draw(im)
    planks(im, (0, 0, W, 118), seed=seed, vertical=True)
    sandbag_wall(im, (0, 0, W, 14), seed=8)
    d.rectangle((0, 14, W, 18), fill=P["mud1"])
    d.line((0, 18, W, 18), fill=P["ink"])
    for x in (14, W - 19):
        d.rectangle((x, 18, x + 5, 118), fill=P["mud1"])
        d.line((x + 5, 18, x + 5, 118), fill=P["ink"])
    return d


def letter():
    im = Image.new("RGBA", (W, H), P["dark"])
    d = dugout(im)
    # dvě vlajky na zdi: Hegemonie (šedá s rezavým pruhem) a Concord (olivová se žlutou hvězdou)
    d.rectangle((36, 30, 62, 46), fill=P["grey"]); d.rectangle((36, 36, 62, 39), fill=P["rust"]); d.line((35, 28, 35, 60), fill=P["mud3"])
    d.rectangle((W - 62, 30, W - 36, 46), fill=P["olive"]); d.line((W - 35, 28, W - 35, 60), fill=P["mud3"])
    for dx, dy in ((0, -3), (-3, -1), (3, -1), (-2, 2), (2, 2), (0, 0), (-1, -1), (1, -1), (0, 1), (-1, 1), (1, 1)):
        d.point((W - 49 + dx, 38 + dy), fill=P["yellow"])
    # vojáci obou stran nad jedním dopisem
    soldier(im, "hegemony_east.png", 44, 58)
    soldier(im, "concord_west.png", W - 108, 58)
    d = ImageDraw.Draw(im)
    planks(im, (0, 112, W, 150), seed=6, vertical=False)
    d.line((0, 112, W, 112), fill=P["bone"])
    paper(im, (82, 92, 172, 146), seed=5)
    d = ImageDraw.Draw(im)
    d.text((88, 95), "SOLDIERS,", font=font(8, True), fill=P["mud1"])
    rnd = random.Random(3)
    for i, y in enumerate(range(108, 144, 5)):
        scribble(d, 88, y, 166 - (20 if i == 6 else 0), rnd, P["mud1"])
    d.line((168, 140, 182, 126), fill=P["gold"]); d.line((169, 140, 183, 126), fill=P["fire"])
    envelope(d, 30, 122)
    candle(im, 206, 132)
    light(im, 205, 120, 110, strength=1.0, steps=3)
    shade(im, (0, 0, W, 150), strength=0.7)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, W, 24), fill=P["dark"]); d.line((0, 24, W, 24), fill=P["gold"])
    text_c(d, W // 2, 7, "A LETTER TO THE FRONT", font(8, True), P["gold"])
    return im


def note(d, x, y, w, h, title, sub, pin):
    d.rectangle((x + 1, y + 1, x + w + 1, y + h + 1), fill=P["ink"])
    d.rectangle((x, y, x + w, y + h), fill=P["pale"], outline=P["mud2"])
    d.text((x + 4, y + 4), title, font=font(8, True), fill=P["mud0"])
    d.text((x + 4, y + 14), sub, font=font(8), fill=P["mud2"])
    d.ellipse((x + w // 2 - 2, y - 2, x + w // 2 + 2, y + 2), fill=pin)


def plans():
    im = Image.new("RGBA", (W, H), P["dark"])
    d = dugout(im, seed=9)
    # mapa fronty: dvě linie zákopů, země nikoho, šipky k městům
    mx0, my0, mx1, my1 = 40, 28, 210, 112
    d.rectangle((mx0 + 2, my0 + 2, mx1 + 2, my1 + 2), fill=P["ink"])
    d.rectangle((mx0, my0, mx1, my1), fill=P["bone"], outline=P["mud2"])
    for x in range(mx0 + 6, mx1 - 4, 3):
        d.point((x, my0 + 30 + (x // 3) % 2), fill=P["grey"])
        d.point((x, my0 + 52 + (x // 3) % 2), fill=P["khaki"])
    for x in range(mx0 + 8, mx1 - 6, 9):
        d.point((x, my0 + 41), fill=P["mud3"])
    for cx, cy in ((mx0 + 22, my0 + 10), (mx1 - 24, my0 + 72)):
        d.rectangle((cx - 4, cy - 3, cx + 4, cy + 3), fill=P["mud3"]); d.point((cx, cy - 5), fill=P["mud3"])
    d.line((mx0 + 60, my0 + 30, mx0 + 26, my0 + 14), fill=P["rust"]); d.line((mx0 + 120, my0 + 52, mx1 - 28, my0 + 68), fill=P["rust"])
    # lístky s plány
    note(d, 16, 34, 80, 24, "FRONT NEWS", "on YouTube", P["rust"])
    note(d, 146, 32, 88, 24, "STEADY FRONT", "more room", P["gold"])
    note(d, 18, 84, 74, 24, "VEHICLES", "in testing", P["olive"])
    note(d, 146, 86, 88, 24, "EXPEDITIONS", "to towns", P["steel"])
    soldier(im, "hegemony_north.png", 74, 96)
    soldier(im, "concord_north.png", 108, 96)
    d = ImageDraw.Draw(im)
    planks(im, (0, 132, W, 150), seed=2, vertical=False)
    light(im, W // 2, 60, 130, strength=0.6, steps=3)
    shade(im, (0, 0, W, 150), strength=0.55)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, W, 24), fill=P["dark"]); d.line((0, 24, W, 24), fill=P["gold"])
    text_c(d, W // 2, 7, "WHAT COMES NEXT", font(8, True), P["gold"])
    return im


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for i, fn in enumerate((letter, plans), 1):
        p = os.path.join(OUT, f"letter_{i}_1500x900.jpg")
        up(fn(), K).convert("RGB").save(p, quality=95, subsampling=0)
        print(p)
