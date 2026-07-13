# M0-D Recovery Acceptance Session

[验收]#恢复验收@M0
⟦tag:v2|session|m0-acceptance-recovery-01⟧

- task tag: ⟦tag:v2|task|m0-desktop-baseline⟧
- role tag: ⟦tag:v2|role|acceptance-recovery⟧
- thread id: `/root/m0_recovery_acceptance`
- worker state: replaced
- current gate: none
- allowed mutation: generated `node_modules/**`, `dist/**`, `out/**`, `release/**`, `build-resources/bin/**`
- forbidden mutation: all source, package/lock/config, ADR, and `docs/orchestration/**` files
- expected callback: formal

## Acceptance

- Identify and stop only workspace-owned stale Electron/Node install processes if needed.
- Complete `npm ci` without source-file changes.
- Run typecheck, lint, format check, tests, build, Windows packaging, and packaged FFprobe.
- Launch dev and packaged Electron long enough to prove the window remains alive and preload has no startup error; terminate only processes started by this lane.
- Record installer/unpacked sizes and artifact hashes.
- Separate pre-existing lint/format debt from M0-introduced failures; do not edit source to make gates green.

## Closure Note

- outcome: partial evidence only; no formal callback available
- observed artifacts: NSIS installer and `release/win-unpacked` exist
- replacement reason: worker no longer appears in the live agent registry and cannot provide the required callback
- next action: use the fresh M0-D2 acceptance session
