# Role, zkušenosti, simulace a ladění boje

_Stav k 11. 11. 2026: **nasazeno, vyvážení v12** (změny, simulace a důvody: `docs/MECHANICS.md`, výstupy `docs/sim/`). Pravidla jednoho dne (zásahy, lůžka, medici, stavby) jsou v `docs/BATTLE.md`;_
_tady je, co která role dělá, zkušenosti, výsledky simulací a jak se boj ladí. Kód `engine/battle.js`, čísla `themes/front-ww1/theme.json` → `battle`._

## 1. Pořadí kroků v ranním tahu (13:00 UTC)
1. Palba hráčů z přední linie (tabulka rolí níže).
2. Zásahy z pozadí a bombardování, s doplněním aspoň 1 nově raněného na 80 vojáků strany za klidu a mezí 30 na 80 pod granáty (palba hráčů je hlavní zdroj ztrát).
3. Rozmístění raněných: lůžka (kritičtí první), nosítka, zákop.
4. Práce mediků a hojení.
5. Drát, XP za den, denní metriky, pojistka proti masakru.

Podrobně v `docs/BATTLE.md`.

## 2. Role: co dělá a kolik to je
Šance „fire“ je na vojáka v přední linii a den. Skutečný zásah je o něco nižší (krytí cíle, potlačení kulomety).

| Role | Funkce | Čísla (výchozí) | Očekávaně za 4 týdny (1 voják, Recruit) |
|---|---|---|---|
| Rifleman | běžná palba | fire 17 %; zásah 83 % lehce / 7 % těžce / 10 % kriticky | ~0,85 zásahu za týden |
| Machine Gunner | **potlačení**: nepřátelští střelci poblíž −45 % palby × pokrytí (jeden kulomet pokryje 4 střelce); hodně ran, spíš lehká zranění | fire 26 %; 75/21/4 % | ~1,4 zásahu za týden |
| Sniper | **přesnost**: často kriticky, 50 % šance vybrat si kulometčíka/důstojníka | fire 30 %; 45/25/30 % (smrt na místě 35 % kritických) | ~1,65 zásahu za týden |
| Lieutenant | **velení**: střelcům poblíž +20 % palby × pokrytí (pokryje 12) a +25 % XP | fire 0,8 % | — (násobí ostatní) |
| Runner | **spojka**: bez důstojníka poblíž +25 % palby × pokrytí (pokryje 8; rozkazy dojdou) | fire 0,4 % | — |
| Stretcher Bearer | **péče** (krok 4) | práce 2/den (Elite 3,6); +1 nosítka za medika | 5 lehce raněných nebo 2 těžce raněné denně |
| Signaller | **protipalba**: vojáci poblíž −20 % zásahů z pozadí a −40 % zásahů granátem, × pokrytí (pokryje 10) | fire 0,4 % | — |
| Sapper | **drát**: +8 % výdrže drátu v úseku za den (drát kryje až −15 % zásahů) | fire 0,4 % | — |
| Field Cook | **morálka**: lehce ranění poblíž se i bez medika častěji zahojí (+30 %), méně se zhoršují (×0,5); pokryje 4 | fire 0,4 % | — |
| Chaplain | **útěcha**: kritičtí na nosítkách umírají o 20 % méně × pokrytí (pokryje 3) | fire 0,4 % | — |

Výpočet střelce: `zásahů za týden ≈ fire × 7 × krytí cíle (~0,8) × nasycení`. Zásah kulkou, který je kritický, zabije na místě s `roles.kill` (puškař/kulomet 20 %, odstřelovač 35 %).
**Nasycení** (`roles.saturation`): střelec trefuje méně, když je u něj víc vlastních střelců než nepřátel na dostřel. Zásahy ve vyrovnaných stranách ~0,85 / 1,4 / 1,65 za týden (puškař / kulomet / odstřelovač), ve velké straně proti malé ~0,4.
**Pokrytí** (`covers`) a nasycení se simulují v `tools/sim-matrix.mjs` pro různé velikosti i složení stran.

**Pokrytí (`covers`, od v7):** účinek podpůrné role = plný účinek × min(1, počet role poblíž × covers / lidí poblíž).
Každý další voják role přidá, dokud není pokrytí 100 %, a pár kulometčíků už nepotlačí celou frontu. Výsledky simulací v7: `docs/MECHANICS.md`.

## 3. Zkušenosti (XP) a úrovně
| Za co | XP | | Úroveň | XP | násobek role |
|---|---|---|---|---|---|
| den v přední linii / v zálohách | 2 / 1 | | Recruit | 0 | ×1,0 |
| zásah lehce / těžce / kriticky | 8 / 12 / 16 | | Seasoned | 60 | ×1,25 |
| ošetřený raněný (za den, podle péče) | 3 | | Veteran | 180 | ×1,5 |
| oprava drátu / přežité těžké zranění | 3 / 10 | | Elite | 400 | ×1,8 |
Násobek zvyšuje hlavní schopnost: palbu, práci medika, opravy ženisty. Za 30 dní na frontě ~60 XP = Seasoned. Nástupce začíná od nuly.

## 4. Výsledky simulace na skutečné soupisce (v6, historické; v7 viz `docs/MECHANICS.md`)
`node tools/sim-battle.mjs --kpi --runs 60 --days 21`, stav z 11. 11. 2026 (den 2, 157 vojáků: Hegemony 76, Concord 81). Na stranu a týden:

| Scénář | Strana | Zásahy (palba) | lehce / těžce / krit. | Padlí | Aspoň 1 padlý za 21 dní |
|---|---|---|---|---|---|
| Klidná fronta, jen obvaziště | Heg | 14,9 (40 %) | 9,3 / 4,3 / 1,32 | **0,70** | 75 % |
| | Con | 15,1 (40 %) | 9,2 / 4,4 / 1,52 | **0,24** | 47 % |
| Hegemony vyhraje, Concord pod granáty | Heg | 14,0 (39 %) | 8,8 / 4,0 / 1,23 | **0,39** | 60 % |
| | Con | 21,1 (32 %) | 12,3 / 6,3 / 2,44 | **3,07** | 98 % |
| Concord vyhraje, Hegemony pod granáty | Heg | 20,8 (32 %) | 12,1 / 6,5 / 2,17 | **5,59** | 100 % |
| | Con | 13,8 (38 %) | 8,4 / 3,9 / 1,46 | **0,21** | 43 % |
| Klidná fronta, obě s nemocnicí | Heg | 15,0 (40 %) | 9,4 / 4,3 / 1,34 | **0,10** | 18 % |
| | Con | 15,2 (41 %) | 9,3 / 4,4 / 1,55 | **0,13** | 30 % |

Hegemony vychází hůř, protože má na stejný počet raněných méně mediků (pokrytí v nejhorší den 41 %, pod granáty 15 %; Concord 81 % a 27 %).
Nemocnice snižuje počet padlých za klidu zhruba 2–7×.

### Přínos rolí (simulace s rolí a bez jejího účinku)
`node tools/sim-battle.mjs --roles --runs 30 --days 21`, scénář Concord pod granáty, rozdíl za 21 dní na stranu
(záporné = role pomáhá; kulomet a ostřelovač působí hlavně na **druhou** stranu):

| Role | utržené zásahy Heg / Con | padlí Heg / Con | dny lehce raněných Heg / Con |
|---|---|---|---|
| Stretcher Bearer | +0,70 / +0,20 | **−8,50 / −16,40** | **−31,8 / −18,4** |
| Field Cook | +0,20 / +0,30 | −0,45 / **−7,45** | −3,9 / **−26,9** |
| Machine Gunner (potlačení) | **−2,40 / −2,75** | −0,45 / −3,05 | −4,5 / −7,2 |
| Signaller | **−1,30 / −1,25** | −0,15 / −0,55 | −2,9 / −7,9 |
| Sapper | −0,05 / −0,70 | −0,20 / −0,10 | −1,1 / −0,4 |
| Runner | +0,95 / +0,15 | 0 / +0,90 | +0,6 / +1,0 |
| Lieutenant | 0 / +0,40 | 0 / +0,35 | ~0 |
| Sniper (výběr cíle) | −0,30 / +0,10 | −0,20 / +1,00 | ~0 |
| Chaplain | ~0 | ~0 | ~0 |

Slabé role pro ladění: **kaplan** (působí jen na kritické na nosítkách) a **ženista** (drát kryje málo).
Posílit jde jedním číslem: `roles.chaplain.faith`, `wire.cover`, `roles.sapper.repair`.

## 5. Cílová čísla (KPI), stav v6 na soupisce z 11. 11. (od v7 pásma padlých: klid 1,5–3, bombardovaná strana 12–20; v7 všechna v pásmu)
| Ukazatel (klid, na 50 vojáků, týdně) | pásmo | v6 |
|---|---|---|
| zásahy | 10–16 | ⚠ 9,6 |
| podíl palby hráčů | 35–45 % | ✓ 40 % |
| kritické zásahy | 1–2 | ⚠ 0,9 |
| padlí (jen obvaziště) | 0,5–1,5 | ⚠ 0,3 |
| padlí bombardované strany za 21 dní | 3–6 | ⚠ 8,4 |
| nejlepší střelec strany za 21 dní | 1–4 | ✓ 2,3 |

Čtyři ukazatele jsou mimo pásmo: klidná fronta je o něco mírnější, než bylo v plánu (nejspíš proto, že denní mez 3 raněných na stranu neroste s velikostí strany),
a bombardování tvrdší (4 úseky × 50 %). Pásma vznikla pro 50 vojáků na stranu; při dalším ladění je přepočítat na současnou velikost.

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
- Zbývá: upozornění (issue) při metrikách mimo pásmo 3 dny po sobě.

## 8. Zdroje
- [British Medical Casualties on the Western Front (WFA)](https://www.westernfrontassociation.com/world-war-i-articles/british-medical-casualties-on-the-western-front-wound-induced-trauma-related-to-technological-advances-in-war) · [Foreign Policy: artillery as the top killer](https://foreignpolicy.com/2012/05/03/other-sad-facts-i-learned-from-six-weeks-artillery-as-the-top-killer-the-hordes-of-shellshock-cases-decades-later/) · [Save My Exams: wounds](https://www.savemyexams.co.uk/gcse/history/edexcel/18/revision-notes/medicine-in-britain-c-1250-present/the-british-sector-of-the-western-front-injuries/wounds-from-injuries-on-the-western-front)
- [Chain of evacuation (Save My Exams)](https://savemyexams.com/gcse/history_the-thematic-historic-environment-paper-1/edexcel/24/revision-notes/medicine-in-britain-c1250-present/the-british-sector-of-the-western-front-treatment/the-chain-of-evacuation-in-the-first-world-war) · [Stretcher bearers (Collections WA)](https://collectionswa.net.au/items/1f85b4a4-d45e-4afc-9e76-65147f8f91b8) · [IWM: medical services](https://www.iwm.org.uk/history/a-short-guide-to-medical-services-during-the-first-world-war)
- [Wastage (military)](https://en.wikipedia.com/wiki/Wastage_(military)) · [Great War Forum: quiet areas](https://www.greatwarforum.org/topic/28581-quiet-areas/) · [Canadian War Museum](https://www.warmuseum.ca/firstworldwar/wp-json/wp/v2/pages/269)
