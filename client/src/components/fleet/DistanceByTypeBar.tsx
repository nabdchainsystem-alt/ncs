import React from 'react';

import { useFleetVehicles } from '../../features/fleet/hooks';
import BarChart from '../charts/BarChart';
import chartTheme from '../../styles/chartTheme';

type DistanceRow = { type: string; km: number };

const formatKey = (value?: string | null): string => {
  if (!value) return 'Unspecified';
  return value.trim().length ? value : 'Unspecified';
};

export default function DistanceByTypeBar({ height = chartTheme.heights.bar }: { height?: number }) {
  const { data: vehicles, isLoading, error } = useFleetVehicles();

  const rows: DistanceRow[] = React.useMemo(() => {
    const totals = new Map<string, number>();
    (vehicles ?? []).forEach((vehicle) => {
      const key = formatKey(vehicle.make ?? vehicle.model);
      const odometer = typeof vehicle.odometer === 'number' ? vehicle.odometer : null;
      if (odometer == null || Number.isNaN(odometer) || odometer <= 0) return;
      totals.set(key, (totals.get(key) ?? 0) + odometer);
    });
    return Array.from(totals.entries())
      .map(([type, km]) => ({ type, km }))
      .sort((a, b) => b.km - a.km);
  }, [vehicles]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-red-600">
        Unable to load fleet metrics.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        Loading fleet metrics…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        No distance data available.
      </div>
    );
  }

  return (
    <BarChart
      data={rows}
      categoryKey="type"
      series={[
        {
          id: 'km',
          valueKey: 'km',
          name: 'Odometer (km)',
          color: chartTheme.brandPrimary,
        },
      ]}
      height={height}
      clampLabelLength={12}
    />
  );
}
