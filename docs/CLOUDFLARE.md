# Přesun webu na Cloudflare (plán, 19. 11. 2026, NÁVRH, čeká na uživatele)

Důvod: Firebase Hosting (Spark) má 10 GB přenosu měsíčně; listopad 2,11 GB k 19. 11., tempo 330–410 MB/den a roste s hráči.
Prosinec by limit vyčerpal kolem poloviny měsíce. Cloudflare nemá poplatek ani limit za přenos statických souborů.

**Čísla limitů Cloudflare níž jsou z paměti, NEOVĚŘENÁ** (dokumentace developers.cloudflare.com z cloudového sezení nešla stáhnout).
Před nasazením je ověřit (krok 0).

## Co na hostingu závisí (audit)
| Proces | Kde běží | Závisí na hostingu? | Co změnit |
|---|---|---|---|
| Bot: komentáře, nábor, odpovědi | GitHub Actions (`front-loop.yml` → `tools/loop.sh` → `ingest/poll-comments.mjs`), IG API | ne (jen odkaz v odpovědi `SITE_URL`) | proměnná `SITE_URL` v GitHubu |
| Tvorba vojáků, denní tah, noviny | engine ve smyčce, stav v gitu | ne | nic |
| Publikace na IG (reely, posty) | `ingest/publish.mjs`, média z GitHub Pages | ne | nic |
| Nasazení webu každých ~6 min | `tools/loop.sh` (`firebase deploy`), dále `daily.yml`, `enlist.yml`, `ingest.yml`, `deploy.yml` | ANO | nový krok nasazení (viz níž) |
| Web: kód hry (JS/CSS) | Firebase Hosting | ANO | Cloudflare |
| Web: data (`/data/*.json`, records) | Firebase Hosting | ANO | Cloudflare |
| Web: obrázky | zrcadlo GitHub Pages (`tools/asset-base.sh`) | ne | může zůstat, nebo Cloudflare |
| Přihlášení Google („This is me“) | Firebase Auth, `authDomain: mudandiron.web.app` | ANO (redirect na iPhonu/PWA) | `authDomain` + proxy `/__/auth/*` |
| Firestore (nároky na vojáky, profily, dopisy) | Firebase (Spark) | ne (jiný limit) | autorizovaná doména v Auth |
| Hlídač dostupnosti | `watchdog.yml` (`SITE_URL`) | ANO | `SITE_URL` |
| Staré odkazy (bio, popisky, obrázky „mudandiron.web.app“, odpovědi bota) | Firebase | ANO | na Firebase nechat malou přesměrovací stránku |

## Návrh architektury
1. **Cloudflare Pages, projekt `mudandiron`, nasazení Direct Upload** (`wrangler pages deploy dist`) z GitHub Actions, s vlastní doménou uživatele.
   - OVĚŘIT: limit nasazení na Free (pamatuji 500 *buildů* měsíčně; jestli se počítá i Direct Upload). Smyčka teď nasazuje ~240× denně.
     Pokud se počítá, data nesmí jít přes Pages (varianta 2).
   - OVĚŘIT: max 20 000 souborů na nasazení, max 25 MiB na soubor (dist má ~13 MB, stovky souborů: OK).
2. **Varianta pro data, když Pages nasazení omezuje:** data (`/data/**`, ~130 souborů, mění se každých 6 min) do **R2** s vlastní poddoménou `data.<doména>`,
   web je stahuje odtud (jedna proměnná, jako `VITE_ASSET_BASE` u obrázků), CORS pro hlavní doménu. Pages se nasazuje jen při změně kódu.
   - OVĚŘIT R2 Free: 10 GB úložiště, 1 M zápisů (třída A) a 10 M čtení (třída B) měsíčně, výstup zdarma.
     Odhad: zápisy ~240 nasazení/den × jen změněné soubory (~10–40) ≈ 100–300 tis./měsíc; čtení ~5–10 souborů na návštěvu → 10 M ≈ 1 M návštěv.
     Cache Cloudflare před R2 (Cache-Control max-age=60) čtení ještě sníží.
3. **Přihlášení:** `authDomain` = nová doména a Pages Function (nebo `_redirects` nestačí, externí proxy neumí) na cestě `/__/auth/*` → `https://fronta-ig.firebaseapp.com/__/auth/*`
   (Firebase doporučená varianta „reverse proxy“ pro redirect přihlášení). Uživatel: Firebase Auth → Authorized domains + Google Cloud OAuth redirect `https://<doména>/__/auth/handler`.
   - OVĚŘIT: Workers/Functions Free 100 000 požadavků denně (jen dynamické, statické soubory se nepočítají); přihlášení jich udělá jednotky.
4. **Stará adresa `mudandiron.web.app`:** po přepnutí nasadit na Firebase jen `index.html` s přesměrováním (zachová `?s=handle` a cestu) a nic dalšího → přenos téměř nulový.
   Firebase nasazení ze smyčky vypnout.
5. **Obrázky:** zrcadlo na GitHub Pages zůstává (funguje, ověřeno), později je lze přesunout na Cloudflare.

## Postup (bez výpadku)
0. Ověřit limity výš (uživatel nebo sezení s přístupem na developers.cloudflare.com).
1. Uživatel: název domény, v Cloudflare vytvoří API token (Pages: Edit, R2: Edit, Workers: Edit pro danou účet) a vloží ho do GitHubu jako Secret `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` (proměnná).
2. Já: workflow `cloudflare.yml` a krok v `tools/loop.sh`, který nasazuje **vedle Firebase** na `test.<doména>` (Firebase zůstává ostrý).
3. Test na `test.<doména>` (kontrolní seznam níž), smyčka běží 24 h s oběma nasazeními, kontrola chyb v logu.
4. Přepnutí: doména na produkci, `SITE_URL`, `authDomain`, odkaz v biu; Firebase jen přesměrování. Hodinu sledovat log a hlídače.
5. Zpětná cesta: vrátit `SITE_URL` a Firebase nasazení (jeden commit), data se mezitím nikde neztratí (zdroj je git).

## Kontrolní seznam testu
- Nová návštěva: mapa, vojáci, karta vojáka, deník (3 zápisy + Show more, `records-old`), Gazette/deník fronty, Roll of Honour, nástěnky, album rodu.
- Odkaz z odpovědi bota `/?s=<handle>` otevře kartu vojáka.
- Data se obnoví do ~6 min po komentáři (nový voják na mapě), cache nevrací stará data.
- Přihlášení Google na počítači (popup) i na iPhonu/PWA (redirect), „This is me“ + kód z IG, dopis domů, převelení.
- Zrcadlo obrázků funguje i z nové domény (CORS, `VITE_ASSET_BASE`).
- `npm test` prošel, smyčka nasazuje bez chyb, hlídač hlásí OK, Firebase přenos po přepnutí klesá k nule.
