# File Locks

Only the listed owner may write each surface during the current gate.

## Current State

- No product implementation lock is active; P0-1 and P0-2 were released after technical review.
- PM may update only `docs/orchestration/**` for taskboard and callback absorption.

## Archived P0-2 Project Storage Lane

- task: `docs/orchestration/tasks/p0-2-project-storage.md`
- session: `docs/orchestration/sessions/p0-2-project-storage-01.md`
- owner: `[短工]#P0项目存储@P0`
- thread id: `019fda43-ee20-7a33-b528-ff136317775a`
- state: archived; lock released at `2026-08-07T04:15:00Z`; opened at `2026-08-07T03:31:56Z`
- allowed: `src/project/project-repository.ts`, `src/project/project-repository.test.ts`, `src/project/project-fixtures/**`
- forbidden: `shared/contracts/project.ts`, existing `src/**` outside the listed files, UI, Electron/preload/IPC, package/lock, TypeScript/ESLint/Prettier/Vite config, docs, Git and release/publish actions

## ICE-01 Retained Owner

- owner: `[长工]#project-kernel@E2`
- thread id: `019fda43-ef63-7e40-abee-4493c8d31da5`
- state: blocked retained-owner; no active product lock
- guard: ICE-01 implementation waits for agent gateway recovery and a separate explicit PM dispatch

## Archived P0-1 Schema Lane

- p0-1-schema
  - allowed: `shared/contracts/project.ts`, `shared/contracts/project.test.ts`, `shared/contracts/project-fixtures/**`
  - state: archived; technically verified
  - forbidden: all existing source, `src/types.ts`, UI, Electron/preload, `shared/contracts/app-info.*`, package/lock/config/build files, `docs/**`, Git, credentials and release/publish actions

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
