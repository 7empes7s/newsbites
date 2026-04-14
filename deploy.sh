#!/bin/bash
set -euo pipefail

cd /opt/newsbites

npm install --include=dev --legacy-peer-deps
npm run build

# This script is intentionally host-only. Container callers should use
# /opt/newsbites/trigger-deploy.sh so the host systemd unit owns restarts.
if ! command -v systemctl &>/dev/null; then
  echo "deploy.sh must run on the host with systemctl available. Use /opt/newsbites/trigger-deploy.sh from container contexts." >&2
  exit 1
fi

systemctl restart newsbites.service

echo "NewsBites deployed successfully."
