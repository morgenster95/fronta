# MUD & IRON (repo `fronta`): pokyny pro Claude

Tenhle soubor čte Claude Code i v cloudu (aplikace Claude v mobilu, claude.ai/code), kde není paměť z domácího PC.
Proto tu je všechno, co je potřeba k práci. Podrobnosti: `docs/STATUS.md` (co je teď ve hře), `docs/BATTLE.md` a `docs/COMBAT_ROLES.md` (boj), `docs/ONBOARDING.md` (rekruti a provoz),
`docs/SCHEDULE.md` (rytmus dne), `docs/MAP_MISSIONS.md` (výpravy, vypnuté), **`docs/MECHANICS.md` (deník domluvených mechanik)**. `docs/DESIGN.md` je původní návrh, neaktualizuje se.

## ROZPRACOVÁNO: doména a škálování na tisíce hráčů (domluveno 2026-11-11, řešit příště)
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
- Repo je **veřejné**: žádné tajné údaje, e-maily ani tokeny do commitů.
- **Zveřejněná videa v repu nezůstávají:** `ingest/publish.mjs` je hodinu po publikaci smaže z `marketing/promo/` (smyčka smazání commitne).
  Uživatel chce videa mít u sebe: každé hotové video mu pošli ke stažení (nebo odkaz na GitHub Pages) ještě před publikací.
- Hra běží naostro: https://mudandiron.web.app, IG @mudandiron. Automatika = smyčka `.github/workflows/front-loop.yml` (`tools/loop.sh`)
  každých ~5 min: stáhne komentáře, odpoví, publikuje frontu `marketing/queue.json`, denní tah v 13:00 UTC, nasadí web.
  Smyčka commituje do main → **před pushem vždy `git pull --rebase`**; `data/state.json` ručně neupravuj.
- **Jeden zápis za den** (od 2026-11-11): každý živý voják má každý den právě jeden zápis do deníku (`theme.storyShare = 1`; dřív dostával zápis jen ~1× za 4 dny, proto byly v deníku mezery). Zápisy téhož dne se spojují (`addEntry` v `engine/soldier.js`), raněný a nezvěstný má krátký denní zápis (`wardBed/wardStretcher/wardTrench/wardLight/wardMissing`). Starší zápisy se nepřepisovaly (mezery z Dne 2–3 zůstanou).
  Pozor na růst: ~220 B na vojáka a den ve `state.json`; při tisících hráčů a týdnech provozu je potřeba zápisy přesunout mimo `state.json` (hlídat velikost souboru, ~15 MB je hranice pro smyčku).
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
`marketing/promo/reel_<name>.mp4` (commit do main) → GitHub Pages: `https://morgenster95.github.io/fronta/reel_<name>.mp4`
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
- **Čeká na uživatele:** nová nabídka hlasování po dobytí kóty (místo FORTIFY / HOSPITAL, návrhy z 2026-11-11 ke schválení); čas pro `reel-sides` a pro `letters-1` (ve frontě bez termínu).
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
- **Publikace hlídá verzi souboru** (od 2026-11-11): položka vyjde, až je na GitHub Pages soubor stejné velikosti jako v repu (po novém renderu).
- **Další na řadě (domluvený návrh, zatím nepostavený):** změny terénu,
  hlášení se jmény skutečných hráčů. Výměna zajatců jako společná událost.
