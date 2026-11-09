# Denní rytmus Mud & Iron

Publikum je anglicky mluvící (USA + Británie), proto jsou časy pevně v **UTC** (nemění se s letním časem).
Nastavení: `themes/front-ww1/theme.json` → `schedule`.

| UTC | Co se děje | Praha (zima / léto) | Londýn (zima / léto) | New York (zima / léto) | Los Angeles (zima / léto) |
|---|---|---|---|---|---|
| **13:00** | **Ranní noviny:** nový den války, denní tah (zápisy vojákům), nové číslo The Trench Gazette, vyhodnocení hlasování | 14:00 / 15:00 | 13:00 / 14:00 | 08:00 / 09:00 | 05:00 / 06:00 |
| **23:00** | **Večerní reel / příspěvek:** co se změnilo, otevření nového hlasování (fronta `marketing/queue.json`, `publishAt`) | 00:00 / 01:00 | 23:00 / 00:00 | 18:00 / 19:00 | 15:00 / 16:00 |

- Hlasování otevřené večerním reelem se uzavře s ranními novinami (okno ~14 h: americký večer, noc a britské dopoledne).
- Reel připravujeme spolu, kdy se hodí (např. 17–18 h pražského času), a naplánujeme ho do fronty na 23:00 UTC.
  Smyčka ho zveřejní sama, nikdo nemusí být vzhůru.
- Noviny jmenují jen nejzajímavější hráče dne (max. 5 příhod + nováčci); všichni hráči mají svůj zápis na kartě vojáka.
- Web hráčům ukazuje „Next edition in X h“ v jejich místním čase (Diary).
- Ruční zápis do novin (`data/diary.json`) s `day` = číslo dne se objeví spolu s ranním vydáním.
