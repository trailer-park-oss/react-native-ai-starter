# Repo Map (Maintainer)

## Top-Level Folders

### `prompts/`
Source prompt specs that define what the generator/pack outputs should look like.
- `01-architecture-and-scaffold.md`: CLI core architecture, scaffold, pack contracts.
- `02-design-system-and-tokens.md`: UI pack spec (tokens + adapter mappings).
- `03-auth-provider.md`: Auth pack spec (`none`/`clerk` modes).
- `04-payments-provider.md`: Payments pack spec (`none`/`stripe` modes).
- `05-dx-testing-and-ci.md`: DX pack spec (`basic`/`full` profiles).

### `docs/`
Maintainer documentation for architecture, packs, and authoring rules.
- `cli-starter-architecture.md`: system-wide architecture and generation lifecycle.
- `prompt-usage-maintainer.md`: how to run/use prompt set in order.
- `repo-map-maintainer.md`: folder/file purpose map (this file).
- `authoring-feature-packs.md`: contract for creating/updating packs.
- `prompt-authoring-guidelines.md`: constraints for writing high-quality prompts.

### `docs/packs/`
Pack-specific responsibilities and guardrails.
- `ui.md`: UI pack modes, files, invariants.
- `auth.md`: auth mode behavior and contract requirements.
- `payments.md`: payments mode behavior and SDK/backend split.
- `dx.md`: DX profile behavior and CI/test boundaries.

### `docs/plans/`
Design/implementation planning artifacts.
- `2026-03-08-cli-core-feature-packs-design.md`: approved architecture design.
- `2026-03-08-cli-core-feature-packs-implementation.md`: execution plan.

### `docs/plans/verification/`
Verification checklists and audit outcomes.
- `cli-prompt-audit-checklist.md`: contradiction-removal and consistency checklist.

## Maintainer Workflow (Quick)
1. Update prompt spec(s) in `prompts/`.
2. Ensure docs in `docs/` and `docs/packs/` match spec changes.
3. Re-run contradiction checks against prompts.
4. Keep plan/checklist artifacts in `docs/plans/` for traceability.
