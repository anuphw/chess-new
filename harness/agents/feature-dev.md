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

## Before Marking Done

Read `harness/agents/reviewer.md` and apply its checklist. Only proceed to "When Done" if the review passes.

## When Done

1. Set feature status to `done` in status.json
2. Update `session_summary` with what you did and what comes next
3. Commit status.json: `git commit -m "harness: mark <feature-id> as done"`
4. Hand off to the tester: the tester agent will run tests and mark it `tested`
