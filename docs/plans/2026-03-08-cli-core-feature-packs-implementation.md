# CLI Core + Feature Packs Prompt Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite prompts and add extensive docs so the project defines a new-project-only CLI with modular feature packs that install/generate only selected capabilities.

**Architecture:** Keep Prompt 1 as CLI/core generator architecture and treat Prompts 2-5 as feature-pack specifications. Remove contradictions (paths, exports, invalid TS) and align all prompts around deterministic pack application and selective dependency/file generation. Add dedicated docs that become the source of truth for pack behavior and prompt authoring constraints.

**Tech Stack:** Markdown specs, Expo/React Native architecture conventions, TypeScript-oriented generator contracts.

---

### Task 1: Establish Verification Baseline

**Files:**
- Create: `docs/plans/verification/cli-prompt-audit-checklist.md`
- Modify: `docs/plans/2026-03-08-cli-core-feature-packs-implementation.md`
- Test: `prompts/01-architecture-and-scaffold.md`

**Step 1: Write the failing checklist assertions**

```md
- [ ] Prompt 1 allows root app/ exception while keeping src/ convention
- [ ] No prompt requires conditional re-export based on runtime config
- [ ] starter.config.ts examples are valid TypeScript
- [ ] Prompt 2 token naming uses primaryPressed only
- [ ] Prompt 3 auth contract includes email verification + resend methods
- [ ] Prompt 4 clearly separates Stripe SDK vs backend API responsibilities
- [ ] Prompt 5 test-location instructions align with required output paths
```

**Step 2: Run checks to verify current prompts fail checklist**

Run: `rg -n "All source code lives under `src/`|conditional re-export|ui: 'tamagui' \| 'gluestack'|primaryHover|Place tests next to source files" prompts/`
Expected: Matches found for known contradictions/ambiguities.

**Step 3: Capture baseline in checklist file**

```md
## Baseline
Current state contains contradictions listed above; fixes required in Prompts 1-5.
```

**Step 4: Re-run check to confirm baseline notes are saved**

Run: `test -f docs/plans/verification/cli-prompt-audit-checklist.md && echo OK`
Expected: `OK`

**Step 5: Commit**

```bash
git add docs/plans/verification/cli-prompt-audit-checklist.md
git commit -m "docs: add prompt audit verification checklist"
```

### Task 2: Rewrite Prompt 1 as CLI Core Spec

**Files:**
- Modify: `prompts/01-architecture-and-scaffold.md`
- Test: `prompts/01-architecture-and-scaffold.md`

**Step 1: Write failing assertions for Prompt 1 contradictions**

```bash
rg -n "All source code lives under `src/`|conditional re-export|ui: 'tamagui' \| 'gluestack'" prompts/01-architecture-and-scaffold.md
```

**Step 2: Run assertion to confirm failures exist pre-change**

Run: same as Step 1
Expected: 1+ matches

**Step 3: Write minimal corrected Prompt 1 content**

```md
- Define CLI command for new project generation only
- Explicitly allow root app/ for Expo Router
- Use provider resolver/factory language instead of conditional re-export
- Replace invalid TS literals with valid typed config + defaults
- Add rule: install/generate only selected feature packs
```

**Step 4: Verify Prompt 1 no longer contains banned patterns**

Run: `rg -n "conditional re-export|ui: 'tamagui' \| 'gluestack'" prompts/01-architecture-and-scaffold.md`
Expected: No matches

**Step 5: Commit**

```bash
git add prompts/01-architecture-and-scaffold.md
git commit -m "docs(prompts): rewrite prompt 1 for CLI core + valid provider resolution"
```

### Task 3: Align Prompt 2 with UI Pack Contract

**Files:**
- Modify: `prompts/02-design-system-and-tokens.md`
- Test: `prompts/02-design-system-and-tokens.md`

**Step 1: Write failing assertions for Prompt 2 ambiguity**

```bash
rg -n "All tokens and theme files go under `src/design-system/`|primaryHover" prompts/02-design-system-and-tokens.md
```

**Step 2: Run assertion to confirm current failures**

Run: same as Step 1
Expected: Matches present

**Step 3: Write minimal corrected Prompt 2 content**

```md
- Canonical tokens under src/design-system/
- UI adapter configs under src/providers/ui/{tamagui,gluestack}/
- Use primaryPressed only
- Add conditional generation clause: apply only when UI pack enabled
```

**Step 4: Verify ambiguity removed**

Run: `rg -n "primaryHover" prompts/02-design-system-and-tokens.md`
Expected: No matches

**Step 5: Commit**

```bash
git add prompts/02-design-system-and-tokens.md
git commit -m "docs(prompts): align prompt 2 with UI pack boundaries"
```

### Task 4: Expand Prompt 3 for Auth Pack Modes

**Files:**
- Modify: `prompts/03-auth-provider.md`
- Test: `prompts/03-auth-provider.md`

**Step 1: Write failing assertion for missing verification contract methods**

```bash
rg -n "verifyEmail|resend" prompts/03-auth-provider.md
```

**Step 2: Run assertion to confirm incomplete contract pre-change**

Run: same as Step 1
Expected: No match in interface contract block

**Step 3: Write minimal corrected Prompt 3 content**

```md
- Add auth modes: none | clerk
- Extend AuthProvider contract with verifyEmailCode + resendVerificationCode
- Clarify routing behavior when auth mode is none
- Keep only generic auth API imports for screens
```

**Step 4: Verify contract now includes required methods**

Run: `rg -n "verifyEmailCode|resendVerificationCode|none \| clerk" prompts/03-auth-provider.md`
Expected: Matches present

**Step 5: Commit**

```bash
git add prompts/03-auth-provider.md
git commit -m "docs(prompts): add auth pack modes and verification contract"
```

### Task 5: Clarify Prompt 4 Stripe/Backend Separation

**Files:**
- Modify: `prompts/04-payments-provider.md`
- Test: `prompts/04-payments-provider.md`

**Step 1: Write failing assertion for ambiguous SDK mapping language**

```bash
rg -n "Map every `PaymentsProvider` method to Stripe SDK calls" prompts/04-payments-provider.md
```

**Step 2: Run assertion to confirm ambiguous language exists**

Run: same as Step 1
Expected: 1 match

**Step 3: Write minimal corrected Prompt 4 content**

```md
- Add payments modes: none | stripe
- Stripe SDK required for payment sheet + client payment interactions
- Backend API client required for product/subscription lifecycle endpoints
- Generate files/deps only when payments pack enabled
```

**Step 4: Verify corrected responsibility wording present**

Run: `rg -n "none \| stripe|backend API client|payment sheet" prompts/04-payments-provider.md`
Expected: Matches present

**Step 5: Commit**

```bash
git add prompts/04-payments-provider.md
git commit -m "docs(prompts): clarify payments pack mode and Stripe/backend boundaries"
```

### Task 6: Split Prompt 5 into DX Profiles

**Files:**
- Modify: `prompts/05-dx-testing-and-ci.md`
- Test: `prompts/05-dx-testing-and-ci.md`

**Step 1: Write failing assertion for test-location inconsistency**

```bash
rg -n "Place tests next to source files|__tests__/" prompts/05-dx-testing-and-ci.md
```

**Step 2: Run assertion to confirm inconsistency pre-change**

Run: same as Step 1
Expected: Both patterns appear without reconciliation

**Step 3: Write minimal corrected Prompt 5 content**

```md
- Add DX modes: basic | full
- In full mode, allow explicit __tests__ layout as listed outputs
- Keep CI/test requirements scoped to selected DX mode
```

**Step 4: Verify mode language and location convention alignment**

Run: `rg -n "basic \| full|__tests__|full mode" prompts/05-dx-testing-and-ci.md`
Expected: Matches present

**Step 5: Commit**

```bash
git add prompts/05-dx-testing-and-ci.md
git commit -m "docs(prompts): define DX profiles and align test layout guidance"
```

### Task 7: Add Extensive CLI + Pack Documentation

**Files:**
- Create: `docs/cli-starter-architecture.md`
- Create: `docs/packs/ui.md`
- Create: `docs/packs/auth.md`
- Create: `docs/packs/payments.md`
- Create: `docs/packs/dx.md`
- Create: `docs/authoring-feature-packs.md`
- Create: `docs/prompt-authoring-guidelines.md`
- Test: `docs/`

**Step 1: Write failing assertion for missing docs**

```bash
for f in docs/cli-starter-architecture.md docs/packs/ui.md docs/packs/auth.md docs/packs/payments.md docs/packs/dx.md docs/authoring-feature-packs.md docs/prompt-authoring-guidelines.md; do [ -f "$f" ] || echo "MISSING $f"; done
```

**Step 2: Run assertion to confirm docs are missing pre-change**

Run: same as Step 1
Expected: `MISSING ...` lines printed

**Step 3: Write minimal first version for each document**

```md
# Required sections
- Goals/non-goals
- Pack contracts
- Dependency installation policy
- File ownership boundaries
- Failure modes
- Acceptance checklist
```

**Step 4: Verify all docs exist and include acceptance checklist terms**

Run: `rg -n "acceptance checklist|selected dependencies|disabled packs" docs/cli-starter-architecture.md docs/packs/*.md docs/authoring-feature-packs.md docs/prompt-authoring-guidelines.md`
Expected: Matches across docs

**Step 5: Commit**

```bash
git add docs/cli-starter-architecture.md docs/packs/*.md docs/authoring-feature-packs.md docs/prompt-authoring-guidelines.md
git commit -m "docs: add extensive CLI and feature-pack architecture documentation"
```

### Task 8: Cross-Prompt Consistency Verification

**Files:**
- Modify: `docs/plans/verification/cli-prompt-audit-checklist.md`
- Test: `prompts/*.md`

**Step 1: Write final verification command set**

```bash
rg -n "conditional re-export|primaryHover|ui: 'tamagui' \| 'gluestack'" prompts/ && exit 1 || true
rg -n "new project|none \| clerk|none \| stripe|basic \| full|install.*selected" prompts/
```

**Step 2: Run final verification commands**

Run: commands above
Expected: First command returns no banned matches; second command returns expected new model matches.

**Step 3: Record pass/fail in checklist doc**

```md
## Final Verification
- [x] Contradictions removed
- [x] Pack-mode language present across prompts
- [x] Selective install/generation requirement present
```

**Step 4: Re-run checklist spot-check**

Run: `sed -n '1,220p' docs/plans/verification/cli-prompt-audit-checklist.md`
Expected: Final verification section shows completed checks.

**Step 5: Commit**

```bash
git add docs/plans/verification/cli-prompt-audit-checklist.md
git commit -m "docs: verify prompt consistency for CLI feature-pack model"
```
