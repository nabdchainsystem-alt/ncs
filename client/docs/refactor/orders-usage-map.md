# Orders Page Usage Map

## 1. Component & Utility Inventory

| Category | Items | Notes |
| --- | --- | --- |
| Layout & Structure | `PageHeader`, `BaseCard` | Cards orchestrate each block; header handles search + quick actions dropdown. |
| KPI & Metric Cards | `KPICard` (custom inline usage) | Four-up KPI grids repeated across multiple blocks; identical layout reused in other pages. |
| Charts | `ReactECharts` instances (`statusChart`, `departmentTotals`, `urgentDepartmentTotals`, `statusDistributionOption`, etc.) | Each chart defined inline with bespoke ECharts option objects; pie and bar charts share similar grid/legend/tooltip config repeated across sections. |
| Tables | Native `<table>` markup within BaseCard | Implements sticky header, scrolling container, action buttons, paging controls; similar pattern exists on Requests/Inventory pages. |
| Filters & Quick Actions | Inline button groups, pills, `ListFilter` icon, dropdown actions derived from `menuItems` | Filter pills built ad-hoc with duplicated styling; quick actions rely on PageHeader’s dropdown instead of a reusable component. |
| Data Hooks & State | `React.useMemo`, `React.useState`, local selectors (`statusCounts`, `statusOrder`, `urgentStatusCounts`, `departmentTotals`, etc.) | Business logic stays local; chart/table sections consume memoised datasets. |
| Styling Helpers | `cardTheme`, `chartTheme` | Provide border colours, spacing, gradients. Used repeatedly but values hard-coded in options as well. |
| Activity Feed | `RecentActivityBlock` | Shared dashboard component already abstracted. |
| Icons & Misc | `lucide-react` icons (e.g. `FolderOpen`, `Lock`, `Timer`, `ShieldCheck`, `ListFilter`, `MoreHorizontal`, `Truck`, etc.) | Reused across KPIs and tables for status/quick actions. |

## 2. Repeated UI Patterns

- **KPI Cards**: `KPICard` usages share identical props but require consistent grid wrappers and delta badges. Similar patterns exist in Overview, Requests, Inventory.
- **Chart Containers**: Every chart sits inside a `BaseCard` with the same height, padding, legend placement, and subtitle structure. Pie vs bar charts differ only by option payload.
- **Filters & Pills**: Status/category filter buttons are manually styled pill buttons. Same approach appears on Requests (tables) and Inventory (movements filter).
- **Table Layout**: Sticky header tables with overflow containers and repeated action buttons; pagination block at bottom uses identical markup (Prev/Next + page count).
- **Quick actions/export buttons**: Inline `button` elements with repetitive className strings to handle RBAC/disabled states.
- **Chart Options**: Grid, tooltip, and axis styling repeated across multiple option objects (orders, urgent orders, spend analysis).

These patterns are prime candidates for shared primitives in `ui/`, `charts/`, and `table/` directories.

## 3. Proposed Folder Plan

```
src/
  components/
    ui/
      StatCard.tsx          # Generic KPI card (title, value, delta, icon)
      SectionHeader.tsx     # Block header with title/subtitle/actions
      FiltersBar.tsx        # Search + pill/segmented controls + quick filters
      QuickActions.tsx      # Permission-aware action buttons/dropdowns
    charts/
      ChartCard.tsx         # Standard card wrapper (padding, legend, height)
      BarChart.tsx          # Configured ReactECharts bar wrapper w/ clamp & theming
      PieChart.tsx          # Configured pie/donut wrapper
    table/
      DataTable.tsx         # Sticky header, paging, sorting, export hooks
      TableToolbar.tsx      # Search, export, column visibility controls
  features/
    orders/
      hooks/                # Orders-specific selectors/memos (statusCounts, etc.)
      components/           # Order-specific compositions (e.g., UrgentOrdersPanel)
      page/OrdersPage.tsx   # Composes primitives + feature components
  theme/
    cardTheme.ts            # Tokens for spacing/border/radius
    chartTheme.ts           # Palette + chart defaults
  shared/
    format.ts               # formatNumber, formatSAR, percent, clampLabel
    rbac.ts                 # Existing permission helpers (if any)
```

Supporting Documentation (to create in later steps):
- `docs/theme-tokens.md` for theme/token definitions.
- `docs/components-catalog.md` for primitive usage.
- `docs/refactor/orders-usage-map.md` (this file) as baseline reference for audit.

## 4. Notes & Assumptions

- No business logic changes required; data memoization stays in Orders feature folder.
- RBAC/tenant scoping currently enforced via button `disabled` checks. Future `QuickActions` and `DataTable` should accept `canExport`, `canEdit` props sourced from existing context.
- Existing `cardTheme`/`chartTheme` files will migrate into `src/theme/` with consistent exports for reuse across pages.
- The orders table’s pagination and filter state should be encapsulated in the new `DataTable` without altering API parameters.

This audit freezes current behaviour so the upcoming refactor can focus on extracting shared primitives while preserving parity.
