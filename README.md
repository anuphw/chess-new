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

Install uv and set up the project:

    curl -LsSf https://astral.sh/uv/install.sh | sh
    uv init my-project
    cd my-project
    uv add --dev pytest

Copy the harness into your project:

    cp -r /path/to/harness harness/
    cp /path/to/CLAUDE.md .

Verify the test runner works:

    harness/scripts/test.sh

The test script runs: `uv run pytest`

### Flutter

Ensure the Flutter SDK is installed: https://flutter.dev/docs/get-started/install

Create a Flutter project and add the harness:

    flutter create my-project
    cd my-project
    cp -r /path/to/harness harness/
    cp /path/to/CLAUDE.md .

Verify the test runner works:

    harness/scripts/test.sh

The test script runs: `flutter test`

### Node.js

Initialize a project and add the harness:

    npm init -y
    cp -r /path/to/harness harness/
    cp /path/to/CLAUDE.md .

Verify the test runner works:

    harness/scripts/test.sh

The test script detects `pnpm-lock.yaml`, `yarn.lock`, or falls back to `npm test`.

### Other Languages

Add a new script at `harness/scripts/<language>/test.sh` and add detection logic to `harness/scripts/test.sh`. Follow the same pattern as the existing scripts.

## Workflow

```
Session start
  └─ Claude reads harness/CONTEXT.md + harness/status.json
       └─ Picks next pending feature
            └─ Reads harness/agents/feature-dev.md
                 └─ Applies reviewer checklist (harness/agents/reviewer.md)
                      └─ Marks feature done, runs harness/scripts/test.sh
                           └─ Tester reads harness/agents/tester.md
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
