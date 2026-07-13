# Worker Registry

updated_at: 2026-07-13T07:26:10Z

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
