import React from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  PackagePlus,
  Plus,
  ShieldCheck,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudFog,
  Megaphone,
  MoonStar,
  Snowflake,
  Sun,
  Trophy,
  ShoppingCart,
  Upload,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import BaseCard from '../components/ui/BaseCard';
import WarehouseKpiMovementsBlock from '../components/inventory/WarehouseKpiMovementsBlock';
import WarehouseCompositionBlock from '../components/inventory/WarehouseCompositionBlock';
import RequestsTasksCard from '../components/requests/TasksCard';
import FinancialOverviewBlock from '../components/finance/FinancialOverviewBlock';
import PageHeader from '../components/layout/PageHeader';
import PieInsightCard from '../components/charts/PieInsightCard';
import { StatCard, BarChartCard, RecentActivityFeed } from '../components/shared';
import { useApiHealth } from '../context/ApiHealthContext';
import {
  useOverviewKpis,
  useOverviewOrdersByDept,
  useRequestsByDeptBar,
  useRequestsStatusPie,
  useOrdersStatusPie,
  useOrdersCategoryPie,
  useVendorKpis,
  useVendorMonthlySpend,
  useVendorTopSpend,
  useVendorStatusMix,
  useLiveWeather,
} from '../features/overview/hooks';
import type { WeatherIconKey, MoonPhaseKey } from '../features/overview/weather';
import type {
  OverviewOrdersByDept,
  OverviewOrdersSummary,
  OverviewRequestsSummary,
  RequestsByDeptBar,
  RequestsStatusDatum,
  OrdersStatusDatum,
  OrdersCategoryDatum,
  VendorKpisSummary,
  VendorMonthlySpend,
  VendorTopSpendDatum,
  VendorStatusMixDatum,
} from '../features/overview/facade';
import { useRequests } from '../features/requests/hooks';
import { useAllInventoryItems } from '../features/inventory/hooks';
import { usePurchaseOrdersStore, refreshPurchaseOrders } from './orders/purchaseOrdersStore';
import { useGeoWeather } from '../stores/useGeoWeather';

type OverviewTopBlockProps = {
  requests: OverviewRequestsSummary | null;
  orders: OverviewOrdersSummary | null;
  loadingRequests: boolean;
  loadingOrders: boolean;
  ordersByDept: OverviewOrdersByDept | null;
  loadingOrdersByDept: boolean;
};

type DailyBriefProps = {
  now: Date;
  city: string;
  weather: {
    temperature: string;
    condition: string;
    isNight: boolean;
    iconKey: WeatherIconKey;
    high?: string;
    low?: string;
    humidity?: string;
    precipitationNow?: string;
    precipitationLabel?: string;
    moonPhase: {
      key: MoonPhaseKey;
      label: string;
      value: number;
    };
    moonrise?: string;
    moonset?: string;
    sunrise?: string;
    sunset?: string;
  };
  match: {
    teams: string;
    score: string;
    status: string;
  };
  headline: {
    title: string;
    source: string;
  };
  loading?: boolean;
  weatherLoading?: boolean;
};

const WEATHER_ICON_MAP: Record<WeatherIconKey, { day: LucideIcon; night: LucideIcon }> = {
  clear: { day: Sun, night: MoonStar },
  partly: { day: CloudSun, night: MoonStar },
  cloud: { day: Cloud, night: Cloud },
  rain: { day: CloudRain, night: CloudRain },
  storm: { day: CloudLightning, night: CloudLightning },
  snow: { day: Snowflake, night: Snowflake },
  fog: { day: CloudFog, night: CloudFog },
};

const DEFAULT_WEATHER_ICON = { day: Cloud, night: Cloud } satisfies Record<'day' | 'night', LucideIcon>;
const DEFAULT_LOCATION = {
  latitude: 24.7136,
  longitude: 46.6753,
  label: 'Riyadh',
} as const;

function SunOrb() {
  return (
    <div className="celestial-orb sun-orb" aria-hidden>
      <Sun className="sun-core" />
    </div>
  );
}

function MoonOrb({ phase }: { phase: DailyBriefProps['weather']['moonPhase'] }) {
  const normalized = ((phase.value % 1) + 1) % 1;
  const illumination = normalized <= 0.5 ? normalized * 2 : (1 - normalized) * 2; // 0 (new) → 1 (full)
  const direction = normalized <= 0.5 ? 1 : -1;
  const highlightShift = direction * (1 - illumination) * 42;
  const shadowShift = highlightShift * -0.55;
  const style = {
    '--moon-highlight-shift': `${highlightShift}%`,
    '--moon-highlight-opacity': `${0.3 + illumination * 0.55}`,
    '--moon-shadow-shift': `${shadowShift}%`,
    '--moon-shadow-strength': `${0.45 + (1 - illumination) * 0.4}`,
    '--moon-crater-opacity': `${0.18 + illumination * 0.35}`,
  } as React.CSSProperties;

  return (
    <div className="celestial-orb moon-orb" data-phase={phase.key} aria-hidden style={style}>
      <div className="moon-craters" />
    </div>
  );
}

function CelestialCard({
  weather,
  isNight,
}: {
  weather: DailyBriefProps['weather'];
  isNight: boolean;
}) {
  const cardClass = clsx('celestial-card', isNight ? 'celestial-card-night' : 'celestial-card-day');
  if (isNight) {
    return (
      <div className={cardClass}>
        <div className="celestial-card-content celestial-card-content-night">
          <span className="celestial-title">Moon Phase</span>
          <MoonOrb phase={weather.moonPhase} />
          <span className="celestial-subtext celestial-subtext-night">{weather.moonPhase.label}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <div className="celestial-card-content celestial-card-content-day">
        <span className="celestial-title">Sun Cycle</span>
        <SunOrb />
        <div className="celestial-subtext celestial-subtext-day grid w-full grid-cols-2 gap-3 text-xs">
          <div>
            <span className="block text-[10px] uppercase tracking-[0.32em] text-slate-400">Sunrise</span>
            <span className="text-slate-600">{weather.sunrise ?? '—'}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-[0.32em] text-slate-400">Sunset</span>
            <span className="text-slate-600">{weather.sunset ?? '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DailyBriefBlock({
  now,
  city,
  weather,
  match,
  headline,
  loading = false,
  weatherLoading = false,
}: DailyBriefProps) {
  const formattedDate = React.useMemo(
    () =>
      now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    [now]
  );

  const timeParts = React.useMemo(() => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    const buckets: Record<string, string> = {};
    for (const part of formatter.formatToParts(now)) {
      if (part.type === 'literal') continue;
      buckets[part.type] = part.value;
    }
    return {
      hour: buckets.hour ?? '--',
      minute: buckets.minute ?? '--',
      second: buckets.second ?? '--',
      dayPeriod: (buckets.dayPeriod ?? '').toUpperCase(),
    };
  }, [now]);

  const timeDisplay = `${timeParts.hour}:${timeParts.minute}`;
  const newsTitle = loading ? 'Refreshing your daily snapshot…' : headline.title;
  const isNight = weather.isNight;
  const iconPair = WEATHER_ICON_MAP[weather.iconKey] ?? DEFAULT_WEATHER_ICON;
  const WeatherIcon = iconPair[isNight ? 'night' : 'day'];

  const panelTheme = React.useMemo(() => {
    if (weather.isNight) {
      return {
        container:
          'daily-brief-night text-slate-100 shadow-[0_20px_45px_rgba(10,15,30,0.55)] border border-transparent',
        base:
          'daily-brief-card daily-brief-night-base rounded-3xl border border-slate-700/40 bg-slate-900/50 backdrop-blur-sm text-slate-100 shadow-[0_22px_40px_rgba(2,8,23,0.6)]',
        tile:
          'daily-brief-card daily-brief-night-tile rounded-3xl border border-slate-800/30 bg-slate-900/45 backdrop-blur-sm text-slate-100 shadow-[0_16px_30px_rgba(2,8,23,0.5)]',
        accent:
          'inline-flex items-center gap-2 self-start rounded-full border border-sky-400/50 bg-sky-500/20 px-3 py-1 text-xs font-medium text-sky-100 shadow-[0_10px_25px_rgba(56,189,248,0.35)]',
        title: 'text-xs font-semibold uppercase tracking-[0.32em] text-slate-300',
        body: 'text-sm text-slate-200',
        meta: 'text-xs text-slate-400',
      } as const;
    }
    return {
      container:
        'daily-brief-day text-slate-900 shadow-[0_16px_40px_rgba(15,23,42,0.05)] border border-slate-200',
      base:
        'daily-brief-card rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-[0_18px_40px_rgba(15,23,42,0.06)]',
      tile:
        'daily-brief-card rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-[0_12px_28px_rgba(15,23,42,0.05)]',
      accent:
        'inline-flex items-center gap-2 self-start rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-600 shadow-[0_6px_14px_rgba(56,189,248,0.15)]',
      title: 'text-xs font-semibold uppercase tracking-[0.32em] text-slate-500',
      body: 'text-sm text-slate-500',
      meta: 'text-xs text-slate-500',
    } as const;
  }, [weather.isNight]);

  return (
    <section className={clsx('relative rounded-[28px] border', panelTheme.container)}>
      <div className="relative p-5 lg:p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className={clsx(panelTheme.base, 'flex flex-col justify-between gap-5 p-6 lg:p-6.5')}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className={clsx('text-xs uppercase tracking-[0.32em]', weather.isNight ? 'text-slate-400' : 'text-slate-500')}>
                  Daily Brief
                </span>
                <div className={clsx('mt-3 text-2xl font-semibold', weather.isNight ? 'text-white' : 'text-slate-900')}>
                  {city ? city : '—'}
                </div>
                <div className={clsx('text-sm', weather.isNight ? 'text-slate-300' : 'text-slate-500')}>{formattedDate}</div>
              </div>
              <span
                className={clsx(
                  'daily-brief-status inline-flex h-2 w-2 shrink-0 rounded-full',
                  weather.isNight
                    ? 'bg-sky-400 shadow-[0_0_10px_rgba(125,211,252,0.7)]'
                    : 'bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]'
                )}
                aria-hidden
              />
            </div>
            <div className="flex items-end gap-4 sm:gap-6">
              <div
                className={clsx(
                  'text-6xl font-semibold tracking-tight tabular-nums sm:text-7xl',
                  weather.isNight ? 'text-white' : 'text-slate-900'
                )}
              >
                {timeDisplay}
              </div>
              <div className="flex flex-col items-start leading-none">
                <span
                  className={clsx(
                    'text-2xl font-light tabular-nums sm:text-3xl',
                    weather.isNight ? 'text-slate-300' : 'text-slate-400'
                  )}
                >
                  {timeParts.second}
                </span>
                <span
                  className={clsx(
                    'mt-1 text-xs font-semibold tracking-[0.36em]',
                    weather.isNight ? 'text-slate-400' : 'text-slate-500'
                  )}
                >
                  {timeParts.dayPeriod || '—'}
                </span>
              </div>
            </div>
            <div className={clsx('flex flex-wrap items-center gap-3 text-sm', weather.isNight ? 'text-slate-300' : 'text-slate-500')}>
              <span>{newsTitle}</span>
              <span className={clsx('text-xs uppercase tracking-[0.24em]', weather.isNight ? 'text-slate-400' : 'text-slate-400')}>
                {headline.source}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className={clsx(panelTheme.tile, 'flex flex-col justify-between gap-4 p-5')}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={panelTheme.title}>Current Weather</span>
                  <div className={clsx('mt-3 text-4xl font-semibold tabular-nums', weather.isNight ? 'text-white' : 'text-slate-900')}>
                    {weatherLoading ? '—°' : weather.temperature}
                  </div>
                  <div className={clsx('mt-1', panelTheme.body)}>
                    {weatherLoading ? 'Fetching live weather' : weather.condition}
                  </div>
                </div>
                <WeatherIcon
                  className={clsx('h-12 w-12 drop-shadow-sm', weather.isNight ? 'text-sky-300' : 'text-sky-400')}
                />
              </div>
              <div className={clsx('flex flex-wrap gap-3 text-xs font-medium', weather.isNight ? 'text-slate-300' : 'text-slate-500')}>
                <span>High {weather.high ?? '—°'}</span>
                <span>Low {weather.low ?? '—°'}</span>
                {weather.humidity ? <span>Humidity {weather.humidity}</span> : null}
              </div>
              {weather.precipitationLabel ? (
                <div className={panelTheme.accent}>
                  <CloudRain className="h-4 w-4" />
                  <span>{weather.precipitationLabel}</span>
                  {weather.precipitationNow ? (
                    <span className={weather.isNight ? 'text-sky-200' : 'text-sky-500'}>{weather.precipitationNow}</span>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className={clsx(panelTheme.tile, 'p-5')}>
              <CelestialCard weather={weather} isNight={isNight} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function OverviewTopBlock({
  requests,
  orders,
  loadingRequests,
  loadingOrders,
  ordersByDept,
  loadingOrdersByDept,
}: OverviewTopBlockProps) {
  const requestTotal = requests?.total ?? 0;
  const orderTotal = orders?.total ?? 0;
  const urgentRequests = React.useMemo(() => {
    const entry = requests?.priorityCounts?.find(
      (item) => String(item.name).toLowerCase() === 'high'
    );
    return entry?.value ?? 0;
  }, [requests]);

  const twelveMonthSpend = orders?.twelveMonthSpend ?? 0;

  const completedOrdersByDept = React.useMemo(() => {
    if (
      !ordersByDept ||
      !Array.isArray(ordersByDept.categories) ||
      !Array.isArray(ordersByDept.series)
    )
      return [];
    const primarySeries = ordersByDept.series[0];
    return ordersByDept.categories.map((label, index) => ({
      label,
      value: Number(primarySeries?.data?.[index] ?? 0),
    }));
  }, [ordersByDept]);

  const requestValue: number | string = loadingRequests ? '—' : requestTotal;
  const orderValue: number | string = loadingOrders ? '—' : orderTotal;
  const urgentValue: number | string = loadingRequests ? '—' : urgentRequests;
  const spendValue: number | string = loadingOrders ? '—' : twelveMonthSpend;

  return (
    <section
      className="rounded-2xl border bg-white shadow-card p-6"
      aria-label="Overview – KPIs and Monthly Expenses"
    >
      <div className="text-[16px] font-semibold text-gray-900">Requests & Orders</div>
      <p className="mt-1 mb-4 text-sm text-gray-500">
        Headline metrics across requests, orders, and spend
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Requests"
          value={requestValue}
          valueFormat={typeof requestValue === 'number' ? 'number' : undefined}
          icon={<ClipboardList size={20} />}
          delta={null}
        />
        <StatCard
          label="Orders"
          value={orderValue}
          valueFormat={typeof orderValue === 'number' ? 'number' : undefined}
          icon={<ShoppingCart size={20} />}
          delta={null}
        />
        <StatCard
          label="Urgent Requests"
          value={urgentValue}
          valueFormat={typeof urgentValue === 'number' ? 'number' : undefined}
          icon={<AlertTriangle size={20} />}
          delta={null}
        />
        <StatCard
          label="12-Month Spend"
          value={spendValue}
          valueFormat={typeof spendValue === 'number' ? 'sar' : undefined}
          valueFractionDigits={1}
          icon={<Banknote size={20} />}
          delta={null}
        />
      </div>
      <div className="mt-6" role="img" aria-label="Monthly Expenses for the current year">
        <div className="relative">
          <BarChartCard
            title="Completed Orders by Department"
            subtitle="Departmental totals"
            data={completedOrdersByDept}
            height={300}
            loading={loadingOrdersByDept}
            valueFormat="sar"
            axisValueSuffix=" SAR"
            tooltipValueSuffix=" SAR"
          />
          <button
            type="button"
            aria-label="More options"
            className="absolute right-6 top-6 text-gray-400"
          >
            •••
          </button>
        </div>
      </div>
    </section>
  );
}

type RequestsBlockProps = {
  loading: boolean;
  statusData: RequestsStatusDatum[];
  loadingStatus: boolean;
  deptData: RequestsByDeptBar | null;
  loadingDept: boolean;
  onStatusClick: (status: string) => void;
  onDeptClick: (department: string) => void;
};

function RequestsBlock({
  loading,
  statusData,
  loadingStatus,
  deptData,
  loadingDept,
  onStatusClick,
  onDeptClick,
}: RequestsBlockProps) {
  const pieStatusData = React.useMemo(
    () =>
      statusData.map((entry) => ({
        name: entry.name === 'OnHold' ? 'On Hold' : entry.name,
        value: entry.value,
      })),
    [statusData]
  );

  const deptPieData = React.useMemo(() => {
    const categories = deptData?.categories ?? [];
    const series = deptData?.series?.[0]?.data ?? [];
    return categories.map((name, index) => ({
      name: (name || 'Unassigned').trim(),
      value: Number(series[index] ?? 0),
    }));
  }, [deptData]);

  return (
    <section className="rounded-2xl border bg-white shadow-card p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold px-1">
        Requests
      </div>
      <p className="px-1 text-sm text-gray-500 mb-2">Status distribution and top departments</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <PieInsightCard
          title="Requests Status"
          subtitle="New / Approved / On Hold / Rejected / Closed"
          data={pieStatusData}
          loading={loading || loadingStatus}
          description="Share of requests by current status. Use this split to track how quickly approvals move through the pipeline."
          onSelect={(datum) => datum?.name && onStatusClick(datum.name)}
        />
        <PieInsightCard
          title="Requests by Department"
          subtitle="Departments"
          data={deptPieData}
          loading={loading || loadingDept}
          description="Share of requests split by department"
          onSelect={(datum) => {
            const label = datum?.name?.trim();
            if (label) onDeptClick(label);
          }}
        />
      </div>
    </section>
  );
}

type OrdersBlockProps = {
  data: OverviewOrdersSummary | null;
  loading: boolean;
  statusData: OrdersStatusDatum[];
  loadingStatus: boolean;
  categoryData: OrdersCategoryDatum[];
  loadingCategory: boolean;
  onStatusClick: (status: string) => void;
  onCategoryClick: (category: string) => void;
};

function OrdersBlock({
  data,
  loading,
  statusData,
  loadingStatus,
  categoryData,
  loadingCategory,
  onStatusClick,
  onCategoryClick,
}: OrdersBlockProps) {
  const statusPieData = React.useMemo(
    () =>
      statusData.map((entry) => ({
        name: entry.name === 'OnHold' ? 'On Hold' : entry.name,
        value: entry.value,
      })),
    [statusData]
  );

  const categoryPieData = React.useMemo(
    () =>
      categoryData.map((entry) => ({
        name: entry.name || 'Unassigned',
        value: entry.value,
      })),
    [categoryData]
  );

  return (
    <section className="rounded-2xl border bg-white shadow-card p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold px-1">Orders</div>
      <p className="px-1 text-sm text-gray-500 mb-2">Snapshot of order status and category mix</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <PieInsightCard
          title="Orders Status"
          subtitle="Pending / Completed / On Hold / New"
          data={statusPieData}
          loading={loading || loadingStatus}
          description="Distribution of purchase orders by lifecycle stage. Track pending items for potential fulfillment delays."
          onSelect={(datum) => datum?.name && onStatusClick(datum.name)}
        />
        <PieInsightCard
          title="Orders Category Breakdown"
          subtitle="Spend by category"
          data={categoryPieData}
          loading={loading || loadingCategory}
          description="Completed orders grouped by primary spend category or request department when categories are missing."
          onSelect={(datum) => datum?.name && onCategoryClick(datum.name)}
        />
      </div>
    </section>
  );
}

type VendorsBlockProps = {
  kpis: VendorKpisSummary | null;
  loadingKpis: boolean;
  monthlySpend: VendorMonthlySpend | null;
  loadingMonthly: boolean;
  topSpend: VendorTopSpendDatum[];
  loadingTopSpend: boolean;
  statusMix: VendorStatusMixDatum[];
  loadingStatusMix: boolean;
  onVendorClick: (name: string) => void;
  onTierClick: (tier: string) => void;
};

function VendorsBlock({
  kpis,
  loadingKpis,
  monthlySpend,
  loadingMonthly,
  topSpend,
  loadingTopSpend,
  statusMix,
  loadingStatusMix,
  onVendorClick,
  onTierClick,
}: VendorsBlockProps) {
  const stats = React.useMemo(() => {
    const snapshot: VendorKpisSummary = kpis ?? {
      active: 0,
      newThisMonth: 0,
      avgTrustScore: 0,
      totalSpend: 0,
    };

    return [
      {
        label: 'Active Vendors',
        value: snapshot.active,
        icon: <Users size={20} />,
        format: 'number' as const,
      },
      {
        label: 'New Vendors (This Month)',
        value: snapshot.newThisMonth,
        icon: <Plus size={20} />,
        format: 'number' as const,
      },
      {
        label: 'Average Trust Score',
        value: snapshot.avgTrustScore,
        icon: <ShieldCheck size={20} />,
        format: 'number' as const,
      },
      {
        label: 'Total Vendor Spend (SAR)',
        value: snapshot.totalSpend,
        icon: <Banknote size={20} />,
        format: 'sar' as const,
      },
    ];
  }, [kpis]);

  const monthlyBarData = React.useMemo(() => {
    const categories = monthlySpend?.categories ?? [];
    const primarySeries = monthlySpend?.series?.[0]?.data ?? [];
    return categories.map((label, index) => ({
      label,
      value: Number(primarySeries[index] ?? 0),
    }));
  }, [monthlySpend]);

  const topSpendPieData = React.useMemo(
    () => (topSpend ?? []).map((entry) => ({ name: entry.name, value: entry.value })),
    [topSpend],
  );

  const statusPieData = React.useMemo(
    () => (statusMix ?? []).map((entry) => ({ name: entry.name, value: entry.value })),
    [statusMix],
  );

  return (
    <section className="rounded-2xl border bg-white shadow-card p-6" aria-label="Vendors KPIs and Analytics">
      <div className="mb-4">
        <div className="text-[16px] font-semibold text-gray-900">Vendors</div>
        <p className="mt-1 text-sm text-gray-500">
          Snapshot of vendor performance, spend concentration, and portfolio health
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={loadingKpis ? '—' : stat.value}
            valueFormat={stat.format}
            valueFractionDigits={stat.label === 'Average Trust Score' ? 1 : undefined}
            icon={stat.icon}
            delta={null}
            className="h-full"
          />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BarChartCard
          title="Monthly Vendor Spend"
          subtitle="Spend (SAR)"
          data={monthlyBarData}
          height={300}
          loading={loadingMonthly || loadingKpis}
          emptyMessage="No spend captured for this year"
          tooltipValueSuffix=" SAR"
        />
        <PieInsightCard
          title="Top Vendors by Spend"
          subtitle="Top contributors"
          data={topSpendPieData}
          loading={loadingTopSpend}
          description="Spend distribution across leading suppliers. Drill in to manage vendor concentration."
          onSelect={(datum) => datum?.name && onVendorClick(datum.name)}
          emptyMessage="No vendor spend data"
        />
      </div>
      <div className="mt-6">
        <PieInsightCard
          title="Vendor Status Mix"
          subtitle="Performing / Watchlist / Critical / Other"
          data={statusPieData}
          loading={loadingStatusMix}
          description="Portfolio mix by trust tier. Monitor watchlist and critical vendors to mitigate risk."
          onSelect={(datum) => datum?.name && onTierClick(datum.name)}
          emptyMessage="No vendors available"
          height={280}
        />
      </div>
    </section>
  );
}

// header actions moved into PageHeader menuItems

function OverviewShell() {
  const { healthy } = useApiHealth();
  const navigate = useNavigate();
  const {
    coords: geoCoords,
    place: geoPlace,
    weather: geoWeather,
    status: geoStatus,
    error: geoError,
    refresh: refreshGeo,
  } = useGeoWeather();
  const [now, setNow] = React.useState(() => new Date());
  const {
    data: overviewData,
    isLoading: loadingOverview,
    error: overviewError,
  } = useOverviewKpis();
  const { data: ordersByDeptData, isLoading: loadingOrdersByDept } = useOverviewOrdersByDept();
  const { data: requestsStatusData, isLoading: loadingRequestsStatus } = useRequestsStatusPie();
  const { data: requestsDeptData, isLoading: loadingRequestsDept } = useRequestsByDeptBar();
  const { data: ordersStatusData, isLoading: loadingOrdersStatus } = useOrdersStatusPie();
  const { data: ordersCategoryData, isLoading: loadingOrdersCategory } = useOrdersCategoryPie();
  const currentYear = React.useMemo(() => new Date().getFullYear(), []);
  const { data: vendorKpisData, isLoading: loadingVendorKpis } = useVendorKpis();
  const { data: vendorMonthlyData, isLoading: loadingVendorMonthly } = useVendorMonthlySpend(currentYear);
  const { data: vendorTopSpendData, isLoading: loadingVendorTopSpend } = useVendorTopSpend();
  const { data: vendorStatusMixData, isLoading: loadingVendorStatusMix } = useVendorStatusMix();
  const latitude = geoCoords && Number.isFinite(geoCoords.lat) ? geoCoords.lat : DEFAULT_LOCATION.latitude;
  const longitude = geoCoords && Number.isFinite(geoCoords.lon) ? geoCoords.lon : DEFAULT_LOCATION.longitude;
  const { data: liveWeather, isLoading: loadingWeather } = useLiveWeather({
    latitude,
    longitude,
  });

  const isWeatherLoading =
    loadingWeather || geoStatus === 'locating' || geoStatus === 'fetching' || geoStatus === 'idle';

  React.useEffect(() => {
    if (geoStatus !== 'idle') return;
    void refreshGeo();
  }, [geoStatus, refreshGeo]);

  React.useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const { data: requestRecords } = useRequests();
  const { orders: purchaseOrdersForTasks, loading: purchaseOrdersLoading } = usePurchaseOrdersStore();
  const { data: inventoryItemsForTasks = [] } = useAllInventoryItems();

  React.useEffect(() => {
    if (!healthy) return;
    if (!purchaseOrdersForTasks.length && !purchaseOrdersLoading) {
      refreshPurchaseOrders().catch(() => undefined);
    }
  }, [healthy, purchaseOrdersForTasks.length, purchaseOrdersLoading]);

  const requests = healthy ? overviewData.requests : null;
  const orders = healthy ? overviewData.orders : null;
  const ordersByDept = healthy ? ordersByDeptData : null;
  const vendorKpis = healthy ? vendorKpisData : null;
  const vendorMonthly = healthy ? vendorMonthlyData : null;
  const vendorTopSpend = healthy ? vendorTopSpendData : [];
  const vendorStatusMix = healthy ? vendorStatusMixData : [];
  const loading = loadingOverview || !healthy;
  const requestsTotal = requests?.total ?? 0;
  const ordersTotal = orders?.total ?? 0;
  const urgentRequestsCount = React.useMemo(() => {
    if (!requests?.priorityCounts) return 0;
    const entry = requests.priorityCounts.find(
      (item) => String(item.name).toLowerCase() === 'high'
    );
    return entry?.value ?? 0;
  }, [requests]);
  const resolvedCity = React.useMemo(() => {
    const cityName = liveWeather?.city?.trim();
    if (cityName && cityName.length > 1) return cityName;
    const placeCity = geoPlace?.city?.trim();
    if (placeCity && placeCity.length > 1) return placeCity;
    const placeRegion = geoPlace?.region?.trim();
    if (placeRegion && placeRegion.length > 1) return placeRegion;
    const placeCountry = geoPlace?.country?.trim();
    if (placeCountry && placeCountry.length > 1) return placeCountry;
    return DEFAULT_LOCATION.label;
  }, [liveWeather?.city, geoPlace?.city, geoPlace?.region, geoPlace?.country]);

  const weatherDisplay = React.useMemo(() => {
    const toDegrees = (value?: number) =>
      typeof value === 'number' ? `${Math.round(value)}°` : undefined;
    const toTime = (iso?: string) => {
      if (!iso) return undefined;
      const date = new Date(iso);
      if (Number.isNaN(date.getTime())) return undefined;
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    };

    const fallbackIsNight = (() => {
      const hours = now.getHours();
      return hours < 6 || hours >= 18;
    })();

    if (liveWeather) {
      return {
        temperature: toDegrees(liveWeather.temperatureC) ?? '—°',
        condition: liveWeather.condition,
        isNight: liveWeather.isNight,
        iconKey: liveWeather.iconKey,
        high: toDegrees(liveWeather.highC),
        low: toDegrees(liveWeather.lowC),
        humidity:
          typeof liveWeather.humidity === 'number'
            ? `${Math.round(liveWeather.humidity)}%`
            : undefined,
        precipitationNow:
          typeof liveWeather.precipitationMm === 'number'
            ? `${liveWeather.precipitationMm.toFixed(1)} mm`
            : undefined,
        precipitationLabel: liveWeather.precipDescription,
        moonPhase: liveWeather.moonPhase,
        moonrise: toTime(liveWeather.moonriseIso),
        moonset: toTime(liveWeather.moonsetIso),
        sunrise: toTime(liveWeather.sunriseIso),
        sunset: toTime(liveWeather.sunsetIso),
      } satisfies DailyBriefProps['weather'];
    }

    if (geoWeather) {
      const temp = toDegrees(geoWeather.temperature) ?? '—°';
      const high = toDegrees(geoWeather.high);
      const low = toDegrees(geoWeather.low);
      const isNight = geoWeather.isDay === true ? false : geoWeather.isDay === false ? true : fallbackIsNight;
      return {
        temperature: temp,
        condition: geoWeather.description,
        isNight,
        iconKey: 'cloud' as WeatherIconKey,
        high,
        low,
        humidity: undefined,
        precipitationNow: undefined,
        precipitationLabel: undefined,
        moonPhase: { key: 'new', label: 'New Moon', value: 0 },
        moonrise: undefined,
        moonset: undefined,
        sunrise: undefined,
        sunset: undefined,
      } satisfies DailyBriefProps['weather'];
    }

    if (geoStatus === 'error') {
      return {
        temperature: '—°',
        condition: geoError ?? 'Weather unavailable',
        isNight: fallbackIsNight,
        iconKey: 'cloud' as WeatherIconKey,
        high: undefined,
        low: undefined,
        humidity: undefined,
        precipitationNow: undefined,
        precipitationLabel: undefined,
        moonPhase: { key: 'new', label: 'New Moon', value: 0 },
        moonrise: undefined,
        moonset: undefined,
        sunrise: undefined,
        sunset: undefined,
      } satisfies DailyBriefProps['weather'];
    }

    return {
      temperature: '—°',
      condition: isWeatherLoading ? 'Fetching live weather' : 'Weather unavailable',
      isNight: fallbackIsNight,
      iconKey: 'cloud' as WeatherIconKey,
      high: undefined,
      low: undefined,
      humidity: undefined,
      precipitationNow: undefined,
      precipitationLabel: undefined,
      moonPhase: { key: 'new', label: 'New Moon', value: 0 },
      moonrise: undefined,
      moonset: undefined,
      sunrise: undefined,
      sunset: undefined,
    } satisfies DailyBriefProps['weather'];
  }, [liveWeather, geoWeather, geoStatus, geoError, isWeatherLoading, now]);

  const dailyBriefLoading = loading;

  const dailyBrief = React.useMemo(
    () => ({
      city: resolvedCity,
      weather: weatherDisplay,
      match: dailyBriefLoading
        ? { teams: 'Requests vs Orders', score: '—', status: 'Benchmarking performance' }
        : {
            teams: 'Requests vs Orders',
            score: `${requestsTotal} - ${ordersTotal}`,
            status: 'Updated moments ago',
          },
      headline: dailyBriefLoading
        ? { title: 'Refreshing daily brief…', source: 'Control Room' }
        : urgentRequestsCount > 0
        ? {
            title: `${urgentRequestsCount} urgent requests need attention`,
            source: 'Requests Room',
          }
        : {
            title: 'No urgent requests at the moment',
            source: 'Requests Room',
          },
    }),
    [dailyBriefLoading, ordersTotal, requestsTotal, urgentRequestsCount, resolvedCity, weatherDisplay]
  );
  const statusSelection = React.useCallback(
    (statusName: string) => {
      const name = statusName.replace(/\s+/g, '');
      navigate(`/requests?status=${encodeURIComponent(name)}`);
    },
    [navigate]
  );

  const deptSelection = React.useCallback(
    (department: string) => {
      const trimmed = department.trim();
      navigate(trimmed ? `/requests?dept=${encodeURIComponent(trimmed)}` : '/requests');
    },
    [navigate]
  );

  const orderStatusSelection = React.useCallback(
    (statusName: string) => {
      const normalized = statusName.replace(/\s+/g, '');
      navigate(`/orders?status=${encodeURIComponent(normalized)}`);
    },
    [navigate]
  );

  const orderCategorySelection = React.useCallback(
    (category: string) => {
      const trimmed = category.trim();
      const query = new URLSearchParams({ status: 'Completed' });
      if (trimmed) query.set('category', trimmed);
      navigate(`/orders?${query.toString()}`);
    },
    [navigate]
  );
  const vendorSelection = React.useCallback(
    (vendorName: string) => {
      const trimmed = vendorName.trim();
      if (!trimmed) return;
      navigate(`/vendors?vendor=${encodeURIComponent(trimmed)}`);
    },
    [navigate]
  );

  const vendorTierSelection = React.useCallback(
    (tier: string) => {
      const trimmed = tier.trim();
      navigate(trimmed ? `/vendors?tier=${encodeURIComponent(trimmed)}` : '/vendors');
    },
    [navigate]
  );

  const overviewTaskReferences = React.useMemo(() => {
    if (!healthy) return [];
    const references: Array<{ id: string; label: string; description?: string; type: 'REQUEST' | 'PO' | 'INVENTORY' }> = [];

    requestRecords.slice(0, 10).forEach((record) => {
      const label = record.orderNo || `PR-${record.id}`;
      references.push({
        id: String(record.id),
        label,
        description: record.title || record.department || undefined,
        type: 'REQUEST',
      });
    });

    purchaseOrdersForTasks.slice(0, 10).forEach((order) => {
      references.push({
        id: String(order.id),
        label: order.orderNo || `PO-${order.id}`,
        description: order.vendor || order.department || undefined,
        type: 'PO',
      });
    });

    inventoryItemsForTasks.slice(0, 10).forEach((item, index) => {
      const label = item.code || item.name || `INV-${index + 1}`;
      references.push({
        id: item.id ? String(item.id) : label,
        label,
        description: item.name || item.warehouse || undefined,
        type: 'INVENTORY',
      });
    });

    return references;
  }, [healthy, requestRecords, purchaseOrdersForTasks, inventoryItemsForTasks]);

  const financialKpiPlaceholders = React.useMemo(() => ([
    { label: 'Open Payments', value: '—', icon: <Wallet size={20} />, delta: null },
    { label: 'Pending Payments', value: '—', icon: <Clock size={20} />, delta: null },
    { label: 'Closed Payments', value: '—', icon: <CheckCircle2 size={20} />, delta: null },
    { label: 'Scheduled Payments', value: '—', icon: <CalendarDays size={20} />, delta: null },
  ]), []);
  const menuItems = [
    {
      key: 'new-request',
      label: 'New Request',
      icon: <Plus className="w-4.5 h-4.5" />,
      onClick: () => console.log('New Request'),
    },
    {
      key: 'import-requests',
      label: 'Import Requests',
      icon: <Upload className="w-4.5 h-4.5" />,
      onClick: () => console.log('Import Requests'),
    },
    {
      key: 'new-material',
      label: 'New Material',
      icon: <PackagePlus className="w-4.5 h-4.5" />,
      onClick: () => console.log('New Material'),
    },
    {
      key: 'import-materials',
      label: 'Import Materials',
      icon: <Upload className="w-4.5 h-4.5" />,
      onClick: () => console.log('Import Materials'),
    },
    {
      key: 'new-vendor',
      label: 'New Vendor',
      icon: <Users className="w-4.5 h-4.5" />,
      onClick: () => console.log('New Vendor'),
    },
    {
      key: 'import-vendors',
      label: 'Import Vendors',
      icon: <Upload className="w-4.5 h-4.5" />,
      onClick: () => console.log('Import Vendors'),
    },
    {
      key: 'new-payment-request',
      label: 'New Payment Request',
      icon: <FileText className="w-4.5 h-4.5" />,
      onClick: () => console.log('New Payment Request'),
    },
  ];
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {!healthy ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
          Backend unavailable. Insights will update when the connection is restored.
        </div>
      ) : null}
      {overviewError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          Failed to load overview KPIs. Please retry shortly.
        </div>
      ) : null}
      <PageHeader title="Overview" menuItems={menuItems} />
      <DailyBriefBlock
        now={now}
        city={dailyBrief.city}
        weather={dailyBrief.weather}
        match={dailyBrief.match}
        headline={dailyBrief.headline}
        loading={dailyBriefLoading}
        weatherLoading={isWeatherLoading}
      />
      <OverviewTopBlock
        requests={requests}
        orders={orders}
        loadingRequests={loading}
        loadingOrders={loading}
        ordersByDept={ordersByDept ?? null}
        loadingOrdersByDept={loadingOrdersByDept || !healthy}
      />
      <RequestsBlock
        loading={loading}
        statusData={healthy ? requestsStatusData : []}
        loadingStatus={loadingRequestsStatus}
        deptData={healthy ? requestsDeptData : null}
        loadingDept={loadingRequestsDept || !healthy}
        onStatusClick={statusSelection}
        onDeptClick={deptSelection}
      />
      <OrdersBlock
        data={orders}
        loading={loading}
        statusData={healthy ? ordersStatusData : []}
        loadingStatus={loadingOrdersStatus}
        categoryData={healthy ? ordersCategoryData : []}
        loadingCategory={loadingOrdersCategory || !healthy}
        onStatusClick={orderStatusSelection}
        onCategoryClick={orderCategorySelection}
      />
      <WarehouseKpiMovementsBlock subtitle="Inventory health, alerts, and monthly movements" />
      <WarehouseCompositionBlock subtitle="Stock status and warehouse mix" />
      <VendorsBlock
        kpis={vendorKpis}
        loadingKpis={loadingVendorKpis || !healthy}
        monthlySpend={vendorMonthly}
        loadingMonthly={loadingVendorMonthly || !healthy}
        topSpend={vendorTopSpend}
        loadingTopSpend={loadingVendorTopSpend || !healthy}
        statusMix={vendorStatusMix}
        loadingStatusMix={loadingVendorStatusMix || !healthy}
        onVendorClick={vendorSelection}
        onTierClick={vendorTierSelection}
      />
      <FinancialOverviewBlock
        subtitle="Payment KPIs and breakdowns"
        kpis={financialKpiPlaceholders}
        statusData={[]}
        methodData={[]}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BaseCard title="Recent Activity" subtitle="Latest cross-functional updates">
          <RecentActivityFeed items={[]} emptyMessage="No recent activity yet." />
        </BaseCard>
        <RequestsTasksCard
          scope="overview"
          references={overviewTaskReferences}
          className="h-full"
          title="Tasks"
          subtitle="Cross-functional follow-ups"
        />
      </div>
    </div>
  );
}

export default function Overview() {
  return <OverviewShell />;
}

// SpendFlowBlock removed per request
