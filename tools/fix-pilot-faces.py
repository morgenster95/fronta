"""Sjednotí obličeje pilotů po importu (17. 11. 2026): Hegemonie má jednotnou kůži (dřív skvrny oranžová/rez/žlutá),
Concord dostane oči (tmavé body u horní řady kůže). Spouští se po importu chůze/rotací: python tools/fix-pilot-faces.py
Platí pro hegemony_pilot* a concord_pilot*, všechny směry krom zad (north*)."""
import glob, os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOLD = os.path.join(ROOT, "web", "public", "assets", "soldiers")
H = lambda h: tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
LIGHT, MID = H("e5aa7c"), H("c8865f")
WARM_DARK = {H(x) for x in ("7e3b2a", "5c2a22", "9e5d43", "b67653", "a85a36", "935a3f", "ad6d4f")}
WARM_LIGHT = {H(x) for x in ("c9c26a", "d98f3f", "e5aa7c", "c8865f", "db9b71", "bc8e69", "ebbf98")}
CSKIN = {H(x) for x in ("935a3f", "bc8e69", "ad6d4f", "db9b71")}
EYE = H("0e0d0c")


def head_rows(im):
    bb = im.getbbox()
    return bb[1], bb[1] + 8  # od temene 8 řádků = hlava


def fix(path, side, name):
    im = Image.open(path).convert("RGBA")
    px = im.load()
    y0, y1 = head_rows(im)
    if side == "hegemony":
        for y in range(y0, y1):
            for x in range(im.width):
                c = px[x, y][:3]
                if px[x, y][3] and (c in WARM_DARK or c in WARM_LIGHT):
                    # lícní kost a světlo nahoře, stín dole: dvě barvy kůže stran místo skvrn
                    px[x, y] = (LIGHT if y - y0 < 6 else MID) + (255,)
    # oči: nejvyšší řada kůže (Concord), u profilu a 3/4 jeden bod vpředu, zepředu dva
    if side == "concord":
        rows = {}
        for y in range(y0, y1):
            xs = [x for x in range(im.width) if px[x, y][3] and px[x, y][:3] in CSKIN]
            if len(xs) >= 2:
                rows[y] = xs
        if rows:
            y = min(rows)
            xs = rows[y]
            if "south_" in name.replace("south-", "") or name.endswith("_south.png") or "@walk_south" in name:  # zepředu: dvě oči
                px[xs[0], y] = EYE + (255,); px[xs[-1], y] = EYE + (255,)
            else:  # z boku a z 3/4: jedno oko vpředu
                px[xs[-1] if "east" in name else xs[0], y] = EYE + (255,)
    im.save(path)


for side in ("hegemony", "concord"):
    for f in glob.glob(os.path.join(SOLD, f"{side}_pilot*.png")) + glob.glob(os.path.join(SOLD, f"{side}_pilot@walk_*.png")):
        n = os.path.basename(f)
        if "north" in n:
            continue
        fix(f, side, n)
print("hotovo")
