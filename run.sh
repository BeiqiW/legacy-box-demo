#!/usr/bin/env bash
# Legacy Box · 一键启动
# 用法：bash run.sh [dev|build|start]

set -e

cd "$(dirname "$0")"

MODE="${1:-dev}"

if [ ! -d "node_modules" ]; then
  echo "→ 首次运行，安装依赖..."
  npm install
fi

mkdir -p data/uploads

case "$MODE" in
  dev)
    echo "→ 启动开发模式 http://localhost:3000"
    npm run dev
    ;;
  build)
    echo "→ 构建生产版本"
    npm run build
    ;;
  start)
    echo "→ 启动生产模式 http://localhost:3000"
    npm run build
    npm run start
    ;;
  *)
    echo "用法：bash run.sh [dev|build|start]"
    exit 1
    ;;
esac
