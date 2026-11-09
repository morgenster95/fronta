# Střelba, role, zkušenosti a péče o raněné

_Stav: **postaveno ve větvi `battle` (10. 11. 2026), vyvážení v4, NENASAZENO.** Kód `engine/battle.js`, čísla `themes/front-ww1/theme.json` → `battle`._
_Nikdo zatím nemá nemocnici: obě strany mají jen obvaziště (2 lůžka, 6 nosítek), které jim dáváme my._

## 1. Pravidla jednoho dne (ranní tah, 13:00 UTC)
1. **Palba hráčů.** Každý voják v přední linii má každý den malou šanci trefit nepřítele **naproti** (do 160 px podle pozice).
   Zapíše se **kdo koho trefil**: zasažený má v deníku „Shot by X of the Concord (@x)“, střelec svůj zápis, Gazette blok *Across the wire*.
   Každý cíl nejvýš jeden zásah palbou za den. Prázdný úsek naproti = není na koho střílet (ochrana proti „válcování“ větší strany).
2. **Pozadí** (dělostřelectvo, granáty, miny): jako ve skutečné válce ~60 % zásahů. Po výhře v závodě bombardování 2 úseků poražené strany 3 dny.
3. **Kam s raněným:** lůžko (kritičtí první, pak těžce), pak nosítka. **Lehce raněný leží v zákopu.**
   **Kritický bez nosítek i lůžka noc nepřežije. Těžce raněný bez nosítek leží v zákopu (vyšší riziko).**
4. **Medici (Stretcher Bearer):** každý má za den **1 práci** (víc se zkušenostmi). Potřeba za den: **lehký 1, těžký 2, kritický 2, na lůžku 0.**
   Práce se rozdělí od nejvážnějších. **Plná péče: lehký je druhý den v pořádku, těžký se hojí, kritický přežije noc.**
   Chybějící péče = riziko zhoršení / smrti úměrně tomu, kolik péče chybí.
5. Drát (ženisté), XP za den, denní metriky, pojistka proti masakru.

## 2. Role: co dělá a kolik to je
Šance „fire“ je na vojáka v přední linii a den. Skutečný zásah je o něco nižší (krytí cíle, potlačení kulomety).

| Role | Funkce | Čísla (výchozí) | Očekávaně za 4 týdny (1 voják, Recruit) |
|---|---|---|---|
| Rifleman | běžná palba | fire 1,7 %; zásah 60 % lehce / 28 % těžce / 12 % kriticky | ~0,4 zásahu |
| Machine Gunner | **potlačení**: každý kulomet naproti −15 % palby nepřítele (max −45 %); hodně ran, spíš lehká zranění | fire 3 %; 70/25/5 % | ~0,7 zásahu |
| Sniper | **přesnost**: často kriticky, 50 % šance vybrat si kulometčíka/důstojníka | fire 4,5 %; 35/40/25 % | ~1 zásah |
| Lieutenant | **velení**: vojákům poblíž +20 % palby a +25 % XP | fire 0,8 % | — (násobí ostatní) |
| Runner | **spojka**: bez důstojníka poblíž +25 % palby vojákům poblíž (rozkazy dojdou) | fire 0,4 % | — |
| Stretcher Bearer | **péče** (krok 4) | práce 1/den (Elite 1,8) | 1 lehce raněný nebo ½ těžce raněného denně |
| Signaller | **protipalba**: vojáci poblíž −20 % zásahů z dělostřelectva | fire 0,4 % | — |
| Sapper | **drát**: +8 % výdrže drátu v úseku za den (drát kryje až −15 % zásahů) | fire 0,4 % | — |
| Field Cook | **morálka**: lehce ranění poblíž se i bez medika častěji zahojí (+30 %), méně se zhoršují (×0,5) | fire 0,4 % | — |
| Chaplain | **útěcha**: má-li strana kaplana, kritičtí na nosítkách umírají o 20 % méně | fire 0,4 % | — |

Výpočet střelce: `zásahů za 28 dní ≈ fire × 28 × krytí cíle (~0,8)` → rifleman 0,017 × 28 × 0,8 ≈ 0,38.

## 3. Zkušenosti (XP) a úrovně
| Za co | XP | | Úroveň | XP | násobek role |
|---|---|---|---|---|---|
| den v přední linii / v zálohách | 2 / 1 | | Recruit | 0 | ×1,0 |
| zásah lehce / těžce / kriticky | 8 / 12 / 16 | | Seasoned | 60 | ×1,25 |
| ošetřený raněný (za den, podle péče) | 3 | | Veteran | 180 | ×1,5 |
| oprava drátu / přežité těžké zranění | 3 / 10 | | Elite | 400 | ×1,8 |
Násobek zvyšuje hlavní schopnost: palbu, práci medika, opravy ženisty. Za 30 dní na frontě ~60 XP = Seasoned. Nástupce začíná od nuly.

## 4. Výsledky simulace na skutečné soupisce
`node tools/sim-battle.mjs --state <stav z main> --runs 40 --days 21` (den 1, 103 vojáků: Hegemony 50, Concord 53). Na stranu a týden:

| Scénář | Strana | Zásahy (palba) | lehce / těžce / krit. | Padlí | Aspoň 1 padlý za 21 dní |
|---|---|---|---|---|---|
| Klidná fronta, jen obvaziště | Heg | 11,6 (38 %) | 7,3 / 3,4 / 0,94 | **0,57** | 50 % |
| | Con | 11,3 (36 %) | 6,8 / 3,4 / 1,01 | **0,52** | 65 % |
| Hegemony vyhraje, Concord pod granáty | Heg | 10,3 (38 %) | 6,5 / 3,0 / 0,89 | **0,47** | 48 % |
| | Con | 14,7 (31 %) | 8,5 / 4,7 / 1,49 | **1,82** | 98 % |
| Concord vyhraje, Hegemony pod granáty | Heg | 15,2 (32 %) | 9,2 / 4,6 / 1,41 | **2,02** | 90 % |
| | Con | 10,1 (37 %) | 6,0 / 3,1 / 1,01 | **0,34** | 60 % |
| (srovnání: obě s nemocnicí) | Heg / Con | 11,9 / 11,6 | | **0,20 / 0,23** | |

Dlouhodobě (9 týdnů, klid): od 2. týdne stabilně 1–1,5 padlých na stranu týdně (≈ 2–3 % strany, historicky „wastage“ až ~10 % za měsíc),
první týden méně (ochrana nováčků). Úmrtnost s časem neroste.

### Přínos rolí (simulace s rolí a bez jejího účinku)
Scénář Concord pod granáty, 30 běhů × 21 dní, rozdíl za celé období na stranu (záporné = role pomáhá; útočné role se projeví u **druhé** strany):

| Role | utržené zásahy Heg / Con | padlí Heg / Con | dny lehce raněných Heg / Con |
|---|---|---|---|
| Stretcher Bearer | +0,37 / +0,73 | **−4,20 / −8,60** | **−13,5 / −11,9** |
| Signaller | **−1,77 / −3,10** | −0,07 / **−1,87** | −1,9 / −6,6 |
| Field Cook | +0,8 / +0,8 | −0,67 / **−2,67** | −2,3 / **−8,2** |
| Machine Gunner (potlačení) | **−1,23 / −2,67** | −0,10 / −1,10 | −1,0 / −5,5 |
| Runner | **+1,00** / +0,53 (víc zásahů nepříteli) | | |
| Lieutenant | −0,17 / +0,47 | | (Hegemony má 1, Concord 0) |
| Sapper | −0,03 / −0,83 | | −1,2 (Concord, 6 ženistů) |
| Sniper (výběr cíle) | ~0 | −0,23 (Concord) | |
| Chaplain | ~0 | −0,10 | (Concord nemá kaplana; Hegemony nebyla pod granáty) |
Slabé role pro ladění: **kaplan** (jen 2 % vojáků, působí jen na kritické na nosítkách) a **ženista** (drát kryje málo).
Posílit jde jedním číslem: `roles.chaplain.faith`, `wire.cover`, `roles.sapper.repair`.

## 5. Cílová čísla (KPI) — stav v4
| Ukazatel (klid, na 50 vojáků, týdně) | pásmo | v4 |
|---|---|---|
| zásahy | 10–16 | ✓ 11,2 |
| podíl palby hráčů | 35–45 % | ✓ 37 % |
| kritické zásahy | 1–2 | ⚠ 0,95 |
| padlí (jen obvaziště) | 0,5–1,5 | ✓ 0,53 |
| padlí bombardované strany za 21 dní | 3–6 | ✓ 5,6 |
| nejlepší střelec strany za 21 dní | 1–4 | ✓ 2,2 |

## 6. Ladění
- Všechna čísla v `theme.json` → `battle` (u každé skupiny `_` s popisem). Při změně zvýšit `battle.balance`.
- Zkusit bez úpravy souboru: `node tools/sim-battle.mjs --set roles.sniper.fire=0.035 --set hit=0.025` (porovná KPI).
- Tabulka přínosu rolí: `--roles`. Den po dni s deníky: `node tools/sim-battle.mjs 2 --story`.
- **Náhled příštího vydání** na skutečném stavu: `node tools/preview-tick.mjs --md náhled.md` (Gazette, kdo koho trefil, obvaziště; nic neukládá).

## 7. Ostrý provoz
- Vypínač `battle.enabled` (false = žádný boj). Pojistka `battle.maxDeaths` (5 % strany, min. 2 za den; kdo by padl navíc, přežije do zítřka).
- Denní metriky `state.battle.stats` (60 dní): zásahy podle zdroje a role, závažnost, padlí podle příčiny, lůžka, nosítka, pokrytí mediky, pojistka.
- Deterministické kostky (ID vojáka + den): opakovaný tah dá stejný výsledek.
- Starší ranění se při prvním tahu převedou (status, místo). Žádná zpětná změna deníků.
- Zbývá (další krok): stínový režim a upozornění (issue) při metrikách mimo pásmo 3 dny po sobě.

## 8. Zdroje
- [British Medical Casualties on the Western Front (WFA)](https://www.westernfrontassociation.com/world-war-i-articles/british-medical-casualties-on-the-western-front-wound-induced-trauma-related-to-technological-advances-in-war) · [Foreign Policy: artillery as the top killer](https://foreignpolicy.com/2012/05/03/other-sad-facts-i-learned-from-six-weeks-artillery-as-the-top-killer-the-hordes-of-shellshock-cases-decades-later/) · [Save My Exams: wounds](https://www.savemyexams.co.uk/gcse/history/edexcel/18/revision-notes/medicine-in-britain-c-1250-present/the-british-sector-of-the-western-front-injuries/wounds-from-injuries-on-the-western-front)
- [Chain of evacuation (Save My Exams)](https://savemyexams.com/gcse/history_the-thematic-historic-environment-paper-1/edexcel/24/revision-notes/medicine-in-britain-c1250-present/the-british-sector-of-the-western-front-treatment/the-chain-of-evacuation-in-the-first-world-war) · [Stretcher bearers (Collections WA)](https://collectionswa.net.au/items/1f85b4a4-d45e-4afc-9e76-65147f8f91b8) · [IWM: medical services](https://www.iwm.org.uk/history/a-short-guide-to-medical-services-during-the-first-world-war)
- [Wastage (military)](https://en.wikipedia.com/wiki/Wastage_(military)) · [Great War Forum: quiet areas](https://www.greatwarforum.org/topic/28581-quiet-areas/) · [Canadian War Museum](https://www.warmuseum.ca/firstworldwar/wp-json/wp/v2/pages/269)
