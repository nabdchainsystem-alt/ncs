import React from 'react';
import { AsyncECharts } from '../charts/AsyncECharts';

export default function OrdersMiniCharts() {
  const lineOpt = {
    tooltip: { trigger: 'axis' },
    grid: { left: 24, right: 16, top: 16, bottom: 24, containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] },
    yAxis: { type: 'value' },
    series: [{ name:'Orders', type:'line', smooth:true, data: [120, 132, 101, 134, 90, 230, 210], areaStyle: { opacity: .15 } }],
  } as any;

  const barOpt = {
    tooltip: {},
    grid: { left: 24, right: 16, top: 16, bottom: 24, containLabel: true },
    xAxis: { type: 'category', data: ['A','B','C','D','E','F','G'] },
    yAxis: { type: 'value' },
    series: [{ type:'bar', data: [5, 20, 36, 10, 10, 20, 18], itemStyle:{ color:'#111827', borderRadius:[6,6,0,0] } }],
  } as any;

  const pieOpt = {
    tooltip: { trigger:'item', formatter:'{b}: {c} ({d}%)' },
    legend: { bottom: 0 },
    series: [{
      name: 'Status', type: 'pie', radius: ['30%','65%'], roseType: 'area',
      itemStyle: { borderRadius: 8 },
      data: [
        { value: 40, name: 'Open' },
        { value: 20, name: 'In Progress' },
        { value: 16, name: 'Closed' },
        { value: 10, name: 'Delayed' },
      ],
    }],
  } as any;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="orders-card p-4"><div className="font-semibold mb-2">Weekly Orders (Smooth)</div><AsyncECharts option={lineOpt} style={{ height: 220 }} fallbackHeight={220} /></div>
      <div className="orders-card p-4"><div className="font-semibold mb-2">Top Categories</div><AsyncECharts option={barOpt} style={{ height: 220 }} fallbackHeight={220} /></div>
      <div className="orders-card p-4"><div className="font-semibold mb-2">Orders by Status</div><AsyncECharts option={pieOpt} style={{ height: 220 }} fallbackHeight={220} /></div>
    </div>
  );
}
