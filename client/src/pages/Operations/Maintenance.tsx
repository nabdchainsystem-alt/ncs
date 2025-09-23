import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { AsyncECharts } from '../../components/charts/AsyncECharts';
import type { EChartsOption } from 'echarts';
import {
  AlertTriangle,
  CalendarClock,
  ClipboardCheck,
  Gauge,
  Info,
  Timer,
  Wrench,
} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import BaseCard from '../../components/ui/BaseCard';
import { StatCard } from '../../components/shared';
import cardTheme from '../../styles/cardTheme';
import chartTheme from '../../styles/chartTheme';
import { clampLabel } from '../../shared/format';

type MaintenanceFlow = {
  failure: string;
  asset: string;
  action: string;
  outcome: string;
  value: number;
};

type NodeCategory = 'failure' | 'asset' | 'action' | 'outcome';

type SankeyNode = {
  name: string;
  value: number;
  type: NodeCategory;
  itemStyle: { color: string }; // ensures consistent palette per column
};

type SankeyLink = {
  source: string;
  target: string;
  value: number;
  paths: Array<{ sequence: string; value: number }>;
};

type EquipmentStatus = {
  id: string;
  name: string;
  area: string;
  lastService: string;
  nextDue: string;
  status: 'healthy' | 'due-soon' | 'overdue';
  statusNote: string;
};

const maintenanceActions = [
  { key: 'new-work-order', label: 'New Work Order', icon: <Wrench className="w-4.5 h-4.5" /> },
  { key: 'schedule-maintenance', label: 'Schedule Maintenance', icon: <CalendarClock className="w-4.5 h-4.5" /> },
  { key: 'inspection-report', label: 'Inspection Report', icon: <ClipboardCheck className="w-4.5 h-4.5" /> },
];

const maintenanceFlows: MaintenanceFlow[] = [
  { failure: 'Electrical Fault', asset: 'Krones Filler #4', action: 'Emergency Fix', outcome: 'Restored', value: 8 },
  { failure: 'Electrical Fault', asset: 'Krones Filler #4', action: 'Part Replacement', outcome: 'Restored', value: 5 },
  { failure: 'Electrical Fault', asset: 'Cooling Tower #2', action: 'Emergency Fix', outcome: 'Temporary Fix', value: 3 },
  { failure: 'Mechanical Wear', asset: 'SMI Packer', action: 'Part Replacement', outcome: 'Restored', value: 6 },
  { failure: 'Mechanical Wear', asset: 'SMI Packer', action: 'Scheduled PM', outcome: 'Restored', value: 4 },
  { failure: 'Mechanical Wear', asset: 'Depalletizer', action: 'Emergency Fix', outcome: 'Awaiting Part', value: 2 },
  { failure: 'Hydraulic Leak', asset: 'Labeler #2', action: 'Emergency Fix', outcome: 'Temporary Fix', value: 3 },
  { failure: 'Hydraulic Leak', asset: 'Labeler #2', action: 'Scheduled PM', outcome: 'Restored', value: 2 },
  { failure: 'Sensor Drift', asset: 'Vision Inspector', action: 'Remote Reset', outcome: 'Restored', value: 4 },
  { failure: 'Sensor Drift', asset: 'Vision Inspector', action: 'Calibration', outcome: 'Restored', value: 3 },
  { failure: 'Power Supply', asset: 'Air Compressor', action: 'Emergency Fix', outcome: 'Temporary Fix', value: 2 },
  { failure: 'Power Supply', asset: 'Air Compressor', action: 'Part Replacement', outcome: 'Awaiting Part', value: 1 },
];

const equipmentStatuses: EquipmentStatus[] = [
  {
    id: 'krones-filler',
    name: 'Krones Filler #4',
    area: 'Bottling Line 3',
    lastService: '12 Jul 2024',
    nextDue: '18 Sep 2024',
    status: 'healthy',
    statusNote: 'Next PM in 36 days',
  },
  {
    id: 'smi-packer',
    name: 'SMI Packer',
    area: 'Packaging Hall',
    lastService: '28 Jul 2024',
    nextDue: '01 Sep 2024',
    status: 'due-soon',
    statusNote: 'Due in 12 days',
  },
  {
    id: 'cooling-tower',
    name: 'Cooling Tower #2',
    area: 'Utilities',
    lastService: '04 Jun 2024',
    nextDue: '06 Aug 2024',
    status: 'overdue',
    statusNote: 'Overdue by 2 days',
  },
  {
    id: 'vision-inspector',
    name: 'Vision Inspector',
    area: 'Quality Lab',
    lastService: '05 Aug 2024',
    nextDue: '22 Sep 2024',
    status: 'healthy',
    statusNote: 'Next calibration in 40 days',
  },
  {
    id: 'labeler-2',
    name: 'Labeler #2',
    area: 'Packaging Hall',
    lastService: '19 Jul 2024',
    nextDue: '24 Aug 2024',
    status: 'due-soon',
    statusNote: 'Due in 4 days',
  },
  {
    id: 'air-compressor',
    name: 'Air Compressor',
    area: 'Utilities',
    lastService: '18 May 2024',
    nextDue: '20 Jul 2024',
    status: 'overdue',
    statusNote: 'Awaiting part delivery',
  },
];

const categoryColors: Record<NodeCategory, string> = {
  failure: '#F97316',
  asset: '#3B82F6',
  action: '#8B5CF6',
  outcome: '#22C55E',
};

const sankeyExplanation = `What am I seeing?\nThis Sankey shows how failures flow across maintenance steps:\nFailure Type → Asset → Action → Outcome.\nIt highlights concentration points (thicker links) so you can spot which failure categories hit which assets most,\nwhat actions are typically taken, and how they end (restored / temporary fix / awaiting part).\nReuse idea: For Quality, map Defect Type → Station → Disposition; For Production, map Material → Line → Step.`;

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
            <div className="whitespace-pre-line">{text}</div>
            <Tooltip.Arrow className="fill-white dark:fill-gray-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

function prepareSankeyData(flows: MaintenanceFlow[]): { nodes: SankeyNode[]; links: SankeyLink[] } {
  const nodeMeta = new Map<string, NodeCategory>();
  const nodeTotals = new Map<string, number>();
  const linkMap = new Map<string, SankeyLink>();

  flows.forEach((flow) => {
    const { failure, asset, action, outcome, value } = flow;
    const sequence = `${failure} → ${asset} → ${action} → ${outcome}`;

    const registerNode = (name: string, type: NodeCategory) => {
      nodeMeta.set(name, type);
      nodeTotals.set(name, (nodeTotals.get(name) ?? 0) + value);
    };

    registerNode(failure, 'failure');
    registerNode(asset, 'asset');
    registerNode(action, 'action');
    registerNode(outcome, 'outcome');

    const pairs: Array<[string, string]> = [
      [failure, asset],
      [asset, action],
      [action, outcome],
    ];

    pairs.forEach(([source, target]) => {
      const key = `${source}|||${target}`;
      const existing = linkMap.get(key);
      if (existing) {
        existing.value += value;
        existing.paths.push({ sequence, value });
      } else {
        linkMap.set(key, {
          source,
          target,
          value,
          paths: [{ sequence, value }],
        });
      }
    });
  });

  const nodes: SankeyNode[] = Array.from(nodeTotals.entries()).map(([name, total]) => {
    const type = nodeMeta.get(name) ?? 'failure';
    return {
      name,
      value: total,
      type,
      itemStyle: { color: categoryColors[type] },
    };
  });

  const links: SankeyLink[] = Array.from(linkMap.values()).map((link) => {
    // Aggregate duplicate sequences to keep tooltip concise
    const sequenceMap = new Map<string, number>();
    link.paths.forEach((entry) => {
      sequenceMap.set(entry.sequence, (sequenceMap.get(entry.sequence) ?? 0) + entry.value);
    });
    return {
      ...link,
      paths: Array.from(sequenceMap.entries()).map(([sequence, value]) => ({ sequence, value })),
    };
  });

  return { nodes, links };
}

function buildSankeyOption(
  nodes: SankeyNode[],
  links: SankeyLink[],
  mode: ReturnType<typeof cardTheme.runtimeMode>,
): EChartsOption {
  const base = chartTheme.applyBaseOption(mode);

  return {
    ...base,
    tooltip: {
      trigger: 'item',
      backgroundColor: chartTheme.tooltipBackground(mode),
      borderRadius: 8,
      padding: [10, 12],
      textStyle: {
        fontSize: 12,
      },
      confine: true,
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          const total = chartTheme.numberFormat(params.value ?? 0, 0);
          return `<strong>${params.name}</strong><br/>Total volume: ${total}`;
        }
        if (params.dataType === 'edge') {
          const data = params.data as SankeyLink;
          const total = chartTheme.numberFormat(params.value ?? 0, 0);
          const sequences = data.paths
            .sort((a, b) => b.value - a.value)
            .slice(0, 3)
            .map((entry) => `${entry.sequence} (${chartTheme.numberFormat(entry.value, 0)})`)
            .join('<br/>');
          if (sequences) {
            return `<strong>${data.source} → ${data.target}</strong><br/>Total volume: ${total}<br/><br/>${sequences}`;
          }
          return `<strong>${data.source} → ${data.target}</strong><br/>Total volume: ${total}`;
        }
        return '';
      },
    },
    series: [
      {
        type: 'sankey',
        data: nodes,
        links,
        top: 40,
        bottom: 40,
        left: 48,
        right: 24,
        nodeGap: 16,
        nodeWidth: 18,
        nodeAlign: 'justify',
        draggable: false,
        focusNodeAdjacency: 'allEdges',
        orient: 'horizontal',
        emphasis: { focus: 'adjacency' },
        label: {
          color: chartTheme.axisLabel(mode),
          fontSize: 12,
          overflow: 'truncate',
          formatter: (params: { name: string }) => clampLabel(params.name, 12),
        },
        lineStyle: {
          color: 'source',
          opacity: 0.55,
          curveness: 0.5,
        },
        itemStyle: {
          borderWidth: 1,
          borderColor: chartTheme.neutralGrid(mode),
        },
        levels: [
          { depth: 0, itemStyle: { color: categoryColors.failure } },
          { depth: 1, itemStyle: { color: categoryColors.asset } },
          { depth: 2, itemStyle: { color: categoryColors.action } },
          { depth: 3, itemStyle: { color: categoryColors.outcome } },
        ],
      },
    ],
  } as EChartsOption;
}

const statusPalette = {
  healthy: { label: 'Healthy', dot: '#22C55E', bg: '#ecfdf5', text: '#047857' },
  'due-soon': { label: 'Due soon', dot: '#F97316', bg: '#fef3c7', text: '#b45309' },
  overdue: { label: 'Overdue', dot: '#EF4444', bg: '#fee2e2', text: '#b91c1c' },
} as const;

export default function MaintenancePage() {
  const [filter, setFilter] = React.useState<'all' | 'due-soon' | 'overdue'>('all');
  const mode = cardTheme.runtimeMode();

  const { nodes, links } = React.useMemo(() => prepareSankeyData(maintenanceFlows), []);
  const sankeyOption = React.useMemo(() => buildSankeyOption(nodes, links, mode), [nodes, links, mode]);

  const filteredAssets = React.useMemo(() => {
    if (filter === 'all') return equipmentStatuses;
    return equipmentStatuses.filter((asset) => asset.status === filter);
  }, [filter]);

  const sankeyEvents = React.useMemo(() => ({
    click: (params: any) => {
      // eslint-disable-next-line no-console
      console.log('Sankey selection', params);
    },
  }), []);

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
      <PageHeader
        title="Maintenance"
        searchPlaceholder="Search assets, work orders, and schedules"
        menuItems={maintenanceActions}
      />

      <BaseCard title="Maintenance Overview" subtitle="Key reliability KPIs and failure pathways">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12" style={{ gap: cardTheme.gap }}>
          <StatCard
            className="xl:col-span-3"
            label="MTBF (hrs)"
            value={86}
            valueFormat="number"
            icon={<Gauge className="h-5 w-5 text-emerald-500" />}
            delta={{ label: '+5.4% vs target', trend: 'up' }}
          />
          <StatCard
            className="xl:col-span-3"
            label="MTTR (hrs)"
            value={3.6}
            valueFormat="number"
            valueFractionDigits={1}
            icon={<Timer className="h-5 w-5 text-rose-500" />}
            delta={{ label: 'Above threshold', trend: 'down' }}
          />
          <StatCard
            className="xl:col-span-3"
            label="PM Compliance %"
            value={0.91}
            valueFormat="percent"
            valueFractionDigits={1}
            icon={<ClipboardCheck className="h-5 w-5 text-sky-500" />}
            delta={{ label: '+3.2 pts week-over-week', trend: 'up' }}
          />
          <StatCard
            className="xl:col-span-3"
            label="Critical Assets Down"
            value={2}
            valueFormat="number"
            icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
            delta={{ label: '1 resolved today', trend: 'up' }}
          />
        </div>

        <BaseCard
          className="mt-8"
          title="Failure Flow Sankey"
          subtitle="How failures move through assets, actions, and outcomes"
          headerRight={<InfoPopover text={sankeyExplanation} />}
        >
          <div className="mt-2">
            <AsyncECharts
              notMerge
              lazyUpdate
              style={{ height: 300, width: '100%' }}
              option={sankeyOption}
              onEvents={sankeyEvents}
            />
          </div>
        </BaseCard>
      </BaseCard>

      <BaseCard title="Equipment Health" subtitle="Key assets status">
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'due-soon', 'overdue'] as const).map((key) => {
            const active = filter === key;
            const pill = cardTheme.pill(active ? 'info' : 'neutral');
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${active ? 'shadow-sm' : ''}`}
                style={{ background: pill.bg, color: pill.text }}
              >
                {key === 'all' ? 'All' : key === 'due-soon' ? 'Due Soon' : 'Overdue'}
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3" style={{ gap: cardTheme.gap }}>
          {filteredAssets.map((asset) => {
            const palette = statusPalette[asset.status];
            return (
              <div
                key={asset.id}
                className="flex flex-col rounded-2xl border bg-white px-5 py-4 shadow-sm dark:bg-gray-900"
                style={{ borderColor: cardTheme.border() }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{asset.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{asset.area}</div>
                  </div>
                  <span
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ background: palette.bg, color: palette.text }}
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: palette.dot }} />
                    {palette.label}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 dark:text-gray-400">Last</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{asset.lastService}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 dark:text-gray-400">Next</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{asset.nextDue}</span>
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">{asset.statusNote}</div>
                </div>
              </div>
            );
          })}
        </div>
      </BaseCard>
    </div>
  );
}
