# UI Primitives Playground

Quick snippets to preview the shared primitives during development. Import these components directly in scratch routes or Storybook later.

```tsx
import StatCard from '@/components/ui/StatCard';
import SectionHeader from '@/components/ui/SectionHeader';
import FiltersBar from '@/components/ui/FiltersBar';
import QuickActions from '@/components/ui/QuickActions';
import ChartCard from '@/components/charts/ChartCard';
import BarChart from '@/components/charts/BarChart';
import PieChart from '@/components/charts/PieChart';
import DataTable from '@/components/table/DataTable';
import TableToolbar from '@/components/table/TableToolbar';
```

Each primitive has sensible defaults and composes with the design tokens (`cardTheme`, `chartTheme`, `formatNumber`). Use this file as a lightweight playground until a dedicated Storybook is introduced.
