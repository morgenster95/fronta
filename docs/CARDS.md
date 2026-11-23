# Sběratelské kartičky „Sweetheart cards“ (NÁVRH 2026-11-23, nic nenasazeno)

Grafika: obraz z PixelLabu 72 × 96 px (`art/cine/card_pinup_*.png`, Pro Flash, paleta Trench 24, 5 generací za kus) v rámečku kresleném v kódu
(`docs/mockups/cards/make_cards.py`: karta 88 × 128 px, písmo Silkscreen 8 px přímo v mřížce, kontrola šířky textu). Náhled `docs/mockups/cards/cards_sheet.png`.
Styl: vkusné pin-up obrázky jako malby na letadlech / pohlednice dívek kolem roku 1915; vždy oblečené, nic lascivního.

## Lore (anglicky do hry)
> Sweetheart cards were printed in the capital and sold for a penny. Men kept them in their helmets and read them by candle.
> Nobody throws one away. When a man falls, his card goes to whoever finds him, and the front remembers who carried it.

## Mechanika (NÁVRH 23. 11., dokončit 24. 11.)
Data: wiring party Day 6 = 67 lidí, Day 15 = 328 (všichni se vrátili); raid Day 11 = 188 (vrátilo se 169). Akcí se účastní stovky → šance malá + strop.

**Aktualizace (uživatel 23. 11. večer: „jednou za 3–4 měsíce je málo, na 10.–12. akci by měl mít šanci“):**

| Akce | Šance na vojáka, který se vrátí živý | Strop | Teď (odhad) |
|---|---|---|---|
| Wiring party (WIRE) | **8 %** | **žádný** (uživatel 23. 11.: 26 kartiček na ~2 000 hráčů není moc) | 328 lidí → ~26 |
| Noční raid (RAID) | **10 %** (riskantnější) | žádný | 169 → ~17 |
| Pilot (let) | **10 %** za den letu | 1 | ~1× za 10 dní |
| Další akce s přihláškou (nové) | 8 % | žádný | |

Bez stropu zůstane šance férová i při růstu hry (strop 25 by začal brzdit od ~310 dobrovolníků na stranu). Odhad: ~40 kartiček týdně (~2 % hráčů), ~170 za měsíc (~každý 13. hráč, skoro jen aktivní), legendárních ~8 za měsíc.
Šance na aspoň 1 kartičku za n akcí = 1 − (1 − p)^n: při 8 % do 10. akce 57 %, do 12. akce 63 %, průměrně první kartička na 12.–13. akci.
Zvažovaná alternativa „smůla se počítá“ (5 % + 1 % za každou akci bez nálezu, po nálezu zpět na 5 %): na 10. akci 14 %; spravedlivější, ale hůř se vysvětluje. Zatím NE.

- Kdo padne nebo zůstane těžce raněný na drátu, nic nenajde. Hlasování, granáty z komentářů ani dopisy kartičky nedávají (účastníků je moc a nic neriskují).
- **Vzácnost:** běžná 70 %, vzácná 25 %, legendární 5 % (ze sady #01–#08: 5 běžných, 2 vzácné, 1 legendární; v rámci vzácnosti rovnoměrně).
- Hodnota sbírky drží vzácnost (legendární 5 %), ne počet kartiček: aktivní hráč kartičku najde, legendární WINGS jen málokdo.
- **Dědí se** jako medaile: kartičky patří rodu; padlý voják je předá nástupci. Duplikát = „×2“.
- Kód: engine `engine/cards.js` (los po vyhodnocení drátu/raidu/pilota, seed dne), téma `theme.cards` (šance, strop, seznam kartiček a vzácnost), stav `s.cards = [id…]`, roster pole `cards`.

## Kde se zobrazí (NÁVRH)
- **Karta vojáka:** řádek **KEEPSAKES** s malými kartičkami (1×), klik = velká kartička (×4) s rubem „passed down from …“.
- **Noviny:** řádek v rubrice drátu / raidu: „Found on the wire: a sweetheart card (SUNDAY). Edmund Mcnamara kept it dry.“ (jména jako u ostatních příběhů).
- **Deník vojáka:** jedna věta při nálezu („In a dead man's coat on the wire, {name} found a sweetheart card. {name} put it in the helmet.“).
- **Album rodu:** sbírka rodu (zděděné kartičky s počtem generací).
- **Legendární nález:** zmínka v Day reelu / story („A LEGENDARY CARD WAS FOUND TONIGHT“).
- Volitelně později: přehled „Sweetheart cards found: 12 · WINGS still missing“ v panelu fronty.

Sada 1 (#01–#08, `docs/mockups/cards/edit3/`, karta 54×87, vnitřek 44×62): HELLO, DREAMER (vzácná), SUNDAY, CALL ME, GOGGLES (vzácná), SEASIDE, WINGS (legendární), MY PAL. Grafika z PixelLabu (archy B–E), ruční úpravy uživatele, oči opravené.
