#!/usr/bin/env bash
set -euo pipefail

# The desktop is a static export (see next.config.ts) - nginx serves it off disk
# and there is no node process for it on the VM, which only has 956MB of RAM.
#
# out/ is ~800MB, almost all of it committed media. Pushing that from a laptop
# on every deploy is untenable, so the VM pulls the media from GitHub itself and
# only the build output (a few MB) crosses the wire from here.

HOST="${WEB_HOST:-ubuntu@89.168.117.165}"
DOCROOT="${WEB_DOCROOT:-/var/www/nourin}"
SRCROOT="${WEB_SRCROOT:-/srv/nourin-src}"
REPO="${WEB_REPO:-https://github.com/nourinawadd/nourin-drive.git}"
BRANCH="${WEB_BRANCH:-main}"

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$here/.."

if [ -n "$(git status --porcelain)" ]; then
  echo "working tree is dirty - the VM pulls media from origin/$BRANCH, so commit first" >&2
  exit 1
fi
if [ -n "$(git rev-list "origin/$BRANCH..$BRANCH" 2>/dev/null)" ]; then
  echo "local $BRANCH is ahead of origin - push first" >&2
  exit 1
fi

cd "$here"

# Set on the command line, not in a file: process.env beats every .env file, so
# this wins over the developer's .env.local without touching it. Both are
# inlined into the bundle at build time - changing them needs a rebuild.
echo "building…"
NEXT_PUBLIC_API_URL="${WEB_API_URL:-https://nourin.is-a.dev}" \
NEXT_PUBLIC_BLOG_URL="${WEB_BLOG_URL:-https://blog.nourin.is-a.dev}" \
npm run build

if [ ! -f out/index.html ]; then
  echo "out/index.html missing - build produced nothing" >&2
  exit 1
fi
if grep -rqF "localhost:5000" out/_next 2>/dev/null; then
  echo "build has localhost:5000 baked in - the env vars above did not take" >&2
  exit 1
fi

# Everything the VM can get from git is excluded here. music/covers and vendor/
# are gitignored build artefacts, so they stay in.
echo "packing build output…"
tar -czf out.tgz -C out \
  --exclude=./games --exclude=./gallery --exclude=./library \
  --exclude='./music/*.mp3' \
  .
echo "  $(du -h out.tgz | cut -f1) to upload"

scp out.tgz "$HOST:/tmp/nourin-out.tgz"
rm -f out.tgz

echo "syncing media from github + installing (sudo will prompt)…"
ssh -t "$HOST" "
  set -e

  if [ ! -d '$SRCROOT/.git' ]; then
    sudo mkdir -p '$SRCROOT'
    sudo chown \$USER:\$USER '$SRCROOT'
    git clone --depth 1 --branch '$BRANCH' '$REPO' '$SRCROOT'
  else
    cd '$SRCROOT'
    git fetch --depth 1 origin '$BRANCH'
    git reset --hard 'origin/$BRANCH'
    git clean -fd
  fi

  sudo mkdir -p '$DOCROOT'
  sudo rsync -a --delete '$SRCROOT/client/public/' '$DOCROOT/'

  rm -rf /tmp/nourin-new && mkdir -p /tmp/nourin-new
  tar -xzf /tmp/nourin-out.tgz -C /tmp/nourin-new
  sudo rsync -a /tmp/nourin-new/ '$DOCROOT/'

  sudo chown -R root:root '$DOCROOT'
  sudo find '$DOCROOT' -type d -exec chmod 755 {} +
  sudo find '$DOCROOT' -type f -exec chmod 644 {} +
  rm -rf /tmp/nourin-new /tmp/nourin-out.tgz
"

echo "done - https://nourin.is-a.dev"
