# M0 Legacy Lint Baseline

⟦tag:v2|task|m0-legacy-lint-baseline⟧

- objective: reduce the existing 124 lint errors to zero without changing runtime behavior or weakening rules
- state: verified
- outcome: verified
- baseline: 69 `no-explicit-any`, 53 `no-unused-vars`, 1 `prefer-const`, 1 `no-useless-escape`
- parent gate: M0 desktop baseline

## Lanes

### M0-F1 Core Data

- files: `server.ts`, `src/App.tsx`, `src/types.ts`
- baseline: 39 errors

### M0-F2 Assets Flow

- files: `AssetManager.tsx`, `Flowchart.tsx`, `Inspector.tsx`
- baseline: 38 errors

### M0-F3 Media UI

- files: `NativeEngineCenter.tsx`, `Player.tsx`, `ProjectManager.tsx`, `ScriptDecomposer.tsx`, `Timeline.tsx`
- baseline: 47 errors

## Hard Rules

- Do not change ESLint configuration or package scripts.
- Do not add disable comments or replace `any` with unsafe casts that only hide the error.
- Prefer existing domain types, `unknown` plus narrowing, or small local interfaces.
- Remove unused imports and dead locals only when behavior is unchanged.
- Do not cross file locks; report a blocker instead.

## Acceptance

- M0-F1, M0-F2, and M0-F3 targeted ESLint, typecheck, and format checks passed.
- Full `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` passed.
- PM reviewed all behavioral diffs; one exception-message regression was corrected before submission.
- Full `npm run format:check` and `git diff --check` passed after concurrent `docs/releases/**` writes stabilized.

## Verification Evidence

- lint: 124 errors reduced to 0 with no rule suppression or configuration weakening
- typecheck: passed
- tests: 3/3 passed
- build: passed
- full format: passed
- source smoke: not run; an existing packaged instance holds the single-instance lock and port 5173 belongs to another workspace
- lane lifecycle: three formal callbacks absorbed; all lint workers archived

## Next Action

- Commit only the intended lint and orchestration changes.
- Keep M1 closed until this submission is committed and the commit is verified.
- Preserve the concurrently created, untracked `docs/releases/**` directory outside this submission.
