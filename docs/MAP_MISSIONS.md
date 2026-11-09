# Návrh: mapa údolí a výpravy (mise)

_Stav: **postaveno 9. 11. 2026** (fáze 2 + 3 a výhody z území, viz „Jak je to postavené“ na konci). Grafika: kostel hotový (`art/pixellab/locations/church.png`), ostatní místa mají zatím náhradní pixelové ikony kreslené kódem; po obnově PixelLabu 13. 11. se dogenerují se stejným stylem (church.png jako style_image, create_object_pro_flash 96×96, ~5 generací/místo) a jen se doplní `img` v `theme.valley.locations`._

## Inspirace

**Skutečná válka (1914–1918)**
- **Zákopové nájezdy (trench raids):** malé skupiny 6–20 mužů v noci, začerněné tváře, palcáty a granáty, cíl: zajatci a informace. Nejčastější „výprava“ celé války.
- **Kostelní věže jako pozorovatelny:** jediný vysoký bod v rovině, proto je dělostřelectvo obou stran cíleně ničilo. Kdo měl věž, viděl na nepřítele.
- **Hřbitovy a zničené vesnice:** Verdun (vesnice, „které zemřely za Francii“ jako Fleury), La Boisselle, Thiepval. Hroby rozryté granáty, boje o každou zeď.
- **Odlehlé pozorovací a odposlechové stanoviště (sapy, listening posts):** pár mužů daleko vpředu, v noci poslouchají, co nepřítel chystá.
- **Podzemní války:** tunely a miny (Hill 60, Messines). Ženisté.
- **Příměří kvůli pohřbům a výměna zajatců:** krátké chvíle, kdy se obě strany potkaly bez střílení.

**Hry**
- **This War of Mine:** každou noc vybereš, *kdo* jde na výpravu do pojmenovaného místa (kostel, nemocnice, ruiny). Riziko a příběh podle místa.
- **Darkest Dungeon / XCOM:** složení družstva rozhoduje (role se doplňují), přeživší mají jizvy a vyznamenání.
- **Battlefield 1 Operations / Verdun (hra):** fronta rozdělená na sektory, které se dobývají postupně.
- **Valiant Hearts:** osudy obyčejných vojáků na pojmenovaných místech války.

## 1. Mapa údolí (strategická vrstva)

Vedle zákopové mapy nová stránka **„The Valley“**: ilustrovaná pixelová mapa údolí za Verdel Ridge s místy, která už známe z příběhů:

| Místo | Co to je | Co dává tomu, kdo ho drží |
|---|---|---|
| **Ruined Church of Saint-Ash** | zbořený kostel s věží | pozorovatelna: dělostřelectvo přesnější, je vidět, kam míří nepřátelské výpravy |
| **The Cemetery** | rozrytý hřbitov za kostelem | morálka: méně dezercí/zranění při bombardování |
| **Ruins of Verdel (town)** | zbořené město | zásoby: méně zraněných, kuchaři mají příběhy navíc |
| **Lonely Observation Post** | odlehlá pozorovatelna v zemi nikoho | zpravodajství: ráno se ukáže, kdo z nepřítele se hlásí na výpravy |
| **Grey Mill** | mlýn u kanálu | cesta přes kanál: přístup k dalším místům |
| **The Brickworks** | cihelna | úkryt: nižší nebezpečí pro jednu linii |
| **Field Hospital at Calvary Farm** | statek s polní nemocnicí | ranění se uzdravují rychleji |
| **The Bone Quarry** | lom | tunely: ženisté můžou podkopat nepřítele |

Každé místo má **stav** (drží Hegemonie / Concord / nikdo / sporné) a **kroniku**: kdy tam kdo šel, kdo z výpravy se vrátil, kdo ne. Přesně to „podívat se později, kdo tam vyrazil a za jakou frakci“.

## 2. Výpravy (mise)

**Rytmus (navazuje na docs/SCHEDULE.md):**
1. **Ranní noviny (13:00 UTC)** vyhlásí rozkaz dne: _„Volunteers wanted: night raid on the Ruined Church.“_ (1 výprava denně, později 2.)
2. **Celý den se hlásí dobrovolníci:**
   - převzatí hráči tlačítkem **Volunteer** na webu (další důvod vojáka převzít);
   - kdokoli narukovaný komentářem s heslem pod večerním reelem (např. `CHURCH`).
   - Kapacita např. 8 na frakci. Obě frakce můžou poslat lidi na stejné místo → střetnutí.
3. **Seznam dobrovolníků je skrytý** až do vyhodnocení (mlha války). Výjimka: frakce, která drží odlehlou pozorovatelnu, vidí nepřítele dřív.
4. **Další ranní noviny** výpravu vyhodnotí a otisknou výsledek na titulní straně, se jmény.

**Vyhodnocení (deterministické, bez AI, jako zbytek hry):**
- počet dobrovolníků obou stran, **složení družstva** (ženista na tunely, ostřelovač na pozorovatelny, zdravotník snižuje ztráty, spojka přinese zprávu i při neúspěchu), **počasí** (mlha pomáhá nájezdům, jasno pozorování), výhody z drženého území a ze závodu o kótu;
- výsledek: úspěch / částečný / neúspěch; místo změní majitele;
- osudy: zranění, **nezvěstní**, **zajatí** (stav „Prisoner of war“ už máme připravený, zatím nepoužitý → později výměna zajatců jako společná událost);
- **zápis každému účastníkovi** s ostatními jmény z družstva („Isidor, Teodor and five others crawled into the church at 2 a.m.…“), medaile **Raider's Cross** po 3 výpravách, titul za výjimečný čin.

**Bezpečnost výprav:** smrt jen výjimečně (stejně jako teď: nikdy z ničeho nic). Výprava je riskantnější než běžný den, ale převzatí hráči jsou dál chránění.

## 3. Fáze stavby

1. **Grafika míst** (PixelLab: kostel, hřbitov, ruiny města, pozorovatelna, mlýn, cihelna, statek, lom). ⚠️ Zbylé generace PixelLabu propadnou **13. 11.**, ideální je grafiku vygenerovat do té doby, i když se zbytek postaví později.
2. **Mapa údolí** (jen prohlížení: místa, kdo je drží, kronika místa).
3. **Výpravy v1:** 1 denně, přihlášky web + komentář, vyhodnocení v ranních novinách, zápisy, změna majitele.
4. **Výhody z území + zajatci a výměny + zpravodajství z pozorovatelny.**

Vše běží na stávající bezplatné infrastruktuře (GitHub smyčka, Firestore pro přihlášky, Firebase Hosting).

## 4. Souboj výpravy (rozhodnuto 9. 11.)

**Kdo se hlásí:** jen narukovaní vojáci, kteří jsou na linii (ne zranění, nezvěstní ani padlí).
- **Komentářem** s heslem místa (např. `CHURCH`) pod příspěvkem, který výpravu vyhlásí. Funguje pro každého narukovaného, Instagram zaručí, kdo píše.
- **Tlačítkem Volunteer na webu** jen převzatí hráči (nepřevzatého hráče web nepozná; přihlášení Googlem + převzetí = jistota, že je to on).
- **5 míst na frakci, kdo dřív přijde.** Výprava jen **občas: 1× za 3 dny** (vyhlásí ranní noviny, přihlášky do dalších ranních novin, vyhodnocení v nich).

**Staty rolí** (inspirace: Darkest Dungeon, XCOM, auto-battlery; čísla k doladění simulací):

| Role | Životy | Útok | Obrana | Schopnost |
|---|---|---|---|---|
| Rifleman | 10 | 4 | 3 | spolehlivý: žádná slabina |
| Machine Gunner | 12 | 5 | 2 | **potlačení:** zasáhne 2 cíle; nepřítel má v 1. kole útok −1 |
| Sapper | 10 | 3 | 4 | **demolice:** +3 útok u kostela, cihelny a lomu (budovy, tunely) |
| Sniper | 7 | 7 | 1 | **první výstřel** před 1. kolem; v mlze útok poloviční, za jasna +2 |
| Stretcher Bearer | 8 | 1 | 2 | **ošetří** každé kolo +3 životy nejhůř zraněnému; zachrání jednoho před smrtí |
| Runner | 7 | 2 | 3 | **iniciativa** + při prohře zajistí ústup (nikdo není zajat) |
| Signaller | 8 | 2 | 2 | **přivolá dělostřelectvo:** 1× zásah za 5, pokud frakce drží kostel/pozorovatelnu nebo je jasno |
| Field Cook | 9 | 1 | 2 | **morálka:** všem ostatním v družstvu +1 útok a +1 obrana |
| Chaplain | 8 | 0 | 3 | **víra:** družstvo se nikdy nedá na útěk; všem +2 životy na začátku |
| Lieutenant | 10 | 4 | 3 | **velení:** všem +1 útok, útočí na nejslabšího nepřítele |

Sám kuchař je slabší než střelec nebo ostřelovač, ale v družstvu zvedne všechny ostatní. Proto záleží na složení.

**Průběh (deterministický, seed = id výpravy, bez AI):**
1. Kolo 0: ostřelovači vystřelí, dělostřelectvo spojaře.
2. Kola 1–5: podle iniciativy útočí každý živý voják na nepřítele; zásah = max(1, útok + k3 − obrana/2). Zdravotník léčí.
3. **Útěk:** družstvo, které ztratí 70 % celkových životů, ustoupí (kaplan brání útěku).
4. **Vítěz** = družstvo, které zůstalo na místě (nebo má víc zbylých životů po 5 kolech). Získá místo a jeho výhodu.
5. **Podmínky:** obránce místa +1 obrana; počasí (mlha nájezdům +1 útok, déšť: kulomet se může zaseknout); výhoda z dobyté kóty.
6. **Bez nepřítele:** když přijde jen jedna frakce, bojuje s místem samotným (miny, plyn, zřícení) a téměř jistě ho obsadí.
7. **Následky:** vojáci na 0 životů jsou většinou **zranění**, menšina **nezvěstná** nebo **zajatá** (poražení bez spojky); smrt jen výjimečně, převzatí hráči chránění.

**Příběh výpravy:** z průběhu boje se poskládá článek na titulní stranu novin (kdo vystřelil první, kdo koho vytáhl, kdo ustoupil) se jmény hráčů. Každý účastník dostane zápis do záznamu. Medaile *Raider's Cross* po 3 výpravách.

## Otevřené otázky
- Smí se na výpravě umřít (s nástupcem z rodu), nebo jen zranění/zajetí? (návrh: výjimečně ano, převzatí chránění)

## Jak je to postavené (9. 11. 2026)

**Kód:** `engine/valley.js` (místa, přihlášky, souboj, následky, články), nastavení `theme.valley` (místa, staty rolí, čísla), texty `story.expedition` + `story.exchanged`.
Napojení: `dailyTick` (vyhodnocení a vyhlášení, účastníci ten den nemají běžný zápis), `applyComment` (heslo místa = přihláška, i pro nováčka v jednom komentáři),
`ingest/poll-comments.mjs` (odpověď pod komentář, přihlášky z webu přes `profiles.volunteer`), web `web/src/valley.js` (tlačítko **Valley**, odkaz `/?valley`).

**Rytmus:** první výprava se vyhlásí v ranním vydání **Day 2 (10. 11. 13:00 UTC)**, kostel; vyhodnocení v dalším vydání; další výprava za 3 dny
(nejdéle nenavštívené místo). Heslo platí pod kterýmkoli sledovaným příspěvkem (připnutý + posledních 5). Seznam dobrovolníků web neukazuje, jen počet.

**Vyladěno simulací** (4 střelci + role X proti 5 střelcům, výhra X): střelec 47 %, ženista 48 %, kaplan 49 %, ostřelovač 69 %, zdravotník 69 %,
kuchař 78 %, poručík 77 %, kulomet 80 %, spojař 32 % (bez dělostřelectva), spojka 23 % (zato zachrání před zajetím). Úpravy oproti tabulce:
- životy ×3 (`hpScale`), zásah = max(1, útok + k9 − obrana/2), léčení a granát spojaře taky ×3 → souboj trvá 2–3 kola;
- kulomet: dva cíle, každý zásah s útokem −4 (`burstMalus`); poručík: +1 útok všem jen v 1. kole (jinak vyhrával 90 %);
- útěk: utíká jen strana, která je na tom hůř; po 5 kolech rozdíl < 10 % = remíza (místo „sporné“, obránce ho udrží);
- výhoda kóty (+1 útok) je silná, proto platí jen během týdne po dobytí.

**Osudy na 0 životech:** padlý 4 % (jen nepřevzatí, ne zachránění zdravotníkem, aspoň 5 dní služby), poražení bez spojky: 35 % zajatí, 20 % nezvěstní, jinak zranění.
Zajatí se vrátí výměnou za 3–6 dní (`story.exchanged`), společná událost výměny zajatců přijde později.

**Výhody z území:** kostel = dělostřelectvo spojařů; pozorovatelna = iniciativa + dělostřelectvo (zpravodajství o přihláškách nepřítele by na veřejných datech nešlo utajit);
mlýn = +2 životy na výpravách; lom = ženisté +2 útok; ruiny = nebezpečí ×0,9; cihelna = přední linie ×0,85; hřbitov = ×0,8 při bombardování; nemocnice = uzdravení 55 % místo 35 %.

**Zbývá:** grafika 7 míst (po 13. 11.), výměna zajatců jako společná událost, víc šablon článků, případně 2 výpravy denně.
⚠️ Tlačítko Volunteer na webu potřebuje nasadit `firestore.rules` (nové pole `volunteer`): `firebase deploy --only firestore:rules --project fronta-ig`. Do té doby web poradí přihlásit se komentářem.
