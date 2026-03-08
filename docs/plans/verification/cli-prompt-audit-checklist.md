# CLI Prompt Audit Checklist

## Baseline
Current state originally contained contradictions around path rules, provider export mechanism, invalid TS snippet examples, and mode ambiguity.

## Final Verification
- [x] Prompt 1 explicitly allows root `app/` exception while keeping non-router source under `src/`.
- [x] Conditional re-export wording removed from prompts.
- [x] TS examples use valid literal assignments + typed unions.
- [x] Prompt 2 uses `primaryPressed` only.
- [x] Prompt 3 includes verification + resend methods in auth contract.
- [x] Prompt 4 separates Stripe SDK vs backend API responsibilities.
- [x] Prompt 5 aligns test-location guidance with explicit `__tests__` outputs.
- [x] Selective install/generation invariants included across prompt set.
