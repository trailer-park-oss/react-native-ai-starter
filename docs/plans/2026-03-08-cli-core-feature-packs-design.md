# CLI Core + Feature Packs Design

## Goal
Create a new-project-only CLI that scaffolds Expo React Native apps and installs/generates only selected libraries and feature code.

## Scope
- New project generation only (no in-place modification of existing apps)
- Core + feature-pack architecture
- Prompt set updated to align with selective dependency/file generation
- Extensive supporting documentation for architecture and pack authoring

## Constraints
- Root `app/` is explicitly allowed for Expo Router; remaining app source under `src/`
- No conditional re-export patterns that are invalid/infeasible in TS/ESM
- `starter.config.ts` must be valid TypeScript with concrete runtime values
- Disabled packs must not install dependencies or generate pack-owned files

## Recommended Architecture

### CLI entry and flow
1. `create-rn-ai-starter <project-name>` command creates a new project directory.
2. Resolve options (`--ui`, `--auth`, `--payments`, `--dx`, `--preset`, `--yes`).
3. Scaffold core template.
4. Apply selected packs in deterministic order: `ui -> auth -> payments -> dx`.
5. Validate generation invariants and print post-create instructions.

### Pack contract
Each pack defines:
- `dependencies` and `devDependencies`
- file templates and integration hooks
- optional post-apply validation checks
- declared ownership boundaries to prevent cross-pack leakage

### Provider selection strategy
- Use resolver/factory modules keyed by generated config values
- Avoid impossible “conditional export” requirements
- Keep provider-specific logic isolated in provider directories

## Feature pack boundaries

### Core pack
- Expo Router skeleton and layouts
- strict TS config and aliases
- base store/query setup
- typed `starter.config.ts`

### UI pack
- canonical tokens in `src/design-system/`
- adapter configs under `src/providers/ui/{tamagui|gluestack}/`
- runtime preset selection from store

### Auth pack
- `none` (guest/stub) or `clerk`
- generic auth interface includes verification/resend methods required by auth screens
- routing behavior depends on selected auth mode

### Payments pack
- `none` or `stripe`
- clarify Stripe SDK client concerns vs backend API concerns
- generate payments features only when enabled

### DX pack
- `basic`: lint/format/typecheck baseline
- `full`: tests, CI, husky/lint-staged, Maestro

## Prompt rewrite strategy
- Prompt 1 becomes CLI core + generator architecture
- Prompt 2/3/4/5 become pack-focused specs with explicit `none`/disabled behavior where relevant
- Standardize ambiguous/contradictory requirements:
  - valid TS snippets only
  - `primaryPressed` naming only
  - explicit test location conventions

## Documentation plan
Create and/or update:
- `docs/cli-starter-architecture.md`
- `docs/packs/ui.md`
- `docs/packs/auth.md`
- `docs/packs/payments.md`
- `docs/packs/dx.md`
- `docs/authoring-feature-packs.md`
- `docs/prompt-authoring-guidelines.md`

Include acceptance checklist:
- unselected dependencies are not installed
- disabled pack files are not generated
- generated app boots with selected packs only

## Acceptance criteria
- Prompts no longer contain path/mechanism contradictions
- Prompt outputs are implementable as valid TS/TSX
- CLI model is explicit and consistent across all prompts
- Documentation is extensive, navigable, and aligned with generator behavior
