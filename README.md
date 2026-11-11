# MUD & IRON (@mudandiron)

Instagramová hra: kdo pod náš Reel napíše `CONCORD` nebo `HEGEMONY`, narukuje a jeho vojáček se objeví
na obří mapě zákopů v ponurém světě 1. světové války. Každý den nový zápis v jeho služebním záznamu, hlasuje se v komentářích.
Hra běží naostro: https://mudandiron.web.app

- Stav a co je teď ve hře: [`docs/STATUS.md`](docs/STATUS.md) · pravidla boje: [`docs/BATTLE.md`](docs/BATTLE.md), [`docs/COMBAT_ROLES.md`](docs/COMBAT_ROLES.md)
- Denní rytmus: [`docs/SCHEDULE.md`](docs/SCHEDULE.md) · odbavení rekrutů a provoz: [`docs/ONBOARDING.md`](docs/ONBOARDING.md) · výpravy (vypnuté): [`docs/MAP_MISSIONS.md`](docs/MAP_MISSIONS.md)
- Původní návrh (v1, historický): [`docs/DESIGN.md`](docs/DESIGN.md) · zadání grafiky: [`docs/PIXELLAB_BRIEF.md`](docs/PIXELLAB_BRIEF.md) · pokyny pro Claude: [`CLAUDE.md`](CLAUDE.md)
- **Jen bezplatné služby:** Firebase Spark (Hosting, Firestore, Auth), GitHub Actions a GitHub Pages. Žádné Cloud Functions ani placená API.

## Struktura

```
engine/         jádro nezávislé na tématu: mapa, vojáci, příběhy ze šablon, soupiska, denní boj, závod o kóty, hlasování, výpravy
themes/<id>/    tematický balíček: theme.json (frakce, role, čísla boje, kóty), story.json (šablony příběhů)
web/            prohlížeč fronty (Vite + PixiJS): terén, vojáci, karta, hledání, převzetí, Gazette, War Room, scénáře reelů
ingest/         Node skripty smyčky: komentáře z IG, denní tah, publikace fronty příspěvků
marketing/      fronta příspěvků (queue.json), grafika a videa pro IG (promo/), výroba postů a reelů
tools/          smyčka (loop.sh), build dat, náhled vydání, simulace boje, výroba reelů, kontrola spritů
art/            zdrojová grafika z PixelLabu + ručně opravené sprity, paleta Trench 24
data/state.json stav světa (soupiska); databáze je git, ručně se neupravuje
```

## Vývoj

```bash
npm install
npm run data:fake      # 4 000 falešných vojáků do web/public/data (data/state.fake.json)
npm run dev            # http://localhost:5173
npm test               # testy jádra
npm run assets         # stáhne rotace postav z PixelLabu podle art/sprites.json
python tools/sprite_qa.py --height 30 web/public/assets/soldiers/*.png
```

Odkaz na vojáka: `/?s=<handle>`.

## Provoz (GitHub Actions, zdarma)

| Workflow | Kdy | Co dělá |
|---|---|---|
| `front-loop` | nepřetržitě, kolo každých ~5 min | komentáře z IG → narukování, role, hlasy, převzetí → odpovědi → fronta příspěvků → 1× denně denní tah (13:00 UTC) → commit stavu → Firebase Hosting |
| `watchdog` | každých 20 min | hlídá smyčku a nasazení, při potížích je spustí a založí issue |
| `media` | po změně v `marketing/promo/` | vystaví soubory pro Instagram na GitHub Pages |
| `reel` | ručně nebo commitem `marketing/reels/render.json` | vyrobí reel (voiceover, natočení, zvuk) do `marketing/promo/` |
| `refresh-token` | každé pondělí | obnoví token Instagramu |
| `ingest`, `daily`, `publish`, `deploy`, `enlist`, `open-vote`, `ig-check`, `claim-check` | jen ručně | zálohy a diagnostika (`docs/ONBOARDING.md`) |

Secrets (Settings → Secrets and variables → Actions): `IG_ACCESS_TOKEN`, `IG_USER_ID`, `FIREBASE_SERVICE_ACCOUNT` (JSON), volitelně `GH_PAT`.
Variables: `IG_ENABLED`, `IG_REPLY`, `IG_MEDIA_IDS`, `SITE_URL`, volitelně `IG_SEND_DM`, `FIRESTORE`.
