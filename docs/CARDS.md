# Sběratelské kartičky „Sweetheart cards“ (NASAZENO 2026-11-24)

**Stav 24. 11. (uživatel: „teď bych jen přidal ty kartičky“):** engine `engine/cards.js` (`findCard` po wiring party, nočním raidu a letu pilota v `engine/battle.js` a `engine/pilots.js`),
téma `theme.cards` (šance 8 / 10 / 10 %, pilot strop 1, vzácnost 70 / 25 / 5 %, sada #01–#08, věta do deníku, řádek do novin jen číslem), stav `s.cards = [{ id, day, how, by }]`,
dědí se (`heir` v `engine/soldier.js`), v dávce záznamů `rec.cards`. Web `web/src/keepsakes.js`: řádek SWEETHEART CARDS na kartě vojáka (jen když nějakou má),
v rodu police „Sweetheart cards · Set 1 n / 8“ (chybějící rubem, pod medailemi), ťuknutí = líc + rub a kdo/kde/kdy. Obrázky `web/public/assets/cards/card_<id>.png` (54×87) a `back.png` (`docs/mockups/cards/make_back.py`).
Ve chvíli nasazení neběží drát, raid ani pilot, takže kartičku zatím nikdo nemá. Vyskakovací okno při nálezu a ikonka na mapě zatím NEJSOU.


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

## Kde se zobrazí (NÁVRH 23. 11. večer, inventář = sbírka RODU, protože se kartičky dědí)
1. **Okamžik nálezu:** přihlášený hráč při příští návštěvě dostane jednou vyskakovací okno: kartička rubem nahoru, ťuknutí ji otočí (dívka, jméno, vzácnost, „Found on the wire, Day 15“); jen jednou (localStorage).
   Na mapě 24 h malá blikající ikonka kartičky nad nálezcem (jako hvězda patronů). Noviny: řádek v rubrice drátu/raidu. Deník: jedna věta.
2. **Karta vojáka:** řádek KEEPSAKES pod údaji (jen když nějakou má), malé kartičky; ťuknutí = zvětšení ×4 s otočením, na rubu „Found by … on the wire, Day N · passed down N times“.
3. **Inventář = album rodu (tlačítko House), nová záložka Cards:** mřížka všech 8 míst sady, nalezené barevně s „×2“, chybějící jako zamčené siluety „???“ (jako v Patreon grafice), nahoře „3 / 8 collected“.
4. Později volitelně: přehled fronty „Cards found this week: 41 · WINGS found: 2“.
Pořadí stavby: engine + noviny/deník → karta vojáka → záložka Cards → vyskakovací okno a ikonka na mapě; nejdřív ukázka (snímky z webu).

Sada 1 (#01–#08, `docs/mockups/cards/edit3/`, karta 54×87, vnitřek 44×62): HELLO, DREAMER (vzácná), SUNDAY, CALL ME, GOGGLES (vzácná), SEASIDE, WINGS (legendární), MY PAL. Grafika z PixelLabu (archy B–E), ruční úpravy uživatele, oči opravené.
