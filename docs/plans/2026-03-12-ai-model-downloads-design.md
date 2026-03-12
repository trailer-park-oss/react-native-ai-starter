# AI Model Downloads (CLI + In-App) Design

## Summary
Add ExecuTorch model download support at scaffold time (CLI) and at runtime (AI screen). Scaffold defaults to downloading the selected ExecuTorch model, while the app UI exposes download status and actions for both OpenRouter (no download required) and ExecuTorch (download required).

## Goals
- CLI: Offer a prompt to download ExecuTorch models during scaffold; default to download.
- App UI: Show model status and allow download/cancel for ExecuTorch.
- Consistent model selection across CLI and app.
- Clear status messaging for OpenRouter (cloud model, no download).

## Non-Goals
- Background downloads or advanced queueing.
- Automatic retries or checksum validation.
- Changing OpenRouter networking behavior.

## CLI UX
- After ExecuTorch model selection:
  - Prompt: “Download ExecuTorch model now?” Default **Yes**.
- If Yes:
  - Download model to a project-local path (see **Storage**).
  - Show CLI progress (bytes / percent if available).
- If No:
  - Write config indicating model ID but no local path.

## App UI UX
- AI screen shows status cards per provider:
  - **OpenRouter**: “Cloud model — no download required.”
  - **ExecuTorch**: “Model not downloaded” → Download button.
- Download in-app shows:
  - Progress bar + percent/bytes.
  - Cancel action (best-effort).
- Once downloaded:
  - Show “Ready” state and enable chat.

## Configuration Shape
Extend AI config:
```ts
ai: {
  providers: AiProvider[]
  openrouter?: { model: string }
  executorch?: {
    model: string
    modelPath?: string
  }
}
```
- `modelPath` is set only if the CLI downloaded the file.

## Storage
- Store downloaded models in `assets/models/` inside the generated project.
- Filename derived from model ID (sanitized).
- App uses `modelPath` if present, otherwise requires in-app download.

## Implementation Notes
- **CLI**: Add a download step when ExecuTorch is selected and download is approved.
- **Templates**:
  - ExecuTorch hook accepts `modelPath` or `modelId`.
  - AI screen renders status + download UI when ExecuTorch is selected.
- **In-App Download**:
  - Use `expo-file-system` (or a light dependency) to download model to app storage.
  - Persist path in local storage (e.g. `AsyncStorage`) for reuse.

## Testing
- CLI unit test for “download prompt default yes” logic.
- Generator tests validate `starter.config.ts` contains `modelPath` when download selected.
- UI tests (snapshot or template tests) verify download status UI appears for ExecuTorch.
