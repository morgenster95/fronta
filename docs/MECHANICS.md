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

## 2026-11-11 (večer) · Vyvážení v10: válka palbou hráčů · NAHRAZENO v11 a v12 (základ: palba hráčů, nasycení, triáž, smrt na místě)
Nahrazuje návrh v8 (lůžka pevná, nosítka podle mediků), který zůstává jako součást v10. **v8 samostatně: ZAMÍTNUTO**,
protože ztráty pořád byly malé („~1,5 týdně“) a palba hráčů skoro nic neznamenala.

**Zadání uživatele:** žádný „klid“ (každý střelec má šanci trefit), umírat se má mnohem víc, hlavně ve velkých číslech.
Menší strana smí umírat víc, ale ne když má víc střelců a kulometů. Lůžka pevná (nemocnice jen hlasováním), škálují medici a role.

**Co bylo špatně ve v7** (`docs/sim/2026-11-11_v7_roles_asym.txt`):
- puškař trefil 0,12× za týden (1× za ~8 týdnů), kulomet 0,25×, ostřelovač 0,27×;
- palba hráčů dělala jen ~35 % zásahů, zbytek byl zásah z pozadí s pevnou denní mezí. Složení stran tak skoro nic neměnilo;
- strana 270 proti 870 dostávala 18 zásahů denně a sama dávala 3, bez ohledu na to, kolik měla kulometů.

**Jak to řeší jinde:** u palných zbraní platí Lanchesterův zákon: ztráty strany rostou s palbou nepřítele
([Lanchester's laws](https://en.wikipedia.org/wiki/Lanchester%27s_laws)). Čistá „druhá mocnina“ ale v zákopech neplatí (cíle jsou kryté).
V praxi se používá kombinace s exponentem kolem 1,5. Klidné úseky 1. světové války: ztráty hlavně od odstřelovačů a občasného ostřelování,
smrt jednou za den nebo dva na prapor, a polovina všech mrtvých připadla na pár dní velkých akcí
([Great War Forum: quiet areas](https://www.greatwarforum.org/topic/28581-quiet-areas/), [intensity of warfare](https://www.greatwarforum.org/topic/239432-bef-1914-1918-intensity-of-warfare-concentration-of-fatalities/)).
Ve hře je to záměrně zhuštěné: denně se má něco stát.

**Návrh v10 (nové volby v kódu jsou vypnuté, dokud se nenastaví čísla):**
| | v7 | v10 |
|---|---|---|
| palba puškař / kulomet / ostřelovač za den | 2,8 / 4,5 / 6 % | **7 / 11 / 12 %** |
| kritické zásahy puškař / kulomet / ostřelovač | 12 / 5 / 25 % | **20 / 8 / 35 %** |
| **smrt na místě** po kritickém zásahu kulkou (nové, `roles.kill`) | – | **60 %, ostřelovač 80 %** (Gazette: „Shot by X“, střelec dostane `kills`) |
| nasycení palby (nové, `roles.saturation`) | – | **1**: střelec trefuje méně, když je u něj víc vlastních střelců než nepřátel na dostřel |
| potlačení kulometem | max 45 % | **max 30 %** |
| zásah z pozadí | 4 %, denní mez 2–5 na 80 | **1,5 %, bez meze** (jen pojistka 5 % strany padlých za den) |
| nosítka | 6 (+4 za nemocnici) | **+1 za každého medika** (`aidPost.stretchersPerMedic`) |
| práce medika / potřeba těžce raněného | 1 / 2 | **2 / 1** |
| triáž (nové, `care.triage`) | – | **kritický vezme lůžko nebo nosítka těžce raněnému** |
| smrt kritického za noc / riziko obvaziště / nemocnice | 9 % / 0,6 / 0,4 | **35 % / 0,8 / 0,4**, na lůžku 3 noci |
| bombardování: zásah / mez / kritické | 40 % / 8 na 80 / 20 % | **50 % / 15 na 80 / 30 %** |
| přímý zásah granátem (nové, `shell.kill`) | – | **50 % kritických zásahů granátem zabije na místě** |
Parametry pro simulaci: `--set aidPost.stretchersPerMedic=1 --set roles.medic.work=2 --set care.crit.dieBase=0.35 --set aidPost.critRisk=0.8 --set buildings.dugout.critRisk=0.4 --set care.crit.stabilizeBed=3 --set shell.kill=0.5 --set shell.severity.light=0.7 --set shell.severity.heavy=0.3 --set daily.shellMax=15 --set shell.hit=0.5 --set roles.saturation=1.5 --set roles.machinegunner.suppressMax=0.3 --set roles.kill=0.35 --set roles.sniper.kill=0.6 --set hit=0.02 --set daily.max=99 --set daily.min=1 --set care.triage=1 --set care.heavy.need=1 --set hit=0.015 --set roles.rifleman.severity.light=0.45 --set roles.rifleman.severity.heavy=0.2 --set roles.machinegunner.severity.heavy=0.08 --set roles.sniper.severity.heavy=0.35 --set roles.kill=0.6 --set roles.sniper.kill=0.8 --set roles.rifleman.fire=0.07 --set roles.machinegunner.fire=0.11 --set roles.sniper.fire=0.12 --set roles.saturation=1`

**Výsledky** (padlí na stranu DENNĚ, v závorce na 100 vojáků; `docs/sim/2026-11-11_v10_matrix.txt`, 60 dní `…_v10_long60.txt`):
| | v7 | **v10** |
|---|---|---|
| dnes (88 / 90), 1 nemocnice, klid | 0,1 | **0,47 / 0,52** (~3,5 týdně na stranu, obě strany ~7) |
| 10× (870 / 900), klid | 9–14 (spirála) | **3,8–5,4** (0,44–0,6), stabilní i po 60 dnech |
| bombardovaný den, ×1 / ×10 | 0,2 / 12 | **2,4–2,8 / 27–29** |
| poražený za 7 dní od dobytí kóty, ×1 / ×10 | 5 % / 17 % strany | **12–19 % / 14–23 %** |
| 870 proti 270, malá strana (skutečné role) | dává 3, dostává 18 | **dává 9,4, dostává 15** (0,71 / 0,21 na 100) |
| 870 proti 270, malá strana s 35 % kulometů a 13 % mediků | dává 3,6 | **dává 11, dostává 14** (padlí 0,64 na 100) |
| zásahů na puškaře / kulomet / ostřelovače za týden | 0,12 / 0,25 / 0,27 | **0,33 / 0,59 / 0,61** |
Příčiny smrti v klidu: ~85 % padne přímo zásahem kulkou, zbytek na zranění. Při bombardování rozhodují medici a nemocnice
(15 % mediků: 14 % strany za týden, 13 % mediků s kulomety: 23 %).

**Odmítnuté varianty a proč** (simulace v `docs/sim/`):
- v8/v9 (víc raněných, smrt hlavně z nedostatku péče): při 10× a 7 % mediků **spirála smrti**: ~25 padlých denně po 60 dnech,
  medici nestíhají, nosítka ucpaná (`…_v9_spiral.txt`). Proto v10 zabíjí víc přímo palbou a méně „z přetížení“.
- nasycení 1,5: malá strana dostávala 4,8× víc zásahů na hlavu a složení rolí skoro nehrálo roli. Nasycení 0,7 utlumí palbu i u stejně velkých stran.

**Otevřené otázky pro uživatele:**
1. V klidu teď skoro všechny smrti přijdou z kulek a medici s nemocnicemi rozhodují hlavně při bombardování. Chceš víc smrtí „na zranění“
   (pak víc váhy medikům a nemocnicím, ale hrozí spirála ve velkém)? Kompromis: smrt na místě 40 % místo 60 %, smrt kritického 45 %.
2. Ztráty ~0,5 na stranu denně při dnešní velikosti a ~4–5 denně při 10×: stačí, nebo víc?

---

## 2026-11-11 (noc) · v11 = v10 + víc zásahů střelců · NAHRAZENO v12 (v12 mění jen smrt na místě, smrt za noc a závažnost puškaře)
**Podnět uživatele:** puškař trefí 0,33× za týden (1× za 3 týdny), to je na válku málo; odstřelovači mají trefit víc.
**Nález:** v10 měl nominálně 7 % denně, po krytí cíle a nasycení zbylo 0,33× za týden. Zásahy jde zvednout, ale **každý zásah je zranění někoho jiného**,
takže víc zásahů znamená víc ranění i mrtvých. Řešení: víc zásahů, z nichž většina jsou **škrábnutí** (lehké zranění na 1 den), kritické a těžké zůstávají podobně časté.

**Změny proti v10:**
| | v10 | v11 |
|---|---|---|
| palba puškař / kulomet / ostřelovač za den | 7 / 11 / 12 % | **17 / 26 / 30 %** |
| závažnost puškaře lehce / těžce / kriticky | 55 / 25 / 20 % | **82 / 10 / 8 %** |
| závažnost kulometu | 70 / 22 / 8 % | **75 / 21 / 4 %** (`light .25, heavy .04`) |
| závažnost ostřelovače | 35 / 30 / 35 % | **45 / 25 / 30 %** |
| ošetření lehce raněného (potřeba práce medika / šance sám se zahojit) | 1 / 15 % | **0,4 / 40 %** (škrábnutí nežere práci mediků) |
| strop raněných pod granáty | 15 na 80 | **30 na 80** (palba hráčů se do něj počítá, jinak by bombardování zaniklo) |
Parametry pro simulaci: `--set aidPost.stretchersPerMedic=1 --set roles.medic.work=2 --set care.crit.dieBase=0.35 --set aidPost.critRisk=0.8 --set buildings.dugout.critRisk=0.4 --set care.crit.stabilizeBed=3 --set shell.kill=0.5 --set shell.severity.light=0.7 --set shell.severity.heavy=0.3 --set daily.shellMax=15 --set shell.hit=0.5 --set roles.saturation=1.5 --set roles.machinegunner.suppressMax=0.3 --set roles.kill=0.35 --set roles.sniper.kill=0.6 --set hit=0.02 --set daily.max=99 --set daily.min=1 --set care.triage=1 --set care.heavy.need=1 --set hit=0.015 --set roles.rifleman.severity.light=0.45 --set roles.rifleman.severity.heavy=0.2 --set roles.machinegunner.severity.heavy=0.08 --set roles.sniper.severity.heavy=0.35 --set roles.kill=0.6 --set roles.sniper.kill=0.8 --set roles.rifleman.fire=0.07 --set roles.machinegunner.fire=0.11 --set roles.sniper.fire=0.12 --set roles.saturation=1 --set roles.rifleman.fire=0.17 --set roles.rifleman.severity.light=0.18 --set roles.rifleman.severity.heavy=0.08 --set roles.machinegunner.fire=0.26 --set roles.machinegunner.severity.light=0.25 --set roles.machinegunner.severity.heavy=0.04 --set roles.sniper.fire=0.30 --set roles.sniper.severity.light=0.55 --set roles.sniper.severity.heavy=0.3 --set care.light.need=0.4 --set care.light.baseHeal=0.4 --set daily.shellMax=30`

**Zásahů na střelce v přední linii za týden:**
| role | v10 | **v11** |
|---|---|---|
| puškař | 0,32 | **0,85** (1 zásah za ~8 dní) |
| kulometčík | 0,58 | **1,4** |
| odstřelovač | 0,59 | **1,65** |
| při 870 proti 270: velká strana / malá strana | – | 0,42 / ~0,85 (nasycení: když je nepřátel málo, velká strana se „překáží“) |

**Padlí denně na stranu** (v závorce na 100 vojáků; `docs/sim/2026-11-11_v11_*.txt`):
| | v10 | **v11** |
|---|---|---|
| dnes (88 / 91), klid | 0,50 / 0,51 | **0,5–0,65 / 0,65–0,8** |
| 10× (880 / 910), klid, skutečné role | 4,3 / 5,8 | **5,3 / 7,6** (0,6 / 0,8) |
| strana s 3 % mediků při 10× | 4,3 | **22** (2,5 na 100): medici rozhodují; stabilní, ne spirála |
| strana s 15 % mediků při 10× | 4,8 | **5,9** |
| den bombardování, dnes / 10× | 2,4 / 27 | **2,2 / 30** |
| poražený za týden od dobytí kóty, dnes / 10× | 12–19 % / 14–23 % | **16 % / 25 %** |
| 870 proti 270, malá strana | 0,75 na 100 | **0,97 na 100** |
| raněných za den na stranu (hlavně lehce) | 4 | **8–10** (dnes) |
Rozdíl proti v10: ~15–30 % víc padlých, mnohem víc zásahů a „zranění“ (lehká jsou škrábnutí na den, každý voják je během týdne aspoň jednou škrábnutý).

**Zjištění při ladění:**
- Bez levnějšího ošetření lehkých (potřeba 1) se při 10× hráčů a 3–7 % medicích vrátila spirála smrti (400 padlých „bez nosítek“ za 28 dní):
  lehká zranění nacpala medikům práci. Proto `care.light.need 0,4`.
- Bez zvýšeného stropu pod granáty bylo bombardování jen 11 % strany za týden, protože palba hráčů vyčerpala denní strop dřív než granáty.
- Zbývá otázka z v10: smrt je v klidu hlavně od kulky (~85 %), medici a nemocnice rozhodují hlavně při bombardování a u strany s málo medici.

---

## 2026-11-11 (noc) · v12 = v11 + smrt hlavně z nedostatku míst, spojař proti granátům · NASAZENO (od ranního vydání 12. 11. 2026, 13:00 UTC; `theme.battle.balance: 12`)
**Podnět uživatele:** ve v11 většina mrtvých padla přímo kulkou (~85 %). Logičtěji: pár mrtvých, pár raněných, pár kriticky, a pak dojdou lůžka, nosítka a medici.
**Změny proti v11:**
| | v11 | v12 |
|---|---|---|
| smrt na místě po kritickém zásahu kulkou (`roles.kill`) / ostřelovač | 60 % / 80 % | **20 % / 35 %** |
| smrt kritického za noc (`care.crit.dieBase`) | 35 % | **50 %** (nosítka s plnou péčí; lůžko ×0,8 / ×0,4 v nemocnici; bez péče až +70 %) |
| závažnost puškaře lehce / těžce / kriticky | 82 / 10 / 8 % | **83 / 7 / 10 %** (víc kritických, aby se plnila lůžka) |
| spojař proti granátům (`roles.signaller.counterShell`) | vypnuto | **0,4** |
Parametry pro simulaci: `--set aidPost.stretchersPerMedic=1 --set roles.medic.work=2 --set care.crit.dieBase=0.35 --set aidPost.critRisk=0.8 --set buildings.dugout.critRisk=0.4 --set care.crit.stabilizeBed=3 --set shell.kill=0.5 --set shell.severity.light=0.7 --set shell.severity.heavy=0.3 --set daily.shellMax=15 --set shell.hit=0.5 --set roles.saturation=1.5 --set roles.machinegunner.suppressMax=0.3 --set roles.kill=0.35 --set roles.sniper.kill=0.6 --set hit=0.02 --set daily.max=99 --set daily.min=1 --set care.triage=1 --set care.heavy.need=1 --set hit=0.015 --set roles.rifleman.severity.light=0.45 --set roles.rifleman.severity.heavy=0.2 --set roles.machinegunner.severity.heavy=0.08 --set roles.sniper.severity.heavy=0.35 --set roles.kill=0.6 --set roles.sniper.kill=0.8 --set roles.rifleman.fire=0.07 --set roles.machinegunner.fire=0.11 --set roles.sniper.fire=0.12 --set roles.saturation=1 --set roles.rifleman.fire=0.17 --set roles.rifleman.severity.light=0.18 --set roles.rifleman.severity.heavy=0.08 --set roles.machinegunner.fire=0.26 --set roles.machinegunner.severity.light=0.25 --set roles.machinegunner.severity.heavy=0.04 --set roles.sniper.fire=0.30 --set roles.sniper.severity.light=0.55 --set roles.sniper.severity.heavy=0.3 --set care.light.need=0.4 --set care.light.baseHeal=0.4 --set daily.shellMax=30 --set roles.kill=0.2 --set roles.sniper.kill=0.35 --set care.crit.dieBase=0.5 --set roles.rifleman.severity.light=0.17 --set roles.rifleman.severity.heavy=0.10 --set roles.signaller.counterShell=0.4`

**Příčiny smrti** (4 běhy × 40 dní; zápis „hned kulkou / na lůžku / bez péče a nosítek“):
| Situace | hned kulkou | na lůžku + bez péče/nosítek | podíl „z nedostatku místa a péče“ |
|---|---|---|---|
| dnes (~90), skutečné role | 29–52 | 41–51 | ~50–60 % |
| dnes, 3 % mediků | 28 | 115 | **80 %** |
| 10× (~900), skutečné role | 148–235 | 292–409 | **~64 %** |
| 10× se 3 % mediků | 140 | 1 596 | **92 %** |
**v11 měla stejné celkové počty mrtvých (v12 ~ ±10 %), ale ~85 % bylo od kulky.** Střelba teď dělá raněné a kritické, umírají přeplněné obvaziště a nemocnice.
Stabilní i po 60 dnech (`docs/sim/2026-11-11_v12_long60.txt`): žádná spirála; strana se 3 % medici ztrácí ~2 % stavu denně.

**Padlí denně na stranu (v závorce na 100):** dnes 0,41–0,66 (0,46–0,71), při 10× 5,0–7,4 (0,56–0,80), strana se 3 % medici při 10× 18 (2,1).
**Bombardování** (poražená strana, za 7 dní od dobytí kóty): dnes 11–20 % (skutečné role 11 %, 30 % odstřelovačů 20 %), při 10× 16–28 %. S mediky 15 % vždy nejméně.
**Střelci:** puškař 0,40 zásahu za týden při 870 proti 270 na velké straně (nasycení), ve vyrovnaných stranách ~0,85.

---

## 2026-11-11 (noc) · Bombardování a složení stran (v11) · NASAZENO jako součást v12 (spojař proti granátům `counterShell` 0,4)
**Otázka uživatele:** záleží u bombardování na složení rolí, ne jen na počtu lidí? Testováno na VYROVNANÝCH stranách (88 / 92 a 880 / 920), poražená (bombardovaná)
strana má různé složení, vítěz skutečné role. Padlí za 7 dní od dobytí kóty (3 dny granátů + 4 dny doznívání), v11, 1 nemocnice:
| Složení bombardované strany | medici | dnes (~92) | 10× (~920) | s `counterShell=0,4` dnes / 10× |
|---|---|---|---|---|
| skutečné role (7 % mediků) | 12 | 14,7 % | 24,5 % | 11,4 % / 18,9 % |
| 15 % mediků | 14 | 16,5 % | 17,0 % | 13,2 % / 15,2 % |
| 35 % kulometů, 5 % mediků | 5 | **23,7 %** | **30,8 %** | 21,0 % / 28,5 % |
| 30 % odstřelovačů, 6 % mediků | 5 | **23,2 %** | **29,3 %** | 20,8 % / 26,9 % |
| 60 % střelců, 8 % mediků | 11 | 19,2 % | 30,1 % | 16,5 % / 29,2 % |
| 35 % kulometů + 13 % mediků | 14 | 16,8 % | 27,1 % | 13,8 % / 20,7 % |
| 55 % střelců + 13 % mediků | 16 | 17,0 % | 27,9 % | 15,0 % / 26,5 % |
**Závěr:** granáty zasahují všechny role stejně (kdo už leží raněný, se nezraňuje znovu). Rozdíl dělá, kolik je mediků, kuchařů, kaplanů a spojařů, a zda je nemocnice.
Strana s 5 % medici ztratí o 7 bodů víc než strana s 14 % (dnes), při 10× o 6–13 bodů. Kulomet ani odstřelovač bombardování nesnižují.
**Zjištěná mezera:** spojař (protipalba) dosud nepůsobil proti granátům. Přidáno **volitelně** `roles.signaller.counterShell` (vypnuto, 0): snižuje zásahy granátem v okolí spojaře podle pokrytí (jeden spojař pokryje 10 vojáků).
S hodnotou 0,4 klesnou ztráty bombardované strany o ~3 body dnes a ~5 bodů při 10× u skutečného složení. Návrh: zapnout 0,4 s v11 (rozhodnutí uživatele).
**Poznámka:** dřívější řádek „malá strana proti velké“ (870 proti 270) byl jiný test, o nerovné velikosti. Bombardování na velikosti strany nezávisí, jen na úsecích a složení.

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

- **2026-11-12 · Ochrana nováčků VYPNUTA · NASAZENO (vyvážení v13):** `theme.battle.newbieDays` 3 → 0 na pokyn uživatele. Dřív první 3 dny služby kulka nezpůsobila kritický zásah a rána se nezhoršovala (granát nováčky nešetřil už dřív).
  Teď platí stejná pravidla pro všechny od prvního dne. Důvod: každý hráč má mít stejné riziko, nováčci nejsou „nezranitelní“. Padlý má nástupce hned v téže noci (`generation` + 1, záznam v `fallen`), nástupce se počítá jako nová služba.

- **2026-11-12 · Hlasování s vlastní nabídkou pro každou stranu + nové druhy rozkazů · NASAZENO (engine), hlasování samotné NÁVRH:** `vote.options[].only` (0 = Hegemonie, 1 = Concord) určuje, kdo si možnost smí vybrat (cizí heslo → bot odpoví nabídkou té strany).
  Nové rozkazy v `engine/orders.js`: `shell` (násobek zásahů granátem), `fire` (násobek palby, číslo nebo podle role), `heal` (hojení), `stretchers` (nosítka navíc), `medics` (práce mediků navíc), `mine` (po 3 dnech vybuchne pod 3 nejlidnatějšími úseky nepřítele, `theme.battle.mine`).
  Návrh nabídky po dobytí Verdel Ridge (vliv na 3 dny z dnešního stavu, `node /tmp/opts.mjs` = simulace 40 běhů): **Hegemonie** DUGOUTS (`shell` 0,7, jen proti bombardování: o 1,8 padlého a 6 raněných méně; na mapě kryty u zálohy, `web/src/orders-fx.js`), DOCTOR (`die` 0,5 + `heal` 1,5: o 1,2 padlého méně; na mapě lékař u obvaziště), COUNTERFIRE (`guns` 0,7 = protipalba, o 30 % méně ostřelovaných úseků: o ~1,8 padlého méně; na mapě dopady za nepřátelskou linií) – STORM (palba ×1,4, `exposed` 1,5) jsme zamítli: nedávalo smysl (všichni střílí víc, ale jsou víc vidět), `exposed` zůstává v enginu;
  **Concord** SNIPERS (`fire` sniper 1,8: nepřítel +1,2 padlého), VICKERS (`fire` machinegunner 1,8: +4 raněných), MINE (nepřítel +1,6 padlého a +9 raněných jednorázově). Historické vzory: Hindenburgova linie, sanitní roty, Sturmtruppen 1918; sniperské školy 1915, Machine Gun Corps 1915, Messines 1917.

- **2026-11-12 · Hlasování o rozkazech: tři stejné volby pro všechny, stejný účinek pro obě strany, funkční kdykoli · SCHVÁLENO (pokyn uživatele):** jedno hlasování, strany počítají hlasy každá za sebe.
  DUGOUTS (`shell` 0,7 + `exposed` 0,7: méně zásahů granáty i palbou), DOCTOR (`die` 0,5 + `heal` 1,5), AMMO (`fire` 1,4: vlastní střelci střílejí o 40 % víc, tedy v průměru víc zásahů; ne přesnější). Všechny fungují vždy (i bez bombardování), na obou stranách.
  Simulace 3 dnů (padlí/ranění): Hegemonie bez voleb 7,6/55 → DUGOUTS 5,2/40, DOCTOR 6,3/55, AMMO nepříteli +9 raněných; Concord bez voleb 2,3/30 → DUGOUTS 1,9/21, DOCTOR 1,7/30, AMMO Hegemonii +1,2 padlého a +9 raněných.
  V enginu zůstávají (nepoužité): nabídka podle strany (`option.only`, `option.byFaction`) a rozkazy `guns`, `barrage`, `mine`, `medics`, `stretchers`. Zamítnuto: STORM (nedávalo smysl), dvě odlišné nabídky pro každou stranu (uživatel chce jednu společnou).

- **2026-11-12 · Držení pozic a noční výpravy (útok/obrana, opevnění) · NÁVRH (rozhodnutí uživatele: děla se NEpřehazují, držení slouží jen k určení, kdo vede):** hra nemá konec (vítězství by ji ukončilo), proto má mapa (kóty a místa údolí) majitele a „kdo vede“ se počítá z držených pozic.
  Zatím jen návrh, nic nepostaveno. Výpravy jsou stále vypnuté (`valley.enabled = false`) a zapnou se jen s výslovným souhlasem uživatele.
  Princip: každé místo má majitele a stupeň opevnění; večer strana hlasuje, kam zaútočí; druhá strana se hlásí k obraně; ráno v novinách se střetnou družstva (role, počasí, opevnění). Pozice se jen drží (žádný vliv na bombardování), počítají se body za držené pozice a dny držení.
  Otevřené: rytmus (denně / 2–3 dny), úmrtí při výpravě ano/ne, jak se vedení ukáže (horní panel, War Room), zda je „sezóna“ s resetem.

## Dřívější rozhodnutí (shrnutí)
- **2026-11-10 · Vyvážení v6 · NASAZENO:** zásah sám nezabíjí, zabije chybějící lůžko, nosítka nebo medik; obvaziště 2 lůžka a 6 nosítek; nemocnice jen hlasováním;
  děla mlčí do první dobyté kóty; po výhře 3 dny bombardování poraženého (`docs/BATTLE.md`).
- **2026-11-10 · Výpravy (raid) · VYPNUTO** na pokyn uživatele (`theme.valley.enabled = false`).
- **2026-11-11 · Hlasování jen jedno najednou · NASAZENO.**
- **2026-11-11 · Nezvěstný (missing) není smrt · NASAZENO:** vrátí se do 4 dnů; rodokmen ukazuje skutečný stav.

---

## Provoz v12 (co sledovat první týden)
- **Nasazeno 2026-11-12 ráno** (první vydání s v12). Testy 53/53, náhled vydání zkontrolován (`node tools/preview-tick.mjs`).
- Očekávání na dnešní velikost (~90 na stranu): **0,4–0,65 padlých denně na stranu**, ~8–10 raněných denně (většina škrábnutí), bombardovaná strana za týden 11–20 % stavu.
- Sleduj `state.battle.stats` (příčiny smrti `deaths.nobed/nocare/wounds/shell/shot`): má vycházet ~60 % smrtí z nedostatku míst a péče. Pokud ne nebo je padlých víc, než chceš,
  ladí se jedním číslem v `theme.json` → `battle`: `care.crit.dieBase` (smrt za noc), `roles.kill` (smrt na místě), `roles.rifleman.fire` (palba), `shell.hit` (bombardování); při změně zvýšit `balance`.
- Simulace nanečisto: `node tools/sim-matrix.mjs --eff --causes` (velikosti × složení × nemocnice × bombardování), `node tools/sim-daily.mjs --scale 10`, `node tools/sim-battle.mjs --kpi`.
