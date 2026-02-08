#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
mkdir -p data
git add data/*.md
if git diff --cached --quiet; then
  echo "No brief changes to commit."
  exit 0
fi
msg="chore: update briefs $(date +%F)"
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"
git checkout main
git commit -m "$msg"
git push
echo "Pushed: $msg"
