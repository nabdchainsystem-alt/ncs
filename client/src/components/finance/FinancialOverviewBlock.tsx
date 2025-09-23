import React from 'react';
import { CalendarDays, CheckCircle2, Clock, Wallet } from 'lucide-react';

import chartTheme from '../../styles/chartTheme';
import PieInsightCard from '../charts/PieInsightCard';
import { StatCard } from '../shared';
import BaseCard from '../ui/BaseCard';

type Delta = { pct: string; trend: 'up' | 'down' } | null;
type Kpi = { label: string; value: string | number; icon?: React.ReactNode; delta?: Delta };

const PLACEHOLDER_VALUE = '—';

const DEFAULT_PAYMENT_KPIS: Kpi[] = [
  { label: 'Open Payments', value: PLACEHOLDER_VALUE, icon: <Wallet size={20} /> },
  { label: 'Pending Payments', value: PLACEHOLDER_VALUE, icon: <Clock size={20} /> },
  { label: 'Closed Payments', value: PLACEHOLDER_VALUE, icon: <CheckCircle2 size={20} /> },
  { label: 'Scheduled Payments', value: PLACEHOLDER_VALUE, icon: <CalendarDays size={20} /> },
];

export type FinancialOverviewProps = {
  subtitle?: string;
  kpis?: Kpi[];
  statusData?: { name: 'Open'|'Pending'|'Closed'|'Scheduled'; value: number }[];
  methodData?: { name: 'Cash'|'Credit'|'Transfer'; value: number }[];
};

export default function FinancialOverviewBlock({
  subtitle,
  kpis = DEFAULT_PAYMENT_KPIS,
  statusData = [],
  methodData = [],
}: FinancialOverviewProps) {

  const resolvedKpis = React.useMemo(
    () =>
      kpis.map((entry) => ({
        ...entry,
        value: PLACEHOLDER_VALUE,
        delta: null,
      })),
    [kpis],
  );

  const statusPie = React.useMemo(
    () => {
      const colors = [chartTheme.brandPrimary, chartTheme.brandSecondary, chartTheme.accentTeal, '#06B6D4'];
      return statusData.map((slice, index) => ({ name: slice.name, value: slice.value, color: colors[index % colors.length] }));
    },
    [statusData],
  );

  const methodPie = React.useMemo(
    () => {
      const colors = ['#A855F7', '#F59E0B', '#22C55E'];
      return methodData.map((slice, index) => ({ name: slice.name, value: slice.value, color: colors[index % colors.length] }));
    },
    [methodData],
  );

  return (
    <div className="space-y-6">
      {/* Block A — KPI row */}
      <BaseCard title="Financial Overview" subtitle={subtitle}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {resolvedKpis.map((k) => (
            <StatCard
              key={k.label}
              label={k.label}
              value={k.value}
              icon={k.icon}
              delta={null}
              className="h-full"
            />
          ))}
        </div>
      </BaseCard>

      {/* Block B — Two pies side by side, each separated inside the card */}
      <BaseCard title="Payments Breakdown" subtitle="Status and payment method mix">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PieInsightCard
            title="Payments by Status"
            subtitle="Open / Pending / Closed / Scheduled"
            data={statusPie}
            description="Value of payments grouped by lifecycle stage. Track the open and pending share to anticipate cash exposure."
            height={280}
          />
          <PieInsightCard
            title="Payments by Method"
            subtitle="Cash / Credit / Transfer"
            data={methodPie}
            description="Split of payments by preferred settlement channel. Highlights the reliance on cash versus credit and transfers."
            height={280}
          />
        </div>
      </BaseCard>
    </div>
  );
}
