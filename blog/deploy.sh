#!/usr/bin/env bash
set -euo pipefail

HOST="${BLOG_HOST:-ubuntu@89.168.117.165}"
DOCROOT="${BLOG_DOCROOT:-/var/www/blog}"

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$here"

echo "building…"
node scripts/build.mjs

if [ ! -f out/index.html ]; then
  echo "out/index.html missing - build produced nothing" >&2
  exit 1
fi

echo "uploading to $HOST…"
tar -czf out.tgz -C out .
scp out.tgz "$HOST:/tmp/blog-out.tgz"
rm -f out.tgz

echo "installing into $DOCROOT (sudo will prompt)…"
ssh -t "$HOST" "
  set -e
  rm -rf /tmp/blog-new && mkdir -p /tmp/blog-new
  tar -xzf /tmp/blog-out.tgz -C /tmp/blog-new
  sudo mkdir -p '$DOCROOT'
  sudo rsync -a --delete /tmp/blog-new/ '$DOCROOT/'
  sudo chown -R root:root '$DOCROOT'
  sudo find '$DOCROOT' -type d -exec chmod 755 {} +
  sudo find '$DOCROOT' -type f -exec chmod 644 {} +
  rm -rf /tmp/blog-new /tmp/blog-out.tgz
"

echo "done - https://blog.nourin.is-a.dev"
