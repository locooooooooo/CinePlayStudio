# P0-1 Schema

⟦tag:v2|task|p0-1-schema⟧

- objective: implement the standalone, versioned runtime contract for the general-editor P0 project model and its rejection fixtures
- product priority: P0; structured interaction is P1 and is not an implementation target
- state: technically-verified
- outcome: implemented, tested and technically verified; not user accepted
- parent: `docs/product/p0-general-editor-product-contract-2026-08-04.md`
- acceptance matrix: `docs/product/p0-general-editor-acceptance-matrix-2026-08-04.md`
- architecture source: `docs/adr/0002-canonical-project-document-schema.md`
- owner: `[短工]#P0规范Schema@P0`
- session: ⟦tag:v2|session|p0-1-schema-01⟧

## Allowed Write Scope

- `shared/contracts/project.ts`
- `shared/contracts/project.test.ts`
- `shared/contracts/project-fixtures/**`

New files only. Do not modify existing files or configuration.

## Required Slice

- Define the versioned `ProjectDocument` runtime contract and the P0 objects: Project, Asset, Track, Clip, Timeline and Export.
- Use Zod as the runtime source of truth and export inferred types or equivalent types without creating a second project JSON model.
- Enforce stable IDs, UTC timestamps, numeric byte sizes, project-root relative POSIX asset paths, non-negative and in-range clip timing, and references to existing project assets/tracks.
- Reject missing required fields, duplicate IDs, absolute or traversal paths, invalid timestamps/numbers, unsupported higher schema versions and executable plugin/script fields with structured, stable failure semantics.
- Keep P1 choices, variables, triggers and plugin descriptors static/non-executable; do not evaluate or accept script source as executable behavior.
- Add deterministic valid and invalid fixtures and focused Vitest coverage for the acceptance cases above.

## Forbidden Scope

- No project repository, persistence, revision or recovery implementation.
- No real asset copy/import, renderer adapter, preview, FFmpeg/export job, IPC, UI, `src/types.ts`, Electron or preload changes.
- No package, lock, TypeScript, ESLint, Prettier, Vite, Electron-builder or orchestration configuration changes.
- No Git commit/push, credentials, external publication or release claims.
- Do not make P1 structured interaction executable or expand this into a full editor integration.

## Acceptance And Evidence

- `npm run typecheck` passes without changing the config.
- `npm test -- shared/contracts/project.test.ts` or an equivalent focused Vitest invocation passes; report exact command and result.
- `npm run lint` and `npm run format:check` are not worker-owned gates; report only focused checks if run and leave full gates to PM.
- `git diff --check` passes for the fenced changes.
- Callback must list exact `changedFiles`, `blockers`, `remainingRisk`, `rollbackPoint`, `nextAction`, evidence, and separate `implemented`, `tested`, `technically verified`, `user accepted`, `committed`, `pushed`, `published` states.
- Any missing real media/project/runtime evidence remains `not verified`; schema fixtures do not close P0 end-to-end acceptance.

## Current Handoff

- M0 submission commit `a80d91b` is present and its post-commit quality/package evidence is absorbed by PM.
- This lane is closed after the revised callback and independent fenced-diff review.
- `changedFiles`: `shared/contracts/project.ts`, `shared/contracts/project.test.ts`, `shared/contracts/project-fixtures/invalid-projects.ts`, `shared/contracts/project-fixtures/valid-project.ts`.
- `blockers`: no lane blocker; persistence, real media behavior and end-to-end/user acceptance remain open at the P0 product level.
- `remainingRisk`: schema compatibility, migration, persistence, real media behavior and user acceptance remain open.
- `rollbackPoint`: remove only the worker's newly added fenced files; preserve all unrelated dirty worktree files.
- `nextAction`: keep P0-2 project storage draft-ready and dispatch it only as a new explicitly fenced task; do not infer P0 completion from this schema slice.
