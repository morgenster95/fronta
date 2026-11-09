# Návrh: mapa údolí a výpravy (mise)

_Stav: návrh k odsouhlasení (9. 11. 2026). Nic z toho zatím není postavené._

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

## Otevřené otázky
- Přihlášky jen převzatí hráči (motivace k převzetí), nebo kdokoli komentářem?
- 1 výprava denně, nebo víc na výběr?
- Smí se na výpravě umřít (s nástupcem z rodu), nebo jen zranění/zajetí?
