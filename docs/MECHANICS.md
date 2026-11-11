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

## 2026-11-11 · Vyvážení v8: válka, ve které se umírá (kapacita roste s hráči, smrt i na lůžku, přímé zásahy granátem) · NÁVRH (čeká na schválení)
**Zjištění z v7:**
1. Obě strany mají od Dne 3 nemocnici. 4 lůžka stačí pro všechny kritické a na lůžku se skoro neumírá, takže v7 dává jen ~0,1 padlého na stranu denně.
2. Lůžka a nosítka **nerostou s počtem hráčů**, ale ranění od v7 ano. Při 10× hráčů je nemocnice bez účinku (4 lůžka na 900 vojáků)
   a umírá 10–14 lidí denně na stranu i za klidu.
3. Bombardování při 1× skoro nezabíjí (~3 padlí za týden), protože nemocnice zásahy pohltí.

**Návrh v8 (varianta G30):**
| | v7 | v8 |
|---|---|---|
| lůžka a nosítka (obvaziště i nemocnice) | pevně 2/6, nemocnice +4/+4 | **na 80 vojáků strany** (`battle.capacityPer: 80`), rostou s velikostí strany |
| smrt kritického za noc (základ) | 9 % | **30 %** |
| riziko na lůžku: obvaziště / nemocnice | 0,6 / 0,4 | 0,6 / **0,8** |
| kritický na lůžku do zlepšení | 2 noci | **3 noci** |
| bombardování: zásah v úseku | 40 % | **50 %** |
| bombardování: lehce / těžce / kriticky | 45 / 35 / 20 % | **30 / 40 / 30 %** |
| bombardování: mez raněných | 8 na 80 | **12 na 80** |
| **přímý zásah granátem** (nový) | – | **50 % kritických zásahů granátem zabije na místě** (`shell.kill`), nepomůže lůžko ani medik |
Pravidlo „zásah sám nezabíjí“ platí dál pro kulky. Granát po dobytí kóty zabíjet může.

**Simulace padlých DENNĚ na stranu** (`node tools/sim-daily.mjs --scale 1|10`, 20 / 4 běhy × 21 dní):
| Scénář | v7 ×1 | **v8 ×1** (Heg 86 / Con 90) | v7 ×10 | **v8 ×10** (Heg 860 / Con 900) |
|---|---|---|---|---|
| klid, obě s nemocnicí (stav hry) | 0,12 / 0,09 | **0,32 / 0,25** (≈ 2 týdně) | 14,4 / 10,3 | **2,1 / 2,3** |
| klid, jen obvaziště | 0,84 / 0,38 | **0,87 / 0,50** | 14,9 / 12,1 | **9,0 / 2,0** |
| Concord pod granáty: dny bombardování | 0,18 | **2,15 / den** (nejhorší 4) | 12,2 | **21,9 / den** (nejhorší 31) |
| Concord: padlí za 7 dní od dobytí kóty | 3,0 | **14,1** (~16 % strany) | 152 | **146** (~16 % strany) |
Per capita vychází 1× a 10× stejně, takže hra se chová stejně při jakémkoli počtu hráčů.
Nemocnice snižuje úmrtí 2–4× (při 10× Hegemonie 9,0 → 2,1), medici rozhodují bez nemocnice (Hegemonie má polovinu mediků Concordu → víc padlých).
Pojistka (nejvýš 5 % strany za den) zůstává.

**Hotovo v kódu (vypnuté, dokud se nenastaví čísla):** `battle.capacityPer`, `battle.shell.kill`, texty `killedShell`, příčina smrti `shell`
(„Killed outright by a shell“ v rodokmenu), nástroj `tools/sim-daily.mjs`.
**Před nasazením ještě:** mapa nemocnice musí umět víc lůžek než 4 na budovu (při 10× by jich bylo ~40).

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
