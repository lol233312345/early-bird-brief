#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# 1) 运行你的“生成晨报”的命令（如果 automation 已经生成好了，这行可以不要）
# 例如：node scripts/generate-briefs.mjs
# 或者：python scripts/generate.py
# 或者：这里留空

# 2) 确保 data 目录存在
mkdir -p data

# 3) 提交 data/*.md（只提交 markdown）
git add data/*.md

# 4) 如果没有变化，就退出（避免每天空 commit）
if git diff --cached --quiet; then
  echo "No brief changes to commit."
  exit 0
fi

# 5) 自动 commit + push（用当天日期做 message）
msg="chore: update briefs $(date +%F)"
git commit -m "$msg"
git push
echo "Pushed: $msg"
