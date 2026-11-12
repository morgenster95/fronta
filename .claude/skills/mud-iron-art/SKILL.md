---
name: mud-iron-art
description: Kreslení obrázků, příspěvků, filmových záběrů a videí pro MUD & IRON ve stylu hry (pixel art, paleta Trench-24, sprity ze hry). Použij vždy, když se dělá grafika pro Instagram, reel, story, post, cinematic nebo ilustrace do hry. Obsahuje postup, pravidla a chyby, které jsme už opravovali.
---

# MUD & IRON: jak kreslit, aby to vypadalo dobře

Tohle je shrnutí toho, co jsme se naučili při práci na postech, reelech a záběrech. Čti to PŘED kreslením a drž to.

## Technika (všechno je pixel art, nic hladké)
- **Statické posty 1080×1350 (4:5):** kreslí se v mřížce **216×270** (`marketing/make_posts.py`: `W, H, K`, `canvas()`, `up(im, K)`) a zvětší ×5 nejbližším sousedem.
  **Stories / reely 1080×1920:** mřížka **180×320** (cinematic, `web/src/cinema-race.js`, `cinema.js`) nebo **216×384** ×5.
- **Paleta Trench-24** (`P[...]` v `make_posts.py`, `P` v `cinema-race.js`): ink, dark, mud0–3, sand, bone, pale, white, grey, steel, khaki, olive(2/3), rust, blood, fire, gold, yellow, water. Žádné jiné barvy, žádné plynulé přechody.
- **Dithering Bayer 4×4** pro přechody (`day_art.grad`, `bayer`, `sky()` v cinema). Žádný antialiasing: kruhy a čáry kresli po pixelech (`disc`, `beam` v cinema-race) nebo malými `fillRect`; `ctx.arc`/`ellipse` jen pro průhledné efekty (kouř, záře).
- **Světlo:** teplý zdroj (`day_art.light`, `glow()` v cinema) na tmavém podkladu dělá z plochého obrázku scénu (lampa, výbuch, svítilna). Světlo vždy jedním směrem (zleva shora / od zdroje).
- **Sprity vojáků ze hry** (`web/public/assets/soldiers/<strana>_<role>_<směr>.png`, 32×32, postava ~30 px, chodidla na řádku 30): VŽDY je používej místo kreslených panáčků. Animace `anims[key].walk/idle/fire/fall` v cinematicích. Vzhled nikdy neměň tónem tak, aby byl poloprůhledný.
- **Žádní duchové:** žádný voják `alpha < 1` (mlha/stín jen jako barevný tint). Ve hře jsou prázdná stanoviště šedá a poloprůhledná, ve videu (`?reel=`) plná.

## Kompozice (co fungovalo, co ne)
- **Detail dělá dojem**: kopec = strmý s terasami zákopů, krátery, rozstřílenými stromy bez korun, ruinou bunkru, drátem, vlajkou. Dělo = kolo s paprsky a hřeby, ocas lafety s rýčem, kolébka, hlaveň s kroužky, brzda; obsluha dělá smysl (nese náboj JEDNOU za výstřel, pak stojí; žádné pendlování tam a zpět). Tráva s perspektivou (chomáče větší blíž), skvrny, květy.
- **Pytle (sandbags):** kulaté, nestejně velké, světlo shora, spáry; jinak vypadají jako dlažba. Zdi a kryty z pytlů mívají řadu nahoře.
- **Hloubka:** 3 plány (popředí, střed, dálka), dálka tmavší a v mlze; zdroj světla v dálce (výbuchy na obzoru) dává atmosféru.
- **Postavy nesmí zakrývat hlavní předmět** (kříže, jmenovky, dělo). Zmenši je nebo posuň; ověř na snímku ve 2×.
- **Řez zemí** (kryt pod povrchem s lavicí a lucernou, nahoře dopady) vysvětlí „hluboké kryty“ lépe než hromada pytlů. Doktor = lůžko, raněný s obvazem pod dekou, lampa se světlem, police s lahvemi, červený kříž, lékař se sprite zdravotníka. Munice = bedny se značkami, police s mosaznými náboji, pytlový val, plachta.
- **Rodokmen:** pergamen se jménem rodu, kříž a jméno padlého, čára, nástupce se sprite, generace a den. Čára se kreslí postupně.
- Na hrobech: jmenovky (příjmení, max 7–8 znaků), helma na kříži, kytice, lucerna; v dálce dopady a záblesky osvětlující nebe, déšť.

## Nejlepší technika: snímek přímo ze hry (od 2026-11-12)
Kreslené rekvizity vedle sprite vojáků (PixelLab, víc stínování a obrysy) občas „nesedí“ ke stylu. Nejlépe vychází **screenshot hry samotné**: stejné sprity, terén, světlo, počasí, dopady granátů.
- `node tools/shoot-game.mjs <dugouts|doctor|ammo> <out.png> [zoom] [šířka] [výška]` vyfotí hru s rozkazem (`/?orders=0:DUGOUTS`, `0:DOCTOR`, `0:AMMO`, nutný `npm run dev`), kamera na kryt s vojáky / doktora u lůžka / sklad munice. **Zoom 5 + 350×250 px** = 1 pixel hry = 1 pixel mřížky postu 216×270 (po ×5 pixel přesně), vložit do postu nejbližším sousedem (`make_vote.py`).
- Do postu patří výřezy 70×50 pixelů mřížky; výsledky jsou v `marketing/art/` (commit), kreslené ilustrace jsou jen záložní.
- Kamera ve hře: `window.__front.cam.set(x, y, zoom)` (dev), skrýt panel (`#dispatch`), čekat na animaci (doktor u lůžka, výbuch u krytu).
- Pro nové ilustrace nejdřív přidej prvek do hry (`web/src/orders-fx.js`), potom ho vyfoť, ne naopak.

## Text
- **Nejmenší písmo 8 px v mřížce 216×270** (`font(8)`); `font(6)` se při zvětšení rozpadne a je nečitelné. Pro názvy `font(14, True)`.
- Pixelový font 3×5 (`txt()` v cinema-race) má jen A–Z, 0–9, „+“, mezeru; M a W jsou širší (5×5), jinak splynou s H/N. Zbytek znaků odstraň.
- **Text musí zůstat v rámečku:** měř šířku (`textlength`, `txtW`) a zkrať. Kontroluj ve 2× náhledu, že se nic neřeže (počítadlo „NEW SOLDIERS“, jmenovky, `@mudandiron` na spodním okraji).
- **Bezpečné pásy Instagramu:** nahoře ~14 %, dole ~20 % výšky (u reelů a stories) kryje rozhraní. Titulky vypravěče dej nízko (~69 %) nebo podle scény tak, aby nezakrývaly klíčový obraz (nad hroby ~41 %); důležité texty v obrazu mezi 16 % a 80 %.
- **Žádná čísla, která neplatí:** nepiš „3 days“ ani jiné trvání, pokud to není pravda pro daný případ (u hlasování o rozkazech to nezmiňuj).
- Texty anglicky, jednoduše (publikum USA/UK). V popiscích na IG hráče NEOZNAČOVAT (jména bez zavináče), na obrázku/videu jména smí být.

## Postup práce
1. Najdi, co už existuje (`make_*.py`, `day_art.py`, `cinema.js`, `cinema-race.js`, `orders-fx.js`) a **používej a rozšiřuj to**, nepiš od nuly.
2. Kresli do mřížky, vyrenderuj, **koukni se na snímek** (zvětšený, montáž 4 časů u animace: `scratchpad/montage.py`). Hned oprav, co je děsivé (překryvy, nečitelný text, prázdná plocha, černé pruhy).
3. Po každé opravě znovu pohled, ne jen „mělo by to být dobré“. Animace: kontroluj pohyb postav (žádné skoky, teleporty, pendlování), začátek i konec záběru.
4. Test `npm test`, commit, push do `main` (smyčka a Pages nasadí). Video i post pošli uživateli ke kontrole (`SendUserFile`), nic nepublikuj bez výslovného souhlasu.

## Nástroje v repu
- `python marketing/make_posts.py | make_day.py | make_victory.py | make_letters.py | make_council.py | make_rip.py | make_vote.py` (posty; `make_vote.py` má hotové ilustrace dugouts/doctor/ammo).
- `node tools/render-cine.mjs <scéna|all> <složka> [--side 0|1 --n N --names A,B --heir X --house Y --fallen Z --gen 2 --day 4]` (filmové záběry march, guns, shelter, ribbon, counter, graves, heir, lineage → mp4 1080×1920).
- Reely: `marketing/reels/render.json` → workflow `reel`; podklady `tools/ridge-reel.mjs`, `tools/rip-data.mjs`; hlas `marketing/story_vo.py` (profil vypravěče), hudba `marketing/reel_audio.py` (`epic_score`, lament).
- Mapa ve hře: `web/src/orders-fx.js` (kryty, lékař, sklad munice), `hospital.js`, `life.js`; dev náhled `/?orders=0:DUGOUTS,0:DOCTOR,0:AMMO`.
- Kalendář příspěvků: `marketing/promo/plan.html` (`tools/calendar.mjs`).
