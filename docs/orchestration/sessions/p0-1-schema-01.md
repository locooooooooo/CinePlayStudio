# P0-1 Schema Session

[短工]#P0规范Schema@P0
⟦tag:v2|session|p0-1-schema-01⟧

- task tag: ⟦tag:v2|task|p0-1-schema⟧
- role tag: ⟦tag:v2|role|short-worker-p0-1-schema⟧
- thread id: `019fccd9-49c0-7c30-96b9-49f72ef0c8a8`
- worker state: archived
- current gate: none; P0-1 technically verified
- allowed scope: `shared/contracts/project.ts`, `shared/contracts/project.test.ts`, `shared/contracts/project-fixtures/**`
- expected callback: formal
- commit/push: forbidden
- PM review: revised callback and independent fenced-diff review absorbed; canonical root shape and scene-duration clip boundary verified

## Dispatch Brief

Implement only the P0-1 runtime contract described in `docs/orchestration/tasks/p0-1-schema.md`, using ADR-0002 and the P0 product contract as the truth source. Work in the assigned isolated workspace, preserve unrelated dirty files, and stop with a blocker if the implementation needs an existing file or a configuration change.

## Callback Contract

```text
session identity
task tag
role tag
loop state: waiting_callback
dispatch state: waiting_callback
completed:
incomplete:
blockers:
next action:
evidence:
```

The callback must include exact changed files and separately state whether the lane is implemented, tested, technically verified, user accepted, committed, pushed and published. Source implementation evidence does not prove the P0 user journey.

## Handoff

- changedFiles: `shared/contracts/project.ts`, `shared/contracts/project.test.ts`, `shared/contracts/project-fixtures/invalid-projects.ts`, `shared/contracts/project-fixtures/valid-project.ts`
- blockers: no lane blocker; P0 persistence, real media and user acceptance remain open
- remainingRisk: persistence, import, timeline UI, preview, real export, P1 interaction and user acceptance remain open
- rollbackPoint: remove only newly added files within the lock
- nextAction: remain archived; a future P0-2 dispatch requires a new task/session card and lock
