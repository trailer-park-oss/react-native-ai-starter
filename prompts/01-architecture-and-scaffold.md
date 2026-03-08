# Prompt 1: Architecture & Scaffold

You are a senior React Native architect. Your task is to design the foundational architecture and project scaffold for a production-grade Expo-based React Native starter kit targeting iOS and Android only.

## Context
This is the first prompt in a series of 5. This prompt focuses exclusively on project structure, navigation, state management, and module boundaries. Design tokens, auth, payments, and CI are handled in later prompts — do NOT design those here. Instead, leave clearly marked integration points for them.

## Hard Requirements

### Expo & Navigation
1. Use Expo SDK (latest stable) with Expo Router for file-based routing.
2. Define the route structure for these screens (content will be filled later):
   - Splash screen (app entry)
   - Onboarding flow (2-3 swipeable screens)
   - Auth screens (login, signup, forgot password — layout only, logic comes in Prompt 3)
   - Main app shell with bottom tab navigation (Home, Profile, Settings)
3. Use Expo Router's layout groups to separate (auth), (onboarding), and (app) route groups.

### State Management
1. Use Zustand for client state.
2. Use TanStack Query (React Query) for server/async state.
3. Define where each is used — do not mix responsibilities.

### Module Boundaries
1. The project must support swappable "provider" modules for:
   - UI library (default: Tamagui, alternative: Gluestack)
   - Auth provider (default: Clerk — implemented in Prompt 3)
   - Payments provider (default: Stripe — implemented in Prompt 4)
2. Each provider category must have:
   - A TypeScript interface/contract file (e.g., `providers/auth/auth.interface.ts`)
   - An `index.ts` barrel that re-exports the active provider
   - A config entry in a root `starter.config.ts` that selects the active provider
3. Provider-specific code must live in its own subdirectory (e.g., `providers/auth/clerk/`). No provider-specific imports outside that subdirectory.

### TypeScript & Folder Conventions
1. Strict TypeScript (`strict: true`, `noUncheckedIndexedAccess: true`).
2. Use path aliases (`@/` -> `src/`).
3. All source code lives under `src/`.

### Selection Mechanism
1. The `starter.config.ts` file at the project root controls which providers are active:
```ts
export const starterConfig = {
  ui: 'tamagui' | 'gluestack',
  auth: 'clerk',       // extensible later
  payments: 'stripe',  // extensible later
} as const;
```
2. Provider barrel files read from this config to re-export the correct implementation.
3. This is a build-time/import-time selection, NOT runtime toggling. Unused providers can be tree-shaken or removed by the developer.

## Output Format (Required)
Return your answer in this exact structure:

### 1. Executive Summary
- One paragraph on the architectural approach and key decisions.

### 2. Complete File/Folder Tree
- Full tree from project root, including every directory and placeholder file.
- Annotate directories with one-line descriptions.
- Include empty placeholder files where later prompts will fill content (mark them with `# TODO: Prompt N`).

### 3. starter.config.ts
- Full file contents with types and defaults.

### 4. Provider Interface Files
- `providers/auth/auth.interface.ts` — full type definitions for auth provider contract.
- `providers/payments/payments.interface.ts` — full type definitions for payments provider contract.
- `providers/ui/ui.interface.ts` — full type definitions for UI provider contract (theme config shape, component overrides).

### 5. Provider Barrel Files
- `providers/auth/index.ts` — conditional re-export based on config.
- `providers/payments/index.ts` — conditional re-export based on config.
- `providers/ui/index.ts` — conditional re-export based on config.

### 6. Expo Router Layout Files
- `app/_layout.tsx` — root layout with providers wrapped.
- `app/(onboarding)/_layout.tsx`
- `app/(auth)/_layout.tsx`
- `app/(app)/_layout.tsx` — tab navigator setup.
- Show the navigation guard logic: splash -> onboarding (if first launch) -> auth (if not logged in) -> app.

### 7. State Management Setup
- `src/store/` — Zustand store boilerplate (app state: onboarding complete, theme preference).
- `src/lib/query-client.ts` — TanStack Query client configuration.

### 8. Key Architectural Decisions
- Table format: Decision | Chosen Option | Rationale | Alternatives Considered.

Be concrete. Every file must have real, working TypeScript content or a clear TODO marker. No vague descriptions.
