import React from 'react';
import BarChart from '../charts/BarChart';
import chartTheme from '../../styles/chartTheme';
import * as data from './data';

export default function DistanceByTypeBar({ height = chartTheme.heights.bar }: { height?: number }) {
  const rows = data.distanceByType;
  return (
    <BarChart
      data={rows}
      categoryKey="type"
      series={[
        {
          id: 'km',
          valueKey: 'km',
          name: 'Distance (km)',
          color: chartTheme.brandPrimary,
        },
      ]}
      height={height}
      clampLabelLength={12}
    />
  );
}
