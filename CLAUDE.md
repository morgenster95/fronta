# MUD & IRON (repo `fronta`): pokyny pro Claude

Tenhle soubor čte Claude Code i v cloudu (aplikace Claude v mobilu, claude.ai/code), kde není paměť z domácího PC.
Proto tu je všechno, co je potřeba k práci. Podrobnosti: `docs/STATUS.md` (co je teď ve hře), `docs/BATTLE.md` a `docs/COMBAT_ROLES.md` (boj), `docs/ONBOARDING.md` (rekruti a provoz),
`docs/SCHEDULE.md` (rytmus dne), `docs/MAP_MISSIONS.md` (výpravy, vypnuté), **`docs/MECHANICS.md` (deník domluvených mechanik)**. `docs/DESIGN.md` je původní návrh, neaktualizuje se.

## ČEKÁ NA OVĚŘENÍ A ROZHODNUTÍ (stav 2026-11-11 večer; na začátku relace to uživateli stručně připomeň)
1. **Převod stavu po částech** (`data/state-records/`, `SPLIT_STATE=1` v `front-loop.yml`): proběhne při příštím restartu smyčky (nejpozději ~21:00 UTC 11. 11.; čekající starší běh jsem zrušil).
   **Ověřit:** v `main` je složka `data/state-records` (128 souborů), `data/state.json` je menší, počty zápisů sedí (`recN`), smyčka běží dál, web se nasazuje a karta ukazuje 3 zápisy + „Show more“.
   Když ne: `node --input-type=module -e` načti stav (`loadState`), případně smyčku restartuj (`gh workflow run front-loop`). Chybí-li zápisy, načtení spadne (pojistka), nic se neztratí.
2. **Zápis každému každý den:** nasazeno až po vydání Dne 3, proto mají vojáci (např. Edmund „Hollow“ Biwott, ~60 dalších) mezery ve Dni 2–3. **Ověřit po vydání Dne 4 (12. 11. 13:00 UTC),** že každý živý voják má zápis ze Dne 4 a právě jeden.
   **Uživatel se ptal, jestli mezery ze Dne 2–3 doplnit zpětně** (krátký denní zápis z běžných šablon vložit na správné místo; starší zápisy se nepřepisují). Čeká na odpověď, bez souhlasu nedělat (deníky „se negenerují znovu“).
3. **Hlavička „Dispatch · Day 2“** v horním panelu: starý zápis hlasování z Dne 3 je uložený pod dnem 2; oprava platí pro nová hlasování, po dalším výsledku se číslo srovná.
4. **Doména** (Cloudflare) a škálování: viz sekce níže. **`letters-1`** a **`reel-sides`** čekají na čas od uživatele.
5. **Boj v12** (od vydání Dne 4): zeptat se, jak se chová (padlí, raněni, bombardování).

## SEZENÍ 2026-11-12 VEČER (Ko-fi, videa mimo git, poručíci): hotovo, nápady a čeká na rozhodnutí
**Hotovo:**
- **Day reel Dne 2** zveřejněn 2026-11-10 17:59 UTC (https://www.instagram.com/reel/Dfkf3GQEy_X/). Titulky denních reelů posunuty pod horní lištu IG (`#rd-sub` top 15,5 %), karta hlasování menší a níž.
  Denní reel má od Dne 3 vždy počty hráčů: celkem + přejezd kamery po první linii každé strany s jejím číslem (`armyH`/`armyC`, kamera jen po skutečných hráčích).
- **Ko-fi + War Bonds** (viz Pojmy). Text pro formulář platební služby (popis „firmy“: bezplatná hra, dobrovolné dary přes Ko-fi, kosmetická stužka) uživatel vyplnil.
- **Videa mimo git** (viz Pravidla): 3 nezveřejněná videa (`reel_claim`, `reel_howto`, `reel_sides`) jsou v Release `media`, z gitu vyřazena 2026-11-12.
- **Vyrovnání poručíků** (`theme.officerBalance`, `docs/MECHANICS.md`): stav byl Hegemonie 7 : Concord 1. Nováček bez přání role ze strany s méně poručíky je poručík, strana s víc žádného nedostane, při rovnosti losování;
  vypne se samo po srovnání. Povyšování na poručíka uživatel NECHCE. Odpověď bota na přání poručíka: „Lieutenants aren't requested, soldier. The front chooses them.“
- **Nové pravidlo IG:** v popiscích žádné @označení hráčů (viz Pravidla).
- **Rychlejší web:** sprity vojáků v jednom atlasu (na 4G 8,2 s → 1,9 s), atlas se po změně spritů přegeneruje sám (workflow `atlas`, viz Pravidla). Výbuchy ani krátery se nehromadí (ověřeno).
**Nápady (nestavět bez souhlasu):**
- **Trench Dog** pro měsíční předplatitele (Ko-fi membership).
- **Video o skrytých hříčkách v textech** (uživatele to baví, chce je vysvětlit ve videu): „One good turn“ (přísloví *one good turn deserves another*, tužka), „the early birds“ (First Wave, ranní ptáče),
  „Don't let the mud have it“, „Hold.“ (rozkaz o jednom slově), „Water costs enough already.“ (kbelík nad nepřátelským valem), „Soup“ (kbelík s vodou), „cabbage“ (lupa), „nothing to report“ + půl stránky o mýdle,
  krysa jménem Major, jídelní lístek „Bread, in the Army Manner“ → „The Usual“, „No lodgers“ (cedulka v krytu). Vše v `themes/front-ww1/story.json`. Hříčky a přísloví NEODSTRAŇOVAT (uživatel je chce).
- **Riziko výpadku (přehled 2026-11-12):** web, data i Firestore mají velkou rezervu (286 hráčů); rizika: virální nápor na Firebase Hosting (~1 700 nových návštěv/den), chybí omezení rychlosti odpovědí na IG,
  úložiště Firebase Hosting 10 GB (uživatel si má v konzoli nastavit, ať drží ~20 posledních verzí webu). Git repo nejde „zvětšit“, ale už není potřeba (videa v Release, data malá).
**Čeká na rozhodnutí uživatele:**
- **Vyčištění historie gitu od starých videí** (stovky MB; sama se nikdy nesmaže): přepis historie `git filter-repo` + force push. Postup: po ranních novinách vypnout smyčku a počkat, záloha, přepsat, nahrát, zapnout, ověřit;
  ostatní sezení a kopie repa pak znovu naklonovat. Riziko malé, přínos malý; uživatel zvažuje, doporučeno udělat v klidné chvíli (nebo spolu s přechodem na doménu).
- Post `support-kofi` (kdy, jestli vůbec), `reel-claim`, `reel-sides`, `reel-howto`, `letters-1`: čas zveřejnění od uživatele.

 na tisíce hráčů (domluveno 2026-11-11, řešit příště)
**Na začátku relace uživateli napiš, že tohle čeká, a zeptej se, jak postupovat.** Detaily čísel: `docs/SCALING.md`.
- **Doménu uživatel koupil u Cloudflare** (název zatím neznám, zeptat se). Doporučení: **krok 1** = doménu připojit k **Firebase Hostingu** (Cloudflare jen jako DNS, záznamy v režimu „DNS only“, šedý obláček), změnit `authDomain` ve `web/src/firebase-config.js`,
  uživatel v Firebase Auth přidá doménu a v Google Cloud OAuth `https://<doména>/__/auth/handler`, přepsat GitHub proměnnou `SITE_URL` (odkazy v odpovědích bota) a odkaz v biu, stará `mudandiron.web.app` přesměrovat na novou (skript v `index.html`, `firebase.json` neumí host).
  Komentáře a tvorba vojáků na doméně nezávisí (IG API + GitHub Actions + git); závisí na ní jen Google přihlášení („This is me“).
- **Krok 2 (před ~1 000 hráči)**: kód hry na Cloudflare Pages (jen při změně kódu, limit zdarma 500 sestavení měsíčně), veřejná data v Cloudflare R2 (zdarma 10 GB, bez poplatku za přenos), přihlášení buď přes Supabase Auth (funguje na jakékoli doméně),
  nebo Firebase s proxy `/__/auth/` (nepodporováno, nejistý). Nejdřív **testovací nasazení** vedle ostrého webu (např. `test.<doména>`), přepnout až po ověření přihlášení. Uživatel musí v Cloudflare vytvořit projekt Pages a vložit klíč do GitHubu jako Secret.
- **Krok 3 (před ~4 000 hráči)**: zápisy a stav mimo git (`state.json` roste ~0,3–0,9 KB na vojáka a den; GitHub odmítne soubor nad 100 MB), případně Supabase Postgres. Přidat **omezení rychlosti odpovědí na komentáře** (IG limity neznámé, kód žádné nemá).
- **Kdy začne zlobit** (odhad z měření): Firebase limit 360 MB/den při ~1 500–3 000 hráčích, `state.json` > 15 MB při ~4 000 (za ~10 dní), > 100 MB při ~10 000 (za ~12 dní). Hra samotná zvládá 10 000 (načtení ~2 s).
- Hotovo dnes: zrcadlo obrázků na GitHub Pages (`web/src/assets.js`, `tools/asset-base.sh`, `media.yml`), nasazování jen při změně obsahu (`dist_hash` v `tools/loop.sh`), hlídání dostupnosti v `watchdog.yml`.
- Pravidlo „jen zdarma“ platí; placené věci (Cloudflare Pages Pro ~20 USD/měs., Supabase Pro) jen s výslovným souhlasem. Uživatel zvažoval i Vercel + Supabase (jako thaloriaworld.com); závěr: Vercel Hobby je jen nekomerční a Supabase zdarma má 5 GB přenosu měsíčně, takže na servírování dat se nehodí.

## Boj v12 nasazen (2026-11-11, první vydání 12. 11. 13:00 UTC)
Přepracování boje na **v12** (palba hráčů jako hlavní zdroj ztrát, škrábnutí + kritické, nasycení palby, smrt hlavně z nedostatku lůžek, nosítek a mediků,
silné bombardování se smrtí přímým zásahem, spojař proti granátům) je **nasazeno**. Důvody, čísla, simulace a zamítnuté varianty: `docs/MECHANICS.md`, `docs/sim/`.
**Na začátku relace to uživateli stručně připomeň a zeptej se, jak se v12 chová ve hře** (padlí, raněni, bombardování po dobytí kóty); ladění jedním číslem v `theme.json` → `battle` (viz „Provoz v12“ v `docs/MECHANICS.md`).
Čeká na uživatele: útok OVER THE TOP (návrh v `docs/MECHANICS.md`).

## Pojmy (domluveno 2026-11-12, drž je ve všech zprávách i v kódu)
- **Day reel** = denní shrnutí ve videu (reel `day<N>`, např. `ridge` = Day reel Dne 3). **Noviny** = ranní vydání ve 13:00 UTC (Trench Gazette: denní tah, výsledky, zprávy).
- **Kalendář / plán (od 2026-11-12 soukromě):** veřejný `plan.html` na GitHub Pages je zrušený (repo je veřejné). Plán příspěvků, úkoly a nápady jsou v soukromém Artifactu **Štáb fronty** (https://claude.ai/artifact/RGDGFdGEhLwbGPVncj66zX, vidí ho jen uživatel; data v jeho databázi: kolekce `queue` = příspěvky `{title, kind, status published|scheduled|waiting, at, note}`, `tasks` = úkoly `{title, group me|ideas|dev, done, note, order}`). Smyčka ho neobnovuje: **při každé změně fronty, přidání postu nebo úkolu ho aktualizuj přes `ArtifactData`** (batch) a uživateli to připomeň. `tools/calendar.mjs` zůstává jen jako ruční nástroj (nezveřejňovat).
- **Hlasování (od 2026-11-12):** jedno hlasování, tři stejné volby pro obě strany, stejný účinek, funkční kdykoli (DUGOUTS, DOCTOR, AMMO; `vote-orders-d4` ve frontě bez termínu, `docs/MECHANICS.md`). Na mapě je vidět kryty, lékaře u obvaziště a sklad munice (`web/src/orders-fx.js`, dev náhled `/?orders=0:DUGOUTS,0:DOCTOR,0:AMMO`). Žádné dvě nabídky podle strany.
- **Do fronty (`queue.json`) patří jen schválené věci** (pravidlo uživatele 2026-11-12): rozpracovaný post nebo reel se do ní nedává; návrh položky drž mimo (např. `marketing/reels/<id>.draft.json`) a přidej ho až po výslovném schválení. Teď rozpracováno: `reel-claim` (`marketing/reels/claim.draft.json`). Uloženo na později: post na podporu přes Ko-fi `support-kofi` (`marketing/drafts/support-kofi.draft.json`, obrázek `marketing/promo/support_1.jpg`; uživatel ho teď nechce tlačit, Ko-fi je zatím jen tlačítko na webu).
- **Ke každé novince i story (pravidlo uživatele 2026-11-12):** když přidáš do fronty post nebo reel, přidej i story: `node tools/story-for.mjs <id> [--still snimek.png]` (obrázek 1080×1920 `marketing/make_story.py` + položka `story-<id>`, výchozí čas = čas příspěvku + 10 min). U reelu dej čistý snímek ze záběru bez titulků (`--still`), u postu se použije post samotný. Stories se zveřejňují stejně jen se souhlasem uživatele (schválení příspěvku platí i pro jeho story).
- **Podpora přes Ko-fi = War Bonds** (od 2026-11-12, `docs/MECHANICS.md`): stránka **https://ko-fi.com/mudandiron** (`theme.support.url`), jednorázový dobrovolný dar („ration“, 3 $), jen čest, žádná herní výhoda, žádné stupně ani počítání darů.
  Dárce napíše do zprávy na Ko-fi IG jméno, **uživatel mi ho pošle** a já přidám příkaz `{ id: "support-<handle>-<datum>", cmd: "support", handle }` do `data/commands.json` (smyčka do ~5 min:
  stužka u jména a řádek na kartě „War Bonds: supported the making of Mud & Iron“, 🎗 v albu rodu, stužka na obrázku „I ENLISTED“, zápis do deníku „{name} bought War Bonds for the front. The quartermaster pinned the ribbon on personally: 'The front remembers who kept it fed.'“,
  v příštích novinách „The front thanks {names}, who bought War Bonds and kept the guns fed.“). Server na webhook Ko-fi nemáme (Spark), proto ručně.
  **Dárci:** v01py (Bastian „Lucky“ Vpy, Concord) 2026-11-12; jeho zápis se starým textem byl na výslovný pokyn uživatele přepsán příkazem `rewriteSupport` (jediná výjimka z nedotknutelných deníků).
  Na webu: nenápadné tlačítko **„☕ Support“** u lupy (mobil jen ikona, styl tlačítek +/−; uživatel nechce nic křiklavého) a delší tlačítko s vysvětlením v panelu náboru.
  Post na Ko-fi `support-kofi` je uložený jako návrh (viz výš), čtverec pro stránku Ko-fi `marketing/promo/support_square.jpg` (`marketing/make_support.py`). Texty pro Ko-fi (bio, děkovací zpráva po platbě) jsou nastavené uživatelem.
  **Trench Dog** (pes u vojáka na mapě, jméno psa, zdědí ho nástupce) je nápad pro budoucí **měsíční předplatitele**, nestavět bez souhlasu.
- **Ruční zásahy do stavu přes příkazy** (stav ručně neupravuj): `data/commands.json` = pole `{ id, cmd, … }`, smyčka každý provede jednou (`state.commandsDone`). Příkazy: `support` (War Bonds), `rewriteSupport` (jednorázový přepis textu odměny), `switchFaction` `{ handle, faction }` (hráč chce k druhé straně: nové stanoviště a jednotka, zápis do deníku, role/XP/zásahy zůstanou, počty stran i závod se přepočítají samy; `engine/roster.js`). Zrušení hlasování: `data/cancel-vote.json`.
- **Plán rozvoje (průzkum 2026-11-12):** `docs/RESEARCH_ROADMAP.md` (podobné hry, Instagram jako ovládání, dopisy jako buff, soutěž plakátů „Propaganda War“, držení pozic a sezóny, pořadí kroků a otevřené otázky). Výpravy zůstávají vypnuté, nic z toho není postavené, dokud uživatel neodsouhlasí.
- **Před každými novinami** uživateli ukaž ztráty z nanečisto: `node tools/preview-tick.mjs` (jedno vydání, text novin) a `node tools/sim-edition.mjs` (30 běhů × 3 dny: padlí a raněni po stranách).
  Při bombardování musí mít poražený strana víc ztrát než vítěz (kontrola je ve výpisu sim-edition); jinak mechaniku neladit potichu, ale nahlásit.

## Pravidla
- **Odpovídej česky.** Texty ve hře a na Instagramu jsou anglicky (publikum USA/UK, ne Praha).
- **Jen zdarma:** žádné placené služby, Firebase Blaze, Cloud Functions ani placená API. Firebase je na Spark, média na GitHub Pages.
  **Firebase Hosting má limit 360 MB přenosu denně** (po vyčerpání web neodpovídá). Obrázky hry proto běží ze zrcadla na GitHub Pages (`web/src/assets.js`, `tools/asset-base.sh`, `media.yml`);
  nová návštěva stáhne z Firebase jen ~0,2 MB. **Při přidávání dalších velkých souborů do `web/public/` počítej s limitem** (podrobnosti `docs/STATUS.md`, „Známá slabá místa“).
- **Nic nepublikuj na Instagram bez výslovného souhlasu uživatele** (reel, story, post). Tokeny nikdy nezadávej ani nevypisuj.
- **Statické posty vždy 1080×1350 (4:5)**, víc místa a pro IG nejlepší: kreslí se v mřížce 216×270 a zvětší ×5 (`marketing/make_posts.py` W, H, K; `make_day.py`, `make_victory.py`).
- **V popiscích na IG hráče neoznačovat** (žádné @jméno; hromadné označování může IG vyhodnotit jako spam). Platí i pro hrdinu kóty: v popisku je jeho jméno
  bez zavináče. Označení a jména hráčů patří do hry (web, Gazette) a do videa.
- **Denní reel i jeho popisek vždy uvádí, kolik hráčů je teď na frontě** (celkem, pak přejezd kamery po první linii Hegemonie a Concordu s počtem každé strany; `tools/day-reel.mjs` věty `army`, `armyH`, `armyC`, `data.army`).
- **Ve videích žádní „duchové“** (průsvitní vojáci; uživatel na to upozorňoval opakovaně): každý voják ve videu má plné krytí a barvu. Ve hře jsou neobsazená stanoviště záměrně šedá a poloprůhledná, ale v režimu natáčení (`?reel=`) to `web/src/main.js` vypíná.
  Nový reel nebo filmový záběr nesmí nikde kreslit vojáky s `alpha < 1` (mlha a stín jen jako barevný tint, ne průhlednost) a po vyrenderování se snímky vždy zkontrolují, jestli tam žádný duch není.
- **Atlas spritů vojáků** (od 2026-11-12): web stahuje sprity vojáků jako jeden obrázek `web/public/assets/soldiers/atlas.png` + `atlas.json` (dřív ~390 souborů, načtení na 4G 8,2 s → 1,9 s).
  **Uživatel bude přidávat nové animace a sprity: atlas se přegeneruje SÁM** workflow `atlas` (`.github/workflows/atlas.yml`) po každém pushi do `main`, který změní něco v `web/public/assets/soldiers/`
  (commitne nový atlas a nasadí zrcadlo na Pages). Při práci v sezení přesto spusť `python tools/make-atlas.py` před commitem, jinak spadne `npm test` (hlídá shodu atlasu se soubory).
  Nový sprite musí být i v `manifest.json` (nebo `aims.json`), jinak ho hra nepoužije. Sprite, který v atlasu chybí, se načte samostatně (`loadAtlas` v `web/src/assets.js`).
  **Kontrola při každém nasazení spritů:** `npm test` prošel, workflow `atlas` doběhl (nebo atlas commitnutý ručně), na náhledu webu vojáci vypadají správně.
- Repo je **veřejné**: žádné tajné údaje, e-maily ani tokeny do commitů.
- **Videa nejsou v gitu** (od 2026-11-12; dřív se commitovala a historie repa rostla o desítky MB denně, smazání ji nezmenší): workflow `reel` nahraje video do GitHub Release `media`,
  workflow `media` ho odtud vystaví na GitHub Pages (`marketing/promo/*.mp4` je v `.gitignore`; obrázky postů zůstávají v gitu). Hodinu po zveřejnění na IG `ingest/publish.mjs` video z Release smaže.
  Uživatel chce videa mít u sebe: každé hotové video mu pošli ke stažení (nebo odkaz na GitHub Pages) ještě před publikací. Video, které vyrobíš lokálně, nahraj do Release (`gh release upload media <soubor> --clobber`, jen v Actions) nebo přes workflow `reel`.
- Hra běží naostro: https://mudandiron.web.app, IG @mudandiron. Automatika = smyčka `.github/workflows/front-loop.yml` (`tools/loop.sh`)
  každých ~5 min: stáhne komentáře, odpoví, publikuje frontu `marketing/queue.json`, denní tah v 13:00 UTC, nasadí web.
  Smyčka commituje do main → **před pushem vždy `git pull --rebase`**; `data/state.json` ručně neupravuj.
- **Jeden zápis za den** (od 2026-11-11): každý živý voják má každý den právě jeden zápis do deníku (`theme.storyShare = 1`; dřív dostával zápis jen ~1× za 4 dny, proto byly v deníku mezery). Zápisy téhož dne se spojují (`addEntry` v `engine/soldier.js`), raněný a nezvěstný má krátký denní zápis (`wardBed/wardStretcher/wardTrench/wardLight/wardMissing`). Starší zápisy se nepřepisovaly (mezery z Dne 2–3 zůstanou).
  **Stav po částech** (od 2026-11-11, `tools/lib.mjs`): zápisy vojáků jsou mimo `data/state.json`, v `data/state-records/NNN.json` (128 dávek podle handle), ve `state.json` je u vojáka jen počet `recN`. Pojistka: když se zápisy nenačtou celé, načtení spadne a nic se neuloží.
  Zapíná se `SPLIT_STATE=1` (workflow front-loop) nebo existencí složky; převod proběhne při prvním uložení v nově spuštěné smyčce. **Do gitu přidávej vždy `data/state.json` i `data/state-records`.** Web: karta ukáže 3 zápisy, v dávce karty je posledních 10 (`RECENT`), starší v `records-old`; dávek je ~1 na 25 vojáků (`shardCount`).
- **Deníky jsou nedotknutelné:** zápisy vojáků (`s.record`), kronika (`state.chronicle`) a deník fronty se jen přidávají, nikdy se neořezávají,
  nepřepisují ani negenerují znovu. Nástupce pokračuje v deníku rodu. Web ukazuje posledních 40 zápisů, starší jsou v `records-old` (tlačítko na kartě).
- **Každou domluvenou změnu mechaniky** (boj, role, ztráty, bombardování, útoky) i návrh zapiš do `docs/MECHANICS.md` (datum, stav NASAZENO/SCHVÁLENO/NÁVRH, čísla, proč).
- Před commitem `npm test` (musí projít). Commity do `main`, smyčka změny sama nasadí.
- Engine (`engine/`) je obecný, téma (`themes/front-ww1/`) je konkrétní hra. Ten rozdíl drž (stejný engine půjde použít pro jiná témata).
- **Angličtina příběhů** (od 2026-11-11, hráči nerozuměli): jednoduchá, konkrétní, krátké věty, bez žargonu a britských slov, která neznají US hráči (ne „bay“, „revetment“, „puttees“, „greatcoat“, „billet“, „stand-to“, „lorry“; používej „trench“, „squad“, „coat“, „truck“, „dawn watch“). Žádné krkolomné věty ani vtipy, kterým nikdo nerozumí.
  Přepsáno 153 šablon, staré a nové v `docs/textreview/changes.json` (skript `docs/textreview/rewrite.py` je jednorázový). Šablona s `{waiting}` musí dávat smysl i pro „nobody“ (engine ho nahrazuje).
- Příběhové texty: proměnné jen tam, kde je kód doplní; žádná zájmena u dvojic spolubojovník/nepřítel; slova o počasí jen v šablonách počasí;
  v krocích příběhových linek žádné „yesterday“. Po úpravě `themes/front-ww1/story.json` spustit `npm test` (90denní simulace hledá chyby).

## Reely z cloudu (bez vlastního PC)
Celý reel se vyrobí na GitHub Actions, workflow **`reel`** (`.github/workflows/reel.yml` → `tools/make-reel.sh`):
voiceover (edge-tts, en-GB-RyanNeural) → natočení scénáře v headless Chrome → zvuk → zmenšení pro IG →
**GitHub Release `media`** (videa NEJSOU v gitu, od 2026-11-12) → workflow `media` → GitHub Pages: `https://morgenster95.github.io/fronta/reel_<name>.mp4`
(video jde pustit v mobilu; tahle adresa slouží i k publikaci na IG).

Postup pro nový reel `<name>`:
1. Scénář `web/src/reel-<name>.js` (vzor `web/src/reel-day1.js`: kreslené scény + skuteční hráči ze soupisky) a jeho registrace v `web/src/reel.js`.
2. Texty voiceoveru: nový klíč v `SCRIPTS` v `marketing/story_vo.py` (`[začátek v s, věta]`, celková délka).
3. Zvuk: přidat `<name>` do `DRUMS` v `marketing/reel_audio.py` (začátek bubnů, tiché úseky, konec).
4. Spustit výrobu: commit souboru `marketing/reels/render.json` s obsahem `{"name": "<name>"}` do main
   (nebo Actions → reel → Run workflow, případně `gh workflow run reel -f name=<name>`). Trvá zhruba 10–20 min.
5. Video poslat uživateli ke kontrole (odkaz na Pages výše).
6. Až to uživatel **výslovně schválí**: přidat položku do `marketing/queue.json` (vzor: existující položky, `publishAt` v UTC).
   Smyčka ji publikuje v daný čas. Video delší než 60 s jde do IG Stories jen rozdělené (`type: "story"`).

## Stav a plán (aktualizuj při změnách)
- Den 1 války = 2026-11-09; každé ranní vydání (denní tah, Gazette, výsledky) je ve 13:00 UTC, večerní reel nebo post ve 23:00 UTC.
- **Závod o kóty:** kdo první naverbuje 100 vojáků, dobude kótu (teď Verdel Ridge, pak Hill 304…, `theme.race.objectives`). Výhra odemyká dělostřelectvo:
  3 dny bombardování poraženého. Do první dobyté kóty děla mlčí a texty o ostřelování se nepoužijí (`battle.gunsWords`).
- **Výpravy jsou VYPNUTÉ** (`theme.valley.enabled = false`, od 2026-11-10 na pokyn uživatele): výzva CHURCH z Dne 2 zrušena. Zapnout až s výslovným souhlasem uživatele.
  Dokud jsou vypnuté, příběhy se slovy `theme.valley.words` („raid“) se nepoužijí; stejně tak místa kót, o které se ještě nebojuje (`storyFor` v `engine/roster.js`).
- **Hlasování o stavbách** (post `vote-build-d2`, zveřejněn 2026-11-10 12:46 UTC, HOSPITAL / SANDBAGS po frakcích): vyhodnocení ve vydání Dne 3 (2026-11-11 13:00 UTC).
- **Fronta 2026-11-12:** `reel-ridge` (shrnutí Dne 3: vítěz Concord, hrdina s medailí, dialog, bombardování, hlas hráče, počty) vychází **12. 11. 10:00 UTC (11:00 CZ)**, `letters-1` posunut na **17:00 UTC**, `reel-howto` 23:00 UTC, `poster-concord` 13. 11. 23:00 UTC; `reel-sides` a `poster-hegemony` bez termínu. Post **FRONT COUNCIL** (`council-ridge`, nápady do komentářů, vyhrává nejvíc lajků, `node tools/council.mjs`) a `story-council` vyšly 11. 11. 22:19/22:29 UTC; hlasování FORTIFY/HOSPITAL zrušeno (`data/cancel-vote.json`).
- **Fronta po 12. 11. 15:00 UTC (rozhodnutí uživatele):** dnes už vychází jen `reel-rip` (18:00 UTC); `reel-howto` odloženo (bez termínu), plakáty `poster-hegemony`/`poster-concord` vyřazeny z fronty; `vote-orders-d4` (DUGOUTS/DOCTOR/AMMO) bez termínu, na pořadu je nejdřív vyhodnocení Rady fronty (`node tools/council.mjs`, lajky: Hegemonie BUNKERS 16, Concord ‚hold the ridge, MG a snipers‘ 10) po novinách 13. 11.
  Čeká na uživatele: vyhodnocení Rady fronty (navrženo 13. 11. po Gazette), nabídka dalšího hlasování, čas pro `reel-sides`.
  Z dřívějška: uživatel ověří kartu přihlášeného hráče (tlačítko „Request a transfer“ jen u vlastního vojáka).
- **Přání rolí z komentářů** (od 2026-11-09): komentář, který zmíní právě jednu roli („CONCORD medic“, „MG“), dá roli hned. Zdarma je jen první volba,
  další změny přes převelení na kartě. Lieutenant jen povýšením. Aliasy rolí: `theme.archetypes[].aliases`.
- **Odpovědi pod komentáři** (od 2026-11-09): ingest čte i odpovědi (HEGEMONY v odpovědi pod cizím komentářem narukuje). Komentáře našeho účtu
  se přeskakují, jinak by bot narukoval sám sebe. Bot odpovídá do vlákna nadřazeného komentáře. Podrobnosti: `docs/STATUS.md`, „Doplněno večer 9. 11.“.
- **Post při výhře závodu + hlasování frakcí** (od 2026-11-09): položka `victory-ridge` ve frontě má `trigger: {race: "ridge"}` a dvě varianty
  (karusel `marketing/promo/victory_ridge_<frakce>_1/2.jpg`, kreslí `marketing/make_victory.py`). Smyčka ji zveřejní do ~5 min od dobytí kóty
  (`ingest/triggers.mjs`, doplní jméno hrdiny bez zavináče, počty, další kótu) a pod postem otevře hlasování `perFaction`: každá strana volí sama za sebe,
  hlas se páruje s vojákem podle IG ID (frakci psát netřeba), bez vojáka se nepočítá (bot poradí narukovat). Teď je v položce FORTIFY (`build: sandbags`) /
  HOSPITAL (`build: dugout`); nabídka se má změnit. Možnost může stavět (`build`) nebo vydat dočasný rozkaz (`danger`, `recover`, `days`; `engine/orders.js`).
  Vyhodnotí ranní vydání, nejdřív 8 h po otevření (`minHours`).
  Pro další kóty: nová položka s `trigger.race` = id kóty (`theme.race.objectives`) a grafika `python marketing/make_victory.py <id> "<Název>" "<Další>"`.
  1. snímek kreslí `marketing/victory_scene.py` (kopec s praporem, v popředí sprity ze zákopů ve hře, pytle stejného vzoru jako ve hře).
- **Denní boj, medici, nemocnice, drát** (`docs/BATTLE.md`, `engine/battle.js`, vyvážení v12 od 12. 11., `docs/MECHANICS.md`): ~60 % smrtí způsobí chybějící lůžko, nosítka nebo medik, zbytek smrt na místě (kulka 20 %, odstřelovač 35 %, přímý zásah granátem 50 % kritických).
  Potřeba práce mediků: lehce raněný 1, těžce a kriticky raněný 2, na lůžku 0. Obvaziště má 2 lůžka a 6 nosítek; nemocnice (dugout, jen hlasováním) 4 lůžka
  a dalších 4 nosítka za každou. Bombardování po výhře v závodě: 30 % úseků poraženého (aspoň 4) denně, 3 dny, zásah 50 %. Palba hráčů: puškař 17 %, kulomet 26 %, odstřelovač 30 % denně (~0,85 / 1,4 / 1,65 zásahu za týden), nasycení `roles.saturation`. Denní mez: aspoň 1 raněný na 80 vojáků, pod granáty nejvýš 30 na 80. Nosítka +1 za medika, medik práce 2.
  Podpůrné role působí podle poměru (`roles.*.covers`), každý voják role má smysl a nikdo není nezranitelný.
  Role a čísla `docs/COMBAT_ROLES.md`. Převzatí hráči nejsou chránění. Nanečisto: `node tools/sim-battle.mjs --kpi`, náhled vydání `node tools/preview-tick.mjs`.
- **Hlasování je vždy jen jedno** (od 2026-11-11): post s `vote`, který vyjde při běžícím hlasování, ho nepřepíše; počká (`votePending` ve frontě)
  a otevře se po vyhodnocení (`ingest/triggers.mjs`, `ingest/publish.mjs`). Hlasy napsané dřív se dopočítají (`lateVote`), heslo platí i v jednotném čísle.
- **Hlasy fronty** (od 2026-11-10): komentáře se 6+ slovy pod hlasováním a pod posty s `voices: true` se ukládají do `data/voices.json`
  (výběr nejlepších do reelu, vždy ke schválení uživatelem). **Dopisový post „Letters from the front“** (`letters-1`, `marketing/make_letters.py`, obrázek `letters_1.jpg` 1080×1350) je od 2026-11-11 večer znovu ve frontě **bez termínu** (uživatel ho chce mít připravený). Zveřejnit až s časem od uživatele (`publishAt`).
- **Nemocnice na mapě** (od 2026-11-10): postavená nemocnice = velký dugout za zálohami (`dugoutArt` v `web/src/hospital.js`), jen když je ve stavu hry
  (`state.battle.sides[f].built.dugout`, staví jen vyhodnocené hlasování). Bombardování poraženého je na webu vidět už v den dobytí kóty.
- **Publikace hlídá verzi souboru** (od 2026-11-11): položka vyjde, až je soubor na GitHub Pages (u obrázků v repu i stejné velikosti; videa v repu nejsou, leží v Release `media`).
- **Další na řadě (domluvený návrh, zatím nepostavený):** změny terénu,
  hlášení se jmény skutečných hráčů. Výměna zajatců jako společná událost.
