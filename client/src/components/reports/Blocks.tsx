import React from 'react';
import { AsyncECharts } from '../charts/AsyncECharts';

type BlockProps = { title: string; subtitle?: string; children: React.ReactNode };
const Block: React.FC<BlockProps> = ({ title, subtitle, children }) => (
  <section className="rep-card p-4">
    <div className="flex items-center justify-between mb-3">
      <div>
        <div className="text-lg font-bold">{title}</div>
        {subtitle ? <div className="text-xs text-gray-500">{subtitle}</div> : null}
      </div>
      <div className="h-8 w-24 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20" />
    </div>
    {children}
  </section>
);

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function ReportBlocks() {
  return (
    <div className="space-y-6">
      {block(
        'Requests Reports', 'Pipeline, status and lead time',
        lineOption(months, months.map((_,i)=> 20 + (i*7%60)), '#3B82F6', 'Requests Trend'),
        pieOption(['New','Under Review','RFQ','Approved','Completed'], [18,12,9,15,20]),
        barOption(months, months.map((_,i)=> (i*5)%20+10), '#10B981', 'Lead Time (d)')
      )}
      {block(
        'Orders Reports', 'Values, fulfillment and delays',
        lineOption(months, months.map((_,i)=> 5 + (i*3%25)), '#6366F1', 'Delay Probability %'),
        pieOption(['Open','In Progress','Completed'], [6,10,12]),
        barOption(months, months.map((_,i)=> 1_000_000 + i*120_000), '#111827', 'Orders Value (SAR)')
      )}
      {block(
        'Inventory Reports', 'Stock levels and stockouts',
        lineOption(months, months.map((_,i)=> (i*5)%20), '#EF4444', 'Predicted Stockouts'),
        pieOption(['Spare','Safety','Cons.','Equip.','Chem.'], [38,22,18,12,10]),
        barOption(['Spare','Safety','Cons.','Equip.','Chem.'], [380,220,180,120,100], '#3B82F6', 'Stock by Category')
      )}
      {block(
        'Vendors Reports', 'Performance and ESG',
        lineOption(months, months.map((_,i)=> 70 + (i*3%30)), '#10B981', 'On‑Time %'),
        pieOption(['A (≥85)','B (70–85)','C (<70)'], [28,76,41]),
        barOption(['Alpha','Beta','Gamma','Delta','Epsilon'], [82,58,74,91,66], '#10B981', 'Trust Score')
      )}
      {block(
        'Operations Reports', 'Efficiency and cycle time',
        lineOption(months, months.map((_,i)=> 12 + (i%6)), '#8B5CF6', 'Avg Cycle Time'),
        pieOption(['Idle','Busy','Blocked'], [15,75,10]),
        barOption(months, months.map((_,i)=> 200 + (i*17%140)), '#F59E0B', 'Throughput')
      )}
    </div>
  );
}

function block(title: string, subtitle: string, left: any, middle: any, right: any) {
  return (
    <Block key={title} title={title} subtitle={subtitle}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <CardChart title={left.title}><AsyncECharts option={left.option} style={{ height: 224 }} notMerge fallbackHeight={224} /></CardChart>
        <CardChart title={middle.title}><AsyncECharts option={middle.option} style={{ height: 224 }} notMerge fallbackHeight={224} /></CardChart>
        <CardChart title={right.title}><AsyncECharts option={right.option} style={{ height: 224 }} notMerge fallbackHeight={224} /></CardChart>
      </div>
    </Block>
  );
}

function lineOption(labels: string[], data: number[], color: string, title: string) {
  return {
    title,
    option: {
      tooltip: { trigger: 'axis' },
      grid: { left: 24, right: 16, top: 16, bottom: 28, containLabel: true },
      xAxis: { type: 'category', data: labels, boundaryGap: false, axisLine:{ lineStyle:{ color:'#e5e7eb' } }, axisTick:{ show:false } },
      yAxis: { type: 'value', splitLine:{ lineStyle:{ color:'#e5e7eb' } } },
      series: [{
        name: title,
        type: 'line', smooth: true,
        data,
        areaStyle: { color: color + '33' },
        lineStyle: { color, width: 2 },
        symbol: 'circle', symbolSize: 6, itemStyle:{ color },
        emphasis: { focus: 'series' },
        animationDuration: 800, animationEasing: 'cubicOut',
      }],
    }
  };
}

function barOption(labels: string[], data: number[], color: string, title: string) {
  return {
    title,
    option: {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 24, right: 16, top: 16, bottom: 28, containLabel: true },
      xAxis: { type: 'category', data: labels, axisTick: { alignWithLabel: true }, axisLine:{ lineStyle:{ color:'#e5e7eb' } } },
      yAxis: { type: 'value', splitLine:{ lineStyle:{ color:'#e5e7eb' } } },
      series: [{
        name: title,
        type: 'bar', data,
        itemStyle: { color, borderRadius:[6,6,0,0] },
        emphasis: { focus: 'series' },
        animationDuration: 800,
      }],
    }
  };
}

function pieOption(labels: string[], values: number[]) {
  return {
    title: 'Distribution',
    option: {
      tooltip: { trigger:'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0, icon:'circle' },
      series: [{
        type:'pie', radius:['58%','80%'], center:['50%','48%'],
        itemStyle:{ borderColor:'#fff', borderWidth:2 },
        label:{ show:false },
        emphasis:{ scale:true, scaleSize:8 },
        data: labels.map((l,i)=> ({ name:l, value: values[i] ?? 0 })),
        animationDuration: 700,
      }]
    }
  };
}

function CardChart({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-xl border p-3 bg-white shadow-sm`}>
      <div className="text-sm font-semibold mb-2">{title}</div>
      <div className="h-56">{children}</div>
    </div>
  );
}
