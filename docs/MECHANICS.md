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

## 2026-11-11 · Nemocnice: smrt i na lůžku (v8) · NÁVRH (čeká na rozhodnutí)
**Zjištění:** obě strany mají od Dne 3 nemocnici (`built.dugout = 1`). S nemocnicí v7 padne jen ~0,3–0,6 vojáka na stranu týdně,
protože 4 lůžka stačí pro všechny kritické a na lůžku umírá jen 3,6 % za noc. Nemocnice tak smrt skoro vypne, místo aby ji jen snížila.
**Kdo co dělá:** lůžka (nemocnice) zachraňují kriticky raněné, medici drží lehce a těžce raněné, aby se nezhoršili do kritického stavu.
Dvojnásobná práce mediků bez nemocnice: Hegemony ~1,2, Concord ~0,9 padlých týdně.
**Návrh v8:** `care.crit.dieBase` 0,09 → 0,2, `buildings.dugout.critRisk` 0,4 → 0,8, `care.crit.stabilizeBed` 2 → 3.
Simulace (30 × 21 dní, na stranu a týden): bez nemocnice Heg ~6,4 / Con ~2,9 padlých, **s nemocnicí Heg ~1,6 / Con ~1,3**
(nemocnice pořád snižuje úmrtí asi 2–4×, ale neodstraní je).

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
