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
create-rn-ai-starter <project-name> [options]
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

## What Gets Generated

The CLI creates a new Expo project with:

- **Core** — Expo Router file-based routing, onboarding flow, tab navigation, Zustand stores, React Query setup, and a `starter.config.ts` manifest.
- **UI** — Design system and theme tokens for the selected UI library.
- **Auth** — Auth provider wiring (when not `none`).
- **Payments** — Payments provider wiring (when not `none`).
- **DX** — Developer experience profile (linting, formatting, TypeScript strictness).

After scaffolding, the CLI installs dependencies and runs validation checks to make sure everything is wired correctly.

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
