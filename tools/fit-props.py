"""Měřítko rekvizit ve filmových scénách (pravidlo uživatele 26. 11.: batoh, bedna i pušky byly větší než voják).
Voják ve hře je 19×30 px (= 1,75 m → 1 px ≈ 5,8 cm). Rekvizity z PixelLabu vznikají na plátně 52×70 a vycházejí příliš velké,
proto se z originálů v art/cine/orig/ zmenší na cílovou velikost podle SKUTEČNÉ velikosti předmětu (tabulka níže) a
převedou na paletu Trench-24 (bez průhlednosti). Spuštění: python tools/fit-props.py  (výstup art/cine/prop_<název>.png, originály se nemění).
Při přidání nové rekvizity: zapiš ji do TARGET (strana: 'w' šířka nebo 'h' výška v px) podle skutečných rozměrů (cm / 5,8)."""
import os
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAL = ["#0e0d0c", "#1c1a17", "#2b2722", "#3d3730", "#524a3f", "#6b6152", "#857a68", "#a39782", "#c4b8a0", "#e3d9c3", "#8a9295", "#666d70"]
import re
src = open(os.path.join(ROOT, "tools", "pixellab.py")).read()
m = re.search(r"TRENCH\s*=\s*\[(.*?)\]", src, re.S)
PAL = re.findall(r"#[0-9a-fA-F]{6}", m.group(1))
rgb = [tuple(int(c[i:i + 2], 16) for i in (1, 3, 5)) for c in PAL]
# název: (strana, cílová velikost v px)  1 px ≈ 5,8 cm
TARGET = {
    "recruit_table": ("w", 28),   # stůl 1,6 m
    "notice_board": ("h", 30),    # nástěnka s nohama 1,7 m
    "barricade": ("w", 36),       # val z pytlů 2,1 m
    "barricade_corner": ("w", 32),
    "lantern_post": ("h", 36),    # sloup s lucernou 2,1 m
    "ammo_crates": ("w", 22),     # hromada beden 1,3 m
    "field_desk": ("w", 26),
    "medic_box": ("w", 14),       # lékárna 80 cm
    "flag_pole": ("h", 44),       # vlajka na tyči 2,5 m
    "tent_medic": ("w", 40),      # stan 2,3 m
    "cot_blue": ("w", 34),        # lůžko 2 m
    "phone_table": ("w", 24),
    "mail_sack": ("w", 14),       # pytel s poštou 80 cm
    "soup_pot": ("w", 22),        # kotlík nad ohněm 1,3 m
    "map_table": ("w", 28),
    "rifle_rack": ("h", 30),      # stojan na pušky 1,7 m (puška 1,2 m = 21 px)
}
def nearest(c):
    return min(rgb, key=lambda p: (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2)
for n, (side, size) in TARGET.items():
    im = Image.open(os.path.join(ROOT, "art", "cine", "orig", f"prop_{n}.png")).convert("RGBA")
    k = size / (im.width if side == "w" else im.height)
    out = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            px[x, y] = (*nearest((r, g, b)), 255) if a >= 128 else (0, 0, 0, 0)
    # drobné osamocené skvrny (úlomky z generování) pryč: ponechá se jen největší souvislý celek a díly větší než 12 px
    seen = set(); comps = []
    for y0 in range(out.height):
        for x0 in range(out.width):
            if px[x0, y0][3] and (x0, y0) not in seen:
                st = [(x0, y0)]; seen.add((x0, y0)); c = []
                while st:
                    x, y = st.pop(); c.append((x, y))
                    for dx in (-1, 0, 1):
                        for dy in (-1, 0, 1):
                            q = (x + dx, y + dy)
                            if 0 <= q[0] < out.width and 0 <= q[1] < out.height and q not in seen and px[q][3]:
                                seen.add(q); st.append(q)
                comps.append(c)
    for c in comps:
        if len(c) < 12 and len(c) < max(map(len, comps)):
            for x, y in c: px[x, y] = (0, 0, 0, 0)
    out = out.crop(out.getbbox())
    out.save(os.path.join(ROOT, "art", "cine", f"prop_{n}.png"))
    print(n, out.size)
