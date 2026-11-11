# Odbavení rekrutů: jak to funguje

_Stav k 11. 11. 2026: vše běží automaticky. Ruční postupy níže jsou jen záloha._

## Princip
1. Člověk napíše pod kterýkoli sledovaný příspěvek **@mudandiron** (připnutý náborový Reel + posledních 5 postů) slovo své strany:
   `CONCORD` nebo `HEGEMONY`. Stačí i v delším komentáři nebo v odpovědi pod cizím komentářem, velikost písmen nevadí.
2. Smyčka `front-loop` komentář do ~5 minut zpracuje: vznikne voják se jménem podle @handle (vzhled a příjmení rodu se odvodí z účtu),
   dostane **první volné stanoviště** své strany (od středu fronty, přední linie první). Místo je trvalé. Bot pod komentář veřejně odpoví.
3. **Jeden účet = jeden voják, strana se nemění.** Druhý komentář s jinou stranou se ignoruje.
4. **Role:** komentář, který zmíní právě jednu roli („CONCORD medic“, „MG“), ji dá hned. Zdarma je jen první volba, další změny přes převelení
   na kartě převzatého vojáka (1× za 7 dní). Lieutenant je jen za povýšení.
5. Na webu **mudandiron.web.app** se hráč najde vyhledáním svého @jména (odkaz v biu) nebo přes `/?s=handle`.
6. Každý den ve **13:00 UTC** vyjde ranní vydání (`docs/SCHEDULE.md`): denní boj, nové zápisy do služebních záznamů, povýšení,
   výsledek hlasování, Trench Gazette.

## Převzetí vojáka (claim)
Zapnuté (`claimEnabled = true` ve `web/src/firebase-config.js`). Na kartě vojáka tlačítko **This is me: claim** → přihlášení Googlem →
web ukáže kód `ENLIST-XXXX` → hráč ho napíše jako komentář na IG → smyčka kód spáruje s jeho IG účtem (Firestore).
Převzatý voják může žádat o převelení a (až budou výpravy zapnuté) hlásit se tlačítkem Volunteer.
Diagnostika: workflow **claim-check** (kód nebo handle).

## Hlasování
- Otevírá se samo po zveřejnění postu, který má ve frontě `marketing/queue.json` pole `vote`. Ručně: Actions → **open-vote**.
- Hlasuje se komentářem s heslem pod tím postem, platí poslední hlas na účet. U hlasování po frakcích (`perFaction`) hlasuje jen ten,
  kdo má vojáka; strana se bere z vojáka. Kdo ještě nenarukoval, napíše stranu i heslo v jednom komentáři.
- Běží vždy jen jedno hlasování. Vyhodnotí ho ranní vydání (nejdřív `minHours` po otevření), výsledek je v Gazette a ve **War Roomu** na webu.

## Provoz
- **Smyčka** `front-loop` (`tools/loop.sh`): každých ~5 min komentáře, odpovědi, fronta příspěvků, 1× denně denní tah, commit stavu, nasazení webu.
  Běží ~5,5 h a pak spustí sama sebe; plánovač ji každé 3 h oživí, kdyby spadla.
- **Hlídač** `watchdog` každých 20 min: běží smyčka? Ukazuje web stejné vojáky jako data? Když ne, smyčku nebo nasazení spustí a založí issue (přijde e-mail).
- Tři kola smyčky selžou po sobě nebo se nepodaří nasadit web → issue se štítkem `loop-trouble` / `deploy-failed`, samo se zavře po nápravě.
- **Token IG:** workflow `refresh-token` každé pondělí (potřebuje secret `GH_PAT`).

## Ruční zálohy (když automatika nejede)
| Workflow | K čemu |
|---|---|
| **enlist** | ruční narukování: do pole `jan.novak CONCORD, petra_k HEGEMONY` |
| **ingest** | jedno stažení komentářů |
| **daily** | denní tah ručně |
| **publish** | zveřejnění položek z fronty podle ID |
| **deploy** | nasazení webu s plným výpisem |
| **ig-check** | ověření napojení na Instagram (nic neukládá) |

## Zapojení od nuly (už hotové, jen pro případ obnovy)
1. **Instagram:** @mudandiron jako profesionální účet (Creator nebo Business), veřejný.
2. **Meta aplikace:** developers.facebook.com → aplikace typu Business, systémový token z firemního portfolia s oprávněními pro komentáře,
   publikování obsahu a (volitelně) zprávy. Seznam je v hlavičce `ingest/poll-comments.mjs`.
3. **GitHub** → Settings → Secrets and variables → Actions:
   - Secrets: `IG_ACCESS_TOKEN`, `IG_USER_ID`, `FIREBASE_SERVICE_ACCOUNT` (Firebase Console → Project settings → Service accounts → nový klíč, celý JSON), volitelně `GH_PAT`.
   - Variables: `IG_ENABLED = true`, `IG_REPLY = 1` (odpovědi pod komentáře), `IG_MEDIA_IDS` (ID připnutého náborového Reelu), `SITE_URL`, volitelně `IG_SEND_DM = 1`, `FIRESTORE`.
4. **Firebase:** Authentication → Google zapnout; Firestore (Native); `authDomain` = `mudandiron.web.app` a v Google Cloud Console u OAuth klienta
   redirect URI `https://mudandiron.web.app/__/auth/handler`.
5. **Kontrola:** Actions → **ig-check** → Run; pak Actions → **front-loop** → Run workflow (stačí jednou).

Tokeny a klíče patří jen do GitHub Secrets. Repo je veřejné.
