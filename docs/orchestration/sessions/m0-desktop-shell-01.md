# M0-C Desktop Shell Session

[短工]#桌面壳@M0
⟦tag:v2|session|m0-desktop-shell-01⟧

- task tag: ⟦tag:v2|task|m0-desktop-baseline⟧
- role tag: ⟦tag:v2|role|short-worker-desktop-shell⟧
- thread id: `/root/m0_desktop_shell`
- worker state: archived
- current gate: none; M0-C verified
- allowed scope: `electron/main/**`, `electron/preload/**`, `shared/contracts/**`
- forbidden scope: package/lock files, root build configs, `src/**`, `docs/orchestration/**`
- expected callback: formal

## Acceptance

- BrowserWindow uses context isolation, sandbox, no Node integration, and web security.
- Dev and packaged renderer paths match the build plan.
- Navigation, new windows, permissions, and external URL handling default closed.
- Preload exposes a narrow typed app-info API only.
- No project, asset, media, updater, OSS, or plugin execution is implemented.

## Callback Absorption

- outcome: partial
- completed: secure Main/Preload shell, app-info contract, 3/3 tests, typecheck, and build
- incomplete: dev and packaged window smoke
- blockers: Electron binary and ESLint configuration are owned by the active M0-B lane
- next action: dispatch independent acceptance after M0-B resolves its dependencies
- evidence: `out/main/index.js`, `out/preload/index.cjs`, `dist/renderer/index.html`, shared contract tests, dev smoke, and packaged smoke

## Final Acceptance Addendum

- Runtime smoke found and corrected the sandboxed ESM preload failure.
- Dev and packaged windows are nonblank and responsive.
- `window.gameEditor.app.getInfo()` succeeds with `packaged=false` and `packaged=true` respectively.
