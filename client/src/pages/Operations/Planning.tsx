import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import type { EChartsOption } from 'echarts';
import { addWeeks, endOfWeek, isWithinInterval, parseISO, startOfWeek } from 'date-fns';
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
import { useRequests } from '../../features/requests/hooks';
import { AsyncECharts } from '../../components/charts/AsyncECharts';

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

const SCHEDULE_INFO = `What am I seeing?
Calendar Heatmap shows daily load across the month. Darker cells = more scheduled hours/orders.
Dots mark milestones (releases, maintenance windows). Use it to spot overload days and balance capacity.
Reuse idea: For HR leave planning or training calendars by swapping the dataset.`;
const toISODate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const HIGH_PRIORITY = new Set(['urgent', 'high']);

const normalizePriority = (value?: string | null) => (value ? value.trim().toLowerCase() : '');

const safeParseDate = (value?: string | null): Date | null => {
  if (!value) return null;
  try {
    const parsed = parseISO(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
};

type ScheduleData = {
  range: string;
  heatmap: Array<{ value: [string, number]; itemStyle?: { borderColor: string; borderWidth: number } }>;
  milestones: MilestonePoint[];
  min: number;
  max: number;
  todayPoint: { value: [string, number] } | null;
  activeDays: number;
};

const buildScheduleData = (today: Date, requests: ReturnType<typeof useRequests>['data']): ScheduleData | null => {
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const range = `${year}-${String(month + 1).padStart(2, '0')}`;
  const todayIso = toISODate(today);

  const buckets = new Map<string, { value: number; labels: string[] }>();
  for (let day = 1; day <= daysInMonth; day += 1) {
    const iso = toISODate(new Date(year, month, day));
    buckets.set(iso, { value: 0, labels: [] });
  }

  (requests ?? []).forEach((request) => {
    const date = safeParseDate(request.requiredDate ?? request.createdAt);
    if (!date || date.getFullYear() !== year || date.getMonth() !== month) return;
    const iso = toISODate(date);
    const entry = buckets.get(iso);
    if (!entry) return;
    const contribution = Math.max(1, request.items?.length ?? 1);
    entry.value += contribution;
    const label = request.title || request.orderNo;
    if (label) entry.labels.push(label);
  });

  const heatmap: Array<{ value: [string, number]; itemStyle?: { borderColor: string; borderWidth: number } }> = [];
  const milestonePoints: MilestonePoint[] = [];

  buckets.forEach((bucket, iso) => {
    const item: { value: [string, number]; itemStyle?: { borderColor: string; borderWidth: number } } = {
      value: [iso, bucket.value],
    };
    if (iso === todayIso) {
      item.itemStyle = { borderColor: chartTheme.brandPrimary, borderWidth: 2 };
    }
    heatmap.push(item);

    const firstHighPriority = (requests ?? []).find((request) => {
      const priority = normalizePriority(request.priority);
      const date = safeParseDate(request.requiredDate ?? request.createdAt);
      return HIGH_PRIORITY.has(priority) && date && toISODate(date) === iso;
    });
    if (firstHighPriority) {
      milestonePoints.push({
        date: iso,
        label: firstHighPriority.title || firstHighPriority.orderNo,
        value: bucket.value,
      });
    }
  });

  const values = heatmap.map((item) => item.value[1]);
  const activeDays = values.filter((value) => value > 0).length;
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const todayPoint = heatmap.find((item) => item.value[0] === todayIso) ?? null;

  return {
    range,
    heatmap,
    milestones: milestonePoints.slice(0, 6),
    min,
    max,
    todayPoint,
    activeDays,
  };
};

type CapacityRow = { department: string; utilization: number; count: number };

const buildCapacityData = (requests: ReturnType<typeof useRequests>['data'], today: Date): Record<CapacityView, CapacityRow[]> => {
  const currentStart = startOfWeek(today, { weekStartsOn: 0 });
  const currentEnd = endOfWeek(today, { weekStartsOn: 0 });
  const nextStart = addWeeks(currentStart, 1);
  const nextEnd = addWeeks(currentEnd, 1);

  const buildRows = (start: Date, end: Date): CapacityRow[] => {
    const map = new Map<string, number>();
    (requests ?? []).forEach((request) => {
      const date = safeParseDate(request.requiredDate ?? request.createdAt);
      if (!date || !isWithinInterval(date, { start, end })) return;
      const key = request.department?.trim() || 'Unassigned';
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    if (!map.size) return [];
    const max = Math.max(...map.values());
    return Array.from(map.entries())
      .map(([department, count]) => ({ department, count, utilization: max > 0 ? count / max : 0 }))
      .sort((a, b) => b.count - a.count);
  };

  return {
    'this-week': buildRows(currentStart, currentEnd),
    'next-week': buildRows(nextStart, nextEnd),
  };
};

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
  const { data: requestData, isLoading, error } = useRequests();
  const requests = requestData ?? [];
  const today = React.useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const scheduleData = React.useMemo(() => buildScheduleData(today, requests), [today, requests]);

  const calendarOption = React.useMemo<EChartsOption | null>(() => {
    if (!scheduleData) return null;
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
  const capacityData = React.useMemo(() => buildCapacityData(requests, today), [requests, today]);
  const capacityRows = capacityData[capacityView] ?? [];
  const palette = chartTheme.palette;

  const kpiCards = React.useMemo(() => {
    if (!requests.length) {
      return [];
    }

    const total = requests.length;
    const completed = requests.filter((request) => {
      const status = request.status?.toLowerCase() ?? '';
      return status === 'approved' || status === 'closed';
    }).length;
    const planAdherence = total > 0 ? completed / total : null;

    const jobsAtRisk = requests.filter((request) => {
      const priority = normalizePriority(request.priority);
      if (!HIGH_PRIORITY.has(priority)) return false;
      const status = request.status?.toLowerCase() ?? '';
      return status !== 'closed';
    }).length;

    const capacitySnapshot = capacityData['this-week'] ?? [];
    const averageUtilization = capacitySnapshot.length
      ? capacitySnapshot.reduce((sum, row) => sum + row.utilization, 0) / capacitySnapshot.length
      : null;

    const safeValue = (value: number | null | undefined, format?: 'number' | 'percent') => {
      if (value == null || Number.isNaN(value)) {
        return { value: '—', format: undefined } as const;
      }
      return { value, format } as const;
    };

    const adherence = safeValue(planAdherence, 'percent');
    const utilization = safeValue(averageUtilization, 'percent');

    return [
      {
        key: 'plan-adherence',
        label: 'Plan Adherence',
        value: adherence.value,
        valueFormat: adherence.format,
        icon: <GaugeCircle className="h-5 w-5 text-sky-500" />,
      },
      {
        key: 'jobs-scheduled',
        label: 'Jobs Scheduled (this month)',
        value: chartTheme.numberFormat(total),
        icon: <CalendarCheck2 className="h-5 w-5 text-emerald-500" />,
      },
      {
        key: 'jobs-risk',
        label: 'Jobs at Risk',
        value: chartTheme.numberFormat(jobsAtRisk),
        icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      },
      {
        key: 'capacity-utilization',
        label: 'Avg. Utilization (this week)',
        value: utilization.value,
        valueFormat: utilization.format,
        icon: <ClipboardList className="h-5 w-5 text-indigo-500" />,
      },
    ];
  }, [requests, capacityData]);

  const hasScheduleData = Boolean(scheduleData && scheduleData.activeDays > 0);
  const hasCapacityData = capacityRows.length > 0;
  const hasKpis = kpiCards.length > 0;

  const renderMessage = (message: string, tone: 'info' | 'error' = 'info') => (
    <div
      className={`flex h-32 items-center justify-center rounded-2xl border text-sm ${
        tone === 'error' ? 'text-red-600 border-red-200 dark:border-red-700' : 'text-gray-500 border-dashed border-gray-200 dark:border-gray-700'
      }`}
      style={{ borderColor: tone === 'error' ? undefined : cardTheme.border() }}
    >
      {message}
    </div>
  );

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
          {isLoading && !hasKpis
            ? renderMessage('Loading planning metrics…')
            : hasKpis
              ? kpiCards.map((card) => (
                <StatCard
                  key={card.key}
                  label={card.label}
                  value={card.value}
                  valueFormat={card.valueFormat}
                  icon={card.icon}
                />
              ))
              : renderMessage('No planning metrics yet. Create requests to populate this view.')}
        </div>
        <div className="mt-6">
          {error
            ? renderMessage('Unable to load schedule data.', 'error')
            : hasScheduleData && calendarOption
              ? (
                <AsyncECharts option={calendarOption!} style={{ height: 300, width: '100%' }} notMerge lazyUpdate fallbackHeight={300} />
              )
              : renderMessage('No schedule entries found for this month.')}
        </div>
      </BaseCard>

      <BaseCard
        title="Capacity Snapshot"
        subtitle="Department utilization overview"
        headerRight={<CapacityToggle value={capacityView} onChange={setCapacityView} />}
      >
        <div className="space-y-5">
          {hasCapacityData
            ? capacityRows.map((row, index) => {
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
            })
            : renderMessage('No workloads scheduled for this time range.')}
        </div>
      </BaseCard>
    </div>
  );
}
