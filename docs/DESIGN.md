# FRONTA — návrh hry a řešení (pracovní název, v1, 8. 11. 2026)

_**Historický dokument:** původní návrh z 8. 11. 2026, neaktualizuje se. Co ve hře opravdu je: `docs/STATUS.md`, `docs/BATTLE.md`, `docs/COMBAT_ROLES.md`, `docs/SCHEDULE.md`._

Instagramová „živá hra“: kdo komentuje pod naším postem, narukuje a jeho vojáček se objeví na obří mapě zákopů
v ponurém (grimdark) světě inspirovaném 1. světovou válkou. Každý den se posune příběh, sledující hlasují v komentářích.
Jádro se navrhuje tak, aby šlo stejně udělat i v dalších tématech (viz kap. 7).

---

## 1. Jak to dělá vzor — Thaloria / Wyrmfell (zjištěno z jejich veřejného webu a datových souborů)

| Co | Jak to mají |
|---|---|
| Web | Statický web na Vercelu (`app.js`, vlastní engine `motor/*.js`, font Silkscreen), analytika PostHog. |
| Data světa | **Statické JSON soubory** `dados/moradores.json` (obyvatelé), `grupos.json` (cechy), `missoes.json` (mise, pověsti, hlasování). Generují je jejich Python skripty (`ferramentas/votos.py`) — poloruční provoz. |
| Kdo je ve vesnici | **Počet obyvatel = počet followerů** (`seguidores` 2 → 1086 → 1390 → 2556 za 4 dny). Jménem jsou jen ti, kdo **komentovali** pod Reelem; zbytek „žije v táboře“ jako anonymní postavičky. Pořadí komentáře určuje vzhled postavy. |
| Příběh | „Každý den je jeden Reel.“ Reel se renderuje ze stejného enginu (`day02/ep.js`). Nejlepší příběhy obyvatel dostanou scénu. Pověsti mají souřadnice na mapě. |
| Hlasování | V komentářích pod Reelem, sčítá skript. Cechy: „napiš jeho slovo do komentáře“; vůdce, který 7 dní nic nenapíše, odchází. Při 2000 obyvatelích se z vesnice stává město a volí starostu. |
| Převzetí postavy | Supabase: přihlášení přes Google (výslovně „ne v aplikaci Instagram“), vygeneruje se kód, ten člověk vloží **jako komentář** pod post → spáruje se IG účet s profilem. Pak si upraví kartu (příběh, barvy, mazlíček). |
| Peníze | Patron 4,99 $/měsíc (šatník, speciální mazlíčci). |

**Ponaučení:**
1. Nepotřebují znát konkrétní followery: počet bere jako populaci, jménem uvádí jen ty, kdo komentují.
2. Svět drží v jednoduchých statických datech a mění ho denní dávka. Je to levné, rychlé a škáluje.
3. Slabá místa: ruční sčítání a skripty, přihlašování přes Google (v aplikaci Instagramu nefunguje), párování kódem v komentáři.
   Tohle všechno uděláme automaticky (kap. 3).

## 2. Podobné úspěšné projekty a co si z nich vzít

- **Wyrmfell** — za 4 dny 2,5 tis. followerů. Funguje to, protože člověk vidí *sám sebe* ve světě a denní Reel mu dá důvod se vracet.
- **Stream Raiders, Leviathan: Streams of Legends, Despot's Game (Twitch integrace)** — diváci jsou armáda; přidávají se příkazem v chatu.
  Jednotku vlastní konkrétní divák a bojuje se v pravidelných kolech → **pravidelný rytmus + vlastnictví jednotky**.
- **r/place, Million Dollar Homepage** — jedna sdílená obří plocha, každý má svůj kousek → **„najdi mě na mapě“** je samo o sobě sdílitelný obsah.
- **Twitch Plays Pokémon** — kolektivní rozhodování z komentářů dělá komunitu a memy → hlasování musí mít viditelné následky.

## 3. Jak to bude fungovat s Instagramem (technická realita)

**Co Instagram API umí a co ne:**
- ❌ Seznam followerů API nedá nikdy. Dá jen **počet** followerů vlastního účtu.
- ✅ **Webhook `comments`** (profesionální IG účet + Meta aplikace, oprávnění `instagram_business_manage_comments`):
  každý komentář pod našimi posty/Reely přijde v reálném čase s ID uživatele, @jménem a textem.
- ✅ **Private Reply**: na komentář jde poslat **jednu** soukromou zprávu (do 7 dní od komentáře).
- ✅ Když uživatel do DM odpoví, **User Profile API** vrátí `is_user_follow_business` → **follow se dá ověřit**
  (jen po souhlasu = poté, co člověk napsal zprávu).
- ⚠️ Schvaluje se **naše aplikace, která komentáře automaticky čte**, ne to, jestli lidé komentují organicky. Aplikace ve vývojovém režimu
  (Standard Access) dostává webhooky jen od lidí s rolí v aplikaci (testerů). Pro všechny ostatní je potřeba **App Review (Advanced Access)**
  pro `instagram_business_manage_comments` a obvykle i ověření firmy, počítej s 1–3 týdny. Je to formalita (popis + video, jak data
  používáme), u čtení komentářů pod vlastními posty běžně projde.
- ✅ **Start bez schvalování:** dokumentace Mety (Comment moderation → Access levels): *Standard Access platí, pokud aplikace obsluhuje
  účty, které vlastníte nebo spravujete.* Náš vlastní IG účet tedy může číst komentáře pod svými posty hned:
  `GET /{media-id}/comments?fields=id,text,username,timestamp` (oprávnění `instagram_business_basic` + `instagram_business_manage_comments`).
  Backend se **každých 30–60 s zeptá** na komentáře u několika aktivních Reelů (mobilizační post, poslední denní Reel, post s kódy) → zpoždění do minuty.
  Nejspíš to tak dělají i kopie, které vznikly za týden. Webhooky (okamžitě, bez limitů dotazů) jsou až vylepšení po App Review.
- 🧪 První úkol vývoje (1 h): profesionální IG účet → Meta aplikace → token → dotaz výše. Ověřit, že `username` přichází i u cizích lidí.

**Doporučený tok „follow → voják“:**

```
1. Člověk dá follow a napíše pod připnutý Reel „Mobilizace“ slovo frakce: CONCORD nebo HEGEMONY
2. Webhook → backend: založí vojáka (jméno = @handle, vzhled = deterministicky z hashe IG ID),
   přidělí mu volné místo v sektoru frakce
3. Private Reply DM: „Vojíne @handle, jsi u 3. roty, sektor C-12. Najdi se: <odkaz>“ + tlačítko
4. Kdo na DM odpoví → ověříme follow (`is_user_follow_business`) → odznak „Ověřený“ + odemkne převzetí karty
5. Followeři, kteří nekomentovali, jsou „Záloha“ (anonymní vojáci v týlu, počet = followers − narukovaní), stejný trik jako Wyrmfell
```

**Převzetí postavy (rozhodnuto: Google):**
1. Voják vzniká automaticky z komentáře (jméno = @handle), převzetí je volitelné.
2. Na webu „Claim @handle“ → přihlášení Googlem. V prohlížeči uvnitř Instagramu Google přihlášení blokuje (`disallowed_useragent`),
   web to proto pozná podle user-agentu a ukáže „Otevřít v Safari/Chrome“ (stejně to řeší Wyrmfell).
3. **Důkaz, že @handle je opravdu tvůj:** web vygeneruje krátký kód (např. `ENLIST-7KQ2`) a člověk ho napíše jako komentář
   pod náš post. Komentář přijde stejnou cestou jako narukování a backend účty spáruje. Bez toho by si cizího vojáka mohl převzít kdokoli.
4. Doplněk: soukromá zpráva s jednorázovým odkazem (`signInWithCustomToken`) pro ty, komu Google nefunguje.

> ⚠️ Kdybychom později přidali přihlášení Googlem / `signInWithRedirect` a web jako PWA na ploše iPhonu:
> `authDomain` musí být **stejná doména, na které web běží**, a v Google Cloud Console (OAuth klient „Web client (auto created…)“)
> přidat `https://<doména>/__/auth/handler` do Authorized redirect URIs. **Nejdřív povolit adresu, pak nasadit**
> (jinak `400 redirect_uri_mismatch` pro všechny). Service worker: `navigateFallbackDenylist: [/^\/__\//]`.
> Google navíc v prohlížeči uvnitř Instagramu OAuth blokuje (`disallowed_useragent`). Proto je hlavní cestou odkaz z DM.

**Rychlý start bez vlastního App Review:** první týdny můžeme vést přes **ManyChat** (oficiální partner Mety:
automatická odpověď na komentář s klíčovým slovem + DM), který na každý záchyt pošle webhook našemu backendu.
Mezitím projdeme App Review s vlastní aplikací a ManyChat vypneme. Backend je v obou případech stejný.

**Hlasování:** komentáře pod denním Reelem s klíčovým slovem (např. `UTOK` / `DRZET`) chodí stejným webhookem
→ sčítají se automaticky (1 hlas na účet, platí poslední), výsledek se vyhodnotí v denním tahu.

## 4. Herní návrh

**Svět:** fiktivní, žádné skutečné státy ani symboly (kvůli moderaci Mety a politice). Nekonečná válka v blátě,
plynu a dešti. Ponurý tón, ale bez krutosti pro krutost: osudy, dopisy domů, kamarádství v zákopu.

**Frakce (start se dvěma, třetí lze přidat):**
| Frakce | Vzhled | Klíčové slovo |
|---|---|---|
| **The Concord** | khaki/olivové pláště, mělké ploché přilby, ovinovačky | `CONCORD` |
| **The Hegemony** | polní šeď, přilby „uhlák“, holinky, plynové masky | `HEGEMONY` |

**Voják (karta / „služební záznam“):** jméno (@handle + vygenerované válečné jméno), frakce, rota, sektor,
archetyp (střelec, kulometčík, ženista, zdravotník, spojka, ostřelovač, kaplan, důstojník), hodnost, vyznamenání,
zranění, „dopisy domů“, časová osa zápisů. Vzhled se odvodí z hashe IG ID (archetyp + varianta + barevné obměny) → stabilní a bez ruční práce.

**Denní tah (1 skutečný den = 1 den na frontě):**
1. Vyhodnotí se hlasování → globální událost (útok v sektoru C, plynový útok, příměří o Vánocích…).
2. Událost se rozpadne na sektory (posun linie, ztráty, hrdinové dne).
3. Generátor příběhů napíše zápisy: **každý den dostane zápis jen část vojáků** (rotace + přednost aktivním/ověřeným/čerstvě narukovaným).
   Každý se tak dočká zhruba jednou za pár dní a pořád je důvod se vracet.
4. Přepočítá se mapa (posun linií, krátery, trosky) → vygenerují se statická data sektorů.
5. Vyrenderuje se denní Reel (záběry z enginu) → publikace. Nejlepší osudy dne dostanou scénu.

**Jazyk:** angličtina (veškerý obsah hry, Reely, DM).

**Smrt → rodová linie + měsíční ofenzivy (doporučení):**
- **Rodokmen jako jádro.** Hráč nevlastní jednoho vojáka, ale **rod** (příjmení se odvodí z @handle, např. „House of Novak“).
  Když voják padne, nastoupí za něj člen rodiny (bratr, syn, sestra jako zdravotnice) a zdědí jeho medaile, dopisy a jednu vzpomínku
  ve vyprávění („carries his brother's watch“). Smrt tak není konec, ale nová kapitola. Rodokmen je sbírka, kterou člověk chce rozšiřovat
  a sdílet („my family has lost 3 men at Verdel Ridge“).
- **Smrt nepřichází z ničeho nic:** nejdřív zranění, poslední dopis, pak „killed in action“ jako silný sdílitelný moment
  (karta „Last letter home“ jako Story).
- **Aktivita chrání:** kdo se vrací (otevře kartu, hlasuje, komentuje), má vyšší šanci přežít. Neaktivní padají dřív, protože o ně stejně nepřicházíme.
  Odměňuje to vracení, ne trestá.
- **Měsíční ofenzivy jako sezóny:** každý měsíc jedna pojmenovaná ofenziva s cílem (dobýt hřeben, udržet město).
  Na konci vyhodnocení, vítězná frakce, mapa se částečně přestaví, medaile za ofenzivu. **Rody a vojáci pokračují**
  (sezóna neresetuje hráče, jen bojiště a příběhový oblouk). Pro Reely to dává jasnou dramaturgii: začátek, zlom, finále.
- Padlí zůstávají na **pomníku** (Memorial wall) se svým příběhem.

**Důvody vracet se:** nový zápis v záznamu, povýšení a medaile, „najdi mě“ a sdílení karty (story s odkazem),
posun fronty podle hlasování, milníky komunity (při 1 000 / 5 000 / 10 000 vojácích se fronta prodlouží o nový sektor nebo přijedou tanky),
rivalita frakcí (která drží víc území).

## 5. Mapa a vykreslení tisíců vojáků

**Měřítko (závazné pro všechnu grafiku): 1 m = 16 px, 1 dlaždice = 16 × 16 px = 1 × 1 m.**
- Voják: plátno 32 × 32, postava ~29 px (1,8 m). Tank Mk IV: 8 m → ~128 px. Zákop: 2 dlaždice šířka (2 m).
- Kapacita: voják potřebuje ~1,5 m zákopu. 1 km fronty se třemi liniemi (první, podpůrná, záložní) a cikcak trasou
  ≈ 4 km zákopu na stranu ≈ **~2 600 vojáků na frakci**.
- **Mapa roste po sektorech** (bloky 128 × 128 dlaždic = 128 × 128 m). Když se sektor zaplní, fronta se prodlouží o další.
  Růst followerů se tak promítá do mapy a dá se z toho udělat událost v příběhu.
- Startovní mapa: 8 sektorů podél fronty (1 024 × 384 dlaždic, 16 384 × 6 144 px) ≈ 5 000 vojáků. Další se přidávají podle potřeby.

**Vykreslení (web):** PixiJS v8 (WebGL)
- dlaždice po sektorových blocích (předrenderované textury), vykreslují se jen viditelné bloky,
- vojáci v jednom texturovém atlasu a dávkově (10 000+ sprite je pro Pixi v pohodě),
- **první pohled = přiblížené bojiště** (zoom 2–3×, plné postavy, animace, kouř, déšť). Kamera začne u nejživějšího sektoru,
  u nejnovějších rekrutů, nebo u hráčova vojáka, když přišel odkazem. Na začátku bude vojáků málo, takže přiblížení je výhoda.
  Oddálení na celou mapu je až volba, a později i přirozený efekt růstu („the front has grown“),
- **úrovně detailu**: zdálky je voják 2–3 px tečka v barvě frakce (jedna dávka), zblízka plný sprite s idle animací,
- „Najdi mě“: vyhledání @handle → kamera přeletí na vojáka, otevře se karta,
- data: rozmístění vojáků po sektorech jako statické JSON/binární soubory na CDN (přegenerují se v denním tahu
  nebo při narukování), detail karty se načte až po kliknutí.

## 6. Architektura

```
Instagram ──webhook──▶ [Ingest]  (Cloud Function: ověření podpisu, deduplikace)
                          │
                          ▼
                     [Firestore]  soldiers, sectors, votes, events, story_entries, ig_events (log)
                          │
      ┌───────────────────┼─────────────────────┬──────────────────────┐
      ▼                   ▼                     ▼                      ▼
 [Slot allocator]   [Daily tick] (Scheduler)  [Story engine]       [DM sender]
 místo v zákopu     hlasy → událost → mapa    Claude API, dávky    Private Reply / odkazy
                          │
                          ▼
                [Static build] sector JSON + atlas ──▶ Firebase Hosting / CDN ──▶ [Web viewer PixiJS]
                          │
                          ▼
                [Reel renderer] headless prohlížeč nahraje záběry z vieweru → MP4 → ruční/naplánovaná publikace
```

- **Firebase** (Hosting, Functions, Firestore, Auth s custom tokenem, Scheduler). S Firebase už máš zkušenosti a pro tuhle zátěž stačí.
- **Příběhy:** Claude API: levný model na hromadné zápisy, silnější na denní hlavní příběh a texty k Reelu.
  Každý voják má krátkou „paměť“ (shrnutí dosavadních zápisů), aby příběh držel.
- **Admin panel:** fronta schvalování (příběhy, hlasování, zákaz účtů), ruční události, náhled denního tahu před publikací.
- **Právní minimum:** zásady ochrany soukromí (GDPR), komentáře jsou veřejné, ale @jméno zobrazujeme jen narukovaným.
  Odhlášení slovem `DEZERCE`/`LEAVE` = smazání. Fiktivní frakce = žádné zakázané symboly.

## 7. Znovupoužitelnost pro další témata („engine + tematický balíček“)

Jádro je **nezávislé na tématu**. Téma je jen balíček:

```
themes/front-ww1/
  theme.json        frakce, klíčová slova, archetypy, hodnosti, názvy sektorů, milníky, texty DM
  story/bible.md    svět, tón, zakázaná témata, ukázky zápisů (systémový prompt)
  story/events.json tabulka událostí a jejich dopadů
  map/*.tmj         sektory (Tiled), sloty pro postavy (objektová vrstva)
  art/atlas.png+json  postavy, objekty, dlaždice (podle ART_BIBLE)
  audio/
```

Jiné téma (fantasy vesnice, vesmírná stanice, pirátský přístav…) = nový balíček, stejný backend, viewer i IG napojení.
Pravidla měřítka a tvorby assetů (`docs/PIXELLAB_BRIEF.md`) se jen převezmou s jinou paletou.

## 8. Plán

| Fáze | Obsah | Výstup |
|---|---|---|
| 0 — teď | art bible, testovací assety (hotovo: viz `art/pixellab/test01`), návrh | tento dokument |
| 1 | prototyp vieweru: 1 sektor, 5 000 falešných vojáků, LOD, „najdi mě“ | ověření výkonu na mobilu |
| 2 | Firebase backend + ingest (ManyChat webhook) + DM odkaz + karta vojáka | první skuteční narukovaní |
| 3 | denní tah + story engine + hlasování | běžící svět |
| 4 | renderer Reelů, admin, Meta App Review, start | spuštění |

## 9. Otevřené otázky pro tebe

1. Název hry a IG účtu (pracovně „FRONTA“, frakce Concord / Hegemony)?
2. ~~Jazyk~~ → angličtina. ~~Smrt~~ → rodokmen + měsíční ofenzivy (k potvrzení).
3. Monetizace (patron, kosmetika, „poslat dopis“)? Teď stačí jen počítat s ní v datech.
