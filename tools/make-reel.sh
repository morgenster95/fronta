#!/usr/bin/env bash
# Celý reel jedním příkazem (lokálně i v GitHub Actions, workflow „reel“):
#   bash tools/make-reel.sh <scénář> [crf=29]
# 1) data webu ze state.json  2) voiceover (jen když má scénář text v marketing/story_vo.py)
# 3) vývojový server + natočení (tools/record-reel.mjs)  4) zvuk (marketing/reel_audio.py)
# 5) zmenšení pro Instagram → marketing/promo/reel_<scénář>.mp4
set -euo pipefail
NAME="${1:?scénář, např. raid}"
CRF="${2:-29}"
cd "$(dirname "$0")/.."
PY="${PYTHON:-python3}"; command -v "$PY" >/dev/null || PY=python

npm run -s data:build
[ "$NAME" = "ridge" ] && node tools/ridge-reel.mjs   # podklady z aktuálního stavu (vítěz, hrdina, hlas hráče, počty)
[ "$NAME" = "rip" ] && node tools/rip-data.mjs   # padlí posledního tahu
if [[ "$NAME" =~ ^day[0-9]+$ ]] && [ "$NAME" != "day1" ]; then node tools/day-reel.mjs; [ -f "marketing/reels/$NAME.script.json" ] || { echo "stav hry je v jiném dni než $NAME"; exit 1; }; fi   # denní reel z aktuálního stavu
if grep -q "\"$NAME\": (" marketing/story_vo.py || [ -f "marketing/reels/$NAME.script.json" ]; then "$PY" marketing/story_vo.py "$NAME"; fi

npx vite --port 5187 --strictPort >/tmp/reel-vite.log 2>&1 &
VITE=$!
trap 'kill $VITE 2>/dev/null || true' EXIT
for i in $(seq 60); do curl -sf http://localhost:5187/ >/dev/null && break; sleep 1; done
node tools/record-reel.mjs "$NAME"
kill $VITE 2>/dev/null || true

"$PY" marketing/reel_audio.py "$NAME"
mkdir -p marketing/promo
ffmpeg -y -loglevel error -i "marketing/reels/${NAME}_sound.mp4" -c:v libx264 -crf "$CRF" -preset slow -pix_fmt yuv420p \
  -c:a aac -b:a 160k -movflags +faststart "marketing/promo/reel_${NAME}.mp4"
ls -la "marketing/promo/reel_${NAME}.mp4"
