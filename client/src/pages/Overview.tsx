import React from 'react';
import '../styles/archive.css';
import ReactECharts from 'echarts-for-react';
import { Maximize2, X } from 'lucide-react';
import MarketsBoard from '../components/overview/MarketsBoard';

const Card: React.FC<React.PropsWithChildren<{ title?: string }>> = ({ title, children }) => (
  <section className="arch-card p-4">
    {title ? <div className="text-sm font-semibold mb-2">{title}</div> : null}
    {children}
  </section>
);

export default function Overview() {
  // data generators
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const [webkitFull, setWebkitFull] = React.useState(false);

  const treemapOption = {
    tooltip: { formatter:(p:any)=> `${p.name}: ${p.value.toLocaleString()} SAR` },
    series: [{
      type:'treemap', roam:false, upperLabel:{ show:true, height:22, color:'#111827', fontWeight:600 },
      itemStyle:{ borderColor:'#fff', borderWidth:2, gapWidth:2 },
      animationDuration:700,
      data:[
        { name:'Mechanical', value:3200000, children:[{name:'Bearings', value:1200000},{name:'Seals', value:800000},{name:'Belts', value:600000}]},
        { name:'Electrical', value:2600000, children:[{name:'Cables', value:1400000},{name:'Drives', value:600000}]},
        { name:'Chemicals', value:1100000 },
        { name:'Logistics', value:900000 },
      ],
    }],
  } as any;

  // Webkit dependency graph (ECharts example) — replaces Process Flow
  const [webkitData, setWebkitData] = React.useState<any>(null);
  React.useEffect(() => {
    const url = 'https://echarts.apache.org/examples/data/asset/data/webkit-dep.json';
    const fetchText = async (u: string) => {
      try { const r = await fetch(u); if (!r.ok) throw new Error(String(r.status)); return await r.text(); }
      catch { const p = `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`; const rr = await fetch(p); const jj = await rr.json(); return jj?.contents || ''; }
    };
    (async () => {
      try {
        const txt = await fetchText(url);
        const json = JSON.parse(txt);
        setWebkitData(json);
      } catch {
        // final tiny fallback (ensures chart never stays loading)
        setWebkitData({
          categories:[{name:'A'},{name:'B'},{name:'C'}],
          nodes:[{name:'Core',value:10,category:0},{name:'Module1',value:6,category:1},{name:'Module2',value:4,category:2}],
          links:[{source:'Core',target:'Module1'},{source:'Core',target:'Module2'}]
        });
      }
    })();
  }, []);
  const webkitOption = React.useMemo(() => {
    if (!webkitData) return null;
    const categories = (webkitData?.categories || []).map((c: any) => ({ name: c.name }));
    const data = (webkitData?.nodes || []).map((n: any) => {
      const size = Math.max(6, Math.sqrt(n.value || 1) * 2);
      return { ...n, symbolSize: size, label: { show: size >= 12 } };
    });
    return {
      tooltip: {},
      legend: [{ data: categories.map((c: any)=> c.name) }],
      series: [{
        type: 'graph',
        layout: 'force',
        roam: true,
        data,
        categories,
        edges: webkitData?.links || webkitData?.edges || [],
        edgeSymbol: ['circle','arrow'],
        edgeSymbolSize: [2, 6],
        force: { repulsion: 80, edgeLength: 80 },
        label: { position: 'right' },
        lineStyle: { color: 'source', curveness: 0.2 }
      }]
    } as any;
  }, [webkitData]);

  const radarOption = {
    tooltip:{},
    radar:{ indicator:[
      { name:'Delivery', max:100 },{ name:'Quality', max:100 },{ name:'Price', max:100 },{ name:'Response', max:100 },{ name:'Compliance', max:100 }
    ] },
    series:[{ type:'radar', areaStyle:{ color:'#3B82F633' }, lineStyle:{ color:'#3B82F6' }, data:[{ value:[86,78,72,90,80], name:'Score' }] }],
  } as any;

  const heatmapData: [number, number, number][] = [];
  for(let day=0; day<7; day++) for(let hour=0; hour<24; hour++) heatmapData.push([day, hour, Math.round(Math.random()*8)]);
  const heatmapOption = {
    tooltip:{ position:'top' },
    grid:{ left:40, right:20, top:20, bottom:20 },
    xAxis:{ type:'category', data:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], splitArea:{ show:true } },
    yAxis:{ type:'category', data:Array.from({length:24}).map((_,i)=> `${String(i).padStart(2,'0')}:00`), splitArea:{ show:true } },
    visualMap:{ min:0, max:10, calculable:true, orient:'horizontal', left:'center', bottom:0 },
    series:[{ name:'Activity', type:'heatmap', data:heatmapData, emphasis:{ itemStyle:{ shadowBlur:10, shadowColor:'rgba(0,0,0,.35)' } } }],
  } as any;

  const lineAreaOption = {
    tooltip:{ trigger:'axis' },
    grid:{ left:24, right:16, top:16, bottom:28, containLabel:true },
    xAxis:{ type:'category', data:months, boundaryGap:false, axisLine:{ lineStyle:{ color:'#e5e7eb' } } },
    yAxis:{ type:'value', splitLine:{ lineStyle:{ color:'#e5e7eb' } } },
    series:[{ type:'line', data:months.map((_,i)=> 20 + (i*7%60)), smooth:true, areaStyle:{ color:'#10B98133' }, lineStyle:{ color:'#10B981' }, animationDuration:800 }],
  } as any;

  const barOption = {
    tooltip:{ trigger:'axis', axisPointer:{ type:'shadow' } },
    grid:{ left:24, right:16, top:16, bottom:28, containLabel:true },
    xAxis:{ type:'category', data:['Alpha','Beta','Gamma','Delta','Epsilon'], axisTick:{ alignWithLabel:true } },
    yAxis:{ type:'value', splitLine:{ lineStyle:{ color:'#e5e7eb' } } },
    series:[{ type:'bar', data:[1.8,1.2,0.9,0.8,0.7], itemStyle:{ color:'#111827', borderRadius:[6,6,0,0] }, animationDuration:800 }],
  } as any;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Overview</h1>
          <div className="text-xs text-gray-500">Executive cockpit — E2E visibility across modules</div>
        </div>
        <div className="flex gap-2">
          <button data-glow className="px-3 py-2 rounded bg-blue-600 text-white text-sm">Create</button>
          <button data-glow className="px-3 py-2 rounded bg-gray-700 text-white text-sm">Export</button>
        </div>
      </header>

      {/* KPIs Row */}
      <Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ['Total Spend','12,300,000 SAR'],['Savings','8.2%'],['On‑Time Delivery','86%'],['Coverage','47 days']
          ].map(([l,v])=> (
            <div key={l} className="u-neo p-3">
              <div className="text-xs text-gray-500">{l}</div>
              <div className="text-xl font-extrabold">{v}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Markets board */}
      <MarketsBoard />

      {/* Row 1: Treemap | Process Flow (Graph) | Radar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card title="Spend by Category"><ReactECharts option={treemapOption} style={{ height: 260 }} /></Card>
        <Card title="Process Flow">
          <div className="flex items-center justify-end mb-1">
            <button title="Full Screen" onClick={()=> setWebkitFull(true)} className="px-2 py-1 text-xs rounded border hover:bg-gray-50 inline-flex items-center gap-1">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
          {webkitOption ? (
            <ReactECharts option={webkitOption} style={{ height: 240 }} />
          ) : (
            <div className="p-4 text-sm text-gray-500">Loading…</div>
          )}
        </Card>
        <Card title="Performance Radar"><ReactECharts option={radarOption} style={{ height: 260 }} /></Card>
      </div>

      {/* Row 2: Heatmap full width */}
      <Card title="Activity Heatmap (Week × Hour)"><ReactECharts option={heatmapOption} style={{ height: 320 }} /></Card>

      {/* Row 3: Area Line | Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card title="Requests Trend (12m)"><ReactECharts option={lineAreaOption} style={{ height: 260 }} /></Card>
        <Card title="Top Vendors (SAR)"><ReactECharts option={barOption} style={{ height: 260 }} /></Card>
      </div>

      {/* Fullscreen overlay for Process Flow */}
      {webkitOption && (
        <FullScreenModal open={webkitFull} onClose={()=> setWebkitFull(false)} title="Process Flow">
          <ReactECharts option={webkitOption} style={{ height: '100%', width: '100%' }} />
        </FullScreenModal>
      )}
    </div>
  );
}

function FullScreenModal({ open, onClose, title, children }: { open: boolean; onClose: ()=>void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-[1200px] h-[84vh] bg-white rounded-2xl shadow-2xl border" onClick={(e)=> e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="font-semibold">{title}</div>
          <button className="px-2 py-1 text-sm rounded border hover:bg-gray-50 inline-flex items-center gap-1" onClick={onClose}>
            <X className="w-4 h-4" /> Close
          </button>
        </div>
        <div className="h-[calc(84vh-48px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
