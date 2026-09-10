# Current Dispatch Shortlist

updated_at: 2026-08-07T04:15:00Z
source task: ⟦tag:v2|task|p0-2-project-storage⟧

## Recently Closed P0 Lane

- p0-2-project-storage
  - role: short-worker
  - identity: `[短工]#P0项目存储@P0`
  - thread: `019fda43-ee20-7a33-b528-ff136317775a`
  - task: `docs/orchestration/tasks/p0-2-project-storage.md`
  - session: ⟦tag:v2|session|p0-2-project-storage-01⟧
  - state: archived
  - scope: `src/project/project-repository.ts`, `src/project/project-repository.test.ts`, `src/project/project-fixtures/**`
  - gate: P0-2 technically verified; source lock released
  - evidence: focused tests 15/15, typecheck, scoped ESLint and scoped Prettier passed

## Retained ICE Owner

- ice-01-project-kernel
  - role: long-worker / retained-owner
  - identity: `[长工]#project-kernel@E2`
  - thread: `019fda43-ef63-7e40-abee-4493c8d31da5`
  - task: `docs/orchestration/tasks/ice-01-project-kernel.md`
  - session: ⟦tag:v2|session|ice-01-project-kernel-01⟧
  - state: blocked; no implementation lock
  - guard: agent runtime 429 Too Many Requests; ICE-01 waits for gateway recovery

## Recently Closed P0 Lane

- p0-1-schema
  - role: short-worker
  - session: ⟦tag:v2|session|p0-1-schema-01⟧
  - thread: `019fccd9-49c0-7c30-96b9-49f72ef0c8a8`
  - state: archived
  - gate: P0-1 Schema technically verified
  - allowed: `shared/contracts/project.ts`, `shared/contracts/project.test.ts`, `shared/contracts/project-fixtures/**`
  - forbidden: existing source/UI, Electron/IPC, configuration, docs, Git, credentials and release/publish actions

## Completed M0 Lanes

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

## Next Candidate

- ICE-02 through ICE-09 remain `planned_not_dispatched`
  - guard: no dispatch until ICE-01 and each listed dependency is verified

## Gate State

- loop state: summarized
- dispatch state: standby
- active gate: none
- M0 submission: commit `a80d91b` and post-commit quality/package evidence absorbed; no package or lock change since the clean-install evidence
- P0-1 acceptance gate: canonical root shape, cross-entity references, scene-duration boundaries, rejection fixtures and focused tests independently verified
- workspace note: pre-existing unrelated untracked files remain outside this lane and must be preserved
- next dispatch guard: ICE-01 is blocked by agent runtime 429; ICE-02 through ICE-09 remain planned_not_dispatched

## Worker Counts

- active: 0
- pending-dispatch: 0
- retained-owner: 1
- blocked: 2
- replaced: 1
- archived: 8
