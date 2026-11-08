# FRONTA — zadání pro pixel art (ART BIBLE + PixelLab brief, v1)

Platí pro všechny assety. Cíl: všechny postavy stejně vysoké, vozidla a objekty ve stejném měřítku, jednotná paleta.
PixelLab MCP: `https://api.pixellab.ai/mcp` (stejný klíč jako v Cozy Collection). Předplacené generace do **13. 11. 2026**.

## 1. Pevná pravidla

1. **Měřítko: 1 m = 16 px. Dlaždice 16 × 16 px = 1 × 1 m.** Nikdy neměň velikost pixel artu (žádný resize). Když to nesedí, generuj znovu ve správné velikosti.
2. **Pohled: `low top-down`** (cca 3/4 shora) pro VŠECHNO na mapě: postavy, vozidla, objekty, dlaždice.
3. **Patní bod:** chodidla (u vozidel spodní hrana pásů) na předposledním řádku plátna, vodorovně na středu. Engine kotví sprite na `(w/2, h-2)`.
4. **Paleta „Trench 24“** (`art/palette/trench24.hex`). U nástrojů s parametrem `palette` ji vždy předej (`palette_name: "Trench 24"`).
   Ostatní výstupy po stažení převeď na nejbližší barvu palety (Pillow, bez ditheringu), alfa jen 0/255.
5. **Světlo:** zatažená obloha, rozptýlené, mírně shora zleva. Žádná záře ani vržené světlo (záblesky, oheň a plyn dodává engine jako efekty).
6. **Obrys:** `selective outline`, tmavý (#0e0d0c / #1c1a17), žádný černý obrys kolem celé postavy.
7. Ke každému promptu připoj koncovku:
   `grimdark world war one pixel art, desaturated muddy palette, cold overcast light, selective dark outline, readable silhouette`

## 2. Velikosti (plátno → skutečná postava)

| Typ | Plátno | Skutečná výška/délka | Nástroj |
|---|---|---|---|
| Voják (všechny archetypy) | **32 × 32** | postava **30 px** (v3 vyplní plátno až na 1–2 px) | `create_character` mode `v3`, `size: 32` — 2 gen |
| Portrét na kartu vojáka | 64 × 64 | busta | `create_portrait_character` / `set_character_portrait` |
| Kůň, pes (spojka) | 48 × 48 | kůň ~2,4 m délka → ~38 px | `create_character_pro_flash` `template_id: horse/dog` |
| Tank Mk IV (8 m) | **128 × 128**, 8 směrů | délka ~120 px, výška ~40 px | `create_object_pro_flash` `n_directions: 8` — 8 gen |
| Kulomet na podstavci, minomet | 32 × 32 | — | `create_object_pro_flash` 1 směr |
| Polní dělo (6 m) | 96 × 96, 8 směrů | ~96 px | `create_object_pro_flash` 8 směrů — 7 gen |
| Malé objekty (pytle, bedny, dráty) | 16–32 | — | `create_map_object` / `create_object_pro_flash` 1 směr |
| Dlaždice terénu | 16 × 16 | Wang sada | `create_topdown_tileset` (pro: 15 gen; standard: 1 gen) |
| Obrázky atmosféry / Reel pozadí | 256 × 144 | — | `create_image_pro_flash` + palette — 9 gen |

## 3. Čitelnost frakcí (nejdůležitější pravidlo)

Na 32 px a zdálky se frakce musí poznat **siluetou přilby a teplotou barvy**, ne detaily:

| | The Concord | The Hegemony |
|---|---|---|
| Teplota | **olivově zelená / khaki** (schváleno z testu 1) | **šedá až lehce namodralá**, žádná zelená |
| Přilba | **plochá mělká miska se širokým okrajem** (Brodie) | **hluboká „uhlák“ se štítkem vzadu** (Stahlhelm), u části hrot |
| Plášť | kratší kabát, ovinovačky | dlouhý plášť až ke kotníkům, holinky |
| Výbava | bajonet na pušce, plátěná výstroj | plynová maska v plechovce, kožená výstroj |
| Značka | **okrová páska** na rameni (#d98f3f) | **rezavá páska** (#7e3b2a) |
| Hlavní barvy palety | #857a68 #6b6152 #a39782 #8c8a5c | #4a4f52 #666d70 #8a9295 #2a3138 |

Test 1 ukázal, že bez toho vyjde Hegemony olivově zelená a přilby jsou si podobné. **Do promptu vždy vypiš tvar přilby a barvu pláště.**

## 3b. Kontrola pixelů (povinná u každého spritu)

`python tools/sprite_qa.py --height 30 <soubory> --sheet _qa.png` najde:
- **odtržené kousky** (hlaveň oddělená od pažby, plovoucí pixely) → vždy chyba,
- **díry a zářezy** (průhledný pixel uvnitř nebo ze 3 stran obklopený) → zkontrolovat v archu `_qa.png` (zeleně označené).
  Mezera mezi nohama nebo mezi puškou a pláštěm je v pořádku, mezera uvnitř zbraně ne,
- **špatnou výšku a patu**: chodidla vždy na řádku 30 (kotva enginu), výška 30 ±1 px (čepice/přilba),
- poloprůhledné pixely a barvy mimo paletu.

Zkontroluj taky ručně, že zbraň v každém úhlu **pokračuje celá**: hlaveň → předpažbí → ruka → pažba, žádný „hnědý blob“ bez návaznosti.
Opravy dělej ručně po pixelech do `art/pixellab/fixed/` (originál zůstává). Příklad: `fixed/concord_rifleman32_east.png`.
Konzistence Concordu: archetypy vyšly s hnědou plochou přilbou (Brodie), střelec má šedomodrou → střelce časem přegenerovat se stejnou přilbou.
Prevence: na 32 px volit pózy, kde je puška jasně čitelná (svisle u boku, pažba na zemi). Puška přes záda dělá v otočených pohledech nejvíc chyb.

## 4. Postup pro sjednocený vzhled (ověřeno v test02)

**Schválený vzor = Concord střelec** (`test01/concord_rifleman32_south.png`). Každá další postava:
1. `create_image_pro_flash` 32×32, `style_image` = vzor (`color_palette: false`, ostatní true), 2 seedy → vybrat (5 gen/kus).
   V promptu: „figure fills the full canvas height, helmet touches the top row, boots on the bottom row“. Pro Flash výšku nehlídá (vyšlo 28 místo 30).
2. QA (chodidla na řádku 30, výška 30 ±1, zbraň celá). Když nesedí, neotáčet, vygenerovat znovu (jiný seed).
   Těžké zbraně držet nízko v rukou, ne na rameni (na rameni přerůstají výšku).
3. `create_character` v3 + `reference_image` = vybraný předek → 8 směrů za **1 gen**. Úhly vyjdou jednotné, což neplatí pro v3 z textu (test01 Hegemony: na každém úhlu něco).
4. QA všech 8 směrů + ruční opravy → teprve pak animace.

Původní postup (níže) platí pro varianty a animace:

1. Vytvoř **kotvu frakce**: střelec, 32 px, v3. Až ji schválíš, je to vzor (south rotace = `style_image` pro všechno ostatní).
2. Další archetypy: `create_character` v3 se stejnou koncovkou, potom případně `create_character_state` (varianty stejné postavy: plynová maska, obvaz, zimní kabát).
3. Animace (`animate_character`, šablony 1 gen/směr): `breathing-idle` (4), `walking` (6), `crouched-walking` (6), `falling-back-death` (7), `getting-up` (5).
   Vlastní v3 (jen jih / východ): „aiming rifle over the parapet“, „smoking a cigarette, idle“, „digging with a shovel“.
4. Vozidla a objekty: první snímek je **vždy zepředu (jih)**. Boční pohled 1 směrem nejde, buď 8 směrů, nebo `create_image_pro_flash` (side) a výsledek přes `source_image_id`.
   (Test 1: tank vyšel zepředu.)
5. Dlaždice: standardní režim vyšel moc světlý a plochý → finální sada v `mode: "pro"`, tmavší popisy (`dark wet mud`, `black water`).

## 5. Archetypy (na frakci)

| # | Soubor | Popis do promptu (+ frakční popis z kap. 3 + koncovka) |
|---|---|---|
| 1 | `{f}_rifleman` | infantry rifleman, rifle with bayonet slung on shoulder, ammo pouches |
| 2 | `{f}_officer` | officer with peaked cap instead of helmet, pistol holster, binoculars, whistle |
| 3 | `{f}_machinegunner` | heavy machine gun crewman carrying ammo belt boxes, broad shoulders |
| 4 | `{f}_medic` | stretcher bearer medic, white armband with a plain cross, satchel of bandages |
| 5 | `{f}_sapper` | sapper with entrenching shovel and wire cutters, sandbag on back |
| 6 | `{f}_runner` | thin young messenger runner, message satchel, no rifle |
| 7 | `{f}_sniper` | sniper with scoped rifle, face smeared with mud, rag camouflage on helmet |
| 8 | `{f}_chaplain` | army chaplain in dark cassock under greatcoat, small book, no weapon |

Vzhled vojáka v enginu: archetyp (z hashe IG ID) + varianta stavu + barevná obměna obličeje nebo vlasů přes paletu.
Pro 1 frakci: 8 × v3 (16 gen) + 8 × 2 animace × 4 směry (64 gen). Rozpočet hlídej přes `get_balance`.

## 6. Rozpočet do 13. 11. (zbývá ~285 generací)

| Položka | Gen |
|---|---|
| 2 × 8 archetypů (v3, 32 px) | 32 |
| Animace idle + walk, 4 směry, 16 postav | 128 |
| Tank 8 směrů, dělo 8 směrů, kulomet, minomet | ~25 |
| Dlaždice pro: zákop/bláto, bláto/kráter s vodou, bláto/ostnatý drát | 45 |
| 3 obrázky atmosféry (Reel, web) | 27 |
| Rezerva na přegenerování | ~28 |

## 7. Log

Každé generování zapiš do `art/pixellab/LOG.md`: soubor, nástroj, parametry, ID postavy/objektu/jobu, cena.
