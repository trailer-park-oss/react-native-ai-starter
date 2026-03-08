# Authoring Feature Packs

## Objective
Define consistent rules for adding new packs without breaking selective generation guarantees.

## Required Pack Interface
- `id: string`
- `dependencies: string[]`
- `devDependencies: string[]`
- `ownedPaths: string[]`
- `generate(context): Promise<void>`
- `postApplyValidation(context): Promise<void>`

## Design Rules
1. Keep packs orthogonal; avoid hidden coupling.
2. Never install dependencies for disabled modes.
3. Keep provider-specific code inside provider directories.
4. Document env requirements with mode gates.
5. Add validation checks for key invariants.

## File Ownership
- Pack writes only within `ownedPaths` plus approved integration points.
- Cross-pack edits must be explicit in pack metadata.

## Validation Template
- Dependency presence/absence checks
- File existence/absence checks
- Config correctness checks
- Boot-time smoke checks

## Acceptance Checklist
- [ ] Pack has mode matrix and dependency matrix.
- [ ] Pack declares ownership and integration points.
- [ ] Pack can be disabled without residue.
