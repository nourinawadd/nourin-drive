#!/usr/bin/env bash
set -euo pipefail

REPO="${PREVIEW_REPO:-https://github.com/nourinawadd/nourinawadd.github.io.git}"

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$here"

echo "building…"
node scripts/build.mjs

if [ ! -f out/index.html ]; then
  echo "out/index.html missing — build produced nothing" >&2
  exit 1
fi

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

echo "cloning $REPO…"
git clone --depth 1 "$REPO" "$work"

find "$work" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -r out/. "$work/"
touch "$work/.nojekyll"

git -C "$work" add -A
if git -C "$work" diff --cached --quiet; then
  echo "nothing changed — preview is already current"
  exit 0
fi

git -C "$work" commit -m "preview: $(date -u '+%Y-%m-%d %H:%MZ')"
git -C "$work" branch -M main
git -C "$work" push -u origin main

echo "done — https://nourinawadd.github.io/"
