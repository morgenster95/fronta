"""Story (1080×1920) ke každému novému příspěvku nebo reelu. Kreslí se v mřížce 216×384 ×5 (jako posty).
  image post (1080×1350): post uprostřed na tmavém pozadí, nahoře „NEW POST“, dole „OPEN OUR PROFILE“
  reel (snímek z videa 1080×1920): snímek přes celou plochu a v dolní třetině (mimo spodní lištu IG) text „NEW REEL“
Použití: python marketing/make_story.py <zdroj.jpg|png> <výstup.jpg> <post|reel> ["Titulek"]
Instagram API u stories neumí odkaz ani nálepku, proto text odkazuje na profil / poslední příspěvek.
"""
import os
import sys

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_posts import P, K, font, text_c, up  # noqa: E402
from day_art import grad, shade  # noqa: E402

GW, GH = 216, 384


def make(src, out, kind="post", title=None):
    im = Image.open(src).convert("RGB")
    st = Image.new("RGBA", (GW, GH), P["ink"] + (255,))
    if kind == "reel":
        # snímek ze záběru 180×320 (cinematic, ×6) nebo z videa 1080×1920 (×5, na snímku bývají titulky: raději čistý záběr)
        gw, gh, k = (180, 320, 6) if im.size == (180, 320) else (GW, GH, K)
        st = im.resize((gw, gh), Image.NEAREST).convert("RGBA")
        shade(st, (0, int(gh * 0.38), gw, int(gh * 0.52)), strength=0.5)
        d = ImageDraw.Draw(st)
        y0 = int(gh * 0.39)  # nad horizontem, mezi titulkem a obrazem (mimo spodní lištu IG)
        d.rectangle((gw // 2 - 70, y0, gw // 2 + 70, y0 + 40), fill=P["dark"], outline=P["gold"])
        text_c(d, gw // 2, y0 + 5, "NEW REEL", font(14, True), P["gold"])
        text_c(d, gw // 2, y0 + 26, title or "NOW ON OUR PROFILE", font(8), P["pale"])
        up(st, k).convert("RGB").save(out, quality=95, subsampling=0)
        print(out)
        return
    else:
        grad(st, (0, 0, GW, GH), [P["ink"], P["dark"], P["mud0"]])
        shade(st, (0, 0, GW, GH), strength=0.4)
        d = ImageDraw.Draw(st)
        post = im.resize((GW, 270), Image.NEAREST).convert("RGBA")
        d.rectangle((3, 55, GW - 4, 56 + 271), fill=P["gold"])
        st.alpha_composite(post, (0, 57))
        d = ImageDraw.Draw(st)
        text_c(d, GW // 2, 22, "NEW POST", font(14, True), P["gold"])
        text_c(d, GW // 2, 40, title or "ON OUR PROFILE", font(8), P["pale"])
        text_c(d, GW // 2, 340, "OPEN OUR LATEST POST", font(8, True), P["white"])
    up(st, K).convert("RGB").save(out, quality=95, subsampling=0)
    print(out)


if __name__ == "__main__":
    a = sys.argv[1:]
    make(a[0], a[1], a[2] if len(a) > 2 else "post", a[3] if len(a) > 3 else None)
