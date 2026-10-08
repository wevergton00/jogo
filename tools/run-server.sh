#!/usr/bin/env bash
# Sobe o servidor local do Barretos Clash na porta 8080
# Uso: ./tools/run-server.sh [porta]
cd "$(dirname "$0")/.." || exit 1
PORT="${1:-8080}"
echo "🤠 Barretos Clash -> http://localhost:$PORT"
exec python3 -m http.server "$PORT" --bind 0.0.0.0
