import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import {
  Banknote,
  CircleDollarSign,
  FileSpreadsheet,
  Info,
  PiggyBank,
  Percent,
  TrendingUp,
} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import BaseCard from '../../components/ui/BaseCard';
import { StatCard } from '../../components/shared';
import cardTheme from '../../styles/cardTheme';
import chartTheme from '../../styles/chartTheme';
import { clampLabel, percent as formatPercent } from '../../shared/format';

type ExpenseCategory = {
  name: string;
  value: number;
};

const financeActions = [
  { key: 'budget', label: 'Review Budget', icon: <PiggyBank className="w-4.5 h-4.5" /> },
  { key: 'cashflow', label: 'Cashflow Snapshot', icon: <Banknote className="w-4.5 h-4.5" /> },
  { key: 'export-ledger', label: 'Export Ledger', icon: <FileSpreadsheet className="w-4.5 h-4.5" /> },
];

const financialKpis = {
  revenue: 18200000,
  expenses: 13650000,
  profit: 4550000,
  margin: 0.25,
};

const expenseCategories: ExpenseCategory[] = [
  { name: 'Salaries', value: 5200000 },
  { name: 'Operations', value: 4100000 },
  { name: 'Marketing', value: 2300000 },
  { name: 'R&D', value: 1600000 },
  { name: 'Misc', value: 450000 },
];

const treemapExplanation = `The Treemap provides a hierarchical view of expenses. Bigger and darker blocks mean higher spending. Useful for quickly identifying where most money is going.`;

function InfoPopover({ text }: { text: string }) {
  return (
    <Tooltip.Provider delayDuration={120}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            aria-label="Chart info"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <Info className="h-4 w-4" />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="left"
            sideOffset={8}
            className="max-w-[260px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px] leading-relaxed text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            {text}
            <Tooltip.Arrow className="fill-white dark:fill-gray-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

function buildTreemapOption(data: ExpenseCategory[], mode: ReturnType<typeof cardTheme.runtimeMode>): EChartsOption {
  const base = chartTheme.applyBaseOption(mode);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const values = data.map((item) => item.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return {
    ...base,
    tooltip: {
      trigger: 'item',
      backgroundColor: chartTheme.tooltipBackground(mode),
      borderRadius: 8,
      padding: [10, 12],
      textStyle: { fontSize: 12 },
      valueFormatter: (value: number) => chartTheme.numberFormat(value, 0),
      formatter: (params: any) => {
        const value = Number(params.value ?? 0);
        const share = total > 0 ? formatPercent(value / total, 1) : '—';
        const formatted = chartTheme.numberFormat(value, 0);
        return `<strong>${params.name}</strong><br/>${formatted} SAR<br/>${share} of expenses`;
      },
    },
    series: [
      {
        type: 'treemap',
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        animationDuration: 300,
        animationEasing: 'cubicOut',
        data: data.map((item) => ({
          ...item,
          itemStyle: {
            borderColor: chartTheme.neutralGrid(mode),
            borderWidth: 1,
            gapWidth: 2,
          },
          label: {
            show: true,
            formatter: (info: { name: string }) => clampLabel(info.name, 12),
          },
        })),
        label: {
          color: chartTheme.axisLabel(mode),
          fontSize: 13,
        },
        upperLabel: { show: false },
        visualDimension: 0,
        visualMin: min,
        visualMax: max,
        color: chartTheme.palette,
        colorMappingBy: 'value',
        colorSaturation: [0.35, 0.85],
      },
    ],
  } as EChartsOption;
}

export default function FinancePage() {
  const mode = cardTheme.runtimeMode();

  const treemapOption = React.useMemo(
    () => buildTreemapOption(expenseCategories, mode),
    [mode],
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
      <PageHeader
        title="Finance"
        searchPlaceholder="Search budgets, invoices, and payments"
        menuItems={financeActions}
      />

      <BaseCard title="Financial Snapshot" subtitle="Key revenue and profitability metrics">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4" style={{ gap: cardTheme.gap }}>
          <StatCard
            label="Total Revenue"
            value={financialKpis.revenue}
            valueFormat="sar"
            icon={<CircleDollarSign className="h-5 w-5 text-emerald-500" />}
            delta={{ label: '+8.4% vs LY', trend: 'up' }}
          />
          <StatCard
            label="Total Expenses"
            value={financialKpis.expenses}
            valueFormat="sar"
            icon={<Banknote className="h-5 w-5 text-sky-500" />}
            delta={{ label: '+4.2% vs LY', trend: 'down' }}
          />
          <StatCard
            label="Net Profit"
            value={financialKpis.profit}
            valueFormat="sar"
            icon={<TrendingUp className="h-5 w-5 text-indigo-500" />}
            delta={{ label: '+2.8% vs plan', trend: 'up' }}
          />
          <StatCard
            label="Profit Margin %"
            value={financialKpis.margin}
            valueFormat="percent"
            valueFractionDigits={1}
            icon={<Percent className="h-5 w-5 text-amber-500" />}
            delta={{ label: '+0.6 pts vs LY', trend: 'up' }}
          />
        </div>
      </BaseCard>

      <BaseCard
        title="Expense Breakdown"
        subtitle="Share of total operating costs"
        headerRight={<InfoPopover text={treemapExplanation} />}
      >
        <div className="mt-2">
          <ReactECharts
            notMerge
            lazyUpdate
            style={{ height: 300, width: '100%' }}
            option={treemapOption}
          />
        </div>
      </BaseCard>
    </div>
  );
}

