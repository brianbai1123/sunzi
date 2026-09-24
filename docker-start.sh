#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if ! docker info >/dev/null 2>&1; then
  echo "Docker 未运行。请先启动 Docker，或直接运行: python3 scripts/live_server.py --port 8766"
  exit 1
fi

docker compose up -d --pull missing
echo ""
echo "孙子读书卡已启动"
echo "本机访问: http://localhost:8766"
IP=$(hostname -I 2>/dev/null | awk '{print $1}')
if [ -n "${IP:-}" ]; then
  echo "同网手机: http://${IP}:8766"
fi
echo ""
echo "停止: ./docker-stop.sh"
