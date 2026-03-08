# DX Pack

## Profiles
- `basic`
- `full`

## `basic`
- ESLint + Prettier + TypeScript typecheck
- Core scripts for lint/format/typecheck/dev/build

## `full`
- Everything in `basic`, plus:
- Jest + testing-library baseline tests
- Integration tests
- Maestro e2e flows
- Husky + lint-staged
- GitHub Actions CI workflow

## Test Layout Convention
- Prefer explicit `__tests__/` locations as defined in prompt outputs.
- Colocated tests are allowed where appropriate.

## CI Expectations (`full`)
- Lint/typecheck
- Unit tests with baseline coverage thresholds
- Build check
- Optional manual e2e job

## Acceptance Checklist
- [ ] Full-only tooling absent in `basic` profile.
- [ ] CI and tests generated only in `full` profile.
- [ ] Scripts match installed tooling.
