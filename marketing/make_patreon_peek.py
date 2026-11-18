"""Sneak peek pro patrony (18. 11. 2026): tajná složka na stole – „fotky“ připravovaného tanku a míst pro výpravy (PixelLab, zatím mimo hru),
červené razítko CLASSIFIED, šipka trasy výpravy. 1500×900 (mřížka 250×150 ×6). → marketing/promo/patreon/peek_1500x900.jpg"""
import os
import sys
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_posts import P, font, up  # noqa: E402
from day_art import planks, light, shade, paper  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H, K = 250, 150, 6


def text_c(d, cx, y, s, f, fill):
    w = d.textlength(s, font=f)
    d.text((cx - w / 2 + 1, y + 1), s, font=f, fill=P["ink"])
    d.text((cx - w / 2, y), s, font=f, fill=fill)


def photo(im, src, box, scale, rot=0):
    """fotka s bílým okrajem: obrázek z PixelLabu zmenšený na `scale`, ořezaný na obsah, s lehkým natočením"""
    x, y, w, h = box
    a = Image.open(os.path.join(ROOT, src)).convert("RGBA")
    a = a.crop(a.getbbox())
    a = a.resize((max(1, int(a.width * scale)), max(1, int(a.height * scale))), Image.LANCZOS)
    card = Image.new("RGBA", (w, h), P["pale"])
    ImageDraw.Draw(card).rectangle((3, 3, w - 4, h - 12), fill=P["mud1"])
    card.alpha_composite(a, ((w - a.width) // 2, max(3, (h - 9 - a.height) // 2)))
    if rot:
        card = card.rotate(rot, resample=Image.NEAREST, expand=True)
    sh = Image.new("RGBA", card.size, (0, 0, 0, 0))
    sh.paste((14, 13, 12, 160), mask=card.split()[3])
    im.alpha_composite(sh, (x + 2, y + 2))
    im.alpha_composite(card, (x, y))
    return card.size


def make():
    im = Image.new("RGBA", (W, H), P["dark"])
    planks(im, (0, 24, W, H), seed=7, vertical=False)
    # složka
    d = ImageDraw.Draw(im)
    d.rectangle((14, 32, 238, 146), fill=P["sand"], outline=P["mud2"])
    d.rectangle((14, 28, 70, 34), fill=P["sand"], outline=P["mud2"])
    paper(im, (22, 38, 112, 142), seed=12)
    d = ImageDraw.Draw(im)
    for i, y in enumerate(range(52, 136, 6)):
        d.line((28, y, 104 - (i * 13) % 30, y), fill=P["mud3"])
    d.rectangle((28, 66, 92, 70), fill=P["ink"])  # začerněný řádek
    d.rectangle((28, 90, 80, 94), fill=P["ink"])
    d.text((28, 42), "FIELD REPORT", font=font(8, True), fill=P["mud1"])
    # fotky: tank, zřícené město, kostel
    photo(im, "art/pixellab/test01/tank_mk4_side_128x64.png", (58, 54, 104, 56), 0.78, rot=-4)
    photo(im, "web/public/assets/locations/town.png", (150, 34, 80, 72), 0.3, rot=5)
    photo(im, "web/public/assets/locations/church.png", (172, 92, 62, 52), 0.22, rot=-6)
    d = ImageDraw.Draw(im)
    # popisky na fotkách
    d.text((68, 101), "MK IV · IN TESTING", font=font(8), fill=P["mud1"])

    text_c(d, 190, 80, "EXPEDITIONS", font(8, True), P["white"])
    # trasa výpravy (červená přerušovaná čára mezi fotkami měst)
    for t in range(0, 26, 3):
        d.point((150 + t // 2, 112 + t), fill=P["rust"]); d.point((151 + t // 2, 112 + t), fill=P["rust"])
    # razítko CLASSIFIED
    st = Image.new("RGBA", (86, 18), (0, 0, 0, 0))
    sd = ImageDraw.Draw(st)
    sd.rectangle((0, 0, 85, 17), outline=P["rust"]); sd.rectangle((1, 1, 84, 16), outline=P["rust"])
    sd.text((7, 5), "CLASSIFIED", font=font(8, True), fill=P["rust"])
    st = st.rotate(12, resample=Image.NEAREST, expand=True)
    im.alpha_composite(st, (24, 112))
    light(im, 130, 70, 150, strength=0.35, steps=3)
    shade(im, (0, 24, W, H), strength=0.5)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, W, 24), fill=P["dark"]); d.line((0, 24, W, 24), fill=P["gold"])
    text_c(d, W // 2, 7, "SNEAK PEEK · FOR PATRONS", font(8, True), P["gold"])
    out = os.path.join(ROOT, "marketing", "promo", "patreon", "peek_1500x900.jpg")
    up(im, K).convert("RGB").save(out, quality=95, subsampling=0)
    print(out)


if __name__ == "__main__":
    make()
