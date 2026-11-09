# Návrh: střelba, role, zkušenosti a evakuace raněných

_Stav: **návrh ke schválení (10. 11. 2026)**, nic z toho zatím není postavené. Navazuje na `docs/BATTLE.md` (zásahy, medici, lůžka, drát)._

## 1. Cíle
1. **Každá role má jednu jasnou funkci**, kterou žádná jiná nedělá, a hráč pozná, že na ní záleží.
2. **Všechno do sebe zapadá:** palba → zranění → nosiči → péče → lůžka → smrt / návrat. Každý krok má svou roli a svou stavbu.
3. **Vše se dá ladit bez programování:** každé číslo je v `themes/front-ww1/theme.json` (`battle`, `roles`, `xp`) s popsaným bezpečným rozsahem.
   Simulace ukáže dopad změny dřív, než jde do hry.
4. **Bezpečné v ostrém provozu:** vypínač, stínový režim, pojistka proti masakru, denní metriky a upozornění.

## 2. Co říká historie (kalibrace)
| Fakt | Zdroj | Co z toho bereme |
|---|---|---|
| ~60 % zranění britských vojáků způsobilo dělostřelectvo a střepiny, ~35–40 % kulky z pušek a kulometů | oficiální lékařská historie (shrnutí: WFA, Foreign Policy, GCSE) | zásahy dělíme na **pozadí** (dělostřelectvo, granáty, ~60 %) a **palbu hráčů** (puška, kulomet, ostřelovač, ~40 %) |
| Prapor (~800 mužů) měl ~16 nosičů, na jedna nosítka 4–6 mužů | GCSE/RAMC, Australian museum | nošení raněného je **drahé**: spotřebuje práci 2 nosičů na půl dne |
| Obvaziště (RAP) ~200 m za frontou, raněné nedrželo, jen první pomoc a dál | RAMC, IWM | obvaziště má málo míst a horší péči, nemocnice (dugout) je skutečná péče |
| „Wastage“: i v klidu ztráty každý den, v aktivních úsecích až ~10 % jednotky za měsíc | Canadian War Museum, Great War Forum | cíl: klid ~3–5 % strany zraněno za týden, smrt výjimečná; bombardování a nedostatek péče to výrazně zhorší |

## 3. Herní inspirace (co si bereme)
- **XCOM:** šance zasáhnout = přesnost střelce − krytí cíle; kritický zásah zvlášť. → vzorec palby níže.
- **Battle Brothers:** role + úrovně + zranění, ztráta zkušeného vojáka bolí. → XP a úrovně, nástupce od nuly.
- **Darkest Dungeon:** „práh smrti“, smrt není hned. → kritický stav, smrt až bez péče.
- **Frostpunk:** kapacita nemocnice a lidí, kteří ji obsluhují. → lůžka + medici.
- **Lanchesterův zákon:** u střelby rostou ztráty se čtvercem přesily (silnější strana se „rozjede“). → **ochrana: palba jen do protějšího úseku** (úsek = 4 vojáci), přebyteční střelci strhají palbu jinam s nízkou účinností (viz 4.1).
- **Ochrana před smůlou:** stejný voják nedostane kritický zásah dvakrát za týden, nováček prvních 5 dní ne (už hotové).

## 4. Model jednoho dne (pořadí kroků v ranním tahu)
### 4.1 Palba hráčů (souboj úseků)
Každý voják v přední linii, který střílí (role s `fire > 0`), vystřelí na nepřítele v **protějším úseku** (podle pozice x, dosah `roles.range` px).
Pro každý pár střelec → úsek:
```
očekávané zásahy = fire(role) × úroveň(XP) × velitel(úsek) × potlačení(kulomety nepřítele) × počasí
šance pro konkrétní cíl = očekávané / počet cílů v úseku × krytí(cíl: drát, pytle, linie, výdrž)
```
- **Strop úseku (anti-snowball):** do jednoho úseku smysluplně střílí nejvýš `roles.frontage` střelců (výchozí 4), další přidávají jen `roles.overflow` (výchozí 25 %).
  Větší strana tak střílí víc jen tam, kde má proti sobě koho.
- **Kdo koho trefil** se ukládá: zasažený má v deníku „…wounded by @x“, střelec si připíše zásah (žebříček Marksmen, XP).

### 4.2 Pozadí (dělostřelectvo, granáty, miny)
Zbytek zásahů jako dosud (`battle.hit`), jen snížený tak, aby palba hráčů tvořila ~40 % všech zásahů. Bombardování po výhře v závodě zůstává (2 úseky denně).

### 4.3 Závažnost podle zdroje
| Zdroj | lehce | těžce | kriticky |
|---|---|---|---|
| puška | 60 % | 30 % | 10 % |
| kulomet | 70 % | 25 % | 5 % |
| ostřelovač | 35 % | 40 % | 25 % |
| dělostřelectvo (pozadí) | 60 % | 28 % | 12 % |
| bombardování | 45 % | 35 % | 20 % |
Výdrž vojáka (1–5) posouvá k lehčímu. Kaplan a kuchař tu nic nemění (jejich role je morálka, viz 5).

### 4.4 Evakuace (nosiči = Stretcher Bearer)
Hra už má roli **medic = Stretcher Bearer** („Carries the wounded out“), přesně jako skuteční nosiči: **nosí raněné a dávají první pomoc.**
Každý nosič má za den **1 práci** (zkušený víc). Práce se utrácí v tomto pořadí:
1. **Odnést** těžce/kriticky raněného z linie k obvazišti/nemocnici: **1 práce** (2 nosiči na půl dne). Kritičtí první.
   Neodnesený zůstává ležet **na svém stanovišti v zákopu** (na mapě) do dalšího dne, bez péče na nosítkách.
2. **Ošetřit** raněné mimo lůžko (lehce ranění v poli, ti na nosítkách, neodnesení): **2 práce na raněného za den** (dosavadní pravidlo).
   2 nosiči tedy plně postarají o jednoho raněného, kritického tím udrží naživu.
3. Na lůžku se raněný léčí sám (péče nemocnice), nosiče nepotřebuje.

**Runner** nosí rozkazy, ne raněné (viz 5): zrychlí, že nosiči vědí, kam jít (+efektivita nošení), a drží velení, když padne důstojník.

### 4.5 Péče, lůžka, smrt
Beze změny proti `docs/BATTLE.md`: lůžka podle závažnosti, nosítka, kritický bez péče umírá, na lůžku je úmrtnost nemocnice.

### 4.6 Zkušenosti (XP) a úrovně
| Zdroj XP | body |
|---|---|
| přežitý den v přední linii / v zálohách | 2 / 1 |
| zásah nepřítele (lehce / těžce / kriticky) | 8 / 12 / 16 |
| odnesený raněný / ošetřený den raněného | 6 / 3 |
| opravený drát (za 10 %) | 3 |
| výprava (účast / vítězná) | 15 / 25 |
| přežité těžké zranění (jizva) | 10 |

| Úroveň | XP | násobek hlavní schopnosti role |
|---|---|---|
| Recruit | 0 | ×1,0 |
| Seasoned | 60 | ×1,25 |
| Veteran | 180 | ×1,5 |
| Elite | 400 | ×1,8 |
Nástupce začíná od nuly (už platí). Úroveň je vidět na kartě vojáka a v žebříčcích.

## 5. Role (každá jedna jasná funkce)
| Role | Funkce | Hlavní parametr (výchozí) | Co zlepšuje XP |
|---|---|---|---|
| **Rifleman** | běžná palba, páteř úseku | `fire` 1,2 % zásahu/den | přesnost |
| **Machine Gunner** | **potlačení**: snižuje palbu nepřítele v protějším úseku; hodně střel, spíš lehká zranění | `fire` 2,5 %, `suppress` −25 % palby nepřítele | potlačení, přesnost |
| **Sniper** | **přesné zásahy**: málo ran, často kriticky, přednostně na kulometčíky a důstojníky | `fire` 4 %, `pick` 50 % | přesnost |
| **Lieutenant** | **velení**: +20 % palby a +25 % XP vojákům v úseku a dvou sousedních | `lead` +20 % | dosah velení |
| **Stretcher Bearer** | **nošení a první pomoc** (4.4) | `work` 1/den | práce/den (až 1,8) |
| **Runner** | **spojení**: nosičům v úseku +25 % práce (vědí kam jít), bez důstojníka drží velení na polovině | `relay` +25 % | dosah |
| **Signaller** | **telefon k dělostřelectvu**: vlastní bombardování přesnější (+1 úsek), nepřátelské pozadí na jeho úsek −20 % | `counter` −20 % | síla |
| **Sapper** | **drát a pytle**: opravuje drát (+8 %/den), naslouchá podkopům (výpravy) | `repair` 8 % | oprava |
| **Field Cook** | **morálka**: lehce ranění v jeho úseku se hojí o 30 % rychleji, méně zhoršení | `heal` +30 % | dosah |
| **Chaplain** | **morálka a poslední útěcha**: kritičtí na nosítkách v jeho blízkosti přežijí noc o +15 % pravděpodobněji | `faith` +15 % | síla |

Nebojové role (nosič, kuchař, kaplan, spojař, runner) střílí jen symbolicky (`fire` 0,3 %).
Role se dá změnit jako dosud (komentář při narukování, převelení na kartě).

## 6. Cílová čísla (KPI) pro ladění
Pro stranu o 50 vojácích, týdně, bez bombardování:
| Ukazatel | cíl (pásmo) |
|---|---|
| zásahy celkem | 10–16 (≈ 3–4,5 % strany) |
| podíl palby hráčů na zásazích | 35–45 % |
| kritické zásahy | 1–2 |
| padlí s nemocnicí a ≥4 nosiči | 0,2–0,8 |
| padlí bez nemocnice | 1–2,5 |
| padlí při bombardování bez nemocnice (14 dní) | 3–6 |
| nejlepší střelec za 30 dní | 3–6 zásahů |
| Seasoned po 30 dnech | ~polovina přeživších |
Simulace (`node tools/sim-battle.mjs --kpi`) vypíše každý ukazatel s ✓ / ⚠ podle pásma.

## 7. Ladění (nerf / buff)
- **Každé číslo v `theme.json`** (`battle`, `roles.<role>`, `xp`), u každého v `_ranges` bezpečné pásmo a popis.
- **Zkouška bez úpravy souboru:** `node tools/sim-battle.mjs --set roles.sniper.fire=0.03 --set battle.hit=0.012`
  (porovná KPI s výchozím nastavením vedle sebe).
- **Verze vyvážení** `battle.balance` (číslo) se zapisuje do denních metrik, takže je vidět, od kdy platí jaké hodnoty.
- Změna čísla = commit do `theme.json`, smyčka ji použije od dalšího ranního tahu. Stav hráčů se nepřepočítává zpětně.

## 8. Ostrý provoz (pojistky)
1. **Vypínač:** `battle.enabled` (false = starý jednoduchý model). Návrat zpět je jeden commit.
2. **Stínový režim** `battle.shadow: true`: smyčka denní boj spočítá na kopii stavu, uloží jen metriky (co by se stalo), hráčům nic nezmění.
   Doporučení: **3–5 dní stínově**, porovnat se simulací, pak zapnout naostro.
3. **Pojistka proti masakru:** nejvýš `battle.maxDeathsPerDay` (výchozí 5 % strany, min. 2) padlých za den na stranu.
   Kdo by padl navíc, zůstane kriticky raněný (přežije do dalšího dne) a smyčka založí GitHub issue (přijde e-mail).
4. **Denní metriky** `state.battle.stats` (zásahy podle zdroje a role, padlí podle příčiny, obsazenost lůžek, pokrytí nosiči, XP) —
   když vyjdou mimo pásmo KPI 3 dny po sobě, issue s upozorněním.
5. **Determinismus:** všechny kostky z ID vojáka + dne; opakovaný tah (kolize v gitu) dá stejný výsledek, nic se nezdvojí.
6. **Převod stávajících vojáků:** chybějící XP = odhad z dnů ve službě, bez zpětných zásahů; nikdo nepřijde o to, co má.
7. **Testy:** 90denní simulace hlídá KPI pásma a horní mez úmrtí; test na každou roli (že dělá to, co má, a nic víc).

## 9. Pořadí stavby (ve větvi `battle`, nic do hry bez souhlasu)
1. Konfigurace `roles` + `xp` + `_ranges` v `theme.json`, načítání s výchozími hodnotami.
2. Palba hráčů po úsecích (4.1) + závažnost podle zdroje + „wounded by @x“.
3. Evakuace nosiči (4.4) + runner, kuchař, kaplan, spojař, ženista podle tabulky 5.
4. XP a úrovně, žebříčky Marksmen / Snipers / Most experienced, úroveň na kartě vojáka (náhled ke schválení).
5. Simulace: `--kpi`, `--set`, porovnání; ladění na reálné soupisce, dokud KPI nesedí.
6. Pojistky (8): vypínač, stínový režim, strop úmrtí, metriky, upozornění.

## 10. Otázky k rozhodnutí
1. **Nebojové role a střelba:** mají nosič, kuchař a kaplan střílet vůbec (návrh: symbolicky 0,3 %), nebo vůbec ne?
2. **Stínový režim před spuštěním:** 3–5 dní stínově, nebo zapnout rovnou po schválení simulací?
3. **„Wounded by @x“ veřejně:** jmenovat střelce v deníku zasaženého (zábavné, ale může vyvolat „osobní“ spory mezi hráči)?

## Zdroje
- [British Medical Casualties on the Western Front (Western Front Association)](https://www.westernfrontassociation.com/world-war-i-articles/british-medical-casualties-on-the-western-front-wound-induced-trauma-related-to-technological-advances-in-war)
- [Artillery as the top killer (Foreign Policy)](https://foreignpolicy.com/2012/05/03/other-sad-facts-i-learned-from-six-weeks-artillery-as-the-top-killer-the-hordes-of-shellshock-cases-decades-later/)
- [Wounds from Injuries on the Western Front (Save My Exams)](https://www.savemyexams.co.uk/gcse/history/edexcel/18/revision-notes/medicine-in-britain-c-1250-present/the-british-sector-of-the-western-front-injuries/wounds-from-injuries-on-the-western-front)
- [The Chain of Evacuation in the First World War (Save My Exams)](https://savemyexams.com/gcse/history_the-thematic-historic-environment-paper-1/edexcel/24/revision-notes/medicine-in-britain-c1250-present/the-british-sector-of-the-western-front-treatment/the-chain-of-evacuation-in-the-first-world-war)
- [Medical Evacuation Chain – Stretcher Bearers (Collections WA)](https://collectionswa.net.au/items/1f85b4a4-d45e-4afc-9e76-65147f8f91b8)
- [A short guide to medical services during the First World War (IWM)](https://www.iwm.org.uk/history/a-short-guide-to-medical-services-during-the-first-world-war)
- [Wastage (military) (Wikipedia)](https://en.wikipedia.com/wiki/Wastage_(military))
- [Quiet areas (Great War Forum)](https://www.greatwarforum.org/topic/28581-quiet-areas/)
- [Canadian War Museum – trench warfare](https://www.warmuseum.ca/firstworldwar/wp-json/wp/v2/pages/269)
