# create-rn-ai-starter

CLI to scaffold Expo React Native projects with modular feature packs.

## Quick Start

```bash
npx create-rn-ai-starter my-app
```

This launches an interactive wizard that walks you through each option. To skip prompts and accept all defaults:

```bash
npx create-rn-ai-starter my-app --yes
```

## Usage

```
create-rn-ai-starter <project-path> [options]
```

The `<project-path>` argument can be a plain name, a relative path, an absolute path, or `.` to scaffold in the current (empty) directory. The project name is derived from the last segment of the path.

```bash
npx create-rn-ai-starter my-app                  # creates ./my-app
npx create-rn-ai-starter ./projects/my-app        # creates ./projects/my-app
npx create-rn-ai-starter /absolute/path/my-app    # creates /absolute/path/my-app
npx create-rn-ai-starter .                        # scaffolds in cwd (must be empty)
```

### Options

| Flag | Values | Default |
| --- | --- | --- |
| `--ui <provider>` | `tamagui` \| `gluestack` | `tamagui` |
| `--auth <provider>` | `clerk` \| `none` | `none` |
| `--payments <provider>` | `stripe` \| `none` | `none` |
| `--dx <profile>` | `basic` \| `full` | `basic` |
| `--preset <theme>` | `neutral-green` \| `fluent-blue` | `neutral-green` |
| `--yes` | — | Skip prompts, use defaults for unset flags |

### Examples

Scaffold with all defaults (no prompts):

```bash
npx create-rn-ai-starter my-app --yes
```

Pick specific providers:

```bash
npx create-rn-ai-starter my-app --ui gluestack --auth clerk --payments stripe
```

Mix flags with interactive prompts for the rest:

```bash
npx create-rn-ai-starter my-app --ui tamagui --dx full
```

Scaffold inside an existing projects folder:

```bash
npx create-rn-ai-starter ./work/my-app --yes
```

Scaffold in the current directory:

```bash
mkdir my-app && cd my-app
npx create-rn-ai-starter . --yes
```

## What Gets Generated

The CLI creates a new Expo project with:

- **Core** — Expo Router file-based routing, onboarding flow (3 screens), tab navigation (Home, Profile, Settings), Zustand stores, React Query setup, provider resolvers, and a `starter.config.ts` manifest.
- **UI** — Design system and theme tokens for the selected UI library.
- **Auth** — Auth provider wiring and `(auth)` route group (when not `none`).
- **Payments** — Payments provider wiring (when not `none`).
- **DX** — Developer experience profile (linting, formatting, TypeScript strictness).

After scaffolding, the CLI installs dependencies and runs validation checks to make sure everything is wired correctly.

## Generated Project Structure

```
my-app/
├── app/
│   ├── _layout.tsx              # Root layout with providers
│   ├── index.tsx                # Entry redirect (splash handling)
│   ├── (onboarding)/
│   │   ├── _layout.tsx          # Stack navigator
│   │   ├── welcome.tsx
│   │   ├── features.tsx
│   │   └── get-started.tsx
│   ├── (app)/
│   │   ├── _layout.tsx          # Tab navigator
│   │   ├── index.tsx            # Home
│   │   ├── profile.tsx
│   │   └── settings.tsx
│   └── (auth)/                  # (generated when auth ≠ none)
│       └── _layout.tsx
├── src/
│   ├── starter.config.ts        # Selected providers & modes
│   ├── store/
│   │   ├── index.ts             # Barrel export
│   │   ├── onboarding.ts        # Zustand — onboarding state
│   │   └── theme.ts             # Zustand — theme preset
│   ├── lib/
│   │   └── query-client.ts      # TanStack Query client
│   └── providers/
│       ├── ui/index.ts           # Resolver — tamagui or gluestack
│       ├── auth/index.ts         # Resolver — clerk or no-op stub
│       └── payments/index.ts     # Resolver — stripe or no-op stub
├── app.json
├── tsconfig.json                 # strict, noUncheckedIndexedAccess, @/* alias
└── package.json
```

## After Scaffolding

```bash
cd my-app
npx expo start
```

## Development

```bash
npm install
npm run build        # compile with tsup
npm run dev          # compile in watch mode
npm test             # run tests with vitest
npm run typecheck    # type-check without emitting
```

## Requirements

- Node.js >= 18
