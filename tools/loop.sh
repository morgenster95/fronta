#!/usr/bin/env bash
# Smyčka fronty (spouští .github/workflows/front-loop.yml): každých 5 min komentáře z IG → vojáci, naplánované příspěvky,
# 1× denně denní tah, commit stavu a nasazení webu.
#
# Odolnost: každé kolo začíná z čistého origin/main (žádný rozbitý lokální stav ji nezasekne), chyba v kole
# nikdy neukončí smyčku, kolize při pushi = kolo se zopakuje, opakované potíže = GitHub issue (přijde e-mail).
set -u

MINUTES=${LOOP_MINUTES:-330}
END=$(( $(date +%s) + MINUTES * 60 ))
DEPLOYED=""
FAILS=0
export REPLIED_LOG="${RUNNER_TEMP:-/tmp}/replied.txt" # komentáře, na které už bot odpověděl (i když se kolo opakuje)
export PUBLISHED_LOG="${RUNNER_TEMP:-/tmp}/published.jsonl" # příspěvky zveřejněné v tomto běhu (nesmí vyjít dvakrát)
touch "$REPLIED_LOG" "$PUBLISHED_LOG"

# upozornění přes GitHub issue (jedno otevřené na štítek), zavře se samo po nápravě
alert() { # štítek, nadpis, text
  [ -n "$(gh issue list --label "$1" --state open --json number -q '.[0].number' 2>/dev/null)" ] && return
  gh label create "$1" --color B60205 2>/dev/null || true
  printf '%s\n\nIssue se zavře samo, až to zase půjde.\n' "$3" | gh issue create --title "$2" --label "$1" --body-file - || true
}
resolve() { # štítek, komentář
  for n in $(gh issue list --label "$1" --state open --json number -q '.[].number' 2>/dev/null); do gh issue close "$n" -c "$2" || true; done
}

sync() {
  git fetch -q origin main && git reset -q --hard origin/main
}

# jedno kolo; návratový kód 0 = hotovo, 2 = kolize při pushi (zopakovat hned)
round() {
  sync || { echo "sync selhal"; return 1; }
  node ingest/poll-comments.mjs || echo "ingest selhal"
  if node ingest/publish.mjs --due; then resolve publish-failed "Publikace zase funguje."
  else echo "publish selhal"; alert publish-failed "Publikace na Instagram selhala" "Smyčka nedokázala zveřejnit položku z fronty marketing/queue.json (zkusí to znovu v dalším kole). Podrobnosti v logu běhu front-loop."; fi
  # denní tah sám pozná, jestli už dnešní vydání (theme.schedule.editionUtc) proběhlo
  if node ingest/daily-tick.mjs; then resolve tick-failed "Denní tah zase proběhl."
  else echo "tick selhal"; alert tick-failed "Denní tah selhal: Gazette nevyšla" "Denní tah (ingest/daily-tick.mjs) skončil chybou, dnešní vydání nevyšlo. Smyčka to zkusí znovu v dalším kole. Podrobnosti v logu běhu front-loop."; fi
  npm run -s data:build || { echo "data:build selhal"; return 1; }
  git add data/state.json data/voices.json marketing/queue.json
  git add -u marketing/promo # zveřejněná videa, která publish.mjs smazal
  if ! git diff --cached --quiet; then
    git commit -qm "loop: $(date -u +%FT%TZ)" || return 1
    git push -q origin HEAD:main || { echo "push kolize, kolo se zopakuje"; return 2; }
  fi
  # nasadit jen když se změnilo to, co návštěvník uvidí (kód nebo veřejná data bez časových razítek; tools/site-sig.mjs).
  # Samotná změna stavu (zpracované komentáře, počty) web nemění a nasazovat se kvůli ní nemusí.
  SIG=$(node tools/site-sig.mjs) || SIG="$(git rev-parse HEAD)-$(date +%s)"
  if [ "$SIG" != "$DEPLOYED" ]; then
    npm run -s build > /dev/null || { echo "build selhal"; return 1; }
    if firebase deploy --only hosting --non-interactive --project fronta-ig > "${RUNNER_TEMP:-/tmp}/deploy.log" 2>&1; then
      echo "nasazeno $(git rev-parse --short HEAD)"
      DEPLOYED=$SIG
      resolve deploy-failed "Nasazeno, web je zase aktuální."
    else
      echo "NASAZENÍ SELHALO:"
      grep -iE "error|quota|denied|permission|exceed" "${RUNNER_TEMP:-/tmp}/deploy.log" | head -10
      alert deploy-failed "Web se nenasazuje" "Smyčka nemůže nasadit web mudandiron.web.app, hráči vidí stará data.

\`\`\`
$(grep -iE "error|quota|denied|exceed" "${RUNNER_TEMP:-/tmp}/deploy.log" | head -5)
\`\`\`"
      return 1
    fi
  fi
  return 0
}

while [ "$(date +%s)" -lt "$END" ]; do
  for attempt in 1 2 3; do
    round
    rc=$?
    [ $rc -ne 2 ] && break
    sleep $(( attempt * 5 ))
  done
  if [ $rc -eq 0 ]; then
    FAILS=0
    resolve loop-trouble "Smyčka zase běží bez chyb."
  else
    FAILS=$((FAILS + 1))
    echo "kolo selhalo ($FAILS× po sobě)"
    [ $FAILS -ge 3 ] && alert loop-trouble "Smyčka má potíže" "Poslední $FAILS kola smyčky selhala (komentáře, commit nebo nasazení). Podrobnosti v logu běhu front-loop."
  fi
  sleep "${LOOP_SLEEP:-300}"
done
