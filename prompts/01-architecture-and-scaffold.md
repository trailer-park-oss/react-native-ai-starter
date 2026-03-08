# Prompt 1: CLI Core Architecture & Generator Scaffold

You are a senior React Native architect and CLI tooling engineer. Your task is to design the core architecture for a **new-project-only** Expo React Native starter CLI.

## Context
This is Prompt 1 in a series of 5. This prompt defines the CLI core, project scaffold, routing/state foundations, and feature-pack plugin contracts. UI/auth/payments/DX pack implementation details are handled in Prompts 2-5.

## Hard Requirements

### CLI Scope
1. The CLI creates **new projects only** (no in-place modification of existing apps).
2. Command shape must be:
   - `create-rn-ai-starter <project-name>`
   - Flags: `--ui tamagui|gluestack`, `--auth clerk|none`, `--payments stripe|none`, `--dx basic|full`, `--preset neutral-green|fluent-blue`, `--yes`
3. The CLI must install dependencies **only** for selected feature packs.
4. The CLI must generate files **only** for selected feature packs.

### Project Structure & Routing
1. Use Expo SDK (latest stable) with Expo Router.
2. Explicitly allow a root-level `app/` directory for Expo Router.
3. All non-router source code must live under `src/`.
4. Route groups must include `(onboarding)` and `(app)`, with `(auth)` generated only when auth pack is enabled.
5. Base routes required:
   - Splash/entry handling
   - Onboarding flow (2-3 screens)
   - Main tab shell (Home, Profile, Settings)

### State Management
1. Use Zustand for client state.
2. Use TanStack Query for server/async state.
3. Clearly define responsibilities and avoid overlap.

### Feature-Pack Plugin System
1. Define pack registry with deterministic application order:
   - `core` (always), then `ui`, `auth`, `payments`, `dx`
2. Each pack contract must include:
   - `dependencies`
   - `devDependencies`
   - `files/templates`
   - `postApplyValidation`
3. Enforce ownership boundaries so packs only touch declared integration points.

### Provider Selection Mechanism
1. `starter.config.ts` controls selected providers and modes.
2. Use resolver/factory modules keyed by config values.
3. Do **not** require impossible conditional re-exports.
4. Selection is build-time/import-time in generated code (not runtime toggle UI).

### TypeScript & Conventions
1. `strict: true`, `noUncheckedIndexedAccess: true`.
2. Path alias `@/* -> src/*`.
3. Output examples must be valid TypeScript.

## Required `starter.config.ts` Shape

```ts
export type UiProvider = 'tamagui' | 'gluestack'
export type AuthProvider = 'clerk' | 'none'
export type PaymentsProvider = 'stripe' | 'none'
export type DxProfile = 'basic' | 'full'
export type ThemePreset = 'neutral-green' | 'fluent-blue'

export interface StarterConfig {
  ui: UiProvider
  auth: AuthProvider
  payments: PaymentsProvider
  dx: DxProfile
  preset: ThemePreset
}

export const starterConfig: StarterConfig = {
  ui: 'tamagui',
  auth: 'none',
  payments: 'none',
  dx: 'basic',
  preset: 'neutral-green',
}
```

## Output Format (Required)
Return your answer in this exact structure:

### 1. Executive Summary
- One paragraph on the CLI-first architecture.

### 2. Generator Lifecycle
- Step-by-step generation flow from argument parsing to final validation.

### 3. Complete File/Folder Tree
- Full root tree.
- Mark pack-owned files and core-owned files.
- Mark optional files with `(generated when enabled)`.

### 4. Core TypeScript Files
- `starter.config.ts`
- `src/cli/pack-registry.ts`
- `src/cli/generator.ts`
- `src/cli/types.ts`

### 5. Provider Resolver Pattern
- `src/providers/ui/index.ts`
- `src/providers/auth/index.ts`
- `src/providers/payments/index.ts`
- Show resolver/factory implementation (no conditional re-export language).

### 6. Expo Router Layout Foundation
- `app/_layout.tsx`
- `app/(onboarding)/_layout.tsx`
- `app/(app)/_layout.tsx`
- `app/(auth)/_layout.tsx` as optional.

### 7. State Foundation
- `src/store/` bootstrap for onboarding + theme preset.
- `src/lib/query-client.ts`.

### 8. Architectural Decisions Table
- Decision | Chosen Option | Rationale | Rejected Alternative.

### 9. Generation Invariants
- Explicit checklist proving selective dependency/file generation.

Be concrete. Every file must contain valid TypeScript/TSX or a clear TODO marker tied to Prompt 2-5 pack implementation.
