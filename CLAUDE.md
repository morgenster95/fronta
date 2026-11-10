# MUD & IRON (repo `fronta`): pokyny pro Claude

Tenhle soubor čte Claude Code i v cloudu (aplikace Claude v mobilu, claude.ai/code), kde není paměť z domácího PC.
Proto tu je všechno, co je potřeba k práci. Podrobnosti: `docs/STATUS.md`, `docs/ONBOARDING.md`, `docs/SCHEDULE.md`, `docs/MAP_MISSIONS.md`.

## Pravidla
- **Odpovídej česky.** Texty ve hře a na Instagramu jsou anglicky (publikum USA/UK, ne Praha).
- **Jen zdarma:** žádné placené služby, Firebase Blaze, Cloud Functions ani placená API. Firebase je na Spark, média na GitHub Pages.
- **Nic nepublikuj na Instagram bez výslovného souhlasu uživatele** (reel, story, post). Tokeny nikdy nezadávej ani nevypisuj.
- Repo je **veřejné**: žádné tajné údaje, e-maily ani tokeny do commitů.
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
- Den 1 války = 2026-11-09; každé ranní vydání (denní tah, Gazette, výsledky) je ve 13:00 UTC, večerní reel nebo post ve 23:00 UTC.
- **Výpravy:** první se vyhlásí s Dnem 2 (2026-11-10 13:00 UTC): kostel, heslo **CHURCH**, 5 na stranu, přihlášky se uzavírají Dnem 3 ve 13:00 UTC.
- **TODO 2026-11-10:**
  - Raid reel AŽ PO vyhlášení ve 13:00 UTC: mapa údolí s obrázky míst, detail kostela Saint-Ash, výhoda za dobytí, heslo CHURCH,
    5 na stranu, jak bitva funguje (role kulometčík, zdravotník, kuchař). Publikovat co nejdřív odpoledne, uživatel publikaci schvaluje.
    Zvážit posunutí `reel-sides` (ve frontě na 10. 11. 23:00 UTC) na později.
  - Ověřit tlačítko Volunteer na webu: po testu uživatele hledat v logu smyčky `⚑ výprava (web) @hodnepijumaloctu: ok`.
  - Uživatel ověří kartu přihlášeného hráče (tlačítko „Request a transfer“ jen u vlastního vojáka).
- **Přání rolí z komentářů** (od 2026-11-09): komentář, který zmíní právě jednu roli („CONCORD medic“, „MG“), dá roli hned. Zdarma je jen první volba,
  další změny přes převelení na kartě. Lieutenant jen povýšením. Aliasy rolí: `theme.archetypes[].aliases`.
- **Odpovědi pod komentáři** (od 2026-11-09): ingest čte i odpovědi (HEGEMONY v odpovědi pod cizím komentářem narukuje). Komentáře našeho účtu
  se přeskakují, jinak by bot narukoval sám sebe. Bot odpovídá do vlákna nadřazeného komentáře. Podrobnosti: `docs/STATUS.md`, „Doplněno večer 9. 11.“.
- **Post při výhře závodu + hlasování frakcí** (od 2026-11-09): položka `victory-ridge` ve frontě má `trigger: {race: "ridge"}` a dvě varianty
  (karusel `marketing/promo/victory_ridge_<frakce>_1/2.jpg`, kreslí `marketing/make_victory.py`). Smyčka ji zveřejní do ~5 min od dobytí kóty
  (`ingest/triggers.mjs`, doplní @hrdinu, počty, další kótu) a pod postem otevře hlasování `perFaction`: každá strana volí vlastní rozkaz
  FORTIFY (nebezpečí ×0,7 na 3 dny) / HOSPITAL (uzdravení 0,6 na 3 dny), hlas se páruje s vojákem podle IG ID (frakci psát netřeba),
  bez vojáka se nepočítá (bot poradí narukovat). Vyhodnotí ranní vydání, nejdřív 8 h po otevření (`minHours`). Rozkazy: `engine/orders.js`, `state.orders`.
  Pro další kóty: nová položka s `trigger.race` = id kóty (`theme.race.objectives`) a grafika `python marketing/make_victory.py <id> "<Název>" "<Další>"`.
  1. snímek kreslí `marketing/victory_scene.py` (kopec s praporem, v popředí sprity ze zákopů ve hře, pytle stejného vzoru jako ve hře).
- **Denní boj, medici, nemocnice, drát** (`docs/BATTLE.md`, `engine/battle.js`): zásah sám nezabíjí, zabije chybějící lůžko nebo medik.
  Každý raněný potřebuje 2 mediky; těžce/kriticky ranění lůžko (obvaziště 2, nemocnice = jediný dugout se 4 lůžky, staví se jen hlasováním).
  Bombardování po výhře v závodě: 2 sektory poraženého denně, 3 dny. **Nasazeno 2026-11-10** (vyvážení v5, poprvé v tahu 13:00 UTC); podrobná pravidla `docs/COMBAT_ROLES.md`.
  Převzatí hráči nejsou chránění. Vyzkoušení nanečisto: `node tools/sim-battle.mjs 14` (nic neukládá).
- **Další na řadě (domluvený návrh, zatím nepostavený):** změny terénu,
  hlášení se jmény skutečných hráčů. Výměna zajatců jako společná událost.
