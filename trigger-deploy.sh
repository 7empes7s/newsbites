#!/bin/bash
# Trigger deploy via systemd one-shot service
# Can be called from any context (host, container, agent)
set -euo pipefail

if command -v systemctl &>/dev/null; then
  systemctl start newsbites-deploy.service
else
  # From inside a container, use nsenter via Docker socket
  docker run --rm --privileged --pid=host node:22-slim \
    nsenter -t 1 -m -u -i -n -p -- \
    systemctl start newsbites-deploy.service
fi

echo "Deploy triggered."
