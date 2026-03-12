# AI Model Selection (Scaffold-Time) Design

## Summary
Add scaffold-time model selection for OpenRouter and ExecuTorch. Model prompts appear only when the corresponding provider is selected. Selected models are stored in `starter.config.ts` under provider-scoped config.

## Goals
- Prompt for models during scaffold when OpenRouter and/or ExecuTorch are selected.
- Store selected models in config for use by templates.
- Keep ML Kit unchanged (no model prompt).

## Non-Goals
- Runtime model switching UI.
- Automatic model download or validation beyond provider defaults.

## Configuration Shape
`StarterConfig.ai` becomes:
```ts
ai: {
  providers: AiProvider[]
  openrouter?: { model: string }
  executorch?: { model: string }
}
```
- `none` maps to `providers: []`.
- `starter.config.ts` mirrors this shape.

## CLI UX
- AI provider selection remains multi-select with `none` option.
- If `online-openrouter` selected: prompt for model.
- If `on-device-executorch` selected: prompt for model.
- If both selected: prompt sequentially for each.

## Model Options
**OpenRouter:**
- `openai/gpt-4o-mini` (default)
- `openrouter/free`
- `stepfun/step-3.5-flash:free`

**ExecuTorch:**
- `LLAMA3_2_1B` (default)
- `LLAMA3_2_3B`
- `QWEN2_5_0_5B`
- `QWEN2_5_1_5B`
- `PHI_4_MINI`
- `SMOLLM_2_360M`

## Template Strategy
- Template data includes `aiProviders`, `openrouterModel`, and `executorchModel`.
- AI screen uses the selected model when initializing provider hooks.
- `starter.config.ts` is updated to write provider-scoped config.

## Validation
- Config validation verifies `providers` and optional model values are strings.
- When a provider is selected, its model must be present.

## Testing
- CLI integration test ensures model prompts appear when providers are selected.
- Generator tests verify `starter.config.ts` contains selected models.
- AI screen template tests verify model use in OpenRouter and ExecuTorch paths.
