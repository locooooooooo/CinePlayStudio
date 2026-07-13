# M0 PM Recovery Acceptance

[验收]#PM恢复验收@M0
⟦tag:v2|session|m0-pm-acceptance-01⟧

- task tag: ⟦tag:v2|task|m0-desktop-baseline⟧
- role tag: ⟦tag:v2|role|acceptance-pm-recovery⟧
- thread id: `/root`
- worker state: archived
- current gate: none; M0 technical acceptance complete
- outcome: partial at task level because full-repo quality gates remain red

## Completed

- Corrected sandbox preload output to `out/preload/index.cjs` and verified real API injection.
- Added deterministic local `electronDist` packaging after the default unpack path stalled twice.
- Added TypeScript source include/exclude boundaries to remove generated-output races.
- Passed `npm ci --dry-run`, typecheck before and after build, 3/3 tests, Electron build, NSIS packaging, packaged FFprobe, and M0-targeted lint/format.
- Passed dev and packaged Playwright Electron smoke with nonblank 1424x835 windows and `gameEditor.app.getInfo()`.
- Rejected an initial dev smoke because port 5173 belonged to another workspace; reran GameEditor on the isolated 5193 server and captured the correct CineFlow Renderer evidence.
- Established and verified a full-repo Prettier baseline before the initial Git commit.

## Evidence

- installer: `release/GameEditor-0.1.0-Setup.exe`, 142954621 bytes
- installer SHA256: `B79A0078FABFAC6218BD47B8863D9B3CF4CF4C63837EA603FE1535DD28490E2D`
- unpacked executable SHA256: `CD62BEB1452661EB14C8312A9CF2438AE60B791A1DFCC8E20B551B813C64134F`
- unpacked size: 572.27 MB across 161 files
- packaged FFprobe: one stream returned from a Chinese and spaced temporary path
- packaged startup: launch 406 ms, interactive 1075 ms on the current machine
- packaged working sets: Browser 139.3 MB, GPU 97.9 MB, Utility 44.2 MB, Tab 104.4 MB
- known runtime noise: external Mixkit sample video returns HTTP 403; local app/preload resources succeed
- package warnings: author, description, product icon, code signing, and 572.27 MB unpacked-size optimization remain later release work

## Incomplete

- Full `npm run lint`: 124 legacy errors outside the M0 desktop surface.
- Full `npm run format:check`: resolved; now passes.

## Next Action

- Keep M1 closed until the 124-error legacy lint baseline is resolved or explicitly waived as accepted residual risk.
