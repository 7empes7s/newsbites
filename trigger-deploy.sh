#!/bin/bash
# Trigger deploy via the host systemd one-shot service.
# Safe entrypoint for host, container, and agent contexts.
set -euo pipefail

SERVICE_NAME="newsbites-deploy.service"
DEPLOY_HELPER_IMAGE="${DEPLOY_HELPER_IMAGE:-mimule/openclaw-gateway:local}"
DOCKER_SOCKET="${DOCKER_SOCKET:-/var/run/docker.sock}"
DOCKER_API_VERSION="${DOCKER_API_VERSION:-v1.41}"

usage() {
  cat <<'EOF'
Usage: trigger-deploy.sh

Starts the host systemd unit `newsbites-deploy.service` and waits for it to
finish. Use this script from containers or agents instead of calling
`deploy.sh` directly.
EOF
}

docker_api() {
  local method="$1"
  local path="$2"
  local body="${3-}"
  local args=(
    --silent
    --show-error
    --fail
    --unix-socket "$DOCKER_SOCKET"
    -X "$method"
  )
  if [ -n "$body" ]; then
    args+=(-H "Content-Type: application/json" --data "$body")
  fi
  curl "${args[@]}" "http://localhost/${DOCKER_API_VERSION}${path}"
}

json_field() {
  local field="$1"
  node -e '
    const fs = require("node:fs");
    const raw = fs.readFileSync(0, "utf8");
    const data = JSON.parse(raw);
    const key = process.argv[1];
    const value = data[key];
    if (value === undefined || value === null) process.exit(1);
    process.stdout.write(String(value));
  ' "$field"
}

run_on_host() {
  systemctl start --wait "$SERVICE_NAME"
}

run_via_docker_api() {
  if [ ! -S "$DOCKER_SOCKET" ]; then
    echo "Docker socket not available at $DOCKER_SOCKET." >&2
    exit 1
  fi

  local name="newsbites-trigger-$(date +%s%N)"
  local create_json
  local container_id
  local wait_json
  local status_code
  local logs=""

  create_json="$(cat <<EOF
{
  "Image": "${DEPLOY_HELPER_IMAGE}",
  "Tty": true,
  "Entrypoint": ["/usr/bin/nsenter"],
  "Cmd": ["-t", "1", "-m", "-u", "-i", "-n", "-p", "--", "systemctl", "start", "--wait", "${SERVICE_NAME}"],
  "HostConfig": {
    "AutoRemove": false,
    "Privileged": true,
    "PidMode": "host"
  }
}
EOF
)"

  cleanup() {
    if [ -n "${container_id:-}" ]; then
      docker_api DELETE "/containers/${container_id}?force=1&v=1" >/dev/null 2>&1 || true
    fi
  }
  trap cleanup EXIT

  create_json="$(docker_api POST "/containers/create?name=${name}" "$create_json")"
  container_id="$(printf '%s' "$create_json" | json_field Id)"

  docker_api POST "/containers/${container_id}/start" >/dev/null
  wait_json="$(docker_api POST "/containers/${container_id}/wait?condition=not-running")"
  status_code="$(printf '%s' "$wait_json" | json_field StatusCode)"

  if [ "$status_code" != "0" ]; then
    logs="$(docker_api GET "/containers/${container_id}/logs?stdout=1&stderr=1" || true)"
    if [ -n "$logs" ]; then
      printf '%s\n' "$logs" >&2
    fi
    echo "Host deploy trigger failed with exit code $status_code." >&2
    exit "$status_code"
  fi
}

case "${1:-}" in
  -h|--help)
    usage
    exit 0
    ;;
esac

if command -v systemctl &>/dev/null; then
  run_on_host
else
  run_via_docker_api
fi

echo "Deploy triggered."
