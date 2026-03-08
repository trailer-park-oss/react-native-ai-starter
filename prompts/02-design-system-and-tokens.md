# Prompt 2: Design System & Tokens

You are a senior mobile design systems engineer. Your task is to design the complete design token system and theme presets for a React Native starter kit built with Expo.

## Context
This is Prompt 2 in a series of 5. Prompt 1 established the project scaffold with a `providers/ui/` module boundary and a `starter.config.ts` that selects either `tamagui` or `gluestack` as the UI library. Your job is to define the shared design tokens consumed by both UI systems, two visual presets, and the mapping layer that bridges tokens to each library.

## Constraints
- This is a mobile-only project (iOS + Android). No web components, no Shopify Polaris, no Fluent UI packages. The presets are original color palettes loosely inspired by those aesthetics — not ports or wrappers.
- All tokens and theme files go under `src/design-system/`.
- Both UI libraries must consume the same canonical token definitions so switching UI lib doesn't change the visual identity.

## Hard Requirements

### Token Categories
Define semantic tokens for these categories:

**Colors:**
- `background` — app/screen background
- `backgroundSubtle` — secondary background (e.g., grouped list sections)
- `surface` — card/container background
- `surfaceRaised` — elevated surface (modal, popover)
- `text` — primary text
- `textSubtle` — secondary/muted text
- `textOnPrimary` — text on primary-colored backgrounds
- `border` — default border
- `borderSubtle` — lighter/less prominent border
- `primary` — brand/action color
- `primaryHover` — pressed/active state of primary (name it `primaryPressed` since mobile has no hover)
- `success`, `warning`, `critical`, `info` — semantic status colors
- `successSubtle`, `warningSubtle`, `criticalSubtle`, `infoSubtle` — tinted backgrounds for status banners

**Spacing:**
- Scale: `xs` (4), `sm` (8), `md` (12), `lg` (16), `xl` (24), `2xl` (32), `3xl` (48)

**Border Radius:**
- `sm` (4), `md` (8), `lg` (12), `xl` (16), `full` (9999)

**Typography:**
- Define a type scale: `caption`, `body`, `bodyLarge`, `heading`, `headingLarge`, `display`
- Each entry: `{ fontSize, lineHeight, fontWeight }`

### Two Visual Presets

**Preset: `neutral-green`**
- Neutral grays with green brand accent. Clean, commerce-oriented feel.
- Provide concrete hex values for every token above in both light and dark mode.

**Preset: `fluent-blue`**
- Neutral grays with blue brand accent. Material-influenced, soft surfaces.
- Provide concrete hex values for every token above in both light and dark mode.

### Token-to-Library Mapping

**Tamagui mapping:**
- Show how each semantic token maps to Tamagui's `createTheme()` / `createTokens()` API.
- Provide the actual `tamagui.config.ts` theme definition using the tokens.

**Gluestack mapping:**
- Show how each semantic token maps to Gluestack's `createConfig()` / theme tokens.
- Provide the actual Gluestack config file using the tokens.

### Elevation / Surface Guide (Mobile)
For each preset, define elevation behavior for:
- **Card** — slight shadow or border treatment, token: `surface`
- **Modal / Bottom Sheet** — heavier shadow, token: `surfaceRaised`, overlay backdrop
- **Pressed state** — opacity reduction or color shift (specify which and by how much)
- **Toast / Snackbar** — elevated, uses status-subtle background tokens

Provide these as React Native `StyleSheet` snippets (shadow properties for iOS, elevation for Android).

### Runtime Theme Selection
1. The active preset is stored in Zustand (from Prompt 1's `src/store/`).
2. Provide a `ThemeProvider` component at `src/design-system/ThemeProvider.tsx` that:
   - Reads the selected preset from the store
   - Reads system color scheme (light/dark) via `useColorScheme()`
   - Passes the resolved token map to the active UI library's provider
3. Switching presets should work at runtime without app restart.

## Output Format (Required)

### 1. Token Definition File
- `src/design-system/tokens.ts` — canonical token type definitions and the complete token values for both presets, both modes (light + dark). This is the single source of truth.

### 2. Color Token Tables
- Four tables (neutral-green light, neutral-green dark, fluent-blue light, fluent-blue dark).
- Columns: Token Name | Hex Value | Usage Description.

### 3. Spacing, Radius, Typography Tables
- One table each (shared across presets).

### 4. Tamagui Config
- `src/providers/ui/tamagui/tamagui.config.ts` — full working config that imports from `tokens.ts` and creates Tamagui themes.

### 5. Gluestack Config
- `src/providers/ui/gluestack/gluestack.config.ts` — full working config that imports from `tokens.ts` and creates Gluestack themes.

### 6. ThemeProvider
- `src/design-system/ThemeProvider.tsx` — full component code.

### 7. Elevation Styles
- `src/design-system/elevation.ts` — cross-platform shadow/elevation styles for card, modal, toast, pressed states. One export per preset.

### 8. Token Usage Examples
- Show 3 small component snippets demonstrating token consumption:
  1. A styled card using `surface` + elevation
  2. A status banner using `criticalSubtle` + `critical`
  3. A primary button using `primary` + `primaryPressed` + `textOnPrimary`
- Show each snippet for both Tamagui and Gluestack so the developer sees the difference.

Be concrete. Every token must have an actual hex value. Every config file must be valid TypeScript that could be dropped into the project.
