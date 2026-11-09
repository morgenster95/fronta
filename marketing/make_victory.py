"""Karusel po vítězství v závodě o kótu (Mud & Iron): 1) kdo dobyl kótu, 2) hlasování o rozkazu pro každou stranu.

Dvě varianty (vyhraje Hegemony / vyhraje Concord), smyčka zveřejní tu správnou (queue.json, trigger race).
Použití: python marketing/make_victory.py [objective_id] ["Objective Name"] ["Next Objective"]   (z kořene repa)
Výstup: marketing/promo/victory_<id>_<faction>_1.jpg a _2.jpg
"""
import os
import sys

from PIL import Image, ImageDraw

from make_posts import P, HEG, CON, W, H, K, ROOT, font, up, text_c, sky, wire, canvas, frame, footer
from victory_scene import scene

PROMO = os.path.join(ROOT, "marketing", "promo")
LOC = os.path.join(ROOT, "web", "public", "assets", "locations")

SIDES = [
    {"id": "hegemony", "name": "THE HEGEMONY", "short": "HEGEMONY", "col": HEG, "band": P["water"], "spr": "hegemony", "motto": "IRON ENDURES.",
     "dark": P["steel"], "emblem": "cross", "flashes": []},
    {"id": "concord", "name": "THE CONCORD", "short": "CONCORD", "col": CON, "band": P["olive"], "spr": "concord", "motto": "TOGETHER, OR NOT AT ALL.",
     "dark": P["khaki"], "emblem": "ring", "flashes": [], "flip": True},
]


def save(im, name):
    up(im, K).convert("RGB").save(os.path.join(PROMO, name), quality=92)


def slide_win(side, other, objective, ext):
    """kreslená scéna (victory_scene.py): kopec s praporem, v popředí vojáci ze hry; texty v pásech nahoře a dole"""
    im = scene(side)
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    for y in range(46):
        a = 215 if y < 34 else int(215 * (46 - y) / 12)
        d.line((0, y, W, y), fill=P["ink"] + (a,))
    for y in range(214, H):
        a = 235 if y > 220 else int(235 * (y - 214) / 6)
        d.line((0, y, W, y), fill=P["ink"] + (a,))
    im.alpha_composite(ov)
    d = ImageDraw.Draw(im)
    text_c(d, W // 2, 5, objective.upper(), font(16, True), P["white"])
    text_c(d, W // 2, 24, f"TAKEN BY {side['name']}", font(8, True), side["col"])
    text_c(d, W // 2, 221, f"3 DAYS OF GUNS ON THE {other['short']}", font(8), P["white"])
    d.rectangle((24, 234, W - 25, 247), fill=P["rust"])  # výzva k hlasování hned na 1. snímku
    text_c(d, W // 2, 237, "YOUR SIDE VOTES NOW  >>", font(8, True), P["white"])
    footer(d, H - 16)
    frame(im)
    save(im, f"victory_{ext}_{side['id']}_1.jpg")


def slide_vote(side, nxt, ext):
    im = canvas()
    sky(im, 50, glow=False)
    d = frame(im)
    text_c(d, W // 2, 10, "YOUR SIDE,", font(16, True), P["white"])
    text_c(d, W // 2, 28, "YOUR ORDER", font(16, True), P["gold"])
    text_c(d, W // 2, 48, "EACH SIDE VOTES FOR ITSELF", font(8), P["pale"])
    hosp = Image.open(os.path.join(LOC, "hospital.png")).convert("RGBA")
    hosp = hosp.resize((hosp.width // 4, hosp.height // 4), Image.NEAREST)
    opts = [
        ("FORTIFY", "DIG IN DEEPER", "FEWER WOUNDS", None),
        ("HOSPITAL", "DUGOUT HOSPITAL", "WOUNDED HEAL FASTER", hosp),
    ]
    for i, (kw, a, b, pic) in enumerate(opts):
        y = 66 + i * 70
        d.rectangle((10, y, W - 11, y + 62), fill=P["mud0"], outline=P["mud2"])
        if pic is None:  # pytle s pískem a drát
            for r in range(3):
                for c in range(4 - r):
                    x0, y0 = 20 + c * 12 + r * 6, y + 44 - r * 8
                    d.rounded_rectangle((x0, y0, x0 + 11, y0 + 7), 2, fill=P["sand"], outline=P["mud2"])
            wire(d, y + 16, 18, 70)
        else:
            im.alpha_composite(pic, (14, y - 1))
        d = ImageDraw.Draw(im)
        d.rectangle((84, y + 8, W - 18, y + 24), fill=P["rust"])
        text_c(d, (84 + W - 18) // 2, y + 12, kw, font(8, True), P["white"])
        d.text((86, y + 31), a, font=font(8), fill=P["white"])
        d.text((86, y + 45), b, font=font(8), fill=P["bone"])
    text_c(d, W // 2, 208, "COMMENT ONE WORD BELOW.", font(8, True), P["white"])
    text_c(d, W // 2, 220, "YOUR SOLDIER IS YOUR BALLOT.", font(8), P["pale"])
    text_c(d, W // 2, 236, f"NEW RACE: {nxt.upper()}", font(8, True), P["gold"])
    footer(d)
    save(im, f"victory_{ext}_{side['id']}_2.jpg")


if __name__ == "__main__":
    ext = sys.argv[1] if len(sys.argv) > 1 else "ridge"
    objective = sys.argv[2] if len(sys.argv) > 2 else "Verdel Ridge"
    nxt = sys.argv[3] if len(sys.argv) > 3 else "Hill 304"
    for i, side in enumerate(SIDES):
        slide_win(side, SIDES[1 - i], objective, ext)
        slide_vote(side, nxt, ext)
    print("hotovo:", sorted(f for f in os.listdir(PROMO) if f.startswith(f"victory_{ext}")))
