# AI Provider Selection Design

**Date:** 2026-03-08  
**Scope:** `packages/create-rn-ai-starter` CLI prompt/config updates

## Problem
The CLI currently asks for `ui`, `auth`, `payments`, `dx`, and `preset`, but it does not capture how AI should be implemented in the generated app. We need an explicit AI choice immediately after authentication selection, with options:
- `on-device-mlkit` (React Native ML Kit style local inference path)
- `online-openrouter` (hosted LLM path via OpenRouter)

This choice must be available regardless of auth mode (`auth=none` and `auth=clerk`).

## Goals
- Add a first-class `ai` axis to CLI config and validation.
- Prompt for AI implementation right after auth in interactive mode.
- Support non-interactive usage via `--ai`.
- Persist selection into generated `src/starter.config.ts`.
- Keep existing behavior unchanged for users that do not set `--ai` (default applies).

## Non-Goals
- Implementing ML Kit/OpenRouter runtime feature packs in this change.
- Adding network keys or provider SDK integration in generated apps.
- Reworking prompt order beyond inserting AI selection post-auth.

## Design
1. Extend config domain model:
   - Add `AiProvider` union type in CLI source and generated template types.
   - Add `ai` to `StarterConfig`.
   - Add allowed values and default in config constants.

2. Extend CLI surface:
   - Add `--ai <provider>` flag in help/options.
   - Parse `opts.ai` into partial config.
   - In interactive mode, prompt `Which AI implementation?` right after auth if unset.

3. Preserve existing generator contract:
   - `runGenerator` remains unchanged; it receives full config.
   - Existing pack registry behavior remains unchanged.
   - `starter.config.ts.ejs` gains `ai` field so generated project captures selection.

4. Testing strategy:
   - Unit coverage for `validateConfig` new valid/invalid AI values.
   - CLI integration help text assertion for `--ai`.
   - (Optional follow-up) all-options matrix extension after feature packs consume `ai`.

## Risks and Mitigations
- Risk: breaking strict config validation.
  - Mitigation: add `ai` to allowed values + explicit validation tests.
- Risk: prompt order regression.
  - Mitigation: isolate insertion in `promptForMissing` directly after auth block and add/adjust tests.
- Risk: generated config mismatch.
  - Mitigation: update `starter.config.ts.ejs` and assert in integration test that generated file contains `ai`.

## Open Follow-Ups
- Introduce dedicated AI feature pack(s) so `ai` value drives dependencies/templates.
- Add docs page for AI provider modes similar to existing `docs/packs/*.md`.
