# Worker Registry

updated_at: 2026-08-05T02:33:27Z

## Architecture Security

- identity: `[长工]#架构安全@M0`
- thread id: `/root/m0_architecture_security`
- state: retained-owner
- current gate: none
- session: ⟦tag:v2|session|m0-architecture-owner-01⟧
- next review: before any M1 dispatch

## Build Release

- identity: `[短工]#构建发行@M0`
- thread id: `/root/m0_build_release`
- state: archived
- current gate: none; M0-B verified through PM recovery acceptance
- session: ⟦tag:v2|session|m0-build-release-01⟧

## Desktop Shell

- identity: `[短工]#桌面壳@M0`
- thread id: `/root/m0_desktop_shell`
- state: archived
- current gate: none; M0-C verified through PM recovery acceptance
- session: ⟦tag:v2|session|m0-desktop-shell-01⟧

## Recovery Acceptance 01

- identity: `[验收]#恢复验收@M0`
- thread id: `/root/m0_recovery_acceptance`
- state: replaced
- session: ⟦tag:v2|session|m0-acceptance-recovery-01⟧
- note: artifacts existed, but no formal callback was available

## Final Acceptance 02

- identity: `[验收]#最终验收@M0-r2`
- thread id: `/root/m0_final_acceptance`
- state: blocked
- session: ⟦tag:v2|session|m0-acceptance-recovery-02⟧
- blocker: external model `DAILY_LIMIT_EXCEEDED`

## PM Recovery Acceptance

- identity: `[验收]#PM恢复验收@M0`
- thread id: `/root`
- state: archived
- session: ⟦tag:v2|session|m0-pm-acceptance-01⟧
- outcome: technical M0 chain verified; overall task remains partial on legacy full-repo quality gates

## Lint Core Data

- identity: `[短工]#核心数据Lint@M0`
- thread id: `/root/m0_lint_core`
- state: archived
- current gate: none; M0-F1 verified
- session: ⟦tag:v2|session|m0-lint-core-01⟧
- outcome: 39 lint errors cleared; callback and semantic review absorbed

## Lint Assets Flow

- identity: `[短工]#资产流程Lint@M0`
- thread id: `/root/m0_lint_assets_flow`
- state: archived
- current gate: none; M0-F2 verified
- session: ⟦tag:v2|session|m0-lint-assets-flow-01⟧
- outcome: 38 lint errors cleared; callback and independent semantic review absorbed

## Lint Media UI

- identity: `[短工]#媒体界面Lint@M0`
- thread id: `/root/m0_lint_media_ui`
- state: archived
- current gate: none; M0-F3 verified
- session: ⟦tag:v2|session|m0-lint-media-ui-01⟧
- outcome: 47 lint errors cleared; callback and PM semantic review absorbed

## P0-1 Schema

- identity: `[短工]#P0规范Schema@P0`
- thread id: `019fccd9-49c0-7c30-96b9-49f72ef0c8a8`
- state: archived
- current gate: none; P0-1 technically verified
- task: ⟦tag:v2|task|p0-1-schema⟧
- session: ⟦tag:v2|session|p0-1-schema-01⟧
- allowed files: `shared/contracts/project.ts`, `shared/contracts/project.test.ts`, `shared/contracts/project-fixtures/**`
- forbidden: existing UI/types, Electron/IPC, package/build/config, orchestration docs, Git, credentials and release/publish actions
- required callback: changedFiles, blockers, remainingRisk, rollbackPoint, nextAction, evidence; implemented/tested/accepted/committed/pushed reported separately
- PM review: canonical timelines shape and scene-duration clip boundary independently verified

## P0-2 Project Storage

- identity: `[短工]#P0项目存储@P0`
- thread id: `019fda43-ee20-7a33-b528-ff136317775a`
- state: archived
- current gate: none; P0-2 technically verified
- task: ⟦tag:v2|task|p0-2-project-storage⟧
- session: ⟦tag:v2|session|p0-2-project-storage-01⟧
- planned files: `src/project/project-repository.ts`, `src/project/project-repository.test.ts`, `src/project/project-fixtures/**`
- forbidden: existing source/UI, shared contract writes, Electron/IPC, config, docs, Git and release/publish actions
- activation receipt: real worker created at `2026-08-07T03:31:56Z`; final callback absorbed at `2026-08-07T04:15:00Z`
- final evidence: focused tests 15/15, typecheck, scoped ESLint and scoped Prettier passed
- final states: implemented complete; tested complete; technically verified complete; user accepted no; committed no; pushed no; published no

## ICE-01 Project Kernel E2

- identity: `[长工]#project-kernel@E2`
- thread id: `019fda43-ef63-7e40-abee-4493c8d31da5`
- state: blocked
- current gate: agent runtime `429 Too Many Requests`
- task: ⟦tag:v2|task|ice-01-project-kernel⟧
- session: ⟦tag:v2|session|ice-01-project-kernel-01⟧
- scope: ICE-01 project kernel and reliable save only; no ICE-02 through ICE-09 work
- write lock: none; no product source changes until explicit ICE-01 dispatch
- activation receipt: real worker created at `2026-08-07T03:31:56Z`
- blocker: subagent runtime exceeded retry limit before any ICE-01 source write
