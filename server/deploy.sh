#!/usr/bin/env bash
set -euo pipefail

HOST="${API_HOST:-ubuntu@89.168.117.165}"
APPROOT="${API_APPROOT:-/srv/nourin-api}"
SERVICE="${API_SERVICE:-nourin-api}"

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$here"

echo "building…"
npm run build

if [ ! -f dist/index.js ]; then
  echo "dist/index.js missing - build produced nothing" >&2
  exit 1
fi

echo "uploading to $HOST…"
tar -czf out.tgz dist package.json
scp out.tgz "$HOST:/tmp/api-out.tgz"
rm -f out.tgz

echo "installing into $APPROOT (sudo will prompt)…"
ssh -t "$HOST" "
  set -e
  sudo mkdir -p '$APPROOT'
  sudo chown \$USER:\$USER '$APPROOT'
  rm -rf /tmp/api-new && mkdir -p /tmp/api-new
  tar -xzf /tmp/api-out.tgz -C /tmp/api-new
  mkdir -p '$APPROOT/dist'
  rsync -a --delete /tmp/api-new/dist/ '$APPROOT/dist/'
  cp /tmp/api-new/package.json '$APPROOT/package.json'
  cd '$APPROOT'
  npm install --omit=dev --no-audit --no-fund
  sudo systemctl restart '$SERVICE'
  rm -rf /tmp/api-new /tmp/api-out.tgz
"

echo "done - https://nourin.is-a.dev/api/health"
