import React from 'react';
import type { EChartsOption } from 'echarts';
import { AsyncECharts } from '../../components/charts/AsyncECharts';
import * as Tooltip from '@radix-ui/react-tooltip';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileWarning,
  Info,
  Microscope,
  ShieldCheck,
} from 'lucide-react';
import PageHeader, { type PageHeaderItem } from '../../components/layout/PageHeader';
import BaseCard from '../../components/ui/BaseCard';
import cardTheme from '../../styles/cardTheme';
import chartTheme from '../../styles/chartTheme';
import { StatCard } from '../../components/shared';
import type { StatCardProps } from '../../components/shared/StatCard';

type InspectionSample = {
  id: string;
  line: string;
  shift: string;
  supplierScore: number;
  severity: number;
  reworkTime: number;
};

type NcLogEntry = {
  id: string;
  date: string;
  ref: string;
  area: string;
  severity: 'Critical' | 'Major' | 'Minor';
  owner: string;
};

type KpiConfig = {
  label: string;
  value: number;
  icon: React.ReactNode;
  valueFormat?: StatCardProps['valueFormat'];
  valueFractionDigits?: number;
  delta?: StatCardProps['delta'];
};

const actions: PageHeaderItem[] = [
  { key: 'open-audit', label: 'Open Audit', icon: <ShieldCheck className="w-4.5 h-4.5" /> },
  { key: 'log-test', label: 'Log Lab Test', icon: <Microscope className="w-4.5 h-4.5" /> },
  { key: 'quality-checklist', label: 'Quality Checklist', icon: <ClipboardCheck className="w-4.5 h-4.5" /> },
];

const kpis: KpiConfig[] = [
  {
    label: 'First Pass Yield %',
    value: 0.972,
    valueFormat: 'percent' as const,
    icon: <CheckCircle2 className="h-5 w-5" />,
    delta: { value: 0.008, format: 'percent' as const, trend: 'up' as const },
  },
  {
    label: 'Defect Rate (ppm)',
    value: 312,
    valueFormat: 'number' as const,
    icon: <AlertTriangle className="h-5 w-5" />,
    delta: { label: '-12 ppm', trend: 'down' as const },
  },
  {
    label: 'Open NCs (Non-Conformances)',
    value: 18,
    valueFormat: 'number' as const,
    icon: <FileWarning className="h-5 w-5" />,
    delta: { label: '+3 vs last week', trend: 'up' as const },
  },
  {
    label: 'Avg Resolution Time (days)',
    value: 3.6,
    valueFormat: 'number' as const,
    valueFractionDigits: 1,
    icon: <Clock className="h-5 w-5" />,
    delta: { label: '-0.4 days', trend: 'down' as const },
  },
];

const inspectionSamples: InspectionSample[] = [
  { id: 'QA-101', line: 'Line A', shift: 'Day', supplierScore: 94, severity: 1, reworkTime: 3.4 },
  { id: 'QA-102', line: 'Line A', shift: 'Night', supplierScore: 82, severity: 3, reworkTime: 6.8 },
  { id: 'QA-103', line: 'Line B', shift: 'Day', supplierScore: 88, severity: 2, reworkTime: 4.1 },
  { id: 'QA-104', line: 'Line C', shift: 'Day', supplierScore: 76, severity: 4, reworkTime: 12.2 },
  { id: 'QA-105', line: 'Line B', shift: 'Night', supplierScore: 91, severity: 2, reworkTime: 5.3 },
  { id: 'QA-106', line: 'Line C', shift: 'Night', supplierScore: 68, severity: 5, reworkTime: 18.5 },
  { id: 'QA-107', line: 'Line A', shift: 'Swing', supplierScore: 97, severity: 1, reworkTime: 2.4 },
  { id: 'QA-108', line: 'Line B', shift: 'Swing', supplierScore: 84, severity: 3, reworkTime: 8.9 },
  { id: 'QA-109', line: 'Line C', shift: 'Day', supplierScore: 72, severity: 4, reworkTime: 15.1 },
  { id: 'QA-110', line: 'Line A', shift: 'Day', supplierScore: 89, severity: 2, reworkTime: 4.8 },
  { id: 'QA-111', line: 'Line B', shift: 'Night', supplierScore: 79, severity: 4, reworkTime: 13.6 },
  { id: 'QA-112', line: 'Line C', shift: 'Swing', supplierScore: 65, severity: 5, reworkTime: 20.4 },
];

const ncLog: NcLogEntry[] = [
  { id: 'nc-1', date: '2024-03-18', ref: 'NC-4821', area: 'Filling Line', severity: 'Critical', owner: 'Layla Hassan' },
  { id: 'nc-2', date: '2024-03-17', ref: 'NC-4819', area: 'Packaging', severity: 'Major', owner: 'Imran Qureshi' },
  { id: 'nc-3', date: '2024-03-17', ref: 'NC-4815', area: 'Incoming QA', severity: 'Minor', owner: 'Sara Demir' },
  { id: 'nc-4', date: '2024-03-16', ref: 'NC-4810', area: 'Blow Molding', severity: 'Critical', owner: 'Noor Rahman' },
  { id: 'nc-5', date: '2024-03-16', ref: 'NC-4806', area: 'Warehouse QA', severity: 'Major', owner: 'Farah Malik' },
  { id: 'nc-6', date: '2024-03-15', ref: 'NC-4801', area: 'Supplier Audit', severity: 'Minor', owner: 'Omar Khalid' },
  { id: 'nc-7', date: '2024-03-15', ref: 'NC-4799', area: 'Labeling', severity: 'Major', owner: 'Maya Singh' },
  { id: 'nc-8', date: '2024-03-14', ref: 'NC-4795', area: 'Sterilization', severity: 'Critical', owner: 'Hassan Ali' },
];

const parallelInfoText = `What am I seeing?\nParallel Coordinates plot shows many inspections at once across multiple dimensions (Line, Shift, SupplierScore, Severity, ReworkTime).\nEach polyline is a sample; brushing on an axis highlights matching items to reveal patterns (e.g., high severity clustered on a certain line or shift).\nReuse idea: Use the same component for supplier audits or process capability by swapping dimensions.`;

function infoButton(text: string) {
  const segments = text.split('\n');
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
            {segments.map((segment, index) => (
              <span key={`${index}-${segment}`} className="block">
                {segment}
                {index < segments.length - 1 ? <br /> : null}
              </span>
            ))}
            <Tooltip.Arrow className="fill-white dark:fill-gray-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

function useParallelCoordinatesOption(samples: InspectionSample[]): EChartsOption {
  return React.useMemo(() => {
    const mode = cardTheme.runtimeMode();
    const base = chartTheme.applyBaseOption(mode);
    const baseGrid = Array.isArray(base.grid) ? base.grid[0] : base.grid;

    const lines = Array.from(new Set(samples.map((s) => s.line)));
    const shifts = Array.from(new Set(samples.map((s) => s.shift)));

    const dimensions = [
      { key: 'line', name: 'Line', type: 'category' as const, data: lines },
      { key: 'shift', name: 'Shift', type: 'category' as const, data: shifts },
      { key: 'supplierScore', name: 'SupplierScore', type: 'value' as const, min: 50, max: 100 },
      { key: 'severity', name: 'Severity', type: 'value' as const, min: 1, max: 5 },
      { key: 'reworkTime', name: 'ReworkTime', type: 'value' as const, min: 0, max: 24 },
    ];

    const data = samples.map((item) => [
      item.line,
      item.shift,
      item.supplierScore,
      item.severity,
      item.reworkTime,
    ]);

    const palette = [chartTheme.brandPrimary, chartTheme.accentTeal, chartTheme.brandSecondary];

    return {
      ...base,
      tooltip: {
        trigger: 'item',
        backgroundColor: chartTheme.tooltipBackground(mode),
        borderWidth: 0,
        textStyle: { color: chartTheme.textColor(mode), fontSize: 12 },
        formatter: (params: any) => {
          const values: (string | number)[] = params.data || [];
          if (!values.length) return '';
          const rows = dimensions.map((dim, index) => {
            const raw = values[index];
            if (dim.type === 'value' && typeof raw === 'number') {
              const formatted = dim.key === 'supplierScore'
                ? `${chartTheme.numberFormat(raw, 0)} / 100`
                : dim.key === 'reworkTime'
                  ? `${chartTheme.numberFormat(raw, 1)} h`
                  : chartTheme.numberFormat(raw, 0);
              return `${dim.name}: ${formatted}`;
            }
            return `${dim.name}: ${raw}`;
          });
          return rows.join('<br/>');
        },
      },
      parallelAxis: dimensions.map((dim, index) => ({
        dim: index,
        name: dim.name,
        type: dim.type,
        data: dim.type === 'category' ? dim.data : undefined,
        min: dim.type === 'value' ? dim.min : undefined,
        max: dim.type === 'value' ? dim.max : undefined,
        nameLocation: 'middle',
        nameGap: 28,
        axisLine: { lineStyle: { color: chartTheme.neutralGrid(mode) } },
        axisTick: { lineStyle: { color: chartTheme.neutralGrid(mode) } },
        axisLabel: {
          color: chartTheme.axisLabel(mode),
          overflow: 'truncate',
          width: 72,
        },
      })),
      parallelAxisDefault: {
        realtime: true,
        nameTextStyle: {
          color: chartTheme.axisLabel(mode),
          fontSize: 12,
        },
        axisLine: { lineStyle: { color: chartTheme.neutralGrid(mode) } },
        axisLabel: {
          color: chartTheme.axisLabel(mode),
          overflow: 'truncate',
          width: 72,
        },
        areaSelectStyle: {
          width: 16,
          opacity: 0.18,
        },
      },
      parallel: {
        left: baseGrid?.left ?? 48,
        right: baseGrid?.right ?? 32,
        top: 48,
        bottom: baseGrid?.bottom ?? 48,
      },
      animation: true,
      visualMap: {
        type: 'continuous',
        dimension: 3,
        min: 1,
        max: 5,
        calculable: true,
        inRange: {
          color: [palette[0], palette[1], palette[2]],
        },
        orient: 'horizontal',
        left: 'center',
        bottom: 8,
        textStyle: { color: chartTheme.axisLabel(mode), fontSize: 11 },
      },
      series: [
        {
          type: 'parallel',
          coordinateSystem: 'parallel',
          lineStyle: {
            width: 2,
            opacity: 0.75,
          },
          emphasis: {
            lineStyle: { width: 4, opacity: 0.95 },
          },
          smooth: false,
          data,
          inactiveOpacity: 0.08,
          activeOpacity: 0.85,
        },
      ],
    } satisfies EChartsOption;
  }, [samples]);
}

function SeverityPill({ tone, children }: { tone: 'Critical' | 'Major' | 'Minor'; children: React.ReactNode }) {
  const palette: Record<'Critical' | 'Major' | 'Minor', string> = {
    Critical: 'bg-rose-50 text-rose-700 border border-rose-200',
    Major: 'bg-amber-50 text-amber-700 border border-amber-200',
    Minor: 'bg-sky-50 text-sky-700 border border-sky-200',
  };
  return <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${palette[tone]}`}>{children}</span>;
}

function QualityKpisBlock() {
  const option = useParallelCoordinatesOption(inspectionSamples);
  return (
    <BaseCard
      title="Quality KPIs"
      subtitle="Line performance and inspection patterns"
      headerRight={infoButton(parallelInfoText)}
      className="space-y-6"
    >
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

      <div>
        <div className="mb-3 text-[15px] font-semibold text-gray-900 dark:text-gray-100">
          Parallel Coordinates — Inspection Samples
        </div>
        <AsyncECharts style={{ height: 300, width: '100%' }} option={option} notMerge lazyUpdate fallbackHeight={300} />
      </div>
    </BaseCard>
  );
}

function NcLogTable() {
  return (
    <BaseCard
      title="NC Log"
      subtitle="Latest non-conformance records"
      className="space-y-4"
    >
      <div className="overflow-hidden rounded-2xl border" style={{ borderColor: cardTheme.border() }}>
        <table className="min-w-full divide-y" style={{ borderColor: cardTheme.border() }}>
          <thead className="bg-gray-50/70 text-left text-[12px] font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-900/60 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Ref</th>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">Action owner</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: cardTheme.border() }}>
            {ncLog.map((entry) => (
              <tr key={entry.id} className="text-sm text-gray-700 dark:text-gray-300">
                <td className="px-4 py-3 whitespace-nowrap text-[13px] text-gray-600 dark:text-gray-400">{entry.date}</td>
                <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">{entry.ref}</td>
                <td className="px-4 py-3">{entry.area}</td>
                <td className="px-4 py-3"><SeverityPill tone={entry.severity}>{entry.severity}</SeverityPill></td>
                <td className="px-4 py-3">{entry.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </BaseCard>
  );
}

export default function QualityPage() {
  const menuItems = React.useMemo<PageHeaderItem[]>(() => actions, []);
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <PageHeader
        title="Quality"
        menuItems={menuItems}
        searchPlaceholder="Search audits, checkpoints, and lab tests"
      />

      <QualityKpisBlock />

      <NcLogTable />
    </div>
  );
}
