"""Kontrola pixel art spritů: odtržené kousky, poloprůhledné pixely, barvy mimo paletu.

Použití: python tools/sprite_qa.py <sprite.png ...> [--height 30] [--palette art/palette/trench24.hex] [--sheet out.png]
Odtržený kousek (ostrov) typicky znamená přerušenou zbraň: hlaveň oddělená od pažby průhlednou mezerou.
"""
import argparse
import sys
from collections import deque

from PIL import Image, ImageDraw


def islands(im):
    w, h = im.size
    px = im.load()
    seen = set()
    comps = []
    for y in range(h):
        for x in range(w):
            if px[x, y][3] < 128 or (x, y) in seen:
                continue
            q = deque([(x, y)])
            seen.add((x, y))
            comp = []
            while q:
                cx, cy = q.popleft()
                comp.append((cx, cy))
                # 4-sousedství: diagonální dotyk se nepočítá jako spojení
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in seen and px[nx, ny][3] >= 128:
                        seen.add((nx, ny))
                        q.append((nx, ny))
            comps.append(comp)
    comps.sort(key=len, reverse=True)
    return comps


def check(path, palette, height=None):
    im = Image.open(path).convert("RGBA")
    issues = []
    comps = islands(im)
    for c in comps[1:]:
        xs = [p[0] for p in c]
        ys = [p[1] for p in c]
        issues.append(f"odtržený kousek {len(c)} px v x{min(xs)}-{max(xs)} y{min(ys)}-{max(ys)}")
    px = im.load()
    w, h = im.size
    # díry: průhledné pixely uzavřené uvnitř siluety (nespojené s okrajem plátna)
    outside = set()
    q = deque((x, y) for x in range(w) for y in (0, h - 1)) + deque((x, y) for y in range(h) for x in (0, w - 1))
    while q:
        x, y = q.popleft()
        if (x, y) in outside or not (0 <= x < w and 0 <= y < h) or px[x, y][3] >= 128:
            continue
        outside.add((x, y))
        q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    holes = [(x, y) for y in range(h) for x in range(w) if px[x, y][3] < 128 and (x, y) not in outside]
    if holes:
        issues.append(f"{len(holes)} průhledných děr uvnitř siluety, např. {holes[:4]}")
    # zářezy: průhledný pixel obklopený ze 3 stran (mezera mezi zbraní a tělem / hlavní a pažbou)
    notches = []
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            if px[x, y][3] < 128 and sum(px[nx, ny][3] >= 128 for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1))) >= 3:
                notches.append((x, y))
    if notches:
        issues.append(f"{len(notches)} zářezů (průhledný pixel ze 3 stran obklopený), např. {notches[:4]}")
    comps.append(holes + notches)  # zvýrazní se v archu
    semi = sum(1 for p in im.getdata() if 0 < p[3] < 255)
    if semi:
        issues.append(f"{semi} poloprůhledných pixelů (alfa musí být 0/255)")
    if palette:
        off = {p[:3] for p in im.getdata() if p[3] >= 128 and p[:3] not in palette}
        if off:
            issues.append(f"{len(off)} barev mimo paletu")
    bbox = im.getbbox()
    if bbox and height:
        # chodidla musí být na předposledním řádku (kotva enginu); výška ±1 px kvůli čepici/přilbě
        if bbox[3] != im.height - 1:
            issues.append(f"chodidla na řádku {bbox[3] - 1}, mají být na {im.height - 2}")
        if abs(bbox[3] - bbox[1] - height) > 1:
            issues.append(f"výška postavy {bbox[3] - bbox[1]} px, má být {height} ±1 px")
    if bbox:
        issues.append(f"info: výška postavy {bbox[3] - bbox[1]} px, spodní řádek {bbox[3] - 1}")
    return im, comps, issues


def sheet(results, out, s=12):
    w = sum(im.width * s + s for im, _, _ in results)
    h = max(im.height for im, _, _ in results) * s
    c = Image.new("RGBA", (w, h), (255, 0, 255, 255))
    d = ImageDraw.Draw(c)
    x0 = 0
    for im, comps, _ in results:
        c.alpha_composite(im.resize((im.width * s, im.height * s), Image.NEAREST), (x0, 0))
        for k in range(im.width + 1):
            d.line([(x0 + k * s, 0), (x0 + k * s, im.height * s)], fill=(0, 0, 0, 50))
        for k in range(im.height + 1):
            d.line([(x0, k * s), (x0 + im.width * s, k * s)], fill=(0, 0, 0, 50))
        for comp in comps[1:]:
            for px, py in comp:
                d.rectangle([x0 + px * s, py * s, x0 + px * s + s - 1, py * s + s - 1], outline=(0, 255, 0, 255), width=2)
        x0 += im.width * s + s
    c.save(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="+")
    ap.add_argument("--palette")
    ap.add_argument("--sheet")
    ap.add_argument("--height", type=int, help="požadovaná výška postavy v px (voják: 30)")
    a = ap.parse_args()
    palette = None
    if a.palette:
        palette = {tuple(int(l[i:i + 2], 16) for i in (0, 2, 4)) for l in open(a.palette).read().split()}
    results = []
    bad = 0
    for f in a.files:
        r = check(f, palette, a.height)
        results.append(r)
        errs = [i for i in r[2] if not i.startswith("info")]
        bad += bool(errs)
        print(("FAIL " if errs else "ok   ") + f)
        for i in r[2]:
            print("     " + i)
    if a.sheet:
        sheet(results, a.sheet)
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
