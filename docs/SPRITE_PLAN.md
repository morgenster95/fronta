# Plán spritů a animací pro videa (2026-11-12)

Cíl: videa, která vypadají jako ze hry. Vojáci ve filmových scénách (`web/src/cinema-race.js`) i ve hře mají dělat víc než stát, chodit, střílet a padnout,
aby šly vyprávět příběhy (wiring party, nosítka, bombardování, pohřeb, dopis z domova, převelení, útok).

Pravidla platí z `docs/PIXELLAB_BRIEF.md`: plátno 32×32, postava 30 px, pata na řádku 30, paleta Trench 24, Concord olivový s plochou přilbou,
Hegemonie šedomodrá s hlubokou přilbou. Nové snímky patří do `web/public/assets/soldiers/<postava>@<animace>_<směr>_<n>.png`
a do `manifest.json` (`anims`). Atlas se přegeneruje sám (workflow `atlas`), ve filmových scénách je hned k dispozici `pose(key, anim, dir, t)`.

**Pozor na termín:** předplacené generace PixelLabu propadají **13. 11. 2026**. Co se má udělat levně, je potřeba vygenerovat do té doby, nejdřív Vlna 1.

## Co máme dnes

| Postava | Animace |
|---|---|
| Puškař Concord / Hegemonie | stání (idle) S/N, chůze 4 směry, střelba (jen směrem k nepříteli), pád (jen jih) |
| Medik (obě strany) | chůze 4 směry |
| Kulometčík | přikrčení a střelba (jen k nepříteli) |
| Odstřelovač | střelba (jen k nepříteli) |
| Ostatní role (ženista, spojař, kuchař, kaplan, spojka, poručík) | jen statická póza v 8 směrech, žádná animace |

Proto videa dnes skládáme hlavně z chůze, stání a pádu, a všechno ostatní (svitek drátu, nosítka, kůl) se domalovává čarami.

## Vlna 1: řadový voják (puškař, obě strany), nejvíc využití

Směry: **východ a západ** (boční pohled pro filmové scény) a **sever/jih** (pohled ve hře, Concord k severu, Hegemonie k jihu).

| # | Animace | Snímků | Směry | Kde ji použijeme |
|---|---|---|---|---|
| 1 | **Plazení** (po břiše, puška v ruce) | 6 | V, Z, S, J | wiring party, noční výpravy, útěk z kráteru, reel o drátu |
| 2 | **Ležet bez hnutí / přitisknout se k zemi** (pod světlicí) | 2 (dýchání) | V, Z, S, J | wiring party (světlice), dělostřelectvo |
| 3 | **Krčit se pod palbou** (ruce na přilbě, v zákopu) | 4 | S, J | bombardování, reel barrage, hra při granátech |
| 4 | **Běh / útok** (puška před sebou) | 6 | V, Z, S, J | OVER THE TOP, závod o kótu, spojka |
| 5 | **Pád dozadu** (Concord padá k jihu, Hegemonie k severu) | 6 | S, J | smrt na obou stranách, dnes padá jen k jihu |
| 6 | **Hodit granát** | 6 | S, J, V | útok, nájezd do zákopu |

Odhad ceny: 6 animací × 4 směry × 2 strany × ~2 generace ≈ **~90 generací**.

## Vlna 2: práce a příběh (příběhové scény)

| # | Animace | Kdo | Snímků | Směry | Kde |
|---|---|---|---|---|---|
| 7 | **Zatloukat kůl / natahovat drát** (klečí, kladivo) | puškař, ženista | 4 | V, Z | wiring party, oprava drátu |
| 8 | **Kopat lopatou** | ženista | 4 | V, Z, S | oprava zákopu, pohřeb, kryty (DUGOUTS) |
| 9 | **Nosítka ve dvou** (dva medici, nosítka mezi nimi) | medik | 6 | V, Z | nosítka, obvaziště, reel o raněných |
| 10 | **Nést raněného přes rameno** | puškař, medik | 6 | V, Z | záchrana z drátu, hrdina |
| 11 | **Obvazovat** (klečí u ležícího) | medik | 4 | V, Z | obvaziště, „DOCTOR“ |
| 12 | **Ranění: kulhání** a **sedět a držet si ruku** | puškař | 6 / 2 | V, Z | po zásahu, nemocnice |
| 13 | **Číst dopis** (sedí na bedně) | puškař | 2–3 | J, V | dopis z domova, reel Mail call |
| 14 | **Pozdrav / salutovat** | puškař, poručík | 3 | J, V | medaile, hrdina kóty, pohřeb |
| 15 | **Klečet u hrobu** (přilba v ruce) | puškař, kaplan | 2 | S | R.I.P., pohřeb |

Odhad ceny: ~9 animací × 2–3 směry × 2 strany × ~2 generace ≈ **~90 generací**.

## Vlna 3: role a nálada (když zbude)

| # | Animace | Kdo | Kde |
|---|---|---|---|
| 16 | **Píšťalka a máchnout rukou** (vpřed!) | poručík | OVER THE TOP |
| 17 | **Točit klikou polního telefonu** | spojař | protipalba, spojař proti granátům |
| 18 | **Míchat v kotli / rozdávat jídlo** | kuchař | klidné ráno, nálada |
| 19 | **Modlit se / žehnat** | kaplan | pohřeb, před útokem |
| 20 | **Běžet se zprávou** | spojka | rozkazy, závod |
| 21 | **Kouřit / ohřívat si ruce** (stání) | puškař | klidné záběry, dialogy |
| 22 | **Nabíjet kulomet / měnit pás** | kulometčík | kulometné hnízdo |

## Rekvizity a efekty (bez nich animace nevyprávějí)

- **Svitek ostnatého drátu, kůly, kladivo, kleště** (16–24 px): wiring party.
- **Nosítka** (prázdná a s raněným), **lékárnička, obvaz**.
- **Lopata, pytle s pískem v ruce, bedna s municí** (AMMO), **dopis a obálka**, **polní telefon**, **kotel**.
- **Světlice** (stoupá, visí, padá, 8 snímků) a její světlo na zemi: noc, wiring party.
- **Kouřový granát, záblesk ústí v noci, jiskry z drátu**.

## Detail pro filmové scény (volitelně)

**Busty 64×64** pro každou stranu se třemi výrazy (klid, křik, raněný). Hodí se do dialogů v Day reelu a k jménům hráčů
(dnes se v dialogu ukazuje jen malý sprite). PixelLab: `create_portrait_character`.

## Pořadí a odhad

1. **Hned (do 13. 11.):** Vlna 1, body 1–4 (plazení, přitisknout se, krčit se, běh) pro obě strany, plus svitek drátu a světlice.
   Asi 60–70 generací. Okamžitě to zlepší wiring party, bombardování a OVER THE TOP.
2. Pak body 5, 6, 9 a 10: smrt k oběma stranám, granát, nosítka, nést raněného.
3. Zbytek Vlny 2 a 3 podle toho, jaké příběhy budou ve hře (dopisy, převelení, pohřby).

Každé generování zapsat do `art/pixellab/LOG.md`, každý sprite projít `tools/sprite_qa.py` (díry, odtržené kousky, pata, paleta)
a ve videu zkontrolovat, že žádný voják není průsvitný.

## Co pak umí videa a hra

- **Wiring party:** plazení k drátu, přitisknutí pod světlicí, zatloukání kůlu, odnesení raněného zpět.
- **Bombardování:** vojáci se krčí, běží do krytu, nosítka.
- **OVER THE TOP:** píšťalka, běh, granáty, pád dozadu.
- **Dopis, převelení, medaile, pohřeb:** čtení, salutování, klečení u hrobu.
- **Ve hře:** ranění kulhají, medici nosí nosítka ve dvou, při granátech se zákop krčí, ženisti kopou.
