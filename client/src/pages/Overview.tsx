import React from 'react';
import HeaderBar, { type HeaderAction } from '../components/ui/HeaderBar';
import '../styles/archive.css';
import ReactECharts from 'echarts-for-react';
import { Maximize2, X } from 'lucide-react';
import MarketsBoard from '../components/overview/MarketsBoard';
import { listRequests, API_URL } from '../lib/api';
import { OrdersProvider, useOrders } from '../context/OrdersContext';
import { InventoryProvider, useInventory } from '../context/InventoryContext';

const Card: React.FC<React.PropsWithChildren<{ title?: string }>> = ({ title, children }) => (
  <section className="arch-card p-4">
    {title ? <div className="text-sm font-semibold mb-2">{title}</div> : null}
    {children}
  </section>
);

function OverviewShell() {
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
      <HeaderBar
        title="Overview"
        onSearch={()=>{}}
        searchPlaceholder="Search…"
        actions={[]}
      />

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

      {/* Markets board (Block 1: unchanged) */}
      <MarketsBoard />

      {/* Block 2: KPI Cards (Requests/Vendors/Orders/Inventory/Spend) */}
      <KpiCards />

      {/* Block 3: Requests status + by department (side by side) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <RequestsStatusDonut />
        <RequestsByDepartment />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <OrdersTimeline />
        <TopVendorsPerformance />
      </div>

      <InventoryHealth />

      <FinancialOverview />

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

      {/* Block 8-10: Activities, Approvals, Tasks */}
      <RecentActivities />
      <ApprovalsQueue />
      <TasksReminders />

      {/* Block 11-12: Quick Actions / Reports Snapshot */}
      <QuickActions />
      <ReportsSnapshot />

      {/* Fullscreen overlay for Process Flow */}
      {webkitOption && (
        <FullScreenModal open={webkitFull} onClose={()=> setWebkitFull(false)} title="Process Flow">
          <ReactECharts option={webkitOption} style={{ height: '100%', width: '100%' }} />
        </FullScreenModal>
      )}
    </div>
  );
}

export default function Overview() {
  // Mount providers locally to reuse existing data (orders/inventory)
  return (
    <OrdersProvider>
      <InventoryProvider>
        <OverviewShell />
      </InventoryProvider>
    </OrdersProvider>
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

// ======= Blocks Implementation =======
function KpiCards() {
  const { orders } = useOrders();
  const { items: invItems } = useInventory();
  const [requestsTotal, setRequestsTotal] = React.useState(0);
  const [pendingApprovals, setPendingApprovals] = React.useState(0);
  const [vendorsCount, setVendorsCount] = React.useState(0);
  const [monthlySpend, setMonthlySpend] = React.useState<number>(0);
  const prevMonthSpend = React.useRef<number>(0);

  React.useEffect(() => {
    (async ()=>{
      try {
        const res = await listRequests({ page:1, pageSize:200, sortBy:'createdAt', sortDir:'desc' });
        setRequestsTotal(res.items?.length || 0);
        setPendingApprovals((res.items||[]).filter((r:any)=> (r.status||'').toUpperCase()==='NEW').length);
      } catch {}
      try {
        const r = await fetch(`${API_URL}/api/vendors?page=1&pageSize=1`);
        const j = await r.json(); setVendorsCount(Number(j?.total || (j?.items?.length||0)));
      } catch {}
    })();
  }, []);

  React.useEffect(()=>{
    // Approximate spend: sum orders value of current month vs previous month
    const byMonth = (d:string)=> new Date(d).getMonth();
    const now = new Date(); const cm = now.getMonth(); const pm = (cm+11)%12;
    const cur = orders.filter(o=> byMonth(o.date)===cm).reduce((s,o)=> s+o.value,0);
    const prev = orders.filter(o=> byMonth(o.date)===pm).reduce((s,o)=> s+o.value,0);
    setMonthlySpend(cur); prevMonthSpend.current = prev;
  }, [orders]);

  const openOrders = orders.filter(o=> o.status!=='Completed' && o.status!=='Canceled').length;
  const invAlerts = invItems.filter(it=> it.qty>0 && it.qty<it.minLevel || it.qty<=0).length;

  const trend = (cur:number, prev:number) => {
    if (prev<=0) return { pct: 100, up: true };
    const pct = Math.round(((cur-prev)/prev)*100);
    return { pct: Math.abs(pct), up: pct>=0 };
  };
  const spendTrend = trend(monthlySpend, prevMonthSpend.current || (monthlySpend*0.8));

  const cards = [
    { label:'Total Requests', value: requestsTotal, icon:'📄', t:trend(requestsTotal, Math.max(1,Math.round(requestsTotal*0.9))) },
    { label:'Pending Approvals', value: pendingApprovals, icon:'⏳', t:trend(pendingApprovals, Math.max(1,Math.round(pendingApprovals*0.8))) },
    { label:'Open Orders', value: openOrders, icon:'📦', t:trend(openOrders, openOrders+2) },
    { label:'Vendors Count', value: vendorsCount, icon:'🏭', t:trend(vendorsCount, Math.max(1, vendorsCount-2)) },
    { label:'Inventory Alerts', value: invAlerts, icon:'⚠️', t:trend(invAlerts, invAlerts+1) },
    { label:'Monthly Spend', value: `${(monthlySpend/1_000_000).toFixed(1)}M SAR`, icon:'💰', t:spendTrend },
  ];
  return (
    <Card>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {cards.map(c => (
          <div key={c.label} className="rounded-2xl border bg-white shadow-card p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">{c.label}</div>
              <div className="text-lg">{c.icon}</div>
            </div>
            <div className="text-2xl font-semibold mt-1">{c.value}</div>
            <div className={`mt-1 text-xs ${c.t.up? 'text-emerald-600' : 'text-red-600'}`}>{c.t.up? '▲' : '▼'} {c.t.pct}% vs last month</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RequestsStatusDonut() {
  const [data, setData] = React.useState<Array<{ name:string; value:number }>>([]);
  React.useEffect(()=>{ (async()=>{
    try{
      const r = await listRequests({ page:1, pageSize:200 });
      const m = new Map<string, number>();
      (r.items||[]).forEach((it:any)=>{ const k = String(it.status||'NEW'); m.set(k,(m.get(k)||0)+1); });
      const mapNames: Record<string,string> = { NEW:'New', RFQ:'Pending', APPROVED:'Approved', COMPLETED:'Completed', REJECTED:'Rejected' };
      const arr = Array.from(m.entries()).map(([k,v])=> ({ name: mapNames[k]||k, value:v }));
      setData(arr);
    } catch {}
  })(); },[]);
  const opt = { tooltip:{trigger:'item'}, legend:{ bottom:0 }, series:[{ type:'pie', radius:['35%','65%'], roseType:'area', data, itemStyle:{ borderRadius:8 } }] } as any;
  return <Card title="Requests Status Distribution"><div className="table-wrap"><ReactECharts option={opt} style={{ height: 300, width: '100%' }} /></div></Card>;
}

function RequestsByDepartment() {
  const [rows, setRows] = React.useState<Array<{ name:string; value:number }>>([]);
  React.useEffect(()=>{ (async()=>{
    try{
      const r = await listRequests({ page:1, pageSize:300 });
      const m = new Map<string, number>();
      (r.items||[]).forEach((it:any)=>{ const k = String(it.department||'—'); m.set(k,(m.get(k)||0)+1); });
      const arr: Array<{name:string; value:number}> = Array.from(m.entries()).map(([k,v])=> ({ name:k, value:v as number }));
      arr.sort((a: {name:string; value:number}, b: {name:string; value:number}) => b.value - a.value);
      setRows(arr.slice(0,10));
    } catch{}
  })(); }, []);
  const opt = { tooltip:{ trigger:'axis', axisPointer:{ type:'shadow' } }, grid:{ left:120,right:20,top:16,bottom:20 }, xAxis:{ type:'value' }, yAxis:{ type:'category', data: rows.map(r=> r.name) }, series:[{ type:'bar', data: rows.map(r=> r.value), itemStyle:{ color:'#111827', borderRadius:[6,6,0,0] } }] } as any;
  return <Card title="Requests by Department"><ReactECharts option={opt} style={{ height: 300 }} /></Card>;
}

function OrdersTimeline() {
  const { orders } = useOrders();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const series = React.useMemo(()=>{
    const map = new Array(12).fill(0);
    orders.forEach(o=> { const m = new Date(o.date).getMonth(); map[m] += o.value; });
    return map.map(v=> Math.round(v/1000));
  }, [orders]);
  const opt = { tooltip:{trigger:'axis'}, grid:{ left:24,right:16,top:16,bottom:28,containLabel:true }, xAxis:{ type:'category', data:months }, yAxis:{ type:'value', axisLabel:{ formatter:'{value}k' } }, series:[{ type:'line', areaStyle:{ opacity:.15 }, data:series, smooth:true, itemStyle:{ color:'#3B82F6' } }] } as any;
  return <Card title="Orders Timeline (Value)"><ReactECharts option={opt} style={{ height: 260 }} /></Card>;
}

function TopVendorsPerformance() {
  const [rows, setRows] = React.useState<Array<{ name:string; value:number; rating:number }>>([]);
  React.useEffect(()=>{ (async()=>{
    try {
      const r = await fetch(`${API_URL}/api/vendors?page=1&pageSize=50`);
      const j = await r.json();
      const arr: Array<{ name:string; value:number; rating:number }> = (j.items||[]) 
        .slice(0,20)
        .map((v:any)=> ({ name:v.name, value: Math.round((v.trustScore||50) * (1 + Math.random()*2)), rating: Math.max(3, Math.min(5, Math.round((v.trustScore||70)/20))) }));
      arr.sort((a: {name:string; value:number; rating:number}, b: {name:string; value:number; rating:number}) => b.value - a.value);
      setRows(arr.slice(0,5));
    } catch {}
  })(); },[]);
  const opt = { tooltip:{}, grid:{ left:100,right:20,top:16,bottom:20 }, xAxis:{ type:'value' }, yAxis:{ type:'category', data: rows.map(r=> `${r.name} ${'⭐'.repeat(r.rating)}`) }, series:[{ type:'bar', data: rows.map(r=> r.value), itemStyle:{ color:'#111827', borderRadius:[6,6,0,0] } }] } as any;
  return <Card title="Top Vendors Performance"><ReactECharts option={opt} style={{ height: 260 }} /></Card>;
}

function InventoryHealth() {
  const { items } = useInventory();
  const critical = React.useMemo(()=> {
    const list: Array<{ name:string; pct:number }> = [...items].map(it=> ({ name: it.name, pct: Math.max(0, Math.min(100, Math.round((it.qty/Math.max(1,it.minLevel))*100))) }));
    return list.sort((a: {name:string; pct:number}, b: {name:string; pct:number})=> a.pct-b.pct).slice(0,5);
  }, [items]);
  const alerts = items.filter(it=> it.qty<=0 || it.qty<it.minLevel).slice(0,6);
  return (
    <Card title="Inventory Health">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-2">
          {critical.map(c=> (
            <div key={c.name} className="rounded-xl border p-2 bg-white">
              <div className="text-sm font-medium mb-1">{c.name}</div>
              <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
                <div className={`h-full ${c.pct<30?'bg-red-500': c.pct<60?'bg-amber-500':'bg-emerald-500'}`} style={{ width: `${c.pct}%` }} />
              </div>
              <div className="text-xs text-gray-500 mt-1">Coverage: {c.pct}%</div>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-700">Alerts</div>
          {alerts.length===0 && <div className="text-sm text-gray-500">No alerts</div>}
          {alerts.map(a=> (
            <div key={a.id} className="arch-card p-2 text-sm">{a.name} reached minimum stock</div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function FinancialOverview() {
  const { orders } = useOrders();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const bars = new Array(12).fill(0);
  orders.forEach(o=> { const m = new Date(o.date).getMonth(); bars[m]+=o.value; });
  const budgets = bars.map((v,i)=> Math.max(v*0.9, (i%2?1.1:0.95)* (bars.reduce((s,x)=>s+x,0)/12)));
  const opt = { tooltip:{ trigger:'axis' }, legend:{ data:['Spend','Budget'] }, grid:{ left:24,right:16,top:16,bottom:28,containLabel:true }, xAxis:{ type:'category', data:months }, yAxis:{ type:'value' }, series:[ { name:'Spend', type:'bar', data: bars.map(v=> Math.round(v/1000)), itemStyle:{ color:'#3B82F6', borderRadius:[6,6,0,0] } }, { name:'Budget', type:'line', data: budgets.map(v=> Math.round(v/1000)), smooth:true, itemStyle:{ color:'#EF4444' } } ] } as any;
  return <Card title="Financial Overview"><ReactECharts option={opt} style={{ height: 280 }} /></Card>;
}

function RecentActivities() {
  const [acts, setActs] = React.useState<Array<{ when:string; text:string }>>([]);
  React.useEffect(()=>{ (async()=>{
    try { const r = await listRequests({ page:1, pageSize:20 }); const arr = (r.items||[]).slice(0,10).map((x:any)=> ({ when: x.createdAt || new Date().toISOString(), text: `User A created request ${x.orderNo || x.id}` })); setActs(arr); }
    catch { setActs([]); }
  })(); },[]);
  return (
    <Card title="Recent Activities">
      <ul className="divide-y">
        {acts.length===0 && <li className="py-4 text-sm text-gray-500">No recent activities</li>}
        {acts.map((a,i)=> (
          <li key={i} className="py-2 text-sm flex items-center justify-between"><span>{a.text}</span><span className="text-xs text-gray-500">{new Date(a.when).toLocaleString()}</span></li>
        ))}
      </ul>
    </Card>
  );
}

function ApprovalsQueue() {
  const [rows, setRows] = React.useState<any[]>([]);
  React.useEffect(()=>{ (async()=>{ try { const r = await listRequests({ page:1, pageSize:50 }); setRows((r.items||[]).filter((x:any)=> (x.status||'').toUpperCase()==='NEW').slice(0,8)); } catch {} })(); },[]);
  const onApprove = async (id:any)=>{ try{ await fetch(`${API_URL}/api/requests/${id}/status`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status:'APPROVED' }) }); setRows(rows.filter(r=> r.id!==id)); } catch{} };
  return (
    <Card title="Approvals Queue">
      <div className="table-wrap overflow-auto">
        <table className="u-table text-sm">
          <thead className="bg-gray-50 text-xs text-gray-600"><tr><th className="px-2 py-2 text-left">Request No</th><th className="px-2 py-2 text-left">Requester</th><th className="px-2 py-2 text-left">Dept</th><th className="px-2 py-2 text-right">Actions</th></tr></thead>
          <tbody>
            {rows.length===0 && <tr><td colSpan={4} className="px-2 py-6 text-center text-gray-500">No approvals pending</td></tr>}
            {rows.map((r:any)=> (
              <tr key={r.id} className="border-b last:border-0"><td className="px-2 py-2">{r.orderNo || r.id}</td><td className="px-2 py-2">{r.items?.[0]?.requester || '—'}</td><td className="px-2 py-2">{r.department || '—'}</td><td className="px-2 py-2 text-right"><button className="px-2 py-1 text-xs rounded border hover:bg-gray-50" onClick={()=> onApprove(r.id)}>Approve</button></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function TasksReminders() {
  const [tasks, setTasks] = React.useState<Array<{ title:string; due?:string }>>([]);
  React.useEffect(()=>{ setTasks([{ title:'Follow-up vendor', due:'in 2d' },{ title:'Review RFQ', due:'tomorrow' },{ title:'Contract renewal', due:'in 7d' }]); },[]);
  return (
    <Card title="Tasks & Reminders">
      <ul className="divide-y">
        {tasks.map((t,i)=> (<li key={i} className="py-2 flex items-center justify-between"><span>{t.title}</span><span className="text-xs text-gray-500">{t.due}</span></li>))}
      </ul>
    </Card>
  );
}

function QuickActions() {
  const Btn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className='', ...rest }) => (
    <button {...rest} className={`h-12 rounded-xl border bg-white shadow-card hover:shadow-lg-soft px-4 text-sm font-semibold ${className}`} />
  );
  return (
    <Card title="Quick Actions">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Btn>+ Create Request</Btn>
        <Btn>+ Add Vendor</Btn>
        <Btn>+ New Order</Btn>
        <Btn>📂 Upload Document</Btn>
      </div>
    </Card>
  );
}

function ReportsSnapshot() {
  const items = [
    { title:'Monthly Spend Report', hint:'Updated 2d ago' },
    { title:'Vendor Performance Report', hint:'Updated 5d ago' },
    { title:'Inventory Valuation Report', hint:'Updated 1d ago' },
  ];
  return (
    <Card title="Custom Reports Snapshot">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {items.map(it=> (
          <div key={it.title} className="rounded-2xl border bg-white shadow-card p-3">
            <div className="text-sm font-semibold">{it.title}</div>
            <div className="text-xs text-gray-500">{it.hint}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
