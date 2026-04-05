#!/bin/bash
set -euo pipefail

cd /opt/newsbites

npm install
npm run build
systemctl restart newsbites.service

echo "NewsBites deployed and service restarted."
