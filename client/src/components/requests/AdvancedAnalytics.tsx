import React from 'react';
import { AsyncECharts } from '../charts/AsyncECharts';

type Req = { requestNo: string; department?: string; status: 'NEW'|'RFQ'|'APPROVED'|'COMPLETED'; requiredDate?: string };

export default function AdvancedAnalytics({ requests }: { requests: Req[] }) {
  const uniq = React.useMemo(() => {
    const m = new Map<string, Req>();
    requests.forEach(r => m.set(r.requestNo, r));
    return Array.from(m.values());
  }, [requests]);

  const counts = React.useMemo(() => {
    const m: Record<string, number> = { NEW:0, RFQ:0, APPROVED:0, COMPLETED:0 };
    uniq.forEach(r => { m[r.status] = (m[r.status]||0) + 1; });
    return m;
  }, [uniq]);

  const byDept = React.useMemo(() => {
    const m = new Map<string, number>();
    uniq.forEach(r => m.set(r.department || '—', (m.get(r.department || '—') || 0) + 1));
    return Array.from(m.entries());
  }, [uniq]);

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const lineSeries = React.useMemo(() => {
    const arr = Array(12).fill(0);
    uniq.forEach(r => {
      const d = r.requiredDate ? new Date(r.requiredDate) : new Date();
      const idx = !isNaN(d.getTime()) ? d.getMonth() : Math.floor(Math.random()*12);
      arr[idx] += 1;
    });
    return arr;
  }, [uniq]);

  const pieOpt = {
    tooltip: { trigger:'item', formatter:'{b}: {c} ({d}%)' },
    series: [{ type:'pie', radius:[30, 110], roseType:'area', data:[
      { name:'New', value: counts.NEW },
      { name:'Quotation', value: counts.RFQ },
      { name:'Approved', value: counts.APPROVED },
      { name:'Closed', value: counts.COMPLETED },
    ], itemStyle:{ borderRadius:8 } }]
  } as any;

  const barOpt = {
    grid: { left: 24, right: 16, top: 20, bottom: 30, containLabel: true },
    xAxis: { type:'category', data: byDept.map(([k])=>k) },
    yAxis: { type:'value' },
    series: [{ type:'bar', data: byDept.map(([,v])=>v), itemStyle: { color:'#3B82F6', borderRadius:[6,6,0,0] } }]
  } as any;

  const lineOpt = {
    grid: { left: 24, right: 16, top: 20, bottom: 30, containLabel: true },
    xAxis: { type:'category', data: months },
    yAxis: { type:'value' },
    series: [{ type:'line', data: lineSeries, smooth:true, areaStyle: { opacity: .1 }, itemStyle:{ color:'#10B981' } }]
  } as any;

  const convertedPct = uniq.length ? Math.round((uniq.filter(r => r.status==='APPROVED' || r.status==='COMPLETED').length / uniq.length) * 100) : 0;
  const highPriorityPending = 0; // placeholder until priority is wired
  const cycleDays = '—'; // need real timestamps to compute accurately

  return (
    <div className="card card-p">
      <div className="mb-3 text-sm font-semibold">Advanced Analytics</div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-2"><div className="h-60"><AsyncECharts option={pieOpt} style={{ height: '100%' }} fallbackHeight={240} /></div></div>
        <div className="rounded-xl border bg-white p-2"><div className="h-60"><AsyncECharts option={barOpt} style={{ height: '100%' }} fallbackHeight={240} /></div></div>
        <div className="rounded-xl border bg-white p-2"><div className="h-60"><AsyncECharts option={lineOpt} style={{ height: '100%' }} fallbackHeight={240} /></div></div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border p-3 bg-white"><div className="text-[11px] uppercase text-gray-500 mb-1">% Converted to Orders</div><div className="text-2xl font-semibold">{convertedPct}%</div></div>
        <div className="rounded-xl border p-3 bg-white"><div className="text-[11px] uppercase text-gray-500 mb-1">Avg Request → Order Cycle</div><div className="text-2xl font-semibold">{cycleDays}</div></div>
        <div className="rounded-xl border p-3 bg-white"><div className="text-[11px] uppercase text-gray-500 mb-1">High Priority Pending</div><div className="text-2xl font-semibold">{highPriorityPending}</div></div>
      </div>
    </div>
  );
}
