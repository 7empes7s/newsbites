#!/bin/bash
set -euo pipefail

cd /opt/newsbites

npm install --include=dev
npm run build

# Restart the service — try systemctl first, fall back to direct process kill+restart
if command -v systemctl &>/dev/null && systemctl is-active newsbites.service &>/dev/null; then
  systemctl restart newsbites.service
elif [ -f /opt/newsbites/.pid ]; then
  kill "$(cat /opt/newsbites/.pid)" 2>/dev/null || true
  sleep 1
  nohup npm run start -- --hostname 127.0.0.1 --port 3001 > /opt/newsbites/server.log 2>&1 &
  echo $! > /opt/newsbites/.pid
else
  # No PID file — find and kill existing next-server, then start fresh
  pkill -f "next-server.*3001" 2>/dev/null || true
  sleep 1
  nohup npm run start -- --hostname 127.0.0.1 --port 3001 > /opt/newsbites/server.log 2>&1 &
  echo $! > /opt/newsbites/.pid
fi

echo "NewsBites deployed successfully."
