"""Automatické opravy spritů: smaže odtržené kousky (plovoucí pixely) do --max px.

Použití: python tools/sprite_fix.py <vstup.png ...> --out art/pixellab/fixed [--max 4] [--baseline]
--baseline posune sprite svisle (bez škálování), aby chodidla byla na předposledním řádku (kotva enginu).
Výsledek zkontroluj okem (tools/sprite_qa.py --sheet), velký odtržený kus může být záměr (např. jiskra, kouř).
"""
import argparse
import glob
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
    ap.add_argument("--baseline", action="store_true")
    a = ap.parse_args()
    # Windows shell (npm) neexpanduje hvězdičky → expanduj tady
    a.files = [g for f in a.files for g in (sorted(glob.glob(f)) or [f])]
    os.makedirs(a.out, exist_ok=True)
    for f in a.files:
        if "@" in os.path.basename(f):
            continue  # snímky animací se neposouvají jednotlivě (rozjely by se)
        im = Image.open(f).convert("RGBA")
        removed = 0
        for comp in islands(im)[1:]:
            if len(comp) <= a.max:
                for p in comp:
                    im.putpixel(p, (0, 0, 0, 0))
                removed += len(comp)
        shift = 0
        bbox = im.getbbox()
        if a.baseline and bbox:
            shift = (im.height - 1) - bbox[3]  # kladné = dolů
            if shift < 0 and bbox[1] + shift < 0:
                shift = -bbox[1]  # nahoře není místo, posuň aspoň co jde
            if shift:
                moved = Image.new("RGBA", im.size, (0, 0, 0, 0))
                moved.paste(im, (0, shift))
                im = moved
        if removed or shift:
            dst = os.path.join(a.out, os.path.basename(f))
            im.save(dst)
            print(f"{dst}: smazáno {removed} px, posun {shift:+d} px")


if __name__ == "__main__":
    main()
