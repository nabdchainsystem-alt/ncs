import React from 'react';
import BaseCard from '../ui/BaseCard';
import chartTheme from '../../styles/chartTheme';
import { Wallet, Clock, CheckCircle2, CalendarDays } from 'lucide-react';
import { StatCard, PieChartCard } from '../shared';

type Delta = { pct: string; trend: 'up'|'down' } | null;
type Kpi = { label: string; value: string | number; icon?: React.ReactNode; delta?: Delta };

export type FinancialOverviewProps = {
  kpis?: Kpi[];
  statusData?: { name: 'Open'|'Pending'|'Closed'|'Scheduled'; value: number }[];
  methodData?: { name: 'Cash'|'Credit'|'Transfer'; value: number }[];
};

export default function FinancialOverviewBlock({
  kpis = [
    { label: 'Open Payments',     value: '128',  icon: <Wallet size={20} />,        delta: { pct: '+2.4%', trend: 'up' } },
    { label: 'Pending Payments',  value: '54',   icon: <Clock size={20} />,         delta: { pct: '−1.2%', trend: 'down' } },
    { label: 'Closed Payments',   value: '930',  icon: <CheckCircle2 size={20} />,  delta: { pct: '+0.8%', trend: 'up' } },
    { label: 'Scheduled Payments',value: '42',   icon: <CalendarDays size={20} />,  delta: { pct: '+3.1%', trend: 'up' } },
  ],
  statusData = [
    { name: 'Open', value: 42000 },
    { name: 'Pending', value: 18000 },
    { name: 'Closed', value: 96000 },
    { name: 'Scheduled', value: 22000 },
  ],
  methodData = [
    { name: 'Cash', value: 38000 },
    { name: 'Credit', value: 52000 },
    { name: 'Transfer', value: 88000 },
  ],
}: FinancialOverviewProps) {

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
      <BaseCard title="Financial Overview">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((k) => (
            <StatCard
              key={k.label}
              label={k.label}
              value={k.value}
              icon={k.icon}
              delta={k.delta ? { label: k.delta.pct, trend: k.delta.trend } : null}
              className="h-full"
            />
          ))}
        </div>
      </BaseCard>

      {/* Block B — Two pies side by side, each separated inside the card */}
      <BaseCard title="Payments Breakdown">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PieChartCard
            title="Payments by Status"
            subtitle="Open / Pending / Closed / Scheduled"
            data={statusPie}
            height={280}
          />
          <PieChartCard
            title="Payments by Method"
            subtitle="Cash / Credit / Transfer"
            data={methodPie}
            height={280}
          />
        </div>
      </BaseCard>
    </div>
  );
}
