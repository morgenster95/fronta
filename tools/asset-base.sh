#!/usr/bin/env bash
# Vypíše adresu zrcadla obrázků hry (GitHub Pages, složka /game), ale jen když tam leží STEJNÁ verze obrázků jako v repu.
# Jinak nevypíše nic a build bere obrázky z Firebase (nic se nerozbije). Důvod: Firebase Hosting (Spark) má limit 360 MB přenosu denně
# a obrázky tvoří ~70 % dat jedné návštěvy. Workflow media.yml nahrává obrázky na Pages a ukládá jejich otisk do game/assets.sha.
# Použití: export VITE_ASSET_BASE="$(bash tools/asset-base.sh)"
set -u
repo="${GITHUB_REPOSITORY:-morgenster95/fronta}"
owner="${repo%%/*}"; name="${repo#*/}"
base="https://$(echo "$owner" | tr 'A-Z' 'a-z').github.io/$name/game"
want=$(cd web/public/assets && find . -type f | LC_ALL=C sort | xargs sha1sum | sha1sum | cut -d' ' -f1)
have=$(curl -sf --max-time 10 "$base/assets.sha" | tr -d '[:space:]' || true)
if [ -n "$have" ] && [ "$have" = "$want" ]; then
  echo "$base"
else
  echo "zrcadlo obrázků není aktuální (Pages ${have:-nedostupné}, repo $want): obrázky půjdou z Firebase" >&2
fi
