"""Atlas spritů vojáků: všechny PNG z web/public/assets/soldiers/ slepí do jednoho obrázku (atlas.png) + atlas.json s pozicemi.
Web pak místo ~390 samostatných požadavků stáhne 2 soubory (na mobilu na 4G se načtení zkrátilo z ~8 s). Vzhled se nemění:
web/src/main.js každý sprite z atlasu vyřízne do vlastního plátna, takže se chová jako samostatný obrázek.
Po každé změně spritů spusť znovu:  python tools/make-atlas.py   (npm test hlídá, že atlas odpovídá souborům)
"""
import hashlib
import json
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR = os.path.join(ROOT, "web", "public", "assets", "soldiers")
WIDTH = 1024  # šířka atlasu; řádky se plní zleva doprava (police)


def file_hash(path):
    with open(path, "rb") as f:
        return hashlib.sha1(f.read()).hexdigest()[:12]


def main():
    files = sorted(f for f in os.listdir(DIR) if f.endswith(".png") and f != "atlas.png")
    imgs = {f: Image.open(os.path.join(DIR, f)).convert("RGBA") for f in files}
    # vyšší sprity první, ať police nemají díry
    order = sorted(files, key=lambda f: (-imgs[f].height, f))
    frames, x, y, row = {}, 0, 0, 0
    for f in order:
        w, h = imgs[f].size
        if x + w > WIDTH:
            x, y, row = 0, y + row, 0
        frames[f] = [x, y, w, h]
        x += w
        row = max(row, h)
    height = y + row
    atlas = Image.new("RGBA", (WIDTH, height), (0, 0, 0, 0))
    for f, (fx, fy, _, _) in frames.items():
        atlas.paste(imgs[f], (fx, fy))
    out = os.path.join(DIR, "atlas.png")
    atlas.save(out, optimize=True)
    meta = {
        "_": "Generuje tools/make-atlas.py. files = otisk každého spritu (npm test hlídá shodu), frames = [x, y, w, h] v atlas.png.",
        "v": file_hash(out),
        "files": {f: file_hash(os.path.join(DIR, f)) for f in files},
        "frames": {f: frames[f] for f in files},
    }
    with open(os.path.join(DIR, "atlas.json"), "w") as fh:
        json.dump(meta, fh, separators=(",", ":"))
    print(f"atlas.png {WIDTH}×{height}, {len(files)} spritů, {os.path.getsize(out) // 1024} KB")


if __name__ == "__main__":
    main()
