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
   - Commit status.json: `git commit -m "harness: mark <feature-id> as failed, needs fix"`

## Regression Check

After marking a feature `tested`, scan for any other features whose tests might have been affected. Re-run the full suite and confirm no regressions.
