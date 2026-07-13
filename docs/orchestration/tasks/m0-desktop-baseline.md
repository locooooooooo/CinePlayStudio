# M0 Desktop Baseline

⟦tag:v2|task|m0-desktop-baseline⟧

- objective: establish a secure Electron build baseline and packaged FFprobe proof while preserving the current React UI
- state: verified
- milestone: M0
- truth source: `docs/pc-desktop-porting-technical-plan.md`, sections 3, 6, 13, 15, 16

## Child Lanes

### M0-A Architecture and Security

- Produce four ADRs for project ownership, canonical schema, MVP script policy, and Web/PC boundary.
- Do not implement product code.
- outcome: verified on 2026-07-13; four ADRs accepted and independently checked.

### M0-B Build and Release

- Establish dependency, electron-vite, electron-builder, Node version, binary staging, and packaged FFprobe verification surfaces.
- Preserve Tailwind and the existing renderer root.
- outcome: verified through PM recovery acceptance; clean dependency lock validation, NSIS, packaged probe, sizes, and hashes captured.

### M0-C Desktop Shell

- Establish secure Main/Preload entrypoints, production/development renderer loading, lifecycle, and narrow typed app API.
- Do not implement project storage or renderer integration.
- outcome: verified through PM recovery acceptance; CJS preload, dev smoke, packaged smoke, nonblank window, and app-info API passed.

### M0-D Recovery Acceptance

- Recover generated dependencies without source edits.
- Execute clean install, quality gates, Windows packaging, packaged FFprobe, and dev/packaged desktop smoke.
- Classify legacy lint/format debt separately from M0 regressions.

### M0-E PM Recovery Correction

- Switched sandbox preload output from ESM to CJS after runtime smoke exposed the real failure.
- Restricted TypeScript checks to source inputs so build output cleanup cannot race typecheck.
- Used the installed Electron distribution for deterministic electron-builder packaging.
- Closed M0-targeted lint and format checks without changing business source.
- outcome: verified.

### M0-F Legacy Lint Closure

- Split the 124-error baseline across three non-overlapping short-worker lanes.
- Reduced all full-repo lint errors to zero without rule suppression or configuration weakening.
- Passed full lint, typecheck, format, tests, build, semantic review, and diff checks.
- outcome: verified on 2026-07-13.

## Acceptance

- All three callbacks respect file locks.
- `npm ci`, typecheck, lint, tests, build, Windows packaging, and packaged FFprobe are executed or reported with precise blockers.
- Existing React source behavior is not intentionally changed.
- No M1 or later capability is pulled forward.

## Next Action

- Commit the verified M0-F closure and verify the resulting commit.
- Do not dispatch M1 within the M0 submission.
