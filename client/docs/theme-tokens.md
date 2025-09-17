# Theme Tokens Overview

The project now exposes design tokens through dedicated modules so pages and feature components can share an identical visual language without duplicating values.

## Card Tokens (`src/theme/cardTheme.ts`)

- **Radius scale**: `radius.xs`, `radius.sm`, `radius.md`, `radius.lg`, `radius.xl` (pixel values for consistent rounding).
- **Padding scale**: `padding.snug`, `padding.base`, `padding.roomy` (pixel spacing presets for card interiors).
- **Gap & header spacing**: `gap` (24px) and `headerSpacing` (12px) for grid layouts and card headers.
- **Surface helpers**: `surface(mode)`, `border(mode)`, `shadow(mode)` adapt to light/dark UI.
- **Typography presets**: `typography.heading`, `typography.subtitle`, `typography.meta` unify font size, weight, and letter spacing across sections.
- **Pill palette**: `pill('positive' | 'negative' | 'neutral' | 'info' | 'warning')` returns background/text colors for status badges.
- **Utility helpers**: `container(mode)` returns a ready-to-use card style object; `runtimeMode()` and `runtimeDirection()` inspect the DOM to align with current theme + direction.

## Chart Tokens (`src/theme/chartTheme.ts`)

- **Palette**: Primary/secondary/teal accents plus extended color array for ECharts series.
- **Grid & typography**: `applyBaseOption(mode)` injects shared grid and text styles; `neutralGrid`, `axisLabel`, and `textColor` align axes/labels with the active theme.
- **Legend defaults**: `legendDefaults(mode)` standardises icon, placement, and typography.
- **Heights**: `heights.bar|line|area` (300px) and `heights.pie` (280px) ensure consistent card sizing.
- **Gradients**: `mkGradient(color, stops?)` builds reusable linear gradients, with graceful fallback when ECharts global isn’t available.
- **Number helper**: `numberFormat(value, fractionDigits)` wraps the shared formatter for tooltip/axis reuse.

## Shared Formatters (`src/shared/format.ts`)

- `formatNumber(value, options)` — human-friendly number formatting with locale awareness and safe fallbacks.
- `formatSAR(value, options)` — SAR-specific formatter that appends the currency suffix.
- `clampLabel(label, maxLength)` — truncates labels with an ellipsis for tight chart/table spaces.
- `percent(value, fractionDigits, locale?)` — converts decimal ratios to percentage strings.

These modules are exported via `src/theme/index.ts` and `src/shared/index.ts`. Existing imports from `src/styles/cardTheme` and `src/styles/chartTheme` now proxy to the new modules to maintain backward compatibility until the refactor completes.
