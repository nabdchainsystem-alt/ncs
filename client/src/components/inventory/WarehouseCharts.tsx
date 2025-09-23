import React from 'react';
import { AsyncECharts } from '../charts/AsyncECharts';

const card: React.CSSProperties = { background:'#fff', border:'1px solid #E5E7EB', borderRadius:14, boxShadow:'0 1px 2px rgba(16,24,40,.06)', padding:16 };

function BarCard({ title, data }: { title: string; data: number[] }) {
  const option = {
    tooltip:{ trigger:'axis', axisPointer:{ type:'shadow' } },
    grid:{ left:24, right:16, top:16, bottom:28, containLabel:true },
    xAxis:{ type:'category', data:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], axisTick:{ alignWithLabel:true }, axisLine:{ lineStyle:{ color:'#e5e7eb' } } },
    yAxis:{ type:'value', splitLine:{ lineStyle:{ color:'#e5e7eb' } } },
    series:[{ type:'bar', data, itemStyle:{ color:'#3B82F6', borderRadius:[6,6,0,0] }, animationDuration:800 }]
  } as any;
  return <div style={card}><div className="font-semibold mb-2">{title}</div><AsyncECharts option={option} style={{ height: 220 }} fallbackHeight={220} /></div>;
}

const WarehouseCharts: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <BarCard title="Factory Warehouse" data={Array.from({length:12}).map((_,i)=> 200 + (i*13%120))} />
      <BarCard title="Sulai Warehouse" data={Array.from({length:12}).map((_,i)=> 180 + (i*17%100))} />
      <BarCard title="Rafayea Warehouse" data={Array.from({length:12}).map((_,i)=> 160 + (i*19%140))} />
    </div>
  );
};

export default WarehouseCharts;
