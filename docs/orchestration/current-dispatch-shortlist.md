# Current Dispatch Shortlist

updated_at: 2026-07-13T07:26:10Z
source task: ⟦tag:v2|task|m0-desktop-baseline⟧

## Lanes

- architecture-security
  - role: long-worker
  - session: ⟦tag:v2|session|m0-architecture-owner-01⟧
  - state: retained-owner
  - gate: M0-A verified
- build-release
  - role: short-worker
  - session: ⟦tag:v2|session|m0-build-release-01⟧
  - state: archived
  - gate: M0-B verified by PM recovery acceptance
- desktop-shell
  - role: short-worker
  - session: ⟦tag:v2|session|m0-desktop-shell-01⟧
  - state: archived
  - gate: M0-C verified by dev and packaged smoke
- recovery-acceptance-01
  - role: acceptance
  - session: ⟦tag:v2|session|m0-acceptance-recovery-01⟧
  - state: replaced
  - gate: partial artifact evidence only
- recovery-acceptance-02
  - role: acceptance
  - session: ⟦tag:v2|session|m0-acceptance-recovery-02⟧
  - state: blocked
  - gate: external model daily limit
- pm-acceptance
  - role: acceptance
  - session: ⟦tag:v2|session|m0-pm-acceptance-01⟧
  - state: archived
  - gate: M0 technical acceptance verified

## Gate State

- loop state: summarized
- dispatch state: standby
- M0 outcome: partial
- verified: ADRs, typecheck, 3/3 tests, build, NSIS, packaged FFprobe, dev smoke, packaged smoke, M0-targeted lint/format
- verified: full-repo format check passes after the initial repository formatting baseline
- blocker: full-repo lint has 124 legacy errors
- next dispatch guard: do not open M1 without legacy-lint closure or explicit residual-risk waiver

## Worker Counts

- active: 0
- retained-owner: 1
- blocked: 1
- replaced: 1
- archived: 3
