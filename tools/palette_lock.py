"""Zamkne barvy animací na paletu základní postavy, aby postavy při střídání póz neblikaly jinými odstíny.

Paleta = všechny barvy v 8 rotacích dané postavy (manifest.json). Každý pixel snímků animací (a snímků zamíření
aim_<klíč>_*.png) se převede na nejbližší barvu z té palety. Rotace samotné se nemění.

Použití: python tools/palette_lock.py [web/public/assets/soldiers]
"""
import glob
import json
import os
import sys

from PIL import Image

DIRS = ["south", "south-east", "east", "north-east", "north", "north-west", "west", "south-west"]


def palette_of(paths):
    cols = set()
    for p in paths:
        for px in Image.open(p).convert("RGBA").getdata():
            if px[3] >= 128:
                cols.add(px[:3])
    return list(cols)


def nearest(c, pal, cache):
    if c in cache:
        return cache[c]
    r, g, b = c
    # vážená vzdálenost (oko je citlivější na zelenou)
    best = min(pal, key=lambda p: 2 * (p[0] - r) ** 2 + 4 * (p[1] - g) ** 2 + 3 * (p[2] - b) ** 2)
    cache[c] = best
    return best


def lock(path, pal):
    im = Image.open(path).convert("RGBA")
    cache = {}
    data = []
    changed = 0
    for px in im.getdata():
        if px[3] < 128:
            data.append((0, 0, 0, 0))
            continue
        n = nearest(px[:3], pal, cache)
        changed += n != px[:3]
        data.append((*n, 255))
    im.putdata(data)
    im.save(path)
    return changed


def main():
    root = sys.argv[1] if len(sys.argv) > 1 else "web/public/assets/soldiers"
    manifest = json.load(open(os.path.join(root, "manifest.json"), encoding="utf-8"))
    total = 0
    for key, m in manifest.items():
        if key.startswith("_"):
            continue
        rot = [os.path.join(root, m[d]) for d in DIRS if d in m]
        if not rot:
            continue
        pal = palette_of(rot)
        files = [os.path.join(root, f) for a in (m.get("anims") or {}).values() for fs in a.values() for f in fs]
        files += glob.glob(os.path.join(root, f"aim_{key}_*.png"))
        n = sum(lock(f, pal) for f in files)
        total += n
        print(f"{key}: paleta {len(pal)} barev, {len(files)} snímků, přebarveno {n} px")
    print(f"celkem přebarveno {total} px")


if __name__ == "__main__":
    main()
