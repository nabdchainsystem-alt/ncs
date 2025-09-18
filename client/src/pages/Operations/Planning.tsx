import React from 'react';
import ReactECharts from 'echarts-for-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import type { EChartsOption } from 'echarts';
import {
  AlertTriangle,
  BarChart3,
  CalendarRange,
  CalendarCheck2,
  ClipboardList,
  GaugeCircle,
  Info,
  NotebookPen,
} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import BaseCard from '../../components/ui/BaseCard';
import { StatCard } from '../../components/shared';
import cardTheme from '../../styles/cardTheme';
import chartTheme from '../../styles/chartTheme';
import { clampLabel } from '../../shared/format';

type CapacityView = 'this-week' | 'next-week';

type MilestonePoint = {
  date: string;
  label: string;
  value: number;
};

const actions = [
  { key: 'capacity-plan', label: 'Build Capacity Plan', icon: <BarChart3 className="w-4.5 h-4.5" /> },
  { key: 'timeline', label: 'Update Timeline', icon: <CalendarRange className="w-4.5 h-4.5" /> },
  { key: 'scenario', label: 'Scenario Draft', icon: <NotebookPen className="w-4.5 h-4.5" /> },
];

const KPI_CARDS = [
  {
    key: 'plan-adherence',
    label: 'Plan Adherence %',
    value: 0.87,
    valueFormat: 'percent' as const,
    icon: <GaugeCircle className="h-5 w-5 text-sky-500" />,
    delta: { label: '4 pts', trend: 'up' as const },
  },
  {
    key: 'jobs-scheduled',
    label: 'Jobs Scheduled (this week)',
    value: 42,
    valueFormat: 'number' as const,
    icon: <CalendarCheck2 className="h-5 w-5 text-emerald-500" />,
    delta: { label: '+6', trend: 'up' as const },
  },
  {
    key: 'jobs-risk',
    label: 'Jobs at Risk',
    value: 5,
    valueFormat: 'number' as const,
    icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    delta: { label: '-2', trend: 'down' as const },
  },
  {
    key: 'capacity-utilization',
    label: 'Capacity Utilization %',
    value: 0.79,
    valueFormat: 'percent' as const,
    icon: <ClipboardList className="h-5 w-5 text-indigo-500" />,
    delta: { label: 'stable', trend: 'flat' as const },
  },
];

const CAPACITY_DATA: Record<CapacityView, Array<{ department: string; utilization: number }>> = {
  'this-week': [
    { department: 'Production', utilization: 0.82 },
    { department: 'Maintenance', utilization: 0.68 },
    { department: 'Logistics', utilization: 0.74 },
    { department: 'Quality', utilization: 0.59 },
    { department: 'Engineering', utilization: 0.88 },
  ],
  'next-week': [
    { department: 'Production', utilization: 0.9 },
    { department: 'Maintenance', utilization: 0.61 },
    { department: 'Logistics', utilization: 0.7 },
    { department: 'Quality', utilization: 0.65 },
    { department: 'Engineering', utilization: 0.8 },
  ],
};

const SCHEDULE_INFO = `What am I seeing?
Calendar Heatmap shows daily load across the month. Darker cells = more scheduled hours/orders.
Dots mark milestones (releases, maintenance windows). Use it to spot overload days and balance capacity.
Reuse idea: For HR leave planning or training calendars by swapping the dataset.`;

const calendarMilestoneSeeds = [
  { day: 3, label: 'Line 4 Commissioning' },
  { day: 9, label: 'Maintenance Window' },
  { day: 17, label: 'Supplier Audit' },
  { day: 24, label: 'New Product Launch' },
];

const toISODate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

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
          <span className="block whitespace-pre-line">{text}</span>
          <Tooltip.Arrow className="fill-white dark:fill-gray-900" />
        </Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

function CapacityToggle({ value, onChange }: { value: CapacityView; onChange: (next: CapacityView) => void }) {
  const options: Array<{ key: CapacityView; label: string }> = [
    { key: 'this-week', label: 'This Week' },
    { key: 'next-week', label: 'Next Week' },
  ];

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border bg-white px-1 py-1 text-xs font-semibold dark:bg-gray-900"
      style={{ borderColor: cardTheme.border() }}
    >
      {options.map((option) => {
        const active = option.key === value;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={`rounded-full px-3 py-1 transition-colors ${
              active
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default function PlanningPage() {
  const mode = cardTheme.runtimeMode();
  const today = React.useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const scheduleData = React.useMemo(() => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const range = `${year}-${String(month + 1).padStart(2, '0')}`;

    const heatmap: Array<{ value: [string, number]; itemStyle?: { borderColor: string; borderWidth: number } }> = [];
    const milestonePoints: MilestonePoint[] = [];
    const todayIso = toISODate(today);

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const iso = toISODate(date);
      const loadBasis = Math.abs(Math.sin((day / daysInMonth) * Math.PI));
      const variation = (day % 3) * 2;
      const value = Math.round(4 + loadBasis * 8 + variation);
      heatmap.push({
        value: [iso, value],
        ...(iso === todayIso ? { itemStyle: { borderColor: chartTheme.brandPrimary, borderWidth: 2 } } : {}),
      });
    }

    calendarMilestoneSeeds.forEach((seed) => {
      if (seed.day > daysInMonth) return;
      const iso = toISODate(new Date(year, month, seed.day));
      const matching = heatmap.find((item) => item.value[0] === iso);
      if (!matching) return;
      milestonePoints.push({
        date: iso,
        label: seed.label,
        value: matching.value[1],
      });
    });

    const values = heatmap.map((item) => item.value[1]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const todayPoint = heatmap.find((item) => item.value[0] === todayIso) ?? null;

    return {
      range,
      heatmap,
      milestones: milestonePoints,
      min,
      max,
      todayPoint,
    } as const;
  }, [today]);

  const calendarOption = React.useMemo<EChartsOption>(() => {
    const base = chartTheme.applyBaseOption(mode);
    const axisColor = chartTheme.axisLabel(mode);
    const textColor = chartTheme.textColor(mode);
    const neutral = chartTheme.neutralGrid(mode);
    const tooltipBg = chartTheme.tooltipBackground(mode);

    const milestoneLookup = scheduleData.milestones.reduce<Record<string, string>>((acc, item) => {
      acc[item.date] = item.label;
      return acc;
    }, {});

    const series: any[] = [
      {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: scheduleData.heatmap,
        label: {
          show: true,
          color: textColor,
          fontSize: 11,
          formatter: ({ value }: any) => (Array.isArray(value) && typeof value[1] === 'number' ? value[1] : ''),
        },
      },
    ];

    if (scheduleData.milestones.length) {
      series.push({
        type: 'effectScatter',
        coordinateSystem: 'calendar',
        data: scheduleData.milestones.map((item) => ({
          name: item.label,
          value: [item.date, item.value, item.label],
        })),
        symbolSize: 10,
        rippleEffect: { scale: 2.6, brushType: 'stroke' },
        itemStyle: { color: chartTheme.accentTeal },
        zlevel: 2,
      });
    }

    if (scheduleData.todayPoint) {
      series.push({
        type: 'effectScatter',
        coordinateSystem: 'calendar',
        data: [
          {
            name: 'Today',
            value: [scheduleData.todayPoint.value[0], scheduleData.todayPoint.value[1], 'Today'],
          },
        ],
        symbolSize: 16,
        rippleEffect: { scale: 3.2, brushType: 'stroke' },
        itemStyle: { color: chartTheme.brandPrimary },
        zlevel: 3,
      });
    }

    return {
      ...base,
      tooltip: {
        trigger: 'item',
        backgroundColor: tooltipBg,
        borderWidth: 0,
        textStyle: { color: textColor, fontSize: 12 },
        formatter: (params: any) => {
          const value = Array.isArray(params?.value) ? params.value : [];
          const date = typeof value[0] === 'string' ? value[0] : '';
          const numeric = typeof value[1] === 'number' ? value[1] : 0;
          const readableDate = date
            ? new Date(date.replace(/-/g, '/')).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })
            : '';
          const milestone = milestoneLookup[date];
          const loadLabel = `${chartTheme.numberFormat(numeric)} hrs scheduled`;
          const milestoneLine = milestone
            ? `<div style="margin-top:6px;color:${axisColor};">Milestone: ${clampLabel(milestone, 42)}</div>`
            : '';
          return `<div style="font-weight:600;margin-bottom:4px;">${readableDate}</div><div style="font-size:12px;">${loadLabel}</div>${milestoneLine}`;
        },
      },
      visualMap: {
        show: true,
        min: scheduleData.min,
        max: scheduleData.max,
        calculable: false,
        orient: 'horizontal',
        left: 'center',
        bottom: 16,
        textStyle: { color: axisColor },
        inRange: {
          color: ['#e2e8f0', chartTheme.brandPrimary],
        },
      },
      calendar: {
        orient: 'horizontal',
        range: scheduleData.range,
        cellSize: ['auto', 34],
        top: 16,
        left: 32,
        right: 32,
        bottom: 80,
        itemStyle: {
          borderWidth: 1,
          borderColor: neutral,
        },
        splitLine: {
          show: true,
          lineStyle: { color: neutral },
        },
        monthLabel: {
          show: true,
          color: textColor,
          fontWeight: 600,
        },
        dayLabel: {
          color: axisColor,
          fontSize: 12,
        },
        yearLabel: { show: false },
      },
      series,
    } as EChartsOption;
  }, [mode, scheduleData]);

  const [capacityView, setCapacityView] = React.useState<CapacityView>('this-week');
  const capacityRows = CAPACITY_DATA[capacityView];
  const palette = chartTheme.palette;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <PageHeader
        title="Planning"
        searchPlaceholder="Search s&op cycles, forecasts, and commitments"
        menuItems={actions}
      />

      <BaseCard
        title="Rolling Schedule"
        subtitle="Calendar heatmap and milestone view of workload"
        headerRight={<InfoButton text={SCHEDULE_INFO} />}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4" style={{ gap: cardTheme.gap }}>
          {KPI_CARDS.map((card) => (
            <StatCard
              key={card.key}
              label={card.label}
              value={card.value}
              valueFormat={card.valueFormat}
              icon={card.icon}
              delta={card.delta}
            />
          ))}
        </div>
        <div className="mt-6">
          <ReactECharts option={calendarOption} style={{ height: 300, width: '100%' }} notMerge lazyUpdate />
        </div>
      </BaseCard>

      <BaseCard
        title="Capacity Snapshot"
        subtitle="Department utilization overview"
        headerRight={<CapacityToggle value={capacityView} onChange={setCapacityView} />}
      >
        <div className="space-y-5">
          {capacityRows.map((row, index) => {
            const percent = Math.max(0, Math.min(100, Math.round(row.utilization * 100)));
            const barColor = palette[index % palette.length];
            return (
              <div key={`${capacityView}-${row.department}`} className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium text-gray-600 dark:text-gray-300">
                  <span>{row.department}</span>
                  <span>{chartTheme.numberFormat(percent)}%</span>
                </div>
                <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ width: `${percent}%`, backgroundColor: barColor }}
                    role="presentation"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </BaseCard>
    </div>
  );
}
