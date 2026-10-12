#!/bin/bash
# Pull the latest notes from the Obsidian vault and push them live.
# GitHub Actions rebuilds the site about a minute after the push.
set -euo pipefail
cd "$(dirname "$0")"

node scripts/sync-vault.mjs

git add -A content
if git diff --cached --quiet; then
  echo "No changes to publish."
  exit 0
fi
git commit -q -m "Update notes $(date +%Y-%m-%d)"
git push -q
echo "Published. Live at https://alexxlevesque.github.io/second-brain in about a minute."
