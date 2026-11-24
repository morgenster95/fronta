# Bitva o vesnici (NÁVRH 2026-11-24, nic nepostaveno)

Uživatel: „bitva o vesnici by byla skvělá, pokud bychom dokázali udělat i domy a udělat to jako takovou menší mapu, na kterou by se lidé mohli podívat a opravdu by se tam bojovalo“.
Ukázka: `docs/mockups/village/village.png` (skript `village.py`: domy kreslené v kódu v mřížce hry a paletě Trench 24, vojáci = sprity ze hry 1:1).

## Historie
Fleury u Verdunu (16× jiný majitel), Thiepval, Beaumont-Hamel, Guillemont: vesnice těsně u fronty, boj o každý dům a sklep, z vesnic zůstaly ruiny.

## Jak by to fungovalo (návrh)
- **Začátek:** post nebo reel s heslem (např. `VILLAGE`) otevře bitvu, trvá ~5 nocí; vyhodnocení každou noc v novinách 13:00 UTC.
- **Přihláška** komentářem; voják odejde ze zákopu do vesnice a zůstává tam do konce bitvy (nebo do zranění), na mapě vesnice stojí u „svého“ domu.
- **Domy (~11):** kostel s věží, škola, pivovar, statek, mlýn, hospoda, pekárna, dům, starosta, pošta, stodola. Každý má majitele (vlajka) a stav (celý → poškozený → ruina; ruina kryje méně).
- **Noc:** útočníci jdou na nejbližší nepřátelský nebo sporný dům, obránci drží své. Dům změní majitele, když útok přetlačí obranu × krytí domu. Ztráty zblízka jako na raidu (vysoké).
- **Role:** puškař nejlepší v útoku, kulometčík v obraně domu, odstřelovač z věže a pater (vybírá kulometčíky a poručíky), ženista vyhazuje barikády a sklepy, medik vytahuje raněné z ruin, poručík vede útok.
- **Konec:** kdo drží víc domů, získá odměnu (návrh: sklepy pivovaru jako polní nemocnice = lůžka, nebo věž kostela = pozorovatelna, nebo posun fronty).
- **Web:** tlačítko „Village“ → mapa vesnice (jako ukázka), domy s vlajkami a stavem, skuteční vojáci u domů (střelba, granáty, ranění), ťuknutí na dům = kdo ho drží, kdo je uvnitř, co se v noci stalo; ťuknutí na vojáka = karta.
- **Noviny a deník:** „Night 3: the inn fell to the Concord“, příběh vojáka s jménem domu („held the cellar of the brewery for two nights“). Kartičky podle `theme.cards`.

## Grafika (24. 11. odpoledne)
- **Větší budovy:** arch `art/cine/village_big_a.png` (256×256, 6 budov ~75×95–116 px za 9 generací) → `art/village/big/` (church, townhall, inn, bakery, townhouse, cafe). Dveře ~1,3× výšky vojáka, dvě patra, budova ~3× voják. Radnice: trikolóra přebarvená (svět je smyšlený, vlajku dá strana, která dům drží). Kavárna je nároží (lehce do úhlu), ostatní čistě zepředu.
- **Předměty do ulic (i pro hru):** arch `art/cine/village_props_a.png` (208×208, 16 kusů za 6 generací) → `art/village/props/`: lamp, lamp_broken, bin, barrel, barricade_bags, barricade_planks, rubble_brick, rubble_stone, door_fallen, pump, bench, crates, bicycle, signpost, handcart, wheel.
- Ukázka ulice s vojáky 1:1: `docs/mockups/village/village3.py` → `village3.png`. Staré malé budovy (`art/village/*.png`, ~45 px) jsou na mapu moc malé.
