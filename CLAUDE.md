# MUD & IRON (repo `fronta`): pokyny pro Claude

Tenhle soubor čte Claude Code i v cloudu (aplikace Claude v mobilu, claude.ai/code), kde není paměť z domácího PC.
Proto tu je všechno, co je potřeba k práci. Podrobnosti: `docs/STATUS.md` (co je teď ve hře), `docs/BATTLE.md` a `docs/COMBAT_ROLES.md` (boj), `docs/ONBOARDING.md` (rekruti a provoz),
`docs/SCHEDULE.md` (rytmus dne), `docs/MAP_MISSIONS.md` (výpravy, vypnuté). `docs/DESIGN.md` je původní návrh, neaktualizuje se.

## Pravidla
- **Odpovídej česky.** Texty ve hře a na Instagramu jsou anglicky (publikum USA/UK, ne Praha).
- **Jen zdarma:** žádné placené služby, Firebase Blaze, Cloud Functions ani placená API. Firebase je na Spark, média na GitHub Pages.
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
- **Deníky jsou nedotknutelné:** zápisy vojáků (`s.record`), kronika (`state.chronicle`) a deník fronty se jen přidávají, nikdy se neořezávají,
  nepřepisují ani negenerují znovu. Nástupce pokračuje v deníku rodu. Web ukazuje posledních 40 zápisů, starší jsou v `records-old` (tlačítko na kartě).
- Před commitem `npm test` (musí projít). Commity do `main`, smyčka změny sama nasadí.
- Engine (`engine/`) je obecný, téma (`themes/front-ww1/`) je konkrétní hra. Ten rozdíl drž (stejný engine půjde použít pro jiná témata).
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
- **Větev `revize` (2026-11-11, čeká na vyzkoušení a sloučení uživatelem):** přehled v `docs/REVIZE.md`. Náhled s živými daty: workflow `preview`
  (https://mudandiron--revize-40p4cwxt.web.app, obnoví se každým pushem do větve). Do main slučovat jen s výslovným souhlasem uživatele.
  Co větev mění: role řízené tématem (`docs/ROLES.md`, schopnosti = klíče v `theme.battle.roles`, role za povýšení = `promotionOnly`), los nezvěstných všem stejně (`theme.fate`),
  hlas a strana podle textu komentáře, dny včetně dneška, atlas spritů (`npm run sprites` po každé změně PNG vojáků), editor spritů (`web/public/editor/`),
  průvodce do soukromých zpráv (`theme.dm`, `IG_SEND_DM=1`), nasazení jen při změně webu (`tools/site-sig.mjs`), upozornění na selhání tahu a publikace, testy na GitHubu.
- Den 1 války = 2026-11-09; každé ranní vydání (denní tah, Gazette, výsledky) je ve 13:00 UTC, večerní reel nebo post ve 23:00 UTC.
- **Závod o kóty:** kdo první naverbuje 100 vojáků, dobude kótu (teď Verdel Ridge, pak Hill 304…, `theme.race.objectives`). Výhra odemyká dělostřelectvo:
  3 dny bombardování poraženého. Do první dobyté kóty děla mlčí a texty o ostřelování se nepoužijí (`battle.gunsWords`).
- **Výpravy jsou VYPNUTÉ** (`theme.valley.enabled = false`, od 2026-11-10 na pokyn uživatele): výzva CHURCH z Dne 2 zrušena. Zapnout až s výslovným souhlasem uživatele.
  Dokud jsou vypnuté, příběhy se slovy `theme.valley.words` („raid“) se nepoužijí; stejně tak místa kót, o které se ještě nebojuje (`storyFor` v `engine/roster.js`).
- **Hlasování o stavbách** (post `vote-build-d2`, zveřejněn 2026-11-10 12:46 UTC, HOSPITAL / SANDBAGS po frakcích): vyhodnocení ve vydání Dne 3 (2026-11-11 13:00 UTC).
- **Čeká na uživatele:** nová nabídka hlasování po dobytí kóty (místo FORTIFY / HOSPITAL, návrhy z 2026-11-11 ke schválení); čas pro `reel-sides` (ve frontě bez termínu).
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
- **Denní boj, medici, nemocnice, drát** (`docs/BATTLE.md`, `engine/battle.js`, vyvážení v6): zásah sám nezabíjí, zabije chybějící lůžko, nosítka nebo medik.
  Potřeba práce mediků: lehce raněný 1, těžce a kriticky raněný 2, na lůžku 0. Obvaziště má 2 lůžka a 6 nosítek; nemocnice (dugout, jen hlasováním) 4 lůžka
  a dalších 4 nosítka za každou. Bombardování po výhře v závodě: 4 úseky poraženého denně, 3 dny. Denní mez: 1–3 nově ranění na stranu za klidu, nejvýš 8 pod granáty.
  Role a čísla `docs/COMBAT_ROLES.md`. Převzatí hráči nejsou chránění. Nanečisto: `node tools/sim-battle.mjs --kpi`, náhled vydání `node tools/preview-tick.mjs`.
- **Hlasování je vždy jen jedno** (od 2026-11-11): post s `vote`, který vyjde při běžícím hlasování, ho nepřepíše; počká (`votePending` ve frontě)
  a otevře se po vyhodnocení (`ingest/triggers.mjs`, `ingest/publish.mjs`). Hlasy napsané dřív se dopočítají (`lateVote`), heslo platí i v jednotném čísle.
- **Hlasy fronty** (od 2026-11-10): komentáře se 6+ slovy pod hlasováním a pod posty s `voices: true` se ukládají do `data/voices.json`
  (výběr nejlepších do reelu, vždy ke schválení uživatelem). **Dopisový post se dělat nebude** (zrušeno 2026-11-11, položka `letters-1` odstraněna).
- **Nemocnice na mapě** (od 2026-11-10): postavená nemocnice = velký dugout za zálohami (`dugoutArt` v `web/src/hospital.js`), jen když je ve stavu hry
  (`state.battle.sides[f].built.dugout`, staví jen vyhodnocené hlasování). Bombardování poraženého je na webu vidět už v den dobytí kóty.
- **Publikace hlídá verzi souboru** (od 2026-11-11): položka vyjde, až je na GitHub Pages soubor stejné velikosti jako v repu (po novém renderu).
- **Další na řadě (domluvený návrh, zatím nepostavený):** změny terénu,
  hlášení se jmény skutečných hráčů. Výměna zajatců jako společná událost.
