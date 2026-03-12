# AI Provider Selection UX (Checkbox Guard) Design

## Summary
Prevent the AI providers checkbox prompt from accepting an empty selection. If the user presses Enter without selecting anything, show a clear message instructing them to press Space to select at least one option (including `none`) and re-prompt.

## Goals
- Require at least one selection in the AI providers checkbox prompt.
- Explicitly tell users to press Space to select options.
- Preserve the existing `none` option semantics.

## Non-Goals
- Change AI config shape, templates, or generator behavior.
- Add new CLI flags or non-interactive behavior changes.

## UX Behavior
- Prompt: `Which AI providers?`
- If selection is empty: print a message like
  `Select at least one option (press Space), including "none" if you want AI disabled.`
- Then re-open the same checkbox prompt.

## Implementation Notes
- Change only `packages/create-rn-ai-starter/src/cli.ts` in the interactive flow.
- Keep the existing loop structure; add a guard before `normalizeAiProviders` is called.

## Testing
- If an interactive prompt test harness exists, add a minimal test to assert the empty selection is rejected.
- Otherwise, rely on manual verification.
