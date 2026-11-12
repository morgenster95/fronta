# MUD & IRON: průzkum a návrh, jak hru posunout (12. 11. 2026)

_Zadání uživatele: detailní průzkum podobných her, jak hru udělat zajímavější, **ovládání primárně přes Instagram a na webu minimum**; rozpracovat (1) dopisy jako „buff“ na přežití, (2) soutěž propagandistických plakátů „Art of War“ s titulem pro vítěze, (3) držení pozic / noční výpravy bez konce hry._
_Všechno níže je **NÁVRH**, nic nenasazeno. Čísla z našich simulací jsou na skutečném stavu (Den 4, 266 vojáků)._

---

## 0. Kde jsme (fakta z dat)

- **266 vojáků** (Hegemonie 136, Concord 130), **96 převzatých** (36 %), hra běží 4 dny.
- Co hráče opravdu rozhýbalo: **Rada fronty** (47 nápadů, nejlepší 16 a 11 lajků), **hlasování o stavbách** (60 hlasů), hrdina kóty, rodokmen po smrti, citáty z komentářů ve videu.
- Co je technicky hotové a nepoužité: **výpravy a mapa údolí** (vypnuté), útok „Over the top“ (jen návrh), zajatci (stav je, události ne), rozkazy z hlasování (`shell`, `fire`, `heal`, `die`, `mine`, `guns`…).
- **Instagram je jediný ovládací kanál, který hráči reálně používají** (komentář = přihláška, role, hlas, nápad). Web je prohlížeč (karta, mapa, noviny) + přihlášení přes Google jen pro převzetí a převelení.

---

## 1. Co říkají podobné hry (a co z toho plyne pro nás)

### Foxhole: válka, která musí skončit
Persistentní válka dvou frakcí: výhra = ovládnutí dostatku území, pak se svět resetuje a začíná další válka; vše (munice, ošetření, doprava) vyrábějí hráči a válka běží i offline ([Foxhole, Wikipedia](https://en.wikipedia.org/wiki/Foxhole_(video_game)), [mmogames](https://www.mmogames.com/game/foxhole)).
Slavné války jsou ty s dramatickým zvratem nebo měsíčním patem ([foxhole.wiki.gg](https://foxhole.wiki.gg/wiki/Foxhole)); kritika zní, že se kontrola regionu každou válku opakuje, až jedna strana druhou převálcuje. Komentář o ~70denní „věčné válce“ popisuje, že vývojáři **změnili podmínku konce uprostřed války** a komunita se rozdělila na úlevu a obavu z měnění pravidel za chodu ([finalboss.io](https://finalboss.io/foxholes-70-day-forever-war-ends-after-9), sekundární zdroj, ověřit).
**Plyne:** (a) konec/„sezónu“ musíme **definovat předem a oznámit**, ne měnit za chodu; (b) po konci se resetuje mapa, **zůstávají hráči, rody, medaile a tituly**; (c) pat řešit dopředu (rozpad prahu, viz Neptune's Pride).

### Neptune's Pride: konec přes polovinu hvězd, ale vítěz uteče
Výhra = první, kdo drží polovinu hvězd; kontroluje se v „galaktickém cyklu“. Hráči si stěžovali na **runaway** (vítěz je jasný dávno před koncem) a na pat; v roce 2024 přidali **„Stars for Victory Decay“** (práh výhry denně klesá, aby se tahy uzavíraly) ([np.ironhelmet.com](https://np.ironhelmet.com/html/help/new_features.html), [forum](https://forum.ironhelmet.com/t/unbalanced-gameplay/5913), [bit-tech](https://bit-tech.net/reviews/gaming/pc/neptune-s-pride-the-last-war-diary/2)).
Diplomacie (zprávy mezi hráči) je podle rozboru srdce hry ([Game Developer](https://www.gamedeveloper.com/game-platforms/analysis-the-icy-grandeur-of-i-neptune-s-pride-i-)).
**Plyne:** sezóna s **klesajícím prahem výhry** + **mechanika dohánění** (slabší strana má bonus), aby nevznikl runaway; a „diplomacie“ je pro nás **Rada fronty a nápady v komentářích** (příměří, výměny zajatců, vánoční příměří).

### Twitch Plays Pokémon: dav ovládá hru, když má jasná pravidla
Režim **Democracy** (hlasuje se o příkazu, vyhrává nejčastější) vs **Anarchy**, přepínání mělo **asymetrický práh** (do demokracie nadpoloviční většina, zpět jednoduchá) a ukazatel na obrazovce ([Wikipedia](https://en.wikipedia.org/wiki/Twitch_Plays_Pok%C3%A9mon), [Diplomatic Courier](https://diplomaticourier.com/posts/anarchy-vs-democracy-the-politics-of-twitch-plays-pokemon)).
Analýza: **fixní pravidla (bot) nastavil tvůrce**, ne dav, a proto hra dojela do konce ([Medium](https://medium.com/web3-australia/lessons-in-decentralised-from-governance-from-twitch-plays-pokemon-e24fefe93185)); lidé nemají „reálný podíl“ na výsledku ([FEE](https://fee.org/?p=44695)); protest (spam „start9“) rozbil hru.
**Plyne:** hlasování o **malém počtu předem daných možností** (naše DUGOUTS/DOCTOR/AMMO) funguje, volný vstup potřebuje **kuratora** (Rada fronty: lajky + náš výběr); každé hlasování musí mít **viditelný dopad** (kryty a lékař na mapě), jinak hráči nemají „podíl“.

### Reddit r/place: koalice, rivalita, příměří, otevřené nástroje
Studie tří ročníků: engagement, spolupráce a soutěž, hráči se musí potýkat s nejistotou o síle koalic ([arXiv](https://arxiv.org/html/2408.13236v2)); malé komunity bez spojenců nic neudrží ([EA Forum post-mortem](https://forum.effectivealtruism.org/posts/ngKXvDCtxEjSpQ9GJ/ea-on-r-place-an-art-project-post-mortem-1)); fandomy uzavíraly **příměří** ([Nintendo Life](https://www.nintendolife.com/features/soapbox-the-video-game-camaraderie-on-rplace-is-a-lesson-about-community)); kritika: otevřené plátno vyhrává ten, kdo se koordinuje nejrychleji ([The Gazelle](https://thegazelle.org/issue/227/reddit--not-collaborative-art)).
**Plyne:** identita stran (Hegemonie/Concord) a **příměří jako událost** (vánoční příměří 24.–25. 12. je historicky i prakticky skvělé), koordinace přes komentáře musí být **jednoslovná** (vyhraje ten, kdo je víc a organizovanější = chtěný efekt), ale s ochranou před jedním hlasitým uživatelem (1 hlas = 1 voják).

### Instagram jako herní rozhraní (technické limity, které rozhodují o návrhu)
- **Soukromá odpověď na komentář:** jen **jedna** na komentář, do **7 dnů**, další zprávy jen když člověk odpoví (otevře 24h okno); limit **~750 volání/hod** na účet pro odpovědi pod posty a reely ([Meta: Private Replies](https://developers.facebook.com/documentation/business-messaging/instagram-messaging/features/private-replies), [Planoly](https://www.planoly.com/blog/instagram-24-hour-messaging-window-explained), [CreatorFlow](https://creatorflow.so/help/troubleshooting/rate-limits); čísla ověřit na oficiální stránce Meta).
- **Hry na Instagramu** jsou dnes hlavně ankety, kvízy, body za komentáře ([SocialBu](https://socialbu.com/blog/instagram-story-games-ideas/), [Chatplace](https://blog.chatplace.io/en/instagram-gamification-for-engagement/)); skutečná hra, kde je vlákno komentářů herním polem, v průzkumu nevyšla (marketingové zdroje). **Jsme tedy v nezmapovaném území**, takže si pravidla musíme sami hlídat.
**Plyne:** zpětná vazba má jít hlavně přes **noviny, story a reely** (zdarma, hromadně), odpovědi pod komentáři jen u klíčových událostí (nábor, hrdina, smrt); povely musí být **krátká slova v komentáři**; DM nepoužívat jako ovládání.

### Soutěže o fan art: tituly a kosmetika, spor o práva
Vývojáři dávají vítězům **titul, kosmetiku nebo zařazení do hry** (Descendants: titul „Honorable Art“; Dead by Daylight: z designu se stal kosmetický předmět; Lost Ark: loading screen; Mines of Dalarnia: vítězné umění jako brnění) ([DevTrackers](https://devtrackers.gg/deadbydaylight/p/57dfba41-community-third-anniversary-contest-winners), [Lost Ark](https://playlostark.com/en-us/news/articles/valkyrie-loading-screen-contest-winners-announced), [Alcast](https://tfd.alcasthq.com/news/2025-skin-contest-finals-winners-announcement)).
Opakovaná kritika: **malé ceny a nejasná práva** k přihláškám (Overwatch) ([Plagiarism Today](https://www.plagiarismtoday.com/2026/10/19/what-went-wrong-with-blizzards-fan-contest/), [GGRecon](https://cms.ggrecon.com/articles/overwatch-league-under-pressure-after-fanart-competition-accused-of-lowballing-artists)).
**Plyne:** vítěz dostane **titul + plakát ve hře + zveřejnění s uvedením autora**, a podmínky (licence, kredit, žádné cizí IP) musí být **předem v popisku**.

### Crusader Kings: dynastie je příběh, ne postava
Smrt postavy přepne hru na dědice, hra končí, když se přeruší linie; osobnostní rysy a rodina vytvářejí příběh ([Paradox dev diary](https://forum.paradoxplaza.com/forum/threads/ck3-dev-diary-1-dynasties-houses.1270519/page-2), [HighGroundGaming](https://www.highgroundgaming.com/ck3-succession-guide/)).
**Plyne:** náš rodokmen už dělá totéž (nástupce hned v noci, generace, deník rodu). Posílit: **rysy rodu** (např. „House of Yoollyfox: 2 generace kuchařů“), titul rodu a **příběh přenesený na nástupce** (dopis padlého).

---

## 2. Návrh: Instagram jako hlavní ovládání, web minimum

**Princip:** každý povel = **jedno slovo v komentáři pod postem dne** (stejně jako dnes HEGEMONY/CONCORD, role, hlasování). Web zůstane **čtecí vrstvou** (mapa, karta, noviny, rodokmen) a **jedním tlačítkem**, které potřebuje přihlášení.

| Povel (komentář) | Význam | Kdy platí |
|---|---|---|
| `CONCORD`/`HEGEMONY` + role | nábor, role | vždy |
| hlasovací slovo (např. `DUGOUTS`) | rozkaz dne | když běží hlasování |
| `ATTACK <místo>` / `DEFEND <místo>` | noční výprava: kam útočíme / kdo brání | v „operačním“ postu večer |
| `LETTER` / `LETTER @kamarád` | dopis sobě / jinému (viz 3) | v postu „Letters“ |
| `IDEA <text>` | nápad do Rady fronty | pod postem Rady |
| obrázek / odkaz | návrh plakátu (viz 4) | pod postem „Art of War“ |

**Pravidla, aby to Instagram unesl:** 1 hlas = 1 voják (podle IG ID); bot odpovídá jen na **důležité** události (nábor, hrdina, smrt), všechno ostatní jde hromadně přes noviny, story a reely; limit odpovědí (viz výše) se hlídá (fronta odpovědí s prioritou).
**Web:** přibude jen **kartička „Dopis“** (viz 3) a **mapa pozic** (jen čtení). Všechno ostatní v Instagramu.

---

## 3. Dopisy jako buff na přežití

### Návrh
- **Odeslání:** na kartě vojáka tlačítko „Send a letter“ (jediné nové tlačítko) a/nebo komentář `LETTER`. Každý hráč má **2 dopisy za den: 1 sobě (psaní domů), 1 jinému vojákovi své strany** (ne sobě; kamarádovi nebo komukoli, komu fandí).
- **Účinek na příjemce na následující večer:** −10 % zásahů a −10 % úmrtnosti za každý přijatý dopis, **strop 3 dopisy** (−30 %). Dopis padlého se nepočítá, dopis od cizí strany jen příběhově (příměří, bez buffu).
- **Dopis je také příběh:** text (max ~140 znaků, volitelný) se zapíše do deníku příjemce a odesílatele, filtruje se (zakázaná slova), nejlepší se čtou v reelech. Bez textu se použije jedna z krátkých šablon („Hold on. Mother sends her love.“).
- **Proti zneužití:** odesílatel musí mít živého vojáka; jeden odesílatel dá jednomu příjemci max 1 dopis denně; strop 3 dopisů; efekt jen na 1 noc; vlastní dopis nemá vlastní buff nad jeden („psaní domů“ → +morálka, ne další 10 %).

### Co by to udělalo (simulace, nejhorší případ: všichni vojáci mají dopisy)
| Dopisů na vojáka | Hegemonie (padlí/ranění za 3 dny) | Concord |
|---|---|---|
| 0 | 7,9 / 60 | 2,6 / 33 |
| 1 (−10 %) | 6,7 / 56 | 2,5 / 30 |
| 2 (−20 %) | 5,5 / 50 | 2,3 / 28 |
| 3 (−30 %) | 4,7 / 45 | 2,1 / 25 |
Při plném využití by byl dopis jako rozkaz DUGOUTS pro všechny; proto strop 3 a efekt jen na noc a jen na příjemce. Skutečné využití bude nižší (část hráčů nehraje denně). Dopis je navíc **nová sociální vazba** (hráč se dívá na své kamarády), což je přesně to, co hráči chtějí.
**Napojení na engine:** příjemce dostane `letters` (počet), battleTick ho přepočte na `shell/exposed/die` násobek pro jednoho vojáka (nově „per voják“, dnes jsou rozkazy per strana).

---

## 4. „Art of War“ / propagandistická válka

### Průběh
1. **Post „Propaganda War“** (grafika ze hry, 4:5, + story): „Design a leaflet for your side. Post it in the comments. Most liked leaflet of each side gets printed.“ 48 hodin.
2. Hráči posílají **plakáty (obrázky generované nebo kreslené)** za svou stranu (podle vojáka). Bot sbírá komentáře a lajky (už umíme `like_count` do `voices.json`).
3. Po 48 h **vítěz každé strany**: titul **„Propagandist“** (na kartě + v rodokmenu), medaile, plakát se zveřejní jako **náš post** s uvedením autora a **objeví se ve hře jako rekvizita na stěně zákopu** té strany (stejný princip jako kryty a lékař: `orders-fx`).
4. **Dopad na hru** (jednoduchý): plakát vítězné strany dá té straně na 24 hodin „Propaganda day“ (dopisy se počítají dvakrát nebo +5 % nových rekrutů, k rozhodnutí).

### Technické riziko (ověřit hned na prvním příkladu)
Instagram Graph API u komentářů vrací **text, ne přiložený obrázek**. Že lidé do komentářů vkládají obrázky, jsem **nemohl ověřit**; potřebuju konkrétní komentář s obrázkem a otestovat, jestli ho API ukáže (pole `media_url` u komentáře existuje jen u některých typů).
**Záložní cesty:** (a) ať plakát dají na **svůj profil/story s označením @mudandiron** (zmínky a tagy API ukazují), (b) odkaz na obrázek v komentáři (imgur…), (c) kurátor (vy) vybere ručně ze snímků komentářů; bot jen spočítá lajky.

### Podmínky (z průzkumu soutěží)
V popisku předem: autor zůstává autorem, vítězný plakát smíme zveřejnit **s uvedením autora**, žádná cizí IP (loga, známé postavy), povolená je i AI grafika, ale ať je vlastní prací přihlášeného. Žádné peníze, odměna je titul a plakát ve hře (stejný model jako Descendants nebo Lost Ark).

---

## 5. Držení pozic, noční výpravy a „kdo vede“ (bez konce hry)

Z průzkumu: konec hry musí být **definovaný dopředu**, nesmí vzniknout runaway ani pat, a po konci se resetuje svět, ne hráči.
- **Sezóna = 14 dní („Campaign“).** Mapa (kóty + místa údolí) má majitele a opevnění. **Vedení = body za držené pozice a dny držení.** Na konci sezóny oslava (reel „Season ended“, titul „Victor of Campaign 1“ pro stranu i pro hrdiny), mapa se vrátí do výchozího stavu, **rody, medaile, tituly a hráči zůstávají**.
- **Proti runaway:** prahy se každý den snižují (podle Neptune's Pride), slabší strana má bonus (levnější opevnění, +obrana).
- **Noční výpravy (Instagram):** večerní post „Where do we strike tonight?“ (`ATTACK <místo>`), druhá strana `DEFEND <místo>`. **Všichni, kdo se přihlásí, jdou** (žádný strop 5), střet se počítá hromadně stejnými výpočty jako denní boj (role, krytí, opevnění), ztráty včetně smrti s nástupcem.
- **Co se na výpravě získává:** pozice a body vedení; **zajatci** (společná událost „výměna zajatců“); **kořist** (zabavená munice nebo léky = jeden z rozkazů AMMO/DOCTOR na pár dní); **zpravodajství** (dobytá pozorovatelna prozradí cíl soupeře); XP, medaile Raider's Cross, titul „Hero of …“.
- **Příměří jako událost** (vánoční příměří 24.–25. 12., nebo kdykoli na návrh z Rady fronty, jako byl nápad od @gunnar_durham2325): obě strany hlasují, při shodě jeden den bez střelby, v novinách „Football on the wire“.

---

## 6. Další nápady, které z průzkumu a dat vycházejí

1. **Válečný zpravodaj** (titul): kdo napíše nejlepší hlášení z fronty (komentář) do novin, dostane titul a jeho text vyjde v Gazette (stejný model jako Rada fronty; texty už sbíráme do `voices.json`).
2. **Rodinné rysy:** „House of Yoollyfox: 2 generace kuchařů“ jako badge (už máme `houseBadges`), nástupce zdědí část příběhu.
3. **Týdenní žebříčky na Instagramu** (story): kdo je nejlepší střelec, kdo ošetřil nejvíc, který rod je nejdéle na frontě (data už máme, `leaderboards`).
4. **Oznámení konce sezóny v novinách předem** (Foxhole: neměnit konec uprostřed).
5. **Vzkazy přes drát** (cizí strana): jednou za týden jeden dopis „přes frontu“ jako příběhová událost (bez buffu).

---

## 7. Doporučené pořadí

| # | Krok | Odhad | Proč teď |
|---|---|---|---|
| 1 | **Dopisy** (karta + `LETTER` + buff per voják + zápisy) | 1 večer + simulace | nová sociální vazba, malý kód, hodně hráčů už o buff žádalo |
| 2 | **Propaganda War post** (nejdřív ručně vybírané plakáty, sběr lajků; ověřit obrázky v komentářích) | 1/2 večera + test | hotový vzor (Rada fronty), tvoří obsah pro reely |
| 3 | **Mapa pozic + vedení** (jen čtení, majitelé, body) | 1 večer | odpověď na „kdo vede“ bez výprav |
| 4 | **Noční výpravy hromadně** (útok/obrana, ztráty, kořist) | 2–3 večery | největší; až po 1–3 |
| 5 | **Sezóny a reset, příměří** | 1 večer | až bude mapa a výpravy |

## 8. Otevřené otázky pro uživatele
1. Dopisy: strop 3 a buff −10 % za dopis je správný rozsah? Mají dopisy **psát hráči text** (s filtrem), nebo stačí šablony?
2. Plakáty: stačí „ručně vybrané“ z toho, co lidé pošlou (přes @tag a komentáře), než ověříme, jestli API ukáže obrázky v komentářích?
3. Sezóny: 14 dní, nebo jinak? A má vítěz sezóny něco víc než titul (třeba na příští sezónu bonus)?
4. Smrt na výpravách: ano (stejná pravidla jako jinde), nebo nižší šance?
5. Zapnout výpravy až po kroku 3 (mapa s vedením), nebo dřív?
