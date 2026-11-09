# Stav projektu a co je potřeba od tebe

_Aktualizováno 9. 11. 2026._

## Hotovo
- **Prototyp prohlížeče fronty** (PixiJS): procedurální zákopy (3 linie na stranu + spojovací zákopy, pytle, dráty, krátery, mrtvé stromy),
  4 000 falešných vojáků, úrovně detailu (zblízka sprity s „dýcháním“, zdálky tečky frakcí), přiblížený první pohled,
  hledání `@handle`, karta vojáka se služebním záznamem, odkaz `/?s=handle`, sdílení, déšť, mlha, záblesky.
- **Jádro** (`engine/`): deterministická mapa 32 sektorů (~18 600 míst, otevřeno 8), narukování z komentáře, převzetí kódem, generátor příběhů
  ze šablon (zdarma, bez AI), denní tah se zraněními, povýšením, smrtí a **nástupcem z rodu**. Testy: `npm test`.
- **Ingest** (`ingest/poll-comments.mjs`): Instagram API (Standard Access, vlastní účet), stahování každých 30 min přes GitHub Actions,
  volitelná soukromá odpověď (Private Reply), párování převzetí přes Firestore.
- **Firebase projekt `fronta-ig`** (Spark, zdarma), náhled: https://mudandiron.web.app (živý web, Firebase Hosting zdarma; jediná používaná adresa. Výchozí web projektu fronta-ig.web.app nejde smazat, už se na něj nenasazuje; zůstává na něm poslední přesměrování).
- **Grafika:** všech 10 typů vojáků × 2 frakce (střelec, důstojník, zdravotník, kulometčík, ženista, spojka, ostřelovač, spojař, kuchař, kaplan),
  8 směrů, chodidla na jednom řádku, výška 30 ±1 px. Rekvizity: hrob s přilbou, mrtvý strom. Nástroje: `tools/sprite_qa.py` (kontrola), `tools/sprite_fix.py` (plovoucí pixely, pata).
- **Hlasování:** komentář s klíčovým slovem pod Reelem, 1 hlas na účet, vyhodnotí denní tah → denní zpráva na webu. Otevření: workflow `open-vote` (jde i z mobilu přes GitHub app).
- **Růst fronty:** mapa má 32 sektorů, otevřeno 8; při 90% zaplnění se otevřou další 2. Voják má uloženou trvalou pozici, nikdy se nepřesune.

- **Hloubka zákopů:** vzdálená stěna s obložením a stínem, bližší okraj a jižní pytle ve vrstvě NAD vojáky (stojí v zákopu, Hegemonie vykukuje přes pytle).
- **Život na frontě** (`web/src/life.js`, jen vizuál, nikoho nezraní): dýchání (snímky z PixelLabu, nohy stojí); střelba podle klidného dne
  na západní frontě: voják v záběru vystřelí každých ~1–2,5 s, vzdálené záblesky po linii každých ~0,3–0,8 s, kulometná dávka 1× za 9–20 s,
  při ranním a večerním stand-to („morning hate“, 5:30–6:15 a 18:30–19:15 místního času) palba ×3; granát 1× za 20–50 s, světlice;
  zdravotník jde ke skutečně zraněnému po trase zákopu (i cikcakem), chodí pod okrajem zákopu, ošetří ho a vrátí se.
  Skutečná zranění dál jen v denním tahu (pomalu).
- **Bombardování:** odemkne se při 500 převzatých vojácích (ukazatel na webu), pak jde dát do hlasování (`open-vote` s efektem `barrage`);
  vítězství = hustá palba na cílovou frakci po celý další den + vyšší nebezpečí v denním tahu. Náhled: `/?fx=barrage`.

- **Deník fronty (Front Diary)** – tlačítko *Diary* na webu, odkaz `/?diary`. Dva druhy zápisů:
  1. **ruční** (píšeme my): `data/diary.json` → `entries: [{ day, title, text, by?, draft? }]`, odstavce `

`, `@handle` se změní na odkaz
     na vojáka. Zápis s budoucím `day` se ukáže až ten den (jde psát dopředu). Upravit jde i z mobilu na GitHubu; smyčka do 5 min nasadí.
  2. **automatická kronika dne** (`engine/chronicle.js`), píše ji denní tah: počasí, noví vojáci jménem, až 5 nejzajímavějších zápisů dne
     (padlí, nástupci, konce příběhů, nezvěstní, setkání s nepřítelem…), ztráty a síla frakcí.
- **Příběhy v2:** počasí dne (6 druhů, mění i déšť/mlhu na mapě; náhled `/?wx=fog`), vícedenní příběhové linky (13: krysa, dopisy, vrána, pes,
  píseň přes dráty, fotka z území nikoho, karty; podle povolání tunel, souboj ostřelovačů, chlapec, ukradená šunka, odposlech, deník),
  společné příhody dvou skutečných hráčů (spolubojovník / nepřítel přes dráty, zápis dostanou oba), nový stav **nezvěstný** (vrátí se do 4 dnů).

- **Údolí a výpravy** (`docs/MAP_MISSIONS.md`): tlačítko *Valley* / `/?valley` = mapa 8 míst, kdo je drží, kronika míst se jmény. Každé 3 dny ranní noviny
  vyhlásí noční výpravu, hráči se hlásí heslem místa v komentáři (CHURCH…) nebo převzatí tlačítkem Volunteer, 5 na frakci; další vydání otiskne
  souboj 5 na 5 podle rolí a počasí, zápisy účastníkům, zranění/nezvěstní/zajatí, Raider's Cross po 3 výpravách. První výprava: Day 2.

### Doplněno večer 9. 11. 2026
- **Přání rolí z komentářů:** hráči si v komentářích píšou, čím chtějí být. Komentář, který zmíní **právě jednu roli**, ji dá hned,
  ať jde o přihlášku („CONCORD machine gunner“) nebo o komentář už narukovaného („I want to be a doctor“, „MG“).
  Rozpozná názvy rolí i běžná slova (MG, gunner, doctor, doc, nurse, radio, engineer, chef, priest… = `theme.archetypes[].aliases`).
  Delší výraz má přednost („sniper rifle“ = ostřelovač). Dvě různé role v jednom komentáři = nic. „let him cook“ se nepočítá.
  - Zdarma a hned je jen **první volba**. Další změny jdou přes převelení na kartě (převzatý voják, 1× za 7 dní).
  - **Lieutenant** se přes komentář dát nedá, je jen za povýšení. Bot to vysvětlí.
  - Kdo ještě nenarukoval a napíše jen roli, dostane odpověď, ať přidá CONCORD nebo HEGEMONY.
  - Bot odpovídá veřejně („Granted. … now serves as …“). Staré komentáře se jednou prošly zpětně (`state.roleBackfillV`, 6 hráčů dostalo roli).
  - Kód: `parseRole`, `wishRole`, `roleReply` v `engine/roster.js`.
- **Odpovědi pod komentáři:** ingest čte i odpovědi (dřív jen komentáře na první úrovni → kdo napsal HEGEMONY jako odpověď pod cizí komentář,
  nenarukoval). Narukování, role, kódy i hesla výprav fungují i v odpovědi. Bot odpovídá do vlákna nadřazeného komentáře.
  Komentáře našeho účtu se přeskakují (odpovědi bota obsahují hesla frakcí). Při změně počtu komentářů u postu se projdou všechny stránky.
- **Deníky se nikdy nemažou:** nástupce z rodu pokračuje v deníku rodu (dřív začínal prázdný → zápisy padlého by zmizely),
  kronika a deník fronty drží celou historii (dřív 60/90 dní), karta ukazuje posledních 40 zápisů a starší pod tlačítkem
  „Show N older entries“ (`web/public/data/records-old/`).
- **Reely z cloudu:** workflow `reel` (`tools/make-reel.sh`) vyrobí celý reel na GitHub Actions (voiceover, natočení, zvuk, zmenšení pro IG)
  → `marketing/promo/reel_<name>.mp4` → `https://morgenster95.github.io/fronta/reel_<name>.mp4`. Spuštění: commit `marketing/reels/render.json`
  `{"name": "<name>"}` nebo Actions → reel → Run workflow. Ověřeno na day1 (64 s, ~14 min). Postup je v `CLAUDE.md`.
- **`CLAUDE.md` v repu:** pravidla projektu, postup pro reely a aktuální TODO pro Claude v cloudu (aplikace v mobilu), kde není paměť z PC.

## Potřebuju od tebe (až se vrátíš)
1. ~~Název hry + IG účet~~ → **Mud & Iron, @mudandiron** (hotovo). Promo balíček: `marketing/` (texty v `marketing/CAPTIONS.md`), odbavení: `docs/ONBOARDING.md`.
2. **Instagram:** profesionální (Creator/Business) účet → developers.facebook.com → aplikace typu *Business* → produkt
   *Instagram API with Instagram Login* → přidat svůj IG účet → vygenerovat token s oprávněními
   `instagram_business_basic`, `instagram_business_manage_comments` (+ `instagram_business_manage_messages` pro DM).
   Token a IG user ID vložit do GitHub Secrets (`IG_ACCESS_TOKEN`, `IG_USER_ID`). **První test:** spustit workflow `ingest` ručně.
3. **Firebase Auth (Google):** Console → Authentication → Get started → Google → Enable. Pak vytvořit Firestore (Native, eur3)
   a webovou aplikaci → konfiguraci dát do `web/src/firebase-config.js`.
   ⚠️ `authDomain` = doména, na které web běží (`mudandiron.web.app`), a v Google Cloud Console → Credentials → OAuth klient
   „Web client (auto created…)“ přidat `https://<doména>/__/auth/handler` do Authorized redirect URIs **před nasazením**.
4. **Service account pro nasazování z GitHubu:** Firebase Console → Project settings → Service accounts → Generate new private key
   → obsah JSON do secretu `FIREBASE_SERVICE_ACCOUNT`.

## PixelLab
Zbývá ~90 generací, propadnou **13. 11.** Nechal jsem je na tvoje rozhodnutí (např. tank, dlaždice, další varianty).

## Další kroky (můj návrh pořadí)
1. Terén: zem a stěny jsou zatím kreslené kódem (krátery, stromy, hroby už z PixelLabu). Další krok: textura stěny a ostnatý drát z PixelLabu.
2. Tank: 8 směrů z PixelLabu vyšlo moc vysoké a ne-kosočtverečné → zkusit čelní snímek přes `create_image_pro_flash` v měřítku (výška ~40 px) a teprve pak rotaci. Animace idle hromadně nepouštěny (malý přínos).
3. Posun linie podle výsledků hlasování (zatím hlasování mění jen nebezpečnost dne).
4. Renderer Reelů (headless prohlížeč nahraje průlet kamerou).
5. Výkon na mobilu: zatím ověřeno jen na desktopu (Chrome).
