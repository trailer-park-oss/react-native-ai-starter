# AI Providers Multi-Select Design

## Summary
Enable optional AI scaffolding with multi-select provider choices. Users can choose any combination of MLKit, ExecuTorch, and OpenRouter, or choose none to omit the AI pack entirely.

## Goals
- Allow selecting any subset of AI providers at scaffold time.
- Make the AI pack optional (no AI screen/providers when none selected).
- Use EJS branching to generate only the required templates.
- Preserve existing OpenRouter implementation and MLKit support.

## Non-Goals
- Runtime download and management of multiple large models beyond what provider libraries already handle.
- Automatic migration of existing generated apps.

## User Experience
- CLI supports multi-select prompt (checkboxes) with a “none” option.
- CLI supports repeatable flags: `--ai mlkit --ai executorch --ai openrouter`.
- If multiple providers are selected, the generated AI screen shows a provider selector; if a single provider is selected, it shows that provider directly.
- If none is selected, the AI screen is not generated and no provider files are created.

## Configuration Model
- `AiProvider` values:
  - `on-device-mlkit`
  - `on-device-executorch`
  - `online-openrouter`
- `StarterConfig.ai` becomes `AiProvider[]`.
- “none” is a CLI-only concept that maps to `ai: []`.
- Validation:
  - empty array allowed
  - unknown values rejected
  - selections deduplicated

## Template & EJS Strategy
- Shared templates: `templates/ai` generates interfaces, barrel exports, and common AI UI shell.
- Provider templates:
  - `templates/ai-mlkit`
  - `templates/ai-executorch`
  - `templates/ai-openrouter`
- EJS data flags:
  - `hasAi`, `hasMlkit`, `hasExecuTorch`, `hasOpenRouter`
- `app/(app)/ai.tsx`:
  - Generated only when `hasAi`.
  - If multiple providers, render selector and delegate to chosen provider.
  - If single provider, render provider UI directly.

## Pack Logic
- AI pack is conditional: if `config.ai.length === 0`, skip pack entirely.
- When included:
  - render `templates/ai`
  - render each provider template for selected providers
- Dependencies:
  - MLKit: `@infinitered/react-native-mlkit-object-detection`, `expo-image-picker`
  - ExecuTorch: `react-native-executorch` (plus any required Expo deps if needed)
  - OpenRouter: `expo-image-picker`
- `expoInstallPackages` is the union of selected providers.

## Validation
- Post-apply checks are provider-specific and run only for selected providers.
- Shared checks run when `hasAi`:
  - AI interface
  - AI barrel export
  - AI screen

## Risks & Mitigations
- Increased template branching: keep provider-specific logic isolated in provider templates.
- App size for multi-provider selections: scoped to user choice; “none” keeps baseline minimal.

## Testing
- Unit tests for CLI parsing of repeatable `--ai` flags.
- Generator tests for each provider subset (none, single, multiple).
- Validation tests for provider-specific files.
