# Mechaniky: co jsme domluvili (deník rozhodnutí)

Sem se zapisuje **každá domluvená změna herní mechaniky** (boj, role, ztráty, bombardování, útoky, stavby…):
co platí, proč, s jakými čísly a co je jen navržené. Nejnovější nahoře. Podrobná pravidla jsou v `docs/BATTLE.md`
a `docs/COMBAT_ROLES.md`, čísla v `themes/front-ww1/theme.json` → `battle`.

Stavy: **NASAZENO** (běží ve hře) · **SCHVÁLENO** (domluveno, zatím nepostavené) · **NÁVRH** (čeká na rozhodnutí) · **ZAMÍTNUTO**.

---

## 2026-11-11 · Vyvážení v7: víc zásahů a padlých, silné bombardování, role škálují s počtem hráčů · NASAZENO
**Proč:** uživateli přišlo zranění a úmrtí „hrozně málo“. Dny 2–3 měly 3–4 raněné na stranu a nikoho padlého.
Hlavní brzda byla pevná denní mez 1–3 raněných na stranu, která nerostla s počtem hráčů (85+ na stranu).
Navíc podpůrné role fungovaly binárně: stačil jeden poblíž, takže pár kulometčíků dalo plné potlačení všem.

**Co platí (v7):**
| | v6 | v7 |
|---|---|---|
| denní mez nových raněných na stranu (klid) | 1–3 | **2–5 na každých 80 vojáků** (`daily.per`, roste s velikostí strany) |
| mez pod granáty | 8 | **8 na 80 vojáků** (roste s velikostí strany) |
| zásah z pozadí | 3 % | **4 %** |
| palba puškař / kulomet / ostřelovač | 1,7 / 3 / 4,5 % | **2,8 / 4,5 / 6 %** |
| ochrana nováčků (kritický zásah, zhoršení) | 5 dní | **3 dny** |
| závažnost z pozadí lehce / těžce / kriticky | 60 / 25 / 15 % | **55 / 30 / 15 %** |
| smrt kritického za noc (základ) | 8 % | **9 %** |
| bombardované úseky | 4 | **30 % úseků poraženého, aspoň 4** (`shell.share`), při 23 úsecích 7 |
| zásah v bombardovaném úseku | 50 % | **40 %** (víc úseků → celkově silnější) |

**Role podle poměru (`roles.*.covers`):** každý voják podpůrné role pokryje jen omezený počet lidí.
Účinek = plný účinek × min(1, počet role poblíž × covers / lidí poblíž).
| Role | pokryje | plný účinek |
|---|---|---|
| Kulometčík | 4 nepřátelské střelce | −45 % jejich palby |
| Spojař | 10 vlastních vojáků | −20 % zásahů z pozadí |
| Důstojník / spojka | 12 / 8 střelců | +20 % / +25 % palby |
| Kuchař | 4 lehce raněné | hojení +30 %, zhoršení −50 % |
| Kaplan | 3 kriticky raněné na nosítkách | smrt −20 % |
| Medik (beze změny) | práce 1/den | už dřív se dělila mezi raněné |
Každý další voják role tak pomůže a nikdo nemůže být nezranitelný. Ochrany se násobí a mají stropy
(potlačení max 45 % jen palby hráčů, spojař 20 %, pytle 24 %, drát 15 %, zkušenost 40 %). Denní minimum navíc
zaručí aspoň 2 raněné na stranu každý den.

**Simulace na soupisce z 11. 11.** (Hegemony 86, Concord 90; 40 běhů × 21 dní; na stranu a týden):
| Scénář | padlí Hegemony | padlí Concord | zásahy |
|---|---|---|---|
| klid, jen obvaziště | ~5,9 (má jen 6 mediků) | ~2,6 | 23–25 |
| klid, obě strany s nemocnicí | ~0,6 | ~0,3 | 24–26 |
| Concord pod granáty (týden s 3 dny bombardování) | ~4,5 | **~10,8** | Con 32 |
| Hegemony pod granáty | **~12,6** | ~1,8 | Heg 30 |
Cílová čísla (KPI) v `tools/sim-battle.mjs` posunutá: padlí za klidu 1,5–3 na 50 vojáků týdně, bombardovaná strana 12–20 za 21 dní. Všechna jsou v pásmu.
Přínos rolí ověřen (`--roles`): medik, kuchař, kulomet a spojař výrazně snižují ztráty, kaplan dál slabý.

---

## 2026-11-11 · Vyvážení v8: lůžka pevná, škálují medici · NÁVRH (simulováno, NENASAZOVAT bez schválení)
**Zadání uživatele:** nemocnice jen hlasováním a pevně 4 lůžka; škálovat smí jen to, co volí hráči (medici, role).
Ve válce se má umírat občas, víc než teď a hodně při bombardování. Strany budou mít různé složení rolí i velikost.
**ZAMÍTNUTO:** lůžka rostoucí s velikostí strany (`capacityPer`), z kódu odstraněno.

**Proč v7 nevyhovuje** (matice `docs/sim/2026-11-11_full_v7.txt`):
- dnešní stav (88 na stranu, 1 nemocnice): ~0,1 padlého denně na stranu, bombardování ~0,2/den;
- při 10× (880 na stranu): 9–14 padlých denně i za klidu. Nosítka jsou pevně 10, kritický bez nosítek noc nepřežije,
  a 4 lůžka nic nezmění. Při velké hře by tak umírali hlavně ti, na které nezbyla nosítka.

**Návrh v8 (doporučená verze TVRDŠÍ, mírnější STŘEDNÍ pro srovnání):**
| | v7 | v8 |
|---|---|---|
| lůžka | obvaziště 2, nemocnice 4 (jen hlasováním) | **beze změny** |
| nosítka | pevně 6 (+4 za nemocnici) | 6 (+4 za nemocnici) **+ 1 za každého medika** (`aidPost.stretchersPerMedic`) |
| práce medika za den | 1 | **2** (nosítkový tým; potřeba lehce 1, těžce 2, kriticky 2) |
| smrt kritického za noc (základ, nosítka s plnou péčí) | 9 % | **35 %** (střední 30 %) |
| riziko na lůžku: obvaziště / nemocnice | 0,6 / 0,4 | **0,8 / 0,4** (lůžko v nemocnici = poloviční riziko) |
| kritický na lůžku do zlepšení | 2 noci | **3 noci** |
| kritické zásahy z pozadí | 15 % | **21 %** (střední 18 %) |
| bombardování: zásah / mez | 40 % / 8 na 80 | **50 % / 12 na 80** |
| bombardování: lehce / těžce / kriticky | 45 / 35 / 20 % | **30 / 40 / 30 %** |
| přímý zásah granátem (nový) | – | **50 % kritických zásahů granátem zabije na místě** (`shell.kill`) |
Parametry pro simulaci: TVRDŠÍ `--set aidPost.stretchersPerMedic=1 --set care.crit.stabilizeBed=3 --set shell.kill=0.5 --set shell.severity.light=0.7 --set shell.severity.heavy=0.3 --set daily.shellMax=12 --set shell.hit=0.5 --set roles.medic.work=2 --set aidPost.critRisk=0.8 --set buildings.dugout.critRisk=0.4 --set care.crit.dieBase=0.35 --set severity.heavy=0.21` · STŘEDNÍ `--set aidPost.stretchersPerMedic=1 --set care.crit.stabilizeBed=3 --set shell.kill=0.5 --set shell.severity.light=0.7 --set shell.severity.heavy=0.3 --set daily.shellMax=12 --set shell.hit=0.5 --set roles.medic.work=2 --set aidPost.critRisk=0.8 --set buildings.dugout.critRisk=0.4 --set care.crit.dieBase=0.3 --set severity.heavy=0.18`

**Výsledky TVRDŠÍ** (padlí DENNĚ na stranu, v závorce na 100 vojáků; `docs/sim/2026-11-11_full_hard.txt`):
| Klidná fronta | ×1 (Heg 86 / Con 90) | ×10 (860 / 900) |
|---|---|---|
| skutečné role, 1 nemocnice každá (stav hry) | **0,21 / 0,21** (~1,5 týdně na stranu) | 4,8 (0,55) / 3,8 (0,42) |
| Heg 3 nemocnice / Con žádná | 0,17 / 0,31 | 3,1 (0,36) / 3,9 (0,43) |
| Heg 3 % mediků / Con 15 % mediků (1 nemocnice) | 0,44 / 0,27 | 9,4 (1,09) / 3,9 (0,43) |
| Heg 35 % kulometů / Con 30 % odstřelovačů | 0,41 / 0,38 | 4,3 (0,50) / 8,5 (0,95) |
| ×10 / ×3 (Heg 860 / Con 270), skutečné role | – | 2,5 (0,29) / 2,8 (1,04) |

| Bombardování (Concord poražen) | ×1 | ×10 |
|---|---|---|
| Concord za den pod granáty | **2,1** (nejhorší den 4–5) | **27** |
| Concord za 7 dní od dobytí kóty, 1 nemocnice | **13 (15 % strany)** | 188 (21 %) |
| totéž bez nemocnice | 17 (19 %) | 197 (22 %) |
| totéž s 15 % mediků | 12 (14 %) | 155 (17 %) |

**Co z toho plyne:**
- **Medici rozhodují při každé velikosti.** 3 % mediků znamená 2–2,5× víc padlých než 15 %. Účinek roste s počtem mediků, dokud nepokryjí všechny raněné (~13–15 %).
- **Nemocnice pomáhá hlavně malé straně nebo při málo medicích.** Při ×1 sníží úmrtí asi o třetinu, 3 nemocnice proti žádné asi na polovinu.
  Při ×10 jedna nemocnice (4 lůžka) skoro nic neudělá, 3 nemocnice sníží úmrtí asi o třetinu. Velká strana potřebuje víc hlasování o nemocnicích,
  zvážit vyšší strop než 6 nemocnic.
- **Bombardování je znatelné** (13–28 % strany za týden). Přímý zásah granátem zabíjí i stranu s plnou nemocnicí.
- **Menší strana trpí víc:** při 860 proti 270 umírá menší strana ~3,5× víc na hlavu (střílí na ni víc nepřátel). To je motivace verbovat.
- **Dlouhá hra** (60 dní, `docs/sim/2026-11-11_long_mid.txt`): zkušenosti a úrovně mediků úmrtí postupně snižují, asi o třetinu proti prvním 14 dnům.

**Hotovo v kódu (vypnuté, dokud se nenastaví čísla):** `aidPost.stretchersPerMedic`, `shell.kill` + texty `killedShell` a příčina smrti `shell`,
nástroje `tools/sim-daily.mjs` (padlí po dnech, klon soupisky ×N) a `tools/sim-matrix.mjs` (matice velikost × složení rolí × nemocnice × bombardování).
**Před nasazením:** schválení uživatele, úprava `docs/BATTLE.md`, `COMBAT_ROLES.md`, KPI v `tools/sim-battle.mjs`, testy na nová čísla, náhled vydání.

---

## 2026-11-11 · OVER THE TOP: útok přes zákop · NÁVRH (čeká na rozhodnutí)
Jedna strana jednou za 5–6 dní vyrazí v daných úsecích do útoku. Gazette to ohlásí den předem („At dawn the Concord goes over the top at …“),
večerní reel na to může navázat.
- Útočníci v úsecích útoku: 25–30 % šance na zásah, obránci ~10 %. Ten den vyšší mez raněných (8–12 na 80 vojáků).
- Zahlcené obvaziště → padlí z nedostatku lůžek (pravidlo „zásah sám nezabíjí“ platí dál).
- Kulomety obránců snižují ztráty útočníků (podle poměru, viz `covers`), drát ženistů útok brzdí, medici zachraňují.
- Úspěšný útok dává body do závodu o kótu (např. +5).
- Slova „assault“ / „over the top“, ne „raid“ (výpravy jsou vypnuté).
- **Otevřené otázky pro uživatele:** spouštět útoky samy (střídavě, náhodně), nebo hlasováním strany? Kolik bodů do závodu?

---

## Dřívější rozhodnutí (shrnutí)
- **2026-11-10 · Vyvážení v6 · NASAZENO:** zásah sám nezabíjí, zabije chybějící lůžko, nosítka nebo medik; obvaziště 2 lůžka a 6 nosítek; nemocnice jen hlasováním;
  děla mlčí do první dobyté kóty; po výhře 3 dny bombardování poraženého (`docs/BATTLE.md`).
- **2026-11-10 · Výpravy (raid) · VYPNUTO** na pokyn uživatele (`theme.valley.enabled = false`).
- **2026-11-11 · Hlasování jen jedno najednou · NASAZENO.**
- **2026-11-11 · Nezvěstný (missing) není smrt · NASAZENO:** vrátí se do 4 dnů; rodokmen ukazuje skutečný stav.
