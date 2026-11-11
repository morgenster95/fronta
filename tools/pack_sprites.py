#!/usr/bin/env python3
"""Složí všechny sprity vojáků do jednoho obrázku (atlasu), aby je web stáhl jedním dotazem místo ~390.

  python tools/pack_sprites.py     → web/public/assets/soldiers/atlas.png + atlas.json

Spustit po každé změně PNG ve web/public/assets/soldiers/ (nový sprite, nová animace). Test v `npm test` hlídá,
že atlas odpovídá souborům. Web umí i soubory, které v atlasu chybí (načte je jednotlivě), takže nic nespadne,
jen se načítá pomaleji. Jednotlivé PNG zůstávají zdrojem pravdy (editor, kontrola sprite_qa.py).
"""
import glob, hashlib, json, os
from PIL import Image

DIR = os.path.join(os.path.dirname(__file__), '..', 'web', 'public', 'assets', 'soldiers')
PAD = 1      # průhledný okraj kolem každého snímku (žádné prosakování sousedů při zvětšení)
WIDTH = 1024

def main():
    files = sorted(f for f in glob.glob(os.path.join(DIR, '*.png')) if os.path.basename(f) != 'atlas.png')
    imgs = [(os.path.basename(f), Image.open(f).convert('RGBA')) for f in files]
    # police podle výšky (stejně vysoké snímky vedle sebe)
    imgs.sort(key=lambda x: (-x[1].height, x[0]))
    x = y = shelf = 0
    frames = {}
    for name, im in imgs:
        w, h = im.width + 2 * PAD, im.height + 2 * PAD
        if x + w > WIDTH:
            x, y, shelf = 0, y + shelf, 0
        frames[name] = [x + PAD, y + PAD, im.width, im.height]
        x += w
        shelf = max(shelf, h)
    atlas = Image.new('RGBA', (WIDTH, y + shelf), (0, 0, 0, 0))
    for name, im in imgs:
        fx, fy, _, _ = frames[name]
        atlas.paste(im, (fx, fy))
    out = os.path.join(DIR, 'atlas.png')
    atlas.save(out, optimize=True)
    digest = hashlib.sha1()
    for f in files:
        digest.update(os.path.basename(f).encode()); digest.update(open(f, 'rb').read())
    json.dump({'_v': digest.hexdigest()[:12], 'image': 'atlas.png', 'size': list(atlas.size), 'frames': dict(sorted(frames.items()))},
              open(os.path.join(DIR, 'atlas.json'), 'w'), separators=(',', ':'))
    print(f'atlas: {len(frames)} snímků, {atlas.size[0]}×{atlas.size[1]} px, {os.path.getsize(out) // 1024} kB '
          f'(jednotlivě {sum(os.path.getsize(f) for f in files) // 1024} kB)')

if __name__ == '__main__':
    main()
