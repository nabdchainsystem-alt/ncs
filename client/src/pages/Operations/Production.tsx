import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import type { EChartsOption } from 'echarts';
import { formatDistanceToNow, parseISO } from 'date-fns';
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
import { useOrders } from '../../features/orders/hooks';
import { AsyncECharts } from '../../components/charts/AsyncECharts';
import type { OrderRecord } from '../../features/orders/facade';

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

const SUNBURST_INFO = `What am I seeing?
Sunburst = hierarchical view. Inner rings are top categories, outer rings are sub-causes.
Use it to see which OEE losses (Availability/Performance/Quality) dominate, and which sub-causes contribute most.
Reuse idea: Swap the dataset to show Product Family → SKU → Line for mix analysis with the same component.`;

const SUNBURST_INFO_DELAY = 120;

const normalizeStatus = (status?: string | null): string => {
  if (!status) return 'Pending';
  const value = status.trim().toLowerCase();
  if (value === 'pending' || value === 'open') return 'Pending';
  if (value === 'in progress' || value === 'progress') return 'In Progress';
  if (value === 'approved' || value === 'completed' || value === 'closed') return 'Completed';
  if (value === 'rejected' || value === 'canceled' || value === 'cancelled') return 'Canceled';
  if (value === 'onhold' || value === 'on-hold') return 'On Hold';
  return status.trim();
};

const safeParseDate = (value?: string | null): Date | null => {
  if (!value) return null;
  try {
    const parsed = parseISO(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
};

const formatRelative = (value?: string | null): string => {
  const date = safeParseDate(value ?? undefined);
  if (!date) return 'No date provided';
  try {
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return date.toISOString();
  }
};

const buildSunburstFromOrders = (orders: OrderRecord[]): SunburstNode[] => {
  const statusMap = new Map<string, Map<string, number>>();
  orders.forEach((order) => {
    const status = normalizeStatus(order.status);
    const vendor = order.vendor?.name?.trim() || 'Unassigned';
    const vendorMap = statusMap.get(status) ?? new Map<string, number>();
    vendorMap.set(vendor, (vendorMap.get(vendor) ?? 0) + 1);
    statusMap.set(status, vendorMap);
  });

  return Array.from(statusMap.entries()).map(([status, vendorMap]) => ({
    name: status,
    value: Array.from(vendorMap.values()).reduce((sum, count) => sum + count, 0),
    children: Array.from(vendorMap.entries()).map(([vendor, count]) => ({ name: vendor, value: count })),
  }));
};

const buildWipColumns = (orders: OrderRecord[]): WipColumn[] => {
  const columns: Record<'queued' | 'in-process' | 'done', WipItem[]> = {
    queued: [],
    'in-process': [],
    done: [],
  };

  orders.forEach((order) => {
    const status = normalizeStatus(order.status);
    const target = status === 'Completed'
      ? 'done'
      : status === 'In Progress'
        ? 'in-process'
        : 'queued';

    const vendorLabel = order.vendor?.name ?? 'Unassigned vendor';
    const metaLabel = order.expectedDelivery
      ? `Expected ${formatRelative(order.expectedDelivery)}`
      : `Created ${formatRelative(order.createdAt)}`;
    const badges: string[] = [];
    if (order.currency && order.totalValue != null) {
      badges.push(`${order.currency} ${chartTheme.numberFormat(order.totalValue)}`);
    }
    if (order.request?.orderNo) {
      badges.push(`Req ${order.request.orderNo}`);
    }

    columns[target].push({
      id: String(order.id),
      title: `${order.orderNo} — ${vendorLabel}`,
      meta: metaLabel,
      badges,
    });
  });

  return [
    {
      key: 'queued',
      title: 'Queued',
      accentClass: 'text-sky-600 dark:text-sky-400',
      items: columns.queued,
    },
    {
      key: 'in-process',
      title: 'In Process',
      accentClass: 'text-amber-600 dark:text-amber-400',
      items: columns['in-process'],
    },
    {
      key: 'done',
      title: 'Completed',
      accentClass: 'text-emerald-600 dark:text-emerald-400',
      items: columns.done,
    },
  ];
};

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
  const { data: orderData, isLoading, error } = useOrders();
  const orders = orderData ?? [];

  const metrics = React.useMemo(() => {
    const total = orders.length;
    if (!total) {
      return {
        total: 0,
        onTimeRatio: null as number | null,
        inProgress: 0,
        overdue: 0,
        averageValue: null as number | null,
        averageCurrency: undefined as string | undefined,
      };
    }

    const now = new Date();
    let valueSum = 0;
    let valueCount = 0;
    let detectedCurrency: string | undefined;

    const normalizeCurrency = (entry: OrderRecord) => entry.currency?.trim() || undefined;

    const overdue = orders.filter((order) => {
      const expected = safeParseDate(order.expectedDelivery ?? undefined);
      if (!expected) return false;
      const status = normalizeStatus(order.status);
      return expected.getTime() < now.getTime() && status !== 'Completed';
    }).length;

    const inProgress = orders.filter((order) => normalizeStatus(order.status) === 'In Progress').length;

    orders.forEach((order) => {
      if (typeof order.totalValue === 'number') {
        valueSum += order.totalValue;
        valueCount += 1;
        if (!detectedCurrency) detectedCurrency = normalizeCurrency(order);
      }
    });

    const averageValue = valueCount > 0 ? valueSum / valueCount : null;
    const completed = orders.filter((order) => normalizeStatus(order.status) === 'Completed').length;
    const onTimeRatio = total > 0 ? (total - overdue) / total : null;

    return {
      total,
      onTimeRatio,
      inProgress,
      overdue,
      averageValue,
      averageCurrency: detectedCurrency,
    };
  }, [orders]);

  type KpiCard = {
    key: string;
    label: string;
    value: number | string;
    valueFormat?: 'number' | 'percent';
    icon: React.ReactNode;
  };

  const kpiCards: KpiCard[] = React.useMemo(() => {
    const toDisplayNumber = (value: number) => chartTheme.numberFormat(value);
    const onTime = metrics.onTimeRatio != null ? metrics.onTimeRatio : null;
    const avgValue = metrics.averageValue;
    const currency = metrics.averageCurrency ?? '';

    return [
      {
        key: 'on-time',
        label: 'On-time completion',
        value: onTime != null ? onTime : '—',
        valueFormat: onTime != null ? 'percent' : undefined,
        icon: <Gauge className="h-5 w-5 text-emerald-500" />,
      },
      {
        key: 'active-orders',
        label: 'Active orders',
        value: toDisplayNumber(metrics.total),
        icon: <Zap className="h-5 w-5 text-sky-500" />,
      },
      {
        key: 'overdue-orders',
        label: 'Overdue orders',
        value: toDisplayNumber(metrics.overdue),
        icon: <TimerReset className="h-5 w-5 text-amber-500" />,
      },
      {
        key: 'average-value',
        label: 'Average order value',
        value: avgValue != null ? `${currency ? `${currency} ` : ''}${toDisplayNumber(avgValue)}` : '—',
        icon: <PackageSearch className="h-5 w-5 text-rose-500" />,
      },
    ];
  }, [metrics]);

  const sunburstSource = React.useMemo(() => buildSunburstFromOrders(orders), [orders]);
  const sunburstData = React.useMemo(() => colorizeSunburst(sunburstSource, palette), [sunburstSource, palette]);
  const sunburstTotal = React.useMemo(
    () => sunburstData.reduce((sum, node) => sum + node.value, 0),
    [sunburstData],
  );

  const sunburstOption = React.useMemo<EChartsOption | null>(() => {
    if (!sunburstData.length) return null;
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
          const formattedShare = `${chartTheme.numberFormat(share, 1)}% of orders`;
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

  const wipColumns = React.useMemo(() => buildWipColumns(orders), [orders]);

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
          {isLoading
            ? renderMessage('Loading production metrics…')
            : kpiCards.map((card) => (
              <StatCard
                key={card.key}
                label={card.label}
                value={card.value}
                valueFormat={card.valueFormat}
                icon={card.icon}
              />
            ))}
        </div>
        <div className="mt-6">
          {error
            ? renderMessage('Unable to load order composition.', 'error')
            : sunburstOption
              ? <AsyncECharts option={sunburstOption} style={{ height: 300, width: '100%' }} notMerge lazyUpdate fallbackHeight={300} />
              : renderMessage('No order distribution data yet.')}
        </div>
      </BaseCard>

      <BaseCard
        title="WIP Snapshot"
        subtitle="Queued versus in-process and completed batches"
      >
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: cardTheme.gap }}>
          {wipColumns.map((column) => (
            <div key={column.key} className="space-y-4">
              <div className={`text-sm font-semibold uppercase tracking-wide ${column.accentClass}`}>
                {column.title}
              </div>
              <div className="space-y-4">
                {column.items.length
                  ? column.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border bg-white/70 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/70"
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
                  ))
                  : renderMessage('No work-in-progress items.', column.key === 'queued' ? 'info' : 'info')}
              </div>
            </div>
          ))}
        </div>
      </BaseCard>
    </div>
  );
}
