# AI Provider Selection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a new CLI `ai` configuration axis and prompt users right after auth to choose between on-device ML Kit and online OpenRouter, regardless of auth mode.

**Architecture:** Extend the existing `StarterConfig` axis pattern (`types.ts` + `config.ts` + `cli.ts` + template config emission) instead of introducing a new subsystem. Keep generator and pack ordering unchanged; only enrich config collection/validation and persistence to generated `starter.config.ts`.

**Tech Stack:** TypeScript, Commander, `@inquirer/prompts`, Vitest.

---

### Task 1: Add AI Type and Config Axis

**Files:**
- Modify: `packages/create-rn-ai-starter/src/types.ts`
- Modify: `packages/create-rn-ai-starter/src/config.ts`
- Modify: `packages/create-rn-ai-starter/templates/core/src/starter.config.ts.ejs`
- Test: `packages/create-rn-ai-starter/src/__tests__/validation.test.ts`

**Step 1: Write failing tests for AI config validation**

Add tests in `validation.test.ts`:
- accepts valid `ai: 'on-device-mlkit'`
- accepts valid `ai: 'online-openrouter'`
- rejects invalid `ai: 'local-llama'`

Use concrete config objects extending `DEFAULT_CONFIG`.

**Step 2: Run test to verify it fails**

Run: `cd packages/create-rn-ai-starter && npm run test -- src/__tests__/validation.test.ts`  
Expected: FAIL with type/runtime errors because `ai` axis does not exist yet.

**Step 3: Implement minimal type/config changes**

In `types.ts`:
- Add `export type AiProvider = 'on-device-mlkit' | 'online-openrouter'`
- Add `ai: AiProvider` to `StarterConfig`

In `config.ts`:
- Import `AiProvider`
- Add `ai` key to `ALLOWED_VALUES` with the two options above
- Add default `ai` in `DEFAULT_CONFIG` (recommended default: `on-device-mlkit`)

In `starter.config.ts.ejs`:
- Add `AiProvider` type
- Add `ai` property in interface and emitted object:
  `ai: '<%= ai %>'`

**Step 4: Run tests to verify they pass**

Run: `cd packages/create-rn-ai-starter && npm run test -- src/__tests__/validation.test.ts`  
Expected: PASS.


### Task 2: Add `--ai` Flag and Interactive Prompt After Auth

**Files:**
- Modify: `packages/create-rn-ai-starter/src/cli.ts`
- Test: `packages/create-rn-ai-starter/src/__tests__/cli-integration.test.ts`

**Step 1: Write failing test for help output**

In `cli-integration.test.ts`, add expectation in `--help` test:
- `expect(stdout).toContain('--ai')`

If desired, also assert help text mentions provider values.

**Step 2: Run test to verify it fails**

Run: `cd packages/create-rn-ai-starter && npm run test -- src/__tests__/cli-integration.test.ts`  
Expected: FAIL because CLI does not expose `--ai`.

**Step 3: Implement minimal CLI changes**

In `cli.ts`:
- Add `.option('--ai <provider>', \`AI implementation: ${ALLOWED_VALUES.ai.join(' | ')}\`)`
- Parse `opts['ai']` into `partial.ai`
- In `promptForMissing`, add AI prompt block immediately after auth block:
  - message: `Which AI implementation?`
  - choices from `ALLOWED_VALUES.ai`
  - default: `DEFAULT_CONFIG.ai`

Prompt order target:
1. UI
2. Auth
3. AI
4. Payments
5. DX
6. Preset

**Step 4: Run tests to verify they pass**

Run: `cd packages/create-rn-ai-starter && npm run test -- src/__tests__/cli-integration.test.ts`  
Expected: PASS.


### Task 3: Verify Generated Output Includes AI Selection

**Files:**
- Modify: `packages/create-rn-ai-starter/src/__tests__/all-options.test.ts`
- (Optional if needed) Modify: `packages/create-rn-ai-starter/src/utils/template.ts`

**Step 1: Write failing generated-output test**

Add assertion in an existing generation test that reads `src/starter.config.ts` and checks:
- contains `ai: 'on-device-mlkit'` (or whichever config case is used in that test)

Add one variant with `ai: 'online-openrouter'`.

**Step 2: Run test to verify it fails**

Run: `cd packages/create-rn-ai-starter && npm run test -- src/__tests__/all-options.test.ts`  
Expected: FAIL because test fixtures/config builders may not include `ai` yet.

**Step 3: Implement minimal wiring fixes**

If tests fail due to template data construction, update config-to-template mapping to pass `ai` value through where the `TemplateData` object is assembled.

Likely files to inspect:
- `packages/create-rn-ai-starter/src/packs/*/index.ts`
- `packages/create-rn-ai-starter/src/__tests__/all-options.test.ts` helper config builders

Keep changes minimal and avoid pack-behavior changes.

**Step 4: Run tests to verify they pass**

Run: `cd packages/create-rn-ai-starter && npm run test -- src/__tests__/all-options.test.ts`  
Expected: PASS.


### Task 4: Full Verification and Documentation Touchups

**Files:**
- Modify: `docs/cli-starter-architecture.md`
- Modify: `packages/create-rn-ai-starter/README.md`

**Step 1: Add failing doc assertions (manual checklist)**

Create checklist items:
- CLI options list includes `--ai on-device-mlkit|online-openrouter`
- Example command includes `--ai ...`
- Configuration summary mentions AI axis

**Step 2: Run full test suite before docs edits**

Run: `cd packages/create-rn-ai-starter && npm test`  
Expected: PASS; if failures occur, fix before docs update.

**Step 3: Update docs minimally**

In architecture/readme docs:
- Add `ai` flag and accepted values
- Mention prompt order includes AI after auth
- Clarify AI selection is independent of auth mode

**Step 4: Run verification again**

Run:
- `cd packages/create-rn-ai-starter && npm test`
- `cd packages/create-rn-ai-starter && npm run build`

Expected: PASS for both.


### Task 5: Final Quality Gate

**Files:**
- No file changes required unless fixes are found.

**Step 1: Run targeted smoke CLI command**

Run:
`cd packages/create-rn-ai-starter && node dist/index.js /tmp/rn-ai-smoke --yes --ai online-openrouter`

Expected:
- scaffold succeeds
- generated `/tmp/rn-ai-smoke/src/starter.config.ts` contains `ai: 'online-openrouter'`

**Step 2: Run lint/tests/build (project standard)**

Run:
- `cd packages/create-rn-ai-starter && npm test`
- `cd packages/create-rn-ai-starter && npm run build`

Expected: PASS.

**Step 3: Prepare PR summary**

Include:
- new `ai` axis values
- prompt insertion point (after auth)
- backward compatibility (`--yes` and defaults)
- test coverage updates

**Step 4: Request review**

Use `superpowers:requesting-code-review` before merging.
