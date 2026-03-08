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

---

## Implementation Compliance Checklist

Cross-referenced against `packages/create-rn-ai-starter/` on 2026-03-08. Updated 2026-03-08.

### CLI Scope
- [x] CLI creates new projects only (`resolveProjectPath` rejects existing directories)
- [x] Command shape: `create-rn-ai-starter <project-path>` (accepts name, relative path, absolute path, or `.`)
- [x] Flag `--ui tamagui|gluestack`
- [x] Flag `--auth clerk|none`
- [x] Flag `--payments stripe|none`
- [x] Flag `--dx basic|full`
- [x] Flag `--preset neutral-green|fluent-blue`
- [x] Flag `--yes` (skip prompts, use defaults)
- [x] Selective dependency installation (only enabled packs)
- [x] Selective file generation (only enabled packs)

### Project Structure & Routing
- [x] Expo SDK (latest stable ~55) with Expo Router
- [x] Root-level `app/` directory for Expo Router
- [x] Non-router source code under `src/` (store, lib, providers, design-system, components)
- [x] Route group `(onboarding)` — always generated
- [x] Route group `(app)` — always generated
- [x] Route group `(auth)` — generated only when auth pack enabled (owned by auth pack)
- [x] Splash/entry handling (`app/index.tsx` with Redirect)
- [x] Onboarding flow: 3 screens (welcome, features, get-started)
- [x] Main tab shell: Home, Profile, Settings

### State Management
- [x] Zustand for client state (`src/store/onboarding.ts`, `src/store/theme.ts`)
- [x] Zustand persist with MMKV for theme store (survives app restarts)
- [x] TanStack Query for server/async state (`src/lib/query-client.ts`)
- [x] Clear responsibilities — stores for UI/client state, query client for server cache

### Feature-Pack Plugin System
- [x] Pack registry with deterministic order: core → ui → auth → payments → dx
- [x] Pack contract: `dependencies` field (conditional per config)
- [x] Pack contract: `devDependencies` field (conditional per config)
- [x] Pack contract: `generate()` (files/templates)
- [x] Pack contract: `postApplyValidation()`
- [x] Ownership boundaries via `ownedPaths` per pack
- [x] UI pack uses `createUiPack(config)` factory for conditional deps/templates

### Provider Selection Mechanism
- [x] `starter.config.ts` controls selected providers and modes
- [x] Resolver/factory pattern in `src/providers/ui/index.ts` (switch on config)
- [x] Resolver/factory pattern in `src/providers/auth/index.ts` (switch on config)
- [x] Resolver/factory pattern in `src/providers/payments/index.ts` (switch on config)
- [x] No conditional re-exports — uses async `import()` in switch cases
- [x] Selection is build-time/import-time (not runtime toggle UI)

### TypeScript & Conventions
- [x] `strict: true` in generated tsconfig.json
- [x] `noUncheckedIndexedAccess: true` in generated tsconfig.json
- [x] Path alias `@/* → src/*` in generated tsconfig.json
- [x] All template outputs produce valid TypeScript/TSX
- [x] Stub packs use TODO markers tied to Prompts 3-5

### Required `starter.config.ts` Shape
- [x] Type `UiProvider = 'tamagui' | 'gluestack'`
- [x] Type `AuthProvider = 'clerk' | 'none'`
- [x] Type `PaymentsProvider = 'stripe' | 'none'`
- [x] Type `DxProfile = 'basic' | 'full'`
- [x] Type `ThemePreset = 'neutral-green' | 'fluent-blue'`
- [x] Interface `StarterConfig` with all 5 fields
- [x] Exported `starterConfig` const with interpolated values

### Generator Lifecycle
- [x] Step 1: Parse arguments (Commander)
- [x] Step 2: Resolve project path (name, relative, absolute, or `.`)
- [x] Step 3: Prompt for missing options (or `--yes` for defaults)
- [x] Step 4: Validate config (all values in allowed set)
- [x] Step 5: Create project directory
- [x] Step 6: Apply packs in deterministic order
- [x] Step 7: Write merged package.json
- [x] Step 8: Install dependencies (npm install + npx expo install)
- [x] Step 9: Run post-apply validations
- [x] Step 10: Print summary with next steps

### Prompt Status
- [x] Prompt 1 — CLI Core Architecture & Generator Scaffold — **COMPLETE**
- [x] Prompt 2 — UI Pack: Design System, Tokens & Library Adapters — **COMPLETE**
- [ ] Prompt 3 — Auth Provider — TODO
- [ ] Prompt 4 — Payments Provider — TODO
- [ ] Prompt 5 — DX, Testing & CI — TODO
