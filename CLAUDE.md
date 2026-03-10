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
