# Škálování a doména (stav 2026-11-11)

## Měření (umělá soupiska, 6 dní, mobil; `node tools/fake-roster.mjs N`)
| Hráčů | data na návštěvu (gz) | načtení | paměť | `state.json` | složka `data/` |
|---|---|---|---|---|---|
| 1 000 | 30 KB | ~2,1 s | 45 MB | 1,6 MB | 2 MB |
| 4 000 | 94 KB | ~2,1 s | 58 MB | 11 MB | 11 MB |
| 10 000 | 236 KB | ~2,0 s | 48 MB | 53 MB | 52 MB |
Ostatní přenos jedné nové návštěvy: JS+CSS+HTML 193 KB (Firebase), obrázky 435 KB (zrcadlo GitHub Pages). Mapa má ~9 300 míst na stranu.

## Limity a kdy narazíme
| Co | Limit | Kdy |
|---|---|---|
| Firebase Hosting (Spark) přenos | 360 MB/den, po vyčerpání web neodpovídá | ~3 300 návštěv denně dnes, ~1 900 při 4 000 hráčích, ~1 100 při 10 000 (půl nových, půl vracejících se) = reálně ~1 500–3 000 hráčů |
| `state.json` v gitu | 15 MB zpomaluje smyčku, 100 MB GitHub odmítne | 4 000 hráčů: 15 MB za ~10 dní, 100 MB za ~7–8 týdnů; 10 000: 100 MB za ~12 dní |
| Cloudflare Pages zdarma | 500 sestavení měsíčně | dnes ~85 nasazení denně (po úpravě), proto na Pages jen kód |
| Supabase zdarma | 500 MB databáze, 5 GB přenosu měsíčně, pauza po týdnu nečinnosti | na servírování veřejných dat nestačí |
| Cloudflare R2 zdarma | 10 GB, 1 M zápisů, 10 M čtení měsíčně, přenos ven zdarma | vejde se i při 5 000 hráčích |
| Instagram API | limity neznámé; kód nemá omezení rychlosti odpovědí | hrozí při virálním příspěvku s tisíci komentářů |

## Plán
1. **Doména na Firebase Hosting** (DNS u Cloudflare, „DNS only“): `authDomain`, povolená doména ve Firebase Auth, OAuth redirect URI, `SITE_URL`, bio, přesměrování staré adresy.
2. **Cloudflare Pages + R2** (test vedle ostrého webu): kód na Pages, data do R2 (smyčka nahrává jen změněné soubory), přihlášení Supabase Auth nebo Firebase s proxy.
3. **Stav mimo git** (R2 / Supabase) a **omezení rychlosti odpovědí** na komentáře.

## Závěr rozhodnutí
Vercel + Supabase (jako thaloriaworld.com) pro nás není lepší: Vercel Hobby je nekomerční, Supabase zdarma má malý přenos. Supabase se hodí na přihlášení a profily (funguje na jakékoli doméně).
Tahle hra je tahová, takže statické soubory na CDN (R2/Pages) jsou nejlevnější a nejrychlejší.
