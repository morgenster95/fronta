# Denní boj: zásahy, ranění, medici, nemocnice, drát

_Stav k 11. 11. 2026: **nasazeno, vyvážení v12** (`theme.battle.balance`; změny, simulace a důvody v `docs/MECHANICS.md`, výstupy v `docs/sim/`). Tenhle soubor popisuje pravidla, jak je hra počítá teď._
_Role, zkušenosti, simulace a ladění: `docs/COMBAT_ROLES.md`. Kód: `engine/battle.js`. Všechna čísla: `themes/front-ww1/theme.json` → `battle`._
_Texty: `themes/front-ww1/story.json` (`hitLight/Heavy/Crit`, `bullet…`, `shell…`, `shotHit`, `worsened`, `patched`, `patchedStretcher`, `stretcher`, `admitted`, `stabilized`, `diedNoBed`, `diedInBed`, `killedShot`, `killedShell`)._

Základní pravidlo: **většinu smrtí způsobí to, že pro raněného není lůžko, nosítka nebo medik** (~60 % padlých, při bombardování víc).
Zásah palbou zabije na místě jen ve 20 % kritických zásahů (odstřelovač 35 %), přímý zásah granátem v 50 %. Ostatní smrti může komunita ovlivnit:
hlasováním o stavbách a volbou rolí (medici, spojaři, kuchaři, kaplani).
**Převzatí hráči nemají žádnou ochranu.**

## Kdy
Jednou denně v ranním vydání (**13:00 UTC**, `theme.schedule.editionUtc`), před běžnými zápisy do deníků.
Kostky jsou deterministické (ID vojáka + den): opakovaný tah dá stejný výsledek.

## 1. Palba hráčů
Každý voják v **přední linii** má každý den malou šanci trefit nepřítele naproti (do 160 px podle pozice).
Šance podle role, úrovně, velitele nebo spojky poblíž, nepřátelských kulometů a **nasycení** (tabulka v `docs/COMBAT_ROLES.md`):
puškař 17 %, kulometčík 26 %, odstřelovač 30 % denně, po krytí cíle vychází ~0,85 / 1,4 / 1,65 zásahu za týden.
**Nasycení** (`roles.saturation`): když je u střelce víc vlastních střelců než nepřátel na dostřel, trefuje méně (početní převaha nedrtí).
Ve vyrovnaných stranách je to ~0,85 zásahu týdně na puškaře, ve velké proti malé ~0,4.
- Každý cíl nejvýš jeden zásah palbou za den. **Palba hráčů je hlavní zdroj ztrát**; většina jejích zásahů jsou škrábnutí (puškař 83 % lehce, 7 % těžce, 10 % kriticky). Prázdný úsek naproti = není na koho střílet.
- Zapíše se, kdo koho trefil: zasažený má v deníku „Shot by X of the Concord (@x)“, střelec svůj zápis, Gazette blok *Across the wire*.

## 2. Zásahy z pozadí
Šance na vojáka a den:

`1,5 % × linie (přední 1 · zálohy 0,35 · týl 0) × pytle (−12 % za stupeň) × drát (až −15 % podle výdrže úseku) × zkušenost (až −40 % po 60 dnech služby) × nebezpečí × spojař poblíž (−20 % × pokrytí: jeden spojař pokryje 10 vojáků)`

- **Nebezpečí:** po dobytí kóty má vítěz 7 dní ×0,6 a poražený ×1,25; k tomu rozkazy z hlasování a (až budou zapnuté) území v údolí.
  Poražený má během bombardování navíc ×1,3.
- **Denní mez** (`battle.daily`): zásahy z pozadí se doplní aspoň na **1 nově raněného na 80 vojáků strany** (`min`, `per`), horní mez `max` je 99 (tj. bez meze),
  pod granáty nejvýš **30 na 80 vojáků** (`shellMax`). Palba hráčů se do meze počítá, ale sama se neomezuje. Meze rostou s velikostí strany.
- **Děla mlčí do první dobyté kóty** (`gunsAfterVictory`): do té doby jsou zásahy z pozadí kulky, granáty a drát a texty o ostřelování se nepoužijí.

### Závažnost
U zásahů z pozadí lehce 55 %, těžce 30 %, kriticky 15 %; palba hráčů podle role (puškař 83 / 7 / 10 %, kulometčík 75 / 21 / 4 %, odstřelovač 45 / 25 / 30 %), posunuto **výdrží** vojáka (1–5; +1 za každé přežité těžké zranění).
Kritický zásah nepřijde v prvních 3 dnech služby a ne dvakrát za 7 dní (stane se z něj těžký).

### Bombardování po dobytí kóty
Tři dny (`theme.race.barrageDays`), začíná den po dobytí; na webu je palba vidět už v den dobytí.
- Každý den granáty dopadnou na **30 % úseků poražené strany, aspoň 4** (`battle.shell.share`, `sectors`); při 23 úsecích je to 7.
- Každý voják v zasaženém úseku má **50 %** šanci na zásah (× linie × pytle × spojař poblíž: −40 % × pokrytí, `roles.signaller.counterShell`).
  Střepiny zraňují tíž: lehce 30 %, těžce 40 %, kriticky 30 %. **Přímý zásah (`shell.kill`): polovina kritických zásahů zabije na místě.**
  **Granát nešetří nováčky.** Zasahuje všechny role stejně. Kdo už leží raněný, se nezraňuje znovu.
- Drát v zasaženém úseku přijde o 40 %, ve všech úsecích poraženého o dalších 12 % denně.
- Gazette jmenuje úseky a těžce raněné.

## 3. Kam s raněným
| Zranění | Kde leží |
|---|---|
| lehce | v zákopu, zůstává ve svém úseku |
| těžce | lůžko → nosítka → zákop (horší) |
| kriticky | lůžko → nosítka. **Bez lůžka i nosítek noc nepřežije.** |

Lůžka dostávají nejdřív kritičtí, pak těžce ranění (kdo je raněný déle, jde dřív). Po každém uzdravení nebo úmrtí se místa hned doplní.
**Triáž** (`care.triage`): kritický bez místa vezme lůžko nebo nosítka těžce raněnému (ten jde o stupeň níž).

| Místo | Lůžka | Nosítka | Hojení těžkého na lůžku | Riziko smrti kritického na lůžku |
|---|---|---|---|---|
| **Obvaziště** (má každá strana od začátku) | 2 | 6 + 1 za každého medika | ×1,15 | ×0,8 |
| **Nemocnice** (dugout, jen hlasováním) | 4 za každou nemocnici | 6 + 4 za každou + 1 za každého medika | ×1,5 | ×0,4 |

První nemocnice lůžka obvaziště **nahrazuje** (4 místo 2, ne 6). Každá další přidá 4 lůžka a 4 nosítka (nejvýš 6 nemocnic).
**Lůžka jsou pevná** (nemocnice jen hlasováním), škálovat smí jen to, co volí hráči: medici nesou nosítka (`aidPost.stretchersPerMedic`).

## 4. Medici a hojení
Medik (Stretcher Bearer) má za den **práci 2**, násobenou úrovní (Elite ×1,8). Lehce raněný medik odvede polovinu, těžce raněný nic.
Potřeba za den: **lehce 0,4, těžce 1, kriticky 2, na lůžku 0** (tam léčí nemocnice). Práce se rozděluje od nejvážnějších.
„Péče“ níže = podíl potřeby, který raněný dostal (0–1).

| Stav | Co se děje každou noc |
|---|---|
| **lehce** | První den nic. Pak: zhoršení na těžce `25 % × chybějící péče` (kuchař poblíž až ×0,5; ne v prvních 3 dnech služby), jinak zahojení `péče + 40 %` (kuchař poblíž přidá až 30 %; jeden kuchař pokryje 4 lehce raněné). S plnou péčí je druhý den v pořádku. |
| **těžce na lůžku** | Od 2. dne se uzdraví s `35 % × hojení místa` za den (obvaziště ~40 %, nemocnice ~53 %). |
| **těžce na nosítkách** | Zhoršení na kriticky `30 % × chybějící péče`; od 2. dne uzdravení `35 % × péče`. |
| **těžce v zákopu** | Totéž, ale zhoršení ×1,5 a uzdravení ×0,5. |
| **kriticky na lůžku** | Smrt `50 % × riziko místa` za noc (obvaziště 40 %, nemocnice 20 %). Po 3 nocích je z něj těžce raněný. |
| **kriticky na nosítkách** | Smrt `50 % + 70 % × chybějící péče` za noc (kaplan ×(1 − 0,2 × pokrytí); jeden kaplan pokryje 3 umírající). Po 3 nocích s plnou péčí je z něj těžce raněný. |
| **kriticky bez nosítek** | Noc nepřežije. |

Kdo se uzdraví z těžkého zranění, má jizvu, +1 výdrž a 10 XP.
**Pojistka** (`battle.maxDeaths`): za den padne nejvýš 5 % strany (aspoň 2); kdo by padl navíc, přežije do zítřka.
Padlého nahradí **nástupce z rodu hned ve stejném vydání** (`theme.heirDelay`, výchozí 0) a pokračuje v deníku rodu.

## 5. Drát
Každý úsek má výdrž 0–100 % (start 60 %). Kryje až −15 % zásahů z pozadí.
Opotřebení −0,5 % denně, bombardování −12 % denně (zasažený úsek dalších −40 %), každý ženista v úseku +8 % denně (× úroveň).

## Stavby (jen hlasováním frakce)
Možnost hlasování s `build: "<id>"` (`theme.battle.buildings`). Každá strana hlasuje sama za sebe, hlas se páruje s vojákem podle IG účtu.
**Strana, která nepošle žádný hlas, nepostaví nic.** Při remíze vyhrává možnost uvedená dřív.

| Stavba | id | Co dá | Nejvýš |
|---|---|---|---|
| Nemocnice (hospital dugout) | `dugout` | viz tabulka míst výše | 6 |
| Pytle s pískem | `sandbags` | −12 % zásahů za stupeň, natrvalo | 2 |
| Nový drát | `wire` | +50 % výdrže drátu ve všech úsecích (jednorázově) | bez omezení |

Co která strana má, je ve stavu hry (`state.battle.sides[frakce].built`) a na webu.
První hlasování o stavbách (`vote-build-d2`, HOSPITAL / SANDBAGS) se vyhodnocuje ve vydání Dne 3 (11. 11. 2026).

Možnost může místo stavby (nebo k ní) vydat **dočasný rozkaz** (`engine/orders.js`): `danger` (násobek nebezpečí) nebo `recover`
(rychlejší uzdravení na lůžku) na `days` dní od dalšího dne.

**Hlasování běží vždy jen jedno.** Post s `vote`, který vyjde při běžícím hlasování, ho nepřepíše: počká (`votePending`) a otevře se po vyhodnocení.
Vyhodnocuje ranní vydání, nejdřív `minHours` po otevření.

## V Gazette a na mapě
- Gazette: *Across the wire* (kdo koho trefil), zpráva o bombardování, blok o obvazištích (*The aid posts* / *Hospitals and aid posts* / *The hospitals*
  podle toho, kdo už nemocnici má) s obsazením lůžek, nosítek a pokrytím mediky.
- Mapa (`web/src/hospital.js`): obvaziště je stan mezi podpůrnou linií a zálohami; postavená nemocnice je velký dugout za zálohami
  (`dugoutArt`, náhled `/?hospital=dugout`), každá další stojí vedle. Na lůžkách leží skuteční ranění hráči, jejich místo v zákopu je prázdné.
  Kdo se nevešel, leží na nosítkách před vchodem. Data: `roster.json` → `battle` (`battlePublic`).

## Vyzkoušení nanečisto (nic se neuloží)
```
node tools/preview-tick.mjs --md nahled.md   # příští vydání na skutečném stavu: Gazette, kdo koho trefil, obvaziště
node tools/sim-battle.mjs --kpi              # scénáře na skutečné soupisce + cílová čísla
node tools/sim-battle.mjs 2 --story          # jeden scénář den po dni
```
