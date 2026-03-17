# create-rn-ai-starter

CLI to scaffold Expo React Native projects with modular feature packs — including built-in AI chat powered by OpenRouter, ExecuTorch, or ML Kit.

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
| `--ai <provider>` | `online-openrouter` \| `on-device-executorch` \| `on-device-mlkit` (repeatable) | `online-openrouter` |
| `--preset <theme>` | `radix-blue` \| `radix-green` \| `radix-purple` \| `radix-orange` \| `radix-cyan` \| `radix-red` | `radix-blue` |
| `--yes` | — | Skip prompts, use defaults for unset flags |

> **Note:** Payments and DX profile options are not yet exposed as CLI flags. Payments defaults to `none` and DX defaults to `basic`. AI providers can be selected via `--ai` flag.

### Examples

Scaffold with all defaults (no prompts):

```bash
npx create-rn-ai-starter my-app --yes
```

Pick specific providers:

```bash
npx create-rn-ai-starter my-app --ui gluestack --auth clerk --preset radix-purple
```

Select multiple AI providers:

```bash
npx create-rn-ai-starter my-app --ai online-openrouter --ai on-device-executorch --ai on-device-mlkit
```

Mix flags with interactive prompts for the rest:

```bash
npx create-rn-ai-starter my-app --ui tamagui
```

Interactive prompt order is: `ui -> auth -> ai -> preset`.

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

- **Core** — Expo Router file-based routing, onboarding flow (3 screens), tab navigation (Home, AI, Settings), login button, Zustand stores, React Query setup, provider resolvers, and a `starter.config.ts` manifest.
- **UI** — Full design system with canonical tokens (colors, spacing, radius, typography), `ThemeProvider` with animated transitions, MMKV-persisted theme store, and library-specific components (Card, PrimaryButton, StatusBanner, ModelSelector). Screens import directly from the selected UI library via the kit pattern — `tamagui` or `@gluestack-ui/themed`.
- **AI** — AI chat screen with a shared provider interface (`ai.interface.ts`). Three back-end implementations:
  - **OpenRouter** (`online-openrouter`, default) — streaming chat client, `useChat` / `useAiChat` hooks, env config for API keys, and live model search from OpenRouter API.
  - **ExecuTorch** (`on-device-executorch`) — on-device LLM inference with model download/management, search, and delete functionality. No API key needed; works fully offline.
  - **ML Kit** (`on-device-mlkit`) — on-device object detection via `@infinitered/react-native-mlkit-object-detection`, vision hook, and camera/image-picker integration.
- **Auth** — Auth provider wiring, `(auth)` route group, and login button (when not `none`).
- **DX** — Developer experience profile (linting, formatting, TypeScript strictness).

After scaffolding, the CLI installs dependencies and runs validation checks to make sure everything is wired correctly.

### UI library selection

Screens use the selected library's components directly — no abstraction layer:

- `--ui tamagui` → screens import `YStack`, `Text` from `'tamagui'`
- `--ui gluestack` → screens import `VStack`, `Text` from `'@gluestack-ui/themed'`

This is powered by a **kit pattern** in the CLI templates: a plain object maps component names and import paths per library, so screen templates are written once with EJS variables and produce clean, idiomatic output for each library.

### AI providers

Every generated project includes an AI tab with a chat interface. The provider is selected at scaffold time (defaults to OpenRouter):

- **OpenRouter** — calls cloud LLMs via the OpenRouter API with streaming responses. Requires an `OPENROUTER_API_KEY` environment variable at runtime. Models are fetched live from OpenRouter API with full search functionality.
- **ExecuTorch** — runs LLMs on-device with ExecuTorch. No API key needed; works fully offline. Includes comprehensive model download/management with search, download, and delete capabilities.
- **ML Kit** — runs object detection on-device using React Native ML Kit. No API key needed; works fully offline.

Both providers implement a shared `AiChatProvider` interface so swapping later is straightforward.

> **ExecuTorch (on-device LLMs):** requires a dev build. It will not run in Expo Go.
> Use `npx expo run:ios` or `npx expo run:android`, then `npx expo start --dev-client`.

#### Model Selection & Management

**CLI Model Selection:**

The CLI provides an interactive search for selecting AI models during scaffolding:

**OpenRouter Models:**
- Fetched live from `https://openrouter.ai/api/v1/models`
- Includes pricing information
- Search by model name, ID, or description
- Fallback to curated list if API unavailable
- 15+ models from various providers (OpenAI, Anthropic, Meta, Google, Mistral, etc.)

**ExecuTorch Models:**
- Curated list of mobile-optimized models
- Includes Llama 3.2, Phi-3, Qwen 2, Gemma 2, Mistral 7B, and Nemotron Super
- Search by model name or description
- No network fetch required for faster scaffolding
- 13 popular models optimized for mobile deployment

**In-App Model Management:**

After scaffolding, you can manage AI models directly from the AI screen:

**OpenRouter:**
- Search and select from available models
- View pricing information
- Change active model at runtime

**ExecuTorch:**
- **Download Models**: Browse and download on-device models
- **Delete Models**: Remove downloaded models to free storage
- **Search**: Filter available models by name or description
- **Download Status**: Track download progress
- **Model Status**: View which models are already downloaded (green checkmark)
- **Current Model**: See active model with download status badge
- **Change Model**: Switch between downloaded or available models

All ExecuTorch models are stored locally and managed via:
- AsyncStorage tracking of downloaded models
- File system storage in `{documentDirectory}/execuTorch-models/`
- Automatic cleanup and validation of model files

### Theme presets

All Radix-based presets include light and dark mode palettes:

- `--preset radix-blue` — Blue accent palette
- `--preset radix-green` — Green accent palette
- `--preset radix-purple` — Purple accent palette
- `--preset radix-orange` — Orange accent palette
- `--preset radix-cyan` — Cyan accent palette
- `--preset radix-red` — Red accent palette

Theme selection persists across app restarts via Zustand persist middleware.

## Generated Project Structure

```
my-app/
├── app/
│   ├── _layout.tsx              # Root layout — SafeAreaProvider, QueryClient, ThemeProvider
│   ├── index.tsx                # Entry redirect (splash handling)
│   ├── (onboarding)/
│   │   ├── _layout.tsx          # Stack navigator
│   │   ├── welcome.tsx          # Uses YStack/VStack + design tokens
│   │   ├── features.tsx
│   │   └── get-started.tsx
│   ├── (app)/
│   │   ├── _layout.tsx          # Tab navigator (Home, AI, Settings)
│   │   ├── index.tsx            # Home screen with login button
│   │   ├── ai.tsx               # AI chat screen
│   │   └── settings.tsx
│   └── (auth)/                  # (generated when auth ≠ none)
│       └── _layout.tsx
├── src/
│   ├── starter.config.ts        # Selected providers & modes
│   ├── design-system/
│   │   ├── index.ts             # Barrel export (resolveTokens, useTokens, ThemeProvider, elevation)
│   │   ├── tokens.ts            # Canonical tokens — colors, spacing, radius, typography
│   │   ├── ThemeProvider.tsx     # Reads store, resolves tokens, animated theme transitions
│   │   └── elevation.ts         # Platform-aware card/modal/toast shadows
  │   ├── components/
  │   │   ├── Card.tsx             # Animated card with haptics — uses tamagui or gluestack directly
  │   │   ├── PrimaryButton.tsx    # Animated button with haptics
  │   │   ├── StatusBanner.tsx     # Success/warning/critical/info banners
  │   │   └── ModelSelector.tsx    # AI model selection and management with search/download/delete
│   ├── store/
│   │   ├── index.ts             # Barrel export
│   │   ├── onboarding.ts        # Zustand — onboarding state
│   │   └── theme.ts             # Zustand + MMKV persist — preset & colorMode
  │   ├── lib/
  │   │   ├── query-client.ts      # TanStack Query client
  │   │   ├── mmkv-storage.ts      # MMKV instance + Zustand StateStorage adapter
  │   │   └── model-fetcher.ts    # OpenRouter & ExecuTorch model fetching utilities
│   └── providers/
│       ├── ui/
│       │   ├── index.ts          # Resolver — tamagui or gluestack
│       │   └── tamagui/          # (or gluestack/) — library-specific config & provider
  │       ├── ai/
  │       │   ├── ai.interface.ts   # Shared AI provider interface
  │       │   ├── index.ts          # Barrel export
  │       │   └── openrouter/       # (or mlkit/executorch/) — provider-specific implementation
  │       │       ├── client.ts     # Streaming OpenRouter API client
  │       │       ├── useChat.ts    # Chat hook with message history
  │       │       ├── useAiChat.ts  # High-level chat hook
  │       │       ├── env.ts        # API key configuration
  │       │       ├── model-download.ts # ExecuTorch model download/delete management
  │       │       └── index.ts
│       ├── auth/index.ts         # Resolver — clerk or no-op stub
│       └── payments/index.ts     # Resolver — stripe or no-op stub
├── tamagui.config.ts             # (only when --ui tamagui)
├── app.json
├── tsconfig.json                 # strict, noUncheckedIndexedAccess, @/* alias
└── package.json
```

## After Scaffolding

```bash
cd my-app
npx expo start
```

For OpenRouter AI, set your API key before running:

```bash
OPENROUTER_API_KEY=sk-or-... npx expo start
```

## iOS Build with ExecuTorch

Projects using the ExecuTorch AI provider include an automatic config plugin that fixes the iOS deployment target to 17.0 during `npx expo prebuild` or `npx expo run:ios`. No manual intervention is required.

The plugin (`plugins/withIosDeploymentTarget.js`) is automatically added to your `app.json` when you scaffold with `--ai on-device-executorch` and runs during native code generation, ensuring compatibility with `react-native-executorch` dependencies.

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
