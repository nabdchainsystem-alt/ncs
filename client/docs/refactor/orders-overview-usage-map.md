# Orders & Overview UI Usage Map

## Shared building blocks
- `src/components/layout/PageHeader.tsx` (`PageHeader`): top-of-page title plus action menu used in both pages; each page defines its own `menuItems` array with identical options.
- `src/components/ui/BaseCard.tsx` (`BaseCard`): primary container for cards across Orders (all major blocks) and selectively in Overview (recent activity wrapper).
- `src/components/ui/KPICard.tsx` (`KPICard`): reusable KPI tile used in Orders for multiple KPI grids; Overview instead defines local KPI card variants.
- `src/components/dashboard/RecentActivityBlock.tsx` (`RecentActivityBlock`): shared activity feed module rendered in both pages (Orders wraps with `footerActionLabel`; Overview wraps in a `BaseCard`).
- `src/styles/cardTheme.ts` and `src/styles/chartTheme.ts`: theme helpers for spacing, borders, chart colors. Orders relies heavily on both; Overview currently only imports `chartTheme`.
- `echarts-for-react` charts: both pages compose bar, line, and pie charts via inline option objects rather than shared chart components.

## Orders page (`src/pages/Orders.tsx`)
- **Page scaffold**: `<Tooltip.Provider>` for info helpers, `<PageHeader>` with duplicated `menuItems`. Sets up layout spacing via utility classes.
- **Block 1: Orders Overview** (`BaseCard`):
  - KPI grid using four `KPICard` instances for order status counts.
  - Embedded charts: department bar chart (`ReactECharts` bar) and status distribution donut (`ReactECharts` pie) with shared `infoButton` tooltip action created locally.
- **Block 2: Purchase Orders table** (`BaseCard`):
  - Filter chips built inline with `statusPill` theme helper.
  - Sortable tabular layout constructed manually (table, pagination controls). No reuse of `src/components/orders/OrdersTable.tsx`.
- **Block 3: Urgent Orders Overview** (`BaseCard`):
  - KPI grid reusing `KPICard`.
  - Mixed visualizations: stacked area + line chart, radar chart, rose pie, ranked bar chart; all inline `ReactECharts` configs using `chartTheme`.
- **Block 4: Spend Analysis — Closed Orders** (`BaseCard`):
  - Two tables (Top Materials, Top Vendors) styled with `cardTheme` colors.
  - Two horizontal bar charts showing spend per material and vendor.
- **Block 5: Spend by Machine Category** (`BaseCard`):
  - Filter chips using `statusPill` and inline buttons.
  - Machine-level table and bar chart (spend by machine) with shared theme helpers.
- **Block 6: Monthly Trends & Delivery Performance** (`BaseCard`):
  - Summary KPI tiles composed inline (not `KPICard`).
  - Combined bar/line chart for orders vs spend and multiple delivery tables/charts (donut, bar) leveraging local formatter helpers.
- **Block 7: Recent Activity** (`BaseCard`): wraps `RecentActivityBlock` with local activity dataset.
- **Local helpers duplicated elsewhere**: number/date formatters (`fmtInt`, `fmtSAR`, `fmtPercent`, `formatDate`), `infoButton` tooltip button, and `statusPill` theme wrapper are scoped to this file.
- **Existing but unused Orders components**: `src/components/orders/OrdersTable.tsx`, `OrdersKPIs.tsx`, `OrdersMiniCharts.tsx`, etc. replicate table, KPI, and chart concerns now coded inline within `Orders.tsx`.

## Overview page (`src/pages/Overview.tsx`)
- **Page scaffold**: `<OrdersProvider>` context wrapper, `<PageHeader>` with duplicated `menuItems`, and page padding layout.
- **OverviewTopBlock**: custom card structure (plain `<section>`) housing:
  - `BigStatCard` (local component) grid of four KPIs.
  - Monthly expenses bar chart (`ReactECharts`) using `chartTheme` with inline options.
- **RequestsBlock**: local `PieCard` component (pie charts with inline config) rendered twice for requests by status and department.
- **OrdersBlock**: reuses the same `PieCard` component for orders data.
- **Inventory & vendor sections**: composed from existing modules in `src/components/inventory` and `src/components/vendors` (`WarehouseKpiMovementsBlock`, `WarehouseCompositionBlock`, `VendorsKpiSpendBlock`, `VendorsInsightsBlock`). These blocks encapsulate their own UI patterns.
- **Financial overview & collaboration**: reuse of `src/components/finance/FinancialOverviewBlock.tsx` and `src/components/dashboard/QuickDiscussionTasksBlock.tsx`.
- **Recent activity**: `BaseCard` wrapper with `RecentActivityBlock` (shared UI module).
- **Local helpers duplicated elsewhere**: `formatSAR` number formatter and locally defined KPI card components (`StatCard`, `BigStatCard`) mirror the functionality provided by `KPICard` and other UI primitives.

## Duplication and consolidation opportunities
- **Header action menus**: identical `menuItems` arrays live in `src/pages/Orders.tsx` and `src/pages/Overview.tsx`; extract to shared config or hook.
- **Formatter helpers**: SAR/number/percent/date formatters exist in both pages with slight variations; consider consolidating into a utility module (e.g., `src/utils/format.ts`).
- **KPI card variants**: Orders uses shared `KPICard` whereas Overview inlines `StatCard`/`BigStatCard`; align on a single KPI tile component with size variants.
- **Info tooltip button**: Orders defines `infoButton` helper; similar CTA/tooltip patterns appear throughout charts. Could live in `src/components/ui`.
- **Pie/Bar chart wrappers**: Both pages craft similar `ReactECharts` configs for pies and bars. Potential to abstract chart shells or option builders under `src/components/charts`.
- **Tables**: Orders page builds tables inline while `src/components/orders/OrdersTable.tsx` exists. Evaluate reusing or adapting the existing table component to maintain consistency.
- **Theme usage**: Orders leans on `cardTheme` spacing/border helpers while Overview hardcodes Tailwind classes. Standardizing on theme helpers would keep layout tokens consistent.

This map should guide extraction of shared layout pieces without affecting business logic or data flow.
