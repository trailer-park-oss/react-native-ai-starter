# Prompt 5: Developer Experience, Testing & CI

You are a senior DevOps and DX engineer. Your task is to set up the complete developer experience toolchain, testing strategy, and CI pipeline for an Expo-based React Native starter kit.

## Context
This is the final prompt (5 of 5). The project is now fully architected:

**Already complete:**
- Expo Router with route groups, Zustand + TanStack Query (Prompt 1)
- Design token system with two presets, ThemeProvider, Tamagui + Gluestack configs (Prompt 2)
- Swappable auth with Clerk implementation, auth screens, navigation guards (Prompt 3)
- Swappable payments with Stripe + Lemon Squeezy, payment screens (Prompt 4)

Your job: wire up linting, formatting, testing, CI, environment management, and developer documentation so this is genuinely ready to clone and ship.

## Hard Requirements

### ESLint + Prettier
1. Use ESLint flat config (`eslint.config.mjs`).
2. Include these rule sets:
   - `@typescript-eslint` — strict TypeScript rules
   - `eslint-plugin-react` + `eslint-plugin-react-hooks`
   - `eslint-plugin-import` — enforce import ordering, no circular deps
   - `eslint-plugin-testing-library` — for test files only
3. Prettier config (`.prettierrc`):
   - Single quotes, no semicolons, trailing commas, 100 print width.
   - Or justify different choices — just be deliberate.
4. Add lint-staged + husky for pre-commit hooks:
   - Run ESLint + Prettier on staged files
   - Run TypeScript type-check (`tsc --noEmit`)

### Testing Strategy

**Unit Tests (Jest + React Native Testing Library):**
1. Configure Jest for Expo (`jest-expo` preset).
2. Write baseline tests for:
   - Auth hook (`useAuth`) — test sign-in, sign-out, error handling with a mock provider
   - Payments hook (`usePayments`) — test payment flow, subscription status with a mock provider
   - Zustand stores — test state transitions (onboarding complete, theme switching)
   - Design token resolution — test that preset + mode returns correct token values
3. Place tests next to source files (`*.test.ts` / `*.test.tsx`).
4. Aim for these to serve as examples showing HOW to test provider-abstracted code.

**Integration Tests:**
1. Write integration tests for critical flows:
   - Navigation guard: mock auth state -> assert correct redirect (onboarding / auth / app)
   - Auth flow: render sign-in screen -> fill form -> submit -> assert success/error states
   - Payment flow: render paywall -> select plan -> trigger payment -> assert result
2. Use React Native Testing Library for component rendering.

**E2E Tests (Maestro):**
1. Provide Maestro flow files for:
   - Onboarding completion
   - Sign in (happy path)
   - Navigate through tab screens
2. Include a `maestro/` directory with `.yaml` flow files.
3. Document how to run Maestro locally and in CI.

### CI Pipeline (GitHub Actions)

Create `.github/workflows/ci.yml` with these jobs:

1. **lint-and-typecheck**
   - Run ESLint
   - Run `tsc --noEmit`
   - Run Prettier check (`--check` mode)

2. **unit-tests**
   - Run Jest with coverage
   - Fail if coverage drops below thresholds:
     - Statements: 60% (starter baseline — meant to be raised)
     - Branches: 50%

3. **build-check**
   - Run `expo export` (or `expo prebuild --clean` dry run) to verify the app compiles
   - Catch import errors, missing assets, config issues

4. **e2e-tests** (optional/manual trigger)
   - Run Maestro flows against a built app
   - Mark as `workflow_dispatch` so it's not blocking on every PR

Pipeline requirements:
- Use caching for `node_modules` (keyed on lockfile hash).
- Run on `push` to `main` and on pull requests.
- Jobs 1-3 run in parallel. Job 4 is manual.

### Environment Variable Management
1. Create `.env.example` with every required variable and comments:
```
# Auth - Clerk
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx

# Payments - Stripe
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Payments - Lemon Squeezy (if using lemonsqueezy provider)
EXPO_PUBLIC_LEMONSQUEEZY_STORE_ID=
EXPO_PUBLIC_LEMONSQUEEZY_API_KEY=

# API
EXPO_PUBLIC_API_URL=http://localhost:3000
```
2. Create `src/lib/env.ts` that:
   - Reads env vars via `process.env`
   - Validates required vars based on active provider in `starter.config.ts`
   - Throws descriptive errors if required vars are missing
   - Exports typed, validated env object
3. Document: never commit `.env`. Add to `.gitignore`.

### Package.json Scripts
Define these scripts:
```json
{
  "dev": "expo start",
  "build:ios": "eas build --platform ios",
  "build:android": "eas build --platform android",
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "typecheck": "tsc --noEmit",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "e2e": "maestro test maestro/",
  "validate": "npm run lint && npm run typecheck && npm run test"
}
```

### README
Write a comprehensive `README.md` that includes:

1. **What this is** — one paragraph.
2. **Quick start** — clone, install, configure env, run. Under 5 steps.
3. **Architecture overview** — folder structure diagram with descriptions (reuse from Prompt 1 output).
4. **Configuration** — how `starter.config.ts` works, what options are available.
5. **Design system** — how presets work, how to customize tokens, how to switch themes.
6. **Auth** — which provider is active, how to switch, how to add a new one.
7. **Payments** — which provider is active, how to switch, backend requirements.
8. **Testing** — how to run unit, integration, e2e tests.
9. **CI** — what the pipeline checks.
10. **Environment variables** — table of all vars, which are required for which provider.
11. **Extending the starter** — brief guide on adding a new feature module.

## Output Format (Required)

### 1. ESLint Config
- `eslint.config.mjs` — full file.

### 2. Prettier Config
- `.prettierrc` — full file.

### 3. Husky + lint-staged Setup
- `.husky/pre-commit` — hook file.
- `lint-staged` config (in `package.json` or `.lintstagedrc`).
- Setup commands to document in README.

### 4. Jest Config
- `jest.config.ts` — full file with Expo preset and path alias support.
- `jest.setup.ts` — mock setup for React Native modules, Expo modules.

### 5. Unit Test Files (4 baseline tests)
- `src/providers/auth/__tests__/useAuth.test.ts`
- `src/providers/payments/__tests__/usePayments.test.ts`
- `src/store/__tests__/app-store.test.ts`
- `src/design-system/__tests__/tokens.test.ts`

### 6. Integration Test Files (3 critical flows)
- `src/__tests__/navigation-guard.test.tsx`
- `src/__tests__/auth-flow.test.tsx`
- `src/__tests__/payment-flow.test.tsx`

### 7. Maestro E2E Flows
- `maestro/onboarding.yaml`
- `maestro/sign-in.yaml`
- `maestro/tab-navigation.yaml`

### 8. CI Pipeline
- `.github/workflows/ci.yml` — full file.

### 9. Environment Setup
- `.env.example` — full file.
- `src/lib/env.ts` — full validation module.
- `.gitignore` additions.

### 10. package.json
- Full `scripts` section and relevant `devDependencies` list (package names + versions).

### 11. README.md
- Full content covering all 11 sections listed above.

Be concrete. Every config file must be complete and valid. Test files must have realistic, runnable test cases. No placeholder "TODO" tests.
