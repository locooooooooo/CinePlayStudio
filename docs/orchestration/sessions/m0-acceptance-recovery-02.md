# M0-D2 Final Acceptance Session

[验收]#最终验收@M0-r2
⟦tag:v2|session|m0-acceptance-recovery-02⟧

- task tag: ⟦tag:v2|task|m0-desktop-baseline⟧
- role tag: ⟦tag:v2|role|acceptance-final⟧
- thread id: `/root/m0_final_acceptance`
- worker state: blocked
- current gate: none
- allowed mutation: generated `dist/**`, `out/**`, `release/**`, staged `build-resources/bin/**`; command execution only
- forbidden mutation: `node_modules/**`, all source, package/lock/config, ADR, and `docs/orchestration/**` files
- expected callback: formal

## Acceptance

- Reuse the existing clean install and artifacts; do not reinstall dependencies.
- Run typecheck, tests, build, packaged FFprobe, and targeted lint/format on M0-owned files.
- Record full lint/format baseline failures separately without editing source.
- Launch dev and packaged Electron, prove a nonblank responsive window and working preload app-info API, then terminate only processes started by this lane.
- Record artifact sizes and SHA256 hashes.
- Return `verified`, `partial`, or `blocker` with exact evidence.

## Closure Note

- outcome: blocker
- blocker: external model returned `403 DAILY_LIMIT_EXCEEDED` before acceptance execution
- source changes: none
- next action: PM recovery acceptance completed the missing checks in a separate session card
