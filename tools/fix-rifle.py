"""Dokreslí pušku do snímků animace, kde zmizela (PixelLab ji občas na pár snímků ztratí).

  python tools/fix-rifle.py <klíč> <animace> <směr> [--x X] [--mirror west]

Najde snímek s nejvíc pixely pažby (rezavé barvy palety), z něj vezme sloupec pušky (medián x) a výšku.
Snímkům, kde pažba skoro chybí (< 30 % referenčního), dokreslí pušku opřenou svisle o zem vedle vojáka
(hlaveň tmavá, pažba rezavá, chodidla na řádku 46 plátna 64), POD postavu, takže ji tělo překryje.
--mirror west: po opravě přepíše západní směr zrcadlem východního.
"""
import json, os, sys, statistics
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOLD = os.path.join(ROOT, "web", "public", "assets", "soldiers")
RUST = {(0x7e, 0x3b, 0x2a), (0x5c, 0x2a, 0x22), (0xa8, 0x5a, 0x36)}
FOOT = 46


def rust_px(im):
    px = im.load()
    return [(x, y) for y in range(im.height) for x in range(im.width) if px[x, y][3] > 0 and px[x, y][:3] in RUST]


def rifle_layer(size, x, top):
    lay = Image.new("RGBA", size, (0, 0, 0, 0))
    p = lay.load()
    for y in range(top, FOOT + 1):
        stock = y >= top + 10
        p[x, y] = ((0x7e, 0x3b, 0x2a) if stock else (0x4a, 0x4f, 0x52)) + (255,)
        p[x + 1, y] = ((0x5c, 0x2a, 0x22) if stock else (0x2a, 0x31, 0x38)) + (255,)
    p[x, top - 1] = (0x66, 0x6d, 0x70, 255)  # bajonet/hlaveň špička
    return lay


def main():
    a = sys.argv[1:]
    key, anim, d = a[:3]
    man = json.load(open(os.path.join(SOLD, "manifest.json")))
    files = man[key]["anims"][anim][d]
    ims = [Image.open(os.path.join(SOLD, f)).convert("RGBA") for f in files]
    counts = [len(rust_px(i)) for i in ims]
    ref = max(range(len(ims)), key=lambda i: counts[i])
    rp = rust_px(ims[ref])
    x = int(a[a.index("--x") + 1]) if "--x" in a else int(statistics.median(p[0] for p in rp))
    top = FOOT - int(a[a.index("--h") + 1]) if "--h" in a else FOOT - 22  # puška po rameno (postava 30 px)
    fixed = 0
    for f, im, n in zip(files, ims, counts):
        if n >= 0.3 * counts[ref]:
            continue
        out = rifle_layer(im.size, x, top)
        out.alpha_composite(im)
        out.save(os.path.join(SOLD, f))
        fixed += 1
    print(f"{key} {anim} {d}: puška x={x} od řádku {top}, dokresleno {fixed} snímků (reference snímek {ref})")
    if "--mirror" in a:
        m = a[a.index("--mirror") + 1]
        for fe, fw in zip(files, man[key]["anims"][anim][m]):
            Image.open(os.path.join(SOLD, fe)).transpose(Image.FLIP_LEFT_RIGHT).save(os.path.join(SOLD, fw))


if __name__ == "__main__":
    main()
