# Stav projektu a co je potřeba od tebe

_Aktualizováno 11. 11. 2026 (Den 3 války)._

## Teď ve hře
- Hra běží naostro: https://mudandiron.web.app, IG @mudandiron. Den 1 = 9. 11. 2026. K 11. 11. dopoledne 157 vojáků (Hegemony 76, Concord 81), 61 převzatých.
- **Závod o Verdel Ridge:** kdo první naverbuje 100 vojáků, dobude kótu. Výhra = 3 dny dělostřelectva na poraženého, bezpečnější týden pro vítěze,
  stuha všem vítězům a titul hrdiny pro rozhodujícího rekruta. Do první dobyté kóty děla mlčí. Další kóty: `theme.race.objectives` (Hill 304, Blackwater Canal…).
- **Denní boj** (v6): `docs/BATTLE.md`, role a čísla `docs/COMBAT_ROLES.md`.
- **Hlasování o stavbách** po frakcích na IG (HOSPITAL / SANDBAGS, vyhodnocení ve vydání Dne 3). Hlasování běží vždy jen jedno.
- **Výpravy do údolí jsou vypnuté** (`theme.valley.enabled = false`); zapnout jen s výslovným souhlasem. Dokud jsou vypnuté, příběhy o nich nemluví.
- **Automatika:** smyčka `front-loop` každých ~5 min (komentáře, odpovědi, fronta příspěvků, denní tah ve 13:00 UTC, nasazení webu),
  hlídač `watchdog` každých 20 min. Rytmus dne: `docs/SCHEDULE.md`. Odbavení rekrutů: `docs/ONBOARDING.md`.
- **Média:** obrázky a videa pro IG leží v `marketing/promo/` a jdou přes GitHub Pages. Zveřejněná videa se hodinu po publikaci z repa mažou.
- Aktuální pravidla a úkoly pro Claude: `CLAUDE.md`.

## Hotovo
- **Prototyp prohlížeče fronty** (PixiJS): procedurální zákopy (3 linie na stranu + spojovací zákopy, pytle, dráty, krátery, mrtvé stromy),
  4 000 falešných vojáků, úrovně detailu (zblízka sprity s „dýcháním“, zdálky tečky frakcí), přiblížený první pohled,
  hledání `@handle`, karta vojáka se služebním záznamem, odkaz `/?s=handle`, sdílení, déšť, mlha, záblesky.
- **Jádro** (`engine/`): deterministická mapa 32 sektorů (~18 600 míst, otevřeno 8), narukování z komentáře, převzetí kódem, generátor příběhů
  ze šablon (zdarma, bez AI), denní tah se zraněními, povýšením, smrtí a **nástupcem z rodu**. Testy: `npm test`.
- **Ingest** (`ingest/poll-comments.mjs`): Instagram API (systémový token, vlastní účet), stahování každých ~5 min ve smyčce `front-loop`,
  veřejná odpověď pod komentář, volitelná soukromá odpověď (Private Reply), párování převzetí přes Firestore.
- **Firebase projekt `fronta-ig`** (Spark, zdarma), náhled: https://mudandiron.web.app (živý web, Firebase Hosting zdarma; jediná používaná adresa. Výchozí web projektu fronta-ig.web.app nejde smazat, už se na něj nenasazuje; zůstává na něm poslední přesměrování).
- **Grafika:** všech 10 typů vojáků × 2 frakce (střelec, důstojník, zdravotník, kulometčík, ženista, spojka, ostřelovač, spojař, kuchař, kaplan),
  8 směrů, chodidla na jednom řádku, výška 30 ±1 px. Rekvizity: hrob s přilbou, mrtvý strom. Nástroje: `tools/sprite_qa.py` (kontrola), `tools/sprite_fix.py` (plovoucí pixely, pata).
- **Hlasování:** komentář s klíčovým slovem pod postem, 1 hlas na účet (platí poslední, heslo i v jednotném čísle), vyhodnotí ranní vydání → Gazette a War Room.
  Otevírá se samo po zveřejnění postu s `vote` ve frontě `marketing/queue.json`; ručně workflow `open-vote`. Po frakcích (`perFaction`) hlasuje jen ten, kdo má vojáka.
- **Růst fronty:** mapa má 32 sektorů, otevřeno 8; při 90% zaplnění se otevřou další 2. Voják má uloženou trvalou pozici, nikdy se nepřesune.

- **Hloubka zákopů:** vzdálená stěna s obložením a stínem, bližší okraj a jižní pytle ve vrstvě NAD vojáky (stojí v zákopu, Hegemonie vykukuje přes pytle).
- **Život na frontě** (`web/src/life.js`, jen vizuál, nikoho nezraní): dýchání (snímky z PixelLabu, nohy stojí); střelba podle klidného dne
  na západní frontě: voják v záběru vystřelí každých ~1–2,5 s, vzdálené záblesky po linii každých ~0,3–0,8 s, kulometná dávka 1× za 9–20 s,
  při ranním a večerním stand-to („morning hate“, 5:30–6:15 a 18:30–19:15 místního času) palba ×3; granát 1× za 20–50 s, světlice;
  zdravotník jde ke skutečně zraněnému po trase zákopu (i cikcakem), chodí pod okrajem zákopu, ošetří ho a vrátí se.
  Skutečná zranění dál jen v denním tahu (pomalu).
- **Bombardování:** přijde po dobytí kóty v závodě (3 dny, 4 úseky poraženého denně, `docs/BATTLE.md`); na webu je palba vidět už v den dobytí.
  Náhled: `/?fx=barrage`. Původní odemčení při 500 převzatých vojácích je zrušené (`theme.unlocks` je prázdné).

- **Deník fronty (Front Diary)** – tlačítko *Diary* na webu, odkaz `/?diary`. Dva druhy zápisů:
  1. **ruční** (píšeme my): `data/diary.json` → `entries: [{ day, title, text, by?, draft? }]`, odstavce `

`, `@handle` se změní na odkaz
     na vojáka. Zápis s budoucím `day` se ukáže až ten den (jde psát dopředu). Upravit jde i z mobilu na GitHubu; smyčka do 5 min nasadí.
  2. **automatická kronika dne** (`engine/chronicle.js`), píše ji denní tah: počasí, noví vojáci jménem, až 5 nejzajímavějších zápisů dne
     (padlí, nástupci, konce příběhů, nezvěstní, setkání s nepřítelem…), ztráty a síla frakcí.
- **Příběhy v2:** počasí dne (6 druhů, mění i déšť/mlhu na mapě; náhled `/?wx=fog`), vícedenní příběhové linky (13: krysa, dopisy, vrána, pes,
  píseň přes dráty, fotka z území nikoho, karty; podle povolání tunel, souboj ostřelovačů, chlapec, ukradená šunka, odposlech, deník),
  společné příhody dvou skutečných hráčů (spolubojovník / nepřítel přes dráty, zápis dostanou oba), nový stav **nezvěstný** (vrátí se do 4 dnů).

- **Údolí a výpravy (postaveno, teď VYPNUTO)** (`docs/MAP_MISSIONS.md`): tlačítko *Valley* / `/?valley` = mapa 8 míst, kdo je drží, kronika míst se jmény. Každé 3 dny ranní noviny
  vyhlásí noční výpravu, hráči se hlásí heslem místa v komentáři (CHURCH…) nebo převzatí tlačítkem Volunteer, 5 na frakci; další vydání otiskne
  souboj 5 na 5 podle rolí a počasí, zápisy účastníkům, zranění/nezvěstní/zajatí, Raider's Cross po 3 výpravách. Výzva CHURCH z Dne 2 byla zrušena, žádná výprava zatím neproběhla.

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

### Doplněno 10.–11. 11. 2026
- **Denní boj** s palbou hráčů, mediky, lůžky, nosítky a drátem (v6), bombardování po dobytí kóty, nemocnice na mapě.
- **Post při dobytí kóty** (`victory-ridge`, `ingest/triggers.mjs`): vyjde sám do ~5 min od dobytí a otevře hlasování frakcí.
- **Hlasy fronty:** delší komentáře pod hlasováním se ukládají do `data/voices.json` (výběr do reelu vždy schvaluje uživatel). Dopisový post se dělat nebude.
- **Publikace hlídá verzi souboru:** položka vyjde, až je na GitHub Pages stejný soubor jako v repu.
- **Texty hlídají stav hry:** žádné ostřelování před první dobytou kótou, žádné výpravy, dokud jsou vypnuté, žádná místa budoucích kót (`storyFor` v `engine/roster.js`).

## Nastavení, které už je hotové
Instagram API (secrets `IG_ACCESS_TOKEN`, `IG_USER_ID`), Firebase Auth přes Google a převzetí vojáka (`claimEnabled = true`),
service account pro nasazování (`FIREBASE_SERVICE_ACCOUNT`). Postup zapojení je v `docs/ONBOARDING.md`.

## Známá slabá místa
- **Limit Firebase Hosting (Spark): 360 MB přenosu denně, 10 GB úložiště.** Po vyčerpání denního limitu web neodpovídá do dalšího dne (půlnoc tichomořského času).
  Úložiště je bez problému (dist 4,7 MB). **Změřeno 2026-11-11 (telefon, nová návštěva): 0,64 MB** (obrázky 435 KB, JavaScript+CSS 193 KB, data 13 KB), tj. limit vydrží jen ~550 nových návštěvníků denně.
  **Opatření (od 2026-11-11):** obrázky hry (sprity, efekty, rekvizity) se berou ze **zrcadla na GitHub Pages** (`https://morgenster95.github.io/fronta/game/assets/…`, nahrává je workflow `media.yml`
  spolu s otiskem `game/assets.sha`). Build zrcadlo zapne jen když tam leží stejná verze (`tools/asset-base.sh`, proměnná `VITE_ASSET_BASE`); jinak jdou obrázky z Firebase. Když zrcadlo za běhu selže,
  `web/src/assets.js` načte obrázek z vlastní domény. Z Firebase pak jde ~0,2 MB na návštěvu, limit vydrží ~1 700 nových návštěvníků denně (Pages: měkký limit 100 GB měsíčně).
  Hashované JS/CSS mají `Cache-Control: immutable`.
  Smyčka od 2026-11-11 nasazuje web jen při **skutečné změně obsahu** (`dist_hash` v `tools/loop.sh`, bez časových razítek `updated`); dřív se nasazovalo při každém kole (~213× denně, z toho ~85 se skutečnou změnou). Watchdog (každých 20 min) při odpovědi jiné než HTTP 200 založí issue `site-down` (e-mail).
  **Kontrola vytížení:** Firebase Console → Hosting → Využití (přenos za den). Další krok, kdyby to nestačilo: JavaScript také na Pages / přesun hostingu na Cloudflare Pages (zdarma, bez limitu přenosu; vyžaduje účet a změnu odkazu v bio).
- Testy se na GitHubu nespouštějí samy (jen `npm test` před commitem).
- Historie gitu obsahuje stará videa (~110 MB). Smazání souborů repo nezmenší, to by šlo jen přepsáním historie.
- Už zveřejněný příběhový reel a `marketing/CAPTIONS.md` zmiňují „every midnight“ a „500 claimed soldiers unlock the artillery“; obojí už neplatí.

## PixelLab
Zbývá ~90 generací, propadnou **13. 11.** Nechal jsem je na tvoje rozhodnutí (např. tank, dlaždice, další varianty).

## Další kroky (můj návrh pořadí)
1. Terén: zem a stěny jsou zatím kreslené kódem (krátery, stromy, hroby už z PixelLabu). Další krok: textura stěny a ostnatý drát z PixelLabu.
2. Tank: 8 směrů z PixelLabu vyšlo moc vysoké a ne-kosočtverečné → zkusit čelní snímek přes `create_image_pro_flash` v měřítku (výška ~40 px) a teprve pak rotaci. Animace idle hromadně nepouštěny (malý přínos).
3. Posun linie podle výsledků hlasování (zatím hlasování staví stavby nebo vydává dočasné rozkazy).
4. Výkon na mobilu: zatím ověřeno jen na desktopu (Chrome).
