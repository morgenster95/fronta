"""Odstraní pušku ze snímků animace (na přání: plazení bez pušky, granát bez pušky, krčení bez blikající pušky…).

  python tools/strip-rifle.py <klíč> <animace> <směr> [--frames 3,4,5] [--steel]

1) smaže pažbu (rezavé barvy palety 7e3b2a, 5c2a22) a bajonet (c4b8a0, e3d9c3),
   s --steel i hlaveň (2a3138, 4a4f52, 666d70); jen u Concordu, Hegemonie má ocelové barvy i na kabátě,
2) postupně ořeže tenké visící čáry (pixel s nejvýš 1 sousedem, 8 kol), tím zmizí zbytek hlavně,
3) smaže malé odtržené kousky (do 6 px).
"""
import json, os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sprite_qa import islands  # noqa: E402

SOLD = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "web", "public", "assets", "soldiers")
h = lambda s: tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))
BASE = {h(c) for c in ("7e3b2a", "5c2a22", "c4b8a0", "e3d9c3")}
STEEL = {h(c) for c in ("2a3138", "4a4f52", "666d70")}


def strip(im, steel):
    px = im.load()
    W, H = im.size
    kill = BASE | (STEEL if steel else set())
    for y in range(H):
        for x in range(W):
            if px[x, y][3] and px[x, y][:3] in kill:
                px[x, y] = (0, 0, 0, 0)
    for _ in range(8):
        dead = []
        for y in range(H):
            for x in range(W):
                if not px[x, y][3]:
                    continue
                n = sum(1 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)) if 0 <= x + dx < W and 0 <= y + dy < H and px[x + dx, y + dy][3])
                if n <= 1:
                    dead.append((x, y))
        if not dead:
            break
        for x, y in dead:
            px[x, y] = (0, 0, 0, 0)
    comps = sorted(islands(im), key=len, reverse=True)
    for c in comps[1:]:
        if len(c) <= 6:
            for x, y in c:
                px[x, y] = (0, 0, 0, 0)
    return im


def main():
    a = sys.argv[1:]
    key, anim, d = a[:3]
    man = json.load(open(os.path.join(SOLD, "manifest.json")))
    files = man[key]["anims"][anim][d]
    only = {int(x) for x in a[a.index("--frames") + 1].split(",")} if "--frames" in a else None
    for i, f in enumerate(files):
        if only is not None and i not in only:
            continue
        p = os.path.join(SOLD, f)
        strip(Image.open(p).convert("RGBA"), "--steel" in a).save(p)
    print(f"{key} {anim} {d}: puška odstraněna ({'snímky ' + str(sorted(only)) if only else 'všechny snímky'})")
    if "--mirror" in a:
        m = a[a.index("--mirror") + 1]
        for fe, fw in zip(files, man[key]["anims"][anim][m]):
            Image.open(os.path.join(SOLD, fe)).transpose(Image.FLIP_LEFT_RIGHT).save(os.path.join(SOLD, fw))


if __name__ == "__main__":
    main()
