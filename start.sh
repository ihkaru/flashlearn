#!/bin/sh
set -e

# Detect API directory portably (works in Docker /app as well as local repo)
if [ -d "/app/apps/api" ]; then
  API_DIR="/app/apps/api"
elif [ -d "./apps/api" ]; then
  API_DIR="./apps/api"
else
  API_DIR="$(cd "$(dirname "$0")/apps/api" 2>/dev/null && pwd)"
fi

if [ -n "$DATABASE_URL" ]; then
  echo "⚡ FlashLearn: Running safe production migration runner in $API_DIR..."
  bun run --cwd "$API_DIR" db:migrate || {
    echo "❌ FlashLearn: Database migration failed! Halting container to prevent data pipeline inconsistency."
    exit 1
  }

  echo "🌱 FlashLearn: Ensuring baseline verified domains and seeds exist..."
  bun run --cwd "$API_DIR" db:seed || echo "⚠️ FlashLearn: Baseline seed completed with advisory warning."
fi

echo "🚀 Launching FlashLearn Engine on port ${PORT:-3000}..."
exec bun "$API_DIR/src/index.ts"
