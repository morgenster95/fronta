"""Patreon post „You decide what comes next“ (22. 11. 2026): patroni navrhují v komentářích další odměnu.
Jen ilustrace bez textu (uživatel 22. 11.): kryt za noci, u stolu s mapou a prázdnými lístky stojí voják Hegemonie a Concordu,
nad nimi lampa, u stolu pes, na bedně dopisy, nad stolem zlatá hvězda patronů.
1920×1080 (mřížka 300×180 ×6, make_patreon_dog.save).
Použití: python marketing/make_patreon_ask.py → marketing/promo/patreon/post_ask_1920x1080.jpg
"""
import os
import sys
from PIL import ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_posts import P, sprite, up  # noqa: E402
from make_patreon_dog import save, dog  # noqa: E402
from make_patreon import star  # noqa: E402
from day_art import planks, light, shade, lamp, sandbag_wall, paper  # noqa: E402

W, H = 300, 180


def main():
    from PIL import Image
    im = Image.new("RGBA", (W, H), P["dark"] + (255,))
    planks(im, (0, 0, W, 120), seed=31, vertical=True)          # stěna krytu
    sandbag_wall(im, (0, 0, W, 14), seed=8)                     # strop z pytlů
    planks(im, (0, 120, W, H), seed=17, vertical=False)         # podlaha
    d = ImageDraw.Draw(im)
    d.line((0, 120, W, 120), fill=P["ink"])
    for x in (40, 260):                                         # nosné trámy
        d.rectangle((x, 14, x + 6, 120), fill=P["mud1"], outline=P["ink"])
    # bedna s dopisy vpravo, sud vlevo
    d.rectangle((222, 128, 252, 150), fill=P["mud2"], outline=P["ink"])
    d.line((222, 139, 252, 139), fill=P["ink"])
    for k, (x, y) in enumerate(((226, 122), (236, 119), (230, 116))):
        d.rectangle((x, y, x + 12, y + 7), fill=P["white"], outline=P["sand"])
        d.line((x, y, x + 6, y + 4), fill=P["sand"]); d.line((x + 12, y, x + 6, y + 4), fill=P["sand"])
    d.rectangle((52, 124, 72, 150), fill=P["mud1"], outline=P["ink"])
    for y in (130, 143):
        d.line((52, y, 72, y), fill=P["steel"])
    # vojáci obou stran u stolu (2×), lampa nad stolem
    lamp(im, 150, 46, top=14)
    im.alpha_composite(up(sprite("hegemony_officer_south.png"), 2), (76, 56))
    im.alpha_composite(up(sprite("concord_west.png"), 2), (160, 56))
    d = ImageDraw.Draw(im)
    # stůl s mapou a lístky (nápady patronů); kreslí se PŘED vojáky, ať jim zakryje nohy
    d.rectangle((92, 108, 208, 113), fill=P["mud3"], outline=P["ink"])       # deska
    d.rectangle((96, 113, 204, 132), fill=P["mud1"], outline=P["ink"])       # čelo stolu
    for x in range(100, 204, 12):
        d.line((x, 114, x, 131), fill=P["mud0"])
    d.rectangle((98, 132, 103, 146), fill=P["mud1"], outline=P["ink"])
    d.rectangle((197, 132, 202, 146), fill=P["mud1"], outline=P["ink"])
    d.rectangle((118, 104, 160, 109), fill=P["sand"], outline=P["mud2"])     # mapa
    d.line((122, 107, 134, 105), fill=P["mud2"]); d.line((134, 105, 148, 107), fill=P["mud2"])
    d.point((140, 106), fill=P["rust"]); d.point((128, 106), fill=P["rust"])
    for x, y in ((166, 105), (174, 106), (182, 104)):                        # prázdné lístky
        d.rectangle((x, y, x + 5, y + 3), fill=P["white"], outline=P["sand"])
    d.rectangle((104, 103, 108, 108), fill=P["steel"], outline=P["ink"])     # hrnek
    light(im, 150, 90, 110, strength=1.2, steps=3)
    shade(im, (0, 0, W, H), strength=0.4)
    im.alpha_composite(up(dog("shepherd"), 2), (116, 116))      # pes až po světle (bez přebarvení)
    im.alpha_composite(dog("jackrussell"), (190, 126))
    d = ImageDraw.Draw(im)
    star(d, 150, 72, 6)                                         # hvězda patronů nad stolem
    save(im, "post_ask_1500x900.jpg")


if __name__ == "__main__":
    main()
