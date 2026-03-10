#!/usr/bin/env bash
set -euo pipefail

# Node.js test runner
# Detects pnpm, npm, or yarn

echo "Running Node.js tests..."
if [ -f "pnpm-lock.yaml" ]; then
  pnpm test "$@"
elif [ -f "yarn.lock" ]; then
  yarn test "$@"
else
  npm test "$@"
fi
