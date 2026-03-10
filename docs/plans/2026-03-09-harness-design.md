# AI Harness Design

**Date:** 2026-03-09

## Problem

AI coding assistants like Claude Code have limited context windows. As sessions grow long, context gets compressed and the AI loses track of:
- What has been built and what still needs building
- Key architectural decisions
- Which features are tested vs. just implemented

This causes drift, repeated mistakes, and loss of continuity between sessions.

## Solution

A `harness/` directory that lives alongside any project. It gives Claude Code durable, structured context that survives compression and re-orients the AI at the start of every session.

## Structure

```
my-project/
├── CLAUDE.md                  # Instructs CC to always load harness context first
├── harness/
│   ├── CONTEXT.md             # Architecture, key decisions, "what you need to know"
│   ├── status.json            # Feature state: pending/in-progress/done/tested
│   ├── agents/
│   │   ├── feature-dev.md     # Agent role: implement a feature
│   │   ├── tester.md          # Agent role: test and validate
│   │   └── reviewer.md        # Agent role: code review
│   └── scripts/
│       ├── test.sh            # Language-agnostic entry point
│       ├── python/
│       │   └── test.sh        # uv run pytest
│       └── flutter/
│           └── test.sh        # flutter test
└── README.md                  # What the harness is, why it exists, setup per language
```

## status.json Schema

```json
{
  "last_updated": "YYYY-MM-DD",
  "session_summary": "One-line summary of last session and what comes next",
  "features": [
    {
      "id": "feature-id",
      "name": "Human-readable name",
      "status": "pending | in-progress | done | tested",
      "notes": "Optional context or pointers to relevant files"
    }
  ],
  "next_actions": [
    "Specific actionable next step",
    "Run harness/scripts/test.sh after completion"
  ]
}
```

Feature status lifecycle: `pending` → `in-progress` → `done` → `tested`

## CLAUDE.md Convention

The root `CLAUDE.md` must instruct Claude Code to load harness files at session start:

```markdown
# Project Harness
At the start of EVERY session, read these files in order:
1. harness/CONTEXT.md — architecture and decisions
2. harness/status.json — current feature state and next actions

Before implementing any feature, read harness/agents/feature-dev.md.
Before testing, read harness/agents/tester.md.
After completing any feature, update status.json and run harness/scripts/test.sh.
```

## Agent Definitions

Each file in `harness/agents/` defines a role:

- **feature-dev.md**: How to read status.json, pick the next pending feature, implement it, and update status to `done`
- **tester.md**: How to run `harness/scripts/test.sh`, interpret results, update feature status to `tested`, and note regressions in status.json
- **reviewer.md**: What to check before marking a feature `done` — correctness, edge cases, no regressions introduced

## Test Scripts Convention

`harness/scripts/test.sh` is the universal entry point. It detects or delegates to language-specific scripts:

- `harness/scripts/python/test.sh` — `uv run pytest`
- `harness/scripts/flutter/test.sh` — `flutter test`
- `harness/scripts/node/test.sh` — `npm test` or `pnpm test`

## README Structure

1. The Problem (context compression, session drift)
2. What This Harness Does
3. How to Set It Up (copy harness/ into your project)
4. Language-Specific Setup (Python/uv, Flutter, Node.js, extensible)
5. Workflow (session start → read context → implement → test → update status)

## Language-Specific Setup

### Python (uv)
- `uv init` for project init
- `uv add pytest` for test dependency
- Test script: `uv run pytest`

### Flutter
- Standard Flutter project structure
- Test script: `flutter test`

### Node.js
- Test script: `npm test` or `pnpm test`
