import React from 'react';
import ReactECharts from 'echarts-for-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import type { EChartsOption } from 'echarts';
import {
  ClipboardList,
  Factory,
  Gauge,
  Info,
  PackageSearch,
  TimerReset,
  Zap,
} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import BaseCard from '../../components/ui/BaseCard';
import { StatCard } from '../../components/shared';
import cardTheme from '../../styles/cardTheme';
import chartTheme from '../../styles/chartTheme';
import { clampLabel } from '../../shared/format';

type SunburstNode = {
  name: string;
  value: number;
  itemStyle?: { color?: string };
  children?: SunburstNode[];
};

type WipItem = {
  id: string;
  title: string;
  meta: string;
  badges?: string[];
};

type WipColumn = {
  key: string;
  title: string;
  accentClass: string;
  items: WipItem[];
};

const actions = [
  { key: 'new-plan', label: 'Create Production Plan', icon: <Factory className="w-4.5 h-4.5" /> },
  { key: 'monitor-output', label: 'Monitor Output', icon: <Gauge className="w-4.5 h-4.5" /> },
  { key: 'line-checklist', label: 'Line Checklist', icon: <ClipboardList className="w-4.5 h-4.5" /> },
];

const KPI_CARDS = [
  {
    key: 'oee',
    label: 'OEE %',
    value: 0.842,
    valueFormat: 'percent' as const,
    icon: <Gauge className="h-5 w-5 text-emerald-500" />,
    delta: { label: '+1.8 pts', trend: 'up' as const },
  },
  {
    key: 'throughput',
    label: 'Throughput Today (units)',
    value: 1680,
    valueFormat: 'number' as const,
    icon: <Zap className="h-5 w-5 text-sky-500" />,
    delta: { label: '+6%', trend: 'up' as const },
  },
  {
    key: 'downtime',
    label: 'Downtime (min)',
    value: 42,
    valueFormat: 'number' as const,
    icon: <TimerReset className="h-5 w-5 text-amber-500" />,
    delta: { label: '-9', trend: 'down' as const },
  },
  {
    key: 'scrap',
    label: 'Scrap Rate %',
    value: 0.031,
    valueFormat: 'percent' as const,
    icon: <PackageSearch className="h-5 w-5 text-rose-500" />,
    delta: { label: 'stable', trend: 'flat' as const },
  },
];

const SUNBURST_INFO = `What am I seeing?
Sunburst = hierarchical view. Inner rings are top categories, outer rings are sub-causes.
Use it to see which OEE losses (Availability/Performance/Quality) dominate, and which sub-causes contribute most.
Reuse idea: Swap the dataset to show Product Family → SKU → Line for mix analysis with the same component.`;

const SUNBURST_SOURCE: SunburstNode[] = [
  {
    name: 'Availability',
    value: 38,
    children: [
      {
        name: 'Setup & Changeover',
        value: 14,
        children: [
          { name: 'Format Change', value: 8 },
          { name: 'Sanitization', value: 6 },
        ],
      },
      {
        name: 'Unplanned Downtime',
        value: 16,
        children: [
          { name: 'Mechanical', value: 7 },
          { name: 'Electrical', value: 5 },
          { name: 'Material Starvation', value: 4 },
        ],
      },
      {
        name: 'Minor Stops',
        value: 8,
        children: [
          { name: 'Sensor Fault', value: 4 },
          { name: 'Jam Clear', value: 4 },
        ],
      },
    ],
  },
  {
    name: 'Performance',
    value: 34,
    children: [
      {
        name: 'Speed Loss',
        value: 14,
        children: [
          { name: 'Feed Variance', value: 7 },
          { name: 'Micro Stops', value: 7 },
        ],
      },
      {
        name: 'Idling & Minor Stops',
        value: 12,
        children: [
          { name: 'Buffer Wait', value: 6 },
          { name: 'Operator Adjustment', value: 6 },
        ],
      },
      {
        name: 'Reduced Speed',
        value: 8,
        children: [
          { name: 'Warmup', value: 4 },
          { name: 'Operator Pace', value: 4 },
        ],
      },
    ],
  },
  {
    name: 'Quality',
    value: 28,
    children: [
      {
        name: 'Scrap',
        value: 12,
        children: [
          { name: 'Dimensional', value: 6 },
          { name: 'Surface', value: 6 },
        ],
      },
      {
        name: 'Rework',
        value: 9,
        children: [
          { name: 'Assembly Rework', value: 5 },
          { name: 'Label Rework', value: 4 },
        ],
      },
      {
        name: 'Start-up Losses',
        value: 7,
        children: [
          { name: 'Warmup Waste', value: 4 },
          { name: 'Calibration', value: 3 },
        ],
      },
    ],
  },
];

const WIP_COLUMNS: WipColumn[] = [
  {
    key: 'queued',
    title: 'Queued',
    accentClass: 'text-sky-600 dark:text-sky-400',
    items: [
      { id: 'q1', title: 'Batch 1145 — Caps', meta: 'Line 2 • starts 11:30', badges: ['Changeover', 'Materials OK'] },
      { id: 'q2', title: 'Batch 1148 — Bottles', meta: 'Line 3 • starts 13:00', badges: ['PP', 'Palletized'] },
    ],
  },
  {
    key: 'in-process',
    title: 'In Process',
    accentClass: 'text-amber-600 dark:text-amber-400',
    items: [
      { id: 'ip1', title: 'Batch 1142 — Sachets', meta: 'Line 1 • 62% complete', badges: ['QA hold: none'] },
      { id: 'ip2', title: 'Batch 1143 — Syrup', meta: 'Line 5 • 48% complete', badges: ['OEE 81%', 'Temp Stable'] },
    ],
  },
  {
    key: 'done',
    title: 'Done',
    accentClass: 'text-emerald-600 dark:text-emerald-400',
    items: [
      { id: 'd1', title: 'Batch 1140 — Tablets', meta: 'Line 4 • closed 07:45', badges: ['Released', 'Yield 98%'] },
      { id: 'd2', title: 'Batch 1141 — Powder', meta: 'Line 2 • closed 09:20', badges: ['Audit Ready'] },
    ],
  },
];

const SUNBURST_INFO_DELAY = 120;

function lightenWithWhite(hex: string, amount: number) {
  const cleaned = hex.replace('#', '');
  const bigint = cleaned.length === 3
    ? parseInt(cleaned.split('').map((c) => c + c).join(''), 16)
    : parseInt(cleaned.padEnd(6, '0'), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  const blend = (channel: number) => Math.round(channel + (255 - channel) * amount);
  const toHex = (value: number) => value.toString(16).padStart(2, '0');
  return `#${toHex(blend(r))}${toHex(blend(g))}${toHex(blend(b))}`;
}

function colorizeSunburst(nodes: SunburstNode[], palette: string[]): SunburstNode[] {
  return nodes.map((node, index) => {
    const baseColor = palette[index % palette.length];
    const children = node.children ?? [];
    const childCount = Math.max(children.length, 1);
    return {
      ...node,
      itemStyle: { color: baseColor },
      children: children.map((child, childIndex) => {
        const childColor = lightenWithWhite(baseColor, 0.18 + (childIndex / childCount) * 0.22);
        const grandChildren = child.children ?? [];
        const grandCount = Math.max(grandChildren.length, 1);
        return {
          ...child,
          itemStyle: { color: childColor },
          children: grandChildren.map((leaf, leafIndex) => ({
            ...leaf,
            itemStyle: {
              color: lightenWithWhite(baseColor, 0.35 + (leafIndex / grandCount) * 0.28),
            },
          })),
        };
      }),
    };
  });
}

function InfoButton({ text }: { text: string }) {
  return (
    <Tooltip.Provider delayDuration={SUNBURST_INFO_DELAY}>
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

export default function ProductionPage() {
  const mode = cardTheme.runtimeMode();
  const palette = chartTheme.palette;
  const sunburstData = React.useMemo(
    () => colorizeSunburst(SUNBURST_SOURCE, palette),
    [palette],
  );
  const sunburstTotal = React.useMemo(
    () => sunburstData.reduce((sum, node) => sum + node.value, 0),
    [sunburstData],
  );

  const sunburstOption = React.useMemo<EChartsOption>(() => {
    const base = chartTheme.applyBaseOption(mode);
    const textColor = chartTheme.textColor(mode);
    const tooltipBg = chartTheme.tooltipBackground(mode);
    const axisColor = chartTheme.axisLabel(mode);

    return {
      ...base,
      tooltip: {
        trigger: 'item',
        backgroundColor: tooltipBg,
        borderWidth: 0,
        textStyle: { color: textColor, fontSize: 12 },
        formatter: (params: any) => {
          const treePath = params?.treePathInfo ?? [];
          const names = treePath
            .map((entry: { name?: string }) => entry?.name)
            .filter((name: string | undefined) => name && name.length)
            .map((name: string) => name)
            .join(' › ');
          const share = sunburstTotal > 0 ? (params.value / sunburstTotal) * 100 : 0;
          const formattedShare = `${chartTheme.numberFormat(share, 1)}% of OEE loss`;
          return `<div style="font-weight:600;margin-bottom:4px;">${names}</div><div style="font-size:12px;color:${axisColor};">${formattedShare}</div>`;
        },
      },
      series: [
        {
          type: 'sunburst',
          radius: ['16%', '100%'],
          data: sunburstData,
          label: {
            rotate: 'radial',
            color: textColor,
            fontSize: 12,
            formatter: (params: any) => clampLabel(params.name, 18),
          },
          levels: [
            {},
            {
              r0: '16%',
              r: '40%',
              itemStyle: { borderWidth: 2, borderColor: '#ffffff33' },
              label: { fontSize: 13, fontWeight: 600 },
            },
            {
              r0: '40%',
              r: '72%',
              itemStyle: { borderWidth: 2, borderColor: '#ffffff22' },
              label: { fontSize: 12 },
            },
            {
              r0: '72%',
              r: '100%',
              label: { fontSize: 11 },
            },
          ],
          emphasis: { focus: 'ancestor' },
          nodeClick: 'focus',
        },
      ],
      color: chartTheme.palette,
    } as EChartsOption;
  }, [mode, sunburstData, sunburstTotal]);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <PageHeader
        title="Production"
        searchPlaceholder="Search production lines, batches, and KPIs"
        menuItems={actions}
      />

      <BaseCard
        title="Production Overview"
        subtitle="KPI snapshot and OEE loss composition"
        headerRight={<InfoButton text={SUNBURST_INFO} />}
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
          <ReactECharts option={sunburstOption} style={{ height: 300, width: '100%' }} notMerge lazyUpdate />
        </div>
      </BaseCard>

      <BaseCard
        title="WIP Snapshot"
        subtitle="Queued versus in-process and completed batches"
      >
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: cardTheme.gap }}>
          {WIP_COLUMNS.map((column) => (
            <div key={column.key} className="space-y-4">
              <div className={`text-sm font-semibold uppercase tracking-wide ${column.accentClass}`}>
                {column.title}
              </div>
              <div className="space-y-4">
                {column.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border bg-white/70 px-4 py-3 shadow-sm backdrop-blur-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70"
                    style={{ borderColor: cardTheme.border() }}
                  >
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.title}</div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.meta}</div>
                    {item.badges && item.badges.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.badges.map((badge) => (
                          <span
                            key={badge}
                            className="rounded-full border px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:border-gray-700 dark:text-gray-300"
                            style={{ borderColor: cardTheme.border() }}
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </BaseCard>
    </div>
  );
}
