# Prompt 5: DX Pack — Tooling, Testing & CI Profiles

You are a senior DevOps and DX engineer. Your task is to **implement** the DX feature pack for the CLI starter, producing real templates and pack code that integrate with the existing generator.

## Context

Prompts 1-4 are implemented. The generated project has:
- **Core:** Expo Router, Zustand, TanStack Query, `starter.config.ts`
- **UI pack:** Design system tokens, ThemeProvider, react-native-reanimated, MMKV, expo-haptics, elevation styles, Tamagui or Gluestack adapter
- **Auth pack (optional):** React Hook Form + Zod, Clerk adapter, auth screens, AuthGate, Zod schemas
- **Payments pack (optional):** Stripe SDK, TanStack Query hooks, Zod-validated API client, reusable components, example screens

The DX pack (`src/packs/dx/index.ts`) is currently a stub. Your job is to fill it in.

### Codebase references you must honour

| Artifact | Location | Purpose |
|---|---|---|
| Pack interface | `src/packs/pack.interface.ts` | `FeaturePack` with `dependencies`, `devDependencies`, `expoInstallPackages`, `ownedPaths`, `generate()`, `postApplyValidation()` |
| Template engine | `src/utils/template.ts` | EJS `renderTemplates(templateDir, projectDir, data)` |
| Template data | `src/utils/template.ts → TemplateData` | `isFullDx`, `dx`, `hasAuth`, `hasPayments`, `ui`, `preset` |
| Pack registry | `src/pack-registry.ts` | DX pack always runs (both `basic` and `full`) |
| Package.json builder | `src/utils/package-json.ts` | `mergePackDependencies` merges all pack deps; `buildBasePackageJson` has base scripts |
| Config types | `src/types.ts` | `DxProfile = 'basic' \| 'full'` |

### What the DX pack must do

1. Always run (both profiles generate output).
2. Conditionally populate `dependencies`, `devDependencies`, and `expoInstallPackages` based on `ctx.config.dx`.
3. Place EJS templates under `templates/dx/` (shared) and `templates/dx-full/` (full-profile only).
4. Merge additional scripts into `package.json` (via the pack's own mechanism or by generating a scripts partial).
5. Run `postApplyValidation` that checks critical files exist.

## DX Profiles

- **`basic`**: Lint, format, typecheck, essential scripts, env management, .gitignore, README.
- **`full`**: Everything in `basic` plus unit/integration tests, E2E Maestro flows, CI workflow, husky + lint-staged, expanded README.

## Hard Requirements

### Library Stack

#### Both profiles (`basic` + `full`)

| Library | Purpose | Install via |
|---|---|---|
| `eslint` (v9+) | Linting — flat config format | `devDependencies` |
| `@typescript-eslint/eslint-plugin` | TypeScript-aware lint rules | `devDependencies` |
| `@typescript-eslint/parser` | TypeScript parser for ESLint | `devDependencies` |
| `eslint-plugin-react` | React-specific rules | `devDependencies` |
| `eslint-plugin-react-hooks` | Hooks rules (exhaustive-deps) | `devDependencies` |
| `eslint-plugin-import` | Import ordering + resolution | `devDependencies` |
| `prettier` | Code formatting | `devDependencies` |
| `eslint-config-prettier` | Disables ESLint rules that conflict with Prettier | `devDependencies` |

#### Full profile only (`full`)

| Library | Purpose | Install via |
|---|---|---|
| `jest` | Test runner | `devDependencies` |
| `jest-expo` | Expo-specific Jest preset | `devDependencies` |
| `@testing-library/react-native` | Component testing utilities | `devDependencies` |
| `@testing-library/jest-native` | Custom matchers (toBeVisible, etc.) | `devDependencies` |
| `@types/jest` | Jest type definitions | `devDependencies` |
| `husky` | Git hooks management | `devDependencies` |
| `lint-staged` | Run linters on staged files only | `devDependencies` |

### ESLint Flat Config (`eslint.config.mjs`)

Must use ESLint v9+ flat config format (not legacy `.eslintrc`):

```js
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import importPlugin from 'eslint-plugin-import'
import prettier from 'eslint-config-prettier'

export default [
  { ignores: ['node_modules/', 'dist/', '.expo/', 'android/', 'ios/', 'coverage/'] },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: { project: './tsconfig.json', ecmaFeatures: { jsx: true } },
    },
    plugins: { '@typescript-eslint': tseslint, react, 'react-hooks': reactHooks, import: importPlugin },
    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      // React
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Imports
      'import/order': ['error', {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'never',
        alphabetize: { order: 'asc' },
      }],
      'import/no-duplicates': 'error',
    },
    settings: { react: { version: 'detect' } },
  },
  prettier,
]
```

For `full` profile, add a test-scoped override:

```js
{
  files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
  plugins: { 'testing-library': testingLibrary },
  rules: {
    'testing-library/no-unnecessary-act': 'error',
    'testing-library/prefer-screen-queries': 'warn',
  },
}
```

### Prettier Config (`.prettierrc`)

```json
{
  "singleQuote": true,
  "semi": false,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

### Hooks & Lint-Staged (`full` profile only)

`.husky/pre-commit`:
```sh
#!/bin/sh
npx lint-staged
```

`lint-staged` config in `package.json`:
```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml}": ["prettier --write"]
  }
}
```

Setup: The DX pack must add a `prepare` script (`"prepare": "husky"`) to `package.json` so husky installs on `npm install`.

### Testing (`full` profile only)

#### Jest Config (`jest.config.ts`)

```ts
import type { Config } from 'jest'

const config: Config = {
  preset: 'jest-expo',
  setupFilesAfterSetup: ['./jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@stripe/stripe-react-native|@clerk/clerk-expo))',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageThresholds: {
    global: { statements: 60, branches: 50, functions: 55, lines: 60 },
  },
}

export default config
```

#### Jest Setup (`jest.setup.ts`)

```ts
import '@testing-library/jest-native/extend-expect'

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'))

// Mock expo modules
jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: { Light: 0 } }))
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }))
jest.mock('react-native-mmkv', () => ({ MMKV: jest.fn(() => ({ getString: jest.fn(), set: jest.fn(), delete: jest.fn() })) }))
```

#### Required Unit Tests (`full` profile)

Generate these test files conditionally based on which packs are enabled. Use EJS `<% if (hasAuth) { %>` guards.

| Test file | Tests | Condition |
|---|---|---|
| `src/store/__tests__/theme.test.ts` | Store transitions: set preset, toggle color mode, persist/rehydrate | Always |
| `src/store/__tests__/onboarding.test.ts` | Complete step, reset, finish onboarding | Always |
| `src/design-system/__tests__/tokens.test.ts` | Token resolution for all preset × mode combos | Always |
| `src/providers/auth/__tests__/useAuth.test.ts` | Sign in/up/out flows, error mapping | `hasAuth` |
| `src/providers/payments/__tests__/usePayments.test.ts` | Products fetch, subscription mutation, error mapping | `hasPayments` |
| `src/providers/payments/hooks/__tests__/useProducts.test.ts` | TanStack Query hook with mock API | `hasPayments` |

#### Required Integration Tests (`full` profile)

| Test file | Tests | Condition |
|---|---|---|
| `__tests__/integration/navigation-guard.test.tsx` | Onboarding gate, auth gate (if enabled), tab navigation | Always |
| `__tests__/integration/auth-flow.test.tsx` | Sign-in form validation (RHF + Zod), submit, error display | `hasAuth` |
| `__tests__/integration/payments-flow.test.tsx` | Product listing, subscription creation, cancellation | `hasPayments` |

#### E2E Maestro Flows (`full` profile)

| Flow file | Tests | Condition |
|---|---|---|
| `e2e/onboarding.yaml` | Swipe through onboarding → arrive at app shell | Always |
| `e2e/sign-in.yaml` | Enter credentials → sign in → see home | `hasAuth` |
| `e2e/tab-navigation.yaml` | Tap each tab → verify screen content | Always |
| `e2e/paywall.yaml` | Navigate to paywall → see plans | `hasPayments` |

### CI Workflow (`full` profile only)

`.github/workflows/ci.yml` with 4 jobs:

1. **`lint-and-typecheck`**: ESLint + `tsc --noEmit`. Runs on push to `main` + PRs.
2. **`unit-tests`**: Jest with coverage thresholds (statements 60%, branches 50%). Fails if thresholds not met.
3. **`build-check`**: `npx expo export --platform web` (validates bundling). Catches broken imports.
4. **`e2e-tests`**: Maestro flows via `workflow_dispatch` only (requires device/emulator).

All jobs use `actions/setup-node@v4`, dependency caching via `actions/cache@v4` on `node_modules`.

### Environment Management

#### `.env.example`

Generate with all required vars based on enabled packs:

```env
# Core (always)
EXPO_PUBLIC_APP_NAME=MyApp

# Auth (when auth pack enabled)
<% if (hasAuth) { %>
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
<% } %>

# Payments (when payments pack enabled)
<% if (hasPayments) { %>
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
EXPO_PUBLIC_API_URL=http://localhost:3000
<% } %>
```

#### `src/lib/env.ts`

Runtime validation that checks required env vars based on `starter.config.ts`:

```ts
import { starterConfig } from '@/starter.config'

interface EnvVars {
  EXPO_PUBLIC_APP_NAME: string
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?: string
  EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string
  EXPO_PUBLIC_API_URL?: string
}

export function validateEnv(): EnvVars {
  const env: EnvVars = {
    EXPO_PUBLIC_APP_NAME: requireEnv('EXPO_PUBLIC_APP_NAME'),
  }

  if (starterConfig.auth === 'clerk') {
    env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = requireEnv('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY')
  }

  if (starterConfig.payments === 'stripe') {
    env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY = requireEnv('EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY')
    env.EXPO_PUBLIC_API_URL = requireEnv('EXPO_PUBLIC_API_URL')
  }

  return env
}
```

#### `.gitignore`

Comprehensive ignore list for Expo + RN project:
```
node_modules/
.expo/
dist/
android/
ios/
.env
.env.local
coverage/
*.tsbuildinfo
```

### Scripts

Merge these into `package.json` scripts (in addition to core's `dev`, `dev:ios`, `dev:android`, `dev:web`):

#### Both profiles:
```json
{
  "lint": "eslint . --ext .ts,.tsx",
  "lint:fix": "eslint . --ext .ts,.tsx --fix",
  "format": "prettier --write 'src/**/*.{ts,tsx}' 'app/**/*.{ts,tsx}'",
  "format:check": "prettier --check 'src/**/*.{ts,tsx}' 'app/**/*.{ts,tsx}'",
  "typecheck": "tsc --noEmit",
  "validate": "npm run lint && npm run typecheck"
}
```

#### Full profile adds:
```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "e2e": "maestro test e2e/",
  "e2e:onboarding": "maestro test e2e/onboarding.yaml",
  "prepare": "husky"
}
```

### README

Generate a comprehensive `README.md` via EJS template. Sections:

1. **Quick Start** — clone, env setup, `npx expo start`
2. **Architecture** — folder structure diagram, pack system explanation
3. **Configuration** — `starter.config.ts` reference
4. **Design System** — token categories, preset switching, ThemeProvider
5. **Auth** (if `hasAuth`) — Clerk setup, env keys, auth flow diagram
6. **Payments** (if `hasPayments`) — Stripe setup, backend contract, TanStack Query hooks
7. **State Management** — Zustand stores (client), TanStack Query (server), MMKV persistence
8. **Form Handling** (if `hasAuth` or `hasPayments`) — React Hook Form + Zod pattern, Controller usage
9. **Testing** (if `isFullDx`) — Jest setup, running tests, coverage thresholds, Maestro E2E
10. **CI** (if `isFullDx`) — GitHub Actions workflow, jobs, secrets setup
11. **Environment Variables** — all required vars by pack
12. **Extending** — adding new providers, new screens, new stores

## Implementation Shape (Required)

### 1. DX Pack Source (`src/packs/dx/index.ts`)

Replace the stub. Must:
- Conditionally set `devDependencies` based on `ctx.config.dx` profile
- Call `renderTemplates('dx', ...)` for shared files
- Conditionally call `renderTemplates('dx-full', ...)` for full-profile files
- Add scripts to package.json (generate a scripts merge file or use pack's mechanism)
- Validate generated files in `postApplyValidation()`

### 2. Shared DX Templates (`templates/dx/`)

Generated for both `basic` and `full` profiles:
- `eslint.config.mjs.ejs` — flat config (test override included only when `isFullDx`)
- `.prettierrc`
- `.gitignore`
- `.env.example.ejs` — conditional vars based on enabled packs
- `src/lib/env.ts.ejs` — runtime validation conditional on config
- `README.md.ejs` — comprehensive, conditional sections

### 3. Full-Profile Templates (`templates/dx-full/`)

Generated only when `dx === 'full'`:
- `jest.config.ts`
- `jest.setup.ts`
- `.husky/pre-commit`
- `.github/workflows/ci.yml.ejs` — conditional jobs based on enabled packs
- All unit test files (conditionally generated per pack)
- All integration test files (conditionally generated per pack)
- All Maestro E2E flows (conditionally generated per pack)

### 4. DX Profile Matrix

| Aspect | `basic` | `full` |
|---|---|---|
| ESLint flat config | Yes | Yes (+ testing-library rules) |
| Prettier | Yes | Yes |
| .gitignore | Yes | Yes |
| .env.example | Yes | Yes |
| env.ts validation | Yes | Yes |
| README | Yes (core sections) | Yes (all sections) |
| Scripts: lint/format/typecheck | Yes | Yes |
| Jest + RNTL | No | Yes |
| Husky + lint-staged | No | Yes |
| Unit tests | No | Yes (conditional on packs) |
| Integration tests | No | Yes (conditional on packs) |
| Maestro E2E | No | Yes (conditional on packs) |
| CI workflow | No | Yes |
| `prepare` script | No | Yes |
| `test` scripts | No | Yes |
| devDependencies count | ~8 packages | ~15 packages |

### 5. Pack Invariants

Prove:
- `basic` profile: no jest, no husky, no .github/, no test files, no e2e/ directory, no test-related devDependencies
- `full` profile: all testing + CI files generated, test devDependencies installed, husky prepare script added
- Test files are conditional on enabled packs: `hasAuth` → auth tests, `hasPayments` → payments tests
- `.env.example` lists only vars for enabled packs
- `env.ts` validates only vars for enabled packs
- CI workflow only has auth/payments test jobs when those packs are enabled
- README sections are conditional on enabled packs and DX profile

### 6. Mock Strategy Table

Document what each test mock covers and why:

| Mock Target | Mock Location | Reason |
|---|---|---|
| `react-native-reanimated` | `jest.setup.ts` | Uses native animation driver, not available in JSDOM |
| `expo-haptics` | `jest.setup.ts` | Native module |
| `expo-secure-store` | `jest.setup.ts` | Native keychain access |
| `react-native-mmkv` | `jest.setup.ts` | Native C++ module |
| `expo-router` | Per-test or setup | Navigation mocks for integration tests |
| `@clerk/clerk-expo` | Per-test | Auth state mocking for unit/integration tests |
| `@stripe/stripe-react-native` | Per-test | Payment sheet mocking |
| `fetch` | Per-test | API call mocking for TanStack Query hooks |

Be concrete. Every generated file must be valid TypeScript/TSX, valid YAML, or valid config. All test files must be realistic and runnable against the generated project.
