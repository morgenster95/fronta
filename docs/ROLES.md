# Nová role a nové sprity: postup

_Platí od větve `revize` (11. 11. 2026). Engine nezná žádné jméno role: všechno určuje téma._

## 1. Nová role bez programování
1. **`themes/front-ww1/theme.json` → `archetypes`**: nový záznam.
   ```json
   { "id": "mortarman", "name": "Trench Mortar", "weight": 3,
     "desc": "Lobs bombs over the wire. Slow, loud, feared.",
     "aliases": ["mortar", "mortars", "bomber"] }
   ```
   - `weight` = jak často roli dostane nový rekrut losem (střelec má 50). `0` = jen na přání nebo převelením.
   - `aliases` = slova, podle kterých bot pozná přání v komentáři („CONCORD mortar“). Delší výraz má přednost.
   - `promotionOnly: true` + `startRank` + `per` = role jen za povýšení (jako Lieutenant): nelosuje se, nejde si ji přát.
2. **`theme.battle.roles.<id>`** (nepovinné): co role umí v denním boji. Schopnost má ten, kdo má její klíč; jde je libovolně kombinovat.

   | Klíč | Co dělá | Dnes ho má |
   |---|---|---|
   | `fire` + `severity` | šance za den trefit nepřítele naproti a jak těžce | všichni (výchozí 0,4 %), střelec, kulometčík, ostřelovač |
   | `pick` | šance vybrat si cíl s `priority: true` | ostřelovač |
   | `priority` | je přednostním cílem ostřelovačů | kulometčík, důstojník |
   | `suppress` (+ `suppressMax`) | snižuje palbu nepřátel naproti | kulometčík |
   | `lead` + `xp` | vojákům poblíž víc palby a zkušeností | důstojník |
   | `relay` | totéž co velení, když poblíž není velitel | spojka |
   | `counter` | méně zásahů z pozadí pro vojáky poblíž | spojař |
   | `repair` | opravuje drát ve svém úseku | ženista |
   | `work` | práce medika za den (potřeba: lehce 1, těžce a kriticky 2) | nosič raněných |
   | `heal` + `worsen` | lehce ranění poblíž se hojí i bez medika a méně se zhoršují | kuchař |
   | `faith` | kritičtí na nosítkách umírají méně | kaplan |

   Role bez záznamu v `battle.roles` je „obyčejný voják“ s výchozí palbou.
3. **Příběhy** (nepovinné): v `story.json` mohou mít zápisy dne a příběhové linky `"archetype": "<id>"`, pak je dostane jen tahle role.
4. `npm test` (90denní simulace + test „nová role jen z tématu“). Dopad na boj: `node tools/sim-battle.mjs --kpi`.

Web ukáže roli hned: v kartě, v převelení i v žebříčcích. **Dokud nemá vlastní sprite, kreslí se jako střelec své strany.**

## 2. Sprity
Rozměry a pravidla (hlídá je editor i `tools/sprite_qa.py`):

| Co | Plátno | Pravidla |
|---|---|---|
| voják: postoj, chůze, pád | 32×32 | pata na řádku 30 (došlápnutá noha při chůzi smí na 31), stojící postava 29–31 px, střed ve sloupci 16, jen plné pixely |
| voják: střelba a široké animace | 44×44 | stejná postava s okrajem 6 px, pata na řádku 36 |
| kulomet | 32×20 | směry south-east, south-west, north-east, north-west |
| budova / místo v údolí | 256×256 | zmenšuje se podle velikosti v buňkách mapy |
| měřítko pro nové věci | 17 px ≈ 1 m | dělo ~68×28 px, tank ~136×43 px, nákladní vůz ~100×38 px |

Paleta: `art/palette/trench24.hex` (stávající vojáci z PixelLabu mají barev víc; nové kresby ji mají držet).

**Jména souborů** ve `web/public/assets/soldiers/`:
- `<klíč>_<směr>.png`: postoj. Klíč = `concord` / `hegemony` (střelec) nebo `concord_<id role>`. Směry: `south`, `south-east`, `east`, `north-east`, `north`, `north-west`, `west`, `south-west`.
- `<klíč>@<animace>_<směr>_<n>.png`: snímky animace (`idle`, `walk`, `fire`, `fall`, `crouch`), n od 0.
- Chybějící směr se zrcadlí z protějšku (east ↔ west). Minimum pro novou roli: `south` a `north` každé strany, lépe všech 8.

**Postup:**
1. Nakreslit v editoru: `/editor/` na webu (v náhledu větve: `https://mudandiron--revize-40p4cwxt.web.app/editor/`, lokálně `npm run dev` → `/editor/`).
   Editor umí podložit nebo zkopírovat kterýkoli sprite ze hry, načíst celou animaci, hlídá patu, výšku, odtržené pixely a navrhne jméno souboru.
2. Uložit PNG do `web/public/assets/soldiers/` (nebo je poslat Claudovi).
3. `npm run sprites`: sestaví `manifest.json` ze jmen souborů a složí `atlas.png` (jeden obrázek místo stovek dotazů).
4. `npm test` (hlídá, že atlas a manifest odpovídají souborům) a commit.

Stažení spritů z PixelLabu dál dělá `npm run assets` (`art/sprites.json`); po něm taky `npm run sprites`.

## 3. Budovy, vozidla, děla
Zatím je hra kreslí takhle: místa v údolí = PNG v `assets/locations/` (seznam v `theme.valley.locations`), rekvizity = PNG v `assets/props/`,
obvaziště a nemocnice = kreslené kódem (`web/src/hospital.js`). Nové typy (dělo, tank) potřebují kromě obrázku i kód, který je na mapu umístí
a rozhýbe; rozměry v editoru jsou připravené tak, aby seděly k vojákům.
