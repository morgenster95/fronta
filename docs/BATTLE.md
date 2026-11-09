# Denní boj, medici, nemocnice a ostnatý drát

_Stav: **1. fáze (engine) postavena 9. 11. 2026, ladí se, NENASAZENO (necommitovat do main bez souhlasu).** Kód: `engine/battle.js`, nastavení `themes/front-ww1/theme.json` → `battle`,
texty `themes/front-ww1/story.json` (`hitLight`, `hitHeavy`, `hitCrit`, `shellLight`, `shellHeavy`, `shellCrit`, `worsened`, `patched`, `stretcher`, `admitted`, `stabilized`, `diedNoBed`, `diedInBed`)._

## Inspirace
- **Darkest Dungeon (Death's Door):** na nule se neumírá hned, voják je „na prahu“ a smrt přijde až potom. Smrt je vzácná a dramatická.
- **XCOM (bleeding out, ošetřovna):** těžce raněný vykrvácí, když k němu včas nedojde pomoc; zranění = dny na ošetřovně.
- **Frostpunk:** nemocnice má omezenou kapacitu, kdo se nevejde, tomu se stav horší a může zemřít.
- **RimWorld:** výsledek ošetření ovlivňuje lékař, lůžko a péče.
- **Battle Brothers:** přežitá zranění zanechávají jizvy; veteráni mají historii.

Základní pravidlo: **zásah sám nikdy nezabíjí. Zabije to, že pro raněného není lůžko nebo medik.** Každá smrt má příčinu, kterou komunita
může ovlivnit hlasováním (stavby) a volbou role (medici).

## Denní tah (13:00 UTC, před zápisy do deníků)
1. **Zásahy.** Každý aktivní voják v linii (kromě účastníků výpravy):
   `hit 2,5 % × linie (přední 1, zálohy 0,35) × nebezpečí (závod, údolí, rozkazy) × dělostřelectvo (×1,3 na poraženého) × pytle (−12 % za stupeň) × drát (−15 % × výdrž sektoru) × zkušenost (až −40 % po 60 dnech)`.
   **Převzatí hráči nemají žádnou ochranu.**
2. **Závažnost:** lehké ~60 %, těžké ~25 %, kritické ~15 %, posunuté **výdrží** (1–5; +1 za každé přežité těžké zranění = jizva).
   Kritický zásah ne v prvních 5 dnech služby a ne dvakrát za 7 dní; nováček se na nosítkách na kritický stav nezhorší.
3. **Medici:** každý raněný (lehký i těžký) spotřebuje práci **2 mediků**. Pokrytí = práce mediků ÷ (2 × raněných).
   Medik s 10+ ošetřenými odvede 1,5 práce, lehce raněný medik polovinu, těžce raněný nic.
4. **Lehce raněný** zůstává v linii, ošetřují ho medici: při nedostatku mediků se může zhoršit na těžké (až 15 %/den), jinak se zahojí (30–80 %/den).
5. **Lůžka:** těžce a kriticky ranění potřebují lůžko, kritičtí mají přednost. Kdo se nevejde, čeká **na nosítkách**:
   těžký se může zhoršit na kritický, kritický přečká nejvýš jednu noc (šance roste s mediky), druhou noc bez lůžka umírá.
6. **Na lůžku:** kritický první den umírá s pravděpodobností úmrtnosti nemocnice (vyšší bez mediků), po 3 dnech je stabilizovaný;
   těžký se uzdraví nejdřív za 2 dny (rychleji s mediky, Calvary Farm a rozkazy). Uzdravený má jizvu a +1 výdrž.
7. **Drát** v každém sektoru: výdrž 0–100 % (start 60 %), opotřebení −0,5 %/den, dělostřelectvo −12 %/den, každý ženista v sektoru +8 %/den.

8. **Bombardování po výhře v závodě** (3 dny, `theme.battle.shell`): každý den granáty dopadnou na **2 sektory poražené strany**
   (~8 vojáků). Tam má každý **35 %** šanci na zásah, střepiny zraňují tíž (lehce 45 %, těžce 35 %, kriticky 20 %),
   **granát nešetří nováčky** a drát v sektoru přijde o 40 %. Gazette jmenuje sektory a těžce raněné.
   Řetěz: granáty → roztrhaný drát (víc zásahů i potom) → medici nestačí → lůžka plná → nosítka → padlí.

Padlého nahradí nástupce z rodu za 2 dny (beze změny).

## Stavby (jen hlasováním frakce)
Možnost hlasování s `build: "<id>"`. Bez staveb má strana jen **obvaziště**: 2 lůžka, horší péče (×0,6), kritičtí na lůžku umírají častěji (35 %).

| Stavba | id | Co dá |
|---|---|---|
| **Nemocnice (nemocniční dugout)** | `dugout` | 4 lůžka místo obvaziště, normální péče, úmrtnost kritických na lůžku 25 %. Další nemocnici (dalších 4 lůžek) si strana může odhlasovat (max 6). |
| Pytle s pískem | `sandbags` | −12 % zásahů za stupeň (max 2) |
| Nový drát | `wire` | +50 % výdrže drátu ve všech sektorech |

Hlasování po výhře o Verdel Ridge (`victory-ridge` ve frontě): FORTIFY = `sandbags`, HOSPITAL = `dugout`.

## Čísla (simulace na skutečné soupisce 9. 11.: Hegemony 49 vojáků / 5 mediků / 0 ženistů, Concord 47 / 6 / 6)
`node tools/sim-battle.mjs`, 14 dní, každý scénář 60× s jinými kostkami, průměr na stranu za 14 dní:

| Scénář | Strana | Zásahů | Těžce / kriticky | **Padlých** | Aspoň 1 padlý |
|---|---|---|---|---|---|
| 1) klidná fronta, nic nepostaveno | každá | ~12,5 | 3,8 / 0,7 | **~1,3** | 60–67 % |
| 2) klidná fronta, obě mají nemocnici | každá | ~12,7 | 3,8 / 0,8 | **~0,46** | 32–38 % |
| 3) Hegemony vyhraje, Concord pod granáty **bez** nemocnice | Concord | 20,7 | 7,0 / 1,3 | **5,9** | 100 % |
| 4) totéž, Concord **s** nemocnicí | Concord | 21,3 | 7,1 / 1,5 | **2,3** | 87 % |
| 3/4) vítěz (bezpečnější týden) | Hegemony | 10,5 | 3,2 / 0,6 | **~1,0** | 52 % |
| 5) Concord vyhraje, Hegemony pod granáty bez nemocnice | Hegemony | 21,6 | 7,4 / 1,3 | **5,9** | 98 % |
| 6) totéž s nemocnicí | Hegemony | 22,3 | 7,6 / 1,6 | **2,3** | 85 % |

Ladí se v `theme.battle`: `severity` (podíl těžkých a kritických), `buildings.dugout.critDie` a `aidPost.critDie` (úmrtnost na lůžku),
`hit` (zásahy za klidu), `shell` (síla bombardování: `sectors`, `hit`, `severity`, `wire`). Hlídací testy v `npm test`.

## Vyzkoušení nanečisto (kopie skutečného stavu, nic se neuloží)
```
node tools/sim-battle.mjs                  # všech 6 scénářů, každý 40× po 14 dnech, průměry
node tools/sim-battle.mjs 4 --story        # scénář 4 jednou, den po dni: lůžka, nosítka, medici, drát, zápisy z deníků
node tools/sim-battle.mjs --days 21 --runs 100
```

## Na mapě (web/src/hospital.js)
Každá strana má za podpůrnou linií nemocnici (bez stavby menší obvaziště), na volném místě mimo zákopy blízko svých vojáků.
Zdálky je zakrytá plachtou s červeným křížem (Hegemony šedá, Concord olivová), při přiblížení (zoom 2,4 → 3,2) se plachta odkryje
a uvnitř leží na lůžkách skuteční těžce ranění hráči (ležící sprite). Jejich místo v zákopu je prázdné, dokud se nevrátí.
Kdo se nevešel, leží na nosítkách před vchodem. Každá další odhlasovaná nemocnice stojí vedle. Snímek: `docs/mockups/family/5_nemocnice_na_mape.png`.

Úmrtnost s pevnými 4 lůžky roste s velikostí strany (klidná fronta, 4 týdny): 100 vojáků ~4 %, 250 vojáků ~10 % strany.
Na hráčích je, jestli si odhlasují další nemocnici.

## Další fáze
2. **Web a mapa:** nemocniční dugout(y) za zákopem každé strany, na lůžkách ležící sprite raněných hráčů (poslední snímek `@fall_south`),
   nosítka před vchodem, medici u raněných, řídnoucí drát podle výdrže, staty na kartě vojáka (výdrž, jizvy, ošetření u mediků).
   Data už jsou v `roster.json` → `battle` (`battlePublic`).
3. **Grafika:** interiér dugoutu se 4 lůžky (PixelLab), nosítka.
4. **Hlasování o stavbách** i mimo výhru v závodě (pravidelně s večerním reelem).
