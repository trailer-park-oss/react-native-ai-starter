# Prompt 5: DX Pack - Tooling, Testing, and CI Profiles

You are a senior DevOps and DX engineer. Your task is to define the **DX feature pack** for the CLI starter.

## Context
Prompt 1 defined core generation and pack contracts. This prompt applies when `--dx` is selected.

## DX Profiles
- `basic`: lint, format, typecheck, essential scripts.
- `full`: everything in `basic` plus tests, CI workflow, husky/lint-staged, Maestro flows, expanded README sections.

## Hard Requirements

### Pack Enablement Rules
1. `basic` installs only required lint/format/typecheck tooling.
2. `full` installs additional testing and CI tooling.
3. Generated files/dependencies must match profile exactly.

### ESLint + Prettier
1. ESLint flat config in `eslint.config.mjs`.
2. Include: `@typescript-eslint`, `react`, `react-hooks`, `import`, `testing-library` (test scopes).
3. Prettier defaults: single quotes, no semicolons, trailing commas, print width 100 (or justified alternative).

### Hooks (`full` profile)
- `husky` pre-commit + `lint-staged`
- run ESLint + Prettier + `tsc --noEmit` on staged content where practical.

### Testing (`full` profile)
1. Jest + RNTL configured (`jest-expo`).
2. Baseline unit tests:
   - auth hook
   - payments hook
   - store transitions
   - token resolution
3. Integration tests:
   - navigation guard
   - auth flow
   - payments flow
4. E2E Maestro flows:
   - onboarding
   - sign-in
   - tab navigation
5. Test location convention:
   - allow explicit `__tests__/` layout listed in outputs
   - and/or colocated tests when appropriate.

### CI (`full` profile)
Create `.github/workflows/ci.yml` with:
- `lint-and-typecheck`
- `unit-tests` with coverage thresholds (statements 60, branches 50)
- `build-check`
- `e2e-tests` via `workflow_dispatch`

Run on push to `main` + PRs. Use dependency caching.

### Environment Management
1. `.env.example` with all required variables.
2. `src/lib/env.ts` validates required vars based on selected providers.
3. Ensure `.env` is ignored.

### Scripts
Provide scripts for `dev`, platform builds, lint/format/typecheck, tests, e2e, validate.

### README
Comprehensive README must include quick start, architecture, config, design system, auth, payments, testing, CI, env vars, extension guide.

## Output Format (Required)

### 1. DX Profile Matrix
- `basic` vs `full` files and dependency differences.

### 2. ESLint Config
- `eslint.config.mjs` full file.

### 3. Prettier Config
- `.prettierrc` full file.

### 4. Hooks/Lint-Staged (`full`)
- `.husky/pre-commit` + lint-staged config + setup notes.

### 5. Jest Setup (`full`)
- `jest.config.ts`, `jest.setup.ts`.

### 6. Unit Tests (`full`)
- required baseline files.

### 7. Integration Tests (`full`)
- required critical flow files.

### 8. Maestro Flows (`full`)
- required yaml files.

### 9. CI Workflow (`full`)
- `.github/workflows/ci.yml` full file.

### 10. Environment Setup
- `.env.example`, `src/lib/env.ts`, `.gitignore` updates.

### 11. package.json
- scripts + relevant dependency list.

### 12. README
- full content with all required sections.

### 13. Pack Invariants
- prove profile-gated generation and installs.

Be concrete. All config/tests must be realistic and runnable.
