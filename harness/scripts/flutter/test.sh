#!/usr/bin/env bash
set -euo pipefail

# Flutter test runner
# Requires: Flutter SDK (https://flutter.dev/docs/get-started/install)

echo "Running Flutter tests..."
flutter test "$@"
