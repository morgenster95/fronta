"""Automatické opravy spritů: smaže odtržené kousky (plovoucí pixely) do --max px.

Použití: python tools/sprite_fix.py <vstup.png ...> --out art/pixellab/fixed [--max 4]
Výsledek zkontroluj okem (tools/sprite_qa.py --sheet), velký odtržený kus může být záměr (např. jiskra, kouř).
"""
import argparse
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from sprite_qa import islands  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="+")
    ap.add_argument("--out", required=True)
    ap.add_argument("--max", type=int, default=4)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    for f in a.files:
        im = Image.open(f).convert("RGBA")
        removed = 0
        for comp in islands(im)[1:]:
            if len(comp) <= a.max:
                for p in comp:
                    im.putpixel(p, (0, 0, 0, 0))
                removed += len(comp)
        if removed:
            dst = os.path.join(a.out, os.path.basename(f))
            im.save(dst)
            print(f"{dst}: smazáno {removed} px")


if __name__ == "__main__":
    main()
