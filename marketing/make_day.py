"""Denní posty z ranního vydání (Mud & Iron): seznam raněných, obvaziště a hlasování o stavbě.

Kreslí se ze skutečného stavu PO denním tahu (data/state.json), takže jména sedí s Gazette.
Použití (z kořene repa):
  node tools/shot-hospital.mjs (běžící vite) → promo/hosp_0.png, hosp_1.png (obvaziště ze hry, volitelné)
  python marketing/make_day.py casualties [state.json]   → marketing/promo/day<N>_wounded_1.jpg, _2.jpg, _3.jpg
  python marketing/make_day.py vote                      → marketing/promo/vote_build_1.jpg
"""
import json
import os
import sys

from PIL import Image, ImageDraw

import day_art as A
from make_posts import P, HEG, CON, W, H, K, ROOT, font, vt, up, text_c, sky, wire, mud, canvas, frame, footer

PROMO = os.path.join(ROOT, "marketing", "promo")
SOLD = os.path.join(ROOT, "web", "public", "assets", "soldiers")
LOC = os.path.join(ROOT, "web", "public", "assets", "locations")
SIDES = [("HEGEMONY", HEG, "hegemony"), ("CONCORD", CON, "concord")]
SEV = {"light": ("GRAZED", P["pale"]), "heavy": ("BADLY WOUNDED", P["gold"]), "crit": ("GRAVELY WOUNDED", P["fire"])}
PLACE = {"bed": "in a bed", "stretcher": "on a stretcher", "trench": "in the trench"}


def save(im, name):
    up(im, K).convert("RGB").save(os.path.join(PROMO, name), quality=92)
    return name


def fit(d, s, f, w):
    while d.textlength(s, font=f) > w and len(s) > 4:
        s = s[:-2] + "…"
    return s


def today(state):
    """raněni a padlí z dnešního tahu, po stranách (nejvážnější první)"""
    day = state["day"]
    out = [[], []]
    for x in state["soldiers"]:
        w = x.get("wound")
        if w and w.get("day") == day:
            out[x["faction"]].append({"handle": x["handle"], "sev": w["sev"], "place": w.get("place") or "trench",
                                      "by": (w.get("by") or {}).get("handle"), "shell": w.get("shell")})
        for f in x.get("fallen") or []:
            if f.get("day") == day:
                out[x["faction"]].append({"handle": x["handle"], "sev": "dead", "place": None, "by": None, "name": f.get("name")})
    rank = {"dead": 0, "crit": 1, "heavy": 2, "light": 3}
    for lst in out:
        lst.sort(key=lambda r: rank[r["sev"]])
    return day, out


def x2(scene):
    """scéna v polovičním rozlišení → plátno plakátu 216×270"""
    return scene.resize((scene.width * 2, scene.height * 2), Image.NEAREST).convert("RGBA")


def band(im, y0, y1, alpha=210):
    ov = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    for y in range(y0, y1):
        d.line((0, y, im.width, y), fill=P["ink"] + (alpha,))
    im.alpha_composite(ov)
    return ImageDraw.Draw(im)


def slide_list(day, out):
    """1) soumrak, nosiči s raněným; pod tím list z Gazette se jmény"""
    im = canvas()
    im.alpha_composite(x2(A.dusk2(108, 44)), (0, 0))
    d = band(im, 0, 30, 150)
    text_c(d, W // 2, 5, "CASUALTIES", font(16, True), P["white"])
    text_c(d, W // 2, 22, f"DAY {day} ON VERDEL RIDGE", font(8), P["gold"])
    A.paper(im, (10, 92, W - 11, H - 32), seed=day)
    d = ImageDraw.Draw(im)
    ink, red, soft = P["ink"], P["rust"], P["mud2"]
    text_c(d, W // 2, 96, "ROLL OF THE WOUNDED", font(8, True), soft, shadow=None)
    d.line((16, 107, W - 17, 107), fill=ink)
    y = 111
    for f, (name, col, _) in enumerate(SIDES):
        rows = out[f]
        d.text((16, y), name, font=font(8, True), fill=ink)
        cnt = f"{len(rows)} HIT" if rows else "NOBODY HIT"
        d.text((W - 16 - d.textlength(cnt, font=font(8)), y), cnt, font=font(8), fill=soft)
        y += 11
        show = rows[:3]
        for r in show:
            if r["sev"] == "dead":
                tag, where = "FELL", "THE HOUSE FIGHTS ON"
            else:
                tag, where = SEV[r["sev"]][0], PLACE.get(r["place"], "")
            d.text((18, y - 3), fit(d, f"@{r['handle']}", vt(16), 110), font=vt(16), fill=ink)
            d.text((W - 16 - d.textlength(tag, font=font(8)), y), tag, font=font(8), fill=red if r["sev"] != "light" else soft)
            how = f"shot by @{r['by']}" if r["by"] else "shellfire" if r.get("shell") else "stray bullet"
            d.text((20, y + 7), fit(d, how, vt(14), W - 44 - d.textlength(where, font=vt(14))), font=vt(14), fill=soft)
            d.text((W - 16 - d.textlength(where, font=vt(14)), y + 7), where, font=vt(14), fill=soft)
            y += 19
        if len(rows) > len(show):
            d.text((20, y - 3), f"+ {len(rows) - len(show)} more in the Gazette (link in bio)", font=vt(14), fill=soft)
            y += 10
        if f == 0:
            d.line((16, y, W - 17, y), fill=P["bone"])
            y += 4
    text_c(d, W // 2, H - 26, "IS YOUR NAME HERE? LINK IN BIO", font(8, True), P["gold"])
    footer(d, H - 14)
    return save(im, f"day{day}_wounded_1.jpg")


def slide_aidpost(day, state, f, shot=None):
    """2–3) obvaziště strany: snímek přímo ze hry (tools/shot-hospital.mjs, jména jsou na cedulkách ve hře),
    bez snímku kreslený interiér; nahoře stav lůžek, dole co to znamená"""
    name, col, _ = SIDES[f]
    by_id = {x["id"]: x for x in state["soldiers"]}
    beds = [by_id[i] for i in state["battle"]["sides"][f]["beds"] if i in by_id]
    stretch = [x for x in state["soldiers"] if x["faction"] == f and (x.get("wound") or {}).get("place") == "stretcher"]
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)) if shot else x2(A.interior2(f, beds, len(stretch), seed=7 + f))
    d = band(im, 0, 30, 200)
    text_c(d, W // 2, 4, f"{name} AID POST", font(8, True), col)
    full = len(beds) >= 2
    text_c(d, W // 2, 15, f"BEDS {len(beds)}/2" + (" · FULL" if full else ""), font(8, True), P["fire"] if full else P["white"])
    if not shot:
        for i in range(2):
            who = beds[i] if i < len(beds) else None
            A.tag(d, 6 + i * 106, 146, 98, fit(d, f"@{who['handle']}" if who else "empty bed", vt(14), 94), vt(14))
        if stretch:
            A.tag(d, 40, 232, 110, fit(d, f"@{stretch[0]['handle']}" + (f" +{len(stretch) - 1}" if len(stretch) > 1 else ""), vt(14), 104), vt(14))
    d = band(im, H - 34, H, 215)
    msg = f"{len(stretch)} WAITING ON STRETCHERS" if stretch else "NEXT ONE BADLY HIT: A STRETCHER" if full else "A BED IS STILL FREE"
    text_c(d, W // 2, H - 31, msg, font(8, True), P["gold"] if full or stretch else P["pale"])
    text_c(d, W // 2, H - 20, "A HOSPITAL HAS 4 BEDS. VOTE TODAY", font(8), P["white"])
    footer(d, H - 10)
    out = f"day{day}_wounded_{2 + f}.jpg"
    if shot:  # texty v pixelové mřížce přes snímek ze hry (1080×1350)
        base = Image.open(shot).convert("RGBA").resize((W * K, H * K))
        base.alpha_composite(up(im, K))
        base.convert("RGB").save(os.path.join(PROMO, out), quality=92)
        return out
    return save(im, out)


def slide_vote():
    im = canvas()
    d = ImageDraw.Draw(im)
    text_c(d, W // 2, 6, "YOUR SIDE", font(16, True), P["white"])
    text_c(d, W // 2, 22, "BUILDS ONE", font(16, True), P["gold"])
    text_c(d, W // 2, 40, "EACH SIDE VOTES FOR ITSELF", font(8), P["pale"])
    opts = [
        ("HOSPITAL", "4 beds, not 2.", "Fewer die.", A.tile_hospital),
        ("WIRE", "Fewer men hit.", "Wears out.", A.tile_wire),
        ("SANDBAGS", "Fewer men hit.", "Lasts for good.", A.tile_sandbags),
    ]
    for i, (kw, b, c, art) in enumerate(opts):
        y = 52 + i * 54
        im.alpha_composite(x2(art(54, 25)), (8, y))
        d = ImageDraw.Draw(im)
        d.rectangle((8, y, 115, y + 49), outline=P["mud2"])
        d.rectangle((118, y, W - 9, y + 49), fill=P["mud0"], outline=P["mud2"])
        d.rectangle((121, y + 4, W - 12, y + 16), fill=P["rust"])
        text_c(d, (121 + W - 12) // 2, y + 6, kw, font(8, True), P["white"])
        d.text((122, y + 20), b, font=vt(14), fill=P["white"])
        d.text((122, y + 32), c, font=vt(14), fill=P["bone"])
    text_c(d, W // 2, 218, "COMMENT ONE WORD BELOW.", font(8, True), P["white"])
    text_c(d, W // 2, 230, "YOUR SOLDIER IS YOUR BALLOT.", font(8), P["pale"])
    text_c(d, W // 2, 242, "NO VOTES = NOTHING BUILT", font(8), P["gold"])
    footer(d, H - 14)
    frame(im)
    return save(im, "vote_build_1.jpg")


if __name__ == "__main__":
    what = sys.argv[1] if len(sys.argv) > 1 else "casualties"
    if what == "vote":
        print(slide_vote())
    else:
        path = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, "data", "state.json")
        state = json.load(open(path))
        day, out = today(state)
        shots = [os.path.join(PROMO, f"hosp_{f}.png") for f in (0, 1)]  # node tools/shot-hospital.mjs (snímky ze hry)
        print(slide_list(day, out), *[slide_aidpost(day, state, f, shots[f] if os.path.exists(shots[f]) else None) for f in (0, 1)])
        for f, (name, _, _) in enumerate(SIDES):
            print(name, ", ".join(f"@{r['handle']} ({r['sev']}, {r['place']}{', by @' + r['by'] if r['by'] else ''})" for r in out[f]) or "-")
