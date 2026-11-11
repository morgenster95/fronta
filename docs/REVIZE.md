# Revize kódu 11. 11. 2026 (větev `revize`)

Všechno níže je **jen na větvi `revize`**. Ostrá hra (`main`) se nezměnila.
Náhled větve s živými daty hry: **https://mudandiron--revize-40p4cwxt.web.app** (editor spritů: `/editor/`). Každý push do větve náhled obnoví.

**Co jsem četl:** celý `engine/` kromě `valley.js` a `mapgen.js`, celý `ingest/`, smyčku a hlídače, datové cesty webu (`main.js`, `ui.js`, `house.js`).
**Co jsem do hloubky nečetl:** výpravy (`engine/valley.js`, vypnuté), generátor mapy, kreslení terénu a života na frontě, scénáře reelů a marketingové skripty v Pythonu.

---

## 1. Nelogičnosti, které jsem našel a na větvi opravil

| # | Co bylo špatně | Oprava |
|---|---|---|
| 1 | **Důstojník „jen povýšením“ nebyla pravda.** 4 % nových rekrutů dostalo Lieutenanta losem hned při narukování, bot přitom ostatním psal „Lieutenants are made by promotion only“. A povýšit se na něj nešlo vůbec: povýšení končilo u Staff Sergeanta. | Lieutenant se už nelosuje. Staff Sergeant může být povýšen na Second Lieutenanta, když je na straně volné místo (1 důstojník na 25 vojáků, `archetypes[].per`). Dva stávající důstojníci zůstávají. |
| 2 | **Převzatí hráči mizeli jako nezvěstní 4× častěji než ostatní.** Los se házel jen těm, kdo ten den dostali zápis do deníku; převzatí ho mají denně, ostatní jednou za 4 dny. | Los nezvěstných dostane každý každý den stejně (`theme.fate`, 0,35 % × nebezpečí). Celkový počet nezvěstných zůstává zhruba stejný. Rychlejší povýšení převzatých zůstalo (je to odměna za převzetí). |
| 3 | **Hlas „SANDBAGS, not hospital“ se počítal jako HOSPITAL.** Rozhodovalo pořadí možností v hlasování, ne text komentáře. | Platí heslo, které je v komentáři dřív. |
| 4 | **„HEGEMONY sucks, CONCORD!“ narukovalo do Hegemonie**, a stranu nejde změnit. | Komentář s oběma stranami nenarukuje; bot se zeptá, ať hráč napíše jedno slovo. |
| 5 | **Dny na frontě se počítaly třemi způsoby** (žebříček, karta, rod, oznámení o smrti: „after 0 days“). | Jedno pravidlo všude: dny včetně dneška (`daysAtFront`). |
| 6 | Oznámení o smrti psalo vždy „His… of his wounds“, i když si hráč nastavil she/they. | Řídí se zájmenem hráče. |
| 7 | **Stav hry se měnil každých 5 minut, i když se nic nestalo** (ukládal se čas synchronizace profilů). Výsledek: 267 commitů a nasazení webu za posledních 24 hodin. Každé nasazení je nová verze na Firebase Hosting a ukrajuje z 10 GB úložiště. | Čas se ukládá, jen když něco přišlo. Web se nasazuje, jen když se změnilo to, co návštěvník uvidí (`tools/site-sig.mjs`). |
| 8 | **Selhání denního tahu nebo publikace nikdo neohlásil.** | Smyčka založí issue (přijde e-mail) při selhání tahu i publikace; hlídač navíc kontroluje, že vydání ve 13:00 UTC opravdu vyšlo. |
| 9 | **Engine znal role jménem** (`medic`, `officer`, `sniper`…), proti pravidlu „engine je obecný“. Nová role by znamenala programovat. | Schopnosti určují klíče v `theme.battle.roles`. Výsledek tahu je bit po bitu stejný jako na main (ověřeno 4 scénáři × 40 dní). Postup: `docs/ROLES.md`. |
| 10 | Rodinné album ukázalo rozbitý obrázek u role bez vlastního spritu. | Záložní sprite střelce. |
| 11 | Panel Enlist na webu sliboval vojáka „within a few hours“ a posílal jen pod připnutý reel. | „Within minutes“, pod kterýkoli post, zmínka o roli. |
| 12 | **Web stahoval 388 obrázků vojáků jednotlivě** (388 dotazů při každé první návštěvě). | Jeden atlas (`npm run sprites`), 1 dotaz. Soubory, které v atlasu chybí, se načtou postaru. |
| 13 | Testy se na GitHubu nespouštěly. | Workflow `test` při každé změně kódu (ne při commitech stavu). |

Testy: 52 (bylo 47), všechny procházejí.

## 2. Nelogičnosti, které jsem neopravoval (potřebují tvoje rozhodnutí)

1. **Povýšení je prakticky nedosažitelné.** Šance 1,5 % v den, kdy má voják zápis. Převzatý hráč se dočká jedné hodnosti průměrně za 67 dní, Staff Sergeanta za ~9 měsíců.
   Návrh: hodnost podle zásluh (zkušenosti, dny, zásahy, ošetření), které už hra počítá. Např. Lance Corporal od úrovně Seasoned, Corporal od Veteran + 1 vyznamenání.
2. **Všichni chtějí střílet.** Ostřelovačů je 18 (los by jich dal ~8), kulometčíků 23, mediků 16. Hegemony má na mediky nejhorší den pokrytí 41 %, pod granáty 15 %. Návrh: bot v odpovědi řekne, co strana potřebuje („Your side is short of stretcher bearers“), a medici dostanou viditelnou odměnu (žebříček Healers už je, přidat medaili za 10 ošetřených).
3. **Denní mez 1–3 raněných neroste s velikostí armády.** Při 80 vojácích na stranu je klid mírnější, než bylo v plánu, a bombardování tvrdší (4 ze 6 cílových čísel mimo pásmo, `docs/COMBAT_ROLES.md` kap. 5). Návrh: mez na 50 vojáků.
4. **Narukuje jakákoli zmínka strany** v jakkoli dlouhém textu („I would never join the HEGEMONY“). Návrh: u komentářů delších než ~6 slov se nejdřív zeptat.
5. **Anglické texty v enginu** (zprávy o dobytí kóty, bombardování, odpovědi bota, nadpisy Gazette). Patří do tématu; je to hodina až dvě mechanické práce, chování se nezmění.
6. **Mrtvé nastavení:** `theme.milestones` (1 000 / 2 500 / 5 000 vojáků: „první tanky“) nic nedělá, `state.votes` a `state.log` se nepoužívají.
7. **Paměť komentářů má strop 20 000.** Po jeho překročení se staré komentáře zpracují znovu a bot může některým lidem odpovědět podruhé. Zatím daleko (teď stovky), ale před větším růstem je potřeba pamatovat si u každého postu, kam až je přečtený.
8. **Zveřejněný příběhový reel slibuje „500 claimed soldiers unlock the artillery“ a „every midnight“.** Popisek jde upravit ručně na Instagramu.

## 3. Průvodce do soukromých zpráv

**Novým followerům napsat nejde.** Instagram dovolí automatickou zprávu jen tomu, kdo se ozve první: na komentář smí přijít jedna soukromá odpověď do 7 dnů, další až když člověk odpoví. Seznam nových followerů API vůbec nedává.

Co jsem připravil (zapne se proměnnou `IG_SEND_DM=1` v GitHubu, texty v `theme.dm`):
- **Nový rekrut** dostane do zpráv průvodce: kde se najde, jak si říct o roli, jak hlasovat, kdy vychází Gazette, jak vojáka převzít.
- **Kdo okomentuje post bez hesla a ještě nemá vojáka**, dostane jednou návod, jak se přidat.

Co nevím: jestli tvůj token smí psát zprávy cizím lidem. Meta píše, že aplikace ve standardním režimu smí posílat zprávy jen lidem s rolí v aplikaci; pro všechny je možná potřeba schválení aplikace (App Review, zdarma, trvá dny). Zjistí se to prvním pokusem: v logu smyčky bude buď `✉ průvodce @…`, nebo chyba od Instagramu. Nic se tím nerozbije.

Bez programování, hned: připnutý komentář „How to join“ pod každým postem, průvodce ve zvýrazněných stories, a v Meta Business Suite okamžitá odpověď + časté dotazy pro ty, kdo napíšou do zpráv sami.

## 4. Hosting: kolik hra žere a kdy spadne

**Naměřeno (headless Chrome, mobil):**

| | Přenos |
|---|---|
| První návštěva teď (main) | asi 0,65–0,8 MB, 415 dotazů: kód 186 kB, data 12 kB, 388 obrázků vojáků 349 kB + hlavičky, efekty ~70 kB |
| První návštěva na větvi (atlas) | asi 0,55 MB, 30 dotazů |
| Návrat (obrázky v mezipaměti) | 12–15 kB dat |
| Otevření karty vojáka | 1–2 kB (jeden ze 64 souborů se záznamy) |
| Deník, žebříčky | 2–6 kB |

Můj odhad z rána (1,8 MB) byl horní mez; skutečnost je třetinová. Data a záznamy jsou udělané dobře: záznamy se načítají až po kliknutí a po kouscích.

**Limity Firebase Spark:** ceník uvádí 360 MB denně, dokumentace 10 GB měsíčně s tím, že po překročení je krátká lhůta a pak je **web vypnutý do začátku dalšího měsíce**. Úložiště 10 GB; po zaplnění nejde nasazovat.
- Dnešní kapacita: zhruba **450–550 nových návštěvníků denně** (asi 15 000 měsíčně), s atlasem ~650 denně.
- Virální reel (desítky tisíc zhlédnutí, tisíce kliknutí za den) by limit překročil.

**Co udělat, seřazeno podle poměru užitek / práce:**
1. **Hned, 2 minuty, uděláš ty:** Firebase Console → Hosting → Release history → ⋮ → *Release storage settings* → ponechat např. 10 verzí. Jinak staré verze zabírají úložiště.
2. **Sloučit tuhle větev** (atlas, méně nasazení).
3. **Dlouhá mezipaměť pro kód** (na větvi hotovo): soubory `/assets/*.js` a `*.css` mají v názvu otisk, takže je prohlížeč po první návštěvě už znovu nestahuje.
4. **Hlavní pojistka, ~půl dne práce: těžké soubory mimo Firebase.** Kód a obrázky (540 kB z 550) servírovat z GitHub Pages, kde už jsou média pro Instagram (měkký limit 100 GB měsíčně). Na Firebase zůstane jen HTML, data a přihlášení: ~15 kB na návštěvu, tedy stovky tisíc návštěv měsíčně. **Adresa mudandiron.web.app i přihlášení zůstanou stejné.**
5. **Cloudflare Pages** (zdarma, přenos bez limitu) jako úplná náhrada: znamenalo by to novou adresu, nebo vlastní doménu, a přihlášení Googlem by dál potřebovalo Firebase. Až kdyby krok 4 nestačil.
6. **Blaze jako záchranná brzda** odporuje pravidlu „jen zdarma“, ale pro úplnost: přenos nad limit stojí 0,15 USD za GB, 100 000 návštěv navíc by vyšlo zhruba na 8 USD.

**Další slabá místa pro růst** (neopraveno, hrozí až při tisících hráčů):
- `roster.json` obsahuje všechny vojáky a stahuje se při každé návštěvě: teď 12 kB, při 10 000 vojácích ~250 kB. Řešení: po úsecích mapy.
- `data/state.json` je celý stav v jednom souboru v gitu (1 kB na vojáka) a commituje se při každé změně. Při 5 000 vojácích to bude 5 MB na commit. Řešení: záznamy vojáků do samostatných souborů.
- Všechny sprity se načítají předem. Až přibudou role, načítat jen ty, které jsou na mapě vidět.

## 5. Další role a sprity
Hotovo: role řízené tématem, záložní sprite, `npm run sprites`, editor. Postup v `docs/ROLES.md`.

Nápady na role, které jdou složit z existujících schopností (jen záznam v tématu + sprite):
- **Trench Mortar**: silná palba, těžší zranění, sám je přednostní cíl.
- **Observer**: vybírá cíle jako ostřelovač a kryje okolí jako spojař, skoro nestřílí.
- **Field Surgeon**: práce za dva mediky; role jen za povýšení z nosiče raněných.
- **Pigeon Handler**: spojka s větším dosahem velení.
- **Quartermaster**: morálka jako kuchař + oprava drátu.
- **Tank Crew** při milníku (např. 500 vojáků): využije dnes mrtvé `theme.milestones`.

## 6. Podpora (Patreon / Buy Me a Coffee)

Poplatky platforem (k říjnu–listopadu 2026, bez poplatku za platbu kartou ~3 % + 0,30 USD):

| Platforma | Poplatek | Hodí se na |
|---|---|---|
| **Ko-fi** | 0 % ze spropitného, 5 % z členství | jednorázové „kup mi kávu“, umí PayPal |
| Buy Me a Coffee | 5 % ze všeho | jednoduché, známé jméno |
| Patreon | 8–12 % | měsíční členství s odměnami, vlastní komunita |

**Doporučení:** začít s **Ko-fi** (nejmíň poplatků, hotové za 10 minut), odkaz v biu a tlačítko „Support the war effort“ na webu. Patreon až s publikem, které o měsíční odměny stojí.

**Co za to dát. Nikdy ne výhodu v boji**, jinak hra přijde o důvěru:
- stuha **War Bond** na kartě vojáka a v rodinném albu (zůstává v rodu),
- blok „War bonds“ v Trench Gazette se jmény podporovatelů (jednou týdně),
- vlastní epitaf pro padlého a zlatý rámeček na sdílecí kartě,
- pojmenování místa na mapě nebo další kóty (vyšší částka, jen pár kusů),
- hlasování podporovatelů o kosmetických věcech (jméno pluku, prapor).

Technicky: Ko-fi umí poslat oznámení o platbě (webhook), ale bez serveru ho nemáme kam přijmout. Jednodušší: podporovatel napíše do zprávy u platby své @jméno a stuhu mu přidáš (nebo já) řádkem v `theme.honors`. Daně z příjmu si prosím ověř u účetní.

## 7. Virální nápady
Seřazeno od nejlevnějších. Nemám přístup ke statistikám účtu, takže to jsou hypotézy k vyzkoušení, ne jistoty.

1. **Zapnout oznámení o smrti** (`IG_DEATH_NOTICE=1`, už hotové): bot odpoví pod hráčův komentář „tvůj voják padl, nastoupil jeho bratr“ s odkazem. Je to důvod se vrátit a něco, co lidé ukazují dál.
2. **Verbování kamarádů s odměnou.** Hráč označí kamaráda v komentáři; když kamarád narukuje, verbíř dostane medaili *Recruiting Sergeant* a je žebříček verbířů. Označují hráči, ne my, takže to není spam od účtu. (Potřebuje úpravu ingestu: číst @zmínky.)
3. **Jeden silný reel denně místo pěti příspěvků.** První 2 sekundy: „This comment section is a war.“ + okamžitě ukázat komentář, který se mění ve vojáka.
4. **Reel jako odpověď na komentář** (funkce Instagramu): vybrat vtipný komentář hráče a odpovědět reelem s jeho vojákem. Hráč to sdílí, ostatní chtějí taky.
5. **Rivalita se jmény:** „Wanted“ plakát nejlepšího ostřelovače dne (jméno v obrázku, ne označení), druhá strana má důvod naverbovat posily.
6. **Posily pro slabší stranu:** když jedna strana vede o 10+, post „The Hegemony calls for reinforcements“; outsider se sdílí líp než favorit.
7. **Milníky s událostí:** při 250 / 500 / 1 000 vojácích něco přijede na mapu (první tank, nový úsek fronty). Odpočet ve stories.
8. **Vánoční příměří 24.–25. 12.:** obě strany hlasují TRUCE, na území nikoho se hraje fotbal. Skutečná historie, silný příběh, jasné datum, na které se dá šest týdnů stavět.
9. **Velitelé stran:** každá strana si komentáři zvolí generála z řad hráčů; ten pak vybírá jednu ze dvou možností místo hlasování.
10. **Spolupráce:** účtům o historii a pixel artu nabídnout pojmenovaného důstojníka nebo pomník na mapě výměnou za sdílení.
11. **Stejné reely na TikTok a YouTube Shorts** s výzvou „comment on Instagram“.

## 8. Co na větvi vyzkoušet, než se sloučí
- Náhled: mapa, karta vojáka, rodinné album, Ranks, War Room (data jsou živá z main).
- Editor: `/editor/`.
- Boj nanečisto: `node tools/preview-tick.mjs --md nahled.md`, `node tools/sim-battle.mjs --kpi`.
- Smyčku, publikaci a zprávy na větvi vyzkoušet nejde (běží jen z main). Úpravy `tools/loop.sh`, hlídače a soukromých zpráv jsem ověřil jen čtením a dílčími testy; po sloučení je potřeba první hodinu sledovat log `front-loop`.
