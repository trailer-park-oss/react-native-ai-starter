# UI Pack

## Modes
- `tamagui`
- `gluestack`

## Responsibilities
- Define and expose canonical design tokens.
- Map tokens to selected UI provider adapter.
- Provide runtime theme preset + color mode resolution.

## Dependencies
- Install only selected UI provider dependencies.
- Do not install alternative UI provider deps unless explicitly selected.

## Generated Files
- `src/design-system/tokens.ts`
- `src/design-system/ThemeProvider.tsx`
- `src/design-system/elevation.ts`
- `src/providers/ui/tamagui/*` when `--ui tamagui`
- `src/providers/ui/gluestack/*` when `--ui gluestack`

## Integration Points
- `src/providers/ui/index.ts` resolver
- `app/_layout.tsx` provider wrapping
- `src/store` theme preset state

## Validation
- Token keys include `primaryPressed` (not `primaryHover`).
- Switching presets updates theme without restart.

## Acceptance Checklist
- [ ] Only selected UI adapter files exist.
- [ ] Canonical tokens are library-agnostic.
- [ ] ThemeProvider reads store preset + system mode.
