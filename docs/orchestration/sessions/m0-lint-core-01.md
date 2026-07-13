# M0-F1 Core Data Lint Session

[短工]#核心数据Lint@M0
⟦tag:v2|session|m0-lint-core-01⟧

- task tag: ⟦tag:v2|task|m0-legacy-lint-baseline⟧
- role tag: ⟦tag:v2|role|short-worker-lint-core-data⟧
- thread id: `/root/m0_lint_core`
- worker state: archived
- current gate: none; M0-F1 verified
- allowed scope: `server.ts`, `src/App.tsx`, `src/types.ts`
- baseline: 39 lint errors
- expected callback: formal
- callback: absorbed by PM at 2026-07-13T08:40:17Z

## Acceptance

- Targeted ESLint passes with no rule suppression.
- Typecheck and format pass.
- Runtime behavior and exported project shapes remain unchanged.

## Outcome

- 39/39 lint errors cleared with no configuration or rule suppression.
- Targeted ESLint, typecheck, Prettier, and diff checks passed.
- PM semantic review found one non-string exception-message regression in `server.ts`; PM corrected it and reran the full lint and typecheck gates.
- lifecycle: `completed -> callback_sent -> archived`
