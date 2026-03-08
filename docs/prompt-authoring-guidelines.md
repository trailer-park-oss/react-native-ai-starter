# Prompt Authoring Guidelines for CLI Starter

## Goal
Keep all prompts aligned to the CLI core + feature-pack model and avoid contradictory or non-implementable requirements.

## Mandatory Rules
1. State pack scope and enablement mode at top of prompt.
2. Include explicit `none` behavior where applicable.
3. Use valid TypeScript in all examples.
4. Do not require conditional re-export behavior.
5. Keep root `app/` exception explicit; otherwise source under `src/`.
6. Require selective dependency and selective file generation.

## Output Contract Rules
- Use exact file paths.
- Distinguish always-generated vs mode-gated files.
- Include pack invariants section.
- Require realistic code/config, not pseudocode.

## Consistency Checks Before Finalizing Prompt
- Terminology matches `starter.config.ts` values.
- Token names are canonical (`primaryPressed`).
- Test location guidance aligns with listed output paths.
- Responsibilities split clearly (SDK vs backend when relevant).

## Reviewer Checklist
- [ ] No internal contradictions.
- [ ] No impossible build/tooling requirements.
- [ ] Dependencies are scoped to enabled packs.
- [ ] Disabled pack behavior is fully specified.
