# Theme & Format Source of Truth

- **Layout primitives** → `import { cardTheme } from 'src/theme';`
  - Spacing: `cardTheme.padding.snug|base|roomy`, grid `cardTheme.gap`, header `cardTheme.headerSpacing`.
  - Radii: `cardTheme.radius.xs|sm|md|lg|xl`.
  - Borders & shadows: `cardTheme.border(mode?)`, `cardTheme.surface(mode?)`, `cardTheme.shadow(mode?)` keep cards consistent in light/dark.
- **Chart palette** → `import { chartTheme } from 'src/theme';`
  - Colors: `chartTheme.palette`, `chartTheme.brandPrimary`, `chartTheme.brandSecondary`, `chartTheme.accentTeal`.
  - Support tokens: `chartTheme.neutralGrid(mode?)`, `chartTheme.axisLabel(mode?)`, `chartTheme.mkGradient(color)`.
- **Numeric helpers** → `import { formatNumber, formatSAR, percent } from 'src/shared/format';`
  - `formatNumber(value, options?)` for generic integers/decimals.
  - `formatSAR(value, options?)` appends the SAR suffix while respecting locale.
  - `percent(value, fractionDigits?, locale?)` converts ratios to percentage strings.

These modules already power `src/styles/cardTheme` and `src/styles/chartTheme` re-exports, so existing imports keep working while new components can rely on the same single source.
