# Medaile (NÁVRH 2026-11-23; bojové medaile nenasazeny, medaile podporovatelů NASAZENY 24. 11.)

**Medaile podporovatelů (24. 11.):** `docs/mockups/medals/support.py`, nasazena varianta A: War Bonds (bronzová mince s dluhopisem), Field Post (ocelová destička s dopisem),
Officers' Mess (zlatá osmicípá hvězda). Stejné pro obě strany, stuha s pruhy War Bonds. Ukazuje se jen nejvyšší úroveň (`theme.support.medals`, `web/src/keepsakes.js`):
hvězda `officers-star` → Officers' Mess, `war-bonds` + pes → Field Post, `war-bonds` → War Bonds. Spona Trench Dog NEBUDE (uživatel: pes je součástí úrovní).
**Bojové medaile níž uživatel zatím nechce zveřejnit** (nechává je na později jako novinku).


Grafika: `docs/mockups/medals/medals.py` (kreslené v kódu, Trench 24, plátno 15 × 23 px, osa ve sloupci 7, kontrola souměrnosti a zavěšení na kroužku je přímo ve skriptu),
arch `medals_sheet.png`, jednotlivé kusy `png/<id>_<heg|con>.png`, ukázka na kartě a v novinách `medals_in_use.png`.
Texty pro hru a noviny jsou anglicky (jednoduchá angličtina, pravidla textů v CLAUDE.md), poznámky česky.

## Lore: proč mají strany různé medaile

**The Hegemony: “The Iron Register”**
> In the Hegemony a medal is not a gift. It is a debt the Empire writes down in iron.
> Every medal is struck at the Imperial Mint from the steel of guns lost in the valley, and every name goes into the Iron Register, a book that has not been closed in six winters.
> An officer reads the name aloud at dawn watch. Nobody claps. Iron endures.

**The Concord: “The Shell-Case Medals”**
> The Concord has no emperor to hand out crosses. Its medals are made at the front.
> Armourers melt down spent brass shell cases picked up from the trenches, and each province sends a strip of its own cloth for the ribbons.
> A Concord medal is passed hand to hand down the line before it is pinned on, so every man has held it once. Together, or not at all.

(Proto Hegemonie = železo, ocel, stříbro, studené stuhy; Concord = bronz, mosaz, zlato, olivové a okrové stuhy.)

## Sada (12 druhů × 2 strany = 24 medailí)

**Týdenní vyhodnocení (uživatel 23. 11.: denně je to moc).** Soutěžní medaile se rozdávají JEN jednou týdně, v nedělních novinách 13:00 UTC
(„Sunday parade“: týden = noviny pondělí až neděle). Jeden vyznamenaný za stranu a medaili. Událostní medaile (drát, raid, děla) jdou nejlepšímu
ze všech takových událostí v týdnu; když v týdnu žádná nebyla, medaile se neudělí.

| id | Hegemonie | Concord | Kdo ji dostane (jeden hráč za stranu, pokud není řečeno jinak) |
|---|---|---|---|
| `valour` | Iron Wreath | Valley Cross | **týdně:** nejvíc zásahů nepřítele za týden |
| `marksman` | Star of the Steady Hand | Gallantry Star | **týdně:** nejlepší odstřelovač / kulometčík týdne (jiný hráč než `valour`) |
| `mercy` | Field Cross | Lamp of Mercy | **týdně:** medik, který za týden ošetřil nejvíc raněných |
| `wire` | Wire Clasp | Picket Medal | **týdně:** nejvíc yardů drátu ze všech wiring party v týdnu (a vrátil se) |
| `raid` | Night Dagger | Raider's Star | **týdně:** nejvíc zásahů ze všech raidů v týdnu (a vrátil se živý) |
| `gun` | Gunner's Badge | Shell Medal | **týdně:** nejvíc granátů v soubojích děl v týdnu |
| `sky` | Iron Wings | Concord Wings | **týdně:** pilot, který v týdnu létal (sestřelení nepřítele má přednost) |
| `hill` | Order of the Height | Cross of the Ridge | **při dobytí kóty:** hrdina vítězné strany (vzácné, zůstává hned) |
| `wound` | Wound Clasp | Wound Stripe | **automaticky:** každý, kdo přežije těžké nebo kritické zranění; tiše (karta + deník), v neděli jen počet |
| `service` | Long Service Bar | Seven Winters Medal | **automaticky:** 7, 14 a 30 dní naživu na frontě (spona za každý stupeň) |
| `winter` | Frost Ribbon | Snow Medal | **automaticky:** přežil první sníh (22. 11.) a plnou zimu (13. 12.) |
| `truce` | Silent Night Medal | Silent Night Medal | **vánoční příměří:** kdo se přihlásí a potká nepřítele v zemi nikoho (stejná pro obě strany) |

Pravidla:
- Soutěžní medaile: jedna za stranu a týden; při shodě rozhodne los (seed dne, jako jinde v enginu).
- Automatické (wound, service, winter) se připíšou hned, ale bez slávy: jen karta a věta v deníku. Neděle je jen shrne číslem („27 men received the Wound Clasp this week“).
- Týdenní součty: engine si v pondělí uloží výchozí stav počítadel (`kills`, `treated`, drát, raid, granáty) do `state.medalWeek`; v neděli rozdíl = výkon týdne.
- Stejný voják ji může dostat znovu: na kartě „×2“, „×3“ (na stuze přibude spona, kreslená v kódu).
- Padlý voják medaile neztrácí; nástupce je vidí v albu rodu (jako dnes `medals` a `houseBadges`).
- Stávající odznaky (`first-wave`, `wire-party`, `raider`, War Bonds) zůstanou, nové medaile je nenahrazují.

## Texty (citace v novinách a zápis do deníku)

Noviny (neděle), rubrika **“Sunday parade: decorated this week”** (jen jméno, bez @, jako ostatní čísla od 19. 11.? → rozhodnout; patroni @ mají):
- valour: `Iron Wreath to {name}, {hits} enemy hits this week.` / `Valley Cross to {name}, {hits} enemy hits this week.`
- marksman: `Star of the Steady Hand to {name}, {role}, {hits} hits from sector {sector}.` / `Gallantry Star to …`
- mercy: `Field Cross to {name}, who treated {n} wounded this week.` / `Lamp of Mercy to {name}, who …`
- wire: `Wire Clasp to {name}, {yards} yards of wire mended under fire.` / `Picket Medal to …`
- raid: `Night Dagger to {name}, back from the raid with {hits} hits.` / `Raider's Star to …`
- gun: `Gunner's Badge to {name}, who loaded {n} shells for the guns.` / `Shell Medal to …`
- hill: `Order of the Height to {name}, first up {hill}.` / `Cross of the Ridge to {name}, first up {hill}.`

Deník vojáka (jedna věta, přidá se k dennímu zápisu, nic se nepřepisuje):
- Hegemonie: `An officer read {name}'s name into the Iron Register at dawn watch. {medal}. Nobody clapped. {name} stood a little straighter.`
- Concord: `The {medal} went hand to hand down the trench before it reached {name}. Every man held it once. Then it was pinned on.`
- wound: `The doctors sent {name} back with a {medal}. {name} said the scar was worth more.`
- service: `{days} days at the front. The quartermaster handed {name} the {medal} with the soup ration.`

## Kde je vidět
- **Karta vojáka:** řádek MEDALS, ikony 15 × 23 px ve skutečné velikosti (ukázka `medals_in_use.png`).
- **Noviny:** v neděli rubrika „Sunday parade“ s malou ikonou ×2.
- **Nedělní Day reel / story:** „Medals of the week“ (záběr na vojáka s reflektorem + medaile ×8 přes celou obrazovku).
- **Mapa:** nic (32 px voják je na medaili moc malý); možná jen jemná stužka u jména jako War Bonds.

## Co je potřeba postavit (odhad)
1. `engine/medals.js`: výběr vítězů z dat, která už existují (`kills`/zásahy dne, `treated`, wiring yards, raid hits, shells, pilot, kóta, dny naživu, zima). Volá se v denním tahu po boji. Test v `engine.test.js`.
2. `theme.medals` (názvy, texty, obrázek) v `themes/front-ww1/theme.json` (engine zůstává obecný).
3. Web: ikony v atlasu/`assets/medals/`, řádek na kartě, rubrika v novinách.
4. Simulace 30 dní: kolik medailí rozdáme, aby jich nebylo moc (cíl: v neděli ~14 vyznamenaných = 7 druhů × 2 strany; automatické tiše).
