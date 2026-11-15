"""Náhledový obrázek (cover) reelu 1080×1920: čistý snímek ze záběru a velký titulek „DAY N“ s podtitulem.
Titulek je ve středu obrazu, takže zůstane vidět i v mřížce profilu (IG ořízne na 3:4 uprostřed).
Použití: python marketing/make_cover.py <snimek 1080×1920> <vystup.jpg> "DAY 5" "THE WIRING PARTY"
Číslo dne: Day reel nese číslo dne podle kalendáře (14. 11. = Day 5, 15. 11. = Day 6), viz CLAUDE.md.
"""
import os
import sys

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_posts import P, K, font, text_c, up  # noqa: E402
from day_art import shade  # noqa: E402

GW, GH = 216, 384


def make(src, out, title, sub=None):
    st = Image.open(src).convert("RGB").resize((GW, GH), Image.NEAREST).convert("RGBA")
    shade(st, (0, 120, GW, 210), strength=0.6)
    d = ImageDraw.Draw(st)
    d.rectangle((14, 128, GW - 15, 128 + (62 if sub else 40)), fill=P["ink"], outline=P["gold"])
    text_c(d, GW // 2, 134, title, font(24, True), P["gold"])
    if sub:
        text_c(d, GW // 2, 170, sub, font(8, True), P["white"])
    up(st, K).convert("RGB").save(out, quality=95, subsampling=0)
    print(out)


if __name__ == "__main__":
    make(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4] if len(sys.argv) > 4 else None)
