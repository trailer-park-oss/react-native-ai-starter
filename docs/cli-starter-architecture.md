# CLI Starter Architecture

## Purpose
`create-rn-ai-starter` scaffolds **new Expo React Native projects only** using a modular core + feature-pack architecture. It ensures selected capabilities are installed/generated while unselected capabilities remain absent.

## Non-Goals
- Modifying existing projects in place
- Runtime feature toggles for major providers
- Installing all optional SDKs by default

## Command Surface

```bash
create-rn-ai-starter <project-name> \
  --ui tamagui|gluestack \
  --auth clerk|none \
  --payments stripe|none \
  --dx basic|full \
  --preset neutral-green|fluent-blue \
  --yes
```

## Generation Lifecycle
1. Validate CLI args and project name.
2. Create project directory and base Expo files.
3. Emit `starter.config.ts` from selected options.
4. Apply `core` pack.
5. Apply selected packs in fixed order: `ui -> auth -> payments -> dx`.
6. Install only required dependencies for selected packs.
7. Run post-apply validators.
8. Print next steps and validation summary.

## Pack Contract
Each pack exposes:
- `id`
- `dependencies`
- `devDependencies`
- `generate(context)`
- `postApplyValidation(context)`
- `ownedPaths`

### Ownership Rules
- A pack may only write to its owned paths and explicit integration points.
- Shared integration points must be declared in the core contract.

## Directory Conventions
- Root `app/` is reserved for Expo Router layouts/routes.
- Non-router source lives under `src/`.
- Provider-specific code stays under `src/providers/<domain>/<provider>/`.

## Provider Resolution
Use resolver/factory modules that map config selections to concrete implementations.
Avoid “conditional re-export” patterns that are invalid or brittle in TS/ESM.

## Dependency Policy
- Install dependencies only for selected packs.
- Do not add transitive optional stacks when mode is `none`.
- CI should verify absence of disabled-pack dependencies.

## Failure Modes and Handling
- Invalid flag combinations: exit with actionable error.
- Missing env requirements for selected packs: throw startup validation error.
- Partial generation error: stop and print failed phase, touched files, and cleanup guidance.

## Acceptance Checklist
- [ ] Unselected dependencies are not installed.
- [ ] Disabled pack files are not generated.
- [ ] Generated app boots with selected pack set.
- [ ] `starter.config.ts` matches user-selected flags.
- [ ] Resolver modules reference only enabled provider keys.

## Maintainer Navigation
- Prompt runbook: `docs/prompt-usage-maintainer.md`
- Folder/file purpose map: `docs/repo-map-maintainer.md`
- Pack contracts: `docs/packs/`
- Prompt writing constraints: `docs/prompt-authoring-guidelines.md`
