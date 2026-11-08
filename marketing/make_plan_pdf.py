"""PDF: Mud & Iron – plán prvních 14 dní války (příběh, hlasování, výsledky, změny ve hře, funkce k doplnění).

Použití: python marketing/make_plan_pdf.py  –  marketing/Mud_and_Iron_14_dni.pdf
"""
import os

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (Image, KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table,
                                TableStyle)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "marketing", "Mud_and_Iron_14_dni.pdf")
F = "C:/Windows/Fonts/"
pdfmetrics.registerFont(TTFont("Body", F + "georgia.ttf"))
pdfmetrics.registerFont(TTFont("BodyB", F + "georgiab.ttf"))
pdfmetrics.registerFont(TTFont("Sans", F + "arial.ttf"))
pdfmetrics.registerFont(TTFont("SansB", F + "arialbd.ttf"))
pdfmetrics.registerFont(TTFont("Mono", F + "consola.ttf"))
pdfmetrics.registerFont(TTFont("Pixel", os.path.join(ROOT, "marketing", "fonts", "Silkscreen-Regular.ttf")))

INK = colors.HexColor("#1c1a17")
MUD = colors.HexColor("#524a3f")
BONE = colors.HexColor("#857a68")
RUST = colors.HexColor("#7e3b2a")
GOLD = colors.HexColor("#b8722a")
PAPER = colors.HexColor("#f4efe4")
HEG = colors.HexColor("#5d6a72")
CON = colors.HexColor("#6f7148")

S = {
    "h1": ParagraphStyle("h1", fontName="SansB", fontSize=20, leading=24, textColor=INK, spaceAfter=6),
    "h2": ParagraphStyle("h2", fontName="SansB", fontSize=14, leading=18, textColor=RUST, spaceBefore=8, spaceAfter=4),
    "h3": ParagraphStyle("h3", fontName="SansB", fontSize=11, leading=14, textColor=INK, spaceBefore=6, spaceAfter=2),
    "p": ParagraphStyle("p", fontName="Body", fontSize=9.6, leading=13.6, textColor=INK, spaceAfter=4),
    "small": ParagraphStyle("small", fontName="Sans", fontSize=8.2, leading=11, textColor=MUD),
    "quote": ParagraphStyle("quote", fontName="Body", fontSize=9.4, leading=13.4, textColor=INK, leftIndent=8,
                            borderPadding=(6, 8, 6, 8), backColor=PAPER, borderColor=BONE, borderWidth=0.6, spaceAfter=6),
    "label": ParagraphStyle("label", fontName="SansB", fontSize=7.6, leading=10, textColor=BONE),
    "cell": ParagraphStyle("cell", fontName="Sans", fontSize=8.4, leading=11.2, textColor=INK),
    "cellb": ParagraphStyle("cellb", fontName="SansB", fontSize=8.4, leading=11.2, textColor=INK),
    "cover": ParagraphStyle("cover", fontName="Pixel", fontSize=34, leading=40, textColor=colors.white, alignment=TA_CENTER),
    "coversub": ParagraphStyle("coversub", fontName="Sans", fontSize=12, leading=16, textColor=colors.HexColor("#e3d9c3"), alignment=TA_CENTER),
}


def P(t, st="p"):
    return Paragraph(t, S[st])


# ---------------------------------------------------------------- obsah: 14 dní
# Každý den: (název, téma/akce, zpráva z fronty EN, hlasování EN, [(slovo, popis, výsledek EN, změna ve hře CZ)], co ve hře CZ, Reel CZ)
DAYS = [
    ("Den 1 · First Night", "Válka začíná. První noc v zákopech, první rozkaz.",
     "Midnight. The whistles of mobilization fall silent and the valley of Verdel holds its breath. Somewhere in the dark, "
     "Private @{hrac} of sector R-F12 swears he heard a spade biting into the mud on the other side.",
     "The first order of the war: what do we do tonight?",
     [("HOLD", "Hold the line", "The night passes in silence. At dawn the trench is knee-deep in rain. Nobody slept.",
       "Déšť: v zákopech stoupne voda (viditelné kaluže na dně) na Den 2."),
      ("PATROL", "Send a patrol into no man's land", "Six men crawl out, four come back with a map torn from a dead officer's coat. The enemy is digging a listening post.",
       "Na mapě se v zemi nikoho objeví značka „listening post“; 2 náhodní vojáci zraněni.")],
     "Den 1 v liště, první zpráva dne, hlasování ve War Room.",
     "Noční průlet frontou, světlice, titulek „THE WAR BEGINS“, otázka HOLD / PATROL."),
    ("Den 2 · The Rain", "Voda v zákopech, nemoci, bahno. Komunita rozhoduje o práci.",
     "It has rained for nineteen hours. The duckboards float. Corporal @{hrac} counts the rats swimming past his boots: forty-one.",
     "Water is rising in the front line. How do we spend the night?",
     [("BAIL", "Bail out the trenches", "Every helmet becomes a bucket. By morning the duckboards touch mud again. Two men cough blood.",
       "Voda v zákopech klesne; 1–2 zranění „trench fever“."),
      ("DIG", "Dig a drainage trench", "The sappers cut a new channel toward the old crater. The water drains, and the line has a new path.",
       "Na mapě přibude nový spojovací zákop (trvale) a krátery se zaplní vodou.")],
     "Hladina vody v zákopech (nová vrstva), případně nový úsek zákopu.",
     "Déšť, záběr na vodu v zákopu, zdravotník, otázka BAIL / DIG."),
    ("Den 3 · Name the Crow", "Odlehčený den, zapojení komunity: maskot fronty.",
     "A crow has taken a post on the parapet of sector R-F12. It does not flinch at gunfire. The men say it is lucky. It needs a name.",
     "Name the crow of the front. Comment a name. The three most liked names go to a final vote tomorrow.",
     [("(jméno)", "Komentáře se jmény", "Top 3 jména (podle lajků) postoupí do finále na Den 4.", "Na parapetu R-F12 sedí vrána (nová postavička) se jménem po vyhlášení.")],
     "Maskot – animovaná vrána na mapě, jméno v kartě sektoru.",
     "Detail vrány na parapetu, výzva „NAME THE CROW“ – UGC, sdílení."),
    ("Den 4 · The Wire", "Noc u drátů. První větší riziko.",
     "Our wire is torn in eleven places. Theirs is whole. The crow, now officially '{vrana}', watches the gaps all night.",
     "Night work on the wire. What's the job?",
     [("REPAIR", "Repair our wire", "By dawn the gaps are closed. Nobody was hit. The enemy will have to try harder.",
       "Ostnatý drát před naší linií je hustší (víc dlaždic drátu)."),
      ("CUT", "Cut their wire", "Two pairs of wire cutters, one moon, a hundred meters of cut steel. Corporal @{hrac} came back without his helmet, but with a souvenir.",
       "Mezery v drátu nepřítele; vojákovi @hráč medaile „Wire Cutter“; šance na zranění.")],
     "Hustota drátu podle výsledku, medaile pro jmenovaného hráče.",
     "Noční záběr, dráty, světlice, otázka REPAIR / CUT + vyhlášení jména vrány."),
    ("Den 5 · Gas!", "První plynový útok. Napětí, zdravotníci v akci.",
     "04:12. The gongs. Then the smell of mown hay where no hay has grown for six winters. Masks on. Stretcher bearer @{hrac} goes out with nine.",
     "Gas over sector K. Where do the stretcher bearers go first?",
     [("FRONT", "The front line", "The front line holds, but the dugouts choke. Seven men wake up blind for a day.",
       "Žlutozelený mrak plynu se celý den valí přes sektor K; zranění v zálohách."),
      ("DUGOUTS", "The dugouts", "The dugouts are cleared in time. The firestep pays instead. The crow does not come back until noon.",
       "Mrak plynu nad přední linií; zranění v první linii.")],
     "Efekt plynu (VFX toxic_cloud) nad sektorem, víc zraněných a zdravotníků v akci.",
     "Plyn, masky, zdravotníci – nejdramatičtější Reel týdne."),
    ("Den 6 · Letters Home", "Emoční den, UGC: hráči píšou dopisy domů.",
     "The post came up the line today. For one hour nobody shot. Private @{hrac} wrote four lines and crossed out three.",
     "Write one line of a letter home in the comments. The best letters go into tomorrow's dispatch and into your soldier's record.",
     [("(dopis)", "Komentáře s dopisem", "5 nejlepších dopisů se objeví v Reelu a v záznamu daného vojáka.", "Záznam „Letter home“ u autorů; nejlepší dostane medaili „Pen of the Front“.")],
     "Nový typ záznamu „dopis“ v kartě vojáka, medaile.",
     "Klidný záběr, padající pošta, citace dopisů od hráčů."),
    ("Den 7 · One Week of Mud", "Týdenní hlášení, povýšení, vzpomínka.",
     "Seven days. {rekruti} soldiers on the line. {padli} names carved into the duckboards. The front has not moved one meter, and yet everything has changed.",
     "Next night, the enemy listening post (or their cut wire) waits. Do we raid?",
     [("RAID", "Trench raid at night", "See Day 8.", "Den 8 = nájezd."),
      ("WAIT", "Wait and fortify", "The line grows a second row of sandbags. Snipers find nothing to shoot at.", "Parapet o jednu řadu pytlů vyšší (viditelně), méně zranění.")],
     "Týdenní statistiky, povýšení nejaktivnějších (desátník), pomník padlých.",
     "Rekapitulace týdne: čísla, jména povýšených, otázka RAID / WAIT."),
    ("Den 8 · The Raid", "Akční den – nájezd na nepřátelský zákop (podle Dne 7).",
     "Forty men went over at 02:00 with clubs, knives and grenades. {vysledek}",
     "The prisoner talks. He says the enemy is digging under our lines. Do we believe him?",
     [("BELIEVE", "Believe him", "Sappers are sent to listen. Day 10 will tell.", "Připravenost na minu (Den 10 dopadne lépe)."),
      ("LIES", "He is lying", "We ignore him. The sappers stay in bed.", "Den 10 dopadne hůř.")],
     "Ukořistěná vlajka na našem parapetu (trvalá rekvizita), zajatec, ztráty.",
     "Nájezd v noci: výbuchy granátů, návrat s vlajkou."),
    ("Den 9 · Sniper's Alley", "Odstřelovač – napětí, ‚kdo bude další‘.",
     "Three helmets. Three holes. Somewhere in the ruins of the Drowned Farm a patient man is counting. Sniper @{hrac} says he can find him.",
     "An enemy sniper is hunting our line. Answer?",
     [("HUNT", "Send our sniper", "A duel at dawn. One shot each. Ours was faster. Medal: 'Duelist'.", "Jmenovaný ostřelovač (hráč) dostane medaili; jedno zranění."),
      ("SANDBAGS", "Raise the parapet", "Every man fills ten bags. Nobody dies today. The sniper gets bored.", "Parapet vyšší; nikdo nezraněn.")],
     "Odstřelovač (záblesky z ruin farmy), medaile Duelist.",
     "Záběr přes mířidla, napětí, otázka HUNT / SANDBAGS."),
    ("Den 10 · The Mine", "Velký zvrat: podzemní mina (výsledek z Dne 8).",
     "The ground shook at 05:40. Where sector D stood there is now a hole big enough to bury a church. {vysledek}",
     "The crater is no man's land now. Who takes it?",
     [("TAKE", "Occupy the crater", "We hold the lip of the crater by noon. The line bends forward.", "Obří kráter (decal) v zemi nikoho + nový zákop na jeho okraji = první posun linie."),
      ("WIRE", "Wire it and leave it", "Nobody will cross it now. Nobody.", "Kráter obehnaný drátem, linie beze změny.")],
     "Obří kráter na mapě (trvale), případně nový zákop – fronta se poprvé fyzicky změní.",
     "Výbuch miny (ground_blast VFX), otřes kamery, dým nad kráterem."),
    ("Den 11 · White Flag", "Morální dilema – příměří.",
     "At dawn a white rag on a bayonet rises from the enemy line. A voice calls in broken words: 'Bury dead. One hour.'",
     "The enemy asks for a truce to bury the dead. Do we trust them?",
     [("TRUST", "Accept the truce", "For one hour men from both sides carry the dead. Someone trades tobacco for chocolate. Then the whistles.",
       "Celý den bez střelby (simulace utichne), hroby na hřbitově přibudou, karta „Truce of Verdel“ všem."),
      ("SHOOT", "It's a trick, open fire", "We fire. They fire. The dead stay where they are.", "Celý den hustá palba, víc zranění.")],
     "Den ticha nebo den palby – viditelný rozdíl v simulaci, hroby.",
     "Tichý záběr: bílá vlajka, otázka TRUST / SHOOT."),
    ("Den 12 · The Guns Arrive", "Dělostřelectvo – odemykání bombardování (500 převzatých vojáků).",
     "Behind the reserve line the horses drag something heavy under tarpaulins. The gunners say: when the front is ready, so are we. {stav}",
     "Where do the guns aim first, if the barrage unlocks tonight?",
     [("WOOD", "Ossuary Wood", "If unlocked: the wood burns all night.", "Bombardování sektoru vlevo."),
      ("FARM", "The Drowned Farm", "If unlocked: the sniper's ruins are flattened.", "Bombardování sektoru vpravo.")],
     "Ukazatel 500 převzatých vojáků, pokud odemčeno: bombardování celý den.",
     "Děla pod plachtami, odpočet „X/500 claimed“ – výzva k převzetí vojáků."),
    ("Den 13 · Eve of the Push", "Velké rozhodnutí: kam zaútočíme.",
     "Rum ration doubled. Letters written. Nobody talks about tomorrow. Everyone talks about tomorrow.",
     "Tomorrow we go over the top. Where?",
     [("LEFT", "Ossuary Wood", "Cover of trees, but the ground is a maze of roots.", "Útok vlevo (sektor C)."),
      ("CENTER", "Verdel Ridge", "The high ground. The shortest way. The most guns.", "Útok středem (sektor D-E)."),
      ("RIGHT", "The Drowned Farm", "Ruins to hide in, water to drown in.", "Útok vpravo (sektor F).")],
     "Šipky plánovaného útoku na mapě, napětí.",
     "Noční ticho, rum, dopisy, mapa se šipkami, otázka LEFT / CENTER / RIGHT."),
    ("Den 14 · Over the Top", "Finále první ofenzivy (sezóny).",
     "06:00. Whistles along the whole line. {vysledek}",
     "Season 1 ends. Who fought best? (Next offensive opens in 2 days.)",
     [("—", "Výsledek ofenzivy", "Výsledek se počítá z počtu rekrutů frakce, aktivity v hlasování a náhody. Vítězná strana posune linii ve zvoleném sektoru o 10–30 m.",
       "FRONTA SE POSUNE: nový zákop, dobytý úsek, ztráty, medaile „Verdel Ridge Cross“ všem účastníkům, zápis do historie.")],
     "Posun linie v sektoru (trvalá změna mapy), velký Reel, sezónní medaile.",
     "Velký Reel: píšťalky, útok, kouř, posun linie, výsledek, poděkování."),
]

FEATURES = [
    ("1", "Systém událostí dne (engine)", "Každý den má scénář: otázku, možnosti, výsledky a jejich dopady (seznam „modů“ světa). Denní tah vyhodnotí hlasování a uloží dopady do stavu.", "Vysoká"),
    ("2", "Změny terénu z dopadů", "state.world.mods: přidat kráter/obří kráter, zákop (úsek), hustota drátu, výška parapetu, voda v zákopech, rekvizita (vlajka, hrob, značka). Generátor mapy je aplikuje, web je vykreslí. Posun linie po sektorech (offset přední linie).", "Vysoká"),
    ("3", "Zprávy z fronty se jmény hráčů", "Zpráva dne automaticky zmíní 1–3 skutečné hráče (@jméno, sektor) – lidé chtějí být zmínění a sdílí to. Šablony s proměnnými {hrac}, {rekruti}, {padli}, {vysledek}.", "Vysoká"),
    ("4", "Počasí a denní nálada", "Déšť / mlha / jasno, noc, plyn – parametr dne ovlivní efekty (déšť, mlhu, plyn VFX, světlice, utichnutí při příměří).", "Střední"),
    ("5", "Medaile a povýšení", "Typy medailí (First Wave, Wire Cutter, Duelist, Pen of the Front, Verdel Ridge Cross…), zobrazení na kartě a na obrázku ke sdílení; povýšení nejaktivnějších.", "Střední"),
    ("6", "Hlasování s textem (UGC)", "Dny 3 a 6: sběr textových komentářů (jména, dopisy), výběr podle lajků (Instagram API vrací like_count).", "Střední"),
    ("7", "Mapové značky a „co se změnilo“", "Ikony událostí na mapě (listening post, vlajka, kráter, šipky útoku) + tlačítko „What changed today“, které kameru provede změnami.", "Střední"),
    ("8", "Automatický denní Reel", "Ze scénáře dne se sám natočí Reel (už máme nahrávání snímek po snímku) a zařadí do publikování.", "Střední"),
    ("9", "Pomník padlých a statistiky", "Stránka „Memorial“ se jmény padlých a jejich posledním zápisem; týdenní čísla.", "Nižší"),
    ("10", "Maskot (vrána)", "Animovaná postavička na parapetu se jménem z hlasování (PixelLab: vrána, 2–3 animace).", "Nižší"),
]


def day_block(i, d):
    name, theme, dispatch, question, options, game, reel = d
    head = Table([[Paragraph(f"<font color='#e3d9c3'>{name.upper()}</font>", ParagraphStyle('dh', fontName='SansB', fontSize=11, leading=14)),
                   Paragraph(f"<font color='#e3d9c3'>{theme}</font>", ParagraphStyle('dt', fontName='Sans', fontSize=8.4, leading=11, alignment=2))]],
                 colWidths=[70 * mm, 104 * mm])
    head.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), INK), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                              ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                              ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
    rows = [[P("SLOVO", "label"), P("MOŽNOST", "label"), P("VÝSLEDEK (zpráva dne)", "label"), P("ZMĚNA VE HŘE", "label")]]
    for kw, label, out, change in options:
        rows.append([P(f"<b>{kw}</b>", "cellb"), P(label, "cell"), P(f"<i>{out}</i>", "cell"), P(change, "cell")])
    t = Table(rows, colWidths=[20 * mm, 32 * mm, 66 * mm, 56 * mm], repeatRows=1)
    t.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, 0), 0.6, BONE), ("LINEBELOW", (0, 1), (-1, -2), 0.3, colors.HexColor("#d9d0bd")),
                           ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 3), ("RIGHTPADDING", (0, 0), (-1, -1), 3)]))
    return KeepTogether([
        head, Spacer(1, 4),
        P("<b>Zpráva z fronty (ráno):</b>", "small"), Spacer(1, 7), P(dispatch, "quote"), Spacer(1, 2),
        P(f"<b>Hlasování:</b> {question}", "p"), t, Spacer(1, 3),
        P(f"<b>Ve hře uvidí:</b> {game}", "small"), P(f"<b>Reel dne:</b> {reel}", "small"), Spacer(1, 10)])


def cover_page(c, doc):
    c.saveState()
    w, h = A4
    c.setFillColor(INK)
    c.rect(0, 0, w, h, fill=1, stroke=0)
    mood = os.path.join(ROOT, "art", "pixellab", "test01", "mood_front_256x144.png")
    if os.path.exists(mood):
        iw = w
        ih = iw * 144 / 256
        c.drawImage(mood, 0, h - ih - 60 * mm, iw, ih)
    c.restoreState()


def later_pages(c, doc):
    c.saveState()
    c.setFont("Sans", 7.5)
    c.setFillColor(BONE)
    c.drawString(18 * mm, 10 * mm, "Mud & Iron · plán prvních 14 dní · @mudandiron · mudandiron.web.app")
    c.drawRightString(A4[0] - 18 * mm, 10 * mm, str(doc.page))
    c.restoreState()


def build():
    doc = SimpleDocTemplate(OUT, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=16 * mm, bottomMargin=16 * mm,
                            title="Mud & Iron – plán prvních 14 dní", author="Mud & Iron")
    st = []
    # titulní strana
    st += [Spacer(1, 8 * mm), Paragraph('MUD <font name="BodyB" size="40">&amp;</font> IRON', S["cover"]), Spacer(1, 4 * mm),
           Paragraph("Plán prvních 14 dní války · Ofenzíva Verdel Ridge (sezóna 1)", S["coversub"]),
           Spacer(1, 150 * mm),
           Paragraph("Příběh · hlasování · možné výsledky · co se změní ve hře · funkce k doplnění", S["coversub"]),
           Spacer(1, 4 * mm), Paragraph("@mudandiron · mudandiron.web.app", S["coversub"]), PageBreak()]

    # principy
    st += [P("Jak to bude fungovat", "h1"),
           P("Prvních 14 dní je jedna <b>ofenzíva</b> (sezóna): od první noci po velký útok „Over the Top“. Každý den má jasný rytmus, "
             "jedno rozhodnutí komunity a viditelný následek na mapě. Lidé se vrací, protože (1) jejich voják dostává nové zápisy, "
             "(2) jejich hlas něco změnil, (3) mohou být jmenovaní ve zprávě dne."),
           P("Denní rytmus", "h2")]
    rhythm = [["Čas (Praha)", "Co se děje", "Kde"],
              ["00:00", "Denní tah: vyhodnotí včerejší hlasování, zapíše dopady do světa, příběhy vojákům", "automaticky"],
              ["07:00", "Zpráva z fronty (dispatch) + nová otázka k hlasování", "web (War Room) + story"],
              ["18:00", "Reel dne: co se stalo + výzva hlasovat (slovo do komentáře)", "Instagram"],
              ["celý den", "Nábor: CONCORD / HEGEMONY, odpovědi, převzetí vojáků", "Instagram + web"]]
    t = Table([[P(c, "cellb" if r == 0 else "cell") for c in row] for r, row in enumerate(rhythm)], colWidths=[26 * mm, 104 * mm, 44 * mm])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), PAPER), ("LINEBELOW", (0, 0), (-1, -1), 0.3, BONE), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
    st += [t, P("Pravidla hlasování", "h2"),
           P("• Hlasuje se komentářem s jedním slovem (velkými písmeny) pod Reelem dne. Jeden účet = jeden hlas, platí poslední komentář.<br/>"
             "• Remíza = první možnost (obvykle ta opatrnější).<br/>"
             "• Hlas může mít i vedlejší efekt: kdo hlasoval s vítěznou stranou, dostane zápis do záznamu („He voted to raid. He was right.“).<br/>"
             "• UGC dny (3 a 6): místo slova píšou lidé text – jméno vrány, řádek dopisu. Vybíráme podle lajků."),
           P("Jak psát zprávy z fronty (aby byly chytlavé)", "h2"),
           P("1. <b>Konkrétní detail</b> místo obecností: „forty-one rats“, „04:12, the gongs“.<br/>"
             "2. <b>Jméno skutečného hráče</b> v každé zprávě (@jméno + sektor) – lidé sdílí, když jsou zmínění.<br/>"
             "3. <b>Krátce</b>: 2–3 věty, přítomný čas, žádné vysvětlování.<br/>"
             "4. <b>Konec otázkou nebo cliffhangerem</b> a jasná výzva: „Comment HOLD or PATROL.“<br/>"
             "5. <b>Ponuré, ne krvavé</b>: ztráta se ukazuje přes předměty (helma, dopis, vyrytá jména), ne přes zranění.<br/>"
             "6. Fiktivní svět – žádné skutečné státy, symboly, vlajky."),
           P("Proměnné ve zprávách: {hrac} = náhodný aktivní hráč, {rekruti} = počet vojáků, {padli} = počet padlých, "
             "{vrana} = jméno maskota, {vysledek} = výsledek akce, {stav} = stav odemčení (X/500).", "small"),
           PageBreak()]

    # dny
    st.append(P("Příběh: 14 dní ofenzívy Verdel Ridge", "h1"))
    st.append(P("U každého dne: ranní zpráva z fronty (anglicky, jak ji uvidí hráči), otázka k hlasování, možnosti s výsledky "
                "a konkrétní změna, kterou hráči uvidí ve hře.", "small"))
    st.append(Spacer(1, 6))
    for i, d in enumerate(DAYS):
        st.append(day_block(i, d))

    # výsledek ofenzivy
    st += [PageBreak(), P("Den 14: jak se počítá výsledek ofenzívy", "h1"),
           P("Aby měl výsledek váhu a lidé měli důvod nabírat do své strany, počítá se ze tří složek:"),
           P("<b>Síla frakce</b> = (rekruti frakce za 14 dní) × 1,0 + (hlasy frakce ve dnech 1–13) × 0,5 + (převzatí vojáci) × 2,0<br/>"
             "<b>Šance na průlom</b> = síla útočící frakce / (síla obou) + náhoda ±10 %<br/>"
             "<b>Posun linie</b> = 10–30 m ve zvoleném sektoru podle převahy; prohra = ztráty a linie se nehne."),
           P("Ve hře: nový úsek přední linie ve vybraném sektoru (starý zákop se změní na opuštěný, krátery, dráty), "
             "zápis „Took part in the Verdel Ridge offensive“ všem, medaile <b>Verdel Ridge Cross</b> aktivním, padlí na pomník, "
             "nástupci z rodu dorazí do 2 dnů. Po dvou dnech klidu začíná ofenzíva 2."),
           P("Možné výstupy (outputs) – co z toho vznikne", "h2")]
    outs = [["Výstup", "Kdo ho vidí", "Proč je důležitý"],
            ["Zpráva dne (dispatch) na webu + story", "všichni", "denní důvod otevřít web"],
            ["Reel dne s výsledkem a otázkou", "Instagram, nově i lidé mimo followery", "růst + hlasování"],
            ["Zápis v záznamu vojáka (jméno, sektor)", "hráč a jeho přátelé", "osobní vazba, sdílení karty"],
            ["Trvalá změna mapy (kráter, zákop, vlajka, posun linie)", "všichni na webu", "pocit, že komunita něco změnila"],
            ["Medaile a povýšení", "hráč (karta, obrázek ke sdílení)", "status, motivace převzít vojáka"],
            ["Týdenní a sezónní souhrn", "všichni", "milníky, rivalita frakcí"]]
    t = Table([[P(c, "cellb" if r == 0 else "cell") for c in row] for r, row in enumerate(outs)], colWidths=[70 * mm, 50 * mm, 54 * mm])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), PAPER), ("LINEBELOW", (0, 0), (-1, -1), 0.3, BONE), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
    st += [t, PageBreak()]

    # funkce k doplnění
    st += [P("Co musíme doplnit do hry", "h1"),
           P("Aby se rozhodnutí komunity <b>viditelně promítla do mapy</b> a zprávy byly živé. Řazeno podle priority – položky 1–3 jsou potřeba už pro Den 1–2.")]
    rows = [[P("#", "cellb"), P("Funkce", "cellb"), P("Popis", "cellb"), P("Priorita", "cellb")]]
    for n, name, desc, prio in FEATURES:
        rows.append([P(n, "cell"), P(f"<b>{name}</b>", "cell"), P(desc, "cell"), P(prio, "cell")])
    t = Table(rows, colWidths=[8 * mm, 42 * mm, 104 * mm, 20 * mm], repeatRows=1)
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), PAPER), ("LINEBELOW", (0, 0), (-1, -1), 0.3, BONE), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
    st += [t, P("Grafika z PixelLabu (po obnově generací 13. 11.)", "h2"),
           P("• Plynový mrak (VFX workbench, zdarma: preset toxic_cloud přebarvený) · • Ukořistěná vlajka a značky na mapu (objekty 32 px) · "
             "• Obří kráter po mině (máme crater_huge) · • Vrána – maskot (postavička + 2 animace) · • Bílá vlajka (příměří) · "
             "• Šipky útoku a ikony událostí (UI) · • Opuštěný zákop (varianta terénu) · • Kulomet zepředu/zezadu (přesná kresba)."),
           P("Harmonogram vývoje", "h2"),
           P("<b>Do Dne 1:</b> systém událostí (1), změny terénu (2) – voda, kráter, nový zákop, drát; zprávy se jmény hráčů (3).<br/>"
             "<b>Do Dne 5:</b> plyn a počasí (4), medaile (5).<br/>"
             "<b>Do Dne 10:</b> mapové značky a „What changed“ (7), obří kráter + posun linie.<br/>"
             "<b>Do Dne 14:</b> výpočet ofenzívy, posun linie po sektorech, sezónní souhrn, automatický Reel (8), pomník (9)."),
           P("KPI na prvních 14 dní", "h2"),
           P("Rekruti (cíl 500) · převzatí vojáci (cíl 100 – First Wave plná) · hlasy na otázku (cíl 20 % followerů) · "
             "sdílení karet do story · návraty na web (denní návštěvy).")]

    doc.build(st, onFirstPage=cover_page, onLaterPages=later_pages)
    print("hotovo:", OUT)


if __name__ == "__main__":
    build()
