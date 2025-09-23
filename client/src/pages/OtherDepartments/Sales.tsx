import React from 'react';
import type { EChartsOption } from 'echarts';
import { AsyncECharts } from '../../components/charts/AsyncECharts';
import * as Tooltip from '@radix-ui/react-tooltip';
import {
  BadgeCheck,
  BarChart3,
  Handshake,
  Info,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import PageHeader, { type PageHeaderItem } from '../../components/layout/PageHeader';
import BaseCard from '../../components/ui/BaseCard';
import cardTheme from '../../styles/cardTheme';
import chartTheme from '../../styles/chartTheme';
import { StatCard } from '../../components/shared';
import type { StatCardProps } from '../../components/shared/StatCard';

type KpiConfig = {
  label: string;
  value: number;
  icon: React.ReactNode;
  valueFormat?: StatCardProps['valueFormat'];
  valueFractionDigits?: number;
  delta?: StatCardProps['delta'];
};

type FunnelStage = {
  name: string;
  value: number;
  color: string;
};

const actions: PageHeaderItem[] = [
  { key: 'new-opportunity', label: 'New Opportunity', icon: <Handshake className="w-4.5 h-4.5" /> },
  { key: 'update-forecast', label: 'Update Forecast', icon: <BarChart3 className="w-4.5 h-4.5" /> },
  { key: 'approve-quote', label: 'Approve Quote', icon: <BadgeCheck className="w-4.5 h-4.5" /> },
];

const kpis: KpiConfig[] = [
  {
    label: 'Total Sales (SAR)',
    value: 1825000,
    valueFormat: 'sar',
    icon: <Wallet className="h-5 w-5" />,
    delta: { label: '+7.4% MoM', trend: 'up' },
  },
  {
    label: 'Avg Order Value (SAR)',
    value: 14850,
    valueFormat: 'sar',
    icon: <ShoppingCart className="h-5 w-5" />,
    delta: { label: '+3.1% MoM', trend: 'up' },
  },
  {
    label: 'Conversion Rate (%)',
    value: 0.212,
    valueFormat: 'percent',
    valueFractionDigits: 1,
    icon: <TrendingUp className="h-5 w-5" />,
    delta: { label: '+0.6 pts', trend: 'up' },
  },
  {
    label: 'Active Customers',
    value: 486,
    valueFormat: 'number',
    icon: <Users className="h-5 w-5" />,
    delta: { label: '+18 vs LY', trend: 'up' },
  },
];

const funnelStages: FunnelStage[] = [
  { name: 'Leads', value: 3200, color: '#3B82F6' },
  { name: 'Opportunities', value: 1680, color: '#6366F1' },
  { name: 'Negotiations', value: 740, color: '#06B6D4' },
  { name: 'Closed', value: 320, color: '#14B8A6' },
];

const funnelInfoText = 'The Funnel Chart shows the progressive drop of prospects as they move through sales stages. Wider top = many leads, narrow bottom = fewer conversions. Helps spot weak sales stages quickly.';

function infoButton(text: string) {
  return (
    <Tooltip.Provider delayDuration={150}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            aria-label="Chart info"
            className="h-8 w-8 rounded-full border bg-white text-gray-600 shadow-sm grid place-items-center hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            style={{ borderColor: cardTheme.border() }}
          >
            <Info className="h-4 w-4" />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="left"
            align="end"
            sideOffset={8}
            className="max-w-[280px] rounded-xl border bg-white px-3 py-2 text-[12px] leading-relaxed text-gray-600 shadow-card dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            {text}
            <Tooltip.Arrow className="fill-white dark:fill-gray-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

function useSalesFunnelOption(stages: FunnelStage[]): EChartsOption {
  return React.useMemo(() => {
    const mode = cardTheme.runtimeMode();
    const base = chartTheme.applyBaseOption(mode);

    const data = stages.map((stage) => ({
      name: stage.name,
      value: stage.value,
      itemStyle: {
        color: chartTheme.mkGradient(stage.color, [
          { offset: 0, color: `${stage.color}ff` },
          { offset: 1, color: `${stage.color}33` },
        ]),
        borderWidth: 1,
        borderColor: chartTheme.neutralGrid(mode),
        shadowBlur: 12,
        shadowColor: `${stage.color}33`,
      },
    }));

    return {
      ...base,
      tooltip: {
        trigger: 'item',
        backgroundColor: chartTheme.tooltipBackground(mode),
        borderWidth: 0,
        textStyle: { color: chartTheme.textColor(mode), fontSize: 12 },
        formatter: (params: any) => `${params.name}: ${chartTheme.numberFormat(params.value, 0)}`,
      },
      series: [
        {
          type: 'funnel',
          left: '12%',
          top: '6%',
          bottom: '10%',
          width: '76%',
          min: stages[stages.length - 1]?.value ?? 0,
          max: stages[0]?.value ?? 0,
          sort: 'descending',
          gap: 8,
          label: {
            color: chartTheme.textColor(mode),
            fontWeight: 600,
            fontSize: 13,
            position: 'inside',
            formatter: (params: any) => `${params.name}\n${chartTheme.numberFormat(params.value, 0)}`,
            overflow: 'truncate',
            width: 120,
          },
          labelLine: {
            show: false,
          },
          itemStyle: {
            borderRadius: 6,
          },
          data,
          emphasis: {
            itemStyle: {
              shadowBlur: 20,
              shadowColor: 'rgba(15, 23, 42, 0.18)',
            },
            label: {
              fontSize: 14,
            },
          },
        },
      ],
    } satisfies EChartsOption;
  }, [stages]);
}

function SalesKpisBlock() {
  return (
    <BaseCard title="Sales KPIs" subtitle="Key commercial performance metrics" className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <StatCard
            key={item.label}
            label={item.label}
            value={item.value}
            valueFormat={item.valueFormat}
            valueFractionDigits={item.valueFractionDigits}
            icon={item.icon}
            delta={item.delta}
            className="h-full"
          />
        ))}
      </div>
    </BaseCard>
  );
}

function SalesFunnelBlock() {
  const option = useSalesFunnelOption(funnelStages);
  return (
    <BaseCard
      title="Sales Funnel"
      subtitle="Stage progression from leads to closed deals"
      headerRight={infoButton(funnelInfoText)}
    >
      <AsyncECharts style={{ height: 300, width: '100%' }} option={option} notMerge lazyUpdate fallbackHeight={300} />
    </BaseCard>
  );
}

export default function SalesPage() {
  const menuItems = React.useMemo<PageHeaderItem[]>(() => actions, []);
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <PageHeader
        title="Sales"
        menuItems={menuItems}
        searchPlaceholder="Search pipelines, quotes, and key accounts"
      />

      <SalesKpisBlock />

      <SalesFunnelBlock />
    </div>
  );
}
