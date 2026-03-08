# Prompt 2: UI Pack - Design System & Tokens

You are a senior mobile design systems engineer. Your task is to define the **UI feature pack** for the CLI starter, including canonical tokens and library adapters.

## Context
Prompt 1 defined the CLI core and pack model. This prompt applies only when `--ui` is selected (`tamagui` or `gluestack`).

## Hard Requirements

### Pack Enablement Rules
1. This prompt describes generation only for selected UI provider(s).
2. If UI pack is disabled (not possible in defaults, but future-compatible), no UI adapter dependencies/files are generated.

### Canonical Token Source of Truth
1. Canonical tokens live in `src/design-system/tokens.ts`.
2. Token categories:
   - Colors: `background`, `backgroundSubtle`, `surface`, `surfaceRaised`, `text`, `textSubtle`, `textOnPrimary`, `border`, `borderSubtle`, `primary`, `primaryPressed`, `success`, `warning`, `critical`, `info`, `successSubtle`, `warningSubtle`, `criticalSubtle`, `infoSubtle`
   - Spacing: `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`
   - Radius: `sm`, `md`, `lg`, `xl`, `full`
   - Typography: `caption`, `body`, `bodyLarge`, `heading`, `headingLarge`, `display`
3. Provide concrete values for two presets in both modes:
   - `neutral-green` (light/dark)
   - `fluent-blue` (light/dark)

### Adapter Boundaries
1. Canonical tokens remain in `src/design-system/`.
2. Library-specific adapters/configs live in:
   - `src/providers/ui/tamagui/`
   - `src/providers/ui/gluestack/`
3. Switching library must not require changing token values.

### Runtime Theme Resolution
1. `ThemeProvider` at `src/design-system/ThemeProvider.tsx` must:
   - Read preset from Zustand
   - Read mode via `useColorScheme()`
   - Resolve tokens and pass them to active UI provider
2. Runtime preset switch must work without app restart.

### Mobile Elevation Guide
1. Provide styles for card, modal/sheet, pressed state, and toast/snackbar.
2. Include iOS shadow + Android elevation fields.

## Output Format (Required)

### 1. UI Pack Overview
- Describe what files/dependencies are installed for Tamagui vs Gluestack.

### 2. Token Definition File
- `src/design-system/tokens.ts` full code.

### 3. Color Token Tables
- 4 tables: neutral-green light/dark, fluent-blue light/dark.

### 4. Shared Scale Tables
- spacing, radius, typography.

### 5. Tamagui Adapter
- `src/providers/ui/tamagui/tamagui.config.ts` full code.

### 6. Gluestack Adapter
- `src/providers/ui/gluestack/gluestack.config.ts` full code.

### 7. Theme Provider
- `src/design-system/ThemeProvider.tsx` full code.

### 8. Elevation Styles
- `src/design-system/elevation.ts` full code.

### 9. Token Usage Examples
- Card, status banner, primary button for both Tamagui and Gluestack.

### 10. Pack Invariants
- Show how generation skips irrelevant adapter files/dependencies.

Be concrete. Use `primaryPressed` only. All examples must be valid TypeScript/TSX.
