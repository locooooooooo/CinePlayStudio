# M0 File Locks

Only the listed owner may write each surface during the current gate.

| Lane                  | Allowed write scope                                                                                                                                                                                                                | Forbidden scope                                                           |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| architecture-security | `docs/adr/**`                                                                                                                                                                                                                      | product code, root build files, `docs/orchestration/**`                   |
| build-release         | `package.json`, `package-lock.json`, `.node-version`, `.gitignore`, `electron.vite.config.ts`, `electron-builder.yml`, `eslint.config.*`, `.prettierignore`, `.prettierrc*`, `vitest.config.*`, `scripts/**`, `build-resources/**` | `electron/**`, `shared/**`, `src/**`, `docs/orchestration/**`             |
| desktop-shell         | `electron/main/**`, `electron/preload/**`, `shared/contracts/**`                                                                                                                                                                   | package/lock files, root build configs, `src/**`, `docs/orchestration/**` |
| recovery-acceptance   | generated `node_modules/**`, `dist/**`, `out/**`, `release/**`, staged `build-resources/bin/**`; command execution allowed                                                                                                         | all source, package/lock/config, ADR, and `docs/orchestration/**` files   |
| PM                    | `docs/orchestration/**`                                                                                                                                                                                                            | product code and worker-owned files                                       |

## Shared-File Rule

- Workers must not edit another lane to fix a build failure.
- Cross-lane dependency is reported as a blocker or callback note.
- PM may request a focused follow-up only after callback absorption.
