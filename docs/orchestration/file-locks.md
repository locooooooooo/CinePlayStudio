# File Locks

Only the listed owner may write each surface during the current gate.

## Current State

- No lint worker file locks are active.
- PM may update only `docs/orchestration/**` during closeout.

## Archived M0 Lint Lanes

- lint-core-data
  - allowed: `server.ts`, `src/App.tsx`, `src/types.ts`
  - forbidden: all other source, config, and docs
- lint-assets-flow
  - allowed: `src/components/AssetManager.tsx`, `src/components/Flowchart.tsx`, `src/components/Inspector.tsx`
  - forbidden: all other source, config, and docs
- lint-media-ui
  - allowed: `src/components/NativeEngineCenter.tsx`, `src/components/Player.tsx`, `src/components/ProjectManager.tsx`, `src/components/ScriptDecomposer.tsx`, `src/components/Timeline.tsx`
  - forbidden: all other source, config, and docs

## Historical M0 Lanes

- architecture-security: `docs/adr/**`
- build-release: root build/package config, `scripts/**`, `build-resources/**`
- desktop-shell: `electron/main/**`, `electron/preload/**`, `shared/contracts/**`
- recovery-acceptance: generated artifacts and command execution only

## Shared-File Rule

- Workers must not edit another lane to fix a type or lint failure.
- Cross-lane dependencies are returned as blockers.
- Workers must not edit ESLint, TypeScript, package, build, or orchestration configuration.
- PM opens a focused follow-up only after callback absorption.
