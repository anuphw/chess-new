#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "=== Running frontend tests ==="
cd "$PROJECT_ROOT/frontend"
npm test

# Note: the backend section below will fail until Task 20 (FastAPI backend) is complete.
# During Chunks 1–3, run frontend tests directly with: cd frontend && npm test
echo "=== Running backend tests ==="
cd "$PROJECT_ROOT/backend"
uv run pytest
