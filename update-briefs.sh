#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
mkdir -p data

# 生成 macro（把下面这一行换成你能在终端里跑通的“生成宏观简报命令”）
codex run --skill daily-macro-risk-brief > data/macro.md

# 生成 aviation（同理）
codex run --skill daily-aviation-brief > data/aviation.md

echo "Updated at: $(date)"
