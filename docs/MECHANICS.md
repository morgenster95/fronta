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

## 2026-11-12 · Vyrovnání poručíků · NASAZENO
- **Proč:** poručík (role Lieutenant, hodnost Second Lieutenant) se dá získat jen losem při narukování (váha 4 ze 100) a povýšení končí na Staff Sergeant.
  Kdo si napíše roli, poručíka nedostane, a tak měla Hegemonie 6 poručíků a Concord 1 (poručík dává vojákům kolem sebe +20 % palby a +25 % zkušeností).
- **Pravidlo (`balanceOfficer` v `engine/roster.js`, `theme.officerBalance`):** nováček strany, která má méně živých poručíků než druhá strana, je poručík.
  Když si v náborovém komentáři napíše roli („CONCORD medic“), dostane roli (přání vyhraje). Strana, která má poručíků víc, nového nedostane. Při rovnosti platí běžné losování.
  Vypíná se samo, jakmile se počty srovnají; úplně vypnout: `"officerBalance": false`. Stávajícím vojákům se role nemění.
- Odpověď bota na přání poručíka (2026-11-12): „Lieutenants aren't requested, the front chooses them.“ (dřív „jen povýšením“, což neplatilo). Povýšení na poručíka uživatel zatím nechce.

## 2026-11-12 · Podpora hry (Ko-fi): War Bonds NASAZENO, Trench Dog NÁPAD
- **Jednorázový dar = War Bonds · NASAZENO 2026-11-12:** dobrovolný, jedna stužka bez stupňů a bez počítání darů; jen čest, žádná herní výhoda.
  Stužka u jména a řádek „War Bonds kept the front running“ na kartě, v albu rodu (🎗), na obrázku „I ENLISTED“ ke sdílení (pod First Wave), zápis do deníku
  a jednou řádka „The front thanks: …“ v příštích novinách (víc dárců téhož dne v jedné řádce). Udělení: `data/commands.json` `{ "id": "support-<handle>-<datum>", "cmd": "support", "handle": "<ig>" }`
  (`grantSupport` v `engine/roster.js`, texty `theme.support`).
  Texty od 2026-11-12 večer: deník „{name} bought War Bonds for the front. The quartermaster pinned the ribbon on personally: 'The front remembers who kept it fed.'“,
  noviny „The front thanks {names}, who bought War Bonds and kept the guns fed.“, karta „War Bonds: supported the making of Mud & Iron“ (dluhopisy kupuje hráč, podpora tvůrce řečená napřímo).
  Výjimka z nedotknutelných deníků (na pokyn uživatele): u prvního dárce (v01py) se starý text přepsal příkazem `rewriteSupport`. Tlačítko „Support the front ☕“ v panelu náboru se ukáže, až bude v `theme.support.url` adresa Ko-fi.
- **NÁPAD pro měsíční předplatitele (později): Trench Dog.** Voják předplatitele má na mapě v zákopu malého pixelového psa (sedí u něj, vrtí ocasem, občas si lehne),
  na kartě „🐕 Trench Dog: kept the front running“, pes má jméno (Biscuit, Rex…) a může se objevit v deníku; nástupce ho zdědí. Psi na frontě 1. sv. války (poslové, hlídači, maskoti).
  Bez herní výhody. Nic není postavené.
- Platby přes Ko-fi (0 % z darů, jen poplatek PayPal/Stripe); server na webhook nemáme (Spark), dárce se zapisuje ručně do `data/supporters.json` podle IG jména ze zprávy.

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

## Wiring party (2026-11-12) — POSTAVENO, čeká na první post (nápad hráče, schválil uživatel)
Noční oprava drátu dobrovolníky obou stran (`engine/wiring.js`, krok 0 v `battleTick`, `theme.battle.wiring`).
- **Otevření:** zveřejněný post ve frontě s `"wiring": true` (`ingest/publish.mjs` → `openWiring`). Přihláška = komentář s heslem **WIRE** pod tím postem (jen zdravý voják; bot odpoví). Vyhodnotí příští denní tah (13:00 UTC), pak se zavře.
- **Riziko jen z palby ze zákopu** (rozhodnutí uživatele, bez přestřelek mezi partami; čísla schválena 12. 11. večer): p = (0,06 + 0,22 × součet palby hlídek nepřítele na dostřel) × počasí (déšť 0,8, mlha 0,6, bouře 0,7, mráz 1,1, jasno 1,3) × bombardovaná strana 1,5 × ženista 0,7, nejvýš 60 %; závažnost venku bez krytí: 50 % lehkých, 30 % těžkých, 20 % kritických (`wiring.severity`). **Kdo z nepřátel jde ven, nehlídá** (když druhá strana zůstane doma, střílí víc).
- Zásah = běžné zranění (tabulka puškaře), dál péče jako jinde (nosítka, lůžka, medici); smrt jen přes běžný řetěz.
- **Oprava:** +15 % drátu (ženista +30 %, násobek zkušeností) ve vlastním úseku, nebo v nejhorším úseku strany, když je vlastní ≥ 95 %. XP 3. Po 3 nocích medaile `wire-party` („⛓ Wire Party“ na kartě). Noviny: blok „Wiring parties in no man's land“ (kolik yardů, kdo zůstal doma, kdo byl zasažen, se jmény).
- **Simulace** (`node tools/sim-wiring.mjs <H> <C> <běhů>`, 60 běhů, stav po Dni 4, Hegemonie pod bombardováním): sama Hegemonie (20) zasaženo 38 % (těžce/krit. 17 %), sám Concord (20) 36 % (17 %); 20+20 → 34 % / 31 %; 100 H + 50 C → 26 % / 12 % (z Hegemonie zůstalo na hlídce ~38); 50 H + 100 C → 14 % / 24 %. Concord venku riskuje skoro stejně jako bombardovaná Hegemonie, protože naproti má víc zbraní (Hegemonie 19 MG + 19 odstřelovačů, Concord 14 + 11). Padlí v den tahu 0, smrt přichází přes péči v dalších dnech.
- **První post:** `wiring-1` (`marketing/make_wiring.py`, `wiring_1.jpg`) 13. 11. 14:00 UTC (po Novinách Dne 5, vyhodnocení v Novinách 14. 11.), story 14:10 UTC.

## 2026-11-13: Gazette hlásí stav drátu a volá wiring party (NASAZENO)
Když má strana průměrný drát v zemi nikoho pod 50 % (`theme.battle.wiring.news.below`), ranní noviny mají zprávu „The wire is down“: kolik procent zbývá, proč
(dny bombardování z dobyté kóty, jinak déšť, rez a zbloudilé kulky), v kolika úsecích jsou díry (drát < 30 %), proč na drátu záleží (zastaví nájezd, kryje proti palbě, `wire.cover`)
a výzva k wiring party (vrtací kůly, plazení, při světlici k zemi; komentář WIRE pod rozkazem na IG). Texty v `theme.json`, kód v `engine/battle.js`.
Podklad o skutečných wiring party: Wikipedia „Wiring party“, firstworldwar.com „Wiring Parties“ (noc 21–3 h, tichý „corkscrew“ kůl místo kladiva, při světlici k zemi, bloudění cestou zpět).

## 2026-11-13: Drát na mapě podle stavu a viditelná wiring party (NASAZENO, vizuál)
Web kreslí drát každého úseku přední linie podle `battle.sides[f].wire[úsek]` (celý ≥ 0,65 / napůl potrhaný / pod 0,35 potrhaný s dírami) a u úseků,
kde se někdo přihlásil WIRE nebo byl venku minulou noc, ukazuje vojáky při práci (`roster.battle[f].party`). Mechanika boje se tím nemění, jen zobrazení.

## 2026-11-13: Silnější bombardování (NASAZENO na výslovný pokyn uživatele, od vydání Dne 5)
Uživatel: „musí umřít mnohem více Hegemonie, jsou bombardovaní a mají méně ztrát, to je blbost“. Náhled Dne 5 dával Hegemonii 2–3 padlé, Concordu 3.
Změny v `theme.json` → `battle.shell`: `hit` 0,5 → 0,65 (zasažený podíl lidí v ostřelovaném úseku), `kill` 0,5 → 0,75 (kritický zásah granátem zabije na místě),
`severity` light 0,7/heavy 0,3 → 0,75/0,4 (víc kritických: 40 % místo 30 %), nové `careCut` 0,5 (medici a nosiči se v ostřelovaném úseku dostanou k raněným jen napůl;
`engine/battle.js`, péče `g`). Simulace (20 běhů × 3 dny): Hegemonie ~6,8 / 7,2 / 4,0 padlých za den (dřív ~2,9), Concord ~1 za den; poražený má víc padlých ve 20/20 bězích.
Den 5 podle skutečného stavu: Hegemonie 7 padlých (6 přímým zásahem), Concord 3.

## 2026-11-13 (poledne): Bez umělého limitu padlých, lůžko = operace (NASAZENO na pokyn uživatele, od vydání Dne 5)
Uživatel: limit padlých (5 % strany za den) nedává smysl, hráči přibývají a padlé nahrazuje nástupce; ztráty mají dávat statistiky, ne pojistka (ale ne 80 % všech).
Uživatel: na lůžku má těžce raněný být nejvýš 2 dny; kdo přežije noc operace, je v pořádku (jinak jen čeká a hra pro něj není zajímavá).
- `battle.maxDeaths.share` 0,05 → 0,25 (jen pojistka proti chybě). Dřív se při bombardování limit naplnil a kriticky ranění nad ním „žili“ dny bez konce (63 % kritických H po 10 dnech).
- `battle.shell.share` 0,3 → 0,4 (podíl ostřelovaných úseků), `careCut` 0,5 → 0,6 a platí jen pro raněné, kteří ještě leží v ostřelovaném zákopu (nosítka jsou na obvazišti).
- Lůžko: první noc operace (kritický umírá s 0,5 × critRisk: nemocnice 20 %, obvaziště 40 %), přežije-li, je těžce raněný a za 2 dny od uložení se vrací na frontu (`w.operated`).
Simulace 20 běhů × 3 dny: Hegemonie ~9,3 / 8,0 / 1,5 padlých za den (bombardování končí Dnem 6), Concord ~1/den; za 3 dny H ~19 padlých a ~91 zranění, C ~2 a ~38.
Osud dnes raněných H (10 dní): těžce raněný padne 40 %, vrátí se 52 % (průměrně za ~5 dní), lehce raněný se vrátí 81 % za ~2 dny. Den 5 podle stavu: H 10 padlých, C 3.

## 2026-11-13: Wiring party a ranění (NASAZENO)
Přihláška WIRE: lehce raněný se přihlásit může a jde ven (chodí po zákopu); těžce a kriticky raněnému bot odpoví, že zůstává u mediků (uživatel to tak chce).
Kdo se přihlásil a do noci se těžce zranil, toho nepustí medik: v deníku má „{n} signed up for the wiring party, but the medic would not let {n} leave the aid post. The wire will wait for another night.“
(`engine/wiring.js` joinWiring, `engine/battle.js` krok 0, text jde přepsat `battle.wiring.keptBack`).

## 2026-11-13 (večer): Nezvěstný se přihláškou na wiring party vrátí (NASAZENO, uživatel nechal na mně)
- Proč: hráčka (převzatý voják, nezvěstný od Dne 3) napsala WIRE, přihláška se přijala, ale nezvěstný se na mapě nekreslí, takže u drátu nebyla. Hráč, který komentuje, je zjevně „tady“.
- Jak: `joinWiring` (engine/wiring.js) u nezvěstného → status active, zápis do deníku `theme.battle.wiring.returned` (jen se přidá), odpověď bota „… just walked back into the trench and is on the wiring party tonight“.
  Pojistka `wiringReturns` ve smyčce vrátí nezvěstné, kteří už mezi přihlášenými jsou. Zajatý (`captured`) se přihlásit nemůže (bez odpovědi; výpravy jsou vypnuté).

## 2026-11-14: Gazette u drátu: opraveno, ale ostřelování to zase zničilo (NASAZENO)
Wiring party se vyhodnocuje před ostřelováním téhož tahu, takže drát pod bombardováním může skončit níž než ráno (Den 6: 24 % → 22 % i po 577 yardech oprav).
Zpráva „The wire is down“ pak u strany pod granáty dodá: „In the night {n} volunteers crawled out and put up {yards} yards of new wire. Then the last shells came down and tore much of it apart again.
Without the wiring parties it would be down to {without}%.“ (`theme.battle.wiring.news.mendedShelled`, `engine/battle.js`). Mechanika se nemění, jen vysvětlení v novinách.

## 2026-11-14: Odměna za Hill 304 = pozorovatelna (NASAZENO na pokyn uživatele; bombardování se opakovalo)
Každá kóta má vlastní odměnu (`theme.race.objectives[].reward`, výchozí `barrage`). Hill 304: `observation` (`theme.race.observation`):
3 dny od příštího dne (uživatel: 7 dní je moc) mají **odstřelovači a kulometčíci vítěze palbu ×1,3** (simulace 3 dny: jejich zásahy 22,5 → 29,7, padlí poraženého ~+0,5).
Zůstává: bezpečnější týden pro vítěze (`winDanger`/`loseDanger`), stužka, hrdina. Bez bombardování (`activeBarrage` bere jen vítězství s `barrageTo`).
Noviny: při dobytí věta o pozorovatelně (`observation.victory`), pak každé ráno „Eyes on Hill 304“ (kolik mužů trefili odstřelovači a kulometčíci, kolik dní zbývá).
Web: falešný ocelový strom se štěrbinou (PixelLab, `web/public/assets/props/observation_tree.png`, zdroj `art/props/observation/`) mezi valem a drátem vítěze, pozorovatel (sprite odstřelovače) a telefonní drát (`web/src/observation.js`, `roster.observation`, náhled `/?obs=0`).
Historie: falešné „pozorovací stromy“ (Francouzi od 1915, Britové), dutá ocelová kopie skutečného stromu vyměněná v noci; skutečná Côte 304 u Verdunu byla klíčová kvůli výhledu.

## 2026-11-14: Konec bombardování i na mapě (NASAZENO)
Bombardování z Verdel Ridge má poslední noc v tahu Dne 6 (14. 11. 13:00 UTC). Web (`activeBarrage(..., visual)`) ho teď ukazuje jen do dne PŘED posledním tahem,
po tahu už nepadají granáty ani na mapě. Krátery po něm se „hojí“: první den po konci zůstane ~40 % (při bombardování až ~100 %), pak o 8 % méně denně, nejméně 15 % (`web/src/main.js`).

## 2026-11-14: Větší závody: cíl podle kóty (NASAZENO)
`theme.race.objectives[].need` (jinak `race.need` = 100). **Blackwater Canal = 200** (uživatel: 100 se naplní rychle, další závod má být větší).
Po dobytí se hned přepne počítadlo na webu (`roster.race` z `raceStatus`) i v novinách a Day reelu; zpráva o vítězství říká i nový cíl („the first side to bring 200 new soldiers takes it“).
Ověřeno simulací: 5 rekrutů Hegemonie → vítězství hill304 (pozorovatelna), počítadlo Blackwater Canal 0/200.

## 2026-11-14: Závod o Blackwater Canal = kdo první zabije 100 nepřátel (NASAZENO)
Uživatel: další závod nemá být o nových vojácích, ale o tom, kdo dřív zabije 100. `objectives[].type = 'kills'` (`engine/race.js` `killCounts`, `checkKillRace`):
počítají se padlí soupeře od začátku závodu (záznamy rodů `s.fallen`, den padnutí > `state.race.startDay`), vyhodnocuje se po denním boji; při shodě vyhrává ten, kdo má víc.
Hrdina = voják vítězné strany, který od začátku závodu zabil nejvíc (`s.kills` minus stav na začátku, `state.race.killsFrom`). Web, noviny („Hegemony 12/100 enemy dead“) a Day reel berou počty z `raceStatus`.
Simulace (4 losy, od vítězství na Hill 304): po 7 dnech Hegemonie 4–9 / Concord 17–54, po 14 dnech 7–15 / 21–92 → Concord vede (Hegemonii umírají ranění kvůli nedostatku mediků) a závod trvá ~2–3 týdny.

## 2026-11-14: Bez denních mezí raněných (NASAZENO na pokyn uživatele)
`battle.daily` (aspoň 1 a pod granáty nejvýš 30 raněných na 80 vojáků strany) odstraněno, ztráty dává jen náhoda. Simulace (20 běhů × 3 dny) s mezemi i bez nich vyšla stejně (H 13,3 padlých / 73 raněných, C 2,3 / 41): meze se dnes neuplatňovaly.
Nasycení palby (`roles.saturation` = 1) zůstává: když má střelec u sebe víc vlastních střelců než nepřátel na dostřel, každý trefí méně (střílí po stejných cílech).

### 2026-11-14: podpora přechází z Ko-fi na Patreon (NASAZENO, tlačítka zatím skrytá)
Ko-fi zamítlo platby (problém s účtem Stripe). War Bonds zůstávají stejné (stužka, zápis, poděkování v novinách, jen čest), mění se jen služba:
`theme.support.url` = https://www.patreon.com/cw/MudandIron, `theme.support.platform` = "Patreon" (texty na webu: „Support the front on Patreon“).
Úrovně (schváleno 14. 11.): War Bonds 3 USD, Field Post 5 USD (exkluzivní příspěvky ze zákulisí a chystané věci), Officers' Mess 10 USD (zlatá hvězda nad vojákem na mapě, vidět při každém přiblížení; příkaz `star`/`unstar`, `theme.support.star`, `grantStar` v `engine/roster.js`); stužka od 3 USD, zůstává i po zrušení. Patron pošle na Patreonu IG jméno, udělení dál ručně příkazem `support`.
Texty stránky, úrovně a uvítací zprávy: `marketing/patreon.md`; grafika `marketing/make_support.py` (patreon_cover/avatar/tier). Tlačítka na webu zapnout (`buttons: true`) až po ověření stránky.

### 2026-11-15: víc smrtí, dlouho ležící ranění umírají (NASAZENO, uživatel)
Uživatel: „musí se umírat, je blbost, že by nikoho nezastřelili k smrti; mají obrovské množství raněných, kteří tam jsou dlouho, musí být mnohem větší riziko smrti, aby bylo jasné, že potřebují nemocnici.“
- **Smrt přímo palbou:** kritický zásah kulkou zabije na místě s `roles.kill` 0,5 (dřív 0,2), odstřelovač 0,6 (dřív 0,35); nově i těžký zásah s `roles.killHeavy` 0,12.
- **Dlouho ležící těžce raněný bez lůžka** (`care.linger`): riziko smrti za noc = (0,05 + 0,07 × dní od zranění) × (1 − 0,7 × péče mediků) × 1,5 v zákopu, nejvýš 45 %. Nováčci chránění (`newbieDays`). Na lůžku se neumírá takhle (operace, viz výš).
- Simulace (30 běhů, stav 15. 11. ráno, Hegemonie 42 těžce raněných mimo lůžka, medici 42 %): padlí za den H ~3,7 / 5,1 / 4,9, Concord ~1,3 / 1,7 / 1,9 (dřív H 0,8 / 1,0 / 1,9). Nemocnice (víc lůžek) a medici riziko jasně snižují.

### 2026-11-15 (dopoledne): ještě víc smrtí, ztráty rostou s počtem hráčů (NASAZENO, uživatel: „je víc hráčů a málo smrtí“)
- Palba: puškař `fire` 0,17 → 0,25, kulomet 0,26 → 0,38, odstřelovač 0,30 → 0,45 (víc hráčů v linii = víc zásahů).
- Závažnost zásahu: puškař lehce 70 % / těžce 18 % / kriticky 12 % (dřív 83/7/10), kulomet 65/27/8.
- `roles.killHeavy` 0,12 → 0,25; `care.linger` base 0,05 → 0,08, perDay 0,07 → 0,1.
- Simulace (stav 15. 11., 426 hráčů): padlí za den H ~6 / 8 / 7, C ~3 / 3,6 / 3,7 (celkem ~9–12 denně, ~2,5 % hráčů), raněných ~35–43 denně.
- (15. 11. poledne, uživatel: „zvýšit úmrtí v zákopu bez ošetření a trochu i na nosítkách“) `care.linger` base 0,1, perDay 0,1, v zákopu bez nosítek ×3 (dřív 1,5) a už první noc, max 60 %. Simulace: padlí za den H ~9,4 / 9,2 / 7,6, C ~2,8 / 3,6 / 3,9.
  Délky pobytu (stav 15. 11.): lůžko nejvýš 2 dny (noc operace, pak zpět na frontu), nosítka průměr ~1 den, nejvýš 2 (pak se zahojí, nebo zemře), lehce ranění v zákopu do druhého dne.
- (15. 11. odpoledne, uživatel: „nestíhají → víc má umřít; pozorovatelna není znát“) pozorovatelna: palba ×1,8 (dřív ×1,3) i pro puškaře, šance zabít na místě ×2 (`race.observation.kill`, `killOf` v `engine/roster.js`); `care.linger` base 0,15, perDay 0,15.
  Simulace: padlí za den H ~11 / 11 / 9, C ~7 / 8,6 / 9,8 (celkem ~18 denně, ~4 % hráčů), raněných ~45–55 denně.
- (15. 11. odpoledne, uživatel: „leží v zákopech už ze včera, střílí se na ně, nemají drát“) `battle.hitLying`: raněný, který od včerejška leží v zákopu bez nosítek, je taky cíl palby (lehký se zhorší, těžký a kritický zemře na místě); `wire.cover` 0,15 → 0,4 (celý drát sníží zásahy o 40 %).
  Simulace: padlí za den H ~15 / 14 / 9, C ~6 / 7,8 / 9 (celkem ~21 denně).
- (15. 11. odpoledne, uživatel: „26 na nosítkách bez péče a venku by mělo být mnohem horší“) Zjištění: medici, kteří nestíhají, dávali dřív plnou péči nejvážnějším (nosítka) a lehce ranění neměli nic, takže na nosítkách se většina uzdravila. Nově `care.spread`: péče se rozdělí rovným dílem (každý dostane podíl = pokrytí), těžký se bez péče skoro nezahojí (`care.heavy.healPow` 2), `care.linger` base 0,2, perDay 0,25, care 0,85.
  Dnešní noc Hegemonie (zkouška): z 24 na nosítkách 10 padlo, 1 se zahojil, 12 zůstává; simulace padlí H ~22 / 13 / 9,5, C ~6 / 8,7 / 9,4.
- (15. 11. odpoledne, uživatel) Pozorovatelna: kulomety naproti střelce strany s pozorovatelnou nepotlačí (`unsuppressed` v `engine/roster.js`). Kulometčík Hegemonie 0,33 → 0,50 zásahu na střelce. Drát (stav): Hegemonie 22 %, Concord 77 %, Concord proto trefuje Hegemonii o ~30 % snáz (`wire.cover` 0,4). Simulace padlí H ~22 / 13 / 9, C ~7 / 10,6 / 11.
- (15. 11.) Nasycení palby vypnuto (`roles.saturation` 0, uživatel: víc střelců = větší palebná síla). Simulace padlí H ~24 / 14 / 10, C ~7 / 11 / 11,5.
- (15. 11. odpoledne, uživatel: „je to dlouhé, rychleji ozdravovat nebo zabíjet“) Těžce raněný mimo lůžko se může zahojit už po 1 noci (`care.heavy.minDays` 1) a po 2 nocích se rozhodne (`maxDays` 2): zahojí se s šancí 0,3 + 0,6 × péče mediků (Hegemonie 46 % → ~58 %, Concord 100 % → 90 %), jinak zemře. Nikdo neleží týden.
  Dnešní noc Hegemonie (zkouška): z 24 na nosítkách 12 zahojeno, 10 padlo, 1 zůstává. Simulace padlí H ~22 / 5 / 4, C ~7 / 11 / 11,5.

### 2026-11-15: návrh hlasování HOSPITAL / PILLBOXES / AMMO (NASAZENO: post 15. 11., vyhodnoceno 16. 11.: obě strany PILLBOXES, H 46:23:6, C 46:7:5)
- HOSPITAL: druhý nemocniční dugout (`build: dugout`, +4 lůžka, +4 nosítka, natrvalo).
- PILLBOXES (nápad Hegemonie z Rady fronty): betonové bunkry v přední linii, kulometčíci palba ×1,6, odstřelovači ×1,3, 5 dní; na mapě betonové bunkry před valem (`web/src/orders-fx.js`, dev `/?orders=0:PILLBOXES`).
- AMMO: palba ×1,4, 3 dny. Každá strana hlasuje zvlášť (`perFaction`). Návrh: `marketing/drafts/vote-build.draft.json`, obrázek `python marketing/make_vote.py build`.

## 2026-11-16: rozkazy z hlasování platí až od příští bitvy (NASAZENO)
Uživatel: „pevnůstky by se měly dnes jen objevit na mapě, herně by měly být až zítra, protože je teprve postavili.“
Dřív rozkaz z hlasování (`issueOrders`, `from = state.day + 1` před přechodem dne) působil už v bitvě téhož ranního vydání, ve kterém se vyhlásil výsledek.
Teď `from = state.day + 2` (`engine/roster.js`, `resolveVote`): noviny vyhlásí výsledek, web stavbu ukáže hned (bunkry, kryty, sklad; web nekontroluje `from`), účinek platí od další bitvy po celých `days` dní.
První použití: PILLBOXES 16. 11. (obě strany) → vnitřní dny 9–13 = noviny 17.–21. 11.; bunkry na mapě od 16. 11. do novin 21. 11.
Stavby (`build`, např. nemocnice) se nemění (platí hned jako dřív).

## 2026-11-16: PILLBOXES na mapě: řidší, s vlajkami stran (NASAZENO)
- Bunkry stojí v přední linii jen v otevřené části fronty, **jeden na ~800 px = 21 na stranu** (dřív 300 px = 53; uživatel: „strašně moc“), asi 1 na obrazovce (`web/src/orders-fx.js`).
- Každý bunkr má **vlající vlajku strany** (kreslená v kódu, `drawFlag`; PixelLab z cloudu nešel): Hegemonie ocelově šedá s rezavým pruhem, Concord olivová se žlutou hvězdou (barvy jako prapory v reelech). Hegemonie bunkr zepředu (průzor, záblesky kulometu), Concord zezadu (vchod). Ukázka `docs/mockups/pillbox_flags.png`.
- Na mapě hned po vyhlášení výsledku (16. 11.), účinek od další bitvy (viz výš), zmizí s novinami 21. 11.
- Pozor (řečeno uživateli): účinek je pro obě strany stejný, ale Hegemonie má víc kulometčíků a odstřelovačů (73 : 55) a do 17. 11. i pozorovatelnu na Hill 304, takže jí PILLBOXES pomůže víc.

## 2026-11-16: Vysvětlení ztrát v náhledu novin (NASAZENO, jen pro uživatele)
Uživatel chce u ztrát vždy vědět proč. `node tools/preview-tick.mjs` má sekci **„Proč (vysvětlení, jen pro tebe)“**: po stranách odkud zásahy (palba nepřítele podle rolí, granáty, pozadí), zdraví střelci obou stran, co to ovlivnilo (pozorovatelna, bombardování, rozkazy), péče (raněni před tahem, medici, pokrytí, v zákopu bez nosítek), příčiny smrti a shrnutí, kdo je na tom hůř a proč. Nepublikuje se.
Rozbor 16. 11.: Hegemonie měla po bombardování z Verdel Ridge (Den 4–5: 38 a 55 zasažených, péče mediků 40–45 %) velkou zásobu těžce raněných; pravidlo z 15. 11. „těžce raněný se do 2 nocí zahojí, nebo zemře“ ji Den 6 rozhodlo naráz (19 mrtvých bez péče). Od Dne 7 je silnější Hegemonie: bombardování skončilo, pozorovatelna, víc kulometů a odstřelovačů, vypnuté nasycení palby.

## 2026-11-16: War Bonds v novinách s @handle (NASAZENO)
`grantSupport` píše do poděkování „Jméno (@handle)“, web z toho udělá odkaz na vojáka. Výjimka z nedotknutelné kroniky na výslovný pokyn uživatele: příkaz `linkSupport { handle, day }` doplnil @vis.acquillae do už vydaného poděkování v novinách Day 7 (vnitřní den 8).

## 2026-11-16: Souboj komentářů o pevnůstky „1 comment = 1 shell“ (POSTAVENO, spustí se zveřejněním reelu `pillbox` po schválení)
Uživatel chtěl něco virálního, co lidi vyhecuje ke komentářům. `engine/shells.js`:
- Pod postem s `shells` ve frontě (`{ target: "PILLBOXES", minHours: 8, cap: 20 }`) je **každý komentář vojáka jeden granát pro jeho stranu**. Nováček napíše HEGEMONY/CONCORD, narukuje a jeho komentář se počítá taky. Bez stropu: kolik komentářů, tolik střel (uživatel 16. 11.; strop 20 na účet zrušen ještě před zveřejněním, ve videu ani popisku se nezmiňuje). Bot na granáty neodpovídá, takže ho ani série komentářů jednoho člověka nezahltí.
- **Ranní noviny** (nejdřív 8 h po otevření) sečtou: strana s víc granáty rozbije podíl bunkrů poraženého `ruined = 0,25 + 0,75 × (víc − míň) / víc` (při shodě nic). Rozkaz PILLBOXES poraženého pak střílí jen zbytkem: násobek `1 + (m − 1) × (1 − ruined)`. Žádné mrtvé navíc (sláva a pevnůstky, ne masakr).
- Noviny: „The guns answered“: kolik granátů která strana vystřelila, kolik % bunkrů padlo, nejpilnější obsluha děla (jméno + @handle).
- **Na mapě** se z podílu bunkrů poraženého stanou **ruiny** (`pillbox_ruin.png` / `pillbox_back_ruin.png`, vyrobené z herních spritů `art/props/pillbox/make_ruin.py`; utržený roh, výztuž, sutiny), bez vlajky, nestřílí, doutnají. Dev náhled `/?orders=0:PILLBOXES,1:PILLBOXES&ruin=1:0.5`.
- `theme.shells` (`base`, `newsHead`); web dostává živé počty v `roster.shells`.

## 2026-11-17: PILOT a logistika (NÁVRH, nic nenasazeno kromě vzhledu letadel)
- **Role PILOT:** extrémně vzácná, **jen jeden hráč na stranu**; hlásí se komentářem (heslo PILOT), vybere se losem/pořadím přihlášky. Letadlo nad frontou, lehké animace (vrtule, stín, kouř). Herní účinek zatím NENÍ rozhodnutý (návrhy: průzkum = přesnější palba vlastních kulometčíků, nebo přelet jako rozkaz s vlastním bonusem). Bez schválení neměnit boj.
- **Hotovo (jen vizuál, 17. 11.):** 4 sprity z PixelLabu (`art/props/plane/`, `web/public/assets/props/plane_{heg,con}_{0,1}.png`, 96×96 shora, nos vpravo; po 2 na stranu: dvouplošník a trojplošník), `web/src/planes.js` (přelety přes výřez kamery, vrtule, stín, kouř), dev náhled `/?planes=0:0,1:1`, snímky `tools/shot-planes.mjs`. Ve hře se letadlo ukáže, až `roster.pilots[f]` existuje (zatím nikdy).
- **Logistika (uživatel 17. 11.):** žádné jezdící konvoje, jen další stavba na mapě (sklad/depo) s bonusem; strana si hlasováním vybere, co logistika dá (nemocnice, opravy wire…). Podrobnosti čekají na rozhodnutí.
- **Letadlo, doplněno 17. 11. (vizuál):** dráha je pevná a nezávislá na kameře (`web/src/plane-path.js`): tam a zpět po celé otevřené frontě (16 384 px + okraje, 130 px/s, jeden směr ~2 min), takže nemizí uprostřed; test `web/src/plane-path.test.js` (součást `npm test`). Tichý zvuk motoru `sfx.plane` v `web/src/sound.js` (zapíná se tlačítkem zvuku, hlasitost a stereo podle polohy vůči kameře).
- **Sprite pilota (17. 11.):** `hegemony_pilot`, `concord_pilot` (PixelLab, 8 směrů + chůze 6 snímků S/V/Z/J, `art/sprites.json`, atlas přegenerován). Ve hře se nepoužívá, dokud role PILOT není v `theme.archetypes`.

## 2026-11-17: Role PILOT, rozepsaný návrh (NÁVRH, čeká na odsouhlasení čísel; sprity a letadla hotové)
- **Přihlášky:** komentář PILOT pod příspěvkem (okno ~24 h), kdokoli, nový i stávající voják (nový narukuje heslem strany). Los: jeden pilot na stranu, bot neodpovídá (jen uvítání nováčka). Výsledek v novinách („The front's first pilot“). Role se nemění přáním v komentáři ani převelením (jako poručík); uvolní se odchodem, smrtí nebo sestřelením.
- **Účinek (průzkum):** vlastní **puškaři** (klasičtí střelci) střílí o ~12 % víc (`battle.pilot.rifleman`), protože letecký pozorovatel vidí příkopy nepřítele. Doplňuje pozorovatelnu na kótě (ta zlepšuje kulometčíky a odstřelovače). Pilot sám na zemi nestřílí.
- **Smrt / sestřelení (historicky: průzkumné stroje létaly nízko a dostávaly palbu pušek a kulometů ze země i protiletadlové „Archie“, život pilota se počítal v týdnech):** malá denní šance, základ ~5 % (`battle.pilot.shotDown`), roste s počtem nepřátelských kulometčíků (+1 % na 10 kulometčíků), klesá s lepším počasím (déšť/bouře: pilot nelétá, 0 %, ale ani bonus). Při sestřelení 50 % smrt (normální padlý: Roll of Honour, zápis, nástupce), 50 % těžce raněný (nemocnice). Role se uvolní, otevře se nové kolo přihlášek. Na mapě zůstane zbytek stroje a kouř (kinematografický prvek).
- **Pilot nemá být kryt před ostatním:** nelétá-li (bouře), je jako běžný voják.
- **Sprity:** `hegemony_pilot`, `concord_pilot` (Concord přegenerován 17. 11. kvůli rozdílným rukávům a hlavě; oči a jednotná kůže `tools/fix-pilot-faces.py`).

## 2026-11-17 (odpoledne): PILOT postaven, čísla schválena uživatelem (NASAZENO po pushi; zatím jen v pracovní složce)
- `engine/pilots.js`, `theme.pilot`: bonus puškařů ×1,12 (`rifleman`), sestřelení 5 % denně + 1 % za každých 10 nepřátelských kulometčíků, smrt 50 % při sestřelení, jinak těžce raněný. **Letu brání jen bouře a mlha** (`grounded`; déšť je 5 z 13 dní, kdyby bránil, pilot by skoro nelétal). Role `pilot` je v `theme.archetypes` s `weight 0` a `special: true` (nelosuje se, nejde si ji přát ani převelet).
- Nábor: příspěvek ve frontě s `pilots: { minHours: 24 }` otevře `state.pilotCall`; komentář s PILOT od vojáka pod ním = přihláška (`ingest/poll-comments.mjs`, bot neodpovídá); ranní noviny po 24 h losují jednoho pilota na stranu (`resolvePilotCall`), zpráva „A pilot takes the air“. Sestřelení: zpráva „Plane down“, role se uvolní, nové kolo = nový příspěvek s `pilots`.
- Web: `roster.pilots` → letadlo nad frontou (`web/src/planes.js`); sprite pilota na zemi `<strana>_pilot`.
- Reel `pilot` (`web/src/reel-pilot.js`, `cinema-pilot.js`, `marketing/reels/pilot.script.json`, náhled `docs/mockups/pilot_reel_sheet.png`): samostatný náborový reel, ne Day reel.
- **Nasazeno 17. 11. (uživatel „hned to nasaď“):** kód v `main`, příspěvek `reel-pilot` ve frontě (publishAt 12:15 UTC, `pilots: { minHours: 24 }`), story `story-reel-pilot` 12:25 UTC. Los: noviny 18. 11. 13:00 UTC. Letadlo létá nad nepřátelskou frontou; ze země po něm ve hře létají stopovky a obláčky flaku (jen vizuál).


## 2026-11-17: Oprava: los pilotů proběhl o den dřív (NASAZENO)
Denní tah posílá čas jako číslo (`Date.now()`), `resolvePilotCall` a `resolveShells` ho převáděly přes `Date.parse` → NaN → lhůta (`minHours`) se přeskočila. Noviny 17. 11. (Day 8) proto losovaly piloty jen 43 minut po otevření náboru (měly 18. 11.).
Oprava: čas se bere jako číslo i text (test v `engine/engine.test.js`). Na pokyn uživatele příkaz `undoPilots` (`engine/pilots.js`): Dietrich „Button“ Slade (@slade_2233) a Karel Pavla (@pavla.9_) dostali zpátky roli odstřelovače, zprávy „A pilot takes the air“ smazány z novin Day 8 (výjimka z nedotknutelné kroniky), nábor obnoven s 21 přihláškami ze stavu před losem; los v novinách 18. 11. 13:00 UTC.
Dnešní bitva už proběhla s piloty (bonus puškařů ×1,12 u obou stran, žádné sestřelení); to se nevrací. Souboj o pevnůstky byl vyhodnocen správně (běžel 18 h > 8 h).

## 2026-11-17: Čestné tituly (příkaz `title`) a Propagandist of the Hegemony (NASAZENO)
Na pokyn uživatele: odměna pro hráče, kteří hru šíří. Příkaz `{ cmd: "title", handle, title, entry, newsHead, newsText }` (`grantTitle` v `engine/roster.js`): titul na kartě vojáka (★), zápis do deníku, zpráva do příštích novin s @handle. Jen čest, žádná herní výhoda.
První: Konrad Sebs (@_sebs.c_, Hegemonie, odstřelovač, First Wave), „Propagandist of the Hegemony“ za plakáty (`art/cine/sebs_poster_*.png`, ze screenshotů od uživatele) a burcování pod příspěvky (manifesty, sjednocení hlasů Hegemonie v Radě fronty, z jeho BUNKERS vzešly pevnůstky).

## 2026-11-17: Role jen při náboru (NASAZENO)
Uživatel: hráč s rolí se jen zeptal, co dělá poručík, a bot mu napsal „už jsi poručík“; navíc delší věta se zmínkou role („the medic carried me back…“) mohla hráči, který ještě nevyužil první volbu zdarma, roli potichu změnit.
Teď: roli si hráč volí **jen při náboru** (heslo strany a role v jednom komentáři, „CONCORD medic“). Kdo už vojáka má, tomu komentář roli nemění a bot mlčí. Změna role jen převelením z karty vojáka na webu. Člověku bez vojáka bot na zmínku role dál poradí, jak narukovat i s rolí (`notEnlisted`).

## 2026-11-18 Pilot: změřený účinek (NÁVRH na posílení, čeká na uživatele)
- Simulace 60 běhů (skript ve scratchpadu, stav 18. 11. ráno, los pilotů ve 13:00 UTC): bonus puškařů ×1,12 přidá straně **~0,4 zásahu denně** (Hegemonie puškaři 7,6 → 8,0, Concord 9,4 → 9,9) a **~0,05 padlého denně**. V novinách ani ve ztrátách to není poznat.
- I ×1,35 dá jen ~+1,4 zásahu a ~+0,1 padlého denně (puškaři mají malou šanci na zásah, pilot je jen násobí).
- Návrh: letadlo dělá vlastní viditelnou věc, např. **průzkum: 2–3 zásahy denně navíc** do nepřátelské linie (zpráva „Spotted from the air“ se jménem pilota), nebo **označí cíl** pro kulomety (×1,15 kulometčíkům celé strany). Bez souhlasu neměnit.

## 2026-11-18 Víc padlých: 2 výstřely denně a smrtelnější zásahy (NASAZENO, od novin 18. 11. 13:00 UTC)
- Uživatel: 9 padlých denně na ~500 hráčů je málo, cíl ~30 (klidně ke 50).
- `battle.roles.shots = 2`: každý střelec střílí 2× denně. V 1. kole všichni naráz, ve 2. kole jen ti, kdo zůstali zdraví (obě strany naráz, žádná nemá výhodu prvního výstřelu). Každý cíl dál nejvýš jeden zásah za den.
- Smrtelnost na místě: těžký zásah `killHeavy` 0,25 → **0,7**, kritický `kill` 0,5 → **0,8**, kritický od odstřelovače `sniper.kill` 0,6 → **0,9**.
- Simulace (20 běhů × 3 dny, stav 18. 11.): **~32 padlých a ~90 raněných denně** za obě strany (H ~15, C ~17); dřív ~9 / ~52. Varianta s palbou ×2 navíc dávala ~55 padlých a ~140 raněných (zamítnuto, přes strop).
- Modifikátory dál fungují (ověřeno simulací): bunkry PILLBOXES (bez rozkazů Concord ~13 padlých/den místo ~17), pilot (násobí šanci na zásah), pozorovatelna.
  **Pozor:** pozorovatelna (`race.observation`: palba ×1,8, smrtelnost ×2) je s novou smrtelností drtivá: zkusmo zapnutá dnes by Concord ztrácel ~40 padlých denně proti ~13. Před další kótou s odměnou `observation` ji zmírnit (návrh fire 0,4, kill 0,25), zatím neaktivní.
- 2026-11-18 (uživatel): pilot vylosovaný v novinách do boje té ranní bitvy NEJDE (letadlo už je ve hře a létá, ale bonus i riziko sestřelení platí až od další bitvy; `p.since + 1` v `engine/pilots.js`).

## 2026-11-18 Nábor: heslo strany s překlepem (NASAZENO)
- Uživatel: hráč napsal „concorrrrd“ (emoce) a nenarukoval. `parseComment` (`engine/roster.js`) teď po přesné shodě zkusí každé slovo: sloučí opakovaná písmena a povolí jednu chybu (záměna, vynechání, přidání, prohození sousedních písmen), první písmeno musí sedět, heslo aspoň 6 písmen.
- Projde: CONCORRRRD, HEGEMONYYY, concrod, hegemny, Hegemoney, concorde. Neprojde: concert, congrats, condor, second.

## 2026-11-18 Noviny bez seznamů jmen (NASAZENO od novin 19. 11.)
- Uživatel: v novinách jen čísla. „Casualties of the day“, „Roll call“ a „New on the line“ už nevypisují jména ani @handle padlých, raněných a nováčků (každý to najde u svého vojáka a v Roll of Honour). Příběhy („From the service records“) a zvláštní zprávy (piloti, tituly, War Bonds) jména dál mají.

## 2026-11-18 Noční raid (NASAZENO, otevírá ho post s `raid: true`)
- Uživatel: přihláška na noční raid pod postem (komentář RAID), podložená příběhem.
- Přihlásit se může jen zdravý voják (ne pilot). Vyhodnocení v příštích novinách před bojem (`engine/battle.js` krok 0b, `engine/nightraid.js`, `theme.battle.raid`).
- Raider vpadne do nepřátelského zákopu u svého úseku: šance zasáhnout obránce `0,45 + 0,3 × potrhaný drát nepřítele`, × počasí (mlha 1,25, déšť 1,1, jasno 0,85), −0,04 za každý kulomet obránců poblíž; mez 15–85 %.
  Zásah zblízka: 40 % lehký, 35 % těžký, 25 % kritický; smrt obránce kritický 85 %, těžký 60 %. **Zabití se počítají do závodu o zabití (Blackwater Canal)** a raiderovi do `kills`.
- Cesta zpět: zásah 25 % + 3 % za kulomet (max 60 %), smrt raidera kritický 60 %, těžký 35 %.
- Simulace (20 raiderů na stranu, stav 18. 11.): raideři zabijí ~4–5 a zraní ~6–7 nepřátel, sami ztratí ~2 padlé a ~4 raněné. Odznak `raider` po 3 raidech, XP 4.
- Noviny: článek „Night raid“ s počty a nejstatečnějším raiderem (jméno + @handle). Deníky: `nightRaidKill/Wound/Stabbed/Killed/Hurt/Back` (story.json; slovo „raid“ tu nevadí, výpravy jsou dál vypnuté).
- Bot odpoví na RAID (zapsán / nejdřív narukuj / raněný zůstává u mediků / pilot létá).

## 2026-11-18 Podpora se dědí v rodu (NASAZENO)
- Uživatel: stužka má zůstat vidět i po smrti vojáka. `theme.inheritMedals = ["war-bonds", "officers-star"]`: nástupce z rodu dostane stužku War Bonds a hvězdu Officers' Mess (podpora patří hráči, ne vojákovi). Ostatní medaile se dál nedědí (zůstanou u padlého v albu rodu).
- Jednorázový příkaz `inheritMedals` vrátil stužku nástupcům, kteří ji ztratili (18. 11.: Dorian „Parson“ Freddie, @0__freddie__0). `unstar` (v01py) se nedědí zpět, protože hvězda už u něj není.

## 2026-11-19 Palba roste s počtem hráčů, smrtelnější raid, bunkry natrvalo s opotřebením (NASAZENO)
- **Chyba:** střílela jen přední linie a vojáci v podpůrné (`support`) a spojovací (`comm`) linii nemohli být zasaženi (chyběli v `battle.line`). Noví hráči se řadí dozadu, takže při 1 400 hráčích bojovala asi jen třetina. Oprava: `battle.line` + `support 0,6`, `comm 0,45` (šance být zasažen), `battle.shootLines = { front: 1, support: 0,6 }` (podpůrná linie střílí se 60 % palby).
- **Raid (uživatel: má být opravdu smrtící):** až 2 souboje za noc (druhý jen po vítězném prvním), smrtelnost zblízka kritický 0,95 (dřív 0,85), těžký 0,75 (dřív 0,6); raideři ráno nestřílí (`raid.rest`).
- **Bunkry (uživatel: zůstanou, válka je opotřebovává, ženisti opravují):** `battle.pillbox`: rozkaz PILLBOXES už nevyprší, denně −6 %, pod bombardováním −10 %, každý zásah raidera do zákopu −0,4 %; každý zdravý ženista +0,4 % (nejvýš +15 % denně). Ženisti dál opravují i drát (bez wiring party). Stav = 1 − `ruined`, podle něj bonus palby a ruiny na mapě.
- Nanečisto 19. 11. (1 404 hráčů, raid 185 dobrovolníků): noviny ~113 padlých (H 54, C 59), z toho raid ~86. Bez raidu ~44 padlých denně (H 24–31, C 17–19), dřív ~36.
- **Upřesnění 19. 11. odpoledne (uživatel: linie nerozlišovat, nováčci do přední):** všechny linie střílí a jdou zasáhnout stejně (`battle.line` i `battle.shootLines` = 1 pro front/support/comm/reserve/rear). Kvůli tomu zpět na 1 výstřel denně (`roles.shots = 1`): se dvěma by padlých bylo ~110 a během 3 dnů ~200 denně. Teď stabilně **~65 padlých a ~210 raněných denně** (1 400 hráčů), medici stíhají. Nováčci jdou do přední linie (`placeSoldier`): když je v otevřené části plná, fronta se rozšíří o 2 sektory; stávající vojáci zůstávají, kde jsou.

## 2026-11-19 Závod o zabití: oprava a shoda (NASAZENO před novinami 19. 11.)
- Chyba: závod „kdo první zabije 100“ počítal jen padlé, kteří už mají nástupce; nástupci vznikají až po vyhodnocení závodu, takže se kanál vyhlásil o den později a noviny psaly „-20 more“. Teď se počítají i dnešní padlí (`killCounts` v `engine/race.js`).
- Obě strany přes 100 týž den: vyhrává ta, která zabila víc. Při přesné shodě nikdo, závod běží dál, dokud jedna nevede (uživatel 19. 11.).

## 2026-11-19 Péče mediků: víc práce na raněného (NASAZENO)
- Uživatel: medici stíhají i při velkých ztrátách. `battle.care.*.need`: lehce raněný 1 (dřív 0,4), těžce 2 (dřív 1), kriticky 3 (dřív 2); medik dál zvládne 2 body denně. Hegemonie (méně mediků) se dostane pod 100 % pokrytí dřív.
- Nanečisto na 3 dny (s bombardováním Concordu po kanálu): péče přidá ~+10 % padlých. Hlavní váha je bombardování: zasáhne 40 % úseků Concordu a s 800 vojáky to dělá 80–150 padlých denně (viz návrh níž).

## 2026-11-19 Odměna kóty „lepší logistika“ (NASAZENO), Blackwater Canal
- Uživatel: kanál nemá dávat bombardování, ale lepší logistiku. `reward: "logistics"` (`theme.race.logistics`: 3 dny, 2 výstřely denně): vítěz kóty po 3 bitvy střílí 2× denně, ostatní 1×. Hráčům se píše jen „better supplies“ (uživatel: neříkat, že střílí víc). Kanál (Hegemonie, Day 10) převeden příkazem `convertReward` (bombardování zrušeno) a text v dnešních novinách opraven příkazem `amendChronicle` (výjimka z nedotknutelné kroniky na pokyn uživatele). Logistika = jen 3 dny zásob, žádná výšina ani bezpečnější týden (`v.to` = den dobytí).

## 2026-11-19 NÁVRH na později: závod „Hold the line“ (Grey Mill zatím 300 nováčků)
- Uživatel: nápad se líbí, „někdy využijeme“; teď zůstává Grey Mill = první k 300 novým vojákům.
- Návrh: závod 3 bitvy, kótu dostane strana s menším podílem padlých (padlí / velikost armády); odměna „Bread from the mill“ (3 dny rychlejší hojení těžce raněných, méně smrtí bez péče). Varianty: „Supply run“ (komentáře FLOUR jako souboj granátů), „Mill raid“ (150 zabitých při raidech).

## 2026-11-19 · Konec „bezpečnějšího týdne“ po Hill 304 (NASAZENO)
- Uživatel: zrušit. Po Hill 304 dál běžel skrytý `raceDanger` (Hegemonie šance na zásah ×0,6, Concord ×1,25) až do vnitřního dne 13 (noviny 21. 11.); hráčům se o něm nepsalo.
- Příkaz `endSafer` `{ id_obj }` nastaví `victory.to = state.day`, takže od novin 20. 11. neplatí. Pozor: výchozí odměna nových kót (`barrage`) bezpečnější týden pořád dává (`theme.race.winDanger/loseDanger`, `days`), týká se Grey Mill.

## 2026-11-20 · Těžké dělo za Grey Mill + práce ženistů (NASAZENO v enginu, grafika na mapě se připravuje)
- **Odměna Grey Mill = jedna těžká houfnice natrvalo** (`reward: 'gun'`, `engine/gun.js`, `theme.battle.gun`, `theme.race.gun`). Žádné bombardování, žádný bezpečnější týden.
- **Palba:** každý den okno 20 vojáků nepřítele po sobě podle x (nejhustší ze 6 náhodných), zásah 0,6 × síla × linie, kritický zabije s 0,75. Síla podle stavu: ≥60 % plná, ≥30 % poloviční, jinak 15 %, 0 = zničené (střílí znovu od 50 %).
- **Opotřebení:** −4 % za den palby, −min(6 %, 0,02 % × zdraví odstřelovači+kulometčíci nepřítele), protipalba nepřátelského děla 30 % šance × 12 % × jeho síla.
- **Práce ženistů (uživatel: „ženista musí mít volnou práci“):** každý zdravý ženista má 1 jednotku práce denně; nejdřív drát ve svém úseku, zbytek (volná práce) dělo (0,4 % za jednotku, nejvýš 8 %/den) a pak bunkry (0,4 %, nejvýš 15 %). Dřív bunkry braly všechny ženisty bez ohledu na drát.
- **Simulace (4×10 dní, dnešní stav):** jen Hegemonie s dělem: ~9 zásahů a ~2–3 zabití na místě denně, stav drží ~0,9 (oprava 2–8 %/den). Obě strany s dělem: Hegemonie (potrhaný drát, málo volných ženistů) klesne za 10 dní na ~0,54, Concord drží ~0,85. Hegemonie má kvůli drátu bunkry první dny bez opravy.
- Noviny: denní zpráva „{gun} fired“ (úseky, zásahy, zabití, stav, oprava ženistů), zničení, práce na vraku. Texty v `theme.battle.gun.news`.

## 2026-11-20 · Nástupce dědí roli, kterou si vybral hráč (NASAZENO)
- Dřív nástupce padlého dostal vždy náhodnou roli; převelení i přání role z komentáře (i čekající převelení) se ztratilo. Uživatel: hráč si roli vybral, má mu zůstat.
- Teď (`heir` v `engine/soldier.js`): když předchůdce měl roli z přání (`roleWish`) nebo z převelení (`transferDay`), nástupce v ní pokračuje; čekající převelení (`pendingRole`) se splní hned (nová lhůta od dne nástupu). Poručík a pilot se nedědí. Bez volby hráče náhodná role jako dřív.
- Postižení před opravou: 24 převzatých hráčů, jejichž nástupce dostal jinou roli, než si vybrali (seznam v konverzaci 20. 11.); vrácení rolí jen se souhlasem uživatele.

## 2026-11-20 · First Thousand a dědění odznaků narukování (NASAZENO)
- Odznak **First Thousand** pro narukované 101.–1 000. (pořadí v soupisce jako First Wave), jednorázově příkazem `firstThousand`: zápis do deníku (`story.firstThousand`, 4 varianty s číslem), zpráva „The First Thousand“ do novin.
- **Dědění (uživatel):** na živého nástupce přechází podpora (War Bonds, hvězda) a odznaky narukování (First Wave, First Thousand), `theme.inheritMedals`. Vlastní zásluhy padlého (medaile kót, Raider's Cross, Medal of Valor…) zůstávají jemu; v albu rodu jsou vidět všechny generace. Příkaz `inheritMedals` vrátil First Wave rodům, kde voják padl.

## 2026-11-21 · Bone Quarry: mina pod frontou místo bombardování · NASAZENO (od výhry v závodě o Bone Quarry)
- **Proč:** uživatel nechtěl další bombardování a bezpečnější týden („chci něco zajímavějšího“). Vybral minu (historicky Messines 1917), ale „ne 3 dny, ať kopou den“.
- **Jak:** `theme.race.objectives[quarry].reward = 'mine'` → `grantMine` (`engine/mine.js`): vítěz dostane jednu minu, kopou ji až 6 jeho ženistů (jména v novinách).
  **Jeden den kopání, druhý bum** (uživatel 21. 11.): příští noviny po výhře hlásí kopání („Picks under the … line“, jména diggerů), ty další výbuch (`battle.mine.digDays = 1`, `m.at = den výhry + 2`). Žádný bezpečnější týden ani bombardování; stuha vítězné straně a titul hrdiny zůstávají jako u jiných kót.
- **Výbuch:** pod nejhustším úsekem nepřátelské **první linie** (okno 24 vojáků po sobě, nejkratší z 8 náhodných, `battle.mine.men/tries`), zásah 85 % (`hit`), závažnost jako u granátu, kritický zásah zabije na místě s 80 % (`kill`). Zpráva „The mine under the … line“ s úseky, zasaženými, zabitými a tunelovači.
- **Protiminování:** nepřátelští ženisti můžou kopání zaslechnout a tunel zavalit: 5 % + 0,1 % za každého zdravého ženistu, nejvýš 25 % (`counterBase/counterPer/counterMax`; teď ~13–15 %). Pak mina nevybuchne, diggeři přežijí, zpráva „The … heard them digging“.
- **Simulace na stavu 21. 11. (20 běhů):** vybuchla 18×, zavalena 2×; zasaženo průměrně 18 (12–22), zabito na místě 5 (2–9), další můžou zemřít na zranění.
- **Mapa** (`web/src/mine.js`, `roster.mines`): při kopání vstup do štoly v první linii vítěze (rám z trámů, rumpál, pytle s vytěženou hlínou, ženista, odlétající hlína); po výbuchu obří kráter natrvalo v nepřátelské první linii; zavalená = zasypaný vstup. Dev náhled `/?mine=0`, `/?mine=0:blown`, `/?mine=1:collapsed`.

## 2026-11-21 · Trench Dog: pes pro nejvyšší úroveň Patreonu · NASAZENO (engine a web; psa dává ruční příkaz)
- **Proč:** uživatel chce víc důvodů podpořit hru. Úrovně jsou teď 4 / 6 / 10 $. **Pes dostane Field Post (6 $) i Officers' Mess (10 $, k tomu hvězda); plemeno a jméno vždy losuje hra (200 jmen), ruční vybírání ne (uživatel: moc práce)**: střední úroveň má nejvíc lidí a dostávala jen novinky. Jen vzhled a příběhy, žádná výhoda v boji.
- **Sjednocení (21. 11.):** na mapě všichni psi sedí (ležící sprity zůstávají jen v zásobě), spodek spritu na stejné čáře, airedale a jezevčík přegenerovaní, aby barvy seděly k ležící verzi.
- **Příkazy** (`data/commands.json`): `{cmd:'dog', handle, breed?, name?}` a `{cmd:'undog', handle}` (`engine/dog.js`). Plemeno náhodně z 5 (`theme.dog.breeds`: airedale, shepherd, jackrussell, collie, dachshund), jméno náhodně ze `story.dogNames` (bez duplicit), obojí jde zadat.
- **Deník:** při příchodu zápis `dogArrive`; pak jen občas, s šancí 12 % za den ≈ jednou za týden (`theme.dog.storyChance`, uživatel: nemusí být často) příběh psa `dog` (zdravý voják) nebo `dogWard` (raněný), připojí se k dennímu zápisu. **Jen vojáci se psem** (uživatel). Nástupce psa zdědí se zápisem `dogHeir`.
- **Web:** pes sedí vedle vojáka na mapě (raněný voják → pes leží), sprity `props/dog_<plemeno>_<sit|lie>.png` z PixelLabu (10 generací); na kartě řádek „🐕 jméno, plemeno, trench dog of the House of …“ s obrázkem. Dev náhled `/?dogs=30`.

## 2026-11-22 Zima na mapě (NASAZENO)
- Pokyn uživatele: 1. týden (od 22. 11.) sněží a padá poprašek, 2. týden víc sněhu, 3. týden plná zima.
- `theme.winter` = `start` + `points` [den od začátku, pokrytí 0..1]: 0 → 0,15; 7 → 0,35; 14 → 0,6; 21 → 0,85 (mezi body plynule, datum dne = warStart + state.day; `web/src/winter.js`).
- Vzhled: `terrain.js` přebarví povrch země, pytle (jen horní hrana) a rekvizity sněhovými tóny (paleta 24–26), dno zákopů zůstává bláto, louže zamrznou; přehledová mapa taky. Šum je předpočítaný (+25 % času kreslení bloku).
- Srážky: v zimě místo deště sněží (vločky), bouře = vánice, jasno = bez sněžení (`winterFall`). Náhled: `?snow=0..1&wx=snow|blizzard`.
- Zatím jen vzhled, boj ani texty počasí se nemění (návrh do budoucna: mráz zhorší ztráty bez lůžek, zimní texty počasí).

## 2026-11-22 Život v zákopu: nové animace (NASAZENO)
- PixelLab (postup „oprava 3“, 1 generace/směr): `smoke`, `eat`, `warmhands`, `stamp`, `wave` pro puškaře Hegemonie (jih) i Concordu (sever), 10 generací.
- `web/src/life.js` `fidget`: každé 1,2–3 s až 3 viditelní vojáci (bez akce, raněný ne, ne u drátu) zahrají 2–3 opakování; v zimě hlavně zahřívání rukou a podupávání, jinak kouření a jídlo. Jen postavy, které animaci mají (puškaři).
- Atlas spritů rozšířen na 2048 px (výška 2152; při 1024 by měl 4260 a přes limit textury 4096 na části telefonů).

## 2026-11-22 Zásobovací linie (NASAZENO, jen vzhled)
- `web/src/convoy.js`: cesta (koleje) těsně za zálohami směrem k frontě (mimo těžké dělo uprostřed mezi liniemi i mimo nemocnice vzadu), po ní pořád jezdí kolona (asi 1 vozidlo na 700 px fronty, tam i zpět): nákladní auto strany (PixelLab `props/truck_heg|truck_con`) nebo povoz s koněm (`cart_horse`). Houpání, kouř z výfuku. Bez vlivu na boj. (Původně jen za zálohami a občas: uživatel auto neviděl.)

## 2026-11-22 Prostorové zvuky (NASAZENO, jen web)
- `web/src/sound.js` (syntéza Web Audio, žádné nahrávky): nové smyčky podle polohy a přiblížení (`place`: stereo podle polohy na obrazovce, oddálení = tišší a tlumenější):
  motor nákladního auta (`truck`), povoz – klapot kopyt ve čtyřtaktu a vrzání (`cart`), hlahol vojáků v zákopu jen při přiblížení (`murmur`, hlasitost podle počtu vojáků v záběru),
  výstřel těžkého děla s dlouhým duněním (`cannon`, `web/src/guns.js`). Smyčka, která se ve snímku neozve (vozidlo mimo záběr), ztichne (`tickLoops`). V zimě podkres = vítr místo deště.

## 2026-11-23 · Smysl každé role: silnější puškař a přeplnění rolí (NÁVRH, čeká na souhlas)
**Proč:** uživatel: „umírá málo hráčů a vyplatí se jen odstřelovač“. Měření (vlastní simulace, 6 běhů × 3 dny, stav 23. 11.): zabitých na 100 vojáků role za den: puškař ~3,5, kulometčík ~6,7, odstřelovač ~14 (4× víc než puškař). Padlí ~53 H : 46 C denně.
**Návrh (varianta F):**
- Puškař: šance 0,25 → 0,45; zásahy 40 % lehce / 40 % těžce / 20 % kriticky (`roles.rifleman.severity` light 0,6, heavy 0,2).
- Těžký zásah zabije na místě 0,7 → 0,4 (`roles.killHeavy`): víc lidí přežije těžce raněných, rozhodují nosítka, lůžka a medici.
- Přeplnění rolí (`roles.<role>.ideal`, engine hotový, bez hodnot v theme nic nedělá): nad ideálním podílem ve straně střílí každý další méně, účinnost = ideal / podíl. Odstřelovač 10 %, kulometčík 14 % (+ šance 0,38 → 0,45).
**Výsledek simulace F:** zabitých na 100 vojáků role za den: puškař ~7,5, kulometčík ~6, odstřelovač ~7,5–9,7 (role vyrovnané). Padlí ~78 H : 59 C denně (H má málo puškařů a nad ideálem odstřelovače 14 % i kulometčíky 14 %, proto víc ztrát; vyrovná se volbou nováčků a převelením).
Nástroj: scratchpad `rolesim.mjs` (zabití podle role střelce); oficiálně `node tools/sim-edition.mjs --set …`.

## 2026-11-23 · Medaile: plná sada 24 kusů, denní a událostní vyznamenání (NÁVRH, čeká na souhlas)
**Proč:** přání patronů (Caleb: medaile dne v novinách a na IG) + uživatel: odměňovat i nejlepšího z wiring party, raidu apod. Detail, lore, texty a pravidla: `docs/MEDALS.md`, grafika `docs/mockups/medals/`.
**Návrh:** 12 druhů × 2 strany (Hegemonie železo/stříbro „Iron Register“, Concord bronz/mosaz z nábojnic). **Jednou týdně** (uživatel 23. 11.: denně je to moc) v nedělních novinách „Sunday parade“: za stranu nejvíc zásahů, nejlepší střelec, nejlepší medik, nejlepší z wiring party, z raidů, ze souboje děl, pilot (týdenní součty). Hned jen hrdina kóty a vánoční příměří. Automaticky a tiše (karta + deník): přežité těžké zranění, 7/14/30 dní, zima.

## 2026-11-23 · Sběratelské kartičky z wiring party a raidu (NÁVRH, čeká na souhlas)
**Proč:** uživatel: malá šance najít při výpravách sběratelský předmět, který se dědí z vojáka na vojáka (pin-up kartičky ve stylu malby na letadlech).
**Návrh (aktualizace 23. 11. večer, uživatel: 1,5 % je málo):** nález **8 %** wiring party / **10 %** raid / **10 %** pilot za den letu (na 10.–12. akci má ~60 % dobrovolníků aspoň jednu), jen kdo se vrátí živý, bez stropu (26 kartiček za noc na ~2 000 hráčů není moc; strop by s růstem hry šanci tiše snižoval); vzácnost 70/25/5 %; dědí nástupce jako medaile. Zobrazení: karta vojáka (KEEPSAKES), noviny, deník, album rodu. Dokončit 24. 11. Detail a grafika `docs/CARDS.md`, `docs/mockups/cards/`.

## 2026-11-23 · Úkryty na frontě + oblast světa v účtu (NÁVRH, dev náhled `?shelters=1`)
**Proč:** uživatel: místo přeskupování podle zemí ukázat původ hráčů v úkrytech, kde spí. Země omezit na velké celky.
**Návrh:** `web/src/shelters.js`: kryt (přední linie), plechový oblouk (podpůrná), stan (zálohy), ~1 úkryt na 28 vojáků, mimo obvaziště; vchod odvrácený od nepřítele (Concord vidíme vchody, Hegemonii zezadu).
Klik = panel se jménem úkrytu, počtem, 7 oblastmi světa (praporky) a jmény. Oblast si hráč vybere v účtu (`profiles/{uid}.region`), smyčka přenese k vojákovi. Snímky `docs/mockups/shelters/`.

## 2026-11-24: Sběratelské kartičky a medaile podporovatelů (NASAZENO)
- Kartičky „Sweetheart cards“ (`docs/CARDS.md`, `engine/cards.js`, `theme.cards`): kdo se vrátí z wiring party (8 %), nočního raidu (10 %) nebo letu pilota (10 %, nejvýš 1) živý a ne těžce raněný, najde kartičku. Bez stropu. Vzácnost 70 / 25 / 5 %. Dědí se v rodu. Noviny jen číslem („N sweetheart cards were picked up in the mud.“), deník jednou větou.
- Medaile podporovatelů (pixelové, `docs/MEDALS.md`): na kartě vojáka a v rodu jen nejvyšší úroveň. Bojové medaile zatím NE (uživatel je chce později jako novinku).

## 2026-11-24 · Role podle uživatele: puškař střílí víckrát, podpůrné role mají smysl, úkoly podle rolí (NÁVRH G/G3, čeká na souhlas)
**Zadání uživatele:** puškař silnější / víc výstřelů (víc nábojů, střílí celý den), odstřelovač si hledá cíl; ŽÁDNÝ postih za přeplnění (hráči si role volí sami); poručík, kuchař, kaplan a spojař lepší; péče dražší (medici ať stíhají méně); wiring nebezpečný (výhoda ženisté), raid velmi nebezpečný (výhoda puškaři); později průzkum pro odstřelovače.
**Engine (hotovo, bez hodnot v theme nic nemění):** `roles.<role>.shots`, `roles.cook.relief` + `cook.always`, `roles.chaplain.heavy`, `roles.signaller.counterFire`, `wiring.roles.<role>.{risk,repair}`, `raid.roles.<role>.{win,hurt}`.
**Návrh G:** puškař 3 výstřely; těžký zásah zabije na místě 0,4 (dřív 0,7); poručík lead 0,35 / covers 20; kuchař relief 0,5 (lehce raněný u kuchaře potřebuje o polovinu méně práce mediků), pomáhá i ošetřovaným, covers 8; péče light 1,5 / heavy 3 / crit 4; kaplan faith 0,35, i těžce raněným, covers 6; spojař counterFire 0,25 (střelci nepřítele u spojařů trefí méně); drát: ženista riziko ×0,5, oprava ×1,5; raid: hurt 0,4, raiderKill 0,75 / 0,5, puškař win ×1,3, hurt ×0,6. **G3** = G + kulometčík 2 výstřely.
**Simulace (stav 24. 11. ráno, 8 běhů × 3 dny, padlí H : C za den):** dnes 53 : 48 · G 77 : 59 · G3 89 : 70 · G2 (puškař 2 výstřely) 60 : 51.
Zabití na 100 vojáků role za den (puškař / kulomet / odstřelovač): dnes 3,5 / 6,5 / 13 · G 6,5 / 4,5 / 9,5 · G3 6,5 / 8,5 / 10.
Samí odstřelovači (H, G3): vlastní padlí 110 místo 89, nepřítel 67 místo 70 → nevyplatí se, i bez postihu. Samí puškaři: 114 a 55. Bez podpůrných rolí (G): H 99 místo 77. Bez mediků (G): +14 / +13 padlých denně.
Drát (G): zasažen ženista 14 %, ostatní 25–39 %. Raid (G): umírá 16–26 % raiderů, puškař zabije 43 na 100 raiderů (ostatní 24–33).
**Průzkum (NÁVRH, nepostaveno):** výzva SCOUT; v noci jdou dobrovolníci do země nikoho; úspěch označí kulomety a poručíky nepřítele v úseku → příští den vlastní palba v úseku +X % a odstřelovač vždy míří na označené cíle; riziko střední, odstřelovač ×0,5 rizika a lepší výsledek.

## 2026-11-24 · G3 nasazeno (NASAZENO, první vydání 24. 11. 13:00 UTC)
Uživatel: „udělej G3, péče jako dnes“ + puškař víc smrtelný („40 lehce / 30 těžce / 20 kriticky“, nastaveno 40/40/20 = `rifleman.severity` light 0,6, heavy 0,2).
Hodnoty: puškař 3 výstřely, kulomet 2 (potlačení dál), `killHeavy` 0,4, poručík 0,35 / 20, kuchař relief 0,5 + always + covers 8, kaplan 0,35 + heavy + covers 6, spojař counterFire 0,25, drát ženista riziko ×0,5 / oprava ×1,5, raid hurt 0,4, raiderKill 0,75 / 0,5, puškař win ×1,3 hurt ×0,6. Péče beze změny (1 / 2 / 3). Bez postihu za přeplnění.
Simulace (8 × 3 dny): padlí H 110 : C 84 za den (dřív 53 : 48), raněných ~250 : 228, pokrytí mediky 44 % / 63 %, bez péče umírá 36 : 19. Zabití na 100 vojáků role za den: puškař ~10,5, kulomet ~8, odstřelovač ~9,5. Samí odstřelovači: vlastní padlí 139 (místo 110), nepřítel 64 (místo 84) → nevyplatí se. Samí puškaři: 143 a 82.
Náhled vydání 24. 11. (`preview-tick`): H 94 padlých / 254 zasažených, C 70 / 242, medici 55 % / 75 %.
Ladění: šance a výstřely v `battle.roles`, jedno číslo; zpět na dřívější stav = smazat `rifleman.shots`, `machinegunner.shots`, vrátit `rifleman.severity` 0,3/0,12 a `killHeavy` 0,7.

## 2026-11-24 večer: dopis z domova (NASAZENO)
- Věty o dopisu: 36 různých (`theme.letters.lines`), střídají se po dnech (`(order + day) % n`). Dřív 3 věty a výběr jen podle pořadí narukování → denní odesílatel měl každý den stejnou větu (edheadl; jeho zápisy dny 12–16 přepsány příkazem fixEntry na pokyn uživatele).
- Kartička v dopise: 0,5 % na dopis, max. 1 z dopisů na vojáka (`docs/CARDS.md`).

## 2026-11-25: hlasování HOSPITAL / TANK (NÁVRH, vyjde s Day reelem Day 16)
Uživatel: „hodně raněných, dává smysl hlasování, které přidá nemocnici, ale ať je tam něco, co jim ztíží rozhodování: tank by určitě chtěli“. Každá strana volí sama, účinek od příští bitvy, 4 dny.
- **HOSPITAL:** trvale +1 nemocniční kryt (`build: dugout`: 4 lůžka, 4 nosítka), na 4 dny +20 nosítek, +80 práce mediků, úmrtnost kriticky raněných ×0,7 (`marketing/reels/front16.vote.draft.json`).
- **TANK:** na 4 dny palba všech vlastních střelců ×1,35, ale tank přitahuje palbu: zásahy na vlastní vojáky ×1,1 (`fire`, `exposed`). Hegemonie dostane **Behemoth** (těžký kosočtverečný, ocelově šedý s rezavým pruhem), Concord **Tortoise** (malý s věží, olivový se žlutou hvězdou); sprity `web/public/assets/props/tank_{heg,con}_{front,back,side}.png` z archu `art/cine/tank_sheet_a.png` (PixelLab 9 gen.).
- Na mapě zatím tank není (k doplnění, pokud TANK vyhraje). Čísla jsou odhad, neověřené simulací.

## 2026-11-26: TANK jako jednotka na mapě (NASAZENO jako výchozí varianta, čeká na potvrzení uživatele)
**Proč:** plošný TANK z hlasování (palba ×1,35, zásahy na vlastní ×1,1) byl příliš silný a skoro zadarmo. Simulace (20 běhů × 3 dny, stav 25. 11.): vlastní padlí +4 za den, nepřátelé padlí **+44** (z 88 na 131). HOSPITAL ušetří ~12 vlastních životů za den. Nemocnice by byla zbytečná.
**Nově (`theme.tank`):** tank je jeden na stranu, stojí v nejhustším úseku vlastní první linie (okno ±`r` px, engine `battle.js`, poloha `tankX` v rozkazu) a platí jen tam:
- vlastní střelci v okruhu `r` = 1 200 px (~15–17 % první linie, ~85 střelců): palba ×2,2;
- nepřítel zasahuje vlastní vojáky v okruhu ×1,8 (tank přitahuje palbu);
- jinde na frontě beze změny; 4 dny od příští bitvy.
**Simulace (20 běhů × 3 dny, za den):** základ H 93,8 : C 88,3 padlých; HOSPITAL H 81,7 (−12); TANK Hegemonie: vlastní +5, nepřátelé **+15** (raněných nepřátel +29); TANK Concord: vlastní +2, nepřátelé +16. Tank bere ~15 nepřátel za cenu 2–5 vlastních, nemocnice šetří ~12 vlastních: obě volby srovnatelně cenné.
**Vypnutí/ladění:** smazat `theme.tank` (pak platí starý plošný rozkaz) nebo změnit `r`/`fire`/`exposed`. Test: `engine/engine.test.js` „tank z hlasování“.
**Na mapě (`web/src/tank-fx.js`):** Behemoth (Hegemonie, čelní pohled) a Tortoise (Concord, zadní pohled) jezdí v cyklu ~27 s: u zákopu → VPŘED do země nikoho → pálí → COUVÁ (nikdy se neotáčí) → pálí → couvá k zákopu → pálí → dokola. Zášleh hlavně, zpětný ráz, kouř, kulometné dávky, dopady granátů v zákopu nepřítele, zvuk děla a motoru, prach a výfuk. Dev náhled `/?orders=0:TANK` (strana:heslo).
**Možné rozšíření (NÁVRH, nepostaveno):** tank se opotřebuje (4 dny = ~25 % denně), vlastní ženisté v okruhu ho opravují, nepřátelské těžké dělo (Grey Mill) ho může vyřadit (vrak na mapě); dává smysl ženistům a dělu.


## 2026-11-26: Polní nemocnice (10 lůžek) místo zemnic (NASAZENO, pokyn uživatele)
- Výsledek hlasování HOSPITAL (`build: dugout`) teď staví **Field hospital** (`theme.battle.buildings.hospital`): 10 lůžek, +8 nosítek, péče 1,6, riziko kritického 0,35; **přidá se** k obvazišti a zemnicím (lůžka a nosítka se sčítají, péče = nejlepší, riziko = nejnižší), max 1. Strana s 2 zemnicemi má tedy 18 lůžek místo 8. (Původní verze „nahradí zemnice“ zrušena na pokyn uživatele.)
- Mapování je v enginu (`upgradeBuild` v `engine/roster.js`), takže běžící hlasování se nemění. Smazáním klíče `buildings.hospital` v tématu se vrátí zemnice.
- Mapa: velká stavba vedle zemnic 312×104 px (`web/src/hospital.js`, `dugoutArt` s `beds >= 10`), 6 lůžek nahoře + 2 + 2 kolem vchodu, operační stůl, kamínka, police, střecha s křížem a plachtou barvy strany. Dev náhled `/?hospital=big`.
- Test: „polní nemocnice (10 lůžek) nahradí zemnice…“.
- **Pořadí (pokyn uživatele 26. 11.):** polní nemocnice se po výhře hlasování postaví (stojí hned po novinách, `state.pendingBuilds`, zpráva „…first patients go in tomorrow“), ale její účinek se do dnešního vyhodnocení nepočítá. Dnešní den (zranění, smrti, nemoci) se vyhodnotí ještě se starým obvazištěm a zemnicemi, stavba se dokončí až po dnešním boji (`dailyTick` po `battleTick`), lůžka platí od zítřejšího dne. Mapa ji ukáže hned po novinách.
