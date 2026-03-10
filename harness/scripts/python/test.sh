#!/usr/bin/env bash
set -euo pipefail

# Python test runner using uv
# Requires: uv (https://github.com/astral-sh/uv)
# Install uv: curl -LsSf https://astral.sh/uv/install.sh | sh

echo "Running Python tests with uv..."
if [ $# -eq 0 ]; then
  uv run pytest -v
else
  uv run pytest "$@"
fi
