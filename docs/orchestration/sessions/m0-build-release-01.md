# M0-B Build and Release Session

[短工]#构建发行@M0
⟦tag:v2|session|m0-build-release-01⟧

- task tag: ⟦tag:v2|task|m0-desktop-baseline⟧
- role tag: ⟦tag:v2|role|short-worker-build-release⟧
- thread id: `/root/m0_build_release`
- worker state: archived
- current gate: none; M0-B verified
- allowed scope: root package/build/ESLint/Prettier/Vitest config, `scripts/**`, `build-resources/**`
- forbidden scope: `electron/**`, `shared/**`, `src/**`, `docs/orchestration/**`
- expected callback: formal

## Acceptance

- Node/tool versions and lockfile are deterministic.
- electron-vite keeps React and Tailwind configuration.
- electron-builder stages validated FFmpeg/FFprobe resources.
- Packaged verification script handles Chinese and spaced paths.
- Commands are executed after shell files are available, or exact cross-lane blocker is returned.

## Callback Absorption

- outcome: partial
- completed: deterministic configs, dependency lock, typecheck/build, media staging, direct FFprobe proof with Chinese and spaced path
- incomplete: clean `npm ci`, NSIS installer, packaged FFprobe, clean lint/format/test gates
- blockers: Windows `EBUSY` on Electron dependency and later `spawn EFTYPE` from the reinstalled FFmpeg binary; 126 legacy lint errors outside this lane
- next action: independent M0-D recovery acceptance without source edits
- evidence: build configs, staging/probe scripts, build outputs, and worker command report

## Final Acceptance Addendum

- NSIS installer generated successfully using the installed Electron distribution.
- Packaged FFprobe passed with Chinese and spaced paths.
- Installer and unpacked hashes and sizes are recorded in ⟦tag:v2|session|m0-pm-acceptance-01⟧.
