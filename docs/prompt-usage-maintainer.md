# Prompt Usage Guide (Maintainer)

## Why These Prompts Exist
The `prompts/` folder is the staged specification set used to generate a CLI-first React Native starter where only selected features are installed/generated.

## Recommended Usage Order
Run prompts in sequence because each prompt depends on the prior one:
1. `prompts/01-architecture-and-scaffold.md`
2. `prompts/02-design-system-and-tokens.md`
3. `prompts/03-auth-provider.md`
4. `prompts/04-payments-provider.md`
5. `prompts/05-dx-testing-and-ci.md`

## How To Use in Practice
1. Start with Prompt 1 and produce the core CLI/generator scaffold.
2. Apply Prompt 2 only for selected UI provider mode.
3. Apply Prompt 3 only if auth mode is enabled (`clerk`), or generate `none` mode behavior.
4. Apply Prompt 4 only if payments mode is enabled (`stripe`), or generate `none` mode behavior.
5. Apply Prompt 5 according to DX profile (`basic` or `full`).

## Prompt Execution Rules
- Keep `starter.config.ts` as the source of truth for selected modes.
- Install dependencies only for enabled packs.
- Generate files only for enabled packs.
- Preserve provider boundaries and resolver/factory pattern.
- Treat root `app/` as Expo Router exception; other app source under `src/`.

## Acceptance Check Before Finalizing Output
- [ ] No disabled-pack dependencies are installed.
- [ ] No disabled-pack files were generated.
- [ ] Mode-specific behavior (`none`, `basic`) is explicitly handled.
- [ ] Output code/config is valid TypeScript/TSX.

## Common Mistakes To Avoid
- Re-introducing impossible conditional re-export requirements.
- Mixing provider-specific imports outside provider implementation dirs.
- Writing Prompt 2 token adapters inside wrong directories.
- Adding auth/payments routes when respective pack mode is `none`.
