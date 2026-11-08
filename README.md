# MUD & IRON (@mudandiron)

Instagramová hra: kdo pod náš Reel napíše `CONCORD` nebo `HEGEMONY`, narukuje a jeho vojáček se objeví
na obří mapě zákopů v ponurém světě 1. světové války. Každý den nový zápis v jeho služebním záznamu, hlasuje se v komentářích.

- Návrh: [`docs/DESIGN.md`](docs/DESIGN.md) · zadání grafiky: [`docs/PIXELLAB_BRIEF.md`](docs/PIXELLAB_BRIEF.md) · stav a další kroky: [`docs/STATUS.md`](docs/STATUS.md)
- **Jen bezplatné služby:** Firebase Spark (Hosting, Firestore, Auth), GitHub Actions. Žádné Cloud Functions ani placená API.

## Struktura

```
engine/         jádro nezávislé na tématu: mapa (mapgen), vojáci, příběhy ze šablon, soupiska
themes/<id>/    tematický balíček: theme.json (frakce, klíčová slova, hodnosti), story.json (šablony příběhů)
web/            prohlížeč fronty (Vite + PixiJS): terén, tisíce vojáků, karta, hledání, převzetí
ingest/         Node skripty pro GitHub Actions: stahování IG komentářů, denní tah
tools/          falešná data, build dat, stažení spritů z PixelLabu, kontrola pixelů (sprite_qa.py)
art/            zdrojová grafika z PixelLabu + ručně opravené sprity, paleta Trench 24
data/state.json stav světa (soupiska) — databáze je git
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
| `ingest` | každých 30 min | komentáře z IG → narukování / převzetí → `data/state.json` → build → Firebase Hosting |
| `daily-tick` | 06:00 UTC | nový den, zápisy, osudy, nástupci padlých → nasazení |

Secrets (Settings → Secrets and variables → Actions):
`IG_ACCESS_TOKEN`, `IG_USER_ID`, `FIREBASE_SERVICE_ACCOUNT` (JSON).
Variables: `SITE_URL`, `IG_MEDIA_IDS` (volitelné), `IG_SEND_DM=1` (volitelné).
Bez secrets workflow jen přegeneruje data a nic nenasazuje.
