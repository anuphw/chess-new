# AI Harness Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a reusable `harness/` directory template that gives Claude Code durable context across sessions, defines agent roles, tracks feature state in status.json, and enforces test discipline via scripts.

**Architecture:** A flat-file harness living at the project root — CLAUDE.md loads context at session start, harness/CONTEXT.md holds architecture notes, harness/status.json tracks feature lifecycle, harness/agents/ defines AI agent roles, and harness/scripts/ provides language-specific test runners.

**Tech Stack:** Markdown, JSON, Bash scripts, Python/uv (pytest), Flutter (flutter test), Node.js (npm test)

---

### Task 1: Create harness directory skeleton

**Files:**
- Create: `harness/CONTEXT.md`
- Create: `harness/status.json`
- Create: `harness/agents/feature-dev.md`
- Create: `harness/agents/tester.md`
- Create: `harness/agents/reviewer.md`
- Create: `harness/scripts/test.sh`
- Create: `harness/scripts/python/test.sh`
- Create: `harness/scripts/flutter/test.sh`
- Create: `harness/scripts/node/test.sh`

**Step 1: Create harness/CONTEXT.md**

```markdown
# Project Context

> This file is read by Claude Code at the start of every session.
> Keep it updated as architecture evolves.

## Tech Stack

- Language: [e.g. Python 3.12, managed with uv]
- Framework: [e.g. FastAPI]
- Testing: [e.g. pytest]
- Key dependencies: [list them]

## Architecture

[2-3 sentences describing the overall structure. e.g. "This is a REST API with a service layer. Business logic lives in src/services/. Routes are in src/routes/."]

## Key File Paths

- Entry point: `src/main.py`
- Tests: `tests/`
- Config: `config/`

## Important Decisions

- [Decision 1 and why it was made]
- [Decision 2 and why it was made]

## Gotchas

- [Anything surprising or non-obvious about this codebase]
```

**Step 2: Create harness/status.json**

```json
{
  "last_updated": "YYYY-MM-DD",
  "session_summary": "Project just initialized. No features implemented yet.",
  "features": [
    {
      "id": "example-feature",
      "name": "Example Feature",
      "status": "pending",
      "notes": "Replace this with your first real feature"
    }
  ],
  "next_actions": [
    "Fill in harness/CONTEXT.md with your project's architecture",
    "Replace the example feature in status.json with real features",
    "Run harness/scripts/test.sh to verify the test setup works"
  ]
}
```

**Step 3: Create harness/agents/feature-dev.md**

```markdown
# Feature Developer Agent

You are implementing a feature for this project.

## Before You Start

1. Read `harness/status.json` — find the first feature with status `pending` or `in-progress`
2. Read `harness/CONTEXT.md` — understand the architecture
3. Set the feature status to `in-progress` in status.json

## During Implementation

- Follow TDD: write tests first, then implementation
- Keep commits small and frequent
- If you discover something important about the codebase, add it to harness/CONTEXT.md

## When Done

1. Set feature status to `done` in status.json
2. Update `session_summary` with what you did and what comes next
3. Run `harness/scripts/test.sh` to verify nothing is broken
4. If all tests pass, set status to `tested`
5. Commit status.json: `git commit -m "harness: mark <feature-id> as tested"`
```

**Step 4: Create harness/agents/tester.md**

```markdown
# Tester Agent

You are validating that a feature works and hasn't broken anything.

## Steps

1. Read `harness/status.json` — find features with status `done`
2. Run `harness/scripts/test.sh`
3. If all tests pass:
   - Set feature status to `tested` in status.json
   - Update `session_summary`
   - Commit: `git commit -m "harness: mark <feature-id> as tested"`
4. If tests fail:
   - Note the failure in the feature's `notes` field
   - Set status back to `in-progress`
   - Update `next_actions` with what needs to be fixed
   - Commit status.json with the failure notes

## Regression Check

After marking a feature `tested`, scan for any other features whose tests might have been affected. Re-run the full suite and confirm no regressions.
```

**Step 5: Create harness/agents/reviewer.md**

```markdown
# Reviewer Agent

You are reviewing code before a feature is marked `done`.

## Checklist

- [ ] Does the implementation match what was described in status.json?
- [ ] Are there tests for the happy path?
- [ ] Are there tests for edge cases and error conditions?
- [ ] Does anything need to be added to harness/CONTEXT.md?
- [ ] Are there any obvious security issues (injection, unvalidated input)?
- [ ] Is the code minimal — no unused code, no over-engineering?

## Output

If review passes: confirm the feature can be marked `done`.
If issues found: list them specifically with file:line references and what to fix.
```

**Step 6: Create harness/scripts/test.sh (entry point)**

```bash
#!/usr/bin/env bash
set -euo pipefail

# AI Harness — universal test entry point
# Detects project language and delegates to language-specific script.
# Add your language detection logic here.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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
```

**Step 7: Create harness/scripts/python/test.sh**

```bash
#!/usr/bin/env bash
set -euo pipefail

# Python test runner using uv
# Requires: uv (https://github.com/astral-sh/uv)
# Install uv: curl -LsSf https://astral.sh/uv/install.sh | sh

echo "Running Python tests with uv..."
uv run pytest "${@:---v}"
```

**Step 8: Create harness/scripts/flutter/test.sh**

```bash
#!/usr/bin/env bash
set -euo pipefail

# Flutter test runner
# Requires: Flutter SDK (https://flutter.dev/docs/get-started/install)

echo "Running Flutter tests..."
flutter test "$@"
```

**Step 9: Create harness/scripts/node/test.sh**

```bash
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
```

**Step 10: Make scripts executable**

```bash
chmod +x harness/scripts/test.sh
chmod +x harness/scripts/python/test.sh
chmod +x harness/scripts/flutter/test.sh
chmod +x harness/scripts/node/test.sh
```

**Step 11: Commit the harness skeleton**

```bash
git add harness/
git commit -m "feat: add AI harness skeleton with context, status, agents, and test scripts"
```

---

### Task 2: Create CLAUDE.md

**Files:**
- Create: `CLAUDE.md`

**Step 1: Create CLAUDE.md**

```markdown
# AI Harness

At the start of EVERY session, read these files in order:

1. `harness/CONTEXT.md` — project architecture and key decisions
2. `harness/status.json` — current feature state and next actions

## Before implementing a feature

Read `harness/agents/feature-dev.md` for the workflow.

## Before testing

Read `harness/agents/tester.md` for the workflow.

## Before marking a feature done

Read `harness/agents/reviewer.md` for the checklist.

## After completing any feature

1. Update `harness/status.json` — set feature status, update session_summary and next_actions
2. Run `harness/scripts/test.sh`
3. Commit status.json

## Important

Never skip updating status.json. It is the only thing that survives context compression.
```

**Step 2: Commit CLAUDE.md**

```bash
git add CLAUDE.md
git commit -m "feat: add CLAUDE.md with harness loading instructions"
```

---

### Task 3: Create README.md

**Files:**
- Create: `README.md`

**Step 1: Write README.md**

```markdown
# AI Project Harness

A lightweight pattern for keeping AI coding assistants (like Claude Code) oriented across long sessions and context compression.

## The Problem

AI assistants have limited context windows. As sessions grow:
- The AI forgets what has been built
- Key architectural decisions get lost
- No continuity between sessions
- Features get "implemented" but never properly tested

## What This Harness Does

- **Survives context compression** — `harness/CONTEXT.md` and `harness/status.json` are always reloaded at session start
- **Tracks feature lifecycle** — `pending → in-progress → done → tested`
- **Defines agent roles** — `harness/agents/` tells the AI exactly how to behave for each type of task
- **Enforces test discipline** — `harness/scripts/test.sh` must pass before any feature is marked `tested`

## How to Use It

1. Copy the `harness/` directory and `CLAUDE.md` into your project root
2. Fill in `harness/CONTEXT.md` with your project's architecture
3. Replace the example feature in `harness/status.json` with your real features
4. Start a Claude Code session — it will read the harness automatically

## Language-Specific Setup

### Python (uv)

```bash
# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Initialize project
uv init my-project
cd my-project

# Add test dependency
uv add --dev pytest

# Copy harness into project
cp -r /path/to/harness harness/
cp /path/to/CLAUDE.md .

# Verify test runner works
harness/scripts/test.sh
```

The test script runs: `uv run pytest`

### Flutter

```bash
# Ensure Flutter SDK is installed: https://flutter.dev/docs/get-started/install

# Create Flutter project
flutter create my-project
cd my-project

# Copy harness into project
cp -r /path/to/harness harness/
cp /path/to/CLAUDE.md .

# Verify test runner works
harness/scripts/test.sh
```

The test script runs: `flutter test`

### Node.js

```bash
# Initialize project
npm init -y   # or: pnpm init

# Copy harness into project
cp -r /path/to/harness harness/
cp /path/to/CLAUDE.md .

# Verify test runner works
harness/scripts/test.sh
```

The test script detects `pnpm-lock.yaml`, `yarn.lock`, or falls back to `npm test`.

### Other Languages

Add a new script at `harness/scripts/<language>/test.sh` and add detection logic to `harness/scripts/test.sh`. Follow the same pattern as the existing scripts.

## Workflow

```
Session start
  └─ Claude reads harness/CONTEXT.md + harness/status.json
       └─ Picks next pending feature
            └─ Reads harness/agents/feature-dev.md
                 └─ Implements (TDD)
                      └─ Reads harness/agents/reviewer.md
                           └─ Runs harness/scripts/test.sh
                                └─ Updates status.json → "tested"
                                     └─ Commits
```

## File Reference

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Tells Claude Code to load harness at session start |
| `harness/CONTEXT.md` | Architecture, decisions, key file paths |
| `harness/status.json` | Feature state and next actions |
| `harness/agents/feature-dev.md` | How to implement a feature |
| `harness/agents/tester.md` | How to test and validate |
| `harness/agents/reviewer.md` | Code review checklist |
| `harness/scripts/test.sh` | Universal test entry point |
| `harness/scripts/python/test.sh` | Python/uv test runner |
| `harness/scripts/flutter/test.sh` | Flutter test runner |
| `harness/scripts/node/test.sh` | Node.js test runner |
```

**Step 2: Commit README.md**

```bash
git add README.md
git commit -m "docs: add README explaining harness purpose and language setup"
```

---

### Task 4: Verify the harness

**Step 1: Check all files exist**

```bash
find harness/ -type f | sort
```

Expected output:
```
harness/CONTEXT.md
harness/agents/feature-dev.md
harness/agents/reviewer.md
harness/agents/tester.md
harness/scripts/flutter/test.sh
harness/scripts/node/test.sh
harness/scripts/python/test.sh
harness/scripts/test.sh
harness/status.json
```

**Step 2: Verify scripts are executable**

```bash
ls -la harness/scripts/test.sh harness/scripts/python/test.sh harness/scripts/flutter/test.sh harness/scripts/node/test.sh
```

Expected: all show `-rwxr-xr-x`

**Step 3: Verify status.json is valid JSON**

```bash
python3 -c "import json; json.load(open('harness/status.json')); print('Valid JSON')"
```

Expected: `Valid JSON`

**Step 4: Final commit**

```bash
git log --oneline
```

Expected: 4 commits visible (design doc, harness skeleton, CLAUDE.md, README)
