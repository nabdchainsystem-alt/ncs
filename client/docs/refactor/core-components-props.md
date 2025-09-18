# Core UI Components (Step 3)

## `StatCard`
- Props: `label`, `value`, optional `icon`, `valueFormat` (`'number'|'sar'|'percent'`), `valueFractionDigits`, `delta` (`{ value?, label?, format?, fractionDigits?, trend? }`).
- Fixed layout: icon top, label mid, value large, delta pill bottom-right. Height 152px.
- Formatting helpers internally leverage `formatNumber`, `formatSAR`, `percent`.

## `PieChartCard`
- Props: `title`, `data: { name, value, color? }[]`, optional `subtitle`, `legendPosition`, `clamp`, `loading`, `errorMessage`, `emptyMessage`, `onRetry`, `headerRight` for optional actions/tooltips.
- Renders doughnut pie with 280px card height, bottom legend, label clamp default 12 chars.

## `BarChartCard`
- Props: `title`, `data: { label, value }[]`, optional `subtitle`, `axisLabelClamp`, `axisLabelRotate`, `valueFormat` (`'number'|'sar'`), optional `axisValueSuffix`, `tooltipValueSuffix`, `headerRight`, plus `loading`, `errorMessage`, `emptyMessage`, `onRetry`.
- Fixed 300px height, neutral grid, optional tick rotation + label clamp default 12 chars.

## `RecentActivityFeed`
- Props: `items: { id, icon, title, meta, actionLabel?, onAction?, href? }[]`, optional `visibleCount`, `isLoading`, `errorMessage`, `emptyMessage`, `onRetry`.
- Shows 6 items by default, with skeletons for loading and compact empty/error states.

## `PurchaseOrdersTable`
- Props cover server table needs: optional `title`/`subtitle`, customizable `filters`, plus `rows`, `page`, `pageSize`, `totalRows`, `sort`, `onSortChange`, `onPageChange`, `onPageSizeChange`, `columnVisibility`, `onColumnVisibilityChange`, `isLoading`, `emptyMessage`, `onRowClick`, `onExportCsv`, `canExportCsv`, `exportTooltip`, `statusRenderer`, `actionRenderer`, `stickyOffset`.
- Columns: PO Code, Vendor, Department, Date, Status, Amount (SAR), Actions with sticky header, column toggles, CSV button respecting `canExportCsv`.

Import path for all: `import { StatCard, PieChartCard, BarChartCard, RecentActivityFeed, PurchaseOrdersTable } from 'src/components/shared';`
