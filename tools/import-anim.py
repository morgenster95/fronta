"""Import animace z PixelLabu do hry.

  python tools/import-anim.py <adresář se snímky frame_*.png> <klíč postavy> <animace> <směr> [--rot rotace.png] [--canvas 48] [--mirror west]

- PixelLab vrací snímky na větším plátně (postava + místo na pohyb, často nesouměrně, např. 52×48).
  Tady se postava zarovná: chodidla (spodní okraj neprůhledných pixelů 1. snímku) na řádek 30 + off a vodorovně na střed
  podle rotace postavy (32×32, chodidla na řádku 30). Výsledné plátno je čtverec `canvas` (výchozí 48), rozšířený souměrně,
  takže engine kotví stejně jako u ostatních animací (life.js setTex: (30 + off) / výška).
- Barvy se převedou na nejbližší barvu palety Trench 24, alfa jen 0/255.
- Snímky se uloží jako web/public/assets/soldiers/<klíč>@<animace>_<směr>_<n>.png a doplní se do manifest.json (anims).
- --mirror west: z výsledku vznikne zrcadlený směr (např. east → west) zdarma.
Po importu spusť python tools/make-atlas.py a npm test.
"""
import glob, json, os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOLD = os.path.join(ROOT, "web", "public", "assets", "soldiers")
PAL = [tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) for h in open(os.path.join(ROOT, "art", "palette", "trench24.hex")).read().split()]


def nearest(c):
    return min(PAL, key=lambda p: (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2)


def quantize(im):
    im = im.convert("RGBA")
    px = im.load()
    cache = {}
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a < 128:
                px[x, y] = (0, 0, 0, 0)
            else:
                k = (r, g, b)
                if k not in cache:
                    cache[k] = nearest(k)
                px[x, y] = cache[k] + (255,)
    return im


def main():
    args = sys.argv[1:]
    opt = lambda k, d=None: args[args.index(k) + 1] if k in args else d
    src, key, anim, d = args[:4]
    canvas = int(opt("--canvas", 48))
    mirror = opt("--mirror")
    frames = [Image.open(f).convert("RGBA") for f in sorted(glob.glob(os.path.join(src, "frame_*.png")))]
    if not frames:
        sys.exit(f"žádné snímky v {src}")
    # chodidla 1. snímku (klidová póza) → řádek 30 + off; střed postavy 1. snímku → střed plátna
    bb = frames[0].getbbox()
    off = (canvas - 32) // 2
    foot = bb[3]  # řádek pod posledním neprůhledným pixelem
    cx = (bb[0] + bb[2]) // 2
    dx, dy = canvas // 2 - cx, (30 + off + 1) - foot
    out = []
    for f in frames:
        c = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
        c.alpha_composite(f, (max(0, dx), max(0, dy)), (max(0, -dx), max(0, -dy)))
        out.append(quantize(c))
    man_p = os.path.join(SOLD, "manifest.json")
    man = json.load(open(man_p))
    for direction, ims in [(d, out)] + ([(mirror, [i.transpose(Image.FLIP_LEFT_RIGHT) for i in out])] if mirror else []):
        names = []
        for n, im in enumerate(ims):
            name = f"{key}@{anim}_{direction}_{n}.png"
            im.save(os.path.join(SOLD, name))
            names.append(name)
        man.setdefault(key, {}).setdefault("anims", {}).setdefault(anim, {})[direction] = names
        print(f"{key} {anim} {direction}: {len(names)} snímků, plátno {canvas}")
    json.dump(man, open(man_p, "w"), indent=1)


if __name__ == "__main__":
    main()
