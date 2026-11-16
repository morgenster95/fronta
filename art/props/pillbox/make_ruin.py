"""Ruina betonového bunkru (16. 11. 2026, PixelLab z cloudu nešel): z herních spritů pillbox.png / pillbox_back.png
vyrobí rozstřílenou verzi stejné velikosti 48×32 (stejné umístění na mapě): utržená střecha a horní roh, tma uvnitř,
ohořelé okraje, trčící pruty výztuže, sutiny u paty, ohnutá hlaveň. Spuštění: python art/props/pillbox/make_ruin.py"""
import os
import random
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), "..", "..", "..")
SRC = os.path.join(ROOT, "web", "public", "assets", "props")
INK, DARK, MUD0, MUD1, MUD2 = (14, 13, 12, 255), (28, 26, 23, 255), (43, 39, 34, 255), (61, 55, 48, 255), (82, 74, 63, 255)
CON0, CON1, CON2, CON3 = (107, 97, 82, 255), (133, 122, 104, 255), (163, 151, 130, 255), (196, 184, 160, 255)
RUST, RUST2, FIRE = (126, 59, 42, 255), (92, 42, 34, 255), (168, 90, 54, 255)


def ruin(name, out, seed, back=False):
    im = Image.open(os.path.join(SRC, f"{name}.png")).convert("RGBA")
    W, H = im.size
    px = im.load()
    r = random.Random(seed)
    # 1) utržená horní část: zubatá hrana, nalevo hlubší (zásah zleva shora)
    edge = []
    for x in range(W):
        base = 2 + int(13 * max(0, 1 - abs(x - 15) / 13) ** 0.8)  # díra jen vlevo (zásah do levého rohu), napravo střecha zůstane
        edge.append(base + (r.choice([-1, 0, 0, 1, 2]) if base > 3 else 0))
    for x in range(W):
        for y in range(0, edge[x]):
            px[x, y] = (0, 0, 0, 0)
    # 2) uvnitř tma: pod zubatou hranou pásek interiéru (vidíme do bunkru), jen kde byl beton
    for x in range(8, W - 8):
        y0 = edge[x]
        if y0 <= 5:
            continue  # neporušená střecha
        for y in range(y0, min(H, y0 + 4)):
            if px[x, y][3] and px[x, y] not in (INK,):
                px[x, y] = INK if y - y0 < 2 else DARK
        # světlá lomová hrana nahoře
        if y0 > 5 and px[x, y0][3]:
            px[x, y0] = CON2 if (x + seed) % 3 else CON1
    # 3) ohořelé okraje kolem díry (dithering do tmavých tónů)
    for y in range(H):
        for x in range(W):
            c = px[x, y]
            if not c[3]:
                continue
            d = y - edge[x]
            if edge[x] > 5 and 3 <= d < 8 and (x * 7 + y * 3 + seed) % 5 < (3 - d // 3):
                px[x, y] = MUD2 if c[0] > 120 else MUD1
    # 4) díry a praskliny ve stěně
    for _ in range(3):
        cx, cy = r.randint(26, W - 12), r.randint(10, H - 8)
        for k in range(r.randint(3, 6)):
            x, y = cx + r.randint(-2, 2), cy + r.randint(-1, 1)
            if 0 <= x < W and 0 <= y < H and px[x, y][3]:
                px[x, y] = INK
    for x0 in (30,):
        y = 6
        x = x0
        while y < H - 4 and px[x, y][3]:
            px[x, y] = MUD0
            y += 1
            x += r.choice([-1, 0, 1])
    # 5) pruty výztuže trčící z lomu (rezavé, ohnuté)
    for x0 in (10, 15, 21):
        y = edge[x0]
        h = r.randint(3, 6)
        bend = r.choice([-1, 1])
        for k in range(h):
            x = x0 + (bend * (k // 3))
            if 0 <= x < W and 0 <= y - k - 1 < H:
                px[x, y - k - 1] = RUST if k % 2 else RUST2
    # 6) ohnutá hlaveň (přední strana): visí z průzoru dolů
    if not back:
        for y in range(19, 26):
            for x in range(22, 26):
                if px[x, y] in (CON0, CON1, (102, 109, 112, 255), (138, 146, 149, 255)):
                    px[x, y] = INK
        for k, (x, y) in enumerate([(24, 19), (25, 20), (25, 21), (26, 22), (27, 23)]):
            px[x, y] = (102, 109, 112, 255)
    # 7) sutiny u paty a kusy betonu kolem
    for _ in range(12):
        x, y = r.randint(3, 26), r.randint(H - 5, H - 1)
        w = r.choice([1, 2, 2, 3])
        col = r.choice([CON1, CON2, CON0])
        for i in range(w):
            if x + i < W:
                if not px[x + i, y][3] or r.random() < 0.5:
                    px[x + i, y] = col
                    if y + 1 < H and not px[x + i, y + 1][3]:
                        px[x + i, y + 1] = MUD0
    # 8) doutnající uhlíky v díře
    for x, y in [(13, edge[13] + 2), (18, edge[18] + 1)]:
        if 0 <= y < H:
            px[x, y] = FIRE
    im.save(out)
    return out


if __name__ == "__main__":
    for name, seed, back in (("pillbox", 7, False), ("pillbox_back", 11, True)):
        out = os.path.join(SRC, f"{name}_ruin.png")
        ruin(name, out, seed, back)
        Image.open(out).save(os.path.join(os.path.dirname(__file__), f"{name}_ruin.png"))
        print(out)
