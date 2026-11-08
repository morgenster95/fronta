# Odbavení rekrutů — jak to funguje

## Princip
1. Člověk dá follow **@mudandiron** a pod **připnutý Reel** napíše slovo své strany: `CONCORD` nebo `HEGEMONY`
   (stačí i v delším komentáři, velikost písmen nevadí).
2. Systém z komentáře udělá vojáka: jméno = jeho @handle, vzhled a příjmení rodu se odvodí z účtu,
   dostane **první volné stanoviště** své strany (od středu fronty, přední linie první). Místo je trvalé.
3. Na webu **mudandiron.web.app** se najde vyhledáním svého @jména (odkaz v biu). Dokud je rekrutů málo,
   drží linii „neobsazená stanoviště“ — první rekrut zabere první z nich.
4. Každý den ráno (06:00 UTC) proběhne **denní tah**: nové zápisy do služebních záznamů, zranění, povýšení,
   výsledek včerejšího hlasování. Každý komentuje jen jednou — druhý komentář s jinou stranou se ignoruje.

## Fáze A — teď: ruční odbavení (bez Instagram API)
Dokud nemáme token z Meta aplikace, odbavuješ ty, ideálně 1–3× denně (stačí 2 minuty):

1. Otevři komentáře pod připnutým Reelem, opiš nová jména a stranu.
2. **Z mobilu:** GitHub app → repo `fronta` → Actions → **enlist** → Run workflow →
   do pole napiš: `jan.novak CONCORD, petra_k HEGEMONY, …` → Run.
   (Nebo napiš seznam mně a já ho odbavím.)
3. Workflow vojáky přidá, uloží stav a — jakmile je v GitHub Secrets `FIREBASE_SERVICE_ACCOUNT` — sám nasadí web.
   **Do té doby nasazení dělám já** (jinak se změna na webu neobjeví).
4. Pod komentář odpověz (šablony v `marketing/CAPTIONS.md`), ať lidé vidí, že to funguje.

## Fáze B — automaticky (po napojení Instagramu)
- GitHub Actions každých 30 minut stáhne komentáře pod posledními posty (Instagram API, Standard Access =
  vlastní účet, bez schvalování Metou), narukuje nové vojáky, sečte hlasy a nasadí web.
- Volitelně pošle rekrutovi soukromou zprávu s odkazem na jeho vojáka.
- Potřeba: profesionální IG účet → developers.facebook.com → aplikace Business → *Instagram API with Instagram Login*
  → token s oprávněními `instagram_business_basic`, `instagram_business_manage_comments`
  (+ `instagram_business_manage_messages` pro DM) → GitHub Secrets `IG_ACCESS_TOKEN`, `IG_USER_ID`.
  Pak v `.github/workflows/ingest.yml` a `daily.yml` odkomentovat `schedule`.

## Rozhodnutí (War Room)
- Na webu je záložka **War Room**: aktuální otázka, odemykání (bombardování od 500 převzatých vojáků) a historie rozhodnutí.
- Nové hlasování: GitHub app → Actions → **open-vote** → ID Reelu, otázka, dvě až tři možnosti ve tvaru
  `SLOVO|popis|nebezpečí|výsledek` (např. `HOLD|Hold the line|0.7|The line held. The rain did not stop.`).
- Lidé hlasují komentářem s tím slovem pod Reelem, platí poslední hlas na účet. Vyhodnotí to další denní tah,
  výsledek se objeví na webu jako zpráva dne a v historii War Roomu.

## Převzetí vojáka (claim) — zatím vypnuté
Tlačítko „This is me: claim“ čeká na zapnutí přihlášení Googlem ve Firebase (viz `docs/STATUS.md`, bod 3).
Do té doby stačí, že voják nese @jméno.

## Denní rytmus (návrh)
| Kdy | Co |
|---|---|
| ráno | denní tah proběhne sám (06:00 UTC) → nové příběhy |
| dopoledne | odbavit nové komentáře (fáze A) |
| odpoledne | Reel dne: co se stalo na frontě + otázka k hlasování (open-vote) |
| večer | odbavit, odpovědět v komentářích, story s výsledky |

## Zapnutí automatiky — krok za krokem
1. **Instagram:** @mudandiron přepnout na profesionální účet (Nastavení → Typ účtu → Creator nebo Business), účet veřejný.
2. **Meta aplikace:** developers.facebook.com → My Apps → Create app → případ užití *Manage messaging & content on Instagram* → typ Business.
   V aplikaci: *Instagram → API setup with Instagram login* → **Add account** (přihlásit @mudandiron) → **Generate token** → zkopírovat.
   Aplikace může zůstat ve vývojovém režimu (Standard Access stačí pro vlastní účet).
3. **GitHub** → repo `fronta` → Settings → Secrets and variables → Actions:
   - Secrets: `IG_ACCESS_TOKEN` (token z kroku 2), `FIREBASE_SERVICE_ACCOUNT` (Firebase Console → Project settings → Service accounts → Generate new private key → celý obsah JSON),
     volitelně `GH_PAT` (fine-grained token s právem *Secrets: read & write* pro repo → token se bude sám obnovovat).
4. **Kontrola:** Actions → **ig-check** → Run. V logu bude `IG_USER_ID` a ID postů → `IG_USER_ID` ulož jako secret,
   ID připnutého náborového Reelu jako variable `IG_MEDIA_IDS`.
5. **Zapnout:** Variables → `IG_ENABLED = true` (a `IG_REPLY = 1` pro automatické odpovědi pod komentáře).
   Od té chvíle: komentáře každých 30 min, denní tah v 06:00 UTC, obnova tokenu každé pondělí, web se nasazuje sám.
