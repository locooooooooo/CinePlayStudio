# P0 General Editor Readiness

Date: 2026-08-04  
Scope: readiness and dispatch boundaries only  
Mutation: this file only; no product implementation performed

## Truth Snapshot

- M0 technical truth: verified. M0-A architecture ADRs, M0-B build/release, M0-C desktop shell, M0-D/E recovery and M0-F legacy lint closure are recorded as verified.
- M0 submission truth: commit `a80d91b` is present on `main`; post-commit quality/package evidence is absorbed. `npm ci` remains covered by unchanged M0 clean-install evidence.
- Existing source shape: React renderer under `src/**`; Electron main/preload under `electron/**`; typed contracts under `shared/contracts/**`; build and packaging under root config, `scripts/**` and `build-resources/**`.
- M0 evidence is a desktop/build baseline, not project storage, real asset copying, renderer integration, rendering, OSS, updater or plugin execution.

## Capability Classification

| Capability                                     | State                                 | Boundary                                                                |
| ---------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------- |
| M0 desktop shell, secure preload, app-info API | verified                              | Do not reopen without a regression finding                              |
| M0 build/package/FFprobe and quality gates     | technically verified; commit verified | Do not reopen without a regression finding                              |
| P0-1 schema                                    | technically verified                  | Four fenced contract/fixture files; no user acceptance or release claim |
| P0-2 project storage                           | prepare-only                          | New task/session card and lock required before implementation           |
| M1 asset import                                | prepare-only                          | Define import contract/tests; no real asset-copy implementation         |
| M1 renderer adapters                           | prepare-only                          | Define adapter boundary; no integration                                 |
| FFmpeg render, OSS, updater, plugin execution  | blocked                               | Out of the next dispatch package                                        |
| Credentials, Git, publish/release actions      | blocked in this lane                  | No credentials, Git mutation, deployment or publication                 |

Preparation documents describe work and ownership only. They do not constitute engineering implementation, acceptance or release readiness.

## M0 Closeout Gate

Before another P0 worker becomes active, PM must open a new bounded task/session card and file lock. M0 commit-level evidence already absorbed the following bounded checks:

```text
npm ci
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npm run dist:win
npm run verify:packaged-ffprobe
git diff --check
```

Windows packaging/probe evidence must include paths, exit status and artifact identity. A worker claim, preview or generated artifact alone is not acceptance evidence.

## Candidate M1 Source Lanes After M0 Verification

These lanes are mutually exclusive at the file level and remain draft-ready only until PM opens them.

### M1-S Project Storage

- Ownership: project document model, persistence service, revision/single-writer behavior and storage tests in a newly agreed storage-owned boundary.
- Candidate files: dedicated `src/project/**` or equivalent module plus tests; do not edit shared contracts, Electron bridge or existing UI without an approved dependency split.
- Acceptance: create/open/save/reload, revision ordering, path normalization, corruption/error classification and no `new Function`/`vm` execution.
- Blockers: canonical schema or project-root ownership ambiguity; shared-contract or preload changes return to PM.

### M1-A Asset Import

- Ownership: asset import job/domain module and tests in a dedicated `src/assets/**` or equivalent boundary.
- Candidate files: new import service/types/tests only; existing `AssetManager.tsx` is protected until explicitly assigned.
- Acceptance: supported file classification, copy/reference policy, collision handling, cancellation/error reporting and path containment.
- Blockers: unresolved project storage API, large-file streaming policy or UI changes crossing the storage lane.

### M1-R Renderer Adapter

- Ownership: renderer-facing adapter interface and isolated implementation tests in a dedicated `src/renderer/**` or equivalent boundary.
- Candidate files: new adapter module/tests only; `electron/**`, `shared/contracts/**`, `src/App.tsx` and existing timeline/player UI remain protected.
- Acceptance: typed input/output contract, deterministic unsupported state, no arbitrary script execution, and fixture tests that distinguish adapter behavior from live media proof.
- Blockers: contract changes, FFmpeg process ownership or any request to implement full rendering.

## Shared-File Rules

- One owner writes one lane; no worker edits another lane to repair type or lint failures.
- Cross-lane dependencies are formal blockers, not permission to widen a file fence.
- No worker edits package/lock files, TypeScript/ESLint/Prettier/build configuration, orchestration control files or another lane's source.
- Existing UI files and Electron/shared bridge files are protected shared surfaces; PM opens a focused follow-up only after callback absorption.
- Generated `dist/**`, `out/**`, `release/**` and staged media are command outputs only, not product implementation evidence.

## Acceptance And Callback

Each future session must use the formal callback shape in `docs/orchestration/callback-summary-template.md`:

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

Evidence must contain file paths and command results. The callback must state changed files and whether the lane is implemented, tested, accepted, committed and pushed separately. A prepare-only callback must explicitly say `source changes: none`.

## Handoff

- changedFiles: `docs/orchestration/sessions/p0-general-editor-readiness-2026-08-04.md` only for this status refresh; P0-1 source changes are recorded in its own session card
- blockers: no M0 closeout blocker; P0-2 remains draft-ready and requires a new explicit dispatch; real persistence/media/runtime/user acceptance remain open
- remainingRisk: human desktop acceptance, cross-lane contract design, large-file streaming and live media/render behavior remain unverified or intentionally blocked
- rollbackPoint: remove this new session document; no source, config, package, control-plane, Git, credential or release state was changed
- nextAction: keep P0-2 draft-ready; open exactly one new task/session card and explicit file lock only when PM dispatches the next bounded slice
