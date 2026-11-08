# Stav projektu a co je potřeba od tebe

_Aktualizováno 8. 11. 2026._

## Hotovo
- **Prototyp prohlížeče fronty** (PixiJS): procedurální zákopy (3 linie na stranu + spojovací zákopy, pytle, dráty, krátery, mrtvé stromy),
  4 000 falešných vojáků, úrovně detailu (zblízka sprity s „dýcháním“, zdálky tečky frakcí), přiblížený první pohled,
  hledání `@handle`, karta vojáka se služebním záznamem, odkaz `/?s=handle`, sdílení, déšť, mlha, záblesky.
- **Jádro** (`engine/`): deterministická mapa ~4 650 míst (8 sektorů), narukování z komentáře, převzetí kódem, generátor příběhů
  ze šablon (zdarma, bez AI), denní tah se zraněními, povýšením, smrtí a **nástupcem z rodu**. Testy: `npm test`.
- **Ingest** (`ingest/poll-comments.mjs`): Instagram API (Standard Access, vlastní účet), stahování každých 30 min přes GitHub Actions,
  volitelná soukromá odpověď (Private Reply), párování převzetí přes Firestore.
- **Firebase projekt `fronta-ig`** (Spark, zdarma), náhled: https://fronta-ig--preview-om1t1aan.web.app (platí do 8. 12.).
- **Grafika:** Concord a Hegemony střelec, 8 směrů, výška 30 px, kontrola pixelů (`tools/sprite_qa.py`).

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

## Další kroky (můj návrh pořadí)
1. Finální dlaždice terénu z PixelLabu (pro režim) místo procedurálních + rekvizity (dráty, pytle, kříže, bedny, kulomet).
2. Ostatní archetypy vojáků (8 na frakci) podle `docs/PIXELLAB_BRIEF.md` + animace idle/walk.
3. Růst mapy po sektorech bez přesouvání stávajících vojáků (teď se pořadí plnění počítá od středu pro pevný počet sektorů).
4. Hlasování z komentářů pod denním Reelem → událost dne → `danger` a posun linie.
5. Renderer Reelů (headless prohlížeč nahraje průlet kamerou).
6. Výkon na mobilu: zatím ověřeno jen na desktopu (Chrome).
