#!/usr/bin/env bash
set -euo pipefail

# AI Harness — universal test entry point
# Detects project language and delegates to language-specific script.
# Add your language detection logic here.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# NOTE: This script must be run from the project root directory.
# Language detection checks for files in the current working directory.
# If you get "Could not detect project language", check that you're running
# this from the project root (where pyproject.toml / pubspec.yaml / package.json lives).

if [ -f "pyproject.toml" ] || [ -f "uv.lock" ]; then
  echo "Detected Python project (uv)"
  exec "$SCRIPT_DIR/python/test.sh" "$@"
elif [ -f "pubspec.yaml" ]; then
  echo "Detected Flutter project"
  exec "$SCRIPT_DIR/flutter/test.sh" "$@"
elif [ -f "package.json" ]; then
  echo "Detected Node.js project"
  exec "$SCRIPT_DIR/node/test.sh" "$@"
else
  echo "ERROR: Could not detect project language."
  echo "Please run the appropriate script directly:"
  echo "  harness/scripts/python/test.sh"
  echo "  harness/scripts/flutter/test.sh"
  echo "  harness/scripts/node/test.sh"
  exit 1
fi
