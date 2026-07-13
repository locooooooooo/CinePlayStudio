# Current Dispatch Shortlist

updated_at: 2026-07-13T08:43:40Z
source task: ⟦tag:v2|task|m0-legacy-lint-baseline⟧

## Completed Lanes

- lint-core-data
  - role: short-worker
  - session: ⟦tag:v2|session|m0-lint-core-01⟧
  - state: archived
  - gate: M0-F1 verified
  - baseline: 39 errors
  - result: 0 errors
- lint-assets-flow
  - role: short-worker
  - session: ⟦tag:v2|session|m0-lint-assets-flow-01⟧
  - state: archived
  - gate: M0-F2 verified
  - baseline: 38 errors
  - result: 0 errors
- lint-media-ui
  - role: short-worker
  - session: ⟦tag:v2|session|m0-lint-media-ui-01⟧
  - state: archived
  - gate: M0-F3 verified
  - baseline: 47 errors
  - result: 0 errors

## Gate State

- loop state: summarized
- dispatch state: standby
- lint acceptance: full lint, typecheck, tests, and build pass with no eslint disable or config weakening
- format acceptance: full workspace format check passes after concurrent `docs/releases/**` writes stabilized
- workspace note: untracked `docs/releases/**` remains outside this submission
- next dispatch guard: keep M1 closed until this submission is committed and verified

## Worker Counts

- active: 0
- pending-dispatch: 0
- retained-owner: 1
- blocked: 1
- replaced: 1
- archived: 6
