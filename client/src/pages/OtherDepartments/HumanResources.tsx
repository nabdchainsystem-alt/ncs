import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import * as Tooltip from '@radix-ui/react-tooltip';
import { CalendarDays, Clock, IdCard, Info, TrendingDown, UserPlus, Users } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import BaseCard from '../../components/ui/BaseCard';
import { StatCard, type StatCardProps } from '../../components/shared';
import cardTheme from '../../styles/cardTheme';
import chartTheme from '../../styles/chartTheme';
import { clampLabel } from '../../shared/format';

const HEADER_ACTIONS = [
  { key: 'new-hire', label: 'Add New Hire', icon: <IdCard className="w-4.5 h-4.5" /> },
  { key: 'team-schedule', label: 'Team Schedule', icon: <CalendarDays className="w-4.5 h-4.5" /> },
  { key: 'staff-directory', label: 'Staff Directory', icon: <Users className="w-4.5 h-4.5" /> },
];

type HrStat = {
  key: string;
  label: string;
  value: number;
  valueFormat?: StatCardProps['valueFormat'];
  valueFractionDigits?: StatCardProps['valueFractionDigits'];
  icon: React.ReactNode;
  delta?: StatCardProps['delta'];
};

const HR_STATS: HrStat[] = [
  {
    key: 'total-employees',
    label: 'Total Employees',
    value: 268,
    valueFormat: 'number',
    icon: <Users className="h-5 w-5 text-sky-500" />,
    delta: { label: '+18 YoY', trend: 'up' },
  },
  {
    key: 'avg-tenure',
    label: 'Avg Tenure (Years)',
    value: 4.6,
    valueFormat: 'number',
    valueFractionDigits: 1,
    icon: <Clock className="h-5 w-5 text-indigo-500" />,
    delta: { label: '+0.3 yrs', trend: 'up' },
  },
  {
    key: 'open-positions',
    label: 'Open Positions',
    value: 12,
    valueFormat: 'number',
    icon: <UserPlus className="h-5 w-5 text-emerald-500" />,
    delta: { label: 'Goal 8', trend: 'down' },
  },
  {
    key: 'attrition-rate',
    label: 'Attrition Rate (%)',
    value: 0.108,
    valueFormat: 'percent',
    valueFractionDigits: 1,
    icon: <TrendingDown className="h-5 w-5 text-rose-500" />,
    delta: { label: '-0.4 pts', trend: 'down' },
  },
];

const SKILL_INDICATORS: Array<{ name: string; max: number }> = [
  { name: 'Technical', max: 100 },
  { name: 'Leadership', max: 100 },
  { name: 'Communication', max: 100 },
  { name: 'Problem-Solving', max: 100 },
  { name: 'Innovation', max: 100 },
];

const SKILL_SERIES = [
  { name: 'Current Team', values: [82, 74, 79, 71, 65] },
  { name: 'Target Benchmark', values: [90, 82, 86, 84, 78] },
];

const RADAR_INFO_TEXT =
  'The Radar Chart shows team skills across multiple dimensions. A balanced shape means skills are evenly distributed. Gaps indicate areas needing training or hiring.';

const CHART_HEIGHT = 300;

function InfoButton({ text }: { text: string }) {
  return (
    <Tooltip.Provider delayDuration={120}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-lg border bg-white text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Info"
          >
            <Info className="h-4 w-4" />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Content
          side="left"
          align="end"
          sideOffset={8}
          className="max-w-xs rounded-lg border bg-white px-3 py-2 text-[12px] leading-relaxed text-gray-600 shadow-md dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
        >
          <span className="block text-left">{text}</span>
          <Tooltip.Arrow className="fill-white dark:fill-gray-900" />
        </Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

export default function HumanResourcesPage() {
  const radarOption = React.useMemo<EChartsOption>(() => {
    const mode = cardTheme.runtimeMode();
    const base = chartTheme.applyBaseOption(mode);
    const colors = [chartTheme.brandPrimary, chartTheme.brandSecondary];

    return {
      ...base,
      color: colors,
      legend: {
        ...chartTheme.legendDefaults(mode),
        data: SKILL_SERIES.map((series) => series.name),
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: chartTheme.tooltipBackground(mode),
        borderColor: chartTheme.neutralGrid(mode),
        borderWidth: 1,
        textStyle: { color: chartTheme.textColor(mode), fontSize: 12 },
      },
      radar: {
        center: ['50%', '52%'],
        radius: '68%',
        splitNumber: 4,
        indicator: SKILL_INDICATORS.map((indicator) => ({
          ...indicator,
        })),
        axisLine: {
          lineStyle: { color: chartTheme.neutralGrid(mode) },
        },
        splitLine: {
          lineStyle: {
            color: Array.from({ length: 4 }, () => chartTheme.neutralGrid(mode)),
          },
        },
        splitArea: {
          areaStyle: {
            color: mode === 'dark'
              ? ['rgba(148, 163, 184, 0.08)', 'rgba(148, 163, 184, 0.02)']
              : ['rgba(59, 130, 246, 0.08)', 'rgba(59, 130, 246, 0.02)'],
          },
        },
        axisName: {
          color: chartTheme.axisLabel(mode),
          fontSize: 12,
          formatter: (value: string) => clampLabel(value, 18),
        },
        nameGap: 8,
      },
      series: [
        {
          type: 'radar',
          animationDuration: 600,
          data: SKILL_SERIES.map((entry, index) => ({
            value: entry.values,
            name: entry.name,
            areaStyle: { color: chartTheme.mkGradient(colors[index % colors.length]) },
            lineStyle: { color: colors[index % colors.length], width: 2 },
            symbol: 'circle',
            symbolSize: 6,
            itemStyle: { color: colors[index % colors.length] },
          })),
        },
      ],
    };
  }, []);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <PageHeader
        title="Human Resources"
        searchPlaceholder="Search people, roles, and onboarding"
        menuItems={HEADER_ACTIONS}
      />

      <BaseCard title="Workforce Snapshot" subtitle="Headcount and retention highlights">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4" style={{ gap: cardTheme.gap }}>
          {HR_STATS.map((stat) => (
            <StatCard
              key={stat.key}
              label={stat.label}
              value={stat.value}
              valueFormat={stat.valueFormat}
              valueFractionDigits={stat.valueFractionDigits}
              icon={stat.icon}
              delta={stat.delta}
            />
          ))}
        </div>
      </BaseCard>

      <BaseCard
        title="Skills Distribution"
        subtitle="Team skills across core HR capabilities"
        headerRight={<InfoButton text={RADAR_INFO_TEXT} />}
      >
        <ReactECharts option={radarOption} style={{ height: CHART_HEIGHT }} />
      </BaseCard>
    </div>
  );
}
