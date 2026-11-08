# Stav projektu a co je potřeba od tebe

_Aktualizováno 8. 11. 2026._

## Hotovo
- **Prototyp prohlížeče fronty** (PixiJS): procedurální zákopy (3 linie na stranu + spojovací zákopy, pytle, dráty, krátery, mrtvé stromy),
  4 000 falešných vojáků, úrovně detailu (zblízka sprity s „dýcháním“, zdálky tečky frakcí), přiblížený první pohled,
  hledání `@handle`, karta vojáka se služebním záznamem, odkaz `/?s=handle`, sdílení, déšť, mlha, záblesky.
- **Jádro** (`engine/`): deterministická mapa 32 sektorů (~18 600 míst, otevřeno 8), narukování z komentáře, převzetí kódem, generátor příběhů
  ze šablon (zdarma, bez AI), denní tah se zraněními, povýšením, smrtí a **nástupcem z rodu**. Testy: `npm test`.
- **Ingest** (`ingest/poll-comments.mjs`): Instagram API (Standard Access, vlastní účet), stahování každých 30 min přes GitHub Actions,
  volitelná soukromá odpověď (Private Reply), párování převzetí přes Firestore.
- **Firebase projekt `fronta-ig`** (Spark, zdarma), náhled: https://fronta-ig--preview-om1t1aan.web.app (platí do 8. 12.).
- **Grafika:** všech 10 typů vojáků × 2 frakce (střelec, důstojník, zdravotník, kulometčík, ženista, spojka, ostřelovač, spojař, kuchař, kaplan),
  8 směrů, chodidla na jednom řádku, výška 30 ±1 px. Rekvizity: hrob s přilbou, mrtvý strom. Nástroje: `tools/sprite_qa.py` (kontrola), `tools/sprite_fix.py` (plovoucí pixely, pata).
- **Hlasování:** komentář s klíčovým slovem pod Reelem, 1 hlas na účet, vyhodnotí denní tah → denní zpráva na webu. Otevření: workflow `open-vote` (jde i z mobilu přes GitHub app).
- **Růst fronty:** mapa má 32 sektorů, otevřeno 8; při 90% zaplnění se otevřou další 2. Voják má uloženou trvalou pozici, nikdy se nepřesune.

- **Hloubka zákopů:** vzdálená stěna s obložením a stínem, bližší okraj a jižní pytle ve vrstvě NAD vojáky (stojí v zákopu, Hegemonie vykukuje přes pytle).
- **Život na frontě** (`web/src/life.js`, jen vizuál, nikoho nezraní): dýchání (snímky z PixelLabu, nohy stojí), občasný výstřel (animace + kouř + stopa, 1× za 3,5–8 s),
  granát do země nikoho (1× za 25–60 s, VFX z PixelLabu), světlice, zdravotník dojde ke skutečně zraněnému (stav z denního tahu) a ošetří ho.
  Skutečná zranění dál jen v denním tahu (pomalu).
- **Bombardování:** odemkne se při 500 převzatých vojácích (ukazatel na webu), pak jde dát do hlasování (`open-vote` s efektem `barrage`);
  vítězství = hustá palba na cílovou frakci po celý další den + vyšší nebezpečí v denním tahu. Náhled: `/?fx=barrage`.

## Potřebuju od tebe (až se vrátíš)
1. **Název hry + IG účet.** V `themes/front-ww1/theme.json` je zástupný `@thefront.game`.
2. **Instagram:** profesionální (Creator/Business) účet → developers.facebook.com → aplikace typu *Business* → produkt
   *Instagram API with Instagram Login* → přidat svůj IG účet → vygenerovat token s oprávněními
   `instagram_business_basic`, `instagram_business_manage_comments` (+ `instagram_business_manage_messages` pro DM).
   Token a IG user ID vložit do GitHub Secrets (`IG_ACCESS_TOKEN`, `IG_USER_ID`). **První test:** spustit workflow `ingest` ručně.
3. **Firebase Auth (Google):** Console → Authentication → Get started → Google → Enable. Pak vytvořit Firestore (Native, eur3)
   a webovou aplikaci → konfiguraci dát do `web/src/firebase-config.js`.
   ⚠️ `authDomain` = doména, na které web poběží (např. `fronta-ig.web.app`), a v Google Cloud Console → Credentials → OAuth klient
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
